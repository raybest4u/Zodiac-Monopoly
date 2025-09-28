/**
 * 行动规则检查系统 - 验证和执行玩家行动的规则引擎
 * 提供实时行动验证、权限检查和执行确认
 */

import { EventEmitter } from '../utils/EventEmitter';
import type {
  GameState,
  Player,
  PlayerAction,
  ActionType,
  GamePhase,
  BoardCell,
  PlayerSkill,
  DiceResult,
  ActionResult
} from '../types/game';
import type {
  RuleValidationResult,
  RuleExecutionResult,
  RuleExecutionContext
} from './GameRuleSystem';

export interface ActionPermission {
  actionType: ActionType;
  allowed: boolean;
  reason?: string;
  conditions?: ActionCondition[];
  timeWindow?: TimeWindow;
  prerequisites?: PrerequisiteCheck[];
}

export interface ActionCondition {
  type: 'money' | 'position' | 'phase' | 'turn' | 'skill' | 'property' | 'state';
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
  description: string;
}

export interface TimeWindow {
  startPhase?: GamePhase;
  endPhase?: GamePhase;
  duration?: number;
  deadline?: number;
}

export interface PrerequisiteCheck {
  type: 'dice_rolled' | 'moved' | 'property_owned' | 'skill_available' | 'payment_made';
  description: string;
  satisfied: boolean;
  satisfyingAction?: ActionType;
}

export interface ActionExecutionPlan {
  actionId: string;
  steps: ExecutionStep[];
  estimatedDuration: number;
  dependencies: string[];
  rollbackPlan?: RollbackStep[];
}

export interface ExecutionStep {
  id: string;
  type: 'validation' | 'state_change' | 'effect_application' | 'event_trigger' | 'notification';
  description: string;
  parameters: Record<string, any>;
  optional: boolean;
  rollbackData?: any;
}

export interface RollbackStep {
  stepId: string;
  action: 'revert_state' | 'remove_effect' | 'cancel_event';
  data: any;
}

export interface ActionValidationConfig {
  strictMode: boolean;
  allowPhaseOverride: boolean;
  enableTimeChecks: boolean;
  validateEconomy: boolean;
  checkSkillCooldowns: boolean;
  verifyPositions: boolean;
  allowedRetries: number;
}

/**
 * 行动规则检查器
 */
export class ActionRuleChecker extends EventEmitter {
  private validationCache = new Map<string, RuleValidationResult>();
  private permissionCache = new Map<string, ActionPermission[]>();
  private executionHistory: ActionExecutionPlan[] = [];
  
  private readonly cacheTimeout = 10000; // 10秒缓存
  private readonly maxHistorySize = 200;
  
  private readonly defaultConfig: ActionValidationConfig = {
    strictMode: true,
    allowPhaseOverride: false,
    enableTimeChecks: true,
    validateEconomy: true,
    checkSkillCooldowns: true,
    verifyPositions: true,
    allowedRetries: 3
  };

  constructor(private config: Partial<ActionValidationConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * 获取玩家可执行的行动
   */
  async getAvailableActions(
    gameState: GameState, 
    playerId: string
  ): Promise<ActionPermission[]> {
    const cacheKey = this.generatePermissionCacheKey(gameState, playerId);
    const cached = this.permissionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return [];
    }

    const permissions: ActionPermission[] = [];
    const allActionTypes: ActionType[] = [
      'roll_dice', 'move_player', 'buy_property', 'sell_property',
      'upgrade_property', 'use_skill', 'event_choice', 'trade_request', 'pass'
    ];

    for (const actionType of allActionTypes) {
      const permission = await this.checkActionPermission(
        actionType, 
        gameState, 
        player
      );
      permissions.push(permission);
    }

    // 缓存结果
    this.permissionCache.set(cacheKey, permissions);
    setTimeout(() => this.permissionCache.delete(cacheKey), this.cacheTimeout);

    return permissions;
  }

  /**
   * 验证特定行动
   */
  async validateAction(
    action: PlayerAction, 
    gameState: GameState
  ): Promise<RuleValidationResult> {
    const cacheKey = this.generateValidationCacheKey(action, gameState);
    const cached = this.validationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      return {
        isValid: false,
        reason: '玩家不存在'
      };
    }

    const result = await this.performActionValidation(action, gameState, player);
    
    // 缓存结果
    this.validationCache.set(cacheKey, result);
    setTimeout(() => this.validationCache.delete(cacheKey), this.cacheTimeout);

    return result;
  }

  /**
   * 创建行动执行计划
   */
  async createExecutionPlan(
    action: PlayerAction, 
    gameState: GameState
  ): Promise<ActionExecutionPlan> {
    const actionId = `${action.type}_${action.playerId}_${Date.now()}`;
    const steps: ExecutionStep[] = [];
    const dependencies: string[] = [];

    // 根据行动类型创建执行步骤
    switch (action.type) {
      case 'roll_dice':
        steps.push(...this.createDiceRollSteps(action, gameState));
        break;
        
      case 'move_player':
        steps.push(...this.createMovementSteps(action, gameState));
        dependencies.push('dice_rolled');
        break;
        
      case 'buy_property':
        steps.push(...this.createPropertyPurchaseSteps(action, gameState));
        dependencies.push('moved');
        break;
        
      case 'use_skill':
        steps.push(...this.createSkillUsageSteps(action, gameState));
        break;
        
      case 'upgrade_property':
        steps.push(...this.createPropertyUpgradeSteps(action, gameState));
        break;
        
      default:
        steps.push({
          id: 'generic_action',
          type: 'state_change',
          description: `执行${action.type}`,
          parameters: action.data || {},
          optional: false
        });
    }

    const plan: ActionExecutionPlan = {
      actionId,
      steps,
      estimatedDuration: this.calculateEstimatedDuration(steps),
      dependencies,
      rollbackPlan: this.createRollbackPlan(steps)
    };

    this.addToHistory(plan);
    return plan;
  }

  /**
   * 执行行动验证
   */
  async executeActionValidation(
    action: PlayerAction,
    gameState: GameState,
    plan: ActionExecutionPlan
  ): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    let currentStep = 0;
    const executedSteps: ExecutionStep[] = [];
    const appliedChanges: any[] = [];

    try {
      // 执行每个步骤
      for (const step of plan.steps) {
        const stepResult = await this.executeStep(step, action, gameState);
        
        if (!stepResult.success && !step.optional) {
          // 必需步骤失败，执行回滚
          await this.executeRollback(executedSteps, appliedChanges, gameState);
          
          return {
            success: false,
            message: `执行失败于步骤: ${step.description}`,
            effects: [],
            validationsPassed: [],
            validationsFailed: [step.id],
            stateChanges: [],
            triggeredEvents: []
          };
        }
        
        executedSteps.push(step);
        if (stepResult.changes) {
          appliedChanges.push(...stepResult.changes);
        }
        currentStep++;
      }

      // 所有步骤成功执行
      return {
        success: true,
        message: `成功执行${action.type}`,
        effects: [],
        validationsPassed: plan.steps.map(s => s.id),
        validationsFailed: [],
        stateChanges: appliedChanges,
        triggeredEvents: this.extractTriggeredEvents(executedSteps)
      };

    } catch (error) {
      // 执行过程中出现异常
      await this.executeRollback(executedSteps, appliedChanges, gameState);
      
      return {
        success: false,
        message: `执行异常: ${error instanceof Error ? error.message : String(error)}`,
        effects: [],
        validationsPassed: [],
        validationsFailed: ['execution_error'],
        stateChanges: [],
        triggeredEvents: []
      };
    } finally {
      const duration = Date.now() - startTime;
      this.emit('actionExecuted', {
        action,
        plan,
        duration,
        success: currentStep === plan.steps.length
      });
    }
  }

  /**
   * 检查行动快速验证
   */
  quickValidateAction(action: PlayerAction, gameState: GameState): boolean {
    // 快速检查，不缓存
    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) return false;

    // 检查基本权限
    switch (action.type) {
      case 'roll_dice':
        return gameState.phase === 'roll_dice' && 
               gameState.currentPlayerIndex === gameState.players.indexOf(player);
               
      case 'move_player':
        return gameState.phase === 'move_player' && 
               gameState.lastDiceResult !== undefined;
               
      case 'buy_property':
        const currentCell = gameState.board[player.position];
        return gameState.phase === 'process_cell' &&
               currentCell.type === 'property' &&
               !currentCell.ownerId &&
               (currentCell.price || 0) <= player.money;
               
      default:
        return true; // 其他行动默认允许
    }
  }

  /**
   * 获取行动限制信息
   */
  getActionRestrictions(
    actionType: ActionType,
    gameState: GameState,
    playerId: string
  ): ActionCondition[] {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];

    const restrictions: ActionCondition[] = [];

    // 通用限制
    if (actionType !== 'pass') {
      restrictions.push({
        type: 'turn',
        field: 'currentPlayerIndex',
        operator: 'eq',
        value: gameState.players.indexOf(player),
        description: '必须是玩家的回合'
      });
    }

    // 特定行动限制
    switch (actionType) {
      case 'roll_dice':
        restrictions.push({
          type: 'phase',
          field: 'phase',
          operator: 'eq',
          value: 'roll_dice',
          description: '必须在掷骰子阶段'
        });
        break;

      case 'move_player':
        restrictions.push({
          type: 'phase',
          field: 'phase',
          operator: 'eq',
          value: 'move_player',
          description: '必须在移动阶段'
        });
        restrictions.push({
          type: 'state',
          field: 'lastDiceResult',
          operator: 'ne',
          value: null,
          description: '必须已掷骰子'
        });
        break;

      case 'buy_property':
        restrictions.push({
          type: 'phase',
          field: 'phase',
          operator: 'eq',
          value: 'process_cell',
          description: '必须在处理格子阶段'
        });
        break;

      case 'use_skill':
        restrictions.push({
          type: 'skill',
          field: 'cooldown',
          operator: 'lte',
          value: 0,
          description: '技能必须冷却完毕'
        });
        break;
    }

    return restrictions;
  }

  // 私有方法

  /**
   * 检查行动权限
   */
  private async checkActionPermission(
    actionType: ActionType,
    gameState: GameState,
    player: Player
  ): Promise<ActionPermission> {
    const restrictions = this.getActionRestrictions(actionType, gameState, player.id);
    
    // 检查所有限制条件
    for (const restriction of restrictions) {
      const conditionMet = this.evaluateCondition(restriction, gameState, player);
      if (!conditionMet) {
        return {
          actionType,
          allowed: false,
          reason: restriction.description,
          conditions: [restriction]
        };
      }
    }

    // 检查特殊条件
    const specialCheck = await this.checkSpecialConditions(actionType, gameState, player);
    if (!specialCheck.allowed) {
      return specialCheck;
    }

    return {
      actionType,
      allowed: true,
      conditions: restrictions
    };
  }

  /**
   * 检查特殊条件
   */
  private async checkSpecialConditions(
    actionType: ActionType,
    gameState: GameState,
    player: Player
  ): Promise<ActionPermission> {
    switch (actionType) {
      case 'buy_property':
        const currentCell = gameState.board[player.position];
        if (currentCell.type !== 'property') {
          return {
            actionType,
            allowed: false,
            reason: '当前位置不是可购买的财产'
          };
        }
        
        if (currentCell.ownerId) {
          return {
            actionType,
            allowed: false,
            reason: '该财产已有所有者'
          };
        }
        
        if ((currentCell.price || 0) > player.money) {
          return {
            actionType,
            allowed: false,
            reason: '资金不足以购买该财产'
          };
        }
        break;

      case 'use_skill':
        // 检查是否有可用技能
        const availableSkills = player.skills.filter(skill => {
          const cooldownRemaining = skill.lastUsed ? 
            skill.cooldown * 1000 - (Date.now() - skill.lastUsed) : 0;
          return cooldownRemaining <= 0;
        });
        
        if (availableSkills.length === 0) {
          return {
            actionType,
            allowed: false,
            reason: '没有可用的技能'
          };
        }
        break;

      case 'upgrade_property':
        // 检查是否有可升级的财产
        const upgradeableProperties = player.properties.filter(propertyId => {
          const property = gameState.board.find(cell => cell.id === propertyId);
          return property && (property.level || 1) < 5;
        });
        
        if (upgradeableProperties.length === 0) {
          return {
            actionType,
            allowed: false,
            reason: '没有可升级的财产'
          };
        }
        break;
    }

    return { actionType, allowed: true };
  }

  /**
   * 执行行动验证
   */
  private async performActionValidation(
    action: PlayerAction,
    gameState: GameState,
    player: Player
  ): Promise<RuleValidationResult> {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 基础验证
    if (gameState.status !== 'playing') {
      violations.push('游戏未在进行中');
    }

    if (gameState.currentPlayerIndex !== gameState.players.indexOf(player)) {
      violations.push('不是该玩家的回合');
    }

    // 行动特定验证
    switch (action.type) {
      case 'roll_dice':
        if (gameState.phase !== 'roll_dice') {
          violations.push('当前阶段不能掷骰子');
        }
        if (gameState.lastDiceResult && 
            Date.now() - gameState.lastDiceResult.timestamp < 1000) {
          violations.push('刚刚已经掷过骰子');
        }
        break;

      case 'move_player':
        if (!gameState.lastDiceResult) {
          violations.push('必须先掷骰子');
        }
        break;

      case 'buy_property':
        const propertyId = action.data?.propertyId;
        if (!propertyId) {
          violations.push('必须指定要购买的财产');
        } else {
          const property = gameState.board.find(cell => cell.id === propertyId);
          if (!property) {
            violations.push('指定的财产不存在');
          } else if (property.ownerId) {
            violations.push('该财产已有所有者');
          } else if (player.position !== property.position) {
            violations.push('玩家不在该财产位置');
          } else if ((property.price || 0) > player.money) {
            violations.push('资金不足');
          }
        }
        break;

      case 'use_skill':
        const skillId = action.data?.skillId;
        if (!skillId) {
          violations.push('必须指定要使用的技能');
        } else {
          const skill = player.skills.find(s => s.id === skillId);
          if (!skill) {
            violations.push('玩家不拥有该技能');
          } else if (skill.lastUsed) {
            const cooldownRemaining = skill.cooldown * 1000 - (Date.now() - skill.lastUsed);
            if (cooldownRemaining > 0) {
              violations.push(`技能还有${Math.ceil(cooldownRemaining / 1000)}秒冷却时间`);
            }
          }
        }
        break;
    }

    return {
      isValid: violations.length === 0,
      reason: violations.length > 0 ? violations.join('; ') : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * 评估条件
   */
  private evaluateCondition(
    condition: ActionCondition,
    gameState: GameState,
    player: Player
  ): boolean {
    let actualValue: any;

    // 获取实际值
    switch (condition.type) {
      case 'money':
        actualValue = player.money;
        break;
      case 'position':
        actualValue = player.position;
        break;
      case 'phase':
        actualValue = gameState.phase;
        break;
      case 'turn':
        actualValue = gameState.currentPlayerIndex;
        break;
      case 'state':
        actualValue = (gameState as any)[condition.field];
        break;
      default:
        return true;
    }

    // 应用操作符
    switch (condition.operator) {
      case 'eq': return actualValue === condition.value;
      case 'ne': return actualValue !== condition.value;
      case 'gt': return actualValue > condition.value;
      case 'gte': return actualValue >= condition.value;
      case 'lt': return actualValue < condition.value;
      case 'lte': return actualValue <= condition.value;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(actualValue);
      case 'contains': return Array.isArray(actualValue) && actualValue.includes(condition.value);
      default: return false;
    }
  }

  /**
   * 创建掷骰子步骤
   */
  private createDiceRollSteps(action: PlayerAction, gameState: GameState): ExecutionStep[] {
    return [
      {
        id: 'validate_dice_roll',
        type: 'validation',
        description: '验证掷骰子权限',
        parameters: { phase: 'roll_dice' },
        optional: false
      },
      {
        id: 'roll_dice',
        type: 'state_change',
        description: '执行掷骰子',
        parameters: {},
        optional: false
      },
      {
        id: 'update_dice_result',
        type: 'state_change',
        description: '更新骰子结果',
        parameters: {},
        optional: false
      },
      {
        id: 'trigger_dice_events',
        type: 'event_trigger',
        description: '触发骰子相关事件',
        parameters: {},
        optional: true
      }
    ];
  }

  /**
   * 创建移动步骤
   */
  private createMovementSteps(action: PlayerAction, gameState: GameState): ExecutionStep[] {
    return [
      {
        id: 'validate_movement',
        type: 'validation',
        description: '验证移动权限',
        parameters: {},
        optional: false
      },
      {
        id: 'calculate_new_position',
        type: 'state_change',
        description: '计算新位置',
        parameters: {},
        optional: false
      },
      {
        id: 'update_player_position',
        type: 'state_change',
        description: '更新玩家位置',
        parameters: {},
        optional: false
      },
      {
        id: 'check_start_bonus',
        type: 'effect_application',
        description: '检查起点奖励',
        parameters: {},
        optional: true
      }
    ];
  }

  /**
   * 创建财产购买步骤
   */
  private createPropertyPurchaseSteps(action: PlayerAction, gameState: GameState): ExecutionStep[] {
    return [
      {
        id: 'validate_property_purchase',
        type: 'validation',
        description: '验证财产购买',
        parameters: { propertyId: action.data?.propertyId },
        optional: false
      },
      {
        id: 'deduct_money',
        type: 'state_change',
        description: '扣除购买资金',
        parameters: {},
        optional: false
      },
      {
        id: 'transfer_ownership',
        type: 'state_change',
        description: '转移财产所有权',
        parameters: {},
        optional: false
      },
      {
        id: 'update_player_properties',
        type: 'state_change',
        description: '更新玩家财产列表',
        parameters: {},
        optional: false
      }
    ];
  }

  /**
   * 创建技能使用步骤
   */
  private createSkillUsageSteps(action: PlayerAction, gameState: GameState): ExecutionStep[] {
    return [
      {
        id: 'validate_skill_usage',
        type: 'validation',
        description: '验证技能使用',
        parameters: { skillId: action.data?.skillId },
        optional: false
      },
      {
        id: 'apply_skill_effects',
        type: 'effect_application',
        description: '应用技能效果',
        parameters: {},
        optional: false
      },
      {
        id: 'update_skill_cooldown',
        type: 'state_change',
        description: '更新技能冷却时间',
        parameters: {},
        optional: false
      }
    ];
  }

  /**
   * 创建财产升级步骤
   */
  private createPropertyUpgradeSteps(action: PlayerAction, gameState: GameState): ExecutionStep[] {
    return [
      {
        id: 'validate_property_upgrade',
        type: 'validation',
        description: '验证财产升级',
        parameters: { propertyId: action.data?.propertyId },
        optional: false
      },
      {
        id: 'calculate_upgrade_cost',
        type: 'state_change',
        description: '计算升级费用',
        parameters: {},
        optional: false
      },
      {
        id: 'deduct_upgrade_cost',
        type: 'state_change',
        description: '扣除升级费用',
        parameters: {},
        optional: false
      },
      {
        id: 'upgrade_property_level',
        type: 'state_change',
        description: '提升财产等级',
        parameters: {},
        optional: false
      }
    ];
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    step: ExecutionStep,
    action: PlayerAction,
    gameState: GameState
  ): Promise<{ success: boolean; changes?: any[] }> {
    try {
      switch (step.type) {
        case 'validation':
          return { success: true };
          
        case 'state_change':
          // 这里应该实际修改游戏状态
          return { success: true, changes: [] };
          
        case 'effect_application':
          return { success: true };
          
        case 'event_trigger':
          return { success: true };
          
        case 'notification':
          return { success: true };
          
        default:
          return { success: false };
      }
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * 执行回滚
   */
  private async executeRollback(
    executedSteps: ExecutionStep[],
    appliedChanges: any[],
    gameState: GameState
  ): Promise<void> {
    // 实现回滚逻辑
    console.warn('执行回滚操作', { executedSteps: executedSteps.length, changes: appliedChanges.length });
  }

  /**
   * 创建回滚计划
   */
  private createRollbackPlan(steps: ExecutionStep[]): RollbackStep[] {
    return steps
      .filter(step => step.type === 'state_change')
      .map(step => ({
        stepId: step.id,
        action: 'revert_state' as const,
        data: step.rollbackData
      }));
  }

  /**
   * 计算预估执行时间
   */
  private calculateEstimatedDuration(steps: ExecutionStep[]): number {
    return steps.length * 100; // 每步骤100ms估算
  }

  /**
   * 提取触发的事件
   */
  private extractTriggeredEvents(steps: ExecutionStep[]): string[] {
    return steps
      .filter(step => step.type === 'event_trigger')
      .map(step => step.id);
  }

  /**
   * 生成权限缓存键
   */
  private generatePermissionCacheKey(gameState: GameState, playerId: string): string {
    return `perm_${playerId}_${gameState.phase}_${gameState.turn}_${gameState.currentPlayerIndex}`;
  }

  /**
   * 生成验证缓存键
   */
  private generateValidationCacheKey(action: PlayerAction, gameState: GameState): string {
    return `val_${action.type}_${action.playerId}_${gameState.phase}_${JSON.stringify(action.data)}`;
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(plan: ActionExecutionPlan): void {
    this.executionHistory.push(plan);
    
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }
}