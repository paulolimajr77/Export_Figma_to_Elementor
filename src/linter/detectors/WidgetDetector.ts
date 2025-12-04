import { WidgetDetection } from '../types';

/**
 * WidgetDetector - Detecção inteligente de widgets Elementor
 * 
 * Analisa nodes do Figma e identifica qual widget Elementor melhor representa cada elemento.
 * Suporta 148 widgets divididos em 6 categorias:
 * - Básicos (36)
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

export class WidgetDetector {
    private rules: WidgetRule[] = [];

    constructor() {
        this.initializeRules();
    }

    /**
     * Detecta qual widget Elementor melhor representa o node
     */
    detect(node: SceneNode): WidgetDetection | null {
        const detections: Array<{ widget: string; confidence: number; justification: string }> = [];

        for (const rule of this.rules) {
            const confidence = rule.matcher(node);
            if (confidence > 0) {
                detections.push({
                    widget: rule.widget,
                    confidence,
                    justification: this.generateJustification(node, rule.widget, confidence)
                });
            }
        }

        // Ordena por confidence e retorna o melhor match
        detections.sort((a, b) => b.confidence - a.confidence);
        const best = detections[0];

        if (!best || best.confidence < 0.3) {
            return null; // Confidence muito baixa
        }

        return {
            node_id: node.id,
            node_name: node.name,
            widget: best.widget,
            confidence: best.confidence,
            justification: best.justification
        };
    }

    /**
     * Detecta múltiplos widgets em uma árvore
     */
    detectAll(root: SceneNode): WidgetDetection[] {
        const results: WidgetDetection[] = [];

        const traverse = (node: SceneNode) => {
            const detection = this.detect(node);
            if (detection) {
                results.push(detection);
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
     * Inicializa todas as regras de detecção
     */
    private initializeRules(): void {
        // === BÁSICOS ===
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
        this.addRule('w:author-box', 'pro', this.matchGenericContainer.bind(this));
        this.addRule('w:share-buttons', 'pro', this.matchSocialIcons.bind(this));
        this.addRule('w:slideshow', 'pro', this.matchPortfolio.bind(this));
        this.addRule('w:gallery-pro', 'pro', this.matchPortfolio.bind(this));

        // === WOOCOMMERCE ===
        this.addRule('woo:product-title', 'woo', this.matchWooProductTitle.bind(this));
        this.addRule('woo:product-image', 'woo', this.matchWooProductImage.bind(this));
        this.addRule('woo:product-price', 'woo', this.matchWooProductPrice.bind(this));
        this.addRule('woo:product-add-to-cart', 'woo', this.matchWooAddToCart.bind(this));
        this.addRule('woo:product-rating', 'woo', this.matchWooProductRating.bind(this));
        this.addRule('woo:cart', 'woo', this.matchGenericContainer.bind(this));
        this.addRule('woo:checkout', 'woo', this.matchForm.bind(this));

        // === LOOP BUILDER ===
        this.addRule('loop:item', 'loop', this.matchGenericContainer.bind(this));
        this.addRule('loop:image', 'loop', this.matchImage.bind(this));
        this.addRule('loop:title', 'loop', this.matchHeading.bind(this));
        this.addRule('loop:meta', 'loop', this.matchGenericText.bind(this));
        this.addRule('loop:terms', 'loop', this.matchGenericText.bind(this));
        this.addRule('loop:rating', 'loop', this.matchStarRating.bind(this));
        this.addRule('loop:price', 'loop', this.matchGenericText.bind(this));
        this.addRule('loop:add-to-cart', 'loop', this.matchButton.bind(this));
        this.addRule('loop:read-more', 'loop', this.matchButton.bind(this));
        this.addRule('loop:featured-image', 'loop', this.matchImage.bind(this));
        this.addRule('loop:pagination', 'loop', this.matchGenericContainer.bind(this));

        // === WORDPRESS ===
        this.addRule('w:wp-search', 'wordpress', this.matchSearchForm.bind(this));
        this.addRule('w:wp-recent-posts', 'wordpress', this.matchGenericContainer.bind(this));
        this.addRule('w:wp-archives', 'wordpress', this.matchGenericContainer.bind(this));
        this.addRule('w:wp-categories', 'wordpress', this.matchGenericContainer.bind(this));
        this.addRule('w:wp-calendar', 'wordpress', this.matchGenericContainer.bind(this));
        this.addRule('w:wp-tag-cloud', 'wordpress', this.matchGenericContainer.bind(this));
        this.addRule('w:wp-recent-comments', 'wordpress', this.matchGenericContainer.bind(this));
        this.addRule('w:wp-custom-menu', 'wordpress', this.matchNavMenu.bind(this));

        // === BÁSICOS ADICIONAIS (Fase 1) ===
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
        this.addRule('woo:product-additional-information', 'woo', this.matchGenericContainer.bind(this));
        this.addRule('woo:product-short-description', 'woo', this.matchGenericText.bind(this));
        this.addRule('woo:product-related', 'woo', this.matchWooProducts.bind(this));
        this.addRule('woo:product-upsells', 'woo', this.matchWooProducts.bind(this));
        this.addRule('woo:product-tabs', 'woo', this.matchWooProductTabs.bind(this));
        this.addRule('woo:product-gallery', 'woo', this.matchGallery.bind(this));
        this.addRule('woo:product-loop-item', 'woo', this.matchGenericContainer.bind(this));
        this.addRule('woo:loop-product-rating', 'woo', this.matchStarRating.bind(this));
        this.addRule('woo:loop-product-meta', 'woo', this.matchGenericText.bind(this));
        this.addRule('woo:my-account', 'woo', this.matchForm.bind(this));
        this.addRule('woo:purchase-summary', 'woo', this.matchGenericContainer.bind(this));
        this.addRule('woo:order-tracking', 'woo', this.matchForm.bind(this));

        // === PRO AVANÇADO (Fase 3) ===
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
        this.addRule('w:loop-builder', 'pro', this.matchGenericContainer.bind(this));
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
        this.addRule('w:search-results', 'pro', this.matchGenericContainer.bind(this));
        this.addRule('w:global-widget', 'pro', this.matchGenericContainer.bind(this));
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
     * Adiciona uma regra de detecção
     */
    private addRule(widget: string, category: WidgetRule['category'], matcher: (node: SceneNode) => number): void {
        this.rules.push({ widget, category, matcher });
    }

    /**
     * Gera justificativa para a detecção
     */
    private generateJustification(node: SceneNode, widget: string, confidence: number): string {
        const reasons: string[] = [];

        // Análise baseada no nome
        if (node.name.toLowerCase().includes(widget.replace(/^w:|^woo:|^loop:/, ''))) {
            reasons.push('Nome do layer corresponde ao widget');
        }

        // Análise baseada no tipo
        if (node.type === 'TEXT') {
            reasons.push('É um elemento de texto');
        } else if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
            reasons.push('Estrutura compatível com o widget');
        }

        // Confidence
        if (confidence >= 0.8) {
            reasons.push('Alta confiança na detecção');
        } else if (confidence >= 0.5) {
            reasons.push('Confiança moderada');
        }

        return reasons.join('; ');
    }

    // ==================== MATCHERS - BÁSICOS ====================

    private matchHeading(node: SceneNode): number {
        if (node.type !== 'TEXT') return 0;
        const text = node as TextNode;

        let confidence = 0.4; // Base

        // Nome contém "heading", "h1", "h2", "título"
        const name = node.name.toLowerCase();
        if (name.includes('heading') || name.includes('título') || /^h[1-6]$/i.test(name)) {
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
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('button') || name.includes('btn') || name.includes('cta')) {
            confidence += 0.5;
        }

        // Frame com texto filho
        if (node.type === 'FRAME' && 'children' in node) {
            const hasText = node.children?.some(child => child.type === 'TEXT');
            if (hasText) {
                confidence += 0.3;
            }
        }

        // Possui border radius
        if ('cornerRadius' in node && node.cornerRadius && (node.cornerRadius as number) > 0) {
            confidence += 0.2;
        }

        return Math.min(confidence, 1.0);
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

        // É um vetor
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
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('image-box') || name.includes('image box')) {
            confidence += 0.6;
        }

        // Frame com imagem + texto
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const hasImage = node.children.some(child =>
                child.name.toLowerCase().includes('image') ||
                ('fills' in child && Array.isArray(child.fills) && child.fills.some(f => f.type === 'IMAGE'))
            );
            const hasText = node.children.some(child => child.type === 'TEXT');

            if (hasImage && hasText) {
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchIconBox(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('icon-box') || name.includes('icon box')) {
            confidence += 0.6;
        }

        // Frame com icon + texto
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const hasIcon = node.children.some(child =>
                child.name.toLowerCase().includes('icon') ||
                child.type === 'VECTOR'
            );
            const hasText = node.children.some(child => child.type === 'TEXT');

            if (hasIcon && hasText) {
                confidence += 0.4;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchStarRating(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('star') || name.includes('rating') || name.includes('review')) {
            confidence += 0.7;
        }

        // Múltiplos icons em linha
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

        // Texto com números
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

        // Múltiplos frames horizontais
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

        // Múltiplos frames verticais
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

        // Múltiplos icons pequenos em linha
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

        // Múltiplos pares de icon + texto
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

        // Múltiplos links/botões horizontais
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

        // Input + botão
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
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('testimonial') || name.includes('review') || name.includes('depoimento')) {
            confidence += 0.7;
        }

        // Frame com quote + author
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            const hasText = node.children.filter(child => child.type === 'TEXT').length >= 2;
            if (hasText) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    private matchContainer(node: SceneNode): number {
        let confidence = 0;

        const name = node.name.toLowerCase();
        if (name.includes('container') || name.includes('section') || name.includes('wrapper')) {
            confidence += 0.5;
        }

        // Frame com múltiplos filhos
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

        // Múltiplos inputs
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

        // Frame com titulo + descrição + botão
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

        // Múltiplos números (dias, horas, min, seg)
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

        // Frame com título + preço + features + button
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

        // Lista de items com preços
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

        // Texto com cifrão ou número
        if (node.type === 'TEXT') {
            const text = node as TextNode;
            if (text.characters && (/\$|R\$|€/.test(text.characters) || /\d+[.,]\d+/.test(text.characters))) {
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

    // ==================== MATCHERS - GENÉRICOS ====================

    /**
     * Matcher genérico para texto (usado para widgets simples de texto)
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
     * Matcher genérico para containers (usado para widgets que são apenas wrappers)
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

        // Container com múltiplas imagens
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

        // Container horizontal com múltiplas imagens
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

        // Frame com aspect ratio próximo de mapa
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

        // Container com layout grid ou múltiplos filhos repetidos
        if (node.type === 'FRAME' && 'children' in node && node.children) {
            if (node.children.length >= 4) {
                confidence += 0.3;
            }
        }

        return Math.min(confidence, 1.0);
    }

    // ==================== MATCHERS - WOOCOMMERCE SIMPLES ====================

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

        // Container com múltiplos itens
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

    // ==================== MATCHERS - PRO AVANÇADO ====================

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

}
