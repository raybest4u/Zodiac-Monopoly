/**
 * 玩家相关类型定义
 * 统一Player接口，解决properties类型不一致问题
 */

import { 
  PlayerId, Position, Money, ZodiacSign, 
  PropertyInfo, PropertyOwnership, PlayerStatistics, 
  PlayerSkill, StatusEffect 
} from './core';

// ===== 玩家基础接口 =====

/**
 * 统一的玩家接口
 * 解决了原有properties类型不一致的问题
 */
export interface Player {
  // 基础信息
  readonly id: PlayerId;
  readonly name: string;
  readonly zodiac: ZodiacSign;
  readonly isHuman: boolean;
  readonly avatar?: string;
  
  // 游戏状态
  position: Position;
  money: Money;
  
  // 地产系统 - 使用统一的地产信息类型
  properties: PropertyOwnership[];  // 拥有的地产列表
  
  // 物品和技能
  items: GameItem[];
  skills: PlayerSkill[];
  statusEffects: StatusEffect[];
  
  // 统计数据
  statistics: PlayerStatistics;
  
  // 游戏状态
  isInJail: boolean;
  jailTurns: number;
  consecutiveDoubles: number;
  
  // 临时状态
  hasRolledThisTurn: boolean;
  hasMovedThisTurn: boolean;
  canUseSkills: boolean;
  
  // AI相关（仅AI玩家）
  aiPersonality?: AIPersonality;
  aiStrategy?: AIStrategy;
}

// ===== 游戏物品 =====

export interface GameItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: ItemType;
  readonly rarity: ItemRarity;
  readonly effect: ItemEffect;
  usageCount: number;
  maxUsage?: number;
}

export type ItemType = 
  | 'consumable'    // 消耗品
  | 'equipment'     // 装备
  | 'special'       // 特殊物品
  | 'card';         // 卡牌

export type ItemRarity = 
  | 'common'        // 普通
  | 'uncommon'      // 不常见
  | 'rare'          // 稀有
  | 'epic'          // 史诗
  | 'legendary';    // 传说

export interface ItemEffect {
  readonly type: 'immediate' | 'passive' | 'active';
  readonly target: 'self' | 'others' | 'all' | 'property';
  readonly value: number;
  readonly duration?: number;
}

// ===== AI相关类型 =====

export interface AIPersonality {
  readonly aggressiveness: number;     // 攻击性 (0-1)
  readonly riskTolerance: number;      // 风险承受度 (0-1)
  readonly cooperativeness: number;    // 合作性 (0-1)
  readonly adaptability: number;       // 适应性 (0-1)
  readonly patience: number;           // 耐心 (0-1)
}

export interface AIStrategy {
  readonly name: string;
  readonly description: string;
  readonly propertyPreference: PropertyPreference;
  readonly tradePolicy: TradePolicy;
  readonly skillUsagePolicy: SkillUsagePolicy;
}

export interface PropertyPreference {
  readonly preferredTypes: string[];   // 偏好的地产类型
  readonly maxInvestmentRatio: number; // 最大投资比例
  readonly upgradeThreshold: number;   // 升级阈值
}

export interface TradePolicy {
  readonly willingness: number;        // 交易意愿 (0-1)
  readonly profitMargin: number;       // 利润边际
  readonly trustLevel: number;         // 信任度 (0-1)
}

export interface SkillUsagePolicy {
  readonly aggressiveSkills: number;   // 攻击性技能使用频率
  readonly defensiveSkills: number;    // 防御性技能使用频率
  readonly economicSkills: number;     // 经济性技能使用频率
}

// ===== 玩家操作历史 =====

export interface PlayerActionHistory {
  readonly playerId: PlayerId;
  readonly actions: PlayerActionRecord[];
  readonly sessionStats: SessionStatistics;
}

export interface PlayerActionRecord {
  readonly actionType: string;
  readonly timestamp: number;
  readonly round: number;
  readonly success: boolean;
  readonly result?: any;
  readonly context?: Record<string, any>;
}

export interface SessionStatistics {
  readonly startTime: number;
  readonly totalActions: number;
  readonly successfulActions: number;
  readonly averageDecisionTime: number;
  readonly preferredActions: string[];
}

// ===== 玩家验证和工具函数 =====

/**
 * 验证玩家数据的完整性
 */
export function validatePlayer(player: Player): boolean {
  if (!player.id || !player.name) return false;
  if (player.money < 0) return false;
  if (player.position < 0) return false;
  if (!Array.isArray(player.properties)) return false;
  if (!Array.isArray(player.skills)) return false;
  if (!Array.isArray(player.statusEffects)) return false;
  if (!Array.isArray(player.items)) return false;
  
  return true;
}

/**
 * 创建新玩家
 */
export function createPlayer(config: CreatePlayerConfig): Player {
  return {
    id: config.id,
    name: config.name,
    zodiac: config.zodiac,
    isHuman: config.isHuman,
    avatar: config.avatar,
    
    position: 0,
    money: config.startingMoney || 1500,
    
    properties: [],
    items: [],
    skills: config.skills || [],
    statusEffects: [],
    
    statistics: {
      turnsPlayed: 0,
      moneyEarned: 0,
      moneySpent: 0,
      propertiesBought: 0,
      propertiesSold: 0,
      rentPaid: 0,
      rentReceived: 0,
      skillsUsed: 0,
      eventsTriggered: 0
    },
    
    isInJail: false,
    jailTurns: 0,
    consecutiveDoubles: 0,
    
    hasRolledThisTurn: false,
    hasMovedThisTurn: false,
    canUseSkills: true,
    
    aiPersonality: config.aiPersonality,
    aiStrategy: config.aiStrategy
  };
}

export interface CreatePlayerConfig {
  readonly id: PlayerId;
  readonly name: string;
  readonly zodiac: ZodiacSign;
  readonly isHuman: boolean;
  readonly avatar?: string;
  readonly startingMoney?: Money;
  readonly skills?: PlayerSkill[];
  readonly aiPersonality?: AIPersonality;
  readonly aiStrategy?: AIStrategy;
}

// ===== 玩家工具函数 =====

/**
 * 获取玩家拥有的地产数量
 */
export function getPlayerPropertyCount(player: Player): number {
  return player.properties.length;
}

/**
 * 获取玩家总资产（现金 + 地产价值）
 */
export function getPlayerTotalAssets(player: Player): Money {
  const propertyValue = player.properties.reduce((sum, ownership) => {
    return sum + ownership.purchasePrice; // 简化计算，实际应该使用当前市值
  }, 0);
  
  return player.money + propertyValue;
}

/**
 * 检查玩家是否拥有指定位置的地产
 */
export function playerOwnsProperty(player: Player, position: Position): boolean {
  return player.properties.some(ownership => ownership.propertyPosition === position);
}

/**
 * 获取玩家在指定位置的地产所有权信息
 */
export function getPlayerPropertyOwnership(player: Player, position: Position): PropertyOwnership | null {
  return player.properties.find(ownership => ownership.propertyPosition === position) || null;
}

/**
 * 检查玩家是否可以支付指定金额
 */
export function canPlayerAfford(player: Player, amount: Money): boolean {
  return player.money >= amount;
}

/**
 * 更新玩家统计数据
 */
export function updatePlayerStatistics(player: Player, update: Partial<PlayerStatistics>): void {
  Object.assign(player.statistics, update);
}