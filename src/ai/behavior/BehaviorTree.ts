/**
 * AI行为树系统
 * AI Behavior Tree System
 * 
 * 实现复杂的AI行为控制，包括各种行为节点类型和执行逻辑
 */

import { EventEmitter } from '../../utils/EventEmitter';

// 行为节点状态
export enum NodeStatus {
    SUCCESS = 'success',
    FAILURE = 'failure',
    RUNNING = 'running',
    INVALID = 'invalid'
}

// 行为节点类型
export enum NodeType {
    // 控制节点
    SEQUENCE = 'sequence',           // 顺序执行
    SELECTOR = 'selector',           // 选择执行
    PARALLEL = 'parallel',           // 并行执行
    DECORATOR = 'decorator',         // 装饰器
    
    // 叶子节点
    ACTION = 'action',               // 动作节点
    CONDITION = 'condition',         // 条件节点
    
    // 特殊节点
    INVERTER = 'inverter',           // 反转器
    REPEATER = 'repeater',           // 重复器
    RETRY = 'retry',                 // 重试器
    TIMEOUT = 'timeout',             // 超时器
    COOLDOWN = 'cooldown',           // 冷却器
    RANDOM = 'random',               // 随机选择器
    WEIGHTED = 'weighted'            // 权重选择器
}

// 黑板数据类型
export interface BlackboardData {
    [key: string]: any;
}

// 黑板系统
export class Blackboard {
    private data: BlackboardData;
    private subscribers: Map<string, Set<(value: any) => void>>;
    
    constructor() {
        this.data = {};
        this.subscribers = new Map();
    }
    
    // 获取数据
    get<T = any>(key: string): T | undefined {
        return this.data[key];
    }
    
    // 设置数据
    set<T = any>(key: string, value: T): void {
        const oldValue = this.data[key];
        this.data[key] = value;
        
        // 通知订阅者
        if (oldValue !== value) {
            this.notifySubscribers(key, value);
        }
    }
    
    // 删除数据
    delete(key: string): void {
        delete this.data[key];
        this.notifySubscribers(key, undefined);
    }
    
    // 检查是否存在
    has(key: string): boolean {
        return key in this.data;
    }
    
    // 订阅数据变化
    subscribe(key: string, callback: (value: any) => void): void {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key)!.add(callback);
    }
    
    // 取消订阅
    unsubscribe(key: string, callback: (value: any) => void): void {
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.subscribers.delete(key);
            }
        }
    }
    
    // 通知订阅者
    private notifySubscribers(key: string, value: any): void {
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
            callbacks.forEach(callback => callback(value));
        }
    }
    
    // 清空黑板
    clear(): void {
        this.data = {};
        this.subscribers.clear();
    }
    
    // 获取所有数据
    getAll(): BlackboardData {
        return { ...this.data };
    }
}

// 执行上下文
export interface ExecutionContext {
    blackboard: Blackboard;
    deltaTime: number;
    timestamp: number;
    agent: any; // AI智能体引用
    gameState: any; // 游戏状态引用
}

// 行为节点基类
export abstract class BehaviorNode extends EventEmitter {
    public readonly id: string;
    public readonly type: NodeType;
    public name: string;
    public parent: BehaviorNode | null;
    public children: BehaviorNode[];
    
    protected status: NodeStatus;
    protected startTime: number;
    protected lastExecutionTime: number;
    
    constructor(id: string, type: NodeType, name?: string) {
        super();
        this.id = id;
        this.type = type;
        this.name = name || id;
        this.parent = null;
        this.children = [];
        this.status = NodeStatus.INVALID;
        this.startTime = 0;
        this.lastExecutionTime = 0;
    }
    
    // 执行节点
    async execute(context: ExecutionContext): Promise<NodeStatus> {
        this.lastExecutionTime = context.timestamp;
        
        if (this.status !== NodeStatus.RUNNING) {
            this.startTime = context.timestamp;
            this.onStart(context);
        }
        
        this.status = await this.onExecute(context);
        
        if (this.status !== NodeStatus.RUNNING) {
            this.onEnd(context);
        }
        
        this.emit('status_changed', {
            node: this,
            status: this.status,
            timestamp: context.timestamp
        });
        
        return this.status;
    }
    
    // 重置节点
    reset(): void {
        this.status = NodeStatus.INVALID;
        this.startTime = 0;
        this.children.forEach(child => child.reset());
        this.onReset();
    }
    
    // 添加子节点
    addChild(child: BehaviorNode): void {
        child.parent = this;
        this.children.push(child);
    }
    
    // 移除子节点
    removeChild(child: BehaviorNode): void {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }
    
    // 获取状态
    getStatus(): NodeStatus {
        return this.status;
    }
    
    // 获取执行时间
    getExecutionTime(currentTime: number): number {
        return this.status === NodeStatus.RUNNING ? currentTime - this.startTime : 0;
    }
    
    // 抽象方法 - 子类必须实现
    protected abstract onExecute(context: ExecutionContext): Promise<NodeStatus>;
    
    // 生命周期方法 - 子类可选实现
    protected onStart(context: ExecutionContext): void {}
    protected onEnd(context: ExecutionContext): void {}
    protected onReset(): void {}
    
    // 获取节点信息
    getNodeInfo(): any {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            status: this.status,
            childCount: this.children.length,
            executionTime: this.lastExecutionTime - this.startTime
        };
    }
}

// 顺序节点 - 按顺序执行所有子节点
export class SequenceNode extends BehaviorNode {
    private currentChildIndex: number;
    
    constructor(id: string, name?: string) {
        super(id, NodeType.SEQUENCE, name);
        this.currentChildIndex = 0;
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        while (this.currentChildIndex < this.children.length) {
            const child = this.children[this.currentChildIndex];
            const childStatus = await child.execute(context);
            
            switch (childStatus) {
                case NodeStatus.SUCCESS:
                    this.currentChildIndex++;
                    break;
                case NodeStatus.FAILURE:
                    return NodeStatus.FAILURE;
                case NodeStatus.RUNNING:
                    return NodeStatus.RUNNING;
            }
        }
        
        return NodeStatus.SUCCESS;
    }
    
    protected onStart(context: ExecutionContext): void {
        this.currentChildIndex = 0;
    }
    
    protected onReset(): void {
        this.currentChildIndex = 0;
    }
}

// 选择器节点 - 按顺序尝试子节点直到一个成功
export class SelectorNode extends BehaviorNode {
    private currentChildIndex: number;
    
    constructor(id: string, name?: string) {
        super(id, NodeType.SELECTOR, name);
        this.currentChildIndex = 0;
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        while (this.currentChildIndex < this.children.length) {
            const child = this.children[this.currentChildIndex];
            const childStatus = await child.execute(context);
            
            switch (childStatus) {
                case NodeStatus.SUCCESS:
                    return NodeStatus.SUCCESS;
                case NodeStatus.FAILURE:
                    this.currentChildIndex++;
                    break;
                case NodeStatus.RUNNING:
                    return NodeStatus.RUNNING;
            }
        }
        
        return NodeStatus.FAILURE;
    }
    
    protected onStart(context: ExecutionContext): void {
        this.currentChildIndex = 0;
    }
    
    protected onReset(): void {
        this.currentChildIndex = 0;
    }
}

// 并行节点 - 同时执行所有子节点
export class ParallelNode extends BehaviorNode {
    private policy: 'require_all' | 'require_one';
    private childStatuses: NodeStatus[];
    
    constructor(id: string, policy: 'require_all' | 'require_one' = 'require_all', name?: string) {
        super(id, NodeType.PARALLEL, name);
        this.policy = policy;
        this.childStatuses = [];
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        // 并行执行所有子节点
        const promises = this.children.map(child => child.execute(context));
        this.childStatuses = await Promise.all(promises);
        
        const successCount = this.childStatuses.filter(status => status === NodeStatus.SUCCESS).length;
        const failureCount = this.childStatuses.filter(status => status === NodeStatus.FAILURE).length;
        const runningCount = this.childStatuses.filter(status => status === NodeStatus.RUNNING).length;
        
        if (this.policy === 'require_all') {
            if (successCount === this.children.length) {
                return NodeStatus.SUCCESS;
            } else if (failureCount > 0) {
                return NodeStatus.FAILURE;
            } else {
                return NodeStatus.RUNNING;
            }
        } else { // require_one
            if (successCount > 0) {
                return NodeStatus.SUCCESS;
            } else if (failureCount === this.children.length) {
                return NodeStatus.FAILURE;
            } else {
                return NodeStatus.RUNNING;
            }
        }
    }
    
    protected onStart(context: ExecutionContext): void {
        this.childStatuses = [];
    }
}

// 装饰器节点基类
export abstract class DecoratorNode extends BehaviorNode {
    constructor(id: string, name?: string) {
        super(id, NodeType.DECORATOR, name);
    }
    
    // 装饰器只能有一个子节点
    addChild(child: BehaviorNode): void {
        if (this.children.length > 0) {
            throw new Error('Decorator node can only have one child');
        }
        super.addChild(child);
    }
    
    protected getChild(): BehaviorNode | null {
        return this.children.length > 0 ? this.children[0] : null;
    }
}

// 反转器 - 反转子节点的结果
export class InverterNode extends DecoratorNode {
    constructor(id: string, name?: string) {
        super(id, name || 'Inverter');
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        const child = this.getChild();
        if (!child) {
            return NodeStatus.FAILURE;
        }
        
        const childStatus = await child.execute(context);
        
        switch (childStatus) {
            case NodeStatus.SUCCESS:
                return NodeStatus.FAILURE;
            case NodeStatus.FAILURE:
                return NodeStatus.SUCCESS;
            case NodeStatus.RUNNING:
                return NodeStatus.RUNNING;
            default:
                return NodeStatus.FAILURE;
        }
    }
}

// 重复器 - 重复执行子节点
export class RepeaterNode extends DecoratorNode {
    private maxRepeats: number;
    private currentRepeats: number;
    
    constructor(id: string, maxRepeats: number = -1, name?: string) {
        super(id, name || 'Repeater');
        this.maxRepeats = maxRepeats; // -1 表示无限重复
        this.currentRepeats = 0;
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        const child = this.getChild();
        if (!child) {
            return NodeStatus.FAILURE;
        }
        
        const childStatus = await child.execute(context);
        
        if (childStatus === NodeStatus.RUNNING) {
            return NodeStatus.RUNNING;
        }
        
        this.currentRepeats++;
        
        if (this.maxRepeats > 0 && this.currentRepeats >= this.maxRepeats) {
            return childStatus;
        }
        
        // 重置子节点并继续执行
        child.reset();
        return NodeStatus.RUNNING;
    }
    
    protected onStart(context: ExecutionContext): void {
        this.currentRepeats = 0;
    }
    
    protected onReset(): void {
        this.currentRepeats = 0;
    }
}

// 重试器 - 失败时重试子节点
export class RetryNode extends DecoratorNode {
    private maxRetries: number;
    private currentRetries: number;
    
    constructor(id: string, maxRetries: number = 3, name?: string) {
        super(id, name || 'Retry');
        this.maxRetries = maxRetries;
        this.currentRetries = 0;
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        const child = this.getChild();
        if (!child) {
            return NodeStatus.FAILURE;
        }
        
        const childStatus = await child.execute(context);
        
        switch (childStatus) {
            case NodeStatus.SUCCESS:
                return NodeStatus.SUCCESS;
            case NodeStatus.RUNNING:
                return NodeStatus.RUNNING;
            case NodeStatus.FAILURE:
                this.currentRetries++;
                if (this.currentRetries >= this.maxRetries) {
                    return NodeStatus.FAILURE;
                }
                // 重置子节点并重试
                child.reset();
                return NodeStatus.RUNNING;
            default:
                return NodeStatus.FAILURE;
        }
    }
    
    protected onStart(context: ExecutionContext): void {
        this.currentRetries = 0;
    }
    
    protected onReset(): void {
        this.currentRetries = 0;
    }
}

// 超时器 - 限制子节点执行时间
export class TimeoutNode extends DecoratorNode {
    private timeoutMs: number;
    
    constructor(id: string, timeoutMs: number, name?: string) {
        super(id, name || 'Timeout');
        this.timeoutMs = timeoutMs;
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        const child = this.getChild();
        if (!child) {
            return NodeStatus.FAILURE;
        }
        
        const elapsed = context.timestamp - this.startTime;
        if (elapsed >= this.timeoutMs) {
            return NodeStatus.FAILURE;
        }
        
        const childStatus = await child.execute(context);
        
        if (childStatus === NodeStatus.RUNNING) {
            const newElapsed = context.timestamp - this.startTime;
            if (newElapsed >= this.timeoutMs) {
                return NodeStatus.FAILURE;
            }
        }
        
        return childStatus;
    }
}

// 冷却器 - 在冷却时间内返回失败
export class CooldownNode extends DecoratorNode {
    private cooldownMs: number;
    private lastSuccessTime: number;
    
    constructor(id: string, cooldownMs: number, name?: string) {
        super(id, name || 'Cooldown');
        this.cooldownMs = cooldownMs;
        this.lastSuccessTime = 0;
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        const child = this.getChild();
        if (!child) {
            return NodeStatus.FAILURE;
        }
        
        // 检查是否在冷却期内
        const elapsed = context.timestamp - this.lastSuccessTime;
        if (elapsed < this.cooldownMs) {
            return NodeStatus.FAILURE;
        }
        
        const childStatus = await child.execute(context);
        
        if (childStatus === NodeStatus.SUCCESS) {
            this.lastSuccessTime = context.timestamp;
        }
        
        return childStatus;
    }
}

// 随机选择器 - 随机选择一个子节点执行
export class RandomSelectorNode extends BehaviorNode {
    private selectedChildIndex: number;
    
    constructor(id: string, name?: string) {
        super(id, NodeType.RANDOM, name || 'Random Selector');
        this.selectedChildIndex = -1;
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        if (this.children.length === 0) {
            return NodeStatus.FAILURE;
        }
        
        if (this.selectedChildIndex === -1) {
            this.selectedChildIndex = Math.floor(Math.random() * this.children.length);
        }
        
        const child = this.children[this.selectedChildIndex];
        return await child.execute(context);
    }
    
    protected onStart(context: ExecutionContext): void {
        this.selectedChildIndex = -1;
    }
    
    protected onReset(): void {
        this.selectedChildIndex = -1;
    }
}

// 权重选择器 - 根据权重选择子节点
export class WeightedSelectorNode extends BehaviorNode {
    private weights: number[];
    private selectedChildIndex: number;
    
    constructor(id: string, weights: number[], name?: string) {
        super(id, NodeType.WEIGHTED, name || 'Weighted Selector');
        this.weights = weights;
        this.selectedChildIndex = -1;
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        if (this.children.length === 0 || this.weights.length !== this.children.length) {
            return NodeStatus.FAILURE;
        }
        
        if (this.selectedChildIndex === -1) {
            this.selectedChildIndex = this.selectWeightedChild();
        }
        
        const child = this.children[this.selectedChildIndex];
        return await child.execute(context);
    }
    
    private selectWeightedChild(): number {
        const totalWeight = this.weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < this.weights.length; i++) {
            random -= this.weights[i];
            if (random <= 0) {
                return i;
            }
        }
        
        return this.weights.length - 1;
    }
    
    protected onStart(context: ExecutionContext): void {
        this.selectedChildIndex = -1;
    }
    
    protected onReset(): void {
        this.selectedChildIndex = -1;
    }
    
    // 更新权重
    updateWeights(weights: number[]): void {
        if (weights.length === this.children.length) {
            this.weights = [...weights];
        }
    }
}

// 动作节点基类
export abstract class ActionNode extends BehaviorNode {
    constructor(id: string, name?: string) {
        super(id, NodeType.ACTION, name);
    }
    
    protected abstract onExecute(context: ExecutionContext): Promise<NodeStatus>;
}

// 条件节点基类
export abstract class ConditionNode extends BehaviorNode {
    constructor(id: string, name?: string) {
        super(id, NodeType.CONDITION, name);
    }
    
    protected async onExecute(context: ExecutionContext): Promise<NodeStatus> {
        return this.checkCondition(context) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
    }
    
    protected abstract checkCondition(context: ExecutionContext): boolean;
}

// 行为树
export class BehaviorTree extends EventEmitter {
    private root: BehaviorNode | null;
    private blackboard: Blackboard;
    private isRunning: boolean;
    private tickInterval: number;
    private lastTickTime: number;
    
    constructor() {
        super();
        this.root = null;
        this.blackboard = new Blackboard();
        this.isRunning = false;
        this.tickInterval = 16; // ~60fps
        this.lastTickTime = 0;
    }
    
    // 设置根节点
    setRoot(root: BehaviorNode): void {
        this.root = root;
    }
    
    // 获取根节点
    getRoot(): BehaviorNode | null {
        return this.root;
    }
    
    // 获取黑板
    getBlackboard(): Blackboard {
        return this.blackboard;
    }
    
    // 执行一次tick
    async tick(agent: any, gameState: any, deltaTime: number = 16): Promise<NodeStatus> {
        if (!this.root) {
            return NodeStatus.FAILURE;
        }
        
        const context: ExecutionContext = {
            blackboard: this.blackboard,
            deltaTime,
            timestamp: Date.now(),
            agent,
            gameState
        };
        
        const status = await this.root.execute(context);
        this.lastTickTime = context.timestamp;
        
        this.emit('tick_completed', {
            status,
            timestamp: context.timestamp,
            deltaTime
        });
        
        return status;
    }
    
    // 重置行为树
    reset(): void {
        if (this.root) {
            this.root.reset();
        }
        this.blackboard.clear();
        this.emit('tree_reset');
    }
    
    // 启动自动执行
    start(agent: any, gameState: any): void {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.emit('tree_started');
        
        const runLoop = async () => {
            if (!this.isRunning) {
                return;
            }
            
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastTickTime;
            
            try {
                await this.tick(agent, gameState, deltaTime);
            } catch (error) {
                this.emit('execution_error', error);
            }
            
            if (this.isRunning) {
                setTimeout(runLoop, this.tickInterval);
            }
        };
        
        runLoop();
    }
    
    // 停止自动执行
    stop(): void {
        this.isRunning = false;
        this.emit('tree_stopped');
    }
    
    // 是否正在运行
    getIsRunning(): boolean {
        return this.isRunning;
    }
    
    // 设置tick间隔
    setTickInterval(intervalMs: number): void {
        this.tickInterval = Math.max(1, intervalMs);
    }
    
    // 获取树的状态信息
    getTreeInfo(): any {
        return {
            hasRoot: this.root !== null,
            isRunning: this.isRunning,
            tickInterval: this.tickInterval,
            lastTickTime: this.lastTickTime,
            blackboardSize: Object.keys(this.blackboard.getAll()).length
        };
    }
    
    // 遍历所有节点
    traverseNodes(callback: (node: BehaviorNode, depth: number) => void): void {
        if (!this.root) {
            return;
        }
        
        const traverse = (node: BehaviorNode, depth: number) => {
            callback(node, depth);
            node.children.forEach(child => traverse(child, depth + 1));
        };
        
        traverse(this.root, 0);
    }
    
    // 查找节点
    findNode(id: string): BehaviorNode | null {
        if (!this.root) {
            return null;
        }
        
        const search = (node: BehaviorNode): BehaviorNode | null => {
            if (node.id === id) {
                return node;
            }
            
            for (const child of node.children) {
                const found = search(child);
                if (found) {
                    return found;
                }
            }
            
            return null;
        };
        
        return search(this.root);
    }
    
    // 获取所有节点
    getAllNodes(): BehaviorNode[] {
        const nodes: BehaviorNode[] = [];
        this.traverseNodes((node) => nodes.push(node));
        return nodes;
    }
}