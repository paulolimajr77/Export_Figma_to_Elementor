import { Rule, LintResult, ManualFixGuide, ContainerRoleDetection } from '../../types';
import { ContainerRoleDetector } from '../../detectors/ContainerRoleDetector';
import { filterValidWidgetNames, getContainerWidgetNames } from '../../config/widget-taxonomy';

export class ContainerNamingRule implements Rule {
    id = 'container-naming';
    category = 'naming' as const;
    severity = 'major' as const;

    private detector = new ContainerRoleDetector();
    private detections: Map<string, ContainerRoleDetection> = new Map();

    setDetectionMap(map: Map<string, ContainerRoleDetection>) {
        this.detections = map;
    }

    async validate(node: SceneNode): Promise<LintResult | null> {
        if (node.type !== 'FRAME' && node.type !== 'GROUP') return null;

        const detection = this.getDetectionForNode(node);
        if (!detection) return null;

        const currentName = node.name || '';
        if (this.nameAlreadyContainsRole(currentName, detection.role)) {
            return null;
        }

        const suggestions = this.buildNameSuggestions(detection.role);
        if (!suggestions.length) return null;

        const message = `Container detectado como "${detection.role}" (${Math.round(detection.confidence * 100)}% conf.) → renomeie para "${suggestions[0]}"`;

        return {
            node_id: node.id,
            node_name: node.name,
            node_type: node.type,
            severity: this.severity,
            category: this.category,
            rule: this.id,
            message,
            naming: {
                recommendedName: suggestions[0],
                alternatives: suggestions.slice(1, 4)
            },
            educational_tip: this.buildEducationalTip(detection, suggestions),
            fixAvailable: true
        };
    }

    generateGuide(node: SceneNode): ManualFixGuide {
        const detection = this.getDetectionForNode(node);
        const role = detection?.role || 'section';
        const suggestions = this.buildNameSuggestions(role);
        return {
            node_id: node.id,
            problem: `Container sem nome semântico (parece um ${role})`,
            severity: this.severity,
            step_by_step: [
                { step: 1, action: 'Selecione o frame no Figma' },
                { step: 2, action: `Renomeie para "${suggestions[0] || 'w:container'}"` },
                { step: 3, action: 'Use apenas slugs oficiais listados na aba Ajuda/Taxonomia' }
            ],
            before_after_example: {
                before: node.name,
                after: suggestions[0] || 'w:container'
            },
            estimated_time: '15 segundos',
            difficulty: 'easy'
        };
    }

    private getDetectionForNode(node: SceneNode): ContainerRoleDetection | null {
        if (this.detections && this.detections.size > 0) {
            return this.detections.get(node.id) || null;
        }
        return this.detector.detect(node);
    }

    private nameAlreadyContainsRole(name: string, role: ContainerRoleDetection['role']): boolean {
        const lower = name.toLowerCase();
        return lower.includes(role.replace(/-/g, '')) || lower.startsWith('c:') || lower.includes('container');
    }

    private buildNameSuggestions(role: ContainerRoleDetection['role']): string[] {
        const base = getContainerWidgetNames();
        const pick = (...names: string[]) => filterValidWidgetNames(names.length ? names : base);

        switch (role) {
            case 'hero':
                return pick('w:container', 'w:inner-container');
            case 'footer':
                return pick('w:container');
            case 'card':
                return pick('w:container', 'w:inner-container', 'image-box');
            case 'image-box-container':
                return pick('image-box', 'image');
            case 'inner':
                return pick('w:inner-container', 'w:container');
            case 'grid':
                return pick('w:container');
            case 'section-root':
            case 'section':
            default:
                return pick('w:container');
        }
    }

    private buildEducationalTip(detection: ContainerRoleDetection, suggestions: string[]): string {
        return `
Papel detectado: ${detection.role}

Por que importa:
- Facilita mapear para Section/Container do Elementor
- Reduz alertas repetidos e deixa o relatório mais acionável

Sugestões (taxonomia oficial):
- ${suggestions.join('\n- ')}

Dicas:
- Use w:container para seções principais
- Use w:inner-container para wrappers internos
- Para cards/caixas de imagem, utilize slugs oficiais como image-box
        `.trim();
    }
}
