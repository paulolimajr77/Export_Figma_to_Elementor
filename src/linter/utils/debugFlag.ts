/**
 * LINTER_DEBUG:
 * - false (padrão): sem logs extras nem internal_debug no report (modo produção).
 * - true (apenas dev): habilita logs e metadata interna para calibrar heurísticas.
 *   Ativar via globalThis.LINTER_DEBUG = true ou env LINTER_DEBUG=true antes de rodar.
 */
const detectDebugFlag = (): boolean => {
    try {
        const globalDebug = (globalThis as any)?.LINTER_DEBUG;
        if (globalDebug !== undefined) {
            return Boolean(globalDebug);
        }
        // eslint-disable-next-line no-undef
        if (typeof process !== 'undefined' && process.env && process.env.LINTER_DEBUG) {
            // eslint-disable-next-line no-undef
            return process.env.LINTER_DEBUG === '1' || process.env.LINTER_DEBUG === 'true';
        }
    } catch {
        // Ignora falhas silenciosamente para evitar quebrar o plugin
    }
    return false;
};

export const LINTER_DEBUG = detectDebugFlag();
