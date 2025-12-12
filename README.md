# FigToEL · Figma to Elementor Converter

![Figma Compatible](https://img.shields.io/badge/Figma-Compatible-blue) ![Elementor Ready](https://img.shields.io/badge/Elementor-3.19%2B-brightgreen) ![WordPress](https://img.shields.io/badge/WordPress-REST%20API%20Ready-informational)

Transforme layouts do Figma em páginas Elementor completas, com exportação automática para WordPress e widgets avançados.

---

## Descrição Geral

FigToEL é um plugin que converte designs do Figma em páginas Elementor com alta fidelidade. Lê a estrutura do frame, cria containers Flexbox, mapeia widgets automaticamente e envia imagens/ícones para a mídia do WordPress. Funciona com Elementor e Elementor Pro.

---

## Como Instalar

1. Abra o Figma Desktop e vá em **Plugins -> Manage Plugins**.
2. Clique em **Import plugin from manifest**.
3. Selecione o arquivo `manifest.json` fornecido.
4. O plugin aparecerá no painel de Plugins do Figma.

---

## Requisitos

- Figma Desktop
- Elementor 3.19+
- Elementor Pro (para slides, tabs, accordion, loop grid)
- WordPress com REST API ativa (para exportação automática)
- Plugin companion WordPress (opcional, para menus remotos)

---

## Como Usar

1. Abra seu layout no Figma.
2. Selecione um frame.
3. Abra o plugin **FigToEL**.
4. Configure as credenciais do WordPress (URL, usuário, token).
5. Clique em **Inspecionar Layout**.
6. Revise o preview detectado.
7. Clique em **Gerar JSON Elementor**.
8. Copie ou exporte diretamente para o WordPress.

### Ações de Exportação

- **Copiar JSON** - Copia o JSON para a área de transferência
- **Baixar JSON** - Faz download do arquivo JSON
- **Exportar para WordPress** - Envia diretamente para o WordPress via REST API

---

## Recursos e Funcionalidades

### Conversão de Layout
- Conversão fiel do Figma para Elementor com **Containers Flexbox**
- Preservação de alinhamentos (`justify_content`, `align_items`)
- Suporte a containers `boxed` (frames >= 1440px)
- Padding, gap e dimensões preservados

### Widgets Suportados
| Widget | Descrição |
|--------|-----------|
| `heading` | Títulos e cabeçalhos |
| `text-editor` | Blocos de texto com rich text |
| `button` | Botões com gradiente, ícone, padding e border |
| `image` | Imagens com upload automático para WordPress |
| `icon` | Ícones SVG exportados e uploadados |
| `image-box` | Imagem com título e descrição |
| `icon-box` | Ícone com título e descrição |
| `icon-list` | Lista com ícones personalizados |
| `image-carousel` | Carrossel de imagens |
| `basic-gallery` | Galeria de imagens |
| `accordion` | Acordeão expansível |
| `toggle` | Toggle switches |
| `nav-menu` | Menus de navegação (com plugin companion) |

### Exportação de Mídia
- **Imagens**: Convertidas automaticamente para WebP com qualidade configurável
- **Ícones SVG**: Uploadados para WordPress Media Library
- **Cache de hash**: Evita upload duplicado de mesmos assets

### Estilização Completa
- Background sólido e gradiente
- Border (cor, largura, radius)
- Padding individual (top, right, bottom, left)
- Tipografia (font-family, size, weight, line-height, letter-spacing)
- Cores de texto extraídas do Figma

---

## Nomenclatura de Widgets no Figma

Use prefixos nos nomes dos frames/grupos para forçar tipos de widget:

| Prefixo | Widget Elementor |
|---------|------------------|
| `w:heading` | Heading |
| `w:text` ou `w:text-editor` | Text Editor |
| `w:button` | Button |
| `w:image` | Image |
| `w:icon` | Icon |
| `w:image-box` | Image Box |
| `w:icon-box` | Icon Box |
| `w:icon-list` | Icon List |
| `c:container` | Container Flex |
| `media:carousel` | Image Carousel |

---

## Correções e Melhorias Recentes

### v1.4.0 - Button Widget Refactor
- **Background Gradient**: Cores agora em formato HEX (`#FD6060`) ao invés de objeto
- **Padding**: Usa `text_padding` (padrão Elementor) ao invés de `button_padding`
- **Ângulo do Gradiente**: Default de 180° (vertical)
- **Hover Transition**: Adicionado `button_hover_transition_duration` (0.3s)
- **Ícone do Botão**: Corrigido ID do WordPress (antes usava ID do Figma)
- **Border**: Mapeamento completo de cor, largura e radius

### v1.3.0 - Estabilidade e Estilos
- **Fix (Image Widget)**: Frames com preenchimento de imagem agora exportam corretamente
- **Fix (SVG Icons)**: Estrutura `{ value: { id, url }, library: 'svg' }` corrigida
- **Fix (Cores de Texto)**: Widgets heading/text-editor recebem cor correta
- **Containers Flexbox**: Alinhamentos `flex-start`/`flex-end` normalizados
- **Conversão WebP**: Imagens PNG convertidas automaticamente no upload

### v1.2.0 - Containers e Carrosséis
- **Containers Boxed**: Frames >= 1440px viram containers boxed
- **Carrosséis**: `image-carousel` com slides válidos
- **Normalização JSON**: Raiz inclui `type: elementor`, `version: 0.4`

---

## Configuração do WordPress

### Credenciais Necessárias
1. **URL do Site**: Ex: `https://seusite.com.br`
2. **Usuário**: Usuário do WordPress com permissão de upload
3. **Application Password**: Gere em Usuários > Perfil > Application Passwords

### Opções de Exportação
- **Exportar imagens automaticamente**: Habilita upload de imagens/ícones
- **Qualidade WebP**: Slider de 0-100% (padrão 85%)

---

## Capturas de Tela

![Preview](assets/preview.png)
![Pipeline](assets/pipeline.png)

---

## Arquitetura do Projeto

```
src/
├── code.ts              # Entry point do plugin Figma
├── ui.html              # Interface do usuário
├── pipeline.ts          # Orquestração do fluxo de conversão
├── compiler/
│   └── elementor.compiler.ts  # Compilador para JSON Elementor
├── config/
│   └── widget.registry.ts     # Registro e compilação de widgets
├── services/
│   ├── media/           # Upload de mídia para WordPress
│   └── serializer/      # Serialização de nós Figma
├── extractors/
│   └── background.extractor.ts  # Extração de backgrounds
└── utils/
    ├── style_utils.ts   # Utilitários de extração de estilos
    └── style_normalizer.ts  # Normalização de valores
```

---

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Build
npm run build

# Build com watch
npm run watch

# Limpar e rebuild
npm run clean && npm run build

# Executar testes
npm run test
```

---

## Suporte e Contato

- Suporte: support@figtoel.example.com
- Documentação: https://figtoel.example.com/docs
- Central de ajuda: https://figtoel.example.com/help

---

## Licenciamento

Este plugin é distribuído como produto comercial. O código-fonte não faz parte da distribuição pública. Uso não autorizado, distribuição ou engenharia reversa não são permitidos.
