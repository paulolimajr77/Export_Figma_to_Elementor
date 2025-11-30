import { Heuristic } from "../types";
import { isFrameLike } from "./utils";

export const HEADER_NAVBAR: Heuristic = {
    id: "navigation.header-navbar",
    priority: 75,
    match(node) {
        if (!isFrameLike(node)) return null;
        if (node.height > 200) return null;
        if (node.width < 900) return null;
        const nearTop = node.y <= 80;
        if (!nearTop) return null;
        if (!node.hasText && !node.hasChildImage) return null;

        return {
            patternId: "navigation.header-navbar",
            widget: "structure:header-navbar",
            confidence: 0.8,
        };
    },
};

export const FOOTER_MAIN: Heuristic = {
    id: "navigation.footer-main",
    priority: 70,
    match(node) {
        if (!isFrameLike(node)) return null;
        if (node.width < 900) return null;
        if (node.height < 160) return null;
        if (!node.hasText) return null;

        return {
            patternId: "navigation.footer-main",
            widget: "structure:footer-main",
            confidence: 0.72,
        };
    },
};

export const NAVIGATION_HEURISTICS: Heuristic[] = [
    HEADER_NAVBAR,
    FOOTER_MAIN,
];
