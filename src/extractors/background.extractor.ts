import type { ElementorSettings, GeometryNode } from '../types/elementor.types';
import { convertColor } from '../utils/colors';

/**
 * Type guards
 */
function hasFills(node: SceneNode): node is GeometryNode {
    return 'fills' in node;
}

function isArray(value: any): value is ReadonlyArray<any> {
    return Array.isArray(value);
}

/**
 * Interface para uploader de imagens (para evitar dependência circular)
 */
export interface ImageUploader {
    uploadToWordPress(node: SceneNode, format?: string): Promise<{ url: string, id: number } | null>;
}


/**
 * Extrai background avançado (sólido, gradiente ou imagem)
 * @param node Nó do Figma
 * @param uploader Instância do uploader de imagens
 * @returns Settings de background do Elementor
 */
export async function extractBackgroundAdvanced(
    node: SceneNode,
    uploader: ImageUploader
): Promise<ElementorSettings> {
    const settings: ElementorSettings = {};

    if (!hasFills(node) || !isArray(node.fills) || node.fills.length === 0) {
        return settings;
    }

    const visibleFills = node.fills.filter(f => f.visible !== false);
    if (visibleFills.length === 0) return settings;

    // Pega o último fill visível (o que está por cima)
    const bgFill = visibleFills[visibleFills.length - 1];

    // Background sólido
    if (bgFill.type === 'SOLID') {
        settings.background_background = 'classic';
        settings.background_color = convertColor(bgFill);
    }
    // Background com imagem
    else if (bgFill.type === 'IMAGE') {
        settings.background_background = 'classic';

        // CRÍTICO: Se exportarmos o 'node' diretamente, ele virá com todos os filhos (texto, botões, etc).
        // Precisamos criar um retângulo temporário APENAS com o fill de imagem para exportar.
        const tempNode = figma.createRectangle();
        tempNode.resize(node.width, node.height);
        tempNode.fills = [bgFill];

        // Mover para fora da vista para não atrapalhar (opcional, mas boa prática)
        tempNode.x = node.x + 10000;
        tempNode.y = node.y;

        try {
            const upload = await uploader.uploadToWordPress(tempNode, 'WEBP');
            if (upload) {
                settings.background_image = { url: upload.url, id: upload.id, source: 'library' };
            }
        } catch (error) {
            console.error('[Background] Erro ao exportar imagem de fundo:', error);
        } finally {
            tempNode.remove();
        }

        settings.background_position = 'center center';
        settings.background_size = 'cover';
        settings.background_repeat = 'no-repeat';
    }
    // Background com gradiente
    else if (bgFill.type === 'GRADIENT_LINEAR' || bgFill.type === 'GRADIENT_RADIAL') {
        settings.background_background = 'gradient';
        settings.background_gradient_type = bgFill.type === 'GRADIENT_RADIAL' ? 'radial' : 'linear';

        const stops = bgFill.gradientStops;

        // Primeira cor do gradiente
        if (stops.length > 0) {
            settings.background_color = convertColor({
                type: 'SOLID',
                color: stops[0].color,
                opacity: stops[0].color.a
            } as SolidPaint);
            settings.background_color_stop = {
                unit: '%',
                size: Math.round(stops[0].position * 100)
            };
        }

        // Segunda cor do gradiente
        if (stops.length > 1) {
            settings.background_color_b = convertColor({
                type: 'SOLID',
                color: stops[stops.length - 1].color,
                opacity: stops[stops.length - 1].color.a
            } as SolidPaint);
            settings.background_color_b_stop = {
                unit: '%',
                size: Math.round(stops[stops.length - 1].position * 100)
            };
        }

        // Ângulo do gradiente linear
        if (bgFill.type === 'GRADIENT_LINEAR') {
            settings.background_gradient_angle = { unit: 'deg', size: 180 };
        }
    }

    return settings;
}

/**
 * Extrai background simples (apenas cor sólida)
 * @param node Nó do Figma
 * @returns Settings de background
 */
export function extractBackgroundColor(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};

    if (!hasFills(node) || !isArray(node.fills) || node.fills.length === 0) {
        return settings;
    }

    const visibleFills = node.fills.filter(f => f.visible !== false);
    if (visibleFills.length === 0) return settings;

    const bgFill = visibleFills[visibleFills.length - 1];

    if (bgFill.type === 'SOLID') {
        settings.background_background = 'classic';
        settings.background_color = convertColor(bgFill);
    }

    return settings;
}
