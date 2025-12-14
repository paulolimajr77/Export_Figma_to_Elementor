import type { PipelineWidget } from '../types/pipeline.schema';
import type { ElementorSettings } from '../types/elementor.types';
import { normalizeColor, normalizeElementorSettings, normalizePadding, normalizeSize, normalizeTextAlign } from '../utils/style_normalizer';
import { generateGUID } from '../utils/guid';

export interface WidgetDefinition {
    key: string;
    widgetType: string;
    family: 'text' | 'media' | 'action' | 'misc' | 'pro' | 'woo' | 'loop' | 'wp' | 'nav';
    aliases?: string[];
    compile: (widget: PipelineWidget, base: ElementorSettings) => { widgetType: string; settings: ElementorSettings } | null;
}

function slugFromKey(key: string): string {
    if (!key) return '';
    return key.replace(/^w:/i, '').replace(/^woo:/i, '').replace(/^loop:/i, '').replace(/:/g, '-');
}

/**
 * Convert any color format (rgba, rgb, {r,g,b}, string) to HEX string
 * Elementor Button widget prefers HEX colors
 */
function toHex(value: any): string {
    if (!value) return '#000000';

    // Already HEX
    if (typeof value === 'string' && value.startsWith('#')) {
        return value.toUpperCase();
    }

    // RGB/RGBA string: "rgba(253, 96, 96, 1)" or "rgb(253, 96, 96)"
    if (typeof value === 'string' && (value.startsWith('rgba') || value.startsWith('rgb'))) {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
        }
    }

    // Object with r, g, b (0-1 range from Figma)
    if (typeof value === 'object' && value.r !== undefined) {
        const r = Math.round((value.r || 0) * 255);
        const g = Math.round((value.g || 0) * 255);
        const b = Math.round((value.b || 0) * 255);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    // Fallback: return as-is or black
    return typeof value === 'string' ? value : '#000000';
}

function appendCustomCss(settings: ElementorSettings, css: string | undefined) {
    if (!css) return;
    const snippet = css.trim();
    if (!snippet) return;
    settings.custom_css = settings.custom_css ? `${settings.custom_css}\n${snippet}`.trim() : snippet;
}

function normalizeStopPosition(value: number | undefined, index: number, total: number): number {
    if (typeof value === 'number') {
        if (value <= 1 && value >= 0) return Math.round(value * 100);
        return Math.round(value);
    }
    if (total <= 1) return 0;
    return Math.round((index / (total - 1)) * 100);
}

function buildGradientCssString(gradient: any): string | null {
    if (!gradient || !Array.isArray(gradient.stops) || gradient.stops.length < 2) return null;
    const stops = gradient.stops.map((stop: any, idx: number) => {
        const color = typeof stop?.color === 'string' ? stop.color : toHex(stop?.color);
        const pos = normalizeStopPosition(stop?.position, idx, gradient.stops.length);
        return `${color} ${pos}%`;
    });
    if (stops.length < 2) return null;
    if ((gradient.gradientType || '').toLowerCase() === 'radial') {
        return `radial-gradient(circle, ${stops.join(', ')})`;
    }
    const angle = typeof gradient.angle === 'number' ? gradient.angle : 180;
    return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
}

function applyGradientCustomCss(settings: ElementorSettings, gradient: any, selector: string) {
    if (!gradient || !Array.isArray(gradient.stops) || gradient.stops.length <= 2) return;
    const cssValue = buildGradientCssString(gradient);
    if (!cssValue) return;
    appendCustomCss(settings, `${selector} { background-image: ${cssValue} !important; }`);
}

function stubDefinition(key: string, family: WidgetDefinition['family'] = 'misc', aliases: string[] = []): WidgetDefinition {
    const widgetType = slugFromKey(key);
    return {
        key,
        widgetType,
        family,
        aliases: [...new Set([widgetType, ...aliases])],
        compile: (_w, base) => ({ widgetType, settings: { ...base } })
    };
}

function generateAliases(key: string, ptAliases: string[] = [], extraAliases: string[] = []): string[] {
    const baseSet = new Set<string>([key, ...ptAliases, ...extraAliases]);
    const variations = new Set<string>();

    baseSet.forEach(alias => {
        const lower = alias.toLowerCase();
        variations.add(lower);
        variations.add(lower.replace(/-/g, ' ')); // image-box -> image box
        variations.add(lower.replace(/ /g, '-')); // image box -> image-box
        variations.add(lower.replace(/[- ]/g, '')); // image-box -> imagebox
        variations.add(lower.replace(/[- ]/g, '_')); // image-box -> image_box

        // Add w: prefix variations
        if (!lower.startsWith('w:')) {
            variations.add(`w:${lower}`);
            variations.add(`w:${lower.replace(/-/g, ' ')}`);
        }
    });

    return Array.from(variations);
}

const registry: WidgetDefinition[] = [
    {
        key: 'heading',
        widgetType: 'heading',
        family: 'text',
        aliases: generateAliases('heading', ['título', 'cabeçalho', 'chamada'], ['title', 'headline', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'main title', 'subtítulo']),
        compile: (w, base) => {
            const color = (base as any).color;
            return {
                widgetType: 'heading',
                settings: {
                    ...base,
                    title: w.content || 'Heading',
                    ...(color ? { title_color: color } : {})
                }
            };
        }
    },
    {
        key: 'text',
        widgetType: 'text-editor',
        family: 'text',
        aliases: generateAliases('text', ['texto', 'editor de texto', 'parágrafo', 'descrição'], ['text editor', 'paragraph', 'description', 'body text', 'conteúdo']),
        compile: (w, base) => {
            const color = (base as any).color;
            return {
                widgetType: 'text-editor',
                settings: {
                    ...base,
                    editor: w.content || 'Text',
                    ...(color ? { text_color: color } : {})
                }
            };
        }
    },
    {
        key: 'button',
        widgetType: 'button',
        family: 'action',
        aliases: generateAliases('button', ['botão', 'link', 'chamada para ação'], ['btn', 'cta', 'action button', 'clique aqui']),
        compile: (w, base) => {
            console.log('[REGISTRY DEBUG] Compiling button widget:', w.type);
            console.log('[REGISTRY DEBUG] Button has', w.children?.length || 0, 'child widgets');

            // Extract data from child widgets if available
            let buttonText = w.content || 'Button';
            let iconId = w.imageId;
            let textColor: string | undefined;
            let textStyles: any = {};

            // Check for child widgets (heading for text, image for icon)
            // Note: children can be either intermediate schema widgets (type='heading')
            // or serialized Figma nodes (type='FRAME' with name='w:icon')
            let iconIndex = -1;
            let textIndex = -1;

            // Helper to check if a child is a text/heading widget
            const isTextChild = (child: any) => {
                const type = child.type?.toLowerCase() || '';
                const name = child.name?.toLowerCase() || '';
                return type === 'heading' || type === 'text' ||
                    name.includes('w:heading') || name.includes('w:text') ||
                    child.type === 'TEXT';
            };

            // Helper to check if a child is an icon/image widget
            const isIconChild = (child: any) => {
                const type = child.type?.toLowerCase() || '';
                const name = child.name?.toLowerCase() || '';
                return type === 'image' || type === 'icon' ||
                    name.includes('w:icon') || name.includes('w:image') ||
                    (child.type === 'FRAME' && name.includes('icon'));
            };

            if (w.children && Array.isArray(w.children) && w.children.length > 0) {
                console.log('[REGISTRY DEBUG] Processing child widgets:', w.children.map(c => ({ type: c.type, name: c.name, content: c.content })));

                // Find heading/text child for button text
                const textChild = w.children.find((child, idx) => {
                    if (isTextChild(child)) {
                        textIndex = idx;
                        return true;
                    }
                    return false;
                });

                if (textChild) {
                    // Get text content from either content property or characters (for serialized TEXT nodes)
                    buttonText = textChild.content || textChild.characters || buttonText;
                    console.log('[REGISTRY DEBUG] ✅ Extracted text from child:', buttonText, 'at index:', textIndex);

                    // Extract text color from child
                    if (textChild.styles?.color) {
                        const { r, g, b } = textChild.styles.color;
                        textColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 1)`;
                        console.log('[REGISTRY DEBUG] ✅ Extracted text color from child:', textColor);
                    } else if (textChild.color) {
                        // For serialized TEXT nodes
                        const { r, g, b } = textChild.color;
                        textColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 1)`;
                    }

                    // Extract typography from child
                    if (textChild.styles) {
                        textStyles = textChild.styles;
                    } else if (textChild.fontName) {
                        // For serialized TEXT nodes
                        textStyles = {
                            fontName: textChild.fontName,
                            fontSize: textChild.fontSize,
                            fontWeight: textChild.fontWeight,
                            letterSpacing: textChild.letterSpacing,
                            lineHeight: textChild.lineHeight,
                            textCase: textChild.textCase,
                            textDecoration: textChild.textDecoration
                        };
                    }
                }

                // Find image/icon child
                const imageChild = w.children.find((child, idx) => {
                    if (isIconChild(child)) {
                        iconIndex = idx;
                        return true;
                    }
                    return false;
                });

                if (imageChild) {
                    // Priority: 1) WordPress ID from selected_icon, 2) imageId (if it's a WordPress ID), 3) fallback
                    const wpIconId = w.styles?.selected_icon?.value?.id || imageChild.styles?.selected_icon?.value?.id;
                    const rawImageId = imageChild.imageId;

                    // Check if imageId looks like a WordPress ID (number > 100) vs Figma node ID (contains :)
                    const isWpId = rawImageId && !String(rawImageId).includes(':') && parseInt(rawImageId, 10) > 100;

                    iconId = wpIconId ? String(wpIconId) : (isWpId ? rawImageId : '');
                    console.log('[REGISTRY DEBUG] ✅ Found icon child:', imageChild.name, 'at index:', iconIndex, 'wpIconId:', wpIconId, 'rawImageId:', rawImageId, 'final iconId:', iconId);
                }
            }

            const settings: any = {
                ...base,
                text: buttonText,
                // Default Elementor settings
                size: 'sm',
                button_type: '',
                align: 'center', // Default alignment
                typography_typography: 'custom'
            };

            // 1. Typography Mapping (prefer child styles, fallback to widget styles)
            const styles = textStyles.fontName ? textStyles : (w.styles || {});

            if (styles.fontName) settings.typography_font_family = styles.fontName.family;
            if (styles.fontSize) settings.typography_font_size = { unit: 'px', size: styles.fontSize };
            if (styles.fontWeight) settings.typography_font_weight = styles.fontWeight;
            if (styles.lineHeight && styles.lineHeight.unit !== 'AUTO') {
                settings.typography_line_height = {
                    unit: styles.lineHeight.unit === 'PIXELS' ? 'px' : 'em',
                    size: styles.lineHeight.value
                };
            }
            if (styles.textDecoration) {
                settings.typography_text_decoration = styles.textDecoration.toLowerCase();
            }
            if (styles.textCase) {
                const caseMap: Record<string, string> = { UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize' };
                if (caseMap[styles.textCase]) settings.typography_text_transform = caseMap[styles.textCase];
            }

            // Alignment
            if (styles.textAlignHorizontal) {
                const alignMap: Record<string, string> = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };
                if (alignMap[styles.textAlignHorizontal]) settings.align = alignMap[styles.textAlignHorizontal];
            }

            // 2. Colors & Background
            // Process background: solid, gradient, or image
            const bg = w.styles?.background;
            if (bg) {
                if (bg.type === 'gradient' || (bg.stops && Array.isArray(bg.stops))) {
                    // Gradient background
                    settings.background_background = 'gradient';
                    settings.background_gradient_type = bg.gradientType || 'linear';

                    // Angle: use extracted value, fallback to 180 (vertical)
                    const angle = bg.angle !== undefined ? bg.angle : 180;
                    settings.background_gradient_angle = { unit: 'deg', size: angle, sizes: [] };

                    if (bg.stops && bg.stops.length > 0) {
                        settings.background_color = toHex(bg.stops[0].color);

                        // Normalize stop positions (0-1 -> 0-100)
                        let stopA = bg.stops[0].position;
                        if (stopA <= 1 && stopA > 0) stopA = Math.round(stopA * 100);
                        settings.background_color_stop = { unit: '%', size: stopA || 0, sizes: [] };

                            if (bg.stops.length > 1) {
                                const last = bg.stops[bg.stops.length - 1];
                                settings.background_color_b = toHex(last.color);

                                let stopB = last.position;
                                if (stopB <= 1 && stopB > 0) stopB = Math.round(stopB * 100);
                                settings.background_color_b_stop = { unit: '%', size: stopB || 100, sizes: [] };
                            }
                        }
                    applyGradientCustomCss(settings, bg, '{{WRAPPER}} .elementor-button');
                } else if (bg.type === 'solid' || bg.color) {
                    // Solid background
                    settings.background_background = 'classic';
                    settings.background_color = toHex(bg.color || bg);
                }
            } else if (w.styles?.fills && Array.isArray(w.styles.fills) && w.styles.fills.length > 0) {
                // Fallback: check fills array
                const gradientFill = w.styles.fills.find((f: any) => f.type === 'GRADIENT_LINEAR' || f.type === 'GRADIENT_RADIAL');
                const solidFill = w.styles.fills.find((f: any) => f.type === 'SOLID');

                if (gradientFill && gradientFill.gradientStops) {
                    settings.background_background = 'gradient';
                    settings.background_gradient_type = 'linear';
                    settings.background_gradient_angle = { unit: 'deg', size: 180, sizes: [] };

                    if (gradientFill.gradientStops.length > 0) {
                        settings.background_color = toHex(gradientFill.gradientStops[0].color);
                        settings.background_color_stop = { unit: '%', size: Math.round(gradientFill.gradientStops[0].position * 100), sizes: [] };

                        if (gradientFill.gradientStops.length > 1) {
                            const last = gradientFill.gradientStops[gradientFill.gradientStops.length - 1];
                            settings.background_color_b = toHex(last.color);
                            settings.background_color_b_stop = { unit: '%', size: Math.round(last.position * 100), sizes: [] };
                        }
                    }
                    applyGradientCustomCss(
                        settings,
                        { gradientType: 'linear', stops: gradientFill.gradientStops, angle: 180 },
                        '{{WRAPPER}} .elementor-button'
                    );
                } else if (solidFill && solidFill.color) {
                    settings.background_background = 'classic';
                    settings.background_color = toHex(solidFill.color);
                }
            }

            // Text Color (prefer child color, fallback to widget color) - always HEX
            if (textColor) {
                settings.button_text_color = toHex(textColor);
            } else if (w.styles?.color) {
                settings.button_text_color = toHex(w.styles.color);
            } else if (base.color) {
                settings.button_text_color = toHex(base.color);
            }

            // 3. Padding - use text_padding (NOT button_padding)
            if (w.styles?.paddingTop !== undefined || w.styles?.paddingRight !== undefined ||
                w.styles?.paddingBottom !== undefined || w.styles?.paddingLeft !== undefined) {
                settings.text_padding = {
                    unit: 'px',
                    top: String(w.styles.paddingTop || 0),
                    right: String(w.styles.paddingRight || 0),
                    bottom: String(w.styles.paddingBottom || 0),
                    left: String(w.styles.paddingLeft || 0),
                    isLinked: false
                };
            }

            // Border Style
            if (w.styles?.border) {
                const b = w.styles.border;
                if (b.type) settings.border_border = b.type;
                if (b.width !== undefined) {
                    const bw = String(b.width);
                    settings.border_width = { unit: 'px', top: bw, right: bw, bottom: bw, left: bw, isLinked: true };
                }
                if (b.color) settings.border_color = toHex(b.color);
            }

            // Dimensions & flex behaviour
            const frameWidth = typeof (w.styles as any)?.width === 'number' ? (w.styles as any).width : (w.styles as any)?._frameWidth;
            if (typeof frameWidth === 'number' && frameWidth > 0) {
                settings.width = { unit: 'px', size: frameWidth, sizes: [] };
            }
            const frameHeight = typeof (w.styles as any)?.height === 'number' ? (w.styles as any).height : (w.styles as any)?._frameHeight;
            if (typeof frameHeight === 'number' && frameHeight > 0) {
                settings.min_height = { unit: 'px', size: frameHeight, sizes: [] };
            }
            settings.flex_grow = 0;
            if (!settings.align_self) {
                settings.align_self = 'flex-start';
            }

            // Hover Transition Duration (default 0.3s for smooth UX)
            settings.button_hover_transition_duration = { unit: 's', size: 0.3, sizes: [] };

            // 4. Border Radius
            if (w.styles?.border?.radius !== undefined) {
                settings.border_radius = {
                    unit: 'px',
                    top: w.styles.border.radius,
                    right: w.styles.border.radius,
                    bottom: w.styles.border.radius,
                    left: w.styles.border.radius,
                    isLinked: true
                };
            } else if (w.styles?.cornerRadius !== undefined) {
                settings.border_radius = {
                    unit: 'px',
                    top: w.styles.cornerRadius,
                    right: w.styles.cornerRadius,
                    bottom: w.styles.cornerRadius,
                    left: w.styles.cornerRadius,
                    isLinked: true
                };
            }

            // 5. Icon (prefer child icon, fallback to widget imageId)
            if (iconId) {
                const imgId = parseInt(iconId, 10);

                // Get URL from child image widget (icon was uploaded to child, not parent)
                let iconUrl = '';
                if (w.children && Array.isArray(w.children)) {
                    const imageChild = w.children.find(child =>
                        child.type === 'image' || child.type === 'icon'
                    );
                    if (imageChild) {
                        iconUrl = imageChild.content || '';
                        console.log('[BUTTON ICON DEBUG] Found icon URL from child:', iconUrl);
                    }
                }

                // Fallback to widget.styles.selected_icon if available
                if (!iconUrl && w.styles?.selected_icon?.value) {
                    const sv = w.styles.selected_icon.value;
                    // Se value for objeto com url, usar a url
                    iconUrl = typeof sv === 'object' && sv.url ? sv.url : sv;
                }

                console.log('[BUTTON ICON DEBUG] iconId:', iconId);
                console.log('[BUTTON ICON DEBUG] Final iconUrl:', iconUrl);

                // Formato correto para selected_icon:
                // - FontAwesome: { value: 'fas fa-star', library: 'fa-solid' }
                // - SVG: { value: { url: 'http://...', id: 123 }, library: 'svg' }
                if (!isNaN(imgId) && imgId > 0) {
                    // É um SVG com ID do WordPress
                    settings.selected_icon = {
                        value: { url: iconUrl, id: imgId },
                        library: 'svg'
                    };
                } else if (iconId.startsWith('fa')) {
                    // É um ícone FontAwesome
                    settings.selected_icon = {
                        value: iconId,
                        library: 'fa-solid'
                    };
                } else {
                    // Fallback para FontAwesome
                    settings.selected_icon = {
                        value: iconId || 'fas fa-star',
                        library: 'fa-solid'
                    };
                }

                // Posição do ícone: 'row' = ícone antes do texto, 'row-reverse' = ícone depois do texto
                // Determinar baseado na ordem dos filhos: se o ícone vem antes do texto na lista, está à esquerda
                let iconPosition = 'before';
                if (iconIndex !== -1 && textIndex !== -1) {
                    // Se o ícone está antes do texto na ordem dos filhos, está à esquerda
                    iconPosition = iconIndex < textIndex ? 'before' : 'after';
                } else if (w.styles?.iconPosition) {
                    // Fallback para o estilo iconPosition se definido
                    iconPosition = w.styles.iconPosition;
                }

                settings.icon_align = iconPosition === 'after' ? 'row-reverse' : 'row';

                // Icon spacing (icon_indent) - from itemSpacing of the button container
                const iconSpacing = w.styles?.itemSpacing || (w as any).itemSpacing;
                if (iconSpacing && iconSpacing > 0) {
                    settings.icon_indent = { unit: 'px', size: iconSpacing, sizes: [] };
                }

                console.log('[BUTTON ICON DEBUG] iconIndex:', iconIndex, 'textIndex:', textIndex, 'iconPosition:', iconPosition, 'icon_align:', settings.icon_align);
                console.log('[BUTTON ICON DEBUG] selected_icon:', settings.selected_icon, 'icon_indent:', settings.icon_indent);
            }

            return { widgetType: 'button', settings };
        }
    },
    {
        key: 'image',
        widgetType: 'image',
        family: 'media',
        aliases: generateAliases('image', ['imagem', 'foto', 'figura'], ['img', 'picture', 'photo', 'single image', 'imagem única']),
        compile: (w, base) => {
            const imgId = w.imageId ? parseInt(w.imageId, 10) : 0;
            const settings: ElementorSettings = {
                ...base,
                image: {
                    url: w.content || '',
                    id: isNaN(imgId) ? '' : imgId
                },
                image_size: 'full' // Use full resolution
            };

            // Set width from styles if available (just width, not custom dimension)
            if (w.styles?.width && typeof w.styles.width === 'number') {
                settings.width = { unit: 'px', size: Math.round(w.styles.width), sizes: [] };
            }

            console.log('[IMAGE WIDGET DEBUG]', { width: w.styles?.width, height: w.styles?.height, name: w.styles?.sourceName });

            return { widgetType: 'image', settings };
        }
    },
    {
        key: 'icon',
        widgetType: 'icon',
        family: 'media',
        aliases: generateAliases('icon', ['ícone', 'simbolo'], ['ico', 'symbol', 'svg icon']),
        compile: (w, base) => ({
            widgetType: 'icon',
            settings: { ...base, selected_icon: w.styles?.selected_icon || { value: w.content || 'fas fa-star', library: 'fa-solid' } }
        })
    },
    // Hint-based simples
    {
        key: 'image_box',
        widgetType: 'image-box',
        family: 'media',
        aliases: generateAliases('image-box', ['caixa de imagem', 'box imagem', 'card com imagem'], ['image box', 'box image', 'card image', 'feature box', 'service box']),
        compile: (w, base) => {
            const imgId = w.imageId ? parseInt(w.imageId, 10) : 0;
            const settings: any = {
                ...base,
                image: { url: base.image_url || '', id: isNaN(imgId) ? '' : imgId },
                title_text: w.content || base.title_text || w.styles?.title_text || 'Title',
                description_text: base.description_text || w.styles?.description_text || ''
            };

            // ===== TITLE TYPOGRAPHY (from w.styles.titleStyles) =====
            const titleStyles = w.styles?.titleStyles;
            if (titleStyles) {
                settings.title_typography_typography = 'custom';
                if (titleStyles.fontFamily) settings.title_typography_font_family = titleStyles.fontFamily;
                if (titleStyles.fontWeight) settings.title_typography_font_weight = String(titleStyles.fontWeight);
                if (titleStyles.fontSize) settings.title_typography_font_size = { unit: 'px', size: titleStyles.fontSize, sizes: [] };
                if (titleStyles.lineHeight) settings.title_typography_line_height = { unit: 'px', size: titleStyles.lineHeight, sizes: [] };
                if (titleStyles.letterSpacing) settings.title_typography_letter_spacing = { unit: 'px', size: titleStyles.letterSpacing, sizes: [] };
                if (titleStyles.textTransform) settings.title_typography_text_transform = titleStyles.textTransform;
                if (titleStyles.color) settings.title_color = titleStyles.color;
                if (titleStyles.textAlign) settings.align = titleStyles.textAlign;
            }

            // ===== DESCRIPTION TYPOGRAPHY (from w.styles.descriptionStyles) =====
            const descStyles = w.styles?.descriptionStyles;
            if (descStyles) {
                settings.description_typography_typography = 'custom';
                if (descStyles.fontFamily) settings.description_typography_font_family = descStyles.fontFamily;
                if (descStyles.fontWeight) settings.description_typography_font_weight = String(descStyles.fontWeight);
                if (descStyles.fontSize) settings.description_typography_font_size = { unit: 'px', size: descStyles.fontSize, sizes: [] };
                if (descStyles.lineHeight) settings.description_typography_line_height = { unit: 'px', size: descStyles.lineHeight, sizes: [] };
                if (descStyles.letterSpacing) settings.description_typography_letter_spacing = { unit: 'px', size: descStyles.letterSpacing, sizes: [] };
                if (descStyles.textTransform) settings.description_typography_text_transform = descStyles.textTransform;
                if (descStyles.color) settings.description_color = descStyles.color;
            }

            // ===== TEXT ALIGNMENT (com breakpoints responsivos) =====
            const alignSource = titleStyles?.textAlign || descStyles?.textAlign || w.styles?.align;
            if (alignSource) {
                const alignSettings = normalizeTextAlign(alignSource);
                Object.assign(settings, alignSettings);
            }

            // Map native spacing/padding when available
            const padTop = typeof w.styles?.paddingTop === 'number' ? w.styles.paddingTop : 0;
            const padRight = typeof w.styles?.paddingRight === 'number' ? w.styles.paddingRight : 0;
            const padBottom = typeof w.styles?.paddingBottom === 'number' ? w.styles.paddingBottom : 0;
            const padLeft = typeof w.styles?.paddingLeft === 'number' ? w.styles.paddingLeft : 0;
            if (padTop || padRight || padBottom || padLeft) {
                // Usar normalizePadding para garantir valores STRING
                // Widget padding vai em _padding (aba Avançado do Elementor)
                // NÃO usar box_padding/_box_padding - não existem no image-box
                const paddingValue = normalizePadding(padTop, padRight, padBottom, padLeft);
                if (paddingValue) {
                    (settings as any)._padding = paddingValue;
                    console.log('[figtoel-boxmodel] image-box _padding applied:', paddingValue);
                }
            }
            const gap = typeof w.styles?.itemSpacing === 'number' ? w.styles.itemSpacing : undefined;
            if (gap !== undefined) {
                // image-box: image_spacing e title_bottom_space são Sliders (números, não strings)
                settings.image_spacing = normalizeSize(gap);
                settings.title_bottom_space = normalizeSize(gap);
            }

            // ===== CUSTOM CSS (background, border, radius from frame) =====
            if (w.styles?.customCss) {
                let css = w.styles.customCss;
                // Remover qualquer traço de layout (padding/gap) do CSS customizado
                css = css.replace(/^\s*padding:[^;]+;?\s*$/gm, '')
                    .replace(/^\s*row-gap:[^;]+;?\s*$/gm, '')
                    .replace(/^\s*column-gap:[^;]+;?\s*$/gm, '');
                settings.custom_css = css.trim();
            }

            console.log('[IMAGE-BOX COMPILE] Typography applied:', {
                titleFamily: titleStyles?.fontFamily,
                titleColor: settings.title_color,
                descFamily: descStyles?.fontFamily,
                descColor: settings.description_color,
                hasCustomCss: !!settings.custom_css
            });

            return { widgetType: 'image-box', settings };
        }
    },
    {
        key: 'icon_box',
        widgetType: 'icon-box',
        family: 'media',
        aliases: generateAliases('icon-box', ['caixa de ícone', 'box ícone', 'card com ícone'], ['icon box', 'box icon', 'card icon', 'feature icon']),
        compile: (w, base) => {
            const settings: any = {
                ...base,
                // Prioritize w.styles.selected_icon (from upload) over base.selected_icon
                selected_icon: w.styles?.selected_icon || base.selected_icon || { value: 'fas fa-star', library: 'fa-solid' },
                title_text: w.content || base.title_text || w.styles?.title_text || 'Title',
                description_text: base.description_text || w.styles?.description_text || ''
            };

            // ===== TITLE TYPOGRAPHY (from w.styles.titleStyles) =====
            const titleStyles = w.styles?.titleStyles;
            if (titleStyles) {
                settings.title_typography_typography = 'custom';
                if (titleStyles.fontFamily) settings.title_typography_font_family = titleStyles.fontFamily;
                if (titleStyles.fontWeight) settings.title_typography_font_weight = String(titleStyles.fontWeight);
                if (titleStyles.fontSize) settings.title_typography_font_size = { unit: 'px', size: titleStyles.fontSize, sizes: [] };
                if (titleStyles.lineHeight) settings.title_typography_line_height = { unit: 'px', size: titleStyles.lineHeight, sizes: [] };
                if (titleStyles.letterSpacing) settings.title_typography_letter_spacing = { unit: 'px', size: titleStyles.letterSpacing, sizes: [] };
                if (titleStyles.textTransform) settings.title_typography_text_transform = titleStyles.textTransform;
                if (titleStyles.color) settings.title_color = titleStyles.color;
            }

            // ===== DESCRIPTION TYPOGRAPHY (from w.styles.descriptionStyles) =====
            const descStyles = w.styles?.descriptionStyles;
            if (descStyles) {
                settings.description_typography_typography = 'custom';
                if (descStyles.fontFamily) settings.description_typography_font_family = descStyles.fontFamily;
                if (descStyles.fontWeight) settings.description_typography_font_weight = String(descStyles.fontWeight);
                if (descStyles.fontSize) settings.description_typography_font_size = { unit: 'px', size: descStyles.fontSize, sizes: [] };
                if (descStyles.lineHeight) settings.description_typography_line_height = { unit: 'px', size: descStyles.lineHeight, sizes: [] };
                if (descStyles.letterSpacing) settings.description_typography_letter_spacing = { unit: 'px', size: descStyles.letterSpacing, sizes: [] };
                if (descStyles.textTransform) settings.description_typography_text_transform = descStyles.textTransform;
                if (descStyles.color) settings.description_color = descStyles.color;
            }

            // ===== TEXT ALIGNMENT (com breakpoints responsivos) =====
            const alignSource = titleStyles?.textAlign || descStyles?.textAlign || w.styles?.align;
            if (alignSource) {
                const alignSettings = normalizeTextAlign(alignSource);
                Object.assign(settings, alignSettings);
            }

            // Map native spacing/padding when available
            const padTop = typeof w.styles?.paddingTop === 'number' ? w.styles.paddingTop : 0;
            const padRight = typeof w.styles?.paddingRight === 'number' ? w.styles.paddingRight : 0;
            const padBottom = typeof w.styles?.paddingBottom === 'number' ? w.styles.paddingBottom : 0;
            const padLeft = typeof w.styles?.paddingLeft === 'number' ? w.styles.paddingLeft : 0;
            const hasPadding = padTop || padRight || padBottom || padLeft;
            if (hasPadding) {
                // Usar normalizePadding para garantir valores STRING
                // Widget padding vai em _padding (aba Avançado do Elementor)
                // NÃO usar box_padding/_box_padding - não existem no icon-box
                const paddingValue = normalizePadding(padTop, padRight, padBottom, padLeft);
                if (paddingValue) {
                    (settings as any)._padding = paddingValue;
                    console.log('[figtoel-boxmodel] icon-box _padding applied:', paddingValue);
                }
            }
            const gap = typeof w.styles?.itemSpacing === 'number' ? w.styles.itemSpacing : undefined;
            if (gap !== undefined) {
                // icon-box: icon_space e title_bottom_space são Sliders (números, não strings)
                settings.icon_space = normalizeSize(gap);
                settings.title_bottom_space = normalizeSize(gap);
            }

            // ===== CUSTOM CSS (background, border, radius from frame) =====
            if (w.styles?.customCss) {
                let css = w.styles.customCss;
                css = css.replace(/^\s*padding:[^;]+;?\s*$/gm, '')
                    .replace(/^\s*row-gap:[^;]+;?\s*$/gm, '')
                    .replace(/^\s*column-gap:[^;]+;?\s*$/gm, '');
                settings.custom_css = css.trim();
            }

            console.log('[ICON-BOX COMPILE] Typography applied:', {
                titleFamily: titleStyles?.fontFamily,
                titleColor: settings.title_color,
                descFamily: descStyles?.fontFamily,
                descColor: settings.description_color,
                hasCustomCss: !!settings.custom_css
            });

            return { widgetType: 'icon-box', settings };
        }
    },
    {
        key: 'icon_list',
        widgetType: 'icon-list',
        family: 'media',
        aliases: generateAliases('icon-list', ['lista de ícones', 'lista', 'tópicos'], ['icon list', 'list', 'bullet points', 'check list']),
        compile: (w, base) => {
            const settings: ElementorSettings = {
                view: 'traditional',
                link_click: 'full_width',
                ...base
            };

            // Extract items from children if available
            const children = w.children || [];
            console.log('[ICON-LIST] Processing with', children.length, 'children');

            if (children.length > 0) {
                settings.icon_list = children.map((child: any, idx: number) => {
                    // Each child should have text and optionally an icon
                    const text = child.content || child.styles?.sourceName || `Item ${idx + 1}`;
                    const iconId = child.imageId;

                    console.log('[ICON-LIST] Item', idx, ':', { text, iconId });

                    const item: any = {
                        _id: Math.random().toString(36).substring(2, 9),
                        text: text,
                        selected_icon: iconId ? {
                            value: { url: child.styles?.icon_url || '', id: iconId },
                            library: 'svg'
                        } : { value: 'fas fa-check', library: 'fa-solid' },
                        link: { url: '', is_external: '', nofollow: '', custom_attributes: '' }
                    };

                    // EXPLICITLY DELETE ANY LEGACY ICON PROP IF IT EXISTS (Paranoia Check)
                    if (item.icon) delete item.icon;

                    console.log('[ICON-LIST] Generated Item:', JSON.stringify(item));
                    return item;
                });
            } else if (w.styles?.icon_list) {
                // Already has icon_list from AI or other source
                settings.icon_list = w.styles.icon_list;
            } else {
                // Fallback: create single item from widget content
                settings.icon_list = [{
                    _id: 'list_item_1',
                    text: w.content || 'Item',
                    selected_icon: w.imageId ? {
                        value: { url: '', id: w.imageId },
                        library: 'svg'
                    } : { value: 'fas fa-check', library: 'fa-solid' },
                    link: { url: '', is_external: '', nofollow: '', custom_attributes: '' }
                }];
            }

            return { widgetType: 'icon-list', settings };
        }
    },
    {
        key: 'video',
        widgetType: 'video',
        family: 'media',
        aliases: generateAliases('video', ['vídeo', 'player'], ['youtube', 'vimeo', 'video player']),
        compile: (w, base) => ({ widgetType: 'video', settings: { ...base, link: w.content || '' } })
    },
    {
        key: 'divider',
        widgetType: 'divider',
        family: 'misc',
        aliases: generateAliases('divider', ['divisor', 'linha', 'separador'], ['line', 'separator', 'horizontal line', 'linha horizontal']),
        compile: (_w, base) => ({ widgetType: 'divider', settings: { ...base } })
    },
    {
        key: 'spacer',
        widgetType: 'spacer',
        family: 'misc',
        aliases: generateAliases('spacer', ['espaçamento', 'espaço', 'separador'], ['space', 'gap', 'empty space', 'vazio']),
        compile: (_w, base) => ({ widgetType: 'spacer', settings: { ...base, space: base.space ?? 20 } })
    },
    {
        key: 'star-rating',
        widgetType: 'star-rating',
        family: 'misc',
        aliases: generateAliases('star-rating', ['avaliação', 'estrelas', 'nota'], ['star rating', 'stars', 'rating', '5 stars']),
        compile: (w, base) => ({ widgetType: 'star-rating', settings: { ...base, rating: Number(w.content) || 5 } })
    },
    {
        key: 'counter',
        widgetType: 'counter',
        family: 'misc',
        aliases: generateAliases('counter', ['contador', 'número'], ['number', 'stats']),
        compile: (w, base) => ({
            widgetType: 'counter',
            settings: {
                ...base,
                starting_number: 0,
                ending_number: Number(w.content) || 100,
                prefix: base.prefix,
                suffix: base.suffix
            }
        })
    },
    {
        key: 'countdown',
        widgetType: 'countdown',
        family: 'pro',
        aliases: generateAliases('countdown', ['contagem regressiva', 'timer'], ['timer', 'count down', 'clock']),
        compile: (w, base) => {
            const settings: ElementorSettings = { ...base };

            // Extract time values and labels from children
            const children = w.children || [];
            const timeData: { days?: number; hours?: number; minutes?: number; seconds?: number } = {};
            const labels: { days?: string; hours?: string; minutes?: string; seconds?: string } = {};
            let digitsColor: string | undefined;
            let labelColor: string | undefined;
            let digitsFontSize: number | undefined;
            let labelFontSize: number | undefined;

            // Parse children to find numeric values and labels
            children.forEach((child: any) => {
                const text = (child.content || '').toString().trim();
                const lowerText = text.toLowerCase();

                // Check if it's a numeric value
                const numValue = parseInt(text, 10);
                if (!isNaN(numValue) && text.match(/^\d+$/)) {
                    // Extract digit color and font size from first numeric child
                    if (!digitsColor && child.styles?.color) {
                        digitsColor = normalizeColor(child.styles.color);
                    }
                    if (!digitsFontSize && child.styles?.fontSize) {
                        digitsFontSize = child.styles.fontSize;
                    }

                    // Look ahead to find the label (next non-separator child)
                    const childIndex = children.indexOf(child);
                    for (let i = childIndex + 1; i < children.length; i++) {
                        const nextChild = children[i];
                        const nextText = (nextChild.content || '').toString().trim().toLowerCase();

                        if (nextText === ':') continue; // Skip separators

                        // Match label to time unit
                        if (nextText.includes('dia') || nextText.includes('day')) {
                            timeData.days = numValue;
                            labels.days = String(nextChild.content ?? '');
                            // Extract label color from first label
                            if (!labelColor && nextChild.styles?.color) {
                                labelColor = normalizeColor(nextChild.styles.color);
                            }
                            if (!labelFontSize && nextChild.styles?.fontSize) {
                                labelFontSize = nextChild.styles.fontSize;
                            }
                        } else if (nextText.includes('hr') || nextText.includes('hour') || nextText.includes('hora')) {
                            timeData.hours = numValue;
                            labels.hours = String(nextChild.content ?? '');
                            if (!labelColor && nextChild.styles?.color) {
                                labelColor = normalizeColor(nextChild.styles.color);
                            }
                            if (!labelFontSize && nextChild.styles?.fontSize) {
                                labelFontSize = nextChild.styles.fontSize;
                            }
                        } else if (nextText.includes('min') || nextText.includes('minute')) {
                            timeData.minutes = numValue;
                            labels.minutes = String(nextChild.content ?? '');
                            if (!labelColor && nextChild.styles?.color) {
                                labelColor = normalizeColor(nextChild.styles.color);
                            }
                            if (!labelFontSize && nextChild.styles?.fontSize) {
                                labelFontSize = nextChild.styles.fontSize;
                            }
                        } else if (nextText.includes('seg') || nextText.includes('sec') || nextText.includes('second')) {
                            timeData.seconds = numValue;
                            labels.seconds = String(nextChild.content ?? '');
                            if (!labelColor && nextChild.styles?.color) {
                                labelColor = normalizeColor(nextChild.styles.color);
                            }
                            if (!labelFontSize && nextChild.styles?.fontSize) {
                                labelFontSize = nextChild.styles.fontSize;
                            }
                        }
                        break;
                    }
                }
            });

            console.log('[COUNTDOWN] Extracted time data:', timeData);
            console.log('[COUNTDOWN] Extracted labels:', labels);
            console.log('[COUNTDOWN] Extracted colors - digits:', digitsColor, 'labels:', labelColor);

            // Calculate due_date (current time + extracted time)
            const now = new Date();
            const futureDate = new Date(now);

            if (timeData.days) futureDate.setDate(futureDate.getDate() + timeData.days);
            if (timeData.hours) futureDate.setHours(futureDate.getHours() + timeData.hours);
            if (timeData.minutes) futureDate.setMinutes(futureDate.getMinutes() + timeData.minutes);
            if (timeData.seconds) futureDate.setSeconds(futureDate.getSeconds() + timeData.seconds);

            // Format as YYYY-MM-DD HH:mm (Elementor format)
            const pad = (n: number) => (n < 10 ? '0' + n : String(n));
            const year = futureDate.getFullYear();
            const month = pad(futureDate.getMonth() + 1);
            const day = pad(futureDate.getDate());
            const hours = pad(futureDate.getHours());
            const minutes = pad(futureDate.getMinutes());
            const dueDate = `${year}-${month}-${day} ${hours}:${minutes}`;

            // Build settings
            settings.countdown_type = 'due_date';
            settings.due_date = dueDate;

            // Show/hide units based on what was found
            settings.show_days = timeData.days !== undefined ? 'yes' : '';
            settings.show_hours = timeData.hours !== undefined ? 'yes' : '';
            settings.show_minutes = timeData.minutes !== undefined ? 'yes' : '';
            settings.show_seconds = timeData.seconds !== undefined ? 'yes' : '';

            // Custom labels
            settings.show_labels = 'yes';
            settings.custom_labels = 'yes';
            if (labels.days) settings.label_days = labels.days;
            if (labels.hours) settings.label_hours = labels.hours;
            if (labels.minutes) settings.label_minutes = labels.minutes;
            if (labels.seconds) settings.label_seconds = labels.seconds;

            // Apply visual styling from Figma
            // Background - Convert rgba to hex format
            if (base.background_color) {
                settings.box_background_color = base.background_color;
            }

            // Border - Only set if border exists
            if (base.border_color && base.border_width) {
                settings.box_border_border = 'solid';
                settings.box_border_color = base.border_color;
                settings.box_border_width = base.border_width;
            }

            // Border Radius
            if (base.border_radius) {
                settings.box_border_radius = base.border_radius;
            }

            // Text Colors - Apply directly (compiler will handle conversion)
            if (digitsColor) {
                settings.digits_color = digitsColor;
            }
            if (labelColor) {
                settings.label_color = labelColor;
            }

            // Typography - Match Elementor structure
            if (digitsFontSize) {
                settings.digits_typography_typography = 'custom';
                settings.digits_typography_font_size = {
                    unit: 'px',
                    size: digitsFontSize,
                    sizes: []
                };
            }
            if (labelFontSize) {
                settings.label_typography_typography = 'custom';
                settings.label_typography_font_size = {
                    unit: 'px',
                    size: labelFontSize,
                    sizes: []
                };
            }

            console.log('[COUNTDOWN] Generated due_date:', dueDate);
            console.log('[COUNTDOWN] Final settings:', settings);

            return { widgetType: 'countdown', settings };
        }
    },
    {
        key: 'progress',
        widgetType: 'progress',
        family: 'misc',
        aliases: generateAliases('progress', ['barra de progresso', 'progresso'], ['progress bar', 'bar', 'skill bar']),
        compile: (w, base) => ({
            widgetType: 'progress',
            settings: { ...base, title: w.content || base.title || 'Progresso', percent: Number(base.percent) || 50 }
        })
    },
    {
        key: 'tabs',
        widgetType: 'tabs',
        family: 'misc',
        aliases: generateAliases('tabs', ['abas', 'guias'], ['tabbed content']),
        compile: (w, base) => ({
            widgetType: 'tabs',
            settings: {
                ...base,
                tabs: base.tabs || [{ _id: 'tab1', tab_title: 'Aba 1', tab_content: w.content || 'Conteúdo' }]
            }
        })
    },
    {
        key: 'accordion',
        widgetType: 'accordion',
        family: 'misc',
        aliases: generateAliases('accordion', ['acordeão', 'sanfona'], ['collapse', 'faq']),
        compile: (w, base) => {
            // Debug: log what we receive
            console.log('[ACCORDION COMPILE] Received widget:', JSON.stringify({
                type: w.type,
                content: w.content,
                childrenCount: w.children?.length || 0,
                children: w.children?.map((c: any) => ({
                    content: c.content,
                    styles: c.styles
                }))
            }, null, 2));

            // Build items array for nested-accordion (exactly matching Elementor reference)
            const items: any[] = [];
            const nestedElements: any[] = [];

            if (w.children && w.children.length > 0) {
                w.children.forEach((child: any, i: number) => {
                    const itemId = generateGUID();
                    const title = child.styles?.title || child.content || `Item ${i + 1}`;

                    // Items array format from Elementor reference
                    items.push({
                        item_title: title,
                        _id: itemId,
                        element_css_id: ''
                    });

                    // Nested container with FULL settings from Elementor reference
                    nestedElements.push({
                        id: generateGUID(),
                        elType: 'container',
                        isInner: true,
                        isLocked: true,
                        settings: {
                            _title: title,
                            content_width: 'full',
                            container_type: 'flex',
                            width: { unit: '%', size: '', sizes: [] },
                            min_height: { unit: 'px', size: '', sizes: [] },
                            flex_direction: '',
                            flex__is_row: 'row',
                            flex__is_column: 'column',
                            flex_justify_content: '',
                            flex_align_items: '',
                            flex_gap: { column: '', row: '', isLinked: true, unit: 'px' },
                            flex_wrap: '',
                            overflow: '',
                            html_tag: '',
                            background_background: '',
                            background_color: '',
                            border_border: '',
                            border_radius: { unit: 'px', top: '', right: '', bottom: '', left: '', isLinked: true },
                            margin: { unit: 'px', top: '', right: '', bottom: '', left: '', isLinked: true },
                            padding: { unit: 'px', top: '', right: '', bottom: '', left: '', isLinked: true },
                            _element_id: '',
                            css_classes: ''
                        },
                        defaultEditSettings: { defaultEditRoute: 'content' },
                        elements: []
                    });
                });
            }

            // Fallback if no items
            if (items.length === 0) {
                const itemId = generateGUID();
                items.push({ item_title: 'Item 1', _id: itemId, element_css_id: '' });
                nestedElements.push({
                    id: generateGUID(),
                    elType: 'container',
                    isInner: true,
                    isLocked: true,
                    settings: {
                        _title: 'Item 1',
                        content_width: 'full',
                        container_type: 'flex',
                        width: { unit: '%', size: '', sizes: [] },
                        flex_direction: '',
                        flex__is_row: 'row',
                        flex__is_column: 'column'
                    },
                    defaultEditSettings: { defaultEditRoute: 'content' },
                    elements: []
                });
            }

            // Remove selected_icon from base to prevent duplication
            const { selected_icon: _, ...cleanBase } = base;

            // Settings EXACTLY matching Elementor reference structure
            const settings: any = {
                ...cleanBase,
                items: items,
                accordion_item_title_position_horizontal: 'stretch',
                accordion_item_title_icon_position: 'end',
                accordion_item_title_icon: { value: 'fas fa-plus', library: 'fa-solid' },
                accordion_item_title_icon_active: { value: 'fas fa-minus', library: 'fa-solid' },
                title_tag: 'div',
                faq_schema: '',
                default_state: 'expanded',
                max_items_expended: 'one',
                n_accordion_animation_duration: { unit: 'ms', size: 400, sizes: [] },
                accordion_item_title_space_between: { unit: 'px', size: 8, sizes: [] },
                accordion_item_title_distance_from_content: { unit: 'px', size: 10, sizes: [] },
                accordion_background_normal_background: '',
                accordion_background_normal_color: '',
                accordion_border_normal_border: '',
                accordion_border_radius: { unit: 'px', top: '5', right: '5', bottom: '5', left: '5', isLinked: true },
                accordion_padding: { unit: 'px', top: '10', right: '10', bottom: '10', left: '10', isLinked: true },
                title_typography_typography: '',
                normal_title_color: '',
                icon_size: { unit: 'px', size: 20, sizes: [] },
                normal_icon_color: '',
                content_background_background: 'classic',
                content_background_color: '',
                content_border_border: '',
                content_border_radius: { unit: 'px', top: '5', right: '5', bottom: '5', left: '5', isLinked: true },
                content_padding: { unit: 'px', top: '20', right: '20', bottom: '20', left: '20', isLinked: true }
            };

            // Add uploaded icon if available
            if (w.styles?.selected_icon) {
                settings.accordion_item_title_icon = w.styles.selected_icon;
            }

            return {
                widgetType: 'nested-accordion',
                settings,
                elements: nestedElements
            };
        }
    },
    {
        key: 'toggle',
        widgetType: 'toggle',
        family: 'misc',
        aliases: generateAliases('toggle', ['alternar', 'toggle'], []),
        compile: (w, base) => {
            // Build tabs array for toggle (same format as accordion)
            const tabs: any[] = [];

            if (w.children && w.children.length > 0) {
                w.children.forEach((child: any, i: number) => {
                    const itemId = generateGUID();
                    const title = child.styles?.title || child.content || `Toggle Item ${i + 1}`;
                    const content = child.styles?.content || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

                    tabs.push({
                        tab_title: title,
                        tab_content: content,
                        _id: itemId
                    });
                });
            }

            // Fallback if no items
            if (tabs.length === 0) {
                tabs.push({
                    tab_title: 'Toggle Item 1',
                    tab_content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
                    _id: generateGUID()
                });
            }

            // Remove selected_icon from base to prevent duplication
            const { selected_icon: _, ...cleanBase } = base;

            const settings: any = {
                ...cleanBase,
                tabs: tabs,
                // Icons
                selected_icon: { value: 'fas fa-plus', library: 'fa-solid' },
                selected_active_icon: { value: 'fas fa-minus', library: 'fa-solid' },
                icon_align: 'right',
                // Title
                title_html_tag: 'div',
                // Behavior
                faq_schema: ''
            };

            // Add selected_icon if available (populated after upload)
            if (w.styles?.selected_icon) {
                settings.selected_icon = w.styles.selected_icon;
            }

            return {
                widgetType: 'toggle',
                settings
            };
        }
    },
    {
        key: 'alert',
        widgetType: 'alert',
        family: 'misc',
        aliases: generateAliases('alert', ['alerta', 'aviso', 'notificação'], ['notification', 'message', 'info box']),
        compile: (w, base) => ({
            widgetType: 'alert',
            settings: { ...base, alert_type: base.alert_type || 'info', title: w.content || base.title || 'Alerta' }
        })
    },
    {
        key: 'social-icons',
        widgetType: 'social-icons',
        family: 'misc',
        aliases: generateAliases('social-icons', ['ícones sociais', 'redes sociais'], ['social icons', 'social media', 'follow us', 'facebook', 'instagram']),
        compile: (_w, base) => ({
            widgetType: 'social-icons',
            settings: {
                ...base,
                social_icon_list:
                    base.social_icon_list ||
                    [
                        { _id: 'soc1', icon: { value: 'fab fa-facebook', library: 'fa-brands' }, link: { url: '' } } as any
                    ]
            }
        })
    },
    {
        key: 'soundcloud',
        widgetType: 'soundcloud',
        family: 'media',
        aliases: generateAliases('soundcloud', ['áudio', 'som'], ['audio', 'player']),
        compile: (w, base) => ({ widgetType: 'soundcloud', settings: { ...base, url: w.content || base.url || '' } })
    },
    {
        key: 'shortcode',
        widgetType: 'shortcode',
        family: 'misc',
        aliases: generateAliases('shortcode', ['shortcode', 'código'], ['code']),
        compile: (w, base) => ({ widgetType: 'shortcode', settings: { ...base, shortcode: w.content || base.shortcode || '' } })
    },
    {
        key: 'menu-anchor',
        widgetType: 'menu-anchor',
        family: 'nav',
        aliases: generateAliases('menu-anchor', ['âncora', 'link interno'], ['menu anchor', 'anchor', 'id']),
        compile: (w, base) => ({ widgetType: 'menu-anchor', settings: { ...base, anchor: w.content || base.anchor || 'ancora' } })
    },
    {
        key: 'sidebar',
        widgetType: 'sidebar',
        family: 'misc',
        compile: (w, base) => ({ widgetType: 'sidebar', settings: { ...base, sidebar: w.content || base.sidebar || 'sidebar-1' } })
    },
    {
        key: 'read-more',
        widgetType: 'read-more',
        family: 'action',
        aliases: generateAliases('read-more', ['leia mais'], ['read more']),
        compile: (w, base) => ({ widgetType: 'read-more', settings: { ...base, text: w.content || base.text || 'Leia mais' } })
    },
    {
        key: 'image-carousel',
        widgetType: 'image-carousel',
        family: 'media',
        aliases: generateAliases('image-carousel', ['carrossel de imagens', 'slider de imagens', 'carrossel'], ['image carousel', 'logo carousel', 'logos', 'slider']),
        compile: (w, base) => {
            let slides = (base as any).slides as any[];

            // Fallback: use children if no slides in settings
            if ((!slides || slides.length === 0) && w.children && w.children.length > 0) {
                slides = w.children
                    .filter(c => c.type === 'image')
                    .map((c, i) => ({
                        _id: `slide_${i + 1}`,
                        id: c.imageId ? parseInt(c.imageId, 10) : '',
                        url: c.content || '',
                        image: {
                            url: c.content || '',
                            id: c.imageId ? parseInt(c.imageId, 10) : ''
                        }
                    }));
            }

            const fallbackSlide = {
                id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : '',
                url: w.content || '',
                image: { url: w.content || '', id: w.imageId || '' },
                _id: 'slide1'
            };
            const normalizedSlides = Array.isArray(slides) && slides.length > 0
                ? slides.map((s, i) => ({
                    _id: s._id || `slide_${i + 1}`,
                    id: (() => {
                        const raw = s.id ?? s.image?.id;
                        const parsed = raw !== undefined ? parseInt(String(raw), 10) : NaN;
                        return isNaN(parsed) ? '' : parsed;
                    })(),
                    url: s.url || s.image?.url || '',
                    image: (() => {
                        const url = s.url || s.image?.url || '';
                        const raw = s.id ?? s.image?.id;
                        const parsed = raw !== undefined ? parseInt(String(raw), 10) : NaN;
                        const id = isNaN(parsed) ? '' : parsed;
                        return { url, id };
                    })()
                }))
                : [fallbackSlide];
            return {
                widgetType: 'image-carousel',
                settings: {
                    ...base,
                    carousel: normalizedSlides,
                    slides: normalizedSlides // Keep both for compatibility
                }
            };
        }
    },
    {
        key: 'loop-carousel',
        widgetType: 'loop-carousel',
        family: 'pro',
        aliases: generateAliases('loop-carousel', ['loop do carrossel', 'loop carousel'], ['loop']),
        compile: (w, base) => ({
            widgetType: 'loop-carousel',
            settings: {
                ...base,
                // Loop carousel relies on templates, so we mostly pass base settings
                // but we can ensure some defaults if needed
                slides_to_show: base.slides_to_show || '3',
                slides_to_scroll: base.slides_to_scroll || '1'
            }
        })
    },
    {
        key: 'basic-gallery',
        widgetType: 'basic-gallery',
        family: 'media',
        aliases: generateAliases('basic-gallery', ['galeria básica'], ['basic gallery']),
        compile: (w, base) => {
            let gallery = base.gallery as any[];

            if ((!gallery || gallery.length === 0) && w.children && w.children.length > 0) {
                gallery = w.children
                    .filter(c => c.type === 'image')
                    .map(c => ({
                        id: c.imageId ? parseInt(c.imageId, 10) : '',
                        url: c.content || ''
                    }));
            }

            return {
                widgetType: 'basic-gallery',
                settings: {
                    ...base,
                    gallery: gallery || [{
                        id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : '',
                        url: w.content || ''
                    } as any]
                }
            };
        }
    },
    {
        key: 'media:carousel',
        widgetType: 'media-carousel',
        family: 'media',
        aliases: generateAliases('media-carousel', ['carrossel de mídia'], ['media carousel']),
        compile: (w, base) => {
            let slides = (base as any).slides as any[];

            // Fallback: use children if no slides in settings
            if ((!slides || slides.length === 0) && w.children && w.children.length > 0) {
                slides = w.children
                    .filter(c => c.type === 'image')
                    .map((c, i) => ({
                        _id: `slide_${i + 1}`,
                        id: c.imageId ? parseInt(c.imageId, 10) : '',
                        url: c.content || '',
                        image: {
                            url: c.content || '',
                            id: c.imageId ? parseInt(c.imageId, 10) : ''
                        }
                    }));
            }

            const fallbackSlide = {
                id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : '',
                url: w.content || '',
                image: { url: w.content || '', id: w.imageId || '' },
                _id: 'slide1'
            };
            const normalizedSlides = Array.isArray(slides) && slides.length > 0
                ? slides.map((s, i) => ({
                    _id: s._id || `slide_${i + 1}`,
                    id: (() => {
                        const raw = s.id ?? s.image?.id;
                        const parsed = raw !== undefined ? parseInt(String(raw), 10) : NaN;
                        return isNaN(parsed) ? '' : parsed;
                    })(),
                    url: s.url || s.image?.url || '',
                    image: (() => {
                        const url = s.url || s.image?.url || '';
                        const raw = s.id ?? s.image?.id;
                        const parsed = raw !== undefined ? parseInt(String(raw), 10) : NaN;
                        const id = isNaN(parsed) ? '' : parsed;
                        return { url, id };
                    })()
                }))
                : [fallbackSlide];
            return {
                widgetType: 'media-carousel',
                settings: {
                    ...base,
                    slides: normalizedSlides
                }
            };
        }
    },
    {
        key: 'testimonial-carousel',
        widgetType: 'testimonial-carousel',
        family: 'pro',
        aliases: generateAliases('testimonial-carousel', ['carrossel de depoimentos'], ['testimonial carousel']),
        compile: (w, base) => {
            // Testimonial carousel usually has a repeater field 'slides'
            // Each slide has: content, image, name, title
            const slides = (base as any).slides || [];
            return {
                widgetType: 'testimonial-carousel',
                settings: {
                    ...base,
                    slides: slides
                }
            };
        }
    },
    {
        key: 'reviews',
        widgetType: 'reviews',
        family: 'pro',
        aliases: generateAliases('reviews', ['avaliações'], ['reviews']),
        compile: (w, base) => {
            // Reviews widget usually has a repeater field 'slides'
            const slides = (base as any).slides || [];
            return {
                widgetType: 'reviews',
                settings: {
                    ...base,
                    slides: slides
                }
            };
        }
    },
    {
        key: 'slider:slides',
        widgetType: 'slides',
        family: 'media',
        aliases: generateAliases('slider:slides', ['slides', 'slider'], ['hero slider', 'banner rotativo']),
        compile: (w, base) => {
            const slides = (base as any).slides || [];

            // If no slides found but we have children, we might want to try to construct them
            // but the parser should have handled this.

            return {
                widgetType: 'slides',
                settings: {
                    ...base,
                    slides: slides
                }
            };
        }
    },
    {
        key: 'w:slideshow',
        widgetType: 'image-carousel',
        family: 'media',
        aliases: generateAliases('w:slideshow', ['slideshow'], []),
        compile: (w, base) => {
            let slides = (base as any).slides as any[];

            // Fallback: use children if no slides in settings
            if ((!slides || slides.length === 0) && w.children && w.children.length > 0) {
                slides = w.children
                    .filter(c => c.type === 'image')
                    .map((c, i) => ({
                        _id: `slide_${i + 1}`,
                        id: c.imageId ? parseInt(c.imageId, 10) : '',
                        url: c.content || '',
                        image: {
                            url: c.content || '',
                            id: c.imageId ? parseInt(c.imageId, 10) : ''
                        }
                    }));
            }

            const fallbackSlide = {
                id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : '',
                url: w.content || '',
                image: { url: w.content || '', id: w.imageId || '' },
                _id: 'slide1'
            };
            const normalizedSlides = Array.isArray(slides) && slides.length > 0
                ? slides.map((s, i) => ({
                    _id: s._id || `slide_${i + 1}`,
                    id: (() => {
                        const raw = s.id ?? s.image?.id;
                        const parsed = raw !== undefined ? parseInt(String(raw), 10) : NaN;
                        return isNaN(parsed) ? '' : parsed;
                    })(),
                    url: s.url || s.image?.url || '',
                    image: (() => {
                        const url = s.url || s.image?.url || '';
                        const raw = s.id ?? s.image?.id;
                        const parsed = raw !== undefined ? parseInt(String(raw), 10) : NaN;
                        const id = isNaN(parsed) ? '' : parsed;
                        return { url, id };
                    })()
                }))
                : [fallbackSlide];
            return {
                widgetType: 'image-carousel',
                settings: {
                    ...base,
                    slides: normalizedSlides
                }
            };
        }
    },
    {
        key: 'gallery',
        widgetType: 'gallery',
        family: 'media',
        aliases: generateAliases('gallery', ['galeria', 'galeria de fotos', 'fotos'], ['photo gallery', 'images', 'grid gallery']),
        compile: (w, base) => {
            let gallery = base.gallery as any[];

            if ((!gallery || gallery.length === 0) && w.children && w.children.length > 0) {
                gallery = w.children
                    .filter(c => c.type === 'image')
                    .map(c => ({
                        id: c.imageId ? parseInt(c.imageId, 10) : '',
                        url: c.content || ''
                    }));
            }

            return {
                widgetType: 'gallery',
                settings: {
                    ...base,
                    gallery: gallery || [{
                        id: w.imageId && !isNaN(parseInt(w.imageId, 10)) ? parseInt(w.imageId, 10) : '',
                        url: w.content || ''
                    } as any]
                }
            };
        }
    },
    {
        key: 'nav-menu',
        widgetType: 'nav-menu',
        family: 'nav',
        aliases: generateAliases('nav-menu', ['menu', 'navegação', 'menu principal'], ['nav menu', 'navigation', 'navbar', 'header menu', 'menu topo']),
        compile: (w, base) => {
            const settings: ElementorSettings = {
                ...base,
                layout: base.layout || 'horizontal',
                menu: w.content || base.menu || '',
                // Full width stretch
                full_width: 'stretch',
                stretch_element_to_full_width: 'yes',
                // Align menu items
                align_items: 'center'
            };

            // Typography from styles
            if (w.styles?.fontSize) {
                settings.typography_typography = 'custom';
                settings.typography_font_size = { unit: 'px', size: w.styles.fontSize };
            }
            if (w.styles?.fontName?.family) {
                settings.typography_typography = 'custom';
                settings.typography_font_family = w.styles.fontName.family;
            }
            if (w.styles?.fontWeight) {
                settings.typography_font_weight = w.styles.fontWeight;
            }
            if (w.styles?.letterSpacing) {
                const lsValue = typeof w.styles.letterSpacing === 'object' ? w.styles.letterSpacing.value : w.styles.letterSpacing;
                settings.typography_letter_spacing = { unit: 'px', size: lsValue };
            }

            // Text color from styles
            if (w.styles?.color) {
                const c = w.styles.color;
                if (typeof c === 'object' && 'r' in c) {
                    const r = Math.round(c.r * 255);
                    const g = Math.round(c.g * 255);
                    const b = Math.round(c.b * 255);
                    const a = c.a !== undefined ? c.a : 1;
                    settings.text_color = `rgba(${r}, ${g}, ${b}, ${a})`;
                } else if (typeof c === 'string') {
                    settings.text_color = c;
                }
            }

            // Hover and active colors (optional)
            if (settings.text_color) {
                settings.text_color_hover = settings.text_color; // Keep same for now
            }

            return { widgetType: 'nav-menu', settings };
        }
    },
    {
        key: 'search-form',
        widgetType: 'search-form',
        family: 'misc',
        aliases: generateAliases('search-form', ['formulário de busca', 'pesquisa'], ['search form', 'search']),
        compile: (_w, base) => ({ widgetType: 'search-form', settings: { ...base } })
    },
    {
        key: 'google-maps',
        widgetType: 'google-maps',
        family: 'media',
        aliases: generateAliases('google-maps', ['mapa', 'google maps'], ['maps', 'location']),
        compile: (w, base) => ({ widgetType: 'google-maps', settings: { ...base, address: w.content || base.address || '' } })
    },
    {
        key: 'testimonial',
        widgetType: 'testimonial',
        family: 'misc',
        aliases: generateAliases('testimonial', ['depoimento', 'citação', 'avaliação'], ['quote', 'review', 'single testimonial']),
        compile: (w, base) => ({
            widgetType: 'testimonial',
            settings: { ...base, testimonial_content: w.content || base.testimonial_content || 'Depoimento' }
        })
    },
    {
        key: 'embed',
        widgetType: 'embed',
        family: 'media',
        aliases: generateAliases('embed', ['incorporar', 'embed'], ['iframe']),
        compile: (w, base) => ({ widgetType: 'embed', settings: { ...base, embed_url: w.content || base.embed_url || '' } })
    },
    {
        key: 'lottie',
        widgetType: 'lottie',
        family: 'media',
        aliases: generateAliases('lottie', ['lottie', 'animação'], ['animation', 'json animation']),
        compile: (w, base) => ({ widgetType: 'lottie', settings: { ...base, lottie_url: w.content || base.lottie_url || '' } })
    },
    {
        key: 'html',
        widgetType: 'html',
        family: 'misc',
        aliases: generateAliases('html', ['html', 'código personalizado'], ['custom code']),
        compile: (w, base) => ({ widgetType: 'html', settings: { ...base, html: w.content || '' } })
    }
];

const basicWidgets = [
    'w:container',
    'w:video',
    'w:divider',
    'w:spacer',
    'w:image-box',
    'w:star-rating',
    'w:counter',
    'w:progress',
    'w:tabs',
    'w:accordion',
    'w:toggle',
    'w:alert',
    'w:social-icons',
    'w:soundcloud',
    'w:shortcode',
    'w:menu-anchor',
    'w:sidebar',
    'w:read-more',
    'w:image-carousel',
    'w:basic-gallery',
    'w:gallery',
    'w:icon-list',
    'w:nav-menu',
    'w:search-form',
    'w:google-maps',
    'w:testimonial',
    'w:embed',
    'w:lottie',
    'loop:grid'
];

const proWidgets = [
    'w:form',
    'w:login',
    'w:subscription',
    'w:call-to-action',
    'media:carousel',
    'w:portfolio',
    'w:gallery-pro',
    'slider:slides',
    'w:slideshow',
    'w:flip-box',
    'w:animated-headline',
    'w:post-navigation',
    'w:share-buttons',
    'w:table-of-contents',
    'w:countdown',
    'w:blockquote',
    'w:testimonial-carousel',
    'w:review-box',
    'w:hotspots',
    'w:sitemap',
    'w:author-box',
    'w:price-table',
    'w:price-list',
    'w:progress-tracker',
    'w:animated-text',
    'w:nav-menu-pro',
    'w:breadcrumb',
    'w:facebook-button',
    'w:facebook-comments',
    'w:facebook-embed',
    'w:facebook-page',
    'loop:builder',
    'loop:grid-advanced',
    'loop:carousel',
    'w:post-excerpt',
    'w:post-content',
    'w:post-title',
    'w:post-info',
    'w:post-featured-image',
    'w:post-author',
    'w:post-date',
    'w:post-terms',
    'w:archive-title',
    'w:archive-description',
    'w:site-logo',
    'w:site-title',
    'w:site-tagline',
    'w:search-results',
    'w:global-widget',
    'w:video-playlist',
    'w:video-gallery'
];

const wooWidgets = [
    'woo:product-title',
    'woo:product-image',
    'woo:product-price',
    'woo:product-add-to-cart',
    'woo:product-data-tabs',
    'woo:product-excerpt',
    'woo:product-rating',
    'woo:product-stock',
    'woo:product-meta',
    'woo:product-additional-information',
    'woo:product-short-description',
    'woo:product-related',
    'woo:product-upsells',
    'woo:product-tabs',
    'woo:product-breadcrumb',
    'woo:product-gallery',
    'woo:products',
    'woo:product-grid',
    'woo:product-carousel',
    'woo:product-loop-item',
    'woo:loop-product-title',
    'woo:loop-product-price',
    'woo:loop-product-rating',
    'woo:loop-product-image',
    'woo:loop-product-button',
    'woo:loop-product-meta',
    'woo:cart',
    'woo:checkout',
    'woo:my-account',
    'woo:purchase-summary',
    'woo:order-tracking'
];

const loopWidgets = [
    'loop:item',
    'loop:image',
    'loop:title',
    'loop:meta',
    'loop:terms',
    'loop:rating',
    'loop:price',
    'loop:add-to-cart',
    'loop:read-more',
    'loop:featured-image'
];

const experimentalWidgets = [
    'w:nested-tabs',
    'w:mega-menu',
    'w:scroll-snap',
    'w:motion-effects',
    'w:background-slideshow',
    'w:css-transform',
    'w:custom-position',
    'w:dynamic-tags',
    'w:ajax-pagination',
    'loop:pagination',
    'w:aspect-ratio-container'
];

const wpWidgets = [
    'w:wp-search',
    'w:wp-recent-posts',
    'w:wp-recent-comments',
    'w:wp-archives',
    'w:wp-categories',
    'w:wp-calendar',
    'w:wp-tag-cloud',
    'w:wp-custom-menu'
];

const widgetAliases: Record<string, { pt: string[], en: string[] }> = {
    'w:container': { pt: ['container', 'seção', 'coluna', 'linha'], en: ['section', 'row', 'column', 'full container', 'container 100%', 'boxed container', 'inner container'] },
    'w:form': { pt: ['formulário', 'campos', 'form de contato', 'newsletter'], en: ['form', 'contact form', 'input'] },
    'w:login': { pt: ['login', 'entrar', 'acesso', 'login form'], en: ['login', 'signin', 'sign in'] },
    'w:subscription': { pt: ['inscrição', 'newsletter'], en: ['subscription', 'newsletter'] },
    'w:call-to-action': { pt: ['chamada para ação', 'box cta', 'promo box'], en: ['call to action', 'cta box'] },
    'media:carousel': { pt: ['carrossel de mídia'], en: ['media carousel'] },
    'w:portfolio': { pt: ['portfólio'], en: ['portfolio'] },
    'w:gallery-pro': { pt: ['galeria pro'], en: ['gallery pro'] },
    'slider:slides': { pt: ['slides', 'carrossel', 'slider', 'banner rotativo'], en: ['slides', 'slider', 'carousel', 'hero slider'] },
    'w:slideshow': { pt: ['slideshow'], en: ['slideshow'] },
    'w:flip-box': { pt: ['flip box', 'caixa giratória'], en: ['flip box'] },
    'w:animated-headline': { pt: ['título animado', 'texto animado', 'efeito de digitação'], en: ['animated headline', 'moving text', 'typing effect'] },
    'w:post-navigation': { pt: ['navegação de post'], en: ['post navigation'] },
    'w:share-buttons': { pt: ['botões de compartilhamento'], en: ['share buttons'] },
    'w:table-of-contents': { pt: ['índice'], en: ['table of contents'] },
    'w:countdown': { pt: ['contagem regressiva'], en: ['countdown'] },
    'w:blockquote': { pt: ['citação'], en: ['blockquote'] },
    'w:testimonial-carousel': { pt: ['carrossel de depoimentos', 'avaliações', 'slider de depoimentos'], en: ['testimonial carousel', 'reviews'] },
    'w:review-box': { pt: ['caixa de avaliação'], en: ['review box'] },
    'w:hotspots': { pt: ['hotspots', 'pontos de destaque'], en: ['hotspots'] },
    'w:sitemap': { pt: ['mapa do site'], en: ['sitemap'] },
    'w:author-box': { pt: ['caixa do autor'], en: ['author box'] },
    'w:price-table': { pt: ['tabela de preço', 'preços', 'plano', 'pricing table'], en: ['price table', 'pricing', 'price'] },
    'w:price-list': { pt: ['lista de preço', 'cardápio'], en: ['price list', 'menu list'] },
    'w:progress-tracker': { pt: ['rastreador de progresso'], en: ['progress tracker'] },
    'w:animated-text': { pt: ['texto animado'], en: ['animated text'] },
    'w:nav-menu-pro': { pt: ['menu pro'], en: ['nav menu pro'] },
    'w:breadcrumb': { pt: ['breadcrumb', 'migalhas de pão', 'caminho'], en: ['breadcrumb'] },
    'w:facebook-button': { pt: ['botão facebook'], en: ['facebook button'] },
    'w:facebook-comments': { pt: ['comentários facebook'], en: ['facebook comments'] },
    'w:facebook-embed': { pt: ['embed facebook'], en: ['facebook embed'] },
    'w:facebook-page': { pt: ['página facebook'], en: ['facebook page'] },
    'loop:builder': { pt: ['loop builder'], en: ['loop builder'] },
    'loop:grid-advanced': { pt: ['grid avançado'], en: ['advanced grid'] },
    'loop:carousel': { pt: ['loop carrossel'], en: ['loop carousel'] },
    'w:post-excerpt': { pt: ['resumo do post'], en: ['post excerpt'] },
    'w:post-content': { pt: ['conteúdo do post'], en: ['post content'] },
    'w:post-title': { pt: ['título do post'], en: ['post title'] },
    'w:post-info': { pt: ['info do post'], en: ['post info'] },
    'w:post-featured-image': { pt: ['imagem destacada'], en: ['featured image'] },
    'w:post-author': { pt: ['autor do post'], en: ['post author'] },
    'w:post-date': { pt: ['data do post'], en: ['post date'] },
    'w:post-terms': { pt: ['termos do post'], en: ['post terms'] },
    'w:archive-title': { pt: ['título do arquivo'], en: ['archive title'] },
    'w:archive-description': { pt: ['descrição do arquivo'], en: ['archive description'] },
    'w:site-logo': { pt: ['logo do site'], en: ['site logo'] },
    'w:site-title': { pt: ['título do site'], en: ['site title'] },
    'w:site-tagline': { pt: ['slogan do site'], en: ['site tagline'] },
    'w:search-results': { pt: ['resultados da busca'], en: ['search results'] },
    'w:global-widget': { pt: ['widget global'], en: ['global widget'] },
    'w:video-playlist': { pt: ['playlist de vídeo'], en: ['video playlist'] },
    'w:video-gallery': { pt: ['galeria de vídeo'], en: ['video gallery'] },
    'woo:product-title': { pt: ['título do produto'], en: ['product title'] },
    'woo:product-image': { pt: ['imagem do produto'], en: ['product image'] },
    'woo:product-price': { pt: ['preço do produto'], en: ['product price'] },
    'woo:product-add-to-cart': { pt: ['adicionar ao carrinho', 'botão comprar', 'comprar'], en: ['add to cart', 'buy button'] },
    'woo:product-data-tabs': { pt: ['abas de dados do produto'], en: ['product data tabs'] },
    'woo:product-excerpt': { pt: ['resumo do produto'], en: ['product excerpt'] },
    'woo:product-rating': { pt: ['avaliação do produto'], en: ['product rating'] },
    'woo:product-stock': { pt: ['estoque do produto'], en: ['product stock'] },
    'woo:product-meta': { pt: ['meta do produto'], en: ['product meta'] },
    'woo:product-additional-information': { pt: ['informação adicional'], en: ['additional information'] },
    'woo:product-short-description': { pt: ['descrição curta'], en: ['short description'] },
    'woo:product-related': { pt: ['produtos relacionados'], en: ['related products'] },
    'woo:product-upsells': { pt: ['upsells'], en: ['upsells'] },
    'woo:product-tabs': { pt: ['abas do produto'], en: ['product tabs'] },
    'woo:product-breadcrumb': { pt: ['breadcrumb do produto'], en: ['product breadcrumb'] },
    'woo:product-gallery': { pt: ['galeria do produto'], en: ['product gallery'] },
    'woo:products': { pt: ['produtos'], en: ['products'] },
    'woo:product-grid': { pt: ['grid de produtos'], en: ['product grid'] },
    'woo:product-carousel': { pt: ['carrossel de produtos'], en: ['product carousel'] },
    'woo:product-loop-item': { pt: ['item de loop de produto'], en: ['product loop item'] },
    'woo:loop-product-title': { pt: ['título do produto (loop)'], en: ['loop product title'] },
    'woo:loop-product-price': { pt: ['preço do produto (loop)'], en: ['loop product price'] },
    'woo:loop-product-rating': { pt: ['avaliação do produto (loop)'], en: ['loop product rating'] },
    'woo:loop-product-image': { pt: ['imagem do produto (loop)'], en: ['loop product image'] },
    'woo:loop-product-button': { pt: ['botão do produto (loop)'], en: ['loop product button'] },
    'woo:loop-product-meta': { pt: ['meta do produto (loop)'], en: ['loop product meta'] },
    'woo:cart': { pt: ['carrinho'], en: ['cart'] },
    'woo:checkout': { pt: ['checkout', 'finalizar compra'], en: ['checkout'] },
    'woo:my-account': { pt: ['minha conta'], en: ['my account'] },
    'woo:purchase-summary': { pt: ['resumo da compra'], en: ['purchase summary'] },
    'woo:order-tracking': { pt: ['rastreamento de pedido'], en: ['order tracking'] },
    'loop:item': { pt: ['item de loop'], en: ['loop item'] },
    'loop:image': { pt: ['imagem de loop'], en: ['loop image'] },
    'loop:title': { pt: ['título de loop'], en: ['loop title'] },
    'loop:meta': { pt: ['meta de loop'], en: ['loop meta'] },
    'loop:terms': { pt: ['termos de loop'], en: ['loop terms'] },
    'loop:rating': { pt: ['avaliação de loop'], en: ['loop rating'] },
    'loop:price': { pt: ['preço de loop'], en: ['loop price'] },
    'loop:add-to-cart': { pt: ['adicionar ao carrinho (loop)'], en: ['loop add to cart'] },
    'loop:read-more': { pt: ['leia mais (loop)'], en: ['loop read more'] },
    'loop:featured-image': { pt: ['imagem destacada (loop)'], en: ['loop featured image'] },
    'w:nested-tabs': { pt: ['abas aninhadas'], en: ['nested tabs'] },
    'w:mega-menu': { pt: ['mega menu'], en: ['mega menu'] },
    'w:scroll-snap': { pt: ['scroll snap'], en: ['scroll snap'] },
    'w:motion-effects': { pt: ['efeitos de movimento'], en: ['motion effects'] },
    'w:background-slideshow': { pt: ['slideshow de fundo'], en: ['background slideshow'] },
    'w:css-transform': { pt: ['transformação css'], en: ['css transform'] },
    'w:custom-position': { pt: ['posição personalizada'], en: ['custom position'] },
    'w:dynamic-tags': { pt: ['tags dinâmicas'], en: ['dynamic tags'] },
    'w:ajax-pagination': { pt: ['paginação ajax'], en: ['ajax pagination'] },
    'loop:pagination': { pt: ['paginação de loop'], en: ['loop pagination'] },
    'w:aspect-ratio-container': { pt: ['container proporção'], en: ['aspect ratio container'] },
    'w:wp-search': { pt: ['busca wp'], en: ['wp search'] },
    'w:wp-recent-posts': { pt: ['posts recentes wp'], en: ['wp recent posts'] },
    'w:wp-recent-comments': { pt: ['comentários recentes wp'], en: ['wp recent comments'] },
    'w:wp-archives': { pt: ['arquivos wp'], en: ['wp archives'] },
    'w:wp-categories': { pt: ['categorias wp'], en: ['wp categories'] },
    'w:wp-calendar': { pt: ['calendário wp'], en: ['wp calendar'] },
    'w:wp-tag-cloud': { pt: ['nuvem de tags wp'], en: ['wp tag cloud'] },
    'w:wp-custom-menu': { pt: ['menu personalizado wp'], en: ['wp custom menu'] }
};

const registerWithAliases = (key: string, family: WidgetDefinition['family']) => {
    const aliasData = widgetAliases[key] || { pt: [], en: [] };
    const aliases = generateAliases(slugFromKey(key), aliasData.pt, aliasData.en);
    registry.push(stubDefinition(key, family, aliases));
};

basicWidgets.forEach(k => registerWithAliases(k, 'misc'));
proWidgets.forEach(k => registerWithAliases(k, 'pro'));
wooWidgets.forEach(k => registerWithAliases(k, 'woo'));
loopWidgets.forEach(k => registerWithAliases(k, 'loop'));
experimentalWidgets.forEach(k => registerWithAliases(k, 'misc'));
wpWidgets.forEach(k => registerWithAliases(k, 'wp'));

export function findWidgetDefinition(type: string, kind?: string): WidgetDefinition | null {
    const kindLower = kind ? kind.toLowerCase() : '';
    const typeLower = type.toLowerCase();

    const direct = registry.find(r => r.key.toLowerCase() === typeLower || r.widgetType.toLowerCase() === typeLower);
    if (direct) return direct;

    // Check aliases against type (e.g. if type is 'caixa de imagem')
    const byTypeAlias = registry.find(r => (r.aliases || []).some(a => a.toLowerCase() === typeLower));
    if (byTypeAlias) return byTypeAlias;

    if (kindLower) {
        const byKind = registry.find(r => (r.aliases || []).some(a => a.toLowerCase() === kindLower));
        if (byKind) return byKind;
    }

    return null;
}

export function compileWithRegistry(widget: PipelineWidget, base: ElementorSettings): { widgetType: string; settings: ElementorSettings } | null {
    const def = findWidgetDefinition(widget.type, widget.kind);
    if (!def) return null;
    return def.compile(widget, base);
}

export const widgetRegistry = registry;
