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

    else if (msg.type === 'resize-ui') {
        figma.ui.resize(msg.width, msg.height);
    }
};
