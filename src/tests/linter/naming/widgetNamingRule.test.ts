import { describe, expect, it } from 'vitest';
import { WidgetNamingRule } from '../../../linter/rules/naming/WidgetNamingRule';
import { isValidWidgetSlug } from '../../../linter/namingTaxonomy';

const makeNode = (overrides: Record<string, any>): SceneNode => ({
    id: overrides.id,
    name: overrides.name ?? 'Frame 1',
    type: overrides.type ?? 'FRAME',
    width: overrides.width ?? 200,
    height: overrides.height ?? 200,
    children: [],
    ...overrides
} as unknown as SceneNode);

describe('WidgetNamingRule - taxonomia e contexto semântico', () => {
    it('ignora detecção com widgetType fora da taxonomia', async () => {
        const rule = new WidgetNamingRule();
        const node = makeNode({ id: 'n1', name: 'Frame 1' });
        rule.setDetectionMap(new Map<string, any>([
            ['n1', { node_id: 'n1', node_name: 'Frame 1', widget: 'fake-widget', confidence: 0.9, justification: 'fora da taxonomia' }]
        ]) as any);

        const res = await rule.validate(node);
        expect(res).toBeNull();
    });

    it('gera sugestão válida para compósito com microtexto e fonte implicit-pattern', async () => {
        const rule = new WidgetNamingRule();
        const node = makeNode({ id: 'n2', name: 'Meu Frame', type: 'FRAME' });
        rule.setDetectionMap(new Map<string, any>([
            ['n2', {
                node_id: 'n2',
                node_name: 'Meu Icon List',
                widget: 'icon-list',
                confidence: 0.9,
                source: 'implicit-pattern',
                justification: 'lista de ícones',
                compositeOf: ['c1', 'c2'],
                repeaterItems: [{ itemId: 'it1', iconId: 'ic1', textId: 'tx1' }, { itemId: 'it2', iconId: 'ic2', textId: 'tx2' }],
                attachedTextIds: ['tx-help']
            }]
        ]) as any);

        const res = await rule.validate(node);
        expect(res).not.toBeNull();
        expect(res?.widgetType).toBe('icon-list');
        expect(res?.naming?.recommendedName).toBeDefined();
        expect(isValidWidgetSlug(res!.naming!.recommendedName!)).toBe(true);
        expect(res?.message).toContain('implicit-pattern');
        expect(res?.educational_tip).toBeTruthy();
    });

    it('mantém nomenclatura técnica explícita', async () => {
        const rule = new WidgetNamingRule();
        const node = makeNode({ id: 'n3', name: 'Titulo Principal', type: 'TEXT' });
        rule.setDetectionMap(new Map<string, any>([
            ['n3', {
                node_id: 'n3',
                node_name: 'Heading A',
                widget: 'w:heading',
                confidence: 1,
                source: 'explicit-name',
                semanticRole: 'heading'
            }]
        ]) as any);

        const res = await rule.validate(node);
        expect(res).not.toBeNull();
        expect(res?.naming?.recommendedName).toBe('heading');
        expect(res?.message).toContain('explicit-name');
    });
});
