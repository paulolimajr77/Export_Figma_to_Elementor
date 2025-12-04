import { Rule, LintResult, ManualFixGuide } from '../../types';

/**
 * Regra: Detecta retângulos vazios usados como spacers
 * Severidade: Major
 * Categoria: Structure
 */
export class SpacerDetectionRule implements Rule {
    id = 'spacer-detected';
    category = 'structure' as const;
    severity = 'major' as const;

    async validate(node: SceneNode): Promise<LintResult | null> {
        // Aplica apenas a retângulos
        if (node.type !== 'RECTANGLE') return null;

        const rect = node as RectangleNode;

        // Verifica se é um spacer:
        // 1. Não tem fill visível (ou fill transparente)
        // 2. Não tem stroke
        // 3. Nome genérico ou contém "spacer"
        const hasNoFill = !rect.fills ||
            (typeof rect.fills !== 'symbol' && rect.fills.length === 0) ||
            (typeof rect.fills !== 'symbol' && (rect.fills as Paint[]).every(fill =>
                fill.type === 'SOLID' && fill.visible === false
            ));

        const hasNoStroke = !rect.strokes ||
            (typeof rect.strokes !== 'symbol' && rect.strokes.length === 0);

        const isGenericName = /^(Rectangle|Spacer|Space|Gap)\s*\d*$/i.test(rect.name);

        if (hasNoFill && hasNoStroke && isGenericName) {
            return {
                node_id: rect.id,
                node_name: rect.name,
                severity: this.severity,
                category: this.category,
                rule: this.id,
                message: `Spacer detectado: "${rect.name}"`,
                educational_tip: `
⚠️ Por que evitar spacers?

Retângulos vazios usados como espaçamento devem ser substituídos pela propriedade "gap" do Auto Layout. Isso:
• Reduz a complexidade do layout
• Melhora a manutenção
• Facilita ajustes responsivos
• Gera código Elementor mais limpo

✅ Solução:
Use a propriedade "Gap" do Auto Layout no frame pai ao invés de elementos invisíveis.
        `.trim()
            };
        }

        return null;
    }

    generateGuide(node: SceneNode): ManualFixGuide {
        const rect = node as RectangleNode;

        return {
            node_id: rect.id,
            problem: `Spacer detectado: "${rect.name}"`,
            severity: this.severity,
            step_by_step: [
                { step: 1, action: 'Selecione o frame pai que contém este spacer' },
                { step: 2, action: 'Verifique se o frame pai usa Auto Layout (se não, aplique com Shift + A)' },
                { step: 3, action: 'Aumente o valor de "Gap" no painel direito' },
                { step: 4, action: `Delete o elemento "${rect.name}"` },
                { step: 5, action: 'Ajuste o gap até obter o espaçamento desejado' }
            ],
            before_after_example: {
                before: 'Frame com spacers (retângulos invisíveis) entre elementos',
                after: 'Frame com Auto Layout e gap configurado'
            },
            estimated_time: '30 segundos',
            difficulty: 'easy'
        };
    }
}
