# Mapeamento de Widgets WordPress para Elementor

## Widgets WordPress Nativos

Os widgets do WordPress precisam ser exportados com o prefixo correto no `widgetType`.

### Formato Correto

Para widgets WordPress no Elementor, use:
- `widgetType: "wp-widget-{nome}"`

### Lista de Widgets WordPress

| Nome no Figma | widgetType Elementor | Descrição |
|---------------|---------------------|-----------|
| `w:wp-custom-menu` | `wp-widget-nav_menu` | Menu Personalizado |
| `w:wp-archives` | `wp-widget-archives` | Arquivos |
| `w:wp-categories` | `wp-widget-categories` | Categorias |
| `w:wp-pages` | `wp-widget-pages` | Páginas |
| `w:wp-recent-posts` | `wp-widget-recent_entries` | Posts Recentes |
| `w:wp-recent-comments` | `wp-widget-recent_comments` | Comentários Recentes |
| `w:wp-search` | `wp-widget-search` | Pesquisar |
| `w:wp-tag-cloud` | `wp-widget-tag_cloud` | Nuvem de Tags |
| `w:wp-calendar` | `wp-widget-calendar` | Calendário |
| `w:wp-meta` | `wp-widget-meta` | Meta |
| `w:wp-rss` | `wp-widget-rss` | RSS |
| `w:wp-audio` | `wp-widget-media_audio` | Áudio |
| `w:wp-video` | `wp-widget-media_video` | Vídeo |
| `w:wp-gallery` | `wp-widget-media_gallery` | Galeria |

### Observações

1. O Elementor usa nomes específicos para widgets WordPress
2. Alguns widgets têm nomes diferentes do padrão WordPress
3. O menu personalizado é `nav_menu`, não `custom-menu`
4. Posts recentes é `recent_entries`, não `recent-posts`
5. Widgets de mídia têm prefixo `media_`

### Exemplo de Uso no Figma

```
Frame "w:wp-custom-menu"  → widgetType: "wp-widget-nav_menu"
Frame "w:wp-search"       → widgetType: "wp-widget-search"
Frame "w:wp-audio"        → widgetType: "wp-widget-media_audio"
```
