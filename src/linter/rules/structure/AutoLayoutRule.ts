import { Rule, LintResult, ManualFixGuide } from '../../types';

/**
 * Regra: Frame com filhos deve usar Auto Layout
 * Severidade: Critical
 * Categoria: Structure
 */
export class AutoLayoutRule implements Rule {
    id = 'auto-layout-required';
    category = 'structure' as const;
    severity = 'critical' as const;

    async validate(node: SceneNode): Promise<LintResult | null> {
        // Aplica apenas a frames
        if (node.type !== 'FRAME') return null;

        const frame = node as FrameNode;
        const hasChildren = frame.children && frame.children.length > 0;
        const hasAutoLayout = frame.layoutMode !== 'NONE';

        if (hasChildren && !hasAutoLayout) {
            return {
                node_id: frame.id,
                node_name: frame.name,
                severity: this.severity,
                category: this.category,
                rule: this.id,
                message: `Frame "${frame.name}" possui ${frame.children.length} filhos mas não usa Auto Layout`,
                fixAvailable: true,
                educational_tip: `
⚠️ Por que isso é crítico?

Frames sem Auto Layout usam posicionamento absoluto, que não é suportado pelo Elementor. Isso causará:
• Sobreposição de elementos
• Quebra de layout em diferentes resoluções
• Dificuldade de manutenção

✅ Solução:
Aplicar Auto Layout permite que o Elementor entenda a estrutura e gere containers flexíveis e responsivos.
        `.trim()
            };
        }

        return null;
    }

    async fix(node: SceneNode): Promise<boolean> {
        if (node.type !== 'FRAME') return false;
        const frame = node as FrameNode;

        try {
            // Aplica Auto Layout Vertical por padrão
            frame.layoutMode = 'VERTICAL';
            frame.primaryAxisSizingMode = 'AUTO';
            frame.counterAxisSizingMode = 'AUTO';
            frame.itemSpacing = 20;
            frame.paddingLeft = 20;
            frame.paddingRight = 20;
            frame.paddingTop = 20;
            frame.paddingBottom = 20;
            return true;
        } catch (e) {
            console.error('Erro ao aplicar Auto Layout:', e);
            return false;
        }
    }

    generateGuide(node: SceneNode): ManualFixGuide {
        const frame = node as FrameNode;

        return {
            node_id: frame.id,
            problem: `Frame "${frame.name}" sem Auto Layout`,
            severity: this.severity,
            step_by_step: [
                { step: 1, action: 'Selecione o frame no Figma' },
                { step: 2, action: 'Pressione Shift + A (atalho para Auto Layout)' },
                { step: 3, action: 'No painel direito, ajuste a direção (Vertical ou Horizontal)' },
                { step: 4, action: 'Defina o espaçamento (Gap) entre itens' },
                { step: 5, action: 'Adicione padding interno se necessário' }
            ],
            before_after_example: {
                before: 'Frame com posicionamento absoluto dos filhos',
                after: 'Frame com Auto Layout vertical, gap de 16px e padding de 24px'
            },
            estimated_time: '1 minuto',
            difficulty: 'easy'
        };
    }
}
