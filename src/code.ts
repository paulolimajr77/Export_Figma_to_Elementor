// Elementor JSON Compiler – Versão Refatorada
// Exporta frames do Figma para JSON compatível com Elementor (clipboard)
// Refatorado para melhor manutenibilidade e reaproveitamento de código

// -------------------- Imports dos Módulos Refatorados --------------------
import type { ElementorTemplate, WPConfig } from './types/elementor.types';
import { ElementorCompiler } from './compiler/elementor.compiler';
import * as Gemini from './api_gemini';
import { createOptimizedFrame } from './gemini_frame_builder';

// -------------------- Type Guards (mantidos para compatibilidade) --------------------
function hasLayout(node: SceneNode): node is FrameNode | ComponentNode | InstanceNode {
    return 'layoutMode' in node;
}

// -------------------- Helper Functions --------------------
async function extractImagesFromNode(node: SceneNode): Promise<Record<string, Uint8Array>> {
    const images: Record<string, Uint8Array> = {};

    async function traverse(n: SceneNode) {
        if ('fills' in n && Array.isArray(n.fills)) {
            for (const fill of n.fills) {
                if (fill.type === 'IMAGE' && fill.imageHash) {
                    const image = figma.getImageByHash(fill.imageHash);
                    if (image) {
                        const bytes = await image.getBytesAsync();
                        // Usa o hash da imagem como ID para reutilização
                        images[fill.imageHash] = bytes;
                    }
                }
            }
        }
        if ('children' in n) {
            for (const child of n.children) {
                await traverse(child);
            }
        }
    }

    await traverse(node);
    return images;
}

function serializeNode(node: SceneNode): any {
    const data: any = {
        id: node.id,
        name: node.name,
        type: node.type,
        width: node.width,
        height: node.height,
        x: node.x,
        y: node.y,
        visible: node.visible,
        locked: node.locked,
    };

    // Opacity & Blend Mode
    if ('opacity' in node) data.opacity = (node as any).opacity;
    if ('blendMode' in node) data.blendMode = (node as any).blendMode;

    // Fills
    if ('fills' in node && (node as any).fills !== figma.mixed) {
        data.fills = (node as any).fills.map((fill: any) => {
            if (fill.type === 'SOLID') {
                return { type: 'SOLID', color: fill.color, opacity: fill.opacity, visible: fill.visible };
            }
            return { type: fill.type, visible: fill.visible };
        });
    }

    // Strokes
    if ('strokes' in node && (node as any).strokes !== figma.mixed) {
        data.strokes = (node as any).strokes.map((stroke: any) => {
            if (stroke.type === 'SOLID') {
                return { type: 'SOLID', color: stroke.color, opacity: stroke.opacity, visible: stroke.visible };
            }
            return { type: stroke.type, visible: stroke.visible };
        });
        data.strokeWeight = (node as any).strokeWeight;
        data.strokeAlign = (node as any).strokeAlign;
        data.strokeCap = (node as any).strokeCap;
        data.strokeJoin = (node as any).strokeJoin;
        data.dashPattern = (node as any).dashPattern;
    }

    // Effects (Shadows, Blurs)
    if ('effects' in node && (node as any).effects !== figma.mixed) {
        data.effects = (node as any).effects.map((effect: any) => ({
            type: effect.type,
            visible: effect.visible,
            radius: effect.radius,
            offset: effect.offset,
            spread: effect.spread,
            color: effect.color,
            blendMode: effect.blendMode
        }));
    }

    // Corner Radius
    if ('cornerRadius' in node) {
        if ((node as any).cornerRadius !== figma.mixed) {
            data.cornerRadius = (node as any).cornerRadius;
        } else {
            data.topLeftRadius = (node as any).topLeftRadius;
            data.topRightRadius = (node as any).topRightRadius;
            data.bottomLeftRadius = (node as any).bottomLeftRadius;
            data.bottomRightRadius = (node as any).bottomRightRadius;
        }
    }

    // Constraints
    if ('constraints' in node) {
        data.constraints = (node as any).constraints;
    }

    // Text Properties
    if (node.type === 'TEXT') {
        data.characters = (node as any).characters;
        data.fontSize = (node as any).fontSize;
        data.fontName = (node as any).fontName;
        data.fontWeight = (node as any).fontWeight;
        data.textAlignHorizontal = (node as any).textAlignHorizontal;
        data.textAlignVertical = (node as any).textAlignVertical;
        data.textAutoResize = (node as any).textAutoResize;
        data.letterSpacing = (node as any).letterSpacing;
        data.lineHeight = (node as any).lineHeight;
        data.textCase = (node as any).textCase;
        data.textDecoration = (node as any).textDecoration;

        if ((node as any).fills !== figma.mixed && (node as any).fills.length > 0 && (node as any).fills[0].type === 'SOLID') {
            data.color = ((node as any).fills[0] as SolidPaint).color;
        }
    }

    // Auto Layout
    if ('layoutMode' in node) {
        data.layoutMode = node.layoutMode;
        data.primaryAxisSizingMode = node.primaryAxisSizingMode;
        data.counterAxisSizingMode = node.counterAxisSizingMode;
        data.primaryAxisAlignItems = node.primaryAxisAlignItems;
        data.counterAxisAlignItems = node.counterAxisAlignItems;
        data.paddingTop = node.paddingTop;
        data.paddingRight = node.paddingRight;
        data.paddingBottom = node.paddingBottom;
        data.paddingLeft = node.paddingLeft;
        data.itemSpacing = node.itemSpacing;
    }

    // Children
    if ('children' in node) {
        data.children = node.children.map(child => serializeNode(child));
    }

    return data;
}

// Helper para converter RGB para HEX
function rgbToHex(rgb: { r: number; g: number; b: number }): string {
    const toHex = (c: number) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function getBackgroundFromNode(node: SceneNode): string {
    if ('fills' in node && Array.isArray(node.fills)) {
        for (const fill of node.fills) {
            if (fill.type === 'SOLID') {
                const { r, g, b } = fill.color;
                return rgbToHex({ r, g, b });
            }
        }
    }
    return "#FFFFFF"; // Default se não achar fill sólido
}

// Helper para encontrar as seções reais para análise (drill down)
function getSectionsToAnalyze(node: SceneNode): SceneNode[] {
    // NOVA LÓGICA: Não dividir NADA. Analisar o objeto selecionado exatamente como ele é.
    // Isso atende à solicitação do usuário de manter a altura do frame principal e o contexto.
    return [node];
}

// Helper para "descascar" wrappers redundantes (Aggressive Unwrapping)
function unwrapNode(node: SceneNode): SceneNode {
    let currentNode = node;

    // Enquanto o node tiver exatamente 1 filho visível e for um container...
    while ('children' in currentNode) {
        const visibleChildren = currentNode.children.filter(child => child.visible);
        if (visibleChildren.length === 1 && (visibleChildren[0].type === 'FRAME' || visibleChildren[0].type === 'GROUP' || visibleChildren[0].type === 'SECTION')) {
            console.log(`Unwrapping redundant layer: ${currentNode.name} -> ${visibleChildren[0].name}`);
            currentNode = visibleChildren[0];
        } else {
            break;
        }
    }

    return currentNode;
}

// -------------------- Main Execution --------------------
figma.showUI(__html__, { width: 600, height: 600 });

let compiler: ElementorCompiler;

// Carrega configuração do WordPress salva
figma.clientStorage.getAsync('wp_config').then(config => {
    compiler = new ElementorCompiler(config || {});
    if (config) {
        figma.ui.postMessage({ type: 'load-wp-config', config });
    }
});

// Carrega a configuração do Gemini ao iniciar
figma.clientStorage.getAsync('gemini_api_key').then(apiKey => {
    figma.clientStorage.getAsync('gemini_model').then(model => {
        if (apiKey || model) {
            figma.ui.postMessage({ type: 'load-gemini-config', apiKey, model });
        }
    });
});


// -------------------- Message Handler --------------------
// Função para normalizar JSON do Figma (API/Plugin) para o formato LayoutAnalysis
function normalizeFigmaJSON(json: any): LayoutAnalysis {
    // 1. Desembrulha 'document' ou 'children' se for a raiz
    let root = json;
    if (json.document) {
        root = json.document;
    }

    // Se a raiz for DOCUMENT ou PAGE, procura o primeiro FRAME/SECTION
    if (root.type === 'DOCUMENT' || root.type === 'PAGE') {
        if (root.children && root.children.length > 0) {
            // Tenta encontrar o primeiro Frame válido
            const firstFrame = root.children.find((c: any) => c.type === 'FRAME' || c.type === 'SECTION');
            if (firstFrame) {
                root = firstFrame;
            } else {
                root = root.children[0]; // Fallback
            }
        }
    }

    // 2. Mapeia propriedades
    const analysis: LayoutAnalysis = {
        frameName: root.name || "Layout Importado",
        width: root.width || 1200,
        height: root.height || 800,
        children: [],
        type: root.type,
        fills: root.backgrounds || root.fills || []
    };

    // Auto Layout
    if (root.layoutMode && root.layoutMode !== 'NONE') {
        analysis.autoLayout = {
            direction: root.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
            gap: root.itemSpacing || 0,
            padding: {
                top: root.paddingTop || root.padding || 0,
                right: root.paddingRight || root.padding || 0,
                bottom: root.paddingBottom || root.padding || 0,
                left: root.paddingLeft || root.padding || 0
            },
            primaryAlign: root.primaryAxisAlignItems,
            counterAlign: root.counterAxisAlignItems
        };
    }

    // Filhos
    if (root.children && Array.isArray(root.children)) {
        analysis.children = root.children.map((child: any) => normalizeChildNode(child));
    }

    return analysis;
}

function normalizeChildNode(node: any): ChildNode {
    const isContainer = node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'SECTION';

    // Mapeia tipos do Figma para widgetType do Gemini
    let widgetType = 'container';
    if (!isContainer) {
        if (node.type === 'TEXT') widgetType = 'text';
        else if (node.type === 'RECTANGLE') widgetType = 'image'; // Assume imagem ou forma
        else if (node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'ELLIPSE') widgetType = 'icon';
        else widgetType = 'unknown';
    }

    const child: ChildNode = {
        type: isContainer ? 'container' : 'widget',
        name: node.name,
        widgetType: isContainer ? undefined : widgetType,
        width: node.width,
        height: node.height,
        fills: node.fills || node.backgrounds,
        cornerRadius: node.cornerRadius,
        // Text specific
        content: node.characters,
        characters: node.characters,
        fontSize: node.style?.fontSize,
        fontFamily: node.style?.fontFamily,
        fontWeight: node.style?.fontWeight,
        color: node.style?.fill ? rgbToHex(node.style.fill) : undefined, // Simplificação
        style: node.style
    };

    // Auto Layout para containers
    if (node.layoutMode && node.layoutMode !== 'NONE') {
        child.autoLayout = {
            direction: node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical',
            gap: node.itemSpacing || 0,
            padding: {
                top: node.paddingTop || node.padding || 0,
                right: node.paddingRight || node.padding || 0,
                bottom: node.paddingBottom || node.padding || 0,
                left: node.paddingLeft || node.padding || 0
            }
        };
    }

    // Recursão
    if (node.children && Array.isArray(node.children)) {
        child.children = node.children.map((c: any) => normalizeChildNode(c));
    }

    return child;
}

// Helper auxiliar (se não existir)


figma.ui.onmessage = async (msg) => {
    if (!compiler) compiler = new ElementorCompiler({});

    // Exportar para Elementor
    if (msg.type === 'export-elementor') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Selecione ao menos um frame.');
            return;
        }

        if (msg.quality) compiler.setQuality(msg.quality);

        figma.notify('Processando... (Uploads de imagem podem demorar)');

        try {
            const elements = await compiler.compile(selection);

            // Detectar elementos w:nav-menu
            const navMenus = compiler.findNavMenus(elements);

            const template: ElementorTemplate = {
                type: 'elementor',
                siteurl: (compiler as any).wpConfig?.url || '',
                elements,
                version: '0.4'
            };

            figma.ui.postMessage({
                type: 'export-result',
                data: JSON.stringify(template, null, 2),
                navMenus: navMenus
            });

            if (navMenus.length > 0) {
                figma.notify(`JSON gerado! Encontrado(s) ${navMenus.length} menu(s) de navegação.`);
            } else {
                figma.notify('JSON gerado com sucesso!');
            }
        } catch (e) {
            console.error(e);
            figma.notify('Erro ao exportar.');
        }
    }

    // Salvar configuração do WordPress
    else if (msg.type === 'save-wp-config') {
        await figma.clientStorage.setAsync('wp_config', msg.config);
        compiler.setWPConfig(msg.config);
        figma.notify('Configurações salvas.');
    }

    else if (msg.type === 'get-wp-config') {
        const config = await figma.clientStorage.getAsync('wp_config');
        if (config) {
            figma.ui.postMessage({ type: 'load-wp-config', config });
        }
    }

    // Resposta de upload de imagem
    else if (msg.type === 'upload-image-response') {
        compiler.handleUploadResponse(msg.id, msg);
    }

    // Renomear layer
    else if (msg.type === 'rename-layer') {
        const sel = figma.currentPage.selection;
        if (sel.length === 1) {
            sel[0].name = msg.newName;
            figma.notify(`Renomeado: ${msg.newName}`);
        } else {
            figma.notify('Selecione 1 item.');
        }
    }

    // Debug de estrutura
    else if (msg.type === 'debug-structure') {
        const debug = figma.currentPage.selection.map(n => ({
            id: n.id,
            name: n.name,
            type: n.type,
            layout: hasLayout(n) ? (n as FrameNode).layoutMode : 'none'
        }));
        figma.ui.postMessage({ type: 'debug-result', data: JSON.stringify(debug, null, 2) });
    }

    // Redimensionar a UI
    else if (msg.type === 'resize-ui') {
        figma.ui.resize(msg.width, msg.height);
    }

    // =================================================================
    // ----- NOVA LÓGICA DO GEMINI USANDO A SDK -----------------------
    // =================================================================

    // Carrega a configuração do Gemini (API Key e Modelo)
    else if (msg.type === 'get-gemini-config') {
        const apiKey = await Gemini.getKey();
        const model = await Gemini.getModel();
        figma.ui.postMessage({ type: 'load-gemini-config', apiKey, model });
    }

    // Salva a API Key do Gemini
    else if (msg.type === 'save-gemini-key') {
        await Gemini.saveKey(msg.key);
        figma.notify('🔑 API Key do Gemini salva com sucesso!');
    }

    // Salva o modelo Gemini selecionado
    else if (msg.type === 'save-gemini-model') {
        await Gemini.saveModel(msg.model);
        figma.notify(`🤖 Modelo Gemini definido para: ${msg.model}`);
    }

    // Testa a conexão com a API Gemini usando a SDK
    else if (msg.type === 'test-gemini-connection') {
        figma.notify('Testando conexão com a API Gemini...');
        try {
            const result = await Gemini.testConnection();

            figma.ui.postMessage({
                type: 'gemini-connection-result',
                success: result.success,
                message: result.message
            });

            if (result.success) {
                figma.notify(result.message || '✅ Conexão com Gemini OK!');
            } else {
                figma.notify(`❌ ${result.message || 'Falha na conexão.'}`);
            }
        } catch (e: any) {
            figma.notify('❌ Erro crítico ao testar conexão: ' + e.message);
            figma.ui.postMessage({
                type: 'gemini-connection-result',
                success: false,
                message: e.message
            });
        }
    }

    // Analisa o layout com a IA Gemini (Estratégia Dividir para Conquistar)
    else if (msg.type === 'analyze-with-gemini') {
        const selection = figma.currentPage.selection;
        if (selection.length !== 1) {
            figma.notify('⚠️ Selecione apenas 1 frame para análise');
            return;
        }

        const node = selection[0];

        // Validação mais estrita do tipo de node
        if (node.type !== 'FRAME' && node.type !== 'SECTION' && node.type !== 'COMPONENT') {
            figma.notify('⚠️ Selecione um Frame, Section ou Componente válido.');
            return;
        }

        if (!('children' in node)) {
            figma.notify('⚠️ O elemento selecionado não possui filhos para análise.');
            return;
        }

        figma.notify('🤖 Iniciando análise estruturada...');

        try {
            // Extrai imagens globais para reutilização
            const availableImages = await extractImagesFromNode(node);
            const availableImageIds = Object.keys(availableImages);

            // Prepara lista de filhos para análise usando a lógica de drill-down
            const childrenToAnalyze = getSectionsToAnalyze(node);
            const totalSections = childrenToAnalyze.length;

            if (totalSections === 0) {
                throw new Error("O frame selecionado está vazio ou não possui seções visíveis.");
            }

            const aggregatedChildren: any[] = [];
            const aggregatedImprovements: string[] = [];

            // Itera sobre cada filho (seção)
            for (let i = 0; i < totalSections; i++) {
                let child = childrenToAnalyze[i];
                const sectionIndex = i + 1;

                // Aplica unwrapping agressivo para remover containers redundantes
                const originalName = child.name;
                // child = unwrapNode(child); // DESATIVADO POR SOLICITAÇÃO DO USUÁRIO
                // if (child.name !== originalName) {
                //     figma.notify(`🧹 Simplificando seção ${sectionIndex}: ${originalName} -> ${child.name}`);
                // }

                figma.notify(`🤖 Analisando seção ${sectionIndex} de ${totalSections}: ${child.name}...`);
                figma.ui.postMessage({ type: 'add-gemini-log', data: `--- INICIANDO ANÁLISE DA SEÇÃO ${sectionIndex}/${totalSections}: ${child.name} ---` });

                // Exporta imagem da seção
                const sectionImageData = await child.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } });
                const base64SectionImage = figma.base64Encode(sectionImageData);

                // MOSTRA O PRINT NA UI (Igual ao botão roxo)
                // Envia para a área principal (Modal)
                figma.ui.postMessage({
                    type: 'show-analysis-results',
                    data: '', // Texto vazio, apenas imagem
                    image: base64SectionImage
                });

                // Envia também para o Log (para histórico)
                figma.ui.postMessage({
                    type: 'show-preview-image',
                    image: base64SectionImage,
                    name: child.name
                });

                // Serializa dados da seção
                const sectionSerializedData = serializeNode(child);

                // LOG DETALHADO DOS DADOS COLETADOS
                figma.ui.postMessage({
                    type: 'add-gemini-log',
                    data: `🔍 DADOS COLETADOS (Seção ${sectionIndex} - ${child.name}):\n${JSON.stringify(sectionSerializedData, null, 2)}`
                });

                // Analisa a seção individualmente usando a nova lógica de geração JSON
                // Nota: Passamos availableImageIds globais para que imagens possam ser reutilizadas mesmo dentro das seções
                const sectionAnalysis = await Gemini.generateFigmaLayoutJSON(sectionImageData, availableImageIds, sectionSerializedData);

                // LOG DA RESPOSTA DA IA
                figma.ui.postMessage({
                    type: 'add-gemini-log',
                    data: `🤖 RESPOSTA DA IA (Seção ${sectionIndex} - ${child.name}):\n${JSON.stringify(sectionAnalysis, null, 2)}`
                });

                if (sectionAnalysis.children) {
                    aggregatedChildren.push(...sectionAnalysis.children);
                }
                if (sectionAnalysis.improvements) {
                    aggregatedImprovements.push(...sectionAnalysis.improvements);
                }
            }

            figma.notify('🎨 Montando frame final otimizado...');

            // Cria um objeto de análise consolidado
            const finalAnalysis = {
                frameName: node.name + " (Otimizado)",
                width: node.width,
                height: node.height,
                background: getBackgroundFromNode(node), // Extrai o background do node original
                autoLayout: { direction: "vertical" as "vertical" | "horizontal", gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
                children: aggregatedChildren,
                improvements: [...new Set(aggregatedImprovements)] // Remove duplicatas
            };

            const newFrame = await createOptimizedFrame(finalAnalysis, node, availableImages);

            figma.currentPage.selection = [newFrame];
            figma.viewport.scrollAndZoomIntoView([newFrame]);

            figma.ui.postMessage({
                type: 'gemini-creation-complete',
                data: {
                    originalName: node.name,
                    newName: newFrame.name,
                    improvements: finalAnalysis.improvements
                }
            });

            figma.notify('✅ Frame recriado com sucesso (Análise por seções)!');

        } catch (e: any) {
            console.error("Erro detalhado na análise Gemini:", e);
            figma.notify('❌ Erro na análise: ' + e.message);
            figma.ui.postMessage({
                type: 'gemini-error',
                error: e.message
            });
        } finally {
            figma.ui.postMessage({ type: 'hide-loader' });
        }
    }

    // Analisa o layout com foco em Auto Layout do Figma (Debug/Guia)
    else if (msg.type === 'analyze-layout-figma') {
        const selection = figma.currentPage.selection;
        if (selection.length !== 1) {
            figma.notify('⚠️ Selecione apenas 1 frame para análise');
            return;
        }

        const node = selection[0];
        if (node.type !== 'FRAME' && node.type !== 'SECTION' && node.type !== 'COMPONENT') {
            figma.notify('⚠️ Selecione um Frame, Section ou Componente válido.');
            return;
        }

        figma.notify('📐 Gerando guia de Auto Layout...');
        figma.ui.postMessage({ type: 'show-loader', text: 'Gerando guia passo-a-passo...' });

        try {
            const availableImages = await extractImagesFromNode(node);
            const availableImageIds = Object.keys(availableImages);

            // Simplificação: Analisa o frame inteiro de uma vez
            const imageData = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } });
            const serializedData = serializeNode(node);

            // Envia para o Gemini (Modo Texto/Guia)
            const analysisText = await Gemini.analyzeLayoutFigma(imageData, availableImageIds, serializedData);

            // Converte imagem para base64 para exibir na UI
            const base64Image = figma.base64Encode(imageData);

            // Envia para a UI exibir
            figma.ui.postMessage({
                type: 'show-analysis-results',
                data: analysisText,
                image: base64Image
            });
            figma.notify('✅ Guia gerado com sucesso!');

        } catch (e: any) {
            console.error(e);
            figma.notify('❌ Erro: ' + e.message);
        } finally {
            figma.ui.postMessage({ type: 'hide-loader' });
        }
    }

    // --- NOVO: CRIAR LAYOUT A PARTIR DE JSON ---
    else if (msg.type === 'create-from-json') {
        try {
            const rawJson = JSON.parse(msg.data);
            figma.notify('🏗️ Criando layout a partir do JSON...');
            figma.ui.postMessage({ type: 'add-gemini-log', data: '🏗️ Iniciando criação do layout via JSON...' });

            // Normaliza o JSON (suporta formato Figma API e formato Gemini)
            const normalizedAnalysis = normalizeFigmaJSON(rawJson);
            figma.ui.postMessage({ type: 'add-gemini-log', data: `🔄 JSON Normalizado: Frame "${normalizedAnalysis.frameName}"` });

            // Passamos null como node original, pois é uma criação do zero
            const newFrame = await createOptimizedFrame(normalizedAnalysis, null);

            figma.currentPage.selection = [newFrame];
            figma.viewport.scrollAndZoomIntoView([newFrame]);
            figma.notify('✅ Layout criado com sucesso!');
            figma.ui.postMessage({ type: 'add-gemini-log', data: '✅ Layout criado com sucesso!' });
        } catch (e: any) {
            figma.notify('❌ Erro ao criar layout: ' + e.message);
            figma.ui.postMessage({ type: 'add-gemini-log', data: '❌ Erro ao criar layout: ' + e.message });
            console.error(e);
        }
    }

    else if (msg.type === 'resize-ui') {
        figma.ui.resize(msg.width, msg.height);
    }
};
