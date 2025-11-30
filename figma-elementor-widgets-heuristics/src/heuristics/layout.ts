import { Heuristic } from "../types";
import { areWidthsRoughlyEqual, isFrameLike } from "./utils";

export const LAYOUT_COLUMNS: Heuristic = {
  id: "layout.columns",
  priority: 70,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.isAutoLayout) return null;
    if (node.direction !== "HORIZONTAL") return null;
    if (node.childCount < 2) return null;

    if (!areWidthsRoughlyEqual(node.childrenWidths)) return null;

    let patternId = "layout.columnsN";
    if (node.childCount === 2) patternId = "layout.columns2";
    else if (node.childCount === 3) patternId = "layout.columns3";
    else if (node.childCount === 4) patternId = "layout.columns4";

    return {
      patternId,
      widget: "structure:columns",
      confidence: 0.8,
      meta: { columns: node.childCount },
    };
  },
};

export const LAYOUT_GRID: Heuristic = {
  id: "layout.grid",
  priority: 68,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (node.childCount < 3) return null;

    const widths = node.childrenWidths;
    if (!widths.length) return null;

    const min = Math.min(...widths);
    const max = Math.max(...widths);
    if (max - min > 24) return null;

    return {
      patternId: "layout.grid",
      widget: "structure:grid",
      confidence: 0.77,
    };
  },
};

export const LAYOUT_HEURISTICS: Heuristic[] = [
  LAYOUT_COLUMNS,
  LAYOUT_GRID,
];
