/**
 * 事件管理器和调度系统
 * 
 * 提供高级事件管理功能，包括：
 * - 智能事件调度
 * - 事件依赖管理
 * - 批量事件处理
 * - 事件流水线
 * - 条件触发系统
 */

import { EventEmitter } from '../utils/EventEmitter';
import { 
  EventSystemManager, 
  EventData, 
  ProcessedEvent, 
  EventListener,
  EventPriority,
  EventStatus,
  EventCallback,
  EventResponse,
  EventPerformanceMetrics
} from './EventSystemArchitecture';
import type { GameState, Player } from '../types/game';

// ============================================================================
// 高级事件管理接口
// ============================================================================

/**
 * 事件依赖定义
 */
export interface EventDependency {
  eventId: string;
  dependsOn: string[];
  timeout?: number;
  onTimeout?: 'cancel' | 'proceed' | 'retry';
  maxRetries?: number;
}

/**
 * 事件条件
 */
export interface EventCondition {
  id: string;
  name: string;
  evaluate: (context: EventContext) => boolean | Promise<boolean>;
  priority: number;
  metadata?: Record<string, any>;
}

/**
 * 事件管道阶段
 */
export interface EventPipelineStage {
  id: string;
  name: string;
  processor: (event: ProcessedEvent, context: EventContext) => Promise<ProcessedEvent>;
  canSkip: boolean;
  onError?: 'stop' | 'skip' | 'retry';
  retryAttempts?: number;
}

/**
 * 事件批处理配置
 */
export interface BatchProcessingConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  groupBy?: (event: ProcessedEvent) => string;
  processor: (events: ProcessedEvent[], context: EventContext) => Promise<ProcessedEvent[]>;
}

/**
 * 事件上下文
 */
export interface EventContext {
  gameState: GameState;
  currentPlayer?: Player;
  sessionId: string;
  metadata: Record<string, any>;
  timestamp: number;
}

/**
 * 事件流定义
 */
export interface EventFlow {
  id: string;
  name: string;
  stages: EventPipelineStage[];
  conditions: EventCondition[];
  onComplete?: (results: ProcessedEvent[]) => void;
  onError?: (error: Error, stage?: EventPipelineStage) => void;
}

/**
 * 事件模板
 */
export interface EventTemplate {
  id: string;
  name: string;
  type: string;
  defaultPriority: EventPriority;
  payloadSchema: Record<string, any>;
  requiredContext: string[];
  generator: (params: Record<string, any>, context: EventContext) => EventData;
}

// ============================================================================
// 高级事件管理器实现
// ============================================================================

/**
 * 高级事件管理器
 * 基于核心事件系统，提供更高级的管理功能
 */
export class AdvancedEventManager extends EventEmitter {
  private eventSystem: EventSystemManager;
  private dependencies = new Map<string, EventDependency>();
  private conditions = new Map<string, EventCondition>();
  private pipelines = new Map<string, EventFlow>();
  private templates = new Map<string, EventTemplate>();
  private batchConfigs = new Map<string, BatchProcessingConfig>();
  private pendingBatches = new Map<string, ProcessedEvent[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private eventHistory: ProcessedEvent[] = [];
  private maxHistorySize = 1000;

  constructor(eventSystem?: EventSystemManager) {
    super();
    this.eventSystem = eventSystem || new EventSystemManager();
    this.setupDefaultTemplates();
    this.setupEventHistoryTracking();
  }

  // ============================================================================
  // 智能事件调度
  // ============================================================================

  /**
   * 智能调度事件
   * 考虑依赖关系、条件和优先级
   */
  public async scheduleSmartEvent(
    event: EventData,
    options: {
      dependencies?: string[];
      conditions?: string[];
      pipeline?: string;
      delay?: number;
      batch?: string;
    } = {}
  ): Promise<string> {
    const eventId = await this.eventSystem.emitEvent(event);

    // 设置依赖关系
    if (options.dependencies && options.dependencies.length > 0) {
      this.dependencies.set(eventId, {
        eventId,
        dependsOn: options.dependencies,
        timeout: 30000, // 30秒超时
        onTimeout: 'cancel'
      });
    }

    // 延迟调度
    if (options.delay && options.delay > 0) {
      return this.eventSystem.scheduleEvent(event, options.delay);
    }

    // 批处理
    if (options.batch) {
      await this.addToBatch(options.batch, eventId);
    }

    // 管道处理
    if (options.pipeline) {
      await this.processThroughPipeline(eventId, options.pipeline);
    }

    return eventId;
  }

  /**
   * 条件触发事件
   */
  public async triggerConditionalEvent(
    event: EventData,
    conditionIds: string[],
    context: EventContext
  ): Promise<string | null> {
    // 评估所有条件
    for (const conditionId of conditionIds) {
      const condition = this.conditions.get(conditionId);
      if (!condition) {
        console.warn(`条件 ${conditionId} 不存在`);
        continue;
      }

      const result = await condition.evaluate(context);
      if (!result) {
        console.log(`条件 ${conditionId} 未满足，事件取消`);
        return null;
      }
    }

    // 所有条件满足，触发事件
    return this.eventSystem.emitEvent(event);
  }

  /**
   * 创建事件链
   * 按顺序执行一系列事件
   */
  public async createEventChain(
    events: EventData[],
    options: {
      stopOnError?: boolean;
      delayBetween?: number;
      context?: EventContext;
    } = {}
  ): Promise<string[]> {
    const eventIds: string[] = [];
    const { stopOnError = true, delayBetween = 0 } = options;

    for (let i = 0; i < events.length; i++) {
      try {
        const eventId = await this.eventSystem.emitEvent(events[i]);
        eventIds.push(eventId);

        // 等待事件处理完成
        await this.waitForEventCompletion(eventId);

        // 延迟
        if (delayBetween > 0 && i < events.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetween));
        }

      } catch (error) {
        console.error(`事件链中第 ${i + 1} 个事件失败:`, error);
        
        if (stopOnError) {
          break;
        }
      }
    }

    return eventIds;
  }

  // ============================================================================
  // 事件依赖管理
  // ============================================================================

  /**
   * 添加事件依赖
   */
  public addEventDependency(dependency: EventDependency): void {
    this.dependencies.set(dependency.eventId, dependency);
    console.log(`➕ 添加事件依赖: ${dependency.eventId} → [${dependency.dependsOn.join(', ')}]`);
  }

  /**
   * 移除事件依赖
   */
  public removeEventDependency(eventId: string): void {
    this.dependencies.delete(eventId);
    console.log(`➖ 移除事件依赖: ${eventId}`);
  }

  /**
   * 检查依赖是否满足
   */
  private async checkDependencies(eventId: string): Promise<boolean> {
    const dependency = this.dependencies.get(eventId);
    if (!dependency) return true;

    const dependentEvents = dependency.dependsOn;
    
    for (const depEventId of dependentEvents) {
      const isCompleted = await this.isEventCompleted(depEventId);
      if (!isCompleted) {
        console.log(`事件 ${eventId} 依赖 ${depEventId} 尚未完成`);
        return false;
      }
    }

    return true;
  }

  /**
   * 等待事件完成
   */
  private async waitForEventCompletion(eventId: string, timeout = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        const completed = await this.isEventCompleted(eventId);
        if (completed) {
          clearInterval(checkInterval);
          clearTimeout(timeoutTimer);
          resolve();
        }
      }, 100);

      const timeoutTimer = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`事件 ${eventId} 处理超时`));
      }, timeout);
    });
  }

  /**
   * 检查事件是否完成
   */
  private async isEventCompleted(eventId: string): Promise<boolean> {
    // 在事件历史中查找
    return this.eventHistory.some(event => 
      event.id === eventId && 
      (event.status === EventStatus.COMPLETED || event.status === EventStatus.FAILED)
    );
  }

  // ============================================================================
  // 事件条件系统
  // ============================================================================

  /**
   * 注册事件条件
   */
  public registerCondition(condition: EventCondition): void {
    this.conditions.set(condition.id, condition);
    console.log(`📋 注册事件条件: ${condition.name} (${condition.id})`);
  }

  /**
   * 注销事件条件
   */
  public unregisterCondition(conditionId: string): void {
    this.conditions.delete(conditionId);
    console.log(`🗑️ 注销事件条件: ${conditionId}`);
  }

  /**
   * 评估条件
   */
  public async evaluateCondition(conditionId: string, context: EventContext): Promise<boolean> {
    const condition = this.conditions.get(conditionId);
    if (!condition) {
      console.warn(`条件 ${conditionId} 不存在`);
      return false;
    }

    try {
      return await condition.evaluate(context);
    } catch (error) {
      console.error(`条件 ${conditionId} 评估失败:`, error);
      return false;
    }
  }

  // ============================================================================
  // 事件管道处理
  // ============================================================================

  /**
   * 注册事件流水线
   */
  public registerPipeline(flow: EventFlow): void {
    this.pipelines.set(flow.id, flow);
    console.log(`🔄 注册事件流水线: ${flow.name} (${flow.id})`);
  }

  /**
   * 注销事件流水线
   */
  public unregisterPipeline(flowId: string): void {
    this.pipelines.delete(flowId);
    console.log(`🗑️ 注销事件流水线: ${flowId}`);
  }

  /**
   * 通过管道处理事件
   */
  private async processThroughPipeline(eventId: string, pipelineId: string): Promise<void> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      console.warn(`流水线 ${pipelineId} 不存在`);
      return;
    }

    // 获取事件
    const event = this.eventHistory.find(e => e.id === eventId);
    if (!event) {
      console.warn(`事件 ${eventId} 不存在`);
      return;
    }

    const context: EventContext = {
      gameState: event.context.gameState,
      sessionId: event.context.sessionId,
      metadata: event.context.metadata || {},
      timestamp: Date.now()
    };

    try {
      let processedEvent = event;

      // 依次通过每个阶段
      for (const stage of pipeline.stages) {
        try {
          console.log(`🔄 处理阶段: ${stage.name}`);
          processedEvent = await stage.processor(processedEvent, context);
          
        } catch (error) {
          console.error(`阶段 ${stage.name} 处理失败:`, error);
          
          if (stage.onError === 'stop') {
            throw error;
          } else if (stage.onError === 'skip') {
            console.log(`跳过阶段: ${stage.name}`);
            continue;
          } else if (stage.onError === 'retry' && stage.retryAttempts) {
            // 重试逻辑
            let retries = 0;
            while (retries < stage.retryAttempts) {
              try {
                processedEvent = await stage.processor(processedEvent, context);
                break;
              } catch (retryError) {
                retries++;
                console.log(`阶段 ${stage.name} 重试 ${retries}/${stage.retryAttempts}`);
                if (retries >= stage.retryAttempts) {
                  throw retryError;
                }
              }
            }
          }
        }
      }

      if (pipeline.onComplete) {
        pipeline.onComplete([processedEvent]);
      }

    } catch (error) {
      if (pipeline.onError) {
        pipeline.onError(error as Error);
      }
      throw error;
    }
  }

  // ============================================================================
  // 批量事件处理
  // ============================================================================

  /**
   * 注册批处理配置
   */
  public registerBatchProcessing(batchId: string, config: BatchProcessingConfig): void {
    this.batchConfigs.set(batchId, config);
    this.pendingBatches.set(batchId, []);
    console.log(`📦 注册批处理配置: ${batchId}`);
  }

  /**
   * 添加事件到批处理
   */
  private async addToBatch(batchId: string, eventId: string): Promise<void> {
    const config = this.batchConfigs.get(batchId);
    if (!config) {
      console.warn(`批处理配置 ${batchId} 不存在`);
      return;
    }

    const event = this.eventHistory.find(e => e.id === eventId);
    if (!event) return;

    let batch = this.pendingBatches.get(batchId) || [];
    batch.push(event);

    // 检查是否达到批处理条件
    if (batch.length >= config.maxBatchSize) {
      await this.processBatch(batchId);
    } else {
      // 设置超时处理
      this.resetBatchTimer(batchId, config.maxWaitTime);
    }
  }

  /**
   * 处理批次
   */
  private async processBatch(batchId: string): Promise<void> {
    const config = this.batchConfigs.get(batchId);
    const batch = this.pendingBatches.get(batchId);

    if (!config || !batch || batch.length === 0) return;

    // 清除定时器
    const timer = this.batchTimers.get(batchId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchId);
    }

    try {
      console.log(`📦 处理批次: ${batchId} (${batch.length} 个事件)`);
      
      const context: EventContext = {
        gameState: batch[0].context.gameState,
        sessionId: batch[0].context.sessionId,
        metadata: {},
        timestamp: Date.now()
      };

      await config.processor(batch, context);
      
      // 清空批次
      this.pendingBatches.set(batchId, []);
      
    } catch (error) {
      console.error(`批处理 ${batchId} 失败:`, error);
    }
  }

  /**
   * 重置批处理定时器
   */
  private resetBatchTimer(batchId: string, delay: number): void {
    // 清除现有定时器
    const existingTimer = this.batchTimers.get(batchId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 设置新定时器
    const timer = setTimeout(() => {
      this.processBatch(batchId);
    }, delay);

    this.batchTimers.set(batchId, timer);
  }

  // ============================================================================
  // 事件模板系统
  // ============================================================================

  /**
   * 注册事件模板
   */
  public registerTemplate(template: EventTemplate): void {
    this.templates.set(template.id, template);
    console.log(`📝 注册事件模板: ${template.name} (${template.id})`);
  }

  /**
   * 从模板创建事件
   */
  public createEventFromTemplate(
    templateId: string,
    params: Record<string, any>,
    context: EventContext
  ): EventData | null {
    const template = this.templates.get(templateId);
    if (!template) {
      console.warn(`事件模板 ${templateId} 不存在`);
      return null;
    }

    try {
      return template.generator(params, context);
    } catch (error) {
      console.error(`从模板 ${templateId} 创建事件失败:`, error);
      return null;
    }
  }

  // ============================================================================
  // 事件历史和分析
  // ============================================================================

  /**
   * 设置事件历史跟踪
   */
  private setupEventHistoryTracking(): void {
    this.eventSystem.on('eventProcessed', (event: ProcessedEvent) => {
      this.addToHistory(event);
    });

    this.eventSystem.on('eventProcessingFailed', (data: { event: ProcessedEvent; error: Error }) => {
      this.addToHistory(data.event);
    });
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(event: ProcessedEvent): void {
    this.eventHistory.push(event);
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.splice(0, this.eventHistory.length - this.maxHistorySize);
    }
  }

  /**
   * 获取事件历史
   */
  public getEventHistory(filter?: (event: ProcessedEvent) => boolean): ProcessedEvent[] {
    if (filter) {
      return this.eventHistory.filter(filter);
    }
    return [...this.eventHistory];
  }

  /**
   * 分析事件模式
   */
  public analyzeEventPatterns(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    averageProcessingTime: number;
    errorRate: number;
    mostFrequentEvents: Array<{ type: string; count: number }>;
  } {
    const totalEvents = this.eventHistory.length;
    const eventsByType: Record<string, number> = {};
    let totalProcessingTime = 0;
    let errorCount = 0;

    for (const event of this.eventHistory) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      totalProcessingTime += event.processingTime;
      
      if (event.status === EventStatus.FAILED) {
        errorCount++;
      }
    }

    const averageProcessingTime = totalEvents > 0 ? totalProcessingTime / totalEvents : 0;
    const errorRate = totalEvents > 0 ? errorCount / totalEvents : 0;

    const mostFrequentEvents = Object.entries(eventsByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents,
      eventsByType,
      averageProcessingTime,
      errorRate,
      mostFrequentEvents
    };
  }

  // ============================================================================
  // 默认模板设置
  // ============================================================================

  /**
   * 设置默认事件模板
   */
  private setupDefaultTemplates(): void {
    // 游戏状态变更模板
    this.registerTemplate({
      id: 'game_state_change',
      name: '游戏状态变更',
      type: 'game_logic',
      defaultPriority: EventPriority.HIGH,
      payloadSchema: {
        previousState: 'string',
        newState: 'string',
        reason: 'string'
      },
      requiredContext: ['gameState'],
      generator: (params, context) => ({
        type: 'game_state_changed' as any,
        source: 'system' as any,
        payload: {
          previousState: params.previousState,
          newState: params.newState,
          reason: params.reason,
          timestamp: Date.now()
        },
        context,
        priority: EventPriority.HIGH
      })
    });

    // 玩家行动模板
    this.registerTemplate({
      id: 'player_action',
      name: '玩家行动',
      type: 'user_input',
      defaultPriority: EventPriority.NORMAL,
      payloadSchema: {
        playerId: 'string',
        actionType: 'string',
        actionData: 'object'
      },
      requiredContext: ['gameState', 'currentPlayer'],
      generator: (params, context) => ({
        type: 'player_action' as any,
        source: 'player' as any,
        target: 'game_state' as any,
        payload: {
          playerId: params.playerId,
          actionType: params.actionType,
          actionData: params.actionData,
          timestamp: Date.now()
        },
        context,
        priority: EventPriority.NORMAL
      })
    });

    // 技能使用模板
    this.registerTemplate({
      id: 'skill_usage',
      name: '技能使用',
      type: 'skill',
      defaultPriority: EventPriority.HIGH,
      payloadSchema: {
        playerId: 'string',
        skillId: 'string',
        targets: 'array',
        context: 'object'
      },
      requiredContext: ['gameState'],
      generator: (params, context) => ({
        type: 'skill_used' as any,
        source: 'skill_system' as any,
        payload: {
          playerId: params.playerId,
          skillId: params.skillId,
          targets: params.targets,
          skillContext: params.context,
          timestamp: Date.now()
        },
        context,
        priority: EventPriority.HIGH
      })
    });
  }

  // ============================================================================
  // 公共接口方法
  // ============================================================================

  /**
   * 获取底层事件系统
   */
  public getEventSystem(): EventSystemManager {
    return this.eventSystem;
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics(): EventPerformanceMetrics {
    return this.eventSystem.getPerformanceMetrics();
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    // 清理定时器
    this.batchTimers.forEach(timer => clearTimeout(timer));
    this.batchTimers.clear();

    // 清理数据
    this.dependencies.clear();
    this.conditions.clear();
    this.pipelines.clear();
    this.templates.clear();
    this.batchConfigs.clear();
    this.pendingBatches.clear();
    this.eventHistory = [];

    // 销毁底层事件系统
    this.eventSystem.destroy();

    console.log('🗑️ 高级事件管理器已销毁');
  }
}

export default AdvancedEventManager;