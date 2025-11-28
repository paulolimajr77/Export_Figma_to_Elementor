<?php
/**
 * Figtoel Remote Menus - Classe de endpoints REST para criação/sincronização de menus.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Classe FIGTOEL_RM_Menu_API
 *
 * Responsável por expor endpoints REST para criação e sincronização de menus
 * a partir de dados enviados por integrações externas (ex.: plugin do Figma).
 */
class FIGTOEL_RM_Menu_API {

    /**
     * Namespace base da REST API.
     *
     * @var string
     */
    protected $namespace = 'figtoel-remote-menus/v1';

    /**
     * Construtor.
     *
     * Registra os hooks necessários para os endpoints REST.
     */
    public function __construct() {
        add_action( 'rest_api_init', [ $this, 'figtoel_rm_register_routes' ] );
    }

    /**
     * Registra as rotas REST do plugin.
     *
     * Endpoint principal:
     * POST /wp-json/figtoel-remote-menus/v1/sync
     *
     * @return void
     */
    public function figtoel_rm_register_routes() {
        register_rest_route(
            $this->namespace,
            '/sync',
            [
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'figtoel_rm_handle_sync' ],
                    'permission_callback' => [ $this, 'figtoel_rm_permission_callback' ],
                    'args'                => [],
                ],
            ]
        );
    }

    /**
     * Callback de permissão do endpoint.
     *
     * Padrão: exige que o usuário autenticado tenha capacidade manage_options.
     * Recomendado: usar Application Passwords ou outro método de autenticação
     * HTTP para chamadas feitas externamente (ex.: plugin do Figma).
     *
     * @return bool
     */
    public function figtoel_rm_permission_callback() {
        $has_cap = current_user_can( 'manage_options' );

        if ( FIGTOEL_RM_DEBUG && ! $has_cap ) {
            error_log( 'FIGTOEL_RM_DEBUG: Permissão negada para acessar /sync. Usuário não possui manage_options.' );
        }

        return $has_cap;
    }

    /**
     * Trata a requisição de sincronização de menu.
     *
     * Estrutura esperada do JSON:
     *
     * {
     *   "menu_name": "Menu Principal",
     *   "menu_location": "primary",
     *   "replace_existing": true,
     *   "items": [
     *     {
     *       "title": "Home",
     *       "url": "https://site.com",
     *       "children": [
     *         {
     *           "title": "Subitem",
     *           "url": "/subitem"
     *         }
     *       ]
     *     }
     *   ]
     * }
     *
     * @param WP_REST_Request $request Objeto da requisição.
     * @return WP_REST_Response
     */
    public function figtoel_rm_handle_sync( WP_REST_Request $request ) {
        $data = $request->get_json_params();

        if ( FIGTOEL_RM_DEBUG ) {
            error_log( 'FIGTOEL_RM_DEBUG: Payload recebido em /sync → ' . print_r( $data, true ) );
        }

        $menu_name       = isset( $data['menu_name'] ) ? sanitize_text_field( $data['menu_name'] ) : '';
        $menu_location   = isset( $data['menu_location'] ) ? sanitize_key( $data['menu_location'] ) : '';
        $replace_existing = isset( $data['replace_existing'] ) ? (bool) $data['replace_existing'] : true;
        $items           = isset( $data['items'] ) && is_array( $data['items'] ) ? $data['items'] : [];

        if ( empty( $menu_name ) ) {
            return $this->figtoel_rm_error_response( 'O campo menu_name é obrigatório.', 400 );
        }

        if ( empty( $items ) ) {
            return $this->figtoel_rm_error_response( 'O campo items é obrigatório e deve ser um array.', 400 );
        }

        // Obtém ou cria o menu.
        $menu_id = $this->figtoel_rm_get_or_create_menu( $menu_name );
        if ( is_wp_error( $menu_id ) ) {
            return $this->figtoel_rm_error_response( $menu_id->get_error_message(), 500 );
        }

        // Associa o menu a uma localização de tema, se fornecida.
        if ( ! empty( $menu_location ) ) {
            $this->figtoel_rm_assign_menu_to_location( $menu_id, $menu_location );
        }

        // Substitui itens existentes, se necessário.
        if ( $replace_existing ) {
            $this->figtoel_rm_delete_all_menu_items( $menu_id );
        }

        // Cria/atualiza os itens com suporte a children.
        $created_count = 0;
        $this->figtoel_rm_create_menu_items_recursive( $menu_id, $items, 0, $created_count );

        $response_data = [
            'success'         => true,
            'menu_id'         => (int) $menu_id,
            'menu_name'       => $menu_name,
            'menu_location'   => $menu_location,
            'items_created'   => (int) $created_count,
            'replace_existing'=> (bool) $replace_existing,
        ];

        if ( FIGTOEL_RM_DEBUG ) {
            error_log( 'FIGTOEL_RM_DEBUG: Sincronização concluída → ' . print_r( $response_data, true ) );
        }

        return new WP_REST_Response( $response_data, 200 );
    }

    /**
     * Obtém o ID de um menu pelo nome ou cria um novo menu se não existir.
     *
     * @param string $menu_name Nome do menu.
     * @return int|WP_Error ID do menu ou erro.
     */
    protected function figtoel_rm_get_or_create_menu( $menu_name ) {
        $menu_obj = wp_get_nav_menu_object( $menu_name );

        if ( $menu_obj && isset( $menu_obj->term_id ) ) {
            if ( FIGTOEL_RM_DEBUG ) {
                error_log( 'FIGTOEL_RM_DEBUG: Menu existente encontrado. ID = ' . $menu_obj->term_id );
            }
            return (int) $menu_obj->term_id;
        }

        $menu_id = wp_create_nav_menu( $menu_name );

        if ( is_wp_error( $menu_id ) ) {
            error_log( 'FIGTOEL_RM_DEBUG: Erro ao criar menu: ' . $menu_id->get_error_message() );
            return $menu_id;
        }

        if ( FIGTOEL_RM_DEBUG ) {
            error_log( 'FIGTOEL_RM_DEBUG: Menu criado. ID = ' . $menu_id );
        }

        return (int) $menu_id;
    }

    /**
     * Associa um menu a uma localização de tema específica.
     *
     * @param int    $menu_id       ID do menu.
     * @param string $menu_location Slug da localização (ex.: 'primary').
     * @return void
     */
    protected function figtoel_rm_assign_menu_to_location( $menu_id, $menu_location ) {
        $locations = get_theme_mod( 'nav_menu_locations' );

        if ( ! is_array( $locations ) ) {
            $locations = [];
        }

        $locations[ $menu_location ] = (int) $menu_id;

        set_theme_mod( 'nav_menu_locations', $locations );

        if ( FIGTOEL_RM_DEBUG ) {
            error_log( sprintf( 'FIGTOEL_RM_DEBUG: Menu ID %d associado à localização %s.', $menu_id, $menu_location ) );
        }
    }

    /**
     * Remove todos os itens de um menu.
     *
     * @param int $menu_id ID do menu.
     * @return void
     */
    protected function figtoel_rm_delete_all_menu_items( $menu_id ) {
        $items = wp_get_nav_menu_items( $menu_id, [ 'post_status' => 'any' ] );

        if ( empty( $items ) ) {
            if ( FIGTOEL_RM_DEBUG ) {
                error_log( 'FIGTOEL_RM_DEBUG: Nenhum item para remover no menu ID ' . $menu_id );
            }
            return;
        }

        foreach ( $items as $item ) {
            if ( isset( $item->ID ) ) {
                wp_delete_post( $item->ID, true );
                if ( FIGTOEL_RM_DEBUG ) {
                    error_log( 'FIGTOEL_RM_DEBUG: Item de menu removido. ID = ' . $item->ID );
                }
            }
        }
    }

    /**
     * Cria itens de menu recursivamente, incluindo children (submenus).
     *
     * Estrutura de cada item:
     * [
     *   'title'    => 'Texto do item',
     *   'url'      => 'https://...',
     *   'children' => [ ... itens filhos ... ]
     * ]
     *
     * @param int   $menu_id       ID do menu.
     * @param array $items         Lista de itens.
     * @param int   $parent_item_id ID do item pai (0 para nível raiz).
     * @param int   $created_count Contador por referência de itens criados.
     *
     * @return void
     */
    protected function figtoel_rm_create_menu_items_recursive( $menu_id, array $items, $parent_item_id = 0, &$created_count = 0 ) {
        foreach ( $items as $item ) {
            $title = isset( $item['title'] ) ? sanitize_text_field( $item['title'] ) : '';
            $url   = isset( $item['url'] ) ? esc_url_raw( $item['url'] ) : '';

            if ( empty( $title ) ) {
                if ( FIGTOEL_RM_DEBUG ) {
                    error_log( 'FIGTOEL_RM_DEBUG: Item ignorado. Título vazio.' );
                }
                continue;
            }

            if ( empty( $url ) ) {
                // URL vazia: define como # para evitar item inválido.
                $url = '#';
            }

            $target      = isset( $item['target'] ) ? sanitize_text_field( $item['target'] ) : '';
            $classes     = isset( $item['classes'] ) ? ( is_array( $item['classes'] ) ? $item['classes'] : explode( ' ', sanitize_text_field( $item['classes'] ) ) ) : [];
            $attr_title  = isset( $item['attr_title'] ) ? sanitize_text_field( $item['attr_title'] ) : '';
            $description = isset( $item['description'] ) ? sanitize_textarea_field( $item['description'] ) : '';

            $menu_item_data = [
                'menu-item-title'       => $title,
                'menu-item-url'         => $url,
                'menu-item-status'      => 'publish',
                'menu-item-parent-id'   => (int) $parent_item_id,
                'menu-item-type'        => 'custom',
                'menu-item-target'      => $target,
                'menu-item-classes'     => $classes,
                'menu-item-attr-title'  => $attr_title,
                'menu-item-description' => $description,
            ];

            $item_id = wp_update_nav_menu_item( $menu_id, 0, $menu_item_data );

            if ( is_wp_error( $item_id ) ) {
                error_log( 'FIGTOEL_RM_DEBUG: Erro ao criar item de menu: ' . $item_id->get_error_message() );
                continue;
            }

            $created_count++;

            if ( FIGTOEL_RM_DEBUG ) {
                error_log(
                    sprintf(
                        'FIGTOEL_RM_DEBUG: Item de menu criado. ID = %d, Título = %s, Pai = %d',
                        $item_id,
                        $title,
                        $parent_item_id
                    )
                );
            }

            // Se houver filhos, chama recursivamente.
            if ( isset( $item['children'] ) && is_array( $item['children'] ) && ! empty( $item['children'] ) ) {
                $this->figtoel_rm_create_menu_items_recursive( $menu_id, $item['children'], $item_id, $created_count );
            }
        }
    }

    /**
     * Retorna uma resposta de erro padronizada da REST API.
     *
     * @param string $message Mensagem de erro.
     * @param int    $status  Código HTTP.
     *
     * @return WP_REST_Response
     */
    protected function figtoel_rm_error_response( $message, $status = 400 ) {
        if ( FIGTOEL_RM_DEBUG ) {
            error_log( 'FIGTOEL_RM_DEBUG: Erro REST → ' . $message . ' (HTTP ' . $status . ')' );
        }

        $data = [
            'success' => false,
            'error'   => $message,
        ];

        return new WP_REST_Response( $data, $status );
    }
}
