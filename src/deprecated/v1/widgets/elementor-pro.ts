import { Heuristic } from "../types";
import { isFrameLike } from "../rules/utils";

/**
 * Heurísticas para widgets do Elementor Pro.
 * Muitos widgets são semanticamente parecidos, então aqui focamos em padrões
 * (cards de posts, sliders, forms, etc.).
 */

export const ELEM_PRO_FORM: Heuristic = {
    id: "widget.elementor-pro.form",
    priority: 88,
    match(node) {
        if (!isFrameLike(node)) return null;
        if (!node.isAutoLayout) return null;
        if (!node.hasText) return null;
        if (node.childCount < 2) return null;

        const looksTall = node.height >= 200;
        const manyChildren = node.childCount >= 3;
        if (!looksTall || !manyChildren) return null;

        return {
            patternId: "widget.elementor-pro.form",
            widget: "e:form",
            confidence: 0.78,
        };
    },
};

export const ELEM_PRO_POSTS: Heuristic = {
    id: "widget.elementor-pro.posts",
    priority: 86,
    match(node) {
        if (!isFrameLike(node)) return null;
        if (node.childCount < 3) return null;

        const widths = node.childrenWidths;
        if (!widths.length) return null;
        const min = Math.min(...widths);
        const max = Math.max(...widths);
        if (max - min > 32) return null;

        return {
            patternId: "widget.elementor-pro.posts",
            widget: "e:posts",
            confidence: 0.8,
            meta: { layout: "cards-grid-or-columns" },
        };
    },
};

export const ELEM_PRO_SLIDES: Heuristic = {
    id: "widget.elementor-pro.slides",
    priority: 80,
    match(node) {
        if (!isFrameLike(node)) return null;
        if (!node.hasChildImage) return null;
        if (!node.hasText) return null;
        if (node.width < 600 || node.height < 300) return null;

        return {
            patternId: "widget.elementor-pro.slides",
            widget: "e:slides",
            confidence: 0.75,
        };
    },
};

export const ELEMENTOR_PRO_WIDGET_HEURISTICS: Heuristic[] = [
    ELEM_PRO_FORM,
    ELEM_PRO_POSTS,
    ELEM_PRO_SLIDES,
];
