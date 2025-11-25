// Google Gemini API Integration using manual fetch
// Análise inteligente de layouts e criação automática de frames otimizados

/// <reference types="@figma/plugin-typings" />

// Define os modelos disponíveis
export type GeminiModel = "gemini-2.5-flash";

const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

// ==================== Gerenciamento de API Key e Modelo ====================

export async function saveKey(key: string): Promise<void> {
    await figma.clientStorage.setAsync('gemini_api_key', key);
}

export async function getKey(): Promise<string | undefined> {
    return await figma.clientStorage.getAsync('gemini_api_key');
}

export async function saveModel(model: GeminiModel): Promise<void> {
    // Como há apenas um modelo agora, esta função não faz muito, mas é mantida para estrutura.
    await figma.clientStorage.setAsync('gemini_model', model);
}

export async function getModel(): Promise<GeminiModel> {
    // Retorna sempre o único modelo disponível.
    return "gemini-2.5-flash";
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
            return { success: false, message: `Falha na conexão: ${errorMessage}` };
        }
    } catch (error: any) {
        console.error('Erro de rede ao testar conexão:', error);
        return { success: false, message: `Erro de rede: ${error.message || 'Verifique sua conexão.'}` };
    }
}

export async function analyzeAndRecreate(imageData: Uint8Array, availableImageIds: string[] = []): Promise<LayoutAnalysis> {
    const key = await getKey();
    if (!key) throw new Error('API Key não configurada');

    const modelName = await getModel();
    const fullApiUrl = `${API_BASE_URL}${modelName}:generateContent?key=${key}`;

    const base64Image = arrayBufferToBase64(imageData);

    const prompt = `
Analise este layout de interface e forneça instruções DETALHADAS para RECRIAR um novo frame otimizado.
O objetivo é clonar a estrutura e o conteúdo visual o mais fielmente possível usando Auto-Layout.

IMAGENS DISPONÍVEIS (IDs):
${availableImageIds.join(', ')}

Responda APENAS com JSON válido seguindo ESTRITAMENTE esta estrutura:

{
  "frameName": "Nome do Frame",
  "width": 1440,
  "height": 900,
  "background": "#FFFFFF",
  "autoLayout": { "direction": "vertical", "gap": 0, "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 } },
  "children": [
    {
      "type": "container",
      "name": "w:container", // Use prefixo w: para widgets Elementor
      "background": "transparent",
      "width": 1440,
      "height": 500,
      "autoLayout": { "direction": "vertical", "gap": 20, "padding": { "top": 40, "right": 40, "bottom": 40, "left": 40 } },
      "children": [
        {
          "type": "widget",
          "widgetType": "heading",
          "name": "w:heading",
          "content": "TEXTO EXATO DA IMAGEM",
          "fontSize": 48,
          "color": "#333333",
          "width": 800,
          "height": 60
        },
        {
          "type": "widget",
          "widgetType": "image",
          "name": "w:image",
          "content": "${availableImageIds[0] || 'ID_DA_IMAGEM_AQUI'}", // Use o ID da imagem se corresponder visualmente
          "width": 400,
          "height": 300
        }
      ]
    }
  ],
  "improvements": ["Lista de melhorias aplicadas"]
}

Regras CRITICAS:
1. Extraia TODO o texto da imagem exatamente como ele aparece.
2. Estime as dimensões (width/height) de TODOS os elementos.
3. Para IMAGENS: Se a imagem visual corresponder a um dos IDs listados acima, use o ID no campo "content". Caso contrário, descreva a imagem.
4. NOMENCLATURA: Use SEMPRE o prefixo "w:" no campo "name" para mapear para widgets Elementor (ex: "w:heading", "w:text", "w:button", "w:image", "w:container", "w:icon-box").
5. Identifique cores hexadecimais aproximadas.
6. Use Auto-Layout para tudo.
`;

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
        const response = await fetch(fullApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData?.error?.message || `Erro na API: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Log da resposta
        figma.ui.postMessage({ type: 'add-gemini-log', data: `--- RESPOSTA ---\n${JSON.stringify(data, null, 2)}` });

        // Valida se a resposta tem o formato esperado
        if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
            const errorMessage = data.error?.message || "A API retornou uma resposta vazia ou malformada.";
            throw new Error(errorMessage);
        }

        // A API com response_mime_type="application/json" retorna o JSON diretamente no campo de texto,
        // mas para garantir, limpamos a resposta para extrair apenas o objeto JSON.
        const responseText = data.candidates[0].content.parts[0].text;
        const startIndex = responseText.indexOf('{');
        const endIndex = responseText.lastIndexOf('}');

        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
            throw new Error("Nenhum objeto JSON válido encontrado na resposta da API.");
        }

        const jsonText = responseText.substring(startIndex, endIndex + 1);
        return JSON.parse(jsonText);

    } catch (error: any) {
        // Log do erro
        figma.ui.postMessage({ type: 'add-gemini-log', data: `--- ERRO ---\n${error.message}` });
        console.error('Erro na chamada fetch para o Gemini:', error);
        throw new Error(`Erro na API Gemini: ${error.message}`);
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
    children: ChildNode[];
    improvements?: string[];
}

export interface ChildNode {
    type: 'container' | 'widget';
    name: string;
    widgetType?: string;
    content?: string;
    fontSize?: number;
    color?: string;
    width?: number;
    height?: number;
    background?: string;
    autoLayout?: AutoLayoutConfig;
    children?: ChildNode[];
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