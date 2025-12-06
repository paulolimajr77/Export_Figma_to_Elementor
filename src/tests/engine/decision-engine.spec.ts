import { describe, it, expect } from 'vitest';
import { evaluateHeuristics } from '../../engine/heuristic-registry';
import { NodeFeatures } from '../../engine/types';

describe('WidgetEngine Heuristics', function () {
    it('deve identificar um botão simples com score razoável', function () {
        var features: NodeFeatures = {
            id: '1',
            name: 'Button Test',
            type: 'RECTANGLE',
            width: 200,
            height: 48,
            x: 0,
            y: 100,
            area: 200 * 48,
            childCount: 0,
            layoutMode: 'NONE',
            primaryAxisSizingMode: 'FIXED',
            counterAxisSizingMode: 'FIXED',
            hasNestedFrames: false,
            hasFill: true,
            hasStroke: false,
            hasText: true,
            textCount: 1,
            hasImage: false,
            imageCount: 0,
            textLength: 15,
            fontSize: 14,
            fontWeight: 600,
            isVectorNode: false,
            vectorWidth: 0,
            vectorHeight: 0,
            parentLayoutMode: 'NONE',
            siblingCount: 0,
            aspectRatio: 200 / 48,
            zone: 'HERO'
        };

        var candidates = evaluateHeuristics(features);

        expect(candidates.length).toBeGreaterThan(0);
        expect(candidates[0].widget).toBe('w:button');
        expect(candidates[0].score).toBeGreaterThan(0.5);
    });

    it('não deve forçar botão quando o score é baixo', function () {
        var features: NodeFeatures = {
            id: '2',
            name: 'Random Rect',
            type: 'RECTANGLE',
            width: 50,
            height: 50,
            x: 0,
            y: 1500,
            area: 50 * 50,
            childCount: 0,
            layoutMode: 'NONE',
            primaryAxisSizingMode: 'FIXED',
            counterAxisSizingMode: 'FIXED',
            hasNestedFrames: false,
            hasFill: true,
            hasStroke: false,
            hasText: false,
            textCount: 0,
            hasImage: false,
            imageCount: 0,
            textLength: 0,
            fontSize: 0,
            fontWeight: 400,
            isVectorNode: false,
            vectorWidth: 0,
            vectorHeight: 0,
            parentLayoutMode: 'NONE',
            siblingCount: 0,
            aspectRatio: 1,
            zone: 'BODY'
        };

        var candidates = evaluateHeuristics(features);

        // Should return container as fallback (low score)
        if (candidates.length > 0) {
            expect(candidates[0].score).toBeLessThan(0.6);
        }
    });

    it('deve identificar um container grande como container, não button', function () {
        var features: NodeFeatures = {
            id: '3',
            name: 'w:inner-container',
            type: 'FRAME',
            width: 1016,
            height: 784,
            x: 0,
            y: 0,
            area: 1016 * 784,
            childCount: 5,
            layoutMode: 'HORIZONTAL',
            primaryAxisSizingMode: 'AUTO',
            counterAxisSizingMode: 'FIXED',
            hasNestedFrames: true,
            hasFill: true,
            hasStroke: false,
            hasText: true,
            textCount: 4,
            hasImage: true,
            imageCount: 1,
            textLength: 250,
            fontSize: 42,
            fontWeight: 700,
            isVectorNode: false,
            vectorWidth: 0,
            vectorHeight: 0,
            parentLayoutMode: 'NONE',
            siblingCount: 0,
            aspectRatio: 1016 / 784,
            zone: 'HERO'
        };

        var candidates = evaluateHeuristics(features);

        expect(candidates.length).toBeGreaterThan(0);
        // Should NOT be button
        var buttonCandidate = candidates.find(function (c) { return c.widget === 'w:button'; });
        if (buttonCandidate) {
            expect(buttonCandidate.score).toBeLessThan(0.7);
        }
    });

    it('deve identificar um heading grande corretamente', function () {
        var features: NodeFeatures = {
            id: '4',
            name: 'Hero Title',
            type: 'TEXT',
            width: 400,
            height: 60,
            x: 0,
            y: 150,
            area: 400 * 60,
            childCount: 0,
            layoutMode: 'NONE',
            primaryAxisSizingMode: undefined,
            counterAxisSizingMode: undefined,
            hasNestedFrames: false,
            hasFill: false,
            hasStroke: false,
            hasText: true,
            textCount: 1,
            hasImage: false,
            imageCount: 0,
            textLength: 35,
            fontSize: 42,
            fontWeight: 700,
            isVectorNode: false,
            vectorWidth: 0,
            vectorHeight: 0,
            parentLayoutMode: 'NONE',
            siblingCount: 0,
            aspectRatio: 400 / 60,
            zone: 'HERO'
        };

        var candidates = evaluateHeuristics(features);

        expect(candidates.length).toBeGreaterThan(0);
        expect(candidates[0].widget).toBe('w:heading');
        expect(candidates[0].score).toBeGreaterThan(0.7);
    });
});
