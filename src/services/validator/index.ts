import type { PipelineSchema } from '../../types/pipeline.schema';
import type { ElementorJSON } from '../../types/elementor.types';
import type { SerializedNode } from '../../utils/serialization_utils';
import { validatePipelineSchema, validateElementorJSON, computeCoverage } from '../../utils/validation';

export interface ValidationReport {
    warnings: string[];
}

export interface ValidatorService {
    validateSchema(schema: PipelineSchema, root: SerializedNode): ValidationReport;
    validateElementor(json: ElementorJSON): ValidationReport;
    computeCoverage(schema: PipelineSchema, elementor: ElementorJSON): ReturnType<typeof computeCoverage>;
}

export class DefaultValidatorService implements ValidatorService {
    validateSchema(schema: PipelineSchema, root: SerializedNode): ValidationReport {
        try {
            validatePipelineSchema(schema);
            return { warnings: [] };
        } catch (err: any) {
            return { warnings: [err?.message || 'Schema inválido.'] };
        }
    }

    validateElementor(json: ElementorJSON): ValidationReport {
        try {
            validateElementorJSON(json);
            return { warnings: [] };
        } catch (err: any) {
            return { warnings: [err?.message || 'Elementor JSON inválido.'] };
        }
    }

    computeCoverage(schema: PipelineSchema, elementor: ElementorJSON) {
        return computeCoverage([], schema, elementor);
    }
}

export const validatorService = new DefaultValidatorService();
