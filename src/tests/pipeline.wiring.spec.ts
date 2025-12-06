/// <reference types="@figma/plugin-typings" />
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConversionPipeline } from '../pipeline';
import type { DeterministicPipeline } from '../core/deterministic/deterministic.pipeline';
import type { PipelineSchema } from '../types/pipeline.schema';
import type { ElementorJSON } from '../types/elementor.types';
import { TelemetryService } from './services/telemetry';


const fakeNode = {
    id: 'node-1',
    name: 'Frame',
    type: 'FRAME'
} as unknown as SceneNode;

const createExecution = (label: string, includeDebug = false) => {
    const schema: PipelineSchema = {
        page: { title: 'Test', tokens: { primaryColor: '#000000', secondaryColor: '#ffffff' } },
        containers: []
    };
    const elementorJson: ElementorJSON = {
        type: 'elementor',
        siteurl: label,
        elements: []
    } as ElementorJSON;
    return {
        elementorJson,
        schema,
        debugInfo: includeDebug ? { label } as any : null
    };
};

describe('ConversionPipeline wiring', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        (globalThis as any).__FIGTOEL_DETERMINISTIC_DIFF = undefined;
    });

    it('defaults to legacy pipeline when deterministic flag is disabled', async () => {
        const pipeline = new ConversionPipeline();
        pipeline.attachDeterministicPipeline({ run: vi.fn() } as unknown as DeterministicPipeline);
        const legacyExecution = createExecution('legacy');
        const deterministicExecution = createExecution('deterministic');

        const legacySpy = vi.spyOn(pipeline as any, 'runLegacyFlow').mockResolvedValue(legacyExecution);
        const deterministicSpy = vi.spyOn(pipeline as any, 'runDeterministicFlow').mockResolvedValue(deterministicExecution);

        const result = await pipeline.run(fakeNode, {}, { useDeterministic: false });
        expect(legacySpy).toHaveBeenCalledTimes(1);
        expect(deterministicSpy).not.toHaveBeenCalled();
        expect(result).toBe(legacyExecution.elementorJson);
    });

    it('uses deterministic pipeline when flag is enabled', async () => {
        const pipeline = new ConversionPipeline();
        pipeline.attachDeterministicPipeline({ run: vi.fn() } as unknown as DeterministicPipeline);
        const deterministicExecution = createExecution('deterministic', true);

        const legacySpy = vi.spyOn(pipeline as any, 'runLegacyFlow').mockResolvedValue(createExecution('legacy'));
        const deterministicSpy = vi.spyOn(pipeline as any, 'runDeterministicFlow').mockResolvedValue(deterministicExecution);

        const result = await pipeline.run(fakeNode, {}, { useDeterministic: true, debug: true });

        expect(deterministicSpy).toHaveBeenCalledTimes(1);
        expect(legacySpy).not.toHaveBeenCalled();
        expect(result).toEqual({ elementorJson: deterministicExecution.elementorJson, debugInfo: deterministicExecution.debugInfo });
    });

    it('diff mode executes both pipelines but keeps legacy output', async () => {
        const pipeline = new ConversionPipeline();
        pipeline.attachDeterministicPipeline({ run: vi.fn() } as unknown as DeterministicPipeline);
        const deterministicExecution = createExecution('deterministic');
        const legacyExecution = createExecution('legacy');

        const deterministicSpy = vi.spyOn(pipeline as any, 'runDeterministicFlow').mockResolvedValue(deterministicExecution);
        const legacySpy = vi.spyOn(pipeline as any, 'runLegacyFlow').mockResolvedValue(legacyExecution);

        const result = await pipeline.run(fakeNode, {}, { useDeterministic: true, deterministicDiffMode: 'log' });

        expect(deterministicSpy).toHaveBeenCalledTimes(1);
        expect(legacySpy).toHaveBeenCalledTimes(1);
        expect(result).toBe(legacyExecution.elementorJson);
    });

    it('telemetry diff records schema comparison when enabled', async () => {
        const pipeline = new ConversionPipeline();
        pipeline.attachDeterministicPipeline({ run: vi.fn() } as unknown as DeterministicPipeline);
        const deterministicExecution = createExecution('deterministic');
        const legacyExecution = createExecution('legacy');

        const deterministicSpy = vi.spyOn(pipeline as any, 'runDeterministicFlow').mockResolvedValue(deterministicExecution);
        const legacySpy = vi.spyOn(pipeline as any, 'runLegacyFlow').mockResolvedValue(legacyExecution);

        const diffSpy = vi.spyOn(TelemetryService.prototype, 'diff').mockResolvedValue();
        vi.spyOn(TelemetryService.prototype, 'log').mockResolvedValue();
        vi.spyOn(TelemetryService.prototype, 'metric').mockResolvedValue();
        vi.spyOn(TelemetryService.prototype, 'snapshot').mockResolvedValue();

        const result = await pipeline.run(fakeNode, {}, {
            useDeterministic: true,
            deterministicDiffMode: 'log',
            telemetry: { enabled: true, storeDiffs: true }
        });

        expect(deterministicSpy).toHaveBeenCalledTimes(1);
        expect(legacySpy).toHaveBeenCalledTimes(1);
        expect(diffSpy).toHaveBeenCalledTimes(1);
        expect(result).toBe(legacyExecution.elementorJson);
    });
});
