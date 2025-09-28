/**
 * AI行为系统完整使用示例
 * Complete AI Behavior System Usage Example
 * 
 * 展示如何使用AI行为树、状态机、决策系统和调试工具的完整示例
 */

import { 
    BehaviorTree, 
    BehaviorTreeBuilder, 
    NodeStatus,
    ExecutionContext 
} from './BehaviorTree';

import { 
    HierarchicalStateMachine, 
    StateMachineBuilder, 
    StateType 
} from './StateMachine';

import { 
    CompositeBehaviorController, 
    BehaviorControlMode 
} from './CompositeBehaviorController';

import { 
    AIDecisionIntegration,
    DecisionType,
    DecisionContext,
    BaseDecisionStrategy,
    BaseDecisionEvaluator,
    PlayerPersonality
} from './AIDecisionIntegration';

import { 
    GameSystemIntegration,
    AIPlayerConfig,
    GameState,
    PlayerGameState,
    GameActionType 
} from './GameSystemIntegration';

import { 
    BehaviorDebugger,
    DebugLevel 
} from './BehaviorDebugger';

// 示例：创建完整的AI行为控制系统
export class ZodiacMonopolyAIExample {
    private gameIntegration: GameSystemIntegration;
    private debugger: BehaviorDebugger;

    constructor() {
        this.gameIntegration = new GameSystemIntegration();
        this.debugger = new BehaviorDebugger(this.gameIntegration, DebugLevel.INFO);
    }

    // 运行完整示例
    async runCompleteExample(): Promise<void> {
        console.log('🚀 开始Zodiac Monopoly AI行为系统示例...');

        try {
            // 1. 创建AI玩家
            await this.createAIPlayers();

            // 2. 设置调试器
            this.setupDebugger();

            // 3. 开始游戏模拟
            await this.simulateGame();

            // 4. 生成调试报告
            await this.generateDebugReport();

            console.log('✅ 示例运行完成！');

        } catch (error) {
            console.error('❌ 示例运行失败:', error);
        }
    }

    // 创建AI玩家
    private async createAIPlayers(): Promise<void> {
        console.log('📝 创建AI玩家...');

        // 激进型玩家 - 白羊座
        const aggressivePlayer: AIPlayerConfig = {
            id: 'player_aries',
            name: 'Aries AI',
            zodiacSign: 'aries',
            personality: {
                aggressiveness: 0.9,
                riskTolerance: 0.8,
                cooperativeness: 0.3,
                patience: 0.2,
                greed: 0.7,
                strategicThinking: 0.6
            },
            difficulty: 'hard',
            behaviorMode: BehaviorControlMode.HYBRID_PRIMARY_BT,
            decisionTimeout: 5000,
            customStrategies: ['aggressive_acquisition', 'quick_development']
        };

        // 保守型玩家 - 金牛座
        const conservativePlayer: AIPlayerConfig = {
            id: 'player_taurus',
            name: 'Taurus AI',
            zodiacSign: 'taurus',
            personality: {
                aggressiveness: 0.3,
                riskTolerance: 0.2,
                cooperativeness: 0.7,
                patience: 0.9,
                greed: 0.4,
                strategicThinking: 0.8
            },
            difficulty: 'medium',
            behaviorMode: BehaviorControlMode.HYBRID_PRIMARY_SM,
            decisionTimeout: 8000,
            customStrategies: ['conservative_growth', 'stable_income']
        };

        // 平衡型玩家 - 双子座
        const balancedPlayer: AIPlayerConfig = {
            id: 'player_gemini',
            name: 'Gemini AI',
            zodiacSign: 'gemini',
            personality: {
                aggressiveness: 0.5,
                riskTolerance: 0.6,
                cooperativeness: 0.5,
                patience: 0.5,
                greed: 0.5,
                strategicThinking: 0.7
            },
            difficulty: 'expert',
            behaviorMode: BehaviorControlMode.COLLABORATIVE,
            decisionTimeout: 6000,
            customStrategies: ['adaptive_strategy', 'opportunity_optimization']
        };

        // 创建AI玩家实例
        this.gameIntegration.createAIPlayer(aggressivePlayer);
        this.gameIntegration.createAIPlayer(conservativePlayer);
        this.gameIntegration.createAIPlayer(balancedPlayer);

        console.log('✅ AI玩家创建完成');
    }

    // 设置调试器
    private setupDebugger(): void {
        console.log('🔧 设置调试器...');

        this.debugger.startRecording(DebugLevel.DEBUG);

        // 监听调试事件
        this.debugger.on('debug_event', (event) => {
            if (event.level <= DebugLevel.INFO) {
                console.log(`[${event.component}] ${event.message}`);
            }
        });

        this.debugger.on('performance_metric', (metric) => {
            if (metric.category === 'execution_time' && metric.value > 1000) {
                console.warn(`⚠️ 性能警告: ${metric.name} = ${metric.value}${metric.unit}`);
            }
        });

        console.log('✅ 调试器设置完成');
    }

    // 模拟游戏
    private async simulateGame(): Promise<void> {
        console.log('🎮 开始游戏模拟...');

        // 创建模拟游戏状态
        const gameState = this.createMockGameState();

        // 启动游戏
        await this.gameIntegration.startGame(gameState);

        // 模拟多个回合
        for (let round = 1; round <= 5; round++) {
            console.log(`\n🎯 回合 ${round}`);
            await this.simulateRound(gameState, round);
        }

        // 结束游戏
        await this.gameIntegration.endGame();
        console.log('✅ 游戏模拟完成');
    }

    // 模拟一个回合
    private async simulateRound(gameState: GameState, round: number): Promise<void> {
        const players = ['player_aries', 'player_taurus', 'player_gemini'];

        for (const playerId of players) {
            console.log(`  👤 ${playerId} 的回合`);

            // 更新当前玩家
            gameState.currentPlayer = playerId;
            gameState.currentRound = round;
            this.gameIntegration.updateGameState(gameState);

            // 生成可用动作
            const availableActions = this.generateAvailableActions(playerId, gameState);

            // AI做决策
            const action = await this.gameIntegration.handlePlayerTurn(playerId, availableActions);

            if (action) {
                console.log(`    🎯 选择动作: ${action.type}`);
                
                // 模拟动作执行
                await this.executeAction(action, gameState);
                
                // 触发游戏事件
                await this.gameIntegration.handleGameEvent('action_executed', {
                    playerId,
                    action,
                    round
                });
            } else {
                console.log(`    ❌ ${playerId} 决策超时或失败`);
            }

            // 短暂延迟模拟真实游戏节奏
            await this.delay(100);
        }
    }

    // 生成可用动作
    private generateAvailableActions(playerId: string, gameState: GameState): GameActionType[] {
        const actions: GameActionType[] = [GameActionType.ROLL_DICE, GameActionType.END_TURN];

        const player = gameState.players.get(playerId);
        if (player) {
            // 根据玩家状态添加可用动作
            if (player.cash >= 200) {
                actions.push(GameActionType.BUY_PROPERTY);
            }
            
            if (player.properties.length > 0) {
                actions.push(GameActionType.UPGRADE_PROPERTY);
                actions.push(GameActionType.SELL_PROPERTY);
            }
            
            if (player.cash >= 100) {
                actions.push(GameActionType.TRADE_OFFER);
            }
            
            actions.push(GameActionType.MOVE);
        }

        return actions;
    }

    // 执行动作
    private async executeAction(action: any, gameState: GameState): Promise<void> {
        const player = gameState.players.get(action.playerId);
        if (!player) return;

        switch (action.type) {
            case GameActionType.BUY_PROPERTY:
                player.cash -= 200;
                player.properties.push(`property_${Date.now()}`);
                break;

            case GameActionType.UPGRADE_PROPERTY:
                if (player.properties.length > 0 && player.cash >= 100) {
                    player.cash -= 100;
                    const property = player.properties[0];
                    const currentLevel = player.buildings.get(property) || 0;
                    player.buildings.set(property, currentLevel + 1);
                }
                break;

            case GameActionType.SELL_PROPERTY:
                if (player.properties.length > 0) {
                    player.cash += 150;
                    player.properties.pop();
                }
                break;

            case GameActionType.MOVE:
                player.position = (player.position + Math.floor(Math.random() * 6) + 1) % 40;
                break;

            case GameActionType.ROLL_DICE:
                player.lastRoll = [
                    Math.floor(Math.random() * 6) + 1,
                    Math.floor(Math.random() * 6) + 1
                ];
                break;
        }
    }

    // 创建模拟游戏状态
    private createMockGameState(): GameState {
        const players = new Map<string, PlayerGameState>();

        // 创建玩家状态
        players.set('player_aries', {
            id: 'player_aries',
            name: 'Aries AI',
            zodiacSign: 'aries',
            position: 0,
            cash: 1500,
            properties: [],
            buildings: new Map(),
            specialCards: [],
            debts: new Map(),
            isInJail: false,
            jailTurns: 0,
            lastRoll: [0, 0],
            turnsPaused: 0
        });

        players.set('player_taurus', {
            id: 'player_taurus',
            name: 'Taurus AI',
            zodiacSign: 'taurus',
            position: 0,
            cash: 1500,
            properties: [],
            buildings: new Map(),
            specialCards: [],
            debts: new Map(),
            isInJail: false,
            jailTurns: 0,
            lastRoll: [0, 0],
            turnsPaused: 0
        });

        players.set('player_gemini', {
            id: 'player_gemini',
            name: 'Gemini AI',
            zodiacSign: 'gemini',
            position: 0,
            cash: 1500,
            properties: [],
            buildings: new Map(),
            specialCards: [],
            debts: new Map(),
            isInJail: false,
            jailTurns: 0,
            lastRoll: [0, 0],
            turnsPaused: 0
        });

        return {
            currentRound: 1,
            currentPlayer: 'player_aries',
            players,
            board: {
                spaces: new Map(),
                specialEvents: [],
                activeModifiers: new Map()
            },
            market: {
                propertyPrices: new Map(),
                rentModifiers: new Map(),
                liquidityIndex: 0.8,
                demandSupplyRatio: 1.2,
                marketTrend: 'stable'
            },
            phase: 'turn_start' as any,
            timeRemaining: 30000
        };
    }

    // 生成调试报告
    private async generateDebugReport(): Promise<void> {
        console.log('\n📊 生成调试报告...');

        this.debugger.stopRecording();

        // 获取统计信息
        const stats = this.debugger.getStatistics();
        console.log('调试统计:', stats);

        // 获取游戏统计
        const gameStats = this.gameIntegration.getGameStats();
        console.log('游戏统计:', gameStats);

        // 获取AI玩家统计
        const aiStats = this.gameIntegration.getAllAIStats();
        console.log('AI玩家统计:');
        for (const [playerId, playerStats] of aiStats) {
            console.log(`  ${playerId}:`, playerStats);
        }

        // 生成可视化数据示例
        for (const playerId of ['player_aries', 'player_taurus', 'player_gemini']) {
            console.log(`\n🎨 ${playerId} 可视化数据:`);
            const vizData = this.debugger.generateVisualizationData(playerId);
            
            console.log(`  决策数量: ${vizData.decisionFlow.decisions.length}`);
            console.log(`  决策模式: ${vizData.decisionFlow.patterns.length}`);
            console.log(`  性能指标: ${vizData.performanceMetrics.metrics.length}`);
            console.log(`  时间线事件: ${vizData.timeline.events.length}`);
        }

        // 导出调试数据
        const debugData = this.debugger.exportDebugData();
        console.log(`\n💾 调试数据已准备，包含 ${debugData.events.length} 个事件`);

        console.log('✅ 调试报告生成完成');
    }

    // 延迟工具函数
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 自定义决策策略示例
class ZodiacPropertyStrategy extends BaseDecisionStrategy {
    constructor() {
        super(
            'zodiac_property_strategy',
            'Zodiac Property Strategy',
            '基于星座特征的房产策略',
            [DecisionType.PROPERTY_PURCHASE, DecisionType.PROPERTY_UPGRADE]
        );
    }

    async makeDecision(context: any): Promise<any> {
        const personality = context.personality;
        const gameState = context.gameState;
        const playerId = context.playerId;

        // 基于星座和个性制定决策
        let action = 'hold';
        let confidence = 0.5;
        const reasoning: string[] = [];

        if (personality.aggressiveness > 0.7) {
            action = 'buy_aggressively';
            confidence = 0.8;
            reasoning.push('高激进性促使积极购买');
        } else if (personality.riskTolerance < 0.3) {
            action = 'conservative_buy';
            confidence = 0.6;
            reasoning.push('低风险容忍度选择保守购买');
        }

        return this.createDecisionResult(
            DecisionType.PROPERTY_PURCHASE,
            action,
            confidence,
            reasoning
        );
    }
}

// 自定义决策评估器示例
class ZodiacDecisionEvaluator extends BaseDecisionEvaluator {
    async evaluateDecision(decision: any, context: any): Promise<number> {
        let score = this.getBaseScore(decision);
        
        // 基于星座匹配调整评分
        const zodiacSign = context.playerState?.zodiacSign;
        if (zodiacSign) {
            score += this.getZodiacBonus(decision, zodiacSign);
        }

        return Math.max(0, Math.min(1, score));
    }

    private getZodiacBonus(decision: any, zodiacSign: string): number {
        const bonusMap: { [key: string]: number } = {
            'aries': decision.type === DecisionType.PROPERTY_PURCHASE ? 0.1 : 0,
            'taurus': decision.type === DecisionType.FINANCIAL_MANAGEMENT ? 0.1 : 0,
            'gemini': decision.type === DecisionType.TRADE_NEGOTIATION ? 0.1 : 0
        };

        return bonusMap[zodiacSign] || 0;
    }
}

// 运行示例的主函数
async function runZodiacMonopolyAIExample(): Promise<void> {
    const example = new ZodiacMonopolyAIExample();
    await example.runCompleteExample();
}

// 导出示例类和函数
export {
    ZodiacMonopolyAIExample,
    ZodiacPropertyStrategy,
    ZodiacDecisionEvaluator,
    runZodiacMonopolyAIExample
};

// 如果直接运行此文件，执行示例
if (require.main === module) {
    runZodiacMonopolyAIExample().catch(console.error);
}