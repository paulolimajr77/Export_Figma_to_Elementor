import { rgbToHex, SerializedNode } from '../utils/serialization_utils';
import { extractWidgetStyles, extractContainerStyles, buildHtmlFromSegments } from '../utils/style_utils';
import { findWidgetDefinition } from '../config/widget.registry';

// Import heuristics system
import { evaluateNode, DEFAULT_HEURISTICS } from '../heuristics';
import type { NodeSnapshot } from '../heuristics/types';
import type { PipelineSchema, PipelineContainer, PipelineWidget } from '../types/pipeline.schema';
import { logger } from '../utils/logger';

type MaybeWidget = PipelineWidget | null;

const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE', 'RECTANGLE'];

function isImageFill(node: any): boolean {
    if (!node) return false;

    // Detect IMAGE and VECTOR nodes (icons/SVGs)
    if (node.type === 'IMAGE' || node.type === 'VECTOR') {
        console.log('[IS IMAGE FILL] ✅ Detected', node.type, 'node:', node.name, 'ID:', node.id);
        return true;
    }

    // Detect nodes with image fills
    const fills = node?.fills;
    if (!Array.isArray(fills)) return false;
    const hasImageFill = fills.some((f: any) => f?.type === 'IMAGE');
    if (hasImageFill) {
        console.log('[IS IMAGE FILL] ✅ Detected IMAGE fill in:', node.name, 'ID:', node.id);
    }
    return hasImageFill;
}

function findFirstImageId(node: any): string | null {
    if (!node) return null;

    console.log('[FIND IMAGE] Checking node:', node.name, 'Type:', node.type, 'ID:', node.id);

    if (isImageFill(node)) {
        console.log('[FIND IMAGE] ✅ Found image via isImageFill:', node.id);
        return node.id || null;
    }

    const children = (node as any).children;
    if (Array.isArray(children)) {
        console.log('[FIND IMAGE] Searching', children.length, 'children...');
        for (const child of children) {
            const found = findFirstImageId(child);
            if (found) return found;
        }
    }

    console.log('[FIND IMAGE] No image found in node:', node.name);
    return null;
}

// Convert SerializedNode to NodeSnapshot for heuristics
function toNodeSnapshot(node: SerializedNode): NodeSnapshot {
    const children = (node as any).children || [];
    const hasText = node.type === 'TEXT' || children.some((c: any) => c.type === 'TEXT');
    const hasImage = isImageFill(node) || children.some((c: any) => isImageFill(c));

    return {
        id: node.id,
        name: node.name || '',
        type: node.type as any,
        width: node.width || 0,
        height: node.height || 0,
        x: node.x || 0,
        y: node.y || 0,
        isVisible: node.visible !== false,

        // Auto layout
        isAutoLayout: !!(node as any).layoutMode,
        direction: (node as any).layoutMode === 'HORIZONTAL' ? 'HORIZONTAL' :
            (node as any).layoutMode === 'VERTICAL' ? 'VERTICAL' : 'NONE',
        spacing: (node as any).itemSpacing || 0,
        paddingTop: (node as any).paddingTop || 0,
        paddingRight: (node as any).paddingRight || 0,
        paddingBottom: (node as any).paddingBottom || 0,
        paddingLeft: (node as any).paddingLeft || 0,

        // Visual style
        hasBackground: !!(node as any).fills && (node as any).fills.length > 0,
        backgroundOpacity: 1,
        hasBorder: !!(node as any).strokes && (node as any).strokes.length > 0,
        borderRadius: (node as any).cornerRadius || 0,
        hasShadow: !!(node as any).effects && (node as any).effects.length > 0,

        // Text
        hasText,
        textFontSizeMax: (node as any).fontSize || undefined,
        textFontSizeMin: (node as any).fontSize || undefined,
        textIsBoldDominant: (node as any).fontWeight >= 600,
        textLineCount: 1,

        // Images
        hasImageFill: isImageFill(node),
        hasChildImage: hasImage,

        // Children
        childCount: children.length,
        childrenTypes: children.map((c: any) => c.type),
        childrenWidths: children.map((c: any) => c.width || 0),
        childrenHeights: children.map((c: any) => c.height || 0),
        childrenAlignment: 'LEFT',

        // Context
        parentId: node.parentId || undefined,
        siblingCount: 0
    };
}

function hasTextDeep(node: any): boolean {
    if (!node) return false;
    if (node.type === 'TEXT') return true;
    const children = (node as any).children;
    if (Array.isArray(children)) {
        return children.some((c: any) => hasTextDeep(c));
    }
    return false;
}

function hasIconDeep(node: any): boolean {
    if (!node) return false;
    if (vectorTypes.includes(node.type)) return true;
    const children = (node as any).children;
    if (Array.isArray(children)) {
        return children.some((c: any) => hasIconDeep(c));
    }
    return false;
}

function isSolidColor(node: any): string | undefined {
    const fills = node?.fills;
    if (!Array.isArray(fills) || fills.length === 0) return undefined;
    const solid = fills.find((f: any) => f.type === 'SOLID' && f.color);
    if (!solid) return undefined;
    const { r, g, b, a = 1 } = solid.color || {};
    const to255 = (v: number) => Math.round((v || 0) * 255);
    return `rgba(${to255(r)}, ${to255(g)}, ${to255(b)}, ${a})`;
}

const BOXED_MIN_PARENT_WIDTH = 1440;
const BOXED_MIN_WIDTH_DELTA = 40;

function isContainerLike(node: SerializedNode): boolean {
    const containerTypes = ['FRAME', 'GROUP', 'SECTION', 'INSTANCE', 'COMPONENT'];
    return containerTypes.includes(node.type);
}

function unwrapBoxedInner(node: SerializedNode): { isBoxed: boolean; inner: SerializedNode | null; flattenedChildren: SerializedNode[] } {
    const rawChildren = Array.isArray((node as any).children) ? ((node as any).children as SerializedNode[]) : [];
    if (rawChildren.length === 0) {
        return { isBoxed: false, inner: null, flattenedChildren: rawChildren };
    }

    // **ONLY detect explicitly named w:inner-container or c:inner-container**
    const candidate = rawChildren.find(child => {
        const childName = (child.name || '').toLowerCase();
        return childName === 'w:inner-container' || childName === 'c:inner-container';
    });

    if (!candidate) {
        return { isBoxed: false, inner: null, flattenedChildren: rawChildren };
    }

    console.log('[UNWRAP BOXED] ✅ Found w:inner-container:', candidate.name, 'Width:', candidate.width);

    const innerChildren = Array.isArray((candidate as any).children) ? (candidate as any).children as SerializedNode[] : [];
    const idx = rawChildren.indexOf(candidate);
    const before = idx >= 0 ? rawChildren.slice(0, idx) : [];
    const after = idx >= 0 ? rawChildren.slice(idx + 1) : [];

    console.log(`[UNWRAP BOXED] ✅ Flattening children. Before: ${before.length}, Inner: ${innerChildren.length}, After: ${after.length}`);

    return { isBoxed: true, inner: candidate, flattenedChildren: [...before, ...innerChildren, ...after] };
}


interface WidgetScore {
    type: string;
    score: number;
    matchedFeatures: string[];
}

function calculateWidgetScore(node: SerializedNode): WidgetScore[] {
    const scores: WidgetScore[] = [];
    const name = (node.name || '').toLowerCase();
    const hasChildren = Array.isArray((node as any).children) && (node as any).children.length > 0;
    const children = hasChildren ? ((node as any).children as SerializedNode[]) : [];

    // 🎯 PRIORITY: Check for explicit widget prefix in name
    // If the user explicitly named a node with w:button, w:nav-menu, etc., respect that choice
    const widgetPrefixes = ['w:', 'woo:', 'e:', 'wp:', 'loop:', 'c:'];
    for (const prefix of widgetPrefixes) {
        if (name.startsWith(prefix)) {
            const explicitType = name.substring(prefix.length).trim();
            if (explicitType) {
                console.log(`[WIDGET SCORE] 🎯 Explicit widget detected: "${node.name}" → type: "${explicitType}"`);
                // Return with max score to ensure it wins over heuristics
                return [{ type: explicitType, score: 1000, matchedFeatures: ['explicit-name'] }];
            }
        }
    }

    // Helper checks
    const hasImage = children.some(c => isImageFill(c) || findFirstImageId(c));
    const hasText = children.some(c => hasTextDeep(c));
    const hasIcon = children.some(c => hasIconDeep(c));
    const allImages = children.length > 0 && children.every(c => isImageFill(c) || (Array.isArray((c as any).children) && (c as any).children.every((gr: any) => isImageFill(gr))));
    const allIcons = children.length > 0 && children.every(c => vectorTypes.includes(c.type));
    const isHorizontal = (node as any).layoutMode === 'HORIZONTAL';
    const isVertical = (node as any).layoutMode === 'VERTICAL';

    // Generic container check
    const isGenericName = name.includes('container') || name.includes('frame') || name.includes('group') || name.includes('section') || name === 'div';
    const hasComplexChildren = children.some(c => (c as any).children && (c as any).children.length > 1);

    // --- BASIC WIDGETS ---

    // 1. Image Box (w:image-box)
    let imageBoxScore = 0;
    if (hasImage) imageBoxScore += 30;
    if (hasText) imageBoxScore += 20;
    if (children.length <= 4) imageBoxScore += 10;
    if (isVertical) imageBoxScore += 10;
    if (name.includes('image') && name.includes('box')) imageBoxScore += 50; // Boost explicit name

    // Penalties
    if (isGenericName) imageBoxScore -= 30;
    if (hasComplexChildren) imageBoxScore -= 30;

    if (imageBoxScore > 0) scores.push({ type: 'image-box', score: imageBoxScore, matchedFeatures: ['image', 'text'] });

    // 2. Icon Box (w:icon-box)
    let iconBoxScore = 0;
    if (hasIcon) iconBoxScore += 30;
    if (hasText) iconBoxScore += 20;
    if (children.length <= 4) iconBoxScore += 10;
    if (name.includes('icon') && name.includes('box')) iconBoxScore += 50; // Boost explicit name

    // Penalties
    if (isGenericName) iconBoxScore -= 30;
    if (hasComplexChildren) iconBoxScore -= 30;

    if (iconBoxScore > 0) scores.push({ type: 'icon-box', score: iconBoxScore, matchedFeatures: ['icon', 'text'] });

    // 3. Button (w:button)
    let buttonScore = 0;
    const bg = isSolidColor(node);
    if (bg) buttonScore += 20;
    // Text only button
    if (children.length === 1 && children[0].type === 'TEXT') buttonScore += 20;
    // Text + Icon button (common pattern)
    if (children.length === 2 && hasText && hasIcon) buttonScore += 40;

    if ((node as any).primaryAxisAlignItems === 'CENTER' && (node as any).counterAxisAlignItems === 'CENTER') buttonScore += 10;
    if (name.includes('btn') || name.includes('button') || name.includes('link')) buttonScore += 50;
    if (!hasImage && !hasIcon && !hasText) buttonScore = 0; // Must have something
    if (buttonScore > 0) scores.push({ type: 'button', score: buttonScore, matchedFeatures: ['background', 'text-icon'] });

    // 4. Star Rating (w:star-rating)
    let starScore = 0;
    if (allIcons && children.length >= 3 && children.length <= 5) starScore += 30;
    if (isHorizontal) starScore += 10;
    if (name.includes('star') || name.includes('rating')) starScore += 50;
    if (starScore > 0) scores.push({ type: 'star-rating', score: starScore, matchedFeatures: ['icons', 'horizontal'] });

    // 5. Social Icons (w:social-icons)
    let socialScore = 0;
    if (isHorizontal) socialScore += 20;
    if (allIcons || (children.every(c => c.type === 'FRAME' || c.type === 'GROUP'))) socialScore += 20;
    if (name.includes('social')) socialScore += 50;
    if (socialScore > 0) scores.push({ type: 'social-icons', score: socialScore, matchedFeatures: ['horizontal', 'icons'] });

    // 6. Testimonial (w:testimonial)
    let testimonialScore = 0;
    if (hasImage) testimonialScore += 20;
    if (hasText) testimonialScore += 20;
    if (name.includes('testimonial') || name.includes('review')) testimonialScore += 50;
    if (testimonialScore > 0) scores.push({ type: 'testimonial', score: testimonialScore, matchedFeatures: ['image', 'text'] });

    // 7. Gallery (w:gallery / w:basic-gallery)
    let galleryScore = 0;
    if (allImages && children.length >= 3) galleryScore += 60;
    if (name.includes('gallery')) galleryScore += 40;
    if (galleryScore > 0) scores.push({ type: 'basic-gallery', score: galleryScore, matchedFeatures: ['all-images'] });

    // 7b. Image Carousel (media:carousel)
    let carouselScore = 0;
    if (allImages && children.length >= 2) carouselScore += 60;
    if (name.includes('carousel') || name.includes('slider')) carouselScore += 50;
    if (carouselScore > 0) scores.push({ type: 'image-carousel', score: carouselScore, matchedFeatures: ['images', 'carousel'] });

    // 8. Icon List (w:icon-list)
    let iconListScore = 0;
    if (hasIcon && hasText && (children.length >= 3 || name.includes('list'))) iconListScore += 40;
    if (name.includes('icon') && name.includes('list')) iconListScore += 40;
    if (iconListScore > 0) scores.push({ type: 'icon_list', score: iconListScore, matchedFeatures: ['icon', 'text', 'list'] });

    // 9. Video (w:video)
    let videoScore = 0;
    if (name.includes('video') || name.includes('player')) videoScore += 40;
    if (hasImage && children.some(c => (c.name || '').toLowerCase().includes('play'))) videoScore += 40;
    if (videoScore > 0) scores.push({ type: 'video', score: videoScore, matchedFeatures: ['name', 'play-icon'] });

    // 10. Google Maps (w:google_maps)
    let mapScore = 0;
    if (name.includes('map') || name.includes('location')) mapScore += 50;
    if (hasImage && name.includes('map')) mapScore += 20;
    if (mapScore > 0) scores.push({ type: 'google_maps', score: mapScore, matchedFeatures: ['name'] });

    // 11. Divider (w:divider)
    let dividerScore = 0;
    if (name.includes('divider') || name.includes('separator') || name.includes('line')) dividerScore += 40;
    // Support RECTANGLE with small height/width as divider
    if (!hasChildren && (node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'RECTANGLE') && (node.height <= 2 || node.width <= 2)) dividerScore += 30;
    if (dividerScore > 0) scores.push({ type: 'divider', score: dividerScore, matchedFeatures: ['name', 'shape'] });

    // 12. Spacer (w:spacer)
    let spacerScore = 0;
    if (name.includes('spacer') || name.includes('gap')) spacerScore += 50;
    if (!hasChildren && !isImageFill(node) && !isSolidColor(node)) spacerScore += 20;
    if (spacerScore > 0) scores.push({ type: 'spacer', score: spacerScore, matchedFeatures: ['name', 'empty'] });

    // --- PRO WIDGETS ---

    // 13. Form (w:form)
    let formScore = 0;
    if (name.includes('form') && !name.includes('search')) formScore += 40;
    const inputLike = children.filter(c => (c.name || '').toLowerCase().includes('input') || (c.name || '').toLowerCase().includes('field'));
    if (inputLike.length >= 1) formScore += 30;
    if (children.some(c => (c.name || '').toLowerCase().includes('submit') || (c.name || '').toLowerCase().includes('button'))) formScore += 20;
    if (formScore > 0) scores.push({ type: 'form', score: formScore, matchedFeatures: ['name', 'inputs'] });

    // 14. Login (w:login)
    let loginScore = 0;
    if (name.includes('login') || name.includes('signin')) loginScore += 50;
    if (loginScore > 0) scores.push({ type: 'login', score: loginScore, matchedFeatures: ['name'] });

    // 15. Price Table (w:price-table)
    let priceTableScore = 0;
    if (name.includes('price') && name.includes('table')) priceTableScore += 60;
    if (name.includes('pricing')) priceTableScore += 40;
    if (hasText && children.some(c => (c.name || '').toLowerCase().includes('price'))) priceTableScore += 20;
    if (priceTableScore > 0) scores.push({ type: 'price-table', score: priceTableScore, matchedFeatures: ['name'] });

    // 16. Flip Box (w:flip-box)
    let flipScore = 0;
    if (name.includes('flip') && name.includes('box')) flipScore += 60;
    if (flipScore > 0) scores.push({ type: 'flip-box', score: flipScore, matchedFeatures: ['name'] });

    // 17. Call to Action (w:call-to-action)
    let ctaScore = 0;
    if (name.includes('cta') || name.includes('call to action')) ctaScore += 50;
    if (hasImage && hasText && children.some(c => (c.name || '').toLowerCase().includes('button'))) ctaScore += 20;
    if (ctaScore > 0) scores.push({ type: 'call-to-action', score: ctaScore, matchedFeatures: ['name', 'structure'] });

    // 18. Countdown (w:countdown)
    let countdownScore = 0;
    if (name.includes('countdown') || name.includes('timer')) countdownScore += 60;
    if (countdownScore > 0) scores.push({ type: 'countdown', score: countdownScore, matchedFeatures: ['name'] });

    // --- WOOCOMMERCE WIDGETS ---

    // 19. WooCommerce Product Title
    let wooTitleScore = 0;
    if (name.includes('product') && name.includes('title')) wooTitleScore += 60;
    if (wooTitleScore > 0) scores.push({ type: 'woo:product-title', score: wooTitleScore, matchedFeatures: ['name'] });

    // 20. WooCommerce Product Price
    let wooPriceScore = 0;
    if (name.includes('product') && name.includes('price')) wooPriceScore += 60;
    if (wooPriceScore > 0) scores.push({ type: 'woo:product-price', score: wooPriceScore, matchedFeatures: ['name'] });

    // 21. WooCommerce Add to Cart
    let wooCartScore = 0;
    if (name.includes('add to cart') || (name.includes('product') && name.includes('button'))) wooCartScore += 60;
    if (wooCartScore > 0) scores.push({ type: 'woo:product-add-to-cart', score: wooCartScore, matchedFeatures: ['name'] });

    // 22. WooCommerce Product Image
    let wooImageScore = 0;
    if (name.includes('product') && name.includes('image')) wooImageScore += 60;
    if (wooImageScore > 0) scores.push({ type: 'woo:product-image', score: wooImageScore, matchedFeatures: ['name'] });

    return scores.sort((a, b) => b.score - a.score);
}

function detectWidget(node: SerializedNode): MaybeWidget {
    const name = (node.name || '').toLowerCase();

    console.log('[DETECT WIDGET] Processing node:', node.name, 'Type:', node.type, 'Name (lowercase):', name);

    // **PRIORITY 1: Respect explicit widget names (w:, woo:, loop:)**
    // If user manually named the widget, use that name directly
    if (/^(w:|woo:|loop:)/.test(name)) {
        const widgetType = name.replace(/^(w:|woo:|loop:)/, '');
        console.log('[DETECT WIDGET] ✅ Explicit widget name detected:', node.name, '→', widgetType);

        // Skip containers - let toContainer handle them
        if (widgetType === 'container' || widgetType === 'section') {
            console.log('[DETECT WIDGET] Ignoring container:', node.name);
            return null;
        }

        // Use registry to process the widget with proper structure
        const registryDef = findWidgetDefinition(name, node.type);
        if (registryDef) {
            console.log('[DETECT WIDGET] Found in registry, delegating to registry handler');
            // Fall through to registry processing below (line ~464)
        } else {
            // Widget name is valid but not in registry - create basic widget
            console.log('[DETECT WIDGET] Not in registry, creating basic widget');
            const styles: Record<string, any> = {
                sourceId: node.id,
                sourceName: node.name
            };

            // Extract content based on widget type
            let content = node.name;
            let imageId = null;

            if (widgetType === 'heading' || widgetType === 'text-editor' || widgetType === 'text') {
                if (node.type === 'TEXT') {
                    content = (node as any).characters || node.name;
                    const extractedStyles = extractWidgetStyles(node);
                    Object.assign(styles, extractedStyles);
                }
            } else if (widgetType === 'image' || widgetType === 'icon') {
                imageId = node.id;
                content = null;
            } else if (widgetType === 'image-box' || widgetType === 'icon-box') {
                const boxContent = extractBoxContent(node);
                content = boxContent.title || node.name;
                imageId = boxContent.imageId || findFirstImageId(node) || null;
                Object.assign(styles, { title_text: boxContent.title, description_text: boxContent.description });
            }

            return {
                type: widgetType,
                content,
                imageId,
                styles
            };
        }
    }

    // Explicitly ignore containers so they are processed as containers by the recursive logic
    if (name.startsWith('c:container') || name.startsWith('w:container')) {
        console.log('[DETECT WIDGET] Ignoring container:', node.name);
        return null;
    }

    const styles: Record<string, any> = {
        sourceId: node.id,
        sourceName: node.name
    };

    const hasChildren = Array.isArray((node as any).children) && (node as any).children.length > 0;
    const children = hasChildren ? ((node as any).children as SerializedNode[]) : [];
    const firstImageDeep = findFirstImageId(node);

    // **PHASE 1: Try Heuristics First** (NEW!)
    // SKIP heuristics if user explicitly named the widget
    const hasExplicitName = /^(w:|woo:|loop:)/.test(name);
    if (!hasExplicitName) {
        try {
            const snapshot = toNodeSnapshot(node);
            const heuristicResults = evaluateNode(snapshot, DEFAULT_HEURISTICS, { minConfidence: 0.75 });

            if (heuristicResults.length > 0) {
                const best = heuristicResults[0];
                console.log('[HEURISTICS] Matched:', best.widget, 'Confidence:', best.confidence, 'Pattern:', best.patternId);

                // Use generic structural analysis for all widgets
                const widgetType = best.widget.replace(/^w:/, '');
                const analysis = analyzeWidgetStructure(node, widgetType);

                // **NEW: If this is a container/section with child widgets, return null**
                // This allows toContainer to process it properly with hierarchy
                if ((widgetType === 'section' || widgetType === 'container') && analysis.childWidgets.length > 0) {
                    console.log('[HEURISTICS] Container with', analysis.childWidgets.length, 'child widgets - delegating to toContainer');
                    return null;  // Let toContainer handle it
                }

                // Merge all styles
                const mergedStyles = {
                    ...styles,
                    ...analysis.containerStyles,
                    ...analysis.textStyles
                };

                // Add node dimensions for image/icon widgets
                if (typeof node.width === 'number') mergedStyles.width = node.width;
                if (typeof node.height === 'number') mergedStyles.height = node.height;

                // Add transparent background fallback for buttons
                if (widgetType === 'button' && !mergedStyles.background && (!node.fills || node.fills.length === 0)) {
                    mergedStyles.fills = [{
                        type: 'SOLID',
                        color: { r: 1, g: 1, b: 1 },
                        opacity: 0,
                        visible: true
                    }];
                }

                // Determine content fallback
                let content = analysis.text;
                if (!content) {
                    // Only use node.name if it's NOT a technical identifier
                    const isTechnicalName = node.name.includes(':') ||
                        node.name.startsWith('w-') ||
                        node.name.startsWith('Frame ') ||
                        node.name.startsWith('Group ');

                    if (!isTechnicalName) {
                        content = node.name;
                    } else {
                        // Generic fallback based on type
                        content = widgetType === 'heading' ? 'Heading' :
                            widgetType === 'button' ? 'Button' :
                                widgetType === 'text' ? 'Text Block' : '';
                    }
                }

                return {
                    type: widgetType,
                    content: content,
                    imageId: analysis.iconId,
                    styles: mergedStyles,
                    children: analysis.childWidgets
                };
            }
        } catch (error) {
            console.log('[HEURISTICS] Error evaluating node:', error);
            // Fall through to manual detection
        }
    } // End of if (!hasExplicitName)

    // **PHASE 2: Explicit overrides by name (Registry & Aliases)**
    const registryDef = findWidgetDefinition(name, node.type);
    if (registryDef) {
        const widgetType = registryDef.widgetType;
        console.log(`[DETECT WIDGET] Found explicit widget via registry: ${node.name} -> ${widgetType}`);

        if (widgetType === 'image-box') {
            const boxContent = extractBoxContent(node);
            return {
                type: 'image-box',
                content: boxContent.title || node.name,
                imageId: boxContent.imageId || findFirstImageId(node) || null,
                styles: { ...styles, title_text: boxContent.title, description_text: boxContent.description }
            };
        }
        if (widgetType === 'icon-box') {
            const boxContent = extractBoxContent(node);
            return {
                type: 'icon-box',
                content: boxContent.title || node.name,
                imageId: boxContent.imageId || findFirstImageId(node) || null,
                styles: { ...styles, title_text: boxContent.title, description_text: boxContent.description }
            };
        }
        if (widgetType === 'icon-list') {
            let listItems: any[] = [];

            // Check for "Single Item Split" pattern: 1 Icon + 1 Text as direct children
            const iconChildren = children.filter(c => isImageFill(c) || c.type === 'IMAGE' || c.type === 'VECTOR');
            const textChildren = children.filter(c => c.type === 'TEXT');

            if (children.length === 2 && iconChildren.length === 1 && textChildren.length === 1) {
                console.log('[NOAI ICON-LIST] Detected Single Item Split pattern (1 Icon + 1 Text)');
                const textNode = textChildren[0];
                const iconNode = iconChildren[0];
                const text = (textNode as any).characters || textNode.name;

                listItems.push({
                    type: 'list-item',
                    content: text,
                    imageId: iconNode.id,
                    styles: { sourceName: text }
                });
            } else {
                // Process children normally
                listItems = children.map((child) => {
                    // 1. Direct Text Node
                    if (child.type === 'TEXT') {
                        return {
                            type: 'list-item',
                            content: (child as any).characters || child.name,
                            imageId: null,
                            styles: { sourceName: child.name }
                        };
                    }

                    // 2. Direct Icon/Image Node
                    if (isImageFill(child) || child.type === 'IMAGE' || child.type === 'VECTOR') {
                        return {
                            type: 'list-item',
                            content: child.name,
                            imageId: child.id,
                            styles: { sourceName: child.name }
                        };
                    }

                    // 3. Container (Frame/Group) - Extract content
                    const itemContent = extractBoxContent(child);
                    let text = itemContent.title;

                    // Fallback: try to find text inside if extractBoxContent failed
                    if (!text) {
                        const textNode = (child as any).children?.find((c: any) => c.type === 'TEXT');
                        if (textNode) text = textNode.characters || textNode.name;
                        else text = child.name;
                    }

                    return {
                        type: 'list-item',
                        content: text,
                        imageId: itemContent.imageId || findFirstImageId(child),
                        styles: { sourceName: text }
                    };
                });
            }

            console.log('[NOAI ICON-LIST] Extracted', listItems.length, 'items');
            return {
                type: 'icon-list',
                content: null,
                imageId: null,
                styles: styles,
                children: listItems as any
            };
        }
        if (widgetType === 'button') {
            const buttonData = analyzeButtonStructure(node);
            const containerStyles = extractContainerStyles(node);
            const mergedStyles = { ...styles, ...containerStyles, ...buttonData.textStyles };
            if (!mergedStyles.background && (!node.fills || node.fills.length === 0)) {
                mergedStyles.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0, visible: true }];
            }
            return { type: 'button', content: buttonData.text || node.name, imageId: buttonData.iconId, styles: mergedStyles };
        }
        if (widgetType === 'slides') {
            const slides = children.map((child, i) => {
                // Extract slide content from child container
                let heading = '';
                let description = '';
                let button_text = '';
                let imageId = findFirstImageId(child);

                // Analyze child's children
                if ((child as any).children) {
                    const slideChildren = (child as any).children as SerializedNode[];

                    // 1. Heading/Title
                    const headingNode = slideChildren.find(c => c.name.toLowerCase().includes('heading') || c.name.toLowerCase().includes('title'));
                    if (headingNode && headingNode.type === 'TEXT') heading = (headingNode as any).characters;

                    // 2. Description/Text
                    const descNode = slideChildren.find(c => c.name.toLowerCase().includes('description') || c.name.toLowerCase().includes('text') || c.name.toLowerCase().includes('content'));
                    if (descNode && descNode.type === 'TEXT') description = (descNode as any).characters;

                    // 3. Button
                    const btnNode = slideChildren.find(c => c.name.toLowerCase().includes('button') || c.name.toLowerCase().includes('btn'));
                    if (btnNode) {
                        if (btnNode.type === 'TEXT') button_text = (btnNode as any).characters;
                        else if ((btnNode as any).children) {
                            const btnText = (btnNode as any).children.find((c: any) => c.type === 'TEXT');
                            if (btnText) button_text = btnText.characters;
                        }
                    }

                    // Fallback: if no explicit names, use order
                    const textNodes = slideChildren.filter(c => c.type === 'TEXT');
                    if (!heading && textNodes.length > 0) heading = (textNodes[0] as any).characters;
                    if (!description && textNodes.length > 1) description = (textNodes[1] as any).characters;
                }

                return {
                    _id: `slide_${i + 1}`,
                    heading,
                    description,
                    button_text,
                    background_color: '',
                    background_image: { url: '', id: imageId ? parseInt(imageId) : '' }
                };
            });
            return { type: 'slides', content: null, imageId: null, styles: { ...styles, slides } };
        }
        if (widgetType === 'image-carousel') {
            const slides = children
                .filter(c => isImageFill(c) || vectorTypes.includes(c.type) || c.type === 'IMAGE')
                .map((img, i) => ({ id: img.id, url: '', _id: `slide_${i + 1} ` }));
            return { type: 'image-carousel', content: null, imageId: null, styles: { ...styles, slides } };
        }
        if (widgetType === 'basic-gallery') {
            return { type: 'basic-gallery', content: null, imageId: null, styles };
        }
        if (widgetType === 'video') {
            return { type: 'video', content: '', imageId: null, styles };
        }
        if (widgetType === 'image') {
            // For explicit w:image widgets, use the node's ID as imageId
            // Include width from node dimensions
            const imageStyles = { ...styles };
            if (typeof node.width === 'number') imageStyles.width = node.width;
            if (typeof node.height === 'number') imageStyles.height = node.height;
            console.log('[NOAI IMAGE] Creating image widget with dimensions:', { width: node.width, height: node.height });
            return { type: 'image', content: null, imageId: node.id, styles: imageStyles };
        }
        if (widgetType === 'icon') {
            // For explicit w:icon widgets, use the node's ID as imageId
            const iconStyles = { ...styles };
            if (typeof node.width === 'number') iconStyles.width = node.width;
            if (typeof node.height === 'number') iconStyles.height = node.height;
            return { type: 'icon', content: null, imageId: node.id, styles: iconStyles };
        }
        if (widgetType === 'text-editor') {
            // For explicit w:text widgets, extract actual text content and styles
            const extractedStyles = extractWidgetStyles(node);
            Object.assign(styles, extractedStyles);

            let textContent = (node as any).characters || node.name;

            // Handle rich text with multiple colors/styles
            if (node.styledTextSegments && node.styledTextSegments.length > 1) {
                const rich = buildHtmlFromSegments(node);
                textContent = rich.html;
            }

            return { type: 'text-editor', content: textContent, imageId: null, styles };
        }
        if (widgetType === 'heading') {
            // For explicit w:heading widgets, extract actual text content and styles
            const extractedStyles = extractWidgetStyles(node);
            Object.assign(styles, extractedStyles);

            let headingContent = (node as any).characters || node.name;

            // Handle rich text with multiple colors/styles
            if (node.styledTextSegments && node.styledTextSegments.length > 1) {
                const rich = buildHtmlFromSegments(node);
                headingContent = rich.html;
            }

            return { type: 'heading', content: headingContent, imageId: null, styles };
        }

        // Special handling for widgets that need children (countdown, icon-list)
        if (widgetType === 'countdown' || widgetType === 'icon-list') {
            const children = (node as any).children || [];
            const childWidgets: PipelineWidget[] = [];

            // Process each child as a simple widget (text nodes become content)
            children.forEach((child: SerializedNode) => {
                if (child.type === 'TEXT') {
                    const textContent = (child as any).characters || child.name || '';
                    const textStyles = extractWidgetStyles(child);
                    childWidgets.push({
                        type: 'text',
                        content: textContent,
                        imageId: null,
                        styles: textStyles
                    });
                } else if (isImageFill(child) || child.type === 'VECTOR' || child.type === 'IMAGE') {
                    childWidgets.push({
                        type: 'icon',
                        content: null,
                        imageId: child.id,
                        styles: {}
                    });
                }
            });

            console.log(`[NOAI ${widgetType.toUpperCase()}] Processed ${childWidgets.length} children`);
            return { type: widgetType, content: node.name, imageId: null, styles, children: childWidgets };
        }

        // Generic fallback for other registry widgets
        return { type: widgetType, content: node.name, imageId: null, styles };
    }

    // Scoring System (Level 2 Intelligence)
    // Allow RECTANGLE for dividers
    if (hasChildren || node.type === 'LINE' || node.type === 'VECTOR' || node.type === 'RECTANGLE') {
        const scores = calculateWidgetScore(node);
        const bestMatch = scores[0];

        // Threshold for acceptance (e.g., 60)
        if (bestMatch && bestMatch.score >= 60) {
            // Construct widget based on type
            switch (bestMatch.type) {
                case 'image-box': {
                    const boxContent = extractBoxContent(node);
                    if (!boxContent.title) break; // Safety: Need direct text to be a valid image box
                    return {
                        type: 'image-box',
                        content: boxContent.title,
                        imageId: boxContent.imageId || findFirstImageId(node) || null,
                        styles: { ...styles, title_text: boxContent.title, description_text: boxContent.description }
                    };
                }
                case 'icon-box': {
                    const boxContent = extractBoxContent(node);
                    if (!boxContent.title) break; // Safety: Need direct text to be a valid icon box
                    return {
                        type: 'icon-box',
                        content: boxContent.title,
                        imageId: boxContent.imageId || findFirstImageId(node) || null,
                        styles: { ...styles, title_text: boxContent.title, description_text: boxContent.description }
                    };
                }
                case 'star-rating': return { type: 'star-rating', content: '5', imageId: null, styles };
                case 'social-icons': return { type: 'social-icons', content: '', imageId: null, styles };
                case 'testimonial': return { type: 'testimonial', content: '', imageId: null, styles };
                case 'basic-gallery': return { type: 'basic-gallery', content: null, imageId: null, styles };
                case 'image-carousel': {
                    const slides = children
                        .filter(c => isImageFill(c) || vectorTypes.includes(c.type) || c.type === 'IMAGE')
                        .map((img, i) => ({ id: img.id, url: '', _id: `slide_${i + 1} ` }));
                    return { type: 'image-carousel', content: null, imageId: null, styles: { ...styles, slides } };
                }
                case 'icon_list': return { type: 'icon_list', content: node.name, imageId: null, styles };

                // New Widgets
                case 'video': return { type: 'video', content: '', imageId: null, styles };
                case 'google_maps': return { type: 'google_maps', content: '', imageId: null, styles };
                case 'divider': return { type: 'divider', content: '', imageId: null, styles };
                case 'spacer': return { type: 'spacer', content: '', imageId: null, styles };
                case 'form': return { type: 'form', content: '', imageId: null, styles };
                case 'login': return { type: 'login', content: '', imageId: null, styles };
                case 'price-table': return { type: 'price-table', content: '', imageId: null, styles };
                case 'flip-box': return { type: 'flip-box', content: '', imageId: null, styles };
                case 'call-to-action': return { type: 'call-to-action', content: '', imageId: null, styles };
                case 'countdown': return { type: 'countdown', content: '', imageId: null, styles };

                // WooCommerce
                case 'woo:product-title': return { type: 'woo:product-title', content: '', imageId: null, styles };
                case 'woo:product-price': return { type: 'woo:product-price', content: '', imageId: null, styles };
                case 'woo:product-add-to-cart': return { type: 'woo:product-add-to-cart', content: '', imageId: null, styles };
                case 'woo:product-image': return { type: 'woo:product-image', content: '', imageId: null, styles };
            }
        }

        // Fallback checks for simple images
        if (children.length > 0 && children.every(c => isImageFill(c) || (Array.isArray((c as any).children) && (c as any).children.every((gr: any) => isImageFill(gr))))) {
            if (children.length >= 3) {
                return { type: 'basic-gallery', content: node.name, imageId: null, styles };
            }
            const firstImage = children.find(isImageFill) || (children[0] as any)?.children?.find((gr: any) => isImageFill(gr));
            const imageId = firstImage?.id || node.id;
            return { type: 'image', content: null, imageId, styles };
        }

        if (children.some(isImageFill) && !children.some(c => hasTextDeep(c))) {
            const firstImage = children.find(isImageFill);
            return { type: 'image', content: null, imageId: firstImage?.id || node.id, styles };
        }
    }

    // Text
    if (node.type === 'TEXT') {
        // User Preference: 90% of text should be Title (heading)
        // Only use Text Editor for very long paragraphs
        const charCount = (node.characters || '').length;
        const hasNewLines = (node.characters || '').includes('\n');

        const isExplicitText = name.includes('text') || name.includes('paragraph') || name.includes('desc');
        const isExplicitHeading = name.includes('heading') || name.includes('title');

        let isHeading = true; // Default to heading as requested

        if (isExplicitText) {
            isHeading = false;
        } else if (isExplicitHeading) {
            isHeading = true;
        } else {
            // Auto-detect: Only switch to text-editor if it's REALLY long
            if (charCount > 500) {
                isHeading = false;
            }
        }

        if (name.includes('button') || name.includes('btn')) {
            return { type: 'button', content: node.characters || node.name, imageId: null, styles };
        }

        // Populate styles with text properties
        const extractedStyles = extractWidgetStyles(node);
        Object.assign(styles, extractedStyles);

        let content = (node as any).characters || node.name;

        // Ensure rich text is preserved
        if (node.styledTextSegments && node.styledTextSegments.length > 1) {
            const rich = buildHtmlFromSegments(node);
            content = rich.html;
            // If heading, we might need to pass this as 'title' but Elementor Heading widget 
            // supports HTML in title field usually, or we might need to fallback to text-editor 
            // if complex HTML is needed.
            // However, for colors/spans, Heading widget often strips them unless custom CSS is used.
            // But let's stick to the user request: prioritize Heading.
        }

        return {
            type: isHeading ? 'heading' : 'text',
            content,
            imageId: null,
            styles
        };
    }

    // Icon -> Treat as Image to ensure visual fidelity (SVG export)
    if (vectorTypes.includes(node.type)) {
        return { type: 'image', content: null, imageId: node.id, styles };
    }

    // Image
    if (isImageFill(node) || name.startsWith('w:image') || node.type === 'IMAGE') {
        const nestedImageId = findFirstImageId(node);
        return { type: 'image', content: null, imageId: nestedImageId || node.id, styles };
    }

    // Button by name
    if (name.includes('button') || name.includes('btn')) {
        const boxContent = extractBoxContent(node);
        const containerStyles = extractContainerStyles(node);
        const mergedStyles = { ...styles, ...containerStyles };

        // If no fills, set transparent white background
        if (!mergedStyles.background && (!node.fills || node.fills.length === 0)) {
            mergedStyles.fills = [{
                type: 'SOLID',
                color: { r: 1, g: 1, b: 1 },
                opacity: 0,
                visible: true
            }];
        }

        return {
            type: 'button',
            content: boxContent.title || node.name,
            imageId: boxContent.imageId || null,
            styles: mergedStyles
        };
    }

    return null;
}



function toContainer(node: SerializedNode): PipelineContainer {
    console.log('[TO CONTAINER] 🚀 Processing node:', node.name, 'Type:', node.type);

    // **PRIORITY CHECK: If this node is an explicit widget (w:image-box, etc), treat it as a single widget**
    const nodeName = (node.name || '').toLowerCase();
    if (/^(w:|woo:|loop:)/.test(nodeName)) {
        const widgetType = nodeName.replace(/^(w:|woo:|loop:)/, '');
        // Only process as widget if it's NOT a container type
        if (widgetType !== 'container' && widgetType !== 'inner-container' && widgetType !== 'section') {
            console.log('[TO CONTAINER] ✅ Detected explicit widget:', node.name, '→ Processing as single widget');
            const widget = detectWidget(node);
            console.log('[TO CONTAINER] detectWidget returned:', widget ? `type=${widget.type}, content=${widget.content}` : 'NULL');
            if (widget) {
                const styles = extractContainerStyles(node);
                console.log('[TO CONTAINER] Creating container with single widget:', widget.type);
                return {
                    id: node.id,
                    direction: node.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
                    width: 'full',
                    styles,
                    widgets: [widget],
                    children: []
                };
            } else {
                console.log('[TO CONTAINER] ⚠️ detectWidget returned null, falling through to normal container processing');
            }
        }
    }

    let direction: 'row' | 'column' = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
    const styles = extractContainerStyles(node);

    const widgets: PipelineWidget[] = [];
    const childrenContainers: PipelineContainer[] = [];

    const boxed = unwrapBoxedInner(node);
    let childNodes: SerializedNode[] = boxed.flattenedChildren;
    let containerWidth: PipelineContainer['width'] = boxed.isBoxed ? 'boxed' : 'full';

    if (boxed.isBoxed && boxed.inner) {
        const innerStyles = extractContainerStyles(boxed.inner);

        if (boxed.inner.layoutMode === 'HORIZONTAL' || boxed.inner.layoutMode === 'VERTICAL') {
            direction = boxed.inner.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
        }

        const hasPadding = (s: any) => ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].some(k => s[k] !== undefined && s[k] !== null);

        // Use o gap/padding do pai; só herde do inner se o pai não tiver valores definidos
        if (styles.gap === undefined && innerStyles.gap !== undefined) styles.gap = innerStyles.gap;
        if (!hasPadding(styles) && hasPadding(innerStyles)) {
            styles.paddingTop = innerStyles.paddingTop;
            styles.paddingRight = innerStyles.paddingRight;
            styles.paddingBottom = innerStyles.paddingBottom;
            styles.paddingLeft = innerStyles.paddingLeft;
        }
        if (!styles.justify_content && innerStyles.justify_content) styles.justify_content = innerStyles.justify_content;
        if (!styles.align_items && innerStyles.align_items) styles.align_items = innerStyles.align_items;
        if (!styles.background && innerStyles.background) styles.background = innerStyles.background;
        if (!styles.border && innerStyles.border) styles.border = innerStyles.border;

        styles.width = boxed.inner.width;
        styles._boxedInnerSourceId = boxed.inner.id;
    }

    if (!Array.isArray(childNodes)) childNodes = [];

    // Log each child being processed
    console.log('[TO CONTAINER] 📋 After unwrapBoxedInner, processing', childNodes.length, 'children:', childNodes.map(c => c.name));
    childNodes.forEach(child => {
        console.log('[TO CONTAINER] 🔍 Processing child:', child.name, 'Type:', child.type);
    });

    const processedChildNodes = childNodes;

    if (!Array.isArray(processedChildNodes)) {
        console.error('[TO CONTAINER] ❌ processedChildNodes is not an array');
        return {
            id: node.id,
            direction: direction === 'row' ? 'row' : 'column',
            width: containerWidth,
            styles,
            widgets: [],
            children: []
        };
    }

    // Se não tiver Auto Layout, ordenar visualmente (Top -> Bottom, Left -> Right)
    // Isso garante que elementos soltos fiquem em uma ordem lógica na coluna
    const hasInnerAutoLayout = boxed.isBoxed && boxed.inner && (boxed.inner.layoutMode === 'HORIZONTAL' || boxed.inner.layoutMode === 'VERTICAL');
    if (node.layoutMode !== 'HORIZONTAL' && node.layoutMode !== 'VERTICAL' && !hasInnerAutoLayout) {
        processedChildNodes.sort((a, b) => {
            const yDiff = (a.y || 0) - (b.y || 0);
            if (Math.abs(yDiff) > 5) return yDiff; // Tolerância de 5px para linhas
            return (a.x || 0) - (b.x || 0);
        });
    }

    processedChildNodes.forEach((child, idx) => {
        const w = detectWidget(child);
        const childHasChildren = Array.isArray((child as any).children) && (child as any).children.length > 0;
        const orderMark = idx;

        if (w) {
            // If detected as widget, add it as widget and SKIP container processing
            w.styles = { ...(w.styles || {}), _order: orderMark };
            widgets.push(w);
            console.log('[TO CONTAINER] ✅ Added as widget:', child.name, 'Type:', w.type);
        } else if (childHasChildren) {
            // Only process as container if NOT detected as widget
            const childContainer = toContainer(child);
            childContainer.styles = { ...(childContainer.styles || {}), _order: orderMark };
            childrenContainers.push(childContainer);
            console.log('[TO CONTAINER] ✅ Added as container:', child.name);
        } else {
            // Leaf node without widget match - create fallback widget
            widgets.push({
                type: 'custom',
                content: child.name || '',
                imageId: null,
                styles: { sourceId: child.id, sourceName: child.name, _order: orderMark }
            });
        }
    });

    return {
        id: node.id,
        direction: direction === 'row' ? 'row' : 'column',
        width: containerWidth,
        styles,
        widgets,
        children: childrenContainers
    };
}

function analyzeButtonStructure(node: SerializedNode): {
    text: string;
    iconId: string | null;
    textStyles: Record<string, any>;
} {
    const children = (node as any).children || [];
    let text = '';
    let iconId: string | null = null;
    let textStyles: Record<string, any> = {};

    console.log('[BUTTON STRUCTURE] Analyzing button:', node.name);
    console.log('[BUTTON STRUCTURE] Children count:', children.length);
    console.log('[BUTTON STRUCTURE] Children:', children.map((c: any) => ({ name: c.name, type: c.type, id: c.id })));

    // Find text child (w:heading, w:text, or TEXT node)
    const textChild = children.find((c: SerializedNode) =>
        c.type === 'TEXT' ||
        c.name?.toLowerCase().includes('heading') ||
        c.name?.toLowerCase().includes('text')
    );

    if (textChild) {
        text = textChild.characters || textChild.name || '';
        textStyles = extractWidgetStyles(textChild);
        console.log('[BUTTON STRUCTURE] Found text child:', textChild.name, 'Text:', text);
        console.log('[BUTTON STRUCTURE] Text styles:', JSON.stringify(textStyles, null, 2));
    } else {
        console.log('[BUTTON STRUCTURE] No text child found');
    }

    // Find icon child (deep search for VECTOR/IMAGE)
    console.log('[BUTTON STRUCTURE] Searching for icon with findFirstImageId...');
    iconId = findFirstImageId(node);
    if (iconId) {
        console.log('[BUTTON STRUCTURE] ✅ Found icon ID:', iconId);
    } else {
        console.log('[BUTTON STRUCTURE] ❌ No icon found');
        console.log('[BUTTON STRUCTURE] Node details:', JSON.stringify({
            id: node.id,
            name: node.name,
            type: node.type,
            hasChildren: children.length > 0
        }, null, 2));
    }

    return { text, iconId, textStyles };
}

// Generic widget structure analyzer (uses patterns)
function analyzeWidgetStructure(
    node: SerializedNode,
    widgetType: string
): {
    text: string;
    iconId: string | null;
    textStyles: Record<string, any>;
    containerStyles: Record<string, any>;
    childWidgets: PipelineWidget[];  // NEW: Detected child widgets
} {
    const children = (node as any).children || [];
    let text = '';
    let iconId: string | null = null;
    let textStyles: Record<string, any> = {};
    let containerStyles: Record<string, any> = {};
    const childWidgets: PipelineWidget[] = [];  // NEW: Store detected widgets

    console.log('[WIDGET STRUCTURE] Analyzing', widgetType, ':', node.name);
    console.log('[WIDGET STRUCTURE] Children count:', children.length);

    // 1. Check if the node ITSELF is content (Leaf Node)
    if (node.type === 'TEXT') {
        text = node.characters || node.name || '';
        textStyles = extractWidgetStyles(node);
        console.log('[WIDGET STRUCTURE] Node is TEXT. Content:', text);
    } else if (isImageFill(node) || node.type === 'IMAGE' || node.type === 'VECTOR') {
        iconId = node.id; // Use own ID if it's an image
        console.log('[WIDGET STRUCTURE] Node is IMAGE/VECTOR. ID:', iconId);
    }

    // 2. Process children (Container/Frame)
    children.forEach((child: SerializedNode) => {
        // Try to detect widget from child
        const detectedWidget = detectWidget(child);

        if (detectedWidget) {
            console.log('[WIDGET STRUCTURE] Detected child widget:', detectedWidget.type, 'from', child.name);
            childWidgets.push(detectedWidget);
        } else if (child.type === 'TEXT') {
            // Direct text node child (only if we haven't found text yet or if it's a container)
            if (!text) {
                text = child.characters || child.name || '';
                textStyles = extractWidgetStyles(child);
                console.log('[WIDGET STRUCTURE] Found text child:', text);
            }
        } else if (isImageFill(child) || child.type === 'IMAGE' || child.type === 'VECTOR') {
            // Direct image/icon node child
            if (!iconId) {
                iconId = child.id;
                console.log('[WIDGET STRUCTURE] Found image/icon child ID:', iconId);
            }
        }
    });

    // If no child widgets detected, fallback to old behavior (find first text/image)
    if (childWidgets.length === 0) {
        if (!text) {
            const textChild = children.find((c: SerializedNode) =>
                c.type === 'TEXT' ||
                c.name?.toLowerCase().includes('heading') ||
                c.name?.toLowerCase().includes('text')
            );
            if (textChild) {
                text = textChild.characters || textChild.name || '';
                textStyles = extractWidgetStyles(textChild);
                console.log('[WIDGET STRUCTURE] Fallback: Found text:', text);
            }
        }

        if (!iconId) {
            iconId = findFirstImageId(node);
            if (iconId) {
                console.log('[WIDGET STRUCTURE] Fallback: Found image/icon ID:', iconId);
            }
        }
    }

    // Extract container styles
    containerStyles = extractContainerStyles(node);

    return { text, iconId, textStyles, containerStyles, childWidgets };
}

export function analyzeTreeWithHeuristics(tree: SerializedNode): SerializedNode {
    return tree;
}

export function convertToFlexSchema(analyzedTree: SerializedNode): PipelineSchema {
    const rootContainer = toContainer(analyzedTree);
    const tokens = { primaryColor: '#000000', secondaryColor: '#FFFFFF' };

    // Debug: Log schema IMMEDIATELY after toContainer, BEFORE any merge/normalize
    console.log('[convertToFlexSchema] Root container after toContainer:', JSON.stringify({
        id: rootContainer.id,
        widgets: rootContainer.widgets?.length || 0,
        widgetTypes: rootContainer.widgets?.map(w => w.type) || [],
        children: rootContainer.children?.length || 0,
        childrenIds: rootContainer.children?.map(c => c.id) || []
    }, null, 2));

    return {
        page: { title: analyzedTree.name || 'Layout importado', tokens },
        containers: [rootContainer]
    };
}

function extractBoxContent(node: SerializedNode): { imageId: string | null, title: string, description: string } {
    const children = (node as any).children || [];
    let imageId: string | null = null;
    let title = '';
    let description = '';

    console.log('[EXTRACT BOX] Processing node:', node.name, 'with', children.length, 'children');

    // Find Image/Icon - Check for explicitly named w:image or w:icon first
    for (const child of children) {
        const childName = (child.name || '').toLowerCase();
        console.log('[EXTRACT BOX] Checking child:', child.name, 'Type:', child.type);

        if (childName.startsWith('w:image') || childName.startsWith('w:icon')) {
            imageId = child.id;
            console.log('[EXTRACT BOX] ✅ Found explicit image/icon:', child.name, 'ID:', imageId);
            break;
        }
    }

    // If no explicit name, do deep search
    if (!imageId) {
        function findIconDeep(n: SerializedNode): string | null {
            if (isImageFill(n) || n.type === 'IMAGE' || n.type === 'VECTOR') {
                return n.id;
            }
            if ((n as any).children) {
                for (const child of (n as any).children) {
                    const found = findIconDeep(child);
                    if (found) return found;
                }
            }
            return null;
        }

        const imgNode = children.find((c: SerializedNode) => isImageFill(c) || c.type === 'IMAGE' || c.type === 'VECTOR');
        if (imgNode) {
            imageId = imgNode.id;
            console.log('[EXTRACT BOX] ✅ Found image via type:', imageId);
        } else {
            for (const child of children) {
                imageId = findIconDeep(child);
                if (imageId) {
                    console.log('[EXTRACT BOX] ✅ Found image via deep search:', imageId);
                    break;
                }
            }
        }
    }

    // Find Texts - Check for explicitly named w:heading and w:text-editor first
    const textNodes: SerializedNode[] = [];

    for (const child of children) {
        const childName = (child.name || '').toLowerCase();

        if (childName.startsWith('w:heading') || childName.includes('title') || childName.includes('heading')) {
            if (child.type === 'TEXT') {
                title = (child as any).characters || child.name;
                console.log('[EXTRACT BOX] ✅ Found title:', title);
            }
        } else if (childName.startsWith('w:text-editor') || childName.startsWith('w:text') || childName.includes('description') || childName.includes('desc')) {
            if (child.type === 'TEXT') {
                description = (child as any).characters || child.name;
                console.log('[EXTRACT BOX] ✅ Found description:', description.substring(0, 50) + '...');
            }
        } else if (child.type === 'TEXT' && !title && !description) {
            // Fallback: collect all text nodes
            textNodes.push(child);
        }
    }

    // If no explicit names found, use fallback logic
    if (!title && !description) {
        function collectTexts(n: SerializedNode) {
            if (n.type === 'TEXT') {
                textNodes.push(n);
                return;
            }
            if ((n as any).children) {
                for (const child of (n as any).children) {
                    collectTexts(child);
                    if (textNodes.length >= 2) break;
                }
            }
        }

        for (const child of children) {
            collectTexts(child);
            if (textNodes.length >= 2) break;
        }

        if (textNodes.length > 0) {
            title = (textNodes[0] as any).characters || textNodes[0].name;
            console.log('[EXTRACT BOX] ✅ Fallback title:', title);
        }
        if (textNodes.length > 1) {
            description = (textNodes[1] as any).characters || textNodes[1].name;
            console.log('[EXTRACT BOX] ✅ Fallback description:', description.substring(0, 50) + '...');
        }
    }

    console.log('[EXTRACT BOX] Final result - imageId:', imageId, 'title:', title, 'description:', description ? description.substring(0, 30) + '...' : 'empty');
    return { imageId, title, description };
}
