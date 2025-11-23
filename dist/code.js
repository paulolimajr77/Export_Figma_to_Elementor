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
// Versão com:
// - Detecção inteligente de widgets por nomenclatura e estrutura
// - Mapeamento para widgets Elementor e Elementor Pro
// - Cache de imagens por hash para evitar duplicação na mídia WP
// -------------------- Helper Utilities --------------------
function generateGUID() {
    return 'xxxxxxxxxx'.replace(/[x]/g, () => ((Math.random() * 36) | 0).toString(36));
}
function normalizeName(name) {
    return name.trim().toLowerCase();
}
function stripWidgetPrefix(name) {
    return name.replace(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i, '').trim();
}
function convertColor(paint) {
    if (!paint || paint.type !== 'SOLID')
        return '';
    const { r, g, b } = paint.color;
    const a = paint.opacity !== undefined ? paint.opacity : 1;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
// Hash SHA-1 criptográfico para identificar o conteúdo da imagem
// SHA-1 implementation for Figma Sandbox (no crypto.subtle)
function computeHash(bytes) {
    return __awaiter(this, void 0, void 0, function* () {
        const chrsz = 8;
        const hexcase = 0;
        function safe_add(x, y) {
            const lsw = (x & 0xFFFF) + (y & 0xFFFF);
            const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        }
        function rol(num, cnt) {
            return (num << cnt) | (num >>> (32 - cnt));
        }
        function sha1_ft(t, b, c, d) {
            if (t < 20)
                return (b & c) | ((~b) & d);
            if (t < 40)
                return b ^ c ^ d;
            if (t < 60)
                return (b & c) | (b & d) | (c & d);
            return b ^ c ^ d;
        }
        function sha1_kt(t) {
            return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514;
        }
        function core_sha1(x, len) {
            x[len >> 5] |= 0x80 << (24 - len % 32);
            x[((len + 64 >> 9) << 4) + 15] = len;
            const w = Array(80);
            let a = 1732584193;
            let b = -271733879;
            let c = -1732584194;
            let d = 271733878;
            let e = -1009589776;
            for (let i = 0; i < x.length; i += 16) {
                const olda = a;
                const oldb = b;
                const oldc = c;
                const oldd = d;
                const olde = e;
                for (let j = 0; j < 80; j++) {
                    if (j < 16)
                        w[j] = x[i + j];
                    else
                        w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                    const t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)), safe_add(safe_add(e, w[j]), sha1_kt(j)));
                    e = d;
                    d = c;
                    c = rol(b, 30);
                    b = a;
                    a = t;
                }
                a = safe_add(a, olda);
                b = safe_add(b, oldb);
                c = safe_add(c, oldc);
                d = safe_add(d, oldd);
                e = safe_add(e, olde);
            }
            return [a, b, c, d, e];
        }
        function binb2hex(binarray) {
            const hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
            let str = "";
            for (let i = 0; i < binarray.length * 4; i++) {
                str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
                    hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
            }
            return str;
        }
        function bytesToWords(bytes) {
            const words = [];
            for (let i = 0; i < bytes.length; i++) {
                words[i >>> 2] |= (bytes[i] & 0xFF) << (24 - (i % 4) * 8);
            }
            return words;
        }
        const words = bytesToWords(bytes);
        const hash = core_sha1(words, bytes.length * 8);
        return binb2hex(hash);
    });
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
function exportNodeAsImage(node_1, format_1) {
    return __awaiter(this, arguments, void 0, function* (node, format, quality = 0.8) {
        try {
            if (format === 'SVG') {
                const bytes = yield node.exportAsync({ format: 'SVG' });
                return { bytes, mime: 'image/svg+xml', ext: 'svg' };
            }
            // WEBP WORKAROUND:
            // Figma sandbox cannot export WEBP directly. We export as PNG here,
            // and mark it for conversion to WEBP in the UI thread (browser).
            if (format === 'WEBP') {
                // Export as PNG first (lossless)
                const bytes = yield node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } });
                // Return as PNG but with a flag to convert to WEBP in UI
                return {
                    bytes,
                    mime: 'image/png', // Temporarily PNG
                    ext: 'webp', // Target extension
                    needsConversion: true
                };
            }
            if (format === 'JPG') {
                const bytes = yield node.exportAsync({ format: 'JPG', constraint: { type: 'SCALE', value: 1.5 } });
                return { bytes, mime: 'image/jpeg', ext: 'jpg' };
            }
            // PNG
            const bytes = yield node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } });
            return { bytes, mime: 'image/png', ext: 'png' };
        }
        catch (e) {
            console.error(`[F2E] Failed to export image for "${node.name}" (${node.id}):`, e);
            return null;
        }
    });
}
function exportNodeAsSvg(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield exportNodeAsImage(node, 'SVG');
        return result ? result.bytes : null;
    });
}
function exportNodeAsPng(node) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield exportNodeAsImage(node, 'PNG');
        return result ? result.bytes : null;
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
    // Nome amigável no Elementor
    settings._widget_title = stripWidgetPrefix(node.name) || widgetType;
    return { id: generateGUID(), elType: 'widget', widgetType, settings, elements: [] };
}
// -------------------- Main Compiler Class --------------------
class ElementorCompiler {
    constructor(config) {
        this.pendingUploads = new Map();
        // Cache por hash de conteúdo -> URL WP
        this.mediaHashCache = new Map();
        // Cache adicional de node.id -> hash
        this.nodeHashCache = new Map();
        // Quality setting (0.60 - 0.95)
        this.quality = 0.85;
        this.wpConfig = config || {};
    }
    // -------------------- Upload com cache por hash --------------------
    // -------------------- Upload com cache por hash --------------------
    uploadImageToWordPress(node_1) {
        return __awaiter(this, arguments, void 0, function* (node, format = 'WEBP') {
            if (!this.wpConfig || !this.wpConfig.url || !this.wpConfig.user || !this.wpConfig.password) {
                console.warn('[F2E] WP config ausente, upload ignorado.');
                return null;
            }
            try {
                // Se for SVG, força SVG. Se for Raster, tenta WEBP (padrão) ou PNG.
                const targetFormat = format === 'SVG' ? 'SVG' : 'WEBP';
                const result = yield exportNodeAsImage(node, targetFormat, this.quality);
                if (!result)
                    return null;
                const { bytes, mime, ext, needsConversion } = result;
                const hash = yield computeHash(bytes);
                if (this.mediaHashCache.has(hash)) {
                    console.log(`[F2E] Cache hit para imagem ${hash}`);
                    return this.mediaHashCache.get(hash);
                }
                this.nodeHashCache.set(node.id, hash);
                const id = generateGUID();
                // Nome padronizado: w_[node.id]_[hash].ext
                const safeId = node.id.replace(/[^a-z0-9]/gi, '_');
                const name = `w_${safeId}_${hash}.${ext}`;
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        if (this.pendingUploads.has(id)) {
                            this.pendingUploads.delete(id);
                            console.warn(`[F2E] Upload timeout para ${name}`);
                            resolve(null);
                        }
                    }, 90000);
                    this.pendingUploads.set(id, (result) => {
                        clearTimeout(timeout);
                        if (result.success) {
                            this.mediaHashCache.set(hash, result.url);
                            resolve(result.url);
                        }
                        else {
                            console.warn(`[F2E] Upload falhou para ${name}: ${result.error}`);
                            resolve(null);
                        }
                    });
                    figma.ui.postMessage({
                        type: 'upload-image-request',
                        id,
                        name,
                        mimeType: mime,
                        data: bytes,
                        needsConversion: !!needsConversion
                    });
                });
            }
            catch (e) {
                console.error('Error preparing upload:', e);
                return null;
            }
        });
    }
    // -------------------- Heurísticas / Detectores --------------------
    isTextNode(node) {
        return node.type === 'TEXT';
    }
    isImageNode(node) {
        if (node.type === 'RECTANGLE') {
            return hasImageFill(node);
        }
        if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') {
            const g = node;
            if (hasFills(g) && Array.isArray(g.fills) && g.fills.some((f) => f.type === 'IMAGE')) {
                return true;
            }
        }
        const lname = node.name.toLowerCase();
        return lname.includes('image') || lname.includes('img') || lname.includes('foto');
    }
    looksLikeImageBox(node) {
        if (!('children' in node))
            return false;
        const children = node.children;
        const images = children.filter(c => this.isImageNode(c));
        const texts = children.filter(c => this.isTextNode(c));
        if (images.length !== 1)
            return false;
        if (texts.length < 1)
            return false;
        const lname = node.name.toLowerCase();
        if (lname.includes('image-box') || lname.includes('card') || lname.includes('service'))
            return true;
        if (texts.length >= 2)
            return true;
        return false;
    }
    looksLikeIconBox(node) {
        if (!('children' in node))
            return false;
        const children = node.children;
        const icons = children.filter(c => isIconNode(c));
        const texts = children.filter(c => this.isTextNode(c));
        if (icons.length === 0)
            return false;
        if (texts.length === 0)
            return false;
        const lname = node.name.toLowerCase();
        return lname.includes('icon-box') || lname.includes('feature') || lname.includes('benefit');
    }
    looksLikeButton(node) {
        if (!('children' in node))
            return false;
        const children = node.children;
        const texts = children.filter(c => this.isTextNode(c));
        if (texts.length !== 1)
            return false;
        const t = texts[0];
        const txt = t.characters.toLowerCase();
        const lname = node.name.toLowerCase();
        if (lname.includes('btn') || lname.includes('button'))
            return true;
        if (['saiba mais', 'comprar', 'ver mais', 'assinar'].some(k => txt.includes(k)))
            return true;
        if (t.fontSize !== figma.mixed && t.fontSize >= 14 && t.fontSize <= 24) {
            return true;
        }
        return false;
    }
    // Pro: estruturas mais complexas – aqui mapeamos só o widget, sem tentar extrair tudo
    looksLikePriceTable(node) {
        if (!('children' in node))
            return false;
        const lname = node.name.toLowerCase();
        if (lname.includes('price-table') || lname.includes('pricing') || lname.includes('plano'))
            return true;
        return false;
    }
    looksLikeFlipBox(node) {
        if (!('children' in node))
            return false;
        const lname = node.name.toLowerCase();
        return lname.includes('flip-box') || lname.includes('flip');
    }
    looksLikeTestimonial(node) {
        if (!('children' in node))
            return false;
        const lname = node.name.toLowerCase();
        return lname.includes('testimonial') || lname.includes('depoimento');
    }
    looksLikeLoopGrid(node) {
        if (!('children' in node))
            return false;
        const frame = node;
        if (frame.children.length < 2)
            return false;
        // Check if children are similar (e.g., same name pattern or same type/size)
        const firstChild = frame.children[0];
        const similarChildren = frame.children.filter(c => c.type === firstChild.type &&
            Math.abs(c.width - firstChild.width) < 2 &&
            Math.abs(c.height - firstChild.height) < 2);
        return similarChildren.length >= 2;
    }
    looksLikeCarousel(node) {
        if (!('children' in node))
            return false;
        const frame = node;
        if (frame.layoutMode === 'HORIZONTAL' && frame.children.length > 1) {
            return this.looksLikeLoopGrid(node);
        }
        const lname = node.name.toLowerCase();
        return lname.includes('carousel') || lname.includes('slider') || lname.includes('slide');
    }
    looksLikeHeading(node) {
        if (node.type !== 'TEXT')
            return false;
        const text = node;
        if (text.fontSize !== figma.mixed && text.fontSize > 20)
            return true;
        if (text.fontName.style.toLowerCase().includes('bold'))
            return true;
        return false;
    }
    detectWidgetType(node) {
        const lname = node.name.toLowerCase();
        // 1. Check specific names
        if (lname.includes('button') || lname.includes('btn') || lname.includes('cta'))
            return 'button';
        if (lname.includes('image') || lname.includes('img') || lname.includes('foto'))
            return 'image';
        if (lname.includes('icon') || lname.includes('ico'))
            return 'icon';
        if (lname.includes('heading') || lname.includes('title') || lname.includes('título'))
            return 'heading';
        if (lname.includes('text') || lname.includes('desc') || lname.includes('paragraph'))
            return 'text-editor';
        if (lname.includes('input') || lname.includes('field'))
            return 'form';
        // 2. Check structure/content
        if (this.looksLikeButton(node))
            return 'button';
        if (this.looksLikeImageBox(node))
            return 'image-box';
        if (this.looksLikeIconBox(node))
            return 'icon-box';
        if (this.looksLikeLoopGrid(node))
            return 'loop-grid';
        if (this.looksLikeCarousel(node))
            return 'image-carousel';
        if (this.looksLikePriceTable(node))
            return 'price-table';
        if (this.looksLikeFlipBox(node))
            return 'flip-box';
        if (this.looksLikeTestimonial(node))
            return 'testimonial';
        // 3. Check primitive types
        if (node.type === 'TEXT') {
            return this.looksLikeHeading(node) ? 'heading' : 'text-editor';
        }
        if (this.isImageNode(node))
            return 'image';
        if (isIconNode(node))
            return 'icon';
        // 4. Containers
        if (hasLayout(node) || node.type === 'GROUP')
            return 'container';
        return null;
    }
    // -------------------- Compilação --------------------
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
            const rawName = node.name || '';
            const name = normalizeName(rawName);
            // 1) Nomenclatura explícita (Prefixos)
            const prefixMatch = rawName.match(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i);
            if (prefixMatch) {
                const prefix = prefixMatch[0].toLowerCase();
                let slug = rawName.substring(prefix.length).trim().toLowerCase().split(' ')[0];
                // Normalização de slugs
                if (prefix === 'woo:')
                    slug = `woocommerce-${slug}`;
                if (prefix === 'loop:')
                    slug = `loop-${slug}`;
                if (prefix === 'slider:')
                    slug = 'slides';
                if (prefix === 'media:')
                    slug = `media-${slug}`;
                // Casos especiais
                if (slug === 'carousel')
                    slug = 'image-carousel';
                if (slug === 'product-title')
                    slug = 'woocommerce-product-title';
                if (slug === 'product-price')
                    slug = 'woocommerce-product-price';
                if (slug === 'product-image')
                    slug = 'woocommerce-product-image';
                if (slug === 'add-to-cart')
                    slug = 'woocommerce-product-add-to-cart';
                if (['container', 'section', 'inner-section', 'inner-container', 'column', 'row'].includes(slug)) {
                    return this.createContainer(node);
                }
                return this.createExplicitWidget(node, slug);
            }
            // 2) Heurísticas de detecção (quando não há prefixo)
            const detectedType = this.detectWidgetType(node);
            if (detectedType) {
                console.log(`[F2E Debug] Detected ${detectedType} for ${node.name}`);
                if (detectedType === 'container') {
                    return this.createContainer(node);
                }
                return this.createExplicitWidget(node, detectedType);
            }
            // 3) Tipos base
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
                // Se tiver imagem, trata como image
                if (this.isImageNode(node)) {
                    return this.createExplicitWidget(node, 'image');
                }
                return this.createContainer(node);
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
            // Nome amigável do container
            const clean = stripWidgetPrefix(node.name);
            if (clean) {
                settings._widget_title = clean;
                settings._element_id = clean;
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
            var _a, _b, _c, _d, _e;
            console.log(`[F2E Debug] Processing widget: ${widgetSlug} for node: ${node.name} (${node.id})`);
            // Handle known navigation helpers as Icons to prevent Elementor errors
            if (['forward', 'next', 'prev', 'previous', 'back', 'arrow-right', 'arrow-left'].includes(widgetSlug)) {
                widgetSlug = 'icon';
            }
            const settings = {};
            const cleanTitle = stripWidgetPrefix(node.name);
            if (cleanTitle) {
                settings._widget_title = cleanTitle;
                settings._element_id = cleanTitle;
            }
            else {
                settings._widget_title = widgetSlug;
            }
            // -------------------- BUTTON --------------------
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
                    iconNode = frame.children.find(c => ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'].includes(c.type)) || null;
                    if (hasFills(frame) && frame.fills !== figma.mixed && frame.fills.length > 0) {
                        bgNode = frame;
                    }
                    else {
                        bgNode = frame.children.find(c => (c.type === 'RECTANGLE' || c.type === 'FRAME') &&
                            hasFills(c));
                    }
                }
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
                    settings.text = 'Button';
                }
                if (bgNode || (hasFills(node) && node.type !== 'TEXT')) {
                    const bgSource = (bgNode || node);
                    const bgStyles = extractBackgroundAdvanced(bgSource);
                    if (bgStyles.background_color) {
                        settings.button_background_color = bgStyles.background_color;
                    }
                }
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
                settings.align = 'center';
                settings.link = { url: '#', is_external: false, nofollow: false };
                if (settings.button_text_color) {
                    settings.hover_color = settings.button_text_color;
                }
                if (settings.button_background_color) {
                    settings.button_background_hover_color = settings.button_background_color;
                }
            }
            // -------------------- ICON --------------------
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
            // -------------------- ICON BOX --------------------
            else if (widgetSlug === 'icon-box') {
                let iconNode = null;
                let titleNode = null;
                let descNode = null;
                if ('children' in node) {
                    const frame = node;
                    iconNode = frame.children.find(c => ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'].includes(c.type) ||
                        ((c.type === 'INSTANCE' || c.type === 'FRAME') && c.name.toLowerCase().includes('icon'))) || null;
                    const textNodes = frame.children.filter(c => c.type === 'TEXT');
                    if (textNodes.length > 0)
                        titleNode = textNodes[0];
                    if (textNodes.length > 1)
                        descNode = textNodes[1];
                }
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
                    if (hasFills(iconNode) && Array.isArray(iconNode.fills) && iconNode.fills.length > 0) {
                        const fill = iconNode.fills[0];
                        if (fill.type === 'SOLID') {
                            settings.primary_color = convertColor(fill);
                        }
                    }
                }
                if (titleNode) {
                    settings.title_text = titleNode.characters;
                    const typo = extractTypography(titleNode);
                    const color = extractTextColor(titleNode);
                    for (const key in typo) {
                        const newKey = key.replace('typography_', 'title_typography_');
                        settings[newKey] = typo[key];
                    }
                    if (color)
                        settings.title_color = color;
                }
                else {
                    settings.title_text = cleanTitle || 'Título';
                }
                if (descNode) {
                    settings.description_text = descNode.characters;
                    const typo = extractTypography(descNode);
                    const color = extractTextColor(descNode);
                    for (const key in typo) {
                        const newKey = key.replace('typography_', 'description_typography_');
                        settings[newKey] = typo[key];
                    }
                    if (color)
                        settings.description_color = color;
                }
                else {
                    settings.description_text = 'Descrição do item.';
                }
                settings.view = 'default';
            }
            // -------------------- IMAGE BOX --------------------
            else if (widgetSlug === 'image-box') {
                let imageNode = null;
                let titleNode = null;
                let descNode = null;
                if ('children' in node) {
                    const frame = node;
                    imageNode = frame.children.find(c => this.isImageNode(c)) || null;
                    const textNodes = frame.children.filter(c => c.type === 'TEXT');
                    if (textNodes.length > 0)
                        titleNode = textNodes[0];
                    if (textNodes.length > 1)
                        descNode = textNodes[1];
                }
                if (imageNode) {
                    const url = yield this.uploadImageToWordPress(imageNode, 'PNG');
                    if (url) {
                        settings.image = { url, id: 0 };
                    }
                    else {
                        settings.image = { url: '', id: 0 };
                    }
                }
                else {
                    settings.image = { url: '', id: 0 };
                }
                if (titleNode) {
                    settings.title_text = titleNode.characters;
                    const typo = extractTypography(titleNode);
                    const color = extractTextColor(titleNode);
                    for (const key in typo) {
                        const newKey = key.replace('typography_', 'title_typography_');
                        settings[newKey] = typo[key];
                    }
                    if (color)
                        settings.title_color = color;
                }
                else {
                    settings.title_text = cleanTitle || 'Título';
                }
                if (descNode) {
                    settings.description_text = descNode.characters;
                    const typo = extractTypography(descNode);
                    const color = extractTextColor(descNode);
                    for (const key in typo) {
                        const newKey = key.replace('typography_', 'description_typography_');
                        settings[newKey] = typo[key];
                    }
                    if (color)
                        settings.description_color = color;
                }
                else {
                    settings.description_text = 'Descrição do serviço / card.';
                }
                settings.image_position = 'top';
                settings.title_size = 'default';
                settings.link = { url: '#', is_external: false, nofollow: false };
            }
            // -------------------- HEADING --------------------
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
                    settings.title = cleanTitle || 'Título';
                    settings.header_size = 'h2';
                }
                settings.align = 'left';
            }
            // -------------------- TEXT EDITOR --------------------
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
                    const text = textNode.characters;
                    settings.editor = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
                    const typo = extractTypography(textNode);
                    const color = extractTextColor(textNode);
                    Object.assign(settings, typo);
                    if (color)
                        settings.text_color = color;
                }
                else {
                    settings.editor = '<p>Seu texto aqui...</p>';
                }
                settings.align = 'left';
                settings.text_columns = 1;
                settings.column_gap = { unit: 'px', size: 20 };
            }
            // -------------------- DIVIDER --------------------
            else if (widgetSlug === 'divider') {
                settings.style = 'solid';
                settings.weight = { unit: 'px', size: 1 };
                settings.width = { unit: '%', size: 100 };
                settings.align = 'center';
                settings.gap = { unit: 'px', size: 15 };
                settings.look = 'line';
                const borderStyles = extractBorderStyles(node);
                if (borderStyles.border_color) {
                    settings.color = borderStyles.border_color;
                }
                else {
                    settings.color = 'rgba(0, 0, 0, 0.1)';
                }
            }
            // -------------------- SPACER --------------------
            else if (widgetSlug === 'spacer') {
                let spaceSize = 50;
                if ('height' in node) {
                    spaceSize = Math.round(node.height);
                }
                settings.space = { unit: 'px', size: spaceSize };
                settings.space_tablet = { unit: 'px', size: Math.round(spaceSize * 0.6) };
                settings.space_mobile = { unit: 'px', size: Math.round(spaceSize * 0.4) };
            }
            // -------------------- IMAGE --------------------
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
                    settings.image = {
                        url: '',
                        id: 0,
                        size: 'full',
                        source: 'library'
                    };
                }
                settings.image_size = 'full';
                settings.align = 'center';
                settings.caption_source = 'none';
                settings.link_to = 'none';
                settings.open_lightbox = 'default';
                if ('width' in node) {
                    const nodeWidth = node.width;
                    settings.width = { unit: 'px', size: Math.round(nodeWidth) };
                    settings.height = 'auto';
                    settings.object_fit = 'cover';
                }
            }
            // -------------------- VIDEO --------------------
            else if (widgetSlug === 'video') {
                settings.video_type = 'youtube';
                settings.youtube_url = 'https://www.youtube.com/watch?v=XHOmBV4js_E';
                settings.aspect_ratio = '169';
                settings.autoplay = 'no';
                settings.mute = 'no';
            }
            // -------------------- ALERT --------------------
            else if (widgetSlug === 'alert') {
                let titleNode = null;
                let descNode = null;
                if ('children' in node) {
                    const frame = node;
                    const textNodes = frame.children.filter(c => c.type === 'TEXT');
                    if (textNodes.length > 0)
                        titleNode = textNodes[0];
                    if (textNodes.length > 1)
                        descNode = textNodes[1];
                }
                settings.alert_type = 'info';
                settings.alert_title = titleNode ? titleNode.characters : (cleanTitle || 'Atenção!');
                settings.alert_description = descNode ? descNode.characters : 'Mensagem informativa.';
                settings.show_dismiss = 'yes';
            }
            // -------------------- COUNTER --------------------
            else if (widgetSlug === 'counter') {
                let numberNode = null;
                let titleNode = null;
                if ('children' in node) {
                    const frame = node;
                    const textNodes = frame.children.filter(c => c.type === 'TEXT');
                    if (textNodes.length > 0)
                        numberNode = textNodes[0];
                    if (textNodes.length > 1)
                        titleNode = textNodes[1];
                }
                const numberText = numberNode ? numberNode.characters : '100';
                settings.starting_number = 0;
                settings.ending_number = parseInt(numberText.replace(/\D/g, '')) || 100;
                settings.duration = 2000;
                settings.thousand_separator = ',';
                settings.title = titleNode ? titleNode.characters : (cleanTitle || 'Título');
                if (numberNode) {
                    const typo = extractTypography(numberNode);
                    const color = extractTextColor(numberNode);
                    for (const key in typo) {
                        const newKey = key.replace('typography_', 'number_typography_');
                        settings[newKey] = typo[key];
                    }
                    if (color)
                        settings.number_color = color;
                }
                if (titleNode) {
                    const typo = extractTypography(titleNode);
                    const color = extractTextColor(titleNode);
                    for (const key in typo) {
                        const newKey = key.replace('typography_', 'title_typography_');
                        settings[newKey] = typo[key];
                    }
                    if (color)
                        settings.title_color = color;
                }
            }
            // -------------------- PROGRESS --------------------
            else if (widgetSlug === 'progress') {
                let titleNode = null;
                if ('children' in node) {
                    const frame = node;
                    titleNode = frame.children.find(c => c.type === 'TEXT');
                }
                settings.title = titleNode ? titleNode.characters : (cleanTitle || 'Progresso');
                settings.percent = { unit: '%', size: 70 };
                settings.inner_text = 'yes';
                settings.display_percentage = 'show';
                const bgStyles = extractBackgroundAdvanced(node);
                if (bgStyles.background_color) {
                    settings.progress_color = bgStyles.background_color;
                }
            }
            // -------------------- ACCORDION --------------------
            else if (widgetSlug === 'accordion') {
                const items = [];
                if ('children' in node) {
                    const frame = node;
                    for (const child of frame.children) {
                        if (!('children' in child))
                            continue;
                        const itemFrame = child;
                        const textNodes = itemFrame.children.filter(c => c.type === 'TEXT');
                        items.push({
                            tab_title: ((_b = textNodes[0]) === null || _b === void 0 ? void 0 : _b.characters) || 'Título do Acordeão',
                            tab_content: ((_c = textNodes[1]) === null || _c === void 0 ? void 0 : _c.characters) || 'Conteúdo do acordeão.',
                            _id: generateGUID().substring(0, 7)
                        });
                    }
                }
                settings.tabs = items.length > 0 ? items : [
                    { tab_title: 'Título 1', tab_content: 'Conteúdo 1', _id: generateGUID().substring(0, 7) }
                ];
                settings.selected_item = '1';
            }
            // -------------------- TABS --------------------
            else if (widgetSlug === 'tabs') {
                const items = [];
                if ('children' in node) {
                    const frame = node;
                    for (const child of frame.children) {
                        if (!('children' in child))
                            continue;
                        const itemFrame = child;
                        const textNodes = itemFrame.children.filter(c => c.type === 'TEXT');
                        items.push({
                            tab_title: ((_d = textNodes[0]) === null || _d === void 0 ? void 0 : _d.characters) || 'Tab',
                            tab_content: ((_e = textNodes[1]) === null || _e === void 0 ? void 0 : _e.characters) || 'Conteúdo da tab.',
                            _id: generateGUID().substring(0, 7)
                        });
                    }
                }
                settings.tabs = items.length > 0 ? items : [
                    { tab_title: 'Tab 1', tab_content: 'Conteúdo 1', _id: generateGUID().substring(0, 7) }
                ];
                settings.type = 'horizontal';
            }
            // -------------------- GALLERY --------------------
            else if (widgetSlug === 'basic-gallery' || widgetSlug === 'gallery') {
                const galleryImages = [];
                if ('children' in node) {
                    const frame = node;
                    for (const child of frame.children) {
                        if (child.type === 'RECTANGLE' || (hasFills(child) && child.type !== 'TEXT')) {
                            const url = yield this.uploadImageToWordPress(child, 'PNG');
                            if (url) {
                                galleryImages.push({ id: 0, url });
                            }
                        }
                    }
                }
                settings.gallery = galleryImages.length > 0 ? galleryImages : [];
                settings.gallery_layout = 'grid';
                settings.columns = 3;
                settings.image_size = 'medium';
                settings.gap = { unit: 'px', size: 10 };
            }
            // -------------------- SOUNDCLOUD --------------------
            else if (widgetSlug === 'soundcloud') {
                settings.url = 'https://soundcloud.com/';
                settings.visual = 'yes';
                settings.auto_play = 'no';
            }
            // -------------------- MAPS --------------------
            else if (widgetSlug === 'google-maps' || widgetSlug === 'google_maps') {
                settings.address = 'São Paulo, Brasil';
                settings.zoom = { size: 10 };
                settings.height = { unit: 'px', size: 300 };
            }
            // -------------------- HTML --------------------
            else if (widgetSlug === 'html') {
                let textNode = null;
                if (node.type === 'TEXT') {
                    textNode = node;
                }
                else if ('children' in node) {
                    const frame = node;
                    textNode = frame.children.find(c => c.type === 'TEXT');
                }
                settings.html = textNode ? textNode.characters : '<!-- HTML personalizado -->';
            }
            // -------------------- SHORTCODE --------------------
            else if (widgetSlug === 'shortcode') {
                let textNode = null;
                if (node.type === 'TEXT') {
                    textNode = node;
                }
                else if ('children' in node) {
                    const frame = node;
                    textNode = frame.children.find(c => c.type === 'TEXT');
                }
                settings.shortcode = textNode ? textNode.characters : '[seu_shortcode]';
            }
            // -------------------- ELEMENTOR PRO (básicos) --------------------
            else if (widgetSlug === 'price-table' || widgetSlug === 'price_table') {
                settings.heading = cleanTitle || 'Plano';
                settings.price = '99';
                settings.currency = 'R$';
                settings.period = '/mês';
            }
            else if (widgetSlug === 'flip-box' || widgetSlug === 'flip_box') {
                settings.front_title = cleanTitle || 'Frente';
                settings.back_title = 'Verso';
            }
            else if (widgetSlug === 'testimonial') {
                settings.testimonial_content = 'Texto do depoimento.';
                settings.testimonial_name = cleanTitle || 'Cliente';
            }
            else if (widgetSlug === 'form') {
                settings.form_id = 0; // usuário ajusta depois
            }
            else if (widgetSlug === 'nav-menu' || widgetSlug === 'nav_menu') {
                settings.layout = 'horizontal';
            }
            else if (widgetSlug === 'slides') {
                settings.slides = [
                    { heading: cleanTitle || 'Slide 1', description: 'Descrição do slide', _id: generateGUID().substring(0, 7) }
                ];
            }
            // -------------------- SITE LOGO --------------------
            else if (widgetSlug === 'site-logo' || widgetSlug === 'theme-site-logo') {
                // Usually 'theme-site-logo' in Elementor Pro
                widgetSlug = 'theme-site-logo';
                settings.align = 'left';
                settings.link = { url: '', is_external: false, nofollow: false };
            }
            // -------------------- MEDIA CAROUSEL --------------------
            else if (widgetSlug === 'media-carousel' || widgetSlug === 'media_carousel') {
                settings.skin = 'carousel';
                settings.effect = 'slide';
                settings.slides_per_view = '3';
                // Placeholder slides
                settings.slides = [
                    { image: { url: '', id: 0 }, _id: generateGUID().substring(0, 7) },
                    { image: { url: '', id: 0 }, _id: generateGUID().substring(0, 7) },
                    { image: { url: '', id: 0 }, _id: generateGUID().substring(0, 7) }
                ];
            }
            // -------------------- DEFAULT GENÉRICO --------------------
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
            // Estilos genéricos aplicados ao node principal
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
// Global instance
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
        // Set quality from message
        if (msg.quality) {
            compiler.quality = msg.quality;
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
        compiler.wpConfig = msg.config;
        figma.notify('Configuração WP salva!');
    }
});
