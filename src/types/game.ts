// 十二生肖类型
export type ZodiacSign = 
  | '鼠' | '牛' | '虎' | '兔' | '龙' | '蛇'
  | '马' | '羊' | '猴' | '鸡' | '狗' | '猪';

// 游戏状态
export type GameStatus = 
  | 'initializing' | 'waiting' | 'playing' 
  | 'paused' | 'ended' | 'error';

// 游戏阶段
export type GamePhase = 
  | 'roll_dice' | 'move_player' | 'process_cell'
  | 'handle_event' | 'end_turn' | 'check_win';

// 格子类型 - 使用统一定义
export type CellType = 
  | 'start'           // 起点
  | 'property'        // 地产
  | 'chance'          // 机会
  | 'community'       // 公共资金
  | 'tax'             // 税收
  | 'jail'            // 监狱
  | 'parking'         // 免费停车
  | 'go_to_jail'      // 进监狱
  | 'utility'         // 公用事业
  | 'railroad'        // 铁路/车站
  | 'special'         // 其他特殊格子
  | 'portal'          // 传送门
  | 'zodiac_temple';  // 生肖殿

// 动作类型
export type ActionType = 
  | 'roll_dice' | 'move_player' | 'buy_property' 
  | 'sell_property' | 'upgrade_property' | 'use_skill'
  | 'event_choice' | 'trade_request' | 'pass';

// 事件类型
export type EventType = 
  | 'chance_card' | 'community_chest' | 'property_event'
  | 'seasonal_event' | 'zodiac_event' | 'special_event';

// 事件触发方式
export type EventTrigger = 
  | 'land_on_cell' | 'pass_cell' | 'dice_roll'
  | 'turn_start' | 'turn_end' | 'seasonal_change';

// 事件稀有度
export type EventRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// 季节
export type Season = '春' | '夏' | '秋' | '冬';

// 天气
export type Weather = '晴' | '雨' | '雪' | '风' | '雾';

// 玩家接口
export interface Player {
  id: string;
  name: string;
  zodiac: ZodiacSign;
  isHuman: boolean;
  avatar?: string;
  
  // 游戏状态
  position: number;
  money: number;
  properties: Array<{position: number; price: number; level: number; rent: number}> | string[];
  items: GameItem[];
  
  // 技能和状态
  skills: PlayerSkill[];
  statusEffects: StatusEffect[];
  
  // 统计数据
  statistics: PlayerStatistics;
}

// 游戏状态接口
export interface GameState {
  // 基础信息
  gameId: string;
  status: GameStatus;
  mode: GameMode;
  
  // 玩家信息
  players: Player[];
  currentPlayerIndex: number;
  
  // 游戏进度
  round: number;
  phase: GamePhase;
  turn: number;
  
  // 棋盘状态
  board: BoardCell[];
  
  // 游戏事件
  currentEvent?: GameEvent;
  eventHistory: GameEvent[];
  
  // 市场状态
  season: Season;
  weather: Weather;
  marketTrends: MarketTrends;
  
  // 时间信息
  startTime: number;
  elapsedTime: number;
  lastUpdateTime: number;
  lastSaveTime?: number;
  
  // 最后掷骰结果
  lastDiceResult?: DiceResult;
}

// 棋盘格子接口
export interface BoardCell {
  id: string;
  position: number;
  type: CellType;
  name: string;
  zodiac?: ZodiacSign;
  
  // 属性信息 (如果是地产)
  price?: number;
  rent?: number;
  level?: number;
  ownerId?: string;
  
  // 视觉信息
  color: string;
  description: string;
  imageUrl?: string;
}

// 游戏事件接口
export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  
  // 触发信息
  playerId?: string;
  triggeredBy: EventTrigger;
  
  // 选择和效果
  choices?: EventChoice[];
  autoResolve?: boolean;
  timeLimit?: number;
  
  // 元数据
  zodiacRelated?: boolean;
  rarity: EventRarity;
  tags: string[];
  
  timestamp: number;
}

// 玩家动作接口
export interface PlayerAction {
  type: ActionType;
  playerId: string;
  data: Record<string, any>;
  timestamp: number;
  
  // 验证信息
  isValid?: boolean;
  reason?: string;
  
  // 执行结果
  result?: ActionResult;
}

// 骰子结果接口
export interface DiceResult {
  dice1: number;
  dice2: number;
  total: number;
  isDouble: boolean;
  timestamp: number;
}

// 游戏道具接口
export interface GameItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  rarity: EventRarity;
  effects: ItemEffect[];
  usageCount?: number;
  maxUsage?: number;
}

// 玩家技能接口
export interface PlayerSkill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  zodiac: ZodiacSign;
  cooldown: number;
  lastUsed?: number;
  level: number;
  maxLevel: number;
  effects: SkillEffect[];
  
  // 技能条件
  requirements?: SkillRequirement[];
  
  // 技能升级
  experiencePoints: number;
  nextLevelExp: number;
  
  // 视觉和音效
  iconUrl?: string;
  animationName?: string;
  soundEffect?: string;
  
  // 技能标签
  tags: SkillTag[];
  
  // 技能增强
  enhancements?: SkillEnhancement[];
}

// 状态效果接口
export interface StatusEffect {
  id: string;
  name: string;
  type: EffectType;
  description: string;
  duration: number;
  remainingTurns: number;
  value: number;
  stackable: boolean;
  source: string;
}

// 玩家统计接口
export interface PlayerStatistics {
  turnsPlayed: number;
  moneyEarned: number;
  moneySpent: number;
  propertiesBought: number;
  propertiesSold: number;
  skillsUsed: number;
  eventsTriggered: number;
  rentCollected: number;
  rentPaid: number;
}

// 市场趋势接口
export interface MarketTrends {
  propertyPriceMultiplier: number;
  rentMultiplier: number;
  salaryBonus: number;
  taxRate: number;
  skillCooldownModifier: number;
}

// 事件选择接口
export interface EventChoice {
  id: string;
  text: string;
  description?: string;
  effects: EventEffect[];
  requirements?: EventRequirement[];
  probability?: number;
}

// 事件效果接口
export interface EventEffect {
  type: EffectType;
  target: EffectTarget;
  value: number;
  duration?: number;
  description: string;
}

// 事件需求接口
export interface EventRequirement {
  type: RequirementType;
  value: number;
  comparison: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
}

// 动作结果接口
export interface ActionResult {
  success: boolean;
  message: string;
  effects: GameEffect[];
  newGameState?: Partial<GameState>;
}

// 游戏效果接口
export interface GameEffect {
  type: EffectType;
  target: EffectTarget;
  value: number;
  description: string;
}

// 辅助类型定义
export type GameMode = 'classic' | 'quick' | 'custom';
export type ItemType = 'consumable' | 'permanent' | 'equipment';
export type SkillType = 'active' | 'passive' | 'triggered';
export type EffectType = 'money' | 'position' | 'property' | 'status' | 'skill_cooldown' | 'dice_modifier';
export type EffectTarget = 'self' | 'all_players' | 'other_players' | 'random_player' | 'board';
export type RequirementType = 'money' | 'property_count' | 'position' | 'zodiac' | 'skill_level';

// 道具效果接口
export interface ItemEffect {
  type: EffectType;
  value: number;
  duration?: number;
  trigger: 'use' | 'turn_start' | 'turn_end' | 'on_event';
}

// 技能效果接口
export interface SkillEffect {
  type: EffectType;
  value: number;
  duration?: number;
  target: EffectTarget;
  scaling?: SkillScaling;
}

// 技能升级接口
export interface SkillScaling {
  type: 'linear' | 'exponential' | 'logarithmic';
  baseValue: number;
  scaleFactor: number;
}

// 技能需求接口
export interface SkillRequirement {
  type: 'level' | 'money' | 'property_count' | 'zodiac_compatibility' | 'season' | 'weather';
  value: number | string;
  comparison?: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  description: string;
}

// 技能标签
export type SkillTag = 
  | 'offensive' | 'defensive' | 'economic' | 'social'
  | 'passive' | 'instant' | 'channeled' | 'toggle'
  | 'single_target' | 'area_effect' | 'self_buff'
  | 'zodiac_synergy' | 'seasonal' | 'weather_dependent';

// 技能增强接口
export interface SkillEnhancement {
  id: string;
  name: string;
  description: string;
  type: 'damage' | 'range' | 'cooldown' | 'cost' | 'duration' | 'probability';
  value: number;
  unlockLevel: number;
  prerequisites?: string[];
}

// 生肖兼容性接口
export interface ZodiacCompatibility {
  zodiac: ZodiacSign;
  compatibility: number; // -1 到 1，-1为冲突，1为完全兼容
  relationship: ZodiacRelationship;
  bonuses?: ZodiacBonus[];
  penalties?: ZodiacPenalty[];
}

// 生肖关系类型
export type ZodiacRelationship = 
  | 'conflict' | 'neutral' | 'friendly' | 'compatible' | 'perfect_match';

// 生肖奖励接口
export interface ZodiacBonus {
  type: 'money' | 'skill_cooldown' | 'dice_modifier' | 'property_discount' | 'rent_bonus';
  value: number;
  description: string;
  conditions?: string[];
}

// 生肖惩罚接口
export interface ZodiacPenalty {
  type: 'money_loss' | 'skill_penalty' | 'dice_penalty' | 'property_tax' | 'rent_penalty';
  value: number;
  description: string;
  conditions?: string[];
}

// 交易接口
export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  timestamp: number;
  
  // 交易内容
  offeredItems: TradeItem[];
  requestedItems: TradeItem[];
  
  // 交易状态
  status: TradeStatus;
  expiresAt?: number;
  
  // 交易条件
  conditions?: TradeCondition[];
  
  // 交易历史
  negotiations: TradeNegotiation[];
}

// 交易物品接口
export interface TradeItem {
  type: 'money' | 'property' | 'item' | 'skill_usage' | 'favor';
  id?: string;
  amount?: number;
  description: string;
  value: number;
}

// 交易状态
export type TradeStatus = 
  | 'pending' | 'accepted' | 'rejected' | 'expired' | 'completed' | 'cancelled';

// 交易条件接口
export interface TradeCondition {
  type: 'time_limit' | 'property_development' | 'payment_schedule' | 'performance_clause';
  description: string;
  parameters: Record<string, any>;
}

// 交易谈判接口
export interface TradeNegotiation {
  timestamp: number;
  playerId: string;
  action: 'propose' | 'counter' | 'accept' | 'reject' | 'modify';
  message?: string;
  changes?: TradeChange[];
}

// 交易变更接口
export interface TradeChange {
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

// 拍卖接口
export interface Auction {
  id: string;
  propertyId: string;
  startingPrice: number;
  currentPrice: number;
  currentWinner?: string;
  
  // 拍卖状态
  status: AuctionStatus;
  startTime: number;
  endTime: number;
  
  // 出价历史
  bids: AuctionBid[];
  
  // 拍卖规则
  incrementRule: IncrementRule;
  reservePrice?: number;
  buyNowPrice?: number;
}

// 拍卖状态
export type AuctionStatus = 'pending' | 'active' | 'ended' | 'cancelled';

// 拍卖出价接口
export interface AuctionBid {
  playerId: string;
  amount: number;
  timestamp: number;
  type: 'normal' | 'auto' | 'buy_now';
}

// 增价规则接口
export interface IncrementRule {
  type: 'fixed' | 'percentage' | 'dynamic';
  value: number;
  minimumIncrement: number;
}

// 成就接口
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: EventRarity;
  
  // 成就条件
  requirements: AchievementRequirement[];
  
  // 成就奖励
  rewards: AchievementReward[];
  
  // 成就状态
  isUnlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  
  // 显示信息
  iconUrl?: string;
  badgeColor?: string;
  
  // 成就类型
  isHidden: boolean;
  isRepeatable: boolean;
}

// 成就类别
export type AchievementCategory = 
  | 'wealth' | 'property' | 'social' | 'skill' | 'zodiac' 
  | 'victory' | 'endurance' | 'luck' | 'strategy' | 'exploration';

// 成就需求接口
export interface AchievementRequirement {
  type: 'statistic' | 'event' | 'condition' | 'sequence';
  target: string;
  value: number | string;
  comparison: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  timeframe?: 'single_game' | 'session' | 'all_time';
}

// 成就奖励接口
export interface AchievementReward {
  type: 'title' | 'avatar' | 'skill_point' | 'unlock' | 'cosmetic';
  value: string | number;
  description: string;
}

// 排行榜接口
export interface Leaderboard {
  id: string;
  name: string;
  description: string;
  category: LeaderboardCategory;
  timeframe: LeaderboardTimeframe;
  
  // 排行榜条目
  entries: LeaderboardEntry[];
  
  // 更新信息
  lastUpdated: number;
  updateFrequency: number;
}

// 排行榜类别
export type LeaderboardCategory = 
  | 'wealth' | 'games_won' | 'win_rate' | 'fastest_victory'
  | 'longest_game' | 'properties_owned' | 'skills_mastered'
  | 'achievements_unlocked' | 'zodiac_mastery';

// 排行榜时间范围
export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly' | 'all_time';

// 排行榜条目接口
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  zodiac: ZodiacSign;
  score: number;
  
  // 额外信息
  gamesPlayed?: number;
  winRate?: number;
  lastPlayed?: number;
  
  // 趋势
  rankChange?: number;
  scoreChange?: number;
}

// 游戏设置接口
export interface GameSettings {
  // 基础设置
  language: 'zh-CN' | 'en-US';
  timezone: string;
  
  // 游戏规则设置
  allowSkillStacking: boolean;
  enableSeasonalEvents: boolean;
  enableZodiacSynergy: boolean;
  propertyDevelopmentSpeed: number;
  
  // 难度设置
  aiDifficultyScaling: boolean;
  dynamicEventFrequency: boolean;
  adaptiveTutorial: boolean;
  
  // 可访问性设置
  colorBlindSupport: boolean;
  screenReaderSupport: boolean;
  keyboardNavigation: boolean;
  voiceCommands: boolean;
  
  // 性能设置
  animationQuality: 'low' | 'medium' | 'high' | 'ultra';
  particleEffects: boolean;
  backgroundMusic: boolean;
  soundEffects: boolean;
  
  // 隐私设置
  dataCollection: boolean;
  analytics: boolean;
  crashReporting: boolean;
}

// 游戏历史记录接口
export interface GameHistory {
  id: string;
  timestamp: number;
  duration: number;
  
  // 游戏结果
  winner: string;
  finalScores: Record<string, number>;
  
  // 游戏配置
  config: any; // GameConfig from storage module
  
  // 统计数据
  statistics: GameSessionStatistics;
  
  // 重要事件
  highlights: GameHighlight[];
}

// 游戏会话统计接口
export interface GameSessionStatistics {
  totalTurns: number;
  longestTurn: number;
  shortestTurn: number;
  
  // 经济统计
  totalMoneyExchanged: number;
  propertiesTraded: number;
  auctionsHeld: number;
  
  // 技能统计
  skillsUsed: Record<string, number>;
  criticalSkills: number;
  skillCombos: number;
  
  // 事件统计
  eventsTriggered: Record<EventType, number>;
  luckEvents: number;
  zodiacEvents: number;
}

// 游戏亮点接口
export interface GameHighlight {
  timestamp: number;
  type: HighlightType;
  playerId: string;
  description: string;
  value?: number;
  
  // 上下文信息
  context: HighlightContext;
}

// 亮点类型
export type HighlightType = 
  | 'big_purchase' | 'skill_combo' | 'lucky_event' | 'comeback'
  | 'massive_trade' | 'auction_win' | 'zodiac_synergy' | 'achievement_unlock';

// 亮点上下文接口
export interface HighlightContext {
  gamePhase: string;
  playerStats: Partial<PlayerStatistics>;
  boardState?: string;
  involvedPlayers?: string[];
}