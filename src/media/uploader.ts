import type { WPConfig, ImageFormat } from '../types/elementor.types';
import { computeHash } from '../utils/hash';
import { generateGUID } from '../utils/guid';
import { exportNodeAsImage } from './image.exporter';

/**
 * Classe responsável pelo upload de imagens para o WordPress
 */
export class ImageUploader {
    private pendingUploads: Map<string, (result: any) => void> = new Map();
    private mediaHashCache: Map<string, string> = new Map();
    private nodeHashCache: Map<string, string> = new Map();
    private quality: number = 0.85;
    private wpConfig: WPConfig;

    constructor(wpConfig: WPConfig, quality: number = 0.85) {
        this.wpConfig = wpConfig;
        this.quality = quality;
    }

    /**
     * Faz upload de uma imagem para o WordPress
     * @param node Nó do Figma a ser exportado
     * @param format Formato da imagem
     * @returns URL da imagem no WordPress ou null
     */
    async uploadToWordPress(node: SceneNode, format: ImageFormat = 'WEBP'): Promise<string | null> {
        if (!this.wpConfig || !this.wpConfig.url || !this.wpConfig.user || !this.wpConfig.password) {
            console.warn('[F2E] WP config ausente.');
            return null;
        }

        try {
            const targetFormat = format === 'SVG' ? 'SVG' : 'WEBP';
            const result = await exportNodeAsImage(node, targetFormat, this.quality);
            if (!result) return null;

            const { bytes, mime, ext, needsConversion } = result;

            // Calcula hash para evitar uploads duplicados
            const hash = await computeHash(bytes);
            if (this.mediaHashCache.has(hash)) {
                return this.mediaHashCache.get(hash)!;
            }

            this.nodeHashCache.set(node.id, hash);
            const id = generateGUID();
            const safeId = node.id.replace(/[^a-z0-9]/gi, '_');
            const name = `w_${safeId}_${hash}.${ext}`;

            // Cria uma promise que será resolvida quando a UI responder
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    if (this.pendingUploads.has(id)) {
                        this.pendingUploads.delete(id);
                        resolve(null);
                    }
                }, 90000); // 90 segundos de timeout

                this.pendingUploads.set(id, (result: any) => {
                    clearTimeout(timeout);
                    if (result.success) {
                        this.mediaHashCache.set(hash, result.url);
                        resolve(result.url);
                    } else {
                        resolve(null);
                    }
                });

                // Envia mensagem para a UI fazer o upload
                figma.ui.postMessage({
                    type: 'upload-image-request',
                    id,
                    name,
                    mimeType: mime,
                    targetMimeType: 'image/webp',
                    data: bytes,
                    needsConversion: !!needsConversion
                });
            });
        } catch (e) {
            console.error('Error preparing upload:', e);
            return null;
        }
    }

    /**
     * Processa resposta de upload da UI
     * @param id ID do upload
     * @param result Resultado do upload
     */
    handleUploadResponse(id: string, result: any): void {
        const resolver = this.pendingUploads.get(id);
        if (resolver) {
            resolver(result);
            this.pendingUploads.delete(id);
        }
    }

    /**
     * Atualiza a qualidade de exportação
     * @param quality Nova qualidade (0.1 a 1.0)
     */
    setQuality(quality: number): void {
        this.quality = Math.max(0.1, Math.min(1.0, quality));
    }

    /**
     * Atualiza a configuração do WordPress
     * @param wpConfig Nova configuração
     */
    setWPConfig(wpConfig: WPConfig): void {
        this.wpConfig = wpConfig;
    }

    /**
     * Limpa o cache de hashes
     */
    clearCache(): void {
        this.mediaHashCache.clear();
        this.nodeHashCache.clear();
    }
}
