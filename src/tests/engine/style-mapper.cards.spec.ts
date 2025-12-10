import { describe, it, expect } from 'vitest';
import { generateCardCustomCSSFromNode } from '../../services/heuristics/noai.parser';
import type { SerializedNode } from '../../utils/serialization_utils';

describe('StyleMapper cards', () => {
    const baseCard: SerializedNode = {
        id: 'card-1',
        name: 'Card',
        type: 'FRAME',
        width: 320,
        height: 360,
        fills: [
            {
                type: 'SOLID',
                color: { r: 0.066, g: 0.066, b: 0.066 },
                opacity: 1,
                visible: true
            },
            {
                type: 'GRADIENT_LINEAR',
                visible: true,
                gradientStops: [
                    { color: { r: 0.81, g: 0.62, b: 0.26, a: 0.1 }, position: 0 },
                    { color: { r: 0.81, g: 0.62, b: 0.26, a: 0 }, position: 1 }
                ]
            }
        ],
        strokes: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.05, visible: true }],
        strokeWeight: 1,
        cornerRadius: 24,
        effects: [{
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.3 },
            offset: { x: 0, y: 4 },
            radius: 12,
            spread: 0
        }],
        paddingTop: 40,
        paddingRight: 20,
        paddingBottom: 40,
        paddingLeft: 20,
        itemSpacing: 15,
        children: [],
        visible: true,
        locked: false,
        x: 0,
        y: 0
    } as any;

    it('keeps visual styles without injecting padding/gap into CSS', () => {
        const css = generateCardCustomCSSFromNode(baseCard);
        expect(css).toBeTruthy();
        const safeCss = css || '';
        expect(safeCss).toMatch(/background-color:/);
        expect(safeCss).toMatch(/background-image:/);
        expect(safeCss).toMatch(/rgba\(17/); // solid background present
        expect(safeCss).toMatch(/border: 1px solid/);
        expect(safeCss).toMatch(/border-radius: 24px/);
        expect(safeCss).toMatch(/box-shadow/);
        expect(safeCss).not.toMatch(/padding:/);
        expect(safeCss).not.toMatch(/row-gap|column-gap/);
    });
});
