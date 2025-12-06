# Relatório Técnico: Framework de Lint & Heurísticas (Figma → Elementor)

**Data:** 06/12/2025  
**Autor:** Antigravity Agent (Google Deepmind)  
**Projeto:** Export_Figma_to_Elementor  

## 1. Arquitetura Geral do Framework

O ecossistema de análise do plugin opera sobre dois subsistemas principais que, embora complementares, funcionam de maneira parcialmente independente:

1.  **Linter Engine (Tempo Real / UI)**: Focado em feedback imediato para o designer no Figma.
2.  **Pipeline Heuristics (Compilação / No-AI)**: Focado na conversão estrutural silenciosa durante a exportação.

### 1.1. Pipeline de Execução (Linter UI)

O fluxo `analyzeFigmaLayout` orquestra a análise da seguinte forma:

1.  **Input**: Recebe um `SceneNode` (geralmente um Frame raiz).
2.  **Engine Initialization**: Instancia `LinterEngine` e `RuleRegistry`.
3.  **Rule Registration**: Carrega regras estruturais (`AutoLayoutRule`, `SpacerDetectionRule`) e de nomenclatura.
4.  **Recursion**: O método `engine.analyzeNode` percorre a árvore:
    *   Verifica se o nó já possui nome de widget válido (`w:...`). Se sim, pula validações profundas desse nó.
    *   Executa todas as regras registradas contra o nó.
    *   Coleta `LintResult` (erros, warnings).
5.  **Widget Detection (Phase 2)**: Após a validação estrutural, o `WidgetDetector` é acionado para identificar *quais* widgets Elementor os elementos representam, independentemente da estrutura estar 100% correta.
6.  **Report Generation**: Compila erros + sugestões de widgets + guias de correção (`ManualFixGuide`).

### 1.2. Componentes Internos

*   **LinterEngine**: O cérebro que gerencia o ciclo de vida da análise, medição de tempo e agregação de resultados.
*   **RuleRegistry**: Repositório de regras ativas. Permite ativar/desativar regras dinamicamente via `options`.
*   **WidgetDetector**: Um analisador probabilístico complexo que pontua elementos baseados em três vetores: Visual, Conteúdo e Nome.
*   **Heuristics Adapter (`createNodeSnapshot`)**: Normaliza nós do Figma em um objeto plano (`NodeSnapshot`) para comparação rápida, removendo a complexidade da API do Figma.

---

## 2. Heurísticas Existentes

O sistema utiliza dois conjuntos de heurísticas: as **Heurísticas Estritas** (no `src/heuristics`) e os **Detectores Probabilísticos** (no `src/linter/detectors`).

### 2.1. Exemplos de Heurísticas (Seleção)

#### **Detector de Botão (`matchButton`)**
*   **Objetivo**: Identificar botões call-to-action.
*   **Sinais Visuais**:
    *   Aspect Ratio: Entre 1.5 e 6 (formato retangular horizontal).
    *   Fills/Strokes: Presença de background ou borda detectada.
    *   Densidade: Texto curto (1-2 palavras) centralizado.
*   **Sinais Textuais**: Nomes contendo "btn", "button", "link".
*   **Score Mínimo**: 0.4 (mas ganha boost forte se tiver nome explícito).

#### **Detector de Image Box (`matchImageBox`)**
*   **Objetivo**: Identificar cards com Imagem + Título + Descrição.
*   **Propriedades**: Requer estrutura `FRAME` (ou similar).
*   **Sinais Visuais**:
    *   `hasImage`: Presença de imagem filha.
    *   `textCount`: Pelo menos 1 texto, idealmente Título e Descrição.
*   **Lógica**:
    *   Base: 0.3
    *   +0.6 se tiver imagem
    *   +0.4 se tiver texto
    *   -0.5 se tiver muitos textos (>4), indicando que pode ser uma seção complexa e não um widget simples.

#### **Detector de Heading (`ELEM_HEADING`)**
*   **Objetivo**: Diferenciar títulos de texto corrido.
*   **Propriedades**: Analisa `fontSize`, `fontWeight`, `lineCount`.
*   **Regra**:
    *   `fontSizeMax` >= 22px
    *   `lineCount` <= 3
    *   `isBold` == true
*   **Confiança**: 0.9 se der match.

#### **Detector de Grade/Colunas (`LAYOUT_COLUMNS`)**
*   **Objetivo**: Identificar estruturas de layout horizontal.
*   **Regra**:
    *   Auto Layout Horizontal.
    *   Filhos com larguras "aproximadamente iguais" (`areWidthsRoughlyEqual`).
    *   Entre 2 e 4 filhos.
*   **Fallback**: Se não bater larguras iguais, pode cair para `LAYOUT_GRID` (se gap for pequeno) ou ser tratado como Container genérico.

---

## 3. Fluxo de Decisão (Decision Engine)

### 3.1. Competição e Resolução

Quando múltiplos detetores dão "match" no mesmo nó, o sistema usa um **algoritmo de prioridade ponderada**:

1.  **Explícito (Override)**: Se o nome começa com `w:`, `woo:`, `c:`, o score é forçado a 1000 (Vitória imediata).
2.  **Score Probabilístico (`calculateConfidence` no WidgetDetector)**:
    *   Fórmula: `Min(1.0, (Base * 0.1) + (Visual * 0.4) + (Content * 0.3) + (Name * 0.2))`
    *   O contexto visual (aspecto, fills) tem o maior peso (40%), garantindo que algo que *parece* um botão seja classificado como botão mesmo sem o nome correto.
3.  **Heuristics Ranking (`evaluateNode`)**:
    *   Ordena por `confidence` (decrescente).
    *   Desempate por `priority` (definida estaticamente na regra).
    *   Exemplo: `ELEM_HEADING` (prio 90) ganha de `ELEM_TEXT_EDITOR` (prio 85) se ambos derem match em um texto de 24px.

### 3.2. Resolução de Conflitos (Ex: Gallery vs Image Carousel)
Ambos procuram por "várias imagens filhas".
*   **Gallery**: Exige `allImages` e `children.length >= 3`. Score boost se nome tiver "gallery".
*   **Carousel**: Score boost se nome tiver "carousel", "slider".
*   **Grid**: Se for apenas layout de colunas sem semântica de galeria, a regra estrutural `LAYOUT_GRID` entra em ação com prioridade menor que os widgets, servindo de fallback.

---

## 4. Robustez e Limitações

### 4.1. Pontos de Falha
*   **Nesting Excessivo**: O `WidgetDetector` faz uma análise contextual "rasa" (1 nível de profundidade para filhos diretos). Se a estrutura do botão for `Frame > Frame > Frame > Text`, ele pode falhar em ver o texto e a cor juntos.
*   **Imagens como Backgrounds**: O sistema detecta bem `Fills` do tipo Image, mas falha se a imagem for um `Rectangle` absoluto jogado atrás de um Frame transparente (common design mistake).
*   **Generic Divs**: Layouts feitos inteiramente com Groups ou Frames sem Auto Layout (Absolute Position) quebram a heurística de "Lists" e "Grids", pois dependem de ordem e espaçamento consistente.

### 4.2. Determinismo vs IA
*   **100% Determinístico**: As regras de Lint (`AutoLayoutRule`) e as `Standard Heuristics`.
*   **Probabilístico (Não-IA)**: O `WidgetDetector` usa heurísticas "fuzzy" (scores), mas ainda é lógica codificada, não IA generativa.
*   **Dependência de IA**: O sistema *não* depende de IA para identificar widgets básicos (Botão, Texto, Imagem). A IA (Gemini/OpenAI) é usada apenas na pipeline principal para renomeação semântica e estruturação de seções complexas onde a heurística falha (ex: "Isso é um 'Hero Section' ou apenas um banner grande?").

---

## 5. Pontos Fortes

1.  **Context-Awareness**: O `WidgetDetector` não olha apenas o tipo do nó, mas calcula densidade de texto, aspect ratio e composição de filhos. Isso permite diferenciar um "Card" de um "Botão grande".
2.  **Hybrid Fallback**: Se o detector específico falhar, ele cai para detecção genérica (Image, Text, Container), garantindo que nada se perca na exportação.
3.  **Velocidade**: A análise roda inteiramente local (sem API calls) em milissegundos, permitindo feedback em tempo real na UI.
4.  **Educação do Usuário**: O sistema gera `ManualFixGuide` com passos exatos (ex: "Pressione Shift+A"), educando o designer a criar arquivos melhores.

---

## 6. Fraquezas e Riscos Arquiteturais

1.  **Código Duplicado (O "Split" Linter/Pipeline)**:
    *   Existe lógica de detecção no `src/linter/detectors/WidgetDetector.ts` E lógica similar (inline) no `src/services/heuristics/noai.parser.ts` (`calculateWidgetScore`).
    *   **Risco**: Corrigir uma regra no Linter visual não corrige a exportação automática, e vice-versa.
2.  **Manutenção de Regras Manuais**: Adicionar um novo widget requer criar uma regra manual code-based. Com 150+ widgets, o arquivo `WidgetDetector.ts` está ficando monolítico (~2000 linhas).
3.  **Dependência de "Bons Modos"**: O sistema assume que o usuário usa Auto Layout para coisas como Grids e Listas. Em arquivos "sujos" (spaghetti design), a precisão cai drasticamente (< 50%).

---

## 7. Recomendações de Melhoria

1.  **Unificação das Engines**:
    *   Extrair toda a lógica de `calculateWidgetScore` do parser e centralizar no `WidgetDetector`.
    *   O parser No-AI deve instanciar `WidgetDetector` em vez de re-implementar a lógica.
2.  **Heurísticas Compostas (Compound Rules)**:
    *   Criar regras que validam relações pai-filho mais complexas. Ex: "Se pai é `w:tabs`, filhos *devem* ser `w:tab-content`". Hoje a validação é muito isolada por nó.
3.  **Lint de "Pré-Limpeza"**:
    *   Criar um passo automático que converte "Groups" em "Frames" e tenta aplicar Auto Layout em listas óbvias antes de rodar a detecção de widgets.
4.  **Priorização por Contexto de Página**:
    *   Introduzir o conceito de "Zonas". Um elemento no topo da página (Y < 800) tem maior probabilidade de ser `w:nav-menu` ou `w:hero`. Um elemento no rodapé tem maior chance de ser `w:copyright` ou `w:social-icons`.

---

## 8. Fluxograma do Pipeline (Conceitual)

```ascii
[ SceneNode (Figma) ]
       |
       v
[ 1. Adapter (createNodeSnapshot) ] -> Normaliza dados (remove complexidade da API Plugin)
       |
       v
[ 2. Heuristics Engine (evaluateNode) ]
       |
    (Itera lista de regras estritas: isButton? isHeading?)
       |
       +--> [ Match Found? ] --(Sim)--> [ Atribui Widget & Score ]
       |          |
       |        (Não)
       v          |
[ 3. WidgetDetector (Probabilistic) ]
       |
    (Analisa Contexto: Visual, Text Density, Children Composition)
       |
    (Calcula Scores: Button=0.8, Card=0.3, ...)
       |
       v
[ 4. Competition Resolver ] -> [ Pega o maior Score ]
       |
       v
[ 5. Decision Check (Confidence > 0.4?) ]
       |            |
     (Sim)        (Não)
       |            |
[ Assign Widget ] [ Fallback: Generic Container/Text/Image ]
       |
       v
[ OUTPUT: Widget Schema ]
```

---

## 9. Resumo Executivo

O framework de lint e heurísticas do plugin opera como um sistema híbrido de **análise estática** (regras rígidas de layout) e **inferência probabilística** (detecção de widgets baseada em características visuais). Sua maior força reside na capacidade de interpretar a *intenção* do design (ex: reconhecer que um retângulo com texto é um botão) sem depender de IA generativa externa, garantindo velocidade e privacidade. No entanto, a arquitetura atual sofre de **duplicação lógica** entre o módulo de UI (Linter) e o módulo de exportação (Parser), o que pode gerar inconsistências onde o plugin "avisa" uma coisa mas "exporta" outra. A robustez é alta para designs estruturados com Auto Layout, mas degrada em arquivos desorganizados. A principal recomendação é a **unificação imediata** dos motores de detecção para garantir uma única fonte de verdade para a classificação de elementos.
