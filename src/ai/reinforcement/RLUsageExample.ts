/**
 * 强化学习系统使用示例
 * Reinforcement Learning System Usage Example
 * 
 * 展示如何集成和使用完整的强化学习AI决策框架
 */

import { RLIntegrationFramework, IntegrationConfig } from './RLIntegrationFramework';
import { TrainingConfig } from './RLTrainingEnvironment';
import { ActorCriticAgent, AgentType } from './PolicyGradientAgent';
import { DQNAgent } from './DQNAgent';
import { QLearningAgent } from './QLearningAgent';

// 使用示例类
export class ZodiacMonopolyRLExample {
    private rlIntegration: RLIntegrationFramework;
    private gameSimulator: any;
    
    constructor() {
        // 初始化游戏模拟器（这里用占位符）
        this.gameSimulator = new MockGameSimulator();
    }
    
    // 基础使用示例
    async basicUsageExample(): Promise<void> {
        console.log('🎯 === 基础强化学习使用示例 ===');
        
        // 1. 配置训练参数
        const trainingConfig: TrainingConfig = {
            maxEpisodes: 1000,
            maxStepsPerEpisode: 200,
            evaluationInterval: 100,
            saveInterval: 500,
            logInterval: 50,
            validationGames: 10,
            
            rewardWeights: {
                money: 1.0,
                properties: 0.8,
                gameWin: 2.0,
                cooperation: 0.3,
                efficiency: 0.2,
                skillUsage: 0.5
            },
            
            difficultyLevel: 'medium',
            enableCommunication: true,
            enableSkills: true,
            seasonalEffects: true,
            randomSeed: 42
        };
        
        // 2. 配置集成参数
        const integrationConfig: IntegrationConfig = {
            enableRL: true,
            rlAlgorithms: ['actor_critic', 'dqn', 'q_learning'],
            fallbackToClassic: true,
            
            hybridMode: 'confidence_based',
            rlWeight: 0.7,
            classicWeight: 0.3,
            
            continuousLearning: true,
            adaptationRate: 0.01,
            performanceThreshold: 0.75,
            
            maxDecisionTime: 5000,
            memoryLimit: 1000000,
            parallelExecution: true
        };
        
        // 3. 初始化RL集成框架
        this.rlIntegration = new RLIntegrationFramework(
            integrationConfig,
            trainingConfig,
            null // 暂时不使用经典AI
        );
        
        // 4. 设置事件监听
        this.setupEventListeners();
        
        // 5. 初始化系统
        await this.rlIntegration.initialize();
        
        console.log('✅ RL系统初始化完成');
    }
    
    // 训练示例
    async trainingExample(): Promise<void> {
        console.log('🏋️ === 强化学习训练示例 ===');
        
        // 开始训练
        const trainingEpisodes = 500;
        console.log(`开始训练 ${trainingEpisodes} 个回合...`);
        
        await this.rlIntegration.startTraining(trainingEpisodes);
        
        // 获取训练统计
        const stats = this.rlIntegration.getPerformanceMetrics();
        console.log('📊 训练完成统计:');
        console.log(`- 平均决策时间: ${stats.averageDecisionTime}ms`);
        console.log(`- 决策准确率: ${(stats.decisionAccuracy * 100).toFixed(1)}%`);
        console.log(`- 学习进度: ${(stats.learningProgress * 100).toFixed(1)}%`);
        console.log(`- 成功率: ${(stats.successRate * 100).toFixed(1)}%`);
        
        console.log('✅ 训练完成');
    }
    
    // 游戏决策示例
    async gameDecisionExample(): Promise<void> {
        console.log('🎮 === 游戏决策示例 ===');
        
        // 模拟游戏状态
        const gameState = this.createMockGameState();
        const playerId = 'player_1';
        
        // 创建决策上下文
        const context = {
            urgency: 0.5,
            complexity: 0.7,
            uncertainty: 0.4,
            stakesLevel: 0.8,
            availableTime: 3000,
            resourceConstraints: {},
            environmentalFactors: {}
        };
        
        console.log('🤔 正在进行AI决策...');
        
        // 获取AI决策
        const decision = await this.rlIntegration.makeDecision(
            gameState,
            playerId,
            context
        );
        
        console.log('🎯 AI决策结果:');
        console.log(`- 选择动作: ${decision.finalDecision.type}`);
        console.log(`- 置信度: ${(decision.confidence * 100).toFixed(1)}%`);
        console.log(`- 决策来源: ${decision.source}`);
        console.log(`- 决策时间: ${decision.metadata.decisionTime}ms`);
        console.log(`- 使用算法: ${decision.metadata.algorithmsUsed.join(', ')}`);
        
        if (decision.reasoning.length > 0) {
            console.log('💭 决策推理:');
            decision.reasoning.forEach((reason, index) => {
                console.log(`  ${index + 1}. ${reason}`);
            });
        }
        
        console.log('✅ 决策完成');
    }
    
    // 多智能体对战示例
    async multiAgentGameExample(): Promise<void> {
        console.log('👥 === 多智能体对战示例 ===');
        
        // 创建4个不同类型的AI智能体
        const agents = [
            new ActorCriticAgent('cooperative_agent', AgentType.COOPERATIVE),
            new ActorCriticAgent('competitive_agent', AgentType.COMPETITIVE),
            new ActorCriticAgent('mixed_agent', AgentType.MIXED),
            new ActorCriticAgent('independent_agent', AgentType.INDEPENDENT)
        ];
        
        console.log('🤖 创建了4个不同类型的AI智能体:');
        agents.forEach(agent => {
            console.log(`- ${agent.agentId}: ${agent.agentType}类型`);
        });
        
        // 模拟游戏回合
        const gameRounds = 3;
        for (let round = 1; round <= gameRounds; round++) {
            console.log(`\n🎯 第${round}回合开始`);
            
            const gameState = this.createMockGameState();
            
            // 每个智能体做决策
            const decisions = [];
            for (const agent of agents) {
                const context = this.createRandomContext();
                const decision = await this.simulateAgentDecision(agent, gameState, context);
                decisions.push({
                    agentId: agent.agentId,
                    agentType: agent.agentType,
                    decision: decision.type,
                    confidence: decision.confidence
                });
            }
            
            // 显示回合结果
            console.log('📊 本回合决策结果:');
            decisions.forEach(d => {
                console.log(`  ${d.agentId}: ${d.decision} (置信度: ${(d.confidence! * 100).toFixed(1)}%)`);
            });
            
            // 模拟合作行为
            this.simulateCooperativeBehavior(agents);
        }
        
        console.log('✅ 多智能体对战示例完成');
    }
    
    // 性能监控示例
    async performanceMonitoringExample(): Promise<void> {
        console.log('📈 === 性能监控示例 ===');
        
        // 运行一系列决策来生成性能数据
        const testRounds = 20;
        console.log(`执行${testRounds}轮决策测试...`);
        
        const startTime = Date.now();
        
        for (let i = 0; i < testRounds; i++) {
            const gameState = this.createMockGameState();
            const context = this.createRandomContext();
            
            await this.rlIntegration.makeDecision(gameState, 'test_player', context);
            
            if ((i + 1) % 5 === 0) {
                console.log(`完成 ${i + 1}/${testRounds} 轮测试`);
            }
        }
        
        const totalTime = Date.now() - startTime;
        
        // 获取性能指标
        const metrics = this.rlIntegration.getPerformanceMetrics();
        
        console.log('\n📊 性能监控结果:');
        console.log(`- 总测试时间: ${totalTime}ms`);
        console.log(`- 平均每次决策: ${(totalTime / testRounds).toFixed(1)}ms`);
        console.log(`- 决策准确率: ${(metrics.decisionAccuracy * 100).toFixed(1)}%`);
        console.log(`- 内存使用: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
        console.log(`- 适应率: ${(metrics.adaptationRate * 100).toFixed(1)}%`);
        
        // 算法效率统计
        if (metrics.algorithmEfficiency.size > 0) {
            console.log('\n🔧 算法效率统计:');
            for (const [algorithm, efficiency] of metrics.algorithmEfficiency) {
                console.log(`- ${algorithm}: ${(efficiency * 100).toFixed(1)}%`);
            }
        }
        
        console.log('✅ 性能监控完成');
    }
    
    // 保存和加载示例
    async saveLoadExample(): Promise<void> {
        console.log('💾 === 保存和加载示例 ===');
        
        const saveFilePath = './rl_system_state';
        
        // 保存系统状态
        console.log('保存RL系统状态...');
        await this.rlIntegration.saveSystem(saveFilePath);
        
        // 获取决策历史
        const decisionHistory = this.rlIntegration.getDecisionHistory();
        console.log(`📚 保存了 ${decisionHistory.length} 条决策历史`);
        
        // 模拟加载系统状态
        console.log('加载RL系统状态...');
        await this.rlIntegration.loadSystem(saveFilePath);
        
        console.log('✅ 保存和加载完成');
    }
    
    // 配置优化示例
    async configurationOptimizationExample(): Promise<void> {
        console.log('⚙️ === 配置优化示例 ===');
        
        // 测试不同的配置参数
        const configurations = [
            { name: '快速决策模式', rlWeight: 0.3, classicWeight: 0.7, maxDecisionTime: 1000 },
            { name: '平衡模式', rlWeight: 0.5, classicWeight: 0.5, maxDecisionTime: 3000 },
            { name: '深度学习模式', rlWeight: 0.8, classicWeight: 0.2, maxDecisionTime: 5000 }
        ];
        
        for (const config of configurations) {
            console.log(`\n🔧 测试配置: ${config.name}`);
            
            // 更新配置
            this.rlIntegration.updateConfig({
                rlWeight: config.rlWeight,
                classicWeight: config.classicWeight,
                maxDecisionTime: config.maxDecisionTime
            });
            
            // 运行测试
            const testStart = Date.now();
            const gameState = this.createMockGameState();
            const context = this.createRandomContext();
            
            const decision = await this.rlIntegration.makeDecision(
                gameState, 
                'config_test_player', 
                context
            );
            
            const testTime = Date.now() - testStart;
            
            console.log(`  - 决策时间: ${testTime}ms`);
            console.log(`  - 置信度: ${(decision.confidence * 100).toFixed(1)}%`);
            console.log(`  - 决策来源: ${decision.source}`);
        }
        
        console.log('✅ 配置优化测试完成');
    }
    
    // 事件监听设置
    private setupEventListeners(): void {
        this.rlIntegration.on('system_initialized', (data) => {
            console.log('🟢 系统初始化完成:', data);
        });
        
        this.rlIntegration.on('training_started', (data) => {
            console.log('🏋️ 训练开始:', data);
        });
        
        this.rlIntegration.on('rl_episode_completed', (data) => {
            if (data.episode % 50 === 0) {
                console.log(`📈 训练进度: ${data.episode} 回合完成`);
            }
        });
        
        this.rlIntegration.on('rl_training_completed', (data) => {
            console.log('🎉 训练完成:', data);
        });
        
        this.rlIntegration.on('decision_made', (decision) => {
            if (Math.random() < 0.1) { // 10%概率记录决策
                console.log(`🎯 决策记录: ${decision.finalDecision.type} (${(decision.confidence * 100).toFixed(1)}%)`);
            }
        });
        
        this.rlIntegration.on('decision_error', (error) => {
            console.error('❌ 决策错误:', error);
        });
    }
    
    // 辅助方法
    private createMockGameState(): any {
        return {
            players: [
                {
                    id: 'player_1',
                    name: 'AI Agent 1',
                    money: 1500,
                    position: Math.floor(Math.random() * 40),
                    properties: [],
                    houses: 0,
                    hotels: 0,
                    isInJail: false,
                    zodiacSign: 'dragon',
                    availableSkills: [{ id: 'fire_boost' }, { id: 'wind_travel' }],
                    usedSkills: []
                },
                {
                    id: 'player_2',
                    name: 'AI Agent 2',
                    money: 1200,
                    position: Math.floor(Math.random() * 40),
                    properties: [],
                    houses: 0,
                    hotels: 0,
                    isInJail: false,
                    zodiacSign: 'tiger',
                    availableSkills: [{ id: 'strength_boost' }],
                    usedSkills: []
                }
            ],
            properties: [],
            currentPlayerIndex: 0,
            round: Math.floor(Math.random() * 10) + 1,
            phase: 'mid',
            totalMoney: 2700,
            totalHouses: 0,
            totalHotels: 0
        };
    }
    
    private createRandomContext(): any {
        return {
            urgency: Math.random(),
            complexity: Math.random(),
            uncertainty: Math.random(),
            stakesLevel: Math.random(),
            availableTime: Math.random() * 5000 + 1000,
            resourceConstraints: {},
            environmentalFactors: {}
        };
    }
    
    private async simulateAgentDecision(agent: any, gameState: any, context: any): Promise<any> {
        // 简化的智能体决策模拟
        const actions = ['roll_dice', 'buy_property', 'develop_property', 'use_skill', 'pass_turn'];
        const selectedAction = actions[Math.floor(Math.random() * actions.length)];
        
        return {
            type: selectedAction,
            confidence: Math.random() * 0.5 + 0.5,
            metadata: { source: 'simulation' }
        };
    }
    
    private simulateCooperativeBehavior(agents: any[]): void {
        const cooperativeAgents = agents.filter(a => 
            a.agentType === AgentType.COOPERATIVE || a.agentType === AgentType.MIXED
        );
        
        if (cooperativeAgents.length >= 2) {
            console.log(`🤝 ${cooperativeAgents.length} 个智能体进行合作交流`);
        }
    }
    
    // 运行完整示例
    async runCompleteExample(): Promise<void> {
        console.log('🚀 === Zodiac Monopoly 强化学习系统完整示例 ===\n');
        
        try {
            // 1. 基础使用
            await this.basicUsageExample();
            await this.delay(1000);
            
            // 2. 游戏决策
            await this.gameDecisionExample();
            await this.delay(1000);
            
            // 3. 多智能体对战
            await this.multiAgentGameExample();
            await this.delay(1000);
            
            // 4. 性能监控
            await this.performanceMonitoringExample();
            await this.delay(1000);
            
            // 5. 配置优化
            await this.configurationOptimizationExample();
            await this.delay(1000);
            
            // 6. 保存和加载
            await this.saveLoadExample();
            
            console.log('\n🎉 === 完整示例运行成功！===');
            console.log('📖 强化学习AI决策框架已准备就绪，可以开始实际游戏测试！');
            
        } catch (error) {
            console.error('❌ 示例运行出错:', error);
        } finally {
            // 清理资源
            if (this.rlIntegration) {
                this.rlIntegration.destroy();
            }
        }
    }
    
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 游戏模拟器占位符
class MockGameSimulator {
    constructor() {
        console.log('🎲 模拟游戏环境已初始化');
    }
    
    simulateGame(): void {
        console.log('🎮 模拟游戏运行中...');
    }
}

// 使用示例
export async function runZodiacMonopolyRLExample(): Promise<void> {
    const example = new ZodiacMonopolyRLExample();
    await example.runCompleteExample();
}

// 如果直接运行此文件
if (require.main === module) {
    runZodiacMonopolyRLExample().catch(console.error);
}