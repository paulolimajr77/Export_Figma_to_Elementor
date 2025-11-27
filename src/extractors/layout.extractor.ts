import type { ElementorSettings } from '../types/elementor.types';

/**
 * Type guard para verificar se o nó tem propriedades de layout
 */
function hasLayout(node: SceneNode): node is FrameNode | ComponentNode | InstanceNode {
    return 'layoutMode' in node;
}

/**
 * Extrai configurações de layout Flexbox do Figma para Elementor
 * @param node Nó do Figma com auto-layout
 * @returns Settings de flex layout
 */
export function extractFlexLayout(node: SceneNode): ElementorSettings {
    if (!hasLayout(node) || node.layoutMode === 'NONE') return {};

    const settings: ElementorSettings = {};
    const isRow = node.layoutMode === 'HORIZONTAL';

    // Direção do flex
    settings.flex_direction = isRow ? 'row' : 'column';

    // Mapeamento de alinhamento principal (justify-content)
    const justifyMap: Record<string, string> = {
        MIN: 'flex-start',
        CENTER: 'center',
        MAX: 'flex-end',
        SPACE_BETWEEN: 'space-between',
        SPACE_AROUND: 'space-around',
        SPACE_EVENLY: 'space-evenly'
    };

    // Mapeamento de alinhamento cruzado (align-items)
    const alignMap: Record<string, string> = {
        MIN: 'flex-start',
        CENTER: 'center',
        MAX: 'flex-end',
        BASELINE: 'baseline',
        STRETCH: 'stretch'
    };

    if (node.primaryAxisAlignItems && justifyMap[node.primaryAxisAlignItems]) {
        settings.justify_content = justifyMap[node.primaryAxisAlignItems];
    }

    if (node.counterAxisAlignItems && alignMap[node.counterAxisAlignItems]) {
        settings.align_items = alignMap[node.counterAxisAlignItems];
    }

    // Gap entre itens
    if (node.itemSpacing && node.itemSpacing > 0) {
        settings.gap = {
            unit: 'px',
            size: node.itemSpacing,
            column: node.itemSpacing,
            row: node.itemSpacing,
            isLinked: true
        };
    }

    // Wrap
    settings.flex_wrap = node.layoutWrap === 'WRAP' ? 'wrap' : 'nowrap';

    return settings;
}

/**
 * Extrai padding de um frame
 * @param node Nó do Figma
 * @returns Settings de padding
 */
export function extractPadding(node: SceneNode): ElementorSettings {
    const frame = node as FrameNode;
    const top = (frame as any).paddingTop ?? 0;
    const right = (frame as any).paddingRight ?? 0;
    const bottom = (frame as any).paddingBottom ?? 0;
    const left = (frame as any).paddingLeft ?? 0;
    const isLinked = top === right && top === bottom && top === left;

    return {
        padding: {
            unit: 'px',
            top: top,
            right: right,
            bottom: bottom,
            left: left,
            isLinked
        }
    };
}

/**
 * Extrai margin baseado no posicionamento absoluto do nó
 * @param node Nó do Figma
 * @returns Settings de margin
 */
export function extractMargin(node: SceneNode): ElementorSettings {
    const parent = node.parent as BaseNode | null;

    // Só calcula margin se o pai não tem auto-layout
    if (!parent || !('layoutMode' in parent) || (parent as any).layoutMode !== 'NONE') {
        return {};
    }

    const margin: ElementorSettings = {};
    const threshold = 2; // Threshold mínimo para considerar margin

    // Margin top
    if ((node as any).y > threshold) {
        margin.margin_top = { unit: 'px', size: Math.round((node as any).y) };
    }

    // Margin left
    if ((node as any).x > threshold) {
        margin.margin_left = { unit: 'px', size: Math.round((node as any).x) };
    }

    // Margin right
    if ('width' in parent) {
        const rightSpace = (parent as any).width - ((node as any).x + (node as any).width);
        if (rightSpace > threshold) {
            margin.margin_right = { unit: 'px', size: Math.round(rightSpace) };
        }
    }

    // Margin bottom
    if ('height' in parent) {
        const bottomSpace = (parent as any).height - ((node as any).y + (node as any).height);
        if (bottomSpace > threshold) {
            margin.margin_bottom = { unit: 'px', size: Math.round(bottomSpace) };
        }
    }

    return margin;
}

/**
 * Extrai posicionamento (fixed, sticky, z-index)
 * @param node Nó do Figma
 * @returns Settings de posicionamento
 */
export function extractPositioning(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};
    const name = node.name.toLowerCase();

    // Posicionamento fixo
    if (name.includes('fixed')) {
        settings._position = 'fixed';
        settings._offset_x = { unit: 'px', size: Math.round((node as any).x) };
        settings._offset_y = { unit: 'px', size: Math.round((node as any).y) };
    }
    // Posicionamento sticky
    else if (name.includes('sticky')) {
        settings._position = 'sticky';
        settings._offset_y = { unit: 'px', size: 0 };
    }

    // Z-index baseado na ordem dos filhos
    if (node.parent && 'children' in node.parent) {
        const siblings = (node.parent as any).children as SceneNode[];
        const index = siblings.indexOf(node);
        const z = siblings.length - index;
        if (z > 1) settings._z_index = z;
    }

    return settings;
}
