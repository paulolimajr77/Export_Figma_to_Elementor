import { ConversionPipeline } from './pipeline';
import type { WPConfig, ElementorJSON } from './types/elementor.types';
import { serializeNode, SerializedNode } from './utils/serialization_utils';
import { GEMINI_MODEL, geminiProvider } from './api_gemini';
import { openaiProvider, testOpenAIConnection } from './api_openai';
import { SchemaProvider, DeterministicDiffMode, PipelineRunOptions } from './types/providers';
import { analyzeTreeWithHeuristics, convertToFlexSchema } from './pipeline/noai.parser';
import { ElementorCompiler } from './compiler/elementor.compiler';
import { ImageUploader } from './media/uploader';
import { createNodeSnapshot } from './heuristics/adapter';
import { evaluateNode, DEFAULT_HEURISTICS } from './heuristics/index';
import { FileLogger } from './utils/logger';
import { analyzeFigmaLayout, validateSingleNode, RuleRegistry, AutoLayoutRule } from './linter';
import { enforceWidgetTypes } from './services/heuristics';
import { initializeCompatLayer, safeGet, safeGetArray, safeGetNumber, safeGetString, safeGetBoolean, safeInvoke } from './compat';

figma.notify('Plugin carregou! (diagnóstico)');
console.log('[diagnostic] plugin loaded');

const runtimeHealth = initializeCompatLayer({
    logger: (event, payload) => {
        try {
            console.log(`[compat:${event}]`, payload || '');
        } catch {
            // evitar falha em ambientes restritos
        }
    }
});

// Logger dedicado para capturar eventos sem alterar console global
export const logger = new FileLogger(console.log.bind(console));

figma.showUI(__html__, { width: 600, height: 820, themeColors: true });
safeInvoke(() => figma.ui.postMessage({
    type: 'runtime-health',
    status: runtimeHealth.runtime,
    warnings: runtimeHealth.warnings || []
}));

const pipeline = new ConversionPipeline();
let lastJSON: string | null = null;
let noaiUploader: ImageUploader | null = null;

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_PROVIDER = 'gemini';
const DEFAULT_GPT_MODEL = 'gpt-4.1-mini';

function getActiveProvider(providerId?: string): SchemaProvider {
    return providerId === 'gpt' ? openaiProvider : geminiProvider;
}

function collectLayoutWarnings(node: any): string[] {
    const warnings: string[] = [];
    // Auto Layout validation removed as per user request.

    const children = safeGetArray<any>(node, 'children', []);
    children.forEach((child: any) => warnings.push(...collectLayoutWarnings(child)));

    return warnings;
}

function focusNode(nodeId: string) {
    if (!nodeId) {
        return;
    }
    safeInvoke(() => {
        const n = figma.getNodeById(nodeId);
        if (n) {
            figma.currentPage.selection = [n as SceneNode];
            figma.viewport.scrollAndZoomIntoView([n as SceneNode]);
        }
    });
}

function sendLayoutWarning(node: any, message: string) {
    const nodeId = safeGetString(node, 'id');
    const nodeName = safeGetString(node, 'name');
    const characters = safeGetString(node, 'characters', '');
    const snippet = characters ? characters.slice(0, 200) : '';
    safeInvoke(() => {
        figma.ui.postMessage({
            type: 'layout-warning',
            nodeId,
            name: nodeName,
            text: snippet,
            message
        });
    });
}

function toBase64(str: string): string {
    // Implementacao robusta de Base64 (RFC 4648) independente de btoa/unescape
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
    const webpQuality = await loadSetting<number>('gptel_webp_quality', 85);
    // legacy fallback
    if (!url || !token || !user) {
        const legacy = await loadSetting<any>('wp_config', null);
        if (legacy) {
            return {
                url: legacy.url || url,
                user: legacy.user || user,
                token: legacy.auth || token,
                exportImages,
                webpQuality
            } as any;
        }
    }
    return { url, user, token, exportImages, webpQuality } as any;
}

async function resolveProviderConfig(msg?: any): Promise<{ provider: SchemaProvider; apiKey: string; providerId: string }> {
    const providerFromMsg = safeGet(msg, 'providerAi') as string | undefined;
    const incomingProvider = providerFromMsg || await loadSetting<string>('aiProvider', DEFAULT_PROVIDER) || await loadSetting<string>('provider_ai', DEFAULT_PROVIDER);
    const providerId = incomingProvider === 'gpt' ? 'gpt' : DEFAULT_PROVIDER;
    await saveSetting('aiProvider', providerId);
    await saveSetting('provider_ai', providerId);
    const provider = getActiveProvider(providerId);

    if (providerId === 'gpt') {
        const inlineKey = safeGet(msg, 'gptApiKey') as string | undefined;
        let key = inlineKey || await loadSetting<string>('gptApiKey', '') || await loadSetting<string>('gpt_api_key', '');
        if (inlineKey) {
            await saveSetting('gptApiKey', inlineKey);
            await saveSetting('gpt_api_key', inlineKey);
        }
        const storedModel = (safeGet(msg, 'gptModel') as string | undefined) || await loadSetting<string>('gptModel', DEFAULT_GPT_MODEL) || await loadSetting<string>('gpt_model', openaiProvider.model);
        if (storedModel) {
            await saveSetting('gptModel', storedModel);
            await saveSetting('gpt_model', storedModel);
            openaiProvider.setModel(storedModel);
        }
        if (!key) throw new Error('OpenAI API Key nao configurada.');
        return { provider, apiKey: key, providerId };
    }

    const inlineKey = safeGet(msg, 'apiKey') as string | undefined;
    let key = inlineKey || await loadSetting<string>('gptel_gemini_key', '');
    if (!key) {
        key = await loadSetting<string>('gemini_api_key', '');
    }
    if (inlineKey) {
        await saveSetting('gptel_gemini_key', inlineKey);
        await saveSetting('gemini_api_key', inlineKey);
    }

    const model = (safeGet(msg, 'geminiModel') as string | undefined) || await loadSetting<string>('gemini_model', GEMINI_MODEL);
    if (model) {
        await saveSetting('gemini_model', model);
        geminiProvider.setModel(model);
    }

    if (!key) throw new Error('Gemini API Key nao configurada.');
    return { provider, apiKey: key, providerId };
}

function getSelectedNode(): SceneNode {
    const selection = safeGetArray<SceneNode>(figma, 'currentPage.selection');
    if (!selection || selection.length === 0) {
        throw new Error('Selecione um frame ou node para converter.');
    }
    return selection[0];
}

async function generateElementorJSON(aiPayload?: any, customWP?: WPConfig, debug?: boolean): Promise<{ elementorJson: ElementorJSON; debugInfo?: any }> {
    const node = getSelectedNode();
    log(
        `[DEBUG] Selected Node: ${safeGetString(node, 'name', 'unknown')} (ID: ${safeGetString(node, 'id', 'n/a')}, Type: ${safeGetString(node, 'type', 'unknown')}, Locked: ${safeGetBoolean(node, 'locked', false)})`,
        'info'
    );
    const wpConfig = customWP || await loadWPConfig();
    const useAIPayload = safeGet(aiPayload, 'useAI');
    const useAI = typeof useAIPayload === 'boolean' ? useAIPayload : await loadSetting<boolean>('gptel_use_ai', true);
    const serialized = serializeNode(node);
    const includeScreenshotPayload = safeGet(aiPayload, 'includeScreenshot');
    const includeScreenshot = typeof includeScreenshotPayload === 'boolean' ? includeScreenshotPayload : await loadSetting<boolean>('gptel_include_screenshot', true);
    const includeReferencesPayload = safeGet(aiPayload, 'includeReferences');
    const includeReferences = typeof includeReferencesPayload === 'boolean' ? includeReferencesPayload : await loadSetting<boolean>('gptel_include_references', true);
    const useDeterministic = safeGet(aiPayload, 'useDeterministic') === true;
    const diffModeValue = safeGet(aiPayload, 'deterministicDiffMode');
    const deterministicDiffMode: DeterministicDiffMode | undefined =
        diffModeValue === 'log' || diffModeValue === 'store' ? diffModeValue : undefined;
    const telemetryConfig = safeGet(aiPayload, 'telemetryEnabled') === true
        ? {
            enabled: true,
            storeDiffs: safeGet(aiPayload, 'telemetryStoreDiffs') === true,
            storeSnapshots: safeGet(aiPayload, 'telemetryStoreSnapshots') === true
        }
        : undefined;

    if (!useAI) {
        log('Iniciando pipeline (NO-AI)...', 'info');
        const elementorJson = await runPipelineWithoutAI(serialized, wpConfig);
        log('Pipeline NO-AI concluido.', 'success');
        return { elementorJson };
    }

    const autoRenameFlag = safeGet(aiPayload, 'autoRename');
    const autoRenameValue = typeof autoRenameFlag === 'boolean' ? autoRenameFlag : await loadSetting<boolean>('gptel_auto_rename', false);
    const { provider, apiKey, providerId } = await resolveProviderConfig(aiPayload);
    const autoFixLayout = await loadSetting<boolean>('auto_fix_layout', false);
    log(`Iniciando pipeline (${providerId.toUpperCase()})...`, 'info');
    const runOptions: PipelineRunOptions = {
        debug: !!debug,
        provider,
        apiKey,
        autoFixLayout,
        includeScreenshot,
        includeReferences,
        autoRename: autoRenameValue,
        useDeterministic
    };
    if (deterministicDiffMode) {
        runOptions.deterministicDiffMode = deterministicDiffMode;
    }
    if (telemetryConfig) {
        runOptions.telemetry = telemetryConfig;
    }

    const result = await pipeline.run(node, wpConfig, runOptions) as any;
    log('Pipeline concluido.', 'success');
    if (debug && result.elementorJson) {
        return result;
    }
    return { elementorJson: result as ElementorJSON };
}

function log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    try {
        logger.log(`[${level}] ${message}`);
    } catch {
        // logger best-effort; avoid breaking UX
    }
    figma.ui.postMessage({ type: 'log', level, message });
}

async function deliverResult(json: ElementorJSON, debugInfo?: any) {
    const normalizedElements = (json as any).elements || (json as any).content || [];

    // Normalize siteurl to always end with /wp-json/
    let siteurl = (json as any).siteurl || '';
    if (siteurl && !siteurl.endsWith('/')) siteurl += '/';
    if (siteurl && !siteurl.endsWith('wp-json/')) siteurl += 'wp-json/';

    const normalizedJson: ElementorJSON = {
        type: (json as any).type || 'elementor',
        siteurl: siteurl,
        version: (json as any).version || '0.4',
        elements: normalizedElements
    } as any;

    // Human-readable for display and paste
    const payload = JSON.stringify(normalizedJson, null, 2);
    const pastePayload = payload;
    lastJSON = payload;
    figma.ui.postMessage({ type: 'generation-complete', payload, pastePayload, debug: debugInfo });
    // Bridge de copia: UI via navigator.clipboard ou fallback manual
    figma.ui.postMessage({ type: 'copy-json', payload: pastePayload });
    figma.ui.postMessage({ type: 'clipboard:copy', payload: pastePayload });
}

function sendPreview(data: any) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    figma.ui.postMessage({ type: 'preview', payload });
}

async function runPipelineWithoutAI(serializedTree: SerializedNode, wpConfig: WPConfig = {}): Promise<ElementorJSON> {
    const analyzed = analyzeTreeWithHeuristics(serializedTree as any);
    const schema = convertToFlexSchema(analyzed as any);

    // Resolver imagens (upload para WP quando configurado)
    const normalizedWP = { ...wpConfig, password: safeGet(wpConfig as any, 'password') || safeGet(wpConfig as any, 'token') };
    noaiUploader = new ImageUploader({});
    noaiUploader.setWPConfig(normalizedWP);
    const uploadEnabled = !!(normalizedWP && normalizedWP.url && (normalizedWP as any).user && (normalizedWP as any).password && (normalizedWP as any).exportImages);

    const uploadPromises: Promise<void>[] = [];

    await enforceWidgetTypes(schema);

    const processWidget = async (widget: any) => {
        const uploader = noaiUploader;
        if (!uploader) return;

        // Ensure we use the ID from the widget if imageId is missing
        const nodeId = widget.imageId || widget.id;

        console.log(`[NO-AI UPLOAD] Processing widget: type=${widget.type}, nodeId=${nodeId}, uploadEnabled=${uploadEnabled}`);

        if (uploadEnabled && nodeId && (widget.type === 'image' || widget.type === 'custom' || widget.type === 'icon' || widget.type === 'image-box' || widget.type === 'icon-box' || widget.type === 'button' || widget.type === 'list-item' || widget.type === 'icon-list' || widget.type === 'accordion' || widget.type === 'toggle')) {
            console.log(`[NO-AI UPLOAD] ✅ Widget ${widget.type} (${nodeId}) will be uploaded`);
            try {
                const node = await figma.getNodeById(nodeId);
                if (node) {
                    let format = (widget.type === 'icon' || widget.type === 'icon-box' || widget.type === 'list-item' || widget.type === 'icon-list') ? 'SVG' : 'WEBP';

                    // Smart Format Detection (Mirroring Pipeline logic)
                    const isVectorNode = (n: SceneNode) =>
                        n.type === 'VECTOR' || n.type === 'STAR' || n.type === 'ELLIPSE' ||
                        n.type === 'POLYGON' || n.type === 'BOOLEAN_OPERATION' || n.type === 'LINE';

                    const hasVectorChildren = (n: SceneNode): boolean => {
                        if (isVectorNode(n)) return true;
                        if ('children' in n) {
                            return n.children.some(c => hasVectorChildren(c));
                        }
                        return false;
                    };

                    const hasImageChildren = (n: SceneNode): boolean => {
                        if ('fills' in n && Array.isArray((n as any).fills)) {
                            if ((n as any).fills.some((f: any) => f.type === 'IMAGE')) return true;
                        }
                        if ('children' in n) {
                            return n.children.some(c => hasImageChildren(c));
                        }
                        return false;
                    };

                    if (('locked' in node && node.locked)) {
                        if (hasImageChildren(node as SceneNode)) {
                            format = 'WEBP';
                        } else if (hasVectorChildren(node as SceneNode)) {
                            format = 'SVG';
                        } else {
                            format = 'WEBP';
                        }
                    } else if (hasVectorChildren(node as SceneNode)) {
                        format = 'SVG';
                    }

                    // Force SVG for Icon nodes inside buttons or explicit icon widgets
                    if (node.name === 'Icon' || widget.type === 'icon' || widget.type === 'list-item' || widget.type === 'accordion' || widget.type === 'toggle') {
                        format = 'SVG';
                    }

                    const result = await uploader.uploadToWordPress(node as SceneNode, format as any);
                    if (result) {
                        if (widget.type === 'image-box') {
                            if (!widget.styles) widget.styles = {};
                            widget.styles.image_url = result.url;
                        } else if (widget.type === 'icon-box') {
                            if (!widget.styles) widget.styles = {};
                            widget.styles.selected_icon = { value: { url: result.url, id: result.id }, library: 'svg' };
                            widget.imageId = result.id.toString();
                        } else if (widget.type === 'button') {
                            if (!widget.styles) widget.styles = {};
                            widget.styles.selected_icon = { value: { url: result.url, id: result.id }, library: 'svg' };
                            widget.imageId = result.id.toString();
                            console.log('[BUTTON UPLOAD] Icon uploaded:', result.url, 'ID:', result.id);
                        } else if (widget.type === 'list-item') {
                            if (!widget.styles) widget.styles = {};
                            widget.styles.icon_url = result.url;
                            widget.imageId = result.id.toString();
                            console.log('[LIST-ITEM UPLOAD] Icon uploaded:', result.url, 'ID:', result.id);
                        } else if (widget.type === 'icon-list') {
                            if (!widget.styles) widget.styles = {};
                            widget.styles.icon = { value: { id: result.id, url: result.url }, library: 'svg' };
                            widget.imageId = result.id.toString();
                        } else if (widget.type === 'accordion' || widget.type === 'toggle') {
                            if (!widget.styles) widget.styles = {};
                            widget.styles.selected_icon = { value: { url: result.url, id: result.id }, library: 'svg' };
                            widget.imageId = result.id.toString();
                            console.log('[ACCORDION UPLOAD] Icon uploaded:', result.url, 'ID:', result.id);
                        } else {
                            widget.content = result.url;
                            widget.imageId = result.id.toString();
                        }
                    }
                }
            } catch (e) {
                console.error(`[NO-AI] Erro ao processar imagem ${nodeId}:`, e);
            }
        }

        // Handle image-carousel: upload each slide
        const carouselSlides = safeGet(widget, 'styles.slides') as any[] | undefined;
        if (uploadEnabled && widget.type === 'image-carousel' && Array.isArray(carouselSlides)) {
            console.log(`[NO-AI UPLOAD] ?? Processing image-carousel with ${carouselSlides.length} slides`);
            const updatedSlides = [];
            for (const slide of carouselSlides) {
                const slideNodeId = slide.id;
                if (slideNodeId) {
                    try {
                        const node = await figma.getNodeById(slideNodeId);
                        if (node) {
                            const result = await uploader.uploadToWordPress(node as SceneNode, 'WEBP');
                            if (result) {
                                console.log(`[NO-AI UPLOAD] 🎠 Slide uploaded: ${result.url}, ID: ${result.id}`);
                                updatedSlides.push({
                                    _id: slide._id,
                                    id: result.id,
                                    url: result.url,
                                    image: { url: result.url, id: result.id }
                                });
                            } else {
                                updatedSlides.push(slide); // Keep original if upload fails
                            }
                        } else {
                            updatedSlides.push(slide);
                        }
                    } catch (e) {
                        console.error(`[NO-AI] Erro ao processar slide ${slideNodeId}:`, e);
                        updatedSlides.push(slide);
                    }
                } else {
                    updatedSlides.push(slide);
                }
            }
            widget.styles.slides = updatedSlides;
        }
    };

    const collectUploads = (container: any) => {
        for (const widget of container.widgets || []) {
            uploadPromises.push(processWidget(widget));
            // Process child widgets recursively (e.g., button with icon + text children)
            if (widget.children && Array.isArray(widget.children)) {
                for (const childWidget of widget.children) {
                    uploadPromises.push(processWidget(childWidget));
                }
            }
        }
        for (const child of container.children || []) {
            collectUploads(child);
        }
    };

    for (const container of schema.containers) {
        collectUploads(container);
    }

    if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
    }

    const compiler = new ElementorCompiler();
    compiler.setWPConfig(normalizedWP);
    const json = compiler.compile(schema);
    // Ensure siteurl ends with /wp-json/ as Elementor expects
    if (normalizedWP.url) {
        let siteurl = normalizedWP.url;
        if (!siteurl.endsWith('/')) siteurl += '/';
        if (!siteurl.endsWith('wp-json/')) siteurl += 'wp-json/';
        json.siteurl = siteurl;
    }
    return json;
}

async function sendStoredSettings() {
    console.log('🔧 [sendStoredSettings] Carregando configurações salvas...');

    let geminiKey = await loadSetting<string>('gptel_gemini_key', '');
    if (!geminiKey) {
        geminiKey = await loadSetting<string>('gemini_api_key', '');
    }
    const geminiModel = await loadSetting<string>('gemini_model', GEMINI_MODEL);
    const providerAi = await loadSetting<string>('aiProvider', DEFAULT_PROVIDER) || await loadSetting<string>('provider_ai', DEFAULT_PROVIDER);
    const gptKey = await loadSetting<string>('gptApiKey', '') || await loadSetting<string>('gpt_api_key', '');
    const gptModel = await loadSetting<string>('gptModel', DEFAULT_GPT_MODEL) || await loadSetting<string>('gpt_model', openaiProvider.model);
    const wpUrl = await loadSetting<string>('gptel_wp_url', '');
    const wpUser = await loadSetting<string>('gptel_wp_user', '');
    const wpToken = await loadSetting<string>('gptel_wp_token', '');
    const exportImages = await loadSetting<boolean>('gptel_export_images', false);
    const webpQuality = await loadSetting<number>('gptel_webp_quality', 85);
    const darkMode = await loadSetting<boolean>('gptel_dark_mode', false);
    const useAI = await loadSetting<boolean>('gptel_use_ai', true);
    const includeScreenshot = await loadSetting<boolean>('gptel_include_screenshot', true);
    const includeReferences = await loadSetting<boolean>('gptel_include_references', true);
    const autoRename = await loadSetting<boolean>('gptel_auto_rename', false);

    console.log('🔧 [sendStoredSettings] Configurações carregadas:', {
        geminiKey: geminiKey ? '***' + geminiKey.slice(-4) : 'vazio',
        gptKey: gptKey ? '***' + gptKey.slice(-4) : 'vazio',
        wpUrl,
        providerAi
    });

    figma.ui.postMessage({
        type: 'load-settings',
        payload: {
            geminiKey,
            geminiModel,
            providerAi,
            gptKey,
            gptModel,
            wpUrl,
            wpUser,
            wpToken,
            exportImages,
            webpQuality,
            darkMode,
            useAI,
            includeScreenshot,
            includeReferences,
            autoRename
        }
    });

    console.log('🔧 [sendStoredSettings] Mensagem enviada para UI');
}

figma.ui.onmessage = async (msg) => {
    figma.notify('Mensagem recebida: ' + JSON.stringify(msg));
    console.log('[diagnostic] received message', msg);
    if (!msg || typeof msg !== 'object') return;
    if (typeof msg.type !== 'string') return;

    switch (msg.type) {


        case 'inspect':
            try {
                const node = getSelectedNode();
                const serialized = serializeNode(node);
                sendPreview(serialized);
                const warns = collectLayoutWarnings(serialized);
                if (warns.length > 0) {
                    warns.forEach(w => log(w, 'warn'));
                } else {
                    log('Inspecao: nenhum problema de auto layout detectado.', 'info');
                }
                log('Arvore inspecionada.', 'info');
            } catch (error: any) {
                log((safeGet(error, 'message') as string) || String(error), 'error');
            }
            break;

        case 'generate-json':
            try {
                figma.ui.postMessage({ type: 'generation-start' });
                const wpConfig = msg.wpConfig as WPConfig | undefined;
                const debug = !!msg.debug;
                const { elementorJson, debugInfo } = await generateElementorJSON(msg, wpConfig, debug);
                await deliverResult(elementorJson, debugInfo);
            } catch (error: any) {
                const message = (safeGet(error, 'message') as string) || String(error);
                log(`Erro: ${message}`, 'error');
                figma.ui.postMessage({ type: 'generation-error', message });
                figma.notify('Erro ao gerar JSON. Verifique os logs.', { timeout: 5000 });
            }
            break;

        case 'copy-json':
            if (lastJSON) {
                figma.ui.postMessage({ type: 'copy-json', payload: lastJSON });
                figma.ui.postMessage({ type: 'clipboard:copy', payload: lastJSON });
            } else {
                log('Nenhum JSON para copiar.', 'warn');
            }
            break;
        case 'upload-image-response':
            pipeline.handleUploadResponse(msg.id, msg);
            if (noaiUploader) {
                noaiUploader.handleUploadResponse(msg.id, msg);
            }
            break;

        case 'download-json':
            if (lastJSON) {
                figma.ui.postMessage({ type: 'preview', payload: lastJSON, action: 'download' });
            } else {
                log('Nenhum JSON para baixar.', 'warn');
            }
            break;



        case 'test-gemini':
            try {
                if (msg.model) {
                    await saveSetting('gemini_model', msg.model);
                    geminiProvider.setModel(msg.model);
                }
                const inlineKey = msg.apiKey as string | undefined;
                if (inlineKey) {
                    await saveSetting('gptel_gemini_key', inlineKey);
                    await saveSetting('gemini_api_key', inlineKey);
                }
                const res = await geminiProvider.testConnection(inlineKey);
                figma.ui.postMessage({ type: 'gemini-status', success: res.ok, message: res.message });
            } catch (e: any) {
                const geminiError = (safeGet(e, 'message') as string) || e;
                figma.ui.postMessage({ type: 'gemini-status', success: false, message: `Erro: ${geminiError}` });
            }
            break;

        case 'test-gpt':
            try {
                const inlineKey = (msg.apiKey as string) || (msg.gptApiKey as string) || '';
                if (inlineKey) {
                    await saveSetting('gptApiKey', inlineKey);
                    await saveSetting('gpt_api_key', inlineKey);
                }
                const model = (msg.model as string) || await loadSetting<string>('gptModel', DEFAULT_GPT_MODEL) || await loadSetting<string>('gpt_model', DEFAULT_GPT_MODEL);
                if (model) {
                    await saveSetting('gptModel', model);
                    await saveSetting('gpt_model', model);
                    openaiProvider.setModel(model);
                }
                const keyToUse = inlineKey || await loadSetting<string>('gptApiKey', '') || await loadSetting<string>('gpt_api_key', '');
                const res = await testOpenAIConnection(keyToUse, model || openaiProvider.model as any);
                figma.ui.postMessage({ type: 'gpt-status', success: res.ok, message: res.error || 'Conexao com GPT verificada.' });
            } catch (e: any) {
                const gptError = (safeGet(e, 'message') as string) || e;
                figma.ui.postMessage({ type: 'gpt-status', success: false, message: `Erro: ${gptError}` });
            }
            break;

        case 'test-wp':
            try {
                const incoming = msg.wpConfig as WPConfig | undefined;
                const cfg = incoming && incoming.url ? incoming : await loadWPConfig();
                const url = normalizeWpUrl((safeGet(cfg, 'url') as string | undefined) || '');
                const user = ((safeGet(cfg, 'user') as string | undefined) || '').trim();
                const token = ((safeGet(cfg, 'token') as string | undefined) || (safeGet(cfg, 'password') as string | undefined) || '').replace(/\s+/g, '');
                if (!url || !user || !token) {
                    figma.ui.postMessage({ type: 'wp-status', success: false, message: 'URL, usuario ou senha do app ausentes.' });
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
                const autoPage = (cfg as any).autoPage !== undefined ? (cfg as any).autoPage : (cfg as any).createPage;
                await saveSetting('gptel_wp_url', url);
                await saveSetting('gptel_wp_user', user);
                await saveSetting('gptel_wp_token', token);
                await saveSetting('gptel_export_images', !!(cfg as any).exportImages);
                await saveSetting('gptel_auto_page', !!autoPage);
                figma.ui.postMessage({ type: 'wp-status', success: true, message: 'Conexao com WordPress verificada.' });
            } catch (e: any) {
                const wpError = (safeGet(e, 'message') as string) || e;
                figma.ui.postMessage({ type: 'wp-status', success: false, message: `Erro: ${wpError}` });
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
            const targetWidth = safeGetNumber(msg, 'width', 0);
            const targetHeight = safeGetNumber(msg, 'height', 0);
            if (targetWidth > 0 && targetHeight > 0) {
                figma.ui.resize(Math.min(1500, targetWidth), Math.min(1000, targetHeight));
            }
            break;

        case 'rename-layer':
            try {
                let node: SceneNode | null = null;

                // Prefer nodeId if provided (safer for programmatic renaming)
                if (msg.nodeId) {
                    const foundNode = figma.getNodeById(msg.nodeId);
                    if (foundNode && 'name' in foundNode) {
                        node = foundNode as SceneNode;
                    } else {
                        throw new Error('Node não encontrado ou não pode ser renomeado');
                    }
                } else {
                    // Fallback to selection
                    const selection = safeGetArray<SceneNode>(figma, 'currentPage.selection');
                    if (!selection || selection.length === 0) {
                        throw new Error('Nenhum layer selecionado.');
                    }
                    node = selection[0];
                }

                const name = msg.name as string;
                if (!name) throw new Error('Nome não fornecido');

                node.name = name;
                figma.notify(`✅ Layer renomeada para "${name}"`);

                // Send confirmation to UI
                figma.ui.postMessage({
                    type: 'rename-success',
                    nodeId: node.id,
                    newName: name
                });
            } catch (e: any) {
                const renameError = (safeGet(e, 'message') as string) || 'Falha ao renomear layer';
                figma.notify(renameError);
                figma.ui.postMessage({
                    type: 'rename-error',
                    message: renameError
                });
            }
            break;

        case 'run-heuristics-rename':
            try {
                const selection = safeGetArray<SceneNode>(figma, 'currentPage.selection');
                if (!selection || selection.length === 0) throw new Error('Selecione um frame ou node para organizar.');

                let count = 0;
                const processNode = (node: SceneNode) => {
                    try {
                        // Create snapshot and evaluate
                        const snapshot = createNodeSnapshot(node);
                        const results = evaluateNode(snapshot, DEFAULT_HEURISTICS);
                        const best = results[0];

                        if (best && best.confidence > 0.6) {
                            const newName = best.widget;
                            // Rename if not already prefixed
                            if (!node.name.match(/^[wc]:/) && node.name !== newName) {
                                node.name = newName;
                                count++;
                            }
                        }
                    } catch (e) {
                        // ignore individual node errors
                    }

                    if ('children' in node) {
                        for (const child of node.children) {
                            processNode(child);
                        }
                    }
                };

                selection.forEach(processNode);
                figma.notify(`Organização concluída! ${count} layers renomeados.`);
            } catch (e: any) {
                figma.notify((safeGet(e, 'message') as string) || 'Erro ao organizar layers');
            }
            break;

        // ========== LINTER HANDLERS ==========
        case 'analyze-layout':
            try {
                console.log('🔍 [LINTER] Handler analyze-layout iniciado');
                log('🔍 Handler analyze-layout iniciado', 'info');

                const selection = safeGetArray<SceneNode>(figma, 'currentPage.selection');
                console.log('[LINTER] Selection:', selection);

                if (!selection || selection.length === 0) {
                    console.log('[LINTER] ❌ Nenhum node selecionado');
                    figma.ui.postMessage({
                        type: 'linter-error',
                        message: 'Selecione um Frame para analisar'
                    });
                    log('❌ Nenhum Frame selecionado', 'error');
                    break;
                }

                const node = selection[0];
                console.log(`[LINTER] Node selecionado: ${node.name} (${node.type})`);
                log(`Node selecionado: ${node.name} (${node.type})`, 'info');

                if (node.type !== 'FRAME') {
                    console.log(`[LINTER] ❌ Node não é FRAME: ${node.type}`);
                    figma.ui.postMessage({
                        type: 'linter-error',
                        message: 'Selecione um Frame (não um ' + node.type + ')'
                    });
                    log(`❌ Selecione um Frame (não ${node.type})`, 'error');
                    break;
                }

                console.log('[LINTER] Iniciando análise de layout...');
                log('Iniciando análise de layout...', 'info');

                console.log('[LINTER] Chamando analyzeFigmaLayout...');
                log('Chamando analyzeFigmaLayout...', 'info');

                const report = await analyzeFigmaLayout(node, {
                    aiAssisted: false,
                    deviceTarget: 'desktop'
                });

                console.log('[LINTER] ✅ Relatório gerado:', report);
                log('Relatório gerado com sucesso', 'info');
                log(`Total de issues: ${report.analysis.length}`, 'info');
                log(`Total de widgets detectados: ${report.widgets.length}`, 'info');

                figma.ui.postMessage({
                    type: 'linter-report',
                    payload: report
                });

                console.log('[LINTER] ✅ Mensagem enviada para UI');
                log(`Análise concluída: ${report.summary.total} problemas encontrados`, 'success');
            } catch (error: any) {
                const message = (safeGet(error, 'message') as string) || String(error);
                const stack = (safeGet(error, 'stack') as string) || 'No stack trace';
                console.error('[LINTER] ❌ ERRO:', message);
                console.error('[LINTER] Stack:', stack);
                log(`❌ ERRO ao analisar layout: ${message}`, 'error');
                log(`Stack: ${stack}`, 'error');
                figma.ui.postMessage({
                    type: 'linter-error',
                    message: message
                });
            }
            break;

        case 'select-problem-node':
            try {
                const nodeId = msg.nodeId as string;
                if (!nodeId) {
                    figma.ui.postMessage({
                        type: 'linter-error',
                        message: 'ID do node não fornecido'
                    });
                    break;
                }

                const node = figma.getNodeById(nodeId);
                if (!node) {
                    figma.ui.postMessage({
                        type: 'linter-error',
                        message: 'Node não encontrado'
                    });
                    break;
                }

                // Seleciona o node
                figma.currentPage.selection = [node as SceneNode];

                // Faz zoom no node
                figma.viewport.scrollAndZoomIntoView([node as SceneNode]);

                // Notifica UI
                figma.ui.postMessage({
                    type: 'node-selected',
                    nodeId: nodeId
                });
            } catch (error: any) {
                figma.ui.postMessage({
                    type: 'linter-error',
                    message: (safeGet(error, 'message') as string) || 'Erro ao selecionar node'
                });
            }
            break;

        case 'mark-problem-resolved':
            try {
                const nodeId = msg.nodeId as string;
                if (!nodeId) {
                    figma.ui.postMessage({
                        type: 'linter-error',
                        message: 'ID do node não fornecido'
                    });
                    break;
                }

                const node = figma.getNodeById(nodeId);
                if (!node) {
                    figma.ui.postMessage({
                        type: 'linter-error',
                        message: 'Node não encontrado'
                    });
                    break;
                }

                // Re-analisa apenas este node
                const result = await validateSingleNode(node as SceneNode);

                // Salva estado se foi resolvido
                if (result.isValid) {
                    await figma.clientStorage.setAsync(`linter-resolved-${nodeId}`, true);
                }

                figma.ui.postMessage({
                    type: 'validation-result',
                    nodeId: nodeId,
                    isFixed: result.isValid,
                    issues: result.issues
                });

                if (result.isValid) {
                    log('✅ Problema resolvido!', 'success');
                } else {
                    log(`⚠️ Problema ainda não resolvido: ${result.issues.join(', ')}`, 'warn');
                }
            } catch (error: any) {
                figma.ui.postMessage({
                    type: 'linter-error',
                    message: (safeGet(error, 'message') as string) || 'Erro ao validar correção'
                });
            }
            break;

        case 'fix-issue':
            try {
                const { nodeId, ruleId } = msg;
                const node = figma.getNodeById(nodeId);

                if (!node) {
                    throw new Error('Node não encontrado');
                }

                // Instancia registro para buscar a regra
                const registry = new RuleRegistry();
                registry.register(new AutoLayoutRule());
                // Adicionar outras regras aqui conforme forem implementadas com fix

                const rule = registry.get(ruleId);
                if (!rule) {
                    throw new Error(`Regra ${ruleId} não encontrada ou não suporta correção automática`);
                }

                if (!rule.fix) {
                    throw new Error(`Regra ${ruleId} não possui correção automática implementada`);
                }

                const success = await rule.fix(node as SceneNode);

                if (success) {
                    log(`✅ Correção aplicada com sucesso para ${ruleId}`, 'success');

                    // Re-validar node
                    const result = await validateSingleNode(node as SceneNode);

                    figma.ui.postMessage({
                        type: 'validation-result',
                        nodeId: nodeId,
                        isFixed: result.isValid,
                        issues: result.issues
                    });
                } else {
                    throw new Error('Falha ao aplicar correção automática');
                }

            } catch (error: any) {
                log(`Erro ao aplicar correção: ${error.message}`, 'error');
                figma.ui.postMessage({
                    type: 'linter-error',
                    message: error.message
                });
            }
            break;


        case 'focus-node':
            if (msg.nodeId) {
                const node = figma.getNodeById(msg.nodeId);
                if (node) {
                    figma.currentPage.selection = [node as SceneNode];
                    figma.viewport.scrollAndZoomIntoView([node]);
                    figma.notify(`Focando em: ${node.name}`);
                } else {
                    figma.notify('Node não encontrado (pode ter sido deletado).', { error: true });
                }
            }
            break;

        case 'close':
            figma.closePlugin();
            break;
    }
};

sendStoredSettings();

