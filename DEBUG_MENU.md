# Debug: Menu não detectado

## Problema
O JSON contém um elemento `nav-menu` (ID: `6t4bko186d`), mas nenhuma notificação foi exibida.

## Análise do JSON

O elemento existe:
```json
{
  "id": "6t4bko186d",
  "elType": "widget",
  "widgetType": "nav-menu",
  "settings": {
    "_widget_title": "nav-menu",
    // ...
  },
  "elements": []
}
```

## Possíveis Causas

1. ✅ O elemento está sendo criado corretamente
2. ❓ O método `findNavMenus` não está sendo executado
3. ❓ O método `findNavMenus` não está encontrando o elemento
4. ❓ A mensagem não está sendo enviada para a UI

## Solução

Adicionar logs de debug no método `findNavMenus` para rastrear:
1. Se o método está sendo chamado
2. Quantos elementos estão sendo processados
3. Se encontrou algum nav-menu
4. Quantos itens foram extraídos

## Código de Debug a Adicionar

No método `findNavMenus`, adicionar:

```typescript
findNavMenus(elements: ElementorElement[], figmaNodes?: readonly SceneNode[]): any[] {
    console.log('[DEBUG] findNavMenus chamado. Total de elementos:', elements.length);
    console.log('[DEBUG] figmaNodes fornecido:', !!figmaNodes);
    
    const navMenus: any[] = [];
    // ... resto do código
    
    console.log('[DEBUG] Total de nav-menus encontrados:', navMenus.length);
    console.log('[DEBUG] Detalhes dos menus:', JSON.stringify(navMenus, null, 2));
    
    return navMenus;
}
```

## Verificação no Figma

Certifique-se de que o frame no Figma:
1. Tem o nome `w:nav-menu` (com o prefixo correto)
2. Contém elementos filhos (frames ou textos) que representam os itens do menu
3. Está selecionado ao exportar
