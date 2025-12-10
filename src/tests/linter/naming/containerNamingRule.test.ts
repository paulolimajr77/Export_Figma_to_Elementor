import { describe, expect, it } from 'vitest';
import { ContainerNamingRule } from '../../../linter/rules/naming/ContainerNamingRule';
import { isValidContainerName } from '../../../linter/namingTaxonomy';

const makeFrame = (overrides: Record<string, any>): SceneNode => ({
    id: overrides.id,
    name: overrides.name ?? 'Frame',
    type: 'FRAME',
    width: overrides.width ?? 400,
    height: overrides.height ?? 200,
    children: [],
    ...overrides
} as unknown as SceneNode);

describe('ContainerNamingRule - sugestões alinhadas à taxonomia', () => {
    it('sugere nome válido para hero', async () => {
        const rule = new ContainerNamingRule();
        const node = makeFrame({ id: 'hero-1', name: 'Frame 1' });
        rule.setDetectionMap(new Map<string, any>([['hero-1', { nodeId: 'hero-1', role: 'hero', confidence: 0.9 }]]) as any);

        const res = await rule.validate(node);
        expect(res).not.toBeNull();
        expect(res?.naming?.recommendedName).toBeTruthy();
        expect(isValidContainerName(res!.naming!.recommendedName!)).toBe(true);
    });

    it('sugere nome válido para card com role card', async () => {
        const rule = new ContainerNamingRule();
        const node = makeFrame({ id: 'card-1', name: 'Frame 2' });
        rule.setDetectionMap(new Map<string, any>([['card-1', { nodeId: 'card-1', role: 'card', confidence: 0.8 }]]) as any);

        const res = await rule.validate(node);
        expect(res).not.toBeNull();
        expect(isValidContainerName(res!.naming!.recommendedName!)).toBe(true);
    });

    it('não sugere nada quando não há detecção', async () => {
        const rule = new ContainerNamingRule();
        const node = makeFrame({ id: 'no-role', name: 'Frame' });
        rule.setDetectionMap(new Map<string, any>());

        const res = await rule.validate(node);
        expect(res).toBeNull();
    });
});
