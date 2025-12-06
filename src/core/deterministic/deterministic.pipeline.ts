import type { SerializerService } from '../../services/serializer';
import type { HeuristicsService } from '../../services/heuristics';
import type { MediaService, ResolvedAsset, MediaResolutionOptions } from '../../services/media';
import type { PipelineSchema } from '../../types/pipeline.schema';
import type { WPConfig } from '../../types/elementor.types';
import type { TelemetryService } from '../../services/telemetry/telemetry.service';

export interface DeterministicPipelineOptions {
    wpConfig?: WPConfig;
    media?: Pick<MediaResolutionOptions, 'simulate' | 'uploadImages'>;
    telemetry?: TelemetryService;
}

export interface DeterministicPipelineResult {
    schema: PipelineSchema;
    assets: ResolvedAsset[];
}

export class DeterministicPipeline {
    constructor(
        private readonly serializer: SerializerService,
        private readonly heuristics: HeuristicsService,
        private readonly media: MediaService
    ) { }

    async run(node: SceneNode, options: DeterministicPipelineOptions = {}): Promise<DeterministicPipelineResult> {
        const telemetry = options.telemetry;
        const start = Date.now();
        telemetry?.log('det_pipeline_start', {
            nodeId: node.id,
            simulate: options.media?.simulate,
            hasWpConfig: !!options.wpConfig
        });

        const serialized = this.serializer.serialize(node);
        let schema = this.heuristics.generateSchema(serialized);
        await this.heuristics.enforceWidgetTypes(schema);

        const simulate = options.media?.simulate ?? !options.wpConfig;
        const mediaOptions: MediaResolutionOptions = { simulate };
        if (options.wpConfig) {
            mediaOptions.wpConfig = options.wpConfig;
        }
        if (options.media?.uploadImages === false) {
            mediaOptions.uploadImages = false;
        }
        const mediaResult = await this.media.resolveImages(schema, mediaOptions);
        schema = mediaResult.schema;

        const duration = Date.now() - start;
        const summary = this.collectSchemaSummary(schema);
        telemetry?.metric('det_pipeline_duration_ms', duration);
        telemetry?.log('det_pipeline_end', {
            duration,
            ...summary
        });
        telemetry?.snapshot('deterministic_schema', schema);

        return { schema, assets: mediaResult.assets };
    }

    private collectSchemaSummary(schema: PipelineSchema) {
        let containers = 0;
        let widgets = 0;
        const walk = (container: PipelineSchema['containers'][number]) => {
            containers += 1;
            widgets += container.widgets?.length || 0;
            container.children?.forEach(walk);
        };
        schema.containers?.forEach(walk);
        return { totalContainers: containers, totalWidgets: widgets };
    }
}
