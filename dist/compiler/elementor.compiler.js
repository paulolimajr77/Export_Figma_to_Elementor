"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementorCompiler = void 0;
const guid_1 = require("../utils/guid");
const geometry_1 = require("../utils/geometry");
const uploader_1 = require("../media/uploader");
const container_builder_1 = require("../containers/container.builder");
const detector_1 = require("../widgets/detector");
const text_builder_1 = require("../widgets/builders/text.builder");
const styles_extractor_1 = require("../extractors/styles.extractor");
const layout_extractor_1 = require("../extractors/layout.extractor");
const background_extractor_1 = require("../extractors/background.extractor");
const typography_extractor_1 = require("../extractors/typography.extractor");
/**
 * Type guards
 */
function hasLayout(node) {
    return 'layoutMode' in node;
}
function hasCornerRadius(node) {
    return 'cornerRadius' in node || 'topLeftRadius' in node;
}
/**
 * Compilador principal refatorado
 * Orquestra todos os módulos para gerar JSON Elementor
 */
class ElementorCompiler {
    constructor(wpConfig = {}, quality = 0.85) {
        this.wpConfig = wpConfig;
        this.uploader = new uploader_1.ImageUploader(wpConfig, quality);
        this.containerBuilder = new container_builder_1.ContainerBuilder(this.uploader, this.processNode.bind(this));
    }
    /**
     * Compila nós do Figma em elementos Elementor
     */
    compile(nodes) {
        return __awaiter(this, void 0, void 0, function* () {
            // Se for um único frame de artboard sem prefixo, processa seus filhos
            if (nodes.length === 1) {
                const node = nodes[0];
                const isArtboard = node.parent && node.parent.type === 'PAGE';
                const hasPrefix = node.name.match(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i);
                if (node.type === 'FRAME' && isArtboard && !hasPrefix) {
                    const frame = node;
                    const children = yield Promise.all(frame.children.map(child => this.processNode(child, null, true)));
                    return children;
                }
            }
            const elements = yield Promise.all(Array.from(nodes).map((node) => __awaiter(this, void 0, void 0, function* () { return this.processNode(node, null, true); })));
            return elements;
        });
    }
    /**
     * Processa um nó individual
     */
    processNode(node_1) {
        return __awaiter(this, arguments, void 0, function* (node, parentNode = null, isTopLevel = false) {
            const rawName = node.name || '';
            // Verifica se tem prefixo explícito
            const widgetSlug = (0, detector_1.detectWidgetFromPrefix)(rawName);
            if (widgetSlug) {
                // Prefixos de container
                if (['container', 'section', 'inner-container', 'column', 'row'].includes(widgetSlug)) {
                    return this.containerBuilder.build(node, parentNode, isTopLevel);
                }
                // Widget explícito
                return this.createExplicitWidget(node, widgetSlug);
            }
            // Detecção automática
            const detected = (0, detector_1.detectWidgetType)(node);
            if (detected === 'container') {
                return this.containerBuilder.build(node, parentNode, isTopLevel);
            }
            if (detected) {
                return this.createExplicitWidget(node, detected);
            }
            // Texto sem prefixo
            if (node.type === 'TEXT') {
                return (0, text_builder_1.createTextWidget)(node);
            }
            // Imagem sem prefixo
            if ((0, detector_1.isImageNode)(node)) {
                return this.createExplicitWidget(node, 'image');
            }
            // Frame/Group como container
            if (['FRAME', 'GROUP', 'INSTANCE', 'COMPONENT'].includes(node.type)) {
                return this.containerBuilder.build(node, parentNode, isTopLevel);
            }
            // Fallback: widget de texto
            return {
                id: (0, guid_1.generateGUID)(),
                elType: 'widget',
                widgetType: 'text-editor',
                settings: { editor: 'Nó não suportado' },
                elements: []
            };
        });
    }
    /**
     * Cria um widget explícito baseado no slug
     */
    createExplicitWidget(node, widgetSlug) {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = {};
            const cleanTitle = (0, guid_1.stripWidgetPrefix)(node.name);
            settings._widget_title = cleanTitle || widgetSlug;
            // Encontra todos os descendentes
            const allDescendants = this.findAllChildren(node);
            let imageNode = null;
            let titleNode = null;
            let descNode = null;
            // Para widgets compostos, identifica os componentes
            if (['image-box', 'icon-box', 'button', 'image'].includes(widgetSlug)) {
                if (widgetSlug === 'image-box' || widgetSlug === 'image') {
                    imageNode = allDescendants.find(c => (0, detector_1.isImageNode)(c)) || null;
                }
                else if (widgetSlug === 'icon-box' || widgetSlug === 'icon') {
                    imageNode = allDescendants.find(c => (0, detector_1.isIconNode)(c)) || null;
                }
                // Encontra nós de texto (título e descrição)
                const textNodes = allDescendants.filter(c => c.type === 'TEXT');
                textNodes.sort((a, b) => {
                    var _a, _b;
                    const yA = 'absoluteBoundingBox' in a ? ((_a = a.absoluteBoundingBox) === null || _a === void 0 ? void 0 : _a.y) || 0 : 0;
                    const yB = 'absoluteBoundingBox' in b ? ((_b = b.absoluteBoundingBox) === null || _b === void 0 ? void 0 : _b.y) || 0 : 0;
                    return yA - yB;
                });
                if (textNodes.length > 0)
                    titleNode = textNodes[0];
                if (textNodes.length > 1)
                    descNode = textNodes[1];
            }
            // Nós de conteúdo (para não aplicar estilos neles)
            const contentNodes = [imageNode, titleNode, descNode].filter(n => n !== null);
            const styleNode = this.detectStyleNode(node, contentNodes);
            // Extrai estilos gerais
            Object.assign(settings, (0, layout_extractor_1.extractMargin)(node));
            Object.assign(settings, (0, layout_extractor_1.extractPositioning)(node));
            Object.assign(settings, (0, styles_extractor_1.extractTransform)(node));
            Object.assign(settings, (0, styles_extractor_1.extractOpacity)(node));
            // Extrai estilos do nó de estilo
            if (styleNode) {
                Object.assign(settings, yield (0, background_extractor_1.extractBackgroundAdvanced)(styleNode, this.uploader));
                Object.assign(settings, (0, styles_extractor_1.extractBorderStyles)(styleNode));
                Object.assign(settings, (0, styles_extractor_1.extractShadows)(styleNode));
                if (hasLayout(styleNode) || hasCornerRadius(styleNode)) {
                    Object.assign(settings, (0, layout_extractor_1.extractPadding)(styleNode));
                }
            }
            else {
                Object.assign(settings, (0, styles_extractor_1.extractBorderStyles)(node));
                Object.assign(settings, (0, styles_extractor_1.extractShadows)(node));
            }
            // Widgets específicos
            yield this.buildSpecificWidget(widgetSlug, node, settings, imageNode, titleNode, descNode);
            return {
                id: (0, guid_1.generateGUID)(),
                elType: 'widget',
                widgetType: widgetSlug,
                settings,
                elements: []
            };
        });
    }
    /**
     * Constrói configurações específicas de cada tipo de widget
     */
    buildSpecificWidget(widgetSlug, node, settings, imageNode, titleNode, descNode) {
        return __awaiter(this, void 0, void 0, function* () {
            // Nav Menu - retorna vazio (menu é criado no WordPress)
            if (widgetSlug === 'nav-menu') {
                return;
            }
            // Image
            if (widgetSlug === 'image') {
                const url = yield this.uploader.uploadToWordPress(node, 'WEBP');
                settings.image = { url: url || '', id: 0 };
                if ('width' in node) {
                    settings.width = { unit: 'px', size: Math.round(node.width) };
                }
            }
            // Button
            else if (widgetSlug === 'button') {
                if (titleNode) {
                    settings.text = titleNode.characters;
                    Object.assign(settings, (0, typography_extractor_1.extractTypography)(titleNode));
                    const color = (0, typography_extractor_1.extractTextColor)(titleNode);
                    if (color)
                        settings.button_text_color = color;
                }
                else if (node.type === 'TEXT') {
                    settings.text = node.characters;
                }
                else {
                    settings.text = 'Button';
                }
                if (settings.background_color) {
                    settings.button_background_color = settings.background_color;
                    delete settings.background_background;
                    delete settings.background_color;
                }
            }
            // Image Box / Icon Box
            else if (widgetSlug === 'image-box' || widgetSlug === 'icon-box') {
                // Posição relativa
                if (imageNode && titleNode) {
                    const pos = (0, geometry_1.detectRelativePosition)(imageNode, titleNode);
                    settings.position = pos;
                    if (pos === 'left' || pos === 'right') {
                        settings.content_vertical_alignment = 'middle';
                    }
                }
                // Imagem/Ícone
                if (imageNode) {
                    if (widgetSlug === 'image-box') {
                        const url = yield this.uploader.uploadToWordPress(imageNode, 'WEBP');
                        if (url)
                            settings.image = { url, id: 0 };
                        if ('width' in imageNode) {
                            const w = Math.round(imageNode.width);
                            settings.image_width = { unit: 'px', size: w };
                            settings.image_size = { unit: 'px', size: w, sizes: [] };
                        }
                    }
                    else {
                        const url = yield this.uploader.uploadToWordPress(imageNode, 'SVG');
                        if (url)
                            settings.selected_icon = { value: { url, id: 0 }, library: 'svg' };
                        if ('width' in imageNode) {
                            const w = Math.round(imageNode.width);
                            settings.icon_size = { unit: 'px', size: w };
                        }
                    }
                }
                // Título
                if (titleNode) {
                    settings.title_text = titleNode.characters;
                    const typo = (0, typography_extractor_1.extractTypography)(titleNode);
                    const color = (0, typography_extractor_1.extractTextColor)(titleNode);
                    for (const key in typo) {
                        settings[key.replace('typography_', 'title_typography_')] = typo[key];
                    }
                    if (color)
                        settings.title_color = color;
                }
                // Descrição
                if (descNode) {
                    settings.description_text = descNode.characters;
                    const typo = (0, typography_extractor_1.extractTypography)(descNode);
                    const color = (0, typography_extractor_1.extractTextColor)(descNode);
                    for (const key in typo) {
                        settings[key.replace('typography_', 'description_typography_')] = typo[key];
                    }
                    if (color)
                        settings.description_color = color;
                }
            }
            // Heading
            else if (widgetSlug === 'heading') {
                if (node.type === 'TEXT') {
                    settings.title = node.characters;
                    Object.assign(settings, (0, typography_extractor_1.extractTypography)(node));
                    const color = (0, typography_extractor_1.extractTextColor)(node);
                    if (color)
                        settings.title_color = color;
                }
            }
            // Text Editor
            else if (widgetSlug === 'text-editor') {
                if (node.type === 'TEXT') {
                    settings.editor = node.characters;
                    Object.assign(settings, (0, typography_extractor_1.extractTypography)(node));
                    const color = (0, typography_extractor_1.extractTextColor)(node);
                    if (color)
                        settings.text_color = color;
                }
            }
            // Icon
            else if (widgetSlug === 'icon') {
                const url = yield this.uploader.uploadToWordPress(node, 'SVG');
                if (url)
                    settings.selected_icon = { value: { url, id: 0 }, library: 'svg' };
            }
        });
    }
    /**
     * Detecta o nó que contém os estilos visuais
     */
    detectStyleNode(node, internalContentNodes) {
        // Se o próprio nó tem estilos, usa ele
        if (('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) ||
            ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) ||
            ('effects' in node && Array.isArray(node.effects) && node.effects.length > 0)) {
            return node;
        }
        // Procura um filho que seja o background/estilo
        if ('children' in node) {
            const children = node.children;
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (internalContentNodes.includes(child))
                    continue;
                if (child.width < 10 || child.height < 10)
                    continue;
                if ((child.type === 'RECTANGLE' || child.type === 'FRAME' || child.type === 'ELLIPSE') &&
                    (('fills' in child && Array.isArray(child.fills) && child.fills.length > 0) ||
                        ('strokes' in child && Array.isArray(child.strokes) && child.strokes.length > 0) ||
                        ('effects' in child && Array.isArray(child.effects) && child.effects.length > 0))) {
                    return child;
                }
            }
        }
        return node;
    }
    /**
     * Encontra todos os filhos recursivamente
     */
    findAllChildren(node, result = []) {
        if ('children' in node) {
            for (const child of node.children) {
                result.push(child);
                this.findAllChildren(child, result);
            }
        }
        return result;
    }
    /**
     * Encontra todos os elementos nav-menu recursivamente
     */
    findNavMenus(elements) {
        const navMenus = [];
        const searchRecursive = (els) => {
            for (const el of els) {
                if (el.widgetType === 'nav-menu') {
                    navMenus.push({
                        id: el.id,
                        name: el.settings._widget_title || 'Menu de Navegação'
                    });
                }
                if (el.elements && el.elements.length > 0) {
                    searchRecursive(el.elements);
                }
            }
        };
        searchRecursive(elements);
        return navMenus;
    }
    /**
     * Atualiza configuração do WordPress
     */
    setWPConfig(wpConfig) {
        this.wpConfig = wpConfig;
        this.uploader.setWPConfig(wpConfig);
    }
    /**
     * Atualiza qualidade de exportação
     */
    setQuality(quality) {
        this.uploader.setQuality(quality);
    }
    /**
     * Processa resposta de upload
     */
    handleUploadResponse(id, result) {
        this.uploader.handleUploadResponse(id, result);
    }
}
exports.ElementorCompiler = ElementorCompiler;
