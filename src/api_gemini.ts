// Google Gemini API Integration using Official SDK
// Análise inteligente de layouts e criação automática de frames otimizados

/// <reference types="@figma/plugin-typings" />

import { GoogleGenerativeAI, GenerationConfig, Content, Part } from "@google/generative-ai";

// Define os modelos disponíveis
export type GeminiModel = "gemini-1.5-flash" | "gemini-1.5-pro";

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
    const model = await figma.clientStorage.getAsync('gemini_model');
    return (model as GeminiModel) || "gemini-1.5-flash";
}

// ==================== Funções da API ====================

export async function testConnection(): Promise<{ success: boolean; message?: string }> {
    const key = await getKey();
    if (!key) {
        return { success: false, message: 'API Key não fornecida.' };
    }

    const modelName = await getModel();

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("Test");
        return { success: true, message: `Conectado com sucesso ao modelo ${modelName}!` };
    } catch (error: any) {
        console.error('Erro ao testar conexão com a SDK do Gemini:', error);
        return { success: false, message: `Falha na conexão: ${error.message || 'Erro desconhecido.'}` };
    }
}

export async function analyzeAndRecreate(imageData: Uint8Array): Promise<LayoutAnalysis> {
    const key = await getKey();
    if (!key) throw new Error('API Key não configurada');

    const modelName = await getModel();
    const base64Image = arrayBufferToBase64(imageData);

    const prompt = `
Analise este layout de interface e forneça instruções DETALHADAS para RECRIAR um novo frame otimizado.
Responda APENAS com JSON válido.
// ... (prompt omitido por brevidade, mas é o mesmo de antes)
`;

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });

        const generationConfig: GenerationConfig = {
            temperature: 0.4,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
        };
        
        const textPart: Part = { text: prompt };
        const imagePart: Part = {
            inlineData: {
                mimeType: 'image/png',
                data: base64Image
            }
        };

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [textPart, imagePart] }],
            generationConfig,
        });

        const response = result.response;
        const jsonText = response.text();
        return JSON.parse(jsonText);

    } catch (error: any) {
        console.error('Erro na chamada ao Gemini SDK:', error);
        throw new Error(`Erro na API Gemini: ${error.message}`);
    }
}

function arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
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
