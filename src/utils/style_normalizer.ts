/**
 * StyleNormalizer - Camada centralizada de normalização de estilos
 * 
 * Converte propriedades do Figma para formato Elementor, eliminando
 * erros de formato em todos os widgets.
 */

/**
 * Converte cor de objeto RGB {r, g, b} para string rgba
 * @param color - Objeto RGB do Figma ou string de cor
 * @returns String no formato rgba(r, g, b, a) ou undefined
 */
export function normalizeColor(color: any): string | undefined {
    if (!color) return undefined;

    // Se já for string, retorna direto
    if (typeof color === 'string') return color;

    // Se for objeto RGB do Figma (valores 0-1)
    if (typeof color === 'object' && 'r' in color) {
        const r = Math.round((color.r || 0) * 255);
        const g = Math.round((color.g || 0) * 255);
        const b = Math.round((color.b || 0) * 255);
        const a = color.a !== undefined ? color.a : (color.opacity !== undefined ? color.opacity : 1);
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    return undefined;
}

/**
 * Converte valor de tamanho para estrutura Elementor com sizes[]
 * @param value - Número ou objeto de tamanho
 * @param unit - Unidade (px, em, %, etc)
 * @returns Objeto no formato Elementor {unit, size, sizes: []}
 */
export function normalizeSize(value: number | undefined, unit: string = 'px'): { unit: string; size: number | ''; sizes: any[] } | undefined {
    if (value === undefined || value === null) return undefined;

    return {
        unit,
        size: typeof value === 'number' ? value : '',
        sizes: []
    };
}

/**
 * Normaliza typography para formato Elementor
 * @param styles - Estilos brutos do Figma
 * @returns Objeto com propriedades de typography normalizadas
 */
export function normalizeTypography(styles: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    if (styles.fontSize) {
        result.typography_typography = 'custom';
        result.typography_font_size = normalizeSize(styles.fontSize);
    }

    if (styles.fontName?.family) {
        result.typography_font_family = styles.fontName.family;
    }

    if (styles.fontWeight) {
        result.typography_font_weight = styles.fontWeight;
    }

    if (styles.lineHeight?.value) {
        result.typography_line_height = normalizeSize(styles.lineHeight.value);
    }

    if (styles.letterSpacing?.value) {
        const unit = styles.letterSpacing.unit === 'PERCENT' ? 'em' : 'px';
        result.typography_letter_spacing = normalizeSize(styles.letterSpacing.value, unit);
    }

    if (styles.textDecoration) {
        result.typography_text_decoration = styles.textDecoration.toLowerCase();
    }

    if (styles.textCase) {
        const caseMap: Record<string, string> = {
            'UPPER': 'uppercase',
            'LOWER': 'lowercase',
            'TITLE': 'capitalize',
            'ORIGINAL': 'none'
        };
        result.typography_text_transform = caseMap[styles.textCase] || 'none';
    }

    return result;
}

/**
 * Normaliza padding para estrutura Elementor
 * @param top - Padding top
 * @param right - Padding right  
 * @param bottom - Padding bottom
 * @param left - Padding left
 * @param unit - Unidade
 * @returns Objeto no formato Elementor
 */
export function normalizePadding(
    top?: number,
    right?: number,
    bottom?: number,
    left?: number,
    unit: string = 'px'
): { unit: string; top: string | number; right: string | number; bottom: string | number; left: string | number; isLinked: boolean } | undefined {
    if (top === undefined && right === undefined && bottom === undefined && left === undefined) {
        return undefined;
    }

    return {
        unit,
        top: top ?? '',
        right: right ?? '',
        bottom: bottom ?? '',
        left: left ?? '',
        isLinked: top === right && right === bottom && bottom === left
    };
}

/**
 * Normaliza border-radius para estrutura Elementor
 * @param radius - Valor único ou objeto com valores por canto
 * @param unit - Unidade
 * @returns Objeto no formato Elementor
 */
export function normalizeBorderRadius(
    radius: number | { topLeft?: number; topRight?: number; bottomRight?: number; bottomLeft?: number } | undefined,
    unit: string = 'px'
): { unit: string; top: number | string; right: number | string; bottom: number | string; left: number | string; isLinked: boolean } | undefined {
    if (radius === undefined || radius === null) return undefined;

    if (typeof radius === 'number') {
        return {
            unit,
            top: radius,
            right: radius,
            bottom: radius,
            left: radius,
            isLinked: true
        };
    }

    return {
        unit,
        top: radius.topLeft ?? '',
        right: radius.topRight ?? '',
        bottom: radius.bottomRight ?? '',
        left: radius.bottomLeft ?? '',
        isLinked: false
    };
}

/**
 * Normaliza border-width para estrutura Elementor
 * @param width - Largura da borda
 * @param unit - Unidade
 * @returns Objeto no formato Elementor
 */
export function normalizeBorderWidth(
    width: number | undefined,
    unit: string = 'px'
): { unit: string; top: number | string; right: number | string; bottom: number | string; left: number | string; isLinked: boolean } | undefined {
    if (width === undefined || width === null) return undefined;

    return {
        unit,
        top: width,
        right: width,
        bottom: width,
        left: width,
        isLinked: true
    };
}

/**
 * Normaliza gap/spacing para estrutura Elementor
 * @param gap - Valor do gap
 * @param unit - Unidade
 * @returns Objeto no formato Elementor
 */
export function normalizeGap(
    gap: number | undefined,
    unit: string = 'px'
): { unit: string; column: string | number; row: string | number; isLinked: boolean } | undefined {
    if (gap === undefined || gap === null) return undefined;

    return {
        unit,
        column: gap > 0 ? String(gap) : '',
        row: gap > 0 ? String(gap) : '',
        isLinked: true
    };
}

/**
 * Normaliza todos os estilos de um widget
 * Aplica todas as funções de normalização relevantes
 * @param styles - Estilos brutos do Figma
 * @returns Estilos normalizados para Elementor
 */
export function normalizeWidgetStyles(styles: Record<string, any>): Record<string, any> {
    if (!styles) return {};

    const normalized: Record<string, any> = { ...styles };

    // Normalizar cor
    if (styles.color) {
        normalized.color = normalizeColor(styles.color);
    }

    // Normalizar background color
    if (styles.background?.color) {
        normalized.background = {
            ...styles.background,
            color: normalizeColor(styles.background.color)
        };
    }

    // Normalizar border color
    if (styles.border?.color) {
        normalized.border = {
            ...styles.border,
            color: normalizeColor(styles.border.color)
        };
    }

    return normalized;
}

/**
 * Aplica normalização a settings do Elementor
 * @param settings - Settings brutas
 * @returns Settings normalizadas
 */
export function normalizeElementorSettings(settings: Record<string, any>): Record<string, any> {
    if (!settings) return {};

    const normalized: Record<string, any> = { ...settings };

    // Lista de propriedades de cor para normalizar
    const colorProps = [
        'color', 'text_color', 'title_color', 'description_color',
        'digits_color', 'label_color', 'background_color',
        'border_color', 'box_background_color', 'box_border_color'
    ];

    colorProps.forEach(prop => {
        if (settings[prop] && typeof settings[prop] === 'object' && 'r' in settings[prop]) {
            normalized[prop] = normalizeColor(settings[prop]);
        }
    });

    // Typography font_size normalization
    const typographyProps = [
        'typography_font_size', 'digits_typography_font_size',
        'label_typography_font_size', 'title_typography_font_size',
        'description_typography_font_size'
    ];

    typographyProps.forEach(prop => {
        if (settings[prop] && typeof settings[prop] === 'object') {
            if (!('sizes' in settings[prop])) {
                normalized[prop] = { ...settings[prop], sizes: [] };
            }
        }
    });

    return normalized;
}
