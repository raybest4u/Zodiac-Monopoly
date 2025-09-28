/**
 * 规则性能优化器 - 提供智能缓存、批量处理和性能优化功能
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { RuleDefinition, RuleValidationResult, RuleExecutionResult, RuleExecutionContext } from './GameRuleSystem';
import type { PlayerAction, GameState } from '../types/game';

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  hitCount: number;
  lastAccessed: number;
  expiresAt: number;
  size: number;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  source: string;
  gameStateHash?: string;
  playerContext?: string;
  invalidationTriggers: string[];
  dependencies: string[];
}

export interface CacheConfiguration {
  maxSize: number;
  defaultTTL: number;
  maxItemSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'hybrid';
  compressionEnabled: boolean;
  compressionThreshold: number;
  persistToDisk: boolean;
  diskCachePath?: string;
}

export interface PerformanceProfile {
  operationType: string;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  errorRate: number;
  cacheHitRate: number;
  memoryUsage: number;
  lastUpdated: number;
}

export interface OptimizationSuggestion {
  type: 'cache_tuning' | 'rule_optimization' | 'batch_processing' | 'memory_optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImprovement: string;
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  parameters: Record<string, any>;
}

export interface BatchRequest {
  id: string;
  actions: PlayerAction[];
  gameState: GameState;
  priority: number;
  timestamp: number;
  timeout: number;
}

export interface BatchResult {
  requestId: string;
  results: RuleExecutionResult[];
  processingTime: number;
  cacheHits: number;
  optimizationsApplied: string[];
}

/**
 * 高性能缓存实现
 */
export class IntelligentCache<T> extends EventEmitter {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private frequencyMap = new Map<string, number>();
  private compressionCache = new Map<string, string>();
  private currentSize = 0;

  constructor(private config: CacheConfiguration) {
    super();
    this.startMaintenanceTimer();
  }

  /**
   * 获取缓存项
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.emit('cacheMiss', { key });
      return undefined;
    }

    // 检查过期
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.emit('cacheExpired', { key });
      return undefined;
    }

    // 更新访问统计
    entry.hitCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);
    this.updateFrequency(key);

    this.emit('cacheHit', { key, hitCount: entry.hitCount });
    
    // 解压缩（如果需要）
    return this.decompress(entry.value);
  }

  /**
   * 设置缓存项
   */
  set(key: string, value: T, metadata?: Partial<CacheMetadata>, ttl?: number): boolean {
    const compressedValue = this.compress(value);
    const size = this.calculateSize(compressedValue);
    const expiresAt = Date.now() + (ttl || this.config.defaultTTL);

    // 检查项目大小
    if (size > this.config.maxItemSize) {
      this.emit('cacheRejected', { key, reason: 'item_too_large', size });
      return false;
    }

    // 确保有足够空间
    this.ensureSpace(size);

    const entry: CacheEntry<T> = {
      key,
      value: compressedValue,
      timestamp: Date.now(),
      hitCount: 0,
      lastAccessed: Date.now(),
      expiresAt,
      size,
      metadata: {
        source: 'unknown',
        invalidationTriggers: [],
        dependencies: [],
        ...metadata
      }
    };

    // 移除旧项目（如果存在）
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentSize -= oldEntry.size;
    }

    this.cache.set(key, entry);
    this.currentSize += size;
    this.updateAccessOrder(key);

    this.emit('cacheSet', { key, size, expiresAt });
    return true;
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.currentSize -= entry.size;
    this.removeFromAccessOrder(key);
    this.frequencyMap.delete(key);

    this.emit('cacheDelete', { key });
    return true;
  }

  /**
   * 批量失效
   */
  invalidateByTrigger(trigger: string): number {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache) {
      if (entry.metadata.invalidationTriggers.includes(trigger)) {
        this.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      this.emit('bulkInvalidation', { trigger, count: invalidatedCount });
    }

    return invalidatedCount;
  }

  /**
   * 预热缓存
   */
  async warmup(data: Array<{ key: string; value: T; metadata?: Partial<CacheMetadata> }>): Promise<void> {
    for (const item of data) {
      this.set(item.key, item.value, item.metadata);
    }
    
    this.emit('cacheWarmedUp', { itemCount: data.length });
  }

  /**
   * 获取缓存统计
   */
  getStatistics(): CacheStatistics {
    const totalRequests = this.getTotalRequests();
    const totalHits = this.getTotalHits();
    
    return {
      size: this.cache.size,
      currentSizeBytes: this.currentSize,
      maxSizeBytes: this.config.maxSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      evictionCount: this.getEvictionCount(),
      compressionRatio: this.getCompressionRatio(),
      averageItemSize: this.cache.size > 0 ? this.currentSize / this.cache.size : 0,
      oldestItem: this.getOldestItemAge(),
      newestItem: this.getNewestItemAge()
    };
  }

  // 私有方法

  private compress(value: T): T {
    if (!this.config.compressionEnabled) return value;
    
    const serialized = JSON.stringify(value);
    if (serialized.length < this.config.compressionThreshold) return value;

    // 简化的压缩实现（实际应该使用真正的压缩算法）
    return value; // 这里应该实现真正的压缩
  }

  private decompress(value: T): T {
    // 简化的解压缩实现
    return value;
  }

  private calculateSize(value: T): number {
    return JSON.stringify(value).length;
  }

  private ensureSpace(requiredSize: number): void {
    while (this.currentSize + requiredSize > this.config.maxSize && this.cache.size > 0) {
      const victimKey = this.selectEvictionVictim();
      if (victimKey) {
        this.delete(victimKey);
      } else {
        break;
      }
    }
  }

  private selectEvictionVictim(): string | null {
    if (this.cache.size === 0) return null;

    switch (this.config.evictionPolicy) {
      case 'lru':
        return this.selectLRUVictim();
      case 'lfu':
        return this.selectLFUVictim();
      case 'ttl':
        return this.selectTTLVictim();
      case 'hybrid':
        return this.selectHybridVictim();
      default:
        return this.selectLRUVictim();
    }
  }

  private selectLRUVictim(): string | null {
    return this.accessOrder.length > 0 ? this.accessOrder[0] : null;
  }

  private selectLFUVictim(): string | null {
    let minFrequency = Number.MAX_SAFE_INTEGER;
    let victim: string | null = null;

    for (const [key, frequency] of this.frequencyMap) {
      if (frequency < minFrequency) {
        minFrequency = frequency;
        victim = key;
      }
    }

    return victim;
  }

  private selectTTLVictim(): string | null {
    let earliestExpiry = Number.MAX_SAFE_INTEGER;
    let victim: string | null = null;

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt < earliestExpiry) {
        earliestExpiry = entry.expiresAt;
        victim = key;
      }
    }

    return victim;
  }

  private selectHybridVictim(): string | null {
    // 混合策略：考虑频率、最近使用时间和TTL
    let bestScore = Number.MAX_SAFE_INTEGER;
    let victim: string | null = null;
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      const frequency = this.frequencyMap.get(key) || 1;
      const ageScore = now - entry.lastAccessed;
      const ttlScore = entry.expiresAt - now;
      const frequencyScore = 1000000 / frequency; // 频率越低分数越高

      const compositeScore = ageScore * 0.4 + frequencyScore * 0.4 + (ttlScore < 0 ? -ttlScore : ttlScore * 0.2);

      if (compositeScore < bestScore) {
        bestScore = compositeScore;
        victim = key;
      }
    }

    return victim;
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private updateFrequency(key: string): void {
    const currentFreq = this.frequencyMap.get(key) || 0;
    this.frequencyMap.set(key, currentFreq + 1);
  }

  private startMaintenanceTimer(): void {
    setInterval(() => {
      this.performMaintenance();
    }, 60000); // 每分钟执行一次维护
  }

  private performMaintenance(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // 清理过期项目
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }

    // 发出维护完成事件
    this.emit('maintenanceCompleted', {
      expiredItemsRemoved: expiredKeys.length,
      currentSize: this.cache.size
    });
  }

  private getTotalRequests(): number {
    // 实现请求总数统计
    return 0; // 简化实现
  }

  private getTotalHits(): number {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hitCount;
    }
    return totalHits;
  }

  private getEvictionCount(): number {
    // 实现驱逐计数统计
    return 0; // 简化实现
  }

  private getCompressionRatio(): number {
    // 实现压缩比计算
    return 1.0; // 简化实现
  }

  private getOldestItemAge(): number {
    let oldest = 0;
    for (const entry of this.cache.values()) {
      const age = Date.now() - entry.timestamp;
      if (age > oldest) oldest = age;
    }
    return oldest;
  }

  private getNewestItemAge(): number {
    let newest = Number.MAX_SAFE_INTEGER;
    for (const entry of this.cache.values()) {
      const age = Date.now() - entry.timestamp;
      if (age < newest) newest = age;
    }
    return newest === Number.MAX_SAFE_INTEGER ? 0 : newest;
  }
}

/**
 * 规则性能优化器
 */
export class RulePerformanceOptimizer extends EventEmitter {
  private validationCache: IntelligentCache<RuleValidationResult>;
  private executionCache: IntelligentCache<RuleExecutionResult>;
  private batchQueue = new Map<string, BatchRequest>();
  private performanceProfiles = new Map<string, PerformanceProfile>();
  private batchProcessor: BatchProcessor;
  private performanceMonitor: PerformanceMonitor;

  constructor(
    private cacheConfig: CacheConfiguration = {
      maxSize: 50 * 1024 * 1024, // 50MB
      defaultTTL: 5 * 60 * 1000, // 5分钟
      maxItemSize: 1024 * 1024, // 1MB
      evictionPolicy: 'hybrid',
      compressionEnabled: true,
      compressionThreshold: 1024, // 1KB
      persistToDisk: false
    }
  ) {
    super();
    
    this.validationCache = new IntelligentCache<RuleValidationResult>(cacheConfig);
    this.executionCache = new IntelligentCache<RuleExecutionResult>(cacheConfig);
    this.batchProcessor = new BatchProcessor(this);
    this.performanceMonitor = new PerformanceMonitor(this);
    
    this.setupCacheEventHandlers();
  }

  /**
   * 优化的规则验证
   */
  async optimizedValidation(
    action: PlayerAction,
    gameState: GameState,
    rules: RuleDefinition[]
  ): Promise<RuleValidationResult> {
    const cacheKey = this.generateValidationCacheKey(action, gameState, rules);
    
    // 尝试从缓存获取
    const cached = this.validationCache.get(cacheKey);
    if (cached) {
      this.emit('validationCacheHit', { action, cacheKey });
      return cached;
    }

    // 执行验证
    const startTime = Date.now();
    const result = await this.performValidation(action, gameState, rules);
    const duration = Date.now() - startTime;

    // 缓存结果
    const metadata: Partial<CacheMetadata> = {
      source: 'rule_validation',
      gameStateHash: this.calculateGameStateHash(gameState),
      invalidationTriggers: ['game_state_change', 'rule_change'],
      dependencies: rules.map(r => r.id)
    };

    this.validationCache.set(cacheKey, result, metadata);
    
    // 更新性能统计
    this.updatePerformanceProfile('validation', duration, true);
    this.emit('validationCompleted', { action, result, duration });

    return result;
  }

  /**
   * 优化的规则执行
   */
  async optimizedExecution(
    action: PlayerAction,
    gameState: GameState,
    context: RuleExecutionContext
  ): Promise<RuleExecutionResult> {
    const cacheKey = this.generateExecutionCacheKey(action, gameState, context);
    
    // 检查缓存
    const cached = this.executionCache.get(cacheKey);
    if (cached && this.isCachedResultValid(cached, gameState)) {
      this.emit('executionCacheHit', { action, cacheKey });
      return cached;
    }

    // 执行规则
    const startTime = Date.now();
    const result = await this.performExecution(action, gameState, context);
    const duration = Date.now() - startTime;

    // 有选择地缓存结果（只缓存确定性的结果）
    if (this.isDeterministicResult(result)) {
      const metadata: Partial<CacheMetadata> = {
        source: 'rule_execution',
        gameStateHash: this.calculateGameStateHash(gameState),
        invalidationTriggers: ['game_state_change', 'player_action'],
        dependencies: [context.action.playerId]
      };

      this.executionCache.set(cacheKey, result, metadata);
    }

    // 更新性能统计
    this.updatePerformanceProfile('execution', duration, cached !== undefined);
    this.emit('executionCompleted', { action, result, duration });

    return result;
  }

  /**
   * 批量处理规则操作
   */
  async batchProcess(requests: BatchRequest[]): Promise<BatchResult[]> {
    return this.batchProcessor.process(requests);
  }

  /**
   * 预取热点数据
   */
  async prefetchHotData(gameState: GameState, predictedActions: PlayerAction[]): Promise<void> {
    const prefetchTasks = predictedActions.map(async action => {
      const cacheKey = this.generateValidationCacheKey(action, gameState, []);
      
      // 如果缓存中没有，则预取
      if (!this.validationCache.get(cacheKey)) {
        try {
          await this.optimizedValidation(action, gameState, []);
        } catch (error) {
          // 预取失败不影响主流程
          this.emit('prefetchFailed', { action, error });
        }
      }
    });

    await Promise.all(prefetchTasks);
    this.emit('prefetchCompleted', { actionCount: predictedActions.length });
  }

  /**
   * 分析性能并生成优化建议
   */
  generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const stats = this.getPerformanceStatistics();

    // 缓存命中率建议
    if (stats.cacheHitRate < 0.6) {
      suggestions.push({
        type: 'cache_tuning',
        priority: 'high',
        description: '缓存命中率偏低，建议增加缓存大小或调整TTL',
        expectedImprovement: '提升20-40%的响应速度',
        implementationComplexity: 'simple',
        parameters: {
          currentHitRate: stats.cacheHitRate,
          suggestedCacheSize: this.cacheConfig.maxSize * 1.5,
          suggestedTTL: this.cacheConfig.defaultTTL * 1.2
        }
      });
    }

    // 内存使用建议
    if (stats.memoryUsage > 0.8) {
      suggestions.push({
        type: 'memory_optimization',
        priority: 'medium',
        description: '内存使用率过高，建议启用压缩或减少缓存大小',
        expectedImprovement: '减少30-50%的内存使用',
        implementationComplexity: 'moderate',
        parameters: {
          currentMemoryUsage: stats.memoryUsage,
          compressionEnabled: this.cacheConfig.compressionEnabled,
          suggestedCacheSize: this.cacheConfig.maxSize * 0.7
        }
      });
    }

    // 批处理建议
    if (stats.averageLatency > 100) {
      suggestions.push({
        type: 'batch_processing',
        priority: 'medium',
        description: '平均延迟较高，建议启用批处理优化',
        expectedImprovement: '减少40-60%的延迟',
        implementationComplexity: 'moderate',
        parameters: {
          currentLatency: stats.averageLatency,
          batchSize: 10,
          batchTimeout: 50
        }
      });
    }

    return suggestions;
  }

  /**
   * 应用优化建议
   */
  async applyOptimization(suggestion: OptimizationSuggestion): Promise<boolean> {
    try {
      switch (suggestion.type) {
        case 'cache_tuning':
          return this.applyCacheTuning(suggestion.parameters);
        case 'memory_optimization':
          return this.applyMemoryOptimization(suggestion.parameters);
        case 'batch_processing':
          return this.applyBatchOptimization(suggestion.parameters);
        default:
          return false;
      }
    } catch (error) {
      this.emit('optimizationFailed', { suggestion, error });
      return false;
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStatistics(): PerformanceStatistics {
    const validationStats = this.validationCache.getStatistics();
    const executionStats = this.executionCache.getStatistics();
    
    return {
      cacheHitRate: (validationStats.hitRate + executionStats.hitRate) / 2,
      averageLatency: this.calculateAverageLatency(),
      memoryUsage: (validationStats.currentSizeBytes + executionStats.currentSizeBytes) / 
                   (validationStats.maxSizeBytes + executionStats.maxSizeBytes),
      throughput: this.calculateThroughput(),
      errorRate: this.calculateErrorRate(),
      cacheStatistics: {
        validation: validationStats,
        execution: executionStats
      },
      performanceProfiles: Array.from(this.performanceProfiles.values())
    };
  }

  // 私有方法

  private generateValidationCacheKey(
    action: PlayerAction,
    gameState: GameState,
    rules: RuleDefinition[]
  ): string {
    const actionKey = `${action.type}_${action.playerId}`;
    const stateKey = this.calculateGameStateHash(gameState);
    const rulesKey = rules.map(r => `${r.id}_${r.priority}`).join('|');
    
    return `validation_${actionKey}_${stateKey}_${rulesKey}`;
  }

  private generateExecutionCacheKey(
    action: PlayerAction,
    gameState: GameState,
    context: RuleExecutionContext
  ): string {
    const actionKey = `${action.type}_${action.playerId}`;
    const stateKey = this.calculateGameStateHash(gameState);
    const contextKey = context.executionId;
    
    return `execution_${actionKey}_${stateKey}_${contextKey}`;
  }

  private calculateGameStateHash(gameState: GameState): string {
    // 计算关键状态字段的哈希
    const keyFields = {
      turn: gameState.turn,
      phase: gameState.phase,
      currentPlayer: gameState.currentPlayerIndex,
      playerMoney: gameState.players.map(p => p.money),
      playerPositions: gameState.players.map(p => p.position),
      boardOwnership: gameState.board.filter(cell => cell.ownerId).map(cell => cell.ownerId)
    };
    
    return btoa(JSON.stringify(keyFields)).slice(0, 16);
  }

  private async performValidation(
    action: PlayerAction,
    gameState: GameState,
    rules: RuleDefinition[]
  ): Promise<RuleValidationResult> {
    // 这里应该调用实际的规则验证逻辑
    return {
      isValid: true,
      reason: undefined,
      warnings: [],
      suggestedActions: [],
      requiredConditions: []
    };
  }

  private async performExecution(
    action: PlayerAction,
    gameState: GameState,
    context: RuleExecutionContext
  ): Promise<RuleExecutionResult> {
    // 这里应该调用实际的规则执行逻辑
    return {
      success: true,
      message: 'Execution successful',
      effects: [],
      validationsPassed: [],
      validationsFailed: [],
      stateChanges: [],
      triggeredEvents: []
    };
  }

  private isCachedResultValid(result: RuleExecutionResult, gameState: GameState): boolean {
    // 检查缓存结果是否仍然有效
    return true; // 简化实现
  }

  private isDeterministicResult(result: RuleExecutionResult): boolean {
    // 检查结果是否是确定性的（可以安全缓存）
    return !result.triggeredEvents?.includes('random_event');
  }

  private updatePerformanceProfile(operation: string, duration: number, cacheHit: boolean): void {
    const profile = this.performanceProfiles.get(operation) || {
      operationType: operation,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      throughput: 0,
      errorRate: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      lastUpdated: Date.now()
    };

    // 更新延迟统计
    profile.averageLatency = (profile.averageLatency * 0.9) + (duration * 0.1);
    profile.lastUpdated = Date.now();

    this.performanceProfiles.set(operation, profile);
  }

  private setupCacheEventHandlers(): void {
    this.validationCache.on('cacheHit', (data) => {
      this.emit('cacheEvent', { type: 'validation_hit', ...data });
    });

    this.executionCache.on('cacheHit', (data) => {
      this.emit('cacheEvent', { type: 'execution_hit', ...data });
    });
  }

  private applyCacheTuning(parameters: any): boolean {
    // 应用缓存调优
    if (parameters.suggestedCacheSize) {
      this.cacheConfig.maxSize = parameters.suggestedCacheSize;
    }
    if (parameters.suggestedTTL) {
      this.cacheConfig.defaultTTL = parameters.suggestedTTL;
    }
    return true;
  }

  private applyMemoryOptimization(parameters: any): boolean {
    // 应用内存优化
    if (parameters.compressionEnabled !== undefined) {
      this.cacheConfig.compressionEnabled = parameters.compressionEnabled;
    }
    if (parameters.suggestedCacheSize) {
      this.cacheConfig.maxSize = parameters.suggestedCacheSize;
    }
    return true;
  }

  private applyBatchOptimization(parameters: any): boolean {
    // 应用批处理优化
    this.batchProcessor.updateConfig({
      batchSize: parameters.batchSize,
      batchTimeout: parameters.batchTimeout
    });
    return true;
  }

  private calculateAverageLatency(): number {
    const profiles = Array.from(this.performanceProfiles.values());
    if (profiles.length === 0) return 0;
    
    const totalLatency = profiles.reduce((sum, profile) => sum + profile.averageLatency, 0);
    return totalLatency / profiles.length;
  }

  private calculateThroughput(): number {
    // 实现吞吐量计算
    return 0; // 简化实现
  }

  private calculateErrorRate(): number {
    // 实现错误率计算
    return 0; // 简化实现
  }
}

/**
 * 批处理器
 */
class BatchProcessor {
  private config = {
    batchSize: 10,
    batchTimeout: 100, // 100ms
    maxConcurrentBatches: 5
  };

  constructor(private optimizer: RulePerformanceOptimizer) {}

  async process(requests: BatchRequest[]): Promise<BatchResult[]> {
    const batches = this.createBatches(requests);
    const results: BatchResult[] = [];

    for (const batch of batches) {
      const batchResult = await this.processBatch(batch);
      results.push(batchResult);
    }

    return results;
  }

  updateConfig(config: Partial<typeof this.config>): void {
    Object.assign(this.config, config);
  }

  private createBatches(requests: BatchRequest[]): BatchRequest[][] {
    const batches: BatchRequest[][] = [];
    
    for (let i = 0; i < requests.length; i += this.config.batchSize) {
      batches.push(requests.slice(i, i + this.config.batchSize));
    }

    return batches;
  }

  private async processBatch(batch: BatchRequest[]): Promise<BatchResult> {
    const startTime = Date.now();
    const results: RuleExecutionResult[] = [];
    let cacheHits = 0;

    // 简化的批处理实现
    for (const request of batch) {
      // 这里应该实现实际的批处理逻辑
      results.push({
        success: true,
        message: 'Batch processed',
        effects: [],
        validationsPassed: [],
        validationsFailed: [],
        stateChanges: [],
        triggeredEvents: []
      });
    }

    return {
      requestId: `batch_${Date.now()}`,
      results,
      processingTime: Date.now() - startTime,
      cacheHits,
      optimizationsApplied: ['batch_processing']
    };
  }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  constructor(private optimizer: RulePerformanceOptimizer) {}

  startMonitoring(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 10000); // 每10秒收集一次指标
  }

  private collectMetrics(): void {
    const stats = this.optimizer.getPerformanceStatistics();
    
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      cacheHitRate: stats.cacheHitRate,
      averageLatency: stats.averageLatency,
      memoryUsage: stats.memoryUsage,
      throughput: stats.throughput,
      errorRate: stats.errorRate
    };

    this.metrics.push(metric);
    
    // 保持最近1000个指标
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }
}

// 接口定义
interface CacheStatistics {
  size: number;
  currentSizeBytes: number;
  maxSizeBytes: number;
  hitRate: number;
  evictionCount: number;
  compressionRatio: number;
  averageItemSize: number;
  oldestItem: number;
  newestItem: number;
}

interface PerformanceStatistics {
  cacheHitRate: number;
  averageLatency: number;
  memoryUsage: number;
  throughput: number;
  errorRate: number;
  cacheStatistics: {
    validation: CacheStatistics;
    execution: CacheStatistics;
  };
  performanceProfiles: PerformanceProfile[];
}

interface PerformanceMetric {
  timestamp: number;
  cacheHitRate: number;
  averageLatency: number;
  memoryUsage: number;
  throughput: number;
  errorRate: number;
}