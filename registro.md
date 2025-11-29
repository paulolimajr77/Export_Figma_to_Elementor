# registro de alteracoes

- 28/11/2025: Suporte ao provedor GPT (OpenAI) adicionado com camada api_openai.ts, selecao de provedor na UI, handlers de teste e pipeline usando provider dinamico.
- 28/11/2025: UI ajustada para escolher provedor (Gemini ou GPT), persistir chaves, exibir status dedicados e CSS com exibicao condicional dos blocos.
- 28/11/2025: Novo teste automatizado (src/tests/gpt.spec.ts), README com secao OpenAI/GPT, build recompilado e dependencias instaladas para executar vitest.
- 28/11/2025: Correcoes de texto da UI para remover caracteres corrompidos (acentos/emoji) mantendo labels legiveis no Figma.
- 28/11/2025: Reaplicacao de acentuacao correta na UI (portugues BR) usando entidades HTML para evitar quebra de encoding.
- 29/11/2025: Ajuste no provedor OpenAI para sempre mencionar "json" nas mensagens (conforme requisito do response_format), evitando erro ao testar conexao.
- 29/11/2025: UI reforcada com seletor de provedor IA, modelos GPT detalhados e persistencia em aiProvider/gptApiKey/gptModel; test OpenAI mapeando 401/404/429; pipeline alterna Gemini/GPT conforme configuracao.
- 29/11/2025: Fallback para containers sem auto layout/tipo invalido: mantidos como flex column quando auto_fix_layout estiver ativo, em vez de converter para custom.
- 29/11/2025: Checkbox na UI para habilitar auto_fix_layout persistente e protecao da copia (clipboard opcional).
- 29/11/2025: Ajuste de compatibilidade de paste: siteurl preenchido, flex_gap default, alinhamentos default e isLocked=false nos containers/widgets.
- 29/11/2025: Registry expandido com schemas minimos para widgets basicos (video, divider, spacer, rating, tabs/accordion/toggle, galerias, nav-menu, maps, lottie), tipagem de PipelineWidget aberta para todos os tipos e validacao ajustada; compileWidget agora marca widgets como desbloqueados via registry; tests vitest executados.
- 29/11/2025: Prompts atualizados para listar todos os widgets suportados (básicos, Pro, Woo, Loop, WP) e reforçar fallback para "custom"; instruções de containers flex preservadas.
- 29/11/2025: UI recebe checkbox "Usar IA" (default on), esconde campos de IA quando desativado, persiste gptel_use_ai e envia valor ao pipeline; ajustes em ui.html/ui.js.
- 29/11/2025: code.ts passa a despachar pipeline NO-AI quando useAI=false, com placeholders do noai.parser.ts (fase 3); configuração useAI carregada/enviada nos settings.
- 29/11/2025: NO-AI heurístico implementado (detecta containers, heading/text/button/image/icon, image-box, icon-box, basic-gallery, icon-list, fallback custom) gerando schema flex; testes automatizados adicionados em src/tests/noai.spec.ts.
