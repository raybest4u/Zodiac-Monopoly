/**
 * 事件处理器 - 高性能的事件处理和响应系统
 * 支持批量处理、优先级队列、错误恢复等功能
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { GameEvent, EventType, EventPriority } from './EventSystem';

export interface ProcessingOptions {
  batchSize?: number;
  maxConcurrent?: number;
  timeoutMs?: number;
  retryAttempts?: number;
  priorityWeights?: Record<EventPriority, number>;
}

export interface EventProcessor {
  id: string;
  name: string;
  eventTypes: EventType[];
  priority: number;
  enabled: boolean;
  
  // 处理函数
  process: (event: GameEvent, context: ProcessingContext) => Promise<ProcessingResult> | ProcessingResult;
  
  // 配置选项
  options: {
    concurrent?: boolean; // 是否可以并发处理
    timeout?: number; // 处理超时时间
    retries?: number; // 重试次数
    dependencies?: string[]; // 依赖的其他处理器
  };
  
  // 统计信息
  stats: {
    processed: number;
    succeeded: number;
    failed: number;
    averageTime: number;
    lastProcessed?: number;
  };
}

export interface ProcessingContext {
  gameState: any;
  eventHistory: GameEvent[];
  processingId: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: Error;
  warnings?: string[];
  nextEvents?: Omit<GameEvent, 'id' | 'timestamp' | 'processed'>[];
  stateChanges?: any;
  duration: number;
}

export interface EventBatch {
  id: string;
  events: GameEvent[];
  priority: EventPriority;
  timestamp: number;
  processed: boolean;
}

/**
 * 高性能事件处理系统
 */
export class EventProcessingSystem extends EventEmitter {
  private processors = new Map<string, EventProcessor>();
  private eventQueue: GameEvent[] = [];
  private processingQueue: GameEvent[] = [];
  private batchQueue: EventBatch[] = [];
  
  private isProcessing = false;
  private processedCount = 0;
  private failedCount = 0;
  
  private readonly options: Required<ProcessingOptions>;
  
  constructor(options: ProcessingOptions = {}) {
    super();
    
    this.options = {
      batchSize: options.batchSize || 10,
      maxConcurrent: options.maxConcurrent || 3,
      timeoutMs: options.timeoutMs || 5000,
      retryAttempts: options.retryAttempts || 2,
      priorityWeights: {
        low: 1,
        normal: 2,
        high: 3,
        critical: 4,
        ...options.priorityWeights
      }
    };
    
    this.startProcessingLoop();
  }

  /**
   * 注册事件处理器
   */
  registerProcessor(processor: EventProcessor): void {
    this.validateProcessor(processor);
    
    this.processors.set(processor.id, {
      ...processor,
      stats: {
        processed: 0,
        succeeded: 0,
        failed: 0,
        averageTime: 0
      }
    });

    this.emit('processorRegistered', processor);
  }

  /**
   * 移除事件处理器
   */
  unregisterProcessor(processorId: string): void {
    this.processors.delete(processorId);
    this.emit('processorUnregistered', { processorId });
  }

  /**
   * 添加事件到处理队列
   */
  addEvent(event: GameEvent): void {
    // 验证事件
    if (!this.validateEvent(event)) {
      this.emit('eventValidationFailed', { event, reason: 'Invalid event format' });
      return;
    }

    this.eventQueue.push(event);
    this.emit('eventQueued', event);
  }

  /**
   * 批量添加事件
   */
  addEventBatch(events: GameEvent[], priority: EventPriority = 'normal'): string {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const batch: EventBatch = {
      id: batchId,
      events: events.filter(event => this.validateEvent(event)),
      priority,
      timestamp: Date.now(),
      processed: false
    };

    this.batchQueue.push(batch);
    this.emit('batchQueued', batch);
    
    return batchId;
  }

  /**
   * 处理单个事件
   */
  async processEvent(event: GameEvent, context: ProcessingContext): Promise<ProcessingResult[]> {
    if (event.processed) {
      return [];
    }

    const applicableProcessors = this.getApplicableProcessors(event);
    if (applicableProcessors.length === 0) {
      event.processed = true;
      return [];
    }

    const results: ProcessingResult[] = [];
    
    // 按优先级和依赖关系排序处理器
    const sortedProcessors = this.sortProcessorsByPriority(applicableProcessors);
    
    for (const processor of sortedProcessors) {
      try {
        const startTime = Date.now();
        const result = await this.executeProcessor(processor, event, context);
        const duration = Date.now() - startTime;
        
        result.duration = duration;
        results.push(result);
        
        this.updateProcessorStats(processor, result, duration);
        
        // 处理结果中的下一级事件
        if (result.nextEvents) {
          for (const nextEventData of result.nextEvents) {
            const nextEvent: GameEvent = {
              ...nextEventData,
              id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              processed: false
            };
            this.addEvent(nextEvent);
          }
        }
        
        // 如果处理失败且不是关键错误，继续处理其他处理器
        if (!result.success && processor.options.retries === 0) {
          console.warn(`Processor ${processor.id} failed for event ${event.id}:`, result.error);
        }
        
      } catch (error) {
        console.error(`Critical error in processor ${processor.id}:`, error);
        this.emit('processorError', { processor, event, error });
      }
    }

    event.processed = true;
    this.processedCount++;
    
    return results;
  }

  /**
   * 处理事件批次
   */
  async processBatch(batch: EventBatch, context: ProcessingContext): Promise<ProcessingResult[]> {
    if (batch.processed) return [];

    const allResults: ProcessingResult[] = [];
    const concurrentGroups: GameEvent[][] = [];
    
    // 将事件分组以支持并发处理
    for (let i = 0; i < batch.events.length; i += this.options.maxConcurrent) {
      concurrentGroups.push(batch.events.slice(i, i + this.options.maxConcurrent));
    }

    for (const group of concurrentGroups) {
      const groupPromises = group.map(event => this.processEvent(event, context));
      const groupResults = await Promise.all(groupPromises);
      
      for (const results of groupResults) {
        allResults.push(...results);
      }
    }

    batch.processed = true;
    this.emit('batchProcessed', { batch, results: allResults });
    
    return allResults;
  }

  /**
   * 获取处理器统计信息
   */
  getProcessorStats(processorId?: string): any {
    if (processorId) {
      const processor = this.processors.get(processorId);
      return processor ? processor.stats : null;
    }

    const stats: any = {};
    for (const [id, processor] of this.processors.entries()) {
      stats[id] = processor.stats;
    }
    return stats;
  }

  /**
   * 获取系统统计信息
   */
  getSystemStats(): any {
    return {
      processedEvents: this.processedCount,
      failedEvents: this.failedCount,
      queueSize: this.eventQueue.length,
      processingQueueSize: this.processingQueue.length,
      batchQueueSize: this.batchQueue.length,
      registeredProcessors: this.processors.size,
      isProcessing: this.isProcessing
    };
  }

  // 私有方法

  /**
   * 验证处理器配置
   */
  private validateProcessor(processor: EventProcessor): void {
    if (!processor.id || !processor.name) {
      throw new Error('Processor must have id and name');
    }
    
    if (!processor.eventTypes || processor.eventTypes.length === 0) {
      throw new Error('Processor must specify event types');
    }
    
    if (typeof processor.process !== 'function') {
      throw new Error('Processor must have a process function');
    }
  }

  /**
   * 验证事件格式
   */
  private validateEvent(event: GameEvent): boolean {
    return !!(event.id && event.type && event.timestamp !== undefined);
  }

  /**
   * 获取适用的处理器
   */
  private getApplicableProcessors(event: GameEvent): EventProcessor[] {
    const applicable: EventProcessor[] = [];
    
    for (const processor of this.processors.values()) {
      if (!processor.enabled) continue;
      
      if (processor.eventTypes.includes(event.type) || processor.eventTypes.includes('*' as EventType)) {
        applicable.push(processor);
      }
    }
    
    return applicable;
  }

  /**
   * 按优先级排序处理器
   */
  private sortProcessorsByPriority(processors: EventProcessor[]): EventProcessor[] {
    return processors.sort((a, b) => {
      // 首先按优先级排序
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // 高优先级优先
      }
      
      // 然后按依赖关系排序
      if (a.options.dependencies?.includes(b.id)) {
        return 1; // a 依赖 b，所以 b 先执行
      }
      if (b.options.dependencies?.includes(a.id)) {
        return -1; // b 依赖 a，所以 a 先执行
      }
      
      return 0;
    });
  }

  /**
   * 执行处理器
   */
  private async executeProcessor(
    processor: EventProcessor, 
    event: GameEvent, 
    context: ProcessingContext
  ): Promise<ProcessingResult> {
    const timeout = processor.options.timeout || this.options.timeoutMs;
    const retries = processor.options.retries || this.options.retryAttempts;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await this.executeWithTimeout(
          () => processor.process(event, context),
          timeout
        );
        
        if (typeof result === 'object' && result !== null) {
          return result as ProcessingResult;
        }
        
        return {
          success: true,
          data: result,
          duration: 0
        };
        
      } catch (error) {
        if (attempt === retries) {
          return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            duration: 0
          };
        }
        
        // 指数退避重试
        const delay = Math.pow(2, attempt) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: new Error('Max retries exceeded'),
      duration: 0
    };
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T> | T,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * 更新处理器统计信息
   */
  private updateProcessorStats(processor: EventProcessor, result: ProcessingResult, duration: number): void {
    processor.stats.processed++;
    processor.stats.lastProcessed = Date.now();
    
    if (result.success) {
      processor.stats.succeeded++;
    } else {
      processor.stats.failed++;
      this.failedCount++;
    }
    
    // 更新平均处理时间
    const totalTime = processor.stats.averageTime * (processor.stats.processed - 1) + duration;
    processor.stats.averageTime = totalTime / processor.stats.processed;
  }

  /**
   * 开始处理循环
   */
  private startProcessingLoop(): void {
    setInterval(async () => {
      if (this.isProcessing) return;
      
      await this.processQueues();
    }, 50); // 20fps
  }

  /**
   * 处理队列
   */
  private async processQueues(): Promise<void> {
    this.isProcessing = true;

    try {
      // 处理批次队列
      const batchesToProcess = this.batchQueue
        .filter(batch => !batch.processed)
        .sort((a, b) => this.options.priorityWeights[b.priority] - this.options.priorityWeights[a.priority])
        .slice(0, this.options.batchSize);

      for (const batch of batchesToProcess) {
        const context: ProcessingContext = {
          gameState: this.getGameState(),
          eventHistory: this.getRecentEventHistory(),
          processingId: `proc_${Date.now()}`,
          timestamp: Date.now(),
          metadata: {}
        };

        await this.processBatch(batch, context);
      }

      // 处理单个事件队列
      const eventsToProcess = this.eventQueue
        .filter(event => !event.processed)
        .sort((a, b) => this.options.priorityWeights[b.priority] - this.options.priorityWeights[a.priority])
        .slice(0, this.options.batchSize);

      for (const event of eventsToProcess) {
        const context: ProcessingContext = {
          gameState: this.getGameState(),
          eventHistory: this.getRecentEventHistory(),
          processingId: `proc_${Date.now()}`,
          timestamp: Date.now(),
          metadata: {}
        };

        await this.processEvent(event, context);
      }

      // 清理已处理的事件
      this.eventQueue = this.eventQueue.filter(event => !event.processed);
      this.batchQueue = this.batchQueue.filter(batch => !batch.processed);

    } catch (error) {
      console.error('Error in processing loop:', error);
      this.emit('processingError', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 获取游戏状态（需要外部提供）
   */
  private getGameState(): any {
    // 这个方法应该由外部依赖注入或通过回调提供
    return {};
  }

  /**
   * 获取最近的事件历史
   */
  private getRecentEventHistory(): GameEvent[] {
    // 返回最近处理的事件，用于上下文分析
    return [];
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.processors.clear();
    this.eventQueue = [];
    this.processingQueue = [];
    this.batchQueue = [];
    this.removeAllListeners();
  }
}