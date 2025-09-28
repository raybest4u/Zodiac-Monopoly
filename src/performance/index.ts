/**
 * Performance Optimization System
 * 
 * This module provides comprehensive performance optimization for the Zodiac Monopoly game,
 * including monitoring, memory management, algorithm optimization, concurrency management,
 * and intelligent caching systems.
 */

// Core performance components
export { 
  PerformanceMonitor, 
  performanceMonitor,
  type PerformanceMetrics,
  type PerformanceAlert,
  type PerformanceThresholds,
  type PerformanceProfile
} from './PerformanceMonitor';

export {
  GamePerformanceTracker,
  gamePerformanceTracker,
  type GamePerformanceData,
  type PerformanceBaseline,
  type PerformanceComparison
} from './GamePerformanceTracker';

// Memory optimization
export {
  MemoryOptimizer,
  ObjectPool,
  memoryOptimizer,
  type MemoryPoolConfig,
  type MemoryUsageStats,
  type MemoryOptimizationStrategy
} from './MemoryOptimizer';

// Algorithm optimization
export {
  AlgorithmOptimizer,
  MemoizationCache,
  BatchProcessor,
  algorithmOptimizer,
  type AlgorithmProfile,
  type OptimizationHint,
  type ComputationTask,
  type OptimizedAlgorithm
} from './AlgorithmOptimizer';

// Concurrency optimization
export {
  ConcurrencyOptimizer,
  TaskQueue,
  WorkerPool,
  concurrencyOptimizer,
  type AsyncTask,
  type TaskPriority,
  type WorkerPoolConfig,
  type ConcurrencyMetrics,
  type ParallelJobConfig
} from './ConcurrencyOptimizer';

// Cache optimization
export {
  CacheOptimizer,
  MultiLevelCache,
  DataOptimizer,
  cacheOptimizer,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
  type DataOptimizationConfig,
  type IndexConfig
} from './CacheOptimizer';

// Performance integration
export {
  PerformanceIntegration,
  performanceIntegration,
  type PerformanceConfig,
  type PerformanceHealth,
  type OptimizationAction
} from './PerformanceIntegration';

/**
 * Quick setup function for performance optimization
 * 
 * @param config Optional configuration for performance optimization
 * @returns Promise that resolves when performance optimization is initialized
 */
export async function initializePerformanceOptimization(config?: Partial<import('./PerformanceIntegration').PerformanceConfig>): Promise<void> {
  const { performanceIntegration } = await import('./PerformanceIntegration');
  return performanceIntegration.initialize();
}

/**
 * Performance optimization utilities
 */
export const PerformanceUtils = {
  /**
   * Create a performance-optimized function with memoization
   */
  memoize: <T extends (...args: any[]) => any>(fn: T, maxSize: number = 100): T => {
    const { algorithmOptimizer } = require('./AlgorithmOptimizer');
    return algorithmOptimizer.createMemoizedFunction(fn.name || 'anonymous', fn, maxSize);
  },

  /**
   * Monitor a function's performance
   */
  monitor: <T extends (...args: any[]) => any>(fn: T, name?: string): T => {
    const { performanceMonitor } = require('./PerformanceMonitor');
    const functionName = name || fn.name || 'anonymous';
    
    return ((...args: any[]) => {
      performanceMonitor.startTimer(functionName);
      try {
        const result = fn(...args);
        if (result && typeof result.then === 'function') {
          // Handle async functions
          return result.finally(() => {
            performanceMonitor.endTimer(functionName);
          });
        } else {
          performanceMonitor.endTimer(functionName);
          return result;
        }
      } catch (error) {
        performanceMonitor.endTimer(functionName);
        throw error;
      }
    }) as T;
  },

  /**
   * Create an object pool for frequently created objects
   */
  createObjectPool: <T>(config: import('./MemoryOptimizer').MemoryPoolConfig) => {
    const { memoryOptimizer } = require('./MemoryOptimizer');
    return memoryOptimizer.createPool<T>(config);
  },

  /**
   * Cache a function's results with TTL
   */
  cache: <T extends (...args: any[]) => any>(fn: T, ttl: number = 300000): T => {
    const { algorithmOptimizer } = require('./AlgorithmOptimizer');
    return algorithmOptimizer.createCachedFunction(fn.name || 'anonymous', fn);
  },

  /**
   * Execute operations in parallel with concurrency limit
   */
  parallel: async <T, R>(
    items: T[],
    processor: (item: T) => Promise<R> | R,
    concurrency: number = 4
  ): Promise<R[]> => {
    const { concurrencyOptimizer } = require('./ConcurrencyOptimizer');
    return concurrencyOptimizer.processParallelJob({
      name: 'parallel_operation',
      chunks: items,
      processor,
      concurrency,
      preserveOrder: true,
    });
  },

  /**
   * Debounce an async operation
   */
  debounce: async <T>(
    operation: () => Promise<T>,
    delay: number,
    key: string = 'default'
  ): Promise<T> => {
    const { concurrencyOptimizer } = require('./ConcurrencyOptimizer');
    return concurrencyOptimizer.debounceAsync(operation, delay, key);
  },

  /**
   * Throttle an async operation
   */
  throttle: async <T>(
    operation: () => Promise<T>,
    interval: number,
    key: string = 'default'
  ): Promise<T | null> => {
    const { concurrencyOptimizer } = require('./ConcurrencyOptimizer');
    return concurrencyOptimizer.throttleAsync(operation, interval, key);
  },

  /**
   * Get current performance health status
   */
  getHealth: (): import('./PerformanceIntegration').PerformanceHealth => {
    const { performanceIntegration } = require('./PerformanceIntegration');
    return performanceIntegration.getPerformanceHealth();
  },

  /**
   * Generate a comprehensive performance report
   */
  generateReport: () => {
    const { performanceIntegration } = require('./PerformanceIntegration');
    return performanceIntegration.generateComprehensiveReport();
  },

  /**
   * Trigger manual optimization
   */
  optimize: async (level: 'light' | 'moderate' | 'aggressive' = 'moderate'): Promise<void> => {
    const { performanceIntegration } = require('./PerformanceIntegration');
    return performanceIntegration.triggerOptimization(level);
  },
};

/**
 * Performance optimization decorators for classes and methods
 */
export const PerformanceDecorators = {
  /**
   * Monitor method performance
   */
  monitor: (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = PerformanceUtils.monitor(originalMethod, `${target.constructor.name}.${propertyKey}`);
    return descriptor;
  },

  /**
   * Memoize method results
   */
  memoize: (maxSize: number = 100) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = PerformanceUtils.memoize(originalMethod, maxSize);
      return descriptor;
    };
  },

  /**
   * Cache method results with TTL
   */
  cache: (ttl: number = 300000) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = PerformanceUtils.cache(originalMethod, ttl);
      return descriptor;
    };
  },
};

/**
 * Performance optimization constants
 */
export const PerformanceConstants = {
  DEFAULT_CACHE_TTL: 300000, // 5 minutes
  DEFAULT_MEMORY_THRESHOLD: 0.8, // 80% memory usage
  DEFAULT_WORKER_COUNT: 4,
  DEFAULT_BATCH_SIZE: 100,
  HEALTH_CHECK_INTERVAL: 5000, // 5 seconds
  OPTIMIZATION_COOLDOWN: 30000, // 30 seconds
  METRICS_RETENTION: 3600000, // 1 hour
} as const;

/**
 * Performance optimization presets for different scenarios
 */
export const PerformancePresets = {
  /**
   * Development environment preset - prioritizes debugging over performance
   */
  development: {
    monitoring: {
      enabled: true,
      interval: 10000,
      metricsRetention: 1800000, // 30 minutes
    },
    memory: {
      optimizationEnabled: false,
      gcThreshold: 0.9,
      poolingEnabled: false,
    },
    algorithms: {
      optimizationEnabled: false,
      memoizationEnabled: false,
      batchingEnabled: false,
    },
    concurrency: {
      enabled: false,
      maxWorkers: 2,
      taskTimeout: 60000,
    },
    caching: {
      enabled: true,
      defaultTTL: 60000, // 1 minute
      maxCacheSize: 100,
    },
  },

  /**
   * Production environment preset - maximum performance optimization
   */
  production: {
    monitoring: {
      enabled: true,
      interval: 5000,
      metricsRetention: 7200000, // 2 hours
    },
    memory: {
      optimizationEnabled: true,
      gcThreshold: 0.8,
      poolingEnabled: true,
    },
    algorithms: {
      optimizationEnabled: true,
      memoizationEnabled: true,
      batchingEnabled: true,
    },
    concurrency: {
      enabled: true,
      maxWorkers: 8,
      taskTimeout: 30000,
    },
    caching: {
      enabled: true,
      defaultTTL: 600000, // 10 minutes
      maxCacheSize: 2000,
    },
  },

  /**
   * Low-resource environment preset - minimal resource usage
   */
  lowResource: {
    monitoring: {
      enabled: true,
      interval: 15000,
      metricsRetention: 900000, // 15 minutes
    },
    memory: {
      optimizationEnabled: true,
      gcThreshold: 0.7,
      poolingEnabled: true,
    },
    algorithms: {
      optimizationEnabled: true,
      memoizationEnabled: true,
      batchingEnabled: false,
    },
    concurrency: {
      enabled: false,
      maxWorkers: 1,
      taskTimeout: 15000,
    },
    caching: {
      enabled: true,
      defaultTTL: 120000, // 2 minutes
      maxCacheSize: 200,
    },
  },
} as const;