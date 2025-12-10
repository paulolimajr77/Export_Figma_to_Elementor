import { Rule, LintResult, ManualFixGuide, WidgetDetection, TextBlockInfo } from '../../types';
import { WidgetDetector } from '../../detectors/WidgetDetector';
import {
    filterValidWidgetNames,
    getContainerWidgetNames,
    getMediaWidgetNames,
    getTextWidgetNames,
    normalizeWidgetSlug,
    isWidgetInTaxonomy
} from '../../config/widget-taxonomy';
import { getAlternativesForSlug, getCanonicalName, isValidWidgetSlug } from '../../namingTaxonomy';

/**
 * Regra: Widget Detection & Naming
 * Usa a taxonomia oficial para sugerir apenas nomes válidos (sem strings soltas).
 */
export class WidgetNamingRule implements Rule {
    id = 'widget-naming';
    category = 'naming' as const;
    severity = 'major' as const;

    private detector = new WidgetDetector();
    private detections: Map<string, WidgetDetection> = new Map();
    private textBlocks: Map<string, TextBlockInfo> = new Map();
    private readonly TEXT_WIDGETS = new Set(getTextWidgetNames());

    setDetectionMap(detections: Map<string, WidgetDetection>) {
        this.detections = detections;
    }

    setTextBlocks(textBlocks: Map<string, TextBlockInfo>) {
        this.textBlocks = textBlocks;
    }

    async validate(node: SceneNode): Promise<LintResult | null> {
        const detection = this.getDetectionForNode(node);
        if (!detection) return null;

        const suggestedWidget = detection.widget;
        const confidence = detection.confidence;
        if (confidence < 0.6) return null;

        const canonicalWidget = this.toTaxonomySlug(suggestedWidget);
        if (!canonicalWidget) return null;

        if (node.type === 'TEXT' && !this.TEXT_WIDGETS.has(canonicalWidget)) {
            return null;
        }

        const currentName = node.name || '';
        const isCorrectlyNamed = currentName.toLowerCase().includes(canonicalWidget.toLowerCase()) ||
            currentName.startsWith('w:') ||
            currentName.startsWith('woo:') ||
            currentName.startsWith('loop:');
        if (isCorrectlyNamed) return null;

        const options = this.buildOptionsForNode(node, canonicalWidget, detection);
        if (!options.length) return null;
        const [recommendedName, ...alternatives] = options;
        const justification = this.buildJustification(detection, canonicalWidget);

        return {
            node_id: node.id,
            node_name: node.name,
            node_type: node.type,
            severity: this.severity,
            category: this.category,
            rule: this.id,
            message: `Widget detectado como "${canonicalWidget}" (${Math.round(confidence * 100)}% confiança, fonte ${detection.source || 'heuristic'}), mas nome atual é "${currentName}"`,
            widgetType: canonicalWidget,
            confidence,
            naming: {
                recommendedName,
                alternatives
            },
            educational_tip: this.buildEducationalTip(canonicalWidget, recommendedName, currentName, justification),
            fixAvailable: true
        };
    }

    private getDetectionForNode(node: SceneNode): WidgetDetection | null {
        if (this.detections && this.detections.size > 0) {
            const cached = this.detections.get(node.id);
            if (cached) return cached;
            return null;
        }
        return this.detector.detect(node);
    }

    private buildOptionsForNode(node: SceneNode, canonicalWidget: string, detection: WidgetDetection): string[] {
        const alternatives = getAlternativesForSlug(canonicalWidget, {
            semanticRole: detection.semanticRole,
            containerRole: undefined
        });
        const ordered = [canonicalWidget, ...alternatives];
        return filterValidWidgetNames(ordered).filter(name => isValidWidgetSlug(name));
    }

    private toTaxonomySlug(widget: string): string | null {
        const normalized = normalizeWidgetSlug(widget);
        if (normalized) return normalized;
        if (isWidgetInTaxonomy(widget)) return widget;
        return null;
    }

    private getSuggestions(widget: string, currentName: string): string[] {
        const suggestions: string[] = [];
        suggestions.push(`• "${widget}" (padrão técnico da taxonomia)`);

        const context = currentName.replace(/frame|rectangle|group|\d+/gi, '').trim();
        if (context) {
            suggestions.push(`• "${context} ${widget}" (nome descritivo)`);
        }

        suggestions.push(`• "Hero ${widget}" ou "Footer ${widget}" (nome funcional dentro da taxonomia)`);
        return suggestions;
    }

    private buildEducationalTip(canonicalWidget: string, recommendedName: string, currentName: string, justification: string): string {
        return `
🔎 Widget Detection

O Linter detectou que este elemento corresponde ao widget "${canonicalWidget}" do Elementor.

🧭 Por que nomenclatura correta importa:
• Facilita identificação visual no Figma
• Melhora conversão automática para Elementor
• Reduz erros na exportação
• Torna o design system mais consistente

💡 Nomenclatura recomendada:
${this.getSuggestions(recommendedName, currentName).join('\n')}

✅ Justificativa da detecção:
${justification}
        `.trim();
    }

    private buildJustification(det: WidgetDetection, canonicalWidget: string): string {
        const parts: string[] = [];
        parts.push(`Fonte: ${det.source || 'heuristic'} (${Math.round((det.confidence || 0) * 100)}% confiança)`);
        if (det.semanticRole) parts.push(`Papel semântico: ${det.semanticRole}`);
        if (det.compositeOf && det.compositeOf.length) {
            const slotsCount = det.slots ? Object.keys(det.slots).length : 0;
            parts.push(`Compósito ${canonicalWidget} com ${slotsCount || det.compositeOf.length} slots/itens`);
        }
        if (det.repeaterItems && det.repeaterItems.length) {
            parts.push(`Lista com ${det.repeaterItems.length} itens (ícone+texto)`);
        }
        if (det.wrapperCollapsed) {
            parts.push('Estilo visual herdado de wrapper colapsado');
        }
        if (det.attachedTextIds && det.attachedTextIds.length) {
            parts.push(`Textos anexados (descrições/microtextos): ${det.attachedTextIds.length}`);
        }
        if (det.justification) {
            parts.push(det.justification);
        }
        return parts.join(' | ');
    }

    generateGuide(node: SceneNode): ManualFixGuide {
        const detection = this.getDetectionForNode(node);
        const suggestedWidget = detection?.widget || 'unknown';
        const canonicalWidget = this.toTaxonomySlug(suggestedWidget) || suggestedWidget;

        return {
            node_id: node.id,
            problem: `Nome não reflete o widget detectado (${canonicalWidget})`,
            severity: this.severity,
            step_by_step: [
                { step: 1, action: 'Selecione o layer no Figma' },
                { step: 2, action: `Renomeie para "${canonicalWidget}"` },
                { step: 3, action: 'Use apenas nomes da taxonomia oficial (dropdown do Linter)' },
                { step: 4, action: 'Confirme no painel se o nome foi aplicado' }
            ],
            before_after_example: {
                before: `Nome genérico: "${node.name}"`,
                after: `Nome correto: "${canonicalWidget}"`
            },
            estimated_time: '30 segundos',
            difficulty: 'easy'
        };
    }
}
