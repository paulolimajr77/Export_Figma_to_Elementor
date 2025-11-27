import { WidgetPattern, WidgetMatch } from '../types/elementor.types';
import { widgetPatterns } from '../config/widget.patterns';

/**
 * Analisa estrutura do nó usando algoritmo determinístico
 * Rápido (0.1s), offline, sem custo
 */
export function analyzeStructural(node: SceneNode): WidgetMatch[] {
    const matches: WidgetMatch[] = [];

    for (const pattern of widgetPatterns) {
        const score = calculateStructuralScore(node, pattern);

        if (score >= pattern.minScore) {
            matches.push({
                pattern,
                score,
                method: 'structural',
                confidence: score / 100
            });
        }
    }

    return matches.sort((a, b) => b.score - a.score);
}

/**
 * Calcula score estrutural para um padrão específico
 */
function calculateStructuralScore(node: SceneNode, pattern: WidgetPattern): number {
    if (pattern.scoreFunction) {
        return pattern.scoreFunction(node);
    }

    let score = 0;

    // 1. Tipo do nó (10 pts)
    if (pattern.structure.rootType.includes(node.type)) {
        score += 10;
    } else {
        return 0;
    }

    // 2. Hierarquia (40 pts)
    score += analyzeHierarchy(node, pattern);

    // 3. Propriedades visuais (30 pts)
    score += analyzeVisualProperties(node, pattern);

    // 4. Conteúdo (20 pts)
    score += analyzeContent(node, pattern);

    return Math.min(score, 100);
}

/**
 * Analisa hierarquia de filhos do nó
 */
function analyzeHierarchy(node: SceneNode, pattern: WidgetPattern): number {
    let score = 0;

    if (!('children' in node)) {
        return 0;
    }

    const children = node.children;

    // Verificar contagem de filhos (20 pts)
    if (pattern.structure.childCount) {
        const { min, max, exact } = pattern.structure.childCount;

        if (exact !== undefined && children.length === exact) {
            score += 20;
        } else if (min !== undefined && max !== undefined) {
            if (children.length >= min && children.length <= max) {
                score += 15;
            }
        } else if (min !== undefined && children.length >= min) {
            score += 10;
        }
    }

    // Verificar filhos obrigatórios (20 pts)
    if (pattern.structure.requiredChildren) {
        const pointsPerChild = 20 / pattern.structure.requiredChildren.length;

        for (const required of pattern.structure.requiredChildren) {
            const matchingChildren = children.filter(c => c.type === required.type);

            if (matchingChildren.length >= required.count) {
                score += pointsPerChild;
            }
        }
    }

    return Math.min(score, 40);
}

/**
 * Analisa propriedades visuais do nó
 */
function analyzeVisualProperties(node: SceneNode, pattern: WidgetPattern): number {
    let score = 0;
    const props = pattern.structure.properties;

    if (!props) return 0;

    // Auto Layout (15 pts)
    if (props.hasAutoLayout && 'layoutMode' in node) {
        if (node.layoutMode !== 'NONE') {
            score += 10;

            if (props.layoutMode && node.layoutMode === props.layoutMode) {
                score += 5;
            }
        }
    }

    // Padding (5 pts)
    if (props.hasPadding && 'paddingLeft' in node) {
        if (node.paddingLeft > 0 || node.paddingTop > 0) {
            score += 5;
        }
    }

    // Border Radius (5 pts)
    if (props.hasBorderRadius && 'cornerRadius' in node) {
        if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
            score += 5;
        }
    }

    // Background (5 pts)
    if (props.hasBackground && 'fills' in node) {
        if (node.fills && Array.isArray(node.fills) && node.fills.length > 0) {
            score += 5;
        }
    }

    return Math.min(score, 30);
}

/**
 * Analisa conteúdo do nó (imagens, ícones, textos)
 */
function analyzeContent(node: SceneNode, pattern: WidgetPattern): number {
    let score = 0;
    const props = pattern.structure.properties;

    if (!props || !('children' in node)) return 0;

    const children = node.children;

    // Contar tipos de conteúdo
    const imageCount = children.filter(c =>
        c.type === 'RECTANGLE' && hasImageFill(c)
    ).length;

    const iconCount = children.filter(c =>
        c.type === 'VECTOR' ||
        (c.type === 'COMPONENT' && c.name.toLowerCase().includes('icon'))
    ).length;

    const textCount = children.filter(c => c.type === 'TEXT').length;

    // Verificar requisitos
    if (props.hasImage && imageCount > 0) {
        score += 7;
    }

    if (props.hasIcon && iconCount > 0) {
        score += 7;
    }

    if (props.hasText && textCount > 0) {
        score += 6;
    }

    if (props.textCount !== undefined && textCount === props.textCount) {
        score += 10;
    }

    return Math.min(score, 20);
}

/**
 * Verifica se um nó tem fill de imagem
 */
function hasImageFill(node: SceneNode): boolean {
    if (!('fills' in node)) return false;

    const fills = node.fills;
    if (!Array.isArray(fills)) return false;

    return fills.some(fill =>
        typeof fill === 'object' &&
        fill !== null &&
        'type' in fill &&
        fill.type === 'IMAGE'
    );
}
