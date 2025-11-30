import { serializeNode, SerializedNode } from './utils/serialization_utils';
import { extractWidgetStyles, extractContainerStyles, buildHtmlFromSegments } from './utils/style_utils';
import { geminiProvider } from './api_gemini';
import { ElementorCompiler } from './compiler/elementor.compiler';
import { ImageUploader } from './media/uploader';
import { PipelineSchema, PipelineContainer, PipelineWidget } from './types/pipeline.schema';
import { ElementorJSON, WPConfig } from './types/elementor.types';
import { validatePipelineSchema, validateElementorJSON, computeCoverage } from './utils/validation';
import { SchemaProvider } from './types/providers';
import { ANALYZE_RECREATE_PROMPT, OPTIMIZE_SCHEMA_PROMPT } from './config/prompts';
import { convertToFlexSchema } from './pipeline/noai.parser';

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
    private autoFixLayout: boolean = false;

    constructor() {
        this.compiler = new ElementorCompiler();
        this.imageUploader = new ImageUploader({});
    }

    async run(
        node: SceneNode,
        wpConfig: WPConfig = {},
        options?: { debug?: boolean; provider?: SchemaProvider; apiKey?: string; autoFixLayout?: boolean }
    ): Promise<ElementorJSON | { elementorJson: ElementorJSON; debugInfo: PipelineDebugInfo }> {
        const normalizedWP = { ...wpConfig, password: (wpConfig as any)?.password || (wpConfig as any)?.token };
        this.compiler.setWPConfig(normalizedWP);
        this.imageUploader.setWPConfig(normalizedWP);

        const provider = options?.provider || geminiProvider;
        this.autoFixLayout = !!options?.autoFixLayout;

        const preprocessed = this.preprocess(node);
        const schema = await this.generateSchema(preprocessed, provider, options?.apiKey);

        this.validateAndNormalize(schema, preprocessed.serializedRoot, preprocessed.tokens);
        validatePipelineSchema(schema);

        this.hydrateStyles(schema, preprocessed.flatNodes);
        await this.resolveImages(schema, normalizedWP);

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

    public handleUploadResponse(id: string, result: any) {
        this.imageUploader.handleUploadResponse(id, result);
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
                const toHex = (c: number) => ('0' + Math.round(c * 255).toString(16)).slice(-2);
                const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                return { primaryColor: hex, secondaryColor: '#FFFFFF' };
            }
        }
        return defaultTokens;
    }

    private async generateSchema(pre: PreprocessedData, provider: SchemaProvider, apiKey?: string): Promise<PipelineSchema> {
        // 1. Generate Base Schema using Deterministic Algorithm (No-AI)
        console.log('Generating Base Schema (Algorithm)...');
        const baseSchema = convertToFlexSchema(pre.serializedRoot);

        // 2. Optimize Schema using AI
        console.log('Optimizing Schema (AI)...');
        const prompt = `${OPTIMIZE_SCHEMA_PROMPT}

SCHEMA BASE:
${JSON.stringify(baseSchema, null, 2)}
`;

        try {
            const response = await provider.generateSchema({
                prompt,
                snapshot: pre.serializedRoot,
                instructions: 'Otimize o schema JSON fornecido mantendo IDs e dados.',
                apiKey
            });

            if (!response.ok || !response.schema) {
                console.warn('AI returned invalid response. Falling back to base schema.', response.message);
                return baseSchema;
            }

            return response.schema;
        } catch (error) {
            console.error('AI Optimization failed:', error);
            console.warn('Falling back to Base Schema.');
            return baseSchema;
        }
    }

    private validateAndNormalize(schema: any, root: SerializedNode, tokens: { primaryColor: string; secondaryColor: string }): asserts schema is PipelineSchema {
        if (!schema || typeof schema !== 'object') throw new Error('Schema invalido: nao e um objeto.');
        if (!schema.page) schema.page = { title: root.name, tokens };
        if (!schema.page.tokens) schema.page.tokens = tokens;
        if (!schema.page.title) schema.page.title = root.name;
        if (!Array.isArray(schema.containers)) schema.containers = [];
        schema.containers = this.normalizeContainers(schema.containers);
    }

    private async resolveImages(schema: PipelineSchema, wpConfig: WPConfig): Promise<void> {
        const uploadEnabled = !!(wpConfig && wpConfig.url && (wpConfig as any).user && ((wpConfig as any).password || (wpConfig as any).token) && (wpConfig as any).exportImages);
        if (!uploadEnabled) return;

        const isVectorNode = (n: SceneNode) =>
            n.type === 'VECTOR' || n.type === 'STAR' || n.type === 'ELLIPSE' ||
            n.type === 'POLYGON' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE';

        const hasVectorChildren = (n: SceneNode): boolean => {
            if (isVectorNode(n)) return true;
            if ('children' in n) {
                return n.children.some(c => hasVectorChildren(c));
            }
            return false;
        };

        const uploadNodeImage = async (nodeId: string, preferSvg: boolean = false) => {
            const node = figma.getNodeById(nodeId);
            if (!node) return null;
            let format: any = preferSvg ? 'SVG' : 'WEBP';
            if (('locked' in node && (node as any).locked) || hasVectorChildren(node as SceneNode)) {
                format = 'SVG';
            }
            return this.imageUploader.uploadToWordPress(node as SceneNode, format);
        };

        const processWidget = async (widget: PipelineWidget) => {
            // Widgets simples com imageId
            if (widget.imageId && (widget.type === 'image' || widget.type === 'custom' || widget.type === 'icon' || widget.type === 'image-box' || widget.type === 'icon-box')) {
                try {
                    const result = await uploadNodeImage(widget.imageId, widget.type === 'icon' || widget.type === 'icon-box');
                    if (result) {
                        if (widget.type === 'image-box') {
                            if (!widget.styles) widget.styles = {};
                            widget.styles.image_url = result.url;
                            // Keep widget.content as Title
                        } else if (widget.type === 'icon-box') {
                            if (!widget.styles) widget.styles = {};
                            widget.styles.selected_icon = { value: result.url, library: 'svg' };
                            // Keep widget.content as Title
                        } else {
                            widget.content = result.url;
                        }
                        widget.imageId = result.id.toString();
                    }
                } catch (e) {
                    console.error(`[Pipeline] Erro ao processar imagem ${widget.imageId}:`, e);
                }
            }

            // Carrosseis: preencher slides com URLs/IDs do WP
            if (widget.type === 'image-carousel' && widget.styles?.slides && Array.isArray(widget.styles.slides)) {
                const uploads = widget.styles.slides.map(async (slide: any, idx: number) => {
                    if (!slide?.id) return;
                    try {
                        const result = await uploadNodeImage(slide.id, false);
                        if (result) {
                            slide.url = result.url;
                            const parsedId = parseInt(String(result.id), 10);
                            slide.id = isNaN(parsedId) ? '' : parsedId;
                            slide._id = slide._id || `slide_${idx + 1}`;
                            slide.image = { url: slide.url, id: slide.id };
                        }
                    } catch (e) {
                        console.error(`[Pipeline] Erro ao processar slide ${slide.id}:`, e);
                    }
                });
                await Promise.all(uploads);
            }
        };

        const uploadPromises: Promise<void>[] = [];

        const collectUploads = (container: PipelineContainer) => {
            if (container.widgets) {
                for (const widget of container.widgets) {
                    uploadPromises.push(processWidget(widget));
                }
            }
            if (container.children) {
                for (const child of container.children) {
                    collectUploads(child);
                }
            }
        };

        if (schema.containers) {
            for (const container of schema.containers) {
                collectUploads(container);
            }
        }

        if (uploadPromises.length > 0) {
            await Promise.all(uploadPromises);
        }
    }

    private hydrateStyles(schema: PipelineSchema, flatNodes: SerializedNode[]): void {
        const nodeMap = new Map(flatNodes.map(n => [n.id, n]));

        const processContainer = (container: PipelineContainer) => {
            // Hydrate Container Styles
            if (container.styles?.sourceId) {
                const node = nodeMap.get(container.styles.sourceId);
                if (node) {
                    const realStyles = extractContainerStyles(node);
                    // Merge: AI styles override real styles? No, real styles should be truth for visual properties.
                    // But AI might have set layout direction.
                    // Let's merge realStyles INTO container.styles, preserving existing keys if they are structural,
                    // but ensuring visual fidelity.
                    container.styles = { ...container.styles, ...realStyles };

                    // Also enforce direction/gap if needed, but AI usually handles structure. 
                    // Let's trust AI for structure (direction) but enforce visual (border, background, padding).
                    if (realStyles.paddingTop !== undefined) container.styles.paddingTop = realStyles.paddingTop;
                    if (realStyles.paddingRight !== undefined) container.styles.paddingRight = realStyles.paddingRight;
                    if (realStyles.paddingBottom !== undefined) container.styles.paddingBottom = realStyles.paddingBottom;
                    if (realStyles.paddingLeft !== undefined) container.styles.paddingLeft = realStyles.paddingLeft;
                    if (realStyles.gap !== undefined) container.styles.gap = realStyles.gap;
                }
            }

            // Process Widgets
            if (container.widgets) {
                for (const widget of container.widgets) {
                    if (widget.styles?.sourceId) {
                        const node = nodeMap.get(widget.styles.sourceId);
                        if (node) {
                            const realStyles = extractWidgetStyles(node);
                            widget.styles = { ...widget.styles, ...realStyles };

                            // Force correct type for Images and Icons if AI hallucinated HTML/Text
                            if (node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'POLYGON' || node.type === 'ELLIPSE') {
                                if (widget.type !== 'icon' && widget.type !== 'image') {
                                    widget.type = 'icon';
                                    widget.imageId = node.id; // Ensure ID is set for uploader
                                }
                            } else if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
                                // Check for image fills
                                const hasImage = (node as any).fills?.some((f: any) => f.type === 'IMAGE');
                                if (hasImage && widget.type !== 'image') {
                                    widget.type = 'image';
                                    widget.imageId = node.id;
                                }
                            }

                            // Rich Text / Custom CSS override
                            if (node.type === 'TEXT' && (widget.type === 'heading' || widget.type === 'text')) {
                                if (node.styledTextSegments && node.styledTextSegments.length > 1) {
                                    const rich = buildHtmlFromSegments(node);
                                    widget.content = rich.html;
                                    widget.styles.customCss = rich.css;
                                } else {
                                    // Ensure content is up to date with node if it's simple text
                                    // (Optional, AI might have summarized it, but usually we want exact text)
                                    widget.content = (node as any).characters || node.name;
                                }
                            }
                        }
                    }
                }
            }

            // Recurse
            if (container.children) {
                for (const child of container.children) {
                    processContainer(child);
                }
            }
        };

        if (schema.containers) {
            for (const c of schema.containers) {
                processContainer(c);
            }
        }
    }

    private normalizeContainers(containers: PipelineContainer[]): PipelineContainer[] {
        const logWarn = (message: string) => {
            try {
                figma.ui.postMessage({ type: 'log', level: 'warn', message });
            } catch {
                // ignore logging failures in pipeline
            }
        };

        const walk = (c: PipelineContainer, parent: PipelineContainer | null): PipelineContainer | null => {
            if (!c.id) {
                logWarn('[AutoFix] Container sem id detectado. Ignorado para evitar quebra.');
                return null;
            }

            const node = figma.getNodeById(c.id) as any;
            const layoutMode = node?.layoutMode;
            const type = node?.type;
            const isFrameLike = type === 'FRAME' || type === 'GROUP' || type === 'COMPONENT' || type === 'INSTANCE';
            const hasAutoLayout = layoutMode === 'HORIZONTAL' || layoutMode === 'VERTICAL';
            const looksInvalidContainer = (!hasAutoLayout && node) || (!isFrameLike && node);

            if (looksInvalidContainer) {
                logWarn(`[AutoFix] Node ${c.id} (${node?.name || 'container'}) nao tem auto layout ou tipo invalido (${type}).`);
                if (!this.autoFixLayout) {
                    logWarn(`[AutoFix] Correção desativada. Ative "auto_fix_layout" para aplicar fallback.`);
                } else {
                    if (!isFrameLike || type === 'RECTANGLE' || type === 'VECTOR' || type === 'TEXT') {
                        // Converter para widget custom dentro do pai
                        if (parent) {
                            parent.widgets = parent.widgets || [];
                            parent.widgets.push({
                                type: 'custom',
                                content: (node as any)?.characters || null,
                                imageId: null,
                                styles: { sourceId: c.id, sourceName: node?.name }
                            });
                            if (Array.isArray(c.widgets)) parent.widgets.push(...c.widgets);
                            if (Array.isArray(c.children)) parent.children.push(...c.children);
                            return null;
                        }
                        // se root, mantém mas como column
                        c.direction = 'column';
                    } else {
                        // frame sem auto layout: aplica fallback flex column
                        c.direction = 'column';
                        logWarn(`[AutoFix] Aplicado fallback: container ${c.id} forçado para flex column.`);
                    }
                }
            }

            if (c.direction !== 'row' && c.direction !== 'column') {
                c.direction = 'column';
                logWarn(`[AI] Container ${c.id} sem direction valido. Ajustado para 'column'.`);
            }
            if (!c.width) c.width = 'full';
            if (!Array.isArray(c.widgets)) c.widgets = [];
            if (!Array.isArray(c.children)) c.children = [];
            c.children = c.children.map(child => walk(child as any, c)).filter(Boolean) as PipelineContainer[];
            if (c.children && c.children.length > 0) {
                c.children = this.deduplicateContainers(c.children);
            }
            return c;
        };

        return containers.map(c => walk(c, null)).filter(Boolean) as PipelineContainer[];
    }
}
