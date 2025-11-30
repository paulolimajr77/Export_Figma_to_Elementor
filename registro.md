# Registro de Alterações

## 30/11/2025 - Correção Crítica: Duplicação de Nós

### Problema Identificado
A função `deduplicateContainers()` em `src/pipeline.ts` estava concatenando widgets e children de containers duplicados, causando elementos duplicados no JSON Elementor final.

### Causa Raiz
- **Arquivo**: `src/pipeline.ts` (linhas 755-792)
- **Função**: `deduplicateContainers()`
- **Comportamento incorreto**: 
  ```typescript
  // ANTES - Concatenava duplicados ❌
  if (c.widgets && c.widgets.length > 0) {
      existing.widgets = (existing.widgets || []).concat(c.widgets);
  }
  if (c.children && c.children.length > 0) {
      existing.children = (existing.children || []).concat(c.children);
  }
  ```

### Correção Implementada
- **Estratégia**: Preservar apenas a primeira ocorrência de cada container
- **Mudanças**:
  1. Removida concatenação de `widgets` e `children`
  2. Adicionado check de duplicação para containers sem key
  3. Implementado merge inteligente de `styles` sem duplicar conteúdo
  4. Preservação da primeira ocorrência completa de cada container

### Arquivos Modificados
- `src/pipeline.ts` - Refatoração da função `deduplicateContainers()`

### Testes
- ✅ Compilação bem-sucedida (`npm run build`)
- ⏳ Aguardando teste com layouts que apresentavam duplicação

### Impacto
- **Positivo**: Elimina duplicação de elementos no JSON final
- **Sem breaking changes**: Preserva comportamento correto existente
- **Performance**: Sem impacto negativo

### Outros Achados
- **Aba Ajuda**: Verificado que está funcionando corretamente. Todo código necessário presente.
  - HTML estrutura: `ui.html:813-819`
  - Dados completos: 152 widgets em 7 categorias
  - Se não aparecer, recarregar plugin após compilação

---

## Alterações Anteriores

- 03/12/2025: O deduplicador agora agrupa containers pelo `styles.sourceId` antes de gerar JSON Elementor
- 29/11/2025: Correção crítica para frames trancados; lógica de estilos (tipografia, bordas, texto rico) unificadas para modos AI e NO-AI via style_utils.ts
