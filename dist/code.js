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
// Versão Final Corrigida (v2):
// - FIX: Textos não são mais confundidos com Ícones/Imagens na detecção automática.
// - FIX: Adiciona 'image_size' redundante em Image Box para forçar a largura.
// - FIX: Garante tipos numéricos em padding/margin para compatibilidade.
// - Mantém detecção robusta de Backgrounds e Bordas.
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
function isArray(value) {
    return Array.isArray(value);
}
// Detecta a posição relativa entre dois nós (Top, Left, Right) para Image Box
function detectRelativePosition(source, target) {
    if (!source.absoluteBoundingBox || !target.absoluteBoundingBox)
        return 'top';
    const b1 = source.absoluteBoundingBox;
    const b2 = target.absoluteBoundingBox;
    const c1 = { x: b1.x + b1.width / 2, y: b1.y + b1.height / 2 };
    const c2 = { x: b2.x + b2.width / 2, y: b2.y + b2.height / 2 };
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    if (Math.abs(dy) > Math.abs(dx)) {
        return 'top';
    }
    else {
        return dx < 0 ? 'left' : 'right';
    }
}
// Hash SHA-1
function computeHash(bytes) {
    return __awaiter(this, void 0, void 0, function* () {
        const chrsz = 8;
        function rol(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
        function safe_add(x, y) {
            const lsw = (x & 0xFFFF) + (y & 0xFFFF);
            const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
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
            let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776;
            for (let i = 0; i < x.length; i += 16) {
                const olda = a, oldb = b, oldc = c, oldd = d, olde = e;
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
            const hex_tab = "0123456789abcdef";
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
        return binb2hex(core_sha1(bytesToWords(bytes), bytes.length * 8));
    });
}
// -------------------- Type Guards --------------------
function hasFills(node) { return 'fills' in node; }
function hasStrokes(node) { return 'strokes' in node; }
function hasEffects(node) { return 'effects' in node; }
function hasLayout(node) { return 'layoutMode' in node; }
function hasCornerRadius(node) { return 'cornerRadius' in node || 'topLeftRadius' in node; }
// -------------------- Extraction Functions --------------------
function extractTypography(node) {
    const settings = {};
    settings.typography_typography = 'custom';
    if (node.fontSize !== figma.mixed)
        settings.typography_font_size = { unit: 'px', size: Math.round(node.fontSize) };
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
        if (node.lineHeight.unit === 'PIXELS')
            settings.typography_line_height = { unit: 'px', size: Math.round(node.lineHeight.value) };
        else if (node.lineHeight.unit === 'PERCENT')
            settings.typography_line_height = { unit: 'em', size: (node.lineHeight.value / 100).toFixed(2) };
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
    if (node.textDecoration === 'UNDERLINE')
        settings.typography_text_decoration = 'underline';
    if (node.textCase === 'UPPER')
        settings.typography_text_transform = 'uppercase';
    return settings;
}
function extractTextColor(node) {
    if (!hasFills(node) || !isArray(node.fills) || node.fills.length === 0)
        return '';
    const fill = node.fills[0];
    if (fill.type === 'SOLID')
        return convertColor(fill);
    return '';
}
function extractBorderStyles(node) {
    const settings = {};
    if (hasStrokes(node) && isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke.type === 'SOLID') {
            settings.border_color = convertColor(stroke);
            settings.border_border = 'solid';
            if (node.strokeWeight !== figma.mixed) {
                const w = node.strokeWeight;
                settings.border_width = { unit: 'px', top: w, right: w, bottom: w, left: w, isLinked: true };
            }
        }
    }
    if (hasCornerRadius(node)) {
        const anyNode = node;
        if (anyNode.cornerRadius !== figma.mixed && typeof anyNode.cornerRadius === 'number') {
            const r = anyNode.cornerRadius;
            settings.border_radius = { unit: 'px', top: r, right: r, bottom: r, left: r, isLinked: true };
        }
        else {
            settings.border_radius = {
                unit: 'px',
                top: anyNode.topLeftRadius || 0, right: anyNode.topRightRadius || 0,
                bottom: anyNode.bottomRightRadius || 0, left: anyNode.bottomLeftRadius || 0,
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
function extractOpacity(node) {
    if ('opacity' in node && node.opacity !== 1)
        return { _opacity: { unit: 'px', size: node.opacity } };
    return {};
}
function extractTransform(node) {
    const settings = {};
    if ('rotation' in node && node.rotation !== 0) {
        settings._transform_rotate_popover = 'custom';
        settings._transform_rotateZ_effect = { unit: 'deg', size: Math.round(node.rotation) };
    }
    return settings;
}
function extractPadding(node) {
    var _a, _b, _c, _d;
    const frame = node;
    const top = (_a = frame.paddingTop) !== null && _a !== void 0 ? _a : 0;
    const right = (_b = frame.paddingRight) !== null && _b !== void 0 ? _b : 0;
    const bottom = (_c = frame.paddingBottom) !== null && _c !== void 0 ? _c : 0;
    const left = (_d = frame.paddingLeft) !== null && _d !== void 0 ? _d : 0;
    const isLinked = top === right && top === bottom && top === left;
    // Enforce numbers here, although Elementor accepts strings, numbers are cleaner
    return { padding: { unit: 'px', top: top, right: right, bottom: bottom, left: left, isLinked } };
}
function extractMargin(node) {
    const parent = node.parent;
    if (!parent || !('layoutMode' in parent) || parent.layoutMode !== 'NONE')
        return {};
    const margin = {};
    const threshold = 2;
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
// -------------------- Background & Media Export --------------------
function exportNodeAsImage(node_1, format_1) {
    return __awaiter(this, arguments, void 0, function* (node, format, quality = 0.85) {
        try {
            if (format === 'SVG') {
                const bytes = yield node.exportAsync({ format: 'SVG' });
                return { bytes, mime: 'image/svg+xml', ext: 'svg' };
            }
            if (format === 'WEBP') {
                const bytes = yield node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
                return { bytes, mime: 'image/png', ext: 'webp', needsConversion: true };
            }
            if (format === 'JPG') {
                const bytes = yield node.exportAsync({ format: 'JPG', constraint: { type: 'SCALE', value: 2 } });
                return { bytes, mime: 'image/jpeg', ext: 'jpg' };
            }
            const bytes = yield node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
            return { bytes, mime: 'image/png', ext: 'png' };
        }
        catch (e) {
            console.error(`[F2E] Failed to export image for "${node.name}" (${node.id}):`, e);
            return null;
        }
    });
}
// Advanced Background Extraction (Solids, Gradients, Images)
function extractBackgroundAdvanced(node, compiler) {
    return __awaiter(this, void 0, void 0, function* () {
        const settings = {};
        if (!hasFills(node) || !isArray(node.fills) || node.fills.length === 0)
            return settings;
        const visibleFills = node.fills.filter(f => f.visible !== false);
        if (visibleFills.length === 0)
            return settings;
        const bgFill = visibleFills[visibleFills.length - 1];
        if (bgFill.type === 'SOLID') {
            settings.background_background = 'classic';
            settings.background_color = convertColor(bgFill);
        }
        else if (bgFill.type === 'IMAGE') {
            settings.background_background = 'classic';
            const bgUrl = yield compiler.uploadImageToWordPress(node, 'WEBP');
            if (bgUrl)
                settings.background_image = { url: bgUrl, id: 0, source: 'library' };
            settings.background_position = 'center center';
            settings.background_size = 'cover';
            settings.background_repeat = 'no-repeat';
        }
        else if (bgFill.type === 'GRADIENT_LINEAR' || bgFill.type === 'GRADIENT_RADIAL') {
            settings.background_background = 'gradient';
            settings.background_gradient_type = bgFill.type === 'GRADIENT_RADIAL' ? 'radial' : 'linear';
            const stops = bgFill.gradientStops;
            if (stops.length > 0) {
                settings.background_color = convertColor({ type: 'SOLID', color: stops[0].color, opacity: stops[0].color.a });
                settings.background_color_stop = { unit: '%', size: Math.round(stops[0].position * 100) };
            }
            if (stops.length > 1) {
                settings.background_color_b = convertColor({ type: 'SOLID', color: stops[stops.length - 1].color, opacity: stops[stops.length - 1].color.a });
                settings.background_color_b_stop = { unit: '%', size: Math.round(stops[stops.length - 1].position * 100) };
            }
            if (bgFill.type === 'GRADIENT_LINEAR')
                settings.background_gradient_angle = { unit: 'deg', size: 180 };
        }
        return settings;
    });
}
function extractFlexLayout(node) {
    if (!hasLayout(node) || node.layoutMode === 'NONE')
        return {};
    const settings = {};
    const isRow = node.layoutMode === 'HORIZONTAL';
    settings.flex_direction = isRow ? 'row' : 'column';
    const justifyMap = { MIN: 'start', CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between' };
    const alignMap = { MIN: 'start', CENTER: 'center', MAX: 'end', BASELINE: 'baseline', STRETCH: 'stretch' };
    if (node.primaryAxisAlignItems && justifyMap[node.primaryAxisAlignItems])
        settings.justify_content = justifyMap[node.primaryAxisAlignItems];
    if (node.counterAxisAlignItems && alignMap[node.counterAxisAlignItems])
        settings.align_items = alignMap[node.counterAxisAlignItems];
    if (node.itemSpacing && node.itemSpacing > 0) {
        settings.gap = { unit: 'px', size: node.itemSpacing, column: node.itemSpacing, row: node.itemSpacing, isLinked: true };
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
    return hasFills(node) && isArray(node.fills) && node.fills.some(p => p.type === 'IMAGE');
}
// -------------------- Container Detection Logic --------------------
function isExternalContainer(node, isTopLevel = false) {
    if (!hasLayout(node))
        return false;
    const frame = node;
    const lname = node.name.toLowerCase();
    if (lname.startsWith('c:section') || lname.startsWith('c:boxed'))
        return true;
    if (isTopLevel)
        return true;
    if (frame.width > 900)
        return true;
    const sectionKeywords = ['section', 'hero', 'header', 'footer', 'banner', 'cta'];
    if (sectionKeywords.some(kw => lname.includes(kw)))
        return true;
    return false;
}
function isInnerContainer(node, parentNode) {
    if (!hasLayout(node))
        return false;
    const frame = node;
    const lname = node.name.toLowerCase();
    if (lname.startsWith('c:inner') || lname.startsWith('c:row') || lname.startsWith('c:col'))
        return true;
    if (!parentNode)
        return false;
    if (hasLayout(parentNode)) {
        const parentFrame = parentNode;
        if (frame.width < parentFrame.width * 0.95)
            return true;
    }
    const innerKeywords = ['inner', 'content', 'wrapper', 'container', 'box'];
    if (innerKeywords.some(kw => lname.includes(kw)))
        return true;
    return false;
}
// -------------------- Main Compiler Class --------------------
class ElementorCompiler {
    constructor(config) {
        this.pendingUploads = new Map();
        this.mediaHashCache = new Map();
        this.nodeHashCache = new Map();
        this.quality = 0.85;
        this.wpConfig = config || {};
    }
    uploadImageToWordPress(node_1) {
        return __awaiter(this, arguments, void 0, function* (node, format = 'WEBP') {
            if (!this.wpConfig || !this.wpConfig.url || !this.wpConfig.user || !this.wpConfig.password) {
                console.warn('[F2E] WP config ausente.');
                return null;
            }
            try {
                const targetFormat = format === 'SVG' ? 'SVG' : 'WEBP';
                const result = yield exportNodeAsImage(node, targetFormat, this.quality);
                if (!result)
                    return null;
                const { bytes, mime, ext, needsConversion } = result;
                const hash = yield computeHash(bytes);
                if (this.mediaHashCache.has(hash))
                    return this.mediaHashCache.get(hash);
                this.nodeHashCache.set(node.id, hash);
                const id = generateGUID();
                const safeId = node.id.replace(/[^a-z0-9]/gi, '_');
                const name = `w_${safeId}_${hash}.${ext}`;
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        if (this.pendingUploads.has(id)) {
                            this.pendingUploads.delete(id);
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
                            resolve(null);
                        }
                    });
                    figma.ui.postMessage({
                        type: 'upload-image-request', id, name, mimeType: mime, targetMimeType: 'image/webp',
                        data: bytes, needsConversion: !!needsConversion
                    });
                });
            }
            catch (e) {
                console.error('Error preparing upload:', e);
                return null;
            }
        });
    }
    isTextNode(node) { return node.type === 'TEXT'; }
    isImageNode(node) {
        if (node.type === 'RECTANGLE')
            return hasImageFill(node);
        if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') {
            const g = node;
            if (hasFills(g) && isArray(g.fills) && g.fills.some((f) => f.type === 'IMAGE'))
                return true;
        }
        const lname = node.name.toLowerCase();
        return lname.includes('image') || lname.includes('img') || lname.includes('foto');
    }
    findAllChildren(node, result = []) {
        if ('children' in node) {
            for (const child of node.children) {
                result.push(child);
                this.findAllChildren(child, result);
            }
        }
        return result;
    }
    detectWidgetType(node) {
        const lname = node.name.toLowerCase();
        if (lname.includes('button') || lname.includes('btn'))
            return 'button';
        if (lname.includes('image-box') || lname.includes('card'))
            return 'image-box';
        if (lname.includes('icon-box'))
            return 'icon-box';
        // 1. Check Text FIRST to avoid "Icon" ambiguity
        if (node.type === 'TEXT') {
            if (lname.includes('heading') || lname.includes('title'))
                return 'heading';
            return 'text-editor';
        }
        if (lname.includes('image') || lname.includes('img'))
            return 'image';
        if (lname.includes('icon') || lname.includes('ico'))
            return 'icon';
        if (hasLayout(node) || node.type === 'GROUP')
            return 'container';
        return null;
    }
    // -------------------- SMART STYLE DETECTION (CORRIGIDO) --------------------
    detectStyleNode(node, internalContentNodes) {
        if ((hasFills(node) && isArray(node.fills) && node.fills.length > 0 && node.fills[0].visible !== false) ||
            (hasStrokes(node) && isArray(node.strokes) && node.strokes.length > 0) ||
            (hasEffects(node) && isArray(node.effects) && node.effects.length > 0)) {
            return node;
        }
        if ('children' in node) {
            const children = node.children;
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (internalContentNodes.includes(child))
                    continue;
                if (child.width < 10 || child.height < 10)
                    continue;
                if ((child.type === 'RECTANGLE' || child.type === 'FRAME' || child.type === 'ELLIPSE') &&
                    ((hasFills(child) && isArray(child.fills) && child.fills.length > 0 && child.fills[0].visible !== false) ||
                        (hasStrokes(child) && isArray(child.strokes) && child.strokes.length > 0) ||
                        (hasEffects(child) && isArray(child.effects) && child.effects.length > 0))) {
                    return child;
                }
            }
        }
        return node;
    }
    compile(nodes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (nodes.length === 1) {
                const node = nodes[0];
                const isArtboard = node.parent && node.parent.type === 'PAGE';
                const hasPrefix = node.name.match(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i);
                if (node.type === 'FRAME' && isArtboard && !hasPrefix) {
                    const frame = node;
                    const children = yield Promise.all(frame.children.map(child => this.processNode(child, null, true)));
                    return children;
                }
            }
            const elements = yield Promise.all(Array.from(nodes).map((node) => __awaiter(this, void 0, void 0, function* () { return this.processNode(node, null, true); })));
            return elements;
        });
    }
    processNode(node_1) {
        return __awaiter(this, arguments, void 0, function* (node, parentNode = null, isTopLevel = false) {
            const rawName = node.name || '';
            const prefixMatch = rawName.match(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i);
            if (prefixMatch) {
                const prefix = prefixMatch[0].toLowerCase();
                let slug = rawName.substring(prefix.length).trim().toLowerCase().split(' ')[0];
                if (prefix === 'woo:')
                    slug = `woocommerce-${slug}`;
                if (prefix === 'loop:')
                    slug = `loop-${slug}`;
                if (prefix === 'slider:')
                    slug = 'slides';
                if (['container', 'section', 'inner-container', 'column', 'row'].includes(slug)) {
                    return this.createContainer(node, parentNode, isTopLevel);
                }
                return this.createExplicitWidget(node, slug);
            }
            const detected = this.detectWidgetType(node);
            if (detected === 'container')
                return this.createContainer(node, parentNode, isTopLevel);
            if (detected)
                return this.createExplicitWidget(node, detected);
            if (node.type === 'TEXT')
                return createTextWidget(node);
            if (this.isImageNode(node))
                return this.createExplicitWidget(node, 'image');
            if (['FRAME', 'GROUP', 'INSTANCE', 'COMPONENT'].includes(node.type))
                return this.createContainer(node, parentNode, isTopLevel);
            return { id: generateGUID(), elType: 'widget', widgetType: 'text-editor', settings: { editor: 'Nó não suportado' }, elements: [] };
        });
    }
    createContainer(node_1) {
        return __awaiter(this, arguments, void 0, function* (node, parentNode = null, isTopLevel = false) {
            const lname = node.name.toLowerCase();
            let settings = {};
            let containerType = 'normal';
            let isInner = false;
            if (lname.startsWith('c:section') || lname.startsWith('c:boxed'))
                containerType = 'external';
            else if (lname.startsWith('c:inner')) {
                containerType = 'inner';
                isInner = true;
            }
            else if (isExternalContainer(node, isTopLevel))
                containerType = 'external';
            else if (isInnerContainer(node, parentNode)) {
                containerType = 'inner';
                isInner = true;
            }
            Object.assign(settings, extractBorderStyles(node));
            Object.assign(settings, extractShadows(node));
            Object.assign(settings, yield extractBackgroundAdvanced(node, this));
            Object.assign(settings, extractPadding(node));
            Object.assign(settings, extractOpacity(node));
            Object.assign(settings, extractTransform(node));
            Object.assign(settings, extractFlexLayout(node));
            Object.assign(settings, extractMargin(node));
            if (containerType === 'external') {
                let childToMerge = null;
                if ('children' in node) {
                    const children = node.children;
                    const frameChildren = children.filter(c => c.type === 'FRAME' || c.type === 'INSTANCE');
                    if (frameChildren.length === 1 && isInnerContainer(frameChildren[0], node)) {
                        childToMerge = frameChildren[0];
                    }
                }
                if (childToMerge) {
                    settings.content_width = 'boxed';
                    settings.width = { unit: '%', size: 100 };
                    settings.boxed_width = { unit: 'px', size: Math.round(childToMerge.width) };
                    Object.assign(settings, extractPadding(childToMerge));
                    Object.assign(settings, extractFlexLayout(childToMerge));
                    const grandChildren = yield Promise.all(childToMerge.children.map(c => this.processNode(c, node, false)));
                    return { id: generateGUID(), elType: 'container', isInner: false, settings, elements: grandChildren };
                }
                else {
                    settings.content_width = 'full';
                    settings.width = { unit: '%', size: 100 };
                    if ('width' in node && node.width < 1200) {
                        settings.content_width = 'boxed';
                        settings.boxed_width = { unit: 'px', size: Math.round(node.width) };
                    }
                }
            }
            else {
                isInner = true;
                settings.content_width = 'full';
            }
            if (settings._position === 'absolute')
                delete settings._position;
            let childElements = [];
            if ('children' in node) {
                childElements = yield Promise.all(node.children.map(child => this.processNode(child, node, false)));
            }
            return { id: generateGUID(), elType: 'container', isInner, settings, elements: childElements };
        });
    }
    createExplicitWidget(node, widgetSlug) {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = {};
            const cleanTitle = stripWidgetPrefix(node.name);
            settings._widget_title = cleanTitle || widgetSlug;
            const allDescendants = this.findAllChildren(node);
            let imageNode = null;
            let titleNode = null;
            let descNode = null;
            if (['image-box', 'icon-box', 'button', 'image'].includes(widgetSlug)) {
                if (widgetSlug === 'image-box' || widgetSlug === 'image') {
                    imageNode = allDescendants.find(c => this.isImageNode(c)) || null;
                }
                else if (widgetSlug === 'icon-box' || widgetSlug === 'icon') {
                    imageNode = allDescendants.find(c => isIconNode(c)) || null;
                }
                const textNodes = allDescendants.filter(c => c.type === 'TEXT');
                textNodes.sort((a, b) => {
                    var _a, _b;
                    const yA = 'absoluteBoundingBox' in a ? ((_a = a.absoluteBoundingBox) === null || _a === void 0 ? void 0 : _a.y) || 0 : 0;
                    const yB = 'absoluteBoundingBox' in b ? ((_b = b.absoluteBoundingBox) === null || _b === void 0 ? void 0 : _b.y) || 0 : 0;
                    return yA - yB;
                });
                if (textNodes.length > 0)
                    titleNode = textNodes[0];
                if (textNodes.length > 1)
                    descNode = textNodes[1];
            }
            const contentNodes = [imageNode, titleNode, descNode].filter(n => n !== null);
            const styleNode = this.detectStyleNode(node, contentNodes);
            Object.assign(settings, extractMargin(node));
            Object.assign(settings, extractPositioning(node));
            Object.assign(settings, extractTransform(node));
            Object.assign(settings, extractOpacity(node));
            if (styleNode) {
                Object.assign(settings, yield extractBackgroundAdvanced(styleNode, this));
                Object.assign(settings, extractBorderStyles(styleNode));
                Object.assign(settings, extractShadows(styleNode));
                if (hasLayout(styleNode) || hasCornerRadius(styleNode)) {
                    Object.assign(settings, extractPadding(styleNode));
                }
            }
            else {
                Object.assign(settings, extractBorderStyles(node));
                Object.assign(settings, extractShadows(node));
            }
            if (widgetSlug === 'image') {
                const url = yield this.uploadImageToWordPress(node, 'WEBP');
                settings.image = { url: url || '', id: 0 };
                if ('width' in node)
                    settings.width = { unit: 'px', size: Math.round(node.width) };
            }
            else if (widgetSlug === 'button') {
                if (titleNode) {
                    settings.text = titleNode.characters;
                    Object.assign(settings, extractTypography(titleNode));
                    const color = extractTextColor(titleNode);
                    if (color)
                        settings.button_text_color = color;
                }
                else if (node.type === 'TEXT') {
                    settings.text = node.characters;
                }
                else {
                    settings.text = 'Button';
                }
                if (settings.background_color) {
                    settings.button_background_color = settings.background_color;
                    delete settings.background_background;
                    delete settings.background_color;
                }
            }
            else if (widgetSlug === 'image-box' || widgetSlug === 'icon-box') {
                if (imageNode && titleNode) {
                    const pos = detectRelativePosition(imageNode, titleNode);
                    settings.position = pos;
                    if (pos === 'left' || pos === 'right') {
                        settings.content_vertical_alignment = 'middle';
                    }
                }
                if (imageNode) {
                    if (widgetSlug === 'image-box') {
                        const url = yield this.uploadImageToWordPress(imageNode, 'WEBP');
                        if (url)
                            settings.image = { url, id: 0 };
                        if ('width' in imageNode) {
                            const w = Math.round(imageNode.width);
                            settings.image_width = { unit: 'px', size: w };
                            settings.image_size = { unit: 'px', size: w, sizes: [] };
                        }
                    }
                    else {
                        const url = yield this.uploadImageToWordPress(imageNode, 'SVG');
                        if (url)
                            settings.selected_icon = { value: { url, id: 0 }, library: 'svg' };
                        if ('width' in imageNode) {
                            const w = Math.round(imageNode.width);
                            settings.icon_size = { unit: 'px', size: w };
                        }
                    }
                }
                if (titleNode) {
                    settings.title_text = titleNode.characters;
                    const typo = extractTypography(titleNode);
                    const color = extractTextColor(titleNode);
                    for (const key in typo)
                        settings[key.replace('typography_', 'title_typography_')] = typo[key];
                    if (color)
                        settings.title_color = color;
                }
                if (descNode) {
                    settings.description_text = descNode.characters;
                    const typo = extractTypography(descNode);
                    const color = extractTextColor(descNode);
                    for (const key in typo)
                        settings[key.replace('typography_', 'description_typography_')] = typo[key];
                    if (color)
                        settings.description_color = color;
                }
            }
            else if (widgetSlug === 'heading') {
                if (node.type === 'TEXT') {
                    settings.title = node.characters;
                    Object.assign(settings, extractTypography(node));
                    const color = extractTextColor(node);
                    if (color)
                        settings.title_color = color;
                }
            }
            else if (widgetSlug === 'text-editor') {
                if (node.type === 'TEXT') {
                    settings.editor = node.characters;
                    Object.assign(settings, extractTypography(node));
                    const color = extractTextColor(node);
                    if (color)
                        settings.text_color = color;
                }
            }
            else if (widgetSlug === 'icon') {
                const url = yield this.uploadImageToWordPress(node, 'SVG');
                if (url)
                    settings.selected_icon = { value: { url, id: 0 }, library: 'svg' };
            }
            return {
                id: generateGUID(),
                elType: 'widget',
                widgetType: widgetSlug,
                settings,
                elements: []
            };
        });
    }
}
// -------------------- Main Execution --------------------
figma.showUI(__html__, { width: 400, height: 600 });
let compiler;
figma.clientStorage.getAsync('wp_config').then(config => {
    compiler = new ElementorCompiler(config || {});
    if (config)
        figma.ui.postMessage({ type: 'load-wp-config', config });
});
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!compiler)
        compiler = new ElementorCompiler({});
    if (msg.type === 'export-elementor') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Selecione ao menos um frame.');
            return;
        }
        if (msg.quality)
            compiler.quality = msg.quality;
        figma.notify('Processando... (Uploads de imagem podem demorar)');
        try {
            const elements = yield compiler.compile(selection);
            const template = {
                type: 'elementor',
                siteurl: ((_a = compiler.wpConfig) === null || _a === void 0 ? void 0 : _a.url) || '',
                elements,
                version: '0.4'
            };
            figma.ui.postMessage({ type: 'export-result', data: JSON.stringify(template, null, 2) });
            figma.notify('JSON gerado com sucesso!');
        }
        catch (e) {
            console.error(e);
            figma.notify('Erro ao exportar.');
        }
    }
    else if (msg.type === 'save-wp-config') {
        yield figma.clientStorage.setAsync('wp_config', msg.config);
        compiler.wpConfig = msg.config;
        figma.notify('Configurações salvas.');
    }
    else if (msg.type === 'upload-image-response') {
        const resolver = compiler.pendingUploads.get(msg.id);
        if (resolver) {
            resolver(msg);
            compiler.pendingUploads.delete(msg.id);
        }
    }
    else if (msg.type === 'rename-layer') {
        const sel = figma.currentPage.selection;
        if (sel.length === 1) {
            sel[0].name = msg.newName;
            figma.notify(`Renomeado: ${msg.newName}`);
        }
        else {
            figma.notify('Selecione 1 item.');
        }
    }
    else if (msg.type === 'debug-structure') {
        const debug = figma.currentPage.selection.map(n => ({
            id: n.id,
            name: n.name,
            type: n.type,
            layout: hasLayout(n) ? n.layoutMode : 'none'
        }));
        figma.ui.postMessage({ type: 'debug-result', data: JSON.stringify(debug, null, 2) });
    }
});
function createTextWidget(node) {
    const isHeading = node.fontSize > 24 || node.fontName.style.toLowerCase().includes('bold');
    const widgetType = isHeading ? 'heading' : 'text-editor';
    const settings = {};
    if (isHeading)
        settings.title = node.characters;
    else
        settings.editor = node.characters;
    Object.assign(settings, extractTypography(node));
    const color = extractTextColor(node);
    if (color) {
        if (isHeading)
            settings.title_color = color;
        else
            settings.text_color = color;
    }
    Object.assign(settings, extractMargin(node));
    return {
        id: generateGUID(),
        elType: 'widget',
        widgetType,
        settings,
        elements: []
    };
}
