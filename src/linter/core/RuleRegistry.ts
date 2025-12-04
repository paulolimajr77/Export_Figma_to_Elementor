import { Rule, LintResult, Category, Severity } from '../types';

/**
 * Registro de regras do Linter
 * Gerencia todas as regras disponíveis e permite ativação/desativação
 */
export class RuleRegistry {
    private rules: Map<string, Rule> = new Map();
    private executedRules: string[] = [];

    /**
     * Registra uma nova regra
     */
    register(rule: Rule): void {
        this.rules.set(rule.id, rule);
    }

    /**
     * Registra múltiplas regras
     */
    registerAll(rules: Rule[]): void {
        rules.forEach(rule => this.register(rule));
    }

    /**
     * Registra apenas regras para desktop
     */
    registerDesktopRules(): void {
        // Será implementado quando as regras forem criadas
        // Por enquanto, apenas placeholder
    }

    /**
     * Obtém uma regra por ID
     */
    get(ruleId: string): Rule | undefined {
        return this.rules.get(ruleId);
    }

    /**
     * Obtém todas as regras registradas
     */
    getAll(): Rule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Obtém regras por categoria
     */
    getByCategory(category: Category): Rule[] {
        return this.getAll().filter(rule => rule.category === category);
    }

    /**
     * Obtém regras por severidade
     */
    getBySeverity(severity: Severity): Rule[] {
        return this.getAll().filter(rule => rule.severity === severity);
    }

    /**
     * Marca uma regra como executada
     */
    markAsExecuted(ruleId: string): void {
        if (!this.executedRules.includes(ruleId)) {
            this.executedRules.push(ruleId);
        }
    }

    /**
     * Obtém lista de regras executadas
     */
    getExecutedRules(): string[] {
        return [...this.executedRules];
    }

    /**
     * Reseta lista de regras executadas
     */
    resetExecutedRules(): void {
        this.executedRules = [];
    }

    /**
     * Obtém total de regras registradas
     */
    count(): number {
        return this.rules.size;
    }
}
