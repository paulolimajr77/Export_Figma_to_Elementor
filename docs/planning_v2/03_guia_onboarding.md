# 3. Guia de Onboarding: Lint Engine

**Tempo de Leitura Estimado:** 10 min

## 1. Visão Geral (The Big Picture)
Bem-vindo ao time! Nosso plugin funciona como um tradutor: ele lê uma língua visual (Figma) e escreve uma língua estruturada (Elementor JSON).
O `WidgetEngine` é o dicionário inteligente desse tradutor. Ele olha para um quadrado azul e decide se é apenas um quadrado (`Container`) ou um botão clicável (`Button`).

## 2. Modelo Mental: "O Juiz de Widgets"
Imagine que cada elemento do Figma passa por um tribunal:
1.  **Réu**: O nó do Figma.
2.  **Proprovas**: `FeatureExtractor` coleta evidências (Tem cor? Tem texto? Está no topo?).
3.  **Advogados**: `HeuristicRegistry`. Cada widget tem um advogado. O advogado do Botão diz: "Meritíssimo, meu cliente tem clique e texto curto!". O advogado do Card diz: "Mas ele tem conteúdo complexo!".
4.  **Juiz**: `DecisionEngine`. Ele ouve todos, olha a "Zona" (se estamos no tribunal do Rodapé ou do Cabeçalho) e dá o veredito final com um Score de confiança.

## 3. Por onde começar no Código?
*(Estes arquivos serão criados na V2)*

1.  `src/engine/features/extractor.ts`: Veja como transformamos nodes sujos em dados limpos.
2.  `src/engine/heuristics/rules/button.ts`: Leia uma regra simples para entender a lógica de score.
3.  `src/engine/decision/engine.ts`: Onde a mágica da escolha acontece.

## 4. Glossário Rápido para Sobreviver

### NodeSnapshot
Uma 'foto' leve do node. A API do Figma é lenta, então tiramos essa foto com todas as propriedades que precisamos e usamos só ela.

### Confidence Score (0.0 a 1.0)
Nossa certeza.
*   `> 0.8`: Pode apostar que é isso.
*   `0.5`: "Talvez". Mostramos no Linter, mas exportamos com cuidado.

### Structural vs Semantic Issue
*   **Structural**: Erro técnico. "Falta Auto Layout". O código vai quebrar se não arrumar. (🔴 Critical)
*   **Semantic**: Oportunidade. "Isso parece um botão". O código funciona, mas pode ser melhor. (🔵 Suggestion)
