import { serializeNode, SerializedNode } from './utils/serialization_utils';
import { getKey, getModel, API_BASE_URL, GeminiError } from './api_gemini';
import { PIPELINE_GENERATION_PROMPT } from './config/prompts';
import { PipelineSchema, Section, Column, Widget } from './types/pipeline.schema';
import { ElementorJSON, WPConfig } from './types/elementor.types';
import { ElementorCompiler } from './compiler/elementor.compiler';
import { ImageUploader } from './media/uploader';

/**
 * Pipeline de Conversão: Figma -> AI -> Schema -> Elementor
 */
export class ConversionPipeline {
    private apiKey: string | null = null;
    private model: string | null = null;

    private compiler: ElementorCompiler;
    private imageUploader: ImageUploader;

    constructor() {
        this.compiler = new ElementorCompiler();
        // Inicializa com config vazia, será atualizada no run
        this.imageUploader = new ImageUploader({});
    }

    /**
     * Executa o pipeline completo
     * @param node Nó raiz do Figma a ser convertido
     */
    async run(node: SceneNode, wpConfig: WPConfig = {}): Promise<ElementorJSON> {
        // 0. Configure Compiler & Uploader
        this.compiler.setWPConfig(wpConfig);
        this.imageUploader.setWPConfig(wpConfig);

        // 1. Setup
        await this.loadConfig();

        // 2. Extraction
        console.log('[Pipeline] 1. Extraindo dados do nó...');
        const serializedData = serializeNode(node);

        // 3. AI Processing
        console.log('[Pipeline] 2. Enviando para IA...');
        const intermediateSchema = await this.processWithAI(serializedData);

        // 4. Validation
        console.log('[Pipeline] 3. Validando schema...');
        this.validateSchema(intermediateSchema);

        // 4.1 Image Resolution (Upload to WP)
        console.log('[Pipeline] 3.1 Resolvendo imagens...');
        await this.resolveImages(intermediateSchema);

        // 5. Compilation
        console.log('[Pipeline] 4. Compilando para Elementor...');
        const elementorJson = this.compiler.compile(intermediateSchema);

        // Inject siteurl if available
        if (wpConfig.url) {
            elementorJson.siteurl = wpConfig.url;
        }

        return elementorJson;
    }

    private async loadConfig() {
        this.apiKey = await getKey();
        this.model = await getModel();
        if (!this.apiKey) {
            throw new Error("API Key não configurada. Por favor, configure na aba 'IA Gemini'.");
        }
    }

    /**
     * Envia os dados para a IA e retorna o Schema Intermediário
     */
    private async processWithAI(data: SerializedNode): Promise<PipelineSchema> {
        if (!this.apiKey || !this.model) throw new Error("Configuração de IA incompleta.");

        const endpoint = `${API_BASE_URL}${this.model}:generateContent?key=${this.apiKey}`;

        const systemPrompt = PIPELINE_GENERATION_PROMPT;

        const requestBody = {
            contents: [{
                parts: [
                    { text: systemPrompt },
                    { text: `DADOS DE ENTRADA:\n${JSON.stringify(data)}` }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
                response_mime_type: "application/json",
            }
        };

        let retries = 0;
        const maxRetries = 3;
        const baseDelay = 2000; // 2 seconds

        while (true) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    if (response.status === 429 && retries < maxRetries) {
                        const delay = baseDelay * Math.pow(2, retries);
                        console.warn(`[Pipeline] Rate limit exceeded (429). Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        retries++;
                        continue;
                    }

                    const err = await response.json();
                    throw new GeminiError(`Erro na API Gemini: ${err.error?.message || response.statusText}`);
                }

                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!text) throw new Error("Resposta vazia da IA.");

                // Limpeza básica de markdown se a IA desobedecer
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

                return JSON.parse(cleanText) as PipelineSchema;

            } catch (e: any) {
                if (retries >= maxRetries || (e instanceof GeminiError && !e.message.includes('429'))) {
                    console.error("Erro no processamento de IA:", e);
                    throw e;
                }
                // If it's a fetch error (network), we might also want to retry, but for now focusing on 429 logic inside the loop
                throw e;
            }
        }
    }

    /**
     * Valida o schema retornado pela IA
     */
    private validateSchema(schema: any): asserts schema is PipelineSchema {
        if (!schema || typeof schema !== 'object') throw new Error("Schema inválido: Não é um objeto.");
        if (!schema.page || !schema.sections) throw new Error("Schema inválido: Faltando 'page' ou 'sections'.");
        if (!Array.isArray(schema.sections)) throw new Error("Schema inválido: 'sections' deve ser um array.");

        // Validação básica de profundidade
        schema.sections.forEach((section: any, idx: number) => {
            if (!section.columns || !Array.isArray(section.columns)) {
                throw new Error(`Schema inválido na seção ${idx}: 'columns' ausente ou inválido.`);
            }
        });
    }

    /**
     * Percorre o schema e faz upload das imagens referenciadas
     */
    private async resolveImages(schema: PipelineSchema): Promise<void> {
        const processWidget = async (widget: Widget) => {
            // Se o widget tem um imageId (ID do nó Figma) e é do tipo que suporta imagem
            if (widget.imageId && (widget.type === 'image' || widget.type === 'imageBox' || widget.type === 'custom')) {
                try {
                    const node = figma.getNodeById(widget.imageId);
                    if (node && (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'RECTANGLE' || node.type === 'INSTANCE' || node.type === 'COMPONENT')) {
                        console.log(`[Pipeline] Uploading image for widget ${widget.type} (${widget.imageId})...`);
                        const result = await this.imageUploader.uploadToWordPress(node as SceneNode);

                        if (result) {
                            if (widget.type === 'image') {
                                widget.content = result.url;
                            } else {
                                // Para imageBox ou custom, guardamos a URL nos estilos para não sobrescrever o content (texto)
                                if (!widget.styles) widget.styles = {};
                                widget.styles.image_url = result.url;
                            }
                            widget.imageId = result.id.toString(); // Atualiza para o ID do WP
                        } else {
                            console.warn(`[Pipeline] Falha no upload da imagem ${widget.imageId}`);
                        }
                    }
                } catch (e) {
                    console.error(`[Pipeline] Erro ao processar imagem ${widget.imageId}:`, e);
                }
            }

            // Tratamento especial para ícones (se forem vetores complexos, exportar como SVG/Imagem)
            if (widget.type === 'icon' && widget.imageId) {
                // Lógica similar se quisermos exportar ícones como imagens
            }
        };

        // Percorre todas as seções e colunas
        for (const section of schema.sections) {
            for (const column of section.columns) {
                for (const widget of column.widgets) {
                    await processWidget(widget);
                }
            }
        }
    }
}


