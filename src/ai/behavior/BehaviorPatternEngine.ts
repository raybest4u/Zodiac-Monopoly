import { AICharacterProfile, PersonalityTraits, GameplayPreferences } from '../personality/AICharacterGenerator';
import { PersonalityState, PersonalitySystem } from '../personality/PersonalitySystem';

export interface GameAction {
  type: 'property_purchase' | 'property_development' | 'trade_offer' | 'trade_response' | 
        'auction_bid' | 'mortgage_decision' | 'jail_decision' | 'card_choice' | 'movement_choice';
  subtype?: string;
  parameters: any;
  confidence: number;          // 0-1: 决策信心
  urgency: number;             // 0-1: 紧急程度
  riskLevel: number;           // 0-1: 风险评估
  expectedOutcome: any;        // 预期结果
  alternativeActions?: GameAction[];  // 备选方案
}

export interface DecisionContext {
  gameState: any;              // 当前游戏状态
  playerState: any;            // 玩家状态
  opponentStates: any[];       // 对手状态
  timeConstraints: number;     // 时间限制（秒）
  availableActions: string[];  // 可用行动
  gamePhase: 'early' | 'mid' | 'late' | 'endgame';
  socialContext: {
    alliances: string[];       // 当前联盟
    conflicts: string[];       // 当前冲突
    reputations: Record<string, number>;  // 声誉评分
    relationships: Record<string, number>; // 关系亲密度
  };
}

export interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  triggerConditions: {
    gamePhase?: string[];
    personalityTraits?: Partial<PersonalityTraits>;
    gameStateConditions?: any;
    socialConditions?: any;
  };
  actionWeights: Record<string, number>;  // 行动类型权重
  decisionFactors: {
    analyticalWeight: number;    // 分析因素权重
    emotionalWeight: number;     // 情感因素权重
    socialWeight: number;        // 社交因素权重
    riskWeight: number;          // 风险因素权重
  };
  adaptationRules: {
    successFeedback: number;     // 成功时的强化
    failureFeedback: number;     // 失败时的调整
    learningRate: number;        // 学习速率
  };
}

export interface BehaviorMemory {
  actionId: string;
  context: DecisionContext;
  action: GameAction;
  outcome: {
    success: boolean;
    reward: number;             // -1 to 1
    consequences: string[];
    opponentReactions: Record<string, string>;
  };
  timestamp: number;
  emotionalImpact: number;     // 情感影响
  learningValue: number;       // 学习价值
}

export interface AdaptiveBehaviorWeights {
  patternWeights: Map<string, number>;      // 行为模式权重
  actionPreferences: Map<string, number>;   // 行动偏好
  contextualModifiers: Map<string, number>; // 情境修饰符
  socialRelationWeights: Map<string, number>; // 社交关系权重
  lastUpdateTime: number;
}

export class BehaviorPatternEngine {
  private characterProfile: AICharacterProfile;
  private personalitySystem: PersonalitySystem;
  private behaviorPatterns: Map<string, BehaviorPattern> = new Map();
  private behaviorMemory: BehaviorMemory[] = [];
  private adaptiveWeights: AdaptiveBehaviorWeights;
  private decisionHistory: { context: DecisionContext; action: GameAction; timestamp: number }[] = [];

  constructor(characterProfile: AICharacterProfile, personalitySystem: PersonalitySystem) {
    this.characterProfile = characterProfile;
    this.personalitySystem = personalitySystem;
    this.adaptiveWeights = this.initializeAdaptiveWeights();
    this.initializeBehaviorPatterns();
  }

  private initializeAdaptiveWeights(): AdaptiveBehaviorWeights {
    return {
      patternWeights: new Map(),
      actionPreferences: new Map(),
      contextualModifiers: new Map(),
      socialRelationWeights: new Map(),
      lastUpdateTime: Date.now()
    };
  }

  private initializeBehaviorPatterns(): void {
    const patterns = this.generateZodiacBasedPatterns();
    const personalityPatterns = this.generatePersonalityBasedPatterns();
    const gameplayPatterns = this.generateGameplayBasedPatterns();

    [...patterns, ...personalityPatterns, ...gameplayPatterns].forEach(pattern => {
      this.behaviorPatterns.set(pattern.id, pattern);
      this.adaptiveWeights.patternWeights.set(pattern.id, 1.0);
    });
  }

  private generateZodiacBasedPatterns(): BehaviorPattern[] {
    const zodiacSign = this.characterProfile.zodiacSign;
    
    const patterns: BehaviorPattern[] = [];

    // 火象星座模式
    if (zodiacSign.element === 'fire') {
      patterns.push({
        id: 'fire_aggressive_expansion',
        name: 'Aggressive Expansion',
        description: 'Rapidly acquire properties and take bold risks',
        triggerConditions: {
          gamePhase: ['early', 'mid'],
          personalityTraits: { aggression: 0.6, risktaking: 0.5 }
        },
        actionWeights: {
          'property_purchase': 1.5,
          'auction_bid': 1.3,
          'trade_offer': 1.2,
          'property_development': 1.1
        },
        decisionFactors: {
          analyticalWeight: 0.3,
          emotionalWeight: 0.4,
          socialWeight: 0.2,
          riskWeight: 0.1
        },
        adaptationRules: {
          successFeedback: 0.1,
          failureFeedback: -0.05,
          learningRate: 0.15
        }
      });
    }

    // 土象星座模式
    if (zodiacSign.element === 'earth') {
      patterns.push({
        id: 'earth_methodical_building',
        name: 'Methodical Building',
        description: 'Steady, calculated property development and resource management',
        triggerConditions: {
          gamePhase: ['early', 'mid', 'late'],
          personalityTraits: { patience: 0.6, analytical: 0.5 }
        },
        actionWeights: {
          'property_development': 1.4,
          'property_purchase': 1.2,
          'mortgage_decision': 1.3,
          'trade_response': 1.1
        },
        decisionFactors: {
          analyticalWeight: 0.5,
          emotionalWeight: 0.1,
          socialWeight: 0.2,
          riskWeight: 0.2
        },
        adaptationRules: {
          successFeedback: 0.08,
          failureFeedback: -0.03,
          learningRate: 0.08
        }
      });
    }

    // 风象星座模式
    if (zodiacSign.element === 'air') {
      patterns.push({
        id: 'air_adaptive_networking',
        name: 'Adaptive Networking',
        description: 'Flexible strategy with strong social manipulation',
        triggerConditions: {
          gamePhase: ['early', 'mid', 'late'],
          personalityTraits: { social: 0.6, adaptability: 0.5 }
        },
        actionWeights: {
          'trade_offer': 1.6,
          'trade_response': 1.4,
          'card_choice': 1.2,
          'movement_choice': 1.1
        },
        decisionFactors: {
          analyticalWeight: 0.3,
          emotionalWeight: 0.2,
          socialWeight: 0.4,
          riskWeight: 0.1
        },
        adaptationRules: {
          successFeedback: 0.12,
          failureFeedback: -0.08,
          learningRate: 0.2
        }
      });
    }

    // 水象星座模式
    if (zodiacSign.element === 'water') {
      patterns.push({
        id: 'water_intuitive_protection',
        name: 'Intuitive Protection',
        description: 'Defensive strategy guided by intuition and emotional intelligence',
        triggerConditions: {
          gamePhase: ['mid', 'late'],
          personalityTraits: { intuition: 0.6, emotional: 0.5 }
        },
        actionWeights: {
          'trade_response': 1.3,
          'mortgage_decision': 1.4,
          'jail_decision': 1.2,
          'card_choice': 1.3
        },
        decisionFactors: {
          analyticalWeight: 0.2,
          emotionalWeight: 0.4,
          socialWeight: 0.3,
          riskWeight: 0.1
        },
        adaptationRules: {
          successFeedback: 0.09,
          failureFeedback: -0.06,
          learningRate: 0.12
        }
      });
    }

    return patterns;
  }

  private generatePersonalityBasedPatterns(): BehaviorPattern[] {
    const traits = this.characterProfile.personalityTraits;
    const patterns: BehaviorPattern[] = [];

    // 高分析型模式
    if (traits.analytical > 0.7) {
      patterns.push({
        id: 'analytical_optimizer',
        name: 'Analytical Optimizer',
        description: 'Data-driven decisions with thorough risk assessment',
        triggerConditions: {
          personalityTraits: { analytical: 0.7 }
        },
        actionWeights: {
          'property_development': 1.3,
          'mortgage_decision': 1.4,
          'trade_response': 1.2
        },
        decisionFactors: {
          analyticalWeight: 0.6,
          emotionalWeight: 0.1,
          socialWeight: 0.2,
          riskWeight: 0.1
        },
        adaptationRules: {
          successFeedback: 0.06,
          failureFeedback: -0.02,
          learningRate: 0.05
        }
      });
    }

    // 高社交型模式
    if (traits.social > 0.7) {
      patterns.push({
        id: 'social_manipulator',
        name: 'Social Manipulator',
        description: 'Leverage relationships and alliances for advantage',
        triggerConditions: {
          personalityTraits: { social: 0.7 }
        },
        actionWeights: {
          'trade_offer': 1.5,
          'trade_response': 1.3,
          'auction_bid': 1.2
        },
        decisionFactors: {
          analyticalWeight: 0.2,
          emotionalWeight: 0.3,
          socialWeight: 0.5,
          riskWeight: 0.0
        },
        adaptationRules: {
          successFeedback: 0.15,
          failureFeedback: -0.1,
          learningRate: 0.18
        }
      });
    }

    // 高冒险型模式
    if (traits.risktaking > 0.7) {
      patterns.push({
        id: 'risk_maximizer',
        name: 'Risk Maximizer',
        description: 'High-risk, high-reward decision making',
        triggerConditions: {
          personalityTraits: { risktaking: 0.7 }
        },
        actionWeights: {
          'auction_bid': 1.6,
          'property_purchase': 1.4,
          'property_development': 1.3
        },
        decisionFactors: {
          analyticalWeight: 0.2,
          emotionalWeight: 0.3,
          socialWeight: 0.1,
          riskWeight: 0.4
        },
        adaptationRules: {
          successFeedback: 0.2,
          failureFeedback: -0.15,
          learningRate: 0.25
        }
      });
    }

    return patterns;
  }

  private generateGameplayBasedPatterns(): BehaviorPattern[] {
    const preferences = this.characterProfile.gameplayPreferences;
    const patterns: BehaviorPattern[] = [];

    // 基于资产焦点的模式
    switch (preferences.propertyFocus) {
      case 'monopoly_building':
        patterns.push({
          id: 'monopoly_builder',
          name: 'Monopoly Builder',
          description: 'Focus on completing color groups for monopolies',
          triggerConditions: {
            gamePhase: ['early', 'mid']
          },
          actionWeights: {
            'property_purchase': 1.5,
            'trade_offer': 1.4,
            'property_development': 1.6
          },
          decisionFactors: {
            analyticalWeight: 0.4,
            emotionalWeight: 0.2,
            socialWeight: 0.3,
            riskWeight: 0.1
          },
          adaptationRules: {
            successFeedback: 0.1,
            failureFeedback: -0.05,
            learningRate: 0.12
          }
        });
        break;

      case 'cash_hoarding':
        patterns.push({
          id: 'cash_conservative',
          name: 'Cash Conservative',
          description: 'Maintain high cash reserves and avoid risky investments',
          triggerConditions: {
            gamePhase: ['early', 'mid', 'late']
          },
          actionWeights: {
            'mortgage_decision': 1.4,
            'trade_response': 1.2,
            'jail_decision': 1.3
          },
          decisionFactors: {
            analyticalWeight: 0.5,
            emotionalWeight: 0.1,
            socialWeight: 0.2,
            riskWeight: 0.2
          },
          adaptationRules: {
            successFeedback: 0.05,
            failureFeedback: -0.02,
            learningRate: 0.06
          }
        });
        break;
    }

    // 基于协商风格的模式
    switch (preferences.negotiationStyle) {
      case 'aggressive':
        patterns.push({
          id: 'aggressive_negotiator',
          name: 'Aggressive Negotiator',
          description: 'Demand favorable trades and pressure opponents',
          triggerConditions: {},
          actionWeights: {
            'trade_offer': 1.4,
            'trade_response': 1.3,
            'auction_bid': 1.2
          },
          decisionFactors: {
            analyticalWeight: 0.3,
            emotionalWeight: 0.4,
            socialWeight: 0.2,
            riskWeight: 0.1
          },
          adaptationRules: {
            successFeedback: 0.12,
            failureFeedback: -0.08,
            learningRate: 0.15
          }
        });
        break;

      case 'diplomatic':
        patterns.push({
          id: 'diplomatic_negotiator',
          name: 'Diplomatic Negotiator',
          description: 'Build mutually beneficial relationships and alliances',
          triggerConditions: {},
          actionWeights: {
            'trade_offer': 1.3,
            'trade_response': 1.4,
            'card_choice': 1.1
          },
          decisionFactors: {
            analyticalWeight: 0.3,
            emotionalWeight: 0.2,
            socialWeight: 0.4,
            riskWeight: 0.1
          },
          adaptationRules: {
            successFeedback: 0.08,
            failureFeedback: -0.04,
            learningRate: 0.1
          }
        });
        break;
    }

    return patterns;
  }

  public makeDecision(context: DecisionContext): GameAction {
    // 1. 分析当前情境并激活相关行为模式
    const activePatterns = this.selectActivePatterns(context);
    
    // 2. 获取当前人格状态
    const personalityState = this.personalitySystem.getCurrentPersonalityState();
    
    // 3. 生成可能的行动
    const possibleActions = this.generatePossibleActions(context, activePatterns);
    
    // 4. 评估每个行动
    const evaluatedActions = possibleActions.map(action => 
      this.evaluateAction(action, context, activePatterns, personalityState)
    );
    
    // 5. 选择最佳行动
    const selectedAction = this.selectBestAction(evaluatedActions, personalityState);
    
    // 6. 记录决策
    this.recordDecision(context, selectedAction);
    
    return selectedAction;
  }

  private selectActivePatterns(context: DecisionContext): BehaviorPattern[] {
    const activePatterns: BehaviorPattern[] = [];
    const currentTraits = this.personalitySystem.getCurrentTraits();
    const personalityState = this.personalitySystem.getCurrentPersonalityState();

    for (const pattern of this.behaviorPatterns.values()) {
      if (this.isPatternActive(pattern, context, currentTraits, personalityState)) {
        const weight = this.adaptiveWeights.patternWeights.get(pattern.id) || 1.0;
        if (weight > 0.1) { // 只考虑权重足够的模式
          activePatterns.push(pattern);
        }
      }
    }

    // 按权重排序
    return activePatterns.sort((a, b) => {
      const weightA = this.adaptiveWeights.patternWeights.get(a.id) || 1.0;
      const weightB = this.adaptiveWeights.patternWeights.get(b.id) || 1.0;
      return weightB - weightA;
    });
  }

  private isPatternActive(
    pattern: BehaviorPattern, 
    context: DecisionContext, 
    traits: PersonalityTraits,
    state: PersonalityState
  ): boolean {
    const conditions = pattern.triggerConditions;

    // 检查游戏阶段
    if (conditions.gamePhase && !conditions.gamePhase.includes(context.gamePhase)) {
      return false;
    }

    // 检查人格特质条件
    if (conditions.personalityTraits) {
      for (const [trait, threshold] of Object.entries(conditions.personalityTraits)) {
        if (traits[trait as keyof PersonalityTraits] < threshold) {
          return false;
        }
      }
    }

    // 检查游戏状态条件
    if (conditions.gameStateConditions) {
      // 这里可以添加更复杂的游戏状态条件检查
    }

    // 检查社交条件
    if (conditions.socialConditions) {
      // 这里可以添加社交情况条件检查
    }

    return true;
  }

  private generatePossibleActions(
    context: DecisionContext, 
    activePatterns: BehaviorPattern[]
  ): GameAction[] {
    const actions: GameAction[] = [];
    const actionTypes = new Set(context.availableActions);

    // 基于活跃模式生成行动
    for (const pattern of activePatterns) {
      for (const [actionType, weight] of Object.entries(pattern.actionWeights)) {
        if (actionTypes.has(actionType) && weight > 0) {
          const action = this.createSpecificAction(actionType, context, pattern);
          if (action) {
            actions.push(action);
          }
        }
      }
    }

    // 确保至少有一个默认行动
    if (actions.length === 0 && context.availableActions.length > 0) {
      const defaultAction = this.createDefaultAction(context.availableActions[0], context);
      if (defaultAction) {
        actions.push(defaultAction);
      }
    }

    return actions;
  }

  private createSpecificAction(
    actionType: string, 
    context: DecisionContext, 
    pattern: BehaviorPattern
  ): GameAction | null {
    const baseAction: Partial<GameAction> = {
      type: actionType as GameAction['type'],
      confidence: 0.5,
      urgency: 0.5,
      riskLevel: 0.5
    };

    switch (actionType) {
      case 'property_purchase':
        return {
          ...baseAction,
          parameters: {
            propertyId: this.selectBestPropertyToPurchase(context, pattern),
            maxPrice: this.calculateMaxPurchasePrice(context, pattern)
          },
          confidence: this.calculateActionConfidence(pattern, 'property_purchase'),
          riskLevel: this.calculateRiskLevel(context, pattern),
          expectedOutcome: { type: 'property_acquired', value: 'medium' }
        } as GameAction;

      case 'trade_offer':
        return {
          ...baseAction,
          parameters: {
            targetPlayer: this.selectBestTradeTarget(context, pattern),
            offer: this.generateTradeOffer(context, pattern),
            terms: this.generateTradeTerms(context, pattern)
          },
          confidence: this.calculateActionConfidence(pattern, 'trade_offer'),
          riskLevel: 0.3,
          expectedOutcome: { type: 'trade_completed', value: 'high' }
        } as GameAction;

      case 'property_development':
        return {
          ...baseAction,
          parameters: {
            propertyId: this.selectBestPropertyToDevelop(context, pattern),
            developmentLevel: this.calculateOptimalDevelopment(context, pattern)
          },
          confidence: this.calculateActionConfidence(pattern, 'property_development'),
          riskLevel: this.calculateDevelopmentRisk(context, pattern),
          expectedOutcome: { type: 'increased_rent', value: 'high' }
        } as GameAction;

      case 'auction_bid':
        return {
          ...baseAction,
          parameters: {
            bidAmount: this.calculateAuctionBid(context, pattern),
            maxBid: this.calculateMaxAuctionBid(context, pattern)
          },
          confidence: this.calculateActionConfidence(pattern, 'auction_bid'),
          riskLevel: this.calculateAuctionRisk(context, pattern),
          expectedOutcome: { type: 'property_won', value: 'medium' }
        } as GameAction;

      default:
        return {
          ...baseAction,
          parameters: {},
          confidence: 0.5,
          riskLevel: 0.5,
          expectedOutcome: { type: 'unknown', value: 'medium' }
        } as GameAction;
    }
  }

  private evaluateAction(
    action: GameAction, 
    context: DecisionContext, 
    activePatterns: BehaviorPattern[],
    personalityState: PersonalityState
  ): GameAction & { evaluationScore: number } {
    let score = 0;
    
    // 基于活跃模式评分
    for (const pattern of activePatterns) {
      const patternWeight = this.adaptiveWeights.patternWeights.get(pattern.id) || 1.0;
      const actionWeight = pattern.actionWeights[action.type] || 0.5;
      score += patternWeight * actionWeight * 0.4;
    }

    // 基于决策因素评分
    score += this.evaluateAnalyticalFactors(action, context) * 0.25;
    score += this.evaluateEmotionalFactors(action, personalityState) * 0.15;
    score += this.evaluateSocialFactors(action, context) * 0.15;
    score += this.evaluateRiskFactors(action, context, personalityState) * 0.05;

    // 基于历史经验调整
    score += this.applyHistoricalLearning(action, context) * 0.1;

    return { ...action, evaluationScore: Math.max(0, Math.min(1, score)) };
  }

  private evaluateAnalyticalFactors(action: GameAction, context: DecisionContext): number {
    // 分析因素评估：预期收益、成本效益、成功概率等
    let analyticalScore = 0.5;

    // 基于行动类型的分析评估
    switch (action.type) {
      case 'property_purchase':
        analyticalScore = this.evaluatePropertyValue(action.parameters, context);
        break;
      case 'trade_offer':
        analyticalScore = this.evaluateTradeValue(action.parameters, context);
        break;
      case 'property_development':
        analyticalScore = this.evaluateDevelopmentROI(action.parameters, context);
        break;
    }

    return analyticalScore;
  }

  private evaluateEmotionalFactors(action: GameAction, state: PersonalityState): number {
    let emotionalScore = 0.5;

    // 基于当前情绪状态调整
    switch (state.currentMood) {
      case 'aggressive':
        if (['property_purchase', 'auction_bid', 'trade_offer'].includes(action.type)) {
          emotionalScore += 0.2;
        }
        break;
      case 'cautious':
        if (['mortgage_decision', 'trade_response'].includes(action.type)) {
          emotionalScore += 0.2;
        }
        if (action.riskLevel > 0.7) {
          emotionalScore -= 0.3;
        }
        break;
      case 'excited':
        emotionalScore += 0.1; // 兴奋时总体更积极
        break;
    }

    // 基于压力水平调整
    if (state.stressLevel > 0.7) {
      emotionalScore -= 0.2; // 高压力时降低所有行动评分
    }

    return Math.max(0, Math.min(1, emotionalScore));
  }

  private evaluateSocialFactors(action: GameAction, context: DecisionContext): number {
    let socialScore = 0.5;

    // 基于社交情境评估
    if (action.type === 'trade_offer' || action.type === 'trade_response') {
      const targetPlayer = action.parameters?.targetPlayer;
      if (targetPlayer) {
        const relationship = context.socialContext.relationships[targetPlayer] || 0.5;
        const reputation = context.socialContext.reputations[targetPlayer] || 0.5;
        socialScore = (relationship + reputation) / 2;
      }
    }

    return socialScore;
  }

  private evaluateRiskFactors(
    action: GameAction, 
    context: DecisionContext, 
    state: PersonalityState
  ): number {
    const riskTolerance = this.personalitySystem.simulatePersonalityResponse('risk_assessment').riskAssessment.level;
    const actionRisk = action.riskLevel;
    
    // 如果风险在可接受范围内，评分较高
    if (actionRisk <= riskTolerance) {
      return 0.8;
    } else {
      // 风险超出容忍度时，评分降低
      return Math.max(0.2, 1 - (actionRisk - riskTolerance));
    }
  }

  private applyHistoricalLearning(action: GameAction, context: DecisionContext): number {
    // 基于历史记忆调整评分
    const similarMemories = this.findSimilarMemories(action, context);
    
    if (similarMemories.length === 0) return 0.5; // 无历史数据时中性评分
    
    const avgReward = similarMemories.reduce((sum, memory) => sum + memory.outcome.reward, 0) / similarMemories.length;
    const successRate = similarMemories.filter(memory => memory.outcome.success).length / similarMemories.length;
    
    return (avgReward + 1) / 2 * 0.7 + successRate * 0.3; // 归一化到 0-1
  }

  private findSimilarMemories(action: GameAction, context: DecisionContext): BehaviorMemory[] {
    return this.behaviorMemory.filter(memory => 
      memory.action.type === action.type &&
      memory.context.gamePhase === context.gamePhase &&
      Date.now() - memory.timestamp < 7 * 24 * 60 * 60 * 1000 // 7天内
    ).slice(-10); // 最近10条相似记忆
  }

  private selectBestAction(
    evaluatedActions: (GameAction & { evaluationScore: number })[],
    personalityState: PersonalityState
  ): GameAction {
    if (evaluatedActions.length === 0) {
      throw new Error('No actions available for selection');
    }

    // 根据人格状态调整选择策略
    let selectedAction: GameAction;

    if (personalityState.stressLevel > 0.7) {
      // 高压力时选择最安全的选项
      selectedAction = evaluatedActions.reduce((safest, current) => 
        current.riskLevel < safest.riskLevel ? current : safest
      );
    } else if (personalityState.confidenceLevel > 0.8) {
      // 高信心时选择评分最高的选项
      selectedAction = evaluatedActions.reduce((best, current) => 
        current.evaluationScore > best.evaluationScore ? current : best
      );
    } else {
      // 平衡选择：综合评分和风险
      selectedAction = evaluatedActions.reduce((best, current) => {
        const currentScore = current.evaluationScore * (1 - current.riskLevel * 0.3);
        const bestScore = best.evaluationScore * (1 - best.riskLevel * 0.3);
        return currentScore > bestScore ? current : best;
      });
    }

    // 移除评估分数属性
    const { evaluationScore, ...finalAction } = selectedAction;
    return finalAction;
  }

  private recordDecision(context: DecisionContext, action: GameAction): void {
    this.decisionHistory.push({
      context: { ...context },
      action: { ...action },
      timestamp: Date.now()
    });

    // 限制历史记录长度
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory = this.decisionHistory.slice(-800);
    }
  }

  public recordActionOutcome(
    actionId: string, 
    outcome: BehaviorMemory['outcome'],
    emotionalImpact: number = 0.5
  ): void {
    const recentDecision = this.decisionHistory[this.decisionHistory.length - 1];
    if (!recentDecision) return;

    const memory: BehaviorMemory = {
      actionId,
      context: recentDecision.context,
      action: recentDecision.action,
      outcome,
      timestamp: Date.now(),
      emotionalImpact,
      learningValue: this.calculateLearningValue(outcome, emotionalImpact)
    };

    this.behaviorMemory.push(memory);
    this.updateAdaptiveWeights(memory);

    // 向人格系统报告事件
    this.personalitySystem.processEvent({
      type: 'decision_outcome',
      description: `Action ${recentDecision.action.type} resulted in ${outcome.success ? 'success' : 'failure'}`,
      impact: [{
        trait: outcome.success ? 'confidence' : 'patience',
        magnitude: outcome.success ? 0.05 : -0.03,
        duration: 30
      }],
      emotionalImpact: {
        mood: outcome.success ? 'confident' : 'frustrated',
        stressChange: outcome.success ? -0.1 : 0.1,
        confidenceChange: outcome.success ? 0.1 : -0.05,
        energyChange: outcome.success ? 0.05 : -0.1
      },
      timestamp: Date.now()
    });

    // 限制记忆长度
    if (this.behaviorMemory.length > 500) {
      this.behaviorMemory = this.behaviorMemory.slice(-400);
    }
  }

  private calculateLearningValue(outcome: BehaviorMemory['outcome'], emotionalImpact: number): number {
    const rewardWeight = 0.6;
    const emotionalWeight = 0.4;
    
    return Math.abs(outcome.reward) * rewardWeight + emotionalImpact * emotionalWeight;
  }

  private updateAdaptiveWeights(memory: BehaviorMemory): void {
    const learningRate = 0.1;
    const actionType = memory.action.type;
    const reward = memory.outcome.reward;

    // 更新行动偏好权重
    const currentWeight = this.adaptiveWeights.actionPreferences.get(actionType) || 1.0;
    const newWeight = currentWeight + (reward * learningRate);
    this.adaptiveWeights.actionPreferences.set(actionType, Math.max(0.1, Math.min(2.0, newWeight)));

    // 更新模式权重
    for (const [patternId, pattern] of this.behaviorPatterns.entries()) {
      if (pattern.actionWeights[actionType]) {
        const currentPatternWeight = this.adaptiveWeights.patternWeights.get(patternId) || 1.0;
        const adjustment = reward * pattern.adaptationRules.learningRate;
        const newPatternWeight = currentPatternWeight + adjustment;
        this.adaptiveWeights.patternWeights.set(patternId, Math.max(0.1, Math.min(2.0, newPatternWeight)));
      }
    }

    this.adaptiveWeights.lastUpdateTime = Date.now();
  }

  // 辅助方法实现
  private selectBestPropertyToPurchase(context: DecisionContext, pattern: BehaviorPattern): string {
    // 实现房产选择逻辑
    return 'property_1'; // 占位符
  }

  private calculateMaxPurchasePrice(context: DecisionContext, pattern: BehaviorPattern): number {
    // 实现最大购买价格计算
    return 200; // 占位符
  }

  private calculateActionConfidence(pattern: BehaviorPattern, actionType: string): number {
    const weight = pattern.actionWeights[actionType] || 0.5;
    return Math.min(1, weight * 0.8);
  }

  private calculateRiskLevel(context: DecisionContext, pattern: BehaviorPattern): number {
    return 0.5; // 占位符实现
  }

  private selectBestTradeTarget(context: DecisionContext, pattern: BehaviorPattern): string {
    return 'player_1'; // 占位符
  }

  private generateTradeOffer(context: DecisionContext, pattern: BehaviorPattern): any {
    return { properties: [], money: 0 }; // 占位符
  }

  private generateTradeTerms(context: DecisionContext, pattern: BehaviorPattern): any {
    return { conditions: [] }; // 占位符
  }

  private selectBestPropertyToDevelop(context: DecisionContext, pattern: BehaviorPattern): string {
    return 'property_1'; // 占位符
  }

  private calculateOptimalDevelopment(context: DecisionContext, pattern: BehaviorPattern): number {
    return 1; // 占位符
  }

  private calculateDevelopmentRisk(context: DecisionContext, pattern: BehaviorPattern): number {
    return 0.3; // 占位符
  }

  private calculateAuctionBid(context: DecisionContext, pattern: BehaviorPattern): number {
    return 100; // 占位符
  }

  private calculateMaxAuctionBid(context: DecisionContext, pattern: BehaviorPattern): number {
    return 300; // 占位符
  }

  private calculateAuctionRisk(context: DecisionContext, pattern: BehaviorPattern): number {
    return 0.4; // 占位符
  }

  private createDefaultAction(actionType: string, context: DecisionContext): GameAction | null {
    return {
      type: actionType as GameAction['type'],
      parameters: {},
      confidence: 0.5,
      urgency: 0.5,
      riskLevel: 0.5,
      expectedOutcome: { type: 'default', value: 'medium' }
    };
  }

  private evaluatePropertyValue(parameters: any, context: DecisionContext): number {
    return 0.6; // 占位符
  }

  private evaluateTradeValue(parameters: any, context: DecisionContext): number {
    return 0.7; // 占位符
  }

  private evaluateDevelopmentROI(parameters: any, context: DecisionContext): number {
    return 0.5; // 占位符
  }

  public getBehaviorAnalytics(): any {
    return {
      activePatterns: Array.from(this.behaviorPatterns.values()).filter(pattern => 
        (this.adaptiveWeights.patternWeights.get(pattern.id) || 1.0) > 0.5
      ),
      adaptiveWeights: {
        patterns: Object.fromEntries(this.adaptiveWeights.patternWeights),
        actions: Object.fromEntries(this.adaptiveWeights.actionPreferences)
      },
      memoryStats: {
        totalMemories: this.behaviorMemory.length,
        successRate: this.behaviorMemory.filter(m => m.outcome.success).length / Math.max(1, this.behaviorMemory.length),
        averageReward: this.behaviorMemory.reduce((sum, m) => sum + m.outcome.reward, 0) / Math.max(1, this.behaviorMemory.length)
      },
      decisionHistory: this.decisionHistory.slice(-10)
    };
  }

  public cleanup(): void {
    this.behaviorMemory = [];
    this.decisionHistory = [];
    this.adaptiveWeights.patternWeights.clear();
    this.adaptiveWeights.actionPreferences.clear();
  }
}