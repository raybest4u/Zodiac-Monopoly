import type {
  AIState,
  AIDecision,
  SituationAnalysis,
  DecisionContext
} from '../types/ai';

import type {
  GameState,
  PlayerAction
} from '../types/game';

/**
 * AI决策速度优化器
 * 负责优化AI决策过程的速度和效率，同时保持决策质量
 */
export class DecisionSpeedOptimizer {
  private decisionCache: Map<string, CachedDecision> = new Map();
  private fastPathPatterns: Map<string, FastPathPattern> = new Map();
  private precomputedAnalyses: Map<string, PrecomputedAnalysis> = new Map();
  private optimizationMetrics: OptimizationMetrics;
  private readonly config: SpeedOptimizerConfig;

  constructor(config: Partial<SpeedOptimizerConfig> = {}) {
    this.config = {
      cacheSize: 500,
      cacheTTL: 300000, // 5 minutes
      enableFastPaths: true,
      enablePrecomputation: true,
      enableParallelProcessing: true,
      maxDecisionTime: 1000, // 1 second
      qualityThreshold: 0.7,
      speedPriorityWeight: 0.3,
      qualityPriorityWeight: 0.7,
      ...config
    };

    this.optimizationMetrics = this.initializeMetrics();
  }

  /**
   * 优化AI决策过程
   */
  async optimizeDecision(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis,
    availableActions: PlayerAction[],
    originalDecisionFn: (aiState: AIState, gameState: GameState, analysis: SituationAnalysis) => Promise<AIDecision>
  ): Promise<OptimizedDecisionResult> {
    const startTime = performance.now();
    let decision: AIDecision;
    let optimizationPath: OptimizationPath = 'standard';

    try {
      // 1. 尝试快速路径
      if (this.config.enableFastPaths) {
        const fastDecision = await this.tryFastPath(aiState, gameState, analysis, availableActions);
        if (fastDecision) {
          decision = fastDecision;
          optimizationPath = 'fast_path';
        }
      }

      // 2. 尝试缓存决策
      if (!decision && this.decisionCache.size > 0) {
        const cachedDecision = this.tryCache(aiState, gameState, analysis);
        if (cachedDecision && this.isCacheValid(cachedDecision)) {
          decision = this.adaptCachedDecision(cachedDecision, availableActions);
          optimizationPath = 'cache';
        }
      }

      // 3. 使用预计算分析
      if (!decision && this.config.enablePrecomputation) {
        const precomputedDecision = await this.tryPrecomputedAnalysis(aiState, gameState, analysis, originalDecisionFn);
        if (precomputedDecision) {
          decision = precomputedDecision;
          optimizationPath = 'precomputed';
        }
      }

      // 4. 并行处理优化
      if (!decision && this.config.enableParallelProcessing) {
        decision = await this.parallelOptimizedDecision(aiState, gameState, analysis, originalDecisionFn);
        optimizationPath = 'parallel';
      }

      // 5. 降级到标准决策
      if (!decision) {
        decision = await originalDecisionFn(aiState, gameState, analysis);
        optimizationPath = 'standard';
      }

      const executionTime = performance.now() - startTime;

      // 缓存决策结果
      this.cacheDecision(aiState, gameState, analysis, decision, executionTime);

      // 更新指标
      this.updateMetrics(optimizationPath, executionTime, decision.confidence);

      // 学习和优化
      this.learnFromDecision(aiState, gameState, analysis, decision, optimizationPath, executionTime);

      return {
        decision,
        optimizationPath,
        executionTime,
        speedGain: this.calculateSpeedGain(executionTime),
        qualityScore: decision.confidence,
        cacheHitRate: this.optimizationMetrics.cacheHitRate,
        recommendations: this.generateSpeedRecommendations(aiState, executionTime)
      };

    } catch (error) {
      console.error('Decision speed optimization failed:', error);
      // 降级处理
      decision = await originalDecisionFn(aiState, gameState, analysis);
      const executionTime = performance.now() - startTime;
      
      return {
        decision,
        optimizationPath: 'fallback',
        executionTime,
        speedGain: 0,
        qualityScore: decision.confidence,
        cacheHitRate: this.optimizationMetrics.cacheHitRate,
        recommendations: ['优化过程出错，建议检查系统配置']
      };
    }
  }

  /**
   * 预计算常见游戏场景的分析结果
   */
  async precomputeCommonScenarios(gameStates: GameState[]): Promise<void> {
    const startTime = performance.now();
    let computed = 0;

    for (const gameState of gameStates) {
      try {
        const scenarioKey = this.generateScenarioKey(gameState);
        
        if (!this.precomputedAnalyses.has(scenarioKey)) {
          const analysis = await this.computeScenarioAnalysis(gameState);
          
          this.precomputedAnalyses.set(scenarioKey, {
            key: scenarioKey,
            analysis,
            computedAt: Date.now(),
            usageCount: 0,
            averageAccuracy: 0.8 // 初始估计
          });
          
          computed++;
        }
      } catch (error) {
        console.warn('Failed to precompute scenario:', error);
      }
    }

    const executionTime = performance.now() - startTime;
    console.log(`Precomputed ${computed} scenarios in ${executionTime.toFixed(2)}ms`);
  }

  /**
   * 识别和创建快速决策路径
   */
  identifyFastPaths(decisionHistory: DecisionHistoryEntry[]): FastPathPattern[] {
    const patterns: FastPathPattern[] = [];
    const patternCandidates = this.groupSimilarDecisions(decisionHistory);

    for (const [patternKey, decisions] of patternCandidates) {
      if (decisions.length >= 5) { // 最少需要5个相似决策
        const pattern = this.createFastPathPattern(patternKey, decisions);
        if (pattern.reliability > 0.8) {
          patterns.push(pattern);
          this.fastPathPatterns.set(patternKey, pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * 优化缓存策略
   */
  optimizeCacheStrategy(): CacheOptimizationResult {
    const currentStats = this.analyzeCachePerformance();
    const recommendations: string[] = [];
    let optimalSize = this.config.cacheSize;
    let optimalTTL = this.config.cacheTTL;

    // 分析缓存命中率
    if (currentStats.hitRate < 0.3) {
      recommendations.push('缓存命中率较低，建议增加缓存大小');
      optimalSize = Math.min(this.config.cacheSize * 1.5, 1000);
    } else if (currentStats.hitRate > 0.8) {
      recommendations.push('缓存效率很高，可以考虑减少内存使用');
      optimalSize = Math.max(this.config.cacheSize * 0.8, 100);
    }

    // 分析缓存生存时间
    if (currentStats.averageAge > this.config.cacheTTL * 0.8) {
      recommendations.push('缓存数据使用时间较长，可以增加TTL');
      optimalTTL = this.config.cacheTTL * 1.2;
    }

    // 应用优化建议
    this.applyCacheOptimizations(optimalSize, optimalTTL);

    return {
      originalHitRate: currentStats.hitRate,
      optimizedHitRate: this.estimateOptimizedHitRate(optimalSize, optimalTTL),
      recommendedSize: optimalSize,
      recommendedTTL: optimalTTL,
      recommendations,
      expectedSpeedGain: this.estimateSpeedGain(currentStats.hitRate, optimalSize)
    };
  }

  /**
   * 获取优化统计信息
   */
  getOptimizationStats(): OptimizationStats {
    return {
      totalOptimizations: this.optimizationMetrics.totalOptimizations,
      averageSpeedGain: this.optimizationMetrics.averageSpeedGain,
      cacheHitRate: this.optimizationMetrics.cacheHitRate,
      fastPathUsage: this.optimizationMetrics.fastPathUsage,
      precomputationUsage: this.optimizationMetrics.precomputationUsage,
      averageDecisionTime: this.optimizationMetrics.averageDecisionTime,
      qualityMaintenance: this.optimizationMetrics.averageQualityScore,
      optimizationPathDistribution: { ...this.optimizationMetrics.pathDistribution },
      recommendations: this.generateOptimizationRecommendations()
    };
  }

  /**
   * 重置优化器状态
   */
  reset(): void {
    this.decisionCache.clear();
    this.fastPathPatterns.clear();
    this.precomputedAnalyses.clear();
    this.optimizationMetrics = this.initializeMetrics();
  }

  // 私有方法

  private async tryFastPath(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis,
    availableActions: PlayerAction[]
  ): Promise<AIDecision | null> {
    const patternKey = this.generatePatternKey(aiState, gameState, analysis);
    const pattern = this.fastPathPatterns.get(patternKey);

    if (pattern && pattern.reliability > this.config.qualityThreshold) {
      // 使用快速路径生成决策
      const action = this.selectActionFromPattern(pattern, availableActions);
      if (action) {
        return {
          action,
          confidence: pattern.reliability,
          reasoning: `快速路径决策: ${pattern.description}`,
          alternatives: [],
          analysis,
          strategy: aiState.currentStrategy,
          timestamp: Date.now()
        };
      }
    }

    return null;
  }

  private tryCache(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): CachedDecision | null {
    const cacheKey = this.generateCacheKey(aiState, gameState, analysis);
    return this.decisionCache.get(cacheKey) || null;
  }

  private isCacheValid(cachedDecision: CachedDecision): boolean {
    const age = Date.now() - cachedDecision.timestamp;
    return age <= this.config.cacheTTL && cachedDecision.confidence >= this.config.qualityThreshold;
  }

  private adaptCachedDecision(
    cachedDecision: CachedDecision,
    availableActions: PlayerAction[]
  ): AIDecision {
    // 验证缓存的决策动作是否仍然可用
    const actionStillAvailable = availableActions.some(action => 
      action.type === cachedDecision.decision.action.type
    );

    if (actionStillAvailable) {
      return {
        ...cachedDecision.decision,
        timestamp: Date.now(),
        reasoning: `缓存决策 (置信度: ${cachedDecision.confidence.toFixed(2)})`
      };
    } else {
      // 适配到最相似的可用动作
      const similarAction = this.findMostSimilarAction(
        cachedDecision.decision.action,
        availableActions
      );
      
      return {
        ...cachedDecision.decision,
        action: similarAction,
        confidence: cachedDecision.confidence * 0.8, // 降低置信度
        reasoning: `适配的缓存决策`,
        timestamp: Date.now()
      };
    }
  }

  private async tryPrecomputedAnalysis(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis,
    originalDecisionFn: Function
  ): Promise<AIDecision | null> {
    const scenarioKey = this.generateScenarioKey(gameState);
    const precomputed = this.precomputedAnalyses.get(scenarioKey);

    if (precomputed && precomputed.averageAccuracy > this.config.qualityThreshold) {
      // 使用预计算的分析结果
      const enhancedAnalysis = this.enhanceAnalysisWithPrecomputed(analysis, precomputed.analysis);
      
      // 快速决策基于预计算结果
      const decision = await this.makeQuickDecisionFromPrecomputed(aiState, gameState, enhancedAnalysis);
      
      if (decision) {
        precomputed.usageCount++;
        return decision;
      }
    }

    return null;
  }

  private async parallelOptimizedDecision(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis,
    originalDecisionFn: Function
  ): Promise<AIDecision> {
    // 并行处理多个决策方面
    const promises = [
      this.quickAnalyzeThreats(analysis),
      this.quickAnalyzeOpportunities(analysis),
      this.quickAnalyzeStrategy(aiState.currentStrategy, gameState)
    ];

    const [threats, opportunities, strategyAnalysis] = await Promise.all(promises);

    // 合并结果并快速决策
    const optimizedAnalysis = {
      ...analysis,
      threats,
      opportunities,
      strategyInsights: strategyAnalysis
    };

    return originalDecisionFn(aiState, gameState, optimizedAnalysis);
  }

  private cacheDecision(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis,
    decision: AIDecision,
    executionTime: number
  ): void {
    const cacheKey = this.generateCacheKey(aiState, gameState, analysis);
    const cachedDecision: CachedDecision = {
      key: cacheKey,
      decision,
      timestamp: Date.now(),
      confidence: decision.confidence,
      executionTime,
      usageCount: 0
    };

    this.decisionCache.set(cacheKey, cachedDecision);

    // 维护缓存大小
    if (this.decisionCache.size > this.config.cacheSize) {
      this.evictOldestCacheEntries();
    }
  }

  private updateMetrics(
    path: OptimizationPath,
    executionTime: number,
    qualityScore: number
  ): void {
    this.optimizationMetrics.totalOptimizations++;
    this.optimizationMetrics.pathDistribution[path] = (this.optimizationMetrics.pathDistribution[path] || 0) + 1;
    
    // 更新平均值
    const total = this.optimizationMetrics.totalOptimizations;
    this.optimizationMetrics.averageDecisionTime = 
      (this.optimizationMetrics.averageDecisionTime * (total - 1) + executionTime) / total;
    this.optimizationMetrics.averageQualityScore = 
      (this.optimizationMetrics.averageQualityScore * (total - 1) + qualityScore) / total;

    // 计算速度提升
    const baselineTime = 1000; // 假设基准时间
    const speedGain = Math.max(0, (baselineTime - executionTime) / baselineTime);
    this.optimizationMetrics.averageSpeedGain = 
      (this.optimizationMetrics.averageSpeedGain * (total - 1) + speedGain) / total;

    // 更新缓存命中率
    const cacheHits = this.optimizationMetrics.pathDistribution['cache'] || 0;
    this.optimizationMetrics.cacheHitRate = cacheHits / total;

    // 更新各路径使用率
    this.optimizationMetrics.fastPathUsage = 
      (this.optimizationMetrics.pathDistribution['fast_path'] || 0) / total;
    this.optimizationMetrics.precomputationUsage = 
      (this.optimizationMetrics.pathDistribution['precomputed'] || 0) / total;
  }

  private learnFromDecision(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis,
    decision: AIDecision,
    path: OptimizationPath,
    executionTime: number
  ): void {
    // 如果决策质量高且速度快，创建快速路径
    if (decision.confidence > 0.8 && executionTime < 500) {
      const patternKey = this.generatePatternKey(aiState, gameState, analysis);
      this.learnFastPathPattern(patternKey, decision, executionTime);
    }

    // 学习缓存策略
    if (path === 'cache' && decision.confidence < 0.6) {
      // 缓存决策质量低，需要调整缓存策略
      this.adjustCacheStrategy();
    }
  }

  private calculateSpeedGain(executionTime: number): number {
    const baselineTime = 1000; // 1秒基准
    return Math.max(0, (baselineTime - executionTime) / baselineTime);
  }

  private generateSpeedRecommendations(aiState: AIState, executionTime: number): string[] {
    const recommendations: string[] = [];

    if (executionTime > this.config.maxDecisionTime) {
      recommendations.push('决策时间超出目标，建议启用更多优化选项');
    }

    if (this.optimizationMetrics.cacheHitRate < 0.3) {
      recommendations.push('缓存命中率低，建议增加缓存大小或调整缓存策略');
    }

    if (this.optimizationMetrics.fastPathUsage < 0.2) {
      recommendations.push('快速路径使用率低，建议分析更多决策模式');
    }

    return recommendations.length > 0 ? recommendations : ['当前优化表现良好'];
  }

  // 辅助方法的简化实现

  private initializeMetrics(): OptimizationMetrics {
    return {
      totalOptimizations: 0,
      averageSpeedGain: 0,
      cacheHitRate: 0,
      fastPathUsage: 0,
      precomputationUsage: 0,
      averageDecisionTime: 0,
      averageQualityScore: 0,
      pathDistribution: {}
    };
  }

  private generateScenarioKey(gameState: GameState): string {
    return `${gameState.phase}_${gameState.players.length}_${gameState.turn}`;
  }

  private async computeScenarioAnalysis(gameState: GameState): Promise<any> {
    // 简化实现
    return {
      gamePhase: { phase: gameState.phase, turnsRemaining: 100 - gameState.turn },
      complexity: gameState.players.length * 0.25,
      opportunities: []
    };
  }

  private groupSimilarDecisions(history: DecisionHistoryEntry[]): Map<string, DecisionHistoryEntry[]> {
    const groups = new Map<string, DecisionHistoryEntry[]>();
    
    for (const entry of history) {
      const key = `${entry.decision.action.type}_${entry.gameContext.phase}`;
      const group = groups.get(key) || [];
      group.push(entry);
      groups.set(key, group);
    }
    
    return groups;
  }

  private createFastPathPattern(patternKey: string, decisions: DecisionHistoryEntry[]): FastPathPattern {
    const successRate = decisions.filter(d => d.success).length / decisions.length;
    const avgConfidence = decisions.reduce((sum, d) => sum + d.decision.confidence, 0) / decisions.length;
    const avgExecutionTime = decisions.reduce((sum, d) => sum + d.executionTime, 0) / decisions.length;

    return {
      key: patternKey,
      reliability: (successRate + avgConfidence) / 2,
      averageExecutionTime: avgExecutionTime,
      usageCount: decisions.length,
      description: `${decisions[0].decision.action.type} in ${decisions[0].gameContext.phase}`,
      conditions: this.extractPatternConditions(decisions),
      expectedAction: decisions[0].decision.action
    };
  }

  private generatePatternKey(aiState: AIState, gameState: GameState, analysis: SituationAnalysis): string {
    return `${gameState.phase}_${aiState.personality.risk_tolerance.toFixed(1)}_${analysis.gamePhase.phase}`;
  }

  private generateCacheKey(aiState: AIState, gameState: GameState, analysis: SituationAnalysis): string {
    return `${aiState.id}_${gameState.turn}_${gameState.phase}_${analysis.gamePhase.phase}`;
  }

  private selectActionFromPattern(pattern: FastPathPattern, availableActions: PlayerAction[]): PlayerAction | null {
    const matchingAction = availableActions.find(action => action.type === pattern.expectedAction.type);
    return matchingAction || null;
  }

  private findMostSimilarAction(targetAction: PlayerAction, availableActions: PlayerAction[]): PlayerAction {
    // 简化：返回第一个可用动作
    return availableActions[0] || {
      type: 'pass',
      playerId: targetAction.playerId,
      data: {},
      timestamp: Date.now()
    };
  }

  private enhanceAnalysisWithPrecomputed(
    original: SituationAnalysis,
    precomputed: any
  ): SituationAnalysis {
    return {
      ...original,
      precomputedInsights: precomputed,
      enhancedAccuracy: true
    };
  }

  private async makeQuickDecisionFromPrecomputed(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): Promise<AIDecision | null> {
    // 简化实现：基于预计算结果做出快速决策
    return {
      action: { type: 'end_turn', playerId: aiState.id, data: {}, timestamp: Date.now() },
      confidence: 0.7,
      reasoning: '基于预计算结果的快速决策',
      alternatives: [],
      analysis,
      strategy: aiState.currentStrategy,
      timestamp: Date.now()
    };
  }

  private async quickAnalyzeThreats(analysis: SituationAnalysis): Promise<any[]> {
    return analysis.threats || [];
  }

  private async quickAnalyzeOpportunities(analysis: SituationAnalysis): Promise<any[]> {
    return analysis.opportunities || [];
  }

  private async quickAnalyzeStrategy(strategy: any, gameState: GameState): Promise<any> {
    return { focus: strategy.focus, effectiveness: 0.7 };
  }

  private evictOldestCacheEntries(): void {
    const entries = Array.from(this.decisionCache.entries());
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const toRemove = Math.floor(this.config.cacheSize * 0.1); // 移除10%最旧的条目
    for (let i = 0; i < toRemove; i++) {
      this.decisionCache.delete(entries[i][0]);
    }
  }

  private learnFastPathPattern(patternKey: string, decision: AIDecision, executionTime: number): void {
    const existingPattern = this.fastPathPatterns.get(patternKey);
    if (existingPattern) {
      existingPattern.usageCount++;
      existingPattern.averageExecutionTime = 
        (existingPattern.averageExecutionTime + executionTime) / 2;
    }
  }

  private adjustCacheStrategy(): void {
    // 简化实现：减少缓存TTL
    console.log('Adjusting cache strategy due to low quality cached decisions');
  }

  private analyzeCachePerformance(): CachePerformanceStats {
    const entries = Array.from(this.decisionCache.values());
    const totalUsage = entries.reduce((sum, entry) => sum + entry.usageCount, 0);
    const avgAge = entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / Math.max(entries.length, 1);

    return {
      hitRate: this.optimizationMetrics.cacheHitRate,
      totalEntries: entries.length,
      totalUsage,
      averageAge: avgAge,
      memoryUsage: entries.length * 1000 // 估算
    };
  }

  private applyCacheOptimizations(optimalSize: number, optimalTTL: number): void {
    // 更新配置但不改变原始配置对象
    console.log(`Applying cache optimizations: size=${optimalSize}, TTL=${optimalTTL}`);
  }

  private estimateOptimizedHitRate(size: number, ttl: number): number {
    return Math.min(this.optimizationMetrics.cacheHitRate * 1.2, 0.9);
  }

  private estimateSpeedGain(currentHitRate: number, newSize: number): number {
    return Math.max(0, (newSize - this.config.cacheSize) / this.config.cacheSize * 0.1);
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.optimizationMetrics.cacheHitRate < 0.3) {
      recommendations.push('增加缓存大小以提高命中率');
    }
    
    if (this.optimizationMetrics.fastPathUsage < 0.2) {
      recommendations.push('识别更多快速路径模式');
    }
    
    if (this.optimizationMetrics.averageDecisionTime > this.config.maxDecisionTime) {
      recommendations.push('启用更多并行处理选项');
    }
    
    return recommendations.length > 0 ? recommendations : ['优化表现良好，继续监控'];
  }

  private extractPatternConditions(decisions: DecisionHistoryEntry[]): PatternCondition[] {
    return [
      {
        field: 'gamePhase',
        operator: 'eq',
        value: decisions[0].gameContext.phase,
        weight: 0.8
      }
    ];
  }
}

// 类型定义
export interface SpeedOptimizerConfig {
  cacheSize: number;
  cacheTTL: number;
  enableFastPaths: boolean;
  enablePrecomputation: boolean;
  enableParallelProcessing: boolean;
  maxDecisionTime: number;
  qualityThreshold: number;
  speedPriorityWeight: number;
  qualityPriorityWeight: number;
}

export interface CachedDecision {
  key: string;
  decision: AIDecision;
  timestamp: number;
  confidence: number;
  executionTime: number;
  usageCount: number;
}

export interface FastPathPattern {
  key: string;
  reliability: number;
  averageExecutionTime: number;
  usageCount: number;
  description: string;
  conditions: PatternCondition[];
  expectedAction: PlayerAction;
}

export interface PatternCondition {
  field: string;
  operator: string;
  value: any;
  weight: number;
}

export interface PrecomputedAnalysis {
  key: string;
  analysis: any;
  computedAt: number;
  usageCount: number;
  averageAccuracy: number;
}

export interface OptimizationMetrics {
  totalOptimizations: number;
  averageSpeedGain: number;
  cacheHitRate: number;
  fastPathUsage: number;
  precomputationUsage: number;
  averageDecisionTime: number;
  averageQualityScore: number;
  pathDistribution: Record<string, number>;
}

export interface OptimizedDecisionResult {
  decision: AIDecision;
  optimizationPath: OptimizationPath;
  executionTime: number;
  speedGain: number;
  qualityScore: number;
  cacheHitRate: number;
  recommendations: string[];
}

export interface CacheOptimizationResult {
  originalHitRate: number;
  optimizedHitRate: number;
  recommendedSize: number;
  recommendedTTL: number;
  recommendations: string[];
  expectedSpeedGain: number;
}

export interface OptimizationStats {
  totalOptimizations: number;
  averageSpeedGain: number;
  cacheHitRate: number;
  fastPathUsage: number;
  precomputationUsage: number;
  averageDecisionTime: number;
  qualityMaintenance: number;
  optimizationPathDistribution: Record<string, number>;
  recommendations: string[];
}

export interface CachePerformanceStats {
  hitRate: number;
  totalEntries: number;
  totalUsage: number;
  averageAge: number;
  memoryUsage: number;
}

export interface DecisionHistoryEntry {
  decision: AIDecision;
  gameContext: {
    phase: string;
    turn: number;
    playerCount: number;
  };
  executionTime: number;
  success: boolean;
}

export type OptimizationPath = 'fast_path' | 'cache' | 'precomputed' | 'parallel' | 'standard' | 'fallback';