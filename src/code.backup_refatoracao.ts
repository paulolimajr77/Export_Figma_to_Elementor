// Elementor JSON Compiler – Versão Refatorada
// Exporta frames do Figma para JSON compatível com Elementor (clipboard)
// Refatorado para melhor manutenibilidade e reaproveitamento de código

// -------------------- Imports dos Módulos Refatorados --------------------
import type { ElementorTemplate, WPConfig } from './types/elementor.types';
import { ElementorCompiler } from './compiler/elementor.compiler';

// -------------------- Type Guards (mantidos para compatibilidade) --------------------
function hasLayout(node: SceneNode): node is FrameNode | ComponentNode | InstanceNode {
    return 'layoutMode' in node;
}

// -------------------- Main Execution --------------------
figma.showUI(__html__, { width: 400, height: 600 });

let compiler: ElementorCompiler;

// Carrega configuração do WordPress salva
figma.clientStorage.getAsync('wp_config').then(config => {
    compiler = new ElementorCompiler(config || {});
    if (config) {
        figma.ui.postMessage({ type: 'load-wp-config', config });
    }
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
};