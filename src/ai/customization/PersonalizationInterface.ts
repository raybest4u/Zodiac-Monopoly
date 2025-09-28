import { AICharacterProfile, PersonalityTraits, GameplayPreferences, ZodiacSign } from '../personality/AICharacterGenerator';
import { PersonalitySystem, PersonalityState } from '../personality/PersonalitySystem';
import { BehaviorPatternEngine } from '../behavior/BehaviorPatternEngine';
import { AdaptiveLearningSystem } from '../learning/AdaptiveLearningSystem';

export interface CustomizationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'beginner_friendly' | 'competitive' | 'social' | 'analytical' | 'creative' | 'custom';
  presetTraits: Partial<PersonalityTraits>;
  presetPreferences: Partial<GameplayPreferences>;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert';
  recommendedFor: string[];
  tags: string[];
}

export interface CustomizationOptions {
  personalityAdjustments: {
    traits: Partial<PersonalityTraits>;
    sliders: {
      trait: keyof PersonalityTraits;
      value: number;              // 0-100
      locked: boolean;            // 是否锁定
      influence: number;          // 影响权重 0-1
    }[];
  };
  behaviorSettings: {
    aggressiveness: number;       // 0-100
    riskTolerance: number;        // 0-100
    socialness: number;           // 0-100
    adaptability: number;         // 0-100
    learningSpeed: number;        // 0-100
  };
  gameplayStyle: {
    propertyFocus: GameplayPreferences['propertyFocus'];
    negotiationStyle: GameplayPreferences['negotiationStyle'];
    riskManagement: GameplayPreferences['riskManagement'];
    decisionSpeed: 'instant' | 'quick' | 'normal' | 'deliberate';
    strategicDepth: 'simple' | 'moderate' | 'complex' | 'expert';
  };
  appearance: {
    zodiacTheme: boolean;
    customName?: string;
    customAvatar?: {
      style: string;
      colors: string[];
      accessories: string[];
    };
    voiceSettings: {
      formality: 'casual' | 'professional' | 'quirky';
      verbosity: 'brief' | 'normal' | 'detailed';
      personality: 'friendly' | 'neutral' | 'competitive';
    };
  };
  constraints: {
    personalityBounds: {
      minValue: number;           // 最小特质值
      maxValue: number;           // 最大特质值
      balanceRequired: boolean;   // 是否需要平衡
    };
    behaviorLimits: {
      noExtremeAggression: boolean;
      fairPlayOnly: boolean;
      respectfulCommunication: boolean;
    };
    learningConstraints: {
      maxAdaptationRate: number;  // 最大适应速率
      retainCorePersonality: boolean;
      learningFocus: string[];    // 学习重点
    };
  };
}

export interface PersonalizationSession {
  id: string;
  userId: string;
  characterId: string;
  startTime: number;
  currentStep: 'zodiac_selection' | 'trait_adjustment' | 'behavior_tuning' | 'appearance_customization' | 'final_review';
  customizationHistory: {
    timestamp: number;
    step: string;
    changes: any;
    userFeedback?: string;
  }[];
  finalConfiguration: CustomizationOptions;
  previewResults?: {
    personalityProfile: AICharacterProfile;
    behaviorPredictions: any;
    compatibilityScore: number;
  };
}

export interface CustomizationRecommendation {
  type: 'personality_adjustment' | 'behavior_modification' | 'learning_optimization' | 'appearance_enhancement';
  title: string;
  description: string;
  rationale: string;
  impact: {
    gameplayEffect: string;
    personalityChange: string;
    difficultyAdjustment: string;
  };
  confidence: number;             // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementation: {
    changes: any;
    reversible: boolean;
    timeToEffect: number;       // 分钟
  };
}

export class PersonalizationInterface {
  private predefinedTemplates: Map<string, CustomizationTemplate> = new Map();
  private activeSessions: Map<string, PersonalizationSession> = new Map();
  private userProfiles: Map<string, any> = new Map();

  constructor() {
    this.initializePredefinedTemplates();
  }

  private initializePredefinedTemplates(): void {
    const templates: CustomizationTemplate[] = [
      {
        id: 'friendly_newcomer',
        name: 'Friendly Newcomer',
        description: 'A welcoming, patient AI that helps new players learn the game',
        category: 'beginner_friendly',
        presetTraits: {
          patience: 0.9,
          social: 0.8,
          aggression: 0.2,
          analytical: 0.6,
          adaptability: 0.7
        },
        presetPreferences: {
          negotiationStyle: 'diplomatic',
          riskManagement: 'conservative',
          timeDecisionMaking: 'deliberate'
        },
        difficultyLevel: 'easy',
        recommendedFor: ['新手玩家', '学习模式', '休闲游戏'],
        tags: ['friendly', 'patient', 'educational', 'supportive']
      },
      {
        id: 'competitive_challenger',
        name: 'Competitive Challenger',
        description: 'An aggressive, strategic AI that provides intense competition',
        category: 'competitive',
        presetTraits: {
          aggression: 0.8,
          analytical: 0.9,
          risktaking: 0.7,
          leadership: 0.8,
          adaptability: 0.6
        },
        presetPreferences: {
          negotiationStyle: 'aggressive',
          riskManagement: 'aggressive',
          timeDecisionMaking: 'quick',
          propertyFocus: 'monopoly_building'
        },
        difficultyLevel: 'hard',
        recommendedFor: ['经验玩家', '竞技模式', '挑战爱好者'],
        tags: ['competitive', 'strategic', 'aggressive', 'challenging']
      },
      {
        id: 'social_networker',
        name: 'Social Networker',
        description: 'A charismatic AI focused on building alliances and social manipulation',
        category: 'social',
        presetTraits: {
          social: 0.9,
          adaptability: 0.8,
          emotional: 0.6,
          creativity: 0.7,
          leadership: 0.7
        },
        presetPreferences: {
          negotiationStyle: 'diplomatic',
          socialApproach: 'collaborative',
          timeDecisionMaking: 'variable'
        },
        difficultyLevel: 'medium',
        recommendedFor: ['社交玩家', '联盟游戏', '协商爱好者'],
        tags: ['social', 'diplomatic', 'alliance-building', 'charismatic']
      },
      {
        id: 'analytical_optimizer',
        name: 'Analytical Optimizer',
        description: 'A data-driven AI that makes calculated, optimal decisions',
        category: 'analytical',
        presetTraits: {
          analytical: 0.95,
          patience: 0.8,
          risktaking: 0.3,
          independence: 0.8,
          creativity: 0.4
        },
        presetPreferences: {
          negotiationStyle: 'calculative',
          riskManagement: 'moderate',
          timeDecisionMaking: 'deliberate',
          resourceAllocation: 'development_focused'
        },
        difficultyLevel: 'expert',
        recommendedFor: ['策略玩家', '分析爱好者', '优化游戏'],
        tags: ['analytical', 'calculated', 'optimal', 'methodical']
      },
      {
        id: 'creative_wildcard',
        name: 'Creative Wildcard',
        description: 'An unpredictable AI that uses unconventional strategies',
        category: 'creative',
        presetTraits: {
          creativity: 0.9,
          adaptability: 0.8,
          risktaking: 0.8,
          intuition: 0.8,
          independence: 0.7
        },
        presetPreferences: {
          negotiationStyle: 'emotional',
          riskManagement: 'chaotic',
          timeDecisionMaking: 'impulsive'
        },
        difficultyLevel: 'medium',
        recommendedFor: ['创新玩家', '变化游戏', '惊喜体验'],
        tags: ['creative', 'unpredictable', 'innovative', 'surprising']
      }
    ];

    templates.forEach(template => {
      this.predefinedTemplates.set(template.id, template);
    });
  }

  public startPersonalizationSession(userId: string, initialPreferences?: any): string {
    const sessionId = `session_${userId}_${Date.now()}`;
    
    const session: PersonalizationSession = {
      id: sessionId,
      userId,
      characterId: '',
      startTime: Date.now(),
      currentStep: 'zodiac_selection',
      customizationHistory: [],
      finalConfiguration: this.createDefaultConfiguration(),
      previewResults: undefined
    };

    this.activeSessions.set(sessionId, session);
    
    // 如果有初始偏好，应用它们
    if (initialPreferences) {
      this.applyInitialPreferences(session, initialPreferences);
    }

    return sessionId;
  }

  private createDefaultConfiguration(): CustomizationOptions {
    return {
      personalityAdjustments: {
        traits: {},
        sliders: Object.keys({
          aggression: 0,
          risktaking: 0,
          patience: 0,
          analytical: 0,
          social: 0,
          adaptability: 0,
          intuition: 0,
          emotional: 0,
          leadership: 0,
          creativity: 0,
          loyalty: 0,
          independence: 0
        } as PersonalityTraits).map(trait => ({
          trait: trait as keyof PersonalityTraits,
          value: 50,
          locked: false,
          influence: 1.0
        }))
      },
      behaviorSettings: {
        aggressiveness: 50,
        riskTolerance: 50,
        socialness: 50,
        adaptability: 50,
        learningSpeed: 50
      },
      gameplayStyle: {
        propertyFocus: 'diverse_portfolio',
        negotiationStyle: 'diplomatic',
        riskManagement: 'moderate',
        decisionSpeed: 'normal',
        strategicDepth: 'moderate'
      },
      appearance: {
        zodiacTheme: true,
        voiceSettings: {
          formality: 'casual',
          verbosity: 'normal',
          personality: 'friendly'
        }
      },
      constraints: {
        personalityBounds: {
          minValue: 0.1,
          maxValue: 0.9,
          balanceRequired: false
        },
        behaviorLimits: {
          noExtremeAggression: true,
          fairPlayOnly: true,
          respectfulCommunication: true
        },
        learningConstraints: {
          maxAdaptationRate: 0.2,
          retainCorePersonality: true,
          learningFocus: ['win_rate_optimization', 'social_influence']
        }
      }
    };
  }

  public applyTemplate(sessionId: string, templateId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    const template = this.predefinedTemplates.get(templateId);
    
    if (!session || !template) return false;

    // 应用模板设置
    this.applyTemplateToConfiguration(session.finalConfiguration, template);
    
    // 记录历史
    session.customizationHistory.push({
      timestamp: Date.now(),
      step: 'template_application',
      changes: { templateId, templateName: template.name }
    });

    return true;
  }

  private applyTemplateToConfiguration(
    config: CustomizationOptions, 
    template: CustomizationTemplate
  ): void {
    // 应用预设特质
    for (const [trait, value] of Object.entries(template.presetTraits)) {
      const slider = config.personalityAdjustments.sliders.find(s => s.trait === trait);
      if (slider) {
        slider.value = Math.round(value * 100);
      }
      config.personalityAdjustments.traits[trait as keyof PersonalityTraits] = value;
    }

    // 应用预设偏好
    Object.assign(config.gameplayStyle, template.presetPreferences);

    // 根据难度级别调整行为设置
    const difficultyMultipliers = {
      easy: { aggressiveness: 0.3, riskTolerance: 0.3, adaptability: 0.7, learningSpeed: 0.8 },
      medium: { aggressiveness: 0.5, riskTolerance: 0.5, adaptability: 0.6, learningSpeed: 0.6 },
      hard: { aggressiveness: 0.7, riskTolerance: 0.7, adaptability: 0.5, learningSpeed: 0.4 },
      expert: { aggressiveness: 0.8, riskTolerance: 0.6, adaptability: 0.3, learningSpeed: 0.2 }
    };

    const multipliers = difficultyMultipliers[template.difficultyLevel];
    for (const [setting, multiplier] of Object.entries(multipliers)) {
      config.behaviorSettings[setting as keyof typeof config.behaviorSettings] = 
        Math.round(multiplier * 100);
    }
  }

  public updatePersonalityTrait(
    sessionId: string, 
    trait: keyof PersonalityTraits, 
    value: number
  ): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const config = session.finalConfiguration;
    const slider = config.personalityAdjustments.sliders.find(s => s.trait === trait);
    
    if (slider && !slider.locked) {
      const oldValue = slider.value;
      slider.value = Math.max(0, Math.min(100, value));
      config.personalityAdjustments.traits[trait] = slider.value / 100;

      // 记录历史
      session.customizationHistory.push({
        timestamp: Date.now(),
        step: 'trait_adjustment',
        changes: { trait, oldValue, newValue: slider.value }
      });

      // 检查并应用约束
      this.applyPersonalityConstraints(config);
      
      return true;
    }

    return false;
  }

  public updateBehaviorSetting(
    sessionId: string, 
    setting: keyof CustomizationOptions['behaviorSettings'], 
    value: number
  ): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const config = session.finalConfiguration;
    const oldValue = config.behaviorSettings[setting];
    config.behaviorSettings[setting] = Math.max(0, Math.min(100, value));

    // 记录历史
    session.customizationHistory.push({
      timestamp: Date.now(),
      step: 'behavior_adjustment',
      changes: { setting, oldValue, newValue: config.behaviorSettings[setting] }
    });

    return true;
  }

  public generateRecommendations(sessionId: string): CustomizationRecommendation[] {
    const session = this.activeSessions.get(sessionId);
    if (!session) return [];

    const recommendations: CustomizationRecommendation[] = [];
    const config = session.finalConfiguration;

    // 分析当前配置并生成推荐
    recommendations.push(...this.analyzePersonalityBalance(config));
    recommendations.push(...this.analyzeBehaviorCoherence(config));
    recommendations.push(...this.analyzeGameplayConsistency(config));
    recommendations.push(...this.analyzeUserCompatibility(session.userId, config));

    // 按优先级和置信度排序
    return recommendations.sort((a, b) => {
      const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
      const scoreA = priorityWeights[a.priority] * a.confidence;
      const scoreB = priorityWeights[b.priority] * b.confidence;
      return scoreB - scoreA;
    });
  }

  private analyzePersonalityBalance(config: CustomizationOptions): CustomizationRecommendation[] {
    const recommendations: CustomizationRecommendation[] = [];
    const traits = config.personalityAdjustments.traits;

    // 检查极端值
    for (const [trait, value] of Object.entries(traits)) {
      if (value && (value > 0.9 || value < 0.1)) {
        recommendations.push({
          type: 'personality_adjustment',
          title: `${trait} 特质过于极端`,
          description: `${trait} 值为 ${(value * 100).toFixed(0)}%，可能导致行为过于单一`,
          rationale: '极端的人格特质可能限制AI的适应性和游戏乐趣',
          impact: {
            gameplayEffect: '可能导致可预测和单调的游戏行为',
            personalityChange: `降低 ${trait} 特质的极端程度`,
            difficultyAdjustment: '可能影响游戏难度的平衡性'
          },
          confidence: 0.8,
          priority: 'medium',
          implementation: {
            changes: { [trait]: value > 0.5 ? 0.7 : 0.3 },
            reversible: true,
            timeToEffect: 1
          }
        });
      }
    }

    // 检查特质冲突
    if (traits.patience && traits.risktaking && traits.patience > 0.8 && traits.risktaking > 0.8) {
      recommendations.push({
        type: 'personality_adjustment',
        title: '耐心与冒险特质冲突',
        description: '高耐心和高冒险精神可能导致内在决策冲突',
        rationale: '相互矛盾的特质会降低AI行为的一致性',
        impact: {
          gameplayEffect: 'AI可能表现出前后不一致的决策模式',
          personalityChange: '建议平衡这两个特质',
          difficultyAdjustment: '可能影响AI的决策质量'
        },
        confidence: 0.7,
        priority: 'high',
        implementation: {
          changes: { patience: 0.6, risktaking: 0.6 },
          reversible: true,
          timeToEffect: 2
        }
      });
    }

    return recommendations;
  }

  private analyzeBehaviorCoherence(config: CustomizationOptions): CustomizationRecommendation[] {
    const recommendations: CustomizationRecommendation[] = [];
    const behavior = config.behaviorSettings;
    const gameplay = config.gameplayStyle;

    // 检查行为设置与游戏风格的一致性
    if (behavior.aggressiveness < 30 && gameplay.negotiationStyle === 'aggressive') {
      recommendations.push({
        type: 'behavior_modification',
        title: '攻击性设置与谈判风格不匹配',
        description: '低攻击性设置与攻击性谈判风格产生矛盾',
        rationale: '行为设置应该与游戏风格保持一致',
        impact: {
          gameplayEffect: 'AI在谈判中可能表现不自然',
          personalityChange: '无人格变化',
          difficultyAdjustment: '可能降低AI的谈判效果'
        },
        confidence: 0.9,
        priority: 'high',
        implementation: {
          changes: { aggressiveness: 60 },
          reversible: true,
          timeToEffect: 1
        }
      });
    }

    return recommendations;
  }

  private analyzeGameplayConsistency(config: CustomizationOptions): CustomizationRecommendation[] {
    const recommendations: CustomizationRecommendation[] = [];
    const gameplay = config.gameplayStyle;

    // 检查游戏风格的内在一致性
    if (gameplay.riskManagement === 'conservative' && gameplay.decisionSpeed === 'instant') {
      recommendations.push({
        type: 'behavior_modification',
        title: '保守风险管理与即时决策矛盾',
        description: '保守的风险管理通常需要更多思考时间',
        rationale: '决策速度应该与风险管理风格相匹配',
        impact: {
          gameplayEffect: 'AI可能做出不符合其风险偏好的快速决策',
          personalityChange: '无直接人格影响',
          difficultyAdjustment: '可能影响AI的决策质量'
        },
        confidence: 0.8,
        priority: 'medium',
        implementation: {
          changes: { decisionSpeed: 'deliberate' },
          reversible: true,
          timeToEffect: 1
        }
      });
    }

    return recommendations;
  }

  private analyzeUserCompatibility(userId: string, config: CustomizationOptions): CustomizationRecommendation[] {
    const recommendations: CustomizationRecommendation[] = [];
    const userProfile = this.userProfiles.get(userId);

    if (userProfile) {
      // 基于用户历史偏好提供建议
      if (userProfile.preferredDifficulty === 'easy' && config.behaviorSettings.aggressiveness > 70) {
        recommendations.push({
          type: 'behavior_modification',
          title: 'AI攻击性可能过高',
          description: '基于您的游戏偏好，当前AI可能过于激进',
          rationale: '根据您之前的游戏记录，您倾向于较为轻松的游戏体验',
          impact: {
            gameplayEffect: '可能提供过于激烈的竞争',
            personalityChange: '降低攻击性特质',
            difficultyAdjustment: '降低游戏难度'
          },
          confidence: 0.75,
          priority: 'medium',
          implementation: {
            changes: { aggressiveness: 40 },
            reversible: true,
            timeToEffect: 1
          }
        });
      }
    }

    return recommendations;
  }

  public generatePreview(sessionId: string): any {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const config = session.finalConfiguration;
    
    // 生成预览角色
    const previewCharacter = this.createPreviewCharacter(config);
    
    // 预测行为模式
    const behaviorPredictions = this.predictBehaviorPatterns(config);
    
    // 计算兼容性分数
    const compatibilityScore = this.calculateCompatibilityScore(session.userId, config);

    const previewResults = {
      personalityProfile: previewCharacter,
      behaviorPredictions,
      compatibilityScore
    };

    session.previewResults = previewResults;
    return previewResults;
  }

  private createPreviewCharacter(config: CustomizationOptions): any {
    // 基于配置创建预览角色
    return {
      name: config.appearance.customName || 'Preview AI',
      personalityTraits: config.personalityAdjustments.traits,
      gameplayPreferences: config.gameplayStyle,
      behaviorSettings: config.behaviorSettings,
      appearance: config.appearance,
      estimatedDifficulty: this.estimateDifficulty(config)
    };
  }

  private predictBehaviorPatterns(config: CustomizationOptions): any {
    const traits = config.personalityAdjustments.traits;
    const behavior = config.behaviorSettings;

    return {
      decisionMaking: {
        speed: this.mapDecisionSpeed(config.gameplayStyle.decisionSpeed),
        analytical: (traits.analytical || 0.5) * 100,
        emotional: (traits.emotional || 0.5) * 100
      },
      social: {
        cooperativeness: behavior.socialness,
        trustworthiness: (traits.loyalty || 0.5) * 100,
        manipulative: Math.max(0, behavior.aggressiveness - 50)
      },
      riskBehavior: {
        riskTaking: behavior.riskTolerance,
        calculated: (traits.analytical || 0.5) * behavior.riskTolerance / 100,
        impulsive: (1 - (traits.patience || 0.5)) * behavior.riskTolerance / 100
      },
      adaptability: {
        learningSpeed: behavior.learningSpeed,
        flexibility: behavior.adaptability,
        stubbornness: Math.max(0, 100 - behavior.adaptability)
      }
    };
  }

  private calculateCompatibilityScore(userId: string, config: CustomizationOptions): number {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return 0.7; // 默认兼容性

    let score = 0.5;
    
    // 基于用户偏好调整分数
    if (userProfile.preferredDifficulty) {
      const configDifficulty = this.estimateDifficulty(config);
      const difficultyMatch = 1 - Math.abs(
        this.mapDifficultyToNumber(userProfile.preferredDifficulty) - 
        this.mapDifficultyToNumber(configDifficulty)
      ) / 3;
      score += difficultyMatch * 0.3;
    }

    if (userProfile.preferredSocialLevel) {
      const socialMatch = 1 - Math.abs(userProfile.preferredSocialLevel - config.behaviorSettings.socialness) / 100;
      score += socialMatch * 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private estimateDifficulty(config: CustomizationOptions): 'easy' | 'medium' | 'hard' | 'expert' {
    const aggression = config.behaviorSettings.aggressiveness;
    const risk = config.behaviorSettings.riskTolerance;
    const adaptability = config.behaviorSettings.adaptability;
    const analytical = (config.personalityAdjustments.traits.analytical || 0.5) * 100;

    const difficultyScore = (aggression + risk + adaptability + analytical) / 4;

    if (difficultyScore < 30) return 'easy';
    if (difficultyScore < 50) return 'medium';
    if (difficultyScore < 75) return 'hard';
    return 'expert';
  }

  public finalizeCustomization(sessionId: string): AICharacterProfile | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const config = session.finalConfiguration;
    
    // 创建最终的AI角色配置
    const finalCharacter = this.buildFinalCharacter(config);
    
    // 记录完成历史
    session.customizationHistory.push({
      timestamp: Date.now(),
      step: 'finalization',
      changes: { status: 'completed' }
    });

    // 保存用户偏好
    this.updateUserProfile(session.userId, config);

    // 清理会话
    this.activeSessions.delete(sessionId);

    return finalCharacter;
  }

  private buildFinalCharacter(config: CustomizationOptions): AICharacterProfile {
    // 构建完整的AI角色配置
    const traits: PersonalityTraits = {
      aggression: config.personalityAdjustments.traits.aggression || 0.5,
      risktaking: config.personalityAdjustments.traits.risktaking || 0.5,
      patience: config.personalityAdjustments.traits.patience || 0.5,
      analytical: config.personalityAdjustments.traits.analytical || 0.5,
      social: config.personalityAdjustments.traits.social || 0.5,
      adaptability: config.personalityAdjustments.traits.adaptability || 0.5,
      intuition: config.personalityAdjustments.traits.intuition || 0.5,
      emotional: config.personalityAdjustments.traits.emotional || 0.5,
      leadership: config.personalityAdjustments.traits.leadership || 0.5,
      creativity: config.personalityAdjustments.traits.creativity || 0.5,
      loyalty: config.personalityAdjustments.traits.loyalty || 0.5,
      independence: config.personalityAdjustments.traits.independence || 0.5
    };

    return {
      id: `custom_${Date.now()}`,
      name: config.appearance.customName || 'Custom AI',
      zodiacSign: this.selectAppropriateZodiacSign(traits),
      personalityTraits: traits,
      gameplayPreferences: {
        propertyFocus: config.gameplayStyle.propertyFocus,
        negotiationStyle: config.gameplayStyle.negotiationStyle,
        riskManagement: config.gameplayStyle.riskManagement,
        socialApproach: this.mapSocialApproach(config.behaviorSettings.socialness),
        timeDecisionMaking: this.mapTimeDecision(config.gameplayStyle.decisionSpeed),
        resourceAllocation: 'balanced'
      },
      backstory: this.generateBackstory(traits),
      catchphrase: this.generateCatchphrase(traits),
      avatar: this.buildAvatar(config.appearance),
      voiceProfile: {
        tone: config.appearance.voiceSettings.personality,
        formality: config.appearance.voiceSettings.formality,
        verbosity: config.appearance.voiceSettings.verbosity
      },
      learningProfile: {
        adaptationSpeed: config.behaviorSettings.learningSpeed / 100,
        memoryRetention: traits.analytical * 0.8 + traits.patience * 0.2,
        patternRecognition: traits.analytical,
        emotionalLearning: traits.emotional
      },
      relationships: {
        preferredAllies: [],
        naturalRivals: [],
        trustLevel: traits.loyalty,
        communicationStyle: config.appearance.voiceSettings.formality
      }
    };
  }

  // 辅助方法
  private applyInitialPreferences(session: PersonalizationSession, preferences: any): void {
    // 应用初始偏好到会话配置
    if (preferences.difficulty) {
      const template = this.findTemplateByDifficulty(preferences.difficulty);
      if (template) {
        this.applyTemplateToConfiguration(session.finalConfiguration, template);
      }
    }
  }

  private findTemplateByDifficulty(difficulty: string): CustomizationTemplate | undefined {
    return Array.from(this.predefinedTemplates.values())
      .find(template => template.difficultyLevel === difficulty);
  }

  private applyPersonalityConstraints(config: CustomizationOptions): void {
    const bounds = config.constraints.personalityBounds;
    
    for (const [trait, value] of Object.entries(config.personalityAdjustments.traits)) {
      if (value !== undefined) {
        const constrainedValue = Math.max(bounds.minValue, Math.min(bounds.maxValue, value));
        config.personalityAdjustments.traits[trait as keyof PersonalityTraits] = constrainedValue;
      }
    }
  }

  private mapDecisionSpeed(speed: string): number {
    const speedMap = { instant: 100, quick: 75, normal: 50, deliberate: 25 };
    return speedMap[speed as keyof typeof speedMap] || 50;
  }

  private mapDifficultyToNumber(difficulty: string): number {
    const difficultyMap = { easy: 0, medium: 1, hard: 2, expert: 3 };
    return difficultyMap[difficulty as keyof typeof difficultyMap] || 1;
  }

  private mapSocialApproach(socialness: number): GameplayPreferences['socialApproach'] {
    if (socialness > 75) return 'collaborative';
    if (socialness > 50) return 'neutral';
    if (socialness > 25) return 'competitive';
    return 'competitive';
  }

  private mapTimeDecision(speed: string): GameplayPreferences['timeDecisionMaking'] {
    const speedMap = {
      instant: 'impulsive' as const,
      quick: 'quick' as const,
      normal: 'variable' as const,
      deliberate: 'deliberate' as const
    };
    return speedMap[speed as keyof typeof speedMap] || 'variable';
  }

  private selectAppropriateZodiacSign(traits: PersonalityTraits): ZodiacSign {
    // 基于特质选择最合适的星座
    // 这里返回一个默认的星座，实际实现中应该基于特质匹配
    return {
      name: 'Gemini',
      element: 'air',
      quality: 'mutable',
      traits: ['adaptable', 'communicative', 'curious'],
      strengths: ['versatile_strategies', 'excellent_negotiation'],
      weaknesses: ['inconsistency', 'scattered_focus'],
      playStyle: 'adaptive_opportunistic'
    };
  }

  private generateBackstory(traits: PersonalityTraits): string {
    if (traits.analytical > 0.7) {
      return "A methodical strategist who approaches every challenge with careful analysis.";
    } else if (traits.social > 0.7) {
      return "A natural networker who thrives on building relationships and alliances.";
    } else if (traits.aggression > 0.7) {
      return "A fierce competitor who never backs down from a challenge.";
    }
    return "A balanced player who adapts their strategy to any situation.";
  }

  private generateCatchphrase(traits: PersonalityTraits): string {
    if (traits.analytical > 0.7) return "Let me analyze the probabilities.";
    if (traits.social > 0.7) return "Together we can achieve more!";
    if (traits.aggression > 0.7) return "Victory through strength!";
    return "Every challenge is an opportunity.";
  }

  private buildAvatar(appearance: CustomizationOptions['appearance']): any {
    return {
      appearance: appearance.customAvatar?.style || 'default',
      colors: appearance.customAvatar?.colors || ['#4A90E2', '#7ED321'],
      style: 'modern'
    };
  }

  private updateUserProfile(userId: string, config: CustomizationOptions): void {
    const profile = this.userProfiles.get(userId) || {};
    
    profile.lastCustomization = Date.now();
    profile.preferredDifficulty = this.estimateDifficulty(config);
    profile.preferredSocialLevel = config.behaviorSettings.socialness;
    profile.customizationHistory = (profile.customizationHistory || []).concat([{
      timestamp: Date.now(),
      config: { ...config }
    }]);

    this.userProfiles.set(userId, profile);
  }

  public getAvailableTemplates(): CustomizationTemplate[] {
    return Array.from(this.predefinedTemplates.values());
  }

  public getSessionStatus(sessionId: string): any {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      currentStep: session.currentStep,
      progress: this.calculateProgress(session),
      recommendations: this.generateRecommendations(sessionId).length,
      previewAvailable: !!session.previewResults
    };
  }

  private calculateProgress(session: PersonalizationSession): number {
    const steps = ['zodiac_selection', 'trait_adjustment', 'behavior_tuning', 'appearance_customization', 'final_review'];
    const currentIndex = steps.indexOf(session.currentStep);
    return (currentIndex + 1) / steps.length;
  }

  public cleanup(): void {
    this.activeSessions.clear();
  }
}