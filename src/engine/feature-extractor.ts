import { NodeFeatures, PageZone } from './types';
import { detectZone } from './zone-detector';

/**
 * Extrai NodeFeatures a partir de um SceneNode do Figma.
 *
 * NOTA:
 * - Este módulo assume que está rodando no ambiente de plugin do Figma
 *   onde os tipos SceneNode / FrameNode estão disponíveis via @figma/plugin-typings.
 * - Não utiliza optional chaining para manter compatibilidade com target ES2017.
 */

export function extractNodeFeatures(
    node: SceneNode,
    rootFrame: FrameNode | null
): NodeFeatures {
    var baseWidth = 0;
    var baseHeight = 0;
    var x = 0;
    var y = 0;
    var childCount = 0;
    var layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' = 'NONE';
    var primaryAxisSizingMode: 'FIXED' | 'AUTO' | undefined;
    var counterAxisSizingMode: 'FIXED' | 'AUTO' | undefined;
    var hasNestedFrames = false;

    if ('width' in node && typeof node.width === 'number') {
        baseWidth = node.width;
    }

    if ('height' in node && typeof node.height === 'number') {
        baseHeight = node.height;
    }

    if ('x' in node && typeof (node as any).x === 'number') {
        x = (node as any).x;
    }

    if ('y' in node && typeof (node as any).y === 'number') {
        y = (node as any).y;
    }

    // Layout / Children
    if ('children' in node && Array.isArray((node as any).children)) {
        var children = (node as any).children as readonly SceneNode[];
        childCount = children.length;

        // Check for nested frames/groups
        for (var n = 0; n < children.length; n++) {
            var ch = children[n];
            if (ch.type === 'FRAME' || ch.type === 'GROUP' || ch.type === 'COMPONENT' || ch.type === 'INSTANCE') {
                hasNestedFrames = true;
                break;
            }
        }

        if ('layoutMode' in node) {
            var lm = (node as any).layoutMode;
            if (lm === 'HORIZONTAL' || lm === 'VERTICAL' || lm === 'NONE') {
                layoutMode = lm;
            }
        }

        if ('primaryAxisSizingMode' in node) {
            var p = (node as any).primaryAxisSizingMode;
            if (p === 'FIXED' || p === 'AUTO') {
                primaryAxisSizingMode = p;
            }
        }

        if ('counterAxisSizingMode' in node) {
            var c = (node as any).counterAxisSizingMode;
            if (c === 'FIXED' || c === 'AUTO') {
                counterAxisSizingMode = c;
            }
        }
    }

    // Aparência
    var hasFill = false;
    var hasStroke = false;
    var hasText = false;
    var textCount = 0;
    var hasImage = false;
    var imageCount = 0;

    // Tipografia
    var textLength = 0;
    var fontSize = 0;
    var fontWeight = 400;

    // Se o próprio node é TEXT, extrai tipografia
    if (node.type === 'TEXT') {
        hasText = true;
        textCount = 1;
        var textNode = node as TextNode;
        var chars = textNode.characters;
        textLength = chars ? chars.length : 0;

        if ('fontSize' in textNode && typeof textNode.fontSize === 'number') {
            fontSize = textNode.fontSize;
        }

        if ('fontWeight' in textNode && typeof (textNode as any).fontWeight === 'number') {
            fontWeight = (textNode as any).fontWeight;
        } else if ('fontName' in textNode) {
            var fn = (textNode as any).fontName;
            if (fn && fn.style) {
                var style = fn.style.toLowerCase();
                if (style.indexOf('bold') >= 0) {
                    fontWeight = 700;
                } else if (style.indexOf('semibold') >= 0 || style.indexOf('semi') >= 0) {
                    fontWeight = 600;
                } else if (style.indexOf('medium') >= 0) {
                    fontWeight = 500;
                } else if (style.indexOf('light') >= 0) {
                    fontWeight = 300;
                }
            }
        }
    }

    // Detecta fills/strokes básicos no próprio node
    if ('fills' in node) {
        var fills = (node as any).fills;
        if (Array.isArray(fills)) {
            for (var i = 0; i < fills.length; i++) {
                var fill = fills[i];
                if (fill && fill.type === 'SOLID') {
                    hasFill = true;
                }
                if (fill && fill.type === 'IMAGE') {
                    hasImage = true;
                    imageCount++;
                }
            }
        }
    }

    if ('strokes' in node) {
        var strokes = (node as any).strokes;
        if (Array.isArray(strokes) && strokes.length > 0) {
            hasStroke = true;
        }
    }

    // Varre filhos diretos para contar textos / imagens adicionais e extrair tipografia
    var maxFontSize = fontSize;
    var maxFontWeight = fontWeight;

    if ('children' in node && Array.isArray((node as any).children)) {
        var _children = (node as any).children as readonly SceneNode[];

        for (var j = 0; j < _children.length; j++) {
            var child = _children[j];

            if (child.type === 'TEXT') {
                hasText = true;
                textCount++;
                var childText = child as TextNode;
                textLength += childText.characters ? childText.characters.length : 0;

                // Track max font size/weight from children
                if ('fontSize' in childText && typeof childText.fontSize === 'number') {
                    if (childText.fontSize > maxFontSize) {
                        maxFontSize = childText.fontSize;
                    }
                }
                if ('fontName' in childText) {
                    var cfn = (childText as any).fontName;
                    if (cfn && cfn.style) {
                        var cstyle = cfn.style.toLowerCase();
                        var cw = 400;
                        if (cstyle.indexOf('bold') >= 0) {
                            cw = 700;
                        } else if (cstyle.indexOf('semibold') >= 0 || cstyle.indexOf('semi') >= 0) {
                            cw = 600;
                        } else if (cstyle.indexOf('medium') >= 0) {
                            cw = 500;
                        }
                        if (cw > maxFontWeight) {
                            maxFontWeight = cw;
                        }
                    }
                }
            }

            if ('fills' in child) {
                var childFills = (child as any).fills;
                if (Array.isArray(childFills)) {
                    for (var k = 0; k < childFills.length; k++) {
                        var cf = childFills[k];
                        if (cf && cf.type === 'IMAGE') {
                            hasImage = true;
                            imageCount++;
                        }
                    }
                }
            }
        }
    }

    // Use max font values from self or children
    if (maxFontSize > fontSize) {
        fontSize = maxFontSize;
    }
    if (maxFontWeight > fontWeight) {
        fontWeight = maxFontWeight;
    }

    var aspectRatio = 0;
    if (baseHeight > 0) {
        aspectRatio = baseWidth / baseHeight;
    }

    var area = baseWidth * baseHeight;

    var rootHeight: number | null = null;
    if (rootFrame && 'height' in rootFrame) {
        rootHeight = (rootFrame as any).height;
    }

    var zone: PageZone = detectZone(y, rootHeight);

    // Vector/Icon detection
    var vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];
    var isVectorNode = vectorTypes.indexOf(node.type) >= 0;
    var vectorWidth = isVectorNode ? baseWidth : 0;
    var vectorHeight = isVectorNode ? baseHeight : 0;

    // Parent layout context
    var parentLayoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' = 'NONE';
    var siblingCount = 0;
    if (node.parent && 'layoutMode' in node.parent) {
        var pm = (node.parent as any).layoutMode;
        if (pm === 'HORIZONTAL' || pm === 'VERTICAL') {
            parentLayoutMode = pm;
        }
        if ('children' in node.parent && Array.isArray((node.parent as any).children)) {
            siblingCount = (node.parent as any).children.length;
        }
    }

    var features: NodeFeatures = {
        id: node.id,
        name: node.name,
        type: node.type,
        width: baseWidth,
        height: baseHeight,
        x: x,
        y: y,
        area: area,
        childCount: childCount,
        layoutMode: layoutMode,
        primaryAxisSizingMode: primaryAxisSizingMode,
        counterAxisSizingMode: counterAxisSizingMode,
        hasNestedFrames: hasNestedFrames,
        hasFill: hasFill,
        hasStroke: hasStroke,
        hasText: hasText,
        textCount: textCount,
        hasImage: hasImage,
        imageCount: imageCount,
        textLength: textLength,
        fontSize: fontSize,
        fontWeight: fontWeight,
        isVectorNode: isVectorNode,
        vectorWidth: vectorWidth,
        vectorHeight: vectorHeight,
        parentLayoutMode: parentLayoutMode,
        siblingCount: siblingCount,
        aspectRatio: aspectRatio,
        zone: zone
    };

    return features;
}

