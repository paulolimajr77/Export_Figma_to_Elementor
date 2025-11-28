export interface PipelineSchema {
    page: {
        title: string;
        tokens: {
            primaryColor: string;
            secondaryColor: string;
        };
    };
    sections: Section[];
}

export interface Section {
    id: string;
    type: 'hero_two_columns' | 'hero_single_column' | 'grid_3col' | 'grid_4col' | 'card' | 'custom';
    width: 'full' | 'boxed';
    background: {
        color?: string;
        image?: string;
        gradient?: string;
    };
    columns: Column[];
}

export interface Column {
    span: number; // 1-12
    widgets: Widget[];
}

export interface Widget {
    type: 'heading' | 'text' | 'button' | 'image' | 'icon' | 'iconBox' | 'imageBox' | 'list' | 'divider' | 'html' | 'custom';
    content: string | null;
    imageId: string | null;
    styles: {
        [key: string]: any;
    };
}
