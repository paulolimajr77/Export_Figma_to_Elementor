import { Heuristic } from "../types";
import { isFrameLike } from "./utils";

export const SECTION_GENERIC: Heuristic = {
  id: "section.generic",
  priority: 60,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (node.width < 900) return null;
    if (node.height < 180) return null;

    return {
      patternId: "section.generic",
      widget: "structure:section",
      confidence: 0.75,
    };
  },
};

export const SECTION_HERO: Heuristic = {
  id: "section.hero",
  priority: 85,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (node.width < 900) return null;
    if (node.height < 380) return null;
    if (!node.hasText) return null;

    const hasVisual = node.hasBackground || node.hasChildImage;
    if (!hasVisual) return null;

    const bigText = (node.textFontSizeMax ?? 0) >= 32;
    if (!bigText) return null;

    return {
      patternId: "section.hero",
      widget: "structure:section-hero",
      confidence: 0.86,
    };
  },
};

export const SECTION_CTA: Heuristic = {
  id: "section.cta",
  priority: 80,
  match(node) {
    if (!isFrameLike(node)) return null;
    if (!node.hasText) return null;
    if (node.height < 140 || node.height > 520) return null;
    if (!node.hasBackground && !node.hasBorder) return null;

    const bigText = (node.textFontSizeMax ?? 0) >= 20;
    if (!bigText) return null;

    return {
      patternId: "section.cta",
      widget: "structure:section-cta",
      confidence: 0.8,
    };
  },
};

export const SECTION_HEURISTICS: Heuristic[] = [
  SECTION_HERO,
  SECTION_CTA,
  SECTION_GENERIC,
];
