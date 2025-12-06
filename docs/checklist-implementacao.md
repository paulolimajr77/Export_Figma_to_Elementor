# Checklist de Implementação: Modernização do Lint (RFC-001)

Este documento detalha o plano de execução para a modernização do framework de Lint & Heurísticas.

---

## Fase 1: Fundação (Core Engine)
*O objetivo desta fase é criar a lógica "cerebral" nova sem quebrar o plugin atual. Trabalharemos em paralelo, criando os módulos novos enquanto o plugin usa os velhos.*

- [ ] **Criar estrutura de diretórios `src/engine`**
    - Necessário para isolar a nova arquitetura unificada e evitar dependências circulares com o código legado.
- [ ] **Implementar `FeatureExtractor`**
    - Portar lógica de extração de `src/linter/detectors/WidgetDetector.ts`.
    - *Porquê*: Precisamos de um extrator puro que retorne dados (ex: `hasImage: true`) sem opinar sobre o que é o widget.
- [ ] **Implementar `ZoneDetector` (Novo)**
    - Criar lógica que recebe `nodeY` e `rootHeight` e retorna `HEADER`, `HERO`, `BODY`, ou `FOOTER`.
    - *Porquê*: O contexto de posição reduz drasticamente falsos positivos (ex: menu vs lista).
- [ ] **Migrar Regras de `noai.parser.ts` para `HeuristicRegistry`**
    - Transformar os `if`s gigantes do parser atual em regras modulares e testáveis.
    - *Porquê*: Centralizar a lógica. Se a regra de "Botão" muda, muda para todos.

## Fase 2: Refatoração & Limpeza
*Nesta fase, substituímos as peças antigas pelas novas.*

- [ ] **Substituir lógica em `analyzeFigmaLayout` (Linter)**
    - Fazer o Linter UI consumir o novo `HeuristicRegistry` em vez do antigo `WidgetDetector`.
    - *Porquê*: Validar a nova engine com feedback visual imediato.
- [ ] **Remover código duplicado**
    - Apagar `src/linter/detectors` e limpar `src/services/heuristics`.
    - *Porquê*: Reduzir dívida técnica e confusão. "Single source of truth".
- [ ] **Criar Testes de Regressão**
    - Selecionar 5 layouts complexos de teste. Comparar o output da Engine V1 vs Engine V2.
    - *Porquê*: Garantir que não quebramos detecções que já funcionavam (ex: grids).

## Fase 3: UX & UI Modernas (Painel)
*Melhoria da experiência do usuário no plugin.*

- [ ] **Reescrever renderização em `ui.html`**
    - Implementar sistema de Acordeão (Collapsible) para os cards de erro.
    - *Porquê*: Resolver o problema de scroll infinito e sobrecarga cognitiva.
- [ ] **Implementar Cálculo de "Health Score"**
    - Criar função JS que soma penalidades e exibe nota 0-100.
    - *Porquê*: Gamificação incentiva o usuário a limpar o arquivo.
- [ ] **Adicionar Filtros de Categoria**
    - Criar tabs/botões para filtrar view por [All, Structure, Naming, Widgets].
    - *Porquê*: Permitir que o dev foque só em estrutura e o designer só em nomes.
- [ ] **Implementar "Quick Fix" Bidirecional**
    - Fazer botões "Fix" na UI enviarem comando `postMessage` para o `code.ts` executar a correção.
    - *Porquê*: Transformar o linter de passivo para ativo.

## Fase 4: Integração & Finalização
*Conectar a ponta final: a exportação de código.*

- [ ] **Conectar Exportador JSON à Nova Engine**
    - Atualizar a pipeline de "Convert to Elementor" para usar `DecisionEngine.resolve()`.
    - *Porquê*: Garantir que o JSON exportado bata 100% com o que o Linter mostrou.
- [ ] **Validar Exportação No-AI**
    - Exportar layouts reais usando a nova engine e verificar integridade no Elementor.
    - *Porquê*: Prova real de funcionalidade.
- [ ] **Atualizar Documentação de Usuário**
    - Explicar o novo "Health Score" e como usar os Quick Fixes no README ou Help do plugin.
