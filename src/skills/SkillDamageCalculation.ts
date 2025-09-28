/**
 * 技能伤害和治疗计算系统
 * 第二阶段 Day 2: 技能效果实现
 * 
 * 实现复杂的伤害和治疗计算逻辑，包括：
 * - 多因子伤害计算
 * - 生肖特性影响
 * - 季节和时间修正
 * - 装备和状态效果
 * - 抗性和免疫系统
 * - 伤害类型和元素系统
 */

import type { GameState, Player, ZodiacSign } from '../types/game';
import {
  SkillEffect,
  SkillEffectType,
  SkillTargetType,
  SkillDefinition
} from './SkillSystemArchitecture';
import { ZODIAC_SKILL_TRAITS } from './SkillDataStructures';

/**
 * 伤害类型枚举
 */
export enum DamageType {
  PHYSICAL = 'physical',      // 物理伤害
  MAGICAL = 'magical',        // 魔法伤害
  FINANCIAL = 'financial',    // 经济伤害
  SOCIAL = 'social',          // 社交伤害
  TEMPORAL = 'temporal',      // 时间伤害
  ZODIAC = 'zodiac'          // 生肖伤害
}

/**
 * 元素类型（基于五行）
 */
export enum ElementType {
  METAL = 'metal',    // 金
  WOOD = 'wood',      // 木
  WATER = 'water',    // 水
  FIRE = 'fire',      // 火
  EARTH = 'earth',    // 土
  NEUTRAL = 'neutral' // 无属性
}

/**
 * 抗性类型
 */
export enum ResistanceType {
  DAMAGE_REDUCTION = 'damage_reduction',    // 伤害减免
  ELEMENT_RESISTANCE = 'element_resistance', // 元素抗性
  STATUS_IMMUNITY = 'status_immunity',       // 状态免疫
  CRITICAL_PROTECTION = 'critical_protection' // 暴击保护
}

/**
 * 详细伤害计算结果
 */
export interface DetailedDamageResult {
  // 基础信息
  baseDamage: number;
  finalDamage: number;
  damageType: DamageType;
  elementType: ElementType;
  
  // 计算细节
  breakdown: DamageCalculationBreakdown;
  
  // 特殊效果
  isCritical: boolean;
  isResisted: boolean;
  isImmune: boolean;
  isHealing: boolean;
  
  // 修正因子
  modifiers: DamageModifier[];
  
  // 额外信息
  penetration: number;        // 穿透值
  overhealing: number;        // 过量治疗
  reflectedDamage: number;    // 反射伤害
  
  // 视觉和音效
  animationData: any;
  soundEffects: string[];
  
  // 描述
  description: string;
  detailedLog: string[];
}

/**
 * 伤害计算细节分解
 */
export interface DamageCalculationBreakdown {
  // 基础值
  baseValue: number;
  skillLevel: number;
  casterLevel: number;
  
  // 属性加成
  primaryAttribute: number;
  secondaryAttribute: number;
  
  // 技能相关
  skillMastery: number;
  skillEnhancement: number;
  comboBonus: number;
  
  // 生肖相关
  zodiacSynergy: number;
  zodiacConflict: number;
  seasonalBonus: number;
  
  // 装备和状态
  equipmentBonus: number;
  statusEffectBonus: number;
  temporaryBonus: number;
  
  // 目标相关
  targetResistance: number;
  targetVulnerability: number;
  armorReduction: number;
  
  // 随机和特殊
  criticalMultiplier: number;
  randomVariation: number;
  environmentalFactor: number;
  
  // 最终修正
  finalMultiplier: number;
  cappingReduction: number;
}

/**
 * 伤害修正器
 */
export interface DamageModifier {
  id: string;
  name: string;
  type: 'multiplier' | 'additive' | 'override';
  value: number;
  source: string;
  description: string;
  priority: number;
}

/**
 * 伤害计算上下文
 */
export interface DamageCalculationContext {
  // 基础信息
  caster: Player;
  targets: Player[];
  skill: SkillDefinition;
  effect: SkillEffect;
  gameState: GameState;
  
  // 技能上下文
  skillLevel: number;
  isCombo: boolean;
  isChain: boolean;
  chainLength: number;
  
  // 环境因子
  season: string;
  timeOfDay: 'morning' | 'noon' | 'evening' | 'night';
  weatherEffect?: string;
  
  // 特殊修正
  customModifiers: DamageModifier[];
  ignoreResistance: boolean;
  guaranteedCritical: boolean;
  
  // 历史记录
  recentDamage: number[];
  consecutiveCrits: number;
}

/**
 * 技能伤害和治疗计算器
 */
export class SkillDamageCalculator {
  private elementalMatrix: Map<ElementType, Map<ElementType, number>>;
  private zodiacElementMap: Map<ZodiacSign, ElementType>;
  private damageCapLimits: Map<DamageType, number>;
  private criticalHitCache: Map<string, number> = new Map();

  constructor() {
    this.initializeElementalSystem();
    this.initializeZodiacElements();
    this.initializeDamageCaps();
    console.log('⚔️ 技能伤害计算系统初始化完成');
  }

  /**
   * 初始化五行相克系统
   */
  private initializeElementalSystem(): void {
    this.elementalMatrix = new Map();
    
    // 设置五行相生相克关系
    // 金克木，木克土，土克水，水克火，火克金
    const metalMap = new Map([
      [ElementType.METAL, 1.0],
      [ElementType.WOOD, 1.3],    // 金克木
      [ElementType.WATER, 0.8],   // 水生金
      [ElementType.FIRE, 0.7],    // 火克金
      [ElementType.EARTH, 1.1],   // 土生金
      [ElementType.NEUTRAL, 1.0]
    ]);

    const woodMap = new Map([
      [ElementType.METAL, 0.7],   // 金克木
      [ElementType.WOOD, 1.0],
      [ElementType.WATER, 1.2],   // 水生木
      [ElementType.FIRE, 0.8],    // 木生火
      [ElementType.EARTH, 1.3],   // 木克土
      [ElementType.NEUTRAL, 1.0]
    ]);

    const waterMap = new Map([
      [ElementType.METAL, 1.2],   // 水生金 -> 金反哺水
      [ElementType.WOOD, 0.8],    // 水生木
      [ElementType.WATER, 1.0],
      [ElementType.FIRE, 1.3],    // 水克火
      [ElementType.EARTH, 0.7],   // 土克水
      [ElementType.NEUTRAL, 1.0]
    ]);

    const fireMap = new Map([
      [ElementType.METAL, 1.3],   // 火克金
      [ElementType.WOOD, 1.2],    // 木生火
      [ElementType.WATER, 0.7],   // 水克火
      [ElementType.FIRE, 1.0],
      [ElementType.EARTH, 0.8],   // 火生土
      [ElementType.NEUTRAL, 1.0]
    ]);

    const earthMap = new Map([
      [ElementType.METAL, 0.9],   // 土生金
      [ElementType.WOOD, 0.7],    // 木克土
      [ElementType.WATER, 1.3],   // 土克水
      [ElementType.FIRE, 1.2],    // 火生土
      [ElementType.EARTH, 1.0],
      [ElementType.NEUTRAL, 1.0]
    ]);

    const neutralMap = new Map([
      [ElementType.METAL, 1.0],
      [ElementType.WOOD, 1.0],
      [ElementType.WATER, 1.0],
      [ElementType.FIRE, 1.0],
      [ElementType.EARTH, 1.0],
      [ElementType.NEUTRAL, 1.0]
    ]);

    this.elementalMatrix.set(ElementType.METAL, metalMap);
    this.elementalMatrix.set(ElementType.WOOD, woodMap);
    this.elementalMatrix.set(ElementType.WATER, waterMap);
    this.elementalMatrix.set(ElementType.FIRE, fireMap);
    this.elementalMatrix.set(ElementType.EARTH, earthMap);
    this.elementalMatrix.set(ElementType.NEUTRAL, neutralMap);
  }

  /**
   * 初始化生肖元素映射
   */
  private initializeZodiacElements(): void {
    this.zodiacElementMap = new Map([
      ['鼠', ElementType.WATER],
      ['牛', ElementType.EARTH],
      ['虎', ElementType.WOOD],
      ['兔', ElementType.WOOD],
      ['龙', ElementType.EARTH],
      ['蛇', ElementType.FIRE],
      ['马', ElementType.FIRE],
      ['羊', ElementType.EARTH],
      ['猴', ElementType.METAL],
      ['鸡', ElementType.METAL],
      ['狗', ElementType.EARTH],
      ['猪', ElementType.WATER]
    ]);
  }

  /**
   * 初始化伤害上限
   */
  private initializeDamageCaps(): void {
    this.damageCapLimits = new Map([
      [DamageType.FINANCIAL, 10000],  // 金钱伤害上限
      [DamageType.PHYSICAL, 5000],    // 物理伤害上限
      [DamageType.MAGICAL, 8000],     // 魔法伤害上限
      [DamageType.SOCIAL, 3000],      // 社交伤害上限
      [DamageType.TEMPORAL, 2000],    // 时间伤害上限
      [DamageType.ZODIAC, 15000]      // 生肖伤害上限
    ]);
  }

  /**
   * 主要伤害计算接口
   */
  public calculateDetailedDamage(context: DamageCalculationContext): DetailedDamageResult {
    const breakdown = this.initializeBreakdown(context);
    const damageType = this.determineDamageType(context.effect);
    const elementType = this.determineElementType(context);
    
    console.log(`💥 计算伤害: ${context.effect.type} | 伤害类型: ${damageType} | 元素类型: ${elementType}`);

    // 1. 基础伤害计算
    this.calculateBaseDamage(breakdown, context);
    
    // 2. 技能相关加成
    this.applySkillModifiers(breakdown, context);
    
    // 3. 生肖和元素加成
    this.applyZodiacAndElementalModifiers(breakdown, context, elementType);
    
    // 4. 装备和状态效果
    this.applyEquipmentAndStatusModifiers(breakdown, context);
    
    // 5. 目标抗性计算
    this.applyTargetResistance(breakdown, context, damageType);
    
    // 6. 暴击计算
    const isCritical = this.calculateCritical(breakdown, context);
    
    // 7. 随机变化
    this.applyRandomVariation(breakdown, context);
    
    // 8. 环境和特殊修正
    this.applyEnvironmentalModifiers(breakdown, context);
    
    // 9. 最终计算和上限检查
    const finalDamage = this.calculateFinalDamage(breakdown, damageType);
    
    // 10. 生成结果
    return this.generateDamageResult(
      breakdown, 
      finalDamage, 
      damageType, 
      elementType, 
      isCritical, 
      context
    );
  }

  /**
   * 初始化伤害计算细节
   */
  private initializeBreakdown(context: DamageCalculationContext): DamageCalculationBreakdown {
    const baseValue = typeof context.effect.value === 'number' ? 
      Math.abs(context.effect.value) : 100;

    return {
      baseValue,
      skillLevel: context.skillLevel || 1,
      casterLevel: context.caster.level || 1,
      primaryAttribute: 0,
      secondaryAttribute: 0,
      skillMastery: 0,
      skillEnhancement: 0,
      comboBonus: 0,
      zodiacSynergy: 0,
      zodiacConflict: 0,
      seasonalBonus: 0,
      equipmentBonus: 0,
      statusEffectBonus: 0,
      temporaryBonus: 0,
      targetResistance: 0,
      targetVulnerability: 0,
      armorReduction: 0,
      criticalMultiplier: 1,
      randomVariation: 0,
      environmentalFactor: 0,
      finalMultiplier: 1,
      cappingReduction: 0
    };
  }

  /**
   * 确定伤害类型
   */
  private determineDamageType(effect: SkillEffect): DamageType {
    switch (effect.type) {
      case SkillEffectType.MONEY_GAIN:
      case SkillEffectType.MONEY_LOSS:
      case SkillEffectType.MONEY_STEAL:
      case SkillEffectType.MONEY_TRANSFER:
        return DamageType.FINANCIAL;
        
      case SkillEffectType.STATUS_BUFF:
      case SkillEffectType.STATUS_DEBUFF:
        return DamageType.SOCIAL;
        
      case SkillEffectType.POSITION_MOVE:
      case SkillEffectType.POSITION_TELEPORT:
        return DamageType.TEMPORAL;
        
      case SkillEffectType.SKILL_POWER_BOOST:
      case SkillEffectType.SKILL_DISABLE:
        return DamageType.MAGICAL;
        
      default:
        return DamageType.PHYSICAL;
    }
  }

  /**
   * 确定元素类型
   */
  private determineElementType(context: DamageCalculationContext): ElementType {
    // 首先检查技能是否指定了元素类型
    if (context.effect.modifiers?.element) {
      return context.effect.modifiers.element as ElementType;
    }
    
    // 基于生肖确定元素类型
    const casterElement = this.zodiacElementMap.get(context.caster.zodiac);
    if (casterElement) {
      return casterElement;
    }
    
    // 基于季节确定元素类型
    const seasonElementMap = {
      '春': ElementType.WOOD,
      '夏': ElementType.FIRE,
      '秋': ElementType.METAL,
      '冬': ElementType.WATER
    };
    
    return seasonElementMap[context.season as keyof typeof seasonElementMap] || ElementType.NEUTRAL;
  }

  /**
   * 计算基础伤害
   */
  private calculateBaseDamage(breakdown: DamageCalculationBreakdown, context: DamageCalculationContext): void {
    // 技能等级缩放
    const levelScaling = context.effect.modifiers?.scaling || 1.1;
    const levelMultiplier = Math.pow(levelScaling, breakdown.skillLevel - 1);
    breakdown.baseValue *= levelMultiplier;
    
    // 施法者等级影响
    breakdown.casterLevel = context.caster.level || 1;
    breakdown.primaryAttribute = breakdown.baseValue * (breakdown.casterLevel / 10);
    
    // 技能熟练度（基于使用次数）
    const skillUsageCount = context.caster.skillUsageStats?.[context.skill.id] || 0;
    breakdown.skillMastery = Math.min(skillUsageCount * 0.01, 0.5) * breakdown.baseValue;
  }

  /**
   * 应用技能相关修正
   */
  private applySkillModifiers(breakdown: DamageCalculationBreakdown, context: DamageCalculationContext): void {
    // 技能增强效果
    const skillEnhancements = context.caster.statusEffects
      .filter(se => se.type === 'skill_power_boost')
      .reduce((total, se) => total + (se.value || 0), 0);
    breakdown.skillEnhancement = breakdown.baseValue * skillEnhancements;
    
    // 组合加成
    if (context.isCombo) {
      breakdown.comboBonus = breakdown.baseValue * 0.25; // 25%组合加成
    }
    
    // 链式伤害衰减
    if (context.isChain && context.chainLength > 0) {
      const chainReduction = Math.pow(0.8, context.chainLength - 1);
      breakdown.baseValue *= chainReduction;
    }
  }

  /**
   * 应用生肖和元素修正
   */
  private applyZodiacAndElementalModifiers(
    breakdown: DamageCalculationBreakdown, 
    context: DamageCalculationContext,
    elementType: ElementType
  ): void {
    // 生肖协同效应
    const casterZodiac = context.caster.zodiac;
    const casterElement = this.zodiacElementMap.get(casterZodiac);
    
    if (casterElement === elementType) {
      breakdown.zodiacSynergy = breakdown.baseValue * 0.15; // 15%协同加成
    }

    // 计算对目标的元素克制
    let elementalBonus = 0;
    for (const target of context.targets) {
      const targetElement = this.zodiacElementMap.get(target.zodiac);
      if (targetElement && casterElement) {
        const effectiveness = this.elementalMatrix.get(casterElement)?.get(targetElement) || 1.0;
        elementalBonus += (effectiveness - 1.0) * breakdown.baseValue;
      }
    }
    breakdown.zodiacSynergy += elementalBonus / context.targets.length;

    // 季节加成
    const zodiacTrait = ZODIAC_SKILL_TRAITS[casterZodiac];
    if (zodiacTrait && zodiacTrait.seasonBonus === context.season) {
      breakdown.seasonalBonus = breakdown.baseValue * 0.3; // 30%季节加成
    }

    // 生肖冲突惩罚（对立生肖）
    const conflictMap = {
      '鼠': '马', '牛': '羊', '虎': '猴', '兔': '鸡', 
      '龙': '狗', '蛇': '猪', '马': '鼠', '羊': '牛',
      '猴': '虎', '鸡': '兔', '狗': '龙', '猪': '蛇'
    };
    
    const conflictZodiac = conflictMap[casterZodiac as keyof typeof conflictMap];
    if (context.targets.some(t => t.zodiac === conflictZodiac)) {
      breakdown.zodiacConflict = -breakdown.baseValue * 0.1; // -10%冲突惩罚
    }
  }

  /**
   * 应用装备和状态效果修正
   */
  private applyEquipmentAndStatusModifiers(
    breakdown: DamageCalculationBreakdown, 
    context: DamageCalculationContext
  ): void {
    // 状态效果加成
    const buffEffects = context.caster.statusEffects
      .filter(se => se.type === 'status_buff' && se.value > 0)
      .reduce((total, se) => total + se.value, 0);
    breakdown.statusEffectBonus = breakdown.baseValue * buffEffects;

    // 临时加成（如道具效果）
    const temporaryBuffs = context.customModifiers
      .filter(mod => mod.type === 'multiplier')
      .reduce((total, mod) => total * mod.value, 1) - 1;
    breakdown.temporaryBonus = breakdown.baseValue * temporaryBuffs;
  }

  /**
   * 应用目标抗性
   */
  private applyTargetResistance(
    breakdown: DamageCalculationBreakdown, 
    context: DamageCalculationContext,
    damageType: DamageType
  ): void {
    let totalResistance = 0;
    let totalVulnerability = 0;

    for (const target of context.targets) {
      // 基础抗性（基于生肖特性）
      const zodiacTrait = ZODIAC_SKILL_TRAITS[target.zodiac];
      const baseResistance = zodiacTrait?.resistances?.[damageType] || 0;
      
      // 状态效果抗性
      const resistanceBuffs = target.statusEffects
        .filter(se => se.type === 'damage_resistance' && se.description.includes(damageType))
        .reduce((total, se) => total + (se.value || 0), 0);
      
      // 易伤效果
      const vulnerabilityDebuffs = target.statusEffects
        .filter(se => se.type === 'vulnerability' && se.description.includes(damageType))
        .reduce((total, se) => total + Math.abs(se.value || 0), 0);
      
      totalResistance += baseResistance + resistanceBuffs;
      totalVulnerability += vulnerabilityDebuffs;
    }

    // 平均抗性
    const avgResistance = totalResistance / context.targets.length;
    const avgVulnerability = totalVulnerability / context.targets.length;
    
    breakdown.targetResistance = -breakdown.baseValue * avgResistance;
    breakdown.targetVulnerability = breakdown.baseValue * avgVulnerability;
    
    // 护甲减免（只对物理伤害有效）
    if (damageType === DamageType.PHYSICAL) {
      const avgArmor = context.targets.reduce((sum, t) => 
        sum + (t.equipment?.armor || 0), 0) / context.targets.length;
      breakdown.armorReduction = -breakdown.baseValue * (avgArmor * 0.01); // 每点护甲减免1%
    }
  }

  /**
   * 计算暴击
   */
  private calculateCritical(
    breakdown: DamageCalculationBreakdown, 
    context: DamageCalculationContext
  ): boolean {
    if (context.guaranteedCritical) {
      breakdown.criticalMultiplier = 2.5;
      return true;
    }

    // 基础暴击率
    let criticalChance = context.effect.modifiers?.criticalChance || 0.05;
    
    // 生肖暴击加成
    const zodiacTrait = ZODIAC_SKILL_TRAITS[context.caster.zodiac];
    if (zodiacTrait?.passiveBonus?.criticalChance) {
      criticalChance += zodiacTrait.passiveBonus.criticalChance;
    }
    
    // 连续暴击递减
    const recentCrits = context.consecutiveCrits || 0;
    criticalChance *= Math.pow(0.8, Math.max(0, recentCrits - 1));
    
    // 状态效果影响
    const critBuffs = context.caster.statusEffects
      .filter(se => se.name.includes('暴击'))
      .reduce((total, se) => total + (se.value || 0), 0);
    criticalChance += critBuffs;
    
    const isCritical = Math.random() < criticalChance;
    
    if (isCritical) {
      // 暴击倍率（基础2倍 + 额外加成）
      let critMultiplier = 2.0;
      
      // 生肖暴击伤害加成
      if (zodiacTrait?.passiveBonus?.criticalDamage) {
        critMultiplier += zodiacTrait.passiveBonus.criticalDamage;
      }
      
      breakdown.criticalMultiplier = critMultiplier;
      
      // 缓存连击数
      this.criticalHitCache.set(context.caster.id, (this.criticalHitCache.get(context.caster.id) || 0) + 1);
    }
    
    return isCritical;
  }

  /**
   * 应用随机变化
   */
  private applyRandomVariation(
    breakdown: DamageCalculationBreakdown, 
    context: DamageCalculationContext
  ): void {
    const randomnessFactor = context.effect.modifiers?.randomness || 0.1; // 默认10%随机性
    const randomVariation = (Math.random() - 0.5) * 2 * randomnessFactor; // -10% to +10%
    breakdown.randomVariation = breakdown.baseValue * randomVariation;
  }

  /**
   * 应用环境修正
   */
  private applyEnvironmentalModifiers(
    breakdown: DamageCalculationBreakdown, 
    context: DamageCalculationContext
  ): void {
    // 时间修正
    const timeModifiers = {
      'morning': 1.1,   // 早晨+10%
      'noon': 1.05,     // 正午+5%
      'evening': 0.95,  // 傍晚-5%
      'night': 0.9      // 夜晚-10%
    };
    const timeMultiplier = timeModifiers[context.timeOfDay] || 1.0;
    breakdown.environmentalFactor = breakdown.baseValue * (timeMultiplier - 1);
    
    // 天气效果
    if (context.weatherEffect) {
      const weatherModifiers = {
        'sunny': 1.05,      // 晴天+5%
        'rainy': 0.95,      // 雨天-5%
        'stormy': 1.15,     // 暴风雨+15%
        'snowy': 0.9        // 雪天-10%
      };
      const weatherMultiplier = weatherModifiers[context.weatherEffect as keyof typeof weatherModifiers] || 1.0;
      breakdown.environmentalFactor += breakdown.baseValue * (weatherMultiplier - 1);
    }
  }

  /**
   * 计算最终伤害
   */
  private calculateFinalDamage(breakdown: DamageCalculationBreakdown, damageType: DamageType): number {
    // 加总所有加成
    let totalDamage = breakdown.baseValue +
                     breakdown.primaryAttribute +
                     breakdown.secondaryAttribute +
                     breakdown.skillMastery +
                     breakdown.skillEnhancement +
                     breakdown.comboBonus +
                     breakdown.zodiacSynergy +
                     breakdown.zodiacConflict +
                     breakdown.seasonalBonus +
                     breakdown.equipmentBonus +
                     breakdown.statusEffectBonus +
                     breakdown.temporaryBonus +
                     breakdown.targetResistance +
                     breakdown.targetVulnerability +
                     breakdown.armorReduction +
                     breakdown.randomVariation +
                     breakdown.environmentalFactor;

    // 应用暴击倍率
    totalDamage *= breakdown.criticalMultiplier;

    // 应用最终倍率
    totalDamage *= breakdown.finalMultiplier;

    // 伤害上限检查
    const damageCapLimit = this.damageCapLimits.get(damageType) || Number.MAX_SAFE_INTEGER;
    if (totalDamage > damageCapLimit) {
      breakdown.cappingReduction = totalDamage - damageCapLimit;
      totalDamage = damageCapLimit;
    }

    // 确保非负值
    return Math.max(0, Math.round(totalDamage));
  }

  /**
   * 生成详细伤害结果
   */
  private generateDamageResult(
    breakdown: DamageCalculationBreakdown,
    finalDamage: number,
    damageType: DamageType,
    elementType: ElementType,
    isCritical: boolean,
    context: DamageCalculationContext
  ): DetailedDamageResult {
    // 生成修正器列表
    const modifiers: DamageModifier[] = [];
    if (breakdown.zodiacSynergy > 0) {
      modifiers.push({
        id: 'zodiac_synergy',
        name: '生肖协同',
        type: 'additive',
        value: breakdown.zodiacSynergy,
        source: '生肖特性',
        description: '生肖与技能元素协同',
        priority: 1
      });
    }
    
    if (breakdown.seasonalBonus > 0) {
      modifiers.push({
        id: 'seasonal_bonus',
        name: '季节加成',
        type: 'additive',
        value: breakdown.seasonalBonus,
        source: '季节效应',
        description: '当前季节对生肖的加成',
        priority: 2
      });
    }

    // 生成详细日志
    const detailedLog = this.generateCalculationLog(breakdown, context);

    // 确定是否为治疗
    const isHealing = context.effect.type === SkillEffectType.MONEY_GAIN ||
                     (context.effect.type === SkillEffectType.STATUS_BUFF);

    return {
      baseDamage: breakdown.baseValue,
      finalDamage,
      damageType,
      elementType,
      breakdown,
      isCritical,
      isResisted: breakdown.targetResistance < -10,
      isImmune: finalDamage === 0 && breakdown.baseValue > 0,
      isHealing,
      modifiers,
      penetration: Math.abs(breakdown.targetResistance),
      overhealing: isHealing && finalDamage > 1000 ? finalDamage - 1000 : 0,
      reflectedDamage: 0, // TODO: 实现反射伤害
      animationData: {
        damageType,
        elementType,
        isCritical,
        magnitude: finalDamage > 1000 ? 'large' : finalDamage > 500 ? 'medium' : 'small'
      },
      soundEffects: this.generateSoundEffects(damageType, elementType, isCritical, finalDamage),
      description: `造成 ${finalDamage} 点 ${this.getDamageTypeDescription(damageType)} 伤害`,
      detailedLog
    };
  }

  /**
   * 生成计算日志
   */
  private generateCalculationLog(breakdown: DamageCalculationBreakdown, context: DamageCalculationContext): string[] {
    const log: string[] = [];
    
    log.push(`基础伤害: ${breakdown.baseValue}`);
    
    if (breakdown.primaryAttribute > 0) {
      log.push(`属性加成: +${breakdown.primaryAttribute.toFixed(1)}`);
    }
    
    if (breakdown.zodiacSynergy > 0) {
      log.push(`生肖协同: +${breakdown.zodiacSynergy.toFixed(1)}`);
    }
    
    if (breakdown.seasonalBonus > 0) {
      log.push(`季节加成: +${breakdown.seasonalBonus.toFixed(1)}`);
    }
    
    if (breakdown.criticalMultiplier > 1) {
      log.push(`暴击伤害: ×${breakdown.criticalMultiplier}`);
    }
    
    if (breakdown.targetResistance < 0) {
      log.push(`目标抗性: ${breakdown.targetResistance.toFixed(1)}`);
    }
    
    if (breakdown.cappingReduction > 0) {
      log.push(`伤害上限限制: -${breakdown.cappingReduction.toFixed(1)}`);
    }
    
    return log;
  }

  /**
   * 生成音效列表
   */
  private generateSoundEffects(
    damageType: DamageType, 
    elementType: ElementType, 
    isCritical: boolean, 
    finalDamage: number
  ): string[] {
    const sounds: string[] = [];
    
    // 基础音效
    sounds.push(`damage_${damageType}`);
    
    // 元素音效
    if (elementType !== ElementType.NEUTRAL) {
      sounds.push(`element_${elementType}`);
    }
    
    // 暴击音效
    if (isCritical) {
      sounds.push('critical_hit');
    }
    
    // 伤害大小音效
    if (finalDamage > 2000) {
      sounds.push('massive_damage');
    } else if (finalDamage > 1000) {
      sounds.push('heavy_damage');
    }
    
    return sounds;
  }

  /**
   * 获取伤害类型描述
   */
  private getDamageTypeDescription(damageType: DamageType): string {
    const descriptions = {
      [DamageType.PHYSICAL]: '物理',
      [DamageType.MAGICAL]: '魔法',
      [DamageType.FINANCIAL]: '经济',
      [DamageType.SOCIAL]: '社交',
      [DamageType.TEMPORAL]: '时间',
      [DamageType.ZODIAC]: '生肖'
    };
    
    return descriptions[damageType] || '未知';
  }

  /**
   * 清理缓存数据
   */
  public clearCache(): void {
    this.criticalHitCache.clear();
    console.log('🧹 伤害计算器缓存已清理');
  }
}

export default SkillDamageCalculator;