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

/**
 * Retorna alternativas enxutas e contextuais para um slug.
 * Máximo de 5 opções e sempre dentro da taxonomia.
 */
export function getAlternativesForSlug(slug: string, context?: { containerRole?: string; semanticRole?: string }): string[] {
    const canonical = getCanonicalName(slug);
    if (!canonical) return [];

    const suggestions: string[] = [canonical];
    const add = (candidate: string) => {
        const canon = getCanonicalName(candidate);
        if (canon && canon !== canonical && !suggestions.includes(canon)) {
            suggestions.push(canon);
        }
    };

    const role = context?.semanticRole || context?.containerRole;

    if (canonical === 'icon-box') {
        add('image-box');
        add('w:container');
    } else if (canonical === 'image-box' || canonical === 'image') {
        add('w:container');
    } else if (canonical === 'form') {
        add('w:container');
        add('w:inner-container');
    } else if (canonical === 'heading') {
        add('text');
        add('text-editor');
    } else if (canonical === 'text' || canonical === 'text-editor') {
        add('heading');
    } else if (canonical === 'w:container' || canonical === 'w:inner-container') {
        if (role === 'hero') add('w:container');
        add('w:inner-container');
    } else if (canonical === 'button') {
        add('icon');
        add('heading');
    }

    return suggestions.slice(0, 5).filter(isValidWidgetSlug);
}
