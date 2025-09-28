import { UnifiedAIDecision, AIDecisionContext, ConflictResolutionStrategy } from './MasterAICoordinator';

export interface ConflictDetectionResult {
    hasConflicts: boolean;
    conflictType: ConflictType[];
    conflictSeverity: number;
    affectedComponents: string[];
    conflictDescription: string;
    resolutionPriority: number;
}

export interface ConflictResolutionResult {
    resolvedDecision: UnifiedAIDecision;
    resolutionMethod: string;
    resolutionConfidence: number;
    conflictsResolved: number;
    resolutionTime: number;
    alternativeResolutions: UnifiedAIDecision[];
}

export interface ExpertRule {
    id: string;
    name: string;
    description: string;
    priority: number;
    condition: (decisions: Map<string, any>, context: AIDecisionContext) => boolean;
    resolution: (decisions: Map<string, any>, context: AIDecisionContext) => UnifiedAIDecision;
    confidence: number;
    applicabilityScope: string[];
}

export interface VotingConfig {
    votingMethod: 'simple_majority' | 'weighted_majority' | 'ranked_choice' | 'approval_voting';
    weightingScheme: 'equal' | 'performance_based' | 'confidence_based' | 'component_based';
    minimumConsensus: number;
    tieBreakingRule: 'random' | 'highest_confidence' | 'best_performer' | 'fallback_component';
}

export interface MedianAggregationConfig {
    aggregationFields: string[];
    outlierThreshold: number;
    robustnessWeight: number;
    confidenceAdjustment: boolean;
}

export interface HybridResolutionConfig {
    primaryMethod: string;
    fallbackMethods: string[];
    methodSelectionCriteria: Record<string, number>;
    adaptiveThresholds: Record<string, number>;
}

export enum ConflictType {
    ACTION_DISAGREEMENT = 'action_disagreement',
    CONFIDENCE_DIVERGENCE = 'confidence_divergence',
    RISK_ASSESSMENT_CONFLICT = 'risk_assessment_conflict',
    TIMELINE_INCONSISTENCY = 'timeline_inconsistency',
    RESOURCE_CONTENTION = 'resource_contention',
    STRATEGIC_OBJECTIVE_MISMATCH = 'strategic_objective_mismatch',
    PREDICTION_VARIANCE = 'prediction_variance',
    EXECUTION_PLAN_CONFLICT = 'execution_plan_conflict'
}

export class ConflictResolutionEngine {
    private expertRules: ExpertRule[];
    private resolutionHistory: ConflictResolutionResult[];
    private conflictPatterns: Map<string, number>;
    private resolutionPerformance: Map<string, number>;
    private votingConfig: VotingConfig;
    private medianConfig: MedianAggregationConfig;
    private hybridConfig: HybridResolutionConfig;
    private adaptiveThresholds: Map<string, number>;

    constructor(
        votingConfig?: Partial<VotingConfig>,
        medianConfig?: Partial<MedianAggregationConfig>,
        hybridConfig?: Partial<HybridResolutionConfig>
    ) {
        this.initializeExpertRules();
        this.initializeConfigurations(votingConfig, medianConfig, hybridConfig);
        this.initializeDataStructures();
    }

    private initializeExpertRules(): void {
        this.expertRules = [
            {
                id: 'high_confidence_priority',
                name: 'High Confidence Priority Rule',
                description: 'Prioritize decisions with confidence > 0.9',
                priority: 1,
                condition: (decisions) => {
                    return Array.from(decisions.values()).some(d => d.confidence > 0.9);
                },
                resolution: (decisions) => {
                    const highConfidenceDecisions = Array.from(decisions.entries())
                        .filter(([_, decision]) => decision.confidence > 0.9)
                        .sort(([_, a], [__, b]) => b.confidence - a.confidence);
                    
                    return this.convertToUnifiedDecision(highConfidenceDecisions[0][1], 'high_confidence_priority');
                },
                confidence: 0.95,
                applicabilityScope: ['all']
            },
            {
                id: 'strategy_network_authority',
                name: 'Strategy Network Authority Rule',
                description: 'Defer to strategy network for strategic decisions',
                priority: 2,
                condition: (decisions, context) => {
                    return context.strategicObjective.includes('strategic') && decisions.has('strategyNetwork');
                },
                resolution: (decisions) => {
                    const strategyDecision = decisions.get('strategyNetwork');
                    return this.convertToUnifiedDecision(strategyDecision, 'strategy_network_authority');
                },
                confidence: 0.85,
                applicabilityScope: ['strategic', 'long_term']
            },
            {
                id: 'predictive_ai_future_focus',
                name: 'Predictive AI Future Focus Rule',
                description: 'Use predictive AI for future-oriented decisions',
                priority: 3,
                condition: (decisions, context) => {
                    return context.strategicObjective.includes('future') || 
                           context.strategicObjective.includes('long_term') && 
                           decisions.has('predictiveAI');
                },
                resolution: (decisions) => {
                    const predictiveDecision = decisions.get('predictiveAI');
                    return this.convertToUnifiedDecision(predictiveDecision, 'predictive_ai_future_focus');
                },
                confidence: 0.8,
                applicabilityScope: ['prediction', 'planning', 'long_term']
            },
            {
                id: 'time_critical_fast_response',
                name: 'Time Critical Fast Response Rule',
                description: 'Use fastest component for time-critical decisions',
                priority: 4,
                condition: (decisions, context) => {
                    return context.timeConstraint < 1000;
                },
                resolution: (decisions, context) => {
                    const fastestComponent = this.findFastestComponent(decisions);
                    const fastestDecision = decisions.get(fastestComponent);
                    return this.convertToUnifiedDecision(fastestDecision, 'time_critical_fast_response');
                },
                confidence: 0.7,
                applicabilityScope: ['real_time', 'urgent']
            },
            {
                id: 'risk_averse_conservative',
                name: 'Risk Averse Conservative Rule',
                description: 'Choose conservative options for risk-averse contexts',
                priority: 5,
                condition: (decisions, context) => {
                    return context.riskTolerance < 0.3;
                },
                resolution: (decisions) => {
                    const conservativeDecision = this.findMostConservativeDecision(decisions);
                    return this.convertToUnifiedDecision(conservativeDecision, 'risk_averse_conservative');
                },
                confidence: 0.75,
                applicabilityScope: ['conservative', 'low_risk']
            },
            {
                id: 'consensus_based_agreement',
                name: 'Consensus Based Agreement Rule',
                description: 'Use decisions with highest agreement among components',
                priority: 6,
                condition: (decisions) => {
                    const consensusLevel = this.calculateConsensusLevel(decisions);
                    return consensusLevel > 0.7;
                },
                resolution: (decisions) => {
                    return this.findHighestConsensusDecision(decisions);
                },
                confidence: 0.8,
                applicabilityScope: ['collaborative', 'consensus']
            },
            {
                id: 'performance_based_selection',
                name: 'Performance Based Selection Rule',
                description: 'Select decision from best performing component',
                priority: 7,
                condition: (decisions) => {
                    return decisions.size > 1;
                },
                resolution: (decisions) => {
                    const bestPerformer = this.findBestPerformingComponent(decisions);
                    const bestDecision = decisions.get(bestPerformer);
                    return this.convertToUnifiedDecision(bestDecision, 'performance_based_selection');
                },
                confidence: 0.7,
                applicabilityScope: ['optimization', 'performance']
            }
        ];
    }

    private initializeConfigurations(
        votingConfig?: Partial<VotingConfig>,
        medianConfig?: Partial<MedianAggregationConfig>,
        hybridConfig?: Partial<HybridResolutionConfig>
    ): void {
        this.votingConfig = {
            votingMethod: 'weighted_majority',
            weightingScheme: 'performance_based',
            minimumConsensus: 0.6,
            tieBreakingRule: 'highest_confidence',
            ...votingConfig
        };

        this.medianConfig = {
            aggregationFields: ['confidence', 'expectedOutcome', 'riskAssessment'],
            outlierThreshold: 2.0,
            robustnessWeight: 0.8,
            confidenceAdjustment: true,
            ...medianConfig
        };

        this.hybridConfig = {
            primaryMethod: 'expert_system',
            fallbackMethods: ['weighted_average', 'majority_vote', 'median_aggregation'],
            methodSelectionCriteria: {
                conflictSeverity: 0.3,
                componentCount: 0.2,
                timeConstraint: 0.25,
                consensusLevel: 0.25
            },
            adaptiveThresholds: {
                expertSystemThreshold: 0.8,
                votingThreshold: 0.6,
                aggregationThreshold: 0.4
            },
            ...hybridConfig
        };
    }

    private initializeDataStructures(): void {
        this.resolutionHistory = [];
        this.conflictPatterns = new Map();
        this.resolutionPerformance = new Map();
        this.adaptiveThresholds = new Map();
        
        this.adaptiveThresholds.set('confidence_threshold', 0.7);
        this.adaptiveThresholds.set('consensus_threshold', 0.6);
        this.adaptiveThresholds.set('performance_threshold', 0.75);
    }

    public detectConflicts(decisions: Map<string, any>, context: AIDecisionContext): ConflictDetectionResult {
        const conflicts: ConflictType[] = [];
        let maxSeverity = 0;
        const affectedComponents: string[] = [];
        const conflictDescriptions: string[] = [];

        const decisionArray = Array.from(decisions.entries());

        const actionConflict = this.detectActionConflicts(decisionArray);
        if (actionConflict.severity > 0) {
            conflicts.push(ConflictType.ACTION_DISAGREEMENT);
            maxSeverity = Math.max(maxSeverity, actionConflict.severity);
            affectedComponents.push(...actionConflict.components);
            conflictDescriptions.push(actionConflict.description);
        }

        const confidenceConflict = this.detectConfidenceConflicts(decisionArray);
        if (confidenceConflict.severity > 0) {
            conflicts.push(ConflictType.CONFIDENCE_DIVERGENCE);
            maxSeverity = Math.max(maxSeverity, confidenceConflict.severity);
            affectedComponents.push(...confidenceConflict.components);
            conflictDescriptions.push(confidenceConflict.description);
        }

        const riskConflict = this.detectRiskConflicts(decisionArray);
        if (riskConflict.severity > 0) {
            conflicts.push(ConflictType.RISK_ASSESSMENT_CONFLICT);
            maxSeverity = Math.max(maxSeverity, riskConflict.severity);
            affectedComponents.push(...riskConflict.components);
            conflictDescriptions.push(riskConflict.description);
        }

        const timelineConflict = this.detectTimelineConflicts(decisionArray);
        if (timelineConflict.severity > 0) {
            conflicts.push(ConflictType.TIMELINE_INCONSISTENCY);
            maxSeverity = Math.max(maxSeverity, timelineConflict.severity);
            affectedComponents.push(...timelineConflict.components);
            conflictDescriptions.push(timelineConflict.description);
        }

        const resourceConflict = this.detectResourceConflicts(decisionArray);
        if (resourceConflict.severity > 0) {
            conflicts.push(ConflictType.RESOURCE_CONTENTION);
            maxSeverity = Math.max(maxSeverity, resourceConflict.severity);
            affectedComponents.push(...resourceConflict.components);
            conflictDescriptions.push(resourceConflict.description);
        }

        const strategicConflict = this.detectStrategicConflicts(decisionArray, context);
        if (strategicConflict.severity > 0) {
            conflicts.push(ConflictType.STRATEGIC_OBJECTIVE_MISMATCH);
            maxSeverity = Math.max(maxSeverity, strategicConflict.severity);
            affectedComponents.push(...strategicConflict.components);
            conflictDescriptions.push(strategicConflict.description);
        }

        return {
            hasConflicts: conflicts.length > 0,
            conflictType: conflicts,
            conflictSeverity: maxSeverity,
            affectedComponents: Array.from(new Set(affectedComponents)),
            conflictDescription: conflictDescriptions.join('; '),
            resolutionPriority: this.calculateResolutionPriority(conflicts, maxSeverity)
        };
    }

    private detectActionConflicts(decisions: [string, any][]): { severity: number; components: string[]; description: string } {
        const actions = decisions.map(([component, decision]) => ({
            component,
            action: decision.expectedOutcome?.bestAction || decision.recommendedAction || 'unknown'
        }));

        const uniqueActions = new Set(actions.map(a => a.action));
        if (uniqueActions.size <= 1) {
            return { severity: 0, components: [], description: '' };
        }

        const actionGroups = new Map<string, string[]>();
        actions.forEach(({ component, action }) => {
            if (!actionGroups.has(action)) {
                actionGroups.set(action, []);
            }
            actionGroups.get(action)!.push(component);
        });

        const conflictingComponents = actions.map(a => a.component);
        const severity = Math.min(1.0, (uniqueActions.size - 1) / decisions.length);
        const description = `Action disagreement: ${Array.from(uniqueActions).join(' vs ')}`;

        return { severity, components: conflictingComponents, description };
    }

    private detectConfidenceConflicts(decisions: [string, any][]): { severity: number; components: string[]; description: string } {
        const confidences = decisions.map(([component, decision]) => ({
            component,
            confidence: decision.confidence || 0.5
        }));

        if (confidences.length < 2) {
            return { severity: 0, components: [], description: '' };
        }

        const confidenceValues = confidences.map(c => c.confidence);
        const maxConfidence = Math.max(...confidenceValues);
        const minConfidence = Math.min(...confidenceValues);
        const confidenceRange = maxConfidence - minConfidence;

        if (confidenceRange < 0.3) {
            return { severity: 0, components: [], description: '' };
        }

        const severity = Math.min(1.0, confidenceRange);
        const conflictingComponents = confidences
            .filter(c => Math.abs(c.confidence - maxConfidence) > 0.2)
            .map(c => c.component);

        const description = `Confidence divergence: range ${(confidenceRange * 100).toFixed(1)}%`;

        return { severity, components: conflictingComponents, description };
    }

    private detectRiskConflicts(decisions: [string, any][]): { severity: number; components: string[]; description: string } {
        const riskAssessments = decisions.map(([component, decision]) => ({
            component,
            riskLevel: decision.riskAssessment?.level || decision.expectedOutcome?.riskScore || 'medium',
            riskScore: this.convertRiskLevelToScore(decision.riskAssessment?.level || 'medium')
        }));

        if (riskAssessments.length < 2) {
            return { severity: 0, components: [], description: '' };
        }

        const riskScores = riskAssessments.map(r => r.riskScore);
        const maxRisk = Math.max(...riskScores);
        const minRisk = Math.min(...riskScores);
        const riskRange = maxRisk - minRisk;

        if (riskRange < 1.5) {
            return { severity: 0, components: [], description: '' };
        }

        const severity = Math.min(1.0, riskRange / 3);
        const conflictingComponents = riskAssessments
            .filter(r => Math.abs(r.riskScore - maxRisk) > 1.0)
            .map(r => r.component);

        const description = `Risk assessment conflict: ${riskAssessments.map(r => r.riskLevel).join(' vs ')}`;

        return { severity, components: conflictingComponents, description };
    }

    private detectTimelineConflicts(decisions: [string, any][]): { severity: number; components: string[]; description: string } {
        const timelines = decisions.map(([component, decision]) => ({
            component,
            timeline: decision.executionPlan?.timeline || decision.expectedOutcome?.timeline || 'immediate'
        }));

        const timelineOrder = { immediate: 1, short_term: 2, medium_term: 3, long_term: 4 };
        const timelineScores = timelines.map(t => timelineOrder[t.timeline as keyof typeof timelineOrder] || 1);

        const maxTimeline = Math.max(...timelineScores);
        const minTimeline = Math.min(...timelineScores);
        const timelineRange = maxTimeline - minTimeline;

        if (timelineRange < 2) {
            return { severity: 0, components: [], description: '' };
        }

        const severity = Math.min(1.0, timelineRange / 3);
        const conflictingComponents = timelines.map(t => t.component);
        const description = `Timeline inconsistency: ${timelines.map(t => t.timeline).join(' vs ')}`;

        return { severity, components: conflictingComponents, description };
    }

    private detectResourceConflicts(decisions: [string, any][]): { severity: number; components: string[]; description: string } {
        const resourceRequirements = decisions.map(([component, decision]) => ({
            component,
            computational: decision.executionPlan?.resourceRequirements?.computationalComplexity || 0.1,
            memory: decision.executionPlan?.resourceRequirements?.memoryFootprint || 0.1,
            time: decision.executionPlan?.resourceRequirements?.timeRequired || 1
        }));

        let maxConflictSeverity = 0;
        const conflictingComponents: string[] = [];

        const totalComputational = resourceRequirements.reduce((sum, r) => sum + r.computational, 0);
        const totalMemory = resourceRequirements.reduce((sum, r) => sum + r.memory, 0);
        const maxTime = Math.max(...resourceRequirements.map(r => r.time));

        if (totalComputational > 1.0) {
            maxConflictSeverity = Math.max(maxConflictSeverity, Math.min(1.0, totalComputational - 1.0));
            conflictingComponents.push(...resourceRequirements.map(r => r.component));
        }

        if (totalMemory > 1.0) {
            maxConflictSeverity = Math.max(maxConflictSeverity, Math.min(1.0, totalMemory - 1.0));
            conflictingComponents.push(...resourceRequirements.map(r => r.component));
        }

        if (maxTime > 10) {
            maxConflictSeverity = Math.max(maxConflictSeverity, Math.min(1.0, (maxTime - 10) / 10));
            conflictingComponents.push(...resourceRequirements.map(r => r.component));
        }

        const description = maxConflictSeverity > 0 ? 
            `Resource contention: CPU ${(totalComputational * 100).toFixed(0)}%, Memory ${(totalMemory * 100).toFixed(0)}%` : '';

        return {
            severity: maxConflictSeverity,
            components: Array.from(new Set(conflictingComponents)),
            description
        };
    }

    private detectStrategicConflicts(decisions: [string, any][], context: AIDecisionContext): { severity: number; components: string[]; description: string } {
        const strategicAlignments = decisions.map(([component, decision]) => ({
            component,
            alignment: this.calculateStrategicAlignment(decision, context.strategicObjective)
        }));

        const alignmentScores = strategicAlignments.map(s => s.alignment);
        const maxAlignment = Math.max(...alignmentScores);
        const minAlignment = Math.min(...alignmentScores);
        const alignmentRange = maxAlignment - minAlignment;

        if (alignmentRange < 0.4) {
            return { severity: 0, components: [], description: '' };
        }

        const severity = Math.min(1.0, alignmentRange);
        const conflictingComponents = strategicAlignments
            .filter(s => s.alignment < maxAlignment - 0.2)
            .map(s => s.component);

        const description = `Strategic objective mismatch: alignment range ${(alignmentRange * 100).toFixed(1)}%`;

        return { severity, components: conflictingComponents, description };
    }

    private convertRiskLevelToScore(riskLevel: string): number {
        const riskMap: Record<string, number> = {
            'very_low': 0,
            'low': 1,
            'medium': 2,
            'high': 3,
            'very_high': 4,
            'critical': 5
        };
        return riskMap[riskLevel] || 2;
    }

    private calculateStrategicAlignment(decision: any, strategicObjective: string): number {
        const keywords = strategicObjective.toLowerCase().split(/\s+/);
        const decisionText = JSON.stringify(decision).toLowerCase();
        
        let alignmentScore = 0;
        keywords.forEach(keyword => {
            if (decisionText.includes(keyword)) {
                alignmentScore += 0.2;
            }
        });

        if (decision.expectedOutcome?.strategicValue) {
            alignmentScore += decision.expectedOutcome.strategicValue * 0.3;
        }

        if (decision.reasoning) {
            const reasoningText = Array.isArray(decision.reasoning) ? 
                decision.reasoning.join(' ').toLowerCase() : 
                decision.reasoning.toLowerCase();
            
            keywords.forEach(keyword => {
                if (reasoningText.includes(keyword)) {
                    alignmentScore += 0.1;
                }
            });
        }

        return Math.min(1.0, alignmentScore);
    }

    private calculateResolutionPriority(conflicts: ConflictType[], severity: number): number {
        const priorityWeights: Record<ConflictType, number> = {
            [ConflictType.ACTION_DISAGREEMENT]: 1.0,
            [ConflictType.STRATEGIC_OBJECTIVE_MISMATCH]: 0.9,
            [ConflictType.RISK_ASSESSMENT_CONFLICT]: 0.8,
            [ConflictType.RESOURCE_CONTENTION]: 0.7,
            [ConflictType.TIMELINE_INCONSISTENCY]: 0.6,
            [ConflictType.CONFIDENCE_DIVERGENCE]: 0.5,
            [ConflictType.PREDICTION_VARIANCE]: 0.4,
            [ConflictType.EXECUTION_PLAN_CONFLICT]: 0.3
        };

        const maxWeight = Math.max(...conflicts.map(c => priorityWeights[c] || 0));
        return maxWeight * severity;
    }

    public resolveConflicts(
        decisions: Map<string, any>,
        context: AIDecisionContext,
        conflictDetection: ConflictDetectionResult,
        strategy: ConflictResolutionStrategy
    ): ConflictResolutionResult {
        const startTime = Date.now();
        const resolutionMethod = this.selectResolutionMethod(conflictDetection, strategy, context);
        
        let resolvedDecision: UnifiedAIDecision;
        let resolutionConfidence: number;
        const alternativeResolutions: UnifiedAIDecision[] = [];

        try {
            switch (resolutionMethod) {
                case 'expert_system':
                    ({ resolvedDecision, resolutionConfidence } = this.expertSystemResolution(decisions, context));
                    break;
                case 'weighted_average':
                    ({ resolvedDecision, resolutionConfidence } = this.weightedAverageResolution(decisions, context, strategy));
                    break;
                case 'majority_vote':
                    ({ resolvedDecision, resolutionConfidence } = this.majorityVoteResolution(decisions, context));
                    break;
                case 'median_aggregation':
                    ({ resolvedDecision, resolutionConfidence } = this.medianAggregationResolution(decisions, context));
                    break;
                case 'highest_confidence':
                    ({ resolvedDecision, resolutionConfidence } = this.highestConfidenceResolution(decisions, context));
                    break;
                case 'consensus_building':
                    ({ resolvedDecision, resolutionConfidence } = this.consensusBuildingResolution(decisions, context));
                    break;
                default:
                    ({ resolvedDecision, resolutionConfidence } = this.hybridResolution(decisions, context, conflictDetection));
            }

            this.generateAlternativeResolutions(decisions, context, resolutionMethod, alternativeResolutions);

        } catch (error) {
            console.error('Conflict resolution failed:', error);
            resolvedDecision = this.getFallbackDecision(context);
            resolutionConfidence = 0.3;
        }

        const resolutionTime = Date.now() - startTime;
        const result: ConflictResolutionResult = {
            resolvedDecision,
            resolutionMethod,
            resolutionConfidence,
            conflictsResolved: conflictDetection.conflictType.length,
            resolutionTime,
            alternativeResolutions
        };

        this.updateResolutionHistory(result, conflictDetection);
        return result;
    }

    private selectResolutionMethod(
        conflictDetection: ConflictDetectionResult,
        strategy: ConflictResolutionStrategy,
        context: AIDecisionContext
    ): string {
        if (strategy.resolutionMethod !== 'expert_system') {
            return strategy.resolutionMethod;
        }

        const methodScores = new Map<string, number>();

        methodScores.set('expert_system', this.calculateExpertSystemScore(conflictDetection, context));
        methodScores.set('weighted_average', this.calculateWeightedAverageScore(conflictDetection, context));
        methodScores.set('majority_vote', this.calculateMajorityVoteScore(conflictDetection, context));
        methodScores.set('median_aggregation', this.calculateMedianAggregationScore(conflictDetection, context));
        methodScores.set('highest_confidence', this.calculateHighestConfidenceScore(conflictDetection, context));
        methodScores.set('consensus_building', this.calculateConsensusBuildingScore(conflictDetection, context));

        const bestMethod = Array.from(methodScores.entries()).reduce((best, current) => 
            current[1] > best[1] ? current : best
        );

        return bestMethod[0];
    }

    private calculateExpertSystemScore(conflictDetection: ConflictDetectionResult, context: AIDecisionContext): number {
        let score = 0.7;
        
        if (conflictDetection.conflictSeverity > 0.7) score += 0.2;
        if (context.strategicObjective.includes('strategic')) score += 0.1;
        if (this.hasApplicableExpertRule(conflictDetection, context)) score += 0.15;
        
        return Math.min(1.0, score);
    }

    private calculateWeightedAverageScore(conflictDetection: ConflictDetectionResult, context: AIDecisionContext): number {
        let score = 0.6;
        
        if (conflictDetection.conflictSeverity < 0.5) score += 0.2;
        if (conflictDetection.affectedComponents.length > 2) score += 0.1;
        if (context.timeConstraint > 2000) score += 0.1;
        
        return Math.min(1.0, score);
    }

    private calculateMajorityVoteScore(conflictDetection: ConflictDetectionResult, context: AIDecisionContext): number {
        let score = 0.5;
        
        if (conflictDetection.affectedComponents.length >= 3) score += 0.2;
        if (conflictDetection.conflictType.includes(ConflictType.ACTION_DISAGREEMENT)) score += 0.15;
        if (context.riskTolerance > 0.5) score += 0.1;
        
        return Math.min(1.0, score);
    }

    private calculateMedianAggregationScore(conflictDetection: ConflictDetectionResult, context: AIDecisionContext): number {
        let score = 0.4;
        
        if (conflictDetection.conflictType.includes(ConflictType.CONFIDENCE_DIVERGENCE)) score += 0.2;
        if (conflictDetection.affectedComponents.length > 3) score += 0.15;
        if (context.riskTolerance < 0.3) score += 0.1;
        
        return Math.min(1.0, score);
    }

    private calculateHighestConfidenceScore(conflictDetection: ConflictDetectionResult, context: AIDecisionContext): number {
        let score = 0.5;
        
        if (context.timeConstraint < 1000) score += 0.3;
        if (conflictDetection.conflictSeverity > 0.8) score += 0.15;
        
        return Math.min(1.0, score);
    }

    private calculateConsensusBuildingScore(conflictDetection: ConflictDetectionResult, context: AIDecisionContext): number {
        let score = 0.3;
        
        if (context.strategicObjective.includes('collaborative')) score += 0.25;
        if (conflictDetection.conflictSeverity < 0.4) score += 0.2;
        if (context.timeConstraint > 5000) score += 0.15;
        
        return Math.min(1.0, score);
    }

    private hasApplicableExpertRule(conflictDetection: ConflictDetectionResult, context: AIDecisionContext): boolean {
        return this.expertRules.some(rule => {
            const dummyDecisions = new Map();
            return rule.condition(dummyDecisions, context);
        });
    }

    private expertSystemResolution(decisions: Map<string, any>, context: AIDecisionContext): { resolvedDecision: UnifiedAIDecision; resolutionConfidence: number } {
        const applicableRules = this.expertRules
            .filter(rule => rule.condition(decisions, context))
            .sort((a, b) => b.priority - a.priority);

        if (applicableRules.length === 0) {
            return this.weightedAverageResolution(decisions, context, { resolutionMethod: 'weighted_average' } as ConflictResolutionStrategy);
        }

        const selectedRule = applicableRules[0];
        const resolvedDecision = selectedRule.resolution(decisions, context);
        resolvedDecision.reasoning.push(`Applied expert rule: ${selectedRule.name}`);
        
        return {
            resolvedDecision,
            resolutionConfidence: selectedRule.confidence
        };
    }

    private weightedAverageResolution(
        decisions: Map<string, any>, 
        context: AIDecisionContext, 
        strategy: ConflictResolutionStrategy
    ): { resolvedDecision: UnifiedAIDecision; resolutionConfidence: number } {
        const decisionArray = Array.from(decisions.entries());
        const weights = this.calculateDecisionWeights(decisionArray, strategy);
        
        let weightedConfidence = 0;
        let totalWeight = 0;
        const allReasoning: string[] = [];
        const allAlternatives: string[] = [];
        const componentContributions: Record<string, number> = {};

        decisionArray.forEach(([componentId, decision], index) => {
            const weight = weights[index];
            componentContributions[componentId] = weight;
            totalWeight += weight;
            weightedConfidence += decision.confidence * weight;
            allReasoning.push(...(decision.reasoning || []));
            if (decision.alternativeOptions) {
                allAlternatives.push(...decision.alternativeOptions);
            }
        });

        const normalizedConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;
        const primaryDecision = decisionArray[weights.indexOf(Math.max(...weights))];

        const resolvedDecision: UnifiedAIDecision = {
            recommendedAction: primaryDecision[1].expectedOutcome?.bestAction || primaryDecision[1].recommendedAction || 'hold',
            confidence: normalizedConfidence,
            reasoning: Array.from(new Set(allReasoning)),
            alternativeOptions: Array.from(new Set(allAlternatives)),
            expectedOutcome: this.mergeExpectedOutcomes(decisionArray, weights),
            riskAssessment: this.mergeRiskAssessments(decisionArray, weights),
            executionPlan: this.mergeExecutionPlans(decisionArray, weights),
            componentContributions,
            decisionMetadata: {
                resolutionMethod: 'weighted_average',
                totalComponents: decisionArray.length,
                timestamp: Date.now()
            }
        };

        return {
            resolvedDecision,
            resolutionConfidence: Math.min(0.95, normalizedConfidence + 0.1)
        };
    }

    private calculateDecisionWeights(decisions: [string, any][], strategy: ConflictResolutionStrategy): number[] {
        const weights: number[] = [];
        
        decisions.forEach(([componentId, decision]) => {
            let weight = 0.2;
            
            weight += decision.confidence * 0.3;
            
            const performanceScore = this.resolutionPerformance.get(componentId) || 0.5;
            weight += performanceScore * 0.3;
            
            if (decision.expectedOutcome?.strategicValue) {
                weight += decision.expectedOutcome.strategicValue * 0.2;
            }
            
            weights.push(weight);
        });

        const total = weights.reduce((sum, w) => sum + w, 0);
        return total > 0 ? weights.map(w => w / total) : weights.map(() => 1 / weights.length);
    }

    private majorityVoteResolution(decisions: Map<string, any>, context: AIDecisionContext): { resolvedDecision: UnifiedAIDecision; resolutionConfidence: number } {
        const decisionArray = Array.from(decisions.entries());
        const actionVotes = new Map<string, { count: number; components: string[]; decisions: any[] }>();

        decisionArray.forEach(([componentId, decision]) => {
            const action = decision.expectedOutcome?.bestAction || decision.recommendedAction || 'hold';
            if (!actionVotes.has(action)) {
                actionVotes.set(action, { count: 0, components: [], decisions: [] });
            }
            const voteInfo = actionVotes.get(action)!;
            voteInfo.count++;
            voteInfo.components.push(componentId);
            voteInfo.decisions.push(decision);
        });

        const sortedVotes = Array.from(actionVotes.entries()).sort((a, b) => b[1].count - a[1].count);
        const winningVote = sortedVotes[0];
        
        const consensusLevel = winningVote[1].count / decisionArray.length;
        const supportingDecisions = winningVote[1].decisions;
        
        const avgConfidence = supportingDecisions.reduce((sum, d) => sum + d.confidence, 0) / supportingDecisions.length;
        const componentContributions: Record<string, number> = {};
        winningVote[1].components.forEach(component => {
            componentContributions[component] = 1 / winningVote[1].components.length;
        });

        const resolvedDecision: UnifiedAIDecision = {
            recommendedAction: winningVote[0],
            confidence: avgConfidence * consensusLevel,
            reasoning: [`Majority vote result: ${winningVote[1].count}/${decisionArray.length} components agree`],
            alternativeOptions: sortedVotes.slice(1).map(([action]) => action),
            expectedOutcome: this.mergeExpectedOutcomes(winningVote[1].decisions.map((d, i) => [winningVote[1].components[i], d]), 
                                                        new Array(winningVote[1].decisions.length).fill(1 / winningVote[1].decisions.length)),
            riskAssessment: { level: 'medium', factors: ['majority_consensus'] },
            executionPlan: { steps: [{ action: winningVote[0], priority: 1 }], timeline: 'immediate' },
            componentContributions,
            decisionMetadata: {
                resolutionMethod: 'majority_vote',
                consensusLevel,
                timestamp: Date.now()
            }
        };

        return {
            resolvedDecision,
            resolutionConfidence: Math.min(0.9, consensusLevel + 0.2)
        };
    }

    private medianAggregationResolution(decisions: Map<string, any>, context: AIDecisionContext): { resolvedDecision: UnifiedAIDecision; resolutionConfidence: number } {
        const decisionArray = Array.from(decisions.entries());
        
        const confidences = decisionArray.map(([_, d]) => d.confidence || 0.5);
        const medianConfidence = this.calculateMedian(confidences);
        
        const riskScores = decisionArray.map(([_, d]) => this.convertRiskLevelToScore(d.riskAssessment?.level || 'medium'));
        const medianRiskScore = this.calculateMedian(riskScores);
        const medianRiskLevel = this.convertRiskScoreToLevel(medianRiskScore);
        
        const actionFrequency = new Map<string, number>();
        decisionArray.forEach(([_, decision]) => {
            const action = decision.expectedOutcome?.bestAction || decision.recommendedAction || 'hold';
            actionFrequency.set(action, (actionFrequency.get(action) || 0) + 1);
        });
        
        const medianAction = Array.from(actionFrequency.entries())
            .sort((a, b) => b[1] - a[1])[0][0];

        const componentContributions: Record<string, number> = {};
        decisionArray.forEach(([componentId]) => {
            componentContributions[componentId] = 1 / decisionArray.length;
        });

        const resolvedDecision: UnifiedAIDecision = {
            recommendedAction: medianAction,
            confidence: medianConfidence,
            reasoning: ['Median aggregation of component decisions'],
            alternativeOptions: Array.from(actionFrequency.keys()).filter(a => a !== medianAction),
            expectedOutcome: { medianValues: true, consensusLevel: 0.7 },
            riskAssessment: { level: medianRiskLevel, factors: ['median_assessment'] },
            executionPlan: { steps: [{ action: medianAction, priority: 1 }], timeline: 'immediate' },
            componentContributions,
            decisionMetadata: {
                resolutionMethod: 'median_aggregation',
                robustness: 'high',
                timestamp: Date.now()
            }
        };

        return {
            resolvedDecision,
            resolutionConfidence: Math.min(0.85, medianConfidence + 0.15)
        };
    }

    private calculateMedian(values: number[]): number {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }

    private convertRiskScoreToLevel(score: number): string {
        if (score <= 0.5) return 'very_low';
        if (score <= 1.5) return 'low';
        if (score <= 2.5) return 'medium';
        if (score <= 3.5) return 'high';
        if (score <= 4.5) return 'very_high';
        return 'critical';
    }

    private highestConfidenceResolution(decisions: Map<string, any>, context: AIDecisionContext): { resolvedDecision: UnifiedAIDecision; resolutionConfidence: number } {
        const decisionArray = Array.from(decisions.entries());
        const highestConfidenceDecision = decisionArray.reduce((best, current) => {
            return current[1].confidence > best[1].confidence ? current : best;
        });

        const resolvedDecision = this.convertToUnifiedDecision(highestConfidenceDecision[1], 'highest_confidence');
        
        return {
            resolvedDecision,
            resolutionConfidence: highestConfidenceDecision[1].confidence
        };
    }

    private consensusBuildingResolution(decisions: Map<string, any>, context: AIDecisionContext): { resolvedDecision: UnifiedAIDecision; resolutionConfidence: number } {
        const decisionArray = Array.from(decisions.entries());
        const iterations = 3;
        let currentDecisions = [...decisionArray];
        
        for (let i = 0; i < iterations; i++) {
            const consensus = this.findConsensusAction(currentDecisions);
            if (consensus.level > this.votingConfig.minimumConsensus) {
                const consensusDecisions = currentDecisions.filter(([_, d]) => {
                    const action = d.expectedOutcome?.bestAction || d.recommendedAction || 'hold';
                    return action === consensus.action;
                });
                
                return this.weightedAverageResolution(new Map(consensusDecisions), context, 
                    { resolutionMethod: 'weighted_average' } as ConflictResolutionStrategy);
            }
            
            currentDecisions = this.adjustDecisionsForConsensus(currentDecisions);
        }

        return this.majorityVoteResolution(new Map(currentDecisions), context);
    }

    private findConsensusAction(decisions: [string, any][]): { action: string; level: number } {
        const actionCounts = new Map<string, number>();
        
        decisions.forEach(([_, decision]) => {
            const action = decision.expectedOutcome?.bestAction || decision.recommendedAction || 'hold';
            actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
        });

        const maxCount = Math.max(...actionCounts.values());
        const consensusAction = Array.from(actionCounts.entries())
            .find(([_, count]) => count === maxCount)![0];
        
        return {
            action: consensusAction,
            level: maxCount / decisions.length
        };
    }

    private adjustDecisionsForConsensus(decisions: [string, any][]): [string, any][] {
        const consensusAction = this.findConsensusAction(decisions).action;
        
        return decisions.map(([componentId, decision]) => {
            const adjustedDecision = { ...decision };
            const currentAction = decision.expectedOutcome?.bestAction || decision.recommendedAction || 'hold';
            
            if (currentAction !== consensusAction) {
                if (adjustedDecision.alternativeOptions && adjustedDecision.alternativeOptions.includes(consensusAction)) {
                    adjustedDecision.recommendedAction = consensusAction;
                    adjustedDecision.confidence = Math.max(0.4, adjustedDecision.confidence * 0.8);
                }
            }
            
            return [componentId, adjustedDecision];
        });
    }

    private hybridResolution(decisions: Map<string, any>, context: AIDecisionContext, conflictDetection: ConflictDetectionResult): { resolvedDecision: UnifiedAIDecision; resolutionConfidence: number } {
        const methods = [this.hybridConfig.primaryMethod, ...this.hybridConfig.fallbackMethods];
        
        for (const method of methods) {
            try {
                const result = this.applyResolutionMethod(method, decisions, context);
                if (result.resolutionConfidence >= this.hybridConfig.adaptiveThresholds[method + 'Threshold'] || 0.5) {
                    return result;
                }
            } catch (error) {
                console.warn(`Resolution method ${method} failed:`, error);
                continue;
            }
        }

        return this.weightedAverageResolution(decisions, context, { resolutionMethod: 'weighted_average' } as ConflictResolutionStrategy);
    }

    private applyResolutionMethod(method: string, decisions: Map<string, any>, context: AIDecisionContext): { resolvedDecision: UnifiedAIDecision; resolutionConfidence: number } {
        switch (method) {
            case 'expert_system':
                return this.expertSystemResolution(decisions, context);
            case 'weighted_average':
                return this.weightedAverageResolution(decisions, context, { resolutionMethod: 'weighted_average' } as ConflictResolutionStrategy);
            case 'majority_vote':
                return this.majorityVoteResolution(decisions, context);
            case 'median_aggregation':
                return this.medianAggregationResolution(decisions, context);
            case 'highest_confidence':
                return this.highestConfidenceResolution(decisions, context);
            case 'consensus_building':
                return this.consensusBuildingResolution(decisions, context);
            default:
                throw new Error(`Unknown resolution method: ${method}`);
        }
    }

    private generateAlternativeResolutions(
        decisions: Map<string, any>,
        context: AIDecisionContext,
        usedMethod: string,
        alternatives: UnifiedAIDecision[]
    ): void {
        const methods = ['expert_system', 'weighted_average', 'majority_vote', 'median_aggregation', 'highest_confidence'];
        const unusedMethods = methods.filter(m => m !== usedMethod);
        
        for (const method of unusedMethods.slice(0, 2)) {
            try {
                const result = this.applyResolutionMethod(method, decisions, context);
                alternatives.push(result.resolvedDecision);
            } catch (error) {
                continue;
            }
        }
    }

    private convertToUnifiedDecision(decision: any, resolutionMethod: string): UnifiedAIDecision {
        return {
            recommendedAction: decision.expectedOutcome?.bestAction || decision.recommendedAction || 'hold',
            confidence: decision.confidence || 0.5,
            reasoning: decision.reasoning || [resolutionMethod],
            alternativeOptions: decision.alternativeOptions || [],
            expectedOutcome: decision.expectedOutcome || {},
            riskAssessment: decision.riskAssessment || { level: 'medium', factors: [] },
            executionPlan: decision.executionPlan || { steps: [], timeline: 'immediate' },
            componentContributions: { [decision.type || 'unknown']: 1.0 },
            decisionMetadata: {
                resolutionMethod,
                singleComponent: true,
                timestamp: Date.now()
            }
        };
    }

    private mergeExpectedOutcomes(decisions: [string, any][], weights: number[]): any {
        const weightedOutcomes = decisions.map(([_, decision], index) => ({
            outcome: decision.expectedOutcome || {},
            weight: weights[index]
        }));

        const mergedOutcome: any = {};
        const numericFields = ['strategicValue', 'riskScore', 'expectedValue', 'probability'];
        
        numericFields.forEach(field => {
            const values = weightedOutcomes
                .map(wo => wo.outcome[field])
                .filter(v => typeof v === 'number');
            
            if (values.length > 0) {
                const weightedSum = weightedOutcomes.reduce((sum, wo, index) => {
                    const value = wo.outcome[field];
                    return typeof value === 'number' ? sum + value * wo.weight : sum;
                }, 0);
                mergedOutcome[field] = weightedSum;
            }
        });

        return mergedOutcome;
    }

    private mergeRiskAssessments(decisions: [string, any][], weights: number[]): any {
        const riskAssessments = decisions.map(([_, decision], index) => ({
            risk: decision.riskAssessment || { level: 'medium', factors: [] },
            weight: weights[index]
        }));

        const riskScores = riskAssessments.map(ra => this.convertRiskLevelToScore(ra.risk.level || 'medium'));
        const weightedRiskScore = riskScores.reduce((sum, score, index) => sum + score * weights[index], 0);
        const mergedRiskLevel = this.convertRiskScoreToLevel(weightedRiskScore);

        const allFactors = riskAssessments.flatMap(ra => ra.risk.factors || []);
        const uniqueFactors = Array.from(new Set(allFactors));

        return {
            level: mergedRiskLevel,
            factors: uniqueFactors,
            weightedScore: weightedRiskScore
        };
    }

    private mergeExecutionPlans(decisions: [string, any][], weights: number[]): any {
        const plans = decisions.map(([_, decision], index) => ({
            plan: decision.executionPlan || { steps: [], timeline: 'immediate' },
            weight: weights[index]
        }));

        const allSteps = plans.flatMap(p => p.plan.steps || []);
        const prioritizedSteps = allSteps
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
            .slice(0, 5);

        const timelineWeights = { immediate: 1, short_term: 2, medium_term: 3, long_term: 4 };
        const weightedTimelineScore = plans.reduce((sum, p, index) => {
            const timeline = p.plan.timeline || 'immediate';
            const score = timelineWeights[timeline as keyof typeof timelineWeights] || 1;
            return sum + score * weights[index];
        }, 0);

        const avgTimelineScore = weightedTimelineScore / plans.length;
        let mergedTimeline = 'immediate';
        if (avgTimelineScore > 3.5) mergedTimeline = 'long_term';
        else if (avgTimelineScore > 2.5) mergedTimeline = 'medium_term';
        else if (avgTimelineScore > 1.5) mergedTimeline = 'short_term';

        return {
            steps: prioritizedSteps,
            timeline: mergedTimeline,
            confidence: plans.reduce((sum, p, index) => sum + (p.plan.confidence || 0.5) * weights[index], 0)
        };
    }

    private calculateConsensusLevel(decisions: Map<string, any>): number {
        const decisionArray = Array.from(decisions.entries());
        if (decisionArray.length <= 1) return 1.0;

        const actions = decisionArray.map(([_, decision]) => 
            decision.expectedOutcome?.bestAction || decision.recommendedAction || 'hold'
        );

        const actionCounts = new Map<string, number>();
        actions.forEach(action => {
            actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
        });

        const maxCount = Math.max(...actionCounts.values());
        return maxCount / actions.length;
    }

    private findHighestConsensusDecision(decisions: Map<string, any>): UnifiedAIDecision {
        const consensusInfo = this.findConsensusAction(Array.from(decisions.entries()));
        const consensusDecisions = Array.from(decisions.entries()).filter(([_, decision]) => {
            const action = decision.expectedOutcome?.bestAction || decision.recommendedAction || 'hold';
            return action === consensusInfo.action;
        });

        if (consensusDecisions.length === 0) {
            return this.getFallbackDecision({} as AIDecisionContext);
        }

        const bestConsensusDecision = consensusDecisions.reduce((best, current) => {
            return current[1].confidence > best[1].confidence ? current : best;
        });

        const resolvedDecision = this.convertToUnifiedDecision(bestConsensusDecision[1], 'highest_consensus');
        resolvedDecision.reasoning.push(`Consensus level: ${(consensusInfo.level * 100).toFixed(1)}%`);
        
        return resolvedDecision;
    }

    private findFastestComponent(decisions: Map<string, any>): string {
        const responseTimeEstimates: Record<string, number> = {
            strategyNetwork: 100,
            predictiveAI: 200,
            planningAlgorithm: 300,
            behaviorTree: 50,
            reinforcementLearning: 150
        };

        let fastestComponent = Array.from(decisions.keys())[0];
        let fastestTime = responseTimeEstimates[fastestComponent] || 1000;

        for (const componentId of decisions.keys()) {
            const estimatedTime = responseTimeEstimates[componentId] || 1000;
            if (estimatedTime < fastestTime) {
                fastestTime = estimatedTime;
                fastestComponent = componentId;
            }
        }

        return fastestComponent;
    }

    private findMostConservativeDecision(decisions: Map<string, any>): any {
        const decisionArray = Array.from(decisions.entries());
        
        return decisionArray.reduce((mostConservative, current) => {
            const currentRiskScore = this.convertRiskLevelToScore(current[1].riskAssessment?.level || 'medium');
            const conservativeRiskScore = this.convertRiskLevelToScore(mostConservative[1].riskAssessment?.level || 'medium');
            
            return currentRiskScore < conservativeRiskScore ? current : mostConservative;
        })[1];
    }

    private findBestPerformingComponent(decisions: Map<string, any>): string {
        let bestComponent = Array.from(decisions.keys())[0];
        let bestPerformance = this.resolutionPerformance.get(bestComponent) || 0;

        for (const componentId of decisions.keys()) {
            const performance = this.resolutionPerformance.get(componentId) || 0;
            if (performance > bestPerformance) {
                bestPerformance = performance;
                bestComponent = componentId;
            }
        }

        return bestComponent;
    }

    private getFallbackDecision(context: AIDecisionContext): UnifiedAIDecision {
        return {
            recommendedAction: 'hold',
            confidence: 0.3,
            reasoning: ['Fallback decision due to conflict resolution failure'],
            alternativeOptions: ['wait', 'reassess'],
            expectedOutcome: { action: 'hold', risk: 'low' },
            riskAssessment: { level: 'low', factors: ['conservative_fallback'] },
            executionPlan: { steps: [{ action: 'hold', priority: 1 }], timeline: 'immediate' },
            componentContributions: { fallback: 1.0 },
            decisionMetadata: { fallback: true, timestamp: Date.now() }
        };
    }

    private updateResolutionHistory(result: ConflictResolutionResult, conflictDetection: ConflictDetectionResult): void {
        this.resolutionHistory.push(result);
        
        if (this.resolutionHistory.length > 100) {
            this.resolutionHistory.shift();
        }

        const conflictPattern = conflictDetection.conflictType.sort().join('_');
        this.conflictPatterns.set(conflictPattern, (this.conflictPatterns.get(conflictPattern) || 0) + 1);

        const performanceUpdate = result.resolutionConfidence > 0.7 ? 0.1 : -0.05;
        Object.keys(result.resolvedDecision.componentContributions).forEach(componentId => {
            const currentPerformance = this.resolutionPerformance.get(componentId) || 0.5;
            this.resolutionPerformance.set(componentId, Math.max(0, Math.min(1, currentPerformance + performanceUpdate)));
        });
    }

    public getResolutionStatistics(): any {
        const totalResolutions = this.resolutionHistory.length;
        if (totalResolutions === 0) return {};

        const methodCounts = new Map<string, number>();
        const avgResolutionTime = this.resolutionHistory.reduce((sum, r) => sum + r.resolutionTime, 0) / totalResolutions;
        const avgConfidence = this.resolutionHistory.reduce((sum, r) => sum + r.resolutionConfidence, 0) / totalResolutions;

        this.resolutionHistory.forEach(result => {
            methodCounts.set(result.resolutionMethod, (methodCounts.get(result.resolutionMethod) || 0) + 1);
        });

        return {
            totalResolutions,
            avgResolutionTime,
            avgConfidence,
            methodDistribution: Object.fromEntries(methodCounts),
            conflictPatterns: Object.fromEntries(this.conflictPatterns),
            componentPerformance: Object.fromEntries(this.resolutionPerformance)
        };
    }
}