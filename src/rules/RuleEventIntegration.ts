/**
 * 规则与事件系统集成 - 连接规则引擎和事件系统
 * 提供规则触发事件、事件驱动规则执行的双向集成
 */

import { EventEmitter } from '../utils/EventEmitter';
import { RuleExecutionEngine } from './RuleExecutionEngine';
import { gameEventSystem } from '../events/EventSystemDemo';
import type { GameEvent, EventType } from '../events/EventSystem';
import type {
  GameState,
  Player,
  PlayerAction,
  ActionResult
} from '../types/game';
import type {
  ExecutionResult,
  StateChangeRecord
} from './RuleExecutionEngine';

export interface RuleEventBinding {
  id: string;
  ruleId: string;
  eventType: EventType;
  direction: 'rule_to_event' | 'event_to_rule' | 'bidirectional';
  priority: number;
  conditions?: BindingCondition[];
  transformation?: DataTransformation;
  enabled: boolean;
}

export interface BindingCondition {
  type: 'player_state' | 'game_state' | 'rule_result' | 'event_data';
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'matches';
  value: any;
  description: string;
}

export interface DataTransformation {
  sourceField: string;
  targetField: string;
  transformFunction?: (value: any) => any;
  defaultValue?: any;
}

export interface EventRuleContext {
  gameState: GameState;
  triggeringEvent?: GameEvent;
  triggeringRule?: string;
  player?: Player;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface IntegrationStatistics {
  totalBindings: number;
  activeBindings: number;
  ruleTriggeredEvents: number;
  eventTriggeredRules: number;
  integrationErrors: number;
  averageProcessingTime: number;
  recentActivities: IntegrationActivity[];
}

export interface IntegrationActivity {
  id: string;
  timestamp: number;
  type: 'rule_triggered_event' | 'event_triggered_rule' | 'binding_activated' | 'error_occurred';
  source: string;
  target: string;
  data: any;
  duration: number;
  success: boolean;
}

/**
 * 规则与事件系统集成管理器
 */
export class RuleEventIntegration extends EventEmitter {
  private ruleEngine: RuleExecutionEngine;
  private bindings = new Map<string, RuleEventBinding>();
  private integrationHistory: IntegrationActivity[] = [];
  
  private readonly maxHistorySize = 500;
  private isInitialized = false;

  constructor(ruleEngine?: RuleExecutionEngine) {
    super();
    
    this.ruleEngine = ruleEngine || new RuleExecutionEngine();
    this.setupEventListeners();
    this.setupDefaultBindings();
  }

  /**
   * 初始化集成系统
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 启动事件系统
      await this.startEventSystem();
      
      // 注册规则事件处理器
      this.registerRuleEventHandlers();
      
      // 注册事件规则处理器
      this.registerEventRuleHandlers();
      
      this.isInitialized = true;
      this.emit('integrationInitialized');
      
    } catch (error) {
      this.emit('integrationError', {
        type: 'initialization_failed',
        error,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * 注册规则事件绑定
   */
  registerBinding(binding: RuleEventBinding): void {
    this.validateBinding(binding);
    this.bindings.set(binding.id, binding);
    
    this.emit('bindingRegistered', binding);
  }

  /**
   * 移除绑定
   */
  removeBinding(bindingId: string): void {
    if (this.bindings.delete(bindingId)) {
      this.emit('bindingRemoved', { bindingId });
    }
  }

  /**
   * 启用/禁用绑定
   */
  toggleBinding(bindingId: string, enabled: boolean): void {
    const binding = this.bindings.get(bindingId);
    if (binding) {
      binding.enabled = enabled;
      this.emit('bindingToggled', { bindingId, enabled });
    }
  }

  /**
   * 执行规则并触发相关事件
   */
  async executeRuleWithEvents(
    action: PlayerAction,
    gameState: GameState
  ): Promise<ExecutionResult> {
    const context: EventRuleContext = {
      gameState,
      timestamp: Date.now(),
      metadata: {}
    };

    try {
      // 执行规则
      const ruleResult = await this.ruleEngine.executeAction(action, gameState);
      
      // 根据规则结果触发事件
      if (ruleResult.success) {
        await this.processRuleToEventBindings(ruleResult, context);
      }
      
      return ruleResult;
      
    } catch (error) {
      this.recordActivity({
        type: 'error_occurred',
        source: 'rule_execution',
        target: action.type,
        data: { error, action },
        success: false
      });
      throw error;
    }
  }

  /**
   * 处理事件并执行相关规则
   */
  async handleEventWithRules(
    event: GameEvent,
    gameState: GameState
  ): Promise<ActionResult[]> {
    const context: EventRuleContext = {
      gameState,
      triggeringEvent: event,
      timestamp: Date.now(),
      metadata: {}
    };

    const results: ActionResult[] = [];

    try {
      // 查找事件触发的规则绑定
      const eventBindings = this.getEventToRuleBindings(event.type);
      
      for (const binding of eventBindings) {
        if (!binding.enabled) continue;
        
        // 检查绑定条件
        if (!this.checkBindingConditions(binding, context)) {
          continue;
        }
        
        // 执行规则逻辑
        const ruleResult = await this.executeEventTriggeredRule(binding, event, context);
        if (ruleResult) {
          results.push(ruleResult);
        }
      }
      
      return results;
      
    } catch (error) {
      this.recordActivity({
        type: 'error_occurred',
        source: 'event_handling',
        target: event.type,
        data: { error, event },
        success: false
      });
      return [];
    }
  }

  /**
   * 获取集成统计信息
   */
  getIntegrationStatistics(): IntegrationStatistics {
    const activeBindings = Array.from(this.bindings.values()).filter(b => b.enabled).length;
    
    const ruleTriggeredEvents = this.integrationHistory.filter(
      a => a.type === 'rule_triggered_event'
    ).length;
    
    const eventTriggeredRules = this.integrationHistory.filter(
      a => a.type === 'event_triggered_rule'
    ).length;
    
    const errors = this.integrationHistory.filter(
      a => a.type === 'error_occurred'
    ).length;
    
    const avgTime = this.integrationHistory.length > 0 ?
      this.integrationHistory.reduce((sum, a) => sum + a.duration, 0) / this.integrationHistory.length : 0;

    return {
      totalBindings: this.bindings.size,
      activeBindings,
      ruleTriggeredEvents,
      eventTriggeredRules,
      integrationErrors: errors,
      averageProcessingTime: avgTime,
      recentActivities: this.integrationHistory.slice(-20)
    };
  }

  /**
   * 同步规则状态到事件系统
   */
  async syncRuleStateToEvents(gameState: GameState): Promise<void> {
    // 将规则执行结果转换为事件
    const stateEvent: GameEvent = {
      id: `state_sync_${Date.now()}`,
      type: 'game-state-update' as EventType,
      priority: 'normal',
      timestamp: Date.now(),
      data: {
        gameState: {
          phase: gameState.phase,
          currentPlayer: gameState.currentPlayerIndex,
          turn: gameState.turn
        }
      },
      processed: false
    };

    // 发送到事件系统
    await gameEventSystem.processingSystem.addEvent(stateEvent);
  }

  /**
   * 从事件系统同步状态到规则引擎
   */
  async syncEventStateToRules(gameState: GameState): Promise<void> {
    // 验证当前游戏状态
    const validation = await this.ruleEngine.validateCurrentState(gameState);
    
    if (!validation.isValid) {
      // 触发状态修复事件
      const fixEvent: GameEvent = {
        id: `state_fix_${Date.now()}`,
        type: 'state-validation-failed' as EventType,
        priority: 'high',
        timestamp: Date.now(),
        data: {
          errors: validation.errors,
          gameState
        },
        processed: false
      };

      await gameEventSystem.processingSystem.addEvent(fixEvent);
    }
  }

  // 私有方法

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听规则执行完成
    this.ruleEngine.on('executionCompleted', (result: ExecutionResult) => {
      this.handleRuleExecutionCompleted(result);
    });

    // 监听规则执行失败
    this.ruleEngine.on('executionFailed', (data: any) => {
      this.handleRuleExecutionFailed(data);
    });

    // 监听事件系统事件
    gameEventSystem.processingSystem.on('eventProcessed', (data: any) => {
      this.handleEventProcessed(data);
    });
  }

  /**
   * 设置默认绑定
   */
  private setupDefaultBindings(): void {
    // 玩家移动 -> 位置变更事件
    this.registerBinding({
      id: 'player_move_to_position_event',
      ruleId: 'board_movement',
      eventType: 'player-moved' as EventType,
      direction: 'rule_to_event',
      priority: 90,
      enabled: true
    });

    // 财产购买 -> 经济事件
    this.registerBinding({
      id: 'property_purchase_to_economy_event',
      ruleId: 'property_purchase',
      eventType: 'property-purchased' as EventType,
      direction: 'rule_to_event',
      priority: 85,
      enabled: true
    });

    // 技能使用 -> 技能效果事件
    this.registerBinding({
      id: 'skill_usage_to_effect_event',
      ruleId: 'zodiac_skill_cooldown',
      eventType: 'skill-used' as EventType,
      direction: 'rule_to_event',
      priority: 80,
      enabled: true
    });

    // 随机事件 -> 规则验证
    this.registerBinding({
      id: 'random_event_to_rule_validation',
      ruleId: 'event_response',
      eventType: 'random-event' as EventType,
      direction: 'event_to_rule',
      priority: 75,
      enabled: true
    });

    // 胜利条件检查 -> 游戏结束事件
    this.registerBinding({
      id: 'victory_check_to_game_end',
      ruleId: 'bankruptcy_victory',
      eventType: 'game-ended' as EventType,
      direction: 'rule_to_event',
      priority: 100,
      enabled: true
    });
  }

  /**
   * 启动事件系统
   */
  private async startEventSystem(): Promise<void> {
    // 初始化事件系统（如果尚未初始化）
    if (!gameEventSystem) {
      throw new Error('事件系统未初始化');
    }
  }

  /**
   * 注册规则事件处理器
   */
  private registerRuleEventHandlers(): void {
    // 注册处理器到事件系统
    gameEventSystem.processingSystem.registerProcessor({
      id: 'rule-integration-processor',
      name: '规则集成处理器',
      eventTypes: ['*' as EventType],
      priority: 5,
      enabled: true,
      process: async (event, context) => {
        await this.processEventForRules(event, context);
        return {
          success: true,
          data: { integratedWithRules: true },
          duration: 10
        };
      },
      options: {
        concurrent: true,
        timeout: 5000
      },
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });
  }

  /**
   * 注册事件规则处理器
   */
  private registerEventRuleHandlers(): void {
    // 为规则系统注册事件响应器
    gameEventSystem.responseSystem.registerResponse({
      id: 'rule-sync-response',
      name: '规则同步响应器',
      type: 'rule_sync',
      eventTypes: ['game-state-update', 'player-action'] as EventType[],
      priority: 10,
      enabled: true,
      execute: async (event, gameState, playerState) => {
        await this.syncEventStateToRules(gameState);
        return {
          success: true,
          responses: []
        };
      },
      options: {}
    });
  }

  /**
   * 处理规则到事件的绑定
   */
  private async processRuleToEventBindings(
    ruleResult: ExecutionResult,
    context: EventRuleContext
  ): Promise<void> {
    const ruleBindings = this.getRuleToEventBindings();
    
    for (const binding of ruleBindings) {
      if (!binding.enabled) continue;
      
      // 检查绑定条件
      if (!this.checkBindingConditions(binding, context)) {
        continue;
      }
      
      try {
        const startTime = Date.now();
        
        // 创建事件
        const event = this.createEventFromRule(binding, ruleResult, context);
        
        // 发送到事件系统
        await gameEventSystem.processingSystem.addEvent(event);
        
        this.recordActivity({
          type: 'rule_triggered_event',
          source: binding.ruleId,
          target: binding.eventType,
          data: { ruleResult, event },
          success: true,
          duration: Date.now() - startTime
        });
        
      } catch (error) {
        this.recordActivity({
          type: 'error_occurred',
          source: binding.ruleId,
          target: binding.eventType,
          data: { error, ruleResult },
          success: false
        });
      }
    }
  }

  /**
   * 处理事件到规则的绑定
   */
  private async processEventForRules(event: any, context: any): Promise<void> {
    const eventBindings = this.getEventToRuleBindings(event.type);
    
    for (const binding of eventBindings) {
      if (!binding.enabled) continue;
      
      try {
        const startTime = Date.now();
        
        // 转换事件数据为玩家行动
        const action = this.createActionFromEvent(binding, event, context);
        
        if (action) {
          // 执行规则
          const result = await this.ruleEngine.executeAction(action, context.gameState);
          
          this.recordActivity({
            type: 'event_triggered_rule',
            source: event.type,
            target: binding.ruleId,
            data: { event, action, result },
            success: result.success,
            duration: Date.now() - startTime
          });
        }
        
      } catch (error) {
        this.recordActivity({
          type: 'error_occurred',
          source: event.type,
          target: binding.ruleId,
          data: { error, event },
          success: false
        });
      }
    }
  }

  /**
   * 获取规则到事件的绑定
   */
  private getRuleToEventBindings(): RuleEventBinding[] {
    return Array.from(this.bindings.values()).filter(
      binding => binding.direction === 'rule_to_event' || binding.direction === 'bidirectional'
    );
  }

  /**
   * 获取事件到规则的绑定
   */
  private getEventToRuleBindings(eventType: EventType): RuleEventBinding[] {
    return Array.from(this.bindings.values()).filter(
      binding => 
        (binding.direction === 'event_to_rule' || binding.direction === 'bidirectional') &&
        binding.eventType === eventType
    );
  }

  /**
   * 检查绑定条件
   */
  private checkBindingConditions(
    binding: RuleEventBinding,
    context: EventRuleContext
  ): boolean {
    if (!binding.conditions) return true;
    
    return binding.conditions.every(condition => {
      let actualValue: any;
      
      switch (condition.type) {
        case 'player_state':
          actualValue = context.player ? (context.player as any)[condition.field] : undefined;
          break;
        case 'game_state':
          actualValue = (context.gameState as any)[condition.field];
          break;
        case 'event_data':
          actualValue = context.triggeringEvent?.data?.[condition.field];
          break;
        default:
          return true;
      }
      
      return this.evaluateCondition(actualValue, condition.operator, condition.value);
    });
  }

  /**
   * 评估条件
   */
  private evaluateCondition(actualValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'eq': return actualValue === expectedValue;
      case 'ne': return actualValue !== expectedValue;
      case 'gt': return actualValue > expectedValue;
      case 'gte': return actualValue >= expectedValue;
      case 'lt': return actualValue < expectedValue;
      case 'lte': return actualValue <= expectedValue;
      case 'contains': return Array.isArray(actualValue) && actualValue.includes(expectedValue);
      case 'matches': return new RegExp(expectedValue).test(String(actualValue));
      default: return false;
    }
  }

  /**
   * 从规则创建事件
   */
  private createEventFromRule(
    binding: RuleEventBinding,
    ruleResult: ExecutionResult,
    context: EventRuleContext
  ): GameEvent {
    return {
      id: `rule_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: binding.eventType,
      priority: 'normal',
      timestamp: Date.now(),
      data: {
        sourceRule: binding.ruleId,
        ruleResult: {
          success: ruleResult.success,
          message: ruleResult.message,
          stateChanges: ruleResult.stateChanges.length
        },
        context: {
          gamePhase: context.gameState.phase,
          currentPlayer: context.gameState.currentPlayerIndex
        }
      },
      processed: false
    };
  }

  /**
   * 从事件创建行动
   */
  private createActionFromEvent(
    binding: RuleEventBinding,
    event: GameEvent,
    context: any
  ): PlayerAction | null {
    // 根据事件类型和绑定配置创建相应的玩家行动
    const actionTypeMap: Record<string, string> = {
      'random-event': 'event_choice',
      'property-available': 'buy_property',
      'skill-available': 'use_skill',
      'turn-start': 'roll_dice'
    };
    
    const actionType = actionTypeMap[event.type];
    if (!actionType) return null;
    
    return {
      type: actionType as any,
      playerId: context.gameState?.players?.[context.gameState.currentPlayerIndex]?.id || 'unknown',
      data: event.data || {},
      timestamp: Date.now()
    };
  }

  /**
   * 执行事件触发的规则
   */
  private async executeEventTriggeredRule(
    binding: RuleEventBinding,
    event: GameEvent,
    context: EventRuleContext
  ): Promise<ActionResult | null> {
    const action = this.createActionFromEvent(binding, event, context);
    if (!action) return null;
    
    try {
      const result = await this.ruleEngine.executeAction(action, context.gameState);
      return {
        success: result.success,
        message: result.message,
        effects: result.effects
      };
    } catch (error) {
      return {
        success: false,
        message: `规则执行失败: ${error instanceof Error ? error.message : String(error)}`,
        effects: []
      };
    }
  }

  /**
   * 验证绑定配置
   */
  private validateBinding(binding: RuleEventBinding): void {
    if (!binding.id || !binding.ruleId || !binding.eventType) {
      throw new Error('绑定必须包含id、ruleId和eventType');
    }
    
    if (this.bindings.has(binding.id)) {
      throw new Error(`绑定ID已存在: ${binding.id}`);
    }
    
    if (!['rule_to_event', 'event_to_rule', 'bidirectional'].includes(binding.direction)) {
      throw new Error('无效的绑定方向');
    }
  }

  /**
   * 处理规则执行完成
   */
  private handleRuleExecutionCompleted(result: ExecutionResult): void {
    this.emit('ruleExecutionCompleted', result);
  }

  /**
   * 处理规则执行失败
   */
  private handleRuleExecutionFailed(data: any): void {
    this.emit('ruleExecutionFailed', data);
  }

  /**
   * 处理事件处理完成
   */
  private handleEventProcessed(data: any): void {
    this.emit('eventProcessed', data);
  }

  /**
   * 记录集成活动
   */
  private recordActivity(activity: Omit<IntegrationActivity, 'id' | 'timestamp' | 'duration'>): void {
    const fullActivity: IntegrationActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      duration: activity.duration || 0,
      ...activity
    };
    
    this.integrationHistory.push(fullActivity);
    
    // 限制历史记录大小
    if (this.integrationHistory.length > this.maxHistorySize) {
      this.integrationHistory.shift();
    }
    
    this.emit('activityRecorded', fullActivity);
  }
}

// 导出单例实例
export const ruleEventIntegration = new RuleEventIntegration();