import { DeepStrategyEvaluationNetwork, NetworkArchitecture, TrainingConfig } from '../strategy/DeepStrategyNetwork';
import { AdvancedStrategyOptimizer, OptimizationConfig } from '../strategy/StrategyOptimizer';
import { AdaptiveLearningScheduler, SchedulerConfig } from '../strategy/AdaptiveLearningScheduler';
import { StrategyGameIntegration, IntegrationConfig } from '../strategy/StrategyGameIntegration';
import { StrategyPerformanceEvaluator, BenchmarkConfig } from '../strategy/StrategyPerformanceEvaluator';
import { PredictiveAI, PredictionConfig, PredictionType, PlanningStrategy } from '../prediction/PredictiveAI';
import { GameStatePredictionEngine, PredictionModelType } from '../prediction/GameStatePredictionEngine';
import { StrategicPlanningAlgorithm, PlanningAlgorithm } from '../prediction/StrategicPlanningAlgorithm';
import { GameEngine } from '../../game/engine/GameEngine';
import { Player } from '../../game/models/Player';

export interface AIComponentWeights {
    strategyNetwork: number;
    predictiveAI: number;
    planningAlgorithm: number;
    behaviorTree: number;
    reinforcementLearning: number;
}

export interface AIPerformanceMetrics {
    decisionAccuracy: number;
    responseTime: number;
    strategyEffectiveness: number;
    predictionAccuracy: number;
    learningRate: number;
    adaptability: number;
    consistency: number;
    resourceEfficiency: number;
}

export interface AIComponentStatus {
    componentId: string;
    isActive: boolean;
    performance: number;
    lastUpdateTime: number;
    errorCount: number;
    successCount: number;
}

export interface ConflictResolutionStrategy {
    priorityOrder: string[];
    conflictThreshold: number;
    resolutionMethod: 'weighted_average' | 'highest_confidence' | 'majority_vote' | 'expert_system';
    fallbackStrategy: string;
}

export interface AdaptiveConfig {
    performanceThreshold: number;
    switchingCooldown: number;
    learningRate: number;
    explorationRate: number;
    confidenceThreshold: number;
}

export interface AIDecisionContext {
    playerId: string;
    gameState: any;
    timeConstraint: number;
    riskTolerance: number;
    strategicObjective: string;
    historicalPerformance: AIPerformanceMetrics[];
}

export interface UnifiedAIDecision {
    recommendedAction: string;
    confidence: number;
    reasoning: string[];
    alternativeOptions: string[];
    expectedOutcome: any;
    riskAssessment: any;
    executionPlan: any;
    componentContributions: Record<string, number>;
    decisionMetadata: any;
}

export interface OptimizationResult {
    optimizedWeights: AIComponentWeights;
    performanceImprovement: number;
    recommendedAdjustments: string[];
    newConfiguration: any;
    estimatedBenefit: number;
}

export class MasterAICoordinator {
    private strategyNetwork: DeepStrategyEvaluationNetwork;
    private strategyOptimizer: AdvancedStrategyOptimizer;
    private learningScheduler: AdaptiveLearningScheduler;
    private strategyIntegration: StrategyGameIntegration;
    private performanceEvaluator: StrategyPerformanceEvaluator;
    private predictiveAI: PredictiveAI;
    private predictionEngine: GameStatePredictionEngine;
    private planningAlgorithm: StrategicPlanningAlgorithm;
    
    private componentWeights: AIComponentWeights;
    private componentStatuses: Map<string, AIComponentStatus>;
    private conflictResolution: ConflictResolutionStrategy;
    private adaptiveConfig: AdaptiveConfig;
    private performanceHistory: AIPerformanceMetrics[];
    private decisionCache: Map<string, UnifiedAIDecision>;
    private optimizationMetrics: Map<string, number>;
    
    private gameEngine: GameEngine;
    private isOptimizing: boolean;
    private lastOptimizationTime: number;

    constructor(
        networkArchitecture: NetworkArchitecture,
        trainingConfig: TrainingConfig,
        optimizationConfig: OptimizationConfig,
        schedulerConfig: SchedulerConfig,
        integrationConfig: IntegrationConfig,
        benchmarkConfig: BenchmarkConfig,
        predictionConfig: PredictionConfig,
        gameEngine: GameEngine
    ) {
        this.initializeComponents(
            networkArchitecture, trainingConfig, optimizationConfig,
            schedulerConfig, integrationConfig, benchmarkConfig,
            predictionConfig, gameEngine
        );
        
        this.initializeDefaultConfiguration();
        this.initializeMonitoringSystem();
    }

    private initializeComponents(
        networkArchitecture: NetworkArchitecture,
        trainingConfig: TrainingConfig,
        optimizationConfig: OptimizationConfig,
        schedulerConfig: SchedulerConfig,
        integrationConfig: IntegrationConfig,
        benchmarkConfig: BenchmarkConfig,
        predictionConfig: PredictionConfig,
        gameEngine: GameEngine
    ): void {
        this.strategyNetwork = new DeepStrategyEvaluationNetwork(networkArchitecture, trainingConfig);
        this.strategyOptimizer = new AdvancedStrategyOptimizer(optimizationConfig);
        this.learningScheduler = new AdaptiveLearningScheduler(schedulerConfig);
        this.strategyIntegration = new StrategyGameIntegration(integrationConfig, gameEngine);
        this.performanceEvaluator = new StrategyPerformanceEvaluator(benchmarkConfig);
        this.predictiveAI = new PredictiveAI(predictionConfig);
        this.predictionEngine = new GameStatePredictionEngine();
        this.planningAlgorithm = new StrategicPlanningAlgorithm();
        
        this.gameEngine = gameEngine;
    }

    private initializeDefaultConfiguration(): void {
        this.componentWeights = {
            strategyNetwork: 0.3,
            predictiveAI: 0.25,
            planningAlgorithm: 0.2,
            behaviorTree: 0.15,
            reinforcementLearning: 0.1
        };

        this.conflictResolution = {
            priorityOrder: ['strategyNetwork', 'predictiveAI', 'planningAlgorithm', 'behaviorTree', 'reinforcementLearning'],
            conflictThreshold: 0.3,
            resolutionMethod: 'weighted_average',
            fallbackStrategy: 'strategyNetwork'
        };

        this.adaptiveConfig = {
            performanceThreshold: 0.7,
            switchingCooldown: 5000,
            learningRate: 0.01,
            explorationRate: 0.1,
            confidenceThreshold: 0.8
        };

        this.componentStatuses = new Map();
        this.performanceHistory = [];
        this.decisionCache = new Map();
        this.optimizationMetrics = new Map();
        this.isOptimizing = false;
        this.lastOptimizationTime = 0;
    }

    private initializeMonitoringSystem(): void {
        const components = ['strategyNetwork', 'predictiveAI', 'planningAlgorithm', 'behaviorTree', 'reinforcementLearning'];
        
        components.forEach(componentId => {
            this.componentStatuses.set(componentId, {
                componentId,
                isActive: true,
                performance: 0.5,
                lastUpdateTime: Date.now(),
                errorCount: 0,
                successCount: 0
            });
        });
    }

    public async makeUnifiedDecision(context: AIDecisionContext): Promise<UnifiedAIDecision> {
        const cacheKey = this.generateCacheKey(context);
        const cachedDecision = this.decisionCache.get(cacheKey);
        
        if (cachedDecision && this.isCacheValid(cachedDecision)) {
            return cachedDecision;
        }

        const startTime = Date.now();
        
        try {
            const componentDecisions = await this.gatherComponentDecisions(context);
            const resolvedDecision = this.resolveConflicts(componentDecisions, context);
            const optimizedDecision = await this.optimizeDecision(resolvedDecision, context);
            
            const responseTime = Date.now() - startTime;
            this.updatePerformanceMetrics(optimizedDecision, responseTime);
            
            this.decisionCache.set(cacheKey, optimizedDecision);
            
            if (this.shouldTriggerOptimization()) {
                this.triggerSystemOptimization();
            }
            
            return optimizedDecision;
            
        } catch (error) {
            console.error('Error in unified decision making:', error);
            return this.getFallbackDecision(context);
        }
    }

    private async gatherComponentDecisions(context: AIDecisionContext): Promise<Map<string, any>> {
        const decisions = new Map();
        const promises: Promise<void>[] = [];

        if (this.isComponentActive('strategyNetwork')) {
            promises.push(this.getStrategyNetworkDecision(context).then(decision => {
                decisions.set('strategyNetwork', decision);
            }).catch(error => {
                this.handleComponentError('strategyNetwork', error);
            }));
        }

        if (this.isComponentActive('predictiveAI')) {
            promises.push(this.getPredictiveAIDecision(context).then(decision => {
                decisions.set('predictiveAI', decision);
            }).catch(error => {
                this.handleComponentError('predictiveAI', error);
            }));
        }

        if (this.isComponentActive('planningAlgorithm')) {
            promises.push(this.getPlanningAlgorithmDecision(context).then(decision => {
                decisions.set('planningAlgorithm', decision);
            }).catch(error => {
                this.handleComponentError('planningAlgorithm', error);
            }));
        }

        await Promise.all(promises);
        return decisions;
    }

    private async getStrategyNetworkDecision(context: AIDecisionContext): Promise<any> {
        const strategyInput = this.prepareStrategyInput(context);
        const evaluation = this.strategyNetwork.forward(strategyInput);
        
        const optimizationResult = await this.strategyOptimizer.optimize(
            strategyInput,
            (input) => this.strategyNetwork.forward(input)
        );

        return {
            type: 'strategy',
            evaluation,
            optimizedStrategy: optimizationResult.bestStrategy,
            confidence: evaluation.confidence || 0.7,
            reasoning: ['Deep learning strategy evaluation', 'Advanced optimization'],
            expectedOutcome: {
                strategicValue: evaluation.strategicValue,
                riskScore: evaluation.riskScore,
                opportunityScore: evaluation.opportunityScore
            }
        };
    }

    private async getPredictiveAIDecision(context: AIDecisionContext): Promise<any> {
        const predictions = await this.predictiveAI.predict(
            context.gameState,
            PredictionType.STRATEGY_OUTCOME,
            { horizon: 'medium', iterations: 100 }
        );

        const plan = await this.predictiveAI.planStrategy(
            context.gameState,
            PlanningStrategy.MCTS,
            { maxDepth: 5, iterations: 200 }
        );

        return {
            type: 'predictive',
            predictions,
            plan,
            confidence: predictions.confidence,
            reasoning: ['Predictive analysis', 'Strategic planning'],
            expectedOutcome: {
                predictedOutcomes: predictions.outcomes,
                strategicPlan: plan.actions,
                timeHorizon: predictions.timeHorizon
            }
        };
    }

    private async getPlanningAlgorithmDecision(context: AIDecisionContext): Promise<any> {
        const planningResult = await this.planningAlgorithm.planStrategy(
            context.gameState,
            PlanningAlgorithm.MCTS,
            {
                maxIterations: 1000,
                explorationParameter: 1.4,
                maxDepth: 8,
                timeLimit: context.timeConstraint
            }
        );

        return {
            type: 'planning',
            result: planningResult,
            confidence: planningResult.confidence || 0.6,
            reasoning: ['Advanced planning algorithm', 'Monte Carlo tree search'],
            expectedOutcome: {
                bestAction: planningResult.bestAction,
                expectedValue: planningResult.expectedValue,
                explorationPath: planningResult.path
            }
        };
    }

    private resolveConflicts(decisions: Map<string, any>, context: AIDecisionContext): UnifiedAIDecision {
        const activeDecisions = Array.from(decisions.entries());
        
        if (activeDecisions.length === 0) {
            return this.getFallbackDecision(context);
        }

        if (activeDecisions.length === 1) {
            return this.convertToUnifiedDecision(activeDecisions[0][1], context);
        }

        const conflicts = this.detectConflicts(activeDecisions);
        
        if (conflicts.length === 0) {
            return this.mergeDecisions(activeDecisions, context);
        }

        return this.resolveDecisionConflicts(activeDecisions, conflicts, context);
    }

    private detectConflicts(decisions: [string, any][]): string[] {
        const conflicts: string[] = [];
        const actions = decisions.map(([_, decision]) => decision.expectedOutcome);
        
        for (let i = 0; i < actions.length; i++) {
            for (let j = i + 1; j < actions.length; j++) {
                if (this.areActionsConflicting(actions[i], actions[j])) {
                    conflicts.push(`${decisions[i][0]}_vs_${decisions[j][0]}`);
                }
            }
        }
        
        return conflicts;
    }

    private areActionsConflicting(action1: any, action2: any): boolean {
        if (!action1 || !action2) return false;
        
        const threshold = this.conflictResolution.conflictThreshold;
        
        if (action1.strategicValue && action2.strategicValue) {
            return Math.abs(action1.strategicValue - action2.strategicValue) > threshold;
        }
        
        if (action1.riskScore && action2.riskScore) {
            return Math.abs(action1.riskScore - action2.riskScore) > threshold;
        }
        
        return false;
    }

    private resolveDecisionConflicts(
        decisions: [string, any][], 
        conflicts: string[], 
        context: AIDecisionContext
    ): UnifiedAIDecision {
        switch (this.conflictResolution.resolutionMethod) {
            case 'weighted_average':
                return this.weightedAverageResolution(decisions, context);
            case 'highest_confidence':
                return this.highestConfidenceResolution(decisions, context);
            case 'majority_vote':
                return this.majorityVoteResolution(decisions, context);
            case 'expert_system':
                return this.expertSystemResolution(decisions, context);
            default:
                return this.weightedAverageResolution(decisions, context);
        }
    }

    private weightedAverageResolution(decisions: [string, any][], context: AIDecisionContext): UnifiedAIDecision {
        const componentContributions: Record<string, number> = {};
        let totalWeight = 0;
        let weightedConfidence = 0;
        const allReasoning: string[] = [];
        const allAlternatives: string[] = [];

        decisions.forEach(([componentId, decision]) => {
            const weight = this.componentWeights[componentId as keyof AIComponentWeights] || 0;
            componentContributions[componentId] = weight;
            totalWeight += weight;
            weightedConfidence += decision.confidence * weight;
            allReasoning.push(...decision.reasoning);
            if (decision.alternativeOptions) {
                allAlternatives.push(...decision.alternativeOptions);
            }
        });

        const normalizedConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

        const primaryDecision = decisions.reduce((best, current) => {
            const currentWeight = this.componentWeights[current[0] as keyof AIComponentWeights] || 0;
            const bestWeight = this.componentWeights[best[0] as keyof AIComponentWeights] || 0;
            return currentWeight > bestWeight ? current : best;
        });

        return {
            recommendedAction: primaryDecision[1].expectedOutcome.bestAction || 'hold',
            confidence: normalizedConfidence,
            reasoning: Array.from(new Set(allReasoning)),
            alternativeOptions: Array.from(new Set(allAlternatives)),
            expectedOutcome: this.mergeExpectedOutcomes(decisions),
            riskAssessment: this.aggregateRiskAssessments(decisions),
            executionPlan: this.createExecutionPlan(decisions, context),
            componentContributions,
            decisionMetadata: {
                resolutionMethod: 'weighted_average',
                totalComponents: decisions.length,
                timestamp: Date.now()
            }
        };
    }

    private highestConfidenceResolution(decisions: [string, any][], context: AIDecisionContext): UnifiedAIDecision {
        const highestConfidenceDecision = decisions.reduce((best, current) => {
            return current[1].confidence > best[1].confidence ? current : best;
        });

        return this.convertToUnifiedDecision(highestConfidenceDecision[1], context);
    }

    private majorityVoteResolution(decisions: [string, any][], context: AIDecisionContext): UnifiedAIDecision {
        const actionVotes = new Map<string, number>();
        
        decisions.forEach(([_, decision]) => {
            const action = decision.expectedOutcome.bestAction || 'hold';
            actionVotes.set(action, (actionVotes.get(action) || 0) + 1);
        });

        const majorityAction = Array.from(actionVotes.entries()).reduce((best, current) => {
            return current[1] > best[1] ? current : best;
        })[0];

        const supportingDecisions = decisions.filter(([_, decision]) => 
            (decision.expectedOutcome.bestAction || 'hold') === majorityAction
        );

        return this.weightedAverageResolution(supportingDecisions, context);
    }

    private expertSystemResolution(decisions: [string, any][], context: AIDecisionContext): UnifiedAIDecision {
        const expertRules = this.getExpertSystemRules(context);
        
        for (const rule of expertRules) {
            const matchingDecisions = decisions.filter(([componentId, decision]) => 
                rule.condition(componentId, decision, context)
            );
            
            if (matchingDecisions.length > 0) {
                return this.weightedAverageResolution(matchingDecisions, context);
            }
        }

        return this.weightedAverageResolution(decisions, context);
    }

    private getExpertSystemRules(context: AIDecisionContext): any[] {
        return [
            {
                condition: (componentId: string, decision: any, context: AIDecisionContext) => {
                    return componentId === 'strategyNetwork' && decision.confidence > 0.8;
                },
                priority: 1
            },
            {
                condition: (componentId: string, decision: any, context: AIDecisionContext) => {
                    return componentId === 'predictiveAI' && context.strategicObjective === 'long_term_growth';
                },
                priority: 2
            },
            {
                condition: (componentId: string, decision: any, context: AIDecisionContext) => {
                    return componentId === 'planningAlgorithm' && context.timeConstraint < 1000;
                },
                priority: 3
            }
        ];
    }

    private mergeDecisions(decisions: [string, any][], context: AIDecisionContext): UnifiedAIDecision {
        return this.weightedAverageResolution(decisions, context);
    }

    private convertToUnifiedDecision(decision: any, context: AIDecisionContext): UnifiedAIDecision {
        return {
            recommendedAction: decision.expectedOutcome.bestAction || 'hold',
            confidence: decision.confidence,
            reasoning: decision.reasoning,
            alternativeOptions: decision.alternativeOptions || [],
            expectedOutcome: decision.expectedOutcome,
            riskAssessment: decision.riskAssessment || { level: 'medium', factors: [] },
            executionPlan: decision.executionPlan || { steps: [], timeline: 'immediate' },
            componentContributions: { [decision.type]: 1.0 },
            decisionMetadata: {
                singleComponent: decision.type,
                timestamp: Date.now()
            }
        };
    }

    private async optimizeDecision(decision: UnifiedAIDecision, context: AIDecisionContext): Promise<UnifiedAIDecision> {
        if (decision.confidence < this.adaptiveConfig.confidenceThreshold) {
            const optimizedAction = await this.searchForBetterAction(decision, context);
            if (optimizedAction) {
                decision.recommendedAction = optimizedAction.action;
                decision.confidence = Math.max(decision.confidence, optimizedAction.confidence);
                decision.reasoning.push('Action optimized through search');
            }
        }

        return decision;
    }

    private async searchForBetterAction(decision: UnifiedAIDecision, context: AIDecisionContext): Promise<any> {
        const alternatives = this.generateActionAlternatives(decision.recommendedAction);
        let bestAction = null;
        let bestScore = -Infinity;

        for (const alternative of alternatives) {
            const score = await this.evaluateActionQuality(alternative, context);
            if (score > bestScore) {
                bestScore = score;
                bestAction = {
                    action: alternative,
                    confidence: Math.min(0.9, decision.confidence + 0.1),
                    score: bestScore
                };
            }
        }

        return bestAction;
    }

    private generateActionAlternatives(currentAction: string): string[] {
        const actionMap: Record<string, string[]> = {
            'buy': ['invest_selective', 'acquire_premium', 'bulk_purchase'],
            'sell': ['partial_sell', 'strategic_divest', 'liquidate'],
            'hold': ['maintain_position', 'selective_hold', 'defensive_hold'],
            'develop': ['incremental_develop', 'aggressive_develop', 'strategic_develop']
        };

        return actionMap[currentAction] || [currentAction];
    }

    private async evaluateActionQuality(action: string, context: AIDecisionContext): Promise<number> {
        try {
            const strategyInput = this.prepareStrategyInput(context);
            const evaluation = this.strategyNetwork.forward(strategyInput);
            
            const actionScore = evaluation.strategicValue - evaluation.riskScore * context.riskTolerance;
            return actionScore;
        } catch (error) {
            return 0;
        }
    }

    private prepareStrategyInput(context: AIDecisionContext): number[] {
        const gameState = context.gameState;
        const player = gameState.players?.find((p: Player) => p.id === context.playerId);
        
        if (!player || !gameState) {
            return new Array(32).fill(0);
        }

        return [
            gameState.currentRound || 0,
            gameState.phase || 0,
            gameState.totalFunds || 0,
            gameState.marketVolatility || 0.5,
            player.money || 0,
            player.position || 0,
            player.properties?.length || 0,
            player.buildings?.length || 0,
            player.skills?.length || 0,
            context.riskTolerance,
            context.timeConstraint / 1000,
            ...new Array(21).fill(0)
        ];
    }

    private mergeExpectedOutcomes(decisions: [string, any][]): any {
        const outcomes = decisions.map(([_, decision]) => decision.expectedOutcome);
        
        return {
            aggregatedValue: outcomes.reduce((sum, outcome) => sum + (outcome.strategicValue || 0), 0) / outcomes.length,
            averageRisk: outcomes.reduce((sum, outcome) => sum + (outcome.riskScore || 0), 0) / outcomes.length,
            combinedActions: outcomes.map(outcome => outcome.bestAction).filter(Boolean),
            consensusLevel: this.calculateConsensusLevel(outcomes)
        };
    }

    private aggregateRiskAssessments(decisions: [string, any][]): any {
        const risks = decisions.map(([_, decision]) => decision.riskAssessment || { level: 'medium', factors: [] });
        
        const riskLevels = risks.map(risk => risk.level);
        const allFactors = risks.flatMap(risk => risk.factors || []);
        
        return {
            level: this.determineOverallRiskLevel(riskLevels),
            factors: Array.from(new Set(allFactors)),
            confidence: risks.reduce((sum, risk) => sum + (risk.confidence || 0.5), 0) / risks.length
        };
    }

    private createExecutionPlan(decisions: [string, any][], context: AIDecisionContext): any {
        const plans = decisions.map(([_, decision]) => decision.executionPlan || { steps: [], timeline: 'immediate' });
        
        const allSteps = plans.flatMap(plan => plan.steps || []);
        const prioritizedSteps = this.prioritizeExecutionSteps(allSteps);
        
        return {
            steps: prioritizedSteps,
            timeline: this.determineOptimalTimeline(plans),
            contingencies: this.generateContingencyPlans(decisions),
            resourceRequirements: this.calculateResourceRequirements(prioritizedSteps)
        };
    }

    private calculateConsensusLevel(outcomes: any[]): number {
        if (outcomes.length <= 1) return 1.0;
        
        const actions = outcomes.map(outcome => outcome.bestAction).filter(Boolean);
        if (actions.length === 0) return 0;
        
        const actionCounts = new Map<string, number>();
        actions.forEach(action => {
            actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
        });
        
        const maxCount = Math.max(...actionCounts.values());
        return maxCount / actions.length;
    }

    private determineOverallRiskLevel(riskLevels: string[]): string {
        const riskWeights = { low: 1, medium: 2, high: 3, critical: 4 };
        const averageWeight = riskLevels.reduce((sum, level) => sum + (riskWeights[level as keyof typeof riskWeights] || 2), 0) / riskLevels.length;
        
        if (averageWeight <= 1.5) return 'low';
        if (averageWeight <= 2.5) return 'medium';
        if (averageWeight <= 3.5) return 'high';
        return 'critical';
    }

    private prioritizeExecutionSteps(steps: any[]): any[] {
        return steps
            .filter(step => step && typeof step === 'object')
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
            .slice(0, 10);
    }

    private determineOptimalTimeline(plans: any[]): string {
        const timelines = plans.map(plan => plan.timeline || 'immediate');
        const timelineWeights = { immediate: 1, short_term: 2, medium_term: 3, long_term: 4 };
        const averageWeight = timelines.reduce((sum, timeline) => sum + (timelineWeights[timeline as keyof typeof timelineWeights] || 1), 0) / timelines.length;
        
        if (averageWeight <= 1.5) return 'immediate';
        if (averageWeight <= 2.5) return 'short_term';
        if (averageWeight <= 3.5) return 'medium_term';
        return 'long_term';
    }

    private generateContingencyPlans(decisions: [string, any][]): any[] {
        return decisions.map(([componentId, decision], index) => ({
            id: `contingency_${index}`,
            trigger: `${componentId}_failure`,
            fallbackAction: decision.alternativeOptions?.[0] || 'hold',
            confidence: Math.max(0.3, (decision.confidence || 0.5) - 0.2)
        }));
    }

    private calculateResourceRequirements(steps: any[]): any {
        return {
            computationalComplexity: steps.length * 0.1,
            timeRequired: steps.reduce((sum, step) => sum + (step.duration || 1), 0),
            memoryFootprint: steps.length * 0.05,
            confidenceLevel: steps.reduce((sum, step) => sum + (step.confidence || 0.5), 0) / Math.max(steps.length, 1)
        };
    }

    private isComponentActive(componentId: string): boolean {
        const status = this.componentStatuses.get(componentId);
        return status ? status.isActive : false;
    }

    private handleComponentError(componentId: string, error: any): void {
        const status = this.componentStatuses.get(componentId);
        if (status) {
            status.errorCount++;
            status.lastUpdateTime = Date.now();
            
            if (status.errorCount > 5) {
                status.isActive = false;
                console.warn(`Component ${componentId} deactivated due to repeated errors`);
            }
        }
        
        console.error(`Error in component ${componentId}:`, error);
    }

    private updatePerformanceMetrics(decision: UnifiedAIDecision, responseTime: number): void {
        const metrics: AIPerformanceMetrics = {
            decisionAccuracy: decision.confidence,
            responseTime: responseTime,
            strategyEffectiveness: this.calculateStrategyEffectiveness(decision),
            predictionAccuracy: this.calculatePredictionAccuracy(decision),
            learningRate: this.adaptiveConfig.learningRate,
            adaptability: this.calculateAdaptability(),
            consistency: this.calculateConsistency(),
            resourceEfficiency: this.calculateResourceEfficiency(responseTime)
        };

        this.performanceHistory.push(metrics);
        
        if (this.performanceHistory.length > 100) {
            this.performanceHistory.shift();
        }

        this.updateComponentStatuses(decision, metrics);
    }

    private calculateStrategyEffectiveness(decision: UnifiedAIDecision): number {
        const baseEffectiveness = decision.confidence;
        const consensusBonus = decision.expectedOutcome?.consensusLevel || 0;
        return Math.min(1.0, baseEffectiveness + consensusBonus * 0.2);
    }

    private calculatePredictionAccuracy(decision: UnifiedAIDecision): number {
        const predictiveContribution = decision.componentContributions?.predictiveAI || 0;
        return Math.max(0.3, decision.confidence * (1 + predictiveContribution));
    }

    private calculateAdaptability(): number {
        if (this.performanceHistory.length < 2) return 0.5;
        
        const recent = this.performanceHistory.slice(-5);
        const variance = this.calculateVariance(recent.map(m => m.decisionAccuracy));
        return Math.max(0, 1 - variance);
    }

    private calculateConsistency(): number {
        if (this.performanceHistory.length < 3) return 0.5;
        
        const recent = this.performanceHistory.slice(-10);
        const avgAccuracy = recent.reduce((sum, m) => sum + m.decisionAccuracy, 0) / recent.length;
        const deviations = recent.map(m => Math.abs(m.decisionAccuracy - avgAccuracy));
        const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
        
        return Math.max(0, 1 - avgDeviation);
    }

    private calculateResourceEfficiency(responseTime: number): number {
        const targetTime = 2000;
        if (responseTime <= targetTime) return 1.0;
        return Math.max(0.1, targetTime / responseTime);
    }

    private calculateVariance(values: number[]): number {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
    }

    private updateComponentStatuses(decision: UnifiedAIDecision, metrics: AIPerformanceMetrics): void {
        Object.entries(decision.componentContributions).forEach(([componentId, contribution]) => {
            const status = this.componentStatuses.get(componentId);
            if (status) {
                status.performance = metrics.decisionAccuracy * contribution;
                status.successCount++;
                status.lastUpdateTime = Date.now();
            }
        });
    }

    private shouldTriggerOptimization(): boolean {
        const timeSinceLastOptimization = Date.now() - this.lastOptimizationTime;
        const minOptimizationInterval = 60000;
        
        if (timeSinceLastOptimization < minOptimizationInterval) return false;
        if (this.isOptimizing) return false;
        
        const recentPerformance = this.getAveragePerformance(10);
        return recentPerformance < this.adaptiveConfig.performanceThreshold;
    }

    private getAveragePerformance(windowSize: number): number {
        if (this.performanceHistory.length === 0) return 0.5;
        
        const recent = this.performanceHistory.slice(-windowSize);
        return recent.reduce((sum, m) => sum + m.decisionAccuracy, 0) / recent.length;
    }

    private async triggerSystemOptimization(): Promise<void> {
        if (this.isOptimizing) return;
        
        this.isOptimizing = true;
        this.lastOptimizationTime = Date.now();
        
        try {
            const optimizationResult = await this.optimizeSystem();
            this.applyOptimizationResult(optimizationResult);
        } catch (error) {
            console.error('System optimization failed:', error);
        } finally {
            this.isOptimizing = false;
        }
    }

    public async optimizeSystem(): Promise<OptimizationResult> {
        const currentPerformance = this.getAveragePerformance(20);
        const componentPerformances = this.getComponentPerformances();
        
        const newWeights = this.optimizeComponentWeights(componentPerformances);
        const newConfig = this.optimizeAdaptiveConfig();
        
        const estimatedImprovement = this.estimatePerformanceImprovement(newWeights, newConfig);
        
        return {
            optimizedWeights: newWeights,
            performanceImprovement: estimatedImprovement,
            recommendedAdjustments: this.generateOptimizationRecommendations(componentPerformances),
            newConfiguration: newConfig,
            estimatedBenefit: estimatedImprovement * 100
        };
    }

    private getComponentPerformances(): Record<string, number> {
        const performances: Record<string, number> = {};
        
        this.componentStatuses.forEach((status, componentId) => {
            performances[componentId] = status.performance;
        });
        
        return performances;
    }

    private optimizeComponentWeights(performances: Record<string, number>): AIComponentWeights {
        const totalPerformance = Object.values(performances).reduce((sum, p) => sum + p, 0);
        
        if (totalPerformance === 0) return this.componentWeights;
        
        const normalizedPerformances = Object.fromEntries(
            Object.entries(performances).map(([id, perf]) => [id, perf / totalPerformance])
        );

        return {
            strategyNetwork: Math.max(0.1, Math.min(0.5, normalizedPerformances.strategyNetwork || 0.3)),
            predictiveAI: Math.max(0.1, Math.min(0.4, normalizedPerformances.predictiveAI || 0.25)),
            planningAlgorithm: Math.max(0.1, Math.min(0.3, normalizedPerformances.planningAlgorithm || 0.2)),
            behaviorTree: Math.max(0.05, Math.min(0.2, normalizedPerformances.behaviorTree || 0.15)),
            reinforcementLearning: Math.max(0.05, Math.min(0.15, normalizedPerformances.reinforcementLearning || 0.1))
        };
    }

    private optimizeAdaptiveConfig(): AdaptiveConfig {
        const recentPerformance = this.getAveragePerformance(10);
        
        return {
            performanceThreshold: Math.max(0.5, Math.min(0.9, recentPerformance + 0.1)),
            switchingCooldown: recentPerformance > 0.7 ? 3000 : 7000,
            learningRate: recentPerformance > 0.8 ? 0.005 : 0.02,
            explorationRate: recentPerformance > 0.8 ? 0.05 : 0.15,
            confidenceThreshold: Math.max(0.6, Math.min(0.9, recentPerformance + 0.05))
        };
    }

    private estimatePerformanceImprovement(newWeights: AIComponentWeights, newConfig: AdaptiveConfig): number {
        const currentAverage = this.getAveragePerformance(20);
        const weightOptimizationGain = this.calculateWeightOptimizationGain(newWeights);
        const configOptimizationGain = this.calculateConfigOptimizationGain(newConfig);
        
        const totalGain = weightOptimizationGain + configOptimizationGain;
        return Math.min(0.3, totalGain);
    }

    private calculateWeightOptimizationGain(newWeights: AIComponentWeights): number {
        const performanceWeightedSum = Object.entries(newWeights).reduce((sum, [componentId, weight]) => {
            const performance = this.componentStatuses.get(componentId)?.performance || 0.5;
            return sum + performance * weight;
        }, 0);
        
        const currentWeightedSum = Object.entries(this.componentWeights).reduce((sum, [componentId, weight]) => {
            const performance = this.componentStatuses.get(componentId)?.performance || 0.5;
            return sum + performance * weight;
        }, 0);
        
        return Math.max(0, performanceWeightedSum - currentWeightedSum);
    }

    private calculateConfigOptimizationGain(newConfig: AdaptiveConfig): number {
        const configImprovements = [
            newConfig.learningRate !== this.adaptiveConfig.learningRate ? 0.02 : 0,
            newConfig.explorationRate !== this.adaptiveConfig.explorationRate ? 0.01 : 0,
            newConfig.confidenceThreshold !== this.adaptiveConfig.confidenceThreshold ? 0.015 : 0
        ];
        
        return configImprovements.reduce((sum, gain) => sum + gain, 0);
    }

    private generateOptimizationRecommendations(performances: Record<string, number>): string[] {
        const recommendations: string[] = [];
        
        Object.entries(performances).forEach(([componentId, performance]) => {
            if (performance < 0.3) {
                recommendations.push(`Consider reviewing ${componentId} configuration or implementation`);
            } else if (performance > 0.8) {
                recommendations.push(`${componentId} is performing well, consider increasing its weight`);
            }
        });

        const avgResponseTime = this.performanceHistory.slice(-10).reduce((sum, m) => sum + m.responseTime, 0) / Math.max(this.performanceHistory.slice(-10).length, 1);
        if (avgResponseTime > 3000) {
            recommendations.push('Consider optimizing component response times or increasing time constraints');
        }

        const consistency = this.calculateConsistency();
        if (consistency < 0.6) {
            recommendations.push('Decision consistency is low, consider adjusting conflict resolution strategy');
        }

        return recommendations;
    }

    private applyOptimizationResult(result: OptimizationResult): void {
        this.componentWeights = result.optimizedWeights;
        this.adaptiveConfig = result.newConfiguration;
        
        console.log('System optimization applied:', {
            performanceImprovement: result.performanceImprovement,
            newWeights: result.optimizedWeights,
            recommendations: result.recommendedAdjustments
        });
    }

    private generateCacheKey(context: AIDecisionContext): string {
        const keyComponents = [
            context.playerId,
            context.strategicObjective,
            context.riskTolerance.toString(),
            JSON.stringify(context.gameState).substring(0, 100)
        ];
        
        return keyComponents.join('_');
    }

    private isCacheValid(decision: UnifiedAIDecision): boolean {
        const cacheAge = Date.now() - (decision.decisionMetadata?.timestamp || 0);
        const maxCacheAge = 30000;
        return cacheAge < maxCacheAge;
    }

    private getFallbackDecision(context: AIDecisionContext): UnifiedAIDecision {
        return {
            recommendedAction: 'hold',
            confidence: 0.3,
            reasoning: ['Fallback decision due to system error'],
            alternativeOptions: ['wait', 'reassess'],
            expectedOutcome: { action: 'hold', risk: 'low' },
            riskAssessment: { level: 'low', factors: ['conservative_approach'] },
            executionPlan: { steps: [{ action: 'hold', priority: 1 }], timeline: 'immediate' },
            componentContributions: { fallback: 1.0 },
            decisionMetadata: { fallback: true, timestamp: Date.now() }
        };
    }

    public getSystemStatus(): any {
        return {
            componentStatuses: Object.fromEntries(this.componentStatuses),
            currentWeights: this.componentWeights,
            adaptiveConfig: this.adaptiveConfig,
            recentPerformance: this.getAveragePerformance(10),
            isOptimizing: this.isOptimizing,
            cacheSize: this.decisionCache.size,
            performanceHistoryLength: this.performanceHistory.length
        };
    }

    public async healthCheck(): Promise<boolean> {
        try {
            const testContext: AIDecisionContext = {
                playerId: 'test',
                gameState: { currentRound: 1, phase: 0 },
                timeConstraint: 5000,
                riskTolerance: 0.5,
                strategicObjective: 'test',
                historicalPerformance: []
            };

            const decision = await this.makeUnifiedDecision(testContext);
            return decision.confidence > 0.2;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}