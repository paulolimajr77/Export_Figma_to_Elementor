# Mapeamento de Estrutura: Figma ↔ Elementor WordPress

Documento de correlação entre hierarquia simplificada do Figma e estrutura HTML renderizada no Elementor.

---

## ESTRUTURA BASE - PADRÃO DE MAPEAMENTO

### Figma (Estrutura Simplificada)
```
Frame/Component
├── Camada Visual 1 (ex: ícone)
├── Camada Visual 2 (ex: texto)
└── Camada Visual 3 (ex: background)
```

### Elementor (HTML Renderizado)
```html
<div class="elementor-widget elementor-widget-[tipo]">
  <div class="elementor-widget-container">
    [Conteúdo Visual Renderizado]
  </div>
</div>
```

---

## WIDGETS BÁSICOS (ELEMENTOR FREE)

### w:container

**Figma Structure:**
```
Container (Frame with Auto Layout)
├── Background Fill
├── Rows (auto layout vertical)
└── Children Items
```

**Elementor HTML:**
```html
<div class="elementor-container">
  <div class="elementor-row">
    <!-- Inner content -->
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame com Auto Layout | .elementor-container | Wrapper raiz |
| Padding/Spacing interno | Padding classes | Espaçamento |
| Filhos (children) | .elementor-row | Filhos renderizados |

---

### w:inner-container

**Figma Structure:**
```
Inner Container (Frame)
├── Background
└── Content Items
```

**Elementor HTML:**
```html
<div class="elementor-inner-container">
  <!-- Child elements -->
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame aninhado | .elementor-inner-container | Container interno |
| Background/Fill | CSS background | Cor de fundo |
| Filhos | Elementos internos | Conteúdo renderizado |

---

### w:heading

**Figma Structure:**
```
Heading Group
├── Text (H1, H2, H3, etc)
├── Font: Inter, 24px, Bold
├── Color: #1F2121
└── Line Height: 1.2
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-heading">
  <div class="elementor-widget-container">
    <h1 class="elementor-heading-title elementor-size-default">
      Heading Text
    </h1>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Text Layer com H1/H2 tag | `<h1>` `.elementor-heading-title` | Título semântico |
| Font name, size, weight | CSS via .elementor-size-* | Estilo tipográfico |
| Color | CSS fill color | Cor do texto |
| Letter spacing | CSS letter-spacing | Espaçamento de letras |

---

### w:text-editor

**Figma Structure:**
```
Text Editor Group
├── Text Content
├── Paragraph (Body)
├── Font: Inter, 14px, Regular
├── Color: #626C7C
└── Line Height: 1.5
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-text-editor">
  <div class="elementor-widget-container">
    <div class="elementor-text-editor elementor-clearfix">
      <p>Text content here</p>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Text Frame | `<p>` | Parágrafo |
| Multi-line text | .elementor-text-editor | Container de texto |
| Font properties | CSS classes | Estilo tipográfico |
| Alignment | text-align | Alinhamento |

---

### w:image

**Figma Structure:**
```
Image Component
├── Image (Asset)
├── Width: 320
├── Height: auto
├── Border Radius: 4
└── Shadow: soft
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-image">
  <div class="elementor-widget-container">
    <img src="image-url.jpg" class="attachment-full" alt="Image Alt Text">
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Image Asset Layer | `<img src="">` | Tag de imagem |
| Dimensões (width/height) | CSS width/height | Tamanho da imagem |
| Border Radius | border-radius | Bordas arredondadas |
| Shadow/Effects | box-shadow | Sombra CSS |

---

### w:video

**Figma Structure:**
```
Video Component
├── Placeholder Video
├── Width: 640
├── Height: 360
├── Border Radius: 8
└── Background: dark
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-video">
  <div class="elementor-widget-container">
    <div class="elementor-video-container">
      <iframe src="video-url" frameborder="0" allow="autoplay"></iframe>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Video Placeholder | .elementor-video-container | Container de vídeo |
| Dimensões | iframe width/height | Tamanho do vídeo |
| URL de vídeo | src attribute | Fonte do vídeo |
| Border radius | CSS border-radius | Bordas |

---

### w:button

**Figma Structure:**
```
Button Component (Frame Auto Layout)
├── Background Fill (#208592)
├── Text ("Click here")
├── Font: Inter, 16px, Bold
├── Padding: 12px 24px
├── Border Radius: 8px
└── Shadow: small
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-button">
  <div class="elementor-widget-container">
    <div class="elementor-button-wrapper">
      <a href="#" class="elementor-button elementor-button-link elementor-size-md">
        <span class="elementor-button-content-wrapper">
          <span class="elementor-button-text">Button Text</span>
        </span>
      </a>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame Auto Layout | .elementor-button-wrapper | Wrapper botão |
| Background Fill | .elementor-button (background-color) | Cor de fundo |
| Text | .elementor-button-text | Texto do botão |
| Padding | Inline padding | Espaçamento interno |
| Border Radius | border-radius | Bordas arredondadas |
| Font properties | .elementor-size-md | Classe de tamanho |

---

### w:divider

**Figma Structure:**
```
Divider Component
├── Line (Stroke)
├── Width: 100%
├── Height: 1px
├── Color: #A7A9A9
└── Margin: 16px 0
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-divider">
  <div class="elementor-widget-container">
    <div class="elementor-divider">
      <span class="elementor-divider-separator"></span>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Line/Stroke | .elementor-divider-separator | Linha divisória |
| Cor do stroke | border-color | Cor da linha |
| Altura | height (1px) | Espessura |
| Margin | margin-top/bottom | Espaçamento externo |

---

### w:icon

**Figma Structure:**
```
Icon Component
├── Icon SVG/Font Awesome
├── Size: 48px
├── Color: #1F2121
└── Alignment: center
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-icon">
  <div class="elementor-widget-container">
    <div class="elementor-icon-wrapper">
      <div class="elementor-icon">
        <i class="fas fa-star"></i>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Icon Component | `<i class="fas fa-...">` | Icon Font |
| Tamanho | font-size | Escala do ícone |
| Cor | color CSS | Cor do ícone |
| Alinhamento | text-align | Centralização |

---

### w:icon-box

**Figma Structure:**
```
Icon Box Component (Frame Auto Layout Horizontal)
├── Icon
│   ├── Icon SVG (48px)
│   └── Color: #1F2121
├── Content
│   ├── Title (Heading)
│   │   ├── Font: Inter, 18px, Bold
│   │   └── Color: #1F2121
│   ├── Description (Text)
│   │   ├── Font: Inter, 14px, Regular
│   │   └── Color: #626C7C
│   └── Spacing: 8px between
└── Padding: 16px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-icon-box">
  <div class="elementor-widget-container">
    <div class="elementor-icon-box-wrapper">
      <div class="elementor-icon-box-icon">
        <i class="fas fa-check"></i>
      </div>
      <div class="elementor-icon-box-content">
        <h3 class="elementor-icon-box-title">Title</h3>
        <p class="elementor-icon-box-description">Description</p>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame Auto Layout | .elementor-icon-box-wrapper | Container principal |
| Icon Layer | .elementor-icon-box-icon | Container do ícone |
| Icon SVG | `<i>` tag | Ícone renderizado |
| Title Text | .elementor-icon-box-title | Título |
| Description | .elementor-icon-box-description | Descrição |
| Spacing (item spacing) | gap CSS | Espaço entre ícone e texto |

---

### w:image-box

**Figma Structure:**
```
Image Box Component (Frame Auto Layout)
├── Image Container
│   ├── Image Asset
│   ├── Width: 240px
│   └── Height: 240px
├── Content Container
│   ├── Title
│   │   ├── Font: Inter, 18px, Bold
│   │   └── Color: #1F2121
│   ├── Description
│   │   ├── Font: Inter, 14px, Regular
│   │   └── Color: #626C7C
│   └── Spacing: 8px
└── Item Spacing: 12px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-image-box">
  <div class="elementor-widget-container">
    <div class="elementor-image-box-wrapper">
      <figure class="elementor-image-box-img">
        <img src="image-url.jpg" alt="Image">
      </figure>
      <div class="elementor-image-box-content">
        <h3 class="elementor-image-box-title">Title</h3>
        <p class="elementor-image-box-description">Description</p>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame Auto Layout | .elementor-image-box-wrapper | Wrapper principal |
| Image Container (Figure) | `<figure>` | Elemento semântico |
| Image Asset | `<img>` | Imagem renderizada |
| Title Text | .elementor-image-box-title | Título |
| Description | .elementor-image-box-description | Descrição |
| Item Spacing | gap CSS | Espaço vertical |

---

### w:star-rating

**Figma Structure:**
```
Star Rating Component
├── Stars (Icon List)
│   ├── Star Full (4x) - Color: #FFB84D
│   ├── Star Half (1x) - Color: #FFB84D
│   └── Star Empty (0x) - Color: #A7A9A9
└── Size: 24px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-star-rating">
  <div class="elementor-widget-container">
    <div class="elementor-star-rating">
      <i class="fas fa-star elementor-star-full"></i>
      <i class="fas fa-star elementor-star-full"></i>
      <i class="fas fa-star elementor-star-half"></i>
      <i class="fas fa-star elementor-star-empty"></i>
      <i class="fas fa-star elementor-star-empty"></i>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Star Icons | `<i>` tags | Ícones de estrela |
| Star Full | .elementor-star-full | Estrela preenchida |
| Star Half | .elementor-star-half | Estrela semi-preenchida |
| Star Empty | .elementor-star-empty | Estrela vazia |
| Tamanho | font-size | Tamanho das estrelas |
| Cor | color CSS | Cor das estrelas |

---

### w:counter

**Figma Structure:**
```
Counter Component (Frame Auto Layout Vertical)
├── Title
│   ├── Text: "100"
│   ├── Font: Inter, 32px, Bold
│   └── Color: #208592
├── Label
│   ├── Text: "Title"
│   ├── Font: Inter, 14px, Regular
│   └── Color: #626C7C
└── Item Spacing: 8px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-counter">
  <div class="elementor-widget-container">
    <div class="elementor-counter-box">
      <div class="elementor-counter-title">Title</div>
      <div class="elementor-counter-number-wrapper">
        <span class="elementor-counter-number" data-to-value="100">0</span>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame Auto Layout | .elementor-counter-box | Wrapper |
| Number Text | .elementor-counter-number | Número animado |
| Title/Label | .elementor-counter-title | Rótulo |
| data-to-value | Animação JS | Valor final |
| Font size (número) | .elementor-counter-number | Estilo |

---

### w:progress

**Figma Structure:**
```
Progress Component (Frame Auto Layout Vertical)
├── Title
│   ├── Text: "Progress Title"
│   ├── Font: Inter, 14px, Regular
│   └── Color: #626C7C
├── Bar Container
│   ├── Background: #E8EBEF
│   ├── Height: 8px
│   ├── Border Radius: 4px
│   └── Fill
│       ├── Background: #208592
│       ├── Width: 75%
│       └── Border Radius: 4px
└── Item Spacing: 8px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-progress">
  <div class="elementor-widget-container">
    <div class="elementor-progress-wrapper">
      <div class="elementor-progress-title">Progress Title</div>
      <div class="elementor-progress-bar">
        <div class="elementor-progress-fill" style="width: 75%;"></div>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame | .elementor-progress-wrapper | Wrapper |
| Title | .elementor-progress-title | Título |
| Bar Container | .elementor-progress-bar | Background bar |
| Fill (Rectangle) | .elementor-progress-fill | Barra preenchida |
| Width Fill | style="width: 75%" | Percentual de progresso |
| Height | CSS height | Altura da barra |

---

### w:tabs

**Figma Structure:**
```
Tabs Component (Frame Auto Layout Vertical)
├── Tab Headers (Frame Auto Layout Horizontal)
│   ├── Tab 1 (Button)
│   │   ├── Text: "Tab 1"
│   │   ├── Background: transparent (active) / light (inactive)
│   │   └── Border Bottom: 2px active
│   └── Tab 2 (Button)
│       ├── Text: "Tab 2"
│       └── Similar styling
├── Tab Content
│   ├── Tab 1 Content (visible)
│   │   └── Content 1
│   └── Tab 2 Content (hidden)
│       └── Content 2
└── Item Spacing: 0 (headers), 12px (content)
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-tabs">
  <div class="elementor-widget-container">
    <div class="elementor-tabs">
      <div class="elementor-tabs-wrapper">
        <div class="elementor-tab-title">Tab 1</div>
        <div class="elementor-tab-title">Tab 2</div>
      </div>
      <div class="elementor-tabs-content-wrapper">
        <div class="elementor-tab-content">Content 1</div>
        <div class="elementor-tab-content" style="display:none;">Content 2</div>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame Auto Layout | .elementor-tabs | Wrapper |
| Tab Headers | .elementor-tabs-wrapper | Container de abas |
| Tab Title | .elementor-tab-title | Botão de aba |
| Tab Content | .elementor-tab-content | Conteúdo da aba |
| Visibilidade | display: none | Controle via JS |

---

### w:accordion

**Figma Structure:**
```
Accordion Component (Frame Auto Layout Vertical)
├── Accordion Item 1
│   ├── Header (Frame Auto Layout Horizontal)
│   │   ├── Icon (chevron down - rotated when open)
│   │   ├── Title: "Accordion Item"
│   │   └── Padding: 12px 16px
│   ├── Divider (Line)
│   └── Body (hidden when closed)
│       └── Content text
└── Item Spacing: 0
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-accordion">
  <div class="elementor-widget-container">
    <div class="elementor-accordion">
      <div class="elementor-accordion-item">
        <h3 class="elementor-accordion-title">
          <span class="elementor-accordion-icon"></span>
          <span>Accordion Item</span>
        </h3>
        <div class="elementor-accordion-body">
          <div class="elementor-accordion-body-title">Content</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame Auto Layout | .elementor-accordion | Wrapper |
| Item Container | .elementor-accordion-item | Item individual |
| Header | .elementor-accordion-title | Cabeçalho clicável |
| Icon | .elementor-accordion-icon | Ícone de chevron |
| Body | .elementor-accordion-body | Conteúdo expandível |
| Divider | border-top | Linha separadora |

---

### w:toggle

**Figma Structure:**
```
Toggle Component (Frame Auto Layout Vertical)
├── Header (Frame Auto Layout Horizontal)
│   ├── Title: "Toggle Title"
│   ├── Font: Inter, 16px, Bold
│   └── Padding: 12px 16px
├── Divider (Line)
└── Body (hidden/visible toggle)
    └── Content text
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-toggle">
  <div class="elementor-widget-container">
    <div class="elementor-toggle">
      <div class="elementor-toggle-item">
        <h3 class="elementor-toggle-title">Toggle Title</h3>
        <div class="elementor-toggle-content">Toggle content here</div>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame | .elementor-toggle | Wrapper |
| Item | .elementor-toggle-item | Item toggle |
| Title | .elementor-toggle-title | Texto do toggle |
| Content | .elementor-toggle-content | Conteúdo expandível |

---

### w:alert

**Figma Structure:**
```
Alert Component (Frame Auto Layout Vertical)
├── Background Fill (color-coded: info, success, warning, error)
├── Border Left (4px)
├── Title
│   ├── Font: Inter, 16px, Bold
│   └── Color: contraste com fundo
├── Description
│   ├── Font: Inter, 14px, Regular
│   └── Color: contraste com fundo
├── Padding: 16px
└── Border Radius: 4px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-alert">
  <div class="elementor-widget-container">
    <div class="elementor-alert elementor-alert-type-info">
      <div class="elementor-alert-title">Alert Title</div>
      <div class="elementor-alert-description">Alert description</div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame | .elementor-alert | Container |
| Background Fill | .elementor-alert-type-* | Classe de tipo |
| Left Border | border-left | Indicador de tipo |
| Title | .elementor-alert-title | Título do alerta |
| Description | .elementor-alert-description | Descrição |

---

### w:social-icons

**Figma Structure:**
```
Social Icons Component (Frame Auto Layout Horizontal)
├── Icon 1 (Button - Circle/Square)
│   ├── Background: #3B82F6
│   ├── Icon: fab fa-facebook
│   ├── Size: 32px
│   └── Border Radius: 4px or 50%
├── Icon 2 (Button - Circle/Square)
│   └── Similar styling
└── Item Spacing: 8px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-social-icons">
  <div class="elementor-widget-container">
    <div class="elementor-social-icons-wrapper">
      <a href="#" class="elementor-social-icon elementor-social-icon-facebook">
        <i class="fab fa-facebook"></i>
      </a>
      <a href="#" class="elementor-social-icon elementor-social-icon-twitter">
        <i class="fab fa-twitter"></i>
      </a>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame Auto Layout | .elementor-social-icons-wrapper | Wrapper |
| Icon Button | `<a>.elementor-social-icon` | Link com ícone |
| Icon | `<i>` | Ícone Font Awesome |
| Background | CSS background-color | Cor de fundo |
| Border Radius | border-radius | Forma (circular/quadrado) |
| Item Spacing | gap | Espaço entre ícones |

---

### w:testimonial

**Figma Structure:**
```
Testimonial Component (Frame Auto Layout Vertical)
├── Quote Content
│   ├── Text: "Testimonial text"
│   ├── Font: Inter, 14px, Regular
│   ├── Color: #626C7C
│   └── Font Style: Italic
├── Author Section (Frame Auto Layout Horizontal)
│   ├── Avatar (Image)
│   │   ├── Size: 48px
│   │   ├── Border Radius: 50%
│   │   └── Source: avatar.jpg
│   ├── Author Info
│   │   ├── Name: "Author Name"
│   │   │   ├── Font: Inter, 14px, Bold
│   │   │   └── Color: #1F2121
│   │   └── Title: "Author Title"
│   │       ├── Font: Inter, 12px, Regular
│   │       └── Color: #626C7C
│   └── Item Spacing: 8px
└── Item Spacing (vertical): 12px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-testimonial">
  <div class="elementor-widget-container">
    <div class="elementor-testimonial">
      <div class="elementor-testimonial-content">
        <p class="elementor-testimonial-text">Testimonial text</p>
      </div>
      <div class="elementor-testimonial-meta">
        <img src="avatar.jpg" class="elementor-testimonial-image" alt="Author">
        <div class="elementor-testimonial-meta-inner">
          <h3 class="elementor-testimonial-name">Author Name</h3>
          <div class="elementor-testimonial-title">Author Title</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame | .elementor-testimonial | Wrapper |
| Quote Content | .elementor-testimonial-content | Container de citação |
| Text | .elementor-testimonial-text | Texto do testemunho |
| Author Section | .elementor-testimonial-meta | Container de autor |
| Avatar | .elementor-testimonial-image | Imagem do avatar |
| Author Info | .elementor-testimonial-meta-inner | Info de autor |
| Name | .elementor-testimonial-name | Nome do autor |
| Title | .elementor-testimonial-title | Título/cargo |

---

### w:gallery

**Figma Structure:**
```
Gallery Component (Frame Auto Layout)
├── Title Container (Hidden/Visible)
│   └── Gallery Title
├── Gallery Grid (Frame Auto Layout Grid)
│   ├── Gallery Item 1
│   │   ├── Image: image.jpg
│   │   ├── Overlay (Hidden)
│   │   │   └── Title
│   │   └── Hover Effect
│   └── Gallery Item N (repeat)
└── Column Count: 3-4
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-gallery">
  <div class="elementor-widget-container">
    <div class="elementor-gallery__titles-container"></div>
    <div class="elementor-gallery__container">
      <a href="image.jpg" class="elementor-gallery-item">
        <div class="elementor-gallery-item__image">
          <img src="thumbnail.jpg" alt="Gallery">
        </div>
        <div class="elementor-gallery-item__overlay">
          <div class="elementor-gallery-item__content">
            <div class="elementor-gallery-item__title">Title</div>
          </div>
        </div>
      </a>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame Grid | .elementor-gallery__container | Container grid |
| Gallery Item | .elementor-gallery-item | Link individual |
| Image | .elementor-gallery-item__image | Container imagem |
| Overlay (hover) | .elementor-gallery-item__overlay | Sobreposição |
| Title | .elementor-gallery-item__title | Título na overlay |

---

## WIDGETS ELEMENTOR PRO

### w:form

**Figma Structure:**
```
Form Component (Frame Auto Layout Vertical)
├── Form Title (optional)
├── Fields Container (Frame Auto Layout Vertical)
│   ├── Field Group 1 (Frame Auto Layout Vertical)
│   │   ├── Label: "Name"
│   │   │   ├── Font: Inter, 12px, Bold
│   │   │   └── Color: #1F2121
│   │   └── Input Field
│   │       ├── Background: #FFFFFF
│   │       ├── Border: 1px #E8EBEF
│   │       ├── Padding: 8px 12px
│   │       ├── Border Radius: 4px
│   │       └── Placeholder: "Name"
│   └── Field Group N (repeat)
├── Submit Button
│   └── (same as w:button structure)
└── Item Spacing: 12px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-form">
  <div class="elementor-widget-container">
    <form class="elementor-form" method="post">
      <div class="elementor-form-fields-wrapper">
        <div class="elementor-field-group">
          <label for="form-field-name" class="elementor-field-label">
            <span class="elementor-screen-only">Name</span>
          </label>
          <input type="text" name="form_fields[name]" id="form-field-name" 
                 class="elementor-field-textual elementor-size-md" 
                 placeholder="Name" required>
        </div>
      </div>
      <button type="submit" class="elementor-button">Submit</button>
    </form>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Form Container | `<form>.elementor-form` | Formulário |
| Fields | .elementor-form-fields-wrapper | Wrapper de campos |
| Field Group | .elementor-field-group | Campo individual |
| Label | .elementor-field-label | Rótulo |
| Input | `<input>` | Campo de entrada |
| Button | .elementor-button | Botão de submit |

---

### w:call-to-action

**Figma Structure:**
```
CTA Component (Frame Auto Layout Vertical)
├── Background Image/Color Overlay
├── CTA Content (Frame Auto Layout Vertical)
│   ├── Title
│   │   ├── Text: "Call to Action"
│   │   ├── Font: Inter, 24px, Bold
│   │   └── Color: #FFFFFF
│   ├── Description
│   │   ├── Font: Inter, 14px, Regular
│   │   └── Color: #FFFFFF
│   ├── Button
│   │   └── (same as w:button)
│   └── Item Spacing: 12px
├── Padding: 32px
└── Min Height: 200px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-call-to-action">
  <div class="elementor-widget-container">
    <div class="elementor-cta">
      <div class="elementor-cta__bg-overlay"></div>
      <div class="elementor-cta__content">
        <h2 class="elementor-cta__title">Call to Action</h2>
        <div class="elementor-cta__description">Description text</div>
        <a href="#" class="elementor-cta__button elementor-button">CTA Button</a>
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame CTA | .elementor-cta | Wrapper |
| Background overlay | .elementor-cta__bg-overlay | Overlay de fundo |
| Content | .elementor-cta__content | Container conteúdo |
| Title | .elementor-cta__title | Título |
| Description | .elementor-cta__description | Descrição |
| Button | .elementor-cta__button | Botão de ação |

---

## CARROSSÉIS (SWIPER.JS)

### w:image-carousel

**Figma Structure:**
```
Image Carousel (Frame Auto Layout Vertical)
├── Carousel Slides (Frame - horizontal scroll)
│   ├── Slide 1 (Image)
│   │   ├── Image: image1.jpg
│   │   └── Width: full container
│   └── Slide N (repeat)
├── Pagination (Dots - bottom)
│   ├── Dot 1 (active)
│   └── Dot N
├── Navigation (Arrows - sides)
│   ├── Prev Arrow (left)
│   └── Next Arrow (right)
└── Item Spacing: 0
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-image-carousel">
  <div class="elementor-widget-container">
    <div class="elementor-image-carousel swiper-container">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <img src="image1.jpg" alt="Slide 1">
        </div>
        <div class="swiper-slide">
          <img src="image2.jpg" alt="Slide 2">
        </div>
      </div>
      <div class="swiper-pagination"></div>
      <div class="swiper-button-prev"></div>
      <div class="swiper-button-next"></div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Frame horizontal scroll | .swiper-container | Container Swiper |
| Slides | .swiper-wrapper | Wrapper slides |
| Slide Individual | .swiper-slide | Slide item |
| Image | `<img>` | Imagem renderizada |
| Pagination Dots | .swiper-pagination | Indicadores |
| Arrow Prev | .swiper-button-prev | Seta anterior |
| Arrow Next | .swiper-button-next | Seta próxima |

---

## WOOCOMMERCE WIDGETS

### woo:product-title

**Figma Structure:**
```
Product Title Component
├── Heading (H1)
│   ├── Text: "Product Name"
│   ├── Font: Inter, 24px, Bold
│   ├── Color: #1F2121
│   └── Entry Title
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-wc-product-title">
  <div class="elementor-widget-container">
    <h1 class="product_title entry-title">Product Name</h1>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Heading H1 | `<h1>.product_title` | Título do produto |
| Text content | entry-title | Classe WooCommerce |

---

### woo:product-price

**Figma Structure:**
```
Product Price Component
├── Price Display
│   ├── Currency Symbol: "$"
│   ├── Amount: "99.99"
│   └── Font: Inter, 20px, Bold, Color: #208592
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-wc-product-price">
  <div class="elementor-widget-container">
    <div class="product_price">
      <span class="woocommerce-Price-amount amount">
        <bdi><span class="woocommerce-Price-currencySymbol">$</span>99.99</bdi>
      </span>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Currency Symbol | .woocommerce-Price-currencySymbol | Símbolo moeda |
| Price Amount | .woocommerce-Price-amount | Valor formatado |

---

### woo:product-add-to-cart

**Figma Structure:**
```
Add to Cart Component (Frame Auto Layout Horizontal)
├── Quantity Input
│   ├── Type: number
│   ├── Value: 1
│   ├── Min: 1
│   └── Width: 60px
├── Button "Add to Cart"
│   └── (same as w:button)
└── Item Spacing: 12px
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-wc-product-add-to-cart">
  <div class="elementor-widget-container">
    <form class="cart" method="post" enctype="multipart/form-data">
      <div class="quantity">
        <input type="number" value="1" min="1">
      </div>
      <button type="submit" class="single_add_to_cart_button button alt">
        Add to Cart
      </button>
    </form>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Quantity Input | `<input type="number">` | Seletor de quantidade |
| Button | .single_add_to_cart_button | Botão add to cart |

---

## LOOP BUILDER WIDGETS

### loop:grid

**Figma Structure:**
```
Loop Grid Component (Frame Auto Layout Grid)
├── Grid Item 1
│   ├── Image
│   ├── Title
│   ├── Meta (date, author)
│   └── Terms (categories)
└── Grid Item N (repeat based on columns)
```

**Elementor HTML:**
```html
<div class="elementor-widget elementor-widget-loop-grid">
  <div class="elementor-widget-container">
    <div class="elementor-loop-grid elementor-grid">
      <div class="elementor-grid-item">
        <!-- Loop item content -->
      </div>
    </div>
  </div>
</div>
```

**Correlação:**
| Figma | Elementor | Mapeamento |
|-------|-----------|-----------|
| Grid Container | .elementor-loop-grid | Container loop |
| Grid Classes | .elementor-grid | Classe grid |
| Grid Item | .elementor-grid-item | Item individual |

---

## CONCLUSÃO - PADRÃO GERAL DE MAPEAMENTO

### Equivalências Fundamentais:

```
┌─────────────────────────────────────────────────────────┐
│ FIGMA → ELEMENTOR                                        │
├─────────────────────────────────────────────────────────┤
│ Frame                    → <div class="elementor-*">    │
│ Text Layer               → <p>, <h1-h6>, <span>        │
│ Image Asset              → <img>                        │
│ Rectangle Shape          → <div> com classes           │
│ Icon/SVG                 → <i class="fas fa-...">      │
│ Button                   → <a class="elementor-button"> │
│ Auto Layout              → Flexbox/Grid CSS             │
│ Padding                  → CSS padding                  │
│ Margin                   → CSS margin                   │
│ Color/Fill               → CSS background/color        │
│ Border/Stroke            → CSS border                  │
│ Shadow/Effects           → CSS box-shadow/filters      │
│ Text Styling             → CSS font-*, text-*          │
└─────────────────────────────────────────────────────────┘
```

### Checklist de Mapeamento para IA:

1. ✅ Identificar tipo de widget no Figma
2. ✅ Mapear estrutura Auto Layout → Flexbox/Grid
3. ✅ Converter layers filhas → elementos HTML aninhados
4. ✅ Aplicar classes Elementor específicas do widget
5. ✅ Manter ordem hierárquica (pai-filho)
6. ✅ Preservar espaçamentos (padding, margins, item spacing)
7. ✅ Converter cores e estilos visuais → CSS classes
8. ✅ Validar estrutura HTML semântica
9. ✅ Confirmar atributos data-* quando necessário
10. ✅ Testar compatibilidade WooCommerce (se aplicável)

Este documento serve como guia completo para correlacionar estruturas visuais do Figma com markup HTML do Elementor WordPress.

