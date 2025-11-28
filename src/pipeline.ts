import { serializeNode, SerializedNode } from './utils/serialization_utils';
import { getKey, getModel, API_BASE_URL, GeminiError } from './api_gemini';
import { ElementorCompiler } from './compiler/elementor.compiler';
import { ImageUploader } from './media/uploader';
import { PipelineSchema, PipelineContainer, PipelineWidget } from './types/pipeline.schema';
import { ElementorJSON, WPConfig } from './types/elementor.types';
import { validatePipelineSchema, validateElementorJSON, computeCoverage } from './utils/validation';

/**
 * Prompt para o schema de containers (Flexbox).
 */
const PIPELINE_PROMPT_V3 = `
Você é um organizador de árvore Figma para um schema de CONTAINERS flex.

REGRAS:
- NÃO ignore nenhum node. Cada node vira container (se tiver filhos) ou widget (se folha).
- NÃO classifique por aparência. Se não souber, type = "custom".
- NÃO invente grids, colunas extras ou imageBox/iconBox.
- Preservar ordem dos filhos exatamente como a árvore original.
- Mapear layoutMode: HORIZONTAL -> direction=row, VERTICAL -> direction=column, NONE -> column.
- gap = itemSpacing (se houver).
- padding = paddingTop/Right/Bottom/Left (se houver).
- background: usar fills do node (cor/imagem/gradiente) se presentes.

SCHEMA:
{
  "page": { "title": "...", "tokens": { "primaryColor": "...", "secondaryColor": "..." } },
  "containers": [
    {
      "id": "string",
      "direction": "row" | "column",
      "width": "full" | "boxed",
      "styles": {},
      "widgets": [ ... ],
      "children": [ ... ]
    }
  ]
}

WIDGETS permitidos: heading | text | button | image | icon | custom

styles: incluir sempre "sourceId" com id do node original.

SAÍDA: JSON puro, sem markdown.
`;

interface PreprocessedData {
    pageTitle: string;
    tokens: { primaryColor: string; secondaryColor: string };
    serializedRoot: SerializedNode;
    flatNodes: SerializedNode[];
}

/**
 * Pipeline de Conversão: Figma -> IA -> Schema -> Elementor (containers flex)
 */
export interface PipelineDebugInfo {
    serializedTree: SerializedNode;
    flatNodes: SerializedNode[];
    schema: PipelineSchema;
    elementor: ElementorJSON;
    coverage: ReturnType<typeof computeCoverage>;
}

export class ConversionPipeline {
    private apiKey: string | null = null;
    private model: string | null = null;

    private compiler: ElementorCompiler;
    private imageUploader: ImageUploader;

    constructor() {
        this.compiler = new ElementorCompiler();
        this.imageUploader = new ImageUploader({});
    }

    async run(node: SceneNode, wpConfig: WPConfig = {}, options?: { debug?: boolean }): Promise<ElementorJSON | { elementorJson: ElementorJSON; debugInfo: PipelineDebugInfo }> {
        this.compiler.setWPConfig(wpConfig);
        this.imageUploader.setWPConfig(wpConfig);

        await this.loadConfig();

        console.log('[Pipeline] 1. Pré-processando nó...');
        const preprocessed = this.preprocess(node);

        console.log('[Pipeline] 2. Enviando para IA...');
        const intermediate = await this.processWithAI(preprocessed);

        console.log('[Pipeline] 3. Validando schema...');
        this.validateAndNormalize(intermediate);
        validatePipelineSchema(intermediate);

        console.log('[Pipeline] 4. Reconciliando nodes...');
        this.reconcileWithSource(intermediate, preprocessed.flatNodes);

        console.log('[Pipeline] 5. Resolvendo imagens...');
        await this.resolveImages(intermediate);

        console.log('[Pipeline] 6. Compilando para Elementor...');
        const elementorJson = this.compiler.compile(intermediate);
        if (wpConfig.url) elementorJson.siteurl = wpConfig.url;

        validateElementorJSON(elementorJson);

        if (options?.debug) {
            const coverage = computeCoverage(preprocessed.flatNodes, intermediate, elementorJson);
            const debugInfo: PipelineDebugInfo = {
                serializedTree: preprocessed.serializedRoot,
                flatNodes: preprocessed.flatNodes,
                schema: intermediate,
                elementor: elementorJson,
                coverage
            };
            return { elementorJson, debugInfo };
        }

        return elementorJson;
    }

    private async loadConfig(): Promise<void> {
        this.apiKey = await getKey();
        this.model = await getModel();
        if (!this.apiKey) throw new Error("API Key não configurada. Por favor, configure na aba 'IA Gemini'.");
        if (!this.model) throw new Error("Modelo do Gemini não configurado.");
    }

    private preprocess(node: SceneNode): PreprocessedData {
        const serializedRoot = serializeNode(node);
        const flatNodes = this.flatten(serializedRoot);
        const tokens = this.deriveTokens(serializedRoot);
        return {
            pageTitle: serializedRoot.name || 'Página importada',
            tokens,
            serializedRoot,
            flatNodes
        };
    }

    private flatten(root: SerializedNode): SerializedNode[] {
        const acc: SerializedNode[] = [];
        const walk = (n: SerializedNode) => {
            acc.push(n);
            if (Array.isArray(n.children)) {
                n.children.forEach((child: SerializedNode) => walk(child));
            }
        };
        walk(root);
        return acc;
    }

    private deriveTokens(serializedRoot: SerializedNode): { primaryColor: string; secondaryColor: string } {
        const defaultTokens = { primaryColor: '#000000', secondaryColor: '#FFFFFF' };
        const fills = (serializedRoot as any).fills;
        if (Array.isArray(fills) && fills.length > 0) {
            const solidFill = fills.find((f: any) => f.type === 'SOLID');
            if (solidFill?.color) {
                const { r, g, b } = solidFill.color;
                const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
                const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                return { primaryColor: hex, secondaryColor: '#FFFFFF' };
            }
        }
        return defaultTokens;
    }

    private async processWithAI(pre: PreprocessedData): Promise<PipelineSchema> {
        if (!this.apiKey || !this.model) throw new Error('Configuração de IA incompleta.');

        const endpoint = `${API_BASE_URL}${this.model}:generateContent?key=${this.apiKey}`;
        const inputPayload = {
            title: pre.pageTitle,
            tokens: pre.tokens,
            nodes: pre.flatNodes
        };

        const contents = [{
            parts: [
                { text: PIPELINE_PROMPT_V3 },
                { text: `DADOS DE ENTRADA:\n${JSON.stringify(inputPayload)}` }
            ]
        }];

        const requestBody = {
            contents,
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
                response_mime_type: 'application/json'
            }
        };

        const maxRetries = 2;
        let attempt = 0;
        while (attempt <= maxRetries) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new GeminiError(`Erro na API Gemini: ${response.status} - ${errText}`);
                }

                const result = await response.json();
                const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error('Resposta vazia da IA.');

                const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
                return JSON.parse(clean) as PipelineSchema;
            } catch (err) {
                attempt++;
                if (attempt > maxRetries) {
                    console.error('[Pipeline] Erro no processamento de IA:', err);
                    throw err;
                }
                const delay = 1500 * attempt;
                console.warn(`[Pipeline] Falha na IA (tentativa ${attempt}). Retentando em ${delay}ms...`);
                await new Promise(res => setTimeout(res, delay));
            }
        }

        throw new Error('Falha ao processar IA.');
    }

    private validateAndNormalize(schema: any): asserts schema is PipelineSchema {
        if (!schema || typeof schema !== 'object') throw new Error('Schema inválido: não é um objeto.');

        if (!schema.page || typeof schema.page !== 'object') throw new Error("Schema inválido: campo 'page' ausente.");
        if (typeof schema.page.title !== 'string') schema.page.title = String(schema.page.title || 'Página importada');
        if (!schema.page.tokens) schema.page.tokens = {};
        if (typeof schema.page.tokens.primaryColor !== 'string') schema.page.tokens.primaryColor = '#000000';
        if (typeof schema.page.tokens.secondaryColor !== 'string') schema.page.tokens.secondaryColor = '#FFFFFF';

        if (!Array.isArray(schema.containers)) {
            schema.containers = [];
        }
        if (schema.containers.length === 0) {
            schema.containers.push(this.createDefaultContainer());
        }

        schema.containers = schema.containers.map((container: any, index: number) =>
            this.normalizeContainer(container, index)
        );
    }

    private normalizeContainer(container: any, index: number): PipelineContainer {
        const normalizeWidget = (w: any): PipelineWidget => {
            const allowed: PipelineWidget['type'][] = ['heading', 'text', 'button', 'image', 'icon', 'custom'];
            const type: PipelineWidget['type'] = allowed.includes(w?.type) ? w.type : 'custom';
            const content = (typeof w?.content === 'string' || w?.content === null) ? w.content : null;
            const imageId = (typeof w?.imageId === 'string' || w?.imageId === null) ? w.imageId : null;
            const styles = (w && typeof w.styles === 'object' && !Array.isArray(w.styles)) ? w.styles : {};
            return { type, content, imageId, styles };
        };

        const direction: 'row' | 'column' = container?.direction === 'row' ? 'row' : 'column';
        const width: 'full' | 'boxed' = container?.width === 'boxed' ? 'boxed' : 'full';
        const styles = (container && typeof container.styles === 'object' && !Array.isArray(container.styles)) ? container.styles : {};
        const widgets = Array.isArray(container?.widgets) ? container.widgets.map(normalizeWidget) : [];
        const children = Array.isArray(container?.children)
            ? container.children.map((c: any, i: number) => this.normalizeContainer(c, i))
            : [];

        return {
            id: typeof container?.id === 'string' ? container.id : `container-${index + 1}`,
            direction,
            width,
            styles,
            widgets,
            children
        };
    }

    private reconcileWithSource(schema: PipelineSchema, flatNodes: SerializedNode[]): void {
        const allSourceIds = new Set(flatNodes.map(n => n.id));
        const covered = new Set<string>();

        const markCoveredWidget = (widget: PipelineWidget) => {
            const sourceId = widget.styles?.sourceId;
            if (typeof sourceId === 'string') covered.add(sourceId);
            if (typeof widget.imageId === 'string') covered.add(widget.imageId);
        };

        const walkContainer = (container: PipelineContainer) => {
            container.widgets.forEach(markCoveredWidget);
            container.children.forEach(walkContainer);
        };

        schema.containers.forEach(walkContainer);

        const missing = [...allSourceIds].filter(id => !covered.has(id));
        if (missing.length === 0) return;

        if (!schema.containers.length) {
            schema.containers.push(this.createDefaultContainer());
        }
        const target = schema.containers[0];

        missing.forEach(id => {
            const sourceNode = flatNodes.find(n => n.id === id);
            const widget: PipelineWidget = {
                type: 'custom',
                content: typeof sourceNode?.characters === 'string' ? sourceNode.characters : null,
                imageId: null,
                styles: {
                    sourceId: id,
                    sourceType: sourceNode?.type,
                    sourceName: sourceNode?.name
                }
            };
            target.widgets.push(widget);
        });
    }

    private async resolveImages(schema: PipelineSchema): Promise<void> {
        const processWidget = async (widget: PipelineWidget) => {
            if (widget.imageId && (widget.type === 'image' || widget.type === 'custom')) {
                try {
                    const node = figma.getNodeById(widget.imageId);
                    if (node && (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'RECTANGLE' || node.type === 'INSTANCE' || node.type === 'COMPONENT')) {
                        console.log(`[Pipeline] Uploading image for widget ${widget.type} (${widget.imageId})...`);
                        const result = await this.imageUploader.uploadToWordPress(node as SceneNode);
                        if (result) {
                            widget.content = result.url;
                            widget.imageId = result.id.toString();
                        } else {
                            console.warn(`[Pipeline] Falha no upload da imagem ${widget.imageId}`);
                        }
                    }
                } catch (e) {
                    console.error(`[Pipeline] Erro ao processar imagem ${widget.imageId}:`, e);
                }
            }
        };

        const walkContainer = async (container: PipelineContainer) => {
            for (const widget of container.widgets) {
                await processWidget(widget);
            }
            for (const child of container.children) {
                await walkContainer(child);
            }
        };

        for (const container of schema.containers) {
            await walkContainer(container);
        }
    }

    private createDefaultContainer(): PipelineContainer {
        return {
            id: 'container-1',
            direction: 'column',
            width: 'full',
            styles: {},
            widgets: [],
            children: []
        };
    }
}
