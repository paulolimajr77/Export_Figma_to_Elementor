import { analyzeStructural } from './structure.analyzer';
import { analyzeVisual, combineResults } from './visual.analyzer';
import { WidgetMatch, HybridConfig, HybridAnalysisResult } from '../types/elementor.types';

/**
 * Análise híbrida - Versão 2.0 (Estrutural + IA Visual)
 * Combina análise algorítmica com Gemini Vision para máxima precisão
 */
export async function analyzeHybrid(
    node: SceneNode,
    config: HybridConfig
): Promise<HybridAnalysisResult> {
    const startTime = Date.now();

    console.log('[Hybrid] 🔍 Iniciando análise híbrida...');
    figma.ui.postMessage({ type: 'add-log', message: '[Hybrid] 🔍 Iniciando análise híbrida...', level: 'info' });

    console.log(`[Hybrid] Usar IA: ${config.useAIFallback ? 'Sim' : 'Não'}`);
    figma.ui.postMessage({ type: 'add-log', message: `[Hybrid] Usar IA: ${config.useAIFallback ? 'Sim' : 'Não'}`, level: 'info' });

    // 1. Sempre executar análise estrutural primeiro (rápida e grátis)
    console.log('[Hybrid] ⚡ Executando análise estrutural...');
    figma.ui.postMessage({ type: 'add-log', message: '[Hybrid] ⚡ Executando análise estrutural...', level: 'info' });
    const structuralMatches = analyzeStructural(node);
    const bestStructural = structuralMatches[0];

    if (!bestStructural) {
        console.warn('[Hybrid] ⚠️ Nenhum match estrutural encontrado - usando fallback');
        figma.ui.postMessage({ type: 'add-log', message: '[Hybrid] ⚠️ Nenhum match estrutural encontrado - usando fallback', level: 'warn' });

        // Criar match genérico baseado no tipo do nó
        const fallbackMatch = createFallbackMatch(node);

        return {
            matches: [fallbackMatch],
            method: 'structural', // Mantém 'structural' para compatibilidade
            processingTime: Date.now() - startTime
        };
    }

    console.log(`[Hybrid] ⚡ Melhor match estrutural: ${bestStructural.pattern.tag} (${bestStructural.score}%)`);
    figma.ui.postMessage({ type: 'add-log', message: `[Hybrid] ⚡ Melhor match estrutural: ${bestStructural.pattern.tag} (${bestStructural.score}%)`, level: 'info' });

    // 2. Decidir se usa IA
    const shouldUseAI = config.useAIFallback && config.apiKey;

    if (!shouldUseAI) {
        console.log('[Hybrid] ℹ️ IA desabilitada ou sem API key - usando apenas algoritmo');
        figma.ui.postMessage({ type: 'add-log', message: '[Hybrid] ℹ️ IA desabilitada ou sem API key - usando apenas algoritmo', level: 'info' });
        return {
            matches: structuralMatches,
            method: 'structural',
            processingTime: Date.now() - startTime
        };
    }

    // 3. Verificar se vale a pena usar IA (só se algoritmo estiver incerto)
    // REDUZIDO: 85% → 70% para melhorar taxa de reconhecimento
    const threshold = config.structuralThreshold || 70;

    if (bestStructural.score >= threshold) {
        console.log(`[Hybrid] ✅ Algoritmo confiante (${bestStructural.score}% >= ${threshold}%) - pulando IA`);
        figma.ui.postMessage({ type: 'add-log', message: `[Hybrid] ✅ Algoritmo confiante (${bestStructural.score}% >= ${threshold}%) - pulando IA`, level: 'success' });
        return {
            matches: structuralMatches,
            method: 'structural',
            processingTime: Date.now() - startTime
        };
    }

    // 4. Executar análise visual com IA
    try {
        console.log('[Hybrid] 🤖 Algoritmo incerto - chamando IA Visual...');
        figma.ui.postMessage({ type: 'add-log', message: '[Hybrid] 🤖 Algoritmo incerto - chamando IA Visual...', level: 'info' });

        const visualAnalysis = await analyzeVisual(
            node,
            structuralMatches,
            config.apiKey!,
            config.model
        );

        console.log(`[Hybrid] 🤖 IA retornou: ${visualAnalysis.widget} (${visualAnalysis.confidence}%)`);
        figma.ui.postMessage({ type: 'add-log', message: `[Hybrid] 🤖 IA retornou: ${visualAnalysis.widget} (${visualAnalysis.confidence}%)`, level: 'info' });

        // 5. Combinar resultados
        const combinedMatch = combineResults(structuralMatches, visualAnalysis);

        console.log(`[Hybrid] ✨ Resultado final: ${combinedMatch.pattern.tag} (${combinedMatch.score}%) via ${combinedMatch.method}`);
        figma.ui.postMessage({ type: 'add-log', message: `[Hybrid] ✨ Resultado final: ${combinedMatch.pattern.tag} (${combinedMatch.score}%) via ${combinedMatch.method}`, level: 'success' });

        // Retornar com o match combinado como primeiro
        const finalMatches = [
            combinedMatch,
            ...structuralMatches.slice(1)
        ];

        return {
            matches: finalMatches,
            method: combinedMatch.method,
            processingTime: Date.now() - startTime
        };

    } catch (error: any) {
        console.error('[Hybrid] ❌ Erro na análise visual:', error);
        figma.ui.postMessage({ type: 'add-log', message: `[Hybrid] ❌ Erro na análise visual: ${error.message || error}`, level: 'error' });

        console.log('[Hybrid] 🔄 Fallback para resultado estrutural');
        figma.ui.postMessage({ type: 'add-log', message: '[Hybrid] 🔄 Fallback para resultado estrutural', level: 'warn' });

        // Fallback: retornar resultado estrutural
        return {
            matches: structuralMatches,
            method: 'structural',
            processingTime: Date.now() - startTime
        };
    }
}

/**
 * Cria um match genérico baseado no tipo do nó Figma
 * Usado como fallback quando não há match estrutural
 */
function createFallbackMatch(node: SceneNode): WidgetMatch {
    let tag = 'c:container';
    let name = 'Container Genérico';
    let score = 30;

    switch (node.type) {
        case 'TEXT':
            tag = 'w:heading';
            name = 'Heading (Texto)';
            score = 40;
            break;
        case 'RECTANGLE':
        case 'ELLIPSE':
        case 'POLYGON':
        case 'STAR':
        case 'LINE':
        case 'VECTOR':
            tag = 'w:divider';
            name = 'Divider (Forma)';
            score = 35;
            break;
        case 'FRAME':
        case 'GROUP':
            if ('children' in node && node.children.length > 0) {
                tag = 'c:container';
                name = 'Container';
                score = 50;
            } else {
                tag = 'w:spacer';
                name = 'Spacer (Vazio)';
                score = 40;
            }
            break;
        case 'INSTANCE':
        case 'COMPONENT':
            tag = 'c:container';
            name = 'Container (Componente)';
            score = 45;
            break;
        default:
            tag = 'c:container';
            name = 'Container Desconhecido';
            score = 30;
    }

    return {
        pattern: {
            name: name,
            tag: tag,
            minScore: 0,
            category: 'basic',
            structure: {
                rootType: [],
                properties: {}
            }
        },
        score: score,
        method: 'structural',
        confidence: score,
        reasoning: `Fallback genérico para tipo ${node.type}`
    };
}

/**
 * Limpa cache (placeholder para versão futura)
 */
export function clearAICache(): void {
    console.log('[Hybrid] Cache limpo');
}

/**
 * Estatísticas do cache (placeholder)
 */
export function getCacheStats(): { size: number; keys: string[] } {
    return { size: 0, keys: [] };
}
