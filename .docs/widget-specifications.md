# Especificações de Widgets - Elementor Export

## Parâmetros Comuns a Todos os Widgets

Todos os widgets do Elementor suportam os seguintes parâmetros:

### Layout & Positioning
- `_margin` - Margem externa
- `_padding` - Espaçamento interno
- `width` - Largura
- `height` - Altura
- `_position` - Posicionamento (absolute, relative, fixed)
- `_offset_x` / `_offset_y` - Deslocamento
- `_z_index` - Índice Z

### Estilo Visual
- `background_background` - Tipo de fundo (classic, gradient, video, slideshow)
- `background_color` - Cor de fundo
- `background_image` - Imagem de fundo
- `border_border` - Tipo de borda (solid, double, dotted, dashed)
- `border_width` - Largura da borda
- `border_color` - Cor da borda
- `border_radius` - Raio da borda
- `box_shadow_box_shadow` - Sombra da caixa
- `_opacity` - Opacidade
- `_css_filters_*` - Filtros CSS (blur, brightness, contrast, etc.)

### Tipografia (para widgets com texto)
- `typography_typography` - "custom"
- `typography_font_family` - Família da fonte
- `typography_font_size` - Tamanho da fonte
- `typography_font_weight` - Peso da fonte
- `typography_line_height` - Altura da linha
- `typography_letter_spacing` - Espaçamento entre letras
- `typography_text_transform` - Transformação de texto
- `text_color` / `title_color` - Cor do texto

## Widget: Icon List (w:icon-list)

### Estrutura Esperada no Figma
```
Frame "w:icon-list"
  ├─ Frame/Group (Item 1)
  │   ├─ Vector/Icon (ícone)
  │   └─ Text (texto do item)
  ├─ Frame/Group (Item 2)
  │   ├─ Vector/Icon (ícone)
  │   └─ Text (texto do item)
  └─ ...
```

### Parâmetros Específicos
```typescript
{
  icon_list: [
    {
      text: "Item 1",
      selected_icon: {
        value: "fas fa-check" | { url: "...", id: 0 },
        library: "fa-solid" | "svg"
      },
      link: { url: "#", is_external: false }
    }
  ],
  // Estilos dos ícones
  icon_color: "rgba(...)",
  icon_size: { unit: "px", size: 14 },
  icon_align: "left" | "right",
  icon_spacing: { unit: "px", size: 10 },
  
  // Estilos do texto
  text_color: "rgba(...)",
  text_typography_typography: "custom",
  text_typography_font_family: "...",
  text_typography_font_size: { unit: "px", size: 16 },
  text_typography_font_weight: "400",
  
  // Layout
  space_between: { unit: "px", size: 10 },
  divider: "yes" | "no",
  divider_style: "solid" | "double" | "dotted" | "dashed",
  divider_weight: { unit: "px", size: 1 },
  divider_color: "rgba(...)"
}
```

## Widget: Icon Box (w:icon-box)

### Estrutura Esperada no Figma
```
Frame "w:icon-box"
  ├─ Vector/Icon/Image (ícone)
  ├─ Text (título)
  └─ Text (descrição)
```

### Parâmetros Específicos
```typescript
{
  // Ícone
  selected_icon: {
    value: "fas fa-star" | { url: "...", id: 0 },
    library: "fa-solid" | "svg"
  },
  view: "default" | "stacked" | "framed",
  shape: "circle" | "square",
  primary_color: "rgba(...)", // cor do ícone
  secondary_color: "rgba(...)", // cor de fundo (stacked/framed)
  icon_size: { unit: "px", size: 50 },
  icon_padding: { unit: "px", size: 20 },
  rotate: { unit: "deg", size: 0 },
  border_width: { unit: "px", size: 3 },
  border_radius: { unit: "%", size: 50 },
  
  // Título
  title_text: "...",
  title_color: "rgba(...)",
  title_typography_typography: "custom",
  title_typography_font_family: "...",
  title_typography_font_size: { unit: "px", size: 24 },
  title_typography_font_weight: "600",
  
  // Descrição
  description_text: "...",
  description_color: "rgba(...)",
  description_typography_typography: "custom",
  description_typography_font_family: "...",
  description_typography_font_size: { unit: "px", size: 16 },
  description_typography_font_weight: "400",
  
  // Layout
  position: "top" | "left" | "right",
  content_vertical_alignment: "top" | "middle" | "bottom",
  title_bottom_space: { unit: "px", size: 15 }
}
```

## Widget: Image Box (w:image-box)

### Estrutura Esperada no Figma
```
Frame "w:image-box"
  ├─ Rectangle/Image (imagem)
  ├─ Text (título)
  └─ Text (descrição)
```

### Parâmetros Específicos
```typescript
{
  // Imagem
  image: {
    url: "...",
    id: 0,
    size: "full" | "thumbnail" | "medium" | "large"
  },
  image_size: "full",
  image_spacing: { unit: "px", size: 15 },
  
  // Título
  title_text: "...",
  title_size: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
  title_color: "rgba(...)",
  title_typography_typography: "custom",
  title_typography_font_family: "...",
  title_typography_font_size: { unit: "px", size: 24 },
  
  // Descrição
  description_text: "...",
  description_color: "rgba(...)",
  description_typography_typography: "custom",
  description_typography_font_family: "...",
  description_typography_font_size: { unit: "px", size: 16 },
  
  // Layout
  position: "top" | "left" | "right",
  content_vertical_alignment: "top" | "middle" | "bottom",
  title_bottom_space: { unit: "px", size: 15 },
  
  // Link
  link: { url: "#", is_external: false, nofollow: false }
}
```

## Widget: Button (w:button)

### Parâmetros Específicos
```typescript
{
  text: "Click Here",
  link: { url: "#", is_external: false, nofollow: false },
  size: "xs" | "sm" | "md" | "lg" | "xl",
  align: "left" | "center" | "right" | "justify",
  
  // Ícone
  selected_icon: { value: "fas fa-arrow-right", library: "fa-solid" },
  icon_align: "left" | "right",
  icon_indent: { unit: "px", size: 10 },
  
  // Tipografia
  typography_typography: "custom",
  typography_font_family: "...",
  typography_font_size: { unit: "px", size: 16 },
  typography_font_weight: "600",
  
  // Cores
  button_text_color: "rgba(...)",
  button_background_color: "rgba(...)",
  button_border_color: "rgba(...)",
  
  // Hover
  hover_color: "rgba(...)",
  button_background_hover_color: "rgba(...)",
  button_hover_border_color: "rgba(...)",
  
  // Bordas
  border_border: "solid",
  border_width: { unit: "px", top: 2, right: 2, bottom: 2, left: 2 },
  border_radius: { unit: "px", top: 3, right: 3, bottom: 3, left: 3 },
  
  // Espaçamento
  button_padding: { unit: "px", top: 12, right: 24, bottom: 12, left: 24 }
}
```

## Widget: Heading (w:heading)

### Parâmetros Específicos
```typescript
{
  title: "Your Title Here",
  header_size: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
  align: "left" | "center" | "right" | "justify",
  
  // Tipografia
  typography_typography: "custom",
  typography_font_family: "...",
  typography_font_size: { unit: "px", size: 32 },
  typography_font_weight: "600",
  typography_line_height: { unit: "em", size: 1.2 },
  typography_letter_spacing: { unit: "px", size: 0 },
  typography_text_transform: "none" | "uppercase" | "lowercase" | "capitalize",
  
  // Cor
  title_color: "rgba(...)",
  
  // Efeitos de texto
  text_shadow_text_shadow_type: "yes",
  text_shadow_text_shadow: {
    horizontal: 0,
    vertical: 0,
    blur: 10,
    color: "rgba(0,0,0,0.3)"
  },
  
  // Blend Mode
  blend_mode: "normal" | "multiply" | "screen" | "overlay"
}
```

## Widget: Text Editor (w:text-editor)

### Parâmetros Específicos
```typescript
{
  editor: "<p>Your text here...</p>",
  
  // Tipografia
  typography_typography: "custom",
  typography_font_family: "...",
  typography_font_size: { unit: "px", size: 16 },
  typography_font_weight: "400",
  typography_line_height: { unit: "em", size: 1.6 },
  
  // Cor
  text_color: "rgba(...)",
  
  // Alinhamento
  align: "left" | "center" | "right" | "justify",
  
  // Colunas
  text_columns: 1,
  column_gap: { unit: "px", size: 20 }
}
```

## Widget: Image (w:image)

### Parâmetros Específicos
```typescript
{
  image: {
    url: "...",
    id: 0,
    size: "full"
  },
  image_size: "full" | "thumbnail" | "medium" | "large",
  align: "left" | "center" | "right",
  caption_source: "none" | "attachment" | "custom",
  caption: "Image caption",
  
  // Link
  link_to: "none" | "file" | "custom",
  link: { url: "#", is_external: false },
  open_lightbox: "default" | "yes" | "no",
  
  // Estilo
  width: { unit: "%", size: 100 },
  max_width: { unit: "px", size: 1000 },
  height: "auto" | "custom",
  object_fit: "cover" | "contain" | "fill",
  
  // Filtros CSS
  css_filters_brightness: { unit: "%", size: 100 },
  css_filters_contrast: { unit: "%", size: 100 },
  css_filters_saturate: { unit: "%", size: 100 },
  css_filters_blur: { unit: "px", size: 0 },
  css_filters_hue: { unit: "deg", size: 0 },
  
  // Hover
  hover_animation: "none" | "grow" | "shrink" | "pulse" | "buzz"
}
```

## Widget: Divider (w:divider)

### Parâmetros Específicos
```typescript
{
  style: "solid" | "double" | "dotted" | "dashed",
  weight: { unit: "px", size: 1 },
  color: "rgba(...)",
  width: { unit: "%", size: 100 },
  align: "left" | "center" | "right",
  gap: { unit: "px", size: 15 },
  
  // Elemento (texto ou ícone no meio)
  look: "line" | "line_icon" | "line_text",
  text: "Divider Text",
  icon: { value: "fas fa-star", library: "fa-solid" },
  icon_spacing: { unit: "px", size: 10 }
}
```

## Widget: Spacer (w:spacer)

### Parâmetros Específicos
```typescript
{
  space: { unit: "px", size: 50 },
  space_tablet: { unit: "px", size: 30 },
  space_mobile: { unit: "px", size: 20 }
}
```

Continua...
