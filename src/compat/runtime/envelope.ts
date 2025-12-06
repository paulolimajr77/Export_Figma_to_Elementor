import type { RuntimeEnvelopeOptions, RuntimeHealthReport } from '../../types/runtime';
import { safeGet } from '../safe-access';

let initialized = false;
let cachedHealth: RuntimeHealthReport = { runtime: 'ok', timestamp: Date.now() };
let runtimeLogger: ((event: string, payload?: any) => void) | undefined;

export function initializeRuntimeEnvelope(options?: RuntimeEnvelopeOptions): RuntimeHealthReport {
    if (initialized) {
        return cachedHealth;
    }
    initialized = true;
    runtimeLogger = options?.logger;
    cachedHealth = buildHealthReport();

    if (options?.onHealthChange) {
        safeInvoke(() => options.onHealthChange!(cachedHealth));
    }

    return cachedHealth;
}

function buildHealthReport(): RuntimeHealthReport {
    const warnings: string[] = [];

    if (typeof String.prototype.trim !== 'function') warnings.push('string.trim');
    if (typeof Array.prototype.flat !== 'function') warnings.push('array.flat');
    if (typeof Promise.prototype.finally !== 'function') warnings.push('promise.finally');
    if (typeof Object.fromEntries !== 'function') warnings.push('object.fromEntries');

    return {
        runtime: warnings.length > 0 ? 'warn' : 'ok',
        warnings,
        timestamp: Date.now()
    };
}

export function safeInvoke<T>(fn: () => T, fallback?: T): T | undefined {
    try {
        return fn();
    } catch (error: any) {
        if (runtimeLogger) {
            try {
                runtimeLogger('runtime.error', {
                    message: safeGet(error, 'message') || String(error)
                });
            } catch {
                // Swallow logging errors silently
            }
        }
        return fallback;
    }
}
