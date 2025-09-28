/**
 * 强化学习集成框架
 * Reinforcement Learning Integration Framework
 * 
 * 将强化学习系统与现有AI决策框架无缝集成
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { 
    RLAgent, 
    RLState, 
    RLAction, 
    RLReward,
    ReinforcementLearningFramework 
} from './ReinforcementLearningFramework';

import { 
    MultiAgentRLAgent,
    MultiAgentRLFramework,
    AgentType,
    MultiAgentAlgorithm 
} from './MultiAgentRLFramework';

import { 
    QLearningAgent 
} from './QLearningAgent';

import { 
    DQNAgent 
} from './DQNAgent';

import { 
    REINFORCEAgent,
    ActorCriticAgent 
} from './PolicyGradientAgent';

import { 
    ZodiacMonopolyRLEnvironment,
    TrainingConfig 
} from './RLTrainingEnvironment';

// 现有AI系统接口（从AdvancedDecisionFramework导入）
interface AIDecision {
    action: string;
    confidence: number;
    reasoning: string[];
    metadata?: any;
}

interface AIState {
    playerId: string;
    gamePhase: string;
    resources: any;
    threats: any[];
    opportunities: any[];
}

interface DecisionContext {
    urgency: number;
    complexity: number;
    uncertainty: number;
    stakesLevel: number;
    availableTime: number;
    resourceConstraints: any;
    environmentalFactors: any;
}

// 集成配置
export interface IntegrationConfig {
    // RL系统配置
    enableRL: boolean;
    rlAlgorithms: string[];
    fallbackToClassic: boolean;
    
    // 混合决策配置
    hybridMode: 'weighted_average' | 'confidence_based' | 'context_aware' | 'ensemble';
    rlWeight: number;
    classicWeight: number;
    
    // 学习配置
    continuousLearning: boolean;
    adaptationRate: number;
    performanceThreshold: number;
    
    // 性能配置
    maxDecisionTime: number;
    memoryLimit: number;
    parallelExecution: boolean;
}

// 决策来源类型
export enum DecisionSource {
    REINFORCEMENT_LEARNING = 'rl',
    CLASSIC_AI = 'classic',
    HYBRID = 'hybrid',
    ENSEMBLE = 'ensemble'
}

// 集成决策结果
export interface IntegratedDecision {
    finalDecision: RLAction;
    source: DecisionSource;
    confidence: number;
    contributions: {
        rl?: { decision: RLAction; confidence: number; algorithm: string };
        classic?: { decision: AIDecision; confidence: number };
        hybrid?: { weights: Map<string, number>; reasoning: string[] };
    };
    reasoning: string[];
    metadata: {
        decisionTime: number;
        algorithmsUsed: string[];
        performanceMetrics: any;
    };
}

// 性能监控
export interface PerformanceMetrics {
    decisionAccuracy: number;
    averageDecisionTime: number;
    learningProgress: number;
    adaptationRate: number;
    memoryUsage: number;
    successRate: number;
    algorithmEfficiency: Map<string, number>;
}

// 主集成框架类
export class RLIntegrationFramework extends EventEmitter {
    private config: IntegrationConfig;
    private rlFramework: MultiAgentRLFramework;
    private rlEnvironment: ZodiacMonopolyRLEnvironment;
    private rlAgents: Map<string, MultiAgentRLAgent>;
    private classicAI: any; // 现有AI系统实例
    
    // 性能监控
    private performanceMetrics: PerformanceMetrics;
    private decisionHistory: IntegratedDecision[];
    private learningHistory: any[];
    
    // 状态管理
    private isTraining: boolean;
    private isActive: boolean;
    private currentEpisode: number;
    
    constructor(
        config: IntegrationConfig,
        trainingConfig: TrainingConfig,
        classicAISystem?: any
    ) {
        super();
        this.config = config;
        this.classicAI = classicAISystem;
        this.rlAgents = new Map();
        this.decisionHistory = [];
        this.learningHistory = [];
        this.isTraining = false;
        this.isActive = false;
        this.currentEpisode = 0;
        
        // 初始化RL环境和框架
        this.rlEnvironment = new ZodiacMonopolyRLEnvironment(trainingConfig);
        this.rlFramework = new MultiAgentRLFramework(this.rlEnvironment, 'distributed');
        
        // 初始化性能监控
        this.initializePerformanceMetrics();
        
        // 设置事件监听
        this.setupEventListeners();
    }
    
    // 初始化集成系统
    async initialize(): Promise<void> {
        try {
            // 初始化RL系统
            if (this.config.enableRL) {
                await this.initializeRLSystem();
            }
            
            // 设置经典AI系统
            if (this.classicAI) {
                await this.initializeClassicAI();
            }
            
            this.isActive = true;
            this.emit('system_initialized', { 
                rlEnabled: this.config.enableRL,
                classicEnabled: !!this.classicAI 
            });
            
        } catch (error) {
            this.emit('initialization_error', error);
            throw error;
        }
    }
    
    // 初始化RL系统
    private async initializeRLSystem(): Promise<void> {
        // 根据配置创建不同类型的RL智能体
        for (const algorithm of this.config.rlAlgorithms) {
            const agentId = `rl_agent_${algorithm}_${Date.now()}`;
            let agent: MultiAgentRLAgent;
            
            switch (algorithm) {
                case 'q_learning':
                    const qAgent = new QLearningAgent(agentId);
                    agent = this.wrapAsMultiAgent(qAgent, AgentType.INDEPENDENT);
                    break;
                    
                case 'dqn':
                    const dqnAgent = new DQNAgent(agentId);
                    agent = this.wrapAsMultiAgent(dqnAgent, AgentType.INDEPENDENT);
                    break;
                    
                case 'reinforce':
                    const reinforceAgent = new REINFORCEAgent(agentId);
                    agent = this.wrapAsMultiAgent(reinforceAgent, AgentType.INDEPENDENT);
                    break;
                    
                case 'actor_critic':
                    agent = new ActorCriticAgent(
                        agentId, 
                        AgentType.COOPERATIVE,
                        18, 8, 0.001, 0.005, 0.99, 0.95
                    );
                    break;
                    
                default:
                    throw new Error(`Unknown RL algorithm: ${algorithm}`);
            }
            
            this.rlAgents.set(agentId, agent);
            this.rlFramework.addAgent(agent);
        }
        
        await this.rlEnvironment.reset();
    }
    
    // 包装单智能体为多智能体
    private wrapAsMultiAgent(agent: RLAgent, agentType: AgentType): MultiAgentRLAgent {
        const multiAgent: MultiAgentRLAgent = {
            ...agent,
            agentType,
            algorithm: MultiAgentAlgorithm.INDEPENDENT_Q_LEARNING,
            communicationEnabled: false,
            cooperationLevel: 0,
            
            async selectActionInMultiAgentContext(state, availableActions, otherAgents) {
                return agent.selectAction(state.globalState, availableActions);
            },
            
            updateWithMultiAgentExperience(experience) {
                agent.updateExperience({
                    state: experience.state.globalState,
                    action: experience.actions.agentActions.get(agent.agentId)!,
                    reward: experience.rewards.individualRewards.get(agent.agentId)!,
                    nextState: experience.nextState.globalState,
                    done: experience.done
                });
            },
            
            processMultiAgentReward(reward) {
                // 基础实现
            },
            
            sendMessage(message) {
                console.log(`Agent ${agent.agentId} sending message:`, message);
            },
            
            receiveMessage(message) {
                console.log(`Agent ${agent.agentId} received message:`, message);
            },
            
            processIncomingMessages() {
                return [];
            },
            
            evaluateCooperationOpportunity(otherAgent, proposal) {
                return 0.1;
            },
            
            proposeCooperation(otherAgent) {
                return null;
            },
            
            respondToCooperationProposal(proposal) {
                return false;
            }
        };
        
        return multiAgent;
    }
    
    // 初始化经典AI系统
    private async initializeClassicAI(): Promise<void> {
        if (this.classicAI && typeof this.classicAI.initialize === 'function') {
            await this.classicAI.initialize();
        }
    }
    
    // 主决策方法
    async makeDecision(
        gameState: any,
        playerId: string,
        context: DecisionContext
    ): Promise<IntegratedDecision> {
        const startTime = Date.now();
        
        try {
            // 根据配置和上下文选择决策模式
            const decisionMode = this.selectDecisionMode(context);
            
            let decision: IntegratedDecision;
            
            switch (decisionMode) {
                case 'rl_only':
                    decision = await this.makeRLDecision(gameState, playerId, context);
                    break;
                    
                case 'classic_only':
                    decision = await this.makeClassicDecision(gameState, playerId, context);
                    break;
                    
                case 'hybrid':
                    decision = await this.makeHybridDecision(gameState, playerId, context);
                    break;
                    
                case 'ensemble':
                    decision = await this.makeEnsembleDecision(gameState, playerId, context);
                    break;
                    
                default:
                    decision = await this.makeFallbackDecision(gameState, playerId, context);
            }
            
            // 记录决策时间
            decision.metadata.decisionTime = Date.now() - startTime;
            
            // 记录决策历史
            this.decisionHistory.push(decision);
            
            // 更新性能指标
            this.updatePerformanceMetrics(decision);
            
            // 如果启用持续学习，更新RL系统
            if (this.config.continuousLearning && decision.source !== DecisionSource.CLASSIC_AI) {
                await this.updateRLSystem(gameState, decision);
            }
            
            this.emit('decision_made', decision);
            
            return decision;
            
        } catch (error) {
            this.emit('decision_error', { playerId, error });
            return this.makeFallbackDecision(gameState, playerId, context);
        }
    }
    
    // 选择决策模式
    private selectDecisionMode(context: DecisionContext): string {
        // 基于上下文的决策模式选择逻辑
        if (!this.config.enableRL) {
            return 'classic_only';
        }
        
        if (!this.classicAI) {
            return 'rl_only';
        }
        
        // 基于紧急程度和复杂性选择模式
        if (context.urgency > 0.8 && context.availableTime < 1000) {
            // 紧急情况使用经典AI（更快）
            return 'classic_only';
        }
        
        if (context.complexity > 0.7 && context.uncertainty > 0.6) {
            // 复杂且不确定的情况使用集成方法
            return 'ensemble';
        }
        
        // 默认使用混合模式
        return this.config.hybridMode;
    }
    
    // RL决策
    private async makeRLDecision(
        gameState: any,
        playerId: string,
        context: DecisionContext
    ): Promise<IntegratedDecision> {
        const agent = this.selectBestRLAgent(context);
        
        if (!agent) {
            throw new Error('No suitable RL agent available');
        }
        
        // 转换游戏状态为RL状态
        const rlState = this.convertToRLState(gameState, playerId);
        const availableActions = this.getAvailableRLActions(gameState, playerId);
        
        // 获取RL决策
        const rlAction = await agent.selectAction(rlState, availableActions);
        
        return {
            finalDecision: rlAction,
            source: DecisionSource.REINFORCEMENT_LEARNING,
            confidence: rlAction.confidence || 0.7,
            contributions: {
                rl: {
                    decision: rlAction,
                    confidence: rlAction.confidence || 0.7,
                    algorithm: agent.algorithm
                }
            },
            reasoning: [
                'Decision made using reinforcement learning',
                `Algorithm: ${agent.algorithm}`,
                `Agent: ${agent.agentId}`
            ],
            metadata: {
                decisionTime: 0,
                algorithmsUsed: [agent.algorithm],
                performanceMetrics: {}
            }
        };
    }
    
    // 经典AI决策
    private async makeClassicDecision(
        gameState: any,
        playerId: string,
        context: DecisionContext
    ): Promise<IntegratedDecision> {
        if (!this.classicAI) {
            throw new Error('Classic AI system not available');
        }
        
        // 调用经典AI系统
        const classicDecision: AIDecision = await this.classicAI.makeDecision(
            gameState,
            playerId,
            context
        );
        
        // 转换为RL动作格式
        const rlAction = this.convertToRLAction(classicDecision);
        
        return {
            finalDecision: rlAction,
            source: DecisionSource.CLASSIC_AI,
            confidence: classicDecision.confidence,
            contributions: {
                classic: {
                    decision: classicDecision,
                    confidence: classicDecision.confidence
                }
            },
            reasoning: [
                'Decision made using classic AI',
                ...classicDecision.reasoning
            ],
            metadata: {
                decisionTime: 0,
                algorithmsUsed: ['classic_ai'],
                performanceMetrics: {}
            }
        };
    }
    
    // 混合决策
    private async makeHybridDecision(
        gameState: any,
        playerId: string,
        context: DecisionContext
    ): Promise<IntegratedDecision> {
        // 并行获取两种决策
        const [rlDecision, classicDecision] = await Promise.all([
            this.makeRLDecision(gameState, playerId, context),
            this.makeClassicDecision(gameState, playerId, context)
        ]);
        
        // 基于置信度和权重融合决策
        const hybridDecision = this.fuseDecisions(rlDecision, classicDecision, context);
        
        return {
            finalDecision: hybridDecision.action,
            source: DecisionSource.HYBRID,
            confidence: hybridDecision.confidence,
            contributions: {
                rl: rlDecision.contributions.rl,
                classic: classicDecision.contributions.classic,
                hybrid: {
                    weights: hybridDecision.weights,
                    reasoning: hybridDecision.reasoning
                }
            },
            reasoning: [
                'Decision made using hybrid approach',
                ...hybridDecision.reasoning
            ],
            metadata: {
                decisionTime: 0,
                algorithmsUsed: ['rl', 'classic_ai', 'hybrid_fusion'],
                performanceMetrics: {}
            }
        };
    }
    
    // 集成决策
    private async makeEnsembleDecision(
        gameState: any,
        playerId: string,
        context: DecisionContext
    ): Promise<IntegratedDecision> {
        const decisions: IntegratedDecision[] = [];
        
        // 收集所有可用智能体的决策
        for (const agent of this.rlAgents.values()) {
            try {
                const decision = await this.makeRLDecisionWithAgent(
                    agent, gameState, playerId, context
                );
                decisions.push(decision);
            } catch (error) {
                console.warn(`Error getting decision from agent ${agent.agentId}:`, error);
            }
        }
        
        // 如果有经典AI，也包含其决策
        if (this.classicAI) {
            try {
                const classicDecision = await this.makeClassicDecision(gameState, playerId, context);
                decisions.push(classicDecision);
            } catch (error) {
                console.warn('Error getting classic AI decision:', error);
            }
        }
        
        // 使用投票或加权平均选择最终决策
        const ensembleResult = this.ensembleVoting(decisions, context);
        
        return {
            finalDecision: ensembleResult.action,
            source: DecisionSource.ENSEMBLE,
            confidence: ensembleResult.confidence,
            contributions: {
                hybrid: {
                    weights: ensembleResult.weights,
                    reasoning: ensembleResult.reasoning
                }
            },
            reasoning: [
                'Decision made using ensemble voting',
                `Considered ${decisions.length} different approaches`,
                ...ensembleResult.reasoning
            ],
            metadata: {
                decisionTime: 0,
                algorithmsUsed: decisions.map(d => d.metadata.algorithmsUsed).flat(),
                performanceMetrics: {}
            }
        };
    }
    
    // 回退决策
    private async makeFallbackDecision(
        gameState: any,
        playerId: string,
        context: DecisionContext
    ): Promise<IntegratedDecision> {
        // 简单的启发式决策
        const fallbackAction: RLAction = {
            type: 'pass_turn',
            confidence: 0.3,
            metadata: { source: 'fallback', reason: 'system_error' }
        };
        
        return {
            finalDecision: fallbackAction,
            source: DecisionSource.CLASSIC_AI,
            confidence: 0.3,
            contributions: {},
            reasoning: ['Fallback decision due to system error'],
            metadata: {
                decisionTime: 1,
                algorithmsUsed: ['fallback'],
                performanceMetrics: {}
            }
        };
    }
    
    // 辅助方法
    private selectBestRLAgent(context: DecisionContext): MultiAgentRLAgent | null {
        // 根据上下文选择最适合的RL智能体
        const agents = Array.from(this.rlAgents.values());
        
        if (agents.length === 0) return null;
        
        // 简单选择第一个可用的智能体
        // 可以根据性能历史、算法类型等进行更复杂的选择
        return agents[0];
    }
    
    private convertToRLState(gameState: any, playerId: string): RLState {
        // 将游戏状态转换为RL状态格式
        const player = gameState.players.find((p: any) => p.id === playerId);
        
        return {
            money: player?.money || 0,
            position: player?.position || 0,
            properties: player?.properties?.map((p: any) => p.id) || [],
            houses: player?.houses || 0,
            hotels: player?.hotels || 0,
            isInJail: player?.isInJail || false,
            turnsInJail: player?.turnsInJail || 0,
            doubleRollCount: player?.doubleRollCount || 0,
            gamePhase: gameState.phase || 'early',
            roundNumber: gameState.round || 0,
            playerCount: gameState.players?.length || 0,
            activePlayerIndex: gameState.currentPlayerIndex || 0,
            currentRent: 0,
            developmentCost: 0,
            mortgageValue: 0,
            availableSkills: player?.availableSkills?.map((s: any) => s.id) || [],
            usedSkills: player?.usedSkills?.map((s: any) => s.id) || [],
            seasonalBonus: 0
        };
    }
    
    private getAvailableRLActions(gameState: any, playerId: string): RLAction[] {
        // 基于游戏状态生成可用动作
        return [
            { type: 'roll_dice', confidence: 1.0 },
            { type: 'buy_property', confidence: 0.8 },
            { type: 'develop_property', confidence: 0.7 },
            { type: 'trade_offer', confidence: 0.6 },
            { type: 'use_skill', confidence: 0.9 },
            { type: 'mortgage_property', confidence: 0.5 },
            { type: 'unmortgage_property', confidence: 0.6 },
            { type: 'pass_turn', confidence: 1.0 }
        ];
    }
    
    private convertToRLAction(classicDecision: AIDecision): RLAction {
        return {
            type: classicDecision.action as any,
            confidence: classicDecision.confidence,
            metadata: {
                source: 'classic_ai',
                reasoning: classicDecision.reasoning,
                originalDecision: classicDecision
            }
        };
    }
    
    private fuseDecisions(
        rlDecision: IntegratedDecision,
        classicDecision: IntegratedDecision,
        context: DecisionContext
    ): { action: RLAction; confidence: number; weights: Map<string, number>; reasoning: string[] } {
        // 根据配置的权重和决策置信度融合决策
        const rlWeight = this.config.rlWeight * (rlDecision.confidence || 0.5);
        const classicWeight = this.config.classicWeight * (classicDecision.confidence || 0.5);
        
        const totalWeight = rlWeight + classicWeight;
        const normalizedRLWeight = rlWeight / totalWeight;
        const normalizedClassicWeight = classicWeight / totalWeight;
        
        // 选择权重更高的决策
        const selectedDecision = normalizedRLWeight > normalizedClassicWeight ? 
            rlDecision.finalDecision : classicDecision.finalDecision;
        
        const confidence = Math.max(
            normalizedRLWeight * (rlDecision.confidence || 0.5),
            normalizedClassicWeight * (classicDecision.confidence || 0.5)
        );
        
        const weights = new Map([
            ['rl', normalizedRLWeight],
            ['classic', normalizedClassicWeight]
        ]);
        
        const reasoning = [
            `RL weight: ${normalizedRLWeight.toFixed(3)}`,
            `Classic weight: ${normalizedClassicWeight.toFixed(3)}`,
            `Selected: ${normalizedRLWeight > normalizedClassicWeight ? 'RL' : 'Classic'}`
        ];
        
        return {
            action: selectedDecision,
            confidence,
            weights,
            reasoning
        };
    }
    
    private ensembleVoting(
        decisions: IntegratedDecision[],
        context: DecisionContext
    ): { action: RLAction; confidence: number; weights: Map<string, number>; reasoning: string[] } {
        // 简单的多数投票或置信度加权
        const actionVotes = new Map<string, { count: number; totalConfidence: number; decisions: IntegratedDecision[] }>();
        
        for (const decision of decisions) {
            const actionType = decision.finalDecision.type;
            if (!actionVotes.has(actionType)) {
                actionVotes.set(actionType, { count: 0, totalConfidence: 0, decisions: [] });
            }
            
            const vote = actionVotes.get(actionType)!;
            vote.count++;
            vote.totalConfidence += decision.confidence;
            vote.decisions.push(decision);
        }
        
        // 选择得票最多且置信度最高的动作
        let bestAction: string = 'pass_turn';
        let bestScore = 0;
        let bestDecisions: IntegratedDecision[] = [];
        
        for (const [actionType, vote] of actionVotes) {
            const score = vote.count * (vote.totalConfidence / vote.count);
            if (score > bestScore) {
                bestScore = score;
                bestAction = actionType;
                bestDecisions = vote.decisions;
            }
        }
        
        const selectedDecision = bestDecisions[0].finalDecision;
        const confidence = bestDecisions.reduce((sum, d) => sum + d.confidence, 0) / bestDecisions.length;
        
        const weights = new Map<string, number>();
        const reasoning = [`Selected action: ${bestAction}`, `Votes: ${actionVotes.get(bestAction)?.count}`];
        
        return {
            action: selectedDecision,
            confidence,
            weights,
            reasoning
        };
    }
    
    private async makeRLDecisionWithAgent(
        agent: MultiAgentRLAgent,
        gameState: any,
        playerId: string,
        context: DecisionContext
    ): Promise<IntegratedDecision> {
        const rlState = this.convertToRLState(gameState, playerId);
        const availableActions = this.getAvailableRLActions(gameState, playerId);
        
        const rlAction = await agent.selectAction(rlState, availableActions);
        
        return {
            finalDecision: rlAction,
            source: DecisionSource.REINFORCEMENT_LEARNING,
            confidence: rlAction.confidence || 0.7,
            contributions: {
                rl: {
                    decision: rlAction,
                    confidence: rlAction.confidence || 0.7,
                    algorithm: agent.algorithm
                }
            },
            reasoning: [`Decision from agent ${agent.agentId}`],
            metadata: {
                decisionTime: 0,
                algorithmsUsed: [agent.algorithm],
                performanceMetrics: {}
            }
        };
    }
    
    private async updateRLSystem(gameState: any, decision: IntegratedDecision): Promise<void> {
        // 实现持续学习逻辑
        if (this.config.continuousLearning) {
            // 这里可以实现经验更新、模型重训练等
            console.log('Updating RL system with new experience...');
        }
    }
    
    private initializePerformanceMetrics(): void {
        this.performanceMetrics = {
            decisionAccuracy: 0,
            averageDecisionTime: 0,
            learningProgress: 0,
            adaptationRate: 0,
            memoryUsage: 0,
            successRate: 0,
            algorithmEfficiency: new Map()
        };
    }
    
    private updatePerformanceMetrics(decision: IntegratedDecision): void {
        // 更新性能指标
        const recentDecisions = this.decisionHistory.slice(-100);
        
        this.performanceMetrics.averageDecisionTime = 
            recentDecisions.reduce((sum, d) => sum + d.metadata.decisionTime, 0) / recentDecisions.length;
        
        // 其他指标更新...
    }
    
    private setupEventListeners(): void {
        this.rlFramework.on('episode_completed', (data) => {
            this.currentEpisode = data.episode;
            this.emit('rl_episode_completed', data);
        });
        
        this.rlFramework.on('training_completed', (data) => {
            this.isTraining = false;
            this.emit('rl_training_completed', data);
        });
    }
    
    // 公共方法
    async startTraining(episodes: number): Promise<void> {
        if (!this.config.enableRL) {
            throw new Error('RL is not enabled');
        }
        
        this.isTraining = true;
        this.emit('training_started', { episodes });
        
        try {
            await this.rlFramework.train(episodes);
        } catch (error) {
            this.isTraining = false;
            this.emit('training_error', error);
            throw error;
        }
    }
    
    async stopTraining(): Promise<void> {
        this.isTraining = false;
        this.emit('training_stopped');
    }
    
    getPerformanceMetrics(): PerformanceMetrics {
        return { ...this.performanceMetrics };
    }
    
    getDecisionHistory(): IntegratedDecision[] {
        return [...this.decisionHistory];
    }
    
    updateConfig(newConfig: Partial<IntegrationConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.emit('config_updated', this.config);
    }
    
    async saveSystem(filepath: string): Promise<void> {
        const systemState = {
            config: this.config,
            performanceMetrics: this.performanceMetrics,
            decisionHistory: this.decisionHistory.slice(-1000), // 保存最近1000个决策
            currentEpisode: this.currentEpisode,
            timestamp: Date.now()
        };
        
        // 保存RL框架状态
        this.rlFramework.saveFramework(`${filepath}_rl`);
        
        console.log('Integration system saved:', systemState);
    }
    
    async loadSystem(filepath: string): Promise<void> {
        console.log('Loading integration system from:', filepath);
        // 实现系统状态加载
    }
    
    destroy(): void {
        this.isActive = false;
        this.isTraining = false;
        this.removeAllListeners();
        this.rlAgents.clear();
        this.decisionHistory = [];
        this.learningHistory = [];
    }
}