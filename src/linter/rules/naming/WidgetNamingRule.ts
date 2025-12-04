import { Rule, LintResult, ManualFixGuide } from '../../types';
import { WidgetDetector } from '../../detectors/WidgetDetector';

/**
 * Regra: Widget Detection & Naming
 * Detecta qual widget Elementor o node representa e valida se o nome está correto
 * Severidade: Warning (não crítico, mas importante para qualidade)
 * Categoria: Naming
 */
export class WidgetNamingRule implements Rule {
    id = 'widget-naming';
    category = 'naming' as const;
    severity = 'major' as const;

    private detector = new WidgetDetector();

    async validate(node: SceneNode): Promise<LintResult | null> {
        // Detecta widget
        const detection = this.detector.detect(node);

        if (!detection) {
            return null; // Não conseguiu detectar widget
        }

        // Verifica se o nome atual corresponde ao widget detectado
        const currentName = node.name;
        const suggestedWidget = detection.widget;
        const confidence = detection.confidence;

        // Se confidence é baixa (< 0.6), não reportar
        if (confidence < 0.6) {
            return null;
        }

        // Verifica se o nome já está correto
        const isCorrectlyNamed = currentName.toLowerCase().includes(suggestedWidget.toLowerCase()) ||
            currentName.startsWith('w:') ||
            currentName.startsWith('woo:') ||
            currentName.startsWith('loop:');

        if (isCorrectlyNamed) {
            return null; // Nome já está bom
        }

        return {
            node_id: node.id,
            node_name: node.name,
            severity: this.severity,
            category: this.category,
            rule: this.id,
            message: `Widget detectado como "${suggestedWidget}" (${Math.round(confidence * 100)}% confiança), mas nome atual é "${currentName}"`,
            educational_tip: `
💡 Widget Detection

O Linter detectou que este elemento corresponde ao widget "${suggestedWidget}" do Elementor.

📋 Por que nomenclatura correta importa:
• Facilita identificação visual no Figma
• Melhora conversão automática para Elementor
• Reduz erros na exportação
• Torna o design system mais consistente

✅ Nomenclatura recomendada:
${this.getSuggestions(suggestedWidget, currentName).join('\n')}

🎯 Justificativa da detecção:
${detection.justification}
            `.trim(),
            fixAvailable: false // Naming não tem auto-fix (usuário deve decidir)
        };
    }

    generateGuide(node: SceneNode): ManualFixGuide {
        const detection = this.detector.detect(node);
        const suggestedWidget = detection?.widget || 'w:unknown';

        return {
            node_id: node.id,
            problem: `Nome não reflete o widget detectado (${suggestedWidget})`,
            severity: this.severity,
            step_by_step: [
                { step: 1, action: 'Selecione o layer no Figma' },
                { step: 2, action: `Renomeie para "${suggestedWidget}"` },
                { step: 3, action: 'Ou use um nome descritivo que inclua o tipo de widget' },
                { step: 4, action: 'Exemplo: "Hero CTA Button" ou "w:button"' }
            ],
            before_after_example: {
                before: `Nome genérico: "${node.name}"`,
                after: `Nome correto: "${suggestedWidget}" ou "Hero ${suggestedWidget}"`
            },
            estimated_time: '30 segundos',
            difficulty: 'easy'
        };
    }

    private getSuggestions(widget: string, currentName: string): string[] {
        const suggestions: string[] = [];

        // Opção 1: Nome técnico puro
        suggestions.push(`• "${widget}" (padrão técnico)`);

        // Opção 2: Nome contextual
        const context = currentName.replace(/frame|rectangle|group|\d+/gi, '').trim();
        if (context) {
            suggestions.push(`• "${context} ${widget}" (nome descritivo)`);
        }

        // Opção 3: Nome funcional
        const widgetType = widget.split(':')[1] || widget;
        suggestions.push(`• "Hero ${widgetType}" ou "Footer ${widgetType}" (nome funcional)`);

        return suggestions;
    }
}
