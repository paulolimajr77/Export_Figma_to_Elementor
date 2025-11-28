import { ConversionPipeline } from './pipeline';
import type { WPConfig, ElementorJSON } from './types/elementor.types';
import { serializeNode } from './utils/serialization_utils';
import { API_BASE_URL } from './api_gemini';

figma.showUI(__html__, { width: 600, height: 820, themeColors: true });

const pipeline = new ConversionPipeline();
let lastJSON: string | null = null;

const DEFAULT_TIMEOUT_MS = 12000;

function toBase64(str: string): string {
    // Implementação robusta de Base64 (RFC 4648) independente de btoa/unescape
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let output = '';
    let i = 0;
    while (i < str.length) {
        const c1 = str.charCodeAt(i++);
        const c2 = i < str.length ? str.charCodeAt(i++) : NaN;
        const c3 = i < str.length ? str.charCodeAt(i++) : NaN;

        const e1 = c1 >> 2;
        const e2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
        const e3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6);
        const e4 = isNaN(c3) ? 64 : c3 & 63;

        output += chars.charAt(e1) + chars.charAt(e2) +
            (e3 === 64 ? '=' : chars.charAt(e3)) +
            (e4 === 64 ? '=' : chars.charAt(e4));
    }
    return output;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
    const AC: any = (typeof AbortController !== 'undefined') ? AbortController : null;
    if (!AC) {
        // Ambiente sem AbortController: apenas faz o fetch sem timeout real
        return await fetch(url, options);
    }
    const controller = new AC();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                ...options.headers,
                'User-Agent': 'Figma-To-Elementor/1.0'
            }
        });
    } finally {
        clearTimeout(id);
    }
}

function normalizeWpUrl(raw: string): string {
    if (!raw) return '';
    let url = raw.trim();
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    url = url.replace(/\/+$/, '');
    return url;
}

async function loadSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
        const value = await figma.clientStorage.getAsync(key);
        if (value === undefined || value === null) return defaultValue;
        return value as T;
    } catch {
        return defaultValue;
    }
}

async function saveSetting(key: string, value: any) {
    try {
        await figma.clientStorage.setAsync(key, value);
    } catch (e) {
        console.warn('Failed to save setting', key, e);
    }
}

async function loadWPConfig(): Promise<WPConfig> {
    const url = await loadSetting<string>('gptel_wp_url', '');
    const user = await loadSetting<string>('gptel_wp_user', '');
    const token = await loadSetting<string>('gptel_wp_token', '');
    const exportImages = await loadSetting<boolean>('gptel_export_images', false);
    const autoPage = await loadSetting<boolean>('gptel_auto_page', false);
    // legacy fallback
    if (!url || !token || !user) {
        const legacy = await loadSetting<any>('wp_config', null);
        if (legacy) {
            return {
                url: legacy.url || url,
                user: legacy.user || user,
                token: legacy.auth || token,
                exportImages,
                autoPage
            } as any;
        }
    }
    return { url, user, token, exportImages, autoPage } as any;
}

function getSelectedNode(): SceneNode {
    const selection = figma.currentPage.selection;
    if (!selection || selection.length === 0) {
        throw new Error('Selecione um frame ou node para converter.');
    }
    return selection[0];
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
        await (figma as any).clipboard.writeText(payload);
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

async function sendStoredSettings() {
    let geminiKey = await loadSetting<string>('gptel_gemini_key', '');
    if (!geminiKey) {
        geminiKey = await loadSetting<string>('gemini_api_key', '');
    }
    const geminiModel = await loadSetting<string>('gemini_model', 'gemini-2.5-flash');
    const wpUrl = await loadSetting<string>('gptel_wp_url', '');
    const wpUser = await loadSetting<string>('gptel_wp_user', '');
    const wpToken = await loadSetting<string>('gptel_wp_token', '');
    const exportImages = await loadSetting<boolean>('gptel_export_images', false);
    const autoPage = await loadSetting<boolean>('gptel_auto_page', false);
    const darkMode = await loadSetting<boolean>('gptel_dark_mode', false);

    figma.ui.postMessage({
        type: 'load-settings',
        payload: {
            geminiKey,
            geminiModel,
            wpUrl,
            wpUser,
            wpToken,
            exportImages,
            autoPage,
            darkMode
        }
    });
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
                if (msg.geminiModel) {
                    await saveSetting('gemini_model', msg.geminiModel);
                }
                figma.ui.postMessage({ type: 'generation-start' });
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
                    await (figma as any).clipboard.writeText(lastJSON);
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
            try {
                const incoming = msg.wpConfig as WPConfig | undefined;
                const cfg = incoming && incoming.url ? incoming : await loadWPConfig();
                const url = normalizeWpUrl(cfg?.url || '');
                const userRaw = (cfg as any)?.user || '';
                const tokenRaw = (cfg as any)?.token || (cfg as any)?.password || '';
                const user = (userRaw || '').trim();
                const token = (tokenRaw || '').replace(/\s+/g, '');
                figma.ui.postMessage({
                    type: 'log',
                    level: 'info',
                    message: `[WP] Export -> endpoint: ${url || '(vazio)'} / user: ${user || '(vazio)'} / tokenLen: ${token.length}`
                });
                if (!lastJSON) {
                    figma.ui.postMessage({ type: 'wp-status', success: false, message: 'Nenhum JSON gerado para exportar.' });
                    break;
                }
                if (!url || !user || !token) {
                    figma.ui.postMessage({ type: 'wp-status', success: false, message: 'URL, usuário ou senha do app ausentes.' });
                    break;
                }

                const auth = `Basic ${toBase64(`${user}:${token}`)}`;
                const base = url.replace(/\/$/, '');
                const meEndpoint = `${base}/wp-json/wp/v2/users/me`;
                const meResp = await fetchWithTimeout(meEndpoint, { headers: { Authorization: auth, Accept: 'application/json' } });
                if (!meResp.ok) {
                    const text = await meResp.text();
                    figma.ui.postMessage({ type: 'log', level: 'error', message: `[WP] Auth FAIL (${meResp.status}) -> ${text}` });
                    figma.ui.postMessage({ type: 'wp-status', success: false, message: `Falha de autenticação (${meResp.status}): ${text}` });
                    break;
                }

                const pageEndpoint = `${base}/wp-json/wp/v2/pages`;
                const pageBody = {
                    title: `FigToEL ${new Date().toISOString()}`,
                    status: 'draft',
                    meta: { _elementor_data: lastJSON },
                    content: 'Gerado via FigToEL (Elementor JSON em _elementor_data).'
                };

                const pageResp = await fetchWithTimeout(pageEndpoint, {
                    method: 'POST',
                    headers: {
                        Authorization: auth,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pageBody)
                });

                if (!pageResp.ok) {
                    const text = await pageResp.text();
                    figma.ui.postMessage({ type: 'wp-status', success: false, message: `Falha ao criar página (${pageResp.status}): ${text}` });
                    break;
                }

                const pageJson = await pageResp.json().catch(() => ({}));
                await saveSetting('gptel_wp_url', url);
                await saveSetting('gptel_wp_user', user);
                await saveSetting('gptel_wp_token', token);
                await saveSetting('gptel_export_images', !!(cfg as any).exportImages);
                await saveSetting('gptel_auto_page', !!(cfg as any).autoPage);

                const link = pageJson?.link || url;
                figma.ui.postMessage({ type: 'wp-status', success: true, message: `Página enviada como rascunho. Link: ${link}` });
            } catch (e: any) {
                const aborted = e?.name === 'AbortError';
                const msgErr = aborted ? 'Tempo limite ao exportar para WP.' : (e?.message || 'Erro desconhecido');
                figma.ui.postMessage({ type: 'wp-status', success: false, message: msgErr });
            }
            break;

        case 'test-gemini':
            try {
                if (msg.model) {
                    await saveSetting('gemini_model', msg.model);
                }
                const inlineKey = msg.apiKey as string | undefined;
                let keyToTest = inlineKey || await loadSetting<string>('gptel_gemini_key', '');
                if (!keyToTest) {
                    keyToTest = await loadSetting<string>('gemini_api_key', '');
                }

                if (!keyToTest) {
                    figma.ui.postMessage({ type: 'gemini-status', success: false, message: 'API Key não informada.' });
                    break;
                }

                const resp = await fetch(`${API_BASE_URL}?key=${keyToTest}`);
                if (!resp.ok) {
                    const text = await resp.text();
                    figma.ui.postMessage({ type: 'gemini-status', success: false, message: `Falha na conexão (${resp.status}): ${text}` });
                    break;
                }

                await saveSetting('gptel_gemini_key', keyToTest);
                figma.ui.postMessage({ type: 'gemini-status', success: true, message: 'Conexão com Gemini verificada.' });
            } catch (e: any) {
                figma.ui.postMessage({ type: 'gemini-status', success: false, message: `Erro: ${e?.message || e}` });
            }
            break;

        case 'test-wp':
            try {
                const incoming = msg.wpConfig as WPConfig | undefined;
                const cfg = incoming && incoming.url ? incoming : await loadWPConfig();
                const url = normalizeWpUrl(cfg?.url || '');
                const user = ((cfg as any)?.user || '').trim();
                const token = ((cfg as any)?.token || (cfg as any)?.password || '').replace(/\s+/g, '');
                if (!url || !user || !token) {
                    figma.ui.postMessage({ type: 'wp-status', success: false, message: 'URL, usuário ou senha do app ausentes.' });
                    break;
                }
                figma.ui.postMessage({
                    type: 'log',
                    level: 'info',
                    message: `[WP] Test -> endpoint: ${url} / user: ${user} / tokenLen: ${token.length}`
                });
                const endpoint = url + '/wp-json/wp/v2/users/me';
                const auth = toBase64(`${user}:${token}`);
                const resp = await fetchWithTimeout(endpoint, {
                    method: 'GET',
                    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' }
                });
                if (!resp.ok) {
                    const text = await resp.text();
                    figma.ui.postMessage({ type: 'log', level: 'error', message: `[WP] Test FAIL (${resp.status}) -> ${text}` });
                    figma.ui.postMessage({ type: 'wp-status', success: false, message: `Falha (${resp.status}): ${text || 'sem detalhe'}` });
                    break;
                }
                const autoPage = (cfg as any).autoPage ?? (cfg as any).createPage;
                await saveSetting('gptel_wp_url', url);
                await saveSetting('gptel_wp_user', user);
                await saveSetting('gptel_wp_token', token);
                await saveSetting('gptel_export_images', !!(cfg as any).exportImages);
                await saveSetting('gptel_auto_page', !!autoPage);
                figma.ui.postMessage({ type: 'wp-status', success: true, message: 'Conexão com WordPress verificada.' });
            } catch (e: any) {
                figma.ui.postMessage({ type: 'wp-status', success: false, message: `Erro: ${e?.message || e}` });
            }
            break;

        case 'save-setting':
            if (msg.key) {
                await saveSetting(msg.key, msg.value);
            }
            break;

        case 'load-settings':
            await sendStoredSettings();
            break;

        case 'reset':
            lastJSON = null;
            break;

        case 'resize-ui':
            if (msg.width && msg.height) {
                figma.ui.resize(Math.min(1500, msg.width), Math.min(1000, msg.height));
            }
            break;

        case 'rename-layer':
            try {
                const selection = figma.currentPage.selection;
                if (!selection || selection.length === 0) throw new Error('Nenhum layer selecionado.');
                const node = selection[0];
                const name = msg.name as string;
                if (name) node.name = name;
                figma.notify(`Layer renomeada para ${name}`);
            } catch (e: any) {
                figma.notify(e?.message || 'Falha ao renomear layer');
            }
            break;

        case 'close':
            figma.closePlugin();
            break;
    }
};

sendStoredSettings();
