import { NodeSnapshot } from "../types";

export function approxEqual(a: number, b: number, tolerance = 2): boolean {
    return Math.abs(a - b) <= tolerance;
}

export function areWidthsRoughlyEqual(widths: number[], tolerance = 12): boolean {
    if (widths.length < 2) return false;
    const min = Math.min(...widths);
    const max = Math.max(...widths);
    return max - min <= tolerance;
}

export function hasAnyText(node: NodeSnapshot): boolean {
    return node.hasText === true;
}

export function isFrameLike(node: NodeSnapshot): boolean {
    return (
        node.type === "FRAME" ||
        node.type === "SECTION" ||
        node.type === "COMPONENT" ||
        node.type === "INSTANCE"
    );
}

export function avg(values: number[]): number {
    if (!values.length) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
}
