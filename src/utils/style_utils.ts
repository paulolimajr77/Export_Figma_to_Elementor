import { SerializedNode, rgbToHex } from './serialization_utils';

export function buildHtmlFromSegments(node: SerializedNode): { html: string, css: string } {
    if (!node.styledTextSegments || node.styledTextSegments.length === 0) return { html: node.characters || '', css: '' };

    const cssRules: Set<string> = new Set();

    // Base styles from the node itself
    const baseFontSize = node.fontSize;
    const baseFontWeight = node.fontWeight;
    const baseTextDecoration = node.textDecoration;

    let baseColorHex = '';
    if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
        const solid = node.fills.find((f: any) => f.type === 'SOLID');
        if (solid && solid.color) {
            baseColorHex = rgbToHex(solid.color).replace('#', '').toLowerCase();
        }
    }

    const html = node.styledTextSegments.map(seg => {
        const classes: string[] = [];
        let inlineStyle = '';

        // 1. Color Diff
        let segColorHex = '';
        let segColorObj: any = null;
        if (seg.fills && Array.isArray(seg.fills) && seg.fills.length > 0) {
            const solid = seg.fills.find(f => f.type === 'SOLID');
            if (solid && solid.color) {
                segColorObj = solid;
                segColorHex = rgbToHex(solid.color).replace('#', '').toLowerCase();
            }
        }

        // Only apply color class if it differs from the base color
        if (segColorHex && segColorHex !== baseColorHex) {
            const { r, g, b } = segColorObj.color;
            const a = segColorObj.opacity !== undefined ? segColorObj.opacity : 1;
            const className = `color-${segColorHex}`;

            classes.push(className);
            cssRules.add(`.${className} { color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}); }`);
        }

        // 2. Font Size Diff
        if (seg.fontSize && seg.fontSize !== baseFontSize) {
            inlineStyle += `font-size: ${seg.fontSize}px;`;
        }

        // 3. Font Weight Diff
        if (seg.fontWeight && seg.fontWeight !== baseFontWeight) {
            inlineStyle += `font-weight: ${seg.fontWeight};`;
        }

        // 4. Decoration Diff
        if (seg.textDecoration !== baseTextDecoration) {
            if (seg.textDecoration === 'UNDERLINE') inlineStyle += 'text-decoration: underline;';
            if (seg.textDecoration === 'STRIKETHROUGH') inlineStyle += 'text-decoration: line-through;';
        }

        // If no diff, return plain text
        if (classes.length === 0 && !inlineStyle) {
            return seg.characters;
        }

        const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
        const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

        return `<span${classAttr}${styleAttr}>${seg.characters}</span>`;
    }).join('').replace(/\n/g, '<br>');

    return { html, css: Array.from(cssRules).join('\n') };
}

export function extractWidgetStyles(node: SerializedNode): Record<string, any> {
    const styles: Record<string, any> = {
        sourceId: node.id,
        sourceName: node.name
    };

    // Typography
    if (node.fontSize) styles.fontSize = node.fontSize;
    if (node.fontName) styles.fontName = node.fontName;
    if (node.fontWeight) styles.fontWeight = node.fontWeight;
    if (node.textDecoration) styles.textDecoration = node.textDecoration;
    if (node.textCase) styles.textCase = node.textCase;
    if (node.lineHeight) styles.lineHeight = node.lineHeight;
    if (node.letterSpacing) styles.letterSpacing = node.letterSpacing;

    // Alignment
    if (node.textAlignHorizontal) {
        const map: Record<string, string> = { LEFT: 'left', CENTER: 'center', RIGHT: 'right', JUSTIFIED: 'justify' };
        styles.align = map[node.textAlignHorizontal] || 'left';
    }

    // Color
    if (node.fills && Array.isArray(node.fills)) {
        const solid = node.fills.find((f: any) => f.type === 'SOLID');
        if (solid && solid.color) {
            styles.color = solid.color;
        }
    }

    // Rich Text Custom CSS
    if (node.styledTextSegments && node.styledTextSegments.length > 1) {
        const rich = buildHtmlFromSegments(node);
        styles.customCss = rich.css;
        // Note: Content needs to be handled by the caller as it replaces the widget content
    }

    return styles;
}

export function extractContainerStyles(node: SerializedNode): Record<string, any> {
    const styles: Record<string, any> = {
        sourceId: node.id,
        sourceName: node.name
    };

    // Layout
    if (typeof node.itemSpacing === 'number') styles.gap = node.itemSpacing;

    if (typeof (node as any).height === 'number') {
        styles.minHeight = (node as any).height;
    }

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

    // Background
    const fills = node.fills;
    if (Array.isArray(fills) && fills.length > 0) {
        const solid = fills.find((f: any) => f.type === 'SOLID' && f.color);
        if (solid) {
            const { r, g, b } = solid.color;
            const a = solid.opacity !== undefined ? solid.opacity : 1;
            styles.background = { color: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})` };
        }
    }

    // Borders
    if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
        const stroke = node.strokes.find((s: any) => s.type === 'SOLID' && s.visible !== false);
        if (stroke) {
            const { r, g, b } = stroke.color;
            const a = stroke.opacity !== undefined ? stroke.opacity : 1;
            styles.border = {
                type: 'solid',
                width: node.strokeWeight,
                color: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`,
                radius: typeof node.cornerRadius === 'number' ? node.cornerRadius : 0
            };
        }
    } else if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
        styles.border = { radius: node.cornerRadius };
    }

    // Alignment (Flex)
    const justifyMap: Record<string, string> = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between' };
    const alignMap: Record<string, string> = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', STRETCH: 'stretch' };

    if (node.primaryAxisAlignItems) styles.justify_content = justifyMap[node.primaryAxisAlignItems] || undefined;
    if (node.counterAxisAlignItems) styles.align_items = alignMap[node.counterAxisAlignItems] || undefined;

    return styles;
}
