import { Rule, LintResult, LinterOptions, LinterReport, ManualFixGuide, WidgetDetection, TextBlockInfo, ContainerRoleDetection } from '../types';
import { RuleRegistry } from './RuleRegistry';
import { WidgetDetector } from '../detectors/WidgetDetector';
import { WidgetNamingRule } from '../rules/naming/WidgetNamingRule';
import { TextBlockDetector } from '../detectors/TextBlockDetector';
import { ContainerRoleDetector } from '../detectors/ContainerRoleDetector';
import { ContainerNamingRule } from '../rules/naming/ContainerNamingRule';
import { LINTER_DEBUG } from '../utils/debugFlag';

/**
 * Motor principal do Linter
 * Executa análise de nodes do Figma e gera relatórios
 */
export class LinterEngine {
    private startTime: number = 0;
    private endTime: number = 0;
    private widgetDetector = new WidgetDetector();
    private widgetDetections: Map<string, WidgetDetection> = new Map();
    private textBlockDetector = new TextBlockDetector();
    private textBlockDetections: Map<string, TextBlockInfo> = new Map();
    private containerRoleDetector = new ContainerRoleDetector();
    private containerRoleDetections: Map<string, ContainerRoleDetection> = new Map();
    private readonly debug = LINTER_DEBUG;

    /**
     * Analisa um node do Figma
     */
    async analyze(
        node: SceneNode,
        registry: RuleRegistry,
        options: LinterOptions = {}
    ): Promise<LintResult[]> {
        this.startTime = Date.now();
        registry.resetExecutedRules();

        // Pr?-processa detec??es para serem usadas pelo report e pelas regras de naming
        this.widgetDetections = this.widgetDetector.detectAll(node);
        this.textBlockDetections = this.textBlockDetector.detectAll(node);
        this.containerRoleDetections = this.containerRoleDetector.detectAll(node);
        this.shareDetectionsWithNamingRules(registry);

        const results: LintResult[] = [];
        const rules = this.getApplicableRules(registry, options);

        // Analisa o node raiz
        for (const rule of rules) {
            const result = await rule.validate(node);
            if (result) {
                results.push(result);
            }
            registry.markAsExecuted(rule.id);
        }

        // Analisa recursivamente os filhos
        if ('children' in node && node.children) {
            for (const child of node.children) {
                const childResults = await this.analyzeNode(child as SceneNode, registry);
                results.push(...childResults);
            }
        }

        this.endTime = Date.now();
        return results;
    }

    /**
     * Analisa um único node (sem recursão)
     */
    async analyzeNode(node: SceneNode, registry: RuleRegistry): Promise<LintResult[]> {
        if (this.debug) console.log(`[analyzeNode] ${node.name} (${node.type})`);
        const results: LintResult[] = [];

        // Skip widget naming validation if node already has a valid widget name
        const hasValidWidgetName = /^(w:|woo:|loop:)/.test(node.name);
        if (hasValidWidgetName) {
            if (this.debug) console.log(`[analyzeNode] skip ${node.name}: nome ja eh widget valido`);
            // Still analyze children, but skip rules for this node
            if ('children' in node && node.children) {
                if (this.debug) console.log(`[analyzeNode] ${node.name} tem ${node.children.length} filhos`);
                for (const child of node.children) {
                    const childResults = await this.analyzeNode(child as SceneNode, registry);
                    results.push(...childResults);
                }
            }
            return results;
        }

        const rules = registry.getAll();

        if (this.debug) console.log(`[analyzeNode] ${rules.length} regras para executar`);

        for (const rule of rules) {
            if (this.debug) console.log(`[analyzeNode] executando regra: ${rule.id}`);
            try {
                const result = await rule.validate(node);
                if (result) {
                    results.push(result);
                    if (this.debug) console.log(`[analyzeNode] regra ${rule.id}: issue encontrado`);
                } else {
                    if (this.debug) console.log(`[analyzeNode] regra ${rule.id}: OK`);
                }
            } catch (error) {
                console.error(`    ? ERRO na regra ${rule.id}:`, error);
            }
        }

        // Analisa filhos recursivamente
        if ('children' in node && node.children) {
                if (this.debug) console.log(`[analyzeNode] ${node.name} tem ${node.children.length} filhos`);
            for (const child of node.children) {
                const childResults = await this.analyzeNode(child as SceneNode, registry);
                results.push(...childResults);
            }
        }

        return results;
    }

    /**
     * Gera relatório completo
     */
    generateReport(
        results: LintResult[],
        registry: RuleRegistry,
        options: LinterOptions = {},
        rootNode?: SceneNode
    ): LinterReport {
        const summary = this.generateSummary(results);
        if (this.debug) console.log('[generateReport] Summary gerado');

        const guides = this.generateGuides(results, registry);
        if (this.debug) console.log('[generateReport] Guides gerados');

        // Deteccao de widgets (Fase 2)
        let widgets: WidgetDetection[] = [];
        let detectionMap = this.widgetDetections;
        if ((!detectionMap || detectionMap.size === 0) && rootNode) {
            if (this.debug) console.log('[generateReport] Iniciando deteccao de widgets (fallback)...');
            try {
                detectionMap = this.widgetDetector.detectAll(rootNode);
            } catch (error) {
                console.error('Erro ao detectar widgets:', error);
                detectionMap = new Map();
            }
        }
        if (detectionMap) {
            widgets = Array.from(detectionMap.values());
            if (this.debug) console.log(`[generateReport] ${widgets.length} widgets detectados`);
        }

        // Metadata extra sobre compósitos/wrappers/textos anexados
        const compositeWidgetsCount = widgets.filter(w => (w.compositeOf && w.compositeOf.length > 0)).length;
        const collapsedWrappersCount = widgets.filter(w => w.wrapperCollapsed).length;
        const attachedTextCount = widgets.reduce((acc, w) => acc + ((w.attachedTextIds && w.attachedTextIds.length) || 0), 0);
        const compositeBreakdown: Record<string, number> = {};
        widgets.forEach(w => {
            if (w.compositeOf && w.compositeOf.length && w.widget) {
                const key = w.widget;
                compositeBreakdown[key] = (compositeBreakdown[key] || 0) + 1;
            }
        });

        const report: LinterReport = {
            summary,
            analysis: results,
            widgets,
            guides,
            metadata: {
                duration: this.getDuration(),
                timestamp: new Date().toISOString(),
                device_target: 'desktop',
                ai_used: options.aiAssisted || false,
                rules_executed: registry.getExecutedRules(),
                text_blocks_detected: this.textBlockDetections?.size || 0,
                container_roles_detected: this.containerRoleDetections?.size || 0,
                composite_widgets_detected: compositeWidgetsCount,
                collapsed_wrappers: collapsedWrappersCount,
                attached_texts: attachedTextCount,
                composite_breakdown: compositeBreakdown
            }
        };

        const rolesDistribution: Record<string, number> = {};
        this.containerRoleDetections?.forEach(det => {
            rolesDistribution[det.role] = (rolesDistribution[det.role] || 0) + 1;
        });

        report.metadata.naming_context = {
            total_widgets_detected: widgets.length,
            total_containers_with_roles: this.containerRoleDetections?.size || 0,
            roles_distribution: rolesDistribution,
            widgets_with_microtext: widgets.filter(w => w.attachedTextIds && w.attachedTextIds.length).length,
            widgets_with_wrappers: widgets.filter(w => w.wrapperCollapsed).length,
            composite_breakdown: compositeBreakdown
        };

        if (this.debug) {
            report.metadata.internal_debug = {
                composite_breakdown: compositeBreakdown,
                widgets_detected: widgets.length,
                attached_texts: attachedTextCount,
                collapsed_wrappers: collapsedWrappersCount
            };
        }

        return report;
    }

    /**
     * Gera sumário de problemas
     */
    generateSummary(results: LintResult[]) {
        return {
            total: results.length,
            critical: results.filter(r => r.severity === 'critical').length,
            major: results.filter(r => r.severity === 'major').length,
            minor: results.filter(r => r.severity === 'minor').length,
            info: results.filter(r => r.severity === 'info').length
        };
    }

    /**
     * Gera guias de correção manual
     */
    generateGuides(results: LintResult[], registry: RuleRegistry): ManualFixGuide[] {
        const guides: ManualFixGuide[] = [];

        for (const result of results) {
            const rule = registry.get(result.rule);
            if (rule && rule.generateGuide) {
                // Precisamos do node original para gerar o guia
                // Por enquanto, criamos um guia genérico
                const guide: ManualFixGuide = {
                    node_id: result.node_id,
                    problem: result.message,
                    severity: result.severity,
                    step_by_step: this.getGenericSteps(result.rule),
                    estimated_time: this.estimateTime(result.severity),
                    difficulty: this.estimateDifficulty(result.severity)
                };
                guides.push(guide);
            }
        }

        return guides;
    }
    /**
     * Compartilha detecções aprovadas com regras que dependem delas
     */
    private shareDetectionsWithNamingRules(registry: RuleRegistry): void {
        for (const rule of registry.getAll()) {
            if (rule instanceof WidgetNamingRule && typeof (rule as WidgetNamingRule).setDetectionMap === 'function') {
                (rule as WidgetNamingRule).setDetectionMap(this.widgetDetections);
                if (typeof (rule as any).setTextBlocks === 'function') {
                    (rule as any).setTextBlocks(this.textBlockDetections);
                }
            }
            if (rule instanceof ContainerNamingRule && typeof (rule as ContainerNamingRule).setDetectionMap === 'function') {
                (rule as ContainerNamingRule).setDetectionMap(this.containerRoleDetections);
                if (typeof (rule as any).setWidgetMap === 'function') {
                    (rule as any).setWidgetMap(this.widgetDetections);
                }
            }
        }
    }


    /**
     * Obtém passos genéricos baseados na regra
     */
    private getGenericSteps(ruleId: string): Array<{ step: number; action: string }> {
        // Mapeamento básico de regras para passos
        const stepsMap: Record<string, string[]> = {
            'auto-layout-required': [
                'Selecione o frame no Figma',
                'Pressione Shift + A (atalho para Auto Layout)',
                'Ajuste a direção (Vertical ou Horizontal)',
                'Defina o espaçamento (Gap) entre itens',
                'Adicione padding interno se necessário'
            ],
            'spacer-detected': [
                'Selecione o frame pai',
                'Aumente o valor de Gap',
                'Delete o elemento spacer'
            ],
            'generic-name-detected': [
                'Clique duas vezes no nome da camada',
                'Renomeie seguindo o padrão sugerido'
            ]
        };

        const actions = stepsMap[ruleId] || ['Corrija o problema manualmente'];
        return actions.map((action, index) => ({ step: index + 1, action }));
    }

    /**
     * Estima tempo de correção
     */
    private estimateTime(severity: string): string {
        const timeMap: Record<string, string> = {
            critical: '1-2 minutos',
            major: '30 segundos',
            minor: '10 segundos',
            info: '5 segundos'
        };
        return timeMap[severity] || '1 minuto';
    }

    /**
     * Estima dificuldade de correção
     */
    private estimateDifficulty(severity: string): 'easy' | 'medium' | 'hard' {
        if (severity === 'critical') return 'medium';
        if (severity === 'major') return 'easy';
        return 'easy';
    }

    /**
     * Obtém regras aplicáveis baseado nas opções
     */
    private getApplicableRules(registry: RuleRegistry, options: LinterOptions): Rule[] {
        let rules = registry.getAll();

        // Filtra por IDs de regras específicas
        if (options.rules && options.rules.length > 0) {
            rules = rules.filter(rule => options.rules!.includes(rule.id));
        }

        // Filtra por severidade
        if (options.severity && options.severity.length > 0) {
            rules = rules.filter(rule => options.severity!.includes(rule.severity));
        }

        return rules;
    }

    /**
     * Obtém duração da análise em ms
     */
    getDuration(): number {
        return this.endTime - this.startTime;
    }
}





