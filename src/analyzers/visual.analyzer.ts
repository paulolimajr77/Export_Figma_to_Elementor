import { WidgetMatch } from '../types/elementor.types';

/**
 * Resultado mínimo da análise visual (stub).
 */
export interface VisualAnalysis {
    widget: string;
    confidence: number;
    reasoning: string;
    visualFeatures: string[];
    alternatives: Array<{ widget: string; confidence: number }>;
}

/**
 * Pré-processador visual: não usa IA, não classifica por aparência.
 * Apenas retorna um resultado genérico para manter compatibilidade.
 */
export async function analyzeVisual(
    _node: SceneNode,
    _algorithmResults: WidgetMatch[],
    _apiKey: string,
    _model: string = 'gemini-1.5-flash-latest'
): Promise<VisualAnalysis> {
    return {
        widget: 'custom',
        confidence: 0,
        reasoning: 'Preprocess only; no visual inference.',
        visualFeatures: [],
        alternatives: []
    };
}

/**
 * Combina resultados mantendo o estrutural como prioritário.
 */
export function combineResults(structural: WidgetMatch[], visual: VisualAnalysis): WidgetMatch {
    const structuralBest = structural[0];
    if (structuralBest) {
        return {
            ...structuralBest,
            method: structuralBest.method,
            confidence: structuralBest.score
        };
    }

    return {
        pattern: {
            name: 'generic-node',
            tag: 'custom',
            minScore: 0,
            category: 'basic',
            structure: { rootType: [] },
            properties: {} as any
        } as any,
        score: visual.confidence || 0,
        method: 'structural',
        confidence: visual.confidence || 0,
        reasoning: visual.reasoning
    };
}

export function clearScreenshotCache(): void {
    // no-op
}

export function getCacheStats(): { size: number; keys: string[] } {
    return { size: 0, keys: [] };
}
