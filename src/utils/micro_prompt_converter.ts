// Core micro-prompts converter - converts Figma nodes to Elementor using conversational AI
/// <reference types="@figma/plugin-typings" />

import { extractNodeData, NodeData } from './node_extractor';
import type { ConversationState, ProcessedNode, FinalOutput } from './conversation_types';
import * as Gemini from '../api_gemini';
import { MICRO_PROMPT_INIT, MICRO_PROMPT_NOMENCLATURES, buildNodePrompt, buildConsolidationPrompt } from '../config/prompts';

/**
 * Converte um node do Figma para Elementor usando micro-prompts conversacionais
 */
export async function convertWithMicroPrompts(
    node: SceneNode,
    availableImages: Record<string, Uint8Array>
): Promise<FinalOutput> {
    const state: ConversationState = {
        phase: 'init',
        processedNodes: [],
        currentNodeIndex: 0,
        totalNodes: 0
    };

    try {
        // 1. FASE: Inicialização
        figma.ui.postMessage({ type: 'add-gemini-log', data: '🤖 Fase 1: Inicializando conversa com IA...' });
        state.phase = 'init';

        await callGeminiWithRetry(MICRO_PROMPT_INIT, null, []);

        // 2. FASE: Nomenclaturas
        figma.ui.postMessage({ type: 'add-gemini-log', data: '📋 Fase 2: Enviando nomenclaturas de widgets...' });
        state.phase = 'nomenclatures';

        await callGeminiWithRetry(MICRO_PROMPT_NOMENCLATURES, null, []);

        // 3. FASE: Conversão node por node
        figma.ui.postMessage({ type: 'add-gemini-log', data: '🔨 Fase 3: Convertendo nodes...' });
        state.phase = 'conversion';

        const allNodes = flattenNodeHierarchy(node);
        state.totalNodes = allNodes.length;

        figma.ui.postMessage({
            type: 'add-gemini-log',
            data: `📊 Total de ${state.totalNodes} nodes para processar`
        });

        for (let i = 0; i < allNodes.length; i++) {
            const currentNode = allNodes[i];
            const nodeData = extractNodeData(currentNode);

            figma.ui.postMessage({
                type: 'add-gemini-log',
                data: `🔨 [${i + 1}/${state.totalNodes}] Convertendo: "${nodeData.name}"`
            });

            const prompt = buildNodePrompt(nodeData, i + 1, state.totalNodes);
            const response = await callGeminiWithRetry(prompt, null, Object.keys(availableImages));

            state.processedNodes.push(response);
            state.currentNodeIndex = i + 1;
        }

        // 4. FASE: Consolidação
        figma.ui.postMessage({ type: 'add-gemini-log', data: '🔗 Fase 4: Consolidando resultado final...' });
        state.phase = 'consolidation';

        const consolidationPrompt = buildConsolidationPrompt(state.processedNodes);
        const finalOutput = await callGeminiWithRetry(consolidationPrompt, null, []);

        figma.ui.postMessage({ type: 'add-gemini-log', data: '✅ Conversão concluída com sucesso!' });

        return finalOutput as FinalOutput;

    } catch (error: any) {
        figma.ui.postMessage({
            type: 'add-gemini-log',
            data: `❌ Erro na conversão: ${error.message}`
        });
        throw error;
    }
}

/**
 * Achata a hierarquia de nodes em uma lista linear
 */
function flattenNodeHierarchy(node: SceneNode): SceneNode[] {
    const result: SceneNode[] = [node];

    if ('children' in node) {
        for (const child of node.children) {
            result.push(...flattenNodeHierarchy(child));
        }
    }

    return result;
}

/**
 * Chama o Gemini com retry logic
 */
async function callGeminiWithRetry(
    prompt: string,
    imageData: Uint8Array | null,
    availableImageIds: string[],
    maxRetries = 3
): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Monta os dados para enviar ao Gemini
            const nodeData = { prompt }; // Simplificado para esta versão

            const result = await Gemini.analyzeAndRecreate(
                imageData || new Uint8Array(),
                availableImageIds,
                nodeData
            );

            return result;

        } catch (error: any) {
            if (attempt === maxRetries) {
                throw new Error(`Falha após ${maxRetries} tentativas: ${error.message}`);
            }

            const delay = attempt * 1000; // 1s, 2s, 3s
            figma.ui.postMessage({
                type: 'add-gemini-log',
                data: `⚠️ Tentativa ${attempt} falhou. Retrying em ${delay}ms...`
            });

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Retry logic failed unexpectedly');
}
