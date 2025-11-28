import type { PipelineWidget } from '../types/pipeline.schema';
import type { ElementorSettings } from '../types/elementor.types';

export interface WidgetDefinition {
    key: string; // identifier used by compiler
    widgetType: string; // Elementor widget slug
    family: 'text' | 'media' | 'action' | 'structure' | 'woo' | 'loop' | 'wp' | 'pro' | 'misc';
    requiredFields?: Array<'content' | 'imageId' | 'icon' | 'items'>;
    aliases?: string[]; // kinds or hints
    compile: (widget: PipelineWidget, base: ElementorSettings) => { widgetType: string; settings: ElementorSettings } | null;
}

const registry: WidgetDefinition[] = [
    // Básicos
    {
        key: 'heading',
        widgetType: 'heading',
        family: 'text',
        requiredFields: ['content'],
        compile: (w, base) => ({ widgetType: 'heading', settings: { ...base, title: w.content || 'Heading' } })
    },
    {
        key: 'text',
        widgetType: 'text-editor',
        family: 'text',
        requiredFields: ['content'],
        compile: (w, base) => ({ widgetType: 'text-editor', settings: { ...base, editor: w.content || 'Text' } })
    },
    {
        key: 'button',
        widgetType: 'button',
        family: 'action',
        requiredFields: ['content'],
        compile: (w, base) => ({ widgetType: 'button', settings: { ...base, text: w.content || 'Button' } })
    },
    {
        key: 'image',
        widgetType: 'image',
        family: 'media',
        requiredFields: ['imageId'],
        compile: (w, base) => ({
            widgetType: 'image',
            settings: {
                ...base,
                image: {
                    url: w.content || '',
                    id: w.imageId ? parseInt(w.imageId, 10) : 0
                }
            }
        })
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
    // Compostos leves (baseados em hint)
    {
        key: 'image_box',
        widgetType: 'image-box',
        family: 'media',
        aliases: ['image_box_like'],
        compile: (w, base) => ({
            widgetType: 'image-box',
            settings: {
                ...base,
                image: { url: base.image_url || '', id: w.imageId ? parseInt(w.imageId, 10) : 0 },
                title_text: w.content || base.title_text || 'Title',
                description_text: base.description_text || ''
            }
        })
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
        family: 'structure',
        aliases: ['icon_list_like', 'list_like'],
        compile: (_w, base) => ({
            widgetType: 'icon-list',
            settings: {
                ...base
            }
        })
    },
    {
        key: 'html',
        widgetType: 'html',
        family: 'misc',
        aliases: ['custom'],
        compile: (w, base) => ({
            widgetType: 'html',
            settings: { ...base, html: w.content || '' }
        })
    },
    {
        key: 'shortcode',
        widgetType: 'shortcode',
        family: 'misc',
        aliases: ['shortcode_like'],
        compile: (w, base) => ({
            widgetType: 'shortcode',
            settings: { ...base, shortcode: w.content || '' }
        })
    },
    // Complexos
    {
        key: 'slides',
        widgetType: 'slides',
        family: 'pro',
        aliases: ['slides_like', 'gallery_like'],
        compile: (w, base) => {
            const slides = (w.slides || w.items || []).map((item: any, idx: number) => ({
                heading: item.title || `Slide ${idx + 1}`,
                description: item.description || item.content || '',
                background: {
                    url: item.image || item.imageUrl || '',
                    id: item.imageId ? parseInt(item.imageId, 10) : 0
                },
                button_text: item.callToAction?.text || '',
                button_url: item.callToAction?.link || '',
                horizontal_position: item.contentAlign || 'center'
            }));
            return {
                widgetType: 'slides',
                settings: {
                    ...base,
                    slides,
                    content_position: 'middle',
                    content_alignment: 'center',
                    transition: 'slide',
                    speed: 500,
                    autoplay: 'yes',
                    pause_on_hover: 'yes'
                }
            };
        }
    },
    {
        key: 'tabs',
        widgetType: 'tabs',
        family: 'structure',
        aliases: ['tabs_like'],
        compile: (w, base) => {
            const tabs = (w.tabs || w.items || []).map((item: any, idx: number) => ({
                tab_title: item.title || `Tab ${idx + 1}`,
                tab_content: item.content || ''
            }));
            return { widgetType: 'tabs', settings: { ...base, tabs } };
        }
    },
    {
        key: 'accordion',
        widgetType: 'accordion',
        family: 'structure',
        aliases: ['accordion_like'],
        compile: (w, base) => {
            const accordion = (w.accordionItems || w.items || []).map((item: any, idx: number) => ({
                tab_title: item.title || `Item ${idx + 1}`,
                tab_content: item.content || ''
            }));
            return { widgetType: 'accordion', settings: { ...base, accordion } };
        }
    },
    {
        key: 'toggle',
        widgetType: 'toggle',
        family: 'structure',
        aliases: ['toggle_like'],
        compile: (w, base) => {
            const toggle = (w.toggleItems || w.items || []).map((item: any, idx: number) => ({
                tab_title: item.title || `Item ${idx + 1}`,
                tab_content: item.content || ''
            }));
            return { widgetType: 'toggle', settings: { ...base, toggle } };
        }
    },
    {
        key: 'gallery',
        widgetType: 'gallery',
        family: 'media',
        aliases: ['gallery_like'],
        compile: (w, base) => {
            const gallery = (w.galleryItems || w.items || []).map((item: any, idx: number) => ({
                id: item.imageId ? parseInt(item.imageId, 10) : idx,
                url: item.url || item.image || ''
            }));
            return { widgetType: 'gallery', settings: { ...base, gallery } };
        }
    },
    {
        key: 'image_carousel',
        widgetType: 'image-carousel',
        family: 'media',
        aliases: ['carousel_like'],
        compile: (w, base) => {
            const carousel = (w.galleryItems || w.items || []).map((item: any, idx: number) => ({
                id: item.imageId ? parseInt(item.imageId, 10) : idx,
                url: item.url || item.image || ''
            }));
            return { widgetType: 'image-carousel', settings: { ...base, carousel } };
        }
    },
    {
        key: 'loop_grid',
        widgetType: 'loop-grid',
        family: 'loop',
        aliases: ['loop_like'],
        compile: (w, base) => ({
            widgetType: 'loop-grid',
            settings: { ...base, loop_items: w.loopItems || w.items || [] }
        })
    },
    {
        key: 'testimonial',
        widgetType: 'testimonial',
        family: 'text',
        aliases: ['testimonial_like'],
        compile: (w, base) => ({
            widgetType: 'testimonial',
            settings: { ...base, testimonials: w.testimonials || w.items || [] }
        })
    },
    {
        key: 'price_table',
        widgetType: 'price-table',
        family: 'pro',
        aliases: ['price_table_like'],
        compile: (w, base) => ({
            widgetType: 'price-table',
            settings: { ...base, price_tables: w.priceTables || w.items || [] }
        })
    },
    {
        key: 'price_list',
        widgetType: 'price-list',
        family: 'pro',
        aliases: ['price_list_like'],
        compile: (w, base) => ({
            widgetType: 'price-list',
            settings: { ...base, price_list: w.priceListItems || w.items || [] }
        })
    },
    {
        key: 'form',
        widgetType: 'form',
        family: 'pro',
        aliases: ['form_like'],
        compile: (w, base) => ({
            widgetType: 'form',
            settings: { ...base, form_fields: w.formFields || w.items || [] }
        })
    }
    // Pro (exemplos)
    {
        key: 'form',
        widgetType: 'form',
        family: 'pro',
        aliases: ['form_like'],
        compile: (_w, base) => ({ widgetType: 'form', settings: { ...base } })
    },
    {
        key: 'slides',
        widgetType: 'slides',
        family: 'pro',
        aliases: ['slides_like', 'gallery_like'],
        compile: (_w, base) => ({ widgetType: 'slides', settings: { ...base } })
    },
    // WooCommerce (exemplos)
    {
        key: 'woo_product',
        widgetType: 'woocommerce-product-title',
        family: 'woo',
        aliases: ['woo_product_like'],
        compile: (_w, base) => ({ widgetType: 'woocommerce-product-title', settings: { ...base } })
    }
];

export function findWidgetDefinition(type: string, kind?: string): WidgetDefinition | null {
    const kindLower = kind ? kind.toLowerCase() : '';
    const typeLower = type.toLowerCase();

    // match by key or alias
    const direct = registry.find(r => r.key === typeLower || r.widgetType === typeLower);
    if (direct) return direct;

    if (kindLower) {
        const byKind = registry.find(r => (r.aliases || []).some(a => a.toLowerCase() === kindLower));
        if (byKind) return byKind;
    }

    return null;
}

export function compileWithRegistry(widget: PipelineWidget): { widgetType: string; settings: ElementorSettings } | null {
    const def = findWidgetDefinition(widget.type, widget.kind);
    if (!def) return null;
    const base: ElementorSettings = { ...widget.styles };
    return def.compile(widget, base);
}

export const widgetRegistry = registry;
