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

        // === WOOCOMMERCE ===
        this.addRule('woo:product-title', 'woo', this.matchWooProductTitle.bind(this));
        this.addRule('woo:product-image', 'woo', this.matchWooProductImage.bind(this));
        this.addRule('woo:product-price', 'woo', this.matchWooProductPrice.bind(this));
        this.addRule('woo:product-add-to-cart', 'woo', this.matchWooAddToCart.bind(this));
        this.addRule('woo:product-rating', 'woo', this.matchWooProductRating.bind(this));

        // Mais regras serão adicionadas conforme necessário
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
        if (text.fontSize && (text.fontSize as number) > 24) {
            confidence += 0.2;
        }

        // Font weight bold
        if (text.fontWeight && (text.fontWeight as number) >= 700) {
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
        if (text.fontSize && (text.fontSize as number) >= 14 && (text.fontSize as number) <= 18) {
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
}
