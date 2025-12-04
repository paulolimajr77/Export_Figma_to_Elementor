import { Rule, LintResult, LinterOptions, LinterReport, ManualFixGuide } from '../types';
import { RuleRegistry } from './RuleRegistry';
import { WidgetDetector } from '../detectors/WidgetDetector';

/**
 * Motor principal do Linter
 * Executa análise de nodes do Figma e gera relatórios
 */
export class LinterEngine {
    private startTime: number = 0;
    private endTime: number = 0;

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
        console.log(`🔍 [analyzeNode] Analisando: ${node.name} (${node.type})`);
        const results: LintResult[] = [];
        const rules = registry.getAll();

        console.log(`🔍 [analyzeNode] ${rules.length} regras para executar`);

        for (const rule of rules) {
            console.log(`  ⚙️ Executando regra: ${rule.id}`);
            try {
                const result = await rule.validate(node);
                if (result) {
                    results.push(result);
                    console.log(`    ✅ Regra ${rule.id}: Issue encontrado`);
                } else {
                    console.log(`    ✅ Regra ${rule.id}: OK`);
                }
            } catch (error) {
                console.error(`    ❌ ERRO na regra ${rule.id}:`, error);
            }
        }

        // Analisa filhos recursivamente
        if ('children' in node && node.children) {
            console.log(`🔍 [analyzeNode] ${node.name} tem ${node.children.length} filhos`);
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
        console.log('📊 [generateReport] Summary gerado');

        const guides = this.generateGuides(results, registry);
        console.log('📊 [generateReport] Guides gerados');

        // Detecção de widgets (Fase 2)
        let widgets: any[] = [];
        if (rootNode) {
            console.log('📊 [generateReport] Iniciando detecção de widgets...');
            try {
                const detector = new WidgetDetector();
                console.log('📊 [generateReport] WidgetDetector criado');
                widgets = detector.detectAll(rootNode);
                console.log(`📊 [generateReport] ${widgets.length} widgets detectados`);
            } catch (error) {
                console.error('❌ ERRO ao detectar widgets:', error);
                widgets = [];
            }
        }

        return {
            summary,
            analysis: results,
            widgets,
            guides,
            metadata: {
                duration: this.getDuration(),
                timestamp: new Date().toISOString(),
                device_target: 'desktop',
                ai_used: options.aiAssisted || false,
                rules_executed: registry.getExecutedRules()
            }
        };
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
