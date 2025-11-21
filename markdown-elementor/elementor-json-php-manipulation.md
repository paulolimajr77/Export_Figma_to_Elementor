# Manipulação de JSON Elementor em PHP - Guia Prático

## Índice
1. [Acessar e Modificar JSON](#acessar-json)
2. [Adicionar Elementos](#adicionar-elementos)
3. [Remover Elementos](#remover-elementos)
4. [Clonar Widgets](#clonar-widgets)
5. [Gerar JSON Programaticamente](#gerar-json)
6. [Importar JSON](#importar-json)
7. [Exportar JSON](#exportar-json)
8. [Validação e Erro Handling](#validacao)

---

## Acessar e Modificar JSON {#acessar-json}

### 1. Recuperar JSON da Página

```php
<?php
$post_id = 123; // ID da página

// Recuperar JSON armazenado
$elementor_data_json = get_post_meta( $post_id, '_elementor_data', true );

// Converter JSON string para array PHP
$elementor_data = json_decode( $elementor_data_json, true );

// Verificar se é válido
if ( ! is_array( $elementor_data ) ) {
    wp_die( 'JSON inválido' );
}

// Acessar propriedades
$title = $elementor_data['title'];
$type = $elementor_data['type'];
$content = $elementor_data['content'];
?>
```

### 2. Acessar Página Settings

```php
<?php
$page_settings = $elementor_data['page_settings'];

// Se for um objeto (array associativo)
if ( is_array( $page_settings ) ) {
    $bg_color = $page_settings['background_color'] ?? null;
    $padding = $page_settings['padding'] ?? null;
}
?>
```

### 3. Modificar Título da Página

```php
<?php
$post_id = 123;
$elementor_data_json = get_post_meta( $post_id, '_elementor_data', true );
$elementor_data = json_decode( $elementor_data_json, true );

// Modificar título
$elementor_data['title'] = 'Novo Título da Página';

// Salvar novamente
$updated = update_post_meta(
    $post_id,
    '_elementor_data',
    wp_json_encode( $elementor_data )
);

if ( $updated ) {
    echo 'Página atualizada com sucesso';
}
?>
```

### 4. Modificar Page Settings

```php
<?php
$elementor_data['page_settings'] = [
    'background_background' => 'classic',
    'background_color' => '#ffffff',
    'padding' => [
        'unit' => 'px',
        'top' => '40',
        'right' => '40',
        'bottom' => '40',
        'left' => '40',
        'isLinked' => true
    ]
];

// Salvar
update_post_meta( $post_id, '_elementor_data', wp_json_encode( $elementor_data ) );

// Limpar cache do Elementor
\Elementor\Plugin::$instance->files_manager->clear_cache();
?>
```

---

## Adicionar Elementos {#adicionar-elementos}

### 1. Adicionar Widget de Heading

```php
<?php
function add_heading_widget( $post_id, $title, $heading_size = 'h1' ) {
    $elementor_data = get_post_meta( $post_id, '_elementor_data', true );
    $data = json_decode( $elementor_data, true );
    
    // Gerar ID único
    $widget_id = uniqid( 'widget_' );
    
    // Criar widget
    $new_widget = [
        'id' => $widget_id,
        'elType' => 'widget',
        'widgetType' => 'heading',
        'isInner' => false,
        'settings' => [
            'title' => $title,
            'header_size' => $heading_size,
            'align' => 'left',
            'title_color' => '#000000'
        ],
        'elements' => []
    ];
    
    // Se houver container raiz, adicionar nele
    if ( ! empty( $data['content'] ) ) {
        $data['content'][0]['elements'][] = $new_widget;
    } else {
        // Criar container primeiro
        $container_id = uniqid( 'container_' );
        $container = [
            'id' => $container_id,
            'elType' => 'container',
            'isInner' => false,
            'settings' => [],
            'elements' => [ $new_widget ]
        ];
        $data['content'][] = $container;
    }
    
    // Salvar
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    return true;
}

// Usar
add_heading_widget( 123, 'Novo Título', 'h2' );
?>
```

### 2. Adicionar Widget de Botão

```php
<?php
function add_button_widget( $post_id, $button_text, $button_url ) {
    $elementor_data = get_post_meta( $post_id, '_elementor_data', true );
    $data = json_decode( $elementor_data, true );
    
    $button = [
        'id' => uniqid( 'widget_' ),
        'elType' => 'widget',
        'widgetType' => 'button',
        'isInner' => false,
        'settings' => [
            'text' => $button_text,
            'link' => [ 'url' => $button_url ],
            'button_text_color' => '#ffffff',
            'background_color' => '#3085fe'
        ],
        'elements' => []
    ];
    
    if ( ! empty( $data['content'] ) ) {
        $data['content'][0]['elements'][] = $button;
    }
    
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    return true;
}

// Usar
add_button_widget( 123, 'Clique Aqui', 'https://exemplo.com' );
?>
```

### 3. Adicionar Elemento em Posição Específica

```php
<?php
function add_widget_at_position( $post_id, $widget_data, $container_index = 0, $position = null ) {
    $elementor_data = get_post_meta( $post_id, '_elementor_data', true );
    $data = json_decode( $elementor_data, true );
    
    if ( ! isset( $data['content'][ $container_index ] ) ) {
        return false;
    }
    
    $container = &$data['content'][ $container_index ];
    
    if ( $position === null ) {
        // Adicionar no final
        $container['elements'][] = $widget_data;
    } else {
        // Inserir em posição específica
        array_splice( $container['elements'], $position, 0, [ $widget_data ] );
    }
    
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    return true;
}
?>
```

---

## Remover Elementos {#remover-elementos}

### 1. Remover Widget por ID

```php
<?php
function remove_widget_by_id( $post_id, $widget_id ) {
    $elementor_data = get_post_meta( $post_id, '_elementor_data', true );
    $data = json_decode( $elementor_data, true );
    
    // Percorrer todos os containers
    foreach ( $data['content'] as &$container ) {
        $container['elements'] = array_filter(
            $container['elements'],
            function( $element ) use ( $widget_id ) {
                return $element['id'] !== $widget_id;
            }
        );
        // Re-indexar array
        $container['elements'] = array_values( $container['elements'] );
    }
    
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    return true;
}

// Usar
remove_widget_by_id( 123, 'widget_12345' );
?>
```

### 2. Remover Todos os Widgets de Um Tipo

```php
<?php
function remove_widgets_by_type( $post_id, $widget_type ) {
    $elementor_data = get_post_meta( $post_id, '_elementor_data', true );
    $data = json_decode( $elementor_data, true );
    
    foreach ( $data['content'] as &$container ) {
        $container['elements'] = array_filter(
            $container['elements'],
            function( $element ) use ( $widget_type ) {
                return $element['widgetType'] !== $widget_type;
            }
        );
        $container['elements'] = array_values( $container['elements'] );
    }
    
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    return true;
}

// Usar - Remove todos os botões
remove_widgets_by_type( 123, 'button' );
?>
```

### 3. Remover Tudo Menos Um Tipo

```php
<?php
function keep_only_widget_type( $post_id, $widget_type ) {
    $elementor_data = get_post_meta( $post_id, '_elementor_data', true );
    $data = json_decode( $elementor_data, true );
    
    foreach ( $data['content'] as &$container ) {
        $container['elements'] = array_filter(
            $container['elements'],
            function( $element ) use ( $widget_type ) {
                return $element['widgetType'] === $widget_type;
            }
        );
        $container['elements'] = array_values( $container['elements'] );
    }
    
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    return true;
}
?>
```

---

## Clonar Widgets {#clonar-widgets}

### 1. Clonar Widget por ID

```php
<?php
function clone_widget( $post_id, $widget_id ) {
    $elementor_data = get_post_meta( $post_id, '_elementor_data', true );
    $data = json_decode( $elementor_data, true );
    
    $cloned_widget = null;
    $container_index = null;
    $widget_index = null;
    
    // Procurar pelo widget
    foreach ( $data['content'] as $idx => &$container ) {
        foreach ( $container['elements'] as $w_idx => $element ) {
            if ( $element['id'] === $widget_id ) {
                $cloned_widget = $element;
                $container_index = $idx;
                $widget_index = $w_idx;
                break;
            }
        }
        if ( $cloned_widget ) break;
    }
    
    if ( ! $cloned_widget ) {
        return false;
    }
    
    // Alterar ID do clone
    $cloned_widget['id'] = uniqid( 'widget_' );
    
    // Adicionar depois do widget original
    array_splice(
        $data['content'][ $container_index ]['elements'],
        $widget_index + 1,
        0,
        [ $cloned_widget ]
    );
    
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    return $cloned_widget['id'];
}

// Usar
$new_widget_id = clone_widget( 123, 'widget_original' );
?>
```

### 2. Duplicar Widget N Vezes

```php
<?php
function duplicate_widget( $post_id, $widget_id, $times = 3 ) {
    for ( $i = 0; $i < $times; $i++ ) {
        clone_widget( $post_id, $widget_id );
    }
    
    return true;
}

// Usar
duplicate_widget( 123, 'widget_12345', 5 );
?>
```

---

## Gerar JSON Programaticamente {#gerar-json}

### 1. Criar Página Vazia

```php
<?php
function create_elementor_page( $title, $post_content = '' ) {
    $post_data = [
        'post_type' => 'page',
        'post_title' => $title,
        'post_content' => $post_content,
        'post_status' => 'publish',
    ];
    
    $post_id = wp_insert_post( $post_data );
    
    if ( is_wp_error( $post_id ) ) {
        return false;
    }
    
    // Criar JSON vazio
    $elementor_data = [
        'title' => $title,
        'type' => 'page',
        'version' => '0.4',
        'page_settings' => [],
        'content' => []
    ];
    
    // Salvar
    add_post_meta( $post_id, '_elementor_data', wp_json_encode( $elementor_data ) );
    add_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
    
    return $post_id;
}

// Usar
$page_id = create_elementor_page( 'Minha Página' );
?>
```

### 2. Criar Página com Conteúdo

```php
<?php
function create_elementor_page_with_content( $title, $widgets = [] ) {
    $post_id = wp_insert_post( [
        'post_type' => 'page',
        'post_title' => $title,
        'post_status' => 'publish',
    ] );
    
    if ( is_wp_error( $post_id ) ) {
        return false;
    }
    
    // Criar container
    $container_id = uniqid( 'container_' );
    $container = [
        'id' => $container_id,
        'elType' => 'container',
        'isInner' => false,
        'settings' => [],
        'elements' => $widgets
    ];
    
    // Montar JSON
    $elementor_data = [
        'title' => $title,
        'type' => 'page',
        'version' => '0.4',
        'page_settings' => [],
        'content' => [ $container ]
    ];
    
    // Salvar
    add_post_meta( $post_id, '_elementor_data', wp_json_encode( $elementor_data ) );
    add_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
    
    return $post_id;
}

// Usar
$widgets = [
    [
        'id' => uniqid( 'widget_' ),
        'elType' => 'widget',
        'widgetType' => 'heading',
        'isInner' => false,
        'settings' => [ 'title' => 'Bem-vindo' ],
        'elements' => []
    ]
];

$page_id = create_elementor_page_with_content( 'Página com Conteúdo', $widgets );
?>
```

---

## Importar JSON {#importar-json}

### 1. Importar de Arquivo

```php
<?php
function import_elementor_json( $file_path, $post_id ) {
    if ( ! file_exists( $file_path ) ) {
        return false;
    }
    
    $json_content = file_get_contents( $file_path );
    $data = json_decode( $json_content, true );
    
    if ( ! is_array( $data ) ) {
        return false;
    }
    
    // Validar estrutura
    if ( ! isset( $data['title'], $data['type'], $data['content'] ) ) {
        return false;
    }
    
    // Salvar
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    // Limpar cache
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    
    return true;
}

// Usar
import_elementor_json( '/caminho/para/template.json', 123 );
?>
```

### 2. Importar de String JSON

```php
<?php
function import_elementor_json_string( $json_string, $post_id ) {
    $data = json_decode( $json_string, true );
    
    if ( ! is_array( $data ) ) {
        return false;
    }
    
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    return true;
}
?>
```

---

## Exportar JSON {#exportar-json}

### 1. Exportar para Arquivo

```php
<?php
function export_elementor_json( $post_id, $file_path ) {
    $json_data = get_post_meta( $post_id, '_elementor_data', true );
    
    if ( ! $json_data ) {
        return false;
    }
    
    return file_put_contents( $file_path, $json_data );
}

// Usar
export_elementor_json( 123, '/caminho/para/exportar.json' );
?>
```

### 2. Exportar para Download

```php
<?php
function export_elementor_json_download( $post_id ) {
    $json_data = get_post_meta( $post_id, '_elementor_data', true );
    
    if ( ! $json_data ) {
        wp_die( 'Nenhum dado Elementor encontrado' );
    }
    
    $post = get_post( $post_id );
    $filename = sanitize_file_name( $post->post_title ) . '.json';
    
    header( 'Content-Type: application/json' );
    header( 'Content-Disposition: attachment; filename=' . $filename );
    
    echo $json_data;
    exit;
}

// Usar - Adicionar em functions.php
add_action( 'wp_ajax_export_elementor', function() {
    if ( ! isset( $_GET['post_id'] ) ) {
        wp_die( 'Erro' );
    }
    
    export_elementor_json_download( intval( $_GET['post_id'] ) );
} );
?>
```

---

## Validação e Erro Handling {#validacao}

### 1. Validar JSON

```php
<?php
function validate_elementor_json( $json_string ) {
    $data = json_decode( $json_string, true );
    
    if ( ! is_array( $data ) ) {
        return [ 'valid' => false, 'error' => 'JSON inválido' ];
    }
    
    // Verificar campos obrigatórios
    $required = [ 'title', 'type', 'version', 'content' ];
    foreach ( $required as $field ) {
        if ( ! isset( $data[ $field ] ) ) {
            return [ 'valid' => false, 'error' => "Campo obrigatório ausente: $field" ];
        }
    }
    
    // Verificar versão
    if ( $data['version'] !== '0.4' ) {
        return [ 'valid' => false, 'error' => 'Versão não suportada' ];
    }
    
    return [ 'valid' => true ];
}

// Usar
$result = validate_elementor_json( $json_data );
if ( ! $result['valid'] ) {
    echo 'Erro: ' . $result['error'];
}
?>
```

### 2. Validar Estrutura de Widget

```php
<?php
function validate_widget( $widget ) {
    $required = [ 'id', 'elType', 'widgetType', 'isInner', 'settings', 'elements' ];
    
    foreach ( $required as $field ) {
        if ( ! isset( $widget[ $field ] ) ) {
            return false;
        }
    }
    
    return true;
}
?>
```

### 3. Try-Catch para Segurança

```php
<?php
function safe_update_elementor( $post_id, $data ) {
    try {
        // Validar
        $json_string = wp_json_encode( $data );
        if ( json_last_error() !== JSON_ERROR_NONE ) {
            throw new Exception( 'Erro ao codificar JSON: ' . json_last_error_msg() );
        }
        
        // Validar
        $validate = validate_elementor_json( $json_string );
        if ( ! $validate['valid'] ) {
            throw new Exception( $validate['error'] );
        }
        
        // Atualizar
        update_post_meta( $post_id, '_elementor_data', $json_string );
        
        return [ 'success' => true ];
    } catch ( Exception $e ) {
        return [ 'success' => false, 'error' => $e->getMessage() ];
    }
}

// Usar
$result = safe_update_elementor( 123, $elementor_data );
if ( ! $result['success'] ) {
    error_log( $result['error'] );
}
?>
```

---

## Funções Utilitárias Completas

### Função Genérica para Modificar Widgets

```php
<?php
function modify_elementor_widgets( $post_id, $callback ) {
    $elementor_data = get_post_meta( $post_id, '_elementor_data', true );
    $data = json_decode( $elementor_data, true );
    
    if ( ! is_array( $data ) ) {
        return false;
    }
    
    // Processar cada container
    foreach ( $data['content'] as &$container ) {
        foreach ( $container['elements'] as &$widget ) {
            // Aplicar callback
            $widget = call_user_func( $callback, $widget );
        }
    }
    
    // Salvar
    update_post_meta( $post_id, '_elementor_data', wp_json_encode( $data ) );
    
    return true;
}

// Usar - Adicionar classe CSS a todos os botões
modify_elementor_widgets( 123, function( $widget ) {
    if ( $widget['widgetType'] === 'button' ) {
        $widget['settings']['css_classes'] = 'meu-classe-botao';
    }
    return $widget;
} );
?>
```

### Função para Encontrar Widget

```php
<?php
function find_elementor_widget( $post_id, $widget_type ) {
    $elementor_data = get_post_meta( $post_id, '_elementor_data', true );
    $data = json_decode( $elementor_data, true );
    
    $results = [];
    
    foreach ( $data['content'] as $container ) {
        foreach ( $container['elements'] as $widget ) {
            if ( $widget['widgetType'] === $widget_type ) {
                $results[] = $widget;
            }
        }
    }
    
    return $results;
}

// Usar
$buttons = find_elementor_widget( 123, 'button' );
foreach ( $buttons as $button ) {
    echo $button['settings']['text'];
}
?>
```

---

## Notas Importantes

1. **Backup:** Sempre faça backup antes de modificar JSON programaticamente
2. **Cache:** Limpe o cache do Elementor após modificações
3. **Validação:** Sempre valide JSON antes de salvar
4. **IDs:** Use `uniqid()` para gerar IDs únicos
5. **Encode:** Use `wp_json_encode()` em vez de `json_encode()` para melhor compatibilidade WordPress
6. **Segurança:** Sempre sanitize e valide dados de entrada
7. **Permissões:** Verifique permissões do usuário antes de modificar

