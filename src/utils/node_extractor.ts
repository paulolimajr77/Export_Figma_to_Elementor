// Node extraction utilities for micro-prompts conversion
/// <reference types="@figma/plugin-typings" />

export interface DevModeData {
    css: string;
    autoLayout?: {
        direction: 'horizontal' | 'vertical' | 'none';
        gap: number;
        padding: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        alignment?: string;
        distribution?: string;
    };
    fills: readonly Paint[];
    strokes: readonly Paint[];
    effects: readonly Effect[];
    constraints?: {
        horizontal: string;
        vertical: string;
    };
}

export interface TextData {
    characters: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: LineHeight;
    letterSpacing: LetterSpacing;
}

export interface NodeData {
    id: string;
    name: string;
    type: string;
    width: number;
    height: number;
    x: number;
    y: number;
    devMode: DevModeData;
    text?: TextData;
    children: string[];
}

/**
 * Extrai dados completos de um node incluindo Dev Mode
 */
export function extractNodeData(node: SceneNode): NodeData {
    const devMode: DevModeData = {
        css: generateCSS(node),
        autoLayout: extractAutoLayout(node),
        fills: ('fills' in node && typeof node.fills !== 'symbol') ? node.fills : [],
        strokes: ('strokes' in node && typeof node.strokes !== 'symbol') ? node.strokes : [],
        effects: ('effects' in node && typeof node.effects !== 'symbol') ? node.effects : [],
        constraints: 'constraints' in node ? {
            horizontal: node.constraints.horizontal,
            vertical: node.constraints.vertical
        } : undefined
    };

    const textData: TextData | undefined = node.type === 'TEXT' ? {
        characters: node.characters,
        fontFamily: typeof node.fontName !== 'symbol' ? node.fontName.family : 'Inter',
        fontSize: typeof node.fontSize === 'number' ? node.fontSize : 16,
        fontWeight: typeof node.fontName !== 'symbol' ? node.fontName.style : 'Regular',
        lineHeight: typeof node.lineHeight !== 'symbol' ? node.lineHeight : { unit: 'AUTO' },
        letterSpacing: typeof node.letterSpacing !== 'symbol' ? node.letterSpacing : { value: 0, unit: 'PIXELS' }
    } : undefined;

    return {
        id: node.id,
        name: node.name,
        type: node.type,
        width: 'width' in node ? node.width : 0,
        height: 'height' in node ? node.height : 0,
        x: 'x' in node ? node.x : 0,
        y: 'y' in node ? node.y : 0,
        devMode,
        text: textData,
        children: 'children' in node ? node.children.map(c => c.id) : []
    };
}

/**
 * Extrai configurações de Auto Layout de um node
 */
function extractAutoLayout(node: SceneNode): DevModeData['autoLayout'] {
    if (!('layoutMode' in node) || node.layoutMode === 'NONE') {
        return undefined;
    }

    return {
        direction: node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
        gap: node.itemSpacing || 0,
        padding: {
            top: node.paddingTop || 0,
            right: node.paddingRight || 0,
            bottom: node.paddingBottom || 0,
            left: node.paddingLeft || 0
        },
        alignment: node.primaryAxisAlignItems || undefined,
        distribution: node.counterAxisAlignItems || undefined
    };
}

/**
 * Gera CSS baseado nas propriedades do node (similar ao Dev Mode do Figma)
 */
export function generateCSS(node: SceneNode): string {
    const css: string[] = [];

    // Auto Layout
    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
        css.push('display: flex');
        css.push(`flex-direction: ${node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'}`);

        if (node.primaryAxisAlignItems) {
            css.push(`justify-content: ${mapAlignment(node.primaryAxisAlignItems)}`);
        }
        if (node.counterAxisAlignItems) {
            css.push(`align-items: ${mapAlignment(node.counterAxisAlignItems)}`);
        }
        if (node.itemSpacing) {
            css.push(`gap: ${node.itemSpacing}px`);
        }
        if (node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft) {
            css.push(`padding: ${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`);
        }
    }

    // Background
    if ('fills' in node && typeof node.fills !== 'symbol' && Array.isArray(node.fills) && node.fills.length > 0) {
        const fill = node.fills[0];
        if (fill.type === 'SOLID' && fill.visible !== false) {
            const color = rgbToHex(fill.color);
            const opacity = fill.opacity !== undefined ? fill.opacity : 1;
            if (opacity < 1) {
                css.push(`background: ${rgbaToString(fill.color, opacity)}`);
            } else {
                css.push(`background: ${color}`);
            }
        }
    }

    // Border Radius
    if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
        css.push(`border-radius: ${node.cornerRadius}px`);
    }

    // Dimensions
    if ('width' in node && 'height' in node) {
        css.push(`width: ${Math.round(node.width)}px`);
        css.push(`height: ${Math.round(node.height)}px`);
    }

    return css.join('; ') + ';';
}

/**
 * Mapeia alinhamento do Figma para CSS
 */
function mapAlignment(alignment: string): string {
    const map: Record<string, string> = {
        'MIN': 'flex-start',
        'CENTER': 'center',
        'MAX': 'flex-end',
        'SPACE_BETWEEN': 'space-between'
    };
    return map[alignment] || alignment.toLowerCase();
}

/**
 * Converte RGB para HEX
 */
function rgbToHex(color: RGB): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Converte RGBA para string CSS
 */
function rgbaToString(color: RGB, opacity: number): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
