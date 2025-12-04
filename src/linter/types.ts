/**
 * Tipos e interfaces do módulo Linter
 */

export type Severity = 'critical' | 'major' | 'minor' | 'info';
export type Category = 'structure' | 'design-system' | 'naming' | 'media';

export interface LintResult {
    node_id: string;
    node_name: string;
    severity: Severity;
    category: Category;
    rule: string;
    message: string;
    educational_tip: string;
    fixAvailable?: boolean;
}

// ... (existing code)

export interface Rule {
    id: string;
    category: Category;
    severity: Severity;
    validate(node: SceneNode): Promise<LintResult | null>;
    fix?(node: SceneNode): Promise<boolean>;
    generateGuide?(node: SceneNode): ManualFixGuide;
}

export interface WidgetDetection {
    node_id: string;
    node_name: string;
    widget: string; // w:button, w:heading, etc.
    confidence: number; // 0-1
    justification: string;
    properties?: Record<string, any>;
}

export interface ManualFixGuide {
    node_id: string;
    problem: string;
    severity: Severity;
    step_by_step: Array<{
        step: number;
        action: string;
        screenshot?: string;
        videoUrl?: string;
    }>;
    before_after_example?: {
        before: string;
        after: string;
    };
    estimated_time: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface LinterOptions {
    rules?: string[];
    severity?: Severity[];
    aiAssisted?: boolean; // Padrão: false
    aiProvider?: 'gemini' | 'openai' | 'none'; // Padrão: 'none'
    deviceTarget?: 'desktop'; // Sempre desktop
}

export interface LinterReport {
    summary: {
        total: number;
        critical: number;
        major: number;
        minor: number;
        info: number;
    };
    analysis: LintResult[];
    widgets: WidgetDetection[];
    guides: ManualFixGuide[];
    ai_suggestions?: AISuggestion[];
    metadata: {
        duration: number;
        timestamp: string;
        device_target: 'desktop';
        ai_used: boolean;
        rules_executed: string[];
    };
}

export interface AISuggestion {
    node_id: string;
    type: 'naming' | 'pattern' | 'optimization';
    suggestion: string;
    confidence: number;
    reasoning: string;
}

export interface Rule {
    id: string;
    category: Category;
    severity: Severity;
    validate(node: SceneNode): Promise<LintResult | null>;
    generateGuide?(node: SceneNode): ManualFixGuide;
}

export interface LinterProgress {
    layoutId: string;
    totalProblems: number;
    resolved: string[]; // IDs dos nodes resolvidos
    ignored: string[]; // IDs dos nodes ignorados
    timestamp: number;
}
