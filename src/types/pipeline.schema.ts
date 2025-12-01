export interface PipelineSchema {
    page: {
        title: string;
        tokens: { primaryColor: string; secondaryColor: string };
    };
    containers: PipelineContainer[];
}

export interface PipelineContainer {
    id: string;
    direction: 'row' | 'column';
    width: 'full' | 'boxed';
    styles: Record<string, any>;
    widgets: PipelineWidget[];
    children: PipelineContainer[];
}

export interface PipelineWidget {
    type: string;
    content?: string | null;
    imageId?: string | null;
    styles?: Record<string, any>;
    children?: PipelineWidget[];
    kind?: string;
}
