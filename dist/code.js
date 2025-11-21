"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Elementor JSON Compiler – Full Implementation (TypeScript)
// Exporta frames do Figma para JSON compatível com Elementor (clipboard).
// Suporta containers, textos, botões, imagem, icon, icon-box, image-box, etc.
// -------------------- Helper Utilities --------------------
function generateGUID() {
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
    settings.typography_typography = 'custom';
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
    if (hasCornerRadius(node)) {
        const anyNode = node;
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
        }
        else {
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
    const settings = {};
    if (!hasFills(node) || !Array.isArray(node.fills) || node.fills.length === 0)
        return settings;
    const fill = node.fills[node.fills.length - 1];
    if (!fill.visible)
        return settings;
    if (fill.type === 'SOLID') {
        settings.background_background = 'classic';
        settings.background_color = convertColor(fill);
    }
    else if (fill.type === 'GRADIENT_LINEAR') {
        const g = fill;
        settings.background_background = 'gradient';
        settings.background_gradient_type = 'linear';
        if (g.gradientStops.length >= 2) {
            settings.background_color = convertColor({
                type: 'SOLID',
                color: g.gradientStops[0].color,
                opacity: g.gradientStops[0].color.a
            });
            settings.background_color_b = convertColor({
                type: 'SOLID',
                color: g.gradientStops[g.gradientStops.length - 1].color,
                opacity: g.gradientStops[g.gradientStops.length - 1].color.a
            });
            settings.background_gradient_angle = { unit: 'deg', size: 180 };
        }
    }
    return settings;
}
function extractCustomCSS(_node) {
    return {};
}
function extractFlexLayout(node) {
    if (!hasLayout(node) || node.layoutMode === 'NONE')
        return {};
    const settings = {};
    const isRow = node.layoutMode === 'HORIZONTAL';
    settings.flex_direction = isRow ? 'row' : 'column';
    const justifyMap = {
        MIN: 'start',
        CENTER: 'center',
        MAX: 'end',
        SPACE_BETWEEN: 'space-between'
    };
    if (node.primaryAxisAlignItems && justifyMap[node.primaryAxisAlignItems]) {
        settings.justify_content = justifyMap[node.primaryAxisAlignItems];
    }
    const alignMap = {
        MIN: 'start',
        CENTER: 'center',
        MAX: 'end',
        BASELINE: 'baseline'
    };
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
// -------------------- Media Export Functions --------------------
function exportNodeAsSvg(node) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bytes = yield node.exportAsync({ format: 'SVG' });
            return bytes;
        }
        catch (e) {
            console.error(`[F2E] Failed to export SVG for "${node.name}" (${node.id}):`, e);
            return null;
        }
    });
}
function exportNodeAsPng(node) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bytes = yield node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
            return bytes;
        }
        catch (e) {
            console.error(`[F2E] Failed to export PNG for "${node.name}" (${node.id}):`, e);
            return null;
        }
    });
}
// -------------------- Widget Creation --------------------
function createTextWidget(node) {
    const isHeading = node.fontSize > 24 ||
        node.fontName.style.toLowerCase().includes('bold');
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
        this.pendingUploads = new Map();
        this.wpConfig = config || {};
        this.pendingUploads = new Map();
    }
    uploadImageToWordPress(node, format) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.wpConfig || !this.wpConfig.url || !this.wpConfig.user || !this.wpConfig.password) {
                return null;
            }
            try {
                let bytes = null;
                let mimeType = '';
                if (format === 'SVG') {
                    bytes = yield exportNodeAsSvg(node);
                    mimeType = 'image/svg+xml';
                }
                else {
                    bytes = yield exportNodeAsPng(node);
                    mimeType = 'image/png';
                }
                if (!bytes)
                    return null;
                const id = generateGUID();
                const name = `${node.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format.toLowerCase()}`;
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        if (this.pendingUploads.has(id)) {
                            this.pendingUploads.delete(id);
                            console.warn(`[F2E] Upload timeout for ${name}`);
                            resolve(null);
                        }
                    }, 30000);
                    this.pendingUploads.set(id, (result) => {
                        clearTimeout(timeout);
                        if (result.success) {
                            resolve(result.url);
                        }
                        else {
                            console.warn(`[F2E] Upload failed for ${name}: ${result.error}`);
                            resolve(null);
                        }
                    });
                    figma.ui.postMessage({
                        type: 'upload-image-request',
                        id,
                        name,
                        mimeType,
                        data: bytes
                    });
                });
            }
            catch (e) {
                console.error('Error preparing upload:', e);
                return null;
            }
        });
    }
    compile(nodes) {
        return __awaiter(this, void 0, void 0, function* () {
            const elements = yield Promise.all(Array.from(nodes).map((node) => __awaiter(this, void 0, void 0, function* () {
                const element = yield this.processNode(node);
                if (element.elType === 'widget' && element.widgetType === 'container') {
                    element.elType = 'container';
                    element.isInner = false;
                    delete element.widgetType;
                }
                return element;
            })));
            return elements;
        });
    }
    processNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = node.name.toLowerCase();
            const widgetPrefix = 'w:';
            if (name.startsWith(widgetPrefix)) {
                const widgetSlug = name.substring(widgetPrefix.length).split(' ')[0].trim();
                if (widgetSlug) {
                    if (['container', 'section', 'image-box', 'icon-box', 'image-box-card'].includes(widgetSlug)) {
                        return this.createContainer(node);
                    }
                    return this.createExplicitWidget(node, widgetSlug);
                }
            }
            if (node.type === 'TEXT') {
                return createTextWidget(node);
            }
            if (node.type === 'FRAME' ||
                node.type === 'INSTANCE' ||
                node.type === 'COMPONENT' ||
                node.type === 'GROUP') {
                return this.createContainer(node);
            }
            if (['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'].includes(node.type)) {
                return this.createExplicitWidget(node, 'icon');
            }
            if (node.type === 'RECTANGLE') {
                return this.createExplicitWidget(node, 'image');
            }
            const settings = {
                editor: `Unsupported node type: ${node.type}. Please wrap it in a frame and name it with a 'w:' prefix if you want to export it.`
            };
            return {
                id: generateGUID(),
                elType: 'widget',
                widgetType: 'text-editor',
                settings,
                elements: []
            };
        });
    }
    createContainer(node) {
        return __awaiter(this, void 0, void 0, function* () {
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
            Object.assign(settings, extractFlexLayout(node));
            if ('width' in node && node.width > 800) {
                const anyNode = node;
                if ('primaryAxisAlignItems' in anyNode &&
                    (anyNode.primaryAxisAlignItems === 'CENTER' ||
                        anyNode.counterAxisAlignItems === 'CENTER')) {
                    settings.content_width = 'boxed';
                }
            }
            if (settings._position === 'absolute') {
                delete settings._position;
                delete settings._offset_x;
                delete settings._offset_y;
            }
            let childElements = [];
            if ('children' in node) {
                childElements = yield Promise.all(node.children.map(child => this.processNode(child)));
            }
            return {
                id: generateGUID(),
                elType: 'container',
                settings,
                elements: childElements
            };
        });
    }
    createExplicitWidget(node, widgetSlug) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log(`[F2E Debug] Processing widget: ${widgetSlug} for node: ${node.name} (${node.id})`);
            const settings = {};
            if (widgetSlug === 'button') {
                let textNode = null;
                let bgNode = null;
                let iconNode = null;
                if (node.type === 'TEXT') {
                    textNode = node;
                }
                else if ('children' in node) {
                    const frame = node;
                    textNode = frame.children.find(c => c.type === 'TEXT');
                    // Procurar ícone
                    iconNode = frame.children.find(c => ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'].includes(c.type)) || null;
                    if (hasFills(frame) && frame.fills !== figma.mixed && frame.fills.length > 0) {
                        bgNode = frame;
                    }
                    else {
                        bgNode = frame.children.find(c => (c.type === 'RECTANGLE' || c.type === 'FRAME') &&
                            hasFills(c));
                    }
                }
                // Texto do botão
                if (textNode) {
                    settings.text = textNode.characters;
                    settings.typography_typography = 'custom';
                    const typo = extractTypography(textNode);
                    Object.assign(settings, typo);
                    const textColor = extractTextColor(textNode);
                    if (textColor)
                        settings.button_text_color = textColor;
                }
                else {
                    settings.text = 'Click Here';
                }
                // Background
                if (bgNode || (hasFills(node) && node.type !== 'TEXT')) {
                    const bgSource = (bgNode || node);
                    const bgStyles = extractBackgroundAdvanced(bgSource);
                    if (bgStyles.background_color) {
                        settings.button_background_color = bgStyles.background_color;
                    }
                }
                // Ícone
                if (iconNode) {
                    const iconUrl = yield this.uploadImageToWordPress(iconNode, 'SVG');
                    if (iconUrl) {
                        settings.selected_icon = {
                            value: { url: iconUrl, id: 0, source: 'library' },
                            library: 'svg'
                        };
                    }
                    else {
                        const svgBytes = yield exportNodeAsSvg(iconNode);
                        if (svgBytes) {
                            settings.selected_icon = {
                                value: { url: `data:image/svg+xml;base64,${figma.base64Encode(svgBytes)}` },
                                library: 'svg'
                            };
                        }
                        else {
                            settings.selected_icon = { value: 'fas fa-arrow-right', library: 'fa-solid' };
                        }
                    }
                    settings.icon_align = 'right';
                    settings.icon_indent = { unit: 'px', size: 10 };
                }
                // Size baseado na altura
                if ('height' in node) {
                    const height = node.height;
                    if (height < 30)
                        settings.size = 'xs';
                    else if (height < 40)
                        settings.size = 'sm';
                    else if (height < 50)
                        settings.size = 'md';
                    else if (height < 60)
                        settings.size = 'lg';
                    else
                        settings.size = 'xl';
                }
                else {
                    settings.size = 'md';
                }
                settings.align = 'left';
                settings.link = { url: '#', is_external: false, nofollow: false };
                // Hover (cores padrão)
                if (settings.button_text_color) {
                    settings.hover_color = settings.button_text_color;
                }
                if (settings.button_background_color) {
                    settings.button_background_hover_color = settings.button_background_color;
                }
            }
            else if (widgetSlug === 'icon') {
                const url = yield this.uploadImageToWordPress(node, 'SVG');
                if (url) {
                    settings.selected_icon = {
                        value: { url, id: 0, source: 'library' },
                        library: 'svg'
                    };
                }
                else {
                    let svgBytes = yield exportNodeAsSvg(node);
                    if (svgBytes) {
                        settings.selected_icon = {
                            value: { url: `data:image/svg+xml;base64,${figma.base64Encode(svgBytes)}` },
                            library: 'svg'
                        };
                    }
                    else {
                        settings.selected_icon = { value: 'fas fa-star', library: 'fa-solid' };
                    }
                }
                if (hasFills(node) && Array.isArray(node.fills) && node.fills.length > 0) {
                    const fill = node.fills[0];
                    if (fill.type === 'SOLID') {
                        settings.primary_color = convertColor(fill);
                    }
                }
            }
            else if (widgetSlug === 'icon-box') {
                let iconNode = null;
                let titleNode = null;
                let descNode = null;
                // Find children
                if ('children' in node) {
                    const frame = node;
                    // Find Icon (Vector-like or Image)
                    iconNode = frame.children.find(c => ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'].includes(c.type) ||
                        (c.type === 'INSTANCE' || c.type === 'FRAME') && c.name.toLowerCase().includes('icon')) || null;
                    // Find Texts
                    const textNodes = frame.children.filter(c => c.type === 'TEXT');
                    if (textNodes.length > 0)
                        titleNode = textNodes[0];
                    if (textNodes.length > 1)
                        descNode = textNodes[1];
                }
                // Handle Icon
                if (iconNode) {
                    const url = yield this.uploadImageToWordPress(iconNode, 'SVG');
                    if (url) {
                        settings.selected_icon = {
                            value: { url, id: 0, source: 'library' },
                            library: 'svg'
                        };
                    }
                    else {
                        let svgBytes = yield exportNodeAsSvg(iconNode);
                        if (svgBytes) {
                            settings.selected_icon = {
                                value: { url: `data:image/svg+xml;base64,${figma.base64Encode(svgBytes)}` },
                                library: 'svg'
                            };
                        }
                        else {
                            settings.selected_icon = { value: 'fas fa-star', library: 'fa-solid' };
                        }
                    }
                    // Icon Color
                    if (hasFills(iconNode) && Array.isArray(iconNode.fills) && iconNode.fills.length > 0) {
                        const fill = iconNode.fills[0];
                        if (fill.type === 'SOLID') {
                            settings.primary_color = convertColor(fill);
                        }
                    }
                }
                // Handle Title
                if (titleNode) {
                    settings.title_text = titleNode.characters;
                    const typo = extractTypography(titleNode);
                    const color = extractTextColor(titleNode);
                    // Map typography to title_typography
                    for (const key in typo) {
                        const newKey = key.replace('typography_', 'title_typography_');
                        settings[newKey] = typo[key];
                    }
                    if (color)
                        settings.title_color = color;
                }
                else {
                    settings.title_text = 'This is the heading';
                }
                // Handle Description
                if (descNode) {
                    settings.description_text = descNode.characters;
                    const typo = extractTypography(descNode);
                    const color = extractTextColor(descNode);
                    // Map typography to description_typography
                    for (const key in typo) {
                        const newKey = key.replace('typography_', 'description_typography_');
                        settings[newKey] = typo[key];
                    }
                    if (color)
                        settings.description_color = color;
                }
                else {
                    settings.description_text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
                }
                // View (Default, Stacked, Framed) - simplified to default for now
                settings.view = 'default';
            }
            else if (widgetSlug === 'heading') {
                let textNode = null;
                if (node.type === 'TEXT') {
                    textNode = node;
                }
                else if ('children' in node) {
                    const frame = node;
                    textNode = frame.children.find(c => c.type === 'TEXT');
                }
                if (textNode) {
                    settings.title = textNode.characters;
                    const typo = extractTypography(textNode);
                    const color = extractTextColor(textNode);
                    Object.assign(settings, typo);
                    if (color)
                        settings.title_color = color;
                    // Detectar tag HTML baseado no tamanho da fonte
                    const fontSize = ((_a = typo.typography_font_size) === null || _a === void 0 ? void 0 : _a.size) || 32;
                    if (fontSize >= 48)
                        settings.header_size = 'h1';
                    else if (fontSize >= 36)
                        settings.header_size = 'h2';
                    else if (fontSize >= 28)
                        settings.header_size = 'h3';
                    else if (fontSize >= 24)
                        settings.header_size = 'h4';
                    else if (fontSize >= 20)
                        settings.header_size = 'h5';
                    else
                        settings.header_size = 'h6';
                }
                else {
                    settings.title = 'Your Title Here';
                    settings.header_size = 'h2';
                }
                settings.align = 'left';
            }
            else if (widgetSlug === 'text-editor') {
                let textNode = null;
                if (node.type === 'TEXT') {
                    textNode = node;
                }
                else if ('children' in node) {
                    const frame = node;
                    textNode = frame.children.find(c => c.type === 'TEXT');
                }
                if (textNode) {
                    // Converter para HTML básico
                    const text = textNode.characters;
                    settings.editor = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
                    const typo = extractTypography(textNode);
                    const color = extractTextColor(textNode);
                    Object.assign(settings, typo);
                    if (color)
                        settings.text_color = color;
                }
                else {
                    settings.editor = '<p>Your text here...</p>';
                }
                settings.align = 'left';
                settings.text_columns = 1;
                settings.column_gap = { unit: 'px', size: 20 };
            }
            else if (widgetSlug === 'divider') {
                settings.style = 'solid';
                settings.weight = { unit: 'px', size: 1 };
                settings.width = { unit: '%', size: 100 };
                settings.align = 'center';
                settings.gap = { unit: 'px', size: 15 };
                settings.look = 'line';
                // Extrair cor da borda se houver
                const borderStyles = extractBorderStyles(node);
                if (borderStyles.border_color) {
                    settings.color = borderStyles.border_color;
                }
                else {
                    settings.color = 'rgba(0, 0, 0, 0.1)';
                }
            }
            else if (widgetSlug === 'spacer') {
                // Extrair altura do node
                let spaceSize = 50;
                if ('height' in node) {
                    spaceSize = Math.round(node.height);
                }
                settings.space = { unit: 'px', size: spaceSize };
                settings.space_tablet = { unit: 'px', size: Math.round(spaceSize * 0.6) };
                settings.space_mobile = { unit: 'px', size: Math.round(spaceSize * 0.4) };
            }
            else if (widgetSlug === 'image') {
                const url = yield this.uploadImageToWordPress(node, 'PNG');
                if (url) {
                    settings.image = {
                        url,
                        id: 0,
                        size: 'full',
                        source: 'library'
                    };
                }
                else {
                    let pngBytes = yield exportNodeAsPng(node);
                    if (pngBytes) {
                        settings.image = {
                            url: `data:image/png;base64,${figma.base64Encode(pngBytes)}`
                        };
                    }
                    else {
                        settings.image = {
                            url: 'https://via.placeholder.com/800x600?text=Upload+Failed'
                        };
                    }
                }
                // Image settings
                settings.image_size = 'full';
                settings.align = 'center';
                settings.caption_source = 'none';
                settings.link_to = 'none';
                settings.open_lightbox = 'default';
                // Dimensões
                if ('width' in node && 'height' in node) {
                    const nodeWidth = node.width;
                    const nodeHeight = node.height;
                    settings.width = { unit: 'px', size: Math.round(nodeWidth) };
                    settings.height = 'auto';
                    settings.object_fit = 'cover';
                }
                // CSS Filters (aplicados automaticamente no final)
            }
            else {
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
            return {
                id: generateGUID(),
                elType: 'widget',
                widgetType: widgetSlug,
                settings,
                elements: []
            };
        });
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
// -------------------- Main Execution --------------------
figma.showUI(__html__, { width: 400, height: 600 });
// We need a global instance to handle the message callbacks
let compiler;
// Load saved WP config and initialize compiler
figma.clientStorage.getAsync('wp_config').then(config => {
    compiler = new ElementorCompiler(config || {});
    if (config) {
        figma.ui.postMessage({ type: 'load-wp-config', config });
    }
});
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Ensure compiler is initialized before processing messages
    if (!compiler) {
        console.warn('Compiler not yet initialized. Message deferred or ignored.');
        return;
    }
    if (msg.type === 'export-elementor') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Selecione pelo menos um frame para exportar.');
            return;
        }
        figma.notify('Gerando JSON... (Isso pode demorar se houver uploads)');
        try {
            const elements = yield compiler.compile(selection);
            const template = {
                type: 'elementor',
                siteurl: ((_a = compiler.wpConfig) === null || _a === void 0 ? void 0 : _a.url) || '',
                elements,
                version: '0.4'
            };
            figma.ui.postMessage({ type: 'export-result', data: JSON.stringify(template, null, 2) });
            figma.notify('JSON gerado! Copie e cole no Elementor (Ctrl+V).');
        }
        catch (e) {
            console.error(e);
            figma.notify('Erro na exportação. Verifique o console.');
        }
    }
    else if (msg.type === 'rename-layer') {
        const selection = figma.currentPage.selection;
        if (selection.length === 1) {
            selection[0].name = msg.newName;
            figma.notify(`Camada renomeada para: ${msg.newName}`);
        }
        else {
            figma.notify('Selecione apenas uma camada para renomear.');
        }
    }
    else if (msg.type === 'create-component') {
        // ... (Create component logic if needed, or keep existing)
        figma.notify('Inserção de componentes ainda não implementada.');
    }
    else if (msg.type === 'resize-window') {
        figma.ui.resize(msg.width, msg.height);
    }
    else if (msg.type === 'debug-structure') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0)
            return;
        const debugData = selection.map(node => ({
            name: node.name,
            type: node.type,
            id: node.id,
            children: 'children' in node ? node.children.length : 0
        }));
        figma.ui.postMessage({ type: 'debug-result', data: JSON.stringify(debugData, null, 2) });
    }
    else if (msg.type === 'upload-image-response') {
        const resolver = compiler.pendingUploads.get(msg.id);
        if (resolver) {
            resolver(msg);
            compiler.pendingUploads.delete(msg.id);
        }
    }
    else if (msg.type === 'save-wp-config') {
        yield figma.clientStorage.setAsync('wp_config', msg.config);
        compiler.wpConfig = msg.config; // Update compiler's config
        figma.notify('Configuração WP salva!');
    }
});
