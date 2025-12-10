import { describe, expect, it } from 'vitest';
import { WIDGET_TAXONOMY, filterValidWidgetNames, getAllWidgetSlugs, isWidgetInTaxonomy } from '../../../linter/config/widget-taxonomy';
import { WidgetNamingRule } from '../../../linter/rules/naming/WidgetNamingRule';
import { GenericNameRule } from '../../../linter/rules/naming/GenericNameRule';

const makeTextNode = (overrides: Record<string, any>): SceneNode => ({
    id: overrides.id,
    name: overrides.name,
    type: 'TEXT',
    characters: overrides.characters ?? overrides.name,
    width: overrides.width ?? 200,
    height: overrides.height ?? 40,
    parentId: overrides.parentId ?? 'root',
    fontSize: overrides.fontSize ?? 16,
    fontWeight: overrides.fontWeight ?? 400,
    children: [],
    fills: [],
    strokes: [],
    ...overrides
} as unknown as SceneNode);

describe('Taxonomia de widgets (WIDGET_TAXONOMY)', () => {
    it('possui categorias e slugs oficiais', () => {
        expect(WIDGET_TAXONOMY.length).toBeGreaterThan(0);
        const all = getAllWidgetSlugs();
        expect(all.length).toBeGreaterThan(10);
        expect(all).toContain('heading');
        expect(all).toContain('w:container');
    });

    it('filtra nomes inválidos e mantém apenas slugs oficiais', () => {
        const filtered = filterValidWidgetNames(['heading', 'Card/Feature', 'image-box', '']);
        expect(filtered).toEqual(['heading', 'image-box']);
    });
});

describe('Regras de naming usam apenas taxonomia oficial', () => {
    it('WidgetNamingRule retorna nomes dentro da taxonomia para TEXT', async () => {
        const rule = new WidgetNamingRule();
        const textNode = makeTextNode({
            id: 'text-1',
            name: 'Hero Title',
            characters: 'Hero Title',
            fontSize: 32,
            fontWeight: 700
        });
        const detectionMap = new Map<string, any>([
            ['text-1', {
                node_id: 'text-1',
                node_name: 'Hero Title',
                widget: 'w:heading',
                confidence: 0.9,
                justification: 'teste'
            }]
        ]);
        rule.setDetectionMap(detectionMap as any);

        const result = await rule.validate(textNode);
        expect(result).not.toBeNull();
        expect(result?.naming?.recommendedName).toBe('heading');
        result?.naming?.alternatives.forEach(name => expect(isWidgetInTaxonomy(name)).toBe(true));
    });

    it('GenericNameRule sugere apenas slugs válidos para nomes genéricos', async () => {
        const rule = new GenericNameRule();
        const frameNode = {
            id: 'frame-1',
            name: 'Frame 1',
            type: 'FRAME',
            width: 300,
            height: 300,
            children: []
        } as unknown as SceneNode;

        const result = await rule.validate(frameNode);
        expect(result).not.toBeNull();
        expect(result?.naming?.recommendedName).toBeDefined();
        if (result?.naming?.recommendedName) {
            expect(isWidgetInTaxonomy(result.naming.recommendedName)).toBe(true);
        }
        result?.naming?.alternatives.forEach(name => expect(isWidgetInTaxonomy(name)).toBe(true));
    });
});
