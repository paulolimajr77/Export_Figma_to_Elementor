import { describe, expect, it } from 'vitest';
import { DefaultSerializerService } from '.';

const serializer = new DefaultSerializerService();

(globalThis as any).figma = { mixed: Symbol('mixed') };

function createNode(overrides: Record<string, unknown> = {}): SceneNode {
    const base: any = {
        id: 'node-1',
        name: 'Frame',
        type: 'FRAME',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        visible: true,
        locked: false,
        children: [],
        fills: [],
        strokes: [],
        effects: [],
        layoutMode: 'NONE',
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        itemSpacing: 0,
        primaryAxisAlignItems: 'MIN',
        counterAxisAlignItems: 'MIN'
    };
    return { ...base, ...overrides } as SceneNode;
}

describe('DefaultSerializerService', () => {
    it('serializes node with children and text metadata', () => {
        const textNode = createNode({
            id: 'node-2',
            name: 'Heading',
            type: 'TEXT',
            characters: 'Hello',
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1, visible: true }],
            children: []
        });

        const root = createNode({
            id: 'node-root',
            children: [textNode]
        });

        const serialized = serializer.serialize(root);
        expect(serialized.id).toBe('node-root');
        expect(serialized.children).toHaveLength(1);
        expect(serialized.children?.[0].characters).toBe('Hello');
        expect(serialized.children?.[0].type).toBe('TEXT');
    });

    it('createSnapshot retorna root e flatten corretos', () => {
        const child = createNode({ id: 'child', children: [] });
        const root = createNode({ id: 'parent', children: [child] });

        const snapshot = serializer.createSnapshot(root);
        expect(snapshot.root.id).toBe('parent');
        expect(snapshot.flatNodes).toHaveLength(2);
        expect(snapshot.flatNodes[1].id).toBe('child');
    });
});
