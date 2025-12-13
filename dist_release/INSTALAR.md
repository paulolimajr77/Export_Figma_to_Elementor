# FigToEL - Instalação no Figma Desktop

## Arquivos Incluídos

```
FigToEL/
├── manifest.json    ← Manifesto do plugin (obrigatório)
├── dist/
│   └── code.js      ← Código compilado do plugin
├── src/
│   └── ui.html      ← Interface do plugin
└── INSTALAR.md      ← Este arquivo
```

---

## Passo a Passo para Instalar

### 1. Extraia o ZIP
Extraia o conteúdo deste ZIP para uma pasta de fácil acesso, por exemplo:
```
C:\Plugins\FigToEL\
```

### 2. Abra o Figma Desktop
- O plugin **só funciona no Figma Desktop**, não no navegador.
- Baixe em: https://www.figma.com/downloads/

### 3. Importe o Plugin
1. No Figma Desktop, vá em **Menu → Plugins → Development → Import plugin from manifest...**
2. Navegue até a pasta onde você extraiu o ZIP
3. Selecione o arquivo `manifest.json`
4. Clique em **Open**

### 4. Execute o Plugin
1. Abra qualquer arquivo do Figma
2. Vá em **Menu → Plugins → Development → FigToEL**
3. Ou use o atalho: **Ctrl+Alt+P** (Windows) / **Cmd+Option+P** (Mac)

---

## Configuração Inicial

### Conectar ao WordPress

1. Na aba **WordPress**, configure:
   - **URL do Site**: ex: `https://seusite.com.br`
   - **Usuário**: seu usuário WordPress
   - **Application Password**: gere em *Usuários → Perfil → Application Passwords*

2. Clique em **Testar Conexão** para verificar

### Ativar Licença

1. Acesse: https://figmatoelementor.pljr.com.br
2. Faça login e copie sua chave de licença
3. Cole na aba **Licença** do plugin
4. Clique em **Validar Licença**

---

## Como Usar

### Exportação por Dobras (Recomendado)

1. **Selecione UMA SEÇÃO** do seu layout no Figma (não a página inteira)
2. Execute o plugin
3. Clique em **Gerar JSON**
4. **Copie o JSON** ou clique em **Exportar para WordPress**
5. No Elementor, cole o JSON (Ctrl+Shift+V)
6. **Repita** para cada seção do layout

### Nomenclatura de Widgets

Use prefixos nos nomes dos frames para forçar tipos:

| Prefixo | Widget Elementor |
|---------|------------------|
| `w:heading` | Heading |
| `w:text` | Text Editor |
| `w:button` | Button |
| `w:image` | Image |
| `w:icon` | Icon |
| `w:image-box` | Image Box |
| `w:icon-box` | Icon Box |
| `c:container` | Container Flex |

### Dica: Lock para Imagem Única

Para exportar vários elementos como uma única imagem:
1. Agrupe os elementos
2. **Trave o grupo** (clique direito → Lock)
3. O plugin exportará como uma imagem WebP

---

## Suporte

- **Documentação**: https://figmatoelementor.pljr.com.br/docs
- **Suporte**: support@figmatoelementor.pljr.com.br

---

**Versão**: 1.4.0  
**Data**: Dezembro 2025
