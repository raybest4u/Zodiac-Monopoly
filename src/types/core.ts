/**
 * 核心游戏类型定义 - 统一所有类型定义的入口
 * 解决类型不一致和冲突问题
 */

// ===== 基础类型 =====

/** 玩家ID */
export type PlayerId = string;

/** 位置坐标 */
export type Position = number;

/** 金钱数量 */
export type Money = number;

/** 游戏回合数 */
export type Round = number;

// ===== 游戏阶段类型 =====

/**
 * 游戏回合阶段 - 用于控制玩家操作流程
 * 这是游戏引擎的核心状态机
 */
export type GameTurnPhase = 
  | 'roll_dice'        // 掷骰子阶段
  | 'move_player'      // 移动玩家阶段
  | 'process_cell'     // 处理格子事件阶段
  | 'property_action'  // 地产操作阶段
  | 'pay_rent'         // 支付租金阶段
  | 'handle_event'     // 处理事件阶段
  | 'use_skill'        // 使用技能阶段
  | 'end_turn'         // 结束回合阶段
  | 'check_win';       // 检查胜利条件阶段

/**
 * 游戏状态阶段 - 用于整体游戏状态管理
 */
export type GameStatePhase = 
  | 'waiting'          // 等待开始
  | 'initializing'     // 初始化中
  | 'playing'          // 游戏进行中
  | 'paused'           // 暂停
  | 'game_over'        // 游戏结束
  | 'error';           // 错误状态

/**
 * 游戏进程阶段 - 用于游戏策略分析
 */
export type GameProgressPhase = 
  | 'early_game'       // 早期游戏
  | 'expansion'        // 扩张期
  | 'mid_game'         // 中期游戏
  | 'late_game'        // 后期游戏
  | 'endgame';         // 结束期

// ===== 地产相关类型 =====

/** 地产信息 */
export interface PropertyInfo {
  readonly position: Position;
  readonly basePrice: Money;
  level: number;
  rent: Money;
  mortgage?: Money;
  isMortgaged?: boolean;
}

/** 地产所有权 */
export interface PropertyOwnership {
  readonly propertyPosition: Position;
  readonly ownerId: PlayerId;
  readonly purchasePrice: Money;
  readonly purchaseRound: Round;
}

// ===== 玩家相关类型 =====

/** 玩家统计数据 */
export interface PlayerStatistics {
  readonly turnsPlayed: number;
  readonly moneyEarned: Money;
  readonly moneySpent: Money;
  readonly propertiesBought: number;
  readonly propertiesSold: number;
  readonly rentPaid: Money;
  readonly rentReceived: Money;
  readonly skillsUsed: number;
  readonly eventsTriggered: number;
}

/** 玩家技能 */
export interface PlayerSkill {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cost?: Money;
  readonly cooldown?: number;
  readonly usageCount: number;
  readonly maxUsage?: number;
  lastUsed?: number;
}

/** 玩家状态效果 */
export interface StatusEffect {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly duration: number;
  readonly effect: EffectData;
  readonly startRound: Round;
}

/** 效果数据 */
export interface EffectData {
  readonly type: 'money' | 'movement' | 'property' | 'skill' | 'dice';
  readonly value: number;
  readonly target: 'self' | 'all' | 'others';
}

// ===== 游戏动作类型 =====

/**
 * 游戏动作类型 - 完整的玩家操作集合
 */
export type ActionType = 
  // 基础动作
  | 'roll_dice'        // 掷骰子
  | 'move_player'      // 移动玩家
  | 'end_turn'         // 结束回合
  
  // 地产动作
  | 'buy_property'     // 购买地产
  | 'sell_property'    // 出售地产
  | 'upgrade_property' // 升级地产
  | 'mortgage_property'// 抵押地产
  | 'unmortgage_property' // 解除抵押
  | 'skip_purchase'    // 跳过购买
  | 'skip_upgrade'     // 跳过升级
  
  // 交易动作
  | 'pay_rent'         // 支付租金
  | 'trade_request'    // 交易请求
  | 'trade_accept'     // 接受交易
  | 'trade_reject'     // 拒绝交易
  
  // 技能和事件动作
  | 'use_skill'        // 使用技能
  | 'event_choice'     // 事件选择
  | 'skill_target'     // 技能目标选择
  
  // 特殊动作
  | 'declare_bankruptcy' // 宣布破产
  | 'pass'             // 跳过
  | 'surrender';       // 投降

// ===== 游戏事件类型 =====

export type EventType = 
  | 'chance_card'      // 机会卡
  | 'community_chest'  // 公共资金
  | 'property_event'   // 地产事件
  | 'seasonal_event'   // 季节事件
  | 'zodiac_event'     // 生肖事件
  | 'special_event'    // 特殊事件
  | 'system_event';    // 系统事件

// ===== 格子类型 =====

export type CellType = 
  | 'start'            // 起点
  | 'property'         // 地产
  | 'chance'           // 机会
  | 'community'        // 公共资金
  | 'tax'              // 税收
  | 'jail'             // 监狱
  | 'parking'          // 免费停车
  | 'go_to_jail'       // 进入监狱
  | 'utility'          // 公用事业
  | 'railroad'         // 铁路
  | 'special';         // 特殊格子

// ===== 生肖相关 =====

export type ZodiacSign = 
  | '鼠' | '牛' | '虎' | '兔' | '龙' | '蛇'
  | '马' | '羊' | '猴' | '鸡' | '狗' | '猪';

// ===== 季节和天气 =====

export type Season = '春' | '夏' | '秋' | '冬';
export type Weather = '晴' | '雨' | '雪' | '风' | '雾';

// ===== 游戏模式和难度 =====

export type GameMode = 'classic' | 'zodiac' | 'custom' | 'tutorial';
export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

// ===== 胜利条件 =====

export type WinCondition = 
  | 'monopoly'         // 垄断胜利
  | 'elimination'      // 淘汰胜利
  | 'time_limit'       // 时间限制
  | 'money_target'     // 金钱目标
  | 'property_count';  // 地产数量

// ===== 错误类型 =====

export type GameErrorType = 
  | 'invalid_action'   // 无效操作
  | 'insufficient_funds' // 资金不足
  | 'invalid_state'    // 无效状态
  | 'network_error'    // 网络错误
  | 'validation_error' // 验证错误
  | 'system_error';    // 系统错误

/** 游戏错误信息 */
export interface GameError {
  readonly type: GameErrorType;
  readonly message: string;
  readonly code?: string;
  readonly timestamp: number;
  readonly context?: Record<string, any>;
}

// ===== 导出主要类型别名 =====

/** 主要游戏阶段类型（用于游戏引擎） */
export type GamePhase = GameTurnPhase;

/** 游戏状态类型（用于整体状态管理） */
export type GameStatus = GameStatePhase;