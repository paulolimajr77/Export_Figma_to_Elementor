import { PipelineSchema, Section, Column, Widget } from '../types/pipeline.schema';
import { ElementorJSON, ElementorElement, ElementorSettings, WPConfig } from '../types/elementor.types';
import { generateGUID } from '../utils/guid';

/**
 * Compilador Elementor
 * Responsável por converter o Schema Intermediário (PipelineSchema) para o formato JSON do Elementor.
 */
export class ElementorCompiler {
    private wpConfig: WPConfig = {};

    constructor() { }

    /**
     * Define a configuração do WordPress
     */
    public setWPConfig(config: WPConfig) {
        this.wpConfig = config;
    }

    /**
     * Compila o Schema Intermediário para o formato final do Elementor
     */
    public compile(schema: PipelineSchema): ElementorJSON {
        const rootElements: ElementorElement[] = schema.sections.map(section => this.compileSection(section));

        return {
            type: "elementor",
            siteurl: "", // Pode ser deixado vazio ou configurado via WPConfig
            elements: rootElements
        } as any;
    }

    private compileSection(section: Section): ElementorElement {
        const sectionId = generateGUID();

        // Mapeamento de estilos da seção
        const settings: ElementorSettings = {
            layout: section.width === 'full' ? 'full_width' : 'boxed',
        };

        if (section.background.color) {
            settings.background_background = 'classic';
            settings.background_color = section.background.color;
        }
        if (section.background.image) {
            settings.background_background = 'classic';
            settings.background_image = { url: section.background.image, id: 0 }; // TODO: Resolver ID real se necessário
        }
        if (section.background.gradient) settings.background_background = 'gradient'; // Simplificação, precisaria de parser de gradiente real

        return {
            id: sectionId,
            elType: 'container',
            isInner: false,
            settings: {
                ...settings,
                content_width: 'boxed',
                flex_direction: 'row', // Seção atua como linha para colunas
                flex_wrap: 'wrap'
            },
            elements: section.columns.map(col => this.compileColumn(col))
        };
    }

    private compileColumn(column: Column): ElementorElement {
        const colId = generateGUID();
        const colWidth = (column.span / 12) * 100; // Conversão simples de grid 12 colunas para porcentagem

        return {
            id: colId,
            elType: 'container',
            isInner: false, // Containers aninhados também parecem ser isInner: false no modelo novo, ou true? O exemplo do usuário não mostra aninhamento. Vamos assumir false por enquanto.
            settings: {
                content_width: 'full',
                width: { unit: '%', size: colWidth, sizes: [] },
                flex_direction: 'column' // Coluna empilha widgets verticalmente
            },
            elements: column.widgets.map(widget => this.compileWidget(widget))
        };
    }

    private compileWidget(widget: Widget): ElementorElement {
        const widgetId = generateGUID();
        let widgetType: string = widget.type;
        let settings: ElementorSettings = { ...widget.styles };

        // Mapeamento de tipos e propriedades específicas
        switch (widget.type) {
            case 'heading':
                settings.title = widget.content || 'Heading';
                if (widget.styles.color) {
                    settings.title_color = widget.styles.color;
                    delete settings.color;
                }
                if (widget.styles.text_align) {
                    settings.align = widget.styles.text_align;
                    delete settings.text_align;
                }
                settings.typography_typography = 'custom';
                break;
            case 'text':
                widgetType = 'text-editor';
                settings.editor = widget.content || 'Text';
                if (widget.styles.color) {
                    settings.text_color = widget.styles.color;
                    delete settings.color;
                }
                if (widget.styles.text_align) {
                    settings.align = widget.styles.text_align;
                    delete settings.text_align;
                }
                settings.typography_typography = 'custom';
                break;
            case 'button':
                settings.text = widget.content || 'Button';
                if (widget.styles.color) {
                    settings.button_text_color = widget.styles.color;
                    delete settings.color;
                }
                if (widget.styles.text_align) {
                    settings.align = widget.styles.text_align;
                    delete settings.text_align;
                }
                settings.typography_typography = 'custom';
                break;
            case 'image':
                settings.image = {
                    url: widget.content || '',
                    id: widget.imageId ? parseInt(widget.imageId) : 0
                };
                break;
            case 'icon':
                settings.selected_icon = { value: widget.content || 'fas fa-star', library: 'fa-solid' };
                break;
            case 'html':
                widgetType = 'html';
                settings.html = widget.content || '';
                break;
            case 'divider':
                widgetType = 'divider';
                break;
            case 'list':
                widgetType = 'icon-list';
                break;
            case 'imageBox':
                widgetType = 'image-box';
                settings.image = {
                    url: widget.styles?.image_url || '',
                    id: widget.imageId ? parseInt(widget.imageId) : 0
                };
                settings.title_text = "Title"; // Default
                settings.description_text = widget.content || "Description";
                break;
            case 'iconBox':
                widgetType = 'icon-box';
                settings.selected_icon = { value: 'fas fa-star', library: 'fa-solid' };
                settings.title_text = "Title";
                settings.description_text = widget.content || "Description";
                break;
            case 'custom':
                return this.compileCustomContainer(widget);
            default:
                // Fallback para evitar erro de tipo desconhecido
                console.warn(`Tipo de widget desconhecido: ${widget.type}. Renderizando como Spacer.`);
                widgetType = 'spacer';
                settings.space = { unit: 'px', size: 50, sizes: [] };
                break;
        }

        return {
            id: widgetId,
            elType: 'widget',
            widgetType: widgetType,
            settings: settings,
            elements: []
        };
    }

    private compileCustomContainer(widget: Widget): ElementorElement {
        const containerId = generateGUID();
        const styles = widget.styles || {};

        // Mapeamento de estilos "custom" (Figma Auto Layout) para Elementor Container
        const settings: ElementorSettings = {
            content_width: 'boxed',
            flex_direction: styles.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
            flex_gap: {
                unit: 'px',
                column: styles.itemSpacing || 0,
                row: styles.itemSpacing || 0,
                isLinked: true
            },
            padding: {
                unit: 'px',
                top: styles.paddingTop || 0,
                right: styles.paddingRight || 0,
                bottom: styles.paddingBottom || 0,
                left: styles.paddingLeft || 0,
                isLinked: false
            }
        };

        if (widget.styles && widget.styles.image_url) {
            settings.background_background = 'classic';
            settings.background_image = {
                url: widget.styles.image_url,
                id: widget.imageId ? parseInt(widget.imageId) : 0
            };
        }

        if (styles.primaryAxisAlignItems) {
            // Mapeamento aproximado
            const map: any = { 'MIN': 'start', 'CENTER': 'center', 'MAX': 'end', 'SPACE_BETWEEN': 'space-between' };
            settings.justify_content = map[styles.primaryAxisAlignItems] || 'start';
        }

        if (styles.counterAxisAlignItems) {
            const map: any = { 'MIN': 'start', 'CENTER': 'center', 'MAX': 'end' };
            settings.align_items = map[styles.counterAxisAlignItems] || 'start';
        }

        if (styles.width) {
            settings.width = { unit: 'px', size: styles.width, sizes: [] };
            settings.content_width = 'full';
        }

        return {
            id: containerId,
            elType: 'container',
            isInner: false,
            settings: settings,
            elements: [] // Widgets "custom" no pipeline atual não têm filhos definidos no schema, então retornam vazio
        };
    }
}
