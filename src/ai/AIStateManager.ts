import type {
  AIState,
  AIPersonality,
  EmotionalState,
  AIMemory,
  LearningData,
  MemoryEvent,
  PlayerRelationship,
  StrategicKnowledge,
  Experience,
  AIDecision,
  SituationAnalysis,
  DifficultyLevel,
  AIStrategy,
  BehaviourChange,
  EmotionalMood
} from '../types/ai';

import type {
  GameState,
  GameEvent
} from '../types/game';

import { EventEmitter } from '../utils/index';

/**
 * AI状态管理器 - 负责管理AI的状态、记忆、学习和情绪
 */
export class AIStateManager {
  private aiStates: Map<string, AIState> = new Map();
  private memoryCache: Map<string, AIMemory> = new Map();
  private learningCache: Map<string, LearningData> = new Map();
  private eventEmitter: EventEmitter;

  // 配置参数
  private readonly config: AIStateManagerConfig;

  constructor(config: Partial<AIStateManagerConfig> = {}) {
    this.config = {
      maxMemoryEvents: 50,
      memoryDecayRate: 0.95,
      learningRate: 0.1,
      emotionDecayRate: 0.9,
      relationshipDecayRate: 0.98,
      autoSaveInterval: 30000, // 30秒
      ...config
    };

    this.eventEmitter = new EventEmitter();
    this.startPeriodicTasks();
  }

  /**
   * 初始化状态管理器
   */
  async initialize(): Promise<void> {
    try {
      console.log('AIStateManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AIStateManager:', error);
      throw error;
    }
  }

  /**
   * 创建AI状态
   */
  async createAIState(
    aiId: string,
    personality: AIPersonality,
    difficulty: DifficultyLevel
  ): Promise<AIState> {
    try {
      // 创建初始策略
      const strategy = await this.createInitialStrategy(personality, difficulty);
      
      // 创建初始情绪状态
      const emotionalState = this.createInitialEmotionalState(personality);
      
      // 创建初始记忆
      const memory = this.createInitialMemory();
      
      // 创建初始学习数据
      const learningData = this.createInitialLearningData();

      const aiState: AIState = {
        id: aiId,
        personality,
        currentStrategy: strategy,
        emotionalState,
        memory,
        learningData
      };

      // 存储状态
      this.aiStates.set(aiId, aiState);
      this.memoryCache.set(aiId, memory);
      this.learningCache.set(aiId, learningData);

      console.log(`AI state created for ${aiId}`);
      this.eventEmitter.emit('ai_state_created', { aiId });

      return aiState;
    } catch (error) {
      console.error(`Failed to create AI state for ${aiId}:`, error);
      throw error;
    }
  }

  /**
   * 移除AI状态
   */
  async removeAIState(aiId: string): Promise<void> {
    try {
      // 保存最终状态
      await this.saveAIState(aiId, this.aiStates.get(aiId)!);
      
      // 清理缓存
      this.aiStates.delete(aiId);
      this.memoryCache.delete(aiId);
      this.learningCache.delete(aiId);

      console.log(`AI state removed for ${aiId}`);
      this.eventEmitter.emit('ai_state_removed', { aiId });
    } catch (error) {
      console.error(`Failed to remove AI state for ${aiId}:`, error);
      throw error;
    }
  }

  /**
   * 获取AI状态
   */
  getAIState(aiId: string): AIState | undefined {
    return this.aiStates.get(aiId);
  }

  /**
   * 保存AI状态
   */
  async saveAIState(aiId: string, aiState: AIState): Promise<void> {
    try {
      // 这里可以保存到持久化存储
      // 目前只更新内存中的状态
      this.aiStates.set(aiId, aiState);
      
      console.log(`AI state saved for ${aiId}`);
      this.eventEmitter.emit('ai_state_saved', { aiId });
    } catch (error) {
      console.error(`Failed to save AI state for ${aiId}:`, error);
      throw error;
    }
  }

  /**
   * 更新情绪状态
   */
  async updateEmotionalState(
    aiId: string,
    gameState: GameState,
    analysis: SituationAnalysis
  ): Promise<void> {
    try {
      const aiState = this.aiStates.get(aiId);
      if (!aiState) return;

      const currentEmotion = aiState.emotionalState;
      const newEmotion = this.calculateEmotionalResponse(
        currentEmotion,
        gameState,
        analysis,
        aiState.personality
      );

      // 更新情绪状态
      aiState.emotionalState = newEmotion;
      this.aiStates.set(aiId, aiState);

      console.log(`Emotional state updated for ${aiId}: ${newEmotion.mood}`);
      this.eventEmitter.emit('emotional_state_updated', { aiId, emotion: newEmotion });
    } catch (error) {
      console.error(`Failed to update emotional state for ${aiId}:`, error);
    }
  }

  /**
   * 更新记忆
   */
  async updateMemory(aiId: string, gameState: GameState): Promise<void> {
    try {
      const aiState = this.aiStates.get(aiId);
      if (!aiState) return;

      const memory = aiState.memory;
      
      // 添加新的记忆事件
      this.addMemoryEvent(memory, gameState, aiId);
      
      // 更新玩家关系
      this.updatePlayerRelationships(memory, gameState, aiId);
      
      // 应用记忆衰减
      this.applyMemoryDecay(memory);

      // 更新状态
      aiState.memory = memory;
      this.aiStates.set(aiId, aiState);
      this.memoryCache.set(aiId, memory);

      console.log(`Memory updated for ${aiId}`);
      this.eventEmitter.emit('memory_updated', { aiId });
    } catch (error) {
      console.error(`Failed to update memory for ${aiId}:`, error);
    }
  }

  /**
   * 更新学习数据
   */
  async updateLearningData(
    aiId: string,
    decision: AIDecision,
    gameState: GameState
  ): Promise<void> {
    try {
      const aiState = this.aiStates.get(aiId);
      if (!aiState) return;

      const learningData = aiState.learningData;
      
      // 记录决策经验
      this.recordDecisionExperience(learningData, decision, gameState);
      
      // 更新策略效果
      this.updateStrategyEffectiveness(learningData, decision);
      
      // 调整适应性
      this.adjustAdaptationRate(learningData, decision);

      // 更新状态
      aiState.learningData = learningData;
      this.aiStates.set(aiId, aiState);
      this.learningCache.set(aiId, learningData);

      console.log(`Learning data updated for ${aiId}`);
      this.eventEmitter.emit('learning_data_updated', { aiId });
    } catch (error) {
      console.error(`Failed to update learning data for ${aiId}:`, error);
    }
  }

  /**
   * 处理游戏事件
   */
  async processGameEvent(aiId: string, event: GameEvent): Promise<void> {
    try {
      const aiState = this.aiStates.get(aiId);
      if (!aiState) return;

      // 情绪反应
      await this.processEmotionalReaction(aiId, event);
      
      // 记忆更新
      await this.processMemoryUpdate(aiId, event);
      
      // 关系调整
      await this.processRelationshipUpdate(aiId, event);

      console.log(`Game event processed for ${aiId}: ${event.type}`);
      this.eventEmitter.emit('game_event_processed', { aiId, event });
    } catch (error) {
      console.error(`Failed to process game event for ${aiId}:`, error);
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      // 保存所有状态
      const savePromises = Array.from(this.aiStates.entries()).map(
        ([aiId, aiState]) => this.saveAIState(aiId, aiState)
      );
      
      await Promise.all(savePromises);

      // 清理缓存
      this.aiStates.clear();
      this.memoryCache.clear();
      this.learningCache.clear();

      console.log('AIStateManager cleaned up successfully');
      this.eventEmitter.emit('cleanup_completed');
    } catch (error) {
      console.error('Failed to cleanup AIStateManager:', error);
      throw error;
    }
  }

  // 私有方法

  /**
   * 创建初始策略
   */
  private async createInitialStrategy(
    personality: AIPersonality,
    difficulty: DifficultyLevel
  ): Promise<AIStrategy> {
    // 根据个性和难度创建初始策略
    const riskLevel = personality.risk_tolerance > 0.6 ? 'aggressive' :
                      personality.risk_tolerance < 0.4 ? 'conservative' : 'balanced';

    const focus = personality.property_preference.investmentFocus === 'roi' ? 'wealth_accumulation' :
                  personality.property_preference.investmentFocus === 'growth' ? 'property_monopoly' :
                  'wealth_accumulation';

    return {
      name: `${difficulty}_${riskLevel}_strategy`,
      description: `${difficulty}级别的${riskLevel}策略`,
      focus: focus as any,
      timeHorizon: difficulty === 'expert' ? 'long' : difficulty === 'easy' ? 'short' : 'medium',
      riskLevel: riskLevel as any,
      weights: {
        moneyAccumulation: personality.risk_tolerance < 0.5 ? 0.8 : 0.6,
        propertyAcquisition: personality.property_preference.maxInvestmentRatio,
        playerBlockade: personality.aggression,
        riskAvoidance: 1 - personality.risk_tolerance,
        opportunismWeight: personality.adaptability
      }
    };
  }

  /**
   * 创建初始情绪状态
   */
  private createInitialEmotionalState(personality: AIPersonality): EmotionalState {
    // 根据个性确定初始情绪
    const baseMood: EmotionalMood = personality.aggression > 0.6 ? 'confident' :
                                    personality.patience > 0.7 ? 'content' :
                                    personality.risk_tolerance > 0.7 ? 'excited' : 'cautious';

    return {
      mood: baseMood,
      confidence: personality.risk_tolerance,
      frustration: 0,
      excitement: personality.adaptability,
      lastMoodChange: Date.now()
    };
  }

  /**
   * 创建初始记忆
   */
  private createInitialMemory(): AIMemory {
    return {
      recentEvents: [],
      playerRelationships: {},
      strategicKnowledge: [],
      experienceBuffer: []
    };
  }

  /**
   * 创建初始学习数据
   */
  private createInitialLearningData(): LearningData {
    return {
      totalGames: 0,
      winRate: 0,
      averageScore: 0,
      strategyEffectiveness: {},
      adaptationRate: 0.5
    };
  }

  /**
   * 计算情绪反应
   */
  private calculateEmotionalResponse(
    currentEmotion: EmotionalState,
    gameState: GameState,
    analysis: SituationAnalysis,
    personality: AIPersonality
  ): EmotionalState {
    let newMood = currentEmotion.mood;
    let newConfidence = currentEmotion.confidence;
    let newFrustration = currentEmotion.frustration;
    let newExcitement = currentEmotion.excitement;

    // 根据经济状况调整情绪
    const economicRank = analysis.economicSituation.moneyRank;
    
    if (economicRank <= 2) {
      newConfidence = Math.min(1, newConfidence + 0.1);
      newExcitement = Math.min(1, newExcitement + 0.1);
      newFrustration = Math.max(0, newFrustration - 0.1);
      newMood = 'confident';
    } else if (economicRank >= 4) {
      newConfidence = Math.max(0, newConfidence - 0.1);
      newFrustration = Math.min(1, newFrustration + 0.1);
      newMood = economicRank === 4 ? 'cautious' : 'frustrated';
    }

    // 根据威胁等级调整情绪
    const highThreat = analysis.threats.some(t => t.severity > 0.7);
    if (highThreat) {
      if (personality.aggression > 0.6) {
        newMood = 'aggressive';
        newExcitement = Math.min(1, newExcitement + 0.2);
      } else {
        newMood = 'cautious';
        newFrustration = Math.min(1, newFrustration + 0.1);
      }
    }

    // 应用情绪衰减
    newFrustration *= this.config.emotionDecayRate;
    newExcitement *= this.config.emotionDecayRate;

    return {
      mood: newMood,
      confidence: newConfidence,
      frustration: newFrustration,
      excitement: newExcitement,
      lastMoodChange: Date.now()
    };
  }

  /**
   * 添加记忆事件
   */
  private addMemoryEvent(memory: AIMemory, gameState: GameState, aiId: string): void {
    // 创建记忆事件
    const event: GameEvent = {
      type: 'turn_end',
      playerId: aiId,
      timestamp: Date.now(),
      data: {
        turn: gameState.turn,
        phase: gameState.phase,
        position: gameState.players.find(p => p.id === aiId)?.position || 0
      }
    };

    const memoryEvent: MemoryEvent = {
      event,
      importance: this.calculateEventImportance(event, gameState),
      timestamp: Date.now(),
      associatedPlayers: gameState.players.map(p => p.id).filter(id => id !== aiId)
    };

    // 添加到记忆列表
    memory.recentEvents.push(memoryEvent);

    // 限制记忆事件数量
    if (memory.recentEvents.length > this.config.maxMemoryEvents) {
      memory.recentEvents.shift();
    }
  }

  /**
   * 更新玩家关系
   */
  private updatePlayerRelationships(
    memory: AIMemory,
    gameState: GameState,
    aiId: string
  ): void {
    gameState.players.forEach(player => {
      if (player.id !== aiId) {
        const relationship = memory.playerRelationships[player.id] || {
          playerId: player.id,
          trustLevel: 0.5,
          aggressionLevel: 0.5,
          predictability: 0.5,
          lastInteraction: 0
        };

        // 根据游戏状态调整关系
        // 这里可以根据具体的游戏事件来调整关系
        
        // 应用关系衰减
        relationship.trustLevel *= this.config.relationshipDecayRate;
        relationship.aggressionLevel *= this.config.relationshipDecayRate;

        memory.playerRelationships[player.id] = relationship;
      }
    });
  }

  /**
   * 应用记忆衰减
   */
  private applyMemoryDecay(memory: AIMemory): void {
    // 降低旧记忆事件的重要性
    memory.recentEvents.forEach(event => {
      event.importance *= this.config.memoryDecayRate;
    });

    // 移除重要性过低的事件
    memory.recentEvents = memory.recentEvents.filter(event => event.importance > 0.1);
  }

  /**
   * 记录决策经验
   */
  private recordDecisionExperience(
    learningData: LearningData,
    decision: AIDecision,
    gameState: GameState
  ): void {
    // 这里可以记录决策的结果和效果
    // 目前简单更新总决策数
    learningData.totalGames++;
  }

  /**
   * 更新策略效果
   */
  private updateStrategyEffectiveness(
    learningData: LearningData,
    decision: AIDecision
  ): void {
    const strategyName = decision.strategy.name;
    const currentEffectiveness = learningData.strategyEffectiveness[strategyName] || 0.5;
    
    // 根据决策置信度调整策略效果
    const adjustment = (decision.confidence - 0.5) * this.config.learningRate;
    const newEffectiveness = Math.max(0, Math.min(1, currentEffectiveness + adjustment));
    
    learningData.strategyEffectiveness[strategyName] = newEffectiveness;
  }

  /**
   * 调整适应性
   */
  private adjustAdaptationRate(
    learningData: LearningData,
    decision: AIDecision
  ): void {
    // 根据决策表现调整适应性
    if (decision.confidence > 0.8) {
      learningData.adaptationRate = Math.min(1, learningData.adaptationRate + 0.01);
    } else if (decision.confidence < 0.4) {
      learningData.adaptationRate = Math.max(0, learningData.adaptationRate - 0.01);
    }
  }

  /**
   * 处理情绪反应
   */
  private async processEmotionalReaction(aiId: string, event: GameEvent): Promise<void> {
    const aiState = this.aiStates.get(aiId);
    if (!aiState) return;

    const currentEmotion = aiState.emotionalState;
    
    // 根据事件类型调整情绪
    switch (event.type) {
      case 'property_bought':
        if (event.playerId === aiId) {
          currentEmotion.confidence += 0.1;
          currentEmotion.excitement += 0.1;
        }
        break;
        
      case 'rent_paid':
        if (event.playerId === aiId) {
          currentEmotion.frustration += 0.1;
          currentEmotion.confidence -= 0.05;
        }
        break;
        
      case 'skill_used':
        if (event.playerId === aiId) {
          currentEmotion.excitement += 0.05;
        }
        break;
    }

    // 限制情绪值范围
    currentEmotion.confidence = Math.max(0, Math.min(1, currentEmotion.confidence));
    currentEmotion.frustration = Math.max(0, Math.min(1, currentEmotion.frustration));
    currentEmotion.excitement = Math.max(0, Math.min(1, currentEmotion.excitement));
  }

  /**
   * 处理记忆更新
   */
  private async processMemoryUpdate(aiId: string, event: GameEvent): Promise<void> {
    const aiState = this.aiStates.get(aiId);
    if (!aiState) return;

    const importance = this.calculateEventImportance(event, null);
    
    const memoryEvent: MemoryEvent = {
      event,
      importance,
      timestamp: Date.now(),
      associatedPlayers: event.playerId ? [event.playerId] : []
    };

    aiState.memory.recentEvents.push(memoryEvent);

    // 限制记忆事件数量
    if (aiState.memory.recentEvents.length > this.config.maxMemoryEvents) {
      aiState.memory.recentEvents.shift();
    }
  }

  /**
   * 处理关系更新
   */
  private async processRelationshipUpdate(aiId: string, event: GameEvent): Promise<void> {
    const aiState = this.aiStates.get(aiId);
    if (!aiState || !event.playerId || event.playerId === aiId) return;

    const relationships = aiState.memory.playerRelationships;
    const relationship = relationships[event.playerId] || {
      playerId: event.playerId,
      trustLevel: 0.5,
      aggressionLevel: 0.5,
      predictability: 0.5,
      lastInteraction: 0
    };

    // 根据事件类型调整关系
    switch (event.type) {
      case 'trade_proposed':
        relationship.trustLevel += 0.05;
        break;
        
      case 'trade_rejected':
        relationship.trustLevel -= 0.1;
        break;
        
      case 'skill_used':
        if (event.data?.target === aiId) {
          relationship.aggressionLevel += 0.1;
        }
        break;
    }

    relationship.lastInteraction = Date.now();
    relationships[event.playerId] = relationship;
  }

  /**
   * 计算事件重要性
   */
  private calculateEventImportance(event: GameEvent, gameState: GameState | null): number {
    // 简单的重要性计算
    switch (event.type) {
      case 'game_start':
      case 'game_end':
        return 1.0;
      case 'property_bought':
      case 'property_sold':
        return 0.8;
      case 'skill_used':
        return 0.6;
      case 'turn_end':
        return 0.3;
      default:
        return 0.5;
    }
  }

  /**
   * 启动定期任务
   */
  private startPeriodicTasks(): void {
    // 定期保存状态
    setInterval(async () => {
      try {
        const savePromises = Array.from(this.aiStates.entries()).map(
          ([aiId, aiState]) => this.saveAIState(aiId, aiState)
        );
        await Promise.all(savePromises);
      } catch (error) {
        console.error('Failed to auto-save AI states:', error);
      }
    }, this.config.autoSaveInterval);

    // 定期清理记忆
    setInterval(() => {
      try {
        this.memoryCache.forEach(memory => {
          this.applyMemoryDecay(memory);
        });
      } catch (error) {
        console.error('Failed to cleanup memory:', error);
      }
    }, 60000); // 每分钟清理一次
  }
}

// 配置接口
interface AIStateManagerConfig {
  maxMemoryEvents: number;
  memoryDecayRate: number;
  learningRate: number;
  emotionDecayRate: number;
  relationshipDecayRate: number;
  autoSaveInterval: number;
}