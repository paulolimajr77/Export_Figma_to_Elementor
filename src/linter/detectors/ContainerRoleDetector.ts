import { ContainerRoleDetection } from '../types';

interface NodeSummary {
    type: SceneNode['type'];
    width: number;
    height: number;
    layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
    childCount: number;
    textCount: number;
    imageCount: number;
    buttonHint: boolean;
    hasBackground: boolean;
}

export class ContainerRoleDetector {
    detect(node: SceneNode): ContainerRoleDetection | null {
        if (!this.isContainerCandidate(node)) return null;

        const summary = this.summarize(node);
        const scores: Array<{ role: ContainerRoleDetection['role']; score: number; hints: string[] }> = [];

        scores.push(this.scoreHero(node, summary));
        scores.push(this.scoreFooter(node, summary));
        scores.push(this.scoreImageBox(node, summary));
        scores.push(this.scoreCard(node, summary));
        scores.push(this.scoreInner(node, summary));
        scores.push(this.scoreSection(node, summary));
        scores.push(this.scoreGrid(node, summary));

        const best = scores.sort((a, b) => b.score - a.score)[0];
        if (!best || best.score < 0.5) return null;

        return {
            nodeId: node.id,
            role: best.role,
            confidence: Math.min(1, best.score),
            hints: best.hints
        };
    }

    detectAll(root: SceneNode): Map<string, ContainerRoleDetection> {
        const result = new Map<string, ContainerRoleDetection>();
        const traverse = (node: SceneNode) => {
            const detection = this.detect(node);
            if (detection) {
                result.set(node.id, detection);
            }
            if ('children' in node && node.children) {
                for (const child of node.children as SceneNode[]) traverse(child);
            }
        };
        traverse(root);
        return result;
    }

    private isContainerCandidate(node: SceneNode): boolean {
        if (node.type !== 'FRAME' && node.type !== 'GROUP') return false;
        const width = 'width' in node ? (node.width as number) : 0;
        const height = 'height' in node ? (node.height as number) : 0;
        if (width < 80 || height < 40) return false;

        // Root heuristic: se parentId null e for nome de página e área enorme, ignore; se for pequeno, aceite.
        const hasParentInfo = (node as any).parent !== undefined || (node as any).parentId !== undefined;
        if (hasParentInfo && ((node as any).parent === null || (node as any).parentId === null)) {
            const name = (node.name || '').toLowerCase();
            const isPageName = ['page', 'desktop', 'mobile', 'artboard'].some(token => name.includes(token));
            const area = width * height;
            const isHuge = area > 1200 * 1200;
            if (isPageName && isHuge) return false;
        }

        return true;
    }

    private summarize(node: SceneNode): NodeSummary {
        const children = ('children' in node && node.children ? (node.children as SceneNode[]) : []) || [];
        const layoutMode = (node as any).layoutMode || 'NONE';
        let textCount = 0;
        let imageCount = 0;
        let buttonHint = false;
        let hasBackground = false;

        for (const child of children) {
            if (child.type === 'TEXT') textCount++;
            if (this.isImageNode(child)) imageCount++;
            if (this.looksLikeButton(child)) buttonHint = true;
            if ('fills' in child && Array.isArray((child as any).fills)) {
                hasBackground = hasBackground || (child as any).fills.some((f: any) => f.visible !== false && f.type === 'SOLID');
            }
        }

        if ('fills' in node && Array.isArray((node as any).fills)) {
            hasBackground = hasBackground || (node as any).fills.some((f: any) => f.visible !== false && f.type === 'SOLID');
        }

        return {
            type: node.type,
            width: 'width' in node ? (node.width as number) : 0,
            height: 'height' in node ? (node.height as number) : 0,
            layoutMode,
            childCount: children.length,
            textCount,
            imageCount,
            buttonHint,
            hasBackground
        };
    }

    private scoreHero(node: SceneNode, s: NodeSummary) {
        let score = 0;
        const hints: string[] = [];
        if (s.height >= 300 && s.width >= 600) {
            score += 0.4;
            hints.push('dimensões de hero');
        }
        if (s.textCount >= 2) {
            score += 0.2;
            hints.push('múltiplos textos');
        }
        if (s.buttonHint) {
            score += 0.2;
            hints.push('possui CTA');
        }
        if (s.imageCount > 0) {
            score += 0.2;
            hints.push('imagem presente');
        }
        return { role: 'hero' as const, score, hints };
    }

    private scoreFooter(node: SceneNode, s: NodeSummary) {
        let score = 0;
        const hints: string[] = [];
        const name = (node.name || '').toLowerCase();
        if (name.includes('footer')) {
            score += 0.5;
            hints.push('nome indica footer');
        }
        if (s.textCount >= 4 && s.childCount >= 3) {
            score += 0.3;
            hints.push('múltiplas colunas de texto');
        }
        if (s.height > 200) score += 0.1;
        return { role: 'footer' as const, score, hints };
    }

    private scoreImageBox(node: SceneNode, s: NodeSummary) {
        let score = 0;
        const hints: string[] = [];
        if (s.imageCount >= 1) {
            score += 0.4;
            hints.push('imagem presente');
        }
        if (s.textCount >= 1) {
            score += 0.3;
            hints.push('texto acompanhando imagem');
        }
        if (s.childCount <= 4) score += 0.1;
        return { role: 'image-box-container' as const, score, hints };
    }

    private scoreCard(node: SceneNode, s: NodeSummary) {
        let score = 0;
        const hints: string[] = [];
        if (s.imageCount >= 1) {
            score += 0.3;
            hints.push('imagem presente');
        }
        if (s.textCount >= 1) {
            score += 0.3;
            hints.push('texto presente');
        }
        if (s.textCount >= 2 || s.childCount >= 3) {
            score += 0.2;
            hints.push('estrutura de card (vários elementos)');
        }
        if (s.width <= 600 && s.height <= 800) score += 0.1;
        if (s.layoutMode !== 'NONE') score += 0.1;
        return { role: 'card' as const, score, hints };
    }

    private scoreInner(node: SceneNode, s: NodeSummary) {
        let score = 0;
        const hints: string[] = [];
        if (s.width >= 400 && s.width <= 1000 && s.childCount >= 1) {
            score += 0.4;
            hints.push('largura encaixotada');
        }
        if (s.layoutMode !== 'NONE') score += 0.1;
        if (s.textCount > 0 || s.childCount === 1) score += 0.1;
        return { role: 'inner' as const, score, hints };
    }

    private scoreSection(node: SceneNode, s: NodeSummary) {
        let score = 0;
        const hints: string[] = [];
        if (s.width >= 800 && s.childCount >= 2) {
            score += 0.4;
            hints.push('largura de seção');
        }
        if ((node as any).parent === null || (node as any).parentId === null) {
            score += 0.2;
            hints.push('raiz de layout');
        }
        if (s.layoutMode !== 'NONE') score += 0.1;
        return { role: 'section' as const, score, hints };
    }

    private scoreGrid(node: SceneNode, s: NodeSummary) {
        let score = 0;
        const hints: string[] = [];
        if (s.childCount >= 4) {
            score += 0.3;
            hints.push('muitos filhos');
        }
        if (s.layoutMode === 'HORIZONTAL' || s.layoutMode === 'VERTICAL') {
            score += 0.1;
            hints.push('auto layout para grid');
        }
        return { role: 'grid' as const, score, hints };
    }

    private isImageNode(node: SceneNode): boolean {
        if ('fills' in node && Array.isArray((node as any).fills)) {
            const hasImageFill = (node as any).fills.some((f: any) => f.type === 'IMAGE');
            if (hasImageFill) return true;
        }
        const name = (node.name || '').toLowerCase();
        return name.includes('image') || name.includes('img') || name.startsWith('w:image');
    }

    private looksLikeButton(node: SceneNode): boolean {
        const name = (node.name || '').toLowerCase();
        if (name.includes('button') || name.includes('btn') || name.includes('cta')) return true;
        if ('children' in node && node.children) {
            return (node.children as SceneNode[]).some(ch => (ch as any).characters && ((ch as any).characters as string).length < 30);
        }
        return false;
    }
}
