"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTextWidget = createTextWidget;
exports.createHeadingWidget = createHeadingWidget;
exports.createTextEditorWidget = createTextEditorWidget;
const guid_1 = require("../utils/guid");
const typography_extractor_1 = require("../extractors/typography.extractor");
const layout_extractor_1 = require("../extractors/layout.extractor");
/**
 * Cria um widget de texto (heading ou text-editor)
 * @param node Nó de texto do Figma
 * @returns Elemento Elementor
 */
function createTextWidget(node) {
    // Determina se é heading baseado no tamanho ou peso da fonte
    const isHeading = node.fontSize > 24 ||
        node.fontName.style.toLowerCase().includes('bold');
    const widgetType = isHeading ? 'heading' : 'text-editor';
    const settings = {};
    // Define o conteúdo
    if (isHeading) {
        settings.title = node.characters;
    }
    else {
        settings.editor = node.characters;
    }
    // Extrai tipografia
    Object.assign(settings, (0, typography_extractor_1.extractTypography)(node));
    // Extrai cor
    const color = (0, typography_extractor_1.extractTextColor)(node);
    if (color) {
        if (isHeading) {
            settings.title_color = color;
        }
        else {
            settings.text_color = color;
        }
    }
    // Extrai margin
    Object.assign(settings, (0, layout_extractor_1.extractMargin)(node));
    return {
        id: (0, guid_1.generateGUID)(),
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
function createHeadingWidget(node, settings = {}) {
    settings.title = node.characters;
    Object.assign(settings, (0, typography_extractor_1.extractTypography)(node));
    const color = (0, typography_extractor_1.extractTextColor)(node);
    if (color)
        settings.title_color = color;
    return {
        id: (0, guid_1.generateGUID)(),
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
function createTextEditorWidget(node, settings = {}) {
    settings.editor = node.characters;
    Object.assign(settings, (0, typography_extractor_1.extractTypography)(node));
    const color = (0, typography_extractor_1.extractTextColor)(node);
    if (color)
        settings.text_color = color;
    return {
        id: (0, guid_1.generateGUID)(),
        elType: 'widget',
        widgetType: 'text-editor',
        settings,
        elements: []
    };
}
