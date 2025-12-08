/**
 * Card CSS Generator
 * 
 * Generates custom CSS for card-style widgets (icon-box, image-box)
 * that don't have native controls for background, border, and radius in Elementor.
 */

import { normalizeColor } from './style_normalizer';

export interface CardStyleInput {
    fills?: Array<{
        type: string;
        color?: { r: number; g: number; b: number };
        opacity?: number;
        visible?: boolean;
    }>;
    strokes?: Array<{
        type: string;
        color?: { r: number; g: number; b: number };
        opacity?: number;
    }>;
    strokeWeight?: number;
    cornerRadius?: number | { topLeft?: number; topRight?: number; bottomRight?: number; bottomLeft?: number };
}

/**
 * Converts RGB object (0-1 scale) to hex string
 * @param color - RGB object with r, g, b values (0-1 scale)
 * @returns Hex color string like #FFFFFF
 */
export function rgbToHex(color: { r: number; g: number; b: number }): string {
    const r = Math.round((color.r || 0) * 255);
    const g = Math.round((color.g || 0) * 255);
    const b = Math.round((color.b || 0) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

/**
 * Converts RGB object (0-1 scale) to rgba string
 * @param color - RGB object with r, g, b values (0-1 scale)
 * @param alpha - Opacity value (0-1)
 * @returns RGBA color string like rgba(255, 255, 255, 0.05)
 */
export function rgbToRgba(color: { r: number; g: number; b: number }, alpha: number = 1): string {
    const r = Math.round((color.r || 0) * 255);
    const g = Math.round((color.g || 0) * 255);
    const b = Math.round((color.b || 0) * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generates custom CSS string for card frames
 * Uses 'selector' placeholder which Elementor replaces with actual widget selector
 * 
 * @param node - Node with fills, strokes, and cornerRadius properties
 * @returns CSS string like "selector { background-color:#111; border-radius:24px; }" or null
 */
export function generateCardCustomCSS(node: CardStyleInput): string | null {
    const cssRules: string[] = [];

    // 1. Background from fills (SOLID only for now)
    if (node.fills && Array.isArray(node.fills)) {
        const solidFill = node.fills.find(f =>
            f.type === 'SOLID' &&
            f.visible !== false &&
            f.color
        );

        if (solidFill && solidFill.color) {
            const opacity = solidFill.opacity ?? 1;
            if (opacity >= 1) {
                // Use hex for fully opaque colors
                cssRules.push(`background-color: ${rgbToHex(solidFill.color)}`);
            } else {
                // Use rgba for transparent colors
                cssRules.push(`background-color: ${rgbToRgba(solidFill.color, opacity)}`);
            }
        }
    }

    // 2. Border from strokes
    if (node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke.type === 'SOLID' && stroke.color) {
            const strokeWeight = node.strokeWeight || 1;
            const opacity = stroke.opacity ?? 1;
            const borderColor = rgbToRgba(stroke.color, opacity);
            cssRules.push(`border: ${strokeWeight}px solid ${borderColor}`);
        }
    }

    // 3. Border radius
    if (node.cornerRadius !== undefined && node.cornerRadius !== null) {
        if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
            cssRules.push(`border-radius: ${node.cornerRadius}px`);
            cssRules.push(`overflow: hidden`); // Clip content to rounded corners
        } else if (typeof node.cornerRadius === 'object') {
            // Individual corner radii
            const { topLeft = 0, topRight = 0, bottomRight = 0, bottomLeft = 0 } = node.cornerRadius;
            if (topLeft > 0 || topRight > 0 || bottomRight > 0 || bottomLeft > 0) {
                cssRules.push(`border-radius: ${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`);
                cssRules.push(`overflow: hidden`);
            }
        }
    }

    // If no rules, return null
    if (cssRules.length === 0) {
        return null;
    }

    // Format with selector placeholder
    return `selector {\n  ${cssRules.join(';\n  ')};\n}`;
}

/**
 * Extracts visual styles from a frame node for card widgets
 * @param node - Figma node with fills, strokes, cornerRadius
 * @returns Object with backgroundColor, borderColor, borderRadius, or null if no styles
 */
export function extractCardStyles(node: CardStyleInput): {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
} | null {
    const styles: any = {};
    let hasStyles = false;

    // Background
    if (node.fills && Array.isArray(node.fills)) {
        const solidFill = node.fills.find(f =>
            f.type === 'SOLID' &&
            f.visible !== false &&
            f.color
        );
        if (solidFill && solidFill.color) {
            styles.backgroundColor = normalizeColor(solidFill.color);
            hasStyles = true;
        }
    }

    // Border
    if (node.strokes && Array.isArray(node.strokes) && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke.type === 'SOLID' && stroke.color) {
            styles.borderColor = rgbToRgba(stroke.color, stroke.opacity ?? 1);
            styles.borderWidth = node.strokeWeight || 1;
            hasStyles = true;
        }
    }

    // Radius
    if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
        styles.borderRadius = node.cornerRadius;
        hasStyles = true;
    }

    return hasStyles ? styles : null;
}
