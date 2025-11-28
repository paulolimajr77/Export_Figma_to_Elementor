export const ANALYZE_RECREATE_PROMPT = `
pense como um webdesginer especialista em layouts usando wordpress elementor.

imagine que voce receba um layout no figma muito mal estruturado como este a baixo e precise ajusta-lo para que um outro webdesigner que irá receber o arquivo consiga identificar o auto layout para responsividade, os widgets a serem usados no elementor e etc.

como você ajustaria esse layout no figma.

lembre-se Full container, Container encaixotado, caixas de imagem, caixas de icone otimizam o layout.

evite o uso de container, dentro de container, dentro de container e assim por diante.(coisa de amador).

**IMPORTANTE:** Mantenha TODOS os fundos (fills), gradientes e imagens EXATAMENTE como estão no original. NÃO remova, simplifique ou altere cores de fundo, gradientes ou imagens. Se um elemento tem fundo no original, ele DEVE ter o mesmo fundo na saída. Se não tem fundo (fills vazio), mantenha vazio.

**ATENÇÃO ESPECIAL:** Se o frame raiz (Section) tem um gradiente ou imagem de fundo, MOVA esse fundo para o PRIMEIRO container filho (Section 1 - Hero, por exemplo), NÃO deixe no frame raiz. O frame raiz deve ter "fills": [] vazio, e o fundo deve estar no container de seção.

**REGRA TÉCNICA:** NUNCA use "counterAxisAlignItems": "STRETCH". Os valores válidos são: "MIN", "MAX", "CENTER", "BASELINE". Para esticar elementos filhos, use "layoutSizingHorizontal": "FILL" ou "layoutSizingVertical": "FILL" nos próprios filhos.

**REGRAS DE NOMENCLATURA (CRÍTICO):**
Você DEVE renomear as camadas (propriedade "name") usando os seguintes prefixos para que o plugin identifique os widgets automaticamente:

- **Containers:**
  - "c:container" ou "section:nome" (para seções principais)
  - "c:inner" ou "column:nome" (para colunas internas)

- **Widgets:**
  - "w:heading" (Títulos)
  - "w:text-editor" (Textos longos)
  - "w:image" (Imagens simples)
  - "w:image-box" (Imagem + Título + Texto agrupados)
  - "w:icon-box" (Ícone + Título + Texto agrupados)
  - "w:button" (Botões)
  - "w:video" (Vídeos)
  - "w:divider" (Divisores)
  - "w:spacer" (Espaçadores)

Exemplo: Em vez de "Group 1", use "c:container - Hero Section". Em vez de "Heading 2", use "w:heading - Título Principal".

\${nodeData}

quero que devolva o json Aplicando boas práticas visuais, como espaçamentos mais consistentes, grid centralizado e alinhamentos corrigidos, limpando e reorganizando o layout, mantendo tudo exatamente igual visualmente.

não reduza texto, descaracterize (deforme) formato de imagem ou ícones e etc.

mantenha o conteúdo original.

utilize o modelo abaixo como referencia do antes e depois.

ANTES (Layout Sujo - O que você pode receber):
\`\`\`json
{
  "id": "174:691",
  "name": "Group 6",
  "type": "GROUP",
  "width": 1920,
  "height": 1304.449951171875,
  "x": 0,
  "y": 1320,
  "visible": true,
  "children": [
    {
      "id": "172:667",
      "name": "Group 5",
      "type": "GROUP",
      "children": [
        {
          "id": "169:123",
          "name": "Frame 5",
          "type": "FRAME",
          "layoutMode": "NONE",
          "children": [
            {
              "id": "1:26",
              "name": "Group 1",
              "type": "GROUP",
              "children": [
                {
                  "id": "1:27",
                  "name": "Section",
                  "type": "FRAME",
                  "layoutMode": "NONE",
                  "children": [
                    {
                      "id": "1:33",
                      "name": "Heading 2",
                      "type": "TEXT",
                      "characters": "O que é a Harmonização\\nIntima Masculina ?",
                      "fontSize": 40
                    },
                    {
                      "id": "1:34",
                      "name": "Description",
                      "type": "TEXT",
                      "characters": "A harmonização íntima masculina é um procedimento estético...",
                      "fontSize": 20
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`

DEPOIS (Layout Otimizado - O que você deve gerar):
\`\`\`json
{
  "id": "root-frame",
  "name": "Desktop - Homepage Optimized",
  "type": "FRAME",
  "layoutMode": "VERTICAL",
  "primaryAxisSizingMode": "AUTO",
  "counterAxisSizingMode": "FIXED",
  "children": [
    {
      "id": "section-hero",
      "name": "c:container - Hero Section",
      "type": "FRAME",
      "layoutMode": "HORIZONTAL",
      "primaryAxisSizingMode": "FIXED",
      "counterAxisSizingMode": "AUTO",
      "children": [
        {
          "id": "hero-content-col",
          "name": "c:inner - Left Content",
          "type": "FRAME",
          "layoutMode": "VERTICAL",
          "children": [
            {
              "id": "hero-heading",
              "name": "w:heading - Title",
              "type": "TEXT",
              "characters": "O que é a Harmonização\\nIntima Masculina?",
              "fontSize": 48,
              "layoutSizingHorizontal": "FILL"
            },
            {
              "id": "hero-text",
              "name": "w:text-editor - Description",
              "type": "TEXT",
              "characters": "A harmonização íntima masculina é um procedimento estético...",
              "fontSize": 18,
              "layoutSizingHorizontal": "FILL"
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`
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

// ==================== PIPELINE PROMPT (STRICT SCHEMA) ====================

export const PIPELINE_GENERATION_PROMPT = `
Você é um assistente especializado em organização de árvores de layout para Elementor.

Receberá um JSON contendo nodes extraídos do Figma, já com:
- nome do node
- tipo
- fills
- textos
- children
- estilos básicos
- proporções
- dimensões

Sua única tarefa é:
→ ORGANIZAR esses nodes em um schema intermediário válido.

NÃO CLASSIFIQUE widgets visualmente.
NÃO ignore nodes.
NÃO descarte children.
NÃO adivinhe a intenção do design.

Use APENAS a estrutura da árvore recebida.

=======================
OUTPUT OBRIGATÓRIO
=======================

Retorne um JSON no seguinte formato:

{
  "page": {
    "title": "<nome do frame raiz>",
    "tokens": {
      "primaryColor": "#000000",
      "secondaryColor": "#000000"
    }
  },
  "sections": [ ... ]
}

Cada seção é:

{
  "id": "string",
  "type": "custom",
  "width": "full" ou "boxed",
  "background": {},
  "columns": [
    {
      "span": 12,
      "widgets": [ ... ]
    }
  ]
}

Cada widget é:

{
  "type": "heading | text | image | button | icon | custom",
  "content": "texto ou url ou null",
  "imageId": "id da imagem se houver",
  "styles": { opcional }
}

SEM DECISÕES VISUAIS.
SEM HEURÍSTICAS COMPLEXAS.

=======================
REGRAS CRÍTICAS
=======================

1. NUNCA ignore um node com texto.  
2. NUNCA ignore imagens.  
3. Se não souber classificar → type = "custom".  
4. Column sempre começa com span 12.  
   (Meu compilador calcula spans depois.)
5. Cada child do frame vira um widget.  
6. NUNCA invente estilos.  
7. NUNCA agrupe nodes diferentes em um widget único.  
8. NUNCA tente identificar imageBox/iconBox aqui.  
   (Isso é feito no estágio de otimização.)

=======================
META
=======================

Sua função é: organizar, não interpretar.
`;
