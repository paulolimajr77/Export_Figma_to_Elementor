import { convertColor } from '../utils/colors';
/**
 * Type guards para verificar propriedades dos nós
 */
function hasStrokes(node) {
    return 'strokes' in node;
}
function hasEffects(node) {
    return 'effects' in node;
}
function hasCornerRadius(node) {
    return 'cornerRadius' in node || 'topLeftRadius' in node;
}
function isArray(value) {
    return Array.isArray(value);
}
/**
 * Extrai estilos de borda de um nó
 * @param node Nó do Figma
 * @returns Settings de borda do Elementor
 */
export function extractBorderStyles(node) {
    const settings = {};
    // Extrai stroke (borda)
    if (hasStrokes(node) && isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke.type === 'SOLID') {
            settings.border_color = convertColor(stroke);
            settings.border_border = 'solid';
            if (node.strokeWeight !== figma.mixed) {
                const w = node.strokeWeight;
                settings.border_width = {
                    unit: 'px',
                    top: w,
                    right: w,
                    bottom: w,
                    left: w,
                    isLinked: true
                };
            }
        }
    }
    // Extrai border radius
    const radiusSettings = extractCornerRadius(node);
    Object.assign(settings, radiusSettings);
    return settings;
}
/**
 * Extrai border radius de um nó
 * @param node Nó do Figma
 * @returns Settings de border radius
 */
export function extractCornerRadius(node) {
    const settings = {};
    if (hasCornerRadius(node)) {
        const anyNode = node;
        if (anyNode.cornerRadius !== figma.mixed && typeof anyNode.cornerRadius === 'number') {
            // Border radius uniforme
            const r = anyNode.cornerRadius;
            settings.border_radius = {
                unit: 'px',
                top: r,
                right: r,
                bottom: r,
                left: r,
                isLinked: true
            };
        }
        else {
            // Border radius individual por canto
            settings.border_radius = {
                unit: 'px',
                top: anyNode.topLeftRadius || 0,
                right: anyNode.topRightRadius || 0,
                bottom: anyNode.bottomRightRadius || 0,
                left: anyNode.bottomLeftRadius || 0,
                isLinked: false
            };
        }
    }
    return settings;
}
/**
 * Extrai sombras (drop shadow) de um nó
 * @param node Nó do Figma
 * @returns Settings de sombra do Elementor
 */
export function extractShadows(node) {
    const settings = {};
    if (!hasEffects(node) || !Array.isArray(node.effects))
        return settings;
    const drop = node.effects.find(e => e.type === 'DROP_SHADOW' && e.visible !== false);
    if (drop) {
        const { color, offset, radius, spread } = drop;
        const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
        settings.box_shadow_box_shadow_type = 'yes';
        settings.box_shadow_box_shadow = {
            horizontal: Math.round(offset.x),
            vertical: Math.round(offset.y),
            blur: Math.round(radius),
            spread: Math.round(spread || 0),
            color: rgba
        };
    }
    return settings;
}
/**
 * Extrai opacidade de um nó
 * @param node Nó do Figma
 * @returns Settings de opacidade
 */
export function extractOpacity(node) {
    if ('opacity' in node && node.opacity !== 1) {
        return { _opacity: { unit: 'px', size: node.opacity } };
    }
    return {};
}
/**
 * Extrai transformações (rotação) de um nó
 * @param node Nó do Figma
 * @returns Settings de transformação
 */
export function extractTransform(node) {
    const settings = {};
    if ('rotation' in node && node.rotation !== 0) {
        settings._transform_rotate_popover = 'custom';
        settings._transform_rotateZ_effect = { unit: 'deg', size: Math.round(node.rotation) };
    }
    return settings;
}
