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
- Pipeline, schema e compiler migrados para Containers Flex com reconciliacao 1:1 (nenhum node se perde).
- Registry simplificado para widgets basicos e hints leves; tipos legados removidos (sections/columns/imageBox/iconBox).
- Validacao forte de schema e JSON Elementor para manter apenas containers e widgets permitidos.
- UI refeita com tabs, tema claro/escuro consistente e persistencia de Gemini/WP corrigida.
- Integracoes Gemini/WP alinhadas ao fluxo de containers flex; exportacao WP implementada com criacao de pagina rascunho e teste de credenciais.
- Bridge de clipboard movido para a UI (textarea + copiar) com postMessage `copy-json`; fallback manual garante colagem no Elementor.
- Heuristicas NO-AI aprimoradas: agrupam wrappers de imagem/galeria/icon-list/image-box/icon-box em um unico widget evitando containers vazios.
- Compiler ampliado para widgets basicos (video, divider, spacer, rating, tabs/accordions, galerias, nav-menu, maps, lottie) com defaults seguros e registry preparado para Pro/Woo/Loop/WordPress.
- Modo "Usar IA" na UI (default ligado); possibilidade de desativar IA e acionar pipeline heuristico (em desenvolvimento).

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
- 28/11/2025: ajustes de UI (toggle sem localStorage em sandbox, handle de resize vis�vel e icone atualizado), fallback de timeout sem AbortController e normaliza��o de URL no teste WordPress; build atualizado.
- 28/11/2025 (tarde): logs verbosos para teste/export WP (endpoint, usu�rio, tamanho do token) e normaliza��o de token (remo��o de espa�os); build atualizado.
- 28/11/2025 (noite): corre��o da UI (barra de progresso e sele��o de modelo Gemini) substituindo script inline obsoleto pela l�gica correta do ui.js; build atualizado.
- 28/11/2025 (noite): melhorias de feedback (logs com timestamp, alertas de erro vis�veis) e ajuste na API Gemini (modelos 2.0-flash-exp/1.5 e limite de tokens aumentado para 16k); build atualizado.
- 28/11/2025 (noite): refatora��o completa do pipeline para "Naming Mode" (redu��o dr�stica de tokens, payload simplificado para IA, remo��o de modelos inv�lidos); build atualizado.
- 28/11/2025 (tarde 2): feedback de reset na UI (limpa sa�da/logs) e build recompilado.
- 28/11/2025 (noite): corre��o cr�tica na autentica��o WP (substitui��o da fun��o toBase64 quebrada por implementa��o robusta) e adi��o de User-Agent para evitar bloqueios de seguran�a; build atualizado.
- 30/11/2025: UI garante que o JSON gerado (IA on/off) preenche o textarea figma-json-output e fica selecionado para copia; build recompilado.
- 29/11/2025: Correção crítica para frames trancados (agora exportados como imagem única) e upload de imagens (respeitando checkbox da UI); suporte a NO-AI para frames trancados; proteção readonly no textarea de preview (#output); separação clara entre JSON de preview (Figma) e JSON final (Elementor); otimização de performance com uploads de imagem em paralelo; correção de falha no upload (handler restaurado na UI); melhoria no suporte a estilos (ícones SVG, tipografia completa, bordas, texto rico/HTML) com lógica unificada para AI e NO-AI.



