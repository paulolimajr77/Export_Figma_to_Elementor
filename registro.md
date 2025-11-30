# Registro de Alterações

- 30/11/2025: Ajustado formato raiz do JSON Elementor (type elementor, version 0.4, elements) e bridge de cópia para colagem direta; validação atualizada.
- 28/11/2025: Suporte ao provedor GPT (OpenAI) adicionado com fallback e seleção automática.
- 28/11/2025: Correção na autenticação WP (base64) e adição de User-Agent.
- 30/11/2025: JSON gerado (IA on/off) agora sempre preenche o textarea de saída.
- 29/11/2025: Correção crítica para frames trancados (exportados como imagem única) e upload de imagens (respeitando checkbox); suporte NO-AI ajustado; UI readonly (apenas preview); fluxos de JSON separados; otimização de performance (uploads paralelos); reimplementação do handler de upload na UI (correção de falha silenciosa); correções de estilo (ícones SVG, tipografia, bordas, texto rico) unificadas para modos AI e NO-AI via style_utils.ts.
