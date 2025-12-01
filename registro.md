 # Registro de Alterações e Análises
 
 ## 04/12/2025: Análise do Problema de Duplicação de Nós pela IA
 
 **Problema Identificado:**
 O pipeline de conversão estava gerando itens duplicados no JSON final do Elementor quando o Agente IA era utilizado.
 
 **Causa Raiz:**
 A análise dos logs e do `README.md` revelou que a duplicação era causada por uma combinação de fatores:
 1.  O Agente IA, em seu processo de geração do schema intermediário, criava representações duplicadas para um mesmo nó do Figma.
 2.  A etapa de "resgate de nós faltantes", que visa garantir que nenhum nó seja ignorado, acabava reintroduzindo nós que já haviam sido processados (e duplicados) pela IA.
 
 **Solução Implementada (conforme histórico):**
 O problema foi endereçado através de múltiplas atualizações na função `deduplicateContainers()` e no pipeline:
 - A função foi refatorada para preservar apenas a primeira ocorrência de cada container, baseando-se no `styles.sourceId` para uma identificação mais precisa.
 - A execução da deduplicação foi movida para *após* a etapa de resgate de nós, garantindo a remoção final de todas as duplicatas antes da compilação do JSON do Elementor.
 
 ## 04/12/2025: Correção da Compilação de Ícones
 
 **Problema Identificado:**
 Nós do Figma do tipo `IMAGE` e nomeados como `w:icon` estavam sendo incorretamente compilados como `containers` vazios no JSON final do Elementor, em vez de `widgets` de ícone.
 
 **Solução Implementada:**
 - Foi criada a função `compileIconWidget` no novo arquivo `src/compiler-utils.ts` para centralizar e corrigir a lógica de compilação de ícones.
 - O `Agente Compiler` foi atualizado para usar esta nova função, garantindo que os nós `w:icon` sejam convertidos para a estrutura correta do widget de ícone do Elementor, incluindo o objeto `selected_icon` com a URL do SVG e a `library` correta.
 - Esta correção resolve o problema de ícones que não apareciam ou quebravam a estrutura do layout no Elementor.