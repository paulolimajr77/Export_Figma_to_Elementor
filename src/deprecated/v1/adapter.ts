import { NodeSnapshot, AxisDirection } from "./types";

export function createNodeSnapshot(node: SceneNode): NodeSnapshot {
    const { width, height, x, y } = node;

    // Basic properties
    const snapshot: NodeSnapshot = {
        id: node.id,
        name: node.name,
        type: node.type as any,
        width,
        height,
        x,
        y,
        isVisible: node.visible,
        isAutoLayout: false,
        direction: "NONE",
        spacing: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        hasBackground: false,
        backgroundOpacity: 0,
        hasBorder: false,
        borderRadius: 0,
        hasShadow: false,
        hasText: false,
        hasImageFill: false,
        hasChildImage: false,
        childCount: 0,
        childrenTypes: [],
        childrenWidths: [],
        childrenHeights: [],
        childrenAlignment: "MIXED",
    };

    // Auto Layout & Frame properties
    if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE" || node.type === "SECTION") {
        const frame = node as FrameNode;
        if (frame.layoutMode !== "NONE") {
            snapshot.isAutoLayout = true;
            snapshot.direction = frame.layoutMode as AxisDirection;
            snapshot.spacing = frame.itemSpacing;
            snapshot.paddingTop = frame.paddingTop;
            snapshot.paddingRight = frame.paddingRight;
            snapshot.paddingBottom = frame.paddingBottom;
            snapshot.paddingLeft = frame.paddingLeft;
        }

        // Background
        if (Array.isArray(frame.fills)) {
            const solid = frame.fills.find((f) => f.type === "SOLID");
            if (solid) {
                snapshot.hasBackground = true;
                snapshot.backgroundOpacity = solid.opacity ?? 1;
            }
            const image = frame.fills.find((f) => f.type === "IMAGE");
            if (image) snapshot.hasImageFill = true;
        }

        // Border
        if (Array.isArray(frame.strokes) && frame.strokes.length > 0) {
            snapshot.hasBorder = true;
        }

        // Radius
        if (typeof frame.cornerRadius === "number") {
            snapshot.borderRadius = frame.cornerRadius;
        }

        // Effects (Shadow)
        if (Array.isArray(frame.effects)) {
            snapshot.hasShadow = frame.effects.some((e) => e.type === "DROP_SHADOW" && e.visible);
        }

        // Children Analysis
        snapshot.childCount = frame.children.length;
        snapshot.childrenTypes = frame.children.map((c) => c.type);
        snapshot.childrenWidths = frame.children.map((c) => c.width);
        snapshot.childrenHeights = frame.children.map((c) => c.height);

        // Deep check for text and images in children
        let textCount = 0;
        let imageCount = 0;
        let maxFontSize = 0;
        let minFontSize = 9999;
        let isBold = false;
        let lineCount = 0;

        const traverse = (n: SceneNode) => {
            if (n.type === "TEXT") {
                textCount++;
                const t = n as TextNode;
                if (t.characters.trim().length > 0) {
                    snapshot.hasText = true;
                    // Font size (handling mixed)
                    const size = t.fontSize;
                    if (typeof size === "number") {
                        if (size > maxFontSize) maxFontSize = size;
                        if (size < minFontSize) minFontSize = size;
                    }
                    // Bold (handling mixed)
                    // Simplified check: if style includes "Bold"
                    // This is expensive to check perfectly for mixed, so we skip deep mixed check for now
                }
            } else if (n.type === "VECTOR" || n.type === "ELLIPSE" || n.type === "POLYGON" || n.type === "STAR" || n.type === "BOOLEAN_OPERATION") {
                imageCount++;
                snapshot.hasChildImage = true;
            } else if (n.type === "RECTANGLE") {
                const fills = (n as RectangleNode).fills;
                if (Array.isArray(fills) && fills.some((f: any) => f.type === "IMAGE")) {
                    imageCount++;
                    snapshot.hasChildImage = true;
                }
            }

            if ('children' in n) {
                (n as any).children.forEach(traverse);
            }
        };

        // Only traverse direct children for simple stats, or deep?
        // Heuristics usually look at direct children or the node itself.
        // But "hasChildImage" implies looking deeper? 
        // The original heuristics engine logic for `hasChildImage` usually meant "contains an image somewhere relevant".
        // Let's do a shallow traversal of children for types, but deep for "hasText" / "hasChildImage" flags if needed.
        // Actually, `elementor-basic` heuristics like `ELEM_IMAGE_BOX` check `node.hasChildImage`.
        // Let's traverse children recursively but shallowly (e.g. don't go into nested frames too deep if not needed).
        // For now, let's just iterate direct children. If a child is a frame, we might need to know if IT has an image.
        // But `NodeSnapshot` is flat.

        // Let's stick to: Iterate direct children. If child is Vector/Image, set hasChildImage.
        // If child is Frame, we don't recursively check it for `hasChildImage` of the *parent* snapshot usually, 
        // unless the heuristic specifically asks for "contains image".
        // Wait, `ELEM_IMAGE_BOX` checks `hasChildImage`. An image box is usually a Frame containing an Image and Text.
        // So yes, we need to check direct children.

        frame.children.forEach(child => {
            if (child.type === "VECTOR" || child.type === "ELLIPSE" || child.type === "POLYGON" || child.type === "STAR" || child.type === "BOOLEAN_OPERATION") {
                snapshot.hasChildImage = true;
            }
            if (child.type === "RECTANGLE") {
                const fills = (child as RectangleNode).fills;
                if (Array.isArray(fills) && fills.some((f: any) => f.type === "IMAGE")) {
                    snapshot.hasChildImage = true;
                }
            }
            if (child.type === "TEXT") {
                snapshot.hasText = true;
                const t = child as TextNode;
                const size = t.fontSize;
                if (typeof size === "number") {
                    if (size > maxFontSize) maxFontSize = size;
                    if (size < minFontSize) minFontSize = size;
                }
                // Rough line count estimation
                if (t.height && typeof size === 'number') {
                    lineCount += Math.round(t.height / size);
                }
            }
            // If child is instance/component/frame, we might want to peek inside?
            // For now, let's assume "Image Box" has the image as a direct child or wrapped in a simple frame.
            // If wrapped, we might miss it.
            // Let's do a 1-level deep peek for images if not found yet.
            if (!snapshot.hasChildImage && (child.type === "FRAME" || child.type === "INSTANCE" || child.type === "GROUP")) {
                const grandChildren = (child as any).children;
                if (grandChildren && grandChildren.some((gc: any) => gc.type === "VECTOR" || (gc.fills && Array.isArray(gc.fills) && gc.fills.some((f: any) => f.type === 'IMAGE')))) {
                    snapshot.hasChildImage = true;
                }
            }
        });

        if (snapshot.hasText) {
            snapshot.textFontSizeMax = maxFontSize;
            snapshot.textFontSizeMin = minFontSize === 9999 ? maxFontSize : minFontSize;
            snapshot.textLineCount = lineCount || 1;
        }
    } else if (node.type === "TEXT") {
        snapshot.hasText = true;
        const t = node as TextNode;
        const size = t.fontSize;
        if (typeof size === "number") {
            snapshot.textFontSizeMax = size;
            snapshot.textFontSizeMin = size;
        }
        // Check bold
        // ...
    } else if (node.type === "RECTANGLE" || node.type === "ELLIPSE") {
        if (Array.isArray((node as any).fills) && (node as any).fills.some((f: any) => f.type === "IMAGE")) {
            snapshot.hasImageFill = true;
        }
    }

    return snapshot;
}
