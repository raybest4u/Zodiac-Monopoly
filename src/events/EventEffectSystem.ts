/**
 * 事件效果系统 - 处理和应用各种事件效果
 * 支持即时效果、持续效果、条件效果、复合效果等
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { EventEffect } from './EventSystem';

export interface EffectApplication {
  id: string;
  effectId: string;
  targetId: string;
  effectType: string;
  
  // 效果状态
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  
  // 时间信息
  appliedAt: number;
  duration?: number;
  expiresAt?: number;
  
  // 效果参数
  originalValue: any;
  currentValue: any;
  modifications: EffectModification[];
  
  // 元数据
  sourceEvent?: string;
  metadata: Record<string, any>;
}

export interface EffectModification {
  property: string;
  originalValue: any;
  newValue: any;
  modificationType: 'set' | 'add' | 'multiply' | 'append' | 'toggle';
  appliedAt: number;
}

export interface EffectHandler {
  effectType: string;
  priority: number;
  
  // 处理函数
  canHandle: (effect: EventEffect, context: EffectContext) => boolean;
  apply: (effect: EventEffect, context: EffectContext) => Promise<EffectResult>;
  revert?: (application: EffectApplication, context: EffectContext) => Promise<void>;
  update?: (application: EffectApplication, context: EffectContext) => Promise<void>;
}

export interface EffectContext {
  gameState: any;
  targetPlayer?: any;
  allPlayers: any[];
  boardState: any;
  eventSource: any;
  timestamp: number;
}

export interface EffectResult {
  success: boolean;
  applicationId?: string;
  modifications: EffectModification[];
  sideEffects?: EventEffect[];
  error?: Error;
  warnings?: string[];
}

export interface EffectGroup {
  id: string;
  name: string;
  effects: EventEffect[];
  executionMode: 'sequential' | 'parallel' | 'conditional';
  conditions?: EffectCondition[];
}

export interface EffectCondition {
  type: 'player_state' | 'game_state' | 'time' | 'random' | 'custom';
  field?: string;
  operator?: string;
  value?: any;
  customCheck?: (context: EffectContext) => boolean;
}

/**
 * 事件效果系统主类
 */
export class EventEffectSystem extends EventEmitter {
  private effectHandlers = new Map<string, EffectHandler>();
  private activeEffects = new Map<string, EffectApplication>();
  private effectGroups = new Map<string, EffectGroup>();
  private effectHistory: EffectApplication[] = [];
  
  constructor() {
    super();
    this.initializeDefaultHandlers();
    this.startEffectUpdateLoop();
  }

  /**
   * 注册效果处理器
   */
  registerHandler(handler: EffectHandler): void {
    this.effectHandlers.set(handler.effectType, handler);
    this.emit('handlerRegistered', handler);
  }

  /**
   * 应用单个效果
   */
  async applyEffect(effect: EventEffect, context: EffectContext): Promise<EffectResult> {
    const handler = this.getEffectHandler(effect, context);
    
    if (!handler) {
      const error = new Error(`No handler found for effect type: ${effect.type}`);
      return {
        success: false,
        modifications: [],
        error
      };
    }

    try {
      const result = await handler.apply(effect, context);
      
      if (result.success && result.applicationId) {
        // 创建效果应用记录
        const application: EffectApplication = {
          id: result.applicationId,
          effectId: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          targetId: this.getTargetId(effect.target, context),
          effectType: effect.type,
          status: 'active',
          appliedAt: Date.now(),
          duration: effect.duration,
          expiresAt: effect.duration ? Date.now() + effect.duration * 1000 : undefined,
          originalValue: effect.value,
          currentValue: effect.value,
          modifications: result.modifications,
          sourceEvent: context.eventSource?.id,
          metadata: {}
        };

        this.activeEffects.set(application.id, application);
        this.effectHistory.push(application);
        
        // 处理副作用
        if (result.sideEffects) {
          for (const sideEffect of result.sideEffects) {
            await this.applyEffect(sideEffect, context);
          }
        }
        
        this.emit('effectApplied', { effect, application, context });
      }
      
      return result;
      
    } catch (error) {
      console.error(`Error applying effect ${effect.type}:`, error);
      return {
        success: false,
        modifications: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * 批量应用效果
   */
  async applyEffects(effects: EventEffect[], context: EffectContext): Promise<EffectResult[]> {
    const results: EffectResult[] = [];
    
    for (const effect of effects) {
      const result = await this.applyEffect(effect, context);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 应用效果组
   */
  async applyEffectGroup(groupId: string, context: EffectContext): Promise<EffectResult[]> {
    const group = this.effectGroups.get(groupId);
    if (!group) {
      throw new Error(`Effect group not found: ${groupId}`);
    }

    // 检查条件
    if (group.conditions) {
      for (const condition of group.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return [];
        }
      }
    }

    const results: EffectResult[] = [];

    switch (group.executionMode) {
      case 'sequential':
        for (const effect of group.effects) {
          const result = await this.applyEffect(effect, context);
          results.push(result);
          
          // 如果任何效果失败，停止执行
          if (!result.success) {
            break;
          }
        }
        break;
        
      case 'parallel':
        const promises = group.effects.map(effect => this.applyEffect(effect, context));
        results.push(...await Promise.all(promises));
        break;
        
      case 'conditional':
        // 只应用第一个满足条件的效果
        for (const effect of group.effects) {
          // 这里可以添加更复杂的条件逻辑
          const result = await this.applyEffect(effect, context);
          results.push(result);
          
          if (result.success) {
            break;
          }
        }
        break;
    }

    this.emit('effectGroupApplied', { group, context, results });
    return results;
  }

  /**
   * 撤销效果
   */
  async revertEffect(applicationId: string, context: EffectContext): Promise<boolean> {
    const application = this.activeEffects.get(applicationId);
    if (!application) {
      return false;
    }

    const handler = this.effectHandlers.get(application.effectType);
    if (!handler || !handler.revert) {
      return false;
    }

    try {
      await handler.revert(application, context);
      application.status = 'cancelled';
      this.activeEffects.delete(applicationId);
      
      this.emit('effectReverted', { application, context });
      return true;
      
    } catch (error) {
      console.error(`Error reverting effect ${applicationId}:`, error);
      return false;
    }
  }

  /**
   * 更新所有活动效果
   */
  private async updateActiveEffects(): Promise<void> {
    const now = Date.now();
    const expiredEffects: string[] = [];

    for (const [id, application] of this.activeEffects.entries()) {
      // 检查是否过期
      if (application.expiresAt && now >= application.expiresAt) {
        expiredEffects.push(id);
        continue;
      }

      // 更新效果
      const handler = this.effectHandlers.get(application.effectType);
      if (handler && handler.update) {
        try {
          await handler.update(application, {
            gameState: this.getGameState(),
            allPlayers: this.getAllPlayers(),
            boardState: this.getBoardState(),
            eventSource: null,
            timestamp: now
          });
        } catch (error) {
          console.error(`Error updating effect ${id}:`, error);
        }
      }
    }

    // 清理过期效果
    for (const id of expiredEffects) {
      const application = this.activeEffects.get(id);
      if (application) {
        application.status = 'completed';
        this.activeEffects.delete(id);
        this.emit('effectExpired', { application });
      }
    }
  }

  /**
   * 初始化默认处理器
   */
  private initializeDefaultHandlers(): void {
    // 金钱变更处理器
    this.registerHandler({
      effectType: 'money_change',
      priority: 1,
      canHandle: (effect) => effect.type === 'money_change',
      apply: async (effect, context) => {
        const targets = this.resolveTargets(effect.target, context);
        const modifications: EffectModification[] = [];
        
        for (const target of targets) {
          const amount = typeof effect.value === 'function' 
            ? effect.value(target, context)
            : effect.value;
          
          const oldMoney = target.money;
          target.money = Math.max(0, target.money + amount);
          
          modifications.push({
            property: 'money',
            originalValue: oldMoney,
            newValue: target.money,
            modificationType: 'add',
            appliedAt: Date.now()
          });
        }
        
        return {
          success: true,
          applicationId: `money_${Date.now()}`,
          modifications
        };
      }
    });

    // 位置变更处理器
    this.registerHandler({
      effectType: 'position_change',
      priority: 1,
      canHandle: (effect) => effect.type === 'position_change',
      apply: async (effect, context) => {
        const targets = this.resolveTargets(effect.target, context);
        const modifications: EffectModification[] = [];
        
        for (const target of targets) {
          const newPosition = typeof effect.value === 'function'
            ? effect.value(target, context)
            : effect.value;
            
          const oldPosition = target.position;
          target.position = newPosition;
          
          modifications.push({
            property: 'position',
            originalValue: oldPosition,
            newValue: newPosition,
            modificationType: 'set',
            appliedAt: Date.now()
          });
          
          // 触发移动事件
          this.emit('playerMoved', {
            player: target,
            fromPosition: oldPosition,
            toPosition: newPosition
          });
        }
        
        return {
          success: true,
          applicationId: `position_${Date.now()}`,
          modifications
        };
      }
    });

    // 状态效果处理器
    this.registerHandler({
      effectType: 'status_effect',
      priority: 2,
      canHandle: (effect) => effect.type === 'status_effect',
      apply: async (effect, context) => {
        const targets = this.resolveTargets(effect.target, context);
        const modifications: EffectModification[] = [];
        
        for (const target of targets) {
          const statusEffect = typeof effect.value === 'function'
            ? effect.value(target, context)
            : effect.value;
          
          if (!target.statusEffects) {
            target.statusEffects = [];
          }
          
          target.statusEffects.push({
            ...statusEffect,
            id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            appliedAt: Date.now(),
            remainingTurns: effect.duration || statusEffect.duration
          });
          
          modifications.push({
            property: 'statusEffects',
            originalValue: target.statusEffects.slice(0, -1),
            newValue: target.statusEffects,
            modificationType: 'append',
            appliedAt: Date.now()
          });
        }
        
        return {
          success: true,
          applicationId: `status_${Date.now()}`,
          modifications
        };
      }
    });

    // 房产效果处理器
    this.registerHandler({
      effectType: 'property_effect',
      priority: 2,
      canHandle: (effect) => effect.type === 'property_effect',
      apply: async (effect, context) => {
        const targets = this.resolveTargets(effect.target, context);
        const modifications: EffectModification[] = [];
        
        for (const target of targets) {
          const propertyEffect = typeof effect.value === 'function'
            ? effect.value(target, context)
            : effect.value;
          
          switch (propertyEffect.action) {
            case 'upgrade_random':
              const properties = target.properties || [];
              if (properties.length > 0) {
                const randomProperty = properties[Math.floor(Math.random() * properties.length)];
                this.upgradeProperty(randomProperty, context.boardState);
                
                modifications.push({
                  property: `property_${randomProperty}`,
                  originalValue: 'normal',
                  newValue: 'upgraded',
                  modificationType: 'set',
                  appliedAt: Date.now()
                });
              }
              break;
              
            case 'damage_random':
              const ownedProperties = target.properties || [];
              if (ownedProperties.length > 0) {
                const randomProperty = ownedProperties[Math.floor(Math.random() * ownedProperties.length)];
                this.damageProperty(randomProperty, context.boardState);
                
                modifications.push({
                  property: `property_${randomProperty}`,
                  originalValue: 'normal',
                  newValue: 'damaged',
                  modificationType: 'set',
                  appliedAt: Date.now()
                });
              }
              break;
          }
        }
        
        return {
          success: true,
          applicationId: `property_${Date.now()}`,
          modifications
        };
      }
    });

    // 技能效果处理器
    this.registerHandler({
      effectType: 'skill_effect',
      priority: 2,
      canHandle: (effect) => effect.type === 'skill_effect',
      apply: async (effect, context) => {
        const targets = this.resolveTargets(effect.target, context);
        const modifications: EffectModification[] = [];
        
        for (const target of targets) {
          const skillEffect = typeof effect.value === 'function'
            ? effect.value(target, context)
            : effect.value;
          
          // 应用技能效果到玩家
          this.applySkillEffect(target, skillEffect);
          
          modifications.push({
            property: 'skillEffects',
            originalValue: null,
            newValue: skillEffect,
            modificationType: 'add',
            appliedAt: Date.now()
          });
        }
        
        return {
          success: true,
          applicationId: `skill_${Date.now()}`,
          modifications
        };
      }
    });
  }

  /**
   * 获取效果处理器
   */
  private getEffectHandler(effect: EventEffect, context: EffectContext): EffectHandler | null {
    for (const handler of this.effectHandlers.values()) {
      if (handler.canHandle(effect, context)) {
        return handler;
      }
    }
    return null;
  }

  /**
   * 解析目标
   */
  private resolveTargets(target: string, context: EffectContext): any[] {
    switch (target) {
      case 'self':
        return context.targetPlayer ? [context.targetPlayer] : [];
      case 'all':
        return context.allPlayers;
      case 'others':
        return context.allPlayers.filter(p => p.id !== context.targetPlayer?.id);
      case 'random':
        const randomPlayer = context.allPlayers[Math.floor(Math.random() * context.allPlayers.length)];
        return randomPlayer ? [randomPlayer] : [];
      default:
        // 寻找特定ID的玩家
        const specificPlayer = context.allPlayers.find(p => p.id === target);
        return specificPlayer ? [specificPlayer] : [];
    }
  }

  /**
   * 获取目标ID
   */
  private getTargetId(target: string, context: EffectContext): string {
    switch (target) {
      case 'self':
        return context.targetPlayer?.id || 'unknown';
      case 'all':
        return 'all_players';
      case 'others':
        return 'other_players';
      case 'random':
        return 'random_player';
      default:
        return target;
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: EffectCondition, context: EffectContext): boolean {
    switch (condition.type) {
      case 'player_state':
        if (!condition.field || !context.targetPlayer) return false;
        const playerValue = this.getNestedValue(context.targetPlayer, condition.field);
        return this.compareValues(playerValue, condition.operator!, condition.value);
        
      case 'game_state':
        if (!condition.field) return false;
        const gameValue = this.getNestedValue(context.gameState, condition.field);
        return this.compareValues(gameValue, condition.operator!, condition.value);
        
      case 'time':
        const currentTime = Date.now();
        return this.compareValues(currentTime, condition.operator!, condition.value);
        
      case 'random':
        return Math.random() < (condition.value || 0.5);
        
      case 'custom':
        return condition.customCheck ? condition.customCheck(context) : true;
        
      default:
        return true;
    }
  }

  /**
   * 获取嵌套值
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
      default: return false;
    }
  }

  /**
   * 升级房产
   */
  private upgradeProperty(propertyId: string, boardState: any): void {
    // 房产升级逻辑
    const property = boardState.find((cell: any) => cell.id === propertyId);
    if (property && property.level < 3) {
      property.level++;
      property.rent *= 1.5;
    }
  }

  /**
   * 损坏房产
   */
  private damageProperty(propertyId: string, boardState: any): void {
    // 房产损坏逻辑
    const property = boardState.find((cell: any) => cell.id === propertyId);
    if (property) {
      property.rent *= 0.8;
      property.damaged = true;
    }
  }

  /**
   * 应用技能效果
   */
  private applySkillEffect(player: any, skillEffect: any): void {
    // 技能效果逻辑
    if (!player.activeSkillEffects) {
      player.activeSkillEffects = [];
    }
    player.activeSkillEffects.push(skillEffect);
  }

  /**
   * 开始效果更新循环
   */
  private startEffectUpdateLoop(): void {
    setInterval(() => {
      this.updateActiveEffects();
    }, 1000); // 每秒更新一次
  }

  /**
   * 获取游戏状态（需要外部注入）
   */
  private getGameState(): any {
    return {};
  }

  /**
   * 获取所有玩家（需要外部注入）
   */
  private getAllPlayers(): any[] {
    return [];
  }

  /**
   * 获取棋盘状态（需要外部注入）
   */
  private getBoardState(): any {
    return {};
  }

  /**
   * 注册效果组
   */
  registerEffectGroup(group: EffectGroup): void {
    this.effectGroups.set(group.id, group);
    this.emit('effectGroupRegistered', group);
  }

  /**
   * 获取活动效果
   */
  getActiveEffects(): EffectApplication[] {
    return Array.from(this.activeEffects.values());
  }

  /**
   * 获取效果历史
   */
  getEffectHistory(limit = 100): EffectApplication[] {
    return this.effectHistory.slice(-limit);
  }

  /**
   * 获取系统统计
   */
  getSystemStats(): any {
    return {
      activeEffects: this.activeEffects.size,
      registeredHandlers: this.effectHandlers.size,
      effectGroups: this.effectGroups.size,
      totalEffectsApplied: this.effectHistory.length
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.effectHandlers.clear();
    this.activeEffects.clear();
    this.effectGroups.clear();
    this.effectHistory = [];
    this.removeAllListeners();
  }
}