/**
 * Figma → Elementor License Module
 * Service Layer for License Management
 * 
 * Handles HTTP calls to backend, clientStorage persistence,
 * and pre-compile license validation.
 * 
 * @version 1.2.0
 * @module licensing/LicenseService
 */

import {
    LICENSE_BACKEND_URL,
    LICENSE_VALIDATE_ENDPOINT,
    LICENSE_ACTIVATE_ENDPOINT,
    LICENSE_COMPILE_ENDPOINT,
    LICENSE_STORAGE_KEY,
    CLIENT_ID_STORAGE_KEY,
    DEVICE_ID_STORAGE_KEY,
    PLUGIN_VERSION,
    LicenseRequestPayload,
    LicenseResponse,
    LicenseSuccessResponse,
    LicenseErrorResponse,
    LicenseStorageConfig,
    LicenseCheckResult,
    UsageSnapshot,
    getErrorMessage,
    getPlanLabel,
    maskLicenseKey,
    normalizeDomain,
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
        console.warn('[LICENSE] Erro ao gerenciar client_id');
        return generateClientId();
    }
}

/**
 * Carrega ou gera o device_id único desta máquina
 * Persiste no clientStorage para identificar o dispositivo
 */
export async function getOrCreateDeviceId(): Promise<string> {
    try {
        let deviceId = await figma.clientStorage.getAsync(DEVICE_ID_STORAGE_KEY);
        if (!deviceId) {
            deviceId = generateClientId(); // Usa o mesmo gerador UUID
            await figma.clientStorage.setAsync(DEVICE_ID_STORAGE_KEY, deviceId);
            console.log('[LICENSE] Novo device_id gerado');
        }
        return deviceId;
    } catch (e) {
        console.warn('[LICENSE] Erro ao gerenciar device_id');
        return generateClientId();
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
 * Faz chamada HTTP ao endpoint especificado
 * ATENÇÃO: Nunca logar license_key completa
 */
async function callLicenseEndpoint(
    endpoint: string,
    request: LicenseRequestPayload
): Promise<LicenseResponse> {
    const url = `${LICENSE_BACKEND_URL}${endpoint}`;

    // Log seguro - chave mascarada
    console.log('[LICENSE] Endpoint:', endpoint);
    console.log('[LICENSE] Payload:', {
        license_key: maskLicenseKey(request.license_key),
        site_domain: request.site_domain,
        figma_user_id: request.figma_user_id ? '***' + request.figma_user_id.slice(-4) : 'N/A'
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

        // Tentar parsear JSON
        let data: any;
        try {
            data = await response.json();
        } catch (e) {
            console.error('[LICENSE] Resposta inválida (não JSON):', response.status);
            return {
                status: 'error',
                code: 'network_error',
                message: `Erro no servidor (${response.status}). JSON inválido.`
            } as LicenseErrorResponse;
        }

        // Log seguro da resposta
        const safeData = { ...data };
        if (safeData.license_key) {
            safeData.license_key = maskLicenseKey(safeData.license_key);
        }
        console.log('[LICENSE] Resposta:', safeData);

        // Verificar erros HTTP (404, 500, etc) que retornam JSON de erro do WP
        if (!response.ok) {
            // Se for erro de rota não encontrada (404)
            if (data.code === 'rest_no_route') {
                return {
                    status: 'error',
                    code: 'network_error',
                    message: 'API de licenciamento não encontrada. Verifique se o plugin está atualizado no servidor.'
                } as LicenseErrorResponse;
            }

            // Outros erros
            return {
                status: 'error',
                code: 'network_error',
                message: data.message || `Erro no servidor (${response.status})`
            } as LicenseErrorResponse;
        }

        return data as LicenseResponse;
    } catch (error: any) {
        console.error('[LICENSE] Erro de rede:', error);
        return {
            status: 'error',
            code: 'network_error',
            message: 'Falha na conexão. Verifique sua internet.'
        } as LicenseErrorResponse;
    }
}

// ============================================================
// MAIN SERVICE FUNCTIONS
// ============================================================

/**
 * Valida licença SEM consumir uso mensal
 * Usado na tela de configuração e ao abrir o plugin
 * 
 * @param licenseKey - Chave de licença
 * @param siteDomain - Domínio do site WordPress
 * @param figmaUserId - ID do usuário Figma (de figma.currentUser.id)
 */
export async function validateLicense(
    licenseKey: string,
    siteDomain: string,
    figmaUserId?: string
): Promise<LicenseCheckResult> {

    const cleanDomain = normalizeDomain(siteDomain);
    const cleanKey = licenseKey.trim().toUpperCase();

    if (!cleanKey || !cleanDomain) {
        return {
            allowed: false,
            status: 'not_configured',
            message: 'Chave de licença e domínio são obrigatórios.'
        };
    }

    // Obter ou criar client_id e device_id
    const clientId = await getOrCreateClientId();
    const deviceId = await getOrCreateDeviceId();

    // Chamar endpoint de VALIDAÇÃO (não consome uso)
    const response = await callLicenseEndpoint(LICENSE_VALIDATE_ENDPOINT, {
        license_key: cleanKey,
        site_domain: cleanDomain,
        plugin_version: PLUGIN_VERSION,
        figma_user_id: figmaUserId || '',
        device_id: deviceId,
        client_id: clientId
    });

    // Processar resposta
    if (response.status === 'error') {
        const errorResponse = response as LicenseErrorResponse;
        const errorCode = errorResponse.code as LicenseErrorCode;
        const errorMessage = getErrorMessage(errorCode);

        const lastStatus = errorCode === 'license_user_mismatch'
            ? 'license_user_mismatch'
            : 'error';

        // Salvar status de erro
        const config: LicenseStorageConfig = {
            licenseKey: cleanKey,
            siteDomain: cleanDomain,
            clientId: clientId,
            deviceId: deviceId,
            lastUsage: null,
            lastValidationAt: new Date().toISOString(),
            planSlug: null,
            figmaUserIdBound: figmaUserId || '',
            deviceIdBound: deviceId,
            lastStatus: lastStatus
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
            clientId: clientId,
            deviceId: deviceId,
            lastUsage: {
                used: successResponse.usage.used,
                limit: successResponse.usage.limit,
                warning: successResponse.usage.warning,
                resetsAt: successResponse.usage.resets_at
            },
            lastValidationAt: new Date().toISOString(),
            planSlug: successResponse.plan_slug,
            figmaUserIdBound: figmaUserId || '',
            deviceIdBound: deviceId,
            lastStatus: 'limit_reached'
        };
        await saveLicenseConfig(config);

        return {
            allowed: false,
            status: 'limit_reached',
            message: `Limite mensal atingido (${successResponse.usage.used}/${successResponse.usage.limit}).`,
            usage: successResponse.usage,
            planSlug: successResponse.plan_slug,
            planLabel: getPlanLabel(successResponse.plan_slug)
        };
    }

    // Sucesso!
    const config: LicenseStorageConfig = {
        licenseKey: cleanKey,
        siteDomain: cleanDomain,
        clientId: clientId,
        deviceId: deviceId,
        lastUsage: {
            used: successResponse.usage.used,
            limit: successResponse.usage.limit,
            warning: successResponse.usage.warning,
            resetsAt: successResponse.usage.resets_at
        },
        lastValidationAt: new Date().toISOString(),
        planSlug: successResponse.plan_slug,
        figmaUserIdBound: figmaUserId || '',
        deviceIdBound: deviceId,
        lastStatus: 'ok'
    };
    await saveLicenseConfig(config);

    let message = 'Licença validada com sucesso!';
    if (successResponse.usage.warning === 'soft_limit') {
        message = `Licença válida. Atenção: ${successResponse.usage.used}/${successResponse.usage.limit} compilações usadas.`;
    }

    return {
        allowed: true,
        status: 'ok',
        message,
        usage: successResponse.usage,
        planSlug: successResponse.plan_slug,
        planLabel: getPlanLabel(successResponse.plan_slug)
    };
}

/**
 * Registra uma compilação, CONSUMINDO 1 uso mensal
 * Esta função DEVE ser chamada antes de cada compilação
 * 
 * @param figmaUserId - ID do usuário Figma atual
 * @returns LicenseCheckResult indicando se a compilação pode prosseguir
 */
export async function registerCompileUsage(figmaUserId?: string): Promise<LicenseCheckResult> {
    // 1) Carregar configuração salva
    const config = await loadLicenseConfig();

    if (!config || !config.licenseKey || !config.siteDomain) {
        return {
            allowed: false,
            status: 'not_configured',
            message: 'Configure sua licença na aba "Licença" antes de compilar.'
        };
    }

    // 2) Obter client_id e device_id
    const clientId = config.clientId || await getOrCreateClientId();
    const deviceId = config.deviceId || await getOrCreateDeviceId();

    // 3) Chamar endpoint de COMPILAÇÃO (consome 1 uso)
    const response = await callLicenseEndpoint(LICENSE_COMPILE_ENDPOINT, {
        license_key: config.licenseKey,
        site_domain: config.siteDomain,
        plugin_version: PLUGIN_VERSION,
        figma_user_id: figmaUserId || '',
        device_id: deviceId,
        client_id: clientId
    });

    // 4) Processar resposta
    if (response.status === 'error') {
        const errorResponse = response as LicenseErrorResponse;
        const errorCode = errorResponse.code as LicenseErrorCode;
        const errorMessage = getErrorMessage(errorCode);

        config.lastStatus = errorCode === 'license_user_mismatch' ? 'license_user_mismatch' : 'error';
        config.lastValidationAt = new Date().toISOString();
        await saveLicenseConfig(config);

        if (errorCode === 'license_user_mismatch') {
            return {
                allowed: false,
                status: 'license_user_mismatch',
                message: errorMessage
            };
        }

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
    config.lastUsage = {
        used: successResponse.usage.used,
        limit: successResponse.usage.limit,
        warning: successResponse.usage.warning,
        resetsAt: successResponse.usage.resets_at
    };
    config.lastValidationAt = new Date().toISOString();
    await saveLicenseConfig(config);

    // 5) Verificar limite
    if (successResponse.status === 'limit_reached' || successResponse.usage.status === 'limit_reached') {
        return {
            allowed: false,
            status: 'limit_reached',
            message: `Você atingiu o limite de ${successResponse.usage.limit} compilações mensais.`,
            usage: successResponse.usage,
            planSlug: successResponse.plan_slug,
            planLabel: getPlanLabel(successResponse.plan_slug)
        };
    }

    // 6) Sucesso (pode compilar)
    return {
        allowed: true,
        status: 'ok',
        message: `Compilação autorizada (${successResponse.usage.used}/${successResponse.usage.limit}).`,
        usage: successResponse.usage,
        planSlug: successResponse.plan_slug,
        planLabel: getPlanLabel(successResponse.plan_slug)
    };
}

/**
 * Obtém informações de licença para exibição na UI
 * Usa dados em cache quando disponíveis
 */
export async function getLicenseDisplayInfo(): Promise<{
    configured: boolean;
    licenseKey: string;
    licenseKeyMasked: string;
    siteDomain: string;
    planSlug: string | null;
    planLabel: string;
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
            planLabel: 'Indefinido',
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
        planLabel: getPlanLabel(config.planSlug),
        usage: config.lastUsage,
        status: config.lastStatus,
        lastValidated: config.lastValidationAt,
        figmaUserIdBound: config.figmaUserIdBound || ''
    };
}

// ============================================================
// LEGACY COMPATIBILITY
// ============================================================

/**
 * Alias para registerCompileUsage (compatibilidade com código existente)
 */
export async function checkAndConsumeLicenseUsage(figmaUserId?: string): Promise<LicenseCheckResult> {
    return registerCompileUsage(figmaUserId);
}

/**
 * Alias para validateLicense (compatibilidade com código existente)
 */
export async function validateAndSaveLicense(
    licenseKey: string,
    siteDomain: string,
    figmaUserId?: string
): Promise<LicenseCheckResult> {
    return validateLicense(licenseKey, siteDomain, figmaUserId);
}
