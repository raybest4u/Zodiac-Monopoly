/**
 * 事件响应系统 - 处理事件的各种响应和反应
 * 包括UI响应、游戏状态响应、AI响应、动画响应等
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { GameEvent, EventType, EventPriority } from './EventSystem';

export type ResponseType = 
  | 'ui_update' 
  | 'animation' 
  | 'sound_effect' 
  | 'state_change' 
  | 'ai_reaction' 
  | 'player_notification'
  | 'achievement_unlock'
  | 'statistical_update'
  | 'network_sync'
  | 'persistence';

export interface EventResponse {
  id: string;
  name: string;
  type: ResponseType;
  eventTypes: EventType[];
  
  // 响应条件
  conditions?: ResponseCondition[];
  
  // 响应配置
  config: ResponseConfig;
  
  // 响应优先级
  priority: number;
  
  // 响应延迟
  delay?: number;
  
  // 响应持续时间
  duration?: number;
  
  // 是否一次性
  once?: boolean;
  
  // 启用状态
  enabled: boolean;
  
  // 统计信息
  stats: {
    triggered: number;
    lastTriggered?: number;
    averageDelay: number;
    successRate: number;
  };
}

export interface ResponseCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'exists';
  value: any;
  target: 'event' | 'player' | 'game' | 'global';
}

export interface ResponseConfig {
  // UI更新配置
  ui?: {
    component?: string;
    action: string;
    parameters: any;
    transition?: {
      type: 'fade' | 'slide' | 'scale' | 'bounce';
      duration: number;
      easing?: string;
    };
  };
  
  // 动画配置
  animation?: {
    type: string;
    target: string;
    properties: Record<string, any>;
    duration: number;
    delay?: number;
    easing?: string;
    loop?: boolean | number;
  };
  
  // 音效配置
  audio?: {
    soundId: string;
    volume?: number;
    pitch?: number;
    loop?: boolean;
    fadeIn?: number;
    fadeOut?: number;
  };
  
  // 状态变更配置
  stateChange?: {
    target: string;
    action: 'set' | 'increment' | 'decrement' | 'toggle' | 'push' | 'pop';
    value?: any;
    path?: string;
  };
  
  // 通知配置
  notification?: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    actions?: NotificationAction[];
  };
  
  // 成就配置
  achievement?: {
    id: string;
    title: string;
    description: string;
    icon?: string;
    points?: number;
  };
  
  // 自定义配置
  custom?: any;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  parameters?: any;
}

export interface ResponseContext {
  event: GameEvent;
  gameState: any;
  playerState: any;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface ResponseResult {
  success: boolean;
  responseId: string;
  duration: number;
  data?: any;
  error?: Error;
  warnings?: string[];
}

/**
 * 事件响应系统主类
 */
export class EventResponseSystem extends EventEmitter {
  private responses = new Map<string, EventResponse>();
  private responseQueue: Array<{ response: EventResponse; context: ResponseContext }> = [];
  private activeResponses = new Map<string, NodeJS.Timeout>();
  private isProcessing = false;

  constructor() {
    super();
    this.initializeDefaultResponses();
    this.startResponseLoop();
  }

  /**
   * 注册事件响应
   */
  registerResponse(response: EventResponse): void {
    this.validateResponse(response);
    
    this.responses.set(response.id, {
      ...response,
      stats: {
        triggered: 0,
        averageDelay: 0,
        successRate: 1.0
      }
    });

    this.emit('responseRegistered', response);
  }

  /**
   * 移除事件响应
   */
  unregisterResponse(responseId: string): void {
    // 清除活动响应
    const activeTimeout = this.activeResponses.get(responseId);
    if (activeTimeout) {
      clearTimeout(activeTimeout);
      this.activeResponses.delete(responseId);
    }

    this.responses.delete(responseId);
    this.emit('responseUnregistered', { responseId });
  }

  /**
   * 处理事件，触发相应的响应
   */
  async handleEvent(event: GameEvent, gameState: any, playerState: any): Promise<ResponseResult[]> {
    const context: ResponseContext = {
      event,
      gameState,
      playerState,
      timestamp: Date.now(),
      metadata: {}
    };

    const applicableResponses = this.getApplicableResponses(event);
    const results: ResponseResult[] = [];

    for (const response of applicableResponses) {
      if (this.shouldTriggerResponse(response, context)) {
        const result = await this.triggerResponse(response, context);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * 手动触发响应
   */
  async triggerResponse(response: EventResponse, context: ResponseContext): Promise<ResponseResult> {
    const startTime = Date.now();
    
    try {
      // 应用延迟
      if (response.delay && response.delay > 0) {
        await this.sleep(response.delay);
      }

      // 执行响应
      const result = await this.executeResponse(response, context);
      
      const duration = Date.now() - startTime;
      this.updateResponseStats(response, true, duration);
      
      // 如果是一次性响应，禁用它
      if (response.once) {
        response.enabled = false;
      }

      this.emit('responseTriggered', { response, context, result });
      
      return {
        success: true,
        responseId: response.id,
        duration,
        data: result
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateResponseStats(response, false, duration);
      
      const responseResult: ResponseResult = {
        success: false,
        responseId: response.id,
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      };

      this.emit('responseError', { response, context, error });
      return responseResult;
    }
  }

  /**
   * 批量处理多个事件
   */
  async handleEventBatch(events: GameEvent[], gameState: any, playerState: any): Promise<ResponseResult[]> {
    const allResults: ResponseResult[] = [];
    
    for (const event of events) {
      const results = await this.handleEvent(event, gameState, playerState);
      allResults.push(...results);
    }

    return allResults;
  }

  // 私有方法

  /**
   * 初始化默认响应
   */
  private initializeDefaultResponses(): void {
    // 骰子投掷音效响应
    this.registerResponse({
      id: 'dice_roll_sound',
      name: '骰子音效',
      type: 'sound_effect',
      eventTypes: ['dice_rolled'],
      priority: 1,
      enabled: true,
      config: {
        audio: {
          soundId: 'dice_roll',
          volume: 0.8
        }
      },
      stats: { triggered: 0, averageDelay: 0, successRate: 1.0 }
    });

    // 金币变化动画响应
    this.registerResponse({
      id: 'money_change_animation',
      name: '金币变化动画',
      type: 'animation',
      eventTypes: ['rent_paid', 'property_purchased'],
      priority: 2,
      enabled: true,
      config: {
        animation: {
          type: 'money_flow',
          target: 'player',
          properties: {
            amount: '${event.data.amount}',
            from: '${event.data.from}',
            to: '${event.data.to}'
          },
          duration: 1000,
          easing: 'ease-out'
        }
      },
      stats: { triggered: 0, averageDelay: 0, successRate: 1.0 }
    });

    // 玩家移动动画响应
    this.registerResponse({
      id: 'player_move_animation',
      name: '玩家移动动画',
      type: 'animation',
      eventTypes: ['player_moved'],
      priority: 3,
      enabled: true,
      config: {
        animation: {
          type: 'player_move',
          target: 'player',
          properties: {
            playerId: '${event.playerId}',
            fromPosition: '${event.data.fromPosition}',
            toPosition: '${event.data.toPosition}',
            path: '${event.data.path}'
          },
          duration: 800,
          easing: 'ease-in-out'
        }
      },
      stats: { triggered: 0, averageDelay: 0, successRate: 1.0 }
    });

    // 房产购买通知响应
    this.registerResponse({
      id: 'property_purchase_notification',
      name: '房产购买通知',
      type: 'player_notification',
      eventTypes: ['property_purchased'],
      priority: 1,
      enabled: true,
      config: {
        notification: {
          title: '房产购买',
          message: '${event.data.playerName} 购买了 ${event.data.propertyName}',
          type: 'success',
          duration: 3000
        }
      },
      stats: { triggered: 0, averageDelay: 0, successRate: 1.0 }
    });

    // 技能使用特效响应
    this.registerResponse({
      id: 'skill_effect_animation',
      name: '技能特效',
      type: 'animation',
      eventTypes: ['skill_used'],
      priority: 2,
      enabled: true,
      config: {
        animation: {
          type: 'skill_effect',
          target: 'player',
          properties: {
            skillId: '${event.data.skillId}',
            playerId: '${event.playerId}',
            zodiac: '${event.data.zodiac}'
          },
          duration: 2000,
          easing: 'ease-out'
        }
      },
      stats: { triggered: 0, averageDelay: 0, successRate: 1.0 }
    });

    // 游戏结束响应
    this.registerResponse({
      id: 'game_over_response',
      name: '游戏结束响应',
      type: 'ui_update',
      eventTypes: ['game_over'],
      priority: 10,
      enabled: true,
      config: {
        ui: {
          component: 'GameOverModal',
          action: 'show',
          parameters: {
            winner: '${event.data.winner}',
            finalStats: '${event.data.finalStats}'
          },
          transition: {
            type: 'fade',
            duration: 500
          }
        }
      },
      stats: { triggered: 0, averageDelay: 0, successRate: 1.0 }
    });
  }

  /**
   * 验证响应配置
   */
  private validateResponse(response: EventResponse): void {
    if (!response.id || !response.name || !response.type) {
      throw new Error('Response must have id, name, and type');
    }
    
    if (!response.eventTypes || response.eventTypes.length === 0) {
      throw new Error('Response must specify event types');
    }
    
    if (!response.config) {
      throw new Error('Response must have configuration');
    }
  }

  /**
   * 获取适用的响应
   */
  private getApplicableResponses(event: GameEvent): EventResponse[] {
    const applicable: EventResponse[] = [];
    
    for (const response of this.responses.values()) {
      if (!response.enabled) continue;
      
      if (response.eventTypes.includes(event.type) || response.eventTypes.includes('*' as EventType)) {
        applicable.push(response);
      }
    }
    
    // 按优先级排序
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 检查是否应该触发响应
   */
  private shouldTriggerResponse(response: EventResponse, context: ResponseContext): boolean {
    // 检查条件
    if (response.conditions) {
      for (const condition of response.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: ResponseCondition, context: ResponseContext): boolean {
    let targetValue: any;
    
    switch (condition.target) {
      case 'event':
        targetValue = this.getNestedValue(context.event, condition.field);
        break;
      case 'player':
        targetValue = this.getNestedValue(context.playerState, condition.field);
        break;
      case 'game':
        targetValue = this.getNestedValue(context.gameState, condition.field);
        break;
      case 'global':
        targetValue = this.getNestedValue(context, condition.field);
        break;
      default:
        return false;
    }
    
    return this.compareValues(targetValue, condition.operator, condition.value);
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
      case '=': return left === right;
      case '!=': return left !== right;
      case '>': return left > right;
      case '<': return left < right;
      case '>=': return left >= right;
      case '<=': return left <= right;
      case 'contains': return Array.isArray(left) ? left.includes(right) : String(left).includes(String(right));
      case 'exists': return left !== undefined && left !== null;
      default: return false;
    }
  }

  /**
   * 执行响应
   */
  private async executeResponse(response: EventResponse, context: ResponseContext): Promise<any> {
    const config = response.config;
    const results: any = {};

    // 处理UI更新
    if (config.ui) {
      results.ui = await this.executeUIResponse(config.ui, context);
    }

    // 处理动画
    if (config.animation) {
      results.animation = await this.executeAnimationResponse(config.animation, context);
    }

    // 处理音效
    if (config.audio) {
      results.audio = await this.executeAudioResponse(config.audio, context);
    }

    // 处理状态变更
    if (config.stateChange) {
      results.stateChange = await this.executeStateChangeResponse(config.stateChange, context);
    }

    // 处理通知
    if (config.notification) {
      results.notification = await this.executeNotificationResponse(config.notification, context);
    }

    // 处理成就
    if (config.achievement) {
      results.achievement = await this.executeAchievementResponse(config.achievement, context);
    }

    // 处理自定义响应
    if (config.custom) {
      results.custom = await this.executeCustomResponse(config.custom, context);
    }

    return results;
  }

  /**
   * 执行UI响应
   */
  private async executeUIResponse(uiConfig: any, context: ResponseContext): Promise<any> {
    const parameters = this.interpolateValues(uiConfig.parameters, context);
    
    this.emit('uiResponse', {
      component: uiConfig.component,
      action: uiConfig.action,
      parameters,
      transition: uiConfig.transition
    });

    return { component: uiConfig.component, action: uiConfig.action };
  }

  /**
   * 执行动画响应
   */
  private async executeAnimationResponse(animationConfig: any, context: ResponseContext): Promise<any> {
    const properties = this.interpolateValues(animationConfig.properties, context);
    
    this.emit('animationResponse', {
      type: animationConfig.type,
      target: animationConfig.target,
      properties,
      duration: animationConfig.duration,
      delay: animationConfig.delay,
      easing: animationConfig.easing,
      loop: animationConfig.loop
    });

    return { type: animationConfig.type, duration: animationConfig.duration };
  }

  /**
   * 执行音效响应
   */
  private async executeAudioResponse(audioConfig: any, context: ResponseContext): Promise<any> {
    this.emit('audioResponse', audioConfig);
    return { soundId: audioConfig.soundId };
  }

  /**
   * 执行状态变更响应
   */
  private async executeStateChangeResponse(stateConfig: any, context: ResponseContext): Promise<any> {
    const value = this.interpolateValues(stateConfig.value, context);
    
    this.emit('stateChangeResponse', {
      target: stateConfig.target,
      action: stateConfig.action,
      value,
      path: stateConfig.path
    });

    return { target: stateConfig.target, action: stateConfig.action };
  }

  /**
   * 执行通知响应
   */
  private async executeNotificationResponse(notificationConfig: any, context: ResponseContext): Promise<any> {
    const message = this.interpolateValues(notificationConfig.message, context);
    const title = this.interpolateValues(notificationConfig.title, context);
    
    this.emit('notificationResponse', {
      title,
      message,
      type: notificationConfig.type,
      duration: notificationConfig.duration,
      actions: notificationConfig.actions
    });

    return { title, message, type: notificationConfig.type };
  }

  /**
   * 执行成就响应
   */
  private async executeAchievementResponse(achievementConfig: any, context: ResponseContext): Promise<any> {
    this.emit('achievementResponse', achievementConfig);
    return { id: achievementConfig.id, title: achievementConfig.title };
  }

  /**
   * 执行自定义响应
   */
  private async executeCustomResponse(customConfig: any, context: ResponseContext): Promise<any> {
    this.emit('customResponse', { config: customConfig, context });
    return customConfig;
  }

  /**
   * 插值处理变量
   */
  private interpolateValues(template: any, context: ResponseContext): any {
    if (typeof template === 'string') {
      return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
        const value = this.getNestedValue(context, path);
        return value !== undefined ? String(value) : match;
      });
    }
    
    if (Array.isArray(template)) {
      return template.map(item => this.interpolateValues(item, context));
    }
    
    if (typeof template === 'object' && template !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.interpolateValues(value, context);
      }
      return result;
    }
    
    return template;
  }

  /**
   * 更新响应统计信息
   */
  private updateResponseStats(response: EventResponse, success: boolean, duration: number): void {
    response.stats.triggered++;
    response.stats.lastTriggered = Date.now();
    
    // 更新平均延迟
    const totalDelay = response.stats.averageDelay * (response.stats.triggered - 1) + duration;
    response.stats.averageDelay = totalDelay / response.stats.triggered;
    
    // 更新成功率
    const alpha = 0.1; // 平滑因子
    response.stats.successRate = alpha * (success ? 1 : 0) + (1 - alpha) * response.stats.successRate;
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 开始响应处理循环
   */
  private startResponseLoop(): void {
    setInterval(() => {
      this.processResponseQueue();
    }, 16); // 60fps
  }

  /**
   * 处理响应队列
   */
  private processResponseQueue(): void {
    if (this.isProcessing || this.responseQueue.length === 0) return;
    
    this.isProcessing = true;
    
    const item = this.responseQueue.shift();
    if (item) {
      this.triggerResponse(item.response, item.context);
    }
    
    this.isProcessing = false;
  }

  /**
   * 获取响应统计信息
   */
  getResponseStats(responseId?: string): any {
    if (responseId) {
      const response = this.responses.get(responseId);
      return response ? response.stats : null;
    }

    const stats: any = {};
    for (const [id, response] of this.responses.entries()) {
      stats[id] = response.stats;
    }
    return stats;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 清除所有活动响应
    for (const timeout of this.activeResponses.values()) {
      clearTimeout(timeout);
    }
    this.activeResponses.clear();
    
    this.responses.clear();
    this.responseQueue = [];
    this.removeAllListeners();
  }
}