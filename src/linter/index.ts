/**
 * Módulo Linter - API Pública
 * Análise e orientação de boas práticas para layouts do Figma
 */

export * from './types';
export { LinterEngine } from './core/LinterEngine';
export { RuleRegistry } from './core/RuleRegistry';

// Regras
export { AutoLayoutRule } from './rules/structure/AutoLayoutRule';
export { SpacerDetectionRule } from './rules/structure/SpacerDetectionRule';
export { GenericNameRule } from './rules/naming/GenericNameRule';

import { LinterEngine } from './core/LinterEngine';
import { RuleRegistry } from './core/RuleRegistry';
import { AutoLayoutRule } from './rules/structure/AutoLayoutRule';
import { SpacerDetectionRule } from './rules/structure/SpacerDetectionRule';
import { GenericNameRule } from './rules/naming/GenericNameRule';
import { LinterOptions, LinterReport } from './types';

/**
 * Função principal: Analisa um layout do Figma
 * 
 * @param node - Node raiz do Figma para analisar
 * @param options - Opções de configuração
 * @returns Relatório completo de análise
 */
export async function analyzeFigmaLayout(
    node: SceneNode,
    options: LinterOptions = {
        aiAssisted: false,
        aiProvider: 'none',
        deviceTarget: 'desktop'
    }
): Promise<LinterReport> {
    const engine = new LinterEngine();
    const registry = new RuleRegistry();

    // Registra regras essenciais (desktop only)
    registry.registerAll([
        new AutoLayoutRule(),
        new SpacerDetectionRule(),
        new GenericNameRule()
    ]);

    // Executa análise
    const results = await engine.analyze(node, registry, options);

    // Gera relatório
    return engine.generateReport(results, registry, options);
}

/**
 * Valida um único node (usado para re-análise após correção)
 * 
 * @param node - Node do Figma para validar
 * @returns Resultado da validação
 */
export async function validateSingleNode(
    node: SceneNode
): Promise<{ isValid: boolean; issues: string[] }> {
    const engine = new LinterEngine();
    const registry = new RuleRegistry();

    registry.registerAll([
        new AutoLayoutRule(),
        new SpacerDetectionRule(),
        new GenericNameRule()
    ]);

    const results = await engine.analyzeNode(node, registry);

    return {
        isValid: results.length === 0,
        issues: results.map(r => r.message)
    };
}
