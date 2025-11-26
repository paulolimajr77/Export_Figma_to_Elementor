// DeepSeek API Integration (OpenAI Compatible)
// Análise inteligente de layouts e criação automática de frames otimizados

/// <reference types="@figma/plugin-typings" />

import { ANALYZE_RECREATE_PROMPT, buildConsolidationPrompt } from './config/prompts';
import { repairJson } from './utils/serialization_utils';
import { LayoutAnalysis, ProcessedNode, ConsolidationResult } from './api_gemini'; // Reutilizando tipos

// Define os modelos disponíveis
export type DeepSeekModel =
    | 'deepseek-chat'
    | 'deepseek-coder';

export const DEEPSEEK_MODEL: DeepSeekModel = "deepseek-chat";
export const API_BASE_URL = 'https://api.deepseek.com/chat/completions';

// ... (rest of the file)

export async function consolidateNodes(processedNodes: ProcessedNode[]): Promise<ConsolidationResult> {
    const apiKey = await getDeepSeekKey();
    if (!apiKey) throw new DeepSeekError('API Key não configurada.');

    const model = await getDeepSeekModel();
    const prompt = buildConsolidationPrompt(processedNodes);

    const requestBody = {
        model: model,
        messages: [
            { role: "system", content: "You are an expert Elementor developer. Consolidate the provided nodes into a valid Elementor JSON structure." },
            { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 8192,
        response_format: { type: "json_object" }
    };

    try {
        console.log(`🚀 Enviando consolidação para DeepSeek (${model})...`);

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new DeepSeekError(`Erro na consolidação DeepSeek: ${response.status}`, response.status, errorData);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new DeepSeekError("Resposta vazia da consolidação DeepSeek.");
        }

        // Extrair JSON da resposta
        let jsonString = content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        }

        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn("JSON inválido na consolidação. Tentando reparar...", e);
            try {
                const repairedJson = repairJson(jsonString);
                return JSON.parse(repairedJson);
            } catch (repairError) {
                console.error("Falha ao reparar JSON de consolidação:", repairError);
                throw new DeepSeekError(`JSON de consolidação inválido e irreparável: ${e}`);
            }
        }

    } catch (error: any) {
        console.error('Erro na consolidação DeepSeek:', error);
        throw new DeepSeekError(`Falha na consolidação: ${error.message}`);
    }
}

// ==================== Custom Error Class ====================

export class DeepSeekError extends Error {
    constructor(message: string, public statusCode?: number, public details?: any) {
        super(message);
        this.name = 'DeepSeekError';
    }
}

// ==================== Gerenciamento de API Key e Modelo ====================

export async function saveDeepSeekKey(key: string): Promise<void> {
    await figma.clientStorage.setAsync('deepseek_api_key', key);
}

export async function getDeepSeekKey(): Promise<string | undefined> {
    return await figma.clientStorage.getAsync('deepseek_api_key');
}

export async function saveDeepSeekModel(model: DeepSeekModel): Promise<void> {
    await figma.clientStorage.setAsync('deepseek_model', model);
}

export async function getDeepSeekModel(): Promise<DeepSeekModel> {
    const savedModel = await figma.clientStorage.getAsync('deepseek_model');
    return savedModel || DEEPSEEK_MODEL;
}

// ==================== Funções da API ====================

export async function testDeepSeekConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = await getDeepSeekKey();
    if (!apiKey) {
        return { success: false, message: 'API Key não configurada' };
    }

    const model = await getDeepSeekModel();
    console.log(`🧪 Testando conexão com DeepSeek (${model})...`);

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: "Hello" }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
            console.error('❌ Erro na resposta DeepSeek:', errorData);
            throw new DeepSeekError(`Falha na conexão: ${errorMessage}`);
        }

        return { success: true, message: `Conexão OK com DeepSeek (${model})!` };
    } catch (e: any) {
        console.error('Erro de rede ao testar conexão DeepSeek:', e);
        return { success: false, message: e.message || 'Erro desconhecido' };
    }
}

export async function analyzeLayoutDeepSeek(
    nodeData: any,
    originalNodeId: string,
    imageData: Uint8Array
): Promise<LayoutAnalysis> {
    const apiKey = await getDeepSeekKey();
    if (!apiKey) throw new DeepSeekError('API Key não configurada.');

    const model = await getDeepSeekModel();

    // Constrói o prompt substituindo o placeholder
    const prompt = ANALYZE_RECREATE_PROMPT.replace('${nodeData}', JSON.stringify(nodeData, null, 2));

    const requestBody = {
        model: model,
        messages: [
            { role: "system", content: "You are an expert UI/UX designer and Elementor developer." },
            { role: "user", content: prompt }
        ],
        temperature: 0.2, // Baixa temperatura para maior precisão estrutural
        max_tokens: 8192,
        response_format: { type: "json_object" } // DeepSeek suporta JSON mode
    };

    // Log do prompt completo (para debug)
    const fullLog = `--- PROMPT ENVIADO PARA DEEPSEEK ---\n${JSON.stringify(requestBody.messages, null, 2)}`;
    figma.ui.postMessage({ type: 'add-gemini-log', data: fullLog });

    try {
        console.log(`🚀 Enviando análise para DeepSeek (${model})...`);

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new DeepSeekError(`Erro na API DeepSeek: ${response.status}`, response.status, errorData);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new DeepSeekError("Resposta vazia da API DeepSeek.");
        }

        // Log da resposta bruta (para debug) - SEM TRUNCAR
        figma.ui.postMessage({ type: 'add-gemini-log', data: `--- RESPOSTA DEEPSEEK ---\n${content}` });

        // Extrair JSON da resposta (pode vir envolto em markdown)
        let jsonString = content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        }

        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn("JSON inválido detectado. Tentando reparar...", e);
            try {
                const repairedJson = repairJson(jsonString);
                return JSON.parse(repairedJson);
            } catch (repairError) {
                console.error("Falha ao reparar JSON:", repairError);
                throw new DeepSeekError(`A IA retornou um JSON inválido e irreparável: ${e}`);
            }
        }

    } catch (error: any) {
        console.error('Erro na análise DeepSeek:', error);
        throw new DeepSeekError(`Falha na análise: ${error.message}`);
    }
}
