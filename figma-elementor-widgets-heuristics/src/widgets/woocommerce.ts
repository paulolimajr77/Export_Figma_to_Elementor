import { Heuristic } from "../types";
import { isFrameLike } from "../heuristics/utils";

/**
 * Heurísticas para widgets WooCommerce (focus em vitrine e produto).
 */

export const WOO_PRODUCT_GRID: Heuristic = {
  id: "widget.woo.product-grid",
  priority: 85,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (node.childCount < 3) return null;
    if (!node.hasChildImage || !node.hasText) return null;

    const widths = node.childrenWidths;
    if (!widths.length) return null;
    const min = Math.min(...widths);
    const max = Math.max(...widths);
    if (max - min > 40) return null;

    return {
      patternId: "widget.woo.product-grid",
      widget: "woo:products-grid",
      confidence: 0.82,
    };
  },
};

export const WOO_SINGLE_PRODUCT_SUMMARY: Heuristic = {
  id: "widget.woo.single-product-summary",
  priority: 82,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.hasText) return null;
    if (node.width < 260) return null;

    const tall = node.height >= 240;
    if (!tall) return null;

    return {
      patternId: "widget.woo.single-product-summary",
      widget: "woo:single-product-summary",
      confidence: 0.78,
    };
  },
};

export const WOO_CART_LIKE: Heuristic = {
  id: "widget.woo.cart-like",
  priority: 70,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.hasText) return null;
    if (node.width < 600) return null;
    if (node.height < 200) return null;

    return {
      patternId: "widget.woo.cart",
      widget: "woo:cart",
      confidence: 0.7,
    };
  },
};

export const WOO_WIDGET_HEURISTICS: Heuristic[] = [
  WOO_PRODUCT_GRID,
  WOO_SINGLE_PRODUCT_SUMMARY,
  WOO_CART_LIKE,
];
