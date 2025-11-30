import { Heuristic } from "../types";
import { hasAnyText, isFrameLike } from "../heuristics/utils";

/**
 * Heurísticas específicas para widgets nativos do Elementor (free).
 */

export const ELEM_HEADING: Heuristic = {
  id: "widget.elementor.heading",
  priority: 90,
  match(node) {
    if (node.type !== "TEXT") return null;
    if (!hasAnyText(node)) return null;

    const sizeMax = node.textFontSizeMax ?? 0;
    const lineCount = node.textLineCount ?? 1;
    const isBold = node.textIsBoldDominant ?? false;

    if (sizeMax < 22) return null;
    if (lineCount > 3) return null;
    if (!isBold) return null;

    return {
      patternId: "widget.elementor.heading",
      widget: "w:heading",
      confidence: 0.9,
      meta: { levelGuess: sizeMax >= 32 ? "h1-h2" : "h3" },
    };
  },
};

export const ELEM_TEXT_EDITOR: Heuristic = {
  id: "widget.elementor.text-editor",
  priority: 85,
  match(node) {
    if (node.type !== "TEXT") return null;
    if (!hasAnyText(node)) return null;

    const sizeMax = node.textFontSizeMax ?? 0;
    const lineCount = node.textLineCount ?? 1;

    if (sizeMax > 22) return null;
    if (lineCount < 2) return null;

    return {
      patternId: "widget.elementor.text-editor",
      widget: "w:text-editor",
      confidence: 0.85,
    };
  },
};

export const ELEM_IMAGE: Heuristic = {
  id: "widget.elementor.image",
  priority: 80,
  match(node) {
    if (node.type === "RECTANGLE" || node.type === "ELLIPSE") {
      if (node.hasImageFill) {
        return {
          patternId: "widget.elementor.image",
          widget: "w:image",
          confidence: 0.88,
        };
      }
    }
    if (isFrameLike(node) && node.hasChildImage && !node.hasText) {
      return {
        patternId: "widget.elementor.image",
        widget: "w:image",
        confidence: 0.8,
      };
    }
    return null;
  },
};

export const ELEM_BUTTON: Heuristic = {
  id: "widget.elementor.button",
  priority: 90,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.isAutoLayout) return null;
    if (!node.hasBackground) return null;
    if (!node.hasText) return null;

    if (node.height < 28 || node.height > 72) return null;
    if (node.width < 80) return null;

    const paddingH = (node.paddingLeft + node.paddingRight) / 2;
    if (paddingH < 10) return null;

    return {
      patternId: "widget.elementor.button",
      widget: "w:button",
      confidence: 0.9,
    };
  },
};

export const ELEM_ICON: Heuristic = {
  id: "widget.elementor.icon",
  priority: 70,
  match(node) {
    const isIconShape = node.type === "ELLIPSE" || node.type === "VECTOR" || node.type === "INSTANCE";
    if (!isIconShape) return null;
    if (node.width > 128 || node.height > 128) return null;

    return {
      patternId: "widget.elementor.icon",
      widget: "w:icon",
      confidence: 0.78,
    };
  },
};

export const ELEM_ICON_BOX: Heuristic = {
  id: "widget.elementor.icon-box",
  priority: 78,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.isAutoLayout) return null;
    if (node.direction !== "VERTICAL") return null;
    if (!node.hasText) return null;
    if (!node.hasChildImage) return null;
    if (node.childCount < 2 || node.childCount > 4) return null;

    return {
      patternId: "widget.elementor.icon-box",
      widget: "w:icon-box",
      confidence: 0.8,
    };
  },
};

export const ELEM_IMAGE_BOX: Heuristic = {
  id: "widget.elementor.image-box",
  priority: 78,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.isAutoLayout) return null;
    if (node.direction !== "VERTICAL") return null;
    if (!node.hasText) return null;
    if (!node.hasChildImage) return null;
    if (node.childCount < 2 || node.childCount > 4) return null;

    return {
      patternId: "widget.elementor.image-box",
      widget: "w:image-box",
      confidence: 0.8,
    };
  },
};

export const ELEM_DIVIDER: Heuristic = {
  id: "widget.elementor.divider",
  priority: 65,
  match(node) {
    if (node.height > 4 && node.width < 200) return null;
    if (!node.hasBorder && !node.hasBackground) return null;

    return {
      patternId: "widget.elementor.divider",
      widget: "w:divider",
      confidence: 0.7,
    };
  },
};

export const ELEM_SPACER: Heuristic = {
  id: "widget.elementor.spacer",
  priority: 50,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (node.childCount !== 0) return null;
    if (!node.hasBackground && !node.hasBorder) return null;
    if (node.height >= 8 && node.height <= 80 && node.width >= 16) {
      return {
        patternId: "widget.elementor.spacer",
        widget: "w:spacer",
        confidence: 0.65,
      };
    }
    return null;
  },
};

export const ELEMENTOR_BASIC_WIDGET_HEURISTICS: Heuristic[] = [
  ELEM_HEADING,
  ELEM_TEXT_EDITOR,
  ELEM_IMAGE,
  ELEM_BUTTON,
  ELEM_ICON,
  ELEM_ICON_BOX,
  ELEM_IMAGE_BOX,
  ELEM_DIVIDER,
  ELEM_SPACER,
];
