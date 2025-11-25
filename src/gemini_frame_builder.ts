/// <reference types="@figma/plugin-typings" />

// Importa as interfaces necessárias, garantindo consistência
import type { LayoutAnalysis, ChildNode, AutoLayoutConfig } from './api_gemini';

// ==================== Funções de Criação de Frame ====================

export async function createOptimizedFrame(analysis: LayoutAnalysis, originalNode: SceneNode | null, availableImages: Record<string, Uint8Array> = {}): Promise<FrameNode> {
    figma.ui.postMessage({ type: 'add-gemini-log', data: `🔨 Criando Frame Principal: "${analysis.frameName || 'Gemini Frame'}"` });
    const newFrame = figma.createFrame();

    // Validação e valores padrão
    newFrame.name = analysis.frameName || "Gemini IA Frame";
    const width = analysis.width || (originalNode ? originalNode.width : 1200);
    const height = analysis.height || (originalNode ? originalNode.height : 800);
    newFrame.resize(width, height);
    figma.ui.postMessage({ type: 'add-gemini-log', data: `📏 Dimensões: ${width}x${height}` });

    if (originalNode && 'x' in originalNode && 'y' in originalNode) {
        newFrame.x = (originalNode as any).x + (originalNode as any).width + 100;
        newFrame.y = (originalNode as any).y;
    } else {
        // Se não houver node original, centraliza na viewport
        newFrame.x = figma.viewport.center.x - (width / 2);
        newFrame.y = figma.viewport.center.y - (height / 2);
    }

    // Copia fielmente os preenchimentos (fills) do node original (Suporte a Imagens, Gradientes, etc.)
    if (originalNode && 'fills' in originalNode && originalNode.fills !== figma.mixed) {
        console.log('Original Node Fills:', JSON.stringify(originalNode.fills, null, 2));
        try {
            newFrame.fills = JSON.parse(JSON.stringify(originalNode.fills));
            console.log('New Frame Fills applied:', JSON.stringify(newFrame.fills, null, 2));
            figma.ui.postMessage({ type: 'add-gemini-log', data: `🎨 Copiando preenchimentos do original...` });
        } catch (e) {
            console.error('Error applying fills:', e);
        }
    } else {
        console.log('Original Node has no fills or mixed fills, or is null.');
        // Prioridade para 'fills' do JSON normalizado
        if (analysis.fills) {
            try {
                // Filtra fills inválidos ou converte se necessário (Figma JSON às vezes tem formatos diferentes)
                // Mas se vier da API do Figma, geralmente é compatível.
                // Ajuste para cores normalizadas (0-1) vs (0-255) se necessário?
                // A API do Figma usa 0-1. O JSON do usuário tem 0-1.
                newFrame.fills = analysis.fills;
                figma.ui.postMessage({ type: 'add-gemini-log', data: `🎨 Aplicando fills do JSON...` });
            } catch (e) {
                console.error('Error applying JSON fills:', e);
            }
        } else if (analysis.background) {
            newFrame.fills = [{ type: 'SOLID', color: hexToRgb(analysis.background) }];
            figma.ui.postMessage({ type: 'add-gemini-log', data: `🎨 Aplicando background: ${analysis.background}` });
        }
    }

    if (analysis.autoLayout) {
        applyAutoLayoutToFrame(newFrame, analysis.autoLayout);
        figma.ui.postMessage({ type: 'add-gemini-log', data: `📐 Aplicando Auto Layout: ${analysis.autoLayout.direction}` });
    }

    // Validação para 'children'
    if (analysis.children && Array.isArray(analysis.children)) {
        figma.ui.postMessage({ type: 'add-gemini-log', data: `👶 Processando ${analysis.children.length} filhos...` });
        for (const child of analysis.children) {
            await createChildNode(newFrame, child, availableImages);
        }
    }

    figma.currentPage.appendChild(newFrame);
    return newFrame;
}

async function createChildNode(parent: FrameNode, spec: ChildNode, availableImages: Record<string, Uint8Array>): Promise<SceneNode> {
    if (spec.type === 'container') {
        const container = figma.createFrame();
        container.name = spec.name;

        // Aplica dimensões se disponíveis
        if (spec.width && spec.height) {
            container.resize(spec.width, spec.height);
        }

        if (spec.autoLayout) {
            applyAutoLayoutToFrame(container, spec.autoLayout);
        }

        // Prioridade para fills
        if (spec.fills) {
            try {
                container.fills = spec.fills;
            } catch (e) {
                console.error('Error applying container fills:', e);
            }
        } else if (spec.background) {
            container.fills = [{ type: 'SOLID', color: hexToRgb(spec.background) }];
        }

        if (spec.cornerRadius) {
            container.cornerRadius = spec.cornerRadius;
        }

        if (spec.children) {
            for (const child of spec.children) {
                await createChildNode(container, child, availableImages);
            }
        }
        parent.appendChild(container);
        return container;
    }
    else if (spec.type === 'widget') {
        return await createWidget(parent, spec, availableImages);
    }

    const fallback = figma.createFrame();
    fallback.name = spec.name || 'Unknown Node';
    parent.appendChild(fallback);
    return fallback;
}

async function createWidget(parent: FrameNode, spec: ChildNode, availableImages: Record<string, Uint8Array>): Promise<SceneNode> {
    // Carrega fontes padrão e a solicitada se houver
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });

    if (spec.fontFamily) {
        try {
            const weight = spec.fontWeight || "Regular";
            await figma.loadFontAsync({ family: spec.fontFamily, style: weight });
        } catch (e) {
            console.warn(`Fonte ${spec.fontFamily} não encontrada, usando Inter.`);
        }
    }

    let node: SceneNode;

    // Aplica dimensões se fornecidas (exceto para texto que tem lógica própria)
    // Nota: Para aplicar resize, o node precisa ser criado primeiro.
    // A lógica abaixo foi ajustada para criar o node dentro do switch e depois aplicar resize se necessário.

    switch (spec.widgetType) {
        case 'heading':
        case 'text':
        case 'text-editor':
            const text = figma.createText();
            node = text;
            text.name = spec.name || 'Texto';
            text.characters = spec.content || spec.characters || 'Texto';

            if (spec.fontSize) text.fontSize = spec.fontSize;
            if (spec.color) text.fills = [{ type: 'SOLID', color: hexToRgb(spec.color) }];

            // Prioridade para fills do JSON (ex: cor de texto)
            if (spec.fills) {
                try { text.fills = spec.fills; } catch (e) { }
            }

            // Aplica fonte personalizada
            if (spec.fontFamily) {
                const weight = spec.fontWeight || "Regular";
                try {
                    text.fontName = { family: spec.fontFamily, style: weight };
                } catch (e) {
                    text.fontName = { family: "Inter", style: "Regular" };
                }
            }

            // Configuração de auto-resize para texto
            if (spec.width) {
                text.resize(spec.width, text.height);
                text.textAutoResize = 'HEIGHT';
            } else {
                text.textAutoResize = 'WIDTH_AND_HEIGHT';
            }
            break;

        case 'button':
            const button = figma.createFrame();
            node = button;
            button.name = spec.name || 'Botão';

            // Estilo do botão
            if (spec.background) button.fills = [{ type: 'SOLID', color: hexToRgb(spec.background) }];
            button.cornerRadius = 8;
            button.primaryAxisSizingMode = 'AUTO';
            button.counterAxisSizingMode = 'AUTO';
            button.layoutMode = 'HORIZONTAL';
            button.paddingLeft = 24;
            button.paddingRight = 24;
            button.paddingTop = 12;
            button.paddingBottom = 12;

            // Texto do botão
            const btnText = figma.createText();
            btnText.characters = spec.content || 'Botão';
            btnText.fontSize = 16;
            if (spec.color) btnText.fills = [{ type: 'SOLID', color: hexToRgb(spec.color) }];
            button.appendChild(btnText);

            // Se houver largura fixa para o botão
            if (spec.width && spec.height) {
                button.resize(spec.width, spec.height);
                button.primaryAxisSizingMode = 'FIXED';
                button.counterAxisSizingMode = 'FIXED';
            }
            break;

        case 'image':
        case 'image-box':
            const rect = figma.createRectangle();
            node = rect;
            rect.name = spec.name || 'Imagem';
            if (spec.width && spec.height) {
                rect.resize(spec.width, spec.height);
            } else {
                rect.resize(100, 100); // Tamanho padrão se não houver dimensões
            }

            // Tenta reutilizar a imagem se o ID corresponder
            if (spec.content && availableImages[spec.content]) {
                const image = figma.createImage(availableImages[spec.content]);
                rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
            } else {
                // Placeholder cinza se não encontrar imagem
                rect.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
            }
            break;

        default:
            const fallbackWidget = figma.createFrame();
            node = fallbackWidget;
            fallbackWidget.name = spec.name || 'Widget';
            if (spec.width && spec.height) fallbackWidget.resize(spec.width, spec.height);
            break;
    }

    // Força o redimensionamento se as dimensões foram fornecidas e não é texto (que tem lógica própria)
    if (spec.width && spec.height && node.type !== 'TEXT') {
        try {
            node.resize(spec.width, spec.height);
        } catch (e) {
            console.warn('Falha ao redimensionar node:', e);
        }
    }

    parent.appendChild(node);
    return node;
}

function applyAutoLayoutToFrame(frame: FrameNode, config: AutoLayoutConfig) {
    frame.layoutMode = config.direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
    // ... (restante da lógica do auto-layout)
}

function hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}
