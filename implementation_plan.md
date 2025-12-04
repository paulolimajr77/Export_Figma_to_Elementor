# Plano de Análise: Módulo de Linter Estrutural
## **ADDON EDUCATIVO - Orientação de Boas Práticas**

## Resumo Executivo

O módulo de Linter Estrutural é um **addon independente** que analisa layouts do Figma e **orienta** o designer sobre melhorias necessárias para exportação otimizada ao Elementor.

### Princípios do Módulo
1. ✅ **Análise sob demanda** - Botão dedicado "Analisar Layout" na UI
2. ✅ **Orientação, não automação** - Guias passo-a-passo, usuário executa correções
3. ✅ **Foco Desktop/Notebook** - Mobile não é escopo inicial
4. ✅ **Sem IA por padrão** - Heurísticas determinísticas (IA apenas opcional)
5. ✅ **Educação do designer** - Ensinar boas práticas de nomenclatura e estrutura

---

## Ajustes Baseados no Feedback

### 1. Posicionamento no Fluxo

**Solução:**
```
FLUXO DE EXECUÇÃO:
1. Usuário seleciona Frame no Figma
2. Clica em botão "🔍 Analisar Layout" (NOVO)
3. Linter executa análise completa
4. Exibe relatório interativo com:
   - Sumário de problemas
   - Explicações educativas
   - Guias passo-a-passo
5. Usuário corrige manualmente no Figma
6. Re-analisa (opcional)
7. Exporta para Elementor (fluxo normal)
```

### 2. Foco em Desktop Only

**Regras ajustadas:**
- Validação de larguras: 1440px (full) ou 1200px (boxed)
- Sem validação de breakpoints mobile
- Sem validação de constraints responsivos

### 3. Nomenclatura - Orientação Educativa

**Abordagem:**
- Detecta nomes genéricos ("Frame 12", "Rectangle 5")
- Exibe explicação de **por que** nomenclatura importa
- Sugere padrões (Btn/*, Img/*, H1-H6, Card/*)
- Mostra exemplos práticos
- **Não renomeia automaticamente**

### 4. Sem Automação

**Mudança crítica:**
- ❌ Removido: Sistema de auto-fix
- ✅ Adicionado: Guias passo-a-passo manuais
- Cada problema tem instruções detalhadas
- Usuário executa correções no Figma
- Estimativa de tempo e dificuldade

### 5. IA Apenas Opcional

**Configuração:**
- Padrão: Heurísticas determinísticas
- Toggle opcional: "Modo IA Assistida"
- Uso: Sugestões de nomes complexos (caso extremo)
- Disclaimer sobre limitações

---

## Arquitetura do Módulo

### Estrutura de Diretórios

```
/src/linter/
├── index.ts                    # API pública
├── core/
│   ├── LinterEngine.ts         # Motor de validação
│   ├── RuleRegistry.ts         # Registro de regras
│   └── ResultAggregator.ts     # Agregação de resultados
├── rules/
│   ├── structure/
│   │   ├── AutoLayoutRule.ts
│   │   ├── SpacerDetectionRule.ts
│   │   ├── NestingDepthRule.ts
│   │   └── SectionTypeRule.ts (desktop only)
│   ├── design-system/
│   │   ├── ColorTokenRule.ts
│   │   ├── TypographyTokenRule.ts
│   │   └── LineHeightRule.ts
│   ├── naming/
│   │   ├── GenericNameRule.ts (educativo)
│   │   └── TaxonomyRule.ts
│   └── media/
│       ├── VectorGroupRule.ts
│       └── ImageFillRule.ts
├── detectors/
│   ├── WidgetDetector.ts
│   ├── PatternDetector.ts
│   └── JetEngineDetector.ts
├── guides/                      # NOVO: Guias manuais
│   ├── AutoLayoutGuide.ts
│   ├── NamingGuide.ts
│   ├── TokenGuide.ts
│   └── GuideRenderer.ts
├── ai/                          # OPCIONAL
│   ├── NamingSuggester.ts
│   └── AIProvider.ts
└── reporters/
    ├── InteractiveReporter.ts   # UI do plugin
    ├── JSONReporter.ts
    └── HTMLReporter.ts
```

---

## Exemplo de Regra Educativa

### AutoLayoutRule.ts

```typescript
export class AutoLayoutRule implements Rule {
  id = 'auto-layout-required';
  category = 'structure';
  severity = 'critical';
  
  async validate(node: SceneNode): Promise<LintResult | null> {
    if (node.type !== 'FRAME') return null;
    
    const hasChildren = node.children?.length > 0;
    const hasAutoLayout = node.layoutMode !== 'NONE';
    
    if (hasChildren && !hasAutoLayout) {
      return {
        node_id: node.id,
        node_name: node.name,
        severity: 'critical',
        category: 'structure',
        rule: this.id,
        message: `Frame "${node.name}" possui ${node.children.length} filhos mas não usa Auto Layout`,
        educational_tip: `
          ⚠️ Por que isso é crítico?
          
          Frames sem Auto Layout usam posicionamento absoluto, que não é 
          suportado pelo Elementor. Isso causará:
          • Sobreposição de elementos
          • Quebra de layout em diferentes resoluções
          • Dificuldade de manutenção
          
          ✅ Solução:
          Aplicar Auto Layout permite que o Elementor entenda a estrutura
          e gere containers flexíveis e responsivos.
        `
      };
    }
    
    return null;
  }
  
  generateGuide(node: SceneNode): ManualFixGuide {
    return {
      node_id: node.id,
      problem: 'Frame sem Auto Layout',
      severity: 'critical',
      step_by_step: [
        { step: 1, action: 'Selecione o frame no Figma' },
        { step: 2, action: 'Pressione Shift + A (atalho para Auto Layout)' },
        { step: 3, action: 'Ajuste a direção (Vertical ou Horizontal)' },
        { step: 4, action: 'Defina o espaçamento (Gap) entre itens' },
        { step: 5, action: 'Adicione padding interno se necessário' }
      ],
      estimated_time: '1 minuto',
      difficulty: 'easy'
    };
  }
}
```

---

## API Pública

```typescript
export interface LinterOptions {
  rules?: string[];
  severity?: Severity[];
  aiAssisted?: boolean; // Padrão: false
  deviceTarget?: 'desktop'; // Sempre desktop
}

export interface LinterReport {
  summary: {
    total: number;
    critical: number;
    major: number;
    minor: number;
  };
  analysis: LintResult[];
  widgets: WidgetDetection[];
  guides: ManualFixGuide[];
  ai_suggestions?: AISuggestion[];
  metadata: {
    duration: number;
    timestamp: string;
    device_target: 'desktop';
    ai_used: boolean;
  };
}

export async function analyzeFigmaLayout(
  node: SceneNode,
  options: LinterOptions = { aiAssisted: false, deviceTarget: 'desktop' }
): Promise<LinterReport>;
```

---

## UX: Abordagem Interativa com Seleção Automática
### **Proposta Aprovada para Implementação**

### Fluxo de Interação

```
1. Usuário clica em "🔍 Analisar Layout"
   ↓
2. Linter analisa e gera relatório
   ↓
3. Relatório exibido em painel lateral com lista de problemas
   ↓
4. Usuário clica em um problema da lista
   ↓
5. Plugin SELECIONA AUTOMATICAMENTE o node no Figma
   ↓
6. Plugin faz ZOOM no node selecionado
   ↓
7. Painel mostra guia contextual para aquele problema específico
   ↓
8. Usuário corrige manualmente no Figma
   ↓
9. Usuário clica em "✅ Marcar como Resolvido"
   ↓
10. Plugin valida se problema foi corrigido
    ↓
11. Se OK: marca como resolvido e avança para próximo
    Se NÃO: mostra feedback e mantém no problema atual
```

### Mockup da Interface

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 ANÁLISE DE LAYOUT                    [3/12 resolvidos]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 SUMÁRIO                                                   │
│   🔴 3 Críticos  🟡 5 Importantes  🔵 4 Menores             │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│ LISTA DE PROBLEMAS:                                         │
│                                                              │
│ ✅ 1. Frame "Header" sem Auto Layout         [RESOLVIDO]   │
│ ▶️ 2. Frame "Container" sem Auto Layout      [ATUAL]       │
│ ⚪ 3. Spacer detectado (Rectangle 45)                       │
│ ⚪ 4. Nome genérico: "Frame 12"                             │
│ ⚪ 5. Cor sem token (Fill #FF5733)                          │
│ ...                                                          │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│ 🎯 PROBLEMA SELECIONADO:                                     │
│ 🔴 Frame "Container" sem Auto Layout                        │
│                                                              │
│ 📍 Localização: Homepage > Hero > Container                 │
│ 🎯 Node selecionado no Figma: ✅                             │
│                                                              │
│ 📚 Por que isso é crítico?                                   │
│ Frames sem Auto Layout usam posicionamento absoluto,        │
│ que não é suportado pelo Elementor. Isso causará:           │
│ • Sobreposição de elementos                                 │
│ • Quebra de layout em diferentes resoluções                 │
│                                                              │
│ ✅ COMO CORRIGIR (⏱️ 1 minuto):                              │
│ 1. Pressione Shift + A (atalho para Auto Layout)            │
│ 2. No painel direito, ajuste direção para Vertical          │
│ 3. Defina gap de 16px entre itens                           │
│ 4. Adicione padding de 24px                                 │
│                                                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│ [✅ Marcar como Resolvido] [⏭️ Próximo] [❌ Ignorar]        │
│ [🔄 Re-analisar Tudo] [📥 Exportar Relatório]               │
└─────────────────────────────────────────────────────────────┘
```

### Código de Integração

#### 1. Botão na UI (ui.html)

```html
<!-- Adicionar na seção de botões principais -->
<div class="toolbar">
  <button id="btn-analyze-layout" class="btn-primary">
    🔍 Analisar Layout
  </button>
  <button id="btn-export" class="btn-success">
    📤 Exportar para Elementor
  </button>
</div>

<!-- Painel do Linter (inicialmente oculto) -->
<div id="linter-panel" class="panel hidden">
  <div class="panel-header">
    <h2>🔍 Análise de Layout</h2>
    <span id="progress-badge" class="badge">0/0 resolvidos</span>
    <button id="btn-close-linter" class="btn-icon">✖️</button>
  </div>
  
  <div class="panel-body">
    <!-- Sumário -->
    <div id="linter-summary" class="summary"></div>
    
    <!-- Lista de problemas -->
    <div id="problem-list" class="problem-list"></div>
    
    <!-- Detalhes do problema selecionado -->
    <div id="problem-details" class="problem-details"></div>
    
    <!-- Ações -->
    <div class="actions">
      <button id="btn-mark-resolved" class="btn-success">
        ✅ Marcar como Resolvido
      </button>
      <button id="btn-next-problem" class="btn-primary">
        ⏭️ Próximo
      </button>
      <button id="btn-ignore-problem" class="btn-secondary">
        ❌ Ignorar
      </button>
    </div>
  </div>
</div>
```

#### 2. Lógica da UI (ui.js)

```javascript
// Quando usuário clica em "Analisar Layout"
document.getElementById('btn-analyze-layout').addEventListener('click', () => {
  parent.postMessage({
    pluginMessage: { type: 'analyze-layout' }
  }, '*');
  
  // Mostra loading
  showLoading('Analisando layout...');
});

// Recebe relatório do plugin
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  
  if (msg.type === 'linter-report') {
    hideLoading();
    displayLinterReport(msg.report);
  }
  
  if (msg.type === 'node-selected') {
    showFeedback('✅ Node selecionado no Figma');
  }
  
  if (msg.type === 'validation-result') {
    if (msg.isFixed) {
      markProblemAsResolved(msg.nodeId);
      showFeedback('🎉 Problema resolvido com sucesso!');
      moveToNextProblem();
    } else {
      showFeedback('⚠️ Problema ainda não foi corrigido. Tente novamente.');
    }
  }
};

// Exibe relatório
function displayLinterReport(report) {
  const panel = document.getElementById('linter-panel');
  panel.classList.remove('hidden');
  
  // Atualiza sumário
  const summary = document.getElementById('linter-summary');
  summary.innerHTML = `
    <div class="summary-stats">
      <span class="stat critical">🔴 ${report.summary.critical} Críticos</span>
      <span class="stat major">🟡 ${report.summary.major} Importantes</span>
      <span class="stat minor">🔵 ${report.summary.minor} Menores</span>
    </div>
  `;
  
  // Atualiza lista de problemas
  const problemList = document.getElementById('problem-list');
  problemList.innerHTML = '<h3>LISTA DE PROBLEMAS:</h3>';
  
  report.analysis.forEach((problem, index) => {
    const item = document.createElement('div');
    item.className = `problem-item ${problem.severity}`;
    item.dataset.nodeId = problem.node_id;
    item.dataset.index = index;
    
    item.innerHTML = `
      <span class="status">⚪</span>
      <span class="number">${index + 1}.</span>
      <span class="message">${problem.message}</span>
    `;
    
    item.addEventListener('click', () => selectProblem(problem, index));
    problemList.appendChild(item);
  });
  
  // Seleciona primeiro problema automaticamente
  if (report.analysis.length > 0) {
    selectProblem(report.analysis[0], 0);
  }
}

// Seleciona um problema
function selectProblem(problem, index) {
  // Atualiza UI
  document.querySelectorAll('.problem-item').forEach(item => {
    item.classList.remove('selected');
  });
  document.querySelector(`[data-index="${index}"]`).classList.add('selected');
  
  // Exibe detalhes
  const details = document.getElementById('problem-details');
  details.innerHTML = `
    <h3>🎯 PROBLEMA SELECIONADO:</h3>
    <div class="problem-header">
      <span class="severity-badge ${problem.severity}">
        ${problem.severity === 'critical' ? '🔴' : problem.severity === 'major' ? '🟡' : '🔵'}
        ${problem.message}
      </span>
    </div>
    
    <div class="problem-location">
      📍 Localização: ${problem.node_name}
    </div>
    
    <div class="problem-tip">
      <h4>📚 Por que isso é ${problem.severity === 'critical' ? 'crítico' : 'importante'}?</h4>
      <p>${problem.educational_tip}</p>
    </div>
    
    <div class="problem-guide">
      <h4>✅ COMO CORRIGIR:</h4>
      ${renderGuide(problem.node_id)}
    </div>
  `;
  
  // Envia comando para selecionar node no Figma
  parent.postMessage({
    pluginMessage: {
      type: 'select-problem-node',
      nodeId: problem.node_id
    }
  }, '*');
  
  currentProblemId = problem.node_id;
  currentProblemIndex = index;
}

// Marca problema como resolvido
document.getElementById('btn-mark-resolved').addEventListener('click', () => {
  parent.postMessage({
    pluginMessage: {
      type: 'mark-problem-resolved',
      nodeId: currentProblemId
    }
  }, '*');
});

// Próximo problema
document.getElementById('btn-next-problem').addEventListener('click', () => {
  moveToNextProblem();
});

function moveToNextProblem() {
  const nextIndex = currentProblemIndex + 1;
  const nextProblem = currentReport.analysis[nextIndex];
  
  if (nextProblem) {
    selectProblem(nextProblem, nextIndex);
  } else {
    showFeedback('🎉 Todos os problemas foram revisados!');
  }
}
```

#### 3. Lógica do Plugin (code.ts)

```typescript
// Adicionar ao code.ts
figma.ui.onmessage = async (msg) => {
  // Análise de layout
  if (msg.type === 'analyze-layout') {
    const selection = figma.currentPage.selection[0];
    
    if (!selection || selection.type !== 'FRAME') {
      figma.ui.postMessage({
        type: 'linter-error',
        message: 'Selecione um Frame para analisar'
      });
      return;
    }
    
    // Executa análise
    const report = await analyzeFigmaLayout(selection, {
      aiAssisted: false,
      deviceTarget: 'desktop'
    });
    
    // Envia relatório para UI
    figma.ui.postMessage({
      type: 'linter-report',
      report: report
    });
  }
  
  // Seleção de node problemático
  if (msg.type === 'select-problem-node') {
    const node = figma.getNodeById(msg.nodeId);
    
    if (node) {
      // Seleciona o node
      figma.currentPage.selection = [node as SceneNode];
      
      // Faz zoom no node
      figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      
      // Notifica UI
      figma.ui.postMessage({
        type: 'node-selected',
        nodeId: msg.nodeId
      });
    } else {
      figma.ui.postMessage({
        type: 'linter-error',
        message: 'Node não encontrado'
      });
    }
  }
  
  // Validação de correção
  if (msg.type === 'mark-problem-resolved') {
    const node = figma.getNodeById(msg.nodeId);
    
    if (!node) {
      figma.ui.postMessage({
        type: 'linter-error',
        message: 'Node não encontrado'
      });
      return;
    }
    
    // Re-analisa apenas este node
    const result = await validateSingleNode(node);
    
    // Salva estado se foi resolvido
    if (result.isValid) {
      await figma.clientStorage.setAsync(`resolved-${msg.nodeId}`, true);
    }
    
    figma.ui.postMessage({
      type: 'validation-result',
      nodeId: msg.nodeId,
      isFixed: result.isValid
    });
  }
};

// Função auxiliar para validar um único node
async function validateSingleNode(node: SceneNode): Promise<{ isValid: boolean; issues: string[] }> {
  const engine = new LinterEngine();
  const registry = new RuleRegistry();
  registry.registerDesktopRules();
  
  const results = await engine.analyzeNode(node, registry);
  
  return {
    isValid: results.length === 0,
    issues: results.map(r => r.message)
  };
}
```

### Funcionalidades Extras

#### 1. Persistência de Progresso

```typescript
// Salvar progresso do usuário
interface LinterProgress {
  layoutId: string;
  totalProblems: number;
  resolved: string[]; // IDs dos nodes resolvidos
  ignored: string[]; // IDs dos nodes ignorados
  timestamp: number;
}

async function saveLinterProgress(progress: LinterProgress) {
  await figma.clientStorage.setAsync('linter-progress', progress);
}

async function loadLinterProgress(): Promise<LinterProgress | null> {
  return await figma.clientStorage.getAsync('linter-progress');
}

// Ao abrir o linter novamente, restaurar progresso
const savedProgress = await loadLinterProgress();
if (savedProgress && savedProgress.layoutId === currentLayoutId) {
  // Marcar problemas já resolvidos
  savedProgress.resolved.forEach(nodeId => {
    markProblemAsResolved(nodeId);
  });
}
```

#### 2. Atalhos de Teclado

```javascript
// Adicionar em ui.js
document.addEventListener('keydown', (e) => {
  // Ctrl + Shift + L → Abrir Linter
  if (e.ctrlKey && e.shiftKey && e.key === 'L') {
    document.getElementById('btn-analyze-layout').click();
  }
  
  // Ctrl + Shift + N → Próximo problema
  if (e.ctrlKey && e.shiftKey && e.key === 'N') {
    document.getElementById('btn-next-problem').click();
  }
  
  // Ctrl + Shift + R → Re-analisar
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    document.getElementById('btn-analyze-layout').click();
  }
  
  // Enter → Marcar como resolvido
  if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
    document.getElementById('btn-mark-resolved').click();
  }
});
```

#### 3. Exportação de Relatório

```typescript
// Exportar relatório como HTML
function exportReportAsHTML(report: LinterReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Relatório de Análise - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    .problem { border-left: 4px solid #ccc; padding: 15px; margin: 15px 0; }
    .critical { border-color: #f44336; }
    .major { border-color: #ff9800; }
    .minor { border-color: #2196f3; }
  </style>
</head>
<body>
  <h1>📊 Relatório de Análise de Layout</h1>
  <div class="summary">
    <h2>Sumário</h2>
    <p>Total de problemas: ${report.summary.total}</p>
    <p>🔴 Críticos: ${report.summary.critical}</p>
    <p>🟡 Importantes: ${report.summary.major}</p>
    <p>🔵 Menores: ${report.summary.minor}</p>
  </div>
  
  <h2>Problemas Detectados</h2>
  ${report.analysis.map((p, i) => `
    <div class="problem ${p.severity}">
      <h3>${i + 1}. ${p.message}</h3>
      <p><strong>Node:</strong> ${p.node_name}</p>
      <p><strong>Categoria:</strong> ${p.category}</p>
      <p>${p.educational_tip}</p>
    </div>
  `).join('')}
  
  <footer>
    <p>Gerado em: ${new Date().toLocaleString()}</p>
  </footer>
</body>
</html>
  `;
}

// Botão para exportar
document.getElementById('btn-export-report').addEventListener('click', () => {
  const html = exportReportAsHTML(currentReport);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `linter-report-${Date.now()}.html`;
  a.click();
});
```

#### 4. Score de Qualidade

```typescript
function calculateQualityScore(report: LinterReport): number {
  const weights = {
    critical: -10,
    major: -5,
    minor: -2
  };
  
  let score = 100;
  
  report.analysis.forEach(problem => {
    score += weights[problem.severity] || 0;
  });
  
  return Math.max(0, Math.min(100, score));
}

// Exibir score na UI
const score = calculateQualityScore(report);
const scoreElement = document.getElementById('quality-score');
scoreElement.innerHTML = `
  <div class="score-badge ${score >= 80 ? 'good' : score >= 60 ? 'medium' : 'bad'}">
    Score: ${score}/100
  </div>
`;
```

---

## Roadmap de Implementação

### Fase 1: MVP - Core do Linter (1-2 semanas)
- [ ] Estrutura `/src/linter/`
  - [ ] `/core/` - LinterEngine, RuleRegistry
  - [ ] `/rules/` - Regras básicas
  - [ ] `/detectors/` - Detectores de widgets
  - [ ] `/guides/` - Guias passo-a-passo
  - [ ] `/reporters/` - Geradores de relatório
- [ ] `LinterEngine` básico
- [ ] 3 regras essenciais (desktop only):
  - [ ] `AutoLayoutRule.ts`
  - [ ] `SpacerDetectionRule.ts`
  - [ ] `GenericNameRule.ts`
- [ ] Sistema de guias passo-a-passo
- [ ] **UX Interativa (Proposta 2):**
  - [ ] Botão "🔍 Analisar Layout" na UI
  - [ ] Painel lateral com lista de problemas
  - [ ] **Seleção automática de node** ao clicar no problema
  - [ ] **Zoom automático** no node selecionado
  - [ ] Exibição de guia contextual
  - [ ] Botões: "✅ Marcar como Resolvido", "⏭️ Próximo", "❌ Ignorar"
- [ ] **Validação de correções:**
  - [ ] Re-análise de node individual
  - [ ] Feedback visual (✅ resolvido / ⚠️ ainda com problema)
- [ ] Testes com layouts reais

### Fase 2: Detecção de Widgets (1 semana)
- [ ] Implementar `WidgetDetector.ts` com suporte a todas as categorias:
  - [ ] **Básicos** (36 widgets)
  - [ ] **Pro** (53 widgets)
  - [ ] **WooCommerce** (31 widgets)
  - [ ] **Loop Builder** (11 widgets)
  - [ ] **Experimentais** (9 widgets)
  - [ ] **WordPress** (8 widgets)
- [ ] PatternDetector
  - [ ] `pattern:card`
  - [ ] `pattern:grid`
- [ ] JetEngineDetector
  - [ ] `listing-repeater`
- [ ] Validação contra JSON Elementor
- [ ] **Score de qualidade:**
  - [ ] Cálculo de score 0-100
  - [ ] Exibição visual na UI
  - [ ] Histórico de scores

### Fase 4: IA Opcional (1 semana - se necessário)
- [ ] Toggle "Modo IA" na UI
- [ ] Sugestões de nomenclatura via IA
- [ ] Detecção de padrões complexos
- [ ] Cache de sugestões
- [ ] Disclaimer sobre limitações

### Fase 5: Refinamento e Documentação (1 semana)
- [ ] Melhorar visualização de relatórios
- [ ] Adicionar animações e transições
- [ ] Criar documentação:
  - [ ] `LINTER_GUIDE.md` - Guia de uso
  - [ ] `RULES_REFERENCE.md` - Referência de regras
  - [ ] `LINTER_ARCHITECTURE.md` - Arquitetura técnica
- [ ] Testes end-to-end
- [ ] Validação com usuários reais
- [ ] Ajustes baseados em feedback

---

## Conclusão

### Mudanças vs Plano Original

| Aspecto | Original | Ajustado |
|---------|----------|----------|
| Posicionamento | Pré-processamento | Addon independente (botão) |
| Automação | Auto-fixes | Guias manuais |
| IA | Híbrido | Opcional (desabilitada) |
| Responsividade | Multi-device | Desktop only |
| Objetivo | Corrigir | Educar |

### Próxima Ação

Criar **MVP funcional** com:
- Botão "🔍 Analisar Layout"
- 3 regras educativas
- Relatório com guias passo-a-passo
- Foco desktop (1440px/1200px)
- Sem IA

**Tempo estimado:** 1-2 semanas

---

**Versão:** 2.0.0 (Ajustado)  
**Data:** 2025-12-03
