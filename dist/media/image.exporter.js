var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Exporta um nó do Figma como imagem
 * @param node Nó a ser exportado
 * @param format Formato da imagem
 * @param quality Qualidade da exportação (0.1 a 1.0)
 * @returns Resultado da exportação ou null em caso de erro
 */
export function exportNodeAsImage(node_1, format_1) {
    return __awaiter(this, arguments, void 0, function* (node, format, quality = 0.85) {
        try {
            // SVG - exportação vetorial
            if (format === 'SVG') {
                const bytes = yield node.exportAsync({ format: 'SVG' });
                return { bytes, mime: 'image/svg+xml', ext: 'svg' };
            }
            // WebP - exporta como PNG e marca para conversão posterior
            if (format === 'WEBP') {
                const bytes = yield node.exportAsync({
                    format: 'PNG',
                    constraint: { type: 'SCALE', value: 2 }
                });
                return { bytes, mime: 'image/png', ext: 'webp', needsConversion: true };
            }
            // JPG
            if (format === 'JPG') {
                const bytes = yield node.exportAsync({
                    format: 'JPG',
                    constraint: { type: 'SCALE', value: 2 }
                });
                return { bytes, mime: 'image/jpeg', ext: 'jpg' };
            }
            // PNG (padrão)
            const bytes = yield node.exportAsync({
                format: 'PNG',
                constraint: { type: 'SCALE', value: 2 }
            });
            return { bytes, mime: 'image/png', ext: 'png' };
        }
        catch (e) {
            console.error(`[F2E] Failed to export image for "${node.name}" (${node.id}):`, e);
            return null;
        }
    });
}
/**
 * Exporta múltiplos nós como imagens
 * @param nodes Nós a serem exportados
 * @param format Formato da imagem
 * @param quality Qualidade da exportação
 * @returns Array de resultados
 */
export function exportNodesAsImages(nodes_1, format_1) {
    return __awaiter(this, arguments, void 0, function* (nodes, format, quality = 0.85) {
        return Promise.all(nodes.map(node => exportNodeAsImage(node, format, quality)));
    });
}
