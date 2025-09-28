import type {
  AIState,
  AIDecision,
  AIStatistics,
  SituationAnalysis
} from '../types/ai';

import type {
  GameState,
  Player,
  PlayerAction
} from '../types/game';

/**
 * AI性能分析和监控系统
 * 负责收集、分析和报告AI的性能数据，提供决策优化建议
 */
export class PerformanceAnalytics {
  private performanceData: Map<string, AIPerformanceProfile> = new Map();
  private decisionHistory: Map<string, DecisionRecord[]> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private behaviorPatterns: Map<string, BehaviorPattern[]> = new Map();
  private readonly config: AnalyticsConfig;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      historySize: 1000,
      analysisWindowSize: 100,
      performanceThreshold: 0.6,
      patternDetectionMinSamples: 20,
      metricsUpdateInterval: 50,
      enableRealTimeAnalysis: true,
      enablePredictiveAnalysis: true,
      ...config
    };
  }

  /**
   * 记录AI决策
   */
  recordDecision(
    aiId: string,
    decision: AIDecision,
    gameState: GameState,
    outcome?: DecisionOutcome
  ): void {
    const record: DecisionRecord = {
      timestamp: Date.now(),
      aiId,
      decision,
      gameContext: this.extractGameContext(gameState),
      outcome,
      performance: this.calculateDecisionPerformance(decision, outcome)
    };

    // 添加到历史记录
    const history = this.decisionHistory.get(aiId) || [];
    history.push(record);
    
    // 维护历史记录大小
    if (history.length > this.config.historySize) {
      history.splice(0, history.length - this.config.historySize);
    }
    
    this.decisionHistory.set(aiId, history);

    // 实时分析
    if (this.config.enableRealTimeAnalysis) {
      this.updateRealTimeMetrics(aiId, record);
    }

    // 模式检测
    if (history.length >= this.config.patternDetectionMinSamples) {
      this.detectBehaviorPatterns(aiId, history);
    }
  }

  /**
   * 分析AI整体性能
   */
  analyzeOverallPerformance(aiId: string): PerformanceAnalysisReport {
    const profile = this.getOrCreatePerformanceProfile(aiId);
    const history = this.decisionHistory.get(aiId) || [];
    const metrics = this.performanceMetrics.get(aiId);

    if (history.length === 0) {
      return this.createEmptyReport(aiId);
    }

    // 基础性能统计
    const basicStats = this.calculateBasicStatistics(history);
    
    // 趋势分析
    const trends = this.analyzeTrends(history);
    
    // 强项和弱项分析
    const strengthsWeaknesses = this.analyzeStrengthsAndWeaknesses(history);
    
    // 决策质量分析
    const decisionQuality = this.analyzeDecisionQuality(history);
    
    // 适应性分析
    const adaptability = this.analyzeAdaptability(history);
    
    // 一致性分析
    const consistency = this.analyzeConsistency(history);

    // 生成改进建议
    const recommendations = this.generateImprovementRecommendations(
      basicStats,
      trends,
      strengthsWeaknesses,
      decisionQuality
    );

    return {
      aiId,
      analysisTimestamp: Date.now(),
      sampleSize: history.length,
      timespan: this.calculateTimespan(history),
      basicStatistics: basicStats,
      trends,
      strengthsAndWeaknesses: strengthsWeaknesses,
      decisionQuality,
      adaptability,
      consistency,
      recommendations,
      overallScore: this.calculateOverallScore(basicStats, trends, decisionQuality),
      riskProfile: this.analyzeRiskProfile(history)
    };
  }

  /**
   * 分析特定类型决策的性能
   */
  analyzeDecisionTypePerformance(
    aiId: string,
    actionType: string
  ): DecisionTypeAnalysis {
    const history = this.decisionHistory.get(aiId) || [];
    const typeHistory = history.filter(record => 
      record.decision.action.type === actionType
    );

    if (typeHistory.length === 0) {
      return {
        actionType,
        sampleSize: 0,
        successRate: 0,
        averageConfidence: 0,
        averageOutcome: 0,
        timeDistribution: [],
        contextFactors: [],
        recommendations: ['需要更多该类型决策的数据']
      };
    }

    return {
      actionType,
      sampleSize: typeHistory.length,
      successRate: this.calculateSuccessRate(typeHistory),
      averageConfidence: this.calculateAverageConfidence(typeHistory),
      averageOutcome: this.calculateAverageOutcome(typeHistory),
      timeDistribution: this.analyzeTimeDistribution(typeHistory),
      contextFactors: this.analyzeContextFactors(typeHistory),
      recommendations: this.generateTypeSpecificRecommendations(typeHistory)
    };
  }

  /**
   * 比较多个AI的性能
   */
  compareAIPerformance(aiIds: string[]): AIComparisonReport {
    const comparisons: AIPerformanceComparison[] = [];

    for (const aiId of aiIds) {
      const analysis = this.analyzeOverallPerformance(aiId);
      comparisons.push({
        aiId,
        overallScore: analysis.overallScore,
        successRate: analysis.basicStatistics.successRate,
        averageConfidence: analysis.basicStatistics.averageConfidence,
        decisionSpeed: analysis.basicStatistics.averageDecisionTime,
        adaptabilityScore: analysis.adaptability.score,
        consistencyScore: analysis.consistency.score,
        strengths: analysis.strengthsAndWeaknesses.strengths,
        weaknesses: analysis.strengthsAndWeaknesses.weaknesses
      });
    }

    // 排序和排名
    const ranking = this.rankAIPerformance(comparisons);

    return {
      comparisonTimestamp: Date.now(),
      participantCount: aiIds.length,
      comparisons,
      ranking,
      insights: this.generateComparisonInsights(comparisons),
      recommendations: this.generateComparisonRecommendations(comparisons)
    };
  }

  /**
   * 获取实时性能指标
   */
  getRealTimeMetrics(aiId: string): RealTimeMetrics {
    const metrics = this.performanceMetrics.get(aiId);
    const recentDecisions = this.getRecentDecisions(aiId, 10);

    return {
      aiId,
      timestamp: Date.now(),
      currentSuccessRate: metrics?.currentSuccessRate || 0,
      currentConfidenceLevel: metrics?.currentConfidenceLevel || 0,
      recentDecisionCount: recentDecisions.length,
      averageRecentDecisionTime: this.calculateAverageDecisionTime(recentDecisions),
      currentMood: this.assessCurrentMood(recentDecisions),
      performanceTrend: this.assessPerformanceTrend(aiId),
      alertLevel: this.assessAlertLevel(metrics),
      recommendations: this.generateRealTimeRecommendations(metrics, recentDecisions)
    };
  }

  /**
   * 检测性能异常
   */
  detectPerformanceAnomalies(aiId: string): PerformanceAnomaly[] {
    const history = this.decisionHistory.get(aiId) || [];
    const anomalies: PerformanceAnomaly[] = [];

    // 检测成功率异常下降
    const successRateAnomaly = this.detectSuccessRateAnomaly(history);
    if (successRateAnomaly) anomalies.push(successRateAnomaly);

    // 检测置信度异常变化
    const confidenceAnomaly = this.detectConfidenceAnomaly(history);
    if (confidenceAnomaly) anomalies.push(confidenceAnomaly);

    // 检测决策时间异常
    const timingAnomaly = this.detectTimingAnomaly(history);
    if (timingAnomaly) anomalies.push(timingAnomaly);

    // 检测行为模式异常
    const behaviorAnomaly = this.detectBehaviorAnomaly(aiId, history);
    if (behaviorAnomaly) anomalies.push(behaviorAnomaly);

    return anomalies;
  }

  /**
   * 生成性能优化建议
   */
  generateOptimizationSuggestions(aiId: string): OptimizationSuggestion[] {
    const analysis = this.analyzeOverallPerformance(aiId);
    const anomalies = this.detectPerformanceAnomalies(aiId);
    const patterns = this.behaviorPatterns.get(aiId) || [];

    const suggestions: OptimizationSuggestion[] = [];

    // 基于整体性能的建议
    if (analysis.overallScore < 0.6) {
      suggestions.push({
        type: 'overall_improvement',
        priority: 'high',
        title: '整体性能提升',
        description: '当前整体性能偏低，建议全面优化决策逻辑',
        actionItems: [
          '检查决策权重设置',
          '优化个性参数',
          '增强学习机制'
        ],
        expectedImpact: 'high',
        estimatedEffort: 'medium'
      });
    }

    // 基于弱项的建议
    for (const weakness of analysis.strengthsAndWeaknesses.weaknesses) {
      suggestions.push(this.createWeaknessBasedSuggestion(weakness));
    }

    // 基于异常的建议
    for (const anomaly of anomalies) {
      suggestions.push(this.createAnomalyBasedSuggestion(anomaly));
    }

    // 基于模式的建议
    for (const pattern of patterns) {
      if (pattern.effectiveness < 0.5) {
        suggestions.push(this.createPatternBasedSuggestion(pattern));
      }
    }

    return suggestions.sort((a, b) => this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority));
  }

  /**
   * 导出性能报告
   */
  exportPerformanceReport(
    aiId: string,
    format: 'json' | 'csv' | 'summary' = 'json'
  ): string {
    const analysis = this.analyzeOverallPerformance(aiId);
    
    switch (format) {
      case 'json':
        return JSON.stringify(analysis, null, 2);
      case 'csv':
        return this.convertToCSV(analysis);
      case 'summary':
        return this.generateSummaryReport(analysis);
      default:
        return JSON.stringify(analysis, null, 2);
    }
  }

  // 私有方法

  private extractGameContext(gameState: GameState): GameContext {
    return {
      phase: gameState.phase,
      turn: gameState.turn,
      playerCount: gameState.players.length,
      gameMode: gameState.mode,
      season: gameState.season,
      marketTrends: gameState.marketTrends
    };
  }

  private calculateDecisionPerformance(
    decision: AIDecision,
    outcome?: DecisionOutcome
  ): DecisionPerformance {
    return {
      confidence: decision.confidence,
      executionTime: 0, // 从decision中获取或计算
      success: outcome?.success || false,
      actualBenefit: outcome?.actualBenefit || 0,
      predictedBenefit: decision.analysis?.opportunities?.length || 0,
      riskLevel: this.assessDecisionRisk(decision)
    };
  }

  private updateRealTimeMetrics(aiId: string, record: DecisionRecord): void {
    const metrics = this.performanceMetrics.get(aiId) || this.createEmptyMetrics();
    
    // 更新指标
    metrics.totalDecisions++;
    metrics.currentSuccessRate = this.calculateRecentSuccessRate(aiId);
    metrics.currentConfidenceLevel = record.decision.confidence;
    metrics.lastDecisionTime = record.timestamp;
    
    // 更新移动平均
    this.updateMovingAverages(metrics, record);
    
    this.performanceMetrics.set(aiId, metrics);
  }

  private detectBehaviorPatterns(aiId: string, history: DecisionRecord[]): void {
    const patterns = this.behaviorPatterns.get(aiId) || [];
    
    // 检测新模式
    const newPatterns = this.identifyNewPatterns(history);
    
    // 更新现有模式
    const updatedPatterns = this.updateExistingPatterns(patterns, history);
    
    this.behaviorPatterns.set(aiId, [...updatedPatterns, ...newPatterns]);
  }

  private getOrCreatePerformanceProfile(aiId: string): AIPerformanceProfile {
    if (!this.performanceData.has(aiId)) {
      this.performanceData.set(aiId, {
        aiId,
        creationTime: Date.now(),
        totalAnalyses: 0,
        bestPerformanceScore: 0,
        worstPerformanceScore: 1,
        averagePerformanceScore: 0,
        performanceHistory: [],
        lastAnalysisTime: 0
      });
    }
    return this.performanceData.get(aiId)!;
  }

  private calculateBasicStatistics(history: DecisionRecord[]): BasicStatistics {
    const successCount = history.filter(r => r.performance.success).length;
    const totalConfidence = history.reduce((sum, r) => sum + r.decision.confidence, 0);
    const totalExecutionTime = history.reduce((sum, r) => sum + r.performance.executionTime, 0);

    return {
      totalDecisions: history.length,
      successRate: successCount / history.length,
      failureRate: (history.length - successCount) / history.length,
      averageConfidence: totalConfidence / history.length,
      averageDecisionTime: totalExecutionTime / history.length,
      confidenceRange: this.calculateConfidenceRange(history),
      decisionTimeRange: this.calculateDecisionTimeRange(history)
    };
  }

  private analyzeTrends(history: DecisionRecord[]): TrendAnalysis {
    const windowSize = Math.min(this.config.analysisWindowSize, history.length);
    const recent = history.slice(-windowSize);
    const earlier = history.slice(-windowSize * 2, -windowSize);

    return {
      successRateTrend: this.calculateTrend(earlier, recent, 'successRate'),
      confidenceTrend: this.calculateTrend(earlier, recent, 'confidence'),
      decisionTimeTrend: this.calculateTrend(earlier, recent, 'decisionTime'),
      overallTrend: this.calculateOverallTrend(recent),
      trendStrength: this.calculateTrendStrength(recent),
      prediction: this.generateTrendPrediction(recent)
    };
  }

  private analyzeStrengthsAndWeaknesses(history: DecisionRecord[]): StrengthsAndWeaknesses {
    const decisionTypes = this.groupByDecisionType(history);
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    for (const [type, records] of decisionTypes) {
      const successRate = this.calculateSuccessRate(records);
      if (successRate > 0.7) {
        strengths.push(`${type}决策表现优秀 (${(successRate * 100).toFixed(1)}%)`);
      } else if (successRate < 0.4) {
        weaknesses.push(`${type}决策需要改进 (${(successRate * 100).toFixed(1)}%)`);
      }
    }

    return {
      strengths: strengths.length > 0 ? strengths : ['决策执行稳定'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['暂无明显弱项'],
      improvementPotential: this.calculateImprovementPotential(history)
    };
  }

  private analyzeDecisionQuality(history: DecisionRecord[]): DecisionQualityAnalysis {
    return {
      averageQualityScore: this.calculateAverageQualityScore(history),
      qualityDistribution: this.calculateQualityDistribution(history),
      consistencyScore: this.calculateQualityConsistency(history),
      improvementRate: this.calculateQualityImprovementRate(history),
      qualityFactors: this.identifyQualityFactors(history)
    };
  }

  private analyzeAdaptability(history: DecisionRecord[]): AdaptabilityAnalysis {
    return {
      score: this.calculateAdaptabilityScore(history),
      contextSensitivity: this.analyzeContextSensitivity(history),
      learningRate: this.calculateLearningRate(history),
      flexibilityScore: this.calculateFlexibilityScore(history),
      adaptationPatterns: this.identifyAdaptationPatterns(history)
    };
  }

  private analyzeConsistency(history: DecisionRecord[]): ConsistencyAnalysis {
    return {
      score: this.calculateConsistencyScore(history),
      variabilityFactors: this.identifyVariabilityFactors(history),
      stabilityTrend: this.analyzeStabilityTrend(history),
      predictabilityScore: this.calculatePredictabilityScore(history)
    };
  }

  // 简化的实现方法
  private createEmptyReport(aiId: string): PerformanceAnalysisReport {
    return {
      aiId,
      analysisTimestamp: Date.now(),
      sampleSize: 0,
      timespan: { start: 0, end: 0, duration: 0 },
      basicStatistics: {
        totalDecisions: 0,
        successRate: 0,
        failureRate: 0,
        averageConfidence: 0,
        averageDecisionTime: 0,
        confidenceRange: { min: 0, max: 0 },
        decisionTimeRange: { min: 0, max: 0 }
      },
      trends: {
        successRateTrend: 'stable',
        confidenceTrend: 'stable',
        decisionTimeTrend: 'stable',
        overallTrend: 'stable',
        trendStrength: 0,
        prediction: '暂无数据'
      },
      strengthsAndWeaknesses: {
        strengths: ['暂无数据'],
        weaknesses: ['暂无数据'],
        improvementPotential: 0
      },
      decisionQuality: {
        averageQualityScore: 0,
        qualityDistribution: [],
        consistencyScore: 0,
        improvementRate: 0,
        qualityFactors: []
      },
      adaptability: {
        score: 0,
        contextSensitivity: 0,
        learningRate: 0,
        flexibilityScore: 0,
        adaptationPatterns: []
      },
      consistency: {
        score: 0,
        variabilityFactors: [],
        stabilityTrend: 'stable',
        predictabilityScore: 0
      },
      recommendations: ['需要更多决策数据进行分析'],
      overallScore: 0,
      riskProfile: {
        riskLevel: 'unknown',
        riskFactors: [],
        riskMitigation: []
      }
    };
  }

  private calculateTimespan(history: DecisionRecord[]) {
    if (history.length === 0) return { start: 0, end: 0, duration: 0 };
    const start = history[0].timestamp;
    const end = history[history.length - 1].timestamp;
    return { start, end, duration: end - start };
  }

  private calculateOverallScore(
    basicStats: BasicStatistics,
    trends: TrendAnalysis,
    quality: DecisionQualityAnalysis
  ): number {
    return (basicStats.successRate * 0.4 + 
            (basicStats.averageConfidence * 0.3) + 
            (quality.averageQualityScore * 0.3));
  }

  private analyzeRiskProfile(history: DecisionRecord[]) {
    return {
      riskLevel: 'medium' as const,
      riskFactors: ['决策一致性', '环境适应性'],
      riskMitigation: ['增强监控', '优化参数']
    };
  }

  // 更多简化实现...
  private calculateSuccessRate(records: DecisionRecord[]): number {
    return records.filter(r => r.performance.success).length / Math.max(records.length, 1);
  }

  private calculateAverageConfidence(records: DecisionRecord[]): number {
    return records.reduce((sum, r) => sum + r.decision.confidence, 0) / Math.max(records.length, 1);
  }

  private calculateAverageOutcome(records: DecisionRecord[]): number {
    return records.reduce((sum, r) => sum + r.performance.actualBenefit, 0) / Math.max(records.length, 1);
  }

  private analyzeTimeDistribution(records: DecisionRecord[]): any[] {
    return [];
  }

  private analyzeContextFactors(records: DecisionRecord[]): string[] {
    return ['游戏阶段', '市场状况', '竞争压力'];
  }

  private generateTypeSpecificRecommendations(records: DecisionRecord[]): string[] {
    return ['优化该类型决策的权重设置', '增加相关训练数据'];
  }

  private rankAIPerformance(comparisons: AIPerformanceComparison[]) {
    return comparisons
      .sort((a, b) => b.overallScore - a.overallScore)
      .map((comp, index) => ({ ...comp, rank: index + 1 }));
  }

  private generateComparisonInsights(comparisons: AIPerformanceComparison[]): string[] {
    return ['性能差异主要体现在决策速度上', '适应性是关键差异化因素'];
  }

  private generateComparisonRecommendations(comparisons: AIPerformanceComparison[]): string[] {
    return ['学习最佳表现者的策略', '针对性改进弱项领域'];
  }

  private getRecentDecisions(aiId: string, count: number): DecisionRecord[] {
    const history = this.decisionHistory.get(aiId) || [];
    return history.slice(-count);
  }

  private calculateAverageDecisionTime(records: DecisionRecord[]): number {
    return records.reduce((sum, r) => sum + r.performance.executionTime, 0) / Math.max(records.length, 1);
  }

  private assessCurrentMood(records: DecisionRecord[]): string {
    const recentSuccess = records.filter(r => r.performance.success).length / Math.max(records.length, 1);
    return recentSuccess > 0.7 ? 'confident' : recentSuccess < 0.3 ? 'cautious' : 'neutral';
  }

  private assessPerformanceTrend(aiId: string): 'improving' | 'declining' | 'stable' {
    return 'stable';
  }

  private assessAlertLevel(metrics?: PerformanceMetrics): 'low' | 'medium' | 'high' {
    return metrics?.currentSuccessRate < 0.3 ? 'high' : 
           metrics?.currentSuccessRate < 0.6 ? 'medium' : 'low';
  }

  private generateRealTimeRecommendations(
    metrics?: PerformanceMetrics, 
    recentDecisions?: DecisionRecord[]
  ): string[] {
    return ['保持当前策略', '关注环境变化'];
  }

  // 其他简化方法...
  private detectSuccessRateAnomaly(history: DecisionRecord[]): PerformanceAnomaly | null {
    return null;
  }

  private detectConfidenceAnomaly(history: DecisionRecord[]): PerformanceAnomaly | null {
    return null;
  }

  private detectTimingAnomaly(history: DecisionRecord[]): PerformanceAnomaly | null {
    return null;
  }

  private detectBehaviorAnomaly(aiId: string, history: DecisionRecord[]): PerformanceAnomaly | null {
    return null;
  }

  private createWeaknessBasedSuggestion(weakness: string): OptimizationSuggestion {
    return {
      type: 'weakness_improvement',
      priority: 'medium',
      title: `改进${weakness}`,
      description: `针对${weakness}进行专项优化`,
      actionItems: ['分析根本原因', '调整相关参数', '增加训练'],
      expectedImpact: 'medium',
      estimatedEffort: 'low'
    };
  }

  private createAnomalyBasedSuggestion(anomaly: PerformanceAnomaly): OptimizationSuggestion {
    return {
      type: 'anomaly_fix',
      priority: 'high',
      title: '修复性能异常',
      description: '检测到性能异常，需要立即处理',
      actionItems: ['调查异常原因', '回滚问题更改', '增强监控'],
      expectedImpact: 'high',
      estimatedEffort: 'medium'
    };
  }

  private createPatternBasedSuggestion(pattern: BehaviorPattern): OptimizationSuggestion {
    return {
      type: 'pattern_optimization',
      priority: 'medium',
      title: '优化行为模式',
      description: '发现低效行为模式，建议优化',
      actionItems: ['分析模式成因', '调整决策逻辑', '验证改进效果'],
      expectedImpact: 'medium',
      estimatedEffort: 'medium'
    };
  }

  private priorityToNumber(priority: string): number {
    const map = { low: 1, medium: 2, high: 3 };
    return map[priority as keyof typeof map] || 1;
  }

  private convertToCSV(analysis: PerformanceAnalysisReport): string {
    return `AI ID,Overall Score,Success Rate,Average Confidence,Total Decisions
${analysis.aiId},${analysis.overallScore},${analysis.basicStatistics.successRate},${analysis.basicStatistics.averageConfidence},${analysis.basicStatistics.totalDecisions}`;
  }

  private generateSummaryReport(analysis: PerformanceAnalysisReport): string {
    return `AI Performance Summary for ${analysis.aiId}:
- Overall Score: ${(analysis.overallScore * 100).toFixed(1)}%
- Success Rate: ${(analysis.basicStatistics.successRate * 100).toFixed(1)}%
- Average Confidence: ${(analysis.basicStatistics.averageConfidence * 100).toFixed(1)}%
- Total Decisions: ${analysis.basicStatistics.totalDecisions}
- Key Strengths: ${analysis.strengthsAndWeaknesses.strengths.join(', ')}
- Areas for Improvement: ${analysis.strengthsAndWeaknesses.weaknesses.join(', ')}`;
  }

  // 更多方法的简化实现...
  private assessDecisionRisk(decision: AIDecision): number { return 0.5; }
  private calculateRecentSuccessRate(aiId: string): number { return 0.5; }
  private createEmptyMetrics(): PerformanceMetrics { 
    return {
      totalDecisions: 0,
      currentSuccessRate: 0,
      currentConfidenceLevel: 0,
      lastDecisionTime: 0
    };
  }
  private updateMovingAverages(metrics: PerformanceMetrics, record: DecisionRecord): void {}
  private identifyNewPatterns(history: DecisionRecord[]): BehaviorPattern[] { return []; }
  private updateExistingPatterns(patterns: BehaviorPattern[], history: DecisionRecord[]): BehaviorPattern[] { return patterns; }
  private calculateConfidenceRange(history: DecisionRecord[]) { return { min: 0, max: 1 }; }
  private calculateDecisionTimeRange(history: DecisionRecord[]) { return { min: 0, max: 1000 }; }
  private calculateTrend(earlier: DecisionRecord[], recent: DecisionRecord[], metric: string): 'improving' | 'declining' | 'stable' { return 'stable'; }
  private calculateOverallTrend(recent: DecisionRecord[]): 'improving' | 'declining' | 'stable' { return 'stable'; }
  private calculateTrendStrength(recent: DecisionRecord[]): number { return 0.5; }
  private generateTrendPrediction(recent: DecisionRecord[]): string { return '预计保持稳定'; }
  private groupByDecisionType(history: DecisionRecord[]): Map<string, DecisionRecord[]> { return new Map(); }
  private calculateImprovementPotential(history: DecisionRecord[]): number { return 0.3; }
  private calculateAverageQualityScore(history: DecisionRecord[]): number { return 0.6; }
  private calculateQualityDistribution(history: DecisionRecord[]): any[] { return []; }
  private calculateQualityConsistency(history: DecisionRecord[]): number { return 0.7; }
  private calculateQualityImprovementRate(history: DecisionRecord[]): number { return 0.1; }
  private identifyQualityFactors(history: DecisionRecord[]): string[] { return ['决策速度', '信息完整性']; }
  private calculateAdaptabilityScore(history: DecisionRecord[]): number { return 0.6; }
  private analyzeContextSensitivity(history: DecisionRecord[]): number { return 0.5; }
  private calculateLearningRate(history: DecisionRecord[]): number { return 0.1; }
  private calculateFlexibilityScore(history: DecisionRecord[]): number { return 0.6; }
  private identifyAdaptationPatterns(history: DecisionRecord[]): string[] { return []; }
  private calculateConsistencyScore(history: DecisionRecord[]): number { return 0.7; }
  private identifyVariabilityFactors(history: DecisionRecord[]): string[] { return ['环境变化', '学习调整']; }
  private analyzeStabilityTrend(history: DecisionRecord[]): 'improving' | 'declining' | 'stable' { return 'stable'; }
  private calculatePredictabilityScore(history: DecisionRecord[]): number { return 0.6; }
  private generateImprovementRecommendations(
    basicStats: BasicStatistics,
    trends: TrendAnalysis,
    strengthsWeaknesses: StrengthsAndWeaknesses,
    decisionQuality: DecisionQualityAnalysis
  ): string[] {
    return ['继续监控表现', '定期优化参数', '扩展训练数据'];
  }
}

// 类型定义
export interface AnalyticsConfig {
  historySize: number;
  analysisWindowSize: number;
  performanceThreshold: number;
  patternDetectionMinSamples: number;
  metricsUpdateInterval: number;
  enableRealTimeAnalysis: boolean;
  enablePredictiveAnalysis: boolean;
}

export interface DecisionRecord {
  timestamp: number;
  aiId: string;
  decision: AIDecision;
  gameContext: GameContext;
  outcome?: DecisionOutcome;
  performance: DecisionPerformance;
}

export interface GameContext {
  phase: string;
  turn: number;
  playerCount: number;
  gameMode: string;
  season: string;
  marketTrends?: any;
}

export interface DecisionOutcome {
  success: boolean;
  actualBenefit: number;
  sideEffects?: string[];
}

export interface DecisionPerformance {
  confidence: number;
  executionTime: number;
  success: boolean;
  actualBenefit: number;
  predictedBenefit: number;
  riskLevel: number;
}

export interface AIPerformanceProfile {
  aiId: string;
  creationTime: number;
  totalAnalyses: number;
  bestPerformanceScore: number;
  worstPerformanceScore: number;
  averagePerformanceScore: number;
  performanceHistory: number[];
  lastAnalysisTime: number;
}

export interface PerformanceMetrics {
  totalDecisions: number;
  currentSuccessRate: number;
  currentConfidenceLevel: number;
  lastDecisionTime: number;
}

export interface BehaviorPattern {
  id: string;
  name: string;
  frequency: number;
  effectiveness: number;
  contexts: string[];
  description: string;
}

export interface PerformanceAnalysisReport {
  aiId: string;
  analysisTimestamp: number;
  sampleSize: number;
  timespan: { start: number; end: number; duration: number };
  basicStatistics: BasicStatistics;
  trends: TrendAnalysis;
  strengthsAndWeaknesses: StrengthsAndWeaknesses;
  decisionQuality: DecisionQualityAnalysis;
  adaptability: AdaptabilityAnalysis;
  consistency: ConsistencyAnalysis;
  recommendations: string[];
  overallScore: number;
  riskProfile: RiskProfile;
}

export interface BasicStatistics {
  totalDecisions: number;
  successRate: number;
  failureRate: number;
  averageConfidence: number;
  averageDecisionTime: number;
  confidenceRange: { min: number; max: number };
  decisionTimeRange: { min: number; max: number };
}

export interface TrendAnalysis {
  successRateTrend: 'improving' | 'declining' | 'stable';
  confidenceTrend: 'improving' | 'declining' | 'stable';
  decisionTimeTrend: 'improving' | 'declining' | 'stable';
  overallTrend: 'improving' | 'declining' | 'stable';
  trendStrength: number;
  prediction: string;
}

export interface StrengthsAndWeaknesses {
  strengths: string[];
  weaknesses: string[];
  improvementPotential: number;
}

export interface DecisionQualityAnalysis {
  averageQualityScore: number;
  qualityDistribution: any[];
  consistencyScore: number;
  improvementRate: number;
  qualityFactors: string[];
}

export interface AdaptabilityAnalysis {
  score: number;
  contextSensitivity: number;
  learningRate: number;
  flexibilityScore: number;
  adaptationPatterns: string[];
}

export interface ConsistencyAnalysis {
  score: number;
  variabilityFactors: string[];
  stabilityTrend: 'improving' | 'declining' | 'stable';
  predictabilityScore: number;
}

export interface RiskProfile {
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  riskFactors: string[];
  riskMitigation: string[];
}

export interface DecisionTypeAnalysis {
  actionType: string;
  sampleSize: number;
  successRate: number;
  averageConfidence: number;
  averageOutcome: number;
  timeDistribution: any[];
  contextFactors: string[];
  recommendations: string[];
}

export interface AIComparisonReport {
  comparisonTimestamp: number;
  participantCount: number;
  comparisons: AIPerformanceComparison[];
  ranking: (AIPerformanceComparison & { rank: number })[];
  insights: string[];
  recommendations: string[];
}

export interface AIPerformanceComparison {
  aiId: string;
  overallScore: number;
  successRate: number;
  averageConfidence: number;
  decisionSpeed: number;
  adaptabilityScore: number;
  consistencyScore: number;
  strengths: string[];
  weaknesses: string[];
}

export interface RealTimeMetrics {
  aiId: string;
  timestamp: number;
  currentSuccessRate: number;
  currentConfidenceLevel: number;
  recentDecisionCount: number;
  averageRecentDecisionTime: number;
  currentMood: string;
  performanceTrend: 'improving' | 'declining' | 'stable';
  alertLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface PerformanceAnomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: number;
  affectedMetrics: string[];
  suggestedActions: string[];
}

export interface OptimizationSuggestion {
  type: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: 'low' | 'medium' | 'high';
  estimatedEffort: 'low' | 'medium' | 'high';
}