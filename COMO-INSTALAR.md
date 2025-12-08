# 📦 Como Instalar o Plugin Figma → WP Elementor

Este guia explica como instalar o plugin diretamente no Figma para uso em desenvolvimento local.

---

## 🎯 Pré-requisitos

- **Figma Desktop App** instalado (a instalação local não funciona na versão web)
- Arquivos do plugin extraídos em uma pasta local

---

## 📁 Arquivos Necessários

Após extrair o ZIP, você deve ter a seguinte estrutura:

```
figma-to-elementor/
├── manifest.json      (obrigatório)
├── dist/
│   └── code.js        (obrigatório)
└── src/
    └── ui.html        (obrigatório)
```

---

## 🔧 Passo a Passo da Instalação

### 1. Extraia o ZIP
Extraia o arquivo `figma-to-elementor.zip` em uma pasta de sua preferência, por exemplo:
```
C:\Plugins\figma-to-elementor\
```

### 2. Abra o Figma Desktop
Certifique-se de estar usando o **aplicativo desktop** do Figma (não a versão web).

### 3. Acesse o Menu de Plugins
No Figma, vá em:
```
Menu → Plugins → Development → Import plugin from manifest...
```

Ou use o atalho de teclado:
- **Windows/Linux**: `Ctrl + Alt + P` → "Development" → "Import plugin from manifest..."
- **Mac**: `Cmd + Option + P` → "Development" → "Import plugin from manifest..."

### 4. Selecione o Manifest
Navegue até a pasta onde extraiu o plugin e selecione o arquivo:
```
manifest.json
```

### 5. Confirme a Instalação
O Figma deve confirmar que o plugin foi importado com sucesso.

---

## ▶️ Como Usar o Plugin

### Executar o Plugin
Após a instalação, execute o plugin através de:
```
Menu → Plugins → Development → Figma → WP Elementor
```

Ou através da barra de pesquisa do Figma (use `/` ou `Ctrl+/`):
```
Digite: "Figma → WP Elementor"
```

### Fluxo Básico de Uso

1. **Selecione um Frame** no Figma
2. **Execute o plugin**
3. **Aba "Export Layout"**: Gera o JSON para Elementor
4. **Aba "Validador"**: Analisa problemas no layout
5. **Aba "IA"**: Configure tokens de API para conversão inteligente
6. **Aba "WordPress"**: Configure conexão com seu site WP

---

## ⚙️ Configuração Recomendada

### Integração com WordPress

Para exportar diretamente para o WordPress, você precisa:

1. **URL do Site**: Ex: `https://seusite.com`
2. **Usuário WP**: Seu nome de usuário do WordPress
3. **Senha de Aplicativo**: Gere uma senha de aplicativo em:
   ```
   WordPress Admin → Usuários → Seu Perfil → Senhas de Aplicativo
   ```

### Plugin Auxiliar para Menus

Para gerar menus automaticamente, instale nosso plugin auxiliar no WordPress:
- **Download**: [figtoel-remote-menus.zip](https://pljr.com.br/plugins/figtoel-remote-menus.zip)

---

## 🔄 Atualizações

Quando uma nova versão estiver disponível:

1. Baixe o novo ZIP
2. Extraia na mesma pasta (sobrescreva os arquivos)
3. No Figma, vá em:
   ```
   Menu → Plugins → Development → Figma → WP Elementor → Opções → Reload
   ```

Ou simplesmente feche e reabra o Figma.

---

## ❓ Solução de Problemas

### "Plugin não aparece na lista"
- Certifique-se de usar o Figma Desktop
- Verifique se o `manifest.json` está na raiz da pasta

### "Erro ao carregar UI"
- Verifique se o arquivo `src/ui.html` existe
- Reconstrua o plugin: `npm run build`

### "Erro de código"
- Verifique se o arquivo `dist/code.js` existe
- Reconstrua o plugin: `npm run build`

---

## 📞 Suporte

Para dúvidas ou problemas:
- **GitHub**: Abra uma issue no repositório
- **Email**: suporte@pljr.com.br

---

**Versão**: 1.0.0  
**Última atualização**: 2025-12-08
