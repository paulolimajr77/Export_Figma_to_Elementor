# Relação Completa de Classes Implementadas pelo Elementor para WordPress

## Introdução

O Elementor é um plugin page builder para WordPress que implementa uma arquitetura robusta baseada em classes PHP. Este documento lista as principais classes do plugin Elementor, organizadas por categoria e funcionalidade.

---

## 1. CLASSES BASES (Core Base Classes)

### `Elementor\Base_Object`
- **Função:** Classe base para todos os objetos do Elementor
- **Responsabilidade:** Gerenciar propriedades e métodos comuns a todos os objetos
- **Localização:** `/core/base/base-object.php`

### `Elementor\Base_Control`
- **Função:** Classe abstrata base para todos os controles
- **Responsabilidade:** Definir interface padrão para controles de painel
- **Método:** `render()`, `get_script_depends()`, `get_style_depends()`

### `Elementor\Base_Data_Control`
- **Função:** Classe base para controles de dados que retornam valor único
- **Responsabilidade:** Gerenciar controles simples de dados

### `Elementor\Control_Base_Multiple`
- **Função:** Classe base para controles que retornam múltiplos valores
- **Responsabilidade:** Gerenciar controles com múltiplos parâmetros

### `Elementor\Control_Base_Units`
- **Função:** Classe base para controles baseados em unidades (px, em, %)
- **Responsabilidade:** Processar valores com unidades

### `Elementor\Base_UI_Control`
- **Função:** Classe base para controles UI visuais
- **Responsabilidade:** Renderizar elementos de interface no painel

---

## 2. CONTROLES (Controls)

### `Elementor\Controls_Manager`
- **Função:** Gerenciador central de todos os controles
- **Responsabilidade:** Registrar, recuperar e gerenciar controles
- **Métodos principais:**
  - `register_control()` - Registrar novo controle
  - `get_control_groups()` - Obter grupos de controles
  - `render_control()` - Renderizar controle no painel

### Controles de Dados Disponíveis

#### `Elementor\Control_Text`
- Controle de entrada de texto
- HTML: `<input type="text">`

#### `Elementor\Control_Number`
- Controle para números
- HTML: `<input type="number">`

#### `Elementor\Control_Textarea`
- Controle de área de texto
- HTML: `<textarea>`

#### `Elementor\Control_Select`
- Controle de seleção
- HTML: `<select>`

#### `Elementor\Control_Checkbox`
- Controle de checkbox
- HTML: `<input type="checkbox">`

#### `Elementor\Control_Radio`
- Controle de radio button
- HTML: `<input type="radio">`

#### `Elementor\Control_Color`
- Controle de seleção de cor
- Retorna: Valor hexadecimal da cor

#### `Elementor\Control_Slider`
- Controle de slider/intervalo
- Retorna: Valor numérico

#### `Elementor\Control_Dimension`
- Controle para dimensões (altura, largura)
- Retorna: Array com valores de dimensões

#### `Elementor\Control_Spacing`
- Controle para espaçamento (margin, padding)
- Retorna: Array com valores de espaçamento

#### `Elementor\Control_Responsive_Slider`
- Slider responsivo para diferentes resoluções
- Retorna: Array com valores por breakpoint

#### `Elementor\Control_Image_Dimension`
- Controle para dimensões de imagem
- Retorna: Array com width e height

#### `Elementor\Control_Font`
- Controle de seleção de fonte
- Retorna: Nome da fonte

#### `Elementor\Control_Font_Size`
- Controle de tamanho de fonte
- HTML: Input com unidade

#### `Elementor\Control_Video`
- Controle para seleção de vídeo
- Retorna: URL do vídeo

#### `Elementor\Control_Gallery`
- Controle para galeria de imagens
- Retorna: Array de IDs de imagens

#### `Elementor\Control_Icon`
- Controle para seleção de ícone
- Retorna: Nome do ícone

#### `Elementor\Control_Date_Time`
- Controle para data e hora
- Retorna: Valor de data/hora

#### `Elementor\Control_Repeater`
- Controle para adicionar múltiplos itens (repetidor)
- Retorna: Array de objetos repetidos

#### `Elementor\Control_Raw_HTML`
- Controle para HTML bruto
- Renderiza HTML customizado

#### `Elementor\Control_Heading`
- Controle de título (apenas visual)
- Não retorna valor

#### `Elementor\Control_Section`
- Controle de seção para organizar outros controles
- Não retorna valor

#### `Elementor\Control_Tabs`
- Controle de abas para organizar controles
- Não retorna valor

#### `Elementor\Control_Divider`
- Controle de divisor visual
- Não retorna valor

---

## 3. CONTROLES DE GRUPO (Group Controls)

### `Elementor\Group_Control_Base`
- **Função:** Classe base para controles de grupo
- **Responsabilidade:** Agrupar múltiplos controles relacionados

### `Elementor\Group_Control_Background`
- Controla propriedades de fundo (cor, imagem, gradiente)

### `Elementor\Group_Control_Border`
- Controla propriedades de borda

### `Elementor\Group_Control_Box_Shadow`
- Controla propriedades de sombra

### `Elementor\Group_Control_Text_Shadow`
- Controla propriedades de sombra de texto

### `Elementor\Group_Control_Typography`
- Controla propriedades tipográficas (fonte, tamanho, peso)

### `Elementor\Group_Control_Transition`
- Controla transições CSS

### `Elementor\Group_Control_Transform`
- Controla transformações CSS

---

## 4. WIDGETS (Widgets)

### `Elementor\Widget_Base`
- **Função:** Classe base para todos os widgets
- **Responsabilidade:** Interface padrão para widgets
- **Métodos principais:**
  - `get_name()` - Nome único do widget
  - `get_title()` - Título exibido
  - `get_icon()` - Ícone do widget
  - `get_categories()` - Categorias do widget
  - `add_controls()` - Adicionar controles ao widget
  - `render()` - Renderizar widget no frontend
  - `content_template()` - Template do widget

### Widgets Padrão do Elementor

#### `Elementor\Widget_Heading`
- Widget para títulos/headings
- CSS class: `.elementor-widget-heading`

#### `Elementor\Widget_Text_Editor`
- Widget para edição de texto
- CSS class: `.elementor-widget-text-editor`

#### `Elementor\Widget_Image`
- Widget para imagens
- CSS class: `.elementor-widget-image`

#### `Elementor\Widget_Video`
- Widget para vídeos
- CSS class: `.elementor-widget-video`

#### `Elementor\Widget_Button`
- Widget para botões
- CSS class: `.elementor-widget-button`

#### `Elementor\Widget_Divider`
- Widget para divisores
- CSS class: `.elementor-widget-divider`

#### `Elementor\Widget_Spacer`
- Widget para espaçadores
- CSS class: `.elementor-widget-spacer`

#### `Elementor\Widget_Icon`
- Widget para ícones
- CSS class: `.elementor-widget-icon`

#### `Elementor\Widget_Icon_Box`
- Widget para caixa com ícone
- CSS class: `.elementor-widget-icon-box`

#### `Elementor\Widget_Icon_List`
- Widget para lista de ícones
- CSS class: `.elementor-widget-icon-list`

#### `Elementor\Widget_Alert`
- Widget para alertas
- CSS class: `.elementor-widget-alert`

#### `Elementor\Widget_Accordion`
- Widget para acordeão
- CSS class: `.elementor-widget-accordeon`

#### `Elementor\Widget_Toggle`
- Widget para toggle/comutador
- CSS class: `.elementor-widget-toggle`

#### `Elementor\Widget_Tabs`
- Widget para abas
- CSS class: `.elementor-widget-tabs`

#### `Elementor\Widget_Gallery`
- Widget para galeria de imagens
- CSS class: `.elementor-widget-gallery`

#### `Elementor\Widget_Image_Gallery`
- Widget para galeria de imagens (básico)
- CSS class: `.elementor-widget-image-gallery`

#### `Elementor\Widget_Image_Carousel`
- Widget para carrossel de imagens
- CSS class: `.elementor-widget-image-carousel`

#### `Elementor\Widget_Image_Box`
- Widget para caixa de imagem
- CSS class: `.elementor-widget-image-box`

#### `Elementor\Widget_Counter`
- Widget para contador
- CSS class: `.elementor-widget-counter`

#### `Elementor\Widget_Progress_Bar`
- Widget para barra de progresso
- CSS class: `.elementor-widget-progress`

#### `Elementor\Widget_Star_Rating`
- Widget para avaliação por estrelas
- CSS class: `.elementor-widget-star-rating`

#### `Elementor\Widget_Testimonial`
- Widget para depoimentos
- CSS class: `.elementor-widget-testimonial`

#### `Elementor\Widget_Testimonial_Carousel`
- Widget para carrossel de depoimentos
- CSS class: `.elementor-widget-testimonial-carousel`

#### `Elementor\Widget_Posts`
- Widget para exibir posts
- CSS class: `.elementor-widget-posts`

#### `Elementor\Widget_Portfolio`
- Widget para portfólio
- CSS class: `.elementor-widget-portfolio`

#### `Elementor\Widget_Form`
- Widget para formulários
- CSS class: `.elementor-widget-form`

#### `Elementor\Widget_Shortcode`
- Widget para shortcodes
- CSS class: `.elementor-widget-shortcode`

#### `Elementor\Widget_Html`
- Widget para HTML customizado
- CSS class: `.elementor-widget-html`

#### `Elementor\Widget_Google_Maps`
- Widget para Google Maps
- CSS class: `.elementor-widget-google_maps`

#### `Elementor\Widget_SoundCloud`
- Widget para SoundCloud
- CSS class: `.elementor-widget-soundcloud`

#### `Elementor\Widget_Social_Icons`
- Widget para ícones sociais
- CSS class: `.elementor-widget-social-icons`

#### `Elementor\Widget_Share_Buttons`
- Widget para botões de compartilhamento
- CSS class: `.elementor-widget-share-buttons`

#### `Elementor\Widget_Call_To_Action`
- Widget para call-to-action
- CSS class: `.elementor-widget-call-to-action`

#### `Elementor\Widget_Blockquote`
- Widget para citações (blockquote)
- CSS class: `.elementor-widget-blockquote`

#### `Elementor\Widget_Price_Table`
- Widget para tabela de preços
- CSS class: `.elementor-widget-price-table`

#### `Elementor\Widget_Price_List`
- Widget para lista de preços
- CSS class: `.elementor-widget-price-list`

#### `Elementor\Widget_Animated_Headline`
- Widget para títulos animados
- CSS class: `.elementor-widget-animated-headline`

#### `Elementor\Widget_Flip_Box`
- Widget para caixa com efeito flip
- CSS class: `.elementor-widget-flip-box`

#### `Elementor\Widget_Countdown`
- Widget para contagem regressiva
- CSS class: `.elementor-widget-countdown`

#### `Elementor\Widget_Slides`
- Widget para slides
- CSS class: `.elementor-widget-slides`

#### `Elementor\Widget_Media_Carousel`
- Widget para carrossel de mídia
- CSS class: `.elementor-widget-media-carousel`

---

## 5. ESTRUTURA DE PÁGINA

### `Elementor\Core\Structures\Container`
- **Função:** Gerenciar contêineres de página
- **Responsabilidade:** Criar e gerenciar estrutura de layout

### `Elementor\Core\Structures\Section`
- **Função:** Gerenciar seções
- **Responsabilidade:** Organizar elementos em seções

### `Elementor\Core\Structures\Column`
- **Função:** Gerenciar colunas
- **Responsabilidade:** Organizar elementos em colunas

---

## 6. RENDERIZADORES (Renderers)

### `Elementor\Plugin::$frontend`
- **Classe:** `Elementor\Frontend`
- **Função:** Renderizar conteúdo do Elementor no frontend
- **Responsabilidade:** Processar dados e gerar HTML/CSS

### `Elementor\Modules\PageTemplates\Module`
- **Função:** Gerenciar templates de página
- **Responsabilidade:** Aplicar templates customizados

---

## 7. GERENCIADORES (Managers)

### `Elementor\Plugin`
- **Função:** Classe principal do plugin
- **Responsabilidade:** Inicializar e gerenciar todo o Elementor

### `Elementor\Editor`
- **Função:** Gerenciar o editor Elementor
- **Responsabilidade:** Lidar com requisições AJAX do editor

### `Elementor\ElementsManager`
- **Função:** Gerenciar widgets e categorias
- **Responsabilidade:** Registrar e recuperar widgets

### `Elementor\Controls_Manager`
- **Função:** Gerenciar controles
- **Responsabilidade:** Registrar e recuperar tipos de controles

### `Elementor\Widgets_Manager`
- **Função:** Gerenciar widgets registrados
- **Responsabilidade:** Manter registro de widgets ativos

### `Elementor\Modules_Manager`
- **Função:** Gerenciar módulos do Elementor
- **Responsabilidade:** Registrar e ativar/desativar módulos

### `Elementor\Assets_Manager`
- **Função:** Gerenciar assets (CSS, JS)
- **Responsabilidade:** Carregar e enqueurar scripts e estilos

---

## 8. MÓDULOS (Modules)

### `Elementor\Modules\DevTools\Module`
- Ferramentas de desenvolvimento

### `Elementor\Modules\Finder\Module`
- Função de busca/finder do Elementor

### `Elementor\Modules\Usage\Module`
- Rastreamento de uso de widgets

### `Elementor\Modules\History\Module`
- Gerenciar histórico de edições

### `Elementor\Modules\Favorites\Module`
- Gerenciar widgets favoritos

### `Elementor\Modules\NestedElements\Module`
- Suporte para elementos aninhados

### `Elementor\Modules\DynamicTags\Module`
- Gerenciar tags dinâmicas

### `Elementor\Modules\PageTemplates\Module`
- Gerenciar templates de página

### `Elementor\Modules\ThemeBuilder\Module`
- Gerenciar theme builder (Elementor Pro)

### `Elementor\Modules\GlobalWidget\Module`
- Gerenciar widgets globais (Elementor Pro)

### `Elementor\Modules\PopupBuilder\Module`
- Gerenciar popup builder (Elementor Pro)

---

## 9. CLASSES DE DADOS

### `Elementor\DB`
- **Função:** Gerenciar dados no banco de dados
- **Responsabilidade:** Salvar, recuperar e atualizar dados do Elementor

### `Elementor\Document`
- **Função:** Classe base para documentos
- **Responsabilidade:** Gerenciar documento Elementor (post)

### `Elementor\Post_CSS`
- **Função:** Gerenciar CSS customizado por post
- **Responsabilidade:** Gerar e cachear CSS do post

### `Elementor\Global_CSS`
- **Função:** Gerenciar CSS global
- **Responsabilidade:** Gerar CSS global do site

---

## 10. UTILITÁRIOS

### `Elementor\Utils`
- **Função:** Classe com métodos utilitários
- **Métodos:** 
  - `get_placeholder_image_src()` - Imagem placeholder
  - `format_bytes()` - Formatar bytes
  - `print_js_config()` - Imprimir configuração JS

### `Elementor\Plugin::$secure_time`
- Classe para validar tokens de segurança

### `Elementor\Template_Library\Manager`
- Gerenciar biblioteca de templates

### `Elementor\Import_Export\Manager`
- Gerenciar importação e exportação

---

## 11. VALIDADORES E SANITIZADORES

### `Elementor\Core\Validation\Validator`
- Validar dados antes de salvar

### `Elementor\Core\Sanitize\Sanitizer`
- Sanitizar dados de entrada

---

## 12. INTERFACES IMPORTANTES

### `Elementor\Base_Object_Interface`
- Interface base para objetos Elementor

### `Elementor\Widget_Interface`
- Interface para widgets

### `Elementor\Control_Interface`
- Interface para controles

---

## 13. CLASSES PARA ADDONS

Para criar um addon do Elementor, você precisará trabalhar com:

### Plugin Addon Base
```php
class My_Plugin {
    public function __construct() {
        add_action( 'elementor/widgets/register', [ $this, 'register_widgets' ] );
        add_action( 'elementor/controls/register', [ $this, 'register_controls' ] );
    }
    
    public function register_widgets( $widgets_manager ) {
        // Registrar widgets customizados
    }
    
    public function register_controls( $controls_manager ) {
        // Registrar controles customizados
    }
}
```

### Widget Customizado
```php
class My_Custom_Widget extends \Elementor\Widget_Base {
    public function get_name() {}
    public function get_title() {}
    public function register_controls() {}
    public function render() {}
}
```

---

## 14. HOOKS PRINCIPAIS

### Hooks de Ação
- `elementor/widgets/register` - Registrar novo widget
- `elementor/controls/register` - Registrar novo controle
- `elementor/editor/init` - Editor inicializado
- `elementor/frontend/after_enqueue_styles` - Após enfileirar estilos frontend
- `elementor/preview/enqueue_styles` - Enfileirar estilos na preview

### Hooks de Filtro
- `elementor/widgets/wordpress/widget_args` - Argumentos do widget
- `elementor/editor/localize_settings` - Configurações do editor
- `elementor/frontend/section_should_render` - Verificar se seção deve renderizar

---

## RESUMO EXECUTIVO

O Elementor implementa uma arquitetura robusta com:

- **55+ widgets** prontos para uso
- **30+ tipos de controles** para diferentes inputs
- **Arquitetura extensível** para addons customizados
- **Sistema de módulos** para funcionalidades adicionais
- **Gerenciadores especializados** para cada aspecto
- **Validação e sanitização** de dados
- **Sistema de cache** para performance

As classes são organizadas em namespaces (`Elementor\`) e seguem padrões de herança bem definidos, permitindo customização e extensão sem modificar o core.

---

## NOTAS IMPORTANTES

1. **Compatibilidade**: As classes podem variar entre versões do Elementor
2. **Documentação Oficial**: Consulte https://developers.elementor.com para informações atualizadas
3. **CSS Classes**: Para CSS customizado, use as classes `.elementor-widget-*` específicas de cada widget
4. **Performance**: Utilize o sistema de cache do Elementor para otimizar carregamento
5. **Segurança**: Sempre sanitize dados de entrada e valide saídas

