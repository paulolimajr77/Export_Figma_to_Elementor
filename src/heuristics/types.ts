/**
 * Tipos centrais usados pelo motor de heurísticas.
 * Adapte o preenchimento de NodeSnapshot à sua camada de leitura do Figma.
 */

export type AxisDirection = "HORIZONTAL" | "VERTICAL" | "NONE";

export interface NodeSnapshot {
    id: string;
    name: string;
    type: "FRAME" | "GROUP" | "RECTANGLE" | "TEXT" | "ELLIPSE" | "VECTOR" | "INSTANCE" | "COMPONENT" | "SECTION";

    width: number;
    height: number;

    x: number;
    y: number;

    isVisible: boolean;

    // Auto layout
    isAutoLayout: boolean;
    direction: AxisDirection;
    spacing: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;

    // Estilo visual agregado
    hasBackground: boolean;
    backgroundOpacity: number;
    hasBorder: boolean;
    borderRadius: number;
    hasShadow: boolean;

    // Texto agregado
    hasText: boolean;
    textFontSizeMax?: number;
    textFontSizeMin?: number;
    textIsBoldDominant?: boolean;
    textLineCount?: number;

    // Imagens
    hasImageFill: boolean;     // node é imagem de fundo
    hasChildImage: boolean;    // algum filho contém imagem / ícone vetorial relevante

    // Conteúdo / crianças
    childCount: number;
    childrenTypes: string[];
    childrenWidths: number[];
    childrenHeights: number[];
    childrenAlignment: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY" | "MIXED";

    // Repetição / grid
    repetitionGroupId?: string;
    isRowItemLike?: boolean;
    isColumnItemLike?: boolean;

    // Contexto de página
    parentId?: string;
    parentIsSectionLike?: boolean;
    parentIsHeroLike?: boolean;
    siblingCount?: number;

    // Meta adicional opcional que você pode preencher
    meta?: Record<string, unknown>;
}

export interface HeuristicResult {
    patternId: string;        // ex: "widget.elementor.heading", "section.hero"
    widget: string;           // ex: "w:heading", "wp:recent-posts", "woo:product-price"
    confidence: number;       // 0..1
    meta?: Record<string, unknown>;
}

export interface Heuristic {
    id: string;
    priority: number;         // 0..100 (maior = mais forte)
    match(node: NodeSnapshot): HeuristicResult | null;
}
