import { Rule, LintResult, ManualFixGuide } from '../../types';
import { filterValidWidgetNames, getContainerWidgetNames, getMediaWidgetNames, getTextWidgetNames } from '../../config/widget-taxonomy';

/**
 * Regra: Detecta nomes genéricos de camadas e sugere apenas slugs oficiais.
 */
export class GenericNameRule implements Rule {
    id = 'generic-name-detected';
    category = 'naming' as const;
    severity = 'major' as const;

    private readonly GENERIC_PATTERNS = /^(Frame|Rectangle|Group|Vector|Ellipse|Line|Component|Instance)\s+\d+$/;

    async validate(node: SceneNode): Promise<LintResult | null> {
        if (!this.GENERIC_PATTERNS.test(node.name)) return null;

        const namingOptions = this.buildNamingOptions(node);
        const recommended = namingOptions[0];

        return {
            node_id: node.id,
            node_name: node.name,
            severity: this.severity,
            category: this.category,
            rule: this.id,
            message: `Nome genérico detectado: "${node.name}"${recommended ? ` → use "${recommended}"` : ''}`,
            educational_tip: this.buildEducationalTip(namingOptions),
            ...(recommended
                ? {
                    naming: {
                        recommendedName: recommended,
                        alternatives: namingOptions.slice(1)
                    }
                }
                : {}),
        };
    }

    generateGuide(node: SceneNode): ManualFixGuide {
        const namingOptions = this.buildNamingOptions(node);
        const recommended = namingOptions[0] || 'w:container';

        return {
            node_id: node.id,
            problem: `Nome genérico: "${node.name}"`,
            severity: this.severity,
            step_by_step: [
                { step: 1, action: 'Clique duas vezes no nome da camada no Figma' },
                { step: 2, action: `Renomeie seguindo o padrão da taxonomia: ${recommended}` },
                { step: 3, action: 'Use nomes descritivos que indiquem a função do elemento' }
            ],
            before_after_example: {
                before: `"${node.name}" (genérico)`,
                after: `"${recommended}" (taxonomia oficial)`
            },
            estimated_time: '10 segundos',
            difficulty: 'easy'
        };
    }

    private buildNamingOptions(node: SceneNode): string[] {
        if (node.type === 'TEXT') {
            const options = getTextWidgetNames();
            return filterValidWidgetNames(options);
        }

        if (node.type === 'RECTANGLE') {
            const rect = node as RectangleNode;
            if (this.hasImageFill(rect)) {
                return filterValidWidgetNames(['image', 'image-box']);
            }
            if (this.isButtonLike(rect)) {
                return filterValidWidgetNames(['button']);
            }
            return filterValidWidgetNames(['w:container', 'w:inner-container', ...getMediaWidgetNames()]);
        }

        if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
            return filterValidWidgetNames(['icon']);
        }

        if (node.type === 'FRAME' || node.type === 'GROUP') {
            return filterValidWidgetNames(['w:container', 'w:inner-container', ...getContainerWidgetNames()]);
        }

        return [];
    }

    private buildEducationalTip(options: string[]): string {
        if (!options.length) {
            return `
Use a taxonomia oficial do Elementor (aba Ajuda) para renomear.
Evite padrões inventados como Card/Feature ou Grid/* fora da lista oficial.
            `.trim();
        }

        return `
Por que nomenclatura importa?
- Facilita manutenção e leitura no Figma
- Melhora a detecção automática de widgets
- Gera código Elementor mais legível

Sugestões válidas (taxonomia oficial):
- ${options.join('\n- ')}
        `.trim();
    }

    private hasImageFill(node: RectangleNode): boolean {
        if (!node.fills || typeof node.fills === 'symbol') return false;
        return (node.fills as Paint[]).some(fill => fill.type === 'IMAGE');
    }

    private isButtonLike(node: RectangleNode): boolean {
        const hasFill = node.fills && typeof node.fills !== 'symbol' && node.fills.length > 0;
        const hasStroke = node.strokes && typeof node.strokes !== 'symbol' && node.strokes.length > 0;
        const hasRadius = typeof node.cornerRadius === 'number' && node.cornerRadius > 0;
        return (hasFill && hasRadius) || (hasFill && hasStroke);
    }
}
