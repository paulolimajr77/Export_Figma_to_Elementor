# Documentação de UX: Novo Painel de Linter

**Versão**: 1.0 (Proposta RFC-001)
**Foco**: Ação, Clareza e Redução de Ruído.

---

## 1. Conceito do Painel
O novo painel deixa de ser um "log de erros" para se tornar um "assistente de saúde do arquivo". O foco muda de *listar problemas* para *oferecer soluções*.

### Principais Mudanças de Paradigma
*   **Score vs Lista**: O usuário vê primeiro uma nota (0-100), gamificando a qualidade.
*   **Solução vs Problema**: Cada item de erro vem acoplado a um botão de ação (Fix/Rename).
*   **Relevância vs Volume**: Itens de baixa relevância vêm colapsados por padrão.

---

## 2. Wireframe Textual do Painel

```text
+-------------------------------------------------------+
|  LINTER & DIAGNOSTICS                    [Re-Scan ⟳]  |
+-------------------------------------------------------+
|                                                       |
|  [ 92 / 100 ]  EXCELLENT                              |
|  Health Score                                         |
|                                                       |
|  [||||||||||||||||||||||||||||||||||||||....]         |
|  ProgressBar                                          |
|                                                       |
|  ---------------------------------------------------  |
|  FILTER BY:                                           |
|  [All (5)] [Crit (0)] [Warn (3)] [Info (2)]           |
|  ---------------------------------------------------  |
|                                                       |
|  ▼ 🟡 STRUCTURE WARNINGS (2)                          |
|    (Issues que afetam a responsividade)               |
|                                                       |
|    • [Frame] "Hero Section"                           |
|      Missing Auto Layout                              |
|      [ ✨ Auto-Fix ]  [ Select ]                      |
|                                                       |
|    • [Group] "Icon Wrapper"                           |
|      Should be a Frame for better CSS                 |
|      [ Convert to Frame ]                             |
|                                                       |
|  ► 🔵 WIDGET SUGGESTIONS (3)                          |
|    (Expandir para ver oportunidades de semântica)     |
|                                                       |
|    • "Rectangle 24" -> Button (98% confidence)        |
|      [ Rename to w:button ] [ Ignore ]                |
|                                                       |
|    • "Frame 32" -> Image Box (75% confidence)         |
|      [ Rename ] [ Ignore ]                            |
|                                                       |
|  ▼ 🟢 NAMING CONVENTIONS (Passed)                     |
|    All items match the design system.                 |
|                                                       |
+-------------------------------------------------------+
|  ACTIONS:                                             |
|  [ Fix All Critical ]       [ Export to Elementor ]   |
+-------------------------------------------------------+
```

---

## 3. Funcionalidades Detalhadas

### 3.1. Health Score (0-100)
O score é calculado subtraindo pontos de 100 baseados na severidade dos erros encontrados no Frame selecionado.
*   **Critical Issue**: -10 pontos (ex: Falta de estrutura básica).
*   **Warning**: -3 pontos (ex: Nome genérico).
*   **Info**: -0 pontos (não afeta o score, apenas sugestão).

*Visual*: O círculo ou barra de progresso muda de cor: Verde (>80), Amarelo (50-79), Vermelho (<50).

### 3.2. Filtros Rápidos (Tabs)
Permite ao usuário focar em um tipo de trabalho por vez:
1.  **All**: Visão padrão.
2.  **Structure**: Foca apenas em Auto Layout e aninhamento. Essencial para devs.
3.  **Naming**: Foca em organização e "limpeza" do arquivo.
4.  **Widgets**: Foca na semântica de exportação (detectar botões, menus).

### 3.3. Cards de Issue (Interativos)
Cada card de erro possui:
*   **Ícone de Severidade**: Bola colorida.
*   **Título Curto**: "Missing Auto Layout".
*   **Contexto**: Nome do layer afetado ("Hero Section").
*   **Botão Primário (Quick Fix)**: Ação imediata (ex: rodar função `fixAutoLayout(nodeId)`).
*   **Botão Secundário (Select)**: Seleciona o layer no canvas para inspeção manual.
*   **Botão Terciário (Ignore)**: Adiciona o ID da regra à lista de ignorados deste nó.

### 3.4. Agrupamento Colapsável
Para evitar o "scroll infinito", issues do mesmo tipo são agrupadas.
*   Se houver 10 botões não nomeados, o painel mostra:
    `▼ Unnamed Buttons (10 items)`
    Ao expandir, lista os itens individuais ou oferece um "Fix All: Rename detected buttons".

---

## 4. Estados da UI

1.  **Empty State (Scan Inicial)**:
    "Selecione um Frame para analisar a saúde do layout."
2.  **Loading**:
    Skeleton screens enquanto o `FeatureExtractor` roda (geralmente < 200ms).
3.  **Perfect Score (100)**:
    Tela de "Parabéns", com confete (opcional) e botão de Exportação em destaque.
4.  **No Issues Found (mas score baixo)**:
    Caso raro, mostrar mensagem de "Estrutura complexa não reconhecida".

---

## 5. Acessibilidade e Atalhos
*   O painel deve suportar navegação por teclado (Tab entre issues).
*   Atalho sugerido para "Re-Scan": `Shift + R` (quando o painel tem foco).
