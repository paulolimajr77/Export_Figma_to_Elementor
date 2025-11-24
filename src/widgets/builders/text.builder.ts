import type { ElementorElement, ElementorSettings } from '../types/elementor.types';
import { generateGUID } from '../utils/guid';
import { extractTypography, extractTextColor } from '../extractors/typography.extractor';
import { extractMargin } from '../extractors/layout.extractor';

/**
 * Cria um widget de texto (heading ou text-editor)
 * @param node Nó de texto do Figma
 * @returns Elemento Elementor
 */
export function createTextWidget(node: TextNode): ElementorElement {
    // Determina se é heading baseado no tamanho ou peso da fonte
    const isHeading = (node.fontSize as number) > 24 ||
        (node.fontName as FontName).style.toLowerCase().includes('bold');

    const widgetType = isHeading ? 'heading' : 'text-editor';
    const settings: ElementorSettings = {};

    // Define o conteúdo
    if (isHeading) {
        settings.title = node.characters;
    } else {
        settings.editor = node.characters;
    }

    // Extrai tipografia
    Object.assign(settings, extractTypography(node));

    // Extrai cor
    const color = extractTextColor(node);
    if (color) {
        if (isHeading) {
            settings.title_color = color;
        } else {
            settings.text_color = color;
        }
    }

    // Extrai margin
    Object.assign(settings, extractMargin(node));

    return {
        id: generateGUID(),
        elType: 'widget',
        widgetType,
        settings,
        elements: []
    };
}

/**
 * Cria um widget de heading
 * @param node Nó de texto do Figma
 * @param settings Settings adicionais
 * @returns Elemento Elementor
 */
export function createHeadingWidget(node: TextNode, settings: ElementorSettings = {}): ElementorElement {
    settings.title = node.characters;
    Object.assign(settings, extractTypography(node));

    const color = extractTextColor(node);
    if (color) settings.title_color = color;

    return {
        id: generateGUID(),
        elType: 'widget',
        widgetType: 'heading',
        settings,
        elements: []
    };
}

/**
 * Cria um widget de editor de texto
 * @param node Nó de texto do Figma
 * @param settings Settings adicionais
 * @returns Elemento Elementor
 */
export function createTextEditorWidget(node: TextNode, settings: ElementorSettings = {}): ElementorElement {
    settings.editor = node.characters;
    Object.assign(settings, extractTypography(node));

    const color = extractTextColor(node);
    if (color) settings.text_color = color;

    return {
        id: generateGUID(),
        elType: 'widget',
        widgetType: 'text-editor',
        settings,
        elements: []
    };
}
