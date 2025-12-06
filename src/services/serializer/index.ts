import { rgbToHex } from '../../utils/image_utils';

function getFontWeight(style: string): number {
    style = (style || '').toLowerCase();
    if (style.includes('thin')) return 100;
    if (style.includes('extra light') || style.includes('extralight')) return 200;
    if (style.includes('light')) return 300;
    if (style.includes('medium')) return 500;
    if (style.includes('semi bold') || style.includes('semibold')) return 600;
    if (style.includes('bold')) return 700;
    if (style.includes('extra bold') || style.includes('extrabold')) return 800;
    if (style.includes('black') || style.includes('heavy')) return 900;
    return 400;
}

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
    [key: string]: any;
    styledTextSegments?: Array<{
        characters: string;
        start: number;
        end: number;
        fontSize: number;
        fontName: FontName;
        fontWeight: number;
        textDecoration: TextDecoration;
        textCase: TextCase;
        lineHeight: LineHeight;
        letterSpacing: LetterSpacing;
        fills: Paint[];
        fillStyleId: string | typeof figma.mixed;
    }>;
}

export interface SerializerSnapshot {
    root: SerializedNode;
    flatNodes: SerializedNode[];
}

export interface SerializerService {
    serialize(node: SceneNode, parentId?: string): SerializedNode;
    flatten(root: SerializedNode): SerializedNode[];
    createSnapshot(node: SceneNode): SerializerSnapshot;
}

export class DefaultSerializerService implements SerializerService {
    serialize(node: SceneNode, parentId?: string): SerializedNode {
        return serializeNodeInternal(node, parentId);
    }

    flatten(root: SerializedNode): SerializedNode[] {
        const acc: SerializedNode[] = [];
        const stack: SerializedNode[] = [root];
        while (stack.length > 0) {
            const current = stack.pop()!;
            acc.push(current);
            if (Array.isArray(current.children)) {
                for (let i = current.children.length - 1; i >= 0; i--) {
                    stack.push(current.children[i]);
                }
            }
        }
        return acc;
    }

    createSnapshot(node: SceneNode): SerializerSnapshot {
        const root = this.serialize(node);
        const flatNodes = this.flatten(root);
        return { root, flatNodes };
    }
}

export const serializerService = new DefaultSerializerService();

function serializeNodeInternal(node: SceneNode, parentId?: string): SerializedNode {
    const data: SerializedNode = {
        id: node.id,
        name: node.name,
        type: node.locked ? 'IMAGE' : node.type,
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        visible: node.visible,
        locked: node.locked,
        parentId: parentId || null
    };

    if (node.locked) {
        (data as any).isLockedImage = true;
        if ('children' in node) {
            data.children = [];
        }
        return data;
    }

    if ('opacity' in node) data.opacity = (node as any).opacity;
    if ('blendMode' in node) data.blendMode = (node as any).blendMode;

    if ('fills' in node && (node as any).fills !== figma.mixed) {
        data.fills = (node as any).fills.map((fill: any) => {
            if (fill.type === 'SOLID') {
                return { type: 'SOLID', color: fill.color, opacity: fill.opacity, visible: fill.visible };
            }
            if (fill.type === 'IMAGE') {
                return { type: 'IMAGE', visible: fill.visible, imageHash: fill.imageHash, scaleMode: fill.scaleMode };
            }
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

    if ('constraints' in node) {
        data.constraints = (node as any).constraints;
    }

    if (node.type === 'TEXT') {
        data.characters = (node as any).characters;
        data.fontSize = (node as any).fontSize !== figma.mixed ? (node as any).fontSize : undefined;
        data.fontName = (node as any).fontName !== figma.mixed ? (node as any).fontName : undefined;
        data.fontWeight = (node as any).fontName !== figma.mixed ? getFontWeight((node as any).fontName?.style) : 400;
        data.textAlignHorizontal = (node as any).textAlignHorizontal;
        data.textAlignVertical = (node as any).textAlignVertical;
        data.textAutoResize = (node as any).textAutoResize;
        data.letterSpacing = (node as any).letterSpacing !== figma.mixed ? (node as any).letterSpacing : undefined;
        data.lineHeight = (node as any).lineHeight !== figma.mixed ? (node as any).lineHeight : undefined;
        data.textCase = (node as any).textCase !== figma.mixed ? (node as any).textCase : undefined;
        data.textDecoration = (node as any).textDecoration !== figma.mixed ? (node as any).textDecoration : undefined;

        if ((node as any).fills !== figma.mixed && (node as any).fills.length > 0 && (node as any).fills[0].type === 'SOLID') {
            data.color = ((node as any).fills[0] as SolidPaint).color;
        }

        if (typeof (node as any).getStyledTextSegments === 'function') {
            try {
                data.styledTextSegments = (node as any).getStyledTextSegments(['fontSize', 'fontName', 'fontWeight', 'textDecoration', 'textCase', 'lineHeight', 'letterSpacing', 'fills', 'fillStyleId']);
            } catch (e) {
                console.warn('Error getting styled text segments', e);
            }
        }
    }

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

    if ('children' in node) {
        if (node.locked) {
            data.children = [];
        } else {
            data.children = node.children.map(child => serializeNodeInternal(child, node.id));
        }
    }

    return data;
}
