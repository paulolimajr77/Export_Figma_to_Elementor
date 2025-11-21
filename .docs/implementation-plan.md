# Plano de Implementação - Widgets Elementor Completos

## Status Atual

### ✅ Widgets Implementados Completamente
1. **Icon List (w:icon-list)** - 100%
   - ✅ Ícones individuais por item (upload SVG + fallback)
   - ✅ Cores dos ícones
   - ✅ Tamanho dos ícones
   - ✅ Tipografia do texto
   - ✅ Cores do texto
   - ✅ Espaçamento entre itens
   - ✅ Configurações de divisor

### 🔄 Widgets Parcialmente Implementados
2. **Icon Box (w:icon-box)** - 80%
   - ✅ Ícone (upload SVG + fallback)
   - ✅ Cor primária do ícone
   - ✅ Tamanho do ícone
   - ✅ Rotação do ícone
   - ✅ Título + tipografia
   - ✅ Descrição + tipografia
   - ✅ View, Shape, Padding
   - ✅ Border Width, Border Radius
   - ✅ Position, Alignment
   - ⚠️ Falta: Cor secundária (background para stacked/framed)

3. **Image Box (w:image-box)** - 80%
   - ✅ Imagem (upload PNG + fallback)
   - ✅ Título + tipografia
   - ✅ Descrição + tipografia
   - ✅ Position, Alignment
   - ✅ Espaçamento da imagem
   - ✅ Link
   - ⚠️ Falta: Image size options, hover effects

4. **Button (w:button)** - 60%
   - ✅ Texto
   - ✅ Tipografia
   - ✅ Cor do texto
   - ✅ Background
   - ✅ Link
   - ❌ Falta: Ícone, Size, Align, Hover states, Border customization

5. **Icon (w:icon)** - 70%
   - ✅ Upload SVG
   - ✅ Cor primária
   - ❌ Falta: Tamanho, Rotação, Link, Hover

6. **Image (w:image)** - 60%
   - ✅ Upload PNG
   - ❌ Falta: Align, Caption, Link, Lightbox, CSS Filters, Hover

### ❌ Widgets Não Implementados
7. **Heading (w:heading)**
8. **Text Editor (w:text-editor)**
9. **Divider (w:divider)**
10. **Spacer (w:spacer)**
11. **Video (w:video)**
12. **Basic Gallery (w:basic-gallery)**
13. **Alert (w:alert)**
14. **Tabs (w:tabs)**
15. **Accordion (w:accordion)**
16. **Progress Bar (w:progress)**
17. **Counter (w:counter)**
18. **HTML (w:html)**
19. **Shortcode (w:shortcode)**

## Prioridades de Implementação

### Fase 1 - Widgets Essenciais (Prioridade Alta)
1. ✅ Icon List - COMPLETO
2. 🔄 Icon Box - Adicionar cor secundária
3. 🔄 Image Box - Adicionar opções de tamanho e hover
4. 🔄 Button - Completar com ícone, sizes e hover
5. ⏳ Heading - Implementar completo
6. ⏳ Text Editor - Implementar completo
7. ⏳ Image - Completar com todas as opções

### Fase 2 - Widgets de Layout (Prioridade Média)
8. ⏳ Divider
9. ⏳ Spacer
10. ⏳ Container (revisar implementação atual)

### Fase 3 - Widgets de Mídia (Prioridade Média)
11. ⏳ Video
12. ⏳ Basic Gallery

### Fase 4 - Widgets Interativos (Prioridade Baixa)
13. ⏳ Tabs
14. ⏳ Accordion
15. ⏳ Alert

### Fase 5 - Widgets Especializados (Prioridade Baixa)
16. ⏳ Progress Bar
17. ⏳ Counter
18. ⏳ HTML
19. ⏳ Shortcode

## Próximos Passos Imediatos

1. **Completar Icon Box**
   - Adicionar detecção de background do container para cor secundária
   - Implementar lógica para detectar view (default/stacked/framed) baseado em estilos

2. **Completar Image Box**
   - Adicionar opções de tamanho de imagem
   - Implementar hover effects

3. **Completar Button**
   - Adicionar suporte a ícones
   - Implementar sizes (xs, sm, md, lg, xl)
   - Adicionar align
   - Implementar hover states
   - Melhorar customização de bordas

4. **Implementar Heading**
   - Detectar tag HTML (h1-h6)
   - Tipografia completa
   - Text shadow
   - Blend mode

5. **Implementar Text Editor**
   - Suportar HTML formatado
   - Tipografia
   - Colunas
   - Alinhamento

## Notas Técnicas

### Parâmetros Comuns a Aplicar em TODOS os Widgets
Todos os widgets já recebem automaticamente (via `Object.assign` no final de `createExplicitWidget`):
- ✅ Border styles
- ✅ Shadows
- ✅ Background
- ✅ Padding
- ✅ Opacity
- ✅ Transform
- ✅ Inner shadow
- ✅ Blend mode
- ✅ CSS Filters
- ✅ Overflow
- ✅ Positioning
- ✅ Custom CSS

### Estrutura de Implementação Padrão
```typescript
else if (widgetSlug === 'widget-name') {
    // 1. Declarar variáveis para nós filhos
    let node1: SceneNode | null = null;
    let node2: TextNode | null = null;
    
    // 2. Encontrar nós filhos (se aplicável)
    if ('children' in node) {
        const frame = node as FrameNode;
        // ... lógica de busca
    }
    
    // 3. Processar cada elemento
    // - Upload de mídia (se necessário)
    // - Extrair tipografia
    // - Extrair cores
    // - Extrair dimensões
    
    // 4. Configurar settings específicos do widget
    settings.widget_specific_param = value;
    
    // 5. Configurar parâmetros de layout
    settings.position = 'top';
    settings.align = 'left';
    // etc.
}
```

### Checklist para Cada Widget
- [ ] Identificar todos os parâmetros do Elementor
- [ ] Mapear estrutura esperada no Figma
- [ ] Implementar lógica de detecção de elementos
- [ ] Implementar upload de mídia (se aplicável)
- [ ] Extrair e mapear tipografia
- [ ] Extrair e mapear cores
- [ ] Configurar parâmetros de layout
- [ ] Configurar parâmetros de estilo
- [ ] Testar exportação
- [ ] Testar importação no Elementor
- [ ] Documentar no widget-specifications.md
