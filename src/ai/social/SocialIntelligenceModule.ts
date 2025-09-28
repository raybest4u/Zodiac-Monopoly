import { AICharacterProfile, PersonalityTraits } from '../personality/AICharacterGenerator';
import { PersonalitySystem, PersonalityState } from '../personality/PersonalitySystem';

export interface SocialRelationship {
  playerId: string;
  relationshipType: 'ally' | 'rival' | 'neutral' | 'enemy' | 'unknown';
  trustLevel: number;            // 0-1: 信任度
  respectLevel: number;          // 0-1: 尊重度
  fearLevel: number;             // 0-1: 恐惧度
  likingLevel: number;           // 0-1: 喜欢度
  dependencyLevel: number;       // 0-1: 依赖度
  threatLevel: number;           // 0-1: 威胁度
  cooperationHistory: {
    totalInteractions: number;
    successfulCollaborations: number;
    betrayals: number;
    neutralExchanges: number;
  };
  recentInteractions: SocialInteraction[];
  emotionalHistory: {
    timestamp: number;
    emotion: string;
    intensity: number;
    trigger: string;
  }[];
}

export interface SocialInteraction {
  id: string;
  timestamp: number;
  type: 'trade_negotiation' | 'alliance_proposal' | 'betrayal' | 'cooperation' | 'competition' | 'casual_chat';
  participants: string[];
  context: {
    gamePhase: string;
    gameState: any;
    circumstances: string[];
  };
  content: {
    proposal?: any;
    response?: any;
    emotional_tone: 'friendly' | 'neutral' | 'hostile' | 'manipulative' | 'desperate';
    persuasion_attempts: string[];
    concessions_made: string[];
  };
  outcome: {
    success: boolean;
    beneficiaries: string[];
    relationshipChanges: Record<string, number>;
    reputationImpact: Record<string, number>;
  };
  learningValue: number;
}

export interface SocialContext {
  currentAlliances: Map<string, {
    members: string[];
    strength: number;
    purpose: string;
    duration: number;
    agreements: string[];
  }>;
  reputationMatrix: Map<string, {
    trustworthiness: number;
    competence: number;
    aggressiveness: number;
    predictability: number;
    influence: number;
  }>;
  powerDynamics: {
    leaderboardPosition: Record<string, number>;
    resourceDistribution: Record<string, number>;
    influenceNetwork: Map<string, string[]>;
    coalitionPotential: Record<string, number>;
  };
  groupDynamics: {
    cohesion: number;
    competitiveness: number;
    cooperativeness: number;
    volatility: number;
  };
}

export interface SocialStrategy {
  id: string;
  name: string;
  description: string;
  targetType: 'individual' | 'group' | 'alliance' | 'all';
  objectives: string[];
  tactics: {
    persuasion: string[];
    manipulation: string[];
    cooperation: string[];
    competition: string[];
  };
  triggers: {
    gameStateConditions: any[];
    relationshipConditions: any[];
    personalityFactors: any[];
  };
  expectedOutcomes: {
    relationshipChanges: Record<string, number>;
    gameAdvantages: string[];
    risks: string[];
  };
  adaptationRules: {
    successThreshold: number;
    failureAdaptation: string;
    reinforcementStrategy: string;
  };
}

export interface EmotionalIntelligence {
  selfAwareness: {
    currentEmotionalState: string;
    emotionalTriggers: string[];
    emotionalStrengths: string[];
    emotionalWeaknesses: string[];
  };
  socialAwareness: {
    emotionalContagion: number;      // 情绪感染敏感度
    empathyLevel: number;            // 共情能力
    socialPerception: number;        // 社交感知力
    nonverbalReading: number;        // 非语言信号解读
  };
  relationshipManagement: {
    conflictResolution: number;      // 冲突解决能力
    influenceSkill: number;          // 影响力技巧
    teambuilding: number;            // 团队建设能力
    persuasionPower: number;         // 说服力
  };
  selfRegulation: {
    impulsiveControl: number;        // 冲动控制
    adaptabilitySkill: number;      // 适应技巧
    stressManagement: number;        // 压力管理
    emotionalBalance: number;        // 情绪平衡
  };
}

export class SocialIntelligenceModule {
  private characterProfile: AICharacterProfile;
  private personalitySystem: PersonalitySystem;
  private relationships: Map<string, SocialRelationship> = new Map();
  private socialContext: SocialContext;
  private socialStrategies: Map<string, SocialStrategy> = new Map();
  private emotionalIntelligence: EmotionalIntelligence;
  private interactionHistory: SocialInteraction[] = [];
  private socialMemory: Map<string, any> = new Map();

  constructor(characterProfile: AICharacterProfile, personalitySystem: PersonalitySystem) {
    this.characterProfile = characterProfile;
    this.personalitySystem = personalitySystem;
    
    this.socialContext = this.initializeSocialContext();
    this.emotionalIntelligence = this.initializeEmotionalIntelligence();
    this.initializeSocialStrategies();
  }

  private initializeSocialContext(): SocialContext {
    return {
      currentAlliances: new Map(),
      reputationMatrix: new Map(),
      powerDynamics: {
        leaderboardPosition: {},
        resourceDistribution: {},
        influenceNetwork: new Map(),
        coalitionPotential: {}
      },
      groupDynamics: {
        cohesion: 0.5,
        competitiveness: 0.6,
        cooperativeness: 0.4,
        volatility: 0.3
      }
    };
  }

  private initializeEmotionalIntelligence(): EmotionalIntelligence {
    const traits = this.characterProfile.personalityTraits;
    
    return {
      selfAwareness: {
        currentEmotionalState: 'neutral',
        emotionalTriggers: this.identifyEmotionalTriggers(traits),
        emotionalStrengths: this.identifyEmotionalStrengths(traits),
        emotionalWeaknesses: this.identifyEmotionalWeaknesses(traits)
      },
      socialAwareness: {
        emotionalContagion: traits.emotional * 0.7 + traits.social * 0.3,
        empathyLevel: traits.social * 0.6 + traits.emotional * 0.4,
        socialPerception: traits.social * 0.8 + traits.intuition * 0.2,
        nonverbalReading: traits.intuition * 0.7 + traits.analytical * 0.3
      },
      relationshipManagement: {
        conflictResolution: traits.social * 0.5 + traits.patience * 0.3 + traits.analytical * 0.2,
        influenceSkill: traits.leadership * 0.6 + traits.social * 0.4,
        teambuilding: traits.social * 0.7 + traits.loyalty * 0.3,
        persuasionPower: traits.social * 0.4 + traits.creativity * 0.3 + traits.analytical * 0.3
      },
      selfRegulation: {
        impulsiveControl: traits.patience * 0.8 + traits.analytical * 0.2,
        adaptabilitySkill: traits.adaptability,
        stressManagement: traits.patience * 0.6 + (1 - traits.emotional) * 0.4,
        emotionalBalance: (1 - traits.emotional) * 0.6 + traits.patience * 0.4
      }
    };
  }

  private initializeSocialStrategies(): void {
    const strategies: SocialStrategy[] = [
      {
        id: 'alliance_building',
        name: 'Alliance Building',
        description: 'Form strategic alliances with complementary players',
        targetType: 'individual',
        objectives: ['mutual_benefit', 'resource_sharing', 'risk_mitigation'],
        tactics: {
          persuasion: ['highlight_mutual_benefits', 'offer_concessions', 'build_trust'],
          manipulation: [],
          cooperation: ['share_resources', 'coordinate_strategies', 'mutual_protection'],
          competition: ['compete_against_common_rivals']
        },
        triggers: {
          gameStateConditions: ['mid_game', 'competitive_pressure'],
          relationshipConditions: ['mutual_respect', 'complementary_strengths'],
          personalityFactors: ['high_social', 'moderate_trust']
        },
        expectedOutcomes: {
          relationshipChanges: { trustLevel: 0.2, cooperationHistory: 0.3 },
          gameAdvantages: ['shared_intelligence', 'coordinated_moves', 'mutual_support'],
          risks: ['betrayal_vulnerability', 'dependency_creation']
        },
        adaptationRules: {
          successThreshold: 0.7,
          failureAdaptation: 'increase_selectivity',
          reinforcementStrategy: 'strengthen_bonds'
        }
      },
      {
        id: 'competitive_pressure',
        name: 'Competitive Pressure',
        description: 'Apply strategic pressure on leading opponents',
        targetType: 'individual',
        objectives: ['reduce_threat', 'create_opportunities', 'redistribute_power'],
        tactics: {
          persuasion: ['convince_others_of_threat', 'rally_opposition'],
          manipulation: ['spread_doubt', 'create_paranoia'],
          cooperation: ['coordinate_pressure', 'share_costs'],
          competition: ['direct_competition', 'blocking_moves', 'resource_denial']
        },
        triggers: {
          gameStateConditions: ['opponent_leading', 'power_imbalance'],
          relationshipConditions: ['high_threat_level', 'low_alliance_strength'],
          personalityFactors: ['high_aggression', 'competitive_nature']
        },
        expectedOutcomes: {
          relationshipChanges: { threatLevel: -0.3, respectLevel: 0.1 },
          gameAdvantages: ['position_weakening', 'opportunity_creation'],
          risks: ['retaliation', 'coalition_formation']
        },
        adaptationRules: {
          successThreshold: 0.6,
          failureAdaptation: 'reduce_aggression',
          reinforcementStrategy: 'maintain_pressure'
        }
      },
      {
        id: 'reputation_management',
        name: 'Reputation Management',
        description: 'Build and maintain a positive reputation for future interactions',
        targetType: 'all',
        objectives: ['increase_trustworthiness', 'build_influence', 'create_opportunities'],
        tactics: {
          persuasion: ['demonstrate_reliability', 'showcase_competence'],
          manipulation: [],
          cooperation: ['honor_agreements', 'provide_assistance', 'be_fair'],
          competition: ['compete_honorably', 'show_respect']
        },
        triggers: {
          gameStateConditions: ['early_game', 'reputation_damage'],
          relationshipConditions: ['new_relationships', 'trust_deficit'],
          personalityFactors: ['high_social', 'long_term_thinking']
        },
        expectedOutcomes: {
          relationshipChanges: { trustLevel: 0.15, respectLevel: 0.2 },
          gameAdvantages: ['better_deals', 'more_alliances', 'reduced_hostility'],
          risks: ['perceived_weakness', 'exploitation']
        },
        adaptationRules: {
          successThreshold: 0.8,
          failureAdaptation: 'balance_with_strength',
          reinforcementStrategy: 'consistent_behavior'
        }
      },
      {
        id: 'emotional_manipulation',
        name: 'Emotional Manipulation',
        description: 'Use emotional intelligence to influence others subtly',
        targetType: 'individual',
        objectives: ['gain_advantage', 'reduce_resistance', 'create_dependency'],
        tactics: {
          persuasion: ['emotional_appeals', 'sympathy_plays'],
          manipulation: ['guilt_trips', 'fear_mongering', 'false_friendship'],
          cooperation: ['conditional_support'],
          competition: ['psychological_warfare']
        },
        triggers: {
          gameStateConditions: ['desperate_situation', 'close_competition'],
          relationshipConditions: ['emotional_vulnerability', 'dependency'],
          personalityFactors: ['high_emotional', 'low_ethics', 'high_creativity']
        },
        expectedOutcomes: {
          relationshipChanges: { dependencyLevel: 0.3, trustLevel: -0.1 },
          gameAdvantages: ['compliance', 'favorable_deals', 'reduced_resistance'],
          risks: ['discovery', 'reputation_damage', 'retaliation']
        },
        adaptationRules: {
          successThreshold: 0.5,
          failureAdaptation: 'reduce_intensity',
          reinforcementStrategy: 'subtle_reinforcement'
        }
      }
    ];

    // 根据角色特质过滤策略
    const filteredStrategies = strategies.filter(strategy => 
      this.isStrategyCompatible(strategy)
    );

    filteredStrategies.forEach(strategy => {
      this.socialStrategies.set(strategy.id, strategy);
    });
  }

  private isStrategyCompatible(strategy: SocialStrategy): boolean {
    const traits = this.characterProfile.personalityTraits;
    
    // 根据道德约束过滤
    if (strategy.id === 'emotional_manipulation' && traits.loyalty > 0.7) {
      return false;
    }
    
    // 根据社交能力过滤
    if (strategy.targetType === 'group' && traits.social < 0.5) {
      return false;
    }
    
    // 根据攻击性过滤
    if (strategy.id === 'competitive_pressure' && traits.aggression < 0.4) {
      return false;
    }
    
    return true;
  }

  public processPlayerInteraction(
    playerId: string, 
    interactionType: SocialInteraction['type'],
    content: any,
    gameContext: any
  ): SocialInteraction {
    const interaction: SocialInteraction = {
      id: `interaction_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type: interactionType,
      participants: [this.characterProfile.id, playerId],
      context: {
        gamePhase: gameContext.phase || 'unknown',
        gameState: gameContext.state || {},
        circumstances: gameContext.circumstances || []
      },
      content: {
        ...content,
        emotional_tone: this.determineEmotionalTone(playerId, interactionType, content),
        persuasion_attempts: this.identifyPersuasionAttempts(content),
        concessions_made: this.identifyConcessions(content)
      },
      outcome: {
        success: false, // Will be updated
        beneficiaries: [],
        relationshipChanges: {},
        reputationImpact: {}
      },
      learningValue: 0
    };

    // 处理交互
    this.processInteraction(interaction);
    
    // 更新关系
    this.updateRelationship(playerId, interaction);
    
    // 学习和适应
    this.learnFromInteraction(interaction);
    
    // 存储交互历史
    this.interactionHistory.push(interaction);
    this.limitInteractionHistory();

    return interaction;
  }

  private processInteraction(interaction: SocialInteraction): void {
    const personalityState = this.personalitySystem.getCurrentPersonalityState();
    
    // 评估交互成功度
    interaction.outcome.success = this.evaluateInteractionSuccess(interaction, personalityState);
    
    // 确定受益者
    interaction.outcome.beneficiaries = this.identifyBeneficiaries(interaction);
    
    // 计算关系变化
    interaction.outcome.relationshipChanges = this.calculateRelationshipChanges(interaction);
    
    // 评估声誉影响
    interaction.outcome.reputationImpact = this.assessReputationImpact(interaction);
    
    // 计算学习价值
    interaction.learningValue = this.calculateLearningValue(interaction);
  }

  private updateRelationship(playerId: string, interaction: SocialInteraction): void {
    let relationship = this.relationships.get(playerId);
    
    if (!relationship) {
      relationship = this.createNewRelationship(playerId);
      this.relationships.set(playerId, relationship);
    }

    // 更新关系指标
    const changes = interaction.outcome.relationshipChanges;
    
    if (changes.trustLevel) {
      relationship.trustLevel = Math.max(0, Math.min(1, 
        relationship.trustLevel + changes.trustLevel
      ));
    }
    
    if (changes.respectLevel) {
      relationship.respectLevel = Math.max(0, Math.min(1, 
        relationship.respectLevel + changes.respectLevel
      ));
    }
    
    if (changes.fearLevel) {
      relationship.fearLevel = Math.max(0, Math.min(1, 
        relationship.fearLevel + changes.fearLevel
      ));
    }

    // 更新合作历史
    relationship.cooperationHistory.totalInteractions++;
    
    if (interaction.outcome.success && interaction.outcome.beneficiaries.length > 1) {
      relationship.cooperationHistory.successfulCollaborations++;
    }
    
    if (interaction.type === 'betrayal' || 
        (interaction.content.emotional_tone === 'hostile' && !interaction.outcome.success)) {
      relationship.cooperationHistory.betrayals++;
    }

    // 更新最近交互
    relationship.recentInteractions.push(interaction);
    if (relationship.recentInteractions.length > 10) {
      relationship.recentInteractions = relationship.recentInteractions.slice(-8);
    }

    // 更新关系类型
    relationship.relationshipType = this.determineRelationshipType(relationship);
  }

  private createNewRelationship(playerId: string): SocialRelationship {
    return {
      playerId,
      relationshipType: 'unknown',
      trustLevel: 0.5,
      respectLevel: 0.5,
      fearLevel: 0.1,
      likingLevel: 0.5,
      dependencyLevel: 0.1,
      threatLevel: 0.3,
      cooperationHistory: {
        totalInteractions: 0,
        successfulCollaborations: 0,
        betrayals: 0,
        neutralExchanges: 0
      },
      recentInteractions: [],
      emotionalHistory: []
    };
  }

  public planSocialAction(
    targetPlayerId: string, 
    objective: string, 
    gameContext: any
  ): any {
    const relationship = this.relationships.get(targetPlayerId);
    const applicableStrategies = this.selectApplicableStrategies(
      targetPlayerId, objective, gameContext, relationship
    );

    if (applicableStrategies.length === 0) {
      return this.createDefaultSocialAction(targetPlayerId, objective);
    }

    const selectedStrategy = this.selectBestStrategy(applicableStrategies, relationship, gameContext);
    const socialAction = this.executeStrategy(selectedStrategy, targetPlayerId, objective, gameContext);

    return socialAction;
  }

  private selectApplicableStrategies(
    targetPlayerId: string,
    objective: string,
    gameContext: any,
    relationship?: SocialRelationship
  ): SocialStrategy[] {
    const applicable: SocialStrategy[] = [];
    
    for (const strategy of this.socialStrategies.values()) {
      if (this.isStrategyApplicable(strategy, targetPlayerId, objective, gameContext, relationship)) {
        applicable.push(strategy);
      }
    }

    return applicable;
  }

  private isStrategyApplicable(
    strategy: SocialStrategy,
    targetPlayerId: string,
    objective: string,
    gameContext: any,
    relationship?: SocialRelationship
  ): boolean {
    // 检查目标匹配
    if (!strategy.objectives.includes(objective) && 
        !strategy.objectives.some(obj => objective.includes(obj))) {
      return false;
    }

    // 检查游戏状态条件
    if (strategy.triggers.gameStateConditions.length > 0) {
      const conditionsMet = strategy.triggers.gameStateConditions.some(condition => 
        gameContext.phase === condition || 
        gameContext.circumstances?.includes(condition)
      );
      if (!conditionsMet) return false;
    }

    // 检查关系条件
    if (relationship && strategy.triggers.relationshipConditions.length > 0) {
      const relationshipMet = this.checkRelationshipConditions(
        strategy.triggers.relationshipConditions, relationship
      );
      if (!relationshipMet) return false;
    }

    // 检查人格因素
    if (strategy.triggers.personalityFactors.length > 0) {
      const personalityMet = this.checkPersonalityFactors(strategy.triggers.personalityFactors);
      if (!personalityMet) return false;
    }

    return true;
  }

  private selectBestStrategy(
    strategies: SocialStrategy[],
    relationship?: SocialRelationship,
    gameContext?: any
  ): SocialStrategy {
    if (strategies.length === 1) return strategies[0];

    // 基于成功概率和风险评估选择策略
    const evaluatedStrategies = strategies.map(strategy => ({
      strategy,
      score: this.evaluateStrategyScore(strategy, relationship, gameContext)
    }));

    evaluatedStrategies.sort((a, b) => b.score - a.score);
    return evaluatedStrategies[0].strategy;
  }

  private evaluateStrategyScore(
    strategy: SocialStrategy,
    relationship?: SocialRelationship,
    gameContext?: any
  ): number {
    let score = 0.5;

    // 基于关系历史的成功概率
    if (relationship) {
      const successRate = relationship.cooperationHistory.totalInteractions > 0 ?
        relationship.cooperationHistory.successfulCollaborations / 
        relationship.cooperationHistory.totalInteractions : 0.5;
      
      score += successRate * 0.3;
      
      // 信任度影响
      score += relationship.trustLevel * 0.2;
      
      // 威胁度负面影响
      score -= relationship.threatLevel * 0.1;
    }

    // 基于人格匹配度
    const personalityAlignment = this.calculatePersonalityAlignment(strategy);
    score += personalityAlignment * 0.3;

    // 风险评估
    const riskFactor = strategy.expectedOutcomes.risks.length / 10; // 假设最多10个风险
    score -= riskFactor * 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private executeStrategy(
    strategy: SocialStrategy,
    targetPlayerId: string,
    objective: string,
    gameContext: any
  ): any {
    const emotionalState = this.personalitySystem.getCurrentPersonalityState();
    const relationship = this.relationships.get(targetPlayerId);

    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      targetPlayer: targetPlayerId,
      objective,
      tactics: this.selectTactics(strategy, relationship, emotionalState),
      approach: this.determineApproach(strategy, relationship, emotionalState),
      content: this.generateInteractionContent(strategy, relationship, objective),
      expectedOutcome: strategy.expectedOutcomes,
      confidence: this.calculateActionConfidence(strategy, relationship),
      backup_strategies: this.identifyBackupStrategies(strategy.id, targetPlayerId, objective)
    };
  }

  private selectTactics(
    strategy: SocialStrategy,
    relationship?: SocialRelationship,
    emotionalState?: PersonalityState
  ): string[] {
    const allTactics = [
      ...strategy.tactics.persuasion,
      ...strategy.tactics.cooperation,
      ...strategy.tactics.competition
    ];

    // 基于关系和情绪状态选择合适的策略
    const selectedTactics: string[] = [];

    // 优先合作策略如果关系良好
    if (relationship && relationship.trustLevel > 0.6) {
      selectedTactics.push(...strategy.tactics.cooperation);
    }

    // 如果情绪状态积极，使用说服
    if (emotionalState && emotionalState.confidenceLevel > 0.6) {
      selectedTactics.push(...strategy.tactics.persuasion);
    }

    // 如果威胁度高，使用竞争策略
    if (relationship && relationship.threatLevel > 0.7) {
      selectedTactics.push(...strategy.tactics.competition);
    }

    // 确保至少有一个策略
    if (selectedTactics.length === 0) {
      selectedTactics.push(...strategy.tactics.persuasion);
    }

    return selectedTactics.slice(0, 3); // 最多3个策略
  }

  public updateSocialContext(gameState: any, playerStates: any[]): void {
    // 更新权力动态
    this.updatePowerDynamics(gameState, playerStates);
    
    // 更新联盟状态
    this.updateAllianceStatus();
    
    // 更新声誉矩阵
    this.updateReputationMatrix();
    
    // 评估群体动态
    this.assessGroupDynamics();
  }

  private updatePowerDynamics(gameState: any, playerStates: any[]): void {
    const powerDynamics = this.socialContext.powerDynamics;
    
    // 更新排行榜位置
    playerStates.forEach((player, index) => {
      powerDynamics.leaderboardPosition[player.id] = index + 1;
    });

    // 更新资源分布
    const totalResources = playerStates.reduce((sum, player) => 
      sum + (player.netWorth || 0), 0
    );
    
    playerStates.forEach(player => {
      powerDynamics.resourceDistribution[player.id] = 
        totalResources > 0 ? (player.netWorth || 0) / totalResources : 0;
    });

    // 更新联盟潜力
    this.calculateCoalitionPotential(playerStates);
  }

  private calculateCoalitionPotential(playerStates: any[]): void {
    const powerDynamics = this.socialContext.powerDynamics;
    
    for (const player of playerStates) {
      let coalitionPotential = 0;
      
      // 基于关系质量
      const relationships = Array.from(this.relationships.values())
        .filter(rel => rel.playerId === player.id);
      
      for (const rel of relationships) {
        coalitionPotential += (rel.trustLevel + rel.likingLevel - rel.threatLevel) / 3;
      }
      
      coalitionPotential = Math.max(0, Math.min(1, coalitionPotential / relationships.length));
      powerDynamics.coalitionPotential[player.id] = coalitionPotential;
    }
  }

  public analyzeEmotionalState(playerId: string, observedBehavior: any): any {
    const relationship = this.relationships.get(playerId);
    const emotionalIntel = this.emotionalIntelligence;
    
    const analysis = {
      perceivedEmotion: this.inferEmotionalState(observedBehavior),
      confidence: emotionalIntel.socialAwareness.socialPerception,
      emotionalHistory: relationship?.emotionalHistory.slice(-5) || [],
      predictedReactions: this.predictEmotionalReactions(playerId, observedBehavior),
      manipulationOpportunities: this.identifyEmotionalVulnerabilities(playerId, observedBehavior),
      empathyResponse: this.generateEmpathyResponse(playerId, observedBehavior)
    };

    // 记录情绪历史
    if (relationship) {
      relationship.emotionalHistory.push({
        timestamp: Date.now(),
        emotion: analysis.perceivedEmotion,
        intensity: observedBehavior.intensity || 0.5,
        trigger: observedBehavior.trigger || 'unknown'
      });

      // 限制历史长度
      if (relationship.emotionalHistory.length > 20) {
        relationship.emotionalHistory = relationship.emotionalHistory.slice(-15);
      }
    }

    return analysis;
  }

  public generatePersuasionStrategy(
    playerId: string, 
    goal: string, 
    constraints: string[] = []
  ): any {
    const relationship = this.relationships.get(playerId);
    const emotionalIntel = this.emotionalIntelligence;
    
    if (!relationship) {
      return this.createDefaultPersuasionStrategy(goal);
    }

    const strategy = {
      primaryApproach: this.selectPersuasionApproach(relationship, goal),
      arguments: this.generateArguments(relationship, goal),
      emotionalAppeals: this.createEmotionalAppeals(relationship, goal),
      concessions: this.identifyPossibleConcessions(relationship, goal),
      timing: this.optimizePersuasionTiming(relationship),
      fallbackOptions: this.createFallbackOptions(relationship, goal),
      manipulationTactics: constraints.includes('no_manipulation') ? [] : 
        this.generateManipulationTactics(relationship, goal),
      expectedResistance: this.predictResistance(relationship, goal),
      successProbability: this.calculatePersuasionProbability(relationship, goal)
    };

    return strategy;
  }

  // 辅助方法实现
  private identifyEmotionalTriggers(traits: PersonalityTraits): string[] {
    const triggers: string[] = [];
    
    if (traits.emotional > 0.7) triggers.push('criticism', 'unfairness', 'betrayal');
    if (traits.aggression > 0.7) triggers.push('disrespect', 'challenges', 'blocking');
    if (traits.social > 0.7) triggers.push('exclusion', 'rejection', 'isolation');
    if (traits.analytical > 0.7) triggers.push('illogical_arguments', 'inconsistency');
    
    return triggers;
  }

  private identifyEmotionalStrengths(traits: PersonalityTraits): string[] {
    const strengths: string[] = [];
    
    if (traits.social > 0.7) strengths.push('empathy', 'communication', 'relationship_building');
    if (traits.patience > 0.7) strengths.push('emotional_stability', 'conflict_resolution');
    if (traits.adaptability > 0.7) strengths.push('emotional_flexibility', 'quick_recovery');
    
    return strengths;
  }

  private identifyEmotionalWeaknesses(traits: PersonalityTraits): string[] {
    const weaknesses: string[] = [];
    
    if (traits.emotional > 0.8) weaknesses.push('emotional_volatility', 'decision_bias');
    if (traits.aggression > 0.8) weaknesses.push('anger_management', 'relationship_damage');
    if (traits.social < 0.3) weaknesses.push('social_blindness', 'communication_issues');
    
    return weaknesses;
  }

  private determineEmotionalTone(
    playerId: string, 
    interactionType: SocialInteraction['type'], 
    content: any
  ): SocialInteraction['content']['emotional_tone'] {
    const relationship = this.relationships.get(playerId);
    const personalityState = this.personalitySystem.getCurrentPersonalityState();
    
    // 基于关系和人格状态确定情绪基调
    if (relationship && relationship.trustLevel > 0.7) return 'friendly';
    if (relationship && relationship.threatLevel > 0.7) return 'hostile';
    if (personalityState.stressLevel > 0.7) return 'desperate';
    if (interactionType === 'trade_negotiation' && content.manipulative) return 'manipulative';
    
    return 'neutral';
  }

  private identifyPersuasionAttempts(content: any): string[] {
    const attempts: string[] = [];
    
    if (content.benefits_highlighted) attempts.push('benefit_emphasis');
    if (content.risks_minimized) attempts.push('risk_downplay');
    if (content.urgency_created) attempts.push('urgency_creation');
    if (content.social_proof) attempts.push('social_validation');
    
    return attempts;
  }

  private identifyConcessions(content: any): string[] {
    const concessions: string[] = [];
    
    if (content.price_reduction) concessions.push('financial_concession');
    if (content.additional_benefits) concessions.push('value_addition');
    if (content.timeline_flexibility) concessions.push('timing_flexibility');
    
    return concessions;
  }

  private evaluateInteractionSuccess(
    interaction: SocialInteraction,
    personalityState: PersonalityState
  ): boolean {
    // 简化的成功评估
    const baseSuccessRate = 0.5;
    let modifiers = 0;
    
    if (interaction.content.emotional_tone === 'friendly') modifiers += 0.2;
    if (interaction.content.emotional_tone === 'hostile') modifiers -= 0.3;
    if (interaction.content.concessions_made.length > 0) modifiers += 0.1;
    if (personalityState.confidenceLevel > 0.7) modifiers += 0.1;
    
    return Math.random() < (baseSuccessRate + modifiers);
  }

  private identifyBeneficiaries(interaction: SocialInteraction): string[] {
    if (interaction.outcome.success) {
      return interaction.participants;
    } else {
      // 随机选择一个受益者，或基于更复杂的逻辑
      return [interaction.participants[Math.floor(Math.random() * interaction.participants.length)]];
    }
  }

  private calculateRelationshipChanges(interaction: SocialInteraction): Record<string, number> {
    const changes: Record<string, number> = {};
    
    if (interaction.outcome.success) {
      changes.trustLevel = 0.05;
      changes.respectLevel = 0.03;
    } else {
      changes.trustLevel = -0.03;
      changes.respectLevel = -0.02;
    }
    
    if (interaction.type === 'betrayal') {
      changes.trustLevel = -0.2;
      changes.threatLevel = 0.1;
    }
    
    return changes;
  }

  private assessReputationImpact(interaction: SocialInteraction): Record<string, number> {
    const impact: Record<string, number> = {};
    
    // 基于交互类型和结果评估声誉影响
    if (interaction.outcome.success && interaction.type === 'cooperation') {
      impact.trustworthiness = 0.05;
      impact.competence = 0.03;
    }
    
    if (!interaction.outcome.success && interaction.type === 'trade_negotiation') {
      impact.competence = -0.02;
    }
    
    return impact;
  }

  private calculateLearningValue(interaction: SocialInteraction): number {
    let value = 0.5;
    
    // 意外结果增加学习价值
    if (interaction.outcome.success !== this.predictedOutcome(interaction)) {
      value += 0.3;
    }
    
    // 复杂交互增加学习价值
    if (interaction.content.persuasion_attempts.length > 2) {
      value += 0.2;
    }
    
    return Math.min(1, value);
  }

  private predictedOutcome(interaction: SocialInteraction): boolean {
    // 简化的结果预测
    return Math.random() > 0.5;
  }

  private determineRelationshipType(relationship: SocialRelationship): SocialRelationship['relationshipType'] {
    const trust = relationship.trustLevel;
    const threat = relationship.threatLevel;
    const cooperation = relationship.cooperationHistory.successfulCollaborations / 
                       Math.max(1, relationship.cooperationHistory.totalInteractions);
    
    if (trust > 0.7 && cooperation > 0.6) return 'ally';
    if (threat > 0.7 || relationship.cooperationHistory.betrayals > 2) return 'enemy';
    if (threat > 0.5 && trust < 0.4) return 'rival';
    if (trust < 0.3 && cooperation < 0.3) return 'neutral';
    
    return 'neutral';
  }

  private checkRelationshipConditions(conditions: any[], relationship: SocialRelationship): boolean {
    return conditions.some(condition => {
      if (condition === 'mutual_respect') return relationship.respectLevel > 0.6;
      if (condition === 'high_trust') return relationship.trustLevel > 0.7;
      if (condition === 'low_threat') return relationship.threatLevel < 0.3;
      return false;
    });
  }

  private checkPersonalityFactors(factors: any[]): boolean {
    const traits = this.characterProfile.personalityTraits;
    
    return factors.some(factor => {
      if (factor === 'high_social') return traits.social > 0.7;
      if (factor === 'high_aggression') return traits.aggression > 0.7;
      if (factor === 'moderate_trust') return traits.loyalty > 0.4 && traits.loyalty < 0.8;
      return false;
    });
  }

  private calculatePersonalityAlignment(strategy: SocialStrategy): number {
    // 计算策略与人格的匹配度
    return 0.7; // 占位符实现
  }

  private createDefaultSocialAction(playerId: string, objective: string): any {
    return {
      strategyId: 'default',
      strategyName: 'Default Interaction',
      targetPlayer: playerId,
      objective,
      tactics: ['direct_communication'],
      approach: 'neutral',
      confidence: 0.5
    };
  }

  private determineApproach(
    strategy: SocialStrategy,
    relationship?: SocialRelationship,
    emotionalState?: PersonalityState
  ): string {
    if (relationship && relationship.trustLevel > 0.7) return 'collaborative';
    if (strategy.id === 'competitive_pressure') return 'aggressive';
    if (emotionalState && emotionalState.stressLevel > 0.7) return 'cautious';
    return 'balanced';
  }

  private generateInteractionContent(
    strategy: SocialStrategy,
    relationship?: SocialRelationship,
    objective?: string
  ): any {
    return {
      message: `Executing ${strategy.name} strategy for ${objective}`,
      tone: relationship && relationship.trustLevel > 0.6 ? 'friendly' : 'professional',
      urgency: 'medium'
    };
  }

  private calculateActionConfidence(
    strategy: SocialStrategy,
    relationship?: SocialRelationship
  ): number {
    let confidence = 0.5;
    
    if (relationship) {
      confidence += relationship.trustLevel * 0.3;
      confidence -= relationship.threatLevel * 0.2;
    }
    
    const alignment = this.calculatePersonalityAlignment(strategy);
    confidence += alignment * 0.2;
    
    return Math.max(0.1, Math.min(0.9, confidence));
  }

  private identifyBackupStrategies(
    primaryStrategyId: string,
    targetPlayerId: string,
    objective: string
  ): string[] {
    const backups: string[] = [];
    
    for (const [id, strategy] of this.socialStrategies.entries()) {
      if (id !== primaryStrategyId && strategy.objectives.includes(objective)) {
        backups.push(id);
      }
    }
    
    return backups.slice(0, 2); // 最多2个备选策略
  }

  private limitInteractionHistory(): void {
    if (this.interactionHistory.length > 500) {
      this.interactionHistory = this.interactionHistory.slice(-400);
    }
  }

  private updateAllianceStatus(): void {
    // 更新联盟状态
    // 占位符实现
  }

  private updateReputationMatrix(): void {
    // 更新声誉矩阵
    // 占位符实现
  }

  private assessGroupDynamics(): void {
    // 评估群体动态
    // 占位符实现
  }

  private inferEmotionalState(observedBehavior: any): string {
    // 推断情绪状态
    return 'neutral'; // 占位符实现
  }

  private predictEmotionalReactions(playerId: string, behavior: any): string[] {
    // 预测情绪反应
    return ['neutral_response']; // 占位符实现
  }

  private identifyEmotionalVulnerabilities(playerId: string, behavior: any): string[] {
    // 识别情绪弱点
    return []; // 占位符实现
  }

  private generateEmpathyResponse(playerId: string, behavior: any): any {
    // 生成共情响应
    return { type: 'understanding', message: 'I understand your situation' };
  }

  private createDefaultPersuasionStrategy(goal: string): any {
    return {
      primaryApproach: 'direct',
      arguments: ['logical_benefit'],
      successProbability: 0.5
    };
  }

  private selectPersuasionApproach(relationship: SocialRelationship, goal: string): string {
    if (relationship.trustLevel > 0.7) return 'collaborative';
    if (relationship.threatLevel > 0.6) return 'cautious';
    return 'direct';
  }

  private generateArguments(relationship: SocialRelationship, goal: string): string[] {
    const argumentList: string[] = [];
    
    if (relationship.trustLevel > 0.6) {
      argumentList.push('mutual_benefit', 'shared_goals');
    } else {
      argumentList.push('logical_advantage', 'risk_mitigation');
    }
    
    return argumentList;
  }

  private createEmotionalAppeals(relationship: SocialRelationship, goal: string): string[] {
    const appeals: string[] = [];
    
    if (relationship.likingLevel > 0.6) {
      appeals.push('friendship_appeal', 'trust_appeal');
    }
    
    if (relationship.respectLevel > 0.7) {
      appeals.push('reputation_appeal');
    }
    
    return appeals;
  }

  private identifyPossibleConcessions(relationship: SocialRelationship, goal: string): string[] {
    return ['timing_flexibility', 'additional_benefits'];
  }

  private optimizePersuasionTiming(relationship: SocialRelationship): string {
    return relationship.cooperationHistory.totalInteractions > 0 ? 'after_success' : 'immediate';
  }

  private createFallbackOptions(relationship: SocialRelationship, goal: string): string[] {
    return ['alternative_proposal', 'delayed_negotiation'];
  }

  private generateManipulationTactics(relationship: SocialRelationship, goal: string): string[] {
    if (relationship.dependencyLevel > 0.5) {
      return ['leverage_dependency', 'create_urgency'];
    }
    return [];
  }

  private predictResistance(relationship: SocialRelationship, goal: string): string {
    if (relationship.threatLevel > 0.6) return 'high';
    if (relationship.trustLevel < 0.4) return 'medium';
    return 'low';
  }

  private calculatePersuasionProbability(relationship: SocialRelationship, goal: string): number {
    let probability = 0.5;
    
    probability += relationship.trustLevel * 0.3;
    probability += relationship.respectLevel * 0.2;
    probability -= relationship.threatLevel * 0.2;
    
    const cooperationRate = relationship.cooperationHistory.totalInteractions > 0 ?
      relationship.cooperationHistory.successfulCollaborations / relationship.cooperationHistory.totalInteractions : 0.5;
    
    probability += cooperationRate * 0.2;
    
    return Math.max(0.1, Math.min(0.9, probability));
  }

  public getSocialAnalytics(): any {
    return {
      relationships: Object.fromEntries(this.relationships),
      socialContext: this.socialContext,
      emotionalIntelligence: this.emotionalIntelligence,
      activeStrategies: Array.from(this.socialStrategies.keys()),
      interactionStats: {
        totalInteractions: this.interactionHistory.length,
        successRate: this.interactionHistory.filter(i => i.outcome.success).length / Math.max(1, this.interactionHistory.length),
        averageLearningValue: this.interactionHistory.reduce((sum, i) => sum + i.learningValue, 0) / Math.max(1, this.interactionHistory.length)
      }
    };
  }

  public cleanup(): void {
    this.relationships.clear();
    this.interactionHistory = [];
    this.socialMemory.clear();
  }
}