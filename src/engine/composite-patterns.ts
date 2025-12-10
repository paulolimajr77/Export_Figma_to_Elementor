/**
 * V2.1 CompositePatternEngine
 * 
 * Detects composite patterns (Card, Hero, List) from the widget tree
 * after V2 DecisionEngine has classified individual nodes.
 * 
 * This is a POST-PROCESSING layer that refines widget types without
 * altering the core V2 decision logic.
 */

import { NodeFeatures } from './types';

// ============================================================================
// Types for Composite Pattern Detection
// ============================================================================

export interface WidgetNode {
    id: string;
    type: string;  // w:heading, w:text-editor, w:image, w:button, etc.
    score: number;
    features: NodeFeatures;
    children?: WidgetNode[];
    compositeType?: string;  // Set by composite pattern detection
    compositeMeta?: Record<string, any>;
}

export interface CompositePatternResult {
    patternId: string;
    confidence: number;
    targetType: string;  // The widget type to promote to
    meta?: Record<string, any>;
}

export interface CompositePatternRule {
    id: string;
    evaluate: (node: WidgetNode) => CompositePatternResult | null;
}

// ============================================================================
// Debug flag for composite pattern logging
// ============================================================================
const DEBUG_COMPOSITE = true;

function logComposite(nodeId: string, pattern: string, widget: string, confidence: number): void {
    if (DEBUG_COMPOSITE) {
        console.log(`[COMPOSITE] Node ${nodeId} | pattern=${pattern} | widget=${widget} (${confidence.toFixed(2)})`);
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

function countChildTypes(node: WidgetNode): Record<string, number> {
    const counts: Record<string, number> = {};
    if (node.children) {
        for (const child of node.children) {
            const type = child.type.replace(/^w:/, '');
            counts[type] = (counts[type] || 0) + 1;
        }
    }
    return counts;
}

function hasChildType(node: WidgetNode, type: string): boolean {
    if (!node.children) return false;
    return node.children.some(c => c.type === type || c.type === `w:${type}`);
}

function getChildrenOfType(node: WidgetNode, type: string): WidgetNode[] {
    if (!node.children) return [];
    return node.children.filter(c => c.type === type || c.type === `w:${type}`);
}

// ============================================================================
// D2: CardPattern Rule
// Detects cards: image/icon + heading + text + optional button
// ============================================================================

const CardPattern: CompositePatternRule = {
    id: 'composite_card',
    evaluate: function (node: WidgetNode): CompositePatternResult | null {
        if (!node.children || node.children.length < 3 || node.children.length > 6) {
            return null;
        }

        const counts = countChildTypes(node);

        // Must have at least 1 image or icon
        const hasImage = (counts['image'] || 0) > 0 || (counts['icon'] || 0) > 0;
        // Must have at least 1 heading
        const hasHeading = (counts['heading'] || 0) > 0;
        // Must have at least 1 text-editor
        const hasText = (counts['text-editor'] || 0) > 0;

        if (!hasImage || !hasHeading || !hasText) {
            return null;
        }

        // Prefer vertical layout (cards are usually stacked)
        const isVertical = node.features.layoutMode === 'VERTICAL';

        // Calculate confidence
        let confidence = 0.60;

        if (isVertical) confidence += 0.15;
        if (counts['button']) confidence += 0.10;
        if (node.children.length >= 3 && node.children.length <= 5) confidence += 0.10;

        // Determine type: image-box vs icon-box usando proporção do visual principal
        const visualChild = (node.children || []).find(c =>
            c.type === 'w:image' || c.type === 'image' || c.type === 'w:icon' || c.type === 'icon'
        );
        const visualW = visualChild?.features?.width || 0;
        const visualH = visualChild?.features?.height || 0;
        const parentW = node.features.width || 0;
        const parentH = node.features.height || 0;
        const widthRatio = parentW > 0 ? visualW / parentW : 0;
        const heightRatio = parentH > 0 ? visualH / parentH : 0;

        // Se o visual ocupa grande parte do card, trate como image-box; se for pequeno, icon-box.
        const looksLikeImageBox = widthRatio >= 0.7 || heightRatio >= 0.5;
        const targetType = looksLikeImageBox ? 'w:image-box' : 'w:icon-box';

        if (confidence >= 0.75) {
            logComposite(node.id, 'card', targetType, confidence);
            return {
                patternId: 'composite_card',
                confidence,
                targetType,
                meta: {
                    hasButton: !!counts['button'],
                    childCount: node.children.length
                }
            };
        }

        return null;
    }
};

// ============================================================================
// D3: HeroPattern Rule
// Detects hero sections: two columns (text column + image column)
// ============================================================================

const HeroPattern: CompositePatternRule = {
    id: 'composite_hero',
    evaluate: function (node: WidgetNode): CompositePatternResult | null {
        // Must be wide (>= 900px) and tall (>= 400px)
        if (node.features.width < 900 || node.features.height < 400) {
            return null;
        }

        // Must have horizontal layout with 2 main children
        if (node.features.layoutMode !== 'HORIZONTAL') {
            return null;
        }

        if (!node.children || node.children.length !== 2) {
            return null;
        }

        const [leftCol, rightCol] = node.children;

        // Check both column arrangements:
        // A) Left = text content, Right = image
        // B) Left = image, Right = text content

        function hasTextContent(col: WidgetNode): boolean {
            if (!col.children) return false;
            const counts = countChildTypes(col);
            return (counts['heading'] || 0) >= 1 && (counts['text-editor'] || 0) >= 1;
        }

        function hasImageContent(col: WidgetNode): boolean {
            if (!col.children) {
                // Column itself might be an image
                return col.type === 'w:image' || col.type === 'image';
            }
            const counts = countChildTypes(col);
            return (counts['image'] || 0) >= 1;
        }

        const isHeroA = hasTextContent(leftCol) && hasImageContent(rightCol);
        const isHeroB = hasImageContent(leftCol) && hasTextContent(rightCol);

        if (!isHeroA && !isHeroB) {
            return null;
        }

        let confidence = 0.70;

        // Bonus for having button in text column
        const textCol = isHeroA ? leftCol : rightCol;
        if (textCol.children) {
            const textCounts = countChildTypes(textCol);
            if (textCounts['button']) confidence += 0.10;
        }

        // Bonus for large height (more hero-like)
        if (node.features.height >= 500) confidence += 0.10;

        if (confidence >= 0.75) {
            logComposite(node.id, 'hero-two-columns', 'structure:hero', confidence);
            return {
                patternId: 'composite_hero',
                confidence,
                targetType: 'structure:hero',
                meta: {
                    layout: isHeroA ? 'text-left' : 'text-right',
                    width: node.features.width,
                    height: node.features.height
                }
            };
        }

        return null;
    }
};

// ============================================================================
// D4: ListPattern Rule
// Detects icon/feature lists: container with 2-10 items of (icon + text)
// ============================================================================

const ListPattern: CompositePatternRule = {
    id: 'composite_list',
    evaluate: function (node: WidgetNode): CompositePatternResult | null {
        // Must be vertical layout
        if (node.features.layoutMode !== 'VERTICAL') {
            return null;
        }

        // Must have 2-10 children
        if (!node.children || node.children.length < 2 || node.children.length > 10) {
            return null;
        }

        // Check if children are uniform "list items" pattern
        // Each item should be small and contain icon/image + text
        let listItemCount = 0;

        for (const child of node.children) {
            // Child should be a container with icon + text
            if (child.children && child.children.length >= 2) {
                const childCounts = countChildTypes(child);
                const hasIconOrSmallImage = (childCounts['icon'] || 0) > 0 ||
                    ((childCounts['image'] || 0) > 0 && child.features.width <= 60);
                const hasText = (childCounts['text-editor'] || 0) > 0 ||
                    (childCounts['heading'] || 0) > 0;

                if (hasIconOrSmallImage && hasText) {
                    listItemCount++;
                }
            }
            // Direct icon-box or image-box children also count
            else if (child.type === 'w:icon-box' || child.type === 'w:image-box') {
                listItemCount++;
            }
        }

        // At least 50% of children should be list items
        const listItemRatio = listItemCount / node.children.length;

        if (listItemRatio < 0.5) {
            return null;
        }

        let confidence = 0.60 + (listItemRatio * 0.25);

        // Bonus for consistent structure (>75% are list items)
        if (listItemRatio >= 0.75) confidence += 0.10;

        if (confidence >= 0.75) {
            logComposite(node.id, 'icon-list', 'structure:icon-list', confidence);
            return {
                patternId: 'composite_list',
                confidence,
                targetType: 'structure:icon-list',
                meta: {
                    itemCount: listItemCount,
                    totalChildren: node.children.length
                }
            };
        }

        return null;
    }
};

// ============================================================================
// Card-List Pattern (sibling cards detection)
// Detects when multiple cards are siblings (grid of cards)
// ============================================================================

const CardListPattern: CompositePatternRule = {
    id: 'composite_card_list',
    evaluate: function (node: WidgetNode): CompositePatternResult | null {
        // Must have 3+ children (for a meaningful card list)
        if (!node.children || node.children.length < 3) {
            return null;
        }

        // Check if most children are already detected as cards or have card-like structure
        let cardCount = 0;

        for (const child of node.children) {
            // Already marked as card
            if (child.compositeType === 'w:image-box' || child.compositeType === 'w:icon-box') {
                cardCount++;
                continue;
            }

            // Check if it looks like a card
            if (child.children && child.children.length >= 3) {
                const counts = countChildTypes(child);
                const hasImage = (counts['image'] || 0) > 0 || (counts['icon'] || 0) > 0;
                const hasHeading = (counts['heading'] || 0) > 0;
                const hasText = (counts['text-editor'] || 0) > 0;

                if (hasImage && hasHeading && hasText) {
                    cardCount++;
                }
            }
        }

        // At least 3 cards and 60% of children should be cards
        if (cardCount < 3 || (cardCount / node.children.length) < 0.6) {
            return null;
        }

        const confidence = 0.80 + (cardCount / node.children.length - 0.6) * 0.25;

        logComposite(node.id, 'card-list', 'structure:card-grid', confidence);
        return {
            patternId: 'composite_card_list',
            confidence: Math.min(confidence, 1.0),
            targetType: 'structure:card-grid',
            meta: {
                cardCount,
                totalChildren: node.children.length
            }
        };
    }
};

// ============================================================================
// Composite Pattern Registry
// ============================================================================

const compositePatternRules: CompositePatternRule[] = [
    CardPattern,
    HeroPattern,
    ListPattern,
    CardListPattern
];

// ============================================================================
// Main Entry Point: applyCompositePatterns
// ============================================================================

/**
 * Applies composite pattern detection to a widget tree.
 * This runs AFTER V2 DecisionEngine has classified individual nodes.
 * 
 * @param rootNode - The root widget node with children
 * @returns The enhanced widget tree with compositeType annotations
 */
export function applyCompositePatterns(rootNode: WidgetNode): WidgetNode {
    // First, recursively process children (bottom-up)
    if (rootNode.children) {
        rootNode.children = rootNode.children.map(child => applyCompositePatterns(child));
    }

    // Then, try to detect patterns at this node level
    for (const rule of compositePatternRules) {
        const result = rule.evaluate(rootNode);
        if (result && result.confidence >= 0.75) {
            rootNode.compositeType = result.targetType;
            rootNode.compositeMeta = {
                patternId: result.patternId,
                confidence: result.confidence,
                ...result.meta
            };
            // Only first matching pattern wins
            break;
        }
    }

    return rootNode;
}

/**
 * Converts a simple widget type + features structure to WidgetNode for processing
 */
export function createWidgetNode(
    id: string,
    type: string,
    score: number,
    features: NodeFeatures,
    children?: WidgetNode[]
): WidgetNode {
    const node: WidgetNode = { id, type, score, features };
    if (children && children.length > 0) {
        node.children = children;
    }
    return node;
}
