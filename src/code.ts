// Elementor JSON Compiler – Versão Refatorada
// Exporta frames do Figma para JSON compatível com Elementor (clipboard)
// Refatorado para melhor manutenibilidade e reaproveitamento de código

// -------------------- Imports dos Módulos Refatorados --------------------
import type { ElementorTemplate, WPConfig } from './types/elementor.types';
import { ElementorCompiler } from './compiler/elementor.compiler';
import * as Gemini from './api_gemini';
import * as DeepSeek from './api_deepseek';
import type { LayoutAnalysis, ChildNode } from './api_gemini';
import { createOptimizedFrame } from './gemini_frame_builder';
import { extractImagesFromNode, getBackgroundFromNode } from './utils/image_utils';
import { serializeNode, normalizeFigmaJSON, getSectionsToAnalyze } from './utils/serialization_utils';

// -------------------- Type Guards (mantidos para compatibilidade) --------------------
function hasLayout(node: SceneNode): node is FrameNode | ComponentNode | InstanceNode {
    return 'layoutMode' in node;
}

// -------------------- Helper Functions --------------------
// (Funções de imagem e serialização movidas para src/utils)


// Helper simples para construção de nodes (Engine "Burra" para teste)
const buildNode = (data: any, parent?: FrameNode) => {
    let node: SceneNode;
    if (data.type === 'FRAME') {
        const frame = figma.createFrame();
        node = frame;
        frame.name = data.name;

        // Add to parent FIRST so we can set layout sizing properties that depend on parent
        if (parent) parent.appendChild(node);

        if (data.width) frame.resize(data.width, typeof data.height === 'number' ? data.height : 100);
        if (data.layoutMode) frame.layoutMode = data.layoutMode;
        if (data.primaryAxisAlignItems) {
            if (data.primaryAxisAlignItems === 'START') frame.primaryAxisAlignItems = 'MIN';
            else if (data.primaryAxisAlignItems === 'END') frame.primaryAxisAlignItems = 'MAX';
            else frame.primaryAxisAlignItems = data.primaryAxisAlignItems;
        }
        if (data.counterAxisAlignItems) {
            if (data.counterAxisAlignItems === 'START') frame.counterAxisAlignItems = 'MIN';
            else if (data.counterAxisAlignItems === 'END') frame.counterAxisAlignItems = 'MAX';
            else frame.counterAxisAlignItems = data.counterAxisAlignItems;
        }
        if (data.itemSpacing) frame.itemSpacing = data.itemSpacing;
        if (data.paddingTop) frame.paddingTop = data.paddingTop;
        if (data.paddingBottom) frame.paddingBottom = data.paddingBottom;
        if (data.paddingLeft) frame.paddingLeft = data.paddingLeft;
        if (data.paddingRight) frame.paddingRight = data.paddingRight;
        if (data.cornerRadius) frame.cornerRadius = data.cornerRadius;
        if (data.topLeftRadius) frame.topLeftRadius = data.topLeftRadius;
        if (data.topRightRadius) frame.topRightRadius = data.topRightRadius;
        if (data.bottomLeftRadius) frame.bottomLeftRadius = data.bottomLeftRadius;
        if (data.bottomRightRadius) frame.bottomRightRadius = data.bottomRightRadius;
        if (data.strokes) frame.strokes = data.strokes;
        if (data.strokeWeight) frame.strokeWeight = data.strokeWeight;
        if (data.fills) frame.fills = data.fills;

        // Set sizing AFTER appending to parent and parent has layoutMode (if applicable)
        // Note: The parent must have layoutMode != "NONE" for these to work.
        // Since we build top-down, parent should be ready.
        if (data.layoutSizingHorizontal === 'FILL') frame.layoutSizingHorizontal = 'FILL';
        if (data.layoutSizingVertical === 'FILL') frame.layoutSizingVertical = 'FILL';
        if (data.layoutSizingVertical === 'HUG') frame.layoutSizingVertical = 'HUG';

        if (data.primaryAxisSizingMode) {
            if (data.primaryAxisSizingMode === 'HUG') frame.primaryAxisSizingMode = 'AUTO';
            else if (data.primaryAxisSizingMode === 'FILL') frame.primaryAxisSizingMode = 'FIXED';
            else frame.primaryAxisSizingMode = data.primaryAxisSizingMode;
        }
        if (data.counterAxisSizingMode) {
            if (data.counterAxisSizingMode === 'HUG') frame.counterAxisSizingMode = 'AUTO';
            else if (data.counterAxisSizingMode === 'FILL') frame.counterAxisSizingMode = 'FIXED';
            else frame.counterAxisSizingMode = data.counterAxisSizingMode;
        }

        if (data.children) {
            data.children.forEach((childData: any) => buildNode(childData, frame));
        }
    } else if (data.type === 'TEXT') {
        const text = figma.createText();
        node = text;
        text.name = data.name;

        // Add to parent FIRST
        if (parent) parent.appendChild(node);

        text.characters = data.characters;
        if (data.fontSize) text.fontSize = data.fontSize;
        if (data.fontName) text.fontName = data.fontName;
        if (data.fills) text.fills = data.fills;
        else if (data.color) {
            text.fills = [{ type: 'SOLID', color: data.color }];
        }
        if (data.textAlignHorizontal) text.textAlignHorizontal = data.textAlignHorizontal;
        if (data.lineHeight) text.lineHeight = data.lineHeight;

        // Set sizing AFTER appending
        if (data.layoutSizingHorizontal === 'FILL') text.layoutSizingHorizontal = 'FILL';
    } else {
        return;
    }

    return node;
};

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


// Helper auxiliar (se não existir)


figma.ui.onmessage = async (msg) => {
    console.log('📨 Mensagem recebida:', msg.type);
    console.log('Dados completos:', msg);

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
        console.log('📥 Recebido get-wp-config');
        const config = await figma.clientStorage.getAsync('wp_config');
        console.log('Config WP recuperada:', config);
        figma.ui.postMessage({ type: 'load-wp-config', config });
    }

    else if (msg.type === 'get-gemini-config') {
        console.log('📥 Recebido get-gemini-config');
        const apiKey = await Gemini.getKey();
        const model = await Gemini.getModel();
        console.log('Gemini config recuperada - API Key:', apiKey ? 'presente' : 'ausente', 'Modelo:', model);
        figma.ui.postMessage({ type: 'load-gemini-config', apiKey, model });
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

    // Salva a API Key do Gemini
    else if (msg.type === 'save-gemini-key') {
        console.log('📥 Recebido save-gemini-key');
        console.log('Key recebida:', msg.key);

        try {
            await Gemini.saveKey(msg.key);
            console.log('✅ Key salva com sucesso');
            figma.notify('🔑 API Key do Gemini salva com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao salvar key:', error);
            figma.notify('❌ Erro ao salvar API Key');
        }
    }

    // Salva o modelo Gemini selecionado
    else if (msg.type === 'save-gemini-model') {
        console.log('📥 Recebido save-gemini-model');
        await Gemini.saveModel(msg.model);
        figma.notify(`🤖 Modelo Gemini definido para: ${msg.model}`);
    }

    // Testa a conexão com a API Gemini usando a SDK
    else if (msg.type === 'test-gemini-connection') {
        console.log('📥 Recebido test-gemini-connection');
        figma.notify('Testando conexão com a API Gemini...');
        try {
            const result = await Gemini.testConnection();
            console.log('Resultado do teste:', result);

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
        if (node.type !== 'FRAME' && node.type !== 'SECTION' && node.type !== 'COMPONENT' && node.type !== 'GROUP') {
            figma.notify('⚠️ Selecione um Frame, Section, Componente ou Grupo válido.');
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
            console.log('🖼️ Imagens extraídas do original:', availableImageIds);
            figma.ui.postMessage({ type: 'add-gemini-log', data: `🖼️ Imagens encontradas no original: ${availableImageIds.length}` });
            if (availableImageIds.length > 0) {
                figma.ui.postMessage({ type: 'add-gemini-log', data: `IDs: ${availableImageIds.join(', ')}` });
            }

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

                // Serializa dados da seção
                const sectionSerializedData = serializeNode(child);

                // LOG DETALHADO DOS DADOS COLETADOS
                figma.ui.postMessage({
                    type: 'add-gemini-log',
                    data: `🔍 DADOS COLETADOS (Seção ${sectionIndex} - ${child.name}):\n${JSON.stringify(sectionSerializedData, null, 2)}`
                });

                // Analisa a seção individualmente usando a nova lógica de geração JSON
                // Nota: Passamos availableImageIds globais para que imagens possam ser reutilizadas mesmo dentro das seções
                const sectionAnalysis = await Gemini.analyzeAndRecreate(sectionImageData, availableImageIds, sectionSerializedData);

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
            // ... (existing code)

            // Cria um objeto de análise consolidado
            // Cria um objeto de análise consolidado
            const finalAnalysis: any = {
                type: "FRAME",
                name: node.name + " (Otimizado)",
                frameName: node.name + " (Otimizado)",
                width: node.width,
                height: node.height,
                layoutMode: "VERTICAL",
                background: getBackgroundFromNode(node),
                autoLayout: { direction: "vertical", gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
                children: aggregatedChildren,
                improvements: [...new Set(aggregatedImprovements)]
            };

            // 1. Cria o frame visual no Figma (USANDO MOTOR SIMPLES PARA TESTE)
            // const newFrame = await createOptimizedFrame(finalAnalysis, node, availableImages);
            const newFrame = buildNode(finalAnalysis) as FrameNode;
            if (node) {
                newFrame.x = node.x + node.width + 100;
                newFrame.y = node.y;
            }

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

            // 2. FASE 4: CONSOLIDAÇÃO PARA JSON ELEMENTOR
            figma.notify('🔗 Iniciando Fase 4: Consolidação Final...');
            figma.ui.postMessage({ type: 'add-gemini-log', data: `--- FASE 4: CONSOLIDAÇÃO ---` });

            // Converter LayoutAnalysis para ProcessedNode[]
            const processedNodes: Gemini.ProcessedNode[] = flattenAnalysisToNodes(finalAnalysis);

            figma.ui.postMessage({
                type: 'add-gemini-log',
                data: `📋 Nodes para consolidação: ${processedNodes.length}\n${JSON.stringify(processedNodes, null, 2)}`
            });

            // Chamar API de consolidação
            const consolidationResult = await Gemini.consolidateNodes(processedNodes);

            figma.ui.postMessage({
                type: 'add-gemini-log',
                data: `✅ CONSOLIDAÇÃO CONCLUÍDA:\n${JSON.stringify(consolidationResult, null, 2)}`
            });

            // Enviar resultado final para a UI (para download/copiar)
            figma.ui.postMessage({
                type: 'consolidation-result',
                result: consolidationResult
            });

            figma.notify('✅ Conversão Completa! JSON gerado.');

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

    // =================================================================
    // ----- LÓGICA DO DEEPSEEK ---------------------------------------
    // =================================================================

    else if (msg.type === 'save-deepseek-key') {
        await DeepSeek.saveDeepSeekKey(msg.key);
        figma.notify('🔑 API Key do DeepSeek salva com sucesso!');
    }

    else if (msg.type === 'save-deepseek-model') {
        await DeepSeek.saveDeepSeekModel(msg.model);
        figma.notify(`🤖 Modelo DeepSeek definido para: ${msg.model}`);
    }

    else if (msg.type === 'get-deepseek-config') {
        const apiKey = await DeepSeek.getDeepSeekKey();
        const model = await DeepSeek.getDeepSeekModel();
        figma.ui.postMessage({ type: 'load-deepseek-config', apiKey, model });
    }

    else if (msg.type === 'test-deepseek-connection') {
        figma.notify('Testando conexão com DeepSeek...');
        const result = await DeepSeek.testDeepSeekConnection();
        figma.ui.postMessage({ type: 'deepseek-connection-result', ...result });
        if (result.success) figma.notify(result.message);
        else figma.notify('❌ Falha na conexão DeepSeek');
    }

    else if (msg.type === 'analyze-with-deepseek') {
        const selection = figma.currentPage.selection;
        if (selection.length !== 1) {
            figma.notify('⚠️ Selecione apenas 1 frame para análise');
            return;
        }

        const node = selection[0];

        // Validação mais estrita do tipo de node
        if (node.type !== 'FRAME' && node.type !== 'SECTION' && node.type !== 'COMPONENT' && node.type !== 'GROUP') {
            figma.notify('⚠️ Selecione um Frame, Section, Componente ou Grupo válido.');
            return;
        }

        if (!('children' in node)) {
            figma.notify('⚠️ O elemento selecionado não possui filhos para análise.');
            return;
        }

        figma.notify('🤖 Iniciando análise com DeepSeek...');

        try {
            // Extrai imagens globais para reutilização
            const availableImages = await extractImagesFromNode(node);
            const availableImageIds = Object.keys(availableImages);
            console.log('🖼️ Imagens extraídas do original:', availableImageIds);
            figma.ui.postMessage({ type: 'add-gemini-log', data: `🖼️ Imagens encontradas no original: ${availableImageIds.length}` });

            // Prepara lista de filhos para análise
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

                figma.notify(`🤖 Analisando seção ${sectionIndex} de ${totalSections}: ${child.name}...`);
                figma.ui.postMessage({ type: 'add-gemini-log', data: `--- INICIANDO ANÁLISE DA SEÇÃO ${sectionIndex}/${totalSections}: ${child.name} ---` });

                // Serializa dados da seção
                const sectionSerializedData = serializeNode(child);

                // LOG DETALHADO DOS DADOS COLETADOS
                figma.ui.postMessage({
                    type: 'add-gemini-log',
                    data: `🔍 DADOS COLETADOS (Seção ${sectionIndex} - ${child.name}):\n${JSON.stringify(sectionSerializedData, null, 2)}`
                });

                // Exporta imagem da seção para análise visual (se suportado)
                const sectionImageData = await child.exportAsync({ format: 'JPG', constraint: { type: 'SCALE', value: 1 } });

                // Analisa a seção individualmente usando DeepSeek
                const sectionAnalysis = await DeepSeek.analyzeLayoutDeepSeek(sectionSerializedData, child.id, sectionImageData);

                // LOG DA RESPOSTA DA IA
                figma.ui.postMessage({
                    type: 'add-gemini-log',
                    data: `🤖 RESPOSTA DEEPSEEK (Seção ${sectionIndex} - ${child.name}):\n${JSON.stringify(sectionAnalysis, null, 2)}`
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
            // Cria um objeto de análise consolidado
            const finalAnalysis: any = {
                type: "FRAME",
                name: node.name + " (DeepSeek Otimizado)",
                frameName: node.name + " (DeepSeek Otimizado)",
                width: node.width,
                height: node.height,
                layoutMode: "VERTICAL",
                background: getBackgroundFromNode(node),
                autoLayout: { direction: "vertical", gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
                children: aggregatedChildren,
                improvements: [...new Set(aggregatedImprovements)]
            };

            // 1. Cria o frame visual no Figma (USANDO MOTOR SIMPLES PARA TESTE)
            // const newFrame = await createOptimizedFrame(finalAnalysis, node, availableImages);
            const newFrame = buildNode(finalAnalysis) as FrameNode;
            if (node) {
                newFrame.x = node.x + node.width + 100;
                newFrame.y = node.y;
            }

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

            // 2. FASE 4: CONSOLIDAÇÃO PARA JSON ELEMENTOR
            figma.notify('🔗 Iniciando Fase 4: Consolidação Final...');
            figma.ui.postMessage({ type: 'add-gemini-log', data: `--- FASE 4: CONSOLIDAÇÃO ---` });

            // Converter LayoutAnalysis para ProcessedNode[]
            const processedNodes: Gemini.ProcessedNode[] = flattenAnalysisToNodes(finalAnalysis);

            // Chamar API de consolidação do DeepSeek
            const consolidationResult = await DeepSeek.consolidateNodes(processedNodes);

            figma.ui.postMessage({
                type: 'add-gemini-log',
                data: `✅ CONSOLIDAÇÃO CONCLUÍDA:\n${JSON.stringify(consolidationResult, null, 2)}`
            });

            figma.ui.postMessage({
                type: 'consolidation-result',
                result: consolidationResult
            });

            figma.notify('✅ Conversão Completa! JSON gerado.');

        } catch (e: any) {
            console.error("Erro detalhado na análise DeepSeek:", e);
            figma.notify('❌ Erro na análise: ' + e.message);
            figma.ui.postMessage({
                type: 'gemini-error',
                error: e.message
            });
        } finally {
            figma.ui.postMessage({ type: 'hide-loader' });
        }
    }

    else if (msg.type === 'resize-ui') {
        figma.ui.resize(msg.width, msg.height);
    }

    // Gerar Frame de Teste Otimizado
    else if (msg.type === 'create-test-frame') {
        try {
            const testFrameData = {
                "id": "root-frame",
                "name": "Desktop - Homepage Optimized",
                "type": "FRAME",
                "width": 1920,
                "height": 1304,
                "layoutMode": "VERTICAL",
                "primaryAxisSizingMode": "AUTO",
                "counterAxisSizingMode": "FIXED",
                "fills": [],
                "children": [
                    {
                        "id": "section-hero",
                        "name": "Section 1 - Hero (Full Container)",
                        "type": "FRAME",
                        "width": 1920,
                        "height": 571,
                        "layoutMode": "HORIZONTAL",
                        "primaryAxisSizingMode": "FIXED",
                        "counterAxisSizingMode": "AUTO",
                        "fills": [],
                        "paddingTop": 0,
                        "paddingRight": 320,
                        "paddingBottom": 0,
                        "paddingLeft": 320,
                        "itemSpacing": 0,
                        "children": [
                            {
                                "id": "hero-content-col",
                                "name": "Container - Left Content",
                                "type": "FRAME",
                                "width": 610,
                                "height": 550,
                                "layoutMode": "VERTICAL",
                                "primaryAxisSizingMode": "AUTO",
                                "counterAxisSizingMode": "FIXED",
                                "fills": [],
                                "itemSpacing": 24,
                                "primaryAxisAlignItems": "START",
                                "counterAxisAlignItems": "START",
                                "children": [
                                    {
                                        "id": "hero-heading",
                                        "name": "Heading - Title",
                                        "type": "TEXT",
                                        "width": 526,
                                        "height": 96,
                                        "characters": "O que é a Harmonização\nIntima Masculina ?",
                                        "fontSize": 40,
                                        "fontName": {
                                            "family": "Inter",
                                            "style": "Bold"
                                        },
                                        "fontWeight": 700,
                                        "textAlignHorizontal": "LEFT",
                                        "textAlignVertical": "CENTER",
                                        "letterSpacing": {
                                            "unit": "PIXELS",
                                            "value": -1
                                        },
                                        "lineHeight": {
                                            "unit": "PIXELS",
                                            "value": 48
                                        },
                                        "textCase": "UPPER",
                                        "color": {
                                            "r": 0.007843137718737125,
                                            "g": 0.4313725531101227,
                                            "b": 0.47843137383461
                                        }
                                    },
                                    {
                                        "id": "hero-text",
                                        "name": "Text Editor - Description",
                                        "type": "TEXT",
                                        "width": 554,
                                        "height": 264,
                                        "characters": "A harmonização íntima masculina é um procedimento estético que visa aumentar tanto o tamanho quanto a circunferência do Pênis, além de corrigir assimetrias e melhorar a aparência.\n\nO Protocolo NEXX utiliza Ácido Hialurônico, Toxina Botulínica e FIOS de PDO, produtos seguros, eficazes e compatíveis com o nosso organismo. Trata-se de um procedimento minimamente invasivo, realizado sob anestesia local, com recuperação rápida e resultados imediatos.",
                                        "fontSize": 20,
                                        "fontName": {
                                            "family": "Inter",
                                            "style": "Regular"
                                        },
                                        "fontWeight": 400,
                                        "textAlignHorizontal": "JUSTIFIED",
                                        "textAlignVertical": "CENTER",
                                        "lineHeight": {
                                            "unit": "PIXELS",
                                            "value": 24
                                        },
                                        "color": {
                                            "r": 0.20000000298023224,
                                            "g": 0.20000000298023224,
                                            "b": 0.20000000298023224
                                        }
                                    },
                                    {
                                        "id": "hero-button",
                                        "name": "Button - Agendar Avaliação",
                                        "type": "FRAME",
                                        "width": 350,
                                        "height": 61,
                                        "layoutMode": "HORIZONTAL",
                                        "primaryAxisSizingMode": "FIXED",
                                        "counterAxisSizingMode": "FIXED",
                                        "fills": [
                                            {
                                                "type": "SOLID",
                                                "color": {
                                                    "r": 0.007843137718737125,
                                                    "g": 0.4313725531101227,
                                                    "b": 0.47843137383461
                                                }
                                            }
                                        ],
                                        "cornerRadius": 30,
                                        "primaryAxisAlignItems": "CENTER",
                                        "counterAxisAlignItems": "CENTER",
                                        "children": [
                                            {
                                                "id": "button-text",
                                                "name": "Text - Agendar Avaliação",
                                                "type": "TEXT",
                                                "width": 193.4801025390625,
                                                "height": 20,
                                                "characters": "Agendar Avaliação",
                                                "fontSize": 20,
                                                "fontName": {
                                                    "family": "Sora",
                                                    "style": "SemiBold"
                                                },
                                                "fontWeight": 600,
                                                "textAlignHorizontal": "LEFT",
                                                "textAlignVertical": "CENTER",
                                                "letterSpacing": {
                                                    "unit": "PERCENT",
                                                    "value": 0
                                                },
                                                "lineHeight": {
                                                    "unit": "PIXELS",
                                                    "value": 20
                                                },
                                                "color": {
                                                    "r": 1,
                                                    "g": 1,
                                                    "b": 1
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "id": "hero-image",
                                "name": "Image - Banner Homem",
                                "type": "FRAME",
                                "width": 547,
                                "height": 550,
                                "fills": [
                                    {
                                        "type": "IMAGE",
                                        "imageHash": "8940bc040ef8faaed695b736e6eff3a7c543b3b8",
                                        "scaleMode": "CROP"
                                    }
                                ],
                                "topLeftRadius": 27.43000030517578,
                                "topRightRadius": 27.43000030517578,
                                "bottomLeftRadius": 274.25,
                                "bottomRightRadius": 27.43000030517578
                            }
                        ]
                    },
                    {
                        "id": "section-steps",
                        "name": "Section 2 - Steps (Full Container)",
                        "type": "FRAME",
                        "width": 1920,
                        "height": 677,
                        "layoutMode": "VERTICAL",
                        "primaryAxisSizingMode": "AUTO",
                        "counterAxisSizingMode": "FIXED",
                        "fills": [
                            {
                                "type": "SOLID",
                                "color": {
                                    "r": 0.9647058844566345,
                                    "g": 0.9686274528503418,
                                    "b": 0.9686274528503418
                                }
                            }
                        ],
                        "paddingTop": 0,
                        "paddingRight": 320,
                        "paddingBottom": 0,
                        "paddingLeft": 320,
                        "itemSpacing": 0,
                        "primaryAxisAlignItems": "CENTER",
                        "counterAxisAlignItems": "CENTER",
                        "children": [
                            {
                                "id": "steps-heading",
                                "name": "Heading - Steps Title",
                                "type": "TEXT",
                                "width": 719,
                                "height": 112,
                                "characters": "ENGROSSE E AUMENTE SEU PÊNIS COM RESULTADOS IMEDIATOS",
                                "fontSize": 40,
                                "fontName": {
                                    "family": "Inter",
                                    "style": "Bold"
                                },
                                "fontWeight": 700,
                                "textAlignHorizontal": "CENTER",
                                "textAlignVertical": "CENTER",
                                "letterSpacing": {
                                    "unit": "PIXELS",
                                    "value": -1
                                },
                                "lineHeight": {
                                    "unit": "PIXELS",
                                    "value": 56
                                },
                                "textCase": "UPPER",
                                "color": {
                                    "r": 0.007843137718737125,
                                    "g": 0.4313725531101227,
                                    "b": 0.47843137383461
                                }
                            },
                            {
                                "id": "steps-container",
                                "name": "Container - Steps",
                                "type": "FRAME",
                                "width": 1280,
                                "height": 265,
                                "layoutMode": "HORIZONTAL",
                                "primaryAxisSizingMode": "AUTO",
                                "counterAxisSizingMode": "FIXED",
                                "fills": [],
                                "itemSpacing": 36,
                                "primaryAxisAlignItems": "CENTER",
                                "counterAxisAlignItems": "CENTER",
                                "children": [
                                    {
                                        "id": "step-1",
                                        "name": "Step 1 - Anestesia",
                                        "type": "FRAME",
                                        "width": 408,
                                        "height": 265,
                                        "layoutMode": "VERTICAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "FIXED",
                                        "fills": [
                                            {
                                                "type": "SOLID",
                                                "color": {
                                                    "r": 1,
                                                    "g": 1,
                                                    "b": 1
                                                }
                                            }
                                        ],
                                        "strokes": [
                                            {
                                                "type": "SOLID",
                                                "color": {
                                                    "r": 0.15295857191085815,
                                                    "g": 0.6660650372505188,
                                                    "b": 0.7230768799781799
                                                }
                                            }
                                        ],
                                        "strokeWeight": 1,
                                        "cornerRadius": 12,
                                        "primaryAxisAlignItems": "CENTER",
                                        "counterAxisAlignItems": "CENTER",
                                        "itemSpacing": 8,
                                        "children": [
                                            {
                                                "id": "step-1-image",
                                                "name": "Image - Anestesia",
                                                "type": "FRAME",
                                                "width": 408,
                                                "height": 231,
                                                "fills": [
                                                    {
                                                        "type": "IMAGE",
                                                        "imageHash": "42e2afde322e10744ddbea5a95e2ef2849570b61",
                                                        "scaleMode": "CROP"
                                                    }
                                                ]
                                            },
                                            {
                                                "id": "step-1-text",
                                                "name": "Text - Anestesia",
                                                "type": "TEXT",
                                                "width": 329,
                                                "height": 24,
                                                "characters": "Anestesia Local é Aplicada",
                                                "fontSize": 26,
                                                "fontName": {
                                                    "family": "Inter",
                                                    "style": "Regular"
                                                },
                                                "fontWeight": 400,
                                                "textAlignHorizontal": "JUSTIFIED",
                                                "textAlignVertical": "CENTER",
                                                "letterSpacing": {
                                                    "unit": "PERCENT",
                                                    "value": 0
                                                },
                                                "lineHeight": {
                                                    "unit": "PIXELS",
                                                    "value": 24
                                                },
                                                "color": {
                                                    "r": 0.20000000298023224,
                                                    "g": 0.20000000298023224,
                                                    "b": 0.20000000298023224
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        "id": "step-2",
                                        "name": "Step 2 - Aumento",
                                        "type": "FRAME",
                                        "width": 403,
                                        "height": 262,
                                        "layoutMode": "VERTICAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "FIXED",
                                        "fills": [
                                            {
                                                "type": "SOLID",
                                                "color": {
                                                    "r": 1,
                                                    "g": 1,
                                                    "b": 1
                                                }
                                            }
                                        ],
                                        "strokes": [
                                            {
                                                "type": "SOLID",
                                                "color": {
                                                    "r": 0.01568627543747425,
                                                    "g": 0.7607843279838562,
                                                    "b": 0.7960784435272217
                                                }
                                            }
                                        ],
                                        "strokeWeight": 1,
                                        "cornerRadius": 12,
                                        "primaryAxisAlignItems": "CENTER",
                                        "counterAxisAlignItems": "CENTER",
                                        "itemSpacing": 8,
                                        "children": [
                                            {
                                                "id": "step-2-image",
                                                "name": "Image - Aumento",
                                                "type": "FRAME",
                                                "width": 403,
                                                "height": 233,
                                                "fills": [
                                                    {
                                                        "type": "IMAGE",
                                                        "imageHash": "67d1eeaa0af163b171593ec0086e9b06964feee7",
                                                        "scaleMode": "FILL"
                                                    }
                                                ]
                                            },
                                            {
                                                "id": "step-2-text",
                                                "name": "Text - Aumento",
                                                "type": "TEXT",
                                                "width": 225,
                                                "height": 24,
                                                "characters": "Aumento Imediato",
                                                "fontSize": 26,
                                                "fontName": {
                                                    "family": "Inter",
                                                    "style": "Regular"
                                                },
                                                "fontWeight": 400,
                                                "textAlignHorizontal": "JUSTIFIED",
                                                "textAlignVertical": "CENTER",
                                                "letterSpacing": {
                                                    "unit": "PERCENT",
                                                    "value": 0
                                                },
                                                "lineHeight": {
                                                    "unit": "PIXELS",
                                                    "value": 24
                                                },
                                                "color": {
                                                    "r": 0.20000000298023224,
                                                    "g": 0.20000000298023224,
                                                    "b": 0.20000000298023224
                                                }
                                            }
                                        ]
                                    },
                                    {
                                        "id": "step-3",
                                        "name": "Step 3 - Resultado",
                                        "type": "FRAME",
                                        "width": 407,
                                        "height": 264,
                                        "layoutMode": "VERTICAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "FIXED",
                                        "fills": [
                                            {
                                                "type": "SOLID",
                                                "color": {
                                                    "r": 1,
                                                    "g": 1,
                                                    "b": 1
                                                }
                                            }
                                        ],
                                        "strokes": [
                                            {
                                                "type": "SOLID",
                                                "color": {
                                                    "r": 0.01568627543747425,
                                                    "g": 0.7607843279838562,
                                                    "b": 0.7960784435272217
                                                }
                                            }
                                        ],
                                        "strokeWeight": 1,
                                        "cornerRadius": 12,
                                        "primaryAxisAlignItems": "CENTER",
                                        "counterAxisAlignItems": "CENTER",
                                        "itemSpacing": 8,
                                        "children": [
                                            {
                                                "id": "step-3-image",
                                                "name": "Image - Resultado",
                                                "type": "FRAME",
                                                "width": 407,
                                                "height": 264,
                                                "fills": [
                                                    {
                                                        "type": "IMAGE",
                                                        "imageHash": "ea1036b71582be34af958b067e936c4599722911",
                                                        "scaleMode": "CROP"
                                                    }
                                                ],
                                                "topRightRadius": 12,
                                                "bottomRightRadius": 12
                                            },
                                            {
                                                "id": "step-3-text",
                                                "name": "Text - Resultado",
                                                "type": "TEXT",
                                                "width": 256,
                                                "height": 48,
                                                "characters": "Resultado Final Com Aumento Imediato",
                                                "fontSize": 26,
                                                "fontName": {
                                                    "family": "Inter",
                                                    "style": "Regular"
                                                },
                                                "fontWeight": 400,
                                                "textAlignHorizontal": "CENTER",
                                                "textAlignVertical": "CENTER",
                                                "lineHeight": {
                                                    "unit": "PIXELS",
                                                    "value": 24
                                                },
                                                "color": {
                                                    "r": 0.20000000298023224,
                                                    "g": 0.20000000298023224,
                                                    "b": 0.20000000298023224
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            await figma.loadFontAsync({ family: "Inter", style: "Regular" });
            await figma.loadFontAsync({ family: "Inter", style: "Medium" });
            await figma.loadFontAsync({ family: "Inter", style: "Bold" });
            await figma.loadFontAsync({ family: "Sora", style: "SemiBold" });

            const rootFrame = buildNode(testFrameData) as FrameNode;
            if (rootFrame) {
                figma.currentPage.selection = [rootFrame];
                figma.viewport.scrollAndZoomIntoView([rootFrame]);
                figma.notify("✅ Frame de teste OTIMIZADO criado!");
            }

        } catch (e: any) {
            console.error("Erro ao criar frame de teste:", e);
            figma.notify("❌ Erro ao criar frame: " + e.message);
        }
    }
};



// Helper para converter LayoutAnalysis em ProcessedNode[]
function flattenAnalysisToNodes(analysis: Gemini.LayoutAnalysis): Gemini.ProcessedNode[] {
    const nodes: Gemini.ProcessedNode[] = [];
    let nodeIdCounter = 1;

    function processChild(child: Gemini.ChildNode, parentId?: string) {
        const currentId = `node_${nodeIdCounter++}`;

        const node: Gemini.ProcessedNode = {
            nodeId: currentId,
            widget: child.name || child.widgetType || 'w:container', // Fallback
            confidence: 'high',
            settings: {
                ...child, // Passa todas as propriedades como settings iniciais
                _originalType: child.type
            },
            parentId: parentId,
            children: [] // Será preenchido se houver filhos
        };

        nodes.push(node);

        if (child.children && child.children.length > 0) {
            child.children.forEach(c => {
                const childId = processChild(c, currentId);
                node.children?.push(childId);
            });
        }

        return currentId;
    }

    // Processar filhos raiz
    if (analysis.children) {
        analysis.children.forEach(child => processChild(child));
    }

    return nodes;
}
