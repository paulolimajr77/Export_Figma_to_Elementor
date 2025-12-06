# 4. Guia de UX/Produto: Painel Lint V2

**Objetivo**: Transformar o "Terminal de Erros" em um "Painel de Saúde".

## 1. Estrutura Visual

### A. Health Header (Topo Fixo)
*   **Score Ring**: Destaque visual. Anel que completa de 0 a 100%. Cor muda dinamicamente (Verde/Amarelo/Vermelho).
*   **Label de Status**: Texto grande ao lado do score. "Excellent", "Good", "Atention Needed".
*   **Ação Primária**: Botão pequeno "Re-Scan" (ícone de refresh).

### B. Quick Filters (Tabs)
*   `All`: Visão geral.
*   `Structure` (🔴): Foco em layout quebrado.
*   `Naming` (⚪): Foco em organização.
*   `Widgets` (🔵): Foco em enriquecimento semântico.

### C. Lista de Issues (Scrollable)
*   **Agrupamento**: Itens devem ser sempre agrupados. Nunca mostrar 50 linhas de "Rename layer". Mostrar "Rename Layers (50)".
*   **Colapsável**: Grupos de baixa prioridade (Info) começam fechados.

### D. Footer de Ação (Sticky Bottom)
*   `Auto-Fix All Safe`: Botão mágico que resolve tudo que tem Score > 0.9 (ex: Renomear, Converter Group p/ Frame).
*   `Export`: Botão final de conversão.

## 2. Microcopy e Tom de Voz
*   **Positivo**: Não diga "Erro". Diga "Melhoria".
*   **Educativo**: Explique O PORQUÊ.
    *   *Ruim*: "Missing Auto Layout".
    *   *Bom*: "Enable Auto Layout to ensure responsiveness on mobile."
*   **Ação**: Comece com verbos. "Fix", "Rename", "Convert".

## 3. Estados de Interface

### Loading
*   Skeleton screens nas linhas de issues.
*   Mensagem rotativa: "Analisando estrutura...", "Detectando botões...", "Verificando contraste...".

### Empty State (Zero Issues)
*   Ilustração de celebração (Confete/Checkmark).
*   Texto: "Everything looks great! Ready to export."
*   Botão de Exportação pulsando/destacado.

### Critical State (Score < 50)
*   Header vermelho.
*   Alerta no topo: "Exporting now may result in broken layouts."
