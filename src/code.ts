import { ConversionPipeline } from './pipeline';
import type { WPConfig, ElementorJSON } from './types/elementor.types';
import type { PipelineSchema, PipelineContainer, PipelineWidget } from './types/pipeline.schema';
import { serializeNode, SerializedNode } from './utils/serialization_utils';
import { extractContainerStyles, extractWidgetStyles, buildHtmlFromSegments } from './utils/style_utils';
import { GEMINI_MODEL, geminiProvider } from './api_gemini';
import { openaiProvider, testOpenAIConnection } from './api_openai';
import { SchemaProvider, DeterministicDiffMode, PipelineRunOptions } from './types/providers';
import { analyzeTreeWithHeuristics, convertToFlexSchema } from './pipeline/noai.parser';
import { ElementorCompiler } from './compiler/elementor.compiler';
import { ImageUploader } from './media/uploader';
import { createNodeSnapshot } from './deprecated/v1/adapter';
import { evaluateNode, DEFAULT_HEURISTICS } from './deprecated/v1/index';
import { FileLogger } from './utils/logger';
import { analyzeFigmaLayout, validateSingleNode, RuleRegistry, AutoLayoutRule } from './linter';
import { enforceWidgetTypes } from './services/heuristics';
import { initializeCompatLayer, safeGet, safeGetArray, safeGetNumber, safeGetString, safeGetBoolean, safeInvoke } from './compat';
import { getCompatibilityWarning } from './linter/rules/widget-compatibility';

// Licensing Module
import {
    checkAndConsumeLicenseUsage,
    registerCompileUsage,
    validateLicense,
    validateAndSaveLicense,
    clearLicenseConfig,
    getLicenseDisplayInfo,
    isLicenseConfigured,
    getPlanLabel,
    formatResetDate,
    LICENSE_PLANS_URL
} from './licensing';

// ============================================================
// SHADOW MODE V2 - Lint Engine V2 Integration
// When enabled, runs the new WidgetEngine in parallel with V1
// and logs differences. Does NOT affect final output.
// ============================================================
import { analyzeNodeWithEngine } from './engine';
const SHADOW_MODE = true;

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

// Initialize plugin UI
figma.notify("Plugin carregou!");
figma.showUI(__html__, { width: 380, height: 640, themeColors: true });
safeInvoke(() => figma.ui.postMessage({
    type: 'runtime-health',
    status: runtimeHealth.runtime,
    warnings: runtimeHealth.warnings || []
}));

// Listen for selection changes to update IntelliSense modal
figma.on('selectionchange', () => {
    const selection = figma.currentPage.selection;
    const nodes = selection.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type
    }));

    // Send updated selection to UI
    figma.ui.postMessage({
        type: 'UPDATE_SELECTION',
        nodes: nodes
    });
});

const pipeline = new ConversionPipeline();
let lastJSON: string | null = null;
let noaiUploader: ImageUploader | null = null;

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_PROVIDER = 'gemini';
const DEFAULT_GPT_MODEL = 'gpt-4.1-mini';

// ============================================================
// IntelliSense Widget Vocabulary (inline to avoid import issues)
// ============================================================
const INTELLISENSE_WIDGETS = [
    // Containers (Priority)
    'container', 'inner-container', 'section', 'inner-section',
    // Basic
    'heading', 'text-editor', 'button', 'image', 'icon', 'video', 'divider', 'spacer',
    'image-box', 'icon-box', 'star-rating', 'counter', 'progress', 'tabs', 'accordion',
    'toggle', 'alert', 'social-icons', 'soundcloud', 'shortcode', 'html', 'menu-anchor',
    'sidebar', 'read-more', 'image-carousel', 'image-gallery', 'icon-list', 'testimonial',
    'google-maps', 'audio', 'rating', 'inner-section',
    // Pro
    'form', 'login', 'call-to-action', 'media-carousel', 'portfolio', 'slides', 'flip-box',
    'animated-headline', 'post-navigation', 'share-buttons', 'table-of-contents', 'countdown',
    'blockquote', 'testimonial-carousel', 'reviews', 'hotspots', 'sitemap', 'author-box',
    'price-table', 'price-list', 'progress-tracker', 'nav-menu', 'breadcrumb', 'lottie',
    'video-playlist', 'search-form', 'global-widget',
    // Theme Builder
    'post-title', 'post-excerpt', 'post-content', 'post-featured-image', 'post-info',
    'post-author', 'post-date', 'post-terms', 'archive-title', 'archive-description',
    'site-logo', 'site-title', 'site-tagline', 'search-results',
    // Loop Builder
    'loop-grid', 'loop-carousel', 'loop-item', 'loop-image', 'loop-title', 'loop-meta',
    'loop-terms', 'loop-rating', 'loop-price', 'loop-add-to-cart', 'loop-read-more', 'loop-pagination',
    // Containers (Moved to top)
    // 'container', 'inner-container',
    // Hierarchical
    'accordion:item', 'accordion:title', 'accordion:content', 'tabs:item', 'tabs:title',
    'tabs:content', 'list:item', 'list:icon', 'list:text', 'toggle:item', 'toggle:title',
    'toggle:content', 'countdown:days', 'countdown:hours', 'countdown:minutes', 'countdown:seconds',
    'slide:1', 'slide:2', 'carousel:slide'
];

// Prefixed aliases for widget names
const WIDGET_ALIASES: Record<string, string[]> = {
    'heading': ['w:heading', 'title', 'h1', 'h2', 'h3', 'titulo'],
    'text-editor': ['w:text-editor', 'text', 'paragraph', 'texto'],
    'button': ['w:button', 'btn', 'cta', 'botao'],
    'image': ['w:image', 'img', 'photo', 'imagem', 'foto'],
    'icon': ['w:icon', 'icone'],
    'video': ['w:video', 'player'],
    'divider': ['w:divider', 'separator', 'line', 'hr'],
    'spacer': ['w:spacer', 'gap', 'spacing'],
    'image-box': ['w:image-box', 'imgbox'],
    'icon-box': ['w:icon-box', 'iconbox'],
    'container': ['w:container', 'c:container', 'section', 'wrapper', 'box'],
    'inner-container': ['w:inner-container', 'c:inner', 'inner'],
    'tabs': ['w:tabs', 'tabpanel'],
    'accordion': ['w:accordion', 'faq', 'collapse'],
    'form': ['w:form', 'formulario', 'contact-form'],
    'nav-menu': ['w:nav-menu', 'menu', 'navigation'],
    'image-gallery': ['w:image-gallery', 'gallery', 'galeria'],
    'image-carousel': ['w:image-carousel', 'carousel', 'slider'],
    'icon-list': ['w:icon-list', 'list', 'lista'],
    'testimonial': ['w:testimonial', 'depoimento', 'review'],
    'google-maps': ['w:google-maps', 'maps', 'mapa'],
    'countdown': ['w:countdown', 'timer'],
    'site-logo': ['w:site-logo', 'logo'],
    'search-form': ['w:search-form', 'search', 'busca'],
    'progress': ['w:progress', 'progressbar'],
    'counter': ['w:counter', 'number'],
    'star-rating': ['w:star-rating', 'rating', 'stars'],
    'social-icons': ['w:social-icons', 'social', 'redes-sociais'],
    'slides': ['w:slides', 'slider:slides', 'slideshow'],
    'price-table': ['w:price-table', 'pricing'],
    'blockquote': ['w:blockquote', 'quote', 'citacao'],
    'author-box': ['w:author-box', 'author'],
    'post-title': ['w:post-title', 'loop:title'],
    'post-featured-image': ['w:post-featured-image', 'loop:featured-image', 'loop:image'],
    'loop-grid': ['w:loop-grid', 'loop:grid', 'posts-grid'],
    'loop-carousel': ['w:loop-carousel', 'loop:carousel', 'posts-carousel']
};


/**
 * Levenshtein distance for fuzzy matching
 */
function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Get IntelliSense suggestions for a query
 * ONLY returns widgets from the vocabulary - nothing invented
 */
function getIntelliSenseSuggestions(query: string, limit: number = 15): Array<{ name: string; score: number; alias?: string }> {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
        // Return first N widgets alphabetically
        return INTELLISENSE_WIDGETS.slice(0, limit).map(name => ({ name, score: 1 }));
    }

    const results: Array<{ name: string; score: number; alias?: string }> = [];
    const seen = new Set<string>();

    for (const widget of INTELLISENSE_WIDGETS) {
        // Exact match
        if (widget === q) {
            results.push({ name: widget, score: 1 });
            seen.add(widget);
            continue;
        }

        // Prefix match
        if (widget.startsWith(q)) {
            results.push({ name: widget, score: 0.9 });
            seen.add(widget);
            continue;
        }

        // Contains match
        if (widget.includes(q)) {
            results.push({ name: widget, score: 0.7 });
            seen.add(widget);
            continue;
        }

        // Fuzzy match
        const distance = levenshtein(q, widget);
        const similarity = 1 - (distance / Math.max(q.length, widget.length));
        if (similarity > 0.4) {
            results.push({ name: widget, score: similarity });
            seen.add(widget);
        }
    }

    // Check aliases
    for (const [widget, aliases] of Object.entries(WIDGET_ALIASES)) {
        if (seen.has(widget)) continue;
        for (const alias of aliases) {
            const aliasLower = alias.toLowerCase();
            if (aliasLower === q || aliasLower.startsWith(q) || aliasLower.includes(q)) {
                results.push({ name: widget, score: 0.85, alias });
                seen.add(widget);
                break;
            }
        }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
}


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
    warnExcessiveLineHeight(serialized);
    const includeScreenshotPayload = safeGet(aiPayload, 'includeScreenshot');
    const includeScreenshot = typeof includeScreenshotPayload === 'boolean' ? includeScreenshotPayload : await loadSetting<boolean>('gptel_include_screenshot', true);
    const includeReferencesPayload = safeGet(aiPayload, 'includeReferences');
    const includeReferences = typeof includeReferencesPayload === 'boolean' ? includeReferencesPayload : await loadSetting<boolean>('gptel_include_references', true);
    const useDeterministic = safeGet(aiPayload, 'useDeterministic') === true;
    const diffModeValue = safeGet(aiPayload, 'deterministicDiffMode');
    const deterministicDiffMode: DeterministicDiffMode | undefined =
        diffModeValue === 'log' || diffModeValue === 'store' ? diffModeValue : undefined;
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

function warnExcessiveLineHeight(root: SerializedNode) {
    if (!root) return;
    const THRESHOLD = 1.5;
    type LineHeightIssue = { nodeName: string; linePx: number; fontSize: number; ratio: number };
    const issues: LineHeightIssue[] = [];

    const ensureIssue = (fontSize?: number, lineHeight?: any, nodeName?: string): boolean => {
        if (!fontSize || !lineHeight) return false;
        const px = resolveLineHeightPx(lineHeight, fontSize);
        if (!px) return false;
        const ratio = px / fontSize;
        if (ratio > THRESHOLD) {
            issues.push({
                nodeName: nodeName || 'Texto',
                linePx: px,
                fontSize,
                ratio
            });
            return true;
        }
        return false;
    };

    const walk = (node: SerializedNode | null | undefined) => {
        if (!node) return;
        if ((node as any).type === 'TEXT') {
            const name = (node as any).name || ((node as any).characters ? ((node as any).characters as string).slice(0, 40) : node.id);
            const baseFontSize = typeof (node as any).fontSize === 'number' ? (node as any).fontSize : undefined;
            const baseLineHeight = (node as any).lineHeight;
            let warned = ensureIssue(baseFontSize, baseLineHeight, name);

            const segments = (node as any).styledTextSegments;
            if (!warned && Array.isArray(segments)) {
                for (const segment of segments) {
                    const segFont = typeof segment.fontSize === 'number' ? segment.fontSize : baseFontSize;
                    const segLine = segment.lineHeight || baseLineHeight;
                    if (ensureIssue(segFont, segLine, name)) {
                        warned = true;
                        break;
                    }
                }
            }
        }
        const children = (node as any).children;
        if (Array.isArray(children)) {
            children.forEach(child => walk(child));
        }
    };

    walk(root);

    if (issues.length > 0) {
        issues.forEach(issue => {
            const message = `Line-height alto detectado em "${issue.nodeName}": ${issue.linePx.toFixed(1)}px (${issue.ratio.toFixed(2)}x o font-size ${issue.fontSize}px). Ajuste no Figma para evitar esticar o botão.`;
            log(message, 'warn');
        });
    }
}

function resolveLineHeightPx(lineHeight: any, fontSize?: number): number | null {
    if (!lineHeight) return null;
    if (typeof lineHeight === 'number') return lineHeight;
    if (typeof lineHeight === 'object') {
        const unit = lineHeight.unit;
        const value = lineHeight.value;
        if (unit === 'AUTO') return null;
        if (unit === 'PIXELS' && typeof value === 'number') return value;
        if (unit === 'PERCENT' && typeof value === 'number' && typeof fontSize === 'number') {
            return (fontSize * value) / 100;
        }
    }
    return null;
}


function hydrateSchemaWithRealStyles(schema: PipelineSchema, root: SerializedNode): void {
    if (!schema || !schema.containers || schema.containers.length === 0 || !root) {
        return;
    }

    const nodeMap = new Map<string, SerializedNode>();
    const walk = (node: SerializedNode | undefined | null) => {
        if (!node || !node.id) return;
        nodeMap.set(node.id, node);
        const children = (node as any).children;
        if (Array.isArray(children)) {
            children.forEach((child: SerializedNode) => walk(child));
        }
    };
    walk(root);

    const vectorTypes = new Set(['VECTOR', 'ELLIPSE', 'POLYGON', 'STAR', 'BOOLEAN_OPERATION', 'LINE']);
    const findVectorChildNode = (source?: SerializedNode | null): SerializedNode | null => {
        if (!source) return null;
        if (vectorTypes.has((source as any).type)) {
            return source;
        }
        const children = (source as any).children;
        if (Array.isArray(children)) {
            for (const child of children) {
                const found = findVectorChildNode(child as SerializedNode);
                if (found) return found;
            }
        }
        if (((source as any).name || '').toLowerCase().includes('icon')) {
            return source;
        }
        return null;
    };

    const processContainer = (container: PipelineContainer) => {
        if (!container) return;
        const sourceId = container.styles?.sourceId;
        if (sourceId && nodeMap.has(sourceId)) {
            const node = nodeMap.get(sourceId)!;
            const realStyles = extractContainerStyles(node);
            container.styles = { ...(container.styles || {}), ...realStyles };
            if (realStyles.paddingTop !== undefined) container.styles.paddingTop = realStyles.paddingTop;
            if (realStyles.paddingRight !== undefined) container.styles.paddingRight = realStyles.paddingRight;
            if (realStyles.paddingBottom !== undefined) container.styles.paddingBottom = realStyles.paddingBottom;
            if (realStyles.paddingLeft !== undefined) container.styles.paddingLeft = realStyles.paddingLeft;
            if (realStyles.gap !== undefined) container.styles.gap = realStyles.gap;
            if (realStyles.justify_content) container.styles.justify_content = realStyles.justify_content;
            if (realStyles.align_items) container.styles.align_items = realStyles.align_items;
            if (container.styles.background && container.styles.background.type === 'image' && !container.styles.backgroundImage) {
                container.styles.backgroundImage = container.styles.background;
            }
            if (realStyles.backgroundImage && !container.styles.backgroundImage) {
                container.styles.backgroundImage = realStyles.backgroundImage;
            }
        }

        if (Array.isArray(container.widgets)) {
            for (const widget of container.widgets) {
                if (!widget.styles) widget.styles = {};
                const widgetSourceId = widget.styles.sourceId;
                if (widgetSourceId && nodeMap.has(widgetSourceId)) {
                    const node = nodeMap.get(widgetSourceId)!;
                    const realStyles = extractWidgetStyles(node);
                    const preservedDimensions: Record<string, any> = {};
                    const dimensionKeys = ['width', '_frameWidth', 'height', '_frameHeight', 'minHeight', 'maxHeight'];
                    dimensionKeys.forEach(key => {
                        if (widget.styles && widget.styles[key] !== undefined) {
                            preservedDimensions[key] = widget.styles[key];
                        }
                    });
                    widget.styles = { ...widget.styles, ...realStyles };
                    Object.keys(preservedDimensions).forEach(key => {
                        widget.styles[key] = preservedDimensions[key];
                    });

                    if (node.type === 'TEXT' && (widget.type === 'heading' || widget.type === 'text')) {
                        if (node.styledTextSegments && node.styledTextSegments.length > 1) {
                            const rich = buildHtmlFromSegments(node);
                            widget.content = rich.html;
                            widget.styles.customCss = rich.css;
                        } else {
                            widget.content = (node as any).characters || widget.content || node.name;
                        }
                    }

                    if (!widget.imageId && (widget.type === 'button' || widget.type === 'icon' || widget.type === 'icon-box')) {
                        const vectorChild = findVectorChildNode(node);
                        if (vectorChild) {
                            widget.imageId = vectorChild.id;
                        }
                    }
                }
            }
        }

        if (Array.isArray(container.children)) {
            container.children.forEach(processContainer);
        }
    };

    schema.containers.forEach(processContainer);
}

async function syncNavMenusLegacy(schema: PipelineSchema, wpConfig: WPConfig): Promise<void> {
    if (!schema || !schema.containers || schema.containers.length === 0) {
        return;
    }

    log('[NAV MENU SYNC] ========== START ==========', 'info');

    const sendUiMessage = (level: 'success' | 'info' | 'warn' | 'error', message: string) => {
        try {
            figma.ui.postMessage({ type: 'log', level, message });
        } catch (err) {
            console.warn('[NAV MENU SYNC] Unable to send UI message:', err);
        }
    };

    const syncEnabled = !!(wpConfig && wpConfig.url && (wpConfig as any).user && ((wpConfig as any).password || (wpConfig as any).token));
    if (!syncEnabled) {
        sendUiMessage('warn', 'Sincronização de menus desativada: informe URL, usuário e senha do WordPress para criar o menu.');
        return;
    }

    const endpointBase = (wpConfig.url || '').replace(/\/$/, '');
    const endpoint = `${endpointBase}/wp-json/figtoel-remote-menus/v1/sync`;
    const btoaPolyfill = (str: string): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';
        let i = 0;

        while (i < str.length) {
            const a = str.charCodeAt(i++);
            const b = i < str.length ? str.charCodeAt(i++) : 0;
            const c = i < str.length ? str.charCodeAt(i++) : 0;

            const bitmap = (a << 16) | (b << 8) | c;

            output += chars.charAt((bitmap >> 18) & 63);
            output += chars.charAt((bitmap >> 12) & 63);
            output += chars.charAt(b ? (bitmap >> 6) & 63 : 64);
            output += chars.charAt(c ? bitmap & 63 : 64);
        }

        return output;
    };
    const auth = 'Basic ' + btoaPolyfill(`${(wpConfig as any).user}:${(wpConfig as any).password || (wpConfig as any).token}`);

    try {
        const checkResponse = await fetch(endpoint, {
            method: 'OPTIONS',
            headers: { 'Authorization': auth }
        });

        if (checkResponse.status === 404) {
            sendUiMessage('error', 'Instale e ative o plugin WordPress figtoel-remote-menus para habilitar o endpoint de sincronização de menus.');
            return;
        }

        if (!checkResponse.ok && ![401, 403, 405].includes(checkResponse.status)) {
            sendUiMessage('warn', `Não foi possível validar o endpoint de menus (status ${checkResponse.status}). Tentando sincronizar mesmo assim...`);
        }
    } catch (error) {
        sendUiMessage('error', `Não foi possível verificar o endpoint do plugin figtoel-remote-menus: ${error}`);
        return;
    }

    const navMenus: Array<{ widget: PipelineWidget; container: PipelineContainer }> = [];
    const collectNavMenus = (container: PipelineContainer) => {
        if (container.widgets) {
            for (const widget of container.widgets) {
                if (widget.type === 'nav-menu') {
                    navMenus.push({ widget, container });
                }
            }
        }
        if (container.children) {
            for (const child of container.children) {
                collectNavMenus(child);
            }
        }
    };

    schema.containers.forEach(collectNavMenus);

    if (navMenus.length === 0) {
        log('[NAV MENU SYNC] No nav-menu widgets found.', 'info');
        return;
    }

    for (const { widget, container } of navMenus) {
        const sourceId = widget.styles?.sourceId || container.id;
        const figmaNode = sourceId ? figma.getNodeById(sourceId) : null;
        if (!figmaNode || !('children' in figmaNode)) {
            log(`[NAV MENU SYNC] Cannot find Figma node for nav-menu: ${sourceId}`, 'warn');
            continue;
        }

        const items = extractMenuItemsFromNode(figmaNode as FrameNode);
        const menuName = widget.content || figmaNode.name || 'Menu Principal';
        const payload = {
            menu_name: menuName,
            menu_location: 'primary',
            replace_existing: true,
            items
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': auth
                },
                body: JSON.stringify(payload)
            });

            let responseText = '';
            let result: any = null;
            try {
                responseText = await response.text();
                result = responseText ? JSON.parse(responseText) : null;
            } catch {
                result = null;
            }

            if (response.ok && result?.success) {
                sendUiMessage('success', `Menu "${menuName}" criado no WordPress com ${result.items_created} itens.`);
            } else {
                const detailedError = result?.error || result?.message || responseText || response.statusText || 'Desconhecido';
                sendUiMessage('error', `Erro ${response.status} ao criar o menu "${menuName}": ${detailedError}`);
            }
        } catch (error) {
            sendUiMessage('error', `Erro ao sincronizar menu "${menuName}": ${error}`);
        }
    }
}

function extractMenuItemsFromNode(navMenuNode: FrameNode): Array<{ title: string; url: string; children?: any[] }> {
    const items: Array<{ title: string; url: string; children?: any[] }> = [];
    if (!navMenuNode.children) return items;

    for (const child of navMenuNode.children) {
        if (child.type === 'TEXT') {
            const title = (child as TextNode).characters;
            items.push({ title, url: '#' });
            continue;
        }

        if (child.type === 'FRAME' || child.type === 'GROUP') {
            let title = child.name;
            if ('children' in child) {
                const textChild = (child as FrameNode).children.find(c => c.type === 'TEXT');
                if (textChild) {
                    title = (textChild as TextNode).characters;
                }
            }
            items.push({ title, url: '#' });
        }
    }

    return items;
}

async function runPipelineWithoutAI(serializedTree: SerializedNode, wpConfig: WPConfig = {}): Promise<ElementorJSON> {
    const analyzed = analyzeTreeWithHeuristics(serializedTree as any);
    const schema = convertToFlexSchema(analyzed as any) as PipelineSchema;
    hydrateSchemaWithRealStyles(schema, serializedTree);

    // ============================================================
    // SHADOW MODE V2: Run V2 engine in parallel and log differences
    // This block NEVER affects the final output (always uses V1)
    // ============================================================
    if (SHADOW_MODE) {
        try {
            var rootNode = figma.getNodeById(serializedTree.id) as FrameNode | null;
            if (rootNode) {
                var v2Result = analyzeNodeWithEngine(rootNode, rootNode);

                // Get V1 widget type from schema (not raw node type)
                // The schema root is a container, check first widget or container type
                var v1Widget = 'container'; // Default fallback
                if (schema.containers && schema.containers.length > 0) {
                    var rootContainer = schema.containers[0];
                    if (rootContainer.widgets && rootContainer.widgets.length > 0) {
                        v1Widget = rootContainer.widgets[0].type || 'container';
                    } else if (rootContainer.children && rootContainer.children.length > 0) {
                        v1Widget = 'container';
                    }
                }
                // Check if node has explicit widget name prefix
                var nodeName = (serializedTree.name || '').toLowerCase();
                if (nodeName.startsWith('w:') || nodeName.startsWith('c:')) {
                    v1Widget = nodeName.replace(/^(w:|c:)/, '');
                }

                var v2Widget = v2Result.bestMatch ? v2Result.bestMatch.widget : 'null';
                var v2Score = v2Result.bestMatch ? v2Result.bestMatch.score.toFixed(2) : '0.00';

                if (v1Widget !== v2Widget) {
                    console.log('[SHADOW-V2] Node ' + serializedTree.id + ' | V1: ' + v1Widget + ' | V2: ' + v2Widget + ' (' + v2Score + ')');
                    if (v2Result.structuralIssues.length > 0) {
                        console.log('[SHADOW-V2] Issues:', v2Result.structuralIssues.map(function (i) { return i.message; }));
                    }
                }
            }
        } catch (shadowError) {
            console.warn('[SHADOW-V2] Error:', shadowError);
        }
    }
    // ============================================================
    // END SHADOW MODE - V1 result continues unchanged below
    // ============================================================


    // Resolver imagens (upload para WP quando configurado)
    const normalizedWP = { ...wpConfig, password: safeGet(wpConfig as any, 'password') || safeGet(wpConfig as any, 'token') };
    noaiUploader = new ImageUploader({});
    noaiUploader.setWPConfig(normalizedWP);
    const uploadEnabled = !!(normalizedWP && normalizedWP.url && (normalizedWP as any).user && (normalizedWP as any).password && (normalizedWP as any).exportImages);

    const uploadPromises: Promise<void>[] = [];
    const containerUploadPromises: Promise<void>[] = [];

    await enforceWidgetTypes(schema);

    const processContainerBackground = async (container: PipelineContainer) => {
        if (!uploadEnabled || !noaiUploader) return;
        const styles = container.styles || {};
        const backgroundImage = (styles.backgroundImage as any) || (styles.background && styles.background.type === 'image' ? styles.background : null);
        const imageHash = backgroundImage?.imageHash;
        if (!imageHash) return;
        try {
            const label = container.id || styles.sourceId || 'container';
            const uploaded = await noaiUploader.uploadImageHash(imageHash, String(label));
            if (uploaded) {
                if (!styles.backgroundImage || !styles.backgroundImage.imageHash) {
                    styles.backgroundImage = { type: 'image', imageHash };
                }
                (styles.backgroundImage as any).wpUrl = uploaded.url;
                (styles.backgroundImage as any).wpId = uploaded.id;
                container.styles = styles;
            }
        } catch (error) {
            console.error('[NO-AI] Failed to upload container background:', error);
        }
    };

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

                    // Helper to find actual icon node inside a composite widget
                    const findIconChild = (n: SceneNode): SceneNode | null => {
                        // Priority 1: Explicit name match
                        if (n.name.toLowerCase().includes('icon') || n.name.toLowerCase().includes('vector')) return n;
                        // Priority 2: Vector type
                        if (isVectorNode(n)) return n;
                        // Recursion
                        if ('children' in n) {
                            for (const c of n.children) {
                                const found = findIconChild(c);
                                if (found) return found;
                            }
                        }
                        return null;
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
                    const explicitIconTypes = ['icon', 'list-item', 'accordion', 'toggle', 'button', 'icon-box'];
                    if (node.name === 'Icon' || explicitIconTypes.includes(widget.type)) {
                        format = 'SVG';
                    }

                    // RETARGETING: For Buttons/IconBoxes, we don't want to upload the Frame itself, but its Icon child.
                    let targetNode = node;
                    if (widget.type === 'button' || widget.type === 'icon-box') {
                        const iconChild = findIconChild(node as SceneNode);
                        if (iconChild) {
                            console.log(`[NO-AI] Found internal icon for ${widget.type}: ${iconChild.name}`);
                            targetNode = iconChild;
                            format = 'SVG';
                        } else {
                            // If no icon found in button, DO NOT upload the button frame as an image/icon.
                            // Unless it's an Image-Button? No, usually 'button' is standard.
                            console.log(`[NO-AI] No icon child found in ${widget.type}. Skipping upload.`);
                            return;
                        }
                    }

                    const result = await uploader.uploadToWordPress(targetNode as SceneNode, format as any);
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

    const collectUploads = (container: PipelineContainer) => {
        if (uploadEnabled) {
            containerUploadPromises.push(processContainerBackground(container));
        }
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

    const pendingUploads = [...uploadPromises, ...containerUploadPromises];
    if (pendingUploads.length > 0) {
        await Promise.all(pendingUploads);
    }

    await syncNavMenusLegacy(schema, normalizedWP);

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

                // ====== LICENSE CHECK ======
                log('Verificando licença...', 'info');
                const figmaUserId = figma.currentUser?.id || '';
                if (!figmaUserId) {
                    log('Não foi possível identificar o usuário Figma.', 'error');
                    figma.ui.postMessage({ type: 'generation-error', message: 'Não foi possível identificar sua conta Figma. Recarregue o plugin.' });
                    break;
                }
                const licenseCheck = await checkAndConsumeLicenseUsage(figmaUserId);

                if (!licenseCheck.allowed) {
                    log(`Licença: ${licenseCheck.message}`, 'error');
                    figma.ui.postMessage({
                        type: 'license-blocked',
                        status: licenseCheck.status,
                        message: licenseCheck.message,
                        usage: licenseCheck.usage,
                        plansUrl: LICENSE_PLANS_URL
                    });
                    figma.ui.postMessage({ type: 'generation-error', message: licenseCheck.message });
                    figma.notify(`⚠️ ${licenseCheck.message}`, { timeout: 6000 });
                    break;
                }

                // Licença OK - atualizar UI com uso
                if (licenseCheck.usage) {
                    figma.ui.postMessage({
                        type: 'license-usage-updated',
                        usage: licenseCheck.usage
                    });
                }
                log(`Licença OK: ${licenseCheck.message}`, 'success');
                // ====== END LICENSE CHECK ======

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

        case 'APPLY_NAMES':
            try {
                const renames = msg.renames as Array<{ id: string; newName: string }>;
                if (!Array.isArray(renames) || renames.length === 0) {
                    figma.notify('Nenhum nome para aplicar.', { timeout: 2000 });
                    break;
                }

                let successCount = 0;
                for (const rename of renames) {
                    console.log(`[INTELLISENSE] Renaming: id=${rename.id}, newName=${rename.newName}`);
                    const node = figma.getNodeById(rename.id);
                    console.log(`[INTELLISENSE] Found node: ${node ? `name=${(node as any).name}, type=${node.type}` : 'NULL'}`);
                    if (node && 'name' in node) {
                        const oldName = (node as any).name;
                        (node as any).name = rename.newName;
                        console.log(`[INTELLISENSE] Renamed: "${oldName}" -> "${rename.newName}"`);
                        successCount++;
                    }
                }

                figma.notify(`✅ ${successCount} layer(s) renomeado(s)!`, { timeout: 2000 });
                figma.ui.postMessage({ type: 'RENAME_SUCCESS', count: successCount });
                // Don't close plugin - keep modal open for more renames
            } catch (e: any) {
                const error = (safeGet(e, 'message') as string) || e;
                figma.notify(`Erro ao renomear: ${error}`, { timeout: 3000 });
                figma.ui.postMessage({ type: 'RENAME_ERROR', message: error });
            }
            break;

        case 'GET_INTELLISENSE_SUGGESTIONS':
            try {
                const query = (msg.query as string) || '';
                const selection = figma.currentPage.selection;
                const nodeTypes = [...new Set(selection.map(n => n.type))];

                let detectedWidget: string | null = null;
                // Heurística de Predição para single selection (boost quando query vazia)
                if (selection.length === 1) {
                    try {
                        const snapshot = createNodeSnapshot(selection[0]);
                        const analysisResult = analyzeTreeWithHeuristics(snapshot as any);
                        // Filtra containers genéricos para evitar boost inútil
                        if (analysisResult && analysisResult.widget &&
                            !['unknown', 'div', 'frame', 'group'].includes(analysisResult.widget)) { // Allow 'container' to boost
                            detectedWidget = analysisResult.widget.replace(/^w:/, '');
                        }
                    } catch (e) {
                        // ignore heuristic errors
                    }
                }

                // Import WVL inline to avoid module issues
                const rawSuggestions = getIntelliSenseSuggestions(query, 15);

                // Enriquecer com warnings e Smart Scoring
                const suggestions = rawSuggestions.map(s => {
                    let warning = getCompatibilityWarning(nodeTypes, s.name);
                    let smartScore = s.score;
                    const sName = s.name.replace(/^w:/, '');

                    // HOTFIX: Garantir compatibilidade de texto (Resolve falso positivo reportado)
                    if (nodeTypes.includes('TEXT') && ['heading', 'text-editor', 'paragraph'].includes(sName)) {
                        warning = null;
                        if (!detectedWidget) smartScore = 2.0; // Force boost se heurística falhou
                    }

                    // BOOST: Se a heurística detectou essa estrutura exata
                    if (detectedWidget && (sName === detectedWidget || s.name === detectedWidget)) {
                        smartScore = 2.0; // Topo
                    } else if (warning) {
                        smartScore *= 0.5;
                    } else if (nodeTypes.length > 0) {
                        smartScore *= 1.2;
                    }

                    // STRUCTURAL BOOST: Frame/Group -> Container
                    if (['FRAME', 'GROUP', 'SECTION'].some(t => nodeTypes.includes(t)) &&
                        ['container', 'inner-container', 'inner-section', 'section'].includes(sName)) {
                        smartScore = 3.0;
                    }

                    // VISUAL BOOST: Rectangle/Vector -> Image/Button/Divider/Spacer
                    if (['RECTANGLE', 'VECTOR', 'ELLIPSE', 'STAR', 'LINE'].some(t => nodeTypes.includes(t))) {
                        if (['image', 'button', 'divider', 'spacer', 'icon', 'video'].includes(sName)) {
                            smartScore = 2.5; // High priority for visual types
                        } else if (['container', 'inner-container'].includes(sName)) {
                            // Soft demotion for containers on primitives (unless user really wants it)
                            // We don't punish hard because it's valid, but we let Visual wins.
                            // Current score is ~1.0 or 1.2. 2.5 will beat it.
                        }
                    }

                    return { ...s, warning: warning || undefined, score: smartScore };
                });

                // Reordenar por score ajustado
                suggestions.sort((a, b) => b.score - a.score);

                figma.ui.postMessage({ type: 'INTELLISENSE_SUGGESTIONS', suggestions });
            } catch (e: any) {
                console.error('IntelliSense error:', e);
                figma.ui.postMessage({ type: 'INTELLISENSE_SUGGESTIONS', suggestions: [] });
            }
            break;

        case 'REQUEST_SELECTION_FOR_RENAME':
            try {
                const selection = figma.currentPage.selection;
                console.log('[INTELLISENSE] Button clicked - Selection count:', selection.length);

                if (selection.length === 0) {
                    figma.notify('Selecione pelo menos um layer para renomear.', { timeout: 3000 });
                    break;
                }

                const nodes = selection.map(node => {
                    console.log(`[INTELLISENSE] Selected node: id=${node.id}, name=${node.name}, type=${node.type}`);
                    return {
                        id: node.id,
                        name: node.name,
                        type: node.type
                    };
                });

                figma.ui.postMessage({
                    type: 'INIT_RENAME_MODAL',
                    nodes: nodes
                });
            } catch (e: any) {
                console.error('Error getting selection:', e);
                figma.notify('Erro ao obter seleção.', { timeout: 2000 });
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

        // ============================================================
        // LICENSE HANDLERS
        // ============================================================

        case 'license-validate':
            try {
                figma.ui.postMessage({ type: 'license-validating' });
                const licenseKey = (msg.licenseKey as string) || '';
                const siteDomain = (msg.siteDomain as string) || '';
                const figmaUserIdForValidation = figma.currentUser?.id || '';

                if (!figmaUserIdForValidation) {
                    figma.ui.postMessage({
                        type: 'license-validate-result',
                        success: false,
                        status: 'license_error',
                        message: 'Não foi possível identificar sua conta Figma. Recarregue o plugin.',
                        plansUrl: LICENSE_PLANS_URL
                    });
                    break;
                }

                const result = await validateAndSaveLicense(licenseKey, siteDomain, figmaUserIdForValidation);

                figma.ui.postMessage({
                    type: 'license-validate-result',
                    success: result.allowed,
                    status: result.status,
                    message: result.message,
                    usage: result.usage,
                    planSlug: result.planSlug,
                    plansUrl: LICENSE_PLANS_URL
                });

                if (result.allowed) {
                    figma.notify('✅ Licença validada com sucesso!', { timeout: 3000 });
                } else {
                    figma.notify(`⚠️ ${result.message}`, { timeout: 5000 });
                }
            } catch (error: any) {
                const errorMsg = (safeGet(error, 'message') as string) || String(error);
                figma.ui.postMessage({
                    type: 'license-validate-result',
                    success: false,
                    status: 'license_error',
                    message: errorMsg,
                    plansUrl: LICENSE_PLANS_URL
                });
            }
            break;

        case 'license-load':
            try {
                const info = await getLicenseDisplayInfo();
                figma.ui.postMessage({
                    type: 'license-info',
                    ...info,
                    plansUrl: LICENSE_PLANS_URL
                });
            } catch (error: any) {
                figma.ui.postMessage({
                    type: 'license-info',
                    configured: false,
                    status: 'error',
                    plansUrl: LICENSE_PLANS_URL
                });
            }
            break;

        case 'license-clear':
            try {
                await clearLicenseConfig();
                figma.ui.postMessage({
                    type: 'license-cleared',
                    success: true
                });
                figma.notify('🔓 Licença desconectada.', { timeout: 3000 });
            } catch (error: any) {
                figma.ui.postMessage({
                    type: 'license-cleared',
                    success: false,
                    error: (safeGet(error, 'message') as string) || String(error)
                });
            }
            break;

        case 'license-open-plans':
            // UI abrirá o link externamente
            figma.ui.postMessage({
                type: 'open-external-url',
                url: LICENSE_PLANS_URL
            });
            break;

        // ============================================================
        // ONBOARDING: Handlers
        // ============================================================
        case 'onboarding-load':
            try {
                const onboardingHidden = await figma.clientStorage.getAsync('figtoel_onboarding_hidden');
                figma.ui.postMessage({
                    type: 'onboarding-state',
                    hidden: !!onboardingHidden
                });
            } catch (e) {
                figma.ui.postMessage({
                    type: 'onboarding-state',
                    hidden: false
                });
            }
            break;

        case 'onboarding-save-hidden':
            try {
                const hidden = safeGetBoolean(msg, 'hidden', false);
                await figma.clientStorage.setAsync('figtoel_onboarding_hidden', hidden);
                figma.ui.postMessage({
                    type: 'onboarding-saved',
                    success: true
                });
            } catch (error: any) {
                figma.ui.postMessage({
                    type: 'onboarding-saved',
                    success: false,
                    error: (safeGet(error, 'message') as string) || String(error)
                });
            }
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

                const safeReport = JSON.parse(JSON.stringify(report));
                figma.ui.postMessage({
                    type: 'linter-report',
                    payload: safeReport
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

        // ============================================================
        // LINTER: Select Node from UI
        // Handles message from Linter UI v2 to select and focus a node
        // ============================================================
        case 'linter:select-node':
        case 'select-node': {
            const { nodeId } = msg as { nodeId?: string };
            console.log('[LINTER] onmessage: linter:select-node', { nodeId });

            // Validate nodeId
            if (!nodeId || typeof nodeId !== 'string') {
                console.warn('[LINTER] nodeId inválido ou ausente', { nodeId });
                figma.ui.postMessage({
                    type: 'linter:select-node:error',
                    payload: {
                        nodeId: nodeId || undefined,
                        reason: 'INVALID_ID',
                        detail: 'O nodeId fornecido é inválido ou está ausente.'
                    }
                });
                break;
            }

            try {
                // Try to find the node
                const node = figma.getNodeById(nodeId);

                if (!node) {
                    console.warn('[LINTER] Node não encontrado para nodeId:', nodeId);
                    figma.ui.postMessage({
                        type: 'linter:select-node:error',
                        payload: {
                            nodeId: nodeId,
                            reason: 'NODE_NOT_FOUND',
                            detail: `Node com ID "${nodeId}" não foi encontrado. Pode ter sido deletado.`
                        }
                    });
                    figma.notify('Node não encontrado (pode ter sido deletado).', { error: true, timeout: 3000 });
                    break;
                }

                // Select the node
                console.log('[LINTER] Selecionando node:', node.name, nodeId);
                figma.currentPage.selection = [node as SceneNode];

                // Try to scroll and zoom to the node
                try {
                    figma.viewport.scrollAndZoomIntoView([node]);
                    console.log('[LINTER] Viewport ajustado para node:', node.name);
                } catch (viewportError) {
                    console.warn('[LINTER] Erro ao ajustar viewport (ignorando):', viewportError);
                }

                // Send success response
                figma.ui.postMessage({
                    type: 'linter:select-node:ok',
                    payload: {
                        nodeId: nodeId,
                        nodeName: node.name,
                        message: `Node "${node.name}" selecionado com sucesso.`
                    }
                });

                log(`🎯 [LINTER] Node selecionado: ${node.name}`, 'info');

            } catch (error: any) {
                console.error('[LINTER] Erro ao selecionar node:', error);
                figma.ui.postMessage({
                    type: 'linter:select-node:error',
                    payload: {
                        nodeId: nodeId,
                        reason: 'UNKNOWN_ERROR',
                        detail: error?.message || String(error)
                    }
                });
            }
            break;
        }

        // ============================================================
        // LINTER: Rename Node from UI
        // Handles rename requests from Linter action panel
        // ============================================================
        case 'linter-rename-node': {
            const { nodeId, newName } = msg as { nodeId?: string; newName?: string };
            console.log('[LINTER] onmessage: linter-rename-node', { nodeId, newName });

            // Validate inputs
            if (!nodeId || typeof nodeId !== 'string') {
                console.warn('[LINTER] nodeId inválido');
                figma.ui.postMessage({
                    type: 'linter-rename-node:result',
                    payload: {
                        nodeId: nodeId || '',
                        newName: newName || '',
                        status: 'error',
                        errorMessage: 'nodeId inválido ou ausente.'
                    }
                });
                break;
            }

            if (!newName || typeof newName !== 'string' || newName.trim() === '') {
                console.warn('[LINTER] newName inválido');
                figma.ui.postMessage({
                    type: 'linter-rename-node:result',
                    payload: {
                        nodeId: nodeId,
                        newName: newName || '',
                        status: 'error',
                        errorMessage: 'Nome inválido ou vazio.'
                    }
                });
                break;
            }

            try {
                const node = figma.getNodeById(nodeId);

                if (!node) {
                    console.warn('[LINTER] Node não encontrado:', nodeId);
                    figma.ui.postMessage({
                        type: 'linter-rename-node:result',
                        payload: {
                            nodeId: nodeId,
                            newName: newName,
                            status: 'error',
                            errorMessage: 'Node não encontrado. Pode ter sido deletado.'
                        }
                    });
                    break;
                }

                // Cast to SceneNode to access name property
                const sceneNode = node as SceneNode;
                if (!sceneNode || !sceneNode.name) {
                    console.warn('[LINTER] Node não suporta renomeação');
                    figma.ui.postMessage({
                        type: 'linter-rename-node:result',
                        payload: {
                            nodeId: nodeId,
                            newName: newName,
                            status: 'error',
                            errorMessage: 'Node não suporta renomeação.'
                        }
                    });
                    break;
                }

                const oldName = sceneNode.name;
                sceneNode.name = newName.trim();

                console.log('[LINTER] Node renomeado:', oldName, '→', sceneNode.name);

                // Select the renamed node
                figma.currentPage.selection = [sceneNode];

                figma.ui.postMessage({
                    type: 'linter-rename-node:result',
                    payload: {
                        nodeId: nodeId,
                        oldName: oldName,
                        newName: sceneNode.name,
                        status: 'ok',
                        errorMessage: null
                    }
                });

                log(`✏️ Layer renomeada: "${oldName}" → "${sceneNode.name}"`, 'success');
                figma.notify(`Layer renomeada: ${sceneNode.name}`, { timeout: 2000 });

            } catch (error: any) {
                console.error('[LINTER] Erro ao renomear node:', error);
                figma.ui.postMessage({
                    type: 'linter-rename-node:result',
                    payload: {
                        nodeId: nodeId,
                        newName: newName,
                        status: 'error',
                        errorMessage: error?.message || String(error)
                    }
                });
            }
            break;
        }

        case 'close':
            figma.closePlugin();
            break;
    }
};

sendStoredSettings();
