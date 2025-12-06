import { Heuristic } from "../types";
import { isFrameLike } from "./utils";

export const IMAGE_SINGLE: Heuristic = {
    id: "media.image-single",
    priority: 65,
    match(node) {
        const isGeometricShape = node.type === "RECTANGLE" || node.type === "ELLIPSE";
        const children = node.children || [];

        // Cenário 1: O próprio nó tem um preenchimento de imagem.
        // Isso se aplica a Retângulos, Elipses e Frames que são usados como imagens.
        if ((isGeometricShape || isFrameLike(node)) && node.hasImageFill) {
            // Se for um Frame, não deve conter texto nem outros elementos significativos
            // para não ser confundido com um "Image Box" ou um container com background.
            if (isFrameLike(node) && (node.hasText || children.length > 0)) {
                // É um container com imagem de fundo, não um widget de imagem.
                // Outra heurística (de layout/sections) deve tratar disso.
                return null;
            }

            return {
                patternId: "media.image.fill", // ID mais específico
                widget: "image", // Widget de imagem direto
                confidence: 0.85,
                imageId: node.id,
            };
        }

        // Cenário 2: É um frame que age como um contêiner para um único nó de imagem.
        if (isFrameLike(node) && node.hasChildImage && !node.hasText && children.length === 1) {
            const imageChild = children[0];
            return {
                patternId: "media.image.child", // ID mais específico
                widget: "image", // Widget de imagem direto
                confidence: 0.80,
                imageId: imageChild.id,
            };
        }
        
        return null;
    },
};

export const MEDIA_HEURISTICS: Heuristic[] = [
    IMAGE_SINGLE,
];
