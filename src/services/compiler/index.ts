import type { PipelineSchema } from '../../types/pipeline.schema';
import type { ElementorJSON, WPConfig } from '../../types/elementor.types';
import { ElementorCompiler } from '../../compiler/elementor.compiler';

export interface CompilerService {
    setWPConfig(config: WPConfig): void;
    compile(schema: PipelineSchema): ElementorJSON;
}

export class DefaultCompilerService implements CompilerService {
    private readonly compiler: ElementorCompiler;

    constructor(compiler?: ElementorCompiler) {
        this.compiler = compiler || new ElementorCompiler();
    }

    setWPConfig(config: WPConfig): void {
        this.compiler.setWPConfig(config);
    }

    compile(schema: PipelineSchema): ElementorJSON {
        return this.compiler.compile(schema);
    }
}

export const compilerService = new DefaultCompilerService();
