/**
 * AI状态机系统
 * AI State Machine System
 * 
 * 实现分层状态机、状态转换、状态组合等复杂状态管理功能
 */

import { EventEmitter } from '../../utils/EventEmitter';

// 状态类型
export enum StateType {
    SIMPLE = 'simple',           // 简单状态
    COMPOSITE = 'composite',     // 复合状态
    PARALLEL = 'parallel',       // 并行状态
    HISTORY = 'history',         // 历史状态
    FINAL = 'final'             // 终结状态
}

// 转换类型
export enum TransitionType {
    EXTERNAL = 'external',       // 外部转换
    INTERNAL = 'internal',       // 内部转换
    LOCAL = 'local'             // 本地转换
}

// 状态机上下文
export interface StateMachineContext {
    data: Map<string, any>;
    timestamp: number;
    deltaTime: number;
    agent: any;
    gameState: any;
}

// 转换条件
export interface TransitionCondition {
    id: string;
    name: string;
    check: (context: StateMachineContext) => boolean;
    priority: number;
}

// 转换动作
export interface TransitionAction {
    id: string;
    name: string;
    execute: (context: StateMachineContext) => Promise<void> | void;
}

// 状态转换
export interface StateTransition {
    id: string;
    from: string;
    to: string;
    type: TransitionType;
    conditions: TransitionCondition[];
    actions: TransitionAction[];
    guards: TransitionCondition[];
    priority: number;
    enabled: boolean;
}

// 状态接口
export interface IState {
    id: string;
    name: string;
    type: StateType;
    parent: IState | null;
    children: Map<string, IState>;
    
    // 生命周期方法
    onEnter(context: StateMachineContext): Promise<void> | void;
    onUpdate(context: StateMachineContext): Promise<void> | void;
    onExit(context: StateMachineContext): Promise<void> | void;
    
    // 状态管理
    addChild(state: IState): void;
    removeChild(stateId: string): void;
    getChild(stateId: string): IState | undefined;
    
    // 转换管理
    addTransition(transition: StateTransition): void;
    removeTransition(transitionId: string): void;
    getTransitions(): StateTransition[];
    
    // 状态信息
    isActive(): boolean;
    getDepth(): number;
    getPath(): string[];
}

// 基础状态类
export class BaseState extends EventEmitter implements IState {
    public readonly id: string;
    public name: string;
    public type: StateType;
    public parent: IState | null;
    public children: Map<string, IState>;
    
    protected transitions: Map<string, StateTransition>;
    protected isActiveState: boolean;
    protected enterTime: number;
    protected lastUpdateTime: number;
    
    constructor(id: string, type: StateType, name?: string) {
        super();
        this.id = id;
        this.name = name || id;
        this.type = type;
        this.parent = null;
        this.children = new Map();
        this.transitions = new Map();
        this.isActiveState = false;
        this.enterTime = 0;
        this.lastUpdateTime = 0;
    }
    
    // 生命周期方法
    async onEnter(context: StateMachineContext): Promise<void> {
        this.isActiveState = true;
        this.enterTime = context.timestamp;
        this.lastUpdateTime = context.timestamp;
        
        this.emit('state_entered', {
            state: this,
            timestamp: context.timestamp
        });
    }
    
    async onUpdate(context: StateMachineContext): Promise<void> {
        this.lastUpdateTime = context.timestamp;
        
        this.emit('state_updated', {
            state: this,
            timestamp: context.timestamp,
            deltaTime: context.deltaTime
        });
    }
    
    async onExit(context: StateMachineContext): Promise<void> {
        this.isActiveState = false;
        
        this.emit('state_exited', {
            state: this,
            timestamp: context.timestamp,
            duration: context.timestamp - this.enterTime
        });
    }
    
    // 子状态管理
    addChild(state: IState): void {
        state.parent = this;
        this.children.set(state.id, state);
    }
    
    removeChild(stateId: string): void {
        const child = this.children.get(stateId);
        if (child) {
            child.parent = null;
            this.children.delete(stateId);
        }
    }
    
    getChild(stateId: string): IState | undefined {
        return this.children.get(stateId);
    }
    
    // 转换管理
    addTransition(transition: StateTransition): void {
        this.transitions.set(transition.id, transition);
    }
    
    removeTransition(transitionId: string): void {
        this.transitions.delete(transitionId);
    }
    
    getTransitions(): StateTransition[] {
        return Array.from(this.transitions.values());
    }
    
    // 状态信息
    isActive(): boolean {
        return this.isActiveState;
    }
    
    getDepth(): number {
        let depth = 0;
        let current = this.parent;
        while (current) {
            depth++;
            current = current.parent;
        }
        return depth;
    }
    
    getPath(): string[] {
        const path: string[] = [];
        let current: IState | null = this;
        while (current) {
            path.unshift(current.id);
            current = current.parent;
        }
        return path;
    }
    
    // 获取执行时间
    getExecutionTime(currentTime: number): number {
        return this.isActiveState ? currentTime - this.enterTime : 0;
    }
    
    // 检查转换条件
    checkTransitions(context: StateMachineContext): StateTransition | null {
        const validTransitions = Array.from(this.transitions.values())
            .filter(t => t.enabled && t.from === this.id)
            .sort((a, b) => b.priority - a.priority);
        
        for (const transition of validTransitions) {
            if (this.canTransition(transition, context)) {
                return transition;
            }
        }
        
        return null;
    }
    
    // 检查是否可以转换
    private canTransition(transition: StateTransition, context: StateMachineContext): boolean {
        // 检查守卫条件
        for (const guard of transition.guards) {
            if (!guard.check(context)) {
                return false;
            }
        }
        
        // 检查转换条件
        for (const condition of transition.conditions) {
            if (!condition.check(context)) {
                return false;
            }
        }
        
        return true;
    }
}

// 复合状态 - 包含子状态的状态
export class CompositeState extends BaseState {
    private currentChild: IState | null;
    private initialState: string | null;
    
    constructor(id: string, name?: string) {
        super(id, StateType.COMPOSITE, name);
        this.currentChild = null;
        this.initialState = null;
    }
    
    // 设置初始状态
    setInitialState(stateId: string): void {
        if (this.children.has(stateId)) {
            this.initialState = stateId;
        }
    }
    
    // 获取当前子状态
    getCurrentChild(): IState | null {
        return this.currentChild;
    }
    
    async onEnter(context: StateMachineContext): Promise<void> {
        await super.onEnter(context);
        
        // 进入初始子状态
        if (this.initialState && this.children.has(this.initialState)) {
            await this.enterChild(this.initialState, context);
        }
    }
    
    async onUpdate(context: StateMachineContext): Promise<void> {
        await super.onUpdate(context);
        
        // 更新当前子状态
        if (this.currentChild) {
            await this.currentChild.onUpdate(context);
            
            // 检查子状态的转换
            const transition = this.currentChild.checkTransitions(context);
            if (transition) {
                await this.executeTransition(transition, context);
            }
        }
    }
    
    async onExit(context: StateMachineContext): Promise<void> {
        // 退出当前子状态
        if (this.currentChild) {
            await this.currentChild.onExit(context);
            this.currentChild = null;
        }
        
        await super.onExit(context);
    }
    
    // 进入子状态
    private async enterChild(stateId: string, context: StateMachineContext): Promise<void> {
        const child = this.children.get(stateId);
        if (child) {
            this.currentChild = child;
            await child.onEnter(context);
        }
    }
    
    // 执行转换
    private async executeTransition(transition: StateTransition, context: StateMachineContext): Promise<void> {
        // 执行转换动作
        for (const action of transition.actions) {
            await action.execute(context);
        }
        
        // 退出当前状态
        if (this.currentChild) {
            await this.currentChild.onExit(context);
        }
        
        // 进入目标状态
        await this.enterChild(transition.to, context);
        
        this.emit('transition_executed', {
            transition,
            timestamp: context.timestamp
        });
    }
}

// 并行状态 - 同时运行多个子状态
export class ParallelState extends BaseState {
    private activeChildren: Set<IState>;
    
    constructor(id: string, name?: string) {
        super(id, StateType.PARALLEL, name);
        this.activeChildren = new Set();
    }
    
    async onEnter(context: StateMachineContext): Promise<void> {
        await super.onEnter(context);
        
        // 启动所有子状态
        for (const child of this.children.values()) {
            this.activeChildren.add(child);
            await child.onEnter(context);
        }
    }
    
    async onUpdate(context: StateMachineContext): Promise<void> {
        await super.onUpdate(context);
        
        // 并行更新所有活跃子状态
        const updatePromises = Array.from(this.activeChildren).map(child => 
            child.onUpdate(context)
        );
        
        await Promise.all(updatePromises);
    }
    
    async onExit(context: StateMachineContext): Promise<void> {
        // 退出所有活跃子状态
        const exitPromises = Array.from(this.activeChildren).map(child => 
            child.onExit(context)
        );
        
        await Promise.all(exitPromises);
        this.activeChildren.clear();
        
        await super.onExit(context);
    }
    
    // 获取活跃子状态
    getActiveChildren(): IState[] {
        return Array.from(this.activeChildren);
    }
}

// 历史状态 - 记住上次的子状态
export class HistoryState extends BaseState {
    private historyType: 'shallow' | 'deep';
    private savedState: string | null;
    private savedDeepState: Map<string, string>;
    
    constructor(id: string, historyType: 'shallow' | 'deep' = 'shallow', name?: string) {
        super(id, StateType.HISTORY, name);
        this.historyType = historyType;
        this.savedState = null;
        this.savedDeepState = new Map();
    }
    
    // 保存状态历史
    saveHistory(stateId: string, deepStateMap?: Map<string, string>): void {
        this.savedState = stateId;
        if (this.historyType === 'deep' && deepStateMap) {
            this.savedDeepState = new Map(deepStateMap);
        }
    }
    
    // 获取保存的状态
    getSavedState(): string | null {
        return this.savedState;
    }
    
    // 获取深度状态映射
    getDeepStateMap(): Map<string, string> {
        return new Map(this.savedDeepState);
    }
    
    // 清除历史
    clearHistory(): void {
        this.savedState = null;
        this.savedDeepState.clear();
    }
}

// 分层状态机
export class HierarchicalStateMachine extends EventEmitter {
    private states: Map<string, IState>;
    private currentStates: Set<IState>;
    private rootState: IState | null;
    private context: StateMachineContext;
    private isRunning: boolean;
    private tickInterval: number;
    
    constructor() {
        super();
        this.states = new Map();
        this.currentStates = new Set();
        this.rootState = null;
        this.context = {
            data: new Map(),
            timestamp: 0,
            deltaTime: 0,
            agent: null,
            gameState: null
        };
        this.isRunning = false;
        this.tickInterval = 16; // ~60fps
    }
    
    // 添加状态
    addState(state: IState): void {
        this.states.set(state.id, state);
        
        // 设置事件监听
        state.on('state_entered', (event) => this.emit('state_entered', event));
        state.on('state_updated', (event) => this.emit('state_updated', event));
        state.on('state_exited', (event) => this.emit('state_exited', event));
        state.on('transition_executed', (event) => this.emit('transition_executed', event));
    }
    
    // 移除状态
    removeState(stateId: string): void {
        const state = this.states.get(stateId);
        if (state) {
            state.removeAllListeners();
            this.states.delete(stateId);
            this.currentStates.delete(state);
        }
    }
    
    // 获取状态
    getState(stateId: string): IState | undefined {
        return this.states.get(stateId);
    }
    
    // 设置根状态
    setRootState(state: IState): void {
        this.rootState = state;
        if (!this.states.has(state.id)) {
            this.addState(state);
        }
    }
    
    // 启动状态机
    async start(agent: any, gameState: any, initialStateId?: string): Promise<void> {
        if (this.isRunning) {
            return;
        }
        
        this.context.agent = agent;
        this.context.gameState = gameState;
        this.context.timestamp = Date.now();
        this.context.deltaTime = 0;
        
        this.isRunning = true;
        
        // 进入初始状态
        if (initialStateId) {
            await this.enterState(initialStateId);
        } else if (this.rootState) {
            await this.enterState(this.rootState.id);
        }
        
        this.emit('state_machine_started');
        
        // 启动更新循环
        this.startUpdateLoop();
    }
    
    // 停止状态机
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        
        // 退出所有当前状态
        const exitPromises = Array.from(this.currentStates).map(state => 
            state.onExit(this.context)
        );
        await Promise.all(exitPromises);
        
        this.currentStates.clear();
        this.emit('state_machine_stopped');
    }
    
    // 进入状态
    async enterState(stateId: string): Promise<void> {
        const state = this.states.get(stateId);
        if (!state) {
            throw new Error(`State ${stateId} not found`);
        }
        
        this.currentStates.add(state);
        await state.onEnter(this.context);
    }
    
    // 退出状态
    async exitState(stateId: string): Promise<void> {
        const state = this.states.get(stateId);
        if (state && this.currentStates.has(state)) {
            await state.onExit(this.context);
            this.currentStates.delete(state);
        }
    }
    
    // 转换状态
    async transitionTo(fromStateId: string, toStateId: string): Promise<void> {
        await this.exitState(fromStateId);
        await this.enterState(toStateId);
        
        this.emit('state_transition', {
            from: fromStateId,
            to: toStateId,
            timestamp: this.context.timestamp
        });
    }
    
    // 更新状态机
    async update(deltaTime: number): Promise<void> {
        if (!this.isRunning) {
            return;
        }
        
        const currentTime = Date.now();
        this.context.timestamp = currentTime;
        this.context.deltaTime = deltaTime;
        
        // 并行更新所有当前状态
        const updatePromises = Array.from(this.currentStates).map(state => 
            state.onUpdate(this.context)
        );
        
        await Promise.all(updatePromises);
    }
    
    // 启动更新循环
    private startUpdateLoop(): void {
        let lastTime = Date.now();
        
        const loop = async () => {
            if (!this.isRunning) {
                return;
            }
            
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            try {
                await this.update(deltaTime);
            } catch (error) {
                this.emit('update_error', error);
            }
            
            if (this.isRunning) {
                setTimeout(loop, this.tickInterval);
            }
        };
        
        loop();
    }
    
    // 获取当前状态
    getCurrentStates(): IState[] {
        return Array.from(this.currentStates);
    }
    
    // 检查状态是否活跃
    isStateActive(stateId: string): boolean {
        const state = this.states.get(stateId);
        return state ? this.currentStates.has(state) : false;
    }
    
    // 获取上下文数据
    getContextData<T>(key: string): T | undefined {
        return this.context.data.get(key);
    }
    
    // 设置上下文数据
    setContextData<T>(key: string, value: T): void {
        this.context.data.set(key, value);
    }
    
    // 删除上下文数据
    deleteContextData(key: string): void {
        this.context.data.delete(key);
    }
    
    // 创建转换
    createTransition(
        id: string,
        from: string,
        to: string,
        conditions: TransitionCondition[] = [],
        actions: TransitionAction[] = [],
        type: TransitionType = TransitionType.EXTERNAL,
        priority: number = 0
    ): StateTransition {
        return {
            id,
            from,
            to,
            type,
            conditions,
            actions,
            guards: [],
            priority,
            enabled: true
        };
    }
    
    // 添加转换到状态
    addTransitionToState(stateId: string, transition: StateTransition): void {
        const state = this.states.get(stateId);
        if (state) {
            state.addTransition(transition);
        }
    }
    
    // 创建条件
    createCondition(
        id: string,
        name: string,
        checkFunc: (context: StateMachineContext) => boolean,
        priority: number = 0
    ): TransitionCondition {
        return {
            id,
            name,
            check: checkFunc,
            priority
        };
    }
    
    // 创建动作
    createAction(
        id: string,
        name: string,
        executeFunc: (context: StateMachineContext) => Promise<void> | void
    ): TransitionAction {
        return {
            id,
            name,
            execute: executeFunc
        };
    }
    
    // 获取状态机信息
    getStateMachineInfo(): any {
        return {
            isRunning: this.isRunning,
            stateCount: this.states.size,
            currentStateCount: this.currentStates.size,
            currentStateIds: Array.from(this.currentStates).map(s => s.id),
            tickInterval: this.tickInterval,
            hasRootState: this.rootState !== null,
            contextDataSize: this.context.data.size
        };
    }
    
    // 设置tick间隔
    setTickInterval(intervalMs: number): void {
        this.tickInterval = Math.max(1, intervalMs);
    }
    
    // 获取所有状态
    getAllStates(): IState[] {
        return Array.from(this.states.values());
    }
    
    // 验证状态机配置
    validate(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        // 检查是否有根状态
        if (!this.rootState) {
            errors.push('No root state defined');
        }
        
        // 检查状态转换的目标状态是否存在
        for (const state of this.states.values()) {
            for (const transition of state.getTransitions()) {
                if (!this.states.has(transition.to)) {
                    errors.push(`Transition ${transition.id} targets non-existent state ${transition.to}`);
                }
                if (!this.states.has(transition.from)) {
                    errors.push(`Transition ${transition.id} from non-existent state ${transition.from}`);
                }
            }
        }
        
        // 检查复合状态是否有初始状态
        for (const state of this.states.values()) {
            if (state.type === StateType.COMPOSITE && state.children.size > 0) {
                const compositeState = state as CompositeState;
                // 这里可以添加更多复合状态的验证逻辑
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// 状态机构建器 - 便于创建复杂状态机
export class StateMachineBuilder {
    private stateMachine: HierarchicalStateMachine;
    private currentState: IState | null;
    
    constructor() {
        this.stateMachine = new HierarchicalStateMachine();
        this.currentState = null;
    }
    
    // 添加简单状态
    addState(id: string, name?: string): StateMachineBuilder {
        const state = new BaseState(id, StateType.SIMPLE, name);
        this.stateMachine.addState(state);
        this.currentState = state;
        return this;
    }
    
    // 添加复合状态
    addCompositeState(id: string, name?: string): StateMachineBuilder {
        const state = new CompositeState(id, name);
        this.stateMachine.addState(state);
        this.currentState = state;
        return this;
    }
    
    // 添加并行状态
    addParallelState(id: string, name?: string): StateMachineBuilder {
        const state = new ParallelState(id, name);
        this.stateMachine.addState(state);
        this.currentState = state;
        return this;
    }
    
    // 设置为根状态
    asRoot(): StateMachineBuilder {
        if (this.currentState) {
            this.stateMachine.setRootState(this.currentState);
        }
        return this;
    }
    
    // 添加子状态
    addChild(childId: string, childName?: string): StateMachineBuilder {
        if (this.currentState) {
            const childState = new BaseState(childId, StateType.SIMPLE, childName);
            this.currentState.addChild(childState);
            this.stateMachine.addState(childState);
        }
        return this;
    }
    
    // 设置初始状态（用于复合状态）
    setInitialState(stateId: string): StateMachineBuilder {
        if (this.currentState && this.currentState.type === StateType.COMPOSITE) {
            (this.currentState as CompositeState).setInitialState(stateId);
        }
        return this;
    }
    
    // 添加转换
    addTransition(
        from: string,
        to: string,
        conditionFunc?: (context: StateMachineContext) => boolean,
        actionFunc?: (context: StateMachineContext) => Promise<void> | void
    ): StateMachineBuilder {
        const transitionId = `${from}_to_${to}_${Date.now()}`;
        const conditions = conditionFunc ? [this.stateMachine.createCondition(
            `condition_${transitionId}`,
            `Condition for ${from} to ${to}`,
            conditionFunc
        )] : [];
        
        const actions = actionFunc ? [this.stateMachine.createAction(
            `action_${transitionId}`,
            `Action for ${from} to ${to}`,
            actionFunc
        )] : [];
        
        const transition = this.stateMachine.createTransition(
            transitionId,
            from,
            to,
            conditions,
            actions
        );
        
        this.stateMachine.addTransitionToState(from, transition);
        return this;
    }
    
    // 构建状态机
    build(): HierarchicalStateMachine {
        return this.stateMachine;
    }
}