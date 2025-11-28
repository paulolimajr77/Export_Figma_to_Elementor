import { GenerateSchemaInput, SchemaProvider, SchemaResponse } from './types/providers';
import { PipelineSchema } from './types/pipeline.schema';

export type OpenAIModel = 'gpt-4.1' | 'gpt-o1' | 'gpt-mini';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_MODEL: OpenAIModel = 'gpt-4.1';

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

export async function saveOpenAIKey(key: string): Promise<void> {
    await figma.clientStorage.setAsync('gpt_api_key', key);
}

export async function getOpenAIKey(): Promise<string | undefined> {
    return await figma.clientStorage.getAsync('gpt_api_key');
}

export async function saveOpenAIModel(model: OpenAIModel): Promise<void> {
    await figma.clientStorage.setAsync('gpt_model', model);
}

export async function getOpenAIModel(): Promise<OpenAIModel> {
    const saved = await figma.clientStorage.getAsync('gpt_model');
    return saved || DEFAULT_MODEL;
}

function cleanJson(content: string): string {
    return content.replace(/```json/gi, '').replace(/```/g, '').trim();
}

async function parseJsonResponse(rawContent: string): Promise<PipelineSchema> {
    const clean = cleanJson(rawContent);
    try {
        return JSON.parse(clean) as PipelineSchema;
    } catch (err) {
        throw new Error('Resposta nao JSON');
    }
}

export const openaiProvider: SchemaProvider = {
    id: 'gpt',
    model: DEFAULT_MODEL,

    setModel(model: string) {
        this.model = model;
        saveOpenAIModel(model as OpenAIModel).catch(() => { /* best effort */ });
    },

    async generateSchema(input: GenerateSchemaInput): Promise<SchemaResponse> {
        const apiKey = input.apiKey || await getOpenAIKey();
        if (!apiKey) {
            return { ok: false, message: 'API Key do OpenAI nao configurada.' };
        }

        const requestBody = {
            model: this.model,
            messages: [
                { role: 'system', content: input.instructions },
                { role: 'user', content: input.prompt },
                { role: 'user', content: `SNAPSHOT:\n${JSON.stringify(input.snapshot)}` }
            ],
            temperature: 0.2,
            max_tokens: 8192,
            response_format: { type: 'json_object' }
        };

        try {
            const response = await fetchWithTimeout(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const rawText = await response.text();
                let parsed: any = null;
                try { parsed = JSON.parse(rawText); } catch { parsed = rawText; }
                const message = (parsed as any)?.error?.message || `HTTP ${response.status}`;
                return { ok: false, message: `Falha na API OpenAI: ${message}`, raw: parsed };
            }

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            if (!content) {
                return { ok: false, message: 'Resposta vazia da OpenAI.', raw: data };
            }

            try {
                const schema = await parseJsonResponse(content);
                return { ok: true, schema, raw: data };
            } catch (err: any) {
                return { ok: false, message: err?.message || 'Resposta nao JSON', raw: content };
            }
        } catch (err: any) {
            const aborted = err?.name === 'AbortError';
            const message = aborted ? 'Timeout na chamada OpenAI.' : (err?.message || 'Erro desconhecido ao chamar OpenAI.');
            return { ok: false, message, raw: err };
        }
    },

    async testConnection(apiKey?: string): Promise<{ ok: boolean; message: string; raw?: any }> {
        const keyToTest = apiKey || await getOpenAIKey();
        if (!keyToTest) {
            return { ok: false, message: 'API Key do OpenAI nao configurada.' };
        }

        const requestBody = {
            model: this.model,
            messages: [
                { role: 'user', content: 'ping' }
            ],
            temperature: 0,
            max_tokens: 16,
            response_format: { type: 'json_object' }
        };

        try {
            const response = await fetchWithTimeout(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${keyToTest}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const rawText = await response.text();
                let parsed: any = null;
                try { parsed = JSON.parse(rawText); } catch { parsed = rawText; }
                const message = (parsed as any)?.error?.message || `HTTP ${response.status}`;
                return { ok: false, message: `Falha ao testar OpenAI: ${message}`, raw: parsed };
            }

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            if (!content) {
                return { ok: false, message: 'Resposta vazia.', raw: data };
            }

            try {
                await parseJsonResponse(content);
                return { ok: true, message: 'Conexao com OpenAI verificada.', raw: data };
            } catch {
                return { ok: false, message: 'Resposta nao JSON ao testar OpenAI.', raw: content };
            }
        } catch (err: any) {
            const aborted = err?.name === 'AbortError';
            const message = aborted ? 'Timeout ao testar conexao OpenAI.' : (err?.message || 'Erro desconhecido ao testar OpenAI.');
            return { ok: false, message, raw: err };
        }
    }
};
