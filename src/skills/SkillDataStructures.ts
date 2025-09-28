/**
 * 技能数据结构实现
 * 第二阶段 Day 1: 技能系统架构
 * 
 * 实现技能系统的核心数据结构，包括：
 * - 生肖专属技能定义
 * - 通用技能库
 * - 技能组合规则
 * - 技能平衡配置
 */

import type { ZodiacSign, Season } from '../types/game';
import {
  SkillDefinition,
  SkillCategory,
  SkillRarity,
  SkillActivationType,
  SkillTargetType,
  SkillEffectType,
  SkillConditionType,
  SkillRequirementType,
  ZodiacSkillTrait,
  PassiveBonus,
  SkillBalanceConfig,
  ComboRestriction
} from './SkillSystemArchitecture';

// ============================================================================
// 生肖技能特性定义
// ============================================================================

/**
 * 十二生肖技能特性配置
 */
export const ZODIAC_SKILL_TRAITS: Record<ZodiacSign, ZodiacSkillTrait> = {
  '鼠': {
    zodiac: '鼠',
    seasonBonus: '冬',
    compatibleZodiacs: ['龙', '猴'],
    conflictZodiacs: ['马', '羊'],
    uniqueEffectTypes: [SkillEffectType.MONEY_STEAL, SkillEffectType.SKILL_COPY],
    passiveBonus: {
      moneyMultiplier: 1.1,
      skillCooldownReduction: 0.15,
      diceModifier: 1.05
    }
  },
  '牛': {
    zodiac: '牛',
    seasonBonus: '冬',
    compatibleZodiacs: ['蛇', '鸡'],
    conflictZodiacs: ['羊', '马'],
    uniqueEffectTypes: [SkillEffectType.PROPERTY_PROTECTION, SkillEffectType.STATUS_IMMUNITY],
    passiveBonus: {
      propertyDiscount: 0.1,
      moneyMultiplier: 1.05,
      immunities: [SkillEffectType.MONEY_STEAL, SkillEffectType.PROPERTY_CONFISCATE]
    }
  },
  '虎': {
    zodiac: '虎',
    seasonBonus: '春',
    compatibleZodiacs: ['马', '狗'],
    conflictZodiacs: ['猴', '蛇'],
    uniqueEffectTypes: [SkillEffectType.DICE_CONTROL, SkillEffectType.STATUS_DEBUFF],
    passiveBonus: {
      diceModifier: 1.2,
      skillCooldownReduction: 0.1,
      moneyMultiplier: 1.08
    }
  },
  '兔': {
    zodiac: '兔',
    seasonBonus: '春',
    compatibleZodiacs: ['羊', '猪'],
    conflictZodiacs: ['鸡', '龙'],
    uniqueEffectTypes: [SkillEffectType.POSITION_TELEPORT, SkillEffectType.TURN_EXTRA],
    passiveBonus: {
      skillCooldownReduction: 0.2,
      diceModifier: 1.1,
      propertyDiscount: 0.05
    }
  },
  '龙': {
    zodiac: '龙',
    seasonBonus: '春',
    compatibleZodiacs: ['鼠', '猴'],
    conflictZodiacs: ['狗', '兔'],
    uniqueEffectTypes: [SkillEffectType.RULE_CHANGE, SkillEffectType.SKILL_POWER_BOOST],
    passiveBonus: {
      moneyMultiplier: 1.15,
      skillCooldownReduction: 0.1,
      diceModifier: 1.15
    }
  },
  '蛇': {
    zodiac: '蛇',
    seasonBonus: '夏',
    compatibleZodiacs: ['牛', '鸡'],
    conflictZodiacs: ['猪', '虎'],
    uniqueEffectTypes: [SkillEffectType.MONEY_TRANSFER, SkillEffectType.SKILL_DISABLE],
    passiveBonus: {
      moneyMultiplier: 1.12,
      skillCooldownReduction: 0.08,
      propertyDiscount: 0.08
    }
  },
  '马': {
    zodiac: '马',
    seasonBonus: '夏',
    compatibleZodiacs: ['虎', '狗'],
    conflictZodiacs: ['鼠', '牛'],
    uniqueEffectTypes: [SkillEffectType.POSITION_MOVE, SkillEffectType.DICE_DOUBLE],
    passiveBonus: {
      diceModifier: 1.25,
      skillCooldownReduction: 0.05,
      moneyMultiplier: 1.06
    }
  },
  '羊': {
    zodiac: '羊',
    seasonBonus: '夏',
    compatibleZodiacs: ['兔', '猪'],
    conflictZodiacs: ['牛', '鼠'],
    uniqueEffectTypes: [SkillEffectType.STATUS_BUFF, SkillEffectType.PROPERTY_BONUS],
    passiveBonus: {
      propertyDiscount: 0.15,
      moneyMultiplier: 1.08,
      skillCooldownReduction: 0.12
    }
  },
  '猴': {
    zodiac: '猴',
    seasonBonus: '秋',
    compatibleZodiacs: ['鼠', '龙'],
    conflictZodiacs: ['虎', '猪'],
    uniqueEffectTypes: [SkillEffectType.SKILL_COPY, SkillEffectType.DICE_REROLL],
    passiveBonus: {
      skillCooldownReduction: 0.25,
      diceModifier: 1.1,
      moneyMultiplier: 1.1
    }
  },
  '鸡': {
    zodiac: '鸡',
    seasonBonus: '秋',
    compatibleZodiacs: ['牛', '蛇'],
    conflictZodiacs: ['兔', '狗'],
    uniqueEffectTypes: [SkillEffectType.EVENT_TRIGGER, SkillEffectType.MONEY_GAIN],
    passiveBonus: {
      moneyMultiplier: 1.18,
      propertyDiscount: 0.06,
      skillCooldownReduction: 0.08
    }
  },
  '狗': {
    zodiac: '狗',
    seasonBonus: '秋',
    compatibleZodiacs: ['虎', '马'],
    conflictZodiacs: ['龙', '鸡'],
    uniqueEffectTypes: [SkillEffectType.PROPERTY_PROTECTION, SkillEffectType.STATUS_CLEANSE],
    passiveBonus: {
      propertyDiscount: 0.12,
      immunities: [SkillEffectType.STATUS_DEBUFF],
      skillCooldownReduction: 0.1,
      moneyMultiplier: 1.05
    }
  },
  '猪': {
    zodiac: '猪',
    seasonBonus: '冬',
    compatibleZodiacs: ['兔', '羊'],
    conflictZodiacs: ['蛇', '猴'],
    uniqueEffectTypes: [SkillEffectType.MONEY_GAIN, SkillEffectType.TURN_SKIP],
    passiveBonus: {
      moneyMultiplier: 1.2,
      propertyDiscount: 0.08,
      skillCooldownReduction: 0.05
    }
  }
};

// ============================================================================
// 生肖专属技能定义
// ============================================================================

/**
 * 鼠年专属技能
 */
export const RAT_SKILLS: SkillDefinition[] = [
  {
    id: 'rat_money_steal',
    name: '鼠目寸光',
    description: '从目标玩家处偷取一定金额的金钱',
    flavorText: '机灵的老鼠总能找到获利的机会',
    category: SkillCategory.ACTIVE_OFFENSIVE,
    rarity: SkillRarity.COMMON,
    zodiacSign: '鼠',
    activationType: SkillActivationType.MANUAL,
    targetType: SkillTargetType.SINGLE_PLAYER,
    maxTargets: 1,
    cooldown: 3,
    moneyCost: 500,
    effects: [
      {
        id: 'steal_money',
        type: SkillEffectType.MONEY_STEAL,
        target: SkillTargetType.SINGLE_PLAYER,
        value: 1000,
        description: '偷取目标1000金钱',
        modifiers: {
          scaling: 1.2,
          randomness: 0.3
        }
      }
    ],
    maxLevel: 5,
    levelScaling: {
      effectMultiplier: 1.3,
      cooldownReduction: 0.2
    },
    balanceVersion: '1.0.0',
    tags: ['stealth', 'money', 'offensive']
  },
  {
    id: 'rat_skill_copy',
    name: '学而时习',
    description: '复制上一个使用的技能效果',
    flavorText: '聪明的老鼠善于学习和模仿',
    category: SkillCategory.ACTIVE_UTILITY,
    rarity: SkillRarity.RARE,
    zodiacSign: '鼠',
    activationType: SkillActivationType.MANUAL,
    targetType: SkillTargetType.SELF,
    cooldown: 5,
    energyCost: 3,
    effects: [
      {
        id: 'copy_last_skill',
        type: SkillEffectType.SKILL_COPY,
        target: SkillTargetType.SELF,
        value: 1,
        description: '复制最后使用的技能效果'
      }
    ],
    maxLevel: 3,
    balanceVersion: '1.0.0',
    tags: ['utility', 'copy', 'adaptive']
  }
];

/**
 * 牛年专属技能
 */
export const OX_SKILLS: SkillDefinition[] = [
  {
    id: 'ox_property_shield',
    name: '牛气冲天',
    description: '保护自己的房产免受负面效果影响',
    flavorText: '坚韧的牛儿守护着自己的家园',
    category: SkillCategory.ACTIVE_DEFENSIVE,
    rarity: SkillRarity.UNCOMMON,
    zodiacSign: '牛',
    activationType: SkillActivationType.MANUAL,
    targetType: SkillTargetType.SELF,
    cooldown: 4,
    moneyCost: 800,
    effects: [
      {
        id: 'property_protection',
        type: SkillEffectType.PROPERTY_PROTECTION,
        target: SkillTargetType.SELF,
        value: 1,
        duration: 3,
        description: '房产保护持续3回合'
      }
    ],
    maxLevel: 4,
    levelScaling: {
      effectMultiplier: 1.25,
      costReduction: 0.15
    },
    balanceVersion: '1.0.0',
    tags: ['defensive', 'property', 'protection']
  },
  {
    id: 'ox_status_immunity',
    name: '钢筋铁骨',
    description: '获得免疫负面状态效果的能力',
    flavorText: '强壮的牛儿不易受到伤害',
    category: SkillCategory.PASSIVE_CONDITIONAL,
    rarity: SkillRarity.RARE,
    zodiacSign: '牛',
    activationType: SkillActivationType.AUTO_PASSIVE,
    targetType: SkillTargetType.SELF,
    cooldown: 0,
    effects: [
      {
        id: 'debuff_immunity',
        type: SkillEffectType.STATUS_IMMUNITY,
        target: SkillTargetType.SELF,
        value: 1,
        description: '免疫所有负面状态效果',
        conditions: [
          {
            type: SkillConditionType.PLAYER_HEALTH,
            operator: 'gt',
            value: 0.5,
            description: '生命值大于50%时生效'
          }
        ]
      }
    ],
    maxLevel: 3,
    balanceVersion: '1.0.0',
    tags: ['passive', 'immunity', 'defensive']
  }
];

/**
 * 虎年专属技能
 */
export const TIGER_SKILLS: SkillDefinition[] = [
  {
    id: 'tiger_dice_control',
    name: '虎啸山林',
    description: '控制下次投掷的骰子结果',
    flavorText: '威猛的老虎掌控着自己的命运',
    category: SkillCategory.ACTIVE_UTILITY,
    rarity: SkillRarity.EPIC,
    zodiacSign: '虎',
    activationType: SkillActivationType.MANUAL,
    targetType: SkillTargetType.SELF,
    cooldown: 6,
    energyCost: 4,
    effects: [
      {
        id: 'control_dice',
        type: SkillEffectType.DICE_CONTROL,
        target: SkillTargetType.SELF,
        value: 1,
        description: '选择下次骰子结果（1-6）'
      }
    ],
    maxLevel: 3,
    levelScaling: {
      cooldownReduction: 1
    },
    balanceVersion: '1.0.0',
    tags: ['control', 'dice', 'utility']
  },
  {
    id: 'tiger_intimidate',
    name: '威震四方',
    description: '对所有其他玩家施加负面状态',
    flavorText: '老虎的威势让所有人都胆战心惊',
    category: SkillCategory.ACTIVE_OFFENSIVE,
    rarity: SkillRarity.RARE,
    zodiacSign: '虎',
    activationType: SkillActivationType.MANUAL,
    targetType: SkillTargetType.ALL_OTHERS,
    cooldown: 7,
    moneyCost: 1200,
    effects: [
      {
        id: 'intimidation_debuff',
        type: SkillEffectType.STATUS_DEBUFF,
        target: SkillTargetType.ALL_OTHERS,
        value: -0.2,
        duration: 2,
        description: '降低所有敌人20%效率，持续2回合'
      }
    ],
    maxLevel: 4,
    balanceVersion: '1.0.0',
    tags: ['aoe', 'debuff', 'intimidation']
  }
];

// ============================================================================
// 通用技能库
// ============================================================================

/**
 * 通用技能定义
 */
export const UNIVERSAL_SKILLS: SkillDefinition[] = [
  {
    id: 'universal_money_boost',
    name: '财源广进',
    description: '获得额外金钱收入',
    category: SkillCategory.ACTIVE_ECONOMIC,
    rarity: SkillRarity.COMMON,
    activationType: SkillActivationType.MANUAL,
    targetType: SkillTargetType.SELF,
    cooldown: 3,
    effects: [
      {
        id: 'money_gain',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: 1500,
        description: '获得1500金钱'
      }
    ],
    maxLevel: 5,
    levelScaling: {
      effectMultiplier: 1.4
    },
    balanceVersion: '1.0.0',
    tags: ['economic', 'money', 'basic']
  },
  {
    id: 'universal_reroll_dice',
    name: '时来运转',
    description: '重新投掷骰子',
    category: SkillCategory.ACTIVE_UTILITY,
    rarity: SkillRarity.UNCOMMON,
    activationType: SkillActivationType.MANUAL,
    targetType: SkillTargetType.SELF,
    cooldown: 4,
    energyCost: 2,
    effects: [
      {
        id: 'dice_reroll',
        type: SkillEffectType.DICE_REROLL,
        target: SkillTargetType.SELF,
        value: 1,
        description: '重新投掷一次骰子'
      }
    ],
    maxLevel: 3,
    levelScaling: {
      cooldownReduction: 0.5
    },
    balanceVersion: '1.0.0',
    tags: ['dice', 'reroll', 'luck']
  },
  {
    id: 'universal_teleport',
    name: '瞬间移动',
    description: '传送到指定位置',
    category: SkillCategory.ACTIVE_UTILITY,
    rarity: SkillRarity.RARE,
    activationType: SkillActivationType.MANUAL,
    targetType: SkillTargetType.BOARD_AREA,
    cooldown: 8,
    energyCost: 5,
    effects: [
      {
        id: 'position_teleport',
        type: SkillEffectType.POSITION_TELEPORT,
        target: SkillTargetType.SELF,
        value: 1,
        description: '传送到指定位置'
      }
    ],
    maxLevel: 3,
    levelScaling: {
      cooldownReduction: 1,
      costReduction: 0.2
    },
    balanceVersion: '1.0.0',
    tags: ['movement', 'teleport', 'utility']
  }
];

// ============================================================================
// 技能组合定义
// ============================================================================

/**
 * 技能组合规则
 */
export const SKILL_COMBOS = [
  {
    id: 'money_power_combo',
    name: '财富之力',
    description: '金钱相关技能的组合',
    requiredSkills: ['rat_money_steal', 'universal_money_boost'],
    bonusEffects: [
      {
        id: 'money_combo_bonus',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: 500,
        description: '组合奖励500金钱'
      }
    ],
    cooldownPenalty: 1,
    tags: ['money', 'combo']
  },
  {
    id: 'movement_control_combo',
    name: '自在行走',
    description: '移动控制技能组合',
    requiredSkills: ['tiger_dice_control', 'universal_teleport'],
    bonusEffects: [
      {
        id: 'movement_combo_bonus',
        type: SkillEffectType.TURN_EXTRA,
        target: SkillTargetType.SELF,
        value: 1,
        description: '获得额外回合'
      }
    ],
    cooldownPenalty: 2,
    tags: ['movement', 'control', 'combo']
  }
];

// ============================================================================
// 技能平衡配置
// ============================================================================

/**
 * 技能系统平衡配置
 */
export const SKILL_BALANCE_CONFIG: SkillBalanceConfig = {
  globalCooldownMultiplier: 1.0,
  effectPowerMultiplier: 1.0,
  experienceGainRate: 1.0,
  comboRestrictions: [
    {
      maxComboLength: 3,
      cooldownPenalty: 1.5,
      powerReduction: 0.1,
      restrictedCategories: [SkillCategory.ZODIAC_UNIQUE]
    },
    {
      maxComboLength: 2,
      cooldownPenalty: 1.2,
      powerReduction: 0.05,
      restrictedCategories: [SkillCategory.ACTIVE_OFFENSIVE]
    }
  ],
  rarityLimits: {
    [SkillRarity.COMMON]: 5,
    [SkillRarity.UNCOMMON]: 3,
    [SkillRarity.RARE]: 2,
    [SkillRarity.EPIC]: 1,
    [SkillRarity.LEGENDARY]: 1
  }
};

// ============================================================================
// 技能注册表
// ============================================================================

/**
 * 所有技能的注册表
 */
export class SkillRegistry {
  private static instance: SkillRegistry;
  private skills: Map<string, SkillDefinition> = new Map();

  private constructor() {
    this.initializeSkills();
  }

  public static getInstance(): SkillRegistry {
    if (!SkillRegistry.instance) {
      SkillRegistry.instance = new SkillRegistry();
    }
    return SkillRegistry.instance;
  }

  private initializeSkills(): void {
    // 注册生肖专属技能
    [...RAT_SKILLS, ...OX_SKILLS, ...TIGER_SKILLS].forEach(skill => {
      this.skills.set(skill.id, skill);
    });

    // 注册通用技能
    UNIVERSAL_SKILLS.forEach(skill => {
      this.skills.set(skill.id, skill);
    });
  }

  public getSkill(skillId: string): SkillDefinition | undefined {
    return this.skills.get(skillId);
  }

  public getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  public getSkillsByZodiac(zodiac: ZodiacSign): SkillDefinition[] {
    return this.getAllSkills().filter(skill => 
      skill.zodiacSign === zodiac || skill.zodiacSign === undefined
    );
  }

  public getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
    return this.getAllSkills().filter(skill => skill.category === category);
  }

  public getSkillsByRarity(rarity: SkillRarity): SkillDefinition[] {
    return this.getAllSkills().filter(skill => skill.rarity === rarity);
  }

  public registerSkill(skill: SkillDefinition): void {
    this.skills.set(skill.id, skill);
  }

  public unregisterSkill(skillId: string): void {
    this.skills.delete(skillId);
  }
}

// 导出数据
export {
  RAT_SKILLS,
  OX_SKILLS,
  TIGER_SKILLS,
  UNIVERSAL_SKILLS,
  SKILL_COMBOS,
  SKILL_BALANCE_CONFIG
};