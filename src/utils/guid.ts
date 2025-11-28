/**
 * Gera um GUID único para identificar elementos Elementor
 * @returns String GUID de 10 caracteres alfanuméricos
 */
export function generateGUID(): string {
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Normaliza um nome removendo espaços e convertendo para minúsculas
 * @param name Nome a ser normalizado
 * @returns Nome normalizado
 */
export function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

/**
 * Remove prefixos de widget (w:, c:, grid:, etc) do nome
 * @param name Nome com possível prefixo
 * @returns Nome sem prefixo
 */
export function stripWidgetPrefix(name: string): string {
    return name.replace(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i, '').trim();
}
