import { serializeNode, SerializedNode } from './utils/serialization_utils'; // Force re-check
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

        // Sync nav-menus to WordPress via figtoel-remote-menus plugin
        await this.syncNavMenus(schema, preprocessed.serializedRoot, normalizedWP);

        // Debug: Show schema structure before elementor compilation
        console.log('[PIPELINE] Schema root container:', JSON.stringify({
            id: schema.containers[0]?.id,
            widgets: schema.containers[0]?.widgets?.length || 0,
            widgetTypes: schema.containers[0]?.widgets?.map(w => w.type) || [],
            children: schema.containers[0]?.children?.length || 0,
            childrenIds: schema.containers[0]?.children?.map(c => c.id) || []
        }, null, 2));

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
                // Marcar como otimizado
                (merged as any)._aiOptimized = true;

                // Mescla estilos, preservando sourceId do base
                merged.styles = {
                    ...(ai.styles || {}),
                    ...(base.styles || {}),
                    sourceId: (base.styles as any)?.sourceId || (ai.styles as any)?.sourceId || base.id
                };

                // Se a IA definiu widgets para este container, usamos estes widgets
                if (Array.isArray(ai.widgets)) { // Allow empty array to override
                    // SAFEGUARD: If base container has children with explicit 'w:' prefix OR are detected widgets,
                    // DO NOT allow AI to replace them with a single widget (like image-box) unless it's a wrapper.
                    const hasExplicitChildren = base.children?.some(c =>
                        (c.styles?.sourceName && (c.styles.sourceName.startsWith('w:') || c.styles.sourceName.startsWith('c:'))) ||
                        (c.widgets && c.widgets.length > 0)
                    );

                    // If explicit children exist, and AI tries to return widgets but NO children (collapse), 
                    // we might want to ignore AI widgets and keep base children structure.
                    const isCollapsing = (base.children?.length || 0) > 1 && ai.widgets.length === 1;
                    const isGenericWidget = ['image-box', 'icon-box'].includes(ai.widgets[0]?.type);

                    if (hasExplicitChildren && isCollapsing && isGenericWidget) {
                        console.warn(`[Merge] Preventing AI from collapsing explicit children of ${base.id} into ${ai.widgets[0].type}`);
                        // Ignore AI widgets, fall through to process base children
                    } else {
                        merged.widgets = ai.widgets.map(w => ({
                            ...w,
                            styles: {
                                ...(w.styles || {}),
                                sourceId: (w.styles as any)?.sourceId || (w as any).sourceId || (base.styles as any)?.sourceId || base.id
                            }
                        }));
                    }
                }

                // Se a IA definiu children, usamos estes. Essencial para remover filhos otimizados.
                if (Array.isArray(ai.children)) {
                    // SAFEGUARD: If base is identified as a specific widget (e.g. button), DO NOT allow AI to turn it into a container with children.
                    // This forces the use of the detected widget (e.g. w:button) instead of breaking it down.
                    const isBaseWidget = base.widgets?.some(w => ['button', 'video', 'image', 'icon'].includes(w.type));

                    if (isBaseWidget && ai.children.length > 0) {
                        console.warn(`[Merge] Ignoring AI children for widget-container ${base.id} (${base.widgets?.[0]?.type}). Keeping as widget.`);
                        // Do not process ai.children. The function will continue and likely use base.children or just the widget.
                        // If we have merged.widgets (from AI or Base), that's good.
                        // If AI didn't return widgets but returned children, we might need to fallback to base widgets.
                        if (!merged.widgets && base.widgets) {
                            merged.widgets = base.widgets;
                        }
                    } else {
                        merged.children = ai.children.map(child => mergeContainer(child));
                        // Early exit to prevent re-processing base.children
                        return merged;
                    }
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
            if (!nodeId) return null; // Adicionado para segurança
            const node = figma.getNodeById(nodeId);
            if (!node) return null;
            let format: any = preferSvg ? 'SVG' : 'WEBP';
            const hasImageChildren = (n: SceneNode): boolean => {
                if ('fills' in n && Array.isArray((n as any).fills)) {
                    if ((n as any).fills.some((f: any) => f.type === 'IMAGE')) return true;
                }
                if ('children' in n) {
                    return n.children.some(c => hasImageChildren(c));
                }
                return false;
            };

            if (('locked' in node && (node as any).locked)) {
                // Se trancado: prioridade para WebP se tiver imagem, senão SVG se tiver vetor
                if (hasImageChildren(node as SceneNode)) {
                    format = 'WEBP';
                } else if (hasVectorChildren(node as SceneNode)) {
                    format = 'SVG';
                } else {
                    // Trancado mas sem imagem nem vetor (ex: texto puro ou frame vazio)
                    // Mantém o default (WEBP)
                    format = 'WEBP';
                }
            } else if (hasVectorChildren(node as SceneNode)) {
                format = 'SVG';
            }
            // Adicionado log para debug de nós do tipo IMAGE
            // if (node.type === 'IMAGE') {
            //    console.warn(`[Pipeline] Tentando exportar nó do tipo IMAGE depreciado: ${node.name} (${node.id}). Isso pode falhar.`);
            // }
            return this.imageUploader.uploadToWordPress(node as SceneNode, format);
        };

        const processWidget = async (widget: PipelineWidget) => {

            // Widgets simples com imageId
            if (widget.imageId && (widget.type === 'image' || widget.type === 'custom' || widget.type === 'icon' || widget.type === 'image-box' || widget.type === 'icon-box' || widget.type === 'icon-list')) {
                try {
                    const result = await uploadNodeImage(widget.imageId, widget.type === 'icon' || widget.type === 'icon-box' || widget.type === 'icon-list');
                    if (result) {
                        if (widget.type === 'image-box') {
                            if (!widget.styles) widget.styles = {};
                            widget.styles.image_url = result.url;
                            // Keep widget.content as Title
                        } else if (widget.type === 'icon-box') {
                            if (!widget.styles) widget.styles = {};
                            // Correção: Elementor espera um objeto com id e url dentro de 'value'
                            widget.styles.selected_icon = { value: { id: result.id, url: result.url }, library: 'svg' };
                            // Keep widget.content as Title
                        } else if (widget.type === 'icon') {
                            // Correção para widget de ícone simples
                            if (!widget.styles) widget.styles = {};
                            widget.styles.selected_icon = { value: { id: result.id, url: result.url }, library: 'svg' };
                        } else if (widget.styles?.icon && widget.type === 'icon-list') {
                            // Correção para itens de lista de ícones
                            widget.styles.icon = { value: { id: result.id, url: result.url }, library: 'svg' };
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
                    const nodeId = slide?.id || slide?.imageId; // Verifica ambos
                    if (!nodeId) return;
                    try {
                        const result = await uploadNodeImage(nodeId, false);
                        if (result) {
                            slide.url = result.url;
                            const parsedId = parseInt(String(result.id), 10);
                            slide.id = isNaN(parsedId) ? '' : parsedId;
                            slide._id = slide._id || `slide_${idx + 1}`;
                            slide.image = { url: slide.url, id: slide.id };
                        }
                    } catch (e) {
                        console.error(`[Pipeline] Erro ao processar slide ${nodeId}:`, e);
                    }
                });
                await Promise.all(uploads);
            }

            // Galerias: preencher imagens com URLs/IDs do WP
            if ((widget.type === 'gallery' || widget.type === 'basic-gallery') && widget.styles?.gallery && Array.isArray(widget.styles.gallery)) {
                const uploads = widget.styles.gallery.map(async (imageItem: any) => {
                    const nodeId = imageItem?.id || imageItem?.imageId; // O ID aqui deve ser o ID do nó do Figma
                    if (!nodeId) return;
                    try {
                        const result = await uploadNodeImage(nodeId, false);
                        if (result) {
                            imageItem.url = result.url;
                            const parsedId = parseInt(String(result.id), 10);
                            imageItem.id = isNaN(parsedId) ? '' : parsedId; // Este ID passa a ser o do WP
                        }
                    } catch (e) {
                        console.error(`[Pipeline] Erro ao processar imagem da galeria ${nodeId}:`, e);
                    }
                });
                await Promise.all(uploads);

                // Filtra itens que falharam no upload para não gerar lixo no JSON
                widget.styles.gallery = widget.styles.gallery.filter((item: any) => item.url && item.id);
            }

            // Button Icon Upload
            if (widget.type === 'button') {
                // Check if button has an icon URL that needs uploading (from child extraction)
                // The registry might have set selected_icon.value to { url: "Icon", id: 6090 } where "Icon" is the name
                // We need to find the actual child node ID if possible, or use the ID provided if it's a valid node ID.
                const iconValue = widget.styles?.selected_icon?.value;
                if (iconValue && typeof iconValue === 'object' && iconValue.id) {
                    // If ID is a number, it might be already uploaded or a partial Figma ID (if parsed).
                    // If it's a string like "6090:5830", it's a Figma ID.
                    // The registry currently parses it to int. We might need to look at children to find the real ID if it's missing.

                    // However, let's try to find the icon child in the widget's children if available
                    // The pipeline widget might not have children populated if it came from AI, 
                    // but if it came from Heuristics/Base, it might.
                    // Actually, 'processWidget' receives the widget from the schema.

                    // If we can't find the child, we rely on the ID in selected_icon.
                    // But if registry parsed "6090:5830" to 6090, we can't use it for uploadNodeImage easily if we need the full ID.
                    // Let's assume for now we can try to find the child by type 'icon' or 'vector' in the container's original node?
                    // No, we don't have easy access to the node here without looking it up.

                    // Workaround: If we have a numeric ID that matches a node in Figma (partial match?), we could try.
                    // But better: let's try to upload using the ID we have, assuming it might be valid or we can find it.
                    // If iconValue.url is "Icon" (name), we definitely need to upload.

                    // Let's try to find the original node using the widget.imageId if available, or look up children.
                    // But widget.imageId for button is usually the button frame itself.

                    // Let's try to find a child of the button node that is a vector/icon.
                    if (widget.styles?.sourceId) {
                        const buttonNode = figma.getNodeById(widget.styles.sourceId);
                        if (buttonNode && 'children' in buttonNode) {
                            const iconChild = (buttonNode as any).children.find((c: any) => c.name === 'Icon' || c.type === 'VECTOR' || c.name.toLowerCase().includes('icon'));
                            if (iconChild) {
                                try {
                                    const result = await uploadNodeImage(iconChild.id, true);
                                    if (result) {
                                        widget.styles.selected_icon = { value: { id: result.id, url: result.url }, library: 'svg' };
                                    }
                                } catch (e) {
                                    console.error(`[Pipeline] Failed to upload button icon ${iconChild.id}:`, e);
                                }
                            }
                        }
                    }
                }
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
            if (node && 'children' in node && !(c as any)._aiOptimized) {
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
                    // SKIP w:inner-container - these are intentionally flattened by unwrapBoxedInner
                    const childNameLower = (child.name || '').toLowerCase();
                    if (childNameLower === 'w:inner-container' || childNameLower === 'c:inner-container') {
                        continue; // Do NOT rescue inner-containers, they were intentionally removed
                    }

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

    /**
     * Sync nav-menus to WordPress via figtoel-remote-menus plugin
     */
    private async syncNavMenus(schema: PipelineSchema, root: SerializedNode, wpConfig: WPConfig): Promise<void> {
        console.log('[NAV MENU SYNC] ========== START ==========');
        console.log('[NAV MENU SYNC] WPConfig:', { url: wpConfig.url, user: (wpConfig as any).user, hasPassword: !!((wpConfig as any).password || (wpConfig as any).token) });

        const syncEnabled = !!(wpConfig && wpConfig.url && (wpConfig as any).user && ((wpConfig as any).password || (wpConfig as any).token));
        if (!syncEnabled) {
            console.log('[NAV MENU SYNC] ❌ Skipped: WordPress config not provided.');
            return;
        }

        // Collect all nav-menu widgets from schema
        const navMenus: Array<{ widget: PipelineWidget; container: PipelineContainer }> = [];

        const collect = (container: PipelineContainer) => {
            if (container.widgets) {
                for (const widget of container.widgets) {
                    if (widget.type === 'nav-menu') {
                        navMenus.push({ widget, container });
                    }
                }
            }
            if (container.children) {
                for (const child of container.children) {
                    collect(child);
                }
            }
        };

        schema.containers.forEach(c => collect(c));

        console.log(`[NAV MENU SYNC] Collected ${navMenus.length} nav-menu widget(s):`, navMenus.map(m => ({ widgetType: m.widget.type, content: m.widget.content })));

        if (navMenus.length === 0) {
            console.log('[NAV MENU SYNC] No nav-menu widgets found.');
            return;
        }

        console.log(`[NAV MENU SYNC] Found ${navMenus.length} nav-menu(s). Syncing to WordPress...`);

        // For each nav-menu, extract items and sync
        for (const { widget, container } of navMenus) {
            try {
                // Find the original Figma node by sourceId
                const sourceId = widget.styles?.sourceId || container.id;
                const figmaNode = figma.getNodeById(sourceId);

                if (!figmaNode || !('children' in figmaNode)) {
                    console.warn(`[NAV MENU SYNC] Cannot find Figma node for nav-menu: ${sourceId}`);
                    continue;
                }

                // Extract menu items from children
                const items = this.extractMenuItems(figmaNode as FrameNode);

                // Menu name from widget content or Figma node name
                const menuName = widget.content || figmaNode.name || 'Menu Principal';

                // POST to figtoel-remote-menus API
                const payload = {
                    menu_name: menuName,
                    menu_location: 'primary', // Default location
                    replace_existing: true,
                    items
                };

                const url = `${wpConfig.url}/wp-json/figtoel-remote-menus/v1/sync`;

                // Pure JavaScript btoa polyfill (Figma doesn't have Buffer or btoa)
                const btoaPolyfill = (str: string): string => {
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
                    let output = '';
                    let i = 0;

                    while (i < str.length) {
                        const a = str.charCodeAt(i++);
                        const b = i < str.length ? str.charCodeAt(i++) : 0;
                        const c = i < str.length ? str.charCodeAt(i++) : 0;

                        const bitmap = (a << 16) | (b << 8) | c;

                        output += chars.charAt((bitmap >> 18) & 63);
                        output += chars.charAt((bitmap >> 12) & 63);
                        output += chars.charAt(b ? (bitmap >> 6) & 63 : 64);
                        output += chars.charAt(c ? bitmap & 63 : 64);
                    }

                    return output;
                };

                const auth = 'Basic ' + btoaPolyfill(`${(wpConfig as any).user}:${(wpConfig as any).password || (wpConfig as any).token}`);

                console.log(`[NAV MENU SYNC] Posting to ${url}...`, payload);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': auth
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    console.log(`[NAV MENU SYNC] ✅ Menu "${menuName}" synced successfully. Items created: ${result.items_created}`);
                    figma.ui.postMessage({ type: 'log', level: 'success', message: `Menu "${menuName}" criado no WordPress com ${result.items_created} itens.` });
                } else {
                    console.error(`[NAV MENU SYNC] ❌ Failed to sync menu "${menuName}":`, result);
                    figma.ui.postMessage({ type: 'log', level: 'error', message: `Erro ao criar menu "${menuName}": ${result.error || 'Desconhecido'}` });
                }

            } catch (error) {
                console.error(`[NAV MENU SYNC] Exception:`, error);
                figma.ui.postMessage({ type: 'log', level: 'error', message: `Erro ao sincronizar menu: ${error}` });
            }
        }
    }

    /**
     * Extract menu items from a nav-menu Figma node
     */
    private extractMenuItems(navMenuNode: FrameNode): Array<{ title: string; url: string; children?: any[] }> {
        const items: Array<{ title: string; url: string; children?: any[] }> = [];

        if (!navMenuNode.children) return items;

        console.log(`[NAV MENU SYNC] Nav menu has ${navMenuNode.children.length} children`);

        for (const child of navMenuNode.children) {
            console.log(`[NAV MENU SYNC] Processing child: ${child.name} Type: ${child.type}`);

            // Extract title from TEXT nodes directly
            if (child.type === 'TEXT') {
                const title = (child as TextNode).characters;
                const url = '#'; // Default URL
                items.push({ title, url });
                console.log(`[NAV MENU SYNC] ✅ Added TEXT menu item: ${title}`);
                continue;
            }

            // Extract title from FRAME or GROUP children
            if (child.type === 'FRAME' || child.type === 'GROUP') {
                let title = child.name;

                // Look for TEXT child
                if ('children' in child) {
                    const textChild = (child as FrameNode).children.find(c => c.type === 'TEXT');
                    if (textChild) {
                        title = (textChild as TextNode).characters;
                    }
                }

                const url = '#'; // Default URL
                items.push({ title, url });
                console.log(`[NAV MENU SYNC] ✅ Added ${child.type} menu item: ${title}`);
            }
        }

        console.log(`[NAV MENU SYNC] Extracted ${items.length} menu items from ${navMenuNode.name}`);
        return items;
    }

}
