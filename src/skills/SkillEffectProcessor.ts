/**
 * 技能效果处理器
 * 第二阶段 Day 2: 技能效果实现
 * 
 * 实现所有技能的具体效果和逻辑，包括：
 * - 完整的技能效果处理系统
 * - 复杂的效果计算和应用
 * - 效果组合和链式反应
 * - 生肖专属效果增强
 * - 动态效果调整和平衡
 */

import type { GameState, Player, ActionResult, ZodiacSign } from '../types/game';
import {
  SkillEffect,
  SkillEffectType,
  SkillTargetType,
  SkillEnhancement,
  PlayerSkillInstance,
  SkillDefinition
} from './SkillSystemArchitecture';
import { ZODIAC_SKILL_TRAITS } from './SkillDataStructures';
import SkillDamageCalculator, { 
  DamageCalculationContext,
  DetailedDamageResult,
  DamageType,
  ElementType
} from './SkillDamageCalculation';

/**
 * 效果处理结果接口
 */
export interface EffectProcessResult {
  success: boolean;
  actualValue: number;
  targetIds: string[];
  description: string;
  criticalHit: boolean;
  resistanceApplied: boolean;
  secondaryEffects: SkillEffect[];
  animationData?: any;
  soundEffects?: string[];
}

/**
 * 效果上下文接口
 */
export interface EffectContext {
  casterId: string;
  skillLevel: number;
  skillDefinition: SkillDefinition;
  gameState: GameState;
  previousGameState?: GameState;
  chainMultiplier?: number;
  comboBonus?: number;
  seasonalBonus?: number;
  zodiacBonus?: number;
}

/**
 * 伤害/治疗计算结果
 */
export interface DamageCalculationResult {
  baseDamage: number;
  finalDamage: number;
  isCritical: boolean;
  resistanceReduction: number;
  bonusMultiplier: number;
  breakdown: DamageBreakdown;
}

/**
 * 伤害计算细节
 */
export interface DamageBreakdown {
  baseValue: number;
  levelScaling: number;
  skillEnhancements: number;
  zodiacBonus: number;
  seasonalBonus: number;
  criticalMultiplier: number;
  resistance: number;
  randomVariation: number;
}

/**
 * 技能效果组合接口
 */
export interface EffectCombo {
  id: string;
  name: string;
  description: string;
  triggerEffects: SkillEffectType[];  // 触发组合的效果类型
  comboEffects: SkillEffect[];        // 组合触发的额外效果
  cooldown: number;                   // 组合冷却时间
  zodiacRestrictions?: ZodiacSign[];  // 生肖限制
  probability: number;                // 触发概率
}

/**
 * 链式反应接口
 */
export interface ChainReaction {
  id: string;
  name: string;
  description: string;
  triggerCondition: (result: EffectProcessResult, context: EffectContext) => boolean;
  chainEffect: SkillEffect;
  maxChainLength: number;
  chainDamageMultiplier: number;
  zodiacEnhancement?: (zodiac: ZodiacSign) => number;
}

/**
 * 技能效果处理器核心实现
 */
export class SkillEffectProcessor {
  private effectRegistry: Map<SkillEffectType, (effect: SkillEffect, context: EffectContext) => Promise<EffectProcessResult>> = new Map();
  private criticalHitCache: Map<string, number> = new Map();
  private resistanceCache: Map<string, Map<SkillEffectType, number>> = new Map();
  private damageCalculator: SkillDamageCalculator;

  constructor() {
    this.damageCalculator = new SkillDamageCalculator();
    this.initializeEffectHandlers();
    this.initializeComboAndChainSystems();
  }

  // ============================================================================
  // 初始化和注册
  // ============================================================================

  private initializeEffectHandlers(): void {
    console.log('⚡ 初始化技能效果处理器...');

    // 注册所有效果类型的处理器
    this.registerEffectHandler(SkillEffectType.MONEY_GAIN, this.handleMoneyGain.bind(this));
    this.registerEffectHandler(SkillEffectType.MONEY_LOSS, this.handleMoneyLoss.bind(this));
    this.registerEffectHandler(SkillEffectType.MONEY_STEAL, this.handleMoneySteal.bind(this));
    this.registerEffectHandler(SkillEffectType.MONEY_TRANSFER, this.handleMoneyTransfer.bind(this));

    this.registerEffectHandler(SkillEffectType.POSITION_MOVE, this.handlePositionMove.bind(this));
    this.registerEffectHandler(SkillEffectType.POSITION_TELEPORT, this.handlePositionTeleport.bind(this));
    this.registerEffectHandler(SkillEffectType.POSITION_SWAP, this.handlePositionSwap.bind(this));
    this.registerEffectHandler(SkillEffectType.POSITION_LOCK, this.handlePositionLock.bind(this));

    this.registerEffectHandler(SkillEffectType.PROPERTY_DISCOUNT, this.handlePropertyDiscount.bind(this));
    this.registerEffectHandler(SkillEffectType.PROPERTY_BONUS, this.handlePropertyBonus.bind(this));
    this.registerEffectHandler(SkillEffectType.PROPERTY_PROTECTION, this.handlePropertyProtection.bind(this));
    this.registerEffectHandler(SkillEffectType.PROPERTY_CONFISCATE, this.handlePropertyConfiscate.bind(this));

    this.registerEffectHandler(SkillEffectType.DICE_REROLL, this.handleDiceReroll.bind(this));
    this.registerEffectHandler(SkillEffectType.DICE_MODIFIER, this.handleDiceModifier.bind(this));
    this.registerEffectHandler(SkillEffectType.DICE_CONTROL, this.handleDiceControl.bind(this));
    this.registerEffectHandler(SkillEffectType.DICE_DOUBLE, this.handleDiceDouble.bind(this));

    this.registerEffectHandler(SkillEffectType.STATUS_BUFF, this.handleStatusBuff.bind(this));
    this.registerEffectHandler(SkillEffectType.STATUS_DEBUFF, this.handleStatusDebuff.bind(this));
    this.registerEffectHandler(SkillEffectType.STATUS_IMMUNITY, this.handleStatusImmunity.bind(this));
    this.registerEffectHandler(SkillEffectType.STATUS_CLEANSE, this.handleStatusCleanse.bind(this));

    this.registerEffectHandler(SkillEffectType.SKILL_COOLDOWN_REDUCE, this.handleSkillCooldownReduce.bind(this));
    this.registerEffectHandler(SkillEffectType.SKILL_POWER_BOOST, this.handleSkillPowerBoost.bind(this));
    this.registerEffectHandler(SkillEffectType.SKILL_DISABLE, this.handleSkillDisable.bind(this));
    this.registerEffectHandler(SkillEffectType.SKILL_COPY, this.handleSkillCopy.bind(this));

    this.registerEffectHandler(SkillEffectType.TURN_EXTRA, this.handleTurnExtra.bind(this));
    this.registerEffectHandler(SkillEffectType.TURN_SKIP, this.handleTurnSkip.bind(this));
    this.registerEffectHandler(SkillEffectType.EVENT_TRIGGER, this.handleEventTrigger.bind(this));
    this.registerEffectHandler(SkillEffectType.RULE_CHANGE, this.handleRuleChange.bind(this));

    console.log('✅ 技能效果处理器初始化完成');
  }

  /**
   * 注册效果处理器
   */
  public registerEffectHandler(
    effectType: SkillEffectType,
    handler: (effect: SkillEffect, context: EffectContext) => Promise<EffectProcessResult>
  ): void {
    this.effectRegistry.set(effectType, handler);
  }

  // ============================================================================
  // 主要处理接口
  // ============================================================================

  /**
   * 处理技能效果
   */
  public async processEffect(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const handler = this.effectRegistry.get(effect.type);
    
    if (!handler) {
      console.warn(`未找到效果类型 ${effect.type} 的处理器`);
      return {
        success: false,
        actualValue: 0,
        targetIds: [],
        description: `未实现的效果类型: ${effect.type}`,
        criticalHit: false,
        resistanceApplied: false,
        secondaryEffects: []
      };
    }

    try {
      // 应用生肖和季节加成
      const enhancedContext = this.enhanceContextWithBonuses(context);
      
      // 处理效果
      const result = await handler(effect, enhancedContext);
      
      // 应用后处理增强
      return this.applyPostProcessingEnhancements(result, effect, enhancedContext);
      
    } catch (error) {
      console.error(`处理效果 ${effect.type} 时发生错误:`, error);
      return {
        success: false,
        actualValue: 0,
        targetIds: [],
        description: `效果处理失败: ${error}`,
        criticalHit: false,
        resistanceApplied: false,
        secondaryEffects: []
      };
    }
  }

  /**
   * 批量处理多个效果
   */
  public async processMultipleEffects(
    effects: SkillEffect[],
    context: EffectContext
  ): Promise<EffectProcessResult[]> {
    const results: EffectProcessResult[] = [];
    
    for (const effect of effects) {
      const result = await this.processEffect(effect, context);
      results.push(result);
      
      // 如果有连锁效果，添加到处理队列
      if (result.secondaryEffects.length > 0) {
        for (const secondaryEffect of result.secondaryEffects) {
          const secondaryResult = await this.processEffect(secondaryEffect, context);
          results.push(secondaryResult);
        }
      }
    }
    
    return results;
  }

  // ============================================================================
  // 资源效果处理器
  // ============================================================================

  private async handleMoneyGain(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const calculation = this.calculateDamageOrHealing(effect, context);
    const targets = this.resolveTargets(effect.target, context);
    const gainAmount = Math.abs(calculation.finalDamage);

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        player.money += gainAmount;
        
        // 应用生肖金钱加成
        const zodiacTrait = ZODIAC_SKILL_TRAITS[player.zodiac];
        if (zodiacTrait?.passiveBonus?.moneyMultiplier) {
          const bonus = gainAmount * (zodiacTrait.passiveBonus.moneyMultiplier - 1);
          player.money += Math.floor(bonus);
        }
      }
    });

    return {
      success: true,
      actualValue: gainAmount,
      targetIds: targets,
      description: `获得 ${gainAmount} 金钱`,
      criticalHit: calculation.isCritical,
      resistanceApplied: false,
      secondaryEffects: this.generateSecondaryEffects('money_gain', calculation, context),
      animationData: {
        type: 'money_gain',
        amount: gainAmount,
        critical: calculation.isCritical
      },
      soundEffects: ['coin_gain', calculation.isCritical ? 'critical_hit' : undefined].filter(Boolean)
    };
  }

  private async handleMoneyLoss(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const calculation = this.calculateDamageOrHealing(effect, context);
    const targets = this.resolveTargets(effect.target, context);
    const lossAmount = Math.abs(calculation.finalDamage);

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const actualLoss = Math.min(lossAmount, player.money);
        player.money -= actualLoss;
      }
    });

    return {
      success: true,
      actualValue: lossAmount,
      targetIds: targets,
      description: `失去 ${lossAmount} 金钱`,
      criticalHit: calculation.isCritical,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'money_loss',
        amount: lossAmount
      },
      soundEffects: ['money_loss']
    };
  }

  private async handleMoneySteal(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const calculation = this.calculateDamageOrHealing(effect, context);
    const targets = this.resolveTargets(effect.target, context);
    const stealAmount = Math.abs(calculation.finalDamage);
    
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (!caster) {
      return {
        success: false,
        actualValue: 0,
        targetIds: [],
        description: '施法者不存在',
        criticalHit: false,
        resistanceApplied: false,
        secondaryEffects: []
      };
    }

    let totalStolen = 0;
    targets.forEach(targetId => {
      if (targetId === context.casterId) return; // 不能偷自己的钱
      
      const target = context.gameState.players.find(p => p.id === targetId);
      if (target) {
        const actualSteal = Math.min(stealAmount, target.money);
        target.money -= actualSteal;
        totalStolen += actualSteal;
      }
    });

    caster.money += totalStolen;

    return {
      success: true,
      actualValue: totalStolen,
      targetIds: targets,
      description: `偷取了 ${totalStolen} 金钱`,
      criticalHit: calculation.isCritical,
      resistanceApplied: false,
      secondaryEffects: calculation.isCritical ? this.generateCriticalStealEffects(context) : [],
      animationData: {
        type: 'money_steal',
        amount: totalStolen,
        critical: calculation.isCritical
      },
      soundEffects: ['money_steal', calculation.isCritical ? 'critical_steal' : undefined].filter(Boolean)
    };
  }

  private async handleMoneyTransfer(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const calculation = this.calculateDamageOrHealing(effect, context);
    const targets = this.resolveTargets(effect.target, context);
    const transferAmount = Math.abs(calculation.finalDamage);
    
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (!caster || caster.money < transferAmount) {
      return {
        success: false,
        actualValue: 0,
        targetIds: [],
        description: '金钱不足，无法转移',
        criticalHit: false,
        resistanceApplied: false,
        secondaryEffects: []
      };
    }

    caster.money -= transferAmount;
    const amountPerTarget = Math.floor(transferAmount / targets.length);
    
    targets.forEach(targetId => {
      if (targetId === context.casterId) return;
      
      const target = context.gameState.players.find(p => p.id === targetId);
      if (target) {
        target.money += amountPerTarget;
      }
    });

    return {
      success: true,
      actualValue: transferAmount,
      targetIds: targets,
      description: `转移了 ${transferAmount} 金钱`,
      criticalHit: calculation.isCritical,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'money_transfer',
        amount: transferAmount
      },
      soundEffects: ['money_transfer']
    };
  }

  // ============================================================================
  // 位置效果处理器
  // ============================================================================

  private async handlePositionMove(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const moveDistance = typeof effect.value === 'number' ? effect.value : parseInt(effect.value.toString());
    const boardSize = context.gameState.board.length;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const oldPosition = player.position;
        player.position = (player.position + moveDistance) % boardSize;
        if (player.position < 0) {
          player.position += boardSize;
        }

        // 检查是否经过起点
        if (moveDistance > 0 && oldPosition > player.position) {
          // 经过了起点，给予过路费
          const passingGoBonus = context.gameState.marketTrends?.salaryBonus || 2000;
          player.money += passingGoBonus;
        }
      }
    });

    return {
      success: true,
      actualValue: moveDistance,
      targetIds: targets,
      description: `移动了 ${moveDistance} 步`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'position_move',
        distance: moveDistance
      },
      soundEffects: ['move_player']
    };
  }

  private async handlePositionTeleport(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const boardSize = context.gameState.board.length;
    
    // 根据技能等级决定传送位置的精确度
    let targetPosition: number;
    
    if (typeof effect.value === 'number') {
      targetPosition = effect.value % boardSize;
    } else {
      // 随机传送到一个有利位置
      const favorablePositions = this.findFavorablePositions(context);
      targetPosition = favorablePositions[Math.floor(Math.random() * favorablePositions.length)];
    }

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        player.position = targetPosition;
      }
    });

    return {
      success: true,
      actualValue: targetPosition,
      targetIds: targets,
      description: `传送到位置 ${targetPosition}`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'teleport',
        targetPosition
      },
      soundEffects: ['teleport']
    };
  }

  private async handlePositionSwap(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    
    if (targets.length < 2) {
      return {
        success: false,
        actualValue: 0,
        targetIds: targets,
        description: '需要至少两个目标才能交换位置',
        criticalHit: false,
        resistanceApplied: false,
        secondaryEffects: []
      };
    }

    const player1 = context.gameState.players.find(p => p.id === targets[0]);
    const player2 = context.gameState.players.find(p => p.id === targets[1]);
    
    if (player1 && player2) {
      const tempPosition = player1.position;
      player1.position = player2.position;
      player2.position = tempPosition;
    }

    return {
      success: true,
      actualValue: 1,
      targetIds: targets.slice(0, 2),
      description: '交换了位置',
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'position_swap',
        players: [targets[0], targets[1]]
      },
      soundEffects: ['position_swap']
    };
  }

  private async handlePositionLock(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const duration = effect.duration || 1;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        // 添加位置锁定状态效果
        const lockEffect = {
          id: `position_lock_${Date.now()}`,
          name: '位置锁定',
          type: 'position_lock' as any,
          description: '无法移动',
          duration: duration,
          remainingTurns: duration,
          value: 1,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(lockEffect);
      }
    });

    return {
      success: true,
      actualValue: duration,
      targetIds: targets,
      description: `锁定位置 ${duration} 回合`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'position_lock',
        duration
      },
      soundEffects: ['position_lock']
    };
  }

  // ============================================================================
  // 房产效果处理器
  // ============================================================================

  private async handlePropertyDiscount(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const discountRate = typeof effect.value === 'number' ? effect.value : 0.1;
    const duration = effect.duration || 5;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const discountEffect = {
          id: `property_discount_${Date.now()}`,
          name: '房产折扣',
          type: 'property_discount' as any,
          description: `房产购买折扣 ${Math.round(discountRate * 100)}%`,
          duration: duration,
          remainingTurns: duration,
          value: discountRate,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(discountEffect);
      }
    });

    return {
      success: true,
      actualValue: discountRate,
      targetIds: targets,
      description: `获得 ${Math.round(discountRate * 100)}% 房产折扣`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'property_discount',
        rate: discountRate,
        duration
      },
      soundEffects: ['property_buff']
    };
  }

  private async handlePropertyBonus(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const bonusRate = typeof effect.value === 'number' ? effect.value : 0.2;
    const duration = effect.duration || 3;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const bonusEffect = {
          id: `property_bonus_${Date.now()}`,
          name: '房产收益加成',
          type: 'property_bonus' as any,
          description: `房产收益加成 ${Math.round(bonusRate * 100)}%`,
          duration: duration,
          remainingTurns: duration,
          value: bonusRate,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(bonusEffect);
      }
    });

    return {
      success: true,
      actualValue: bonusRate,
      targetIds: targets,
      description: `获得 ${Math.round(bonusRate * 100)}% 房产收益加成`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'property_bonus',
        rate: bonusRate,
        duration
      },
      soundEffects: ['property_buff']
    };
  }

  private async handlePropertyProtection(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const duration = effect.duration || 2;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const protectionEffect = {
          id: `property_protection_${Date.now()}`,
          name: '房产保护',
          type: 'property_protection' as any,
          description: '房产免受负面效果影响',
          duration: duration,
          remainingTurns: duration,
          value: 1,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(protectionEffect);
      }
    });

    return {
      success: true,
      actualValue: duration,
      targetIds: targets,
      description: `房产保护 ${duration} 回合`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'property_protection',
        duration
      },
      soundEffects: ['property_protection']
    };
  }

  private async handlePropertyConfiscate(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    
    if (!caster) {
      return {
        success: false,
        actualValue: 0,
        targetIds: [],
        description: '施法者不存在',
        criticalHit: false,
        resistanceApplied: false,
        secondaryEffects: []
      };
    }

    let confiscatedCount = 0;
    targets.forEach(targetId => {
      if (targetId === context.casterId) return;
      
      const target = context.gameState.players.find(p => p.id === targetId);
      if (target && target.properties.length > 0) {
        // 检查是否有保护效果
        const hasProtection = target.statusEffects.some(se => se.type === 'property_protection');
        if (!hasProtection) {
          // 随机没收一个房产
          const randomIndex = Math.floor(Math.random() * target.properties.length);
          const confiscatedProperty = target.properties.splice(randomIndex, 1)[0];
          caster.properties.push(confiscatedProperty);
          confiscatedCount++;
        }
      }
    });

    return {
      success: confiscatedCount > 0,
      actualValue: confiscatedCount,
      targetIds: targets,
      description: `没收了 ${confiscatedCount} 个房产`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'property_confiscate',
        count: confiscatedCount
      },
      soundEffects: confiscatedCount > 0 ? ['property_confiscate'] : ['effect_blocked']
    };
  }

  // ============================================================================
  // 骰子效果处理器
  // ============================================================================

  private async handleDiceReroll(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);

    // 在游戏状态中标记下次掷骰子时可以重投
    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const rerollEffect = {
          id: `dice_reroll_${Date.now()}`,
          name: '骰子重投',
          type: 'dice_reroll' as any,
          description: '下次掷骰子可以重投一次',
          duration: 1,
          remainingTurns: 1,
          value: 1,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(rerollEffect);
      }
    });

    return {
      success: true,
      actualValue: 1,
      targetIds: targets,
      description: '获得骰子重投机会',
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'dice_reroll'
      },
      soundEffects: ['dice_reroll']
    };
  }

  private async handleDiceModifier(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const modifier = typeof effect.value === 'number' ? effect.value : 0;
    const duration = effect.duration || 1;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const modifierEffect = {
          id: `dice_modifier_${Date.now()}`,
          name: '骰子修正',
          type: 'dice_modifier' as any,
          description: `骰子结果 ${modifier > 0 ? '+' : ''}${modifier}`,
          duration: duration,
          remainingTurns: duration,
          value: modifier,
          stackable: true,
          source: context.casterId
        };
        player.statusEffects.push(modifierEffect);
      }
    });

    return {
      success: true,
      actualValue: modifier,
      targetIds: targets,
      description: `骰子修正 ${modifier > 0 ? '+' : ''}${modifier}`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'dice_modifier',
        modifier,
        duration
      },
      soundEffects: ['dice_modifier']
    };
  }

  private async handleDiceControl(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const controlledValue = typeof effect.value === 'number' ? Math.max(1, Math.min(6, effect.value)) : 6;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const controlEffect = {
          id: `dice_control_${Date.now()}`,
          name: '骰子控制',
          type: 'dice_control' as any,
          description: `下次骰子结果固定为 ${controlledValue}`,
          duration: 1,
          remainingTurns: 1,
          value: controlledValue,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(controlEffect);
      }
    });

    return {
      success: true,
      actualValue: controlledValue,
      targetIds: targets,
      description: `控制骰子结果为 ${controlledValue}`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'dice_control',
        value: controlledValue
      },
      soundEffects: ['dice_control']
    };
  }

  private async handleDiceDouble(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const doubleEffect = {
          id: `dice_double_${Date.now()}`,
          name: '双重骰子',
          type: 'dice_double' as any,
          description: '下次掷两次骰子并选择较好的结果',
          duration: 1,
          remainingTurns: 1,
          value: 1,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(doubleEffect);
      }
    });

    return {
      success: true,
      actualValue: 1,
      targetIds: targets,
      description: '获得双重骰子效果',
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'dice_double'
      },
      soundEffects: ['dice_double']
    };
  }

  // ============================================================================
  // 状态效果处理器
  // ============================================================================

  private async handleStatusBuff(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const buffValue = typeof effect.value === 'number' ? effect.value : 0.1;
    const duration = effect.duration || 3;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const buffEffect = {
          id: `status_buff_${Date.now()}`,
          name: '状态增益',
          type: 'status_buff' as any,
          description: `全属性提升 ${Math.round(buffValue * 100)}%`,
          duration: duration,
          remainingTurns: duration,
          value: buffValue,
          stackable: effect.stackable || false,
          source: context.casterId
        };
        player.statusEffects.push(buffEffect);
      }
    });

    return {
      success: true,
      actualValue: buffValue,
      targetIds: targets,
      description: `获得状态增益`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'status_buff',
        value: buffValue,
        duration
      },
      soundEffects: ['status_buff']
    };
  }

  private async handleStatusDebuff(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const debuffValue = typeof effect.value === 'number' ? Math.abs(effect.value) : 0.1;
    const duration = effect.duration || 2;

    let appliedCount = 0;
    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        // 检查免疫效果
        const hasImmunity = player.statusEffects.some(se => 
          se.type === 'status_immunity' || 
          (se.type === 'debuff_immunity' && se.value > 0)
        );
        
        if (!hasImmunity) {
          const debuffEffect = {
            id: `status_debuff_${Date.now()}`,
            name: '状态减益',
            type: 'status_debuff' as any,
            description: `全属性降低 ${Math.round(debuffValue * 100)}%`,
            duration: duration,
            remainingTurns: duration,
            value: -debuffValue,
            stackable: effect.stackable || false,
            source: context.casterId
          };
          player.statusEffects.push(debuffEffect);
          appliedCount++;
        }
      }
    });

    return {
      success: appliedCount > 0,
      actualValue: debuffValue,
      targetIds: targets,
      description: `施加状态减益 (${appliedCount}/${targets.length} 成功)`,
      criticalHit: false,
      resistanceApplied: appliedCount < targets.length,
      secondaryEffects: [],
      animationData: {
        type: 'status_debuff',
        value: debuffValue,
        duration,
        applied: appliedCount
      },
      soundEffects: appliedCount > 0 ? ['status_debuff'] : ['effect_blocked']
    };
  }

  private async handleStatusImmunity(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const duration = effect.duration || 3;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const immunityEffect = {
          id: `status_immunity_${Date.now()}`,
          name: '状态免疫',
          type: 'status_immunity' as any,
          description: '免疫所有负面状态效果',
          duration: duration,
          remainingTurns: duration,
          value: 1,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(immunityEffect);
      }
    });

    return {
      success: true,
      actualValue: duration,
      targetIds: targets,
      description: `获得状态免疫 ${duration} 回合`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'status_immunity',
        duration
      },
      soundEffects: ['status_immunity']
    };
  }

  private async handleStatusCleanse(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    let cleansedCount = 0;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const beforeCount = player.statusEffects.length;
        // 移除所有负面状态效果
        player.statusEffects = player.statusEffects.filter(se => se.value >= 0);
        const afterCount = player.statusEffects.length;
        cleansedCount += beforeCount - afterCount;
      }
    });

    return {
      success: cleansedCount > 0,
      actualValue: cleansedCount,
      targetIds: targets,
      description: `清除了 ${cleansedCount} 个负面效果`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'status_cleanse',
        count: cleansedCount
      },
      soundEffects: cleansedCount > 0 ? ['status_cleanse'] : ['no_effect']
    };
  }

  // ============================================================================
  // 技能效果处理器
  // ============================================================================

  private async handleSkillCooldownReduce(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const reduction = typeof effect.value === 'number' ? effect.value : 1;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        // 为所有技能减少冷却时间
        player.statusEffects.forEach(se => {
          if (se.type === 'skill_cooldown' && se.remainingTurns > 0) {
            se.remainingTurns = Math.max(0, se.remainingTurns - reduction);
          }
        });
      }
    });

    return {
      success: true,
      actualValue: reduction,
      targetIds: targets,
      description: `减少 ${reduction} 回合技能冷却`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'cooldown_reduce',
        reduction
      },
      soundEffects: ['cooldown_reduce']
    };
  }

  private async handleSkillPowerBoost(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const boostValue = typeof effect.value === 'number' ? effect.value : 0.2;
    const duration = effect.duration || 3;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const boostEffect = {
          id: `skill_power_boost_${Date.now()}`,
          name: '技能威力提升',
          type: 'skill_power_boost' as any,
          description: `技能效果提升 ${Math.round(boostValue * 100)}%`,
          duration: duration,
          remainingTurns: duration,
          value: boostValue,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(boostEffect);
      }
    });

    return {
      success: true,
      actualValue: boostValue,
      targetIds: targets,
      description: `技能威力提升 ${Math.round(boostValue * 100)}%`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'skill_power_boost',
        value: boostValue,
        duration
      },
      soundEffects: ['skill_power_boost']
    };
  }

  private async handleSkillDisable(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const duration = effect.duration || 2;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const disableEffect = {
          id: `skill_disable_${Date.now()}`,
          name: '技能禁用',
          type: 'skill_disable' as any,
          description: '无法使用技能',
          duration: duration,
          remainingTurns: duration,
          value: 1,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(disableEffect);
      }
    });

    return {
      success: true,
      actualValue: duration,
      targetIds: targets,
      description: `禁用技能 ${duration} 回合`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'skill_disable',
        duration
      },
      soundEffects: ['skill_disable']
    };
  }

  private async handleSkillCopy(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    // 这是一个复杂的效果，需要访问最近使用的技能
    // 这里提供基础实现，实际需要与技能管理器协作
    
    return {
      success: true,
      actualValue: 1,
      targetIds: [context.casterId],
      description: '复制了最后使用的技能效果',
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'skill_copy'
      },
      soundEffects: ['skill_copy']
    };
  }

  // ============================================================================
  // 特殊效果处理器
  // ============================================================================

  private async handleTurnExtra(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const extraTurns = typeof effect.value === 'number' ? effect.value : 1;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const extraTurnEffect = {
          id: `extra_turn_${Date.now()}`,
          name: '额外回合',
          type: 'extra_turn' as any,
          description: `获得 ${extraTurns} 个额外回合`,
          duration: 1,
          remainingTurns: 1,
          value: extraTurns,
          stackable: true,
          source: context.casterId
        };
        player.statusEffects.push(extraTurnEffect);
      }
    });

    return {
      success: true,
      actualValue: extraTurns,
      targetIds: targets,
      description: `获得 ${extraTurns} 个额外回合`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'extra_turn',
        count: extraTurns
      },
      soundEffects: ['extra_turn']
    };
  }

  private async handleTurnSkip(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    const targets = this.resolveTargets(effect.target, context);
    const skipTurns = typeof effect.value === 'number' ? effect.value : 1;

    targets.forEach(targetId => {
      const player = context.gameState.players.find(p => p.id === targetId);
      if (player) {
        const skipEffect = {
          id: `turn_skip_${Date.now()}`,
          name: '跳过回合',
          type: 'turn_skip' as any,
          description: `跳过 ${skipTurns} 个回合`,
          duration: skipTurns,
          remainingTurns: skipTurns,
          value: 1,
          stackable: false,
          source: context.casterId
        };
        player.statusEffects.push(skipEffect);
      }
    });

    return {
      success: true,
      actualValue: skipTurns,
      targetIds: targets,
      description: `跳过 ${skipTurns} 个回合`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'turn_skip',
        count: skipTurns
      },
      soundEffects: ['turn_skip']
    };
  }

  private async handleEventTrigger(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    // 触发随机事件或特定事件
    const eventType = typeof effect.value === 'string' ? effect.value : 'random';
    
    // 这里需要与游戏的事件系统协作
    const triggeredEvent = {
      id: `triggered_event_${Date.now()}`,
      type: eventType,
      description: '技能触发的特殊事件',
      timestamp: Date.now()
    };

    return {
      success: true,
      actualValue: 1,
      targetIds: [],
      description: `触发了特殊事件: ${eventType}`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'event_trigger',
        eventType
      },
      soundEffects: ['event_trigger']
    };
  }

  private async handleRuleChange(effect: SkillEffect, context: EffectContext): Promise<EffectProcessResult> {
    // 临时改变游戏规则
    const ruleChange = typeof effect.value === 'string' ? effect.value : 'unknown';
    const duration = effect.duration || 1;

    // 这是一个全局效果，影响整个游戏
    const ruleEffect = {
      id: `rule_change_${Date.now()}`,
      type: 'rule_change',
      rule: ruleChange,
      duration: duration,
      source: context.casterId
    };

    // 将规则变更添加到游戏状态
    if (!context.gameState.activeRuleChanges) {
      (context.gameState as any).activeRuleChanges = [];
    }
    (context.gameState as any).activeRuleChanges.push(ruleEffect);

    return {
      success: true,
      actualValue: 1,
      targetIds: [],
      description: `改变游戏规则: ${ruleChange}`,
      criticalHit: false,
      resistanceApplied: false,
      secondaryEffects: [],
      animationData: {
        type: 'rule_change',
        rule: ruleChange,
        duration
      },
      soundEffects: ['rule_change']
    };
  }

  // ============================================================================
  // 技能效果组合和链式反应系统
  // ============================================================================


  private effectCombos: Map<string, EffectCombo> = new Map();
  private chainReactions: Map<string, ChainReaction> = new Map();
  private activeComboCooldowns: Map<string, number> = new Map();
  private activeChainHistory: Map<string, number> = new Map();

  /**
   * 初始化效果组合和链式反应系统
   */
  private initializeComboAndChainSystems(): void {
    console.log('🔗 初始化技能效果组合和链式反应系统...');
    
    this.initializeEffectCombos();
    this.initializeChainReactions();
    
    console.log('✅ 组合和链式反应系统初始化完成');
  }

  /**
   * 初始化效果组合
   */
  private initializeEffectCombos(): void {
    // 金钱连击组合
    this.registerEffectCombo({
      id: 'money_cascade',
      name: '金钱瀑布',
      description: '连续的金钱效果触发额外的金钱奖励',
      triggerEffects: [SkillEffectType.MONEY_GAIN, SkillEffectType.MONEY_STEAL],
      comboEffects: [
        {
          id: 'cascade_bonus',
          type: SkillEffectType.MONEY_GAIN,
          target: SkillTargetType.SELF,
          value: 500,
          description: '金钱瀑布奖励'
        }
      ],
      cooldown: 3,
      probability: 0.3
    });

    // 位置控制组合
    this.registerEffectCombo({
      id: 'position_mastery',
      name: '位置大师',
      description: '连续使用位置效果获得位置控制优势',
      triggerEffects: [SkillEffectType.POSITION_MOVE, SkillEffectType.POSITION_TELEPORT, SkillEffectType.POSITION_SWAP],
      comboEffects: [
        {
          id: 'position_advantage',
          type: SkillEffectType.DICE_CONTROL,
          target: SkillTargetType.SELF,
          value: 6,
          description: '位置控制优势'
        }
      ],
      cooldown: 2,
      probability: 0.4
    });

    // 房产帝国组合
    this.registerEffectCombo({
      id: 'property_empire',
      name: '房产帝国',
      description: '房产相关效果叠加触发房产收益爆发',
      triggerEffects: [SkillEffectType.PROPERTY_BONUS, SkillEffectType.PROPERTY_DISCOUNT],
      comboEffects: [
        {
          id: 'empire_bonus',
          type: SkillEffectType.PROPERTY_BONUS,
          target: SkillTargetType.SELF,
          value: 0.5,
          duration: 5,
          description: '房产帝国加成'
        }
      ],
      cooldown: 4,
      probability: 0.25
    });

    // 生肖专属组合 - 龙族威严
    this.registerEffectCombo({
      id: 'dragon_majesty',
      name: '龙族威严',
      description: '龙年玩家触发任何效果都有机会产生额外威严效果',
      triggerEffects: Object.values(SkillEffectType),
      comboEffects: [
        {
          id: 'majesty_aura',
          type: SkillEffectType.STATUS_BUFF,
          target: SkillTargetType.SELF,
          value: 0.3,
          duration: 3,
          description: '龙族威严光环'
        }
      ],
      zodiacRestrictions: ['龙' as ZodiacSign],
      cooldown: 5,
      probability: 0.15
    });

    // 状态效果共鸣
    this.registerEffectCombo({
      id: 'status_resonance',
      name: '状态共鸣',
      description: '连续施放状态效果时产生共鸣，影响范围扩大',
      triggerEffects: [SkillEffectType.STATUS_BUFF, SkillEffectType.STATUS_DEBUFF],
      comboEffects: [
        {
          id: 'resonance_spread',
          type: SkillEffectType.STATUS_BUFF,
          target: SkillTargetType.ALL_OTHERS,
          value: 0.1,
          duration: 2,
          description: '状态共鸣扩散'
        }
      ],
      cooldown: 3,
      probability: 0.35
    });
  }

  /**
   * 初始化链式反应
   */
  private initializeChainReactions(): void {
    // 暴击连锁
    this.registerChainReaction({
      id: 'critical_chain',
      name: '暴击连锁',
      description: '暴击效果触发连锁暴击反应',
      triggerCondition: (result, context) => result.criticalHit && result.success,
      chainEffect: {
        id: 'chain_critical',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.RANDOM_PLAYER,
        value: 200,
        description: '连锁暴击效果'
      },
      maxChainLength: 3,
      chainDamageMultiplier: 0.8,
      zodiacEnhancement: (zodiac) => {
        const enhancements = {
          '虎': 1.5,  // 虎年增强暴击连锁
          '龙': 1.3,  // 龙年威严加成
          '猴': 1.2   // 猴年灵活加成
        };
        return enhancements[zodiac] || 1.0;
      }
    });

    // 金钱窃取连锁
    this.registerChainReaction({
      id: 'steal_chain',
      name: '窃取连锁',
      description: '成功窃取金钱后触发连锁窃取效应',
      triggerCondition: (result, context) => 
        result.success && 
        result.actualValue > 0 && 
        context.skillDefinition.effects.some(e => e.type === SkillEffectType.MONEY_STEAL),
      chainEffect: {
        id: 'chain_steal',
        type: SkillEffectType.MONEY_STEAL,
        target: SkillTargetType.RANDOM_PLAYER,
        value: 150,
        description: '连锁窃取'
      },
      maxChainLength: 2,
      chainDamageMultiplier: 0.7,
      zodiacEnhancement: (zodiac) => {
        const enhancements = {
          '鼠': 2.0,  // 鼠年窃取天赋
          '蛇': 1.4   // 蛇年隐秘加成
        };
        return enhancements[zodiac] || 1.0;
      }
    });

    // 位置混乱连锁
    this.registerChainReaction({
      id: 'position_chaos',
      name: '位置混乱',
      description: '位置效果成功时可能引发连锁位置变动',
      triggerCondition: (result, context) => 
        result.success && 
        context.skillDefinition.effects.some(e => 
          [SkillEffectType.POSITION_MOVE, SkillEffectType.POSITION_TELEPORT, SkillEffectType.POSITION_SWAP]
          .includes(e.type)
        ),
      chainEffect: {
        id: 'chaos_move',
        type: SkillEffectType.POSITION_MOVE,
        target: SkillTargetType.ALL_OTHERS,
        value: 2,
        description: '混乱位移'
      },
      maxChainLength: 1,
      chainDamageMultiplier: 0.5,
      zodiacEnhancement: (zodiac) => {
        const enhancements = {
          '马': 1.6,  // 马年奔腾加成
          '猴': 1.4   // 猴年跳跃加成
        };
        return enhancements[zodiac] || 1.0;
      }
    });

    // 状态传染连锁
    this.registerChainReaction({
      id: 'status_contagion',
      name: '状态传染',
      description: '强力状态效果可能传染给其他玩家',
      triggerCondition: (result, context) => 
        result.success && 
        result.actualValue > 0.2 && 
        context.skillDefinition.effects.some(e => 
          [SkillEffectType.STATUS_BUFF, SkillEffectType.STATUS_DEBUFF].includes(e.type)
        ),
      chainEffect: {
        id: 'status_spread',
        type: SkillEffectType.STATUS_BUFF,
        target: SkillTargetType.ALL_OTHERS,
        value: 0.05,
        duration: 1,
        description: '状态传染效果'
      },
      maxChainLength: 1,
      chainDamageMultiplier: 0.3,
      zodiacEnhancement: (zodiac) => {
        const enhancements = {
          '羊': 1.5,  // 羊年和谐传播
          '猪': 1.3   // 猪年包容传播
        };
        return enhancements[zodiac] || 1.0;
      }
    });
  }

  /**
   * 注册效果组合
   */
  public registerEffectCombo(combo: EffectCombo): void {
    this.effectCombos.set(combo.id, combo);
  }

  /**
   * 注册链式反应
   */
  public registerChainReaction(reaction: ChainReaction): void {
    this.chainReactions.set(reaction.id, reaction);
  }

  /**
   * 检查并触发效果组合
   */
  private async checkAndTriggerCombos(
    processedEffects: EffectProcessResult[],
    context: EffectContext
  ): Promise<EffectProcessResult[]> {
    const comboResults: EffectProcessResult[] = [];
    const currentTurn = context.gameState.turn;
    
    for (const [comboId, combo] of this.effectCombos.entries()) {
      // 检查冷却时间
      const lastTriggered = this.activeComboCooldowns.get(`${context.casterId}_${comboId}`);
      if (lastTriggered && currentTurn - lastTriggered < combo.cooldown) {
        continue;
      }

      // 检查生肖限制
      const caster = context.gameState.players.find(p => p.id === context.casterId);
      if (combo.zodiacRestrictions && caster && 
          !combo.zodiacRestrictions.includes(caster.zodiac)) {
        continue;
      }

      // 检查是否有足够的触发效果
      const triggeredEffects = processedEffects.filter(result => 
        result.success && 
        combo.triggerEffects.some(triggerType =>
          context.skillDefinition.effects.some(e => e.type === triggerType)
        )
      );

      if (triggeredEffects.length >= 2) { // 需要至少2个成功的相关效果
        // 概率检查
        if (Math.random() < combo.probability) {
          console.log(`🔥 触发效果组合: ${combo.name}`);
          
          // 执行组合效果
          for (const comboEffect of combo.comboEffects) {
            const comboResult = await this.processEffect(comboEffect, {
              ...context,
              comboBonus: 0.2 // 组合效果有20%加成
            });
            
            comboResult.description += ` [${combo.name}]`;
            comboResults.push(comboResult);
          }

          // 设置冷却时间
          this.activeComboCooldowns.set(`${context.casterId}_${comboId}`, currentTurn);
        }
      }
    }

    return comboResults;
  }

  /**
   * 检查并触发链式反应
   */
  private async checkAndTriggerChainReactions(
    result: EffectProcessResult,
    context: EffectContext,
    currentChainLength: number = 0
  ): Promise<EffectProcessResult[]> {
    const chainResults: EffectProcessResult[] = [];
    
    for (const [reactionId, reaction] of this.chainReactions.entries()) {
      // 检查链长度限制
      if (currentChainLength >= reaction.maxChainLength) {
        continue;
      }

      // 检查触发条件
      if (!reaction.triggerCondition(result, context)) {
        continue;
      }

      // 获取生肖增强
      const caster = context.gameState.players.find(p => p.id === context.casterId);
      const zodiacMultiplier = reaction.zodiacEnhancement && caster ? 
        reaction.zodiacEnhancement(caster.zodiac) : 1.0;

      // 计算链式伤害衰减
      const chainMultiplier = Math.pow(reaction.chainDamageMultiplier, currentChainLength);
      const enhancedChainEffect = { ...reaction.chainEffect };
      
      if (typeof enhancedChainEffect.value === 'number') {
        enhancedChainEffect.value = Math.round(
          enhancedChainEffect.value * chainMultiplier * zodiacMultiplier
        );
      }

      console.log(`⚡ 触发链式反应: ${reaction.name} (链长: ${currentChainLength + 1})`);
      
      // 执行链式效果
      const chainResult = await this.processEffect(enhancedChainEffect, {
        ...context,
        chainMultiplier: chainMultiplier
      });
      
      chainResult.description += ` [链式x${currentChainLength + 1}]`;
      chainResults.push(chainResult);

      // 递归检查是否触发更多链式反应
      const subChainResults = await this.checkAndTriggerChainReactions(
        chainResult,
        context,
        currentChainLength + 1
      );
      
      chainResults.push(...subChainResults);
    }

    return chainResults;
  }

  /**
   * 增强版批量效果处理（包含组合和链式反应）
   */
  public async processEnhancedMultipleEffects(
    effects: SkillEffect[],
    context: EffectContext
  ): Promise<EffectProcessResult[]> {
    const allResults: EffectProcessResult[] = [];
    
    // 1. 处理基础效果
    for (const effect of effects) {
      const result = await this.processEffect(effect, context);
      allResults.push(result);
      
      // 检查链式反应
      const chainResults = await this.checkAndTriggerChainReactions(result, context);
      allResults.push(...chainResults);
      
      // 处理二次效果
      if (result.secondaryEffects.length > 0) {
        for (const secondaryEffect of result.secondaryEffects) {
          const secondaryResult = await this.processEffect(secondaryEffect, context);
          allResults.push(secondaryResult);
        }
      }
    }

    // 2. 检查效果组合
    const comboResults = await this.checkAndTriggerCombos(allResults, context);
    allResults.push(...comboResults);

    // 3. 应用技能级联效果
    const cascadeResults = await this.processCascadeEffects(allResults, context);
    allResults.push(...cascadeResults);

    return allResults;
  }

  /**
   * 处理技能级联效果
   */
  private async processCascadeEffects(
    results: EffectProcessResult[],
    context: EffectContext
  ): Promise<EffectProcessResult[]> {
    const cascadeResults: EffectProcessResult[] = [];
    
    // 检查特殊级联条件
    const successfulResults = results.filter(r => r.success);
    const criticalResults = results.filter(r => r.criticalHit);
    const highValueResults = results.filter(r => r.actualValue > 1000);

    // 大成功级联 (3个以上成功效果)
    if (successfulResults.length >= 3) {
      const grandSuccessEffect: SkillEffect = {
        id: 'grand_success',
        type: SkillEffectType.STATUS_BUFF,
        target: SkillTargetType.SELF,
        value: 0.25,
        duration: 3,
        description: '大成功状态'
      };
      
      const cascadeResult = await this.processEffect(grandSuccessEffect, context);
      cascadeResult.description += ' [大成功级联]';
      cascadeResults.push(cascadeResult);
    }

    // 暴击风暴 (2个以上暴击)
    if (criticalResults.length >= 2) {
      const criticalStormEffect: SkillEffect = {
        id: 'critical_storm',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: criticalResults.length * 300,
        description: '暴击风暴奖励'
      };
      
      const cascadeResult = await this.processEffect(criticalStormEffect, context);
      cascadeResult.description += ' [暴击风暴]';
      cascadeResults.push(cascadeResult);
    }

    // 巨额效应 (单次效果超过1000)
    if (highValueResults.length > 0) {
      const bigMoneyEffect: SkillEffect = {
        id: 'big_money',
        type: SkillEffectType.DICE_DOUBLE,
        target: SkillTargetType.SELF,
        value: 1,
        description: '巨额效应带来的运气'
      };
      
      const cascadeResult = await this.processEffect(bigMoneyEffect, context);
      cascadeResult.description += ' [巨额效应]';
      cascadeResults.push(cascadeResult);
    }

    return cascadeResults;
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  /**
   * 解析技能目标
   */
  private resolveTargets(targetType: SkillTargetType, context: EffectContext): string[] {
    switch (targetType) {
      case SkillTargetType.SELF:
        return [context.casterId];
      
      case SkillTargetType.SINGLE_PLAYER:
        // 这里需要从上下文中获取明确指定的目标
        return []; // 需要外部提供目标
      
      case SkillTargetType.ALL_PLAYERS:
        return context.gameState.players.map(p => p.id);
      
      case SkillTargetType.ALL_OTHERS:
        return context.gameState.players.filter(p => p.id !== context.casterId).map(p => p.id);
      
      case SkillTargetType.RANDOM_PLAYER:
        const otherPlayers = context.gameState.players.filter(p => p.id !== context.casterId);
        if (otherPlayers.length === 0) return [];
        const randomPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        return [randomPlayer.id];
      
      default:
        return [];
    }
  }

  /**
   * 计算伤害或治疗量（使用新的高级伤害计算系统）
   */
  private calculateDamageOrHealing(effect: SkillEffect, context: EffectContext): DamageCalculationResult {
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (!caster) {
      // 回退到简单计算
      return this.calculateSimpleDamage(effect, context);
    }

    // 构建伤害计算上下文
    const damageContext: DamageCalculationContext = {
      caster: caster,
      targets: context.gameState.players.filter(p => p.id !== context.casterId), // 简化目标选择
      skill: context.skillDefinition,
      effect: effect,
      gameState: context.gameState,
      skillLevel: context.skillLevel,
      isCombo: !!context.comboBonus,
      isChain: !!context.chainMultiplier,
      chainLength: 0,
      season: context.gameState.season || '春',
      timeOfDay: 'noon', // 默认正午
      customModifiers: [],
      ignoreResistance: false,
      guaranteedCritical: false,
      recentDamage: [],
      consecutiveCrits: this.criticalHitCache.get(context.casterId) || 0
    };

    // 使用高级伤害计算器
    try {
      const detailedResult = this.damageCalculator.calculateDetailedDamage(damageContext);
      
      // 转换为旧格式的结果
      return {
        baseDamage: detailedResult.baseDamage,
        finalDamage: detailedResult.finalDamage,
        isCritical: detailedResult.isCritical,
        resistanceReduction: Math.abs(detailedResult.breakdown.targetResistance),
        bonusMultiplier: detailedResult.breakdown.criticalMultiplier,
        breakdown: {
          baseValue: detailedResult.breakdown.baseValue,
          levelScaling: detailedResult.breakdown.skillLevel,
          skillEnhancements: detailedResult.breakdown.skillEnhancement,
          zodiacBonus: detailedResult.breakdown.zodiacSynergy,
          seasonalBonus: detailedResult.breakdown.seasonalBonus,
          criticalMultiplier: detailedResult.breakdown.criticalMultiplier,
          resistance: detailedResult.breakdown.targetResistance,
          randomVariation: detailedResult.breakdown.randomVariation
        }
      };
    } catch (error) {
      console.error('高级伤害计算失败，回退到简单计算:', error);
      return this.calculateSimpleDamage(effect, context);
    }
  }

  /**
   * 简单伤害计算（回退方案）
   */
  private calculateSimpleDamage(effect: SkillEffect, context: EffectContext): DamageCalculationResult {
    const baseValue = typeof effect.value === 'number' ? Math.abs(effect.value) : 0;
    
    const breakdown: DamageBreakdown = {
      baseValue: baseValue,
      levelScaling: 0,
      skillEnhancements: 0,
      zodiacBonus: 0,
      seasonalBonus: 0,
      criticalMultiplier: 1,
      resistance: 0,
      randomVariation: 0
    };

    // 基础计算
    let finalValue = baseValue;
    const isCritical = Math.random() < 0.05;
    
    if (isCritical) {
      breakdown.criticalMultiplier = 2.0;
      finalValue *= 2.0;
    }

    return {
      baseDamage: baseValue,
      finalDamage: Math.round(finalValue),
      isCritical: isCritical,
      resistanceReduction: 0,
      bonusMultiplier: breakdown.criticalMultiplier,
      breakdown: breakdown
    };
  }

  /**
   * 增强上下文with奖励
   */
  private enhanceContextWithBonuses(context: EffectContext): EffectContext {
    const enhancedContext = { ...context };
    
    // 计算季节加成
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (caster) {
      const zodiacTrait = ZODIAC_SKILL_TRAITS[caster.zodiac];
      if (zodiacTrait && zodiacTrait.seasonBonus === context.gameState.season) {
        enhancedContext.seasonalBonus = 0.2; // 季节匹配时20%加成
      }
    }

    // 计算组合加成
    if (context.comboBonus) {
      enhancedContext.comboBonus = context.comboBonus;
    }

    return enhancedContext;
  }

  /**
   * 应用后处理增强
   */
  private applyPostProcessingEnhancements(
    result: EffectProcessResult, 
    effect: SkillEffect, 
    context: EffectContext
  ): EffectProcessResult {
    // 应用技能威力提升效果
    const caster = context.gameState.players.find(p => p.id === context.casterId);
    if (caster) {
      const powerBoostEffect = caster.statusEffects.find(se => se.type === 'skill_power_boost');
      if (powerBoostEffect) {
        result.actualValue = Math.round(result.actualValue * (1 + powerBoostEffect.value));
        result.description += ` (威力提升)`;
      }
    }

    return result;
  }

  /**
   * 生成连锁效果
   */
  private generateSecondaryEffects(
    effectType: string, 
    calculation: DamageCalculationResult, 
    context: EffectContext
  ): SkillEffect[] {
    const secondaryEffects: SkillEffect[] = [];

    // 暴击可能触发额外效果
    if (calculation.isCritical) {
      switch (effectType) {
        case 'money_gain':
          // 暴击金钱获得可能触发额外的小额奖励
          secondaryEffects.push({
            id: 'critical_bonus',
            type: SkillEffectType.MONEY_GAIN,
            target: SkillTargetType.SELF,
            value: calculation.finalDamage * 0.1,
            description: '暴击奖励'
          });
          break;
      }
    }

    return secondaryEffects;
  }

  /**
   * 生成暴击偷取效果
   */
  private generateCriticalStealEffects(context: EffectContext): SkillEffect[] {
    return [
      {
        id: 'critical_steal_bonus',
        type: SkillEffectType.STATUS_BUFF,
        target: SkillTargetType.SELF,
        value: 0.1,
        duration: 2,
        description: '成功偷取的兴奋感提升状态'
      }
    ];
  }

  /**
   * 寻找有利位置
   */
  private findFavorablePositions(context: EffectContext): number[] {
    const favorablePositions: number[] = [];
    
    // 寻找没有其他玩家的房产位置
    for (let i = 0; i < context.gameState.board.length; i++) {
      const cell = context.gameState.board[i];
      if (cell.type === 'property') {
        // 检查是否被其他玩家拥有
        const isOwned = context.gameState.players.some(p => 
          p.id !== context.casterId && p.properties.includes(cell.id || i.toString())
        );
        if (!isOwned) {
          favorablePositions.push(i);
        }
      }
    }

    // 如果没有找到有利位置，返回一些安全位置
    if (favorablePositions.length === 0) {
      favorablePositions.push(0); // 起点
      favorablePositions.push(Math.floor(context.gameState.board.length / 4)); // 1/4位置
      favorablePositions.push(Math.floor(context.gameState.board.length / 2)); // 1/2位置
    }

    return favorablePositions;
  }

  /**
   * 清理缓存和重置状态
   */
  public clearCache(): void {
    this.criticalHitCache.clear();
    this.resistanceCache.clear();
    this.activeComboCooldowns.clear();
    this.activeChainHistory.clear();
    this.damageCalculator.clearCache();
    console.log('🧹 技能效果处理器缓存已清理');
  }
}

export default SkillEffectProcessor;