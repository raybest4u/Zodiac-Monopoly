import type { GameState } from '../types/game';
import { GameBalanceAnalyzer, type BalanceMetrics, type BalanceAlert } from './GameBalanceAnalyzer';
import { ValueOptimizer, type GameParameters, type OptimizationResult } from './ValueOptimizer';
import { GameSimulator, type SimulationConfig, type BatchSimulationResult } from './GameSimulator';

export interface DashboardConfig {
  autoOptimize: boolean;
  simulationBatchSize: number;
  optimizationThreshold: number;
  alertThreshold: 'low' | 'medium' | 'high' | 'critical';
  realTimeMonitoring: boolean;
}

export interface DashboardState {
  currentMetrics: BalanceMetrics | null;
  activeAlerts: BalanceAlert[];
  optimizationHistory: OptimizationResult[];
  simulationResults: BatchSimulationResult | null;
  isOptimizing: boolean;
  isSimulating: boolean;
  lastUpdate: number;
}

export interface OptimizationReport {
  timestamp: number;
  originalParameters: GameParameters;
  optimizedParameters: GameParameters;
  improvements: OptimizationResult[];
  simulationBefore: BatchSimulationResult;
  simulationAfter: BatchSimulationResult;
  recommendation: string;
  confidence: number;
}

export class BalanceDashboard {
  private analyzer: GameBalanceAnalyzer;
  private optimizer: ValueOptimizer;
  private simulator: GameSimulator;
  private config: DashboardConfig;
  private state: DashboardState;
  private gameStateHistory: GameState[] = [];
  private optimizationReports: OptimizationReport[] = [];

  constructor(
    initialParameters: GameParameters,
    config: Partial<DashboardConfig> = {}
  ) {
    this.analyzer = new GameBalanceAnalyzer();
    this.optimizer = new ValueOptimizer(initialParameters);
    this.simulator = new GameSimulator();
    
    this.config = {
      autoOptimize: false,
      simulationBatchSize: 50,
      optimizationThreshold: 0.1,
      alertThreshold: 'medium',
      realTimeMonitoring: true,
      ...config
    };

    this.state = {
      currentMetrics: null,
      activeAlerts: [],
      optimizationHistory: [],
      simulationResults: null,
      isOptimizing: false,
      isSimulating: false,
      lastUpdate: Date.now()
    };
  }

  // 更新游戏状态并分析平衡
  updateGameState(gameState: GameState): void {
    this.gameStateHistory.push(JSON.parse(JSON.stringify(gameState)));
    this.analyzer.addGameState(gameState);
    
    if (this.config.realTimeMonitoring) {
      this.performRealTimeAnalysis(gameState);
    }
  }

  // 实时分析
  private async performRealTimeAnalysis(gameState: GameState): Promise<void> {
    try {
      // 分析当前平衡状态
      const metrics = this.analyzer.analyzeBalance(gameState);
      const alerts = this.analyzer.detectBalanceIssues(metrics);
      
      this.state.currentMetrics = metrics;
      this.state.activeAlerts = this.filterAlertsByThreshold(alerts);
      this.state.lastUpdate = Date.now();
      
      // 如果启用了自动优化且存在严重警告
      if (this.config.autoOptimize && this.shouldTriggerOptimization(alerts)) {
        await this.performAutoOptimization();
      }
      
    } catch (error) {
      console.error('实时分析失败:', error);
    }
  }

  // 过滤警告
  private filterAlertsByThreshold(alerts: BalanceAlert[]): BalanceAlert[] {
    const thresholdLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const minLevel = thresholdLevels[this.config.alertThreshold];
    
    return alerts.filter(alert => {
      const alertLevel = thresholdLevels[alert.severity];
      return alertLevel >= minLevel;
    });
  }

  // 判断是否应该触发优化
  private shouldTriggerOptimization(alerts: BalanceAlert[]): boolean {
    const severeAlerts = alerts.filter(alert => 
      alert.severity === 'high' || alert.severity === 'critical'
    );
    
    return severeAlerts.length > 0 && 
           severeAlerts.some(alert => alert.deviation > this.config.optimizationThreshold);
  }

  // 执行全面平衡分析
  async performComprehensiveAnalysis(): Promise<{
    metrics: BalanceMetrics;
    alerts: BalanceAlert[];
    recommendations: string[];
  }> {
    if (this.gameStateHistory.length === 0) {
      throw new Error('没有可分析的游戏数据');
    }

    const latestGameState = this.gameStateHistory[this.gameStateHistory.length - 1];
    
    // 分析平衡指标
    const metrics = this.analyzer.analyzeBalance(latestGameState);
    
    // 检测平衡问题
    const alerts = this.analyzer.detectBalanceIssues(metrics);
    
    // 生成建议
    const recommendations = this.analyzer.generateBalanceRecommendations(metrics, alerts);
    
    this.state.currentMetrics = metrics;
    this.state.activeAlerts = alerts;
    
    return { metrics, alerts, recommendations };
  }

  // 执行参数优化
  async optimizeParameters(targetMetrics?: Partial<BalanceMetrics>): Promise<OptimizationResult[]> {
    if (!this.state.currentMetrics) {
      throw new Error('需要先进行平衡分析');
    }

    this.state.isOptimizing = true;
    
    try {
      // 执行优化
      const results = this.optimizer.optimizeParameters(
        this.state.currentMetrics, 
        this.state.activeAlerts
      );
      
      this.state.optimizationHistory.push(...results);
      
      return results;
    } finally {
      this.state.isOptimizing = false;
    }
  }

  // 执行批量优化
  async performBatchOptimization(iterations: number = 10): Promise<OptimizationReport> {
    const originalParameters = this.optimizer.getCurrentParameters();
    
    // 运行优化前的模拟
    const simulationBefore = await this.runOptimizationSimulation(originalParameters);
    
    // 执行多轮优化
    const allResults: OptimizationResult[] = [];
    
    for (let i = 0; i < iterations; i++) {
      if (!this.state.currentMetrics) break;
      
      const results = await this.optimizeParameters();
      allResults.push(...results);
      
      // 模拟新参数的效果
      const newParameters = this.optimizer.getCurrentParameters();
      const testSimulation = await this.runOptimizationSimulation(newParameters);
      
      // 如果没有改进，停止优化
      if (this.compareSimulationResults(simulationBefore, testSimulation) <= 0) {
        break;
      }
    }
    
    const optimizedParameters = this.optimizer.getCurrentParameters();
    const simulationAfter = await this.runOptimizationSimulation(optimizedParameters);
    
    // 生成优化报告
    const report: OptimizationReport = {
      timestamp: Date.now(),
      originalParameters,
      optimizedParameters,
      improvements: allResults,
      simulationBefore,
      simulationAfter,
      recommendation: this.generateOptimizationRecommendation(allResults, simulationBefore, simulationAfter),
      confidence: this.calculateOptimizationConfidence(allResults)
    };
    
    this.optimizationReports.push(report);
    
    return report;
  }

  // 运行模拟以验证优化效果
  private async runOptimizationSimulation(parameters: GameParameters): Promise<BatchSimulationResult> {
    const config: SimulationConfig = {
      playerCount: 4,
      zodiacDistribution: ['dragon', 'tiger', 'rabbit', 'rat'],
      gameParameters: parameters,
      maxRounds: 100,
      simulationSpeed: 'fast'
    };
    
    return await this.simulator.simulateBatch(config, this.config.simulationBatchSize);
  }

  // 比较模拟结果
  private compareSimulationResults(before: BatchSimulationResult, after: BatchSimulationResult): number {
    // 综合评分函数
    const scoreBefore = this.calculateSimulationScore(before);
    const scoreAfter = this.calculateSimulationScore(after);
    
    return scoreAfter - scoreBefore;
  }

  // 计算模拟得分
  private calculateSimulationScore(result: BatchSimulationResult): number {
    let score = 0;
    
    // 生肖平衡得分（胜率方差越小越好）
    const winRates = Object.values(result.zodiacWinRates);
    const winRateVariance = this.calculateVariance(winRates);
    score += 100 / (1 + winRateVariance * 10); // 最高100分
    
    // 基尼系数得分（越接近0.4越好）
    const giniTarget = 0.4;
    const giniDeviation = Math.abs(result.averageBalanceMetrics.giniCoefficient - giniTarget);
    score += 50 / (1 + giniDeviation * 20); // 最高50分
    
    // 游戏时长得分（越接近60分钟越好）
    const durationTarget = 3600000; // 60分钟（毫秒）
    const durationDeviation = Math.abs(result.averageDuration - durationTarget) / durationTarget;
    score += 30 / (1 + durationDeviation * 5); // 最高30分
    
    // 玩家参与度得分
    score += result.averageBalanceMetrics.playerEngagement * 20; // 最高20分
    
    return score;
  }

  // 自动优化
  private async performAutoOptimization(): Promise<void> {
    if (this.state.isOptimizing) return;
    
    try {
      console.log('触发自动优化...');
      const results = await this.optimizeParameters();
      
      if (results.length > 0) {
        console.log(`自动优化完成，调整了 ${results.length} 个参数`);
      }
    } catch (error) {
      console.error('自动优化失败:', error);
    }
  }

  // 参数敏感性分析
  async analyzeParameterSensitivity(
    parameterName: keyof GameParameters,
    valueRange: [number, number],
    steps: number = 10
  ): Promise<Array<{value: number, score: number, metrics: any}>> {
    this.state.isSimulating = true;
    
    try {
      const baseConfig: SimulationConfig = {
        playerCount: 4,
        zodiacDistribution: ['dragon', 'tiger', 'rabbit', 'rat'],
        gameParameters: this.optimizer.getCurrentParameters(),
        maxRounds: 100,
        simulationSpeed: 'fast'
      };
      
      const results = await this.simulator.analyzeParameterSensitivity(
        baseConfig,
        parameterName,
        valueRange,
        steps,
        20 // 每步模拟20次
      );
      
      // 为每个结果计算得分
      return results.map(result => ({
        value: result.value,
        score: this.calculateParameterScore(result.metrics),
        metrics: result.metrics
      }));
      
    } finally {
      this.state.isSimulating = false;
    }
  }

  // 计算参数得分
  private calculateParameterScore(metrics: any): number {
    let score = 0;
    
    // 基于各种指标计算综合得分
    if (metrics.giniCoefficient) {
      const giniScore = 100 / (1 + Math.abs(metrics.giniCoefficient - 0.4) * 10);
      score += giniScore * 0.3;
    }
    
    if (metrics.playerEngagement) {
      score += metrics.playerEngagement * 50 * 0.2;
    }
    
    if (metrics.zodiacBalance) {
      score += metrics.zodiacBalance * 100 * 0.3;
    }
    
    if (metrics.averageDuration) {
      const durationScore = 100 / (1 + Math.abs(metrics.averageDuration - 3600000) / 3600000 * 5);
      score += durationScore * 0.2;
    }
    
    return score;
  }

  // 生成优化建议
  private generateOptimizationRecommendation(
    results: OptimizationResult[],
    before: BatchSimulationResult,
    after: BatchSimulationResult
  ): string {
    const improvement = this.compareSimulationResults(before, after);
    
    if (improvement > 10) {
      return '优化效果显著，建议应用这些参数调整';
    } else if (improvement > 0) {
      return '优化有小幅改进，可以考虑应用';
    } else {
      return '优化效果不明显，建议保持当前参数或尝试其他优化策略';
    }
  }

  // 计算优化置信度
  private calculateOptimizationConfidence(results: OptimizationResult[]): number {
    if (results.length === 0) return 0;
    
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const avgImprovement = results.reduce((sum, r) => sum + r.improvement, 0) / results.length;
    
    return Math.min(1.0, (avgConfidence + avgImprovement) / 2);
  }

  // 导出平衡报告
  generateBalanceReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      currentMetrics: this.state.currentMetrics,
      activeAlerts: this.state.activeAlerts,
      optimizationHistory: this.state.optimizationHistory,
      currentParameters: this.optimizer.getCurrentParameters(),
      recommendations: this.state.currentMetrics ? 
        this.analyzer.generateBalanceRecommendations(this.state.currentMetrics, this.state.activeAlerts) : []
    };
    
    return JSON.stringify(report, null, 2);
  }

  // 重置优化状态
  resetOptimization(): void {
    this.optimizer.resetToOriginal();
    this.state.optimizationHistory = [];
    this.optimizationReports = [];
  }

  // 应用优化建议
  applyOptimizationResults(results: OptimizationResult[]): void {
    results.forEach(result => {
      if (result.confidence > 0.7) { // 只应用高置信度的优化
        // 优化已经在optimizer内部应用了
        console.log(`应用优化: ${result.parameter} = ${result.newValue}`);
      }
    });
  }

  // 获取仪表板状态
  getDashboardState(): DashboardState {
    return { ...this.state };
  }

  // 更新配置
  updateConfig(newConfig: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 获取配置
  getConfig(): DashboardConfig {
    return { ...this.config };
  }

  // 获取优化报告历史
  getOptimizationReports(): OptimizationReport[] {
    return [...this.optimizationReports];
  }

  // 辅助方法
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }
}