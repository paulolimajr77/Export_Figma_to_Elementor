/**
 * Entrada principal do módulo de heurísticas + widgets.
 */

export * from "./types";
export * from "./engine";

import { Heuristic } from "./types";

// Heurísticas estruturais
import { LAYOUT_HEURISTICS } from "./rules/layout";
import { SECTION_HEURISTICS } from "./rules/sections";
import { NAVIGATION_HEURISTICS } from "./rules/navigation";
import { TYPOGRAPHY_HEURISTICS } from "./rules/typography";
import { MEDIA_HEURISTICS } from "./rules/media";

// Heurísticas específicas de widgets
import { ELEMENTOR_BASIC_WIDGET_HEURISTICS } from "./widgets/elementor-basic";
import { ELEMENTOR_PRO_WIDGET_HEURISTICS } from "./widgets/elementor-pro";
import { WORDPRESS_CORE_WIDGET_HEURISTICS } from "./widgets/wordpress-core";
import { WOO_WIDGET_HEURISTICS } from "./widgets/woocommerce";

/**
 * Conjunto padrão com tudo habilitado.
 */
export const DEFAULT_HEURISTICS: Heuristic[] = [
    ...LAYOUT_HEURISTICS,
    ...SECTION_HEURISTICS,
    ...NAVIGATION_HEURISTICS,
    ...TYPOGRAPHY_HEURISTICS,
    ...MEDIA_HEURISTICS,
    ...ELEMENTOR_BASIC_WIDGET_HEURISTICS,
    ...ELEMENTOR_PRO_WIDGET_HEURISTICS,
    ...WORDPRESS_CORE_WIDGET_HEURISTICS,
    ...WOO_WIDGET_HEURISTICS,
];
