/**
 * 事件系统架构 - Day 1 第二阶段开发计划
 * 
 * 建立事件系统的核心架构和管理机制
 * 包括：事件管理器、调度系统、类型定义、监听器机制、优先级管理等
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { 
  GameEvent, 
  EventType, 
  EventTrigger, 
  EventRarity, 
  EventChoice, 
  EventEffect, 
  EventRequirement 
} from '../types/game';

// ============================================================================
// 核心事件系统接口定义
// ============================================================================

/**
 * 事件系统核心接口
 */
export interface IEventSystem {
  // 事件管理
  registerEventType(type: EventTypeDefinition): void;
  unregisterEventType(typeId: string): void;
  
  // 事件触发和处理
  emitEvent(event: EventData): Promise<string>;
  scheduleEvent(event: EventData, delay: number): string;
  cancelEvent(eventId: string): boolean;
  
  // 监听器管理
  addEventListener(listener: EventListener): string;
  removeEventListener(listenerId: string): void;
  
  // 事件队列管理
  processEventQueue(): Promise<void>;
  clearEventQueue(): void;
  getQueueStatus(): EventQueueStatus;
  
  // 系统状态
  isActive(): boolean;
  activate(): void;
  deactivate(): void;
  destroy(): void;
}

/**
 * 事件类型定义
 */
export interface EventTypeDefinition {
  id: string;
  name: string;
  category: EventCategory;
  priority: EventPriority;
  isSystemEvent: boolean;
  requiresResponse: boolean;
  maxConcurrent: number;
  defaultTimeout: number;
  allowedTriggers: EventTrigger[];
  metadata: Record<string, any>;
}

/**
 * 事件数据结构
 */
export interface EventData {
  type: EventType;
  source: EventSource;
  target?: EventTarget;
  payload: Record<string, any>;
  context: EventContext;
  priority?: EventPriority;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * 事件监听器定义
 */
export interface EventListener {
  id: string;
  eventTypes: EventType[];
  callback: EventCallback;
  filter?: EventFilter;
  priority: number;
  once: boolean;
  enabled: boolean;
  metadata: Record<string, any>;
}

/**
 * 事件回调函数
 */
export type EventCallback = (event: ProcessedEvent) => Promise<EventResponse> | EventResponse;

/**
 * 事件过滤器
 */
export type EventFilter = (event: ProcessedEvent) => boolean;

/**
 * 已处理的事件
 */
export interface ProcessedEvent extends EventData {
  id: string;
  timestamp: number;
  status: EventStatus;
  responses: EventResponse[];
  processingTime: number;
  retryCount: number;
  error?: Error;
}

/**
 * 事件响应
 */
export interface EventResponse {
  listenerId: string;
  success: boolean;
  result?: any;
  error?: Error;
  executionTime: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// 枚举类型定义
// ============================================================================

/**
 * 事件分类
 */
export enum EventCategory {
  SYSTEM = 'system',           // 系统事件
  GAME_LOGIC = 'game_logic',   // 游戏逻辑事件
  USER_INPUT = 'user_input',   // 用户输入事件
  NETWORK = 'network',         // 网络事件
  ANIMATION = 'animation',     // 动画事件
  AUDIO = 'audio',            // 音频事件
  UI = 'ui',                  // 界面事件
  SKILL = 'skill',            // 技能事件
  ZODIAC = 'zodiac',          // 生肖事件
  RANDOM = 'random',          // 随机事件
  CUSTOM = 'custom'           // 自定义事件
}

/**
 * 事件优先级
 */
export enum EventPriority {
  IMMEDIATE = 1000,   // 立即执行
  CRITICAL = 800,     // 关键优先级
  HIGH = 600,         // 高优先级
  NORMAL = 400,       // 普通优先级
  LOW = 200,          // 低优先级
  DEFERRED = 100      // 延迟执行
}

/**
 * 事件状态
 */
export enum EventStatus {
  PENDING = 'pending',       // 等待处理
  PROCESSING = 'processing', // 正在处理
  COMPLETED = 'completed',   // 已完成
  FAILED = 'failed',         // 处理失败
  CANCELLED = 'cancelled',   // 已取消
  TIMEOUT = 'timeout'        // 超时
}

/**
 * 事件源类型
 */
export enum EventSource {
  SYSTEM = 'system',
  PLAYER = 'player',
  AI = 'ai',
  GAME_ENGINE = 'game_engine',
  SKILL_SYSTEM = 'skill_system',
  ANIMATION_SYSTEM = 'animation_system',
  UI_SYSTEM = 'ui_system',
  NETWORK = 'network',
  EXTERNAL = 'external'
}

/**
 * 事件目标类型
 */
export enum EventTarget {
  SYSTEM = 'system',
  ALL_PLAYERS = 'all_players',
  SPECIFIC_PLAYER = 'specific_player',
  CURRENT_PLAYER = 'current_player',
  GAME_STATE = 'game_state',
  UI = 'ui',
  ANIMATION = 'animation',
  AUDIO = 'audio'
}

// ============================================================================
// 辅助接口定义
// ============================================================================

/**
 * 事件上下文
 */
export interface EventContext {
  gameId: string;
  playerId?: string;
  turnId?: string;
  roundId?: string;
  sessionId: string;
  timestamp: number;
  environment: GameEnvironment;
  userAgent?: string;
}

/**
 * 游戏环境信息
 */
export interface GameEnvironment {
  gameMode: string;
  playerCount: number;
  currentPhase: string;
  season: string;
  weather: string;
  specialConditions: string[];
}

/**
 * 事件队列状态
 */
export interface EventQueueStatus {
  totalEvents: number;
  pendingEvents: number;
  processingEvents: number;
  completedEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  queueHealth: 'healthy' | 'warning' | 'critical';
}

/**
 * 事件调度配置
 */
export interface EventScheduleConfig {
  maxConcurrentEvents: number;
  maxQueueSize: number;
  processingInterval: number;
  retryAttempts: number;
  retryDelay: number;
  timeoutDuration: number;
  enablePriorityProcessing: boolean;
  enableBatchProcessing: boolean;
}

/**
 * 事件性能指标
 */
export interface EventPerformanceMetrics {
  totalEventsProcessed: number;
  averageProcessingTime: number;
  maxProcessingTime: number;
  minProcessingTime: number;
  eventsPerSecond: number;
  errorRate: number;
  timeoutRate: number;
  memoryUsage: number;
  queueLength: number;
}

// ============================================================================
// 事件系统核心架构实现
// ============================================================================

/**
 * 事件系统管理器
 * 负责整个事件系统的协调和管理
 */
export class EventSystemManager extends EventEmitter implements IEventSystem {
  private eventTypes = new Map<string, EventTypeDefinition>();
  private listeners = new Map<string, EventListener>();
  private eventQueue: ProcessedEvent[] = [];
  private scheduledEvents = new Map<string, NodeJS.Timeout>();
  private processingEvents = new Set<string>();
  private config: EventScheduleConfig;
  private metrics: EventPerformanceMetrics;
  private isSystemActive = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(config?: Partial<EventScheduleConfig>) {
    super();
    
    this.config = {
      maxConcurrentEvents: 10,
      maxQueueSize: 1000,
      processingInterval: 16, // ~60 FPS
      retryAttempts: 3,
      retryDelay: 1000,
      timeoutDuration: 5000,
      enablePriorityProcessing: true,
      enableBatchProcessing: true,
      ...config
    };

    this.metrics = {
      totalEventsProcessed: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: Number.MAX_SAFE_INTEGER,
      eventsPerSecond: 0,
      errorRate: 0,
      timeoutRate: 0,
      memoryUsage: 0,
      queueLength: 0
    };

    this.initializeSystemEvents();
  }

  // ============================================================================
  // 系统管理方法
  // ============================================================================

  /**
   * 激活事件系统
   */
  public activate(): void {
    if (this.isSystemActive) return;

    this.isSystemActive = true;
    this.startProcessingLoop();
    
    console.log('🎯 事件系统已激活');
    this.emit('systemActivated');
  }

  /**
   * 停用事件系统
   */
  public deactivate(): void {
    if (!this.isSystemActive) return;

    this.isSystemActive = false;
    this.stopProcessingLoop();
    
    console.log('⏹️ 事件系统已停用');
    this.emit('systemDeactivated');
  }

  /**
   * 检查系统是否激活
   */
  public isActive(): boolean {
    return this.isSystemActive;
  }

  /**
   * 销毁事件系统
   */
  public destroy(): void {
    this.deactivate();
    
    // 清理所有定时器
    this.scheduledEvents.forEach(timeout => clearTimeout(timeout));
    this.scheduledEvents.clear();
    
    // 清理数据
    this.eventTypes.clear();
    this.listeners.clear();
    this.eventQueue = [];
    this.processingEvents.clear();
    
    // 移除所有监听器
    this.removeAllListeners();
    
    console.log('🗑️ 事件系统已销毁');
  }

  // ============================================================================
  // 事件类型管理
  // ============================================================================

  /**
   * 注册事件类型
   */
  public registerEventType(type: EventTypeDefinition): void {
    if (this.eventTypes.has(type.id)) {
      console.warn(`事件类型 ${type.id} 已存在，将被覆盖`);
    }

    this.eventTypes.set(type.id, type);
    console.log(`📝 注册事件类型: ${type.name} (${type.id})`);
    
    this.emit('eventTypeRegistered', type);
  }

  /**
   * 注销事件类型
   */
  public unregisterEventType(typeId: string): void {
    const type = this.eventTypes.get(typeId);
    if (!type) {
      console.warn(`事件类型 ${typeId} 不存在`);
      return;
    }

    this.eventTypes.delete(typeId);
    console.log(`🗑️ 注销事件类型: ${type.name} (${typeId})`);
    
    this.emit('eventTypeUnregistered', type);
  }

  /**
   * 获取事件类型定义
   */
  public getEventType(typeId: string): EventTypeDefinition | undefined {
    return this.eventTypes.get(typeId);
  }

  /**
   * 获取所有事件类型
   */
  public getAllEventTypes(): EventTypeDefinition[] {
    return Array.from(this.eventTypes.values());
  }

  // ============================================================================
  // 事件监听器管理
  // ============================================================================

  /**
   * 添加事件监听器
   */
  public addEventListener(listener: EventListener): string {
    const listenerId = listener.id || this.generateListenerId();
    const fullListener = { ...listener, id: listenerId };
    
    this.listeners.set(listenerId, fullListener);
    console.log(`👂 添加事件监听器: ${listenerId} (类型: ${listener.eventTypes.join(', ')})`);
    
    this.emit('listenerAdded', fullListener);
    return listenerId;
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(listenerId: string): void {
    const listener = this.listeners.get(listenerId);
    if (!listener) {
      console.warn(`监听器 ${listenerId} 不存在`);
      return;
    }

    this.listeners.delete(listenerId);
    console.log(`🗑️ 移除事件监听器: ${listenerId}`);
    
    this.emit('listenerRemoved', listener);
  }

  /**
   * 获取监听器
   */
  public getEventListener(listenerId: string): EventListener | undefined {
    return this.listeners.get(listenerId);
  }

  /**
   * 获取所有监听器
   */
  public getAllEventListeners(): EventListener[] {
    return Array.from(this.listeners.values());
  }

  // ============================================================================
  // 事件发射和调度
  // ============================================================================

  /**
   * 发射事件
   */
  public async emitEvent(event: EventData): Promise<string> {
    const processedEvent = this.createProcessedEvent(event);
    
    // 检查队列大小
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      throw new Error(`事件队列已满 (${this.config.maxQueueSize})`);
    }

    // 添加到队列
    this.eventQueue.push(processedEvent);
    
    // 如果启用优先级处理，重新排序队列
    if (this.config.enablePriorityProcessing) {
      this.sortEventQueue();
    }

    console.log(`🎯 事件已发射: ${processedEvent.type} (ID: ${processedEvent.id})`);
    this.emit('eventEmitted', processedEvent);
    
    return processedEvent.id;
  }

  /**
   * 调度延迟事件
   */
  public scheduleEvent(event: EventData, delay: number): string {
    const processedEvent = this.createProcessedEvent(event);
    
    const timeout = setTimeout(() => {
      this.emitEvent(event);
      this.scheduledEvents.delete(processedEvent.id);
    }, delay);

    this.scheduledEvents.set(processedEvent.id, timeout);
    
    console.log(`⏰ 事件已调度: ${processedEvent.type} (延迟: ${delay}ms)`);
    this.emit('eventScheduled', { event: processedEvent, delay });
    
    return processedEvent.id;
  }

  /**
   * 取消事件
   */
  public cancelEvent(eventId: string): boolean {
    // 取消调度的事件
    const scheduledTimeout = this.scheduledEvents.get(eventId);
    if (scheduledTimeout) {
      clearTimeout(scheduledTimeout);
      this.scheduledEvents.delete(eventId);
      console.log(`❌ 取消调度事件: ${eventId}`);
      this.emit('eventCancelled', eventId);
      return true;
    }

    // 取消队列中的事件
    const queueIndex = this.eventQueue.findIndex(e => e.id === eventId);
    if (queueIndex !== -1) {
      const event = this.eventQueue[queueIndex];
      event.status = EventStatus.CANCELLED;
      console.log(`❌ 取消队列事件: ${eventId}`);
      this.emit('eventCancelled', eventId);
      return true;
    }

    return false;
  }

  // ============================================================================
  // 事件处理和队列管理
  // ============================================================================

  /**
   * 处理事件队列
   */
  public async processEventQueue(): Promise<void> {
    if (!this.isSystemActive || this.eventQueue.length === 0) return;

    const maxConcurrent = this.config.maxConcurrentEvents;
    const currentProcessing = this.processingEvents.size;

    if (currentProcessing >= maxConcurrent) return;

    const eventsToProcess = this.eventQueue
      .filter(e => e.status === EventStatus.PENDING)
      .slice(0, maxConcurrent - currentProcessing);

    const processingPromises = eventsToProcess.map(event => this.processEvent(event));
    
    if (this.config.enableBatchProcessing && processingPromises.length > 1) {
      await Promise.all(processingPromises);
    } else {
      for (const promise of processingPromises) {
        await promise;
      }
    }
  }

  /**
   * 处理单个事件
   */
  private async processEvent(event: ProcessedEvent): Promise<void> {
    if (this.processingEvents.has(event.id)) return;

    this.processingEvents.add(event.id);
    event.status = EventStatus.PROCESSING;

    const startTime = performance.now();
    
    try {
      console.log(`⚡ 开始处理事件: ${event.type} (ID: ${event.id})`);

      // 获取相关监听器
      const relevantListeners = this.getRelevantListeners(event);
      
      // 执行监听器回调
      const responses = await this.executeListeners(event, relevantListeners);
      
      // 更新事件状态
      event.responses = responses;
      event.status = EventStatus.COMPLETED;
      event.processingTime = performance.now() - startTime;

      // 更新性能指标
      this.updateMetrics(event);

      console.log(`✅ 事件处理完成: ${event.type} (耗时: ${event.processingTime.toFixed(2)}ms)`);
      this.emit('eventProcessed', event);

    } catch (error) {
      event.error = error as Error;
      event.status = EventStatus.FAILED;
      event.processingTime = performance.now() - startTime;

      console.error(`❌ 事件处理失败: ${event.type}`, error);
      this.emit('eventProcessingFailed', { event, error });

      // 重试机制
      if (event.retryCount < this.config.retryAttempts) {
        event.retryCount++;
        event.status = EventStatus.PENDING;
        
        setTimeout(() => {
          this.processEvent(event);
        }, this.config.retryDelay);
      }
    } finally {
      this.processingEvents.delete(event.id);
      
      // 从队列中移除已完成的事件
      if (event.status !== EventStatus.PENDING) {
        const index = this.eventQueue.indexOf(event);
        if (index !== -1) {
          this.eventQueue.splice(index, 1);
        }
      }
    }
  }

  /**
   * 清空事件队列
   */
  public clearEventQueue(): void {
    const queueLength = this.eventQueue.length;
    this.eventQueue = [];
    this.processingEvents.clear();
    
    console.log(`🗑️ 清空事件队列 (${queueLength} 个事件)`);
    this.emit('eventQueueCleared', queueLength);
  }

  /**
   * 获取队列状态
   */
  public getQueueStatus(): EventQueueStatus {
    const totalEvents = this.eventQueue.length;
    const pendingEvents = this.eventQueue.filter(e => e.status === EventStatus.PENDING).length;
    const processingEvents = this.processingEvents.size;
    const completedEvents = this.eventQueue.filter(e => e.status === EventStatus.COMPLETED).length;
    const failedEvents = this.eventQueue.filter(e => e.status === EventStatus.FAILED).length;

    const processingTimes = this.eventQueue
      .filter(e => e.processingTime > 0)
      .map(e => e.processingTime);
    
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;

    let queueHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (totalEvents > this.config.maxQueueSize * 0.8) {
      queueHealth = 'warning';
    }
    if (totalEvents > this.config.maxQueueSize * 0.95) {
      queueHealth = 'critical';
    }

    return {
      totalEvents,
      pendingEvents,
      processingEvents,
      completedEvents,
      failedEvents,
      averageProcessingTime,
      queueHealth
    };
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  /**
   * 初始化系统事件类型
   */
  private initializeSystemEvents(): void {
    const systemEventTypes: EventTypeDefinition[] = [
      {
        id: 'system.startup',
        name: '系统启动',
        category: EventCategory.SYSTEM,
        priority: EventPriority.CRITICAL,
        isSystemEvent: true,
        requiresResponse: false,
        maxConcurrent: 1,
        defaultTimeout: 1000,
        allowedTriggers: ['system' as EventTrigger],
        metadata: {}
      },
      {
        id: 'system.shutdown',
        name: '系统关闭',
        category: EventCategory.SYSTEM,
        priority: EventPriority.CRITICAL,
        isSystemEvent: true,
        requiresResponse: false,
        maxConcurrent: 1,
        defaultTimeout: 1000,
        allowedTriggers: ['system' as EventTrigger],
        metadata: {}
      },
      {
        id: 'game.turn_start',
        name: '回合开始',
        category: EventCategory.GAME_LOGIC,
        priority: EventPriority.HIGH,
        isSystemEvent: false,
        requiresResponse: false,
        maxConcurrent: 1,
        defaultTimeout: 3000,
        allowedTriggers: ['turn_start' as EventTrigger],
        metadata: {}
      },
      {
        id: 'game.turn_end',
        name: '回合结束',
        category: EventCategory.GAME_LOGIC,
        priority: EventPriority.HIGH,
        isSystemEvent: false,
        requiresResponse: false,
        maxConcurrent: 1,
        defaultTimeout: 3000,
        allowedTriggers: ['turn_end' as EventTrigger],
        metadata: {}
      }
    ];

    systemEventTypes.forEach(type => this.registerEventType(type));
  }

  /**
   * 创建已处理事件对象
   */
  private createProcessedEvent(event: EventData): ProcessedEvent {
    return {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
      status: EventStatus.PENDING,
      responses: [],
      processingTime: 0,
      retryCount: 0,
      priority: event.priority || EventPriority.NORMAL
    };
  }

  /**
   * 生成事件ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成监听器ID
   */
  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 排序事件队列
   */
  private sortEventQueue(): void {
    this.eventQueue.sort((a, b) => {
      // 首先按优先级排序
      if (a.priority !== b.priority) {
        return (b.priority || EventPriority.NORMAL) - (a.priority || EventPriority.NORMAL);
      }
      
      // 然后按时间戳排序（先进先出）
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * 获取相关监听器
   */
  private getRelevantListeners(event: ProcessedEvent): EventListener[] {
    return Array.from(this.listeners.values())
      .filter(listener => 
        listener.enabled &&
        listener.eventTypes.includes(event.type) &&
        (!listener.filter || listener.filter(event))
      )
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 执行监听器
   */
  private async executeListeners(
    event: ProcessedEvent, 
    listeners: EventListener[]
  ): Promise<EventResponse[]> {
    const responses: EventResponse[] = [];

    for (const listener of listeners) {
      const startTime = performance.now();
      
      try {
        const result = await Promise.race([
          listener.callback(event),
          this.createTimeoutPromise(this.config.timeoutDuration)
        ]);

        responses.push({
          listenerId: listener.id,
          success: true,
          result,
          executionTime: performance.now() - startTime
        });

        // 如果是一次性监听器，移除它
        if (listener.once) {
          this.removeEventListener(listener.id);
        }

      } catch (error) {
        responses.push({
          listenerId: listener.id,
          success: false,
          error: error as Error,
          executionTime: performance.now() - startTime
        });
      }
    }

    return responses;
  }

  /**
   * 创建超时Promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Listener execution timeout')), timeout);
    });
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(event: ProcessedEvent): void {
    this.metrics.totalEventsProcessed++;
    
    if (event.processingTime > this.metrics.maxProcessingTime) {
      this.metrics.maxProcessingTime = event.processingTime;
    }
    
    if (event.processingTime < this.metrics.minProcessingTime) {
      this.metrics.minProcessingTime = event.processingTime;
    }

    // 更新平均处理时间
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalEventsProcessed - 1) + event.processingTime) 
      / this.metrics.totalEventsProcessed;

    // 更新错误率
    const failedResponses = event.responses.filter(r => !r.success).length;
    if (failedResponses > 0) {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.totalEventsProcessed - 1) + failedResponses) 
        / this.metrics.totalEventsProcessed;
    }

    this.metrics.queueLength = this.eventQueue.length;
  }

  /**
   * 开始处理循环
   */
  private startProcessingLoop(): void {
    this.processingInterval = setInterval(() => {
      this.processEventQueue();
    }, this.config.processingInterval);
  }

  /**
   * 停止处理循环
   */
  private stopProcessingLoop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics(): EventPerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 重置性能指标
   */
  public resetPerformanceMetrics(): void {
    this.metrics = {
      totalEventsProcessed: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: Number.MAX_SAFE_INTEGER,
      eventsPerSecond: 0,
      errorRate: 0,
      timeoutRate: 0,
      memoryUsage: 0,
      queueLength: 0
    };
  }
}

export default EventSystemManager;