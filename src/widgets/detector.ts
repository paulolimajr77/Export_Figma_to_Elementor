import type { GeometryNode } from '../types/elementor.types';

/**
 * Detector básico sem heurísticas visuais.
 * Usa apenas propriedades explícitas do node.
 */
export function hasImageFill(node: GeometryNode): boolean {
    return 'fills' in node && Array.isArray(node.fills) && node.fills.some(p => p.type === 'IMAGE');
}

export function detectWidgetType(node: SceneNode): 'heading' | 'text' | 'button' | 'image' | 'icon' | 'custom' {
    const lname = node.name.toLowerCase();

    // Detecção mínima por tipo
    if (node.type === 'TEXT') {
        return (lname.includes('heading') || lname.includes('title')) ? 'heading' : 'text';
    }

    // Imagens
    if (node.type === 'RECTANGLE' && hasImageFill(node as GeometryNode)) {
        return 'image';
    }
    if ((node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') && hasImageFill(node as GeometryNode)) {
        return 'image';
    }

    // Ícones (vetores simples)
    const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];
    if (vectorTypes.includes(node.type)) {
        return 'icon';
    }

    // Botão por nome explícito
    if (lname.includes('button') || lname.includes('btn')) {
        return 'button';
    }

    return 'custom';
}

/**
 * Sugestão leve de "kind" baseada em estrutura mínima.
 * Usa apenas tipos e contagem simples; fallback para undefined.
 */
export function suggestWidgetKind(node: SceneNode): string | undefined {
    if (!(node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'INSTANCE')) return undefined;
    if (!('children' in node)) return undefined;

    const children = node.children;
    const childTypes = children.map(c => c.type);
    const hasText = childTypes.includes('TEXT');
    const hasImage = children.some(c => hasImageFill(c as GeometryNode));
    const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION'];
    const hasIcon = children.some(c => vectorTypes.includes(c.type));

    // Base: image/text/icon combos
    if (hasImage && hasText) return 'image_box_like';
    if (hasIcon && hasText) return 'icon_box_like';
    if (hasIcon && !hasText && children.length > 1) return 'icon_list_like';

    // Repetição simples
    if (children.length >= 3) {
        const allSameType = children.every(c => c.type === children[0].type);
        if (allSameType && children[0].type === 'FRAME') return 'loop_like';
        if (allSameType && children[0].type === 'RECTANGLE') return 'gallery_like';
    }

    // Slides/testimonial: children frames com heading+text(+imagem)
    const framesWithText = children.filter(c => c.type === 'FRAME' && 'children' in c && c.children.some(cc => cc.type === 'TEXT'));
    const homogeneousFrames = framesWithText.length === children.length && framesWithText.length >= 2;
    if (homogeneousFrames) {
        // names like "Slide 1", "Slide 2"
        const namePattern = /^slide\s*\d+|hero\s*slide/gi;
        const namesMatch = framesWithText.every(f => namePattern.test(f.name.toLowerCase()));
        if (namesMatch || framesWithText.every(f => 'layoutMode' in f)) {
            return 'slides_like';
        }
        return 'testimonial_like';
    }

    // Tabs/accordion/toggle by names
    const lname = node.name.toLowerCase();
    if (lname.includes('tabs')) return 'tabs_like';
    if (lname.includes('accordion')) return 'accordion_like';
    if (lname.includes('toggle')) return 'toggle_like';

    // Carousel: row layout with many images
    if ('layoutMode' in node && (node as FrameNode).layoutMode === 'HORIZONTAL' && hasImage && children.length >= 4) {
        return 'carousel_like';
    }

    // Gallery: many images
    const imageChildren = children.filter(c => hasImageFill(c as GeometryNode));
    if (imageChildren.length >= 4) return 'gallery_like';

    return undefined;
}
