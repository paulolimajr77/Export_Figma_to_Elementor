/**
 * Detector simplificado: retorna sempre 'normal'.
 * Mantido por compatibilidade, sem heurísticas ou inferências.
 */
import type { ContainerType } from '../types/elementor.types';

export function detectContainerType(_node: SceneNode, _parentNode: SceneNode | null, _isTopLevel: boolean): ContainerType {
    return 'normal';
}
