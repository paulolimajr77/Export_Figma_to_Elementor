import { HeuristicRule, MatchCandidate, NodeFeatures } from './types';

// ============================================================
// THRESHOLDS - Ajustáveis por widget type
// ============================================================
var BUTTON_MIN_CONFIDENCE = 0.70;
var HEADING_MIN_CONFIDENCE = 0.75;
var IMAGE_BOX_MIN_CONFIDENCE = 0.65;
var TEXT_EDITOR_MIN_CONFIDENCE = 0.60;
var CONTAINER_DEFAULT_CONFIDENCE = 0.30;

// ============================================================
// B1: ButtonRule - Calibrada para evitar falsos positivos
// ============================================================
var ButtonRule: HeuristicRule = {
    id: 'h_button_calibrated',
    targetWidget: 'w:button',
    evaluate: function (features: NodeFeatures): MatchCandidate | null {
        var score = 0;
        var reasons: string[] = [];

        // Sinais positivos
        if (features.hasText && features.textCount === 1) {
            score += 0.35;
            reasons.push('Texto único detectado');
        }

        if (features.hasFill || features.hasStroke) {
            score += 0.20;
            reasons.push('Possui preenchimento ou borda');
        }

        // Aspect ratio típico de botão (horizontal)
        if (features.aspectRatio > 1.5 && features.aspectRatio < 8) {
            score += 0.20;
            reasons.push('Proporção horizontal típica de botão');
        }

        // Texto curto (provável CTA) - estimativa baseada em textLength
        if (features.textLength > 0 && features.textLength < 40) {
            score += 0.15;
            reasons.push('Texto curto (< 40 chars)');
        }

        // ============================================================
        // PENALIDADES (críticas para evitar falsos positivos)
        // ============================================================

        // Muitos filhos = não é botão
        if (features.childCount > 2) {
            score -= 0.40;
            reasons.push('PENALTY: Muitos filhos (' + features.childCount + ')');
        }

        // Altura excessiva = não é botão
        if (features.height > 120) {
            score -= 0.40;
            reasons.push('PENALTY: Altura excessiva (' + features.height + 'px)');
        }

        // Estrutura interna complexa (nested frames)
        if (features.hasNestedFrames) {
            score -= 0.30;
            reasons.push('PENALTY: Estrutura aninhada complexa');
        }

        // Área muito grande (section completa)
        if (features.area > 150000) {
            score -= 0.35;
            reasons.push('PENALTY: Área muito grande');
        }

        // Container grande em HEADER/FOOTER
        if ((features.zone === 'HEADER' || features.zone === 'FOOTER') && features.area > 50000) {
            score -= 0.20;
            reasons.push('PENALTY: Container grande em ' + features.zone);
        }

        // Sem texto = improvável ser botão visível
        if (!features.hasText) {
            score -= 0.50;
            reasons.push('PENALTY: Sem texto');
        }

        // Threshold mínimo
        if (score < BUTTON_MIN_CONFIDENCE) {
            return null;
        }

        return {
            widget: 'w:button',
            score: score > 1 ? 1 : score,
            ruleId: 'h_button_calibrated',
            reasons: reasons
        };
    }
};

// ============================================================
// D1: HeadingRule - Calibrada para diferenciar títulos reais
// ============================================================
var HeadingRule: HeuristicRule = {
    id: 'h_heading_calibrated',
    targetWidget: 'w:heading',
    evaluate: function (features: NodeFeatures): MatchCandidate | null {
        var score = 0;
        var reasons: string[] = [];

        // Deve ser TEXT ou ter texto
        if (!features.hasText && features.type !== 'TEXT') {
            return null;
        }

        // Sinais positivos de heading
        if (features.fontSize >= 22) {
            score += 0.40;
            reasons.push('Tamanho de fonte tipográfica grande (' + features.fontSize + 'px)');
        } else if (features.fontSize >= 18) {
            score += 0.25;
            reasons.push('Tamanho de fonte moderado (' + features.fontSize + 'px)');
        }

        if (features.fontWeight >= 600) {
            score += 0.25;
            reasons.push('Peso de fonte bold/semibold');
        }

        // Texto curto (linha única, título)
        if (features.textLength > 0 && features.textLength < 80) {
            score += 0.20;
            reasons.push('Texto curto (< 80 chars)');
        }

        // Zona HERO/HEADER favorece headings
        if (features.zone === 'HERO' || features.zone === 'HEADER') {
            score += 0.15;
            reasons.push('Zona com alta probabilidade de heading');
        }

        // ============================================================
        // PENALIDADES
        // ============================================================

        // Texto muito longo (parágrafo)
        if (features.textLength > 150) {
            score -= 0.50;
            reasons.push('PENALTY: Texto muito longo (parágrafo)');
        }

        // Font size pequeno
        if (features.fontSize > 0 && features.fontSize <= 16) {
            score -= 0.40;
            reasons.push('PENALTY: Font size pequeno (' + features.fontSize + 'px)');
        }

        // Peso de fonte leve com font size baixo
        if (features.fontWeight <= 400 && features.fontSize < 18) {
            score -= 0.30;
            reasons.push('PENALTY: Peso leve + fonte pequena');
        }

        // FOOTER = provável link/texto legal, não heading
        if (features.zone === 'FOOTER') {
            score -= 0.15;
            reasons.push('PENALTY: Zona FOOTER');
        }

        // Threshold mínimo
        if (score < HEADING_MIN_CONFIDENCE) {
            return null;
        }

        return {
            widget: 'w:heading',
            score: score > 1 ? 1 : score,
            ruleId: 'h_heading_calibrated',
            reasons: reasons
        };
    }
};

// ============================================================
// TextEditorRule - Para parágrafos e textos longos
// ============================================================
var TextEditorRule: HeuristicRule = {
    id: 'h_text_editor',
    targetWidget: 'w:text-editor',
    evaluate: function (features: NodeFeatures): MatchCandidate | null {
        var score = 0;
        var reasons: string[] = [];

        // Deve ser TEXT ou ter texto
        if (!features.hasText && features.type !== 'TEXT') {
            return null;
        }

        // Font size médio/pequeno (não é heading)
        if (features.fontSize > 0 && features.fontSize < 20) {
            score += 0.35;
            reasons.push('Font size de texto corrido');
        }

        // Texto longo
        if (features.textLength > 80) {
            score += 0.35;
            reasons.push('Texto longo (parágrafo)');
        }

        // Peso de fonte regular
        if (features.fontWeight <= 500) {
            score += 0.20;
            reasons.push('Peso de fonte regular');
        }

        // BODY zone favorece text-editor
        if (features.zone === 'BODY') {
            score += 0.10;
            reasons.push('Zona BODY');
        }

        // Threshold mínimo
        if (score < TEXT_EDITOR_MIN_CONFIDENCE) {
            return null;
        }

        return {
            widget: 'w:text-editor',
            score: score > 1 ? 1 : score,
            ruleId: 'h_text_editor',
            reasons: reasons
        };
    }
};

// ============================================================
// C1: ImageBoxRule - Cards com imagem + texto
// ============================================================
var ImageBoxRule: HeuristicRule = {
    id: 'h_image_box_calibrated',
    targetWidget: 'w:image-box',
    evaluate: function (features: NodeFeatures): MatchCandidate | null {
        var score = 0;
        var reasons: string[] = [];

        // Deve ter imagem
        if (!features.hasImage) {
            return null;
        }

        // Sinais positivos de card
        score += 0.30;
        reasons.push('Possui imagem');

        // Text count ideal: 1-3 (título, descrição, perhaps link)
        if (features.textCount >= 1 && features.textCount <= 3) {
            score += 0.30;
            reasons.push('Quantidade de texto ideal para card');
        }

        // Child count moderado (2-5 elementos)
        if (features.childCount >= 2 && features.childCount <= 5) {
            score += 0.20;
            reasons.push('Quantidade de filhos típica de card');
        }

        // Aspect ratio de card (não muito horizontal)
        if (features.aspectRatio > 0.5 && features.aspectRatio < 2.5) {
            score += 0.15;
            reasons.push('Proporção típica de card');
        }

        // ============================================================
        // PENALIDADES
        // ============================================================

        // Muitos textos = seção complexa, não card
        if (features.textCount > 4) {
            score -= 0.50;
            reasons.push('PENALTY: Muitos textos (' + features.textCount + ')');
        }

        // Muito horizontal (hero/faixa)
        if (features.aspectRatio > 3) {
            score -= 0.35;
            reasons.push('PENALTY: Muito horizontal para card');
        }

        // Área muito grande
        if (features.area > 300000) {
            score -= 0.40;
            reasons.push('PENALTY: Área muito grande para card');
        }

        // Múltiplas imagens
        if (features.imageCount > 1) {
            score -= 0.25;
            reasons.push('PENALTY: Múltiplas imagens (possivelmente grid/gallery)');
        }

        // Threshold mínimo
        if (score < IMAGE_BOX_MIN_CONFIDENCE) {
            return null;
        }

        return {
            widget: 'w:image-box',
            score: score > 1 ? 1 : score,
            ruleId: 'h_image_box_calibrated',
            reasons: reasons
        };
    }
};

// ============================================================
// ImageRule - Imagem simples (sem texto significativo)
// ============================================================
var ImageRule: HeuristicRule = {
    id: 'h_image_simple',
    targetWidget: 'w:image',
    evaluate: function (features: NodeFeatures): MatchCandidate | null {
        var score = 0;
        var reasons: string[] = [];

        // Deve ter imagem
        if (!features.hasImage && features.type !== 'IMAGE') {
            return null;
        }

        // É um nó IMAGE direto
        if (features.type === 'IMAGE') {
            score += 0.80;
            reasons.push('Nó do tipo IMAGE');
        } else if (features.hasImage && features.textCount === 0) {
            score += 0.70;
            reasons.push('Possui imagem sem texto');
        }

        if (features.textCount > 0) {
            score -= 0.40;
            reasons.push('PENALTY: Tem texto (considerar image-box)');
        }

        if (score < 0.5) {
            return null;
        }

        return {
            widget: 'w:image',
            score: score > 1 ? 1 : score,
            ruleId: 'h_image_simple',
            reasons: reasons
        };
    }
};

// ============================================================
// IconRule - Vectors < 40px = icon (not image)
// ============================================================
var ICON_MAX_DIMENSION = 40;
var ICON_MIN_CONFIDENCE = 0.70;

var IconRule: HeuristicRule = {
    id: 'h_icon_v2',
    targetWidget: 'w:icon',
    evaluate: function (features: NodeFeatures): MatchCandidate | null {
        var score = 0;
        var reasons: string[] = [];

        // Must be a vector node
        if (!features.isVectorNode) {
            return null;
        }

        // Small vector = likely icon
        if (features.vectorWidth > 0 && features.vectorWidth <= ICON_MAX_DIMENSION &&
            features.vectorHeight > 0 && features.vectorHeight <= ICON_MAX_DIMENSION) {
            score += 0.70;
            reasons.push('Vetor pequeno (<= ' + ICON_MAX_DIMENSION + 'px)');
        } else if (features.vectorWidth <= 60 && features.vectorHeight <= 60) {
            score += 0.50;
            reasons.push('Vetor médio (<= 60px)');
        } else {
            // Too large for icon
            return null;
        }

        // Square aspect ratio is common for icons
        if (features.aspectRatio >= 0.8 && features.aspectRatio <= 1.2) {
            score += 0.15;
            reasons.push('Proporção quadrada típica de ícone');
        }

        // Has stroke/fill (visible icon)
        if (features.hasFill || features.hasStroke) {
            score += 0.10;
            reasons.push('Possui preenchimento ou traço');
        }

        // Threshold
        if (score < ICON_MIN_CONFIDENCE) {
            return null;
        }

        return {
            widget: 'w:icon',
            score: score > 1 ? 1 : score,
            ruleId: 'h_icon_v2',
            reasons: reasons
        };
    }
};

// ============================================================
// DividerRule - Thin rectangles = Elementor divider
// ============================================================
var DIVIDER_MAX_HEIGHT = 5;
var DIVIDER_MIN_WIDTH = 100;
var DIVIDER_MIN_CONFIDENCE = 0.70;

var DividerRule: HeuristicRule = {
    id: 'h_divider_v2',
    targetWidget: 'w:divider',
    evaluate: function (features: NodeFeatures): MatchCandidate | null {
        var score = 0;
        var reasons: string[] = [];

        // Must be RECTANGLE or LINE
        if (features.type !== 'RECTANGLE' && features.type !== 'LINE') {
            return null;
        }

        // Thin height, wide width = divider
        if (features.height <= DIVIDER_MAX_HEIGHT && features.width >= DIVIDER_MIN_WIDTH) {
            score += 0.70;
            reasons.push('Retângulo fino e largo (divider horizontal)');
        }

        // Vertical divider case (thin width, tall height)
        if (features.width <= DIVIDER_MAX_HEIGHT && features.height >= DIVIDER_MIN_WIDTH) {
            score += 0.65;
            reasons.push('Retângulo fino e alto (divider vertical)');
        }

        // Has fill or stroke (visible)
        if (features.hasFill || features.hasStroke) {
            score += 0.15;
            reasons.push('Possui cor visível');
        }

        // No children (simple element)
        if (features.childCount === 0) {
            score += 0.10;
            reasons.push('Elemento simples sem filhos');
        }

        // Threshold
        if (score < DIVIDER_MIN_CONFIDENCE) {
            return null;
        }

        return {
            widget: 'w:divider',
            score: score > 1 ? 1 : score,
            ruleId: 'h_divider_v2',
            reasons: reasons
        };
    }
};

// ============================================================
// E1: ContainerRule - Fallback seguro
// ============================================================
var ContainerRule: HeuristicRule = {
    id: 'h_container_fallback',
    targetWidget: 'w:container',
    evaluate: function (features: NodeFeatures): MatchCandidate | null {
        var score = CONTAINER_DEFAULT_CONFIDENCE;
        var reasons: string[] = ['Fallback seguro para estrutura genérica'];

        // Estrutura com Auto Layout
        if (features.layoutMode !== 'NONE') {
            score += 0.10;
            reasons.push('Possui Auto Layout');
        }

        // Tem filhos
        if (features.childCount > 0) {
            score += 0.10;
            reasons.push('Possui filhos');
        }

        // Nunca ganha se outra heurística tiver score alto
        // Este retorna sempre, mas com score baixo

        return {
            widget: 'w:container',
            score: score > 0.5 ? 0.5 : score, // Cap at 0.5 to never beat specific widgets
            ruleId: 'h_container_fallback',
            reasons: reasons
        };
    }
};

// ============================================================
// Registro de regras (ordem importa para desempate)
// ============================================================
var heuristicRules: HeuristicRule[] = [
    IconRule,      // Check icons first (vectors)
    DividerRule,   // Check dividers early (rectangles)
    ButtonRule,
    HeadingRule,
    TextEditorRule,
    ImageRule,
    ImageBoxRule,
    ContainerRule  // Fallback sempre por último
];

/**
 * Executa todas as regras registradas e retorna a lista de candidatos
 * ordenada por score (decrescente).
 */
export function evaluateHeuristics(features: NodeFeatures): MatchCandidate[] {
    var results: MatchCandidate[] = [];

    for (var i = 0; i < heuristicRules.length; i++) {
        var rule = heuristicRules[i];
        var candidate = rule.evaluate(features);
        if (candidate && candidate.score > 0) {
            results.push(candidate);
        }
    }

    results.sort(function (a: MatchCandidate, b: MatchCandidate) {
        return b.score - a.score;
    });

    return results;
}
