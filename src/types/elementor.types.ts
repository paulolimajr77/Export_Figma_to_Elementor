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
    elements: ElementorElement[];
    isInner?: boolean;
}

export interface ElementorTemplate {
    type: 'elementor';
    siteurl: string;
    elements: ElementorElement[];
    version?: string;
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
