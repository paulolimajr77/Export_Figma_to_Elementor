/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeterministicPipeline } from './deterministic.pipeline';
import { serializerService, type SerializerService, type SerializedNode } from '../../services/serializer';
import { heuristicsService, type HeuristicsService } from '../../services/heuristics';
import { analyzeTreeWithHeuristics, convertToFlexSchema } from '../../services/heuristics/noai.parser';
import { DefaultMediaService } from '../../services/media';
import type { MediaService, MediaResolutionOptions, MediaResolutionResult } from '../../services/media';
import type { PipelineSchema } from '../../types/pipeline.schema';
import type { WPConfig } from '../../types/elementor.types';
import type { TelemetryService } from '../../services/telemetry/telemetry.service';

const createNode = (overrides: Record<string, unknown> = {}): SceneNode => {
    const base: any = {
        id: 'node-' + Math.random(),
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
};

beforeEach(() => {
    (globalThis as any).figma = {
        mixed: Symbol('mixed'),
        async getNodeById() {
            return null;
        }
    };
});

class StubMediaService implements MediaService {
    setWPConfig(): void { }
    handleUploadResponse(): void { }
    async resolveImages(schema: PipelineSchema, _options?: MediaResolutionOptions): Promise<MediaResolutionResult> {
        const assets = (schema.containers[0]?.widgets || []).map(w => ({
            widgetId: w.id || '',
            format: 'WEBP' as const,
            simulated: true
        }));
        return { schema, assets };
    }
}

class InspectingMediaService implements MediaService {
    captured: MediaResolutionOptions | undefined;
    async resolveImages(schema: PipelineSchema, options?: MediaResolutionOptions): Promise<MediaResolutionResult> {
        this.captured = options;
        return { schema, assets: [] };
    }
    setWPConfig(): void { }
    handleUploadResponse(): void { }
}

class StubSerializer implements SerializerService {
    serialize(_node: SceneNode): SerializedNode {
        return {
            id: 'stub',
            name: 'Stub',
            type: 'FRAME',
            width: 100,
            height: 100,
            x: 0,
            y: 0,
            visible: true,
            locked: false,
            children: []
        } as SerializedNode;
    }
    flatten(root: SerializedNode): SerializedNode[] {
        return [root];
    }
    createSnapshot(node: SceneNode): { root: SerializedNode; flatNodes: SerializedNode[] } {
        const root = this.serialize(node);
        return { root, flatNodes: [root] };
    }
}

class StubHeuristics implements HeuristicsService {
    constructor(private readonly schema: PipelineSchema) { }
    analyzeTree(root: SerializedNode): SerializedNode {
        return root;
    }
    generateSchema(_root: SerializedNode): PipelineSchema {
        return JSON.parse(JSON.stringify(this.schema));
    }
    async enforceWidgetTypes(schema: PipelineSchema): Promise<PipelineSchema> {
        return schema;
    }
}

class FakeUploader {
    private counter = 0;
    setWPConfig(): void { }
    handleUploadResponse(): void { }
    async uploadToWordPress(node: SceneNode, format: 'WEBP' | 'SVG') {
        this.counter += 1;
        return { id: this.counter, url: `https://wp.test/${node.id}.${format.toLowerCase()}` };
    }
}

const VALID_WP: WPConfig = {
    url: 'https://wp.test',
    user: 'user',
    password: 'token',
    exportImages: true
} as WPConfig;

const mediaFixture = (): PipelineSchema => ({
    page: { title: 'Test', tokens: { primaryColor: '#000', secondaryColor: '#fff' } },
    containers: [{
        id: 'c1',
        direction: 'column',
        width: 'full',
        styles: {},
        widgets: [
            { id: 'w-img', type: 'image', imageId: 'node-image', styles: {} },
            { id: 'w-image-box', type: 'image-box', imageId: 'node-image-box', styles: {}, content: 'Experience' },
            { id: 'w-icon-box', type: 'icon-box', imageId: 'node-icon', styles: {} },
            { id: 'w-icon', type: 'icon', imageId: 'node-icon', styles: {} },
            { id: 'w-list-item', type: 'list-item', imageId: 'node-list', styles: {} },
            { id: 'w-icon-list', type: 'icon-list', imageId: 'node-icon-list', styles: {} },
            {
                id: 'w-button',
                type: 'button',
                imageId: 'node-button',
                content: 'Button',
                styles: { sourceId: 'button-source', selected_icon: { value: { id: 'legacy' } } },
                children: [{ id: 'w-child-icon', type: 'icon', imageId: 'node-child-icon', styles: {} }]
            },
            { id: 'w-accordion', type: 'accordion', imageId: 'node-accordion', styles: {} },
            {
                id: 'w-carousel',
                type: 'image-carousel',
                styles: { slides: [{ id: 'slide-node-1', _id: 'slide-1' }, { id: 'slide-node-2' }] }
            },
            {
                id: 'w-gallery',
                type: 'basic-gallery',
                styles: { gallery: [{ id: 'gallery-node-1' }, { id: 'missing-node' }, { id: 'gallery-node-2' }] }
            },
            { id: 'w-custom', type: 'custom', imageId: 'node-custom', styles: {} }
        ],
        children: []
    }]
});

const buildNodeMap = () => {
    const node = (id: string, overrides: Record<string, unknown> = {}) => createNode({ id, ...overrides });
    return {
        'node-image': node('node-image', { fills: [{ type: 'IMAGE', visible: true }] }),
        'node-image-box': node('node-image-box', { fills: [{ type: 'IMAGE', visible: true }] }),
        'node-icon': node('node-icon', { type: 'VECTOR', name: 'Icon' }),
        'node-list': node('node-list', { type: 'VECTOR', name: 'List Icon' }),
        'node-icon-list': node('node-icon-list', { type: 'VECTOR', name: 'Icon List Item' }),
        'node-button': node('node-button', { fills: [{ type: 'IMAGE', visible: true }] }),
        'button-source': {
            ...node('button-source'),
            children: [node('btn-icon', { id: 'btn-icon', type: 'VECTOR', name: 'Icon' })]
        } as SceneNode,
        'node-child-icon': node('node-child-icon', { type: 'VECTOR', name: 'Child Icon' }),
        'node-accordion': node('node-accordion', { type: 'VECTOR', name: 'Accordion Icon' }),
        'slide-node-1': node('slide-node-1', { fills: [{ type: 'IMAGE', visible: true }] }),
        'slide-node-2': node('slide-node-2', { fills: [{ type: 'IMAGE', visible: true }] }),
        'gallery-node-1': node('gallery-node-1', { fills: [{ type: 'IMAGE', visible: true }] }),
        'gallery-node-2': node('gallery-node-2', { fills: [{ type: 'IMAGE', visible: true }] }),
        'node-custom': node('node-custom', { fills: [{ type: 'IMAGE', visible: true }] })
    } as Record<string, SceneNode>;
};

const widgetSnapshot = (schema: PipelineSchema) => {
    return schema.containers[0]?.widgets?.map(widget => ({
        id: widget.id,
        type: widget.type,
        styles: widget.styles,
        content: widget.content,
        imageId: widget.imageId
    }));
};

describe('DeterministicPipeline', () => {
    it('gera schema igual ao fluxo determinístico atual', async () => {
        const childText = createNode({
            id: 'text',
            type: 'TEXT',
            name: 'Heading',
            characters: 'Hello',
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1, visible: true }],
            children: []
        });
        const root = createNode({
            id: 'root',
            name: 'Root Frame',
            children: [childText]
        });

        const deterministic = new DeterministicPipeline(serializerService, heuristicsService, new StubMediaService());
        const result = await deterministic.run(root);

        const serialized = serializerService.serialize(root);
        const baseline = convertToFlexSchema(analyzeTreeWithHeuristics(serialized));
        await heuristicsService.enforceWidgetTypes(baseline);

        expect(result.schema).toEqual(baseline);
        expect(result.assets).toHaveLength(1);
        expect(result.assets[0].simulated).toBe(true);
    });

    it('usa modo real quando wpConfig for fornecido', async () => {
        const inspector = new InspectingMediaService();
        const deterministic = new DeterministicPipeline(serializerService, heuristicsService, inspector);
        await deterministic.run(createNode(), { wpConfig: VALID_WP });
        expect(inspector.captured?.simulate).toBe(false);
        expect(inspector.captured?.wpConfig?.url).toBe(VALID_WP.url);
    });

    it('mantem snapshot de uploads reais equivalente ao fluxo legado', async () => {
        const schema = mediaFixture();
        const serializer = new StubSerializer();
        const heuristics = new StubHeuristics(schema);
        const media = new DefaultMediaService(new FakeUploader() as any);
        const nodeMap = buildNodeMap();
        (globalThis as any).figma.getNodeById = (id: string) => nodeMap[id] || null;

        const deterministic = new DeterministicPipeline(serializer, heuristics, media);
        const result = await deterministic.run(createNode(), { wpConfig: VALID_WP });

        expect(result.assets).toMatchInlineSnapshot(`
          [
            {
              "format": "WEBP",
              "simulated": false,
              "url": "https://wp.test/node-image.webp",
              "widgetId": "w-img",
              "wpId": 1,
            },
            {
              "format": "WEBP",
              "simulated": false,
              "url": "https://wp.test/node-image-box.webp",
              "widgetId": "w-image-box",
              "wpId": 2,
            },
            {
              "format": "SVG",
              "simulated": false,
              "url": "https://wp.test/node-icon.svg",
              "widgetId": "w-icon-box",
              "wpId": 3,
            },
            {
              "format": "SVG",
              "simulated": false,
              "url": "https://wp.test/node-icon.svg",
              "widgetId": "w-icon",
              "wpId": 4,
            },
            {
              "format": "SVG",
              "simulated": false,
              "url": "https://wp.test/node-list.svg",
              "widgetId": "w-list-item",
              "wpId": 5,
            },
            {
              "format": "SVG",
              "simulated": false,
              "url": "https://wp.test/node-icon-list.svg",
              "widgetId": "w-icon-list",
              "wpId": 6,
            },
            {
              "format": "SVG",
              "simulated": false,
              "url": "https://wp.test/node-button.svg",
              "widgetId": "w-button",
              "wpId": 7,
            },
            {
              "format": "SVG",
              "simulated": false,
              "url": "https://wp.test/node-accordion.svg",
              "widgetId": "w-accordion",
              "wpId": 8,
            },
            {
              "format": "WEBP",
              "simulated": false,
              "url": "https://wp.test/node-custom.webp",
              "widgetId": "w-custom",
              "wpId": 9,
            },
            {
              "format": "WEBP",
              "simulated": false,
              "url": "https://wp.test/slide-node-1.webp",
              "widgetId": "slide-node-1",
              "wpId": 10,
            },
            {
              "format": "WEBP",
              "simulated": false,
              "url": "https://wp.test/gallery-node-1.webp",
              "widgetId": "gallery-node-1",
              "wpId": 11,
            },
            {
              "format": "SVG",
              "simulated": false,
              "url": "https://wp.test/btn-icon.svg",
              "widgetId": "btn-icon",
              "wpId": 12,
            },
            {
              "format": "WEBP",
              "simulated": false,
              "url": "https://wp.test/slide-node-2.webp",
              "widgetId": "slide-node-2",
              "wpId": 13,
            },
            {
              "format": "WEBP",
              "simulated": false,
              "url": "https://wp.test/gallery-node-2.webp",
              "widgetId": "gallery-node-2",
              "wpId": 14,
            },
            {
              "format": "SVG",
              "simulated": false,
              "url": "https://wp.test/node-child-icon.svg",
              "widgetId": "w-child-icon",
              "wpId": 15,
            },
          ]
        `);
        expect(widgetSnapshot(result.schema)).toMatchInlineSnapshot(`
          [
            {
              "content": "https://wp.test/node-image.webp",
              "id": "w-img",
              "imageId": "1",
              "styles": {},
              "type": "image",
            },
            {
              "content": "Experience",
              "id": "w-image-box",
              "imageId": "2",
              "styles": {
                "image_url": "https://wp.test/node-image-box.webp",
              },
              "type": "image-box",
            },
            {
              "content": undefined,
              "id": "w-icon-box",
              "imageId": "3",
              "styles": {
                "selected_icon": {
                  "library": "svg",
                  "value": {
                    "id": 3,
                    "url": "https://wp.test/node-icon.svg",
                  },
                },
              },
              "type": "icon-box",
            },
            {
              "content": undefined,
              "id": "w-icon",
              "imageId": "4",
              "styles": {
                "selected_icon": {
                  "library": "svg",
                  "value": {
                    "id": 4,
                    "url": "https://wp.test/node-icon.svg",
                  },
                },
              },
              "type": "icon",
            },
            {
              "content": undefined,
              "id": "w-list-item",
              "imageId": "5",
              "styles": {
                "icon_url": "https://wp.test/node-list.svg",
              },
              "type": "list-item",
            },
            {
              "content": undefined,
              "id": "w-icon-list",
              "imageId": "6",
              "styles": {
                "icon": {
                  "library": "svg",
                  "value": {
                    "id": 6,
                    "url": "https://wp.test/node-icon-list.svg",
                  },
                },
              },
              "type": "icon-list",
            },
            {
              "content": "Button",
              "id": "w-button",
              "imageId": "12",
              "styles": {
                "selected_icon": {
                  "library": "svg",
                  "value": {
                    "id": 12,
                    "url": "https://wp.test/btn-icon.svg",
                  },
                },
                "sourceId": "button-source",
              },
              "type": "button",
            },
            {
              "content": undefined,
              "id": "w-accordion",
              "imageId": "8",
              "styles": {
                "selected_icon": {
                  "library": "svg",
                  "value": {
                    "id": 8,
                    "url": "https://wp.test/node-accordion.svg",
                  },
                },
              },
              "type": "accordion",
            },
            {
              "content": undefined,
              "id": "w-carousel",
              "imageId": undefined,
              "styles": {
                "slides": [
                  {
                    "_id": "slide-1",
                    "id": 10,
                    "image": {
                      "id": 10,
                      "url": "https://wp.test/slide-node-1.webp",
                    },
                    "url": "https://wp.test/slide-node-1.webp",
                  },
                  {
                    "_id": "slide-node-2",
                    "id": 13,
                    "image": {
                      "id": 13,
                      "url": "https://wp.test/slide-node-2.webp",
                    },
                    "url": "https://wp.test/slide-node-2.webp",
                  },
                ],
              },
              "type": "image-carousel",
            },
            {
              "content": undefined,
              "id": "w-gallery",
              "imageId": undefined,
              "styles": {
                "gallery": [
                  {
                    "id": 11,
                    "image": {
                      "id": 11,
                      "url": "https://wp.test/gallery-node-1.webp",
                    },
                    "url": "https://wp.test/gallery-node-1.webp",
                  },
                  {
                    "id": 14,
                    "image": {
                      "id": 14,
                      "url": "https://wp.test/gallery-node-2.webp",
                    },
                    "url": "https://wp.test/gallery-node-2.webp",
                  },
                ],
              },
              "type": "basic-gallery",
            },
            {
              "content": "https://wp.test/node-custom.webp",
              "id": "w-custom",
              "imageId": "9",
              "styles": {},
              "type": "custom",
            },
          ]
        `);
    });

    it('suporta telemetria sem alterar o schema retornado', async () => {
        const telemetry: Partial<TelemetryService> = {
            log: vi.fn().mockResolvedValue(undefined),
            metric: vi.fn().mockResolvedValue(undefined),
            snapshot: vi.fn().mockResolvedValue(undefined)
        };
        const root = createNode({
            id: 'telemetry-root',
            name: 'Root Telemetry',
            children: [createNode({ id: 'telemetry-text', type: 'TEXT', name: 'Heading', characters: 'Telemetry' }) as SceneNode]
        });
        const deterministic = new DeterministicPipeline(serializerService, heuristicsService, new StubMediaService());
        const result = await deterministic.run(root, { telemetry: telemetry as TelemetryService });

        const serialized = serializerService.serialize(root);
        const baseline = convertToFlexSchema(analyzeTreeWithHeuristics(serialized));
        await heuristicsService.enforceWidgetTypes(baseline);

        expect(result.schema).toEqual(baseline);
        expect(telemetry.log).toHaveBeenCalled();
        expect(telemetry.metric).toHaveBeenCalled();
    });
});
