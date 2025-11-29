import { PipelineSchema, PipelineContainer, PipelineWidget } from '../types/pipeline.schema';
import { ElementorJSON, ElementorElement, ElementorSettings, WPConfig } from '../types/elementor.types';
import { generateGUID } from '../utils/guid';
import { compileWithRegistry } from '../config/widget.registry';

/**
 * Compilador Elementor para Flexbox Containers (Elementor 3.19+)
 */
export class ElementorCompiler {
    private wpConfig: WPConfig = {};

    public setWPConfig(config: WPConfig) {
        this.wpConfig = config;
    }

    private sanitizeColor(value: any): string | undefined {
        if (!value) return undefined;
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value.r !== undefined && value.g !== undefined && value.b !== undefined) {
            const r = Math.round((value.r || 0) * 255);
            const g = Math.round((value.g || 0) * 255);
            const b = Math.round((value.b || 0) * 255);
            const a = value.a !== undefined ? value.a : 1;
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        return undefined;
    }

    public compile(schema: PipelineSchema): ElementorJSON {
        const elements = schema.containers.map(container => this.compileContainer(container, false));
        return {
            type: 'elementor',
            siteurl: this.wpConfig?.url || '',
            elements
        } as any;
    }

    private compileContainer(container: PipelineContainer, isInner: boolean): ElementorElement {
        const id = generateGUID();
        const settings: ElementorSettings = {
            _element_id: id,
            container_type: 'flex',
            content_width: container.width === 'full' ? 'full' : 'boxed',
            flex_direction: container.direction === 'row' ? 'row' : 'column',
            ...this.mapContainerStyles(container.styles)
        };
        if (!settings.flex_gap) {
            settings.flex_gap = { unit: 'px', column: 0, row: 0, isLinked: true };
        }
        if (!settings.justify_content) settings.justify_content = 'start';
        if (!settings.align_items) settings.align_items = 'start';

        const widgetElements = container.widgets.map(w => ({ order: (w.styles as any)?._order ?? 0, el: this.compileWidget(w) }));
        const childContainers = container.children.map(child => ({ order: (child.styles as any)?._order ?? 0, el: this.compileContainer(child, true) }));
        const merged = [...widgetElements, ...childContainers].sort((a, b) => a.order - b.order).map(i => i.el);

        return {
            id,
            elType: 'container',
            isInner,
            settings,
            elements: merged
        };
    }

    private mapContainerStyles(styles: Record<string, any>): ElementorSettings {
        const settings: ElementorSettings = {};
        if (!styles) return settings;

        if (styles.gap !== undefined) {
            settings.flex_gap = {
                unit: 'px',
                column: styles.gap,
                row: styles.gap,
                isLinked: true
            };
        }

        if (
            typeof styles.paddingTop === 'number' ||
            typeof styles.paddingRight === 'number' ||
            typeof styles.paddingBottom === 'number' ||
            typeof styles.paddingLeft === 'number'
        ) {
            settings.padding = {
                unit: 'px',
                top: styles.paddingTop || 0,
                right: styles.paddingRight || 0,
                bottom: styles.paddingBottom || 0,
                left: styles.paddingLeft || 0,
                isLinked: false
            };
        }

        if (styles.background) {
            const bg = styles.background;
            const sanitizedColor = this.sanitizeColor(bg.color);
            if (sanitizedColor) {
                settings.background_background = 'classic';
                settings.background_color = sanitizedColor;
            }
            if (bg.image) {
                settings.background_background = 'classic';
                settings.background_image = { url: bg.image, id: 0 };
            }
            if (bg.gradient) {
                settings.background_background = 'gradient';
            }
        }

        if (styles.width) {
            settings.width = { unit: 'px', size: styles.width, sizes: [] };
        }

        if (styles.primaryAxisAlignItems) {
            const map: Record<string, string> = { MIN: 'start', CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between' };
            settings.justify_content = map[styles.primaryAxisAlignItems] || 'start';
        }

        if (styles.counterAxisAlignItems) {
            const map: Record<string, string> = { MIN: 'start', CENTER: 'center', MAX: 'end', STRETCH: 'stretch' };
            settings.align_items = map[styles.counterAxisAlignItems] || 'start';
        }

        if (styles.border) {
            const b = styles.border;
            if (b.type) settings.border_border = b.type;
            if (b.width) settings.border_width = { unit: 'px', top: b.width, right: b.width, bottom: b.width, left: b.width, isLinked: true };
            if (b.color) settings.border_color = b.color;
            if (b.radius) settings.border_radius = { unit: 'px', top: b.radius, right: b.radius, bottom: b.radius, left: b.radius, isLinked: true };
        } else if (styles.cornerRadius) {
            settings.border_radius = { unit: 'px', top: styles.cornerRadius, right: styles.cornerRadius, bottom: styles.cornerRadius, left: styles.cornerRadius, isLinked: true };
        }

        return settings;
    }

    private mapTypography(styles: Record<string, any>, prefix: string = 'typography'): ElementorSettings {
        const s: ElementorSettings = {};
        if (styles.fontName) {
            s[`${prefix}_typography`] = 'custom';
            s[`${prefix}_font_family`] = styles.fontName.family;
            s[`${prefix}_font_weight`] = styles.fontWeight || 400;
        }
        if (styles.fontSize) s[`${prefix}_font_size`] = { unit: 'px', size: styles.fontSize };
        if (styles.lineHeight && styles.lineHeight.unit !== 'AUTO') s[`${prefix}_line_height`] = { unit: 'px', size: styles.lineHeight.value };
        if (styles.letterSpacing && styles.letterSpacing.value !== 0) s[`${prefix}_letter_spacing`] = { unit: 'px', size: styles.letterSpacing.value };
        if (styles.textDecoration) s[`${prefix}_text_decoration`] = styles.textDecoration.toLowerCase();
        if (styles.textCase) s[`${prefix}_text_transform`] = styles.textCase === 'UPPER' ? 'uppercase' : (styles.textCase === 'LOWER' ? 'lowercase' : 'none');
        return s;
    }

    private sanitizeSettings(raw: Record<string, any>): ElementorSettings {
        const out: ElementorSettings = {};
        Object.keys(raw).forEach(k => {
            const v = raw[k];
            if (k.toLowerCase().includes('color')) {
                const sanitized = this.sanitizeColor(v);
                if (sanitized) out[k as keyof ElementorSettings] = sanitized as any;
            } else {
                out[k as keyof ElementorSettings] = v as any;
            }
        });
        return out;
    }

    private compileWidget(widget: PipelineWidget): ElementorElement {
        const widgetId = generateGUID();
        const baseSettings: ElementorSettings = { _element_id: widgetId, ...this.sanitizeSettings(widget.styles || {}) };

        // Tenta registry primeiro (baseado em type/kind)
        const registryResult = compileWithRegistry(widget, baseSettings);
        if (registryResult) {
            return {
                id: widgetId,
                elType: 'widget',
                widgetType: registryResult.widgetType,
                settings: registryResult.settings,
                elements: []
            };
        }

        // Fallback simples
        let widgetType: string = widget.type;
        const settings: ElementorSettings = { ...baseSettings };

        switch (widget.type) {
            case 'heading':
                widgetType = 'heading';
                settings.title = widget.content || 'Heading';
                if (widget.styles?.color) settings.title_color = this.sanitizeColor(widget.styles.color);
                Object.assign(settings, this.mapTypography(widget.styles || {}, 'typography'));
                break;
            case 'text':
                widgetType = 'text-editor';
                settings.editor = widget.content || 'Text';
                if (widget.styles?.color) settings.text_color = this.sanitizeColor(widget.styles.color);
                Object.assign(settings, this.mapTypography(widget.styles || {}, 'typography'));
                break;
            case 'button':
                widgetType = 'button';
                settings.text = widget.content || 'Button';
                Object.assign(settings, this.mapTypography(widget.styles || {}, 'typography'));
                break;
            case 'image':
                widgetType = 'image';
                settings.image = {
                    url: widget.content || '',
                    id: widget.imageId ? parseInt(widget.imageId, 10) : 0
                };
                break;
            case 'icon':
                widgetType = 'icon';
                settings.selected_icon = { value: widget.content || 'fas fa-star', library: 'fa-solid' };
                break;
            case 'custom':
            default:
                widgetType = 'html';
                settings.html = widget.content || '';
                break;
        }

        return {
            id: widgetId,
            elType: 'widget',
            widgetType,
            settings,
            elements: []
        };
    }
}
