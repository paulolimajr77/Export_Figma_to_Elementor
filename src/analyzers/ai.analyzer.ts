import { WidgetMatch } from '../types/elementor.types';

/**
 * Pré-processador AI (stub): não chama IA, não infere widgets.
 * Retorna um match genérico para preservar o node.
 */
export async function analyzeWithAI(
    node: SceneNode,
    _apiKey: string,
    _model: string = 'gemini-1.5-flash'
): Promise<WidgetMatch[]> {
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
        method: 'ai',
        confidence: 0,
        reasoning: `Preserved without inference (${node.type})`
    };

    return [genericMatch];
}
