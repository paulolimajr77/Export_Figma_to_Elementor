import { WidgetMatch } from '../types/elementor.types';

/**
 * Pré-processador estrutural:
 * - não classifica por aparência,
 * - não infere widgets,
 * - não altera ordem ou remove nós.
 * Apenas devolve um match genérico para manter compatibilidade.
 */
export function analyzeStructural(node: SceneNode): WidgetMatch[] {
    const genericMatch: WidgetMatch = {
        pattern: {
            name: 'generic-node',
            tag: 'custom',
            minScore: 0,
            category: 'basic',
            structure: { rootType: [] },
            properties: {} as any
        } as any,
        score: 0,
        method: 'structural',
        confidence: 0,
        reasoning: `Preserved without inference (${node.type})`
    };

    return [genericMatch];
}
