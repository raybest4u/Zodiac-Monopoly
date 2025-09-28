import { EventEmitter } from '../utils/EventEmitter';

export interface CacheConfig {
  name: string;
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  algorithm: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  persistent: boolean;
  compressionEnabled: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  compressed: boolean;
}

export interface CacheStats {
  name: string;
  size: number;
  maxSize: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  averageAccessTime: number;
  memoryUsage: number;
  evictionCount: number;
}

export interface DataOptimizationConfig {
  enableCompression: boolean;
  enableSerialization: boolean;
  enableIndexing: boolean;
  compressionThreshold: number;
  maxObjectSize: number;
  enableDeduplication: boolean;
}

export interface IndexConfig {
  fields: string[];
  unique: boolean;
  sparse: boolean;
  type: 'hash' | 'btree' | 'bitmap';
}

export class MultiLevelCache<T = any> extends EventEmitter {
  private l1Cache: Map<string, CacheEntry<T>> = new Map(); // Fast in-memory cache
  private l2Cache: Map<string, CacheEntry<T>> = new Map(); // Larger, slower cache
  private accessTimes: Map<string, number[]> = new Map();
  private stats: CacheStats;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    super();
    this.config = config;
    this.stats = {
      name: config.name,
      size: 0,
      maxSize: config.maxSize,
      hitRate: 0,
      missRate: 0,
      totalHits: 0,
      totalMisses: 0,
      totalRequests: 0,
      averageAccessTime: 0,
      memoryUsage: 0,
      evictionCount: 0,
    };

    this.setupCleanupInterval();
  }

  public get(key: string): T | undefined {
    const startTime = performance.now();
    this.stats.totalRequests++;

    // Check L1 cache first
    let entry = this.l1Cache.get(key);
    if (entry) {
      if (this.isEntryValid(entry)) {
        this.updateEntryAccess(entry);
        this.recordAccessTime(key, performance.now() - startTime);
        this.stats.totalHits++;
        this.updateHitRate();
        this.emit('cache:hit', { key, level: 'L1', entry });
        return entry.value;
      } else {
        this.l1Cache.delete(key);
      }
    }

    // Check L2 cache
    entry = this.l2Cache.get(key);
    if (entry) {
      if (this.isEntryValid(entry)) {
        this.updateEntryAccess(entry);
        
        // Promote to L1 if frequently accessed
        if (entry.accessCount > 3) {
          this.promoteToL1(key, entry);
        }
        
        this.recordAccessTime(key, performance.now() - startTime);
        this.stats.totalHits++;
        this.updateHitRate();
        this.emit('cache:hit', { key, level: 'L2', entry });
        return entry.value;
      } else {
        this.l2Cache.delete(key);
      }
    }

    // Cache miss
    this.stats.totalMisses++;
    this.updateHitRate();
    this.emit('cache:miss', { key });
    return undefined;
  }

  public set(key: string, value: T, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.config.ttl;
    
    const entry: CacheEntry<T> = {
      key,
      value: this.config.compressionEnabled ? this.compress(value) : value,
      timestamp: now,
      lastAccessed: now,
      accessCount: 0,
      size: this.calculateSize(value),
      compressed: this.config.compressionEnabled,
    };

    // Add to L1 cache first
    if (this.l1Cache.size < this.config.maxSize * 0.2) { // L1 is 20% of total size
      this.l1Cache.set(key, entry);
    } else {
      // Add to L2 cache
      this.l2Cache.set(key, entry);
      
      // Evict if necessary
      if (this.l2Cache.size > this.config.maxSize * 0.8) {
        this.evictFromL2();
      }
    }

    this.stats.size++;
    this.updateMemoryUsage();
    this.emit('cache:set', { key, entry });
  }

  public delete(key: string): boolean {
    const deletedFromL1 = this.l1Cache.delete(key);
    const deletedFromL2 = this.l2Cache.delete(key);
    
    if (deletedFromL1 || deletedFromL2) {
      this.stats.size--;
      this.updateMemoryUsage();
      this.emit('cache:delete', { key });
      return true;
    }
    
    return false;
  }

  public clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.accessTimes.clear();
    this.resetStats();
    this.emit('cache:clear');
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public optimize(): void {
    this.cleanupExpiredEntries();
    this.rebalanceCaches();
    this.emit('cache:optimized');
  }

  private isEntryValid(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < this.config.ttl;
  }

  private updateEntryAccess(entry: CacheEntry<T>): void {
    entry.lastAccessed = Date.now();
    entry.accessCount++;
  }

  private promoteToL1(key: string, entry: CacheEntry<T>): void {
    this.l2Cache.delete(key);
    
    // Make room in L1 if necessary
    if (this.l1Cache.size >= this.config.maxSize * 0.2) {
      this.evictFromL1();
    }
    
    this.l1Cache.set(key, entry);
    this.emit('cache:promote', { key, from: 'L2', to: 'L1' });
  }

  private evictFromL1(): void {
    if (this.l1Cache.size === 0) return;

    const victim = this.selectEvictionCandidate(this.l1Cache);
    if (victim) {
      this.l1Cache.delete(victim.key);
      
      // Demote to L2 if still valid
      if (this.isEntryValid(victim)) {
        this.l2Cache.set(victim.key, victim);
        this.emit('cache:demote', { key: victim.key, from: 'L1', to: 'L2' });
      }
      
      this.stats.evictionCount++;
    }
  }

  private evictFromL2(): void {
    if (this.l2Cache.size === 0) return;

    const victim = this.selectEvictionCandidate(this.l2Cache);
    if (victim) {
      this.l2Cache.delete(victim.key);
      this.stats.evictionCount++;
      this.emit('cache:evict', { key: victim.key, level: 'L2' });
    }
  }

  private selectEvictionCandidate(cache: Map<string, CacheEntry<T>>): CacheEntry<T> | null {
    if (cache.size === 0) return null;

    switch (this.config.algorithm) {
      case 'LRU':
        return this.selectLRU(cache);
      case 'LFU':
        return this.selectLFU(cache);
      case 'FIFO':
        return this.selectFIFO(cache);
      case 'TTL':
        return this.selectTTL(cache);
      default:
        return this.selectLRU(cache);
    }
  }

  private selectLRU(cache: Map<string, CacheEntry<T>>): CacheEntry<T> | null {
    let oldest: CacheEntry<T> | null = null;
    let oldestTime = Date.now();

    for (const entry of cache.values()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldest = entry;
      }
    }

    return oldest;
  }

  private selectLFU(cache: Map<string, CacheEntry<T>>): CacheEntry<T> | null {
    let leastUsed: CacheEntry<T> | null = null;
    let leastCount = Infinity;

    for (const entry of cache.values()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsed = entry;
      }
    }

    return leastUsed;
  }

  private selectFIFO(cache: Map<string, CacheEntry<T>>): CacheEntry<T> | null {
    let oldest: CacheEntry<T> | null = null;
    let oldestTime = Date.now();

    for (const entry of cache.values()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = entry;
      }
    }

    return oldest;
  }

  private selectTTL(cache: Map<string, CacheEntry<T>>): CacheEntry<T> | null {
    let expiring: CacheEntry<T> | null = null;
    let earliestExpiry = Date.now() + this.config.ttl;

    for (const entry of cache.values()) {
      const expiryTime = entry.timestamp + this.config.ttl;
      if (expiryTime < earliestExpiry) {
        earliestExpiry = expiryTime;
        expiring = entry;
      }
    }

    return expiring;
  }

  private compress<V>(value: V): V {
    // Simplified compression - in real implementation would use actual compression
    if (this.config.compressionEnabled && this.calculateSize(value) > 1024) {
      // Simulate compression
      return value;
    }
    return value;
  }

  private calculateSize(value: any): number {
    // Simplified size calculation
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  private recordAccessTime(key: string, time: number): void {
    const times = this.accessTimes.get(key) || [];
    times.push(time);
    
    if (times.length > 100) {
      times.shift();
    }
    
    this.accessTimes.set(key, times);
    
    // Update average access time
    const totalTime = Array.from(this.accessTimes.values())
      .flat()
      .reduce((sum, t) => sum + t, 0);
    const totalAccesses = Array.from(this.accessTimes.values())
      .reduce((sum, times) => sum + times.length, 0);
    
    this.stats.averageAccessTime = totalAccesses > 0 ? totalTime / totalAccesses : 0;
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 ? 
      (this.stats.totalHits / this.stats.totalRequests) * 100 : 0;
    this.stats.missRate = 100 - this.stats.hitRate;
  }

  private updateMemoryUsage(): void {
    let totalSize = 0;
    
    for (const entry of this.l1Cache.values()) {
      totalSize += entry.size;
    }
    for (const entry of this.l2Cache.values()) {
      totalSize += entry.size;
    }
    
    this.stats.memoryUsage = totalSize;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.l1Cache) {
      if (!this.isEntryValid(entry)) {
        this.l1Cache.delete(key);
        this.stats.size--;
      }
    }
    
    for (const [key, entry] of this.l2Cache) {
      if (!this.isEntryValid(entry)) {
        this.l2Cache.delete(key);
        this.stats.size--;
      }
    }
    
    this.updateMemoryUsage();
  }

  private rebalanceCaches(): void {
    // Move frequently accessed L2 items to L1
    const l2Entries = Array.from(this.l2Cache.entries())
      .sort(([, a], [, b]) => b.accessCount - a.accessCount);
    
    const l1Target = Math.floor(this.config.maxSize * 0.2);
    const toPromote = l1Target - this.l1Cache.size;
    
    for (let i = 0; i < toPromote && i < l2Entries.length; i++) {
      const [key, entry] = l2Entries[i];
      this.promoteToL1(key, entry);
    }
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.ttl / 4); // Cleanup every 1/4 of TTL
  }

  private resetStats(): void {
    this.stats = {
      name: this.config.name,
      size: 0,
      maxSize: this.config.maxSize,
      hitRate: 0,
      missRate: 0,
      totalHits: 0,
      totalMisses: 0,
      totalRequests: 0,
      averageAccessTime: 0,
      memoryUsage: 0,
      evictionCount: 0,
    };
  }
}

export class DataOptimizer extends EventEmitter {
  private indices: Map<string, Map<any, Set<string>>> = new Map();
  private deduplicationMap: Map<string, string> = new Map();
  private compressionStats: Map<string, { original: number; compressed: number }> = new Map();
  private config: DataOptimizationConfig;

  constructor(config: DataOptimizationConfig) {
    super();
    this.config = config;
  }

  public createIndex(name: string, indexConfig: IndexConfig): void {
    this.indices.set(name, new Map());
    this.emit('index:created', { name, config: indexConfig });
  }

  public addToIndex(indexName: string, object: any, objectId: string): void {
    const index = this.indices.get(indexName);
    if (!index) return;

    // Extract indexable values from object
    const indexValues = this.extractIndexValues(object);
    
    for (const value of indexValues) {
      if (!index.has(value)) {
        index.set(value, new Set());
      }
      index.get(value)!.add(objectId);
    }
  }

  public queryIndex(indexName: string, value: any): Set<string> | undefined {
    const index = this.indices.get(indexName);
    return index?.get(value);
  }

  public optimizeData<T>(data: T, dataId: string): T {
    let optimizedData = data;

    // Apply compression if enabled
    if (this.config.enableCompression) {
      optimizedData = this.compressData(optimizedData, dataId);
    }

    // Apply deduplication if enabled
    if (this.config.enableDeduplication) {
      optimizedData = this.deduplicateData(optimizedData, dataId);
    }

    // Apply serialization optimization if enabled
    if (this.config.enableSerialization) {
      optimizedData = this.optimizeSerialization(optimizedData);
    }

    this.emit('data:optimized', { dataId, originalSize: this.getDataSize(data), optimizedSize: this.getDataSize(optimizedData) });
    return optimizedData;
  }

  public batchOptimize<T>(dataArray: Array<{ id: string; data: T }>): Array<{ id: string; data: T }> {
    return dataArray.map(({ id, data }) => ({
      id,
      data: this.optimizeData(data, id),
    }));
  }

  public generateOptimizationReport(): any {
    const totalCompression = Array.from(this.compressionStats.values())
      .reduce((acc, stats) => ({
        original: acc.original + stats.original,
        compressed: acc.compressed + stats.compressed,
      }), { original: 0, compressed: 0 });

    const compressionRatio = totalCompression.original > 0 ? 
      (totalCompression.compressed / totalCompression.original) * 100 : 100;

    return {
      timestamp: Date.now(),
      indices: {
        count: this.indices.size,
        totalEntries: Array.from(this.indices.values())
          .reduce((sum, index) => sum + index.size, 0),
      },
      compression: {
        enabled: this.config.enableCompression,
        totalOriginalSize: totalCompression.original,
        totalCompressedSize: totalCompression.compressed,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        savings: Math.round((100 - compressionRatio) * 100) / 100,
      },
      deduplication: {
        enabled: this.config.enableDeduplication,
        duplicatesFound: this.deduplicationMap.size,
      },
      recommendations: this.generateOptimizationRecommendations(),
    };
  }

  private extractIndexValues(object: any): any[] {
    // Simplified extraction - in real implementation would be more sophisticated
    if (typeof object === 'object' && object !== null) {
      return Object.values(object).filter(value => 
        typeof value === 'string' || typeof value === 'number'
      );
    }
    return [object];
  }

  private compressData<T>(data: T, dataId: string): T {
    const originalSize = this.getDataSize(data);
    
    if (originalSize < this.config.compressionThreshold) {
      return data; // Skip compression for small data
    }

    // Simulate compression (in real implementation, use actual compression library)
    const compressedSize = Math.floor(originalSize * 0.7); // Assume 30% compression
    
    this.compressionStats.set(dataId, {
      original: originalSize,
      compressed: compressedSize,
    });

    // Return compressed version (simplified simulation)
    return data;
  }

  private deduplicateData<T>(data: T, dataId: string): T {
    const dataHash = this.generateDataHash(data);
    const existingId = this.deduplicationMap.get(dataHash);
    
    if (existingId && existingId !== dataId) {
      // Data already exists, return reference
      this.emit('data:deduplicated', { originalId: dataId, duplicateOf: existingId });
      return data; // In real implementation, would return reference
    }
    
    this.deduplicationMap.set(dataHash, dataId);
    return data;
  }

  private optimizeSerialization<T>(data: T): T {
    // Optimize object structure for serialization
    if (typeof data === 'object' && data !== null) {
      // Remove undefined values, optimize arrays, etc.
      return this.cleanObjectForSerialization(data);
    }
    return data;
  }

  private cleanObjectForSerialization(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObjectForSerialization(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
          cleaned[key] = this.cleanObjectForSerialization(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  private getDataSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate in bytes
  }

  private generateDataHash(data: any): string {
    // Simple hash generation (in real implementation, use proper hashing)
    return JSON.stringify(data).split('').reduce((hash, char) => {
      hash = ((hash << 5) - hash) + char.charCodeAt(0);
      return hash & hash; // Convert to 32-bit integer
    }, 0).toString();
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const totalStats = Array.from(this.compressionStats.values())
      .reduce((acc, stats) => ({
        original: acc.original + stats.original,
        compressed: acc.compressed + stats.compressed,
      }), { original: 0, compressed: 0 });

    const compressionRatio = totalStats.original > 0 ? 
      (totalStats.compressed / totalStats.original) * 100 : 100;

    if (compressionRatio > 80) {
      recommendations.push('Consider using more aggressive compression algorithms');
    }

    if (this.deduplicationMap.size > 100) {
      recommendations.push('High number of duplicates detected - implement better deduplication strategy');
    }

    if (this.indices.size === 0) {
      recommendations.push('Consider creating indices for frequently queried data');
    }

    return recommendations;
  }
}

export class CacheOptimizer extends EventEmitter {
  private caches: Map<string, MultiLevelCache> = new Map();
  private dataOptimizer: DataOptimizer;
  private globalStats: {
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    totalEvictions: number;
  } = {
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    totalEvictions: 0,
  };

  constructor() {
    super();
    this.dataOptimizer = new DataOptimizer({
      enableCompression: true,
      enableSerialization: true,
      enableIndexing: true,
      compressionThreshold: 1024,
      maxObjectSize: 10 * 1024 * 1024,
      enableDeduplication: true,
    });

    this.initializeDefaultCaches();
  }

  public createCache(config: CacheConfig): MultiLevelCache {
    const cache = new MultiLevelCache(config);
    
    // Set up event listeners for statistics
    cache.on('cache:hit', () => this.globalStats.totalHits++);
    cache.on('cache:miss', () => this.globalStats.totalMisses++);
    cache.on('cache:evict', () => this.globalStats.totalEvictions++);
    
    this.caches.set(config.name, cache);
    this.emit('cache:created', { name: config.name });
    
    return cache;
  }

  public getCache(name: string): MultiLevelCache | undefined {
    return this.caches.get(name);
  }

  public optimizeAllCaches(): void {
    for (const cache of this.caches.values()) {
      cache.optimize();
    }
    this.emit('caches:optimized');
  }

  public generateGlobalReport(): any {
    const cacheReports = new Map();
    
    for (const [name, cache] of this.caches) {
      cacheReports.set(name, cache.getStats());
    }

    const totalRequests = this.globalStats.totalHits + this.globalStats.totalMisses;
    const globalHitRate = totalRequests > 0 ? 
      (this.globalStats.totalHits / totalRequests) * 100 : 0;

    return {
      timestamp: Date.now(),
      globalStats: {
        ...this.globalStats,
        totalRequests,
        globalHitRate: Math.round(globalHitRate * 100) / 100,
      },
      cacheStats: Object.fromEntries(cacheReports),
      dataOptimization: this.dataOptimizer.generateOptimizationReport(),
      recommendations: this.generateGlobalRecommendations(globalHitRate),
    };
  }

  public preloadCache(cacheName: string, data: Map<string, any>): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    for (const [key, value] of data) {
      const optimizedValue = this.dataOptimizer.optimizeData(value, key);
      cache.set(key, optimizedValue);
    }

    this.emit('cache:preloaded', { cacheName, itemCount: data.size });
  }

  public warmupCache(cacheName: string, keys: string[], dataLoader: (key: string) => Promise<any>): Promise<void> {
    const cache = this.caches.get(cacheName);
    if (!cache) return Promise.resolve();

    const loadPromises = keys.map(async (key) => {
      try {
        const data = await dataLoader(key);
        const optimizedData = this.dataOptimizer.optimizeData(data, key);
        cache.set(key, optimizedData);
      } catch (error) {
        this.emit('cache:warmup:error', { key, error });
      }
    });

    return Promise.all(loadPromises).then(() => {
      this.emit('cache:warmed', { cacheName, keyCount: keys.length });
    });
  }

  private initializeDefaultCaches(): void {
    // Game state cache
    this.createCache({
      name: 'gameState',
      maxSize: 1000,
      ttl: 300000, // 5 minutes
      algorithm: 'LRU',
      persistent: false,
      compressionEnabled: true,
    });

    // AI decision cache
    this.createCache({
      name: 'aiDecisions',
      maxSize: 500,
      ttl: 600000, // 10 minutes
      algorithm: 'LFU',
      persistent: true,
      compressionEnabled: true,
    });

    // Property evaluation cache
    this.createCache({
      name: 'propertyEvaluations',
      maxSize: 2000,
      ttl: 900000, // 15 minutes
      algorithm: 'LRU',
      persistent: false,
      compressionEnabled: false,
    });

    // UI component cache
    this.createCache({
      name: 'uiComponents',
      maxSize: 300,
      ttl: 1800000, // 30 minutes
      algorithm: 'TTL',
      persistent: false,
      compressionEnabled: false,
    });

    // Player profile cache
    this.createCache({
      name: 'playerProfiles',
      maxSize: 100,
      ttl: 3600000, // 1 hour
      algorithm: 'LRU',
      persistent: true,
      compressionEnabled: true,
    });
  }

  private generateGlobalRecommendations(globalHitRate: number): string[] {
    const recommendations: string[] = [];

    if (globalHitRate < 70) {
      recommendations.push('Global cache hit rate is low - consider increasing cache sizes or TTL values');
    }

    if (this.globalStats.totalEvictions > this.globalStats.totalHits * 0.5) {
      recommendations.push('High eviction rate detected - consider increasing cache sizes');
    }

    const cacheCount = this.caches.size;
    if (cacheCount < 3) {
      recommendations.push('Consider creating more specialized caches for different data types');
    }

    // Check individual cache performance
    for (const [name, cache] of this.caches) {
      const stats = cache.getStats();
      if (stats.hitRate < 50) {
        recommendations.push(`Cache '${name}' has low hit rate - review caching strategy`);
      }
    }

    return recommendations;
  }

  public destroy(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
    this.caches.clear();
    this.globalStats = {
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      totalEvictions: 0,
    };
  }
}

export const cacheOptimizer = new CacheOptimizer();