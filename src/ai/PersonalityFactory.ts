import type {
  AIPersonality,
  DifficultyLevel,
  PropertyPreference,
  SkillUsageTendency,
  NegotiationStyle,
  ReactionPattern,
  ZodiacTraits,
  PropertyType,
  InvestmentFocus,
  TimingPreference,
  ReactionTrigger,
  ReactionResponse
} from '../types/ai';

import type { ZodiacSign } from '../types/game';
import { LLMService, type LLMConfig, type EnhancedPersonalityProfile } from './LLMService';

/**
 * AI个性工厂 - 负责创建和配置AI对手的个性特征
 * 现在集成LLM服务提供更丰富、更动态的个性生成
 */
export class PersonalityFactory {
  private llmService?: LLMService;

  constructor(llmConfig?: LLMConfig) {
    if (llmConfig) {
      try {
        this.llmService = new LLMService(llmConfig);
      } catch (error) {
        console.warn('LLM service initialization failed, fallback to static personalities:', error);
        this.llmService = undefined;
      }
    }
  }
  
  /**
   * 创建AI个性 - 现在支持LLM增强
   */
  async createPersonality(
    zodiac: ZodiacSign,
    difficulty: DifficultyLevel,
    overrides?: Partial<AIPersonality>
  ): Promise<AIPersonality> {
    // 基于生肖创建基础个性
    const basePersonality = this.createZodiacPersonality(zodiac);
    
    // 根据难度调整个性
    const adjustedPersonality = this.adjustPersonalityByDifficulty(basePersonality, difficulty);
    
    // 应用用户覆盖
    let finalPersonality = overrides ? 
      this.mergePersonalities(adjustedPersonality, overrides) : 
      adjustedPersonality;

    // 如果有LLM服务，使用它来增强个性
    if (this.llmService) {
      try {
        const enhancedProfile = await this.llmService.generatePersonalityProfile(
          zodiac, 
          difficulty, 
          finalPersonality
        );
        
        // 将LLM生成的内容整合到基础个性中
        finalPersonality = this.integrateEnhancedPersonality(finalPersonality, enhancedProfile);
        
        console.log(`✨ LLM增强个性生成成功: ${enhancedProfile.name}(${zodiac})`);
      } catch (error) {
        console.warn(`LLM个性生成失败，使用基础个性 (${zodiac}):`, error);
      }
    }

    return this.validatePersonality(finalPersonality);
  }

  /**
   * 创建增强个性档案 - 完全基于LLM生成
   */
  async createEnhancedPersonality(
    zodiac: ZodiacSign,
    difficulty: DifficultyLevel,
    customPrompt?: string
  ): Promise<{ personality: AIPersonality; profile: EnhancedPersonalityProfile }> {
    if (!this.llmService) {
      // 没有LLM服务时使用传统方法
      const personality = await this.createPersonality(zodiac, difficulty);
      return {
        personality,
        profile: this.createBasicProfile(personality, zodiac, difficulty)
      };
    }

    try {
      // 先生成基础个性作为参考
      const basePersonality = this.createZodiacPersonality(zodiac);
      
      // 使用LLM生成增强档案
      const enhancedProfile = await this.llmService.generatePersonalityProfile(
        zodiac,
        difficulty,
        customPrompt ? undefined : basePersonality
      );

      // 基于LLM生成结果创建完整个性
      const personality = this.createPersonalityFromProfile(enhancedProfile, basePersonality, difficulty);

      return {
        personality: this.validatePersonality(personality),
        profile: enhancedProfile
      };
    } catch (error) {
      console.warn(`LLM增强个性创建失败，回退到基础模式 (${zodiac}):`, error);
      const personality = await this.createPersonality(zodiac, difficulty);
      return {
        personality,
        profile: this.createBasicProfile(personality, zodiac, difficulty)
      };
    }
  }

  /**
   * 基于生肖创建基础个性
   */
  private createZodiacPersonality(zodiac: ZodiacSign): AIPersonality {
    const zodiacPersonalities: Record<ZodiacSign, AIPersonality> = {
      '鼠': {
        // 基础特征 - 机敏、谨慎、善于积累
        risk_tolerance: 0.3,
        aggression: 0.4,
        cooperation: 0.6,
        adaptability: 0.9,
        patience: 0.7,
        
        // 投资偏好 - 稳健投资，注重ROI
        property_preference: {
          preferredTypes: ['commercial', 'financial', 'service'],
          investmentFocus: 'roi',
          maxInvestmentRatio: 0.7
        },
        
        // 技能使用倾向 - 经济技能为主
        skill_usage_tendency: {
          aggressiveSkills: 0.3,
          defensiveSkills: 0.8,
          economicSkills: 0.9,
          timingPreference: 'opportunistic'
        },
        
        // 谈判风格 - 精明计算
        negotiation_style: {
          style: 'calculating',
          concessionRate: 0.3,
          bluffProbability: 0.6,
          fairnessWeight: 0.5
        },
        
        // 反应模式
        reaction_patterns: [
          {
            trigger: 'attacked',
            response: 'defensive',
            intensity: 0.7,
            duration: 3
          },
          {
            trigger: 'successful_trade',
            response: 'grateful',
            intensity: 0.6,
            duration: 2
          }
        ],
        
        // 生肖特质
        zodiac_traits: {
          strengths: ['机智', '节俭', '适应力强'],
          weaknesses: ['胆小', '多疑'],
          luckyNumbers: [2, 3],
          luckyColors: ['蓝色', '金色'],
          compatibleZodiacs: ['龙', '猴'],
          conflictZodiacs: ['马', '羊']
        },
        
        cultural_preferences: ['传统投资', '稳健收益', '风险控制']
      },

      '牛': {
        // 基础特征 - 稳重、勤奋、固执
        risk_tolerance: 0.2,
        aggression: 0.3,
        cooperation: 0.8,
        adaptability: 0.4,
        patience: 0.9,
        
        property_preference: {
          preferredTypes: ['agricultural', 'residential', 'industrial'],
          investmentFocus: 'stability',
          maxInvestmentRatio: 0.8
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.2,
          defensiveSkills: 0.9,
          economicSkills: 0.7,
          timingPreference: 'late_game'
        },
        
        negotiation_style: {
          style: 'cooperative',
          concessionRate: 0.6,
          bluffProbability: 0.2,
          fairnessWeight: 0.9
        },
        
        reaction_patterns: [
          {
            trigger: 'helped',
            response: 'grateful',
            intensity: 0.9,
            duration: 5
          }
        ],
        
        zodiac_traits: {
          strengths: ['勤劳', '可靠', '耐心'],
          weaknesses: ['固执', '缺乏变通'],
          luckyNumbers: [1, 9],
          luckyColors: ['黄色', '绿色'],
          compatibleZodiacs: ['蛇', '鸡'],
          conflictZodiacs: ['羊', '狗']
        },
        
        cultural_preferences: ['长期投资', '实体资产', '稳定收入']
      },

      '虎': {
        // 基础特征 - 勇敢、冲动、领导力
        risk_tolerance: 0.8,
        aggression: 0.9,
        cooperation: 0.4,
        adaptability: 0.7,
        patience: 0.3,
        
        property_preference: {
          preferredTypes: ['luxury', 'entertainment', 'commercial'],
          investmentFocus: 'growth',
          maxInvestmentRatio: 0.9
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.9,
          defensiveSkills: 0.4,
          economicSkills: 0.6,
          timingPreference: 'early_game'
        },
        
        negotiation_style: {
          style: 'aggressive',
          concessionRate: 0.2,
          bluffProbability: 0.8,
          fairnessWeight: 0.3
        },
        
        reaction_patterns: [
          {
            trigger: 'attacked',
            response: 'aggressive',
            intensity: 0.9,
            duration: 4
          },
          {
            trigger: 'outbid',
            response: 'vengeful',
            intensity: 0.8,
            duration: 3
          }
        ],
        
        zodiac_traits: {
          strengths: ['勇敢', '自信', '领导力'],
          weaknesses: ['冲动', '固执'],
          luckyNumbers: [1, 3, 4],
          luckyColors: ['橙色', '红色'],
          compatibleZodiacs: ['马', '狗'],
          conflictZodiacs: ['猴', '蛇']
        },
        
        cultural_preferences: ['高风险投资', '快速回报', '主导地位']
      },

      '兔': {
        // 基础特征 - 温和、谨慎、善于社交
        risk_tolerance: 0.4,
        aggression: 0.2,
        cooperation: 0.9,
        adaptability: 0.8,
        patience: 0.8,
        
        property_preference: {
          preferredTypes: ['residential', 'service', 'tourism'],
          investmentFocus: 'harmony',
          maxInvestmentRatio: 0.6
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.2,
          defensiveSkills: 0.7,
          economicSkills: 0.8,
          timingPreference: 'mid_game'
        },
        
        negotiation_style: {
          style: 'cooperative',
          concessionRate: 0.7,
          bluffProbability: 0.3,
          fairnessWeight: 0.8
        },
        
        reaction_patterns: [
          {
            trigger: 'helped',
            response: 'grateful',
            intensity: 0.8,
            duration: 4
          },
          {
            trigger: 'attacked',
            response: 'defensive',
            intensity: 0.6,
            duration: 2
          }
        ],
        
        zodiac_traits: {
          strengths: ['温和', '机敏', '外交'],
          weaknesses: ['胆小', '优柔寡断'],
          luckyNumbers: [3, 4, 6],
          luckyColors: ['粉色', '红色', '紫色'],
          compatibleZodiacs: ['羊', '猪'],
          conflictZodiacs: ['鸡', '龙']
        },
        
        cultural_preferences: ['和谐发展', '社交网络', '美学投资']
      },

      '龙': {
        // 基础特征 - 自信、权威、创新
        risk_tolerance: 0.7,
        aggression: 0.8,
        cooperation: 0.5,
        adaptability: 0.9,
        patience: 0.6,
        
        property_preference: {
          preferredTypes: ['luxury', 'financial', 'mixed'],
          investmentFocus: 'prestige',
          maxInvestmentRatio: 0.85
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.8,
          defensiveSkills: 0.6,
          economicSkills: 0.9,
          timingPreference: 'opportunistic'
        },
        
        negotiation_style: {
          style: 'confident',
          concessionRate: 0.4,
          bluffProbability: 0.7,
          fairnessWeight: 0.6
        },
        
        reaction_patterns: [
          {
            trigger: 'successful_trade',
            response: 'confident',
            intensity: 0.8,
            duration: 3
          }
        ],
        
        zodiac_traits: {
          strengths: ['权威', '创新', '魅力'],
          weaknesses: ['傲慢', '冲动'],
          luckyNumbers: [1, 6, 7],
          luckyColors: ['金色', '银色'],
          compatibleZodiacs: ['鼠', '猴', '鸡'],
          conflictZodiacs: ['狗', '兔']
        },
        
        cultural_preferences: ['威望投资', '创新项目', '领导地位']
      },

      '蛇': {
        // 基础特征 - 智慧、神秘、直觉强
        risk_tolerance: 0.6,
        aggression: 0.5,
        cooperation: 0.4,
        adaptability: 0.8,
        patience: 0.9,
        
        property_preference: {
          preferredTypes: ['financial', 'luxury', 'mixed'],
          investmentFocus: 'roi',
          maxInvestmentRatio: 0.75
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.6,
          defensiveSkills: 0.8,
          economicSkills: 0.9,
          timingPreference: 'opportunistic'
        },
        
        negotiation_style: {
          style: 'calculating',
          concessionRate: 0.3,
          bluffProbability: 0.8,
          fairnessWeight: 0.4
        },
        
        reaction_patterns: [
          {
            trigger: 'outbid',
            response: 'vengeful',
            intensity: 0.9,
            duration: 5
          }
        ],
        
        zodiac_traits: {
          strengths: ['智慧', '直觉', '神秘'],
          weaknesses: ['多疑', '冷漠'],
          luckyNumbers: [2, 8, 9],
          luckyColors: ['黑色', '红色', '黄色'],
          compatibleZodiacs: ['牛', '鸡'],
          conflictZodiacs: ['虎', '猪']
        },
        
        cultural_preferences: ['神秘投资', '直觉决策', '长远布局']
      },

      '马': {
        // 基础特征 - 自由、热情、不拘小节
        risk_tolerance: 0.8,
        aggression: 0.7,
        cooperation: 0.6,
        adaptability: 0.9,
        patience: 0.4,
        
        property_preference: {
          preferredTypes: ['transport', 'entertainment', 'tourism'],
          investmentFocus: 'growth',
          maxInvestmentRatio: 0.8
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.8,
          defensiveSkills: 0.5,
          economicSkills: 0.6,
          timingPreference: 'early_game'
        },
        
        negotiation_style: {
          style: 'unpredictable',
          concessionRate: 0.5,
          bluffProbability: 0.6,
          fairnessWeight: 0.7
        },
        
        reaction_patterns: [
          {
            trigger: 'lucky_event',
            response: 'excited',
            intensity: 0.9,
            duration: 2
          }
        ],
        
        zodiac_traits: {
          strengths: ['自由', '热情', '机动性'],
          weaknesses: ['不稳定', '缺乏耐心'],
          luckyNumbers: [2, 3, 7],
          luckyColors: ['棕色', '黄色', '紫色'],
          compatibleZodiacs: ['虎', '狗'],
          conflictZodiacs: ['鼠', '牛']
        },
        
        cultural_preferences: ['自由投资', '灵活策略', '快速变现']
      },

      '羊': {
        // 基础特征 - 温和、艺术、依赖性强
        risk_tolerance: 0.3,
        aggression: 0.2,
        cooperation: 0.9,
        adaptability: 0.6,
        patience: 0.8,
        
        property_preference: {
          preferredTypes: ['residential', 'tourism', 'food'],
          investmentFocus: 'harmony',
          maxInvestmentRatio: 0.6
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.2,
          defensiveSkills: 0.8,
          economicSkills: 0.6,
          timingPreference: 'reactive'
        },
        
        negotiation_style: {
          style: 'cooperative',
          concessionRate: 0.8,
          bluffProbability: 0.2,
          fairnessWeight: 0.9
        },
        
        reaction_patterns: [
          {
            trigger: 'helped',
            response: 'grateful',
            intensity: 1.0,
            duration: 6
          }
        ],
        
        zodiac_traits: {
          strengths: ['温和', '艺术感', '同情心'],
          weaknesses: ['依赖性', '缺乏主见'],
          luckyNumbers: [2, 7],
          luckyColors: ['绿色', '红色', '紫色'],
          compatibleZodiacs: ['兔', '猪'],
          conflictZodiacs: ['牛', '狗']
        },
        
        cultural_preferences: ['美学投资', '合作共赢', '和谐发展']
      },

      '猴': {
        // 基础特征 - 聪明、机智、好奇
        risk_tolerance: 0.7,
        aggression: 0.6,
        cooperation: 0.7,
        adaptability: 1.0,
        patience: 0.5,
        
        property_preference: {
          preferredTypes: ['entertainment', 'commercial', 'mixed'],
          investmentFocus: 'flexibility',
          maxInvestmentRatio: 0.75
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.7,
          defensiveSkills: 0.6,
          economicSkills: 0.8,
          timingPreference: 'opportunistic'
        },
        
        negotiation_style: {
          style: 'unpredictable',
          concessionRate: 0.5,
          bluffProbability: 0.8,
          fairnessWeight: 0.5
        },
        
        reaction_patterns: [
          {
            trigger: 'successful_trade',
            response: 'excited',
            intensity: 0.8,
            duration: 2
          }
        ],
        
        zodiac_traits: {
          strengths: ['聪明', '机智', '适应力'],
          weaknesses: ['狡猾', '不稳定'],
          luckyNumbers: [1, 7, 8],
          luckyColors: ['白色', '金色'],
          compatibleZodiacs: ['鼠', '龙'],
          conflictZodiacs: ['虎', '猪']
        },
        
        cultural_preferences: ['创新投资', '多元化', '灵活策略']
      },

      '鸡': {
        // 基础特征 - 勤奋、完美主义、注重细节
        risk_tolerance: 0.4,
        aggression: 0.6,
        cooperation: 0.6,
        adaptability: 0.6,
        patience: 0.7,
        
        property_preference: {
          preferredTypes: ['commercial', 'service', 'food'],
          investmentFocus: 'consistency',
          maxInvestmentRatio: 0.7
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.6,
          defensiveSkills: 0.7,
          economicSkills: 0.8,
          timingPreference: 'mid_game'
        },
        
        negotiation_style: {
          style: 'calculating',
          concessionRate: 0.4,
          bluffProbability: 0.5,
          fairnessWeight: 0.7
        },
        
        reaction_patterns: [
          {
            trigger: 'failed_trade',
            response: 'frustrated',
            intensity: 0.7,
            duration: 3
          }
        ],
        
        zodiac_traits: {
          strengths: ['勤奋', '细致', '准时'],
          weaknesses: ['挑剔', '固执'],
          luckyNumbers: [5, 7, 8],
          luckyColors: ['金色', '棕色', '黄色'],
          compatibleZodiacs: ['牛', '蛇', '龙'],
          conflictZodiacs: ['兔', '狗']
        },
        
        cultural_preferences: ['精确投资', '品质优先', '系统化管理']
      },

      '狗': {
        // 基础特征 - 忠诚、正义、保守
        risk_tolerance: 0.3,
        aggression: 0.5,
        cooperation: 0.8,
        adaptability: 0.5,
        patience: 0.8,
        
        property_preference: {
          preferredTypes: ['residential', 'service', 'agricultural'],
          investmentFocus: 'safety',
          maxInvestmentRatio: 0.6
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.4,
          defensiveSkills: 0.9,
          economicSkills: 0.6,
          timingPreference: 'reactive'
        },
        
        negotiation_style: {
          style: 'cooperative',
          concessionRate: 0.6,
          bluffProbability: 0.3,
          fairnessWeight: 0.9
        },
        
        reaction_patterns: [
          {
            trigger: 'attacked',
            response: 'defensive',
            intensity: 0.8,
            duration: 4
          }
        ],
        
        zodiac_traits: {
          strengths: ['忠诚', '正义', '可靠'],
          weaknesses: ['保守', '悲观'],
          luckyNumbers: [3, 4, 9],
          luckyColors: ['红色', '绿色', '紫色'],
          compatibleZodiacs: ['虎', '马'],
          conflictZodiacs: ['龙', '羊', '鸡']
        },
        
        cultural_preferences: ['安全投资', '道德标准', '长期承诺']
      },

      '猪': {
        // 基础特征 - 诚实、慷慨、乐观
        risk_tolerance: 0.5,
        aggression: 0.3,
        cooperation: 0.9,
        adaptability: 0.7,
        patience: 0.9,
        
        property_preference: {
          preferredTypes: ['food', 'residential', 'tourism'],
          investmentFocus: 'stability',
          maxInvestmentRatio: 0.7
        },
        
        skill_usage_tendency: {
          aggressiveSkills: 0.3,
          defensiveSkills: 0.6,
          economicSkills: 0.7,
          timingPreference: 'late_game'
        },
        
        negotiation_style: {
          style: 'cooperative',
          concessionRate: 0.7,
          bluffProbability: 0.2,
          fairnessWeight: 0.9
        },
        
        reaction_patterns: [
          {
            trigger: 'helped',
            response: 'grateful',
            intensity: 0.9,
            duration: 5
          }
        ],
        
        zodiac_traits: {
          strengths: ['诚实', '慷慨', '乐观'],
          weaknesses: ['天真', '容易受骗'],
          luckyNumbers: [2, 5, 8],
          luckyColors: ['黄色', '灰色', '棕色', '金色'],
          compatibleZodiacs: ['兔', '羊'],
          conflictZodiacs: ['蛇', '猴']
        },
        
        cultural_preferences: ['诚信投资', '社会责任', '长期价值']
      }
    };

    return zodiacPersonalities[zodiac];
  }

  /**
   * 根据难度调整个性
   */
  private adjustPersonalityByDifficulty(
    basePersonality: AIPersonality, 
    difficulty: DifficultyLevel
  ): AIPersonality {
    const adjustments: Record<DifficultyLevel, PersonalityAdjustment> = {
      easy: {
        risk_tolerance: -0.2,
        aggression: -0.3,
        adaptability: -0.3,
        decisionSpeed: 0.7,
        skillAccuracy: 0.6
      },
      medium: {
        risk_tolerance: 0,
        aggression: 0,
        adaptability: 0,
        decisionSpeed: 1.0,
        skillAccuracy: 0.8
      },
      hard: {
        risk_tolerance: 0.1,
        aggression: 0.2,
        adaptability: 0.2,
        decisionSpeed: 1.3,
        skillAccuracy: 0.9
      },
      expert: {
        risk_tolerance: 0.2,
        aggression: 0.3,
        adaptability: 0.4,
        decisionSpeed: 1.5,
        skillAccuracy: 0.95
      }
    };

    const adjustment = adjustments[difficulty];
    
    return {
      ...basePersonality,
      risk_tolerance: this.clamp(basePersonality.risk_tolerance + adjustment.risk_tolerance, 0, 1),
      aggression: this.clamp(basePersonality.aggression + adjustment.aggression, 0, 1),
      adaptability: this.clamp(basePersonality.adaptability + adjustment.adaptability, 0, 1),
      
      // 调整技能使用倾向
      skill_usage_tendency: {
        ...basePersonality.skill_usage_tendency,
        aggressiveSkills: this.clamp(
          basePersonality.skill_usage_tendency.aggressiveSkills + adjustment.aggression, 
          0, 1
        ),
        economicSkills: this.clamp(
          basePersonality.skill_usage_tendency.economicSkills + (adjustment.skillAccuracy - 0.8) * 2, 
          0, 1
        )
      },
      
      // 调整谈判风格
      negotiation_style: {
        ...basePersonality.negotiation_style,
        bluffProbability: this.clamp(
          basePersonality.negotiation_style.bluffProbability + adjustment.aggression,
          0, 1
        )
      }
    };
  }

  /**
   * 合并个性配置
   */
  private mergePersonalities(
    base: AIPersonality, 
    overrides: Partial<AIPersonality>
  ): AIPersonality {
    return {
      ...base,
      ...overrides,
      
      // 深度合并嵌套对象
      property_preference: {
        ...base.property_preference,
        ...(overrides.property_preference || {})
      },
      
      skill_usage_tendency: {
        ...base.skill_usage_tendency,
        ...(overrides.skill_usage_tendency || {})
      },
      
      negotiation_style: {
        ...base.negotiation_style,
        ...(overrides.negotiation_style || {})
      },
      
      zodiac_traits: {
        ...base.zodiac_traits,
        ...(overrides.zodiac_traits || {})
      },
      
      reaction_patterns: overrides.reaction_patterns || base.reaction_patterns,
      cultural_preferences: overrides.cultural_preferences || base.cultural_preferences
    };
  }

  /**
   * 验证个性配置
   */
  private validatePersonality(personality: AIPersonality): AIPersonality {
    // 确保数值在有效范围内
    return {
      ...personality,
      risk_tolerance: this.clamp(personality.risk_tolerance, 0, 1),
      aggression: this.clamp(personality.aggression, 0, 1),
      cooperation: this.clamp(personality.cooperation, 0, 1),
      adaptability: this.clamp(personality.adaptability, 0, 1),
      patience: this.clamp(personality.patience, 0, 1),
      
      property_preference: {
        ...personality.property_preference,
        maxInvestmentRatio: this.clamp(personality.property_preference.maxInvestmentRatio, 0, 1)
      },
      
      skill_usage_tendency: {
        ...personality.skill_usage_tendency,
        aggressiveSkills: this.clamp(personality.skill_usage_tendency.aggressiveSkills, 0, 1),
        defensiveSkills: this.clamp(personality.skill_usage_tendency.defensiveSkills, 0, 1),
        economicSkills: this.clamp(personality.skill_usage_tendency.economicSkills, 0, 1)
      },
      
      negotiation_style: {
        ...personality.negotiation_style,
        concessionRate: this.clamp(personality.negotiation_style.concessionRate, 0, 1),
        bluffProbability: this.clamp(personality.negotiation_style.bluffProbability, 0, 1),
        fairnessWeight: this.clamp(personality.negotiation_style.fairnessWeight, 0, 1)
      }
    };
  }

  /**
   * 数值约束函数
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 生成随机个性变异
   */
  generatePersonalityVariant(
    basePersonality: AIPersonality, 
    variationStrength: number = 0.1
  ): AIPersonality {
    const variation = (base: number) => {
      const change = (Math.random() - 0.5) * 2 * variationStrength;
      return this.clamp(base + change, 0, 1);
    };

    return {
      ...basePersonality,
      risk_tolerance: variation(basePersonality.risk_tolerance),
      aggression: variation(basePersonality.aggression),
      cooperation: variation(basePersonality.cooperation),
      adaptability: variation(basePersonality.adaptability),
      patience: variation(basePersonality.patience),
      
      skill_usage_tendency: {
        ...basePersonality.skill_usage_tendency,
        aggressiveSkills: variation(basePersonality.skill_usage_tendency.aggressiveSkills),
        defensiveSkills: variation(basePersonality.skill_usage_tendency.defensiveSkills),
        economicSkills: variation(basePersonality.skill_usage_tendency.economicSkills)
      },
      
      negotiation_style: {
        ...basePersonality.negotiation_style,
        concessionRate: variation(basePersonality.negotiation_style.concessionRate),
        bluffProbability: variation(basePersonality.negotiation_style.bluffProbability)
      }
    };
  }

  /**
   * 创建互补性格组合 - 支持LLM增强
   */
  async createComplementaryTeam(zodiacs: ZodiacSign[], difficulty: DifficultyLevel): Promise<AIPersonality[]> {
    if (this.llmService) {
      // 使用LLM生成具有互补性的团队
      try {
        return Promise.all(zodiacs.map(async zodiac => {
          const { personality } = await this.createEnhancedPersonality(zodiac, difficulty);
          return this.generatePersonalityVariant(personality, 0.05);
        }));
      } catch (error) {
        console.warn('LLM团队生成失败，使用传统方法:', error);
      }
    }

    // 传统方法
    return Promise.all(zodiacs.map(zodiac => {
      const basePersonality = this.createZodiacPersonality(zodiac);
      const adjustedPersonality = this.adjustPersonalityByDifficulty(basePersonality, difficulty);
      return Promise.resolve(this.generatePersonalityVariant(adjustedPersonality, 0.05));
    }));
  }

  /**
   * 将LLM增强档案整合到基础个性中
   */
  private integrateEnhancedPersonality(
    basePersonality: AIPersonality, 
    enhancedProfile: EnhancedPersonalityProfile
  ): AIPersonality {
    // 创建扩展的个性对象，保留基础结构但添加LLM增强内容
    const integrated: AIPersonality & { enhancedProfile?: EnhancedPersonalityProfile } = {
      ...basePersonality,
      
      // 更新生肖特质，融合LLM生成的内容
      zodiac_traits: {
        ...basePersonality.zodiac_traits,
        strengths: [
          ...basePersonality.zodiac_traits.strengths,
          ...enhancedProfile.characteristics.slice(0, 2) // 添加部分LLM特征
        ],
        personality_description: enhancedProfile.description,
        speech_style: enhancedProfile.speechStyle,
        backstory: enhancedProfile.backstory
      } as any, // 临时扩展类型
      
      // 如果有LLM提供的个性数值，适度调整基础数值
      ...(enhancedProfile.personalityValues.risk_tolerance && {
        risk_tolerance: this.blendValues(
          basePersonality.risk_tolerance, 
          enhancedProfile.personalityValues.risk_tolerance,
          0.3 // 30%的LLM影响权重
        )
      }),
      
      ...(enhancedProfile.personalityValues.aggression && {
        aggression: this.blendValues(
          basePersonality.aggression,
          enhancedProfile.personalityValues.aggression,
          0.3
        )
      }),

      // 保存完整的增强档案供其他系统使用
      enhancedProfile
    };

    // 移除临时扩展属性，保持类型一致性
    const { enhancedProfile: _, ...finalPersonality } = integrated;
    
    // 在实际应用中，可以将增强档案存储在其他地方
    (finalPersonality as any)._enhancedProfile = enhancedProfile;

    return finalPersonality;
  }

  /**
   * 基于LLM档案创建完整个性
   */
  private createPersonalityFromProfile(
    profile: EnhancedPersonalityProfile,
    basePersonality: AIPersonality,
    difficulty: DifficultyLevel
  ): AIPersonality {
    // 从LLM生成的个性数值中提取信息
    const values = profile.personalityValues;
    
    return {
      ...basePersonality,
      
      // 使用LLM提供的数值，如果没有则使用基础值
      risk_tolerance: values.risk_tolerance || basePersonality.risk_tolerance,
      aggression: values.aggression || basePersonality.aggression,
      cooperation: values.cooperation || basePersonality.cooperation,
      adaptability: values.adaptability || basePersonality.adaptability,
      patience: values.patience || basePersonality.patience,
      
      // 更新生肖特质
      zodiac_traits: {
        ...basePersonality.zodiac_traits,
        strengths: profile.characteristics.length > 0 
          ? profile.characteristics.slice(0, 3)
          : basePersonality.zodiac_traits.strengths,
        personality_description: profile.description,
        speech_style: profile.speechStyle,
        backstory: profile.backstory,
        strategies: profile.strategies
      } as any,
      
      // 根据策略偏好调整属性偏好
      property_preference: this.adjustPropertyPreference(
        basePersonality.property_preference, 
        profile.strategies
      ),
      
      // 保存原始LLM档案
      _enhancedProfile: profile
    } as any;
  }

  /**
   * 创建基础档案（无LLM时的后备方案）
   */
  private createBasicProfile(
    personality: AIPersonality, 
    zodiac: ZodiacSign, 
    difficulty: DifficultyLevel
  ): EnhancedPersonalityProfile {
    return {
      name: `${zodiac}${difficulty === 'expert' ? '大师' : '玩家'}`,
      description: `一个具有${zodiac}生肖特征的${difficulty}难度AI角色`,
      characteristics: personality.zodiac_traits.strengths,
      speechStyle: '根据生肖特点调整的说话风格',
      strategies: personality.cultural_preferences,
      backstory: `来自${zodiac}家族的游戏高手`,
      personalityValues: {
        risk_tolerance: personality.risk_tolerance,
        aggression: personality.aggression,
        cooperation: personality.cooperation,
        adaptability: personality.adaptability,
        patience: personality.patience
      },
      generatedAt: Date.now(),
      zodiac,
      difficulty
    };
  }

  /**
   * 混合数值（基础值和LLM值）
   */
  private blendValues(baseValue: number, llmValue: number, llmWeight: number): number {
    return this.clamp(
      baseValue * (1 - llmWeight) + llmValue * llmWeight,
      0,
      1
    );
  }

  /**
   * 根据策略调整属性偏好
   */
  private adjustPropertyPreference(
    basePreference: PropertyPreference,
    strategies: string[] = []
  ): PropertyPreference {
    // 确保strategies是数组
    const safeStrategies = Array.isArray(strategies) ? strategies : [];
    
    // 简单的策略到属性类型映射
    const strategyTypeMap: Record<string, PropertyType[]> = {
      '稳健发展': ['residential', 'agricultural'],
      '快速扩张': ['commercial', 'financial'],
      '高端投资': ['luxury', 'mixed'],
      '文化投资': ['tourism', 'entertainment'],
      '服务导向': ['service', 'food']
    };

    let adjustedTypes = [...basePreference.preferredTypes];
    
    safeStrategies.forEach(strategy => {
      const types = strategyTypeMap[strategy];
      if (types) {
        // 添加策略相关的属性类型
        types.forEach(type => {
          if (!adjustedTypes.includes(type)) {
            adjustedTypes.push(type);
          }
        });
      }
    });

    return {
      ...basePreference,
      preferredTypes: adjustedTypes.slice(0, 4) // 限制最多4种偏好类型
    };
  }

  /**
   * 清理LLM服务资源
   */
  cleanup(): void {
    if (this.llmService) {
      this.llmService.cleanup();
    }
  }
}

// 辅助接口
interface PersonalityAdjustment {
  risk_tolerance: number;
  aggression: number;
  adaptability: number;
  decisionSpeed: number;
  skillAccuracy: number;
}