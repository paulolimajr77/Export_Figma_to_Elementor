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
import { referenceDocs } from './reference_docs';
import { evaluateNode, DEFAULT_HEURISTICS } from './heuristics/index';
import { createNodeSnapshot } from './heuristics/adapter';

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
    private autoRename: boolean = false;

    constructor() {
        this.compiler = new ElementorCompiler();
        this.imageUploader = new ImageUploader({});
    }

    async run(
        node: SceneNode,
        wpConfig: WPConfig = {},
        options?: { debug?: boolean; provider?: SchemaProvider; apiKey?: string; autoFixLayout?: boolean; includeScreenshot?: boolean; includeReferences?: boolean; autoRename?: boolean }
    ): Promise<ElementorJSON | { elementorJson: ElementorJSON; debugInfo: PipelineDebugInfo }> {
        const normalizedWP = { ...wpConfig, password: (wpConfig as any)?.password || (wpConfig as any)?.token };
        this.compiler.setWPConfig(normalizedWP);
        this.imageUploader.setWPConfig(normalizedWP);

        const provider = options?.provider || geminiProvider;
        this.autoFixLayout = !!options?.autoFixLayout;
        this.autoRename = !!options?.autoRename;

        const preprocessed = this.preprocess(node);
        const screenshot = options?.includeScreenshot === false ? null : await this.captureNodeImage(preprocessed.serializedRoot.id);
        const schema = await this.generateSchema(preprocessed, provider, options?.apiKey, {
            includeReferences: options?.includeReferences !== false,
            screenshot
        });

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

    private async captureNodeImage(nodeId?: string): Promise<{ data: string; mimeType: string; name?: string; width?: number; height?: number } | null> {
        if (!nodeId) return null;
        const node = figma.getNodeById(nodeId);
        if (!node || !('exportAsync' in node)) return null;
        try {
            const bytes = await (node as ExportMixin).exportAsync({ format: 'PNG' });
            const base64 = this.uint8ToBase64(bytes);
            const name = (node as any).name || 'frame';
            const size = (node as any).width && (node as any).height ? { width: (node as any).width as number, height: (node as any).height as number } : {};
            return { data: base64, mimeType: 'image/png', name, ...size };
        } catch (err) {
            console.warn('Falha ao exportar imagem do frame:', err);
            return null;
        }
    }

    private uint8ToBase64(bytes: Uint8Array): string {
        const base64abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '', i;
        const l = bytes.length;
        for (i = 2; i < l; i += 3) {
            result += base64abc[bytes[i - 2] >> 2];
            result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
            result += base64abc[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
            result += base64abc[bytes[i] & 0x3f];
        }
        if (i === l + 1) {
            result += base64abc[bytes[i - 2] >> 2];
            result += base64abc[((bytes[i - 2] & 0x03) << 4)];
            result += '==';
        } else if (i === l) {
            result += base64abc[bytes[i - 2] >> 2];
            result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
            result += base64abc[(bytes[i - 1] & 0x0f) << 2];
            result += '=';
        }
        return result;
    }

    private async generateSchema(
        pre: PreprocessedData,
        provider: SchemaProvider,
        apiKey?: string,
        extras?: { includeReferences?: boolean; screenshot?: { data: string; mimeType: string; name?: string; width?: number; height?: number } | null }
    ): Promise<PipelineSchema> {
        // 1. Generate Base Schema using Deterministic Algorithm (No-AI)
        console.log('Generating Base Schema (Algorithm)...');
        const baseSchema = convertToFlexSchema(pre.serializedRoot);

        // 2. Optimize Schema using AI
        console.log('Optimizing Schema (AI)...');
        const prompt = `${OPTIMIZE_SCHEMA_PROMPT}

SCHEMA BASE:
${JSON.stringify(baseSchema, null, 2)}
`;

        const references = (extras?.includeReferences === false) ? [] : referenceDocs;

        try {
            const response = await provider.generateSchema({
                prompt,
                snapshot: pre.serializedRoot,
                instructions: 'Otimize o schema JSON fornecido mantendo IDs e dados.',
                apiKey,
                image: extras?.screenshot || undefined,
                references
            });

            if (!response.ok || !response.schema) {
                console.warn('AI returned invalid response. Falling back to base schema.', response.message);
                return baseSchema;
            }

            // 3. Merge AI schema into base schema, preservando estrutura 1:1
            const aiSchema = response.schema as PipelineSchema;
            const merged = this.mergeSchemas(baseSchema, aiSchema);
            return merged;
        } catch (error) {
            console.error('AI Optimization failed:', error);
            console.warn('Falling back to Base Schema.');
            return baseSchema;
        }
    }

    /**
     * Mescla o schema base (NO-AI) com o schema otimizado pela IA.
     *
     * Regras:
     * - A estrutura de containers (hierarquia e ids) é sempre a do baseSchema.
     * - A IA só pode sugerir estilos e widgets para containers existentes,
     *   casados por styles.sourceId ou id.
     * - Containers criados apenas pela IA (sem sourceId/id conhecido) são ignorados.
     */
    private mergeSchemas(baseSchema: PipelineSchema, aiSchema: PipelineSchema): PipelineSchema {
        const aiContainersBySource = new Map<string, PipelineContainer>();

        const collect = (c: PipelineContainer) => {
            const key = (c.styles as any)?.sourceId || c.id;
            if (key && !aiContainersBySource.has(key)) {
                aiContainersBySource.set(key, c);
            }
            (c.children || []).forEach(child => collect(child));
        };

        (aiSchema.containers || []).forEach(c => collect(c));

        const mergeContainer = (base: PipelineContainer): PipelineContainer => {
            const key = (base.styles as any)?.sourceId || base.id;
            const ai = key ? aiContainersBySource.get(key) : undefined;

            const merged: PipelineContainer = {
                ...base,
                styles: { ...(base.styles || {}) }
            };

            if (ai) {
                // Mescla estilos, preservando sourceId do base
                merged.styles = {
                    ...(ai.styles || {}),
                    ...(base.styles || {}),
                    sourceId: (base.styles as any)?.sourceId || (ai.styles as any)?.sourceId || base.id
                };

                // Se a IA definiu widgets para este container, usamos estes widgets
                if (Array.isArray(ai.widgets) && ai.widgets.length > 0) {
                    merged.widgets = ai.widgets.map(w => ({
                        ...w,
                        styles: {
                            ...(w.styles || {}),
                            sourceId: (w.styles as any)?.sourceId || (w as any).sourceId || (base.styles as any)?.sourceId || base.id
                        }
                    }));
                }
            }

            if (Array.isArray(base.children) && base.children.length > 0) {
                merged.children = base.children.map(child => mergeContainer(child));
            }

            return merged;
        };

        const mergedContainers = baseSchema.containers.map(c => mergeContainer(c));
        return {
            page: baseSchema.page,
            containers: mergedContainers
        };
    }

    private validateAndNormalize(schema: any, root: SerializedNode, tokens: { primaryColor: string; secondaryColor: string }): asserts schema is PipelineSchema {
        if (!schema || typeof schema !== 'object') throw new Error('Schema invalido: nao e um objeto.');
        if (!schema.page) schema.page = { title: root.name, tokens };
        if (!schema.page.tokens) schema.page.tokens = tokens;
        if (!schema.page.title) schema.page.title = root.name;
        if (!Array.isArray(schema.containers)) schema.containers = [];

        // ID Rehydration: Ensure AI-generated IDs match Figma IDs
        // This is critical for deduplication and rescue logic
        this.rehydrateIds(schema.containers, root);

        schema.containers = this.normalizeContainers(schema.containers);
    }

    private rehydrateIds(containers: PipelineContainer[], root: SerializedNode) {
        // Map of all Figma nodes by ID for quick lookup
        const nodeMap = new Map<string, SerializedNode>();
        const collectNodes = (n: SerializedNode) => {
            nodeMap.set(n.id, n);
            if ('children' in n && Array.isArray(n.children)) {
                n.children.forEach(collectNodes);
            }
        };
        collectNodes(root);

        const walk = (c: PipelineContainer) => {
            // If ID is missing or looks fake (not in map), try to recover from sourceId
            if (!c.id || !nodeMap.has(c.id)) {
                if (c.styles?.sourceId && nodeMap.has(c.styles.sourceId)) {
                    c.id = c.styles.sourceId;
                }
            }

            // Also fix widgets
            c.widgets?.forEach(w => {
                if (w.styles?.sourceId && nodeMap.has(w.styles.sourceId)) {
                    // Widgets don't strictly need ID on the object itself for pipeline, 
                    // but it helps if we ever need to reference them.
                    // Main thing is ensuring the container ID is correct.
                }
            });

            c.children?.forEach(walk);
        };

        containers.forEach(walk);
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

        // Deduplicate top-level containers by ID to prevent split/duplicate issues
        containers = this.deduplicateContainers(containers);

        const walk = (c: PipelineContainer, parent: PipelineContainer | null): PipelineContainer | null => {
            if (!c.id) {
                logWarn('[AutoFix] Container sem id detectado. Ignorado para evitar quebra.');
                return null;
            }

            // Deduplicate children before processing
            if (c.children && c.children.length > 0) {
                c.children = this.deduplicateContainers(c.children);
            }

            const node = figma.getNodeById(c.id) as any;

            // --- HEURISTICS INTEGRATION ---
            if (node) {
                try {
                    const snapshot = createNodeSnapshot(node);
                    const results = evaluateNode(snapshot, DEFAULT_HEURISTICS);
                    const best = results[0];

                    if (best) {
                        // Auto-Rename Logic
                        if (this.autoRename && best.confidence > 0.6) {
                            try {
                                // Use the heuristic tag as the name (e.g. "w:button", "c:container")
                                // Avoid renaming if already named with a prefix or if it's a structure tag we don't want?
                                // For now, let's use the full tag.
                                const newName = best.widget;
                                // Only rename if it doesn't already have a semantic prefix or if we want to enforce it.
                                // Let's be safe: only rename if it doesn't start with w: or c:
                                if (!node.name.match(/^[wc]:/) && node.name !== newName) {
                                    node.name = newName;
                                }
                            } catch (e) {
                                // Ignore renaming errors (e.g. missing permissions)
                            }
                        }
                    }

                    // High confidence threshold to override AI/Default behavior
                    if (best && best.confidence >= 0.85) {
                        const widgetType = best.widget.split(':')[1]; // e.g. 'button', 'heading'
                        const prefix = best.widget.split(':')[0];

                        // Only convert "leaf" widgets (Buttons, Headings, Images, Icons)
                        // Structural widgets (columns, grid) are handled by container properties usually
                        const isLeafWidget = ['w', 'e', 'wp', 'woo'].includes(prefix) && !best.widget.includes('structure');

                        if (isLeafWidget && parent) {
                            // console.log(`[Heuristics] Detected ${best.widget} for ${node.name} (${best.confidence})`);

                            // Extract content
                            let content = node.name;
                            if (node.type === 'TEXT') content = node.characters;
                            else if (node.children) {
                                const textChild = node.children.find((child: any) => child.type === 'TEXT');
                                if (textChild) content = textChild.characters;
                            }

                            // Extract Image ID if applicable
                            let imageId = null;
                            if (widgetType === 'image' || widgetType === 'image-box') {
                                if (node.fills?.some((f: any) => f.type === 'IMAGE')) imageId = node.id;
                                else if (node.children) {
                                    const imgChild = node.children.find((child: any) => child.type === 'VECTOR' || child.type === 'RECTANGLE' || child.type === 'ELLIPSE'); // Simplified
                                    if (imgChild) imageId = imgChild.id;
                                }
                            }

                            parent.widgets = parent.widgets || [];
                            parent.widgets.push({
                                type: widgetType,
                                content: content,
                                imageId: imageId,
                                styles: { sourceId: c.id, sourceName: node.name }
                            });
                            return null; // Remove this container as it is now a widget
                        }
                    }
                } catch (err) {
                    console.warn('[Heuristics] Error evaluating node:', err);
                }
            }
            // ------------------------------
            // Fallback to schema properties if node is missing (AI generated/modified)
            const layoutMode = node?.layoutMode || (c as any).layoutMode;
            const type = node?.type || (c as any).type;
            const name = node?.name || (c as any).name;

            const isFrameLike = type === 'FRAME' || type === 'GROUP' || type === 'COMPONENT' || type === 'INSTANCE' || type === 'SECTION';
            const hasAutoLayout = layoutMode === 'HORIZONTAL' || layoutMode === 'VERTICAL';

            // If node is missing, we trust the schema. If it's not a frame-like or has no auto-layout, it's likely a widget candidate.
            const looksInvalidContainer = (!hasAutoLayout) || (!isFrameLike);

            if (looksInvalidContainer) {
                // logWarn(`[AutoFix] Node ${c.id} (${name || 'container'}) nao tem auto layout ou tipo invalido (${type}).`);
                if (!this.autoFixLayout) {
                    logWarn(`[AutoFix] Correção desativada. Ative "auto_fix_layout" para aplicar fallback.`);
                } else {
                    if (!isFrameLike || type === 'RECTANGLE' || type === 'VECTOR' || type === 'TEXT') {
                        // Converter para widget custom dentro do pai
                        if (parent) {
                            parent.widgets = parent.widgets || [];
                            parent.widgets.push({
                                type: 'custom',
                                content: (node as any)?.characters || (c as any).characters || name || null,
                                imageId: null,
                                styles: { sourceId: c.id, sourceName: node?.name }
                            });
                            // if (Array.isArray(c.widgets)) parent.widgets.push(...c.widgets);
                            // if (Array.isArray(c.children)) parent.children.push(...c.children);
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
                // Only warn if it has children containers, otherwise it's likely a leaf wrapper
                if (c.children && c.children.length > 0) {
                    logWarn(`[AI] Container ${c.id} sem direction valido. Ajustado para 'column'.`);
                }
            }
            if (!c.width) {
                c.width = 'full';
            } else if (typeof c.width === 'number') {
                // Fix: Convert numeric width to boxed + style
                c.styles = c.styles || {};
                c.styles.width = c.width;
                c.width = 'boxed';
                // logWarn(`[AutoFix] Container ${c.id} width numerico (${c.styles.width}) convertido para boxed.`);
            } else if (c.width !== 'full' && c.width !== 'boxed') {
                logWarn(`[AI] Container ${c.id} com width invalido (${String(c.width)}). Ajustado para 'full'.`);
                c.width = 'full';
            }
            if (!Array.isArray(c.widgets)) c.widgets = [];
            c.widgets.forEach(w => this.normalizeWidget(w));
            if (!Array.isArray(c.children)) c.children = [];
            c.children = c.children.map(child => walk(child as any, c)).filter(Boolean) as PipelineContainer[];

            // Rescue Missing Children (Safety Net for AI omissions)
            if (node && 'children' in node) {
                // Recursively collect all IDs present in the current schema subtree
                const collectIds = (container: PipelineContainer, ids: Set<string>) => {
                    if (container.id) ids.add(container.id);
                    container.widgets?.forEach(w => {
                        if (w.styles?.sourceId) ids.add(w.styles.sourceId);
                        if (w.imageId) ids.add(w.imageId);
                    });
                    container.children?.forEach(child => collectIds(child, ids));
                };

                const existingIds = new Set<string>();
                collectIds(c, existingIds);

                for (const child of node.children) {
                    if (!existingIds.has(child.id) && child.visible) {
                        // Log rescue (optional, good for debugging)
                        // console.log(`[Rescue] Rescuing missing node: ${child.name} (${child.type})`);

                        if (child.type === 'TEXT') {
                            c.widgets.push({
                                type: 'heading', // Default to heading/text
                                content: (child as any).characters,
                                imageId: null,
                                styles: {
                                    sourceId: child.id,
                                    sourceName: child.name,
                                    color: (child as any).fills?.[0]?.color ? this.rgbaToHex((child as any).fills[0].color) : undefined
                                }
                            });
                        } else if (child.type === 'FRAME' || child.type === 'GROUP' || child.type === 'INSTANCE' || child.type === 'RECTANGLE') {
                            // Create a basic container for the missing frame
                            const rescuedContainer: PipelineContainer = {
                                id: child.id,
                                direction: (child as any).layoutMode === 'HORIZONTAL' ? 'row' : 'column',
                                width: (child as any).layoutMode ? 'boxed' : 'full', // Guess
                                styles: { sourceId: child.id, sourceName: child.name },
                                widgets: [],
                                children: []
                            };
                            // Recurse to process this rescued container and its children
                            const processed = walk(rescuedContainer, c);
                            if (processed) c.children.push(processed);
                        }
                    }
                }
            }

            if (c.children && c.children.length > 0) {
                c.children = this.deduplicateContainers(c.children);
            }


            return c;
        };

        return containers.map(c => walk(c, null)).filter(Boolean) as PipelineContainer[];
    }


    private normalizeWidget(widget: PipelineWidget) {
        // Normalization for complex AI objects in image-box/icon-box
        if ((widget.type === 'image-box' || widget.type === 'icon-box') && widget.styles?.title_text && typeof widget.styles.title_text === 'object') {
            const tt = widget.styles.title_text as any;
            if (tt.imageId && !widget.imageId) widget.imageId = tt.imageId;
            if (tt.title) widget.content = tt.title;
            if (tt.description) widget.styles.description_text = tt.description;

            // Ensure title_text is a string for the compiler
            widget.styles.title_text = tt.title || '';
        }

        // Fallback: check if imageId is in styles.image.id (common AI pattern)
        if (widget.type === 'image-box' && !widget.imageId && widget.styles?.image?.id) {
            widget.imageId = widget.styles.image.id;
        }
    }

    private rgbaToHex(color: any): string {
        if (!color) return '#000000';
        const r = Math.round(color.r * 255);
        const g = Math.round(color.g * 255);
        const b = Math.round(color.b * 255);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    private deduplicateContainers(containers: PipelineContainer[]): PipelineContainer[] {
        const map = new Map<string, PipelineContainer>();
        const order: string[] = [];

        const resolveKey = (container: PipelineContainer) => container.styles?.sourceId || container.id;

        for (const c of containers) {
            if (!c.id) {
                continue; // Ignora containers sem ID
            }

            const key = resolveKey(c);
            if (!key) {
                // Se não tem key, adiciona diretamente usando o ID como chave
                if (!map.has(c.id)) {
                    map.set(c.id, { ...c, widgets: [...(c.widgets || [])], children: [...(c.children || [])] });
                    order.push(c.id);
                }
                continue;
            }

            if (!map.has(key)) {
                // Primeira ocorrência: adiciona normalmente
                map.set(key, { ...c, widgets: [...(c.widgets || [])], children: [...(c.children || [])] });
                order.push(key);
                continue;
            }

            // Container duplicado encontrado - preserva apenas a primeira ocorrência
            // Opcionalmente mescla styles se a duplicata tiver mais informações
            const existing = map.get(key)!;
            if (c.styles && existing.styles) {
                const existingStylesCount = Object.keys(existing.styles).length;
                const newStylesCount = Object.keys(c.styles).length;

                // Se a duplicata tem mais estilos, mescla-os (sem sobrescrever)
                if (newStylesCount > existingStylesCount) {
                    existing.styles = { ...existing.styles, ...c.styles };
                }
            } else if (c.styles && !existing.styles) {
                existing.styles = { ...c.styles };
            }

            // NÃO concatena widgets nem children - mantém apenas primeira ocorrência
            // Isso previne a duplicação de elementos no JSON final
        }

        return order.map(id => map.get(id)!);
    }

}
