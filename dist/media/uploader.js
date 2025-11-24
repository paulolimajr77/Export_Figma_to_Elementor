"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageUploader = void 0;
const hash_1 = require("../utils/hash");
const guid_1 = require("../utils/guid");
const image_exporter_1 = require("./image.exporter");
/**
 * Classe responsável pelo upload de imagens para o WordPress
 */
class ImageUploader {
    constructor(wpConfig, quality = 0.85) {
        this.pendingUploads = new Map();
        this.mediaHashCache = new Map();
        this.nodeHashCache = new Map();
        this.quality = 0.85;
        this.wpConfig = wpConfig;
        this.quality = quality;
    }
    /**
     * Faz upload de uma imagem para o WordPress
     * @param node Nó do Figma a ser exportado
     * @param format Formato da imagem
     * @returns URL da imagem no WordPress ou null
     */
    uploadToWordPress(node_1) {
        return __awaiter(this, arguments, void 0, function* (node, format = 'WEBP') {
            if (!this.wpConfig || !this.wpConfig.url || !this.wpConfig.user || !this.wpConfig.password) {
                console.warn('[F2E] WP config ausente.');
                return null;
            }
            try {
                const targetFormat = format === 'SVG' ? 'SVG' : 'WEBP';
                const result = yield (0, image_exporter_1.exportNodeAsImage)(node, targetFormat, this.quality);
                if (!result)
                    return null;
                const { bytes, mime, ext, needsConversion } = result;
                // Calcula hash para evitar uploads duplicados
                const hash = yield (0, hash_1.computeHash)(bytes);
                if (this.mediaHashCache.has(hash)) {
                    return this.mediaHashCache.get(hash);
                }
                this.nodeHashCache.set(node.id, hash);
                const id = (0, guid_1.generateGUID)();
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
                    this.pendingUploads.set(id, (result) => {
                        clearTimeout(timeout);
                        if (result.success) {
                            this.mediaHashCache.set(hash, result.url);
                            resolve(result.url);
                        }
                        else {
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
            }
            catch (e) {
                console.error('Error preparing upload:', e);
                return null;
            }
        });
    }
    /**
     * Processa resposta de upload da UI
     * @param id ID do upload
     * @param result Resultado do upload
     */
    handleUploadResponse(id, result) {
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
    setQuality(quality) {
        this.quality = Math.max(0.1, Math.min(1.0, quality));
    }
    /**
     * Atualiza a configuração do WordPress
     * @param wpConfig Nova configuração
     */
    setWPConfig(wpConfig) {
        this.wpConfig = wpConfig;
    }
    /**
     * Limpa o cache de hashes
     */
    clearCache() {
        this.mediaHashCache.clear();
        this.nodeHashCache.clear();
    }
}
exports.ImageUploader = ImageUploader;
