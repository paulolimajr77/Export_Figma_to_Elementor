/**
 * IntelliSense Naming Engine - Strict Vocabulary Mode
 * 
 * Este módulo fornece autocomplete e validação de nomes de widgets
 * baseado EXCLUSIVAMENTE no vocabulário definido (WVL).
 * 
 * NENHUM widget fora da lista é sugerido ou aceito.
 * 
 * @version 1.0.0
 * @author Figma → Elementor Compiler
 */

import widgetVocabulary from '../../../dist/widget_vocabulary_list.json';

// ============================================================================
// TYPES
// ============================================================================

export interface WidgetEntry {
    name: string;
    aliases: string[];
    category?: string;
    source?: string;
}

export interface SuggestionResult {
    widget: string;
    score: number;
    category: string;
    source: string;
    matchedBy: 'exact' | 'alias' | 'fuzzy';
}

export interface ValidationResult {
    valid: boolean;
    normalized?: string;
    category?: string;
    suggestions?: SuggestionResult[];
    error?: string;
}

// ============================================================================
// VOCABULARY LOADING
// ============================================================================

/**
 * Flat list of all valid widget names and their metadata
 */
const VOCABULARY: WidgetEntry[] = [];

/**
 * Index for fast lookups: name/alias -> WidgetEntry
 */
const VOCABULARY_INDEX: Map<string, WidgetEntry> = new Map();

/**
 * All valid names (for fuzzy matching)
 */
const ALL_VALID_NAMES: Set<string> = new Set();

/**
 * Load vocabulary from JSON
 */
function loadVocabulary(): void {
    const categories = (widgetVocabulary as any).categories || {};

    for (const [categoryName, categoryData] of Object.entries(categories)) {
        const cat = categoryData as { source: string; widgets: Array<{ name: string; aliases: string[] }> };

        for (const widget of cat.widgets) {
            const entry: WidgetEntry = {
                name: widget.name,
                aliases: widget.aliases || [],
                category: categoryName,
                source: cat.source
            };

            VOCABULARY.push(entry);

            // Index by name
            const normalized = widget.name.toLowerCase().trim();
            VOCABULARY_INDEX.set(normalized, entry);
            ALL_VALID_NAMES.add(normalized);

            // Index by aliases
            for (const alias of widget.aliases) {
                const normalizedAlias = alias.toLowerCase().trim();
                VOCABULARY_INDEX.set(normalizedAlias, entry);
                ALL_VALID_NAMES.add(normalizedAlias);
            }
        }
    }

    console.log(`[IntelliSense] Loaded ${VOCABULARY.length} widgets, ${ALL_VALID_NAMES.size} unique names/aliases`);
}

// Initialize on module load
loadVocabulary();

// ============================================================================
// FUZZY MATCHING
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1)
 */
function similarity(query: string, target: string): number {
    if (query === target) return 1;
    if (query.length === 0 || target.length === 0) return 0;

    const distance = levenshteinDistance(query, target);
    const maxLength = Math.max(query.length, target.length);

    return 1 - (distance / maxLength);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get all valid widget names
 */
export function getValidWidgetNames(): string[] {
    return Array.from(ALL_VALID_NAMES);
}

/**
 * Get all vocabulary entries
 */
export function getVocabulary(): WidgetEntry[] {
    return [...VOCABULARY];
}

/**
 * Check if a widget name is valid
 */
export function isValidWidgetName(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    return VOCABULARY_INDEX.has(normalized);
}

/**
 * Validate a widget name and return normalized form
 */
export function validateWidgetName(name: string): ValidationResult {
    const normalized = name.toLowerCase().trim();

    // Check direct match
    const entry = VOCABULARY_INDEX.get(normalized);
    if (entry) {
        return {
            valid: true,
            normalized: entry.name,
            category: entry.category
        };
    }

    // Not found - provide suggestions
    const suggestions = suggestWidgets(normalized, 5);

    return {
        valid: false,
        error: `Widget "${name}" não encontrado no vocabulário`,
        suggestions
    };
}

/**
 * Get autocomplete suggestions for a query
 * Uses fuzzy matching but ONLY returns widgets from the vocabulary
 */
export function suggestWidgets(query: string, limit: number = 10): SuggestionResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: SuggestionResult[] = [];

    // If empty query, return first N widgets
    if (!normalizedQuery) {
        return VOCABULARY.slice(0, limit).map(entry => ({
            widget: entry.name,
            score: 1,
            category: entry.category || 'unknown',
            source: entry.source || 'unknown',
            matchedBy: 'exact' as const
        }));
    }

    // Check for exact match first
    const exactEntry = VOCABULARY_INDEX.get(normalizedQuery);
    if (exactEntry) {
        results.push({
            widget: exactEntry.name,
            score: 1,
            category: exactEntry.category || 'unknown',
            source: exactEntry.source || 'unknown',
            matchedBy: 'exact'
        });
    }

    // Fuzzy match against all names
    for (const entry of VOCABULARY) {
        // Skip if already added as exact match
        if (results.some(r => r.widget === entry.name)) continue;

        let bestScore = 0;
        let matchedBy: 'alias' | 'fuzzy' = 'fuzzy';

        // Check main name
        const nameScore = similarity(normalizedQuery, entry.name);
        if (nameScore > bestScore) {
            bestScore = nameScore;
        }

        // Check prefix match (higher boost)
        if (entry.name.startsWith(normalizedQuery)) {
            bestScore = Math.max(bestScore, 0.9);
        }

        // Check aliases
        for (const alias of entry.aliases) {
            const aliasNorm = alias.toLowerCase();
            const aliasScore = similarity(normalizedQuery, aliasNorm);
            if (aliasScore > bestScore) {
                bestScore = aliasScore;
                matchedBy = 'alias';
            }
            if (aliasNorm.startsWith(normalizedQuery)) {
                bestScore = Math.max(bestScore, 0.85);
                matchedBy = 'alias';
            }
        }

        // Add if score is above threshold
        if (bestScore > 0.3) {
            results.push({
                widget: entry.name,
                score: bestScore,
                category: entry.category || 'unknown',
                source: entry.source || 'unknown',
                matchedBy
            });
        }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return top N
    return results.slice(0, limit);
}

/**
 * Normalize a widget name to its canonical form
 * Returns null if widget is not in vocabulary
 */
export function normalizeWidgetName(name: string): string | null {
    const normalized = name.toLowerCase().trim();
    const entry = VOCABULARY_INDEX.get(normalized);
    return entry ? entry.name : null;
}

/**
 * Get widget category
 */
export function getWidgetCategory(name: string): string | null {
    const normalized = name.toLowerCase().trim();
    const entry = VOCABULARY_INDEX.get(normalized);
    return entry ? (entry.category || null) : null;
}

/**
 * Filter suggestions to only include widgets from specific categories
 */
export function suggestFromCategories(
    query: string,
    categories: string[],
    limit: number = 10
): SuggestionResult[] {
    const all = suggestWidgets(query, 100);
    return all.filter(s => categories.includes(s.category)).slice(0, limit);
}

/**
 * Get all widgets from a specific category
 */
export function getWidgetsByCategory(category: string): WidgetEntry[] {
    return VOCABULARY.filter(e => e.category === category);
}

/**
 * Check if a name matches a valid prefix
 */
export function hasValidPrefix(name: string): boolean {
    const prefixes = Object.keys((widgetVocabulary as any).prefixes || {});
    return prefixes.some(p => name.startsWith(p));
}

/**
 * Get all valid prefixes
 */
export function getValidPrefixes(): string[] {
    return Object.keys((widgetVocabulary as any).prefixes || {});
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    getValidWidgetNames,
    getVocabulary,
    isValidWidgetName,
    validateWidgetName,
    suggestWidgets,
    normalizeWidgetName,
    getWidgetCategory,
    suggestFromCategories,
    getWidgetsByCategory,
    hasValidPrefix,
    getValidPrefixes
};
