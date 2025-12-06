
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { convertToFlexSchema } from './pipeline/noai.parser';
import { ElementorCompiler } from './compiler/elementor.compiler';

describe('Debug Reproduction', () => {
    it('should compile debug_figma_input.json to Elementor JSON', () => {
        const inputPath = path.resolve(__dirname, '../debug_figma_input.json');
        const outputPath = path.resolve(__dirname, '../debug_elementor_output.json');

        if (!fs.existsSync(inputPath)) {
            console.error('Input file not found:', inputPath);
            return;
        }

        const inputContent = fs.readFileSync(inputPath, 'utf-8');
        const inputJson = JSON.parse(inputContent);

        console.log('Input JSON parsed. Root ID:', inputJson.id);

        // 1. Convert to Flex Schema
        const schema = convertToFlexSchema(inputJson);
        console.log('Schema generated. Containers:', schema.containers.length);

        // 2. Compile to Elementor
        const compiler = new ElementorCompiler();
        const elementorJson = compiler.compile(schema);

        console.log('Elementor JSON generated.');
        console.log('Root Type:', elementorJson.type);
        const elements = elementorJson.elements || [];
        console.log('Elements count:', elements.length);

        // Write output
        fs.writeFileSync(outputPath, JSON.stringify(elementorJson, null, 2));
        console.log('Output written to:', outputPath);
    });
});
