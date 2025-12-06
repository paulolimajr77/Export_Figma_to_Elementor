/**
 * Debug Configuration for Figma to Elementor Plugin
 * 
 * These flags control debug/development features.
 * Set DEBUG_SHADOW_V1 = true to enable V1 shadow comparison logs.
 */

/**
 * When true, V1 engine runs in parallel with V2 for comparison logging only.
 * The widget decision always comes from V2 regardless of this flag.
 * 
 * Log format: [SHADOW-V1] Node ${id} | V1: ${widgetV1} | V2: ${widgetV2} (score=${scoreV2})
 */
export const DEBUG_SHADOW_V1 = false;

/**
 * When true, V2 ExplainabilityLayer logs are enabled.
 * Log format: [V2-EXPLAIN] Node ${id} | ${widget} (${score}) | Features: ...
 */
export const DEBUG_V2_EXPLAIN = true;
