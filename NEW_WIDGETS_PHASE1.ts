/**
 * ========================================
 * FASE 1: 30 NOVOS WIDGETS
 * ========================================
 * 
 * Este arquivo contém os 30 novos widget matchers da Fase 1:
 * - 13 Básicos adicionais
 * - 2 WordPress adicionais  
 * - 7 Loop Builder adicionais
 * - 8 WooCommerce simples
 * 
 * Total após integração: 90 widgets (60 atuais + 30 novos)
 */

// ========================================
// PASSO 1: ADICIONAR NO initializeRules()
// ========================================
// Adicione estas linhas APÓS a linha 146 (depois de 'loop:meta')
// e ANTES da linha 148 (// === WORDPRESS ===)

/*
        this.addRule('loop:terms', 'loop', this.matchGenericText.bind(this));
        this.addRule('loop:rating', 'loop', this.matchStarRating.bind(this));
        this.addRule('loop:price', 'loop', this.matchGenericText.bind(this));
        this.addRule('loop:add-to-cart', 'loop', this.matchButton.bind(this));
        this.addRule('loop:read-more', 'loop', this.matchButton.bind(this));
        this.addRule('loop:featured-image', 'loop', this.matchImage.bind(this));
        this.addRule('loop:pagination', 'loop', this.matchGenericContainer.bind(this));
*/

// ========================================
// Adicione estas linhas APÓS a linha 154 (depois de 'wp-tag-cloud')
// e ANTES da linha 156 (// Mais regras...)

/*
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
*/

// ========================================
// PASSO 2: ADICIONAR OS MATCHERS NO FINAL
// ========================================
// Cole TUDO abaixo no final do arquivo WidgetDetector.ts
// ANTES da última linha que fecha a classe: }

// ==================== MATCHERS - BÁSICOS ADICIONAIS ====================

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

/**
 * ========================================
 * RESUMO DA INTEGRAÇÃO
 * ========================================
 * 
 * 1. Abra src/linter/detectors/WidgetDetector.ts
 * 
 * 2. No método initializeRules():
 *    - Adicione as 7 regras de Loop Builder após linha 146
 *    - Adicione as 2 regras WordPress + 13 Básicos + 8 Woo após linha 154
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
 * RESULTADO: 90 widgets detectáveis (60 atuais + 30 novos)
 * 
 * ========================================
 */
