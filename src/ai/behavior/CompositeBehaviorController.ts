/**
 * 复合行为控制器
 * Composite Behavior Controller
 * 
 * 集成行为树和状态机，提供统一的AI行为控制接口
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { BehaviorTree, BehaviorNode, NodeStatus, ExecutionContext, Blackboard } from './BehaviorTree';
import { 
    HierarchicalStateMachine, 
    IState, 
    StateMachineContext, 
    StateTransition, 
    TransitionCondition, 
    TransitionAction 
} from './StateMachine';

// 行为控制模式
export enum BehaviorControlMode {
    BEHAVIOR_TREE_ONLY = 'behavior_tree_only',      // 仅行为树
    STATE_MACHINE_ONLY = 'state_machine_only',      // 仅状态机
    HYBRID_PRIMARY_BT = 'hybrid_primary_bt',        // 混合模式-行为树主导
    HYBRID_PRIMARY_SM = 'hybrid_primary_sm',        // 混合模式-状态机主导
    COLLABORATIVE = 'collaborative'                  // 协作模式
}

// 行为决策权重
export interface BehaviorWeight {
    behaviorTree: number;
    stateMachine: number;
    external: number;
}

// 行为执行结果
export interface BehaviorExecutionResult {
    success: boolean;
    mode: BehaviorControlMode;
    behaviorTreeResult?: NodeStatus;
    stateMachineTransitions?: string[];
    executionTime: number;
    decisionFactors: {
        behaviorTreeContribution: number;
        stateMachineContribution: number;
        finalDecision: any;
    };
}

// 行为控制配置
export interface BehaviorControlConfig {
    mode: BehaviorControlMode;
    tickInterval: number;
    enableLogging: boolean;
    enableMetrics: boolean;
    weights: BehaviorWeight;
    conflictResolution: 'bt_priority' | 'sm_priority' | 'weighted' | 'custom';
    maxExecutionTime: number;
}

// 行为冲突解决器
export interface BehaviorConflictResolver {
    resolve(
        btResult: NodeStatus,
        smTransitions: string[],
        context: BehaviorExecutionContext
    ): any;
}

// 行为执行上下文
export interface BehaviorExecutionContext {
    timestamp: number;
    deltaTime: number;
    agent: any;
    gameState: any;
    behaviorTreeContext: ExecutionContext;
    stateMachineContext: StateMachineContext;
    sharedData: Map<string, any>;
}

// 行为性能指标
export interface BehaviorMetrics {
    totalExecutions: number;
    averageExecutionTime: number;
    behaviorTreeExecutions: number;
    stateMachineExecutions: number;
    conflictResolutions: number;
    errorCount: number;
    lastExecutionTime: number;
}

// 复合行为控制器
export class CompositeBehaviorController extends EventEmitter {
    private behaviorTree: BehaviorTree | null;
    private stateMachine: HierarchicalStateMachine | null;
    private config: BehaviorControlConfig;
    private isRunning: boolean;
    private context: BehaviorExecutionContext;
    private conflictResolver: BehaviorConflictResolver | null;
    private metrics: BehaviorMetrics;
    private executionHistory: BehaviorExecutionResult[];
    private maxHistorySize: number;

    constructor(config: BehaviorControlConfig) {
        super();
        this.behaviorTree = null;
        this.stateMachine = null;
        this.config = { ...config };
        this.isRunning = false;
        this.conflictResolver = null;
        this.maxHistorySize = 100;

        // 初始化上下文
        this.context = {
            timestamp: 0,
            deltaTime: 0,
            agent: null,
            gameState: null,
            behaviorTreeContext: {
                blackboard: new Blackboard(),
                timestamp: 0,
                deltaTime: 0,
                agent: null,
                gameState: null
            },
            stateMachineContext: {
                data: new Map(),
                timestamp: 0,
                deltaTime: 0,
                agent: null,
                gameState: null
            },
            sharedData: new Map()
        };

        // 初始化性能指标
        this.metrics = {
            totalExecutions: 0,
            averageExecutionTime: 0,
            behaviorTreeExecutions: 0,
            stateMachineExecutions: 0,
            conflictResolutions: 0,
            errorCount: 0,
            lastExecutionTime: 0
        };

        this.executionHistory = [];
    }

    // 设置行为树
    setBehaviorTree(behaviorTree: BehaviorTree): void {
        this.behaviorTree = behaviorTree;
        
        // 连接行为树事件
        if (this.behaviorTree) {
            this.behaviorTree.on('node_started', (event) => {
                this.emit('behavior_tree_node_started', event);
            });
            this.behaviorTree.on('node_completed', (event) => {
                this.emit('behavior_tree_node_completed', event);
            });
            this.behaviorTree.on('tree_completed', (event) => {
                this.emit('behavior_tree_completed', event);
            });
        }
    }

    // 设置状态机
    setStateMachine(stateMachine: HierarchicalStateMachine): void {
        this.stateMachine = stateMachine;
        
        // 连接状态机事件
        if (this.stateMachine) {
            this.stateMachine.on('state_entered', (event) => {
                this.emit('state_machine_state_entered', event);
            });
            this.stateMachine.on('state_exited', (event) => {
                this.emit('state_machine_state_exited', event);
            });
            this.stateMachine.on('transition_executed', (event) => {
                this.emit('state_machine_transition', event);
            });
        }
    }

    // 设置冲突解决器
    setConflictResolver(resolver: BehaviorConflictResolver): void {
        this.conflictResolver = resolver;
    }

    // 启动控制器
    async start(agent: any, gameState: any): Promise<void> {
        if (this.isRunning) {
            return;
        }

        this.context.agent = agent;
        this.context.gameState = gameState;
        this.context.timestamp = Date.now();
        this.context.deltaTime = 0;

        // 同步上下文到子系统
        this.syncContexts();

        this.isRunning = true;

        // 启动子系统
        if (this.behaviorTree && this.shouldUseBehaviorTree()) {
            this.behaviorTree.start();
        }

        if (this.stateMachine && this.shouldUseStateMachine()) {
            await this.stateMachine.start(agent, gameState);
        }

        this.emit('controller_started');
        
        // 启动执行循环
        this.startExecutionLoop();
    }

    // 停止控制器
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        // 停止子系统
        if (this.behaviorTree) {
            this.behaviorTree.stop();
        }

        if (this.stateMachine) {
            await this.stateMachine.stop();
        }

        this.emit('controller_stopped');
    }

    // 执行一次行为更新
    async tick(deltaTime: number): Promise<BehaviorExecutionResult> {
        const startTime = performance.now();
        
        try {
            // 更新上下文
            this.updateContext(deltaTime);

            // 根据模式执行行为
            const result = await this.executeBehavior();
            
            // 更新性能指标
            const executionTime = performance.now() - startTime;
            this.updateMetrics(executionTime);
            
            // 记录执行历史
            this.addToHistory(result);

            return result;

        } catch (error) {
            this.metrics.errorCount++;
            this.emit('execution_error', error);
            
            return {
                success: false,
                mode: this.config.mode,
                executionTime: performance.now() - startTime,
                decisionFactors: {
                    behaviorTreeContribution: 0,
                    stateMachineContribution: 0,
                    finalDecision: null
                }
            };
        }
    }

    // 执行行为逻辑
    private async executeBehavior(): Promise<BehaviorExecutionResult> {
        const result: BehaviorExecutionResult = {
            success: true,
            mode: this.config.mode,
            executionTime: 0,
            decisionFactors: {
                behaviorTreeContribution: 0,
                stateMachineContribution: 0,
                finalDecision: null
            }
        };

        switch (this.config.mode) {
            case BehaviorControlMode.BEHAVIOR_TREE_ONLY:
                result.behaviorTreeResult = await this.executeBehaviorTreeOnly();
                result.decisionFactors.behaviorTreeContribution = 1.0;
                result.decisionFactors.finalDecision = result.behaviorTreeResult;
                break;

            case BehaviorControlMode.STATE_MACHINE_ONLY:
                result.stateMachineTransitions = await this.executeStateMachineOnly();
                result.decisionFactors.stateMachineContribution = 1.0;
                result.decisionFactors.finalDecision = result.stateMachineTransitions;
                break;

            case BehaviorControlMode.HYBRID_PRIMARY_BT:
                result = await this.executeHybridBehaviorTreePrimary();
                break;

            case BehaviorControlMode.HYBRID_PRIMARY_SM:
                result = await this.executeHybridStateMachinePrimary();
                break;

            case BehaviorControlMode.COLLABORATIVE:
                result = await this.executeCollaborative();
                break;

            default:
                throw new Error(`Unsupported behavior control mode: ${this.config.mode}`);
        }

        return result;
    }

    // 仅执行行为树
    private async executeBehaviorTreeOnly(): Promise<NodeStatus> {
        if (!this.behaviorTree) {
            throw new Error('Behavior tree not configured');
        }

        const result = await this.behaviorTree.tick(this.context.deltaTime);
        this.metrics.behaviorTreeExecutions++;
        return result;
    }

    // 仅执行状态机
    private async executeStateMachineOnly(): Promise<string[]> {
        if (!this.stateMachine) {
            throw new Error('State machine not configured');
        }

        const beforeStates = this.stateMachine.getCurrentStates().map(s => s.id);
        await this.stateMachine.update(this.context.deltaTime);
        const afterStates = this.stateMachine.getCurrentStates().map(s => s.id);
        
        this.metrics.stateMachineExecutions++;
        
        // 返回状态变化
        const transitions = afterStates.filter(state => !beforeStates.includes(state));
        return transitions;
    }

    // 混合模式-行为树主导
    private async executeHybridBehaviorTreePrimary(): Promise<BehaviorExecutionResult> {
        const btResult = await this.executeBehaviorTreeOnly();
        const smTransitions = await this.executeStateMachineOnly();

        // 行为树结果优先，状态机作为辅助
        const btWeight = this.config.weights.behaviorTree;
        const smWeight = this.config.weights.stateMachine;

        let finalDecision = btResult;
        
        // 如果行为树失败且状态机有转换，考虑状态机结果
        if (btResult === NodeStatus.FAILURE && smTransitions.length > 0) {
            finalDecision = this.resolveBehaviorConflict(btResult, smTransitions);
        }

        return {
            success: true,
            mode: this.config.mode,
            behaviorTreeResult: btResult,
            stateMachineTransitions: smTransitions,
            executionTime: 0,
            decisionFactors: {
                behaviorTreeContribution: btWeight / (btWeight + smWeight),
                stateMachineContribution: smWeight / (btWeight + smWeight),
                finalDecision
            }
        };
    }

    // 混合模式-状态机主导
    private async executeHybridStateMachinePrimary(): Promise<BehaviorExecutionResult> {
        const smTransitions = await this.executeStateMachineOnly();
        const btResult = await this.executeBehaviorTreeOnly();

        // 状态机结果优先，行为树作为辅助
        const btWeight = this.config.weights.behaviorTree;
        const smWeight = this.config.weights.stateMachine;

        let finalDecision = smTransitions.length > 0 ? smTransitions : btResult;

        return {
            success: true,
            mode: this.config.mode,
            behaviorTreeResult: btResult,
            stateMachineTransitions: smTransitions,
            executionTime: 0,
            decisionFactors: {
                behaviorTreeContribution: btWeight / (btWeight + smWeight),
                stateMachineContribution: smWeight / (btWeight + smWeight),
                finalDecision
            }
        };
    }

    // 协作模式
    private async executeCollaborative(): Promise<BehaviorExecutionResult> {
        const [btResult, smTransitions] = await Promise.all([
            this.executeBehaviorTreeOnly(),
            this.executeStateMachineOnly()
        ]);

        // 使用权重和冲突解决器来融合结果
        const finalDecision = this.resolveBehaviorConflict(btResult, smTransitions);

        const btWeight = this.config.weights.behaviorTree;
        const smWeight = this.config.weights.stateMachine;
        const totalWeight = btWeight + smWeight;

        return {
            success: true,
            mode: this.config.mode,
            behaviorTreeResult: btResult,
            stateMachineTransitions: smTransitions,
            executionTime: 0,
            decisionFactors: {
                behaviorTreeContribution: btWeight / totalWeight,
                stateMachineContribution: smWeight / totalWeight,
                finalDecision
            }
        };
    }

    // 解决行为冲突
    private resolveBehaviorConflict(btResult: NodeStatus, smTransitions: string[]): any {
        this.metrics.conflictResolutions++;

        // 使用自定义冲突解决器
        if (this.conflictResolver) {
            return this.conflictResolver.resolve(btResult, smTransitions, this.context);
        }

        // 使用默认冲突解决策略
        switch (this.config.conflictResolution) {
            case 'bt_priority':
                return btResult;
            
            case 'sm_priority':
                return smTransitions.length > 0 ? smTransitions : btResult;
            
            case 'weighted':
                const btWeight = this.config.weights.behaviorTree;
                const smWeight = this.config.weights.stateMachine;
                return btWeight >= smWeight ? btResult : smTransitions;
            
            default:
                return btResult;
        }
    }

    // 更新上下文
    private updateContext(deltaTime: number): void {
        const currentTime = Date.now();
        this.context.timestamp = currentTime;
        this.context.deltaTime = deltaTime;

        // 同步到子系统上下文
        this.syncContexts();
    }

    // 同步上下文到子系统
    private syncContexts(): void {
        // 同步行为树上下文
        this.context.behaviorTreeContext.timestamp = this.context.timestamp;
        this.context.behaviorTreeContext.deltaTime = this.context.deltaTime;
        this.context.behaviorTreeContext.agent = this.context.agent;
        this.context.behaviorTreeContext.gameState = this.context.gameState;

        // 同步状态机上下文
        this.context.stateMachineContext.timestamp = this.context.timestamp;
        this.context.stateMachineContext.deltaTime = this.context.deltaTime;
        this.context.stateMachineContext.agent = this.context.agent;
        this.context.stateMachineContext.gameState = this.context.gameState;

        // 同步共享数据
        for (const [key, value] of this.context.sharedData) {
            this.context.behaviorTreeContext.blackboard.setValue(key, value);
            this.context.stateMachineContext.data.set(key, value);
        }
    }

    // 启动执行循环
    private startExecutionLoop(): void {
        let lastTime = Date.now();

        const loop = async () => {
            if (!this.isRunning) {
                return;
            }

            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            try {
                await this.tick(deltaTime);
            } catch (error) {
                this.emit('loop_error', error);
            }

            if (this.isRunning) {
                setTimeout(loop, this.config.tickInterval);
            }
        };

        loop();
    }

    // 更新性能指标
    private updateMetrics(executionTime: number): void {
        this.metrics.totalExecutions++;
        this.metrics.lastExecutionTime = executionTime;
        
        // 计算平均执行时间
        this.metrics.averageExecutionTime = 
            (this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + executionTime) 
            / this.metrics.totalExecutions;
    }

    // 添加到执行历史
    private addToHistory(result: BehaviorExecutionResult): void {
        this.executionHistory.push(result);
        
        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory.shift();
        }
    }

    // 检查是否应该使用行为树
    private shouldUseBehaviorTree(): boolean {
        return this.config.mode !== BehaviorControlMode.STATE_MACHINE_ONLY;
    }

    // 检查是否应该使用状态机
    private shouldUseStateMachine(): boolean {
        return this.config.mode !== BehaviorControlMode.BEHAVIOR_TREE_ONLY;
    }

    // 获取当前状态
    getStatus(): any {
        return {
            isRunning: this.isRunning,
            mode: this.config.mode,
            hasBehaviorTree: this.behaviorTree !== null,
            hasStateMachine: this.stateMachine !== null,
            metrics: { ...this.metrics },
            currentBehaviorTreeStatus: this.behaviorTree ? this.behaviorTree.getCurrentStatus() : null,
            currentStateMachineStates: this.stateMachine ? this.stateMachine.getCurrentStates().map(s => s.id) : []
        };
    }

    // 获取性能指标
    getMetrics(): BehaviorMetrics {
        return { ...this.metrics };
    }

    // 获取执行历史
    getExecutionHistory(): BehaviorExecutionResult[] {
        return [...this.executionHistory];
    }

    // 设置共享数据
    setSharedData<T>(key: string, value: T): void {
        this.context.sharedData.set(key, value);
        
        // 立即同步到子系统
        if (this.behaviorTree) {
            this.context.behaviorTreeContext.blackboard.setValue(key, value);
        }
        if (this.stateMachine) {
            this.context.stateMachineContext.data.set(key, value);
        }
    }

    // 获取共享数据
    getSharedData<T>(key: string): T | undefined {
        return this.context.sharedData.get(key);
    }

    // 删除共享数据
    deleteSharedData(key: string): void {
        this.context.sharedData.delete(key);
        
        // 从子系统中删除
        if (this.behaviorTree) {
            this.context.behaviorTreeContext.blackboard.deleteValue(key);
        }
        if (this.stateMachine) {
            this.context.stateMachineContext.data.delete(key);
        }
    }

    // 重置性能指标
    resetMetrics(): void {
        this.metrics = {
            totalExecutions: 0,
            averageExecutionTime: 0,
            behaviorTreeExecutions: 0,
            stateMachineExecutions: 0,
            conflictResolutions: 0,
            errorCount: 0,
            lastExecutionTime: 0
        };
    }

    // 清除执行历史
    clearHistory(): void {
        this.executionHistory = [];
    }

    // 更新配置
    updateConfig(newConfig: Partial<BehaviorControlConfig>): void {
        this.config = { ...this.config, ...newConfig };
        
        // 如果tick间隔改变了，通知子系统
        if (newConfig.tickInterval && this.stateMachine) {
            this.stateMachine.setTickInterval(newConfig.tickInterval);
        }
    }

    // 验证配置
    validateConfiguration(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 检查必要的组件
        if (this.shouldUseBehaviorTree() && !this.behaviorTree) {
            errors.push('Behavior tree required for current mode but not configured');
        }

        if (this.shouldUseStateMachine() && !this.stateMachine) {
            errors.push('State machine required for current mode but not configured');
        }

        // 检查权重
        const totalWeight = this.config.weights.behaviorTree + this.config.weights.stateMachine;
        if (totalWeight <= 0) {
            errors.push('Total behavior weights must be greater than 0');
        }

        // 验证子系统
        if (this.stateMachine) {
            const smValidation = this.stateMachine.validate();
            if (!smValidation.isValid) {
                errors.push(...smValidation.errors.map(e => `State machine: ${e}`));
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // 获取诊断信息
    getDiagnostics(): any {
        return {
            config: this.config,
            status: this.getStatus(),
            validation: this.validateConfiguration(),
            recentHistory: this.executionHistory.slice(-10),
            contextInfo: {
                sharedDataSize: this.context.sharedData.size,
                lastUpdate: this.context.timestamp,
                deltaTime: this.context.deltaTime
            }
        };
    }
}

// 默认冲突解决器实现
export class DefaultBehaviorConflictResolver implements BehaviorConflictResolver {
    resolve(
        btResult: NodeStatus,
        smTransitions: string[],
        context: BehaviorExecutionContext
    ): any {
        // 简单的默认策略：成功优先，然后是运行中，最后是失败
        if (btResult === NodeStatus.SUCCESS) {
            return btResult;
        }
        
        if (smTransitions.length > 0) {
            return smTransitions;
        }
        
        return btResult;
    }
}

// 工厂类 - 便于创建复合行为控制器
export class CompositeBehaviorControllerFactory {
    static createBasicController(mode: BehaviorControlMode): CompositeBehaviorController {
        const config: BehaviorControlConfig = {
            mode,
            tickInterval: 16, // ~60fps
            enableLogging: false,
            enableMetrics: true,
            weights: {
                behaviorTree: 1.0,
                stateMachine: 1.0,
                external: 0.0
            },
            conflictResolution: 'weighted',
            maxExecutionTime: 100
        };

        return new CompositeBehaviorController(config);
    }

    static createBehaviorTreeController(): CompositeBehaviorController {
        return this.createBasicController(BehaviorControlMode.BEHAVIOR_TREE_ONLY);
    }

    static createStateMachineController(): CompositeBehaviorController {
        return this.createBasicController(BehaviorControlMode.STATE_MACHINE_ONLY);
    }

    static createHybridController(primaryMode: 'bt' | 'sm' = 'bt'): CompositeBehaviorController {
        const mode = primaryMode === 'bt' 
            ? BehaviorControlMode.HYBRID_PRIMARY_BT 
            : BehaviorControlMode.HYBRID_PRIMARY_SM;
        
        return this.createBasicController(mode);
    }

    static createCollaborativeController(): CompositeBehaviorController {
        const controller = this.createBasicController(BehaviorControlMode.COLLABORATIVE);
        controller.setConflictResolver(new DefaultBehaviorConflictResolver());
        return controller;
    }
}