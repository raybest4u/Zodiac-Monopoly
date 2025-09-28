/**
 * 预测系统与AI决策集成
 * Predictive System and AI Decision Integration
 * 
 * 将预测系统与AI决策系统深度集成，实现前瞻性智能决策
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { PredictiveAI, PredictionHorizon, PlanningStrategy, PlanningResult, GameStateSnapshot } from './PredictiveAI';
import { GameStatePredictionEngine, PredictionModelType, PredictionAccuracy } from './GameStatePredictionEngine';
import { StrategicPlanningAlgorithm, PlanningAlgorithmType, PlanningObjective, PlanningConstraint } from './StrategicPlanningAlgorithm';
import { MLModelManager, MLModelType, TrainingConfig } from './MachineLearningModels';
import { AIDecisionIntegration, DecisionType, DecisionContext, DecisionResult } from '../behavior/AIDecisionIntegration';

// 集成配置
export interface PredictiveDecisionConfig {
    predictionHorizon: PredictionHorizon;
    planningStrategy: PlanningStrategy;
    planningAlgorithm: PlanningAlgorithmType;
    mlModelType: MLModelType;
    predictionAccuracy: PredictionAccuracy;
    enableRealTimeLearning: boolean;
    enableAdaptiveStrategy: boolean;
    confidenceThreshold: number;
    planUpdateFrequency: number;
    maxPlanDepth: number;
    adaptationSensitivity: number;
}

// 决策评估结果
export interface DecisionEvaluation {
    originalDecision: DecisionResult;
    predictedOutcomes: Map<PredictionHorizon, any>;
    riskAssessment: any;
    alternativeDecisions: DecisionResult[];
    recommendedDecision: DecisionResult;
    confidence: number;
    reasoning: string[];
    adaptationSuggestions: string[];
}

// 策略适应结果
export interface StrategyAdaptation {
    originalStrategy: PlanningStrategy;
    adaptedStrategy: PlanningStrategy;
    adaptationReason: string;
    confidenceGain: number;
    expectedImprovement: number;
    adaptationCost: number;
}

// 学习反馈
export interface LearningFeedback {
    predictionAccuracy: number;
    decisionQuality: number;
    strategyEffectiveness: number;
    adaptationSuccess: number;
    improvementSuggestions: string[];
    modelUpdatesNeeded: MLModelType[];
}

// 预测决策集成器主类
export class PredictiveDecisionIntegration extends EventEmitter {
    private config: PredictiveDecisionConfig;
    private predictiveAI: PredictiveAI;
    private predictionEngine: GameStatePredictionEngine;
    private planningAlgorithm: StrategicPlanningAlgorithm;
    private mlModelManager: MLModelManager;
    private aiDecisionIntegration: AIDecisionIntegration;
    
    private currentPlans: Map<string, PlanningResult>;
    private predictionHistory: Map<string, any[]>;
    private decisionHistory: Map<string, DecisionResult[]>;
    private learningMetrics: Map<string, number>;
    private adaptationHistory: StrategyAdaptation[];
    private isActive: boolean;

    constructor(
        config: PredictiveDecisionConfig,
        aiDecisionIntegration: AIDecisionIntegration
    ) {
        super();
        this.config = { ...config };
        this.aiDecisionIntegration = aiDecisionIntegration;
        
        // 初始化预测组件
        this.predictiveAI = new PredictiveAI({
            defaultHorizon: config.predictionHorizon,
            confidenceThreshold: config.confidenceThreshold,
            maxPredictionAge: 300000,
            enableUncertaintyQuantification: true,
            monteCarloSamples: 1000,
            adaptiveLearning: config.enableRealTimeLearning
        });
        
        this.predictionEngine = new GameStatePredictionEngine({
            defaultModel: PredictionModelType.ENSEMBLE,
            accuracyLevel: config.predictionAccuracy,
            maxSimulations: 500,
            parallelSimulations: true,
            enableCaching: true,
            cacheSize: 1000,
            enableLearning: config.enableRealTimeLearning,
            learningRate: 0.01,
            modelWeights: new Map([
                [PredictionModelType.NEURAL_NETWORK, 0.3],
                [PredictionModelType.MONTE_CARLO, 0.3],
                [PredictionModelType.MARKOV_CHAIN, 0.2],
                [PredictionModelType.REGRESSION, 0.2]
            ])
        });
        
        this.planningAlgorithm = new StrategicPlanningAlgorithm({
            algorithm: config.planningAlgorithm,
            maxDepth: config.maxPlanDepth,
            maxIterations: 1000,
            timeLimit: 10000,
            explorationConstant: 1.414,
            discountFactor: 0.95,
            beamWidth: 5,
            populationSize: 50,
            mutationRate: 0.1,
            enablePruning: true,
            enableMemoization: true,
            parallelSearch: true
        });
        
        this.mlModelManager = new MLModelManager();
        
        this.currentPlans = new Map();
        this.predictionHistory = new Map();
        this.decisionHistory = new Map();
        this.learningMetrics = new Map();
        this.adaptationHistory = [];
        this.isActive = false;

        this.setupEventHandlers();
    }

    // 设置事件处理器
    private setupEventHandlers(): void {
        // 预测AI事件
        this.predictiveAI.on('prediction_generated', (event) => {
            this.handlePredictionGenerated(event);
        });

        // 预测引擎事件
        this.predictionEngine.on('prediction_completed', (event) => {
            this.handlePredictionCompleted(event);
        });

        // 规划算法事件
        this.planningAlgorithm.on('mcts_progress', (event) => {
            this.emit('planning_progress', event);
        });

        // ML模型事件
        this.mlModelManager.on('training_completed', (event) => {
            this.handleModelTrainingCompleted(event);
        });

        // AI决策集成事件
        this.aiDecisionIntegration.on('decision_made', (event) => {
            this.handleDecisionMade(event);
        });
    }

    // 启动预测决策集成
    async start(): Promise<void> {
        if (this.isActive) return;

        this.isActive = true;
        
        await this.predictiveAI.start();
        
        this.emit('integration_started');
    }

    // 停止预测决策集成
    async stop(): Promise<void> {
        if (!this.isActive) return;

        this.isActive = false;
        
        await this.predictiveAI.stop();
        
        this.emit('integration_stopped');
    }

    // 预测增强决策
    async makePredictiveDecision(
        type: DecisionType,
        context: DecisionContext,
        gameHistory: GameStateSnapshot[]
    ): Promise<DecisionEvaluation> {
        if (!this.isActive) {
            throw new Error('Predictive decision integration is not active');
        }

        // 1. 获取基础AI决策
        const originalDecision = await this.aiDecisionIntegration.makeDecision(type, context);

        // 2. 生成预测
        const predictions = await this.generatePredictions(context, gameHistory);

        // 3. 评估决策影响
        const riskAssessment = await this.assessDecisionRisk(originalDecision, predictions, context);

        // 4. 生成替代方案
        const alternativeDecisions = await this.generateAlternativeDecisions(originalDecision, context, predictions);

        // 5. 选择最佳决策
        const recommendedDecision = await this.selectBestDecision(
            originalDecision,
            alternativeDecisions,
            predictions,
            riskAssessment
        );

        // 6. 生成推理说明
        const reasoning = this.generateDecisionReasoning(
            originalDecision,
            recommendedDecision,
            predictions,
            riskAssessment
        );

        // 7. 生成适应建议
        const adaptationSuggestions = await this.generateAdaptationSuggestions(
            context,
            predictions,
            recommendedDecision
        );

        const evaluation: DecisionEvaluation = {
            originalDecision,
            predictedOutcomes: predictions,
            riskAssessment,
            alternativeDecisions,
            recommendedDecision,
            confidence: this.calculateOverallConfidence(predictions, recommendedDecision),
            reasoning,
            adaptationSuggestions
        };

        // 记录决策历史
        this.recordDecisionEvaluation(context.playerId, evaluation);

        this.emit('predictive_decision_made', {
            type,
            playerId: context.playerId,
            evaluation
        });

        return evaluation;
    }

    // 生成预测
    private async generatePredictions(
        context: DecisionContext,
        gameHistory: GameStateSnapshot[]
    ): Promise<Map<PredictionHorizon, any>> {
        const predictions = new Map<PredictionHorizon, any>();

        // 添加游戏历史到预测引擎
        for (const state of gameHistory) {
            this.predictionEngine.addGameState(state);
        }

        const horizons = [
            PredictionHorizon.SHORT_TERM,
            PredictionHorizon.MEDIUM_TERM,
            PredictionHorizon.LONG_TERM
        ];

        for (const horizon of horizons) {
            try {
                // 游戏状态预测
                const statePrediction = await this.predictionEngine.predictGameState(
                    context.gameState,
                    horizon
                );

                // AI预测系统预测
                const aiPrediction = await this.predictiveAI.predict(
                    'game_state' as any,
                    horizon,
                    context.playerId
                );

                // ML模型预测
                const mlPrediction = await this.mlModelManager.predict(
                    context.gameState,
                    context.playerId,
                    gameHistory
                );

                predictions.set(horizon, {
                    statePrediction,
                    aiPrediction,
                    mlPrediction,
                    combinedConfidence: (statePrediction.confidence + aiPrediction.confidence + mlPrediction.confidence) / 3
                });

            } catch (error) {
                console.warn(`Prediction failed for horizon ${horizon}:`, error);
                predictions.set(horizon, {
                    error: error.message,
                    combinedConfidence: 0
                });
            }
        }

        return predictions;
    }

    // 评估决策风险
    private async assessDecisionRisk(
        decision: DecisionResult,
        predictions: Map<PredictionHorizon, any>,
        context: DecisionContext
    ): Promise<any> {
        const riskFactors = new Map<string, number>();
        
        // 基于预测结果评估风险
        for (const [horizon, prediction] of predictions) {
            if (prediction.error) continue;

            const confidence = prediction.combinedConfidence;
            const uncertaintyRisk = 1 - confidence;
            
            riskFactors.set(`${horizon}_uncertainty`, uncertaintyRisk);
            
            // 特定决策类型的风险评估
            switch (decision.type) {
                case DecisionType.PROPERTY_PURCHASE:
                    riskFactors.set(`${horizon}_liquidity_risk`, this.calculateLiquidityRisk(context, prediction));
                    riskFactors.set(`${horizon}_market_risk`, this.calculateMarketRisk(prediction));
                    break;
                case DecisionType.TRADE_NEGOTIATION:
                    riskFactors.set(`${horizon}_relationship_risk`, this.calculateRelationshipRisk(context, prediction));
                    riskFactors.set(`${horizon}_opportunity_risk`, this.calculateOpportunityRisk(prediction));
                    break;
            }
        }

        const overallRisk = Array.from(riskFactors.values()).reduce((sum, risk) => sum + risk, 0) / riskFactors.size;

        return {
            overallRisk,
            riskFactors,
            riskLevel: this.categorizeRiskLevel(overallRisk),
            mitigationRecommendations: this.generateRiskMitigation(riskFactors, decision)
        };
    }

    // 生成替代决策方案
    private async generateAlternativeDecisions(
        originalDecision: DecisionResult,
        context: DecisionContext,
        predictions: Map<PredictionHorizon, any>
    ): Promise<DecisionResult[]> {
        const alternatives: DecisionResult[] = [];

        // 基于预测结果调整决策参数
        const adjustmentFactors = this.calculateAdjustmentFactors(predictions);

        // 生成保守方案
        const conservativeDecision = this.createConservativeAlternative(originalDecision, adjustmentFactors);
        alternatives.push(conservativeDecision);

        // 生成激进方案
        const aggressiveDecision = this.createAggressiveAlternative(originalDecision, adjustmentFactors);
        alternatives.push(aggressiveDecision);

        // 生成平衡方案
        const balancedDecision = this.createBalancedAlternative(originalDecision, adjustmentFactors);
        alternatives.push(balancedDecision);

        // 基于预测不确定性生成适应性方案
        if (this.hasHighUncertainty(predictions)) {
            const adaptiveDecision = this.createAdaptiveAlternative(originalDecision, predictions);
            alternatives.push(adaptiveDecision);
        }

        return alternatives;
    }

    // 选择最佳决策
    private async selectBestDecision(
        originalDecision: DecisionResult,
        alternatives: DecisionResult[],
        predictions: Map<PredictionHorizon, any>,
        riskAssessment: any
    ): Promise<DecisionResult> {
        const allDecisions = [originalDecision, ...alternatives];
        const scores = new Map<DecisionResult, number>();

        for (const decision of allDecisions) {
            let score = decision.confidence;

            // 基于预测调整分数
            for (const [horizon, prediction] of predictions) {
                if (!prediction.error) {
                    score += prediction.combinedConfidence * this.getHorizonWeight(horizon);
                }
            }

            // 基于风险调整分数
            const riskPenalty = riskAssessment.overallRisk * 0.3;
            score -= riskPenalty;

            // 基于决策类型调整分数
            score += this.getDecisionTypeBonus(decision, predictions);

            scores.set(decision, score);
        }

        // 选择得分最高的决策
        const bestDecision = allDecisions.reduce((best, current) => 
            scores.get(current)! > scores.get(best)! ? current : best
        );

        return bestDecision;
    }

    // 生成决策推理
    private generateDecisionReasoning(
        originalDecision: DecisionResult,
        recommendedDecision: DecisionResult,
        predictions: Map<PredictionHorizon, any>,
        riskAssessment: any
    ): string[] {
        const reasoning: string[] = [];

        if (originalDecision === recommendedDecision) {
            reasoning.push('原始AI决策经过预测分析验证，被确认为最优选择');
        } else {
            reasoning.push('基于预测分析，推荐使用替代决策方案');
            reasoning.push(`置信度从 ${originalDecision.confidence.toFixed(2)} 提升到 ${recommendedDecision.confidence.toFixed(2)}`);
        }

        // 基于预测结果的推理
        for (const [horizon, prediction] of predictions) {
            if (!prediction.error && prediction.combinedConfidence > 0.7) {
                reasoning.push(`${horizon} 预测显示高置信度 (${prediction.combinedConfidence.toFixed(2)})`);
            }
        }

        // 基于风险评估的推理
        if (riskAssessment.overallRisk > 0.7) {
            reasoning.push(`决策风险较高 (${riskAssessment.overallRisk.toFixed(2)})，建议谨慎执行`);
        } else if (riskAssessment.overallRisk < 0.3) {
            reasoning.push(`决策风险较低 (${riskAssessment.overallRisk.toFixed(2)})，可以安全执行`);
        }

        return reasoning;
    }

    // 生成适应建议
    private async generateAdaptationSuggestions(
        context: DecisionContext,
        predictions: Map<PredictionHorizon, any>,
        decision: DecisionResult
    ): Promise<string[]> {
        const suggestions: string[] = [];

        // 基于预测不确定性的建议
        const avgConfidence = this.calculateAverageConfidence(predictions);
        if (avgConfidence < 0.6) {
            suggestions.push('预测不确定性较高，建议增加监控频率');
            suggestions.push('考虑采用更保守的策略，直到获得更多信息');
        }

        // 基于市场趋势的建议
        if (this.detectMarketTrendChange(predictions)) {
            suggestions.push('检测到市场趋势变化，建议调整长期策略');
        }

        // 基于竞争状况的建议
        if (this.detectCompetitionIntensification(predictions)) {
            suggestions.push('竞争加剧，建议加快决策执行速度');
        }

        // 基于资源状况的建议
        if (this.detectResourceConstraints(context, predictions)) {
            suggestions.push('资源约束预警，建议优化资源配置');
        }

        return suggestions;
    }

    // 适应策略
    async adaptStrategy(
        playerId: string,
        currentStrategy: PlanningStrategy,
        gameHistory: GameStateSnapshot[]
    ): Promise<StrategyAdaptation> {
        if (!this.config.enableAdaptiveStrategy) {
            return {
                originalStrategy: currentStrategy,
                adaptedStrategy: currentStrategy,
                adaptationReason: 'Adaptive strategy is disabled',
                confidenceGain: 0,
                expectedImprovement: 0,
                adaptationCost: 0
            };
        }

        // 分析当前策略效果
        const strategyEffectiveness = await this.analyzeStrategyEffectiveness(playerId, currentStrategy, gameHistory);

        // 检测环境变化
        const environmentChanges = await this.detectEnvironmentChanges(gameHistory);

        // 计算适应需求
        const adaptationNeed = this.calculateAdaptationNeed(strategyEffectiveness, environmentChanges);

        if (adaptationNeed < this.config.adaptationSensitivity) {
            return {
                originalStrategy: currentStrategy,
                adaptedStrategy: currentStrategy,
                adaptationReason: 'Current strategy is performing well',
                confidenceGain: 0,
                expectedImprovement: 0,
                adaptationCost: 0
            };
        }

        // 选择新策略
        const adaptedStrategy = await this.selectAdaptedStrategy(
            currentStrategy,
            environmentChanges,
            strategyEffectiveness
        );

        const adaptation: StrategyAdaptation = {
            originalStrategy: currentStrategy,
            adaptedStrategy,
            adaptationReason: this.generateAdaptationReason(environmentChanges, strategyEffectiveness),
            confidenceGain: this.calculateConfidenceGain(currentStrategy, adaptedStrategy),
            expectedImprovement: this.calculateExpectedImprovement(currentStrategy, adaptedStrategy),
            adaptationCost: this.calculateAdaptationCost(currentStrategy, adaptedStrategy)
        };

        this.adaptationHistory.push(adaptation);

        this.emit('strategy_adapted', {
            playerId,
            adaptation
        });

        return adaptation;
    }

    // 学习反馈
    async provideLearningFeedback(
        playerId: string,
        actualOutcome: any,
        predictedOutcome: any,
        decisionResult: DecisionResult
    ): Promise<LearningFeedback> {
        // 计算预测准确性
        const predictionAccuracy = this.calculatePredictionAccuracy(actualOutcome, predictedOutcome);

        // 评估决策质量
        const decisionQuality = this.evaluateDecisionQuality(decisionResult, actualOutcome);

        // 评估策略有效性
        const strategyEffectiveness = await this.evaluateStrategyEffectiveness(playerId, actualOutcome);

        // 评估适应成功率
        const adaptationSuccess = this.evaluateAdaptationSuccess(playerId);

        // 生成改进建议
        const improvementSuggestions = this.generateImprovementSuggestions(
            predictionAccuracy,
            decisionQuality,
            strategyEffectiveness
        );

        // 确定需要更新的模型
        const modelUpdatesNeeded = this.identifyModelsNeedingUpdate(
            predictionAccuracy,
            decisionQuality
        );

        const feedback: LearningFeedback = {
            predictionAccuracy,
            decisionQuality,
            strategyEffectiveness,
            adaptationSuccess,
            improvementSuggestions,
            modelUpdatesNeeded
        };

        // 应用学习反馈
        await this.applyLearningFeedback(feedback);

        this.emit('learning_feedback_provided', {
            playerId,
            feedback
        });

        return feedback;
    }

    // 事件处理方法
    private handlePredictionGenerated(event: any): void {
        const playerId = event.context?.playerId;
        if (playerId) {
            if (!this.predictionHistory.has(playerId)) {
                this.predictionHistory.set(playerId, []);
            }
            this.predictionHistory.get(playerId)!.push(event);
        }
    }

    private handlePredictionCompleted(event: any): void {
        this.updateLearningMetrics('prediction_completion_rate', 1);
    }

    private handleModelTrainingCompleted(event: any): void {
        this.updateLearningMetrics('model_training_completions', 1);
    }

    private handleDecisionMade(event: any): void {
        const playerId = event.context?.playerId;
        if (playerId) {
            if (!this.decisionHistory.has(playerId)) {
                this.decisionHistory.set(playerId, []);
            }
            this.decisionHistory.get(playerId)!.push(event.decision);
        }
    }

    // 辅助方法实现（简化版本）
    private calculateLiquidityRisk(context: DecisionContext, prediction: any): number { return Math.random() * 0.5; }
    private calculateMarketRisk(prediction: any): number { return Math.random() * 0.4; }
    private calculateRelationshipRisk(context: DecisionContext, prediction: any): number { return Math.random() * 0.3; }
    private calculateOpportunityRisk(prediction: any): number { return Math.random() * 0.6; }
    private categorizeRiskLevel(risk: number): string {
        if (risk < 0.3) return 'low';
        if (risk < 0.7) return 'medium';
        return 'high';
    }
    private generateRiskMitigation(riskFactors: Map<string, number>, decision: DecisionResult): string[] {
        return ['增加监控', '分散投资', '保持流动性'];
    }
    private calculateAdjustmentFactors(predictions: Map<PredictionHorizon, any>): Map<string, number> {
        return new Map([['conservative', 0.8], ['aggressive', 1.2], ['balanced', 1.0]]);
    }
    private createConservativeAlternative(original: DecisionResult, factors: Map<string, number>): DecisionResult {
        return { ...original, confidence: original.confidence * 0.9, reasoning: [...original.reasoning, 'Conservative adjustment'] };
    }
    private createAggressiveAlternative(original: DecisionResult, factors: Map<string, number>): DecisionResult {
        return { ...original, confidence: original.confidence * 1.1, reasoning: [...original.reasoning, 'Aggressive adjustment'] };
    }
    private createBalancedAlternative(original: DecisionResult, factors: Map<string, number>): DecisionResult {
        return { ...original, reasoning: [...original.reasoning, 'Balanced adjustment'] };
    }
    private hasHighUncertainty(predictions: Map<PredictionHorizon, any>): boolean {
        return this.calculateAverageConfidence(predictions) < 0.6;
    }
    private createAdaptiveAlternative(original: DecisionResult, predictions: Map<PredictionHorizon, any>): DecisionResult {
        return { ...original, reasoning: [...original.reasoning, 'Adaptive to uncertainty'] };
    }
    private calculateOverallConfidence(predictions: Map<PredictionHorizon, any>, decision: DecisionResult): number {
        const avgPredictionConfidence = this.calculateAverageConfidence(predictions);
        return (avgPredictionConfidence + decision.confidence) / 2;
    }
    private getHorizonWeight(horizon: PredictionHorizon): number {
        switch (horizon) {
            case PredictionHorizon.SHORT_TERM: return 0.5;
            case PredictionHorizon.MEDIUM_TERM: return 0.3;
            case PredictionHorizon.LONG_TERM: return 0.2;
            default: return 0.1;
        }
    }
    private getDecisionTypeBonus(decision: DecisionResult, predictions: Map<PredictionHorizon, any>): number {
        return 0.1; // 简化实现
    }
    private calculateAverageConfidence(predictions: Map<PredictionHorizon, any>): number {
        const validPredictions = Array.from(predictions.values()).filter(p => !p.error);
        if (validPredictions.length === 0) return 0;
        return validPredictions.reduce((sum, p) => sum + p.combinedConfidence, 0) / validPredictions.length;
    }
    private detectMarketTrendChange(predictions: Map<PredictionHorizon, any>): boolean { return Math.random() < 0.2; }
    private detectCompetitionIntensification(predictions: Map<PredictionHorizon, any>): boolean { return Math.random() < 0.3; }
    private detectResourceConstraints(context: DecisionContext, predictions: Map<PredictionHorizon, any>): boolean { return Math.random() < 0.4; }

    // 更多辅助方法的简化实现
    private async analyzeStrategyEffectiveness(playerId: string, strategy: PlanningStrategy, history: GameStateSnapshot[]): Promise<number> { return Math.random(); }
    private async detectEnvironmentChanges(history: GameStateSnapshot[]): Promise<Map<string, number>> { return new Map(); }
    private calculateAdaptationNeed(effectiveness: number, changes: Map<string, number>): number { return Math.random(); }
    private async selectAdaptedStrategy(current: PlanningStrategy, changes: Map<string, number>, effectiveness: number): Promise<PlanningStrategy> { return current; }
    private generateAdaptationReason(changes: Map<string, number>, effectiveness: number): string { return 'Environmental changes detected'; }
    private calculateConfidenceGain(old: PlanningStrategy, new_: PlanningStrategy): number { return Math.random() * 0.2; }
    private calculateExpectedImprovement(old: PlanningStrategy, new_: PlanningStrategy): number { return Math.random() * 0.3; }
    private calculateAdaptationCost(old: PlanningStrategy, new_: PlanningStrategy): number { return Math.random() * 0.1; }
    private calculatePredictionAccuracy(actual: any, predicted: any): number { return Math.random() * 0.4 + 0.6; }
    private evaluateDecisionQuality(decision: DecisionResult, outcome: any): number { return Math.random() * 0.3 + 0.7; }
    private async evaluateStrategyEffectiveness(playerId: string, outcome: any): Promise<number> { return Math.random() * 0.2 + 0.8; }
    private evaluateAdaptationSuccess(playerId: string): number { return Math.random() * 0.4 + 0.6; }
    private generateImprovementSuggestions(predAcc: number, decQual: number, stratEff: number): string[] {
        return ['提高预测精度', '优化决策逻辑', '调整策略参数'];
    }
    private identifyModelsNeedingUpdate(predAcc: number, decQual: number): MLModelType[] {
        const models: MLModelType[] = [];
        if (predAcc < 0.7) models.push(MLModelType.NEURAL_NETWORK);
        if (decQual < 0.7) models.push(MLModelType.RANDOM_FOREST);
        return models;
    }
    private async applyLearningFeedback(feedback: LearningFeedback): Promise<void> {
        // 应用学习反馈的逻辑
    }
    private recordDecisionEvaluation(playerId: string, evaluation: DecisionEvaluation): void {
        // 记录决策评估
    }
    private updateLearningMetrics(metric: string, value: number): void {
        const current = this.learningMetrics.get(metric) || 0;
        this.learningMetrics.set(metric, current + value);
    }

    // 公共接口方法
    getConfiguration(): PredictiveDecisionConfig {
        return { ...this.config };
    }

    updateConfiguration(newConfig: Partial<PredictiveDecisionConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.emit('configuration_updated', { config: this.config });
    }

    getLearningMetrics(): Map<string, number> {
        return new Map(this.learningMetrics);
    }

    getAdaptationHistory(): StrategyAdaptation[] {
        return [...this.adaptationHistory];
    }

    exportIntegrationData(): any {
        return {
            config: this.config,
            currentPlans: Object.fromEntries(this.currentPlans),
            predictionHistory: Object.fromEntries(this.predictionHistory),
            decisionHistory: Object.fromEntries(this.decisionHistory),
            learningMetrics: Object.fromEntries(this.learningMetrics),
            adaptationHistory: this.adaptationHistory
        };
    }
}