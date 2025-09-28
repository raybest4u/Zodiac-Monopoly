/**
 * 行为调试和可视化工具
 * Behavior Debugging and Visualization Tools
 * 
 * 提供AI行为系统的调试、监控和可视化功能
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { GameSystemIntegration, ZodiacMonopolyAI } from './GameSystemIntegration';
import { AIDecisionIntegration, DecisionResult, DecisionType } from './AIDecisionIntegration';
import { CompositeBehaviorController, BehaviorExecutionResult } from './CompositeBehaviorController';
import { BehaviorTree, BehaviorNode, NodeStatus } from './BehaviorTree';
import { HierarchicalStateMachine, IState } from './StateMachine';

// 调试级别
export enum DebugLevel {
    NONE = 0,
    ERROR = 1,
    WARNING = 2,
    INFO = 3,
    DEBUG = 4,
    TRACE = 5
}

// 调试事件类型
export enum DebugEventType {
    BEHAVIOR_TREE_NODE = 'behavior_tree_node',
    STATE_MACHINE_TRANSITION = 'state_machine_transition',
    DECISION_MADE = 'decision_made',
    ACTION_EXECUTED = 'action_executed',
    ERROR_OCCURRED = 'error_occurred',
    PERFORMANCE_METRIC = 'performance_metric'
}

// 调试事件
export interface DebugEvent {
    id: string;
    type: DebugEventType;
    level: DebugLevel;
    timestamp: number;
    playerId?: string;
    component: string;
    message: string;
    data: any;
    stackTrace?: string;
}

// 性能指标
export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: number;
    playerId?: string;
    category: 'execution_time' | 'memory_usage' | 'decision_quality' | 'error_rate';
}

// 行为树节点执行记录
export interface BehaviorTreeNodeExecution {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    status: NodeStatus;
    startTime: number;
    endTime: number;
    duration: number;
    parentNodeId?: string;
    childrenResults: NodeStatus[];
    blackboardSnapshot: Map<string, any>;
}

// 状态机状态记录
export interface StateMachineStateRecord {
    stateId: string;
    stateName: string;
    stateType: string;
    enterTime: number;
    exitTime?: number;
    duration?: number;
    parentStateId?: string;
    transitionsTriggered: string[];
    contextSnapshot: Map<string, any>;
}

// 决策分析记录
export interface DecisionAnalysis {
    decisionId: string;
    type: DecisionType;
    playerId: string;
    startTime: number;
    endTime: number;
    duration: number;
    confidence: number;
    selectedAction: string;
    alternativeActions: string[];
    reasoning: string[];
    contextFactors: Map<string, any>;
    outcome: 'success' | 'failure' | 'pending';
}

// 可视化数据结构
export interface VisualizationData {
    behaviorTreeState: BehaviorTreeVisualization;
    stateMachineState: StateMachineVisualization;
    decisionFlow: DecisionFlowVisualization;
    performanceMetrics: PerformanceVisualization;
    timeline: TimelineVisualization;
}

export interface BehaviorTreeVisualization {
    nodes: Array<{
        id: string;
        name: string;
        type: string;
        status: NodeStatus;
        position: { x: number; y: number };
        children: string[];
        parent?: string;
        executionCount: number;
        averageExecutionTime: number;
        successRate: number;
    }>;
    edges: Array<{
        from: string;
        to: string;
        active: boolean;
    }>;
}

export interface StateMachineVisualization {
    states: Array<{
        id: string;
        name: string;
        type: string;
        isActive: boolean;
        position: { x: number; y: number };
        children: string[];
        parent?: string;
        enterCount: number;
        totalDuration: number;
        averageDuration: number;
    }>;
    transitions: Array<{
        from: string;
        to: string;
        label: string;
        triggerCount: number;
        active: boolean;
    }>;
}

export interface DecisionFlowVisualization {
    decisions: Array<{
        id: string;
        type: DecisionType;
        timestamp: number;
        duration: number;
        confidence: number;
        outcome: string;
    }>;
    patterns: Array<{
        pattern: string;
        frequency: number;
        successRate: number;
    }>;
}

export interface PerformanceVisualization {
    metrics: Array<{
        name: string;
        values: Array<{ timestamp: number; value: number }>;
        trend: 'increasing' | 'decreasing' | 'stable';
        average: number;
        min: number;
        max: number;
    }>;
}

export interface TimelineVisualization {
    events: Array<{
        timestamp: number;
        type: string;
        description: string;
        level: DebugLevel;
        playerId?: string;
    }>;
    phases: Array<{
        name: string;
        startTime: number;
        endTime?: number;
        events: number;
    }>;
}

// 行为调试器
export class BehaviorDebugger extends EventEmitter {
    private gameIntegration: GameSystemIntegration;
    private debugLevel: DebugLevel;
    private isActive: boolean;
    private events: DebugEvent[];
    private performanceMetrics: PerformanceMetric[];
    private behaviorTreeExecutions: Map<string, BehaviorTreeNodeExecution[]>;
    private stateMachineRecords: Map<string, StateMachineStateRecord[]>;
    private decisionAnalyses: Map<string, DecisionAnalysis[]>;
    private maxEventHistory: number;
    private recordingStartTime: number;

    constructor(gameIntegration: GameSystemIntegration, debugLevel: DebugLevel = DebugLevel.INFO) {
        super();
        this.gameIntegration = gameIntegration;
        this.debugLevel = debugLevel;
        this.isActive = false;
        this.events = [];
        this.performanceMetrics = [];
        this.behaviorTreeExecutions = new Map();
        this.stateMachineRecords = new Map();
        this.decisionAnalyses = new Map();
        this.maxEventHistory = 10000;
        this.recordingStartTime = 0;

        this.setupEventListeners();
    }

    // 设置事件监听器
    private setupEventListeners(): void {
        // 游戏系统事件
        this.gameIntegration.on('ai_decision_made', (event) => {
            this.recordDecisionEvent(event);
        });

        this.gameIntegration.on('ai_decision_error', (event) => {
            this.recordErrorEvent('Decision Error', event.error, event.playerId);
        });

        this.gameIntegration.on('turn_completed', (event) => {
            this.recordPerformanceMetric('turn_duration', event.duration, 'ms', event.playerId);
        });

        this.gameIntegration.on('turn_error', (event) => {
            this.recordErrorEvent('Turn Error', event.error, event.playerId);
        });

        // 行为树和状态机事件将通过直接接口监听
    }

    // 开始调试记录
    startRecording(level: DebugLevel = this.debugLevel): void {
        this.debugLevel = level;
        this.isActive = true;
        this.recordingStartTime = Date.now();
        this.events = [];
        this.performanceMetrics = [];
        this.behaviorTreeExecutions.clear();
        this.stateMachineRecords.clear();
        this.decisionAnalyses.clear();

        this.recordDebugEvent(
            DebugEventType.PERFORMANCE_METRIC,
            DebugLevel.INFO,
            'DebugRecorder',
            'Debug recording started',
            { level, timestamp: this.recordingStartTime }
        );

        this.emit('recording_started', { level, timestamp: this.recordingStartTime });
    }

    // 停止调试记录
    stopRecording(): void {
        if (!this.isActive) {
            return;
        }

        const duration = Date.now() - this.recordingStartTime;
        this.isActive = false;

        this.recordDebugEvent(
            DebugEventType.PERFORMANCE_METRIC,
            DebugLevel.INFO,
            'DebugRecorder',
            'Debug recording stopped',
            { duration, eventsRecorded: this.events.length }
        );

        this.emit('recording_stopped', { 
            duration, 
            eventsRecorded: this.events.length,
            metricsRecorded: this.performanceMetrics.length
        });
    }

    // 记录调试事件
    recordDebugEvent(
        type: DebugEventType,
        level: DebugLevel,
        component: string,
        message: string,
        data: any,
        playerId?: string,
        stackTrace?: string
    ): void {
        if (!this.isActive || level > this.debugLevel) {
            return;
        }

        const event: DebugEvent = {
            id: this.generateEventId(),
            type,
            level,
            timestamp: Date.now(),
            playerId,
            component,
            message,
            data,
            stackTrace
        };

        this.events.push(event);

        // 限制事件历史大小
        if (this.events.length > this.maxEventHistory) {
            this.events.shift();
        }

        this.emit('debug_event', event);
    }

    // 记录行为树节点执行
    recordBehaviorTreeNodeExecution(
        playerId: string,
        nodeExecution: BehaviorTreeNodeExecution
    ): void {
        if (!this.isActive) return;

        if (!this.behaviorTreeExecutions.has(playerId)) {
            this.behaviorTreeExecutions.set(playerId, []);
        }

        this.behaviorTreeExecutions.get(playerId)!.push(nodeExecution);

        this.recordDebugEvent(
            DebugEventType.BEHAVIOR_TREE_NODE,
            DebugLevel.DEBUG,
            'BehaviorTree',
            `Node ${nodeExecution.nodeName} executed with status ${nodeExecution.status}`,
            nodeExecution,
            playerId
        );

        // 记录性能指标
        this.recordPerformanceMetric(
            'bt_node_execution_time',
            nodeExecution.duration,
            'ms',
            playerId
        );
    }

    // 记录状态机状态
    recordStateMachineState(
        playerId: string,
        stateRecord: StateMachineStateRecord
    ): void {
        if (!this.isActive) return;

        if (!this.stateMachineRecords.has(playerId)) {
            this.stateMachineRecords.set(playerId, []);
        }

        this.stateMachineRecords.get(playerId)!.push(stateRecord);

        this.recordDebugEvent(
            DebugEventType.STATE_MACHINE_TRANSITION,
            DebugLevel.DEBUG,
            'StateMachine',
            `State ${stateRecord.stateName} ${stateRecord.exitTime ? 'exited' : 'entered'}`,
            stateRecord,
            playerId
        );

        // 记录性能指标
        if (stateRecord.duration) {
            this.recordPerformanceMetric(
                'sm_state_duration',
                stateRecord.duration,
                'ms',
                playerId
            );
        }
    }

    // 记录决策分析
    recordDecisionAnalysis(playerId: string, analysis: DecisionAnalysis): void {
        if (!this.isActive) return;

        if (!this.decisionAnalyses.has(playerId)) {
            this.decisionAnalyses.set(playerId, []);
        }

        this.decisionAnalyses.get(playerId)!.push(analysis);

        this.recordDebugEvent(
            DebugEventType.DECISION_MADE,
            DebugLevel.INFO,
            'DecisionSystem',
            `Decision ${analysis.type} made with confidence ${analysis.confidence}`,
            analysis,
            playerId
        );

        // 记录性能指标
        this.recordPerformanceMetric('decision_time', analysis.duration, 'ms', playerId);
        this.recordPerformanceMetric('decision_confidence', analysis.confidence, 'ratio', playerId);
    }

    // 记录决策事件
    private recordDecisionEvent(event: any): void {
        const analysis: DecisionAnalysis = {
            decisionId: this.generateEventId(),
            type: event.decision.type,
            playerId: event.context.playerId,
            startTime: event.timestamp || Date.now(),
            endTime: Date.now(),
            duration: 0, // 会在后续更新
            confidence: event.decision.confidence,
            selectedAction: event.decision.action,
            alternativeActions: event.decision.alternativeActions,
            reasoning: event.decision.reasoning,
            contextFactors: new Map(Object.entries(event.context)),
            outcome: 'pending'
        };

        this.recordDecisionAnalysis(event.context.playerId, analysis);
    }

    // 记录错误事件
    private recordErrorEvent(component: string, error: any, playerId?: string): void {
        this.recordDebugEvent(
            DebugEventType.ERROR_OCCURRED,
            DebugLevel.ERROR,
            component,
            error.message || 'Unknown error',
            { error: error.toString() },
            playerId,
            error.stack
        );
    }

    // 记录性能指标
    recordPerformanceMetric(
        name: string,
        value: number,
        unit: string,
        playerId?: string
    ): void {
        if (!this.isActive) return;

        const metric: PerformanceMetric = {
            name,
            value,
            unit,
            timestamp: Date.now(),
            playerId,
            category: this.categorizeMetric(name)
        };

        this.performanceMetrics.push(metric);
        this.emit('performance_metric', metric);
    }

    // 分类性能指标
    private categorizeMetric(name: string): PerformanceMetric['category'] {
        if (name.includes('time') || name.includes('duration')) {
            return 'execution_time';
        }
        if (name.includes('memory') || name.includes('heap')) {
            return 'memory_usage';
        }
        if (name.includes('confidence') || name.includes('quality')) {
            return 'decision_quality';
        }
        if (name.includes('error') || name.includes('failure')) {
            return 'error_rate';
        }
        return 'execution_time';
    }

    // 生成可视化数据
    generateVisualizationData(playerId?: string): VisualizationData {
        return {
            behaviorTreeState: this.generateBehaviorTreeVisualization(playerId),
            stateMachineState: this.generateStateMachineVisualization(playerId),
            decisionFlow: this.generateDecisionFlowVisualization(playerId),
            performanceMetrics: this.generatePerformanceVisualization(playerId),
            timeline: this.generateTimelineVisualization(playerId)
        };
    }

    // 生成行为树可视化数据
    private generateBehaviorTreeVisualization(playerId?: string): BehaviorTreeVisualization {
        const nodes: BehaviorTreeVisualization['nodes'] = [];
        const edges: BehaviorTreeVisualization['edges'] = [];

        // 如果有特定玩家ID，获取该玩家的行为树执行数据
        if (playerId && this.behaviorTreeExecutions.has(playerId)) {
            const executions = this.behaviorTreeExecutions.get(playerId)!;
            const nodeStats = new Map<string, any>();

            // 统计节点执行数据
            for (const execution of executions) {
                if (!nodeStats.has(execution.nodeId)) {
                    nodeStats.set(execution.nodeId, {
                        id: execution.nodeId,
                        name: execution.nodeName,
                        type: execution.nodeType,
                        executions: [],
                        successCount: 0,
                        totalDuration: 0
                    });
                }

                const stats = nodeStats.get(execution.nodeId);
                stats.executions.push(execution);
                if (execution.status === NodeStatus.SUCCESS) {
                    stats.successCount++;
                }
                stats.totalDuration += execution.duration;
            }

            // 转换为可视化格式
            let position = { x: 100, y: 100 };
            for (const [nodeId, stats] of nodeStats) {
                nodes.push({
                    id: nodeId,
                    name: stats.name,
                    type: stats.type,
                    status: stats.executions[stats.executions.length - 1]?.status || NodeStatus.READY,
                    position: { ...position },
                    children: [],
                    executionCount: stats.executions.length,
                    averageExecutionTime: stats.totalDuration / stats.executions.length,
                    successRate: stats.successCount / stats.executions.length
                });

                position.x += 150;
                if (position.x > 800) {
                    position.x = 100;
                    position.y += 100;
                }
            }
        }

        return { nodes, edges };
    }

    // 生成状态机可视化数据
    private generateStateMachineVisualization(playerId?: string): StateMachineVisualization {
        const states: StateMachineVisualization['states'] = [];
        const transitions: StateMachineVisualization['transitions'] = [];

        if (playerId && this.stateMachineRecords.has(playerId)) {
            const records = this.stateMachineRecords.get(playerId)!;
            const stateStats = new Map<string, any>();

            // 统计状态数据
            for (const record of records) {
                if (!stateStats.has(record.stateId)) {
                    stateStats.set(record.stateId, {
                        id: record.stateId,
                        name: record.stateName,
                        type: record.stateType,
                        enters: 0,
                        totalDuration: 0,
                        durations: []
                    });
                }

                const stats = stateStats.get(record.stateId);
                if (record.duration) {
                    stats.enters++;
                    stats.totalDuration += record.duration;
                    stats.durations.push(record.duration);
                }
            }

            // 转换为可视化格式
            let position = { x: 150, y: 150 };
            for (const [stateId, stats] of stateStats) {
                states.push({
                    id: stateId,
                    name: stats.name,
                    type: stats.type,
                    isActive: false, // 需要从实际状态机获取
                    position: { ...position },
                    children: [],
                    enterCount: stats.enters,
                    totalDuration: stats.totalDuration,
                    averageDuration: stats.enters > 0 ? stats.totalDuration / stats.enters : 0
                });

                position.x += 200;
                if (position.x > 1000) {
                    position.x = 150;
                    position.y += 150;
                }
            }
        }

        return { states, transitions };
    }

    // 生成决策流可视化数据
    private generateDecisionFlowVisualization(playerId?: string): DecisionFlowVisualization {
        const decisions: DecisionFlowVisualization['decisions'] = [];
        const patterns: DecisionFlowVisualization['patterns'] = [];

        if (playerId && this.decisionAnalyses.has(playerId)) {
            const analyses = this.decisionAnalyses.get(playerId)!;

            // 转换决策数据
            for (const analysis of analyses) {
                decisions.push({
                    id: analysis.decisionId,
                    type: analysis.type,
                    timestamp: analysis.startTime,
                    duration: analysis.duration,
                    confidence: analysis.confidence,
                    outcome: analysis.outcome
                });
            }

            // 分析决策模式
            const patternMap = new Map<string, { count: number; success: number }>();
            for (const analysis of analyses) {
                const pattern = `${analysis.type}_${analysis.selectedAction}`;
                if (!patternMap.has(pattern)) {
                    patternMap.set(pattern, { count: 0, success: 0 });
                }
                const patternStats = patternMap.get(pattern)!;
                patternStats.count++;
                if (analysis.outcome === 'success') {
                    patternStats.success++;
                }
            }

            for (const [pattern, stats] of patternMap) {
                patterns.push({
                    pattern,
                    frequency: stats.count,
                    successRate: stats.success / stats.count
                });
            }
        }

        return { decisions, patterns };
    }

    // 生成性能可视化数据
    private generatePerformanceVisualization(playerId?: string): PerformanceVisualization {
        const metrics: PerformanceVisualization['metrics'] = [];
        const metricMap = new Map<string, PerformanceMetric[]>();

        // 按指标名称分组
        for (const metric of this.performanceMetrics) {
            if (!playerId || metric.playerId === playerId) {
                if (!metricMap.has(metric.name)) {
                    metricMap.set(metric.name, []);
                }
                metricMap.get(metric.name)!.push(metric);
            }
        }

        // 为每个指标生成可视化数据
        for (const [name, metricList] of metricMap) {
            const values = metricList.map(m => ({ timestamp: m.timestamp, value: m.value }));
            const valueNumbers = metricList.map(m => m.value);
            
            metrics.push({
                name,
                values,
                trend: this.calculateTrend(valueNumbers),
                average: valueNumbers.reduce((a, b) => a + b, 0) / valueNumbers.length,
                min: Math.min(...valueNumbers),
                max: Math.max(...valueNumbers)
            });
        }

        return { metrics };
    }

    // 生成时间线可视化数据
    private generateTimelineVisualization(playerId?: string): TimelineVisualization {
        const events: TimelineVisualization['events'] = [];
        const phases: TimelineVisualization['phases'] = [];

        // 过滤事件
        const filteredEvents = this.events.filter(event => 
            !playerId || event.playerId === playerId
        );

        // 转换事件数据
        for (const event of filteredEvents) {
            events.push({
                timestamp: event.timestamp,
                type: event.type,
                description: event.message,
                level: event.level,
                playerId: event.playerId
            });
        }

        // 生成阶段数据（简化版本）
        if (events.length > 0) {
            phases.push({
                name: 'Debug Session',
                startTime: this.recordingStartTime,
                endTime: this.isActive ? undefined : Date.now(),
                events: events.length
            });
        }

        return { events, phases };
    }

    // 计算趋势
    private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
        if (values.length < 2) return 'stable';
        
        const first = values.slice(0, Math.floor(values.length / 2));
        const second = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
        const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
        
        const diff = secondAvg - firstAvg;
        const threshold = firstAvg * 0.1; // 10% threshold
        
        if (diff > threshold) return 'increasing';
        if (diff < -threshold) return 'decreasing';
        return 'stable';
    }

    // 生成事件ID
    private generateEventId(): string {
        return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 导出调试数据
    exportDebugData(): any {
        return {
            session: {
                startTime: this.recordingStartTime,
                endTime: this.isActive ? null : Date.now(),
                duration: this.isActive ? Date.now() - this.recordingStartTime : 0,
                level: this.debugLevel,
                isActive: this.isActive
            },
            events: this.events,
            performanceMetrics: this.performanceMetrics,
            behaviorTreeExecutions: Object.fromEntries(this.behaviorTreeExecutions),
            stateMachineRecords: Object.fromEntries(this.stateMachineRecords),
            decisionAnalyses: Object.fromEntries(this.decisionAnalyses)
        };
    }

    // 导入调试数据
    importDebugData(data: any): void {
        if (data.events) {
            this.events = data.events;
        }
        if (data.performanceMetrics) {
            this.performanceMetrics = data.performanceMetrics;
        }
        if (data.behaviorTreeExecutions) {
            this.behaviorTreeExecutions = new Map(Object.entries(data.behaviorTreeExecutions));
        }
        if (data.stateMachineRecords) {
            this.stateMachineRecords = new Map(Object.entries(data.stateMachineRecords));
        }
        if (data.decisionAnalyses) {
            this.decisionAnalyses = new Map(Object.entries(data.decisionAnalyses));
        }

        this.emit('data_imported', { 
            eventsCount: this.events.length,
            metricsCount: this.performanceMetrics.length
        });
    }

    // 清理调试数据
    clearDebugData(): void {
        this.events = [];
        this.performanceMetrics = [];
        this.behaviorTreeExecutions.clear();
        this.stateMachineRecords.clear();
        this.decisionAnalyses.clear();

        this.emit('data_cleared');
    }

    // 获取统计信息
    getStatistics(): any {
        return {
            isActive: this.isActive,
            recordingDuration: this.isActive ? Date.now() - this.recordingStartTime : 0,
            eventsCount: this.events.length,
            metricsCount: this.performanceMetrics.length,
            playersTracked: new Set([
                ...Array.from(this.behaviorTreeExecutions.keys()),
                ...Array.from(this.stateMachineRecords.keys()),
                ...Array.from(this.decisionAnalyses.keys())
            ]).size,
            errorCount: this.events.filter(e => e.level === DebugLevel.ERROR).length,
            warningCount: this.events.filter(e => e.level === DebugLevel.WARNING).length
        };
    }

    // 设置调试级别
    setDebugLevel(level: DebugLevel): void {
        this.debugLevel = level;
        this.emit('debug_level_changed', { level });
    }

    // 获取调试级别
    getDebugLevel(): DebugLevel {
        return this.debugLevel;
    }

    // 设置最大事件历史
    setMaxEventHistory(maxEvents: number): void {
        this.maxEventHistory = maxEvents;
        
        // 如果当前事件超过新限制，删除旧事件
        while (this.events.length > this.maxEventHistory) {
            this.events.shift();
        }
    }

    // 获取特定类型的事件
    getEventsByType(type: DebugEventType, playerId?: string): DebugEvent[] {
        return this.events.filter(event => 
            event.type === type && (!playerId || event.playerId === playerId)
        );
    }

    // 获取特定级别的事件
    getEventsByLevel(level: DebugLevel, playerId?: string): DebugEvent[] {
        return this.events.filter(event => 
            event.level === level && (!playerId || event.playerId === playerId)
        );
    }

    // 搜索事件
    searchEvents(query: string, playerId?: string): DebugEvent[] {
        const lowerQuery = query.toLowerCase();
        return this.events.filter(event => {
            if (playerId && event.playerId !== playerId) {
                return false;
            }
            
            return event.message.toLowerCase().includes(lowerQuery) ||
                   event.component.toLowerCase().includes(lowerQuery) ||
                   JSON.stringify(event.data).toLowerCase().includes(lowerQuery);
        });
    }
}

// 调试器工厂
export class BehaviorDebuggerFactory {
    static createDebugger(
        gameIntegration: GameSystemIntegration,
        level: DebugLevel = DebugLevel.INFO
    ): BehaviorDebugger {
        return new BehaviorDebugger(gameIntegration, level);
    }

    static createProductionDebugger(gameIntegration: GameSystemIntegration): BehaviorDebugger {
        return new BehaviorDebugger(gameIntegration, DebugLevel.ERROR);
    }

    static createDevelopmentDebugger(gameIntegration: GameSystemIntegration): BehaviorDebugger {
        return new BehaviorDebugger(gameIntegration, DebugLevel.TRACE);
    }
}