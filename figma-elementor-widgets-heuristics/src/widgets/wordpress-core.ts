import { Heuristic } from "../types";
import { isFrameLike } from "../heuristics/utils";

/**
 * Heurísticas para widgets nativos do WordPress.
 * Muitos são listas de links, por isso a detecção é aproximada.
 */

export const WP_SEARCH: Heuristic = {
  id: "widget.wp.search",
  priority: 70,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.isAutoLayout) return null;
    if (node.childCount < 1 || node.childCount > 3) return null;

    if (!node.hasText) return null;
    if (node.height < 40 || node.height > 120) return null;

    return {
      patternId: "widget.wp.search",
      widget: "wp:search",
      confidence: 0.65,
    };
  },
};

export const WP_RECENT_POSTS_LIST: Heuristic = {
  id: "widget.wp.recent-posts",
  priority: 60,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.isAutoLayout) return null;
    if (node.direction !== "VERTICAL") return null;
    if (!node.hasText) return null;
    if (node.childCount < 3) return null;

    return {
      patternId: "widget.wp.recent-posts",
      widget: "wp:recent-posts",
      confidence: 0.6,
    };
  },
};

export const WP_CATEGORIES_LIST: Heuristic = {
  id: "widget.wp.categories",
  priority: 60,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.isAutoLayout) return null;
    if (node.direction !== "VERTICAL") return null;
    if (!node.hasText) return null;
    if (node.childCount < 3) return null;

    return {
      patternId: "widget.wp.categories",
      widget: "wp:categories",
      confidence: 0.55,
    };
  },
};

export const WORDPRESS_CORE_WIDGET_HEURISTICS: Heuristic[] = [
  WP_SEARCH,
  WP_RECENT_POSTS_LIST,
  WP_CATEGORIES_LIST,
];
