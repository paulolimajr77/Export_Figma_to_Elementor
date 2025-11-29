# registro de alteracoes

- 28/11/2025: Suporte ao provedor GPT (OpenAI) adicionado com camada api_openai.ts, selecao de provedor na UI, handlers de teste e pipeline usando provider dinamico.
- 28/11/2025: UI ajustada para escolher provedor (Gemini ou GPT), persistir chaves, exibir status dedicados e CSS com exibicao condicional dos blocos.
- 28/11/2025: Novo teste automatizado (src/tests/gpt.spec.ts), README com secao OpenAI/GPT, build recompilado e dependencias instaladas para executar vitest.
- 28/11/2025: Correcoes de texto da UI para remover caracteres corrompidos (acentos/emoji) mantendo labels legiveis no Figma.
- 28/11/2025: Reaplicacao de acentuacao correta na UI (portugues BR) usando entidades HTML para evitar quebra de encoding.
- 29/11/2025: Ajuste no provedor OpenAI para sempre mencionar "json" nas mensagens (conforme requisito do response_format), evitando erro ao testar conexao.
- 29/11/2025: UI reforcada com seletor de provedor IA, modelos GPT detalhados e persistencia em aiProvider/gptApiKey/gptModel; test OpenAI mapeando 401/404/429; pipeline alterna Gemini/GPT conforme configuracao.
- 29/11/2025: Fallback para containers sem auto layout/tipo invalido: mantidos como flex column quando auto_fix_layout estiver ativo, em vez de converter para custom.
