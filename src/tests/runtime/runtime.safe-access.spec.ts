import { describe, it, expect, beforeEach } from 'vitest';

// Import directly from compat entry to mimic runtime usage
import {
    safeGet,
    safeGetArray,
    safeGetNumber,
    safeGetString,
    safeGetBoolean
} from '../../compat';

describe('Compat Safe Access Helpers', () => {
    beforeEach(() => {
        // Ensure figma sentinel fallback does not break tests
        (globalThis as any).figma = undefined;
    });

    it('navigates nested paths safely', () => {
        const source = { foo: { bar: { baz: 10 } } };
        expect(safeGet(source, 'foo.bar.baz')).toBe(10);
        expect(safeGet(source, 'foo.bar.missing', 'fallback')).toBe('fallback');
    });

    it('returns arrays or default values', () => {
        const source = { list: [1, 2, 3] };
        expect(safeGetArray(source, 'list')).toEqual([1, 2, 3]);
        expect(safeGetArray(source, 'missing')).toEqual([]);
    });

    it('guards number/string/boolean access', () => {
        const source = {
            width: 320,
            title: 'Test',
            enabled: true,
            mixedValue: '__FIGMA_MIXED_SENTINEL__'
        };
        expect(safeGetNumber(source, 'width')).toBe(320);
        expect(safeGetNumber(source, 'missing', 12)).toBe(12);

        expect(safeGetString(source, 'title')).toBe('Test');
        expect(safeGetString(source, 'missing', 'untitled')).toBe('untitled');

        expect(safeGetBoolean(source, 'enabled')).toBe(true);
        expect(safeGetBoolean(source, 'missing', true)).toBe(true);

        // Mixed figures should behave as undefined
        expect(safeGet(source, 'mixedValue')).toBeUndefined();
    });
});
