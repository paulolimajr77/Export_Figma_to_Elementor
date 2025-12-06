# Dossier Técnico: Framework de Lint & Heurísticas (Figma → Elementor)

**Documento:** DOSS-001  
**Data:** 06/12/2025  
**Autor:** Antigravity Architect  
**Escopo:** Análise, Diagnóstico e Redesign da Engine de Conversão

---

## 1. Introdução
Este documento consolida a análise técnica e o plano de evolução do framework de Lint e Heurísticas do plugin. Ele serve como a "Bíblia Técnica" para a unificação das engines de diagnóstico visual (Linter) e exportação de código (Compiler), abordando desde os problemas de arquitetura atuais até o detalhamento da nova experiência de usuário.

---

## 2. Arquitetura Atual: O Problema do "Cérebro Duplo"

Atualmente, o plugin sofre de um problema fundamental de consistência devido à existência de duas pipelines de decisão separadas.

### 2.1. Os Dois Motores
1.  **Linter Engine (UI-Side - `src/linter`)**: Reage à seleção do usuário, roda validações estruturais (`AutoLayoutRule`) e tenta adivinhar widgets (`WidgetDetector`) para dar feedback visual.
2.  **Parser Engine (Compiler-Side - `src/pipeline/noai.parser.ts`)**: Quando o usuário clica em exportar, uma lógica *separada* e ligeiramente diferente percorre a árvore para gerar o JSON.

### 2.2. Diagrama de Inconsistência
```mermaid
graph TD
    UserSelection --> Linter[Linter Engine]
    UserSelection --> Export[Export Button]
    
    Linter --> WidgetDet1[WidgetDetector (V1)]
    Export --> Serializer --> WidgetDet2[Heuristic Parser (V2)]
    
    WidgetDet1 --> UI[Avisos na Tela: "Isso é um Botão"]
    WidgetDet2 --> JSON[Elementor JSON: Gera um Container]
    
    style WidgetDet1 fill:#f9d5e5,stroke:#333
    style WidgetDet2 fill:#eeeeee,stroke:#333
```
**Consequência**: O plugin "mente". O Linter pode acusar que um retângulo é um botão (e pedir correção), mas o exportador pode ignorá-lo e gerar um container simples, ou vice-versa.

---

## 3. Anatomia das Heurísticas: Por que temos "Alucinações"?

As heurísticas atuais funcionam com base em **Pattern Matching Isolado**. Elas olham para um nó individualmente, sem "saber" onde ele está na página.

### 3.1. Caso de Estudo: A "Alucinação" do Botão
Muitos usuários reclamam que qualquer retângulo com texto é identificado como `w:button`.

**A Lógica Atual (`matchButton`):**
1.  **Aspect Ratio**: Verifica se é horizontal (Width/Height > 1.5).
2.  **Fill**: Verifica se tem cor de fundo sólida.
3.  **Texto**: Verifica se tem texto curto (1-2 palavras) centralizado.
4.  **Nome**: Dá um boost se o layer se chamar "btn" ou "button".

**Por que falha (Falso Positivo):**
Um card de "Preço" (`$ 99`) ou uma "Tag" (`Novidade`) atende exatamente aos mesmos critérios visuais. Como a heurística atual não checa o contexto (ex: "está dentro de um menu?" ou "é clicável no protótipo?"), ela classifica tudo como Botão, gerando ruído e desconfiança.

### 3.2. Auto Layout e Severidade "Critical"
O Linter foi programado para assumir que a ausência de Auto Layout é sempre um erro fatal.
*   **Regra**: `if (node.layoutMode === "NONE") return CRITICAL`.
*   **Problema**: Vetores, ilustrações complexas e background decorations *precisam* ser livres. Marcar isso como "Critical" treina o usuário a ignorar os alertas vermelhos.

---

## 4. Diagnóstico de UX: O "Scroll Infinito"

O painel atual de Linter falha em hierarquizar a informação.

### Problemas Identificados:
1.  **Volume vs Relevância**: Um frame complexo pode gerar 50+ issues. O usuário vê uma lista interminável de erros triviais (ex: 30 avisos de "Layer Name" em ícones).
2.  **Fadiga de Decisão**: Cada issue requer que o usuário pare, analise, encontre o layer e decida o que fazer.
3.  **Falta de Agrupamento**:
    *   *Atual*:
        *   Layer 1: Rename...
        *   Layer 2: Rename...
        *   Layer 1: Auto Layout...
    *   *Ideal*:
        *   Rename Issues (2 items)
        *   Structure Issues (1 item)

---

## 5. Proposta Arquitetural: O "Single Source of Truth"

A solução é unificar a inteligência em um único módulo central que sirva tanto à UI quanto à Exportação.

### 5.1. Novo Módulo: `WidgetEngine`
Este módulo substituirá tanto o `WidgetDetector` quanto o parser de heurísticas.

#### Componentes:
1.  **Pipeline de Features (`FeatureExtractor`)**:
    *   Extrai dados frios: "Tem imagem?", "Qual a densidade de texto?", "Qual a posição Y?".
    *   **NOVO**: `ZoneDetector`. Calcula se o elemento está no Topo (Header), Meio (Body) ou Fundo (Footer).
2.  **Registro de Heurísticas (`HeuristicRegistry`)**:
    *   Regras puras que recebem features e retornam probabilidade.
    *   *Exemplo*: Regra de Menu agora exige `Zone === 'HEADER'` ou estrutura de lista muito explícita.
3.  **Motor de Decisão (`DecisionEngine`)**:
    *   Compara as probabilidades competindo.
    *   Aplica **Threshold Dinâmico**: Se a confiança for < 60%, classifica como Genérico, evitando sugestões ruins.

### 5.2. Fluxo Unificado
```mermaid
graph LR
    Input[Figma Node] --> Engine[Widget Engine]
    Engine --> Result[Analysis Result]
    Result --> UI[Linter Panel (Mostra Correções)]
    Result --> Compiler[Elementor Export (Gera JSON)]
```

---

## 6. Blueprint de UX: O Novo Painel de Saúde

O conceito muda de "Lista de Erros" para "Dashboard de Saúde".

### 6.1. O "Health Score"
Um indicador gamificado (0-100) no topo do painel.
*   **Verde (80-100)**: Pronto para exportar.
*   **Amarelo (50-79)**: Requer atenção em estruturas principais.
*   **Vermelho (<50)**: Estrutura quebrada, exportação será imprevisível.

### 6.2. Estrutura do Painel (Wireframe)

```text
+-------------------------------------------------------+
|  HEALTH REPORT                           [Re-Scan ⟳]  |
+-------------------------------------------------------+
|  [ 85 ]  GOOD                                         |
|  🟡 2 Warnings   🔵 4 Suggestions                     |
+-------------------------------------------------------+
|  FILTER: [All] [Structure] [Naming] [Widgets]         |
+-------------------------------------------------------+
|  ▼ 🟡 CRITICAL STRUCTURE (1 Group)                    |
|    Issues que quebram a responsividade no Elementor.  |
|                                                       |
|    • "Pricing Cards" (Group)                          |
|      Deve ser convertido para Frame + Auto Layout.    |
|      [ ⚡ Fix: Convert to Frame ]                     |
|                                                       |
|  ► 🔵 DISCOVERED WIDGETS (4 Items)                    |
|    (Colapsado) Oportunidades de semântica.            |
|                                                       |
|    • 3x "Rectangle" parecem [Buttons]                 |
|      [ Rename All to w:button ]                       |
|                                                       |
|  ▼ ✅ NAMING (100%)                                   |
|    Todos os layers principais estão nomeados.         |
+-------------------------------------------------------+
|  ACTIONS                                              |
|  [ Auto-Fix Safe Issues ]   [ Export Code ]           |
+-------------------------------------------------------+
```

### 6.3. Melhorias de Vida (QoL)
*   **Quick Fixes**: Botões de ação direta no card ("Aplicar Auto Layout", "Renomear").
*   **Ignore List**: Botão "Ignorar este erro" salva o ID do layer numa lista de exclusão persistente.
*   **Bulk Actions**: "Renomear todos os 15 botões detectados" em um clique.

---

## 7. Plano de Implementação

A migração deve ser feita em fases para não paralisar o desenvolvimento.

### Fase 1: Fundação (Core)
*   Criar pasta `src/engine`.
*   Implementar `FeatureExtractor` e migrar a lógica de detecção atual para lá, limpando as duplicatas.
*   *Risco*: Baixo (código novo isolado).

### Fase 2: Unificação (Backend)
*   Fazer o `noai.parser.ts` (Exportação) consumir a nova `WidgetEngine`.
*   Validar se a exportação continua funcionando igual ou melhor.
*   *Risco*: Médio (altera o output do plugin). Necessário testes de regressão.

### Fase 3: Interface (Frontend)
*   Reescrever `ui.html` para suportar o novo design com Score e Collapsibles.
*   Conectar os botões de "Quick Fix" às funções do `code.ts`.
*   *Risco*: Médio (mudança visual grande para o usuário).

### Fase 4: Otimização
*   Afinar os pesos das heurísticas usando o feedback das Fases 2 e 3.
*   Implementar e calibrar o `ZoneDetector` (Header vs Footer).

---

## 8. Conclusão

A modernização aqui proposta não é apenas estética; é estrutural. Ao unificar as engines, garantimos que o plugin seja confiável ("What You See Is What You Get"). Ao introduzir o Health Score e Agrupamentos, transformamos uma ferramenta irritante de avisos em um assistente proativo que ajuda o designer a fazer um trabalho melhor, resultando em sites Elementor muito mais limpos e performáticos.
