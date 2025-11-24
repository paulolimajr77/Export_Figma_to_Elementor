/**
 * Detecta a posição relativa entre dois nós (Top, Left, Right)
 * Útil para determinar o layout de widgets como Image Box
 * @param source Nó de origem (ex: imagem)
 * @param target Nó de destino (ex: texto)
 * @returns Posição relativa: 'top', 'left' ou 'right'
 */
export function detectRelativePosition(source, target) {
    if (!source.absoluteBoundingBox || !target.absoluteBoundingBox)
        return 'top';
    const b1 = source.absoluteBoundingBox;
    const b2 = target.absoluteBoundingBox;
    // Calcula centros dos nós
    const c1 = { x: b1.x + b1.width / 2, y: b1.y + b1.height / 2 };
    const c2 = { x: b2.x + b2.width / 2, y: b2.y + b2.height / 2 };
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    // Se a diferença vertical é maior que horizontal, está acima/abaixo
    if (Math.abs(dy) > Math.abs(dx)) {
        return 'top';
    }
    else {
        // Se está à esquerda ou direita
        return dx < 0 ? 'left' : 'right';
    }
}
/**
 * Calcula a distância euclidiana entre dois nós
 * @param node1 Primeiro nó
 * @param node2 Segundo nó
 * @returns Distância em pixels
 */
export function calculateDistance(node1, node2) {
    if (!node1.absoluteBoundingBox || !node2.absoluteBoundingBox)
        return Infinity;
    const b1 = node1.absoluteBoundingBox;
    const b2 = node2.absoluteBoundingBox;
    const c1 = { x: b1.x + b1.width / 2, y: b1.y + b1.height / 2 };
    const c2 = { x: b2.x + b2.width / 2, y: b2.y + b2.height / 2 };
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    return Math.sqrt(dx * dx + dy * dy);
}
/**
 * Verifica se um nó está contido dentro de outro
 * @param child Nó filho
 * @param parent Nó pai
 * @returns true se o filho está dentro do pai
 */
export function isNodeInside(child, parent) {
    if (!child.absoluteBoundingBox || !parent.absoluteBoundingBox)
        return false;
    const c = child.absoluteBoundingBox;
    const p = parent.absoluteBoundingBox;
    return (c.x >= p.x &&
        c.y >= p.y &&
        c.x + c.width <= p.x + p.width &&
        c.y + c.height <= p.y + p.height);
}
