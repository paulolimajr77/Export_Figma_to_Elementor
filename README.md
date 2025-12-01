# FigToEL � Figma to Elementor Converter

![Figma Compatible](https://img.shields.io/badge/Figma-Compatible-blue) ![Elementor Ready](https://img.shields.io/badge/Elementor-3.19%2B-brightgreen) ![WordPress](https://img.shields.io/badge/WordPress-REST%20API%20Ready-informational)

Transforme layouts do Figma em paginas Elementor completas, com exportacao automatica para WordPress e widgets avancados.
[Acesse o site comercial](https://figtoel.example.com)

---

## Descricao Geral
FigToEL e um plugin comercial que converte designs do Figma em paginas Elementor com alta fidelidade. Le a estrutura do frame, cria containers Flexbox, mapeia widgets automaticamente, envia imagens para a midia do WordPress e usa IA (Gemini) para interpretar layouts complexos. Funciona com Elementor e Elementor Pro.

---

## Como Instalar (Versao Comercial)
1. Abra o Figma Desktop e va em **Plugins -> Manage Plugins**.
2. Clique em **Import plugin from manifest**.
3. Selecione o arquivo `manifest.json` fornecido na sua conta FigToEL.
4. O plugin aparecera no painel de Plugins do Figma.

---

## Requisitos do Produto
- Figma Desktop
- Chave da API Gemini (para IA)
- Elementor 3.19+
- Elementor Pro (para slides, tabs, accordion, loop grid)
- WordPress com REST API ativa (para exportacao automatica)

## OpenAI / GPT
- Como habilitar: na aba \"Configuracao da IA\" selecione \"GPT (OpenAI)\" no dropdown de provedor de IA.
- Como inserir a API Key: cole a chave no campo \"OpenAI API Key\"; o plugin grava em clientStorage seguro do Figma.
- Como testar a conexao: clique em \"Testar conexao\" na area do GPT para validar a chave e ver o status na UI.
- Modelos suportados:
  - gpt-4.1
  - gpt-o1
  - gpt-mini
- Fallback: o pipeline usa sempre o provedor selecionado para gerar o schema Flex; ao trocar de provedor todo o fluxo IA -> schema -> compiler segue a escolha ativa.

---

## Como Usar (Fluxo do Usuario)
1. Abra seu layout no Figma.
2. Selecione um frame.
3. Abra o plugin **FigToEL**.
4. Clique em **Inspecionar Layout**.
5. Revise o preview detectado.
6. Clique em **Gerar JSON Elementor**.
7. Copie ou exporte diretamente para o WordPress.

Dica de saida:
- O JSON final (com ou sem IA) aparece automaticamente no campo "JSON gerado..." (textarea figma-json-output) pronto para copiar/colar no Elementor.

Acoes de exportacao:
- **Copiar JSON**
- **Baixar JSON**
- **Exportar para WordPress automaticamente**

---

## Recursos e Beneficios
- Conversao fiel do Figma para Elementor com containers Flexbox.
- Suporte a widgets avancados (image box, icon box, slides, tabs, accordion, galleries, loop grid).
- Exportacao automatica de midia para WordPress.
- Exportacao 1-click de paginas completas.
- Fallback inteligente para evitar perda de elementos.
- UI moderna com tema claro/escuro.

## Modo sem IA (NO-AI)
- Como ativar/desativar: na aba "Configuração da IA", desmarque "Usar IA para conversão".
- O que acontece: o pipeline usa heurísticas determinísticas (sem chamadas de IA) para mapear containers flex e widgets básicos (heading, text-editor, image, button, icon, image-box, icon-box, basic-gallery, icon-list) com fallback para w:custom.
- Limitações: não expande widgets avançados (Pro/Woo/Loop) quando em modo NO-AI; se não reconhecer, retorna w:custom.
- Fluxo completo: seleção do frame → Inspecionar Layout → Gerar JSON (com IA ligada ou desligada) → copiar/baixar/exportar WP.
- Validação: JSON segue o schema flex; containers e widgets preservam ordem e ids; background/padding/gap alinhados ao layout.

---

## Notas de versao (backup recente)
- Ajuste de SVGs: `selected_icon` agora segue o formato do Elementor (`{ value: { url, id }, library: 'svg' }`) quando a origem e URL/upload do WordPress, evitando �cones brancos mesmo com ID de m�dia.
- Containers boxed preservam padding/altura: o pai com largura >=1440 mantem padding/altura originais, usa apenas a largura do inner e mapeia `min_height` para o Elementor.
- Carrosseis: `media:carousel`, `slider:slides` e `slideshow` passam a ser exportados como `image-carousel` com `slides` v�lidos (incluindo objeto `image`), evitando erros de importacao e lista vazia.
- Slides de carrossel: IDs agora sao convertidos para numericos e URLs/objetos image sao garantidos, fazendo as imagens aparecerem no widget do Elementor.
- Regra de container boxer: frames >=1440px com inner menor agora viram containers `boxed` em Elementor, herdando largura/gap/padding/alinhamento do inner e reaproveitando apenas os filhos internos (sem descartar nenhum node).
- Correcao de icones exportados: widgets `icon`, `icon-box` e itens de `icon-list` normalizam automaticamente `selected_icon` para `library: svg` quando o valor e URL, evitando icones vazios mesmo com a URL setada.
- Correcao de cores de texto: widgets `heading` e `text-editor` agora recebem `title_color`/`text_color` ao compilar pelo registry, evitando que a cor do tema sobrescreva a cor exportada do layout.
- Alinhamentos de containers preservados: `justify_content` e `align_items` extraídos do Figma são respeitados no compiler antes dos defaults, evitando que containers caiam para `start/start`.
- Normalizacao de flex-start/flex-end: alinhamentos dos containers agora usam valores `flex-start`/`flex-end`, compatíveis com o Elementor, evitando perda de alinhamento ao importar.
- Compat extra Elementor: `flex_justify_content`/`flex_align_items` e flags `flex__is_row`/`flex__is_column` passam a ser preenchidas para refletir alinhamentos na UI do Elementor.
- Normalizacao do JSON Elementor para colagem/importacao: raiz agora inclui `type: elementor`, `version` 0.4 e `elements`, e o bridge de copia envia o objeto completo pronto para colar.
- Pipeline, schema e compiler migrados para Containers Flex com reconciliacao 1:1 (nenhum node se perde).
- 01/12/2025: Duplicacoes causadas pela IA foram resolvidas: o pipeline reexecuta a deduplicacao apos o resgate de nodes faltantes, garantindo que cada node do Figma apareca apenas uma vez no JSON final.
- 02/12/2025: Corrigido erro runtime (`this.deduplicateContainers is not a function`) recompilando o dist e expondo novamente o método, garantindo que o pipeline normalize containers sem falhar.
- 03/12/2025: O deduplicador agora agrupa containers por `styles.sourceId` (quando presente) antes de gerar o JSON Elementor, eliminando duplicatas do mesmo node geradas pela IA.
- Registry simplificado para widgets basicos e hints leves; tipos legados removidos (sections/columns/imageBox/iconBox).
- Validacao forte de schema e JSON Elementor para manter apenas containers e widgets permitidos.
- **Unificação de Estilos:** Lógica de extração de estilos centralizada em `style_utils.ts` para consistência entre modos AI e NO-AI.
    - `flex_gap` com valores de string e campo `size`.
    - IDs de imagem seguros (`""` em vez de `null` ou `0`) em todos os widgets de mídia.
    - Inclusão de `isLocked` e `defaultEditSettings`.

---

## Capturas de Tela / GIFs
![Preview](assets/preview.png)
![Pipeline](assets/pipeline.png)

---

## Planos e Assinatura
- **Starter** � para freelancers iniciando no Elementor.
- **Pro** � para agencias com multiplos projetos.
- **Agency** � para equipes grandes e alto volume de exportacoes.

[Escolha seu plano](https://figtoel.example.com/pricing) (link placeholder).

---

## Suporte e Contato
- Suporte: support@figtoel.example.com (placeholder)
- Documentacao: https://figtoel.example.com/docs
- Central de ajuda: https://figtoel.example.com/help

---

## Aviso Legal / Licenciamento Comercial
Este plugin e distribuido apenas como produto comercial. O codigo-fonte nao faz parte da distribuicao publica. Uso nao autorizado, distribuicao ou engenharia reversa nao sao permitidos.

---

## Notas de manuten��o (interno)
# FigToEL  Figma to Elementor Converter

![Figma Compatible](https://img.shields.io/badge/Figma-Compatible-blue) ![Elementor Ready](https://img.shields.io/badge/Elementor-3.19%2B-brightgreen) ![WordPress](https://img.shields.io/badge/WordPress-REST%20API%20Ready-informational)

Transforme layouts do Figma em paginas Elementor completas, com exportacao automatica para WordPress e widgets avancados.
[Acesse o site comercial](https://figtoel.example.com)

---

## Descricao Geral
FigToEL e um plugin comercial que converte designs do Figma em paginas Elementor com alta fidelidade. Le a estrutura do frame, cria containers Flexbox, mapeia widgets automaticamente, envia imagens para a midia do WordPress e usa IA (Gemini) para interpretar layouts complexos. Funciona com Elementor e Elementor Pro.

---

## Como Instalar (Versao Comercial)
1. Abra o Figma Desktop e va em **Plugins -> Manage Plugins**.
2. Clique em **Import plugin from manifest**.
3. Selecione o arquivo `manifest.json` fornecido na sua conta FigToEL.
4. O plugin aparecera no painel de Plugins do Figma.

---

## Requisitos do Produto
- Figma Desktop
- Chave da API Gemini (para IA)
- Elementor 3.19+
- Elementor Pro (para slides, tabs, accordion, loop grid)
- WordPress com REST API ativa (para exportacao automatica)

## OpenAI / GPT
- Como habilitar: na aba \"Configuracao da IA\" selecione \"GPT (OpenAI)\" no dropdown de provedor de IA.
- Como inserir a API Key: cole a chave no campo \"OpenAI API Key\"; o plugin grava em clientStorage seguro do Figma.
- Como testar a conexao: clique em \"Testar conexao\" na area do GPT para validar a chave e ver o status na UI.
- Modelos suportados:
  - gpt-4.1
  - gpt-o1
  - gpt-mini
- Fallback: o pipeline usa sempre o provedor selecionado para gerar o schema Flex; ao trocar de provedor todo o fluxo IA -> schema -> compiler segue a escolha ativa.

---

## Como Usar (Fluxo do Usuario)
1. Abra seu layout no Figma.
2. Selecione um frame.
3. Abra o plugin **FigToEL**.
4. Clique em **Inspecionar Layout**.
5. Revise o preview detectado.
6. Clique em **Gerar JSON Elementor**.
7. Copie ou exporte diretamente para o WordPress.

Dica de saida:
- O JSON final (com ou sem IA) aparece automaticamente no campo "JSON gerado..." (textarea figma-json-output) pronto para copiar/colar no Elementor.

Acoes de exportacao:
- **Copiar JSON**
- **Baixar JSON**
- **Exportar para WordPress automaticamente**

---

## Recursos e Beneficios
- Conversao fiel do Figma para Elementor com containers Flexbox.
- Suporte a widgets avancados (image box, icon box, slides, tabs, accordion, galleries, loop grid).
- Exportacao automatica de midia para WordPress.
- Exportacao 1-click de paginas completas.
- Fallback inteligente para evitar perda de elementos.
- UI moderna com tema claro/escuro.

## Modo sem IA (NO-AI)
- Como ativar/desativar: na aba "Configuração da IA", desmarque "Usar IA para conversão".
- O que acontece: o pipeline usa heurísticas determinísticas (sem chamadas de IA) para mapear containers flex e widgets básicos (heading, text-editor, image, button, icon, image-box, icon-box, basic-gallery, icon-list) com fallback para w:custom.
- Limitações: não expande widgets avançados (Pro/Woo/Loop) quando em modo NO-AI; se não reconhecer, retorna w:custom.
- Fluxo completo: seleção do frame → Inspecionar Layout → Gerar JSON (com IA ligada ou desligada) → copiar/baixar/exportar WP.
- Validação: JSON segue o schema flex; containers e widgets preservam ordem e ids; background/padding/gap alinhados ao layout.

---

## Notas de versao (backup recente)
- Ajuste de SVGs: `selected_icon` agora segue o formato do Elementor (`{ value: { url, id }, library: 'svg' }`) quando a origem e URL/upload do WordPress, evitando cones brancos mesmo com ID de mdia.
- Containers boxed preservam padding/altura: o pai com largura >=1440 mantem padding/altura originais, usa apenas a largura do inner e mapeia `min_height` para o Elementor.
- Carrosseis: `media:carousel`, `slider:slides` e `slideshow` passam a ser exportados como `image-carousel` com `slides` vlidos (incluindo objeto `image`), evitando erros de importacao e lista vazia.
- Slides de carrossel: IDs agora sao convertidos para numericos e URLs/objetos image sao garantidos, fazendo as imagens aparecerem no widget do Elementor.
- Regra de container boxer: frames >=1440px com inner menor agora viram containers `boxed` em Elementor, herdando largura/gap/padding/alinhamento do inner e reaproveitando apenas os filhos internos (sem descartar nenhum node).
- Correcao de icones exportados: widgets `icon`, `icon-box` e itens de `icon-list` normalizam automaticamente `selected_icon` para `library: svg` quando o valor e URL, evitando icones vazios mesmo com a URL setada.
- Correcao de cores de texto: widgets `heading` e `text-editor` agora recebem `title_color`/`text_color` ao compilar pelo registry, evitando que a cor do tema sobrescreva a cor exportada do layout.
- Alinhamentos de containers preservados: `justify_content` e `align_items` extraídos do Figma são respeitados no compiler antes dos defaults, evitando que containers caiam para `start/start`.
- Normalizacao de flex-start/flex-end: alinhamentos dos containers agora usam valores `flex-start`/`flex-end`, compatíveis com o Elementor, evitando perda de alinhamento ao importar.
- Compat extra Elementor: `flex_justify_content`/`flex_align_items` e flags `flex__is_row`/`flex__is_column` passam a ser preenchidas para refletir alinhamentos na UI do Elementor.
- Normalizacao do JSON Elementor para colagem/importacao: raiz agora inclui `type: elementor`, `version` 0.4 e `elements`, e o bridge de copia envia o objeto completo pronto para colar.
- Pipeline, schema e compiler migrados para Containers Flex com reconciliacao 1:1 (nenhum node se perde).
- 01/12/2025: Duplicacoes causadas pela IA foram resolvidas: o pipeline reexecuta a deduplicacao apos o resgate de nodes faltantes, garantindo que cada node do Figma apareca apenas uma vez no JSON final.
- 02/12/2025: Corrigido erro runtime (`this.deduplicateContainers is not a function`) recompilando o dist e expondo novamente o método, garantindo que o pipeline normalize containers sem falhar.
- 03/12/2025: O deduplicador agora agrupa containers por `styles.sourceId` (quando presente) antes de gerar o JSON Elementor, eliminando duplicatas do mesmo node geradas pela IA.
- Registry simplificado para widgets basicos e hints leves; tipos legados removidos (sections/columns/imageBox/iconBox).
- Validacao forte de schema e JSON Elementor para manter apenas containers e widgets permitidos.
- **Unificação de Estilos:** Lógica de extração de estilos centralizada em `style_utils.ts` para consistência entre modos AI e NO-AI.
    - `flex_gap` com valores de string e campo `size`.
    - IDs de imagem seguros (`""` em vez de `null` ou `0`) em todos os widgets de mídia.
    - Inclusão de `isLocked` e `defaultEditSettings`.

---

## Capturas de Tela / GIFs
![Preview](assets/preview.png)
![Pipeline](assets/pipeline.png)

---

## Planos e Assinatura
- **Starter**  para freelancers iniciando no Elementor.
- **Pro**  para agencias com multiplos projetos.
- **Agency**  para equipes grandes e alto volume de exportacoes.

[Escolha seu plano](https://figtoel.example.com/pricing) (link placeholder).

---

## Suporte e Contato
- Suporte: support@figtoel.example.com (placeholder)
- Documentacao: https://figtoel.example.com/docs
- Central de ajuda: https://figtoel.example.com/help

---

## Aviso Legal / Licenciamento Comercial
Este plugin e distribuido apenas como produto comercial. O codigo-fonte nao faz parte da distribuicao publica. Uso nao autorizado, distribuicao ou engenharia reversa nao sao permitidos.

---

## Notas de manuteno (interno)
- 28/11/2025: ajustes de UI (toggle sem localStorage em sandbox, handle de resize visvel e icone atualizado), fallback de timeout sem AbortController e normalizao de URL no teste WordPress; build atualizado.
- 28/11/2025 (tarde): logs verbosos para teste/export WP (endpoint, usurio, tamanho do token) e normalizao de token (remoo de espaos); build atualizado.
- 28/11/2025 (noite): correo da UI (barra de progresso e seleo de modelo Gemini) substituindo script inline obsoleto pela lgica correta do ui.js; build atualizado.
- 28/11/2025 (noite): melhorias de feedback (logs com timestamp, alertas de erro visveis) e ajuste na API Gemini (modelos 2.0-flash-exp/1.5 e limite de tokens aumentado para 16k); build atualizado.
- 28/11/2025 (noite): refatorao completa do pipeline para "Naming Mode" (reduo drstica de tokens, payload simplificado para IA, remoo de modelos invlidos); build atualizado.
- 28/11/2025 (tarde 2): feedback de reset na UI (limpa sada/logs) e build recompilado.
- 28/11/2025 (noite): correo crtica na autenticao WP (substituio da funo toBase64 quebrada por implementao robusta) e adio de User-Agent para evitar bloqueios de segurana; build atualizado.
- 30/11/2025: UI garante que o JSON gerado (IA on/off) preenche o textarea figma-json-output e fica selecionado para copia; build recompilado.
- 30/11/2025 (tarde): **Correção crítica da duplicação de nós**: Refatoração da função `deduplicateContainers()` em `pipeline.ts` para prevenir duplicação de elementos no JSON final. A função agora preserva apenas a primeira ocorrência de cada container, eliminando a concatenação indevida de widgets e children que causava elementos duplicados. Incluído merge inteligente de estilos sem duplicar conteúdo. Build atualizado.
- 29/11/2025: Correção crítica para frames trancados (agora exportados como imagem única) e upload de imagens (respeitando checkbox da UI); suporte a NO-AI para frames trancados; proteção readonly no textarea de preview (#output); separação clara entre JSON de preview (Figma) e JSON final (Elementor); otimização de performance com uploads de imagem em paralelo; correção de falha no upload (handler restaurado na UI); melhoria no suporte a estilos (ícones SVG, tipografia completa, bordas, texto rico/HTML) com lógica unificada para AI e NO-AI.
- 30/11/2025 (noite): **Restauração da UI**: Reconstrução completa do arquivo `ui.html` para corrigir erros estruturais, restaurar funções perdidas (`window.onmessage`, `send`, `initTheme`) e garantir a estabilidade da interface do plugin.
- 30/11/2025 (noite): **Melhorias na UI de Logs**: Unificação do estilo dos textareas de saída e logs para consistência visual. Adicionado botão "Baixar Logs" para permitir salvar o histórico de execução em arquivo `.txt`.
