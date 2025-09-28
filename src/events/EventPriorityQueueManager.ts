/**
 * 事件优先级和队列管理系统
 * 
 * 提供高效的事件优先级管理和队列处理，包括：
 * - 多级优先级队列
 * - 智能负载均衡
 * - 事件调度策略
 * - 队列性能优化
 * - 资源管理
 */

import { EventEmitter } from '../utils/EventEmitter';
import { 
  ProcessedEvent, 
  EventPriority, 
  EventStatus, 
  EventCategory,
  EventPerformanceMetrics 
} from './EventSystemArchitecture';

// ============================================================================
// 队列管理接口定义
// ============================================================================

/**
 * 优先级队列配置
 */
export interface PriorityQueueConfig {
  maxQueueSize: number;
  maxConcurrentEvents: number;
  processingInterval: number;
  enableLoadBalancing: boolean;
  enableAdaptiveScheduling: boolean;
  priorityWeights: Record<EventPriority, number>;
  categoryWeights: Record<EventCategory, number>;
  timeSliceSize: number;
  maxProcessingTime: number;
}

/**
 * 队列统计信息
 */
export interface QueueStatistics {
  totalEvents: number;
  queuesByPriority: Record<EventPriority, number>;
  queuesByCategory: Record<EventCategory, number>;
  processingRate: number;
  averageWaitTime: number;
  maxWaitTime: number;
  throughput: number;
  congestionLevel: 'low' | 'medium' | 'high' | 'critical';
  memoryUsage: number;
}

/**
 * 事件调度策略
 */
export interface SchedulingStrategy {
  id: string;
  name: string;
  selectNext: (queues: Map<EventPriority, ProcessedEvent[]>) => ProcessedEvent | null;
  shouldProcess: (event: ProcessedEvent, context: SchedulingContext) => boolean;
  priority: number;
}

/**
 * 调度上下文
 */
export interface SchedulingContext {
  currentLoad: number;
  processingEvents: Set<string>;
  availableSlots: number;
  timeSliceRemaining: number;
  systemResources: {
    cpuUsage: number;
    memoryUsage: number;
    queuePressure: number;
  };
}

/**
 * 负载均衡器
 */
export interface LoadBalancer {
  id: string;
  name: string;
  distributeEvent: (event: ProcessedEvent, queues: Map<EventPriority, ProcessedEvent[]>) => EventPriority;
  shouldThrottle: (context: SchedulingContext) => boolean;
  adjustPriority: (event: ProcessedEvent, context: SchedulingContext) => EventPriority;
}

// ============================================================================
// 优先级队列管理器实现
// ============================================================================

/**
 * 事件优先级队列管理器
 */
export class EventPriorityQueueManager extends EventEmitter {
  private queues = new Map<EventPriority, ProcessedEvent[]>();
  private processingEvents = new Set<string>();
  private config: PriorityQueueConfig;
  private schedulingStrategies: SchedulingStrategy[] = [];
  private loadBalancers: LoadBalancer[] = [];
  private currentStrategy?: SchedulingStrategy;
  private statistics: QueueStatistics;
  private processingInterval?: NodeJS.Timeout;
  private performanceHistory: Array<{ timestamp: number; metrics: EventPerformanceMetrics }> = [];
  private isProcessing = false;
  private timeSliceStart = 0;

  constructor(config?: Partial<PriorityQueueConfig>) {
    super();
    
    this.config = {
      maxQueueSize: 1000,
      maxConcurrentEvents: 10,
      processingInterval: 16, // ~60 FPS
      enableLoadBalancing: true,
      enableAdaptiveScheduling: true,
      priorityWeights: {
        [EventPriority.IMMEDIATE]: 1000,
        [EventPriority.CRITICAL]: 800,
        [EventPriority.HIGH]: 600,
        [EventPriority.NORMAL]: 400,
        [EventPriority.LOW]: 200,
        [EventPriority.DEFERRED]: 100
      },
      categoryWeights: {
        [EventCategory.SYSTEM]: 1000,
        [EventCategory.GAME_LOGIC]: 800,
        [EventCategory.USER_INPUT]: 700,
        [EventCategory.NETWORK]: 600,
        [EventCategory.SKILL]: 500,
        [EventCategory.ANIMATION]: 300,
        [EventCategory.AUDIO]: 200,
        [EventCategory.UI]: 400,
        [EventCategory.ZODIAC]: 300,
        [EventCategory.RANDOM]: 200,
        [EventCategory.CUSTOM]: 100
      },
      timeSliceSize: 16, // 16ms per time slice
      maxProcessingTime: 10, // 10ms max per event
      ...config
    };

    this.initializeQueues();
    this.initializeStatistics();
    this.setupDefaultStrategies();
    this.setupDefaultLoadBalancers();
    this.startProcessing();
  }

  // ============================================================================
  // 队列管理
  // ============================================================================

  /**
   * 添加事件到队列
   */
  public enqueue(event: ProcessedEvent): boolean {
    // 检查队列是否已满
    if (this.getTotalQueueSize() >= this.config.maxQueueSize) {
      console.warn(`⚠️ 队列已满，丢弃事件: ${event.type} (${event.id})`);
      this.emit('eventDropped', event);
      return false;
    }

    // 应用负载均衡
    let targetPriority = event.priority || EventPriority.NORMAL;
    if (this.config.enableLoadBalancing && this.loadBalancers.length > 0) {
      const context = this.createSchedulingContext();
      const balancer = this.loadBalancers[0]; // 使用第一个负载均衡器
      targetPriority = balancer.distributeEvent(event, this.queues);
    }

    // 获取目标队列
    const queue = this.queues.get(targetPriority);
    if (!queue) {
      console.error(`❌ 优先级队列 ${targetPriority} 不存在`);
      return false;
    }

    // 添加到队列
    queue.push(event);
    event.status = EventStatus.PENDING;
    
    // 更新统计信息
    this.updateStatistics();

    console.log(`📥 事件入队: ${event.type} (优先级: ${targetPriority}, 队列长度: ${queue.length})`);
    this.emit('eventEnqueued', { event, priority: targetPriority });

    return true;
  }

  /**
   * 从队列中取出事件
   */
  public dequeue(): ProcessedEvent | null {
    if (this.processingEvents.size >= this.config.maxConcurrentEvents) {
      return null; // 达到最大并发数
    }

    // 使用当前调度策略选择事件
    const strategy = this.currentStrategy || this.schedulingStrategies[0];
    if (!strategy) {
      return null;
    }

    const event = strategy.selectNext(this.queues);
    if (!event) {
      return null;
    }

    // 从队列中移除
    for (const [priority, queue] of this.queues) {
      const index = queue.indexOf(event);
      if (index !== -1) {
        queue.splice(index, 1);
        break;
      }
    }

    // 标记为处理中
    this.processingEvents.add(event.id);
    event.status = EventStatus.PROCESSING;

    console.log(`📤 事件出队: ${event.type} (ID: ${event.id})`);
    this.emit('eventDequeued', event);

    return event;
  }

  /**
   * 标记事件处理完成
   */
  public markEventCompleted(eventId: string, success: boolean = true): void {
    if (this.processingEvents.has(eventId)) {
      this.processingEvents.delete(eventId);
      
      console.log(`✅ 事件处理完成: ${eventId} (成功: ${success})`);
      this.emit('eventCompleted', { eventId, success });
    }
  }

  /**
   * 清空指定优先级的队列
   */
  public clearQueue(priority?: EventPriority): void {
    if (priority) {
      const queue = this.queues.get(priority);
      if (queue) {
        const clearedCount = queue.length;
        queue.length = 0;
        console.log(`🗑️ 清空 ${priority} 优先级队列 (${clearedCount} 个事件)`);
      }
    } else {
      let totalCleared = 0;
      for (const queue of this.queues.values()) {
        totalCleared += queue.length;
        queue.length = 0;
      }
      console.log(`🗑️ 清空所有队列 (${totalCleared} 个事件)`);
    }
    
    this.updateStatistics();
    this.emit('queueCleared', priority);
  }

  // ============================================================================
  // 调度策略管理
  // ============================================================================

  /**
   * 注册调度策略
   */
  public registerSchedulingStrategy(strategy: SchedulingStrategy): void {
    this.schedulingStrategies.push(strategy);
    this.schedulingStrategies.sort((a, b) => b.priority - a.priority);
    
    // 如果没有当前策略，设置为第一个
    if (!this.currentStrategy) {
      this.currentStrategy = strategy;
    }

    console.log(`📋 注册调度策略: ${strategy.name} (优先级: ${strategy.priority})`);
    this.emit('strategyRegistered', strategy);
  }

  /**
   * 切换调度策略
   */
  public setSchedulingStrategy(strategyId: string): boolean {
    const strategy = this.schedulingStrategies.find(s => s.id === strategyId);
    if (!strategy) {
      console.warn(`调度策略 ${strategyId} 不存在`);
      return false;
    }

    this.currentStrategy = strategy;
    console.log(`🔄 切换调度策略: ${strategy.name}`);
    this.emit('strategyChanged', strategy);
    
    return true;
  }

  /**
   * 注册负载均衡器
   */
  public registerLoadBalancer(balancer: LoadBalancer): void {
    this.loadBalancers.push(balancer);
    
    console.log(`⚖️ 注册负载均衡器: ${balancer.name}`);
    this.emit('loadBalancerRegistered', balancer);
  }

  // ============================================================================
  // 自适应调度
  // ============================================================================

  /**
   * 自适应调度
   * 根据系统负载和性能自动调整调度策略
   */
  private performAdaptiveScheduling(): void {
    if (!this.config.enableAdaptiveScheduling) return;

    const context = this.createSchedulingContext();
    
    // 检查系统负载
    if (context.systemResources.queuePressure > 0.8) {
      // 高负载情况，切换到高效策略
      const efficientStrategy = this.schedulingStrategies.find(s => s.id === 'fifo_priority');
      if (efficientStrategy && this.currentStrategy?.id !== efficientStrategy.id) {
        this.setSchedulingStrategy(efficientStrategy.id);
      }
    } else if (context.systemResources.queuePressure < 0.3) {
      // 低负载情况，可以使用复杂策略
      const complexStrategy = this.schedulingStrategies.find(s => s.id === 'weighted_round_robin');
      if (complexStrategy && this.currentStrategy?.id !== complexStrategy.id) {
        this.setSchedulingStrategy(complexStrategy.id);
      }
    }

    // 根据负载均衡器建议进行节流
    if (this.loadBalancers.length > 0) {
      const shouldThrottle = this.loadBalancers[0].shouldThrottle(context);
      if (shouldThrottle) {
        this.throttleProcessing();
      }
    }
  }

  /**
   * 创建调度上下文
   */
  private createSchedulingContext(): SchedulingContext {
    const totalEvents = this.getTotalQueueSize();
    const currentLoad = this.processingEvents.size / this.config.maxConcurrentEvents;
    const queuePressure = totalEvents / this.config.maxQueueSize;

    return {
      currentLoad,
      processingEvents: new Set(this.processingEvents),
      availableSlots: this.config.maxConcurrentEvents - this.processingEvents.size,
      timeSliceRemaining: this.config.timeSliceSize - (Date.now() - this.timeSliceStart),
      systemResources: {
        cpuUsage: currentLoad,
        memoryUsage: this.estimateMemoryUsage(),
        queuePressure
      }
    };
  }

  /**
   * 节流处理
   */
  private throttleProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = setInterval(() => {
        this.processQueue();
      }, this.config.processingInterval * 2); // 降低处理频率
      
      console.log('🐌 启用处理节流');
      this.emit('throttlingEnabled');
    }
  }

  // ============================================================================
  // 队列处理
  // ============================================================================

  /**
   * 开始队列处理
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingInterval);
    
    console.log('🚀 队列处理已启动');
  }

  /**
   * 停止队列处理
   */
  public stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
      console.log('⏹️ 队列处理已停止');
    }
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.timeSliceStart = Date.now();

    try {
      // 自适应调度
      this.performAdaptiveScheduling();

      // 处理事件直到时间片用完或没有更多事件
      while (this.hasTimeSliceLeft() && this.hasAvailableSlots()) {
        const event = this.dequeue();
        if (!event) break;

        // 异步处理事件
        this.processEventAsync(event);
      }

      // 更新统计信息
      this.updateStatistics();

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 异步处理事件
   */
  private async processEventAsync(event: ProcessedEvent): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`⚡ 开始处理事件: ${event.type} (ID: ${event.id})`);
      
      // 模拟事件处理（实际实现中会调用具体的处理器）
      await this.simulateEventProcessing(event);
      
      const processingTime = Date.now() - startTime;
      event.processingTime = processingTime;
      event.status = EventStatus.COMPLETED;

      console.log(`✅ 事件处理完成: ${event.type} (耗时: ${processingTime}ms)`);
      this.emit('eventProcessed', event);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      event.processingTime = processingTime;
      event.status = EventStatus.FAILED;
      event.error = error as Error;

      console.error(`❌ 事件处理失败: ${event.type}`, error);
      this.emit('eventProcessingFailed', { event, error });

    } finally {
      this.markEventCompleted(event.id, event.status === EventStatus.COMPLETED);
    }
  }

  /**
   * 模拟事件处理
   */
  private async simulateEventProcessing(event: ProcessedEvent): Promise<void> {
    // 根据事件类型模拟不同的处理时间
    const processingTime = this.getEstimatedProcessingTime(event);
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟偶发的处理失败
        if (Math.random() < 0.05) { // 5% 失败率
          reject(new Error('模拟事件处理失败'));
        } else {
          resolve();
        }
      }, Math.min(processingTime, this.config.maxProcessingTime));
    });
  }

  /**
   * 获取预估处理时间
   */
  private getEstimatedProcessingTime(event: ProcessedEvent): number {
    // 根据事件优先级和类型估算处理时间
    const baseTimes: Record<EventPriority, number> = {
      [EventPriority.IMMEDIATE]: 1,
      [EventPriority.CRITICAL]: 2,
      [EventPriority.HIGH]: 3,
      [EventPriority.NORMAL]: 5,
      [EventPriority.LOW]: 8,
      [EventPriority.DEFERRED]: 10
    };

    return baseTimes[event.priority || EventPriority.NORMAL] || 5;
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  /**
   * 检查是否还有时间片
   */
  private hasTimeSliceLeft(): boolean {
    return (Date.now() - this.timeSliceStart) < this.config.timeSliceSize;
  }

  /**
   * 检查是否有可用槽位
   */
  private hasAvailableSlots(): boolean {
    return this.processingEvents.size < this.config.maxConcurrentEvents;
  }

  /**
   * 获取总队列大小
   */
  private getTotalQueueSize(): number {
    return Array.from(this.queues.values()).reduce((total, queue) => total + queue.length, 0);
  }

  /**
   * 估算内存使用量
   */
  private estimateMemoryUsage(): number {
    const totalEvents = this.getTotalQueueSize() + this.processingEvents.size;
    return totalEvents * 1024; // 假设每个事件1KB
  }

  /**
   * 初始化队列
   */
  private initializeQueues(): void {
    for (const priority of Object.values(EventPriority)) {
      this.queues.set(priority, []);
    }
    console.log('📋 优先级队列已初始化');
  }

  /**
   * 初始化统计信息
   */
  private initializeStatistics(): void {
    this.statistics = {
      totalEvents: 0,
      queuesByPriority: Object.values(EventPriority).reduce((acc, priority) => {
        acc[priority] = 0;
        return acc;
      }, {} as Record<EventPriority, number>),
      queuesByCategory: Object.values(EventCategory).reduce((acc, category) => {
        acc[category] = 0;
        return acc;
      }, {} as Record<EventCategory, number>),
      processingRate: 0,
      averageWaitTime: 0,
      maxWaitTime: 0,
      throughput: 0,
      congestionLevel: 'low',
      memoryUsage: 0
    };
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(): void {
    const totalEvents = this.getTotalQueueSize();
    
    // 更新队列统计
    this.statistics.totalEvents = totalEvents;
    
    for (const [priority, queue] of this.queues) {
      this.statistics.queuesByPriority[priority] = queue.length;
    }

    // 计算拥堵级别
    const congestionRatio = totalEvents / this.config.maxQueueSize;
    if (congestionRatio > 0.9) {
      this.statistics.congestionLevel = 'critical';
    } else if (congestionRatio > 0.7) {
      this.statistics.congestionLevel = 'high';
    } else if (congestionRatio > 0.4) {
      this.statistics.congestionLevel = 'medium';
    } else {
      this.statistics.congestionLevel = 'low';
    }

    this.statistics.memoryUsage = this.estimateMemoryUsage();

    // 发送统计更新事件
    this.emit('statisticsUpdated', this.statistics);
  }

  /**
   * 设置默认调度策略
   */
  private setupDefaultStrategies(): void {
    // FIFO 优先级策略
    this.registerSchedulingStrategy({
      id: 'fifo_priority',
      name: 'FIFO 优先级',
      priority: 100,
      selectNext: (queues) => {
        for (const priority of Object.values(EventPriority).sort((a, b) => b - a)) {
          const queue = queues.get(priority);
          if (queue && queue.length > 0) {
            return queue[0];
          }
        }
        return null;
      },
      shouldProcess: () => true
    });

    // 加权轮询策略
    this.registerSchedulingStrategy({
      id: 'weighted_round_robin',
      name: '加权轮询',
      priority: 200,
      selectNext: (queues) => {
        const weights = this.config.priorityWeights;
        let bestEvent: ProcessedEvent | null = null;
        let bestScore = -1;

        for (const [priority, queue] of queues) {
          if (queue.length === 0) continue;
          
          const weight = weights[priority] || 0;
          const age = Date.now() - queue[0].timestamp;
          const score = weight + (age * 0.001); // 考虑年龄因素

          if (score > bestScore) {
            bestScore = score;
            bestEvent = queue[0];
          }
        }

        return bestEvent;
      },
      shouldProcess: () => true
    });
  }

  /**
   * 设置默认负载均衡器
   */
  private setupDefaultLoadBalancers(): void {
    this.registerLoadBalancer({
      id: 'adaptive_balancer',
      name: '自适应负载均衡器',
      distributeEvent: (event, queues) => {
        const context = this.createSchedulingContext();
        
        // 如果系统负载高，降低事件优先级
        if (context.systemResources.queuePressure > 0.8) {
          const currentPriority = event.priority || EventPriority.NORMAL;
          const priorities = Object.values(EventPriority).sort((a, b) => a - b);
          const currentIndex = priorities.indexOf(currentPriority);
          
          if (currentIndex > 0) {
            return priorities[currentIndex - 1];
          }
        }
        
        return event.priority || EventPriority.NORMAL;
      },
      shouldThrottle: (context) => {
        return context.systemResources.queuePressure > 0.9 || context.currentLoad > 0.8;
      },
      adjustPriority: (event, context) => {
        return event.priority || EventPriority.NORMAL;
      }
    });
  }

  // ============================================================================
  // 公共接口
  // ============================================================================

  /**
   * 获取队列统计信息
   */
  public getStatistics(): QueueStatistics {
    return { ...this.statistics };
  }

  /**
   * 获取队列状态
   */
  public getQueueStatus(): Record<EventPriority, number> {
    const status: Record<EventPriority, number> = {} as any;
    for (const [priority, queue] of this.queues) {
      status[priority] = queue.length;
    }
    return status;
  }

  /**
   * 获取处理中的事件数量
   */
  public getProcessingCount(): number {
    return this.processingEvents.size;
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    this.stopProcessing();
    this.clearQueue();
    this.processingEvents.clear();
    this.schedulingStrategies = [];
    this.loadBalancers = [];
    this.currentStrategy = undefined;
    this.performanceHistory = [];
    
    this.removeAllListeners();
    console.log('🧹 优先级队列管理器已清理');
  }
}

export default EventPriorityQueueManager;