import { serializeNode, SerializedNode } from './utils/serialization_utils';
import { geminiProvider } from './api_gemini';
import { ElementorCompiler } from './compiler/elementor.compiler';
import { ImageUploader } from './media/uploader';
import { PipelineSchema, PipelineContainer, PipelineWidget } from './types/pipeline.schema';
import { ElementorJSON, WPConfig } from './types/elementor.types';
import { validatePipelineSchema, validateElementorJSON, computeCoverage } from './utils/validation';
import { SchemaProvider } from './types/providers';
import { ANALYZE_RECREATE_PROMPT } from './config/prompts';

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
    private compiler: ElementorCompiler;
    private imageUploader: ImageUploader;

    constructor() {
        this.compiler = new ElementorCompiler();
        this.imageUploader = new ImageUploader({});
    }

    async run(
        node: SceneNode,
        wpConfig: WPConfig = {},
        options?: { debug?: boolean; provider?: SchemaProvider; apiKey?: string }
    ): Promise<ElementorJSON | { elementorJson: ElementorJSON; debugInfo: PipelineDebugInfo }> {
        this.compiler.setWPConfig(wpConfig);
        this.imageUploader.setWPConfig(wpConfig);

        const provider = options?.provider || geminiProvider;

        const preprocessed = this.preprocess(node);
        const schema = await this.generateSchema(preprocessed, provider, options?.apiKey);

        this.validateAndNormalize(schema, preprocessed.serializedRoot, preprocessed.tokens);
        validatePipelineSchema(schema);

        await this.resolveImages(schema);

        const elementorJson = this.compiler.compile(schema);
        if (wpConfig.url) elementorJson.siteurl = wpConfig.url;
        validateElementorJSON(elementorJson);

        if (options?.debug) {
            const coverage = computeCoverage(preprocessed.flatNodes, schema, elementorJson);
            const debugInfo: PipelineDebugInfo = {
                serializedTree: preprocessed.serializedRoot,
                flatNodes: preprocessed.flatNodes,
                schema,
                elementor: elementorJson,
                coverage
            };
            return { elementorJson, debugInfo };
        }

        return elementorJson;
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
            if (Array.isArray((n as any).children)) {
                (n as any).children.forEach((child: SerializedNode) => walk(child));
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

    private async generateSchema(pre: PreprocessedData, provider: SchemaProvider, apiKey?: string): Promise<PipelineSchema> {
        const prompt = ANALYZE_RECREATE_PROMPT.replace('${nodeData}', JSON.stringify(pre.serializedRoot, null, 2));
        const instructions = 'Gere o schema Flex do Elementor sem ignorar nenhum node. Preserve ordem, ids e preencha styles.sourceId.';

        const response = await provider.generateSchema({
            prompt,
            snapshot: pre.serializedRoot,
            instructions,
            apiKey
        });

        if (!response.ok || !response.schema) {
            throw new Error(response.message || 'IA nao retornou schema.');
        }

        return response.schema;
    }

    private validateAndNormalize(schema: any, root: SerializedNode, tokens: { primaryColor: string; secondaryColor: string }): asserts schema is PipelineSchema {
        if (!schema || typeof schema !== 'object') throw new Error('Schema invalido: nao e um objeto.');
        if (!schema.page) schema.page = { title: root.name, tokens };
        if (!schema.page.tokens) schema.page.tokens = tokens;
        if (!schema.page.title) schema.page.title = root.name;
        if (!Array.isArray(schema.containers)) schema.containers = [];
    }

    private async resolveImages(schema: PipelineSchema): Promise<void> {
        const processWidget = async (widget: PipelineWidget) => {
            if (widget.imageId && (widget.type === 'image' || widget.type === 'custom' || widget.type === 'icon')) {
                try {
                    const node = figma.getNodeById(widget.imageId);
                    if (node) {
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
}
