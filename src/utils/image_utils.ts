/// <reference types="@figma/plugin-typings" />

// Helper para converter RGB para HEX
export function rgbToHex(rgb: { r: number; g: number; b: number }): string {
    const toHex = (c: number) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function getBackgroundFromNode(node: SceneNode): string {
    if ('fills' in node && Array.isArray(node.fills)) {
        for (const fill of node.fills) {
            if (fill.type === 'SOLID') {
                const { r, g, b } = fill.color;
                return rgbToHex({ r, g, b });
            }
        }
    }
    return "#FFFFFF"; // Default se não achar fill sólido
}

export async function extractImagesFromNode(node: SceneNode): Promise<Record<string, Uint8Array>> {
    const images: Record<string, Uint8Array> = {};

    async function traverse(n: SceneNode) {
        if ('fills' in n && Array.isArray(n.fills)) {
            for (const fill of n.fills) {
                if (fill.type === 'IMAGE' && fill.imageHash) {
                    const image = figma.getImageByHash(fill.imageHash);
                    if (image) {
                        const bytes = await image.getBytesAsync();
                        // Usa o hash da imagem como ID para reutilização
                        images[fill.imageHash] = bytes;
                    }
                }
            }
        }
        if ('children' in n) {
            for (const child of n.children) {
                await traverse(child);
            }
        }
    }

    await traverse(node);
    return images;
}
