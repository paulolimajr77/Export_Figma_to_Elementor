import { describe, it, expect } from 'vitest';
import { compileWithRegistry } from '../../config/widget.registry';
import type { ElementorSettings } from '../../types/elementor.types';

describe('icon-box padding mapping', () => {
    it('maps padding to box_padding/_box_padding for icon-box', () => {
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
        const padding = result?.settings?.box_padding as any;
        expect(padding?.top).toBe(40);
        expect(padding?.right).toBe(20);
        expect(padding?.bottom).toBe(40);
        expect(padding?.left).toBe(20);
        expect((result?.settings as any)._box_padding?.top).toBe(40);
    });
});
