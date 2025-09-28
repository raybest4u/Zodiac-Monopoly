/**
 * 多智能体强化学习框架
 * Multi-Agent Reinforcement Learning Framework
 * 
 * 实现独立学习、集中式训练分布式执行、竞争与合作学习
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { 
    RLState, 
    RLAction, 
    RLReward, 
    RLAgent, 
    RLEnvironment,
    RLExperience 
} from './ReinforcementLearningFramework';

// 多智能体状态
export interface MultiAgentState {
    globalState: RLState;
    agentStates: Map<string, RLState>;
    sharedInformation: Map<string, any>;
    communicationHistory: CommunicationMessage[];
    timestamp: number;
}

// 智能体间通信消息
export interface CommunicationMessage {
    senderId: string;
    receiverId: string | 'broadcast';
    messageType: 'information' | 'request' | 'offer' | 'accept' | 'reject';
    content: any;
    timestamp: number;
    priority: number;
}

// 多智能体动作
export interface MultiAgentAction {
    agentActions: Map<string, RLAction>;
    communications: CommunicationMessage[];
    coordinationSignals: Map<string, any>;
}

// 多智能体奖励
export interface MultiAgentReward {
    individualRewards: Map<string, RLReward>;
    sharedReward: RLReward;
    cooperationBonus: number;
    competitionPenalty: number;
}

// 智能体类型
export enum AgentType {
    INDEPENDENT = 'independent',        // 独立学习
    COOPERATIVE = 'cooperative',        // 合作学习
    COMPETITIVE = 'competitive',        // 竞争学习
    MIXED = 'mixed'                    // 混合模式
}

// 学习算法类型
export enum MultiAgentAlgorithm {
    INDEPENDENT_Q_LEARNING = 'iql',
    MULTI_AGENT_DQN = 'madqn',
    CENTRALIZED_TRAINING = 'ctde',
    POLICY_GRADIENT = 'mapg',
    ACTOR_CRITIC = 'maac',
    COMMUNICATION_BASED = 'comm'
}

// 多智能体RL智能体接口
export interface MultiAgentRLAgent extends RLAgent {
    agentId: string;
    agentType: AgentType;
    algorithm: MultiAgentAlgorithm;
    communicationEnabled: boolean;
    cooperationLevel: number;
    
    // 多智能体特定方法
    selectActionInMultiAgentContext(
        state: MultiAgentState,
        availableActions: RLAction[],
        otherAgents: string[]
    ): Promise<RLAction>;
    
    processMultiAgentReward(reward: MultiAgentReward): void;
    updateWithMultiAgentExperience(experience: MultiAgentExperience): void;
    
    // 通信相关
    sendMessage(message: CommunicationMessage): void;
    receiveMessage(message: CommunicationMessage): void;
    processIncomingMessages(): CommunicationMessage[];
    
    // 合作/竞争
    evaluateCooperationOpportunity(otherAgent: string, proposal: any): number;
    proposeCooperation(otherAgent: string): any;
    respondToCooperationProposal(proposal: any): boolean;
}

// 多智能体经验
export interface MultiAgentExperience {
    state: MultiAgentState;
    actions: MultiAgentAction;
    rewards: MultiAgentReward;
    nextState: MultiAgentState;
    done: boolean;
    agentParticipation: Set<string>;
    cooperationLevel: number;
    communicationEffectiveness: number;
}

// 多智能体环境
export interface MultiAgentEnvironment extends RLEnvironment<MultiAgentState, MultiAgentAction, MultiAgentReward> {
    agentIds: string[];
    maxAgents: number;
    communicationRange: number;
    
    // 环境特定方法
    addAgent(agent: MultiAgentRLAgent): void;
    removeAgent(agentId: string): void;
    getAgentNeighbors(agentId: string): string[];
    
    // 通信管理
    deliverMessage(message: CommunicationMessage): boolean;
    broadcastMessage(message: CommunicationMessage): void;
    
    // 状态管理
    getGlobalState(): RLState;
    getAgentState(agentId: string): RLState;
    updateAgentState(agentId: string, state: RLState): void;
}

// 协调机制
export class CoordinationMechanism {
    private coordinationType: 'none' | 'centralized' | 'distributed' | 'hierarchical';
    private coordinationHistory: Map<string, any[]>;
    
    constructor(type: 'none' | 'centralized' | 'distributed' | 'hierarchical') {
        this.coordinationType = type;
        this.coordinationHistory = new Map();
    }
    
    // 协调智能体动作
    coordinateActions(
        agentActions: Map<string, RLAction>,
        state: MultiAgentState
    ): MultiAgentAction {
        switch (this.coordinationType) {
            case 'centralized':
                return this.centralizedCoordination(agentActions, state);
            case 'distributed':
                return this.distributedCoordination(agentActions, state);
            case 'hierarchical':
                return this.hierarchicalCoordination(agentActions, state);
            default:
                return {
                    agentActions,
                    communications: [],
                    coordinationSignals: new Map()
                };
        }
    }
    
    private centralizedCoordination(
        agentActions: Map<string, RLAction>,
        state: MultiAgentState
    ): MultiAgentAction {
        // 中央协调器优化全局行动
        const optimizedActions = new Map(agentActions);
        const communications: CommunicationMessage[] = [];
        const coordinationSignals = new Map<string, any>();
        
        // 检测冲突并解决
        const conflicts = this.detectActionConflicts(agentActions, state);
        for (const conflict of conflicts) {
            const resolution = this.resolveConflict(conflict);
            for (const [agentId, newAction] of resolution) {
                optimizedActions.set(agentId, newAction);
                coordinationSignals.set(agentId, { 
                    type: 'conflict_resolution', 
                    originalAction: agentActions.get(agentId),
                    newAction 
                });
            }
        }
        
        return {
            agentActions: optimizedActions,
            communications,
            coordinationSignals
        };
    }
    
    private distributedCoordination(
        agentActions: Map<string, RLAction>,
        state: MultiAgentState
    ): MultiAgentAction {
        // 分布式协商协调
        const communications: CommunicationMessage[] = [];
        const coordinationSignals = new Map<string, any>();
        
        // 智能体间协商
        for (const [agentId, action] of agentActions) {
            const neighbors = this.getAgentNeighbors(agentId, state);
            for (const neighborId of neighbors) {
                const negotiationMessage: CommunicationMessage = {
                    senderId: agentId,
                    receiverId: neighborId,
                    messageType: 'information',
                    content: {
                        type: 'action_intention',
                        action: action,
                        coordination_request: true
                    },
                    timestamp: Date.now(),
                    priority: 1
                };
                communications.push(negotiationMessage);
            }
        }
        
        return {
            agentActions,
            communications,
            coordinationSignals
        };
    }
    
    private hierarchicalCoordination(
        agentActions: Map<string, RLAction>,
        state: MultiAgentState
    ): MultiAgentAction {
        // 层次化协调
        const communications: CommunicationMessage[] = [];
        const coordinationSignals = new Map<string, any>();
        
        // 确定领导者和跟随者
        const leader = this.selectLeader(Array.from(agentActions.keys()), state);
        const followers = Array.from(agentActions.keys()).filter(id => id !== leader);
        
        // 领导者发布协调指令
        for (const followerId of followers) {
            const coordinationMessage: CommunicationMessage = {
                senderId: leader,
                receiverId: followerId,
                messageType: 'request',
                content: {
                    type: 'coordination_directive',
                    leaderAction: agentActions.get(leader),
                    suggestedAction: this.suggestFollowerAction(
                        followerId, 
                        agentActions.get(leader)!, 
                        state
                    )
                },
                timestamp: Date.now(),
                priority: 2
            };
            communications.push(coordinationMessage);
        }
        
        coordinationSignals.set('hierarchy', { leader, followers });
        
        return {
            agentActions,
            communications,
            coordinationSignals
        };
    }
    
    private detectActionConflicts(
        agentActions: Map<string, RLAction>,
        state: MultiAgentState
    ): Array<{ agents: string[], conflict: string, severity: number }> {
        const conflicts: Array<{ agents: string[], conflict: string, severity: number }> = [];
        
        // 检测资源冲突
        const resourceUsage = new Map<string, string[]>();
        for (const [agentId, action] of agentActions) {
            if (action.targetProperty) {
                const propertyId = action.targetProperty.toString();
                if (!resourceUsage.has(propertyId)) {
                    resourceUsage.set(propertyId, []);
                }
                resourceUsage.get(propertyId)!.push(agentId);
            }
        }
        
        for (const [resource, agents] of resourceUsage) {
            if (agents.length > 1) {
                conflicts.push({
                    agents,
                    conflict: `Resource conflict on ${resource}`,
                    severity: agents.length
                });
            }
        }
        
        return conflicts;
    }
    
    private resolveConflict(
        conflict: { agents: string[], conflict: string, severity: number }
    ): Map<string, RLAction> {
        const resolution = new Map<string, RLAction>();
        
        // 简单的优先级解决方案
        const priorityAgent = conflict.agents[0]; // 第一个智能体获得优先权
        
        for (let i = 1; i < conflict.agents.length; i++) {
            const agentId = conflict.agents[i];
            // 为冲突的智能体分配替代动作
            resolution.set(agentId, {
                type: 'pass_turn',
                confidence: 0.5,
                metadata: { 
                    reason: 'conflict_resolution',
                    originalConflict: conflict.conflict
                }
            });
        }
        
        return resolution;
    }
    
    private getAgentNeighbors(agentId: string, state: MultiAgentState): string[] {
        // 基于位置或通信范围确定邻居
        const neighbors: string[] = [];
        const agentState = state.agentStates.get(agentId);
        
        if (!agentState) return neighbors;
        
        for (const [otherId, otherState] of state.agentStates) {
            if (otherId !== agentId) {
                const distance = Math.abs(agentState.position - otherState.position);
                if (distance <= 3) { // 通信范围
                    neighbors.push(otherId);
                }
            }
        }
        
        return neighbors;
    }
    
    private selectLeader(agentIds: string[], state: MultiAgentState): string {
        // 选择领导者的策略
        let leader = agentIds[0];
        let maxWealth = -1;
        
        for (const agentId of agentIds) {
            const agentState = state.agentStates.get(agentId);
            if (agentState && agentState.money > maxWealth) {
                maxWealth = agentState.money;
                leader = agentId;
            }
        }
        
        return leader;
    }
    
    private suggestFollowerAction(
        followerId: string,
        leaderAction: RLAction,
        state: MultiAgentState
    ): RLAction {
        // 基于领导者行动建议跟随者行动
        if (leaderAction.type === 'buy_property') {
            return {
                type: 'develop_property',
                confidence: 0.7,
                metadata: { reason: 'support_leader_strategy' }
            };
        }
        
        return {
            type: 'pass_turn',
            confidence: 0.5,
            metadata: { reason: 'follow_leader' }
        };
    }
}

// 多智能体强化学习框架主类
export class MultiAgentRLFramework extends EventEmitter {
    private agents: Map<string, MultiAgentRLAgent>;
    private environment: MultiAgentEnvironment;
    private coordinationMechanism: CoordinationMechanism;
    private episodeHistory: MultiAgentExperience[];
    private communicationLog: CommunicationMessage[];
    private learningStatistics: Map<string, any>;
    
    constructor(
        environment: MultiAgentEnvironment,
        coordinationType: 'none' | 'centralized' | 'distributed' | 'hierarchical' = 'distributed'
    ) {
        super();
        this.agents = new Map();
        this.environment = environment;
        this.coordinationMechanism = new CoordinationMechanism(coordinationType);
        this.episodeHistory = [];
        this.communicationLog = [];
        this.learningStatistics = new Map();
    }
    
    // 添加智能体
    addAgent(agent: MultiAgentRLAgent): void {
        this.agents.set(agent.agentId, agent);
        this.environment.addAgent(agent);
        this.initializeAgentStatistics(agent.agentId);
        
        this.emit('agent_added', { agentId: agent.agentId, agentType: agent.agentType });
    }
    
    // 移除智能体
    removeAgent(agentId: string): void {
        this.agents.delete(agentId);
        this.environment.removeAgent(agentId);
        this.learningStatistics.delete(agentId);
        
        this.emit('agent_removed', { agentId });
    }
    
    // 运行多智能体学习回合
    async runEpisode(): Promise<MultiAgentExperience[]> {
        const episodeExperiences: MultiAgentExperience[] = [];
        let state = await this.environment.reset();
        let done = false;
        let step = 0;
        const maxSteps = 1000;
        
        this.emit('episode_started', { agentCount: this.agents.size });
        
        while (!done && step < maxSteps) {
            // 1. 所有智能体选择动作
            const agentActions = new Map<string, RLAction>();
            for (const [agentId, agent] of this.agents) {
                const availableActions = this.environment.getAvailableActions(state);
                const action = await agent.selectActionInMultiAgentContext(
                    state,
                    availableActions,
                    Array.from(this.agents.keys()).filter(id => id !== agentId)
                );
                agentActions.set(agentId, action);
            }
            
            // 2. 协调动作
            const coordinatedAction = this.coordinationMechanism.coordinateActions(agentActions, state);
            
            // 3. 执行环境步骤
            const [nextState, rewards, isDone] = await this.environment.step(coordinatedAction);
            
            // 4. 记录经验
            const experience: MultiAgentExperience = {
                state,
                actions: coordinatedAction,
                rewards,
                nextState,
                done: isDone,
                agentParticipation: new Set(this.agents.keys()),
                cooperationLevel: this.calculateCooperationLevel(coordinatedAction),
                communicationEffectiveness: this.calculateCommunicationEffectiveness(coordinatedAction.communications)
            };
            
            episodeExperiences.push(experience);
            this.episodeHistory.push(experience);
            
            // 5. 更新所有智能体
            for (const [agentId, agent] of this.agents) {
                agent.updateWithMultiAgentExperience(experience);
                agent.processMultiAgentReward(rewards);
            }
            
            // 6. 处理通信
            this.processCommunications(coordinatedAction.communications);
            
            // 7. 更新统计
            this.updateLearningStatistics(experience);
            
            state = nextState;
            done = isDone;
            step++;
            
            this.emit('step_completed', { step, experience });
        }
        
        this.emit('episode_completed', { 
            episodeLength: step, 
            experienceCount: episodeExperiences.length 
        });
        
        return episodeExperiences;
    }
    
    // 训练多智能体系统
    async train(episodes: number): Promise<void> {
        this.emit('training_started', { episodes, agentCount: this.agents.size });
        
        for (let episode = 0; episode < episodes; episode++) {
            const experiences = await this.runEpisode();
            
            // 智能体间知识分享
            if (episode % 10 === 0) {
                await this.shareKnowledgeBetweenAgents();
            }
            
            // 适应性调整
            if (episode % 50 === 0) {
                this.adaptLearningParameters(episode, episodes);
            }
            
            this.emit('episode_progress', { 
                episode: episode + 1, 
                totalEpisodes: episodes,
                avgReward: this.calculateAverageEpisodeReward(experiences)
            });
        }
        
        this.emit('training_completed', { 
            episodes, 
            totalExperiences: this.episodeHistory.length 
        });
    }
    
    // 智能体间知识分享
    private async shareKnowledgeBetweenAgents(): Promise<void> {
        const cooperativeAgents = Array.from(this.agents.entries())
            .filter(([_, agent]) => agent.agentType === AgentType.COOPERATIVE || agent.agentType === AgentType.MIXED);
        
        for (let i = 0; i < cooperativeAgents.length; i++) {
            for (let j = i + 1; j < cooperativeAgents.length; j++) {
                const [agentId1, agent1] = cooperativeAgents[i];
                const [agentId2, agent2] = cooperativeAgents[j];
                
                // 交换学习经验
                const sharedKnowledge = {
                    agentId: agentId1,
                    learningProgress: this.learningStatistics.get(agentId1),
                    bestStrategies: await this.extractBestStrategies(agentId1)
                };
                
                // 发送知识分享消息
                const knowledgeMessage: CommunicationMessage = {
                    senderId: agentId1,
                    receiverId: agentId2,
                    messageType: 'information',
                    content: {
                        type: 'knowledge_sharing',
                        knowledge: sharedKnowledge
                    },
                    timestamp: Date.now(),
                    priority: 0
                };
                
                agent2.receiveMessage(knowledgeMessage);
            }
        }
    }
    
    // 提取最佳策略
    private async extractBestStrategies(agentId: string): Promise<any> {
        const agent = this.agents.get(agentId);
        if (!agent) return {};
        
        const agentStats = this.learningStatistics.get(agentId);
        return {
            bestActions: agentStats?.bestActions || [],
            successfulStrategies: agentStats?.successfulStrategies || [],
            learnedPatterns: agentStats?.learnedPatterns || []
        };
    }
    
    // 自适应学习参数调整
    private adaptLearningParameters(currentEpisode: number, totalEpisodes: number): void {
        const progress = currentEpisode / totalEpisodes;
        
        for (const [agentId, agent] of this.agents) {
            const stats = this.learningStatistics.get(agentId);
            if (stats) {
                // 根据学习进度调整探索率
                if (stats.averageReward > stats.previousAverageReward) {
                    // 学习效果好，减少探索
                    stats.explorationRate *= 0.99;
                } else {
                    // 学习效果不佳，增加探索
                    stats.explorationRate *= 1.01;
                }
                
                stats.explorationRate = Math.max(0.01, Math.min(0.5, stats.explorationRate));
                stats.previousAverageReward = stats.averageReward;
            }
        }
    }
    
    // 计算合作水平
    private calculateCooperationLevel(action: MultiAgentAction): number {
        let cooperationScore = 0;
        const totalAgents = action.agentActions.size;
        
        // 基于通信数量
        cooperationScore += action.communications.length * 0.1;
        
        // 基于协调信号
        cooperationScore += action.coordinationSignals.size * 0.2;
        
        // 基于动作一致性
        const actionTypes = Array.from(action.agentActions.values()).map(a => a.type);
        const uniqueActionTypes = new Set(actionTypes).size;
        const consistencyScore = 1 - (uniqueActionTypes / totalAgents);
        cooperationScore += consistencyScore * 0.5;
        
        return Math.min(1, cooperationScore);
    }
    
    // 计算通信效果
    private calculateCommunicationEffectiveness(communications: CommunicationMessage[]): number {
        if (communications.length === 0) return 0;
        
        let effectiveness = 0;
        
        for (const comm of communications) {
            // 基于消息优先级和类型
            switch (comm.messageType) {
                case 'information':
                    effectiveness += 0.3;
                    break;
                case 'offer':
                    effectiveness += 0.5;
                    break;
                case 'accept':
                    effectiveness += 0.8;
                    break;
                case 'request':
                    effectiveness += 0.4;
                    break;
                case 'reject':
                    effectiveness += 0.2;
                    break;
            }
            
            effectiveness += comm.priority * 0.1;
        }
        
        return Math.min(1, effectiveness / communications.length);
    }
    
    // 处理通信
    private processCommunications(communications: CommunicationMessage[]): void {
        for (const message of communications) {
            this.communicationLog.push(message);
            
            if (message.receiverId === 'broadcast') {
                // 广播消息
                for (const [agentId, agent] of this.agents) {
                    if (agentId !== message.senderId) {
                        agent.receiveMessage(message);
                    }
                }
            } else {
                // 点对点消息
                const recipient = this.agents.get(message.receiverId);
                if (recipient) {
                    recipient.receiveMessage(message);
                }
            }
        }
    }
    
    // 初始化智能体统计
    private initializeAgentStatistics(agentId: string): void {
        this.learningStatistics.set(agentId, {
            episodeCount: 0,
            totalReward: 0,
            averageReward: 0,
            previousAverageReward: 0,
            bestActions: [],
            successfulStrategies: [],
            learnedPatterns: [],
            explorationRate: 0.1,
            cooperationScore: 0,
            communicationCount: 0,
            lastUpdate: Date.now()
        });
    }
    
    // 更新学习统计
    private updateLearningStatistics(experience: MultiAgentExperience): void {
        for (const agentId of experience.agentParticipation) {
            const stats = this.learningStatistics.get(agentId);
            if (stats) {
                const agentReward = experience.rewards.individualRewards.get(agentId)?.value || 0;
                
                stats.episodeCount++;
                stats.totalReward += agentReward;
                stats.averageReward = stats.totalReward / stats.episodeCount;
                stats.cooperationScore = experience.cooperationLevel;
                stats.communicationCount += experience.actions.communications
                    .filter(c => c.senderId === agentId || c.receiverId === agentId).length;
                stats.lastUpdate = Date.now();
            }
        }
    }
    
    // 计算回合平均奖励
    private calculateAverageEpisodeReward(experiences: MultiAgentExperience[]): number {
        if (experiences.length === 0) return 0;
        
        let totalReward = 0;
        let totalAgentRewards = 0;
        
        for (const exp of experiences) {
            for (const reward of exp.rewards.individualRewards.values()) {
                totalReward += reward.value;
                totalAgentRewards++;
            }
        }
        
        return totalAgentRewards > 0 ? totalReward / totalAgentRewards : 0;
    }
    
    // 获取学习统计
    getLearningStatistics(): Map<string, any> {
        return new Map(this.learningStatistics);
    }
    
    // 获取通信日志
    getCommunicationLog(): CommunicationMessage[] {
        return [...this.communicationLog];
    }
    
    // 获取回合历史
    getEpisodeHistory(): MultiAgentExperience[] {
        return [...this.episodeHistory];
    }
    
    // 保存框架状态
    saveFramework(filepath: string): void {
        const frameworkState = {
            agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
                id,
                type: agent.agentType,
                algorithm: agent.algorithm
            })),
            statistics: Object.fromEntries(this.learningStatistics),
            episodeCount: this.episodeHistory.length,
            communicationCount: this.communicationLog.length,
            timestamp: Date.now()
        };
        
        // 这里可以添加实际的文件保存逻辑
        console.log('Framework state saved:', frameworkState);
    }
    
    // 加载框架状态
    loadFramework(filepath: string): void {
        // 这里可以添加实际的文件加载逻辑
        console.log('Loading framework state from:', filepath);
    }
}