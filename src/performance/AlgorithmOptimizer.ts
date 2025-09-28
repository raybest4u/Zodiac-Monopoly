import { EventEmitter } from '../utils/EventEmitter';

export interface AlgorithmProfile {
  name: string;
  complexity: 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2^n)' | 'unknown';
  averageExecutionTime: number;
  worstCaseTime: number;
  memoryUsage: number;
  callCount: number;
  optimizationLevel: 'none' | 'basic' | 'advanced' | 'maximum';
}

export interface OptimizationHint {
  algorithmName: string;
  suggestion: string;
  impact: 'low' | 'medium' | 'high';
  complexity: string;
  estimatedImprovement: number;
}

export interface ComputationTask {
  id: string;
  name: string;
  operation: () => any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  maxExecutionTime: number;
  canBeOptimized: boolean;
  dependencies: string[];
}

export interface OptimizedAlgorithm<T = any> {
  original: (...args: any[]) => T;
  optimized: (...args: any[]) => T;
  memoized?: (...args: any[]) => T;
  vectorized?: (...args: any[]) => T;
  cached?: (...args: any[]) => T;
}

export class MemoizationCache<T = any> {
  private cache: Map<string, { value: T; timestamp: number; hits: number }> = new Map();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize: number = 1000, ttlMs: number = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  public get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    entry.hits++;
    return entry.value;
  }

  public set(key: string, value: T): void {
    const now = Date.now();
    
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      value,
      timestamp: now,
      hits: 0,
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats() {
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      averageHits: this.cache.size > 0 ? totalHits / this.cache.size : 0,
    };
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.hits < leastHits || (entry.hits === leastHits && entry.timestamp < oldestTime)) {
        leastUsedKey = key;
        leastHits = entry.hits;
        oldestTime = entry.timestamp;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }
}

export class BatchProcessor {
  private batches: Map<string, any[]> = new Map();
  private processors: Map<string, (items: any[]) => any[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  public registerBatchProcessor<T, R>(
    name: string,
    processor: (items: T[]) => R[],
    batchSize: number = 100,
    maxWaitTime: number = 50
  ): void {
    this.processors.set(name, processor);
    this.batches.set(name, []);

    // Set up automatic batch processing timer
    const timer = setInterval(() => {
      this.processBatch(name);
    }, maxWaitTime);

    this.timers.set(name, timer);
  }

  public addToBatch<T>(batchName: string, item: T): Promise<any> {
    return new Promise((resolve, reject) => {
      const batch = this.batches.get(batchName);
      if (!batch) {
        reject(new Error(`Batch processor '${batchName}' not found`));
        return;
      }

      batch.push({ item, resolve, reject });
      
      // Process immediately if batch is full
      const processor = this.processors.get(batchName);
      if (processor && batch.length >= 100) { // Default batch size
        this.processBatch(batchName);
      }
    });
  }

  private processBatch(batchName: string): void {
    const batch = this.batches.get(batchName);
    const processor = this.processors.get(batchName);

    if (!batch || !processor || batch.length === 0) {
      return;
    }

    try {
      const items = batch.map(entry => entry.item);
      const results = processor(items);

      // Resolve all promises with their corresponding results
      batch.forEach((entry, index) => {
        entry.resolve(results[index]);
      });

      // Clear the batch
      batch.length = 0;
    } catch (error) {
      // Reject all promises with the error
      batch.forEach(entry => {
        entry.reject(error);
      });
      batch.length = 0;
    }
  }

  public destroy(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.batches.clear();
    this.processors.clear();
  }
}

export class AlgorithmOptimizer extends EventEmitter {
  private algorithmProfiles: Map<string, AlgorithmProfile> = new Map();
  private optimizedAlgorithms: Map<string, OptimizedAlgorithm> = new Map();
  private memoizationCaches: Map<string, MemoizationCache> = new Map();
  private batchProcessor: BatchProcessor = new BatchProcessor();
  private computationQueue: ComputationTask[] = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    super();
    this.initializeCommonOptimizations();
  }

  public profileAlgorithm<T>(
    name: string,
    algorithm: (...args: any[]) => T,
    testCases: any[][] = []
  ): AlgorithmProfile {
    const profile: AlgorithmProfile = {
      name,
      complexity: 'unknown',
      averageExecutionTime: 0,
      worstCaseTime: 0,
      memoryUsage: 0,
      callCount: 0,
      optimizationLevel: 'none',
    };

    if (testCases.length > 0) {
      const executionTimes: number[] = [];
      let totalMemory = 0;

      testCases.forEach(testCase => {
        const startTime = performance.now();
        const startMemory = process.memoryUsage().heapUsed;
        
        algorithm(...testCase);
        
        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed;
        
        executionTimes.push(endTime - startTime);
        totalMemory += Math.max(0, endMemory - startMemory);
        profile.callCount++;
      });

      profile.averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
      profile.worstCaseTime = Math.max(...executionTimes);
      profile.memoryUsage = totalMemory / testCases.length;
      profile.complexity = this.estimateComplexity(testCases, executionTimes);
    }

    this.algorithmProfiles.set(name, profile);
    this.emit('algorithm:profiled', { name, profile });

    return profile;
  }

  public optimizeAlgorithm<T>(
    name: string,
    algorithm: (...args: any[]) => T,
    options: {
      enableMemoization?: boolean;
      enableBatching?: boolean;
      enableCaching?: boolean;
      cacheSize?: number;
      cacheTTL?: number;
    } = {}
  ): OptimizedAlgorithm<T> {
    const optimized: OptimizedAlgorithm<T> = {
      original: algorithm,
      optimized: algorithm,
    };

    // Apply memoization
    if (options.enableMemoization !== false) {
      optimized.memoized = this.createMemoizedFunction(name, algorithm, options.cacheSize, options.cacheTTL);
      optimized.optimized = optimized.memoized;
    }

    // Apply caching for expensive operations
    if (options.enableCaching) {
      optimized.cached = this.createCachedFunction(name, optimized.optimized);
      optimized.optimized = optimized.cached;
    }

    // Apply batching for bulk operations
    if (options.enableBatching) {
      optimized.vectorized = this.createBatchedFunction(name, optimized.optimized);
    }

    this.optimizedAlgorithms.set(name, optimized);
    this.emit('algorithm:optimized', { name, optimizations: Object.keys(optimized).filter(k => k !== 'original' && optimized[k as keyof OptimizedAlgorithm]) });

    return optimized;
  }

  public createMemoizedFunction<T>(
    name: string,
    fn: (...args: any[]) => T,
    maxSize: number = 1000,
    ttl: number = 300000
  ): (...args: any[]) => T {
    const cache = new MemoizationCache<T>(maxSize, ttl);
    this.memoizationCaches.set(name, cache);

    return (...args: any[]): T => {
      const key = this.generateCacheKey(args);
      const cached = cache.get(key);
      
      if (cached !== undefined) {
        return cached;
      }

      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }

  public createBatchedFunction<T>(
    name: string,
    fn: (...args: any[]) => T
  ): (...args: any[]) => Promise<T> {
    this.batchProcessor.registerBatchProcessor(
      name,
      (items: any[]) => items.map(item => fn(...item)),
      100,
      50
    );

    return (...args: any[]): Promise<T> => {
      return this.batchProcessor.addToBatch(name, args);
    };
  }

  public createCachedFunction<T>(
    name: string,
    fn: (...args: any[]) => T
  ): (...args: any[]) => T {
    const cache = new Map<string, { value: T; timestamp: number }>();
    const TTL = 60000; // 1 minute

    return (...args: any[]): T => {
      const key = this.generateCacheKey(args);
      const cached = cache.get(key);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < TTL) {
        return cached.value;
      }

      const result = fn(...args);
      cache.set(key, { value: result, timestamp: now });

      // Clean up old entries
      if (cache.size > 500) {
        for (const [k, v] of cache) {
          if ((now - v.timestamp) > TTL) {
            cache.delete(k);
          }
        }
      }

      return result;
    };
  }

  public addComputationTask(task: ComputationTask): void {
    this.computationQueue.push(task);
    this.computationQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    if (!this.isProcessingQueue) {
      this.processComputationQueue();
    }
  }

  public getOptimizationHints(): OptimizationHint[] {
    const hints: OptimizationHint[] = [];

    for (const [name, profile] of this.algorithmProfiles) {
      // Check for algorithms that could benefit from optimization
      if (profile.averageExecutionTime > 100) { // > 100ms
        hints.push({
          algorithmName: name,
          suggestion: 'Consider memoization or caching for this slow algorithm',
          impact: 'high',
          complexity: profile.complexity,
          estimatedImprovement: Math.min(90, profile.averageExecutionTime * 0.8),
        });
      }

      if (profile.complexity === 'O(n²)' || profile.complexity === 'O(2^n)') {
        hints.push({
          algorithmName: name,
          suggestion: 'High complexity algorithm detected - consider algorithmic improvements',
          impact: 'high',
          complexity: profile.complexity,
          estimatedImprovement: 50,
        });
      }

      if (profile.callCount > 1000 && profile.averageExecutionTime > 10) {
        hints.push({
          algorithmName: name,
          suggestion: 'Frequently called algorithm - enable memoization',
          impact: 'medium',
          complexity: profile.complexity,
          estimatedImprovement: 30,
        });
      }

      if (profile.memoryUsage > 10 * 1024 * 1024) { // > 10MB
        hints.push({
          algorithmName: name,
          suggestion: 'High memory usage - consider streaming or chunking',
          impact: 'medium',
          complexity: profile.complexity,
          estimatedImprovement: 40,
        });
      }
    }

    return hints;
  }

  public optimizeGameSpecificAlgorithms(): void {
    // Optimize path finding algorithms
    this.optimizePathfinding();
    
    // Optimize AI decision algorithms
    this.optimizeAIDecisions();
    
    // Optimize property evaluation algorithms
    this.optimizePropertyEvaluation();
    
    // Optimize game state calculations
    this.optimizeGameStateCalculations();

    this.emit('gameAlgorithms:optimized');
  }

  public generateOptimizationReport(): any {
    const profiles = Array.from(this.algorithmProfiles.values());
    const hints = this.getOptimizationHints();
    const cacheStats = new Map();

    for (const [name, cache] of this.memoizationCaches) {
      cacheStats.set(name, cache.getStats());
    }

    return {
      timestamp: Date.now(),
      totalAlgorithms: profiles.length,
      optimizedAlgorithms: this.optimizedAlgorithms.size,
      algorithmProfiles: profiles,
      optimizationHints: hints,
      cachePerformance: Object.fromEntries(cacheStats),
      overallOptimizationLevel: this.calculateOverallOptimization(),
      recommendations: this.generateRecommendations(hints),
    };
  }

  private initializeCommonOptimizations(): void {
    // Initialize batch processor for common operations
    this.batchProcessor.registerBatchProcessor(
      'propertyEvaluations',
      (properties: any[]) => properties.map(prop => this.evaluateProperty(prop)),
      50,
      30
    );

    this.batchProcessor.registerBatchProcessor(
      'aiDecisionAnalysis',
      (decisions: any[]) => decisions.map(decision => this.analyzeDecision(decision)),
      20,
      100
    );
  }

  private estimateComplexity(testCases: any[][], executionTimes: number[]): AlgorithmProfile['complexity'] {
    if (testCases.length < 3) return 'unknown';

    const inputSizes = testCases.map(tc => tc.length > 0 ? tc[0]?.length || 1 : 1);
    const correlations = this.calculateComplexityCorrelations(inputSizes, executionTimes);

    // Find the best fitting complexity
    const bestFit = Object.entries(correlations).reduce((best, [complexity, correlation]) => 
      correlation > best.correlation ? { complexity, correlation } : best,
      { complexity: 'unknown', correlation: 0 }
    );

    return bestFit.complexity as AlgorithmProfile['complexity'];
  }

  private calculateComplexityCorrelations(inputSizes: number[], executionTimes: number[]): Record<string, number> {
    const correlations: Record<string, number> = {};

    // O(1) - constant time
    correlations['O(1)'] = this.calculateCorrelation(inputSizes.map(() => 1), executionTimes);
    
    // O(log n)
    correlations['O(log n)'] = this.calculateCorrelation(inputSizes.map(n => Math.log(n)), executionTimes);
    
    // O(n)
    correlations['O(n)'] = this.calculateCorrelation(inputSizes, executionTimes);
    
    // O(n log n)
    correlations['O(n log n)'] = this.calculateCorrelation(inputSizes.map(n => n * Math.log(n)), executionTimes);
    
    // O(n²)
    correlations['O(n²)'] = this.calculateCorrelation(inputSizes.map(n => n * n), executionTimes);

    return correlations;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private generateCacheKey(args: any[]): string {
    return JSON.stringify(args);
  }

  private async processComputationQueue(): Promise<void> {
    this.isProcessingQueue = true;

    while (this.computationQueue.length > 0) {
      const task = this.computationQueue.shift()!;
      
      try {
        const startTime = performance.now();
        const result = await this.executeWithTimeout(task.operation, task.maxExecutionTime);
        const endTime = performance.now();

        this.emit('computation:completed', {
          taskId: task.id,
          name: task.name,
          executionTime: endTime - startTime,
          result,
        });
      } catch (error) {
        this.emit('computation:failed', {
          taskId: task.id,
          name: task.name,
          error,
        });
      }

      // Yield control to prevent blocking
      await new Promise(resolve => setImmediate(resolve));
    }

    this.isProcessingQueue = false;
  }

  private executeWithTimeout<T>(operation: () => T, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = operation();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private optimizePathfinding(): void {
    // Implement A* optimization with better heuristics
    const optimizedAStar = this.optimizeAlgorithm('pathfinding_astar', 
      this.defaultPathfinding, {
        enableMemoization: true,
        enableCaching: true,
        cacheSize: 500,
      }
    );
  }

  private optimizeAIDecisions(): void {
    // Optimize AI decision tree algorithms
    const optimizedDecisionTree = this.optimizeAlgorithm('ai_decision_tree',
      this.defaultAIDecision, {
        enableMemoization: true,
        enableBatching: true,
        cacheSize: 200,
      }
    );
  }

  private optimizePropertyEvaluation(): void {
    // Optimize property value calculations
    const optimizedPropertyEval = this.optimizeAlgorithm('property_evaluation',
      this.defaultPropertyEvaluation, {
        enableMemoization: true,
        enableCaching: true,
        cacheSize: 1000,
      }
    );
  }

  private optimizeGameStateCalculations(): void {
    // Optimize game state hash calculations
    const optimizedGameState = this.optimizeAlgorithm('game_state_calculation',
      this.defaultGameStateCalculation, {
        enableMemoization: true,
        cacheSize: 300,
      }
    );
  }

  private defaultPathfinding(): any {
    // Placeholder for actual pathfinding algorithm
    return {};
  }

  private defaultAIDecision(): any {
    // Placeholder for actual AI decision algorithm
    return {};
  }

  private defaultPropertyEvaluation(): any {
    // Placeholder for actual property evaluation algorithm
    return {};
  }

  private defaultGameStateCalculation(): any {
    // Placeholder for actual game state calculation
    return {};
  }

  private evaluateProperty(property: any): any {
    // Placeholder for property evaluation
    return property;
  }

  private analyzeDecision(decision: any): any {
    // Placeholder for decision analysis
    return decision;
  }

  private calculateOverallOptimization(): number {
    const totalAlgorithms = this.algorithmProfiles.size;
    const optimizedCount = this.optimizedAlgorithms.size;
    
    return totalAlgorithms > 0 ? (optimizedCount / totalAlgorithms) * 100 : 0;
  }

  private generateRecommendations(hints: OptimizationHint[]): string[] {
    const recommendations: string[] = [];
    
    const highImpactHints = hints.filter(h => h.impact === 'high');
    if (highImpactHints.length > 0) {
      recommendations.push(`Focus on optimizing ${highImpactHints.length} high-impact algorithms`);
    }

    const complexAlgorithms = hints.filter(h => h.complexity === 'O(n²)' || h.complexity === 'O(2^n)');
    if (complexAlgorithms.length > 0) {
      recommendations.push('Consider algorithmic improvements for high-complexity functions');
    }

    const cacheStats = Array.from(this.memoizationCaches.values());
    const avgHitRate = cacheStats.reduce((sum, cache) => sum + (cache.getStats().averageHits || 0), 0) / cacheStats.length;
    
    if (avgHitRate < 2) {
      recommendations.push('Improve cache hit rates by adjusting cache sizes and TTL values');
    }

    return recommendations;
  }

  public destroy(): void {
    this.batchProcessor.destroy();
    this.memoizationCaches.clear();
    this.algorithmProfiles.clear();
    this.optimizedAlgorithms.clear();
    this.computationQueue.length = 0;
  }
}

export const algorithmOptimizer = new AlgorithmOptimizer();