// Google Gemini API Integration using manual fetch
// Análise inteligente de layouts e criação automática de frames otimizados

/// <reference types="@figma/plugin-typings" />

import { ANALYZE_RECREATE_PROMPT } from './config/prompts';

// Define os modelos disponíveis
export type GeminiModel = "gemini-2.5-flash-lite";
export const GEMINI_MODEL: GeminiModel = "gemini-2.5-flash-lite";
export const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

// ==================== Custom Error Class ====================

export class GeminiError extends Error {
    constructor(message: string, public statusCode?: number, public details?: any) {
        super(message);
        this.name = 'GeminiError';
    }
}

// ==================== Gerenciamento de API Key e Modelo ====================

export async function saveKey(key: string): Promise<void> {
    await figma.clientStorage.setAsync('gemini_api_key', key);
}

export async function getKey(): Promise<string | undefined> {
    return await figma.clientStorage.getAsync('gemini_api_key');
}

export async function saveModel(model: GeminiModel): Promise<void> {
    await figma.clientStorage.setAsync('gemini_model', model);
}

export async function getModel(): Promise<GeminiModel> {
    return GEMINI_MODEL;
}

// ==================== Funções da API ====================

export async function testConnection(): Promise<{ success: boolean; message?: string }> {
    const key = await getKey();
    if (!key) {
        return { success: false, message: 'API Key não fornecida.' };
    }

    const modelName = await getModel();
    const fullApiUrl = `${API_BASE_URL}${modelName}:generateContent?key=${key}`;

    try {
        const response = await fetch(fullApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Test' }] }]
            })
        });

        if (response.ok) {
            return { success: true, message: `Conectado com sucesso ao modelo ${modelName}!` };
        } else {
            const errorData = await response.json();
            const errorMessage = errorData?.error?.message || `Erro ${response.status}: ${response.statusText}`;
            throw new GeminiError(`Falha na conexão: ${errorMessage}`, response.status, errorData);
        }
    } catch (error: any) {
        console.error('Erro de rede ao testar conexão:', error);
        if (error instanceof GeminiError) {
            return { success: false, message: error.message };
        }
        return { success: false, message: `Erro de rede: ${error.message || 'Verifique sua conexão.'}` };
    }
}

function repairJson(jsonString: string): string {
    let repaired = jsonString.trim();

    // Remove potential trailing commas
    if (repaired.endsWith(',')) {
        repaired = repaired.slice(0, -1);
    }

    // Count brackets/braces to close them
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (char === '\\' && !escaped) {
            escaped = true;
            continue;
        }
        if (char === '"' && !escaped) {
            inString = !inString;
        }
        if (!inString) {
            if (char === '{') openBraces++;
            if (char === '}') openBraces--;
            if (char === '[') openBrackets++;
            if (char === ']') openBrackets--;
        }
        escaped = false;
    }

    // Close unclosed strings (rough heuristic)
    if (inString) {
        repaired += '"';
    }

    // Close arrays and objects
    while (openBrackets > 0) {
        repaired += ']';
        openBrackets--;
    }
    while (openBraces > 0) {
        repaired += '}';
        openBraces--;
    }

    return repaired;
}

export async function analyzeAndRecreate(
    imageData: Uint8Array,
    availableImageIds: string[] = [],
    nodeData: any = null,
    promptType: 'full' | 'micro' = 'full'
): Promise<LayoutAnalysis> {
    const apiKey = await getKey();
    if (!apiKey) {
        throw new GeminiError('API Key não configurada. Configure em Settings.');
    }

    const model = await getModel();
    const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;

    // Para micro-prompts, usar apenas texto
    if (promptType === 'micro' && nodeData?.prompt) {
        const requestBody = {
            contents: [{
                parts: [{ text: nodeData.prompt }]
            }]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new GeminiError(
                `Gemini API error: ${response.statusText}`,
                response.status,
                errorData
            );
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        try {
            return JSON.parse(textResponse);
        } catch {
            return { response: textResponse } as any;
        }
    }

    // Converte imagem para base64
    const base64Image = arrayBufferToBase64(imageData);

    // Monta o prompt com os dados do node
    const width = nodeData ? nodeData.width : 1440;
    const height = nodeData ? nodeData.height : 900;
    const halfHeight = nodeData ? Math.round(nodeData.height / 2) : 500;
    const halfWidth = nodeData ? Math.round(nodeData.width * 0.5) : 800;
    const thirdWidth = nodeData ? Math.round(nodeData.width * 0.3) : 400;
    const thirdHeight = nodeData ? Math.round(nodeData.height * 0.3) : 300;
    const firstImageId = availableImageIds[0] || 'ID_DA_IMAGEM_AQUI';

    const prompt = ANALYZE_RECREATE_PROMPT
        .replace('\${availableImageIds}', availableImageIds.join(', '))
        .replace('\${nodeData}', nodeData ? JSON.stringify(nodeData, null, 2) : 'No structural data available.')
        .replace(/\${width}/g, width.toString())
        .replace(/\${height}/g, height.toString())
        .replace(/\${halfHeight}/g, halfHeight.toString())
        .replace(/\${halfWidth}/g, halfWidth.toString())
        .replace(/\${thirdWidth}/g, thirdWidth.toString())
        .replace(/\${thirdHeight}/g, thirdHeight.toString())
        .replace('\${firstImageId}', firstImageId);


    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/png', data: base64Image } }
            ]
        }],
        generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8192,
            response_mime_type: "application/json",
        }
    };

    // Log da requisição (sem a imagem)
    const requestLog = { ...requestBody, contents: [{ parts: [{ text: prompt }, { text: "[imagem omitida]" }] }] };
    figma.ui.postMessage({ type: 'add-gemini-log', data: `--- REQUISIÇÃO ---\n${JSON.stringify(requestLog, null, 2)}` });

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData?.error?.message || `Erro na API: ${response.status}`;
            throw new GeminiError(errorMessage, response.status, errorData);
        }

        const data = await response.json();

        // Log da resposta
        figma.ui.postMessage({ type: 'add-gemini-log', data: `--- RESPOSTA ---\n${JSON.stringify(data, null, 2)}` });

        // Valida se a resposta tem o formato esperado
        if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
            const errorMessage = data.error?.message || "A API retornou uma resposta vazia ou malformada.";
            throw new GeminiError(errorMessage, undefined, data);
        }

        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            throw new GeminiError("A API retornou um conteúdo vazio.");
        }

        let responseText = candidate.content.parts[0].text;
        const startIndex = responseText.indexOf('{');

        if (startIndex === -1) {
            throw new GeminiError("Nenhum objeto JSON encontrado na resposta.");
        }

        let endIndex = responseText.lastIndexOf('}');
        if (endIndex === -1 || endIndex < startIndex) {
            endIndex = responseText.length;
        }

        let jsonString = responseText.substring(startIndex, endIndex + 1);

        try {
            const result: LayoutAnalysis = JSON.parse(jsonString);
            return result;
        } catch (e) {
            console.warn("JSON inválido detectado. Tentando reparar...", e);
            try {
                const repairedJson = repairJson(jsonString);
                const result: LayoutAnalysis = JSON.parse(repairedJson);
                return result;
            } catch (repairError) {
                console.error("Falha ao reparar JSON:", repairError);
                if (candidate.finishReason === 'MAX_TOKENS') {
                    throw new GeminiError("A resposta foi cortada e não pôde ser recuperada. Tente simplificar o frame.", undefined, { finishReason: 'MAX_TOKENS' });
                }
                throw new GeminiError("Falha ao processar o JSON retornado pela IA.", undefined, repairError);
            }
        }
    } catch (error: any) {
        figma.ui.postMessage({ type: 'add-gemini-log', data: `--- ERRO ---\n${error.message}` });
        console.error('Erro na chamada fetch para o Gemini:', error);
        if (error instanceof GeminiError) throw error;
        throw new GeminiError(`Erro na API Gemini: ${error.message}`, undefined, error);
    }
}

function arrayBufferToBase64(buffer: Uint8Array): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    const len = buffer.length;

    while (i < len) {
        const byte1 = buffer[i++];
        const byte2 = (i < len) ? buffer[i++] : NaN;
        const byte3 = (i < len) ? buffer[i++] : NaN;

        const enc1 = byte1 >> 2;
        const enc2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
        const enc3 = ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
        const enc4 = byte3 & 63;

        result += chars.charAt(enc1) + chars.charAt(enc2);
        if (isNaN(byte2)) {
            result += '==';
        } else {
            result += chars.charAt(enc3);
            if (isNaN(byte3)) {
                result += '=';
            } else {
                result += chars.charAt(enc4);
            }
        }
    }
    return result;
}





// ==================== Interfaces ====================

export interface LayoutAnalysis {
    frameName: string;
    width: number;
    height: number;
    autoLayout?: AutoLayoutConfig;
    background?: string;
    fills?: any[]; // Suporte a fills diretos (Figma JSON)
    children: ChildNode[];
    improvements?: string[];
    type?: string; // FRAME, SECTION, etc.
}

export interface ChildNode {
    type: 'container' | 'widget' | string; // 'string' para suportar tipos do Figma (FRAME, TEXT, etc.)
    name: string;
    widgetType?: string;
    content?: string;
    characters?: string; // Alias para content (Figma JSON)
    fontSize?: number;
    color?: string;
    width?: number;
    height?: number;
    background?: string;
    fills?: any[]; // Suporte a fills diretos
    autoLayout?: AutoLayoutConfig;
    children?: ChildNode[];
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    style?: any; // Suporte a objeto de estilo do Figma
    cornerRadius?: number;
}

export interface AutoLayoutConfig {
    direction: 'horizontal' | 'vertical';
    primaryAlign?: string;
    counterAlign?: string;
    gap?: number;
    padding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}