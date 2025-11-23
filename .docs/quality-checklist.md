# Checklist de Qualidade - Plugin Figma to Elementor

## ✅ Implementações Completas

### 1. Flexbox e Layout
- [x] **flex_direction** - Horizontal/Vertical do Auto Layout
- [x] **justify_content** - Alinhamento principal (flex-start, center, flex-end, space-between)
- [x] **align_items** - Alinhamento cruzado (flex-start, center, flex-end, baseline, stretch)
- [x] **align_content** - Alinhamento de múltiplas linhas (quando wrap)
- [x] **flex_wrap** - Wrap/Nowrap
- [x] **gap** - Espaçamento entre itens (geral)
- [x] **column_gap** - Espaçamento entre colunas
- [x] **row_gap** - Espaçamento entre linhas
- [ ] **align_self** - Alinhamento individual (TODO: implementar por widget)
- [ ] **flex_grow** - Crescimento proporcional (TODO)
- [ ] **flex_basis** - Tamanho base (TODO)
- [ ] **order** - Ordem de exibição (TODO)

### 2. Backgrounds
- [x] **Cor sólida** - background_color
- [x] **Gradiente linear** - background_gradient_*
- [x] **Imagem de fundo** - background_image com upload para WordPress
- [x] **Fallback base64** - Quando upload falha
- [x] **background_position** - center center
- [x] **background_repeat** - no-repeat
- [x] **background_size** - cover
- [ ] **Gradiente radial** - TODO
- [ ] **Múltiplos backgrounds** - TODO
- [ ] **background_attachment** - TODO (fixed/scroll)

### 3. Imagens
- [x] **Upload PNG para WordPress**
- [x] **Upload SVG para WordPress**
- [x] **Fallback base64** para PNG
- [x] **Fallback base64** para SVG
- [x] **Dimensões** - width, height
- [x] **object-fit** - cover, contain
- [x] **CSS Filters** - brightness, contrast, saturation, etc.
- [x] **Align** - left, center, right
- [ ] **Lightbox** - TODO: detectar links
- [ ] **Caption** - TODO: extrair de texto próximo

### 4. Cores de Hover
- [x] **Button hover** - Escurece automaticamente (-15%)
- [x] **Text hover** - Escurece automaticamente (-10%)
- [x] **Border hover** - Usa cor da borda ou background
- [x] **Função adjustColorBrightness** - Ajusta brilho de cores rgba
- [ ] **Link hover** - TODO
- [ ] **Icon hover** - TODO

### 5. Tipografia
- [x] **font_family** - Extração de fonte do Figma
- [x] **font_size** - Tamanho em px
- [x] **font_weight** - Peso da fonte
- [x] **line_height** - Altura da linha
- [x] **letter_spacing** - Espaçamento entre letras
- [x] **text_transform** - uppercase, lowercase, capitalize
- [x] **text_decoration** - underline, line-through
- [x] **font_style** - italic
- [x] **text_color** - Cor do texto
- [ ] **text_shadow** - TODO
- [ ] **word_spacing** - TODO

### 6. Bordas e Sombras
- [x] **border_color** - Cor da borda
- [x] **border_width** - Largura (top, right, bottom, left)
- [x] **border_radius** - Raio de borda
- [x] **border_border** - Tipo (solid, dashed, dotted)
- [x] **box_shadow** - Sombra externa
- [x] **box_shadow_inner** - Sombra interna
- [x] **text_shadow** - Sombra de texto
- [ ] **border_style** individual por lado - TODO

### 7. Espaçamento
- [x] **padding** - Padding interno (top, right, bottom, left)
- [x] **margin** - Margin externo (top, right, bottom, left)
- [x] **gap** - Espaçamento entre filhos (flexbox)
- [x] **Auto-detecção** de padding do Auto Layout

### 8. Posicionamento
- [x] **position** - relative, absolute, fixed
- [x] **_offset_x** - Offset horizontal
- [x] **_offset_y** - Offset vertical
- [x] **_z_index** - Ordem de empilhamento
- [x] **_offset_orientation_h** - start, end
- [x] **_offset_orientation_v** - start, end

### 9. Containers
- [x] **content_width** - full, boxed
- [x] **Detecção automática** baseada em largura
- [x] **Auto Layout** → Flexbox
- [x] **Centralização** automática para boxed
- [x] **Largura fixa** para containers médios (800-1400px)
- [x] **Full width** para containers grandes (>1400px)
- [x] **Responsivo** para containers pequenos (<800px)

### 10. Widgets Implementados (34 total)

#### Elementor Gratuito (20)
- [x] Icon List
- [x] Icon Box
- [x] Image Box
- [x] Button (com ícone, sizes, hover)
- [x] Heading (h1-h6 auto-detect)
- [x] Text Editor
- [x] Divider
- [x] Spacer (responsivo)
- [x] Image (com filtros)
- [x] Video
- [x] Alert
- [x] Counter
- [x] Progress
- [x] Accordion
- [x] Tabs
- [x] Gallery
- [x] SoundCloud
- [x] Google Maps
- [x] HTML
- [x] Shortcode

#### WordPress Nativos (14)
- [x] Menu Personalizado
- [x] Arquivos
- [x] Categorias
- [x] Páginas
- [x] Posts Recentes
- [x] Comentários Recentes
- [x] Pesquisar
- [x] Nuvem de Tags
- [x] Calendário
- [x] Meta
- [x] RSS
- [x] Áudio
- [x] Vídeo
- [x] Galeria

## 🔄 Pendências e Melhorias

### Alta Prioridade
1. **Align Self** - Implementar alinhamento individual por widget
2. **Gradiente Radial** - Suportar gradientes radiais do Figma
3. **Lightbox** - Detectar e configurar lightbox para imagens
4. **Link Hover** - Cores de hover para links

### Média Prioridade
5. **Flex Grow/Basis** - Suportar crescimento proporcional
6. **Order** - Ordem de exibição de elementos
7. **Multiple Backgrounds** - Múltiplos backgrounds
8. **Background Attachment** - Fixed/Scroll
9. **Caption** - Extrair legendas de imagens

### Baixa Prioridade
10. **Text Shadow** - Sombra de texto avançada
11. **Word Spacing** - Espaçamento entre palavras
12. **Border Style** individual - Estilos diferentes por lado

## 📊 Estatísticas

- **Total de Widgets**: 34
- **Parâmetros de Layout**: 8/12 (67%)
- **Parâmetros de Background**: 7/10 (70%)
- **Parâmetros de Tipografia**: 9/11 (82%)
- **Parâmetros de Hover**: 3/5 (60%)
- **Cobertura Geral**: ~75%

## 🧪 Testes Recomendados

### Layout
- [ ] Container full width (>1400px)
- [ ] Container boxed (800-1400px)
- [ ] Container responsivo (<800px)
- [ ] Auto Layout horizontal
- [ ] Auto Layout vertical
- [ ] Flex wrap
- [ ] Gap entre itens
- [ ] Justify content (start, center, end, space-between)
- [ ] Align items (start, center, end, stretch)

### Backgrounds
- [ ] Cor sólida
- [ ] Gradiente linear
- [ ] Imagem de fundo (upload)
- [ ] Imagem de fundo (base64)
- [ ] Background position
- [ ] Background size (cover)

### Widgets
- [ ] Button com ícone
- [ ] Button hover
- [ ] Icon List (múltiplos itens)
- [ ] Icon Box completo
- [ ] Image Box completo
- [ ] Heading (h1-h6)
- [ ] Text Editor
- [ ] Accordion
- [ ] Tabs
- [ ] Gallery
- [ ] Counter
- [ ] Progress Bar

### Imagens
- [ ] Upload PNG
- [ ] Upload SVG
- [ ] Fallback base64
- [ ] Dimensões corretas
- [ ] Object-fit
- [ ] CSS Filters

### Hover
- [ ] Button text hover
- [ ] Button background hover
- [ ] Border hover

## 🐛 Bugs Conhecidos

Nenhum bug conhecido no momento.

## 📝 Notas de Implementação

### Backgrounds de Imagem
- Função `extractBackgroundAdvanced` agora é **async**
- Requer passar `compiler` como parâmetro
- Upload automático para WordPress
- Fallback para base64 se upload falhar

### Cores de Hover
- Função `adjustColorBrightness` escurece/clareia cores
- Valores negativos escurecem (-15%)
- Valores positivos clareiam (+15%)
- Funciona com rgba

### Flexbox
- Auto Layout Horizontal → `flex_direction: row`
- Auto Layout Vertical → `flex_direction: column`
- Item Spacing → `gap`, `column_gap`, `row_gap`
- Alinhamentos mapeados corretamente

### Containers
- Largura > 1400px → Full Width
- Largura 800-1400px → Boxed
- Largura < 800px → Full Width responsivo
- Auto Layout CENTER → Boxed
