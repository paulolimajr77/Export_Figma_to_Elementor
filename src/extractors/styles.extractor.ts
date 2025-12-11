import type { ElementorSettings, GeometryNode } from '../types/elementor.types';

function hasStrokes(node: SceneNode): node is GeometryNode {
    return 'strokes' in node;
}

function hasEffects(node: SceneNode): node is SceneNode & { effects: ReadonlyArray<Effect> } {
    return 'effects' in node;
}

function hasCornerRadius(node: SceneNode): node is FrameNode | RectangleNode | ComponentNode | InstanceNode {
    return 'cornerRadius' in node || 'topLeftRadius' in node;
}

/**
 * Extrai borda (stroke) de forma direta.
 * Suporta bordas uniformes e individuais por lado (strokeTopWeight, etc.)
 */
export function extractBorderStyles(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};

    if (hasStrokes(node) && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke.type === 'SOLID') {
            settings.border_color = rgbaFromSolid(stroke);
            settings.border_border = 'solid';

            const anyNode = node as any;

            // Verificar se tem bordas individuais por lado
            const hasIndividualStrokes = anyNode.strokeTopWeight !== undefined ||
                anyNode.strokeRightWeight !== undefined ||
                anyNode.strokeBottomWeight !== undefined ||
                anyNode.strokeLeftWeight !== undefined;

            // Verificar se tem strokeWeight uniforme ou individual
            if (!hasIndividualStrokes && anyNode.strokeWeight !== undefined && anyNode.strokeWeight !== figma.mixed) {
                // Stroke uniforme - usar mesmo valor para todos os lados
                const w = String(anyNode.strokeWeight);
                settings.border_width = {
                    unit: 'px',
                    top: w,
                    right: w,
                    bottom: w,
                    left: w,
                    isLinked: true
                };
            } else if (hasIndividualStrokes) {
                // Bordas individuais por lado (strokeTopWeight, strokeRightWeight, etc.)
                const top = anyNode.strokeTopWeight !== undefined ? anyNode.strokeTopWeight : 0;
                const right = anyNode.strokeRightWeight !== undefined ? anyNode.strokeRightWeight : 0;
                const bottom = anyNode.strokeBottomWeight !== undefined ? anyNode.strokeBottomWeight : 0;
                const left = anyNode.strokeLeftWeight !== undefined ? anyNode.strokeLeftWeight : 0;

                // Converter para strings (formato Elementor Dimensions)
                settings.border_width = {
                    unit: 'px',
                    top: String(top),
                    right: String(right),
                    bottom: String(bottom),
                    left: String(left),
                    isLinked: top === right && right === bottom && bottom === left
                };

                console.log('[figtoel-boxmodel] extractBorderStyles individual:', settings.border_width);
            }
        }
    }

    const radiusSettings = extractCornerRadius(node);
    Object.assign(settings, radiusSettings);

    return settings;
}


/**
 * Extrai corner radius (uniforme ou individual).
 */
export function extractCornerRadius(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};

    if (hasCornerRadius(node)) {
        const anyNode: any = node;

        if (anyNode.cornerRadius !== figma.mixed && typeof anyNode.cornerRadius === 'number') {
            const r = anyNode.cornerRadius;
            settings.border_radius = {
                unit: 'px',
                top: r,
                right: r,
                bottom: r,
                left: r,
                isLinked: true
            };
        } else {
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
 * Extrai sombras drop shadow (se existir).
 */
export function extractShadows(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};

    if (!hasEffects(node) || !Array.isArray(node.effects)) return settings;

    const drop = node.effects.find(e => e.type === 'DROP_SHADOW' && e.visible !== false) as DropShadowEffect | undefined;

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
 * Extrai opacidade direta.
 */
export function extractOpacity(node: SceneNode): ElementorSettings {
    if ('opacity' in node && node.opacity !== 1) {
        return { _opacity: { unit: 'px', size: node.opacity } };
    }
    return {};
}

/**
 * Extrai rotação direta.
 */
export function extractTransform(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};

    if ('rotation' in node && node.rotation !== 0) {
        settings._transform_rotate_popover = 'custom';
        settings._transform_rotateZ_effect = { unit: 'deg', size: Math.round(node.rotation) };
    }

    return settings;
}

function rgbaFromSolid(paint: SolidPaint): string {
    const { r, g, b } = paint.color;
    const a = typeof paint.opacity === 'number' ? paint.opacity : 1;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
