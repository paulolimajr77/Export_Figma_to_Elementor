// Google Gemini API Integration using Official SDK
// Análise inteligente de layouts e criação automática de frames otimizados
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/// <reference types="@figma/plugin-typings" />
import { GoogleGenerativeAI } from "@google/generative-ai";
// ==================== Gerenciamento de API Key e Modelo ====================
export function saveKey(key) {
    return __awaiter(this, void 0, void 0, function* () {
        yield figma.clientStorage.setAsync('gemini_api_key', key);
    });
}
export function getKey() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield figma.clientStorage.getAsync('gemini_api_key');
    });
}
export function saveModel(model) {
    return __awaiter(this, void 0, void 0, function* () {
        yield figma.clientStorage.setAsync('gemini_model', model);
    });
}
export function getModel() {
    return __awaiter(this, void 0, void 0, function* () {
        const model = yield figma.clientStorage.getAsync('gemini_model');
        return model || "gemini-1.5-flash";
    });
}
// ==================== Funções da API ====================
export function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        const key = yield getKey();
        if (!key) {
            return { success: false, message: 'API Key não fornecida.' };
        }
        const modelName = yield getModel();
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: modelName });
            yield model.generateContent("Test");
            return { success: true, message: `Conectado com sucesso ao modelo ${modelName}!` };
        }
        catch (error) {
            console.error('Erro ao testar conexão com a SDK do Gemini:', error);
            return { success: false, message: `Falha na conexão: ${error.message || 'Erro desconhecido.'}` };
        }
    });
}
export function analyzeAndRecreate(imageData) {
    return __awaiter(this, void 0, void 0, function* () {
        const key = yield getKey();
        if (!key)
            throw new Error('API Key não configurada');
        const modelName = yield getModel();
        const base64Image = arrayBufferToBase64(imageData);
        const prompt = `
Analise este layout de interface e forneça instruções DETALHADAS para RECRIAR um novo frame otimizado.
Responda APENAS com JSON válido.
// ... (prompt omitido por brevidade, mas é o mesmo de antes)
`;
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: modelName });
            const generationConfig = {
                temperature: 0.4,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
            };
            const textPart = { text: prompt };
            const imagePart = {
                inlineData: {
                    mimeType: 'image/png',
                    data: base64Image
                }
            };
            const result = yield model.generateContent({
                contents: [{ role: "user", parts: [textPart, imagePart] }],
                generationConfig,
            });
            const response = result.response;
            const jsonText = response.text();
            return JSON.parse(jsonText);
        }
        catch (error) {
            console.error('Erro na chamada ao Gemini SDK:', error);
            throw new Error(`Erro na API Gemini: ${error.message}`);
        }
    });
}
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
