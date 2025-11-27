import type { GeometryNode } from '../types/elementor.types';

/**
 * Type guards
 */
function hasFills(node: SceneNode): node is GeometryNode {
    return 'fills' in node;
}

function isArray(value: any): value is ReadonlyArray<any> {
    return Array.isArray(value);
}

/**
 * Detecta se um nó é um ícone baseado em suas características
 * @param node Nó do Figma
 * @returns true se o nó parece ser um ícone
 */
export function isIconNode(node: SceneNode): boolean {
    const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];
    const isVector = vectorTypes.includes(node.type);
    const isSmallFrame = (node.type === 'FRAME' || node.type === 'INSTANCE') &&
        (node as any).width <= 50 &&
        (node as any).height <= 50;
    const name = node.name.toLowerCase();

    return isVector || isSmallFrame || name.includes('icon') || name.includes('vector');
}

/**
 * Verifica se um nó tem fill de imagem
 * @param node Nó do Figma
 * @returns true se tem fill de imagem
 */
export function hasImageFill(node: GeometryNode): boolean {
    return hasFills(node) && isArray(node.fills) && node.fills.some(p => p.type === 'IMAGE');
}

/**
 * Detecta se um nó é uma imagem
 * @param node Nó do Figma
 * @returns true se o nó é uma imagem
 */
export function isImageNode(node: SceneNode): boolean {
    // Retângulo com fill de imagem
    if (node.type === 'RECTANGLE') {
        return hasImageFill(node as GeometryNode);
    }

    // Frame/Instance com fill de imagem
    if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') {
        const g = node as any;
        if (hasFills(g) && isArray(g.fills) && g.fills.some((f: any) => f.type === 'IMAGE')) {
            return true;
        }
    }

    // Nome contém palavras relacionadas a imagem
    const lname = node.name.toLowerCase();
    return lname.includes('image') || lname.includes('img') || lname.includes('foto');
}

/**
 * Detecta o tipo de widget baseado nas características do nó
 * @param node Nó do Figma
 * @returns Tipo do widget ou null se não detectado
 */
export function detectWidgetType(node: SceneNode): string | null {
    const lname = node.name.toLowerCase();

    // Detecção por nome explícito
    if (lname.includes('button') || lname.includes('btn')) return 'button';
    if (lname.includes('image-box') || lname.includes('card')) return 'image-box';
    if (lname.includes('icon-box')) return 'icon-box';

    // Texto deve ser verificado PRIMEIRO para evitar confusão com ícones
    if (node.type === 'TEXT') {
        if (lname.includes('heading') || lname.includes('title')) return 'heading';
        return 'text-editor';
    }

    // Imagens e ícones (verificação robusta)
    if (isImageNode(node)) return 'image';
    if (isIconNode(node)) return 'icon';

    // Divider (Linha ou Retângulo fino)
    if (node.type === 'LINE') return 'divider';
    if (node.type === 'RECTANGLE') {
        const height = node.height;
        const width = node.width;
        // Se for muito fino (horizontal ou vertical), é um divider
        if (height <= 5 || width <= 5) return 'divider';

        // Se não for imagem e não for fino, assume Spacer (se não tiver children, o que Rectangle não tem)
        return 'spacer';
    }

    // Container/Frame
    if ('layoutMode' in node || node.type === 'GROUP') return 'container';

    // Fallback para vetores não identificados como ícones (mas que são vetores)
    if (['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION'].includes(node.type)) {
        return 'icon';
    }

    return null;
}

/**
 * Detecta o tipo de widget baseado em prefixo explícito
 * @param name Nome do nó
 * @returns Slug do widget ou null
 */
export function detectWidgetFromPrefix(name: string): string | null {
    const prefixMatch = name.match(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i);
    if (!prefixMatch) return null;

    const prefix = prefixMatch[0].toLowerCase();
    let slug = name.substring(prefix.length).trim().toLowerCase().split(' ')[0];

    // Transformações especiais
    if (prefix === 'woo:') slug = `woocommerce-${slug}`;
    if (prefix === 'loop:') slug = `loop-${slug}`;
    if (prefix === 'slider:') slug = 'slides';

    return slug;
}
