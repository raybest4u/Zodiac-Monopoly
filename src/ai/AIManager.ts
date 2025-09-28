import type {
  AIState,
  AIPersonality, 
  AIOpponentConfig,
  AIDecision,
  DecisionContext,
  AIStatistics,
  DifficultyLevel,
  GamePhaseAnalysis,
  SituationAnalysis
} from '../types/ai';

import type { 
  GameState, 
  Player, 
  PlayerAction, 
  ZodiacSign 
} from '../types/game';

import { EventEmitter } from '../utils/index';
import { PersonalityFactory } from './PersonalityFactory';
import { DecisionEngine } from './DecisionEngine';
import { AIStateManager } from './AIStateManager';

/**
 * AI管理器 - 负责管理所有AI对手的行为、决策和状态
 */
export class AIManager {
  private aiStates: Map<string, AIState> = new Map();
  private personalityFactory: PersonalityFactory;
  private decisionEngine: DecisionEngine;
  private stateManager: AIStateManager;
  private eventEmitter: EventEmitter;
  private statistics: AIStatistics;
  
  // 配置参数
  private readonly config: AIManagerConfig;
  
  // 缓存和优化
  private decisionCache: Map<string, CachedDecision> = new Map();
  private lastAnalysis: SituationAnalysis | null = null;
  private analysisCache: Map<string, SituationAnalysis> = new Map();

  constructor(config: Partial<AIManagerConfig> = {}) {
    this.config = {
      maxCacheSize: 100,
      cacheExpiryTime: 30000, // 30秒
      enableLearning: true,
      enableAnalytics: true,
      decisionTimeout: 5000, // 5秒
      analysisDepth: 'medium',
      ...config
    };

    this.personalityFactory = new PersonalityFactory();
    this.decisionEngine = new DecisionEngine(this.config);
    this.stateManager = new AIStateManager();
    this.eventEmitter = new EventEmitter();
    
    this.statistics = {
      totalDecisions: 0,
      averageDecisionTime: 0,
      confidenceLevel: 0,
      successRate: 0,
      cacheHitRate: 0,
      learningProgress: 0
    };

    this.setupEventHandlers();
  }

  /**
   * 初始化AI管理器
   */
  async initialize(): Promise<void> {
    try {
      await this.decisionEngine.initialize();
      await this.stateManager.initialize();
      
      console.log('AIManager initialized successfully');
      this.eventEmitter.emit('ai_manager_initialized');
    } catch (error) {
      console.error('Failed to initialize AIManager:', error);
      throw error;
    }
  }

  /**
   * 创建AI对手
   */
  async createAIOpponent(config: AIOpponentConfig): Promise<string> {
    try {
      // 生成个性
      const personality = await this.personalityFactory.createPersonality(
        config.zodiac,
        config.difficulty,
        config.personalityOverrides
      );

      // 创建AI状态
      const aiState: AIState = await this.stateManager.createAIState(
        config.id,
        personality,
        config.difficulty
      );

      // 存储AI状态
      this.aiStates.set(config.id, aiState);

      console.log(`AI opponent created: ${config.name} (${config.zodiac}, ${config.difficulty})`);
      this.eventEmitter.emit('ai_opponent_created', { 
        id: config.id, 
        name: config.name, 
        zodiac: config.zodiac 
      });

      return config.id;
    } catch (error) {
      console.error('Failed to create AI opponent:', error);
      throw error;
    }
  }

  /**
   * 移除AI对手
   */
  async removeAIOpponent(aiId: string): Promise<void> {
    try {
      const aiState = this.aiStates.get(aiId);
      if (!aiState) {
        console.warn(`AI state not found for ${aiId}, using fallback decision`);
        return await this.createFallbackDecision(aiId, gameState);
      }

      // 清理状态
      await this.stateManager.removeAIState(aiId);
      this.aiStates.delete(aiId);

      // 清理缓存
      this.clearAICache(aiId);

      console.log(`AI opponent removed: ${aiId}`);
      this.eventEmitter.emit('ai_opponent_removed', { id: aiId });
    } catch (error) {
      console.error('Failed to remove AI opponent:', error);
      throw error;
    }
  }

  /**
   * 让AI做决策
   */
  async makeDecision(
    aiId: string, 
    gameState: GameState, 
    context?: DecisionContext
  ): Promise<AIDecision> {
    const startTime = Date.now();
    
    try {
      const aiState = this.aiStates.get(aiId);
      if (!aiState) {
        console.warn(`AI state not found for ${aiId}, using fallback decision`);
        return await this.createFallbackDecision(aiId, gameState);
      }

      // 检查决策缓存
      const cacheKey = this.generateCacheKey(aiId, gameState, context);
      const cachedDecision = this.getFromCache(cacheKey);
      if (cachedDecision) {
        this.statistics.cacheHitRate++;
        return cachedDecision.decision;
      }

      // 分析当前情况
      const analysis = await this.analyzeCurrentSituation(gameState, aiId);
      
      // 更新AI情绪和记忆
      await this.stateManager.updateEmotionalState(aiId, gameState, analysis);
      await this.stateManager.updateMemory(aiId, gameState);

      // 做决策
      const decision = await this.decisionEngine.makeDecision(
        aiState,
        gameState,
        analysis,
        context
      );

      // 缓存决策
      this.addToCache(cacheKey, decision, startTime);

      // 更新统计
      this.updateStatistics(decision, Date.now() - startTime);

      // 学习和适应
      if (this.config.enableLearning) {
        await this.stateManager.updateLearningData(aiId, decision, gameState);
      }

      console.log(`AI ${aiId} made decision: ${decision.action.type} (confidence: ${decision.confidence})`);
      
      this.eventEmitter.emit('ai_decision_made', { 
        aiId, 
        decision, 
        duration: Date.now() - startTime 
      });

      return decision;

    } catch (error) {
      console.error(`Failed to make AI decision for ${aiId}:`, error);
      
      // 返回默认决策
      const fallbackDecision = await this.createFallbackDecision(aiId, gameState);
      this.eventEmitter.emit('ai_decision_failed', { aiId, error: error.message });
      return fallbackDecision;
    }
  }

  /**
   * 批量让多个AI做决策
   */
  async makeMultipleDecisions(
    aiIds: string[], 
    gameState: GameState,
    context?: DecisionContext
  ): Promise<Map<string, AIDecision>> {
    const decisions = new Map<string, AIDecision>();
    
    // 并发执行决策
    const decisionPromises = aiIds.map(async (aiId) => {
      try {
        const decision = await this.makeDecision(aiId, gameState, context);
        return { aiId, decision };
      } catch (error) {
        console.error(`Decision failed for AI ${aiId}:`, error);
        const fallback = await this.createFallbackDecision(aiId, gameState);
        return { aiId, decision: fallback };
      }
    });

    const results = await Promise.all(decisionPromises);
    
    results.forEach(({ aiId, decision }) => {
      decisions.set(aiId, decision);
    });

    this.eventEmitter.emit('multiple_decisions_made', { 
      count: decisions.size,
      aiIds: Array.from(decisions.keys())
    });

    return decisions;
  }

  /**
   * 获取AI状态
   */
  getAIState(aiId: string): AIState | undefined {
    return this.aiStates.get(aiId);
  }

  /**
   * 获取所有AI状态
   */
  getAllAIStates(): Map<string, AIState> {
    return new Map(this.aiStates);
  }

  /**
   * 更新AI状态
   */
  async updateAIState(aiId: string, updates: Partial<AIState>): Promise<void> {
    const aiState = this.aiStates.get(aiId);
    if (!aiState) {
      throw new Error(`AI opponent not found: ${aiId}`);
    }

    const updatedState = { ...aiState, ...updates };
    this.aiStates.set(aiId, updatedState);
    
    await this.stateManager.saveAIState(aiId, updatedState);
    
    this.eventEmitter.emit('ai_state_updated', { aiId, updates });
  }

  /**
   * 获取AI统计数据
   */
  getStatistics(): AIStatistics {
    return { ...this.statistics };
  }

  /**
   * 重置AI统计数据
   */
  resetStatistics(): void {
    this.statistics = {
      totalDecisions: 0,
      averageDecisionTime: 0,
      confidenceLevel: 0,
      successRate: 0,
      cacheHitRate: 0,
      learningProgress: 0
    };

    this.eventEmitter.emit('statistics_reset');
  }

  /**
   * 获取事件发射器
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      // 保存所有AI状态
      const savePromises = Array.from(this.aiStates.entries()).map(
        ([aiId, aiState]) => this.stateManager.saveAIState(aiId, aiState)
      );
      
      await Promise.all(savePromises);

      // 清理缓存
      this.decisionCache.clear();
      this.analysisCache.clear();

      // 清理组件
      await this.decisionEngine.cleanup();
      await this.stateManager.cleanup();

      console.log('AIManager cleaned up successfully');
      this.eventEmitter.emit('ai_manager_cleanup');
    } catch (error) {
      console.error('Failed to cleanup AIManager:', error);
      throw error;
    }
  }

  // 私有方法

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听游戏事件，更新AI状态
    this.eventEmitter.on('game_event', async (event) => {
      try {
        await this.handleGameEvent(event);
      } catch (error) {
        console.error('Error handling game event:', error);
      }
    });

    // 定期清理缓存
    setInterval(() => {
      this.cleanupCache();
    }, this.config.cacheExpiryTime);
  }

  /**
   * 分析当前游戏情况
   */
  private async analyzeCurrentSituation(
    gameState: GameState, 
    aiId: string
  ): Promise<SituationAnalysis> {
    const cacheKey = `analysis_${gameState.gameId}_${gameState.turn}_${aiId}`;
    
    // 检查缓存
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const analysis = await this.decisionEngine.analyzeSituation(gameState, aiId);
      
      // 缓存分析结果
      this.analysisCache.set(cacheKey, analysis);
      
      // 限制缓存大小
      if (this.analysisCache.size > this.config.maxCacheSize) {
        const firstKey = this.analysisCache.keys().next().value;
        this.analysisCache.delete(firstKey);
      }

      return analysis;
    } catch (error) {
      console.error('Failed to analyze situation:', error);
      return this.createDefaultAnalysis(gameState, aiId);
    }
  }

  /**
   * 创建默认分析
   */
  private createDefaultAnalysis(gameState: GameState, aiId: string): SituationAnalysis {
    const player = gameState?.players?.find(p => p.id === aiId);
    
    return {
      gamePhase: {
        phase: gameState.turn < 20 ? 'early' : gameState.turn < 80 ? 'middle' : 'late',
        turnsRemaining: Math.max(0, 100 - gameState.turn),
        winProbability: 0.25, // 默认概率
        strategicFocus: ['wealth_accumulation']
      },
      playerPositions: (gameState?.players || []).map(p => ({
        playerId: p.id,
        rankPosition: this.calculateRankPosition(p, gameState.players),
        threat: 0.5,
        alliance: 0.0,
        predictedMoves: []
      })),
      economicSituation: {
        cashFlow: player?.money || 0,
        netWorth: this.calculateNetWorth(player, gameState),
        liquidityRatio: 0.5,
        propertyValue: this.calculatePropertyValue(player, gameState),
        moneyRank: this.calculateMoneyRank(player, gameState?.players || []),
        propertyRank: this.calculatePropertyRank(player, gameState?.players || [])
      },
      threats: [],
      opportunities: []
    };
  }

  /**
   * 创建回退决策
   */
  private async createFallbackDecision(
    aiId: string, 
    gameState: GameState
  ): Promise<AIDecision> {
    const player = gameState?.players?.find(p => p.id === aiId);
    
    return {
      action: {
        type: 'end_turn',
        playerId: aiId,
        parameters: {}
      },
      confidence: 0.1,
      reasoning: 'Fallback decision due to error',
      alternatives: [],
      analysis: this.createDefaultAnalysis(gameState, aiId),
      strategy: await this.createDefaultStrategy(),
      timestamp: Date.now()
    };
  }

  /**
   * 创建默认策略
   */
  private async createDefaultStrategy() {
    return {
      name: 'Conservative',
      description: 'Safe and conservative strategy',
      focus: 'wealth_accumulation' as const,
      timeHorizon: 'medium' as const,
      riskLevel: 'conservative' as const,
      weights: {
        moneyAccumulation: 0.8,
        propertyAcquisition: 0.6,
        playerBlockade: 0.2,
        riskAvoidance: 0.9,
        opportunismWeight: 0.3
      }
    };
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(
    aiId: string, 
    gameState: GameState, 
    context?: DecisionContext
  ): string {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${aiId}_${gameState.gameId}_${gameState.turn}_${gameState.phase}_${contextStr}`;
  }

  /**
   * 从缓存获取决策
   */
  private getFromCache(key: string): CachedDecision | null {
    const cached = this.decisionCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheExpiryTime) {
      this.decisionCache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * 添加到缓存
   */
  private addToCache(key: string, decision: AIDecision, timestamp: number): void {
    this.decisionCache.set(key, { decision, timestamp });

    // 限制缓存大小
    if (this.decisionCache.size > this.config.maxCacheSize) {
      const firstKey = this.decisionCache.keys().next().value;
      this.decisionCache.delete(firstKey);
    }
  }

  /**
   * 清理AI相关缓存
   */
  private clearAICache(aiId: string): void {
    for (const [key, _] of this.decisionCache) {
      if (key.startsWith(aiId)) {
        this.decisionCache.delete(key);
      }
    }

    for (const [key, _] of this.analysisCache) {
      if (key.includes(aiId)) {
        this.analysisCache.delete(key);
      }
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.decisionCache) {
      if (now - cached.timestamp > this.config.cacheExpiryTime) {
        this.decisionCache.delete(key);
      }
    }

    for (const [key, _] of this.analysisCache) {
      // 分析缓存有较短的有效期
      this.analysisCache.delete(key);
    }
  }

  /**
   * 更新统计数据
   */
  private updateStatistics(decision: AIDecision, duration: number): void {
    this.statistics.totalDecisions++;
    
    // 更新平均决策时间
    const totalTime = this.statistics.averageDecisionTime * (this.statistics.totalDecisions - 1) + duration;
    this.statistics.averageDecisionTime = totalTime / this.statistics.totalDecisions;
    
    // 更新置信度
    const totalConfidence = this.statistics.confidenceLevel * (this.statistics.totalDecisions - 1) + decision.confidence;
    this.statistics.confidenceLevel = totalConfidence / this.statistics.totalDecisions;
  }

  /**
   * 处理游戏事件
   */
  private async handleGameEvent(event: any): Promise<void> {
    // 根据游戏事件更新AI状态
    for (const [aiId, aiState] of this.aiStates) {
      await this.stateManager.processGameEvent(aiId, event);
    }
  }

  /**
   * 辅助计算方法
   */
  private calculateRankPosition(player: Player, allPlayers: Player[]): number {
    const sorted = allPlayers
      .slice()
      .sort((a, b) => this.calculateNetWorth(b, { players: allPlayers } as GameState) - 
                      this.calculateNetWorth(a, { players: allPlayers } as GameState));
    
    return sorted.findIndex(p => p.id === player.id) + 1;
  }

  private calculateNetWorth(player: Player | undefined, gameState: GameState): number {
    if (!player) return 0;
    return player.money + this.calculatePropertyValue(player, gameState);
  }

  private calculatePropertyValue(player: Player | undefined, gameState: GameState): number {
    if (!player) return 0;
    // 简单估算 - 实际实现需要根据房产系统计算
    return player.properties.length * 1000;
  }

  private calculateMoneyRank(player: Player | undefined, allPlayers: Player[]): number {
    if (!player) return allPlayers.length;
    const sorted = allPlayers.slice().sort((a, b) => b.money - a.money);
    return sorted.findIndex(p => p.id === player.id) + 1;
  }

  private calculatePropertyRank(player: Player | undefined, allPlayers: Player[]): number {
    if (!player) return allPlayers.length;
    const sorted = allPlayers.slice().sort((a, b) => b.properties.length - a.properties.length);
    return sorted.findIndex(p => p.id === player.id) + 1;
  }
}

// 配置接口
interface AIManagerConfig {
  maxCacheSize: number;
  cacheExpiryTime: number;
  enableLearning: boolean;
  enableAnalytics: boolean;
  decisionTimeout: number;
  analysisDepth: 'shallow' | 'medium' | 'deep';
}

// 缓存接口
interface CachedDecision {
  decision: AIDecision;
  timestamp: number;
}