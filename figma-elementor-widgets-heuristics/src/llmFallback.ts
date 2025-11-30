/**
 * Camada de fallback de IA para desempate ou casos ambíguos.
 * Aqui está apenas a interface. No plugin real você conecta com Gemini, GPT, etc.
 */

import { EvaluatedResult } from "./heuristicsEngine";
import { NodeSnapshot } from "./types";

export interface LLMClient {
  /**
   * Executa um prompt livre.
   * No plugin real isso deve chamar a API escolhida (Gemini, GPT, etc).
   */
  complete(prompt: string): Promise<string>;
}

export interface LLMDisambiguationParams {
  node: NodeSnapshot;
  candidates: EvaluatedResult[];
}

export async function resolveWithLLM(
  client: LLMClient,
  params: LLMDisambiguationParams
): Promise<EvaluatedResult | null> {
  const { node, candidates } = params;

  if (!candidates.length) return null;

  const short = candidates
    .map((c, idx) => `${idx + 1}. pattern=${c.patternId}, widget=${c.widget}, conf=${c.confidence.toFixed(2)}`)
    .join("\n");

  const prompt = `Você é um analisador de UI.
Node (nome: "${node.name}", tipo: ${node.type}, width=${node.width}, height=${node.height}).
Possíveis interpretações:
${short}

Escolha APENAS UMA opção que melhor representa o widget correto em WordPress/Elementor/Elementor Pro/WooCommerce.
Responda apenas com o número da opção (1, 2, 3, ...).`;

  const raw = await client.complete(prompt);
  const match = raw.match(/(\d+)/);
  if (!match) return candidates[0];

  const idx = parseInt(match[1], 10) - 1;
  if (idx < 0 || idx >= candidates.length) return candidates[0];

  return candidates[idx];
}
