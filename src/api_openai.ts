import { GenerateSchemaInput, SchemaProvider, SchemaResponse } from './types/providers';
import { PipelineSchema } from './types/pipeline.schema';

export type OpenAIModel =
    | 'gpt-4.1-mini'
    | 'gpt-4.1'
    | 'gpt-4.1-preview'
    | 'gpt-o1'
    | 'gpt-o3-mini';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_TIMEOUT_MS = 12000;
export const DEFAULT_GPT_MODEL: OpenAIModel = 'gpt-4.1-mini';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
    const AC: any = (typeof AbortController === 'function') ? AbortController : null;
    let controller: any = null;
    if (AC) {
        try { controller = new AC(); } catch { controller = null; }
    }
    if (!controller) {
        // Ambiente sem AbortController ou com implementacao quebrada
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
    const saved = await figma.clientStorage.getAsync('gptModel') || await figma.clientStorage.getAsync('gpt_model');
    return saved || DEFAULT_GPT_MODEL;
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

const JSON_SAFETY = 'Responda sempre em JSON (json) valido e completo.';

function mapStatusError(status: number, parsed: any): string {
    const base = (parsed as any)?.error?.message;
    if (status === 401) return 'API Key invalida (401).';
    if (status === 404) return 'Modelo nao encontrado (404).';
    if (status === 429) return 'Quota excedida (429).';
    if (status >= 500) return 'Erro interno da OpenAI (5xx).';
    return base || `HTTP ${status}`;
}

async function callOpenAI(apiKey: string, model: OpenAIModel, messages: any[], maxTokens = 8192, retries = 3): Promise<SchemaResponse> {
    const requestBody = {
        model,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }
    };

    let attempt = 0;
    while (attempt < retries) {
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
                const error = mapStatusError(response.status, parsed);
                if (response.status >= 400 && response.status < 500) {
                    return { ok: false, error, raw: parsed };
                }
                attempt++;
                if (attempt >= retries) return { ok: false, error, raw: parsed };
                await new Promise(res => setTimeout(res, 500 * attempt));
                continue;
            }

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            if (!content) {
                return { ok: false, error: 'Resposta vazia da OpenAI.', raw: data };
            }
            try {
                const schema = await parseJsonResponse(content);
                return { ok: true, data: schema, schema, raw: data };
            } catch (err: any) {
                return { ok: false, error: err?.message || 'Resposta nao JSON', raw: content };
            }
        } catch (err: any) {
            attempt++;
            if (attempt >= retries) {
                const aborted = err?.name === 'AbortError';
                const message = aborted ? 'Timeout na chamada OpenAI.' : (err?.message || 'Erro desconhecido ao chamar OpenAI.');
                return { ok: false, error: message, raw: err };
            }
            await new Promise(res => setTimeout(res, 500 * attempt));
        }
    }
    return { ok: false, error: 'Falha ao chamar OpenAI apos retries.' };
}

export async function testOpenAIConnection(apiKey: string, model: OpenAIModel): Promise<{ ok: boolean; error?: string; data?: any }> {
    const messages = [
        { role: 'system', content: `${JSON_SAFETY} Retorne {"pong": true}.` },
        { role: 'user', content: 'ping (json)' }
    ];
    const resp = await callOpenAI(apiKey, model, messages, 64, 1);
    return { ok: resp.ok, error: resp.error, data: resp.raw };
}

export const openaiProvider: SchemaProvider = {
    id: 'gpt',
    model: DEFAULT_GPT_MODEL,

    setModel(model: string) {
        this.model = model;
        saveOpenAIModel(model as OpenAIModel).catch(() => { /* best effort */ });
    },

    async generateSchema(input: GenerateSchemaInput): Promise<SchemaResponse> {
        const apiKey = input.apiKey || await getOpenAIKey();
        if (!apiKey) {
            return { ok: false, error: 'API Key do OpenAI nao configurada.' };
        }

        const model = this.model as OpenAIModel;
        const messages: any[] = [
            { role: 'system', content: `${input.instructions}\n${JSON_SAFETY}` },
            { role: 'user', content: input.prompt },
            { role: 'user', content: `SNAPSHOT (json esperado):\n${JSON.stringify(input.snapshot)}` }
        ];

        if (input.references && input.references.length > 0) {
            const refText = input.references.map(r => `### ${r.name}\n${r.content}`).join('\n\n');
            messages.push({ role: 'user', content: `REFERENCIAS:\n${refText}` });
        }

        if (input.image?.data) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: 'PRINT DO FRAME (PNG base64 inline):' },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${input.image.mimeType || 'image/png'};base64,${input.image.data}`
                        }
                    }
                ]
            });
        }

        const resp = await callOpenAI(apiKey, model, messages);
        if (!resp.ok) return resp;
        return { ok: true, schema: resp.schema, data: resp.data, raw: resp.raw };
    },

    async testConnection(apiKey?: string): Promise<{ ok: boolean; error?: string; data?: any }> {
        const keyToTest = apiKey || await getOpenAIKey();
        const model = this.model as OpenAIModel;
        if (!keyToTest) {
            return { ok: false, error: 'API Key do OpenAI nao configurada.' };
        }
        return await testOpenAIConnection(keyToTest, model);
    }
};
