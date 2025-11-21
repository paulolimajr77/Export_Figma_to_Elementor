# Estrutura HTML do Widget Image Box do Elementor

## Índice
1. [Introdução](#introdução)
2. [Estrutura HTML Básica](#estrutura-html-basica)
3. [Componentes Principais](#componentes-principais)
4. [Estrutura Completa com Exemplos](#estrutura-completa)
5. [CSS Classes](#css-classes)
6. [Variações de Posição](#variacoes-posicao)
7. [Exemplos Práticos](#exemplos-praticos)
8. [Seletores CSS](#seletores-css)

---

## Introdução {#introdução}

O widget **Image Box** do Elementor combina uma imagem com texto (título e descrição) de forma criativa. É um componente versátil usado para:

- Seções de características/serviços
- Apresentação de membros da equipe
- Galeria de eventos
- Depoimentos com fotos
- Boxes de produtos

**Tipo de Widget:** `image-box`  
**Classe Principal:** `.elementor-image-box`  
**Estrutura:** Imagem + Título + Descrição (opcional)

---

## Estrutura HTML Básica {#estrutura-html-basica}

### Estrutura Padrão

```html
<div class="elementor-widget-image-box elementor-widget">
  <div class="elementor-widget-container">
    <div class="elementor-image-box-wrapper">
      
      <!-- Imagem -->
      <figure class="elementor-image-box-img">
        <img 
          src="https://exemplo.com/imagem.jpg" 
          alt="Descrição da Imagem"
          title="Título da Imagem"
          class="attachment-full size-full"
          width="300"
          height="300"
        />
      </figure>
      
      <!-- Conteúdo (Texto) -->
      <div class="elementor-image-box-content">
        <!-- Título -->
        <h3 class="elementor-image-box-title">
          <a href="https://exemplo.com/pagina">Título da Caixa</a>
        </h3>
        
        <!-- Descrição -->
        <p class="elementor-image-box-description">
          Esta é a descrição do image box.
        </p>
      </div>
      
    </div>
  </div>
</div>
```

---

## Componentes Principais {#componentes-principais}

### 1. Wrapper Externo (.elementor-widget-image-box)

```html
<div class="elementor-widget-image-box elementor-widget">
  <!-- Conteúdo do widget -->
</div>
```

**Classes:**
- `.elementor-widget-image-box` - Classe específica do widget
- `.elementor-widget` - Classe padrão para todos os widgets

### 2. Container do Widget (.elementor-widget-container)

```html
<div class="elementor-widget-container">
  <!-- Conteúdo renderizado -->
</div>
```

**Responsável por:** Gerenciar padding e layout interno do widget

### 3. Wrapper do Image Box (.elementor-image-box-wrapper)

```html
<div class="elementor-image-box-wrapper">
  <!-- Imagem e conteúdo -->
</div>
```

**Classes Adicionais Possíveis:**
- `.elementor-image-box-wrapper.image-position-left`
- `.elementor-image-box-wrapper.image-position-top`
- `.elementor-image-box-wrapper.image-position-right`

### 4. Figura da Imagem (.elementor-image-box-img)

```html
<figure class="elementor-image-box-img">
  <img 
    src="URL_IMAGEM"
    alt="Texto ALT"
    title="Título"
    class="attachment-full size-full"
    width="300"
    height="300"
  />
</figure>
```

**Elementos:**
- `<figure>` - Elemento semântico para imagem
- `<img>` - Tag de imagem
- `width` e `height` - Atributos de dimensão
- `alt` - Texto alternativo (acessibilidade)
- `title` - Título (hover)

### 5. Conteúdo (.elementor-image-box-content)

```html
<div class="elementor-image-box-content">
  <!-- Título e descrição -->
</div>
```

### 6. Título (.elementor-image-box-title)

```html
<h3 class="elementor-image-box-title">
  <a href="https://exemplo.com">Título Clicável</a>
</h3>
```

**Nota:** Se tiver link, o título fica envolvido em `<a>`

**Tag HTML Personalizável:**
- `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- `div`, `span`, `p`

### 7. Descrição (.elementor-image-box-description)

```html
<p class="elementor-image-box-description">
  Texto da descrição aqui.
</p>
```

---

## Estrutura Completa com Exemplos {#estrutura-completa}

### Exemplo 1: Image Box Simples (Sem Link)

```html
<div class="elementor-widget-image-box elementor-widget">
  <div class="elementor-widget-container">
    <div class="elementor-image-box-wrapper image-position-top">
      
      <figure class="elementor-image-box-img">
        <img 
          src="/wp-content/uploads/2025/11/servico.jpg" 
          alt="Serviço de Desenvolvimento"
          class="attachment-full size-full"
          width="400"
          height="300"
          loading="lazy"
        />
      </figure>
      
      <div class="elementor-image-box-content">
        <h3 class="elementor-image-box-title">
          Desenvolvimento Web
        </h3>
        <p class="elementor-image-box-description">
          Criamos websites modernos e responsivos para seu negócio.
        </p>
      </div>
      
    </div>
  </div>
</div>
```

### Exemplo 2: Image Box com Link

```html
<div class="elementor-widget-image-box elementor-widget">
  <div class="elementor-widget-container">
    <div class="elementor-image-box-wrapper image-position-top">
      
      <figure class="elementor-image-box-img">
        <img 
          src="/wp-content/uploads/2025/11/servico.jpg" 
          alt="Serviço de Design"
          class="attachment-full size-full"
          width="400"
          height="300"
        />
      </figure>
      
      <div class="elementor-image-box-content">
        <h2 class="elementor-image-box-title">
          <a href="https://exemplo.com/servicos/design" rel="nofollow">
            Design Gráfico
          </a>
        </h2>
        <p class="elementor-image-box-description">
          Designs criativos que capturam a essência da sua marca.
        </p>
      </div>
      
    </div>
  </div>
</div>
```

### Exemplo 3: Image Box Posição Esquerda

```html
<div class="elementor-widget-image-box elementor-widget">
  <div class="elementor-widget-container">
    <div class="elementor-image-box-wrapper image-position-left">
      
      <figure class="elementor-image-box-img">
        <img 
          src="/wp-content/uploads/2025/11/team-member.jpg" 
          alt="João Silva"
          class="attachment-full size-full"
          width="200"
          height="200"
        />
      </figure>
      
      <div class="elementor-image-box-content">
        <h3 class="elementor-image-box-title">
          João Silva
        </h3>
        <p class="elementor-image-box-description">
          Designer e desenvolvedor com 10 anos de experiência em web.
        </p>
      </div>
      
    </div>
  </div>
</div>
```

### Exemplo 4: Image Box Posição Direita

```html
<div class="elementor-widget-image-box elementor-widget">
  <div class="elementor-widget-container">
    <div class="elementor-image-box-wrapper image-position-right">
      
      <figure class="elementor-image-box-img">
        <img 
          src="/wp-content/uploads/2025/11/product.jpg" 
          alt="Produto Premium"
          class="attachment-full size-full"
          width="300"
          height="300"
        />
      </figure>
      
      <div class="elementor-image-box-content">
        <h3 class="elementor-image-box-title">
          <a href="https://exemplo.com/produto">Produto Premium</a>
        </h3>
        <p class="elementor-image-box-description">
          Qualidade superior com preço acessível.
        </p>
      </div>
      
    </div>
  </div>
</div>
```

---

## CSS Classes {#css-classes}

### Classes Principais

| Classe | Elemento | Função |
|--------|----------|--------|
| `.elementor-widget-image-box` | Div externo | Identifica o widget |
| `.elementor-widget` | Div externo | Classe genérica de widget |
| `.elementor-widget-container` | Div | Container do widget |
| `.elementor-image-box-wrapper` | Div | Wrapper principal |
| `.elementor-image-box-img` | Figure | Container da imagem |
| `.elementor-image-box-content` | Div | Container do conteúdo |
| `.elementor-image-box-title` | H1-H6 | Título |
| `.elementor-image-box-description` | P | Descrição |

### Classes de Posição da Imagem

```html
<!-- Imagem no topo -->
<div class="elementor-image-box-wrapper image-position-top">

<!-- Imagem à esquerda -->
<div class="elementor-image-box-wrapper image-position-left">

<!-- Imagem à direita -->
<div class="elementor-image-box-wrapper image-position-right">
```

### Classes de Alinhamento

```html
<!-- Alinhado à esquerda -->
<div class="elementor-image-box-wrapper" style="text-align: left;">

<!-- Centralizado -->
<div class="elementor-image-box-wrapper" style="text-align: center;">

<!-- Alinhado à direita -->
<div class="elementor-image-box-wrapper" style="text-align: right;">

<!-- Justificado -->
<div class="elementor-image-box-wrapper" style="text-align: justify;">
```

---

## Variações de Posição {#variacoes-posicao}

### Posição: TOP (Padrão)

```
┌─────────────────────┐
│      IMAGEM        │
│    (400 x 300)     │
├─────────────────────┤
│   Título Aqui       │
├─────────────────────┤
│ Descrição aqui...   │
└─────────────────────┘
```

**HTML:**
```html
<div class="elementor-image-box-wrapper image-position-top">
  <figure class="elementor-image-box-img">...</figure>
  <div class="elementor-image-box-content">...</div>
</div>
```

### Posição: LEFT

```
┌──────────────────────────────────┐
│ IMAGEM │ Título                  │
│ 200x200│                          │
│        │ Descrição aqui...        │
└──────────────────────────────────┘
```

**HTML:**
```html
<div class="elementor-image-box-wrapper image-position-left">
  <figure class="elementor-image-box-img" style="float: left;"></figure>
  <div class="elementor-image-box-content"></div>
</div>
```

### Posição: RIGHT

```
┌──────────────────────────────────┐
│ Título              │ IMAGEM      │
│                     │ 200x200     │
│ Descrição aqui...   │             │
└──────────────────────────────────┘
```

**HTML:**
```html
<div class="elementor-image-box-wrapper image-position-right">
  <figure class="elementor-image-box-img" style="float: right;"></figure>
  <div class="elementor-image-box-content"></div>
</div>
```

---

## Exemplos Práticos {#exemplos-praticos}

### Exemplo 1: Seção de Serviços

```html
<div class="elementor-image-box-wrapper image-position-top">
  <figure class="elementor-image-box-img">
    <img 
      src="/uploads/2025/11/dev-icon.png" 
      alt="Desenvolvimento"
      width="150" height="150"
    />
  </figure>
  <div class="elementor-image-box-content">
    <h3 class="elementor-image-box-title">
      <a href="/servicos/desenvolvimento">Desenvolvimento Web</a>
    </h3>
    <p class="elementor-image-box-description">
      Soluções web robustas e escaláveis para sua empresa crescer.
    </p>
  </div>
</div>
```

### Exemplo 2: Equipe

```html
<div class="elementor-image-box-wrapper image-position-top">
  <figure class="elementor-image-box-img">
    <img 
      src="/uploads/2025/11/johndoe.jpg" 
      alt="John Doe - CEO"
      width="250" height="250"
    />
  </figure>
  <div class="elementor-image-box-content">
    <h3 class="elementor-image-box-title">John Doe</h3>
    <p class="elementor-image-box-description">
      CEO e Fundador. Especialista em transformação digital com 15 anos no mercado.
    </p>
  </div>
</div>
```

### Exemplo 3: Depoimento com Foto

```html
<div class="elementor-image-box-wrapper image-position-left">
  <figure class="elementor-image-box-img">
    <img 
      src="/uploads/2025/11/customer.jpg" 
      alt="Maria Silva"
      width="120" height="120"
    />
  </figure>
  <div class="elementor-image-box-content">
    <h3 class="elementor-image-box-title">Maria Silva</h3>
    <p class="elementor-image-box-description">
      "O trabalho da equipe foi excelente! Aumentamos nossas vendas em 40% em 3 meses."
    </p>
  </div>
</div>
```

### Exemplo 4: Produto com Link

```html
<div class="elementor-image-box-wrapper image-position-top">
  <figure class="elementor-image-box-img">
    <img 
      src="/uploads/2025/11/produto-premium.jpg" 
      alt="Produto Premium"
      width="300" height="300"
    />
  </figure>
  <div class="elementor-image-box-content">
    <h3 class="elementor-image-box-title">
      <a href="/produtos/premium">Plano Premium</a>
    </h3>
    <p class="elementor-image-box-description">
      Acesso completo a todos os recursos por apenas R$ 99/mês. Cancele quando quiser.
    </p>
  </div>
</div>
```

---

## Seletores CSS {#seletores-css}

### Estilizar Título

```css
/* Título padrão */
.elementor-image-box-title {
  color: #333;
  font-size: 24px;
  margin: 15px 0 10px;
}

/* Link dentro do título */
.elementor-image-box-title a {
  color: #3085fe;
  text-decoration: none;
}

.elementor-image-box-title a:hover {
  color: #1e5dc9;
  text-decoration: underline;
}
```

### Estilizar Descrição

```css
.elementor-image-box-description {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
  margin: 10px 0;
}
```

### Estilizar Imagem

```css
/* Imagem padrão */
.elementor-image-box-img img {
  width: 100%;
  height: auto;
  display: block;
}

/* Efeito hover */
.elementor-image-box-wrapper:hover .elementor-image-box-img img {
  transform: scale(1.05);
  transition: all 0.3s ease;
}
```

### Fazer Toda a Caixa Clicável

```css
/* Pseudo-elemento para expandir área clicável */
.elementor-image-box-wrapper {
  position: relative;
}

.elementor-image-box-title a::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
```

### Estilizar Wrapper

```css
/* Wrapper padrão */
.elementor-image-box-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Posição esquerda */
.elementor-image-box-wrapper.image-position-left {
  flex-direction: row;
}

/* Posição direita */
.elementor-image-box-wrapper.image-position-right {
  flex-direction: row-reverse;
}
```

### Responsive

```css
/* Desktop */
@media (min-width: 1024px) {
  .elementor-image-box-wrapper.image-position-left {
    flex-direction: row;
  }
}

/* Tablet */
@media (max-width: 1023px) and (min-width: 768px) {
  .elementor-image-box-img {
    width: 50%;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .elementor-image-box-wrapper {
    flex-direction: column !important;
  }
  
  .elementor-image-box-img {
    width: 100%;
    margin: 0 auto;
  }
  
  .elementor-image-box-img img {
    max-width: 300px;
  }
}
```

---

## Atributos Data

### Data Attributes do Widget

O Elementor adiciona data attributes para identificar tipos de widget:

```html
<div 
  class="elementor-widget elementor-widget-image-box"
  data-element_type="widget"
  data-widget_type="image-box.default"
>
  ...
</div>
```

---

## Settings JSON

### Estrutura JSON do Image Box

```json
{
  "id": "image_box_001",
  "elType": "widget",
  "widgetType": "image-box",
  "isInner": false,
  "settings": {
    "image": {
      "url": "https://exemplo.com/imagem.jpg",
      "id": 123,
      "size": "full",
      "alt": "Descrição da imagem",
      "source": "library"
    },
    "image_size": "full",
    "image_custom_dimension": {
      "width": "300",
      "height": "300"
    },
    "title_text": "Título da Caixa",
    "description_text": "Descrição aqui",
    "link": {
      "url": "https://exemplo.com",
      "is_external": false,
      "nofollow": false
    },
    "title_html_tag": "h3",
    "image_position": "top",
    "alignment": "center",
    "image_spacing": {
      "unit": "px",
      "size": 15
    },
    "content_spacing": {
      "unit": "px",
      "size": 10
    },
    "image_width": {
      "unit": "%",
      "size": 100
    }
  },
  "elements": []
}
```

---

## Notas Importantes

1. **Responsividade:** Em mobile, a imagem fica centralizada independente da posição
2. **Link:** Se houver link, o título fica envolvido em `<a>`
3. **Alt Text:** Importante para SEO e acessibilidade
4. **Tag HTML:** Personalizável (h1-h6, div, span, p)
5. **CSS Classes:** Use para customização com CSS
6. **Data Attributes:** Úteis para seleção com JavaScript
7. **Loading Lazy:** Imagens usam `loading="lazy"` por padrão

---

## Referência Rápida

```html
<!-- ESTRUTURA MÍNIMA -->
<div class="elementor-widget-image-box elementor-widget">
  <div class="elementor-widget-container">
    <div class="elementor-image-box-wrapper">
      <figure class="elementor-image-box-img">
        <img src="imagem.jpg" alt="Alt text" />
      </figure>
      <div class="elementor-image-box-content">
        <h3 class="elementor-image-box-title">Título</h3>
        <p class="elementor-image-box-description">Descrição</p>
      </div>
    </div>
  </div>
</div>
```

