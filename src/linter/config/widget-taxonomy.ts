/**
 * Taxonomia oficial de widgets/nomenclatura.
 * Fonte de verdade: WIDGET_DATA definido na UI (ui.html/ui.js).
 * Não adicionamos slugs novos aqui para evitar divergência com a aba Ajuda.
 */
export interface WidgetCategory {
    id: string;
    label: string;
    items: string[];
}

export const WIDGET_TAXONOMY: WidgetCategory[] = [
    {
        id: 'basics',
        label: 'Basicos',
        items: [
            'heading', 'text', 'button', 'image', 'icon', 'video', 'divider', 'spacer', 'image-box', 'icon-box',
            'star-rating', 'counter', 'progress', 'tabs', 'accordion', 'toggle', 'alert', 'social-icons',
            'soundcloud', 'shortcode', 'html', 'menu-anchor', 'sidebar', 'read-more', 'image-carousel',
            'basic-gallery', 'gallery', 'icon-list', 'nav-menu', 'search-form', 'google-maps', 'testimonial',
            'embed', 'lottie', 'loop:grid', 'w:container', 'w:inner-container'
        ]
    },
    {
        id: 'pro',
        label: 'Pro',
        items: [
            'form', 'login', 'subscription', 'call-to-action', 'media:carousel', 'portfolio', 'gallery-pro',
            'slider:slides', 'slideshow', 'flip-box', 'animated-headline', 'post-navigation', 'share-buttons',
            'table-of-contents', 'countdown', 'blockquote', 'testimonial-carousel', 'review-box', 'reviews', 'hotspots',
            'sitemap', 'author-box', 'price-table', 'price-list', 'progress-tracker', 'animated-text',
            'nav-menu-pro', 'breadcrumb', 'facebook-button', 'facebook-comments', 'facebook-embed',
            'facebook-page', 'loop:builder', 'loop:grid-advanced', 'loop-carousel', 'post-excerpt',
            'post-content', 'post-title', 'post-info', 'post-featured-image', 'post-author', 'post-date',
            'post-terms', 'archive-title', 'archive-description', 'site-logo', 'site-title', 'site-tagline',
            'search-results', 'global-widget', 'video-playlist', 'video-gallery'
        ]
    },
    {
        id: 'woo',
        label: 'WooCommerce',
        items: [
            'woo:product-title', 'woo:product-image', 'woo:product-price', 'woo:product-add-to-cart',
            'woo:product-data-tabs', 'woo:product-excerpt', 'woo:product-rating', 'woo:product-stock',
            'woo:product-meta', 'woo:product-additional-information', 'woo:product-short-description',
            'woo:product-related', 'woo:product-upsells', 'woo:product-tabs', 'woo:product-breadcrumb',
            'woo:product-gallery', 'woo:products', 'woo:product-grid', 'woo:product-carousel',
            'woo:product-loop-item', 'woo:loop-product-title', 'woo:loop-product-price',
            'woo:loop-product-rating', 'woo:loop-product-image', 'woo:loop-product-button',
            'woo:loop-product-meta', 'woo:cart', 'woo:checkout', 'woo:my-account', 'woo:purchase-summary',
            'woo:order-tracking'
        ]
    },
    {
        id: 'loop-builder',
        label: 'Loop Builder',
        items: [
            'loop:item', 'loop:image', 'loop:title', 'loop:meta', 'loop:terms', 'loop:rating', 'loop:price',
            'loop:add-to-cart', 'loop:read-more', 'loop:featured-image', 'loop:pagination'
        ]
    },
    {
        id: 'experimental',
        label: 'Experimentais',
        items: [
            'w:nested-tabs', 'w:mega-menu', 'w:scroll-snap', 'w:motion-effects', 'w:background-slideshow',
            'w:css-transform', 'w:custom-position', 'w:dynamic-tags', 'w:ajax-pagination'
        ]
    },
    {
        id: 'wordpress',
        label: 'WordPress',
        items: [
            'w:wp-search', 'w:wp-recent-posts', 'w:wp-recent-comments', 'w:wp-archives', 'w:wp-categories',
            'w:wp-calendar', 'w:wp-tag-cloud', 'w:wp-custom-menu'
        ]
    },
    {
        id: 'hierarchy',
        label: 'Nomenclatura Hierarquica',
        items: [
            'accordion:item', 'accordion:title', 'accordion:content', 'accordion:icon',
            'tabs:item', 'tabs:title', 'tabs:content',
            'list:item', 'list:icon', 'list:text',
            'slide:1', 'slide:2', 'carousel:slide',
            'countdown:days', 'countdown:hours', 'countdown:minutes', 'countdown:seconds',
            'toggle:item', 'toggle:title', 'toggle:content'
        ]
    }
];

const ALL_WIDGET_SLUGS = new Set<string>(WIDGET_TAXONOMY.flatMap(cat => cat.items));

export function getAllWidgetSlugs(): string[] {
    return Array.from(ALL_WIDGET_SLUGS);
}

export function isWidgetInTaxonomy(slug: string | undefined | null): boolean {
    if (!slug) return false;
    return ALL_WIDGET_SLUGS.has(slug.trim());
}

/**
 * Normaliza um slug vindo do detector/regra para a taxonomia oficial.
 * - aceita exatamente os slugs da taxonomia
 * - aceita "w:xxx" e retorna "xxx" se "xxx" existir na lista (para compatibilidade retro)
 */
export function normalizeWidgetSlug(slug: string | undefined | null): string | null {
    if (!slug) return null;
    const trimmed = slug.trim();
    if (ALL_WIDGET_SLUGS.has(trimmed)) return trimmed;

    if (trimmed.startsWith('w:')) {
        const withoutPrefix = trimmed.slice(2);
        if (ALL_WIDGET_SLUGS.has(withoutPrefix)) {
            return withoutPrefix;
        }
    }
    return null;
}

export function filterValidWidgetNames(names: string[]): string[] {
    const unique: string[] = [];
    names.forEach(name => {
        const normalized = normalizeWidgetSlug(name);
        if (normalized && !unique.includes(normalized)) {
            unique.push(normalized);
        }
    });
    return unique;
}

// Subconjuntos prontos para regras/detectores
const TEXT_WIDGETS = [
    'heading', 'text', 'animated-headline', 'post-title', 'post-excerpt', 'post-content', 'post-info',
    'post-terms', 'archive-title', 'archive-description', 'site-title', 'site-tagline', 'countdown', 'blockquote'
].filter(isWidgetInTaxonomy);

const MEDIA_WIDGETS = [
    'image', 'image-box', 'image-carousel', 'basic-gallery', 'gallery', 'media:carousel', 'slideshow',
    'slider:slides', 'video', 'video-gallery', 'video-playlist', 'loop:image', 'post-featured-image', 'site-logo',
    'woo:product-image', 'woo:product-gallery', 'woo:product-carousel'
].filter(isWidgetInTaxonomy);

const CONTAINER_WIDGETS = [
    'w:container', 'w:inner-container', 'menu-anchor', 'sidebar', 'nav-menu', 'nav-menu-pro',
    'accordion', 'tabs', 'toggle',
    'accordion:item', 'accordion:title', 'accordion:content', 'accordion:icon',
    'tabs:item', 'tabs:title', 'tabs:content',
    'toggle:item', 'toggle:title', 'toggle:content',
    'carousel:slide', 'slide:1', 'slide:2'
].filter(isWidgetInTaxonomy);

const FORM_WIDGETS = [
    'form', 'login', 'subscription', 'search-form', 'woo:checkout', 'woo:cart', 'woo:order-tracking', 'woo:my-account'
].filter(isWidgetInTaxonomy);

export const getTextWidgetNames = () => [...TEXT_WIDGETS];
export const getMediaWidgetNames = () => [...MEDIA_WIDGETS];
export const getContainerWidgetNames = () => [...CONTAINER_WIDGETS];
export const getFormWidgetNames = () => [...FORM_WIDGETS];
