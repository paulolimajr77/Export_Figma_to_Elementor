# Guia de Layout: Figma para Elementor

## Como Estruturar Layouts no Figma

### Regras de Detecção Automática

O plugin detecta automaticamente o tipo de container baseado em:

#### 1. **Largura do Container**

| Largura no Figma | Tipo no Elementor | Comportamento |
|------------------|-------------------|---------------|
| > 1400px | **Full Width** | Ocupa 100% da tela, sem largura fixa |
| 800px - 1400px | **Boxed** | Centralizado com largura fixa |
| < 800px | **Full Width** | Responsivo, sem largura fixa |
| Sem largura | **Full Width** | Ocupa 100% disponível |

#### 2. **Auto Layout (Figma)**

- **Auto Layout Centralizado** → Container Boxed
- **Auto Layout Esquerda/Direita** → Container Full Width
- **Sem Auto Layout** → Baseado na largura

#### 3. **Posicionamento**

- **Posição Absoluta** → Mantém posicionamento exato
- **Posição Relativa** → Segue regras de largura

---

## Estruturas Recomendadas

### 📱 Header Full Width
```
Frame "Header" (1920px × 92px)
├─ Frame "Container" (1280px × 92px) [Auto Layout: Horizontal]
│  ├─ Frame "Logo" (282px × 72px)
│  ├─ w:wp-custom-menu (Menu)
│  └─ w:button "CTA"
```
**Resultado:**
- Header externo: Full Width (1920px)
- Container interno: Boxed (1280px, centralizado)

---

### 📄 Seção de Conteúdo
```
Frame "Section" (1920px × 600px)
├─ Frame "Content" (1140px × auto) [Auto Layout: Vertical]
│  ├─ w:heading "Título"
│  ├─ w:text-editor "Texto"
│  └─ w:button "Saiba Mais"
```
**Resultado:**
- Section: Full Width
- Content: Boxed (1140px)

---

### 🎨 Grid de Cards
```
Frame "Cards Section" (1920px × auto)
├─ Frame "Cards Container" (1200px × auto) [Auto Layout: Horizontal, Wrap]
│  ├─ w:icon-box "Card 1" (350px × 400px)
│  ├─ w:icon-box "Card 2" (350px × 400px)
│  └─ w:icon-box "Card 3" (350px × 400px)
```
**Resultado:**
- Section: Full Width
- Container: Boxed (1200px)
- Cards: Flex wrap com gap

---

### 🖼️ Hero Full Width
```
Frame "Hero" (1920px × 800px) [Background: Image]
├─ Frame "Hero Content" (800px × auto) [Auto Layout: Vertical, Center]
│  ├─ w:heading "Título Grande"
│  ├─ w:text-editor "Subtítulo"
│  └─ w:button "CTA Principal"
```
**Resultado:**
- Hero: Full Width com background
- Content: Boxed centralizado

---

## Convenções de Nomenclatura

### Prefixos para Controle Manual

Use prefixos no nome da camada para forçar comportamentos:

| Prefixo | Comportamento |
|---------|---------------|
| `w:container` | Força container genérico |
| `w:section` | Força container de seção |
| `w:button` | Widget botão |
| `w:heading` | Widget título |
| `w:icon-box` | Widget caixa de ícone |
| `w:image-box` | Widget caixa de imagem |

### Exemplos:
- `w:container Header` → Container
- `w:section Hero` → Container de seção
- `w:button CTA Principal` → Botão

---

## Auto Layout no Figma → Flexbox no Elementor

### Direção
- **Horizontal** → `flex_direction: row`
- **Vertical** → `flex_direction: column`

### Alinhamento Principal
- **Packed** → `justify_content: flex-start`
- **Space Between** → `justify_content: space-between`
- **Space Around** → `justify_content: space-around`
- **Center** → `justify_content: center`

### Alinhamento Cruzado
- **Top/Left** → `align_items: flex-start`
- **Center** → `align_items: center`
- **Bottom/Right** → `align_items: flex-end`

### Gap
- **Item Spacing** → `gap: {size}px`

---

## Dicas de Otimização

### ✅ Boas Práticas

1. **Use Auto Layout sempre que possível**
   - Facilita a detecção de flexbox
   - Mantém responsividade

2. **Larguras padrão recomendadas:**
   - Header/Footer: 1920px (full) com container 1280px (boxed)
   - Conteúdo: 1140px - 1200px (boxed)
   - Cards: 350px - 400px cada

3. **Nomeie camadas de forma descritiva:**
   - ✅ `w:button Agendar Avaliação`
   - ❌ `Rectangle 123`

4. **Agrupe elementos relacionados:**
   - Logo + Menu + CTA = Container
   - Ícone + Título + Descrição = Icon Box

### ❌ Evite

1. **Containers muito pequenos (<100px)**
   - Podem ser interpretados como widgets

2. **Muitos níveis de aninhamento**
   - Máximo 3-4 níveis recomendado

3. **Larguras inconsistentes**
   - Use valores padrão (1140, 1200, 1280, 1920)

---

## Exemplos de Larguras Comuns

| Elemento | Largura Figma | Tipo Elementor |
|----------|---------------|----------------|
| Full Page | 1920px | Full Width |
| Container Max | 1280px | Boxed |
| Content Area | 1140px | Boxed |
| Sidebar | 350px | Full Width |
| Card | 350-400px | Full Width |
| Button | 200-300px | Widget |
| Icon | 24-64px | Widget |

---

## Testando o Layout

1. **Exporte o JSON**
2. **Cole no Elementor**
3. **Verifique:**
   - Containers full width ocupam 100%?
   - Containers boxed estão centralizados?
   - Elementos mantêm proporções?
   - Auto Layout virou flexbox?

4. **Ajuste no Figma se necessário:**
   - Altere larguras
   - Ajuste Auto Layout
   - Renomeie camadas com prefixos

---

## Solução de Problemas

### Problema: Tudo fica "boxed"
**Solução:** Use larguras > 1400px para full width

### Problema: Container não centraliza
**Solução:** Use Auto Layout com alinhamento CENTER

### Problema: Elementos não ficam lado a lado
**Solução:** Use Auto Layout Horizontal no container pai

### Problema: Espaçamento errado
**Solução:** Configure Item Spacing no Auto Layout do Figma
