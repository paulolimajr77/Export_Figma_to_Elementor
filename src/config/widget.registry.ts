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

function stubDefinition(key: string, family: WidgetDefinition['family'] = 'misc'): WidgetDefinition {
    const widgetType = slugFromKey(key);
    return {
        key,
        widgetType,
        family,
        aliases: [widgetType],
        compile: (_w, base) => ({ widgetType, settings: { ...base } })
    };
}

const registry: WidgetDefinition[] = [
    {
        key: 'heading',
        widgetType: 'heading',
        family: 'text',
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
        compile: (w, base) => {
            console.log('[REGISTRY DEBUG] Compiling button widget:', w.type);

            const settings: any = {
                ...base,
                text: w.content || 'Button',
                // Default Elementor settings
                size: 'sm',
                button_type: '',
                align: 'center', // Default alignment
                typography_typography: 'custom'
            };

            // 1. Typography Mapping
            if (w.styles) {
                if (w.styles.fontName) settings.typography_font_family = w.styles.fontName.family;
                if (w.styles.fontSize) settings.typography_font_size = { unit: 'px', size: w.styles.fontSize };
                if (w.styles.fontWeight) settings.typography_font_weight = w.styles.fontWeight;
                if (w.styles.lineHeight && w.styles.lineHeight.unit !== 'AUTO') {
                    const isPixel = w.styles.lineHeight.unit === 'PIXELS';
                    settings.typography_line_height = {
                        unit: isPixel ? 'px' : 'em',
                        size: isPixel ? w.styles.lineHeight.value : (w.styles.lineHeight.value / 100)
                    };
                }
                if (w.styles.textDecoration) {
                    settings.typography_text_decoration = w.styles.textDecoration.toLowerCase();
                }
                if (w.styles.textCase) {
                    const caseMap: Record<string, string> = { UPPER: 'uppercase', LOWER: 'lowercase', TITLE: 'capitalize' };
                    if (caseMap[w.styles.textCase]) settings.typography_text_transform = caseMap[w.styles.textCase];
                }

                // Alignment
                if (w.styles.textAlignHorizontal) {
                    const alignMap: Record<string, string> = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };
                    if (alignMap[w.styles.textAlignHorizontal]) settings.align = alignMap[w.styles.textAlignHorizontal];
                }
            }

            // 2. Colors
            // Background Color
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

            // Text Color
            if (w.styles?.color) {
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

            // 5. Icon
            if (w.imageId) {
                const imgId = parseInt(w.imageId, 10);
                settings.selected_icon = {
                    value: isNaN(imgId) ? w.imageId : { url: '', id: imgId },
                    library: isNaN(imgId) ? 'fa-solid' : 'svg'
                };
                settings.icon_align = 'right'; // Default to right for buttons usually
            }

            return { widgetType: 'button', settings };
        }
    },
    {
        key: 'image',
        widgetType: 'image',
        family: 'media',
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
        compile: (w, base) => ({
            widgetType: 'icon',
            settings: { ...base, selected_icon: { value: w.content || 'fas fa-star', library: 'fa-solid' } }
        })
    },
    // Hint-based simples
    {
        key: 'image_box',
        widgetType: 'image-box',
        family: 'media',
        aliases: ['image_box_like'],
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
        aliases: ['icon_box_like'],
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
        aliases: ['icon_list_like', 'list_like'],
        compile: (_w, base) => ({ widgetType: 'icon-list', settings: { ...base } })
    },
    {
        key: 'video',
        widgetType: 'video',
        family: 'media',
        compile: (w, base) => ({ widgetType: 'video', settings: { ...base, link: w.content || '' } })
    },
    {
        key: 'divider',
        widgetType: 'divider',
        family: 'misc',
        compile: (_w, base) => ({ widgetType: 'divider', settings: { ...base } })
    },
    {
        key: 'spacer',
        widgetType: 'spacer',
        family: 'misc',
        compile: (_w, base) => ({ widgetType: 'spacer', settings: { ...base, space: base.space ?? 20 } })
    },
    {
        key: 'star-rating',
        widgetType: 'star-rating',
        family: 'misc',
        compile: (w, base) => ({ widgetType: 'star-rating', settings: { ...base, rating: Number(w.content) || 5 } })
    },
    {
        key: 'counter',
        widgetType: 'counter',
        family: 'misc',
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
        compile: (w, base) => ({
            widgetType: 'progress',
            settings: { ...base, title: w.content || base.title || 'Progresso', percent: Number(base.percent) || 50 }
        })
    },
    {
        key: 'tabs',
        widgetType: 'tabs',
        family: 'misc',
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
        compile: (w, base) => ({
            widgetType: 'alert',
            settings: { ...base, alert_type: base.alert_type || 'info', title: w.content || base.title || 'Alerta' }
        })
    },
    {
        key: 'social-icons',
        widgetType: 'social-icons',
        family: 'misc',
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
        compile: (w, base) => ({ widgetType: 'soundcloud', settings: { ...base, url: w.content || base.url || '' } })
    },
    {
        key: 'shortcode',
        widgetType: 'shortcode',
        family: 'misc',
        compile: (w, base) => ({ widgetType: 'shortcode', settings: { ...base, shortcode: w.content || base.shortcode || '' } })
    },
    {
        key: 'menu-anchor',
        widgetType: 'menu-anchor',
        family: 'nav',
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
        compile: (w, base) => ({ widgetType: 'read-more', settings: { ...base, text: w.content || base.text || 'Leia mais' } })
    },
    {
        key: 'image-carousel',
        widgetType: 'image-carousel',
        family: 'media',
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
        key: 'basic-gallery',
        widgetType: 'basic-gallery',
        family: 'media',
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
        widgetType: 'image-carousel',
        family: 'media',
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
        key: 'slider:slides',
        widgetType: 'image-carousel',
        family: 'media',
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
        key: 'w:slideshow',
        widgetType: 'image-carousel',
        family: 'media',
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
        compile: (w, base) => ({ widgetType: 'nav-menu', settings: { ...base, layout: base.layout || 'horizontal', menu: w.content || base.menu } })
    },
    {
        key: 'search-form',
        widgetType: 'search-form',
        family: 'misc',
        compile: (_w, base) => ({ widgetType: 'search-form', settings: { ...base } })
    },
    {
        key: 'google-maps',
        widgetType: 'google-maps',
        family: 'media',
        compile: (w, base) => ({ widgetType: 'google-maps', settings: { ...base, address: w.content || base.address || '' } })
    },
    {
        key: 'testimonial',
        widgetType: 'testimonial',
        family: 'misc',
        compile: (w, base) => ({
            widgetType: 'testimonial',
            settings: { ...base, testimonial_content: w.content || base.testimonial_content || 'Depoimento' }
        })
    },
    {
        key: 'embed',
        widgetType: 'embed',
        family: 'media',
        compile: (w, base) => ({ widgetType: 'embed', settings: { ...base, embed_url: w.content || base.embed_url || '' } })
    },
    {
        key: 'lottie',
        widgetType: 'lottie',
        family: 'media',
        compile: (w, base) => ({ widgetType: 'lottie', settings: { ...base, lottie_url: w.content || base.lottie_url || '' } })
    },
    {
        key: 'html',
        widgetType: 'html',
        family: 'misc',
        aliases: ['custom'],
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

basicWidgets.forEach(k => registry.push(stubDefinition(k, 'misc')));
proWidgets.forEach(k => registry.push(stubDefinition(k, 'pro')));
wooWidgets.forEach(k => registry.push(stubDefinition(k, 'woo')));
loopWidgets.forEach(k => registry.push(stubDefinition(k, 'loop')));
experimentalWidgets.forEach(k => registry.push(stubDefinition(k, 'misc')));
wpWidgets.forEach(k => registry.push(stubDefinition(k, 'wp')));

export function findWidgetDefinition(type: string, kind?: string): WidgetDefinition | null {
    const kindLower = kind ? kind.toLowerCase() : '';
    const typeLower = type.toLowerCase();

    const direct = registry.find(r => r.key.toLowerCase() === typeLower || r.widgetType.toLowerCase() === typeLower);
    if (direct) return direct;

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
