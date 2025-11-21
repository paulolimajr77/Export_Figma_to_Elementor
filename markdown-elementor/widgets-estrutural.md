
# Estruturas de Widgets para Elementor, Elementor Pro, WordPress, WooCommerce

## Widgets Nativos do Elementor (Gratuito)

### Caixa de Imagem (Image Box)
```html
<div class="elementor-image-box">
  <figure class="elementor-image-box-img">
    <img src="URL-da-imagem" alt="Descrição">
  </figure>
  <div class="elementor-image-box-content">
    <h3 class="elementor-image-box-title">Título da Caixa</h3>
    <p class="elementor-image-box-description">Descrição da caixa de imagem.</p>
  </div>
</div>
```

### Caixa de Ícone (Icon Box)
```html
<div class="elementor-icon-box">
  <span class="elementor-icon">
    <i class="fas fa-star"></i>
  </span>
  <div class="elementor-icon-box-content">
    <h3 class="elementor-icon-box-title">Título do Ícone</h3>
    <p class="elementor-icon-box-description">Descrição sobre o ícone.</p>
  </div>
</div>
```

### Imagem
```html
<img class="elementor-widget-image" src="URL-da-imagem" alt="Descrição">
```

### Vídeo
```html
<div class="elementor-widget-video">
  <iframe src="URL-do-video"></iframe>
</div>
```

### Botão
```html
<a class="elementor-button" href="url-destino">
  <span class="elementor-button-content-wrapper">
    <span class="elementor-button-text">Texto do Botão</span>
  </span>
</a>
```

### Divider (Divisor)
```html
<hr class="elementor-divider">
```

### Espaçador
```html
<div class="elementor-spacer"></div>
```

### Título (Heading)
```html
<h2 class="elementor-heading-title">Título</h2>
```

### Editor de Texto (Text Editor)
```html
<div class="elementor-text-editor">
  <p>Texto livre e formatado.</p>
</div>
```

### Imagem em Galeria (Image Gallery)
```html
<div class="elementor-image-gallery">
  <img src="img1.jpg">
  <img src="img2.jpg">
</div>
```

### Lista de Ícones (Icon List)
```html
<ul class="elementor-icon-list">
  <li class="elementor-icon-list-item">
    <span class="elementor-icon-list-icon"><i class="fas fa-check"></i></span>
    <span class="elementor-icon-list-text">Item 1</span>
  </li>
</ul>
```

### Alerta
```html
<div class="elementor-alert">
  <span class="elementor-alert-title">Atenção!</span>
  <div class="elementor-alert-description">Mensagem informativa.</div>
</div>
```

### Música (SoundCloud)
```html
<iframe width="400" height="100" src="https://soundcloud.com"></iframe>
```

### Google Maps
```html
<div class="elementor-google-map">
  <iframe src="URL-do-mapa"></iframe>
</div>
```

### Abas (Tabs)
```html
<div class="elementor-tabs">
  <div class="elementor-tabs-wrapper">
    <div class="elementor-tab-title">Tab 1</div>
    <div class="elementor-tab-title">Tab 2</div>
  </div>
  <div class="elementor-tabs-content-wrapper">
    <div class="elementor-tab-content">Conteúdo 1</div>
    <div class="elementor-tab-content">Conteúdo 2</div>
  </div>
</div>
```

### Acordeão (Accordion)
```html
<div class="elementor-accordion">
  <div class="elementor-accordion-item">
    <div class="elementor-accordion-title">Título do Acordeão</div>
    <div class="elementor-accordion-content">Conteúdo do Acordeão</div>
  </div>
</div>
```

### Barra de Progresso (Progress Bar)
```html
<div class="elementor-progress-bar">
  <div class="elementor-progress-bar-fill" style="width:70%"></div>
</div>
```

### Contador (Counter)
```html
<div class="elementor-counter">
  <span class="elementor-counter-number">100</span>
  <span class="elementor-counter-title">Título</span>
</div>
```

### Áreas de HTML Customizado
```html
<div class="elementor-widget-html">
  <!-- Seu código HTML personalizado aqui -->
</div>
```

### Shortcode
```html
<div class="elementor-shortcode">
  [seu_shortcode]
</div>
```

## Widgets do Elementor Pro (Adicionais)

### Formulário (Form)
```html
<form class="elementor-form">
  <input type="text" placeholder="Nome">
  <input type="email" placeholder="Email">
  <textarea placeholder="Mensagem"></textarea>
  <button type="submit">Enviar</button>
</form>
```

### Posts (Grade de Posts/Artigos)
```html
<div class="elementor-posts">
  <article class="elementor-post">
    <a href="url-do-post">
      <img src="thumb.jpg" alt="">
      <h2>Título do Post</h2>
      <p>Resumo...</p>
    </a>
  </article>
</div>
```

### Slides
```html
<div class="elementor-slides">
  <div class="elementor-slide">Conteúdo 1</div>
  <div class="elementor-slide">Conteúdo 2</div>
</div>
```

### Testemunhos (Testimonials)
```html
<div class="elementor-testimonial">
  <blockquote>Opinião do cliente</blockquote>
  <cite>Nome do Cliente</cite>
</div>
```

### Portfólio
```html
<div class="elementor-portfolio">
  <div class="elementor-portfolio-item">
    <img src="portfolio.jpg" alt="Projeto">
    <span>Nome do Projeto</span>
  </div>
</div>
```

### Lista de Preços
```html
<ul class="elementor-price-list">
  <li><span class="elementor-price-list-item">Serviço</span> <span class="elementor-price">R$ 100</span></li>
</ul>
```

### Tabela de Preços
```html
<table class="elementor-price-table">
  <thead><tr><th>Plano</th><th>Preço</th></tr></thead>
  <tbody><tr><td>Basic</td><td>R$ 50</td></tr></tbody>
</table>
```

### Call to Action
```html
<div class="elementor-cta">
  <h2>Chamada</h2>
  <button>Saiba Mais</button>
</div>
```

### Flip Box
```html
<div class="elementor-flip-box">
  <div class="elementor-flip-box-front">Frente</div>
  <div class="elementor-flip-box-back">Verso</div>
</div>
```

### Carrossel de Mídia/Site
```html
<div class="elementor-media-carousel">
  <div class="elementor-carousel-item">Item 1</div>
  <div class="elementor-carousel-item">Item 2</div>
</div>
```

### Formulário de Login
```html
<form class="elementor-login">
  <input type="text" placeholder="Usuário">
  <input type="password" placeholder="Senha">
  <button type="submit">Entrar</button>
</form>
```

### Menu Personalizado
```html
<nav class="elementor-nav-menu">
  <ul>
    <li><a href="#">Início</a></li>
    <li><a href="#">Sobre</a></li>
  </ul>
</nav>
```

### Busca Dinâmica
```html
<form class="elementor-search">
  <input type="search" placeholder="Buscar...">
  <button type="submit">Buscar</button>
</form>
```

### Lista de Conteúdos Dinâmica
```html
<ul class="elementor-dynamic-content">
  <li>Conteúdo 1</li>
  <li>Conteúdo 2</li>
</ul>
```

### Breadcrumbs
```html
<nav class="elementor-breadcrumbs">
  <a href="#">Home</a> &gt; <a href="#">Página</a>
</nav>
```

### Widgets para WooCommerce
```html
<!-- Exemplo: Adicionar ao Carrinho -->
<button class="woocommerce-add-to-cart">Adicionar ao Carrinho</button>
<!-- Grid de Produtos -->
<ul class="products">
  <li class="product">
    <a href="url-produto">
      <img src="imagem.jpg" alt="">
      <h2>Nome do Produto</h2>
      <span class="price">R$ 59,00</span>
    </a>
  </li>
</ul>
<!-- Produtos Relacionados -->
<div class="related-products">
  ...
</div>
<!-- Filtros -->
<form class="woocommerce-product-filter">
  ...
</form>
```

### Popup
```html
<div class="elementor-popup">
  <h2>Título Popup</h2>
  <p>Conteúdo popup</p>
</div>
```

## Widgets Nativos do WordPress

### Arquivos
```html
<aside class="widget widget_archives">
  <h2 class="widget-title">Arquivos</h2>
  <ul>
    <li><a href="#">Novembro 2025</a></li>
  </ul>
</aside>
```

### Agenda
```html
<aside class="widget widget_calendar">
  <table>
    <tr><td>Seg</td><td>Ter</td></tr>
  </table>
</aside>
```

### Áudio
```html
<audio controls src="audio.mp3"></audio>
```

### Calendário
```html
<aside class="widget widget_calendar">
  <table></table>
</aside>
```

### Categorias
```html
<aside class="widget widget_categories">
  <ul>
    <li><a href="#">Categoria</a></li>
  </ul>
</aside>
```

### Galeria
```html
<div class="gallery">
  <img src="img1.jpg"><img src="img2.jpg">
</div>
```

### Imagem
```html
<img src="img.jpg" alt="Imagem">
```

### Menu Personalizado
```html
<nav class="widget_nav_menu">
  <ul>
    <li><a href="#">Home</a></li>
  </ul>
</nav>
```

### Meta
```html
<aside class="widget widget_meta">
  <ul>
    <li><a href="#">Login</a></li>
  </ul>
</aside>
```

### Página
```html
<aside class="widget widget_pages">
  <ul>
    <li><a href="#">Página 1</a></li>
  </ul>
</aside>
```

### Pesquisar
```html
<form class="search-form">
  <input type="search">
  <button type="submit">Buscar</button>
</form>
```

### Comentários Recentes
```html
<aside class="widget widget_recent_comments">
  <ul>
    <li>Comentário</li>
  </ul>
</aside>
```

### Posts Recentes
```html
<aside class="widget widget_recent_entries">
  <ul>
    <li><a href="#">Título do Post</a></li>
  </ul>
</aside>
```

### RSS
```html
<aside class="widget widget_rss">
  <ul>
    <li>Feed</li>
  </ul>
</aside>
```

### Lista de Tags
```html
<div class="tagcloud">
  <a href="#">tag1</a>
  <a href="#">tag2</a>
</div>
```

### Vídeo
```html
<video controls src="video.mp4"></video>
```

## Widgets Nativos do WooCommerce

### Carrinho
```html
<div class="widget_shopping_cart_content">
  <ul class="woocommerce-mini-cart">
    <li>Produto</li>
  </ul>
</div>
```

### Filtros ativos de produto
```html
<div class="widget_layered_nav_filters">
  <ul>
    <li>Filtro</li>
  </ul>
</div>
```

### Filtro por Atributo
```html
<div class="widget_layered_nav">
  <ul>
    <li>Atributo</li>
  </ul>
</div>
```

### Filtro por Preço
```html
<div class="widget_price_filter">
  <input type="range">
</div>
```

### Filtro por Avaliação
```html
<div class="widget_rating_filter">
  <ul>
    <li>Estrelas</li>
  </ul>
</div>
```

### Lista/Categorias de Produto
```html
<ul class="product-categories">
  <li>Categoria</li>
</ul>
```

### Produtos em Destaque
```html
<ul class="product_list_widget">
  <li>Produto Destaque</li>
</ul>
```

### Produtos em Promoção
```html
<ul class="product_list_widget">
  <li>Produto em Promoção</li>
</ul>
```

### Produtos Recentes/Populares/Mais Vendidos
```html
<ul class="product_list_widget">
  <li>Produto</li>
</ul>
```

### Avaliações recentes de produto
```html
<ul class="woocommerce-widget-reviews">
  <li>Avaliação</li>
</ul>
```

### Nuvem de Tags do Produto
```html
<div class="woocommerce-product-tag-cloud">
  <a href="#">tag-produto</a>
</div>
```

### Pesquisa de Produtos
```html
<form class="woocommerce-product-search">
  <input type="search">
  <button type="submit">Buscar</button>
</form>
```
