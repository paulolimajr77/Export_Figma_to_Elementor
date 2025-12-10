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
    semanticRole?: string;
    source?: 'explicit-name' | 'heuristic' | 'ai' | 'implicit-pattern';
    properties?: Record<string, any>;
    visualWrapperStyle?: Record<string, any>;
    // Composite/slots metadata (icon-box, icon-list, form, etc.)
    compositeOf?: string[]; // child node ids consumed to build this widget
    slots?: Record<string, string>; // slotName -> nodeId (e.g., icon/title/text)
    repeaterItems?: Array<{ itemId: string; iconId?: string; textId?: string }>;
    consumedBy?: string; // if this detection/node was consumed by a composite parent
    attachedTextIds?: string[]; // helper/description texts attached to this widget
    wrapperCollapsed?: boolean;
    wrapperNodeId?: string;
}

export interface TextBlockInfo {
    nodeId: string;
    type: 'headline-stack' | 'headline+body' | 'headline+subheadline' | 'headline-subheadline-body';
    rolesByChildId: Record<string, 'headline' | 'subheadline' | 'body' | 'small-label'>;
    confidence: number;
    justification?: string;
}

export interface ContainerRoleDetection {
    nodeId: string;
    role: 'section' | 'inner' | 'card' | 'hero' | 'footer' | 'image-box-container' | 'grid' | 'section-root';
    confidence: number;
    hints?: string[];
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
        text_blocks_detected?: number;
        container_roles_detected?: number;
        composite_widgets_detected?: number;
        collapsed_wrappers?: number;
        attached_texts?: number;
        composite_breakdown?: Record<string, number>;
        internal_debug?: Record<string, any>;
        naming_context?: {
            total_widgets_detected: number;
            total_containers_with_roles: number;
            roles_distribution: Record<string, number>;
            widgets_with_microtext: number;
            widgets_with_wrappers: number;
            composite_breakdown: Record<string, number>;
        };
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
