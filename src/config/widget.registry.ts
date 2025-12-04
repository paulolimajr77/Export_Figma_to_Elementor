import type { PipelineWidget } from '../types/pipeline.schema';
import type { ElementorSettings } from '../types/elementor.types';

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
            if (w.children && Array.isArray(w.children) && w.children.length > 0) {
                console.log('[REGISTRY DEBUG] Processing child widgets:', w.children.map(c => ({ type: c.type, content: c.content })));

                // Find heading/text child for button text
                const textChild = w.children.find(child =>
                    child.type === 'heading' || child.type === 'text'
                );

                if (textChild && textChild.content) {
                    buttonText = textChild.content;
                    console.log('[REGISTRY DEBUG] ✅ Extracted text from child:', buttonText);

                    // Extract text color from child
                    if (textChild.styles?.color) {
                        const { r, g, b } = textChild.styles.color;
                        textColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 1)`;
                        console.log('[REGISTRY DEBUG] ✅ Extracted text color from child:', textColor);
                    }

                    // Extract typography from child
                    if (textChild.styles) {
                        textStyles = textChild.styles;
                    }
                }

                // Find image child for icon
                const imageChild = w.children.find(child =>
                    child.type === 'image' || child.type === 'icon'
                );

                if (imageChild && imageChild.imageId) {
                    iconId = imageChild.imageId;
                    console.log('[REGISTRY DEBUG] ✅ Extracted icon from child:', iconId);
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

            // 2. Colors
            // Background Color (from button frame itself)
            if (w.styles?.background) {
                settings.background_color = w.styles.background.color || w.styles.background;
            } else if (w.styles?.fills && Array.isArray(w.styles.fills) && w.styles.fills.length > 0) {
                const solidFill = w.styles.fills.find((f: any) => f.type === 'SOLID');
                if (solidFill && solidFill.color) {
                    const { r, g, b } = solidFill.color;
                    const a = solidFill.opacity !== undefined ? solidFill.opacity : 1;
                    settings.background_color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
                }
            }

            // Text Color (prefer child color, fallback to widget color)
            if (textColor) {
                settings.button_text_color = textColor;
            } else if (w.styles?.color) {
                const { r, g, b } = w.styles.color;
                settings.button_text_color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 1)`;
            } else if (base.color) {
                settings.button_text_color = base.color;
            }

            // 3. Padding
            if (w.styles?.paddingTop !== undefined || w.styles?.paddingRight !== undefined ||
                w.styles?.paddingBottom !== undefined || w.styles?.paddingLeft !== undefined) {
                settings.button_padding = {
                    unit: 'px',
                    top: w.styles.paddingTop || 0,
                    right: w.styles.paddingRight || 0,
                    bottom: w.styles.paddingBottom || 0,
                    left: w.styles.paddingLeft || 0,
                    isLinked: false
                };
            }

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
                    iconUrl = w.styles.selected_icon.value;
                }

                console.log('[BUTTON ICON DEBUG] iconId:', iconId);
                console.log('[BUTTON ICON DEBUG] Final iconUrl:', iconUrl);

                settings.selected_icon = {
                    value: isNaN(imgId) ? iconId : { url: iconUrl, id: imgId },
                    library: isNaN(imgId) ? 'fa-solid' : 'svg'
                };
                settings.icon_align = 'left'; // Icon on left, text on right
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
            return {
                widgetType: 'image',
                settings: {
                    ...base,
                    image: {
                        url: w.content || '',
                        id: isNaN(imgId) ? '' : imgId
                    }
                }
            };
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
            return {
                widgetType: 'image-box',
                settings: {
                    ...base,
                    image: { url: base.image_url || '', id: isNaN(imgId) ? '' : imgId },
                    title_text: w.content || base.title_text || 'Title',
                    description_text: base.description_text || ''
                }
            };
        }
    },
    {
        key: 'icon_box',
        widgetType: 'icon-box',
        family: 'media',
        aliases: generateAliases('icon-box', ['caixa de ícone', 'box ícone', 'card com ícone'], ['icon box', 'box icon', 'card icon', 'feature icon']),
        compile: (w, base) => ({
            widgetType: 'icon-box',
            settings: {
                ...base,
                selected_icon: base.selected_icon || { value: 'fas fa-star', library: 'fa-solid' },
                title_text: w.content || base.title_text || 'Title',
                description_text: base.description_text || ''
            }
        })
    },
    {
        key: 'icon_list',
        widgetType: 'icon-list',
        family: 'media',
        aliases: generateAliases('icon-list', ['lista de ícones', 'lista', 'tópicos'], ['icon list', 'list', 'bullet points', 'check list']),
        compile: (_w, base) => ({ widgetType: 'icon-list', settings: { ...base } })
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
        compile: (w, base) => ({
            widgetType: 'accordion',
            settings: {
                ...base,
                accordion: base.accordion || [{ _id: 'acc1', title: 'Item 1', content: w.content || 'Conteúdo' }]
            }
        })
    },
    {
        key: 'toggle',
        widgetType: 'toggle',
        family: 'misc',
        aliases: generateAliases('toggle', ['alternar', 'toggle'], []),
        compile: (w, base) => ({
            widgetType: 'toggle',
            settings: {
                ...base,
                toggle: base.toggle || [{ _id: 'tog1', title: 'Item 1', content: w.content || 'Conteúdo' }]
            }
        })
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
        compile: (w, base) => ({ widgetType: 'nav-menu', settings: { ...base, layout: base.layout || 'horizontal', menu: w.content || base.menu } })
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
    'w:inner-container',
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
    'w:inner-container': { pt: ['container interno'], en: ['inner container'] },
    'w:form': { pt: ['formulário', 'contato', 'campos', 'form de contato', 'newsletter'], en: ['form', 'contact form', 'input'] },
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
