# Figma → WordPress / Elementor / Woo Heuristics Engine

Este pacote contém:

- Tipos e motor de heurísticas genéricas.
- Heurísticas estruturais (seções, layout, tipografia, header/footer).
- Heurísticas específicas para widgets de:
  - WordPress (core widgets principais)
  - Elementor (básico)
  - Elementor Pro (principais)
  - WooCommerce (grade de produtos e telas chave)
- Camada de fallback por IA (LLM) para desempate de interpretações.

## Estrutura

- `src/types.ts` — define `NodeSnapshot`, `Heuristic`, etc.
- `src/heuristicsEngine.ts` — funçōes `evaluateNode` e `composeHeuristics`.
- `src/heuristics/` — regras estruturais (layout, seções, tipografia, navegação, mídia).
- `src/widgets/` — heurísticas ligadas a widgets específicos:
  - `elementor-basic.ts`
  - `elementor-pro.ts`
  - `wordpress-core.ts`
  - `woocommerce.ts`
- `src/llmFallback.ts` — interface para integrar com GPT/Gemini e resolver ambiguidade.
- `src/index.ts` — exporta tudo e o array `DEFAULT_HEURISTICS`.

## Uso básico

```ts
import {
  NodeSnapshot,
  DEFAULT_HEURISTICS,
  evaluateNode,
} from "./src";

const node: NodeSnapshot = /* montar a partir do Figma */;

const results = evaluateNode(node, DEFAULT_HEURISTICS, {
  minConfidence: 0.35,
});

const best = results[0];
if (best) {
  console.log("Pattern:", best.patternId, "Widget:", best.widget, "Conf:", best.confidence);
}
```

Para casos com múltiplos candidatos você pode usar `resolveWithLLM` em `llmFallback.ts`
e deixar a IA escolher o melhor widget dentre os resultados de `evaluateNode`.
