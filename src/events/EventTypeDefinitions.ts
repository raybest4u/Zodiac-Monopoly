/**
 * 事件类型定义和分类系统
 * 
 * 定义游戏中所有事件类型、分类和元数据
 * 包括：游戏逻辑事件、用户交互事件、系统事件、生肖事件等
 */

import { 
  EventCategory, 
  EventPriority, 
  EventTypeDefinition,
  EventSource,
  EventTarget 
} from './EventSystemArchitecture';
import type { 
  EventType, 
  EventTrigger, 
  EventRarity,
  ZodiacSign,
  Season,
  Weather 
} from '../types/game';

// ============================================================================
// 游戏事件类型枚举扩展
// ============================================================================

/**
 * 扩展的事件类型
 * 覆盖游戏中所有可能的事件
 */
export enum GameEventType {
  // 系统事件 (1000-1099)
  SYSTEM_STARTUP = 'system.startup',
  SYSTEM_SHUTDOWN = 'system.shutdown',
  SYSTEM_ERROR = 'system.error',
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_UPDATE = 'system.update',

  // 游戏生命周期事件 (1100-1199)
  GAME_CREATED = 'game.created',
  GAME_STARTED = 'game.started',
  GAME_PAUSED = 'game.paused',
  GAME_RESUMED = 'game.resumed',
  GAME_ENDED = 'game.ended',
  GAME_STATE_CHANGED = 'game.state_changed',

  // 回合和阶段事件 (1200-1299)
  ROUND_STARTED = 'round.started',
  ROUND_ENDED = 'round.ended',
  TURN_STARTED = 'turn.started',
  TURN_ENDED = 'turn.ended',
  PHASE_CHANGED = 'phase.changed',

  // 玩家行动事件 (1300-1399)
  PLAYER_JOINED = 'player.joined',
  PLAYER_LEFT = 'player.left',
  PLAYER_MOVED = 'player.moved',
  PLAYER_ACTION = 'player.action',
  PLAYER_DECISION = 'player.decision',
  PLAYER_ELIMINATED = 'player.eliminated',

  // 骰子事件 (1400-1449)
  DICE_ROLLED = 'dice.rolled',
  DICE_MODIFIER_APPLIED = 'dice.modifier_applied',
  DICE_REROLL_REQUESTED = 'dice.reroll_requested',

  // 属性和金钱事件 (1450-1499)
  PROPERTY_PURCHASED = 'property.purchased',
  PROPERTY_SOLD = 'property.sold',
  PROPERTY_UPGRADED = 'property.upgraded',
  PROPERTY_LANDED = 'property.landed',
  RENT_PAID = 'rent.paid',
  RENT_COLLECTED = 'rent.collected',
  MONEY_CHANGED = 'money.changed',
  MONEY_TRANSFER = 'money.transfer',

  // 技能系统事件 (1500-1599)
  SKILL_LEARNED = 'skill.learned',
  SKILL_USED = 'skill.used',
  SKILL_UPGRADED = 'skill.upgraded',
  SKILL_COOLDOWN_STARTED = 'skill.cooldown_started',
  SKILL_COOLDOWN_ENDED = 'skill.cooldown_ended',
  SKILL_EFFECT_APPLIED = 'skill.effect_applied',
  SKILL_EFFECT_REMOVED = 'skill.effect_removed',
  SKILL_COMBO_TRIGGERED = 'skill.combo_triggered',

  // 状态效果事件 (1600-1649)
  STATUS_EFFECT_APPLIED = 'status.effect_applied',
  STATUS_EFFECT_REMOVED = 'status.effect_removed',
  STATUS_EFFECT_UPDATED = 'status.effect_updated',
  STATUS_EFFECT_EXPIRED = 'status.effect_expired',

  // 生肖系统事件 (1650-1699)
  ZODIAC_BLESSING_TRIGGERED = 'zodiac.blessing_triggered',
  ZODIAC_CURSE_APPLIED = 'zodiac.curse_applied',
  ZODIAC_COMPATIBILITY_CHECKED = 'zodiac.compatibility_checked',
  ZODIAC_SYNERGY_ACTIVATED = 'zodiac.synergy_activated',
  ZODIAC_SPECIAL_EVENT = 'zodiac.special_event',

  // 季节和天气事件 (1700-1749)
  SEASON_CHANGED = 'season.changed',
  WEATHER_CHANGED = 'weather.changed',
  SEASONAL_EVENT_TRIGGERED = 'seasonal.event_triggered',
  WEATHER_EFFECT_APPLIED = 'weather.effect_applied',

  // 随机事件 (1750-1799)
  RANDOM_EVENT_TRIGGERED = 'random.event_triggered',
  CHANCE_CARD_DRAWN = 'chance.card_drawn',
  COMMUNITY_CHEST_DRAWN = 'community.chest_drawn',
  LUCKY_EVENT = 'lucky.event',
  UNLUCKY_EVENT = 'unlucky.event',

  // UI和用户交互事件 (1800-1899)
  UI_ELEMENT_CLICKED = 'ui.element_clicked',
  UI_DIALOG_OPENED = 'ui.dialog_opened',
  UI_DIALOG_CLOSED = 'ui.dialog_closed',
  UI_NOTIFICATION_SHOWN = 'ui.notification_shown',
  USER_INPUT_RECEIVED = 'user.input_received',
  USER_CHOICE_MADE = 'user.choice_made',

  // 动画和视觉效果事件 (1900-1949)
  ANIMATION_STARTED = 'animation.started',
  ANIMATION_COMPLETED = 'animation.completed',
  ANIMATION_INTERRUPTED = 'animation.interrupted',
  VISUAL_EFFECT_TRIGGERED = 'visual.effect_triggered',
  PARTICLE_EFFECT_SPAWNED = 'particle.effect_spawned',

  // 音频事件 (1950-1999)
  SOUND_PLAYED = 'sound.played',
  SOUND_STOPPED = 'sound.stopped',
  MUSIC_CHANGED = 'music.changed',
  AUDIO_EFFECT_TRIGGERED = 'audio.effect_triggered',

  // 网络和多人游戏事件 (2000-2099)
  NETWORK_CONNECTED = 'network.connected',
  NETWORK_DISCONNECTED = 'network.disconnected',
  MULTIPLAYER_MESSAGE_SENT = 'multiplayer.message_sent',
  MULTIPLAYER_MESSAGE_RECEIVED = 'multiplayer.message_received',
  MULTIPLAYER_SYNC_REQUESTED = 'multiplayer.sync_requested',

  // AI和自动化事件 (2100-2199)
  AI_DECISION_MADE = 'ai.decision_made',
  AI_STRATEGY_CHANGED = 'ai.strategy_changed',
  AI_LEARNING_UPDATED = 'ai.learning_updated',
  AI_DIFFICULTY_ADJUSTED = 'ai.difficulty_adjusted',

  // 交易和经济事件 (2200-2249)
  TRADE_OFFERED = 'trade.offered',
  TRADE_ACCEPTED = 'trade.accepted',
  TRADE_REJECTED = 'trade.rejected',
  TRADE_COMPLETED = 'trade.completed',
  AUCTION_STARTED = 'auction.started',
  AUCTION_BID_PLACED = 'auction.bid_placed',
  AUCTION_ENDED = 'auction.ended',

  // 成就和进度事件 (2250-2299)
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  MILESTONE_REACHED = 'milestone.reached',
  PROGRESS_UPDATED = 'progress.updated',
  LEADERBOARD_UPDATED = 'leaderboard.updated',

  // 自定义和扩展事件 (9000-9999)
  CUSTOM_EVENT = 'custom.event',
  DEVELOPER_EVENT = 'developer.event',
  DEBUG_EVENT = 'debug.event'
}

// ============================================================================
// 事件分类配置
// ============================================================================

/**
 * 事件分类映射
 */
export const EVENT_CATEGORY_MAPPING: Record<string, EventCategory> = {
  // 系统事件
  'system.': EventCategory.SYSTEM,
  
  // 游戏逻辑事件
  'game.': EventCategory.GAME_LOGIC,
  'round.': EventCategory.GAME_LOGIC,
  'turn.': EventCategory.GAME_LOGIC,
  'phase.': EventCategory.GAME_LOGIC,
  'dice.': EventCategory.GAME_LOGIC,
  'property.': EventCategory.GAME_LOGIC,
  'rent.': EventCategory.GAME_LOGIC,
  'money.': EventCategory.GAME_LOGIC,
  'trade.': EventCategory.GAME_LOGIC,
  'auction.': EventCategory.GAME_LOGIC,
  
  // 用户输入事件
  'player.': EventCategory.USER_INPUT,
  'user.': EventCategory.USER_INPUT,
  'ui.': EventCategory.UI,
  
  // 技能系统事件
  'skill.': EventCategory.SKILL,
  'status.': EventCategory.SKILL,
  
  // 生肖事件
  'zodiac.': EventCategory.ZODIAC,
  'season.': EventCategory.ZODIAC,
  'weather.': EventCategory.ZODIAC,
  'seasonal.': EventCategory.ZODIAC,
  
  // 随机事件
  'random.': EventCategory.RANDOM,
  'chance.': EventCategory.RANDOM,
  'community.': EventCategory.RANDOM,
  'lucky.': EventCategory.RANDOM,
  'unlucky.': EventCategory.RANDOM,
  
  // 动画和视觉
  'animation.': EventCategory.ANIMATION,
  'visual.': EventCategory.ANIMATION,
  'particle.': EventCategory.ANIMATION,
  
  // 音频
  'sound.': EventCategory.AUDIO,
  'music.': EventCategory.AUDIO,
  'audio.': EventCategory.AUDIO,
  
  // 网络
  'network.': EventCategory.NETWORK,
  'multiplayer.': EventCategory.NETWORK,
  
  // 自定义
  'custom.': EventCategory.CUSTOM,
  'developer.': EventCategory.CUSTOM,
  'debug.': EventCategory.CUSTOM
};

/**
 * 默认优先级映射
 */
export const DEFAULT_PRIORITY_MAPPING: Record<EventCategory, EventPriority> = {
  [EventCategory.SYSTEM]: EventPriority.CRITICAL,
  [EventCategory.GAME_LOGIC]: EventPriority.HIGH,
  [EventCategory.USER_INPUT]: EventPriority.HIGH,
  [EventCategory.NETWORK]: EventPriority.HIGH,
  [EventCategory.ANIMATION]: EventPriority.NORMAL,
  [EventCategory.AUDIO]: EventPriority.NORMAL,
  [EventCategory.UI]: EventPriority.NORMAL,
  [EventCategory.SKILL]: EventPriority.HIGH,
  [EventCategory.ZODIAC]: EventPriority.NORMAL,
  [EventCategory.RANDOM]: EventPriority.NORMAL,
  [EventCategory.CUSTOM]: EventPriority.LOW
};

// ============================================================================
// 事件类型注册器
// ============================================================================

/**
 * 事件类型注册器
 * 自动生成标准事件类型定义
 */
export class EventTypeRegistry {
  private eventTypes = new Map<string, EventTypeDefinition>();
  private categories = new Map<EventCategory, EventTypeDefinition[]>();

  constructor() {
    this.initializeStandardEventTypes();
  }

  /**
   * 注册事件类型
   */
  public registerEventType(definition: EventTypeDefinition): void {
    this.eventTypes.set(definition.id, definition);
    
    // 按分类组织
    if (!this.categories.has(definition.category)) {
      this.categories.set(definition.category, []);
    }
    this.categories.get(definition.category)!.push(definition);
  }

  /**
   * 获取事件类型定义
   */
  public getEventType(typeId: string): EventTypeDefinition | undefined {
    return this.eventTypes.get(typeId);
  }

  /**
   * 获取分类下的所有事件类型
   */
  public getEventTypesByCategory(category: EventCategory): EventTypeDefinition[] {
    return this.categories.get(category) || [];
  }

  /**
   * 获取所有事件类型
   */
  public getAllEventTypes(): EventTypeDefinition[] {
    return Array.from(this.eventTypes.values());
  }

  /**
   * 根据事件类型ID推断分类
   */
  public inferCategory(typeId: string): EventCategory {
    for (const [prefix, category] of Object.entries(EVENT_CATEGORY_MAPPING)) {
      if (typeId.startsWith(prefix)) {
        return category;
      }
    }
    return EventCategory.CUSTOM;
  }

  /**
   * 创建标准事件类型定义
   */
  public createStandardDefinition(
    id: string,
    name: string,
    overrides: Partial<EventTypeDefinition> = {}
  ): EventTypeDefinition {
    const category = this.inferCategory(id);
    const defaultPriority = DEFAULT_PRIORITY_MAPPING[category];

    return {
      id,
      name,
      category,
      priority: defaultPriority,
      isSystemEvent: category === EventCategory.SYSTEM,
      requiresResponse: category === EventCategory.USER_INPUT,
      maxConcurrent: this.getDefaultMaxConcurrent(category),
      defaultTimeout: this.getDefaultTimeout(category),
      allowedTriggers: this.getDefaultTriggers(category),
      metadata: {},
      ...overrides
    };
  }

  /**
   * 初始化标准事件类型
   */
  private initializeStandardEventTypes(): void {
    // 系统事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.SYSTEM_STARTUP,
      '系统启动',
      {
        maxConcurrent: 1,
        defaultTimeout: 10000,
        allowedTriggers: ['system' as EventTrigger]
      }
    ));

    this.registerEventType(this.createStandardDefinition(
      GameEventType.SYSTEM_SHUTDOWN,
      '系统关闭',
      {
        maxConcurrent: 1,
        defaultTimeout: 5000,
        allowedTriggers: ['system' as EventTrigger]
      }
    ));

    // 游戏生命周期事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.GAME_STARTED,
      '游戏开始',
      {
        maxConcurrent: 1,
        allowedTriggers: ['turn_start' as EventTrigger]
      }
    ));

    this.registerEventType(this.createStandardDefinition(
      GameEventType.GAME_ENDED,
      '游戏结束',
      {
        maxConcurrent: 1,
        allowedTriggers: ['turn_end' as EventTrigger]
      }
    ));

    // 回合事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.TURN_STARTED,
      '回合开始',
      {
        maxConcurrent: 1,
        allowedTriggers: ['turn_start' as EventTrigger]
      }
    ));

    this.registerEventType(this.createStandardDefinition(
      GameEventType.TURN_ENDED,
      '回合结束',
      {
        maxConcurrent: 1,
        allowedTriggers: ['turn_end' as EventTrigger]
      }
    ));

    // 玩家行动事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.PLAYER_MOVED,
      '玩家移动',
      {
        maxConcurrent: 1,
        allowedTriggers: ['dice_roll' as EventTrigger, 'land_on_cell' as EventTrigger]
      }
    ));

    this.registerEventType(this.createStandardDefinition(
      GameEventType.DICE_ROLLED,
      '掷骰子',
      {
        maxConcurrent: 1,
        allowedTriggers: ['dice_roll' as EventTrigger]
      }
    ));

    // 属性事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.PROPERTY_PURCHASED,
      '购买属性',
      {
        allowedTriggers: ['land_on_cell' as EventTrigger]
      }
    ));

    this.registerEventType(this.createStandardDefinition(
      GameEventType.RENT_PAID,
      '支付租金',
      {
        allowedTriggers: ['land_on_cell' as EventTrigger]
      }
    ));

    // 技能事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.SKILL_USED,
      '使用技能',
      {
        priority: EventPriority.HIGH,
        maxConcurrent: 3,
        allowedTriggers: ['turn_start' as EventTrigger, 'turn_end' as EventTrigger]
      }
    ));

    this.registerEventType(this.createStandardDefinition(
      GameEventType.SKILL_LEARNED,
      '学习技能',
      {
        allowedTriggers: ['turn_start' as EventTrigger]
      }
    ));

    // 生肖事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.ZODIAC_BLESSING_TRIGGERED,
      '生肖祝福触发',
      {
        allowedTriggers: ['seasonal_change' as EventTrigger, 'turn_start' as EventTrigger]
      }
    ));

    this.registerEventType(this.createStandardDefinition(
      GameEventType.SEASON_CHANGED,
      '季节变更',
      {
        maxConcurrent: 1,
        allowedTriggers: ['seasonal_change' as EventTrigger]
      }
    ));

    // 随机事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.RANDOM_EVENT_TRIGGERED,
      '随机事件触发',
      {
        allowedTriggers: ['land_on_cell' as EventTrigger, 'turn_start' as EventTrigger]
      }
    ));

    // UI事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.UI_DIALOG_OPENED,
      '对话框打开',
      {
        maxConcurrent: 5,
        defaultTimeout: 30000,
        requiresResponse: true
      }
    ));

    // 动画事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.ANIMATION_STARTED,
      '动画开始',
      {
        maxConcurrent: 10,
        defaultTimeout: 10000
      }
    ));

    // 音频事件
    this.registerEventType(this.createStandardDefinition(
      GameEventType.SOUND_PLAYED,
      '播放音效',
      {
        maxConcurrent: 20,
        defaultTimeout: 1000
      }
    ));
  }

  /**
   * 获取默认最大并发数
   */
  private getDefaultMaxConcurrent(category: EventCategory): number {
    switch (category) {
      case EventCategory.SYSTEM:
        return 1;
      case EventCategory.GAME_LOGIC:
        return 3;
      case EventCategory.USER_INPUT:
        return 5;
      case EventCategory.SKILL:
        return 5;
      case EventCategory.ANIMATION:
        return 10;
      case EventCategory.AUDIO:
        return 20;
      case EventCategory.UI:
        return 10;
      default:
        return 5;
    }
  }

  /**
   * 获取默认超时时间
   */
  private getDefaultTimeout(category: EventCategory): number {
    switch (category) {
      case EventCategory.SYSTEM:
        return 10000; // 10秒
      case EventCategory.GAME_LOGIC:
        return 5000;  // 5秒
      case EventCategory.USER_INPUT:
        return 30000; // 30秒
      case EventCategory.ANIMATION:
        return 10000; // 10秒
      case EventCategory.AUDIO:
        return 1000;  // 1秒
      default:
        return 5000;  // 5秒
    }
  }

  /**
   * 获取默认触发器
   */
  private getDefaultTriggers(category: EventCategory): EventTrigger[] {
    switch (category) {
      case EventCategory.SYSTEM:
        return ['system' as EventTrigger];
      case EventCategory.GAME_LOGIC:
        return ['turn_start' as EventTrigger, 'turn_end' as EventTrigger, 'land_on_cell' as EventTrigger];
      case EventCategory.USER_INPUT:
        return ['turn_start' as EventTrigger];
      case EventCategory.SKILL:
        return ['turn_start' as EventTrigger, 'turn_end' as EventTrigger];
      case EventCategory.ZODIAC:
        return ['seasonal_change' as EventTrigger, 'turn_start' as EventTrigger];
      case EventCategory.RANDOM:
        return ['land_on_cell' as EventTrigger, 'turn_start' as EventTrigger];
      default:
        return ['turn_start' as EventTrigger];
    }
  }
}

// ============================================================================
// 特殊事件类型工厂
// ============================================================================

/**
 * 生肖事件工厂
 */
export class ZodiacEventFactory {
  private registry: EventTypeRegistry;

  constructor(registry: EventTypeRegistry) {
    this.registry = registry;
  }

  /**
   * 创建生肖专属事件类型
   */
  public createZodiacEvent(zodiac: ZodiacSign, eventName: string, rarity: EventRarity = 'common'): EventTypeDefinition {
    const eventId = `zodiac.${zodiac.toLowerCase()}.${eventName.toLowerCase().replace(/\s+/g, '_')}`;
    
    let priority = EventPriority.NORMAL;
    switch (rarity) {
      case 'rare':
        priority = EventPriority.HIGH;
        break;
      case 'epic':
      case 'legendary':
        priority = EventPriority.CRITICAL;
        break;
    }

    return this.registry.createStandardDefinition(
      eventId,
      `${zodiac}${eventName}`,
      {
        category: EventCategory.ZODIAC,
        priority,
        maxConcurrent: 1,
        metadata: {
          zodiac,
          rarity,
          culturalSignificance: this.getCulturalSignificance(zodiac)
        }
      }
    );
  }

  /**
   * 创建季节事件类型
   */
  public createSeasonalEvent(season: Season, eventName: string): EventTypeDefinition {
    const eventId = `seasonal.${season}.${eventName.toLowerCase().replace(/\s+/g, '_')}`;
    
    return this.registry.createStandardDefinition(
      eventId,
      `${season}季${eventName}`,
      {
        category: EventCategory.ZODIAC,
        allowedTriggers: ['seasonal_change' as EventTrigger],
        metadata: {
          season,
          seasonalBonus: this.getSeasonalBonus(season)
        }
      }
    );
  }

  /**
   * 创建天气事件类型
   */
  public createWeatherEvent(weather: Weather, eventName: string): EventTypeDefinition {
    const eventId = `weather.${weather}.${eventName.toLowerCase().replace(/\s+/g, '_')}`;
    
    return this.registry.createStandardDefinition(
      eventId,
      `${weather}天${eventName}`,
      {
        category: EventCategory.ZODIAC,
        metadata: {
          weather,
          weatherEffect: this.getWeatherEffect(weather)
        }
      }
    );
  }

  /**
   * 获取生肖文化意义
   */
  private getCulturalSignificance(zodiac: ZodiacSign): string {
    const significance: Record<ZodiacSign, string> = {
      '鼠': '机智灵活，善于积累',
      '牛': '勤劳踏实，持之以恒',
      '虎': '勇猛威武，领导力强',
      '兔': '温和谨慎，人际和谐',
      '龙': '尊贵神秘，力量强大',
      '蛇': '智慧深邃，洞察敏锐',
      '马': '奔放自由，积极进取',
      '羊': '温顺善良，艺术天赋',
      '猴': '聪明活泼，适应力强',
      '鸡': '勤奋守时，追求完美',
      '狗': '忠诚可靠，正义感强',
      '猪': '善良朴实，福气满满'
    };
    return significance[zodiac] || '未知特质';
  }

  /**
   * 获取季节加成
   */
  private getSeasonalBonus(season: Season): Record<string, number> {
    const bonuses: Record<Season, Record<string, number>> = {
      '春': { 'growth': 1.2, 'healing': 1.15, 'money_gain': 1.1 },
      '夏': { 'energy': 1.3, 'damage': 1.2, 'activity': 1.25 },
      '秋': { 'harvest': 1.4, 'wisdom': 1.15, 'trade': 1.2 },
      '冬': { 'defense': 1.3, 'patience': 1.2, 'contemplation': 1.15 }
    };
    return bonuses[season] || {};
  }

  /**
   * 获取天气效果
   */
  private getWeatherEffect(weather: Weather): Record<string, number> {
    const effects: Record<Weather, Record<string, number>> = {
      '晴': { 'mood': 1.2, 'visibility': 1.3, 'movement': 1.1 },
      '雨': { 'growth': 1.25, 'cleansing': 1.2, 'movement': 0.9 },
      '雪': { 'purity': 1.3, 'reflection': 1.2, 'speed': 0.8 },
      '风': { 'change': 1.4, 'communication': 1.15, 'instability': 1.1 },
      '雾': { 'mystery': 1.5, 'intuition': 1.3, 'visibility': 0.6 }
    };
    return effects[weather] || {};
  }
}

// ============================================================================
// 导出默认实例
// ============================================================================

// 创建默认的事件类型注册器实例
export const defaultEventTypeRegistry = new EventTypeRegistry();

// 创建生肖事件工厂实例
export const zodiacEventFactory = new ZodiacEventFactory(defaultEventTypeRegistry);

// 导出所有标准事件类型
export const STANDARD_EVENT_TYPES = defaultEventTypeRegistry.getAllEventTypes();

export default {
  GameEventType,
  EventTypeRegistry,
  ZodiacEventFactory,
  defaultEventTypeRegistry,
  zodiacEventFactory,
  STANDARD_EVENT_TYPES,
  EVENT_CATEGORY_MAPPING,
  DEFAULT_PRIORITY_MAPPING
};