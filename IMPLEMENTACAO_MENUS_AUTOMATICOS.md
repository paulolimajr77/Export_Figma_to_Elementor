# Implementação Completa: Criação Automática de Menus

## Parte 1: Modificar `code.ts`

### 1.1 Modificar o método `findNavMenus` (linhas 541-561)

Substituir o método atual por este:

```typescript
// Encontra todos os elementos nav-menu recursivamente e extrai seus itens
findNavMenus(elements: ElementorElement[], figmaNodes?: readonly SceneNode[]): any[] {
    const navMenus: any[] = [];
    const nodeMap = new Map<string, SceneNode>();

    // Criar mapa de IDs para nodes do Figma
    if (figmaNodes) {
        const mapNodes = (nodes: readonly SceneNode[]) => {
            for (const node of nodes) {
                nodeMap.set(node.id, node);
                if ('children' in node) {
                    mapNodes((node as FrameNode).children);
                }
            }
        };
        mapNodes(figmaNodes);
    }

    const extractMenuItems = (figmaNode: SceneNode): any[] => {
        const items: any[] = [];
        
        if (!('children' in figmaNode)) return items;
        
        const children = (figmaNode as FrameNode).children;
        
        for (const child of children) {
            const childName = child.name.toLowerCase();
            
            // Procurar por itens de menu (podem ser frames ou grupos com texto)
            if (child.type === 'TEXT') {
                items.push({
                    title: (child as TextNode).characters,
                    url: '#', // URL padrão
                    children: []
                });
            } else if ('children' in child) {
                // Procurar texto dentro do frame/grupo
                const textNodes = this.findAllChildren(child).filter(n => n.type === 'TEXT') as TextNode[];
                
                if (textNodes.length > 0) {
                    const title = textNodes[0].characters;
                    
                    // Verificar se tem subitens (children)
                    const subItems = extractMenuItems(child);
                    
                    items.push({
                        title: title,
                        url: '#',
                        children: subItems.length > 0 ? subItems : []
                    });
                }
            }
        }
        
        return items;
    };

    const searchRecursive = (els: ElementorElement[]) => {
        for (const el of els) {
            if (el.widgetType === 'nav-menu') {
                const menuData: any = {
                    id: el.id,
                    name: el.settings._widget_title || 'Menu de Navegação',
                    items: []
                };

                // Tentar encontrar o node do Figma correspondente
                if (figmaNodes) {
                    for (const [nodeId, node] of nodeMap.entries()) {
                        const nodeName = node.name.toLowerCase();
                        if (nodeName.includes('nav-menu') || nodeName.includes(menuData.name.toLowerCase())) {
                            menuData.items = extractMenuItems(node);
                            menuData.figmaNodeId = nodeId;
                            break;
                        }
                    }
                }

                navMenus.push(menuData);
            }
            if (el.elements && el.elements.length > 0) {
                searchRecursive(el.elements);
            }
        }
    };

    searchRecursive(elements);
    return navMenus;
}
```

### 1.2 Modificar a chamada do `findNavMenus` (linha 834)

Substituir:
```typescript
const navMenus = compiler.findNavMenus(elements);
```

Por:
```typescript
const navMenus = compiler.findNavMenus(elements, selection);
```

## Parte 2: Adicionar função no `ui.html`

### 2.1 Adicionar função `createMenusAutomatically` antes da linha 1056

Adicionar este código antes de `window.onmessage`:

```javascript
// Função para criar menus automaticamente via API do WordPress
async function createMenusAutomatically(navMenus, wpUrl, wpUser, wpPass) {
    const wpUrlClean = wpUrl.replace(/\/$/, "");
    
    for (const menu of navMenus) {
        try {
            addLog(`📤 Criando menu: ${menu.name}...`, 'info');
            
            const payload = {
                menu_name: menu.name,
                menu_location: "primary",
                replace_existing: true,
                items: menu.items || []
            };
            
            const response = await fetch(`${wpUrlClean}/wp-json/figtoel-remote-menus/v1/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa(wpUser + ":" + wpPass)
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                addLog(`✅ Menu "${menu.name}" criado com sucesso! (${menu.items.length} itens)`, 'success');
            } else {
                addLog(`⚠️ Falha ao criar menu "${menu.name}": ${result.message || 'Erro desconhecido'}`, 'error');
            }
            
        } catch (error) {
            addLog(`❌ Erro ao criar menu "${menu.name}": ${error.message}`, 'error');
            
            // Verificar se é erro de plugin não instalado
            if (error.message.includes('404')) {
                addLog('💡 Verifique se o plugin "Figto El Remote Menus" está instalado e ativado no WordPress', 'error');
            }
        }
    }
}
```

### 2.2 Modificar o bloco de processamento de menus (linhas 1072-1086)

Substituir o bloco existente por:

```javascript
// Processar menus de navegação detectados
if (msg.navMenus && msg.navMenus.length > 0) {
    const autoMenuEnabled = document.getElementById('wp-auto-menu').checked;
    const wpUrl = document.getElementById('wp-url').value;
    const wpUser = document.getElementById('wp-user').value;
    const wpPass = document.getElementById('wp-pass').value;
    
    addLog(`⚠️ Encontrado(s) ${msg.navMenus.length} menu(s) de navegação (w:nav-menu)`, 'info');
    
    // Mostrar itens detectados
    msg.navMenus.forEach(menu => {
        addLog(`   📋 Menu: "${menu.name}" com ${menu.items.length} item(ns)`, 'info');
    });
    
    if (!autoMenuEnabled) {
        addLog('💡 Para criar menus automaticamente:', 'info');
        addLog('   1. Baixe e instale o plugin Figto El Remote Menus no WordPress', 'info');
        addLog('   2. Vá na aba "Config WP" e marque "Plugin instalado"', 'info');
        addLog('   3. Exporte novamente para criar os menus dinamicamente', 'info');
    } else if (!wpUrl || !wpUser || !wpPass) {
        addLog('⚠️ Configure as credenciais do WordPress na aba "Config WP"', 'error');
    } else {
        // Criar menus automaticamente
        addLog('🔄 Iniciando criação automática de menus...', 'info');
        createMenusAutomatically(msg.navMenus, wpUrl, wpUser, wpPass);
    }
}
```

## Parte 3: Estrutura Esperada no Figma

Para que o sistema funcione corretamente, organize seus menus no Figma assim:

```
w:nav-menu (Frame principal)
├── Item 1 (Frame ou Text)
│   └── "Home" (Text)
├── Item 2 (Frame)
│   ├── "Serviços" (Text)
│   └── Submenu (Frame)
│       ├── "Consultoria" (Text)
│       └── "Desenvolvimento" (Text)
└── Item 3 (Frame ou Text)
    └── "Contato" (Text)
```

## Parte 4: Formato do Payload Enviado

O payload enviado para a API será:

```json
{
  "menu_name": "Menu Principal",
  "menu_location": "primary",
  "replace_existing": true,
  "items": [
    {
      "title": "Home",
      "url": "#",
      "children": []
    },
    {
      "title": "Serviços",
      "url": "#",
      "children": [
        {
          "title": "Consultoria",
          "url": "#",
          "children": []
        }
      ]
    }
  ]
}
```

## Parte 5: Endpoint da API

O endpoint esperado no WordPress é:
```
POST https://seusite.com/wp-json/figtoel-remote-menus/v1/sync
```

**Nota**: O nome do plugin foi corrigido de "xyz-remote-menus" para "figtoel-remote-menus" para manter consistência com o nome do projeto.

## Resumo das Alterações

1. ✅ Método `findNavMenus` expandido para extrair itens do menu
2. ✅ Função `createMenusAutomatically` criada para fazer POST
3. ✅ Payload montado conforme especificação
4. ✅ Autenticação via Application Password (Basic Auth)
5. ✅ Feedback detalhado ao usuário nos logs
6. ✅ Tratamento de erros (plugin não instalado, credenciais inválidas, etc.)
