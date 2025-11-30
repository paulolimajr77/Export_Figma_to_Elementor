/**
 * Gera um GUID único para identificar elementos Elementor
 * @returns String GUID de 10 caracteres alfanuméricos
 */
export function generateGUID(): string {
    const hex = Math.floor(Math.random() * 0xfffffff).toString(16);
    return ('0000000' + hex).slice(-7);
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
