
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
    ui: {
        postMessage: (msg: any) => console.log('UI Message:', msg)
    }
} as any;

// Mock Fetch
(globalThis as any).fetch = async (url: any, options: any) => {
    console.log('Fetch called:', url);
    return {
        ok: true,
        json: async () => ({
            candidates: [{
                content: {
                    parts: [{
                        text: JSON.stringify({
                            page: { title: "Test Page", tokens: { primaryColor: "#000", secondaryColor: "#fff" } },
                            sections: [{
                                id: "sec1",
                                type: "hero_single_column",
                                width: "full",
                                background: { color: "#ffffff" },
                                columns: [{
                                    span: 12,
                                    widgets: [{
                                        type: "heading",
                                        content: "Hello World",
                                        imageId: null,
                                        styles: { color: "#000000", typography_font_size: { unit: "px", size: 32 } }
                                    }]
                                }]
                            }]
                        })
                    }]
                }
            }]
        })
    } as any;
};

import { ConversionPipeline } from '../pipeline';

async function runSimulation() {
    console.log('--- Starting Simulation ---');

    const mockNode = {
        id: '1:1',
        name: 'Test Frame',
        type: 'FRAME',
        children: [],
        exportAsync: async () => new Uint8Array([])
    } as any;

    const pipeline = new ConversionPipeline();
    const wpConfig = { url: 'https://test.local', auth: 'mock' };

    try {
        const result = await pipeline.run(mockNode, wpConfig);
        console.log('--- Simulation Result ---');
        console.log(JSON.stringify(result, null, 2));

        if (result.siteurl === 'https://test.local' && result.elements.length > 0) {
            console.log('✅ SUCCESS: Pipeline ran and produced output with correct config.');
        } else {
            console.error('❌ FAILURE: Output mismatch.');
        }

    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

runSimulation();
