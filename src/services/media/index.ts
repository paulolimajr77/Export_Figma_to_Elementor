import type { PipelineSchema, PipelineContainer, PipelineWidget } from '../../types/pipeline.schema';
import type { WPConfig } from '../../types/elementor.types';
import { ImageUploader } from '../../media/uploader';

export type ImageFormat = 'WEBP' | 'SVG';

export interface MediaResolutionOptions {
    uploadImages?: boolean;
    simulate?: boolean;
    wpConfig?: WPConfig;
}

export interface ResolvedAsset {
    widgetId: string;
    format: ImageFormat;
    simulated: boolean;
    url?: string;
    wpId?: number;
}

export interface MediaResolutionResult {
    schema: PipelineSchema;
    assets: ResolvedAsset[];
}

export interface MediaService {
    setWPConfig(config: WPConfig): void;
    resolveImages(schema: PipelineSchema, options?: MediaResolutionOptions): Promise<MediaResolutionResult>;
    handleUploadResponse(id: string, payload: any): void;
}

export class DefaultMediaService implements MediaService {
    private uploader: ImageUploader;
    private wpConfig: WPConfig = {};

    constructor(uploader?: ImageUploader) {
        this.uploader = uploader || new ImageUploader({});
    }

    setWPConfig(config: WPConfig): void {
        this.wpConfig = normalizeWpConfig(config);
        this.uploader.setWPConfig(this.wpConfig);
    }

    handleUploadResponse(id: string, payload: any): void {
        this.uploader.handleUploadResponse(id, payload);
    }

    async resolveImages(schema: PipelineSchema, options: MediaResolutionOptions = {}): Promise<MediaResolutionResult> {
        if (options.wpConfig) {
            this.setWPConfig(options.wpConfig);
        }

        if (options.simulate) {
            const assets = collectSimulatedAssets(schema);
            return { schema, assets };
        }

        if (options.uploadImages === false) {
            return { schema, assets: [] };
        }

        if (!this.canUpload()) {
            return { schema, assets: [] };
        }

        const assets: ResolvedAsset[] = [];
        const uploadTasks: Promise<void>[] = [];
        for (const container of schema.containers) {
            this.collectUploads(container, assets, uploadTasks);
        }

        if (uploadTasks.length > 0) {
            await Promise.all(uploadTasks);
        }

        return { schema, assets };
    }

    determineFormat(widget: PipelineWidget, node?: SceneNode | null): ImageFormat {
        return determineExportFormat(widget, node);
    }

    private collectUploads(container: PipelineContainer, assets: ResolvedAsset[], tasks: Promise<void>[]) {
        for (const widget of container.widgets || []) {
            tasks.push(this.processWidget(widget, assets));
        }
        for (const child of container.children || []) {
            this.collectUploads(child, assets, tasks);
        }
    }

    private async processWidget(widget: PipelineWidget, assets: ResolvedAsset[]) {
        await this.processWidgetUpload(widget, assets);
        if (widget.type === 'image-carousel') {
            await this.processCarouselSlides(widget, assets);
        }
        if ((widget.type === 'gallery' || widget.type === 'basic-gallery') && widget.styles?.gallery) {
            await this.processGallery(widget, assets);
        }
        if (widget.type === 'button') {
            await this.ensureButtonIcon(widget, assets);
        }

        if (Array.isArray(widget.children)) {
            for (const child of widget.children) {
                await this.processWidget(child, assets);
            }
        }
    }

    private async processWidgetUpload(widget: PipelineWidget, assets: ResolvedAsset[]) {
        if (widget.type === 'image-carousel') return;
        if (!requiresUpload(widget)) return;

        const nodeId = widget.imageId || widget.id || widget.styles?.sourceId;
        if (!nodeId) return;

        const node = await this.getNodeById(nodeId);
        if (!node) return;

        const format = this.determineFormat(widget, node);
        const result = await this.uploader.uploadToWordPress(node, format);
        if (!result) return;

        this.applyUploadResult(widget, result.url, result.id, format);
        assets.push({
            widgetId: widget.id || nodeId,
            format,
            simulated: false,
            url: result.url,
            wpId: result.id
        });
    }

    private async processCarouselSlides(widget: PipelineWidget, assets: ResolvedAsset[]) {
        const slides = widget.styles?.slides || [];
        const updatedSlides: any[] = [];
        for (const slide of slides) {
            const slideNodeId = slide.id || slide.imageId;
            if (!slideNodeId) {
                updatedSlides.push(slide);
                continue;
            }

            const node = await this.getNodeById(slideNodeId);
            if (!node) {
                updatedSlides.push(slide);
                continue;
            }

            const result = await this.uploader.uploadToWordPress(node, 'WEBP');
            if (result) {
                updatedSlides.push({
                    ...slide,
                    id: result.id,
                    url: result.url,
                    image: { url: result.url, id: result.id },
                    _id: slide._id || slide.id || `slide_${widget.id}`
                });
                assets.push({
                    widgetId: slideNodeId,
                    format: 'WEBP',
                    simulated: false,
                    url: result.url,
                    wpId: result.id
                });
            } else {
                updatedSlides.push(slide);
            }
        }
        const baseStyles = widget.styles || {};
        widget.styles = { ...baseStyles, slides: updatedSlides };
    }

    private async processGallery(widget: PipelineWidget, assets: ResolvedAsset[]) {
        const galleryItems = widget.styles?.gallery || [];
        const updated: any[] = [];
        for (const item of galleryItems) {
            const itemNodeId = item?.id || item?.imageId;
            if (!itemNodeId) continue;

            const node = await this.getNodeById(itemNodeId);
            if (!node) continue;

            const result = await this.uploader.uploadToWordPress(node, 'WEBP');
            if (result) {
                const next = {
                    ...item,
                    id: result.id,
                    url: result.url,
                    image: { url: result.url, id: result.id }
                };
                updated.push(next);
                assets.push({
                    widgetId: itemNodeId,
                    format: 'WEBP',
                    simulated: false,
                    url: result.url,
                    wpId: result.id
                });
            }
        }
        const baseStyles = widget.styles || {};
        widget.styles = { ...baseStyles, gallery: updated };
    }

    private async ensureButtonIcon(widget: PipelineWidget, assets: ResolvedAsset[]) {
        const iconValue = widget.styles?.selected_icon?.value;
        const sourceId = widget.styles?.sourceId;
        if (!iconValue || !sourceId) return;

        const buttonNode = await this.getNodeById(sourceId);
        if (!buttonNode || !('children' in buttonNode)) return;

        const iconChild = buttonNode.children.find(child => {
            const name = (child as SceneNode).name?.toLowerCase?.() || '';
            return child.type === 'VECTOR' || name.includes('icon');
        });
        if (!iconChild) return;

        const result = await this.uploader.uploadToWordPress(iconChild as SceneNode, 'SVG');
        if (!result) return;

        if (!widget.styles) widget.styles = {};
        widget.styles.selected_icon = { value: { id: result.id, url: result.url }, library: 'svg' };
        widget.imageId = typeof result.id === 'number' ? result.id.toString() : widget.imageId ?? null;
        assets.push({
            widgetId: iconChild.id,
            format: 'SVG',
            simulated: false,
            url: result.url,
            wpId: result.id
        });
    }

    private applyUploadResult(widget: PipelineWidget, url: string, id: number, format: ImageFormat) {
        if (!widget.styles) widget.styles = {};
        if (widget.type === 'image-box') {
            widget.styles.image_url = url;
        } else if (widget.type === 'icon-box' || widget.type === 'icon') {
            widget.styles.selected_icon = { value: { url, id }, library: 'svg' };
        } else if (widget.type === 'button') {
            widget.styles.selected_icon = { value: { url, id }, library: 'svg' };
            widget.content = widget.content || url;
        } else if (widget.type === 'list-item') {
            widget.styles.icon_url = url;
        } else if (widget.type === 'icon-list') {
            widget.styles.icon = { value: { url, id }, library: 'svg' };
        } else if (widget.type === 'accordion' || widget.type === 'toggle') {
            widget.styles.selected_icon = { value: { url, id }, library: 'svg' };
        } else {
            widget.content = url;
        }
        if (typeof id === 'number') {
            widget.imageId = id.toString();
        }
    }

    private async getNodeById(nodeId: string): Promise<SceneNode | null> {
        try {
            const node = figma.getNodeById(nodeId);
            return (node || null) as SceneNode | null;
        } catch {
            return null;
        }
    }

    private canUpload(): boolean {
        const normalizedConfig = normalizeWpConfig(this.wpConfig);
        return !!(normalizedConfig.url && normalizedConfig.user && normalizedConfig.password && normalizedConfig.exportImages);
    }
}

export function determineExportFormat(widget: PipelineWidget, node?: SceneNode | null): ImageFormat {
    const svgWidgetTypes = new Set(['icon', 'icon-box', 'list-item', 'icon-list', 'accordion', 'toggle', 'button']);
    if (svgWidgetTypes.has(widget.type)) {
        return 'SVG';
    }
    if (widget.type === 'image-box' || widget.type === 'image') {
        if (node && (isVectorNode(node) || hasVectorChildren(node))) {
            return 'SVG';
        }
        return 'WEBP';
    }

    if (node) {
        if (node.locked) {
            if (hasImageChildren(node)) {
                return 'WEBP';
            }
            if (hasVectorChildren(node)) {
                return 'SVG';
            }
        } else if (hasVectorChildren(node)) {
            return 'SVG';
        }
    }

    return 'WEBP';
}

function isVectorNode(node: SceneNode): boolean {
    const vectorTypes: SceneNode['type'][] = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];
    return vectorTypes.includes(node.type);
}

function hasVectorChildren(node: SceneNode): boolean {
    if (!('children' in node)) return false;
    return node.children.some(child => isVectorNode(child) || hasVectorChildren(child as SceneNode));
}

function hasImageChildren(node: SceneNode): boolean {
    if ('fills' in node && Array.isArray((node as any).fills)) {
        if ((node as any).fills.some((f: any) => f.type === 'IMAGE')) {
            return true;
        }
    }
    if ('children' in node) {
        return node.children.some(child => hasImageChildren(child as SceneNode));
    }
    return false;
}

function collectSimulatedAssets(schema: PipelineSchema): ResolvedAsset[] {
    const assets: ResolvedAsset[] = [];

    const simulateWidget = (widget: PipelineWidget) => {
        if (requiresUpload(widget)) {
            assets.push({
                widgetId: widget.id || widget.styles?.sourceId || '',
                format: widget.type === 'icon' || widget.type === 'icon-box' || widget.type === 'icon-list' || widget.type === 'accordion' || widget.type === 'toggle' || widget.type === 'button' ? 'SVG' : 'WEBP',
                simulated: true
            });
        }

        if (widget.type === 'image-carousel' && Array.isArray(widget.styles?.slides)) {
            widget.styles.slides.forEach((slide: any) => {
                assets.push({
                    widgetId: slide?.id || slide?.imageId || '',
                    format: 'WEBP',
                    simulated: true
                });
            });
        }

        if ((widget.type === 'gallery' || widget.type === 'basic-gallery') && Array.isArray(widget.styles?.gallery)) {
            widget.styles.gallery.forEach((item: any) => {
                assets.push({
                    widgetId: item?.id || item?.imageId || '',
                    format: 'WEBP',
                    simulated: true
                });
            });
        }

        if (Array.isArray(widget.children)) {
            widget.children.forEach(simulateWidget);
        }
    };

    const visit = (container: PipelineContainer) => {
        for (const widget of container.widgets || []) {
            simulateWidget(widget);
        }
        for (const child of container.children || []) {
            visit(child);
        }
    };

    schema.containers.forEach(visit);
    return assets;
}

function requiresUpload(widget: PipelineWidget): boolean {
    const uploadTypes = new Set(['image', 'image-box', 'icon', 'icon-box', 'button', 'list-item', 'icon-list', 'accordion', 'toggle', 'custom', 'image-carousel']);
    return uploadTypes.has(widget.type);
}

function normalizeWpConfig(config: WPConfig): WPConfig {
    return {
        ...config,
        password: config.password || (config as any)?.token
    };
}
