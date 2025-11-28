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
    type: 'heading' | 'text' | 'button' | 'image' | 'icon' | 'custom' | 'slides';
    content: string | null;
    imageId: string | null;
    styles: Record<string, any>;
    /**
     * Sugestão opcional de widget mais rico (ex.: "image_box_like", "icon_box_like", "slides_like", "woo_product_like").
     * Não obrigatório; serve para o registry decidir um widget Elementor mais específico.
     */
    kind?: string;
    // Coleções opcionais para widgets complexos
    items?: any[];
    slides?: SlideItem[];
    tabs?: any[];
    accordionItems?: any[];
    toggleItems?: any[];
    galleryItems?: any[];
    loopItems?: any[];
    testimonials?: any[];
    priceTables?: any[];
    priceListItems?: any[];
    formFields?: any[];
}

export interface SlideItem {
    id?: string;
    title?: string;
    description?: string;
    imageId?: string;
    image?: string;
    backgroundColor?: string;
    overlayColor?: string;
    contentAlign?: 'left' | 'center' | 'right';
    callToAction?: { text: string; link?: string };
}
