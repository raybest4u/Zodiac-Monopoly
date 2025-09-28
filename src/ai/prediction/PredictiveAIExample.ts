/**
 * 预测和规划AI完整使用示例
 * Complete Predictive and Planning AI Usage Example
 * 
 * 展示如何使用预测和规划AI系统进行前瞻性决策
 */

import { 
    PredictiveAI, 
    PredictionHorizon, 
    PlanningStrategy, 
    GameStateSnapshot, 
    PlayerSnapshot,
    MarketSnapshot,
    BoardSnapshot
} from './PredictiveAI';

import { 
    GameStatePredictionEngine, 
    PredictionModelType, 
    PredictionAccuracy 
} from './GameStatePredictionEngine';

import { 
    StrategicPlanningAlgorithm, 
    PlanningAlgorithmType, 
    ObjectiveType, 
    PlanningObjective, 
    PlanningConstraint, 
    ConstraintType 
} from './StrategicPlanningAlgorithm';

import { 
    MLModelManager, 
    MLModelType, 
    TrainingConfig, 
    GameFeatureExtractor 
} from './MachineLearningModels';

import { 
    PredictiveDecisionIntegration, 
    PredictiveDecisionConfig 
} from './PredictiveDecisionIntegration';

import { 
    PredictionValidationOptimization, 
    ValidationConfig, 
    ValidationMetric 
} from './PredictionValidationOptimization';

import { AIDecisionIntegration, DecisionType, DecisionContext } from '../behavior/AIDecisionIntegration';
import { CompositeBehaviorController, BehaviorControlMode } from '../behavior/CompositeBehaviorController';

// 预测AI示例类
export class PredictiveAIExample {
    private predictiveAI: PredictiveAI;
    private predictionEngine: GameStatePredictionEngine;
    private planningAlgorithm: StrategicPlanningAlgorithm;
    private mlModelManager: MLModelManager;
    private decisionIntegration: PredictiveDecisionIntegration;
    private validationSystem: PredictionValidationOptimization;
    private aiDecisionIntegration: AIDecisionIntegration;

    constructor() {
        this.initializeComponents();
    }

    // 初始化所有组件
    private initializeComponents(): void {
        console.log('🚀 初始化预测和规划AI系统...');

        // 1. 初始化基础预测AI
        this.predictiveAI = new PredictiveAI({
            defaultHorizon: PredictionHorizon.MEDIUM_TERM,
            confidenceThreshold: 0.7,
            maxPredictionAge: 300000,
            enableUncertaintyQuantification: true,
            monteCarloSamples: 1000,
            adaptiveLearning: true
        });

        // 2. 初始化游戏状态预测引擎
        this.predictionEngine = new GameStatePredictionEngine({
            defaultModel: PredictionModelType.ENSEMBLE,
            accuracyLevel: PredictionAccuracy.HIGH,
            maxSimulations: 500,
            parallelSimulations: true,
            enableCaching: true,
            cacheSize: 1000,
            enableLearning: true,
            learningRate: 0.01,
            modelWeights: new Map([
                [PredictionModelType.NEURAL_NETWORK, 0.3],
                [PredictionModelType.MONTE_CARLO, 0.3],
                [PredictionModelType.MARKOV_CHAIN, 0.2],
                [PredictionModelType.REGRESSION, 0.2]
            ])
        });

        // 3. 初始化战略规划算法
        this.planningAlgorithm = new StrategicPlanningAlgorithm({
            algorithm: PlanningAlgorithmType.MCTS,
            maxDepth: 10,
            maxIterations: 1000,
            timeLimit: 15000,
            explorationConstant: 1.414,
            discountFactor: 0.95,
            beamWidth: 5,
            populationSize: 50,
            mutationRate: 0.1,
            enablePruning: true,
            enableMemoization: true,
            parallelSearch: true
        });

        // 4. 初始化机器学习模型管理器
        this.mlModelManager = new MLModelManager();

        // 5. 初始化AI决策集成（简化）
        const behaviorController = new CompositeBehaviorController({
            mode: BehaviorControlMode.COLLABORATIVE,
            tickInterval: 100,
            enableLogging: true,
            enableMetrics: true,
            weights: {
                behaviorTree: 0.6,
                stateMachine: 0.4,
                external: 0.0
            },
            conflictResolution: 'weighted',
            maxExecutionTime: 5000
        });

        this.aiDecisionIntegration = new AIDecisionIntegration(behaviorController);

        // 6. 初始化预测决策集成
        const decisionConfig: PredictiveDecisionConfig = {
            predictionHorizon: PredictionHorizon.MEDIUM_TERM,
            planningStrategy: PlanningStrategy.ADAPTIVE_STRATEGY,
            planningAlgorithm: PlanningAlgorithmType.MCTS,
            mlModelType: MLModelType.NEURAL_NETWORK,
            predictionAccuracy: PredictionAccuracy.HIGH,
            enableRealTimeLearning: true,
            enableAdaptiveStrategy: true,
            confidenceThreshold: 0.7,
            planUpdateFrequency: 5000,
            maxPlanDepth: 10,
            adaptationSensitivity: 0.3
        };

        this.decisionIntegration = new PredictiveDecisionIntegration(
            decisionConfig,
            this.aiDecisionIntegration
        );

        // 7. 初始化验证优化系统
        const validationConfig: ValidationConfig = {
            enableRealTimeValidation: true,
            validationFrequency: 10000,
            historicalDataWindow: 100,
            confidenceThreshold: 0.7,
            accuracyThreshold: 0.75,
            enableAutomaticOptimization: true,
            optimizationTriggerThreshold: 0.6,
            maxOptimizationIterations: 5,
            validationMetrics: [
                ValidationMetric.ACCURACY,
                ValidationMetric.PRECISION,
                ValidationMetric.CONFIDENCE_CALIBRATION,
                ValidationMetric.MAE,
                ValidationMetric.PREDICTION_STABILITY
            ]
        };

        this.validationSystem = new PredictionValidationOptimization(validationConfig);

        console.log('✅ 所有组件初始化完成');
    }

    // 运行完整示例
    async runCompleteExample(): Promise<void> {
        console.log('\n🎯 开始预测和规划AI完整示例...');

        try {
            // 1. 启动所有系统
            await this.startSystems();

            // 2. 创建模拟游戏数据
            const gameHistory = this.createMockGameHistory();

            // 3. 训练机器学习模型
            await this.trainMLModels(gameHistory);

            // 4. 演示预测功能
            await this.demonstratePrediction(gameHistory);

            // 5. 演示战略规划
            await this.demonstrateStrategicPlanning(gameHistory);

            // 6. 演示预测增强决策
            await this.demonstratePredictiveDecision(gameHistory);

            // 7. 演示验证和优化
            await this.demonstrateValidationOptimization(gameHistory);

            // 8. 演示自适应策略
            await this.demonstrateAdaptiveStrategy(gameHistory);

            // 9. 生成完整报告
            this.generateComprehensiveReport();

            console.log('\n✅ 预测和规划AI示例运行完成！');

        } catch (error) {
            console.error('❌ 示例运行失败:', error);
        }
    }

    // 启动所有系统
    private async startSystems(): Promise<void> {
        console.log('\n🔧 启动所有预测系统...');

        await this.predictiveAI.start();
        await this.decisionIntegration.start();
        this.validationSystem.start();

        console.log('✅ 所有系统启动完成');
    }

    // 创建模拟游戏历史
    private createMockGameHistory(): GameStateSnapshot[] {
        console.log('\n📊 创建模拟游戏历史数据...');

        const history: GameStateSnapshot[] = [];
        const playerIds = ['player_1', 'player_2', 'player_3'];

        for (let turn = 1; turn <= 20; turn++) {
            const players = new Map<string, PlayerSnapshot>();

            for (const playerId of playerIds) {
                players.set(playerId, {
                    id: playerId,
                    cash: 1500 + (Math.random() - 0.5) * 1000 + turn * 50,
                    position: Math.floor(Math.random() * 40),
                    properties: this.generateProperties(turn),
                    buildings: new Map(this.generateBuildings(turn)),
                    netWorth: 0, // 会在后面计算
                    cashFlow: (Math.random() - 0.5) * 200,
                    riskLevel: Math.random(),
                    strategy: this.selectRandomStrategy()
                });
            }

            // 计算净资产
            for (const player of players.values()) {
                player.netWorth = player.cash + player.properties.length * 200 + 
                    Array.from(player.buildings.values()).reduce((sum, level) => sum + level * 100, 0);
            }

            const market: MarketSnapshot = {
                trend: this.selectRandomMarketTrend(),
                volatility: Math.random() * 0.5 + 0.2,
                liquidityIndex: Math.random() * 0.6 + 0.4,
                averagePropertyPrice: 200 + turn * 10 + (Math.random() - 0.5) * 100,
                demandSupplyRatio: Math.random() * 0.8 + 0.8
            };

            const board: BoardSnapshot = {
                occupiedProperties: new Set(this.generateOccupiedProperties()),
                monopolies: new Map(),
                developmentLevel: new Map(),
                highValueAreas: ['area_1', 'area_2']
            };

            history.push({
                timestamp: Date.now() - (20 - turn) * 60000,
                turn,
                players,
                market,
                board,
                events: [`turn_${turn}_events`]
            });
        }

        console.log(`✅ 创建了 ${history.length} 个游戏状态快照`);
        return history;
    }

    // 训练机器学习模型
    private async trainMLModels(gameHistory: GameStateSnapshot[]): Promise<void> {
        console.log('\n🧠 训练机器学习模型...');

        const playerId = 'player_1';
        const trainingData = this.mlModelManager.prepareTrainingData(gameHistory, playerId);

        const trainingConfig: TrainingConfig = {
            batchSize: 8,
            epochs: 50,
            learningRate: 0.001,
            validationSplit: 0.2,
            earlyStopPatience: 10,
            regularization: 0.01,
            dropoutRate: 0.2,
            optimizer: 'adam',
            lossFunction: 'mse',
            metrics: ['accuracy', 'mae']
        };

        try {
            // 训练神经网络模型
            const nnEvaluation = await this.mlModelManager.trainModel(
                MLModelType.NEURAL_NETWORK,
                trainingData,
                trainingConfig
            );

            console.log(`✅ 神经网络训练完成，准确率: ${nnEvaluation.accuracy.toFixed(3)}`);

            // 训练随机森林模型
            const rfEvaluation = await this.mlModelManager.trainModel(
                MLModelType.RANDOM_FOREST,
                trainingData,
                trainingConfig
            );

            console.log(`✅ 随机森林训练完成，准确率: ${rfEvaluation.accuracy.toFixed(3)}`);

            // 设置活跃模型
            this.mlModelManager.setActiveModel(MLModelType.NEURAL_NETWORK);

        } catch (error) {
            console.warn('⚠️ 模型训练失败:', error.message);
        }
    }

    // 演示预测功能
    private async demonstratePrediction(gameHistory: GameStateSnapshot[]): Promise<void> {
        console.log('\n🔮 演示预测功能...');

        const currentState = gameHistory[gameHistory.length - 1];
        const playerId = 'player_1';

        try {
            // 添加历史数据到预测引擎
            for (const state of gameHistory) {
                this.predictionEngine.addGameState(state);
            }

            // 短期预测
            const shortTermPrediction = await this.predictionEngine.predictGameState(
                currentState,
                PredictionHorizon.SHORT_TERM
            );

            console.log(`📈 短期预测 (${PredictionHorizon.SHORT_TERM}):`);
            console.log(`   置信度: ${shortTermPrediction.confidence.toFixed(3)}`);
            console.log(`   预测类型: ${shortTermPrediction.type}`);

            // 中期预测
            const mediumTermPrediction = await this.predictionEngine.predictGameState(
                currentState,
                PredictionHorizon.MEDIUM_TERM
            );

            console.log(`📊 中期预测 (${PredictionHorizon.MEDIUM_TERM}):`);
            console.log(`   置信度: ${mediumTermPrediction.confidence.toFixed(3)}`);

            // 使用AI预测系统
            const aiPrediction = await this.predictiveAI.predict(
                'win_probability' as any,
                PredictionHorizon.LONG_TERM,
                playerId
            );

            console.log(`🎯 AI胜率预测:`);
            console.log(`   置信度: ${aiPrediction.confidence.toFixed(3)}`);
            console.log(`   贡献因素: ${aiPrediction.contributingFactors.size} 个`);

            // 运行蒙特卡洛模拟
            const simulations = await this.predictionEngine.runMonteCarloSimulation(
                currentState,
                PredictionHorizon.MEDIUM_TERM,
                100
            );

            console.log(`🎲 蒙特卡洛模拟 (100次):`);
            console.log(`   平均置信度: ${(simulations.reduce((sum, s) => sum + s.confidence, 0) / simulations.length).toFixed(3)}`);
            console.log(`   最佳情况概率: ${simulations[0].probability.toFixed(3)}`);

        } catch (error) {
            console.warn('⚠️ 预测演示失败:', error.message);
        }
    }

    // 演示战略规划
    private async demonstrateStrategicPlanning(gameHistory: GameStateSnapshot[]): Promise<void> {
        console.log('\n📋 演示战略规划功能...');

        const currentState = gameHistory[gameHistory.length - 1];
        const playerId = 'player_1';

        try {
            // 设置规划目标
            const objectives: PlanningObjective[] = [
                {
                    type: ObjectiveType.MAXIMIZE_NET_WORTH,
                    weight: 0.4,
                    target: 3000,
                    priority: 1,
                    tolerance: 0.1,
                    timeFrame: PredictionHorizon.LONG_TERM
                },
                {
                    type: ObjectiveType.MINIMIZE_RISK,
                    weight: 0.3,
                    target: 0.3,
                    priority: 2,
                    tolerance: 0.05,
                    timeFrame: PredictionHorizon.MEDIUM_TERM
                },
                {
                    type: ObjectiveType.ACHIEVE_MONOPOLY,
                    weight: 0.3,
                    target: 1,
                    priority: 3,
                    tolerance: 0,
                    timeFrame: PredictionHorizon.LONG_TERM
                }
            ];

            this.planningAlgorithm.setObjectives(objectives);

            // 设置约束条件
            const constraints: PlanningConstraint[] = [
                {
                    type: ConstraintType.CASH_MINIMUM,
                    value: 200,
                    isHard: true,
                    penalty: 1000,
                    description: '保持最低现金储备'
                },
                {
                    type: ConstraintType.RISK_MAXIMUM,
                    value: 0.7,
                    isHard: false,
                    penalty: 300,
                    description: '控制最大风险水平'
                }
            ];

            this.planningAlgorithm.setConstraints(constraints);

            // 激进扩张策略规划
            console.log('🚀 激进扩张策略规划...');
            const aggressivePlan = await this.planningAlgorithm.planStrategy(
                currentState,
                playerId,
                PlanningStrategy.AGGRESSIVE_EXPANSION,
                PredictionHorizon.MEDIUM_TERM
            );

            console.log(`   步骤数量: ${aggressivePlan.steps.length}`);
            console.log(`   置信度: ${aggressivePlan.confidence.toFixed(3)}`);
            console.log(`   总体风险: ${aggressivePlan.riskAssessment.overallRisk.toFixed(3)}`);

            // 保守成长策略规划
            console.log('🛡️ 保守成长策略规划...');
            const conservativePlan = await this.planningAlgorithm.planStrategy(
                currentState,
                playerId,
                PlanningStrategy.CONSERVATIVE_GROWTH,
                PredictionHorizon.MEDIUM_TERM
            );

            console.log(`   步骤数量: ${conservativePlan.steps.length}`);
            console.log(`   置信度: ${conservativePlan.confidence.toFixed(3)}`);
            console.log(`   总体风险: ${conservativePlan.riskAssessment.overallRisk.toFixed(3)}`);

            // 比较策略
            console.log('⚖️ 策略比较:');
            if (aggressivePlan.confidence > conservativePlan.confidence) {
                console.log('   推荐: 激进扩张策略 (更高置信度)');
            } else {
                console.log('   推荐: 保守成长策略 (更高置信度)');
            }

        } catch (error) {
            console.warn('⚠️ 战略规划演示失败:', error.message);
        }
    }

    // 演示预测增强决策
    private async demonstratePredictiveDecision(gameHistory: GameStateSnapshot[]): Promise<void> {
        console.log('\n🎯 演示预测增强决策...');

        const currentState = gameHistory[gameHistory.length - 1];
        const playerId = 'player_1';

        try {
            // 创建决策上下文
            const context: DecisionContext = {
                playerId,
                gameState: currentState,
                playerState: currentState.players.get(playerId),
                availableActions: ['buy_property', 'upgrade_property', 'trade', 'end_turn'],
                timeRemaining: 30000,
                difficulty: 'hard',
                personality: {
                    aggressiveness: 0.7,
                    riskTolerance: 0.6,
                    cooperativeness: 0.5,
                    patience: 0.4,
                    greed: 0.6,
                    strategicThinking: 0.8
                },
                constraints: {
                    maxThinkingTime: 10000,
                    minCashReserve: 200,
                    maxRiskLevel: 0.7,
                    priorityActions: ['buy_property'],
                    blacklistedActions: []
                }
            };

            // 房产购买决策
            console.log('🏠 房产购买决策分析...');
            const propertyDecision = await this.decisionIntegration.makePredictiveDecision(
                DecisionType.PROPERTY_PURCHASE,
                context,
                gameHistory
            );

            console.log(`   原始决策: ${propertyDecision.originalDecision.action}`);
            console.log(`   推荐决策: ${propertyDecision.recommendedDecision.action}`);
            console.log(`   整体置信度: ${propertyDecision.confidence.toFixed(3)}`);
            console.log(`   风险水平: ${propertyDecision.riskAssessment.riskLevel}`);
            console.log(`   替代方案数量: ${propertyDecision.alternativeDecisions.length}`);

            // 交易谈判决策
            console.log('🤝 交易谈判决策分析...');
            const tradeDecision = await this.decisionIntegration.makePredictiveDecision(
                DecisionType.TRADE_NEGOTIATION,
                context,
                gameHistory
            );

            console.log(`   原始决策: ${tradeDecision.originalDecision.action}`);
            console.log(`   推荐决策: ${tradeDecision.recommendedDecision.action}`);
            console.log(`   整体置信度: ${tradeDecision.confidence.toFixed(3)}`);
            console.log(`   适应建议数量: ${tradeDecision.adaptationSuggestions.length}`);

            // 显示推理过程
            console.log('🧠 决策推理过程:');
            propertyDecision.reasoning.forEach((reason, index) => {
                console.log(`   ${index + 1}. ${reason}`);
            });

        } catch (error) {
            console.warn('⚠️ 预测决策演示失败:', error.message);
        }
    }

    // 演示验证和优化
    private async demonstrateValidationOptimization(gameHistory: GameStateSnapshot[]): Promise<void> {
        console.log('\n🔍 演示验证和优化功能...');

        try {
            // 模拟预测结果
            const mockPrediction = {
                type: 'game_state' as any,
                horizon: PredictionHorizon.SHORT_TERM,
                confidence: 0.75,
                timestamp: Date.now(),
                validUntil: Date.now() + 300000,
                predictions: new Map([
                    ['future_cash', 1800],
                    ['future_properties', 4],
                    ['future_net_worth', 2800]
                ]),
                uncertaintyBounds: {
                    lower: new Map([['future_cash', 1600]]),
                    upper: new Map([['future_cash', 2000]])
                },
                assumptionsUsed: ['市场稳定', '玩家策略不变'],
                contributingFactors: new Map([
                    ['historical_patterns', 0.4],
                    ['current_trends', 0.6]
                ])
            };

            // 模拟实际结果
            const mockActual = gameHistory[gameHistory.length - 1];
            const mockOriginal = gameHistory[gameHistory.length - 2];

            // 验证预测
            const validationResult = await this.validationSystem.validatePrediction(
                mockPrediction,
                mockActual,
                mockOriginal,
                PredictionHorizon.SHORT_TERM
            );

            console.log('📊 预测验证结果:');
            console.log(`   整体分数: ${validationResult.overallScore.toFixed(3)}`);
            console.log(`   是否可接受: ${validationResult.isAcceptable ? '✅' : '❌'}`);
            console.log(`   数据质量: ${validationResult.dataQualityScore.toFixed(3)}`);
            console.log(`   置信度校准: ${validationResult.confidenceCalibration.toFixed(3)}`);

            // 显示验证指标
            console.log('📈 详细指标:');
            for (const [metric, value] of validationResult.metrics) {
                console.log(`   ${metric}: ${value.toFixed(3)}`);
            }

            // 显示改进建议
            if (validationResult.improvementSuggestions.length > 0) {
                console.log('💡 改进建议:');
                validationResult.improvementSuggestions.forEach((suggestion, index) => {
                    console.log(`   ${index + 1}. ${suggestion}`);
                });
            }

            // 获取性能趋势
            const trends = this.validationSystem.getPerformanceTrends();
            console.log(`📊 性能趋势监控: ${trends.size} 个指标`);

        } catch (error) {
            console.warn('⚠️ 验证优化演示失败:', error.message);
        }
    }

    // 演示自适应策略
    private async demonstrateAdaptiveStrategy(gameHistory: GameStateSnapshot[]): Promise<void> {
        console.log('\n🔄 演示自适应策略功能...');

        const playerId = 'player_1';
        const currentStrategy = PlanningStrategy.CONSERVATIVE_GROWTH;

        try {
            // 策略适应
            const adaptation = await this.decisionIntegration.adaptStrategy(
                playerId,
                currentStrategy,
                gameHistory
            );

            console.log('🎯 策略适应结果:');
            console.log(`   原策略: ${adaptation.originalStrategy}`);
            console.log(`   新策略: ${adaptation.adaptedStrategy}`);
            console.log(`   适应原因: ${adaptation.adaptationReason}`);
            console.log(`   置信度提升: ${adaptation.confidenceGain.toFixed(3)}`);
            console.log(`   预期改进: ${adaptation.expectedImprovement.toFixed(3)}`);
            console.log(`   适应成本: ${adaptation.adaptationCost.toFixed(3)}`);

            // 学习反馈
            const mockActualOutcome = {
                success: true,
                reward: 150,
                finalState: gameHistory[gameHistory.length - 1]
            };

            const mockPredictedOutcome = {
                expectedReward: 120,
                successProbability: 0.75
            };

            const mockDecisionResult = {
                type: DecisionType.PROPERTY_PURCHASE,
                action: 'buy_property',
                parameters: new Map([['property_id', 'prop_1']]),
                confidence: 0.8,
                reasoning: ['基于预测分析的购买决策'],
                alternativeActions: ['upgrade_existing'],
                executionPriority: 1,
                estimatedOutcome: mockPredictedOutcome
            };

            const learningFeedback = await this.decisionIntegration.provideLearningFeedback(
                playerId,
                mockActualOutcome,
                mockPredictedOutcome,
                mockDecisionResult
            );

            console.log('📚 学习反馈:');
            console.log(`   预测准确性: ${learningFeedback.predictionAccuracy.toFixed(3)}`);
            console.log(`   决策质量: ${learningFeedback.decisionQuality.toFixed(3)}`);
            console.log(`   策略有效性: ${learningFeedback.strategyEffectiveness.toFixed(3)}`);
            console.log(`   适应成功率: ${learningFeedback.adaptationSuccess.toFixed(3)}`);

            if (learningFeedback.improvementSuggestions.length > 0) {
                console.log('💡 改进建议:');
                learningFeedback.improvementSuggestions.forEach((suggestion, index) => {
                    console.log(`   ${index + 1}. ${suggestion}`);
                });
            }

        } catch (error) {
            console.warn('⚠️ 自适应策略演示失败:', error.message);
        }
    }

    // 生成综合报告
    private generateComprehensiveReport(): void {
        console.log('\n📋 生成综合系统报告...');

        // 预测AI统计
        const predictiveStats = this.predictiveAI.exportData();
        console.log('🔮 预测AI系统:');
        console.log(`   预测统计: ${JSON.stringify(predictiveStats.predictionStats)}`);
        console.log(`   规划统计: ${JSON.stringify(predictiveStats.planningStats)}`);

        // 预测引擎性能
        const engineMetrics = this.predictionEngine.getPerformanceMetrics();
        console.log('🎯 预测引擎性能:');
        for (const [metric, value] of engineMetrics) {
            if (typeof value === 'number') {
                console.log(`   ${metric}: ${value.toFixed(3)}`);
            }
        }

        // 规划算法统计
        const planningStats = this.planningAlgorithm.getPerformanceStats();
        console.log('📋 规划算法统计:');
        console.log(`   记忆化命中: ${planningStats.memoizationHits}`);
        console.log(`   搜索树大小: ${planningStats.searchTreeSize}`);

        // 机器学习模型信息
        const availableModels = this.mlModelManager.getAvailableModels();
        console.log('🧠 机器学习模型:');
        availableModels.forEach(modelType => {
            const info = this.mlModelManager.getModelInfo(modelType);
            if (info) {
                console.log(`   ${modelType}: ${info.isTrained ? '已训练' : '未训练'}`);
            }
        });

        // 决策集成配置
        const integrationConfig = this.decisionIntegration.getConfiguration();
        console.log('🎯 决策集成配置:');
        console.log(`   预测范围: ${integrationConfig.predictionHorizon}`);
        console.log(`   规划策略: ${integrationConfig.planningStrategy}`);
        console.log(`   ML模型: ${integrationConfig.mlModelType}`);
        console.log(`   实时学习: ${integrationConfig.enableRealTimeLearning ? '启用' : '禁用'}`);

        // 验证系统数据
        const validationData = this.validationSystem.exportValidationData();
        console.log('🔍 验证系统:');
        console.log(`   总验证次数: ${validationData.systemStats.totalValidations}`);
        console.log(`   平均分数: ${validationData.systemStats.averageScore.toFixed(3)}`);
        console.log(`   执行优化次数: ${validationData.systemStats.optimizationsExecuted}`);

        console.log('\n🎉 预测和规划AI系统报告生成完成！');
    }

    // 辅助方法
    private generateProperties(turn: number): string[] {
        const count = Math.min(turn, 8);
        const properties: string[] = [];
        for (let i = 0; i < count; i++) {
            properties.push(`property_${i + 1}`);
        }
        return properties;
    }

    private generateBuildings(turn: number): [string, number][] {
        const buildings: [string, number][] = [];
        const count = Math.min(turn / 2, 4);
        for (let i = 0; i < count; i++) {
            buildings.push([`property_${i + 1}`, Math.floor(Math.random() * 4) + 1]);
        }
        return buildings;
    }

    private selectRandomStrategy(): string {
        const strategies = ['aggressive', 'conservative', 'balanced', 'opportunistic'];
        return strategies[Math.floor(Math.random() * strategies.length)];
    }

    private selectRandomMarketTrend(): 'bull' | 'bear' | 'stable' {
        const trends = ['bull', 'bear', 'stable'] as const;
        return trends[Math.floor(Math.random() * trends.length)];
    }

    private generateOccupiedProperties(): string[] {
        const count = Math.floor(Math.random() * 10) + 5;
        const properties: string[] = [];
        for (let i = 0; i < count; i++) {
            properties.push(`occupied_${i + 1}`);
        }
        return properties;
    }
}

// 主运行函数
async function runPredictiveAIExample(): Promise<void> {
    const example = new PredictiveAIExample();
    await example.runCompleteExample();
}

// 导出示例类和运行函数
export {
    PredictiveAIExample,
    runPredictiveAIExample
};

// 如果直接运行此文件，执行示例
if (require.main === module) {
    runPredictiveAIExample().catch(console.error);
}