// Google Gemini API Integration using manual fetch
// Análise inteligente de layouts e criação automática de frames otimizados

/// <reference types="@figma/plugin-typings" />

// Define os modelos disponíveis
export type GeminiModel = "gemini-2.5-flash-lite";
export const GEMINI_MODEL: GeminiModel = "gemini-2.5-flash-lite";
export const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

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
            return { success: false, message: `Falha na conexão: ${errorMessage}` };
        }
    } catch (error: any) {
        console.error('Erro de rede ao testar conexão:', error);
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

export async function analyzeAndRecreate(imageData: Uint8Array, availableImageIds: string[] = [], nodeData: any = null): Promise<LayoutAnalysis> {
    const key = await getKey();
    if (!key) throw new Error('API Key não configurada');

    const modelName = await getModel();
    const fullApiUrl = `${API_BASE_URL}${modelName}:generateContent?key=${key}`;

    const base64Image = arrayBufferToBase64(imageData);

    const prompt = `
Act as an EXPERT in Figma and Elementor.
Your goal is to visually and structurally interpret the layout of the sent frame and recreate it using the best practices of responsive design and Auto Layout.

1. ANALYZE the layout screenshot and the STRUCTURAL DATA below.
2. APPLY the best practices of Auto Layout, responsiveness, visual hierarchy, and organization.
3. MAP each Figma layer to the most suitable native Elementor widget (e.g., Layer "Title" -> w:heading, Layer "Image" -> w:image).
4. PRESERVE visual fidelity using the provided data as the ABSOLUTE SOURCE OF TRUTH.

AVAILABLE IMAGES (IDs):
${availableImageIds.join(', ')}

STRUCTURAL CONTEXT (FIGMA DATA):
${nodeData ? JSON.stringify(nodeData, null, 2) : 'No structural data available.'}

CRITICAL VISUAL FIDELITY RULES:
1. DIMENSIONS: Copy EXACTLY the "width" and "height" from the structural JSON for each element. DO NOT invent values.
2. BACKGROUNDS: Extract "fills" from the JSON. If "SOLID", use the hex color. If "GRADIENT", try to reproduce or use the main color.
3. IMAGES: If the JSON has "fills" of type "IMAGE", map to the correct image widget.
4. TEXT: Copy the text EXACTLY as it is in the "characters" field of the JSON.

VALID WIDGET LIST (Use EXACTLY these tags in the "name" field):

**Widgets Básicos (Elementor Free)**
- w:container, w:inner-container, w:heading, w:text-editor, w:image, w:video, w:button, w:divider, w:spacer, w:icon, w:icon-box, w:image-box, w:star-rating, w:counter, w:progress, w:tabs, w:accordion, w:toggle, w:alert, w:social-icons, w:soundcloud, w:shortcode, w:html, w:menu-anchor, w:sidebar, w:read-more, w:image-carousel, w:basic-gallery, w:gallery, w:icon-list, w:nav-menu, w:search-form, w:google-maps, w:testimonial, w:embed, w:lottie, loop:grid

**Widgets Elementor Pro**
- w:form, w:login, w:subscription, w:call-to-action, media:carousel, w:portfolio, w:gallery-pro, slider:slides, w:slideshow, w:flip-box, w:animated-headline, w:post-navigation, w:share-buttons, w:table-of-contents, w:countdown, w:blockquote, w:testimonial-carousel, w:review-box, w:hotspots, w:sitemap, w:author-box, w:price-table, w:price-list, w:progress-tracker, w:animated-text, w:nav-menu-pro, w:breadcrumb, w:facebook-button, w:facebook-comments, w:facebook-embed, w:facebook-page, loop:builder, loop:grid-advanced, loop:carousel, w:post-excerpt, w:post-content, w:post-title, w:post-info, w:post-featured-image, w:post-author, w:post-date, w:post-terms, w:archive-title, w:archive-description, w:site-logo, w:site-title, w:site-tagline, w:search-results, w:global-widget, w:video-playlist, w:video-gallery

**WooCommerce Widgets**
- woo:product-title, woo:product-image, woo:product-price, woo:product-add-to-cart, woo:product-data-tabs, woo:product-excerpt, woo:product-rating, woo:product-stock, woo:product-meta, woo:product-additional-information, woo:product-short-description, woo:product-related, woo:product-upsells, woo:product-tabs, woo:product-breadcrumb, woo:product-gallery, woo:products, woo:product-grid, woo:product-carousel, woo:product-loop-item, woo:loop-product-title, woo:loop-product-price, woo:loop-product-rating, woo:loop-product-image, woo:loop-product-button, woo:loop-product-meta, woo:cart, woo:checkout, woo:my-account, woo:purchase-summary, woo:order-tracking

**Loop Builder Widgets**
- loop:grid, loop:carousel, loop:item, loop:image, loop:title, loop:meta, loop:terms, loop:rating, loop:price, loop:add-to-cart, loop:read-more, loop:featured-image

**Carrosséis**
- w:image-carousel, media:carousel, w:testimonial-carousel, w:review-carousel, slider:slides, slider:slider, loop:carousel, woo:product-carousel, w:posts-carousel, w:gallery-carousel

**Widgets Experimentais**
- w:nested-tabs, w:mega-menu, w:scroll-snap, w:motion-effects, w:background-slideshow, w:css-transform, w:custom-position, w:dynamic-tags, w:ajax-pagination, loop:pagination, w:aspect-ratio-container

**WordPress Widgets**
- w:wp-search, w:wp-recent-posts, w:wp-recent-comments, w:wp-archives, w:wp-categories, w:wp-calendar, w:wp-tag-cloud, w:wp-custom-menu

Responda APENAS com JSON válido seguindo ESTRITAMENTE esta estrutura:

{
  "frameName": "Nome do Frame",
  "width": ${nodeData ? nodeData.width : 1440},
  "height": ${nodeData ? nodeData.height : 900},
  "background": "#FFFFFF",
  "autoLayout": { "direction": "vertical", "gap": 0, "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 } },
  "children": [
    {
      "type": "container",
      "name": "w:container",
      "background": "transparent",
      "width": ${nodeData ? nodeData.width : 1440},
      "height": ${nodeData ? Math.round(nodeData.height / 2) : 500},
      "autoLayout": { "direction": "vertical", "gap": 20, "padding": { "top": 40, "right": 40, "bottom": 40, "left": 40 } },
      "children": [
        {
          "type": "widget",
          "widgetType": "heading",
          "name": "w:heading",
          "content": "TEXTO EXATO DA IMAGEM",
          "fontSize": 48,
          "fontFamily": "Inter",
          "fontWeight": "Bold",
          "color": "#333333",
          "width": ${nodeData ? Math.round(nodeData.width * 0.5) : 800},
          "height": 60
        },
        {
          "type": "widget",
          "widgetType": "image",
          "name": "w:image",
          "content": "${availableImageIds[0] || 'ID_DA_IMAGEM_AQUI'}",
          "width": ${nodeData ? Math.round(nodeData.width * 0.3) : 400},
          "height": ${nodeData ? Math.round(nodeData.height * 0.3) : 300}
        }
      ]
    }
    }
  ]
}

Regras CRITICAS:
1. Use os DADOS DO FIGMA fornecidos para extrair o texto exato, fontes (fontFamily/fontWeight), cores e dimensões.
2. Estime as dimensões (width/height) de TODOS os elementos com precisão baseada nos dados.
3. Para IMAGENS: Se a imagem visual corresponder a um dos IDs listados acima, use o ID no campo "content".
4. NOMENCLATURA: Use SEMPRE as tags da lista de widgets válidos no campo "name" (ex: "w:heading", "w:button").
5. TIPOGRAFIA: Identifique fontFamily (ex: "Inter", "Roboto"), fontWeight (ex: "Regular", "Bold", "700") e fontStyle.
6. CORES: Identifique cores hexadecimais aproximadas.
7. Use Auto-Layout para tudo.
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
        const candidate = data.candidates[0];
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            throw new Error("A API retornou um conteúdo vazio.");
        }

        let responseText = candidate.content.parts[0].text;
        const startIndex = responseText.indexOf('{');

        // Se não encontrar início de JSON, erro
        if (startIndex === -1) {
            throw new Error("Nenhum objeto JSON encontrado na resposta.");
        }

        // Tenta encontrar o fim. Se não achar (cortado), usa o final da string.
        let endIndex = responseText.lastIndexOf('}');
        if (endIndex === -1 || endIndex < startIndex) {
            endIndex = responseText.length;
        }

        let jsonString = responseText.substring(startIndex, endIndex + 1);

        // Tenta parsear. Se falhar, tenta reparar.
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
                // Se falhar mesmo reparando, e foi por token limit, avisa
                if (candidate.finishReason === 'MAX_TOKENS') {
                    throw new Error("A resposta foi cortada e não pôde ser recuperada. Tente simplificar o frame.");
                }
                throw e;
            }
        }
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

export async function analyzeLayoutFigma(imageData: Uint8Array, availableImageIds: string[] = [], nodeData: any = null): Promise<string> {
    const key = await getKey();
    if (!key) throw new Error('API Key não configurada');

    const model = await getModel();
    const fullApiUrl = `${API_BASE_URL}${model}:generateContent?key=${key}`;

    const base64Image = arrayBufferToBase64(imageData);

    const prompt = `
Act as a FIGMA INSTRUCTOR and AUTO LAYOUT EXPERT.
Your goal is to provide a clear, step-by-step "Figma Construction Manual" on how to build the provided layout in Figma.

⛔️ STRICTLY FORBIDDEN:
- DO NOT generate code (React, HTML, CSS, JSX).
- DO NOT use file paths like "src/components/...".
- DO NOT mention "Developer Handoff".

✅ YOUR FOCUS:
- Figma Layers (Frames, Groups, Text, Vectors).
- Auto Layout Properties (Direction, Gap, Padding, Hug/Fill/Fixed).
- Figma Styles (Text Styles, Color Styles).
- Component Properties (Variants, Boolean Properties).

INSTRUCTIONS:
Analyze the screenshot and data to produce a guide:
1.  **Layer Hierarchy**: List the exact Frame structure needed (e.g., "Main Frame > Header > Logo Wrapper").
2.  **Auto Layout Specs**: For each container, specify:
    - **Direction**: Horizontal (Row) or Vertical (Column).
        - *CRITICAL: If text and image are side-by-side, use HORIZONTAL direction. Do NOT use "None" or absolute positioning unless strictly necessary.*
    - **Gap**: px value
    - **Padding**: px values
    - **Resizing**: Hug Content / Fill Container / Fixed Width
    - **Alignment**: Top Left / Center / etc.
3.  **Styles**:
    - **Colors**: Suggest names for Color Styles (e.g., "Primary/Blue", "Neutral/Gray-100").
    - **Typography**: Suggest names for Text Styles (e.g., "Heading/H1", "Body/Medium").
4.  **Components**: Identify repeating elements that should be Components.

OUTPUT FORMAT:
Provide the response in clear MARKDOWN format.
- Use **Bold** for key settings.
- Use \`Code Blocks\` ONLY for JSON tokens (Colors/Typography).
- Structure with clear Headings (###).

REQUIRED JSON OUTPUTS (Include these as code blocks):
- **Color Tokens JSON**: { "colors": { ... } }
- **Typography Tokens JSON**: { "typography": { ... } }

STRUCTURAL CONTEXT (FIGMA DATA):
${nodeData ? JSON.stringify(nodeData, null, 2) : 'No structural data available.'}
`;

    const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: base64Image } }] }],
            generationConfig: { response_mime_type: 'text/plain', temperature: 0.4, maxOutputTokens: 8192 }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Gemini API error: ${data.error?.message || response.statusText}`);
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("API returned empty content.");
    }

    return candidate.content.parts[0].text;
}

export async function generateFigmaLayoutJSON(imageData: Uint8Array, availableImageIds: string[] = [], nodeData: any = null): Promise<LayoutAnalysis> {
    const key = await getKey();
    if (!key) throw new Error('API Key não configurada');

    const model = await getModel();
    const fullApiUrl = `${API_BASE_URL}${model}:generateContent?key=${key}`;

    const base64Image = arrayBufferToBase64(imageData);

    const prompt = `
Act as a FIGMA AUTO LAYOUT EXPERT.
Your goal is to reconstruct the layout of the provided screenshot using Figma's Auto Layout best practices.

⛔️ CRITICAL RULES:
1. **HORIZONTAL vs VERTICAL**: If elements (like Text and Image) are side-by-side, you MUST use "direction": "horizontal". Do NOT use "none" or absolute positioning unless strictly necessary.
2. **DIMENSIONS**: Copy EXACTLY the "width" and "height" from the structural JSON.
3. **BACKGROUNDS**: Use the "fills" from the JSON.
4. **TEXT**: Copy text EXACTLY.
5. **NAMING**: Use descriptive names like "Container", "Image Wrapper", "Text Block", "Button".

INSTRUCTIONS:
1. ANALYZE the screenshot and the STRUCTURAL DATA.
2. RECREATE the layout using Frames with Auto Layout.
3. DETERMINE the best 'direction' (horizontal/vertical), 'gap', 'padding', and 'alignment' for each container.
4. IDENTIFY text and images.

STRUCTURAL CONTEXT (FIGMA DATA):
${nodeData ? JSON.stringify(nodeData, null, 2) : 'No structural data available.'}

Respond ONLY with valid JSON following this structure:
{
  "frameName": "Figma Auto Layout Analysis",
  "width": 100,
  "height": 100,
  "background": "#FFFFFF",
  "autoLayout": { "direction": "vertical", "gap": 0, "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 } },
  "children": [
    {
      "type": "container",
      "name": "Container",
      "autoLayout": { "direction": "horizontal", ... },
      "children": [...]
    },
    {
      "type": "text",
      "name": "Headline",
      "textContent": "...",
      "style": { "fontSize": 16, "fontWeight": "bold", "fontFamily": "Inter", "color": "#000000" }
    },
    {
      "type": "image",
      "name": "Hero Image"
    }
  ]
}
`;

    const response = await fetch(fullApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: base64Image } }] }],
            generationConfig: { response_mime_type: 'application/json', temperature: 0.4, maxOutputTokens: 8192 }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Gemini API error: ${data.error?.message || response.statusText}`);
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("API returned empty content.");
    }

    let responseText = candidate.content.parts[0].text;
    const startIndex = responseText.indexOf('{');
    if (startIndex === -1) throw new Error("No JSON found in response.");
    let endIndex = responseText.lastIndexOf('}');
    if (endIndex === -1 || endIndex < startIndex) endIndex = responseText.length;
    let jsonString = responseText.substring(startIndex, endIndex + 1);

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn("Invalid JSON, attempting repair...", e);
        return JSON.parse(repairJson(jsonString));
    }
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