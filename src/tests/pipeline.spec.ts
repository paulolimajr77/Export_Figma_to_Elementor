import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversionPipeline, PipelineDebugInfo } from '../pipeline';
import { validatePipelineSchema, validateElementorJSON, computeCoverage } from '../utils/validation';
import type { PipelineSchema } from '../types/pipeline.schema';
import type { ElementorTemplate } from '../types/elementor.types';

const createMockNode = (): SceneNode => {
    const textHeading = {
        id: 't1',
        name: 'Heading',
        type: 'TEXT',
        width: 100,
        height: 20,
        x: 0,
        y: 0,
        visible: true,
        locked: false,
        layoutMode: 'NONE',
        children: [],
        characters: 'Hello'
    };
    const textBody = {
        id: 't2',
        name: 'Body',
        type: 'TEXT',
        width: 100,
        height: 20,
        x: 0,
        y: 24,
        visible: true,
        locked: false,
        layoutMode: 'NONE',
        children: [],
        characters: 'World'
    };
    const button = {
        id: 'b1',
        name: 'Button',
        type: 'RECTANGLE',
        width: 80,
        height: 30,
        x: 0,
        y: 48,
        visible: true,
        locked: false,
        layoutMode: 'NONE',
        children: []
    };

    return {
        id: 'root',
        name: 'Root Frame',
        type: 'FRAME',
        width: 400,
        height: 300,
        x: 0,
        y: 0,
        visible: true,
        locked: false,
        layoutMode: 'VERTICAL',
        itemSpacing: 10,
        paddingTop: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 10,
        children: [textHeading, textBody, button]
    } as unknown as SceneNode;
};

const mockFigmaSelection = (node: SceneNode) => {
    (globalThis as any).figma = {
        clientStorage: {
            getAsync: async (key: string) => {
                if (key === 'gemini_api_key') return 'mock-key';
                if (key === 'gemini_model') return 'gemini-2.5-flash';
                return null;
            },
            setAsync: async () => { }
        },
        notify: vi.fn(),
        ui: { postMessage: vi.fn() },
        currentPage: { selection: [node] },
        getNodeById: () => undefined
    } as any;
};

const mockFetchSchema = (schema: PipelineSchema) => {
    (globalThis as any).fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(schema) }] } }] })
    })) as unknown as typeof fetch;
};

const normalizeRunResult = (
    result: Awaited<ReturnType<ConversionPipeline['run']>>
): { elementorJson: ElementorTemplate; debugInfo: PipelineDebugInfo | null } => {
    if (typeof result === 'object' && result && 'elementorJson' in result) {
        return { elementorJson: result.elementorJson, debugInfo: result.debugInfo ?? null };
    }
    return { elementorJson: result as ElementorTemplate, debugInfo: null };
};

describe('Pipeline + Serializer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('gera schema valido e mantem cobertura 1:1', async () => {
        const frame = createMockNode();
        mockFigmaSelection(frame);

        const schema: PipelineSchema = {
            page: { title: 'Test', tokens: { primaryColor: '#111', secondaryColor: '#fff' } },
            containers: [{
                id: 'root',
                direction: 'column',
                width: 'full',
                styles: { sourceId: 'root' },
                widgets: [
                    { type: 'heading', content: 'Hello', imageId: null, styles: { sourceId: 't1' } },
                    { type: 'text', content: 'World', imageId: null, styles: { sourceId: 't2' } },
                    { type: 'button', content: 'CTA', imageId: null, styles: { sourceId: 'b1' } }
                ],
                children: []
            }]
        };

        mockFetchSchema(schema);
        const pipeline = new ConversionPipeline();
        const result = await pipeline.run(frame, {}, { debug: true });
        const { elementorJson, debugInfo } = normalizeRunResult(result);
        if (!debugInfo) {
            throw new Error('Esperado debugInfo para validar cobertura do pipeline');
        }
        validatePipelineSchema(debugInfo.schema);
        validateElementorJSON(elementorJson);
        const coverage = computeCoverage(debugInfo.flatNodes, debugInfo.schema, elementorJson);

        expect(coverage.n_nodes_origem).toBe(4);
        expect(coverage.n_widgets_schema).toBe(3);
        expect(coverage.n_elements_elementor).toBeGreaterThanOrEqual(4);
    });
});
