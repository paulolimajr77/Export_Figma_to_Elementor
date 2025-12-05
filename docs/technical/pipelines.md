# Arquitetura de Pipelines de Conversão

O projeto possui dois fluxos distintos de conversão (pipelines) que operam de forma independente. É crucial manter a consistência lógica entre eles ao adicionar novos recursos ou correções.

## 1. Pipeline com IA (`src/pipeline.ts`)
- **Gatilho**: Quando o usuário ativa a opção "Usar IA".
- **Arquivo Principal**: `src/pipeline.ts`.
- **Classe**: `ConversionPipeline`.
- **Fluxo**:
  1. Serializa o node do Figma.
  2. Envia para a IA (Gemini/OpenAI) para estruturação.
  3. Recebe o JSON estruturado.
  4. Processa uploads de imagens recursivamente (`traverse` / `processWidget`).
  5. Compila para Elementor JSON.

## 2. Pipeline Sem IA (`src/code.ts`)
- **Gatilho**: Quando o usuário desativa a opção "Usar IA" (NO-AI).
- **Arquivo Principal**: `src/code.ts`.
- **Função**: `runPipelineWithoutAI`.
- **Fluxo**:
  1. Analisa a árvore do Figma usando heurísticas (`src/pipeline/noai.parser.ts`).
  2. Converte para esquema intermediário (`convertToFlexSchema`).
  3. **Upload de Imagens**: Executa uma lógica de upload *in-line* dentro de `runPipelineWithoutAI`.
     - **Atenção**: Esta lógica é separada da `ConversionPipeline`.
     - Widgets suportados devem ser explicitamente listados em `processWidget` dentro de `src/code.ts`.
  4. Compila para Elementor JSON.

## Manutenção
Ao adicionar suporte a upload para um novo widget (ex: `icon-list`, `gallery`), você deve atualizar **ambos** os arquivos:
1. `src/pipeline.ts`: No método `uploadImages` ou `processWidget`.
2. `src/code.ts`: Na função `processWidget` dentro de `runPipelineWithoutAI`.

## Histórico de Correções
- **05/12/2025**: Adicionado suporte a `list-item` e `icon-list` no pipeline NO-AI (`src/code.ts`), corrigindo falha de upload de ícones em listas.
