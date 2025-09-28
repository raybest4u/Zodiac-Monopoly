/**
 * 技能触发系统
 * 第二阶段 Day 1: 技能系统架构
 * 
 * 实现技能的自动触发机制，包括：
 * - 被动技能自动激活
 * - 条件触发技能
 * - 事件响应技能
 * - 组合技能链
 * - 触发优先级管理
 */

import type { GameState, Player, GameEvent } from '../types/game';
import {
  SkillActivationType,
  SkillCategory,
  SkillCondition,
  SkillConditionType,
  SkillSystemEvent,
  SkillSystemEventType,
  PlayerSkillInstance,
  SkillDefinition
} from './SkillSystemArchitecture';
import { SkillManager } from './SkillManager';

/**
 * 触发器类型枚举
 */
export enum TriggerType {
  GAME_EVENT = 'game_event',           // 游戏事件触发
  PLAYER_ACTION = 'player_action',     // 玩家行动触发
  STATUS_CHANGE = 'status_change',     // 状态变化触发
  TURN_PHASE = 'turn_phase',           // 回合阶段触发
  CONDITION_MET = 'condition_met',     // 条件满足触发
  COMBO_CHAIN = 'combo_chain',         // 组合链触发
  PASSIVE_ACTIVATION = 'passive_activation' // 被动激活
}

/**
 * 触发器接口
 */
export interface SkillTrigger {
  id: string;
  type: TriggerType;
  skillId: string;
  playerId: string;
  conditions: SkillCondition[];
  priority: number;
  maxActivationsPerTurn?: number;
  currentActivations: number;
  isActive: boolean;
  cooldown?: number;
  lastTriggered?: number;
}

/**
 * 触发器上下文接口
 */
export interface TriggerContext {
  gameState: GameState;
  triggeredBy?: string;
  eventData?: any;
  actionData?: any;
  previousGameState?: GameState;
}

/**
 * 触发器结果接口
 */
export interface TriggerResult {
  triggered: boolean;
  skillsActivated: string[];
  effects: any[];
  message: string;
  nextTriggers?: SkillTrigger[];
}

/**
 * 技能触发系统实现
 */
export class SkillTriggerSystem {
  private skillManager: SkillManager;
  private activeTriggers: Map<string, SkillTrigger[]> = new Map(); // playerId -> triggers
  private triggerQueue: SkillTrigger[] = [];
  private processingTriggers = false;
  private triggeredSkillsThisTurn: Set<string> = new Set();

  constructor(skillManager: SkillManager) {
    this.skillManager = skillManager;
    this.initializeTriggerSystem();
  }

  // ============================================================================
  // 初始化和配置
  // ============================================================================

  private initializeTriggerSystem(): void {
    console.log('🔔 技能触发系统初始化...');
    
    // 监听技能系统事件
    this.skillManager.addEventListener(this.handleSkillSystemEvent.bind(this));
    
    console.log('✅ 技能触发系统初始化完成');
  }

  /**
   * 为玩家初始化触发器
   */
  public initializePlayerTriggers(playerId: string): void {
    if (!this.activeTriggers.has(playerId)) {
      this.activeTriggers.set(playerId, []);
    }

    // 为玩家的被动技能创建触发器
    const playerSkills = this.skillManager.getPlayerSkills(playerId);
    playerSkills.forEach(skill => {
      this.createTriggersForSkill(playerId, skill);
    });
  }

  /**
   * 为技能创建相应的触发器
   */
  private createTriggersForSkill(playerId: string, skillInstance: PlayerSkillInstance): void {
    const skillDef = this.skillManager.getSkillDefinition(skillInstance.definitionId);
    if (!skillDef) return;

    const playerTriggers = this.activeTriggers.get(playerId) || [];

    // 根据技能类型创建不同的触发器
    switch (skillDef.activationType) {
      case SkillActivationType.AUTO_PASSIVE:
        this.createPassiveTrigger(playerId, skillDef, skillInstance, playerTriggers);
        break;
      
      case SkillActivationType.TRIGGER_BASED:
        this.createEventTriggers(playerId, skillDef, skillInstance, playerTriggers);
        break;
      
      case SkillActivationType.COMBO_CHAIN:
        this.createComboTriggers(playerId, skillDef, skillInstance, playerTriggers);
        break;
    }

    this.activeTriggers.set(playerId, playerTriggers);
  }

  // ============================================================================
  // 触发器创建方法
  // ============================================================================

  private createPassiveTrigger(
    playerId: string,
    skillDef: SkillDefinition,
    skillInstance: PlayerSkillInstance,
    triggers: SkillTrigger[]
  ): void {
    const trigger: SkillTrigger = {
      id: `passive_${skillDef.id}_${Date.now()}`,
      type: TriggerType.PASSIVE_ACTIVATION,
      skillId: skillDef.id,
      playerId: playerId,
      conditions: this.extractConditionsFromSkill(skillDef),
      priority: this.calculateTriggerPriority(skillDef),
      currentActivations: 0,
      isActive: true
    };

    triggers.push(trigger);
    console.log(`🔔 创建被动技能触发器: ${skillDef.name}`);
  }

  private createEventTriggers(
    playerId: string,
    skillDef: SkillDefinition,
    skillInstance: PlayerSkillInstance,
    triggers: SkillTrigger[]
  ): void {
    // 根据技能效果和标签确定触发事件类型
    const eventTriggers = this.determineEventTriggers(skillDef);

    eventTriggers.forEach(triggerType => {
      const trigger: SkillTrigger = {
        id: `event_${skillDef.id}_${triggerType}_${Date.now()}`,
        type: TriggerType.GAME_EVENT,
        skillId: skillDef.id,
        playerId: playerId,
        conditions: this.extractConditionsFromSkill(skillDef),
        priority: this.calculateTriggerPriority(skillDef),
        maxActivationsPerTurn: 3, // 防止无限触发
        currentActivations: 0,
        isActive: true,
        cooldown: skillDef.cooldown
      };

      triggers.push(trigger);
      console.log(`🔔 创建事件触发器: ${skillDef.name} -> ${triggerType}`);
    });
  }

  private createComboTriggers(
    playerId: string,
    skillDef: SkillDefinition,
    skillInstance: PlayerSkillInstance,
    triggers: SkillTrigger[]
  ): void {
    if (!skillDef.comboSkills || skillDef.comboSkills.length === 0) return;

    const trigger: SkillTrigger = {
      id: `combo_${skillDef.id}_${Date.now()}`,
      type: TriggerType.COMBO_CHAIN,
      skillId: skillDef.id,
      playerId: playerId,
      conditions: [
        {
          type: SkillConditionType.COMBO_ACTIVE,
          operator: 'eq',
          value: true,
          description: '组合技能激活条件'
        }
      ],
      priority: this.calculateTriggerPriority(skillDef) + 10, // 组合技能优先级更高
      maxActivationsPerTurn: 1,
      currentActivations: 0,
      isActive: false // 初始未激活，需要前置技能激活
    };

    triggers.push(trigger);
    console.log(`🔔 创建组合技能触发器: ${skillDef.name}`);
  }

  // ============================================================================
  // 触发器处理逻辑
  // ============================================================================

  /**
   * 处理游戏事件触发
   */
  public async handleGameEvent(event: GameEvent, context: TriggerContext): Promise<TriggerResult> {
    const results: TriggerResult = {
      triggered: false,
      skillsActivated: [],
      effects: [],
      message: '',
      nextTriggers: []
    };

    if (this.processingTriggers) {
      console.warn('触发器正在处理中，跳过本次事件');
      return results;
    }

    this.processingTriggers = true;

    try {
      // 收集所有可能触发的技能
      const potentialTriggers = this.collectPotentialTriggers(event, context);

      // 按优先级排序
      potentialTriggers.sort((a, b) => b.priority - a.priority);

      // 依次检查和触发
      for (const trigger of potentialTriggers) {
        if (await this.shouldTrigger(trigger, context)) {
          const triggerResult = await this.activateTrigger(trigger, context);
          if (triggerResult.triggered) {
            results.triggered = true;
            results.skillsActivated.push(...triggerResult.skillsActivated);
            results.effects.push(...triggerResult.effects);
            results.message += triggerResult.message + ' ';

            // 检查是否有连锁触发
            const chainTriggers = await this.checkChainTriggers(trigger, context);
            results.nextTriggers?.push(...chainTriggers);
          }
        }
      }

      // 处理连锁触发
      if (results.nextTriggers && results.nextTriggers.length > 0) {
        for (const nextTrigger of results.nextTriggers) {
          const chainResult = await this.activateTrigger(nextTrigger, context);
          if (chainResult.triggered) {
            results.skillsActivated.push(...chainResult.skillsActivated);
            results.effects.push(...chainResult.effects);
            results.message += chainResult.message + ' ';
          }
        }
      }

    } finally {
      this.processingTriggers = false;
    }

    return results;
  }

  /**
   * 处理玩家行动触发
   */
  public async handlePlayerAction(
    playerId: string,
    actionType: string,
    actionData: any,
    context: TriggerContext
  ): Promise<TriggerResult> {
    const playerTriggers = this.activeTriggers.get(playerId) || [];
    const relevantTriggers = playerTriggers.filter(trigger => 
      trigger.type === TriggerType.PLAYER_ACTION && trigger.isActive
    );

    const results: TriggerResult = {
      triggered: false,
      skillsActivated: [],
      effects: [],
      message: ''
    };

    for (const trigger of relevantTriggers) {
      if (await this.shouldTriggerForAction(trigger, actionType, actionData, context)) {
        const triggerResult = await this.activateTrigger(trigger, context);
        if (triggerResult.triggered) {
          results.triggered = true;
          results.skillsActivated.push(...triggerResult.skillsActivated);
          results.effects.push(...triggerResult.effects);
          results.message += triggerResult.message + ' ';
        }
      }
    }

    return results;
  }

  /**
   * 处理回合阶段触发
   */
  public async handleTurnPhase(
    phase: string,
    playerId: string,
    context: TriggerContext
  ): Promise<TriggerResult> {
    // 重置回合触发计数
    if (phase === 'turn_start') {
      this.resetTurnActivations(playerId);
    }

    const playerTriggers = this.activeTriggers.get(playerId) || [];
    const phaseTriggers = playerTriggers.filter(trigger => 
      trigger.type === TriggerType.TURN_PHASE && trigger.isActive
    );

    const results: TriggerResult = {
      triggered: false,
      skillsActivated: [],
      effects: [],
      message: ''
    };

    for (const trigger of phaseTriggers) {
      if (await this.shouldTriggerForPhase(trigger, phase, context)) {
        const triggerResult = await this.activateTrigger(trigger, context);
        if (triggerResult.triggered) {
          results.triggered = true;
          results.skillsActivated.push(...triggerResult.skillsActivated);
          results.effects.push(...triggerResult.effects);
          results.message += triggerResult.message + ' ';
        }
      }
    }

    return results;
  }

  /**
   * 处理被动技能检查
   */
  public async checkPassiveSkills(playerId: string, context: TriggerContext): Promise<TriggerResult> {
    const playerTriggers = this.activeTriggers.get(playerId) || [];
    const passiveTriggers = playerTriggers.filter(trigger => 
      trigger.type === TriggerType.PASSIVE_ACTIVATION && trigger.isActive
    );

    const results: TriggerResult = {
      triggered: false,
      skillsActivated: [],
      effects: [],
      message: ''
    };

    for (const trigger of passiveTriggers) {
      if (await this.shouldTrigger(trigger, context)) {
        const triggerResult = await this.activateTrigger(trigger, context);
        if (triggerResult.triggered) {
          results.triggered = true;
          results.skillsActivated.push(...triggerResult.skillsActivated);
          results.effects.push(...triggerResult.effects);
          results.message += triggerResult.message + ' ';
        }
      }
    }

    return results;
  }

  // ============================================================================
  // 触发条件检查
  // ============================================================================

  private async shouldTrigger(trigger: SkillTrigger, context: TriggerContext): Promise<boolean> {
    // 检查基本条件
    if (!trigger.isActive || 
        (trigger.maxActivationsPerTurn && trigger.currentActivations >= trigger.maxActivationsPerTurn)) {
      return false;
    }

    // 检查冷却时间
    if (trigger.cooldown && trigger.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - trigger.lastTriggered;
      if (timeSinceLastTrigger < trigger.cooldown * 1000) {
        return false;
      }
    }

    // 检查技能冷却
    if (!this.skillManager.canUseSkill(trigger.playerId, trigger.skillId, context.gameState)) {
      return false;
    }

    // 检查触发条件
    return this.checkTriggerConditions(trigger.conditions, trigger.playerId, context);
  }

  private async shouldTriggerForAction(
    trigger: SkillTrigger,
    actionType: string,
    actionData: any,
    context: TriggerContext
  ): Promise<boolean> {
    if (!await this.shouldTrigger(trigger, context)) {
      return false;
    }

    // 检查行动类型匹配
    const skillDef = this.skillManager.getSkillDefinition(trigger.skillId);
    if (!skillDef) return false;

    // 根据技能标签判断是否应该对此行动类型触发
    return this.isActionRelevantToSkill(actionType, actionData, skillDef);
  }

  private async shouldTriggerForPhase(
    trigger: SkillTrigger,
    phase: string,
    context: TriggerContext
  ): Promise<boolean> {
    if (!await this.shouldTrigger(trigger, context)) {
      return false;
    }

    const skillDef = this.skillManager.getSkillDefinition(trigger.skillId);
    if (!skillDef) return false;

    // 检查技能是否应该在此阶段触发
    return this.isPhaseRelevantToSkill(phase, skillDef);
  }

  private checkTriggerConditions(
    conditions: SkillCondition[],
    playerId: string,
    context: TriggerContext
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      return this.evaluateCondition(condition, playerId, context);
    });
  }

  private evaluateCondition(
    condition: SkillCondition,
    playerId: string,
    context: TriggerContext
  ): boolean {
    const player = context.gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    switch (condition.type) {
      case SkillConditionType.PLAYER_MONEY:
        return this.compareValues(player.money, condition.operator, condition.value);
      
      case SkillConditionType.PLAYER_POSITION:
        return this.compareValues(player.position, condition.operator, condition.value);
      
      case SkillConditionType.PLAYER_PROPERTIES:
        return this.compareValues(player.properties.length, condition.operator, condition.value);
      
      case SkillConditionType.GAME_ROUND:
        return this.compareValues(context.gameState.round, condition.operator, condition.value);
      
      case SkillConditionType.GAME_SEASON:
        return condition.operator === 'eq' ? 
          context.gameState.season === condition.value : 
          context.gameState.season !== condition.value;
      
      case SkillConditionType.ZODIAC_COMPATIBILITY:
        return this.checkZodiacCompatibility(player.zodiac, condition.value);
      
      default:
        console.warn(`未知的条件类型: ${condition.type}`);
        return false;
    }
  }

  private compareValues(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'gt': return actual > expected;
      case 'gte': return actual >= expected;
      case 'lt': return actual < expected;
      case 'lte': return actual <= expected;
      default: return false;
    }
  }

  // ============================================================================
  // 触发器激活
  // ============================================================================

  private async activateTrigger(trigger: SkillTrigger, context: TriggerContext): Promise<TriggerResult> {
    try {
      console.log(`⚡ 触发技能: ${trigger.skillId} (玩家: ${trigger.playerId})`);

      // 使用技能
      const skillResult = await this.skillManager.useSkill(
        trigger.playerId,
        trigger.skillId,
        [], // 触发技能通常没有明确目标
        context.gameState
      );

      // 更新触发器状态
      trigger.currentActivations += 1;
      trigger.lastTriggered = Date.now();
      this.triggeredSkillsThisTurn.add(trigger.skillId);

      const skillDef = this.skillManager.getSkillDefinition(trigger.skillId);
      const skillName = skillDef?.name || trigger.skillId;

      return {
        triggered: skillResult.success,
        skillsActivated: skillResult.success ? [trigger.skillId] : [],
        effects: skillResult.effects,
        message: `触发 ${skillName}: ${skillResult.message}`
      };

    } catch (error) {
      console.error(`触发器激活失败:`, error);
      return {
        triggered: false,
        skillsActivated: [],
        effects: [],
        message: `触发失败: ${error}`
      };
    }
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private collectPotentialTriggers(event: GameEvent, context: TriggerContext): SkillTrigger[] {
    const potentialTriggers: SkillTrigger[] = [];

    // 遍历所有玩家的触发器
    this.activeTriggers.forEach((triggers, playerId) => {
      triggers.forEach(trigger => {
        if (this.isTriggerRelevantToEvent(trigger, event)) {
          potentialTriggers.push(trigger);
        }
      });
    });

    return potentialTriggers;
  }

  private isTriggerRelevantToEvent(trigger: SkillTrigger, event: GameEvent): boolean {
    if (trigger.type !== TriggerType.GAME_EVENT) return false;

    // 根据事件类型和技能标签判断相关性
    const skillDef = this.skillManager.getSkillDefinition(trigger.skillId);
    if (!skillDef) return false;

    // 简化实现：基于标签匹配
    return skillDef.tags.some(tag => 
      event.type.includes(tag) || 
      tag === 'universal' || 
      this.isEventTypeRelatedToSkillCategory(event.type, skillDef.category)
    );
  }

  private isEventTypeRelatedToSkillCategory(eventType: string, category: SkillCategory): boolean {
    // 根据事件类型和技能类别判断相关性
    const categoryRelations = {
      [SkillCategory.ACTIVE_ECONOMIC]: ['property', 'money', 'trade'],
      [SkillCategory.ACTIVE_DEFENSIVE]: ['attack', 'damage', 'threat'],
      [SkillCategory.ACTIVE_OFFENSIVE]: ['player', 'target', 'combat'],
      [SkillCategory.PASSIVE_PERMANENT]: ['any'],
      [SkillCategory.TRIGGERED_EVENT]: ['event', 'trigger', 'special']
    };

    const relatedEvents = categoryRelations[category] || [];
    return relatedEvents.some(relation => eventType.includes(relation)) || relatedEvents.includes('any');
  }

  private isActionRelevantToSkill(actionType: string, actionData: any, skillDef: SkillDefinition): boolean {
    // 根据行动类型和技能特性判断相关性
    const actionSkillMap = {
      'buy_property': ['economic', 'property'],
      'sell_property': ['economic', 'property'],
      'use_skill': ['skill', 'ability'],
      'roll_dice': ['dice', 'movement'],
      'move_player': ['movement', 'position']
    };

    const relevantTags = actionSkillMap[actionType as keyof typeof actionSkillMap] || [];
    return relevantTags.some(tag => skillDef.tags.includes(tag));
  }

  private isPhaseRelevantToSkill(phase: string, skillDef: SkillDefinition): boolean {
    // 根据回合阶段和技能特性判断相关性
    const phaseSkillMap = {
      'turn_start': ['turn_start', 'begin'],
      'turn_end': ['turn_end', 'finish'],
      'roll_dice': ['dice', 'movement'],
      'process_cell': ['landing', 'position'],
      'handle_event': ['event', 'trigger']
    };

    const relevantTags = phaseSkillMap[phase as keyof typeof phaseSkillMap] || [];
    return relevantTags.some(tag => skillDef.tags.includes(tag));
  }

  private async checkChainTriggers(trigger: SkillTrigger, context: TriggerContext): Promise<SkillTrigger[]> {
    const chainTriggers: SkillTrigger[] = [];

    // 检查组合技能触发
    const playerTriggers = this.activeTriggers.get(trigger.playerId) || [];
    const comboTriggers = playerTriggers.filter(t => 
      t.type === TriggerType.COMBO_CHAIN && 
      !t.isActive && 
      this.isComboTriggerReady(t, trigger)
    );

    comboTriggers.forEach(comboTrigger => {
      comboTrigger.isActive = true;
      chainTriggers.push(comboTrigger);
    });

    return chainTriggers;
  }

  private isComboTriggerReady(comboTrigger: SkillTrigger, justActivatedTrigger: SkillTrigger): boolean {
    const comboSkillDef = this.skillManager.getSkillDefinition(comboTrigger.skillId);
    if (!comboSkillDef || !comboSkillDef.comboSkills) return false;

    // 检查是否刚触发的技能是组合技能的前置条件
    return comboSkillDef.comboSkills.includes(justActivatedTrigger.skillId);
  }

  private resetTurnActivations(playerId: string): void {
    const playerTriggers = this.activeTriggers.get(playerId) || [];
    playerTriggers.forEach(trigger => {
      trigger.currentActivations = 0;
    });
    this.triggeredSkillsThisTurn.clear();
  }

  private extractConditionsFromSkill(skillDef: SkillDefinition): SkillCondition[] {
    const conditions: SkillCondition[] = [];
    
    // 从技能效果中提取条件
    skillDef.effects.forEach(effect => {
      if (effect.conditions) {
        conditions.push(...effect.conditions);
      }
    });

    return conditions;
  }

  private calculateTriggerPriority(skillDef: SkillDefinition): number {
    let priority = 50; // 基础优先级

    // 根据稀有度调整
    switch (skillDef.rarity) {
      case 'legendary': priority += 40; break;
      case 'epic': priority += 30; break;
      case 'rare': priority += 20; break;
      case 'uncommon': priority += 10; break;
      default: break;
    }

    // 根据类别调整
    switch (skillDef.category) {
      case SkillCategory.ACTIVE_DEFENSIVE: priority += 15; break;
      case SkillCategory.PASSIVE_PERMANENT: priority += 5; break;
      case SkillCategory.TRIGGERED_EVENT: priority += 10; break;
      default: break;
    }

    return priority;
  }

  private determineEventTriggers(skillDef: SkillDefinition): string[] {
    const triggers: string[] = [];
    
    // 根据技能标签确定事件触发类型
    if (skillDef.tags.includes('defensive')) {
      triggers.push('player_attacked', 'property_threatened');
    }
    
    if (skillDef.tags.includes('economic')) {
      triggers.push('money_changed', 'property_event');
    }
    
    if (skillDef.tags.includes('movement')) {
      triggers.push('player_moved', 'dice_rolled');
    }

    if (skillDef.tags.includes('event')) {
      triggers.push('game_event', 'special_event');
    }

    return triggers;
  }

  private checkZodiacCompatibility(playerZodiac: string, requiredZodiac: string): boolean {
    // 简化的生肖兼容性检查
    return playerZodiac === requiredZodiac;
  }

  private handleSkillSystemEvent(event: SkillSystemEvent): void {
    // 响应技能系统事件，可能触发连锁反应
    if (event.type === SkillSystemEventType.SKILL_USED) {
      // 技能使用后可能触发其他技能
      console.log(`📡 检测到技能使用事件: ${event.skillId}`);
    }
  }

  // ============================================================================
  // 公共接口
  // ============================================================================

  /**
   * 添加自定义触发器
   */
  public addCustomTrigger(trigger: SkillTrigger): void {
    const playerTriggers = this.activeTriggers.get(trigger.playerId) || [];
    playerTriggers.push(trigger);
    this.activeTriggers.set(trigger.playerId, playerTriggers);
  }

  /**
   * 移除触发器
   */
  public removeTrigger(playerId: string, triggerId: string): void {
    const playerTriggers = this.activeTriggers.get(playerId) || [];
    const index = playerTriggers.findIndex(t => t.id === triggerId);
    if (index !== -1) {
      playerTriggers.splice(index, 1);
      this.activeTriggers.set(playerId, playerTriggers);
    }
  }

  /**
   * 获取玩家的所有触发器
   */
  public getPlayerTriggers(playerId: string): SkillTrigger[] {
    return this.activeTriggers.get(playerId) || [];
  }

  /**
   * 启用/禁用触发器
   */
  public setTriggerActive(playerId: string, triggerId: string, active: boolean): void {
    const trigger = this.getPlayerTriggers(playerId).find(t => t.id === triggerId);
    if (trigger) {
      trigger.isActive = active;
    }
  }

  /**
   * 获取触发统计信息
   */
  public getTriggerStats(playerId: string): any {
    const triggers = this.getPlayerTriggers(playerId);
    return {
      totalTriggers: triggers.length,
      activeTriggers: triggers.filter(t => t.isActive).length,
      triggersThisTurn: Array.from(this.triggeredSkillsThisTurn),
      triggersByType: triggers.reduce((acc: any, trigger) => {
        acc[trigger.type] = (acc[trigger.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

export default SkillTriggerSystem;