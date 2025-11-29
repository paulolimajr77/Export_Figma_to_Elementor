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
    /**
     * Tipo canônico do widget (ex: heading, text-editor, video, woo:product-title, etc).
     * Mantido aberto para suportar todos os widgets do Elementor.
     */
    type: string;
    content: string | null;
    imageId: string | null;
    styles: Record<string, any>;
    kind?: string;
}
