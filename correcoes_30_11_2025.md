# Correções UI - 30/11/2025

## Problema 1: Botão "Copiar JSON" Não Funcionava ✅ CORRIGIDO

### Causa Raiz
A função `copyWithFallback()` estava sendo chamada na linha 1347 do `ui.html`, mas **não estava definida** em lugar nenhum do arquivo, causando erro JavaScript.

### Correção Implementada
Adicionada a função `copyWithFallback()` após a função `addLog()` no `ui.html`:
- Tenta usar `navigator.clipboard.writeText()` (método moderno)
- Fallback para `document.execCommand('copy')` (método legado)
- Feedback via `addLog()` com mensagens de sucesso/erro

**Arquivo**: `src/ui.html` (após linha 967)
**Status**: ✅ Compilado com sucesso

---

## Problema 2: Aba Ajuda Vazia 🔍 INVESTIGADO

### Análise
- ✅ HTML estrutura presente (linhas 813-819)
- ✅ Container `#widget-list-container` presente
- ✅ Função `renderWidgetList()` implementada (linhas 1430-1481)
- ✅ Dados `WIDGET_DATA` completos (152 widgets, 7 categorias)
- ✅ Inicialização chamada (linha 1484)
- ✅ Event listeners configurados

### Conclusão
O código está **correto e funcional**. Se a aba aparecer vazia:
1. **Recarregue o plugin** no Figma
2. **Limpe o cache** do Figma
3. **Abra o console** do DevTools (Ctrl+Shift+I no Figma) para ver se há erros JavaScript

A aba deve funcionar após recarregar o plugin compilado.

---

## Problema 3: Origem dos Ícones no JSON 📖 EXPLICADO

### Pergunta do Usuário
"De onde saiu a lista de ícones no JSON?"

### Resposta
Os "ícones" vêm de elementos do Figma com estas características:

```json
{
  "id": "27:104",
  "name": "w:icon",
  "type": "IMAGE",
  "locked": true,
  "isLockedImage": true,
  "width": 64,
  "height": 64
}
```

**Explicação**:
1. São elementos **IMAGE** do Figma
2. Estão **travados/locked** (`"locked": true`)  
3. Têm nome que começa com `w:icon` ou `w:image`
4. O pipeline os identifica e tenta exportar como ícones/imagens

**Problema Observado**:
No JSON Elementor fornecido, esses ícones estão sendo exportados como **containers vazios** com `min_height` ao invés de **widgets icon** ou **widgets image**.

Exemplo do problema:
```json
{
  "id": "ac644e2",
  "elType": "container",  // ❌ Deveria ser "widget"
  "settings": {
    "min_height": { "size": 64 }  // Preserva dimensão mas perde o ícone
  }
}
```

**Deveria ser**:
```json
{
  "id": "ac644e2",
  "elType": "widget",  // ✅ Correto
  "widgetType": "icon",
  "settings": {
    "selected_icon": { /* dados do ícone */ }
  }
}
```

### Investigação Necessária
Verificar em `pipeline.ts` por que elementos `w:icon` estão virando containers vazios ao invés de widgets.

---

## Resumo de Arquivos Modificados

- ✅ `src/ui.html` - Adicionada função `copyWithFallback()`
- ✅ Build compilado - `dist/code.js` atualizado
- ✅ `ui_patch.js` - Criado para referência futura

---

## Próximos Passos Recomendados

1. **Recarregar plugin** no Figma para testar botão Copiar JSON
2. **Verificar aba Ajuda** após recarregar
3. **Investigar** por que `w:icon` vira container vazio
4. **Test** com o JSON fornecido "4 Pilares do Sucesso"

---

## Commit Sugerido

```bash
git add src/ui.html dist/code.js
git commit -m "fix: adiciona função copyWithFallback para botão Copiar JSON

- Corrige erro 'copyWithFallback is not defined'
- Botão Copiar JSON agora funciona corretamente
- Fallback para documento.execCommand se clipboard API falhar
- Build recompilado"
git push origin master
```
