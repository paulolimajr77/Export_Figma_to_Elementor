import { SerializedNode, rgbToHex } from './serialization_utils';
import { normalizeColor } from './style_normalizer';

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

    // Dimensions (for images, icons, etc.)
    if (typeof node.width === 'number') {
        styles.width = node.width;
    }
    if (typeof node.height === 'number') {
        styles.height = node.height;
    }

    // Color & Gradients
    if (node.fills && Array.isArray(node.fills)) {
        // Check for gradient fills first
        const gradient = node.fills.find((f: any) =>
            f.type === 'GRADIENT_RADIAL' ||
            f.type === 'GRADIENT_LINEAR'
        );

        if (gradient && gradient.gradientStops) {
            // Generate CSS for gradient text
            const stops = gradient.gradientStops.map((stop: any) => {
                const r = Math.round((stop.color.r || 0) * 255);
                const g = Math.round((stop.color.g || 0) * 255);
                const b = Math.round((stop.color.b || 0) * 255);
                const toHex = (n: number) => {
                    const hex = n.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };
                const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
                const pos = Math.round((stop.position || 0) * 100);
                return `${hex} ${pos}%`;
            }).join(', ');

            const gradType = gradient.type === 'GRADIENT_RADIAL' ? 'radial-gradient' : 'linear-gradient';
            const gradParams = gradient.type === 'GRADIENT_RADIAL' ? 'circle at center' : '180deg';

            styles.customCss = `selector {
    background: ${gradType}(${gradParams}, ${stops});
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}`;
            console.log('[GRADIENT TEXT] Generated CSS for', gradient.type);
        } else {
            // Fallback to solid color
            const solid = node.fills.find((f: any) => f.type === 'SOLID');
            if (solid && solid.color) {
                styles.color = normalizeColor(solid.color);
            }
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

    // DEBUG: Log raw values from node
    console.log('[EXTRACT STYLES]', node.name, {
        itemSpacing: node.itemSpacing,
        paddingTop: node.paddingTop,
        paddingRight: node.paddingRight,
        paddingBottom: node.paddingBottom,
        paddingLeft: node.paddingLeft
    });

    // Layout - only set gap if itemSpacing is a reasonable value (not auto/placeholder)
    // Figma uses high values or undefined for "auto" spacing
    // Typical real gap values are 0-64px, so we use 100 as max
    if (typeof node.itemSpacing === 'number' && node.itemSpacing >= 0 && node.itemSpacing < 100) {
        styles.gap = node.itemSpacing;
    }

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

    // Background (solid or gradient)
    const fills = node.fills;
    if (Array.isArray(fills) && fills.length > 0) {
        const visibleFills = fills.filter((f: any) => f.visible !== false);
        if (visibleFills.length > 0) {
            // Use the top-most visible fill
            const fill = visibleFills[visibleFills.length - 1];

            if (fill.type === 'SOLID' && fill.color) {
                const { r, g, b } = fill.color;
                const a = fill.opacity !== undefined ? fill.opacity : 1;
                styles.background = {
                    type: 'solid',
                    color: `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
                };
            } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL' ||
                fill.type === 'GRADIENT_ANGULAR' || fill.type === 'GRADIENT_DIAMOND') {
                // Extract gradient stops
                const stops = (fill.gradientStops || []).map((stop: any) => {
                    const c = stop.color || { r: 0, g: 0, b: 0, a: 1 };
                    return {
                        position: Math.round(stop.position * 100),
                        color: `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a || 1})`
                    };
                });
                styles.background = {
                    type: 'gradient',
                    gradientType: fill.type === 'GRADIENT_RADIAL' ? 'radial' : 'linear',
                    stops: stops
                };
            } else if (fill.type === 'IMAGE') {
                styles.background = {
                    type: 'image',
                    imageHash: fill.imageHash || null
                };
            }
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
