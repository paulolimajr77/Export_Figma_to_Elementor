import { Heuristic } from "../types";
import { hasAnyText } from "./utils";

/**
 * Heurísticas de tipografia genérica.
 * Widgets específicos (Elementor, WP, Woo) ficam em src/widgets.
 */

export const HEADING_GENERIC: Heuristic = {
    id: "typography.heading-generic",
    priority: 80,
    match(node) {
        if (node.type !== "TEXT") return null;
        if (!hasAnyText(node)) return null;

        const sizeMax = node.textFontSizeMax ?? 0;
        const lineCount = node.textLineCount ?? 1;

        if (sizeMax < 20) return null;
        if (lineCount > 3) return null;

        return {
            patternId: "typography.heading",
            widget: "w:heading",
            confidence: 0.85,
        };
    },
};

export const PARAGRAPH_GENERIC: Heuristic = {
    id: "typography.paragraph-generic",
    priority: 60,
    match(node) {
        if (node.type !== "TEXT") return null;
        if (!hasAnyText(node)) return null;

        const sizeMax = node.textFontSizeMax ?? 0;
        const sizeMin = node.textFontSizeMin ?? sizeMax;
        const lineCount = node.textLineCount ?? 1;

        if (sizeMax > 22) return null;
        if (sizeMin < 10) return null;
        if (lineCount < 2) return null;

        return {
            patternId: "typography.paragraph",
            widget: "w:text",
            confidence: 0.8,
        };
    },
};

export const TYPOGRAPHY_HEURISTICS: Heuristic[] = [
    HEADING_GENERIC,
    PARAGRAPH_GENERIC,
];
