/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultHeuristicsService } from '.';
import type { SerializedNode } from '../../utils/serialization_utils';
import type { PipelineSchema } from '../../types/pipeline.schema';

const service = new DefaultHeuristicsService();

beforeEach(() => {
    (globalThis as any).figma = {
        mixed: Symbol('mixed'),
        async getNodeById(id: string) {
            return null;
        }
    };
});

const baseNode = (overrides: Partial<SerializedNode> = {}): SerializedNode => ({
    id: 'root',
    name: 'Frame',
    type: 'FRAME',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    visible: true,
    locked: false,
    children: [],
    ...overrides
});

describe('HeuristicsService', () => {
    it('generateSchema converte árvore simples em containers', () => {
        const root: SerializedNode = baseNode({
            children: [
                {
                    id: 'text-1',
                    name: 'Heading',
                    type: 'TEXT',
                    width: 50,
                    height: 20,
                    x: 0,
                    y: 0,
                    visible: true,
                    locked: false,
                    characters: 'Hello'
                } as SerializedNode
            ]
        });

        const schema = service.generateSchema(root);
        expect(schema.containers.length).toBeGreaterThan(0);
        expect(schema.containers[0].id).toBe('root');
    });

    it('enforceWidgetTypes ajusta tipos de widgets com base no nome', async () => {
        const schema: PipelineSchema = {
            page: { title: 'Test', tokens: { primaryColor: '#000', secondaryColor: '#fff' } },
            containers: [
                {
                    id: 'c1',
                    direction: 'column',
                    width: 'full',
                    styles: {},
                    widgets: [
                        { id: 'w1', type: 'custom', styles: {}, children: [] },
                        { id: 'w2', type: 'custom', styles: {}, children: [{ id: 'child-vector', type: 'custom', styles: {} }] }
                    ],
                    children: []
                }
            ]
        };

        (globalThis as any).figma.getNodeById = async (id: string) => {
            if (id === 'w1') {
                return { id, name: 'w:image:hero', type: 'FRAME' } as SceneNode;
            }
            if (id === 'w2') {
                return { id, name: 'Button Container', type: 'FRAME' } as SceneNode;
            }
            if (id === 'child-vector') {
                return { id, name: 'Icon', type: 'VECTOR' } as SceneNode;
            }
            return null;
        };

        await service.enforceWidgetTypes(schema);

        expect(schema.containers[0].widgets?.[0].type).toBe('image');
        expect(schema.containers[0].widgets?.[1].children?.[0].type).toBe('icon');
    });
});
