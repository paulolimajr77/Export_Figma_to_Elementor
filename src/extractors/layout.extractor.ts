import type { ElementorSettings } from '../types/elementor.types';

/**
 * Extrai dados básicos de layout (auto-layout) diretamente do Figma, sem inferências.
 */
function hasLayout(node: SceneNode): node is FrameNode | ComponentNode | InstanceNode {
    return 'layoutMode' in node;
}

/**
 * Extrai configurações simples de flex (somente se o node usar auto-layout).
 */
export function extractFlexLayout(node: SceneNode): ElementorSettings {
    if (!hasLayout(node) || node.layoutMode === 'NONE') return {};

    const settings: ElementorSettings = {
        flex_direction: node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'
    };

    const justifyMap: Record<string, string> = {
        MIN: 'flex-start',
        CENTER: 'center',
        MAX: 'flex-end',
        SPACE_BETWEEN: 'space-between',
        SPACE_AROUND: 'space-around',
        SPACE_EVENLY: 'space-evenly'
    };

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

    if (node.itemSpacing && node.itemSpacing > 0) {
        settings.gap = {
            unit: 'px',
            size: node.itemSpacing,
            column: node.itemSpacing,
            row: node.itemSpacing,
            isLinked: true
        };
    }

    settings.flex_wrap = node.layoutWrap === 'WRAP' ? 'wrap' : 'nowrap';

    return settings;
}

/**
 * Extrai padding explícito do Figma (se disponível).
 */
export function extractPadding(node: SceneNode): ElementorSettings {
    if (!hasLayout(node)) return {};

    const top = (node as any).paddingTop ?? 0;
    const right = (node as any).paddingRight ?? 0;
    const bottom = (node as any).paddingBottom ?? 0;
    const left = (node as any).paddingLeft ?? 0;
    const isLinked = top === right && top === bottom && top === left;

    return {
        padding: {
            unit: 'px',
            top,
            right,
            bottom,
            left,
            isLinked
        }
    };
}
