import { PageZone } from './types';

/**
 * Detecta a zona lógica da página com base na posição relativa Y.
 * rootHeight é a altura do frame raiz (página).
 */
export function detectZone(nodeY: number, rootHeight: number | null): PageZone {
    if (!rootHeight || rootHeight <= 0) {
        return 'BODY';
    }

    var relativeY = nodeY;

    // HEADER: faixa do topo
    if (relativeY < 150) {
        return 'HEADER';
    }

    // FOOTER: faixa inferior
    if (relativeY > rootHeight - 300) {
        return 'FOOTER';
    }

    // HERO: logo após o header até ~800px
    if (relativeY < 800) {
        return 'HERO';
    }

    return 'BODY';
}
