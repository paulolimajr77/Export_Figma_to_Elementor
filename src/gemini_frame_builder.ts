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

        // Apply common properties first (dimensions, fills, etc.)
        applyCommonProperties(container, spec);

        if (spec.autoLayout) {
            applyAutoLayoutToFrame(container, spec.autoLayout);
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
    applyCommonProperties(fallback, spec);
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

    switch (spec.widgetType) {
        case 'heading':
        case 'text':
        case 'text-editor':
            const text = figma.createText();
            node = text;
            text.name = spec.name || 'Texto';
            text.characters = spec.content || spec.characters || 'Texto';

            // Text specific styles
            if (spec.fontSize) text.fontSize = spec.fontSize;

            // Font family application
            if (spec.fontFamily) {
                const weight = spec.fontWeight || "Regular";
                try {
                    text.fontName = { family: spec.fontFamily, style: weight };
                } catch (e) {
                    text.fontName = { family: "Inter", style: "Regular" };
                }
            }

            // Text auto-resize logic
            if (spec.width) {
                text.resize(spec.width, text.height);
                text.textAutoResize = 'HEIGHT';
            } else {
                text.textAutoResize = 'WIDTH_AND_HEIGHT';
            }

            // Apply common properties (fills, etc.) - Text supports fills
            applyCommonProperties(text, spec, { skipResize: true });
            break;

        case 'button':
            const button = figma.createFrame();
            node = button;
            button.name = spec.name || 'Botão';

            // Button specific layout defaults
            button.primaryAxisSizingMode = 'AUTO';
            button.counterAxisSizingMode = 'AUTO';
            button.layoutMode = 'HORIZONTAL';
            button.paddingLeft = 24;
            button.paddingRight = 24;
            button.paddingTop = 12;
            button.paddingBottom = 12;
            button.cornerRadius = 8;

            // Button text
            const btnText = figma.createText();
            btnText.characters = spec.content || 'Botão';
            btnText.fontSize = 16;
            if (spec.color) btnText.fills = [{ type: 'SOLID', color: hexToRgb(spec.color) }];
            button.appendChild(btnText);

            applyCommonProperties(button, spec);

            // Override sizing mode if fixed size was applied
            if (spec.width && spec.height) {
                button.primaryAxisSizingMode = 'FIXED';
                button.counterAxisSizingMode = 'FIXED';
            }
            break;

        case 'image':
        case 'image-box':
            const rect = figma.createRectangle();
            node = rect;
            rect.name = spec.name || 'Imagem';

            // Default size if missing
            if (!spec.width || !spec.height) {
                rect.resize(100, 100);
            }

            applyCommonProperties(rect, spec);

            // Image specific fill logic (overrides solid fill from common props if image exists)
            if (spec.content && availableImages[spec.content]) {
                const image = figma.createImage(availableImages[spec.content]);
                rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
            } else if (!spec.fills && !spec.background) {
                // Placeholder only if no other fill applied
                rect.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
            }
            break;

        default:
            const fallbackWidget = figma.createFrame();
            node = fallbackWidget;
            fallbackWidget.name = spec.name || 'Widget';
            applyCommonProperties(fallbackWidget, spec);
            break;
    }

    parent.appendChild(node);
    return node;
}

function applyCommonProperties(node: SceneNode, spec: ChildNode, options: { skipResize?: boolean } = {}) {
    // Dimensions
    if (!options.skipResize && spec.width && spec.height) {
        try {
            if ('resize' in node) {
                node.resize(spec.width, spec.height);
            }
        } catch (e) {
            console.warn('Falha ao redimensionar node:', e);
        }
    }

    // Fills
    if ('fills' in node) {
        if (spec.fills) {
            try {
                node.fills = spec.fills;
            } catch (e) { }
        } else if (spec.background) {
            node.fills = [{ type: 'SOLID', color: hexToRgb(spec.background) }];
        } else if (spec.color && node.type === 'TEXT') {
            // Text color fallback
            node.fills = [{ type: 'SOLID', color: hexToRgb(spec.color) }];
        }
    }

    // Corner Radius
    if ('cornerRadius' in node && spec.cornerRadius) {
        if (node.type !== 'ELLIPSE') {
            (node as any).cornerRadius = spec.cornerRadius;
        }
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
