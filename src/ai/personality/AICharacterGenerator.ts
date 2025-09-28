export interface ZodiacSign {
  name: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  quality: 'cardinal' | 'fixed' | 'mutable';
  traits: string[];
  strengths: string[];
  weaknesses: string[];
  playStyle: string;
}

export interface PersonalityTraits {
  aggression: number;          // 0-1: 攻击性/竞争性
  risktaking: number;          // 0-1: 冒险精神
  patience: number;            // 0-1: 耐心程度
  analytical: number;          // 0-1: 分析能力
  social: number;              // 0-1: 社交倾向
  adaptability: number;        // 0-1: 适应能力
  intuition: number;           // 0-1: 直觉敏感度
  emotional: number;           // 0-1: 情绪化程度
  leadership: number;          // 0-1: 领导倾向
  creativity: number;          // 0-1: 创造性思维
  loyalty: number;             // 0-1: 忠诚度
  independence: number;        // 0-1: 独立性
}

export interface GameplayPreferences {
  propertyFocus: 'monopoly_building' | 'diverse_portfolio' | 'strategic_blocking' | 'cash_hoarding';
  negotiationStyle: 'aggressive' | 'diplomatic' | 'calculative' | 'emotional';
  riskManagement: 'conservative' | 'moderate' | 'aggressive' | 'chaotic';
  socialApproach: 'competitive' | 'collaborative' | 'manipulative' | 'neutral';
  timeDecisionMaking: 'quick' | 'deliberate' | 'impulsive' | 'variable';
  resourceAllocation: 'balanced' | 'property_heavy' | 'cash_reserves' | 'development_focused';
}

export interface AICharacterProfile {
  id: string;
  name: string;
  zodiacSign: ZodiacSign;
  personalityTraits: PersonalityTraits;
  gameplayPreferences: GameplayPreferences;
  backstory: string;
  catchphrase: string;
  avatar: {
    appearance: string;
    colors: string[];
    style: string;
  };
  voiceProfile: {
    tone: string;
    formality: 'casual' | 'formal' | 'quirky' | 'professional';
    verbosity: 'concise' | 'moderate' | 'verbose';
  };
  learningProfile: {
    adaptationSpeed: number;
    memoryRetention: number;
    patternRecognition: number;
    emotionalLearning: number;
  };
  relationships: {
    preferredAllies: string[];
    naturalRivals: string[];
    trustLevel: number;
    communicationStyle: string;
  };
}

export interface CharacterGenerationConfig {
  zodiacBias?: string[];           // 偏好的星座
  traitRanges?: Partial<PersonalityTraits>;  // 特定特质范围
  difficultyLevel?: 'easy' | 'medium' | 'hard' | 'expert';
  playerCompatibility?: string;    // 与玩家的兼容性类型
  uniquenessLevel?: number;        // 0-1: 独特性程度
  balanceRequired?: boolean;       // 是否需要平衡的特质分布
}

export class AICharacterGenerator {
  private readonly zodiacSigns: Record<string, ZodiacSign> = {
    aries: {
      name: 'Aries',
      element: 'fire',
      quality: 'cardinal',
      traits: ['energetic', 'competitive', 'impulsive', 'leadership'],
      strengths: ['quick_decisions', 'bold_moves', 'natural_leadership'],
      weaknesses: ['impatience', 'recklessness', 'short_temper'],
      playStyle: 'aggressive_early_expansion'
    },
    taurus: {
      name: 'Taurus',
      element: 'earth',
      quality: 'fixed',
      traits: ['patient', 'practical', 'stubborn', 'loyal'],
      strengths: ['steady_building', 'resource_management', 'long_term_planning'],
      weaknesses: ['slow_adaptation', 'resistance_to_change', 'overly_cautious'],
      playStyle: 'conservative_wealth_building'
    },
    gemini: {
      name: 'Gemini',
      element: 'air',
      quality: 'mutable',
      traits: ['adaptable', 'communicative', 'curious', 'inconsistent'],
      strengths: ['versatile_strategies', 'excellent_negotiation', 'quick_learning'],
      weaknesses: ['inconsistency', 'scattered_focus', 'superficial_analysis'],
      playStyle: 'adaptive_opportunistic'
    },
    cancer: {
      name: 'Cancer',
      element: 'water',
      quality: 'cardinal',
      traits: ['intuitive', 'protective', 'emotional', 'nurturing'],
      strengths: ['emotional_intelligence', 'protective_strategies', 'intuitive_timing'],
      weaknesses: ['mood_swings', 'overly_defensive', 'emotional_decisions'],
      playStyle: 'defensive_territory_protection'
    },
    leo: {
      name: 'Leo',
      element: 'fire',
      quality: 'fixed',
      traits: ['confident', 'dramatic', 'generous', 'prideful'],
      strengths: ['bold_investments', 'charismatic_negotiation', 'grand_strategies'],
      weaknesses: ['ego_driven_decisions', 'overspending', 'attention_seeking'],
      playStyle: 'prestigious_property_focus'
    },
    virgo: {
      name: 'Virgo',
      element: 'earth',
      quality: 'mutable',
      traits: ['analytical', 'perfectionist', 'practical', 'critical'],
      strengths: ['detailed_analysis', 'efficient_planning', 'risk_assessment'],
      weaknesses: ['over_analysis', 'perfectionism_paralysis', 'overly_critical'],
      playStyle: 'methodical_optimization'
    },
    libra: {
      name: 'Libra',
      element: 'air',
      quality: 'cardinal',
      traits: ['diplomatic', 'balanced', 'indecisive', 'harmonious'],
      strengths: ['excellent_negotiation', 'balanced_portfolio', 'conflict_resolution'],
      weaknesses: ['indecisiveness', 'avoids_confrontation', 'people_pleasing'],
      playStyle: 'diplomatic_alliance_building'
    },
    scorpio: {
      name: 'Scorpio',
      element: 'water',
      quality: 'fixed',
      traits: ['intense', 'strategic', 'secretive', 'transformative'],
      strengths: ['deep_strategy', 'psychological_warfare', 'resource_transformation'],
      weaknesses: ['vindictiveness', 'secrecy', 'intensity_overwhelm'],
      playStyle: 'strategic_psychological_dominance'
    },
    sagittarius: {
      name: 'Sagittarius',
      element: 'fire',
      quality: 'mutable',
      traits: ['adventurous', 'optimistic', 'philosophical', 'freedom_loving'],
      strengths: ['bold_expansion', 'optimistic_risks', 'global_thinking'],
      weaknesses: ['overconfidence', 'lack_of_detail', 'commitment_issues'],
      playStyle: 'expansive_risk_taking'
    },
    capricorn: {
      name: 'Capricorn',
      element: 'earth',
      quality: 'cardinal',
      traits: ['ambitious', 'disciplined', 'traditional', 'responsible'],
      strengths: ['long_term_planning', 'systematic_building', 'authority_respect'],
      weaknesses: ['rigidity', 'pessimism', 'slow_innovation'],
      playStyle: 'systematic_empire_building'
    },
    aquarius: {
      name: 'Aquarius',
      element: 'air',
      quality: 'fixed',
      traits: ['innovative', 'independent', 'humanitarian', 'eccentric'],
      strengths: ['innovative_strategies', 'unconventional_thinking', 'group_dynamics'],
      weaknesses: ['detachment', 'unpredictability', 'rebelliousness'],
      playStyle: 'innovative_disruption'
    },
    pisces: {
      name: 'Pisces',
      element: 'water',
      quality: 'mutable',
      traits: ['intuitive', 'empathetic', 'artistic', 'dreamy'],
      strengths: ['intuitive_decisions', 'empathetic_negotiation', 'creative_solutions'],
      weaknesses: ['lack_of_focus', 'overly_trusting', 'escapism'],
      playStyle: 'intuitive_flow_following'
    }
  };

  private characterNameBank: Record<string, string[]> = {
    aries: ['Blaze', 'Phoenix', 'Arden', 'Ember', 'Fury'],
    taurus: ['Terra', 'Stone', 'Grove', 'Sage', 'Clay'],
    gemini: ['Twins', 'Echo', 'Whisper', 'Flux', 'Spiral'],
    cancer: ['Luna', 'Pearl', 'Tide', 'Shell', 'Moonshadow'],
    leo: ['Solar', 'Golden', 'Majesty', 'Crown', 'Radiance'],
    virgo: ['Precision', 'Crystal', 'Order', 'Logic', 'Clarity'],
    libra: ['Balance', 'Harmony', 'Grace', 'Justice', 'Equilibrium'],
    scorpio: ['Shadow', 'Venom', 'Mystique', 'Phantom', 'Intensity'],
    sagittarius: ['Arrow', 'Quest', 'Journey', 'Explorer', 'Horizon'],
    capricorn: ['Summit', 'Foundation', 'Authority', 'Structure', 'Pinnacle'],
    aquarius: ['Nexus', 'Quantum', 'Vision', 'Future', 'Innovation'],
    pisces: ['Dream', 'Ocean', 'Mystic', 'Flow', 'Intuition']
  };

  public generateCharacter(config: CharacterGenerationConfig = {}): AICharacterProfile {
    const zodiacSign = this.selectZodiacSign(config);
    const personalityTraits = this.generatePersonalityTraits(zodiacSign, config);
    const gameplayPreferences = this.generateGameplayPreferences(zodiacSign, personalityTraits);
    const name = this.generateCharacterName(zodiacSign);
    
    return {
      id: `ai_${zodiacSign.name.toLowerCase()}_${Date.now()}`,
      name,
      zodiacSign,
      personalityTraits,
      gameplayPreferences,
      backstory: this.generateBackstory(zodiacSign, personalityTraits),
      catchphrase: this.generateCatchphrase(zodiacSign, personalityTraits),
      avatar: this.generateAvatar(zodiacSign, personalityTraits),
      voiceProfile: this.generateVoiceProfile(zodiacSign, personalityTraits),
      learningProfile: this.generateLearningProfile(zodiacSign, personalityTraits),
      relationships: this.generateRelationships(zodiacSign, personalityTraits)
    };
  }

  public generateBalancedTeam(playerCount: number, playerProfile?: any): AICharacterProfile[] {
    const team: AICharacterProfile[] = [];
    const usedSigns: string[] = [];
    
    // 确保团队多样性
    const elements = ['fire', 'earth', 'air', 'water'];
    const qualities = ['cardinal', 'fixed', 'mutable'];
    
    for (let i = 0; i < playerCount; i++) {
      const targetElement = elements[i % elements.length];
      const targetQuality = qualities[i % qualities.length];
      
      const config: CharacterGenerationConfig = {
        zodiacBias: this.getSignsByElementAndQuality(targetElement, targetQuality),
        difficultyLevel: this.calculateDifficultyForPosition(i, playerCount),
        balanceRequired: true,
        uniquenessLevel: 0.7 + (Math.random() * 0.3)
      };

      const character = this.generateCharacter(config);
      
      // 避免重复星座
      if (!usedSigns.includes(character.zodiacSign.name)) {
        team.push(character);
        usedSigns.push(character.zodiacSign.name);
      } else {
        i--; // 重新生成
      }
    }

    return this.balanceTeamDynamics(team);
  }

  public customizeCharacter(
    baseCharacter: AICharacterProfile, 
    customizations: Partial<AICharacterProfile>
  ): AICharacterProfile {
    return {
      ...baseCharacter,
      ...customizations,
      personalityTraits: {
        ...baseCharacter.personalityTraits,
        ...customizations.personalityTraits
      },
      gameplayPreferences: {
        ...baseCharacter.gameplayPreferences,
        ...customizations.gameplayPreferences
      }
    };
  }

  private selectZodiacSign(config: CharacterGenerationConfig): ZodiacSign {
    if (config.zodiacBias && config.zodiacBias.length > 0) {
      const randomSign = config.zodiacBias[Math.floor(Math.random() * config.zodiacBias.length)];
      return this.zodiacSigns[randomSign.toLowerCase()];
    }

    const allSigns = Object.keys(this.zodiacSigns);
    const randomSign = allSigns[Math.floor(Math.random() * allSigns.length)];
    return this.zodiacSigns[randomSign];
  }

  private generatePersonalityTraits(
    zodiacSign: ZodiacSign, 
    config: CharacterGenerationConfig
  ): PersonalityTraits {
    const baseTraits = this.getZodiacBaseTraits(zodiacSign);
    const variance = config.uniquenessLevel || 0.3;
    
    const traits: PersonalityTraits = {} as PersonalityTraits;
    
    for (const [key, baseValue] of Object.entries(baseTraits)) {
      const configRange = config.traitRanges?.[key as keyof PersonalityTraits];
      const minValue = configRange || Math.max(0, baseValue - variance);
      const maxValue = configRange || Math.min(1, baseValue + variance);
      
      traits[key as keyof PersonalityTraits] = 
        minValue + Math.random() * (maxValue - minValue);
    }

    return this.normalizeTraits(traits, config.balanceRequired || false);
  }

  private getZodiacBaseTraits(zodiacSign: ZodiacSign): PersonalityTraits {
    const elementTraits = {
      fire: { aggression: 0.8, risktaking: 0.7, leadership: 0.8, emotional: 0.6 },
      earth: { patience: 0.8, analytical: 0.7, loyalty: 0.8, independence: 0.5 },
      air: { social: 0.8, adaptability: 0.8, creativity: 0.7, analytical: 0.7 },
      water: { intuition: 0.8, emotional: 0.8, loyalty: 0.7, social: 0.6 }
    };

    const qualityTraits = {
      cardinal: { leadership: 0.8, aggression: 0.7, independence: 0.7 },
      fixed: { patience: 0.8, loyalty: 0.8, analytical: 0.6 },
      mutable: { adaptability: 0.8, creativity: 0.7, social: 0.6 }
    };

    const base: PersonalityTraits = {
      aggression: 0.5,
      risktaking: 0.5,
      patience: 0.5,
      analytical: 0.5,
      social: 0.5,
      adaptability: 0.5,
      intuition: 0.5,
      emotional: 0.5,
      leadership: 0.5,
      creativity: 0.5,
      loyalty: 0.5,
      independence: 0.5
    };

    // 应用元素特质
    const elementBonus = elementTraits[zodiacSign.element];
    for (const [trait, bonus] of Object.entries(elementBonus)) {
      base[trait as keyof PersonalityTraits] = Math.min(1, base[trait as keyof PersonalityTraits] + bonus * 0.3);
    }

    // 应用性质特质
    const qualityBonus = qualityTraits[zodiacSign.quality];
    for (const [trait, bonus] of Object.entries(qualityBonus)) {
      base[trait as keyof PersonalityTraits] = Math.min(1, base[trait as keyof PersonalityTraits] + bonus * 0.2);
    }

    return base;
  }

  private generateGameplayPreferences(
    zodiacSign: ZodiacSign, 
    traits: PersonalityTraits
  ): GameplayPreferences {
    return {
      propertyFocus: this.determinePropertyFocus(traits),
      negotiationStyle: this.determineNegotiationStyle(traits),
      riskManagement: this.determineRiskManagement(traits),
      socialApproach: this.determineSocialApproach(traits),
      timeDecisionMaking: this.determineDecisionTiming(traits),
      resourceAllocation: this.determineResourceAllocation(traits)
    };
  }

  private determinePropertyFocus(traits: PersonalityTraits): GameplayPreferences['propertyFocus'] {
    if (traits.analytical > 0.7 && traits.patience > 0.6) return 'monopoly_building';
    if (traits.adaptability > 0.7) return 'diverse_portfolio';
    if (traits.aggression > 0.7) return 'strategic_blocking';
    return 'cash_hoarding';
  }

  private determineNegotiationStyle(traits: PersonalityTraits): GameplayPreferences['negotiationStyle'] {
    if (traits.aggression > 0.7) return 'aggressive';
    if (traits.social > 0.7 && traits.emotional < 0.5) return 'diplomatic';
    if (traits.analytical > 0.7) return 'calculative';
    return 'emotional';
  }

  private determineRiskManagement(traits: PersonalityTraits): GameplayPreferences['riskManagement'] {
    if (traits.risktaking > 0.8) return 'aggressive';
    if (traits.risktaking < 0.3) return 'conservative';
    if (traits.emotional > 0.8 && traits.analytical < 0.4) return 'chaotic';
    return 'moderate';
  }

  private determineSocialApproach(traits: PersonalityTraits): GameplayPreferences['socialApproach'] {
    if (traits.aggression > 0.7 && traits.social < 0.5) return 'competitive';
    if (traits.social > 0.7 && traits.loyalty > 0.6) return 'collaborative';
    if (traits.social > 0.7 && traits.loyalty < 0.4) return 'manipulative';
    return 'neutral';
  }

  private determineDecisionTiming(traits: PersonalityTraits): GameplayPreferences['timeDecisionMaking'] {
    if (traits.patience < 0.3) return 'impulsive';
    if (traits.analytical > 0.7) return 'deliberate';
    if (traits.aggression > 0.6 && traits.patience < 0.6) return 'quick';
    return 'variable';
  }

  private determineResourceAllocation(traits: PersonalityTraits): GameplayPreferences['resourceAllocation'] {
    if (traits.risktaking > 0.7) return 'property_heavy';
    if (traits.patience > 0.7 && traits.risktaking < 0.4) return 'cash_reserves';
    if (traits.analytical > 0.7 && traits.leadership > 0.6) return 'development_focused';
    return 'balanced';
  }

  private generateCharacterName(zodiacSign: ZodiacSign): string {
    const nameOptions = this.characterNameBank[zodiacSign.name.toLowerCase()];
    const baseName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
    const suffix = Math.random() > 0.7 ? ` the ${zodiacSign.name}` : '';
    return baseName + suffix;
  }

  private generateBackstory(zodiacSign: ZodiacSign, traits: PersonalityTraits): string {
    const backstories = {
      fire: "Born with an entrepreneurial fire, always seeking the next big opportunity.",
      earth: "Raised in a family of builders and planners, values steady growth and security.",
      air: "A natural communicator who sees patterns and connections others miss.",
      water: "Guided by intuition and emotional intelligence in all business dealings."
    };

    return backstories[zodiacSign.element];
  }

  private generateCatchphrase(zodiacSign: ZodiacSign, traits: PersonalityTraits): string {
    const catchphrases = {
      aries: "Strike first, ask questions later!",
      taurus: "Slow and steady builds the empire.",
      gemini: "Why choose one strategy when you can adapt them all?",
      cancer: "Trust your instincts, protect your assets.",
      leo: "Go big or go home!",
      virgo: "Perfection is in the details.",
      libra: "A fair deal benefits everyone.",
      scorpio: "Knowledge is power, secrets are weapons.",
      sagittarius: "Fortune favors the bold!",
      capricorn: "Success is built brick by brick.",
      aquarius: "Think different, play smarter.",
      pisces: "Follow the flow of opportunity."
    };

    return catchphrases[zodiacSign.name.toLowerCase() as keyof typeof catchphrases];
  }

  private generateAvatar(zodiacSign: ZodiacSign, traits: PersonalityTraits): AICharacterProfile['avatar'] {
    const elementColors = {
      fire: ['#FF6B35', '#F7931E', '#FFD700'],
      earth: ['#8B4513', '#228B22', '#DAA520'],
      air: ['#87CEEB', '#E6E6FA', '#F0F8FF'],
      water: ['#4682B4', '#008B8B', '#191970']
    };

    return {
      appearance: `${zodiacSign.element}_themed_character`,
      colors: elementColors[zodiacSign.element],
      style: traits.creativity > 0.7 ? 'artistic' : traits.analytical > 0.7 ? 'professional' : 'casual'
    };
  }

  private generateVoiceProfile(zodiacSign: ZodiacSign, traits: PersonalityTraits): AICharacterProfile['voiceProfile'] {
    return {
      tone: traits.aggression > 0.7 ? 'assertive' : traits.social > 0.7 ? 'friendly' : 'neutral',
      formality: traits.analytical > 0.7 ? 'professional' : traits.creativity > 0.7 ? 'quirky' : 'casual',
      verbosity: traits.social > 0.7 ? 'verbose' : traits.patience < 0.4 ? 'concise' : 'moderate'
    };
  }

  private generateLearningProfile(zodiacSign: ZodiacSign, traits: PersonalityTraits): AICharacterProfile['learningProfile'] {
    return {
      adaptationSpeed: traits.adaptability,
      memoryRetention: traits.analytical * 0.8 + traits.patience * 0.2,
      patternRecognition: traits.analytical * 0.7 + traits.intuition * 0.3,
      emotionalLearning: traits.emotional * 0.6 + traits.social * 0.4
    };
  }

  private generateRelationships(zodiacSign: ZodiacSign, traits: PersonalityTraits): AICharacterProfile['relationships'] {
    const compatibilityMap = {
      fire: { allies: ['air'], rivals: ['water'] },
      earth: { allies: ['water'], rivals: ['air'] },
      air: { allies: ['fire'], rivals: ['earth'] },
      water: { allies: ['earth'], rivals: ['fire'] }
    };

    const compatibility = compatibilityMap[zodiacSign.element];

    return {
      preferredAllies: compatibility.allies,
      naturalRivals: compatibility.rivals,
      trustLevel: traits.loyalty * 0.7 + traits.social * 0.3,
      communicationStyle: traits.social > 0.7 ? 'open' : traits.analytical > 0.7 ? 'strategic' : 'guarded'
    };
  }

  private normalizeTraits(traits: PersonalityTraits, balanceRequired: boolean): PersonalityTraits {
    if (!balanceRequired) return traits;

    const total = Object.values(traits).reduce((sum, val) => sum + val, 0);
    const target = Object.keys(traits).length * 0.5; // 目标总和
    const factor = target / total;

    const normalized: PersonalityTraits = {} as PersonalityTraits;
    for (const [key, value] of Object.entries(traits)) {
      normalized[key as keyof PersonalityTraits] = Math.max(0, Math.min(1, value * factor));
    }

    return normalized;
  }

  private getSignsByElementAndQuality(element: string, quality: string): string[] {
    return Object.entries(this.zodiacSigns)
      .filter(([_, sign]) => sign.element === element && sign.quality === quality)
      .map(([name]) => name);
  }

  private calculateDifficultyForPosition(position: number, total: number): CharacterGenerationConfig['difficultyLevel'] {
    const ratio = position / total;
    if (ratio < 0.25) return 'easy';
    if (ratio < 0.5) return 'medium';
    if (ratio < 0.75) return 'hard';
    return 'expert';
  }

  private balanceTeamDynamics(team: AICharacterProfile[]): AICharacterProfile[] {
    // 确保团队中有不同的游戏风格
    const styles = team.map(char => char.gameplayPreferences.propertyFocus);
    const uniqueStyles = new Set(styles);
    
    if (uniqueStyles.size < 3 && team.length >= 3) {
      // 重新平衡一些角色的游戏风格
      for (let i = 1; i < team.length; i++) {
        if (styles[i] === styles[0]) {
          team[i] = this.adjustCharacterStyle(team[i], i);
        }
      }
    }

    return team;
  }

  private adjustCharacterStyle(character: AICharacterProfile, index: number): AICharacterProfile {
    const newStyles: GameplayPreferences['propertyFocus'][] = [
      'monopoly_building', 'diverse_portfolio', 'strategic_blocking', 'cash_hoarding'
    ];
    
    character.gameplayPreferences.propertyFocus = newStyles[index % newStyles.length];
    return character;
  }

  public getCharacterAnalytics(character: AICharacterProfile): any {
    return {
      personalityVector: Object.values(character.personalityTraits),
      dominantTraits: this.getDominantTraits(character.personalityTraits),
      playStylePrediction: this.predictPlayStyle(character),
      strengthsWeaknesses: this.analyzeStrengthsWeaknesses(character),
      compatibilityMatrix: this.generateCompatibilityMatrix(character)
    };
  }

  private getDominantTraits(traits: PersonalityTraits): string[] {
    return Object.entries(traits)
      .filter(([_, value]) => value > 0.7)
      .map(([trait]) => trait)
      .slice(0, 3);
  }

  private predictPlayStyle(character: AICharacterProfile): string {
    const traits = character.personalityTraits;
    
    if (traits.aggression > 0.7 && traits.risktaking > 0.7) {
      return 'aggressive_dominator';
    } else if (traits.analytical > 0.7 && traits.patience > 0.7) {
      return 'strategic_calculator';
    } else if (traits.social > 0.7 && traits.adaptability > 0.7) {
      return 'diplomatic_networker';
    } else if (traits.intuition > 0.7 && traits.creativity > 0.7) {
      return 'intuitive_innovator';
    }
    
    return 'balanced_player';
  }

  private analyzeStrengthsWeaknesses(character: AICharacterProfile): any {
    const traits = character.personalityTraits;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (traits.analytical > 0.7) strengths.push('excellent_planning');
    if (traits.social > 0.7) strengths.push('strong_negotiation');
    if (traits.adaptability > 0.7) strengths.push('flexible_strategy');
    
    if (traits.emotional > 0.7) weaknesses.push('emotional_decisions');
    if (traits.patience < 0.3) weaknesses.push('impatient_moves');
    if (traits.risktaking > 0.8) weaknesses.push('excessive_risk');

    return { strengths, weaknesses };
  }

  private generateCompatibilityMatrix(character: AICharacterProfile): Record<string, number> {
    const compatibility: Record<string, number> = {};
    
    for (const [signName, sign] of Object.entries(this.zodiacSigns)) {
      if (sign.element === character.zodiacSign.element) {
        compatibility[signName] = 0.8;
      } else if (character.relationships.preferredAllies.includes(sign.element)) {
        compatibility[signName] = 0.9;
      } else if (character.relationships.naturalRivals.includes(sign.element)) {
        compatibility[signName] = 0.3;
      } else {
        compatibility[signName] = 0.6;
      }
    }

    return compatibility;
  }
}