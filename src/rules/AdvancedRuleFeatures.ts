/**
 * 高级规则特性 - 为规则引擎提供事务、死锁检测、熔断器等高级功能
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { PlayerAction, GameState } from '../types/game';

export interface QueuedExecution {
  id: string;
  action: PlayerAction;
  gameState: GameState;
  priority: number;
  timestamp: number;
  timeout: number;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

/**
 * 优先级队列实现
 */
export class PriorityQueue<T extends { priority: number }> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
    this.items.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }

  toArray(): T[] {
    return [...this.items];
  }
}

/**
 * 死锁检测器
 */
export class DeadlockDetector extends EventEmitter {
  private dependencyGraph = new Map<string, Set<string>>();
  private lockWaitMap = new Map<string, string[]>(); // transactionId -> waiting for resources
  private detectionInterval: NodeJS.Timeout | null = null;
  private readonly detectionFrequency = 5000; // 5秒检测一次

  constructor() {
    super();
    this.startDetection();
  }

  /**
   * 添加锁依赖
   */
  addLockDependency(transactionId: string, resourceId: string, waitingFor: string[]): void {
    if (!this.dependencyGraph.has(transactionId)) {
      this.dependencyGraph.set(transactionId, new Set());
    }
    
    for (const dependency of waitingFor) {
      this.dependencyGraph.get(transactionId)!.add(dependency);
    }
    
    this.lockWaitMap.set(transactionId, waitingFor);
    
    // 立即检测是否产生死锁
    const deadlock = this.detectDeadlock();
    if (deadlock.length > 0) {
      this.emit('deadlockDetected', deadlock);
    }
  }

  /**
   * 移除锁依赖
   */
  removeLockDependency(transactionId: string): void {
    this.dependencyGraph.delete(transactionId);
    this.lockWaitMap.delete(transactionId);
  }

  /**
   * 检测死锁
   */
  detectDeadlock(): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const transactionId of this.dependencyGraph.keys()) {
      if (!visited.has(transactionId)) {
        const cycle = this.dfsDetectCycle(transactionId, visited, recursionStack);
        if (cycle.length > 0) {
          return cycle;
        }
      }
    }
    
    return [];
  }

  /**
   * DFS检测环
   */
  private dfsDetectCycle(
    transactionId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[] = []
  ): string[] {
    visited.add(transactionId);
    recursionStack.add(transactionId);
    path.push(transactionId);
    
    const dependencies = this.dependencyGraph.get(transactionId) || new Set();
    
    for (const dependency of dependencies) {
      if (!visited.has(dependency)) {
        const cycle = this.dfsDetectCycle(dependency, visited, recursionStack, [...path]);
        if (cycle.length > 0) {
          return cycle;
        }
      } else if (recursionStack.has(dependency)) {
        // 找到环
        const cycleStart = path.indexOf(dependency);
        return path.slice(cycleStart);
      }
    }
    
    recursionStack.delete(transactionId);
    return [];
  }

  /**
   * 开始死锁检测
   */
  private startDetection(): void {
    this.detectionInterval = setInterval(() => {
      const deadlock = this.detectDeadlock();
      if (deadlock.length > 0) {
        this.emit('deadlockDetected', deadlock);
      }
    }, this.detectionFrequency);
  }

  /**
   * 停止死锁检测
   */
  stopDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  /**
   * 获取依赖图信息
   */
  getDependencyInfo(): any {
    return {
      transactionCount: this.dependencyGraph.size,
      dependencies: Array.from(this.dependencyGraph.entries()).map(([id, deps]) => ({
        transactionId: id,
        waitingFor: Array.from(deps)
      })),
      lockWaits: Array.from(this.lockWaitMap.entries())
    };
  }
}

/**
 * 熔断器实现
 */
export class CircuitBreaker extends EventEmitter {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;
  private halfOpenAttempts = 0;
  private successCount = 0;

  constructor(
    private config: {
      failureThreshold: number;
      recoveryTimeout: number;
      halfOpenRetryCount: number;
      successThreshold: number;
    }
  ) {
    super();
  }

  /**
   * 执行操作（带熔断保护）
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is open');
      } else {
        this.state = 'half-open';
        this.halfOpenAttempts = 0;
        this.emit('stateChanged', { from: 'open', to: 'half-open' });
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * 成功处理
   */
  private onSuccess(): void {
    this.successCount++;
    
    if (this.state === 'half-open') {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.config.halfOpenRetryCount) {
        this.reset();
      }
    } else if (this.state === 'closed') {
      this.failureCount = 0;
    }
  }

  /**
   * 失败处理
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'half-open') {
      this.trip();
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.trip();
    }
  }

  /**
   * 触发熔断
   */
  private trip(): void {
    this.state = 'open';
    this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    this.emit('stateChanged', { to: 'open', failureCount: this.failureCount });
  }

  /**
   * 重置熔断器
   */
  private reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
    this.emit('stateChanged', { to: 'closed' });
  }

  /**
   * 获取状态信息
   */
  getState(): {
    state: string;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
    nextAttemptTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }
}

/**
 * 事务管理器
 */
export class TransactionManager extends EventEmitter {
  private transactions = new Map<string, TransactionContext>();
  private resourceLocks = new Map<string, string>(); // resource -> transactionId
  private deadlockDetector: DeadlockDetector;

  constructor() {
    super();
    this.deadlockDetector = new DeadlockDetector();
    
    this.deadlockDetector.on('deadlockDetected', (cycle) => {
      this.handleDeadlock(cycle);
    });
  }

  /**
   * 开始事务
   */
  beginTransaction(
    id: string,
    timeout: number = 30000,
    priority: number = 0
  ): TransactionContext {
    if (this.transactions.has(id)) {
      throw new Error(`Transaction ${id} already exists`);
    }

    const transaction = new TransactionContext(id, timeout, priority);
    this.transactions.set(id, transaction);
    
    this.emit('transactionStarted', { transactionId: id, priority });
    
    return transaction;
  }

  /**
   * 提交事务
   */
  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      await transaction.commit();
      this.releaseTransactionLocks(transactionId);
      this.transactions.delete(transactionId);
      
      this.emit('transactionCommitted', { transactionId });
    } catch (error) {
      await this.rollbackTransaction(transactionId);
      throw error;
    }
  }

  /**
   * 回滚事务
   */
  async rollbackTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return; // 事务可能已经被清理
    }

    try {
      await transaction.rollback();
    } finally {
      this.releaseTransactionLocks(transactionId);
      this.transactions.delete(transactionId);
      this.deadlockDetector.removeLockDependency(transactionId);
      
      this.emit('transactionRolledBack', { transactionId });
    }
  }

  /**
   * 获取资源锁
   */
  async acquireLock(
    transactionId: string,
    resourceId: string,
    timeout: number = 5000
  ): Promise<boolean> {
    const existingOwner = this.resourceLocks.get(resourceId);
    
    if (existingOwner === transactionId) {
      return true; // 已经拥有锁
    }
    
    if (existingOwner) {
      // 资源被其他事务锁定，等待或检测死锁
      const waitingFor = [existingOwner];
      this.deadlockDetector.addLockDependency(transactionId, resourceId, waitingFor);
      
      // 等待锁释放
      return await this.waitForLock(transactionId, resourceId, timeout);
    }
    
    // 获得锁
    this.resourceLocks.set(resourceId, transactionId);
    const transaction = this.transactions.get(transactionId);
    if (transaction) {
      transaction.addLock(resourceId);
    }
    
    return true;
  }

  /**
   * 释放锁
   */
  releaseLock(transactionId: string, resourceId: string): void {
    const owner = this.resourceLocks.get(resourceId);
    if (owner === transactionId) {
      this.resourceLocks.delete(resourceId);
      
      const transaction = this.transactions.get(transactionId);
      if (transaction) {
        transaction.removeLock(resourceId);
      }
      
      this.emit('lockReleased', { transactionId, resourceId });
    }
  }

  /**
   * 等待锁
   */
  private async waitForLock(
    transactionId: string,
    resourceId: string,
    timeout: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkLock = () => {
        if (Date.now() - startTime > timeout) {
          this.deadlockDetector.removeLockDependency(transactionId);
          reject(new Error(`Lock acquisition timeout for resource ${resourceId}`));
          return;
        }
        
        const owner = this.resourceLocks.get(resourceId);
        if (!owner || owner === transactionId) {
          this.deadlockDetector.removeLockDependency(transactionId);
          this.resourceLocks.set(resourceId, transactionId);
          
          const transaction = this.transactions.get(transactionId);
          if (transaction) {
            transaction.addLock(resourceId);
          }
          
          resolve(true);
        } else {
          setTimeout(checkLock, 100); // 100ms后重试
        }
      };
      
      checkLock();
    });
  }

  /**
   * 释放事务的所有锁
   */
  private releaseTransactionLocks(transactionId: string): void {
    const transaction = this.transactions.get(transactionId);
    if (transaction) {
      for (const resourceId of transaction.getLocks()) {
        this.releaseLock(transactionId, resourceId);
      }
    }
  }

  /**
   * 处理死锁
   */
  private handleDeadlock(cycle: string[]): void {
    // 选择优先级最低的事务进行回滚
    let victimId = cycle[0];
    let lowestPriority = Number.MAX_SAFE_INTEGER;
    
    for (const transactionId of cycle) {
      const transaction = this.transactions.get(transactionId);
      if (transaction && transaction.getPriority() < lowestPriority) {
        lowestPriority = transaction.getPriority();
        victimId = transactionId;
      }
    }
    
    this.emit('deadlockDetected', { cycle, victim: victimId });
    
    // 异步回滚受害者事务
    setImmediate(() => {
      this.rollbackTransaction(victimId).catch(error => {
        this.emit('deadlockResolutionFailed', { victimId, error });
      });
    });
  }

  /**
   * 获取事务信息
   */
  getTransactionInfo(): any {
    return {
      activeTransactions: Array.from(this.transactions.entries()).map(([id, tx]) => ({
        id,
        startTime: tx.getStartTime(),
        priority: tx.getPriority(),
        locks: Array.from(tx.getLocks())
      })),
      resourceLocks: Array.from(this.resourceLocks.entries()),
      deadlockInfo: this.deadlockDetector.getDependencyInfo()
    };
  }

  /**
   * 清理过期事务
   */
  cleanupExpiredTransactions(): void {
    const now = Date.now();
    
    for (const [id, transaction] of this.transactions) {
      if (transaction.isExpired(now)) {
        this.rollbackTransaction(id).catch(error => {
          this.emit('transactionCleanupFailed', { transactionId: id, error });
        });
      }
    }
  }
}

/**
 * 事务上下文
 */
export class TransactionContext {
  private locks = new Set<string>();
  private rollbackActions: (() => Promise<void>)[] = [];
  private committed = false;
  private rolledBack = false;

  constructor(
    private id: string,
    private timeout: number,
    private priority: number,
    private startTime: number = Date.now()
  ) {}

  /**
   * 添加锁
   */
  addLock(resourceId: string): void {
    this.locks.add(resourceId);
  }

  /**
   * 移除锁
   */
  removeLock(resourceId: string): void {
    this.locks.delete(resourceId);
  }

  /**
   * 获取锁列表
   */
  getLocks(): Set<string> {
    return new Set(this.locks);
  }

  /**
   * 添加回滚动作
   */
  addRollbackAction(action: () => Promise<void>): void {
    this.rollbackActions.push(action);
  }

  /**
   * 提交事务
   */
  async commit(): Promise<void> {
    if (this.committed || this.rolledBack) {
      throw new Error(`Transaction ${this.id} already finalized`);
    }
    
    this.committed = true;
    // 提交后清理回滚动作
    this.rollbackActions = [];
  }

  /**
   * 回滚事务
   */
  async rollback(): Promise<void> {
    if (this.committed) {
      throw new Error(`Cannot rollback committed transaction ${this.id}`);
    }
    
    if (this.rolledBack) {
      return; // 已经回滚过
    }
    
    this.rolledBack = true;
    
    // 反向执行回滚动作
    for (const action of this.rollbackActions.reverse()) {
      try {
        await action();
      } catch (error) {
        console.error(`Rollback action failed for transaction ${this.id}:`, error);
      }
    }
  }

  /**
   * 检查是否过期
   */
  isExpired(now: number = Date.now()): boolean {
    return now - this.startTime > this.timeout;
  }

  /**
   * 获取事务信息
   */
  getStartTime(): number {
    return this.startTime;
  }

  getPriority(): number {
    return this.priority;
  }

  getId(): string {
    return this.id;
  }

  isFinalized(): boolean {
    return this.committed || this.rolledBack;
  }
}

/**
 * 性能收集器
 */
export class PerformanceCollector {
  private metrics = new Map<string, PerformanceMetric>();
  private readonly maxMetrics = 1000;

  /**
   * 开始性能测量
   */
  startMeasurement(id: string, category: string): void {
    this.metrics.set(id, {
      id,
      category,
      startTime: Date.now(),
      startMemory: this.getMemoryUsage(),
      endTime: 0,
      endMemory: 0,
      duration: 0,
      memoryDelta: 0
    });
  }

  /**
   * 结束性能测量
   */
  endMeasurement(id: string): PerformanceMetric | null {
    const metric = this.metrics.get(id);
    if (!metric) {
      return null;
    }

    metric.endTime = Date.now();
    metric.endMemory = this.getMemoryUsage();
    metric.duration = metric.endTime - metric.startTime;
    metric.memoryDelta = metric.endMemory - metric.startMemory;

    return metric;
  }

  /**
   * 获取内存使用量
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * 获取性能统计
   */
  getStatistics(): any {
    const categories = new Map<string, PerformanceMetric[]>();
    
    for (const metric of this.metrics.values()) {
      if (!categories.has(metric.category)) {
        categories.set(metric.category, []);
      }
      categories.get(metric.category)!.push(metric);
    }

    const stats: any = {};
    
    for (const [category, metrics] of categories) {
      const durations = metrics.map(m => m.duration);
      const memoryDeltas = metrics.map(m => m.memoryDelta);
      
      stats[category] = {
        count: metrics.length,
        averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        averageMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
        maxMemoryDelta: Math.max(...memoryDeltas)
      };
    }

    return stats;
  }

  /**
   * 清理旧指标
   */
  cleanup(): void {
    if (this.metrics.size > this.maxMetrics) {
      const sortedMetrics = Array.from(this.metrics.entries())
        .sort(([, a], [, b]) => b.endTime - a.endTime);
      
      this.metrics.clear();
      
      for (const [id, metric] of sortedMetrics.slice(0, this.maxMetrics)) {
        this.metrics.set(id, metric);
      }
    }
  }
}

export interface PerformanceMetric {
  id: string;
  category: string;
  startTime: number;
  endTime: number;
  duration: number;
  startMemory: number;
  endMemory: number;
  memoryDelta: number;
}