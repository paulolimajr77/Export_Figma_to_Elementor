/**
 * Type guard para verificar se o nó tem propriedades de layout
 */
function hasLayout(node) {
    return 'layoutMode' in node;
}
/**
 * Detecta se um container é externo (section/full-width)
 * @param node Nó do Figma
 * @param isTopLevel Se é um nó de nível superior
 * @returns true se é container externo
 */
export function isExternalContainer(node, isTopLevel = false) {
    if (!hasLayout(node))
        return false;
    const frame = node;
    const lname = node.name.toLowerCase();
    // Prefixos explícitos
    if (lname.startsWith('c:section') || lname.startsWith('c:boxed'))
        return true;
    // Nós de nível superior são containers externos
    if (isTopLevel)
        return true;
    // Largura grande indica section
    if (frame.width > 900)
        return true;
    // Palavras-chave que indicam section
    const sectionKeywords = ['section', 'hero', 'header', 'footer', 'banner', 'cta'];
    if (sectionKeywords.some(kw => lname.includes(kw)))
        return true;
    return false;
}
/**
 * Detecta se um container é interno (inner container)
 * @param node Nó do Figma
 * @param parentNode Nó pai
 * @returns true se é container interno
 */
export function isInnerContainer(node, parentNode) {
    if (!hasLayout(node))
        return false;
    const frame = node;
    const lname = node.name.toLowerCase();
    // Prefixos explícitos
    if (lname.startsWith('c:inner') || lname.startsWith('c:row') || lname.startsWith('c:col')) {
        return true;
    }
    if (!parentNode)
        return false;
    // Se o pai tem layout e este nó é menor que 95% da largura do pai
    if (hasLayout(parentNode)) {
        const parentFrame = parentNode;
        if (frame.width < parentFrame.width * 0.95)
            return true;
    }
    // Palavras-chave que indicam container interno
    const innerKeywords = ['inner', 'content', 'wrapper', 'container', 'box'];
    if (innerKeywords.some(kw => lname.includes(kw)))
        return true;
    return false;
}
/**
 * Detecta o tipo de container
 * @param node Nó do Figma
 * @param parentNode Nó pai
 * @param isTopLevel Se é nó de nível superior
 * @returns Tipo do container
 */
export function detectContainerType(node, parentNode, isTopLevel) {
    const lname = node.name.toLowerCase();
    // Verifica prefixos explícitos primeiro
    if (lname.startsWith('c:section') || lname.startsWith('c:boxed')) {
        return 'external';
    }
    if (lname.startsWith('c:inner')) {
        return 'inner';
    }
    // Detecção automática
    if (isExternalContainer(node, isTopLevel)) {
        return 'external';
    }
    if (isInnerContainer(node, parentNode)) {
        return 'inner';
    }
    return 'normal';
}
