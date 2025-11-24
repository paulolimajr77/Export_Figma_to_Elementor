import type { ElementorSettings } from '../types/elementor.types';

/**
 * Verifica se um valor é um array (type guard para readonly arrays)
 */
function isArray(value: any): value is ReadonlyArray<any> {
    return Array.isArray(value);
}

/**
 * Extrai tipografia de um nó de texto do Figma
 * @param node Nó de texto do Figma
 * @returns Settings de tipografia do Elementor
 */
export function extractTypography(node: TextNode): ElementorSettings {
    const settings: ElementorSettings = {};
    settings.typography_typography = 'custom';

    // Tamanho da fonte
    if (node.fontSize !== figma.mixed) {
        settings.typography_font_size = { unit: 'px', size: Math.round(node.fontSize) };
    }

    // Família e peso da fonte
    if (node.fontName !== figma.mixed) {
        const style = node.fontName.style.toLowerCase();

        // Determina o peso da fonte baseado no estilo
        if (style.includes('bold')) settings.typography_font_weight = '700';
        else if (style.includes('semibold')) settings.typography_font_weight = '600';
        else if (style.includes('medium')) settings.typography_font_weight = '500';
        else if (style.includes('light')) settings.typography_font_weight = '300';
        else settings.typography_font_weight = '400';

        // Estilo itálico
        if (style.includes('italic')) settings.typography_font_style = 'italic';

        settings.typography_font_family = node.fontName.family;
    }

    // Altura da linha
    if (node.lineHeight !== figma.mixed && node.lineHeight.unit !== 'AUTO') {
        if (node.lineHeight.unit === 'PIXELS') {
            settings.typography_line_height = { unit: 'px', size: Math.round(node.lineHeight.value) };
        } else if (node.lineHeight.unit === 'PERCENT') {
            settings.typography_line_height = { unit: 'em', size: (node.lineHeight.value / 100).toFixed(2) };
        }
    }

    // Espaçamento entre letras
    if (node.letterSpacing !== figma.mixed && node.letterSpacing.value !== 0) {
        settings.typography_letter_spacing = { unit: 'px', size: node.letterSpacing.value };
    }

    // Alinhamento de texto
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

    // Decoração de texto
    if (node.textDecoration === 'UNDERLINE') {
        settings.typography_text_decoration = 'underline';
    }

    // Transformação de texto
    if (node.textCase === 'UPPER') {
        settings.typography_text_transform = 'uppercase';
    }

    return settings;
}

/**
 * Extrai a cor do texto de um nó
 * @param node Nó de texto do Figma
 * @returns Cor em formato RGBA CSS
 */
export function extractTextColor(node: TextNode): string {
    if (!('fills' in node) || !isArray(node.fills) || node.fills.length === 0) return '';

    const fill = node.fills[0];
    if (fill.type === 'SOLID') {
        const { r, g, b } = fill.color;
        const a = fill.opacity !== undefined ? fill.opacity : 1;
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }

    return '';
}

/**
 * Extrai alinhamento de texto
 * @param node Nó de texto do Figma
 * @returns Alinhamento CSS
 */
export function extractTextAlignment(node: TextNode): string {
    if (!node.textAlignHorizontal) return 'left';

    const map: Record<string, string> = {
        LEFT: 'left',
        CENTER: 'center',
        RIGHT: 'right',
        JUSTIFIED: 'justify'
    };

    return map[node.textAlignHorizontal as string] || 'left';
}
