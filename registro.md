# Registro de Alteracoes

- 30/11/2025: Normalizacao de slides dos carrosseis (`image-carousel`, `media:carousel`, `slider:slides`, `w:slideshow`) agora converte IDs para numericos e replica URL/objeto `image`, garantindo que as imagens aparecam na UI do Elementor.
- 30/11/2025: `selected_icon` agora segue o formato oficial do Elementor (`{ value: { url, id }, library: 'svg' }`) usando o ID de midia quando presente, evitando icones SVG que apareciam em branco.
- 30/11/2025: Containers boxer preservam padding/altura do pai e agora mapeiam `min_height` para o Elementor, evitando perda de espacamento vertical ao descartar o wrapper interno.
- 30/11/2025: Carrosseis nomeados como `media:carousel`, `slider:slides` e `w:slideshow` sao compilados como `image-carousel` com slides validos, eliminando erros de importacao no Elementor.
- 30/11/2025: Cores de texto preservadas: `heading` e `text-editor` agora recebem `title_color`/`text_color` no registry, impedindo sobrescrita pelo tema.
- 30/11/2025: Regra de container boxer aplicada (pai >=1440 com inner menor gera container boxed e elimina wrapper interno mantendo filhos e estilos principais); icones exportados normalizados para `library: svg` em icon, icon-box e itens de icon-list quando recebem URLs.
- 30/11/2025: Alinhamentos dos containers agora respeitam `justify_content`/`align_items` do Figma antes de aplicar defaults no compiler.
- 30/11/2025: Ajuste de compatibilidade: alinhamentos passaram a usar `flex-start`/`flex-end` (Elementor), eliminando perdas de alinhamento na importacao.
- 30/11/2025: Compatibilidade adicional: `flex_justify_content`/`flex_align_items` e flags `flex__is_row`/`flex__is_column` sao preenchidas para refletir alinhamentos na UI do Elementor.
- 30/11/2025: Ajustado formato raiz do JSON Elementor (type elementor, version 0.4, elements) e bridge de copia para colagem direta; validacao atualizada.
- 28/11/2025: Suporte ao provedor GPT (OpenAI) adicionado com fallback e selecao automatica.
- 28/11/2025: Correcao na autenticacao WP (base64) e adicao de User-Agent.
- 30/11/2025: JSON gerado (IA on/off) agora sempre preenche o textarea de saida.
- 29/11/2025: Correcao critica para frames trancados (exportados como imagem unica) e upload de imagens (respeitando checkbox); suporte NO-AI ajustado; UI readonly (apenas preview); fluxos de JSON separados; otimizacao de performance (uploads paralelos); reimplementacao do handler de upload na UI (correcao de falha silenciosa); correcoes de estilo (icones SVG, tipografia, bordas, texto rico) unificadas para modos AI e NO-AI via style_utils.ts.
