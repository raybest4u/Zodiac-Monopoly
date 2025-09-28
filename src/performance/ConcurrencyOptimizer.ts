import { EventEmitter } from '../utils/EventEmitter';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

export interface TaskPriority {
  level: 'low' | 'normal' | 'high' | 'critical';
  weight: number;
}

export interface AsyncTask<T = any> {
  id: string;
  name: string;
  operation: () => Promise<T> | T;
  priority: TaskPriority;
  timeout: number;
  retries: number;
  dependencies: string[];
  onComplete?: (result: T) => void;
  onError?: (error: Error) => void;
}

export interface WorkerPoolConfig {
  minWorkers: number;
  maxWorkers: number;
  taskTimeout: number;
  idleTimeout: number;
  maxRetries: number;
}

export interface ConcurrencyMetrics {
  timestamp: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  queueLength: number;
  workerUtilization: number;
  throughput: number;
  errorRate: number;
}

export interface ParallelJobConfig {
  name: string;
  chunks: any[];
  processor: (chunk: any) => any;
  concurrency: number;
  preserveOrder: boolean;
  onProgress?: (completed: number, total: number) => void;
}

export class TaskQueue<T = any> {
  private tasks: AsyncTask<T>[] = [];
  private running: Map<string, Promise<T>> = new Map();
  private completed: Map<string, T> = new Map();
  private failed: Map<string, Error> = new Map();
  private maxConcurrency: number;

  constructor(maxConcurrency: number = 4) {
    this.maxConcurrency = maxConcurrency;
  }

  public add(task: AsyncTask<T>): void {
    this.tasks.push(task);
    this.tasks.sort((a, b) => b.priority.weight - a.priority.weight);
  }

  public async process(): Promise<Map<string, T | Error>> {
    while (this.tasks.length > 0 || this.running.size > 0) {
      // Start new tasks up to concurrency limit
      while (this.running.size < this.maxConcurrency && this.tasks.length > 0) {
        const task = this.getNextExecutableTask();
        if (task) {
          this.executeTask(task);
        } else {
          break; // No executable tasks available
        }
      }

      // Wait for any task to complete
      if (this.running.size > 0) {
        await Promise.race(this.running.values());
      }
    }

    const results = new Map<string, T | Error>();
    for (const [id, result] of this.completed) {
      results.set(id, result);
    }
    for (const [id, error] of this.failed) {
      results.set(id, error);
    }

    return results;
  }

  private getNextExecutableTask(): AsyncTask<T> | null {
    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];
      
      // Check if all dependencies are completed
      const dependenciesMet = task.dependencies.every(depId => 
        this.completed.has(depId) || this.failed.has(depId)
      );

      if (dependenciesMet) {
        return this.tasks.splice(i, 1)[0];
      }
    }
    return null;
  }

  private async executeTask(task: AsyncTask<T>): Promise<void> {
    const executeWithRetry = async (retriesLeft: number): Promise<T> => {
      try {
        const result = await this.executeWithTimeout(task.operation, task.timeout);
        return result;
      } catch (error) {
        if (retriesLeft > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
          return executeWithRetry(retriesLeft - 1);
        }
        throw error;
      }
    };

    const promise = executeWithRetry(task.retries)
      .then(result => {
        this.completed.set(task.id, result);
        this.running.delete(task.id);
        task.onComplete?.(result);
        return result;
      })
      .catch(error => {
        this.failed.set(task.id, error);
        this.running.delete(task.id);
        task.onError?.(error);
        throw error;
      });

    this.running.set(task.id, promise);
  }

  private executeWithTimeout<R>(operation: () => Promise<R> | R, timeoutMs: number): Promise<R> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(operation())
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  public getStats() {
    return {
      pending: this.tasks.length,
      running: this.running.size,
      completed: this.completed.size,
      failed: this.failed.size,
    };
  }
}

export class WorkerPool extends EventEmitter {
  private workers: Map<number, Worker> = new Map();
  private busyWorkers: Set<number> = new Set();
  private taskQueue: AsyncTask[] = [];
  private config: WorkerPoolConfig;
  private nextWorkerId: number = 0;
  private workerScripts: Map<string, string> = new Map();

  constructor(config: WorkerPoolConfig) {
    super();
    this.config = config;
    this.initializeWorkers();
  }

  public registerWorkerScript(name: string, scriptPath: string): void {
    this.workerScripts.set(name, scriptPath);
  }

  public async execute<T>(
    scriptName: string,
    data: any,
    priority: TaskPriority = { level: 'normal', weight: 50 }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: AsyncTask<T> = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: scriptName,
        operation: () => this.executeInWorker(scriptName, data),
        priority,
        timeout: this.config.taskTimeout,
        retries: this.config.maxRetries,
        dependencies: [],
        onComplete: resolve,
        onError: reject,
      };

      this.taskQueue.push(task);
      this.processQueue();
    });
  }

  public async executeParallel<T, R>(
    scriptName: string,
    dataChunks: T[],
    priority: TaskPriority = { level: 'normal', weight: 50 }
  ): Promise<R[]> {
    const promises = dataChunks.map(chunk => 
      this.execute<R>(scriptName, chunk, priority)
    );

    return Promise.all(promises);
  }

  public getMetrics(): ConcurrencyMetrics {
    const now = Date.now();
    return {
      timestamp: now,
      activeTasks: this.busyWorkers.size,
      completedTasks: 0, // Would track this in real implementation
      failedTasks: 0,    // Would track this in real implementation
      averageTaskTime: 0, // Would calculate from metrics
      queueLength: this.taskQueue.length,
      workerUtilization: this.busyWorkers.size / this.workers.size,
      throughput: 0,     // Would calculate tasks/second
      errorRate: 0,      // Would calculate from metrics
    };
  }

  public scaleWorkers(targetCount: number): void {
    const currentCount = this.workers.size;
    
    if (targetCount > currentCount) {
      // Add workers
      for (let i = 0; i < targetCount - currentCount; i++) {
        this.createWorker();
      }
    } else if (targetCount < currentCount) {
      // Remove workers
      const workersToRemove = currentCount - targetCount;
      let removed = 0;
      
      for (const [id, worker] of this.workers) {
        if (!this.busyWorkers.has(id) && removed < workersToRemove) {
          worker.terminate();
          this.workers.delete(id);
          removed++;
        }
      }
    }

    this.emit('workers:scaled', { from: currentCount, to: this.workers.size });
  }

  public destroy(): Promise<void> {
    return new Promise((resolve) => {
      const terminationPromises = Array.from(this.workers.values()).map(worker => 
        worker.terminate()
      );

      Promise.all(terminationPromises).then(() => {
        this.workers.clear();
        this.busyWorkers.clear();
        this.taskQueue.length = 0;
        resolve();
      });
    });
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker(): void {
    if (this.workers.size >= this.config.maxWorkers) {
      return;
    }

    const workerId = this.nextWorkerId++;
    
    // In a real implementation, you'd use an actual worker script
    const worker = new Worker(__filename, {
      workerData: { workerId, isWorker: true }
    });

    worker.on('message', (result) => {
      this.busyWorkers.delete(workerId);
      this.emit('task:completed', { workerId, result });
      this.processQueue();
    });

    worker.on('error', (error) => {
      this.busyWorkers.delete(workerId);
      this.emit('task:failed', { workerId, error });
      this.processQueue();
    });

    this.workers.set(workerId, worker);
    this.emit('worker:created', { workerId });
  }

  private async executeInWorker<T>(scriptName: string, data: any): Promise<T> {
    const scriptPath = this.workerScripts.get(scriptName);
    if (!scriptPath) {
      throw new Error(`Worker script '${scriptName}' not registered`);
    }

    // Simplified worker execution - in real implementation would use actual worker threads
    return new Promise((resolve, reject) => {
      try {
        // Simulate worker execution
        setTimeout(() => {
          resolve(data as T);
        }, Math.random() * 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) {
      return;
    }

    // Find available worker
    const availableWorker = Array.from(this.workers.keys()).find(id => 
      !this.busyWorkers.has(id)
    );

    if (availableWorker !== undefined) {
      const task = this.taskQueue.shift();
      if (task) {
        this.busyWorkers.add(availableWorker);
        this.executeTask(availableWorker, task);
      }
    } else if (this.workers.size < this.config.maxWorkers) {
      // Create new worker if needed and possible
      this.createWorker();
      setImmediate(() => this.processQueue());
    }
  }

  private executeTask(workerId: number, task: AsyncTask): void {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }

    // In real implementation, would send task to worker
    worker.postMessage({
      taskId: task.id,
      operation: task.operation.toString(),
      data: workerData,
    });
  }
}

export class ConcurrencyOptimizer extends EventEmitter {
  private taskQueues: Map<string, TaskQueue> = new Map();
  private workerPools: Map<string, WorkerPool> = new Map();
  private asyncOperations: Map<string, Promise<any>> = new Map();
  private metricsHistory: ConcurrencyMetrics[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    super();
    this.initializeDefaultPools();
  }

  public createTaskQueue(name: string, maxConcurrency: number): TaskQueue {
    const queue = new TaskQueue(maxConcurrency);
    this.taskQueues.set(name, queue);
    return queue;
  }

  public createWorkerPool(name: string, config: WorkerPoolConfig): WorkerPool {
    const pool = new WorkerPool(config);
    this.workerPools.set(name, pool);
    return pool;
  }

  public async processParallelJob<T, R>(config: ParallelJobConfig): Promise<R[]> {
    const { chunks, processor, concurrency, preserveOrder, onProgress } = config;
    const results: (R | null)[] = preserveOrder ? new Array(chunks.length).fill(null) : [];
    const semaphore = new Semaphore(concurrency);
    
    const promises = chunks.map(async (chunk, index) => {
      await semaphore.acquire();
      
      try {
        const result = await processor(chunk);
        
        if (preserveOrder) {
          results[index] = result;
        } else {
          results.push(result);
        }

        onProgress?.(results.filter(r => r !== null).length, chunks.length);
        
        return result;
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(promises);
    return results as R[];
  }

  public async executeAsyncPipeline<T>(
    operations: Array<(input: T) => Promise<T> | T>,
    initialValue: T,
    parallel: boolean = false
  ): Promise<T> {
    if (parallel) {
      // Execute operations in parallel where possible
      return this.executeParallelPipeline(operations, initialValue);
    } else {
      // Execute operations sequentially
      let result = initialValue;
      for (const operation of operations) {
        result = await operation(result);
      }
      return result;
    }
  }

  public optimizeAsyncOperations(): void {
    // Optimize common async patterns
    this.optimizeBatchOperations();
    this.optimizeStreamProcessing();
    this.optimizeEventHandling();
    
    this.emit('asyncOperations:optimized');
  }

  public async batchAsyncOperations<T, R>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 10,
    delayBetweenBatches: number = 0
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults as R[]);
      
      if (delayBetweenBatches > 0 && i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    return results;
  }

  public createRateLimiter(requestsPerSecond: number): (operation: () => Promise<any>) => Promise<any> {
    const tokens = requestsPerSecond;
    let availableTokens = tokens;
    let lastRefill = Date.now();

    return async (operation: () => Promise<any>) => {
      const now = Date.now();
      const timePassed = (now - lastRefill) / 1000;
      availableTokens = Math.min(tokens, availableTokens + timePassed * requestsPerSecond);
      lastRefill = now;

      if (availableTokens < 1) {
        const waitTime = (1 - availableTokens) / requestsPerSecond * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        availableTokens = 1;
      }

      availableTokens--;
      return operation();
    };
  }

  public async debounceAsync<T>(
    operation: () => Promise<T>,
    delayMs: number,
    key: string = 'default'
  ): Promise<T> {
    // Cancel previous operation if exists
    const existingOperation = this.asyncOperations.get(key);
    if (existingOperation) {
      // In a real implementation, you'd cancel the previous operation
    }

    const promise = new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await operation();
          this.asyncOperations.delete(key);
          resolve(result);
        } catch (error) {
          this.asyncOperations.delete(key);
          reject(error);
        }
      }, delayMs);
    });

    this.asyncOperations.set(key, promise);
    return promise;
  }

  public async throttleAsync<T>(
    operation: () => Promise<T>,
    intervalMs: number,
    key: string = 'default'
  ): Promise<T | null> {
    const existingOperation = this.asyncOperations.get(key);
    if (existingOperation) {
      return null; // Operation already in progress
    }

    const promise = operation().finally(() => {
      setTimeout(() => {
        this.asyncOperations.delete(key);
      }, intervalMs);
    });

    this.asyncOperations.set(key, promise);
    return promise;
  }

  public startMetricsCollection(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    const collectMetrics = () => {
      const metrics = this.collectConcurrencyMetrics();
      this.metricsHistory.push(metrics);
      
      // Keep only last 100 metrics
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }

      this.emit('metrics:collected', metrics);
      
      if (this.isMonitoring) {
        setTimeout(collectMetrics, 5000); // Collect every 5 seconds
      }
    };

    collectMetrics();
  }

  public stopMetricsCollection(): void {
    this.isMonitoring = false;
  }

  public getConcurrencyReport(): any {
    return {
      timestamp: Date.now(),
      taskQueues: Object.fromEntries(
        Array.from(this.taskQueues.entries()).map(([name, queue]) => [name, queue.getStats()])
      ),
      workerPools: Object.fromEntries(
        Array.from(this.workerPools.entries()).map(([name, pool]) => [name, pool.getMetrics()])
      ),
      metricsHistory: this.metricsHistory,
      asyncOperations: this.asyncOperations.size,
      recommendations: this.generateConcurrencyRecommendations(),
    };
  }

  private initializeDefaultPools(): void {
    // Create default task queues
    this.createTaskQueue('ai_processing', 2);
    this.createTaskQueue('game_logic', 4);
    this.createTaskQueue('ui_updates', 8);
    this.createTaskQueue('background_tasks', 1);

    // Create default worker pools
    this.createWorkerPool('heavy_computation', {
      minWorkers: 2,
      maxWorkers: 4,
      taskTimeout: 30000,
      idleTimeout: 60000,
      maxRetries: 2,
    });

    this.createWorkerPool('data_processing', {
      minWorkers: 1,
      maxWorkers: 3,
      taskTimeout: 10000,
      idleTimeout: 30000,
      maxRetries: 1,
    });
  }

  private async executeParallelPipeline<T>(
    operations: Array<(input: T) => Promise<T> | T>,
    initialValue: T
  ): Promise<T> {
    // This is a simplified implementation
    // In a real scenario, you'd need to analyze dependencies between operations
    let result = initialValue;
    for (const operation of operations) {
      result = await operation(result);
    }
    return result;
  }

  private optimizeBatchOperations(): void {
    // Implement batch operation optimizations
    this.emit('batchOperations:optimized');
  }

  private optimizeStreamProcessing(): void {
    // Implement stream processing optimizations
    this.emit('streamProcessing:optimized');
  }

  private optimizeEventHandling(): void {
    // Implement event handling optimizations
    this.emit('eventHandling:optimized');
  }

  private collectConcurrencyMetrics(): ConcurrencyMetrics {
    // Aggregate metrics from all pools and queues
    let totalActiveTasks = 0;
    let totalQueueLength = 0;
    let totalWorkerUtilization = 0;
    let poolCount = 0;

    for (const pool of this.workerPools.values()) {
      const metrics = pool.getMetrics();
      totalActiveTasks += metrics.activeTasks;
      totalQueueLength += metrics.queueLength;
      totalWorkerUtilization += metrics.workerUtilization;
      poolCount++;
    }

    return {
      timestamp: Date.now(),
      activeTasks: totalActiveTasks,
      completedTasks: 0,
      failedTasks: 0,
      averageTaskTime: 0,
      queueLength: totalQueueLength,
      workerUtilization: poolCount > 0 ? totalWorkerUtilization / poolCount : 0,
      throughput: 0,
      errorRate: 0,
    };
  }

  private generateConcurrencyRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    if (latestMetrics) {
      if (latestMetrics.queueLength > 50) {
        recommendations.push('High queue length detected - consider increasing worker pool size');
      }
      
      if (latestMetrics.workerUtilization > 0.9) {
        recommendations.push('Worker utilization is very high - consider scaling up');
      } else if (latestMetrics.workerUtilization < 0.3) {
        recommendations.push('Worker utilization is low - consider scaling down');
      }

      if (latestMetrics.errorRate > 0.1) {
        recommendations.push('High error rate detected - review task retry strategies');
      }
    }

    return recommendations;
  }

  public destroy(): Promise<void> {
    this.stopMetricsCollection();
    
    const destroyPromises = Array.from(this.workerPools.values()).map(pool => pool.destroy());
    
    return Promise.all(destroyPromises).then(() => {
      this.taskQueues.clear();
      this.workerPools.clear();
      this.asyncOperations.clear();
    });
  }
}

class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  public async acquire(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  public release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      if (next) {
        this.permits--;
        next();
      }
    }
  }
}

export const concurrencyOptimizer = new ConcurrencyOptimizer();