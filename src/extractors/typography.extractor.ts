import type { ElementorSettings } from '../types/elementor.types';

/**
 * Extrai tipografia diretamente do node de texto, sem inferências.
 */
export function extractTypography(node: TextNode): ElementorSettings {
    const settings: ElementorSettings = {};
    settings.typography_typography = 'custom';

    if (node.fontSize !== figma.mixed) {
        settings.typography_font_size = { unit: 'px', size: Math.round(node.fontSize) };
    }

    if (node.fontName !== figma.mixed) {
        settings.typography_font_family = node.fontName.family;
        settings.typography_font_weight = node.fontName.style;
        const style = node.fontName.style.toLowerCase();
        if (style.includes('italic')) settings.typography_font_style = 'italic';
    }

    if (node.lineHeight !== figma.mixed && node.lineHeight.unit !== 'AUTO') {
        if (node.lineHeight.unit === 'PIXELS') {
            settings.typography_line_height = { unit: 'px', size: Math.round(node.lineHeight.value) };
        } else if (node.lineHeight.unit === 'PERCENT') {
            settings.typography_line_height = { unit: 'em', size: Number((node.lineHeight.value / 100).toFixed(2)) };
        }
    }

    if (node.letterSpacing !== figma.mixed && node.letterSpacing.value !== 0) {
        settings.typography_letter_spacing = { unit: 'px', size: node.letterSpacing.value };
    }

    if (node.textAlignHorizontal) {
        const map: Record<string, string> = {
            LEFT: 'left',
            CENTER: 'center',
            RIGHT: 'right',
            JUSTIFIED: 'justify'
        };
        const key = node.textAlignHorizontal as string;
        if (map[key]) settings.align = map[key];
    }

    if (node.textDecoration === 'UNDERLINE') {
        settings.typography_text_decoration = 'underline';
    }

    if (node.textCase === 'UPPER') {
        settings.typography_text_transform = 'uppercase';
    }

    return settings;
}

/**
 * Extrai a cor do texto (primeiro fill sólido visível).
 */
export function extractTextColor(node: TextNode): string {
    if (!('fills' in node) || !Array.isArray(node.fills) || node.fills.length === 0) return '';

    const fill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false) as SolidPaint | undefined;
    if (!fill) return '';

    const { r, g, b } = fill.color;
    const a = typeof fill.opacity === 'number' ? fill.opacity : 1;
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}
