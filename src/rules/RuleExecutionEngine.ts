/**
 * 规则执行引擎 - 协调所有规则系统的核心执行引擎
 * 整合规则验证、状态检查、行动执行和事件触发
 */

import { EventEmitter } from '../utils/EventEmitter';
import { GameRuleSystem } from './GameRuleSystem';
import { GameStateValidator } from './GameStateValidator';
import { ActionRuleChecker } from './ActionRuleChecker';
import { ALL_BASE_RULES } from './BaseGameRules';
import type {
  GameState,
  Player,
  PlayerAction,
  ActionResult,
  GamePhase
} from '../types/game';
import type {
  RuleValidationResult,
  RuleExecutionResult,
  RuleExecutionContext
} from './GameRuleSystem';
import type {
  ValidationResult,
  ValidationOptions
} from './GameStateValidator';
import type {
  ActionPermission,
  ActionExecutionPlan
} from './ActionRuleChecker';

export interface ExecutionContext {
  gameState: GameState;
  ruleSystem: GameRuleSystem;
  stateValidator: GameStateValidator;
  actionChecker: ActionRuleChecker;
  executionId: string;
  timestamp: number;
}

export interface ExecutionResult extends ActionResult {
  executionId: string;
  validationResult: ValidationResult;
  ruleResults: RuleExecutionResult[];
  stateChanges: StateChangeRecord[];
  performanceMetrics: PerformanceMetrics;
  nextRecommendedActions: ActionPermission[];
}

export interface StateChangeRecord {
  changeId: string;
  timestamp: number;
  type: 'player_update' | 'board_update' | 'game_state_update' | 'effect_application';
  target: string;
  oldValue: any;
  newValue: any;
  source: string;
  reversible: boolean;
  dependencies: string[];
}

export interface PerformanceMetrics {
  totalDuration: number;
  validationDuration: number;
  executionDuration: number;
  stateUpdateDuration: number;
  rulesProcessed: number;
  statesValidated: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ExecutionPolicy {
  strictValidation: boolean;
  allowPartialExecution: boolean;
  enableAutoCorrection: boolean;
  performanceOptimization: boolean;
  cacheResults: boolean;
  rollbackOnFailure: boolean;
  maxExecutionTime: number;
  retryPolicy: RetryPolicy;
  transactionMode: boolean;
  deadlockDetection: boolean;
  priorityExecution: boolean;
  circuitBreakerEnabled: boolean;
}

export interface RetryPolicy {
  enabled: boolean;
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
  circuitBreaker: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenRetryCount: number;
}

export interface TransactionScope {
  id: string;
  actions: PlayerAction[];
  rollbackPoints: Map<string, GameStateSnapshot>;
  locks: Set<string>;
  startTime: number;
  timeout: number;
  priority: number;
}

export interface GameStateSnapshot {
  state: GameState;
  timestamp: number;
  checksum: string;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  halfOpenAttempts: number;
}

export interface ExecutionStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  ruleEngineStats: any;
  validatorStats: any;
  actionCheckerStats: any;
  recentExecutions: ExecutionResult[];
}

/**
 * 规则执行引擎
 */
export class RuleExecutionEngine extends EventEmitter {
  private ruleSystem: GameRuleSystem;
  private stateValidator: GameStateValidator;
  private actionChecker: ActionRuleChecker;
  
  private executionHistory: ExecutionResult[] = [];
  private stateChangeHistory: StateChangeRecord[] = [];
  private performanceData: PerformanceMetrics[] = [];
  
  // 事务和并发控制
  private activeTransactions = new Map<string, TransactionScope>();
  private resourceLocks = new Map<string, string>(); // resource -> transactionId
  private deadlockDetector: DeadlockDetector;
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private executionQueue: PriorityQueue<QueuedExecution>;
  
  private readonly maxHistorySize = 1000;
  private readonly maxStateChangeHistory = 2000;
  private readonly maxConcurrentTransactions = 10;
  
  private readonly defaultPolicy: ExecutionPolicy = {
    strictValidation: true,
    allowPartialExecution: false,
    enableAutoCorrection: true,
    performanceOptimization: true,
    cacheResults: true,
    rollbackOnFailure: true,
    maxExecutionTime: 10000, // 10秒
    transactionMode: false,
    deadlockDetection: true,
    priorityExecution: false,
    circuitBreakerEnabled: true,
    retryPolicy: {
      enabled: true,
      maxRetries: 3,
      backoffStrategy: 'exponential',
      baseDelay: 100,
      maxDelay: 2000,
      retryableErrors: ['timeout', 'temporary_failure', 'deadlock_detected'],
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeout: 30000,
        halfOpenRetryCount: 3
      }
    }
  };

  constructor(
    private policy: Partial<ExecutionPolicy> = {}
  ) {
    super();
    
    this.policy = { ...this.defaultPolicy, ...policy };
    
    // 初始化子系统
    this.ruleSystem = new GameRuleSystem();
    this.stateValidator = new GameStateValidator();
    this.actionChecker = new ActionRuleChecker();
    
    this.setupSubsystemListeners();
    this.registerBaseRules();
  }

  /**
   * 执行玩家行动
   */
  async executeAction(
    action: PlayerAction,
    gameState: GameState
  ): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();
    
    const context: ExecutionContext = {
      gameState: { ...gameState }, // 创建副本避免意外修改
      ruleSystem: this.ruleSystem,
      stateValidator: this.stateValidator,
      actionChecker: this.actionChecker,
      executionId,
      timestamp: startTime
    };

    try {
      // 阶段1: 预验证
      const preValidation = await this.preValidateExecution(action, context);
      if (!preValidation.success && this.policy.strictValidation) {
        return this.createFailureResult(executionId, preValidation.message, startTime);
      }

      // 阶段2: 状态验证
      const stateValidation = await this.validateGameState(context);
      if (!stateValidation.isValid && this.policy.strictValidation) {
        return this.createFailureResult(executionId, '游戏状态验证失败', startTime, stateValidation);
      }

      // 阶段3: 行动执行
      const executionResult = await this.performActionExecution(action, context);
      
      // 阶段4: 后验证
      const postValidation = await this.postValidateExecution(context);
      
      // 阶段5: 状态同步
      await this.synchronizeState(context);
      
      // 创建结果
      const result = this.createSuccessResult(
        executionId,
        action,
        executionResult,
        stateValidation,
        startTime,
        context
      );
      
      // 记录执行历史
      this.recordExecution(result);
      
      // 发出执行完成事件
      this.emit('executionCompleted', result);
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = this.createFailureResult(executionId, `执行异常: ${errorMessage}`, startTime);
      
      this.emit('executionFailed', { error, result, action });
      
      return result;
    }
  }

  /**
   * 批量执行行动
   */
  async executeBatchActions(
    actions: PlayerAction[],
    gameState: GameState
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    let currentState = { ...gameState };
    
    for (const action of actions) {
      const result = await this.executeAction(action, currentState);
      results.push(result);
      
      if (result.success) {
        // 应用状态变更到下一个行动
        currentState = this.applyStateChanges(currentState, result.stateChanges);
      } else if (!this.policy.allowPartialExecution) {
        // 严格模式下，任何失败都终止批处理
        break;
      }
    }
    
    return results;
  }

  /**
   * 验证游戏状态
   */
  async validateCurrentState(gameState: GameState): Promise<ValidationResult> {
    return await this.stateValidator.validateGameState(gameState);
  }

  /**
   * 获取可用行动
   */
  async getAvailableActions(
    gameState: GameState,
    playerId: string
  ): Promise<ActionPermission[]> {
    return await this.actionChecker.getAvailableActions(gameState, playerId);
  }

  /**
   * 模拟行动执行
   */
  async simulateAction(
    action: PlayerAction,
    gameState: GameState
  ): Promise<ExecutionResult> {
    // 创建游戏状态的深拷贝进行模拟
    const simulatedState = JSON.parse(JSON.stringify(gameState));
    
    // 在模拟模式下执行（不记录历史）
    const originalHistory = this.executionHistory.length;
    const result = await this.executeAction(action, simulatedState);
    
    // 移除模拟执行的历史记录
    this.executionHistory.splice(originalHistory);
    
    return result;
  }

  /**
   * 获取推荐的下一步行动
   */
  async getRecommendedActions(
    gameState: GameState,
    playerId: string,
    limit: number = 3
  ): Promise<ActionPermission[]> {
    const availableActions = await this.getAvailableActions(gameState, playerId);
    const allowedActions = availableActions.filter(a => a.allowed);
    
    // 按重要性排序
    return allowedActions
      .sort((a, b) => this.calculateActionPriority(b, gameState) - this.calculateActionPriority(a, gameState))
      .slice(0, limit);
  }

  /**
   * 回滚到之前的状态
   */
  async rollbackToExecution(executionId: string, gameState: GameState): Promise<GameState | null> {
    const targetExecution = this.executionHistory.find(exec => exec.executionId === executionId);
    if (!targetExecution) {
      return null;
    }
    
    // 找到该执行之后的所有状态变更
    const changesAfter = this.stateChangeHistory.filter(
      change => change.timestamp > targetExecution.performanceMetrics.totalDuration
    );
    
    // 反向应用变更
    let rolledBackState = { ...gameState };
    for (const change of changesAfter.reverse()) {
      if (change.reversible) {
        rolledBackState = this.reverseStateChange(rolledBackState, change);
      }
    }
    
    return rolledBackState;
  }

  /**
   * 获取执行统计
   */
  getExecutionStatistics(): ExecutionStatistics {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(r => r.success).length;
    const failed = total - successful;
    const averageTime = total > 0 ? 
      this.executionHistory.reduce((sum, r) => sum + r.performanceMetrics.totalDuration, 0) / total : 0;
    
    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: failed,
      averageExecutionTime: averageTime,
      ruleEngineStats: this.ruleSystem.getRuleStatistics(),
      validatorStats: this.stateValidator.getValidationStatistics(),
      actionCheckerStats: {}, // ActionRuleChecker 可以添加统计方法
      recentExecutions: this.executionHistory.slice(-10)
    };
  }

  /**
   * 清理历史记录
   */
  cleanupHistory(olderThan?: number): void {
    const cutoffTime = olderThan || (Date.now() - 24 * 60 * 60 * 1000); // 24小时前
    
    this.executionHistory = this.executionHistory.filter(
      exec => exec.performanceMetrics.totalDuration > cutoffTime
    );
    
    this.stateChangeHistory = this.stateChangeHistory.filter(
      change => change.timestamp > cutoffTime
    );
    
    this.emit('historyCleanup', { cutoffTime, remaining: this.executionHistory.length });
  }

  // 私有方法

  /**
   * 设置子系统监听器
   */
  private setupSubsystemListeners(): void {
    this.ruleSystem.on('ruleRegistered', (rule) => {
      this.emit('ruleRegistered', rule);
    });
    
    this.ruleSystem.on('actionExecuted', (data) => {
      this.emit('ruleActionExecuted', data);
    });
    
    this.stateValidator.on('validationCompleted', (data) => {
      this.emit('stateValidated', data);
    });
    
    this.actionChecker.on('actionExecuted', (data) => {
      this.emit('actionChecked', data);
    });
  }

  /**
   * 注册基础规则
   */
  private registerBaseRules(): void {
    for (const rule of ALL_BASE_RULES) {
      this.ruleSystem.registerRule(rule);
    }
  }

  /**
   * 预验证执行
   */
  private async preValidateExecution(
    action: PlayerAction,
    context: ExecutionContext
  ): Promise<{ success: boolean; message: string }> {
    // 基础检查
    if (!action.playerId || !action.type) {
      return { success: false, message: '行动数据不完整' };
    }
    
    // 玩家存在性检查
    const player = context.gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      return { success: false, message: '玩家不存在' };
    }
    
    // 快速权限检查
    const hasPermission = this.actionChecker.quickValidateAction(action, context.gameState);
    if (!hasPermission) {
      return { success: false, message: '没有执行该行动的权限' };
    }
    
    return { success: true, message: '预验证通过' };
  }

  /**
   * 验证游戏状态
   */
  private async validateGameState(context: ExecutionContext): Promise<ValidationResult> {
    const options: ValidationOptions = {
      enableAutoFix: this.policy.enableAutoCorrection,
      deepValidation: this.policy.strictValidation,
      performanceCheck: this.policy.performanceOptimization,
      consistencyCheck: true,
      economyBalance: true,
      skillIntegrity: true,
      boardIntegrity: true
    };
    
    return await this.stateValidator.validateGameState(context.gameState, options);
  }

  /**
   * 执行行动
   */
  private async performActionExecution(
    action: PlayerAction,
    context: ExecutionContext
  ): Promise<RuleExecutionResult> {
    // 使用重试策略执行
    let lastError: Error | null = null;
    let attempt = 0;
    
    while (attempt <= this.policy.retryPolicy.maxRetries) {
      try {
        return await this.ruleSystem.executeAction(action, context.gameState);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (!this.policy.retryPolicy.enabled || attempt >= this.policy.retryPolicy.maxRetries) {
          throw lastError;
        }
        
        // 计算退避延迟
        const delay = this.calculateRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
    
    throw lastError || new Error('执行失败');
  }

  /**
   * 后验证执行
   */
  private async postValidateExecution(context: ExecutionContext): Promise<boolean> {
    // 验证状态一致性
    const validation = await this.validateGameState(context);
    
    if (!validation.isValid && this.policy.strictValidation) {
      if (this.policy.rollbackOnFailure) {
        // 执行回滚逻辑
        console.warn('检测到状态不一致，执行回滚');
      }
      return false;
    }
    
    return true;
  }

  /**
   * 同步状态
   */
  private async synchronizeState(context: ExecutionContext): Promise<void> {
    // 更新时间戳
    context.gameState.lastUpdateTime = Date.now();
    
    // 清理过期状态效果
    this.cleanupExpiredEffects(context.gameState);
    
    // 发出状态同步事件
    this.emit('stateSynchronized', {
      executionId: context.executionId,
      gameState: context.gameState
    });
  }

  /**
   * 创建成功结果
   */
  private createSuccessResult(
    executionId: string,
    action: PlayerAction,
    executionResult: RuleExecutionResult,
    validationResult: ValidationResult,
    startTime: number,
    context: ExecutionContext
  ): ExecutionResult {
    const endTime = Date.now();
    
    return {
      success: true,
      message: executionResult.message,
      effects: executionResult.effects,
      executionId,
      validationResult,
      ruleResults: [executionResult],
      stateChanges: this.convertToStateChangeRecords(executionResult.stateChanges, executionId),
      performanceMetrics: {
        totalDuration: endTime - startTime,
        validationDuration: 0, // TODO: 测量实际时间
        executionDuration: 0,
        stateUpdateDuration: 0,
        rulesProcessed: 1,
        statesValidated: 1,
        cacheHits: 0,
        cacheMisses: 0
      },
      nextRecommendedActions: []
    };
  }

  /**
   * 创建失败结果
   */
  private createFailureResult(
    executionId: string,
    message: string,
    startTime: number,
    validationResult?: ValidationResult
  ): ExecutionResult {
    const endTime = Date.now();
    
    return {
      success: false,
      message,
      effects: [],
      executionId,
      validationResult: validationResult || {
        isValid: false,
        errors: [],
        warnings: [],
        criticalIssues: [],
        autoFixApplied: false,
        fixedErrors: []
      },
      ruleResults: [],
      stateChanges: [],
      performanceMetrics: {
        totalDuration: endTime - startTime,
        validationDuration: 0,
        executionDuration: 0,
        stateUpdateDuration: 0,
        rulesProcessed: 0,
        statesValidated: 0,
        cacheHits: 0,
        cacheMisses: 0
      },
      nextRecommendedActions: []
    };
  }

  /**
   * 应用状态变更
   */
  private applyStateChanges(gameState: GameState, changes: StateChangeRecord[]): GameState {
    let newState = { ...gameState };
    
    for (const change of changes) {
      // 应用状态变更逻辑
      newState = this.applySingleStateChange(newState, change);
    }
    
    return newState;
  }

  /**
   * 应用单个状态变更
   */
  private applySingleStateChange(gameState: GameState, change: StateChangeRecord): GameState {
    // 根据目标路径应用变更
    const path = change.target.split('.');
    const newState = { ...gameState };
    
    // 实现深层状态更新逻辑
    this.setNestedValue(newState, path, change.newValue);
    
    return newState;
  }

  /**
   * 反向状态变更
   */
  private reverseStateChange(gameState: GameState, change: StateChangeRecord): GameState {
    const path = change.target.split('.');
    const newState = { ...gameState };
    
    this.setNestedValue(newState, path, change.oldValue);
    
    return newState;
  }

  /**
   * 设置嵌套值
   */
  private setNestedValue(obj: any, path: string[], value: any): void {
    const lastKey = path.pop()!;
    const target = path.reduce((current, key) => current[key], obj);
    target[lastKey] = value;
  }

  /**
   * 转换为状态变更记录
   */
  private convertToStateChangeRecords(
    stateChanges: any[],
    executionId: string
  ): StateChangeRecord[] {
    return stateChanges.map((change, index) => ({
      changeId: `${executionId}_${index}`,
      timestamp: Date.now(),
      type: this.inferChangeType(change.path),
      target: change.path,
      oldValue: change.oldValue,
      newValue: change.newValue,
      source: executionId,
      reversible: change.reversible,
      dependencies: []
    }));
  }

  /**
   * 推断变更类型
   */
  private inferChangeType(path: string): 'player_update' | 'board_update' | 'game_state_update' | 'effect_application' {
    if (path.startsWith('players')) return 'player_update';
    if (path.startsWith('board')) return 'board_update';
    if (path.includes('effect')) return 'effect_application';
    return 'game_state_update';
  }

  /**
   * 计算行动优先级
   */
  private calculateActionPriority(permission: ActionPermission, gameState: GameState): number {
    // 根据游戏状态和行动类型计算优先级
    const basePriorities: Record<string, number> = {
      'roll_dice': 100,
      'move_player': 90,
      'buy_property': 80,
      'use_skill': 70,
      'upgrade_property': 60,
      'sell_property': 50,
      'trade_request': 40,
      'pass': 10
    };
    
    return basePriorities[permission.actionType] || 0;
  }

  /**
   * 计算重试延迟
   */
  private calculateRetryDelay(attempt: number): number {
    const { backoffStrategy, baseDelay, maxDelay } = this.policy.retryPolicy;
    
    let delay: number;
    switch (backoffStrategy) {
      case 'linear':
        delay = baseDelay * (attempt + 1);
        break;
      case 'exponential':
        delay = baseDelay * Math.pow(2, attempt);
        break;
      case 'fixed':
      default:
        delay = baseDelay;
        break;
    }
    
    return Math.min(delay, maxDelay);
  }

  /**
   * 清理过期效果
   */
  private cleanupExpiredEffects(gameState: GameState): void {
    for (const player of gameState.players) {
      player.statusEffects = player.statusEffects.filter(effect => {
        if (effect.duration > 0) {
          effect.remainingTurns--;
          return effect.remainingTurns > 0;
        }
        return true;
      });
    }
  }

  /**
   * 记录执行历史
   */
  private recordExecution(result: ExecutionResult): void {
    this.executionHistory.push(result);
    this.stateChangeHistory.push(...result.stateChanges);
    
    // 限制历史记录大小
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
    
    if (this.stateChangeHistory.length > this.maxStateChangeHistory) {
      this.stateChangeHistory.splice(0, this.stateChangeHistory.length - this.maxStateChangeHistory);
    }
  }

  /**
   * 生成执行ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}