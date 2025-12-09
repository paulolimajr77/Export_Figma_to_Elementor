/**
 * Figma → Elementor License Module
 * Service Layer for License Management
 * 
 * Handles HTTP calls to backend, clientStorage persistence,
 * and pre-compile license validation.
 * 
 * @version 1.1.0
 * @module licensing/LicenseService
 */

import {
    LICENSE_BACKEND_URL,
    LICENSE_ENDPOINT,
    LICENSE_STORAGE_KEY,
    CLIENT_ID_STORAGE_KEY,
    PLUGIN_VERSION,
    LicenseUsageRequest,
    LicenseResponse,
    LicenseSuccessResponse,
    LicenseErrorResponse,
    LicenseStorageConfig,
    LicenseCheckResult,
    UsageSnapshot,
    getErrorMessage,
    maskLicenseKey,
    generateClientId,
    LicenseErrorCode
} from './LicenseConfig';

// ============================================================
// STORAGE HELPERS
// ============================================================

/**
 * Carrega ou gera o client_id único desta instalação
 */
export async function getOrCreateClientId(): Promise<string> {
    try {
        let clientId = await figma.clientStorage.getAsync(CLIENT_ID_STORAGE_KEY);
        if (!clientId) {
            clientId = generateClientId();
            await figma.clientStorage.setAsync(CLIENT_ID_STORAGE_KEY, clientId);
            console.log('[LICENSE] Novo client_id gerado');
        }
        return clientId;
    } catch (e) {
        console.warn('[LICENSE] Erro ao gerenciar client_id:', e);
        return generateClientId(); // Fallback sem persistência
    }
}

/**
 * Carrega configuração de licença do clientStorage
 */
export async function loadLicenseConfig(): Promise<LicenseStorageConfig | null> {
    try {
        const stored = await figma.clientStorage.getAsync(LICENSE_STORAGE_KEY);
        if (!stored) return null;
        return stored as LicenseStorageConfig;
    } catch (e) {
        console.warn('[LICENSE] Erro ao carregar configuração');
        return null;
    }
}

/**
 * Salva configuração de licença no clientStorage
 */
export async function saveLicenseConfig(config: LicenseStorageConfig): Promise<void> {
    try {
        await figma.clientStorage.setAsync(LICENSE_STORAGE_KEY, config);
        console.log('[LICENSE] Configuração salva');
    } catch (e) {
        console.error('[LICENSE] Erro ao salvar configuração');
        throw new Error('Não foi possível salvar a configuração da licença.');
    }
}

/**
 * Limpa configuração de licença do clientStorage
 */
export async function clearLicenseConfig(): Promise<void> {
    try {
        await figma.clientStorage.deleteAsync(LICENSE_STORAGE_KEY);
        console.log('[LICENSE] Configuração removida');
    } catch (e) {
        console.warn('[LICENSE] Erro ao limpar configuração');
    }
}

/**
 * Verifica se a licença está configurada
 */
export async function isLicenseConfigured(): Promise<boolean> {
    const config = await loadLicenseConfig();
    return !!(config && config.licenseKey && config.siteDomain);
}

// ============================================================
// HTTP HELPERS
// ============================================================

/**
 * Faz chamada HTTP ao endpoint de licenciamento
 * ATENÇÃO: Nunca logar license_key completa
 */
async function callLicenseEndpoint(request: LicenseUsageRequest): Promise<LicenseResponse> {
    const url = `${LICENSE_BACKEND_URL}${LICENSE_ENDPOINT}`;

    // Log seguro - chave mascarada
    console.log('[LICENSE] Chamando endpoint:', url);
    console.log('[LICENSE] Payload:', {
        license_key: maskLicenseKey(request.license_key),
        site_domain: request.site_domain,
        figma_user_id: request.figma_user_id ? '***' + request.figma_user_id.slice(-4) : 'N/A',
        client_id: request.client_id ? '***' + request.client_id.slice(-4) : 'N/A'
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `Figma-To-Elementor/${PLUGIN_VERSION}`
            },
            body: JSON.stringify(request)
        });

        const data = await response.json();

        // Log seguro da resposta (sem expor chave completa)
        const safeData = { ...data };
        if (safeData.license_key) {
            safeData.license_key = maskLicenseKey(safeData.license_key);
        }
        console.log('[LICENSE] Resposta:', safeData);

        return data as LicenseResponse;
    } catch (error: any) {
        console.error('[LICENSE] Erro de rede');
        return {
            status: 'error',
            code: 'network_error',
            message: 'Servidor temporariamente indisponível'
        } as LicenseErrorResponse;
    }
}

// ============================================================
// MAIN SERVICE FUNCTIONS
// ============================================================

/**
 * Valida e salva uma nova configuração de licença
 * Usado pela tela de configuração
 * 
 * @param licenseKey - Chave de licença
 * @param siteDomain - Domínio do site WordPress
 * @param figmaUserId - ID do usuário Figma (de figma.currentUser.id)
 */
export async function validateAndSaveLicense(
    licenseKey: string,
    siteDomain: string,
    figmaUserId: string
): Promise<LicenseCheckResult> {

    // Limpar domínio (remover protocolo, trailing slashes)
    const cleanDomain = siteDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .toLowerCase()
        .trim();

    const cleanKey = licenseKey.trim().toUpperCase();

    if (!cleanKey || !cleanDomain) {
        return {
            allowed: false,
            status: 'not_configured',
            message: 'Chave de licença e domínio são obrigatórios.'
        };
    }

    if (!figmaUserId) {
        return {
            allowed: false,
            status: 'license_error',
            message: getErrorMessage('figma_user_required')
        };
    }

    // Obter ou criar client_id
    const clientId = await getOrCreateClientId();

    // Chamar endpoint
    const response = await callLicenseEndpoint({
        license_key: cleanKey,
        site_domain: cleanDomain,
        plugin_version: PLUGIN_VERSION,
        figma_user_id: figmaUserId,
        client_id: clientId
    });

    // Processar resposta
    if (response.status === 'error') {
        const errorResponse = response as LicenseErrorResponse;
        const errorCode = errorResponse.code as LicenseErrorCode;
        const errorMessage = getErrorMessage(errorCode);

        // Determinar status específico
        const lastStatus = errorCode === 'license_user_mismatch'
            ? 'license_user_mismatch'
            : 'error';

        // Salvar status de erro para referência
        const config: LicenseStorageConfig = {
            licenseKey: cleanKey,
            siteDomain: cleanDomain,
            pluginVersion: PLUGIN_VERSION,
            figmaUserIdBound: '',
            clientId: clientId,
            lastStatus: lastStatus,
            planSlug: null,
            usageSnapshot: null,
            lastValidatedAt: new Date().toISOString()
        };
        await saveLicenseConfig(config);

        return {
            allowed: false,
            status: errorCode === 'license_user_mismatch' ? 'license_user_mismatch' : 'license_error',
            message: errorMessage
        };
    }

    const successResponse = response as LicenseSuccessResponse;

    // Verificar se limite foi atingido
    if (successResponse.status === 'limit_reached' || successResponse.usage.status === 'limit_reached') {
        const config: LicenseStorageConfig = {
            licenseKey: cleanKey,
            siteDomain: cleanDomain,
            pluginVersion: PLUGIN_VERSION,
            figmaUserIdBound: figmaUserId,
            clientId: clientId,
            lastStatus: 'limit_reached',
            planSlug: successResponse.plan_slug,
            usageSnapshot: {
                used: successResponse.usage.used,
                limit: successResponse.usage.limit,
                warning: successResponse.usage.warning,
                resetsAt: successResponse.usage.resets_at
            },
            lastValidatedAt: new Date().toISOString()
        };
        await saveLicenseConfig(config);

        return {
            allowed: false,
            status: 'limit_reached',
            message: `Limite mensal atingido (${successResponse.usage.used}/${successResponse.usage.limit} compilações).`,
            usage: successResponse.usage,
            planSlug: successResponse.plan_slug
        };
    }

    // Sucesso!
    const config: LicenseStorageConfig = {
        licenseKey: cleanKey,
        siteDomain: cleanDomain,
        pluginVersion: PLUGIN_VERSION,
        figmaUserIdBound: figmaUserId,
        clientId: clientId,
        lastStatus: 'ok',
        planSlug: successResponse.plan_slug,
        usageSnapshot: {
            used: successResponse.usage.used,
            limit: successResponse.usage.limit,
            warning: successResponse.usage.warning,
            resetsAt: successResponse.usage.resets_at
        },
        lastValidatedAt: new Date().toISOString()
    };
    await saveLicenseConfig(config);

    let message = 'Licença validada com sucesso!';
    if (successResponse.usage.warning === 'soft_limit') {
        message = `Licença válida. Atenção: você já usou ${successResponse.usage.used} de ${successResponse.usage.limit} compilações este mês.`;
    }

    return {
        allowed: true,
        status: 'ok',
        message,
        usage: successResponse.usage,
        planSlug: successResponse.plan_slug
    };
}

/**
 * Verifica e consome uso de licença antes de compilar
 * Esta função DEVE ser chamada antes de qualquer compilação
 * 
 * @param figmaUserId - ID do usuário Figma atual (de figma.currentUser.id)
 * @returns LicenseCheckResult indicando se a compilação pode prosseguir
 */
export async function checkAndConsumeLicenseUsage(figmaUserId: string): Promise<LicenseCheckResult> {
    // 1) Carregar configuração salva
    const config = await loadLicenseConfig();

    if (!config || !config.licenseKey || !config.siteDomain) {
        return {
            allowed: false,
            status: 'not_configured',
            message: 'Licença não configurada. Configure sua chave de licença na aba "Licença".'
        };
    }

    // 2) Verificar figma_user_id
    if (!figmaUserId) {
        return {
            allowed: false,
            status: 'license_error',
            message: getErrorMessage('figma_user_required')
        };
    }

    // 3) Obter client_id
    const clientId = config.clientId || await getOrCreateClientId();

    // 4) Chamar endpoint para validar e registrar uso
    const response = await callLicenseEndpoint({
        license_key: config.licenseKey,
        site_domain: config.siteDomain,
        plugin_version: PLUGIN_VERSION,
        figma_user_id: figmaUserId,
        client_id: clientId
    });

    // 5) Processar resposta
    if (response.status === 'error') {
        const errorResponse = response as LicenseErrorResponse;
        const errorCode = errorResponse.code as LicenseErrorCode;
        const errorMessage = getErrorMessage(errorCode);

        // Atualizar status local
        config.lastStatus = errorCode === 'license_user_mismatch' ? 'license_user_mismatch' : 'error';
        config.lastValidatedAt = new Date().toISOString();
        await saveLicenseConfig(config);

        // Retornar status específico para user mismatch
        if (errorCode === 'license_user_mismatch') {
            return {
                allowed: false,
                status: 'license_user_mismatch',
                message: errorMessage
            };
        }

        // Network error: bloquear por segurança
        if (errorCode === 'network_error') {
            return {
                allowed: false,
                status: 'network_error',
                message: errorMessage
            };
        }

        return {
            allowed: false,
            status: 'license_error',
            message: errorMessage
        };
    }

    const successResponse = response as LicenseSuccessResponse;

    // Atualizar snapshot local
    config.lastStatus = successResponse.status === 'limit_reached' ? 'limit_reached' : 'ok';
    config.planSlug = successResponse.plan_slug;
    config.figmaUserIdBound = figmaUserId; // Confirmar vínculo
    config.usageSnapshot = {
        used: successResponse.usage.used,
        limit: successResponse.usage.limit,
        warning: successResponse.usage.warning,
        resetsAt: successResponse.usage.resets_at
    };
    config.lastValidatedAt = new Date().toISOString();
    await saveLicenseConfig(config);

    // 6) Verificar limite
    if (successResponse.status === 'limit_reached' || successResponse.usage.status === 'limit_reached') {
        return {
            allowed: false,
            status: 'limit_reached',
            message: `Limite mensal de compilações atingido (${successResponse.usage.used}/${successResponse.usage.limit}). Renova em breve.`,
            usage: successResponse.usage,
            planSlug: successResponse.plan_slug
        };
    }

    // 7) Sucesso (pode compilar)
    let message = `Compilação autorizada (${successResponse.usage.used}/${successResponse.usage.limit} este mês).`;

    return {
        allowed: true,
        status: 'ok',
        message,
        usage: successResponse.usage,
        planSlug: successResponse.plan_slug
    };
}

/**
 * Obtém informações de licença para exibição na UI
 * Usa dados em cache quando disponíveis
 */
export async function getLicenseDisplayInfo(): Promise<{
    configured: boolean;
    licenseKey: string;       // Retorna mascarada
    licenseKeyMasked: string; // Versão mascarada para exibição
    siteDomain: string;
    planSlug: string | null;
    usage: UsageSnapshot | null;
    status: string;
    lastValidated: string | null;
    figmaUserIdBound: string;
}> {
    const config = await loadLicenseConfig();

    if (!config) {
        return {
            configured: false,
            licenseKey: '',
            licenseKeyMasked: '',
            siteDomain: '',
            planSlug: null,
            usage: null,
            status: 'not_configured',
            lastValidated: null,
            figmaUserIdBound: ''
        };
    }

    return {
        configured: true,
        licenseKey: config.licenseKey,
        licenseKeyMasked: maskLicenseKey(config.licenseKey),
        siteDomain: config.siteDomain,
        planSlug: config.planSlug,
        usage: config.usageSnapshot,
        status: config.lastStatus,
        lastValidated: config.lastValidatedAt,
        figmaUserIdBound: config.figmaUserIdBound || ''
    };
}
