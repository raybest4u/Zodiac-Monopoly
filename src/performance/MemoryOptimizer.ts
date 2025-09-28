import { EventEmitter } from '../utils/EventEmitter';

export interface MemoryPoolConfig {
  name: string;
  objectType: string;
  initialSize: number;
  maxSize: number;
  growthFactor: number;
  factory: () => any;
  reset: (obj: any) => void;
}

export interface MemoryUsageStats {
  timestamp: number;
  totalHeapSize: number;
  usedHeapSize: number;
  externalMemory: number;
  arrayBuffers: number;
  poolStats: Map<string, {
    allocated: number;
    available: number;
    totalCreated: number;
    reuseRate: number;
  }>;
  gcStats: {
    collections: number;
    avgPauseTime: number;
    totalPauseTime: number;
  };
}

export interface MemoryOptimizationStrategy {
  name: string;
  trigger: (stats: MemoryUsageStats) => boolean;
  execute: () => Promise<void>;
  priority: number;
  description: string;
}

export class ObjectPool<T> {
  private available: T[] = [];
  private allocated: Set<T> = new Set();
  private totalCreated: number = 0;
  private reuseCount: number = 0;

  constructor(
    private config: MemoryPoolConfig,
    initialSize: number = 10
  ) {
    for (let i = 0; i < initialSize; i++) {
      const obj = this.config.factory();
      this.available.push(obj);
      this.totalCreated++;
    }
  }

  public acquire(): T {
    let obj: T;
    
    if (this.available.length > 0) {
      obj = this.available.pop()!;
      this.reuseCount++;
    } else {
      if (this.allocated.size >= this.config.maxSize) {
        throw new Error(`Pool ${this.config.name} has reached maximum size of ${this.config.maxSize}`);
      }
      obj = this.config.factory();
      this.totalCreated++;
    }

    this.allocated.add(obj);
    return obj;
  }

  public release(obj: T): void {
    if (!this.allocated.has(obj)) {
      return; // Object not from this pool
    }

    this.allocated.delete(obj);
    this.config.reset(obj);
    this.available.push(obj);
  }

  public getStats() {
    return {
      allocated: this.allocated.size,
      available: this.available.length,
      totalCreated: this.totalCreated,
      reuseRate: this.totalCreated > 0 ? this.reuseCount / this.totalCreated : 0,
    };
  }

  public resize(newSize: number): void {
    if (newSize > this.config.maxSize) {
      newSize = this.config.maxSize;
    }

    const currentTotal = this.available.length + this.allocated.size;
    
    if (newSize > currentTotal) {
      // Grow the pool
      const toCreate = newSize - currentTotal;
      for (let i = 0; i < toCreate; i++) {
        const obj = this.config.factory();
        this.available.push(obj);
        this.totalCreated++;
      }
    } else if (newSize < currentTotal && this.available.length > 0) {
      // Shrink the pool by removing available objects
      const toRemove = Math.min(currentTotal - newSize, this.available.length);
      this.available.splice(0, toRemove);
    }
  }

  public clear(): void {
    this.available.length = 0;
    this.allocated.clear();
    this.totalCreated = 0;
    this.reuseCount = 0;
  }
}

export class MemoryOptimizer extends EventEmitter {
  private pools: Map<string, ObjectPool<any>> = new Map();
  private optimizationStrategies: MemoryOptimizationStrategy[] = [];
  private memoryUsageHistory: MemoryUsageStats[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcObserver: any = null;
  private weakRefs: Set<WeakRef<any>> = new Set();
  private memoryLeakDetector: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeDefaultPools();
    this.initializeOptimizationStrategies();
    this.setupGCObserver();
  }

  public startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMemoryStats();
      this.checkOptimizationTriggers();
    }, intervalMs);

    this.emit('monitoring:started');
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoring:stopped');
  }

  public createPool<T>(config: MemoryPoolConfig): ObjectPool<T> {
    const pool = new ObjectPool<T>(config, config.initialSize);
    this.pools.set(config.name, pool);
    
    this.emit('pool:created', { name: config.name, config });
    return pool;
  }

  public getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name) as ObjectPool<T>;
  }

  public removePool(name: string): boolean {
    const pool = this.pools.get(name);
    if (pool) {
      pool.clear();
      this.pools.delete(name);
      this.emit('pool:removed', { name });
      return true;
    }
    return false;
  }

  public trackWeakReference<T extends object>(obj: T, identifier?: string): WeakRef<T> {
    const weakRef = new WeakRef(obj);
    this.weakRefs.add(weakRef);
    
    if (identifier) {
      this.memoryLeakDetector.set(identifier, (this.memoryLeakDetector.get(identifier) || 0) + 1);
    }
    
    return weakRef;
  }

  public forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      this.emit('gc:forced');
    } else {
      console.warn('Garbage collection is not exposed. Run with --expose-gc flag.');
    }
  }

  public getMemoryUsageStats(): MemoryUsageStats {
    const memUsage = process.memoryUsage();
    const poolStats = new Map();
    
    for (const [name, pool] of this.pools) {
      poolStats.set(name, pool.getStats());
    }

    return {
      timestamp: Date.now(),
      totalHeapSize: memUsage.heapTotal,
      usedHeapSize: memUsage.heapUsed,
      externalMemory: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers || 0,
      poolStats,
      gcStats: this.getGCStats(),
    };
  }

  public optimizeMemoryUsage(): Promise<void> {
    return new Promise(async (resolve) => {
      // Clean up weak references
      this.cleanupWeakReferences();
      
      // Optimize object pools
      this.optimizeObjectPools();
      
      // Run custom optimization strategies
      await this.runOptimizationStrategies();
      
      // Force garbage collection
      this.forceGarbageCollection();
      
      this.emit('memory:optimized');
      resolve();
    });
  }

  public detectMemoryLeaks(): string[] {
    const leaks: string[] = [];
    const stats = this.getMemoryUsageStats();
    
    // Check for growing object pools that aren't being released
    for (const [name, poolStats] of stats.poolStats) {
      if (poolStats.reuseRate < 0.5 && poolStats.allocated > poolStats.available * 2) {
        leaks.push(`Object pool '${name}' has low reuse rate and high allocation count`);
      }
    }

    // Check for memory growth trends
    if (this.memoryUsageHistory.length >= 5) {
      const recent = this.memoryUsageHistory.slice(-5);
      const memoryGrowth = recent[recent.length - 1].usedHeapSize - recent[0].usedHeapSize;
      const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
      
      if (memoryGrowth > 50 * 1024 * 1024 && timeSpan < 30000) { // 50MB in 30 seconds
        leaks.push('Rapid memory growth detected - possible memory leak');
      }
    }

    // Check weak reference cleanup
    const aliveRefs = Array.from(this.weakRefs).filter(ref => ref.deref() !== undefined);
    if (aliveRefs.length / this.weakRefs.size > 0.8 && this.weakRefs.size > 1000) {
      leaks.push('High number of long-lived objects detected');
    }

    return leaks;
  }

  public generateMemoryReport(): any {
    const stats = this.getMemoryUsageStats();
    const leaks = this.detectMemoryLeaks();
    
    return {
      timestamp: Date.now(),
      currentStats: stats,
      memoryTrend: this.calculateMemoryTrend(),
      poolsEfficiency: this.calculatePoolsEfficiency(),
      detectedIssues: leaks,
      recommendations: this.generateOptimizationRecommendations(stats),
      gcPerformance: this.analyzeGCPerformance(),
    };
  }

  private initializeDefaultPools(): void {
    // Game objects pool
    this.createPool({
      name: 'gameObjects',
      objectType: 'GameObject',
      initialSize: 50,
      maxSize: 500,
      growthFactor: 1.5,
      factory: () => ({ id: '', type: '', data: null, active: false }),
      reset: (obj) => {
        obj.id = '';
        obj.type = '';
        obj.data = null;
        obj.active = false;
      },
    });

    // AI decision objects pool
    this.createPool({
      name: 'aiDecisions',
      objectType: 'AIDecision',
      initialSize: 20,
      maxSize: 100,
      growthFactor: 1.3,
      factory: () => ({ 
        playerId: '', 
        action: '', 
        confidence: 0, 
        reasoning: '', 
        metadata: {} 
      }),
      reset: (obj) => {
        obj.playerId = '';
        obj.action = '';
        obj.confidence = 0;
        obj.reasoning = '';
        obj.metadata = {};
      },
    });

    // Event objects pool
    this.createPool({
      name: 'events',
      objectType: 'GameEvent',
      initialSize: 100,
      maxSize: 1000,
      growthFactor: 2.0,
      factory: () => ({ 
        type: '', 
        data: null, 
        timestamp: 0, 
        processed: false 
      }),
      reset: (obj) => {
        obj.type = '';
        obj.data = null;
        obj.timestamp = 0;
        obj.processed = false;
      },
    });

    // UI state objects pool
    this.createPool({
      name: 'uiStates',
      objectType: 'UIState',
      initialSize: 30,
      maxSize: 200,
      growthFactor: 1.4,
      factory: () => ({ 
        component: '', 
        state: {}, 
        dirty: false, 
        version: 0 
      }),
      reset: (obj) => {
        obj.component = '';
        obj.state = {};
        obj.dirty = false;
        obj.version = 0;
      },
    });
  }

  private initializeOptimizationStrategies(): void {
    // Memory pressure strategy
    this.optimizationStrategies.push({
      name: 'memoryPressure',
      priority: 1,
      description: 'Triggered when memory usage exceeds 80%',
      trigger: (stats) => {
        return (stats.usedHeapSize / stats.totalHeapSize) > 0.8;
      },
      execute: async () => {
        this.cleanupWeakReferences();
        this.optimizeObjectPools();
        this.forceGarbageCollection();
      },
    });

    // Pool efficiency strategy
    this.optimizationStrategies.push({
      name: 'poolEfficiency',
      priority: 2,
      description: 'Optimize pools with low efficiency',
      trigger: (stats) => {
        for (const [_, poolStats] of stats.poolStats) {
          if (poolStats.reuseRate < 0.3 && poolStats.totalCreated > 50) {
            return true;
          }
        }
        return false;
      },
      execute: async () => {
        this.resizeIneffientPools();
      },
    });

    // GC pressure strategy
    this.optimizationStrategies.push({
      name: 'gcPressure',
      priority: 3,
      description: 'Reduce GC pressure by cleaning up objects',
      trigger: (stats) => {
        return stats.gcStats.avgPauseTime > 10; // 10ms average pause
      },
      execute: async () => {
        this.cleanupLargeObjects();
        await this.delayedCleanup();
      },
    });
  }

  private setupGCObserver(): void {
    // Note: GC observation requires additional setup in production environments
    // This is a simplified implementation
    if (typeof FinalizationRegistry !== 'undefined') {
      const registry = new FinalizationRegistry((heldValue: string) => {
        this.emit('object:finalized', { identifier: heldValue });
      });
      
      this.gcObserver = registry;
    }
  }

  private collectMemoryStats(): void {
    const stats = this.getMemoryUsageStats();
    this.memoryUsageHistory.push(stats);
    
    // Keep only last 100 measurements
    if (this.memoryUsageHistory.length > 100) {
      this.memoryUsageHistory.shift();
    }

    this.emit('stats:collected', stats);
  }

  private checkOptimizationTriggers(): void {
    const stats = this.getMemoryUsageStats();
    
    for (const strategy of this.optimizationStrategies) {
      if (strategy.trigger(stats)) {
        this.emit('optimization:triggered', { strategy: strategy.name });
        strategy.execute().catch(error => {
          this.emit('optimization:error', { strategy: strategy.name, error });
        });
      }
    }
  }

  private cleanupWeakReferences(): void {
    const before = this.weakRefs.size;
    
    for (const ref of this.weakRefs) {
      if (ref.deref() === undefined) {
        this.weakRefs.delete(ref);
      }
    }

    const cleaned = before - this.weakRefs.size;
    if (cleaned > 0) {
      this.emit('weakrefs:cleaned', { count: cleaned });
    }
  }

  private optimizeObjectPools(): void {
    for (const [name, pool] of this.pools) {
      const stats = pool.getStats();
      
      // If pool has too many available objects, resize it down
      if (stats.available > stats.allocated * 2 && stats.available > 10) {
        const newSize = Math.max(10, stats.allocated + Math.floor(stats.allocated * 0.5));
        pool.resize(newSize);
        this.emit('pool:optimized', { name, oldSize: stats.available + stats.allocated, newSize });
      }
    }
  }

  private async runOptimizationStrategies(): Promise<void> {
    const sortedStrategies = this.optimizationStrategies.sort((a, b) => a.priority - b.priority);
    
    for (const strategy of sortedStrategies) {
      try {
        await strategy.execute();
        this.emit('strategy:executed', { name: strategy.name });
      } catch (error) {
        this.emit('strategy:failed', { name: strategy.name, error });
      }
    }
  }

  private resizeIneffientPools(): void {
    for (const [name, pool] of this.pools) {
      const stats = pool.getStats();
      if (stats.reuseRate < 0.3 && stats.totalCreated > 50) {
        // Reduce pool size for inefficient pools
        const newSize = Math.max(5, Math.floor(stats.allocated * 0.7));
        pool.resize(newSize);
        this.emit('pool:resized', { name, reason: 'low efficiency', newSize });
      }
    }
  }

  private cleanupLargeObjects(): void {
    // Clean up large objects that might be causing GC pressure
    this.emit('cleanup:largeObjects');
  }

  private async delayedCleanup(): Promise<void> {
    // Perform cleanup operations over multiple event loop cycles
    return new Promise((resolve) => {
      let step = 0;
      const maxSteps = 5;
      
      const performStep = () => {
        // Perform incremental cleanup
        this.cleanupWeakReferences();
        
        step++;
        if (step < maxSteps) {
          setImmediate(performStep);
        } else {
          resolve();
        }
      };
      
      setImmediate(performStep);
    });
  }

  private getGCStats(): MemoryUsageStats['gcStats'] {
    // Simplified GC stats - in production, would use actual GC metrics
    return {
      collections: 0,
      avgPauseTime: 0,
      totalPauseTime: 0,
    };
  }

  private calculateMemoryTrend(): string {
    if (this.memoryUsageHistory.length < 3) {
      return 'insufficient data';
    }

    const recent = this.memoryUsageHistory.slice(-3);
    const growth = recent[2].usedHeapSize - recent[0].usedHeapSize;
    
    if (growth > 10 * 1024 * 1024) return 'increasing';
    if (growth < -10 * 1024 * 1024) return 'decreasing';
    return 'stable';
  }

  private calculatePoolsEfficiency(): number {
    let totalEfficiency = 0;
    let poolCount = 0;
    
    for (const [_, pool] of this.pools) {
      const stats = pool.getStats();
      if (stats.totalCreated > 0) {
        totalEfficiency += stats.reuseRate;
        poolCount++;
      }
    }
    
    return poolCount > 0 ? totalEfficiency / poolCount : 0;
  }

  private generateOptimizationRecommendations(stats: MemoryUsageStats): string[] {
    const recommendations: string[] = [];
    
    const memoryUsagePercent = (stats.usedHeapSize / stats.totalHeapSize) * 100;
    if (memoryUsagePercent > 70) {
      recommendations.push('Consider implementing more aggressive garbage collection');
      recommendations.push('Review object lifecycle management');
    }

    if (stats.externalMemory > 100 * 1024 * 1024) {
      recommendations.push('High external memory usage detected - review buffer management');
    }

    const inefficientPools = Array.from(stats.poolStats.entries())
      .filter(([_, poolStats]) => poolStats.reuseRate < 0.5)
      .map(([name]) => name);
    
    if (inefficientPools.length > 0) {
      recommendations.push(`Optimize object pools: ${inefficientPools.join(', ')}`);
    }

    return recommendations;
  }

  private analyzeGCPerformance(): any {
    return {
      status: 'normal',
      recommendations: [],
    };
  }
}

export const memoryOptimizer = new MemoryOptimizer();