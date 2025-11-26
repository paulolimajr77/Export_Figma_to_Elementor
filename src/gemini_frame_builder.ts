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

    // ESTRATÉGIA DE FILLS: Prioridade para o original, fallback para análise
    // Começa transparente para evitar fundo branco padrão
    newFrame.fills = [];

    // 1. TENTAR COPIAR DO ORIGINAL (Mais confiável)
    if (originalNode && 'fills' in originalNode && originalNode.fills !== figma.mixed && originalNode.fills.length > 0) {
        console.log('✅ Original Node Fills:', JSON.stringify(originalNode.fills, null, 2));
        try {
            // Validar se os fills são completos antes de aplicar
            const validFills = (originalNode.fills as Paint[]).filter(fill => {
                if (fill.type === 'SOLID') return true;
                if (fill.type === 'IMAGE') return 'imageHash' in fill;
                if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL' || fill.type === 'GRADIENT_ANGULAR' || fill.type === 'GRADIENT_DIAMOND') {
                    return 'gradientStops' in fill && 'gradientTransform' in fill;
                }
                return false;
            });

            if (validFills.length > 0) {
                newFrame.fills = JSON.parse(JSON.stringify(validFills));
                figma.ui.postMessage({ type: 'add-gemini-log', data: `🎨 ✅ Copiando ${validFills.length} preenchimento(s) do original` });
            } else {
                figma.ui.postMessage({ type: 'add-gemini-log', data: `⚠️ Fills do original inválidos, usando fallback` });
            }
        } catch (e) {
            console.error('❌ Error applying original fills:', e);
            figma.ui.postMessage({ type: 'add-gemini-log', data: `⚠️ Erro ao copiar fills: ${e}` });
        }
    }

    // 2. FALLBACK: Usar dados da análise (se fills do original falharam ou não existem)
    if (Array.isArray(newFrame.fills) && newFrame.fills.length === 0) {
        console.log('⚠️ Usando fallback para fills (original vazio ou inválido)');

        // Tentar usar fills do JSON da IA (mas validar primeiro)
        if (analysis.fills && Array.isArray(analysis.fills) && analysis.fills.length > 0) {
            try {
                // IMPORTANTE: A IA pode retornar fills incompletos (só type e visible)
                // Vamos filtrar apenas os que são realmente aplicáveis
                const validAIFills = analysis.fills.filter((fill: any) => {
                    if (fill.type === 'SOLID' && fill.color) return true;
                    if (fill.type === 'IMAGE' && fill.imageHash) return true;
                    // Gradientes da IA geralmente vêm incompletos, ignorar
                    return false;
                });

                if (validAIFills.length > 0) {
                    newFrame.fills = validAIFills;
                    figma.ui.postMessage({ type: 'add-gemini-log', data: `🎨 Aplicando ${validAIFills.length} fill(s) do JSON da IA` });
                } else {
                    figma.ui.postMessage({ type: 'add-gemini-log', data: `⚠️ Fills da IA incompletos, ignorando` });
                }
            } catch (e) {
                console.error('❌ Error applying AI fills:', e);
            }
        }

        // Se ainda estiver vazio, tentar usar background como string
        if (Array.isArray(newFrame.fills) && newFrame.fills.length === 0 && analysis.background) {
            if (analysis.background.toLowerCase() === 'transparent') {
                newFrame.fills = [];
                figma.ui.postMessage({ type: 'add-gemini-log', data: `🎨 Background: Transparente` });
            } else {
                const bgColor = parseColor(analysis.background);
                if (bgColor) {
                    newFrame.fills = [{ type: 'SOLID', color: bgColor }];
                    figma.ui.postMessage({ type: 'add-gemini-log', data: `🎨 Background: ${analysis.background}` });
                }
            }
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
    // Normaliza o tipo para comparação (case insensitive)
    const type = spec.type ? spec.type.toUpperCase() : 'FRAME';

    // 1. Lógica de Container (Recursiva)
    // Aceita tipos explícitos de container ou se tiver filhos
    if (type === 'CONTAINER' || type === 'FRAME' || type === 'GROUP' || type === 'SECTION' || (spec.children && spec.children.length > 0)) {
        // Exceção: Se for um botão (w:button) e quisermos usar a lógica específica de widget,
        // poderíamos desviar aqui. Mas se o JSON da IA já traz a estrutura (Frame + Texto),
        // é melhor tratar como Container genérico para fidelidade visual.

        const container = figma.createFrame();
        container.name = spec.name || 'Container';

        // IMPORTANTE: Começa transparente para evitar sobreposição branca se o fill falhar ou não existir
        container.fills = [];

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

    // 2. Lógica de Widget / Elementos Folha
    else if (type === 'WIDGET' || type === 'TEXT' || type === 'RECTANGLE' || type === 'VECTOR' || type === 'STAR' || type === 'ELLIPSE') {
        // Mapeia tipos do Figma para tipos de widget internos se necessário
        if (!spec.widgetType) {
            if (type === 'TEXT') spec.widgetType = 'text';
            else if (type === 'RECTANGLE') spec.widgetType = 'image'; // Assume imagem ou retângulo genérico
            else if (spec.name && spec.name.startsWith('w:')) spec.widgetType = spec.name.replace('w:', '');
        }
        return await createWidget(parent, spec, availableImages);
    }

    // 3. Fallback para tipos desconhecidos
    const fallback = figma.createFrame();
    fallback.name = spec.name || 'Unknown Node';
    fallback.fills = []; // Transparente por padrão
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
            const weight = mapFontWeight(spec.fontWeight);
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

            // Font family application
            if (spec.fontFamily) {
                const weight = mapFontWeight(spec.fontWeight);
                try {
                    text.fontName = { family: spec.fontFamily, style: weight };
                } catch (e) {
                    text.fontName = { family: "Inter", style: "Regular" };
                }
            }

            // Set characters AFTER setting font (to avoid default font issues)
            text.characters = spec.content || spec.characters || 'Texto';

            // Text specific styles
            if (spec.fontSize) text.fontSize = spec.fontSize;

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
            button.primaryAxisAlignItems = 'CENTER'; // Default to Center
            button.counterAxisAlignItems = 'CENTER'; // Default to Center
            button.paddingLeft = 24;
            button.paddingRight = 24;
            button.paddingTop = 12;
            button.paddingBottom = 12;
            button.cornerRadius = 8;

            // Button text
            const btnText = figma.createText();
            btnText.characters = spec.content || 'Botão';
            btnText.fontSize = 16;

            const btnTextColor = parseColor(spec.color);
            if (btnTextColor) btnText.fills = [{ type: 'SOLID', color: btnTextColor }];

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

            // Image specific fill logic
            if (spec.content) {
                const cleanHash = spec.content.trim();
                if (availableImages[cleanHash]) {
                    console.log(`✅ Imagem encontrada para hash: ${cleanHash}`);
                    const image = figma.createImage(availableImages[cleanHash]);
                    rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
                } else {
                    console.warn(`❌ Imagem NÃO encontrada para hash: ${cleanHash}`);
                    console.log('Hashes disponíveis:', Object.keys(availableImages));
                    // Placeholder visual para indicar erro
                    rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]; // Vermelho para erro
                }
            } else if (!spec.fills && !spec.background) {
                // Placeholder only if no other fill applied
                rect.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
            }
            break;

        default:
            const fallbackWidget = figma.createFrame();
            node = fallbackWidget;
            fallbackWidget.name = spec.name || 'Widget';
            fallbackWidget.fills = []; // Transparente
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
            console.warn('⚠️ Falha ao redimensionar node:', e);
        }
    }

    // ==================== FILLS (REFATORADO) ====================
    if ('fills' in node) {
        let fillsApplied = false;

        // 1. Tentar usar fills estruturados do JSON
        if (spec.fills && Array.isArray(spec.fills) && spec.fills.length > 0) {
            try {
                // Validar fills antes de aplicar
                const validFills = spec.fills.filter((fill: any) => {
                    if (fill.type === 'SOLID' && fill.color) return true;
                    if (fill.type === 'IMAGE' && fill.imageHash) return true;
                    // Ignorar gradientes incompletos da IA
                    if (fill.type && fill.type.includes('GRADIENT')) {
                        if (fill.gradientStops && fill.gradientTransform) return true;
                        console.warn(`⚠️ Gradiente incompleto ignorado:`, fill);
                        return false;
                    }
                    return false;
                });

                if (validFills.length > 0) {
                    node.fills = validFills;
                    fillsApplied = true;
                    console.log(`✅ Aplicados ${validFills.length} fill(s) do JSON`);
                } else {
                    console.warn('⚠️ Todos os fills do JSON eram inválidos');
                }
            } catch (e) {
                console.warn('⚠️ Erro ao aplicar fills do JSON:', e);
            }
        }

        // 2. Fallback: usar background como string
        if (!fillsApplied && spec.background) {
            // Garantir que é string antes de chamar toLowerCase
            const bgString = String(spec.background);

            if (bgString.toLowerCase() === 'transparent') {
                node.fills = [];
                fillsApplied = true;
            } else {
                const bgColor = parseColor(bgString);
                if (bgColor) {
                    node.fills = [{ type: 'SOLID', color: bgColor }];
                    fillsApplied = true;
                }
            }
        }

        // 3. Fallback para textos: usar color
        if (!fillsApplied && spec.color && node.type === 'TEXT') {
            const txtColor = parseColor(spec.color);
            if (txtColor) {
                node.fills = [{ type: 'SOLID', color: txtColor }];
                fillsApplied = true;
            }
        }

        // 4. Se nada funcionou, deixar transparente (evita branco padrão)
        if (!fillsApplied && node.type !== 'TEXT') {
            node.fills = [];
        }
    }

    // ==================== FONTES (PARA TEXTOS) ====================
    if (node.type === 'TEXT') {
        const textNode = node as TextNode;

        // Aplicar fontFamily e fontWeight ANTES de definir characters
        if (spec.fontFamily || spec.fontWeight) {
            const family = spec.fontFamily || 'Inter';
            const weight = mapFontWeight(spec.fontWeight);

            try {
                // Tentar carregar e aplicar a fonte
                figma.loadFontAsync({ family, style: weight }).then(() => {
                    textNode.fontName = { family, style: weight };
                }).catch(() => {
                    // Fallback para Inter Regular
                    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }).then(() => {
                        textNode.fontName = { family: 'Inter', style: 'Regular' };
                    });
                });
            } catch (e) {
                console.warn(`⚠️ Erro ao aplicar fonte ${family}:`, e);
            }
        }

        // Aplicar fontSize
        if (spec.fontSize) {
            textNode.fontSize = spec.fontSize;
        }

        // Aplicar alinhamento de texto
        if (spec.textAlignHorizontal) {
            textNode.textAlignHorizontal = spec.textAlignHorizontal;
        }
        if (spec.textAlignVertical) {
            textNode.textAlignVertical = spec.textAlignVertical;
        }

        // Aplicar textCase
        if (spec.textCase) {
            textNode.textCase = spec.textCase;
        }
    }

    // Corner Radius
    if ('cornerRadius' in node && spec.cornerRadius) {
        if (node.type !== 'ELLIPSE') {
            (node as any).cornerRadius = spec.cornerRadius;
        }
    }

    // Borders (Strokes)
    if ('strokes' in node && spec.border) {
        if (typeof spec.border === 'object' && spec.border !== null) {
            const border = spec.border as any;
            if (border.color && border.width) {
                const borderColor = parseColor(border.color);
                if (borderColor) {
                    node.strokes = [{ type: 'SOLID', color: borderColor }];
                    node.strokeWeight = border.width;
                }
            }
        } else if (typeof spec.border === 'string') {
            const match = spec.border.match(/(\d+)px\s+solid\s+(#[\da-fA-F]+)/);
            if (match) {
                const borderColor = parseColor(match[2]);
                if (borderColor) {
                    node.strokes = [{ type: 'SOLID', color: borderColor }];
                    node.strokeWeight = parseInt(match[1], 10);
                }
            }
        }
    }
}

function applyAutoLayoutToFrame(frame: FrameNode, config: AutoLayoutConfig) {
    frame.layoutMode = config.direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';

    if (config.gap !== undefined) frame.itemSpacing = config.gap;

    if (config.padding) {
        frame.paddingTop = config.padding.top || 0;
        frame.paddingRight = config.padding.right || 0;
        frame.paddingBottom = config.padding.bottom || 0;
        frame.paddingLeft = config.padding.left || 0;
    }

    // Default to HUG contents for main axis if not specified otherwise
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'AUTO'; // Or FIXED based on width?

    // Alignment
    if (config.primaryAlign) {
        switch (config.primaryAlign.toUpperCase()) {
            case 'MIN': frame.primaryAxisAlignItems = 'MIN'; break;
            case 'CENTER': frame.primaryAxisAlignItems = 'CENTER'; break;
            case 'MAX': frame.primaryAxisAlignItems = 'MAX'; break;
            case 'SPACE_BETWEEN': frame.primaryAxisAlignItems = 'SPACE_BETWEEN'; break;
        }
    }

    if (config.counterAlign) {
        switch (config.counterAlign.toUpperCase()) {
            case 'MIN': frame.counterAxisAlignItems = 'MIN'; break;
            case 'CENTER': frame.counterAxisAlignItems = 'CENTER'; break;
            case 'MAX': frame.counterAxisAlignItems = 'MAX'; break;
            // Counter axis doesn't support SPACE_BETWEEN
        }
    }
}

function parseColor(input: any): RGB | null {
    if (!input) return null;
    if (typeof input === 'string') return hexToRgb(input);
    if (typeof input === 'object' && 'r' in input && 'g' in input && 'b' in input) {
        // Assume que já está no formato 0-1 se vier do Gemini/Figma
        return { r: input.r, g: input.g, b: input.b };
    }
    return null;
}

function hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

function mapFontWeight(weight: string | number | undefined): string {
    if (!weight) return 'Regular';
    const w = String(weight).toLowerCase().trim();
    switch (w) {
        case '100': case 'thin': return 'Thin';
        case '200': case 'extralight': case 'extra light': return 'Extra Light';
        case '300': case 'light': return 'Light';
        case '400': case 'regular': case 'normal': return 'Regular';
        case '500': case 'medium': return 'Medium';
        case '600': case 'semibold': case 'semi bold': return 'Semi Bold';
        case '700': case 'bold': return 'Bold';
        case '800': case 'extrabold': case 'extra bold': return 'Extra Bold';
        case '900': case 'black': return 'Black';
        default: return 'Regular';
    }
}
