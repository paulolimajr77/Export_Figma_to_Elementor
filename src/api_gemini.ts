// Google Gemini API Integration
// Análise inteligente de layouts e criação automática de frames otimizados

/// <reference types="@figma/plugin-typings" />

namespace Gemini {
    const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

    // ==================== Gerenciamento de API Key ====================

    /**
     * Salva a API Key do Google Gemini
     */
    export async function saveKey(key: string): Promise<void> {
        await figma.clientStorage.setAsync('gemini_api_key', key);
    }

    /**
     * Recupera a API Key salva
     */
    export async function getKey(): Promise<string | undefined> {
        return await figma.clientStorage.getAsync('gemini_api_key');
    }

    /**
     * Testa a conexão com a API do Gemini
     */
    export async function testConnection(): Promise<boolean> {
        const key = await getKey();
        if (!key) return false;

        try {
            const response = await fetch(`${API_ENDPOINT}?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Test' }]
                    }]
                })
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    // ==================== Análise e Criação de Layout ====================

    /**
     * Analisa um frame e retorna instruções para recriar com melhorias
     */
    export async function analyzeAndRecreate(imageData: Uint8Array, originalNode: SceneNode): Promise<LayoutAnalysis> {
        const key = await getKey();
        if (!key) throw new Error('API Key não configurada');

        const base64Image = arrayBufferToBase64(imageData);

        const prompt = `
Analise este layout de interface e forneça instruções DETALHADAS para RECRIAR um novo frame otimizado.

Identifique com precisão:
1. **Estrutura Hierárquica**: Containers principais, seções e widgets
2. **Nomenclaturas**: Use prefixos adequados:
   - c:section, c:inner, c:container para containers
   - w:heading, w:text-editor, w:button, w:image, w:image-box para widgets
3. **Auto-Layout**: Configurações de flexbox (direção, alinhamento, gap, padding)
4. **Conteúdo**: Textos visíveis, cores, tamanhos de fonte
5. **Hierarquia**: Ordem correta dos elementos

Responda APENAS com JSON válido nesta estrutura:
{
  "frameName": "c:section Hero - IA Optimized",
  "width": 1200,
  "height": 600,
  "autoLayout": {
    "direction": "vertical",
    "primaryAlign": "center",
    "counterAlign": "center",
    "gap": 20,
    "padding": {"top": 40, "right": 60, "bottom": 40, "left": 60}
  },
  "background": "#FFFFFF",
  "children": [
    {
      "type": "container",
      "name": "c:inner Content",
      "autoLayout": {"direction": "vertical", "primaryAlign": "center", "counterAlign": "center", "gap": 16, "padding": {"top": 0, "right": 0, "bottom": 0, "left": 0}},
      "children": [
        {
          "type": "widget",
          "widgetType": "heading",
          "name": "w:heading Title",
          "content": "Título identificado",
          "fontSize": 48,
          "color": "#000000"
        },
        {
          "type": "widget",
          "widgetType": "text",
          "name": "w:text-editor Description",
          "content": "Descrição identificada",
          "fontSize": 16,
          "color": "#666666"
        }
      ]
    }
  ],
  "improvements": ["Aplicado auto-layout vertical", "Nomenclaturas padronizadas"]
}
        `;

        const response = await fetch(`${API_ENDPOINT}?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: 'image/png',
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return parseGeminiResponse(data);
    }

    /**
     * Cria um novo frame otimizado baseado na análise da IA
     */
    export async function createOptimizedFrame(analysis: LayoutAnalysis, originalNode: SceneNode): Promise<FrameNode> {
        // Cria novo frame
        const newFrame = figma.createFrame();
        newFrame.name = analysis.frameName;
        newFrame.resize(analysis.width, analysis.height);

        // Posiciona ao lado do original (100px de distância)
        if ('x' in originalNode && 'y' in originalNode) {
            newFrame.x = (originalNode as any).x + (originalNode as any).width + 100;
            newFrame.y = (originalNode as any).y;
        }

        // Aplica background
        if (analysis.background) {
            newFrame.fills = [{
                type: 'SOLID',
                color: hexToRgb(analysis.background)
            }];
        }

        // Aplica auto-layout no frame principal
        if (analysis.autoLayout) {
            applyAutoLayoutToFrame(newFrame, analysis.autoLayout);
        }

        // Cria filhos recursivamente
        for (const child of analysis.children) {
            await createChildNode(newFrame, child);
        }

        // Adiciona à página
        figma.currentPage.appendChild(newFrame);

        return newFrame;
    }

    // ==================== Funções Auxiliares ====================

    /**
     * Cria um nó filho baseado na especificação da IA
     */
    async function createChildNode(parent: FrameNode, spec: any): Promise<SceneNode> {
        if (spec.type === 'container') {
            const container = figma.createFrame();
            container.name = spec.name;

            if (spec.autoLayout) {
                applyAutoLayoutToFrame(container, spec.autoLayout);
            }

            if (spec.background) {
                container.fills = [{
                    type: 'SOLID',
                    color: hexToRgb(spec.background)
                }];
            }

            // Cria filhos do container
            if (spec.children) {
                for (const child of spec.children) {
                    await createChildNode(container, child);
                }
            }

            parent.appendChild(container);
            return container;
        }
        else if (spec.type === 'widget') {
            return await createWidget(parent, spec);
        }

        // Fallback
        const fallback = figma.createFrame();
        fallback.name = spec.name || 'Unknown';
        parent.appendChild(fallback);
        return fallback;
    }

    /**
     * Cria um widget baseado no tipo especificado
     */
    async function createWidget(parent: FrameNode, spec: any): Promise<SceneNode> {
        const widgetType = spec.widgetType;

        // Widgets de texto (heading, text-editor)
        if (widgetType === 'heading' || widgetType === 'text') {
            const text = figma.createText();
            text.name = spec.name;

            // Carrega fonte
            await figma.loadFontAsync({ family: "Inter", style: "Regular" });

            text.characters = spec.content || 'Texto';

            if (spec.fontSize) {
                text.fontSize = spec.fontSize;
            }

            if (spec.color) {
                text.fills = [{
                    type: 'SOLID',
                    color: hexToRgb(spec.color)
                }];
            }

            parent.appendChild(text);
            return text;
        }

        // Widget de botão
        else if (widgetType === 'button') {
            const button = figma.createFrame();
            button.name = spec.name;
            button.layoutMode = 'HORIZONTAL';
            button.primaryAxisAlignItems = 'CENTER';
            button.counterAxisAlignItems = 'CENTER';
            button.paddingLeft = button.paddingRight = 24;
            button.paddingTop = button.paddingBottom = 12;
            button.cornerRadius = 8;

            if (spec.background) {
                button.fills = [{
                    type: 'SOLID',
                    color: hexToRgb(spec.background)
                }];
            } else {
                button.fills = [{
                    type: 'SOLID',
                    color: { r: 0.13, g: 0.6, b: 1 } // Azul padrão
                }];
            }

            // Adiciona texto do botão
            await figma.loadFontAsync({ family: "Inter", style: "Medium" });
            const buttonText = figma.createText();
            buttonText.characters = spec.content || 'Button';
            buttonText.fontSize = 16;
            buttonText.fills = [{
                type: 'SOLID',
                color: spec.color ? hexToRgb(spec.color) : { r: 1, g: 1, b: 1 }
            }];

            button.appendChild(buttonText);
            parent.appendChild(button);
            return button;
        }

        // Widget de imagem (placeholder)
        else if (widgetType === 'image') {
            const rect = figma.createRectangle();
            rect.name = spec.name;
            rect.resize(spec.width || 200, spec.height || 150);
            rect.fills = [{
                type: 'SOLID',
                color: { r: 0.9, g: 0.9, b: 0.9 }
            }];

            parent.appendChild(rect);
            return rect;
        }

        // Fallback
        const fallback = figma.createFrame();
        fallback.name = spec.name || 'Widget';
        parent.appendChild(fallback);
        return fallback;
    }

    /**
     * Aplica configurações de auto-layout a um frame
     */
    function applyAutoLayoutToFrame(frame: FrameNode, config: any) {
        frame.layoutMode = config.direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';

        // Primary axis (justify-content)
        if (config.primaryAlign === 'start') frame.primaryAxisAlignItems = 'MIN';
        else if (config.primaryAlign === 'center') frame.primaryAxisAlignItems = 'CENTER';
        else if (config.primaryAlign === 'end') frame.primaryAxisAlignItems = 'MAX';
        else if (config.primaryAlign === 'space-between') frame.primaryAxisAlignItems = 'SPACE_BETWEEN';

        // Counter axis (align-items)
        if (config.counterAlign === 'start') frame.counterAxisAlignItems = 'MIN';
        else if (config.counterAlign === 'center') frame.counterAxisAlignItems = 'CENTER';
        else if (config.counterAlign === 'end') frame.counterAxisAlignItems = 'MAX';

        // Gap
        if (config.gap) frame.itemSpacing = config.gap;

        // Padding
        if (config.padding) {
            frame.paddingTop = config.padding.top || 0;
            frame.paddingRight = config.padding.right || 0;
            frame.paddingBottom = config.padding.bottom || 0;
            frame.paddingLeft = config.padding.left || 0;
        }
    }

    /**
     * Converte array de bytes para base64
     */
    function arrayBufferToBase64(buffer: Uint8Array): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Converte cor hexadecimal para RGB do Figma
     */
    function hexToRgb(hex: string): RGB {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 1, g: 1, b: 1 };
    }

    /**
     * Faz parse da resposta do Gemini
     */
    function parseGeminiResponse(data: any): LayoutAnalysis {
        try {
            const text = data.candidates[0].content.parts[0].text;
            // Remove markdown code blocks se existirem
            const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('JSON não encontrado na resposta');
        } catch (e: any) {
            console.error('Erro ao fazer parse da resposta:', e);
            throw new Error('Resposta inválida da IA: ' + (e.message || String(e)));
        }
    }
}

// ==================== Interfaces ====================

interface LayoutAnalysis {
    frameName: string;
    width: number;
    height: number;
    autoLayout?: AutoLayoutConfig;
    background?: string;
    children: ChildNode[];
    improvements?: string[];
}

interface ChildNode {
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

interface AutoLayoutConfig {
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
