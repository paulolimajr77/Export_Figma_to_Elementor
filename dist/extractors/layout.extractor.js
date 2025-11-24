"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFlexLayout = extractFlexLayout;
exports.extractPadding = extractPadding;
exports.extractMargin = extractMargin;
exports.extractPositioning = extractPositioning;
/**
 * Type guard para verificar se o nó tem propriedades de layout
 */
function hasLayout(node) {
    return 'layoutMode' in node;
}
/**
 * Extrai configurações de layout Flexbox do Figma para Elementor
 * @param node Nó do Figma com auto-layout
 * @returns Settings de flex layout
 */
function extractFlexLayout(node) {
    if (!hasLayout(node) || node.layoutMode === 'NONE')
        return {};
    const settings = {};
    const isRow = node.layoutMode === 'HORIZONTAL';
    // Direção do flex
    settings.flex_direction = isRow ? 'row' : 'column';
    // Mapeamento de alinhamento principal (justify-content)
    const justifyMap = {
        MIN: 'start',
        CENTER: 'center',
        MAX: 'end',
        SPACE_BETWEEN: 'space-between'
    };
    // Mapeamento de alinhamento cruzado (align-items)
    const alignMap = {
        MIN: 'start',
        CENTER: 'center',
        MAX: 'end',
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
function extractPadding(node) {
    var _a, _b, _c, _d;
    const frame = node;
    const top = (_a = frame.paddingTop) !== null && _a !== void 0 ? _a : 0;
    const right = (_b = frame.paddingRight) !== null && _b !== void 0 ? _b : 0;
    const bottom = (_c = frame.paddingBottom) !== null && _c !== void 0 ? _c : 0;
    const left = (_d = frame.paddingLeft) !== null && _d !== void 0 ? _d : 0;
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
function extractMargin(node) {
    const parent = node.parent;
    // Só calcula margin se o pai não tem auto-layout
    if (!parent || !('layoutMode' in parent) || parent.layoutMode !== 'NONE') {
        return {};
    }
    const margin = {};
    const threshold = 2; // Threshold mínimo para considerar margin
    // Margin top
    if (node.y > threshold) {
        margin.margin_top = { unit: 'px', size: Math.round(node.y) };
    }
    // Margin left
    if (node.x > threshold) {
        margin.margin_left = { unit: 'px', size: Math.round(node.x) };
    }
    // Margin right
    if ('width' in parent) {
        const rightSpace = parent.width - (node.x + node.width);
        if (rightSpace > threshold) {
            margin.margin_right = { unit: 'px', size: Math.round(rightSpace) };
        }
    }
    // Margin bottom
    if ('height' in parent) {
        const bottomSpace = parent.height - (node.y + node.height);
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
function extractPositioning(node) {
    const settings = {};
    const name = node.name.toLowerCase();
    // Posicionamento fixo
    if (name.includes('fixed')) {
        settings._position = 'fixed';
        settings._offset_x = { unit: 'px', size: Math.round(node.x) };
        settings._offset_y = { unit: 'px', size: Math.round(node.y) };
    }
    // Posicionamento sticky
    else if (name.includes('sticky')) {
        settings._position = 'sticky';
        settings._offset_y = { unit: 'px', size: 0 };
    }
    // Z-index baseado na ordem dos filhos
    if (node.parent && 'children' in node.parent) {
        const siblings = node.parent.children;
        const index = siblings.indexOf(node);
        const z = siblings.length - index;
        if (z > 1)
            settings._z_index = z;
    }
    return settings;
}
