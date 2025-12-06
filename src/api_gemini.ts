// Integracao Gemini ajustada para containers flex
/// <reference types="@figma/plugin-typings" />

import { ANALYZE_RECREATE_PROMPT } from './config/prompts';
import { repairJson } from './utils/serialization_utils';
import { GenerateSchemaInput, SchemaProvider, SchemaResponse } from './types/providers';
import { PipelineSchema } from './types/pipeline.schema';

export type GeminiModel =
    | 'gemini-2.0-flash-exp'
    | 'gemini-1.5-pro-002'
    | 'gemini-1.5-flash-002';

export const GEMINI_MODEL: GeminiModel = 'gemini-1.5-flash-002';
export const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const DEFAULT_TIMEOUT_MS = 12000;

export class GeminiError extends Error {
    constructor(message: string, public statusCode?: number, public details?: any) {
        super(message);
        this.name = 'GeminiError';
    }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
    const AC: any = (typeof AbortController === 'function') ? AbortController : null;
    let controller: any = null;
    if (AC) {
        try { controller = new AC(); } catch { controller = null; }
    }
    if (!controller) {
        // Fallback para ambientes sem AbortController (Figma sandbox)
        return await fetch(url, options);
    }
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

function cleanJson(content: string): string {
    return content.replace(/```json/gi, '').replace(/```/g, '').trim();
}

function parseGeminiJson(content: string): PipelineSchema {
    const clean = cleanJson(content);
    return JSON.parse(clean) as PipelineSchema;
}

// ==================== Teste de conexao ====================
export async function testConnection(): Promise<{ success: boolean; ok: boolean; message: string }> {
    const apiKey = await getKey();
    if (!apiKey) return { success: false, ok: false, message: 'API Key nao configurada' };

    const endpoint = `${API_BASE_URL}?key=${apiKey}`;
    try {
        const response = await fetchWithTimeout(endpoint, { method: 'GET' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = (errorData as any)?.error?.message || `HTTP ${response.status}`;
            throw new GeminiError(`Falha na conexao: ${message}`, response.status, errorData);
        }
        return { success: true, ok: true, message: 'Conexao com Gemini verificada.' };
    } catch (e: any) {
        const aborted = e?.name === 'AbortError';
        const baseMessage = aborted ? 'Tempo limite ao testar conexao.' : (e?.message || 'Erro desconhecido');
        return { success: false, ok: false, message: baseMessage };
    }
}

export const geminiProvider: SchemaProvider = {
    id: 'gemini',
    model: GEMINI_MODEL,

    setModel(model: string) {
        this.model = model;
        saveModel(model as GeminiModel).catch(() => { /* best effort */ });
    },

    async generateSchema(input: GenerateSchemaInput): Promise<SchemaResponse> {
        const apiKey = input.apiKey || await getKey();
        if (!apiKey) {
            return { ok: false, message: 'API Key do Gemini nao configurada.' };
        }

        const model = this.model || GEMINI_MODEL;
        const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;

        const parts: any[] = [
            { text: input.instructions },
            { text: input.prompt },
            { text: `SNAPSHOT:\n${JSON.stringify(input.snapshot)}` }
        ];

        if (input.references && input.references.length > 0) {
            const refText = input.references.map(ref => `### ${ref.name}\n${ref.content}`).join('\n\n');
            parts.push({ text: `REFERENCIAS:\n${refText}` });
        }

        if (input.image?.data) {
            parts.push({
                inlineData: {
                    data: input.image.data,
                    mimeType: input.image.mimeType || 'image/png'
                }
            });
        }

        const contents = [{ parts }];

        const requestBody = {
            contents,
            generationConfig: {
                temperature: 0.15,
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
                const rawText = await response.text();
                let parsed: any = null;
                try { parsed = JSON.parse(rawText); } catch { parsed = rawText; }
                const message = (parsed as any)?.error?.message || `HTTP ${response.status}`;
                return { ok: false, message: `Falha na API Gemini: ${message}`, raw: parsed };
            }

            const data = await response.json();
            const text = (data as any)?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                return { ok: false, message: 'Resposta vazia da Gemini.', raw: data };
            }

            try {
                const schema = parseGeminiJson(text);
                return { ok: true, schema, raw: data };
            } catch {
                // tenta reparar JSON para nao descartar nenhum node
                try {
                    const repaired = repairJson(cleanJson(text));
                    const schema = JSON.parse(repaired) as PipelineSchema;
                    return { ok: true, schema, raw: data };
                } catch (err) {
                    return { ok: false, message: 'Resposta nao JSON da Gemini.', raw: text };
                }
            }
        } catch (err: any) {
            const aborted = err?.name === 'AbortError';
            const message = aborted ? 'Timeout na chamada Gemini.' : (err?.message || 'Erro desconhecido na Gemini.');
            return { ok: false, message, raw: err };
        }
    },

    async testConnection(apiKey?: string): Promise<{ ok: boolean; message: string; raw?: any }> {
        const keyToTest = apiKey || await getKey();
        if (!keyToTest) return { ok: false, message: 'API Key nao configurada' };

        const endpoint = `${API_BASE_URL}?key=${keyToTest}`;
        try {
            const response = await fetchWithTimeout(endpoint, { method: 'GET' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = (errorData as any)?.error?.message || `HTTP ${response.status}`;
                return { ok: false, message: `Falha na conexao: ${message}`, raw: errorData };
            }
            return { ok: true, message: 'Conexao com Gemini verificada.' };
        } catch (e: any) {
            const aborted = e?.name === 'AbortError';
            const baseMessage = aborted ? 'Tempo limite ao testar conexao.' : (e?.message || 'Erro desconhecido');
            return { ok: false, message: baseMessage, raw: e };
        }
    }
};

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
