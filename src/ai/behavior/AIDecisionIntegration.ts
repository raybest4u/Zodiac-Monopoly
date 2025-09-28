/**
 * AI决策逻辑集成
 * AI Decision Logic Integration
 * 
 * 将行为控制系统与游戏AI决策逻辑集成，提供智能决策能力
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { CompositeBehaviorController, BehaviorControlMode, BehaviorExecutionResult } from './CompositeBehaviorController';
import { BehaviorTree, NodeStatus } from './BehaviorTree';
import { HierarchicalStateMachine } from './StateMachine';

// 决策类型
export enum DecisionType {
    MOVEMENT = 'movement',                    // 移动决策
    PROPERTY_PURCHASE = 'property_purchase',  // 房产购买
    PROPERTY_UPGRADE = 'property_upgrade',    // 房产升级
    TRADE_NEGOTIATION = 'trade_negotiation', // 交易谈判
    FINANCIAL_MANAGEMENT = 'financial_management', // 财务管理
    RISK_ASSESSMENT = 'risk_assessment',     // 风险评估
    STRATEGIC_PLANNING = 'strategic_planning' // 战略规划
}

// 决策上下文
export interface DecisionContext {
    playerId: string;
    gameState: any;
    playerState: any;
    availableActions: string[];
    timeRemaining: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    personality: PlayerPersonality;
    constraints: DecisionConstraints;
}

// 玩家个性
export interface PlayerPersonality {
    aggressiveness: number;   // 激进程度 (0-1)
    riskTolerance: number;    // 风险容忍度 (0-1)
    cooperativeness: number;  // 合作倾向 (0-1)
    patience: number;         // 耐心程度 (0-1)
    greed: number;           // 贪婪程度 (0-1)
    strategicThinking: number; // 战略思维 (0-1)
}

// 决策约束
export interface DecisionConstraints {
    maxThinkingTime: number;
    minCashReserve: number;
    maxRiskLevel: number;
    priorityActions: string[];
    blacklistedActions: string[];
}

// 决策结果
export interface DecisionResult {
    type: DecisionType;
    action: string;
    parameters: Map<string, any>;
    confidence: number;
    reasoning: string[];
    alternativeActions: string[];
    executionPriority: number;
    estimatedOutcome: any;
}

// 决策评估器
export interface DecisionEvaluator {
    evaluateDecision(
        decision: DecisionResult,
        context: DecisionContext
    ): Promise<number>; // 返回评分 0-1
}

// 决策策略
export interface DecisionStrategy {
    id: string;
    name: string;
    description: string;
    supportedTypes: DecisionType[];
    makeDecision(context: DecisionContext): Promise<DecisionResult>;
    canHandle(type: DecisionType, context: DecisionContext): boolean;
}

// AI决策集成器
export class AIDecisionIntegration extends EventEmitter {
    private behaviorController: CompositeBehaviorController;
    private decisionStrategies: Map<string, DecisionStrategy>;
    private decisionEvaluators: Map<DecisionType, DecisionEvaluator>;
    private decisionHistory: DecisionResult[];
    private currentContext: DecisionContext | null;
    private maxHistorySize: number;
    private defaultPersonality: PlayerPersonality;

    constructor(behaviorController: CompositeBehaviorController) {
        super();
        this.behaviorController = behaviorController;
        this.decisionStrategies = new Map();
        this.decisionEvaluators = new Map();
        this.decisionHistory = [];
        this.currentContext = null;
        this.maxHistorySize = 200;

        // 默认人格特征
        this.defaultPersonality = {
            aggressiveness: 0.5,
            riskTolerance: 0.5,
            cooperativeness: 0.5,
            patience: 0.5,
            greed: 0.5,
            strategicThinking: 0.5
        };

        this.setupBehaviorControllerIntegration();
    }

    // 设置行为控制器集成
    private setupBehaviorControllerIntegration(): void {
        this.behaviorController.on('controller_started', () => {
            this.emit('decision_integration_started');
        });

        this.behaviorController.on('controller_stopped', () => {
            this.emit('decision_integration_stopped');
        });

        this.behaviorController.on('execution_error', (error) => {
            this.emit('decision_error', error);
        });
    }

    // 添加决策策略
    addDecisionStrategy(strategy: DecisionStrategy): void {
        this.decisionStrategies.set(strategy.id, strategy);
        this.emit('strategy_added', { strategyId: strategy.id, name: strategy.name });
    }

    // 移除决策策略
    removeDecisionStrategy(strategyId: string): void {
        if (this.decisionStrategies.delete(strategyId)) {
            this.emit('strategy_removed', { strategyId });
        }
    }

    // 添加决策评估器
    addDecisionEvaluator(type: DecisionType, evaluator: DecisionEvaluator): void {
        this.decisionEvaluators.set(type, evaluator);
    }

    // 制定决策
    async makeDecision(
        type: DecisionType,
        context: DecisionContext
    ): Promise<DecisionResult> {
        this.currentContext = context;
        
        try {
            // 更新共享数据
            this.updateSharedContext(context);

            // 执行行为控制器tick
            const behaviorResult = await this.behaviorController.tick(16);

            // 获取适用的决策策略
            const applicableStrategies = this.getApplicableStrategies(type, context);
            
            if (applicableStrategies.length === 0) {
                throw new Error(`No applicable strategies for decision type: ${type}`);
            }

            // 生成候选决策
            const candidateDecisions = await this.generateCandidateDecisions(
                applicableStrategies,
                context
            );

            // 评估并选择最佳决策
            const bestDecision = await this.selectBestDecision(
                candidateDecisions,
                context,
                behaviorResult
            );

            // 记录决策
            this.recordDecision(bestDecision);

            this.emit('decision_made', {
                type,
                decision: bestDecision,
                context,
                behaviorResult
            });

            return bestDecision;

        } catch (error) {
            this.emit('decision_error', { type, context, error });
            throw error;
        }
    }

    // 更新共享上下文
    private updateSharedContext(context: DecisionContext): void {
        this.behaviorController.setSharedData('playerId', context.playerId);
        this.behaviorController.setSharedData('gameState', context.gameState);
        this.behaviorController.setSharedData('playerState', context.playerState);
        this.behaviorController.setSharedData('availableActions', context.availableActions);
        this.behaviorController.setSharedData('personality', context.personality);
        this.behaviorController.setSharedData('constraints', context.constraints);
        this.behaviorController.setSharedData('difficulty', context.difficulty);
    }

    // 获取适用的决策策略
    private getApplicableStrategies(
        type: DecisionType,
        context: DecisionContext
    ): DecisionStrategy[] {
        return Array.from(this.decisionStrategies.values()).filter(strategy =>
            strategy.canHandle(type, context)
        );
    }

    // 生成候选决策
    private async generateCandidateDecisions(
        strategies: DecisionStrategy[],
        context: DecisionContext
    ): Promise<DecisionResult[]> {
        const decisions = await Promise.all(
            strategies.map(strategy => strategy.makeDecision(context))
        );

        return decisions.filter(decision => decision !== null);
    }

    // 选择最佳决策
    private async selectBestDecision(
        candidates: DecisionResult[],
        context: DecisionContext,
        behaviorResult: BehaviorExecutionResult
    ): Promise<DecisionResult> {
        if (candidates.length === 0) {
            throw new Error('No candidate decisions generated');
        }

        if (candidates.length === 1) {
            return candidates[0];
        }

        // 评估每个候选决策
        const evaluatedCandidates = await Promise.all(
            candidates.map(async (candidate) => {
                const score = await this.evaluateDecision(candidate, context, behaviorResult);
                return { candidate, score };
            })
        );

        // 选择得分最高的决策
        evaluatedCandidates.sort((a, b) => b.score - a.score);
        return evaluatedCandidates[0].candidate;
    }

    // 评估决策
    private async evaluateDecision(
        decision: DecisionResult,
        context: DecisionContext,
        behaviorResult: BehaviorExecutionResult
    ): Promise<number> {
        let totalScore = decision.confidence;
        let scoreCount = 1;

        // 使用特定类型的评估器
        const evaluator = this.decisionEvaluators.get(decision.type);
        if (evaluator) {
            const evaluatorScore = await evaluator.evaluateDecision(decision, context);
            totalScore += evaluatorScore;
            scoreCount++;
        }

        // 基于行为结果调整分数
        if (behaviorResult.success) {
            totalScore += 0.1;
        }

        // 基于个性特征调整分数
        totalScore += this.calculatePersonalityBonus(decision, context.personality);

        // 基于历史决策调整分数
        totalScore += this.calculateHistoryBonus(decision);

        return totalScore / scoreCount;
    }

    // 计算个性特征奖励
    private calculatePersonalityBonus(
        decision: DecisionResult,
        personality: PlayerPersonality
    ): number {
        let bonus = 0;

        // 根据决策类型和个性特征计算奖励
        switch (decision.type) {
            case DecisionType.PROPERTY_PURCHASE:
                bonus += personality.aggressiveness * 0.1;
                bonus += (1 - personality.riskTolerance) * 0.05;
                break;

            case DecisionType.TRADE_NEGOTIATION:
                bonus += personality.cooperativeness * 0.1;
                bonus += personality.strategicThinking * 0.05;
                break;

            case DecisionType.RISK_ASSESSMENT:
                bonus += personality.patience * 0.1;
                bonus += (1 - personality.riskTolerance) * 0.1;
                break;

            case DecisionType.STRATEGIC_PLANNING:
                bonus += personality.strategicThinking * 0.15;
                bonus += personality.patience * 0.05;
                break;
        }

        return Math.max(-0.2, Math.min(0.2, bonus)); // 限制在 -0.2 到 0.2 之间
    }

    // 计算历史决策奖励
    private calculateHistoryBonus(decision: DecisionResult): number {
        const recentDecisions = this.decisionHistory.slice(-10);
        const sameTypeDecisions = recentDecisions.filter(d => d.type === decision.type);
        
        // 避免重复相同类型的决策
        if (sameTypeDecisions.length > 3) {
            return -0.1;
        }

        // 奖励多样化决策
        const uniqueTypes = new Set(recentDecisions.map(d => d.type));
        if (uniqueTypes.size >= 3) {
            return 0.05;
        }

        return 0;
    }

    // 记录决策
    private recordDecision(decision: DecisionResult): void {
        this.decisionHistory.push({
            ...decision,
            parameters: new Map(decision.parameters) // 深拷贝
        });

        if (this.decisionHistory.length > this.maxHistorySize) {
            this.decisionHistory.shift();
        }
    }

    // 启动决策系统
    async start(agent: any, gameState: any): Promise<void> {
        await this.behaviorController.start(agent, gameState);
    }

    // 停止决策系统
    async stop(): Promise<void> {
        await this.behaviorController.stop();
    }

    // 获取决策历史
    getDecisionHistory(type?: DecisionType, limit?: number): DecisionResult[] {
        let history = this.decisionHistory;
        
        if (type) {
            history = history.filter(d => d.type === type);
        }
        
        if (limit) {
            history = history.slice(-limit);
        }
        
        return [...history]; // 返回副本
    }

    // 分析决策模式
    analyzeDecisionPatterns(): any {
        const patterns = {
            totalDecisions: this.decisionHistory.length,
            decisionsByType: new Map<DecisionType, number>(),
            averageConfidence: 0,
            mostCommonAction: '',
            leastCommonAction: '',
            recentTrend: ''
        };

        if (this.decisionHistory.length === 0) {
            return patterns;
        }

        // 按类型统计决策
        for (const decision of this.decisionHistory) {
            const count = patterns.decisionsByType.get(decision.type) || 0;
            patterns.decisionsByType.set(decision.type, count + 1);
        }

        // 计算平均置信度
        const totalConfidence = this.decisionHistory.reduce(
            (sum, d) => sum + d.confidence, 0
        );
        patterns.averageConfidence = totalConfidence / this.decisionHistory.length;

        // 分析行动频率
        const actionCounts = new Map<string, number>();
        for (const decision of this.decisionHistory) {
            const count = actionCounts.get(decision.action) || 0;
            actionCounts.set(decision.action, count + 1);
        }

        const sortedActions = Array.from(actionCounts.entries())
            .sort((a, b) => b[1] - a[1]);
        
        if (sortedActions.length > 0) {
            patterns.mostCommonAction = sortedActions[0][0];
            patterns.leastCommonAction = sortedActions[sortedActions.length - 1][0];
        }

        // 分析最近趋势
        const recentDecisions = this.decisionHistory.slice(-10);
        const recentTypes = recentDecisions.map(d => d.type);
        const uniqueRecentTypes = new Set(recentTypes);
        
        if (uniqueRecentTypes.size === 1) {
            patterns.recentTrend = 'focused';
        } else if (uniqueRecentTypes.size >= recentTypes.length * 0.7) {
            patterns.recentTrend = 'diversified';
        } else {
            patterns.recentTrend = 'mixed';
        }

        return patterns;
    }

    // 预测下一个决策
    predictNextDecision(context: DecisionContext): { type: DecisionType; confidence: number } {
        const patterns = this.analyzeDecisionPatterns();
        const recentDecisions = this.decisionHistory.slice(-5);
        
        if (recentDecisions.length === 0) {
            return { type: DecisionType.MOVEMENT, confidence: 0.1 };
        }

        // 基于最近决策模式预测
        const typeFrequency = new Map<DecisionType, number>();
        for (const decision of recentDecisions) {
            const count = typeFrequency.get(decision.type) || 0;
            typeFrequency.set(decision.type, count + 1);
        }

        const mostLikelyType = Array.from(typeFrequency.entries())
            .sort((a, b) => b[1] - a[1])[0];

        const confidence = mostLikelyType[1] / recentDecisions.length;

        return {
            type: mostLikelyType[0],
            confidence: Math.min(0.9, confidence + 0.2)
        };
    }

    // 获取当前状态
    getCurrentStatus(): any {
        return {
            behaviorControllerStatus: this.behaviorController.getStatus(),
            strategiesCount: this.decisionStrategies.size,
            evaluatorsCount: this.decisionEvaluators.size,
            decisionHistorySize: this.decisionHistory.length,
            currentContext: this.currentContext,
            patterns: this.analyzeDecisionPatterns()
        };
    }

    // 重置决策历史
    resetHistory(): void {
        this.decisionHistory = [];
        this.emit('history_reset');
    }

    // 导出决策数据
    exportDecisionData(): any {
        return {
            history: this.decisionHistory.map(d => ({
                ...d,
                parameters: Object.fromEntries(d.parameters)
            })),
            patterns: this.analyzeDecisionPatterns(),
            strategies: Array.from(this.decisionStrategies.keys()),
            evaluators: Array.from(this.decisionEvaluators.keys())
        };
    }

    // 导入决策数据
    importDecisionData(data: any): void {
        if (data.history && Array.isArray(data.history)) {
            this.decisionHistory = data.history.map((d: any) => ({
                ...d,
                parameters: new Map(Object.entries(d.parameters || {}))
            }));
        }
        
        this.emit('data_imported', { recordsCount: this.decisionHistory.length });
    }
}

// 基础决策策略实现
export abstract class BaseDecisionStrategy implements DecisionStrategy {
    public readonly id: string;
    public readonly name: string;
    public readonly description: string;
    public readonly supportedTypes: DecisionType[];

    constructor(
        id: string,
        name: string,
        description: string,
        supportedTypes: DecisionType[]
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.supportedTypes = supportedTypes;
    }

    abstract makeDecision(context: DecisionContext): Promise<DecisionResult>;

    canHandle(type: DecisionType, context: DecisionContext): boolean {
        return this.supportedTypes.includes(type);
    }

    // 辅助方法：创建基础决策结果
    protected createDecisionResult(
        type: DecisionType,
        action: string,
        confidence: number = 0.5,
        reasoning: string[] = []
    ): DecisionResult {
        return {
            type,
            action,
            parameters: new Map(),
            confidence: Math.max(0, Math.min(1, confidence)),
            reasoning,
            alternativeActions: [],
            executionPriority: 1,
            estimatedOutcome: null
        };
    }
}

// 基础决策评估器实现
export abstract class BaseDecisionEvaluator implements DecisionEvaluator {
    abstract evaluateDecision(
        decision: DecisionResult,
        context: DecisionContext
    ): Promise<number>;

    // 辅助方法：基于置信度的基础评分
    protected getBaseScore(decision: DecisionResult): number {
        return decision.confidence * 0.5;
    }

    // 辅助方法：基于个性匹配的评分
    protected getPersonalityScore(
        decision: DecisionResult,
        personality: PlayerPersonality
    ): number {
        // 子类可以重写此方法来实现特定的个性匹配逻辑
        return 0;
    }
}

// 工厂类
export class AIDecisionIntegrationFactory {
    static createBasicIntegration(mode: BehaviorControlMode): AIDecisionIntegration {
        const config = {
            mode,
            tickInterval: 16,
            enableLogging: false,
            enableMetrics: true,
            weights: {
                behaviorTree: 1.0,
                stateMachine: 1.0,
                external: 0.0
            },
            conflictResolution: 'weighted' as const,
            maxExecutionTime: 100
        };

        const behaviorController = new CompositeBehaviorController(config);
        return new AIDecisionIntegration(behaviorController);
    }

    static createAdvancedIntegration(
        behaviorTree: BehaviorTree,
        stateMachine: HierarchicalStateMachine
    ): AIDecisionIntegration {
        const integration = this.createBasicIntegration(BehaviorControlMode.COLLABORATIVE);
        integration['behaviorController'].setBehaviorTree(behaviorTree);
        integration['behaviorController'].setStateMachine(stateMachine);
        return integration;
    }
}