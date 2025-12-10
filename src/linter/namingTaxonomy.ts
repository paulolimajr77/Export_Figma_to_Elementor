import { getAllWidgetSlugs, normalizeWidgetSlug } from './config/widget-taxonomy';

/**
 * Taxonomia de naming derivada de WIDGET_DATA (lado do Linter).
 * Não cria slugs novos; apenas normaliza/valida.
 */
const VALID_WIDGET_SLUGS = new Set(getAllWidgetSlugs());

export function getValidWidgetSlugs(): string[] {
    return Array.from(VALID_WIDGET_SLUGS);
}

export function isValidWidgetSlug(slug: string | undefined | null): boolean {
    if (!slug) return false;
    const normalized = normalizeWidgetSlug(slug);
    if (normalized && VALID_WIDGET_SLUGS.has(normalized)) return true;
    return VALID_WIDGET_SLUGS.has(slug.trim());
}

export function getCanonicalName(slug: string | undefined | null): string | null {
    if (!slug) return null;
    const normalized = normalizeWidgetSlug(slug);
    if (normalized && VALID_WIDGET_SLUGS.has(normalized)) {
        return normalized.startsWith('w:') || normalized.startsWith('woo:') || normalized.startsWith('loop:') ? normalized : normalized;
    }
    if (VALID_WIDGET_SLUGS.has(slug.trim())) return slug.trim();
    return null;
}

/**
 * Helper para validar nomes de container (usam os mesmos slugs oficiais).
 */
export function isValidContainerName(name: string | undefined | null): boolean {
    return isValidWidgetSlug(name);
}
