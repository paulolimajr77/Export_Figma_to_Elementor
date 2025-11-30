// Tipos e Interfaces Centralizadas do Elementor
// Centraliza definicoes de tipos para melhor reutilizacao e manutencao

export interface WPConfig {
    url?: string;
    user?: string;
    password?: string; // legado
    token?: string;    // senha de aplicacao / token
    exportImages?: boolean;
    autoPage?: boolean;
    autoMenu?: boolean;
}

export interface ElementorSettings {
    [key: string]: any;
}

export interface ElementorElement {
    id: string;
    elType: string;
    widgetType?: string;
    settings: ElementorSettings;
    defaultEditSettings?: any;
    elements: ElementorElement[];
    isInner?: boolean;
    isLocked?: boolean;
}

export interface ElementorTemplate {
    type: 'elementor' | 'page';
    /**
     * URL do site de origem (usada pelo Elementor para validacao de copia entre sites).
     */
    siteurl?: string;
    /**
     * Titulo do template/pagina exportada.
     */
    title?: string;
    /**
     * Versao do schema Elementor (ex.: "0.4").
     */
    version?: string;
    /**
     * Conteudo raiz do template. O Elementor espera o array em `content`,
     * mas mantemos `elements` por compatibilidade interna.
     */
    content?: ElementorElement[];
    elements?: ElementorElement[];
    page_settings?: ElementorSettings;
}

export type ElementorJSON = ElementorTemplate;

export type GeometryNode =
    | RectangleNode
    | EllipseNode
    | PolygonNode
    | StarNode
    | VectorNode
    | TextNode
    | FrameNode
    | ComponentNode
    | InstanceNode
    | BooleanOperationNode
    | LineNode;

export interface ImageExportResult {
    bytes: Uint8Array;
    mime: string;
    ext: string;
    needsConversion?: boolean;
}

export type ContainerType = 'external' | 'inner' | 'normal';

export type RelativePosition = 'top' | 'left' | 'right';

export type ImageFormat = 'WEBP' | 'PNG' | 'SVG' | 'JPG';

export interface NavMenuItem {
    id: string;
    name: string;
    items?: any[];
}

export interface WidgetPattern {
    name: string;
    tag: string;
    minScore: number;
    category: 'basic' | 'pro' | 'woocommerce' | 'wordpress';
    structure: {
        rootType: string[];
        childCount?: {
            min?: number;
            max?: number;
            exact?: number;
        };
        requiredChildren?: {
            type: string;
            count: number;
        }[];
        properties?: {
            hasAutoLayout?: boolean;
            layoutMode?: 'HORIZONTAL' | 'VERTICAL';
            hasImage?: boolean;
            hasIcon?: boolean;
            hasText?: boolean;
            textCount?: number;
            hasPadding?: boolean;
            hasBorderRadius?: boolean;
            hasBackground?: boolean;
        };
    };
    scoreFunction?: (node: SceneNode) => number;
}

export interface WidgetMatch {
    pattern: WidgetPattern;
    score: number;
    method: 'structural' | 'ai' | 'hybrid';
    confidence: number;
    reasoning?: string;
}

export interface HybridConfig {
    structuralThreshold: number;
    useAIFallback: boolean;
    cacheEnabled: boolean;
    apiKey?: string;
    model?: string;
}

export interface HybridAnalysisResult {
    matches: WidgetMatch[];
    method: 'structural' | 'ai' | 'hybrid';
    processingTime: number;
}
