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
        const template: ElementorJSON = {
            type: 'elementor',
            version: '0.4',
            siteurl: this.wpConfig?.url || '',
            elements
        };
        return template as any;
    }

    private compileContainer(container: PipelineContainer, isInner: boolean): ElementorElement {
        const id = generateGUID();
        const flexDirection = container.direction === 'row' ? 'row' : 'column';
        const settings: ElementorSettings = {
            _element_id: id,
            container_type: 'flex',
            content_width: container.width === 'full' ? 'full' : 'boxed',
            flex_direction: flexDirection,
            flex__is_row: 'row',
            flex__is_column: 'column',
            ...this.mapContainerStyles(container.styles, container.width !== 'full')
        };
        if (!settings.flex_gap) {
            settings.flex_gap = { unit: 'px', column: '', row: '', isLinked: true };
        }
        if (!settings.justify_content) settings.justify_content = 'flex-start';
        if (!settings.align_items) settings.align_items = 'flex-start';

        // Ensure standard Elementor flex properties
        settings.flex_justify_content = settings.justify_content;
        settings.flex_align_items = settings.align_items;

        const widgetElements = container.widgets.map(w => ({ order: (w.styles as any)?._order ?? 0, el: this.compileWidget(w) }));
        const childContainers = container.children.map(child => ({ order: (child.styles as any)?._order ?? 0, el: this.compileContainer(child, true) }));
        const merged = [...widgetElements, ...childContainers].sort((a, b) => a.order - b.order).map(i => i.el);

        return {
            id,
            elType: 'container',
            isInner,
            isLocked: false,
            settings,
            defaultEditSettings: { defaultEditRoute: 'content' },
            elements: merged
        };
    }

    private mapContainerStyles(styles: Record<string, any>, isBoxed: boolean = false): ElementorSettings {
        const settings: ElementorSettings = {};
        settings.overflow = 'hidden'; // Fix: Prevent unwanted scrollbars
        if (!styles) return settings;

        // DEBUG: Log incoming styles
        console.log('[CONTAINER STYLES DEBUG]', {
            gap: styles.gap,
            paddingTop: styles.paddingTop,
            paddingRight: styles.paddingRight,
            paddingBottom: styles.paddingBottom,
            paddingLeft: styles.paddingLeft,
            sourceName: styles.sourceName
        });

        const normalizeFlexValue = (value?: string): string | undefined => {
            if (!value) return undefined;
            if (value === 'start') return 'flex-start';
            if (value === 'end') return 'flex-end';
            return value;
        };

        if (styles.justify_content) {
            settings.justify_content = normalizeFlexValue(styles.justify_content);
            settings.flex_justify_content = settings.justify_content;
        }
        if (styles.align_items) {
            settings.align_items = normalizeFlexValue(styles.align_items);
            settings.flex_align_items = settings.align_items;
        }

        // Only set gap if it's a valid number > 0 (ignore auto/undefined)
        if (typeof styles.gap === 'number' && styles.gap > 0) {
            settings.flex_gap = {
                unit: 'px',
                column: String(styles.gap),
                row: String(styles.gap),
                isLinked: true
            };
        }

        // Only set padding if at least one value is non-zero
        const pTop = typeof styles.paddingTop === 'number' ? styles.paddingTop : 0;
        const pRight = typeof styles.paddingRight === 'number' ? styles.paddingRight : 0;
        const pBottom = typeof styles.paddingBottom === 'number' ? styles.paddingBottom : 0;
        const pLeft = typeof styles.paddingLeft === 'number' ? styles.paddingLeft : 0;

        // Only set padding if at least one value is non-zero
        if (pTop !== 0 || pRight !== 0 || pBottom !== 0 || pLeft !== 0) {
            settings.padding = {
                unit: 'px',
                top: pTop,
                right: pRight,
                bottom: pBottom,
                left: pLeft,
                isLinked: pTop === pRight && pTop === pBottom && pTop === pLeft
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
            if (isBoxed) {
                settings.boxed_width = { unit: 'px', size: styles.width, sizes: [] };
                settings.width = { unit: '%', size: '', sizes: [] };
            } else {
                settings.width = { unit: 'px', size: styles.width, sizes: [] };
            }
        } else {
            settings.width = { unit: '%', size: '', sizes: [] };
        }

        if (styles.minHeight) {
            settings.min_height = { unit: 'px', size: styles.minHeight, sizes: [] };
        } else {
            settings.min_height = { unit: 'px', size: '', sizes: [] };
        }

        if (styles.primaryAxisAlignItems) {
            const map: Record<string, string> = { MIN: 'start', CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between' };
            settings.justify_content = settings.justify_content || map[styles.primaryAxisAlignItems] || 'start';
        }

        if (styles.counterAxisAlignItems) {
            const map: Record<string, string> = { MIN: 'start', CENTER: 'center', MAX: 'end', STRETCH: 'stretch' };
            settings.align_items = settings.align_items || map[styles.counterAxisAlignItems] || 'start';
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
        if (styles.fontName || styles.fontSize || styles.fontWeight || styles.lineHeight || styles.letterSpacing) {
            s[`${prefix}_typography`] = 'custom';
        }
        if (styles.fontName) {
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
        const ignoredKeys = [
            'fontName', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
            'textDecoration', 'textCase', 'paragraphIndent', 'paragraphSpacing',
            'fills', 'strokes', 'effects', 'layoutMode', 'primaryAxisAlignItems',
            'counterAxisAlignItems', 'primaryAxisSizingMode', 'counterAxisSizingMode',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing',
            'gap', 'background', 'border', 'cornerRadius', 'width', 'height',
            'sourceId', 'sourceName', '_order'
        ];

        Object.keys(raw).forEach(k => {
            if (ignoredKeys.includes(k)) return;

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

    private looksLikeIconUrl(value: any): boolean {
        if (typeof value !== 'string') return false;
        const trimmed = value.trim();
        return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.endsWith('.svg') || trimmed.startsWith('<svg');
    }

    private normalizeSelectedIcon(
        icon: any,
        imageId?: string | number,
        fallback: { value: string; library: string } = { value: 'fas fa-star', library: 'fa-solid' }
    ): { value: any; library: string } {
        if (!icon) return { ...fallback };

        // Safety check: if icon is already a normalized SVG object, return it to prevent double nesting
        if (icon.value && icon.library === 'svg' && typeof icon.value === 'object' && 'url' in icon.value) {
            return icon;
        }

        const rawValue = icon.value || icon.url || icon.icon || icon;
        const normalized: any = { ...fallback, ...icon, value: rawValue };

        if (this.looksLikeIconUrl(rawValue)) {
            const parsedId = imageId !== undefined ? parseInt(String(imageId), 10) : (icon.id ?? icon.wpId);
            normalized.library = 'svg';
            normalized.value = {
                url: rawValue,
                id: isNaN(parsedId as any) ? '' : parsedId
            };
        } else if (!normalized.library) {
            normalized.library = fallback.library;
        }

        return normalized;
    }

    private normalizeIconList(settings: ElementorSettings): ElementorSettings {
        if (!Array.isArray(settings.icon_list)) return settings;

        settings.icon_list = settings.icon_list.map((item: any, idx: number) => {
            const normalizedIcon = this.normalizeSelectedIcon(
                item.icon || item.selected_icon || item,
                item.imageId || item.icon?.id || item.selected_icon?.id,
                { value: (item?.icon?.value || item?.selected_icon?.value || 'fas fa-check'), library: item?.icon?.library || item?.selected_icon?.library || 'fa-solid' }
            );
            return {
                _id: item._id || `icon_item_${idx + 1}`,
                ...item,
                selected_icon: normalizedIcon
            };
        });

        return settings;
    }

    private normalizeIconSettings(widgetType: string, settings: ElementorSettings, widget?: PipelineWidget): ElementorSettings {
        const normalized = { ...settings };

        if (widgetType === 'icon' || widgetType === 'icon-box') {
            const imageId = widget?.imageId || (normalized.selected_icon as any)?.id || (normalized.selected_icon as any)?.wpId;
            normalized.selected_icon = this.normalizeSelectedIcon(normalized.selected_icon, imageId);
        }

        if (widgetType === 'icon-list') {
            this.normalizeIconList(normalized);
        }

        return normalized;
    }

    private compileWidget(widget: PipelineWidget): ElementorElement {
        const widgetId = generateGUID();
        const baseSettings: ElementorSettings = { _element_id: widgetId, ...this.sanitizeSettings(widget.styles || {}) };
        Object.assign(baseSettings, this.mapTypography(widget.styles || {}));

        if (widget.styles?.customCss) {
            baseSettings.custom_css = widget.styles.customCss;
        }

        if (widget.styles?.align) {
            baseSettings.align = widget.styles.align;
        }

        // Tenta registry primeiro (baseado em type/kind)
        const registryResult = compileWithRegistry(widget, baseSettings);
        if (registryResult) {
            const normalizedSettings = this.normalizeIconSettings(registryResult.widgetType, registryResult.settings, widget);
            return {
                id: widgetId,
                elType: 'widget',
                isLocked: false,
                widgetType: registryResult.widgetType,
                settings: normalizedSettings,
                defaultEditSettings: { defaultEditRoute: 'content' },
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
                if (baseSettings.color) settings.title_color = baseSettings.color;
                break;
            case 'text':
                widgetType = 'text-editor';
                settings.editor = widget.content || '';
                if (baseSettings.color) settings.text_color = baseSettings.color;
                break;
            case 'button':
                widgetType = 'button';
                settings.text = widget.content || 'Button';

                // Typography
                Object.assign(settings, this.mapTypography(widget.styles || {}, 'typography'));

                // Background color
                if (widget.styles?.background) {
                    settings.background_color = this.sanitizeColor(widget.styles.background);
                } else if (widget.styles?.fills && Array.isArray(widget.styles.fills) && widget.styles.fills.length > 0) {
                    const solidFill = widget.styles.fills.find((f: any) => f.type === 'SOLID');
                    if (solidFill) {
                        settings.background_color = this.sanitizeColor(solidFill.color);
                    }
                }

                // Text color
                if (baseSettings.color) {
                    settings.button_text_color = baseSettings.color;
                }

                // Padding
                if (widget.styles?.paddingTop !== undefined || widget.styles?.paddingRight !== undefined ||
                    widget.styles?.paddingBottom !== undefined || widget.styles?.paddingLeft !== undefined) {
                    settings.button_padding = {
                        unit: 'px',
                        top: widget.styles.paddingTop || 0,
                        right: widget.styles.paddingRight || 0,
                        bottom: widget.styles.paddingBottom || 0,
                        left: widget.styles.paddingLeft || 0,
                        isLinked: false
                    };
                }

                // Border radius
                if (widget.styles?.cornerRadius !== undefined) {
                    settings.border_radius = {
                        unit: 'px',
                        top: widget.styles.cornerRadius,
                        right: widget.styles.cornerRadius,
                        bottom: widget.styles.cornerRadius,
                        left: widget.styles.cornerRadius,
                        isLinked: true
                    };
                }

                // Icon
                if (widget.imageId) {
                    settings.selected_icon = this.normalizeSelectedIcon(
                        widget.styles?.selected_icon || baseSettings.selected_icon || widget.content,
                        widget.imageId,
                        { value: 'fas fa-arrow-right', library: 'fa-solid' }
                    );
                    settings.icon_align = 'right'; // Default to right alignment
                }

                break;
            case 'image':
                widgetType = 'image';
                const imgId = widget.imageId ? parseInt(widget.imageId, 10) : 0;
                const finalId = isNaN(imgId) ? '' : imgId;

                settings.image = {
                    url: widget.content || '',
                    id: finalId
                };
                break;
            case 'icon':
                widgetType = 'icon';
                // Don't normalize here, let normalizeIconSettings handle it at the end
                settings.selected_icon = widget.styles?.selected_icon || baseSettings.selected_icon || widget.content;
                break;
            case 'custom':
            default:
                widgetType = 'html';
                settings.html = widget.content || '';
                break;
        }

        const finalSettings = this.normalizeIconSettings(widgetType, settings, widget);

        return {
            id: widgetId,
            elType: 'widget',
            isLocked: false,
            widgetType,
            settings: finalSettings,
            defaultEditSettings: { defaultEditRoute: 'content' },
            elements: []
        };
    }
}
