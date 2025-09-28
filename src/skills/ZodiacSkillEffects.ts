/**
 * 生肖专属技能效果
 * 第二阶段 Day 2: 技能效果实现
 * 
 * 实现十二生肖的专属技能效果和独特机制，包括：
 * - 每个生肖的独特技能效果实现
 * - 生肖间的相互作用和克制关系
 * - 季节性效果增强
 * - 生肖组合技能效果
 * - 传统文化元素的游戏化实现
 */

import type { GameState, Player, ZodiacSign, Season, ActionResult } from '../types/game';
import {
  SkillEffect,
  SkillEffectType,
  SkillTargetType,
  SkillDefinition,
  PlayerSkillInstance
} from './SkillSystemArchitecture';
import { SkillEffectProcessor, EffectContext, EffectProcessResult } from './SkillEffectProcessor';
import { ZODIAC_SKILL_TRAITS } from './SkillDataStructures';

/**
 * 生肖技能效果增强器
 */
export interface ZodiacEffectEnhancer {
  zodiac: ZodiacSign;
  effectType: SkillEffectType;
  enhancer: (baseResult: EffectProcessResult, context: EffectContext) => EffectProcessResult;
}

/**
 * 生肖间相互作用定义
 */
export interface ZodiacInteraction {
  sourceZodiac: ZodiacSign;
  targetZodiac: ZodiacSign;
  interactionType: 'compatible' | 'neutral' | 'conflicting';
  effectModifier: number; // 效果修正值
  description: string;
}

/**
 * 生肖专属技能效果处理器
 */
export class ZodiacSkillEffects extends SkillEffectProcessor {
  private zodiacEnhancers: Map<string, ZodiacEffectEnhancer> = new Map();
  private zodiacInteractions: ZodiacInteraction[] = [];
  private seasonalEffectMultipliers: Map<ZodiacSign, Map<Season, number>> = new Map();

  constructor() {
    super();
    this.initializeZodiacEffects();
    this.initializeZodiacInteractions();
    this.initializeSeasonalEffects();
  }

  // ============================================================================
  // 初始化生肖效果系统
  // ============================================================================

  private initializeZodiacEffects(): void {
    console.log('🐉 初始化生肖专属技能效果...');

    // 注册每个生肖的专属效果增强器
    this.registerZodiacEnhancer('鼠', SkillEffectType.MONEY_STEAL, this.enhanceRatMoneyStealing.bind(this));
    this.registerZodiacEnhancer('鼠', SkillEffectType.SKILL_COPY, this.enhanceRatSkillCopying.bind(this));

    this.registerZodiacEnhancer('牛', SkillEffectType.PROPERTY_PROTECTION, this.enhanceOxPropertyProtection.bind(this));
    this.registerZodiacEnhancer('牛', SkillEffectType.STATUS_IMMUNITY, this.enhanceOxStatusImmunity.bind(this));

    this.registerZodiacEnhancer('虎', SkillEffectType.DICE_CONTROL, this.enhanceTigerDiceControl.bind(this));
    this.registerZodiacEnhancer('虎', SkillEffectType.STATUS_DEBUFF, this.enhanceTigerIntimidation.bind(this));

    this.registerZodiacEnhancer('兔', SkillEffectType.POSITION_TELEPORT, this.enhanceRabbitTeleportation.bind(this));
    this.registerZodiacEnhancer('兔', SkillEffectType.TURN_EXTRA, this.enhanceRabbitExtraTurns.bind(this));

    this.registerZodiacEnhancer('龙', SkillEffectType.RULE_CHANGE, this.enhanceDragonRuleChange.bind(this));
    this.registerZodiacEnhancer('龙', SkillEffectType.SKILL_POWER_BOOST, this.enhanceDragonPowerBoost.bind(this));

    this.registerZodiacEnhancer('蛇', SkillEffectType.MONEY_TRANSFER, this.enhanceSnakeMoneyTransfer.bind(this));
    this.registerZodiacEnhancer('蛇', SkillEffectType.SKILL_DISABLE, this.enhanceSnakeSkillDisable.bind(this));

    this.registerZodiacEnhancer('马', SkillEffectType.POSITION_MOVE, this.enhanceHorseMovement.bind(this));
    this.registerZodiacEnhancer('马', SkillEffectType.DICE_DOUBLE, this.enhanceHorseDiceDouble.bind(this));

    this.registerZodiacEnhancer('羊', SkillEffectType.STATUS_BUFF, this.enhanceGoatStatusBuff.bind(this));
    this.registerZodiacEnhancer('羊', SkillEffectType.PROPERTY_BONUS, this.enhanceGoatPropertyBonus.bind(this));

    this.registerZodiacEnhancer('猴', SkillEffectType.SKILL_COPY, this.enhanceMonkeySkillCopy.bind(this));
    this.registerZodiacEnhancer('猴', SkillEffectType.DICE_REROLL, this.enhanceMonkeyDiceReroll.bind(this));

    this.registerZodiacEnhancer('鸡', SkillEffectType.EVENT_TRIGGER, this.enhanceRoosterEventTrigger.bind(this));
    this.registerZodiacEnhancer('鸡', SkillEffectType.MONEY_GAIN, this.enhanceRoosterMoneyGain.bind(this));

    this.registerZodiacEnhancer('狗', SkillEffectType.PROPERTY_PROTECTION, this.enhanceDogPropertyProtection.bind(this));
    this.registerZodiacEnhancer('狗', SkillEffectType.STATUS_CLEANSE, this.enhanceDogStatusCleanse.bind(this));

    this.registerZodiacEnhancer('猪', SkillEffectType.MONEY_GAIN, this.enhancePigMoneyGain.bind(this));
    this.registerZodiacEnhancer('猪', SkillEffectType.TURN_SKIP, this.enhancePigTurnSkip.bind(this));

    console.log('✅ 生肖专属技能效果初始化完成');
  }

  private initializeZodiacInteractions(): void {
    console.log('🔄 初始化生肖相互作用...');

    // 定义生肖间的传统相互关系
    const interactions: ZodiacInteraction[] = [
      // 相生关系 (兼容)
      { sourceZodiac: '鼠', targetZodiac: '龙', interactionType: 'compatible', effectModifier: 1.2, description: '鼠龙相助' },
      { sourceZodiac: '鼠', targetZodiac: '猴', interactionType: 'compatible', effectModifier: 1.15, description: '鼠猴机智' },
      { sourceZodiac: '牛', targetZodiac: '蛇', interactionType: 'compatible', effectModifier: 1.2, description: '牛蛇稳重' },
      { sourceZodiac: '牛', targetZodiac: '鸡', interactionType: 'compatible', effectModifier: 1.15, description: '牛鸡勤劳' },
      { sourceZodiac: '虎', targetZodiac: '马', interactionType: 'compatible', effectModifier: 1.2, description: '虎马威猛' },
      { sourceZodiac: '虎', targetZodiac: '狗', interactionType: 'compatible', effectModifier: 1.15, description: '虎狗忠勇' },
      { sourceZodiac: '兔', targetZodiac: '羊', interactionType: 'compatible', effectModifier: 1.2, description: '兔羊温和' },
      { sourceZodiac: '兔', targetZodiac: '猪', interactionType: 'compatible', effectModifier: 1.15, description: '兔猪安逸' },

      // 相克关系 (冲突)
      { sourceZodiac: '鼠', targetZodiac: '马', interactionType: 'conflicting', effectModifier: 0.8, description: '鼠马相冲' },
      { sourceZodiac: '鼠', targetZodiac: '羊', interactionType: 'conflicting', effectModifier: 0.85, description: '鼠羊相害' },
      { sourceZodiac: '牛', targetZodiac: '羊', interactionType: 'conflicting', effectModifier: 0.8, description: '牛羊相冲' },
      { sourceZodiac: '牛', targetZodiac: '马', interactionType: 'conflicting', effectModifier: 0.85, description: '牛马相害' },
      { sourceZodiac: '虎', targetZodiac: '猴', interactionType: 'conflicting', effectModifier: 0.8, description: '虎猴相冲' },
      { sourceZodiac: '虎', targetZodiac: '蛇', interactionType: 'conflicting', effectModifier: 0.85, description: '虎蛇相害' },
      { sourceZodiac: '兔', targetZodiac: '鸡', interactionType: 'conflicting', effectModifier: 0.8, description: '兔鸡相冲' },
      { sourceZodiac: '兔', targetZodiac: '龙', interactionType: 'conflicting', effectModifier: 0.85, description: '兔龙相害' },
      { sourceZodiac: '龙', targetZodiac: '狗', interactionType: 'conflicting', effectModifier: 0.8, description: '龙狗相冲' },
      { sourceZodiac: '蛇', targetZodiac: '猪', interactionType: 'conflicting', effectModifier: 0.8, description: '蛇猪相冲' },
      { sourceZodiac: '猴', targetZodiac: '猪', interactionType: 'conflicting', effectModifier: 0.85, description: '猴猪相害' },
      { sourceZodiac: '鸡', targetZodiac: '狗', interactionType: 'conflicting', effectModifier: 0.85, description: '鸡狗相害' }
    ];

    this.zodiacInteractions = interactions;
    console.log('✅ 生肖相互作用初始化完成');
  }

  private initializeSeasonalEffects(): void {
    console.log('🌸 初始化季节效果...');

    // 为每个生肖设置季节效果倍数
    const seasonalMultipliers: Array<[ZodiacSign, Map<Season, number>]> = [
      ['鼠', new Map([['春', 1.0], ['夏', 1.0], ['秋', 1.1], ['冬', 1.3]])],
      ['牛', new Map([['春', 1.1], ['夏', 1.0], ['秋', 1.0], ['冬', 1.2]])],
      ['虎', new Map([['春', 1.3], ['夏', 1.1], ['秋', 1.0], ['冬', 1.0]])],
      ['兔', new Map([['春', 1.2], ['夏', 1.0], ['秋', 1.0], ['冬', 1.1]])],
      ['龙', new Map([['春', 1.2], ['夏', 1.1], ['秋', 1.0], ['冬', 1.0]])],
      ['蛇', new Map([['春', 1.0], ['夏', 1.3], ['秋', 1.1], ['冬', 1.0]])],
      ['马', new Map([['春', 1.1], ['夏', 1.2], ['秋', 1.0], ['冬', 1.0]])],
      ['羊', new Map([['春', 1.0], ['夏', 1.2], ['秋', 1.1], ['冬', 1.0]])],
      ['猴', new Map([['春', 1.0], ['夏', 1.1], ['秋', 1.3], ['冬', 1.0]])],
      ['鸡', new Map([['春', 1.0], ['夏', 1.0], ['秋', 1.2], ['冬', 1.1]])],
      ['狗', new Map([['春', 1.1], ['夏', 1.0], ['秋', 1.2], ['冬', 1.0]])],
      ['猪', new Map([['春', 1.0], ['夏', 1.0], ['秋', 1.0], ['冬', 1.3]])]
    ];

    seasonalMultipliers.forEach(([zodiac, multipliers]) => {
      this.seasonalEffectMultipliers.set(zodiac, multipliers);
    });

    console.log('✅ 季节效果初始化完成');
  }

  // ============================================================================
  // 注册和增强方法
  // ============================================================================

  private registerZodiacEnhancer(
    zodiac: ZodiacSign,
    effectType: SkillEffectType,
    enhancer: (baseResult: EffectProcessResult, context: EffectContext) => EffectProcessResult
  ): void {
    const key = `${zodiac}_${effectType}`;
    this.zodiacEnhancers.set(key, {
      zodiac,
      effectType,
      enhancer
    });
  }

  /**
   * 处理生肖增强的技能效果
   */
  public async processZodiacEnhancedEffect(
    effect: SkillEffect,
    context: EffectContext
  ): Promise<EffectProcessResult> {
    // 首先执行基础效果处理
    let result = await this.processEffect(effect, context);

    // 获取施法者的生肖
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (!caster) return result;

    // 检查是否有对应的生肖增强器
    const enhancerKey = `${caster.zodiac}_${effect.type}`;
    const enhancer = this.zodiacEnhancers.get(enhancerKey);

    if (enhancer) {
      result = enhancer.enhancer(result, context);
    }

    // 应用季节效果
    result = this.applySeasonalEffects(result, caster.zodiac, context);

    // 应用生肖相互作用
    result = this.applyZodiacInteractions(result, context);

    return result;
  }

  // ============================================================================
  // 鼠年技能增强器
  // ============================================================================

  private enhanceRatMoneyStealing(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 鼠的偷取技能有概率触发连锁偷取
    if (result.success && Math.random() < 0.3) { // 30%概率
      const bonusSteal = Math.floor(result.actualValue * 0.5);
      result.actualValue += bonusSteal;
      result.description += ` (机灵连锁偷取 +${bonusSteal})`;
      result.secondaryEffects.push({
        id: 'rat_chain_steal',
        type: SkillEffectType.STATUS_BUFF,
        target: SkillTargetType.SELF,
        value: 0.1,
        duration: 1,
        description: '偷取成功的兴奋感'
      });
      result.soundEffects = [...(result.soundEffects || []), 'rat_chain_steal'];
    }
    return result;
  }

  private enhanceRatSkillCopying(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 鼠的技能复制有概率复制到更强的效果
    if (result.success && Math.random() < 0.25) { // 25%概率
      result.description += ' (精准模仿 - 效果增强)';
      result.secondaryEffects.push({
        id: 'rat_enhanced_copy',
        type: SkillEffectType.SKILL_POWER_BOOST,
        target: SkillTargetType.SELF,
        value: 0.15,
        duration: 2,
        description: '学习能力提升'
      });
    }
    return result;
  }

  // ============================================================================
  // 牛年技能增强器
  // ============================================================================

  private enhanceOxPropertyProtection(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 牛的房产保护更加持久和全面
    if (result.success) {
      result.actualValue *= 1.5; // 延长持续时间
      result.description += ' (坚韧守护 - 持续时间延长)';
      
      // 额外提供抗性
      result.secondaryEffects.push({
        id: 'ox_steadfast_resistance',
        type: SkillEffectType.STATUS_IMMUNITY,
        target: SkillTargetType.SELF,
        value: 1,
        duration: 1,
        description: '坚韧抗性'
      });
    }
    return result;
  }

  private enhanceOxStatusImmunity(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 牛的状态免疫能影响周围盟友
    if (result.success && result.targetIds.includes(context.casterId)) {
      const allies = this.findNearbyAllies(context);
      if (allies.length > 0) {
        result.targetIds.push(...allies);
        result.description += ` (守护光环 - 影响${allies.length}个盟友)`;
        result.secondaryEffects.push({
          id: 'ox_protective_aura',
          type: SkillEffectType.PROPERTY_PROTECTION,
          target: SkillTargetType.ALL_OTHERS,
          value: 0.5,
          duration: 1,
          description: '守护光环'
        });
      }
    }
    return result;
  }

  // ============================================================================
  // 虎年技能增强器
  // ============================================================================

  private enhanceTigerDiceControl(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 虎的骰子控制可以影响连续多次投掷
    if (result.success) {
      result.secondaryEffects.push({
        id: 'tiger_dice_mastery',
        type: SkillEffectType.DICE_MODIFIER,
        target: SkillTargetType.SELF,
        value: 1,
        duration: 2,
        description: '骰子掌控力'
      });
      result.description += ' (虎威震慑 - 获得骰子掌控力)';
    }
    return result;
  }

  private enhanceTigerIntimidation(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 虎的威慑效果可能引起恐慌，影响更多目标
    if (result.success && Math.random() < 0.4) { // 40%概率
      const additionalTargets = this.findNearbyEnemies(context, result.targetIds);
      if (additionalTargets.length > 0) {
        result.targetIds.push(...additionalTargets);
        result.description += ` (威震八方 - 恐慌蔓延影响${additionalTargets.length}个额外目标)`;
        result.soundEffects = [...(result.soundEffects || []), 'tiger_roar'];
      }
    }
    return result;
  }

  // ============================================================================
  // 兔年技能增强器
  // ============================================================================

  private enhanceRabbitTeleportation(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 兔的传送技能可以选择最优位置
    if (result.success) {
      const optimalPositions = this.findOptimalPositions(context);
      if (optimalPositions.length > 0) {
        result.actualValue = optimalPositions[0]; // 选择最优位置
        result.description += ' (灵巧跳跃 - 传送到最优位置)';
        
        // 传送后获得短暂的敏捷加成
        result.secondaryEffects.push({
          id: 'rabbit_agility_boost',
          type: SkillEffectType.DICE_MODIFIER,
          target: SkillTargetType.SELF,
          value: 2,
          duration: 1,
          description: '灵巧敏捷'
        });
      }
    }
    return result;
  }

  private enhanceRabbitExtraTurns(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 兔的额外回合有概率触发更多回合
    if (result.success && Math.random() < 0.2) { // 20%概率
      result.actualValue += 1;
      result.description += ' (三窟狡兔 - 获得额外回合)';
      result.secondaryEffects.push({
        id: 'rabbit_endless_energy',
        type: SkillEffectType.SKILL_COOLDOWN_REDUCE,
        target: SkillTargetType.SELF,
        value: 1,
        description: '无尽活力'
      });
    }
    return result;
  }

  // ============================================================================
  // 龙年技能增强器
  // ============================================================================

  private enhanceDragonRuleChange(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 龙的规则改变效果更强大且持续更久
    if (result.success) {
      result.actualValue *= 2; // 效果翻倍
      result.description += ' (龙威天变 - 规则改变效果翻倍)';
      
      // 龙的规则改变可能触发天象变化
      if (Math.random() < 0.3) { // 30%概率
        result.secondaryEffects.push({
          id: 'dragon_celestial_change',
          type: SkillEffectType.EVENT_TRIGGER,
          target: SkillTargetType.GLOBAL,
          value: 'weather_change',
          description: '天象变化'
        });
        result.description += ' (引发天象变化)';
      }
    }
    return result;
  }

  private enhanceDragonPowerBoost(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 龙的威力提升影响所有友好单位
    if (result.success) {
      const allies = this.findAllAllies(context);
      if (allies.length > 0) {
        result.targetIds.push(...allies);
        result.description += ` (龙气加持 - 影响${allies.length}个盟友)`;
        result.actualValue *= 1.3; // 龙的加持更强
      }
    }
    return result;
  }

  // ============================================================================
  // 蛇年技能增强器
  // ============================================================================

  private enhanceSnakeMoneyTransfer(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 蛇的金钱转移可以从多个目标抽取
    if (result.success) {
      const allPlayers = context.gameState.players.filter(p => p.id !== context.casterId);
      if (allPlayers.length > 1) {
        // 从所有其他玩家那里各抽取少量金钱
        const extractPerPlayer = Math.floor(result.actualValue * 0.1);
        let totalExtracted = 0;
        
        allPlayers.forEach(player => {
          const extracted = Math.min(extractPerPlayer, player.money);
          player.money -= extracted;
          totalExtracted += extracted;
        });
        
        if (totalExtracted > 0) {
          result.actualValue += totalExtracted;
          result.description += ` (蛇行吸金 - 额外吸取${totalExtracted})`;
        }
      }
    }
    return result;
  }

  private enhanceSnakeSkillDisable(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 蛇的技能禁用可能传播给相邻玩家
    if (result.success && Math.random() < 0.35) { // 35%概率
      const nearbyPlayers = this.findNearbyPlayers(context);
      if (nearbyPlayers.length > 0) {
        result.targetIds.push(...nearbyPlayers);
        result.description += ` (毒素蔓延 - 禁用传播给${nearbyPlayers.length}个相邻玩家)`;
        result.soundEffects = [...(result.soundEffects || []), 'snake_poison_spread'];
      }
    }
    return result;
  }

  // ============================================================================
  // 马年技能增强器
  // ============================================================================

  private enhanceHorseMovement(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 马的移动距离随机增加
    if (result.success) {
      const bonusMovement = Math.floor(Math.random() * 3) + 1; // 1-3额外移动
      result.actualValue += bonusMovement;
      result.description += ` (奔腾如风 - 额外移动${bonusMovement}步)`;
      
      // 移动后获得动量效果
      result.secondaryEffects.push({
        id: 'horse_momentum',
        type: SkillEffectType.DICE_DOUBLE,
        target: SkillTargetType.SELF,
        value: 1,
        duration: 1,
        description: '移动动量'
      });
    }
    return result;
  }

  private enhanceHorseDiceDouble(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 马的双重骰子可能触发三重骰子
    if (result.success && Math.random() < 0.25) { // 25%概率
      result.description += ' (万马奔腾 - 升级为三重骰子)';
      result.secondaryEffects.push({
        id: 'horse_triple_dice',
        type: SkillEffectType.DICE_REROLL,
        target: SkillTargetType.SELF,
        value: 1,
        duration: 1,
        description: '三重骰子'
      });
    }
    return result;
  }

  // ============================================================================
  // 羊年技能增强器
  // ============================================================================

  private enhanceGoatStatusBuff(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 羊的增益效果可以分享给其他玩家
    if (result.success) {
      const shareTargets = this.findSharingTargets(context, 2); // 最多分享给2个玩家
      if (shareTargets.length > 0) {
        result.targetIds.push(...shareTargets);
        result.description += ` (温和分享 - 分享给${shareTargets.length}个玩家)`;
        
        // 分享增益会获得额外回报
        result.secondaryEffects.push({
          id: 'goat_sharing_bonus',
          type: SkillEffectType.MONEY_GAIN,
          target: SkillTargetType.SELF,
          value: shareTargets.length * 200,
          description: '分享回报'
        });
      }
    }
    return result;
  }

  private enhanceGoatPropertyBonus(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 羊的房产奖励基于拥有的房产数量递增
    if (result.success) {
      const caster = context.gameState.players.find(p => p.id === context.casterId);
      if (caster) {
        const propertyCount = caster.properties.length;
        const bonusMultiplier = 1 + (propertyCount * 0.1); // 每个房产+10%
        result.actualValue *= bonusMultiplier;
        result.description += ` (聚宝成群 - 房产数量加成×${bonusMultiplier.toFixed(1)})`;
      }
    }
    return result;
  }

  // ============================================================================
  // 猴年技能增强器
  // ============================================================================

  private enhanceMonkeySkillCopy(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 猴的技能复制可以同时复制多个最近使用的技能
    if (result.success && Math.random() < 0.3) { // 30%概率
      result.description += ' (七十二变 - 复制多个技能效果)';
      result.secondaryEffects.push(
        {
          id: 'monkey_multi_copy_1',
          type: SkillEffectType.SKILL_POWER_BOOST,
          target: SkillTargetType.SELF,
          value: 0.1,
          duration: 2,
          description: '多重模仿技巧'
        },
        {
          id: 'monkey_multi_copy_2',
          type: SkillEffectType.SKILL_COOLDOWN_REDUCE,
          target: SkillTargetType.SELF,
          value: 1,
          description: '技能掌握'
        }
      );
    }
    return result;
  }

  private enhanceMonkeyDiceReroll(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 猴的骰子重投可以选择最优结果
    if (result.success) {
      result.description += ' (机智选择 - 必定选择最优结果)';
      result.secondaryEffects.push({
        id: 'monkey_clever_choice',
        type: SkillEffectType.DICE_CONTROL,
        target: SkillTargetType.SELF,
        value: 6, // 直接设为最大值
        duration: 1,
        description: '机智选择'
      });
    }
    return result;
  }

  // ============================================================================
  // 鸡年技能增强器
  // ============================================================================

  private enhanceRoosterEventTrigger(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 鸡的事件触发可能引发连锁事件
    if (result.success && Math.random() < 0.4) { // 40%概率
      result.description += ' (一鸣惊人 - 触发连锁事件)';
      result.secondaryEffects.push(
        {
          id: 'rooster_chain_event_1',
          type: SkillEffectType.MONEY_GAIN,
          target: SkillTargetType.ALL_PLAYERS,
          value: 300,
          description: '连锁财运事件'
        },
        {
          id: 'rooster_chain_event_2',
          type: SkillEffectType.EVENT_TRIGGER,
          target: SkillTargetType.GLOBAL,
          value: 'market_fluctuation',
          description: '市场波动事件'
        }
      );
    }
    return result;
  }

  private enhanceRoosterMoneyGain(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 鸡的金钱获得在早晨时间有额外加成
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour <= 9) { // 早晨5-9点
      result.actualValue *= 1.5;
      result.description += ' (金鸡报晓 - 晨间财运加成)';
      result.soundEffects = [...(result.soundEffects || []), 'rooster_crow'];
    }
    return result;
  }

  // ============================================================================
  // 狗年技能增强器
  // ============================================================================

  private enhanceDogPropertyProtection(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 狗的房产保护可以保护盟友的房产
    if (result.success) {
      const allies = this.findNearbyAllies(context);
      if (allies.length > 0) {
        result.targetIds.push(...allies);
        result.description += ` (忠诚守护 - 同时保护${allies.length}个盟友的房产)`;
        
        // 守护他人会获得忠诚奖励
        result.secondaryEffects.push({
          id: 'dog_loyalty_reward',
          type: SkillEffectType.STATUS_BUFF,
          target: SkillTargetType.SELF,
          value: 0.15,
          duration: 3,
          description: '忠诚奖励'
        });
      }
    }
    return result;
  }

  private enhanceDogStatusCleanse(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 狗的状态清除可以预防未来的负面效果
    if (result.success) {
      result.secondaryEffects.push({
        id: 'dog_prevention_aura',
        type: SkillEffectType.STATUS_IMMUNITY,
        target: SkillTargetType.SELF,
        value: 1,
        duration: 2,
        description: '预防光环'
      });
      result.description += ' (未雨绸缪 - 获得预防效果)';
    }
    return result;
  }

  // ============================================================================
  // 猪年技能增强器
  // ============================================================================

  private enhancePigMoneyGain(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 猪的金钱获得基于当前金钱数量有额外奖励
    if (result.success) {
      const caster = context.gameState.players.find(p => p.id === context.casterId);
      if (caster) {
        const wealthBonus = Math.floor(caster.money * 0.05); // 当前金钱的5%
        result.actualValue += wealthBonus;
        result.description += ` (聚宝盆效应 - 财富加成+${wealthBonus})`;
        
        // 金钱越多，获得的满足感越强
        if (caster.money > 10000) {
          result.secondaryEffects.push({
            id: 'pig_wealth_satisfaction',
            type: SkillEffectType.STATUS_BUFF,
            target: SkillTargetType.SELF,
            value: 0.2,
            duration: 2,
            description: '财富满足感'
          });
        }
      }
    }
    return result;
  }

  private enhancePigTurnSkip(result: EffectProcessResult, context: EffectContext): EffectProcessResult {
    // 猪的回合跳过可以让目标玩家休息并恢复
    if (result.success) {
      result.description += ' (安逸休息 - 跳过回合但获得恢复)';
      result.secondaryEffects.push({
        id: 'pig_restful_skip',
        type: SkillEffectType.SKILL_COOLDOWN_REDUCE,
        target: SkillTargetType.SINGLE_PLAYER, // 对被跳过回合的玩家
        value: 2,
        description: '休息恢复'
      });
    }
    return result;
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private applySeasonalEffects(
    result: EffectProcessResult,
    zodiac: ZodiacSign,
    context: EffectContext
  ): EffectProcessResult {
    const seasonMultipliers = this.seasonalEffectMultipliers.get(zodiac);
    if (seasonMultipliers) {
      const currentSeason = context.gameState.season;
      const multiplier = seasonMultipliers.get(currentSeason) || 1.0;
      
      if (multiplier !== 1.0) {
        result.actualValue = Math.round(result.actualValue * multiplier);
        result.description += ` (${currentSeason}季加成×${multiplier})`;
      }
    }
    return result;
  }

  private applyZodiacInteractions(
    result: EffectProcessResult,
    context: EffectContext
  ): EffectProcessResult {
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (!caster) return result;

    // 检查技能目标中是否有相互作用的生肖
    result.targetIds.forEach(targetId => {
      const target = context.gameState.players.find(p => p.id === targetId);
      if (target && target.id !== context.casterId) {
        const interaction = this.zodiacInteractions.find(zi => 
          zi.sourceZodiac === caster.zodiac && zi.targetZodiac === target.zodiac
        );
        
        if (interaction) {
          const originalValue = result.actualValue;
          result.actualValue = Math.round(result.actualValue * interaction.effectModifier);
          result.description += ` (${interaction.description}×${interaction.effectModifier})`;
          
          // 如果是有利相互作用，可能触发额外效果
          if (interaction.interactionType === 'compatible' && Math.random() < 0.2) {
            result.secondaryEffects.push({
              id: 'zodiac_harmony_bonus',
              type: SkillEffectType.STATUS_BUFF,
              target: SkillTargetType.SELF,
              value: 0.1,
              duration: 1,
              description: '生肖和谐加成'
            });
          }
        }
      }
    });

    return result;
  }

  private findNearbyAllies(context: EffectContext): string[] {
    // 简化实现：寻找距离较近且不冲突的生肖玩家
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (!caster) return [];

    return context.gameState.players
      .filter(p => p.id !== context.casterId)
      .filter(p => {
        const interaction = this.zodiacInteractions.find(zi => 
          zi.sourceZodiac === caster.zodiac && zi.targetZodiac === p.zodiac
        );
        return !interaction || interaction.interactionType === 'compatible';
      })
      .map(p => p.id)
      .slice(0, 2); // 最多2个盟友
  }

  private findNearbyEnemies(context: EffectContext, excludeIds: string[]): string[] {
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (!caster) return [];

    return context.gameState.players
      .filter(p => p.id !== context.casterId && !excludeIds.includes(p.id))
      .filter(p => {
        const interaction = this.zodiacInteractions.find(zi => 
          zi.sourceZodiac === caster.zodiac && zi.targetZodiac === p.zodiac
        );
        return interaction && interaction.interactionType === 'conflicting';
      })
      .map(p => p.id)
      .slice(0, 1); // 最多1个额外敌人
  }

  private findOptimalPositions(context: EffectContext): number[] {
    const positions: number[] = [];
    
    // 寻找有价值的未拥有房产位置
    for (let i = 0; i < context.gameState.board.length; i++) {
      const cell = context.gameState.board[i];
      if (cell.type === 'property') {
        const isOwned = context.gameState.players.some(p => p.properties.includes(cell.id || i.toString()));
        if (!isOwned) {
          positions.push(i);
        }
      }
    }

    return positions.slice(0, 3); // 返回前3个最优位置
  }

  private findAllAllies(context: EffectContext): string[] {
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (!caster) return [];

    return context.gameState.players
      .filter(p => p.id !== context.casterId)
      .filter(p => {
        const interaction = this.zodiacInteractions.find(zi => 
          zi.sourceZodiac === caster.zodiac && zi.targetZodiac === p.zodiac
        );
        return !interaction || interaction.interactionType !== 'conflicting';
      })
      .map(p => p.id);
  }

  private findNearbyPlayers(context: EffectContext): string[] {
    // 简化实现：返回位置相近的玩家
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (!caster) return [];

    return context.gameState.players
      .filter(p => p.id !== context.casterId)
      .filter(p => Math.abs(p.position - caster.position) <= 3)
      .map(p => p.id)
      .slice(0, 2);
  }

  private findSharingTargets(context: EffectContext, maxTargets: number): string[] {
    // 寻找金钱较少的玩家进行分享
    return context.gameState.players
      .filter(p => p.id !== context.casterId)
      .sort((a, b) => a.money - b.money)
      .slice(0, maxTargets)
      .map(p => p.id);
  }
}

export default ZodiacSkillEffects;