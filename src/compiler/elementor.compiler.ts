import type { ElementorElement, ElementorSettings, WPConfig, NavMenuItem } from '../types/elementor.types';
import { generateGUID, stripWidgetPrefix } from '../utils/guid';
import { detectRelativePosition } from '../utils/geometry';
import { ImageUploader } from '../media/uploader';
import { ContainerBuilder } from '../containers/container.builder';
import { detectWidgetType, detectWidgetFromPrefix, isIconNode, isImageNode } from '../widgets/detector';
import { createTextWidget } from '../widgets/builders/text.builder';
import { extractBorderStyles, extractShadows, extractOpacity, extractTransform } from '../extractors/styles.extractor';
import { extractMargin, extractPositioning, extractPadding } from '../extractors/layout.extractor';
import { extractBackgroundAdvanced } from '../extractors/background.extractor';
import { extractTypography, extractTextColor } from '../extractors/typography.extractor';
import { StructureOptimizer } from '../optimizers/structure.optimizer';

export interface CompilerOptions {
    optimizeStructure?: boolean;
}

/**
 * Type guards
 */
function hasLayout(node: SceneNode): node is FrameNode | ComponentNode | InstanceNode {
    return 'layoutMode' in node;
}

function hasCornerRadius(node: SceneNode): node is FrameNode | RectangleNode | ComponentNode | InstanceNode {
    return 'cornerRadius' in node || 'topLeftRadius' in node;
}

/**
 * Verifica recursivamente se um nó contém imagens
 */
function hasImageContent(node: SceneNode): boolean {
    if (isImageNode(node)) return true;

    if ('children' in node) {
        return node.children.some(child => hasImageContent(child));
    }

    return false;
}

/**
 * Compilador principal refatorado
 * Orquestra todos os módulos para gerar JSON Elementor
 */
export class ElementorCompiler {
    private uploader: ImageUploader;
    private containerBuilder: ContainerBuilder;
    private wpConfig: WPConfig;
    private stats = { optimizedCount: 0 };
    private options: CompilerOptions = {};

    constructor(wpConfig: WPConfig = {}, quality: number = 0.85) {
        this.wpConfig = wpConfig;
        this.uploader = new ImageUploader(wpConfig, quality);
        this.containerBuilder = new ContainerBuilder(
            this.uploader,
            this.processNode.bind(this)
        );
    }

    /**
     * Compila nós do Figma em elementos Elementor
     */
    async compile(nodes: readonly SceneNode[], options: CompilerOptions = {}): Promise<{ elements: ElementorElement[], stats: { optimizedCount: number } }> {
        this.options = options;
        this.stats = { optimizedCount: 0 };
        const { optimizeStructure = true } = options;

        // Se for um único frame de artboard sem prefixo, processa seus filhos
        if (nodes.length === 1) {
            const node = nodes[0];
            const isArtboard = node.parent && node.parent.type === 'PAGE';
            const hasPrefix = node.name.match(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i);

            if (node.type === 'FRAME' && isArtboard && !hasPrefix) {
                const frame = node as FrameNode;

                // Processa filhos diretamente (a otimização ocorrerá dentro de processNode)
                const children = await Promise.all(
                    frame.children.map(child => this.processNode(child, null, true))
                );
                return { elements: children, stats: this.stats };
            }
        }

        const elements = await Promise.all(
            Array.from(nodes).map(async node => {
                // A otimização ocorrerá dentro de processNode
                return this.processNode(node, null, true);
            })
        );
        return { elements, stats: this.stats };
    }

    /**
     * Processa um nó individual
     */
    async processNode(
        node: SceneNode,
        parentNode: SceneNode | null = null,
        isTopLevel: boolean = false
    ): Promise<ElementorElement> {
        // Otimização de Estrutura (Tree Shaking)
        // Aplicada aqui para garantir recursividade em toda a árvore
        if (this.options.optimizeStructure) {
            const optimizedNode = StructureOptimizer.optimize(node);
            if (optimizedNode !== node) {
                // console.log(`[Compiler] 🌳 Nó otimizado: ${node.name} -> ${optimizedNode.name}`);
                this.stats.optimizedCount++;
                node = optimizedNode;
            }
        }

        const rawName = node.name || '';

        // 1. Verificação de Container Trancado (Restaurada)
        // Se o nó estiver trancado, exportamos como IMAGEM ÚNICA.
        // Isso melhora drasticamente a performance para ilustrações complexas e respeita a intenção do usuário.
        if (node.locked) {
            console.log(`[Compiler] 🔒 Nó trancado detectado: ${node.name}. Exportando como imagem.`);
            return this.createExplicitWidget(node, 'image');
        }

        // Verifica se tem prefixo explícito
        const widgetSlug = detectWidgetFromPrefix(rawName);
        if (widgetSlug) {
            // Prefixos de container
            if (['container', 'section', 'inner-container', 'column', 'row'].includes(widgetSlug)) {
                return this.containerBuilder.build(node, parentNode, isTopLevel);
            }
            // Widget explícito
            return this.createExplicitWidget(node, widgetSlug);
        }

        // Detecção automática
        const detected = detectWidgetType(node);

        if (detected === 'container') {
            return this.containerBuilder.build(node, parentNode, isTopLevel);
        }

        if (detected) {
            return this.createExplicitWidget(node, detected);
        }

        // Texto sem prefixo
        if (node.type === 'TEXT') {
            return createTextWidget(node as TextNode);
        }

        // Imagem sem prefixo
        if (isImageNode(node)) {
            return this.createExplicitWidget(node, 'image');
        }

        // Frame/Group como container
        if (['FRAME', 'GROUP', 'INSTANCE', 'COMPONENT'].includes(node.type)) {
            return this.containerBuilder.build(node, parentNode, isTopLevel);
        }

        // Detecta ícones/vetores antes do fallback
        if (isIconNode(node)) {
            console.log(`[Compiler] 🎨 Detectado ícone/vetor: ${node.name} (${node.type})`);
            return this.createExplicitWidget(node, 'icon');
        }

        // Fallback melhorado com log informativo
        console.warn(`[Compiler] ⚠️ Nó não suportado: "${node.name}" (tipo: ${node.type})`);
        return {
            id: generateGUID(),
            elType: 'widget',
            widgetType: 'text-editor',
            settings: {
                editor: `<!-- Nó não suportado: ${node.type} "${node.name}" -->`,
                _widget_title: `⚠️ ${node.type}: ${node.name}`
            },
            elements: []
        };
    }

    /**
     * Cria um widget explícito baseado no slug
     */
    private async createExplicitWidget(node: SceneNode, widgetSlug: string): Promise<ElementorElement> {
        const settings: ElementorSettings = {};
        const cleanTitle = stripWidgetPrefix(node.name);
        settings._widget_title = cleanTitle || widgetSlug;

        // Encontra todos os descendentes
        const allDescendants = this.findAllChildren(node);
        let imageNode: SceneNode | null = null;
        let titleNode: TextNode | null = null;
        let descNode: TextNode | null = null;

        // Para widgets compostos, identifica os componentes
        if (['image-box', 'icon-box', 'button', 'image'].includes(widgetSlug)) {
            if (widgetSlug === 'image-box' || widgetSlug === 'image') {
                imageNode = allDescendants.find(c => isImageNode(c)) || null;
            } else if (widgetSlug === 'icon-box' || widgetSlug === 'icon') {
                imageNode = allDescendants.find(c => isIconNode(c)) || null;
            }

            // Encontra nós de texto (título e descrição)
            const textNodes = allDescendants.filter(c => c.type === 'TEXT') as TextNode[];
            textNodes.sort((a, b) => {
                const yA = 'absoluteBoundingBox' in a ? a.absoluteBoundingBox?.y || 0 : 0;
                const yB = 'absoluteBoundingBox' in b ? b.absoluteBoundingBox?.y || 0 : 0;
                return yA - yB;
            });
            if (textNodes.length > 0) titleNode = textNodes[0];
            if (textNodes.length > 1) descNode = textNodes[1];
        }

        // Nós de conteúdo (para não aplicar estilos neles)
        const contentNodes = [imageNode, titleNode, descNode].filter(n => n !== null) as SceneNode[];
        const styleNode = this.detectStyleNode(node, contentNodes);

        // Extrai estilos gerais
        Object.assign(settings, extractMargin(node));
        Object.assign(settings, extractPositioning(node));
        Object.assign(settings, extractTransform(node));
        Object.assign(settings, extractOpacity(node));

        // Extrai estilos do nó de estilo
        if (styleNode) {
            Object.assign(settings, await extractBackgroundAdvanced(styleNode, this.uploader));
            Object.assign(settings, extractBorderStyles(styleNode));
            Object.assign(settings, extractShadows(styleNode));
            if (hasLayout(styleNode) || hasCornerRadius(styleNode)) {
                Object.assign(settings, extractPadding(styleNode));
            }
        } else {
            Object.assign(settings, extractBorderStyles(node));
            Object.assign(settings, extractShadows(node));
        }

        // Widgets específicos
        await this.buildSpecificWidget(widgetSlug, node, settings, imageNode, titleNode, descNode);

        return {
            id: generateGUID(),
            elType: 'widget',
            widgetType: widgetSlug,
            settings,
            elements: []
        };
    }

    /**
     * Constrói configurações específicas de cada tipo de widget
     */
    private async buildSpecificWidget(
        widgetSlug: string,
        node: SceneNode,
        settings: ElementorSettings,
        imageNode: SceneNode | null,
        titleNode: TextNode | null,
        descNode: TextNode | null
    ): Promise<void> {
        // Nav Menu - retorna vazio (menu é criado no WordPress)
        if (widgetSlug === 'nav-menu') {
            return;
        }

        // Image
        if (widgetSlug === 'image') {
            const upload = await this.uploader.uploadToWordPress(node, 'WEBP');
            settings.image = { url: upload?.url || '', id: upload?.id || 0 };
            if ('width' in node) {
                settings.width = { unit: 'px', size: Math.round((node as any).width) };
            }
        }

        // Button
        else if (widgetSlug === 'button') {
            if (titleNode) {
                settings.text = titleNode.characters;
                Object.assign(settings, extractTypography(titleNode));
                const color = extractTextColor(titleNode);
                if (color) settings.button_text_color = color;
            } else if (node.type === 'TEXT') {
                settings.text = (node as TextNode).characters;
            } else {
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
                const pos = detectRelativePosition(imageNode, titleNode);
                settings.position = pos;
                if (pos === 'left' || pos === 'right') {
                    settings.content_vertical_alignment = 'middle';
                }
            }

            // Imagem/Ícone
            if (imageNode) {
                if (widgetSlug === 'image-box') {
                    const upload = await this.uploader.uploadToWordPress(imageNode, 'WEBP');
                    if (upload) settings.image = { url: upload.url, id: upload.id };
                    if ('width' in imageNode) {
                        const w = Math.round((imageNode as any).width);
                        settings.image_width = { unit: 'px', size: w };
                        settings.image_size = { unit: 'px', size: w, sizes: [] };
                    }
                } else {
                    const upload = await this.uploader.uploadToWordPress(imageNode, 'SVG');
                    if (upload) settings.selected_icon = { value: { url: upload.url, id: upload.id }, library: 'svg' };
                    if ('width' in imageNode) {
                        const w = Math.round((imageNode as any).width);
                        settings.icon_size = { unit: 'px', size: w };
                    }
                }
            }

            // Título
            if (titleNode) {
                settings.title_text = titleNode.characters;
                const typo = extractTypography(titleNode);
                const color = extractTextColor(titleNode);
                for (const key in typo) {
                    settings[key.replace('typography_', 'title_typography_')] = typo[key];
                }
                if (color) settings.title_color = color;
            }

            // Descrição
            if (descNode) {
                settings.description_text = descNode.characters;
                const typo = extractTypography(descNode);
                const color = extractTextColor(descNode);
                for (const key in typo) {
                    settings[key.replace('typography_', 'description_typography_')] = typo[key];
                }
                if (color) settings.description_color = color;
            } else {
                settings.description_text = '';
            }
        }

        // Heading
        else if (widgetSlug === 'heading') {
            if (node.type === 'TEXT') {
                settings.title = (node as TextNode).characters;
                Object.assign(settings, extractTypography(node as TextNode));
                const color = extractTextColor(node as TextNode);
                if (color) settings.title_color = color;
            }
        }

        // Text Editor
        else if (widgetSlug === 'text-editor') {
            if (node.type === 'TEXT') {
                settings.editor = (node as TextNode).characters;
                Object.assign(settings, extractTypography(node as TextNode));
                const color = extractTextColor(node as TextNode);
                if (color) settings.text_color = color;
            }
        }

        // Icon
        else if (widgetSlug === 'icon') {
            const upload = await this.uploader.uploadToWordPress(node, 'SVG');
            if (upload) settings.selected_icon = { value: { url: upload.url, id: upload.id }, library: 'svg' };
        }

        // Divider
        else if (widgetSlug === 'divider') {
            settings.style = 'solid';
            settings.weight = { unit: 'px', size: ('height' in node) ? Math.max(1, Math.round((node as any).height)) : 1 };

            // Cor do divider
            if ('fills' in node && Array.isArray((node as any).fills) && (node as any).fills.length > 0) {
                const fill = (node as any).fills[0];
                if (fill.type === 'SOLID') {
                    settings.color = `rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.opacity || 1})`;
                }
            } else if ('strokes' in node && Array.isArray((node as any).strokes) && (node as any).strokes.length > 0) {
                const stroke = (node as any).strokes[0];
                if (stroke.type === 'SOLID') {
                    settings.color = `rgba(${Math.round(stroke.color.r * 255)}, ${Math.round(stroke.color.g * 255)}, ${Math.round(stroke.color.b * 255)}, ${stroke.opacity || 1})`;
                }
            }
        }

        // Spacer
        else if (widgetSlug === 'spacer') {
            settings.space = { unit: 'px', size: ('height' in node) ? Math.round((node as any).height) : 50 };

            // Se tiver background, aplicamos
            Object.assign(settings, await extractBackgroundAdvanced(node, this.uploader));
        }
    }

    /**
     * Detecta o nó que contém os estilos visuais
     */
    private detectStyleNode(node: SceneNode, internalContentNodes: SceneNode[]): any {
        // Se o próprio nó tem estilos, usa ele
        if (('fills' in node && Array.isArray((node as any).fills) && (node as any).fills.length > 0) ||
            ('strokes' in node && Array.isArray((node as any).strokes) && (node as any).strokes.length > 0) ||
            ('effects' in node && Array.isArray((node as any).effects) && (node as any).effects.length > 0)) {
            return node;
        }

        // Procura um filho que seja o background/estilo
        if ('children' in node) {
            const children = (node as FrameNode).children;
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (internalContentNodes.includes(child)) continue;
                if (child.width < 10 || child.height < 10) continue;

                if ((child.type === 'RECTANGLE' || child.type === 'FRAME' || child.type === 'ELLIPSE') &&
                    (('fills' in child && Array.isArray((child as any).fills) && (child as any).fills.length > 0) ||
                        ('strokes' in child && Array.isArray((child as any).strokes) && (child as any).strokes.length > 0) ||
                        ('effects' in child && Array.isArray((child as any).effects) && (child as any).effects.length > 0))) {
                    return child;
                }
            }
        }
        return node;
    }

    /**
     * Encontra todos os filhos recursivamente
     */
    private findAllChildren(node: SceneNode, result: SceneNode[] = []): SceneNode[] {
        if ('children' in node) {
            for (const child of (node as FrameNode).children) {
                result.push(child);
                this.findAllChildren(child, result);
            }
        }
        return result;
    }

    /**
     * Encontra todos os elementos nav-menu recursivamente
     */
    findNavMenus(elements: ElementorElement[]): NavMenuItem[] {
        const navMenus: NavMenuItem[] = [];

        const searchRecursive = (els: ElementorElement[]) => {
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
    setWPConfig(wpConfig: WPConfig): void {
        this.wpConfig = wpConfig;
        this.uploader.setWPConfig(wpConfig);
    }

    /**
     * Atualiza qualidade de exportação
     */
    setQuality(quality: number): void {
        this.uploader.setQuality(quality);
    }

    /**
     * Processa resposta de upload
     */
    handleUploadResponse(id: string, result: any): void {
        this.uploader.handleUploadResponse(id, result);
    }
}
