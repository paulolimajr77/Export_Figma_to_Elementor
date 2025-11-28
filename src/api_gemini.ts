// Integração Gemini ajustada para containers flex
/// <reference types="@figma/plugin-typings" />

import { ANALYZE_RECREATE_PROMPT } from './config/prompts';
import { repairJson } from './utils/serialization_utils';

export type GeminiModel =
    | 'gemini-2.5-pro'
    | 'gemini-2.5-flash'
    | 'gemini-2.5-flash-lite'
    | 'gemini-2.0-flash'
    | 'gemini-2.0-flash-lite';

export const GEMINI_MODEL: GeminiModel = 'gemini-2.5-flash';
export const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const DEFAULT_TIMEOUT_MS = 12000;

export class GeminiError extends Error {
    constructor(message: string, public statusCode?: number, public details?: any) {
        super(message);
        this.name = 'GeminiError';
    }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const resp = await fetch(url, { ...options, signal: controller.signal });
        return resp;
    } finally {
        clearTimeout(id);
    }
}

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
    const savedModel = await figma.clientStorage.getAsync('gemini_model');
    return savedModel || GEMINI_MODEL;
}

// ==================== Teste de conexão ====================
export async function testConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = await getKey();
    if (!apiKey) return { success: false, message: 'API Key não configurada' };

    const endpoint = `${API_BASE_URL}?key=${apiKey}&pageSize=1`;
    try {
        const response = await fetchWithTimeout(endpoint, { method: 'GET' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData?.error?.message || `HTTP ${response.status}`;
            throw new GeminiError(`Falha na conexão: ${message}`, response.status, errorData);
        }
        return { success: true, message: 'Conexão com Gemini verificada.' };
    } catch (e: any) {
        const aborted = e?.name === 'AbortError';
        const baseMessage = aborted ? 'Tempo limite ao testar conexão.' : (e?.message || 'Erro desconhecido');
        return { success: false, message: baseMessage };
    }
}

// ==================== Geração (análise + recriação) ====================
export async function analyzeAndRecreate(
    imageData: Uint8Array,
    availableImageIds: string[] = [],
    nodeData: any = null,
    promptType: 'full' | 'micro' = 'full'
): Promise<LayoutAnalysis> {
    const apiKey = await getKey();
    if (!apiKey) throw new GeminiError('API Key não configurada. Configure em Settings.');

    const model = await getModel();
    const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;

    // micro-prompt só texto
    if (promptType === 'micro' && nodeData?.prompt) {
        const requestBody = {
            contents: [{ parts: [{ text: nodeData.prompt }] }]
        };
        const response = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new GeminiError(`Gemini API error: ${response.statusText}`, response.status, errorData);
        }
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        try {
            return JSON.parse(textResponse);
        } catch {
            return { response: textResponse } as any;
        }
    }

    const base64Image = arrayBufferToBase64(imageData);
    const width = nodeData ? nodeData.width : 1440;
    const height = nodeData ? nodeData.height : 900;
    const prompt = ANALYZE_RECREATE_PROMPT
        .replace('${availableImageIds}', availableImageIds.join(', '))
        .replace('${nodeData}', nodeData ? JSON.stringify(nodeData, null, 2) : 'Sem dados estruturais.')
        .replace(/\${width}/g, width.toString())
        .replace(/\${height}/g, height.toString());

    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/png', data: base64Image } }
            ]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            response_mime_type: 'application/json'
        }
    };

    const requestLog = { ...requestBody, contents: [{ parts: [{ text: prompt }, { text: '[imagem omitida]' }] }] };
    figma.ui.postMessage({ type: 'add-gemini-log', data: `--- REQUISIÇÃO ---\n${JSON.stringify(requestLog, null, 2)}` });

    try {
        const response = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData?.error?.message || `Erro na API: ${response.status}`;
            throw new GeminiError(errorMessage, response.status, errorData);
        }

        const data = await response.json();
        figma.ui.postMessage({ type: 'add-gemini-log', data: `--- RESPOSTA ---\n${JSON.stringify(data, null, 2)}` });

        if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
            const errorMessage = data.error?.message || 'Resposta vazia ou malformada.';
            throw new GeminiError(errorMessage, undefined, data);
        }

        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            throw new GeminiError('Conteúdo vazio.');
        }

        let responseText = candidate.content.parts[0].text;
        const startIndex = responseText.indexOf('{');
        if (startIndex === -1) throw new GeminiError('Nenhum objeto JSON encontrado na resposta.');
        let endIndex = responseText.lastIndexOf('}');
        if (endIndex === -1 || endIndex < startIndex) endIndex = responseText.length;
        let jsonString = responseText.substring(startIndex, endIndex + 1);

        try {
            return JSON.parse(jsonString);
        } catch (e) {
            try {
                const repairedJson = repairJson(jsonString);
                return JSON.parse(repairedJson);
            } catch (repairError) {
                if (candidate.finishReason === 'MAX_TOKENS') {
                    throw new GeminiError('Resposta truncada; reduza o frame.', undefined, { finishReason: 'MAX_TOKENS' });
                }
                throw new GeminiError('Falha ao processar JSON retornado pela IA.', undefined, repairError);
            }
        }
    } catch (error: any) {
        figma.ui.postMessage({ type: 'add-gemini-log', data: `--- ERRO ---\n${error.message}` });
        if (error instanceof GeminiError) throw error;
        throw new GeminiError(`Erro na API Gemini: ${error.message}`, undefined, error);
    }
}

export async function consolidateNodes(processedNodes: ProcessedNode[]): Promise<ConsolidationResult> {
    const apiKey = await getKey();
    if (!apiKey) throw new GeminiError('API Key não configurada.');

    const model = await getModel();
    const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;
    const prompt = buildConsolidationPrompt(processedNodes);

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            response_mime_type: 'application/json'
        }
    };

    try {
        const response = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new GeminiError(`Erro na consolidação: ${response.status}`, response.status, errorData);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate?.content?.parts?.[0]?.text) {
            throw new GeminiError('Resposta vazia da consolidação.');
        }

        const responseText = candidate.content.parts[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new GeminiError('JSON não encontrado na resposta de consolidação.');

        let jsonString = jsonMatch[0];
        try {
            return JSON.parse(jsonString);
        } catch (parseError) {
            try {
                const repairedJson = repairJson(jsonString);
                return JSON.parse(repairedJson);
            } catch (repairError) {
                throw new GeminiError(`JSON malformado e não reparável: ${repairError}`);
            }
        }
    } catch (error: any) {
        throw new GeminiError(`Falha na consolidação: ${error.message}`);
    }
}

function buildConsolidationPrompt(nodes: ProcessedNode[]): string {
    return `
CONSOLIDACAO FINAL - ELEMENTOR JSON (FLEX CONTAINERS)

Voce recebeu ${nodes.length} nodes processados individualmente.
Monte a hierarquia final usando elType "container" e widgets basicos (heading, text, button, image, icon, custom).

REGRAS:
- Nao crie sections/columns.
- Use flex_direction row/column conforme direction.
- Preserve todos os nodes: nenhum pode sumir.
- IDs unicos.

NODES:
${JSON.stringify(nodes, null, 2)}
`;
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

// ==================== Tipos ====================
export interface LayoutAnalysis {
    frameName: string;
    width: number;
    height: number;
    autoLayout?: AutoLayoutConfig;
    background?: string;
    fills?: any[];
    children: ChildNode[];
    improvements?: string[];
    type?: string;
}

export interface ChildNode {
    type: 'container' | 'widget' | string;
    name: string;
    widgetType?: string;
    content?: string;
    characters?: string;
    fontSize?: number;
    color?: string;
    width?: number;
    height?: number;
    background?: string;
    fills?: any[];
    autoLayout?: AutoLayoutConfig;
    children?: ChildNode[];
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
    textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
    textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
    style?: any;
    cornerRadius?: number;
    border?: string | { color: string; width: number };
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

export interface ProcessedNode {
    nodeId: string;
    widget: string;
    confidence: 'high' | 'medium' | 'low';
    settings: any;
    reasoning?: string;
    parentId?: string;
    children?: string[];
}

export interface ConsolidationResult {
    elementorJSON: {
        version: string;
        title?: string;
        type?: string;
        content: any[];
    };
    report: {
        summary: {
            totalNodes: number;
            converted: number;
            custom: number;
            warnings: number;
        };
        mappings: { nodeId: string; widget: string; status: string }[];
        customNodes?: any[];
        warnings: string[];
    };
}
