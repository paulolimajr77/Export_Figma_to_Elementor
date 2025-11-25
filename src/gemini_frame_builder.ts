/// <reference types="@figma/plugin-typings" />

// Importa as interfaces necessárias, garantindo consistência
import type { LayoutAnalysis, ChildNode, AutoLayoutConfig } from './api_gemini';

// ==================== Funções de Criação de Frame ====================

export async function createOptimizedFrame(analysis: LayoutAnalysis, originalNode: SceneNode, availableImages: Record<string, Uint8Array> = {}): Promise<FrameNode> {
    const newFrame = figma.createFrame();

    // Validação e valores padrão
    newFrame.name = analysis.frameName || "Gemini IA Frame";
    const width = analysis.width || originalNode.width;
    const height = analysis.height || originalNode.height;
    newFrame.resize(width, height);

    if ('x' in originalNode && 'y' in originalNode) {
        newFrame.x = (originalNode as any).x + (originalNode as any).width + 100;
        newFrame.y = (originalNode as any).y;
    }

    if (analysis.background) {
        newFrame.fills = [{ type: 'SOLID', color: hexToRgb(analysis.background) }];
    }

    if (analysis.autoLayout) {
        applyAutoLayoutToFrame(newFrame, analysis.autoLayout);
    }

    // Validação para 'children'
    if (analysis.children && Array.isArray(analysis.children)) {
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

        if (spec.autoLayout) {
            applyAutoLayoutToFrame(container, spec.autoLayout);
        }
        if (spec.background) {
            container.fills = [{ type: 'SOLID', color: hexToRgb(spec.background) }];
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
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });

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
            text.characters = spec.content || 'Texto';

            if (spec.fontSize) text.fontSize = spec.fontSize;
            if (spec.color) text.fills = [{ type: 'SOLID', color: hexToRgb(spec.color) }];

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
