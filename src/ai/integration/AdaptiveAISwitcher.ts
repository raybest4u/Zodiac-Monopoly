import { AIComponentWeights, AIPerformanceMetrics, AdaptiveConfig } from './MasterAICoordinator';
import { OptimizationResult } from './AIPerformanceOptimizer';

export interface SwitchingRule {
    id: string;
    name: string;
    description: string;
    trigger: SwitchingTrigger;
    targetConfiguration: Partial<AIComponentWeights>;
    priority: number;
    cooldownPeriod: number;
    confidence: number;
    conditions: SwitchingCondition[];
}

export interface SwitchingTrigger {
    type: 'performance_degradation' | 'context_change' | 'time_based' | 'error_threshold' | 'user_preference';
    threshold: number;
    windowSize: number;
    persistenceDuration: number;
}

export interface SwitchingCondition {
    metric: keyof AIPerformanceMetrics | 'contextType' | 'errorRate' | 'responseTime';
    operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between';
    value: number | string | [number, number];
    weight: number;
}

export interface SwitchingEvent {
    timestamp: number;
    fromConfiguration: AIComponentWeights;
    toConfiguration: AIComponentWeights;
    triggerRuleId: string;
    reason: string;
    success: boolean;
    performanceImpact: number;
    contextSnapshot: any;
}

export interface ContextPattern {
    id: string;
    name: string;
    description: string;
    features: Record<string, any>;
    optimalWeights: AIComponentWeights;
    confidence: number;
    usageCount: number;
    avgPerformance: number;
}

export interface AdaptiveSwitchingConfig {
    enabledRules: string[];
    globalCooldown: number;
    performanceThreshold: number;
    contextSensitivity: number;
    learningRate: number;
    explorationRate: number;
    minSwitchingInterval: number;
    maxSwitchesPerHour: number;
    rollbackThreshold: number;
}

export interface PredictiveModel {
    id: string;
    name: string;
    type: 'linear_regression' | 'neural_network' | 'decision_tree' | 'ensemble';
    features: string[];
    accuracy: number;
    lastTrainingTime: number;
    predictions: Map<string, number>;
}

export class AdaptiveAISwitcher {
    private switchingRules: SwitchingRule[];
    private switchingHistory: SwitchingEvent[];
    private contextPatterns: Map<string, ContextPattern>;
    private predictiveModels: Map<string, PredictiveModel>;
    private currentWeights: AIComponentWeights;
    private performanceHistory: AIPerformanceMetrics[];
    private config: AdaptiveSwitchingConfig;
    private adaptiveConfig: AdaptiveConfig;
    
    private lastSwitchTime: number;
    private ruleCooldowns: Map<string, number>;
    private switchingMetrics: Map<string, number>;
    private contextHistory: any[];
    private emergencyMode: boolean;
    private rollbackStack: AIComponentWeights[];

    constructor(
        initialWeights: AIComponentWeights,
        adaptiveConfig: AdaptiveConfig,
        switchingConfig?: Partial<AdaptiveSwitchingConfig>
    ) {
        this.currentWeights = { ...initialWeights };
        this.adaptiveConfig = adaptiveConfig;
        this.initializeSwitchingRules();
        this.initializeConfiguration(switchingConfig);
        this.initializeDataStructures();
        this.initializePredictiveModels();
    }

    private initializeSwitchingRules(): void {
        this.switchingRules = [
            {
                id: 'performance_degradation_critical',
                name: 'Critical Performance Degradation',
                description: 'Switch when performance drops critically below threshold',
                trigger: {
                    type: 'performance_degradation',
                    threshold: 0.3,
                    windowSize: 5,
                    persistenceDuration: 30000
                },
                targetConfiguration: {
                    strategyNetwork: 0.5,
                    predictiveAI: 0.2,
                    planningAlgorithm: 0.15,
                    behaviorTree: 0.1,
                    reinforcementLearning: 0.05
                },
                priority: 1,
                cooldownPeriod: 60000,
                confidence: 0.9,
                conditions: [
                    { metric: 'decisionAccuracy', operator: 'less_than', value: 0.4, weight: 0.4 },
                    { metric: 'strategyEffectiveness', operator: 'less_than', value: 0.3, weight: 0.3 },
                    { metric: 'consistency', operator: 'less_than', value: 0.2, weight: 0.3 }
                ]
            },
            {
                id: 'high_accuracy_preference',
                name: 'High Accuracy Preference',
                description: 'Switch to accuracy-focused configuration when high precision is needed',
                trigger: {
                    type: 'context_change',
                    threshold: 0.8,
                    windowSize: 3,
                    persistenceDuration: 15000
                },
                targetConfiguration: {
                    strategyNetwork: 0.4,
                    predictiveAI: 0.3,
                    planningAlgorithm: 0.2,
                    behaviorTree: 0.05,
                    reinforcementLearning: 0.05
                },
                priority: 2,
                cooldownPeriod: 45000,
                confidence: 0.85,
                conditions: [
                    { metric: 'contextType', operator: 'equals', value: 'strategic_decision', weight: 0.5 },
                    { metric: 'decisionAccuracy', operator: 'greater_than', value: 0.7, weight: 0.3 },
                    { metric: 'predictionAccuracy', operator: 'greater_than', value: 0.75, weight: 0.2 }
                ]
            },
            {
                id: 'speed_optimization',
                name: 'Speed Optimization',
                description: 'Switch to faster components when response time is critical',
                trigger: {
                    type: 'context_change',
                    threshold: 1000,
                    windowSize: 2,
                    persistenceDuration: 5000
                },
                targetConfiguration: {
                    strategyNetwork: 0.2,
                    predictiveAI: 0.1,
                    planningAlgorithm: 0.1,
                    behaviorTree: 0.4,
                    reinforcementLearning: 0.2
                },
                priority: 3,
                cooldownPeriod: 30000,
                confidence: 0.8,
                conditions: [
                    { metric: 'responseTime', operator: 'less_than', value: 1000, weight: 0.6 },
                    { metric: 'resourceEfficiency', operator: 'greater_than', value: 0.7, weight: 0.4 }
                ]
            },
            {
                id: 'predictive_focus',
                name: 'Predictive Focus',
                description: 'Switch to prediction-heavy configuration for future planning',
                trigger: {
                    type: 'context_change',
                    threshold: 0.7,
                    windowSize: 4,
                    persistenceDuration: 20000
                },
                targetConfiguration: {
                    strategyNetwork: 0.15,
                    predictiveAI: 0.45,
                    planningAlgorithm: 0.25,
                    behaviorTree: 0.1,
                    reinforcementLearning: 0.05
                },
                priority: 4,
                cooldownPeriod: 40000,
                confidence: 0.75,
                conditions: [
                    { metric: 'contextType', operator: 'equals', value: 'long_term_planning', weight: 0.4 },
                    { metric: 'predictionAccuracy', operator: 'greater_than', value: 0.6, weight: 0.35 },
                    { metric: 'adaptability', operator: 'greater_than', value: 0.5, weight: 0.25 }
                ]
            },
            {
                id: 'balanced_recovery',
                name: 'Balanced Recovery',
                description: 'Switch to balanced configuration for recovery from poor performance',
                trigger: {
                    type: 'performance_degradation',
                    threshold: 0.5,
                    windowSize: 7,
                    persistenceDuration: 45000
                },
                targetConfiguration: {
                    strategyNetwork: 0.25,
                    predictiveAI: 0.25,
                    planningAlgorithm: 0.2,
                    behaviorTree: 0.15,
                    reinforcementLearning: 0.15
                },
                priority: 5,
                cooldownPeriod: 60000,
                confidence: 0.7,
                conditions: [
                    { metric: 'decisionAccuracy', operator: 'between', value: [0.4, 0.6], weight: 0.3 },
                    { metric: 'strategyEffectiveness', operator: 'between', value: [0.4, 0.6], weight: 0.3 },
                    { metric: 'consistency', operator: 'between', value: [0.3, 0.6], weight: 0.4 }
                ]
            },
            {
                id: 'error_mitigation',
                name: 'Error Mitigation',
                description: 'Switch to conservative configuration when error rates are high',
                trigger: {
                    type: 'error_threshold',
                    threshold: 0.2,
                    windowSize: 5,
                    persistenceDuration: 20000
                },
                targetConfiguration: {
                    strategyNetwork: 0.6,
                    predictiveAI: 0.1,
                    planningAlgorithm: 0.1,
                    behaviorTree: 0.15,
                    reinforcementLearning: 0.05
                },
                priority: 6,
                cooldownPeriod: 50000,
                confidence: 0.85,
                conditions: [
                    { metric: 'errorRate', operator: 'greater_than', value: 0.15, weight: 0.7 },
                    { metric: 'consistency', operator: 'less_than', value: 0.5, weight: 0.3 }
                ]
            },
            {
                id: 'exploration_mode',
                name: 'Exploration Mode',
                description: 'Switch to exploration configuration to try new approaches',
                trigger: {
                    type: 'time_based',
                    threshold: 3600000,
                    windowSize: 1,
                    persistenceDuration: 600000
                },
                targetConfiguration: {
                    strategyNetwork: 0.1,
                    predictiveAI: 0.2,
                    planningAlgorithm: 0.3,
                    behaviorTree: 0.2,
                    reinforcementLearning: 0.2
                },
                priority: 7,
                cooldownPeriod: 1800000,
                confidence: 0.6,
                conditions: [
                    { metric: 'decisionAccuracy', operator: 'greater_than', value: 0.6, weight: 0.5 },
                    { metric: 'adaptability', operator: 'greater_than', value: 0.4, weight: 0.5 }
                ]
            }
        ];
    }

    private initializeConfiguration(switchingConfig?: Partial<AdaptiveSwitchingConfig>): void {
        this.config = {
            enabledRules: this.switchingRules.map(rule => rule.id),
            globalCooldown: 30000,
            performanceThreshold: 0.7,
            contextSensitivity: 0.8,
            learningRate: 0.05,
            explorationRate: 0.1,
            minSwitchingInterval: 15000,
            maxSwitchesPerHour: 10,
            rollbackThreshold: 0.3,
            ...switchingConfig
        };
    }

    private initializeDataStructures(): void {
        this.switchingHistory = [];
        this.contextPatterns = new Map();
        this.predictiveModels = new Map();
        this.performanceHistory = [];
        this.ruleCooldowns = new Map();
        this.switchingMetrics = new Map();
        this.contextHistory = [];
        this.emergencyMode = false;
        this.rollbackStack = [];
        this.lastSwitchTime = 0;

        this.switchingMetrics.set('totalSwitches', 0);
        this.switchingMetrics.set('successfulSwitches', 0);
        this.switchingMetrics.set('averageImpact', 0);
        this.switchingMetrics.set('rollbacks', 0);
    }

    private initializePredictiveModels(): void {
        this.predictiveModels.set('performance_predictor', {
            id: 'performance_predictor',
            name: 'Performance Prediction Model',
            type: 'ensemble',
            features: ['decisionAccuracy', 'responseTime', 'strategyEffectiveness', 'consistency'],
            accuracy: 0.7,
            lastTrainingTime: Date.now(),
            predictions: new Map()
        });

        this.predictiveModels.set('context_classifier', {
            id: 'context_classifier',
            name: 'Context Classification Model',
            type: 'decision_tree',
            features: ['contextType', 'timeConstraint', 'riskTolerance', 'strategicObjective'],
            accuracy: 0.75,
            lastTrainingTime: Date.now(),
            predictions: new Map()
        });

        this.predictiveModels.set('optimal_weights_predictor', {
            id: 'optimal_weights_predictor',
            name: 'Optimal Weights Prediction Model',
            type: 'neural_network',
            features: ['contextFeatures', 'performanceHistory', 'componentStatus'],
            accuracy: 0.65,
            lastTrainingTime: Date.now(),
            predictions: new Map()
        });
    }

    public async evaluateSwitching(
        currentPerformance: AIPerformanceMetrics,
        context: any,
        componentStatuses: Map<string, any>
    ): Promise<{ shouldSwitch: boolean; recommendedWeights?: AIComponentWeights; reason?: string }> {
        this.performanceHistory.push(currentPerformance);
        this.contextHistory.push({ ...context, timestamp: Date.now() });

        this.trimHistories();

        if (this.isInCooldown()) {
            return { shouldSwitch: false, reason: 'Global cooldown active' };
        }

        if (this.reachedMaxSwitchesPerHour()) {
            return { shouldSwitch: false, reason: 'Maximum switches per hour reached' };
        }

        this.checkEmergencyMode(currentPerformance);

        const triggeredRules = await this.evaluateRules(currentPerformance, context, componentStatuses);

        if (triggeredRules.length === 0) {
            return { shouldSwitch: false, reason: 'No switching rules triggered' };
        }

        const selectedRule = this.selectBestRule(triggeredRules, currentPerformance, context);
        const predictedImpact = await this.predictSwitchingImpact(selectedRule, currentPerformance, context);

        if (predictedImpact < this.config.performanceThreshold) {
            return { 
                shouldSwitch: false, 
                reason: `Predicted impact (${predictedImpact.toFixed(2)}) below threshold (${this.config.performanceThreshold})` 
            };
        }

        const optimizedWeights = await this.optimizeTargetWeights(selectedRule.targetConfiguration, context, currentPerformance);

        return {
            shouldSwitch: true,
            recommendedWeights: optimizedWeights,
            reason: `Rule triggered: ${selectedRule.name} (confidence: ${selectedRule.confidence.toFixed(2)})`
        };
    }

    private trimHistories(): void {
        const maxHistorySize = 50;
        
        if (this.performanceHistory.length > maxHistorySize) {
            this.performanceHistory.splice(0, this.performanceHistory.length - maxHistorySize);
        }
        
        if (this.contextHistory.length > maxHistorySize) {
            this.contextHistory.splice(0, this.contextHistory.length - maxHistorySize);
        }
        
        if (this.switchingHistory.length > 200) {
            this.switchingHistory.splice(0, this.switchingHistory.length - 200);
        }
    }

    private isInCooldown(): boolean {
        const now = Date.now();
        const timeSinceLastSwitch = now - this.lastSwitchTime;
        
        if (timeSinceLastSwitch < this.config.globalCooldown) {
            return true;
        }
        
        if (timeSinceLastSwitch < this.config.minSwitchingInterval) {
            return true;
        }
        
        return false;
    }

    private reachedMaxSwitchesPerHour(): boolean {
        const oneHourAgo = Date.now() - 3600000;
        const recentSwitches = this.switchingHistory.filter(event => event.timestamp > oneHourAgo);
        return recentSwitches.length >= this.config.maxSwitchesPerHour;
    }

    private checkEmergencyMode(currentPerformance: AIPerformanceMetrics): void {
        const criticalThreshold = 0.2;
        const emergencyMetrics = [
            currentPerformance.decisionAccuracy,
            currentPerformance.strategyEffectiveness,
            currentPerformance.consistency
        ];

        const criticalMetricsCount = emergencyMetrics.filter(metric => metric < criticalThreshold).length;
        
        if (criticalMetricsCount >= 2 && !this.emergencyMode) {
            this.emergencyMode = true;
            console.warn('Entering emergency mode due to critical performance degradation');
        } else if (criticalMetricsCount === 0 && this.emergencyMode) {
            this.emergencyMode = false;
            console.info('Exiting emergency mode - performance stabilized');
        }
    }

    private async evaluateRules(
        currentPerformance: AIPerformanceMetrics,
        context: any,
        componentStatuses: Map<string, any>
    ): Promise<SwitchingRule[]> {
        const triggeredRules: SwitchingRule[] = [];

        for (const rule of this.switchingRules) {
            if (!this.config.enabledRules.includes(rule.id)) {
                continue;
            }

            if (this.isRuleInCooldown(rule.id)) {
                continue;
            }

            const isTriggered = await this.evaluateRule(rule, currentPerformance, context, componentStatuses);
            
            if (isTriggered) {
                triggeredRules.push(rule);
            }
        }

        return triggeredRules.sort((a, b) => b.priority - a.priority);
    }

    private async evaluateRule(
        rule: SwitchingRule,
        currentPerformance: AIPerformanceMetrics,
        context: any,
        componentStatuses: Map<string, any>
    ): Promise<boolean> {
        const triggerResult = this.evaluateTrigger(rule.trigger, currentPerformance, context);
        
        if (!triggerResult) {
            return false;
        }

        const conditionsResult = this.evaluateConditions(rule.conditions, currentPerformance, context, componentStatuses);
        
        return conditionsResult;
    }

    private evaluateTrigger(
        trigger: SwitchingTrigger,
        currentPerformance: AIPerformanceMetrics,
        context: any
    ): boolean {
        switch (trigger.type) {
            case 'performance_degradation':
                return this.evaluatePerformanceDegradation(trigger, currentPerformance);
            case 'context_change':
                return this.evaluateContextChange(trigger, context);
            case 'time_based':
                return this.evaluateTimeBased(trigger);
            case 'error_threshold':
                return this.evaluateErrorThreshold(trigger, currentPerformance);
            case 'user_preference':
                return this.evaluateUserPreference(trigger, context);
            default:
                return false;
        }
    }

    private evaluatePerformanceDegradation(trigger: SwitchingTrigger, currentPerformance: AIPerformanceMetrics): boolean {
        if (this.performanceHistory.length < trigger.windowSize) {
            return false;
        }

        const recentMetrics = this.performanceHistory.slice(-trigger.windowSize);
        const avgPerformance = recentMetrics.reduce((sum, m) => 
            sum + (m.decisionAccuracy + m.strategyEffectiveness + m.consistency) / 3, 0
        ) / recentMetrics.length;

        return avgPerformance < trigger.threshold;
    }

    private evaluateContextChange(trigger: SwitchingTrigger, context: any): boolean {
        if (this.contextHistory.length < 2) {
            return false;
        }

        const previousContext = this.contextHistory[this.contextHistory.length - 2];
        const changeScore = this.calculateContextChangeScore(previousContext, context);

        return changeScore > trigger.threshold;
    }

    private calculateContextChangeScore(previous: any, current: any): number {
        let changeScore = 0;
        const contextFields = ['strategicObjective', 'riskTolerance', 'timeConstraint'];
        
        contextFields.forEach(field => {
            if (previous[field] !== current[field]) {
                if (typeof previous[field] === 'number' && typeof current[field] === 'number') {
                    changeScore += Math.abs(previous[field] - current[field]);
                } else {
                    changeScore += 0.5;
                }
            }
        });

        return Math.min(1, changeScore);
    }

    private evaluateTimeBased(trigger: SwitchingTrigger): boolean {
        const timeSinceLastSwitch = Date.now() - this.lastSwitchTime;
        return timeSinceLastSwitch > trigger.threshold;
    }

    private evaluateErrorThreshold(trigger: SwitchingTrigger, currentPerformance: AIPerformanceMetrics): boolean {
        const errorRate = 1 - currentPerformance.resourceEfficiency;
        return errorRate > trigger.threshold;
    }

    private evaluateUserPreference(trigger: SwitchingTrigger, context: any): boolean {
        return context.userPreference === trigger.threshold;
    }

    private evaluateConditions(
        conditions: SwitchingCondition[],
        currentPerformance: AIPerformanceMetrics,
        context: any,
        componentStatuses: Map<string, any>
    ): boolean {
        let totalWeight = 0;
        let satisfiedWeight = 0;

        for (const condition of conditions) {
            totalWeight += condition.weight;
            
            const value = this.extractConditionValue(condition.metric, currentPerformance, context, componentStatuses);
            const satisfied = this.evaluateCondition(condition, value);
            
            if (satisfied) {
                satisfiedWeight += condition.weight;
            }
        }

        const satisfactionRatio = totalWeight > 0 ? satisfiedWeight / totalWeight : 0;
        return satisfactionRatio >= 0.7;
    }

    private extractConditionValue(
        metric: string,
        currentPerformance: AIPerformanceMetrics,
        context: any,
        componentStatuses: Map<string, any>
    ): any {
        if (metric in currentPerformance) {
            return currentPerformance[metric as keyof AIPerformanceMetrics];
        }
        
        if (metric in context) {
            return context[metric];
        }
        
        if (metric === 'errorRate') {
            let totalErrors = 0;
            let totalAttempts = 0;
            componentStatuses.forEach(status => {
                totalErrors += status.errorCount || 0;
                totalAttempts += (status.errorCount || 0) + (status.successCount || 0);
            });
            return totalAttempts > 0 ? totalErrors / totalAttempts : 0;
        }
        
        return 0;
    }

    private evaluateCondition(condition: SwitchingCondition, value: any): boolean {
        switch (condition.operator) {
            case 'greater_than':
                return typeof value === 'number' && value > (condition.value as number);
            case 'less_than':
                return typeof value === 'number' && value < (condition.value as number);
            case 'equals':
                return value === condition.value;
            case 'not_equals':
                return value !== condition.value;
            case 'between':
                if (typeof value === 'number' && Array.isArray(condition.value) && condition.value.length === 2) {
                    return value >= condition.value[0] && value <= condition.value[1];
                }
                return false;
            default:
                return false;
        }
    }

    private isRuleInCooldown(ruleId: string): boolean {
        const lastTriggered = this.ruleCooldowns.get(ruleId) || 0;
        const rule = this.switchingRules.find(r => r.id === ruleId);
        const cooldownPeriod = rule ? rule.cooldownPeriod : 60000;
        
        return Date.now() - lastTriggered < cooldownPeriod;
    }

    private selectBestRule(
        triggeredRules: SwitchingRule[],
        currentPerformance: AIPerformanceMetrics,
        context: any
    ): SwitchingRule {
        if (triggeredRules.length === 1) {
            return triggeredRules[0];
        }

        let bestRule = triggeredRules[0];
        let bestScore = this.calculateRuleScore(bestRule, currentPerformance, context);

        for (let i = 1; i < triggeredRules.length; i++) {
            const rule = triggeredRules[i];
            const score = this.calculateRuleScore(rule, currentPerformance, context);
            
            if (score > bestScore) {
                bestScore = score;
                bestRule = rule;
            }
        }

        return bestRule;
    }

    private calculateRuleScore(
        rule: SwitchingRule,
        currentPerformance: AIPerformanceMetrics,
        context: any
    ): number {
        let score = rule.confidence;
        
        score += rule.priority * 0.1;
        
        if (this.emergencyMode && rule.trigger.type === 'performance_degradation') {
            score += 0.3;
        }
        
        const recentSwitchingSuccess = this.getRecentSwitchingSuccess(rule.id);
        score += recentSwitchingSuccess * 0.2;
        
        const contextMatch = this.calculateContextMatch(rule, context);
        score += contextMatch * 0.15;
        
        return Math.min(1, score);
    }

    private getRecentSwitchingSuccess(ruleId: string): number {
        const recentSwitches = this.switchingHistory
            .filter(event => event.triggerRuleId === ruleId)
            .slice(-5);

        if (recentSwitches.length === 0) return 0.5;

        const successfulSwitches = recentSwitches.filter(event => event.success && event.performanceImpact > 0);
        return successfulSwitches.length / recentSwitches.length;
    }

    private calculateContextMatch(rule: SwitchingRule, context: any): number {
        let matchScore = 0;
        
        const contextConditions = rule.conditions.filter(c => c.metric === 'contextType');
        if (contextConditions.length > 0) {
            const matches = contextConditions.filter(c => 
                this.evaluateCondition(c, context.strategicObjective || context.contextType)
            );
            matchScore = matches.length / contextConditions.length;
        } else {
            matchScore = 0.5;
        }
        
        return matchScore;
    }

    private async predictSwitchingImpact(
        rule: SwitchingRule,
        currentPerformance: AIPerformanceMetrics,
        context: any
    ): Promise<number> {
        const performancePredictor = this.predictiveModels.get('performance_predictor');
        if (!performancePredictor) {
            return 0.5;
        }

        try {
            const features = this.extractPredictiveFeatures(rule, currentPerformance, context);
            const prediction = await this.runPredictiveModel(performancePredictor, features);
            
            return Math.max(0, Math.min(1, prediction));
        } catch (error) {
            console.warn('Predictive model failed, using heuristic:', error);
            return this.calculateHeuristicImpact(rule, currentPerformance);
        }
    }

    private extractPredictiveFeatures(
        rule: SwitchingRule,
        currentPerformance: AIPerformanceMetrics,
        context: any
    ): number[] {
        return [
            currentPerformance.decisionAccuracy,
            currentPerformance.responseTime / 5000,
            currentPerformance.strategyEffectiveness,
            currentPerformance.consistency,
            rule.confidence,
            rule.priority / 10,
            context.riskTolerance || 0.5,
            context.timeConstraint ? Math.min(1, context.timeConstraint / 5000) : 0.5
        ];
    }

    private async runPredictiveModel(model: PredictiveModel, features: number[]): Promise<number> {
        switch (model.type) {
            case 'linear_regression':
                return this.linearRegressionPredict(features);
            case 'neural_network':
                return this.neuralNetworkPredict(features);
            case 'decision_tree':
                return this.decisionTreePredict(features);
            case 'ensemble':
                return this.ensemblePredict(features);
            default:
                return 0.5;
        }
    }

    private linearRegressionPredict(features: number[]): number {
        const weights = [0.3, -0.2, 0.25, 0.2, 0.15, 0.1, 0.05, 0.05];
        const bias = 0.1;
        
        let prediction = bias;
        for (let i = 0; i < Math.min(features.length, weights.length); i++) {
            prediction += features[i] * weights[i];
        }
        
        return Math.max(0, Math.min(1, prediction));
    }

    private neuralNetworkPredict(features: number[]): number {
        const hiddenWeights = [
            [0.2, -0.1, 0.3, 0.1, 0.2, 0.05, 0.1, 0.05],
            [-0.1, 0.3, 0.2, 0.15, 0.1, 0.1, 0.05, 0.1],
            [0.25, 0.1, -0.2, 0.3, 0.05, 0.1, 0.15, 0.05]
        ];
        const outputWeights = [0.4, 0.3, 0.3];
        
        const hiddenOutputs = hiddenWeights.map(weights => {
            let sum = 0;
            for (let i = 0; i < Math.min(features.length, weights.length); i++) {
                sum += features[i] * weights[i];
            }
            return Math.max(0, sum);
        });
        
        let output = 0;
        for (let i = 0; i < hiddenOutputs.length; i++) {
            output += hiddenOutputs[i] * outputWeights[i];
        }
        
        return Math.max(0, Math.min(1, output));
    }

    private decisionTreePredict(features: number[]): number {
        const accuracy = features[0] || 0;
        const responseTime = features[1] || 0;
        const effectiveness = features[2] || 0;
        
        if (accuracy < 0.3) return 0.8;
        if (responseTime > 0.8) return 0.7;
        if (effectiveness < 0.4) return 0.6;
        if (accuracy > 0.8 && effectiveness > 0.7) return 0.3;
        
        return 0.5;
    }

    private ensemblePredict(features: number[]): number {
        const linearPred = this.linearRegressionPredict(features);
        const nnPred = this.neuralNetworkPredict(features);
        const treePred = this.decisionTreePredict(features);
        
        return (linearPred * 0.3 + nnPred * 0.4 + treePred * 0.3);
    }

    private calculateHeuristicImpact(rule: SwitchingRule, currentPerformance: AIPerformanceMetrics): number {
        let impact = rule.confidence * 0.5;
        
        if (rule.trigger.type === 'performance_degradation') {
            const performanceDeficit = Math.max(0, 0.7 - currentPerformance.decisionAccuracy);
            impact += performanceDeficit * 0.5;
        }
        
        if (this.emergencyMode) {
            impact += 0.2;
        }
        
        return Math.min(1, impact);
    }

    private async optimizeTargetWeights(
        baseWeights: Partial<AIComponentWeights>,
        context: any,
        currentPerformance: AIPerformanceMetrics
    ): Promise<AIComponentWeights> {
        const fullWeights: AIComponentWeights = {
            strategyNetwork: baseWeights.strategyNetwork || 0.25,
            predictiveAI: baseWeights.predictiveAI || 0.25,
            planningAlgorithm: baseWeights.planningAlgorithm || 0.2,
            behaviorTree: baseWeights.behaviorTree || 0.15,
            reinforcementLearning: baseWeights.reinforcementLearning || 0.15
        };

        const optimizedWeights = await this.contextAwareOptimization(fullWeights, context, currentPerformance);
        return this.normalizeWeights(optimizedWeights);
    }

    private async contextAwareOptimization(
        baseWeights: AIComponentWeights,
        context: any,
        currentPerformance: AIPerformanceMetrics
    ): Promise<AIComponentWeights> {
        const contextPattern = this.identifyContextPattern(context);
        
        if (contextPattern && contextPattern.confidence > 0.7) {
            return this.blendWeights(baseWeights, contextPattern.optimalWeights, 0.6);
        }

        const performanceAdjustments = this.calculatePerformanceAdjustments(currentPerformance);
        return this.applyAdjustments(baseWeights, performanceAdjustments);
    }

    private identifyContextPattern(context: any): ContextPattern | null {
        const contextFeatures = this.extractContextFeatures(context);
        let bestMatch: ContextPattern | null = null;
        let bestSimilarity = 0;

        for (const pattern of this.contextPatterns.values()) {
            const similarity = this.calculatePatternSimilarity(contextFeatures, pattern.features);
            if (similarity > bestSimilarity && similarity > 0.6) {
                bestSimilarity = similarity;
                bestMatch = pattern;
            }
        }

        return bestMatch;
    }

    private extractContextFeatures(context: any): Record<string, any> {
        return {
            strategicObjective: context.strategicObjective || 'general',
            riskTolerance: context.riskTolerance || 0.5,
            timeConstraint: context.timeConstraint || 3000,
            gamePhase: context.gamePhase || 'mid_game',
            playerCount: context.playerCount || 4,
            competitionLevel: context.competitionLevel || 'medium'
        };
    }

    private calculatePatternSimilarity(features1: Record<string, any>, features2: Record<string, any>): number {
        const commonKeys = Object.keys(features1).filter(key => key in features2);
        if (commonKeys.length === 0) return 0;

        let similarity = 0;
        for (const key of commonKeys) {
            const val1 = features1[key];
            const val2 = features2[key];
            
            if (typeof val1 === 'number' && typeof val2 === 'number') {
                similarity += 1 - Math.abs(val1 - val2) / Math.max(Math.abs(val1), Math.abs(val2), 1);
            } else {
                similarity += val1 === val2 ? 1 : 0;
            }
        }

        return similarity / commonKeys.length;
    }

    private blendWeights(weights1: AIComponentWeights, weights2: AIComponentWeights, ratio: number): AIComponentWeights {
        return {
            strategyNetwork: weights1.strategyNetwork * (1 - ratio) + weights2.strategyNetwork * ratio,
            predictiveAI: weights1.predictiveAI * (1 - ratio) + weights2.predictiveAI * ratio,
            planningAlgorithm: weights1.planningAlgorithm * (1 - ratio) + weights2.planningAlgorithm * ratio,
            behaviorTree: weights1.behaviorTree * (1 - ratio) + weights2.behaviorTree * ratio,
            reinforcementLearning: weights1.reinforcementLearning * (1 - ratio) + weights2.reinforcementLearning * ratio
        };
    }

    private calculatePerformanceAdjustments(currentPerformance: AIPerformanceMetrics): Partial<AIComponentWeights> {
        const adjustments: Partial<AIComponentWeights> = {};

        if (currentPerformance.decisionAccuracy < 0.5) {
            adjustments.strategyNetwork = 0.1;
        }

        if (currentPerformance.predictionAccuracy < 0.5) {
            adjustments.predictiveAI = 0.1;
        }

        if (currentPerformance.responseTime > 3000) {
            adjustments.behaviorTree = 0.1;
            adjustments.planningAlgorithm = -0.05;
        }

        if (currentPerformance.adaptability < 0.4) {
            adjustments.reinforcementLearning = 0.1;
        }

        return adjustments;
    }

    private applyAdjustments(baseWeights: AIComponentWeights, adjustments: Partial<AIComponentWeights>): AIComponentWeights {
        const adjusted: AIComponentWeights = { ...baseWeights };

        Object.entries(adjustments).forEach(([component, adjustment]) => {
            const key = component as keyof AIComponentWeights;
            adjusted[key] = Math.max(0.01, Math.min(0.8, adjusted[key] + (adjustment || 0)));
        });

        return adjusted;
    }

    private normalizeWeights(weights: AIComponentWeights): AIComponentWeights {
        const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
        const normalized: Partial<AIComponentWeights> = {};

        Object.entries(weights).forEach(([component, weight]) => {
            normalized[component as keyof AIComponentWeights] = weight / total;
        });

        return normalized as AIComponentWeights;
    }

    public async executeSwitching(
        newWeights: AIComponentWeights,
        ruleId: string,
        reason: string,
        context: any
    ): Promise<SwitchingEvent> {
        this.rollbackStack.push({ ...this.currentWeights });
        if (this.rollbackStack.length > 5) {
            this.rollbackStack.shift();
        }

        const switchingEvent: SwitchingEvent = {
            timestamp: Date.now(),
            fromConfiguration: { ...this.currentWeights },
            toConfiguration: { ...newWeights },
            triggerRuleId: ruleId,
            reason,
            success: false,
            performanceImpact: 0,
            contextSnapshot: { ...context }
        };

        try {
            this.currentWeights = { ...newWeights };
            this.lastSwitchTime = Date.now();
            this.ruleCooldowns.set(ruleId, Date.now());

            switchingEvent.success = true;
            
            this.switchingMetrics.set('totalSwitches', (this.switchingMetrics.get('totalSwitches') || 0) + 1);
            this.switchingMetrics.set('successfulSwitches', (this.switchingMetrics.get('successfulSwitches') || 0) + 1);

            console.log(`AI switching executed: ${reason}`);

        } catch (error) {
            console.error('Switching execution failed:', error);
            this.currentWeights = this.rollbackStack.pop() || this.currentWeights;
        }

        this.switchingHistory.push(switchingEvent);
        return switchingEvent;
    }

    public async evaluateSwitchingOutcome(
        switchingEvent: SwitchingEvent,
        newPerformance: AIPerformanceMetrics
    ): Promise<void> {
        if (this.performanceHistory.length < 2) return;

        const preformanceSnapshot = this.performanceHistory[this.performanceHistory.length - 2];
        const performanceImprovement = this.calculatePerformanceImprovement(preformanceSnapshot, newPerformance);

        switchingEvent.performanceImpact = performanceImprovement;

        if (performanceImprovement < this.config.rollbackThreshold) {
            await this.considerRollback(switchingEvent);
        } else {
            this.learnFromSuccessfulSwitch(switchingEvent);
        }

        this.updatePredictiveModels(switchingEvent, newPerformance);
    }

    private calculatePerformanceImprovement(before: AIPerformanceMetrics, after: AIPerformanceMetrics): number {
        const weights = {
            decisionAccuracy: 0.3,
            strategyEffectiveness: 0.25,
            predictionAccuracy: 0.2,
            consistency: 0.15,
            resourceEfficiency: 0.1
        };

        let improvement = 0;
        improvement += (after.decisionAccuracy - before.decisionAccuracy) * weights.decisionAccuracy;
        improvement += (after.strategyEffectiveness - before.strategyEffectiveness) * weights.strategyEffectiveness;
        improvement += (after.predictionAccuracy - before.predictionAccuracy) * weights.predictionAccuracy;
        improvement += (after.consistency - before.consistency) * weights.consistency;
        improvement += (after.resourceEfficiency - before.resourceEfficiency) * weights.resourceEfficiency;

        return improvement;
    }

    private async considerRollback(switchingEvent: SwitchingEvent): Promise<void> {
        if (this.rollbackStack.length === 0) return;

        const rollbackWeights = this.rollbackStack[this.rollbackStack.length - 1];
        
        console.warn(`Poor switching outcome (impact: ${switchingEvent.performanceImpact.toFixed(3)}), considering rollback`);

        this.currentWeights = { ...rollbackWeights };
        this.switchingMetrics.set('rollbacks', (this.switchingMetrics.get('rollbacks') || 0) + 1);

        this.adjustRuleConfidence(switchingEvent.triggerRuleId, -0.1);
    }

    private learnFromSuccessfulSwitch(switchingEvent: SwitchingEvent): void {
        this.adjustRuleConfidence(switchingEvent.triggerRuleId, 0.05);
        
        this.learnContextPattern(switchingEvent);
    }

    private adjustRuleConfidence(ruleId: string, adjustment: number): void {
        const rule = this.switchingRules.find(r => r.id === ruleId);
        if (rule) {
            rule.confidence = Math.max(0.1, Math.min(1.0, rule.confidence + adjustment));
        }
    }

    private learnContextPattern(switchingEvent: SwitchingEvent): void {
        const contextFeatures = this.extractContextFeatures(switchingEvent.contextSnapshot);
        const patternId = this.generatePatternId(contextFeatures);
        
        let pattern = this.contextPatterns.get(patternId);
        
        if (!pattern) {
            pattern = {
                id: patternId,
                name: `Pattern_${patternId}`,
                description: `Auto-learned pattern for context: ${JSON.stringify(contextFeatures)}`,
                features: contextFeatures,
                optimalWeights: switchingEvent.toConfiguration,
                confidence: 0.5,
                usageCount: 1,
                avgPerformance: switchingEvent.performanceImpact
            };
        } else {
            pattern.usageCount++;
            pattern.avgPerformance = (pattern.avgPerformance * (pattern.usageCount - 1) + switchingEvent.performanceImpact) / pattern.usageCount;
            pattern.confidence = Math.min(0.95, pattern.confidence + 0.05);
            
            pattern.optimalWeights = this.blendWeights(pattern.optimalWeights, switchingEvent.toConfiguration, 0.3);
        }
        
        this.contextPatterns.set(patternId, pattern);
    }

    private generatePatternId(features: Record<string, any>): string {
        const sortedKeys = Object.keys(features).sort();
        const keyValuePairs = sortedKeys.map(key => `${key}:${features[key]}`);
        return keyValuePairs.join('_').replace(/[^a-zA-Z0-9_]/g, '');
    }

    private updatePredictiveModels(switchingEvent: SwitchingEvent, newPerformance: AIPerformanceMetrics): void {
        const features = this.extractPredictiveFeatures(
            this.switchingRules.find(r => r.id === switchingEvent.triggerRuleId)!,
            newPerformance,
            switchingEvent.contextSnapshot
        );
        
        const performancePredictor = this.predictiveModels.get('performance_predictor');
        if (performancePredictor) {
            performancePredictor.predictions.set(
                `${switchingEvent.timestamp}`,
                switchingEvent.performanceImpact
            );
            
            if (performancePredictor.predictions.size > 100) {
                const oldestKey = Array.from(performancePredictor.predictions.keys())[0];
                performancePredictor.predictions.delete(oldestKey);
            }
        }
    }

    public getCurrentWeights(): AIComponentWeights {
        return { ...this.currentWeights };
    }

    public getSwitchingStatistics(): any {
        const totalSwitches = this.switchingMetrics.get('totalSwitches') || 0;
        const successfulSwitches = this.switchingMetrics.get('successfulSwitches') || 0;
        const rollbacks = this.switchingMetrics.get('rollbacks') || 0;

        const recentSwitches = this.switchingHistory.slice(-20);
        const avgImpact = recentSwitches.length > 0 ? 
            recentSwitches.reduce((sum, event) => sum + event.performanceImpact, 0) / recentSwitches.length : 0;

        const ruleUsage = new Map<string, number>();
        this.switchingHistory.forEach(event => {
            ruleUsage.set(event.triggerRuleId, (ruleUsage.get(event.triggerRuleId) || 0) + 1);
        });

        return {
            totalSwitches,
            successfulSwitches,
            rollbacks,
            successRate: totalSwitches > 0 ? successfulSwitches / totalSwitches : 0,
            avgPerformanceImpact: avgImpact,
            ruleUsageDistribution: Object.fromEntries(ruleUsage),
            learnedPatterns: this.contextPatterns.size,
            emergencyMode: this.emergencyMode,
            currentWeights: this.currentWeights
        };
    }

    public getRecommendations(): string[] {
        const recommendations: string[] = [];
        const stats = this.getSwitchingStatistics();

        if (stats.successRate < 0.6) {
            recommendations.push('Low switching success rate - consider adjusting rule conditions or thresholds');
        }

        if (stats.rollbacks > stats.totalSwitches * 0.3) {
            recommendations.push('High rollback rate - review prediction accuracy and rule confidence');
        }

        if (stats.avgPerformanceImpact < 0.1) {
            recommendations.push('Low average performance impact - consider more aggressive switching strategies');
        }

        if (this.contextPatterns.size < 5) {
            recommendations.push('Few learned patterns - increase exploration to learn more context-specific configurations');
        }

        if (this.emergencyMode) {
            recommendations.push('System in emergency mode - immediate attention required');
        }

        return recommendations;
    }
}