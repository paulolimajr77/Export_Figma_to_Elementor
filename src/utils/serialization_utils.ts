/// <reference types="@figma/plugin-typings" />
import type { LayoutAnalysis, ChildNode } from '../api_gemini';
import { rgbToHex } from './image_utils';

export interface SerializedNode {
    id: string;
    name: string;
    type: string;
    width: number;
    height: number;
    x: number;
    y: number;
    visible: boolean;
    locked: boolean;
    [key: string]: any; // Allow other properties for flexibility
}

export function serializeNode(node: SceneNode, parentId?: string): SerializedNode {
    const data: SerializedNode = {
        id: node.id,
        name: node.name,
        type: node.type,
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        visible: node.visible,
        locked: node.locked,
        parentId: parentId || null
    };

    // Opacity & Blend Mode
    if ('opacity' in node) data.opacity = (node as any).opacity;
    if ('blendMode' in node) data.blendMode = (node as any).blendMode;

    // Fills
    if ('fills' in node && (node as any).fills !== figma.mixed) {
        data.fills = (node as any).fills.map((fill: any) => {
            if (fill.type === 'SOLID') {
                return { type: 'SOLID', color: fill.color, opacity: fill.opacity, visible: fill.visible };
            }
            if (fill.type === 'IMAGE') {
                return { type: 'IMAGE', visible: fill.visible, imageHash: fill.imageHash, scaleMode: fill.scaleMode };
            }
            // Gradientes - incluir gradientStops e gradientTransform
            if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL' || fill.type === 'GRADIENT_ANGULAR' || fill.type === 'GRADIENT_DIAMOND') {
                return {
                    type: fill.type,
                    gradientStops: fill.gradientStops || [],
                    gradientTransform: fill.gradientTransform || [[1, 0, 0], [0, 1, 0]],
                    opacity: fill.opacity,
                    visible: fill.visible
                };
            }
            return { type: fill.type, visible: fill.visible };
        });
    }

    // Strokes
    if ('strokes' in node && (node as any).strokes !== figma.mixed) {
        data.strokes = (node as any).strokes.map((stroke: any) => {
            if (stroke.type === 'SOLID') {
                return { type: 'SOLID', color: stroke.color, opacity: stroke.opacity, visible: stroke.visible };
            }
            return { type: stroke.type, visible: stroke.visible };
        });
        data.strokeWeight = (node as any).strokeWeight;
        data.strokeAlign = (node as any).strokeAlign;
        data.strokeCap = (node as any).strokeCap;
        data.strokeJoin = (node as any).strokeJoin;
        data.dashPattern = (node as any).dashPattern;
    }

    // Effects (Shadows, Blurs)
    if ('effects' in node && (node as any).effects !== figma.mixed) {
        data.effects = (node as any).effects.map((effect: any) => ({
            type: effect.type,
            visible: effect.visible,
            radius: effect.radius,
            offset: effect.offset,
            spread: effect.spread,
            color: effect.color,
            blendMode: effect.blendMode
        }));
    }

    // Corner Radius
    if ('cornerRadius' in node) {
        if ((node as any).cornerRadius !== figma.mixed) {
            data.cornerRadius = (node as any).cornerRadius;
        } else {
            data.topLeftRadius = (node as any).topLeftRadius;
            data.topRightRadius = (node as any).topRightRadius;
            data.bottomLeftRadius = (node as any).bottomLeftRadius;
            data.bottomRightRadius = (node as any).bottomRightRadius;
        }
    }

    // Constraints
    if ('constraints' in node) {
        data.constraints = (node as any).constraints;
    }

    // Text Properties
    if (node.type === 'TEXT') {
        data.characters = (node as any).characters;
        data.fontSize = (node as any).fontSize;
        data.fontName = (node as any).fontName;
        data.fontWeight = (node as any).fontWeight;
        data.textAlignHorizontal = (node as any).textAlignHorizontal;
        data.textAlignVertical = (node as any).textAlignVertical;
        data.textAutoResize = (node as any).textAutoResize;
        data.letterSpacing = (node as any).letterSpacing;
        data.lineHeight = (node as any).lineHeight;
        data.textCase = (node as any).textCase;
        data.textDecoration = (node as any).textDecoration;

        if ((node as any).fills !== figma.mixed && (node as any).fills.length > 0 && (node as any).fills[0].type === 'SOLID') {
            data.color = ((node as any).fills[0] as SolidPaint).color;
        }
    }

    // Auto Layout
    if ('layoutMode' in node) {
        data.layoutMode = node.layoutMode;
        data.direction = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
        data.primaryAxisSizingMode = node.primaryAxisSizingMode;
        data.counterAxisSizingMode = node.counterAxisSizingMode;
        data.primaryAxisAlignItems = node.primaryAxisAlignItems;
        data.counterAxisAlignItems = node.counterAxisAlignItems;
        data.paddingTop = node.paddingTop;
        data.paddingRight = node.paddingRight;
        data.paddingBottom = node.paddingBottom;
        data.paddingLeft = node.paddingLeft;
        data.itemSpacing = node.itemSpacing;
        if ('layoutWrap' in node) {
            data.layoutWrap = (node as any).layoutWrap;
        }
    }

    // Children
    if ('children' in node) {
        data.children = node.children.map(child => serializeNode(child, node.id));
    }

    return data;
}

// Função para normalizar JSON do Figma (API/Plugin) para o formato LayoutAnalysis
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
        widgetType: isContainer ? undefined : widgetType,
        width: node.width,
        height: node.height,
        fills: node.fills || node.backgrounds,
        cornerRadius: node.cornerRadius,
        // Text specific
        content: node.characters,
        characters: node.characters,
        fontSize: node.style?.fontSize,
        fontFamily: node.style?.fontFamily,
        fontWeight: node.style?.fontWeight,
        color: node.style?.fill ? rgbToHex(node.style.fill) : undefined, // Simplificação
        style: node.style
    };

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
