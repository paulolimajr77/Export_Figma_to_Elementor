export const ANALYZE_RECREATE_PROMPT = `
Organize a árvore Figma em um schema de CONTAINERS FLEX.

REGRAS CRÍTICAS:
- Não ignore nenhum node. Cada node vira container (se tiver filhos) ou widget (se for folha).
- Não classifique por aparência. Se não souber, type = "custom".
- Não invente grids ou sections/columns legados.
- Preserve a ordem original dos filhos.
- Auto layout: HORIZONTAL -> direction=row; VERTICAL/NONE -> direction=column.
- gap = itemSpacing; padding = paddingTop/Right/Bottom/Left; background = fills/gradiente/imagem se houver.
- styles deve incluir sourceId com o id do node original.
- Modo sem IA: se o usuário desligar IA, siga o mesmo schema usando apenas heurísticas (não invente texto).

WIDGETS PERMITIDOS (use exatamente estes tipos; se não se encaixar, use "custom"):
- Básicos: heading, text, button, image, icon, video, divider, spacer, image-box, icon-box, star-rating, counter, progress, tabs, accordion, toggle, alert, social-icons, soundcloud, shortcode, html, menu-anchor, sidebar, read-more, image-carousel, basic-gallery, gallery, icon-list, nav-menu, search-form, google-maps, testimonial, embed, lottie, loop:grid.
- Pro: form, login, subscription, call-to-action, media:carousel, portfolio, gallery-pro, slider:slides, slideshow, flip-box, animated-headline, post-navigation, share-buttons, table-of-contents, countdown, blockquote, testimonial-carousel, review-box, hotspots, sitemap, author-box, price-table, price-list, progress-tracker, animated-text, nav-menu-pro, breadcrumb, facebook-button, facebook-comments, facebook-embed, facebook-page, loop:builder, loop:grid-advanced, loop:carousel, post-excerpt, post-content, post-title, post-info, post-featured-image, post-author, post-date, post-terms, archive-title, archive-description, site-logo, site-title, site-tagline, search-results, global-widget, video-playlist, video-gallery.
- WooCommerce: woo:product-title, woo:product-image, woo:product-price, woo:product-add-to-cart, woo:product-data-tabs, woo:product-excerpt, woo:product-rating, woo:product-stock, woo:product-meta, woo:product-additional-information, woo:product-short-description, woo:product-related, woo:product-upsells, woo:product-tabs, woo:product-breadcrumb, woo:product-gallery, woo:products, woo:product-grid, woo:product-carousel, woo:product-loop-item, woo:loop-product-title, woo:loop-product-price, woo:loop-product-rating, woo:loop-product-image, woo:loop-product-button, woo:loop-product-meta, woo:cart, woo:checkout, woo:my-account, woo:purchase-summary, woo:order-tracking.
- Loop Builder: loop:item, loop:image, loop:title, loop:meta, loop:terms, loop:rating, loop:price, loop:add-to-cart, loop:read-more, loop:featured-image, loop:pagination.
- Experimentais: w:nested-tabs, w:mega-menu, w:scroll-snap, w:motion-effects, w:background-slideshow, w:css-transform, w:custom-position, w:dynamic-tags, w:ajax-pagination, w:aspect-ratio-container.
- WordPress: w:wp-search, w:wp-recent-posts, w:wp-recent-comments, w:wp-archives, w:wp-categories, w:wp-calendar, w:wp-tag-cloud, w:wp-custom-menu.

SCHEMA ALVO:
{
  "page": { "title": "...", "tokens": { "primaryColor": "...", "secondaryColor": "..." } },
  "containers": [
    {
      "id": "string",
      "direction": "row" | "column",
      "width": "full" | "boxed",
      "styles": { "sourceId": "id-original" },
      "widgets": [ { "type": "um dos widgets acima ou custom", "content": "...", "imageId": null, "styles": { "sourceId": "id-do-node" } } ],
      "children": [ ... ]
    }
  ]
}

ENTRADA:
\${nodeData}

INSTRUÇÕES:
- Mantenha textos e imagens exatamente como no original.
- Não agrupe nós diferentes em um único widget.
- Se o node tem filhos -> container; se não tem -> widget simples.
- width use "full" (padrão); direction derive do layoutMode.
- Se não reconhecer o widget, classifique como "custom".
- IMPORTANTE: Se um node tiver type="IMAGE" (mesmo que pareça container), trate como w:image e use seu ID como imageId.
`;
