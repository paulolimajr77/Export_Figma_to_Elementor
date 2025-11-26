// Elementor JSON Compiler – Versão Refatorada
// Exporta frames do Figma para JSON compatível com Elementor (clipboard)
// Refatorado para melhor manutenibilidade e reaproveitamento de código

// -------------------- Imports dos Módulos Refatorados --------------------
import type { ElementorTemplate, WPConfig } from './types/elementor.types';
import { ElementorCompiler } from './compiler/elementor.compiler';
import * as Gemini from './api_gemini';
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
            const finalAnalysis: Gemini.LayoutAnalysis = {
                frameName: node.name + " (Otimizado)",
                width: node.width,
                height: node.height,
                background: getBackgroundFromNode(node),
                autoLayout: { direction: "vertical", gap: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
                children: aggregatedChildren,
                improvements: [...new Set(aggregatedImprovements)]
            };

            // 1. Cria o frame visual no Figma (Feedback imediato)
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
                "height": 2000,
                "x": 0,
                "y": 0,
                "visible": true,
                "layoutMode": "VERTICAL",
                "primaryAxisSizingMode": "AUTO",
                "counterAxisSizingMode": "FIXED",
                "primaryAxisAlignItems": "MIN",
                "counterAxisAlignItems": "CENTER",
                "itemSpacing": 0,
                "paddingTop": 0,
                "paddingRight": 0,
                "paddingBottom": 0,
                "paddingLeft": 0,
                "fills": [
                    {
                        "type": "SOLID",
                        "color": { "r": 1, "g": 1, "b": 1 },
                        "visible": true
                    }
                ],
                "children": [
                    {
                        "id": "section-hero",
                        "name": "Section 1 - Hero (Full Container)",
                        "type": "FRAME",
                        "layoutMode": "HORIZONTAL",
                        "primaryAxisSizingMode": "FIXED",
                        "counterAxisSizingMode": "AUTO",
                        "width": 1920,
                        "paddingTop": 100,
                        "paddingBottom": 100,
                        "paddingLeft": 320,
                        "paddingRight": 320,
                        "itemSpacing": 64,
                        "primaryAxisAlignItems": "CENTER",
                        "counterAxisAlignItems": "CENTER",
                        "fills": [
                            {
                                "type": "SOLID",
                                "color": { "r": 1, "g": 1, "b": 1 }
                            }
                        ],
                        "children": [
                            {
                                "id": "hero-content-col",
                                "name": "Container - Left Content",
                                "type": "FRAME",
                                "layoutMode": "VERTICAL",
                                "primaryAxisSizingMode": "AUTO",
                                "counterAxisSizingMode": "FIXED",
                                "layoutSizingHorizontal": "FILL",
                                "width": 600,
                                "itemSpacing": 32,
                                "children": [
                                    {
                                        "id": "hero-heading",
                                        "name": "Heading - Title",
                                        "type": "TEXT",
                                        "characters": "O que é a Harmonização\nIntima Masculina?",
                                        "fontSize": 48,
                                        "fontName": { "family": "Inter", "style": "Bold" },
                                        "fontWeight": 700,
                                        "fills": [{ "type": "SOLID", "color": { "r": 0.007, "g": 0.431, "b": 0.478 } }],
                                        "layoutSizingHorizontal": "FILL"
                                    },
                                    {
                                        "id": "hero-text",
                                        "name": "Text Editor - Description",
                                        "type": "TEXT",
                                        "characters": "A harmonização íntima masculina é um procedimento estético que visa aumentar tanto o tamanho quanto a circunferência do Pênis, além de corrigir assimetrias e melhorar a aparência.\n\nO Protocolo NEXX utiliza Ácido Hialurônico, Toxina Botulínica e FIOS de PDO, produtos seguros, eficazes e compatíveis com o nosso organismo.",
                                        "fontSize": 18,
                                        "fontName": { "family": "Inter", "style": "Regular" },
                                        "lineHeight": { "value": 28, "unit": "PIXELS" },
                                        "fills": [{ "type": "SOLID", "color": { "r": 0.2, "g": 0.2, "b": 0.2 } }],
                                        "layoutSizingHorizontal": "FILL"
                                    },
                                    {
                                        "id": "hero-button",
                                        "name": "Button - CTA",
                                        "type": "FRAME",
                                        "layoutMode": "HORIZONTAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "AUTO",
                                        "primaryAxisAlignItems": "CENTER",
                                        "counterAxisAlignItems": "CENTER",
                                        "paddingTop": 20,
                                        "paddingBottom": 20,
                                        "paddingLeft": 40,
                                        "paddingRight": 40,
                                        "cornerRadius": 50,
                                        "fills": [{ "type": "SOLID", "color": { "r": 0.007, "g": 0.431, "b": 0.478 } }],
                                        "children": [
                                            {
                                                "id": "btn-text",
                                                "name": "Label",
                                                "type": "TEXT",
                                                "characters": "Agendar Avaliação",
                                                "fontSize": 18,
                                                "fontName": { "family": "Sora", "style": "SemiBold" },
                                                "fills": [{ "type": "SOLID", "color": { "r": 1, "g": 1, "b": 1 } }]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "id": "hero-image-col",
                                "name": "Container - Right Image",
                                "type": "FRAME",
                                "layoutMode": "VERTICAL",
                                "primaryAxisSizingMode": "AUTO",
                                "counterAxisSizingMode": "FIXED",
                                "width": 547,
                                "height": 550,
                                "cornerRadius": 24,
                                "topLeftRadius": 24,
                                "topRightRadius": 24,
                                "bottomLeftRadius": 270,
                                "bottomRightRadius": 24,
                                "fills": [
                                    {
                                        "type": "IMAGE",
                                        "scaleMode": "FILL",
                                        "imageHash": "8940bc040ef8faaed695b736e6eff3a7c543b3b8"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "id": "section-features",
                        "name": "Section 2 - Features (Full Container)",
                        "type": "FRAME",
                        "layoutMode": "VERTICAL",
                        "primaryAxisSizingMode": "AUTO",
                        "counterAxisSizingMode": "FIXED",
                        "width": 1920,
                        "paddingTop": 100,
                        "paddingBottom": 100,
                        "paddingLeft": 320,
                        "paddingRight": 320,
                        "itemSpacing": 64,
                        "primaryAxisAlignItems": "CENTER",
                        "fills": [
                            {
                                "type": "SOLID",
                                "color": { "r": 0.96, "g": 0.97, "b": 0.97 }
                            }
                        ],
                        "children": [
                            {
                                "id": "feature-heading",
                                "name": "Heading - Section Title",
                                "type": "TEXT",
                                "characters": "ENGROSSE E AUMENTE SEU PÊNIS COM RESULTADOS IMEDIATOS",
                                "textAlignHorizontal": "CENTER",
                                "fontSize": 36,
                                "fontName": { "family": "Inter", "style": "Bold" },
                                "fills": [{ "type": "SOLID", "color": { "r": 0.007, "g": 0.431, "b": 0.478 } }]
                            },
                            {
                                "id": "features-grid",
                                "name": "Container - Grid (Flex Row)",
                                "type": "FRAME",
                                "layoutMode": "HORIZONTAL",
                                "primaryAxisSizingMode": "AUTO",
                                "counterAxisSizingMode": "FIXED",
                                "primaryAxisAlignItems": "CENTER",
                                "itemSpacing": 32,
                                "layoutSizingHorizontal": "FILL",
                                "children": [
                                    {
                                        "id": "card-1",
                                        "name": "Container - Card 1",
                                        "type": "FRAME",
                                        "layoutMode": "VERTICAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "FIXED",
                                        "itemSpacing": 16,
                                        "width": 400,
                                        "children": [
                                            {
                                                "id": "img-box-1",
                                                "name": "Image Box",
                                                "type": "FRAME",
                                                "layoutMode": "VERTICAL",
                                                "primaryAxisSizingMode": "FIXED",
                                                "counterAxisSizingMode": "FIXED",
                                                "width": 400,
                                                "height": 260,
                                                "cornerRadius": 12,
                                                "strokes": [{ "type": "SOLID", "color": { "r": 0.015, "g": 0.76, "b": 0.796 } }],
                                                "strokeWeight": 1,
                                                "fills": [{ "type": "IMAGE", "scaleMode": "FILL", "imageHash": "42e2afde322e10744ddbea5a95e2ef2849570b61" }]
                                            },
                                            {
                                                "id": "text-1",
                                                "name": "Heading",
                                                "type": "TEXT",
                                                "characters": "Anestesia Local é Aplicada",
                                                "fontSize": 20,
                                                "textAlignHorizontal": "CENTER",
                                                "layoutSizingHorizontal": "FILL",
                                                "fontName": { "family": "Inter", "style": "Medium" },
                                                "fills": [{ "type": "SOLID", "color": { "r": 0.2, "g": 0.2, "b": 0.2 } }]
                                            }
                                        ]
                                    },
                                    {
                                        "id": "card-2",
                                        "name": "Container - Card 2",
                                        "type": "FRAME",
                                        "layoutMode": "VERTICAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "FIXED",
                                        "itemSpacing": 16,
                                        "width": 400,
                                        "children": [
                                            {
                                                "id": "img-box-2",
                                                "name": "Image Box",
                                                "type": "FRAME",
                                                "layoutMode": "VERTICAL",
                                                "primaryAxisSizingMode": "FIXED",
                                                "counterAxisSizingMode": "FIXED",
                                                "width": 400,
                                                "height": 260,
                                                "cornerRadius": 12,
                                                "strokes": [{ "type": "SOLID", "color": { "r": 0.015, "g": 0.76, "b": 0.796 } }],
                                                "strokeWeight": 1,
                                                "fills": [{ "type": "IMAGE", "scaleMode": "FILL", "imageHash": "67d1eeaa0af163b171593ec0086e9b06964feee7" }]
                                            },
                                            {
                                                "id": "text-2",
                                                "name": "Heading",
                                                "type": "TEXT",
                                                "characters": "Aumento Imediato",
                                                "fontSize": 20,
                                                "textAlignHorizontal": "CENTER",
                                                "layoutSizingHorizontal": "FILL",
                                                "fontName": { "family": "Inter", "style": "Medium" },
                                                "fills": [{ "type": "SOLID", "color": { "r": 0.2, "g": 0.2, "b": 0.2 } }]
                                            }
                                        ]
                                    },
                                    {
                                        "id": "card-3",
                                        "name": "Container - Card 3",
                                        "type": "FRAME",
                                        "layoutMode": "VERTICAL",
                                        "primaryAxisSizingMode": "AUTO",
                                        "counterAxisSizingMode": "FIXED",
                                        "itemSpacing": 16,
                                        "width": 400,
                                        "children": [
                                            {
                                                "id": "img-box-3",
                                                "name": "Image Box",
                                                "type": "FRAME",
                                                "layoutMode": "VERTICAL",
                                                "primaryAxisSizingMode": "FIXED",
                                                "counterAxisSizingMode": "FIXED",
                                                "width": 400,
                                                "height": 260,
                                                "cornerRadius": 12,
                                                "strokes": [{ "type": "SOLID", "color": { "r": 0.015, "g": 0.76, "b": 0.796 } }],
                                                "strokeWeight": 1,
                                                "fills": [{ "type": "IMAGE", "scaleMode": "FILL", "imageHash": "ea1036b71582be34af958b067e936c4599722911" }]
                                            },
                                            {
                                                "id": "text-3",
                                                "name": "Heading",
                                                "type": "TEXT",
                                                "characters": "Resultado Final",
                                                "fontSize": 20,
                                                "textAlignHorizontal": "CENTER",
                                                "layoutSizingHorizontal": "FILL",
                                                "fontName": { "family": "Inter", "style": "Medium" },
                                                "fills": [{ "type": "SOLID", "color": { "r": 0.2, "g": 0.2, "b": 0.2 } }]
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
                    if (data.primaryAxisAlignItems) frame.primaryAxisAlignItems = data.primaryAxisAlignItems;
                    if (data.counterAxisAlignItems) frame.counterAxisAlignItems = data.counterAxisAlignItems;
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
                    if (data.primaryAxisSizingMode) frame.primaryAxisSizingMode = data.primaryAxisSizingMode;
                    if (data.counterAxisSizingMode) frame.counterAxisSizingMode = data.counterAxisSizingMode;

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
                    if (data.textAlignHorizontal) text.textAlignHorizontal = data.textAlignHorizontal;
                    if (data.lineHeight) text.lineHeight = data.lineHeight;

                    // Set sizing AFTER appending
                    if (data.layoutSizingHorizontal === 'FILL') text.layoutSizingHorizontal = 'FILL';
                } else {
                    return;
                }

                return node;
            };

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
