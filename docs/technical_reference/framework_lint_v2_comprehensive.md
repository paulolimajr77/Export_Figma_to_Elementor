# 📘 DOCUMENTAÇÃO — FRAMEWORK LINT & HEURISTICS V2

**Documento:** REF-001  
**Versão:** 2.0.0-FINAL  
**Data:** 06/12/2025  
**Autor:** Antigravity Agent (Google Deepmind)  
**Status:** **[REFERENCE]**

---

## 1. Visão Geral do Sistema Atual

O sistema atual opera sob um paradigma de "Split Brain" (Cérebro Dividido), onde duas engines distintas tentam interpretar o mesmo layout Figma, gerando resultados inconsistentes.

### 1.1. Fluxo de Linter (`src/linter`)
Focado em feedback visual rápido na UI thread.
*   **Trigger**: Seleção manual ou automática de nós.
*   **Lógica**: Executa `WidgetDetector.ts` (baseado em classes) e regras estruturais (`AutoLayoutRule.ts`).
*   **Duplicação**: Possui sua própria lógica de detecção de "Botão", separada do exportador.

### 1.2. Fluxo de Exportação (`src/pipeline/noai.parser.ts`)
Focado na geração rígida de código HTML/JSON.
*   **Trigger**: Botão "Export to Elementor".
*   **Lógica**: Executa `calculateWidgetScore` (função procedural enorme) e valida schema.
*   **Problema**: Se o Linter diz "Isso é um Botão", o Exportador pode ignorar e gerar um `Container` genérico se suas regras internas (rígidas) não forem atendidas 100%.

> **Referência**: Detalhado em `RFC_001_Modernizacao_Lint.md` (Seção 1.1).

---

## 2. Anatomia das Heurísticas (Estado Atual)

As heurísticas atuais são baseadas em *Pattern Matching Isolado*. Elas analisam um nó sem contexto espacial.

*   **Identidade Fuzzy**: Um nó ganha pontos se tiver "cara de widget".
    *   Ex: `isButton` verifica `hasFill`, `hasText`, `aspectRatio`.
*   **Dependência de Naming**: O sistema confia demais no nome da camada. Se o usuário nomear um retângulo como "btn", o sistema tende a aceitar, mesmo que seja um rodapé.
*   **Falta de Normalização**: A engine lida diretamente com nós crus do Figma, tornando os testes unitários difíceis (mockar um `SceneNode` é complexo).

---

## 3. Problemas Identificados

### 3.1. "Alucinação" de Widgets
O sistema vê padrões onde não existem. Um card de preço (`$ 99`) é frequentemente classificado como `w:button` porque visualmente é um retângulo com texto curto e centralizado.

### 3.2. Falta de Contexto Vertical
O sistema não sabe a diferença entre o topo e o fundo da página.
*   **Impacto**: Um link simples no rodapé ("Política de Privacidade") é tratado com a mesma complexidade de um item de Menu Principal no cabeçalho.

### 3.3. Severidade Mal Calibrada
O Linter atual marca ausência de Auto Layout como `CRITICAL`.
*   **Impacto**: Ilustrações vetoriais (que não devem ter Auto Layout) geram alertas vermelhos, treinando o usuário a ignorar o painel.

### 3.4. Inconsistência UI vs Export
O painel promete uma correção que o exportador não entrega. Isso destrói a confiança do usuário na ferramenta.

---

## 4. Arquitetura Unificada V2 (WidgetEngine)

A nova arquitetura unifica a inteligência em um módulo `src/engine`.

### 4.1. FeatureExtractor (`src/engine/features`)
Normaliza o input.
*   **Responsabilidade**: Converter `SceneNode` (API lenta) em `NodeFeatures` (POJO rápido).
*   **Dados extraídos**: `textDensity`, `mediaRatio`, `hasVisualFill`, `structureType`.

### 4.2. ZoneDetector (`src/engine/zones`)
Adiciona metadados espaciais.
*   **Responsabilidade**: Classificar nó em `HEADER`, `HERO`, `BODY` ou `FOOTER`.
*   **Lógica**: Baseada na posição Y relativa e altura do root frame.

### 4.3. HeuristicRegistry (`src/engine/heuristics`)
Coleção de regras puras.
*   **Invariante**: Uma regra nunca deve acessar a API do Figma diretamente. Deve usar apenas `NodeFeatures` e `Zone`.
*   **Saída**: `MatchCandidate` (Widget Type + Score).

### 4.4. DecisionEngine (`src/engine/decision`)
O árbitro final.
*   **Responsabilidade**: Resolver conflitos entre candidatos (ex: Container vs Card).
*   **Saída**: `AnalysisResult` contendo o `bestMatch` (para exportador) e `alternatives` (para UI suggestions).

> **Referência**: Detalhado em `architecture/lint-engine-v2.md`.

---

## 5. Fluxo Completo (Pipeline Unificado)

```mermaid
graph LR
    Input[SceneNode] --> Features[FeatureExtractor]
    Context[Page Layout] --> Zones[ZoneDetector]
    
    Features & Zones --> Registry{HeuristicRegistry}
    
    Registry --> Match1[Match: Button (0.8)]
    Registry --> Match2[Match: Card (0.4)]
    
    Match1 & Match2 --> Decision[DecisionEngine]
    
    Decision --> UI[Linter UI]
    Decision --> Export[No-AI Parser]
```

O diagrama acima ilustra como o *mesmo* processamento alimenta as duas saídas finais.

---

## 6. UX Explicada (Painel Health First)

O novo painel muda o foco de "Erros" para "Saúde".

### 6.1. Health Score
Nota de 0 a 100.
*   **Cálculo**: 100 - (Peso * Qtd Erros).
*   **Objetivo**: Gamificação. Fazer o usuário querer chegar no "Verde".

### 6.2. Quick Fix (Auto-correção)
Botões de ação direta no card de erro.
*   **Fluxo**: `UI (Click Fix)` -> `postMessage` -> `code.ts` -> `WidgetEngine.applyFix(nodeId, fixType)`.
*   **Segurança**: Só disponível para issues com `confidence > 0.9`.

### 6.3. Redução de Ruído
*   **Agrupamento**: Erros repetidos são agrupados ("5x Rename Layer").
*   **Filtros**: Usuário pode ver só "Estrutura" se for dev, ou só "Semântica" se for designer.

> **Referência**: Wireframes em `planning_v2/04_guia_ux_produto.md`.

---

## 7. Comparação Direta V1 vs V2

| Critério | V1 (Atual) | V2 (Novo) |
| :--- | :--- | :--- |
| **Engine de Decisão** | Duplicada (Linter != Parser) | Unificada (`WidgetEngine`) |
| **Contexto** | Nenhum (Nó isolado) | `ZoneDetector` (Header/Footer) |
| **Precisão de Widget** | Baixa ("Alucinações") | Alta (Features + Contexto) |
| **Interface** | Lista de erros plana | Dashboard Agrupado + Score |
| **Ação** | Manual (Usuário edita) | Assistida (Quick Fixes) |
| **Exportação** | Rígida (Ignora sugestões) | Consistente (Usa o `bestMatch`) |

---

## 8. Limitações e Pontos de Atenção

Mesmo na V2, algumas limitações persistem:

1.  **Ambiguidade Visual Real**: Um retângulo com texto *pode* ser um botão ou uma tag. Sem contexto semântico (IA), a heurística pode errar. O usuário precisará intervir via UI ("Confirmar Sugestão").
2.  **Performance em Arquivos Gigantes**: O `FeatureExtractor` roda node-a-node. Em arquivos com 2000+ nós, isso pode travar a UI por alguns segundos. (Mitigação: Async Batching planejado).
3.  **Dependência de Auto Layout**: A V2 continua exigindo Auto Layout para entender a estrutura *hierárquica* corretamente. Groups e Frames soltos terão score de confiança menor.

---

## 9. Propostas Futuras

### 9.1. Híbrido IA + Heurística (V3)
Usar modelos LLM (Gemini Flash) apenas para desempatar casos com confiança entre 0.4 e 0.6 ("Zona Cinzenta").

### 9.2. Detecção de Padrões (Pattern Recognition)
Identificar automaticamente que uma sequência de elementos repetidos forma uma `Grid` ou `List`, sem precisar analisar itens individualmente.
