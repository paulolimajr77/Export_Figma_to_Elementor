var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { generateGUID } from '../utils/guid';
import { extractBorderStyles, extractShadows, extractOpacity, extractTransform } from '../extractors/styles.extractor';
import { extractFlexLayout, extractPadding, extractMargin } from '../extractors/layout.extractor';
import { extractBackgroundAdvanced } from '../extractors/background.extractor';
import { detectContainerType, isInnerContainer } from './container.detector';
/**
 * Classe responsável pela criação de containers Elementor
 */
export class ContainerBuilder {
    constructor(uploader, processNodeFn) {
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
    build(node_1) {
        return __awaiter(this, arguments, void 0, function* (node, parentNode = null, isTopLevel = false) {
            const lname = node.name.toLowerCase();
            let settings = {};
            const containerType = detectContainerType(node, parentNode, isTopLevel);
            let isInner = containerType === 'inner';
            // Extrai estilos do container
            Object.assign(settings, extractBorderStyles(node));
            Object.assign(settings, extractShadows(node));
            Object.assign(settings, yield extractBackgroundAdvanced(node, this.uploader));
            Object.assign(settings, extractPadding(node));
            Object.assign(settings, extractOpacity(node));
            Object.assign(settings, extractTransform(node));
            Object.assign(settings, extractFlexLayout(node));
            Object.assign(settings, extractMargin(node));
            // Container externo (section)
            if (containerType === 'external') {
                let childToMerge = null;
                // Verifica se tem um único filho que é inner container
                if ('children' in node) {
                    const children = node.children;
                    const frameChildren = children.filter(c => c.type === 'FRAME' || c.type === 'INSTANCE');
                    if (frameChildren.length === 1 && isInnerContainer(frameChildren[0], node)) {
                        childToMerge = frameChildren[0];
                    }
                }
                // Se tem filho para mesclar, usa configuração boxed
                if (childToMerge) {
                    settings.content_width = 'boxed';
                    settings.width = { unit: '%', size: 100 };
                    settings.boxed_width = { unit: 'px', size: Math.round(childToMerge.width) };
                    Object.assign(settings, extractPadding(childToMerge));
                    Object.assign(settings, extractFlexLayout(childToMerge));
                    const grandChildren = yield Promise.all(childToMerge.children.map(c => this.processNodeFn(c, node, false)));
                    return {
                        id: generateGUID(),
                        elType: 'container',
                        isInner: false,
                        settings,
                        elements: grandChildren
                    };
                }
                else {
                    // Container full-width
                    settings.content_width = 'full';
                    settings.width = { unit: '%', size: 100 };
                    // Se a largura é menor que 1200, usa boxed
                    if ('width' in node && node.width < 1200) {
                        settings.content_width = 'boxed';
                        settings.boxed_width = { unit: 'px', size: Math.round(node.width) };
                    }
                }
            }
            else {
                // Container interno ou normal
                isInner = true;
                settings.content_width = 'full';
            }
            // Remove posicionamento absoluto se existir
            if (settings._position === 'absolute') {
                delete settings._position;
            }
            // Processa filhos
            let childElements = [];
            if ('children' in node) {
                childElements = yield Promise.all(node.children.map(child => this.processNodeFn(child, node, false)));
            }
            return {
                id: generateGUID(),
                elType: 'container',
                isInner,
                settings,
                elements: childElements
            };
        });
    }
}
