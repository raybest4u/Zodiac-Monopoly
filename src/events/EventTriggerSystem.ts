/**
 * 游戏事件触发系统 - 增强的事件触发机制
 * 支持条件触发、延迟触发、链式触发等高级功能
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { GameEvent, EventType, EventPriority, RandomEvent } from './EventSystem';

export interface TriggerCondition {
  id: string;
  type: 'time_based' | 'state_based' | 'action_based' | 'probability_based' | 'composite';
  conditions: ConditionRule[];
  operator?: 'AND' | 'OR';
}

export interface ConditionRule {
  field: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'in' | 'exists';
  value: any;
  target?: 'player' | 'game' | 'board' | 'global';
  playerId?: string;
}

export interface EventTrigger {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // 触发条件
  conditions: TriggerCondition[];
  
  // 触发时机
  timing: {
    type: 'immediate' | 'delayed' | 'scheduled' | 'recursive';
    delay?: number; // 毫秒
    schedule?: string; // cron表达式或简单时间表达
    maxOccurrences?: number;
    cooldown?: number; // 冷却时间
  };
  
  // 触发概率
  probability?: number; // 0-1之间
  
  // 要触发的事件
  events: EventToTrigger[];
  
  // 触发后的行为
  postTriggerActions?: PostTriggerAction[];
  
  // 统计信息
  stats: {
    triggeredCount: number;
    lastTriggered?: number;
    successRate: number;
  };
}

export interface EventToTrigger {
  eventType: EventType;
  data: any;
  priority: EventPriority;
  delay?: number;
  conditions?: ConditionRule[]; // 额外的运行时条件
}

export interface PostTriggerAction {
  type: 'disable_trigger' | 'modify_probability' | 'add_cooldown' | 'log_event' | 'notify_player';
  parameters: any;
}

export interface EventChain {
  id: string;
  name: string;
  triggers: EventTrigger[];
  chainConditions: ChainCondition[];
}

export interface ChainCondition {
  previousEventId: string;
  nextEventId: string;
  condition?: ConditionRule[];
  delay?: number;
  probability?: number;
}

/**
 * 事件触发系统主类
 */
export class EventTriggerSystem extends EventEmitter {
  private triggers = new Map<string, EventTrigger>();
  private eventChains = new Map<string, EventChain>();
  private scheduledTriggers = new Map<string, NodeJS.Timeout>();
  private triggerHistory: Array<{ triggerId: string; timestamp: number; success: boolean }> = [];
  private globalCooldowns = new Map<string, number>();
  private periodicCheckHandle?: NodeJS.Timeout;
  
  constructor(private gameStateProvider: () => any = () => ({})) {
    super();
    this.setupPeriodicChecks();
  }

  /**
   * 注册事件触发器
   */
  registerTrigger(trigger: EventTrigger): void {
    // 验证触发器配置
    if (!this.validateTrigger(trigger)) {
      throw new Error(`Invalid trigger configuration: ${trigger.id}`);
    }

    this.triggers.set(trigger.id, {
      ...trigger,
      stats: {
        triggeredCount: 0,
        successRate: 1.0
      }
    });

    // 如果是定时触发，设置调度
    if (trigger.timing.type === 'scheduled' && trigger.timing.schedule) {
      this.scheduleRecurringTrigger(trigger);
    }

    this.emit('triggerRegistered', trigger);
  }

  /**
   * 移除事件触发器
   */
  unregisterTrigger(triggerId: string): void {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return;

    // 清除定时任务
    const scheduled = this.scheduledTriggers.get(triggerId);
    if (scheduled) {
      clearTimeout(scheduled);
      this.scheduledTriggers.delete(triggerId);
    }

    this.triggers.delete(triggerId);
    this.emit('triggerUnregistered', { triggerId });
  }

  /**
   * 注册事件链
   */
  registerEventChain(chain: EventChain): void {
    this.eventChains.set(chain.id, chain);
    
    // 注册链中的所有触发器
    chain.triggers.forEach(trigger => {
      this.registerTrigger(trigger);
    });

    this.emit('eventChainRegistered', chain);
  }

  /**
   * 检查并触发所有满足条件的触发器
   */
  async checkTriggers(context: TriggerContext): Promise<string[]> {
    const triggeredIds: string[] = [];
    const gameState = this.gameStateProvider();

    for (const [triggerId, trigger] of this.triggers.entries()) {
      if (!trigger.enabled) continue;
      
      // 检查冷却时间
      if (this.isInCooldown(triggerId)) continue;
      
      // 检查触发条件
      if (await this.evaluateConditions(trigger.conditions, context, gameState)) {
        // 检查概率
        if (trigger.probability && Math.random() > trigger.probability) {
          continue;
        }
        
        // 执行触发
        const success = await this.executeTrigger(trigger, context);
        if (success) {
          triggeredIds.push(triggerId);
        }
        
        // 记录统计信息
        this.updateTriggerStats(triggerId, success);
      }
    }

    return triggeredIds;
  }

  /**
   * 手动触发指定的触发器
   */
  async forceTrigger(triggerId: string, context: TriggerContext): Promise<boolean> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return false;

    return await this.executeTrigger(trigger, context);
  }

  /**
   * 基于游戏动作触发事件
   */
  async onGameAction(actionType: string, actionData: any): Promise<string[]> {
    const context: TriggerContext = {
      type: 'action_based',
      actionType,
      actionData,
      timestamp: Date.now(),
      gameState: this.gameStateProvider()
    };

    return await this.checkTriggers(context);
  }

  /**
   * 基于游戏状态变化触发事件
   */
  async onStateChange(stateChanges: any): Promise<string[]> {
    const context: TriggerContext = {
      type: 'state_based',
      stateChanges,
      timestamp: Date.now(),
      gameState: this.gameStateProvider()
    };

    return await this.checkTriggers(context);
  }

  /**
   * 基于时间触发事件
   */
  async onTimeEvent(timeData: any): Promise<string[]> {
    const context: TriggerContext = {
      type: 'time_based',
      timeData,
      timestamp: Date.now(),
      gameState: this.gameStateProvider()
    };

    return await this.checkTriggers(context);
  }

  // 私有方法

  /**
   * 验证触发器配置
   */
  private validateTrigger(trigger: EventTrigger): boolean {
    if (!trigger.id || !trigger.name) return false;
    if (!trigger.conditions || trigger.conditions.length === 0) return false;
    if (!trigger.events || trigger.events.length === 0) return false;
    return true;
  }

  /**
   * 评估触发条件
   */
  private async evaluateConditions(
    conditions: TriggerCondition[], 
    context: TriggerContext, 
    gameState: any
  ): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context, gameState);
      if (!result) return false;
    }
    return true;
  }

  /**
   * 评估单个条件
   */
  private async evaluateCondition(
    condition: TriggerCondition, 
    context: TriggerContext, 
    gameState: any
  ): Promise<boolean> {
    const results: boolean[] = [];

    for (const rule of condition.conditions) {
      const ruleResult = this.evaluateRule(rule, context, gameState);
      results.push(ruleResult);
    }

    // 根据操作符合并结果
    return condition.operator === 'OR' 
      ? results.some(r => r)
      : results.every(r => r);
  }

  /**
   * 评估单个规则
   */
  private evaluateRule(rule: ConditionRule, context: TriggerContext, gameState: any): boolean {
    let targetValue: any;

    // 获取目标值
    switch (rule.target) {
      case 'player':
        const player = rule.playerId 
          ? gameState.players.find((p: any) => p.id === rule.playerId)
          : gameState.players[gameState.currentPlayerIndex];
        targetValue = this.getNestedValue(player, rule.field);
        break;
      case 'game':
        targetValue = this.getNestedValue(gameState, rule.field);
        break;
      case 'board':
        targetValue = this.getNestedValue(gameState.board, rule.field);
        break;
      case 'global':
        targetValue = this.getNestedValue(context, rule.field);
        break;
      default:
        targetValue = this.getNestedValue(context, rule.field);
    }

    // 执行比较
    return this.compareValues(targetValue, rule.operator, rule.value);
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
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
      case 'contains': return Array.isArray(left) ? left.includes(right) : String(left).includes(String(right));
      case 'in': return Array.isArray(right) ? right.includes(left) : false;
      case 'exists': return left !== undefined && left !== null;
      default: return false;
    }
  }

  /**
   * 执行触发器
   */
  private async executeTrigger(trigger: EventTrigger, context: TriggerContext): Promise<boolean> {
    try {
      // 执行前置动作
      await this.executePreTriggerActions(trigger, context);

      // 根据时机类型处理
      switch (trigger.timing.type) {
        case 'immediate':
          await this.triggerEvents(trigger.events, context);
          break;
        case 'delayed':
          setTimeout(() => {
            this.triggerEvents(trigger.events, context);
          }, trigger.timing.delay || 0);
          break;
        case 'scheduled':
          // 已在注册时处理
          break;
      }

      // 执行后置动作
      await this.executePostTriggerActions(trigger, context);

      // 设置冷却时间
      if (trigger.timing.cooldown) {
        this.globalCooldowns.set(trigger.id, Date.now() + trigger.timing.cooldown);
      }

      this.emit('triggerExecuted', { trigger, context });
      return true;

    } catch (error) {
      console.error(`Error executing trigger ${trigger.id}:`, error);
      this.emit('triggerError', { trigger, context, error });
      return false;
    }
  }

  /**
   * 触发事件组
   */
  private async triggerEvents(events: EventToTrigger[], context: TriggerContext): Promise<void> {
    for (const eventConfig of events) {
      // 延迟处理
      const delay = eventConfig.delay || 0;
      
      setTimeout(() => {
        // 检查运行时条件
        if (eventConfig.conditions && !this.evaluateRuntimeConditions(eventConfig.conditions, context)) {
          return;
        }

        // 触发事件
        this.emit('eventTriggered', {
          type: eventConfig.eventType,
          data: eventConfig.data,
          priority: eventConfig.priority,
          context
        });
      }, delay);
    }
  }

  /**
   * 评估运行时条件
   */
  private evaluateRuntimeConditions(conditions: ConditionRule[], context: TriggerContext): boolean {
    const gameState = this.gameStateProvider();
    return conditions.every(rule => this.evaluateRule(rule, context, gameState));
  }

  /**
   * 执行前置动作
   */
  private async executePreTriggerActions(trigger: EventTrigger, context: TriggerContext): Promise<void> {
    // 可以在这里添加前置逻辑，比如记录日志、验证状态等
  }

  /**
   * 执行后置动作
   */
  private async executePostTriggerActions(trigger: EventTrigger, context: TriggerContext): Promise<void> {
    if (!trigger.postTriggerActions) return;

    for (const action of trigger.postTriggerActions) {
      switch (action.type) {
        case 'disable_trigger':
          trigger.enabled = false;
          break;
        case 'modify_probability':
          if (trigger.probability) {
            trigger.probability = Math.max(0, Math.min(1, trigger.probability + action.parameters.change));
          }
          break;
        case 'add_cooldown':
          this.globalCooldowns.set(trigger.id, Date.now() + action.parameters.duration);
          break;
        case 'log_event':
          console.log(`Trigger ${trigger.id} executed:`, action.parameters.message);
          break;
        case 'notify_player':
          this.emit('playerNotification', {
            playerId: action.parameters.playerId,
            message: action.parameters.message,
            type: action.parameters.type || 'info'
          });
          break;
      }
    }
  }

  /**
   * 检查是否在冷却时间内
   */
  private isInCooldown(triggerId: string): boolean {
    const cooldownEnd = this.globalCooldowns.get(triggerId);
    return cooldownEnd ? Date.now() < cooldownEnd : false;
  }

  /**
   * 更新触发器统计信息
   */
  private updateTriggerStats(triggerId: string, success: boolean): void {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return;

    trigger.stats.triggeredCount++;
    trigger.stats.lastTriggered = Date.now();
    
    // 更新成功率（使用指数移动平均）
    const alpha = 0.1; // 平滑因子
    trigger.stats.successRate = alpha * (success ? 1 : 0) + (1 - alpha) * trigger.stats.successRate;

    this.triggerHistory.push({
      triggerId,
      timestamp: Date.now(),
      success
    });

    // 限制历史记录长度
    if (this.triggerHistory.length > 1000) {
      this.triggerHistory = this.triggerHistory.slice(-500);
    }
  }

  /**
   * 设置周期性检查
   */
  private setupPeriodicChecks(): void {
    // 每秒检查时间触发条件
    this.periodicCheckHandle = setInterval(() => {
      this.onTimeEvent({ timestamp: Date.now() });
    }, 1000);
  }

  /**
   * 设置定期触发器
   */
  private scheduleRecurringTrigger(trigger: EventTrigger): void {
    // 简化的调度实现，可以扩展支持完整的cron表达式
    if (trigger.timing.schedule && trigger.timing.schedule.includes('every')) {
      const match = trigger.timing.schedule.match(/every (\d+) (seconds?|minutes?|hours?)/);
      if (match) {
        const interval = parseInt(match[1]);
        const unit = match[2];
        
        let milliseconds = interval * 1000;
        if (unit.startsWith('minute')) milliseconds *= 60;
        if (unit.startsWith('hour')) milliseconds *= 3600;

        const intervalId = setInterval(() => {
          this.forceTrigger(trigger.id, {
            type: 'time_based',
            timestamp: Date.now(),
            gameState: this.gameStateProvider()
          });
        }, milliseconds);

        this.scheduledTriggers.set(trigger.id, intervalId);
      }
    }
  }

  /**
   * 获取触发器统计信息
   */
  getTriggerStats(triggerId?: string): any {
    if (triggerId) {
      const trigger = this.triggers.get(triggerId);
      return trigger ? trigger.stats : null;
    }

    // 返回所有触发器的统计信息
    const stats: any = {};
    for (const [id, trigger] of this.triggers.entries()) {
      stats[id] = trigger.stats;
    }
    return stats;
  }

  /**
   * 获取触发历史
   */
  getTriggerHistory(limit = 100): Array<{ triggerId: string; timestamp: number; success: boolean }> {
    return this.triggerHistory.slice(-limit);
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 清除所有定时任务
    for (const intervalId of this.scheduledTriggers.values()) {
      clearInterval(intervalId);
    }
    this.scheduledTriggers.clear();
    if (this.periodicCheckHandle) {
      clearInterval(this.periodicCheckHandle);
      this.periodicCheckHandle = undefined;
    }
    this.triggers.clear();
    this.eventChains.clear();
    this.removeAllListeners();
  }
}

export interface TriggerContext {
  type: 'time_based' | 'state_based' | 'action_based' | 'probability_based';
  timestamp: number;
  gameState: any;
  actionType?: string;
  actionData?: any;
  stateChanges?: any;
  timeData?: any;
}
