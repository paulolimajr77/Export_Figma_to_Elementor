import { serializeNode, SerializedNode } from './utils/serialization_utils';
import { getKey, getModel, API_BASE_URL, GeminiError } from './api_gemini';
import { ElementorCompiler } from './compiler/elementor.compiler';
import { ImageUploader } from './media/uploader';
import { PipelineSchema, PipelineContainer, PipelineWidget } from './types/pipeline.schema';
import { ElementorJSON, WPConfig } from './types/elementor.types';
import { validatePipelineSchema, validateElementorJSON, computeCoverage } from './utils/validation';

const PIPELINE_PROMPT_V3 = `
Voce e um organizador de arvore Figma para um schema de CONTAINERS flex.

REGRAS:
- NAO ignore nenhum node. Cada node vira container (se tiver filhos) ou widget (se folha).
- NAO classifique por aparencia. Se nao souber, type = "custom".
- NAO invente grids, colunas extras ou imageBox/iconBox.
- Preservar ordem dos filhos exatamente como a arvore original.
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
SAIDA: JSON puro, sem markdown.
`;

interface PreprocessedData {
    pageTitle: string;
    tokens: { primaryColor: string; secondaryColor: string };
    serializedRoot: SerializedNode;
    flatNodes: SerializedNode[];
}

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

        const preprocessed = this.preprocess(node);
        const intermediate = await this.processWithAI(preprocessed);

        this.validateAndNormalize(intermediate, preprocessed.serializedRoot);
        validatePipelineSchema(intermediate);

        this.reconcileWithSource(intermediate, preprocessed.flatNodes);
        await this.resolveImages(intermediate);

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
        if (!this.apiKey) throw new Error("API Key nao configurada. Configure na aba IA.");
        if (!this.model) throw new Error('Modelo do Gemini nao configurado.');
    }

    private preprocess(node: SceneNode): PreprocessedData {
        const serializedRoot = serializeNode(node);
        const flatNodes = this.flatten(serializedRoot);
        const tokens = this.deriveTokens(serializedRoot);
        return {
            pageTitle: serializedRoot.name || 'Pagina importada',
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
        if (!this.apiKey || !this.model) throw new Error('Configuracao de IA incompleta.');

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
                    throw err;
                }
                const delay = 1500 * attempt;
                await new Promise(res => setTimeout(res, delay));
            }
        }

        throw new Error('Falha ao processar IA.');
    }

    private validateAndNormalize(schema: any, root: SerializedNode): asserts schema is PipelineSchema {
        if (!schema || typeof schema !== 'object') throw new Error('Schema invalido: nao e um objeto.');

        if (!schema.page || typeof schema.page !== 'object') schema.page = {};
        if (typeof schema.page.title !== 'string') schema.page.title = String(schema.page.title || 'Pagina importada');
        if (!schema.page.tokens) schema.page.tokens = {};
        if (typeof schema.page.tokens.primaryColor !== 'string') schema.page.tokens.primaryColor = '#000000';
        if (typeof schema.page.tokens.secondaryColor !== 'string') schema.page.tokens.secondaryColor = '#FFFFFF';

        if (!Array.isArray(schema.containers) || schema.containers.length === 0) {
            schema.containers = [this.createContainerFromSerialized(root, 0)];
        }

        schema.containers = schema.containers.map((container: any, index: number) =>
            this.normalizeContainer(container, index)
        );
    }

    private normalizeContainer(container: any, index: number): PipelineContainer {
        const normalizeWidget = (w: any, idx: number): PipelineWidget => {
            const allowed: PipelineWidget['type'][] = ['heading', 'text', 'button', 'image', 'icon', 'custom'];
            const type: PipelineWidget['type'] = allowed.includes(w?.type) ? w.type : 'custom';
            const content = (typeof w?.content === 'string' || w?.content === null) ? w.content : null;
            const imageId = (typeof w?.imageId === 'string' || w?.imageId === null) ? w.imageId : null;
            const styles = (w && typeof w.styles === 'object' && !Array.isArray(w.styles)) ? { ...w.styles } : {};
            if (!styles.sourceId && typeof w?.sourceId === 'string') styles.sourceId = w.sourceId;
            if (!styles.sourceId) styles.sourceId = `widget-${index}-${idx}`;
            return { type, content, imageId, styles, kind: w?.kind };
        };

        const direction: 'row' | 'column' = container?.direction === 'row' ? 'row' : 'column';
        const width: 'full' | 'boxed' = container?.width === 'boxed' ? 'boxed' : 'full';
        const styles = (container && typeof container.styles === 'object' && !Array.isArray(container.styles)) ? { ...container.styles } : {};
        if (!styles.sourceId && typeof container?.id === 'string') styles.sourceId = container.id;

        const widgets = Array.isArray(container?.widgets) ? container.widgets.map((w: any, idx: number) => normalizeWidget(w, idx)) : [];
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
        const containerMap = new Map<string, PipelineContainer>();

        const markCoveredWidget = (widget: PipelineWidget) => {
            const sourceId = widget.styles?.sourceId;
            if (typeof sourceId === 'string') covered.add(sourceId);
        };

        const walkContainer = (container: PipelineContainer) => {
            const sourceId = container.styles?.sourceId;
            if (typeof sourceId === 'string') {
                covered.add(sourceId);
                containerMap.set(sourceId, container);
            }
            container.widgets.forEach(markCoveredWidget);
            container.children.forEach(walkContainer);
        };

        schema.containers.forEach(walkContainer);

        const missing = [...allSourceIds].filter(id => !covered.has(id));
        if (missing.length === 0) return;

        const rootContainer = schema.containers[0] || this.createContainerFromSerialized(flatNodes[0], 0);

        const nodeById = new Map<string, SerializedNode>();
        flatNodes.forEach(n => nodeById.set(n.id, n));

        const ensureParentContainer = (parentId?: string | null): PipelineContainer => {
            if (parentId && containerMap.has(parentId)) return containerMap.get(parentId)!;
            return rootContainer;
        };

        const createWidgetFromNode = (node: SerializedNode): PipelineWidget => {
            const map: Record<string, PipelineWidget['type']> = {
                TEXT: 'text',
                VECTOR: 'icon',
                STAR: 'icon',
                ELLIPSE: 'icon',
                RECTANGLE: 'image',
                LINE: 'icon'
            };
            const type = map[node.type] || 'custom';
            const content = typeof (node as any).characters === 'string' ? (node as any).characters : null;
            return {
                type,
                content,
                imageId: node.id,
                styles: {
                    sourceId: node.id,
                    sourceType: node.type,
                    sourceName: node.name
                },
                kind: undefined
            };
        };

        const createContainerFromNode = (node: SerializedNode): PipelineContainer => {
            const direction: 'row' | 'column' = node.layoutMode === 'HORIZONTAL' || node.direction === 'row' ? 'row' : 'column';
            const styles: Record<string, any> = {
                sourceId: node.id,
                sourceType: node.type,
                sourceName: node.name,
                gap: (node as any).itemSpacing,
                paddingTop: (node as any).paddingTop,
                paddingRight: (node as any).paddingRight,
                paddingBottom: (node as any).paddingBottom,
                paddingLeft: (node as any).paddingLeft,
                primaryAxisAlignItems: (node as any).primaryAxisAlignItems,
                counterAxisAlignItems: (node as any).counterAxisAlignItems
            };
            return {
                id: `container-${node.id}`,
                direction,
                width: 'full',
                styles,
                widgets: [],
                children: []
            };
        };

        missing.forEach(id => {
            const sourceNode = nodeById.get(id);
            if (!sourceNode) return;
            const parent = ensureParentContainer((sourceNode as any).parentId as string | undefined);
            if (Array.isArray((sourceNode as any).children) && (sourceNode as any).children.length > 0) {
                const newContainer = createContainerFromNode(sourceNode);
                parent.children.push(newContainer);
                containerMap.set(sourceNode.id, newContainer);
                covered.add(sourceNode.id);
            } else {
                const widget = createWidgetFromNode(sourceNode);
                parent.widgets.push(widget);
                covered.add(sourceNode.id);
            }
        });
    }

    private async resolveImages(schema: PipelineSchema): Promise<void> {
        const processWidget = async (widget: PipelineWidget) => {
            if (widget.imageId && (widget.type === 'image' || widget.type === 'custom')) {
                try {
                    const node = figma.getNodeById(widget.imageId);
                    if (node && (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'RECTANGLE' || node.type === 'INSTANCE' || node.type === 'COMPONENT')) {
                        const result = await this.imageUploader.uploadToWordPress(node as SceneNode);
                        if (result) {
                            widget.content = result.url;
                            widget.imageId = result.id.toString();
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

    private createContainerFromSerialized(node: SerializedNode, index: number): PipelineContainer {
        const direction: 'row' | 'column' = (node as any).layoutMode === 'HORIZONTAL' || (node as any).direction === 'row' ? 'row' : 'column';
        const styles: Record<string, any> = {
            sourceId: node.id,
            sourceType: node.type,
            sourceName: node.name,
            gap: (node as any).itemSpacing,
            paddingTop: (node as any).paddingTop,
            paddingRight: (node as any).paddingRight,
            paddingBottom: (node as any).paddingBottom,
            paddingLeft: (node as any).paddingLeft,
            primaryAxisAlignItems: (node as any).primaryAxisAlignItems,
            counterAxisAlignItems: (node as any).counterAxisAlignItems
        };

        const children: PipelineContainer[] = [];
        const widgets: PipelineWidget[] = [];
        if (Array.isArray((node as any).children)) {
            (node as any).children.forEach((child: SerializedNode) => {
                if ((child as any).children && (child as any).children.length > 0) {
                    children.push(this.createContainerFromSerialized(child, children.length));
                } else {
                    const widget: PipelineWidget = {
                        type: child.type === 'TEXT' ? 'text' : child.type === 'RECTANGLE' ? 'image' : 'custom',
                        content: typeof (child as any).characters === 'string' ? (child as any).characters : null,
                        imageId: child.type === 'RECTANGLE' ? child.id : null,
                        styles: { sourceId: child.id, sourceType: child.type, sourceName: child.name }
                    };
                    widgets.push(widget);
                }
            });
        }

        return {
            id: typeof node.id === 'string' ? node.id : `container-${index + 1}`,
            direction,
            width: 'full',
            styles,
            widgets,
            children
        };
    }
}
