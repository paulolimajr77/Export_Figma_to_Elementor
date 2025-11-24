/**
 * Converte uma cor sólida do Figma para formato RGBA CSS
 * @param paint Paint sólido do Figma
 * @returns String no formato rgba(r, g, b, a)
 */
export function convertColor(paint: SolidPaint): string {
    if (!paint || paint.type !== 'SOLID') return '';

    const { r, g, b } = paint.color;
    const a = paint.opacity !== undefined ? paint.opacity : 1;

    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

/**
 * Converte valores RGB e alpha para hexadecimal
 * @param r Vermelho (0-255)
 * @param g Verde (0-255)
 * @param b Azul (0-255)
 * @param a Alpha (0-1)
 * @returns String hexadecimal
 */
export function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    if (a < 1) {
        return hex + toHex(a * 255);
    }

    return hex;
}
