export type PageZone = 'HEADER' | 'HERO' | 'BODY' | 'FOOTER';

export interface NodeFeatures {
    id: string;
    name: string;
    type: string;
    width: number;
    height: number;
    x: number;
    y: number;
    area: number;

    // Estrutura
    childCount: number;
    layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    primaryAxisSizingMode: 'FIXED' | 'AUTO' | undefined;
    counterAxisSizingMode: 'FIXED' | 'AUTO' | undefined;
    hasNestedFrames: boolean;

    // Aparência
    hasFill: boolean;
    hasStroke: boolean;
    hasText: boolean;
    textCount: number;
    hasImage: boolean;
    imageCount: number;

    // Tipografia (para TEXT nodes ou containers com texto)
    textLength: number;
    fontSize: number;
    fontWeight: number;

    // Vector/Icon specific
    isVectorNode: boolean;
    vectorWidth: number;
    vectorHeight: number;

    // Layout context
    parentLayoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    siblingCount: number;

    // Derivados
    aspectRatio: number;
    zone: PageZone;
}

export interface StructuralIssue {
    severity: 'critical' | 'warning' | 'info';
    message: string;
    fixAvailable: boolean;
}

export interface MatchCandidate {
    widget: string;
    score: number; // 0.0 a 1.0
    ruleId: string;
    reasons?: string[];
}

export interface AnalysisResult {
    nodeId: string;
    nodeName: string;
    bestMatch: MatchCandidate | null;
    alternatives: MatchCandidate[];
    structuralIssues: StructuralIssue[];
}

/**
 * Regra heurística pura: recebe NodeFeatures e retorna um MatchCandidate
 * ou null se não houver match significativo.
 *
 * Importante: regras NÃO devem acessar diretamente a API do Figma.
 * Trabalham apenas com NodeFeatures e retornam um score.
 */
export interface HeuristicRule {
    id: string;
    targetWidget: string;
    evaluate(features: NodeFeatures): MatchCandidate | null;
}
