import { PipelineSchema } from './pipeline.schema';

export interface GenerateSchemaInput {
    prompt: string;
    snapshot: any;
    instructions: string;
    apiKey?: string | undefined;
    image?: {
        data: string; // base64 sem prefixo
        mimeType?: string;
        name?: string;
        width?: number;
        height?: number;
    };
    references?: { name: string; content: string }[];
}

export interface SchemaResponse {
    ok: boolean;
    schema?: PipelineSchema | undefined;
    data?: any;
    message?: string | undefined;
    error?: string | undefined;
    raw?: any;
}

export interface SchemaProvider {
    id: string;
    model: string;
    setModel(model: string): void | Promise<void>;
    generateSchema(input: GenerateSchemaInput): Promise<SchemaResponse>;
    testConnection(apiKey?: string): Promise<{ ok: boolean; message?: string; error?: string; raw?: any }>;
}

export type DeterministicDiffMode = 'log' | 'store';

export interface PipelineTelemetryOptions {
    enabled?: boolean;
    storeDiffs?: boolean;
    storeSnapshots?: boolean;
}

export interface PipelineRunOptions {
    debug?: boolean;
    provider?: SchemaProvider;
    apiKey?: string;
    autoFixLayout?: boolean;
    includeScreenshot?: boolean;
    includeReferences?: boolean;
    autoRename?: boolean;
    useDeterministic?: boolean;
    deterministicDiffMode?: DeterministicDiffMode;
    telemetry?: PipelineTelemetryOptions;
}
