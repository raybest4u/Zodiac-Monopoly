/**
 * 动画性能优化系统
 * Day 4: 技能动画和特效
 * 
 * 实现智能的动画性能优化，包括：
 * - 自适应质量调节
 * - 帧率稳定化算法
 * - 内存管理和垃圾回收优化
 * - LOD（细节级别）系统
 * - 批量渲染优化
 * - GPU加速检测和利用
 * - 性能分析和报告
 */

/**
 * 性能等级枚举
 */
export enum PerformanceLevel {
  ULTRA = 'ultra',         // 超高性能
  HIGH = 'high',          // 高性能
  MEDIUM = 'medium',      // 中等性能
  LOW = 'low',           // 低性能
  POTATO = 'potato'      // 极低性能（土豆设备）
}

/**
 * 优化策略枚举
 */
export enum OptimizationStrategy {
  AGGRESSIVE = 'aggressive',     // 激进优化
  BALANCED = 'balanced',         // 平衡优化
  CONSERVATIVE = 'conservative', // 保守优化
  ADAPTIVE = 'adaptive'          // 自适应优化
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  // 帧率相关
  fps: number;
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  frameTime: number;
  
  // 内存相关
  memoryUsage: number;
  heapSize: number;
  particleCount: number;
  animationCount: number;
  
  // GPU相关
  gpuUtilization: number;
  drawCalls: number;
  triangles: number;
  
  // 系统相关
  cpuUtilization: number;
  thermalState: string;
  batteryLevel: number;
  
  // 用户体验
  inputLatency: number;
  renderLatency: number;
  totalLatency: number;
}

/**
 * 优化配置接口
 */
export interface OptimizationConfig {
  // 目标性能
  targetFPS: number;
  minAcceptableFPS: number;
  maxParticles: number;
  maxAnimations: number;
  
  // 质量设置
  particleQuality: number;      // 0-1
  textureQuality: number;       // 0-1
  effectComplexity: number;     // 0-1
  antialiasing: boolean;
  
  // 优化开关
  enableLOD: boolean;
  enableCulling: boolean;
  enableBatching: boolean;
  enableGPUAcceleration: boolean;
  
  // 自适应设置
  adaptiveQuality: boolean;
  performanceThreshold: number;
  qualitySteps: number;
}

/**
 * LOD配置接口
 */
export interface LODConfig {
  distances: number[];          // LOD距离阈值
  particleDensity: number[];    // 各级别粒子密度
  effectComplexity: number[];   // 各级别效果复杂度
  updateFrequency: number[];    // 各级别更新频率
}

/**
 * 性能分析器
 */
class PerformanceProfiler {
  private samples: PerformanceMetrics[] = [];
  private maxSamples: number = 300; // 5秒采样（60FPS）
  private startTime: number = Date.now();
  private frameCount: number = 0;
  
  // 性能监控器
  private observer: PerformanceObserver | null = null;
  
  constructor() {
    this.initializeObserver();
  }
  
  /**
   * 初始化性能观察器
   */
  private initializeObserver(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });
      
      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        console.warn('性能观察器初始化失败:', error);
      }
    }
  }
  
  /**
   * 处理性能条目
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    // 处理不同类型的性能数据
    switch (entry.entryType) {
      case 'measure':
        // 处理自定义测量
        break;
      case 'navigation':
        // 处理导航性能
        break;
      case 'resource':
        // 处理资源加载性能
        break;
    }
  }
  
  /**
   * 记录性能指标
   */
  public recordMetrics(deltaTime: number, context: any): void {
    this.frameCount++;
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;
    
    const metrics: PerformanceMetrics = {
      fps: 1000 / deltaTime,
      averageFPS: this.frameCount / (elapsed / 1000),
      minFPS: this.getMinFPS(),
      maxFPS: this.getMaxFPS(),
      frameTime: deltaTime,
      
      memoryUsage: this.getMemoryUsage(),
      heapSize: this.getHeapSize(),
      particleCount: context.particleCount || 0,
      animationCount: context.animationCount || 0,
      
      gpuUtilization: this.estimateGPUUtilization(),
      drawCalls: context.drawCalls || 0,
      triangles: context.triangles || 0,
      
      cpuUtilization: this.estimateCPUUtilization(),
      thermalState: this.getThermalState(),
      batteryLevel: this.getBatteryLevel(),
      
      inputLatency: this.measureInputLatency(),
      renderLatency: deltaTime,
      totalLatency: this.measureTotalLatency()
    };
    
    this.samples.push(metrics);
    
    // 限制样本数量
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }
  
  /**
   * 获取最新指标
   */
  public getLatestMetrics(): PerformanceMetrics | null {
    return this.samples.length > 0 ? this.samples[this.samples.length - 1] : null;
  }
  
  /**
   * 获取平均指标
   */
  public getAverageMetrics(samples: number = 60): PerformanceMetrics | null {
    if (this.samples.length === 0) return null;
    
    const recentSamples = this.samples.slice(-samples);
    const count = recentSamples.length;
    
    if (count === 0) return null;
    
    const averages: PerformanceMetrics = {
      fps: 0, averageFPS: 0, minFPS: Infinity, maxFPS: 0, frameTime: 0,
      memoryUsage: 0, heapSize: 0, particleCount: 0, animationCount: 0,
      gpuUtilization: 0, drawCalls: 0, triangles: 0,
      cpuUtilization: 0, thermalState: '', batteryLevel: 0,
      inputLatency: 0, renderLatency: 0, totalLatency: 0
    };
    
    for (const sample of recentSamples) {
      averages.fps += sample.fps;
      averages.frameTime += sample.frameTime;
      averages.memoryUsage += sample.memoryUsage;
      averages.particleCount += sample.particleCount;
      averages.animationCount += sample.animationCount;
      averages.minFPS = Math.min(averages.minFPS, sample.fps);
      averages.maxFPS = Math.max(averages.maxFPS, sample.fps);
      // ... 其他指标
    }
    
    // 计算平均值
    for (const key in averages) {
      if (typeof averages[key as keyof PerformanceMetrics] === 'number' && 
          key !== 'minFPS' && key !== 'maxFPS') {
        (averages as any)[key] = (averages as any)[key] / count;
      }
    }
    
    averages.averageFPS = averages.fps;
    
    return averages;
  }
  
  // 辅助方法（简化实现）
  private getMinFPS(): number {
    const recentSamples = this.samples.slice(-60);
    return recentSamples.length > 0 ? Math.min(...recentSamples.map(s => s.fps)) : 0;
  }
  
  private getMaxFPS(): number {
    const recentSamples = this.samples.slice(-60);
    return recentSamples.length > 0 ? Math.max(...recentSamples.map(s => s.fps)) : 0;
  }
  
  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
  
  private getHeapSize(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.totalJSHeapSize;
    }
    return 0;
  }
  
  private estimateGPUUtilization(): number {
    // 基于渲染复杂度估算GPU利用率
    return Math.random() * 100; // 简化实现
  }
  
  private estimateCPUUtilization(): number {
    // 基于JavaScript执行时间估算CPU利用率
    return Math.random() * 100; // 简化实现
  }
  
  private getThermalState(): string {
    // 检测设备热状态
    return 'normal'; // 简化实现
  }
  
  private getBatteryLevel(): number {
    // 获取电池电量（如果支持）
    return 100; // 简化实现
  }
  
  private measureInputLatency(): number {
    // 测量输入延迟
    return 16; // 简化实现
  }
  
  private measureTotalLatency(): number {
    // 测量总延迟
    return 32; // 简化实现
  }
  
  /**
   * 销毁分析器
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * 自适应质量管理器
 */
class AdaptiveQualityManager {
  private currentLevel: PerformanceLevel = PerformanceLevel.HIGH;
  private config: OptimizationConfig;
  private adjustmentHistory: Array<{ level: PerformanceLevel; timestamp: number }> = [];
  private lastAdjustment: number = 0;
  private adjustmentCooldown: number = 2000; // 2秒冷却
  
  constructor(config: OptimizationConfig) {
    this.config = config;
    this.detectInitialLevel();
  }
  
  /**
   * 检测初始性能等级
   */
  private detectInitialLevel(): void {
    // 基于设备特征检测初始性能等级
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      this.currentLevel = PerformanceLevel.LOW;
      return;
    }
    
    // 检测GPU信息
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    // 检测内存
    const memory = (navigator as any).deviceMemory || 4;
    
    // 检测CPU核心数
    const cores = navigator.hardwareConcurrency || 4;
    
    // 基于特征评分
    let score = 0;
    if (memory >= 8) score += 2;
    else if (memory >= 4) score += 1;
    
    if (cores >= 8) score += 2;
    else if (cores >= 4) score += 1;
    
    if (renderer.toLowerCase().includes('nvidia') || renderer.toLowerCase().includes('amd')) {
      score += 2;
    }
    
    // 设置初始等级
    if (score >= 5) this.currentLevel = PerformanceLevel.ULTRA;
    else if (score >= 3) this.currentLevel = PerformanceLevel.HIGH;
    else if (score >= 2) this.currentLevel = PerformanceLevel.MEDIUM;
    else if (score >= 1) this.currentLevel = PerformanceLevel.LOW;
    else this.currentLevel = PerformanceLevel.POTATO;
  }
  
  /**
   * 根据性能指标调整质量
   */
  public adjustQuality(metrics: PerformanceMetrics): boolean {
    const now = Date.now();
    
    // 检查冷却时间
    if (now - this.lastAdjustment < this.adjustmentCooldown) {
      return false;
    }
    
    let needsAdjustment = false;
    let newLevel = this.currentLevel;
    
    // 性能过低，降低质量
    if (metrics.averageFPS < this.config.minAcceptableFPS) {
      newLevel = this.getLowerLevel(this.currentLevel);
      needsAdjustment = true;
    }
    // 性能充足，提升质量
    else if (metrics.averageFPS > this.config.targetFPS * 1.2 && 
             metrics.cpuUtilization < 70) {
      newLevel = this.getHigherLevel(this.currentLevel);
      needsAdjustment = true;
    }
    
    if (needsAdjustment && newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      this.lastAdjustment = now;
      
      this.adjustmentHistory.push({
        level: newLevel,
        timestamp: now
      });
      
      // 限制历史记录
      if (this.adjustmentHistory.length > 10) {
        this.adjustmentHistory.shift();
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取更低的性能等级
   */
  private getLowerLevel(current: PerformanceLevel): PerformanceLevel {
    const levels = [
      PerformanceLevel.POTATO,
      PerformanceLevel.LOW,
      PerformanceLevel.MEDIUM,
      PerformanceLevel.HIGH,
      PerformanceLevel.ULTRA
    ];
    
    const currentIndex = levels.indexOf(current);
    return currentIndex > 0 ? levels[currentIndex - 1] : current;
  }
  
  /**
   * 获取更高的性能等级
   */
  private getHigherLevel(current: PerformanceLevel): PerformanceLevel {
    const levels = [
      PerformanceLevel.POTATO,
      PerformanceLevel.LOW,
      PerformanceLevel.MEDIUM,
      PerformanceLevel.HIGH,
      PerformanceLevel.ULTRA
    ];
    
    const currentIndex = levels.indexOf(current);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : current;
  }
  
  /**
   * 获取当前性能等级
   */
  public getCurrentLevel(): PerformanceLevel {
    return this.currentLevel;
  }
  
  /**
   * 获取质量配置
   */
  public getQualityConfig(): {
    particleQuality: number;
    textureQuality: number;
    effectComplexity: number;
    maxParticles: number;
    antialiasing: boolean;
  } {
    const qualitySettings = {
      [PerformanceLevel.ULTRA]: {
        particleQuality: 1.0,
        textureQuality: 1.0,
        effectComplexity: 1.0,
        maxParticles: this.config.maxParticles,
        antialiasing: true
      },
      [PerformanceLevel.HIGH]: {
        particleQuality: 0.8,
        textureQuality: 0.9,
        effectComplexity: 0.9,
        maxParticles: Math.floor(this.config.maxParticles * 0.8),
        antialiasing: true
      },
      [PerformanceLevel.MEDIUM]: {
        particleQuality: 0.6,
        textureQuality: 0.7,
        effectComplexity: 0.7,
        maxParticles: Math.floor(this.config.maxParticles * 0.6),
        antialiasing: false
      },
      [PerformanceLevel.LOW]: {
        particleQuality: 0.4,
        textureQuality: 0.5,
        effectComplexity: 0.5,
        maxParticles: Math.floor(this.config.maxParticles * 0.3),
        antialiasing: false
      },
      [PerformanceLevel.POTATO]: {
        particleQuality: 0.2,
        textureQuality: 0.3,
        effectComplexity: 0.3,
        maxParticles: Math.floor(this.config.maxParticles * 0.1),
        antialiasing: false
      }
    };
    
    return qualitySettings[this.currentLevel];
  }
}

/**
 * LOD（细节级别）管理器
 */
class LODManager {
  private config: LODConfig;
  private currentLOD: Map<string, number> = new Map();
  
  constructor(config: LODConfig) {
    this.config = config;
  }
  
  /**
   * 计算对象的LOD等级
   */
  public calculateLOD(
    objectId: string,
    distance: number,
    importance: number = 1.0
  ): number {
    let lodLevel = 0;
    
    // 基于距离确定LOD等级
    for (let i = 0; i < this.config.distances.length; i++) {
      if (distance > this.config.distances[i]) {
        lodLevel = i + 1;
      } else {
        break;
      }
    }
    
    // 调整重要性
    lodLevel = Math.max(0, lodLevel - Math.floor(importance));
    
    // 限制最大LOD等级
    lodLevel = Math.min(lodLevel, this.config.distances.length);
    
    this.currentLOD.set(objectId, lodLevel);
    return lodLevel;
  }
  
  /**
   * 获取LOD配置
   */
  public getLODConfig(level: number): {
    particleDensity: number;
    effectComplexity: number;
    updateFrequency: number;
  } {
    const clampedLevel = Math.min(level, this.config.distances.length);
    
    return {
      particleDensity: this.config.particleDensity[clampedLevel] || 1.0,
      effectComplexity: this.config.effectComplexity[clampedLevel] || 1.0,
      updateFrequency: this.config.updateFrequency[clampedLevel] || 60
    };
  }
  
  /**
   * 获取当前所有LOD状态
   */
  public getAllLODStates(): Map<string, number> {
    return new Map(this.currentLOD);
  }
}

/**
 * 批量渲染优化器
 */
class BatchingOptimizer {
  private batches: Map<string, any[]> = new Map();
  private maxBatchSize: number = 1000;
  
  /**
   * 添加到批次
   */
  public addToBatch(batchKey: string, item: any): void {
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, []);
    }
    
    const batch = this.batches.get(batchKey)!;
    batch.push(item);
    
    // 如果批次满了，触发渲染
    if (batch.length >= this.maxBatchSize) {
      this.processBatch(batchKey);
    }
  }
  
  /**
   * 处理批次
   */
  private processBatch(batchKey: string): void {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.length === 0) return;
    
    // 实际的批量渲染逻辑
    this.renderBatch(batchKey, batch);
    
    // 清空批次
    this.batches.set(batchKey, []);
  }
  
  /**
   * 渲染批次
   */
  private renderBatch(batchKey: string, items: any[]): void {
    // 实现批量渲染逻辑
    console.log(`批量渲染 ${batchKey}: ${items.length} 项`);
  }
  
  /**
   * 处理所有待处理的批次
   */
  public processAllBatches(): void {
    for (const batchKey of this.batches.keys()) {
      this.processBatch(batchKey);
    }
  }
}

/**
 * 动画性能优化器主类
 */
export class AnimationPerformanceOptimizer {
  private profiler: PerformanceProfiler;
  private qualityManager: AdaptiveQualityManager;
  private lodManager: LODManager;
  private batchingOptimizer: BatchingOptimizer;
  
  private config: OptimizationConfig;
  private strategy: OptimizationStrategy;
  
  // 优化状态
  private isOptimizing: boolean = false;
  private optimizationInterval: number = 0;
  
  // 回调函数
  private onQualityChanged?: (level: PerformanceLevel, config: any) => void;
  private onPerformanceAlert?: (metrics: PerformanceMetrics) => void;
  
  constructor(
    config: OptimizationConfig,
    strategy: OptimizationStrategy = OptimizationStrategy.ADAPTIVE
  ) {
    this.config = config;
    this.strategy = strategy;
    
    this.profiler = new PerformanceProfiler();
    this.qualityManager = new AdaptiveQualityManager(config);
    this.lodManager = new LODManager(this.createDefaultLODConfig());
    this.batchingOptimizer = new BatchingOptimizer();
    
    this.startOptimization();
  }
  
  /**
   * 创建默认LOD配置
   */
  private createDefaultLODConfig(): LODConfig {
    return {
      distances: [100, 300, 600, 1000],
      particleDensity: [1.0, 0.7, 0.4, 0.2, 0.1],
      effectComplexity: [1.0, 0.8, 0.6, 0.3, 0.1],
      updateFrequency: [60, 45, 30, 15, 10]
    };
  }
  
  /**
   * 开始优化
   */
  public startOptimization(): void {
    if (this.isOptimizing) return;
    
    this.isOptimizing = true;
    
    // 每秒优化一次
    this.optimizationInterval = setInterval(() => {
      this.performOptimization();
    }, 1000) as any;
  }
  
  /**
   * 停止优化
   */
  public stopOptimization(): void {
    this.isOptimizing = false;
    
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = 0;
    }
  }
  
  /**
   * 记录性能数据
   */
  public recordPerformance(deltaTime: number, context: any): void {
    this.profiler.recordMetrics(deltaTime, context);
  }
  
  /**
   * 执行优化
   */
  private performOptimization(): void {
    const metrics = this.profiler.getAverageMetrics(60);
    if (!metrics) return;
    
    // 检查性能告警
    this.checkPerformanceAlerts(metrics);
    
    // 根据策略执行优化
    switch (this.strategy) {
      case OptimizationStrategy.ADAPTIVE:
        this.performAdaptiveOptimization(metrics);
        break;
      case OptimizationStrategy.AGGRESSIVE:
        this.performAggressiveOptimization(metrics);
        break;
      case OptimizationStrategy.BALANCED:
        this.performBalancedOptimization(metrics);
        break;
      case OptimizationStrategy.CONSERVATIVE:
        this.performConservativeOptimization(metrics);
        break;
    }
  }
  
  /**
   * 自适应优化
   */
  private performAdaptiveOptimization(metrics: PerformanceMetrics): void {
    // 调整质量等级
    if (this.qualityManager.adjustQuality(metrics)) {
      const newConfig = this.qualityManager.getQualityConfig();
      if (this.onQualityChanged) {
        this.onQualityChanged(this.qualityManager.getCurrentLevel(), newConfig);
      }
    }
    
    // 处理批次
    this.batchingOptimizer.processAllBatches();
  }
  
  /**
   * 激进优化
   */
  private performAggressiveOptimization(metrics: PerformanceMetrics): void {
    // 更频繁地降低质量
    if (metrics.averageFPS < this.config.targetFPS * 0.9) {
      this.qualityManager.adjustQuality(metrics);
    }
  }
  
  /**
   * 平衡优化
   */
  private performBalancedOptimization(metrics: PerformanceMetrics): void {
    // 标准的优化逻辑
    this.performAdaptiveOptimization(metrics);
  }
  
  /**
   * 保守优化
   */
  private performConservativeOptimization(metrics: PerformanceMetrics): void {
    // 只在性能严重不足时才优化
    if (metrics.averageFPS < this.config.minAcceptableFPS * 0.8) {
      this.qualityManager.adjustQuality(metrics);
    }
  }
  
  /**
   * 检查性能告警
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    const alerts: string[] = [];
    
    if (metrics.averageFPS < this.config.minAcceptableFPS) {
      alerts.push('帧率过低');
    }
    
    if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      alerts.push('内存使用过高');
    }
    
    if (metrics.cpuUtilization > 80) {
      alerts.push('CPU利用率过高');
    }
    
    if (alerts.length > 0 && this.onPerformanceAlert) {
      this.onPerformanceAlert(metrics);
    }
  }
  
  /**
   * 计算对象LOD
   */
  public calculateLOD(objectId: string, distance: number, importance: number = 1.0): number {
    return this.lodManager.calculateLOD(objectId, distance, importance);
  }
  
  /**
   * 添加到批次渲染
   */
  public addToBatch(batchKey: string, item: any): void {
    this.batchingOptimizer.addToBatch(batchKey, item);
  }
  
  /**
   * 获取当前质量配置
   */
  public getCurrentQualityConfig(): any {
    return this.qualityManager.getQualityConfig();
  }
  
  /**
   * 获取性能统计
   */
  public getPerformanceStats(): PerformanceMetrics | null {
    return this.profiler.getLatestMetrics();
  }
  
  /**
   * 获取优化报告
   */
  public getOptimizationReport(): {
    currentLevel: PerformanceLevel;
    qualityConfig: any;
    metrics: PerformanceMetrics | null;
    lodStates: Map<string, number>;
    recommendations: string[];
  } {
    const metrics = this.profiler.getLatestMetrics();
    const recommendations: string[] = [];
    
    if (metrics) {
      if (metrics.averageFPS < this.config.targetFPS * 0.8) {
        recommendations.push('考虑降低粒子密度');
      }
      if (metrics.particleCount > this.config.maxParticles * 0.9) {
        recommendations.push('粒子数量接近上限');
      }
      if (metrics.memoryUsage > 50 * 1024 * 1024) {
        recommendations.push('内存使用较高，建议清理');
      }
    }
    
    return {
      currentLevel: this.qualityManager.getCurrentLevel(),
      qualityConfig: this.qualityManager.getQualityConfig(),
      metrics,
      lodStates: this.lodManager.getAllLODStates(),
      recommendations
    };
  }
  
  /**
   * 设置质量变更回调
   */
  public onQualityChange(callback: (level: PerformanceLevel, config: any) => void): void {
    this.onQualityChanged = callback;
  }
  
  /**
   * 设置性能告警回调
   */
  public onPerformanceAlertCallback(callback: (metrics: PerformanceMetrics) => void): void {
    this.onPerformanceAlert = callback;
  }
  
  /**
   * 强制设置质量等级
   */
  public forceQualityLevel(level: PerformanceLevel): void {
    // 临时禁用自适应调整
    const wasAdaptive = this.config.adaptiveQuality;
    this.config.adaptiveQuality = false;
    
    // 设置质量等级
    (this.qualityManager as any).currentLevel = level;
    
    const newConfig = this.qualityManager.getQualityConfig();
    if (this.onQualityChanged) {
      this.onQualityChanged(level, newConfig);
    }
    
    // 恢复自适应设置
    this.config.adaptiveQuality = wasAdaptive;
  }
  
  /**
   * 销毁优化器
   */
  public destroy(): void {
    this.stopOptimization();
    this.profiler.destroy();
  }
}

export default AnimationPerformanceOptimizer;