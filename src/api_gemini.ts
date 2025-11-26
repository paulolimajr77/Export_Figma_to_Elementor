// Google Gemini API Integration using manual fetch
// Análise inteligente de layouts e criação automática de frames otimizados

/// <reference types="@figma/plugin-typings" />

import { ANALYZE_RECREATE_PROMPT } from './config/prompts';

// Define os modelos disponíveis (baseado em https://ai.google.dev/gemini-api/docs/models?hl=pt-br)
export type GeminiModel =
    // Gemini 2.5
    | 'gemini-2.5-pro'
    | 'gemini-2.5-flash'
    | 'gemini-2.5-flash-lite'
    // Gemini 2.0
    | 'gemini-2.0-flash'
    | 'gemini-2.0-flash-lite';

export const GEMINI_MODEL: GeminiModel = "gemini-2.5-flash";
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
    const savedModel = await figma.clientStorage.getAsync('gemini_model');
    return savedModel || GEMINI_MODEL;
}

// ==================== Funções da API ====================

export async function testConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = await getKey();
    if (!apiKey) {
        return { success: false, message: 'API Key não configurada' };
    }

    // Busca o modelo salvo ou usa o padrão
    const model = await getModel();
    console.log(`🧪 Testando conexão com modelo: ${model}`);

    const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: 'Olá' }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
            console.error('❌ Erro na resposta:', errorData);
            throw new GeminiError(`Falha na conexão: ${errorMessage}`);
        }

        return { success: true, message: `Conexão OK com ${model}!` };
    } catch (e: any) {
        console.error('Erro de rede ao testar conexão:', e);
        return { success: false, message: e.message || 'Erro desconhecido' };
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


// ==================== Fase 4: Consolidação ====================

export async function consolidateNodes(processedNodes: ProcessedNode[]): Promise<ConsolidationResult> {
    const apiKey = await getKey();
    if (!apiKey) throw new GeminiError('API Key não configurada.');

    const model = await getModel();
    const endpoint = `${API_BASE_URL}${model}:generateContent?key=${apiKey}`;

    const prompt = buildConsolidationPrompt(processedNodes);

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.2, // Baixa temperatura para maior precisão estrutural
            maxOutputTokens: 8192,
            response_mime_type: "application/json",
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new GeminiError(`Erro na consolidação: ${response.status}`, response.status, errorData);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (!candidate?.content?.parts?.[0]?.text) {
            throw new GeminiError("Resposta vazia da consolidação.");
        }

        const responseText = candidate.content.parts[0].text;

        // Extrair JSON da resposta (pode vir envolto em markdown)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new GeminiError("JSON não encontrado na resposta de consolidação.");

        return JSON.parse(jsonMatch[0]);

    } catch (error: any) {
        console.error('Erro na consolidação:', error);
        throw new GeminiError(`Falha na consolidação: ${error.message}`);
    }
}

function buildConsolidationPrompt(nodes: ProcessedNode[]): string {
    return `
CONSOLIDAÇÃO FINAL - ELEMENTOR JSON

Você recebeu ${nodes.length} nodes processados individualmente.
Sua tarefa é montar a hierarquia final e gerar um JSON válido para importação no Elementor.

NODES PROCESSADOS:
${JSON.stringify(nodes, null, 2)}

TAREFA:
1. Reconstrur a árvore hierárquica baseada nos parentIds e childrenIds.
2. Validar se todos os widgets são válidos (w:container, w:heading, etc).
3. Converter propriedades de estilo para o formato final do Elementor.
4. Gerar relatório técnico.

FORMATO DE SAÍDA (JSON):
{
  "elementorJSON": {
    "version": "0.4",
    "title": "Figma Import",
    "type": "page",
    "content": [
      // Array de elementos raiz (Containers principais)
      // Cada elemento deve ter "id", "elType" ("section", "column", "widget"), "settings", "elements"
    ]
  },
  "report": {
    "summary": {
      "totalNodes": ${nodes.length},
      "converted": 0, // Preencher
      "custom": 0,    // Preencher
      "warnings": 0   // Preencher
    },
    "mappings": [
      { "nodeId": "...", "widget": "...", "status": "success|warning" }
    ],
    "warnings": [
      "Aviso 1...",
      "Aviso 2..."
    ]
  }
}

REGRAS CRÍTICAS:
- O JSON deve seguir estritamente a estrutura do Elementor (sections > columns > widgets) OU Containers (preferencial).
- Se um node for "w:container", ele deve virar um Container do Elementor.
- MAPPING DE AUTO LAYOUT:
  - direction: "row" -> settings: { "flex_direction": "row", "container_type": "flex" }
  - direction: "vertical" -> settings: { "flex_direction": "column", "container_type": "flex" }
  - primaryAlign: "MIN" -> justify_content: "flex-start" (ou start)
  - primaryAlign: "CENTER" -> justify_content: "center"
  - primaryAlign: "MAX" -> justify_content: "flex-end" (ou end)
  - primaryAlign: "SPACE_BETWEEN" -> justify_content: "space-between"
  - counterAlign: "MIN" -> align_items: "flex-start" (ou start)
  - counterAlign: "CENTER" -> align_items: "center"
  - counterAlign: "MAX" -> align_items: "flex-end" (ou end)
- IDs devem ser únicos.
`;
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