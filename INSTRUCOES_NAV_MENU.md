# Instruções para Implementar Funcionalidade de Nav-Menu

## ✅ Alterações JÁ FEITAS no `code.ts`:

1. ✅ Método `findNavMenus` adicionado (linhas 541-561)
2. ✅ Detecção de menus no export (linhas 833-853)

## 📝 Alterações PENDENTES no `ui.html`:

### 1. Adicionar Checkbox e Link na Aba WordPress (após linha 511)

Substituir:
```html
        <div class="form-group"><label>Senha de Aplicativo</label><input type="password" id="wp-pass"></div>
        <button id="btn-save-wp" class="btn btn-primary">Salvar Configuração</button>
    </div>
```

Por:
```html
        <div class="form-group"><label>Senha de Aplicativo</label><input type="password" id="wp-pass"></div>
        
        <div class="form-group" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
            <label style="display: flex; align-items: center; cursor: pointer; user-select: none;">
                <input type="checkbox" id="wp-auto-menu" style="margin-right: 8px;">
                <span>Plugin instalado - Criar menus automaticamente</span>
            </label>
            <div style="font-size: 11px; color: #666; margin-top: 8px; line-height: 1.5;">
                Requer o plugin <strong>XYZ Remote Menus</strong> instalado no WordPress.
                <br>
                <a href="#" id="link-download-plugin" style="color: var(--primary); text-decoration: none;">📦 Baixar Plugin</a>
            </div>
        </div>
        
        <button id="btn-save-wp" class="btn btn-primary">Salvar Configuração</button>
    </div>
```

### 2. Atualizar função de salvar config (linha ~1043)

Substituir:
```javascript
        document.getElementById('btn-save-wp').onclick = () => {
            const url = document.getElementById('wp-url').value;
            const user = document.getElementById('wp-user').value;
            const pass = document.getElementById('wp-pass').value;
            parent.postMessage({ pluginMessage: { type: 'save-wp-config', config: { url, user, password: pass } } }, '*');
        };
```

Por:
```javascript
        document.getElementById('btn-save-wp').onclick = () => {
            const url = document.getElementById('wp-url').value;
            const user = document.getElementById('wp-user').value;
            const pass = document.getElementById('wp-pass').value;
            const autoMenu = document.getElementById('wp-auto-menu').checked;
            parent.postMessage({ pluginMessage: { type: 'save-wp-config', config: { url, user, password: pass, autoMenu } } }, '*');
        };
        
        // Link para download do plugin
        document.getElementById('link-download-plugin').onclick = (e) => {
            e.preventDefault();
            addLog('📦 Link para download: Você deve subir o arquivo .zip do plugin XYZ Remote Menus', 'info');
        };
```

### 3. Atualizar carregamento de config (linha ~1066)

Substituir:
```javascript
            else if (msg.type === 'load-wp-config') {
                const config = msg.config;
                if (config) {
                    if (config.url) document.getElementById('wp-url').value = config.url;
                    if (config.user) document.getElementById('wp-user').value = config.user;
                    if (config.password) document.getElementById('wp-pass').value = config.password;
                    addLog("Config WP carregada.", 'success');
                }
            }
```

Por:
```javascript
            else if (msg.type === 'load-wp-config') {
                const config = msg.config;
                if (config) {
                    if (config.url) document.getElementById('wp-url').value = config.url;
                    if (config.user) document.getElementById('wp-user').value = config.user;
                    if (config.password) document.getElementById('wp-pass').value = config.password;
                    if (config.autoMenu !== undefined) document.getElementById('wp-auto-menu').checked = config.autoMenu;
                    addLog("Config WP carregada.", 'success');
                }
            }
```

### 4. Adicionar processamento de navMenus no export-result (linha ~1061)

Substituir:
```javascript
            if (msg.type === 'export-result') {
                document.getElementById('output-area').value = msg.data;
                document.getElementById('btn-copy').disabled = false;
                addLog("JSON Gerado!", 'success');

                // Auto-copy
                document.getElementById('output-area').select();
                navigator.clipboard.writeText(msg.data).then(() => {
                    addLog("JSON copiado automaticamente para a área de transferência!", 'success');
                }).catch(e => console.error(e));

                if (document.getElementById('tab-preview').classList.contains('active')) updatePreview();
            }
```

Por:
```javascript
            if (msg.type === 'export-result') {
                document.getElementById('output-area').value = msg.data;
                document.getElementById('btn-copy').disabled = false;
                addLog("JSON Gerado!", 'success');

                // Auto-copy
                document.getElementById('output-area').select();
                navigator.clipboard.writeText(msg.data).then(() => {
                    addLog("JSON copiado automaticamente para a área de transferência!", 'success');
                }).catch(e => console.error(e));

                // Processar menus de navegação detectados
                if (msg.navMenus && msg.navMenus.length > 0) {
                    const autoMenuEnabled = document.getElementById('wp-auto-menu').checked;
                    
                    addLog(`⚠️ Encontrado(s) ${msg.navMenus.length} menu(s) de navegação (w:nav-menu)`, 'info');
                    
                    if (!autoMenuEnabled) {
                        addLog('💡 Para criar menus automaticamente:', 'info');
                        addLog('   1. Baixe e instale o plugin XYZ Remote Menus no WordPress', 'info');
                        addLog('   2. Vá na aba "Config WP" e marque "Plugin instalado"', 'info');
                        addLog('   3. Exporte novamente para criar os menus dinamicamente', 'info');
                    } else {
                        addLog('✅ Plugin habilitado! Os menus serão criados via API do WordPress', 'info');
                        addLog('📝 Endpoint: POST /wp-json/xyz-remote-menus/v1/sync', 'info');
                    }
                }

                if (document.getElementById('tab-preview').classList.contains('active')) updatePreview();
            }
```

## 🎯 Resumo do que foi implementado:

1. ✅ **Detecção automática** de elementos `w:nav-menu` durante a exportação
2. ✅ **Checkbox** na aba WordPress para habilitar criação automática
3. ✅ **Link** para download do plugin (você deve subir o .zip)
4. ✅ **Avisos ao usuário** quando menus são detectados
5. ✅ **Instruções** de como instalar e usar o plugin

## 📌 Próximos passos (FUTURO):

Para implementar a criação automática de menus via API, você precisará:

1. Adicionar uma função `createMenusAutomatically()` que faça o POST para o endpoint
2. Extrair os itens do menu do Figma (nodes filhos do w:nav-menu)
3. Montar o payload conforme o formato do plugin figtoel Remote Menus
4. Fazer a chamada autenticada com Application Password

Exemplo do payload:
```javascript
{
  "menu_name": "Menu Principal",
  "menu_location": "primary",
  "replace_existing": true,
  "items": [
    {
      "title": "Home",
      "url": "https://seusite.com"
    },
    {
      "title": "Serviços",
      "url": "https://seusite.com/servicos",
      "children": [
        {
          "title": "Consultoria",
          "url": "https://seusite.com/servicos/consultoria"
        }
      ]
    }
  ]
}
```
