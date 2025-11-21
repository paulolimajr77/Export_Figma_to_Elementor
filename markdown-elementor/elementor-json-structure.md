# Estrutura JSON do Elementor - Guia Completo

## Índice
1. [Introdução](#introdução)
2. [Estrutura Base](#estrutura-base)
3. [Tipos de Elementos](#tipos-de-elementos)
4. [Estrutura de Controles](#estrutura-de-controles)
5. [Exemplos Completos](#exemplos-completos)
6. [Propriedades de Settings](#propriedades-de-settings)
7. [Dicas Práticas](#dicas-práticas)

---

## Introdução {#introdução}

O Elementor armazena todas as páginas e widgets em formato JSON, tanto no banco de dados quanto em arquivos de exportação. Este JSON é estruturado para conter:

- **Metadados da página** (título, tipo, versão)
- **Configurações globais** (page_settings)
- **Elementos de conteúdo** (containers, widgets, seções)
- **Propriedades de cada elemento** (id, settings, estilos)

**Versão JSON:** `0.4` (atual)

---

## Estrutura Base {#estrutura-base}

### Objeto Raiz

```json
{
  "title": "Nome da Página",
  "type": "page",
  "version": "0.4",
  "page_settings": {},
  "content": []
}
```

### Propriedades Raiz

| Propriedade | Tipo | Descrição |
|---|---|---|
| `title` | string | Título da página exibido no dashboard |
| `type` | string | Tipo de documento: `page`, `post`, `header`, `footer`, `popup`, `error-404` |
| `version` | string | Versão da estrutura de dados (atualmente `0.4`) |
| `page_settings` | object/array | Configurações da página (vazio se sem configurações) |
| `content` | array | Array com todos os elementos da página |

---

## Tipos de Elementos {#tipos-de-elementos}

### 1. Container (Contêiner)

O container é o elemento básico que agrupa outros elementos.

```json
{
  "id": "a1b2c3d4",
  "elType": "container",
  "isInner": false,
  "settings": {},
  "elements": []
}
```

**Propriedades:**
- `id`: String única de 8 caracteres
- `elType`: `"container"` (tipo de elemento)
- `isInner`: Boolean (false = nível raiz, true = aninhado)
- `settings`: Object com configurações do container
- `elements`: Array com elementos filhos

### 2. Section (Seção)

Seções são tipos especiais de containers (herança do Elementor antigo).

```json
{
  "id": "section123",
  "elType": "section",
  "isInner": false,
  "settings": {},
  "elements": []
}
```

### 3. Column (Coluna)

Colunas ficam dentro de seções.

```json
{
  "id": "column123",
  "elType": "column",
  "isInner": true,
  "settings": {},
  "elements": []
}
```

### 4. Widget (Widget)

Widgets são elementos funcionais que renderizam conteúdo específico.

```json
{
  "id": "widget123",
  "elType": "widget",
  "widgetType": "heading",
  "isInner": false,
  "settings": {},
  "elements": []
}
```

**Tipos de Widget:**
- `heading` - Título
- `text-editor` - Editor de texto
- `image` - Imagem
- `button` - Botão
- `form` - Formulário
- `gallery` - Galeria
- `repeater` - Repetidor
- E muitos outros...

---

## Estrutura de Controles {#estrutura-de-controles}

### Settings de Container

```json
{
  "settings": {
    "content_width": "boxed",
    "background_background": "classic",
    "background_color": "#ffffff",
    "padding": {
      "unit": "px",
      "top": "20",
      "right": "20",
      "bottom": "20",
      "left": "20",
      "isLinked": true
    },
    "margin": {
      "unit": "px",
      "top": "0",
      "right": "0",
      "bottom": "0",
      "left": "0",
      "isLinked": true
    },
    "border_border": "solid",
    "border_width": {
      "unit": "px",
      "top": "1",
      "right": "1",
      "bottom": "1",
      "left": "1",
      "isLinked": true
    },
    "border_color": "#cccccc",
    "box_shadow_box_shadow": {
      "horizontal": 0,
      "vertical": 5,
      "blur": 15,
      "spread": 0,
      "color": "rgba(0,0,0,0.1)",
      "position": "outside"
    }
  }
}
```

### Settings de Widget Heading

```json
{
  "settings": {
    "title": "Seu Título Aqui",
    "header_size": "h1",
    "align": "left",
    "title_color": "#000000",
    "typography_typography": "custom",
    "typography_font_family": "Arial",
    "typography_font_size": {
      "unit": "px",
      "size": 36,
      "sizes": []
    },
    "typography_font_weight": "700",
    "typography_text_transform": "none",
    "typography_line_height": {
      "unit": "em",
      "size": 1.5,
      "sizes": []
    }
  }
}
```

### Settings Responsivos

```json
{
  "settings": {
    "font_size": {
      "unit": "px",
      "size": 24,
      "sizes": {
        "desktop": "24",
        "tablet": "20",
        "mobile": "16"
      }
    }
  }
}
```

### Settings com Dimensões

```json
{
  "settings": {
    "padding": {
      "unit": "px",
      "top": "20",
      "right": "30",
      "bottom": "20",
      "left": "30",
      "isLinked": false
    }
  }
}
```

### Settings com Cores

```json
{
  "settings": {
    "color": "#3085fe",
    "background_color": "#f0f0f0",
    "border_color": "#cccccc"
  }
}
```

### Settings com Gradiente

```json
{
  "settings": {
    "background_background": "gradient",
    "background_color": "#3085fe",
    "background_color_stop": {
      "unit": "%",
      "size": 0,
      "sizes": []
    },
    "background_color_b": "#ff6b6b",
    "background_color_b_stop": {
      "unit": "%",
      "size": 100,
      "sizes": []
    },
    "background_gradient_type": "linear",
    "background_gradient_angle": {
      "unit": "deg",
      "size": 90,
      "sizes": []
    }
  }
}
```

---

## Exemplos Completos {#exemplos-completos}

### Exemplo 1: Página Simples com Heading e Botão

```json
{
  "title": "Página de Boas-vindas",
  "type": "page",
  "version": "0.4",
  "page_settings": {
    "background_background": "classic",
    "background_color": "#f5f5f5"
  },
  "content": [
    {
      "id": "container001",
      "elType": "container",
      "isInner": false,
      "settings": {
        "content_width": "boxed",
        "padding": {
          "unit": "px",
          "top": "60",
          "right": "40",
          "bottom": "60",
          "left": "40",
          "isLinked": false
        }
      },
      "elements": [
        {
          "id": "heading001",
          "elType": "widget",
          "widgetType": "heading",
          "isInner": false,
          "settings": {
            "title": "Bem-vindo ao Meu Site",
            "header_size": "h1",
            "align": "center",
            "title_color": "#222222"
          },
          "elements": []
        },
        {
          "id": "button001",
          "elType": "widget",
          "widgetType": "button",
          "isInner": false,
          "settings": {
            "text": "Clique Aqui",
            "button_text_color": "#ffffff",
            "background_color": "#3085fe",
            "align": "center"
          },
          "elements": []
        }
      ]
    }
  ]
}
```

### Exemplo 2: Seção com Coluna (Estrutura Antiga)

```json
{
  "title": "Página com Seções",
  "type": "page",
  "version": "0.4",
  "page_settings": [],
  "content": [
    {
      "id": "section001",
      "elType": "section",
      "isInner": false,
      "settings": {
        "background_background": "classic",
        "background_color": "#ffffff",
        "padding": {
          "unit": "px",
          "top": "20",
          "right": "20",
          "bottom": "20",
          "left": "20",
          "isLinked": true
        }
      },
      "elements": [
        {
          "id": "column001",
          "elType": "column",
          "isInner": true,
          "settings": {
            "_column_size": 100,
            "_inline_size": null,
            "_margin": {
              "unit": "px",
              "top": "0",
              "right": "0",
              "bottom": "0",
              "left": "0",
              "isLinked": true
            }
          },
          "elements": [
            {
              "id": "text001",
              "elType": "widget",
              "widgetType": "text-editor",
              "isInner": true,
              "settings": {
                "editor": "<p>Este é um parágrafo de texto.</p>"
              },
              "elements": []
            }
          ]
        }
      ]
    }
  ]
}
```

### Exemplo 3: Página com Repeater (Lista de Itens)

```json
{
  "title": "Página com Lista",
  "type": "page",
  "version": "0.4",
  "page_settings": [],
  "content": [
    {
      "id": "container002",
      "elType": "container",
      "isInner": false,
      "settings": {},
      "elements": [
        {
          "id": "icon_list001",
          "elType": "widget",
          "widgetType": "icon-list",
          "isInner": false,
          "settings": {
            "icon_list": [
              {
                "_id": "item1",
                "text": "Primeiro Item",
                "icon": "fas fa-check",
                "_key": "item1"
              },
              {
                "_id": "item2",
                "text": "Segundo Item",
                "icon": "fas fa-check",
                "_key": "item2"
              },
              {
                "_id": "item3",
                "text": "Terceiro Item",
                "icon": "fas fa-check",
                "_key": "item3"
              }
            ]
          },
          "elements": []
        }
      ]
    }
  ]
}
```

### Exemplo 4: Widget de Imagem com Estilos

```json
{
  "id": "image001",
  "elType": "widget",
  "widgetType": "image",
  "isInner": false,
  "settings": {
    "image": {
      "url": "https://exemplo.com/imagem.jpg",
      "id": 123,
      "size": "full",
      "alt": "Descrição da Imagem",
      "source": "library"
    },
    "image_size": "full",
    "image_custom_dimension": {
      "width": "300",
      "height": "300"
    },
    "image_border_border": "solid",
    "image_border_width": {
      "unit": "px",
      "top": "2",
      "right": "2",
      "bottom": "2",
      "left": "2",
      "isLinked": true
    },
    "image_border_color": "#cccccc",
    "image_border_radius": {
      "unit": "px",
      "top": "10",
      "right": "10",
      "bottom": "10",
      "left": "10",
      "isLinked": true
    },
    "image_shadow_box_shadow": {
      "horizontal": 0,
      "vertical": 10,
      "blur": 20,
      "spread": 0,
      "color": "rgba(0,0,0,0.2)",
      "position": "outside"
    },
    "link": {
      "url": "https://exemplo.com",
      "is_external": false,
      "nofollow": false
    }
  },
  "elements": []
}
```

### Exemplo 5: Widget de Formulário

```json
{
  "id": "form001",
  "elType": "widget",
  "widgetType": "form",
  "isInner": false,
  "settings": {
    "form_name": "contact",
    "form_id": "contact_form",
    "form_fields": [
      {
        "_id": "field1",
        "field_type": "text",
        "field_label": "Nome",
        "placeholder": "Digite seu nome",
        "required": "yes",
        "_key": "field1"
      },
      {
        "_id": "field2",
        "field_type": "email",
        "field_label": "E-mail",
        "placeholder": "seu@email.com",
        "required": "yes",
        "_key": "field2"
      },
      {
        "_id": "field3",
        "field_type": "textarea",
        "field_label": "Mensagem",
        "placeholder": "Digite sua mensagem",
        "required": "yes",
        "_key": "field3"
      }
    ],
    "form_submit_text": "Enviar",
    "form_custom_post_action": "redirect",
    "form_redirect_to": "https://exemplo.com/obrigado"
  },
  "elements": []
}
```

### Exemplo 6: Galeria de Imagens

```json
{
  "id": "gallery001",
  "elType": "widget",
  "widgetType": "gallery",
  "isInner": false,
  "settings": {
    "gallery": [
      {
        "id": "001",
        "url": "https://exemplo.com/img1.jpg",
        "alt": "Imagem 1"
      },
      {
        "id": "002",
        "url": "https://exemplo.com/img2.jpg",
        "alt": "Imagem 2"
      },
      {
        "id": "003",
        "url": "https://exemplo.com/img3.jpg",
        "alt": "Imagem 3"
      }
    ],
    "gallery_columns": {
      "size": 3,
      "sizes": {
        "desktop": "3",
        "tablet": "2",
        "mobile": "1"
      }
    },
    "gallery_spacing": {
      "unit": "px",
      "size": 15,
      "sizes": []
    }
  },
  "elements": []
}
```

### Exemplo 7: Acordeão

```json
{
  "id": "accordion001",
  "elType": "widget",
  "widgetType": "accordion",
  "isInner": false,
  "settings": {
    "tabs": [
      {
        "tab_title": "Pergunta 1",
        "tab_content": "Resposta para a pergunta 1",
        "_key": "item1",
        "_id": "item1"
      },
      {
        "tab_title": "Pergunta 2",
        "tab_content": "Resposta para a pergunta 2",
        "_key": "item2",
        "_id": "item2"
      },
      {
        "tab_title": "Pergunta 3",
        "tab_content": "Resposta para a pergunta 3",
        "_key": "item3",
        "_id": "item3"
      }
    ]
  },
  "elements": []
}
```

### Exemplo 8: Tabelas de Preço

```json
{
  "id": "price_table001",
  "elType": "widget",
  "widgetType": "price-table",
  "isInner": false,
  "settings": {
    "heading": "Plano Premium",
    "sub_heading": "Melhor para profissionais",
    "price": "99.99",
    "currency": "R$",
    "period": "Mensal",
    "button_text": "Comprar Agora",
    "button_url": "https://exemplo.com/comprar",
    "features": [
      {
        "item_text": "Recurso 1",
        "_key": "feature1",
        "_id": "feature1"
      },
      {
        "item_text": "Recurso 2",
        "_key": "feature2",
        "_id": "feature2"
      },
      {
        "item_text": "Recurso 3",
        "_key": "feature3",
        "_id": "feature3"
      }
    ]
  },
  "elements": []
}
```

---

## Propriedades de Settings {#propriedades-de-settings}

### Propriedades Comuns

| Propriedade | Tipo | Descrição |
|---|---|---|
| `_padding` | object | Espaçamento interno (top, right, bottom, left) |
| `_margin` | object | Espaçamento externo (top, right, bottom, left) |
| `_width` | object | Largura com unidade (px, em, %) |
| `_height` | object | Altura com unidade |
| `background_background` | string | Tipo de fundo: `classic`, `gradient` |
| `background_color` | string | Cor de fundo (hex) |
| `border_border` | string | Tipo de borda: `solid`, `dashed`, `dotted` |
| `border_width` | object | Espessura da borda |
| `border_color` | string | Cor da borda |
| `border_radius` | object | Raio dos cantos |
| `box_shadow_box_shadow` | object | Sombra da caixa |
| `text_align` | string | Alinhamento: `left`, `center`, `right`, `justify` |

### Estrutura de Dimensão

```json
{
  "unit": "px",
  "top": "20",
  "right": "30",
  "bottom": "20",
  "left": "30",
  "isLinked": false
}
```

### Estrutura de Tamanho com Unidade

```json
{
  "unit": "px",
  "size": 100,
  "sizes": {
    "desktop": "100",
    "tablet": "80",
    "mobile": "60"
  }
}
```

### Estrutura de Sombra

```json
{
  "horizontal": 0,
  "vertical": 5,
  "blur": 15,
  "spread": 0,
  "color": "rgba(0,0,0,0.1)",
  "position": "outside"
}
```

---

## Dicas Práticas {#dicas-práticas}

### 1. IDs Únicos

Todo elemento deve ter um `id` único. Formato recomendado:
- 8 caracteres alfanuméricos
- Exemplos: `a1b2c3d4`, `container001`, `widget_ab12`

### 2. Tipos de Elementos

**Estrutura:**
- `container` - Novo (padrão moderno)
- `section` - Legado (compatibilidade)
- `column` - Dentro de section

**Conteúdo:**
- `widget` - Qualquer widget específico

### 3. Responsividade

Para suportar diferentes telas, use a estrutura `sizes`:

```json
{
  "font_size": {
    "unit": "px",
    "size": 24,
    "sizes": {
      "desktop": "24",
      "tablet": "20",
      "mobile": "16"
    }
  }
}
```

### 4. Cores com Transparência

Use RGBA para cores com transparência:
```json
{
  "color": "rgba(255, 0, 0, 0.5)"
}
```

### 5. Links

Para adicionar links em widgets:
```json
{
  "link": {
    "url": "https://exemplo.com",
    "is_external": false,
    "nofollow": false,
    "custom_attributes": ""
  }
}
```

### 6. Repeaters

Para elementos que repetem (como lista de itens):
```json
{
  "items": [
    {
      "_id": "item1",
      "title": "Título",
      "content": "Conteúdo",
      "_key": "item1"
    }
  ]
}
```

### 7. Acessando JSON no Banco de Dados

O JSON do Elementor fica armazenado em `wp_postmeta` com a chave `_elementor_data`:

```sql
SELECT post_id, meta_value 
FROM wp_postmeta 
WHERE meta_key = '_elementor_data'
LIMIT 1;
```

### 8. Programaticamente com PHP

```php
<?php
$post_id = 123;
$elementor_data = get_post_meta( $post_id, '_elementor_data', true );

// Converter de JSON string para array
$data = json_decode( $elementor_data, true );

// Modificar
$data['title'] = 'Novo Título';

// Salvar
update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
?>
```

### 9. Importar/Exportar JSON

**Exportar:**
1. Editar página com Elementor
2. Clicar no menu (⋮) no canto inferior esquerdo
3. "Salvar como Template"
4. "Exportar" (baixa JSON)

**Importar:**
1. Dashboard → Templates → Saved Templates
2. "Import Templates"
3. Fazer upload do arquivo JSON

### 10. Estrutura de Página Completa Mínima

```json
{
  "title": "Página Simples",
  "type": "page",
  "version": "0.4",
  "page_settings": [],
  "content": [
    {
      "id": "container_1",
      "elType": "container",
      "isInner": false,
      "settings": [],
      "elements": [
        {
          "id": "widget_1",
          "elType": "widget",
          "widgetType": "heading",
          "isInner": false,
          "settings": {
            "title": "Olá Mundo"
          },
          "elements": []
        }
      ]
    }
  ]
}
```

---

## Referência Rápida de Widgets

| Widget | `widgetType` | Principais Settings |
|---|---|---|
| Heading | `heading` | title, header_size, align, title_color |
| Parágrafo | `text-editor` | editor |
| Imagem | `image` | image, image_size, link |
| Botão | `button` | text, button_text_color, background_color |
| Formulário | `form` | form_fields, form_submit_text |
| Galeria | `gallery` | gallery, gallery_columns |
| Vídeo | `video` | video_type, youtube_url |
| Acordeão | `accordion` | tabs |
| Abas | `tabs` | tabs |
| Ícone | `icon` | icon, icon_color, icon_size |
| Tabela Preço | `price-table` | heading, price, currency, features |
| Contador | `counter` | starting_number, ending_number |
| Lista Ícones | `icon-list` | icon_list |
| Carrossel | `carousel` | slides |

---

## Recursos Adicionais

- **Documentação Oficial:** https://developers.elementor.com/docs/data-structure/
- **GitHub Elementor:** https://github.com/elementor/elementor
- **Exemplos na Comunidade:** https://elementor.com/community/

