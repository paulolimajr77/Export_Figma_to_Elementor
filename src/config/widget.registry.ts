import type { PipelineWidget } from '../types/pipeline.schema';
import type { ElementorSettings } from '../types/elementor.types';

export interface WidgetDefinition {
    key: string;
    widgetType: string;
    family: 'text' | 'media' | 'action' | 'misc';
    aliases?: string[];
    compile: (widget: PipelineWidget, base: ElementorSettings) => { widgetType: string; settings: ElementorSettings } | null;
}

const registry: WidgetDefinition[] = [
    {
        key: 'heading',
        widgetType: 'heading',
        family: 'text',
        compile: (w, base) => ({ widgetType: 'heading', settings: { ...base, title: w.content || 'Heading' } })
    },
    {
        key: 'text',
        widgetType: 'text-editor',
        family: 'text',
        compile: (w, base) => ({ widgetType: 'text-editor', settings: { ...base, editor: w.content || 'Text' } })
    },
    {
        key: 'button',
        widgetType: 'button',
        family: 'action',
        compile: (w, base) => ({ widgetType: 'button', settings: { ...base, text: w.content || 'Button' } })
    },
    {
        key: 'image',
        widgetType: 'image',
        family: 'media',
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
    // Hint-based simples
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
        family: 'media',
        aliases: ['icon_list_like', 'list_like'],
        compile: (_w, base) => ({ widgetType: 'icon-list', settings: { ...base } })
    },
    {
        key: 'html',
        widgetType: 'html',
        family: 'misc',
        aliases: ['custom'],
        compile: (w, base) => ({ widgetType: 'html', settings: { ...base, html: w.content || '' } })
    }
];

export function findWidgetDefinition(type: string, kind?: string): WidgetDefinition | null {
    const kindLower = kind ? kind.toLowerCase() : '';
    const typeLower = type.toLowerCase();

    const direct = registry.find(r => r.key === typeLower || r.widgetType === typeLower);
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
