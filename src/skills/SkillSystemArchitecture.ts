/**
 * 技能系统核心架构
 * 第二阶段 Day 1: 技能系统架构
 * 
 * 建立技能系统的核心架构和数据结构，包括：
 * - 技能定义系统
 * - 技能分类体系
 * - 技能效果框架
 * - 技能激活机制
 * - 技能冷却系统
 * - 技能升级体系
 */

import type { 
  ZodiacSign, 
  Player, 
  GameState,
  ActionResult,
  EffectType,
  EffectTarget,
  Season,
  Weather
} from '../types/game';

// ============================================================================
// 核心技能数据结构
// ============================================================================

/**
 * 技能分类枚举
 */
export enum SkillCategory {
  // 主动技能
  ACTIVE_OFFENSIVE = 'active_offensive',     // 主动攻击型
  ACTIVE_DEFENSIVE = 'active_defensive',     // 主动防御型
  ACTIVE_UTILITY = 'active_utility',         // 主动辅助型
  ACTIVE_ECONOMIC = 'active_economic',       // 主动经济型
  
  // 被动技能
  PASSIVE_PERMANENT = 'passive_permanent',   // 永久被动
  PASSIVE_CONDITIONAL = 'passive_conditional', // 条件被动
  
  // 触发技能
  TRIGGERED_EVENT = 'triggered_event',       // 事件触发
  TRIGGERED_SITUATION = 'triggered_situation', // 情况触发
  
  // 特殊技能
  ZODIAC_UNIQUE = 'zodiac_unique',          // 生肖专属
  COMBO_SKILL = 'combo_skill'               // 组合技能
}

/**
 * 技能稀有度
 */
export enum SkillRarity {
  COMMON = 'common',       // 普通 - 基础技能
  UNCOMMON = 'uncommon',   // 不常见 - 进阶技能
  RARE = 'rare',           // 稀有 - 高级技能
  EPIC = 'epic',           // 史诗 - 顶级技能
  LEGENDARY = 'legendary'  // 传说 - 超级技能
}

/**
 * 技能激活方式
 */
export enum SkillActivationType {
  MANUAL = 'manual',           // 手动激活
  AUTO_PASSIVE = 'auto_passive', // 自动被动
  TRIGGER_BASED = 'trigger_based', // 基于触发条件
  COMBO_CHAIN = 'combo_chain'   // 连锁组合
}

/**
 * 技能目标类型
 */
export enum SkillTargetType {
  SELF = 'self',                    // 自己
  SINGLE_PLAYER = 'single_player',  // 单个其他玩家
  ALL_PLAYERS = 'all_players',      // 所有玩家
  ALL_OTHERS = 'all_others',        // 所有其他玩家
  RANDOM_PLAYER = 'random_player',  // 随机玩家
  BOARD_AREA = 'board_area',        // 棋盘区域
  GLOBAL = 'global'                 // 全局效果
}

// ============================================================================
// 技能效果系统
// ============================================================================

/**
 * 技能效果接口
 */
export interface SkillEffect {
  id: string;
  type: SkillEffectType;
  target: SkillTargetType;
  value: number | string;
  duration?: number;        // 持续回合数，undefined表示瞬时效果
  stackable?: boolean;      // 是否可叠加
  conditions?: SkillCondition[]; // 激活条件
  description: string;
  
  // 效果修饰符
  modifiers?: {
    scaling?: number;       // 等级缩放
    randomness?: number;    // 随机性因子
    criticalChance?: number; // 暴击概率
    resistance?: number;    // 抗性穿透
  };
}

/**
 * 技能效果类型
 */
export enum SkillEffectType {
  // 资源效果
  MONEY_GAIN = 'money_gain',           // 获得金钱
  MONEY_LOSS = 'money_loss',           // 失去金钱
  MONEY_STEAL = 'money_steal',         // 偷取金钱
  MONEY_TRANSFER = 'money_transfer',   // 转移金钱
  
  // 移动效果
  POSITION_MOVE = 'position_move',     // 位置移动
  POSITION_TELEPORT = 'position_teleport', // 瞬移
  POSITION_SWAP = 'position_swap',     // 位置交换
  POSITION_LOCK = 'position_lock',     // 位置锁定
  
  // 房产效果
  PROPERTY_DISCOUNT = 'property_discount', // 房产折扣
  PROPERTY_BONUS = 'property_bonus',   // 房产奖励
  PROPERTY_PROTECTION = 'property_protection', // 房产保护
  PROPERTY_CONFISCATE = 'property_confiscate', // 房产没收
  
  // 骰子效果
  DICE_REROLL = 'dice_reroll',         // 重新投掷
  DICE_MODIFIER = 'dice_modifier',     // 骰子修正
  DICE_CONTROL = 'dice_control',       // 骰子控制
  DICE_DOUBLE = 'dice_double',         // 双重投掷
  
  // 状态效果
  STATUS_BUFF = 'status_buff',         // 增益状态
  STATUS_DEBUFF = 'status_debuff',     // 减益状态
  STATUS_IMMUNITY = 'status_immunity', // 免疫状态
  STATUS_CLEANSE = 'status_cleanse',   // 清除状态
  
  // 技能效果
  SKILL_COOLDOWN_REDUCE = 'skill_cooldown_reduce', // 冷却减少
  SKILL_POWER_BOOST = 'skill_power_boost',         // 技能威力提升
  SKILL_DISABLE = 'skill_disable',                 // 技能禁用
  SKILL_COPY = 'skill_copy',                       // 技能复制
  
  // 特殊效果
  TURN_EXTRA = 'turn_extra',           // 额外回合
  TURN_SKIP = 'turn_skip',             // 跳过回合
  EVENT_TRIGGER = 'event_trigger',     // 触发事件
  RULE_CHANGE = 'rule_change'          // 规则改变
}

/**
 * 技能条件接口
 */
export interface SkillCondition {
  type: SkillConditionType;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
  value: any;
  description: string;
}

/**
 * 技能条件类型
 */
export enum SkillConditionType {
  // 玩家状态条件
  PLAYER_MONEY = 'player_money',
  PLAYER_POSITION = 'player_position',
  PLAYER_PROPERTIES = 'player_properties',
  PLAYER_HEALTH = 'player_health',
  
  // 游戏状态条件
  GAME_ROUND = 'game_round',
  GAME_SEASON = 'game_season',
  GAME_WEATHER = 'game_weather',
  GAME_PHASE = 'game_phase',
  
  // 环境条件
  BOARD_POSITION = 'board_position',
  MARKET_TREND = 'market_trend',
  EVENT_ACTIVE = 'event_active',
  
  // 生肖条件
  ZODIAC_COMPATIBILITY = 'zodiac_compatibility',
  ZODIAC_SEASON_MATCH = 'zodiac_season_match',
  
  // 技能条件
  SKILL_LEVEL = 'skill_level',
  SKILL_USAGE_COUNT = 'skill_usage_count',
  COMBO_ACTIVE = 'combo_active'
}

// ============================================================================
// 技能定义系统
// ============================================================================

/**
 * 技能定义接口
 */
export interface SkillDefinition {
  // 基本信息
  id: string;
  name: string;
  description: string;
  flavorText?: string;        // 风味描述
  
  // 分类信息
  category: SkillCategory;
  rarity: SkillRarity;
  zodiacSign?: ZodiacSign;    // 关联生肖，undefined表示通用技能
  
  // 激活信息
  activationType: SkillActivationType;
  targetType: SkillTargetType;
  maxTargets?: number;        // 最大目标数量
  
  // 冷却和消耗
  cooldown: number;           // 冷却回合数
  energyCost?: number;        // 能量消耗
  moneyCost?: number;         // 金钱消耗
  
  // 技能效果
  effects: SkillEffect[];
  
  // 学习条件
  learnRequirements?: SkillRequirement[];
  
  // 升级系统
  maxLevel: number;
  levelScaling?: SkillLevelScaling;
  
  // 组合技能
  comboSkills?: string[];     // 可组合的技能ID
  comboEffects?: SkillEffect[]; // 组合额外效果
  
  // 视觉效果
  iconUrl?: string;
  animationId?: string;
  soundEffectId?: string;
  
  // 平衡性
  balanceVersion: string;
  tags: string[];             // 标签，用于搜索和分类
}

/**
 * 技能需求接口
 */
export interface SkillRequirement {
  type: SkillRequirementType;
  value: any;
  description: string;
}

/**
 * 技能需求类型
 */
export enum SkillRequirementType {
  LEVEL = 'level',                    // 等级需求
  ZODIAC = 'zodiac',                  // 生肖需求
  MONEY = 'money',                    // 金钱需求
  PROPERTIES = 'properties',          // 房产需求
  SKILL_PREREQUISITE = 'skill_prerequisite', // 前置技能
  GAME_PROGRESS = 'game_progress',    // 游戏进度
  ACHIEVEMENT = 'achievement'         // 成就需求
}

/**
 * 技能等级缩放接口
 */
export interface SkillLevelScaling {
  effectMultiplier?: number;    // 效果倍数
  cooldownReduction?: number;   // 冷却减少
  costReduction?: number;       // 消耗减少
  additionalEffects?: SkillEffect[]; // 额外效果
  customScaling?: (level: number) => Partial<SkillEffect>; // 自定义缩放
}

// ============================================================================
// 技能实例系统
// ============================================================================

/**
 * 玩家技能实例接口
 */
export interface PlayerSkillInstance {
  // 基本信息
  definitionId: string;       // 对应的技能定义ID
  playerId: string;           // 拥有者ID
  
  // 当前状态
  level: number;              // 当前等级
  experience: number;         // 当前经验值
  lastUsedTurn?: number;      // 上次使用回合
  usageCount: number;         // 使用次数
  
  // 增强信息
  enhancements?: SkillEnhancement[];
  
  // 状态信息
  isActive: boolean;          // 是否激活（被动技能用）
  isCooldown: boolean;        // 是否在冷却中
  remainingCooldown: number;  // 剩余冷却回合
  
  // 组合状态
  comboChain?: string[];      // 当前组合链
  comboMultiplier?: number;   // 组合倍数
  
  // 统计信息
  statistics: SkillStatistics;
}

/**
 * 技能增强接口
 */
export interface SkillEnhancement {
  id: string;
  name: string;
  type: SkillEnhancementType;
  modifier: number;
  description: string;
  source: string;             // 增强来源
}

/**
 * 技能增强类型
 */
export enum SkillEnhancementType {
  EFFECT_POWER = 'effect_power',     // 效果威力
  COOLDOWN_REDUCTION = 'cooldown_reduction', // 冷却减少
  COST_REDUCTION = 'cost_reduction', // 消耗减少
  RANGE_EXPANSION = 'range_expansion', // 范围扩展
  ADDITIONAL_EFFECT = 'additional_effect', // 额外效果
  CRITICAL_CHANCE = 'critical_chance' // 暴击概率
}

/**
 * 技能统计接口
 */
export interface SkillStatistics {
  timesUsed: number;          // 使用次数
  totalDamage: number;        // 总伤害/效果
  totalHealing: number;       // 总治疗/增益
  criticalHits: number;       // 暴击次数
  targetHits: number;         // 命中目标数
  comboTriggers: number;      // 组合触发次数
  experienceGained: number;   // 获得经验
}

// ============================================================================
// 技能系统核心接口
// ============================================================================

/**
 * 技能系统核心接口
 */
export interface ISkillSystem {
  // 技能定义管理
  registerSkillDefinition(definition: SkillDefinition): void;
  getSkillDefinition(skillId: string): SkillDefinition | null;
  getAllSkillDefinitions(): SkillDefinition[];
  getSkillsByCategory(category: SkillCategory): SkillDefinition[];
  getSkillsByZodiac(zodiac: ZodiacSign): SkillDefinition[];
  
  // 玩家技能管理
  learnSkill(playerId: string, skillId: string): boolean;
  forgetSkill(playerId: string, skillId: string): boolean;
  getPlayerSkills(playerId: string): PlayerSkillInstance[];
  getAvailableSkills(playerId: string, gameState: GameState): PlayerSkillInstance[];
  
  // 技能使用
  canUseSkill(playerId: string, skillId: string, gameState: GameState): boolean;
  useSkill(playerId: string, skillId: string, targets: string[], gameState: GameState): Promise<ActionResult>;
  
  // 技能效果处理
  applySkillEffects(effects: SkillEffect[], gameState: GameState): ActionResult;
  calculateSkillDamage(effect: SkillEffect, level: number, enhancements: SkillEnhancement[]): number;
  
  // 冷却系统
  updateCooldowns(playerId: string): void;
  reduceCooldown(playerId: string, skillId: string, amount: number): void;
  
  // 升级系统
  gainExperience(playerId: string, skillId: string, amount: number): boolean;
  levelUpSkill(playerId: string, skillId: string): boolean;
  
  // 组合技能
  checkComboAvailability(playerId: string, skillIds: string[]): boolean;
  executeComboSkill(playerId: string, skillIds: string[], gameState: GameState): Promise<ActionResult>;
  
  // 技能增强
  addSkillEnhancement(playerId: string, skillId: string, enhancement: SkillEnhancement): void;
  removeSkillEnhancement(playerId: string, skillId: string, enhancementId: string): void;
  
  // 数据持久化
  saveSkillData(playerId: string): any;
  loadSkillData(playerId: string, data: any): void;
}

// ============================================================================
// 技能系统事件
// ============================================================================

/**
 * 技能系统事件类型
 */
export enum SkillSystemEventType {
  SKILL_LEARNED = 'skill_learned',
  SKILL_USED = 'skill_used',
  SKILL_LEVELED_UP = 'skill_leveled_up',
  SKILL_ENHANCED = 'skill_enhanced',
  COMBO_EXECUTED = 'combo_executed',
  COOLDOWN_FINISHED = 'cooldown_finished'
}

/**
 * 技能系统事件接口
 */
export interface SkillSystemEvent {
  type: SkillSystemEventType;
  playerId: string;
  skillId: string;
  timestamp: number;
  data?: any;
}

// ============================================================================
// 生肖专属技能架构
// ============================================================================

/**
 * 生肖技能特性接口
 */
export interface ZodiacSkillTrait {
  zodiac: ZodiacSign;
  seasonBonus: Season;        // 对应季节加成
  compatibleZodiacs: ZodiacSign[]; // 兼容生肖
  conflictZodiacs: ZodiacSign[];   // 冲突生肖
  uniqueEffectTypes: SkillEffectType[]; // 专属效果类型
  passiveBonus: PassiveBonus; // 被动加成
}

/**
 * 被动加成接口
 */
export interface PassiveBonus {
  moneyMultiplier?: number;
  propertyDiscount?: number;
  skillCooldownReduction?: number;
  diceModifier?: number;
  immunities?: SkillEffectType[];
}

// ============================================================================
// 技能平衡系统
// ============================================================================

/**
 * 技能平衡配置接口
 */
export interface SkillBalanceConfig {
  globalCooldownMultiplier: number;
  effectPowerMultiplier: number;
  experienceGainRate: number;
  comboRestrictions: ComboRestriction[];
  rarityLimits: Record<SkillRarity, number>; // 每个稀有度的技能数量限制
}

/**
 * 组合限制接口
 */
export interface ComboRestriction {
  maxComboLength: number;
  cooldownPenalty: number;
  powerReduction: number;
  restrictedCategories: SkillCategory[];
}

/**
 * 技能使用统计接口
 */
export interface SkillUsageStats {
  skillId: string;
  usageCount: number;
  successRate: number;
  averageEffectiveness: number;
  playerUsageDistribution: Record<string, number>;
  winRateImpact: number;
}

export default {
  SkillCategory,
  SkillRarity,
  SkillActivationType,
  SkillTargetType,
  SkillEffectType,
  SkillConditionType,
  SkillRequirementType,
  SkillEnhancementType,
  SkillSystemEventType
};