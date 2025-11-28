import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversionPipeline } from '../pipeline';
import { validatePipelineSchema, validateElementorJSON, computeCoverage } from '../utils/validation';

function createMockNode(): any {
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
    children: [
      { id: 't1', name: 'Heading', type: 'TEXT', width: 100, height: 20, x: 0, y: 0, visible: true, locked: false, layoutMode: 'NONE', children: [], characters: 'Hello' },
      { id: 't2', name: 'Body', type: 'TEXT', width: 100, height: 20, x: 0, y: 24, visible: true, locked: false, layoutMode: 'NONE', children: [], characters: 'World' },
      { id: 'b1', name: 'Button', type: 'RECTANGLE', width: 80, height: 30, x: 0, y: 48, visible: true, locked: false, layoutMode: 'NONE', children: [] }
    ]
  };
}

function mockFigmaSelection(node: any) {
  (globalThis as any).figma = {
    clientStorage: {
      getAsync: async (key: string) => {
        if (key === 'gemini_api_key') return 'mock-key';
        if (key === 'gemini_model') return 'gemini-2.5-flash';
        return null;
      },
      setAsync: async () => {}
    },
    notify: vi.fn(),
    ui: { postMessage: vi.fn() },
    currentPage: { selection: [node] },
    getNodeById: () => undefined
  } as any;
}

function mockFetchSchema(schema: any) {
  (globalThis as any).fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(schema) }] } }] })
  })) as any;
}

describe('Pipeline + Serializer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gera schema válido e mantém cobertura 1:1', async () => {
    const mockNode = createMockNode();
    mockFigmaSelection(mockNode);

    const schema = {
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
    const result = await pipeline.run(mockNode as any, {}, { debug: true }) as any;
    const { elementorJson, debugInfo } = result;
    validatePipelineSchema(debugInfo.schema);
    validateElementorJSON(elementorJson);
    const coverage = computeCoverage(debugInfo.flatNodes, debugInfo.schema, elementorJson);
    expect(coverage.n_nodes_origem).toBe(4); // root + 3 filhos
    expect(coverage.n_widgets_schema).toBe(3);
    expect(coverage.n_elements_elementor).toBeGreaterThanOrEqual(4);
  });
});
