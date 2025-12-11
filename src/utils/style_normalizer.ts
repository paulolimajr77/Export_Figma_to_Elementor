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
 * Normaliza um valor numérico para string (formato Elementor Dimensions)
 * IMPORTANTE: Controles Dimensions esperam STRINGS, não números!
 * @param value - Valor numérico ou string
 * @returns String do valor ou string vazia
 */
export function normalizeBoxModelValue(value: number | string | undefined | null): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    return String(value);
}

/**
 * Tipo de retorno para funções de Dimensions (padding, margin)
 */
export interface ElementorDimensions {
    unit: string;
    top: string;
    right: string;
    bottom: string;
    left: string;
    isLinked: boolean;
}

/**
 * Normaliza padding para estrutura Elementor com valores STRING
 * @param top - Padding top
 * @param right - Padding right  
 * @param bottom - Padding bottom
 * @param left - Padding left
 * @param unit - Unidade
 * @returns Objeto no formato Elementor com valores STRING
 */
export function normalizePadding(
    top?: number | string,
    right?: number | string,
    bottom?: number | string,
    left?: number | string,
    unit: string = 'px'
): ElementorDimensions | undefined {
    // Se tudo undefined/null, retorna undefined
    if (top === undefined && right === undefined && bottom === undefined && left === undefined) {
        return undefined;
    }
    if (top === null && right === null && bottom === null && left === null) {
        return undefined;
    }

    const t = normalizeBoxModelValue(top);
    const r = normalizeBoxModelValue(right);
    const b = normalizeBoxModelValue(bottom);
    const l = normalizeBoxModelValue(left);

    // isLinked só é true se todos iguais E pelo menos um tem valor
    const allEqual = t === r && r === b && b === l;
    const hasValue = t !== '' || r !== '' || b !== '' || l !== '';

    console.log('[figtoel-boxmodel] normalizePadding:', { top: t, right: r, bottom: b, left: l, isLinked: allEqual && hasValue });

    return {
        unit,
        top: t,
        right: r,
        bottom: b,
        left: l,
        isLinked: allEqual && hasValue
    };
}

/**
 * Normaliza margin para estrutura Elementor com valores STRING
 * Usa mesma lógica de normalizePadding
 */
export function normalizeMargin(
    top?: number | string,
    right?: number | string,
    bottom?: number | string,
    left?: number | string,
    unit: string = 'px'
): ElementorDimensions | undefined {
    return normalizePadding(top, right, bottom, left, unit);
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
 * Normaliza border-width para estrutura Elementor com valores STRING
 * Suporta largura uniforme ou valores por lado
 * 
 * @param top - Largura do topo ou largura uniforme se outros undefined
 * @param right - Largura direita (opcional)
 * @param bottom - Largura inferior (opcional)
 * @param left - Largura esquerda (opcional)
 * @param unit - Unidade
 * @returns Objeto no formato Elementor Dimensions
 */
export function normalizeBorderWidth(
    top?: number,
    right?: number,
    bottom?: number,
    left?: number,
    unit: string = 'px'
): ElementorDimensions | undefined {
    // Se tudo undefined, retorna undefined
    if (top === undefined && right === undefined && bottom === undefined && left === undefined) {
        return undefined;
    }

    // Converter para strings usando normalizeBoxModelValue
    const t = normalizeBoxModelValue(top);
    const r = normalizeBoxModelValue(right !== undefined ? right : top);
    const b = normalizeBoxModelValue(bottom !== undefined ? bottom : top);
    const l = normalizeBoxModelValue(left !== undefined ? left : top);

    // isLinked = true se todos valores iguais e pelo menos um tem valor
    const allEqual = t === r && r === b && b === l;
    const hasValue = t !== '' || r !== '' || b !== '' || l !== '';

    console.log('[figtoel-boxmodel] normalizeBorderWidth:', { top: t, right: r, bottom: b, left: l, isLinked: allEqual && hasValue });

    return {
        unit,
        top: t,
        right: r,
        bottom: b,
        left: l,
        isLinked: allEqual && hasValue
    };
}

/**
 * Tipo de retorno para flex_gap
 */
export interface ElementorFlexGap {
    unit: string;
    column: string;
    row: string;
    isLinked: boolean;
}

/**
 * Normaliza gap/spacing para estrutura Elementor flex_gap
 * @param gap - Valor do gap (número)
 * @param unit - Unidade
 * @returns Objeto no formato Elementor flex_gap
 */
export function normalizeGap(
    gap: number | undefined,
    unit: string = 'px'
): ElementorFlexGap | undefined {
    if (gap === undefined || gap === null) return undefined;

    const gapStr = gap > 0 ? String(gap) : '';

    console.log('[figtoel-boxmodel] normalizeGap:', { gap, gapStr });

    return {
        unit,
        column: gapStr,
        row: gapStr,
        isLinked: true
    };
}

/**
 * Alias para normalizeGap - usado para flex containers
 */
export function normalizeFlexGap(
    gap: number | undefined,
    unit: string = 'px'
): ElementorFlexGap | undefined {
    return normalizeGap(gap, unit);
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

/**
 * Breakpoints do Elementor para alinhamento responsivo
 */
export const ELEMENTOR_BREAKPOINTS = ['widescreen', 'laptop', 'tablet_extra', 'tablet', 'mobile_extra', 'mobile'] as const;
export type ElementorBreakpoint = typeof ELEMENTOR_BREAKPOINTS[number];

/**
 * Valores válidos para text_align
 */
export type TextAlignValue = 'left' | 'center' | 'right' | 'justify' | '';

/**
 * Interface para alinhamento com breakpoints
 */
export interface TextAlignSettings {
    text_align: TextAlignValue;
    text_align_widescreen: TextAlignValue;
    text_align_laptop: TextAlignValue;
    text_align_tablet_extra: TextAlignValue;
    text_align_tablet: TextAlignValue;
    text_align_mobile_extra: TextAlignValue;
    text_align_mobile: TextAlignValue;
}

/**
 * Converte alinhamento do Figma para valor Elementor
 * @param figmaAlign - Valor do Figma (LEFT, CENTER, RIGHT, JUSTIFIED)
 * @returns Valor Elementor (left, center, right, justify)
 */
export function convertFigmaAlignToElementor(figmaAlign?: string): TextAlignValue {
    if (!figmaAlign) return '';
    const map: Record<string, TextAlignValue> = {
        'LEFT': 'left',
        'CENTER': 'center',
        'RIGHT': 'right',
        'JUSTIFIED': 'justify',
        'left': 'left',
        'center': 'center',
        'right': 'right',
        'justify': 'justify'
    };
    return map[figmaAlign] || '';
}

/**
 * Normaliza text_align para formato Elementor com todos os breakpoints
 * 
 * @param align - Valor de alinhamento (Figma ou já normalizado)
 * @param inheritToBreakpoints - Se true, preenche todos breakpoints com string vazia (herdam do base)
 * @returns Objeto com text_align e todas as variantes responsivas
 * 
 * @example
 * normalizeTextAlign('CENTER')
 * // { text_align: 'center', text_align_widescreen: '', text_align_laptop: '', ... }
 */
export function normalizeTextAlign(
    align?: string,
    inheritToBreakpoints: boolean = true
): Partial<TextAlignSettings> {
    const normalizedAlign = convertFigmaAlignToElementor(align);

    const result: Partial<TextAlignSettings> = {
        text_align: normalizedAlign
    };

    if (inheritToBreakpoints) {
        // Preencher variantes responsivas com string vazia (herdam do valor base)
        ELEMENTOR_BREAKPOINTS.forEach(bp => {
            result[`text_align_${bp}` as keyof TextAlignSettings] = '';
        });
    }

    console.log('[figtoel-boxmodel] normalizeTextAlign:', result);
    return result;
}

/**
 * Normaliza align para widgets simples (heading, text-editor, button, etc)
 * Retorna apenas o campo 'align' normalizado
 */
export function normalizeWidgetAlign(align?: string): { align: TextAlignValue } | undefined {
    if (!align) return undefined;
    const normalized = convertFigmaAlignToElementor(align);
    if (!normalized) return undefined;
    return { align: normalized };
}

/**
 * Valores válidos para flex alignment
 */
export type FlexAlignValue = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly' | '';

/**
 * Normaliza justify_content/align_items para containers
 * Converte valores 'start'/'end' para 'flex-start'/'flex-end'
 */
export function normalizeFlexAlign(value?: string): FlexAlignValue {
    if (!value) return '';
    const map: Record<string, FlexAlignValue> = {
        'start': 'flex-start',
        'flex-start': 'flex-start',
        'center': 'center',
        'end': 'flex-end',
        'flex-end': 'flex-end',
        'stretch': 'stretch',
        'space-between': 'space-between',
        'space-around': 'space-around',
        'space-evenly': 'space-evenly',
        // Figma values
        'MIN': 'flex-start',
        'CENTER': 'center',
        'MAX': 'flex-end',
        'STRETCH': 'stretch',
        'SPACE_BETWEEN': 'space-between'
    };
    return map[value] || '';
}

/**
 * Interface para flex alignment com breakpoints
 */
export interface FlexAlignSettings {
    justify_content: FlexAlignValue;
    justify_content_tablet: FlexAlignValue;
    justify_content_mobile: FlexAlignValue;
    align_items: FlexAlignValue;
    align_items_tablet: FlexAlignValue;
    align_items_mobile: FlexAlignValue;
}

/**
 * Normaliza flex alignment para containers com breakpoints
 */
export function normalizeFlexAlignment(
    justify?: string,
    alignItems?: string,
    inheritToBreakpoints: boolean = true
): Partial<FlexAlignSettings> {
    const result: Partial<FlexAlignSettings> = {};

    if (justify) {
        result.justify_content = normalizeFlexAlign(justify);
        if (inheritToBreakpoints) {
            result.justify_content_tablet = '';
            result.justify_content_mobile = '';
        }
    }

    if (alignItems) {
        result.align_items = normalizeFlexAlign(alignItems);
        if (inheritToBreakpoints) {
            result.align_items_tablet = '';
            result.align_items_mobile = '';
        }
    }

    console.log('[figtoel-boxmodel] normalizeFlexAlignment:', result);
    return result;
}
