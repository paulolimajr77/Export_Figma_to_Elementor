export interface PipelineSchema {
    page: PipelinePage;
    containers: PipelineContainer[];
}

export interface PipelinePage {
    title: string;
    tokens: PipelineTokens;
}

export interface PipelineTokens {
    primaryColor: string;
    secondaryColor: string;
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
    type: 'heading' | 'text' | 'button' | 'image' | 'icon' | 'custom';
    content: string | null;
    imageId: string | null;
    styles: Record<string, any>;
    kind?: string;
}
