import { SerializedNode, rgbToHex } from '../utils/serialization_utils';
import { extractWidgetStyles, extractContainerStyles, buildHtmlFromSegments } from '../utils/style_utils';
import type { PipelineSchema, PipelineContainer, PipelineWidget } from '../types/pipeline.schema';

type MaybeWidget = PipelineWidget | null;

const vectorTypes = ['VECTOR', 'STAR', 'ELLIPSE', 'POLYGON', 'BOOLEAN_OPERATION', 'LINE', 'RECTANGLE'];

function isImageFill(node: any): boolean {
    if (!node) return false;
    if (node.type === 'IMAGE') return true;
    const fills = node?.fills;
    if (!Array.isArray(fills)) return false;
    return fills.some((f: any) => f?.type === 'IMAGE');
}

function findFirstImageId(node: any): string | null {
    if (!node) return null;
    if (isImageFill(node)) return node.id || null;
    const children = (node as any).children;
    if (Array.isArray(children)) {
        for (const child of children) {
            const found = findFirstImageId(child);
            if (found) return found;
        }
    }
    return null;
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
    if (node.width < BOXED_MIN_PARENT_WIDTH || rawChildren.length === 0) {
        return { isBoxed: false, inner: null, flattenedChildren: rawChildren };
    }

    const candidate = rawChildren.find(child =>
        isContainerLike(child) &&
        typeof child.width === 'number' &&
        child.width > 0 &&
        child.width < node.width &&
        (node.width - child.width) >= BOXED_MIN_WIDTH_DELTA
    );

    if (!candidate) {
        return { isBoxed: false, inner: null, flattenedChildren: rawChildren };
    }

    const innerChildren = Array.isArray((candidate as any).children) ? (candidate as any).children as SerializedNode[] : [];
    const idx = rawChildren.indexOf(candidate);
    const before = idx >= 0 ? rawChildren.slice(0, idx) : [];
    const after = idx >= 0 ? rawChildren.slice(idx + 1) : [];

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

    // Explicit overrides by name (Level 1 Intelligence)
    if (name.startsWith('w:')) {
        const boxContent = extractBoxContent(node);

        if (name.includes('image-box')) {
            return {
                type: 'image-box',
                content: boxContent.title || node.name,
                imageId: boxContent.imageId || findFirstImageId(node) || null,
                styles: { ...styles, title_text: boxContent.title, description_text: boxContent.description }
            };
        }
        if (name.includes('icon-box')) {
            return {
                type: 'icon-box',
                content: boxContent.title || node.name,
                imageId: boxContent.imageId || findFirstImageId(node) || null,
                styles: { ...styles, title_text: boxContent.title, description_text: boxContent.description }
            };
        }
        if (name.includes('button')) {
            console.log('[BUTTON DETECT] Found button by name:', node.name);

            // Structural analysis - extract from children
            const buttonData = analyzeButtonStructure(node);

            // Buttons are FRAMEs, so we need container styles for padding/fills
            const containerStyles = extractContainerStyles(node);
            const mergedStyles = { ...styles, ...containerStyles, ...buttonData.textStyles };

            console.log('[BUTTON DETECT] Button data:', JSON.stringify(buttonData, null, 2));
            console.log('[BUTTON DETECT] Merged styles:', JSON.stringify(mergedStyles, null, 2));

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
                content: buttonData.text || node.name,
                imageId: buttonData.iconId,
                styles: mergedStyles
            };
        }
        if (name.includes('video')) return { type: 'video', content: '', imageId: null, styles };
        // ... allow others to pass through to be caught by scoring or default logic
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
                        .map((img, i) => ({ id: img.id, url: '', _id: `slide_${i + 1}` }));
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

    // Se não tiver Auto Layout, ordenar visualmente (Top -> Bottom, Left -> Right)
    // Isso garante que elementos soltos fiquem em uma ordem lógica na coluna
    const hasInnerAutoLayout = boxed.isBoxed && boxed.inner && (boxed.inner.layoutMode === 'HORIZONTAL' || boxed.inner.layoutMode === 'VERTICAL');
    if (node.layoutMode !== 'HORIZONTAL' && node.layoutMode !== 'VERTICAL' && !hasInnerAutoLayout) {
        childNodes.sort((a, b) => {
            const yDiff = (a.y || 0) - (b.y || 0);
            if (Math.abs(yDiff) > 5) return yDiff; // Tolerância de 5px para linhas
            return (a.x || 0) - (b.x || 0);
        });
    }

    childNodes.forEach((child, idx) => {
        const w = detectWidget(child);
        const childHasChildren = Array.isArray((child as any).children) && (child as any).children.length > 0;
        const orderMark = idx;

        if (w) {
            w.styles = { ...(w.styles || {}), _order: orderMark };
            widgets.push(w);
        } else {
            if (childHasChildren) {
                const childContainer = toContainer(child);
                childContainer.styles = { ...(childContainer.styles || {}), _order: orderMark };
                childrenContainers.push(childContainer);
            } else {
                widgets.push({
                    type: 'custom',
                    content: child.name || '',
                    imageId: null,
                    styles: { sourceId: child.id, sourceName: child.name, _order: orderMark }
                });
            }
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
    iconId = findFirstImageId(node);
    if (iconId) {
        console.log('[BUTTON STRUCTURE] Found icon ID:', iconId);
    } else {
        console.log('[BUTTON STRUCTURE] No icon found');
    }

    return { text, iconId, textStyles };
}

export function analyzeTreeWithHeuristics(tree: SerializedNode): SerializedNode {
    return tree;
}

export function convertToFlexSchema(analyzedTree: SerializedNode): PipelineSchema {
    const rootContainer = toContainer(analyzedTree);
    const tokens = { primaryColor: '#000000', secondaryColor: '#FFFFFF' };
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

    // Find Image/Icon - Deep recursive search
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

    // Check direct children first
    const imgNode = children.find((c: SerializedNode) => isImageFill(c) || c.type === 'IMAGE' || c.type === 'VECTOR');
    if (imgNode) {
        imageId = imgNode.id;
    } else {
        // Deep search through all descendants
        for (const child of children) {
            imageId = findIconDeep(child);
            if (imageId) break;
        }
    }

    // Find Texts
    // We want to find the first two significant text nodes
    const textNodes: SerializedNode[] = [];

    function collectTexts(n: SerializedNode) {
        if (n.type === 'TEXT') {
            textNodes.push(n);
            return;
        }
        if ((n as any).children) {
            for (const child of (n as any).children) {
                collectTexts(child);
                if (textNodes.length >= 2) return; // Stop if we found 2 texts
            }
        }
    }

    // Collect texts from children (in order)
    for (const child of children) {
        collectTexts(child);
        if (textNodes.length >= 2) break;
    }

    if (textNodes.length > 0) {
        title = (textNodes[0] as any).characters || textNodes[0].name;
    }
    if (textNodes.length > 1) {
        description = (textNodes[1] as any).characters || textNodes[1].name;
    }

    return { imageId, title, description };
}
