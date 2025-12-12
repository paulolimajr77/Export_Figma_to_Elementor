import { PipelineSchema, PipelineContainer, PipelineWidget } from '../types/pipeline.schema';
import { ElementorJSON, ElementorElement, ElementorSettings, WPConfig } from '../types/elementor.types';
import { generateGUID } from '../utils/guid';
import { compileWithRegistry } from '../config/widget.registry';
import { normalizeColor, normalizeElementorSettings, normalizePadding, normalizeFlexGap, normalizeFlexAlign } from '../utils/style_normalizer';

/**
 * Compilador Elementor para Flexbox Containers (Elementor 3.19+)
 */
export class ElementorCompiler {
    private wpConfig: WPConfig = {};

    public setWPConfig(config: WPConfig) {
        this.wpConfig = config;
    }

    private sanitizeColor(value: any): string | undefined {
        return normalizeColor(value);
    }

    /**
     * Convert any color format (rgba, rgb, {r,g,b}, string) to HEX string
     * Elementor Button widget prefers HEX colors for background_color
     */
    private toHex(value: any): string {
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

    public compile(schema: PipelineSchema): ElementorJSON {
        const elements = schema.containers.map(container => this.compileContainer(container, false));

        // Ensure siteurl ends with /wp-json/ as Elementor expects
        let siteurl = this.wpConfig?.url || '';
        if (siteurl && !siteurl.endsWith('/')) siteurl += '/';
        if (siteurl && !siteurl.endsWith('wp-json/')) siteurl += 'wp-json/';

        const template: ElementorJSON = {
            type: 'elementor',
            version: '0.4',
            siteurl: siteurl,
            elements
        };
        return template as any;
    }

    private compileContainer(container: PipelineContainer, isInner: boolean): ElementorElement {
        // Fast-path: if this "container" is naively wrapping a single widget,
        // return the widget directly to avoid extra wrapper (atomic widget pattern).
        // This is critical for buttons, icon-box, image-box to work correctly in Elementor.
        if (
            container.children?.length === 0 &&
            Array.isArray(container.widgets) &&
            container.widgets.length === 1
        ) {
            const soleWidget = container.widgets[0];
            const sourceName = String(
                soleWidget.styles?.sourceName ||
                container.styles?.sourceName ||
                soleWidget.type ||
                ''
            ).toLowerCase();
            const widgetType = soleWidget.type?.toLowerCase() || '';

            // Atomic widgets that should NOT be wrapped in a container
            const atomicWidgets = ['w:icon-box', 'w:image-box', 'w:button', 'button', 'icon-box', 'image-box'];
            const isAtomic = atomicWidgets.some(w => sourceName.startsWith(w) || widgetType === w.replace('w:', ''));

            if (isAtomic) {
                // Transfer container styles (background, border, padding) to the widget
                // This ensures button gets all visual properties
                if (container.styles && !soleWidget.styles) {
                    soleWidget.styles = { ...container.styles };
                } else if (container.styles && soleWidget.styles) {
                    // Merge: widget styles take precedence, but fill gaps from container
                    soleWidget.styles = {
                        ...container.styles,
                        ...soleWidget.styles
                    };
                }
                return this.compileWidget(soleWidget);
            }
        }

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

        // Flex alignment - usando função centralizada com valores normalizados
        if (styles.justify_content) {
            const jc = normalizeFlexAlign(styles.justify_content);
            if (jc) {
                settings.justify_content = jc;
                settings.flex_justify_content = jc;
                // Breakpoints responsivos vazios (herdam do base)
                (settings as any).justify_content_tablet = '';
                (settings as any).justify_content_mobile = '';
            }
        }
        if (styles.align_items) {
            const ai = normalizeFlexAlign(styles.align_items);
            if (ai) {
                settings.align_items = ai;
                settings.flex_align_items = ai;
                // Breakpoints responsivos vazios (herdam do base)
                (settings as any).align_items_tablet = '';
                (settings as any).align_items_mobile = '';
            }
        }

        // Only set gap if it's a valid number > 0 (ignore auto/undefined)
        if (typeof styles.gap === 'number' && styles.gap > 0) {
            const gapValue = normalizeFlexGap(styles.gap);
            if (gapValue) {
                settings.flex_gap = gapValue;
            }
        }

        // Only set padding if at least one value is non-zero
        // Padding Logic: Check explicit undefined rather than 0 to allow forcing 0px
        if (styles.paddingTop !== undefined || styles.paddingRight !== undefined || styles.paddingBottom !== undefined || styles.paddingLeft !== undefined) {
            const pTop = styles.paddingTop || 0;
            const pRight = styles.paddingRight || 0;
            const pBottom = styles.paddingBottom || 0;
            const pLeft = styles.paddingLeft || 0;

            const paddingValue = normalizePadding(pTop, pRight, pBottom, pLeft);
            if (paddingValue) {
                settings.padding = paddingValue;
                (settings as any)._padding = paddingValue;
            }
        }

        if (styles.background) {
            const bg = styles.background;

            if (bg.type === 'solid' || bg.color) {
                // Handle solid color background
                const sanitizedColor = this.sanitizeColor(bg.color);
                if (sanitizedColor) {
                    settings.background_background = 'classic';
                    settings.background_color = sanitizedColor;
                }
            } else if (bg.type === 'gradient' && bg.stops && bg.stops.length >= 2) {
                // Handle gradient background
                settings.background_background = 'gradient';
                settings.background_gradient_type = bg.gradientType || 'linear';

                // Set first color (color)
                settings.background_color = bg.stops[0].color;
                settings.background_color_stop = { unit: '%', size: bg.stops[0].position, sizes: [] };

                // Set second color (color_b)
                if (bg.stops.length >= 2) {
                    settings.background_color_b = bg.stops[bg.stops.length - 1].color;
                    settings.background_color_b_stop = { unit: '%', size: bg.stops[bg.stops.length - 1].position, sizes: [] };
                }

                // Set gradient angle use provided angle or default 180
                const angle = bg.angle !== undefined ? bg.angle : 180;
                settings.background_gradient_angle = { unit: 'deg', size: angle, sizes: [] };
            } else if (bg.type === 'image' && bg.imageHash) {
                settings.background_background = 'classic';
                // Image URL will be resolved by uploader
                settings.background_image = { url: '', id: 0, imageHash: bg.imageHash };
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

            // Suportar bordas uniformes ou individuais por lado
            if (b.width !== undefined) {
                // Borda uniforme
                const w = String(b.width);
                settings.border_width = { unit: 'px', top: w, right: w, bottom: w, left: w, isLinked: true };
            } else if (b.widthTop !== undefined || b.widthRight !== undefined || b.widthBottom !== undefined || b.widthLeft !== undefined) {
                // Bordas individuais por lado
                const top = String(b.widthTop || 0);
                const right = String(b.widthRight || 0);
                const bottom = String(b.widthBottom || 0);
                const left = String(b.widthLeft || 0);
                const isLinked = top === right && right === bottom && bottom === left;
                settings.border_width = { unit: 'px', top, right, bottom, left, isLinked };
                console.log('[figtoel-boxmodel] container border_width individual:', settings.border_width);
            }

            if (b.color) settings.border_color = b.color;
            if (b.radius) {
                const r = String(b.radius);
                settings.border_radius = { unit: 'px', top: r, right: r, bottom: r, left: r, isLinked: true };
            }
        } else if (styles.cornerRadius) {
            const r = String(styles.cornerRadius);
            settings.border_radius = { unit: 'px', top: r, right: r, bottom: r, left: r, isLinked: true };
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
            // Remove non-standard camelCase key to avoid duplicated entries
            if ((baseSettings as any).customCss) delete (baseSettings as any).customCss;
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
                isInner: (registryResult as any).isInner ?? false,
                isLocked: false,
                widgetType: registryResult.widgetType,
                settings: normalizedSettings,
                defaultEditSettings: { defaultEditRoute: 'content' },
                elements: (registryResult as any).elements || []
            };
        }

        // Fallback simples
        let widgetType: string = widget.type;
        const settings: ElementorSettings = { ...baseSettings };

        // Nunca usar HTML como fallback para cards reconhecidos (icon-box/image-box)
        if (widget.type === 'icon-box' || widget.type === 'image-box') {
            return {
                id: widgetId,
                elType: 'widget',
                isInner: false,
                isLocked: false,
                widgetType: widget.type,
                settings: {
                    ...settings,
                    title_text: widget.content || settings.title_text || '',
                    description_text: settings.description_text || '',
                    selected_icon: settings.selected_icon || { value: 'fas fa-star', library: 'fa-solid' },
                    image: settings.image
                },
                defaultEditSettings: { defaultEditRoute: 'content' },
                elements: []
            };
        }

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
                settings.size = 'sm'; // Match JSON B default

                // Reset Button Type to ensure custom styles apply (avoids Theme styles like Success/Green)
                settings.button_type = '';

                // Typography
                Object.assign(settings, this.mapTypography(widget.styles || {}, 'typography'));

                // Background (Solid, Gradient, Image)
                // CAUTION: AI might return a complex 'background_color' object instead of 'background'. Check both.
                const bg = widget.styles?.background || (typeof (widget as any).settings?.background_color === 'object' ? (widget as any).settings.background_color : null);

                if (bg) {
                    if (bg.type === 'solid' || (bg.color && !bg.stops)) {
                        const c = bg.color || bg;
                        settings.background_background = 'classic';
                        settings.background_color = this.toHex(c);
                    } else if (bg.type === 'gradient' || (bg.stops && Array.isArray(bg.stops))) {
                        settings.background_background = 'gradient';
                        settings.background_gradient_type = bg.gradientType || 'linear';

                        // Gradient Angle: use extracted value, fallback to 180 (vertical) NOT 0
                        const angle = bg.angle !== undefined ? bg.angle : 180;
                        settings.background_gradient_angle = { unit: 'deg', size: angle, sizes: [] };

                        if (bg.stops && bg.stops.length > 0) {
                            // Convert to HEX for Elementor compatibility
                            settings.background_color = this.toHex(bg.stops[0].color);

                            // Normalize Stop Position (0-1 -> 0-100)
                            let stopA = bg.stops[0].position;
                            if (stopA <= 1 && stopA > 0) stopA = Math.round(stopA * 100);
                            settings.background_color_stop = { unit: '%', size: stopA || 0, sizes: [] };

                            if (bg.stops.length > 1) {
                                const last = bg.stops[bg.stops.length - 1];
                                settings.background_color_b = this.toHex(last.color);

                                let stopB = last.position;
                                if (stopB <= 1 && stopB > 0) stopB = Math.round(stopB * 100);
                                settings.background_color_b_stop = { unit: '%', size: stopB || 100, sizes: [] };
                            }
                        }
                    } else if (bg.type === 'image') {
                        settings.background_background = 'classic';
                        settings.background_image = { url: '', id: 0, imageHash: bg.imageHash };
                    }
                }

                // Cleanup: If background_color came in as an object (from AI), remove it now
                if (settings.background_color && typeof settings.background_color === 'object') {
                    delete settings.background_color;
                }

                // Text color - convert to HEX
                if (baseSettings.color) {
                    settings.button_text_color = this.toHex(baseSettings.color);
                }

                // Padding - use text_padding (NOT button_padding)
                if (widget.styles?.button_padding || widget.styles?.padding || widget.styles?.paddingTop !== undefined) {
                    const p = widget.styles?.button_padding || widget.styles?.padding;

                    if (p && typeof p === 'object') {
                        settings.text_padding = {
                            unit: 'px',
                            top: String(p.top || p.paddingTop || 0),
                            right: String(p.right || p.paddingRight || 0),
                            bottom: String(p.bottom || p.paddingBottom || 0),
                            left: String(p.left || p.paddingLeft || 0),
                            isLinked: false
                        };
                    } else if (widget.styles?.paddingTop !== undefined) {
                        settings.text_padding = {
                            unit: 'px',
                            top: String(widget.styles.paddingTop || 0),
                            right: String(widget.styles.paddingRight || 0),
                            bottom: String(widget.styles.paddingBottom || 0),
                            left: String(widget.styles.paddingLeft || 0),
                            isLinked: false
                        };
                    }
                }

                // Cleanup incorrect key if present
                if ((settings as any).button_padding) delete (settings as any).button_padding;

                // Border Style & Radius
                if (widget.styles?.border) {
                    const b = widget.styles.border;
                    if (b.type) settings.border_border = b.type;
                    if (b.width !== undefined) {
                        const w = String(b.width);
                        settings.border_width = { unit: 'px', top: w, right: w, bottom: w, left: w, isLinked: true };
                    }
                    if (b.color) settings.border_color = this.toHex(b.color);
                    if (b.radius !== undefined) {
                        const r = String(b.radius);
                        settings.border_radius = { unit: 'px', top: r, right: r, bottom: r, left: r, isLinked: true };
                    }
                }

                // Fallback: cornerRadius directly from styles
                if (!settings.border_radius && widget.styles?.cornerRadius !== undefined) {
                    const r = String(widget.styles.cornerRadius);
                    settings.border_radius = { unit: 'px', top: r, right: r, bottom: r, left: r, isLinked: true };
                }

                // Hover Transition Duration (default 0.3s for smooth UX)
                settings.button_hover_transition_duration = { unit: 's', size: 0.3, sizes: [] };

                // Icon
                if (widget.imageId) {
                    settings.selected_icon = this.normalizeSelectedIcon(
                        widget.styles?.selected_icon || baseSettings.selected_icon || widget.content,
                        widget.imageId,
                        { value: 'fas fa-arrow-right', library: 'fa-solid' }
                    );
                    // icon_align: 'row-reverse' means icon on RIGHT (matches JSON B)
                    settings.icon_align = 'row-reverse';

                    // Icon indent (spacing between text and icon)
                    if (widget.styles?.gap !== undefined) {
                        settings.icon_indent = { unit: 'px', size: widget.styles.gap, sizes: [] };
                    }
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

        // SAFEGUARD: Ensure background_color is a string (Elementor crash prevention)
        if (finalSettings.background_color && typeof finalSettings.background_color === 'object') {
            console.warn('[ElementorCompiler] ⚠️ Sanitizing invalid background_color object for', widgetType);
            // If it's a gradient object that slipped through, we might want to kill it to avoid crash
            // The correct gradient settings should have been set by the button/container logic.
            // If we are here, it means the specific logic failed or wasn't triggered.
            delete finalSettings.background_color;
        }

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
