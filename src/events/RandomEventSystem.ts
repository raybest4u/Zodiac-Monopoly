/**
 * 随机事件系统 - 增强版随机事件生成和管理
 * 支持动态事件生成、事件链、条件触发等高级功能
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { RandomEvent, EventCondition, EventEffect, EventChoice } from './EventSystem';

export interface RandomEventConfig {
  // 基础概率设置
  baseProbability: number;
  
  // 稀有度权重
  rarityWeights: Record<string, number>;
  
  // 类型权重
  typeWeights: Record<string, number>;
  
  // 最小/最大触发间隔
  minInterval: number;
  maxInterval: number;
  
  // 同时最大事件数
  maxConcurrentEvents: number;
  
  // 历史影响权重
  historyWeight: number;
}

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  
  // 生成参数
  generationRules: {
    valueRanges: Record<string, [number, number]>;
    textVariations: Record<string, string[]>;
    conditionalElements: ConditionalElement[];
  };
  
  // 基础属性模板
  baseEvent: Omit<RandomEvent, 'id' | 'name' | 'description'>;
}

export interface ConditionalElement {
  condition: EventCondition;
  modifications: {
    nameModifier?: string;
    descriptionModifier?: string;
    effectModifiers?: Partial<EventEffect>[];
    probabilityMultiplier?: number;
  };
}

export interface EventContext {
  gameState: any;
  playerStates: any[];
  currentPlayerId: string;
  gamePhase: string;
  recentEvents: RandomEvent[];
  gameMetrics: GameMetrics;
}

export interface GameMetrics {
  totalTurns: number;
  averagePlayerWealth: number;
  propertyDistribution: Record<string, number>;
  skillUsageFrequency: Record<string, number>;
  zodiacDistribution: Record<string, number>;
}

export interface EventGenerationResult {
  event: RandomEvent;
  probability: number;
  source: 'template' | 'dynamic' | 'chain';
  context: EventContext;
}

/**
 * 增强版随机事件系统
 */
export class RandomEventSystem extends EventEmitter {
  private config: RandomEventConfig;
  private eventTemplates = new Map<string, EventTemplate>();
  private eventHistory: RandomEvent[] = [];
  private lastTriggerTime = 0;
  private activeEvents = new Set<string>();
  private eventChains = new Map<string, EventChain>();
  
  constructor(config: Partial<RandomEventConfig> = {}) {
    super();
    
    this.config = {
      baseProbability: 0.15,
      rarityWeights: {
        common: 1.0,
        uncommon: 0.3,
        rare: 0.1,
        legendary: 0.02
      },
      typeWeights: {
        positive: 0.4,
        negative: 0.35,
        neutral: 0.25
      },
      minInterval: 2,
      maxInterval: 8,
      maxConcurrentEvents: 3,
      historyWeight: 0.1,
      ...config
    };
    
    this.initializeEventTemplates();
    this.initializeEventChains();
  }

  /**
   * 尝试触发随机事件
   */
  async tryTriggerEvent(context: EventContext): Promise<RandomEvent | null> {
    // 检查触发间隔
    const currentTime = Date.now();
    const timeSinceLastTrigger = currentTime - this.lastTriggerTime;
    const minIntervalMs = this.config.minInterval * 1000;
    
    if (timeSinceLastTrigger < minIntervalMs) {
      return null;
    }
    
    // 检查并发事件限制
    if (this.activeEvents.size >= this.config.maxConcurrentEvents) {
      return null;
    }
    
    // 计算触发概率
    const triggerProbability = this.calculateTriggerProbability(context);
    
    if (Math.random() > triggerProbability) {
      return null;
    }
    
    // 生成事件
    const generationResult = await this.generateEvent(context);
    
    if (!generationResult) {
      return null;
    }
    
    const event = generationResult.event;
    
    // 记录事件
    this.eventHistory.push(event);
    this.activeEvents.add(event.id);
    this.lastTriggerTime = currentTime;
    
    // 限制历史记录长度
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-50);
    }
    
    this.emit('eventGenerated', { event, context, generationResult });
    
    return event;
  }

  /**
   * 生成随机事件
   */
  async generateEvent(context: EventContext): Promise<EventGenerationResult | null> {
    // 尝试不同的生成方法
    const generators = [
      () => this.generateFromTemplate(context),
      () => this.generateDynamicEvent(context),
      () => this.generateChainEvent(context)
    ];
    
    // 按权重随机选择生成方法
    const weights = [0.6, 0.3, 0.1];
    const selectedGenerator = this.weightedRandomSelect(generators, weights);
    
    return selectedGenerator();
  }

  /**
   * 从模板生成事件
   */
  private generateFromTemplate(context: EventContext): EventGenerationResult | null {
    const eligibleTemplates = this.getEligibleTemplates(context);
    
    if (eligibleTemplates.length === 0) {
      return null;
    }
    
    // 按稀有度和类型权重选择模板
    const template = this.selectTemplateByWeight(eligibleTemplates, context);
    
    if (!template) {
      return null;
    }
    
    // 生成事件实例
    const event = this.instantiateEventFromTemplate(template, context);
    
    return {
      event,
      probability: this.calculateEventProbability(template.baseEvent, context),
      source: 'template',
      context
    };
  }

  /**
   * 动态生成事件
   */
  private generateDynamicEvent(context: EventContext): EventGenerationResult | null {
    // 基于当前游戏状态动态创建事件
    const dynamicEvents = this.createDynamicEvents(context);
    
    if (dynamicEvents.length === 0) {
      return null;
    }
    
    const event = dynamicEvents[Math.floor(Math.random() * dynamicEvents.length)];
    
    return {
      event,
      probability: this.calculateEventProbability(event, context),
      source: 'dynamic',
      context
    };
  }

  /**
   * 生成事件链事件
   */
  private generateChainEvent(context: EventContext): EventGenerationResult | null {
    // 检查是否有可以触发的事件链
    const eligibleChains = this.getEligibleEventChains(context);
    
    if (eligibleChains.length === 0) {
      return null;
    }
    
    const chain = eligibleChains[Math.floor(Math.random() * eligibleChains.length)];
    const nextEvent = this.getNextChainEvent(chain, context);
    
    if (!nextEvent) {
      return null;
    }
    
    return {
      event: nextEvent,
      probability: this.calculateEventProbability(nextEvent, context),
      source: 'chain',
      context
    };
  }

  /**
   * 计算触发概率
   */
  private calculateTriggerProbability(context: EventContext): number {
    let probability = this.config.baseProbability;

    const metrics: GameMetrics = {
      totalTurns: 0,
      averagePlayerWealth: 0,
      propertyDistribution: {},
      skillUsageFrequency: {},
      zodiacDistribution: {},
      ...(context.gameMetrics ?? {})
    };

    // 基于游戏进度调整
    const progressFactor = Math.min((metrics.totalTurns ?? 0) / 50, 1.0);
    probability *= (0.5 + progressFactor * 0.5);
    
    // 基于玩家状态调整
    const avgWealth = metrics.averagePlayerWealth ?? 0;
    if (avgWealth > 20000) {
      probability *= 1.2; // 更富有时事件更频繁
    } else if (avgWealth < 5000) {
      probability *= 0.8; // 贫困时事件较少
    }
    
    // 基于历史调整
    const recentEventCount = this.eventHistory.filter(e => 
      Date.now() - e.timestamp < 300000 // 5分钟内
    ).length;
    
    if (recentEventCount > 3) {
      probability *= 0.5; // 最近事件太多，降低概率
    }
    
    // 基于游戏阶段调整
    switch (context.gamePhase || 'mid') {
      case 'early':
        probability *= 0.8;
        break;
      case 'mid':
        probability *= 1.2;
        break;
      case 'late':
        probability *= 1.5;
        break;
    }
    
    return Math.min(probability, 0.8); // 最大80%
  }

  /**
   * 初始化事件模板
   */
  private initializeEventTemplates(): void {
    // 十二生肖特殊事件模板
    this.registerTemplate({
      id: 'zodiac_fortune',
      name: '生肖运势',
      description: '你的生肖为你带来了特殊的运势',
      category: 'zodiac',
      tags: ['positive', 'zodiac-specific'],
      generationRules: {
        valueRanges: {
          moneyBonus: [500, 2000],
          duration: [2, 5]
        },
        textVariations: {
          opening: [
            '今日星象对{zodiac}座特别有利',
            '{zodiac}座的守护神眷顾着你',
            '传说中{zodiac}座的力量觉醒了'
          ]
        },
        conditionalElements: [
          {
            condition: {
              type: 'player_money',
              operator: '<',
              value: 5000
            },
            modifications: {
              nameModifier: '雪中送炭',
              effectModifiers: [{
                value: (player: any) => Math.max(1000, player.money * 0.5)
              }]
            }
          }
        ]
      },
      baseEvent: {
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
            value: 1000
          }
        ]
      }
    });

    // 经济事件模板
    this.registerTemplate({
      id: 'market_fluctuation',
      name: '市场波动',
      description: '经济市场出现了意外波动',
      category: 'economic',
      tags: ['neutral', 'market'],
      generationRules: {
        valueRanges: {
          fluctuation: [-0.3, 0.3],
          affectedProperties: [1, 3]
        },
        textVariations: {
          eventType: ['股市震荡', '房地产波动', '货币政策变化', '国际贸易影响']
        },
        conditionalElements: []
      },
      baseEvent: {
        type: 'neutral',
        rarity: 'common',
        conditions: [
          {
            type: 'round_number',
            operator: '>',
            value: 10
          }
        ],
        effects: [],
        choices: [
          {
            id: 'hold_position',
            text: '保守观望',
            effects: [
              {
                type: 'money_change',
                target: 'self',
                value: 0
              }
            ]
          },
          {
            id: 'take_risk',
            text: '冒险投资',
            effects: [
              {
                type: 'money_change',
                target: 'self',
                value: (player: any) => Math.random() > 0.5 ? player.money * 0.1 : -player.money * 0.05
              }
            ]
          }
        ]
      }
    });

    // 社交事件模板
    this.registerTemplate({
      id: 'social_interaction',
      name: '社交互动',
      description: '与其他玩家发生了有趣的互动',
      category: 'social',
      tags: ['neutral', 'multiplayer'],
      generationRules: {
        valueRanges: {
          tradeAmount: [1000, 5000],
          relationshipChange: [-10, 10]
        },
        textVariations: {
          interactionType: ['商业合作', '友好竞争', '意外邂逅', '共同投资']
        },
        conditionalElements: [
          {
            condition: {
              type: 'player_properties',
              operator: '>',
              value: 2
            },
            modifications: {
              descriptionModifier: '作为成功的地产商，你有了更多的合作机会'
            }
          }
        ]
      },
      baseEvent: {
        type: 'neutral',
        rarity: 'common',
        conditions: [],
        effects: [],
        choices: [
          {
            id: 'cooperate',
            text: '选择合作',
            effects: [
              {
                type: 'money_change',
                target: 'self',
                value: 800
              },
              {
                type: 'money_change',
                target: 'random',
                value: 800
              }
            ]
          },
          {
            id: 'compete',
            text: '展开竞争',
            effects: [
              {
                type: 'skill_effect',
                target: 'self',
                value: {
                  type: 'temporary_boost',
                  property: 'negotiation',
                  modifier: 1.2,
                  duration: 2
                }
              }
            ]
          }
        ]
      }
    });
  }

  /**
   * 初始化事件链
   */
  private initializeEventChains(): void {
    // 经济危机事件链
    this.eventChains.set('economic_crisis', {
      id: 'economic_crisis',
      name: '经济危机连锁反应',
      events: [
        {
          id: 'crisis_warning',
          name: '危机警报',
          description: '经济学家警告即将出现危机',
          trigger: { roundDelay: 0 },
          effects: []
        },
        {
          id: 'market_crash',
          name: '市场崩盘',
          description: '股市和房地产市场同时暴跌',
          trigger: { roundDelay: 2 },
          effects: [
            {
              type: 'money_change',
              target: 'all',
              value: -2000
            }
          ]
        },
        {
          id: 'government_intervention',
          name: '政府救市',
          description: '政府出台救市政策',
          trigger: { roundDelay: 1 },
          effects: [
            {
              type: 'money_change',
              target: 'all',
              value: 1000
            }
          ]
        }
      ]
    });

    // 生肖年度庆典事件链
    this.eventChains.set('zodiac_festival', {
      id: 'zodiac_festival',
      name: '生肖年度庆典',
      events: [
        {
          id: 'festival_announcement',
          name: '庆典预告',
          description: '城市宣布即将举办生肖庆典',
          trigger: { roundDelay: 0 },
          effects: []
        },
        {
          id: 'festival_preparation',
          name: '庆典准备',
          description: '各处都在为庆典做准备，商机涌现',
          trigger: { roundDelay: 1 },
          effects: [
            {
              type: 'property_effect',
              target: 'all',
              value: {
                action: 'increase_rent',
                modifier: 1.2,
                duration: 3
              }
            }
          ]
        },
        {
          id: 'festival_celebration',
          name: '盛大庆典',
          description: '庆典正式开始，每个生肖都有特殊奖励',
          trigger: { roundDelay: 2 },
          effects: [
            {
              type: 'zodiac_bonus',
              target: 'all',
              value: {
                action: 'zodiac_specific_bonus',
                amount: 1500
              }
            }
          ]
        }
      ]
    });
  }

  /**
   * 注册事件模板
   */
  registerTemplate(template: EventTemplate): void {
    this.eventTemplates.set(template.id, template);
    this.emit('templateRegistered', template);
  }

  /**
   * 获取符合条件的模板
   */
  private getEligibleTemplates(context: EventContext): EventTemplate[] {
    const eligible: EventTemplate[] = [];
    
    for (const template of this.eventTemplates.values()) {
      if (this.isTemplateEligible(template, context)) {
        eligible.push(template);
      }
    }
    
    return eligible;
  }

  /**
   * 检查模板是否符合条件
   */
  private isTemplateEligible(template: EventTemplate, context: EventContext): boolean {
    // 检查基础条件
    for (const condition of template.baseEvent.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    
    // 检查历史重复
    const recentSameTemplate = this.eventHistory
      .filter(e => Date.now() - e.timestamp < 600000) // 10分钟内
      .find(e => e.id.startsWith(template.id));
    
    if (recentSameTemplate && template.baseEvent.rarity !== 'common') {
      return false;
    }
    
    return true;
  }

  /**
   * 按权重选择模板
   */
  private selectTemplateByWeight(templates: EventTemplate[], context: EventContext): EventTemplate | null {
    if (templates.length === 0) return null;
    
    const weights = templates.map(template => {
      let weight = this.config.rarityWeights[template.baseEvent.rarity];
      weight *= this.config.typeWeights[template.baseEvent.type];
      
      // 基于上下文调整权重
      weight *= this.calculateContextWeight(template, context);
      
      return weight;
    });
    
    return this.weightedRandomSelect(templates, weights);
  }

  /**
   * 计算上下文权重
   */
  private calculateContextWeight(template: EventTemplate, context: EventContext): number {
    let weight = 1.0;
    
    // 基于游戏阶段调整
    if (template.tags.includes('early-game') && context.gamePhase !== 'early') {
      weight *= 0.3;
    }
    
    if (template.tags.includes('late-game') && context.gamePhase !== 'late') {
      weight *= 0.3;
    }
    
    // 基于玩家状态调整
    const currentPlayer = context.playerStates.find(p => p.id === context.currentPlayerId);
    if (currentPlayer) {
      if (template.tags.includes('wealth-dependent') && currentPlayer.money < 10000) {
        weight *= 0.5;
      }
      
      if (template.tags.includes('property-dependent') && currentPlayer.properties.length < 2) {
        weight *= 0.5;
      }
    }
    
    return weight;
  }

  /**
   * 从模板实例化事件
   */
  private instantiateEventFromTemplate(template: EventTemplate, context: EventContext): RandomEvent {
    const rules = template.generationRules;
    const baseEvent = { ...template.baseEvent };
    
    // 生成唯一ID
    const eventId = `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 应用值范围
    const generatedValues: any = {};
    for (const [key, range] of Object.entries(rules.valueRanges)) {
      generatedValues[key] = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    }
    
    // 生成文本变化
    let name = template.name;
    let description = template.description;
    
    for (const [key, variations] of Object.entries(rules.textVariations)) {
      const selected = variations[Math.floor(Math.random() * variations.length)];
      description = description.replace(`{${key}}`, selected);
    }
    
    // 应用条件元素
    const currentPlayer = context.playerStates.find(p => p.id === context.currentPlayerId);
    for (const element of rules.conditionalElements) {
      if (this.evaluateCondition(element.condition, context)) {
        if (element.modifications.nameModifier) {
          name = element.modifications.nameModifier;
        }
        if (element.modifications.descriptionModifier) {
          description = element.modifications.descriptionModifier;
        }
      }
    }
    
    // 插值替换
    name = this.interpolateText(name, context, generatedValues);
    description = this.interpolateText(description, context, generatedValues);
    
    return {
      ...baseEvent,
      id: eventId,
      name,
      description,
      timestamp: Date.now()
    };
  }

  /**
   * 文本插值
   */
  private interpolateText(text: string, context: EventContext, values: any): string {
    const currentPlayer = context.playerStates.find(p => p.id === context.currentPlayerId);
    
    return text
      .replace(/\{zodiac\}/g, currentPlayer?.zodiac || '未知')
      .replace(/\{playerName\}/g, currentPlayer?.name || '玩家')
      .replace(/\{(\w+)\}/g, (match, key) => values[key]?.toString() || match);
  }

  /**
   * 创建动态事件
   */
  private createDynamicEvents(context: EventContext): RandomEvent[] {
    const events: RandomEvent[] = [];
    const currentPlayer = context.playerStates.find(p => p.id === context.currentPlayerId);
    
    if (!currentPlayer) return events;
    
    // 基于玩家财富创建事件
    if (currentPlayer.money > 15000) {
      events.push({
        id: `wealthy_opportunity_${Date.now()}`,
        name: '富豪机遇',
        description: `作为城中富豪，你获得了投资${Math.floor(currentPlayer.money * 0.1)}金币的机会`,
        type: 'neutral',
        rarity: 'uncommon',
        conditions: [],
        effects: [],
        choices: [
          {
            id: 'invest',
            text: '投资',
            effects: [
              {
                type: 'money_change',
                target: 'self',
                value: Math.random() > 0.6 ? currentPlayer.money * 0.15 : -currentPlayer.money * 0.1
              }
            ]
          },
          {
            id: 'decline',
            text: '谢绝',
            effects: []
          }
        ],
        timestamp: Date.now()
      });
    }
    
    // 基于房产数量创建事件
    if (currentPlayer.properties.length >= 3) {
      events.push({
        id: `property_mogul_${Date.now()}`,
        name: '地产大亨',
        description: '作为地产大亨，你可以选择升级一处房产',
        type: 'positive',
        rarity: 'rare',
        conditions: [],
        effects: [
          {
            type: 'property_effect',
            target: 'self',
            value: {
              action: 'upgrade_choice',
              count: 1
            }
          }
        ],
        timestamp: Date.now()
      });
    }
    
    return events;
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: EventCondition, context: EventContext): boolean {
    const currentPlayer = context.playerStates.find(p => p.id === context.currentPlayerId);
    
    switch (condition.type) {
      case 'player_money':
        return currentPlayer && this.compareValues(currentPlayer.money, condition.operator, condition.value);
      case 'player_position':
        return currentPlayer && this.compareValues(currentPlayer.position, condition.operator, condition.value);
      case 'player_properties':
        return currentPlayer && this.compareValues(currentPlayer.properties.length, condition.operator, condition.value);
      case 'round_number':
        return this.compareValues(context.gameMetrics.totalTurns, condition.operator, condition.value);
      case 'zodiac_match':
        return currentPlayer && currentPlayer.zodiac === condition.value;
      default:
        return true;
    }
  }

  /**
   * 比较值
   */
  private compareValues(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case '>': return left > right;
      case '<': return left < right;
      case '=': return left === right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      case '!=': return left !== right;
      default: return false;
    }
  }

  /**
   * 权重随机选择
   */
  private weightedRandomSelect<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  /**
   * 计算事件概率
   */
  private calculateEventProbability(event: RandomEvent, context: EventContext): number {
    let probability = this.config.rarityWeights[event.rarity];
    probability *= this.config.typeWeights[event.type];
    
    // 基于历史调整
    const sameTypeCount = this.eventHistory
      .filter(e => e.type === event.type && Date.now() - e.timestamp < 1800000) // 30分钟内
      .length;
    
    probability *= Math.pow(0.8, sameTypeCount);
    
    return Math.min(probability, 1.0);
  }

  /**
   * 获取符合条件的事件链
   */
  private getEligibleEventChains(context: EventContext): EventChain[] {
    // 简化实现，返回空数组
    return [];
  }

  /**
   * 获取事件链的下一个事件
   */
  private getNextChainEvent(chain: EventChain, context: EventContext): RandomEvent | null {
    // 简化实现，返回null
    return null;
  }

  /**
   * 事件完成处理
   */
  completeEvent(eventId: string): void {
    this.activeEvents.delete(eventId);
    this.emit('eventCompleted', { eventId });
  }

  /**
   * 获取事件历史
   */
  getEventHistory(limit = 50): RandomEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * 获取系统统计
   */
  getSystemStats(): any {
    return {
      totalEventsGenerated: this.eventHistory.length,
      activeEvents: this.activeEvents.size,
      registeredTemplates: this.eventTemplates.size,
      eventChains: this.eventChains.size,
      lastTriggerTime: this.lastTriggerTime,
      config: this.config
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.eventTemplates.clear();
    this.eventChains.clear();
    this.eventHistory = [];
    this.activeEvents.clear();
    this.removeAllListeners();
  }
}

// 事件链接口
interface EventChain {
  id: string;
  name: string;
  events: ChainEvent[];
}

interface ChainEvent {
  id: string;
  name: string;
  description: string;
  trigger: {
    roundDelay: number;
    condition?: EventCondition;
  };
  effects: EventEffect[];
}
