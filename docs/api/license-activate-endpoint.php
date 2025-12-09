<?php
/**
 * ============================================================
 * Figma → Elementor: Endpoint REST para Ativação de Licença
 * Versão: 1.0.0
 * ============================================================
 * 
 * RESTRIÇÃO: 1 USUÁRIO FIGMA + 1 MÁQUINA POR LICENÇA
 * 
 * Este arquivo contém a implementação do endpoint:
 * POST /wp-json/figtoel/v1/license/activate
 * 
 * INSTRUÇÕES:
 * Adicione este código ao seu functions.php do tema child
 * (hello-elementor-child/functions.php) junto com os endpoints
 * já existentes.
 * 
 * ============================================================
 */

// ============================================================
// CONSTANTES (adicionar se não existirem)
// ============================================================

if (!defined('FIGTOEL_FIELD_LIC_FIGMA_PRIMARY')) {
    define('FIGTOEL_FIELD_LIC_FIGMA_PRIMARY', 'figma_user_id_primary');
}

if (!defined('FIGTOEL_FIELD_LIC_FIGMA_EXTRA')) {
    define('FIGTOEL_FIELD_LIC_FIGMA_EXTRA', 'figma_user_ids_extra');
}

if (!defined('FIGTOEL_FIELD_LIC_DEVICE_PRIMARY')) {
    define('FIGTOEL_FIELD_LIC_DEVICE_PRIMARY', 'figma_device_id_primary');
}

// ============================================================
// REGISTRO DO ENDPOINT
// ============================================================

/**
 * Adicionar esta rota dentro da função figtoel_register_rest_routes()
 * junto com as rotas já existentes.
 */
function figtoel_register_activate_route() {
    register_rest_route('figtoel/v1', '/license/activate', array(
        'methods'             => 'POST',
        'callback'            => 'figtoel_handle_license_activate',
        'permission_callback' => '__return_true',
        'args'                => array(
            'license_key' => array(
                'type'              => 'string',
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => 'Chave de licença (ex.: FTEL-XXXX-YYYY)',
            ),
            'figma_user_id' => array(
                'type'              => 'string',
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => 'ID único do usuário Figma',
            ),
            'device_id' => array(
                'type'              => 'string',
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => 'ID único do dispositivo/máquina',
            ),
            'site_domain' => array(
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => 'Domínio do site (para log)',
                'default'           => '',
            ),
            'plugin_version' => array(
                'type'              => 'string',
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
                'description'       => 'Versão do plugin Figma',
                'default'           => '',
            ),
        ),
    ));
}

// ============================================================
// HANDLER DO ENDPOINT DE ATIVAÇÃO
// ============================================================

/**
 * Handler para o endpoint /figtoel/v1/license/activate
 * 
 * Ativa uma licença vinculando um Figma User ID + Device ID.
 * Restrição: 1 usuário + 1 máquina por licença.
 * NÃO consome compilações.
 * 
 * @param WP_REST_Request $request
 * @return array
 */
function figtoel_handle_license_activate(WP_REST_Request $request) {
    // 1. Sanitizar parâmetros
    $license_key    = strtoupper(trim($request->get_param('license_key') ?? ''));
    $figma_user_id  = trim($request->get_param('figma_user_id') ?? '');
    $device_id      = trim($request->get_param('device_id') ?? '');
    $site_domain    = trim($request->get_param('site_domain') ?? '');
    $plugin_version = trim($request->get_param('plugin_version') ?? '');

    // Log para debug
    error_log("[FIGTOEL ACTIVATE] Request: license=" . substr($license_key, 0, 8) . "..., user=" . substr($figma_user_id, -4) . ", device=" . substr($device_id, -4));

    // Validação básica
    if (empty($license_key)) {
        return array(
            'status'  => 'error',
            'code'    => 'missing_license_key',
            'message' => 'License key is required',
        );
    }

    if (empty($figma_user_id)) {
        return array(
            'status'  => 'error',
            'code'    => 'missing_figma_user_id',
            'message' => 'Figma user ID is required',
        );
    }

    if (empty($device_id)) {
        return array(
            'status'  => 'error',
            'code'    => 'missing_device_id',
            'message' => 'Device ID is required',
        );
    }

    // 2. Localizar a licença no CCT
    $license = figtoel_get_license_by_key($license_key);

    // 3. Licença não encontrada
    if (!$license) {
        return array(
            'status'  => 'error',
            'code'    => 'license_not_found',
            'message' => 'License not found',
        );
    }

    // 4. Verificar status da licença
    $license_status = $license['status_licenca'] ?? '';
    if ($license_status !== 'active') {
        return array(
            'status'         => 'error',
            'code'           => 'license_inactive',
            'license_status' => $license_status,
            'message'        => 'License is not active',
        );
    }

    // 5. Ler campos atuais da licença
    $primary_user   = trim($license[FIGTOEL_FIELD_LIC_FIGMA_PRIMARY] ?? '');
    $primary_device = trim($license[FIGTOEL_FIELD_LIC_DEVICE_PRIMARY] ?? '');

    // 6. CASO A: Primeiro bind (ambos vazios)
    if (empty($primary_user) && empty($primary_device)) {
        $update_data = array(
            FIGTOEL_FIELD_LIC_FIGMA_PRIMARY  => $figma_user_id,
            FIGTOEL_FIELD_LIC_DEVICE_PRIMARY => $device_id,
        );

        $updated = figtoel_update_license_fields($license['_ID'], $update_data);

        if (!$updated) {
            return array(
                'status'  => 'error',
                'code'    => 'update_failed',
                'message' => 'Failed to update license record',
            );
        }

        error_log("[FIGTOEL ACTIVATE] First bind: user=" . substr($figma_user_id, -4) . ", device=" . substr($device_id, -4));

        return array(
            'status'        => 'ok',
            'mode'          => 'bound_first_time',
            'license_key'   => figtoel_mask_license_key($license_key),
            'figma_user_id' => $figma_user_id,
            'device_id'     => $device_id,
        );
    }

    // 7. CASO B: Mesmo usuário E mesmo dispositivo (chamada repetida)
    if ($primary_user === $figma_user_id && $primary_device === $device_id) {
        error_log("[FIGTOEL ACTIVATE] Already bound: user=" . substr($figma_user_id, -4));

        return array(
            'status'        => 'ok',
            'mode'          => 'already_bound',
            'license_key'   => figtoel_mask_license_key($license_key),
            'figma_user_id' => $figma_user_id,
            'device_id'     => $device_id,
        );
    }

    // 8. CASO C: Mesmo usuário MAS dispositivo diferente
    if ($primary_user === $figma_user_id && $primary_device !== $device_id) {
        error_log("[FIGTOEL ACTIVATE] Device mismatch: stored=" . substr($primary_device, -4) . ", received=" . substr($device_id, -4));

        return array(
            'status'         => 'error',
            'code'           => 'device_mismatch',
            'message'        => 'License already activated on another device',
            'bound_device'   => substr($primary_device, -8), // Apenas últimos 8 chars
        );
    }

    // 9. CASO D: Usuário diferente (independente do dispositivo)
    if (!empty($primary_user) && $primary_user !== $figma_user_id) {
        error_log("[FIGTOEL ACTIVATE] User mismatch: stored=" . substr($primary_user, -4) . ", received=" . substr($figma_user_id, -4));

        return array(
            'status'  => 'error',
            'code'    => 'figma_mismatch',
            'message' => 'License already bound to another Figma user',
            'primary' => substr($primary_user, -8), // Apenas últimos 8 chars para privacidade
        );
    }

    // Caso não coberto - erro genérico
    return array(
        'status'  => 'error',
        'code'    => 'unknown_error',
        'message' => 'An unexpected error occurred',
    );
}

// ============================================================
// ATUALIZAÇÃO DO ENDPOINT /usage/compile PARA VALIDAR DEVICE
// ============================================================

/**
 * IMPORTANTE: Atualize a função figtoel_handle_compile_usage existente
 * para incluir a validação de device_id.
 * 
 * Adicione este código no INÍCIO da função, logo após carregar a licença:
 */

/*
// Dentro de figtoel_handle_compile_usage(), após carregar a licença:

$figma_user_id = trim($request->get_param('figma_user_id') ?? '');
$device_id     = trim($request->get_param('device_id') ?? '');

// Validar user + device se enviados
if (!empty($figma_user_id) || !empty($device_id)) {
    $primary_user   = trim($license[FIGTOEL_FIELD_LIC_FIGMA_PRIMARY] ?? '');
    $primary_device = trim($license[FIGTOEL_FIELD_LIC_DEVICE_PRIMARY] ?? '');

    // Se há primary configurado, validar
    if (!empty($primary_user) || !empty($primary_device)) {
        // Verificar figma_user_id
        if (!empty($primary_user) && !empty($figma_user_id) && $primary_user !== $figma_user_id) {
            return array(
                'status'  => 'error',
                'code'    => 'device_or_user_mismatch',
                'message' => 'License bound to different user',
            );
        }

        // Verificar device_id
        if (!empty($primary_device) && !empty($device_id) && $primary_device !== $device_id) {
            return array(
                'status'  => 'error',
                'code'    => 'device_or_user_mismatch',
                'message' => 'License bound to different device',
            );
        }
    }
}

// *** Continuar com o fluxo normal de consumo de uso ***
*/

// ============================================================
// ATUALIZAÇÃO DE ARGS DO ENDPOINT /usage/compile
// ============================================================

/**
 * Adicionar estes args ao endpoint /usage/compile existente:
 */

/*
'figma_user_id' => array(
    'type'              => 'string',
    'required'          => false,
    'sanitize_callback' => 'sanitize_text_field',
    'description'       => 'ID do usuário Figma',
    'default'           => '',
),
'device_id' => array(
    'type'              => 'string',
    'required'          => false,
    'sanitize_callback' => 'sanitize_text_field',
    'description'       => 'ID do dispositivo',
    'default'           => '',
),
*/

// ============================================================
// FUNÇÕES AUXILIARES (se não existirem)
// ============================================================

/**
 * Atualiza campos da licença no CCT
 * 
 * @param int   $license_id  ID do registro no CCT
 * @param array $fields      Campos para atualizar
 * @return bool
 */
if (!function_exists('figtoel_update_license_fields')) {
    function figtoel_update_license_fields($license_id, $fields) {
        if (empty($license_id) || empty($fields)) {
            return false;
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'jet_cct_licencas';
        
        $result = $wpdb->update(
            $table_name,
            $fields,
            array('_ID' => $license_id),
            array_fill(0, count($fields), '%s'),
            array('%d')
        );
        
        return $result !== false;
    }
}

/**
 * Mascara a license key para exibição segura
 * 
 * @param string $key
 * @return string
 */
if (!function_exists('figtoel_mask_license_key')) {
    function figtoel_mask_license_key($key) {
        if (strlen($key) <= 5) {
            return str_repeat('*', strlen($key));
        }
        return str_repeat('*', strlen($key) - 5) . substr($key, -5);
    }
}
