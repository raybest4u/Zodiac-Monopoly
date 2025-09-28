import { AICharacterProfile, PersonalityTraits } from '../personality/AICharacterGenerator';
import { PersonalitySystem, PersonalityEvent } from '../personality/PersonalitySystem';
import { BehaviorPatternEngine, GameAction, DecisionContext, BehaviorMemory } from '../behavior/BehaviorPatternEngine';

export interface LearningObjective {
  id: string;
  name: string;
  description: string;
  targetMetric: string;          // 目标指标
  currentValue: number;          // 当前值
  targetValue: number;           // 目标值
  importance: number;            // 重要性 (0-1)
  timeHorizon: number;           // 时间范围 (分钟)
  progressRate: number;          // 进展速率
  achievementHistory: {
    timestamp: number;
    value: number;
    context: string;
  }[];
}

export interface LearningStrategy {
  id: string;
  name: string;
  description: string;
  applicableObjectives: string[];
  learningMethods: {
    reinforcement: number;       // 强化学习权重
    imitation: number;           // 模仿学习权重
    exploration: number;         // 探索学习权重
    optimization: number;        // 优化学习权重
  };
  adaptationRules: {
    successThreshold: number;    // 成功阈值
    failureThreshold: number;    // 失败阈值
    adaptationRate: number;      // 适应速率
    forgettingRate: number;      // 遗忘速率
  };
  constraints: {
    personalityBounds: Partial<PersonalityTraits>; // 人格边界
    behaviorLimits: string[];    // 行为限制
    ethicalConstraints: string[]; // 伦理约束
  };
}

export interface LearningExperience {
  id: string;
  timestamp: number;
  context: DecisionContext;
  action: GameAction;
  outcome: {
    immediate: any;              // 即时结果
    delayed: any[];              // 延迟结果
    unexpected: any[];           // 意外结果
  };
  feedback: {
    objective: number;           // 客观反馈 (-1 to 1)
    subjective: number;          // 主观反馈 (-1 to 1)
    environmental: number;       // 环境反馈 (-1 to 1)
    social: number;              // 社交反馈 (-1 to 1)
  };
  learningValue: number;         // 学习价值
  generalizable: boolean;        // 是否可泛化
  confidence: number;            // 信心水平
}

export interface KnowledgePattern {
  id: string;
  pattern: string;               // 模式描述
  frequency: number;             // 出现频率
  reliability: number;           // 可靠性
  contexts: string[];            // 适用情境
  outcomes: any[];               // 关联结果
  confidence: number;            // 置信度
  lastReinforced: number;        // 最后强化时间
  strengthHistory: {
    timestamp: number;
    strength: number;
    event: string;
  }[];
}

export interface MetaCognition {
  selfAwareness: {
    strengths: string[];         // 认知到的优势
    weaknesses: string[];        // 认知到的劣势
    biases: string[];           // 认知偏差
    blindSpots: string[];       // 盲点
  };
  learningMetrics: {
    learningSpeed: number;       // 学习速度
    retentionRate: number;       // 保持率
    transferAbility: number;     // 迁移能力
    adaptationFlexibility: number; // 适应灵活性
  };
  strategicThinking: {
    planningHorizon: number;     // 规划时间范围
    contingencyPreparation: number; // 应急准备
    patternRecognition: number;  // 模式识别
    abstractionLevel: number;    // 抽象水平
  };
}

export class AdaptiveLearningSystem {
  private characterProfile: AICharacterProfile;
  private personalitySystem: PersonalitySystem;
  private behaviorEngine: BehaviorPatternEngine;
  
  private learningObjectives: Map<string, LearningObjective> = new Map();
  private learningStrategies: Map<string, LearningStrategy> = new Map();
  private learningExperiences: LearningExperience[] = [];
  private knowledgePatterns: Map<string, KnowledgePattern> = new Map();
  private metaCognition: MetaCognition;
  
  private learningUpdateInterval: NodeJS.Timeout | null = null;
  private explorationRate: number = 0.3;
  private learningRate: number = 0.1;
  private forgetRate: number = 0.01;

  constructor(
    characterProfile: AICharacterProfile,
    personalitySystem: PersonalitySystem,
    behaviorEngine: BehaviorPatternEngine
  ) {
    this.characterProfile = characterProfile;
    this.personalitySystem = personalitySystem;
    this.behaviorEngine = behaviorEngine;
    
    this.metaCognition = this.initializeMetaCognition();
    this.initializeLearningSystem();
    this.startLearningEngine();
  }

  private initializeMetaCognition(): MetaCognition {
    const traits = this.characterProfile.personalityTraits;
    
    return {
      selfAwareness: {
        strengths: this.identifyInitialStrengths(traits),
        weaknesses: this.identifyInitialWeaknesses(traits),
        biases: this.identifyPotentialBiases(traits),
        blindSpots: []
      },
      learningMetrics: {
        learningSpeed: traits.adaptability * 0.6 + traits.analytical * 0.4,
        retentionRate: traits.patience * 0.7 + traits.analytical * 0.3,
        transferAbility: traits.creativity * 0.5 + traits.adaptability * 0.5,
        adaptationFlexibility: traits.adaptability
      },
      strategicThinking: {
        planningHorizon: traits.analytical * 0.6 + traits.patience * 0.4,
        contingencyPreparation: traits.analytical * 0.7 + traits.risktaking * 0.3,
        patternRecognition: traits.analytical * 0.8 + traits.intuition * 0.2,
        abstractionLevel: traits.analytical * 0.6 + traits.creativity * 0.4
      }
    };
  }

  private initializeLearningSystem(): void {
    this.setupLearningObjectives();
    this.setupLearningStrategies();
    this.initializeKnowledgeBase();
  }

  private setupLearningObjectives(): void {
    const objectives = [
      {
        id: 'win_rate_optimization',
        name: 'Win Rate Optimization',
        description: 'Improve overall game win rate',
        targetMetric: 'win_percentage',
        currentValue: 0.25,
        targetValue: 0.6,
        importance: 1.0,
        timeHorizon: 120,
        progressRate: 0.02,
        achievementHistory: []
      },
      {
        id: 'resource_efficiency',
        name: 'Resource Management Efficiency',
        description: 'Optimize cash and property management',
        targetMetric: 'resource_utilization',
        currentValue: 0.5,
        targetValue: 0.8,
        importance: 0.8,
        timeHorizon: 90,
        progressRate: 0.03,
        achievementHistory: []
      },
      {
        id: 'social_influence',
        name: 'Social Influence Mastery',
        description: 'Improve negotiation and alliance building',
        targetMetric: 'social_success_rate',
        currentValue: 0.4,
        targetValue: 0.75,
        importance: 0.7,
        timeHorizon: 150,
        progressRate: 0.025,
        achievementHistory: []
      },
      {
        id: 'risk_calibration',
        name: 'Risk Assessment Calibration',
        description: 'Better align risk-taking with outcomes',
        targetMetric: 'risk_reward_ratio',
        currentValue: 0.3,
        targetValue: 0.7,
        importance: 0.6,
        timeHorizon: 100,
        progressRate: 0.02,
        achievementHistory: []
      }
    ];

    objectives.forEach(obj => {
      this.learningObjectives.set(obj.id, obj);
    });
  }

  private setupLearningStrategies(): void {
    const strategies = [
      {
        id: 'reinforcement_learning',
        name: 'Reinforcement Learning',
        description: 'Learn through trial and error with reward feedback',
        applicableObjectives: ['win_rate_optimization', 'resource_efficiency'],
        learningMethods: {
          reinforcement: 0.8,
          imitation: 0.1,
          exploration: 0.1,
          optimization: 0.0
        },
        adaptationRules: {
          successThreshold: 0.7,
          failureThreshold: 0.3,
          adaptationRate: 0.15,
          forgettingRate: 0.05
        },
        constraints: {
          personalityBounds: {
            risktaking: 0.9  // 不要过度冒险
          },
          behaviorLimits: ['no_extreme_aggression'],
          ethicalConstraints: ['fair_play', 'respectful_interaction']
        }
      },
      {
        id: 'social_learning',
        name: 'Social Learning',
        description: 'Learn by observing and imitating successful players',
        applicableObjectives: ['social_influence', 'win_rate_optimization'],
        learningMethods: {
          reinforcement: 0.2,
          imitation: 0.6,
          exploration: 0.1,
          optimization: 0.1
        },
        adaptationRules: {
          successThreshold: 0.6,
          failureThreshold: 0.4,
          adaptationRate: 0.1,
          forgettingRate: 0.02
        },
        constraints: {
          personalityBounds: {
            social: 0.9
          },
          behaviorLimits: ['maintain_authenticity'],
          ethicalConstraints: ['respect_privacy', 'no_manipulation']
        }
      },
      {
        id: 'analytical_optimization',
        name: 'Analytical Optimization',
        description: 'Use data analysis to optimize decision patterns',
        applicableObjectives: ['resource_efficiency', 'risk_calibration'],
        learningMethods: {
          reinforcement: 0.1,
          imitation: 0.1,
          exploration: 0.2,
          optimization: 0.6
        },
        adaptationRules: {
          successThreshold: 0.8,
          failureThreshold: 0.2,
          adaptationRate: 0.05,
          forgettingRate: 0.01
        },
        constraints: {
          personalityBounds: {
            analytical: 0.95
          },
          behaviorLimits: ['avoid_over_analysis'],
          ethicalConstraints: ['transparent_reasoning']
        }
      }
    ];

    strategies.forEach(strategy => {
      this.learningStrategies.set(strategy.id, strategy);
    });
  }

  private initializeKnowledgeBase(): void {
    // 初始化基础知识模式
    const basePatterns = [
      {
        id: 'early_property_acquisition',
        pattern: 'Buying properties early in game leads to better long-term position',
        frequency: 0.8,
        reliability: 0.7,
        contexts: ['early_game', 'sufficient_cash'],
        outcomes: ['increased_rent_income', 'monopoly_potential'],
        confidence: 0.6,
        lastReinforced: Date.now(),
        strengthHistory: []
      },
      {
        id: 'alliance_benefits',
        pattern: 'Forming alliances with players improves trade success rate',
        frequency: 0.6,
        reliability: 0.8,
        contexts: ['mid_game', 'competitive_environment'],
        outcomes: ['successful_trades', 'mutual_benefit'],
        confidence: 0.7,
        lastReinforced: Date.now(),
        strengthHistory: []
      }
    ];

    basePatterns.forEach(pattern => {
      this.knowledgePatterns.set(pattern.id, pattern);
    });
  }

  public processLearningExperience(
    context: DecisionContext,
    action: GameAction,
    outcome: any,
    feedback: LearningExperience['feedback']
  ): void {
    const experience: LearningExperience = {
      id: `exp_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      context,
      action,
      outcome: {
        immediate: outcome.immediate || {},
        delayed: outcome.delayed || [],
        unexpected: outcome.unexpected || []
      },
      feedback,
      learningValue: this.calculateLearningValue(feedback, outcome),
      generalizable: this.assessGeneralizability(context, action, outcome),
      confidence: this.calculateConfidence(feedback, outcome)
    };

    this.learningExperiences.push(experience);
    this.processExperience(experience);
    
    // 限制经验数量
    if (this.learningExperiences.length > 1000) {
      this.learningExperiences = this.learningExperiences.slice(-800);
    }
  }

  private calculateLearningValue(
    feedback: LearningExperience['feedback'],
    outcome: any
  ): number {
    const feedbackWeight = 0.4;
    const unexpectedWeight = 0.3;
    const magnitudeWeight = 0.3;

    const avgFeedback = (feedback.objective + feedback.subjective + 
                        feedback.environmental + feedback.social) / 4;
    
    const unexpectedValue = outcome.unexpected?.length > 0 ? 0.8 : 0.2;
    const magnitude = Math.abs(avgFeedback);

    return (Math.abs(avgFeedback) * feedbackWeight + 
            unexpectedValue * unexpectedWeight + 
            magnitude * magnitudeWeight);
  }

  private assessGeneralizability(
    context: DecisionContext,
    action: GameAction,
    outcome: any
  ): boolean {
    // 基于情境的普遍性、行动的典型性和结果的一致性来判断
    const contextGenerality = this.assessContextGenerality(context);
    const actionTypicality = this.assessActionTypicality(action);
    const outcomeConsistency = this.assessOutcomeConsistency(action, outcome);

    return (contextGenerality + actionTypicality + outcomeConsistency) / 3 > 0.6;
  }

  private calculateConfidence(
    feedback: LearningExperience['feedback'],
    outcome: any
  ): number {
    const feedbackConsistency = this.calculateFeedbackConsistency(feedback);
    const outcomeClarity = outcome.immediate ? 0.8 : 0.4;
    const environmentalSupport = Math.abs(feedback.environmental);

    return (feedbackConsistency * 0.4 + outcomeClarity * 0.4 + environmentalSupport * 0.2);
  }

  private processExperience(experience: LearningExperience): void {
    // 1. 更新学习目标进展
    this.updateLearningObjectives(experience);
    
    // 2. 提取和强化知识模式
    this.extractKnowledgePatterns(experience);
    
    // 3. 应用学习策略
    this.applyLearningStrategies(experience);
    
    // 4. 更新元认知
    this.updateMetaCognition(experience);
    
    // 5. 调整个性特质（如果需要）
    this.adaptPersonality(experience);
  }

  private updateLearningObjectives(experience: LearningExperience): void {
    for (const objective of this.learningObjectives.values()) {
      const relevance = this.assessObjectiveRelevance(objective, experience);
      
      if (relevance > 0.3) {
        const impact = this.calculateObjectiveImpact(objective, experience);
        objective.currentValue = Math.max(0, Math.min(1, objective.currentValue + impact * 0.1));
        
        objective.achievementHistory.push({
          timestamp: Date.now(),
          value: objective.currentValue,
          context: `${experience.action.type}_${experience.feedback.objective > 0 ? 'success' : 'failure'}`
        });
        
        // 动态调整目标
        if (objective.currentValue > objective.targetValue * 0.9) {
          objective.targetValue = Math.min(1, objective.targetValue + 0.1);
        }
      }
    }
  }

  private extractKnowledgePatterns(experience: LearningExperience): void {
    const pattern = this.identifyPattern(experience);
    
    if (pattern) {
      const existingPattern = this.knowledgePatterns.get(pattern.id);
      
      if (existingPattern) {
        // 强化现有模式
        this.reinforcePattern(existingPattern, experience);
      } else {
        // 创建新模式
        this.knowledgePatterns.set(pattern.id, pattern);
      }
    }
  }

  private identifyPattern(experience: LearningExperience): KnowledgePattern | null {
    const actionType = experience.action.type;
    const contextPhase = experience.context.gamePhase;
    const feedbackSign = experience.feedback.objective > 0 ? 'positive' : 'negative';
    
    const patternId = `${actionType}_${contextPhase}_${feedbackSign}`;
    
    // 检查是否是有意义的模式
    if (Math.abs(experience.feedback.objective) > 0.3 && experience.learningValue > 0.4) {
      return {
        id: patternId,
        pattern: `${actionType} in ${contextPhase} phase typically results in ${feedbackSign} outcome`,
        frequency: 1,
        reliability: experience.confidence,
        contexts: [contextPhase],
        outcomes: [experience.outcome.immediate],
        confidence: experience.confidence,
        lastReinforced: Date.now(),
        strengthHistory: [{
          timestamp: Date.now(),
          strength: experience.confidence,
          event: 'pattern_creation'
        }]
      };
    }
    
    return null;
  }

  private reinforcePattern(pattern: KnowledgePattern, experience: LearningExperience): void {
    const reinforcementStrength = experience.learningValue * experience.confidence;
    
    // 更新频率
    pattern.frequency = Math.min(1, pattern.frequency + 0.1);
    
    // 更新可靠性
    const reliabilityAdjustment = (experience.feedback.objective > 0 ? 1 : -1) * reinforcementStrength * 0.1;
    pattern.reliability = Math.max(0, Math.min(1, pattern.reliability + reliabilityAdjustment));
    
    // 更新置信度
    pattern.confidence = (pattern.confidence * 0.8 + experience.confidence * 0.2);
    
    // 添加新的情境（如果不存在）
    const newContext = experience.context.gamePhase;
    if (!pattern.contexts.includes(newContext)) {
      pattern.contexts.push(newContext);
    }
    
    // 记录强化历史
    pattern.strengthHistory.push({
      timestamp: Date.now(),
      strength: pattern.reliability,
      event: 'reinforcement'
    });
    
    pattern.lastReinforced = Date.now();
    
    // 限制历史长度
    if (pattern.strengthHistory.length > 20) {
      pattern.strengthHistory = pattern.strengthHistory.slice(-15);
    }
  }

  private applyLearningStrategies(experience: LearningExperience): void {
    for (const strategy of this.learningStrategies.values()) {
      if (this.isStrategyApplicable(strategy, experience)) {
        this.executeStrategy(strategy, experience);
      }
    }
  }

  private isStrategyApplicable(strategy: LearningStrategy, experience: LearningExperience): boolean {
    // 检查相关学习目标
    const relevantObjectives = strategy.applicableObjectives.filter(objId => 
      this.learningObjectives.has(objId)
    );
    
    if (relevantObjectives.length === 0) return false;
    
    // 检查约束条件
    const personalityCompatible = this.checkPersonalityConstraints(strategy, experience);
    const behaviorCompatible = this.checkBehaviorConstraints(strategy, experience);
    
    return personalityCompatible && behaviorCompatible;
  }

  private executeStrategy(strategy: LearningStrategy, experience: LearningExperience): void {
    const methods = strategy.learningMethods;
    
    // 强化学习
    if (methods.reinforcement > 0.1) {
      this.applyReinforcementLearning(strategy, experience, methods.reinforcement);
    }
    
    // 模仿学习
    if (methods.imitation > 0.1) {
      this.applyImitationLearning(strategy, experience, methods.imitation);
    }
    
    // 探索学习
    if (methods.exploration > 0.1) {
      this.applyExplorationLearning(strategy, experience, methods.exploration);
    }
    
    // 优化学习
    if (methods.optimization > 0.1) {
      this.applyOptimizationLearning(strategy, experience, methods.optimization);
    }
  }

  private applyReinforcementLearning(
    strategy: LearningStrategy, 
    experience: LearningExperience, 
    weight: number
  ): void {
    const reward = experience.feedback.objective;
    const actionType = experience.action.type;
    
    // 调整行为偏好
    const currentPreference = this.behaviorEngine.getBehaviorAnalytics().adaptiveWeights.actions[actionType] || 1.0;
    const adjustment = reward * weight * strategy.adaptationRules.adaptationRate;
    
    // 通过行为引擎记录结果来间接调整权重
    this.behaviorEngine.recordActionOutcome(
      experience.id,
      {
        success: reward > 0,
        reward: reward,
        consequences: [`reinforcement_learning_adjustment: ${adjustment.toFixed(3)}`],
        opponentReactions: {}
      },
      experience.learningValue
    );
  }

  private applyImitationLearning(
    strategy: LearningStrategy, 
    experience: LearningExperience, 
    weight: number
  ): void {
    // 识别成功的对手行为模式
    if (experience.feedback.environmental > 0.5) {
      const successfulPattern = this.identifySuccessfulOpponentBehavior(experience);
      if (successfulPattern) {
        this.incorporateImitatedBehavior(successfulPattern, weight);
      }
    }
  }

  private applyExplorationLearning(
    strategy: LearningStrategy, 
    experience: LearningExperience, 
    weight: number
  ): void {
    // 增加探索率如果当前策略不够有效
    if (experience.feedback.objective < 0.2) {
      this.explorationRate = Math.min(0.8, this.explorationRate + weight * 0.1);
    } else {
      this.explorationRate = Math.max(0.1, this.explorationRate - weight * 0.05);
    }
  }

  private applyOptimizationLearning(
    strategy: LearningStrategy, 
    experience: LearningExperience, 
    weight: number
  ): void {
    // 分析最优化机会
    const optimizationOpportunity = this.identifyOptimizationOpportunity(experience);
    
    if (optimizationOpportunity) {
      this.applyOptimization(optimizationOpportunity, weight);
    }
  }

  private updateMetaCognition(experience: LearningExperience): void {
    const metaCog = this.metaCognition;
    
    // 更新学习指标
    const learningSuccess = experience.feedback.objective > 0;
    
    if (learningSuccess) {
      metaCog.learningMetrics.learningSpeed *= 1.02;
      metaCog.learningMetrics.retentionRate *= 1.01;
    } else {
      metaCog.learningMetrics.learningSpeed *= 0.99;
      metaCog.learningMetrics.retentionRate *= 0.995;
    }
    
    // 识别新的盲点
    if (experience.outcome.unexpected.length > 0) {
      const blindSpot = `Unexpected outcome in ${experience.context.gamePhase} phase with ${experience.action.type}`;
      if (!metaCog.selfAwareness.blindSpots.includes(blindSpot)) {
        metaCog.selfAwareness.blindSpots.push(blindSpot);
      }
    }
    
    // 更新模式识别能力
    if (experience.generalizable) {
      metaCog.strategicThinking.patternRecognition *= 1.01;
    }
  }

  private adaptPersonality(experience: LearningExperience): void {
    // 根据重大学习经验调整人格特质
    if (experience.learningValue > 0.8 && Math.abs(experience.feedback.objective) > 0.7) {
      const personalityEvent: PersonalityEvent = {
        type: 'decision_outcome',
        description: `Significant learning from ${experience.action.type} with ${experience.feedback.objective > 0 ? 'positive' : 'negative'} outcome`,
        impact: this.calculatePersonalityImpact(experience),
        emotionalImpact: {
          mood: experience.feedback.objective > 0 ? 'confident' : 'cautious',
          stressChange: experience.feedback.objective > 0 ? -0.05 : 0.05,
          confidenceChange: experience.feedback.objective * 0.1,
          energyChange: experience.learningValue * 0.05
        },
        timestamp: Date.now()
      };
      
      this.personalitySystem.processEvent(personalityEvent);
    }
  }

  private calculatePersonalityImpact(experience: LearningExperience): PersonalityEvent['impact'] {
    const impact: PersonalityEvent['impact'] = [];
    
    // 基于学习经验类型调整不同特质
    switch (experience.action.type) {
      case 'trade_offer':
      case 'trade_response':
        impact.push({
          trait: 'social',
          magnitude: experience.feedback.social * 0.02,
          duration: 60
        });
        break;
        
      case 'property_purchase':
      case 'auction_bid':
        impact.push({
          trait: 'risktaking',
          magnitude: (experience.feedback.objective > 0 ? 0.01 : -0.01),
          duration: 45
        });
        break;
        
      case 'property_development':
        impact.push({
          trait: 'analytical',
          magnitude: experience.feedback.objective * 0.015,
          duration: 90
        });
        break;
    }
    
    return impact;
  }

  private startLearningEngine(): void {
    this.learningUpdateInterval = setInterval(() => {
      this.updateLearningSystem();
    }, 60000); // 每分钟更新一次
  }

  private updateLearningSystem(): void {
    // 应用遗忘机制
    this.applyForgetting();
    
    // 更新探索率
    this.updateExplorationRate();
    
    // 评估学习进展
    this.evaluateLearningProgress();
    
    // 清理过期数据
    this.cleanupOldData();
  }

  private applyForgetting(): void {
    // 对知识模式应用遗忘
    for (const pattern of this.knowledgePatterns.values()) {
      const timeSinceReinforcement = Date.now() - pattern.lastReinforced;
      const forgettingFactor = Math.exp(-timeSinceReinforcement / (7 * 24 * 60 * 60 * 1000)); // 7天半衰期
      
      pattern.reliability *= forgettingFactor;
      pattern.confidence *= forgettingFactor;
      
      // 移除过弱的模式
      if (pattern.reliability < 0.1) {
        this.knowledgePatterns.delete(pattern.id);
      }
    }
  }

  private updateExplorationRate(): void {
    // 基于学习进展动态调整探索率
    const overallProgress = Array.from(this.learningObjectives.values())
      .reduce((sum, obj) => sum + (obj.currentValue / obj.targetValue), 0) / this.learningObjectives.size;
    
    if (overallProgress > 0.8) {
      this.explorationRate *= 0.98; // 接近目标时减少探索
    } else if (overallProgress < 0.3) {
      this.explorationRate *= 1.02; // 进展缓慢时增加探索
    }
    
    this.explorationRate = Math.max(0.05, Math.min(0.5, this.explorationRate));
  }

  private evaluateLearningProgress(): void {
    // 评估每个学习目标的进展
    for (const objective of this.learningObjectives.values()) {
      const recentHistory = objective.achievementHistory.filter(
        entry => Date.now() - entry.timestamp < 24 * 60 * 60 * 1000 // 24小时内
      );
      
      if (recentHistory.length > 1) {
        const progressRate = (recentHistory[recentHistory.length - 1].value - recentHistory[0].value) / recentHistory.length;
        objective.progressRate = progressRate;
        
        // 如果进展过慢，增加重要性
        if (progressRate < 0.01 && objective.importance < 1.0) {
          objective.importance = Math.min(1.0, objective.importance + 0.1);
        }
      }
    }
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30天前
    
    // 清理旧的学习经验
    this.learningExperiences = this.learningExperiences.filter(
      exp => exp.timestamp > cutoffTime
    );
    
    // 清理学习目标的旧历史
    for (const objective of this.learningObjectives.values()) {
      objective.achievementHistory = objective.achievementHistory.filter(
        entry => entry.timestamp > cutoffTime
      );
    }
  }

  // 辅助方法实现
  private identifyInitialStrengths(traits: PersonalityTraits): string[] {
    const strengths: string[] = [];
    
    if (traits.analytical > 0.7) strengths.push('analytical_thinking');
    if (traits.social > 0.7) strengths.push('social_interaction');
    if (traits.adaptability > 0.7) strengths.push('flexibility');
    if (traits.patience > 0.7) strengths.push('long_term_planning');
    if (traits.leadership > 0.7) strengths.push('decision_making');
    
    return strengths;
  }

  private identifyInitialWeaknesses(traits: PersonalityTraits): string[] {
    const weaknesses: string[] = [];
    
    if (traits.patience < 0.3) weaknesses.push('impatience');
    if (traits.analytical < 0.3) weaknesses.push('superficial_analysis');
    if (traits.social < 0.3) weaknesses.push('poor_communication');
    if (traits.risktaking > 0.8) weaknesses.push('excessive_risk_taking');
    if (traits.emotional > 0.8) weaknesses.push('emotional_decision_making');
    
    return weaknesses;
  }

  private identifyPotentialBiases(traits: PersonalityTraits): string[] {
    const biases: string[] = [];
    
    if (traits.aggression > 0.7) biases.push('aggression_bias');
    if (traits.risktaking > 0.7) biases.push('overconfidence_bias');
    if (traits.social > 0.8) biases.push('social_proof_bias');
    if (traits.analytical > 0.8) biases.push('analysis_paralysis');
    
    return biases;
  }

  private assessObjectiveRelevance(objective: LearningObjective, experience: LearningExperience): number {
    // 简化实现：基于行动类型和目标类型的相关性
    const actionRelevanceMap: Record<string, Record<string, number>> = {
      'win_rate_optimization': {
        'property_purchase': 0.8,
        'trade_offer': 0.9,
        'auction_bid': 0.7,
        'property_development': 0.8
      },
      'resource_efficiency': {
        'property_purchase': 0.9,
        'mortgage_decision': 0.9,
        'property_development': 0.8
      },
      'social_influence': {
        'trade_offer': 0.9,
        'trade_response': 0.9,
        'auction_bid': 0.5
      }
    };
    
    return actionRelevanceMap[objective.id]?.[experience.action.type] || 0.3;
  }

  private calculateObjectiveImpact(objective: LearningObjective, experience: LearningExperience): number {
    const baseImpact = experience.feedback.objective * experience.learningValue;
    const relevance = this.assessObjectiveRelevance(objective, experience);
    
    return baseImpact * relevance * 0.1;
  }

  private assessContextGenerality(context: DecisionContext): number {
    // 评估情境的普遍性
    return 0.6; // 占位符实现
  }

  private assessActionTypicality(action: GameAction): number {
    // 评估行动的典型性
    return 0.7; // 占位符实现
  }

  private assessOutcomeConsistency(action: GameAction, outcome: any): number {
    // 评估结果的一致性
    return 0.5; // 占位符实现
  }

  private calculateFeedbackConsistency(feedback: LearningExperience['feedback']): number {
    const values = [feedback.objective, feedback.subjective, feedback.environmental, feedback.social];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.max(0, 1 - variance); // 方差越小，一致性越高
  }

  private checkPersonalityConstraints(strategy: LearningStrategy, experience: LearningExperience): boolean {
    // 检查人格约束
    return true; // 占位符实现
  }

  private checkBehaviorConstraints(strategy: LearningStrategy, experience: LearningExperience): boolean {
    // 检查行为约束
    return true; // 占位符实现
  }

  private identifySuccessfulOpponentBehavior(experience: LearningExperience): any {
    // 识别成功的对手行为
    return null; // 占位符实现
  }

  private incorporateImitatedBehavior(pattern: any, weight: number): void {
    // 整合模仿的行为
    // 占位符实现
  }

  private identifyOptimizationOpportunity(experience: LearningExperience): any {
    // 识别优化机会
    return null; // 占位符实现
  }

  private applyOptimization(opportunity: any, weight: number): void {
    // 应用优化
    // 占位符实现
  }

  public getLearningAnalytics(): any {
    return {
      objectives: Object.fromEntries(this.learningObjectives),
      strategies: Object.fromEntries(this.learningStrategies),
      knowledgePatterns: Array.from(this.knowledgePatterns.values()).slice(0, 10),
      metaCognition: this.metaCognition,
      systemMetrics: {
        totalExperiences: this.learningExperiences.length,
        explorationRate: this.explorationRate,
        learningRate: this.learningRate,
        knowledgeBaseSize: this.knowledgePatterns.size,
        overallProgress: Array.from(this.learningObjectives.values())
          .reduce((sum, obj) => sum + (obj.currentValue / obj.targetValue), 0) / this.learningObjectives.size
      }
    };
  }

  public cleanup(): void {
    if (this.learningUpdateInterval) {
      clearInterval(this.learningUpdateInterval);
      this.learningUpdateInterval = null;
    }
    
    this.learningExperiences = [];
    this.knowledgePatterns.clear();
    this.learningObjectives.clear();
    this.learningStrategies.clear();
  }
}