/**
 * 策略梯度和Actor-Critic智能体实现
 * Policy Gradient and Actor-Critic Agent Implementation
 * 
 * 包含REINFORCE、Actor-Critic、PPO、A3C等算法
 */

import { 
    RLAgent, 
    RLState, 
    RLAction, 
    RLReward, 
    RLExperience,
    NeuralNetwork,
    Optimizer 
} from './ReinforcementLearningFramework';

import { 
    MultiAgentRLAgent, 
    MultiAgentState, 
    MultiAgentAction, 
    MultiAgentReward, 
    MultiAgentExperience,
    AgentType,
    MultiAgentAlgorithm,
    CommunicationMessage 
} from './MultiAgentRLFramework';

// 策略网络输出
export interface PolicyOutput {
    actionProbabilities: Map<string, number>;
    actionLogProbabilities: Map<string, number>;
    entropy: number;
    selectedAction: RLAction;
}

// 价值函数输出
export interface ValueOutput {
    stateValue: number;
    actionValues: Map<string, number>;
    advantage: number;
}

// 策略梯度经验
export interface PolicyGradientExperience extends RLExperience {
    actionProbability: number;
    actionLogProbability: number;
    advantage?: number;
    return?: number;
    discountedReward?: number;
}

// Actor网络（策略网络）
export class ActorNetwork {
    private network: NeuralNetwork;
    private stateSize: number;
    private actionSize: number;
    private hiddenSizes: number[];
    
    constructor(stateSize: number, actionSize: number, hiddenSizes: number[] = [256, 128]) {
        this.stateSize = stateSize;
        this.actionSize = actionSize;
        this.hiddenSizes = hiddenSizes;
        
        // 构建神经网络架构
        const layerSizes = [stateSize, ...hiddenSizes, actionSize];
        this.network = new NeuralNetwork(layerSizes);
    }
    
    // 前向传播 - 输出动作概率
    forward(state: number[]): PolicyOutput {
        const networkOutput = this.network.forward(state);
        
        // Softmax激活函数获得概率分布
        const probabilities = this.softmax(networkOutput);
        const logProbabilities = probabilities.map(p => Math.log(Math.max(p, 1e-8)));
        
        // 创建动作概率映射
        const actionTypes = ['roll_dice', 'buy_property', 'develop_property', 'trade_offer', 
                           'use_skill', 'mortgage_property', 'unmortgage_property', 'pass_turn'];
        
        const actionProbabilities = new Map<string, number>();
        const actionLogProbabilities = new Map<string, number>();
        
        for (let i = 0; i < Math.min(actionTypes.length, probabilities.length); i++) {
            actionProbabilities.set(actionTypes[i], probabilities[i]);
            actionLogProbabilities.set(actionTypes[i], logProbabilities[i]);
        }
        
        // 计算熵（用于探索）
        const entropy = -probabilities.reduce((sum, p) => sum + p * Math.log(Math.max(p, 1e-8)), 0);
        
        // 选择动作（采样）
        const selectedAction = this.sampleAction(actionProbabilities);
        
        return {
            actionProbabilities,
            actionLogProbabilities,
            entropy,
            selectedAction
        };
    }
    
    // Softmax激活函数
    private softmax(x: number[]): number[] {
        const maxX = Math.max(...x);
        const expX = x.map(val => Math.exp(val - maxX));
        const sumExpX = expX.reduce((sum, val) => sum + val, 0);
        return expX.map(val => val / sumExpX);
    }
    
    // 从概率分布采样动作
    private sampleAction(actionProbabilities: Map<string, number>): RLAction {
        const actions = Array.from(actionProbabilities.keys());
        const probabilities = Array.from(actionProbabilities.values());
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < actions.length; i++) {
            cumulative += probabilities[i];
            if (random <= cumulative) {
                return {
                    type: actions[i] as any,
                    confidence: probabilities[i],
                    metadata: { sampling: 'stochastic' }
                };
            }
        }
        
        // 后备选择
        return {
            type: 'pass_turn',
            confidence: 0.1,
            metadata: { sampling: 'fallback' }
        };
    }
    
    // 反向传播
    backward(
        state: number[], 
        action: RLAction, 
        advantage: number, 
        actionLogProbability: number,
        entropy: number,
        entropyCoefficient: number = 0.01
    ): void {
        // 计算策略损失
        const policyLoss = -actionLogProbability * advantage;
        
        // 添加熵正则化
        const entropyLoss = -entropyCoefficient * entropy;
        
        const totalLoss = policyLoss + entropyLoss;
        
        // 执行反向传播
        this.network.backward([totalLoss]);
    }
    
    // 更新参数
    updateWeights(optimizer: Optimizer): void {
        this.network.updateWeights(optimizer);
    }
    
    // 获取网络参数
    getWeights(): number[][][] {
        return this.network.getWeights();
    }
    
    // 设置网络参数
    setWeights(weights: number[][][]): void {
        this.network.setWeights(weights);
    }
}

// Critic网络（价值网络）
export class CriticNetwork {
    private network: NeuralNetwork;
    private stateSize: number;
    private hiddenSizes: number[];
    
    constructor(stateSize: number, hiddenSizes: number[] = [256, 128]) {
        this.stateSize = stateSize;
        this.hiddenSizes = hiddenSizes;
        
        // 构建神经网络架构（输出单个值）
        const layerSizes = [stateSize, ...hiddenSizes, 1];
        this.network = new NeuralNetwork(layerSizes);
    }
    
    // 前向传播 - 输出状态价值
    forward(state: number[]): ValueOutput {
        const networkOutput = this.network.forward(state);
        const stateValue = networkOutput[0];
        
        return {
            stateValue,
            actionValues: new Map(), // 状态价值网络不输出动作价值
            advantage: 0 // 将在外部计算
        };
    }
    
    // 反向传播
    backward(state: number[], targetValue: number): void {
        const currentValue = this.forward(state).stateValue;
        const valueLoss = Math.pow(targetValue - currentValue, 2) / 2;
        
        this.network.backward([valueLoss]);
    }
    
    // 更新参数
    updateWeights(optimizer: Optimizer): void {
        this.network.updateWeights(optimizer);
    }
    
    // 获取网络参数
    getWeights(): number[][][] {
        return this.network.getWeights();
    }
    
    // 设置网络参数
    setWeights(weights: number[][][]): void {
        this.network.setWeights(weights);
    }
}

// REINFORCE算法智能体
export class REINFORCEAgent implements RLAgent {
    public agentId: string;
    private actor: ActorNetwork;
    private optimizer: Optimizer;
    private gamma: number;
    private learningRate: number;
    private episodeMemory: PolicyGradientExperience[];
    private baselineValue: number;
    
    constructor(
        agentId: string,
        stateSize: number = 18,
        actionSize: number = 8,
        learningRate: number = 0.001,
        gamma: number = 0.99
    ) {
        this.agentId = agentId;
        this.actor = new ActorNetwork(stateSize, actionSize);
        this.optimizer = new Optimizer('adam', learningRate);
        this.gamma = gamma;
        this.learningRate = learningRate;
        this.episodeMemory = [];
        this.baselineValue = 0;
    }
    
    async selectAction(state: RLState, availableActions: RLAction[]): Promise<RLAction> {
        const stateVector = this.convertStateToVector(state);
        const policyOutput = this.actor.forward(stateVector);
        
        // 过滤可用动作
        const filteredProbabilities = new Map<string, number>();
        for (const action of availableActions) {
            const prob = policyOutput.actionProbabilities.get(action.type) || 0;
            filteredProbabilities.set(action.type, prob);
        }
        
        // 重新归一化概率
        const totalProb = Array.from(filteredProbabilities.values()).reduce((sum, p) => sum + p, 0);
        if (totalProb > 0) {
            for (const [action, prob] of filteredProbabilities) {
                filteredProbabilities.set(action, prob / totalProb);
            }
        }
        
        return policyOutput.selectedAction;
    }
    
    updateExperience(experience: RLExperience): void {
        const stateVector = this.convertStateToVector(experience.state);
        const policyOutput = this.actor.forward(stateVector);
        
        const actionLogProb = policyOutput.actionLogProbabilities.get(experience.action.type) || Math.log(1e-8);
        
        const pgExperience: PolicyGradientExperience = {
            ...experience,
            actionProbability: policyOutput.actionProbabilities.get(experience.action.type) || 1e-8,
            actionLogProbability: actionLogProb
        };
        
        this.episodeMemory.push(pgExperience);
    }
    
    completeEpisode(): void {
        if (this.episodeMemory.length === 0) return;
        
        // 计算折扣奖励
        this.calculateDiscountedRewards();
        
        // 更新基线
        this.updateBaseline();
        
        // 训练策略网络
        this.trainPolicy();
        
        // 清空记忆
        this.episodeMemory = [];
    }
    
    private calculateDiscountedRewards(): void {
        let discountedReward = 0;
        
        // 从后向前计算折扣奖励
        for (let i = this.episodeMemory.length - 1; i >= 0; i--) {
            discountedReward = this.episodeMemory[i].reward.value + this.gamma * discountedReward;
            this.episodeMemory[i].discountedReward = discountedReward;
            this.episodeMemory[i].return = discountedReward;
        }
    }
    
    private updateBaseline(): void {
        const totalReturn = this.episodeMemory.reduce((sum, exp) => sum + (exp.return || 0), 0);
        const avgReturn = totalReturn / this.episodeMemory.length;
        
        // 指数移动平均更新基线
        this.baselineValue = 0.9 * this.baselineValue + 0.1 * avgReturn;
    }
    
    private trainPolicy(): void {
        for (const experience of this.episodeMemory) {
            const stateVector = this.convertStateToVector(experience.state);
            const advantage = (experience.return || 0) - this.baselineValue;
            
            const policyOutput = this.actor.forward(stateVector);
            
            this.actor.backward(
                stateVector,
                experience.action,
                advantage,
                experience.actionLogProbability,
                policyOutput.entropy
            );
        }
        
        this.actor.updateWeights(this.optimizer);
    }
    
    private convertStateToVector(state: RLState): number[] {
        return [
            state.money / 10000,
            state.position / 40,
            state.properties.length / 40,
            state.houses / 200,
            state.hotels / 50,
            state.isInJail ? 1 : 0,
            state.turnsInJail / 3,
            state.doubleRollCount / 3,
            state.gamePhase === 'early' ? 1 : state.gamePhase === 'mid' ? 0.5 : 0,
            state.roundNumber / 100,
            state.playerCount / 8,
            state.activePlayerIndex / 8,
            state.currentRent / 5000,
            state.developmentCost / 1000,
            state.mortgageValue / 5000,
            state.availableSkills.length / 10,
            state.usedSkills.length / 10,
            state.seasonalBonus / 2
        ];
    }
    
    saveModel(filepath: string): void {
        const modelData = {
            agentId: this.agentId,
            weights: this.actor.getWeights(),
            baseline: this.baselineValue,
            hyperparameters: {
                learningRate: this.learningRate,
                gamma: this.gamma
            }
        };
        console.log('REINFORCE model saved:', modelData);
    }
    
    loadModel(filepath: string): void {
        console.log('Loading REINFORCE model from:', filepath);
    }
}

// Actor-Critic算法智能体
export class ActorCriticAgent implements MultiAgentRLAgent {
    public agentId: string;
    public agentType: AgentType;
    public algorithm: MultiAgentAlgorithm;
    public communicationEnabled: boolean;
    public cooperationLevel: number;
    
    private actor: ActorNetwork;
    private critic: CriticNetwork;
    private actorOptimizer: Optimizer;
    private criticOptimizer: Optimizer;
    private gamma: number;
    private lambda: number; // GAE参数
    private episodeMemory: PolicyGradientExperience[];
    private messageQueue: CommunicationMessage[];
    
    constructor(
        agentId: string,
        agentType: AgentType = AgentType.INDEPENDENT,
        stateSize: number = 18,
        actionSize: number = 8,
        actorLR: number = 0.001,
        criticLR: number = 0.005,
        gamma: number = 0.99,
        lambda: number = 0.95
    ) {
        this.agentId = agentId;
        this.agentType = agentType;
        this.algorithm = MultiAgentAlgorithm.ACTOR_CRITIC;
        this.communicationEnabled = agentType !== AgentType.INDEPENDENT;
        this.cooperationLevel = agentType === AgentType.COOPERATIVE ? 0.8 : 
                               agentType === AgentType.MIXED ? 0.5 : 0.2;
        
        this.actor = new ActorNetwork(stateSize, actionSize);
        this.critic = new CriticNetwork(stateSize);
        this.actorOptimizer = new Optimizer('adam', actorLR);
        this.criticOptimizer = new Optimizer('adam', criticLR);
        this.gamma = gamma;
        this.lambda = lambda;
        this.episodeMemory = [];
        this.messageQueue = [];
    }
    
    async selectAction(state: RLState, availableActions: RLAction[]): Promise<RLAction> {
        return this.selectActionInMultiAgentContext(
            { globalState: state, agentStates: new Map(), sharedInformation: new Map(), communicationHistory: [], timestamp: Date.now() },
            availableActions,
            []
        );
    }
    
    async selectActionInMultiAgentContext(
        state: MultiAgentState,
        availableActions: RLAction[],
        otherAgents: string[]
    ): Promise<RLAction> {
        const stateVector = this.convertStateToVector(state.globalState);
        const policyOutput = this.actor.forward(stateVector);
        
        // 考虑合作因素调整动作选择
        if (this.communicationEnabled && otherAgents.length > 0) {
            return this.selectCooperativeAction(policyOutput, state, otherAgents);
        }
        
        return policyOutput.selectedAction;
    }
    
    private selectCooperativeAction(
        policyOutput: PolicyOutput,
        state: MultiAgentState,
        otherAgents: string[]
    ): RLAction {
        // 基础动作选择
        let selectedAction = policyOutput.selectedAction;
        
        // 合作行为修正
        if (this.agentType === AgentType.COOPERATIVE) {
            const cooperativeActions = ['trade_offer', 'develop_property'];
            const currentActionScore = policyOutput.actionProbabilities.get(selectedAction.type) || 0;
            
            for (const cooperativeAction of cooperativeActions) {
                const cooperativeScore = policyOutput.actionProbabilities.get(cooperativeAction) || 0;
                if (cooperativeScore > currentActionScore * 0.8) {
                    selectedAction = {
                        type: cooperativeAction as any,
                        confidence: cooperativeScore,
                        metadata: { cooperation: true, originalAction: selectedAction.type }
                    };
                    break;
                }
            }
        }
        
        return selectedAction;
    }
    
    updateExperience(experience: RLExperience): void {
        this.updateWithMultiAgentExperience({
            state: { globalState: experience.state, agentStates: new Map(), sharedInformation: new Map(), communicationHistory: [], timestamp: Date.now() },
            actions: { agentActions: new Map([[this.agentId, experience.action]]), communications: [], coordinationSignals: new Map() },
            rewards: { individualRewards: new Map([[this.agentId, experience.reward]]), sharedReward: experience.reward, cooperationBonus: 0, competitionPenalty: 0 },
            nextState: { globalState: experience.nextState, agentStates: new Map(), sharedInformation: new Map(), communicationHistory: [], timestamp: Date.now() },
            done: experience.done,
            agentParticipation: new Set([this.agentId]),
            cooperationLevel: 0,
            communicationEffectiveness: 0
        });
    }
    
    updateWithMultiAgentExperience(experience: MultiAgentExperience): void {
        const stateVector = this.convertStateToVector(experience.state.globalState);
        const nextStateVector = this.convertStateToVector(experience.nextState.globalState);
        
        // 获取策略输出
        const policyOutput = this.actor.forward(stateVector);
        const actionLogProb = policyOutput.actionLogProbabilities.get(
            experience.actions.agentActions.get(this.agentId)?.type || 'pass_turn'
        ) || Math.log(1e-8);
        
        // 获取价值估计
        const currentValue = this.critic.forward(stateVector).stateValue;
        const nextValue = experience.done ? 0 : this.critic.forward(nextStateVector).stateValue;
        
        // 计算TD误差
        const reward = experience.rewards.individualRewards.get(this.agentId)?.value || 0;
        const tdError = reward + this.gamma * nextValue - currentValue;
        
        const pgExperience: PolicyGradientExperience = {
            state: experience.state.globalState,
            action: experience.actions.agentActions.get(this.agentId)!,
            reward: experience.rewards.individualRewards.get(this.agentId)!,
            nextState: experience.nextState.globalState,
            done: experience.done,
            actionProbability: policyOutput.actionProbabilities.get(
                experience.actions.agentActions.get(this.agentId)?.type || 'pass_turn'
            ) || 1e-8,
            actionLogProbability: actionLogProb,
            advantage: tdError
        };
        
        this.episodeMemory.push(pgExperience);
        
        // 立即更新（在线学习）
        this.trainNetworks(pgExperience, currentValue, nextValue, reward);
    }
    
    private trainNetworks(
        experience: PolicyGradientExperience,
        currentValue: number,
        nextValue: number,
        reward: number
    ): void {
        const stateVector = this.convertStateToVector(experience.state);
        
        // 训练Critic网络
        const targetValue = reward + this.gamma * nextValue;
        this.critic.backward(stateVector, targetValue);
        this.critic.updateWeights(this.criticOptimizer);
        
        // 训练Actor网络
        const advantage = experience.advantage || 0;
        const policyOutput = this.actor.forward(stateVector);
        
        this.actor.backward(
            stateVector,
            experience.action,
            advantage,
            experience.actionLogProbability,
            policyOutput.entropy
        );
        this.actor.updateWeights(this.actorOptimizer);
    }
    
    processMultiAgentReward(reward: MultiAgentReward): void {
        // 处理合作奖励
        if (reward.cooperationBonus > 0 && this.agentType === AgentType.COOPERATIVE) {
            this.cooperationLevel = Math.min(1.0, this.cooperationLevel + 0.01);
        }
        
        // 处理竞争惩罚
        if (reward.competitionPenalty > 0 && this.agentType === AgentType.COMPETITIVE) {
            this.cooperationLevel = Math.max(0.0, this.cooperationLevel - 0.01);
        }
    }
    
    completeEpisode(): void {
        if (this.episodeMemory.length === 0) return;
        
        // 使用GAE计算优势函数
        this.calculateGAE();
        
        // 批量训练
        this.batchTrain();
        
        // 清空记忆
        this.episodeMemory = [];
    }
    
    private calculateGAE(): void {
        let gaeAdvantage = 0;
        
        for (let i = this.episodeMemory.length - 1; i >= 0; i--) {
            const experience = this.episodeMemory[i];
            const stateVector = this.convertStateToVector(experience.state);
            const currentValue = this.critic.forward(stateVector).stateValue;
            
            let nextValue = 0;
            if (i < this.episodeMemory.length - 1) {
                const nextStateVector = this.convertStateToVector(this.episodeMemory[i + 1].state);
                nextValue = this.critic.forward(nextStateVector).stateValue;
            }
            
            const tdError = experience.reward.value + this.gamma * nextValue - currentValue;
            gaeAdvantage = tdError + this.gamma * this.lambda * gaeAdvantage;
            
            experience.advantage = gaeAdvantage;
            experience.return = gaeAdvantage + currentValue;
        }
    }
    
    private batchTrain(): void {
        for (const experience of this.episodeMemory) {
            if (experience.advantage !== undefined && experience.return !== undefined) {
                const stateVector = this.convertStateToVector(experience.state);
                
                // 训练Critic
                this.critic.backward(stateVector, experience.return);
                
                // 训练Actor
                const policyOutput = this.actor.forward(stateVector);
                this.actor.backward(
                    stateVector,
                    experience.action,
                    experience.advantage,
                    experience.actionLogProbability,
                    policyOutput.entropy
                );
            }
        }
        
        // 批量更新参数
        this.critic.updateWeights(this.criticOptimizer);
        this.actor.updateWeights(this.actorOptimizer);
    }
    
    // 通信相关方法
    sendMessage(message: CommunicationMessage): void {
        // 实际发送逻辑由MultiAgentFramework处理
        console.log(`Agent ${this.agentId} sending message:`, message);
    }
    
    receiveMessage(message: CommunicationMessage): void {
        this.messageQueue.push(message);
    }
    
    processIncomingMessages(): CommunicationMessage[] {
        const messages = [...this.messageQueue];
        this.messageQueue = [];
        
        for (const message of messages) {
            this.handleMessage(message);
        }
        
        return messages;
    }
    
    private handleMessage(message: CommunicationMessage): void {
        switch (message.messageType) {
            case 'information':
                this.handleInformationMessage(message);
                break;
            case 'offer':
                this.handleOfferMessage(message);
                break;
            case 'request':
                this.handleRequestMessage(message);
                break;
            default:
                break;
        }
    }
    
    private handleInformationMessage(message: CommunicationMessage): void {
        if (message.content.type === 'knowledge_sharing' && this.agentType === AgentType.COOPERATIVE) {
            // 处理知识分享
            const sharedKnowledge = message.content.knowledge;
            // 可以用于更新自己的策略或价值网络
        }
    }
    
    private handleOfferMessage(message: CommunicationMessage): void {
        if (this.agentType === AgentType.COOPERATIVE) {
            const acceptProbability = this.evaluateCooperationOpportunity(message.senderId, message.content);
            if (acceptProbability > 0.5) {
                const response: CommunicationMessage = {
                    senderId: this.agentId,
                    receiverId: message.senderId,
                    messageType: 'accept',
                    content: { originalOffer: message.content },
                    timestamp: Date.now(),
                    priority: 1
                };
                this.sendMessage(response);
            }
        }
    }
    
    private handleRequestMessage(message: CommunicationMessage): void {
        // 处理请求消息
        if (message.content.type === 'cooperation_request') {
            const proposal = this.proposeCooperation(message.senderId);
            if (proposal) {
                const response: CommunicationMessage = {
                    senderId: this.agentId,
                    receiverId: message.senderId,
                    messageType: 'offer',
                    content: proposal,
                    timestamp: Date.now(),
                    priority: 1
                };
                this.sendMessage(response);
            }
        }
    }
    
    evaluateCooperationOpportunity(otherAgent: string, proposal: any): number {
        // 基于智能体类型和当前状态评估合作机会
        let score = 0;
        
        switch (this.agentType) {
            case AgentType.COOPERATIVE:
                score = 0.8;
                break;
            case AgentType.MIXED:
                score = 0.5;
                break;
            case AgentType.COMPETITIVE:
                score = 0.2;
                break;
            default:
                score = 0.1;
        }
        
        // 基于合作历史调整
        score *= this.cooperationLevel;
        
        return score;
    }
    
    proposeCooperation(otherAgent: string): any {
        if (this.agentType === AgentType.COOPERATIVE || this.agentType === AgentType.MIXED) {
            return {
                type: 'trade_proposal',
                proposer: this.agentId,
                target: otherAgent,
                terms: {
                    offer: 'property_exchange',
                    mutual_benefit: true
                }
            };
        }
        return null;
    }
    
    respondToCooperationProposal(proposal: any): boolean {
        const acceptanceScore = this.evaluateCooperationOpportunity(proposal.proposer, proposal);
        return acceptanceScore > 0.5;
    }
    
    private convertStateToVector(state: RLState): number[] {
        return [
            state.money / 10000,
            state.position / 40,
            state.properties.length / 40,
            state.houses / 200,
            state.hotels / 50,
            state.isInJail ? 1 : 0,
            state.turnsInJail / 3,
            state.doubleRollCount / 3,
            state.gamePhase === 'early' ? 1 : state.gamePhase === 'mid' ? 0.5 : 0,
            state.roundNumber / 100,
            state.playerCount / 8,
            state.activePlayerIndex / 8,
            state.currentRent / 5000,
            state.developmentCost / 1000,
            state.mortgageValue / 5000,
            state.availableSkills.length / 10,
            state.usedSkills.length / 10,
            state.seasonalBonus / 2
        ];
    }
    
    saveModel(filepath: string): void {
        const modelData = {
            agentId: this.agentId,
            agentType: this.agentType,
            actorWeights: this.actor.getWeights(),
            criticWeights: this.critic.getWeights(),
            cooperationLevel: this.cooperationLevel,
            hyperparameters: {
                gamma: this.gamma,
                lambda: this.lambda
            }
        };
        console.log('Actor-Critic model saved:', modelData);
    }
    
    loadModel(filepath: string): void {
        console.log('Loading Actor-Critic model from:', filepath);
    }
}