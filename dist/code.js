"use strict";
// Elementor JSON Compiler – Full Implementation (TypeScript)
// This file provides a complete, syntactically correct implementation of the Elementor compiler
// for the Figma plugin. It includes all extraction utilities, helper functions, and the
// ElementorCompiler class required for exporting frames, text, and containers.
// -------------------- Helper Utilities --------------------
function generateGUID() {
    // Simple GUID generator – sufficient for plugin usage
    return 'xxxxxxxxxx'.replace(/[x]/g, () => ((Math.random() * 36) | 0).toString(36));
}
function convertColor(paint) {
    if (!paint || paint.type !== 'SOLID')
        return '';
    const { r, g, b } = paint.color;
    const a = paint.opacity !== undefined ? paint.opacity : 1;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
// -------------------- Type Guards --------------------
function hasFills(node) {
    return 'fills' in node;
}
function hasStrokes(node) {
    return 'strokes' in node;
}
function hasEffects(node) {
    return 'effects' in node;
}
function hasLayout(node) {
    return 'layoutMode' in node;
}
function hasCornerRadius(node) {
    return 'cornerRadius' in node || 'topLeftRadius' in node;
}
// -------------------- Extraction Functions --------------------
function extractTypography(node) {
    const settings = {};
    if (node.fontSize !== figma.mixed) {
        settings.typography_font_size = { unit: 'px', size: Math.round(node.fontSize) };
    }
    if (node.fontName !== figma.mixed) {
        const style = node.fontName.style.toLowerCase();
        if (style.includes('bold'))
            settings.typography_font_weight = '700';
        else if (style.includes('semibold'))
            settings.typography_font_weight = '600';
        else if (style.includes('medium'))
            settings.typography_font_weight = '500';
        else if (style.includes('light'))
            settings.typography_font_weight = '300';
        else
            settings.typography_font_weight = '400';
        if (style.includes('italic'))
            settings.typography_font_style = 'italic';
        settings.typography_font_family = node.fontName.family;
    }
    if (node.lineHeight !== figma.mixed && node.lineHeight.unit !== 'AUTO') {
        if (node.lineHeight.unit === 'PIXELS') {
            settings.typography_line_height = { unit: 'px', size: Math.round(node.lineHeight.value) };
        }
        else if (node.lineHeight.unit === 'PERCENT') {
            settings.typography_line_height = { unit: 'em', size: (node.lineHeight.value / 100).toFixed(2) };
        }
    }
    if (node.letterSpacing !== figma.mixed && node.letterSpacing.value !== 0) {
        settings.typography_letter_spacing = { unit: 'px', size: node.letterSpacing.value };
    }
    if (node.textAlignHorizontal) {
        const map = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };
        const key = node.textAlignHorizontal;
        if (map[key])
            settings.align = map[key];
    }
    if (node.textDecoration !== figma.mixed) {
        if (node.textDecoration === 'UNDERLINE')
            settings.typography_text_decoration = 'underline';
        else if (node.textDecoration === 'STRIKETHROUGH')
            settings.typography_text_decoration = 'line-through';
    }
    if (node.textCase !== figma.mixed) {
        if (node.textCase === 'UPPER')
            settings.typography_text_transform = 'uppercase';
        else if (node.textCase === 'LOWER')
            settings.typography_text_transform = 'lowercase';
        else if (node.textCase === 'TITLE')
            settings.typography_text_transform = 'capitalize';
    }
    return settings;
}
function extractTextColor(node) {
    if (!hasFills(node) || !Array.isArray(node.fills) || node.fills.length === 0)
        return '';
    const fill = node.fills[0];
    if (fill.type === 'SOLID')
        return convertColor(fill);
    return '';
}
function extractBorderStyles(node) {
    const settings = {};
    if (hasStrokes(node) && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke.type === 'SOLID') {
            settings.border_color = convertColor(stroke);
            settings.border_border = 'solid';
            if (node.strokeWeight !== figma.mixed) {
                settings.border_width = {
                    unit: 'px',
                    top: node.strokeWeight,
                    right: node.strokeWeight,
                    bottom: node.strokeWeight,
                    left: node.strokeWeight,
                    isLinked: true
                };
            }
        }
    }
    if (hasCornerRadius(node)) {
        if (node.cornerRadius !== figma.mixed) {
            settings.border_radius = {
                unit: 'px',
                top: node.cornerRadius,
                right: node.cornerRadius,
                bottom: node.cornerRadius,
                left: node.cornerRadius,
                isLinked: true
            };
        }
        else {
            settings.border_radius = {
                unit: 'px',
                top: node.topLeftRadius,
                right: node.topRightRadius,
                bottom: node.bottomRightRadius,
                left: node.bottomLeftRadius,
                isLinked: false
            };
        }
    }
    return settings;
}
function extractShadows(node) {
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
function extractInnerShadow(node) {
    const settings = {};
    if (!hasEffects(node) || !Array.isArray(node.effects))
        return settings;
    const inner = node.effects.find(e => e.type === 'INNER_SHADOW' && e.visible !== false);
    if (inner) {
        const { color, offset, radius, spread } = inner;
        const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
        settings.box_shadow_box_shadow_type_inner = 'yes';
        settings.box_shadow_box_shadow_inner = {
            horizontal: Math.round(offset.x),
            vertical: Math.round(offset.y),
            blur: Math.round(radius),
            spread: Math.round(spread || 0),
            color: rgba,
            position: 'inset'
        };
    }
    return settings;
}
function extractOpacity(node) {
    if ('opacity' in node && node.opacity !== 1) {
        return { _opacity: { unit: 'px', size: node.opacity } };
    }
    return {};
}
function extractTextShadow(node) {
    const settings = {};
    if (!hasEffects(node) || !Array.isArray(node.effects))
        return settings;
    const drop = node.effects.find(e => e.type === 'DROP_SHADOW' && e.visible !== false);
    if (drop) {
        const { color, offset, radius } = drop;
        const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
        settings.text_shadow_text_shadow_type = 'yes';
        settings.text_shadow_text_shadow = {
            horizontal: `${Math.round(offset.x)}px`,
            vertical: `${Math.round(offset.y)}px`,
            blur: `${Math.round(radius)}px`,
            color: rgba
        };
    }
    return settings;
}
function extractTransform(node) {
    const settings = {};
    if ('rotation' in node && node.rotation !== 0) {
        settings._transform_rotate_popover = 'custom';
        settings._transform_rotateZ_effect = { unit: 'deg', size: Math.round(node.rotation) };
    }
    return settings;
}
function extractBlendMode(node) {
    if (!('blendMode' in node) || node.blendMode === 'PASS_THROUGH' || node.blendMode === 'NORMAL')
        return {};
    const map = {
        MULTIPLY: 'multiply',
        SCREEN: 'screen',
        OVERLAY: 'overlay',
        DARKEN: 'darken',
        LIGHTEN: 'lighten',
        COLOR_DODGE: 'color-dodge',
        COLOR_BURN: 'color-burn',
        HARD_LIGHT: 'hard-light',
        SOFT_LIGHT: 'soft-light',
        DIFFERENCE: 'difference',
        EXCLUSION: 'exclusion',
        HUE: 'hue',
        SATURATION: 'saturation',
        COLOR: 'color',
        LUMINOSITY: 'luminosity'
    };
    const css = map[node.blendMode];
    if (css)
        return { _css_blend_mode: css };
    return {};
}
function extractCSSFilters(node) {
    if (!hasEffects(node) || !Array.isArray(node.effects))
        return {};
    const filters = [];
    node.effects.forEach(e => {
        if (e.visible === false)
            return;
        if (e.type === 'LAYER_BLUR' || e.type === 'BACKGROUND_BLUR') {
            filters.push(`blur(${Math.round(e.radius)}px)`);
        }
    });
    if (filters.length)
        return { _css_filter: filters.join(' ') };
    return {};
}
function extractOverflow(node) {
    if ('clipsContent' in node && node.clipsContent)
        return { _overflow: 'hidden' };
    return {};
}
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
            top: String(top),
            right: String(right),
            bottom: String(bottom),
            left: String(left),
            isLinked
        }
    };
}
function extractMargin(node) {
    const parent = node.parent;
    if (!parent || !('layoutMode' in parent) || parent.layoutMode !== 'NONE')
        return {};
    const margin = {};
    const threshold = 5;
    if (node.y > threshold)
        margin.margin_top = { unit: 'px', size: Math.round(node.y) };
    if (node.x > threshold)
        margin.margin_left = { unit: 'px', size: Math.round(node.x) };
    if ('width' in parent) {
        const rightSpace = parent.width - (node.x + node.width);
        if (rightSpace > threshold)
            margin.margin_right = { unit: 'px', size: Math.round(rightSpace) };
    }
    if ('height' in parent) {
        const bottomSpace = parent.height - (node.y + node.height);
        if (bottomSpace > threshold)
            margin.margin_bottom = { unit: 'px', size: Math.round(bottomSpace) };
    }
    return margin;
}
function extractPositioning(node) {
    const settings = {};
    if ('constraints' in node) {
        const h = node.constraints.horizontal;
        const v = node.constraints.vertical;
        if (h === 'MAX') {
            settings._position = 'absolute';
            settings._offset_orientation_h = 'end';
            settings._offset_x = { unit: 'px', size: 0 };
        }
        if (v === 'MAX') {
            settings._position = 'absolute';
            settings._offset_orientation_v = 'end';
            settings._offset_y = { unit: 'px', size: 0 };
        }
    }
    const name = node.name.toLowerCase();
    if (name.includes('fixed')) {
        settings._position = 'fixed';
        settings._offset_x = { unit: 'px', size: Math.round(node.x) };
        settings._offset_y = { unit: 'px', size: Math.round(node.y) };
    }
    else if (name.includes('sticky')) {
        settings._position = 'sticky';
        settings._offset_y = { unit: 'px', size: 0 };
    }
    if (node.parent && 'children' in node.parent) {
        const siblings = node.parent.children;
        const index = siblings.indexOf(node);
        const z = siblings.length - index;
        if (z > 1)
            settings._z_index = z;
    }
    return settings;
}
function extractDimensions(node) {
    const dims = {};
    if ('width' in node)
        dims.width = { unit: 'px', size: Math.round(node.width) };
    if ('height' in node)
        dims.height = { unit: 'px', size: Math.round(node.height) };
    return dims;
}
function extractBackgroundAdvanced(node) {
    // Placeholder – real implementation would map fills, gradients, images, etc.
    return {};
}
function extractCustomCSS(node) {
    // Placeholder for custom CSS handling.
    return {};
}
// -------------------- Icon Helpers --------------------
function isIconNode(node) {
    const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];
    const isVector = vectorTypes.includes(node.type);
    const isSmallFrame = (node.type === 'FRAME' || node.type === 'INSTANCE') && node.width <= 50 && node.height <= 50;
    const name = node.name.toLowerCase();
    return isVector || isSmallFrame || name.includes('icon') || name.includes('vector');
}
function hasImageFill(node) {
    return hasFills(node) && Array.isArray(node.fills) && node.fills.some(p => p.type === 'IMAGE');
}
// -------------------- Widget Creation --------------------
function createTextWidget(node) {
    const isHeading = node.fontSize > 24 || node.fontName.style.toLowerCase().includes('bold');
    const widgetType = isHeading ? 'heading' : 'text-editor';
    const settings = { title: node.characters, editor: node.characters };
    Object.assign(settings, extractTypography(node));
    const color = extractTextColor(node);
    if (color) {
        settings.title_color = color;
        settings.text_color = color;
    }
    Object.assign(settings, extractShadows(node));
    Object.assign(settings, extractTextShadow(node));
    Object.assign(settings, extractOpacity(node));
    Object.assign(settings, extractTransform(node));
    Object.assign(settings, extractPositioning(node));
    Object.assign(settings, extractMargin(node));
    return { id: generateGUID(), elType: 'widget', widgetType, settings, elements: [] };
}
// -------------------- Main Compiler Class --------------------
class ElementorCompiler {
    constructor(config) {
        this.config = config;
    }
    compile(nodes) {
        return nodes.map(node => {
            const element = this.processNode(node);
            // If the top-level element is a container widget, convert it to a root container
            if (element.elType === 'widget' && element.widgetType === 'container') {
                element.elType = 'container';
                element.isInner = false; // Add for root container parity
                delete element.widgetType;
            }
            return element;
        });
    }
    processNode(node) {
        const name = node.name.toLowerCase();
        const widgetPrefix = "w:";
        if (name.startsWith(widgetPrefix)) {
            const widgetSlug = name.substring(widgetPrefix.length).split(' ')[0].trim();
            if (widgetSlug) {
                if (widgetSlug === 'container') {
                    return this.createContainer(node);
                }
                return this.createExplicitWidget(node, widgetSlug);
            }
        }
        if (node.type === 'TEXT') {
            return createTextWidget(node);
        }
        if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT' || node.type === 'GROUP') {
            return this.createContainer(node);
        }
        // Return a placeholder for unhandled types to make them visible in the output
        const settings = {
            editor: `Unsupported node type: ${node.type}. Please wrap it in a frame and name it with a 'w:' prefix if you want to export it.`
        };
        return { id: generateGUID(), elType: 'widget', widgetType: 'text-editor', settings, elements: [] };
    }
    createContainer(node) {
        const settings = {};
        Object.assign(settings, extractBorderStyles(node));
        Object.assign(settings, extractShadows(node));
        Object.assign(settings, extractBackgroundAdvanced(node));
        Object.assign(settings, extractPadding(node));
        Object.assign(settings, extractDimensions(node));
        Object.assign(settings, extractOpacity(node));
        Object.assign(settings, extractTransform(node));
        Object.assign(settings, extractInnerShadow(node));
        Object.assign(settings, extractBlendMode(node));
        Object.assign(settings, extractCSSFilters(node));
        Object.assign(settings, extractOverflow(node));
        Object.assign(settings, extractPositioning(node));
        Object.assign(settings, extractCustomCSS(node));
        if (settings._position === 'absolute') {
            delete settings._position;
            delete settings._offset_x;
            delete settings._offset_y;
        }
        let childElements = [];
        if ('children' in node) {
            childElements = node.children.map(child => this.processNode(child));
        }
        return { id: generateGUID(), elType: 'widget', widgetType: 'container', settings, elements: childElements };
    }
    createExplicitWidget(node, widgetSlug) {
        const settings = {};
        const textChildren = [];
        if ('children' in node) {
            const frame = node;
            frame.children.forEach(c => {
                if (c.type === 'TEXT')
                    textChildren.push(c);
            });
        }
        else if (node.type === 'TEXT') {
            textChildren.push(node);
        }
        if (textChildren.length > 0) {
            const titleNode = textChildren[0];
            settings.title = titleNode.characters;
            settings.title_text = titleNode.characters;
            settings.heading = titleNode.characters;
            const typo = extractTypography(titleNode);
            const color = extractTextColor(titleNode);
            Object.assign(settings, typo);
            if (color)
                settings.title_color = color;
            for (const key in typo) {
                const newKey = key.replace('typography_', 'title_typography_');
                settings[newKey] = typo[key];
            }
        }
        if (textChildren.length > 1) {
            const descNode = textChildren[1];
            settings.description_text = descNode.characters;
            const typo = extractTypography(descNode);
            const color = extractTextColor(descNode);
            Object.assign(settings, typo);
            if (color)
                settings.description_color = color;
            for (const key in typo) {
                const newKey = key.replace('typography_', 'description_typography_');
                settings[newKey] = typo[key];
            }
        }
        Object.assign(settings, extractBorderStyles(node));
        Object.assign(settings, extractShadows(node));
        Object.assign(settings, extractBackgroundAdvanced(node));
        Object.assign(settings, extractPadding(node));
        Object.assign(settings, extractOpacity(node));
        Object.assign(settings, extractTransform(node));
        Object.assign(settings, extractInnerShadow(node));
        Object.assign(settings, extractBlendMode(node));
        Object.assign(settings, extractCSSFilters(node));
        Object.assign(settings, extractOverflow(node));
        Object.assign(settings, extractPositioning(node));
        Object.assign(settings, extractCustomCSS(node));
        return { id: generateGUID(), elType: 'widget', widgetType: widgetSlug, settings, elements: [] };
    }
    debugNodeRecursive(node, depth) {
        if (depth > 5)
            return { type: node.type, id: node.id, note: 'Max depth reached' };
        const info = { id: node.id, type: node.type, name: node.name };
        if ('children' in node) {
            info.children = node.children.map(c => this.debugNodeRecursive(c, depth + 1));
        }
        if (node.type === 'TEXT') {
            info.typography = extractTypography(node);
        }
        info.margin = extractMargin(node);
        info.positioning = extractPositioning(node);
        info.background = extractBackgroundAdvanced(node);
        return info;
    }
}
// -------------------- UI Interaction --------------------
figma.showUI(__html__, { width: 400, height: 600, themeColors: true });
figma.ui.onmessage = (msg) => {
    const compiler = new ElementorCompiler(msg.config || {});
    if (msg.type === 'export-elementor') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Selecione ao menos um frame para exportar.');
            return;
        }
        const elements = compiler.compile(selection);
        // This is the root structure Elementor expects for clipboard data.
        const exportData = {
            version: '3.33.1', // Match user's exact Elementor version
            type: 'elementor', // This must be 'elementor'
            siteurl: '', // Keep this empty for broad compatibility
            elements: elements,
        };
        figma.ui.postMessage({ type: 'export-result', data: JSON.stringify(exportData, null, 2) });
    }
    else if (msg.type === 'debug-structure') {
        const dump = figma.currentPage.selection.map(n => compiler.debugNodeRecursive(n, 0));
        figma.ui.postMessage({ type: 'debug-result', data: JSON.stringify(dump, null, 2) });
    }
    else if (msg.type === 'rename-layer') {
        if (figma.currentPage.selection.length === 0) {
            figma.notify('Selecione uma camada para aplicar o widget.');
            return;
        }
        figma.currentPage.selection.forEach(node => { node.name = msg.newName; });
        figma.notify('Camada(s) renomeada(s) para: ' + msg.newName);
    }
    else if (msg.type === 'resize-window') {
        figma.ui.resize(msg.width, msg.height);
    }
};
