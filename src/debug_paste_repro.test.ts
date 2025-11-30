import { describe, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ElementorCompiler } from './compiler/elementor.compiler';
import { convertToFlexSchema } from './pipeline/noai.parser';
import { analyzeTreeWithHeuristics } from './pipeline/noai.parser';

describe('Debug Paste Repro', () => {
    it('should compile debug_paste_input.json to Elementor JSON', async () => {
        const inputPath = path.resolve(__dirname, '../debug_paste_input.json');
        const outputPath = path.resolve(__dirname, '../debug_paste_output.json');

        if (!fs.existsSync(inputPath)) {
            console.warn('Input file not found:', inputPath);
            return;
        }

        const inputJson = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

        // Simulate runPipelineWithoutAI
        const analyzed = analyzeTreeWithHeuristics(inputJson);
        const schema = convertToFlexSchema(analyzed);
        const compiler = new ElementorCompiler();
        const outputJson = compiler.compile(schema);

        fs.writeFileSync(outputPath, JSON.stringify(outputJson, null, 2));
        console.log('Output saved to:', outputPath);
    });
});
