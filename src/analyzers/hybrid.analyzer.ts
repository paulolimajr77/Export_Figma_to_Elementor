import { analyzeStructural } from './structure.analyzer';
import { WidgetMatch, HybridConfig, HybridAnalysisResult } from '../types/elementor.types';

/**
 * Pré-processador híbrido simplificado:
 * Apenas retorna o resultado estrutural, sem IA visual ou inferências.
 */
export async function analyzeHybrid(
    node: SceneNode,
    _config: HybridConfig
): Promise<HybridAnalysisResult> {
    const matches: WidgetMatch[] = analyzeStructural(node);
    return {
        matches,
        method: 'structural',
        processingTime: 0
    };
}

export function clearAICache(): void {
    // no-op
}

export function getCacheStats(): { size: number; keys: string[] } {
    return { size: 0, keys: [] };
}
