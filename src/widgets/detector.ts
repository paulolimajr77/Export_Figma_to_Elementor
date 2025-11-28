import type { GeometryNode } from '../types/elementor.types';

export function hasImageFill(node: GeometryNode): boolean {
    return 'fills' in node && Array.isArray(node.fills) && node.fills.some(p => p.type === 'IMAGE');
}

export function detectWidgetType(node: SceneNode): 'heading' | 'text' | 'button' | 'image' | 'icon' | 'custom' {
    const lname = node.name.toLowerCase();

    if (node.type === 'TEXT') {
        return (lname.includes('heading') || lname.includes('title')) ? 'heading' : 'text';
    }

    if (node.type === 'RECTANGLE' && hasImageFill(node as GeometryNode)) return 'image';
    if ((node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') && hasImageFill(node as GeometryNode)) return 'image';

    const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];
    if (vectorTypes.includes(node.type)) return 'icon';

    if (lname.includes('button') || lname.includes('btn')) return 'button';

    return 'custom';
}

export function suggestWidgetKind(node: SceneNode): string | undefined {
    if (!(node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'INSTANCE')) return undefined;
    if (!('children' in node)) return undefined;

    const children = node.children;
    const childTypes = children.map(c => c.type);
    const hasText = childTypes.includes('TEXT');
    const hasImage = children.some(c => hasImageFill(c as GeometryNode));
    const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION'];
    const hasIcon = children.some(c => vectorTypes.includes(c.type));

    if (hasImage && hasText) return 'image_box_like';
    if (hasIcon && hasText) return 'icon_box_like';
    if (hasIcon && !hasText && children.length > 1) return 'icon_list_like';

    if (children.length >= 4 && children.every(c => hasImageFill(c as GeometryNode))) return 'gallery_like';
    if (children.length >= 3 && children.every(c => c.type === children[0].type)) return 'loop_like';

    return undefined;
}
