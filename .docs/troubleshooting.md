# Análise de Problemas - Comparação Figma vs Elementor

## Problemas Identificados

### 1. ❌ Imagens Não Carregam (Placeholders Cinzas)

**Causa:**
- Timeout de upload (30s era muito curto)
- Configuração WordPress pode estar incorreta
- Imagens muito grandes

**Solução Implementada:**
- ✅ Timeout aumentado para 60s
- ✅ Fallback para base64 quando upload falha
- ✅ Logs melhorados para debug

**Próximos Passos:**
1. Verificar configuração WordPress (URL, user, password)
2. Testar com imagens menores primeiro
3. Verificar se o WordPress aceita uploads via REST API

---

### 2. ❌ Layout Quebrado / Elementos Sobrepostos

**Causas Possíveis:**
1. **Posicionamento Absoluto** - Figma usa coordenadas absolutas, Elementor usa flexbox
2. **Z-index incorreto** - Ordem de empilhamento
3. **Containers mal configurados** - Full width vs Boxed
4. **Padding/Margin** - Espaçamentos não respeitados

**Soluções:**

#### A. Containers
```typescript
// Regras atuais:
> 1400px → Full Width
800-1400px → Boxed
< 800px → Full Width responsivo
```

**Problema:** Elementos dentro de containers podem estar com posição absoluta

**Solução:**
- Remover `_position: absolute` de elementos filhos
- Usar apenas flexbox para layout

#### B. Ordem de Elementos
- Elementor renderiza na ordem do array `elements`
- Figma pode ter ordem diferente (z-index)

**Solução:**
- Ordenar elementos por posição Y (top to bottom)
- Respeitar z-index do Figma

---

### 3. ❌ Backgrounds Não Aparecem

**Causa:**
- `extractBackgroundAdvanced` agora é async
- Pode não estar sendo chamada corretamente em todos os lugares
- Imagens de background não fazem upload

**Solução Implementada:**
- ✅ Todos os `extractBackgroundAdvanced` agora usam `await`
- ✅ Upload de imagens de background
- ✅ Fallback para base64

**Verificar:**
- Cores sólidas funcionam?
- Gradientes funcionam?
- Apenas imagens falham?

---

### 4. ❌ Debug Removido

**Causa:**
- Simplificação acidental do código

**Solução Implementada:**
- ✅ Restaurado `debugNodeRecursive` completo
- ✅ Gera JSON detalhado de toda a estrutura
- ✅ Mostra: nome, tipo, fills, strokes, children, etc.

**Como Usar:**
1. Selecione um elemento no Figma
2. Clique em "Debug Structure" na aba Help
3. Veja o JSON completo na aba Export

---

## Checklist de Testes

### Configuração WordPress
- [ ] URL está correta (ex: `https://seusite.com`)
- [ ] Username está correto
- [ ] Application Password está correto
- [ ] WordPress aceita uploads via REST API
- [ ] CORS está configurado corretamente

### Teste de Imagens
- [ ] Imagem pequena (<100KB) faz upload?
- [ ] SVG faz upload?
- [ ] PNG faz upload?
- [ ] Fallback base64 funciona?

### Teste de Layout
- [ ] Container full width (>1400px) renderiza corretamente?
- [ ] Container boxed (800-1400px) está centralizado?
- [ ] Elementos estão na ordem correta?
- [ ] Flexbox está funcionando (direction, justify, align)?
- [ ] Gap entre elementos está correto?

### Teste de Backgrounds
- [ ] Cor sólida funciona?
- [ ] Gradiente funciona?
- [ ] Imagem de background funciona?
- [ ] Background position/size/repeat corretos?

### Teste de Widgets
- [ ] Button renderiza corretamente?
- [ ] Heading renderiza corretamente?
- [ ] Text Editor renderiza corretamente?
- [ ] Icon Box renderiza corretamente?
- [ ] Image renderiza corretamente?

---

## Soluções Propostas

### Solução 1: Forçar Flexbox (Remover Absolute)

```typescript
// Em createContainer, remover posicionamento absoluto de filhos
if (settings._position === 'absolute') {
    delete settings._position;
    delete settings._offset_x;
    delete settings._offset_y;
    delete settings._z_index;
}
```

### Solução 2: Ordenar Elementos por Posição Y

```typescript
// Ordenar filhos por posição vertical
if ('children' in node) {
    const sortedChildren = Array.from((node as FrameNode).children)
        .sort((a, b) => {
            const aY = 'y' in a ? (a as any).y : 0;
            const bY = 'y' in b ? (b as any).y : 0;
            return aY - bY;
        });
    
    childElements = await Promise.all(
        sortedChildren.map(child => this.processNode(child))
    );
}
```

### Solução 3: Melhorar Detecção de Imagens

```typescript
// Detectar se elemento deve ser imagem
function shouldBeImage(node: SceneNode): boolean {
    if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
        const hasImageFill = hasFills(node) && 
            Array.isArray(node.fills) && 
            node.fills.some(f => f.type === 'IMAGE');
        
        const hasNoChildren = !('children' in node) || 
            (node as FrameNode).children.length === 0;
        
        return hasImageFill && hasNoChildren;
    }
    return false;
}
```

### Solução 4: Fallback Completo para Base64

```typescript
// Se upload falhar, sempre usar base64
async uploadImageToWordPress(node: SceneNode, format: 'PNG' | 'SVG'): Promise<string | null> {
    // Tentar upload primeiro
    const uploadedUrl = await this.tryUpload(node, format);
    
    if (uploadedUrl) {
        return uploadedUrl;
    }
    
    // Fallback: base64
    console.log(`[F2E] Upload failed, using base64 for ${node.name}`);
    return await this.exportAsBase64(node, format);
}
```

---

## Próximos Passos

1. **Testar Configuração WordPress**
   - Verificar se REST API está ativa
   - Testar upload manual via Postman/Insomnia

2. **Implementar Ordenação de Elementos**
   - Ordenar por posição Y
   - Respeitar z-index

3. **Remover Posicionamento Absoluto**
   - Forçar flexbox em todos os containers
   - Usar apenas relative positioning

4. **Melhorar Logs**
   - Adicionar mais console.log
   - Mostrar progresso de upload
   - Indicar qual elemento está sendo processado

5. **Criar Modo Debug Visual**
   - Destacar elementos no Figma
   - Mostrar qual widget será gerado
   - Preview do JSON antes de exportar

---

## Comandos Úteis

### Ver Logs do Plugin
1. Abrir DevTools no Figma (Ctrl+Shift+I)
2. Ir para Console
3. Filtrar por `[F2E]`

### Testar Upload WordPress
```bash
curl -X POST https://seusite.com/wp-json/wp/v2/media \
  -H "Authorization: Basic $(echo -n 'user:password' | base64)" \
  -F "file=@image.png"
```

### Validar JSON Elementor
1. Copiar JSON gerado
2. Colar em https://jsonlint.com/
3. Verificar se está válido
