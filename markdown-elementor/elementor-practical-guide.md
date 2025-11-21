# Guia Prático: Como Usar Classes do Elementor

## Índice
1. [Criar um Widget Customizado](#criar-widget-customizado)
2. [Criar um Controle Customizado](#criar-controle-customizado)
3. [Estender Classes Existentes](#estender-classes)
4. [Hooks e Filtros](#hooks-filtros)
5. [Registrar Elemento Customizado](#registrar-elemento)
6. [Exemplos de Código](#exemplos)

---

## Criar Widget Customizado {#criar-widget-customizado}

### Estrutura Básica

```php
<?php
namespace My_Elementor_Addon;

use Elementor\Controls_Manager;
use Elementor\Widget_Base;

class My_Custom_Widget extends Widget_Base {
    
    // Nome único do widget
    public function get_name() {
        return 'my_custom_widget';
    }
    
    // Título exibido no painel
    public function get_title() {
        return __( 'Meu Widget Customizado', 'textdomain' );
    }
    
    // Ícone do widget
    public function get_icon() {
        return 'eicon-box';
    }
    
    // Categorias do widget
    public function get_categories() {
        return [ 'basic' ];
    }
    
    // Adicionar controles (settings)
    protected function register_controls() {
        // Seção de Conteúdo
        $this->start_controls_section(
            'section_content',
            [
                'label' => __( 'Conteúdo', 'textdomain' ),
            ]
        );
        
        // Controle de Texto
        $this->add_control(
            'title',
            [
                'label' => __( 'Título', 'textdomain' ),
                'type' => Controls_Manager::TEXT,
                'default' => __( 'Digite seu título', 'textdomain' ),
            ]
        );
        
        // Controle de Textarea
        $this->add_control(
            'description',
            [
                'label' => __( 'Descrição', 'textdomain' ),
                'type' => Controls_Manager::TEXTAREA,
                'rows' => 10,
            ]
        );
        
        // Controle de Cor
        $this->add_control(
            'color',
            [
                'label' => __( 'Cor', 'textdomain' ),
                'type' => Controls_Manager::COLOR,
                'default' => '#3085fe',
            ]
        );
        
        $this->end_controls_section();
        
        // Seção de Estilo
        $this->start_controls_section(
            'section_style',
            [
                'label' => __( 'Estilo', 'textdomain' ),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
        
        // Controle de Espaçamento
        $this->add_responsive_control(
            'padding',
            [
                'label' => __( 'Padding', 'textdomain' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', 'em', '%' ],
                'selectors' => [
                    '{{WRAPPER}} .my-widget' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
        
        $this->end_controls_section();
    }
    
    // Renderizar widget no frontend
    protected function render() {
        $settings = $this->get_settings_for_display();
        ?>
        <div class="my-widget">
            <h2 style="color: <?php echo esc_attr( $settings['color'] ); ?>">
                <?php echo esc_html( $settings['title'] ); ?>
            </h2>
            <p><?php echo wp_kses_post( $settings['description'] ); ?></p>
        </div>
        <?php
    }
    
    // Template para o editor (JavaScript)
    protected function content_template() {
        ?>
        <div class="my-widget">
            <h2 style="color: {{{ settings.color }}}">
                {{{ settings.title }}}
            </h2>
            <p>{{{ settings.description }}}</p>
        </div>
        <?php
    }
}
```

---

## Criar Controle Customizado {#criar-controle-customizado}

```php
<?php
namespace My_Elementor_Addon;

use Elementor\Base_Data_Control;

class My_Custom_Control extends Base_Data_Control {
    
    // Nome único do controle
    public function get_type() {
        return 'my_custom_control';
    }
    
    // Título do controle
    public function get_title() {
        return __( 'Meu Controle Customizado', 'textdomain' );
    }
    
    // Renderizar controle no painel
    public function content_template() {
        $this->add_render_attribute( 'input', [
            'type' => 'text',
            'class' => 'elementor-control-input my-custom-input',
            'data-setting' => '{{{ data.name }}}',
        ] );
        ?>
        <div class="elementor-control-field">
            <label class="elementor-control-title">{{{ data.label }}}</label>
            <div class="elementor-control-input-wrapper">
                <input {{{ elementor.views.ControlsPanel.getClassAttributeString( 'input' ) }}} />
            </div>
        </div>
        <?php
    }
    
    // Dependências de script
    public function get_script_depends() {
        return [ 'my-custom-control-script' ];
    }
    
    // Dependências de estilo
    public function get_style_depends() {
        return [ 'my-custom-control-style' ];
    }
}
```

---

## Estender Classes Existentes {#estender-classes}

### Estender Widget Heading

```php
<?php
namespace My_Elementor_Addon;

use Elementor\Widget_Heading;
use Elementor\Controls_Manager;

class Extended_Heading extends Widget_Heading {
    
    public function get_name() {
        return 'extended_heading';
    }
    
    protected function register_controls() {
        // Chamar controles pai
        parent::register_controls();
        
        // Adicionar novo controle
        $this->start_controls_section(
            'section_extended',
            [
                'label' => __( 'Extensões', 'textdomain' ),
            ]
        );
        
        $this->add_control(
            'gradient_effect',
            [
                'label' => __( 'Efeito Gradiente', 'textdomain' ),
                'type' => Controls_Manager::SWITCHER,
                'default' => '',
                'label_on' => __( 'Sim', 'textdomain' ),
                'label_off' => __( 'Não', 'textdomain' ),
            ]
        );
        
        $this->end_controls_section();
    }
}
```

---

## Hooks e Filtros {#hooks-filtros}

### Registrar Widget no Elementor

```php
<?php
function register_my_widgets( $widgets_manager ) {
    require_once( __DIR__ . '/widgets/my-widget.php' );
    $widgets_manager->register( new \My_Elementor_Addon\My_Custom_Widget() );
}
add_action( 'elementor/widgets/register', 'register_my_widgets' );
```

### Registrar Controle Customizado

```php
<?php
function register_my_controls( $controls_manager ) {
    require_once( __DIR__ . '/controls/my-control.php' );
    $controls_manager->register( new \My_Elementor_Addon\My_Custom_Control() );
}
add_action( 'elementor/controls/register', 'register_my_controls' );
```

### Filtrar Widgets Disponíveis

```php
<?php
function exclude_widgets( $widgets ) {
    // Remove widget específico
    unset( $widgets['counter'] );
    return $widgets;
}
add_filter( 'elementor/widgets/widgets_list', 'exclude_widgets' );
```

### Modificar Controles

```php
<?php
function modify_controls( $controls_manager ) {
    // Adicionar controle global
    $controls_manager->add_control(
        'my_global_control',
        [
            'label' => __( 'Controle Global', 'textdomain' ),
            'type' => 'text',
        ]
    );
}
add_action( 'elementor/controls/register', 'modify_controls' );
```

---

## Registrar Elemento Customizado {#registrar-elemento}

### Estrutura Completa do Plugin

```php
<?php
/**
 * Plugin Name: Meu Addon Elementor
 * Description: Addon customizado para Elementor
 * Version: 1.0.0
 * Author: Seu Nome
 * Requires Plugins: elementor
 */

namespace My_Elementor_Addon;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class Plugin {
    
    const VERSION = '1.0.0';
    const MINIMUM_ELEMENTOR_VERSION = '3.0.0';
    const MINIMUM_PHP_VERSION = '7.4';
    
    private static $instance = null;
    
    public static function instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        add_action( 'plugins_loaded', [ $this, 'init' ] );
    }
    
    public function init() {
        // Verificar dependências
        if ( ! did_action( 'elementor/loaded' ) ) {
            add_action( 'admin_notices', [ $this, 'admin_notice_missing_main_plugin' ] );
            return;
        }
        
        if ( ! version_compare( PHP_VERSION, self::MINIMUM_PHP_VERSION, '>=' ) ) {
            add_action( 'admin_notices', [ $this, 'admin_notice_minimum_php_version' ] );
            return;
        }
        
        // Registrar widgets
        add_action( 'elementor/widgets/register', [ $this, 'register_widgets' ] );
        
        // Registrar controles
        add_action( 'elementor/controls/register', [ $this, 'register_controls' ] );
        
        // Carregar estilos e scripts
        add_action( 'elementor/frontend/after_register_scripts', [ $this, 'register_scripts' ] );
        add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'register_editor_scripts' ] );
    }
    
    public function register_widgets( $widgets_manager ) {
        require_once( __DIR__ . '/widgets/my-widget.php' );
        require_once( __DIR__ . '/widgets/my-another-widget.php' );
        
        $widgets_manager->register( new My_Custom_Widget() );
        $widgets_manager->register( new My_Another_Widget() );
    }
    
    public function register_controls( $controls_manager ) {
        require_once( __DIR__ . '/controls/my-control.php' );
        $controls_manager->register( new My_Custom_Control() );
    }
    
    public function register_scripts() {
        wp_register_script(
            'my-addon-script',
            plugins_url( 'assets/js/my-addon.js', __FILE__ ),
            [ 'elementor-frontend' ],
            self::VERSION
        );
    }
    
    public function register_editor_scripts() {
        wp_enqueue_script(
            'my-addon-editor',
            plugins_url( 'assets/js/my-addon-editor.js', __FILE__ ),
            [ 'elementor-editor' ],
            self::VERSION
        );
    }
    
    public function admin_notice_missing_main_plugin() {
        ?>
        <div class="notice notice-warning is-dismissible">
            <p><?php _e( 'Meu Addon Elementor requer Elementor instalado e ativo.', 'textdomain' ); ?></p>
        </div>
        <?php
    }
    
    public function admin_notice_minimum_php_version() {
        ?>
        <div class="notice notice-warning is-dismissible">
            <p><?php printf( __( 'Meu Addon Elementor requer PHP %s ou superior.', 'textdomain' ), self::MINIMUM_PHP_VERSION ); ?></p>
        </div>
        <?php
    }
}

Plugin::instance();
```

---

## Exemplos de Código {#exemplos}

### Exemplo 1: Widget com Repeater

```php
<?php
protected function register_controls() {
    $this->start_controls_section( 'section_items', [
        'label' => __( 'Items', 'textdomain' ),
    ] );
    
    $repeater = new \Elementor\Repeater();
    
    $repeater->add_control(
        'item_title',
        [
            'label' => __( 'Title', 'textdomain' ),
            'type' => Controls_Manager::TEXT,
        ]
    );
    
    $repeater->add_control(
        'item_icon',
        [
            'label' => __( 'Icon', 'textdomain' ),
            'type' => Controls_Manager::ICON,
        ]
    );
    
    $this->add_control(
        'items_list',
        [
            'label' => __( 'Items', 'textdomain' ),
            'type' => Controls_Manager::REPEATER,
            'fields' => $repeater->get_controls(),
            'default' => [
                [
                    'item_title' => __( 'Item 1', 'textdomain' ),
                    'item_icon' => 'fa fa-star',
                ],
            ],
        ]
    );
    
    $this->end_controls_section();
}

protected function render() {
    $settings = $this->get_settings_for_display();
    
    foreach ( $settings['items_list'] as $item ) {
        echo '<div class="item">';
        echo '<i class="' . esc_attr( $item['item_icon'] ) . '"></i>';
        echo '<h3>' . esc_html( $item['item_title'] ) . '</h3>';
        echo '</div>';
    }
}
```

### Exemplo 2: Controle Responsivo

```php
<?php
$this->add_responsive_control(
    'margin',
    [
        'label' => __( 'Margin', 'textdomain' ),
        'type' => Controls_Manager::DIMENSIONS,
        'size_units' => [ 'px', 'em', 'rem', '%' ],
        'selectors' => [
            '{{WRAPPER}}' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
        ],
        'tablet_default' => [
            'unit' => 'px',
        ],
        'mobile_default' => [
            'unit' => 'px',
        ],
    ]
);
```

### Exemplo 3: Controle Condicional

```php
<?php
$this->add_control(
    'show_description',
    [
        'label' => __( 'Show Description', 'textdomain' ),
        'type' => Controls_Manager::SWITCHER,
        'default' => 'yes',
    ]
);

$this->add_control(
    'description',
    [
        'label' => __( 'Description', 'textdomain' ),
        'type' => Controls_Manager::TEXTAREA,
        'condition' => [
            'show_description' => 'yes',
        ],
    ]
);
```

### Exemplo 4: Group Control Typography

```php
<?php
use Elementor\Group_Control_Typography;

$this->add_group_control(
    Group_Control_Typography::get_type(),
    [
        'name' => 'title_typography',
        'label' => __( 'Title Typography', 'textdomain' ),
        'selector' => '{{WRAPPER}} h2',
    ]
);
```

---

## Melhorias e Boas Práticas

### 1. Sanitização de Dados
```php
<?php
$title = isset( $_POST['title'] ) ? sanitize_text_field( $_POST['title'] ) : '';
$description = isset( $_POST['description'] ) ? wp_kses_post( $_POST['description'] ) : '';
```

### 2. Verificação de Permissões
```php
<?php
if ( ! current_user_can( 'manage_options' ) ) {
    wp_die( __( 'Sem permissão', 'textdomain' ) );
}
```

### 3. Nonces para AJAX
```php
<?php
wp_verify_nonce( $_POST['_wpnonce'], 'my_action' );
wp_nonce_field( 'my_action' );
```

### 4. Localizações (i18n)
```php
<?php
load_plugin_textdomain(
    'textdomain',
    false,
    dirname( plugin_basename( __FILE__ ) ) . '/languages/'
);
```

---

## Debugging

### Ver estrutura de dados do widget
```php
<?php
echo '<pre>';
var_dump( $this->get_settings_for_display() );
echo '</pre>';
```

### Verificar se Elementor está ativo
```php
<?php
if ( did_action( 'elementor/loaded' ) ) {
    // Elementor está carregado
}
```

### Log de debug
```php
<?php
error_log( print_r( $data, true ) );
```

---

## Recursos Adicionais

- **Documentação Oficial:** https://developers.elementor.com/
- **GitHub Repository:** https://github.com/elementor/elementor
- **Comunidade:** https://elementor.com/community/

