import type { WPConfig, ImageFormat } from '../types/elementor.types';
import { computeHash } from '../utils/hash';
import { generateGUID } from '../utils/guid';
import { exportNodeAsImage } from './image.exporter';

/**
 * Classe responsável pelo upload de imagens para o WordPress
 */
export class ImageUploader {
    private pendingUploads: Map<string, (result: any) => void> = new Map();
    private mediaHashCache: Map<string, { url: string, id: number }> = new Map();
    private nodeHashCache: Map<string, string> = new Map();
    private quality: number = 0.85;
    private wpConfig: WPConfig;
    private overwriteExisting: boolean = false;

    constructor(wpConfig: WPConfig, quality: number = 0.85) {
        this.wpConfig = wpConfig;
        this.quality = quality;
    }

    /**
     * Faz upload de uma imagem baseada em um SceneNode do Figma.
     */
    async uploadToWordPress(node: SceneNode, format: ImageFormat = 'WEBP'): Promise<{ url: string, id: number } | null> {
        if (!this.canUpload()) return null;

        try {
            const targetFormat = format === 'SVG' ? 'SVG' : 'WEBP';
            const result = await exportNodeAsImage(node, targetFormat, this.quality);
            if (!result) return null;

            const safeId = node.id.replace(/[^a-z0-9]/gi, '_');
            const hash = await computeHash(result.bytes);
            this.nodeHashCache.set(node.id, hash);
            return this.enqueueUpload(result.bytes, result.mime, result.ext, safeId, !!result.needsConversion);
        } catch (error) {
            console.error('[ImageUploader] Error preparing upload:', error);
            return null;
        }
    }

    /**
     * Faz upload de um fill de imagem usando o hash do Figma.
     */
    async uploadImageHash(imageHash: string, nameHint: string = 'fill'): Promise<{ url: string, id: number } | null> {
        if (!this.canUpload()) return null;

        const image = figma.getImageByHash(imageHash);
        if (!image) {
            console.warn('[ImageUploader] Não foi possível localizar imagem para o hash:', imageHash);
            return null;
        }

        try {
            const bytes = await image.getBytesAsync();
            const detected = this.detectImageFormat(bytes);
            const safeId = `${nameHint}_${imageHash.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'img'}`;
            return this.enqueueUpload(bytes, detected.mime, detected.ext, safeId, false);
        } catch (error) {
            console.error('[ImageUploader] Falhou ao exportar imageHash:', error);
            return null;
        }
    }

    /**
     * Processa resposta de upload da UI
     */
    handleUploadResponse(id: string, result: any): void {
        const resolver = this.pendingUploads.get(id);
        if (resolver) {
            resolver(result);
            this.pendingUploads.delete(id);
        } else {
            console.warn(`[ImageUploader] Nenhuma promessa pendente encontrada para ${id}`);
        }
    }

    setQuality(quality: number): void {
        this.quality = Math.max(0.1, Math.min(1.0, quality));
    }

    setWPConfig(wpConfig: WPConfig): void {
        this.wpConfig = {
            ...wpConfig,
            password: wpConfig?.password || (wpConfig as any)?.token
        };
        this.overwriteExisting = !!(wpConfig as any)?.overwriteImages;
        const rawQuality = (wpConfig as any)?.webpQuality;
        if (typeof rawQuality === 'number' && !isNaN(rawQuality)) {
            const normalized = rawQuality > 1 ? rawQuality / 100 : rawQuality;
            this.quality = Math.max(0.05, Math.min(1, normalized));
        }
    }

    clearCache(): void {
        this.mediaHashCache.clear();
        this.nodeHashCache.clear();
    }

    private canUpload(): boolean {
        if (!this.wpConfig || !this.wpConfig.url || !this.wpConfig.user || !this.wpConfig.password) {
            console.warn('[F2E] WP config ausente.');
            return false;
        }
        return true;
    }

    private detectImageFormat(bytes: Uint8Array): { mime: string; ext: string } {
        if (bytes.length >= 8 &&
            bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return { mime: 'image/png', ext: 'png' };
        }

        if (bytes.length >= 3 &&
            bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return { mime: 'image/jpeg', ext: 'jpg' };
        }

        if (bytes.length >= 3 &&
            bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
            return { mime: 'image/gif', ext: 'gif' };
        }

        return { mime: 'image/png', ext: 'png' };
    }

    private async enqueueUpload(bytes: Uint8Array, mime: string, ext: string, safeId: string, needsConversion: boolean): Promise<{ url: string, id: number } | null> {
        const hash = await computeHash(bytes);
        if (this.mediaHashCache.has(hash)) {
            return this.mediaHashCache.get(hash)!;
        }

        const id = generateGUID();
        const sanitizedId = safeId.replace(/[^a-z0-9]/gi, '_');
        const name = `w_${sanitizedId}_${hash}.${ext}`;

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                if (this.pendingUploads.has(id)) {
                    this.pendingUploads.delete(id);
                    resolve(null);
                }
            }, 90000);

            this.pendingUploads.set(id, (result: any) => {
                clearTimeout(timeout);
                if (result.success) {
                    console.log(`[ImageUploader] Upload bem-sucedido. URL: ${result.url}, ID: ${result.wpId}`);
                    const mediaData = { url: result.url, id: result.wpId || 0 };
                    this.mediaHashCache.set(hash, mediaData);
                    resolve(mediaData);
                } else {
                    console.error('[ImageUploader] Falha no upload:', result.error);
                    resolve(null);
                }
            });

            figma.ui.postMessage({
                type: 'upload-image-request',
                id,
                name,
                mimeType: mime,
                targetMimeType: needsConversion ? 'image/webp' : mime,
                data: bytes,
                needsConversion: !!needsConversion,
                overwrite: this.overwriteExisting,
                quality: this.quality
            });
        });
    }
}

export { DefaultMediaService, determineExportFormat } from '../services/media';
