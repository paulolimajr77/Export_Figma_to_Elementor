# Tarefas: Módulo de Linter Estrutural

## Análise e Planejamento
- [x] Analisar roteiro proposto
- [x] Identificar problemas e limitações
- [x] Propor melhorias arquiteturais
- [x] Criar plano de implementação
- [x] Revisar plano com usuário
- [x] Implementar Core + Regras Básicas
  - [x] LinterEngine, RuleRegistry, ResultAggregator
  - [x] **UX Interativa Completa:**
    - [x] Painel lateral com lista de problemas
    - [x] Seleção automática de node ao clicar no problema
    - [x] Zoom automático no node selecionado
    - [x] Exibição de guia contextual
    - [x] Botões: "✅ Marcar como Resolvido", "⏭️ Próximo", "❌ Ignorar"
    - [x] Sistema de guias passo-a-passo
  - [ ] Validação de correções (re-análise de node individual)
  - [ ] Feedback visual (✅ resolvido / ⚠️ ainda com problema)
  - [ ] Detecção de padrões dinâmicos
- [ ] Adicionar sistema de confiança (confidence score)
- [ ] Validar contra JSON Elementor gerado
- [ ] Testes para detecção de widgets
  - [ ] Casos de sucesso
  - [ ] Casos de borda
  - [ ] Falsos positivos

## Fase 3: Correções Automáticas
- [ ] Implementar `AutoLayoutFixer.ts`
  - [ ] Detectar direção (vertical/horizontal)
  - [ ] Aplicar Auto Layout
  - [ ] Ajustar spacing e padding
- [ ] Implementar `NamingFixer.ts`
  - [ ] Renomeação baseada em heurísticas
  - [ ] Integração com IA para sugestões
- [ ] Implementar `TokenFixer.ts`
  - [ ] Sugerir criação de tokens de cor
  - [ ] Sugerir criação de tokens de tipografia
- [ ] Adicionar sistema de rollback
  - [ ] Snapshot antes de aplicar fix
  - [ ] Validação pós-fix
  - [ ] Restauração em caso de falha
- [ ] Adicionar confirmação do usuário
  - [ ] Modal com preview das mudanças
  - [ ] Opção de aplicar individualmente ou em lote
- [ ] Testes para auto-fixes
  - [ ] Validação de correções
  - [ ] Testes de rollback
  - [ ] Testes de validação pós-fix

## Fase 4: Integração com IA
- [ ] Criar prompts especializados
  - [ ] Prompt para sugestões de nomenclatura
  - [ ] Prompt para detecção de padrões complexos
  - [ ] Prompt para refatoração de hierarquia
- [ ] Implementar `AIAssistant.ts`
  - [ ] Integração com Gemini
  - [ ] Integração com OpenAI
  - [ ] Fallback para heurísticas
- [ ] Implementar cache de sugestões
  - [ ] Template HTML responsivo
  - [ ] Visualização interativa de issues
  - [ ] Gráficos de distribuição (severidade, categoria)
- [ ] Implementar `JSONReporter.ts`
  - [ ] Formato estruturado
  - [ ] Compatibilidade com ferramentas externas
- [ ] Implementar `ConsoleReporter.ts`
- [ ] Testes de UI
  - [ ] Renderização de relatórios
  - [ ] Interatividade (filtros, ordenação)
  - [ ] Exportação de arquivos

## Otimizações de Performance
- [ ] Implementar análise incremental
  - [ ] Detectar nodes modificados
  - [ ] Analisar apenas diferenças
- [ ] Implementar paralelização
  - [ ] Web Workers para regras independentes
  - [ ] Pool de workers
- [ ] Implementar cache
  - [ ] `LinterCache.ts`
  - [ ] Hash de nodes
  - [ ] Invalidação inteligente
- [ ] Implementar lazy loading
  - [ ] Analisar nodes visíveis primeiro
  - [ ] Análise sob demanda
- [ ] Benchmarks de performance
  - [ ] Layouts pequenos (<50 nodes)
  - [ ] Layouts médios (50-200 nodes)
  - [ ] Layouts grandes (>200 nodes)

## Documentação
- [ ] Documentação técnica
  - [ ] `LINTER_ARCHITECTURE.md`
  - [ ] `CREATING_RULES.md`
  - [ ] `API_REFERENCE.md`
- [ ] Documentação de usuário
  - [ ] `LINTER_GUIDE.md`
  - [ ] `RULES_REFERENCE.md`
  - [ ] `FAQ.md`
- [ ] Exemplos de código
  - [ ] Criar regra customizada
  - [ ] Criar auto-fix customizado
  - [ ] Integrar com pipeline
- [ ] Atualizar README principal
  - [ ] Adicionar seção sobre linter
  - [ ] Exemplos de uso
  - [ ] Screenshots

## Testes e Validação
- [ ] Testes unitários (>80% cobertura)
  - [ ] Todas as regras
  - [ ] Todos os detectors
  - [ ] Todos os fixers
- [ ] Testes de integração
  - [ ] Pipeline completo
  - [ ] Integração com IA
  - [ ] Integração com UI
- [ ] Testes end-to-end
  - [ ] Layouts reais do Figma
  - [ ] Validação de JSON Elementor
  - [ ] Aplicação de auto-fixes
- [ ] Validação de performance
  - [ ] Tempo de análise <1s para 100 nodes
  - [ ] Uso de memória <100MB
  - [ ] Cache hit rate >70%

## Deploy e Manutenção
- [ ] Preparar para merge
  - [ ] Code review
  - [ ] Resolver conflitos
  - [ ] Atualizar CHANGELOG
- [ ] Versionamento
  - [ ] Tag de versão (v1.0.0)
  - [ ] Release notes
- [ ] Monitoramento
  - [ ] Logs de erros
  - [ ] Métricas de uso
  - [ ] Feedback de usuários
- [ ] Manutenção contínua
  - [ ] Adicionar novas regras
  - [ ] Melhorar detecção de widgets
  - [ ] Otimizar performance
