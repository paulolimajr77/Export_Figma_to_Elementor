/**
 * Gera um GUID único para identificar elementos Elementor
 * @returns String GUID de 10 caracteres alfanuméricos
 */
export function generateGUID() {
    return 'xxxxxxxxxx'.replace(/[x]/g, () => ((Math.random() * 36) | 0).toString(36));
}
/**
 * Normaliza um nome removendo espaços e convertendo para minúsculas
 * @param name Nome a ser normalizado
 * @returns Nome normalizado
 */
export function normalizeName(name) {
    return name.trim().toLowerCase();
}
/**
 * Remove prefixos de widget (w:, c:, grid:, etc) do nome
 * @param name Nome com possível prefixo
 * @returns Nome sem prefixo
 */
export function stripWidgetPrefix(name) {
    return name.replace(/^(w:|c:|grid:|loop:|woo:|slider:|pro:|media:)/i, '').trim();
}
