import { describe, it, expect } from 'vitest';
import { compileWithRegistry } from '../../config/widget.registry';
import type { ElementorSettings } from '../../types/elementor.types';

describe('icon-box padding mapping', () => {
    it('maps padding to _padding (aba Avançado) for icon-box with STRING values', () => {
        const widget = {
            type: 'icon_box',
            content: 'Title',
            imageId: null,
            styles: {
                paddingTop: 40,
                paddingRight: 20,
                paddingBottom: 40,
                paddingLeft: 20
            }
        } as any;

        const base: ElementorSettings = {};
        const result = compileWithRegistry(widget as any, base);
        expect(result?.widgetType).toBe('icon-box');

        // _padding deve ter valores STRING (formato Elementor Dimensions)
        const padding = (result?.settings as any)?._padding;
        expect(padding).toBeDefined();
        expect(padding?.unit).toBe('px');
        expect(padding?.top).toBe('40');  // STRING, não número
        expect(padding?.right).toBe('20');
        expect(padding?.bottom).toBe('40');
        expect(padding?.left).toBe('20');
        expect(padding?.isLinked).toBe(false); // top/bottom != right/left
    });

    it('sets isLinked=true when all padding values are equal', () => {
        const widget = {
            type: 'icon_box',
            content: 'Title',
            imageId: null,
            styles: {
                paddingTop: 20,
                paddingRight: 20,
                paddingBottom: 20,
                paddingLeft: 20
            }
        } as any;

        const base: ElementorSettings = {};
        const result = compileWithRegistry(widget as any, base);
        const padding = (result?.settings as any)?._padding;
        expect(padding?.isLinked).toBe(true);
    });
});
