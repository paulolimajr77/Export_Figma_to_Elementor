import { Heuristic } from "../types";
import { isFrameLike } from "./utils";

export const IMAGE_SINGLE: Heuristic = {
  id: "media.image-single",
  priority: 65,
  match(node) {
    if (node.type === "RECTANGLE" || node.type === "ELLIPSE") {
      if (node.hasImageFill) {
        return {
          patternId: "media.image",
          widget: "structure:image",
          confidence: 0.82,
        };
      }
    }
    if (isFrameLike(node) && node.hasChildImage && !node.hasText) {
      return {
        patternId: "media.image",
        widget: "structure:image",
        confidence: 0.78,
      };
    }
    return null;
  },
};

export const MEDIA_HEURISTICS: Heuristic[] = [
  IMAGE_SINGLE,
];
