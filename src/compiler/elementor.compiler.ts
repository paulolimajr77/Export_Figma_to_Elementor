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

    public compile(schema: PipelineSchema): ElementorJSON {
        const elements = schema.containers.map(container => this.compileContainer(container, false));
        return {
            type: 'elementor',
            siteurl: '',
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

        const widgetElements = container.widgets.map(w => this.compileWidget(w));
        const childContainers = container.children.map(child => this.compileContainer(child, true));

        return {
            id,
            elType: 'container',
            isInner,
            settings,
            elements: [...widgetElements, ...childContainers]
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
            if (bg.color) {
                settings.background_background = 'classic';
                settings.background_color = bg.color;
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

        return settings;
    }

    private compileWidget(widget: PipelineWidget): ElementorElement {
        const widgetId = generateGUID();
        const baseSettings: ElementorSettings = { _element_id: widgetId, ...widget.styles };

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
                break;
            case 'text':
                widgetType = 'text-editor';
                settings.editor = widget.content || 'Text';
                break;
            case 'button':
                widgetType = 'button';
                settings.text = widget.content || 'Button';
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
