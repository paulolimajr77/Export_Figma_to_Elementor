import { ConversionPipeline } from './pipeline';
import type { WPConfig, ElementorJSON } from './types/elementor.types';
import { serializeNode } from './utils/serialization_utils';

figma.showUI(__html__, { width: 900, height: 760 });

const pipeline = new ConversionPipeline();
let lastJSON: string | null = null;

function getSelectedNode(): SceneNode {
    const selection = figma.currentPage.selection;
    if (!selection || selection.length === 0) {
        throw new Error('Selecione um frame ou node para converter.');
    }
    return selection[0];
}

async function loadWPConfig(): Promise<WPConfig> {
    try {
        const stored = await figma.clientStorage.getAsync('wp_config');
        return (stored || {}) as WPConfig;
    } catch {
        return {};
    }
}

async function generateElementorJSON(customWP?: WPConfig, debug?: boolean): Promise<{ elementorJson: ElementorJSON; debugInfo?: any }> {
    const node = getSelectedNode();
    const wpConfig = customWP || await loadWPConfig();
    log('Iniciando pipeline...', 'info');
    const result = await pipeline.run(node, wpConfig, { debug }) as any;
    log('Pipeline concluído.', 'success');
    if (debug && result.elementorJson) {
        return result;
    }
    return { elementorJson: result as ElementorJSON };
}

function log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    figma.ui.postMessage({ type: 'log', level, message });
}

async function deliverResult(json: ElementorJSON, debugInfo?: any) {
    const payload = JSON.stringify(json, null, 2);
    lastJSON = payload;
    figma.ui.postMessage({ type: 'generation-complete', payload, debug: debugInfo });
    try {
        await figma.clipboard.writeText(payload);
        figma.notify('JSON Elementor gerado e copiado para a área de transferência.');
    } catch (err) {
        figma.notify('JSON Elementor gerado. Não foi possível copiar automaticamente.', { timeout: 4000 });
        log(`Falha ao copiar: ${err}`, 'warn');
    }
}

function sendPreview(data: any) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    figma.ui.postMessage({ type: 'preview', payload });
}

figma.ui.onmessage = async (msg) => {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
        case 'inspect':
            try {
                const node = getSelectedNode();
                const serialized = serializeNode(node);
                sendPreview(serialized);
                log('Árvore inspecionada.', 'info');
            } catch (error: any) {
                log(error?.message || String(error), 'error');
            }
            break;

        case 'generate-json':
            try {
                const wpConfig = msg.wpConfig as WPConfig | undefined;
                const debug = !!msg.debug;
                const { elementorJson, debugInfo } = await generateElementorJSON(wpConfig, debug);
                await deliverResult(elementorJson, debugInfo);
                sendPreview(elementorJson);
            } catch (error: any) {
                const message = error?.message || String(error);
                log(`Erro: ${message}`, 'error');
                figma.ui.postMessage({ type: 'generation-error', message });
                figma.notify('Erro ao gerar JSON. Verifique os logs.', { timeout: 5000 });
            }
            break;

        case 'copy-json':
            if (lastJSON) {
                try {
                    await figma.clipboard.writeText(lastJSON);
                    log('JSON copiado.', 'success');
                } catch (err) {
                    log(`Falha ao copiar: ${err}`, 'warn');
                }
            } else {
                log('Nenhum JSON para copiar.', 'warn');
            }
            break;

        case 'download-json':
            if (lastJSON) {
                figma.ui.postMessage({ type: 'preview', payload: lastJSON, action: 'download' });
            } else {
                log('Nenhum JSON para baixar.', 'warn');
            }
            break;

        case 'export-wp':
            figma.ui.postMessage({ type: 'wp-status', success: false, message: 'Exportação WP não implementada neste build.' });
            break;

        case 'test-gemini':
            figma.ui.postMessage({ type: 'gemini-status', success: true, message: 'Conexão simulada com Gemini ok.' });
            break;

        case 'test-wp':
            figma.ui.postMessage({ type: 'wp-status', success: true, message: 'Configuração WP recebida.' });
            break;

        case 'close':
            figma.closePlugin();
            break;
    }
};
