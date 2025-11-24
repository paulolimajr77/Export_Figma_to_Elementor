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

    // Analisa o layout com a IA Gemini
    else if (msg.type === 'analyze-with-gemini') {
        const selection = figma.currentPage.selection;
        if (selection.length !== 1) {
            figma.notify('⚠️ Selecione apenas 1 frame para análise');
            return;
        }

        const node = selection[0];
        figma.notify('🤖 Analisando layout com a IA...');

        try {
            const imageData = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 1.5 } });
            
            const analysis = await Gemini.analyzeAndRecreate(imageData);

            figma.notify('🎨 Criando novo frame otimizado...');

            const newFrame = await createOptimizedFrame(analysis, node);

            figma.currentPage.selection = [newFrame];
            figma.viewport.scrollAndZoomIntoView([newFrame]);

            figma.ui.postMessage({
                type: 'gemini-creation-complete',
                data: {
                    originalName: node.name,
                    newName: newFrame.name,
                    improvements: analysis.improvements || ['Estrutura otimizada com Auto-Layout']
                }
            });

            figma.notify('✅ Novo frame criado com sucesso!');
        } catch (e: any) {
            console.error("Erro detalhado na análise Gemini:", e);
            figma.notify('❌ Erro na análise: ' + e.message);
            figma.ui.postMessage({
                type: 'gemini-error',
                error: e.message
            });
        }
    }
};
