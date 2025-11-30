import { Heuristic, HeuristicResult, NodeSnapshot } from "./types";

export interface EngineOptions {
  minConfidence?: number;
}

export interface EvaluatedResult extends HeuristicResult {
  heuristicId: string;
  priority: number;
}

export function evaluateNode(
  node: NodeSnapshot,
  heuristics: Heuristic[],
  options: EngineOptions = {}
): EvaluatedResult[] {
  const minConfidence = options.minConfidence ?? 0.3;
  const results: EvaluatedResult[] = [];

  for (const rule of heuristics) {
    try {
      const out = rule.match(node);
      if (!out) continue;
      if (out.confidence < minConfidence) continue;

      results.push({
        ...out,
        heuristicId: rule.id,
        priority: rule.priority,
      });
    } catch {
      // no-op para não quebrar o plugin inteiro
      continue;
    }
  }

  results.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.priority - a.priority;
  });

  return results;
}

export function composeHeuristics(...groups: Heuristic[][]): Heuristic[] {
  return groups.flat();
}
