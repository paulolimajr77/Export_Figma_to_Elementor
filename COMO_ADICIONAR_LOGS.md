# Como Adicionar Logs de Debug - INSTRUÇÕES SIMPLES

## Problema
O menu `nav-menu` está sendo criado no JSON mas não está sendo detectado pelo `findNavMenus`.

## Solução Rápida: Adicionar 3 Logs

### No arquivo `src/code.ts`, linha 542 (início do método `findNavMenus`):

Adicione logo após a linha `const navMenus: any[] = [];`:

```typescript
console.log('[DEBUG] findNavMenus - Total elementos:', elements.length);
```

### No arquivo `src/code.ts`, linha 599 (dentro do loop searchRecursive):

Adicione logo após `for (const el of els) {`:

```typescript
console.log('[DEBUG] Verificando:', el.widgetType);
```

### No arquivo `src/code.ts`, linha 627 (antes do return):

Adicione logo antes de `return navMenus;`:

```typescript
console.log('[DEBUG] Total menus encontrados:', navMenus.length);
```

## Depois de Adicionar os Logs:

1. Salve o arquivo
2. Execute: `npm run build`
3. No Figma, abra o console (Ctrl+Shift+I ou Cmd+Option+I)
4. Exporte novamente
5. Veja os logs no console

## O que Esperar:

Se os logs aparecerem:
- ✅ O método está sendo chamado
- Verifique se `el.widgetType` mostra `nav-menu`
- Verifique se `Total menus encontrados` é maior que 0

Se os logs NÃO aparecerem:
- ❌ O método não está sendo chamado
- Verifique se a chamada na linha 902 está correta
