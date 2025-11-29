import type { SerializedNode } from '../utils/serialization_utils';
import type { PipelineSchema, PipelineContainer, PipelineWidget } from '../types/pipeline.schema';

type MaybeWidget = PipelineWidget | null;

const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE'];

function isImageFill(node: any): boolean {
    const fills = node?.fills;
    if (!Array.isArray(fills)) return false;
    return fills.some((f: any) => f?.type === 'IMAGE');
}

function findFirstImageId(node: any): string | null {
    if (!node) return null;
    if (isImageFill(node)) return node.id || null;
    const children = (node as any).children;
    if (Array.isArray(children)) {
        for (const child of children) {
            const found = findFirstImageId(child);
            if (found) return found;
        }
    }
    return null;
}

function hasTextDeep(node: any): boolean {
    if (!node) return false;
    if (node.type === 'TEXT') return true;
    const children = (node as any).children;
    if (Array.isArray(children)) {
        return children.some((c: any) => hasTextDeep(c));
    }
    return false;
}

function isSolidColor(node: any): string | undefined {
    const fills = node?.fills;
    if (!Array.isArray(fills) || fills.length === 0) return undefined;
    const solid = fills.find((f: any) => f.type === 'SOLID' && f.color);
    if (!solid) return undefined;
    const { r, g, b, a = 1 } = solid.color || {};
    const to255 = (v: number) => Math.round((v || 0) * 255);
    return `rgba(${to255(r)}, ${to255(g)}, ${to255(b)}, ${a})`;
}

function detectWidget(node: SerializedNode): MaybeWidget {
    const name = (node.name || '').toLowerCase();
    const styles: Record<string, any> = {
        sourceId: node.id,
        sourceName: node.name
    };

    const hasChildren = Array.isArray((node as any).children) && (node as any).children.length > 0;
    const children = hasChildren ? ((node as any).children as SerializedNode[]) : [];
    const firstImageDeep = findFirstImageId(node);

    // Agrupamentos primeiro (image-box, icon-box, galerias, listas de ícones)
    if (hasChildren) {
        const childHasImage = children.some(c => isImageFill(c) || findFirstImageId(c));
        const childHasText = children.some(c => hasTextDeep(c));
        const childHasIcon = children.some(c => vectorTypes.includes(c.type));
        const allImages = children.length > 0 && children.every(c => isImageFill(c) || (Array.isArray((c as any).children) && (c as any).children.every((gr: any) => isImageFill(gr))));

        const firstImage = children.find(isImageFill) ||
            (children.find(c => findFirstImageId(c)) as any);
        const firstImageId = findFirstImageId(firstImage) || firstImageDeep;

        const looksImageBox = name.includes('image') || name.includes('photo') || name.includes('box') || children.length <= 3;
        const looksIconBox = name.includes('icon') || name.includes('box') || children.length <= 3;
        if (childHasImage && childHasText && looksImageBox) {
            const txt = children.find(c => c.type === 'TEXT') as any;
            return {
                type: 'image_box',
                content: txt?.characters || node.name,
                imageId: firstImageId || null,
                styles
            };
        }

        if (childHasIcon && childHasText && (children.length >= 3 || name.includes('list'))) {
            return { type: 'icon_list', content: node.name, imageId: null, styles };
        }

        if (childHasIcon && childHasText && looksIconBox) {
            const txt = children.find(c => c.type === 'TEXT') as any;
            return {
                type: 'icon_box',
                content: txt?.characters || node.name,
                imageId: null,
                styles
            };
        }

        if (allImages) {
            if (children.length >= 3) {
                return { type: 'basic-gallery', content: node.name, imageId: null, styles };
            }
            return { type: 'image', content: null, imageId: firstImageId || node.id, styles };
        }

        if (childHasImage && !childHasText) {
            return { type: 'image', content: null, imageId: firstImageId || node.id || firstImageDeep, styles };
        }
    }

    // Text
    if (node.type === 'TEXT') {
        const isHeading = (node as any).fontSize >= 26 || name.includes('heading') || name.includes('title');
        if (name.includes('button') || name.includes('btn')) {
            return { type: 'button', content: node.characters || node.name, imageId: null, styles };
        }
        return {
            type: isHeading ? 'heading' : 'text',
            content: (node as any).characters || node.name,
            imageId: null,
            styles
        };
    }

    // Icon
    if (vectorTypes.includes(node.type)) {
        return { type: 'icon', content: node.name || 'icon', imageId: node.id, styles };
    }

    // Image
    if (isImageFill(node) || name.startsWith('w:image')) {
        const nestedImageId = findFirstImageId(node);
        return { type: 'image', content: null, imageId: nestedImageId || node.id, styles };
    }

    // Button by name
    if (name.includes('button') || name.includes('btn')) {
        return { type: 'button', content: node.name, imageId: null, styles };
    }

    // Heurísticas baseadas em filhos (image-box, icon-box, gallery, icon-list)
    if (hasChildren) {
        const children = (node as any).children as SerializedNode[];
        const onlyImages = children.length > 0 && children.every(c => isImageFill(c) || (Array.isArray((c as any).children) && (c as any).children.every(grand => isImageFill(grand as any))));
        if (onlyImages || name.startsWith('w:image')) {
            const firstImage = children.find(isImageFill) || (children[0] as any)?.children?.find((gr: any) => isImageFill(gr));
            const imageId = firstImage?.id || node.id;
            return { type: 'image', content: null, imageId, styles };
        }
        const childHasImage = children.some(isImageFill);
        const childHasText = children.some(c => c.type === 'TEXT');
        const childHasIcon = children.some(c => vectorTypes.includes(c.type));
        const allImages = children.length >= 3 && children.every(isImageFill);

        if (allImages) {
            return { type: 'basic-gallery', content: node.name, imageId: null, styles };
        }
        if (childHasIcon && childHasText && (children.length >= 3 || name.includes('list'))) {
            return { type: 'icon_list', content: node.name, imageId: null, styles };
        }
        if (childHasImage && childHasText) {
            const txt = children.find(c => c.type === 'TEXT') as any;
            const img = children.find(isImageFill);
            return {
                type: 'image_box',
                content: txt?.characters || node.name,
                imageId: img?.id || null,
                styles
            };
        }
        if (childHasIcon && childHasText) {
            const txt = children.find(c => c.type === 'TEXT') as any;
            return {
                type: 'icon_box',
                content: txt?.characters || node.name,
                imageId: null,
                styles
            };
        }
    }

    return null;
}

function mapAlignment(primary?: string, counter?: string) {
    const justifyMap: Record<string, string> = { MIN: 'start', CENTER: 'center', MAX: 'end', SPACE_BETWEEN: 'space-between' };
    const alignMap: Record<string, string> = { MIN: 'start', CENTER: 'center', MAX: 'end', STRETCH: 'stretch' };
    return {
        justify_content: justifyMap[primary || ''] || undefined,
        align_items: alignMap[counter || ''] || undefined
    };
}

function toContainer(node: SerializedNode): PipelineContainer {
    const direction = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
    const styles: Record<string, any> = {
        sourceId: node.id,
        sourceName: node.name
    };
    if (typeof node.itemSpacing === 'number') styles.gap = node.itemSpacing;
    if (
        typeof node.paddingTop === 'number' ||
        typeof node.paddingRight === 'number' ||
        typeof node.paddingBottom === 'number' ||
        typeof node.paddingLeft === 'number'
    ) {
        styles.paddingTop = node.paddingTop || 0;
        styles.paddingRight = node.paddingRight || 0;
        styles.paddingBottom = node.paddingBottom || 0;
        styles.paddingLeft = node.paddingLeft || 0;
    }
    const bg = isSolidColor(node);
    if (bg) styles.background = { color: bg };

    const align = mapAlignment((node as any).primaryAxisAlignItems, (node as any).counterAxisAlignItems);
    if (align.justify_content) styles.justify_content = align.justify_content;
    if (align.align_items) styles.align_items = align.align_items;

    const widgets: PipelineWidget[] = [];
    const childrenContainers: PipelineContainer[] = [];

    const childNodes: SerializedNode[] = Array.isArray((node as any).children) ? (node as any).children : [];

    childNodes.forEach((child, idx) => {
        const w = detectWidget(child);
        const childHasChildren = Array.isArray((child as any).children) && (child as any).children.length > 0;
        const orderMark = idx;
        if (w && !childHasChildren) {
            w.styles = { ...(w.styles || {}), _order: orderMark };
            widgets.push(w);
        } else if (w && childHasChildren && (w.type === 'image_box' || w.type === 'icon_box' || w.type === 'basic-gallery' || w.type === 'icon_list' || w.type === 'image')) {
            w.styles = { ...(w.styles || {}), _order: orderMark };
            widgets.push(w);
        } else {
            if (childHasChildren) {
                const childContainer = toContainer(child);
                childContainer.styles = { ...(childContainer.styles || {}), _order: orderMark };
                childrenContainers.push(childContainer);
            } else {
                widgets.push({
                    type: 'custom',
                    content: child.name || '',
                    imageId: null,
                    styles: { sourceId: child.id, sourceName: child.name, _order: orderMark }
                });
            }
        }
    });

    return {
        id: node.id,
        direction: direction === 'row' ? 'row' : 'column',
        width: 'full',
        styles,
        widgets,
        children: childrenContainers
    };
}

export function analyzeTreeWithHeuristics(tree: SerializedNode): SerializedNode {
    return tree;
}

export function convertToFlexSchema(analyzedTree: SerializedNode): PipelineSchema {
    const rootContainer = toContainer(analyzedTree);
    const tokens = { primaryColor: '#000000', secondaryColor: '#FFFFFF' };
    return {
        page: { title: analyzedTree.name || 'Layout importado', tokens },
        containers: [rootContainer]
    };
}
