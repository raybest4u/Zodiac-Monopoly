import type {
  AIState,
  AIPersonality,
  NegotiationStyle,
  PlayerRelationship,
  AIDecision
} from '../types/ai';

import type {
  GameState,
  Player,
  TradeOffer,
  TradeItem,
  TradeNegotiation,
  TradeChange,
  PlayerAction
} from '../types/game';

/**
 * AI交易和谈判系统
 * 负责处理AI之间的交易协商、报价生成和谈判策略
 */
export class TradingSystem {
  
  /**
   * 评估交易机会
   */
  evaluateTradeOpportunities(
    aiState: AIState,
    gameState: GameState,
    targetPlayerId?: string
  ): TradeOpportunity[] {
    const opportunities: TradeOpportunity[] = [];
    const aiPlayer = gameState.players.find(p => p.id === aiState.id);
    if (!aiPlayer) return opportunities;

    const targetPlayers = targetPlayerId 
      ? gameState.players.filter(p => p.id === targetPlayerId)
      : gameState.players.filter(p => p.id !== aiState.id);

    for (const targetPlayer of targetPlayers) {
      const opportunity = this.analyzeTradeWithPlayer(aiState, aiPlayer, targetPlayer, gameState);
      if (opportunity && opportunity.value > 0.3) {
        opportunities.push(opportunity);
      }
    }

    return opportunities.sort((a, b) => b.value - a.value);
  }

  /**
   * 生成交易提案
   */
  generateTradeProposal(
    aiState: AIState,
    targetPlayerId: string,
    gameState: GameState,
    opportunity?: TradeOpportunity
  ): TradeOffer | null {
    const aiPlayer = gameState.players.find(p => p.id === aiState.id);
    const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
    
    if (!aiPlayer || !targetPlayer) return null;

    const relationship = this.getPlayerRelationship(aiState, targetPlayerId);
    const negotiationStyle = aiState.personality.negotiation_style;

    // 确定交易策略
    const strategy = this.determineTradeStrategy(aiState, targetPlayer, gameState, relationship);
    
    // 生成交易物品
    const offeredItems = this.generateOfferedItems(aiPlayer, targetPlayer, strategy, gameState);
    const requestedItems = this.generateRequestedItems(aiPlayer, targetPlayer, strategy, gameState);

    if (offeredItems.length === 0 || requestedItems.length === 0) {
      return null;
    }

    // 应用谈判风格调整
    this.applyNegotiationStyleToItems(offeredItems, requestedItems, negotiationStyle, relationship);

    const tradeOffer: TradeOffer = {
      id: `trade_${Date.now()}_${aiState.id}`,
      fromPlayerId: aiState.id,
      toPlayerId: targetPlayerId,
      timestamp: Date.now(),
      offeredItems,
      requestedItems,
      status: 'pending',
      expiresAt: Date.now() + (strategy.urgency * 300000), // 基于紧急性设置过期时间
      negotiations: []
    };

    return tradeOffer;
  }

  /**
   * 评估收到的交易提案
   */
  evaluateTradeProposal(
    aiState: AIState,
    tradeOffer: TradeOffer,
    gameState: GameState
  ): TradeEvaluation {
    const aiPlayer = gameState.players.find(p => p.id === aiState.id);
    const proposerPlayer = gameState.players.find(p => p.id === tradeOffer.fromPlayerId);
    
    if (!aiPlayer || !proposerPlayer) {
      return { score: 0, decision: 'reject', reasoning: '玩家信息不完整' };
    }

    const personality = aiState.personality;
    const relationship = this.getPlayerRelationship(aiState, tradeOffer.fromPlayerId);
    
    // 计算交易价值
    const offeredValue = this.calculateItemsValue(tradeOffer.offeredItems, aiPlayer, gameState);
    const requestedValue = this.calculateItemsValue(tradeOffer.requestedItems, aiPlayer, gameState);
    
    // 基础评估
    let score = offeredValue / Math.max(requestedValue, 1);
    
    // 个性化调整
    score = this.adjustScoreByPersonality(score, personality, tradeOffer);
    
    // 关系调整
    score = this.adjustScoreByRelationship(score, relationship);
    
    // 策略调整
    score = this.adjustScoreByStrategy(score, aiState.currentStrategy, tradeOffer, gameState);
    
    // 情绪调整
    if (aiState.emotionalState) {
      score = this.adjustScoreByEmotion(score, aiState.emotionalState);
    }

    // 决定行动
    let decision: TradeDecision;
    let reasoning: string;

    if (score >= 0.8) {
      decision = 'accept';
      reasoning = '这是一个非常有利的交易';
    } else if (score >= 0.6) {
      decision = 'accept';
      reasoning = '这个交易对我有利';
    } else if (score >= 0.4) {
      decision = 'counter';
      reasoning = '需要进一步协商条件';
    } else if (score >= 0.2) {
      decision = 'counter';
      reasoning = '条件不够有利，需要调整';
    } else {
      decision = 'reject';
      reasoning = '这个交易对我不利';
    }

    return { score, decision, reasoning };
  }

  /**
   * 生成反提案
   */
  generateCounterProposal(
    aiState: AIState,
    originalOffer: TradeOffer,
    gameState: GameState,
    evaluation: TradeEvaluation
  ): TradeOffer {
    const personality = aiState.personality;
    const negotiationStyle = personality.negotiation_style;
    
    // 复制原提案
    const counterOffer: TradeOffer = {
      ...originalOffer,
      id: `counter_${Date.now()}_${aiState.id}`,
      fromPlayerId: aiState.id,
      toPlayerId: originalOffer.fromPlayerId,
      timestamp: Date.now(),
      status: 'pending',
      negotiations: [...originalOffer.negotiations]
    };

    // 根据评估结果调整条件
    if (evaluation.score < 0.4) {
      // 大幅调整
      counterOffer.requestedItems = this.reduceRequestedItems(counterOffer.requestedItems, 0.3);
      counterOffer.offeredItems = this.increaseOfferedItems(counterOffer.offeredItems, aiState, gameState, 0.2);
    } else {
      // 小幅调整
      counterOffer.requestedItems = this.reduceRequestedItems(counterOffer.requestedItems, 0.1);
      counterOffer.offeredItems = this.increaseOfferedItems(counterOffer.offeredItems, aiState, gameState, 0.1);
    }

    // 应用谈判风格
    this.applyNegotiationStyleToCounter(counterOffer, negotiationStyle, evaluation);

    // 添加谈判记录
    const negotiation: TradeNegotiation = {
      timestamp: Date.now(),
      playerId: aiState.id,
      action: 'counter',
      message: this.generateNegotiationMessage(aiState, 'counter', evaluation),
      changes: this.calculateTradeChanges(originalOffer, counterOffer)
    };

    counterOffer.negotiations.push(negotiation);

    return counterOffer;
  }

  /**
   * 执行交易决策
   */
  executeTradeDecision(
    aiState: AIState,
    tradeOffer: TradeOffer,
    evaluation: TradeEvaluation,
    gameState: GameState
  ): PlayerAction {
    const action: PlayerAction = {
      type: 'trade_request',
      playerId: aiState.id,
      data: {
        tradeOfferId: tradeOffer.id,
        decision: evaluation.decision,
        reasoning: evaluation.reasoning
      },
      timestamp: Date.now()
    };

    if (evaluation.decision === 'counter') {
      const counterOffer = this.generateCounterProposal(aiState, tradeOffer, gameState, evaluation);
      action.data.counterOffer = counterOffer;
    }

    return action;
  }

  // 私有辅助方法

  private analyzeTradeWithPlayer(
    aiState: AIState,
    aiPlayer: Player,
    targetPlayer: Player,
    gameState: GameState
  ): TradeOpportunity | null {
    const relationship = this.getPlayerRelationship(aiState, targetPlayer.id);
    
    // 分析互补需求
    const mutualBenefits = this.analyzeMutualBenefits(aiPlayer, targetPlayer, gameState);
    if (mutualBenefits.length === 0) return null;

    // 计算机会价值
    const value = this.calculateOpportunityValue(mutualBenefits, aiState, relationship);
    
    return {
      targetPlayerId: targetPlayer.id,
      value,
      benefits: mutualBenefits,
      relationship: relationship.status,
      urgency: this.calculateUrgency(aiState, gameState)
    };
  }

  private analyzeMutualBenefits(aiPlayer: Player, targetPlayer: Player, gameState: GameState): MutualBenefit[] {
    const benefits: MutualBenefit[] = [];

    // 分析房产互补
    const propertyBenefits = this.analyzePropertyComplementarity(aiPlayer, targetPlayer, gameState);
    benefits.push(...propertyBenefits);

    // 分析资源互补
    const resourceBenefits = this.analyzeResourceComplementarity(aiPlayer, targetPlayer);
    benefits.push(...resourceBenefits);

    return benefits;
  }

  private analyzePropertyComplementarity(
    aiPlayer: Player,
    targetPlayer: Player,
    gameState: GameState
  ): MutualBenefit[] {
    const benefits: MutualBenefit[] = [];

    // 寻找可以形成垄断的房产组合
    const aiProperties = aiPlayer.properties.map(id => 
      gameState.board.find(cell => cell.id === id)
    ).filter(Boolean);

    const targetProperties = targetPlayer.properties.map(id => 
      gameState.board.find(cell => cell.id === id)
    ).filter(Boolean);

    // 检查颜色组垄断机会
    for (const aiProp of aiProperties) {
      if (!aiProp || aiProp.type !== 'property') continue;
      
      const sameColorInTarget = targetProperties.find(p => 
        p && p.type === 'property' && p.color === aiProp.color
      );

      if (sameColorInTarget) {
        benefits.push({
          type: 'monopoly_formation',
          aiValue: 0.8,
          targetValue: 0.8,
          description: `形成${aiProp.color}颜色组垄断`
        });
      }
    }

    return benefits;
  }

  private analyzeResourceComplementarity(aiPlayer: Player, targetPlayer: Player): MutualBenefit[] {
    const benefits: MutualBenefit[] = [];

    // 现金vs房产交换
    if (aiPlayer.money > targetPlayer.money * 2 && targetPlayer.properties.length > aiPlayer.properties.length) {
      benefits.push({
        type: 'cash_for_property',
        aiValue: 0.6,
        targetValue: 0.7,
        description: '现金换房产'
      });
    }

    // 道具交换
    if (aiPlayer.items.length > 0 && targetPlayer.items.length > 0) {
      benefits.push({
        type: 'item_exchange',
        aiValue: 0.4,
        targetValue: 0.4,
        description: '道具交换'
      });
    }

    return benefits;
  }

  private determineTradeStrategy(
    aiState: AIState,
    targetPlayer: Player,
    gameState: GameState,
    relationship: PlayerRelationship
  ): TradeStrategy {
    const personality = aiState.personality;
    const strategy = aiState.currentStrategy;

    return {
      approach: this.getTradeApproach(personality.negotiation_style, relationship),
      urgency: this.calculateTradeUrgency(aiState, gameState),
      generosity: this.calculateGenerosity(personality, relationship),
      riskTolerance: personality.risk_tolerance
    };
  }

  private getTradeApproach(style: NegotiationStyle, relationship: PlayerRelationship): 'aggressive' | 'cooperative' | 'cautious' {
    if (relationship.trustLevel < 0.3) return 'cautious';
    if (style.style === 'aggressive') return 'aggressive';
    return 'cooperative';
  }

  private generateOfferedItems(
    aiPlayer: Player,
    targetPlayer: Player,
    strategy: TradeStrategy,
    gameState: GameState
  ): TradeItem[] {
    const items: TradeItem[] = [];

    // 根据策略生成报价
    if (strategy.approach === 'generous' || strategy.generosity > 0.7) {
      // 慷慨的报价
      if (aiPlayer.money > 5000) {
        items.push({
          type: 'money',
          amount: Math.floor(aiPlayer.money * 0.3),
          description: '现金报价',
          value: Math.floor(aiPlayer.money * 0.3)
        });
      }
    } else {
      // 保守的报价
      if (aiPlayer.money > 3000) {
        items.push({
          type: 'money',
          amount: Math.floor(aiPlayer.money * 0.15),
          description: '现金报价',
          value: Math.floor(aiPlayer.money * 0.15)
        });
      }
    }

    // 添加房产报价
    if (aiPlayer.properties.length > 2 && Math.random() < 0.4) {
      const propertyId = aiPlayer.properties[Math.floor(Math.random() * aiPlayer.properties.length)];
      const property = gameState.board.find(cell => cell.id === propertyId);
      
      if (property) {
        items.push({
          type: 'property',
          id: propertyId,
          description: `房产: ${property.name}`,
          value: property.price || 0
        });
      }
    }

    return items;
  }

  private generateRequestedItems(
    aiPlayer: Player,
    targetPlayer: Player,
    strategy: TradeStrategy,
    gameState: GameState
  ): TradeItem[] {
    const items: TradeItem[] = [];

    // 请求房产
    if (targetPlayer.properties.length > 0) {
      const desiredProperty = this.findMostDesirableProperty(aiPlayer, targetPlayer, gameState);
      if (desiredProperty) {
        items.push({
          type: 'property',
          id: desiredProperty.id,
          description: `请求房产: ${desiredProperty.name}`,
          value: desiredProperty.price || 0
        });
      }
    }

    // 请求现金
    if (targetPlayer.money > 2000 && items.length === 0) {
      const requestAmount = Math.floor(targetPlayer.money * (strategy.approach === 'aggressive' ? 0.4 : 0.2));
      items.push({
        type: 'money',
        amount: requestAmount,
        description: '请求现金',
        value: requestAmount
      });
    }

    return items;
  }

  private findMostDesirableProperty(aiPlayer: Player, targetPlayer: Player, gameState: GameState): any {
    const targetProperties = targetPlayer.properties.map(id => 
      gameState.board.find(cell => cell.id === id)
    ).filter(Boolean);

    // 优先选择能形成垄断的房产
    for (const property of targetProperties) {
      if (!property || property.type !== 'property') continue;
      
      const sameColorOwned = aiPlayer.properties.filter(id => {
        const ownedProp = gameState.board.find(cell => cell.id === id);
        return ownedProp && ownedProp.type === 'property' && ownedProp.color === property.color;
      }).length;

      if (sameColorOwned > 0) {
        return property;
      }
    }

    // 否则选择最有价值的房产
    return targetProperties.reduce((best, current) => {
      if (!best) return current;
      return (current?.price || 0) > (best?.price || 0) ? current : best;
    }, null);
  }

  private calculateItemsValue(items: TradeItem[], player: Player, gameState: GameState): number {
    return items.reduce((total, item) => {
      switch (item.type) {
        case 'money':
          return total + (item.amount || 0);
        case 'property':
          const property = gameState.board.find(cell => cell.id === item.id);
          return total + (property?.price || 0);
        case 'item':
          return total + item.value;
        default:
          return total + item.value;
      }
    }, 0);
  }

  private adjustScoreByPersonality(score: number, personality: AIPersonality, tradeOffer: TradeOffer): number {
    let adjustedScore = score;

    // 风险承受能力影响
    if (personality.risk_tolerance < 0.3) {
      adjustedScore *= 0.8; // 低风险承受能力更谨慎
    } else if (personality.risk_tolerance > 0.7) {
      adjustedScore *= 1.2; // 高风险承受能力更积极
    }

    // 合作倾向影响
    if (personality.cooperation > 0.7) {
      adjustedScore *= 1.1; // 高合作性更愿意交易
    }

    return adjustedScore;
  }

  private adjustScoreByRelationship(score: number, relationship: PlayerRelationship): number {
    const trustMultiplier = 0.5 + relationship.trustLevel * 0.5;
    return score * trustMultiplier;
  }

  private adjustScoreByStrategy(score: number, strategy: any, tradeOffer: TradeOffer, gameState: GameState): number {
    let adjustedScore = score;

    switch (strategy.focus) {
      case 'wealth_accumulation':
        // 关注现金价值
        const cashValue = tradeOffer.offeredItems
          .filter(item => item.type === 'money')
          .reduce((sum, item) => sum + (item.amount || 0), 0);
        if (cashValue > 0) adjustedScore *= 1.2;
        break;
      case 'property_monopoly':
        // 关注房产垄断
        const hasPropertyOffer = tradeOffer.offeredItems.some(item => item.type === 'property');
        if (hasPropertyOffer) adjustedScore *= 1.3;
        break;
    }

    return adjustedScore;
  }

  private adjustScoreByEmotion(score: number, emotionalState: any): number {
    const mood = emotionalState.mood;
    
    switch (mood) {
      case 'confident':
        return score * 1.1;
      case 'desperate':
        return score * 1.4; // 绝望时更容易接受交易
      case 'frustrated':
        return score * 0.8; // 沮丧时更难接受交易
      case 'cautious':
        return score * 0.9;
      default:
        return score;
    }
  }

  private getPlayerRelationship(aiState: AIState, playerId: string): PlayerRelationship {
    return aiState.memory.playerRelationships[playerId] || {
      playerId,
      trustLevel: 0.5,
      rivalry: 0,
      cooperation: 0,
      status: 'neutral',
      interactions: 0,
      lastInteraction: 0,
      relationship_history: []
    };
  }

  private calculateOpportunityValue(benefits: MutualBenefit[], aiState: AIState, relationship: PlayerRelationship): number {
    const baseValue = benefits.reduce((sum, benefit) => sum + benefit.aiValue, 0) / benefits.length;
    const relationshipMultiplier = 0.7 + relationship.trustLevel * 0.3;
    return Math.min(baseValue * relationshipMultiplier, 1);
  }

  private calculateUrgency(aiState: AIState, gameState: GameState): number {
    const gamePhase = gameState.turn / 100; // 假设100回合
    const economicPressure = aiState.emotionalState?.mood === 'desperate' ? 0.8 : 0.3;
    return Math.min(gamePhase + economicPressure, 1);
  }

  private calculateTradeUrgency(aiState: AIState, gameState: GameState): number {
    return this.calculateUrgency(aiState, gameState);
  }

  private calculateGenerosity(personality: AIPersonality, relationship: PlayerRelationship): number {
    return Math.min(personality.cooperation * 0.7 + relationship.trustLevel * 0.3, 1);
  }

  private applyNegotiationStyleToItems(
    offeredItems: TradeItem[],
    requestedItems: TradeItem[],
    style: NegotiationStyle,
    relationship: PlayerRelationship
  ): void {
    const generosityFactor = style.concessionRate * (0.5 + relationship.trustLevel * 0.5);
    
    // 调整报价慷慨程度
    offeredItems.forEach(item => {
      if (item.type === 'money' && item.amount) {
        item.amount = Math.floor(item.amount * (1 + generosityFactor * 0.3));
        item.value = item.amount;
      }
    });
  }

  private applyNegotiationStyleToCounter(
    counterOffer: TradeOffer,
    style: NegotiationStyle,
    evaluation: TradeEvaluation
  ): void {
    // 根据谈判风格调整反提案
    if (style.style === 'aggressive' && evaluation.score < 0.3) {
      // 激进的反提案
      counterOffer.expiresAt = Date.now() + 180000; // 3分钟过期
    }
  }

  private reduceRequestedItems(items: TradeItem[], reductionFactor: number): TradeItem[] {
    return items.map(item => {
      if (item.type === 'money' && item.amount) {
        const newAmount = Math.floor(item.amount * (1 - reductionFactor));
        return { ...item, amount: newAmount, value: newAmount };
      }
      return item;
    });
  }

  private increaseOfferedItems(items: TradeItem[], aiState: AIState, gameState: GameState, increaseFactor: number): TradeItem[] {
    const aiPlayer = gameState.players.find(p => p.id === aiState.id);
    if (!aiPlayer) return items;

    return items.map(item => {
      if (item.type === 'money' && item.amount) {
        const maxIncrease = Math.floor(aiPlayer.money * 0.1);
        const increase = Math.min(Math.floor(item.amount * increaseFactor), maxIncrease);
        const newAmount = item.amount + increase;
        return { ...item, amount: newAmount, value: newAmount };
      }
      return item;
    });
  }

  private generateNegotiationMessage(aiState: AIState, action: string, evaluation: TradeEvaluation): string {
    const personality = aiState.personality;
    const messages = {
      counter: [
        '我认为这个提案需要一些调整。',
        '让我们重新考虑一下条件。',
        '我有一个更好的建议。'
      ],
      reject: [
        '很抱歉，这个提案对我来说不合适。',
        '我觉得我们的期望差距太大了。',
        '也许下次有更好的机会。'
      ]
    };

    const messageList = messages[action as keyof typeof messages] || ['谢谢你的提案。'];
    return messageList[Math.floor(Math.random() * messageList.length)];
  }

  private calculateTradeChanges(original: TradeOffer, counter: TradeOffer): TradeChange[] {
    const changes: TradeChange[] = [];
    
    // 比较报价项目
    if (original.offeredItems.length !== counter.offeredItems.length) {
      changes.push({
        field: 'offeredItems',
        oldValue: original.offeredItems.length,
        newValue: counter.offeredItems.length,
        reason: '调整报价内容'
      });
    }

    return changes;
  }
}

// 类型定义
export interface TradeOpportunity {
  targetPlayerId: string;
  value: number;
  benefits: MutualBenefit[];
  relationship: string;
  urgency: number;
}

export interface MutualBenefit {
  type: 'monopoly_formation' | 'cash_for_property' | 'item_exchange' | 'strategic_alliance';
  aiValue: number;
  targetValue: number;
  description: string;
}

export interface TradeStrategy {
  approach: 'aggressive' | 'cooperative' | 'cautious' | 'generous';
  urgency: number;
  generosity: number;
  riskTolerance: number;
}

export interface TradeEvaluation {
  score: number;
  decision: TradeDecision;
  reasoning: string;
}

export type TradeDecision = 'accept' | 'reject' | 'counter';