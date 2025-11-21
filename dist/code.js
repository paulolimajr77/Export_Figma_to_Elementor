"use strict";
// Elementor JSON Compiler Logic - Version 3.16 (TypeScript Fixed & Stabilized)
// Includes Phases 1, 2, 3 & 4 (Complete Properties, Layout, Effects & Positioning)
// --- HELPER FUNCTIONS ---
function generateGUID() {
    return 'xxxxxxxxxx'.replace(/[x]/g, function () {
        return ((Math.random() * 36) | 0).toString(36);
    });
}
function convertColor(paint) {
    if (!paint || paint.type !== 'SOLID')
        return '';
    const { r, g, b } = paint.color;
    const a = (paint.opacity !== undefined && paint.opacity !== null) ? paint.opacity : 1;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
function isVisible(node) {
    return node.visible !== false;
}
// --- TYPE GUARDS ---
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
// --- EXTRACTION FUNCTIONS ---
// Extract Typography
function extractTypography(node) {
    const typo = {};
    if (node.type !== 'TEXT')
        return typo;
    // FASE 11: Explicit Custom Typography
    typo.typography_typography = 'custom';
    // Font Size
    if (node.fontSize !== figma.mixed) {
        typo.typography_font_size = { unit: 'px', size: Math.round(node.fontSize) };
    }
    // Font Weight & Style
    if (node.fontName !== figma.mixed) {
        const style = node.fontName.style.toLowerCase();
        if (style.includes('bold'))
            typo.typography_font_weight = '700';
        else if (style.includes('semibold'))
            typo.typography_font_weight = '600';
        else if (style.includes('medium'))
            typo.typography_font_weight = '500';
        else if (style.includes('light'))
            typo.typography_font_weight = '300';
        else
            typo.typography_font_weight = '400';
        if (style.includes('italic'))
            typo.typography_font_style = 'italic';
        typo.typography_font_family = node.fontName.family;
    }
    // Line Height
    if (node.lineHeight !== figma.mixed && node.lineHeight.unit !== 'AUTO') {
        if (node.lineHeight.unit === 'PIXELS') {
            typo.typography_line_height = { unit: 'px', size: Math.round(node.lineHeight.value) };
        }
        else if (node.lineHeight.unit === 'PERCENT') {
            typo.typography_line_height = { unit: 'em', size: (node.lineHeight.value / 100).toFixed(2) };
        }
    }
    // Letter Spacing
    if (node.letterSpacing !== figma.mixed && node.letterSpacing.value !== 0) {
        typo.typography_letter_spacing = { unit: 'px', size: node.letterSpacing.value };
    }
    // Text Align
    if (node.textAlignHorizontal) {
        const alignMap = {
            'LEFT': 'left', 'CENTER': 'center', 'RIGHT': 'right', 'JUSTIFIED': 'justify'
        };
        if (alignMap[node.textAlignHorizontal])
            typo.align = alignMap[node.textAlignHorizontal];
    }
    // Text Decoration
    if (node.textDecoration !== figma.mixed) {
        if (node.textDecoration === 'UNDERLINE')
            typo.typography_text_decoration = 'underline';
        else if (node.textDecoration === 'STRIKETHROUGH')
            typo.typography_text_decoration = 'line-through';
    }
    // Text Transform
    if (node.textCase !== figma.mixed) {
        if (node.textCase === 'UPPER')
            typo.typography_text_transform = 'uppercase';
        else if (node.textCase === 'LOWER')
            typo.typography_text_transform = 'lowercase';
        else if (node.textCase === 'TITLE')
            typo.typography_text_transform = 'capitalize';
    }
    return typo;
}
// Extract Text Color
function extractTextColor(node) {
    if (node.type !== 'TEXT')
        return '';
    if (!hasFills(node) || !Array.isArray(node.fills) || node.fills.length === 0)
        return '';
    const fill = node.fills[0];
    if (fill.type === 'SOLID')
        return convertColor(fill);
    return '';
}
// Extract Border Styles
function extractBorderStyles(node) {
    const border = {};
    // Border Color & Width
    if (hasStrokes(node) && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke.type === 'SOLID') {
            border.border_color = convertColor(stroke);
            border.border_border = "solid";
            if (node.strokeWeight !== figma.mixed) {
                border.border_width = {
                    unit: 'px',
                    top: node.strokeWeight, right: node.strokeWeight,
                    bottom: node.strokeWeight, left: node.strokeWeight,
                    isLinked: true
                };
            }
        }
    }
    // Border Radius
    if (hasCornerRadius(node)) {
        if (node.cornerRadius !== figma.mixed) {
            border.border_radius = {
                unit: 'px',
                top: node.cornerRadius, right: node.cornerRadius,
                bottom: node.cornerRadius, left: node.cornerRadius,
                isLinked: true
            };
        }
        else {
            border.border_radius = {
                unit: 'px',
                top: node.topLeftRadius, right: node.topRightRadius,
                bottom: node.bottomRightRadius, left: node.bottomLeftRadius,
                isLinked: false
            };
        }
    }
    return border;
}
// Extract Drop Shadow
function extractShadows(node) {
    if (!hasEffects(node) || !Array.isArray(node.effects) || node.effects.length === 0)
        return {};
    const shadows = [];
    node.effects.forEach(effect => {
        if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
            const { color, offset, radius, spread } = effect;
            const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
            shadows.push({
                horizontal: Math.round(offset.x),
                vertical: Math.round(offset.y),
                blur: Math.round(radius),
                spread: Math.round(spread || 0),
                color: rgba
            });
        }
    });
    if (shadows.length > 0) {
        return { box_shadow_box_shadow_type: 'yes', box_shadow_box_shadow: shadows[0] };
    }
    return {};
}
// Extract Inner Shadow (Phase 2)
function extractInnerShadow(node) {
    if (!hasEffects(node) || !Array.isArray(node.effects) || node.effects.length === 0)
        return {};
    const innerShadows = [];
    node.effects.forEach(effect => {
        if (effect.type === 'INNER_SHADOW' && effect.visible !== false) {
            const { color, offset, radius, spread } = effect;
            const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
            innerShadows.push({
                horizontal: Math.round(offset.x),
                vertical: Math.round(offset.y),
                blur: Math.round(radius),
                spread: Math.round(spread || 0),
                color: rgba,
                position: 'inset'
            });
        }
    });
    if (innerShadows.length > 0) {
        return {
            box_shadow_box_shadow_type_inner: 'yes',
            box_shadow_box_shadow_inner: innerShadows[0]
        };
    }
    return {};
}
// Extract Opacity
function extractOpacity(node) {
    if ('opacity' in node && node.opacity !== 1) {
        return {
            _opacity: {
                unit: 'px',
                size: node.opacity
            }
        };
    }
    return {};
}
// Extract Text Shadow
function extractTextShadow(node) {
    if (node.type !== 'TEXT')
        return {};
    if (!hasEffects(node) || node.effects.length === 0)
        return {};
    const textShadows = [];
    node.effects.forEach(effect => {
        if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
            const { color, offset, radius } = effect;
            const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
            textShadows.push({
                horizontal: Math.round(offset.x) + 'px',
                vertical: Math.round(offset.y) + 'px',
                blur: Math.round(radius) + 'px',
                color: rgba
            });
        }
    });
    if (textShadows.length > 0) {
        return {
            text_shadow_text_shadow_type: 'yes',
            text_shadow_text_shadow: textShadows[0]
        };
    }
    return {};
}
// Extract Transform/Rotation
function extractTransform(node) {
    const transform = {};
    if ('rotation' in node && node.rotation !== 0) {
        transform._transform_rotate_popover = 'custom';
        transform._transform_rotateZ_effect = {
            unit: 'deg',
            size: Math.round(node.rotation)
        };
    }
    return transform;
}
// Extract Blend Mode (Phase 3)
function extractBlendMode(node) {
    if (!('blendMode' in node) || node.blendMode === 'PASS_THROUGH' || node.blendMode === 'NORMAL')
        return {};
    const blendModeMap = {
        'MULTIPLY': 'multiply', 'SCREEN': 'screen', 'OVERLAY': 'overlay', 'DARKEN': 'darken',
        'LIGHTEN': 'lighten', 'COLOR_DODGE': 'color-dodge', 'COLOR_BURN': 'color-burn',
        'HARD_LIGHT': 'hard-light', 'SOFT_LIGHT': 'soft-light', 'DIFFERENCE': 'difference',
        'EXCLUSION': 'exclusion', 'HUE': 'hue', 'SATURATION': 'saturation', 'COLOR': 'color', 'LUMINOSITY': 'luminosity'
    };
    const cssBlendMode = blendModeMap[node.blendMode];
    if (cssBlendMode) {
        return { _css_blend_mode: cssBlendMode };
    }
    return {};
}
// Extract CSS Filters (Phase 3)
function extractCSSFilters(node) {
    if (!hasEffects(node) || node.effects.length === 0)
        return {};
    const filters = [];
    node.effects.forEach(effect => {
        if (effect.visible === false)
            return;
        if (effect.type === 'LAYER_BLUR') {
            filters.push(`blur(${Math.round(effect.radius)}px)`);
        }
        if (effect.type === 'BACKGROUND_BLUR') {
            filters.push(`blur(${Math.round(effect.radius)}px)`);
        }
    });
    if (filters.length > 0) {
        return { _css_filter: filters.join(' ') };
    }
    return {};
}
// Extract Margin Inferred (Phase 4)
function extractMargin(node) {
    const parent = node.parent;
    if (!parent || !('layoutMode' in parent))
        return {};
    // If parent has Auto Layout, margin is handled by Gap
    if (parent.layoutMode !== 'NONE')
        return {};
    const margin = {};
    const threshold = 5;
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
// Extract Positioning (Phase 4)
function extractPositioning(node) {
    const positioning = {};
    // Check constraints for absolute/fixed
    if ('constraints' in node) {
        const h = node.constraints.horizontal;
        const v = node.constraints.vertical;
        // Simplified Logic for Absolute
        const isDefault = h === 'MIN' && v === 'MIN';
        if (!isDefault) {
            if (h === 'MAX') {
                positioning._position = 'absolute';
                positioning._offset_orientation_h = 'end';
                positioning._offset_x = { unit: 'px', size: 0 };
            }
            if (v === 'MAX') {
                positioning._position = 'absolute';
                positioning._offset_orientation_v = 'end';
                positioning._offset_y = { unit: 'px', size: 0 };
            }
        }
    }
    // Detect Fixed/Sticky by Name
    const name = node.name.toLowerCase();
    if (name.includes('fixed')) {
        positioning._position = 'fixed';
        positioning._offset_x = { unit: 'px', size: Math.round(node.x) };
        positioning._offset_y = { unit: 'px', size: Math.round(node.y) };
    }
    else if (name.includes('sticky')) {
        positioning._position = 'sticky';
        positioning._offset_y = { unit: 'px', size: 0 };
    }
    // Z-Index inferred by layer order
    if (node.parent && 'children' in node.parent) {
        const siblings = node.parent.children;
        const index = siblings.indexOf(node);
        const zIndex = siblings.length - index;
        if (zIndex > 1) {
            positioning._z_index = zIndex;
        }
    }
    return positioning;
}
// Extract Overflow (Phase 3)
function extractOverflow(node) {
    if ('clipsContent' in node && node.clipsContent) {
        return { _overflow: 'hidden' };
    }
    return {};
}
// Extract Padding
function extractPadding(node) {
    if (!('paddingTop' in node))
        return {};
    const frame = node;
    if (frame.paddingTop === 0 && frame.paddingLeft === 0 && frame.paddingRight === 0 && frame.paddingBottom === 0)
        return {};
    return {
        padding: {
            unit: 'px',
            top: frame.paddingTop,
            right: frame.paddingRight,
            bottom: frame.paddingBottom,
            left: frame.paddingLeft,
            isLinked: false
        }
    };
}
// Extract Dimensions
function extractDimensions(node) {
    const dims = {};
    if ('width' in node) {
        dims.width = { unit: 'px', size: Math.round(node.width) };
    }
    if ('height' in node) {
        dims.height = { unit: 'px', size: Math.round(node.height) };
    }
    return dims;
}
// Extract Advanced Background (Phase 2)
function extractBackgroundAdvanced(node) {
    if (!hasFills(node) || !Array.isArray(node.fills) || node.fills.length === 0)
        return {};
    const fill = node.fills[0];
    // SOLID
    if (fill.type === 'SOLID') {
        return {
            background_background: 'classic',
            background_color: convertColor(fill)
        };
    }
    // IMAGE
    if (fill.type === 'IMAGE') {
        const bg = {
            background_background: 'classic',
            background_image: { url: 'https://via.placeholder.com/800' }
        };
        if (fill.scaleMode === 'FILL') {
            bg.background_size = 'cover';
            bg.background_position = 'center center';
            bg.background_repeat = 'no-repeat';
        }
        else if (fill.scaleMode === 'FIT') {
            bg.background_size = 'contain';
            bg.background_position = 'center center';
            bg.background_repeat = 'no-repeat';
        }
        else if (fill.scaleMode === 'TILE') {
            bg.background_size = 'auto';
            bg.background_repeat = 'repeat';
        }
        return bg;
    }
    // GRADIENTS
    if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
        if (!fill.gradientStops || fill.gradientStops.length === 0)
            return {};
        const stops = fill.gradientStops.map(stop => {
            const { r, g, b, a } = stop.color;
            const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
            return {
                color: rgba,
                position: Math.round(stop.position * 100)
            };
        });
        const bg = {
            background_background: 'gradient',
            background_gradient_stops: stops
        };
        if (fill.type === 'GRADIENT_LINEAR') {
            bg.background_gradient_type = 'linear';
            bg.background_gradient_angle = { size: 180, unit: 'deg' }; // Default Figma angle approx
        }
        else {
            bg.background_gradient_type = 'radial';
            bg.background_gradient_position = 'center center';
        }
        return bg;
    }
    return {};
}
// Extract Custom CSS (Phase 5)
function extractCustomCSS(node) {
    const css = [];
    const selector = 'selector';
    // Backdrop Filter
    if (hasEffects(node)) {
        node.effects.forEach(effect => {
            if (effect.type === 'BACKGROUND_BLUR' && effect.visible !== false) {
                css.push(`${selector} { backdrop-filter: blur(${Math.round(effect.radius)}px); -webkit-backdrop-filter: blur(${Math.round(effect.radius)}px); }`);
            }
        });
    }
    // Force Icon Color
    if (node.type === 'VECTOR' || node.name.toLowerCase().includes('icon')) {
        if (hasFills(node) && Array.isArray(node.fills) && node.fills.length > 0 && node.fills[0].type === 'SOLID') {
            const iconColor = convertColor(node.fills[0]);
            css.push(`${selector} i { color: ${iconColor} !important; }`);
            css.push(`${selector} svg { fill: ${iconColor} !important; }`);
        }
    }
    if (css.length > 0) {
        return { custom_css: css.join('\n') };
    }
    return {};
}
// --- COMPILER CLASS ---
class ElementorCompiler {
    constructor(config = {}) {
        this.config = config;
        // --- WIDGET PRESETS LIBRARY ---
        this.widgetPresets = {
            // Basic & General
            'heading': { widgetType: 'heading', settings: { title: 'Heading' } },
            'image': { widgetType: 'image', settings: { image: { url: 'https://via.placeholder.com/800' } } },
            'text-editor': { widgetType: 'text-editor', settings: { editor: 'Lorem ipsum dolor sit amet.' } },
            'video': { widgetType: 'video', settings: { youtube_url: 'https://www.youtube.com/watch?v=XHOmBV4js_E' } },
            'button': { widgetType: 'button', settings: { text: 'Click Me' } },
            'divider': { widgetType: 'divider', settings: {} },
            'spacer': { widgetType: 'spacer', settings: { space: { size: 50, unit: 'px' } } },
            'google-maps': { widgetType: 'google_maps', settings: {} },
            'icon': { widgetType: 'icon', settings: { selected_icon: { value: 'fas fa-star', library: 'fa-solid' } } },
            // General (Free)
            'image-box': { widgetType: 'image-box', settings: { title_text: 'Title', description_text: 'Description' } },
            'icon-box': { widgetType: 'icon-box', settings: { title_text: 'Title', description_text: 'Description' } },
            'star-rating': { widgetType: 'star-rating', settings: {} },
            'image-carousel': { widgetType: 'image-carousel', settings: { gallery: [] } },
            'gallery': { widgetType: 'gallery', settings: { gallery: [], gallery_columns: { size: 3 } } },
            'icon-list': { widgetType: 'icon-list', settings: { icon_list: [{ text: 'List Item #1' }, { text: 'List Item #2' }] } },
            'counter': { widgetType: 'counter', settings: { starting_number: 0, ending_number: 100 } },
            'progress': { widgetType: 'progress', settings: { percent: { size: 50 } } },
            'testimonial': { widgetType: 'testimonial', settings: { testimonial_content: 'Great service!', testimonial_name: 'John Doe' } },
            'tabs': { widgetType: 'tabs', settings: { tabs: [{ tab_title: 'Tab #1', tab_content: 'Content #1' }, { tab_title: 'Tab #2', tab_content: 'Content #2' }] } },
            'accordion': { widgetType: 'accordion', settings: { tabs: [{ tab_title: 'Item #1', tab_content: 'Content #1' }] } },
            'toggle': { widgetType: 'toggle', settings: { tabs: [{ tab_title: 'Item #1', tab_content: 'Content #1' }] } },
            'social-icons': { widgetType: 'social-icons', settings: { social_icon_list: [{ social_icon: { value: 'fab fa-facebook', library: 'fa-brands' } }, { social_icon: { value: 'fab fa-twitter', library: 'fa-brands' } }] } },
            'alert': { widgetType: 'alert', settings: { alert_title: 'Alert', alert_description: 'This is an alert.' } },
            'soundcloud': { widgetType: 'soundcloud', settings: {} },
            'shortcode': { widgetType: 'shortcode', settings: { shortcode: '[shortcode]' } },
            'html': { widgetType: 'html', settings: { html: '<div>Code</div>' } },
            'menu-anchor': { widgetType: 'menu-anchor', settings: {} },
            'read-more': { widgetType: 'read-more', settings: {} },
            // Pro - Marketing & Conversion
            'form': { widgetType: 'form', settings: { form_name: 'New Form', button_text: 'Send' } },
            'login': { widgetType: 'login', settings: {} },
            'countdown': { widgetType: 'countdown', settings: { due_date: '2030-01-01 12:00' } },
            'call-to-action': { widgetType: 'call-to-action', settings: { title: 'CTA Title', description: 'Click the button below.', button_text: 'Click Here', bg_image: { url: 'https://via.placeholder.com/800' } } },
            'price-table': { widgetType: 'price-table', settings: { heading: 'Pro Plan', price: { size: 49 }, features_list: [{ item_text: 'Feature 1' }, { item_text: 'Feature 2' }] } },
            'price-list': { widgetType: 'price-list', settings: { price_list: [{ title: 'Item 1', price: '$10' }, { title: 'Item 2', price: '$20' }] } },
            'share-buttons': { widgetType: 'share-buttons', settings: { share_buttons: [{ social_icon: { value: 'fab fa-facebook', library: 'fa-brands' } }, { social_icon: { value: 'fab fa-twitter', library: 'fa-brands' } }] } },
            'paypal-button': { widgetType: 'paypal-button', settings: {} },
            'stripe-button': { widgetType: 'stripe-button', settings: {} },
            // Pro - Content & Layout
            'slides': { widgetType: 'slides', settings: { slides: [{ heading: 'Slide 1', description: 'Description 1' }, { heading: 'Slide 2', description: 'Description 2' }] } },
            'posts': { widgetType: 'posts', settings: {} },
            'portfolio': { widgetType: 'portfolio', settings: {} },
            'pro-gallery': { widgetType: 'pro-gallery', settings: {} },
            'animated-headline': { widgetType: 'animated-headline', settings: { before_text: 'This is', highlighted_text: 'Amazing', rotating_text: 'Amazing' } },
            'hotspot': { widgetType: 'hotspot', settings: { image: { url: 'https://via.placeholder.com/800' } } },
            'flip-box': { widgetType: 'flip-box', settings: { title_text_a: 'Front', title_text_b: 'Back', background_color_b: '#555555' } },
            'media-carousel': { widgetType: 'media-carousel', settings: { slides: [{ image: { url: 'https://via.placeholder.com/800' } }, { image: { url: 'https://via.placeholder.com/800' } }] } },
            'testimonial-carousel': { widgetType: 'testimonial-carousel', settings: { slides: [{ content: 'Great service!', name: 'John Doe' }] } },
            'reviews': { widgetType: 'reviews', settings: { slides: [{ name: 'Jane Doe', review: '5 stars' }] } },
            'table-of-contents': { widgetType: 'table-of-contents', settings: {} },
            'lottie': { widgetType: 'lottie', settings: { source_json: { url: '' } } },
            'code-highlight': { widgetType: 'code-highlight', settings: {} },
            'video-playlist': { widgetType: 'video-playlist', settings: { tabs: [{ title: 'Video 1', type: 'youtube', youtube_url: 'https://www.youtube.com/watch?v=XHOmBV4js_E' }] } },
            'progress-tracker': { widgetType: 'progress-tracker', settings: { items: [{ title: 'Step 1' }, { title: 'Step 2' }] } },
            'blockquote': { widgetType: 'blockquote', settings: { blockquote_content: 'To be or not to be.' } },
            'facebook-button': { widgetType: 'facebook-button', settings: {} },
            'facebook-comments': { widgetType: 'facebook-comments', settings: {} },
            'facebook-embed': { widgetType: 'facebook-embed', settings: {} },
            'facebook-page': { widgetType: 'facebook-page', settings: {} },
            'template': { widgetType: 'template', settings: {} },
            // WordPress / Woo
            'nav-menu': { widgetType: 'nav-menu', settings: {} },
            'search-form': { widgetType: 'search-form', settings: {} },
            'breadcrumbs': { widgetType: 'breadcrumbs', settings: {} },
            'sitemap': { widgetType: 'sitemap', settings: {} }
        };
    }
    compile(nodes) {
        const elements = nodes.filter(isVisible).map(node => this.processNode(node)).filter(Boolean);
        return {
            type: "elementor",
            siteurl: "",
            elements: elements,
            version: "3.2"
        };
    }
    processNode(node) {
        if (!isVisible(node))
            return null;
        const name = node.name.toLowerCase();
        // --- 1. EXPLICIT WIDGET MAPPING (w:prefix) ---
        if (name.indexOf('w:') !== -1) {
            const match = name.match(/w:([a-z0-9-]+)/);
            if (match && match[1]) {
                const widgetSlug = match[1];
                if (widgetSlug === 'container' && hasLayout(node)) {
                    return this.createContainer(node);
                }
                return this.createExplicitWidget(node, widgetSlug);
            }
        }
        // Legacy/Alias checks
        if (name.includes('button') || name.includes('btn'))
            return this.createExplicitWidget(node, 'button');
        // --- 2. STANDARD LOGIC ---
        // Safety Check
        const isLarge = node.width > 400 || node.height > 400;
        if (isLarge) {
            if (['FRAME', 'GROUP', 'INSTANCE', 'COMPONENT'].includes(node.type)) {
                if (hasLayout(node))
                    return this.createContainer(node);
                // Fallback for Groups (treat as simple container if needed)
                if ('children' in node)
                    return this.createContainer(node);
            }
            return null;
        }
        // Composite Detection
        if (['FRAME', 'GROUP', 'INSTANCE'].includes(node.type)) {
            const composite = this.detectCompositePattern(node);
            if (composite)
                return composite;
        }
        // Basic Inference
        if (hasFills(node) && this.hasImageFill(node)) {
            // If children + image fill = container
            if ('children' in node && node.children.length > 0)
                return this.createContainer(node);
            return this.createExplicitWidget(node, 'image');
        }
        if (this.isIconNode(node))
            return this.createExplicitWidget(node, 'icon');
        if (node.type === 'TEXT')
            return this.createTextWidget(node);
        // Default Container
        if (['FRAME', 'GROUP', 'INSTANCE', 'COMPONENT'].includes(node.type)) {
            if ('children' in node)
                return this.createContainer(node);
        }
        return null;
    }
    createContainer(node) {
        const isRow = node.layoutMode === 'HORIZONTAL';
        const settings = {
            flex_direction: isRow ? 'row' : 'column',
            content_width: 'full',
            width: { unit: '%', size: 100 }
        };
        // Flexbox Alignment
        if (node.primaryAxisAlignItems === 'CENTER')
            settings.justify_content = 'center';
        if (node.primaryAxisAlignItems === 'MAX')
            settings.justify_content = 'end';
        if (node.primaryAxisAlignItems === 'SPACE_BETWEEN')
            settings.justify_content = 'space-between';
        if (node.counterAxisAlignItems === 'CENTER')
            settings.align_items = 'center';
        if (node.counterAxisAlignItems === 'MAX')
            settings.align_items = 'end';
        if (node.itemSpacing > 0)
            settings.gap = { unit: 'px', size: node.itemSpacing };
        // Extract All Styles
        Object.assign(settings, extractPadding(node));
        Object.assign(settings, extractBorderStyles(node));
        Object.assign(settings, extractBackgroundAdvanced(node));
        Object.assign(settings, extractShadows(node));
        Object.assign(settings, extractDimensions(node));
        Object.assign(settings, extractOpacity(node));
        Object.assign(settings, extractTransform(node));
        Object.assign(settings, extractInnerShadow(node));
        Object.assign(settings, extractBlendMode(node));
        Object.assign(settings, extractCSSFilters(node));
        Object.assign(settings, extractOverflow(node));
        Object.assign(settings, extractPositioning(node));
        Object.assign(settings, extractCustomCSS(node));
        // Protection against unwanted Absolute Position on containers
        if (settings._position === 'absolute') {
            delete settings._position;
            delete settings._offset_x;
            delete settings._offset_y;
        }
        const children = node.children.filter(isVisible).map(child => this.processNode(child)).filter(Boolean);
        return {
            id: generateGUID(),
            elType: 'container',
            settings: settings,
            elements: children,
            isInner: false
        };
    }
    createExplicitWidget(node, widgetSlug) {
        const preset = this.widgetPresets[widgetSlug] || { widgetType: widgetSlug, settings: {} };
        const settings = JSON.parse(JSON.stringify(preset.settings));
        const textChildren = [];
        let iconChild = null;
        // 1. Sort & Classify Children
        if ('children' in node) {
            const frame = node;
            const sortedChildren = [...frame.children].sort((a, b) => a.y - b.y);
            sortedChildren.forEach(c => {
                if (!isVisible(c))
                    return;
                if (c.type === 'TEXT') {
                    textChildren.push(c);
                }
                else if (c.type === 'VECTOR' || c.name.toLowerCase().includes('icon') || c.name.toLowerCase().includes('vector')) {
                    iconChild = c;
                }
                else if (hasFills(c) && Array.isArray(c.fills) && c.fills.some((f) => f.type === 'IMAGE')) {
                    // image child detected
                }
                else if (c.type === 'FRAME' || c.type === 'GROUP') {
                    const cFrame = c;
                    if (cFrame.children && cFrame.children.some(gc => gc.type === 'VECTOR')) {
                        iconChild = c;
                    }
                }
            });
        }
        else {
            if (node.type === 'TEXT')
                textChildren.push(node);
        }
        // 2. Map Content
        if (textChildren.length > 0) {
            const titleNode = textChildren[0];
            if (settings.title === undefined && settings.title_text === undefined && settings.heading === undefined) {
                settings.title_text = titleNode.characters;
                settings.title = titleNode.characters;
                settings.heading = titleNode.characters;
            }
            else {
                if (settings.title !== undefined)
                    settings.title = titleNode.characters;
                if (settings.title_text !== undefined)
                    settings.title_text = titleNode.characters;
                if (settings.heading !== undefined)
                    settings.heading = titleNode.characters;
            }
            const titleTypo = extractTypography(titleNode);
            const titleColor = extractTextColor(titleNode);
            Object.assign(settings, titleTypo);
            if (titleColor) {
                settings.title_color = titleColor;
                settings.text_color = titleColor;
                settings.typography_color = titleColor;
            }
            for (const key in titleTypo) {
                const newKey = key.replace('typography_', 'title_typography_');
                settings[newKey] = titleTypo[key];
            }
        }
        if (textChildren.length > 1) {
            const descNode = textChildren[1];
            if (settings.description === undefined && settings.description_text === undefined) {
                settings.description_text = descNode.characters;
            }
            else {
                if (settings.description !== undefined)
                    settings.description = descNode.characters;
                if (settings.description_text !== undefined)
                    settings.description_text = descNode.characters;
            }
            const descTypo = extractTypography(descNode);
            const descColor = extractTextColor(descNode);
            if (descColor)
                settings.description_color = descColor;
            for (const key in descTypo) {
                const newKey = key.replace('typography_', 'description_typography_');
                settings[newKey] = descTypo[key];
            }
        }
        // 3. Map Icon
        if (iconChild) {
            let iconFill = null;
            // FIX: Check 'fills' existence explicitly and cast to avoid 'never' type inference
            if (hasFills(iconChild)) {
                const geoNode = iconChild;
                if (Array.isArray(geoNode.fills) && geoNode.fills.length > 0) {
                    iconFill = geoNode.fills[0];
                }
            }
            else if ('children' in iconChild) {
                const cFrame = iconChild;
                const vectorChild = cFrame.children.find((c) => hasFills(c) && Array.isArray(c.fills) && c.fills.length > 0);
                if (vectorChild)
                    iconFill = vectorChild.fills[0];
            }
            if (iconFill && iconFill.type === 'SOLID') {
                const iconColor = convertColor(iconFill);
                settings.icon_primary_color = iconColor;
                settings.icon_color = iconColor;
                settings.primary_color = iconColor;
            }
        }
        // 4. Apply Common Styles
        Object.assign(settings, extractBorderStyles(node));
        Object.assign(settings, extractShadows(node));
        if (widgetSlug !== 'icon') {
            Object.assign(settings, extractBackgroundAdvanced(node));
        }
        Object.assign(settings, extractPadding(node));
        const dimensions = extractDimensions(node);
        if (dimensions.width && dimensions.width.size < 1000) {
            Object.assign(settings, dimensions);
        }
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
        return {
            id: generateGUID(),
            elType: 'widget',
            widgetType: widgetSlug,
            settings: settings,
            elements: []
        };
    }
    detectCompositePattern(node) {
        if (!node.children)
            return null;
        const children = node.children.filter(isVisible);
        if (children.length < 2 || children.length > 4)
            return null;
        const sortedChildren = [...children].sort((a, b) => a.y - b.y);
        let hasIcon = false;
        let hasImage = false;
        let textCount = 0;
        for (const child of sortedChildren) {
            if (this.isIconNode(child))
                hasIcon = true;
            else if (hasFills(child) && this.hasImageFill(child))
                hasImage = true;
            else if (child.type === 'TEXT')
                textCount++;
        }
        if (hasIcon && textCount >= 1 && !hasImage)
            return this.createExplicitWidget(node, 'icon-box');
        if (hasImage && textCount >= 1 && !hasIcon)
            return this.createExplicitWidget(node, 'image-box');
        return null;
    }
    isIconNode(node) {
        const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];
        const isVector = vectorTypes.includes(node.type);
        const isSmallFrame = (node.type === 'FRAME' || node.type === 'INSTANCE') && node.width <= 50 && node.height <= 50;
        const name = node.name.toLowerCase();
        return isVector || isSmallFrame || name.includes('icon') || name.includes('vector');
    }
    hasImageFill(node) {
        return 'fills' in node && Array.isArray(node.fills) && node.fills.some((p) => p.type === 'IMAGE');
    }
    createTextWidget(node) {
        const isHeading = node.fontSize > 24 || node.fontName.style.toLowerCase().includes('bold');
        const widgetType = isHeading ? 'heading' : 'text-editor';
        const settings = {
            title: node.characters,
            editor: node.characters
        };
        Object.assign(settings, extractTypography(node));
        const textColor = extractTextColor(node);
        if (textColor) {
            settings.title_color = textColor;
            settings.text_color = textColor;
        }
        Object.assign(settings, extractShadows(node));
        Object.assign(settings, extractTextShadow(node));
        Object.assign(settings, extractOpacity(node));
        Object.assign(settings, extractTransform(node));
        Object.assign(settings, extractPositioning(node));
        Object.assign(settings, extractMargin(node));
        return {
            id: generateGUID(),
            elType: 'widget',
            widgetType: widgetType,
            settings: settings,
            elements: []
        };
    }
    debugNodeRecursive(node, depth) {
        if (depth > 5)
            return { type: node.type, id: node.id, note: "Max depth reached" };
        const info = { id: node.id, type: node.type, name: node.name };
        if ('children' in node) {
            info.children = node.children.map(c => this.debugNodeRecursive(c, depth + 1));
        }
        // Debug Styles Preview
        info.extractedStyles = {};
        if (node.type === 'TEXT') {
            info.extractedStyles.typography = extractTypography(node);
        }
        info.extractedStyles.margin = extractMargin(node);
        info.extractedStyles.positioning = extractPositioning(node);
        info.extractedStyles.background = extractBackgroundAdvanced(node);
        return info;
    }
}
// --- MAIN EXECUTION ---
figma.showUI(__html__, { width: 400, height: 600, themeColors: true });
figma.ui.onmessage = (msg) => {
    const compiler = new ElementorCompiler(msg.config);
    if (msg.type === 'export-elementor') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify("Selecione ao menos um frame para exportar.");
            return;
        }
        const result = compiler.compile(selection);
        figma.ui.postMessage({ type: 'export-result', data: JSON.stringify(result, null, 2) });
    }
    else if (msg.type === 'debug-structure') {
        const dump = figma.currentPage.selection.map(n => compiler.debugNodeRecursive(n, 0));
        figma.ui.postMessage({ type: 'debug-result', data: JSON.stringify(dump, null, 2) });
    }
    else if (msg.type === 'rename-layer') {
        if (figma.currentPage.selection.length === 0) {
            figma.notify("Selecione uma camada para aplicar o widget.");
            return;
        }
        figma.currentPage.selection.forEach(node => {
            node.name = msg.newName;
        });
        figma.notify("Camada(s) definida(s) como: " + msg.newName);
    }
    else if (msg.type === 'resize-window') {
        figma.ui.resize(msg.width, msg.height);
    }
};
