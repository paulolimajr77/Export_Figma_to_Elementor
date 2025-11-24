import type { ImageFormat, ImageExportResult } from '../types/elementor.types';

/**
 * Exporta um nó do Figma como imagem
 * @param node Nó a ser exportado
 * @param format Formato da imagem
 * @param quality Qualidade da exportação (0.1 a 1.0)
 * @returns Resultado da exportação ou null em caso de erro
 */
export async function exportNodeAsImage(
    node: SceneNode,
    format: ImageFormat,
    quality: number = 0.85
): Promise<ImageExportResult | null> {
    try {
        // SVG - exportação vetorial
        if (format === 'SVG') {
            const bytes = await node.exportAsync({ format: 'SVG' });
            return { bytes, mime: 'image/svg+xml', ext: 'svg' };
        }

        // WebP - exporta como PNG e marca para conversão posterior
        if (format === 'WEBP') {
            const bytes = await node.exportAsync({
                format: 'PNG',
                constraint: { type: 'SCALE', value: 2 }
            });
            return { bytes, mime: 'image/png', ext: 'webp', needsConversion: true };
        }

        // JPG
        if (format === 'JPG') {
            const bytes = await node.exportAsync({
                format: 'JPG',
                constraint: { type: 'SCALE', value: 2 }
            });
            return { bytes, mime: 'image/jpeg', ext: 'jpg' };
        }

        // PNG (padrão)
        const bytes = await node.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 2 }
        });
        return { bytes, mime: 'image/png', ext: 'png' };

    } catch (e) {
        console.error(`[F2E] Failed to export image for "${node.name}" (${node.id}):`, e);
        return null;
    }
}

/**
 * Exporta múltiplos nós como imagens
 * @param nodes Nós a serem exportados
 * @param format Formato da imagem
 * @param quality Qualidade da exportação
 * @returns Array de resultados
 */
export async function exportNodesAsImages(
    nodes: SceneNode[],
    format: ImageFormat,
    quality: number = 0.85
): Promise<(ImageExportResult | null)[]> {
    return Promise.all(nodes.map(node => exportNodeAsImage(node, format, quality)));
}
