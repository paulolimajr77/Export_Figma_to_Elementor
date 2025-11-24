/// <reference types="@figma/plugin-typings" />

// Importa as interfaces necessárias, garantindo consistência
import type { LayoutAnalysis, ChildNode, AutoLayoutConfig } from './api_gemini';

// ==================== Funções de Criação de Frame ====================

export async function createOptimizedFrame(analysis: LayoutAnalysis, originalNode: SceneNode): Promise<FrameNode> {
    const newFrame = figma.createFrame();
    newFrame.name = analysis.frameName;
    newFrame.resize(analysis.width, analysis.height);

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

    for (const child of analysis.children) {
        await createChildNode(newFrame, child);
    }

    figma.currentPage.appendChild(newFrame);
    return newFrame;
}

async function createChildNode(parent: FrameNode, spec: ChildNode): Promise<SceneNode> {
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
                await createChildNode(container, child);
            }
        }
        parent.appendChild(container);
        return container;
    } 
    else if (spec.type === 'widget') {
        return await createWidget(parent, spec);
    }

    const fallback = figma.createFrame();
    fallback.name = spec.name || 'Unknown Node';
    parent.appendChild(fallback);
    return fallback;
}

async function createWidget(parent: FrameNode, spec: ChildNode): Promise<SceneNode> {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });

    switch (spec.widgetType) {
        case 'heading':
        case 'text':
        case 'text-editor':
            const text = figma.createText();
            text.name = spec.name;
            text.characters = spec.content || 'Texto de Exemplo';
            if (spec.fontSize) text.fontSize = spec.fontSize;
            if (spec.color) text.fills = [{ type: 'SOLID', color: hexToRgb(spec.color) }];
            parent.appendChild(text);
            return text;

        case 'button':
            const button = figma.createFrame();
            // ... (restante da lógica do botão)
            parent.appendChild(button);
            return button;

        case 'image':
        case 'image-box':
             const rect = figma.createRectangle();
             // ... (restante da lógica da imagem)
             parent.appendChild(rect);
             return rect;

        default:
            const fallbackWidget = figma.createFrame();
            fallbackWidget.name = spec.name || 'Widget Desconhecido';
            parent.appendChild(fallbackWidget);
            return fallbackWidget;
    }
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
