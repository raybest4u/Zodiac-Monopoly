/**
 * 深度学习策略网络使用示例
 * Deep Learning Strategy Network Usage Example
 * 
 * 展示深度学习策略网络的完整使用流程和功能
 */

import { 
    DeepStrategyEvaluationNetwork,
    StrategyInput,
    NetworkArchitecture,
    TrainingConfig,
    GameStateVector,
    PlayerStateVector,
    MarketVector,
    HistoricalVector,
    ContextualVector
} from './DeepStrategyNetwork';

import { 
    AdvancedStrategyOptimizer,
    OptimizationConfig,
    OptimizationAlgorithm,
    ObjectiveScores,
    StrategyGene
} from './StrategyOptimizer';

import { 
    AdaptiveLearningScheduler,
    SchedulerConfig,
    SchedulerType
} from './AdaptiveLearningScheduler';

import { 
    StrategyGameIntegration,
    IntegrationConfig
} from './StrategyGameIntegration';

import { 
    StrategyPerformanceEvaluator,
    BenchmarkConfig,
    EvaluationDimension,
    GameOutcome,
    ContextualFactor
} from './StrategyPerformanceEvaluator';

// 模拟游戏引擎
class MockGameEngine {
    private gameState: any;
    
    constructor() {
        this.gameState = this.createMockGameState();
    }
    
    getGameState(): any {
        return this.gameState;
    }
    
    getCurrentPlayer(): any {
        return {
            id: 'player_1',
            money: 1500,
            position: 10,
            properties: [],
            isInJail: false
        };
    }
    
    getAllPlayers(): any[] {
        return [
            { id: 'player_1', money: 1500, position: 10, properties: [], isBankrupt: false },
            { id: 'player_2', money: 1200, position: 15, properties: [], isBankrupt: false },
            { id: 'player_3', money: 800, position: 5, properties: [], isBankrupt: false },
            { id: 'player_4', money: 2000, position: 25, properties: [], isBankrupt: false }
        ];
    }
    
    getProperties(): any[] {
        return Array.from({ length: 40 }, (_, i) => ({
            id: `property_${i}`,
            name: `Property ${i}`,
            price: 100 + i * 50,
            rent: 10 + i * 5,
            owner: Math.random() > 0.7 ? `player_${Math.floor(Math.random() * 4) + 1}` : null
        }));
    }
    
    async executeAction(playerId: string, action: any): Promise<any> {
        console.log(`Executing action for ${playerId}:`, action);
        return { success: true, result: 'Action executed successfully' };
    }
    
    isGameOver(): boolean {
        return false;
    }
    
    getWinner(): any {
        return null;
    }
    
    private createMockGameState(): any {
        return {
            round: 5,
            phase: 'mid',
            totalMoney: 5500,
            seasonalBonus: 0.1,
            marketRisk: 0.3
        };
    }
}

// 主示例类
export class DeepStrategyExample {
    private strategyNetwork: DeepStrategyEvaluationNetwork;
    private optimizer: AdvancedStrategyOptimizer;
    private scheduler: AdaptiveLearningScheduler;
    private integration: StrategyGameIntegration;
    private evaluator: StrategyPerformanceEvaluator;
    private gameEngine: MockGameEngine;
    
    constructor() {
        this.gameEngine = new MockGameEngine();
        this.initializeComponents();
    }
    
    // 初始化所有组件
    private initializeComponents(): void {
        console.log('🚀 初始化深度学习策略网络系统...');
        
        // 1. 初始化策略评估网络
        this.initializeStrategyNetwork();
        
        // 2. 初始化策略优化器
        this.initializeOptimizer();
        
        // 3. 初始化学习率调度器
        this.initializeScheduler();
        
        // 4. 初始化性能评估器
        this.initializePerformanceEvaluator();
        
        // 5. 初始化系统集成
        this.initializeIntegration();
        
        console.log('✅ 系统初始化完成！');
    }
    
    // 初始化策略网络
    private initializeStrategyNetwork(): void {
        const architecture: NetworkArchitecture = {
            inputDimension: 32,
            outputDimension: 7,
            hiddenLayers: [
                { type: 'dense', units: 128, activation: 'relu', dropout: 0.3 },
                { type: 'dense', units: 64, activation: 'relu', dropout: 0.2 },
                { type: 'dense', units: 32, activation: 'tanh', dropout: 0.1 }
            ],
            attention: {
                enabled: true,
                heads: 4,
                dimensions: 64,
                dropoutRate: 0.1
            },
            residualConnections: true,
            batchNormalization: true
        };
        
        const trainingConfig: TrainingConfig = {
            learningRate: 0.001,
            batchSize: 32,
            epochs: 100,
            optimizer: 'adam',
            lossFunction: 'mse',
            metrics: ['mae', 'accuracy'],
            earlyStoppingPatience: 15,
            learningRateSchedule: {
                type: 'cosine',
                parameters: { T_max: 50, eta_min: 0.0001 }
            }
        };
        
        this.strategyNetwork = new DeepStrategyEvaluationNetwork(architecture, trainingConfig);
        console.log('🧠 策略评估网络已初始化');
    }
    
    // 初始化优化器
    private initializeOptimizer(): void {
        const optimizationConfig: OptimizationConfig = {
            algorithm: OptimizationAlgorithm.GENETIC_ALGORITHM,
            populationSize: 50,
            generations: 100,
            mutationRate: 0.1,
            crossoverRate: 0.8,
            eliteRatio: 0.2,
            convergenceThreshold: 0.001,
            maxIterations: 1000,
            objectiveWeights: {
                profitability: 0.3,
                riskMinimization: 0.25,
                timeEfficiency: 0.15,
                resourceUtilization: 0.1,
                competitiveAdvantage: 0.1,
                sustainability: 0.05,
                adaptability: 0.05
            },
            constraints: {
                maxRisk: 0.8,
                minReturn: 0.05,
                resourceLimits: {
                    maxCashUsage: 0.7,
                    maxPropertyCount: 15,
                    maxDevelopmentCost: 3000,
                    reserveRequirement: 0.3
                },
                timeLimits: {
                    maxDecisionTime: 5000,
                    planningHorizon: 20,
                    evaluationPeriod: 10
                },
                legalConstraints: [],
                gameRuleConstraints: []
            }
        };
        
        this.optimizer = new AdvancedStrategyOptimizer(optimizationConfig);
        console.log('🔧 策略优化器已初始化');
    }
    
    // 初始化调度器
    private initializeScheduler(): void {
        const schedulerConfig: SchedulerConfig = {
            type: SchedulerType.COSINE_ANNEALING,
            initialLearningRate: 0.001,
            parameters: {
                T_max: 50,
                eta_min: 0.0001
            },
            warmupSteps: 10,
            minLearningRate: 0.0001,
            maxLearningRate: 0.01,
            patience: 10,
            factor: 0.5,
            verbose: true
        };
        
        this.scheduler = new AdaptiveLearningScheduler(schedulerConfig);
        console.log('📈 自适应学习率调度器已初始化');
    }
    
    // 初始化性能评估器
    private initializePerformanceEvaluator(): void {
        const benchmarkConfig: BenchmarkConfig = {
            referenceStrategies: [], // 将在初始化时自动添加
            evaluationPeriod: 30,
            sampleSize: 100,
            confidenceLevel: 0.95,
            testConditions: [
                {
                    name: 'Normal Market',
                    scenario: 'Standard game conditions',
                    parameters: { volatility: 0.3, competition: 0.5 },
                    weight: 0.4,
                    description: 'Regular market conditions with moderate competition'
                },
                {
                    name: 'High Volatility',
                    scenario: 'Volatile market conditions',
                    parameters: { volatility: 0.8, competition: 0.7 },
                    weight: 0.3,
                    description: 'High market volatility with increased competition'
                },
                {
                    name: 'Low Competition',
                    scenario: 'Low competitive pressure',
                    parameters: { volatility: 0.2, competition: 0.2 },
                    weight: 0.3,
                    description: 'Stable market with minimal competition'
                }
            ],
            performanceThresholds: [
                {
                    metric: 'totalReturn',
                    minimum: 0.05,
                    target: 0.15,
                    excellent: 0.25,
                    description: 'Total return on investment'
                },
                {
                    metric: 'decisionAccuracy',
                    minimum: 0.6,
                    target: 0.75,
                    excellent: 0.9,
                    description: 'Decision-making accuracy'
                },
                {
                    metric: 'riskScore',
                    minimum: 0.8,
                    target: 0.5,
                    excellent: 0.3,
                    description: 'Risk management score (lower is better)'
                }
            ]
        };
        
        this.evaluator = new StrategyPerformanceEvaluator(benchmarkConfig);
        console.log('📊 策略性能评估器已初始化');
    }
    
    // 初始化系统集成
    private initializeIntegration(): void {
        const integrationConfig: IntegrationConfig = {
            networkConfig: {
                inputDimension: 32,
                outputDimension: 7,
                hiddenLayers: [128, 64, 32],
                activationFunction: 'relu',
                dropoutRate: 0.2
            },
            trainingConfig: {
                batchSize: 32,
                epochs: 100,
                learningRate: 0.001,
                validationSplit: 0.2,
                earlyStoppingPatience: 15
            },
            optimizationConfig: {
                algorithm: 'genetic',
                populationSize: 50,
                generations: 100,
                mutationRate: 0.1,
                crossoverRate: 0.8
            },
            schedulerConfig: {
                type: SchedulerType.COSINE_ANNEALING,
                parameters: { T_max: 50, eta_min: 0.0001 },
                warmupSteps: 10
            },
            integrationSettings: {
                realTimeTraining: true,
                adaptiveOptimization: true,
                performanceThreshold: 0.75,
                maxDecisionTime: 3000,
                enableCaching: true,
                cacheSize: 1000
            }
        };
        
        this.integration = new StrategyGameIntegration(integrationConfig, this.gameEngine);
        console.log('🔗 系统集成已完成');
    }
    
    // 运行完整示例
    async runCompleteExample(): Promise<void> {
        console.log('\n🎯 === 深度学习策略网络完整示例 ===\n');
        
        try {
            // 1. 基础网络评估示例
            await this.runNetworkEvaluationExample();
            
            // 2. 策略优化示例
            await this.runOptimizationExample();
            
            // 3. 学习率调度示例
            await this.runSchedulerExample();
            
            // 4. 集成决策示例
            await this.runIntegratedDecisionExample();
            
            // 5. 性能评估示例
            await this.runPerformanceEvaluationExample();
            
            // 6. 训练示例
            await this.runTrainingExample();
            
            // 7. 完整游戏流程示例
            await this.runCompleteGameExample();
            
            console.log('\n🎉 === 所有示例执行完成！ ===');
            
        } catch (error) {
            console.error('❌ 示例执行出错:', error);
        }
    }
    
    // 网络评估示例
    private async runNetworkEvaluationExample(): Promise<void> {
        console.log('🧠 === 网络评估示例 ===');
        
        const strategyInput = this.createMockStrategyInput();
        
        console.log('输入数据:');
        console.log('- 游戏阶段:', strategyInput.gameState.gamePhase === 1 ? '后期' : 
                    strategyInput.gameState.gamePhase === 0.5 ? '中期' : '前期');
        console.log('- 玩家资金:', strategyInput.playerStates[0].money);
        console.log('- 市场流动性:', strategyInput.marketConditions.liquidityIndex.toFixed(2));
        
        const evaluation = this.strategyNetwork.forward(strategyInput);
        
        console.log('\n评估结果:');
        console.log('- 策略价值:', (evaluation.strategicValue * 100).toFixed(1) + '%');
        console.log('- 风险评分:', (evaluation.riskScore * 100).toFixed(1) + '%');
        console.log('- 机会评分:', (evaluation.opportunityScore * 100).toFixed(1) + '%');
        console.log('- 竞争优势:', (evaluation.competitiveAdvantage * 100).toFixed(1) + '%');
        console.log('- 长期潜力:', (evaluation.longTermPotential * 100).toFixed(1) + '%');
        console.log('- 短期收益:', (evaluation.shortTermGain * 100).toFixed(1) + '%');
        console.log('- 置信度:', (evaluation.confidenceLevel * 100).toFixed(1) + '%');
        
        console.log('\n推理解释:');
        evaluation.reasoning.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
        
        console.log('✅ 网络评估示例完成\n');
    }
    
    // 策略优化示例
    private async runOptimizationExample(): Promise<void> {
        console.log('🔧 === 策略优化示例 ===');
        
        const strategyInput = this.createMockStrategyInput();
        
        // 创建评估函数
        const evaluationFunction = async (gene: StrategyGene): Promise<ObjectiveScores> => {
            // 模拟策略基因评估
            const randomness = Math.random();
            return {
                profitability: gene.parameters.aggressiveness * 0.7 + randomness * 0.3,
                risk: gene.parameters.riskTolerance * 0.8 + randomness * 0.2,
                efficiency: (gene.parameters.aggressiveness + gene.parameters.riskTolerance) / 2,
                competitiveness: gene.parameters.cooperationLevel * 0.6 + randomness * 0.4,
                sustainability: (1 - gene.parameters.aggressiveness) * 0.5 + randomness * 0.5,
                adaptability: gene.parameters.adaptationSpeed,
                overall: (gene.parameters.aggressiveness + gene.parameters.riskTolerance + 
                         gene.parameters.cooperationLevel + gene.parameters.adaptationSpeed) / 4
            };
        };
        
        console.log('开始遗传算法优化...');
        const optimizationResult = await this.optimizer.optimize(strategyInput, evaluationFunction);
        
        console.log('\n优化结果:');
        console.log('- 最佳适应度:', optimizationResult.finalFitness.toFixed(3));
        console.log('- 使用迭代数:', optimizationResult.iterationsUsed);
        console.log('- 执行时间:', optimizationResult.executionTime + 'ms');
        console.log('- 改进方案数:', optimizationResult.statistics.improvedSolutions);
        
        console.log('\n最佳策略:');
        console.log('- 行动数量:', optimizationResult.bestStrategy.actionSequence.length);
        console.log('- 资源分配:');
        const allocation = optimizationResult.bestStrategy.resourceAllocation;
        console.log('  - 现金储备:', (allocation.cashReserve * 100).toFixed(1) + '%');
        console.log('  - 投资预算:', (allocation.investmentBudget * 100).toFixed(1) + '%');
        console.log('  - 开发资金:', (allocation.developmentFund * 100).toFixed(1) + '%');
        
        console.log('✅ 策略优化示例完成\n');
    }
    
    // 学习率调度示例
    private async runSchedulerExample(): Promise<void> {
        console.log('📈 === 学习率调度示例 ===');
        
        console.log('初始学习率:', this.scheduler.getCurrentLearningRate());
        
        // 模拟训练过程
        for (let epoch = 0; epoch < 20; epoch++) {
            const loss = 1.0 - epoch * 0.04 + Math.random() * 0.1; // 模拟损失下降
            const metric = 0.5 + epoch * 0.02 + Math.random() * 0.05; // 模拟指标提升
            
            const newLR = this.scheduler.epochStep(epoch, loss, metric);
            
            if (epoch % 5 === 0) {
                console.log(`Epoch ${epoch}: LR=${newLR.toFixed(6)}, Loss=${loss.toFixed(3)}, Metric=${metric.toFixed(3)}`);
            }
        }
        
        const finalState = this.scheduler.getState();
        console.log('\n最终状态:');
        console.log('- 当前学习率:', finalState.currentLearningRate.toFixed(6));
        console.log('- 总步数:', finalState.currentStep);
        console.log('- 当前周期:', finalState.currentEpoch);
        
        const performance = this.scheduler.getPerformanceMetrics();
        console.log('- 收敛速度:', performance.convergenceSpeed.toFixed(4));
        console.log('- 稳定性分数:', performance.stabilityScore.toFixed(3));
        console.log('- 学习效率:', performance.learningEfficiency.toFixed(6));
        
        console.log('✅ 学习率调度示例完成\n');
    }
    
    // 集成决策示例
    private async runIntegratedDecisionExample(): Promise<void> {
        console.log('🔗 === 集成决策示例 ===');
        
        const playerId = 'player_1';
        
        console.log(`为玩家 ${playerId} 制定策略决策...`);
        
        const decision = await this.integration.makeStrategicDecision(playerId);
        
        console.log('\n决策结果:');
        console.log('- 推荐动作:', decision.recommendedAction.type);
        console.log('- 优先级:', (decision.recommendedAction.priority * 100).toFixed(1) + '%');
        console.log('- 期望价值:', decision.recommendedAction.expectedValue.toFixed(0));
        console.log('- 风险水平:', (decision.recommendedAction.riskLevel * 100).toFixed(1) + '%');
        console.log('- 整体置信度:', (decision.confidence * 100).toFixed(1) + '%');
        
        console.log('\n替代方案:');
        decision.alternatives.slice(0, 3).forEach((alt, index) => {
            console.log(`${index + 1}. ${alt.action.type} (分数: ${(alt.score * 100).toFixed(1)}%)`);
        });
        
        console.log('\n风险评估:');
        console.log('- 总体风险:', (decision.riskAssessment.overallRisk * 100).toFixed(1) + '%');
        console.log('- 风险因素数:', decision.riskAssessment.riskFactors.length);
        console.log('- 最坏情况:', decision.riskAssessment.worstCaseScenario);
        
        console.log('\n执行计划:');
        console.log('- 即时行动:', decision.executionPlan.immediateActions.length);
        console.log('- 短期计划:', decision.executionPlan.shortTermPlan.length);
        console.log('- 长期策略:', decision.executionPlan.longTermStrategy.length);
        console.log('- 应急预案:', decision.executionPlan.contingencies.length);
        
        console.log('✅ 集成决策示例完成\n');
    }
    
    // 性能评估示例
    private async runPerformanceEvaluationExample(): Promise<void> {
        console.log('📊 === 性能评估示例 ===');
        
        const playerId = 'player_1';
        
        // 创建模拟决策历史
        const decisions = Array.from({ length: 10 }, (_, i) => ({
            recommendedAction: {
                type: ['buy', 'develop', 'trade', 'pass'][Math.floor(Math.random() * 4)] as any,
                priority: Math.random(),
                expectedValue: Math.random() * 1000,
                riskLevel: Math.random()
            },
            evaluation: {
                strategicValue: Math.random(),
                riskScore: Math.random(),
                opportunityScore: Math.random(),
                competitiveAdvantage: Math.random(),
                longTermPotential: Math.random(),
                shortTermGain: Math.random(),
                confidenceLevel: Math.random(),
                reasoning: {
                    primaryFactors: ['Factor 1', 'Factor 2'],
                    riskFactors: ['Risk 1'],
                    opportunities: ['Opportunity 1'],
                    threats: ['Threat 1'],
                    recommendations: ['Recommendation 1'],
                    confidence: Math.random()
                }
            },
            confidence: Math.random(),
            reasoning: ['Decision reasoning'],
            alternatives: [],
            executionPlan: {
                immediateActions: [],
                shortTermPlan: [],
                longTermStrategy: [],
                contingencies: []
            },
            riskAssessment: {
                overallRisk: Math.random(),
                riskFactors: [],
                mitigationStrategies: [],
                worstCaseScenario: 'Worst case',
                bestCaseScenario: 'Best case'
            }
        }));
        
        const gameOutcome: GameOutcome = {
            finalPosition: 2,
            totalPlayers: 4,
            finalScore: 2500,
            gameLength: 45,
            victory: false,
            victoryType: undefined
        };
        
        const contextualFactors: ContextualFactor[] = [
            {
                type: 'market_condition',
                value: 'normal',
                impact: 0.5,
                description: 'Normal market conditions'
            }
        ];
        
        console.log('执行策略性能评估...');
        const evaluation = await this.evaluator.evaluateStrategy(
            playerId,
            decisions,
            gameOutcome,
            contextualFactors
        );
        
        console.log('\n评估结果:');
        console.log('- 总体分数:', (evaluation.overallScore * 100).toFixed(1) + '%');
        console.log('- 置信度:', (evaluation.confidence * 100).toFixed(1) + '%');
        
        console.log('\n维度分数:');
        for (const [dimension, score] of evaluation.dimensionScores) {
            console.log(`- ${dimension}: ${(score * 100).toFixed(1)}%`);
        }
        
        console.log('\n基准比较:');
        console.log('- 排名:', `${evaluation.benchmarkComparison.ranking}/${evaluation.benchmarkComparison.totalStrategies}`);
        console.log('- 相对性能:', (evaluation.benchmarkComparison.relativePerformance * 100).toFixed(1) + '%');
        console.log('- 超越策略数:', evaluation.benchmarkComparison.outperformed.length);
        
        console.log('\n优势:');
        evaluation.strengths.forEach((strength, index) => {
            console.log(`${index + 1}. ${strength}`);
        });
        
        console.log('\n劣势:');
        evaluation.weaknesses.forEach((weakness, index) => {
            console.log(`${index + 1}. ${weakness}`);
        });
        
        console.log('\n优化建议:');
        evaluation.recommendations.slice(0, 3).forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
            console.log(`   期望改进: ${(rec.expectedImprovement * 100).toFixed(1)}%`);
        });
        
        console.log('✅ 性能评估示例完成\n');
    }
    
    // 训练示例
    private async runTrainingExample(): Promise<void> {
        console.log('🏋️ === 训练示例 ===');
        
        // 创建训练数据
        const trainingData = Array.from({ length: 100 }, () => ({
            input: this.createMockStrategyInput(),
            target: Array.from({ length: 7 }, () => Math.random())
        }));
        
        const validationData = Array.from({ length: 20 }, () => ({
            input: this.createMockStrategyInput(),
            target: Array.from({ length: 7 }, () => Math.random())
        }));
        
        console.log('开始网络训练...');
        console.log('- 训练样本:', trainingData.length);
        console.log('- 验证样本:', validationData.length);
        console.log('- 网络架构:', this.strategyNetwork.getArchitecture().hiddenLayers.length, '隐藏层');
        
        // 设置事件监听
        this.strategyNetwork.on('training_progress', (metrics) => {
            if (metrics.epoch % 10 === 0) {
                console.log(`Epoch ${metrics.epoch}: Train Loss=${metrics.trainLoss.toFixed(4)}, Val Loss=${metrics.validationLoss.toFixed(4)}, LR=${metrics.learningRate.toFixed(6)}`);
            }
        });
        
        try {
            await this.strategyNetwork.train(trainingData, validationData);
            console.log('✅ 训练完成');
            
            const history = this.strategyNetwork.getTrainingHistory();
            console.log('- 训练周期:', history.length);
            console.log('- 最终训练损失:', history[history.length - 1]?.trainLoss.toFixed(4));
            console.log('- 最终验证损失:', history[history.length - 1]?.validationLoss.toFixed(4));
            
        } catch (error) {
            console.log('⚠️ 训练过程简化演示（实际训练需要完整数据）');
        }
        
        console.log('✅ 训练示例完成\n');
    }
    
    // 完整游戏流程示例
    private async runCompleteGameExample(): Promise<void> {
        console.log('🎮 === 完整游戏流程示例 ===');
        
        const playerIds = ['player_1', 'player_2', 'player_3'];
        const gameRounds = 5;
        
        console.log(`模拟 ${gameRounds} 回合游戏，${playerIds.length} 个玩家`);
        
        for (let round = 1; round <= gameRounds; round++) {
            console.log(`\n--- 第 ${round} 回合 ---`);
            
            for (const playerId of playerIds) {
                console.log(`\n${playerId} 的回合:`);
                
                try {
                    // 1. 制定决策
                    const decision = await this.integration.makeStrategicDecision(playerId);
                    console.log(`- 选择动作: ${decision.recommendedAction.type}`);
                    console.log(`- 置信度: ${(decision.confidence * 100).toFixed(1)}%`);
                    
                    // 2. 执行动作
                    await this.gameEngine.executeAction(playerId, decision.recommendedAction);
                    
                    // 3. 更新学习率
                    const loss = Math.random() * 0.5 + 0.1; // 模拟损失
                    this.scheduler.step(loss);
                    
                } catch (error) {
                    console.log(`- 决策错误: ${error.message}`);
                }
            }
        }
        
        // 游戏结束，进行性能评估
        console.log('\n=== 游戏结束，性能总结 ===');
        
        const integrationStats = this.integration.getPerformanceStatistics();
        console.log('系统统计:');
        console.log('- 总决策数:', integrationStats.totalDecisions);
        console.log('- 平均决策时间:', integrationStats.averageDecisionTime.toFixed(1) + 'ms');
        console.log('- 学习进度:', (integrationStats.learningProgress * 100).toFixed(1) + '%');
        
        const cacheStats = this.integration.getCacheStatistics();
        console.log('缓存统计:');
        console.log('- 缓存大小:', cacheStats.size);
        console.log('- 命中率:', (cacheStats.hitRate * 100).toFixed(1) + '%');
        
        const schedulerInfo = this.scheduler.getSchedulerInfo();
        console.log('调度器状态:');
        console.log('- 当前学习率:', schedulerInfo.currentLR.toFixed(6));
        console.log('- 总步数:', schedulerInfo.step);
        console.log('- 活跃状态:', schedulerInfo.isActive ? '是' : '否');
        
        console.log('✅ 完整游戏流程示例完成\n');
    }
    
    // 创建模拟策略输入
    private createMockStrategyInput(): StrategyInput {
        const gameState: GameStateVector = {
            currentRound: Math.floor(Math.random() * 20),
            gamePhase: Math.random(),
            totalMoney: 5000 + Math.random() * 5000,
            totalProperties: 40,
            activePlayers: 4,
            marketVolatility: Math.random() * 0.5,
            seasonalFactor: Math.random() * 0.2,
            competitionLevel: Math.random()
        };
        
        const playerStates: PlayerStateVector[] = Array.from({ length: 4 }, (_, i) => ({
            playerId: `player_${i + 1}`,
            money: 1000 + Math.random() * 2000,
            position: Math.floor(Math.random() * 40),
            propertyCount: Math.floor(Math.random() * 10),
            monopolies: Math.floor(Math.random() * 3),
            buildingValue: Math.random() * 1000,
            liquidAssets: 500 + Math.random() * 1500,
            debtRatio: Math.random() * 0.5,
            riskProfile: Math.random(),
            aggressiveness: Math.random(),
            cooperationLevel: Math.random(),
            skillPower: Math.random(),
            zodiacAdvantage: Math.random() * 0.3
        }));
        
        const marketConditions: MarketVector = {
            propertyPrices: Array.from({ length: 40 }, () => 100 + Math.random() * 500),
            rentLevels: Array.from({ length: 40 }, () => 10 + Math.random() * 50),
            developmentCosts: Array.from({ length: 40 }, () => 50 + Math.random() * 200),
            liquidityIndex: Math.random(),
            supplyDemandRatio: 0.5 + Math.random() * 0.5,
            investmentOpportunities: Math.random(),
            riskFactors: Math.random() * 0.5
        };
        
        const historicalData: HistoricalVector = {
            pastPerformance: Array.from({ length: 10 }, () => Math.random() * 2 - 1),
            trendAnalysis: Array.from({ length: 5 }, () => Math.random() * 0.2 - 0.1),
            patternRecognition: Array.from({ length: 3 }, () => Math.random()),
            seasonalPatterns: [0.8, 1.2, 1.0, 0.9],
            playerBehaviorHistory: Array.from({ length: 5 }, () => Math.random()),
            marketHistory: Array.from({ length: 10 }, () => Math.random())
        };
        
        const contextualFeatures: ContextualVector = {
            timeConstraints: Math.random(),
            stakesLevel: Math.random(),
            competitivePressure: Math.random(),
            alliances: Array.from({ length: 4 }, () => Math.random()),
            threats: Array.from({ length: 4 }, () => Math.random()),
            opportunities: Array.from({ length: 3 }, () => Math.random())
        };
        
        return {
            gameState,
            playerStates,
            marketConditions,
            historicalData,
            contextualFeatures
        };
    }
    
    // 获取系统状态报告
    getSystemReport(): string {
        const report = {
            timestamp: new Date().toISOString(),
            systemComponents: {
                strategyNetwork: {
                    architecture: this.strategyNetwork.getArchitecture(),
                    trainingHistory: this.strategyNetwork.getTrainingHistory()
                },
                scheduler: {
                    state: this.scheduler.getState(),
                    performance: this.scheduler.getPerformanceMetrics()
                },
                integration: {
                    performance: this.integration.getPerformanceStatistics(),
                    cache: this.integration.getCacheStatistics()
                }
            },
            status: 'All systems operational'
        };
        
        return JSON.stringify(report, null, 2);
    }
    
    // 保存系统状态
    async saveSystemState(): Promise<void> {
        console.log('💾 保存系统状态...');
        
        this.strategyNetwork.saveModel('./models/strategy_network.json');
        this.integration.saveIntegrationState();
        const schedulerState = this.scheduler.saveState();
        
        console.log('✅ 系统状态已保存');
    }
    
    // 清理资源
    cleanup(): void {
        console.log('🧹 清理系统资源...');
        
        this.integration.clearCache();
        this.evaluator.clearHistory();
        this.scheduler.pause();
        
        console.log('✅ 资源清理完成');
    }
}

// 运行示例
export async function runDeepStrategyExample(): Promise<void> {
    const example = new DeepStrategyExample();
    
    try {
        await example.runCompleteExample();
        
        // 生成系统报告
        const report = example.getSystemReport();
        console.log('\n📋 === 系统状态报告 ===');
        console.log('报告已生成，包含所有组件状态信息');
        
        // 保存系统状态
        await example.saveSystemState();
        
    } catch (error) {
        console.error('❌ 示例执行失败:', error);
    } finally {
        example.cleanup();
    }
}

// 如果直接运行此文件
if (require.main === module) {
    runDeepStrategyExample().catch(console.error);
}