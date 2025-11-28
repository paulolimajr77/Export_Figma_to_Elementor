import type { ElementorElement, ElementorSettings } from '../../types/elementor.types';
import { generateGUID } from '../../utils/guid';
import { extractTypography, extractTextColor } from '../../extractors/typography.extractor';

/**
 * Cria widget de texto simples (heading ou text-editor) a partir de um TextNode.
 * Não aplica heurísticas complexas.
 */
export function createTextWidget(node: TextNode): ElementorElement {
    const settings: ElementorSettings = {};

    // Heading se houver indicação explícita por nome, senão text-editor
    const lname = node.name.toLowerCase();
    const isHeading = lname.includes('heading') || lname.includes('title');
    const widgetType = isHeading ? 'heading' : 'text-editor';

    if (isHeading) {
        settings.title = node.characters;
    } else {
        settings.editor = node.characters;
    }

    Object.assign(settings, extractTypography(node));

    const color = extractTextColor(node);
    if (color) {
        if (isHeading) {
            settings.title_color = color;
        } else {
            settings.text_color = color;
        }
    }

    return {
        id: generateGUID(),
        elType: 'widget',
        widgetType,
        settings,
        elements: []
    };
}
