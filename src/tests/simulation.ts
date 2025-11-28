// Slides scenario updated for Fase 12
import { ConversionPipeline } from '../pipeline';
import { validatePipelineSchema, validateElementorJSON, computeCoverage } from '../utils/validation';

// Mock Figma Global
(globalThis as any).figma = {
    clientStorage: {
        getAsync: async (key: string) => {
            if (key === 'wp_config') return { url: 'https://example.com', auth: 'basic' };
            if (key === 'gemini_api_key') return 'mock-key';
            if (key === 'gemini_model') return 'gemini-1.5-flash';
            return null;
        }
    },
    notify: (msg: string) => console.log('Figma Notify:', msg),
    ui: { postMessage: (msg: any) => console.log('UI Message:', msg) }
} as any;

interface Scenario {
    name: string;
    schema: any;
    mockNode: any;
}

function createMockTree(): any {
    const childText = {
        id: '2',
        name: 'Text',
        type: 'TEXT',
        width: 100,
        height: 20,
        x: 0,
        y: 20,
        visible: true,
        locked: false,
        layoutMode: 'NONE',
        fills: [],
        children: []
    };
    const root = {
        id: '1',
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
        paddingTop: 20,
        paddingRight: 20,
        paddingBottom: 20,
        paddingLeft: 20,
        fills: [],
        children: [childText]
    };
    return root as any;
}

const scenarios: Scenario[] = [
    {
        name: 'slides_like_full',
        schema: {
            page: { title: 'Slides Page', tokens: { primaryColor: '#123', secondaryColor: '#eee' } },
            containers: [{
                id: 'carousel',
                direction: 'row',
                width: 'full',
                styles: {},
                widgets: [
                    {
                        type: 'slides',
                        kind: 'slides_like',
                        slides: [
                            { title: 'Slide 1', description: 'Desc 1', imageId: 'img1', image: 'https://img/1', callToAction: { text: 'Buy', link: '#1' }, contentAlign: 'left' },
                            { title: 'Slide 2', description: 'Desc 2', imageId: 'img2', image: 'https://img/2', callToAction: { text: 'More', link: '#2' }, contentAlign: 'center' },
                            { title: 'Slide 3', description: 'Desc 3', imageId: 'img3', image: 'https://img/3', callToAction: { text: 'Go', link: '#3' }, contentAlign: 'right' }
                        ],
                        content: null,
                        imageId: null,
                        styles: { sourceId: 'slides_widget' }
                    }
                ],
                children: []
            }]
        },
        mockNode: createMockTree()
    }
];

let scenarioIndex = 0;
(globalThis as any).fetch = async (_url: any, _options: any) => {
    const scenario = scenarios[scenarioIndex] || scenarios[0];
    return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(scenario.schema) }] } }] })
    } as any;
};

async function runScenario(name: string, idx: number, pipeline: ConversionPipeline, wpConfig: any) {
    scenarioIndex = idx;
    const mockNode = scenarios[idx].mockNode;
    const result = await pipeline.run(mockNode as any, wpConfig, { debug: true }) as any;
    const { elementorJson, debugInfo } = result;
    validatePipelineSchema(debugInfo.schema);
    validateElementorJSON(elementorJson);
    const coverage = computeCoverage(debugInfo.flatNodes, debugInfo.schema, elementorJson);
    console.log(`Scenario ${name} coverage:`, coverage);
    if (coverage.n_elements_elementor < coverage.n_nodes_origem) {
        throw new Error(`Coverage risk in scenario ${name}`);
    }
    const slidesWidget = elementorJson.elements.flatMap(e => e.elements).find(w => w.widgetType === 'slides');
    if (!slidesWidget) throw new Error('Slides widget not generated');
    if (!slidesWidget.settings?.slides || slidesWidget.settings.slides.length !== 3) {
        throw new Error('Slides settings missing or incorrect');
    }
}

async function runSimulation() {
    console.log('--- Starting Simulation (Slides) ---');
    const pipeline = new ConversionPipeline();
    const wpConfig = { url: 'https://test.local', auth: 'mock' };
    try {
        await runScenario('slides_like_full', 0, pipeline, wpConfig);
        console.log('Slides scenario passed.');
    } catch (err) {
        console.error('ERROR:', err);
    }
}

runSimulation();
