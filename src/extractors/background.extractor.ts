import type { ElementorSettings, GeometryNode } from '../types/elementor.types';

/**
 * Extrai dados brutos de background (cor, imagem, gradiente) sem heurísticas.
 * Não descarta fills; apenas converte o último fill visível para settings simples.
 */
function hasFills(node: SceneNode): node is GeometryNode {
    return 'fills' in node;
}

/**
 * Extrai background simplificado (cor/gradiente/imagem) preservando o fill visível.
 */
export function extractBackgroundBasic(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};

    if (!hasFills(node) || !Array.isArray(node.fills) || node.fills.length === 0) {
        return settings;
    }

    const visibleFills = node.fills.filter(f => f.visible !== false);
    if (visibleFills.length === 0) return settings;

    // Usa o último fill visível (mais ao topo)
    const fill = visibleFills[visibleFills.length - 1];

    if (fill.type === 'SOLID') {
        const { r, g, b } = fill.color;
        const a = typeof fill.opacity === 'number' ? fill.opacity : 1;
        settings.background_background = 'classic';
        settings.background_color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    } else if (fill.type === 'IMAGE') {
        settings.background_background = 'classic';
        settings.background_image = {
            url: '', // URL deve ser resolvida posteriormente pelo pipeline/uploader
            id: 0,
            imageHash: fill.imageHash ?? null
        };
        settings.background_size = fill.scaleMode === 'TILE' ? 'auto' : 'cover';
        settings.background_repeat = fill.scaleMode === 'TILE' ? 'repeat' : 'no-repeat';
    } else if (
        fill.type === 'GRADIENT_LINEAR' ||
        fill.type === 'GRADIENT_RADIAL' ||
        fill.type === 'GRADIENT_ANGULAR' ||
        fill.type === 'GRADIENT_DIAMOND'
    ) {
        settings.background_background = 'gradient';
        settings.background_gradient_type = fill.type === 'GRADIENT_RADIAL' ? 'radial' : 'linear';
        settings.background_gradient_stops = fill.gradientStops || [];
        settings.background_gradient_transform = fill.gradientTransform || [[1, 0, 0], [0, 1, 0]];
    }

    return settings;
}
