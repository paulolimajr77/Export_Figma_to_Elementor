import { WidgetDetection } from '../types';
import { normalizeWidgetSlug } from '../config/widget-taxonomy';

/**
 * WidgetDetector - DetecÃ§Ã£o inteligente de widgets Elementor
 * 
 * Analisa nodes do Figma e identifica qual widget Elementor melhor representa cada elemento.
 * Suporta 148 widgets divididos em 6 categorias:
 * - BÃ¡sicos (36)
 * - Pro (53)
 * - WooCommerce (31)
 * - Loop Builder (11)
 * - Experimentais (9)
 * - WordPress (8)
 */

interface WidgetRule {
    widget: string;
    matcher: (node: SceneNode) => number; // Retorna confidence 0-1
    category: 'basic' | 'pro' | 'woo' | 'loop' | 'experimental' | 'wordpress';
}

// Compatibilidade de widgets por tipo de node para evitar sugestÃµes absurdas
const WIDGETS_BY_NODE_TYPE: Partial<Record<SceneNode['type'], string[]>> = {
    TEXT: ['w:heading', 'w:post-title', 'w:call-to-action', 'w:text-editor', 'w:paragraph', 'w:rich-text'],
    RECTANGLE: ['w:image', 'w:button', 'w:icon'],
    FRAME: ['w:container', 'w:icon-box', 'w:image-box', 'w:card'],
    GROUP: ['w:card', 'w:icon-box']
};

const HIGH_RISK_WIDGETS = new Set([
    'w:google-maps',
    'w:gallery',
    'w:basic-gallery',
    'w:image-carousel',
    'w:gallery-pro',
    'w:icon-box'
]);

export class WidgetDetector {
    private rules: WidgetRule[] = [];
    private lockedImageGroupIds: Set<string> = new Set();
    private lockedImageDescendants: Set<string> = new Set();

    constructor() {
        this.initializeRules();
    }

    /**
     * Detecta qual widget Elementor melhor representa o node
     */
    detect(node: SceneNode): WidgetDetection | null {
        // Respeita prefixos t????cnicos expl????citos (ex.: w:image, woo:product-image)
        const explicitDetection = this.detectByExplicitName(node);
        if (explicitDetection) {
            return explicitDetection;
        }

        if (!this.isWidgetCandidate(node)) {
            return null;
        }

        const allowedWidgets = this.getAllowedWidgetsForNodeType(node.type);
        if (!allowedWidgets.length) {
            return null;
        }

        const candidateRules = this.rules.filter(rule => allowedWidgets.includes(rule.widget));
        const detections: Array<{
            widget: string;
            confidence: number;
            justification: string;
            source?: WidgetDetection['source'];
        }> = [];

        for (const rule of candidateRules) {
            const confidence = rule.matcher(node);
            if (confidence > 0) {
                detections.push({
                    widget: rule.widget,
                    confidence,
                    justification: this.generateJustification(node, rule.widget, confidence),
                    source: 'heuristic'
                });
            }
        }

        // Ordena por confidence e retorna o melhor match
        detections.sort((a, b) => b.confidence - a.confidence);
        const best = detections[0];

        if (!best) {
            return null;
        }

        if (!this.shouldAcceptWidgetDetection(best.widget, best.confidence, node.name)) {
            return null; // Confidence insuficiente para o widget considerado
        }

        return {
            node_id: node.id,
            node_name: node.name,
            widget: best.widget,
            confidence: best.confidence,
            justification: best.justification,
            source: best.source || 'heuristic'
        };
    }

    /**
     * Detecta mÃºltiplos widgets em uma Ã¡rvore
     */
    detectAll(root: SceneNode): Map<string, WidgetDetection> {
        const results: Map<string, WidgetDetection> = new Map();
        const consumed: Set<string> = new Set();
        this.lockedImageGroupIds = new Set();
        this.lockedImageDescendants = new Set();

        const traverse = (node: SceneNode) => {
            if (consumed.has(node.id)) return;

            // Locked Image Group: trata como imagem ?nica e consome todos os descendentes
            if (this.isLockedImageGroup(node)) {
                const idsToConsume = this.collectDescendantIds(node);
                idsToConsume.forEach(id => {
                    consumed.add(id);
                    this.lockedImageDescendants.add(id);
                });
                this.lockedImageGroupIds.add(node.id);
                return;
            }

            // Wrappers visuais: colapsa e anexa metadata ao filho Ãšnico
            const singleChild = this.getSingleChild(node);
            if (singleChild && this.isVisualWrapper(node)) {
                traverse(singleChild);
                const childDetection = results.get(singleChild.id);
                if (childDetection) {
                    childDetection.wrapperCollapsed = true;
                    childDetection.wrapperNodeId = node.id;
                    childDetection.visualWrapperStyle = this.extractWrapperStyle(node);
                    results.set(childDetection.node_id, childDetection);
                }
                consumed.add(node.id);
                return;
            }

            // Composite detection primeiro (icon-box, icon-list, form)
            const composite = this.detectComposite(node, consumed);
            if (composite) {
                this.attachMicrotexts(node, composite.detection, consumed);
                results.set(node.id, composite.detection);
                composite.consumedIds.forEach(id => consumed.add(id));
                if ('children' in node && node.children) {
                    for (const child of node.children) {
                        if (!consumed.has(child.id)) traverse(child as SceneNode);
                    }
                }
                return;
            }

            const detection = this.detect(node);
            if (detection) {
                this.attachMicrotexts(node, detection, consumed);
                results.set(node.id, detection);
            }

            if ('children' in node && node.children) {
                for (const child of node.children) {
                    traverse(child as SceneNode);
                }
            }
        };

        traverse(root);
        return results;
    }

    /**
     * Inicializa todas as regras de detecÃ§Ã£o
     */
    private initializeRules(): void {
        // === BÃSICOS ===
        this.addRule('w:heading', 'basic', this.matchHeading.bind(this));
        this.addRule('w:text-editor', 'basic', this.matchTextEditor.bind(this));
        this.addRule('w:button', 'basic', this.matchButton.bind(this));
        this.addRule('w:image', 'basic', this.matchImage.bind(this));
        this.addRule('w:icon', 'basic', this.matchIcon.bind(this));
        this.addRule('w:video', 'basic', this.matchVideo.bind(this));
        this.addRule('w:divider', 'basic', this.matchDivider.bind(this));
        this.addRule('w:spacer', 'basic', this.matchSpacer.bind(this));
        this.addRule('w:image-box', 'basic', this.matchImageBox.bind(this));
        this.addRule('w:icon-box', 'basic', this.matchIconBox.bind(this));
        this.addRule('w:star-rating', 'basic', this.matchStarRating.bind(this));
        this.addRule('w:counter', 'basic', this.matchCounter.bind(this));
        this.addRule('w:progress', 'basic', this.matchProgress.bind(this));
        this.addRule('w:tabs', 'basic', this.matchTabs.bind(this));
        this.addRule('w:accordion', 'basic', this.matchAccordion.bind(this));
        this.addRule('w:toggle', 'basic', this.matchToggle.bind(this));
        this.addRule('w:alert', 'basic', this.matchAlert.bind(this));
        this.addRule('w:social-icons', 'basic', this.matchSocialIcons.bind(this));
        this.addRule('w:icon-list', 'basic', this.matchIconList.bind(this));
        this.addRule('w:nav-menu', 'basic', this.matchNavMenu.bind(this));
        this.addRule('w:search-form', 'basic', this.matchSearchForm.bind(this));
        this.addRule('w:testimonial', 'basic', this.matchTestimonial.bind(this));
        this.addRule('w:container', 'basic', this.matchContainer.bind(this));

        // === PRO ===
        this.addRule('w:form', 'pro', this.matchForm.bind(this));
        this.addRule('w:login', 'pro', this.matchLogin.bind(this));
        this.addRule('w:call-to-action', 'pro', this.matchCTA.bind(this));
        this.addRule('w:portfolio', 'pro', this.matchPortfolio.bind(this));
        this.addRule('w:flip-box', 'pro', this.matchFlipBox.bind(this));
        this.addRule('w:animated-headline', 'pro', this.matchAnimatedHeadline.bind(this));
        this.addRule('w:countdown', 'pro', this.matchCountdown.bind(this));
        this.addRule('w:price-table', 'pro', this.matchPriceTable.bind(this));
        this.addRule('w:price-list', 'pro', this.matchPriceList.bind(this));
        this.addRule('w:post-title', 'pro', this.matchGenericText.bind(this));
        this.addRule('w:post-excerpt', 'pro', this.matchGenericText.bind(this));
        this.addRule('w:post-content', 'pro', this.matchGenericText.bind(this));
        // this.addRule('w:author-box', 'pro', this.matchGenericContainer.bind(this)); // DISABLED: too generic, causing false positives
        this.addRule('w:share-buttons', 'pro', this.matchSocialIcons.bind(this));
        this.addRule('w:slideshow', 'pro', this.matchPortfolio.bind(this));
        this.addRule('w:gallery-pro', 'pro', this.matchPortfolio.bind(this));

        // === WOOCOMMERCE ===
        this.addRule('woo:product-title', 'woo', this.matchWooProductTitle.bind(this));
        this.addRule('woo:product-image', 'woo', this.matchWooProductImage.bind(this));
        this.addRule('woo:product-price', 'woo', this.matchWooProductPrice.bind(this));
        this.addRule('woo:product-add-to-cart', 'woo', this.matchWooAddToCart.bind(this));
        this.addRule('woo:product-rating', 'woo', this.matchWooProductRating.bind(this));
        // this.addRule('woo:cart', 'woo', this.matchGenericContainer.bind(this)); // DISABLED: too generic
        this.addRule('woo:checkout', 'woo', this.matchForm.bind(this));

        // === LOOP BUILDER ===
        // this.addRule('loop:item', 'loop', this.matchGenericContainer.bind(this)); // DISABLED: too generic
        this.addRule('loop:image', 'loop', this.matchImage.bind(this));
        this.addRule('loop:title', 'loop', this.matchHeading.bind(this));
        this.addRule('loop:meta', 'loop', this.matchGenericText.bind(this));
        this.addRule('loop:terms', 'loop', this.matchGenericText.bind(this));
        this.addRule('loop:rating', 'loop', this.matchStarRating.bind(this));
        this.addRule('loop:price', 'loop', this.matchGenericText.bind(this));
        this.addRule('loop:add-to-cart', 'loop', this.matchButton.bind(this));
        this.addRule('loop:read-more', 'loop', this.matchButton.bind(this));
        this.addRule('loop:featured-image', 'loop', this.matchImage.bind(this));
        // this.addRule('loop:pagination', 'loop', this.matchGenericContainer.bind(this)); // DISABLED: too generic

        // === WORDPRESS ===
        this.addRule('w:wp-search', 'wordpress', this.matchSearchForm.bind(this));
        // this.addRule('w:wp-recent-posts', 'wordpress', this.matchGenericContainer.bind(this)); // DISABLED: too generic
        // this.addRule('w:wp-archives', 'wordpress', this.matchGenericContainer.bind(this)); // DISABLED: too generic
        // this.addRule('w:wp-categories', 'wordpress', this.matchGenericContainer.bind(this)); // DISABLED: too generic
        // this.addRule('w:wp-calendar', 'wordpress', this.matchGenericContainer.bind(this)); // DISABLED: too generic
        // this.addRule('w:wp-tag-cloud', 'wordpress', this.matchGenericContainer.bind(this)); // DISABLED: too generic
        // this.addRule('w:wp-recent-comments', 'wordpress', this.matchGenericContainer.bind(this)); // DISABLED: too generic
        this.addRule('w:wp-custom-menu', 'wordpress', this.matchNavMenu.bind(this));

        // === BÃSICOS ADICIONAIS (Fase 1) ===
        this.addRule('w:gallery', 'basic', this.matchGallery.bind(this));
        this.addRule('w:image-carousel', 'basic', this.matchImageCarousel.bind(this));
        this.addRule('w:basic-gallery', 'basic', this.matchGallery.bind(this));
        this.addRule('w:google-maps', 'basic', this.matchGoogleMaps.bind(this));
        this.addRule('w:embed', 'basic', this.matchEmbed.bind(this));
        this.addRule('w:lottie', 'basic', this.matchLottie.bind(this));
        this.addRule('w:shortcode', 'basic', this.matchShortcode.bind(this));
        this.addRule('w:html', 'basic', this.matchHTML.bind(this));
        this.addRule('w:menu-anchor', 'basic', this.matchMenuAnchor.bind(this));
        this.addRule('w:sidebar', 'basic', this.matchSidebar.bind(this));
        this.addRule('w:read-more', 'basic', this.matchReadMore.bind(this));
        this.addRule('w:soundcloud', 'basic', this.matchSoundcloud.bind(this));
        this.addRule('loop:grid', 'basic', this.matchLoopGrid.bind(this));

        // === WOOCOMMERCE SIMPLES (Fase 1) ===
        this.addRule('woo:product-breadcrumb', 'woo', this.matchWooBreadcrumb.bind(this));
        this.addRule('woo:products', 'woo', this.matchWooProducts.bind(this));
        this.addRule('woo:product-grid', 'woo', this.matchWooProductGrid.bind(this));
        this.addRule('woo:product-carousel', 'woo', this.matchWooProductCarousel.bind(this));
        this.addRule('woo:loop-product-title', 'woo', this.matchGenericText.bind(this));
        this.addRule('woo:loop-product-price', 'woo', this.matchGenericText.bind(this));
        this.addRule('woo:loop-product-image', 'woo', this.matchImage.bind(this));
        this.addRule('woo:loop-product-button', 'woo', this.matchButton.bind(this));

        this.addRule('woo:product-data-tabs', 'woo', this.matchWooProductTabs.bind(this));
        this.addRule('woo:product-excerpt', 'woo', this.matchGenericText.bind(this));
        this.addRule('woo:product-stock', 'woo', this.matchWooProductStock.bind(this));
        this.addRule('woo:product-meta', 'woo', this.matchWooProductMeta.bind(this));

        // === PRO AVANÃ‡ADO (Fase 3) ===
        this.addRule('w:subscription', 'pro', this.matchSubscription.bind(this));
        this.addRule('w:media-carousel', 'pro', this.matchMediaCarousel.bind(this));
        this.addRule('w:slider-slides', 'pro', this.matchSliderSlides.bind(this));
        this.addRule('w:post-navigation', 'pro', this.matchPostNavigation.bind(this));
        this.addRule('w:table-of-contents', 'pro', this.matchTableOfContents.bind(this));
        this.addRule('w:blockquote', 'pro', this.matchBlockquote.bind(this));
        this.addRule('w:testimonial-carousel', 'pro', this.matchTestimonialCarousel.bind(this));
        this.addRule('w:review-box', 'pro', this.matchReviewBox.bind(this));
        this.addRule('w:reviews', 'pro', this.matchReviews.bind(this));
        this.addRule('w:hotspots', 'pro', this.matchHotspots.bind(this));
        this.addRule('w:sitemap', 'pro', this.matchSitemap.bind(this));
        this.addRule('w:progress-tracker', 'pro', this.matchProgressTracker.bind(this));
        this.addRule('w:animated-text', 'pro', this.matchAnimatedText.bind(this));
        this.addRule('w:nav-menu-pro', 'pro', this.matchNavMenu.bind(this));
        this.addRule('w:breadcrumb', 'pro', this.matchBreadcrumb.bind(this));
        this.addRule('w:facebook-button', 'pro', this.matchFacebookButton.bind(this));
        this.addRule('w:facebook-comments', 'pro', this.matchFacebookComments.bind(this));
        this.addRule('w:facebook-embed', 'pro', this.matchFacebookEmbed.bind(this));
        this.addRule('w:facebook-page', 'pro', this.matchFacebookPage.bind(this));
        this.addRule('w:loop-builder', 'pro', this.matchLoopBuilder.bind(this));
        this.addRule('w:loop-grid-advanced', 'pro', this.matchLoopGrid.bind(this));
        this.addRule('w:loop-carousel', 'pro', this.matchImageCarousel.bind(this));
        this.addRule('w:post-info', 'pro', this.matchPostInfo.bind(this));
        this.addRule('w:post-featured-image', 'pro', this.matchImage.bind(this));
        this.addRule('w:post-author', 'pro', this.matchGenericText.bind(this));
        this.addRule('w:post-date', 'pro', this.matchGenericText.bind(this));
        this.addRule('w:post-terms', 'pro', this.matchGenericText.bind(this));
        this.addRule('w:archive-title', 'pro', this.matchHeading.bind(this));
        this.addRule('w:archive-description', 'pro', this.matchGenericText.bind(this));
        this.addRule('w:site-logo', 'pro', this.matchImage.bind(this));
        this.addRule('w:site-title', 'pro', this.matchHeading.bind(this));
        this.addRule('w:site-tagline', 'pro', this.matchGenericText.bind(this));
        this.addRule('w:search-results', 'pro', this.matchSearchResults.bind(this));
        this.addRule('w:global-widget', 'pro', this.matchGlobalWidget.bind(this));
        this.addRule('w:video-playlist', 'pro', this.matchVideoPlaylist.bind(this));
        this.addRule('w:video-gallery', 'pro', this.matchVideoGallery.bind(this));
        this.addRule('w:nested-tabs', 'pro', this.matchNestedTabs.bind(this));

        // === EXPERIMENTAIS (Fase 4) ===
        this.addRule('w:mega-menu', 'experimental', this.matchMegaMenu.bind(this));
        this.addRule('w:scroll-snap', 'experimental', this.matchScrollSnap.bind(this));
        this.addRule('w:motion-effects', 'experimental', this.matchMotionEffects.bind(this));
        this.addRule('w:background-slideshow', 'experimental', this.matchBackgroundSlideshow.bind(this));
        this.addRule('w:css-transform', 'experimental', this.matchCSSTransform.bind(this));
        this.addRule('w:custom-position', 'experimental', this.matchCustomPosition.bind(this));
        this.addRule('w:dynamic-tags', 'experimental', this.matchDynamicTags.bind(this));
        this.addRule('w:ajax-pagination', 'experimental', this.matchAjaxPagination.bind(this));
        this.addRule('w:parallax', 'experimental', this.matchParallax.bind(this));
    }

    /**
     * Adiciona uma regra de detecÃ§Ã£o
     */
    private addRule(widget: string, category: WidgetRule['category'], matcher: (node: SceneNode) => number): void {
        this.rules.push({ widget, category, matcher });
    }

    /**
     * Gera justificativa para a detecÃ§Ã£o
     */
    private generateJustification(node: SceneNode, widget: string, confidence: number): string {
        const reasons: string[] = [];

        // AnÃ¡lise baseada no nome
        if (node.name.toLowerCase().includes(widget.replace(/^w:|^woo:|^loop:/, ''))) {
            reasons.push('Nome do layer corresponde ao widget');
        }

        // AnÃ¡lise baseada no tipo
        if (node.type === 'TEXT') {
            reasons.push('Ã‰ um elemento de texto');
        } else if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
            reasons.push('Estrutura compatÃ­vel com o widget');
        }

        // Confidence
        if (confidence >= 0.8) {
            reasons.push('Alta confianÃ§a na detecÃ§Ã£o');
        } else if (confidence >= 0.5) {
            reasons.push('ConfianÃ§a moderada');
        }

        return reasons.join('; ');
    }

    /**
     * Helper: Analisa contexto visual do node
     */
    private analyzeVisualContext(node: SceneNode): {
        aspectRatio: number;
        hasBackground: boolean;
        hasBorder: boolean;
        hasIcon: boolean;
        hasImage: boolean;
        textCount: number;
        avgTextLength: number;
    } {
        const width = 'width' in node ? node.width : 0;
        const height = 'height' in node ? node.height : 0;
        const aspectRatio = height > 0 ? width / height : 0;

        const hasBackground = 'fills' in node && Array.isArray(node.fills) && node.fills.length > 0 && node.fills.some(f => f.visible !== false);
        const hasBorder = 'strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0 && node.strokes.some(s => s.visible !== false);

        let hasIcon = false;
        let hasImage = false;
        let textCount = 0;
        let totalTextLength = 0;

        if ('children' in node && node.children) {
            for (const child of node.children) {
                if (child.type === 'VECTOR' || child.type === 'STAR' || child.type === 'ELLIPSE' || child.type === 'POLYGON' || child.type === 'BOOLEAN_OPERATION') {
                    hasIcon = true;
                }
                if (child.name.toLowerCase().includes('icon')) {
                    hasIcon = true;
                }


                if ('fills' in child && Array.isArray(child.fills)) {
                    if (child.fills.some(f => f.type === 'IMAGE')) {
                        hasImage = true;
                    }
                }

                if (child.type === 'TEXT' && 'characters' in child) {
                    textCount++;
                    totalTextLength += (child.characters?.length || 0);
                }
            }
        }

        return {
            aspectRatio,
            hasBackground,
            hasBorder,
            hasIcon,
            hasImage,
            textCount,
            avgTextLength: textCount > 0 ? totalTextLength / textCount : 0
        };
    }

    /**
     * Helper: Analisa conteÃºdo de texto
     */
    private analyzeTextContent(node: SceneNode): {
        hasQuote: boolean;
        hasAuthor: boolean;
        isLongText: boolean;
        hasTitle: boolean;
        hasDescription: boolean;
    } {
        let hasQuote = false;
        let hasAuthor = false;
        let isLongText = false;
        let hasTitle = false;
        let hasDescription = false;

        if ('children' in node && node.children) {
            const texts = node.children.filter(child => child.type === 'TEXT') as TextNode[];

            hasQuote = texts.some(t => t.characters.includes('"') || t.characters.includes('â€œ') || t.characters.includes('â€') || t.name.toLowerCase().includes('quote'));
            hasAuthor = texts.some(t => t.name.toLowerCase().includes('author') || t.name.toLowerCase().includes('autor') || t.name.toLowerCase().includes('role') || t.name.toLowerCase().includes('cargo'));
            isLongText = texts.some(t => t.characters.length > 100);

            hasTitle = texts.some(t => (typeof t.fontSize === 'number' && t.fontSize > 16) || t.fontWeight === 700 || t.name.toLowerCase().includes('title') || t.name.toLowerCase().includes('heading'));
            hasDescription = texts.some(t => t.characters.length > 40 || t.name.toLowerCase().includes('desc') || t.name.toLowerCase().includes('text'));
        }

        return { hasQuote, hasAuthor, isLongText, hasTitle, hasDescription };
    }

    /**
     * Helper: Calcula confianÃ§a final
     */
    private calculateConfidence(
        baseScore: number,
        visualMatch: number,
        contentMatch: number,
        nameMatch: number
    ): number {
        const weights = {
            visual: 0.4,
            content: 0.3,
            name: 0.2,
            base: 0.1
        };

        return Math.min(
            baseScore * weights.base +
            visualMatch * weights.visual +
            contentMatch * weights.content +
            nameMatch * weights.name,
            1.0
        );
    }

    // ==================== MATCHERS - BÃSICOS ====================

    /**
     * Verifica se o node pode ser considerado candidato a widget
     */
    private isWidgetCandidate(node: SceneNode): boolean {
        // Nunca classificar frame raiz
        const hasParentInfo = (node as any).parent !== undefined || (node as any).parentId !== undefined;
        if (!hasParentInfo) {
            return false;
        }
        if ((node as any).parent === null || (node as any).parentId === null) {
            // Diferencia raiz gigante (pÃ‡Â¸gina) de exports pequenos isolados
            if (this.looksLikePageRoot(node)) {
                return false;
            }
        } else if ((node as any).parent && (node as any).parent.type === 'PAGE') {
            return false;
        }

        const allowedTypes: SceneNode['type'][] = ['FRAME', 'GROUP', 'RECTANGLE', 'TEXT'];
        if (!allowedTypes.includes(node.type)) {
            return false;
        }

        if (node.type === 'RECTANGLE') {
            const hasTextChild = 'children' in node && Array.isArray(node.children) && (node.children as SceneNode[]).some(ch => ch.type === 'TEXT');
            const hasImageFill = 'fills' in node && Array.isArray((node as any).fills) && (node as any).fills.some((f: any) => f.type === 'IMAGE');
            if (!hasTextChild && !hasImageFill) {
                // Retângulos decorativos não são candidatos
                return false;
            }
        }

        const width = 'width' in node ? (node.width as number) : 0;
        const height = 'height' in node ? (node.height as number) : 0;
        if (width < 32 || height < 16) {
            return false;
        }

        return true;
    }

    private looksLikePageRoot(node: SceneNode): boolean {
        const name = (node.name || '').toLowerCase();
        const isPageName = ['page', 'desktop', 'mobile', 'artboard'].some(token => name.includes(token));
        const area = ('width' in node ? (node.width as number) : 0) * ('height' in node ? (node.height as number) : 0);
        const isHuge = area > 1200 * 1200;
        // Se o node for pequeno (ex.: card exportado isolado), permita como candidato
        const isSmallIsolated = ('width' in node ? (node.width as number) : 0) < 1000 && ('height' in node ? (node.height as number) : 0) < 1000;
        if (!isSmallIsolated && (isPageName || isHuge)) {
            return true;
        }
        return false;
    }

    /**
     * Respeita nomes com prefixo tÃ©cnico explÃ­cito (alta confianÃ§a)
     */
    private detectByExplicitName(node: SceneNode): WidgetDetection | null {
        const rawName = node.name || '';
        const name = rawName.toLowerCase();

        const explicitPrefixes = ['w:', 'woo:', 'loop:'];
        const hasExplicitPrefix = explicitPrefixes.some(prefix => name.startsWith(prefix));
        if (hasExplicitPrefix) {
            const explicitWidget = rawName.split(/\s/)[0]; // preserva prefixo original
            const normalized = normalizeWidgetSlug(explicitWidget);
            if (!normalized) {
                if (typeof console !== 'undefined' && typeof console.log === 'function') {
                    console.log('[WIDGET DETECTOR] explicit-name fora da taxonomia, ignorando:', explicitWidget);
                }
                return null;
            }
            return {
                node_id: node.id,
                node_name: node.name,
                widget: explicitWidget,
                confidence: 1.0,
                justification: 'Nome possui prefixo tÃ©cnico explÃ­cito',
                source: 'explicit-name'
            };
        }

        // Casos especÃ­ficos aceitos com confianÃ§a mÃ¡xima
        if (name === 'image') {
            return {
                node_id: node.id,
                node_name: node.name,
                widget: 'w:image',
                confidence: 1.0,
                justification: 'Layer nomeado como image',
                source: 'explicit-name'
            };
        }

        return null;
    }

    /**
     * Retorna lista de widgets compatÃ­veis com o tipo de node
     */
    private getAllowedWidgetsForNodeType(nodeType: SceneNode['type']): string[] {
        return WIDGETS_BY_NODE_TYPE[nodeType] || [];
    }

    /**
     * Aplica thresholds diferentes para widgets de alto risco
     */
    private shouldAcceptWidgetDetection(widget: string, confidence: number, nodeName: string): boolean {
        const normalizedName = (nodeName || '').toLowerCase();
        if (normalizedName.startsWith('w:') || normalizedName.startsWith('woo:') || normalizedName.startsWith('loop:')) {
            return true; // Nome jÃ¡ tem prefixo tÃ©cnico
        }

        if (HIGH_RISK_WIDGETS.has(widget)) {
            return confidence >= 0.8;
        }

        return confidence >= 0.6;
    }

    // =====================
    // Composite detection
    // =====================
    private detectComposite(node: SceneNode, alreadyConsumed: Set<string>): { detection: WidgetDetection; consumedIds: string[] } | null {
        const name = (node.name || '').toLowerCase();
        const iconBoxSlug = this.normalizeWidgetSlugWithPrefix('w:icon-box');
        const iconListSlug = this.normalizeWidgetSlugWithPrefix('w:icon-list');
        const formSlug = this.normalizeWidgetSlugWithPrefix('w:form');

        // ICON-BOX
        const isIconBox = iconBoxSlug && (name.startsWith('w:icon-box') || this.looksLikeIconBox(node));
        if (isIconBox) {
            const slots = this.extractIconBoxSlots(node, alreadyConsumed);
            const hasBodyText = slots.text ? this.hasTextBody(node, slots.text) : false;
            if (slots.icon && slots.title && slots.text && hasBodyText) {
                const consumedIds = Object.values(slots).filter(Boolean) as string[];
                const backgrounds = slots.backgrounds || [];
                return {
                    detection: {
                        node_id: node.id,
                        node_name: node.name,
                        widget: iconBoxSlug,
                        confidence: 1.0,
                        justification: 'Composite icon-box detectado (icone + heading + texto)',
                        source: 'composite',
                        semanticRole: 'icon-box',
                        compositeOf: consumedIds,
                        consumedBackgroundIds: backgrounds,
                        slots: {
                            ...(slots.icon ? { icon: slots.icon } : {}),
                            ...(slots.title ? { title: slots.title } : {}),
                            ...(slots.text ? { text: slots.text } : {})
                        }
                    },
                    consumedIds: [...consumedIds, ...backgrounds]
                };
            }
        }

        // ICON-LIST (explicit or implicit pattern)
        const isIconList = iconListSlug && (name.startsWith('w:icon-list') || this.looksLikeIconList(node, alreadyConsumed));
        if (isIconList) {
            const repeater = this.extractIconListItems(node, alreadyConsumed);
            const score = this.scoreIconList(node, repeater);
            if (repeater.length > 0 && score >= 0.7) {
                const consumedIds = repeater.flatMap(item => [item.itemId, item.iconId, item.textId, ...(item.backgrounds || [])].filter(Boolean) as string[]);
                return {
                    detection: {
                        node_id: node.id,
                        node_name: node.name,
                        widget: iconListSlug,
                        confidence: name.startsWith('w:') ? 1.0 : score,
                        justification: `Composite icon-list detectado (itens com icone + texto, score=${score.toFixed(2)})`,
                        source: 'composite',
                        semanticRole: 'icon-list',
                        repeaterItems: repeater,
                        compositeOf: consumedIds
                    },
                    consumedIds
                };
            }
        }

        // FORM (explicit or implicit pattern)
        const isForm = formSlug && (name.startsWith('w:form') || this.looksLikeForm(node, alreadyConsumed));
        if (isForm) {
            const slots = this.extractFormSlots(node, alreadyConsumed);
            const score = slots ? this.scoreForm(node, slots) : 0;
            if (slots && score >= 0.7) {
                const consumedIds = [
                    ...(slots.titleSlot ? [slots.titleSlot] : []),
                    ...(slots.descriptionSlot ? [slots.descriptionSlot] : []),
                    ...slots.fields.flatMap(f => [f.fieldId, f.labelId, ...(f.helperTextIds || [])]).filter(Boolean) as string[],
                    ...(slots.buttons || [])
                ];
                return {
                    detection: {
                        node_id: node.id,
                        node_name: node.name,
                        widget: formSlug,
                        confidence: name.startsWith('w:') ? 1.0 : score,
                        justification: `Composite form detectado (campos + labels + auxiliares, score=${score.toFixed(2)})`,
                        source: 'composite',
                        semanticRole: 'form',
                        compositeOf: consumedIds,
                        slots: {
                            ...(slots.titleSlot ? { title: slots.titleSlot } : {}),
                            ...(slots.descriptionSlot ? { description: slots.descriptionSlot } : {})
                        },
                        properties: {
                            fields: slots.fields,
                            buttons: slots.buttons || []
                        }
                    },
                    consumedIds
                };
            }
        }

        return null;
    }

    private normalizeWidgetSlugWithPrefix(slug: string): string | null {
        const normalized = normalizeWidgetSlug(slug);
        if (!normalized) return null;
        return normalized.startsWith('w:') ? normalized : `w:${normalized}`;
    }

    getLockedImageGroupIds(): Set<string> {
        return new Set(this.lockedImageGroupIds);
    }

    getLockedImageDescendants(): Set<string> {
        return new Set(this.lockedImageDescendants);
    }

    private getSingleChild(node: SceneNode): SceneNode | null {
        if (!('children' in node) || !node.children || node.children.length !== 1) return null;
        return node.children[0] as SceneNode;
    }

    private isVisualWrapper(node: SceneNode): boolean {
        if (node.type !== 'FRAME' && node.type !== 'GROUP') return false;
        const child = this.getSingleChild(node);
        if (!child) return false;
        const hasBackground = Array.isArray((node as any).fills) && (node as any).fills.length > 0;
        const hasStroke = Array.isArray((node as any).strokes) && (node as any).strokes.length > 0;
        const hasRadius = typeof (node as any).cornerRadius === 'number' && (node as any).cornerRadius > 0;
        return hasBackground || hasStroke || hasRadius;
    }

    private extractWrapperStyle(node: SceneNode): Record<string, any> {
        const style: Record<string, any> = {};
        if (Array.isArray((node as any).fills) && (node as any).fills.length > 0) {
            style.fills = (node as any).fills.filter((f: any) => f.visible !== false);
        }
        if (Array.isArray((node as any).strokes) && (node as any).strokes.length > 0) {
            style.strokes = (node as any).strokes.filter((s: any) => s.visible !== false);
            style.strokeWeight = (node as any).strokeWeight;
        }
        if (typeof (node as any).cornerRadius === 'number') {
            style.cornerRadius = (node as any).cornerRadius;
        }
        if (Array.isArray((node as any).effects) && (node as any).effects.length > 0) {
            style.effects = (node as any).effects.filter((e: any) => e.visible !== false);
        }
        return style;
    }

    private looksLikeIconBox(node: SceneNode): boolean {
        if (node.type !== 'FRAME' && node.type !== 'GROUP') return false;
        const children = ('children' in node && node.children) ? node.children : [];
        if (!children || children.length < 2) return false;
        const hasIcon = children.some(ch => (ch as any).type === 'VECTOR' || (ch as any).type === 'ELLIPSE' || ((ch as any).name || '').toLowerCase().startsWith('w:icon'));
        const textNodes = children.filter(ch => (ch as any).type === 'TEXT');
        return hasIcon && textNodes.length >= 1;
    }

    private looksLikeIconList(node: SceneNode, alreadyConsumed: Set<string>): boolean {
        if (node.type !== 'FRAME' && node.type !== 'GROUP') return false;
        const children = ('children' in node && node.children) ? node.children : [];
        if (!children || children.length < 2) return false;
        const items = this.extractIconListItems(node, alreadyConsumed);
        return items.length >= 2;
    }

    private extractIconBoxSlots(node: SceneNode, alreadyConsumed: Set<string>): { icon?: string; title?: string; text?: string; backgrounds?: string[] } {
        const children = ('children' in node && node.children) ? node.children : [];
        let iconId: string | undefined;
        let titleId: string | undefined;
        let textId: string | undefined;
        const backgrounds: string[] = [];

        for (const child of children) {
            if (alreadyConsumed.has(child.id)) continue;
            const childName = (child.name || '').toLowerCase();
            const isDecorativeRect = child.type === 'RECTANGLE' && !this.rectangleHasTextOrImage(child as any);
            if (isDecorativeRect) {
                backgrounds.push(child.id);
                continue;
            }
            if (!iconId && (childName.startsWith('w:icon') || child.type === 'VECTOR' || child.type === 'ELLIPSE')) {
                iconId = child.id;
                // Se o Ă­cone for um FRAME/GRUPO com camadas internas, absorve backgrounds decorativos
                if (child.type === 'FRAME' || child.type === 'GROUP') {
                    const inner = this.collectIconBackgrounds(child as any, alreadyConsumed);
                    backgrounds.push(...inner.backgrounds);
                }
                continue;
            }
            if (child.type === 'TEXT') {
                if (!titleId) {
                    titleId = child.id;
                    continue;
                }
                if (!textId) {
                    textId = child.id;
                }
            }
        }

        return { icon: iconId, title: titleId, text: textId, backgrounds };
    }

    private hasTextBody(root: SceneNode, textId: string): boolean {
        const target = this.findNodeById(root, textId);
        if (target && target.type === 'TEXT' && 'characters' in target) {
            const len = (target as any).characters?.length || 0;
            return len >= 15;
        }
        return false;
    }

    private rectangleHasTextOrImage(node: RectangleNode): boolean {
        const hasImage = node.fills && typeof node.fills !== 'symbol' && (node.fills as any[]).some(f => f.type === 'IMAGE');
        const hasTextChild = 'children' in node && Array.isArray((node as any).children) && ((node as any).children as SceneNode[]).some(ch => ch.type === 'TEXT');
        return hasImage || hasTextChild;
    }

    private isImageNode(node: SceneNode): boolean {
        return 'fills' in node && Array.isArray((node as any).fills) && (node as any).fills.some((f: any) => f.type === 'IMAGE');
    }

    /**
     * Coleta backgrounds decorativos dentro de um contĂ©iner de Ă­cone (ex.: w:icon com RECTANGLE + VECTOR)
     */
    private collectIconBackgrounds(node: SceneNode, alreadyConsumed: Set<string>): { backgrounds: string[] } {
        if (!('children' in node) || !(node as any).children) return { backgrounds: [] };
        const children = ((node as any).children || []) as SceneNode[];
        const hasIconContent = children.some(ch => ch.type === 'VECTOR' || ch.type === 'ELLIPSE' || this.isImageNode(ch as any));
        if (!hasIconContent) return { backgrounds: [] };
        const backgrounds: string[] = [];
        for (const ch of children) {
            if (alreadyConsumed.has(ch.id)) continue;
            const isDecorativeRect = ch.type === 'RECTANGLE' && !this.rectangleHasTextOrImage(ch as any);
            if (isDecorativeRect) {
                backgrounds.push(ch.id);
            }
        }
        return { backgrounds };
    }

    private extractIconListItems(node: SceneNode, alreadyConsumed: Set<string>): Array<{ itemId: string; iconId?: string; textId?: string; backgrounds?: string[] }> {
        const children = ('children' in node && node.children) ? node.children : [];
        const items: Array<{ itemId: string; iconId?: string; textId?: string; backgrounds?: string[] }> = [];
        for (const item of children) {
            if (alreadyConsumed.has(item.id)) continue;
            if (!('children' in item) || !(item as any).children) continue;
            const backgrounds: string[] = [];
            let iconChild: any;
            let textChild: any;
            for (const c of (item as any).children as SceneNode[]) {
                if (alreadyConsumed.has((c as any).id)) continue;
                const isDecorativeRect = (c as any).type === 'RECTANGLE' && !this.rectangleHasTextOrImage(c as any);
                if (isDecorativeRect) {
                    backgrounds.push((c as any).id);
                    continue;
                }
                if (!iconChild && ((((c as any).name || '').toLowerCase().startsWith('w:icon')) || (c as any).type === 'VECTOR' || (c as any).type === 'ELLIPSE' || this.isImageNode(c as any))) {
                    iconChild = c;
                    if ((c as any).type === 'FRAME' || (c as any).type === 'GROUP') {
                        const inner = this.collectIconBackgrounds(c as any, alreadyConsumed);
                        backgrounds.push(...inner.backgrounds);
                    }
                    continue;
                }
                if (!textChild && (c as any).type === 'TEXT') {
                    textChild = c;
                }
            }
            if (iconChild || textChild) {
                items.push({ itemId: (item as any).id, iconId: iconChild?.id, textId: textChild?.id, backgrounds });
            }
        }
        return items;
    }

    private scoreIconList(node: SceneNode, items: Array<{ itemId: string; iconId?: string; textId?: string }>): number {
        if (items.length === 0) return 0;
        let score = 0;
        if (items.length >= 3) score += 0.4;
        else if (items.length === 2) score += 0.2;

        const allHaveIconAndText = items.every(it => !!it.iconId && !!it.textId);
        if (allHaveIconAndText) score += 0.3;

        // Gap consistency
        const positions = items.map(it => {
            const nodeChild = (node as any).children?.find((c: any) => c.id === it.itemId);
            return nodeChild ? { y: nodeChild.y as number, height: (nodeChild as any).height as number } : null;
        }).filter(Boolean) as { y: number; height: number }[];
        if (positions.length >= 2) {
            const gaps: number[] = [];
            const sorted = positions.sort((a, b) => a.y - b.y);
            for (let i = 1; i < sorted.length; i++) {
                gaps.push(sorted[i].y - (sorted[i - 1].y + sorted[i - 1].height));
            }
            if (gaps.length) {
                const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
                const maxDiff = Math.max(...gaps.map(g => Math.abs(g - avg)));
                if (maxDiff <= 4) score += 0.2;
            }
        }

        // Width similarity
        const widths = items.map(it => {
            const nodeChild = (node as any).children?.find((c: any) => c.id === it.itemId);
            return nodeChild ? (nodeChild as any).width as number : null;
        }).filter((v): v is number => typeof v === 'number');
        if (widths.length >= 2) {
            const minW = Math.min(...widths);
            const maxW = Math.max(...widths);
            if (minW > 0 && maxW / minW <= 1.2) {
                score += 0.1;
            }
        }

        return Math.min(score, 1);
    }

    private extractFormSlots(node: SceneNode, alreadyConsumed: Set<string>): { titleSlot?: string; descriptionSlot?: string; fields: Array<{ fieldId: string; labelId?: string; helperTextIds?: string[] }>; buttons?: string[] } | null {
        const children = ('children' in node && node.children) ? node.children : [];
        if (!children || children.length === 0) return null;

        let titleSlot: string | undefined;
        let descriptionSlot: string | undefined;
        const fields: Array<{ fieldId: string; labelId?: string; helperTextIds?: string[] }> = [];
        const buttons: string[] = [];

        for (const child of children) {
            if (alreadyConsumed.has(child.id)) continue;
            const childName = (child.name || '').toLowerCase();

            if (childName.startsWith('w:button') || child.type === 'COMPONENT' || childName.includes('button')) {
                buttons.push(child.id);
                continue;
            }

            if (child.type === 'TEXT') {
                if (!titleSlot) {
                    titleSlot = child.id;
                    continue;
                }
                if (!descriptionSlot) {
                    descriptionSlot = child.id;
                    continue;
                }
            }

            if (child.type === 'FRAME' || child.type === 'GROUP' || child.type === 'RECTANGLE') {
                const grandChildren = ('children' in child && (child as any).children) ? (child as any).children : [];
                let labelId: string | undefined;
                let fieldId: string | undefined;
                const helpers: string[] = [];
                for (const gc of grandChildren) {
                    if (alreadyConsumed.has(gc.id)) continue;
                    if (!labelId && gc.type === 'TEXT') {
                        labelId = gc.id;
                        continue;
                    }
                    if (!fieldId && (gc.type === 'RECTANGLE' || gc.type === 'FRAME' || gc.type === 'GROUP')) {
                        fieldId = gc.id;
                        continue;
                    }
                    if (gc.type === 'TEXT') {
                        helpers.push(gc.id);
                    }
                }
                if (fieldId || labelId) {
                    fields.push({ fieldId: fieldId || labelId!, labelId, helperTextIds: helpers.length ? helpers : undefined });
                }
            }
        }

        if (!titleSlot && !descriptionSlot && fields.length === 0 && buttons.length === 0) {
            return null;
        }

        return { titleSlot, descriptionSlot, fields, buttons };
    }

    private looksLikeForm(node: SceneNode, alreadyConsumed: Set<string>): boolean {
        if (node.type !== 'FRAME' && node.type !== 'GROUP') return false;
        const slots = this.extractFormSlots(node, alreadyConsumed);
        if (!slots) return false;
        const hasFields = slots.fields && slots.fields.length >= 2;
        const hasButton = slots.buttons && slots.buttons.length > 0;
        return !!(hasFields && hasButton);
    }

    private scoreForm(node: SceneNode, slots: { fields: Array<{ fieldId: string; labelId?: string; helperTextIds?: string[] }>; buttons?: string[]; titleSlot?: string; descriptionSlot?: string }): number {
        let score = 0;
        const fieldCount = slots.fields.length;
        if (fieldCount >= 3) score += 0.4;
        else if (fieldCount >= 2) score += 0.3;

        if (slots.buttons && slots.buttons.length > 0) score += 0.2;
        if (slots.titleSlot || slots.descriptionSlot) score += 0.1;

        // ConsistÃªncia de alinhamento vertical dos campos
        const fieldsNodes = slots.fields.map(f => {
            const n = this.findNodeById(node, f.fieldId);
            return n ? { y: (n as any).y as number, height: (n as any).height as number } : null;
        }).filter(Boolean) as { y: number; height: number }[];
        if (fieldsNodes.length >= 2) {
            const gaps: number[] = [];
            const sorted = fieldsNodes.sort((a, b) => a.y - b.y);
            for (let i = 1; i < sorted.length; i++) {
                gaps.push(sorted[i].y - (sorted[i - 1].y + sorted[i - 1].height));
            }
            if (gaps.length) {
                const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
                const maxDiff = Math.max(...gaps.map(g => Math.abs(g - avg)));
                if (maxDiff <= 8) score += 0.2;
            }
        }

        return Math.min(score, 1);
    }

    /**
     * Microtext/description attachment
     */
    private attachMicrotexts(node: SceneNode, detection: WidgetDetection, consumed: Set<string>) {
        if (!('children' in node) || !node.children || node.children.length === 0) return;

        const attached: string[] = detection.attachedTextIds ? [...detection.attachedTextIds] : [];
        const childTexts = (node.children as SceneNode[]).filter(ch => ch.type === 'TEXT' && !consumed.has(ch.id) && !((ch.name || '').toLowerCase().startsWith('w:')));

        // Referência de fonte principal (maior fontSize entre textos não consumidos)
        const fontSizes = childTexts.map(t => (t as any).fontSize).filter((v: any) => typeof v === 'number') as number[];
        const maxFont = fontSizes.length ? Math.max(...fontSizes) : 0;
        const thresholdSmall = maxFont > 0 ? Math.min(maxFont * 0.8, maxFont - 2) : 18;
        const headingCandidate = childTexts.reduce<{ node: SceneNode | null; font: number; bbox?: { x: number; y: number; width: number; height: number } }>((acc, t) => {
            const f = (t as any).fontSize;
            if (typeof f === 'number' && f >= (acc.font || 0)) {
                return { node: t, font: f, bbox: this.getBBox(t) };
            }
            return acc;
        }, { node: null, font: 0 });

        for (const child of childTexts) {
            const fontSize = (child as any).fontSize;
            const fontWeight = (child as any).fontWeight;
            const fills = (child as any).fills;
            const bboxChild = this.getBBox(child);
            const bboxParent = this.getBBox(node);

            // Distância vertical para edges do pai
            const topGap = bboxChild.y - bboxParent.y;
            const bottomGap = (bboxParent.y + bboxParent.height) - (bboxChild.y + bboxChild.height);
            const minGap = Math.min(topGap, bottomGap);
            const withinDistance = minGap >= 4 && minGap <= 32;

            // Sobreposição horizontal mínima 60%
            const overlap = Math.max(0, Math.min(bboxParent.x + bboxParent.width, bboxChild.x + bboxChild.width) - Math.max(bboxParent.x, bboxChild.x));
            const overlapRatio = bboxChild.width > 0 ? (overlap / bboxChild.width) : 0;
            const aligns = overlapRatio >= 0.6;
            const headingOverlap = headingCandidate.bbox ? this.computeOverlapRatio(bboxChild, headingCandidate.bbox) : 1;

            const smallFont = typeof fontSize === 'number' ? fontSize <= thresholdSmall : true;
            const lightWeight = typeof fontWeight === 'number' ? fontWeight <= 500 : false;
            let lowOpacity = false;
            if (Array.isArray(fills)) {
                const solid = fills.find((f: any) => f.type === 'SOLID' && f.visible !== false);
                if (solid && solid.opacity !== undefined && solid.opacity < 0.8) {
                    lowOpacity = true;
                }
            }

            // Conflito: se parece heading (peso alto ou fonte >= maxFont), não anexar
            const looksLikeHeading = (typeof fontWeight === 'number' && fontWeight >= 600) || (typeof fontSize === 'number' && fontSize >= maxFont);
            const tooCloseToHeading = headingCandidate.font && typeof fontSize === 'number' && fontSize >= headingCandidate.font * 0.8;
            const wrongColumn = headingCandidate.bbox && headingOverlap < 0.6;

            if (!looksLikeHeading && !tooCloseToHeading && !wrongColumn && aligns && withinDistance && (smallFont || lightWeight || lowOpacity)) {
                attached.push(child.id);
                consumed.add(child.id);
            }
        }

        if (attached.length) {
            detection.attachedTextIds = attached;
        }
    }

    private computeOverlapRatio(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): number {
        const overlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
        return a.width > 0 ? overlap / a.width : 0;
    }

    private getBBox(node: SceneNode): { x: number; y: number; width: number; height: number } {
        const x = (node as any).x ?? 0;
        const y = (node as any).y ?? 0;
        const width = 'width' in node ? (node as any).width || 0 : 0;
        const height = 'height' in node ? (node as any).height || 0 : 0;
        return { x, y, width, height };
    }

    private findNodeById(root: SceneNode, id: string): SceneNode | null {
        if (root.id === id) return root;
        if ('children' in root && root.children) {
            for (const ch of root.children) {
                const found = this.findNodeById(ch as SceneNode, id);
                if (found) return found;
            }
        }
        return null;
    }

    private matchHeading(node: SceneNode): number {
        if (node.type !== 'TEXT') return 0;
        const text = node as TextNode;

        let confidence = 0.4; // Base

        // Nome contÃ©m "heading", "h1", "h2", "tÃ­tulo"
        const name = node.name.toLowerCase();
        if (name.includes('heading') || name.includes('tÃ­tulo') || /^h[1-6]$/i.test(name)) {
            confidence += 0.3;
        }

        // Tamanho de fonte grande (> 24px)
        if (text.fontSize && typeof text.fontSize === 'number' && text.fontSize > 24) {
            confidence += 0.2;
        }

        // Font weight bold
        if (text.fontWeight && typeof text.fontWeight === 'number' && text.fontWeight >= 700) {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }

    private matchTextEditor(node: SceneNode): number {
        if (node.type !== 'TEXT') return 0;
        const text = node as TextNode;

        let confidence = 0.3;

        const name = node.name.toLowerCase();
        if (name.includes('text') || name.includes('paragraph') || name.includes('description')) {
            confidence += 0.3;
        }

        // Texto longo (> 50 caracteres)
        if (text.characters && text.characters.length > 50) {
            confidence += 0.2;
        }

        // Tamanho de fonte normal (14-18px)
        if (text.fontSize && typeof text.fontSize === 'number' && text.fontSize >= 14 && text.fontSize <= 18) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchButton(node: SceneNode): number {
        const visual = this.analyzeVisualContext(node);
        const name = node.name.toLowerCase();

        let nameMatch = 0;
        if (name.includes('button') || name.includes('btn') || name.includes('botao')) nameMatch = 1.0;

        let visualMatch = 0;
        // Buttons usually have landscape aspect ratio
        if (visual.aspectRatio > 1.5 && visual.aspectRatio < 6) visualMatch += 0.3;
        // Buttons usually have background or border
        if (visual.hasBackground || visual.hasBorder) visualMatch += 0.4;
        // Buttons usually have short text
        if (visual.textCount === 1 && visual.avgTextLength < 30) visualMatch += 0.3;
        // Se não há texto, evite classificar como botão
        if (visual.textCount === 0) return 0;
        // Buttons can have icons
        if (visual.hasIcon) visualMatch += 0.2;

        // Content check
        let contentMatch = 0;
        if (visual.textCount >= 1 && visual.textCount <= 2) contentMatch = 1.0;

        return this.calculateConfidence(0.4, Math.min(visualMatch, 1.0), contentMatch, nameMatch);
    }

    private matchImage(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('image') || name.includes('img') || name.includes('photo') || name.includes('picture')) {
            confidence += 0.5;
        }

        // Possui image fill
        if ('fills' in node && node.fills && Array.isArray(node.fills)) {
            const hasImageFill = node.fills.some(fill => fill.type === 'IMAGE');
            if (hasImageFill) {
                confidence += 0.5;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchIcon(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('icon') || name.includes('svg')) {
            confidence += 0.5;
        }

        // Node pequeno (< 100x100)
        if ('width' in node && 'height' in node) {
            if ((node.width as number) < 100 && (node.height as number) < 100) {
                confidence += 0.3;
            }
        }

        // Ã‰ um vetor
        if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchVideo(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('video') || name.includes('youtube') || name.includes('vimeo') || name.includes('player')) {
            confidence += 0.6;
        }

        // Frame com aspect ratio 16:9
        if ('width' in node && 'height' in node) {
            const ratio = (node.width as number) / (node.height as number);
            if (Math.abs(ratio - 16 / 9) < 0.1) {
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchDivider(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('divider') || name.includes('separator') || name.includes('line')) {
            confidence += 0.5;
        }

        // Linha horizontal ou vertical
        if ('width' in node && 'height' in node) {
            const width = node.width as number;
            const height = node.height as number;

            if ((height < 5 && width > 50) || (width < 5 && height > 50)) {
                confidence += 0.5;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchSpacer(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('spacer') || name.includes('space') || name === 'gap') {
            confidence += 0.6;
        }

        // Frame vazio
        if (node.type === 'FRAME' && 'children' in node && (!node.children || node.children.length === 0)) {
            confidence += 0.4;
        }

        return Math.min(confidence, 1.0);
    }

    private matchImageBox(node: SceneNode): number {
        const visual = this.analyzeVisualContext(node);
        const content = this.analyzeTextContent(node);
        const name = node.name.toLowerCase();

        let nameMatch = 0;
        if (name.includes('image-box') || name.includes('image box')) nameMatch = 1.0;

        let visualMatch = 0;
        if (visual.hasImage) visualMatch += 0.6;
        if (visual.textCount >= 1) visualMatch += 0.4;

        let contentMatch = 0;
        // Flexible combinations:
        // 1. Image + Title + Description
        // 2. Title + Description (sometimes image is background or separate)
        // 3. Image + Title
        // 4. Image + Description
        if (content.hasTitle || content.hasDescription) contentMatch += 0.5;
        if (content.hasTitle && content.hasDescription) contentMatch += 0.5;

        // Penalize if too many elements (likely a complex section, not a widget)
        if (visual.textCount > 4) contentMatch -= 0.5;

        return this.calculateConfidence(0.3, Math.min(visualMatch, 1.0), Math.max(contentMatch, 0), nameMatch);
    }

    private matchIconBox(node: SceneNode): number {
        const visual = this.analyzeVisualContext(node);
        const content = this.analyzeTextContent(node);
        const name = node.name.toLowerCase();

        let nameMatch = 0;
        if (name.includes('icon-box') || name.includes('icon box')) nameMatch = 1.0;

        let visualMatch = 0;
        if (visual.hasIcon) visualMatch += 0.6;
        if (visual.textCount >= 1) visualMatch += 0.4;

        let contentMatch = 0;
        // Flexible combinations similar to ImageBox
        if (content.hasTitle || content.hasDescription) contentMatch += 0.5;
        if (content.hasTitle && content.hasDescription) contentMatch += 0.5;

        if (visual.textCount > 4) contentMatch -= 0.5;

        return this.calculateConfidence(0.3, Math.min(visualMatch, 1.0), Math.max(contentMatch, 0), nameMatch);
    }

    private matchStarRating(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('star') || name.includes('rating') || name.includes('review')) {
            confidence += 0.7;
        }

        // MÃºltiplos icons em linha
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const starCount = node.children.filter(child =>
                child.name.toLowerCase().includes('star') ||
                child.type === 'VECTOR'
            ).length;

            if (starCount >= 3 && starCount <= 5) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchCounter(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('counter') || name.includes('count') || name.includes('number')) {
            confidence += 0.6;
        }

        // Texto com nÃºmeros
        if (node.type === 'TEXT') {
            const text = node as TextNode;
            if (text.characters && /^\d+/.test(text.characters)) {
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchProgress(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('progress') || name.includes('bar')) {
            confidence += 0.6;
        }

        // Frame horizontal com fill parcial
        if (node.type === 'FRAME' && 'width' in node && 'height' in node) {
            const ratio = (node.width as number) / (node.height as number);
            if (ratio > 3) { // Barra horizontal
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchTabs(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('tabs') || name.includes('tab')) {
            confidence += 0.7;
        }

        // MÃºltiplos frames horizontais
        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 2) {
            const hasMultipleSections = node.children.filter(child => child.type === 'FRAME').length >= 2;
            if (hasMultipleSections) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchAccordion(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('accordion') || name.includes('collapse') || name.includes('expand')) {
            confidence += 0.7;
        }

        // MÃºltiplos frames verticais
        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 2) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchToggle(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('toggle') || name.includes('switch')) {
            confidence += 0.7;
        }

        // Pequeno e arredondado
        if ('width' in node && 'height' in node && 'cornerRadius' in node) {
            const width = node.width as number;
            const height = node.height as number;
            if (width < 100 && height < 50 && node.cornerRadius) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchAlert(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('alert') || name.includes('notification') || name.includes('message')) {
            confidence += 0.7;
        }

        // Frame com background colorido e texto
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const hasText = node.children.some(child => child.type === 'TEXT');
            if (hasText && 'fills' in node && node.fills) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchSocialIcons(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('social') || name.includes('share')) {
            confidence += 0.6;
        }

        // MÃºltiplos icons pequenos em linha
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const iconCount = node.children.filter(child =>
                child.type === 'VECTOR' ||
                child.name.toLowerCase().includes('icon')
            ).length;

            if (iconCount >= 2) {
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchIconList(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('icon-list') || name.includes('list')) {
            confidence += 0.6;
        }

        // MÃºltiplos pares de icon + texto
        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 2) {
            confidence += 0.4;
        }

        return Math.min(confidence, 1.0);
    }

    private matchNavMenu(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('nav') || name.includes('menu') || name.includes('navigation')) {
            confidence += 0.7;
        }

        // MÃºltiplos links/botÃµes horizontais
        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 3) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchSearchForm(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('search') || name.includes('busca')) {
            confidence += 0.7;
        }

        // Input + botÃ£o
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const hasInput = node.children.some(child =>
                child.name.toLowerCase().includes('input') ||
                child.type === 'RECTANGLE'
            );
            const hasButton = node.children.some(child =>
                child.name.toLowerCase().includes('button')
            );

            if (hasInput && hasButton) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchTestimonial(node: SceneNode): number {
        const visual = this.analyzeVisualContext(node);
        const content = this.analyzeTextContent(node);
        const name = node.name.toLowerCase();

        let nameMatch = 0;
        if (name.includes('testimonial') || name.includes('review') || name.includes('depoimento')) nameMatch = 1.0;

        let visualMatch = 0;
        if (visual.hasImage) visualMatch += 0.3; // Avatar
        if (visual.textCount >= 2) visualMatch += 0.3;

        let contentMatch = 0;
        if (content.hasQuote) contentMatch += 0.4;
        if (content.hasAuthor) contentMatch += 0.3;
        if (content.isLongText) contentMatch += 0.3;

        return this.calculateConfidence(0.3, Math.min(visualMatch, 1.0), Math.min(contentMatch, 1.0), nameMatch);
    }

    private matchContainer(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('container') || name.includes('section') || name.includes('wrapper')) {
            confidence += 0.5;
        }

        // Frame com mÃºltiplos filhos
        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length > 0) {
            confidence += 0.3;
        }

        // Tem Auto Layout
        if ('layoutMode' in node && node.layoutMode !== 'NONE') {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    // ==================== MATCHERS - PRO ====================

    private matchForm(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('form') || name.includes('formulario')) {
            confidence += 0.7;
        }

        // MÃºltiplos inputs
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const inputCount = node.children.filter(child =>
                child.name.toLowerCase().includes('input') ||
                child.name.toLowerCase().includes('field')
            ).length;

            if (inputCount >= 2) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchLogin(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('login') || name.includes('sign-in') || name.includes('auth')) {
            confidence += 0.8;
        }

        // Form com username/password
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const hasInputs = node.children.filter(child =>
                child.name.toLowerCase().includes('input') ||
                child.name.toLowerCase().includes('password') ||
                child.name.toLowerCase().includes('email')
            ).length >= 2;

            if (hasInputs) {
                confidence += 0.2;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchCTA(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('cta') || name.includes('call-to-action')) {
            confidence += 0.8;
        }

        // Frame com titulo + descriÃ§Ã£o + botÃ£o
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const hasText = node.children.filter(child => child.type === 'TEXT').length >= 2;
            const hasButton = node.children.some(child =>
                child.name.toLowerCase().includes('button')
            );

            if (hasText && hasButton) {
                confidence += 0.2;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchPortfolio(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('portfolio') || name.includes('gallery') || name.includes('grid')) {
            confidence += 0.6;
        }

        // Grid de imagens
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const imageCount = node.children.filter(child =>
                child.name.toLowerCase().includes('image') ||
                ('fills' in child && Array.isArray(child.fills) && child.fills.some(f => f.type === 'IMAGE'))
            ).length;

            if (imageCount >= 3) {
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchFlipBox(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('flip-box') || name.includes('flip')) {
            confidence += 0.8;
        }

        // 2 faces (front/back)
        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length === 2) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchAnimatedHeadline(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('animated') && name.includes('headline')) {
            confidence += 0.9;
        }

        // Texto com destaque
        if (node.type === 'TEXT' || (node.type === 'FRAME' && 'children' in node && node.children?.some(c => c.type === 'TEXT'))) {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }

    private matchCountdown(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('countdown') || name.includes('timer')) {
            confidence += 0.8;
        }

        // MÃºltiplos nÃºmeros (dias, horas, min, seg)
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const numberCount = node.children.filter(child =>
                child.type === 'TEXT' && /\d/.test(child.name)
            ).length;

            if (numberCount >= 2) {
                confidence += 0.2;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchPriceTable(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('price') || name.includes('pricing') || name.includes('plan')) {
            confidence += 0.6;
        }

        // Frame com tÃ­tulo + preÃ§o + features + button
        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 3) {
            confidence += 0.4;
        }

        return Math.min(confidence, 1.0);
    }

    private matchPriceList(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('price-list') || name.includes('menu')) {
            confidence += 0.7;
        }

        // Lista de items com preÃ§os
        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 2) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    // ==================== MATCHERS - WOOCOMMERCE ====================

    private matchWooProductTitle(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('product') && name.includes('title')) {
            confidence += 0.8;
        }

        if (node.type === 'TEXT') {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProductImage(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('product') && name.includes('image')) {
            confidence += 0.8;
        }

        // Tem image fill
        if ('fills' in node && Array.isArray(node.fills) && node.fills.some(f => f.type === 'IMAGE')) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProductPrice(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('price') || name.includes('preco')) {
            confidence += 0.7;
        }

        // Texto com cifrÃ£o ou nÃºmero
        if (node.type === 'TEXT') {
            const text = node as TextNode;
            if (text.characters && (/\$|R\$|â‚¬/.test(text.characters) || /\d+[.,]\d+/.test(text.characters))) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooAddToCart(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('add-to-cart') || name.includes('cart') || name.includes('buy')) {
            confidence += 0.8;
        }

        // Button
        if (node.type === 'FRAME' || ('cornerRadius' in node && node.cornerRadius)) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProductRating(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('rating') || name.includes('star')) {
            confidence += 0.7;
        }

        // Stars
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const starCount = node.children.filter(child =>
                child.type === 'VECTOR' || child.name.toLowerCase().includes('star')
            ).length;

            if (starCount >= 3) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    // ==================== MATCHERS - GENÃ‰RICOS ====================

    /**
     * Matcher genÃ©rico para texto (usado para widgets simples de texto)
     */
    private matchGenericText(node: SceneNode): number {
        let confidence = 0;

        if (node.type === 'TEXT') {
            confidence += 0.5;
        }

        // Frame contendo texto
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const hasText = node.children.some(child => child.type === 'TEXT');
            if (hasText) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * Matcher genÃ©rico para containers (usado para widgets que sÃ£o apenas wrappers)
     */
    private matchGenericContainer(node: SceneNode): number {
        let confidence = 0;

        if (node.type === 'FRAME') {
            confidence += 0.3;
        }

        // Frame com filhos
        if ('children' in node && node.children && node.children.length > 0) {
            confidence += 0.4;
        }

        return Math.min(confidence, 1.0);
    }




    private matchGallery(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('gallery') || name.includes('galeria')) {
            confidence += 0.6;
        }

        // Container com mÃºltiplas imagens
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const imageCount = node.children.filter(child => {
                const childName = child.name.toLowerCase();
                return childName.includes('image') || childName.includes('img') ||
                    ('fills' in child && Array.isArray(child.fills) &&
                        child.fills.some(fill => fill.type === 'IMAGE'));
            }).length;

            if (imageCount >= 3) {
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchImageCarousel(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('carousel') || name.includes('slider') || name.includes('swiper')) {
            confidence += 0.5;
        }

        if (name.includes('image')) {
            confidence += 0.3;
        }

        // Container horizontal com mÃºltiplas imagens
        if (node.type === 'FRAME' && 'children' in node && 'layoutMode' in node) {
            if (node.layoutMode === 'HORIZONTAL') {
                confidence += 0.2;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchGoogleMaps(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('map') || name.includes('google') || name.includes('location')) {
            confidence += 0.7;
        }

        // Frame com aspect ratio prÃ³ximo de mapa
        if ('width' in node && 'height' in node) {
            const ratio = (node.width as number) / (node.height as number);
            if (ratio >= 1.3 && ratio <= 2.0) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchEmbed(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('embed') || name.includes('iframe') ||
            name.includes('youtube') || name.includes('vimeo')) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }

    private matchLottie(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('lottie') || name.includes('animation') || name.includes('animated')) {
            confidence += 0.7;
        }

        return Math.min(confidence, 1.0);
    }

    private matchShortcode(node: SceneNode): number {
        if (node.type !== 'TEXT') return 0;
        const text = node as TextNode;

        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('shortcode')) {
            confidence += 0.6;
        }

        // Texto com formato [shortcode]
        if (text.characters && text.characters.includes('[') && text.characters.includes(']')) {
            confidence += 0.4;
        }

        return Math.min(confidence, 1.0);
    }

    private matchHTML(node: SceneNode): number {
        if (node.type !== 'TEXT') return 0;
        const text = node as TextNode;

        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('html') || name.includes('code')) {
            confidence += 0.6;
        }

        // Texto com tags HTML
        if (text.characters && text.characters.includes('<') && text.characters.includes('>')) {
            confidence += 0.4;
        }

        return Math.min(confidence, 1.0);
    }

    private matchMenuAnchor(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('anchor') || name.includes('menu-anchor')) {
            confidence += 0.8;
        }

        // Spacer ou divider pequeno
        if ('width' in node && 'height' in node) {
            const width = node.width as number;
            const height = node.height as number;
            if (width < 50 && height < 50) {
                confidence += 0.2;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchSidebar(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('sidebar') || name.includes('aside')) {
            confidence += 0.7;
        }

        // Container vertical
        if (node.type === 'FRAME' && 'layoutMode' in node) {
            if (node.layoutMode === 'VERTICAL') {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchReadMore(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('read') && name.includes('more')) {
            confidence += 0.6;
        }

        if (name.includes('button') || name.includes('link')) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchSoundcloud(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('soundcloud') || name.includes('audio') || name.includes('music')) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }

    private matchLoopGrid(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('grid') || name.includes('loop') || name.includes('repeater')) {
            confidence += 0.5;
        }

        // Container com layout grid ou mÃºltiplos filhos repetidos
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            if (node.children.length >= 4) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    // ==================== MATCHERS - WOOCOMMERCE SIMPLES ====================

    private matchLoopBuilder(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        // Loop Builder geralmente Ã© um container wrapper de um template
        if (name.includes('loop') && (name.includes('builder') || name.includes('grid') || name.includes('carousel'))) {
            confidence += 0.8;
        }

        // Deve ser um frame
        if (node.type === 'FRAME') {
            confidence += 0.1;
        }

        // Penaliza se for muito simples (ex: apenas um link de menu)
        if (name.includes('link') || name.includes('item') || name.includes('menu')) {
            confidence -= 0.5;
        }

        return Math.min(confidence, 1.0);
    }

    private matchSearchResults(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('search') && name.includes('result')) {
            confidence += 0.9;
        }

        // Penaliza links comuns
        if (name === 'link' || name.includes('menu item')) {
            confidence -= 0.5;
        }

        return Math.min(confidence, 1.0);
    }

    private matchGlobalWidget(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        // Global widget sÃ³ deve ser detectado se explicitamente nomeado
        if (name.includes('global') && (name.includes('widget') || name.includes('template'))) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooBreadcrumb(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('breadcrumb') || name.includes('bread')) {
            confidence += 0.7;
        }

        if (name.includes('product') || name.includes('woo')) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProducts(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('products') || name.includes('shop')) {
            confidence += 0.6;
        }

        // Container com mÃºltiplos itens
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            if (node.children.length >= 3) {
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProductGrid(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('product') && name.includes('grid')) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProductCarousel(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('product') && (name.includes('carousel') || name.includes('slider'))) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProductSingle(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('product') && name.includes('single')) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }
    private matchWooProductTabs(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('tab') && name.includes('product')) {
            confidence += 0.7;
        }

        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 2) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProductStock(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('stock') || name.includes('availability')) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProductMeta(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('meta') && name.includes('product')) {
            confidence += 0.7;
        }

        if (name.includes('sku') || name.includes('category') || name.includes('tag')) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchWooProductAdditionalInformation(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('additional') && name.includes('information')) {
            confidence += 0.8;
        }

        // Deve conter termos especÃ­ficos de atributos de produto
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const hasAttributeTerms = node.children.some(child => {
                if (child.type === 'TEXT') {
                    const text = (child as TextNode).characters.toLowerCase();
                    return text.includes('weight') || text.includes('dimensions') ||
                        text.includes('peso') || text.includes('dimensÃµes') ||
                        text.includes('attributes') || text.includes('atributos');
                }
                // Recursivo para estruturas mais complexas (tabelas)
                if ('children' in child) {
                    return (child as any).children.some((grandChild: any) => {
                        if (grandChild.type === 'TEXT') {
                            const text = grandChild.characters.toLowerCase();
                            return text.includes('weight') || text.includes('dimensions') ||
                                text.includes('peso') || text.includes('dimensÃµes');
                        }
                        return false;
                    });
                }
                return false;
            });

            if (hasAttributeTerms) {
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    // ==================== MATCHERS - PRO AVANÃ‡ADO ====================

    private matchSubscription(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('subscription') || name.includes('subscribe') || name.includes('newsletter')) {
            confidence += 0.7;
        }

        if (node.type === 'FRAME' && 'children' in node) {
            const hasInput = node.children?.some(child => child.name.toLowerCase().includes('email'));
            if (hasInput) confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchMediaCarousel(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('media') && name.includes('carousel')) {
            confidence += 0.8;
        }

        if (name.includes('carousel') || name.includes('slider')) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchSliderSlides(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('slider') || name.includes('slide')) {
            confidence += 0.7;
        }

        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 2) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchPostNavigation(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if ((name.includes('prev') || name.includes('next')) && name.includes('post')) {
            confidence += 0.7;
        }

        if (name.includes('navigation')) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchTableOfContents(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('toc') || name.includes('table') && name.includes('content')) {
            confidence += 0.8;
        }

        if (name.includes('index') || name.includes('summary')) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchBlockquote(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('blockquote') || name.includes('quote')) {
            confidence += 0.7;
        }

        if (node.type === 'TEXT') {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchTestimonialCarousel(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('testimonial') && name.includes('carousel')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private matchReviewBox(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('review') && name.includes('box')) {
            confidence += 0.8;
        }

        if (name.includes('rating')) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchReviews(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('reviews') || name.includes('rating')) {
            confidence += 0.7;
        }

        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 2) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchHotspots(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('hotspot') || name.includes('marker')) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }

    private matchSitemap(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('sitemap')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private matchProgressTracker(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('progress') || name.includes('tracker') || name.includes('stepper') || name.includes('wizard')) {
            confidence += 0.7;
        }

        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 3) {
            confidence += 0.3;
        }

        return Math.min(confidence, 1.0);
    }

    private matchAnimatedText(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('animated') && name.includes('text')) {
            confidence += 0.8;
        }

        if (node.type === 'TEXT') {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchBreadcrumb(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('breadcrumb') || name.includes('bread')) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }

    private matchFacebookButton(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('facebook') && name.includes('button')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private matchFacebookComments(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('facebook') && name.includes('comment')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private matchFacebookEmbed(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('facebook') && name.includes('embed')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private matchFacebookPage(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('facebook') && name.includes('page')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private matchPostInfo(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('post') && name.includes('info')) {
            confidence += 0.8;
        }

        if (name.includes('meta') || name.includes('date') || name.includes('author')) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchVideoPlaylist(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('video') && name.includes('playlist')) {
            confidence += 0.8;
        }

        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 2) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchVideoGallery(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('video') && name.includes('gallery')) {
            confidence += 0.8;
        }

        if (node.type === 'FRAME' && 'children' in node && node.children && node.children.length >= 2) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
    }

    private matchNestedTabs(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('nested') && name.includes('tab')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    // ==================== MATCHERS - EXPERIMENTAIS ====================

    private matchMegaMenu(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('mega') && name.includes('menu')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private matchScrollSnap(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('scroll') && name.includes('snap')) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }

    private matchMotionEffects(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('motion') || name.includes('parallax') || name.includes('effect')) {
            confidence += 0.6;
        }

        return Math.min(confidence, 1.0);
    }

    private matchBackgroundSlideshow(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('background') && name.includes('slideshow')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private matchCSSTransform(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('transform') || name.includes('rotate') || name.includes('scale')) {
            confidence += 0.7;
        }

        return Math.min(confidence, 1.0);
    }

    private matchCustomPosition(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('position') || name.includes('absolute') || name.includes('fixed')) {
            confidence += 0.6;
        }

        return Math.min(confidence, 1.0);
    }

    private matchDynamicTags(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('dynamic') && name.includes('tag')) {
            confidence += 0.8;
        }

        return Math.min(confidence, 1.0);
    }

    private matchAjaxPagination(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('ajax') && name.includes('pagination')) {
            confidence += 0.9;
        }

        if (name.includes('load') && name.includes('more')) {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }

    private matchParallax(node: SceneNode): number {
        let confidence = 0;
        const name = node.name.toLowerCase();

        if (name.includes('parallax')) {
            confidence += 0.9;
        }

        return Math.min(confidence, 1.0);
    }

    private isLockedImageGroup(node: SceneNode): boolean {
        if (node.type !== 'FRAME' && node.type !== 'GROUP') return false;
        const locked = (node as any).locked === true;
        if (!locked) return false;
        const hasImageFill = 'fills' in node && Array.isArray((node as any).fills) && (node as any).fills.some((f: any) => f.type === 'IMAGE');
        const children = ('children' in node && node.children ? (node.children as SceneNode[]) : []) || [];
        const hasLockedImageChild = children.some(ch => (ch as any).type === 'IMAGE' && (ch as any).isLockedImage === true);
        return locked && (hasImageFill || hasLockedImageChild);
    }

    private collectDescendantIds(node: SceneNode): string[] {
        const ids: string[] = [node.id];
        if ('children' in node && node.children) {
            for (const child of node.children as SceneNode[]) {
                ids.push(...this.collectDescendantIds(child));
            }
        }
        return ids;
    }

}
