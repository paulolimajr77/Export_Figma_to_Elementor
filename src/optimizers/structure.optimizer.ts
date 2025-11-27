/**
 * Otimizador de Estrutura (Tree Shaking)
 * Responsável por simplificar a árvore de nós do Figma antes da exportação,
 * removendo containers redundantes que não adicionam valor visual ou estrutural.
 */

export class StructureOptimizer {
    /**
     * Otimiza a estrutura de um nó e seus filhos recursivamente.
     * @param node O nó a ser otimizado
     * @returns O nó otimizado (pode ser o próprio nó ou um de seus filhos)
     */
    static optimize(node: SceneNode): SceneNode {
        if (this.isRedundantContainer(node)) {
            const child = (node as FrameNode | GroupNode).children[0];
            return this.optimize(child);
        }
        return node;
    }

    /**
     * Verifica se um container é redundante e pode ser removido.
     */
    private static isRedundantContainer(node: SceneNode): boolean {
        if (node.type !== 'FRAME' && node.type !== 'GROUP') {
            return false;
        }

        if (node.locked) {
            return false;
        }

        if (node.children.length === 0) {
            return true;
        }

        if (node.children.length !== 1) {
            return false;
        }

        const child = node.children[0];

        // Fills (Background)
        if ('fills' in node && Array.isArray(node.fills)) {
            const hasVisibleFill = node.fills.some(fill => fill.visible !== false);
            if (hasVisibleFill) return false;
        }

        // Strokes (Borda)
        if ('strokes' in node && Array.isArray(node.strokes)) {
            const hasVisibleStroke = node.strokes.some(stroke => stroke.visible !== false);
            if (hasVisibleStroke && typeof node.strokeWeight === 'number' && node.strokeWeight > 0) return false;
        }

        // Effects (Sombras, Blur)
        if ('effects' in node && Array.isArray(node.effects)) {
            const hasVisibleEffect = node.effects.some(effect => effect.visible !== false);
            if (hasVisibleEffect) return false;
        }

        // Corner Radius
        if ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
            if (node.clipsContent) return false;
        }

        // GROUP com 1 filho é sempre redundante
        if (node.type === 'GROUP') {
            return true;
        }

        // FRAME
        if (node.type === 'FRAME') {
            if (node.layoutMode !== 'NONE') {
                if (node.paddingLeft > 0 || node.paddingRight > 0 || node.paddingTop > 0 || node.paddingBottom > 0) {
                    return false;
                }

                if (node.itemSpacing > 0 && child.type === 'FRAME' && 'layoutMode' in child && child.layoutMode !== 'NONE') {
                    return false;
                }
            } else {
                // Frame absoluto
                if (Math.abs(child.x) < 0.1 && Math.abs(child.y) < 0.1 &&
                    Math.abs(child.width - node.width) < 1 && Math.abs(child.height - node.height) < 1) {
                    return true;
                }
                return false;
            }
        }

        return true;
    }

    /**
     * Aplica a otimização diretamente no documento Figma (Modifica a estrutura real).
     * @param node O nó a ser otimizado
     * @param logCallback Função opcional para enviar logs para a UI
     * @returns O número de nós removidos
     */
    static applyOptimization(node: SceneNode, logCallback?: (message: string, level: 'info' | 'warn' | 'error') => void): number {
        let removedCount = 0;

        // IMPORTANTE: Capturar nome ANTES de qualquer operação pois o nó pode ser removido
        const nodeName = node.name;
        const nodeType = node.type;
        const childrenCount = 'children' in node ? node.children.length : 0;

        console.log(`[Optimizer] 🔍 Analisando: ${nodeName} (tipo: ${nodeType}, filhos: ${childrenCount})`);

        // 1. Otimizar filhos primeiro (bottom-up)
        if ('children' in node) {
            const children = [...(node as FrameNode).children];
            for (const child of children) {
                removedCount += this.applyOptimization(child, logCallback);
            }
        }

        // 2. Verificar se este nó é redundante e aplicar remoção
        const isRedundant = this.isRedundantContainer(node);

        if (isRedundant) {
            console.log(`[Optimizer] ✅ ${nodeName} é REDUNDANTE - será removido`);
        } else {
            if (node.type === 'FRAME' || node.type === 'GROUP') {
                const reasons = this.getPreservationReasons(node);
                if (reasons.length > 0) {
                    console.log(`[Optimizer] ❌ ${nodeName} foi PRESERVADO porque: ${reasons.join(', ')}`);
                    if (logCallback) {
                        logCallback(`  ⏭️ "${nodeName}" preservado: ${reasons.join(', ')}`, 'info');
                    }
                }
            }
        }

        if (isRedundant) {
            const parent = node.parent;
            if (parent && 'children' in node && node.children.length === 1) {
                const child = node.children[0];

                try {
                    parent.appendChild(child);
                    node.remove();
                    console.log(`[Optimizer] 🧹 Container redundante removido do documento: ${nodeName}`);
                    if (logCallback) {
                        logCallback(`  🗑️ Removido: "${nodeName}" (${nodeType})`, 'info');
                    }
                    removedCount++;
                } catch (error) {
                    console.log(`[Optimizer] ⚠️ Erro ao remover: ${nodeName} - ${error}`);
                    if (logCallback) {
                        logCallback(`  ⚠️ Erro ao remover "${nodeName}"`, 'warn');
                    }
                }
            }
        }

        return removedCount;
    }

    /**
     * Retorna as razões pelas quais um nó foi preservado (para debugging)
     */
    private static getPreservationReasons(node: SceneNode): string[] {
        const reasons: string[] = [];

        if (node.type !== 'FRAME' && node.type !== 'GROUP') {
            return reasons;
        }

        if (node.locked) {
            reasons.push('está trancado');
        }

        if (node.children.length === 0) {
            return reasons;
        }

        if (node.children.length > 1) {
            reasons.push(`tem ${node.children.length} filhos`);
        }

        if ('fills' in node && Array.isArray(node.fills)) {
            const hasVisibleFill = node.fills.some(fill => fill.visible !== false);
            if (hasVisibleFill) {
                reasons.push('tem cor de fundo');
            }
        }

        if ('strokes' in node && Array.isArray(node.strokes)) {
            const hasVisibleStroke = node.strokes.some(stroke => stroke.visible !== false);
            if (hasVisibleStroke && typeof node.strokeWeight === 'number' && node.strokeWeight > 0) {
                reasons.push('tem borda');
            }
        }

        if ('effects' in node && Array.isArray(node.effects)) {
            const hasVisibleEffect = node.effects.some(effect => effect.visible !== false);
            if (hasVisibleEffect) {
                reasons.push('tem efeitos');
            }
        }

        if ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
            if (node.clipsContent) {
                reasons.push('tem corner radius');
            }
        }

        if (node.type === 'FRAME' && node.layoutMode !== 'NONE') {
            if (node.paddingLeft > 0 || node.paddingRight > 0 || node.paddingTop > 0 || node.paddingBottom > 0) {
                reasons.push(`tem padding`);
            }

            if (node.children.length === 1) {
                const child = node.children[0];
                if (node.itemSpacing > 0 && child.type === 'FRAME' && 'layoutMode' in child && child.layoutMode !== 'NONE') {
                    reasons.push(`tem gap`);
                }
            }
        }

        return reasons;
    }
}
