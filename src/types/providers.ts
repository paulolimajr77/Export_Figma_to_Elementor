import { PipelineSchema } from './pipeline.schema';

export interface GenerateSchemaInput {
    prompt: string;
    snapshot: any;
    instructions: string;
    apiKey?: string;
}

export interface SchemaResponse {
    ok: boolean;
    schema?: PipelineSchema;
    message?: string;
    raw?: any;
}

export interface SchemaProvider {
    id: string;
    model: string;
    setModel(model: string): void | Promise<void>;
    generateSchema(input: GenerateSchemaInput): Promise<SchemaResponse>;
    testConnection(apiKey?: string): Promise<{ ok: boolean; message: string; raw?: any }>;
}
