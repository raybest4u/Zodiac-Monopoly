/**
 * 游戏事件系统 - 处理游戏中的各种事件
 */

import { EventEmitter } from '../utils/EventEmitter';

// 事件类型定义
export interface GameEvent {
  id: string;
  type: EventType;
  playerId?: string;
  data: any;
  timestamp: number;
  processed: boolean;
  priority: EventPriority;
}

export type EventType =
  | 'dice_rolled'
  | 'player_moved'
  | 'property_landed'
  | 'property_purchased'
  | 'rent_paid'
  | 'skill_used'
  | 'status_effect_applied'
  | 'status_effect_removed'
  | 'player_eliminated'
  | 'game_event_triggered'
  | 'turn_started'
  | 'turn_ended'
  | 'round_completed'
  | 'game_over';

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

export interface EventHandler {
  id: string;
  eventType: EventType;
  handler: (event: GameEvent) => Promise<void> | void;
  priority: number;
  once?: boolean;
}

export interface EventSubscription {
  id: string;
  eventType: EventType;
  callback: (event: GameEvent) => void;
  filter?: (event: GameEvent) => boolean;
}

export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  conditions: EventCondition[];
  effects: EventEffect[];
  choices?: EventChoice[];
}

export interface EventCondition {
  type: 'player_money' | 'player_position' | 'player_properties' | 'round_number' | 'zodiac_match';
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  value: any;
  playerId?: string;
}

export interface EventEffect {
  type: 'money_change' | 'position_change' | 'status_effect' | 'property_effect' | 'skill_effect';
  target: 'self' | 'all' | 'others' | 'random' | 'specific';
  targetId?: string;
  value: any;
  duration?: number;
}

export interface EventChoice {
  id: string;
  text: string;
  description?: string;
  effects: EventEffect[];
  requirements?: EventCondition[];
}

/**
 * 事件系统主类
 */
export class EventSystem extends EventEmitter {
  private eventHandlers = new Map<EventType, EventHandler[]>();
  private eventQueue: GameEvent[] = [];
  private subscriptions = new Map<string, EventSubscription>();
  private randomEvents: RandomEvent[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeRandomEvents();
    this.startEventProcessing();
  }

  /**
   * 初始化随机事件
   */
  private initializeRandomEvents(): void {
    this.randomEvents = [
      // 正面事件
      {
        id: 'lucky_money',
        name: '意外之财',
        description: '你在路上捡到了一笔钱！',
        type: 'positive',
        rarity: 'common',
        conditions: [],
        effects: [
          {
            type: 'money_change',
            target: 'self',
            value: () => Math.floor(Math.random() * 1000) + 500
          }
        ]
      },
      {
        id: 'zodiac_blessing',
        name: '生肖护佑',
        description: '你的生肖为你带来了好运！',
        type: 'positive',
        rarity: 'uncommon',
        conditions: [
          {
            type: 'zodiac_match',
            operator: '=',
            value: true
          }
        ],
        effects: [
          {
            type: 'money_change',
            target: 'self',
            value: 2000
          },
          {
            type: 'status_effect',
            target: 'self',
            value: {
              id: 'zodiac_blessing',
              name: '生肖护佑',
              type: 'buff',
              duration: 3,
              effects: [
                {
                  property: 'rent_reduction',
                  modifier: 0.5,
                  type: 'multiply'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'property_appreciation',
        name: '地产升值',
        description: '你的一处地产意外升值！',
        type: 'positive',
        rarity: 'rare',
        conditions: [
          {
            type: 'player_properties',
            operator: '>',
            value: 0
          }
        ],
        effects: [
          {
            type: 'property_effect',
            target: 'self',
            value: {
              action: 'upgrade_random',
              count: 1
            }
          }
        ]
      },

      // 负面事件
      {
        id: 'tax_audit',
        name: '税务检查',
        description: '税务部门要求你缴纳额外税款。',
        type: 'negative',
        rarity: 'common',
        conditions: [
          {
            type: 'player_money',
            operator: '>',
            value: 5000
          }
        ],
        effects: [
          {
            type: 'money_change',
            target: 'self',
            value: (player: any) => -Math.floor(player.money * 0.1)
          }
        ]
      },
      {
        id: 'market_crash',
        name: '市场崩盘',
        description: '经济危机导致所有人都损失惨重！',
        type: 'negative',
        rarity: 'rare',
        conditions: [],
        effects: [
          {
            type: 'money_change',
            target: 'all',
            value: -1500
          }
        ]
      },
      {
        id: 'natural_disaster',
        name: '自然灾害',
        description: '自然灾害损坏了你的部分财产。',
        type: 'negative',
        rarity: 'uncommon',
        conditions: [
          {
            type: 'player_properties',
            operator: '>',
            value: 2
          }
        ],
        effects: [
          {
            type: 'property_effect',
            target: 'self',
            value: {
              action: 'damage_random',
              count: 1
            }
          }
        ]
      },

      // 中性事件（有选择）
      {
        id: 'investment_opportunity',
        name: '投资机会',
        description: '有一个投资机会，但风险和收益并存。',
        type: 'neutral',
        rarity: 'uncommon',
        conditions: [
          {
            type: 'player_money',
            operator: '>=',
            value: 2000
          }
        ],
        effects: [],
        choices: [
          {
            id: 'invest',
            text: '投资（花费2000）',
            effects: [
              {
                type: 'money_change',
                target: 'self',
                value: -2000
              }
            ]
          },
          {
            id: 'ignore',
            text: '忽略机会',
            effects: []
          }
        ]
      },
      {
        id: 'charity_request',
        name: '慈善请求',
        description: '有慈善机构向你寻求帮助。',
        type: 'neutral',
        rarity: 'common',
        conditions: [
          {
            type: 'player_money',
            operator: '>',
            value: 1000
          }
        ],
        effects: [],
        choices: [
          {
            id: 'donate',
            text: '捐款（花费1000，获得好运）',
            effects: [
              {
                type: 'money_change',
                target: 'self',
                value: -1000
              },
              {
                type: 'status_effect',
                target: 'self',
                value: {
                  id: 'good_karma',
                  name: '善报',
                  type: 'buff',
                  duration: 5,
                  effects: [
                    {
                      property: 'positive_event_chance',
                      modifier: 0.2,
                      type: 'add'
                    }
                  ]
                }
              }
            ]
          },
          {
            id: 'refuse',
            text: '拒绝捐款',
            effects: []
          }
        ]
      }
    ];
  }

  /**
   * 开始事件处理循环
   */
  private startEventProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processEventQueue();
    }, 100);
  }

  /**
   * 注册事件处理器
   */
  registerHandler(handler: EventHandler): void {
    if (!this.eventHandlers.has(handler.eventType)) {
      this.eventHandlers.set(handler.eventType, []);
    }

    const handlers = this.eventHandlers.get(handler.eventType)!;
    handlers.push(handler);
    
    // 按优先级排序
    handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 取消注册事件处理器
   */
  unregisterHandler(handlerId: string): void {
    for (const [eventType, handlers] of this.eventHandlers) {
      const index = handlers.findIndex(h => h.id === handlerId);
      if (index !== -1) {
        handlers.splice(index, 1);
        break;
      }
    }
  }

  /**
   * 订阅事件
   */
  subscribe(subscription: EventSubscription): void {
    this.subscriptions.set(subscription.id, subscription);
  }

  /**
   * 取消订阅事件
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * 触发事件
   */
  triggerEvent(event: Omit<GameEvent, 'id' | 'timestamp' | 'processed'>): string {
    const gameEvent: GameEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      processed: false
    };

    this.eventQueue.push(gameEvent);
    this.emit('eventTriggered', gameEvent);
    
    return gameEvent.id;
  }

  /**
   * 处理单个事件
   */
  async processEvent(event: GameEvent): Promise<void> {
    if (event.processed) return;

    try {
      // 通知订阅者
      this.notifySubscribers(event);

      // 执行事件处理器
      const handlers = this.eventHandlers.get(event.type) || [];
      
      for (const handler of handlers) {
        try {
          await handler.handler(event);
          
          // 如果是一次性处理器，移除它
          if (handler.once) {
            this.unregisterHandler(handler.id);
          }
        } catch (error) {
          console.error(`Error in event handler ${handler.id}:`, error);
        }
      }

      event.processed = true;
      this.emit('eventProcessed', event);

    } catch (error) {
      console.error('Error processing event:', error);
      this.emit('eventProcessingFailed', { event, error });
    }
  }

  /**
   * 处理事件队列
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    // 按优先级排序事件
    this.eventQueue.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, normal: 1, low: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const event = this.eventQueue.shift();
    if (event) {
      await this.processEvent(event);
    }

    this.isProcessing = false;
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(event: GameEvent): void {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.eventType === event.type) {
        if (!subscription.filter || subscription.filter(event)) {
          try {
            subscription.callback(event);
          } catch (error) {
            console.error(`Error in event subscription ${subscription.id}:`, error);
          }
        }
      }
    }
  }

  /**
   * 触发随机事件
   */
  triggerRandomEvent(playerId: string, playerData: any, gameState: any): RandomEvent | null {
    // 过滤符合条件的事件
    const availableEvents = this.randomEvents.filter(event => 
      this.checkEventConditions(event, playerId, playerData, gameState)
    );

    if (availableEvents.length === 0) return null;

    // 根据稀有度加权选择
    const weightedEvents = this.calculateEventWeights(availableEvents);
    const selectedEvent = this.selectWeightedEvent(weightedEvents);

    if (selectedEvent) {
      // 触发事件
      this.triggerEvent({
        type: 'game_event_triggered',
        playerId,
        data: {
          randomEvent: selectedEvent,
          playerData,
          gameState
        },
        priority: 'normal'
      });
    }

    return selectedEvent;
  }

  /**
   * 检查事件条件
   */
  private checkEventConditions(
    event: RandomEvent, 
    playerId: string, 
    playerData: any, 
    gameState: any
  ): boolean {
    for (const condition of event.conditions) {
      if (!this.evaluateCondition(condition, playerId, playerData, gameState)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(
    condition: EventCondition,
    playerId: string,
    playerData: any,
    gameState: any
  ): boolean {
    let actualValue: any;

    switch (condition.type) {
      case 'player_money':
        actualValue = playerData.money;
        break;
      case 'player_position':
        actualValue = playerData.position;
        break;
      case 'player_properties':
        actualValue = playerData.properties?.length || 0;
        break;
      case 'round_number':
        actualValue = gameState.round;
        break;
      case 'zodiac_match':
        // 检查当前位置是否匹配玩家生肖
        const currentCell = gameState.board?.[playerData.position];
        actualValue = currentCell?.zodiac === playerData.zodiac;
        break;
      default:
        return true;
    }

    return this.compareValues(actualValue, condition.operator, condition.value);
  }

  /**
   * 比较值
   */
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '>': return actual > expected;
      case '<': return actual < expected;
      case '=': return actual === expected;
      case '>=': return actual >= expected;
      case '<=': return actual <= expected;
      case '!=': return actual !== expected;
      default: return true;
    }
  }

  /**
   * 计算事件权重
   */
  private calculateEventWeights(events: RandomEvent[]): Array<{ event: RandomEvent; weight: number }> {
    const rarityWeights = {
      common: 100,
      uncommon: 50,
      rare: 20,
      legendary: 5
    };

    return events.map(event => ({
      event,
      weight: rarityWeights[event.rarity]
    }));
  }

  /**
   * 加权选择事件
   */
  private selectWeightedEvent(weightedEvents: Array<{ event: RandomEvent; weight: number }>): RandomEvent | null {
    const totalWeight = weightedEvents.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return null;

    let random = Math.random() * totalWeight;
    
    for (const item of weightedEvents) {
      random -= item.weight;
      if (random <= 0) {
        return item.event;
      }
    }

    return weightedEvents[weightedEvents.length - 1]?.event || null;
  }

  /**
   * 应用事件效果
   */
  async applyEventEffects(
    effects: EventEffect[], 
    triggeredBy: string, 
    gameState: any,
    choice?: EventChoice
  ): Promise<void> {
    const effectsToApply = choice ? choice.effects : effects;

    for (const effect of effectsToApply) {
      await this.applyEventEffect(effect, triggeredBy, gameState);
    }
  }

  /**
   * 应用单个事件效果
   */
  private async applyEventEffect(
    effect: EventEffect, 
    triggeredBy: string, 
    gameState: any
  ): Promise<void> {
    let targetPlayers: string[] = [];

    // 确定目标玩家
    switch (effect.target) {
      case 'self':
        targetPlayers = [triggeredBy];
        break;
      case 'all':
        targetPlayers = gameState.players?.map((p: any) => p.id) || [];
        break;
      case 'others':
        targetPlayers = gameState.players?.filter((p: any) => p.id !== triggeredBy).map((p: any) => p.id) || [];
        break;
      case 'random':
        const otherPlayers = gameState.players?.filter((p: any) => p.id !== triggeredBy) || [];
        if (otherPlayers.length > 0) {
          const randomPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
          targetPlayers = [randomPlayer.id];
        }
        break;
      case 'specific':
        if (effect.targetId) {
          targetPlayers = [effect.targetId];
        }
        break;
    }

    // 对每个目标玩家应用效果
    for (const playerId of targetPlayers) {
      await this.applyEffectToPlayer(effect, playerId, gameState);
    }
  }

  /**
   * 对特定玩家应用效果
   */
  private async applyEffectToPlayer(
    effect: EventEffect, 
    playerId: string, 
    gameState: any
  ): Promise<void> {
    const player = gameState.players?.find((p: any) => p.id === playerId);
    if (!player) return;

    switch (effect.type) {
      case 'money_change':
        const amount = typeof effect.value === 'function' ? effect.value(player) : effect.value;
        this.triggerEvent({
          type: 'player_moved',
          playerId,
          data: { moneyChange: amount, reason: 'event_effect' },
          priority: 'normal'
        });
        break;

      case 'position_change':
        const newPosition = typeof effect.value === 'function' ? effect.value(player) : effect.value;
        this.triggerEvent({
          type: 'player_moved',
          playerId,
          data: { newPosition, reason: 'event_effect' },
          priority: 'normal'
        });
        break;

      case 'status_effect':
        this.triggerEvent({
          type: 'status_effect_applied',
          playerId,
          data: { statusEffect: effect.value },
          priority: 'normal'
        });
        break;

      case 'property_effect':
        // 处理属性相关效果
        const propertyEffect = effect.value;
        if (propertyEffect.action === 'upgrade_random' && player.properties?.length > 0) {
          const randomProperty = player.properties[Math.floor(Math.random() * player.properties.length)];
          this.triggerEvent({
            type: 'property_purchased', // 重用现有事件类型
            playerId,
            data: { propertyId: randomProperty, action: 'upgrade', reason: 'event_effect' },
            priority: 'normal'
          });
        }
        break;

      case 'skill_effect':
        // 处理技能相关效果
        this.triggerEvent({
          type: 'skill_used',
          playerId,
          data: { skillEffect: effect.value, reason: 'event_effect' },
          priority: 'normal'
        });
        break;
    }
  }

  /**
   * 获取随机事件
   */
  getRandomEvent(eventId: string): RandomEvent | null {
    return this.randomEvents.find(event => event.id === eventId) || null;
  }

  /**
   * 获取所有随机事件
   */
  getAllRandomEvents(): RandomEvent[] {
    return [...this.randomEvents];
  }

  /**
   * 添加自定义随机事件
   */
  addRandomEvent(event: RandomEvent): void {
    this.randomEvents.push(event);
  }

  /**
   * 移除随机事件
   */
  removeRandomEvent(eventId: string): void {
    this.randomEvents = this.randomEvents.filter(event => event.id !== eventId);
  }

  /**
   * 清空事件队列
   */
  clearEventQueue(): void {
    this.eventQueue = [];
  }

  /**
   * 获取事件队列状态
   */
  getEventQueueStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.eventQueue.length,
      processing: this.isProcessing
    };
  }

  /**
   * 销毁事件系统
   */
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.eventHandlers.clear();
    this.subscriptions.clear();
    this.eventQueue = [];
    this.isProcessing = false;
    
    this.removeAllListeners();
  }
}

export default EventSystem;