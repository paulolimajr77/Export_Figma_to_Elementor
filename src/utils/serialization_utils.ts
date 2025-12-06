/// <reference types="@figma/plugin-typings" />
import type { LayoutAnalysis, ChildNode } from '../api_gemini';
import { rgbToHex } from './image_utils';
import type { SerializedNode } from '../services/serializer';
import { serializerService } from '../services/serializer';
export { rgbToHex };
export type { SerializedNode } from '../services/serializer';

export function serializeNode(node: SceneNode, parentId?: string) {
    return serializerService.serialize(node, parentId);
}

export function flattenSerializedTree(root: SerializedNode) {
    return serializerService.flatten(root);
}

export function createSerializedSnapshot(node: SceneNode) {
    return serializerService.createSnapshot(node);
}

export function normalizeFigmaJSON(json: any): LayoutAnalysis {
    // 1. Desembrulha 'document' ou 'children' se for a raiz
    let root = json;
    if (json.document) {
        root = json.document;
    }

    // Se a raiz for DOCUMENT ou PAGE, procura o primeiro FRAME/SECTION
    if (root.type === 'DOCUMENT' || root.type === 'PAGE') {
        if (root.children && root.children.length > 0) {
            // Tenta encontrar o primeiro Frame válido
            const firstFrame = root.children.find((c: any) => c.type === 'FRAME' || c.type === 'SECTION');
            if (firstFrame) {
                root = firstFrame;
            } else {
                root = root.children[0]; // Fallback
            }
        }
    }

    // 2. Mapeia propriedades
    const analysis: LayoutAnalysis = {
        frameName: root.name || "Layout Importado",
        width: root.width || 1200,
        height: root.height || 800,
        children: [],
        type: root.type,
        fills: root.backgrounds || root.fills || []
    };

    // Auto Layout
    if (root.layoutMode && root.layoutMode !== 'NONE') {
        analysis.autoLayout = {
            direction: root.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
            gap: root.itemSpacing || 0,
            padding: {
                top: root.paddingTop || root.padding || 0,
                right: root.paddingRight || root.padding || 0,
                bottom: root.paddingBottom || root.padding || 0,
                left: root.paddingLeft || root.padding || 0
            },
            primaryAlign: root.primaryAxisAlignItems,
            counterAlign: root.counterAxisAlignItems
        };
    }

    // Filhos
    if (root.children && Array.isArray(root.children)) {
        analysis.children = root.children.map((child: any) => normalizeChildNode(child));
    }

    return analysis;
}

export function normalizeChildNode(node: any): ChildNode {
    const isContainer = node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION';

    // Mapeia tipos do Figma para widgetType do Gemini
    let widgetType = 'container';
    if (!isContainer) {
        if (node.type === 'TEXT') widgetType = 'text';
        else if (node.type === 'RECTANGLE') widgetType = 'image'; // Assume imagem ou forma
        else if (node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'ELLIPSE') widgetType = 'icon';
        else widgetType = 'unknown';
    }

    const child: ChildNode = {
        type: isContainer ? 'container' : 'widget',
        name: node.name,
        width: node.width,
        height: node.height,
        fills: node.fills || node.backgrounds,
        cornerRadius: node.cornerRadius,
        style: node.style
    };

    if (!isContainer) {
        child.widgetType = widgetType;
    }

    if (typeof node.characters === 'string') {
        child.content = node.characters;
        child.characters = node.characters;
    }

    if (node.style?.fontSize) {
        child.fontSize = node.style.fontSize;
    }
    if (node.style?.fontFamily) {
        child.fontFamily = node.style.fontFamily;
    }
    if (node.style?.fontWeight) {
        child.fontWeight = node.style.fontWeight;
    }
    if (node.style?.fill) {
        child.color = rgbToHex(node.style.fill);
    }

    // Auto Layout para containers
    if (node.layoutMode && node.layoutMode !== 'NONE') {
        child.autoLayout = {
            direction: node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
            gap: node.itemSpacing || 0,
            padding: {
                top: node.paddingTop || node.padding || 0,
                right: node.paddingRight || node.padding || 0,
                bottom: node.paddingBottom || node.padding || 0,
                left: node.paddingLeft || node.padding || 0
            }
        };
    }

    // Recursão
    if (node.children && Array.isArray(node.children)) {
        child.children = node.children.map((c: any) => normalizeChildNode(c));
    }

    return child;
}

// Helper para encontrar as seções reais para análise (drill down)
export function getSectionsToAnalyze(node: SceneNode): SceneNode[] {
    // NOVA LÓGICA: Não dividir NADA. Analisar o objeto selecionado exatamente como ele é.
    // Isso atende à solicitação do usuário de manter a altura do frame principal e o contexto.
    return [node];
}

// Helper para "descascar" wrappers redundantes (Aggressive Unwrapping)
export function unwrapNode(node: SceneNode): SceneNode {
    let currentNode = node;

    // Enquanto o node tiver exatamente 1 filho visível e for um container...
    while ('children' in currentNode) {
        const visibleChildren = currentNode.children.filter(child => child.visible);
        if (visibleChildren.length === 1 && (visibleChildren[0].type === 'FRAME' || visibleChildren[0].type === 'GROUP' || visibleChildren[0].type === 'SECTION')) {
            console.log(`Unwrapping redundant layer: ${currentNode.name} -> ${visibleChildren[0].name}`);
            currentNode = visibleChildren[0];
        } else {
            break;
        }
    }

    return currentNode;
}

export function repairJson(jsonString: string): string {
    let repaired = jsonString.trim();

    // Remove potential trailing commas
    if (repaired.endsWith(',')) {
        repaired = repaired.slice(0, -1);
    }

    // Count brackets/braces to close them
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') openBraces++;
            else if (char === '}') openBraces--;
            else if (char === '[') openBrackets++;
            else if (char === ']') openBrackets--;
        }
    }

    // Close unclosed structures
    while (openBraces > 0) {
        repaired += '}';
        openBraces--;
    }
    while (openBrackets > 0) {
        repaired += ']';
        openBrackets--;
    }

    return repaired;
}
