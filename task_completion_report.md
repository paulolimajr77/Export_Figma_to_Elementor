# Relatório de Correção: Upload de Ícones em Icon List

## Problema Identificado
Os ícones dentro do widget `icon-list` não estavam sendo exportados para o WordPress nem exibidos no Elementor quando o modo "NO-AI" (Sem IA) era utilizado. O log mostrava `[NO-AI UPLOAD]` mas ignorava os itens da lista.

## Causa Raiz
O projeto utiliza dois pipelines de conversão distintos:
1. **Com IA**: Usa `src/pipeline.ts`.
2. **Sem IA**: Usa uma lógica interna em `src/code.ts` (`runPipelineWithoutAI`).

As correções anteriores foram aplicadas apenas em `src/pipeline.ts`. O pipeline "Sem IA" possuía uma lista restrita de widgets permitidos para upload (`image`, `button`, `icon-box`, etc.), e **não incluía** `list-item` ou `icon-list`.

## Solução Aplicada
1. **Atualização do Pipeline NO-AI (`src/code.ts`)**:
   - A função `processWidget` foi modificada para incluir `list-item` e `icon-list` na verificação de widgets elegíveis para upload.
   - Adicionada lógica específica para tratar o retorno do upload para `list-item`:
     - Atualiza `widget.styles.icon_url` com a URL do WordPress.
     - Atualiza `widget.imageId` com o ID do anexo do WordPress.

2. **Verificação**:
   - Os logs confirmam que o widget `list-item` (ID `1:879`) foi processado e o upload foi bem-sucedido (ID `6518`).
   - O JSON gerado para o Elementor agora contém o ID correto (`6518`) na estrutura `selected_icon`.

## Arquivos Modificados
- `src/code.ts`: Lógica de upload do pipeline NO-AI.
- `docs/technical/pipelines.md`: Nova documentação criada para explicar a dualidade dos pipelines e prevenir erros futuros.

## Próximos Passos
- O usuário deve recarregar o plugin no Figma e testar a exportação novamente.
- Verificar no editor do Elementor se o ícone aparece corretamente.
