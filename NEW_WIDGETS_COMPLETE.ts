/**
 * ========================================
 * FASE 2 + 3 + 4: 62 WIDGETS RESTANTES
 * ========================================
 * 
 * Este arquivo contém os 62 widgets finais:
 * - 16 WooCommerce adicionais
 * - 37 Pro adicionais
 * - 9 Experimentais
 * 
 * Total após integração: 148 widgets (100% completo!)
 */

// ========================================
// PASSO 1: ADICIONAR NO initializeRules()
// ========================================
// Adicione estas linhas APÓS a linha 188 (woo:loop-product-button)
// e ANTES da linha 190 (// Mais regras...)

/*
        // === WOOCOMMERCE AVANÇADO (Fase 2) ===
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
*/

// ========================================
// PASSO 2: ADICIONAR OS MATCHERS NO FINAL
// ========================================
// Cole TUDO abaixo no final do arquivo, antes da última }

// ==================== MATCHERS - WOOCOMMERCE AVANÇADO ====================

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

/**
 * ========================================
 * RESUMO DA INTEGRAÇÃO
 * ========================================
 * 
 * 1. Abra src/linter/detectors/WidgetDetector.ts
 * 
 * 2. No método initializeRules():
 *    - Adicione TODAS as regras após linha 188 (woo:loop-product-button)
 *    - Copie o bloco comentado do PASSO 1 acima
 * 
 * 3. Cole TODOS os matchers acima no final da classe
 *    (antes da última linha que fecha a classe)
 * 
 * 4. Salve o arquivo
 * 
 * 5. Execute: npm run build
 * 
 * 6. Teste no Figma
 * 
 * RESULTADO: 148/148 widgets (100% COMPLETO!)
 * 
 * Build estimado: ~365kb (350kb + 15kb)
 * 
 * ========================================
 */
