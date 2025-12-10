/**
 * V2.1 Composite Pattern Tests
 * 
 * Tests for CardPattern, HeroPattern, ListPattern detection
 */

import { describe, it, expect } from 'vitest';
import {
    applyCompositePatterns,
    createWidgetNode,
    WidgetNode
} from '../../engine/composite-patterns';
import { NodeFeatures, PageZone } from '../../engine/types';

// Helper to create minimal NodeFeatures for testing
function createFeatures(overrides: Partial<NodeFeatures> = {}): NodeFeatures {
    return {
        id: overrides.id || 'test-node',
        name: overrides.name || 'Test Node',
        type: overrides.type || 'FRAME',
        width: overrides.width ?? 400,
        height: overrides.height ?? 300,
        x: overrides.x ?? 0,
        y: overrides.y ?? 0,
        area: (overrides.width ?? 400) * (overrides.height ?? 300),
        childCount: overrides.childCount ?? 0,
        layoutMode: overrides.layoutMode || 'VERTICAL',
        primaryAxisSizingMode: overrides.primaryAxisSizingMode || 'FIXED',
        counterAxisSizingMode: overrides.counterAxisSizingMode || 'FIXED',
        hasNestedFrames: overrides.hasNestedFrames ?? false,
        hasFill: overrides.hasFill ?? false,
        hasStroke: overrides.hasStroke ?? false,
        hasText: overrides.hasText ?? false,
        textCount: overrides.textCount ?? 0,
        hasImage: overrides.hasImage ?? false,
        imageCount: overrides.imageCount ?? 0,
        textLength: overrides.textLength ?? 0,
        fontSize: overrides.fontSize ?? 0,
        fontWeight: overrides.fontWeight ?? 400,
        isVectorNode: overrides.isVectorNode ?? false,
        vectorWidth: overrides.vectorWidth ?? 0,
        vectorHeight: overrides.vectorHeight ?? 0,
        parentLayoutMode: overrides.parentLayoutMode || 'NONE',
        siblingCount: overrides.siblingCount ?? 0,
        aspectRatio: overrides.aspectRatio ?? 1,
        zone: (overrides.zone as PageZone) || 'BODY'
    };
}

describe('Composite Patterns · CardPattern', () => {
    it('detects card with image + heading + text', () => {
        const cardNode: WidgetNode = {
            id: 'card-1',
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'VERTICAL', childCount: 3 }),
            children: [
                createWidgetNode('img-1', 'w:image', 0.85, createFeatures({ type: 'RECTANGLE' })),
                createWidgetNode('h-1', 'w:heading', 0.90, createFeatures({ type: 'TEXT', fontSize: 24 })),
                createWidgetNode('t-1', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT', fontSize: 14 }))
            ]
        };

        const result = applyCompositePatterns(cardNode);

        expect(result.compositeType).toBe('w:image-box');
        expect(result.compositeMeta?.patternId).toBe('composite_card');
    });

    it('detects card with icon + heading + text + button', () => {
        const cardNode: WidgetNode = {
            id: 'card-2',
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'VERTICAL', childCount: 4 }),
            children: [
                createWidgetNode('icon-1', 'w:icon', 0.85, createFeatures({ type: 'VECTOR', width: 32, height: 32 })),
                createWidgetNode('h-2', 'w:heading', 0.90, createFeatures({ type: 'TEXT', fontSize: 20 })),
                createWidgetNode('t-2', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT', fontSize: 14 })),
                createWidgetNode('btn-1', 'w:button', 0.80, createFeatures({ type: 'FRAME', height: 40 }))
            ]
        };

        const result = applyCompositePatterns(cardNode);

        expect(result.compositeType).toBe('w:icon-box');
        expect(result.compositeMeta?.hasButton).toBe(true);
    });

    it('uses visual proportion to decide icon-box vs image-box (small visual → icon-box)', () => {
        const cardNode: WidgetNode = {
            id: 'card-small-visual',
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'VERTICAL', width: 320, height: 360, childCount: 3 }),
            children: [
                createWidgetNode('img-small', 'w:image', 0.80, createFeatures({ type: 'RECTANGLE', width: 60, height: 60 })),
                createWidgetNode('h-x', 'w:heading', 0.90, createFeatures({ type: 'TEXT', fontSize: 20 })),
                createWidgetNode('t-x', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT', fontSize: 14 }))
            ]
        };

        const result = applyCompositePatterns(cardNode);
        expect(result.compositeType).toBe('w:icon-box');
    });

    it('uses visual proportion to decide icon-box vs image-box (large visual → image-box)', () => {
        const cardNode: WidgetNode = {
            id: 'card-large-visual',
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'VERTICAL', width: 320, height: 360, childCount: 3 }),
            children: [
                createWidgetNode('img-large', 'w:image', 0.80, createFeatures({ type: 'RECTANGLE', width: 260, height: 220 })),
                createWidgetNode('h-y', 'w:heading', 0.90, createFeatures({ type: 'TEXT', fontSize: 20 })),
                createWidgetNode('t-y', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT', fontSize: 14 }))
            ]
        };

        const result = applyCompositePatterns(cardNode);
        expect(result.compositeType).toBe('w:image-box');
    });

    it('does not detect card with insufficient children', () => {
        const notCard: WidgetNode = {
            id: 'not-card',
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'VERTICAL', childCount: 2 }),
            children: [
                createWidgetNode('h-3', 'w:heading', 0.90, createFeatures({ type: 'TEXT' })),
                createWidgetNode('t-3', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT' }))
            ]
        };

        const result = applyCompositePatterns(notCard);

        expect(result.compositeType).toBeUndefined();
    });
});

describe('Composite Patterns · HeroPattern', () => {
    it('detects hero with text-left image-right layout', () => {
        const heroNode: WidgetNode = {
            id: 'hero-1',
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'HORIZONTAL', width: 1200, height: 500, childCount: 2 }),
            children: [
                // Left column: text content
                {
                    id: 'text-col',
                    type: 'w:container',
                    score: 0.50,
                    features: createFeatures({ layoutMode: 'VERTICAL', width: 600, height: 400 }),
                    children: [
                        createWidgetNode('h-hero', 'w:heading', 0.90, createFeatures({ type: 'TEXT', fontSize: 48 })),
                        createWidgetNode('t-hero', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT', fontSize: 16 })),
                        createWidgetNode('btn-hero', 'w:button', 0.80, createFeatures({ type: 'FRAME', height: 48 }))
                    ]
                },
                // Right column: image
                {
                    id: 'img-col',
                    type: 'w:container',
                    score: 0.50,
                    features: createFeatures({ layoutMode: 'NONE', width: 600, height: 400 }),
                    children: [
                        createWidgetNode('img-hero', 'w:image', 0.90, createFeatures({ type: 'RECTANGLE', width: 600, height: 400 }))
                    ]
                }
            ]
        };

        const result = applyCompositePatterns(heroNode);

        expect(result.compositeType).toBe('structure:hero');
        expect(result.compositeMeta?.layout).toBe('text-left');
    });

    it('does not detect hero when too small', () => {
        const smallSection: WidgetNode = {
            id: 'small-section',
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'HORIZONTAL', width: 600, height: 200, childCount: 2 }),
            children: [
                createWidgetNode('col-1', 'w:container', 0.50, createFeatures({})),
                createWidgetNode('col-2', 'w:container', 0.50, createFeatures({}))
            ]
        };

        const result = applyCompositePatterns(smallSection);

        expect(result.compositeType).toBeUndefined();
    });
});

describe('Composite Patterns · ListPattern', () => {
    it('detects icon list with uniform items', () => {
        const listNode: WidgetNode = {
            id: 'list-1',
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'VERTICAL', childCount: 4 }),
            children: [
                // Each child is an icon + text pair
                {
                    id: 'item-1',
                    type: 'w:container',
                    score: 0.50,
                    features: createFeatures({ layoutMode: 'HORIZONTAL', childCount: 2 }),
                    children: [
                        createWidgetNode('icon-l1', 'w:icon', 0.85, createFeatures({ type: 'VECTOR', width: 24 })),
                        createWidgetNode('text-l1', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT' }))
                    ]
                },
                {
                    id: 'item-2',
                    type: 'w:container',
                    score: 0.50,
                    features: createFeatures({ layoutMode: 'HORIZONTAL', childCount: 2 }),
                    children: [
                        createWidgetNode('icon-l2', 'w:icon', 0.85, createFeatures({ type: 'VECTOR', width: 24 })),
                        createWidgetNode('text-l2', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT' }))
                    ]
                },
                {
                    id: 'item-3',
                    type: 'w:container',
                    score: 0.50,
                    features: createFeatures({ layoutMode: 'HORIZONTAL', childCount: 2 }),
                    children: [
                        createWidgetNode('icon-l3', 'w:icon', 0.85, createFeatures({ type: 'VECTOR', width: 24 })),
                        createWidgetNode('text-l3', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT' }))
                    ]
                },
                {
                    id: 'item-4',
                    type: 'w:container',
                    score: 0.50,
                    features: createFeatures({ layoutMode: 'HORIZONTAL', childCount: 2 }),
                    children: [
                        createWidgetNode('icon-l4', 'w:icon', 0.85, createFeatures({ type: 'VECTOR', width: 24 })),
                        createWidgetNode('text-l4', 'w:text-editor', 0.85, createFeatures({ type: 'TEXT' }))
                    ]
                }
            ]
        };

        const result = applyCompositePatterns(listNode);

        expect(result.compositeType).toBe('structure:icon-list');
        expect(result.compositeMeta?.itemCount).toBe(4);
    });
});

describe('Composite Patterns · CardListPattern', () => {
    it('detects grid of similar cards', () => {
        const createCard = (id: string): WidgetNode => ({
            id,
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'VERTICAL', childCount: 3 }),
            children: [
                createWidgetNode(`${id}-img`, 'w:image', 0.85, createFeatures({ type: 'RECTANGLE' })),
                createWidgetNode(`${id}-h`, 'w:heading', 0.90, createFeatures({ type: 'TEXT', fontSize: 18 })),
                createWidgetNode(`${id}-t`, 'w:text-editor', 0.85, createFeatures({ type: 'TEXT', fontSize: 14 }))
            ]
        });

        const gridNode: WidgetNode = {
            id: 'card-grid',
            type: 'w:container',
            score: 0.50,
            features: createFeatures({ layoutMode: 'HORIZONTAL', childCount: 3, width: 1200 }),
            children: [
                createCard('card-a'),
                createCard('card-b'),
                createCard('card-c')
            ]
        };

        // First pass: detect individual cards
        let result = applyCompositePatterns(gridNode);

        // Children should be detected as image-box (cards)
        expect(result.children?.[0].compositeType).toBe('w:image-box');
        expect(result.children?.[1].compositeType).toBe('w:image-box');
        expect(result.children?.[2].compositeType).toBe('w:image-box');

        // Parent should be detected as card-grid
        expect(result.compositeType).toBe('structure:card-grid');
    });
});
