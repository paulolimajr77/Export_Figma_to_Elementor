<?php
/**
 * Plugin Name: Figtoel Remote Menus
 * Description: Criação e sincronização de menus via REST API para integração com Figma → Elementor.
 * Version: 1.0.0
 * Author: Paulo
 * Text Domain: figtoel-remote-menus
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Flag global de debug do plugin.
 * Altere para false em produção.
 */
if ( ! defined( 'FIGTOEL_RM_DEBUG' ) ) {
    define( 'FIGTOEL_RM_DEBUG', true );
}

/**
 * Caminho absoluto do plugin.
 */
if ( ! defined( 'FIGTOEL_RM_PATH' ) ) {
    define( 'FIGTOEL_RM_PATH', plugin_dir_path( __FILE__ ) );
}

/**
 * URL base do plugin.
 */
if ( ! defined( 'FIGTOEL_RM_URL' ) ) {
    define( 'FIGTOEL_RM_URL', plugin_dir_url( __FILE__ ) );
}

/**
 * Prefixo único para o plugin.
 */
if ( ! defined( 'FIGTOEL_RM_PREFIX' ) ) {
    define( 'FIGTOEL_RM_PREFIX', 'figtoel_rm_' );
}

// Carrega as classes.
require_once FIGTOEL_RM_PATH . 'includes/class-figtoel-rm-menu-api.php';

/**
 * Inicializa o plugin Figtoel Remote Menus.
 *
 * @return void
 */
function figtoel_rm_init() {
    // Instancia a API de menus.
    new FIGTOEL_RM_Menu_API();
}
add_action( 'plugins_loaded', 'figtoel_rm_init' );
