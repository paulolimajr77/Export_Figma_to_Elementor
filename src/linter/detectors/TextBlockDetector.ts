import { TextBlockInfo } from '../types';

type TextRole = 'headline' | 'subheadline' | 'body' | 'small-label';

export class TextBlockDetector {
    detect(node: SceneNode): TextBlockInfo | null {
        if (!('children' in node) || !node.children || node.children.length < 2) return null;
        const layoutMode = (node as any).layoutMode;
        if (layoutMode !== 'VERTICAL' && layoutMode !== 'HORIZONTAL') return null;

        const textChildren = (node.children as SceneNode[]).filter(child => child.type === 'TEXT') as TextNode[];
        if (textChildren.length < 2) return null;

        const features = textChildren.map(t => this.extractTextFeatures(t));
        const maxFont = Math.max(...features.map(f => f.fontSize));
        const maxWeight = Math.max(...features.map(f => f.fontWeight));

        const rolesByChildId: Record<string, TextRole> = {};
        let headlineCount = 0;
        let bodyCount = 0;

        features.forEach((f, idx) => {
            const isBiggest = f.fontSize >= maxFont - 1 || f.fontWeight >= maxWeight;
            const isCaps = f.isAllCaps && f.lines <= 2;
            const looksBody = f.lines >= 3 || f.length > 80;
            const sizeRatio = maxFont > 0 ? f.fontSize / maxFont : 1;

            let role: TextRole = 'body';
            if (isBiggest || isCaps || f.fontSize >= maxFont * 0.9) {
                role = headlineCount === 0 ? 'headline' : 'subheadline';
            } else if (sizeRatio >= 0.75 && f.fontWeight >= Math.max(500, maxWeight * 0.85)) {
                role = headlineCount === 0 ? 'headline' : 'subheadline';
            } else if (looksBody) {
                role = 'body';
            } else if (f.length < 25 && f.lines <= 2) {
                role = 'small-label';
            } else {
                role = 'body';
            }

            rolesByChildId[textChildren[idx].id] = role;
            if (role === 'headline' || role === 'subheadline') headlineCount++;
            if (role === 'body') bodyCount++;
        });

        if (headlineCount === 0) return null;

        const type: TextBlockInfo['type'] =
            bodyCount > 0 && headlineCount >= 1
                ? 'headline+body'
                : headlineCount >= 2
                ? 'headline+subheadline'
                : 'headline-stack';

        const contrast = maxFont > 0 ? maxFont / Math.max(1, Math.min(...features.map(f => f.fontSize))) : 1;
        const confidence = Math.min(1, 0.5 + 0.2 * headlineCount + 0.1 * bodyCount + Math.min(0.2, (contrast - 1) * 0.2));

        return {
            nodeId: node.id,
            type,
            rolesByChildId,
            confidence,
            justification: `Layout ${layoutMode.toLowerCase()} com ${textChildren.length} textos; contraste de fonte ${contrast.toFixed(2)}`
        };
    }

    detectAll(root: SceneNode): Map<string, TextBlockInfo> {
        const result = new Map<string, TextBlockInfo>();
        const traverse = (node: SceneNode) => {
            const detection = this.detect(node);
            if (detection) {
                result.set(node.id, detection);
            }
            if ('children' in node && node.children) {
                for (const child of node.children as SceneNode[]) {
                    traverse(child);
                }
            }
        };
        traverse(root);
        return result;
    }

    private extractTextFeatures(node: TextNode) {
        const fontSize = typeof node.fontSize === 'number' ? node.fontSize : 16;
        const fontWeight = typeof (node as any).fontWeight === 'number' ? (node as any).fontWeight : this.mapFontNameToWeight((node as any).fontName);
        const text = (node.characters || '').toString();
        const lines = text.split(/\n/).length;
        const isAllCaps = text && text === text.toUpperCase();
        return {
            fontSize,
            fontWeight,
            lines,
            length: text.length,
            isAllCaps
        };
    }

    private mapFontNameToWeight(fontName: any): number {
        if (!fontName || !fontName.style) return 400;
        const style = (fontName.style as string).toLowerCase();
        if (style.includes('bold')) return 700;
        if (style.includes('semibold') || style.includes('semi')) return 600;
        if (style.includes('medium')) return 500;
        return 400;
    }
}
