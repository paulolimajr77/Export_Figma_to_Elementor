import type { SerializerService } from '../../services/serializer';
import type { HeuristicsService } from '../../services/heuristics';
import type { MediaService, ResolvedAsset, MediaResolutionOptions } from '../../services/media';
import type { PipelineSchema } from '../../types/pipeline.schema';
import type { WPConfig } from '../../types/elementor.types';

export interface DeterministicPipelineOptions {
    wpConfig?: WPConfig;
    media?: Pick<MediaResolutionOptions, 'simulate' | 'uploadImages'>;
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

        return { schema, assets: mediaResult.assets };
    }
}
