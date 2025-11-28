import type { ElementorElement, ElementorSettings } from '../types/elementor.types';
import { generateGUID } from '../utils/guid';

/**
 * ContainerBuilder simples:
 * - não infere grids/colunas múltiplas;
 * - mantém ordem dos filhos;
 * - cria um container único com children processados externamente;
 * - não analisa aparência visual.
 */
export class ContainerBuilder {
    private processNodeFn: (node: SceneNode, parent: SceneNode | null) => Promise<ElementorElement>;

    constructor(
        processNodeFn: (node: SceneNode, parent: SceneNode | null) => Promise<ElementorElement>
    ) {
        this.processNodeFn = processNodeFn;
    }

    /**
     * Cria um container simples para um node Figma.
     * Sempre retorna um container com flex-direction column e content_width full.
     */
    async build(
        node: SceneNode,
        parentNode: SceneNode | null = null
    ): Promise<ElementorElement> {
        const settings: ElementorSettings = {
            content_width: 'full',
            flex_direction: 'column'
        };

        // Processa filhos preservando ordem
        let childElements: ElementorElement[] = [];
        if ('children' in node) {
            childElements = [];
            for (const child of (node as FrameNode).children) {
                childElements.push(await this.processNodeFn(child, node));
            }
        }

        return {
            id: generateGUID(),
            elType: 'container',
            isInner: !!parentNode,
            settings,
            elements: childElements
        };
    }
}
