/**
 * 游戏系统集成
 * Game System Integration
 * 
 * 将AI行为控制系统与Zodiac Monopoly游戏系统深度集成
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { AIDecisionIntegration, DecisionType, DecisionContext, DecisionResult, PlayerPersonality, DecisionConstraints } from './AIDecisionIntegration';
import { CompositeBehaviorController, BehaviorControlMode } from './CompositeBehaviorController';
import { BehaviorTree, BehaviorTreeBuilder, NodeStatus } from './BehaviorTree';
import { HierarchicalStateMachine, StateMachineBuilder, StateType } from './StateMachine';

// 游戏状态接口
export interface GameState {
    currentRound: number;
    currentPlayer: string;
    players: Map<string, PlayerGameState>;
    board: BoardState;
    market: MarketState;
    phase: GamePhase;
    timeRemaining: number;
}

// 玩家游戏状态
export interface PlayerGameState {
    id: string;
    name: string;
    zodiacSign: string;
    position: number;
    cash: number;
    properties: string[];
    buildings: Map<string, number>;
    specialCards: string[];
    debts: Map<string, number>;
    isInJail: boolean;
    jailTurns: number;
    lastRoll: number[];
    turnsPaused: number;
}

// 棋盘状态
export interface BoardState {
    spaces: Map<string, SpaceState>;
    specialEvents: string[];
    activeModifiers: Map<string, any>;
}

// 空间状态
export interface SpaceState {
    id: string;
    type: 'property' | 'special' | 'corner' | 'tax' | 'chance' | 'community';
    name: string;
    owner: string | null;
    buildingLevel: number;
    rent: number;
    purchasePrice: number;
    upgradePrice: number;
    isActive: boolean;
}

// 市场状态
export interface MarketState {
    propertyPrices: Map<string, number>;
    rentModifiers: Map<string, number>;
    liquidityIndex: number;
    demandSupplyRatio: number;
    marketTrend: 'bull' | 'bear' | 'stable';
}

// 游戏阶段
export enum GamePhase {
    SETUP = 'setup',
    TURN_START = 'turn_start',
    ROLLING = 'rolling',
    MOVING = 'moving',
    LANDING = 'landing',
    ACTION_SELECTION = 'action_selection',
    TRADING = 'trading',
    BUILDING = 'building',
    TURN_END = 'turn_end',
    GAME_END = 'game_end'
}

// 游戏动作类型
export enum GameActionType {
    ROLL_DICE = 'roll_dice',
    MOVE = 'move',
    BUY_PROPERTY = 'buy_property',
    UPGRADE_PROPERTY = 'upgrade_property',
    SELL_PROPERTY = 'sell_property',
    PAY_RENT = 'pay_rent',
    TRADE_OFFER = 'trade_offer',
    TRADE_ACCEPT = 'trade_accept',
    TRADE_REJECT = 'trade_reject',
    USE_SPECIAL_CARD = 'use_special_card',
    MORTGAGE_PROPERTY = 'mortgage_property',
    UNMORTGAGE_PROPERTY = 'unmortgage_property',
    PAY_TAX = 'pay_tax',
    DECLARE_BANKRUPTCY = 'declare_bankruptcy',
    END_TURN = 'end_turn'
}

// 游戏动作
export interface GameAction {
    type: GameActionType;
    playerId: string;
    parameters: Map<string, any>;
    timestamp: number;
    isValid: boolean;
    consequences: string[];
}

// AI玩家配置
export interface AIPlayerConfig {
    id: string;
    name: string;
    zodiacSign: string;
    personality: PlayerPersonality;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    behaviorMode: BehaviorControlMode;
    decisionTimeout: number;
    customStrategies: string[];
}

// 游戏AI接口
export interface GameAI {
    readonly playerId: string;
    readonly config: AIPlayerConfig;
    
    initialize(gameState: GameState): Promise<void>;
    makeDecision(availableActions: GameActionType[], gameState: GameState): Promise<GameAction>;
    onGameEvent(event: string, data: any): Promise<void>;
    onTurnStart(gameState: GameState): Promise<void>;
    onTurnEnd(gameState: GameState): Promise<void>;
    cleanup(): Promise<void>;
}

// 游戏系统集成器
export class GameSystemIntegration extends EventEmitter {
    private decisionIntegration: AIDecisionIntegration;
    private aiPlayers: Map<string, ZodiacMonopolyAI>;
    private gameState: GameState | null;
    private gameEventHistory: any[];
    private isGameActive: boolean;
    private gameStartTime: number;
    private turnTimeouts: Map<string, NodeJS.Timeout>;

    constructor() {
        super();
        this.decisionIntegration = this.createDecisionIntegration();
        this.aiPlayers = new Map();
        this.gameState = null;
        this.gameEventHistory = [];
        this.isGameActive = false;
        this.gameStartTime = 0;
        this.turnTimeouts = new Map();

        this.setupEventHandlers();
    }

    // 创建决策集成系统
    private createDecisionIntegration(): AIDecisionIntegration {
        // 创建行为树
        const behaviorTree = new BehaviorTreeBuilder()
            .sequence('root')
                .condition('check_turn', (context) => {
                    const gameState = context.blackboard.getValue('gameState');
                    const playerId = context.blackboard.getValue('playerId');
                    return gameState?.currentPlayer === playerId;
                })
                .selector('decision_selector')
                    .sequence('emergency_actions')
                        .condition('check_bankruptcy_risk', (context) => {
                            const playerState = context.blackboard.getValue('playerState');
                            return playerState?.cash < 100;
                        })
                        .action('emergency_liquidation', async (context) => {
                            // 紧急清算逻辑
                            return NodeStatus.SUCCESS;
                        })
                    .end()
                    .sequence('normal_actions')
                        .selector('action_priority')
                            .action('property_management', async (context) => {
                                // 房产管理逻辑
                                return NodeStatus.SUCCESS;
                            })
                            .action('trading_opportunities', async (context) => {
                                // 交易机会评估
                                return NodeStatus.SUCCESS;
                            })
                            .action('movement_decision', async (context) => {
                                // 移动决策
                                return NodeStatus.SUCCESS;
                            })
                        .end()
                    .end()
                .end()
            .end()
            .build();

        // 创建状态机
        const stateMachine = new StateMachineBuilder()
            .addCompositeState('game_playing', 'Game Playing')
                .asRoot()
            .addChild('waiting_turn', 'Waiting for Turn')
            .addChild('making_decision', 'Making Decision')
            .addChild('executing_action', 'Executing Action')
            .setInitialState('waiting_turn')
            .addTransition('waiting_turn', 'making_decision', (context) => {
                const gameState = context.data.get('gameState');
                const playerId = context.data.get('playerId');
                return gameState?.currentPlayer === playerId;
            })
            .addTransition('making_decision', 'executing_action', (context) => {
                return context.data.has('selectedAction');
            })
            .addTransition('executing_action', 'waiting_turn', (context) => {
                return context.data.get('actionCompleted') === true;
            })
            .build();

        // 创建复合行为控制器
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

        behaviorController.setBehaviorTree(behaviorTree);
        behaviorController.setStateMachine(stateMachine);

        return new AIDecisionIntegration(behaviorController);
    }

    // 设置事件处理器
    private setupEventHandlers(): void {
        this.decisionIntegration.on('decision_made', (event) => {
            this.emit('ai_decision_made', event);
        });

        this.decisionIntegration.on('decision_error', (event) => {
            this.emit('ai_decision_error', event);
        });
    }

    // 创建AI玩家
    createAIPlayer(config: AIPlayerConfig): ZodiacMonopolyAI {
        const aiPlayer = new ZodiacMonopolyAI(config, this.decisionIntegration);
        this.aiPlayers.set(config.id, aiPlayer);
        
        this.emit('ai_player_created', {
            playerId: config.id,
            name: config.name,
            zodiacSign: config.zodiacSign
        });

        return aiPlayer;
    }

    // 移除AI玩家
    removeAIPlayer(playerId: string): boolean {
        const aiPlayer = this.aiPlayers.get(playerId);
        if (aiPlayer) {
            aiPlayer.cleanup();
            this.aiPlayers.delete(playerId);
            this.emit('ai_player_removed', { playerId });
            return true;
        }
        return false;
    }

    // 开始游戏
    async startGame(gameState: GameState): Promise<void> {
        this.gameState = gameState;
        this.isGameActive = true;
        this.gameStartTime = Date.now();

        // 初始化所有AI玩家
        for (const aiPlayer of this.aiPlayers.values()) {
            await aiPlayer.initialize(gameState);
        }

        await this.decisionIntegration.start(null, gameState);

        this.emit('game_started', {
            gameState,
            aiPlayersCount: this.aiPlayers.size,
            timestamp: this.gameStartTime
        });
    }

    // 结束游戏
    async endGame(): Promise<void> {
        this.isGameActive = false;

        // 清理所有AI玩家
        for (const aiPlayer of this.aiPlayers.values()) {
            await aiPlayer.cleanup();
        }

        // 清理超时计时器
        for (const timeout of this.turnTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.turnTimeouts.clear();

        await this.decisionIntegration.stop();

        this.emit('game_ended', {
            duration: Date.now() - this.gameStartTime,
            finalGameState: this.gameState
        });

        this.gameState = null;
    }

    // 处理游戏事件
    async handleGameEvent(event: string, data: any): Promise<void> {
        if (!this.isGameActive) {
            return;
        }

        // 记录事件
        this.gameEventHistory.push({
            event,
            data,
            timestamp: Date.now()
        });

        // 通知所有AI玩家
        for (const aiPlayer of this.aiPlayers.values()) {
            try {
                await aiPlayer.onGameEvent(event, data);
            } catch (error) {
                this.emit('ai_event_error', {
                    playerId: aiPlayer.playerId,
                    event,
                    error
                });
            }
        }

        this.emit('game_event_processed', { event, data });
    }

    // 处理玩家回合
    async handlePlayerTurn(playerId: string, availableActions: GameActionType[]): Promise<GameAction | null> {
        const aiPlayer = this.aiPlayers.get(playerId);
        if (!aiPlayer || !this.gameState) {
            return null;
        }

        try {
            // 设置回合超时
            const timeout = setTimeout(() => {
                this.emit('turn_timeout', { playerId });
            }, aiPlayer.config.decisionTimeout);

            this.turnTimeouts.set(playerId, timeout);

            // 通知AI玩家回合开始
            await aiPlayer.onTurnStart(this.gameState);

            // 获取AI决策
            const action = await aiPlayer.makeDecision(availableActions, this.gameState);

            // 清理超时
            clearTimeout(timeout);
            this.turnTimeouts.delete(playerId);

            // 通知回合结束
            await aiPlayer.onTurnEnd(this.gameState);

            this.emit('turn_completed', {
                playerId,
                action,
                duration: Date.now() - this.gameStartTime
            });

            return action;

        } catch (error) {
            // 清理超时
            const timeout = this.turnTimeouts.get(playerId);
            if (timeout) {
                clearTimeout(timeout);
                this.turnTimeouts.delete(playerId);
            }

            this.emit('turn_error', {
                playerId,
                error,
                availableActions
            });

            return null;
        }
    }

    // 更新游戏状态
    updateGameState(newGameState: GameState): void {
        this.gameState = newGameState;
        
        // 通知所有AI玩家状态更新
        for (const aiPlayer of this.aiPlayers.values()) {
            aiPlayer.updateGameState(newGameState);
        }

        this.emit('game_state_updated', { gameState: newGameState });
    }

    // 获取AI玩家统计
    getAIPlayerStats(playerId: string): any {
        const aiPlayer = this.aiPlayers.get(playerId);
        if (!aiPlayer) {
            return null;
        }

        return aiPlayer.getStatistics();
    }

    // 获取所有AI玩家统计
    getAllAIStats(): Map<string, any> {
        const stats = new Map();
        for (const [playerId, aiPlayer] of this.aiPlayers) {
            stats.set(playerId, aiPlayer.getStatistics());
        }
        return stats;
    }

    // 获取游戏统计
    getGameStats(): any {
        return {
            isActive: this.isGameActive,
            duration: this.isGameActive ? Date.now() - this.gameStartTime : 0,
            aiPlayersCount: this.aiPlayers.size,
            eventsCount: this.gameEventHistory.length,
            currentGameState: this.gameState,
            decisionSystemStats: this.decisionIntegration.getCurrentStatus()
        };
    }

    // 导出游戏数据
    exportGameData(): any {
        return {
            aiPlayers: Array.from(this.aiPlayers.entries()).map(([id, player]) => ({
                id,
                config: player.config,
                stats: player.getStatistics()
            })),
            gameEventHistory: this.gameEventHistory,
            gameStats: this.getGameStats(),
            decisionData: this.decisionIntegration.exportDecisionData()
        };
    }
}

// Zodiac Monopoly AI实现
export class ZodiacMonopolyAI implements GameAI {
    public readonly playerId: string;
    public readonly config: AIPlayerConfig;
    
    private decisionIntegration: AIDecisionIntegration;
    private currentGameState: GameState | null;
    private actionHistory: GameAction[];
    private statistics: any;

    constructor(config: AIPlayerConfig, decisionIntegration: AIDecisionIntegration) {
        this.playerId = config.id;
        this.config = config;
        this.decisionIntegration = decisionIntegration;
        this.currentGameState = null;
        this.actionHistory = [];
        
        this.statistics = {
            decisionsCount: 0,
            averageDecisionTime: 0,
            successfulActions: 0,
            failedActions: 0,
            totalCashEarned: 0,
            totalCashSpent: 0,
            propertiesBought: 0,
            propertiesSold: 0,
            tradesInitiated: 0,
            tradesCompleted: 0
        };
    }

    // 初始化AI玩家
    async initialize(gameState: GameState): Promise<void> {
        this.currentGameState = gameState;
        this.actionHistory = [];
        
        // 重置统计数据
        this.statistics = {
            decisionsCount: 0,
            averageDecisionTime: 0,
            successfulActions: 0,
            failedActions: 0,
            totalCashEarned: 0,
            totalCashSpent: 0,
            propertiesBought: 0,
            propertiesSold: 0,
            tradesInitiated: 0,
            tradesCompleted: 0
        };
    }

    // 制定决策
    async makeDecision(availableActions: GameActionType[], gameState: GameState): Promise<GameAction> {
        const startTime = Date.now();
        this.currentGameState = gameState;

        try {
            // 创建决策上下文
            const context = this.createDecisionContext(availableActions, gameState);
            
            // 确定决策类型
            const decisionType = this.determineDecisionType(availableActions);
            
            // 使用决策集成系统制定决策
            const decisionResult = await this.decisionIntegration.makeDecision(decisionType, context);
            
            // 转换为游戏动作
            const action = this.convertDecisionToAction(decisionResult, availableActions);
            
            // 更新统计
            this.updateStatistics(action, Date.now() - startTime);
            
            // 记录动作
            this.actionHistory.push(action);
            
            return action;

        } catch (error) {
            // 如果AI决策失败，选择安全的默认动作
            const fallbackAction = this.createFallbackAction(availableActions);
            this.updateStatistics(fallbackAction, Date.now() - startTime, true);
            return fallbackAction;
        }
    }

    // 创建决策上下文
    private createDecisionContext(availableActions: GameActionType[], gameState: GameState): DecisionContext {
        const playerState = gameState.players.get(this.playerId);
        
        const constraints: DecisionConstraints = {
            maxThinkingTime: this.config.decisionTimeout,
            minCashReserve: Math.max(100, (playerState?.cash || 0) * 0.1),
            maxRiskLevel: this.config.personality.riskTolerance,
            priorityActions: this.getPriorityActions(availableActions, gameState),
            blacklistedActions: this.getBlacklistedActions(availableActions, gameState)
        };

        return {
            playerId: this.playerId,
            gameState,
            playerState,
            availableActions: availableActions.map(a => a.toString()),
            timeRemaining: gameState.timeRemaining,
            difficulty: this.config.difficulty,
            personality: this.config.personality,
            constraints
        };
    }

    // 确定决策类型
    private determineDecisionType(availableActions: GameActionType[]): DecisionType {
        if (availableActions.includes(GameActionType.BUY_PROPERTY)) {
            return DecisionType.PROPERTY_PURCHASE;
        }
        if (availableActions.includes(GameActionType.UPGRADE_PROPERTY)) {
            return DecisionType.PROPERTY_UPGRADE;
        }
        if (availableActions.includes(GameActionType.TRADE_OFFER)) {
            return DecisionType.TRADE_NEGOTIATION;
        }
        if (availableActions.includes(GameActionType.MOVE)) {
            return DecisionType.MOVEMENT;
        }
        return DecisionType.STRATEGIC_PLANNING;
    }

    // 转换决策为游戏动作
    private convertDecisionToAction(decisionResult: DecisionResult, availableActions: GameActionType[]): GameAction {
        // 尝试映射决策结果到可用动作
        const actionType = this.mapDecisionToActionType(decisionResult, availableActions);
        
        return {
            type: actionType,
            playerId: this.playerId,
            parameters: decisionResult.parameters,
            timestamp: Date.now(),
            isValid: true,
            consequences: decisionResult.reasoning
        };
    }

    // 映射决策到动作类型
    private mapDecisionToActionType(decisionResult: DecisionResult, availableActions: GameActionType[]): GameActionType {
        // 根据决策类型和可用动作选择最合适的动作
        switch (decisionResult.type) {
            case DecisionType.PROPERTY_PURCHASE:
                return availableActions.includes(GameActionType.BUY_PROPERTY) 
                    ? GameActionType.BUY_PROPERTY 
                    : this.getDefaultAction(availableActions);
            
            case DecisionType.PROPERTY_UPGRADE:
                return availableActions.includes(GameActionType.UPGRADE_PROPERTY)
                    ? GameActionType.UPGRADE_PROPERTY
                    : this.getDefaultAction(availableActions);
            
            case DecisionType.TRADE_NEGOTIATION:
                return availableActions.includes(GameActionType.TRADE_OFFER)
                    ? GameActionType.TRADE_OFFER
                    : this.getDefaultAction(availableActions);
            
            case DecisionType.MOVEMENT:
                return availableActions.includes(GameActionType.MOVE)
                    ? GameActionType.MOVE
                    : GameActionType.ROLL_DICE;
            
            default:
                return this.getDefaultAction(availableActions);
        }
    }

    // 获取默认动作
    private getDefaultAction(availableActions: GameActionType[]): GameActionType {
        const priorities = [
            GameActionType.END_TURN,
            GameActionType.ROLL_DICE,
            GameActionType.MOVE
        ];

        for (const priority of priorities) {
            if (availableActions.includes(priority)) {
                return priority;
            }
        }

        return availableActions[0] || GameActionType.END_TURN;
    }

    // 创建备用动作
    private createFallbackAction(availableActions: GameActionType[]): GameAction {
        return {
            type: this.getDefaultAction(availableActions),
            playerId: this.playerId,
            parameters: new Map(),
            timestamp: Date.now(),
            isValid: true,
            consequences: ['Fallback action due to decision error']
        };
    }

    // 获取优先动作
    private getPriorityActions(availableActions: GameActionType[], gameState: GameState): string[] {
        const playerState = gameState.players.get(this.playerId);
        const priorities: string[] = [];

        // 基于个性和游戏状态确定优先级
        if (this.config.personality.aggressiveness > 0.7) {
            priorities.push(GameActionType.BUY_PROPERTY, GameActionType.UPGRADE_PROPERTY);
        }

        if (this.config.personality.cooperativeness > 0.6) {
            priorities.push(GameActionType.TRADE_OFFER);
        }

        if (playerState && playerState.cash < 500) {
            priorities.push(GameActionType.SELL_PROPERTY, GameActionType.MORTGAGE_PROPERTY);
        }

        return priorities;
    }

    // 获取禁用动作
    private getBlacklistedActions(availableActions: GameActionType[], gameState: GameState): string[] {
        const blacklist: string[] = [];
        const playerState = gameState.players.get(this.playerId);

        // 基于风险容忍度和当前状态确定禁用动作
        if (this.config.personality.riskTolerance < 0.3) {
            blacklist.push(GameActionType.DECLARE_BANKRUPTCY);
        }

        if (playerState && playerState.cash < 200) {
            blacklist.push(GameActionType.BUY_PROPERTY, GameActionType.UPGRADE_PROPERTY);
        }

        return blacklist;
    }

    // 处理游戏事件
    async onGameEvent(event: string, data: any): Promise<void> {
        // 根据事件类型更新内部状态或触发特殊行为
        switch (event) {
            case 'property_sold':
                if (data.buyer === this.playerId) {
                    this.statistics.propertiesBought++;
                }
                break;
            
            case 'trade_completed':
                if (data.participants.includes(this.playerId)) {
                    this.statistics.tradesCompleted++;
                }
                break;
                
            case 'player_bankrupt':
                // 分析破产对策略的影响
                break;
        }
    }

    // 回合开始处理
    async onTurnStart(gameState: GameState): Promise<void> {
        this.currentGameState = gameState;
        // 可以在这里进行回合开始前的准备工作
    }

    // 回合结束处理
    async onTurnEnd(gameState: GameState): Promise<void> {
        this.currentGameState = gameState;
        // 可以在这里进行回合结束后的清理工作
    }

    // 更新游戏状态
    updateGameState(gameState: GameState): void {
        this.currentGameState = gameState;
    }

    // 更新统计信息
    private updateStatistics(action: GameAction, decisionTime: number, failed: boolean = false): void {
        this.statistics.decisionsCount++;
        this.statistics.averageDecisionTime = 
            (this.statistics.averageDecisionTime * (this.statistics.decisionsCount - 1) + decisionTime) 
            / this.statistics.decisionsCount;

        if (failed) {
            this.statistics.failedActions++;
        } else {
            this.statistics.successfulActions++;
        }

        // 根据动作类型更新特定统计
        switch (action.type) {
            case GameActionType.BUY_PROPERTY:
                this.statistics.propertiesBought++;
                break;
            case GameActionType.SELL_PROPERTY:
                this.statistics.propertiesSold++;
                break;
            case GameActionType.TRADE_OFFER:
                this.statistics.tradesInitiated++;
                break;
        }
    }

    // 获取统计信息
    getStatistics(): any {
        return {
            ...this.statistics,
            actionHistorySize: this.actionHistory.length,
            lastActionTime: this.actionHistory.length > 0 
                ? this.actionHistory[this.actionHistory.length - 1].timestamp 
                : 0
        };
    }

    // 清理资源
    async cleanup(): Promise<void> {
        this.currentGameState = null;
        this.actionHistory = [];
    }
}