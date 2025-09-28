import type {
  AIState,
  AIPersonality,
  EmotionalState,
  MemoryEvent,
  ReactionPattern,
  PlayerRelationship
} from '../types/ai';

import type {
  GameState,
  Player,
  GameEvent,
  EventType,
  EventChoice,
  PlayerAction,
  EventTrigger
} from '../types/game';

/**
 * AI事件反应系统
 * 负责处理游戏事件并生成相应的AI反应和决策
 */
export class EventReactionSystem {

  /**
   * 处理游戏事件并生成AI反应
   */
  processGameEvent(
    event: GameEvent,
    aiState: AIState,
    gameState: GameState
  ): EventReaction {
    // 1. 分析事件对AI的影响
    const impact = this.analyzeEventImpact(event, aiState, gameState);

    // 2. 更新情绪状态
    const emotionalResponse = this.generateEmotionalResponse(event, impact, aiState);

    // 3. 生成记忆条目
    const memoryEvent = this.createMemoryEvent(event, impact, aiState);

    // 4. 更新玩家关系（如果相关）
    const relationshipUpdates = this.updatePlayerRelationships(event, impact, aiState);

    // 5. 生成行动决策
    const actionDecision = this.generateActionDecision(event, impact, aiState, gameState);

    return {
      event,
      impact,
      emotionalResponse,
      memoryEvent,
      relationshipUpdates,
      actionDecision,
      timestamp: Date.now()
    };
  }

  /**
   * 评估事件选择
   */
  evaluateEventChoices(
    event: GameEvent,
    aiState: AIState,
    gameState: GameState
  ): EventChoiceEvaluation[] {
    if (!event.choices || event.choices.length === 0) return [];

    return event.choices.map(choice => {
      const evaluation = this.evaluateSingleChoice(choice, event, aiState, gameState);
      return {
        choice,
        score: evaluation.score,
        reasoning: evaluation.reasoning,
        expectedOutcome: evaluation.expectedOutcome,
        riskLevel: evaluation.riskLevel
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * 生成事件选择动作
   */
  generateEventChoiceAction(
    event: GameEvent,
    choiceEvaluation: EventChoiceEvaluation,
    aiId: string
  ): PlayerAction {
    return {
      type: 'event_choice',
      playerId: aiId,
      data: {
        eventId: event.id,
        choiceId: choiceEvaluation.choice.id,
        reasoning: choiceEvaluation.reasoning,
        confidence: choiceEvaluation.score
      },
      timestamp: Date.now()
    };
  }

  /**
   * 处理特定类型的事件
   */
  handleSpecificEventType(
    eventType: EventType,
    event: GameEvent,
    aiState: AIState,
    gameState: GameState
  ): SpecificEventResponse {
    switch (eventType) {
      case 'chance_card':
        return this.handleChanceCard(event, aiState, gameState);
      case 'community_chest':
        return this.handleCommunityChest(event, aiState, gameState);
      case 'property_event':
        return this.handlePropertyEvent(event, aiState, gameState);
      case 'seasonal_event':
        return this.handleSeasonalEvent(event, aiState, gameState);
      case 'zodiac_event':
        return this.handleZodiacEvent(event, aiState, gameState);
      case 'special_event':
        return this.handleSpecialEvent(event, aiState, gameState);
      default:
        return this.handleGenericEvent(event, aiState, gameState);
    }
  }

  // 私有方法

  private analyzeEventImpact(
    event: GameEvent,
    aiState: AIState,
    gameState: GameState
  ): EventImpact {
    const aiPlayer = gameState.players.find(p => p.id === aiState.id);
    if (!aiPlayer) {
      return { severity: 0, type: 'neutral', directlyAffected: false, description: '无影响' };
    }

    // 判断事件是否直接影响AI
    const directlyAffected = event.playerId === aiState.id || !event.playerId;

    // 分析影响类型和严重程度
    let severity = 0;
    let type: EventImpactType = 'neutral';
    let description = '';

    // 基于事件类型分析
    switch (event.type) {
      case 'chance_card':
      case 'community_chest':
        ({ severity, type, description } = this.analyzeCardEventImpact(event, aiPlayer, gameState));
        break;
      case 'property_event':
        ({ severity, type, description } = this.analyzePropertyEventImpact(event, aiPlayer, gameState));
        break;
      case 'seasonal_event':
        ({ severity, type, description } = this.analyzeSeasonalEventImpact(event, aiPlayer, gameState));
        break;
      case 'zodiac_event':
        ({ severity, type, description } = this.analyzeZodiacEventImpact(event, aiPlayer, gameState));
        break;
      default:
        severity = 0.3;
        type = 'neutral';
        description = '一般事件影响';
    }

    // 考虑事件稀有度的影响
    const rarityMultiplier = this.getRarityMultiplier(event.rarity);
    severity *= rarityMultiplier;

    return {
      severity: Math.max(0, Math.min(1, severity)),
      type,
      directlyAffected,
      description,
      relatedPlayers: this.getRelatedPlayers(event, gameState)
    };
  }

  private generateEmotionalResponse(
    event: GameEvent,
    impact: EventImpact,
    aiState: AIState
  ): EmotionalState {
    const currentEmotion = aiState.emotionalState || {
      mood: 'content',
      confidence: 0.5,
      frustration: 0,
      excitement: 0,
      lastMoodChange: Date.now()
    };

    let newMood = currentEmotion.mood;
    let confidence = currentEmotion.confidence;
    let frustration = currentEmotion.frustration;
    let excitement = currentEmotion.excitement;

    // 根据事件影响调整情绪
    switch (impact.type) {
      case 'positive':
        excitement = Math.min(1, excitement + impact.severity * 0.5);
        confidence = Math.min(1, confidence + impact.severity * 0.3);
        frustration = Math.max(0, frustration - impact.severity * 0.2);
        
        if (impact.severity > 0.7) newMood = 'excited';
        else if (impact.severity > 0.4) newMood = 'confident';
        break;

      case 'negative':
        frustration = Math.min(1, frustration + impact.severity * 0.6);
        confidence = Math.max(0, confidence - impact.severity * 0.4);
        excitement = Math.max(0, excitement - impact.severity * 0.3);
        
        if (impact.severity > 0.8) newMood = 'desperate';
        else if (impact.severity > 0.5) newMood = 'frustrated';
        else if (impact.severity > 0.3) newMood = 'cautious';
        break;

      case 'challenging':
        excitement = Math.min(1, excitement + impact.severity * 0.3);
        confidence = Math.max(0, confidence - impact.severity * 0.2);
        
        if (aiState.personality.risk_tolerance > 0.6) {
          newMood = 'confident';
        } else {
          newMood = 'cautious';
        }
        break;
    }

    // 个性化情绪调整
    confidence = this.adjustConfidenceByPersonality(confidence, aiState.personality);
    
    return {
      mood: newMood,
      confidence,
      frustration,
      excitement,
      lastMoodChange: newMood !== currentEmotion.mood ? Date.now() : currentEmotion.lastMoodChange
    };
  }

  private createMemoryEvent(
    event: GameEvent,
    impact: EventImpact,
    aiState: AIState
  ): MemoryEvent {
    const importance = this.calculateEventImportance(event, impact, aiState);
    
    return {
      id: `memory_${event.id}_${Date.now()}`,
      type: 'game_event',
      description: event.title,
      importance,
      emotional_value: this.calculateEmotionalValue(impact),
      participants: impact.relatedPlayers || [],
      timestamp: Date.now(),
      tags: this.generateMemoryTags(event, impact)
    };
  }

  private updatePlayerRelationships(
    event: GameEvent,
    impact: EventImpact,
    aiState: AIState
  ): RelationshipUpdate[] {
    const updates: RelationshipUpdate[] = [];

    if (!impact.relatedPlayers || impact.relatedPlayers.length === 0) return updates;

    for (const playerId of impact.relatedPlayers) {
      if (playerId === aiState.id) continue;

      const currentRelationship = aiState.memory.playerRelationships[playerId] || {
        playerId,
        trustLevel: 0.5,
        rivalry: 0,
        cooperation: 0,
        status: 'neutral',
        interactions: 0,
        lastInteraction: 0,
        relationship_history: []
      };

      let trustChange = 0;
      let rivalryChange = 0;
      let cooperationChange = 0;

      // 根据事件类型和影响调整关系
      if (this.isCooperativeEvent(event)) {
        cooperationChange += 0.1;
        trustChange += 0.05;
      } else if (this.isCompetitiveEvent(event)) {
        rivalryChange += 0.1;
        trustChange -= 0.02;
      }

      // 根据影响程度调整
      const multiplier = Math.abs(impact.severity);
      trustChange *= multiplier;
      rivalryChange *= multiplier;
      cooperationChange *= multiplier;

      updates.push({
        playerId,
        trustChange,
        rivalryChange,
        cooperationChange,
        reason: event.title
      });
    }

    return updates;
  }

  private generateActionDecision(
    event: GameEvent,
    impact: EventImpact,
    aiState: AIState,
    gameState: GameState
  ): ActionDecision | null {
    // 如果事件需要选择，生成选择决策
    if (event.choices && event.choices.length > 0) {
      const evaluations = this.evaluateEventChoices(event, aiState, gameState);
      if (evaluations.length > 0) {
        return {
          type: 'event_choice',
          target: evaluations[0].choice.id,
          reasoning: evaluations[0].reasoning,
          confidence: evaluations[0].score
        };
      }
    }

    // 根据事件影响生成反应性动作
    if (impact.severity > 0.7) {
      return this.generateReactiveAction(event, impact, aiState, gameState);
    }

    return null;
  }

  private evaluateSingleChoice(
    choice: EventChoice,
    event: GameEvent,
    aiState: AIState,
    gameState: GameState
  ): ChoiceEvaluation {
    let score = 0.5;
    let riskLevel = 0.5;
    const reasons: string[] = [];

    // 分析选择的效果
    const effectValue = this.analyzeChoiceEffects(choice, aiState, gameState);
    score += effectValue * 0.4;

    // 根据个性评估选择
    const personalityScore = this.evaluateChoiceByPersonality(choice, aiState.personality);
    score += personalityScore * 0.3;

    // 根据策略评估选择
    const strategyScore = this.evaluateChoiceByStrategy(choice, aiState.currentStrategy);
    score += strategyScore * 0.2;

    // 评估风险
    riskLevel = this.calculateChoiceRisk(choice, gameState);

    // 根据情绪状态调整
    if (aiState.emotionalState) {
      const emotionAdjustment = this.adjustChoiceByEmotion(score, choice, aiState.emotionalState);
      score = emotionAdjustment;
    }

    const expectedOutcome = this.predictChoiceOutcome(choice, aiState, gameState);
    
    return {
      score: Math.max(0, Math.min(1, score)),
      reasoning: reasons.join(', ') || '基于综合评估的选择',
      expectedOutcome,
      riskLevel
    };
  }

  // 事件类型特定处理方法

  private handleChanceCard(event: GameEvent, aiState: AIState, gameState: GameState): SpecificEventResponse {
    return {
      eventType: 'chance_card',
      specificReaction: 'chance_card处理完成',
      adaptationSuggestions: ['调整风险策略', '重新评估资源分配'],
      followUpActions: []
    };
  }

  private handleCommunityChest(event: GameEvent, aiState: AIState, gameState: GameState): SpecificEventResponse {
    return {
      eventType: 'community_chest',
      specificReaction: 'community_chest处理完成',
      adaptationSuggestions: ['考虑社交策略调整'],
      followUpActions: []
    };
  }

  private handlePropertyEvent(event: GameEvent, aiState: AIState, gameState: GameState): SpecificEventResponse {
    return {
      eventType: 'property_event',
      specificReaction: '房产事件处理完成',
      adaptationSuggestions: ['重新评估房产投资策略'],
      followUpActions: []
    };
  }

  private handleSeasonalEvent(event: GameEvent, aiState: AIState, gameState: GameState): SpecificEventResponse {
    return {
      eventType: 'seasonal_event',
      specificReaction: '季节性事件处理完成',
      adaptationSuggestions: ['根据季节调整策略'],
      followUpActions: []
    };
  }

  private handleZodiacEvent(event: GameEvent, aiState: AIState, gameState: GameState): SpecificEventResponse {
    const aiPlayer = gameState.players.find(p => p.id === aiState.id);
    const isZodiacMatch = aiPlayer && event.zodiacRelated;
    
    return {
      eventType: 'zodiac_event',
      specificReaction: isZodiacMatch ? '生肖匹配，获得额外收益' : '生肖事件正常处理',
      adaptationSuggestions: ['利用生肖优势', '注意生肖相冲风险'],
      followUpActions: []
    };
  }

  private handleSpecialEvent(event: GameEvent, aiState: AIState, gameState: GameState): SpecificEventResponse {
    return {
      eventType: 'special_event',
      specificReaction: '特殊事件处理完成',
      adaptationSuggestions: ['关注特殊事件模式', '调整长期策略'],
      followUpActions: []
    };
  }

  private handleGenericEvent(event: GameEvent, aiState: AIState, gameState: GameState): SpecificEventResponse {
    return {
      eventType: event.type,
      specificReaction: '通用事件处理',
      adaptationSuggestions: ['保持当前策略'],
      followUpActions: []
    };
  }

  // 辅助方法

  private analyzeCardEventImpact(event: GameEvent, player: Player, gameState: GameState) {
    // 简化的卡片事件影响分析
    return { severity: 0.5, type: 'neutral' as EventImpactType, description: '卡片事件影响' };
  }

  private analyzePropertyEventImpact(event: GameEvent, player: Player, gameState: GameState) {
    return { severity: 0.4, type: 'challenging' as EventImpactType, description: '房产事件影响' };
  }

  private analyzeSeasonalEventImpact(event: GameEvent, player: Player, gameState: GameState) {
    return { severity: 0.3, type: 'neutral' as EventImpactType, description: '季节事件影响' };
  }

  private analyzeZodiacEventImpact(event: GameEvent, player: Player, gameState: GameState) {
    // 检查生肖匹配
    const isMatch = player.zodiac && event.zodiacRelated;
    return {
      severity: isMatch ? 0.6 : 0.3,
      type: (isMatch ? 'positive' : 'neutral') as EventImpactType,
      description: isMatch ? '生肖匹配获得好处' : '生肖事件一般影响'
    };
  }

  private getRarityMultiplier(rarity: string): number {
    const multipliers = {
      common: 1.0,
      uncommon: 1.2,
      rare: 1.5,
      epic: 2.0,
      legendary: 3.0
    };
    return multipliers[rarity as keyof typeof multipliers] || 1.0;
  }

  private getRelatedPlayers(event: GameEvent, gameState: GameState): string[] {
    const related: string[] = [];
    if (event.playerId) related.push(event.playerId);
    // 可以根据事件类型添加更多相关玩家
    return related;
  }

  private adjustConfidenceByPersonality(confidence: number, personality: AIPersonality): number {
    // 根据个性调整置信度
    const baseConfidence = 0.3 + personality.risk_tolerance * 0.4;
    return Math.max(0, Math.min(1, confidence * 0.7 + baseConfidence * 0.3));
  }

  private calculateEventImportance(event: GameEvent, impact: EventImpact, aiState: AIState): number {
    let importance = impact.severity * 0.6;
    
    // 稀有事件更重要
    const rarityBonus = this.getRarityMultiplier(event.rarity) * 0.1;
    importance += rarityBonus;

    // 直接影响更重要
    if (impact.directlyAffected) importance += 0.2;

    return Math.max(0, Math.min(1, importance));
  }

  private calculateEmotionalValue(impact: EventImpact): number {
    switch (impact.type) {
      case 'positive': return impact.severity;
      case 'negative': return -impact.severity;
      case 'challenging': return impact.severity * 0.5;
      default: return 0;
    }
  }

  private generateMemoryTags(event: GameEvent, impact: EventImpact): string[] {
    const tags = [event.type];
    if (event.zodiacRelated) tags.push('zodiac');
    if (impact.directlyAffected) tags.push('personal');
    tags.push(impact.type);
    return tags;
  }

  private isCooperativeEvent(event: GameEvent): boolean {
    return event.tags.includes('cooperative') || event.tags.includes('beneficial_to_all');
  }

  private isCompetitiveEvent(event: GameEvent): boolean {
    return event.tags.includes('competitive') || event.tags.includes('player_vs_player');
  }

  private generateReactiveAction(event: GameEvent, impact: EventImpact, aiState: AIState, gameState: GameState): ActionDecision {
    // 根据影响生成反应性动作
    return {
      type: 'reactive_response',
      target: event.id,
      reasoning: `对${event.title}的反应`,
      confidence: impact.severity
    };
  }

  private analyzeChoiceEffects(choice: EventChoice, aiState: AIState, gameState: GameState): number {
    // 简化的选择效果分析
    return choice.effects?.length ? 0.6 : 0.3;
  }

  private evaluateChoiceByPersonality(choice: EventChoice, personality: AIPersonality): number {
    // 根据个性评估选择
    return 0.5; // 简化实现
  }

  private evaluateChoiceByStrategy(choice: EventChoice, strategy: any): number {
    // 根据策略评估选择
    return 0.5; // 简化实现
  }

  private calculateChoiceRisk(choice: EventChoice, gameState: GameState): number {
    // 计算选择风险
    return choice.effects?.some(effect => effect.value < 0) ? 0.7 : 0.3;
  }

  private adjustChoiceByEmotion(score: number, choice: EventChoice, emotion: EmotionalState): number {
    let adjustment = 1.0;
    
    switch (emotion.mood) {
      case 'confident':
        adjustment = 1.1;
        break;
      case 'cautious':
        adjustment = 0.9;
        break;
      case 'desperate':
        adjustment = 1.3;
        break;
      case 'frustrated':
        adjustment = 0.8;
        break;
    }
    
    return score * adjustment;
  }

  private predictChoiceOutcome(choice: EventChoice, aiState: AIState, gameState: GameState): string {
    return `选择${choice.text}的预期结果`;
  }
}

// 类型定义
export interface EventReaction {
  event: GameEvent;
  impact: EventImpact;
  emotionalResponse: EmotionalState;
  memoryEvent: MemoryEvent;
  relationshipUpdates: RelationshipUpdate[];
  actionDecision: ActionDecision | null;
  timestamp: number;
}

export interface EventImpact {
  severity: number; // 0-1, 影响严重程度
  type: EventImpactType;
  directlyAffected: boolean;
  description: string;
  relatedPlayers?: string[];
}

export type EventImpactType = 'positive' | 'negative' | 'neutral' | 'challenging';

export interface RelationshipUpdate {
  playerId: string;
  trustChange: number;
  rivalryChange: number;
  cooperationChange: number;
  reason: string;
}

export interface ActionDecision {
  type: string;
  target: string;
  reasoning: string;
  confidence: number;
}

export interface EventChoiceEvaluation {
  choice: EventChoice;
  score: number;
  reasoning: string;
  expectedOutcome: string;
  riskLevel: number;
}

export interface ChoiceEvaluation {
  score: number;
  reasoning: string;
  expectedOutcome: string;
  riskLevel: number;
}

export interface SpecificEventResponse {
  eventType: EventType | string;
  specificReaction: string;
  adaptationSuggestions: string[];
  followUpActions: string[];
}