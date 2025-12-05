import type { ImageFormat, ImageExportResult } from '../types/elementor.types';

/**
 * Converte Uint8Array para string (UTF-8)
 */
function bytesToString(bytes: Uint8Array): string {
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i]);
    }
    return result;
}

/**
 * Converte string para Uint8Array (UTF-8)
 */
function stringToBytes(str: string): Uint8Array {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i) & 0xFF;
    }
    return bytes;
}

/**
 * Sanitiza SVG removendo filters vazios que quebram a renderização
 * @param svgBytes - Bytes do SVG original
 * @returns Bytes do SVG sanitizado
 */
function sanitizeSvg(svgBytes: Uint8Array): Uint8Array {
    let svgString = bytesToString(svgBytes);

    // Remove filters vazios: <filter ...></filter> ou <filter ... />
    // Isso causa problemas quando um <g filter="url(#...)"> referencia um filter vazio
    svgString = svgString.replace(/<filter[^>]*>\s*<\/filter>/gi, '');
    svgString = svgString.replace(/<filter[^>]*\/>/gi, '');

    // Remove referências a filters que não existem mais
    // Procura por filter="url(#id)" e remove se o filter correspondente não existe
    const filterRefs = svgString.match(/filter="url\(#([^)]+)\)"/gi) || [];
    filterRefs.forEach(ref => {
        const match = ref.match(/url\(#([^)]+)\)/);
        if (match) {
            const filterId = match[1];
            // Verifica se o filter existe e não está vazio
            const filterRegex = new RegExp(`<filter[^>]*id=["']${filterId}["'][^>]*>[\\s\\S]+?<\\/filter>`, 'i');
            if (!filterRegex.test(svgString)) {
                // Filter não existe ou está vazio, remove a referência
                svgString = svgString.replace(new RegExp(`filter="url\\(#${filterId}\\)"`, 'gi'), '');
            }
        }
    });

    // Remove defs vazios que só tinham filters
    svgString = svgString.replace(/<defs>\s*<\/defs>/gi, '');

    return stringToBytes(svgString);
}

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
        // SVG - exportação vetorial com sanitização
        if (format === 'SVG') {
            const bytes = await node.exportAsync({ format: 'SVG' });
            const sanitizedBytes = sanitizeSvg(bytes);
            return { bytes: sanitizedBytes, mime: 'image/svg+xml', ext: 'svg' };
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
