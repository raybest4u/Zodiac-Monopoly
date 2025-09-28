/**
 * AI系统内存和资源管理器
 * 集成个性化AI系统并优化 - 智能资源分配、内存优化和性能管理
 */
import { EventEmitter } from '../../utils/EventEmitter';

export interface ResourcePool<T> {
  id: string;
  name: string;
  maxSize: number;
  currentSize: number;
  available: T[];
  inUse: Set<T>;
  created: number;
  recycled: number;
  destroyed: number;
  factory: () => T;
  validator: (item: T) => boolean;
  cleaner: (item: T) => void;
  resetFn: (item: T) => void;
}

export interface MemoryBlock {
  id: string;
  size: number;
  data: ArrayBuffer;
  allocated: boolean;
  lastAccess: Date;
  accessCount: number;
  type: 'personality' | 'learning' | 'decision' | 'cache' | 'temp';
}

export interface ResourceQuota {
  component: string;
  maxMemory: number;
  maxCPU: number;
  maxInstances: number;
  priority: number;
  currentUsage: ResourceUsage;
}

export interface ResourceUsage {
  memory: number;
  cpu: number;
  instances: number;
  lastUpdated: Date;
}

export interface GarbageCollectionConfig {
  enabled: boolean;
  interval: number;
  threshold: number;
  strategy: 'mark_sweep' | 'generational' | 'incremental';
  aggressiveness: 'low' | 'medium' | 'high';
}

export interface MemoryOptimizationConfig {
  compressionEnabled: boolean;
  compressionThreshold: number;
  dedupEnabled: boolean;
  cacheTTL: number;
  preallocationSize: number;
  maxMemoryUsage: number;
}

export interface ResourceMetrics {
  totalMemoryAllocated: number;
  totalMemoryUsed: number;
  memoryFragmentation: number;
  poolUtilization: Record<string, number>;
  garbageCollectionCount: number;
  compressionRatio: number;
  cacheHitRate: number;
  resourceContentions: number;
  allocationSpeed: number;
  deallocationSpeed: number;
}

export interface AllocationRequest {
  component: string;
  type: 'personality' | 'learning' | 'decision' | 'cache' | 'temp';
  size: number;
  priority: number;
  ttl?: number;
  compressible?: boolean;
}

export interface AllocationResult {
  success: boolean;
  blockId?: string;
  actualSize?: number;
  expiresAt?: Date;
  error?: string;
}

export class ResourceManager extends EventEmitter {
  private pools: Map<string, ResourcePool<any>> = new Map();
  private memoryBlocks: Map<string, MemoryBlock> = new Map();
  private quotas: Map<string, ResourceQuota> = new Map();
  private metrics: ResourceMetrics;
  private gcConfig: GarbageCollectionConfig;
  private optimizationConfig: MemoryOptimizationConfig;
  private gcInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private compressionCache = new Map<string, ArrayBuffer>();
  private allocationHistory: { timestamp: Date; size: number; type: string }[] = [];

  constructor(
    gcConfig: Partial<GarbageCollectionConfig> = {},
    optimizationConfig: Partial<MemoryOptimizationConfig> = {}
  ) {
    super();

    this.gcConfig = {
      enabled: true,
      interval: 30000, // 30 seconds
      threshold: 0.8, // 80% memory usage
      strategy: 'mark_sweep',
      aggressiveness: 'medium',
      ...gcConfig
    };

    this.optimizationConfig = {
      compressionEnabled: true,
      compressionThreshold: 1024 * 1024, // 1MB
      dedupEnabled: true,
      cacheTTL: 300000, // 5 minutes
      preallocationSize: 10 * 1024 * 1024, // 10MB
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      ...optimizationConfig
    };

    this.metrics = {
      totalMemoryAllocated: 0,
      totalMemoryUsed: 0,
      memoryFragmentation: 0,
      poolUtilization: {},
      garbageCollectionCount: 0,
      compressionRatio: 1.0,
      cacheHitRate: 0,
      resourceContentions: 0,
      allocationSpeed: 0,
      deallocationSpeed: 0
    };

    this.initializeDefaultPools();
    this.initializeDefaultQuotas();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // 预分配内存块
    await this.preallocateMemory();

    // 启动垃圾收集
    if (this.gcConfig.enabled) {
      this.startGarbageCollection();
    }

    // 启动资源监控
    this.startResourceMonitoring();

    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // 清理所有资源
    await this.cleanup();

    this.emit('stopped');
  }

  async allocateMemory(request: AllocationRequest): Promise<AllocationResult> {
    const startTime = Date.now();

    try {
      // 检查配额
      const quota = this.quotas.get(request.component);
      if (quota && quota.currentUsage.memory + request.size > quota.maxMemory) {
        return {
          success: false,
          error: `Memory quota exceeded for component ${request.component}`
        };
      }

      // 检查全局内存限制
      if (this.metrics.totalMemoryUsed + request.size > this.optimizationConfig.maxMemoryUsage) {
        // 尝试垃圾收集
        await this.forceGarbageCollection();
        
        if (this.metrics.totalMemoryUsed + request.size > this.optimizationConfig.maxMemoryUsage) {
          return {
            success: false,
            error: 'Global memory limit exceeded'
          };
        }
      }

      // 分配内存块
      const block = await this.createMemoryBlock(request);
      this.memoryBlocks.set(block.id, block);

      // 更新配额使用情况
      if (quota) {
        quota.currentUsage.memory += block.size;
        quota.currentUsage.lastUpdated = new Date();
      }

      // 更新指标
      this.metrics.totalMemoryAllocated += block.size;
      this.metrics.totalMemoryUsed += block.size;
      this.updateAllocationSpeed(Date.now() - startTime);

      // 记录分配历史
      this.allocationHistory.push({
        timestamp: new Date(),
        size: block.size,
        type: request.type
      });

      this.emit('memoryAllocated', {
        blockId: block.id,
        component: request.component,
        size: block.size,
        type: request.type
      });

      return {
        success: true,
        blockId: block.id,
        actualSize: block.size,
        expiresAt: request.ttl ? new Date(Date.now() + request.ttl) : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async deallocateMemory(blockId: string): Promise<boolean> {
    const startTime = Date.now();
    const block = this.memoryBlocks.get(blockId);
    
    if (!block) {
      return false;
    }

    try {
      // 清理内存块
      this.cleanMemoryBlock(block);
      
      // 从映射中移除
      this.memoryBlocks.delete(blockId);

      // 更新指标
      this.metrics.totalMemoryUsed -= block.size;
      this.updateDeallocationSpeed(Date.now() - startTime);

      this.emit('memoryDeallocated', {
        blockId,
        size: block.size,
        type: block.type
      });

      return true;

    } catch (error) {
      this.emit('error', {
        operation: 'deallocateMemory',
        blockId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  createPool<T>(
    id: string,
    name: string,
    maxSize: number,
    factory: () => T,
    options: {
      validator?: (item: T) => boolean;
      cleaner?: (item: T) => void;
      resetFn?: (item: T) => void;
    } = {}
  ): void {
    if (this.pools.has(id)) {
      throw new Error(`Pool ${id} already exists`);
    }

    const pool: ResourcePool<T> = {
      id,
      name,
      maxSize,
      currentSize: 0,
      available: [],
      inUse: new Set(),
      created: 0,
      recycled: 0,
      destroyed: 0,
      factory,
      validator: options.validator || (() => true),
      cleaner: options.cleaner || (() => {}),
      resetFn: options.resetFn || (() => {})
    };

    this.pools.set(id, pool);
    this.emit('poolCreated', { id, name, maxSize });
  }

  async acquireFromPool<T>(poolId: string): Promise<T | null> {
    const pool = this.pools.get(poolId) as ResourcePool<T>;
    if (!pool) {
      return null;
    }

    // 检查可用资源
    while (pool.available.length > 0) {
      const item = pool.available.pop()!;
      if (pool.validator(item)) {
        pool.inUse.add(item);
        pool.recycled++;
        this.emit('resourceAcquired', { poolId, recycled: true });
        return item;
      } else {
        pool.cleaner(item);
        pool.destroyed++;
      }
    }

    // 创建新资源
    if (pool.currentSize < pool.maxSize) {
      try {
        const item = pool.factory();
        pool.inUse.add(item);
        pool.currentSize++;
        pool.created++;
        this.emit('resourceAcquired', { poolId, recycled: false });
        return item;
      } catch (error) {
        this.emit('error', {
          operation: 'createResource',
          poolId,
          error: error instanceof Error ? error.message : String(error)
        });
        return null;
      }
    }

    // 池已满
    this.metrics.resourceContentions++;
    return null;
  }

  releaseToPool<T>(poolId: string, item: T): boolean {
    const pool = this.pools.get(poolId) as ResourcePool<T>;
    if (!pool || !pool.inUse.has(item)) {
      return false;
    }

    pool.inUse.delete(item);
    
    if (pool.validator(item)) {
      pool.resetFn(item);
      pool.available.push(item);
      this.emit('resourceReleased', { poolId, reused: true });
    } else {
      pool.cleaner(item);
      pool.currentSize--;
      pool.destroyed++;
      this.emit('resourceReleased', { poolId, reused: false });
    }

    return true;
  }

  setResourceQuota(component: string, quota: Omit<ResourceQuota, 'currentUsage'>): void {
    const resourceQuota: ResourceQuota = {
      ...quota,
      currentUsage: {
        memory: 0,
        cpu: 0,
        instances: 0,
        lastUpdated: new Date()
      }
    };

    this.quotas.set(component, resourceQuota);
    this.emit('quotaSet', { component, quota: resourceQuota });
  }

  getResourceUsage(component?: string): ResourceUsage | Record<string, ResourceUsage> {
    if (component) {
      const quota = this.quotas.get(component);
      return quota ? quota.currentUsage : {
        memory: 0,
        cpu: 0,
        instances: 0,
        lastUpdated: new Date()
      };
    }

    const usage: Record<string, ResourceUsage> = {};
    for (const [comp, quota] of this.quotas.entries()) {
      usage[comp] = quota.currentUsage;
    }
    return usage;
  }

  async compressMemoryBlock(blockId: string): Promise<boolean> {
    if (!this.optimizationConfig.compressionEnabled) {
      return false;
    }

    const block = this.memoryBlocks.get(blockId);
    if (!block || block.size < this.optimizationConfig.compressionThreshold) {
      return false;
    }

    try {
      const originalSize = block.size;
      const compressed = await this.compress(block.data);
      
      block.data = compressed;
      block.size = compressed.byteLength;

      const ratio = originalSize / block.size;
      this.metrics.compressionRatio = 
        (this.metrics.compressionRatio * 0.9) + (ratio * 0.1);

      this.emit('memoryCompressed', {
        blockId,
        originalSize,
        compressedSize: block.size,
        ratio
      });

      return true;

    } catch (error) {
      this.emit('error', {
        operation: 'compressMemory',
        blockId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  async defragmentMemory(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 收集碎片化的内存块
      const fragmentedBlocks = Array.from(this.memoryBlocks.values())
        .filter(block => !block.allocated)
        .sort((a, b) => a.size - b.size);

      let mergedCount = 0;
      
      // 尝试合并相邻的小块
      for (let i = 0; i < fragmentedBlocks.length - 1; i++) {
        const current = fragmentedBlocks[i];
        const next = fragmentedBlocks[i + 1];
        
        if (current.type === next.type && 
            current.size + next.size < this.optimizationConfig.compressionThreshold) {
          
          // 合并内存块
          const mergedBlock = await this.mergeMemoryBlocks(current, next);
          this.memoryBlocks.set(mergedBlock.id, mergedBlock);
          
          this.memoryBlocks.delete(current.id);
          this.memoryBlocks.delete(next.id);
          
          mergedCount++;
        }
      }

      // 计算碎片化程度
      this.updateFragmentationMetrics();

      const duration = Date.now() - startTime;
      
      this.emit('memoryDefragmented', {
        mergedBlocks: mergedCount,
        duration,
        fragmentation: this.metrics.memoryFragmentation
      });

    } catch (error) {
      this.emit('error', {
        operation: 'defragmentMemory',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  getMetrics(): ResourceMetrics {
    return { ...this.metrics };
  }

  getPoolStats(poolId?: string): any {
    if (poolId) {
      const pool = this.pools.get(poolId);
      return pool ? {
        id: pool.id,
        name: pool.name,
        maxSize: pool.maxSize,
        currentSize: pool.currentSize,
        available: pool.available.length,
        inUse: pool.inUse.size,
        created: pool.created,
        recycled: pool.recycled,
        destroyed: pool.destroyed,
        utilization: pool.currentSize / pool.maxSize
      } : null;
    }

    const stats: any = {};
    for (const [id, pool] of this.pools.entries()) {
      stats[id] = this.getPoolStats(id);
    }
    return stats;
  }

  // 私有方法

  private async createMemoryBlock(request: AllocationRequest): Promise<MemoryBlock> {
    const blockId = this.generateBlockId();
    const actualSize = this.alignSize(request.size);
    
    const block: MemoryBlock = {
      id: blockId,
      size: actualSize,
      data: new ArrayBuffer(actualSize),
      allocated: true,
      lastAccess: new Date(),
      accessCount: 0,
      type: request.type
    };

    return block;
  }

  private cleanMemoryBlock(block: MemoryBlock): void {
    // 清零内存数据以防止信息泄露
    const view = new Uint8Array(block.data);
    view.fill(0);
    
    block.allocated = false;
    block.lastAccess = new Date();
  }

  private async mergeMemoryBlocks(block1: MemoryBlock, block2: MemoryBlock): Promise<MemoryBlock> {
    const totalSize = block1.size + block2.size;
    const mergedData = new ArrayBuffer(totalSize);
    
    const view = new Uint8Array(mergedData);
    const view1 = new Uint8Array(block1.data);
    const view2 = new Uint8Array(block2.data);
    
    view.set(view1, 0);
    view.set(view2, block1.size);

    return {
      id: this.generateBlockId(),
      size: totalSize,
      data: mergedData,
      allocated: false,
      lastAccess: new Date(),
      accessCount: 0,
      type: block1.type
    };
  }

  private async compress(data: ArrayBuffer): Promise<ArrayBuffer> {
    // 简化的压缩实现 - 在实际项目中使用 pako 或其他压缩库
    const input = new Uint8Array(data);
    const compressed = new Uint8Array(Math.floor(input.length * 0.7)); // 模拟70%压缩率
    
    // 这里应该是实际的压缩算法
    for (let i = 0; i < compressed.length; i++) {
      compressed[i] = input[i] || 0;
    }
    
    return compressed.buffer;
  }

  private async decompress(data: ArrayBuffer): Promise<ArrayBuffer> {
    // 简化的解压缩实现
    const input = new Uint8Array(data);
    const decompressed = new Uint8Array(Math.floor(input.length * 1.43)); // 反向计算
    
    for (let i = 0; i < input.length; i++) {
      decompressed[i] = input[i];
    }
    
    return decompressed.buffer;
  }

  private alignSize(size: number): number {
    // 按8字节对齐
    return Math.ceil(size / 8) * 8;
  }

  private generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async preallocateMemory(): Promise<void> {
    const preallocationSize = this.optimizationConfig.preallocationSize;
    const blockSize = 64 * 1024; // 64KB per block
    const blockCount = Math.floor(preallocationSize / blockSize);

    for (let i = 0; i < blockCount; i++) {
      const block: MemoryBlock = {
        id: this.generateBlockId(),
        size: blockSize,
        data: new ArrayBuffer(blockSize),
        allocated: false,
        lastAccess: new Date(),
        accessCount: 0,
        type: 'temp'
      };
      
      this.memoryBlocks.set(block.id, block);
    }

    this.metrics.totalMemoryAllocated += preallocationSize;
  }

  private startGarbageCollection(): void {
    this.gcInterval = setInterval(async () => {
      await this.performGarbageCollection();
    }, this.gcConfig.interval);
  }

  private async performGarbageCollection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const currentUsage = this.metrics.totalMemoryUsed / this.optimizationConfig.maxMemoryUsage;
      
      if (currentUsage < this.gcConfig.threshold) {
        return;
      }

      let collected = 0;
      const now = Date.now();
      const ttl = this.optimizationConfig.cacheTTL;

      // 清理过期的内存块
      for (const [id, block] of this.memoryBlocks.entries()) {
        if (!block.allocated && 
            now - block.lastAccess.getTime() > ttl) {
          
          this.memoryBlocks.delete(id);
          this.metrics.totalMemoryUsed -= block.size;
          collected++;
        }
      }

      // 清理池中未使用的资源
      for (const pool of this.pools.values()) {
        while (pool.available.length > Math.floor(pool.maxSize * 0.5)) {
          const item = pool.available.pop();
          if (item) {
            pool.cleaner(item);
            pool.currentSize--;
            pool.destroyed++;
          }
        }
      }

      this.metrics.garbageCollectionCount++;
      
      const duration = Date.now() - startTime;
      
      this.emit('garbageCollected', {
        collected,
        duration,
        currentUsage,
        memoryFreed: collected * 1024 // 估算
      });

    } catch (error) {
      this.emit('error', {
        operation: 'garbageCollection',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async forceGarbageCollection(): Promise<void> {
    // 强制执行更激进的垃圾收集
    const originalThreshold = this.gcConfig.threshold;
    this.gcConfig.threshold = 0; // 强制收集所有可回收资源
    
    await this.performGarbageCollection();
    
    this.gcConfig.threshold = originalThreshold;
  }

  private startResourceMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateResourceMetrics();
      this.updatePoolUtilization();
      this.updateFragmentationMetrics();
    }, 10000); // 10 seconds
  }

  private updateResourceMetrics(): void {
    // 更新内存使用情况
    let totalUsed = 0;
    for (const block of this.memoryBlocks.values()) {
      if (block.allocated) {
        totalUsed += block.size;
      }
    }
    this.metrics.totalMemoryUsed = totalUsed;

    // 更新配额使用情况
    for (const quota of this.quotas.values()) {
      quota.currentUsage.lastUpdated = new Date();
    }
  }

  private updatePoolUtilization(): void {
    for (const [id, pool] of this.pools.entries()) {
      this.metrics.poolUtilization[id] = pool.currentSize / pool.maxSize;
    }
  }

  private updateFragmentationMetrics(): void {
    const totalBlocks = this.memoryBlocks.size;
    const fragmentedBlocks = Array.from(this.memoryBlocks.values())
      .filter(block => !block.allocated).length;
    
    this.metrics.memoryFragmentation = totalBlocks > 0 
      ? fragmentedBlocks / totalBlocks 
      : 0;
  }

  private updateAllocationSpeed(duration: number): void {
    // 使用指数移动平均
    this.metrics.allocationSpeed = 
      (this.metrics.allocationSpeed * 0.9) + (duration * 0.1);
  }

  private updateDeallocationSpeed(duration: number): void {
    this.metrics.deallocationSpeed = 
      (this.metrics.deallocationSpeed * 0.9) + (duration * 0.1);
  }

  private initializeDefaultPools(): void {
    // AI实例池
    this.createPool(
      'ai_instances',
      'AI Instances',
      20,
      () => ({ id: this.generateBlockId(), state: 'idle' }),
      {
        validator: (instance) => instance.state !== 'corrupted',
        cleaner: (instance) => { instance.state = 'destroyed'; },
        resetFn: (instance) => { instance.state = 'idle'; }
      }
    );

    // 决策缓存池
    this.createPool(
      'decision_cache',
      'Decision Cache',
      1000,
      () => ({ entries: new Map(), size: 0 }),
      {
        validator: (cache) => cache.size < 10000,
        cleaner: (cache) => { cache.entries.clear(); },
        resetFn: (cache) => { cache.entries.clear(); cache.size = 0; }
      }
    );

    // 临时对象池
    this.createPool(
      'temp_objects',
      'Temporary Objects',
      100,
      () => ({}),
      {
        validator: () => true,
        cleaner: () => {},
        resetFn: (obj) => Object.keys(obj).forEach(key => delete (obj as any)[key])
      }
    );
  }

  private initializeDefaultQuotas(): void {
    // 为各组件设置默认配额
    const components = [
      'personality_system',
      'learning_system', 
      'decision_engine',
      'social_intelligence',
      'optimization',
      'persistence'
    ];

    components.forEach(component => {
      this.setResourceQuota(component, {
        component,
        maxMemory: 64 * 1024 * 1024, // 64MB
        maxCPU: 0.2, // 20% CPU
        maxInstances: 5,
        priority: 1
      });
    });
  }

  private async cleanup(): Promise<void> {
    // 清理所有内存块
    for (const block of this.memoryBlocks.values()) {
      this.cleanMemoryBlock(block);
    }
    this.memoryBlocks.clear();

    // 清理所有资源池
    for (const pool of this.pools.values()) {
      for (const item of pool.available) {
        pool.cleaner(item);
      }
      for (const item of pool.inUse) {
        pool.cleaner(item);
      }
      pool.available = [];
      pool.inUse.clear();
    }

    // 清理缓存
    this.compressionCache.clear();
    this.allocationHistory = [];
  }
}