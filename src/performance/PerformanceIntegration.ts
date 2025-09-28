import { EventEmitter } from '../utils/EventEmitter';
import { performanceMonitor } from './PerformanceMonitor';
import { gamePerformanceTracker } from './GamePerformanceTracker';
import { memoryOptimizer } from './MemoryOptimizer';
import { algorithmOptimizer } from './AlgorithmOptimizer';
import { concurrencyOptimizer } from './ConcurrencyOptimizer';
import { cacheOptimizer } from './CacheOptimizer';

export interface PerformanceConfig {
  monitoring: {
    enabled: boolean;
    interval: number;
    metricsRetention: number;
  };
  memory: {
    optimizationEnabled: boolean;
    gcThreshold: number;
    poolingEnabled: boolean;
  };
  algorithms: {
    optimizationEnabled: boolean;
    memoizationEnabled: boolean;
    batchingEnabled: boolean;
  };
  concurrency: {
    enabled: boolean;
    maxWorkers: number;
    taskTimeout: number;
  };
  caching: {
    enabled: boolean;
    defaultTTL: number;
    maxCacheSize: number;
  };
  thresholds: {
    warningMemoryUsage: number;
    criticalMemoryUsage: number;
    warningFrameRate: number;
    criticalFrameRate: number;
    warningLatency: number;
    criticalLatency: number;
  };
}

export interface PerformanceHealth {
  overall: 'excellent' | 'good' | 'warning' | 'critical';
  memory: 'good' | 'warning' | 'critical';
  processing: 'good' | 'warning' | 'critical';
  caching: 'good' | 'warning' | 'critical';
  concurrency: 'good' | 'warning' | 'critical';
  score: number; // 0-100
  recommendations: string[];
}

export interface OptimizationAction {
  id: string;
  type: 'memory' | 'algorithm' | 'cache' | 'concurrency' | 'monitoring';
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  description: string;
  estimatedImpact: number;
  executeAt?: number;
}

export class PerformanceIntegration extends EventEmitter {
  private config: PerformanceConfig;
  private isInitialized: boolean = false;
  private optimizationQueue: OptimizationAction[] = [];
  private performanceHealth: PerformanceHealth;
  private lastHealthCheck: number = 0;
  private optimizationHistory: Map<string, number> = new Map();
  private autoOptimizationEnabled: boolean = true;

  constructor(config?: Partial<PerformanceConfig>) {
    super();
    
    this.config = {
      monitoring: {
        enabled: true,
        interval: 5000,
        metricsRetention: 3600000, // 1 hour
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
        maxWorkers: 4,
        taskTimeout: 30000,
      },
      caching: {
        enabled: true,
        defaultTTL: 300000,
        maxCacheSize: 1000,
      },
      thresholds: {
        warningMemoryUsage: 70,
        criticalMemoryUsage: 85,
        warningFrameRate: 30,
        criticalFrameRate: 20,
        warningLatency: 100,
        criticalLatency: 200,
      },
      ...config,
    };

    this.performanceHealth = {
      overall: 'good',
      memory: 'good',
      processing: 'good',
      caching: 'good',
      concurrency: 'good',
      score: 85,
      recommendations: [],
    };

    this.setupEventListeners();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize monitoring
      if (this.config.monitoring.enabled) {
        performanceMonitor.startMonitoring('main');
        gamePerformanceTracker.startGameSession('default', 'system', {});
      }

      // Initialize memory optimization
      if (this.config.memory.optimizationEnabled) {
        memoryOptimizer.startMonitoring(this.config.monitoring.interval);
      }

      // Initialize algorithm optimization
      if (this.config.algorithms.optimizationEnabled) {
        algorithmOptimizer.optimizeGameSpecificAlgorithms();
      }

      // Initialize concurrency optimization
      if (this.config.concurrency.enabled) {
        concurrencyOptimizer.startMetricsCollection();
      }

      // Initialize caching
      if (this.config.caching.enabled) {
        // Caches are already initialized in cacheOptimizer constructor
      }

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      this.emit('performance:initialized');

    } catch (error) {
      this.emit('performance:initializationError', { error });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Stop monitoring
      performanceMonitor.stopMonitoring();
      memoryOptimizer.stopMonitoring();
      concurrencyOptimizer.stopMetricsCollection();

      // Execute final optimization
      await this.performFinalOptimization();

      // Cleanup resources
      await concurrencyOptimizer.destroy();
      cacheOptimizer.destroy();
      algorithmOptimizer.destroy();

      this.isInitialized = false;
      this.emit('performance:shutdown');

    } catch (error) {
      this.emit('performance:shutdownError', { error });
      throw error;
    }
  }

  public getPerformanceHealth(): PerformanceHealth {
    return { ...this.performanceHealth };
  }

  public generateComprehensiveReport(): any {
    const timestamp = Date.now();
    
    return {
      timestamp,
      health: this.getPerformanceHealth(),
      monitoring: {
        profile: performanceMonitor.getCurrentProfile(),
        gameTracking: gamePerformanceTracker.getPerformanceReport('default'),
      },
      memory: {
        stats: memoryOptimizer.getMemoryUsageStats(),
        report: memoryOptimizer.generateMemoryReport(),
      },
      algorithms: {
        report: algorithmOptimizer.generateOptimizationReport(),
        hints: algorithmOptimizer.getOptimizationHints(),
      },
      concurrency: {
        report: concurrencyOptimizer.getConcurrencyReport(),
      },
      caching: {
        report: cacheOptimizer.generateGlobalReport(),
      },
      optimization: {
        queueSize: this.optimizationQueue.length,
        history: Object.fromEntries(this.optimizationHistory),
        autoOptimizationEnabled: this.autoOptimizationEnabled,
      },
      recommendations: this.generateIntegratedRecommendations(),
    };
  }

  public async triggerOptimization(level: 'light' | 'moderate' | 'aggressive' = 'moderate'): Promise<void> {
    const startTime = Date.now();
    this.emit('optimization:started', { level });

    try {
      switch (level) {
        case 'light':
          await this.performLightOptimization();
          break;
        case 'moderate':
          await this.performModerateOptimization();
          break;
        case 'aggressive':
          await this.performAggressiveOptimization();
          break;
      }

      const duration = Date.now() - startTime;
      this.optimizationHistory.set(`${level}_${Date.now()}`, duration);
      this.emit('optimization:completed', { level, duration });

    } catch (error) {
      this.emit('optimization:error', { level, error });
      throw error;
    }
  }

  public addOptimizationAction(action: OptimizationAction): void {
    this.optimizationQueue.push(action);
    this.optimizationQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.emit('optimization:actionAdded', { action });

    // Execute immediately if critical and automated
    if (action.priority === 'critical' && action.automated) {
      this.executeOptimizationAction(action);
    }
  }

  public setAutoOptimization(enabled: boolean): void {
    this.autoOptimizationEnabled = enabled;
    this.emit('autoOptimization:toggled', { enabled });
  }

  public warmupCaches(gameData: any): Promise<void> {
    if (!this.config.caching.enabled) {
      return Promise.resolve();
    }

    const warmupPromises: Promise<void>[] = [];

    // Warmup game state cache
    if (gameData.gameStates) {
      const gameStateLoader = async (key: string) => gameData.gameStates[key];
      warmupPromises.push(
        cacheOptimizer.warmupCache('gameState', Object.keys(gameData.gameStates), gameStateLoader)
      );
    }

    // Warmup AI decisions cache
    if (gameData.aiDecisions) {
      const aiDecisionLoader = async (key: string) => gameData.aiDecisions[key];
      warmupPromises.push(
        cacheOptimizer.warmupCache('aiDecisions', Object.keys(gameData.aiDecisions), aiDecisionLoader)
      );
    }

    // Warmup property evaluations cache
    if (gameData.propertyEvaluations) {
      const propertyLoader = async (key: string) => gameData.propertyEvaluations[key];
      warmupPromises.push(
        cacheOptimizer.warmupCache('propertyEvaluations', Object.keys(gameData.propertyEvaluations), propertyLoader)
      );
    }

    return Promise.all(warmupPromises).then(() => {
      this.emit('caches:warmedUp', { cacheCount: warmupPromises.length });
    });
  }

  public optimizeForGamePhase(phase: 'setup' | 'early' | 'mid' | 'late' | 'endgame'): void {
    switch (phase) {
      case 'setup':
        this.optimizeForSetup();
        break;
      case 'early':
        this.optimizeForEarlyGame();
        break;
      case 'mid':
        this.optimizeForMidGame();
        break;
      case 'late':
        this.optimizeForLateGame();
        break;
      case 'endgame':
        this.optimizeForEndGame();
        break;
    }

    this.emit('optimization:gamePhase', { phase });
  }

  private setupEventListeners(): void {
    // Performance monitor events
    performanceMonitor.on('alert:created', (alert) => {
      this.handlePerformanceAlert(alert);
    });

    // Memory optimizer events
    memoryOptimizer.on('optimization:triggered', (event) => {
      this.emit('memory:optimizationTriggered', event);
    });

    // Algorithm optimizer events
    algorithmOptimizer.on('algorithm:optimized', (event) => {
      this.emit('algorithm:optimized', event);
    });

    // Concurrency optimizer events
    concurrencyOptimizer.on('metrics:collected', (metrics) => {
      this.updateConcurrencyHealth(metrics);
    });

    // Cache optimizer events
    cacheOptimizer.on('cache:created', (event) => {
      this.emit('cache:created', event);
    });
  }

  private startHealthMonitoring(): void {
    const checkHealth = () => {
      this.performHealthCheck();
      
      if (this.isInitialized) {
        setTimeout(checkHealth, this.config.monitoring.interval);
      }
    };

    checkHealth();
  }

  private performHealthCheck(): void {
    const now = Date.now();
    
    // Skip if checked recently
    if (now - this.lastHealthCheck < this.config.monitoring.interval / 2) {
      return;
    }

    this.lastHealthCheck = now;

    // Check memory health
    const memoryStats = memoryOptimizer.getMemoryUsageStats();
    this.updateMemoryHealth(memoryStats);

    // Check processing health
    const performanceMetrics = performanceMonitor.getCurrentProfile();
    this.updateProcessingHealth(performanceMetrics);

    // Check caching health
    const cacheReport = cacheOptimizer.generateGlobalReport();
    this.updateCachingHealth(cacheReport);

    // Calculate overall health
    this.calculateOverallHealth();

    // Trigger auto-optimization if needed
    if (this.autoOptimizationEnabled) {
      this.triggerAutoOptimization();
    }

    this.emit('health:checked', { health: this.performanceHealth });
  }

  private updateMemoryHealth(memoryStats: any): void {
    const memoryUsagePercent = (memoryStats.usedHeapSize / memoryStats.totalHeapSize) * 100;
    
    if (memoryUsagePercent > this.config.thresholds.criticalMemoryUsage) {
      this.performanceHealth.memory = 'critical';
    } else if (memoryUsagePercent > this.config.thresholds.warningMemoryUsage) {
      this.performanceHealth.memory = 'warning';
    } else {
      this.performanceHealth.memory = 'good';
    }
  }

  private updateProcessingHealth(performanceMetrics: any): void {
    if (!performanceMetrics || !performanceMetrics.summary) {
      return;
    }

    const avgFrameRate = performanceMetrics.summary.avgFrameRate || 60;
    
    if (avgFrameRate < this.config.thresholds.criticalFrameRate) {
      this.performanceHealth.processing = 'critical';
    } else if (avgFrameRate < this.config.thresholds.warningFrameRate) {
      this.performanceHealth.processing = 'warning';
    } else {
      this.performanceHealth.processing = 'good';
    }
  }

  private updateCachingHealth(cacheReport: any): void {
    const globalHitRate = cacheReport.globalStats?.globalHitRate || 0;
    
    if (globalHitRate < 50) {
      this.performanceHealth.caching = 'critical';
    } else if (globalHitRate < 70) {
      this.performanceHealth.caching = 'warning';
    } else {
      this.performanceHealth.caching = 'good';
    }
  }

  private updateConcurrencyHealth(metrics: any): void {
    const workerUtilization = metrics.workerUtilization || 0;
    
    if (workerUtilization > 0.95) {
      this.performanceHealth.concurrency = 'critical';
    } else if (workerUtilization > 0.85) {
      this.performanceHealth.concurrency = 'warning';
    } else {
      this.performanceHealth.concurrency = 'good';
    }
  }

  private calculateOverallHealth(): void {
    const healthScores = {
      good: 100,
      warning: 60,
      critical: 20,
    };

    const components = [
      this.performanceHealth.memory,
      this.performanceHealth.processing,
      this.performanceHealth.caching,
      this.performanceHealth.concurrency,
    ];

    const totalScore = components.reduce((sum, health) => sum + healthScores[health], 0);
    this.performanceHealth.score = Math.round(totalScore / components.length);

    // Determine overall health
    if (this.performanceHealth.score >= 90) {
      this.performanceHealth.overall = 'excellent';
    } else if (this.performanceHealth.score >= 70) {
      this.performanceHealth.overall = 'good';
    } else if (this.performanceHealth.score >= 40) {
      this.performanceHealth.overall = 'warning';
    } else {
      this.performanceHealth.overall = 'critical';
    }

    // Generate recommendations
    this.performanceHealth.recommendations = this.generateHealthRecommendations();
  }

  private generateHealthRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.performanceHealth.memory === 'critical') {
      recommendations.push('Critical memory usage - immediate optimization required');
    } else if (this.performanceHealth.memory === 'warning') {
      recommendations.push('High memory usage - consider memory optimization');
    }

    if (this.performanceHealth.processing === 'critical') {
      recommendations.push('Critical performance issues - optimize algorithms and rendering');
    } else if (this.performanceHealth.processing === 'warning') {
      recommendations.push('Performance degradation detected - review optimization opportunities');
    }

    if (this.performanceHealth.caching === 'critical') {
      recommendations.push('Poor cache performance - review cache strategies and sizes');
    }

    if (this.performanceHealth.concurrency === 'critical') {
      recommendations.push('Worker thread bottleneck - consider scaling or load balancing');
    }

    return recommendations;
  }

  private triggerAutoOptimization(): void {
    if (this.performanceHealth.overall === 'critical') {
      this.triggerOptimization('aggressive');
    } else if (this.performanceHealth.overall === 'warning') {
      this.triggerOptimization('moderate');
    }
  }

  private handlePerformanceAlert(alert: any): void {
    // Create optimization action based on alert
    const action: OptimizationAction = {
      id: `alert_${alert.id}`,
      type: this.getOptimizationTypeFromAlert(alert),
      action: `Optimize ${alert.metric}`,
      priority: alert.level === 'critical' ? 'critical' : 'high',
      automated: true,
      description: `Auto-generated optimization for ${alert.message}`,
      estimatedImpact: 30,
    };

    this.addOptimizationAction(action);
  }

  private getOptimizationTypeFromAlert(alert: any): OptimizationAction['type'] {
    if (alert.metric.includes('memory')) return 'memory';
    if (alert.metric.includes('ai') || alert.metric.includes('algorithm')) return 'algorithm';
    if (alert.metric.includes('cache')) return 'cache';
    if (alert.metric.includes('worker') || alert.metric.includes('concurrency')) return 'concurrency';
    return 'monitoring';
  }

  private async executeOptimizationAction(action: OptimizationAction): Promise<void> {
    try {
      switch (action.type) {
        case 'memory':
          await memoryOptimizer.optimizeMemoryUsage();
          break;
        case 'algorithm':
          algorithmOptimizer.optimizeGameSpecificAlgorithms();
          break;
        case 'cache':
          cacheOptimizer.optimizeAllCaches();
          break;
        case 'concurrency':
          // Concurrency optimization would be implemented here
          break;
        case 'monitoring':
          // Monitoring optimization would be implemented here
          break;
      }

      // Remove from queue
      const index = this.optimizationQueue.findIndex(a => a.id === action.id);
      if (index !== -1) {
        this.optimizationQueue.splice(index, 1);
      }

      this.emit('optimization:actionCompleted', { action });

    } catch (error) {
      this.emit('optimization:actionFailed', { action, error });
    }
  }

  private async performLightOptimization(): Promise<void> {
    // Light optimization - cache cleanup and minor adjustments
    cacheOptimizer.optimizeAllCaches();
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async performModerateOptimization(): Promise<void> {
    // Moderate optimization - memory cleanup and algorithm optimization
    await memoryOptimizer.optimizeMemoryUsage();
    cacheOptimizer.optimizeAllCaches();
    algorithmOptimizer.optimizeGameSpecificAlgorithms();
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async performAggressiveOptimization(): Promise<void> {
    // Aggressive optimization - full system optimization
    await memoryOptimizer.optimizeMemoryUsage();
    memoryOptimizer.forceGarbageCollection();
    cacheOptimizer.optimizeAllCaches();
    algorithmOptimizer.optimizeGameSpecificAlgorithms();
    concurrencyOptimizer.optimizeAsyncOperations();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async performFinalOptimization(): Promise<void> {
    // Final cleanup before shutdown
    await this.performAggressiveOptimization();
    cacheOptimizer.destroy();
    memoryOptimizer.forceGarbageCollection();
  }

  private optimizeForSetup(): void {
    // Optimize for game setup phase
    cacheOptimizer.preloadCache('gameState', new Map());
    memoryOptimizer.optimizeMemoryUsage();
  }

  private optimizeForEarlyGame(): void {
    // Optimize for early game phase
    // Focus on AI decision caching
  }

  private optimizeForMidGame(): void {
    // Optimize for mid game phase
    // Balance between memory and performance
  }

  private optimizeForLateGame(): void {
    // Optimize for late game phase
    // Focus on algorithm efficiency
  }

  private optimizeForEndGame(): void {
    // Optimize for end game phase
    // Prepare for cleanup
  }

  private generateIntegratedRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Combine recommendations from all systems
    const memoryReport = memoryOptimizer.generateMemoryReport();
    const algorithmReport = algorithmOptimizer.generateOptimizationReport();
    const cacheReport = cacheOptimizer.generateGlobalReport();
    const concurrencyReport = concurrencyOptimizer.getConcurrencyReport();

    recommendations.push(...(memoryReport.recommendations || []));
    recommendations.push(...(algorithmReport.recommendations || []));
    recommendations.push(...(cacheReport.recommendations || []));
    recommendations.push(...(concurrencyReport.recommendations || []));

    // Add integration-specific recommendations
    if (this.performanceHealth.overall === 'warning') {
      recommendations.push('Consider running moderate optimization to improve overall performance');
    }

    if (this.optimizationQueue.length > 10) {
      recommendations.push('High number of pending optimizations - consider enabling auto-optimization');
    }

    return Array.from(new Set(recommendations)); // Remove duplicates
  }
}

export const performanceIntegration = new PerformanceIntegration();