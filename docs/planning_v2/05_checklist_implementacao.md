# 5. Checklist de Implementação: Engenharia

## Fase 1: Core Engine (Fundação)
**Objetivo**: Criar a lógica `src/engine` isolada, sem quebrar o plugin atual.

- [ ] Criar Scaffold de diretórios (`src/engine/features`, `src/engine/zones`, etc).
- [ ] **FeatureExtractor**: Implementar normalização de `SceneNode`.
    - *Teste*: Unit test com mock de nós complexos (Vectors, Groups).
- [ ] **ZoneDetector**: Implementar lógica Y-axis.
    - *Teste*: Mock de frame de 3000px e verificar se Y:2900 é Footer.
- [ ] **HeuristicRegistry**: Portar lógica de detecção de Botão atual para nova interface.

## Fase 2: Unificação (Backend)
**Objetivo**: Fazer o Exportador (No-AI) usar a nova engine.

- [ ] **Shadow Mode**: Rodar `WidgetEngine` em paralelo com Parser antigo e logar diferenças (`console.warn`).
- [ ] **Switch**: Alterar `src/pipeline/noai.parser.ts` para usar `WidgetEngine.analyze()`.
- [ ] **Validação**: Testar exportação de 3 arquivos complexos antigos. O HTML gerado deve ser igual ou melhor (mais widgets nativos).
- [ ] **Limpeza**: Remover `WidgetDetector` antigo (V1).

## Fase 3: Nova UI (Frontend)
**Objetivo**: UX overhaul.

- [ ] **React/HTML**: Criar componentes `HealthRing`, `IssueCard`, `IssueGroup`.
- [ ] **State Management**: Implementar lógica de `expanded/collapsed` e filtros.
- [ ] **Communication**: Implementar handlers de `fixIssue` no `code.ts` para receber comandos da UI.
- [ ] **Telemetry**: (Opcional) Logar quanto o Health Score sobe após uso do Linter.

## Fase 4: Otimização
**Objetivo**: Performance e Inteligência.

- [ ] **Async Batching**: Se nodeCount > 500, processar em chunks de 50 nós para não travar a UI.
- [ ] **Calibration**: Ajustar pesos das heurísticas baseado em feedback interno de "falsos positivos".
