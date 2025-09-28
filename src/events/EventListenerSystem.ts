/**
 * 事件监听器和处理机制
 * 
 * 提供灵活的事件监听和处理系统，包括：
 * - 智能事件过滤
 * - 分层监听器管理
 * - 事件中间件
 * - 监听器生命周期管理
 * - 性能监控和优化
 */

import { EventEmitter } from '../utils/EventEmitter';
import { 
  EventListener, 
  EventCallback, 
  EventFilter, 
  ProcessedEvent, 
  EventResponse,
  EventPriority,
  EventStatus,
  EventCategory
} from './EventSystemArchitecture';
import { GameEventType } from './EventTypeDefinitions';

// ============================================================================
// 高级监听器接口定义
// ============================================================================

/**
 * 监听器组
 */
export interface ListenerGroup {
  id: string;
  name: string;
  listeners: string[];
  enabled: boolean;
  priority: number;
  metadata: Record<string, any>;
}

/**
 * 事件中间件
 */
export interface EventMiddleware {
  id: string;
  name: string;
  priority: number;
  execute: (event: ProcessedEvent, next: () => Promise<void>) => Promise<void>;
  enabled: boolean;
}

/**
 * 监听器性能指标
 */
export interface ListenerPerformanceMetrics {
  listenerId: string;
  totalExecutions: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  successRate: number;
  errorCount: number;
  lastExecutionTime: number;
}

/**
 * 监听器配置
 */
export interface ListenerConfig {
  maxExecutionTime: number;
  maxRetries: number;
  retryDelay: number;
  enablePerformanceTracking: boolean;
  enableErrorRecovery: boolean;
  isolateExecution: boolean;
}

/**
 * 条件监听器
 */
export interface ConditionalListener extends EventListener {
  conditions: Array<{
    id: string;
    evaluate: (event: ProcessedEvent) => boolean | Promise<boolean>;
    required: boolean;
  }>;
  onConditionFailed?: (failedConditions: string[], event: ProcessedEvent) => void;
}

/**
 * 聚合监听器
 */
export interface AggregateListener {
  id: string;
  name: string;
  eventTypes: string[];
  aggregateFunction: (events: ProcessedEvent[]) => any;
  windowSize: number;
  windowType: 'time' | 'count';
  callback: (aggregatedData: any, events: ProcessedEvent[]) => Promise<void> | void;
  enabled: boolean;
}

// ============================================================================
// 事件监听器系统实现
// ============================================================================

/**
 * 高级事件监听器系统
 */
export class EventListenerSystem extends EventEmitter {
  private listeners = new Map<string, EventListener>();
  private conditionalListeners = new Map<string, ConditionalListener>();
  private aggregateListeners = new Map<string, AggregateListener>();
  private listenerGroups = new Map<string, ListenerGroup>();
  private middlewares: EventMiddleware[] = [];
  private performanceMetrics = new Map<string, ListenerPerformanceMetrics>();
  private config: ListenerConfig;
  private eventBuffer = new Map<string, ProcessedEvent[]>(); // 用于聚合监听器

  constructor(config?: Partial<ListenerConfig>) {
    super();
    
    this.config = {
      maxExecutionTime: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      enablePerformanceTracking: true,
      enableErrorRecovery: true,
      isolateExecution: true,
      ...config
    };

    this.setupDefaultMiddlewares();
  }

  // ============================================================================
  // 标准监听器管理
  // ============================================================================

  /**
   * 添加事件监听器
   */
  public addListener(listener: EventListener): string {
    const listenerId = listener.id || this.generateListenerId();
    const fullListener = { ...listener, id: listenerId };
    
    this.listeners.set(listenerId, fullListener);
    
    // 初始化性能指标
    if (this.config.enablePerformanceTracking) {
      this.initializePerformanceMetrics(listenerId);
    }

    console.log(`👂 添加事件监听器: ${fullListener.id} (类型: ${fullListener.eventTypes.join(', ')})`);
    this.emit('listenerAdded', fullListener);
    
    return listenerId;
  }

  /**
   * 移除事件监听器
   */
  public removeListener(listenerId: string): boolean {
    const listener = this.listeners.get(listenerId);
    if (!listener) return false;

    this.listeners.delete(listenerId);
    this.performanceMetrics.delete(listenerId);
    
    console.log(`🗑️ 移除事件监听器: ${listenerId}`);
    this.emit('listenerRemoved', listener);
    
    return true;
  }

  /**
   * 获取监听器
   */
  public getListener(listenerId: string): EventListener | undefined {
    return this.listeners.get(listenerId);
  }

  /**
   * 获取所有监听器
   */
  public getAllListeners(): EventListener[] {
    return Array.from(this.listeners.values());
  }

  /**
   * 启用/禁用监听器
   */
  public toggleListener(listenerId: string, enabled: boolean): boolean {
    const listener = this.listeners.get(listenerId);
    if (!listener) return false;

    listener.enabled = enabled;
    console.log(`${enabled ? '✅' : '❌'} ${enabled ? '启用' : '禁用'}监听器: ${listenerId}`);
    
    return true;
  }

  // ============================================================================
  // 条件监听器管理
  // ============================================================================

  /**
   * 添加条件监听器
   */
  public addConditionalListener(listener: ConditionalListener): string {
    const listenerId = listener.id || this.generateListenerId();
    const fullListener = { ...listener, id: listenerId };
    
    this.conditionalListeners.set(listenerId, fullListener);
    
    console.log(`🎯 添加条件监听器: ${listenerId} (条件: ${fullListener.conditions.length})`);
    this.emit('conditionalListenerAdded', fullListener);
    
    return listenerId;
  }

  /**
   * 评估条件监听器
   */
  private async evaluateConditionalListener(
    listener: ConditionalListener, 
    event: ProcessedEvent
  ): Promise<boolean> {
    const failedConditions: string[] = [];

    for (const condition of listener.conditions) {
      try {
        const result = await condition.evaluate(event);
        if (!result) {
          failedConditions.push(condition.id);
          if (condition.required) {
            break; // 必需条件失败，直接返回
          }
        }
      } catch (error) {
        console.error(`条件 ${condition.id} 评估失败:`, error);
        failedConditions.push(condition.id);
        if (condition.required) {
          break;
        }
      }
    }

    // 检查是否有必需条件失败
    const requiredConditionsFailed = failedConditions.some(conditionId =>
      listener.conditions.find(c => c.id === conditionId)?.required
    );

    if (requiredConditionsFailed && listener.onConditionFailed) {
      listener.onConditionFailed(failedConditions, event);
    }

    return !requiredConditionsFailed;
  }

  // ============================================================================
  // 聚合监听器管理
  // ============================================================================

  /**
   * 添加聚合监听器
   */
  public addAggregateListener(listener: AggregateListener): string {
    const listenerId = listener.id || this.generateListenerId();
    const fullListener = { ...listener, id: listenerId };
    
    this.aggregateListeners.set(listenerId, fullListener);
    
    // 初始化事件缓冲区
    this.eventBuffer.set(listenerId, []);
    
    console.log(`📊 添加聚合监听器: ${listenerId} (窗口: ${fullListener.windowSize})`);
    this.emit('aggregateListenerAdded', fullListener);
    
    return listenerId;
  }

  /**
   * 处理聚合监听器
   */
  private async processAggregateListeners(event: ProcessedEvent): Promise<void> {
    for (const [listenerId, listener] of this.aggregateListeners) {
      if (!listener.enabled) continue;
      
      if (!listener.eventTypes.includes(event.type)) continue;

      const buffer = this.eventBuffer.get(listenerId) || [];
      buffer.push(event);

      // 检查窗口条件
      let shouldProcess = false;
      
      if (listener.windowType === 'count') {
        shouldProcess = buffer.length >= listener.windowSize;
      } else if (listener.windowType === 'time') {
        const oldestEvent = buffer[0];
        const timeDiff = event.timestamp - oldestEvent.timestamp;
        shouldProcess = timeDiff >= listener.windowSize;
      }

      if (shouldProcess) {
        try {
          const aggregatedData = listener.aggregateFunction(buffer);
          await listener.callback(aggregatedData, [...buffer]);
          
          // 清空缓冲区
          this.eventBuffer.set(listenerId, []);
          
        } catch (error) {
          console.error(`聚合监听器 ${listenerId} 处理失败:`, error);
        }
      } else {
        // 更新缓冲区
        this.eventBuffer.set(listenerId, buffer);
      }
    }
  }

  // ============================================================================
  // 监听器组管理
  // ============================================================================

  /**
   * 创建监听器组
   */
  public createListenerGroup(group: Omit<ListenerGroup, 'listeners'>): string {
    const groupId = group.id || this.generateGroupId();
    const fullGroup: ListenerGroup = { ...group, id: groupId, listeners: [] };
    
    this.listenerGroups.set(groupId, fullGroup);
    
    console.log(`👥 创建监听器组: ${fullGroup.name} (${groupId})`);
    this.emit('listenerGroupCreated', fullGroup);
    
    return groupId;
  }

  /**
   * 添加监听器到组
   */
  public addListenerToGroup(groupId: string, listenerId: string): boolean {
    const group = this.listenerGroups.get(groupId);
    if (!group) return false;

    if (!group.listeners.includes(listenerId)) {
      group.listeners.push(listenerId);
      console.log(`➕ 添加监听器 ${listenerId} 到组 ${groupId}`);
      return true;
    }
    
    return false;
  }

  /**
   * 从组中移除监听器
   */
  public removeListenerFromGroup(groupId: string, listenerId: string): boolean {
    const group = this.listenerGroups.get(groupId);
    if (!group) return false;

    const index = group.listeners.indexOf(listenerId);
    if (index !== -1) {
      group.listeners.splice(index, 1);
      console.log(`➖ 从组 ${groupId} 移除监听器 ${listenerId}`);
      return true;
    }
    
    return false;
  }

  /**
   * 启用/禁用监听器组
   */
  public toggleListenerGroup(groupId: string, enabled: boolean): boolean {
    const group = this.listenerGroups.get(groupId);
    if (!group) return false;

    group.enabled = enabled;
    
    // 同时启用/禁用组内所有监听器
    group.listeners.forEach(listenerId => {
      this.toggleListener(listenerId, enabled);
    });

    console.log(`${enabled ? '✅' : '❌'} ${enabled ? '启用' : '禁用'}监听器组: ${groupId}`);
    return true;
  }

  // ============================================================================
  // 中间件系统
  // ============================================================================

  /**
   * 添加中间件
   */
  public addMiddleware(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => b.priority - a.priority);
    
    console.log(`🔌 添加事件中间件: ${middleware.name} (优先级: ${middleware.priority})`);
    this.emit('middlewareAdded', middleware);
  }

  /**
   * 移除中间件
   */
  public removeMiddleware(middlewareId: string): boolean {
    const index = this.middlewares.findIndex(m => m.id === middlewareId);
    if (index === -1) return false;

    const middleware = this.middlewares[index];
    this.middlewares.splice(index, 1);
    
    console.log(`🗑️ 移除事件中间件: ${middleware.name}`);
    this.emit('middlewareRemoved', middleware);
    
    return true;
  }

  /**
   * 执行中间件链
   */
  private async executeMiddlewares(event: ProcessedEvent): Promise<void> {
    let index = 0;
    
    const executeNext = async (): Promise<void> => {
      if (index >= this.middlewares.length) return;
      
      const middleware = this.middlewares[index++];
      if (!middleware.enabled) {
        return executeNext();
      }

      try {
        await middleware.execute(event, executeNext);
      } catch (error) {
        console.error(`中间件 ${middleware.name} 执行失败:`, error);
        // 继续执行下一个中间件
        await executeNext();
      }
    };

    await executeNext();
  }

  // ============================================================================
  // 事件处理核心逻辑
  // ============================================================================

  /**
   * 处理事件
   */
  public async processEvent(event: ProcessedEvent): Promise<EventResponse[]> {
    const responses: EventResponse[] = [];

    try {
      // 执行中间件
      await this.executeMiddlewares(event);

      // 处理聚合监听器
      await this.processAggregateListeners(event);

      // 获取相关监听器
      const relevantListeners = this.getRelevantListeners(event);
      
      // 执行监听器
      for (const listener of relevantListeners) {
        const response = await this.executeListener(listener, event);
        if (response) {
          responses.push(response);
        }
      }

      // 处理条件监听器
      const conditionalResponses = await this.processConditionalListeners(event);
      responses.push(...conditionalResponses);

    } catch (error) {
      console.error('事件处理失败:', error);
    }

    return responses;
  }

  /**
   * 获取相关监听器
   */
  private getRelevantListeners(event: ProcessedEvent): EventListener[] {
    const listeners: EventListener[] = [];

    // 获取标准监听器
    for (const listener of this.listeners.values()) {
      if (this.isListenerRelevant(listener, event)) {
        listeners.push(listener);
      }
    }

    // 按优先级排序
    listeners.sort((a, b) => b.priority - a.priority);

    return listeners;
  }

  /**
   * 检查监听器是否相关
   */
  private isListenerRelevant(listener: EventListener, event: ProcessedEvent): boolean {
    if (!listener.enabled) return false;
    
    if (!listener.eventTypes.includes(event.type)) return false;
    
    if (listener.filter && !listener.filter(event)) return false;

    return true;
  }

  /**
   * 执行监听器
   */
  private async executeListener(
    listener: EventListener, 
    event: ProcessedEvent
  ): Promise<EventResponse | null> {
    const startTime = performance.now();
    let attempt = 0;
    
    while (attempt <= this.config.maxRetries) {
      try {
        // 创建隔离的执行环境（如果启用）
        const result = this.config.isolateExecution 
          ? await this.executeInIsolation(listener.callback, event)
          : await listener.callback(event);

        const executionTime = performance.now() - startTime;
        
        // 更新性能指标
        this.updatePerformanceMetrics(listener.id, executionTime, true);

        // 如果是一次性监听器，移除它
        if (listener.once) {
          this.removeListener(listener.id);
        }

        console.log(`✅ 监听器 ${listener.id} 执行成功 (耗时: ${executionTime.toFixed(2)}ms)`);

        return {
          listenerId: listener.id,
          success: true,
          result,
          executionTime
        };

      } catch (error) {
        attempt++;
        console.error(`❌ 监听器 ${listener.id} 执行失败 (尝试 ${attempt}):`, error);

        if (attempt <= this.config.maxRetries && this.config.enableErrorRecovery) {
          console.log(`🔄 重试监听器 ${listener.id} (${attempt}/${this.config.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          continue;
        }

        const executionTime = performance.now() - startTime;
        this.updatePerformanceMetrics(listener.id, executionTime, false);

        return {
          listenerId: listener.id,
          success: false,
          error: error as Error,
          executionTime
        };
      }
    }

    return null;
  }

  /**
   * 在隔离环境中执行
   */
  private async executeInIsolation(
    callback: EventCallback, 
    event: ProcessedEvent
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('监听器执行超时'));
      }, this.config.maxExecutionTime);

      try {
        const result = callback(event);
        
        if (result instanceof Promise) {
          result
            .then(resolve)
            .catch(reject)
            .finally(() => clearTimeout(timeout));
        } else {
          resolve(result);
          clearTimeout(timeout);
        }
      } catch (error) {
        reject(error);
        clearTimeout(timeout);
      }
    });
  }

  /**
   * 处理条件监听器
   */
  private async processConditionalListeners(event: ProcessedEvent): Promise<EventResponse[]> {
    const responses: EventResponse[] = [];

    for (const listener of this.conditionalListeners.values()) {
      if (!listener.enabled) continue;
      
      if (!listener.eventTypes.includes(event.type)) continue;

      try {
        const conditionsPass = await this.evaluateConditionalListener(listener, event);
        
        if (conditionsPass) {
          const response = await this.executeListener(listener, event);
          if (response) {
            responses.push(response);
          }
        }
      } catch (error) {
        console.error(`条件监听器 ${listener.id} 处理失败:`, error);
      }
    }

    return responses;
  }

  // ============================================================================
  // 性能监控
  // ============================================================================

  /**
   * 初始化性能指标
   */
  private initializePerformanceMetrics(listenerId: string): void {
    this.performanceMetrics.set(listenerId, {
      listenerId,
      totalExecutions: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: Number.MAX_SAFE_INTEGER,
      successRate: 1,
      errorCount: 0,
      lastExecutionTime: 0
    });
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(
    listenerId: string, 
    executionTime: number, 
    success: boolean
  ): void {
    const metrics = this.performanceMetrics.get(listenerId);
    if (!metrics) return;

    metrics.totalExecutions++;
    metrics.totalExecutionTime += executionTime;
    metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.totalExecutions;
    metrics.maxExecutionTime = Math.max(metrics.maxExecutionTime, executionTime);
    metrics.minExecutionTime = Math.min(metrics.minExecutionTime, executionTime);
    metrics.lastExecutionTime = executionTime;

    if (!success) {
      metrics.errorCount++;
    }
    
    metrics.successRate = (metrics.totalExecutions - metrics.errorCount) / metrics.totalExecutions;
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics(listenerId?: string): ListenerPerformanceMetrics | ListenerPerformanceMetrics[] {
    if (listenerId) {
      return this.performanceMetrics.get(listenerId) || this.createEmptyMetrics(listenerId);
    }
    
    return Array.from(this.performanceMetrics.values());
  }

  /**
   * 创建空的性能指标
   */
  private createEmptyMetrics(listenerId: string): ListenerPerformanceMetrics {
    return {
      listenerId,
      totalExecutions: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      successRate: 0,
      errorCount: 0,
      lastExecutionTime: 0
    };
  }

  // ============================================================================
  // 默认中间件设置
  // ============================================================================

  /**
   * 设置默认中间件
   */
  private setupDefaultMiddlewares(): void {
    // 日志中间件
    this.addMiddleware({
      id: 'logging',
      name: '日志记录',
      priority: 1000,
      enabled: true,
      execute: async (event, next) => {
        console.log(`📝 事件日志: ${event.type} (ID: ${event.id})`);
        await next();
      }
    });

    // 性能监控中间件
    this.addMiddleware({
      id: 'performance',
      name: '性能监控',
      priority: 900,
      enabled: this.config.enablePerformanceTracking,
      execute: async (event, next) => {
        const startTime = performance.now();
        await next();
        const duration = performance.now() - startTime;
        
        if (duration > 1000) { // 超过1秒记录警告
          console.warn(`⚠️ 事件处理耗时较长: ${event.type} (${duration.toFixed(2)}ms)`);
        }
      }
    });

    // 错误捕获中间件
    this.addMiddleware({
      id: 'error_capture',
      name: '错误捕获',
      priority: 800,
      enabled: true,
      execute: async (event, next) => {
        try {
          await next();
        } catch (error) {
          console.error(`💥 事件处理中间件错误: ${event.type}`, error);
          this.emit('middlewareError', { event, error });
          // 不重新抛出错误，允许其他中间件继续执行
        }
      }
    });
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  /**
   * 生成监听器ID
   */
  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成组ID
   */
  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    this.listeners.clear();
    this.conditionalListeners.clear();
    this.aggregateListeners.clear();
    this.listenerGroups.clear();
    this.middlewares = [];
    this.performanceMetrics.clear();
    this.eventBuffer.clear();
    
    this.removeAllListeners();
    console.log('🧹 事件监听器系统已清理');
  }

  /**
   * 获取系统统计信息
   */
  public getSystemStats(): {
    totalListeners: number;
    activeListeners: number;
    totalGroups: number;
    totalMiddlewares: number;
    averageResponseTime: number;
    totalEvents: number;
  } {
    const totalListeners = this.listeners.size + this.conditionalListeners.size;
    const activeListeners = Array.from(this.listeners.values()).filter(l => l.enabled).length +
                           Array.from(this.conditionalListeners.values()).filter(l => l.enabled).length;
    
    const allMetrics = Array.from(this.performanceMetrics.values());
    const averageResponseTime = allMetrics.length > 0 
      ? allMetrics.reduce((sum, m) => sum + m.averageExecutionTime, 0) / allMetrics.length 
      : 0;
    
    const totalEvents = allMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);

    return {
      totalListeners,
      activeListeners,
      totalGroups: this.listenerGroups.size,
      totalMiddlewares: this.middlewares.filter(m => m.enabled).length,
      averageResponseTime,
      totalEvents
    };
  }
}

export default EventListenerSystem;