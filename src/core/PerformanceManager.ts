/**
 * 性能优化和内存管理系统
 * 提供全面的性能监控、内存管理和优化功能
 */

import { getLogger, createContextLogger, ContextLogger } from './Logger';

// ===== 性能监控接口 =====

export interface PerformanceMetrics {
  readonly timestamp: number;
  readonly frameRate: number;
  readonly memoryUsage: MemoryUsage;
  readonly renderTime: number;
  readonly scriptTime: number;
  readonly networkLatency?: number;
  readonly customMetrics: Record<string, number>;
}

export interface MemoryUsage {
  readonly used: number;         // 已使用内存 (MB)
  readonly total: number;        // 总内存 (MB)
  readonly percentage: number;   // 使用百分比
  readonly jsHeapUsed?: number;  // JS堆已使用
  readonly jsHeapTotal?: number; // JS堆总大小
}

export interface PerformanceThresholds {
  readonly frameRate: number;      // 最低帧率
  readonly memoryUsage: number;    // 最大内存使用百分比
  readonly renderTime: number;     // 最大渲染时间 (ms)
  readonly scriptTime: number;     // 最大脚本执行时间 (ms)
  readonly networkLatency: number; // 最大网络延迟 (ms)
}

export interface OptimizationSuggestion {
  readonly type: 'memory' | 'performance' | 'network' | 'rendering';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message: string;
  readonly action: string;
  readonly impact: string;
}

// ===== 内存管理接口 =====

export interface MemoryPool<T> {
  acquire(): T;
  release(item: T): void;
  size(): number;
  clear(): void;
}

export interface CacheConfig {
  readonly maxSize: number;
  readonly ttl: number;          // 生存时间 (ms)
  readonly checkInterval: number; // 清理检查间隔 (ms)
}

export interface CacheEntry<T> {
  readonly value: T;
  readonly timestamp: number;
  readonly accessCount: number;
  readonly lastAccess: number;
}

// ===== 任务调度接口 =====

export interface ScheduledTask {
  readonly id: string;
  readonly callback: () => void | Promise<void>;
  readonly delay: number;
  readonly interval?: number;
  readonly maxExecutions?: number;
  readonly priority: TaskPriority;
  createdAt: number;
  executionCount: number;
  lastExecution?: number;
}

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

// ===== 对象池实现 =====

/**
 * 通用对象池
 */
export class ObjectPool<T> implements MemoryPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (item: T) => void;
  private maxSize: number;
  private logger: ContextLogger;

  constructor(
    factory: () => T,
    reset?: (item: T) => void,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
    this.logger = createContextLogger({ component: 'ObjectPool' });
  }

  acquire(): T {
    if (this.pool.length > 0) {
      const item = this.pool.pop()!;
      this.logger.debug('Object acquired from pool', { poolSize: this.pool.length });
      return item;
    }

    const item = this.factory();
    this.logger.debug('New object created', { poolSize: this.pool.length });
    return item;
  }

  release(item: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(item);
      }
      this.pool.push(item);
      this.logger.debug('Object returned to pool', { poolSize: this.pool.length });
    } else {
      this.logger.debug('Pool full, object discarded', { poolSize: this.pool.length });
    }
  }

  size(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool = [];
    this.logger.info('Object pool cleared');
  }
}

// ===== LRU缓存实现 =====

/**
 * LRU缓存
 */
export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private logger: ContextLogger;

  constructor(config: CacheConfig) {
    this.config = config;
    this.logger = createContextLogger({ component: 'LRUCache' });
    
    // 启动定期清理
    this.startCleanup();
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.logger.debug('Cache entry expired', { key });
      return undefined;
    }

    // 更新访问信息
    entry.lastAccess = Date.now();
    (entry as any).accessCount++;

    this.logger.debug('Cache hit', { 
      key, 
      accessCount: entry.accessCount,
      cacheSize: this.cache.size 
    });

    return entry.value;
  }

  set(key: K, value: V): void {
    // 检查缓存大小
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<V> = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now()
    };

    this.cache.set(key, entry);
    this.logger.debug('Cache entry added', { 
      key, 
      cacheSize: this.cache.size 
    });
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug('Cache entry deleted', { key, cacheSize: this.cache.size });
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }

  size(): number {
    return this.cache.size;
  }

  private evictLRU(): void {
    let oldestKey: K | undefined;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
      this.logger.debug('LRU cache entry evicted', { 
        key: oldestKey, 
        cacheSize: this.cache.size 
      });
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.checkInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: K[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.logger.debug('Cleanup completed', { 
        expiredEntries: keysToDelete.length,
        cacheSize: this.cache.size 
      });
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// ===== 任务调度器 =====

/**
 * 高效任务调度器
 */
export class TaskScheduler {
  private tasks = new Map<string, ScheduledTask>();
  private timers = new Map<string, NodeJS.Timeout>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private isRunning = false;
  private logger: ContextLogger;

  constructor() {
    this.logger = createContextLogger({ component: 'TaskScheduler' });
  }

  /**
   * 调度单次任务
   */
  schedule(
    id: string,
    callback: () => void | Promise<void>,
    delay: number,
    priority: TaskPriority = 'normal'
  ): void {
    const task: ScheduledTask = {
      id,
      callback,
      delay,
      priority,
      createdAt: Date.now(),
      executionCount: 0
    };

    this.tasks.set(id, task);

    const timer = setTimeout(async () => {
      await this.executeTask(task);
      this.tasks.delete(id);
      this.timers.delete(id);
    }, delay);

    this.timers.set(id, timer);
    
    this.logger.debug('Task scheduled', { 
      taskId: id, 
      delay, 
      priority,
      activeTaskCount: this.tasks.size 
    });
  }

  /**
   * 调度重复任务
   */
  scheduleRepeating(
    id: string,
    callback: () => void | Promise<void>,
    interval: number,
    maxExecutions?: number,
    priority: TaskPriority = 'normal'
  ): void {
    const task: ScheduledTask = {
      id,
      callback,
      delay: interval,
      interval,
      maxExecutions,
      priority,
      createdAt: Date.now(),
      executionCount: 0
    };

    this.tasks.set(id, task);

    const intervalTimer = setInterval(async () => {
      await this.executeTask(task);
      
      if (maxExecutions && task.executionCount >= maxExecutions) {
        this.cancel(id);
      }
    }, interval);

    this.intervals.set(id, intervalTimer);
    
    this.logger.debug('Repeating task scheduled', { 
      taskId: id, 
      interval, 
      maxExecutions,
      priority,
      activeTaskCount: this.tasks.size 
    });
  }

  /**
   * 取消任务
   */
  cancel(id: string): boolean {
    const timer = this.timers.get(id);
    const interval = this.intervals.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }

    const taskExists = this.tasks.delete(id);
    
    if (taskExists) {
      this.logger.debug('Task cancelled', { 
        taskId: id,
        activeTaskCount: this.tasks.size 
      });
    }
    
    return taskExists;
  }

  /**
   * 取消所有任务
   */
  cancelAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }

    const taskCount = this.tasks.size;
    
    this.tasks.clear();
    this.timers.clear();
    this.intervals.clear();

    this.logger.info('All tasks cancelled', { cancelledTasks: taskCount });
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(id: string): ScheduledTask | undefined {
    return this.tasks.get(id);
  }

  /**
   * 获取所有活跃任务
   */
  getActiveTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  private async executeTask(task: ScheduledTask): Promise<void> {
    const startTime = performance.now();
    
    try {
      task.executionCount++;
      task.lastExecution = Date.now();
      
      await task.callback();
      
      const duration = performance.now() - startTime;
      
      this.logger.debug('Task executed', {
        taskId: task.id,
        executionCount: task.executionCount,
        duration,
        priority: task.priority
      });
      
    } catch (error) {
      this.logger.error('Task execution failed', {
        taskId: task.id,
        executionCount: task.executionCount,
        priority: task.priority
      }, error as Error);
    }
  }
}

// ===== 性能监控器 =====

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private logger: ContextLogger;
  private customMetrics = new Map<string, number>();

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      frameRate: 30,
      memoryUsage: 80,
      renderTime: 16.67, // 60 FPS = 16.67ms per frame
      scriptTime: 10,
      networkLatency: 100,
      ...thresholds
    };
    
    this.logger = createContextLogger({ component: 'PerformanceMonitor' });
  }

  /**
   * 开始监控
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    this.logger.info('Performance monitoring started', { intervalMs });
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.logger.info('Performance monitoring stopped');
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      frameRate: this.getFrameRate(),
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.getRenderTime(),
      scriptTime: this.getScriptTime(),
      customMetrics: Object.fromEntries(this.customMetrics)
    };

    this.metrics.push(metrics);
    
    // 保持最近100个指标
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // 检查阈值
    const violations = this.checkThresholds(metrics);
    if (violations.length > 0) {
      this.logger.warn('Performance threshold violations', {
        violations,
        metrics
      });
    }
  }

  /**
   * 获取帧率
   */
  private getFrameRate(): number {
    // 简化实现，实际项目中可能需要更复杂的帧率计算
    return 60; // 假设60 FPS
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): MemoryUsage {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize / 1024 / 1024,
        total: memory.totalJSHeapSize / 1024 / 1024,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        jsHeapUsed: memory.usedJSHeapSize,
        jsHeapTotal: memory.totalJSHeapSize
      };
    }

    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  /**
   * 获取渲染时间
   */
  private getRenderTime(): number {
    // 简化实现
    return performance.now() % 20;
  }

  /**
   * 获取脚本执行时间
   */
  private getScriptTime(): number {
    // 简化实现
    return performance.now() % 15;
  }

  /**
   * 检查阈值违规
   */
  private checkThresholds(metrics: PerformanceMetrics): string[] {
    const violations: string[] = [];

    if (metrics.frameRate < this.thresholds.frameRate) {
      violations.push(`Frame rate too low: ${metrics.frameRate} < ${this.thresholds.frameRate}`);
    }

    if (metrics.memoryUsage.percentage > this.thresholds.memoryUsage) {
      violations.push(`Memory usage too high: ${metrics.memoryUsage.percentage}% > ${this.thresholds.memoryUsage}%`);
    }

    if (metrics.renderTime > this.thresholds.renderTime) {
      violations.push(`Render time too high: ${metrics.renderTime}ms > ${this.thresholds.renderTime}ms`);
    }

    if (metrics.scriptTime > this.thresholds.scriptTime) {
      violations.push(`Script time too high: ${metrics.scriptTime}ms > ${this.thresholds.scriptTime}ms`);
    }

    return violations;
  }

  /**
   * 设置自定义指标
   */
  setCustomMetric(name: string, value: number): void {
    this.customMetrics.set(name, value);
  }

  /**
   * 获取最新指标
   */
  getLatestMetrics(): PerformanceMetrics | undefined {
    return this.metrics[this.metrics.length - 1];
  }

  /**
   * 获取历史指标
   */
  getMetricsHistory(): readonly PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * 获取优化建议
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const latest = this.getLatestMetrics();
    
    if (!latest) return suggestions;

    if (latest.memoryUsage.percentage > 70) {
      suggestions.push({
        type: 'memory',
        severity: latest.memoryUsage.percentage > 90 ? 'critical' : 'high',
        message: '内存使用率过高',
        action: '清理缓存或减少对象创建',
        impact: '可能导致页面卡顿或崩溃'
      });
    }

    if (latest.frameRate < 30) {
      suggestions.push({
        type: 'performance',
        severity: latest.frameRate < 15 ? 'critical' : 'high',
        message: '帧率过低',
        action: '优化渲染逻辑或减少DOM操作',
        impact: '用户体验差，界面不流畅'
      });
    }

    if (latest.renderTime > 20) {
      suggestions.push({
        type: 'rendering',
        severity: latest.renderTime > 50 ? 'critical' : 'medium',
        message: '渲染时间过长',
        action: '使用虚拟化或减少渲染复杂度',
        impact: '界面响应慢'
      });
    }

    return suggestions;
  }
}

// ===== 主要性能管理器 =====

/**
 * 统一性能管理器
 */
export class PerformanceManager {
  private static instance: PerformanceManager | null = null;
  
  private monitor: PerformanceMonitor;
  private scheduler: TaskScheduler;
  private objectPools = new Map<string, ObjectPool<any>>();
  private caches = new Map<string, LRUCache<any, any>>();
  private logger: ContextLogger;

  constructor() {
    this.monitor = new PerformanceMonitor();
    this.scheduler = new TaskScheduler();
    this.logger = createContextLogger({ component: 'PerformanceManager' });
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  /**
   * 启动性能监控
   */
  startMonitoring(intervalMs?: number): void {
    this.monitor.startMonitoring(intervalMs);
    this.logger.info('Performance management started');
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    this.monitor.stopMonitoring();
    this.logger.info('Performance management stopped');
  }

  /**
   * 获取性能监控器
   */
  getMonitor(): PerformanceMonitor {
    return this.monitor;
  }

  /**
   * 获取任务调度器
   */
  getScheduler(): TaskScheduler {
    return this.scheduler;
  }

  /**
   * 创建对象池
   */
  createObjectPool<T>(
    name: string,
    factory: () => T,
    reset?: (item: T) => void,
    maxSize?: number
  ): ObjectPool<T> {
    const pool = new ObjectPool(factory, reset, maxSize);
    this.objectPools.set(name, pool);
    
    this.logger.info('Object pool created', { poolName: name, maxSize });
    return pool;
  }

  /**
   * 获取对象池
   */
  getObjectPool<T>(name: string): ObjectPool<T> | undefined {
    return this.objectPools.get(name);
  }

  /**
   * 创建缓存
   */
  createCache<K, V>(name: string, config: CacheConfig): LRUCache<K, V> {
    const cache = new LRUCache<K, V>(config);
    this.caches.set(name, cache);
    
    this.logger.info('Cache created', { 
      cacheName: name, 
      maxSize: config.maxSize, 
      ttl: config.ttl 
    });
    
    return cache;
  }

  /**
   * 获取缓存
   */
  getCache<K, V>(name: string): LRUCache<K, V> | undefined {
    return this.caches.get(name);
  }

  /**
   * 清理所有资源
   */
  cleanup(): void {
    this.monitor.stopMonitoring();
    this.scheduler.cancelAll();
    
    for (const pool of this.objectPools.values()) {
      pool.clear();
    }
    
    for (const cache of this.caches.values()) {
      cache.destroy();
    }
    
    this.objectPools.clear();
    this.caches.clear();
    
    this.logger.info('Performance manager cleanup completed');
  }

  /**
   * 获取系统状态报告
   */
  getStatusReport(): {
    monitoring: boolean;
    activeTasks: number;
    objectPools: number;
    caches: number;
    latestMetrics?: PerformanceMetrics;
    suggestions: OptimizationSuggestion[];
  } {
    return {
      monitoring: this.monitor['isMonitoring'],
      activeTasks: this.scheduler.getActiveTasks().length,
      objectPools: this.objectPools.size,
      caches: this.caches.size,
      latestMetrics: this.monitor.getLatestMetrics(),
      suggestions: this.monitor.getOptimizationSuggestions()
    };
  }
}

// ===== 便捷函数 =====

/**
 * 获取性能管理器实例
 */
export function getPerformanceManager(): PerformanceManager {
  return PerformanceManager.getInstance();
}

/**
 * 创建防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(null, args);
    }, wait);
  };
}

/**
 * 创建节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export default PerformanceManager;