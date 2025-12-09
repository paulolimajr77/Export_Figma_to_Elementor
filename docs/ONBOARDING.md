# 📖 Onboarding Overlay

## Visão Geral

O **Onboarding Overlay** é uma tela informativa que aparece quando o usuário abre o plugin pela primeira vez. Ele explica de forma visual e resumida o fluxo completo de uso do plugin Figma → Elementor.

---

## Características

- **Overlay fullscreen** com fundo escuro semi-transparente e blur
- **Card centralizado** com scroll interno
- **Persistência de preferência** via `clientStorage`
- **Pode ser reaberto** manualmente (futuro botão nas configurações)
- **Responsivo** e com design premium

---

## Fluxo de Exibição

```
┌─────────────────────────────────────────────────────────┐
│                    Plugin Abre                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           clientStorage.get('figtoel_onboarding_hidden')│
└──────────────────────┬──────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼                       ▼
    hidden = true           hidden = false
           │                       │
           ▼                       ▼
    Não mostrar            Mostrar Overlay
```

---

## Estrutura do Componente

### HTML

```html
<div id="onboarding-overlay" class="onboarding-overlay">
  <div class="onboarding-card">
    <!-- Header -->
    <div class="onboarding-header">
      <div class="onboarding-header-text">
        <h1>Bem-vindo ao Figma → Elementor</h1>
        <p>Veja em 1 minuto como funciona...</p>
      </div>
      <button id="onboarding-close-x">✕</button>
    </div>

    <!-- Sections -->
    <div class="onboarding-section">
      <h2>Título da Seção</h2>
      <div class="rich-text">Conteúdo...</div>
    </div>

    <!-- Footer -->
    <div class="onboarding-footer">
      <div class="onboarding-checkbox-wrapper">
        <input type="checkbox" id="onboarding-dont-show-again" />
        <label>Não mostrar novamente</label>
      </div>
      <div class="onboarding-actions">
        <a href="..." class="onboarding-docs-link">📖 Documentação</a>
        <button class="onboarding-primary-btn">Entendi, vamos começar</button>
      </div>
    </div>
  </div>
</div>
```

### CSS Classes

| Classe | Descrição |
|--------|-----------|
| `.onboarding-overlay` | Container fullscreen com backdrop blur |
| `.onboarding-overlay.visible` | Estado visível do overlay |
| `.onboarding-card` | Card central com conteúdo |
| `.onboarding-header` | Cabeçalho com título e botão fechar |
| `.onboarding-section` | Seção de conteúdo |
| `.onboarding-footer` | Rodapé com checkbox e botões |
| `.onboarding-primary-btn` | Botão principal com gradiente |
| `.onboarding-docs-link` | Link para documentação |

---

## Mensagens (postMessage)

### UI → Backend

| Tipo | Payload | Descrição |
|------|---------|-----------|
| `onboarding-load` | - | Solicita estado do onboarding |
| `onboarding-save-hidden` | `{ hidden: boolean }` | Salva preferência |

### Backend → UI

| Tipo | Payload | Descrição |
|------|---------|-----------|
| `onboarding-state` | `{ hidden: boolean }` | Estado atual |
| `onboarding-saved` | `{ success: boolean }` | Confirmação de save |

---

## ClientStorage

### Chave

```
figtoel_onboarding_hidden
```

### Valores

- `true` - Não mostrar automaticamente
- `false` ou undefined - Mostrar ao abrir

---

## Conteúdo das Seções

1. **Fluxo geral em 4 passos**
   - Examinar layout (Linter)
   - Configurar chaves
   - Conectar WordPress
   - Converter para Elementor

2. **Examinar layout e Linter**
   - Uso da aba Linter
   - Identificação de problemas
   - Correções recomendadas

3. **Compilação com e sem IA**
   - Modo No-AI (heurísticas)
   - Modo com IA (detecção avançada)

4. **Chave de IA do usuário**
   - Conexão de conta própria
   - Configuração de API key
   - Funcionamento sem IA

5. **Conectando ao WordPress**
   - URL do site
   - Validação de licença
   - Envio de JSON/imagens

6. **Exportar imagens e ícones**
   - Export automático
   - Otimização
   - URLs corretas no JSON

7. **Dica: Agrupar em única imagem**
   - Quando usar
   - Como travar grupos
   - Benefícios de performance

---

## Interações do Usuário

| Ação | Resultado |
|------|-----------|
| Clique no ✕ | Fecha sem salvar preferência |
| Clique fora do card | Fecha sem salvar preferência |
| Tecla ESC | Fecha sem salvar preferência |
| Clique em "Entendi, vamos começar" | Fecha e salva se checkbox marcado |
| Marcar "Não mostrar novamente" | Preferência será salva ao fechar |

---

## Futuras Melhorias

- [ ] Botão nas Configurações para reabrir onboarding
- [ ] Animações de entrada por seção
- [ ] Versão resumida para updates

---

**Desenvolvido por Paulo Lima Jr**  
© 2025 Figma to Elementor
