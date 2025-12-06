import { isFigmaMixedValue } from '../types/runtime';

type PathSegment = string | number;

const pathCache = new Map<string, PathSegment[]>();

function toSegments(path: string | PathSegment[]): PathSegment[] {
    if (Array.isArray(path)) {
        return path;
    }
    if (pathCache.has(path)) {
        return pathCache.get(path)!;
    }
    const segments: PathSegment[] = [];
    path.split('.').forEach(part => {
        if (!part) return;
        const bracketMatches = part.match(/([^\[\]]+)|\[(\d+)\]/g);
        if (!bracketMatches) {
            segments.push(part);
            return;
        }
        bracketMatches.forEach(segment => {
            if (!segment) return;
            if (segment.startsWith('[') && segment.endsWith(']')) {
                const index = parseInt(segment.slice(1, -1), 10);
                segments.push(isNaN(index) ? segment : index);
            } else {
                segments.push(segment);
            }
        });
    });
    pathCache.set(path, segments);
    return segments;
}

export function safeGet<T = any>(source: any, path?: string | PathSegment[], defaultValue?: T): T | undefined {
    if (path === undefined || path === null || path === '') {
        return source === undefined ? defaultValue : source;
    }

    const segments = toSegments(path);
    let current = source;

    for (const segment of segments) {
        if (current === null || current === undefined) {
            return defaultValue;
        }
        try {
            current = (current as any)[segment as keyof typeof current];
        } catch {
            return defaultValue;
        }
        if (isFigmaMixedValue(current)) {
            return defaultValue;
        }
    }

    if (current === undefined) {
        return defaultValue;
    }

    return current as T;
}

export function safeGetArray<T = any>(source: any, path?: string | PathSegment[], defaultValue: T[] = []): T[] {
    const value = safeGet<T[]>(source, path);
    return Array.isArray(value) ? value : defaultValue;
}

export function safeGetNumber(source: any, path?: string | PathSegment[], defaultValue: number = 0): number {
    const value = safeGet(source, path);
    return typeof value === 'number' && !Number.isNaN(value) ? value : defaultValue;
}

export function safeGetString(source: any, path?: string | PathSegment[], defaultValue: string = ''): string {
    const value = safeGet(source, path);
    return typeof value === 'string' ? value : defaultValue;
}

export function safeGetBoolean(source: any, path?: string | PathSegment[], defaultValue: boolean = false): boolean {
    const value = safeGet(source, path);
    return typeof value === 'boolean' ? value : defaultValue;
}
