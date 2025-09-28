import { EventEmitter } from '../utils/EventEmitter';

export interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  gameMetrics: {
    frameRate: number;
    renderTime: number;
    gameLoopTime: number;
    aiDecisionTime: number;
    networkLatency: number;
  };
  systemLoad: {
    eventLoopLag: number;
    asyncOperations: number;
    activeConnections: number;
  };
}

export interface PerformanceAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

export interface PerformanceThresholds {
  memory: {
    heapUsagePercent: number;
    heapSizeLimit: number;
  };
  cpu: {
    maxUsagePercent: number;
    sustainedUsageTime: number;
  };
  game: {
    minFrameRate: number;
    maxRenderTime: number;
    maxGameLoopTime: number;
    maxAiDecisionTime: number;
    maxNetworkLatency: number;
  };
  system: {
    maxEventLoopLag: number;
    maxAsyncOperations: number;
  };
}

export interface PerformanceProfile {
  sessionId: string;
  startTime: number;
  endTime?: number;
  metrics: PerformanceMetrics[];
  alerts: PerformanceAlert[];
  optimizations: string[];
  summary: {
    avgFrameRate: number;
    avgMemoryUsage: number;
    avgCpuUsage: number;
    totalAlerts: number;
    criticalAlerts: number;
  };
}

export class PerformanceMonitor extends EventEmitter {
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsHistory: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private currentProfile: PerformanceProfile | null = null;
  private lastCpuUsage: NodeJS.CpuUsage | null = null;
  
  private readonly thresholds: PerformanceThresholds = {
    memory: {
      heapUsagePercent: 85,
      heapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
    },
    cpu: {
      maxUsagePercent: 80,
      sustainedUsageTime: 5000, // 5 seconds
    },
    game: {
      minFrameRate: 30,
      maxRenderTime: 33, // ~30fps
      maxGameLoopTime: 16, // ~60fps
      maxAiDecisionTime: 1000, // 1 second
      maxNetworkLatency: 100, // 100ms
    },
    system: {
      maxEventLoopLag: 10, // 10ms
      maxAsyncOperations: 100,
    }
  };

  private performanceTimers: Map<string, number> = new Map();
  private frameStartTime: number = 0;
  private gameLoopStartTime: number = 0;

  constructor() {
    super();
    this.setupProcessListeners();
  }

  public startMonitoring(sessionId: string): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.isMonitoring = true;
    this.currentProfile = {
      sessionId,
      startTime: Date.now(),
      metrics: [],
      alerts: [],
      optimizations: [],
      summary: {
        avgFrameRate: 0,
        avgMemoryUsage: 0,
        avgCpuUsage: 0,
        totalAlerts: 0,
        criticalAlerts: 0,
      }
    };

    this.metricsHistory = [];
    this.alerts = [];
    this.lastCpuUsage = process.cpuUsage();

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 1000); // Collect metrics every second

    this.emit('monitoring:started', { sessionId });
  }

  public stopMonitoring(): PerformanceProfile | null {
    if (!this.isMonitoring || !this.currentProfile) {
      return null;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.currentProfile.endTime = Date.now();
    this.currentProfile.metrics = [...this.metricsHistory];
    this.currentProfile.alerts = [...this.alerts];
    this.currentProfile.summary = this.calculateSummary();

    const profile = this.currentProfile;
    this.currentProfile = null;

    this.emit('monitoring:stopped', { profile });
    return profile;
  }

  public startFrame(): void {
    this.frameStartTime = performance.now();
  }

  public endFrame(): void {
    if (this.frameStartTime > 0) {
      const frameTime = performance.now() - this.frameStartTime;
      const frameRate = 1000 / frameTime;
      
      this.emit('frame:completed', { frameTime, frameRate });
      this.frameStartTime = 0;
    }
  }

  public startGameLoop(): void {
    this.gameLoopStartTime = performance.now();
  }

  public endGameLoop(): void {
    if (this.gameLoopStartTime > 0) {
      const gameLoopTime = performance.now() - this.gameLoopStartTime;
      this.emit('gameLoop:completed', { gameLoopTime });
      this.gameLoopStartTime = 0;
    }
  }

  public startTimer(name: string): void {
    this.performanceTimers.set(name, performance.now());
  }

  public endTimer(name: string): number {
    const startTime = this.performanceTimers.get(name);
    if (startTime === undefined) {
      return 0;
    }

    const duration = performance.now() - startTime;
    this.performanceTimers.delete(name);
    
    this.emit('timer:completed', { name, duration });
    return duration;
  }

  public recordCustomMetric(name: string, value: number, unit?: string): void {
    this.emit('metric:custom', { name, value, unit, timestamp: Date.now() });
  }

  public getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getCurrentProfile(): PerformanceProfile | null {
    return this.currentProfile;
  }

  private collectMetrics(): void {
    if (!this.isMonitoring) return;

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.lastCpuUsage || undefined);
    this.lastCpuUsage = process.cpuUsage();

    const eventLoopLag = this.measureEventLoopLag();

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      cpuUsage: {
        user: cpuUsage.user / 1000, // Convert to milliseconds
        system: cpuUsage.system / 1000,
      },
      gameMetrics: {
        frameRate: this.getAverageFrameRate(),
        renderTime: this.getAverageRenderTime(),
        gameLoopTime: this.getAverageGameLoopTime(),
        aiDecisionTime: this.getAverageAiDecisionTime(),
        networkLatency: this.getNetworkLatency(),
      },
      systemLoad: {
        eventLoopLag,
        asyncOperations: this.getActiveAsyncOperations(),
        activeConnections: this.getActiveConnections(),
      },
    };

    this.metricsHistory.push(metrics);
    this.checkThresholds(metrics);
    this.emit('metrics:collected', metrics);

    // Keep only last 1000 metrics to prevent memory overflow
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    // Memory checks
    const heapUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (heapUsagePercent > this.thresholds.memory.heapUsagePercent) {
      this.createAlert('critical', 'memory.heapUsage', heapUsagePercent, this.thresholds.memory.heapUsagePercent,
        `Heap usage is ${heapUsagePercent.toFixed(1)}%, exceeding threshold of ${this.thresholds.memory.heapUsagePercent}%`);
    }

    // Game performance checks
    if (metrics.gameMetrics.frameRate < this.thresholds.game.minFrameRate) {
      this.createAlert('warning', 'game.frameRate', metrics.gameMetrics.frameRate, this.thresholds.game.minFrameRate,
        `Frame rate dropped to ${metrics.gameMetrics.frameRate.toFixed(1)} fps`);
    }

    if (metrics.gameMetrics.renderTime > this.thresholds.game.maxRenderTime) {
      this.createAlert('warning', 'game.renderTime', metrics.gameMetrics.renderTime, this.thresholds.game.maxRenderTime,
        `Render time exceeded ${metrics.gameMetrics.renderTime.toFixed(1)}ms`);
    }

    if (metrics.gameMetrics.aiDecisionTime > this.thresholds.game.maxAiDecisionTime) {
      this.createAlert('warning', 'game.aiDecisionTime', metrics.gameMetrics.aiDecisionTime, this.thresholds.game.maxAiDecisionTime,
        `AI decision time exceeded ${metrics.gameMetrics.aiDecisionTime.toFixed(1)}ms`);
    }

    // System checks
    if (metrics.systemLoad.eventLoopLag > this.thresholds.system.maxEventLoopLag) {
      this.createAlert('critical', 'system.eventLoopLag', metrics.systemLoad.eventLoopLag, this.thresholds.system.maxEventLoopLag,
        `Event loop lag detected: ${metrics.systemLoad.eventLoopLag.toFixed(1)}ms`);
    }
  }

  private createAlert(level: 'info' | 'warning' | 'critical', metric: string, value: number, threshold: number, message: string): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
      message,
    };

    this.alerts.push(alert);
    this.emit('alert:created', alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  private measureEventLoopLag(): number {
    const start = process.hrtime.bigint();
    return new Promise<number>((resolve) => {
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
        resolve(lag);
      });
    }).then(lag => lag).catch(() => 0) as any; // Simplified for synchronous usage
  }

  private getAverageFrameRate(): number {
    // Implementation would track frame rates over time
    return 60; // Placeholder
  }

  private getAverageRenderTime(): number {
    // Implementation would track render times
    return 16; // Placeholder
  }

  private getAverageGameLoopTime(): number {
    // Implementation would track game loop times
    return 8; // Placeholder
  }

  private getAverageAiDecisionTime(): number {
    // Implementation would track AI decision times
    return 50; // Placeholder
  }

  private getNetworkLatency(): number {
    // Implementation would measure network latency
    return 30; // Placeholder
  }

  private getActiveAsyncOperations(): number {
    // Implementation would count active async operations
    return 5; // Placeholder
  }

  private getActiveConnections(): number {
    // Implementation would count active network connections
    return 2; // Placeholder
  }

  private calculateSummary(): PerformanceProfile['summary'] {
    if (this.metricsHistory.length === 0) {
      return {
        avgFrameRate: 0,
        avgMemoryUsage: 0,
        avgCpuUsage: 0,
        totalAlerts: 0,
        criticalAlerts: 0,
      };
    }

    const avgFrameRate = this.metricsHistory.reduce((sum, m) => sum + m.gameMetrics.frameRate, 0) / this.metricsHistory.length;
    const avgMemoryUsage = this.metricsHistory.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / this.metricsHistory.length;
    const avgCpuUsage = this.metricsHistory.reduce((sum, m) => sum + m.cpuUsage.user + m.cpuUsage.system, 0) / this.metricsHistory.length;
    const criticalAlerts = this.alerts.filter(a => a.level === 'critical').length;

    return {
      avgFrameRate: Math.round(avgFrameRate * 100) / 100,
      avgMemoryUsage: Math.round(avgMemoryUsage / 1024 / 1024 * 100) / 100, // MB
      avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
      totalAlerts: this.alerts.length,
      criticalAlerts,
    };
  }

  private setupProcessListeners(): void {
    process.on('warning', (warning) => {
      this.createAlert('warning', 'process.warning', 0, 0, `Process warning: ${warning.message}`);
    });

    process.on('uncaughtException', (error) => {
      this.createAlert('critical', 'process.uncaughtException', 0, 0, `Uncaught exception: ${error.message}`);
    });

    process.on('unhandledRejection', (reason) => {
      this.createAlert('critical', 'process.unhandledRejection', 0, 0, `Unhandled rejection: ${reason}`);
    });
  }

  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metricsHistory.length === 0) return recommendations;

    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    
    // Memory optimization recommendations
    const heapUsagePercent = (latestMetrics.memoryUsage.heapUsed / latestMetrics.memoryUsage.heapTotal) * 100;
    if (heapUsagePercent > 70) {
      recommendations.push('Consider implementing memory pooling for frequently allocated objects');
      recommendations.push('Review and optimize object lifecycle management');
      recommendations.push('Implement garbage collection optimization strategies');
    }

    // Performance optimization recommendations
    if (latestMetrics.gameMetrics.frameRate < 45) {
      recommendations.push('Optimize rendering pipeline and reduce draw calls');
      recommendations.push('Implement level-of-detail (LOD) systems for complex objects');
      recommendations.push('Consider background processing for non-critical operations');
    }

    if (latestMetrics.gameMetrics.aiDecisionTime > 500) {
      recommendations.push('Optimize AI decision algorithms with caching');
      recommendations.push('Implement asynchronous AI processing');
      recommendations.push('Use decision tree pruning for faster AI responses');
    }

    if (latestMetrics.systemLoad.eventLoopLag > 5) {
      recommendations.push('Move heavy computations to worker threads');
      recommendations.push('Implement proper async/await patterns');
      recommendations.push('Consider request throttling for high-load scenarios');
    }

    return recommendations;
  }
}

export const performanceMonitor = new PerformanceMonitor();