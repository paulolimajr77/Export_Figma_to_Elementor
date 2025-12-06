import {
    AnalysisResult,
    MatchCandidate,
    NodeFeatures,
    StructuralIssue
} from './types';
import { extractNodeFeatures } from './feature-extractor';
import { evaluateHeuristics } from './heuristic-registry';

// ============================================================================
// ExplainabilityLayer - Logging structured decisions
// ============================================================================

export interface DecisionExplanation {
    nodeId: string;
    nodeName: string;
    winner: string | null;
    score: number;
    reason: string;
    features: Partial<NodeFeatures>;
    candidates: Array<{ widget: string; score: number }>;
}

/**
 * Explainability threshold for console logging
 */
const EXPLAIN_ENABLED = true;
const V2_MIN_CONFIDENCE = 0.70;

/**
 * Log a structured decision explanation to the console
 */
function explainDecision(explanation: DecisionExplanation): void {
    if (!EXPLAIN_ENABLED) return;

    const candidateList = explanation.candidates
        .slice(0, 3)
        .map(c => `${c.widget}(${c.score.toFixed(2)})`)
        .join(', ');

    const featureStr = Object.entries(explanation.features)
        .filter(([_, v]) => v !== undefined && v !== null && v !== false && v !== 0)
        .slice(0, 5)
        .map(([k, v]) => `${k}=${typeof v === 'number' ? v.toFixed ? v.toFixed(0) : v : v}`)
        .join(', ');

    console.log(
        `[V2-EXPLAIN] Node ${explanation.nodeId} | ` +
        `${explanation.winner || 'container'} (${explanation.score.toFixed(2)}) | ` +
        `${explanation.reason} | ` +
        `Features: ${featureStr || 'none'}`
    );

    if (explanation.candidates.length > 1) {
        console.log(`[V2-EXPLAIN] Candidates: ${candidateList}`);
    }
}

// ============================================================================
// Core Analysis Functions
// ============================================================================

/**
 * Analisa um único node do Figma e retorna o AnalysisResult
 * com melhor widget, alternativas e issues estruturais.
 */
export function analyzeNodeWithEngine(
    node: SceneNode,
    rootFrame: FrameNode | null
): AnalysisResult {
    var features: NodeFeatures = extractNodeFeatures(node, rootFrame);
    var structuralIssues: StructuralIssue[] = [];

    // Structural issue: container without Auto Layout
    if (features.childCount > 0 && features.layoutMode === 'NONE') {
        structuralIssues.push({
            severity: 'warning',
            message:
                'Container com filhos sem Auto Layout. Considere aplicar Auto Layout para melhor responsividade.',
            fixAvailable: false
        });
    }

    var candidates: MatchCandidate[] = evaluateHeuristics(features);

    var bestMatch: MatchCandidate | null = null;
    var alternatives: MatchCandidate[] = [];
    var decisionReason = 'no candidates';

    if (candidates.length > 0) {
        bestMatch = candidates[0];

        // V2 threshold: require 0.70 minimum confidence
        if (bestMatch.score < V2_MIN_CONFIDENCE) {
            decisionReason = `score ${bestMatch.score.toFixed(2)} < threshold ${V2_MIN_CONFIDENCE}`;
            bestMatch = {
                widget: 'w:container',
                score: 0.30,
                ruleId: 'ContainerFallback'
            };
        } else {
            decisionReason = `score ${bestMatch.score.toFixed(2)} >= threshold`;
            for (var i = 1; i < candidates.length; i++) {
                alternatives.push(candidates[i]);
            }
        }
    } else {
        // No candidates at all - default to container
        bestMatch = {
            widget: 'w:container',
            score: 0.30,
            ruleId: 'ContainerFallback'
        };
        decisionReason = 'no candidates, fallback';
    }

    // ExplainabilityLayer logging
    explainDecision({
        nodeId: features.id,
        nodeName: features.name,
        winner: bestMatch?.widget || null,
        score: bestMatch?.score || 0,
        reason: decisionReason,
        features: {
            type: features.type,
            width: features.width,
            height: features.height,
            childCount: features.childCount,
            hasText: features.hasText,
            hasImage: features.hasImage,
            fontSize: features.fontSize,
            fontWeight: features.fontWeight,
            zone: features.zone
        },
        candidates: candidates.map(c => ({ widget: c.widget, score: c.score }))
    });

    var result: AnalysisResult = {
        nodeId: features.id,
        nodeName: features.name,
        bestMatch: bestMatch,
        alternatives: alternatives,
        structuralIssues: structuralIssues
    };

    return result;
}

/**
 * Analyze a node and return a simplified widget suggestion for the parser.
 * This is the main entry point for noai.parser.ts integration.
 */
export function getV2WidgetSuggestion(
    node: SceneNode,
    rootFrame: FrameNode | null
): { type: string; score: number; isReliable: boolean } | null {
    const result = analyzeNodeWithEngine(node, rootFrame);

    if (!result.bestMatch) {
        return null;
    }

    const widgetType = result.bestMatch.widget.replace(/^w:/, '');
    const score = result.bestMatch.score;
    const isReliable = score >= V2_MIN_CONFIDENCE;

    return { type: widgetType, score, isReliable };
}

/**
 * Analisa recursivamente uma subárvore a partir de um rootFrame e
 * retorna uma lista plana de AnalysisResult.
 */
export function analyzeTreeWithEngine(
    rootFrame: FrameNode
): AnalysisResult[] {
    var results: AnalysisResult[] = [];

    function visit(node: SceneNode) {
        var analysis = analyzeNodeWithEngine(node, rootFrame);
        results.push(analysis);

        if ('children' in node && Array.isArray((node as any).children)) {
            var children = (node as any).children as readonly SceneNode[];
            for (var i = 0; i < children.length; i++) {
                visit(children[i]);
            }
        }
    }

    visit(rootFrame);

    return results;
}
