export const ANALYZE_RECREATE_PROMPT = `
Act as an EXPERT in Figma and Elementor.
Your goal is to visually and structurally interpret the layout of the sent frame and recreate it using the best practices of responsive design and Auto Layout.

1. ANALYZE the layout screenshot and the STRUCTURAL DATA below.
2. APPLY the best practices of Auto Layout, responsiveness, visual hierarchy, and organization.
3. MAP each Figma layer to the most suitable native Elementor widget (e.g., Layer "Title" -> w:heading, Layer "Image" -> w:image).
4. PRESERVE visual fidelity using the provided data as the ABSOLUTE SOURCE OF TRUTH.

AVAILABLE IMAGES (IDs):
\${availableImageIds}

STRUCTURAL CONTEXT (FIGMA DATA):
\${nodeData}

CRITICAL VISUAL FIDELITY RULES:
1. DIMENSIONS: Copy EXACTLY the "width" and "height" from the structural JSON for each element. DO NOT invent values.
2. BACKGROUNDS: Extract "fills" from the JSON. If "SOLID", use the hex color. If "GRADIENT", try to reproduce or use the main color.
3. IMAGES: If the JSON has "fills" of type "IMAGE", map to the correct image widget.
4. TEXT: Copy the text EXACTLY as it is in the "characters" field of the JSON.

VALID WIDGET LIST (Use EXACTLY these tags in the "name" field):

**Widgets Básicos (Elementor Free)**
- w:container, w:inner-container, w:heading, w:text-editor, w:image, w:video, w:button, w:divider, w:spacer, w:icon, w:icon-box, w:image-box, w:star-rating, w:counter, w:progress, w:tabs, w:accordion, w:toggle, w:alert, w:social-icons, w:soundcloud, w:shortcode, w:html, w:menu-anchor, w:sidebar, w:read-more, w:image-carousel, w:basic-gallery, w:gallery, w:icon-list, w:nav-menu, w:search-form, w:google-maps, w:testimonial, w:embed, w:lottie, loop:grid

**Widgets Elementor Pro**
- w:form, w:login, w:subscription, w:call-to-action, media:carousel, w:portfolio, w:gallery-pro, slider:slides, w:slideshow, w:flip-box, w:animated-headline, w:post-navigation, w:share-buttons, w:table-of-contents, w:countdown, w:blockquote, w:testimonial-carousel, w:review-box, w:hotspots, w:sitemap, w:author-box, w:price-table, w:price-list, w:progress-tracker, w:animated-text, w:nav-menu-pro, w:breadcrumb, w:facebook-button, w:facebook-comments, w:facebook-embed, w:facebook-page, loop:builder, loop:grid-advanced, loop:carousel, w:post-excerpt, w:post-content, w:post-title, w:post-info, w:post-featured-image, w:post-author, w:post-date, w:post-terms, w:archive-title, w:archive-description, w:site-logo, w:site-title, w:site-tagline, w:search-results, w:global-widget, w:video-playlist, w:video-gallery

**WooCommerce Widgets**
- woo:product-title, woo:product-image, woo:product-price, woo:product-add-to-cart, woo:product-data-tabs, woo:product-excerpt, woo:product-rating, woo:product-stock, woo:product-meta, woo:product-additional-information, woo:product-short-description, woo:product-related, woo:product-upsells, woo:product-tabs, woo:product-breadcrumb, woo:product-gallery, woo:products, woo:product-grid, woo:product-carousel, woo:product-loop-item, woo:loop-product-title, woo:loop-product-price, woo:loop-product-rating, woo:loop-product-image, woo:loop-product-button, woo:loop-product-meta, woo:cart, woo:checkout, woo:my-account, woo:purchase-summary, woo:order-tracking

**Loop Builder Widgets**
- loop:grid, loop:carousel, loop:item, loop:image, loop:title, loop:meta, loop:terms, loop:rating, loop:price, loop:add-to-cart, loop:read-more, loop:featured-image

**Carrosséis**
- w:image-carousel, media:carousel, w:testimonial-carousel, w:review-carousel, slider:slides, slider:slider, loop:carousel, woo:product-carousel, w:posts-carousel, w:gallery-carousel

**Widgets Experimentais**
- w:nested-tabs, w:mega-menu, w:scroll-snap, w:motion-effects, w:background-slideshow, w:css-transform, w:custom-position, w:dynamic-tags, w:ajax-pagination, loop:pagination, w:aspect-ratio-container

**WordPress Widgets**
- w:wp-search, w:wp-recent-posts, w:wp-recent-comments, w:wp-archives, w:wp-categories, w:wp-calendar, w:wp-tag-cloud, w:wp-custom-menu

Responda APENAS com JSON válido seguindo ESTRITAMENTE esta estrutura:

{
  "frameName": "Nome do Frame",
  "width": \${width},
  "height": \${height},
  "background": "#FFFFFF",
  "autoLayout": { "direction": "vertical", "gap": 0, "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 } },
  "children": [
    {
      "type": "container",
      "name": "w:container",
      "background": "transparent",
      "width": \${width},
      "height": \${halfHeight},
      "autoLayout": { "direction": "vertical", "gap": 20, "padding": { "top": 40, "right": 40, "bottom": 40, "left": 40 } },
      "children": [
        {
          "type": "widget",
          "widgetType": "heading",
          "name": "w:heading",
          "content": "TEXTO EXATO DA IMAGEM",
          "fontSize": 48,
          "fontFamily": "Inter",
          "fontWeight": "Bold",
          "color": "#333333",
          "width": \${halfWidth},
          "height": 60
        },
        {
          "type": "widget",
          "widgetType": "image",
          "name": "w:image",
          "content": "\${firstImageId}",
          "width": \${thirdWidth},
          "height": \${thirdHeight}
        }
      ]
    }
    }
  ]
}

Regras CRITICAS:
1. Use os DADOS DO FIGMA fornecidos para extrair o texto exato, fontes (fontFamily/fontWeight), cores e dimensões.
2. Estime as dimensões (width/height) de TODOS os elementos com precisão baseada nos dados.
3. Para IMAGENS: Se a imagem visual corresponder a um dos IDs listados acima, use o ID no campo "content".
4.  **Components**: Identify repeating elements that should be Components.

OUTPUT FORMAT:
Provide the response in clear MARKDOWN format.
- Use **Bold** for key settings.
- Use \`Code Blocks\` ONLY for JSON tokens (Colors/Typography).
- Structure with clear Headings (###).

REQUIRED JSON OUTPUTS (Include these as code blocks):
- **Color Tokens JSON**: { "colors": { ... } }
- **Typography Tokens JSON**: { "typography": { ... } }

STRUCTURAL CONTEXT (FIGMA DATA):
\${nodeData}
`;

// ==================== MICRO-PROMPTS (Node-by-Node Conversion) ====================

export const MICRO_PROMPT_INIT = `Você é um especialista em Figma e Elementor.

Sua missão é converter layouts do Figma para JSON do Elementor, node por node.

Você receberá:
1. Lista de nomenclaturas válidas de widgets
2. Dados de cada node (JSON + Dev Mode)
3. Instruções específicas para cada conversão

Aguarde as próximas instruções.

Responda apenas: "Pronto. Aguardando nomenclaturas e nodes."`;

export const MICRO_PROMPT_NOMENCLATURES = `NOMENCLATURAS VÁLIDAS DE WIDGETS ELEMENTOR:

**Containers:**
- w:container (frame externo)
- w:inner-container (frame interno)

**Texto:**
- w:heading (títulos H1-H6)
- w:text-editor (parágrafos, corpo de texto)

**Mídia:**
- w:image (imagem simples)
- w:image-box (imagem + texto)
- w:video
- w:icon
- w:icon-box

**Interação:**
- w:button
- w:form
- w:search-form

**Layout:**
- w:divider
- w:spacer
- w:tabs
- w:accordion

**WooCommerce:**
- woo:product-title
- woo:product-image
- woo:product-price
- woo:product-add-to-cart

**Loop Builder:**
- loop:grid
- loop:carousel
- loop:item

**Widgets Básicos (Elementor Free):**
w:container, w:inner-container, w:heading, w:text-editor, w:image, w:video, w:button, w:divider, w:spacer, w:icon, w:icon-box, w:image-box, w:star-rating, w:counter, w:progress, w:tabs, w:accordion, w:toggle, w:alert, w:social-icons, w:soundcloud, w:shortcode, w:html, w:menu-anchor, w:sidebar, w:read-more, w:image-carousel, w:basic-gallery, w:gallery, w:icon-list, w:nav-menu, w:search-form, w:google-maps, w:testimonial, w:embed, w:lottie, loop:grid

**Widgets Elementor Pro:**
w:form, w:login, w:subscription, w:call-to-action, media:carousel, w:portfolio, w:gallery-pro, slider:slides, w:slideshow, w:flip-box, w:animated-headline, w:post-navigation, w:share-buttons, w:table-of-contents, w:countdown, w:blockquote, w:testimonial-carousel, w:review-box, w:hotspots, w:sitemap, w:author-box, w:price-table, w:price-list, w:progress-tracker, w:animated-text, w:nav-menu-pro, w:breadcrumb, w:facebook-button, w:facebook-comments, w:facebook-embed, w:facebook-page, loop:builder, loop:grid-advanced, loop:carousel, w:post-excerpt, w:post-content, w:post-title, w:post-info, w:post-featured-image, w:post-author, w:post-date, w:post-terms, w:archive-title, w:archive-description, w:site-logo, w:site-title, w:site-tagline, w:search-results, w:global-widget, w:video-playlist, w:video-gallery

**WooCommerce Widgets:**
woo:product-title, woo:product-image, woo:product-price, woo:product-add-to-cart, woo:product-data-tabs, woo:product-excerpt, woo:product-rating, woo:product-stock, woo:product-meta, woo:product-additional-information, woo:product-short-description, woo:product-related, woo:product-upsells, woo:product-tabs, woo:product-breadcrumb, woo:product-gallery, woo:products, woo:product-grid, woo:product-carousel, woo:product-loop-item, woo:loop-product-title, woo:loop-product-price, woo:loop-product-rating, woo:loop-product-image, woo:loop-product-button, woo:loop-product-meta, woo:cart, woo:checkout, woo:my-account, woo:purchase-summary, woo:order-tracking

**Loop Builder Widgets:**
loop:grid, loop:carousel, loop:item, loop:image, loop:title, loop:meta, loop:terms, loop:rating, loop:price, loop:add-to-cart, loop:read-more, loop:featured-image

**Carrosséis:**
w:image-carousel, media:carousel, w:testimonial-carousel, w:review-carousel, slider:slides, slider:slider, loop:carousel, woo:product-carousel, w:posts-carousel, w:gallery-carousel

**Widgets Experimentais:**
w:nested-tabs, w:mega-menu, w:scroll-snap, w:motion-effects, w:background-slideshow, w:css-transform, w:custom-position, w:dynamic-tags, w:ajax-pagination, loop:pagination, w:aspect-ratio-container

**WordPress Widgets:**
w:wp-search, w:wp-recent-posts, w:wp-recent-comments, w:wp-archives, w:wp-categories, w:wp-calendar, w:wp-tag-cloud, w:wp-custom-menu

REGRAS DE MAPEAMENTO:
1. FRAME externo → w:container
2. FRAME interno → w:inner-container  
3. TEXT com fontSize > 24px → w:heading
4. TEXT com fontSize ≤ 24px → w:text-editor
5. RECTANGLE com fill IMAGE → w:image
6. COMPONENT → detectar automaticamente
7. Sem correspondência → marcar como "custom"

Confirme o recebimento das nomenclaturas.`;

export function buildNodePrompt(nodeData: any, nodeIndex: number, totalNodes: number): string {
  return `NODE #${nodeIndex} de ${totalNodes}

ID: ${nodeData.id}
Nome: ${nodeData.name}
Tipo: ${nodeData.type}

DADOS COMPLETOS:
${JSON.stringify(nodeData, null, 2)}

TAREFA:
1. Analisar os dados acima
2. Identificar o widget Elementor mais adequado (use as nomenclaturas fornecidas)
3. Mapear as propriedades do Dev Mode para settings do Elementor
4. Retornar JSON no formato:

{
  "nodeId": "${nodeData.id}",
  "widget": "w:xxx",
  "confidence": "high|medium|low",
  "settings": {
    "layout": {...},
    "style": {...},
    "typography": {...}
  },
  "reasoning": "Breve explicação da escolha"
}

Se não houver correspondência, retorne:
{
  "nodeId": "${nodeData.id}",
  "widget": "custom",
  "reason": "Explicação",
  "suggestion": "Sugestão de implementação"
}`;
}

export function buildConsolidationPrompt(processedNodes: any[]): string {
  return `CONSOLIDAÇÃO FINAL

Você processou ${processedNodes.length} nodes. Agora consolide tudo em um JSON Elementor válido.

NODES PROCESSADOS:
${JSON.stringify(processedNodes, null, 2)}

TAREFA:
1. Montar hierarquia completa respeitando parent-child
2. Validar integridade estrutural
3. Gerar JSON final no formato Elementor
4. Criar relatório técnico

FORMATO DE SAÍDA:
{
  "elementorJSON": {
    "version": "1.0",
    "elements": [...]
  },
  "report": {
    "summary": {
      "totalNodes": ${processedNodes.length},
      "converted": 0,
      "custom": 0
    },
    "mappings": [...],
    "warnings": [...]
  }
}`;
}
