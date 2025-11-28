# FigToEL — Figma to Elementor Converter

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

---

## Como Usar (Fluxo do Usuario)
1. Abra seu layout no Figma.
2. Selecione um frame.
3. Abra o plugin **FigToEL**.
4. Clique em **Inspecionar Layout**.
5. Revise o preview detectado.
6. Clique em **Gerar JSON Elementor**.
7. Copie ou exporte diretamente para o WordPress.

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

---
\n## Notas de versao (backup recente)\n- Pipeline, schema e compiler migrados para Containers Flex com reconciliacao 1:1 (nenhum node se perde).\n- Registry simplificado para widgets basicos e hints leves; tipos legados removidos (sections/columns/imageBox/iconBox).\n- Validacao forte de schema e JSON Elementor para manter apenas containers e widgets permitidos.\n- UI refeita com tabs, tema claro/escuro consistente e persistencia de Gemini/WP corrigida.\n- Integracoes Gemini/WP alinhadas ao fluxo de containers flex; exportacao WP implementada com criacao de pagina rascunho e teste de credenciais.\n
---

## Capturas de Tela / GIFs
![Preview](assets/preview.png)
![Pipeline](assets/pipeline.png)

---

## Planos e Assinatura
- **Starter** — para freelancers iniciando no Elementor.
- **Pro** — para agencias com multiplos projetos.
- **Agency** — para equipes grandes e alto volume de exportacoes.

[Escolha seu plano](https://figtoel.example.com/pricing) (link placeholder).

---

## Suporte e Contato
- Suporte: support@figtoel.example.com (placeholder)
- Documentacao: https://figtoel.example.com/docs
- Central de ajuda: https://figtoel.example.com/help

---

## Aviso Legal / Licenciamento Comercial
Este plugin e distribuido apenas como produto comercial. O codigo-fonte nao faz parte da distribuicao publica. Uso nao autorizado, distribuicao ou engenharia reversa nao sao permitidos.


