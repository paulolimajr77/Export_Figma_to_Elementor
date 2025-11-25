// TypeScript interfaces for micro-prompts conversation state

export type ConversationPhase = 'init' | 'nomenclatures' | 'conversion' | 'consolidation';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Estado da conversação com a IA
 */
export interface ConversationState {
    phase: ConversationPhase;
    processedNodes: ProcessedNode[];
    currentNodeIndex: number;
    totalNodes: number;
}

/**
 * Node processado pela IA
 */
export interface ProcessedNode {
    nodeId: string;
    widget: string;
    confidence: ConfidenceLevel;
    settings: ElementorSettings;
    reasoning?: string;
    // Para nodes customizados
    reason?: string;
    suggestion?: string;
}

/**
 * Settings do Elementor para um widget
 */
export interface ElementorSettings {
    layout?: LayoutSettings;
    style?: StyleSettings;
    typography?: TypographySettings;
    [key: string]: any; // Permite propriedades adicionais
}

export interface LayoutSettings {
    content_width?: string;
    flex_direction?: 'row' | 'column';
    justify_content?: string;
    align_items?: string;
    gap?: { size: number; unit: string };
    padding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
        unit: string;
    };
    margin?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
        unit: string;
    };
}

export interface StyleSettings {
    background_color?: string;
    background_image?: string;
    border_radius?: { size: number; unit: string };
    box_shadow?: {
        horizontal: number;
        vertical: number;
        blur: number;
        spread: number;
        color: string;
    };
    opacity?: number;
}

export interface TypographySettings {
    font_family?: string;
    font_size?: { size: number; unit: string };
    font_weight?: string | number;
    line_height?: { size: number; unit: string };
    letter_spacing?: { size: number; unit: string };
    text_color?: string;
}

/**
 * Output final da conversão
 */
export interface FinalOutput {
    elementorJSON: ElementorJSON;
    report: TechnicalReport;
    devModeData?: DevModeData;
}

export interface ElementorJSON {
    version: string;
    elements: ElementorElement[];
}

export interface ElementorElement {
    id: string;
    elType: string;
    settings: ElementorSettings;
    elements?: ElementorElement[];
}

/**
 * Relatório técnico da conversão
 */
export interface TechnicalReport {
    summary: {
        totalNodes: number;
        convertedNodes: number;
        customNodes: number;
        warnings: number;
    };
    mappings: NodeMapping[];
    customNodes: CustomNode[];
    warnings: Warning[];
}

export interface NodeMapping {
    figmaNode: string;
    elementorWidget: string;
    confidence: ConfidenceLevel;
}

export interface CustomNode {
    id: string;
    reason: string;
    suggestion: string;
    rawProperties: any;
}

export interface Warning {
    type: string;
    message: string;
    recommendation?: string;
}

export interface DevModeData {
    globalTokens?: Record<string, any>;
    cssSnippets?: Record<string, string>;
    tailwindClasses?: Record<string, string>;
}
