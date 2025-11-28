// Tipos e Interfaces Centralizadas do Elementor
// Centraliza todas as definições de tipos para melhor reutilização e manutenção

/**
 * Configuração do WordPress para upload de mídia
 */
export interface WPConfig {
    url?: string;
    user?: string;
    password?: string;
    autoMenu?: boolean;
}

/**
 * Settings de um elemento Elementor (propriedades CSS, conteúdo, etc)
 */
export interface ElementorSettings {
    [key: string]: any;
}

/**
 * Elemento Elementor (container ou widget)
 */
export interface ElementorElement {
    id: string;
    elType: string;
    widgetType?: string;
    settings: ElementorSettings;
    elements: ElementorElement[];
    isInner?: boolean;
}

/**
 * Template completo do Elementor
 */
export interface ElementorTemplate {
    type: "elementor";
    siteurl: string;
    elements: ElementorElement[];
    version?: string; // Optional now
    page_settings?: ElementorSettings; // Optional
}

export type ElementorJSON = ElementorTemplate;

/**
 * Tipos de nós do Figma que possuem propriedades geométricas
 */
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

/**
 * Resultado da exportação de imagem
 */
export interface ImageExportResult {
    bytes: Uint8Array;
    mime: string;
    ext: string;
    needsConversion?: boolean;
}

/**
 * Tipos de container Elementor
 */
export type ContainerType = 'external' | 'inner' | 'normal';

/**
 * Posição relativa para Image Box
 */
export type RelativePosition = 'top' | 'left' | 'right';

/**
 * Formatos de exportação de imagem
 */
export type ImageFormat = 'WEBP' | 'PNG' | 'SVG' | 'JPG';

/**
 * Item de menu de navegação
 */
export interface NavMenuItem {
    id: string;
    name: string;
    items?: any[];
}

/**
 * Padrão de widget para análise estrutural
 */
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

/**
 * Resultado de match de widget
 */
export interface WidgetMatch {
    pattern: WidgetPattern;
    score: number;
    method: 'structural' | 'ai' | 'hybrid';
    confidence: number;
    reasoning?: string;
}

/**
 * Configuração para análise híbrida
 */
export interface HybridConfig {
    structuralThreshold: number;
    useAIFallback: boolean;
    cacheEnabled: boolean;
    apiKey?: string;
    model?: string;
}

/**
 * Resultado de análise híbrida
 */
export interface HybridAnalysisResult {
    matches: WidgetMatch[];
    method: 'structural' | 'ai' | 'hybrid';
    processingTime: number;
}

