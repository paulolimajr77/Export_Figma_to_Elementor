export type RuntimeHealthLevel = 'ok' | 'warn' | 'error';

export interface RuntimeHealthReport {
    runtime: RuntimeHealthLevel;
    warnings?: string[];
    errors?: string[];
    timestamp: number;
}

export interface RuntimeEnvelopeOptions {
    logger?: (event: string, payload?: any) => void;
    onHealthChange?: (report: RuntimeHealthReport) => void;
}

const globalScope = typeof globalThis !== 'undefined' ? globalThis : ({} as typeof globalThis);
const runtimeFigma: any = (globalScope as any).figma;

export const FIGMA_MIXED_SENTINEL = runtimeFigma && runtimeFigma.mixed ? runtimeFigma.mixed : '__FIGMA_MIXED_SENTINEL__';

export function isFigmaMixedValue(value: any): boolean {
    if (runtimeFigma && runtimeFigma.mixed) {
        return value === runtimeFigma.mixed;
    }
    return value === FIGMA_MIXED_SENTINEL;
}
