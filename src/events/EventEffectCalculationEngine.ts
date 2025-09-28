/**
 * 事件效果计算引擎
 * Event Effect Calculation Engine
 * 
 * 处理事件效果的计算、应用和优化，支持复杂的效果组合和生肖加成
 * Handles calculation, application and optimization of event effects, supporting complex effect combinations and zodiac bonuses
 */

import { GameEvent, EventEffect, Player, GameState, ZodiacSign } from '../types/game';

export interface EffectCalculationContext {
  event: GameEvent;
  player: Player;
  gameState: GameState;
  targetPlayers?: Player[];
  environmentalFactors: EnvironmentalFactors;
  previousEffects: AppliedEffect[];
}

export interface EnvironmentalFactors {
  season: string;
  weather: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  gamePhase: string;
  marketConditions: MarketConditions;
  socialAtmosphere: SocialAtmosphere;
}

export interface MarketConditions {
  propertyPriceMultiplier: number;
  rentMultiplier: number;
  tradingVolume: number;
  economicStability: number;
  inflationRate: number;
}

export interface SocialAtmosphere {
  cooperationLevel: number;
  competitionIntensity: number;
  trustLevel: number;
  conflictLevel: number;
  groupMorale: number;
}

export interface CalculatedEffect {
  id: string;
  originalEffect: EventEffect;
  baseValue: number;
  modifiedValue: number;
  multipliers: EffectMultiplier[];
  bonuses: EffectBonus[];
  penalties: EffectPenalty[];
  finalValue: number;
  confidence: number;
  metadata: EffectMetadata;
}

export interface EffectMultiplier {
  source: MultiplierSource;
  type: string;
  value: number;
  description: string;
  conditions?: string[];
}

export interface EffectBonus {
  source: BonusSource;
  type: string;
  value: number;
  description: string;
  isPercentage: boolean;
}

export interface EffectPenalty {
  source: PenaltySource;
  type: string;
  value: number;
  description: string;
  isPercentage: boolean;
}

export type MultiplierSource = 
  | 'zodiac_synergy' | 'skill_enhancement' | 'item_effect' 
  | 'environmental' | 'social_bonus' | 'chain_reaction';

export type BonusSource = 
  | 'zodiac_compatibility' | 'seasonal_bonus' | 'achievement_bonus'
  | 'combo_bonus' | 'luck_factor' | 'relationship_bonus';

export type PenaltySource = 
  | 'zodiac_conflict' | 'resource_shortage' | 'bad_timing'
  | 'social_penalty' | 'environmental_debuff' | 'exhaustion';

export interface EffectMetadata {
  calculationTime: number;
  complexityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  impactScope: 'personal' | 'local' | 'global';
  reversibility: boolean;
  dependencies: string[];
}

export interface AppliedEffect {
  id: string;
  playerId: string;
  effect: CalculatedEffect;
  applicationTime: number;
  duration?: number;
  expiresAt?: number;
  status: 'active' | 'expired' | 'cancelled';
  actualImpact?: EffectImpactMeasurement;
}

export interface EffectImpactMeasurement {
  expectedChange: number;
  actualChange: number;
  variance: number;
  sideEffects: SideEffect[];
  playerSatisfaction: number;
}

export interface SideEffect {
  type: string;
  intensity: number;
  duration?: number;
  description: string;
  isPositive: boolean;
}

export interface EffectCombination {
  effects: CalculatedEffect[];
  combinationType: CombinationType;
  synergy: number;
  interference: number;
  resultEffect: CalculatedEffect;
}

export type CombinationType = 
  | 'additive' | 'multiplicative' | 'override' 
  | 'synergistic' | 'interfering' | 'sequential';

export interface ZodiacEffectModifier {
  zodiac: ZodiacSign;
  effectType: string;
  modifier: number;
  condition?: string;
  description: string;
}

export class EventEffectCalculationEngine {
  private zodiacModifiers = new Map<string, ZodiacEffectModifier[]>();
  private effectHistory = new Map<string, AppliedEffect[]>();
  private combinationRules = new Map<string, EffectCombination>();
  private calculationCache = new Map<string, CalculatedEffect>();

  constructor() {
    this.initializeZodiacModifiers();
    this.initializeCombinationRules();
  }

  /**
   * 计算事件效果
   */
  async calculateEventEffects(
    event: GameEvent,
    context: EffectCalculationContext
  ): Promise<CalculatedEffect[]> {
    const startTime = Date.now();
    const calculatedEffects: CalculatedEffect[] = [];

    if (!event.choices) {
      return calculatedEffects;
    }

    for (const choice of event.choices) {
      if (!choice.effects) continue;

      for (const effect of choice.effects) {
        const calculated = await this.calculateSingleEffect(effect, context);
        calculatedEffects.push(calculated);
      }
    }

    // 处理效果组合
    const combinedEffects = await this.processCombinedEffects(calculatedEffects, context);

    // 记录计算时间
    const calculationTime = Date.now() - startTime;
    combinedEffects.forEach(effect => {
      effect.metadata.calculationTime = calculationTime;
    });

    return combinedEffects;
  }

  /**
   * 计算单个效果
   */
  private async calculateSingleEffect(
    effect: EventEffect,
    context: EffectCalculationContext
  ): Promise<CalculatedEffect> {
    const cacheKey = this.generateCacheKey(effect, context);
    const cached = this.calculationCache.get(cacheKey);
    
    if (cached) {
      return { ...cached };
    }

    const baseValue = effect.value;
    let modifiedValue = baseValue;

    // 收集修饰符
    const multipliers: EffectMultiplier[] = [];
    const bonuses: EffectBonus[] = [];
    const penalties: EffectPenalty[] = [];

    // 应用生肖修饰符
    const zodiacMods = await this.applyZodiacModifiers(effect, context.player.zodiac, context);
    multipliers.push(...zodiacMods.multipliers);
    bonuses.push(...zodiacMods.bonuses);
    penalties.push(...zodiacMods.penalties);

    // 应用技能修饰符
    const skillMods = await this.applySkillModifiers(effect, context.player, context);
    multipliers.push(...skillMods.multipliers);
    bonuses.push(...skillMods.bonuses);

    // 应用环境修饰符
    const envMods = await this.applyEnvironmentalModifiers(effect, context.environmentalFactors);
    multipliers.push(...envMods.multipliers);
    bonuses.push(...envMods.bonuses);
    penalties.push(...envMods.penalties);

    // 应用社交修饰符
    const socialMods = await this.applySocialModifiers(effect, context);
    multipliers.push(...socialMods.multipliers);
    bonuses.push(...socialMods.bonuses);
    penalties.push(...socialMods.penalties);

    // 计算最终值
    const finalValue = this.calculateFinalValue(
      baseValue,
      multipliers,
      bonuses,
      penalties
    );

    const calculatedEffect: CalculatedEffect = {
      id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalEffect: effect,
      baseValue,
      modifiedValue,
      multipliers,
      bonuses,
      penalties,
      finalValue,
      confidence: this.calculateConfidence(multipliers, bonuses, penalties),
      metadata: {
        calculationTime: 0,
        complexityScore: this.calculateComplexityScore(multipliers, bonuses, penalties),
        riskLevel: this.assessRiskLevel(effect, finalValue),
        impactScope: this.determineImpactScope(effect, context),
        reversibility: this.isReversible(effect),
        dependencies: this.extractDependencies(multipliers, bonuses, penalties)
      }
    };

    // 缓存结果
    this.calculationCache.set(cacheKey, calculatedEffect);

    return calculatedEffect;
  }

  /**
   * 应用生肖修饰符
   */
  private async applyZodiacModifiers(
    effect: EventEffect,
    zodiac: ZodiacSign,
    context: EffectCalculationContext
  ): Promise<{
    multipliers: EffectMultiplier[];
    bonuses: EffectBonus[];
    penalties: EffectPenalty[];
  }> {
    const multipliers: EffectMultiplier[] = [];
    const bonuses: EffectBonus[] = [];
    const penalties: EffectPenalty[] = [];

    const modifiers = this.zodiacModifiers.get(zodiac) || [];

    for (const modifier of modifiers) {
      if (modifier.effectType === effect.type || modifier.effectType === '*') {
        // 检查条件
        if (modifier.condition && !this.checkZodiacCondition(modifier.condition, context)) {
          continue;
        }

        if (modifier.modifier > 1) {
          multipliers.push({
            source: 'zodiac_synergy',
            type: 'zodiac_bonus',
            value: modifier.modifier,
            description: `${zodiac}生肖加成: ${modifier.description}`,
            conditions: modifier.condition ? [modifier.condition] : undefined
          });
        } else if (modifier.modifier > 0) {
          bonuses.push({
            source: 'zodiac_compatibility',
            type: 'zodiac_bonus',
            value: modifier.modifier,
            description: `${zodiac}生肖加成: ${modifier.description}`,
            isPercentage: false
          });
        } else {
          penalties.push({
            source: 'zodiac_conflict',
            type: 'zodiac_penalty',
            value: Math.abs(modifier.modifier),
            description: `${zodiac}生肖冲突: ${modifier.description}`,
            isPercentage: false
          });
        }
      }
    }

    return { multipliers, bonuses, penalties };
  }

  /**
   * 应用技能修饰符
   */
  private async applySkillModifiers(
    effect: EventEffect,
    player: Player,
    context: EffectCalculationContext
  ): Promise<{
    multipliers: EffectMultiplier[];
    bonuses: EffectBonus[];
  }> {
    const multipliers: EffectMultiplier[] = [];
    const bonuses: EffectBonus[] = [];

    for (const skill of player.skills) {
      // 检查技能是否对此效果有增强
      const enhancement = this.getSkillEnhancement(skill, effect.type);
      if (enhancement) {
        if (enhancement.type === 'multiplier') {
          multipliers.push({
            source: 'skill_enhancement',
            type: 'skill_bonus',
            value: enhancement.value,
            description: `技能${skill.name}增强`,
            conditions: [`skill_level >= ${enhancement.minLevel || 1}`]
          });
        } else {
          bonuses.push({
            source: 'zodiac_compatibility',
            type: 'skill_bonus',
            value: enhancement.value,
            description: `技能${skill.name}加成`,
            isPercentage: enhancement.isPercentage
          });
        }
      }
    }

    return { multipliers, bonuses };
  }

  /**
   * 应用环境修饰符
   */
  private async applyEnvironmentalModifiers(
    effect: EventEffect,
    factors: EnvironmentalFactors
  ): Promise<{
    multipliers: EffectMultiplier[];
    bonuses: EffectBonus[];
    penalties: EffectPenalty[];
  }> {
    const multipliers: EffectMultiplier[] = [];
    const bonuses: EffectBonus[] = [];
    const penalties: EffectPenalty[] = [];

    // 季节修饰符
    const seasonalModifier = this.getSeasonalModifier(effect.type, factors.season);
    if (seasonalModifier !== 1) {
      if (seasonalModifier > 1) {
        multipliers.push({
          source: 'environmental',
          type: 'seasonal',
          value: seasonalModifier,
          description: `${factors.season}季节加成`,
        });
      } else {
        penalties.push({
          source: 'environmental_debuff',
          type: 'seasonal',
          value: 1 - seasonalModifier,
          description: `${factors.season}季节减成`,
          isPercentage: true
        });
      }
    }

    // 天气修饰符
    const weatherModifier = this.getWeatherModifier(effect.type, factors.weather);
    if (weatherModifier !== 0) {
      if (weatherModifier > 0) {
        bonuses.push({
          source: 'zodiac_compatibility',
          type: 'weather',
          value: weatherModifier,
          description: `${factors.weather}天气加成`,
          isPercentage: false
        });
      } else {
        penalties.push({
          source: 'environmental_debuff',
          type: 'weather',
          value: Math.abs(weatherModifier),
          description: `${factors.weather}天气减成`,
          isPercentage: false
        });
      }
    }

    // 市场条件修饰符
    if (effect.type === 'money') {
      const marketMultiplier = factors.marketConditions.economicStability;
      if (marketMultiplier !== 1) {
        multipliers.push({
          source: 'environmental',
          type: 'market_conditions',
          value: marketMultiplier,
          description: '市场条件影响',
        });
      }
    }

    return { multipliers, bonuses, penalties };
  }

  /**
   * 应用社交修饰符
   */
  private async applySocialModifiers(
    effect: EventEffect,
    context: EffectCalculationContext
  ): Promise<{
    multipliers: EffectMultiplier[];
    bonuses: EffectBonus[];
    penalties: EffectPenalty[];
  }> {
    const multipliers: EffectMultiplier[] = [];
    const bonuses: EffectBonus[] = [];
    const penalties: EffectPenalty[] = [];

    const social = context.environmentalFactors.socialAtmosphere;

    // 合作水平影响
    if (effect.target === 'all_players' || effect.target === 'other_players') {
      const cooperationBonus = (social.cooperationLevel - 0.5) * 0.3;
      if (cooperationBonus > 0) {
        bonuses.push({
          source: 'relationship_bonus',
          type: 'cooperation',
          value: cooperationBonus,
          description: '良好合作关系加成',
          isPercentage: true
        });
      } else if (cooperationBonus < 0) {
        penalties.push({
          source: 'social_penalty',
          type: 'cooperation',
          value: Math.abs(cooperationBonus),
          description: '合作关系不佳减成',
          isPercentage: true
        });
      }
    }

    // 信任度影响
    if (social.trustLevel > 0.7) {
      multipliers.push({
        source: 'social_bonus',
        type: 'trust',
        value: 1.1,
        description: '高信任度加成',
      });
    } else if (social.trustLevel < 0.3) {
      penalties.push({
        source: 'social_penalty',
        type: 'trust',
        value: 0.2,
        description: '低信任度减成',
        isPercentage: true
      });
    }

    return { multipliers, bonuses, penalties };
  }

  /**
   * 计算最终值
   */
  private calculateFinalValue(
    baseValue: number,
    multipliers: EffectMultiplier[],
    bonuses: EffectBonus[],
    penalties: EffectPenalty[]
  ): number {
    let value = baseValue;

    // 应用加成
    for (const bonus of bonuses) {
      if (bonus.isPercentage) {
        value *= (1 + bonus.value);
      } else {
        value += bonus.value;
      }
    }

    // 应用减成
    for (const penalty of penalties) {
      if (penalty.isPercentage) {
        value *= (1 - penalty.value);
      } else {
        value -= penalty.value;
      }
    }

    // 应用乘数
    for (const multiplier of multipliers) {
      value *= multiplier.value;
    }

    return Math.round(value * 100) / 100; // 保留两位小数
  }

  /**
   * 处理组合效果
   */
  private async processCombinedEffects(
    effects: CalculatedEffect[],
    context: EffectCalculationContext
  ): Promise<CalculatedEffect[]> {
    const combinedEffects: CalculatedEffect[] = [];
    const processedEffects = new Set<string>();

    for (const effect of effects) {
      if (processedEffects.has(effect.id)) {
        continue;
      }

      // 查找可组合的效果
      const combinableEffects = this.findCombinableEffects(effect, effects);
      
      if (combinableEffects.length > 1) {
        const combination = await this.createEffectCombination(combinableEffects, context);
        combinedEffects.push(combination.resultEffect);
        
        // 标记已处理
        combinableEffects.forEach(e => processedEffects.add(e.id));
      } else {
        combinedEffects.push(effect);
        processedEffects.add(effect.id);
      }
    }

    return combinedEffects;
  }

  /**
   * 查找可组合的效果
   */
  private findCombinableEffects(
    baseEffect: CalculatedEffect,
    allEffects: CalculatedEffect[]
  ): CalculatedEffect[] {
    const combinable = [baseEffect];

    for (const effect of allEffects) {
      if (effect.id === baseEffect.id) continue;

      // 检查是否为相同类型的效果
      if (effect.originalEffect.type === baseEffect.originalEffect.type &&
          effect.originalEffect.target === baseEffect.originalEffect.target) {
        combinable.push(effect);
      }
    }

    return combinable;
  }

  /**
   * 创建效果组合
   */
  private async createEffectCombination(
    effects: CalculatedEffect[],
    context: EffectCalculationContext
  ): Promise<EffectCombination> {
    const combinationType = this.determineCombinationType(effects);
    let resultValue = 0;
    let synergy = 0;
    let interference = 0;

    switch (combinationType) {
      case 'additive':
        resultValue = effects.reduce((sum, effect) => sum + effect.finalValue, 0);
        synergy = effects.length > 2 ? 0.1 : 0;
        break;

      case 'multiplicative':
        resultValue = effects.reduce((product, effect) => product * (1 + effect.finalValue / 100), 1) - 1;
        synergy = effects.length > 2 ? 0.15 : 0;
        break;

      case 'synergistic':
        resultValue = effects.reduce((sum, effect) => sum + effect.finalValue, 0);
        synergy = 0.25; // 25% 协同加成
        resultValue *= (1 + synergy);
        break;

      case 'interfering':
        resultValue = effects.reduce((sum, effect) => sum + effect.finalValue, 0);
        interference = 0.15; // 15% 干扰减成
        resultValue *= (1 - interference);
        break;

      default:
        resultValue = effects[0]?.finalValue || 0;
    }

    const resultEffect: CalculatedEffect = {
      id: `combo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalEffect: effects[0].originalEffect,
      baseValue: effects.reduce((sum, e) => sum + e.baseValue, 0),
      modifiedValue: effects.reduce((sum, e) => sum + e.modifiedValue, 0),
      multipliers: effects.flatMap(e => e.multipliers),
      bonuses: effects.flatMap(e => e.bonuses),
      penalties: effects.flatMap(e => e.penalties),
      finalValue: resultValue,
      confidence: this.calculateCombinationConfidence(effects),
      metadata: {
        calculationTime: 0,
        complexityScore: Math.max(...effects.map(e => e.metadata.complexityScore)) + 1,
        riskLevel: this.assessCombinationRisk(effects),
        impactScope: this.determineCombinationScope(effects),
        reversibility: effects.every(e => e.metadata.reversibility),
        dependencies: effects.flatMap(e => e.metadata.dependencies)
      }
    };

    return {
      effects,
      combinationType,
      synergy,
      interference,
      resultEffect
    };
  }

  /**
   * 应用计算的效果
   */
  async applyCalculatedEffects(
    effects: CalculatedEffect[],
    context: EffectCalculationContext
  ): Promise<AppliedEffect[]> {
    const appliedEffects: AppliedEffect[] = [];

    for (const effect of effects) {
      const applied = await this.applySingleEffect(effect, context);
      appliedEffects.push(applied);
      
      // 记录到历史
      const playerHistory = this.effectHistory.get(context.player.id) || [];
      playerHistory.push(applied);
      this.effectHistory.set(context.player.id, playerHistory);
    }

    return appliedEffects;
  }

  /**
   * 应用单个效果
   */
  private async applySingleEffect(
    effect: CalculatedEffect,
    context: EffectCalculationContext
  ): Promise<AppliedEffect> {
    const applied: AppliedEffect = {
      id: `applied_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: context.player.id,
      effect,
      applicationTime: Date.now(),
      duration: effect.originalEffect.duration,
      status: 'active'
    };

    if (effect.originalEffect.duration) {
      applied.expiresAt = Date.now() + effect.originalEffect.duration;
    }

    // 应用效果到游戏状态
    await this.applyEffectToGameState(effect, context);

    return applied;
  }

  /**
   * 应用效果到游戏状态
   */
  private async applyEffectToGameState(
    effect: CalculatedEffect,
    context: EffectCalculationContext
  ): Promise<void> {
    const target = effect.originalEffect.target;
    const value = effect.finalValue;

    switch (effect.originalEffect.type) {
      case 'money':
        if (target === 'self') {
          context.player.money += value;
        } else if (target === 'all_players') {
          context.gameState.players.forEach(player => {
            player.money += value;
          });
        }
        break;

      case 'position':
        if (target === 'self') {
          context.player.position = Math.max(0, Math.min(39, context.player.position + value));
        }
        break;

      // 添加其他效果类型的处理
    }
  }

  // 辅助方法

  private generateCacheKey(effect: EventEffect, context: EffectCalculationContext): string {
    return `${effect.type}_${effect.value}_${context.player.zodiac}_${context.environmentalFactors.season}`;
  }

  private calculateConfidence(
    multipliers: EffectMultiplier[],
    bonuses: EffectBonus[],
    penalties: EffectPenalty[]
  ): number {
    const modifierCount = multipliers.length + bonuses.length + penalties.length;
    return Math.max(0.5, 1 - (modifierCount * 0.05)); // 修饰符越多，置信度越低
  }

  private calculateComplexityScore(
    multipliers: EffectMultiplier[],
    bonuses: EffectBonus[],
    penalties: EffectPenalty[]
  ): number {
    return multipliers.length + bonuses.length + penalties.length;
  }

  private assessRiskLevel(effect: EventEffect, finalValue: number): 'low' | 'medium' | 'high' {
    const change = Math.abs(finalValue - effect.value);
    const changeRatio = change / Math.abs(effect.value || 1);
    
    if (changeRatio > 0.5) return 'high';
    if (changeRatio > 0.2) return 'medium';
    return 'low';
  }

  private determineImpactScope(effect: EventEffect, context: EffectCalculationContext): 'personal' | 'local' | 'global' {
    switch (effect.target) {
      case 'self': return 'personal';
      case 'other_players': return 'local';
      case 'all_players': return 'global';
      default: return 'personal';
    }
  }

  private isReversible(effect: EventEffect): boolean {
    // 大多数效果都是可逆的，除非是特殊的永久性效果
    return !['property', 'skill_cooldown'].includes(effect.type);
  }

  private extractDependencies(
    multipliers: EffectMultiplier[],
    bonuses: EffectBonus[],
    penalties: EffectPenalty[]
  ): string[] {
    const dependencies = new Set<string>();
    
    [...multipliers, ...bonuses, ...penalties].forEach(modifier => {
      if (modifier.conditions) {
        modifier.conditions.forEach(condition => dependencies.add(condition));
      }
    });
    
    return Array.from(dependencies);
  }

  private checkZodiacCondition(condition: string, context: EffectCalculationContext): boolean {
    // 简化的条件检查实现
    return true;
  }

  private getSkillEnhancement(skill: any, effectType: string): any {
    // 简化的技能增强检查
    return null;
  }

  private getSeasonalModifier(effectType: string, season: string): number {
    // 简化的季节修饰符
    return 1;
  }

  private getWeatherModifier(effectType: string, weather: string): number {
    // 简化的天气修饰符
    return 0;
  }

  private determineCombinationType(effects: CalculatedEffect[]): CombinationType {
    // 简化的组合类型判断
    return 'additive';
  }

  private calculateCombinationConfidence(effects: CalculatedEffect[]): number {
    const avgConfidence = effects.reduce((sum, e) => sum + e.confidence, 0) / effects.length;
    return avgConfidence * 0.9; // 组合效果的置信度略低
  }

  private assessCombinationRisk(effects: CalculatedEffect[]): 'low' | 'medium' | 'high' {
    const riskLevels = effects.map(e => e.metadata.riskLevel);
    if (riskLevels.includes('high')) return 'high';
    if (riskLevels.includes('medium')) return 'medium';
    return 'low';
  }

  private determineCombinationScope(effects: CalculatedEffect[]): 'personal' | 'local' | 'global' {
    const scopes = effects.map(e => e.metadata.impactScope);
    if (scopes.includes('global')) return 'global';
    if (scopes.includes('local')) return 'local';
    return 'personal';
  }

  private initializeZodiacModifiers(): void {
    // 初始化生肖修饰符数据
    const zodiacSigns: ZodiacSign[] = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    
    zodiacSigns.forEach(zodiac => {
      this.zodiacModifiers.set(zodiac, [
        {
          zodiac,
          effectType: 'money',
          modifier: 0.1,
          description: '基础财运加成'
        }
      ]);
    });
  }

  private initializeCombinationRules(): void {
    // 初始化效果组合规则
  }

  /**
   * 获取效果历史
   */
  getEffectHistory(playerId: string): AppliedEffect[] {
    return this.effectHistory.get(playerId) || [];
  }

  /**
   * 清理过期效果
   */
  cleanupExpiredEffects(): void {
    const now = Date.now();
    
    for (const [playerId, effects] of this.effectHistory) {
      const activeEffects = effects.filter(effect => {
        if (effect.expiresAt && effect.expiresAt < now) {
          effect.status = 'expired';
          return false;
        }
        return effect.status === 'active';
      });
      
      this.effectHistory.set(playerId, activeEffects);
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics(): any {
    return {
      totalCalculations: this.calculationCache.size,
      activeEffects: Array.from(this.effectHistory.values())
        .flat()
        .filter(e => e.status === 'active').length,
      zodiacModifiers: this.zodiacModifiers.size,
      combinationRules: this.combinationRules.size
    };
  }
}