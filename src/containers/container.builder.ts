import type { ElementorElement, ElementorSettings } from '../types/elementor.types';
import { generateGUID } from '../utils/guid';
import { extractBorderStyles, extractShadows, extractOpacity, extractTransform } from '../extractors/styles.extractor';
import { extractFlexLayout, extractPadding, extractMargin } from '../extractors/layout.extractor';
import { extractBackgroundAdvanced, type ImageUploader } from '../extractors/background.extractor';
import { detectContainerType, isInnerContainer } from './container.detector';

/**
 * Classe responsável pela criação de containers Elementor
 */
export class ContainerBuilder {
    private uploader: ImageUploader;
    private processNodeFn: (node: SceneNode, parent: SceneNode | null, isTopLevel: boolean) => Promise<ElementorElement>;

    constructor(
        uploader: ImageUploader,
        processNodeFn: (node: SceneNode, parent: SceneNode | null, isTopLevel: boolean) => Promise<ElementorElement>
    ) {
        this.uploader = uploader;
        this.processNodeFn = processNodeFn;
    }

    /**
     * Constrói um container Elementor a partir de um nó do Figma
     * @param node Nó do Figma
     * @param parentNode Nó pai
     * @param isTopLevel Se é nó de nível superior
     * @returns Elemento Elementor container
     */
    async build(
        node: SceneNode,
        parentNode: SceneNode | null = null,
        isTopLevel: boolean = false
    ): Promise<ElementorElement> {
        const lname = node.name.toLowerCase();
        let settings: ElementorSettings = {};
        const containerType = detectContainerType(node, parentNode, isTopLevel);
        let isInner = containerType === 'inner';

        // Extrai estilos do container
        Object.assign(settings, extractBorderStyles(node));
        Object.assign(settings, extractShadows(node));
        Object.assign(settings, await extractBackgroundAdvanced(node, this.uploader));
        Object.assign(settings, extractPadding(node));
        Object.assign(settings, extractOpacity(node));
        Object.assign(settings, extractTransform(node));
        Object.assign(settings, extractFlexLayout(node));
        Object.assign(settings, extractMargin(node));

        // Container externo (section)
        if (containerType === 'external') {
            let childToMerge: FrameNode | null = null;

            // Verifica se tem um único filho que é inner container
            if ('children' in node) {
                const children = (node as FrameNode).children;
                const frameChildren = children.filter(c => c.type === 'FRAME' || c.type === 'INSTANCE');
                if (frameChildren.length === 1 && isInnerContainer(frameChildren[0], node)) {
                    childToMerge = frameChildren[0] as FrameNode;
                }
            }

            // Se tem filho para mesclar, usa configuração boxed
            if (childToMerge) {
                settings.content_width = 'boxed';
                settings.width = { unit: '%', size: 100 };
                settings.boxed_width = { unit: 'px', size: Math.round(childToMerge.width) };
                Object.assign(settings, extractPadding(childToMerge));
                Object.assign(settings, extractFlexLayout(childToMerge));

                const grandChildren = await Promise.all(
                    childToMerge.children.map(c => this.processNodeFn(c, node, false))
                );

                return {
                    id: generateGUID(),
                    elType: 'container',
                    isInner: false,
                    settings,
                    elements: grandChildren
                };
            } else {
                // Container full-width
                settings.content_width = 'full';
                settings.width = { unit: '%', size: 100 };

                // Se a largura é menor que 1200, usa boxed
                if ('width' in node && (node as any).width < 1200) {
                    settings.content_width = 'boxed';
                    settings.boxed_width = { unit: 'px', size: Math.round((node as any).width) };
                }
            }
        } else {
            // Container interno ou normal
            isInner = true;
            settings.content_width = 'full';
        }

        // Remove posicionamento absoluto se existir
        if (settings._position === 'absolute') {
            delete settings._position;
        }

        // Processa filhos
        let childElements: ElementorElement[] = [];
        if ('children' in node) {
            childElements = await Promise.all(
                (node as FrameNode).children.map(child => this.processNodeFn(child, node, false))
            );
        }

        return {
            id: generateGUID(),
            elType: 'container',
            isInner,
            settings,
            elements: childElements
        };
    }
}
