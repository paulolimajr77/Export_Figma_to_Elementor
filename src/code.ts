// Elementor JSON Compiler – Full Implementation (TypeScript)
// Exporta frames do Figma para JSON compatível com Elementor (clipboard).
// Versão Estável Final:
// - FIX: Persistência das configurações WP (carregamento garantido no início).
// - FIX: Detecção robusta de Image Box, Icon Box, Button e Containers.
// - FIX: Mapeamento preciso de estilos (Fundo, Borda, Sombra, Tamanho de Imagem).
// - FIX: Detecção de Posição e Alinhamento.
// - Suporte a Redimensionamento e WebP.

// -------------------- Interfaces --------------------
interface ElementorSettings { [key: string]: any; }
interface ElementorElement { id: string; elType: string; widgetType?: string; settings: ElementorSettings; elements: ElementorElement[]; isInner?: boolean; }
interface ElementorTemplate { type: string; siteurl: string; elements: ElementorElement[]; version: string; }
type GeometryNode = RectangleNode | EllipseNode | PolygonNode | StarNode | VectorNode | TextNode | FrameNode | ComponentNode | InstanceNode | BooleanOperationNode | LineNode;

// -------------------- Helpers --------------------
function generateGUID(): string { return 'xxxxxxxxxx'.replace(/[x]/g, () => ((Math.random() * 36) | 0).toString(36)); }
function normalizeName(name: string): string { return name.trim().toLowerCase(); }
function stripWidgetPrefix(name: string): string { return name.replace(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i, '').trim(); }
function convertColor(paint: SolidPaint): string {
    if (!paint || paint.type !== 'SOLID') return '';
    const { r, g, b } = paint.color;
    const a = paint.opacity !== undefined ? paint.opacity : 1;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
function isArray(value: any): value is ReadonlyArray<any> { return Array.isArray(value); }

// Detecta posição (Top/Left/Right) baseada em sobreposição geométrica
function detectRelativePosition(source: SceneNode, target: SceneNode): 'top' | 'left' | 'right' {
    if (!source.absoluteBoundingBox || !target.absoluteBoundingBox) return 'top';

    const b1 = source.absoluteBoundingBox; // Imagem
    const b2 = target.absoluteBoundingBox; // Texto

    // Calcula a sobreposição no eixo X (Horizontal)
    const xOverlap = Math.max(0, Math.min(b1.x + b1.width, b2.x + b2.width) - Math.max(b1.x, b2.x));

    // Se houver sobreposição horizontal significativa (> 50% da largura da imagem), eles estão empilhados verticalmente
    if (xOverlap > (b1.width * 0.5)) {
        return 'top';
    }

    // Caso contrário, verifica quem está mais à esquerda
    const c1x = b1.x + b1.width / 2;
    const c2x = b2.x + b2.width / 2;

    return c1x < c2x ? 'left' : 'right';
}

async function computeHash(bytes: Uint8Array): Promise<string> {
    const chrsz = 8;
    function rol(num: number, cnt: number) { return (num << cnt) | (num >>> (32 - cnt)); }
    function safe_add(x: number, y: number) {
        const lsw = (x & 0xFFFF) + (y & 0xFFFF);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }
    function sha1_ft(t: number, b: number, c: number, d: number) {
        if (t < 20) return (b & c) | ((~b) & d);
        if (t < 40) return b ^ c ^ d;
        if (t < 60) return (b & c) | (b & d) | (c & d);
        return b ^ c ^ d;
    }
    function sha1_kt(t: number) { return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514; }
    function core_sha1(x: number[], len: number) {
        x[len >> 5] |= 0x80 << (24 - len % 32);
        x[((len + 64 >> 9) << 4) + 15] = len;
        const w = Array(80);
        let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776;
        for (let i = 0; i < x.length; i += 16) {
            const olda = a, oldb = b, oldc = c, oldd = d, olde = e;
            for (let j = 0; j < 80; j++) {
                if (j < 16) w[j] = x[i + j]; else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                const t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)), safe_add(safe_add(e, w[j]), sha1_kt(j)));
                e = d; d = c; c = rol(b, 30); b = a; a = t;
            }
            a = safe_add(a, olda); b = safe_add(b, oldb); c = safe_add(c, oldc); d = safe_add(d, oldd); e = safe_add(e, olde);
        }
        return [a, b, c, d, e];
    }
    function binb2hex(binarray: number[]) {
        const hex_tab = "0123456789abcdef";
        let str = "";
        for (let i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) + hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
        }
        return str;
    }
    function bytesToWords(bytes: Uint8Array) {
        const words: number[] = [];
        for (let i = 0; i < bytes.length; i++) { words[i >>> 2] |= (bytes[i] & 0xFF) << (24 - (i % 4) * 8); }
        return words;
    }
    return binb2hex(core_sha1(bytesToWords(bytes), bytes.length * 8));
}

// -------------------- Extraction Logic --------------------
function hasFills(node: SceneNode): node is GeometryNode { return 'fills' in node; }
function hasStrokes(node: SceneNode): node is GeometryNode { return 'strokes' in node; }
function hasEffects(node: SceneNode): node is SceneNode & { effects: ReadonlyArray<Effect> } { return 'effects' in node; }
function hasLayout(node: SceneNode): node is FrameNode | ComponentNode | InstanceNode { return 'layoutMode' in node; }
function hasCornerRadius(node: SceneNode): node is FrameNode | RectangleNode | ComponentNode | InstanceNode { return 'cornerRadius' in node || 'topLeftRadius' in node; }

function extractTypography(node: TextNode): ElementorSettings {
    const settings: ElementorSettings = {};
    settings.typography_typography = 'custom';
    if (node.fontSize !== figma.mixed) settings.typography_font_size = { unit: 'px', size: Math.round(node.fontSize) };
    if (node.fontName !== figma.mixed) {
        const style = node.fontName.style.toLowerCase();
        if (style.includes('bold')) settings.typography_font_weight = '700';
        else if (style.includes('semibold')) settings.typography_font_weight = '600';
        else if (style.includes('medium')) settings.typography_font_weight = '500';
        else if (style.includes('light')) settings.typography_font_weight = '300';
        else settings.typography_font_weight = '400';
        settings.typography_font_family = node.fontName.family;
    }
    if (node.lineHeight !== figma.mixed && node.lineHeight.unit !== 'AUTO') {
        if (node.lineHeight.unit === 'PIXELS') settings.typography_line_height = { unit: 'px', size: Math.round(node.lineHeight.value) };
        else if (node.lineHeight.unit === 'PERCENT') settings.typography_line_height = { unit: 'em', size: (node.lineHeight.value / 100).toFixed(2) };
    }
    if (node.letterSpacing !== figma.mixed && node.letterSpacing.value !== 0) settings.typography_letter_spacing = { unit: 'px', size: node.letterSpacing.value };
    // Alignment
    if (node.textAlignHorizontal) {
        const map: Record<string, string> = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };
        const key = node.textAlignHorizontal as string;
        if (map[key]) settings.align = map[key];
    }
    return settings;
}

function extractTextColor(node: TextNode): string {
    if (!hasFills(node) || !isArray(node.fills) || node.fills.length === 0) return '';
    const fill = node.fills[0];
    if (fill.type === 'SOLID') return convertColor(fill);
    return '';
}

function extractBorderStyles(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};
    if (hasStrokes(node) && isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke.type === 'SOLID') {
            settings.border_color = convertColor(stroke);
            settings.border_border = 'solid';
            if ((node as any).strokeWeight !== figma.mixed) {
                const w = (node as any).strokeWeight;
                settings.border_width = { unit: 'px', top: w, right: w, bottom: w, left: w, isLinked: true };
            }
        }
    }
    if (hasCornerRadius(node)) {
        const anyNode: any = node;
        if (anyNode.cornerRadius !== figma.mixed && typeof anyNode.cornerRadius === 'number') {
            const r = anyNode.cornerRadius;
            settings.border_radius = { unit: 'px', top: r, right: r, bottom: r, left: r, isLinked: true };
        } else {
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

function extractShadows(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};
    if (!hasEffects(node) || !isArray(node.effects)) return settings;
    const drop = node.effects.find(e => e.type === 'DROP_SHADOW' && e.visible !== false) as DropShadowEffect | undefined;
    if (drop) {
        const { color, offset, radius, spread } = drop;
        const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
        settings.box_shadow_box_shadow_type = 'yes';
        settings.box_shadow_box_shadow = {
            horizontal: Math.round(offset.x), vertical: Math.round(offset.y),
            blur: Math.round(radius), spread: Math.round(spread || 0), color: rgba
        };
    }
    return settings;
}

function extractOpacity(node: SceneNode): ElementorSettings {
    if ('opacity' in node && node.opacity !== 1) return { _opacity: { unit: 'px', size: node.opacity } };
    return {};
}

function extractTransform(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};
    if ('rotation' in node && node.rotation !== 0) {
        settings._transform_rotate_popover = 'custom';
        settings._transform_rotateZ_effect = { unit: 'deg', size: Math.round(node.rotation) };
    }
    return settings;
}

function extractPadding(node: SceneNode): ElementorSettings {
    const frame = node as FrameNode;
    const top = (frame as any).paddingTop ?? 0;
    const right = (frame as any).paddingRight ?? 0;
    const bottom = (frame as any).paddingBottom ?? 0;
    const left = (frame as any).paddingLeft ?? 0;
    const isLinked = top === right && top === bottom && top === left;
    return { padding: { unit: 'px', top, right, bottom, left, isLinked } };
}

function extractMargin(node: SceneNode): ElementorSettings {
    const parent = node.parent as BaseNode | null;
    if (!parent || !('layoutMode' in parent) || (parent as any).layoutMode !== 'NONE') return {};
    const margin: ElementorSettings = {};
    const threshold = 2;
    if ((node as any).y > threshold) margin.margin_top = { unit: 'px', size: Math.round((node as any).y) };
    if ((node as any).x > threshold) margin.margin_left = { unit: 'px', size: Math.round((node as any).x) };
    if ('width' in parent) {
        const rightSpace = (parent as any).width - ((node as any).x + (node as any).width);
        if (rightSpace > threshold) margin.margin_right = { unit: 'px', size: Math.round(rightSpace) };
    }
    if ('height' in parent) {
        const bottomSpace = (parent as any).height - ((node as any).y + (node as any).height);
        if (bottomSpace > threshold) margin.margin_bottom = { unit: 'px', size: Math.round(bottomSpace) };
    }
    return margin;
}

function extractPositioning(node: SceneNode): ElementorSettings {
    const settings: ElementorSettings = {};
    const name = node.name.toLowerCase();
    if (name.includes('fixed')) {
        settings._position = 'fixed';
        settings._offset_x = { unit: 'px', size: Math.round((node as any).x) };
        settings._offset_y = { unit: 'px', size: Math.round((node as any).y) };
    } else if (name.includes('sticky')) {
        settings._position = 'sticky';
        settings._offset_y = { unit: 'px', size: 0 };
    }
    if (node.parent && 'children' in node.parent) {
        const siblings = (node.parent as any).children as SceneNode[];
        const index = siblings.indexOf(node);
        const z = siblings.length - index;
        if (z > 1) settings._z_index = z;
    }
    return settings;
}

async function exportNodeAsImage(node: SceneNode, format: 'WEBP' | 'PNG' | 'SVG' | 'JPG', quality: number = 0.85): Promise<{ bytes: Uint8Array, mime: string, ext: string, needsConversion?: boolean } | null> {
    try {
        if (format === 'SVG') {
            const bytes = await node.exportAsync({ format: 'SVG' });
            return { bytes, mime: 'image/svg+xml', ext: 'svg' };
        }
        if (format === 'WEBP') {
            const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
            return { bytes, mime: 'image/png', ext: 'webp', needsConversion: true };
        }
        const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
        return { bytes, mime: 'image/png', ext: 'png' };
    } catch (e) { return null; }
}

async function extractBackgroundAdvanced(node: SceneNode, compiler: ElementorCompiler): Promise<ElementorSettings> {
    const settings: ElementorSettings = {};
    if (!hasFills(node) || !isArray(node.fills) || node.fills.length === 0) return settings;
    const visibleFills = node.fills.filter(f => f.visible !== false);
    if (visibleFills.length === 0) return settings;

    const bgFill = visibleFills[visibleFills.length - 1];

    if (bgFill.type === 'SOLID') {
        settings.background_background = 'classic';
        settings.background_color = convertColor(bgFill);
    } else if (bgFill.type === 'IMAGE') {
        settings.background_background = 'classic';
        const bgUrl = await compiler.uploadImageToWordPress(node, 'WEBP');
        if (bgUrl) settings.background_image = { url: bgUrl, id: 0, source: 'library' };
        settings.background_size = 'cover';
        settings.background_position = 'center center';
    } else if (bgFill.type === 'GRADIENT_LINEAR' || bgFill.type === 'GRADIENT_RADIAL') {
        settings.background_background = 'gradient';
        settings.background_gradient_type = bgFill.type === 'GRADIENT_RADIAL' ? 'radial' : 'linear';
        const stops = bgFill.gradientStops;
        if (stops.length > 0) {
            settings.background_color = convertColor({ type: 'SOLID', color: stops[0].color, opacity: stops[0].color.a } as SolidPaint);
            settings.background_color_stop = { unit: '%', size: Math.round(stops[0].position * 100) };
        }
        if (stops.length > 1) {
            settings.background_color_b = convertColor({ type: 'SOLID', color: stops[stops.length - 1].color, opacity: stops[stops.length - 1].color.a } as SolidPaint);
            settings.background_color_b_stop = { unit: '%', size: Math.round(stops[stops.length - 1].position * 100) };
        }
        if (bgFill.type === 'GRADIENT_LINEAR') settings.background_gradient_angle = { unit: 'deg', size: 180 };
    }
    return settings;
}

function extractFlexLayout(node: SceneNode): ElementorSettings {
    if (!hasLayout(node) || node.layoutMode === 'NONE') return {};
    const settings: ElementorSettings = {};
    const isRow = node.layoutMode === 'HORIZONTAL';
    settings.flex_direction = isRow ? 'row' : 'column';
    const justifyMap: Record<string, string> = { MIN: 'start', CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between' };
    const alignMap: Record<string, string> = { MIN: 'start', CENTER: 'center', MAX: 'end', BASELINE: 'baseline', STRETCH: 'stretch' };
    if (node.primaryAxisAlignItems && justifyMap[node.primaryAxisAlignItems]) settings.justify_content = justifyMap[node.primaryAxisAlignItems];
    if (node.counterAxisAlignItems && alignMap[node.counterAxisAlignItems]) settings.align_items = alignMap[node.counterAxisAlignItems];
    if (node.itemSpacing && node.itemSpacing > 0) {
        settings.gap = { unit: 'px', size: node.itemSpacing, column: node.itemSpacing, row: node.itemSpacing, isLinked: true };
    }
    settings.flex_wrap = node.layoutWrap === 'WRAP' ? 'wrap' : 'nowrap';
    return settings;
}

function isIconNode(node: SceneNode): boolean {
    const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];
    const isVector = vectorTypes.includes(node.type);
    const isSmallFrame = (node.type === 'FRAME' || node.type === 'INSTANCE') && (node as any).width <= 50 && (node as any).height <= 50;
    const name = node.name.toLowerCase();
    return isVector || isSmallFrame || name.includes('icon') || name.includes('vector');
}

function hasImageFill(node: GeometryNode): boolean {
    return hasFills(node) && isArray(node.fills) && node.fills.some(p => p.type === 'IMAGE');
}

function isExternalContainer(node: SceneNode, isTopLevel: boolean = false): boolean {
    if (!hasLayout(node)) return false;
    const frame = node as FrameNode;
    const lname = node.name.toLowerCase();
    if (lname.startsWith('c:section') || lname.startsWith('c:boxed')) return true;
    if (isTopLevel) return true;
    if (frame.width > 900) return true;
    const sectionKeywords = ['section', 'hero', 'header', 'footer', 'banner', 'cta'];
    if (sectionKeywords.some(kw => lname.includes(kw))) return true;
    return false;
}

function isInnerContainer(node: SceneNode, parentNode: SceneNode | null): boolean {
    if (!hasLayout(node)) return false;
    const frame = node as FrameNode;
    const lname = node.name.toLowerCase();
    if (lname.startsWith('c:inner') || lname.startsWith('c:row') || lname.startsWith('c:col')) return true;
    if (!parentNode) return false;
    if (hasLayout(parentNode)) {
        const parentFrame = parentNode as FrameNode;
        if (frame.width < parentFrame.width * 0.95) return true;
    }
    const innerKeywords = ['inner', 'content', 'wrapper', 'container', 'box'];
    if (innerKeywords.some(kw => lname.includes(kw))) return true;
    return false;
}

function detectStyleNode(node: SceneNode, internalContentNodes: SceneNode[]): GeometryNode {
    if ((hasFills(node) && isArray(node.fills) && node.fills.length > 0 && node.fills[0].visible !== false) ||
        (hasStrokes(node) && isArray(node.strokes) && node.strokes.length > 0) ||
        (hasEffects(node) && isArray(node.effects) && node.effects.length > 0)) {
        return node as GeometryNode;
    }
    if ('children' in node) {
        const children = (node as FrameNode).children;
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            if (internalContentNodes.includes(child)) continue;
            if (child.width < 10 || child.height < 10) continue;
            if ((child.type === 'RECTANGLE' || child.type === 'FRAME' || child.type === 'ELLIPSE') &&
                ((hasFills(child) && isArray(child.fills) && child.fills.length > 0 && child.fills[0].visible !== false) ||
                    (hasStrokes(child) && isArray(child.strokes) && child.strokes.length > 0) ||
                    (hasEffects(child) && isArray(child.effects) && child.effects.length > 0))) {
                return child as GeometryNode;
            }
        }
    }
    return node as GeometryNode;
}

function findAllChildren(node: SceneNode, result: SceneNode[] = []): SceneNode[] {
    if ('children' in node) {
        for (const child of (node as FrameNode).children) {
            result.push(child);
            findAllChildren(child, result);
        }
    }
    return result;
}

function detectWidgetType(node: SceneNode): string | null {
    const lname = node.name.toLowerCase();
    if (lname.includes('button') || lname.includes('btn')) return 'button';
    if (lname.includes('image-box') || lname.includes('card')) return 'image-box';
    if (lname.includes('icon-box')) return 'icon-box';
    if (node.type === 'TEXT') {
        if (lname.includes('heading') || lname.includes('title')) return 'heading';
        return 'text-editor';
    }
    if (lname.includes('image') || lname.includes('img')) return 'image';
    if (lname.includes('icon') || lname.includes('ico')) return 'icon';
    if (hasLayout(node) || node.type === 'GROUP') return 'container';
    return null;
}

// -------------------- Main Class --------------------
class ElementorCompiler {
    pendingUploads: Map<string, (result: any) => void> = new Map();
    wpConfig: any;
    mediaHashCache: Map<string, string> = new Map();
    nodeHashCache: Map<string, string> = new Map();
    quality: number = 0.85;

    constructor(config: any) { this.wpConfig = config || {}; }

    async uploadImageToWordPress(node: SceneNode, format: 'PNG' | 'SVG' | 'WEBP' = 'WEBP'): Promise<string | null> {
        if (!this.wpConfig || !this.wpConfig.url) { console.warn('[F2E] WP missing'); return null; }
        try {
            const targetFormat = format === 'SVG' ? 'SVG' : 'WEBP';
            const result = await exportNodeAsImage(node, targetFormat, this.quality);
            if (!result) return null;
            const { bytes, mime, ext, needsConversion } = result;
            const hash = await computeHash(bytes);
            if (this.mediaHashCache.has(hash)) return this.mediaHashCache.get(hash)!;
            this.nodeHashCache.set(node.id, hash);
            const id = generateGUID();
            const safeId = node.id.replace(/[^a-z0-9]/gi, '_');
            const name = `w_${safeId}_${hash}.${ext}`;

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    if (this.pendingUploads.has(id)) { this.pendingUploads.delete(id); resolve(null); }
                }, 90000);
                this.pendingUploads.set(id, (result: any) => {
                    clearTimeout(timeout);
                    if (result.success) { this.mediaHashCache.set(hash, result.url); resolve(result.url); }
                    else { resolve(null); }
                });
                figma.ui.postMessage({
                    type: 'upload-image-request', id, name, mimeType: mime, targetMimeType: 'image/webp',
                    data: bytes, needsConversion: !!needsConversion, quality: this.quality // Pass quality to UI
                });
            });
        } catch (e) { return null; }
    }

    async compile(nodes: readonly SceneNode[]): Promise<ElementorElement[]> {
        if (nodes.length === 1 && nodes[0].type === 'FRAME' && nodes[0].parent?.type === 'PAGE' && !nodes[0].name.match(/^(w:|c:)/i)) {
            return Promise.all((nodes[0] as FrameNode).children.map(child => this.processNode(child, null, true)));
        }
        return Promise.all(Array.from(nodes).map(async node => this.processNode(node, null, true)));
    }

    async processNode(node: SceneNode, parentNode: SceneNode | null = null, isTopLevel: boolean = false): Promise<ElementorElement> {
        const rawName = node.name || '';
        const prefixMatch = rawName.match(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i);
        if (prefixMatch) {
            const prefix = prefixMatch[0].toLowerCase();
            let slug = rawName.substring(prefix.length).trim().toLowerCase().split(' ')[0];
            if (prefix === 'woo:') slug = `woocommerce-${slug}`;
            if (prefix === 'loop:') slug = `loop-${slug}`;
            if (prefix === 'slider:') slug = 'slides';
            if (['container', 'section', 'inner-container', 'column', 'row'].includes(slug)) return this.createContainer(node, parentNode, isTopLevel);
            return this.createExplicitWidget(node, slug);
        }
        const detected = detectWidgetType(node);
        if (detected === 'container') return this.createContainer(node, parentNode, isTopLevel);
        if (detected) return this.createExplicitWidget(node, detected);
        if (node.type === 'TEXT') return createTextWidget(node as TextNode);
        if (hasImageFill(node as GeometryNode)) return this.createExplicitWidget(node, 'image');
        if (['FRAME', 'GROUP', 'INSTANCE', 'COMPONENT'].includes(node.type)) return this.createContainer(node, parentNode, isTopLevel);
        return { id: generateGUID(), elType: 'widget', widgetType: 'text-editor', settings: { editor: 'Node not supported' }, elements: [] };
    }

    async createContainer(node: SceneNode, parentNode: SceneNode | null = null, isTopLevel: boolean = false): Promise<ElementorElement> {
        const lname = node.name.toLowerCase();
        let settings: ElementorSettings = {};
        let containerType: 'external' | 'inner' | 'normal' = 'normal';
        let isInner = false;

        if (lname.startsWith('c:section') || lname.startsWith('c:boxed')) containerType = 'external';
        else if (lname.startsWith('c:inner')) { containerType = 'inner'; isInner = true; }
        else if (isExternalContainer(node, isTopLevel)) containerType = 'external';
        else if (isInnerContainer(node, parentNode)) { containerType = 'inner'; isInner = true; }

        Object.assign(settings, extractBorderStyles(node));
        Object.assign(settings, extractShadows(node));
        Object.assign(settings, await extractBackgroundAdvanced(node, this));
        Object.assign(settings, extractPadding(node));
        Object.assign(settings, extractOpacity(node));
        Object.assign(settings, extractTransform(node));
        Object.assign(settings, extractFlexLayout(node));
        Object.assign(settings, extractMargin(node));

        if (containerType === 'external') {
            let childToMerge: FrameNode | null = null;
            if ('children' in node) {
                const children = (node as FrameNode).children;
                const frameChildren = children.filter(c => c.type === 'FRAME' || c.type === 'INSTANCE');
                if (frameChildren.length === 1 && isInnerContainer(frameChildren[0], node)) {
                    childToMerge = frameChildren[0] as FrameNode;
                }
            }
            if (childToMerge) {
                settings.content_width = 'boxed';
                settings.width = { unit: '%', size: 100 };
                settings.boxed_width = { unit: 'px', size: Math.round(childToMerge.width) };
                Object.assign(settings, extractPadding(childToMerge));
                Object.assign(settings, extractFlexLayout(childToMerge));
                const grandChildren = await Promise.all(childToMerge.children.map(c => this.processNode(c, node, false)));
                return { id: generateGUID(), elType: 'container', isInner: false, settings, elements: grandChildren };
            } else {
                settings.content_width = 'full'; settings.width = { unit: '%', size: 100 };
                if ('width' in node && (node as any).width < 1200) {
                    settings.content_width = 'boxed'; settings.boxed_width = { unit: 'px', size: Math.round((node as any).width) };
                }
            }
        } else {
            isInner = true;
            settings.content_width = 'full';
        }
        if (settings._position === 'absolute') delete settings._position;
        let childElements: ElementorElement[] = [];
        if ('children' in node) {
            childElements = await Promise.all((node as FrameNode).children.map(child => this.processNode(child, node, false)));
        }
        return { id: generateGUID(), elType: 'container', isInner, settings, elements: childElements };
    }

    async createExplicitWidget(node: SceneNode, widgetSlug: string): Promise<ElementorElement> {
        const settings: ElementorSettings = {};
        const cleanTitle = stripWidgetPrefix(node.name);
        settings._widget_title = cleanTitle || widgetSlug;

        const allDescendants = findAllChildren(node);
        let imageNode: SceneNode | null = null;
        let titleNode: TextNode | null = null;
        let descNode: TextNode | null = null;

        if (['image-box', 'icon-box', 'button', 'image'].includes(widgetSlug)) {
            if (widgetSlug === 'image-box' || widgetSlug === 'image') imageNode = allDescendants.find(c => hasImageFill(c as GeometryNode)) || null;
            else if (widgetSlug === 'icon-box' || widgetSlug === 'icon') imageNode = allDescendants.find(c => isIconNode(c)) || null;

            const textNodes = allDescendants.filter(c => c.type === 'TEXT') as TextNode[];
            textNodes.sort((a, b) => {
                const yA = 'absoluteBoundingBox' in a ? a.absoluteBoundingBox?.y || 0 : 0;
                const yB = 'absoluteBoundingBox' in b ? b.absoluteBoundingBox?.y || 0 : 0;
                return yA - yB;
            });
            if (textNodes.length > 0) titleNode = textNodes[0];
            if (textNodes.length > 1) descNode = textNodes[1];
        }

        const contentNodes = [imageNode, titleNode, descNode].filter(n => n !== null) as SceneNode[];
        const styleNode = detectStyleNode(node, contentNodes);

        Object.assign(settings, extractMargin(node));
        Object.assign(settings, extractPositioning(node));
        Object.assign(settings, extractTransform(node));
        Object.assign(settings, extractOpacity(node));

        if (styleNode) {
            Object.assign(settings, await extractBackgroundAdvanced(styleNode, this));
            Object.assign(settings, extractBorderStyles(styleNode));
            Object.assign(settings, extractShadows(styleNode));
            if (hasLayout(styleNode) || hasCornerRadius(styleNode)) Object.assign(settings, extractPadding(styleNode));
        } else {
            Object.assign(settings, extractBorderStyles(node));
            Object.assign(settings, extractShadows(node));
        }

        if (widgetSlug === 'image') {
            const url = await this.uploadImageToWordPress(node, 'WEBP');
            settings.image = { url: url || '', id: 0 };
            if ('width' in node) settings.width = { unit: 'px', size: Math.round((node as any).width) };
        }
        else if (widgetSlug === 'button') {
            if (titleNode) {
                settings.text = titleNode.characters;
                Object.assign(settings, extractTypography(titleNode));
                const color = extractTextColor(titleNode);
                if (color) settings.button_text_color = color;
            } else if (node.type === 'TEXT') {
                settings.text = (node as TextNode).characters;
            } else { settings.text = 'Button'; }

            if (settings.background_color) {
                settings.button_background_color = settings.background_color;
                delete settings.background_background; delete settings.background_color;
            }
        }
        else if (widgetSlug === 'image-box' || widgetSlug === 'icon-box') {
            if (imageNode && titleNode) {
                const pos = detectRelativePosition(imageNode, titleNode);
                settings.position = pos;
                if (pos === 'left' || pos === 'right') settings.content_vertical_alignment = 'middle';
            }

            if (imageNode) {
                if (widgetSlug === 'image-box') {
                    const url = await this.uploadImageToWordPress(imageNode, 'WEBP');
                    if (url) settings.image = { url, id: 0 };
                    if ('width' in imageNode) {
                        const w = Math.round((imageNode as any).width);
                        settings.image_width = { unit: 'px', size: w };
                        settings.image_size = { unit: 'px', size: w, sizes: [] };
                    }
                } else {
                    const url = await this.uploadImageToWordPress(imageNode, 'SVG');
                    if (url) settings.selected_icon = { value: { url, id: 0 }, library: 'svg' };
                    if ('width' in imageNode) {
                        const w = Math.round((imageNode as any).width);
                        settings.icon_size = { unit: 'px', size: w };
                    }
                }
            }

            if (titleNode) {
                settings.title_text = titleNode.characters;
                const typo = extractTypography(titleNode);
                const color = extractTextColor(titleNode);
                for (const key in typo) settings[key.replace('typography_', 'title_typography_')] = typo[key];
                if (color) settings.title_color = color;

                // FIX: Mapeia o alinhamento do texto para o alinhamento geral do widget
                // O alinhamento do título em TextNode é "textAlignHorizontal" -> extractTypography -> settings.align
                if (settings.align) {
                    settings.text_align = settings.align;
                    delete settings.align; // Limpa para evitar ambiguidade
                }
            }

            if (descNode) {
                settings.description_text = descNode.characters;
                const typo = extractTypography(descNode);
                const color = extractTextColor(descNode);
                for (const key in typo) settings[key.replace('typography_', 'description_typography_')] = typo[key];
                if (color) settings.description_color = color;
            }
        }
        else if (widgetSlug === 'heading') {
            if (node.type === 'TEXT') {
                settings.title = (node as TextNode).characters;
                Object.assign(settings, extractTypography(node as TextNode));
                const color = extractTextColor(node as TextNode);
                if (color) settings.title_color = color;
            }
        }
        else if (widgetSlug === 'text-editor') {
            if (node.type === 'TEXT') {
                settings.editor = (node as TextNode).characters;
                Object.assign(settings, extractTypography(node as TextNode));
                const color = extractTextColor(node as TextNode);
                if (color) settings.text_color = color;
            }
        }
        else if (widgetSlug === 'icon') {
            const url = await this.uploadImageToWordPress(node, 'SVG');
            if (url) settings.selected_icon = { value: { url, id: 0 }, library: 'svg' };
        }

        return { id: generateGUID(), elType: 'widget', widgetType: widgetSlug, settings, elements: [] };
    }
}

// -------------------- Main Execution --------------------
figma.showUI(__html__, { width: 400, height: 600 });

// Initialize Global Compiler Instance
let compiler: ElementorCompiler = new ElementorCompiler({});

// Load configuration immediately upon startup
figma.clientStorage.getAsync('wp_config').then(config => {
    if (config) {
        compiler = new ElementorCompiler(config);
        figma.ui.postMessage({ type: 'load-wp-config', config });
    } else {
        // Ensure compiler is initialized even without config
        compiler = new ElementorCompiler({});
    }
});

figma.ui.onmessage = async (msg) => {
    // Fallback if compiler is somehow null (shouldn't happen due to init above)
    if (!compiler) compiler = new ElementorCompiler({});

    if (msg.type === 'resize-ui') {
        figma.ui.resize(msg.width, msg.height);
    }
    else if (msg.type === 'export-elementor') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) { figma.notify('Selecione ao menos um frame.'); return; }
        if (msg.quality) compiler.quality = msg.quality;

        figma.notify('Processando... (Uploads podem demorar)');

        try {
            const elements = await compiler.compile(selection);
            const template: ElementorTemplate = { type: 'elementor', siteurl: compiler.wpConfig?.url || '', elements, version: '0.4' };
            figma.ui.postMessage({ type: 'export-result', data: JSON.stringify(template, null, 2) });
            figma.notify('JSON gerado com sucesso!');
        } catch (e) { console.error(e); figma.notify('Erro ao exportar.'); }
    }
    else if (msg.type === 'save-wp-config') {
        await figma.clientStorage.setAsync('wp_config', msg.config);
        compiler.wpConfig = msg.config;
        figma.notify('Configurações salvas.');
    }
    else if (msg.type === 'upload-image-response') {
        const resolver = compiler.pendingUploads.get(msg.id);
        if (resolver) { resolver(msg); compiler.pendingUploads.delete(msg.id); }
    }
    else if (msg.type === 'rename-layer') {
        const sel = figma.currentPage.selection;
        if (sel.length === 1) { sel[0].name = msg.newName; figma.notify(`Renomeado: ${msg.newName}`); }
        else { figma.notify('Selecione 1 item.'); }
    }
    else if (msg.type === 'debug-structure') {
        const debug = figma.currentPage.selection.map(n => ({
            id: n.id, name: n.name, type: n.type, layout: hasLayout(n) ? (n as FrameNode).layoutMode : 'none'
        }));
        figma.ui.postMessage({ type: 'debug-result', data: JSON.stringify(debug, null, 2) });
    }
};

function createTextWidget(node: TextNode): ElementorElement {
    const isHeading = (node.fontSize as number) > 24 || (node.fontName as FontName).style.toLowerCase().includes('bold');
    const widgetType = isHeading ? 'heading' : 'text-editor';
    const settings: ElementorSettings = {};

    if (isHeading) settings.title = node.characters;
    else settings.editor = node.characters;

    Object.assign(settings, extractTypography(node));
    const color = extractTextColor(node);
    if (color) {
        if (isHeading) settings.title_color = color;
        else settings.text_color = color;
    }
    Object.assign(settings, extractMargin(node));
    return { id: generateGUID(), elType: 'widget', widgetType, settings, elements: [] };
}