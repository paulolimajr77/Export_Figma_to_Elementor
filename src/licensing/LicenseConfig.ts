/**
 * Figma → Elementor License Module
 * Types and Interfaces for License Management
 * 
 * @version 1.2.0
 * @module licensing/LicenseConfig
 */

// ============================================================
// CONSTANTS
// ============================================================

export const LICENSE_BACKEND_URL = 'https://figmatoelementor.pljr.com.br';
export const LICENSE_VALIDATE_ENDPOINT = '/wp-json/figtoel/v1/license/validate';
export const LICENSE_COMPILE_ENDPOINT = '/wp-json/figtoel/v1/usage/compile';
export const LICENSE_PLANS_URL = 'https://figmatoelementor.pljr.com.br/planos/';
export const LICENSE_STORAGE_KEY = 'figtoel_license_state';
export const CLIENT_ID_STORAGE_KEY = 'figtoel_client_id_v1';
export const PLUGIN_VERSION = '1.2.0';

// ============================================================
// PLAN LABEL MAPPING
// ============================================================

export const PLAN_LABELS: Record<string, string> = {
    'mensal': 'Assinatura Mensal',
    'anual': 'Assinatura Anual',
    'lifetime': 'Licença Vitalícia',
    'trial': 'Período de Teste',
    'free': 'Plano Gratuito'
};

/**
 * Obtém label amigável do plano
 */
export function getPlanLabel(planSlug: string | null): string {
    if (!planSlug) return 'Indefinido';
    return PLAN_LABELS[planSlug.toLowerCase()] || planSlug;
}

// ============================================================
// REQUEST TYPES
// ============================================================

/**
 * Payload enviado aos endpoints de licenciamento
 */
export interface LicenseRequestPayload {
    license_key: string;
    site_domain: string;
    plugin_version?: string;
    figma_user_id?: string;
    client_id?: string;
}

// ============================================================
// RESPONSE TYPES
// ============================================================

/**
 * Informações de uso mensal
 */
export interface UsageInfo {
    status: 'ok' | 'limit_reached';
    used: number;
    limit: number;
    warning: 'soft_limit' | null;
    resets_at: string | number | null;
}

/**
 * Resposta de sucesso do endpoint
 */
export interface LicenseSuccessResponse {
    status: 'ok' | 'limit_reached';
    license_status: 'active';
    license_key: string;
    plan_slug: string | null;
    site_domain: string;
    usage: UsageInfo;
}

/**
 * Resposta de erro do endpoint
 */
export interface LicenseErrorResponse {
    status: 'error';
    code: LicenseErrorCode;
    message?: string;
    license_status?: 'cancelled' | 'expired' | 'pending' | 'on-hold';
    data?: {
        status?: string;
        current_sites?: number;
        limit?: number;
        figma_user_id_primary?: string;
        figma_user_id_request?: string;
    };
}

/**
 * Códigos de erro possíveis
 */
export type LicenseErrorCode =
    | 'license_not_found'
    | 'license_inactive'
    | 'limit_sites_reached'
    | 'site_register_error'
    | 'usage_error'
    | 'missing_params'
    | 'network_error'
    | 'license_user_mismatch'
    | 'figma_user_required';

/**
 * União de todos os tipos de resposta
 */
export type LicenseResponse = LicenseSuccessResponse | LicenseErrorResponse;

// ============================================================
// STORAGE TYPES
// ============================================================

/**
 * Snapshot de uso para armazenamento local
 */
export interface UsageSnapshot {
    used: number;
    limit: number;
    warning: 'soft_limit' | null;
    resetsAt: string | number | null;
}

/**
 * Configuração de licença armazenada localmente
 */
export interface LicenseStorageConfig {
    licenseKey: string;
    siteDomain: string;
    clientId: string;
    lastUsage: UsageSnapshot | null;
    lastValidationAt: string;  // ISO datetime
    planSlug: string | null;
    figmaUserIdBound: string;
    lastStatus: 'ok' | 'error' | 'limit_reached' | 'not_configured' | 'license_user_mismatch';
}

// ============================================================
// SERVICE RESULT TYPES
// ============================================================

/**
 * Resultado do check de licença
 */
export interface LicenseCheckResult {
    allowed: boolean;
    status: 'ok' | 'limit_reached' | 'license_error' | 'network_error' | 'not_configured' | 'license_user_mismatch';
    message: string;
    usage?: UsageInfo;
    planSlug?: string | null;
    planLabel?: string;
}

/**
 * Estado da licença para exibição na UI
 */
export type LicenseDisplayState =
    | 'not_configured'
    | 'validating'
    | 'active'
    | 'soft_limit'
    | 'limit_reached'
    | 'invalid'
    | 'network_error'
    | 'user_mismatch';

// ============================================================
// ERROR MESSAGES (PT-BR)
// ============================================================

export const ERROR_MESSAGES: Record<LicenseErrorCode, string> = {
    license_not_found: 'Chave de licença não encontrada. Verifique se digitou corretamente.',
    license_inactive: 'Sua licença não está ativa. Regularize seu plano.',
    limit_sites_reached: 'Número máximo de domínios atingido para esta licença.',
    site_register_error: 'Não foi possível vincular este domínio à sua licença.',
    usage_error: 'Erro ao registrar uso. Tente novamente.',
    missing_params: 'Chave de licença e domínio são obrigatórios.',
    network_error: 'Servidor temporariamente indisponível. Verifique sua conexão.',
    license_user_mismatch: 'Esta licença já está vinculada a outra conta Figma.',
    figma_user_required: 'Não foi possível identificar sua conta Figma. Reabra o plugin.'
};

/**
 * Obtém mensagem de erro amigável
 */
export function getErrorMessage(code: LicenseErrorCode): string {
    return ERROR_MESSAGES[code] || 'Erro inesperado. Contate o suporte.';
}

/**
 * Mascara a chave de licença para exibição segura
 * Exemplo: FTEL-5GKGTD5HOEZS → **********HOEZS
 */
export function maskLicenseKey(key: string): string {
    if (!key || key.length < 5) return '****';
    const suffix = key.substring(key.length - 5);
    return `**********${suffix}`;
}

/**
 * Formata data para exibição baseada no locale do usuário
 * Detecta automaticamente o idioma do navegador/sistema
 * 
 * @param resetsAt - Data em formato MySQL, ISO ou timestamp
 * @param userLocale - Locale opcional (se não fornecido, usa navigator.language)
 */
export function formatResetDate(resetsAt: string | number | null, userLocale?: string): string {
    if (!resetsAt) return 'Indefinido';

    try {
        let date: Date;

        if (typeof resetsAt === 'number') {
            // Verificar se é timestamp em segundos ou milissegundos
            if (resetsAt < 10000000000) {
                // Segundos (Unix timestamp)
                date = new Date(resetsAt * 1000);
            } else {
                // Milissegundos
                date = new Date(resetsAt);
            }
        } else if (typeof resetsAt === 'string') {
            // Tentar parse numérico primeiro
            const numValue = Number(resetsAt);
            if (!isNaN(numValue) && numValue > 0) {
                if (numValue < 10000000000) {
                    date = new Date(numValue * 1000);
                } else {
                    date = new Date(numValue);
                }
            } else {
                // MySQL datetime format: "2025-12-31 23:59:59"
                if (resetsAt.includes(' ') && !resetsAt.includes('T')) {
                    date = new Date(resetsAt.replace(' ', 'T'));
                } else {
                    date = new Date(resetsAt);
                }
            }
        } else {
            return 'Indefinido';
        }

        if (isNaN(date.getTime())) return 'Indefinido';

        // Usar locale do usuário (navegador) ou fallback para pt-BR
        const locale = userLocale || (typeof navigator !== 'undefined' ? navigator.language : 'pt-BR');

        return date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return 'Indefinido';
    }
}

/**
 * Gera um UUID v4 para client_id
 */
export function generateClientId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Normaliza domínio removendo protocolo, www e barras
 */
export function normalizeDomain(input: string): string {
    if (!input) return '';
    return input
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/+$/, '')
        .replace(/\s+/g, '');
}
