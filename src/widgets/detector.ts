import type { GeometryNode } from '../types/elementor.types';

export function hasImageFill(node: GeometryNode): boolean {
    return 'fills' in node && Array.isArray(node.fills) && node.fills.some(p => p.type === 'IMAGE');
}

export type BasicDetect =
    | 'heading'
    | 'text'
    | 'button'
    | 'image'
    | 'icon'
    | 'icon-list'
    | 'gallery'
    | 'tabs'
    | 'accordion'
    | 'toggle'
    | 'video'
    | 'html'
    | 'custom';

export function detectWidgetType(node: SceneNode): BasicDetect {
    const lname = node.name.toLowerCase();

    if (node.type === 'TEXT') {
        if (lname.includes('tab')) return 'tabs';
        if (lname.includes('accordion')) return 'accordion';
        if (lname.includes('toggle')) return 'toggle';
        return (lname.includes('heading') || lname.includes('title')) ? 'heading' : 'text';
    }

    if (node.type === 'RECTANGLE' && hasImageFill(node as GeometryNode)) return 'image';
    if ((node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') && hasImageFill(node as GeometryNode)) return 'image';

    const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];
    if (vectorTypes.includes(node.type)) return 'icon';

    if (lname.includes('button') || lname.includes('btn')) return 'button';
    if (lname.includes('icon-list') || lname.includes('icon list')) return 'icon-list';
    if (lname.includes('gallery') || lname.includes('carousel')) return 'gallery';
    if (lname.includes('video')) return 'video';
    if (lname.includes('html') || lname.includes('code')) return 'html';

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

    if (children.length >= 3 && children.every(c => hasImageFill(c as GeometryNode))) return 'gallery_like';
    if (children.length >= 3 && children.every(c => c.type === children[0].type)) return 'loop_like';
    if (children.length >= 2 && hasText && children.some(c => hasImageFill(c as GeometryNode))) return 'image_box_like';

    return undefined;
}
