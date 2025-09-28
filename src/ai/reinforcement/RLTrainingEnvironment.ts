/**
 * 强化学习训练环境
 * Reinforcement Learning Training Environment
 * 
 * 为Zodiac Monopoly游戏提供完整的RL训练环境
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { 
    RLEnvironment, 
    RLState, 
    RLAction, 
    RLReward, 
    RLAgent 
} from './ReinforcementLearningFramework';

import { 
    MultiAgentEnvironment,
    MultiAgentState, 
    MultiAgentAction, 
    MultiAgentReward,
    MultiAgentRLAgent,
    CommunicationMessage 
} from './MultiAgentRLFramework';

import { GameEngine } from '../../engine/GameEngine';
import { Player } from '../../engine/Player';
import { Property } from '../../engine/Property';
import { ZodiacSkill } from '../../skills/ZodiacSkill';

// 训练配置
export interface TrainingConfig {
    maxEpisodes: number;
    maxStepsPerEpisode: number;
    evaluationInterval: number;
    saveInterval: number;
    logInterval: number;
    validationGames: number;
    
    // 奖励设计
    rewardWeights: {
        money: number;
        properties: number;
        gameWin: number;
        cooperation: number;
        efficiency: number;
        skillUsage: number;
    };
    
    // 环境参数
    randomSeed?: number;
    difficultyLevel: 'easy' | 'medium' | 'hard' | 'adaptive';
    enableCommunication: boolean;
    enableSkills: boolean;
    seasonalEffects: boolean;
}

// 游戏状态快照
export interface GameStateSnapshot {
    players: PlayerSnapshot[];
    currentPlayerIndex: number;
    round: number;
    phase: 'early' | 'mid' | 'late';
    properties: PropertySnapshot[];
    gameEvents: GameEventSnapshot[];
    timestamp: number;
}

export interface PlayerSnapshot {
    id: string;
    position: number;
    money: number;
    properties: string[];
    houses: number;
    hotels: number;
    isInJail: boolean;
    zodiacSign: string;
    availableSkills: string[];
    usedSkills: string[];
}

export interface PropertySnapshot {
    id: string;
    name: string;
    owner?: string;
    houses: number;
    hotels: number;
    isMortgaged: boolean;
    currentRent: number;
}

export interface GameEventSnapshot {
    type: string;
    description: string;
    playerId?: string;
    timestamp: number;
    impact: any;
}

// 训练统计
export interface TrainingStatistics {
    episode: number;
    totalSteps: number;
    averageReward: number;
    winRate: number;
    convergenceMetrics: {
        policyStability: number;
        valueAccuracy: number;
        explorationRate: number;
    };
    performanceMetrics: {
        episodeLength: number;
        decisionsPerSecond: number;
        memoryUsage: number;
    };
    agentSpecificStats: Map<string, AgentStatistics>;
}

export interface AgentStatistics {
    agentId: string;
    totalReward: number;
    averageReward: number;
    winCount: number;
    winRate: number;
    skillUsageCount: Map<string, number>;
    cooperationCount: number;
    communicationCount: number;
    averageDecisionTime: number;
    explorationRate: number;
    learningProgress: number;
}

// Zodiac Monopoly RL环境实现
export class ZodiacMonopolyRLEnvironment extends EventEmitter implements MultiAgentEnvironment {
    public agentIds: string[];
    public maxAgents: number;
    public communicationRange: number;
    
    private gameEngine: GameEngine;
    private agents: Map<string, MultiAgentRLAgent>;
    private config: TrainingConfig;
    private currentState: MultiAgentState;
    private episodeCount: number;
    private stepCount: number;
    private trainingStats: TrainingStatistics;
    private gameHistory: GameStateSnapshot[];
    private rewardCalculator: RewardCalculator;
    
    constructor(config: TrainingConfig) {
        super();
        this.config = config;
        this.agentIds = [];
        this.maxAgents = 8;
        this.communicationRange = 5;
        this.agents = new Map();
        this.episodeCount = 0;
        this.stepCount = 0;
        this.gameHistory = [];
        
        // 初始化游戏引擎
        this.gameEngine = new GameEngine();
        this.rewardCalculator = new RewardCalculator(config.rewardWeights);
        
        // 初始化训练统计
        this.initializeTrainingStatistics();
        
        // 设置随机种子
        if (config.randomSeed) {
            Math.random = this.seededRandom(config.randomSeed);
        }
    }
    
    // 重置环境
    async reset(): Promise<MultiAgentState> {
        this.episodeCount++;
        this.stepCount = 0;
        this.gameHistory = [];
        
        // 重置游戏引擎
        await this.gameEngine.initializeGame({
            playerCount: this.agentIds.length,
            enableSkills: this.config.enableSkills,
            enableSeasonal: this.config.seasonalEffects,
            difficulty: this.config.difficultyLevel
        });
        
        // 为每个智能体创建玩家
        for (const agentId of this.agentIds) {
            const zodiacSign = this.assignZodiacSign(agentId);
            await this.gameEngine.addPlayer({
                id: agentId,
                name: `Agent_${agentId}`,
                zodiacSign,
                isAI: true
            });
        }
        
        // 创建初始状态
        this.currentState = await this.createMultiAgentState();
        
        this.emit('environment_reset', { 
            episode: this.episodeCount,
            agentCount: this.agentIds.length 
        });
        
        return this.currentState;
    }
    
    // 执行一步
    async step(action: MultiAgentAction): Promise<[MultiAgentState, MultiAgentReward, boolean]> {
        this.stepCount++;
        
        // 记录当前状态快照
        const preActionSnapshot = this.captureGameSnapshot();
        this.gameHistory.push(preActionSnapshot);
        
        // 处理通信
        await this.processCommunications(action.communications);
        
        // 执行智能体动作
        const actionResults = await this.executeAgentActions(action.agentActions);
        
        // 处理协调信号
        await this.processCoordinationSignals(action.coordinationSignals);
        
        // 更新游戏状态
        await this.updateGameState(actionResults);
        
        // 创建新状态
        const nextState = await this.createMultiAgentState();
        
        // 计算奖励
        const rewards = await this.calculateRewards(
            this.currentState,
            action,
            nextState,
            actionResults
        );
        
        // 检查游戏是否结束
        const done = await this.checkGameEnd();
        
        // 更新当前状态
        this.currentState = nextState;
        
        // 更新统计
        this.updateTrainingStatistics(action, rewards, done);
        
        this.emit('step_completed', {
            episode: this.episodeCount,
            step: this.stepCount,
            rewards,
            done
        });
        
        return [nextState, rewards, done];
    }
    
    // 获取可用动作
    getAvailableActions(state: MultiAgentState): RLAction[] {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        if (!currentPlayer) return [];
        
        const availableActions: RLAction[] = [];
        
        // 基础动作
        availableActions.push({
            type: 'roll_dice',
            confidence: 1.0,
            metadata: { always_available: true }
        });
        
        availableActions.push({
            type: 'pass_turn',
            confidence: 1.0,
            metadata: { always_available: true }
        });
        
        // 根据游戏状态添加可用动作
        const playerState = state.agentStates.get(currentPlayer.id);
        if (playerState) {
            // 购买房产
            if (this.canBuyProperty(currentPlayer)) {
                availableActions.push({
                    type: 'buy_property',
                    confidence: 0.8,
                    targetProperty: this.getCurrentProperty(currentPlayer)?.id
                });
            }
            
            // 开发房产
            if (this.canDevelopProperty(currentPlayer)) {
                availableActions.push({
                    type: 'develop_property',
                    confidence: 0.7,
                    metadata: { development_opportunities: this.getDevelopmentOpportunities(currentPlayer) }
                });
            }
            
            // 交易提议
            if (this.canTrade(currentPlayer)) {
                availableActions.push({
                    type: 'trade_offer',
                    confidence: 0.6,
                    metadata: { potential_partners: this.getPotentialTradePartners(currentPlayer) }
                });
            }
            
            // 使用生肖技能
            if (this.config.enableSkills && playerState.availableSkills.length > 0) {
                availableActions.push({
                    type: 'use_skill',
                    confidence: 0.9,
                    metadata: { available_skills: playerState.availableSkills }
                });
            }
            
            // 抵押/赎回房产
            if (this.canMortgage(currentPlayer)) {
                availableActions.push({
                    type: 'mortgage_property',
                    confidence: 0.5
                });
            }
            
            if (this.canUnmortgage(currentPlayer)) {
                availableActions.push({
                    type: 'unmortgage_property',
                    confidence: 0.6
                });
            }
        }
        
        return availableActions;
    }
    
    // 添加智能体
    addAgent(agent: MultiAgentRLAgent): void {
        if (this.agentIds.length >= this.maxAgents) {
            throw new Error(`Maximum number of agents (${this.maxAgents}) reached`);
        }
        
        this.agentIds.push(agent.agentId);
        this.agents.set(agent.agentId, agent);
        
        // 初始化智能体统计
        this.initializeAgentStatistics(agent.agentId);
        
        this.emit('agent_added', { agentId: agent.agentId });
    }
    
    // 移除智能体
    removeAgent(agentId: string): void {
        const index = this.agentIds.indexOf(agentId);
        if (index > -1) {
            this.agentIds.splice(index, 1);
            this.agents.delete(agentId);
            this.trainingStats.agentSpecificStats.delete(agentId);
            
            this.emit('agent_removed', { agentId });
        }
    }
    
    // 获取智能体邻居
    getAgentNeighbors(agentId: string): string[] {
        const neighbors: string[] = [];
        const agentState = this.currentState.agentStates.get(agentId);
        
        if (!agentState) return neighbors;
        
        for (const [otherId, otherState] of this.currentState.agentStates) {
            if (otherId !== agentId) {
                const distance = Math.abs(agentState.position - otherState.position);
                if (distance <= this.communicationRange) {
                    neighbors.push(otherId);
                }
            }
        }
        
        return neighbors;
    }
    
    // 传递消息
    deliverMessage(message: CommunicationMessage): boolean {
        if (!this.config.enableCommunication) return false;
        
        const recipient = this.agents.get(message.receiverId);
        if (recipient) {
            recipient.receiveMessage(message);
            return true;
        }
        
        return false;
    }
    
    // 广播消息
    broadcastMessage(message: CommunicationMessage): void {
        if (!this.config.enableCommunication) return;
        
        for (const [agentId, agent] of this.agents) {
            if (agentId !== message.senderId) {
                agent.receiveMessage(message);
            }
        }
    }
    
    // 获取全局状态
    getGlobalState(): RLState {
        return this.currentState.globalState;
    }
    
    // 获取智能体状态
    getAgentState(agentId: string): RLState {
        return this.currentState.agentStates.get(agentId) || this.createEmptyState();
    }
    
    // 更新智能体状态
    updateAgentState(agentId: string, state: RLState): void {
        this.currentState.agentStates.set(agentId, state);
    }
    
    // 私有方法实现
    private async createMultiAgentState(): Promise<MultiAgentState> {
        const globalState = await this.createGlobalState();
        const agentStates = new Map<string, RLState>();
        
        // 为每个智能体创建个人状态
        for (const agentId of this.agentIds) {
            const agentState = await this.createAgentSpecificState(agentId);
            agentStates.set(agentId, agentState);
        }
        
        return {
            globalState,
            agentStates,
            sharedInformation: new Map(),
            communicationHistory: [],
            timestamp: Date.now()
        };
    }
    
    private async createGlobalState(): Promise<RLState> {
        const gameState = this.gameEngine.getGameState();
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        
        return {
            money: gameState.totalMoney || 0,
            position: currentPlayer?.position || 0,
            properties: gameState.properties?.map(p => p.id) || [],
            houses: gameState.totalHouses || 0,
            hotels: gameState.totalHotels || 0,
            isInJail: false,
            turnsInJail: 0,
            doubleRollCount: 0,
            gamePhase: this.determineGamePhase(),
            roundNumber: gameState.round || 0,
            playerCount: this.agentIds.length,
            activePlayerIndex: gameState.currentPlayerIndex || 0,
            currentRent: 0,
            developmentCost: 0,
            mortgageValue: 0,
            availableSkills: [],
            usedSkills: [],
            seasonalBonus: this.getSeasonalBonus()
        };
    }
    
    private async createAgentSpecificState(agentId: string): Promise<RLState> {
        const player = this.gameEngine.getPlayer(agentId);
        if (!player) return this.createEmptyState();
        
        return {
            money: player.money,
            position: player.position,
            properties: player.properties.map(p => p.id),
            houses: player.houses,
            hotels: player.hotels,
            isInJail: player.isInJail,
            turnsInJail: player.turnsInJail,
            doubleRollCount: player.doubleRollCount,
            gamePhase: this.determineGamePhase(),
            roundNumber: this.gameEngine.getGameState().round || 0,
            playerCount: this.agentIds.length,
            activePlayerIndex: this.gameEngine.getGameState().currentPlayerIndex || 0,
            currentRent: this.getCurrentRent(player),
            developmentCost: this.getDevelopmentCost(player),
            mortgageValue: this.getMortgageValue(player),
            availableSkills: this.getAvailableSkills(player),
            usedSkills: this.getUsedSkills(player),
            seasonalBonus: this.getSeasonalBonus()
        };
    }
    
    private createEmptyState(): RLState {
        return {
            money: 0,
            position: 0,
            properties: [],
            houses: 0,
            hotels: 0,
            isInJail: false,
            turnsInJail: 0,
            doubleRollCount: 0,
            gamePhase: 'early',
            roundNumber: 0,
            playerCount: 0,
            activePlayerIndex: 0,
            currentRent: 0,
            developmentCost: 0,
            mortgageValue: 0,
            availableSkills: [],
            usedSkills: [],
            seasonalBonus: 0
        };
    }
    
    private async processCommunications(communications: CommunicationMessage[]): Promise<void> {
        for (const message of communications) {
            if (message.receiverId === 'broadcast') {
                this.broadcastMessage(message);
            } else {
                this.deliverMessage(message);
            }
        }
    }
    
    private async executeAgentActions(agentActions: Map<string, RLAction>): Promise<Map<string, any>> {
        const results = new Map<string, any>();
        
        for (const [agentId, action] of agentActions) {
            try {
                const result = await this.executeAction(agentId, action);
                results.set(agentId, result);
            } catch (error) {
                console.error(`Error executing action for agent ${agentId}:`, error);
                results.set(agentId, { success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    private async executeAction(agentId: string, action: RLAction): Promise<any> {
        const player = this.gameEngine.getPlayer(agentId);
        if (!player) throw new Error(`Player ${agentId} not found`);
        
        switch (action.type) {
            case 'roll_dice':
                return await this.gameEngine.rollDice(agentId);
            
            case 'buy_property':
                const property = this.getCurrentProperty(player);
                if (property && action.targetProperty) {
                    return await this.gameEngine.buyProperty(agentId, action.targetProperty);
                }
                return { success: false, reason: 'No property to buy' };
            
            case 'develop_property':
                if (action.targetProperty) {
                    return await this.gameEngine.developProperty(agentId, action.targetProperty);
                }
                return { success: false, reason: 'No property specified' };
            
            case 'trade_offer':
                // 实现交易逻辑
                return this.processTrade(agentId, action);
            
            case 'use_skill':
                if (action.skillId) {
                    return await this.gameEngine.useSkill(agentId, action.skillId);
                }
                return { success: false, reason: 'No skill specified' };
            
            case 'mortgage_property':
                if (action.targetProperty) {
                    return await this.gameEngine.mortgageProperty(agentId, action.targetProperty);
                }
                return { success: false, reason: 'No property specified' };
            
            case 'unmortgage_property':
                if (action.targetProperty) {
                    return await this.gameEngine.unmortgageProperty(agentId, action.targetProperty);
                }
                return { success: false, reason: 'No property specified' };
            
            case 'pass_turn':
                return await this.gameEngine.passTurn(agentId);
            
            default:
                return { success: false, reason: 'Unknown action type' };
        }
    }
    
    private async processCoordinationSignals(signals: Map<string, any>): Promise<void> {
        for (const [agentId, signal] of signals) {
            // 处理协调信号逻辑
            console.log(`Processing coordination signal for ${agentId}:`, signal);
        }
    }
    
    private async updateGameState(actionResults: Map<string, any>): Promise<void> {
        // 更新游戏引擎状态
        await this.gameEngine.updateGameState();
    }
    
    private async calculateRewards(
        previousState: MultiAgentState,
        action: MultiAgentAction,
        currentState: MultiAgentState,
        actionResults: Map<string, any>
    ): Promise<MultiAgentReward> {
        return this.rewardCalculator.calculateMultiAgentReward(
            previousState,
            action,
            currentState,
            actionResults,
            this.agentIds
        );
    }
    
    private async checkGameEnd(): Promise<boolean> {
        return this.gameEngine.isGameOver() || this.stepCount >= this.config.maxStepsPerEpisode;
    }
    
    private captureGameSnapshot(): GameStateSnapshot {
        const gameState = this.gameEngine.getGameState();
        
        return {
            players: this.agentIds.map(id => this.capturePlayerSnapshot(id)),
            currentPlayerIndex: gameState.currentPlayerIndex || 0,
            round: gameState.round || 0,
            phase: this.determineGamePhase(),
            properties: gameState.properties?.map(p => this.capturePropertySnapshot(p)) || [],
            gameEvents: [],
            timestamp: Date.now()
        };
    }
    
    private capturePlayerSnapshot(playerId: string): PlayerSnapshot {
        const player = this.gameEngine.getPlayer(playerId);
        return {
            id: playerId,
            position: player?.position || 0,
            money: player?.money || 0,
            properties: player?.properties.map(p => p.id) || [],
            houses: player?.houses || 0,
            hotels: player?.hotels || 0,
            isInJail: player?.isInJail || false,
            zodiacSign: player?.zodiacSign || 'rat',
            availableSkills: this.getAvailableSkills(player),
            usedSkills: this.getUsedSkills(player)
        };
    }
    
    private capturePropertySnapshot(property: any): PropertySnapshot {
        return {
            id: property.id,
            name: property.name,
            owner: property.owner?.id,
            houses: property.houses,
            hotels: property.hotels,
            isMortgaged: property.isMortgaged,
            currentRent: property.currentRent
        };
    }
    
    // 辅助方法
    private determineGamePhase(): 'early' | 'mid' | 'late' {
        const round = this.gameEngine.getGameState().round || 0;
        if (round < 5) return 'early';
        if (round < 15) return 'mid';
        return 'late';
    }
    
    private getSeasonalBonus(): number {
        return this.config.seasonalEffects ? Math.random() * 0.2 : 0;
    }
    
    private assignZodiacSign(agentId: string): string {
        const signs = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'sheep', 'monkey', 'rooster', 'dog', 'pig'];
        const index = parseInt(agentId.slice(-1)) % signs.length;
        return signs[index];
    }
    
    private canBuyProperty(player: any): boolean {
        const currentProperty = this.getCurrentProperty(player);
        return currentProperty && !currentProperty.owner && player.money >= currentProperty.price;
    }
    
    private canDevelopProperty(player: any): boolean {
        return player.properties.some((p: any) => this.canDevelop(p));
    }
    
    private canTrade(player: any): boolean {
        return player.properties.length > 0;
    }
    
    private canMortgage(player: any): boolean {
        return player.properties.some((p: any) => !p.isMortgaged);
    }
    
    private canUnmortgage(player: any): boolean {
        return player.properties.some((p: any) => p.isMortgaged) && player.money > 100;
    }
    
    private canDevelop(property: any): boolean {
        return property.houses < 4 && !property.isMortgaged;
    }
    
    private getCurrentProperty(player: any): any {
        return this.gameEngine.getPropertyAtPosition(player.position);
    }
    
    private getDevelopmentOpportunities(player: any): any[] {
        return player.properties.filter((p: any) => this.canDevelop(p));
    }
    
    private getPotentialTradePartners(player: any): string[] {
        return this.agentIds.filter(id => id !== player.id);
    }
    
    private getCurrentRent(player: any): number {
        const property = this.getCurrentProperty(player);
        return property?.currentRent || 0;
    }
    
    private getDevelopmentCost(player: any): number {
        return 100; // 基础开发成本
    }
    
    private getMortgageValue(player: any): number {
        return player.properties.reduce((sum: number, p: any) => sum + (p.mortgageValue || 0), 0);
    }
    
    private getAvailableSkills(player: any): string[] {
        return player?.availableSkills?.map((s: any) => s.id) || [];
    }
    
    private getUsedSkills(player: any): string[] {
        return player?.usedSkills?.map((s: any) => s.id) || [];
    }
    
    private processTrade(agentId: string, action: RLAction): any {
        // 简化的交易逻辑
        return { success: true, trade: 'processed' };
    }
    
    private initializeTrainingStatistics(): void {
        this.trainingStats = {
            episode: 0,
            totalSteps: 0,
            averageReward: 0,
            winRate: 0,
            convergenceMetrics: {
                policyStability: 0,
                valueAccuracy: 0,
                explorationRate: 0.1
            },
            performanceMetrics: {
                episodeLength: 0,
                decisionsPerSecond: 0,
                memoryUsage: 0
            },
            agentSpecificStats: new Map()
        };
    }
    
    private initializeAgentStatistics(agentId: string): void {
        this.trainingStats.agentSpecificStats.set(agentId, {
            agentId,
            totalReward: 0,
            averageReward: 0,
            winCount: 0,
            winRate: 0,
            skillUsageCount: new Map(),
            cooperationCount: 0,
            communicationCount: 0,
            averageDecisionTime: 0,
            explorationRate: 0.1,
            learningProgress: 0
        });
    }
    
    private updateTrainingStatistics(
        action: MultiAgentAction,
        rewards: MultiAgentReward,
        done: boolean
    ): void {
        this.trainingStats.episode = this.episodeCount;
        this.trainingStats.totalSteps = this.stepCount;
        
        // 更新智能体特定统计
        for (const agentId of this.agentIds) {
            const agentStats = this.trainingStats.agentSpecificStats.get(agentId);
            if (agentStats) {
                const reward = rewards.individualRewards.get(agentId)?.value || 0;
                agentStats.totalReward += reward;
                agentStats.averageReward = agentStats.totalReward / this.episodeCount;
                
                if (done && this.gameEngine.getWinner()?.id === agentId) {
                    agentStats.winCount++;
                    agentStats.winRate = agentStats.winCount / this.episodeCount;
                }
            }
        }
    }
    
    private seededRandom(seed: number) {
        let m = 0x80000000;
        let a = 1103515245;
        let c = 12345;
        
        seed = seed % m;
        return function() {
            seed = (a * seed + c) % m;
            return seed / m;
        };
    }
    
    // 公共方法
    getTrainingStatistics(): TrainingStatistics {
        return { ...this.trainingStats };
    }
    
    getGameHistory(): GameStateSnapshot[] {
        return [...this.gameHistory];
    }
    
    saveEnvironmentState(filepath: string): void {
        const envState = {
            config: this.config,
            statistics: this.trainingStats,
            episodeCount: this.episodeCount,
            agentCount: this.agentIds.length,
            timestamp: Date.now()
        };
        console.log('Environment state saved:', envState);
    }
}

// 奖励计算器
class RewardCalculator {
    private weights: TrainingConfig['rewardWeights'];
    
    constructor(weights: TrainingConfig['rewardWeights']) {
        this.weights = weights;
    }
    
    calculateMultiAgentReward(
        previousState: MultiAgentState,
        action: MultiAgentAction,
        currentState: MultiAgentState,
        actionResults: Map<string, any>,
        agentIds: string[]
    ): MultiAgentReward {
        const individualRewards = new Map<string, RLReward>();
        let sharedReward = 0;
        let cooperationBonus = 0;
        let competitionPenalty = 0;
        
        for (const agentId of agentIds) {
            const reward = this.calculateIndividualReward(
                agentId,
                previousState,
                action,
                currentState,
                actionResults
            );
            individualRewards.set(agentId, reward);
            sharedReward += reward.value;
        }
        
        // 计算合作奖励
        cooperationBonus = this.calculateCooperationBonus(action);
        
        // 计算竞争惩罚
        competitionPenalty = this.calculateCompetitionPenalty(currentState);
        
        return {
            individualRewards,
            sharedReward: { value: sharedReward / agentIds.length, components: {} },
            cooperationBonus,
            competitionPenalty
        };
    }
    
    private calculateIndividualReward(
        agentId: string,
        previousState: MultiAgentState,
        action: MultiAgentAction,
        currentState: MultiAgentState,
        actionResults: Map<string, any>
    ): RLReward {
        const prevAgentState = previousState.agentStates.get(agentId);
        const currAgentState = currentState.agentStates.get(agentId);
        const actionResult = actionResults.get(agentId);
        
        if (!prevAgentState || !currAgentState) {
            return { value: 0, components: {} };
        }
        
        let totalReward = 0;
        const components: any = {};
        
        // 金钱变化奖励
        const moneyChange = currAgentState.money - prevAgentState.money;
        const moneyReward = (moneyChange / 1000) * this.weights.money;
        totalReward += moneyReward;
        components.money = moneyReward;
        
        // 房产获得奖励
        const propertyChange = currAgentState.properties.length - prevAgentState.properties.length;
        const propertyReward = propertyChange * 100 * this.weights.properties;
        totalReward += propertyReward;
        components.properties = propertyReward;
        
        // 游戏胜利奖励
        if (actionResult?.gameWon) {
            const winReward = 1000 * this.weights.gameWin;
            totalReward += winReward;
            components.gameWin = winReward;
        }
        
        // 技能使用奖励
        const skillUsage = currAgentState.usedSkills.length - prevAgentState.usedSkills.length;
        const skillReward = skillUsage * 50 * this.weights.skillUsage;
        totalReward += skillReward;
        components.skillUsage = skillReward;
        
        // 效率奖励（快速决策）
        const efficiencyReward = actionResult?.decisionTime < 100 ? 10 * this.weights.efficiency : 0;
        totalReward += efficiencyReward;
        components.efficiency = efficiencyReward;
        
        return {
            value: totalReward,
            components
        };
    }
    
    private calculateCooperationBonus(action: MultiAgentAction): number {
        let bonus = 0;
        
        // 通信奖励
        bonus += action.communications.length * 5;
        
        // 协调奖励
        bonus += action.coordinationSignals.size * 10;
        
        return bonus * this.weights.cooperation;
    }
    
    private calculateCompetitionPenalty(state: MultiAgentState): number {
        // 基于竞争激烈程度的惩罚
        let penalty = 0;
        
        const agentStates = Array.from(state.agentStates.values());
        const moneyVariance = this.calculateVariance(agentStates.map(s => s.money));
        
        // 高方差意味着激烈竞争
        if (moneyVariance > 1000000) {
            penalty = 50;
        }
        
        return penalty;
    }
    
    private calculateVariance(values: number[]): number {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }
}