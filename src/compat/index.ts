import { installTrimPolyfill } from './polyfills/trim';
import { installFlatPolyfill } from './polyfills/flat';
import { installPromiseFinallyPolyfill } from './polyfills/promise-finally';
import { installFromEntriesPolyfill } from './polyfills/fromEntries';
import { initializeRuntimeEnvelope, safeInvoke } from './runtime/envelope';
import { safeGet, safeGetArray, safeGetNumber, safeGetString, safeGetBoolean } from './safe-access';
import type { RuntimeEnvelopeOptions, RuntimeHealthReport } from '../types/runtime';

let compatReady = false;
let compatState: RuntimeHealthReport | null = null;

export interface CompatLayerOptions extends RuntimeEnvelopeOptions {}

export function initializeCompatLayer(options?: CompatLayerOptions): RuntimeHealthReport {
    if (compatReady && compatState) {
        return compatState;
    }

    installTrimPolyfill();
    installFlatPolyfill();
    installPromiseFinallyPolyfill();
    installFromEntriesPolyfill();

    compatState = initializeRuntimeEnvelope(options);
    compatReady = true;
    return compatState;
}

export { safeGet, safeGetArray, safeGetNumber, safeGetString, safeGetBoolean, safeInvoke };
