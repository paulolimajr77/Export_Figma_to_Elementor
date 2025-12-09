/**
 * Figma → Elementor License Module
 * Types and Interfaces for License Management
 * 
 * @version 1.0.0
 * @module licensing/LicenseConfig
 */

// ============================================================
// CONSTANTS
// ============================================================

export const LICENSE_BACKEND_URL = 'https://figmatoelementor.pljr.com.br';
export const LICENSE_ENDPOINT = '/wp-json/figtoel/v1/usage/compile';
export const LICENSE_PLANS_URL = 'https://figmatoelementor.pljr.com.br/planos/';
export const LICENSE_STORAGE_KEY = 'figtoel_license_config_v1';
export const PLUGIN_VERSION = '1.0.0';

// ============================================================
// REQUEST TYPES
// ============================================================

/**
 * Payload enviado ao endpoint de licenciamento
 */
export interface LicenseUsageRequest {
    license_key: string;
    site_domain: string;
    plugin_version?: string;
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
    license_status?: 'cancelled' | 'expired' | 'pending';
    data?: {
        status?: string;
        current_sites?: number;
        limit?: number;
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
    | 'network_error';

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
    pluginVersion: string;
    lastStatus: 'ok' | 'error' | 'limit_reached' | 'not_configured';
    planSlug: string | null;
    usageSnapshot: UsageSnapshot | null;
    lastValidatedAt: string; // ISO datetime
}

// ============================================================
// SERVICE RESULT TYPES
// ============================================================

/**
 * Resultado do check de licença antes da compilação
 */
export interface LicenseCheckResult {
    allowed: boolean;
    status: 'ok' | 'limit_reached' | 'license_error' | 'network_error' | 'not_configured';
    message: string;
    usage?: UsageInfo;
    planSlug?: string | null;
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
    | 'network_error';

// ============================================================
// ERROR MESSAGES (PT-BR)
// ============================================================

export const ERROR_MESSAGES: Record<LicenseErrorCode, string> = {
    license_not_found: 'Não encontramos essa chave de licença. Verifique se digitou corretamente ou adquira um plano.',
    license_inactive: 'Sua licença não está ativa. Regularize seu plano em /planos/.',
    limit_sites_reached: 'Limite máximo de sites atingido para esta licença. Gerencie seus sites na área do cliente.',
    site_register_error: 'Não foi possível registrar este domínio para sua licença. Tente novamente ou contate o suporte.',
    usage_error: 'Erro ao registrar uso da licença. Tente novamente mais tarde ou contate o suporte.',
    missing_params: 'Dados incompletos. Verifique a chave e o domínio.',
    network_error: 'Erro de conexão com o servidor de licenças. Verifique sua internet e tente novamente.'
};

/**
 * Obtém mensagem de erro amigável
 */
export function getErrorMessage(code: LicenseErrorCode): string {
    return ERROR_MESSAGES[code] || 'Erro desconhecido. Contate o suporte.';
}

/**
 * Formata data de reset para exibição
 */
export function formatResetDate(resetsAt: string | number | null): string {
    if (!resetsAt) return 'Indefinido';

    try {
        const date = typeof resetsAt === 'number'
            ? new Date(resetsAt * 1000) // Unix timestamp
            : new Date(resetsAt);

        if (isNaN(date.getTime())) return 'Indefinido';

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return 'Indefinido';
    }
}
