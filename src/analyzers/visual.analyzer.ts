import { WidgetMatch } from '../types/elementor.types';
import { widgetPatterns } from '../config/widget.patterns';

/**
 * Resultado da análise visual com IA
 */
export interface VisualAnalysis {
    widget: string;
    confidence: number;
    reasoning: string;
    visualFeatures: string[];
    alternatives: Array<{
        widget: string;
        confidence: number;
    }>;
}

/**
 * Cache de screenshots em memória
 */
interface CachedScreenshot {
    data: Uint8Array;
    timestamp: number;
}

const screenshotCache = new Map<string, CachedScreenshot>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const MAX_CACHE_SIZE = 50; // Máximo 50 screenshots

/**
 * Captura screenshot de um elemento do Figma
 */
async function captureElementScreenshot(node: SceneNode): Promise<Uint8Array> {
    try {
        const screenshot = await node.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 2 } // 2x para melhor qualidade
        });

        console.log(`[Visual] Screenshot capturado: ${node.name} (${screenshot.length} bytes)`);
        figma.ui.postMessage({ type: 'add-log', message: `[Visual] Screenshot capturado: ${node.name} (${screenshot.length} bytes)`, level: 'info' });
        return screenshot;
    } catch (error) {
        console.error('[Visual] Erro ao capturar screenshot:', error);
        throw error;
    }
}

/**
 * Limpa screenshots expirados do cache
 */
function cleanExpiredCache(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of screenshotCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            screenshotCache.delete(key);
            removed++;
        }
    }

    if (removed > 0) {
        console.log(`[Cache] 🗑️ Removidos ${removed} screenshots expirados`);
    }
}

/**
 * Limpa cache se estiver muito grande
 */
function enforceMaxCacheSize(): void {
    if (screenshotCache.size > MAX_CACHE_SIZE) {
        // Remover os mais antigos
        const entries = Array.from(screenshotCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toRemove = entries.slice(0, screenshotCache.size - MAX_CACHE_SIZE);
        toRemove.forEach(([key]) => screenshotCache.delete(key));

        console.log(`[Cache] 🗑️ Removidos ${toRemove.length} screenshots antigos (limite: ${MAX_CACHE_SIZE})`);
    }
}

/**
 * Obtém screenshot do cache ou captura novo
 */
async function getCachedScreenshot(node: SceneNode): Promise<Uint8Array> {
    const nodeId = node.id;

    // Limpar cache expirado
    cleanExpiredCache();

    // Verificar se existe no cache
    const cached = screenshotCache.get(nodeId);
    if (cached) {
        console.log(`[Cache] ✅ Screenshot encontrado: ${node.name}`);
        return cached.data;
    }

    // Capturar novo screenshot
    console.log(`[Cache] 📸 Capturando novo screenshot: ${node.name}`);
    const screenshot = await captureElementScreenshot(node);

    // Adicionar ao cache
    screenshotCache.set(nodeId, {
        data: screenshot,
        timestamp: Date.now()
    });

    // Aplicar limite de tamanho
    enforceMaxCacheSize();

    return screenshot;
}

/**
 * Limpa todo o cache de screenshots
 */
export function clearScreenshotCache(): void {
    const size = screenshotCache.size;
    screenshotCache.clear();
    console.log(`[Cache] 🗑️ Cache limpo (${size} screenshots removidos)`);
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats(): { size: number; keys: string[] } {
    return {
        size: screenshotCache.size,
        keys: Array.from(screenshotCache.keys())
    };
}

/**
 * Converte Uint8Array para base64 (sem usar btoa que não existe no Figma)
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
    const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i;

    for (i = 0; i < bytes.length; i += 3) {
        const byte1 = bytes[i];
        const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

        const encoded1 = byte1 >> 2;
        const encoded2 = ((byte1 & 3) << 4) | (byte2 >> 4);
        const encoded3 = ((byte2 & 15) << 2) | (byte3 >> 6);
        const encoded4 = byte3 & 63;

        result += base64chars[encoded1];
        result += base64chars[encoded2];
        result += i + 1 < bytes.length ? base64chars[encoded3] : '=';
        result += i + 2 < bytes.length ? base64chars[encoded4] : '=';
    }

    return result;
}

/**
 * Cria prompt especializado para análise visual
 */
function createVisualPrompt(
    node: SceneNode,
    algorithmResults: WidgetMatch[]
): string {
    const nodeInfo = {
        name: node.name,
        type: node.type,
        width: 'width' in node ? Math.round(node.width) : 0,
        height: 'height' in node ? Math.round(node.height) : 0,
        childCount: 'children' in node ? node.children.length : 0
    };

    const algorithmTop3 = algorithmResults.slice(0, 3).map((match, i) =>
        `${i + 1}. ${match.pattern.tag} (${Math.round(match.score)}%)`
    ).join('\n');

    return `Você é um especialista em Elementor (WordPress page builder).

TAREFA:
Analise a imagem e identifique qual widget do Elementor melhor representa este elemento.

WIDGETS DISPONÍVEIS:
- w:button (botões clicáveis com texto)
- w:heading (títulos/cabeçalhos)
- w:text-editor (parágrafos de texto)
- w:image (imagens simples)
- w:image-box (imagem + título + descrição)
- w:icon (ícone simples SVG/vetor)
- w:icon-box (ícone + título + descrição em layout vertical)
- w:divider (separadores/linhas horizontais)
- w:spacer (espaçamento vazio)
- c:container (containers/seções que agrupam outros elementos)

CONTEXTO DO ELEMENTO:
Nome: "${nodeInfo.name}"
Tipo Figma: ${nodeInfo.type}
Dimensões: ${nodeInfo.width}x${nodeInfo.height}px
Filhos: ${nodeInfo.childCount}

ANÁLISE ALGORÍTMICA (referência):
${algorithmTop3}

INSTRUÇÕES:
1. Analise a imagem visualmente
2. Identifique padrões visuais (cores, formas, layout, tipografia)
3. Compare com os widgets do Elementor
4. Considere a análise algorítmica mas priorize sua análise visual
5. Se for um ícone circular com texto abaixo, é w:icon-box
6. Se for um botão com fundo colorido e texto, é w:button
7. Se for apenas uma imagem sem texto, é w:image

RESPONDA APENAS COM JSON VÁLIDO (sem markdown, sem \`\`\`):
{
  "widget": "w:xxx",
  "confidence": 85,
  "reasoning": "Breve explicação (máx 50 palavras)",
  "visualFeatures": ["feature1", "feature2"],
  "alternatives": [
    {"widget": "w:yyy", "confidence": 40}
  ]
}`;
}

/**
 * Analisa elemento visualmente usando Gemini Vision
 */
export async function analyzeVisual(
    node: SceneNode,
    algorithmResults: WidgetMatch[],
    apiKey: string,
    model: string = 'gemini-1.5-flash-latest'
): Promise<VisualAnalysis> {
    console.log(`[Visual] Iniciando análise visual de: ${node.name}`);
    figma.ui.postMessage({ type: 'add-log', message: `[Visual] Iniciando análise visual de: ${node.name}`, level: 'info' });

    try {
        // 1. Capturar screenshot (com cache)
        const screenshot = await getCachedScreenshot(node);
        const base64Image = uint8ArrayToBase64(screenshot);

        // Log visual com imagem
        figma.ui.postMessage({
            type: 'add-log',
            message: `[Visual] Screenshot capturado para análise: ${node.name}`,
            level: 'info',
            image: base64Image
        });

        // 2. Criar prompt
        const prompt = createVisualPrompt(node, algorithmResults);

        // 3. Enviar para Gemini Vision
        // 3. Enviar para Gemini Vision
        console.log('[Visual] Enviando para Gemini Vision...');
        figma.ui.postMessage({ type: 'add-log', message: '[Visual] Enviando para Gemini Vision...', level: 'info' });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/png',
                                    data: base64Image
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.2, // Baixa temperatura para respostas mais consistentes
                        maxOutputTokens: 500
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        console.log('[Visual] Resposta da IA:', aiResponse);
        figma.ui.postMessage({ type: 'add-log', message: `[Visual] Resposta da IA: ${aiResponse.substring(0, 100)}...`, level: 'info' });

        // 4. Parse da resposta JSON
        // Remover markdown se presente
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Resposta da IA não contém JSON válido');
        }

        const analysis: VisualAnalysis = JSON.parse(jsonMatch[0]);

        console.log(`[Visual] Análise concluída: ${analysis.widget} (${analysis.confidence}%)`);
        figma.ui.postMessage({ type: 'add-log', message: `[Visual] Análise concluída: ${analysis.widget} (${analysis.confidence}%)`, level: 'success' });

        return analysis;

    } catch (error) {
        console.error('[Visual] Erro na análise visual:', error);
        throw error;
    }
}

/**
 * Combina resultados do algoritmo estrutural com análise visual da IA
 */
export function combineResults(
    structural: WidgetMatch[],
    visual: VisualAnalysis
): WidgetMatch {
    const structuralBest = structural[0];

    console.log('[Visual] Combinando resultados:');
    figma.ui.postMessage({ type: 'add-log', message: '[Visual] Combinando resultados:', level: 'info' });

    console.log(`  Algoritmo: ${structuralBest.pattern.tag} (${structuralBest.score}%)`);
    figma.ui.postMessage({ type: 'add-log', message: `  Algoritmo: ${structuralBest.pattern.tag} (${structuralBest.score}%)`, level: 'info' });

    console.log(`  IA Visual: ${visual.widget} (${visual.confidence}%)`);
    figma.ui.postMessage({ type: 'add-log', message: `  IA Visual: ${visual.widget} (${visual.confidence}%)`, level: 'info' });

    // Encontrar padrão correspondente ao widget da IA
    const aiPattern = widgetPatterns.find(p => p.tag === visual.widget);
    if (!aiPattern) {
        console.warn(`[Visual] Padrão não encontrado para: ${visual.widget}`);
        return {
            pattern: structuralBest.pattern,
            score: structuralBest.score,
            method: 'structural' as const,
            confidence: 50
        };
    }

    // Caso 1: Ambos concordam (alta confiança)
    if (structuralBest.pattern.tag === visual.widget) {
        const combinedScore = Math.max(structuralBest.score, visual.confidence);
        console.log(`[Visual] ✅ Concordância! Score combinado: ${combinedScore}%`);
        figma.ui.postMessage({ type: 'add-log', message: `[Visual] ✅ Concordância! Score combinado: ${combinedScore}%`, level: 'success' });

        return {
            pattern: structuralBest.pattern,
            score: combinedScore,
            method: 'hybrid' as const,
            confidence: combinedScore,
            reasoning: `Algoritmo e IA concordam. ${visual.reasoning}`
        };
    }

    // Caso 2: IA tem alta confiança (>85%)
    if (visual.confidence > 85) {
        console.log(`[Visual] 🤖 IA confiante (${visual.confidence}%) - usando resultado da IA`);
        figma.ui.postMessage({ type: 'add-log', message: `[Visual] 🤖 IA confiante (${visual.confidence}%) - usando resultado da IA`, level: 'info' });

        return {
            pattern: aiPattern,
            score: visual.confidence,
            method: 'ai' as const,
            confidence: visual.confidence,
            reasoning: visual.reasoning
        };
    }

    // Caso 3: Algoritmo tem alta confiança (>85%)
    if (structuralBest.score > 85) {
        console.log(`[Visual] ⚡ Algoritmo confiante (${structuralBest.score}%) - usando resultado algorítmico`);
        figma.ui.postMessage({ type: 'add-log', message: `[Visual] ⚡ Algoritmo confiante (${structuralBest.score}%) - usando resultado algorítmico`, level: 'info' });

        return {
            pattern: structuralBest.pattern,
            score: structuralBest.score,
            method: 'structural' as const,
            confidence: structuralBest.score,
            reasoning: `Algoritmo confiante. IA sugere ${visual.widget} (${visual.confidence}%)`
        };
    }

    // Caso 4: Ambos incertos - usar IA como desempate
    const avgScore = Math.round((structuralBest.score + visual.confidence) / 2);
    console.log(`[Visual] ⚖️ Desempate - usando IA. Score médio: ${avgScore}%`);
    figma.ui.postMessage({ type: 'add-log', message: `[Visual] ⚖️ Desempate - usando IA. Score médio: ${avgScore}%`, level: 'warn' });

    return {
        pattern: aiPattern,
        score: avgScore,
        method: 'hybrid' as const,
        confidence: avgScore,
        reasoning: `Desempate por IA. ${visual.reasoning}`
    };
}
