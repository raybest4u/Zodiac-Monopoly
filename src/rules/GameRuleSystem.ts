/**
 * 游戏规则系统 - 十二生肖大富翁核心规则验证和执行
 * 提供完整的规则验证、状态检查和动作执行逻辑
 */

import { EventEmitter } from '../utils/EventEmitter';
import type {
  GameState,
  Player,
  PlayerAction,
  ActionResult,
  BoardCell,
  GamePhase,
  DiceResult,
  PlayerSkill,
  ZodiacSign,
  Season,
  Weather,
  GameEffect,
  ActionType
} from '../types/game';

export interface RuleValidationResult {
  isValid: boolean;
  reason?: string;
  warnings?: string[];
  suggestedActions?: ActionType[];
  requiredConditions?: RuleCondition[];
}

export interface RuleCondition {
  type: RuleConditionType;
  description: string;
  currentValue: any;
  requiredValue: any;
  met: boolean;
}

export type RuleConditionType = 
  | 'money' | 'position' | 'property_ownership' | 'skill_cooldown'
  | 'game_phase' | 'turn_state' | 'dice_state' | 'player_status'
  | 'board_state' | 'seasonal' | 'zodiac_compatibility';

export interface RuleExecutionContext {
  gameState: GameState;
  action: PlayerAction;
  currentPlayer: Player;
  targetCell?: BoardCell;
  affectedPlayers?: Player[];
  environmentalFactors: {
    season: Season;
    weather: Weather;
    marketTrends: any;
  };
}

export interface RuleExecutionResult extends ActionResult {
  validationsPassed: string[];
  validationsFailed: string[];
  stateChanges: StateChange[];
  triggeredEvents: string[];
  nextPhase?: GamePhase;
  newActionRequests?: PlayerAction[];
}

export interface StateChange {
  path: string;
  oldValue: any;
  newValue: any;
  reason: string;
  reversible: boolean;
}

export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  priority: number;
  
  // 规则条件
  conditions: RuleCondition[];
  requirements: RuleRequirement[];
  
  // 执行逻辑
  validator: (context: RuleExecutionContext) => RuleValidationResult;
  executor: (context: RuleExecutionContext) => RuleExecutionResult;
  
  // 规则元数据
  applicablePhases: GamePhase[];
  applicableActions: ActionType[];
  zodiacSpecific?: ZodiacSign[];
  seasonalModifiers?: boolean;
  
  // 冲突处理
  conflictsWith?: string[];
  dependsOn?: string[];
  overrides?: string[];
}

export interface RuleRequirement {
  type: 'pre' | 'post' | 'concurrent';
  condition: RuleCondition;
  optional: boolean;
  failureAction?: 'block' | 'warn' | 'auto_fix';
}

export type RuleCategory = 
  | 'movement' | 'economy' | 'property' | 'skills' | 'events'
  | 'trading' | 'winning' | 'zodiac' | 'seasonal' | 'special';

/**
 * 游戏规则系统核心类
 */
export class GameRuleSystem extends EventEmitter {
  private rules = new Map<string, RuleDefinition>();
  private ruleCache = new Map<string, RuleValidationResult>();
  private executionHistory: RuleExecutionResult[] = [];
  private rulesEnabled = true;
  
  private readonly cacheTimeout = 5000; // 5秒缓存
  private readonly maxHistorySize = 100;

  constructor() {
    super();
    this.registerCoreRules();
  }

  /**
   * 注册规则定义
   */
  registerRule(rule: RuleDefinition): void {
    // 验证规则定义
    this.validateRuleDefinition(rule);
    
    // 检查冲突
    this.checkRuleConflicts(rule);
    
    // 注册规则
    this.rules.set(rule.id, rule);
    this.clearCache();
    
    this.emit('ruleRegistered', rule);
  }

  /**
   * 移除规则
   */
  unregisterRule(ruleId: string): void {
    if (this.rules.delete(ruleId)) {
      this.clearCache();
      this.emit('ruleUnregistered', { ruleId });
    }
  }

  /**
   * 验证玩家动作
   */
  async validateAction(
    action: PlayerAction, 
    gameState: GameState
  ): Promise<RuleValidationResult> {
    if (!this.rulesEnabled) {
      return { isValid: true };
    }

    const cacheKey = this.generateCacheKey(action, gameState);
    const cached = this.ruleCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const actingPlayer = gameState.players.find((player) => player.id === action.playerId);
    if (!actingPlayer) {
      const invalidResult: RuleValidationResult = {
        isValid: false,
        reason: '无效的玩家ID'
      };
      this.ruleCache.set(cacheKey, invalidResult);
      setTimeout(() => this.ruleCache.delete(cacheKey), this.cacheTimeout);
      return invalidResult;
    }

    const context = this.buildExecutionContext(action, gameState, actingPlayer);
    const result = await this.performValidation(context);
    
    // 缓存结果
    this.ruleCache.set(cacheKey, result);
    setTimeout(() => this.ruleCache.delete(cacheKey), this.cacheTimeout);
    
    return result;
  }

  /**
   * 执行动作
   */
  async executeAction(
    action: PlayerAction, 
    gameState: GameState
  ): Promise<RuleExecutionResult> {
    // 先验证
    const validation = await this.validateAction(action, gameState);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.reason || '动作验证失败',
        effects: [],
        validationsPassed: [],
        validationsFailed: [validation.reason || '未知错误'],
        stateChanges: [],
        triggeredEvents: []
      };
    }

    const actingPlayer = gameState.players.find((player) => player.id === action.playerId);
    const context = this.buildExecutionContext(action, gameState, actingPlayer);
    const result = await this.performExecution(context);
    
    // 记录执行历史
    this.addToHistory(result);
    
    this.emit('actionExecuted', { action, result });
    return result;
  }

  /**
   * 获取适用的规则
   */
  getApplicableRules(
    action: PlayerAction, 
    gameState: GameState
  ): RuleDefinition[] {
    const currentPhase = gameState.phase;
    const actionType = action.type;
    
    return Array.from(this.rules.values()).filter(rule => {
      // 检查阶段适用性
      if (rule.applicablePhases.length > 0 && 
          !rule.applicablePhases.includes(currentPhase)) {
        return false;
      }
      
      // 检查动作适用性
      if (rule.applicableActions.length > 0 && 
          !rule.applicableActions.includes(actionType)) {
        return false;
      }
      
      // 检查生肖特异性
      if (rule.zodiacSpecific) {
        const player = gameState.players.find(p => p.id === action.playerId);
        if (player && !rule.zodiacSpecific.includes(player.zodiac)) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => b.priority - a.priority);
  }

  /**
   * 检查游戏状态一致性
   */
  validateGameState(gameState: GameState): RuleValidationResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 基础状态检查
    if (gameState.players.length < 2 || gameState.players.length > 4) {
      violations.push('玩家数量必须在2-4人之间');
    }

    if (gameState.currentPlayerIndex < 0 || 
        gameState.currentPlayerIndex >= gameState.players.length) {
      violations.push('当前玩家索引无效');
    }

    // 玩家状态检查
    for (const player of gameState.players) {
      if (player.money < 0) {
        violations.push(`玩家${player.name}金钱不能为负数`);
      }
      
      if (player.position < 0 || player.position >= gameState.board.length) {
        violations.push(`玩家${player.name}位置超出棋盘范围`);
      }
    }

    // 棋盘状态检查
    const propertyOwnership = new Map<string, string>();
    for (const cell of gameState.board) {
      if (cell.type === 'property' && cell.ownerId) {
        if (propertyOwnership.has(cell.id)) {
          violations.push(`财产${cell.name}有多个所有者`);
        }
        propertyOwnership.set(cell.id, cell.ownerId);
        
        // 检查所有者是否还在游戏中
        const owner = gameState.players.find(p => p.id === cell.ownerId);
        if (!owner) {
          violations.push(`财产${cell.name}的所有者不存在`);
        }
      }
    }

    // 回合数检查
    if (gameState.turn <= 0) {
      warnings.push('回合数应该从1开始');
    }

    return {
      isValid: violations.length === 0,
      reason: violations.length > 0 ? violations.join('; ') : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * 获取规则执行统计
   */
  getRuleStatistics(): any {
    const stats = {
      totalRules: this.rules.size,
      executionHistory: this.executionHistory.length,
      cacheSize: this.ruleCache.size,
      rulesByCategory: {} as Record<RuleCategory, number>,
      recentExecutions: this.executionHistory.slice(-10),
      performanceMetrics: this.calculatePerformanceMetrics()
    };

    // 统计各类别规则数量
    for (const rule of this.rules.values()) {
      stats.rulesByCategory[rule.category] = 
        (stats.rulesByCategory[rule.category] || 0) + 1;
    }

    return stats;
  }

  // 私有方法

  /**
   * 注册核心游戏规则
   */
  private registerCoreRules(): void {
    // 移动规则
    this.registerRule({
      id: 'basic_movement',
      name: '基础移动规则',
      description: '玩家必须先掷骰子才能移动',
      category: 'movement',
      priority: 100,
      conditions: [],
      requirements: [],
      applicablePhases: ['roll_dice', 'move_player'],
      applicableActions: ['move_player'],
      validator: (context) => this.validateBasicMovement(context),
      executor: (context) => this.executeBasicMovement(context)
    });

    // 购买规则
    this.registerRule({
      id: 'property_purchase',
      name: '财产购买规则',
      description: '玩家购买财产的基础规则',
      category: 'property',
      priority: 90,
      conditions: [],
      requirements: [],
      applicablePhases: ['process_cell'],
      applicableActions: ['buy_property'],
      validator: (context) => this.validatePropertyPurchase(context),
      executor: (context) => this.executePropertyPurchase(context)
    });

    // 技能使用规则
    this.registerRule({
      id: 'skill_usage',
      name: '技能使用规则',
      description: '玩家使用技能的规则验证',
      category: 'skills',
      priority: 85,
      conditions: [],
      requirements: [],
      applicablePhases: ['roll_dice', 'process_cell', 'end_turn'],
      applicableActions: ['use_skill'],
      validator: (context) => this.validateSkillUsage(context),
      executor: (context) => this.executeSkillUsage(context)
    });

    // 胜利条件规则
    this.registerRule({
      id: 'victory_condition',
      name: '胜利条件检查',
      description: '检查游戏胜利条件',
      category: 'winning',
      priority: 95,
      conditions: [],
      requirements: [],
      applicablePhases: ['check_win'],
      applicableActions: [],
      validator: (context) => this.validateVictoryCondition(context),
      executor: (context) => this.executeVictoryCheck(context)
    });
  }

  /**
   * 验证基础移动
   */
  private validateBasicMovement(context: RuleExecutionContext): RuleValidationResult {
    const { gameState, action, currentPlayer } = context;
    
    // 检查是否已掷骰子
    if (!gameState.lastDiceResult) {
      return {
        isValid: false,
        reason: '必须先掷骰子才能移动',
        suggestedActions: ['roll_dice']
      };
    }

    // 检查骰子结果是否过期
    const diceAge = Date.now() - gameState.lastDiceResult.timestamp;
    if (diceAge > 30000) { // 30秒过期
      return {
        isValid: false,
        reason: '骰子结果已过期，请重新掷骰子',
        suggestedActions: ['roll_dice']
      };
    }

    // 检查移动距离
    const moveDistance = action.data?.distance || gameState.lastDiceResult.total;
    if (moveDistance !== gameState.lastDiceResult.total) {
      return {
        isValid: false,
        reason: `移动距离必须等于骰子点数(${gameState.lastDiceResult.total})`
      };
    }

    return { isValid: true };
  }

  /**
   * 执行基础移动
   */
  private executeBasicMovement(context: RuleExecutionContext): RuleExecutionResult {
    const { gameState, action, currentPlayer } = context;
    const moveDistance = gameState.lastDiceResult!.total;
    const newPosition = (currentPlayer.position + moveDistance) % gameState.board.length;
    
    const stateChanges: StateChange[] = [{
      path: `players.${gameState.currentPlayerIndex}.position`,
      oldValue: currentPlayer.position,
      newValue: newPosition,
      reason: `玩家移动${moveDistance}步`,
      reversible: false
    }];

    // 检查是否经过起点
    const passedStart = newPosition < currentPlayer.position;
    if (passedStart) {
      stateChanges.push({
        path: `players.${gameState.currentPlayerIndex}.money`,
        oldValue: currentPlayer.money,
        newValue: currentPlayer.money + 2000,
        reason: '经过起点获得薪水',
        reversible: false
      });
    }

    return {
      success: true,
      message: `玩家移动到位置${newPosition}`,
      effects: [],
      validationsPassed: ['basic_movement'],
      validationsFailed: [],
      stateChanges,
      triggeredEvents: passedStart ? ['salary_received'] : [],
      nextPhase: 'process_cell'
    };
  }

  /**
   * 验证财产购买
   */
  private validatePropertyPurchase(context: RuleExecutionContext): RuleValidationResult {
    const { gameState, action, currentPlayer } = context;
    const propertyId = action.data?.propertyId;
    
    if (!propertyId) {
      return {
        isValid: false,
        reason: '未指定要购买的财产'
      };
    }

    const property = gameState.board.find(cell => cell.id === propertyId);
    if (!property || property.type !== 'property') {
      return {
        isValid: false,
        reason: '指定的财产不存在或不可购买'
      };
    }

    if (property.ownerId) {
      return {
        isValid: false,
        reason: '该财产已有所有者'
      };
    }

    if (!property.price || currentPlayer.money < property.price) {
      return {
        isValid: false,
        reason: '资金不足以购买该财产',
        requiredConditions: [{
          type: 'money',
          description: '需要足够的资金',
          currentValue: currentPlayer.money,
          requiredValue: property.price || 0,
          met: false
        }]
      };
    }

    // 检查玩家是否在该位置
    if (currentPlayer.position !== property.position) {
      return {
        isValid: false,
        reason: '玩家不在该财产位置'
      };
    }

    return { isValid: true };
  }

  /**
   * 执行财产购买
   */
  private executePropertyPurchase(context: RuleExecutionContext): RuleExecutionResult {
    const { gameState, action, currentPlayer } = context;
    const propertyId = action.data?.propertyId;
    const property = gameState.board.find(cell => cell.id === propertyId)!;
    
    const stateChanges: StateChange[] = [
      {
        path: `players.${gameState.currentPlayerIndex}.money`,
        oldValue: currentPlayer.money,
        newValue: currentPlayer.money - property.price!,
        reason: `购买财产${property.name}`,
        reversible: true
      },
      {
        path: `players.${gameState.currentPlayerIndex}.properties`,
        oldValue: [...currentPlayer.properties],
        newValue: [...currentPlayer.properties, propertyId],
        reason: `获得财产${property.name}`,
        reversible: true
      },
      {
        path: `board.${property.position}.ownerId`,
        oldValue: undefined,
        newValue: currentPlayer.id,
        reason: `财产${property.name}被购买`,
        reversible: true
      }
    ];

    return {
      success: true,
      message: `成功购买财产${property.name}`,
      effects: [],
      validationsPassed: ['property_purchase'],
      validationsFailed: [],
      stateChanges,
      triggeredEvents: ['property_purchased'],
      nextPhase: 'end_turn'
    };
  }

  /**
   * 验证技能使用
   */
  private validateSkillUsage(context: RuleExecutionContext): RuleValidationResult {
    const { action, currentPlayer } = context;
    const skillId = action.data?.skillId;
    
    if (!skillId) {
      return {
        isValid: false,
        reason: '未指定要使用的技能'
      };
    }

    const skill = currentPlayer.skills.find(s => s.id === skillId);
    if (!skill) {
      return {
        isValid: false,
        reason: '玩家不拥有该技能'
      };
    }

    // 检查冷却时间
    const now = Date.now();
    if (skill.lastUsed && (now - skill.lastUsed < skill.cooldown * 1000)) {
      const remainingCooldown = Math.ceil((skill.cooldown * 1000 - (now - skill.lastUsed)) / 1000);
      return {
        isValid: false,
        reason: `技能还有${remainingCooldown}秒冷却时间`
      };
    }

    // 检查技能需求
    if (skill.requirements) {
      for (const requirement of skill.requirements) {
        const validationResult = this.validateSkillRequirement(requirement, context);
        if (!validationResult.isValid) {
          return validationResult;
        }
      }
    }

    return { isValid: true };
  }

  /**
   * 执行技能使用
   */
  private executeSkillUsage(context: RuleExecutionContext): RuleExecutionResult {
    const { gameState, action, currentPlayer } = context;
    const skillId = action.data?.skillId;
    const skill = currentPlayer.skills.find(s => s.id === skillId)!;
    
    const stateChanges: StateChange[] = [{
      path: `players.${gameState.currentPlayerIndex}.skills.${skillId}.lastUsed`,
      oldValue: skill.lastUsed,
      newValue: Date.now(),
      reason: `使用技能${skill.name}`,
      reversible: false
    }];

    // 应用技能效果
    const effects: GameEffect[] = skill.effects.map(effect => ({
      type: effect.type,
      target: effect.target,
      value: effect.value,
      description: `技能${skill.name}的效果`
    }));

    return {
      success: true,
      message: `成功使用技能${skill.name}`,
      effects,
      validationsPassed: ['skill_usage'],
      validationsFailed: [],
      stateChanges,
      triggeredEvents: ['skill_used']
    };
  }

  /**
   * 验证胜利条件
   */
  private validateVictoryCondition(context: RuleExecutionContext): RuleValidationResult {
    return { isValid: true }; // 胜利条件检查总是有效的
  }

  /**
   * 执行胜利检查
   */
  private executeVictoryCheck(context: RuleExecutionContext): RuleExecutionResult {
    const { gameState } = context;
    
    // 检查是否只剩一个玩家有钱
    const solventPlayers = gameState.players.filter(p => p.money > 0);
    if (solventPlayers.length === 1) {
      return {
        success: true,
        message: `${solventPlayers[0].name}获得胜利！`,
        effects: [],
        validationsPassed: ['victory_condition'],
        validationsFailed: [],
        stateChanges: [{
          path: 'status',
          oldValue: gameState.status,
          newValue: 'ended',
          reason: '游戏结束',
          reversible: false
        }],
        triggeredEvents: ['game_ended']
      };
    }

    return {
      success: true,
      message: '游戏继续',
      effects: [],
      validationsPassed: ['victory_condition'],
      validationsFailed: [],
      stateChanges: [],
      triggeredEvents: []
    };
  }

  /**
   * 验证技能需求
   */
  private validateSkillRequirement(
    requirement: any, 
    context: RuleExecutionContext
  ): RuleValidationResult {
    const { currentPlayer, gameState } = context;
    
    switch (requirement.type) {
      case 'money':
        if (currentPlayer.money < requirement.value) {
          return {
            isValid: false,
            reason: `需要至少${requirement.value}金钱才能使用该技能`
          };
        }
        break;
        
      case 'property_count':
        if (currentPlayer.properties.length < requirement.value) {
          return {
            isValid: false,
            reason: `需要至少拥有${requirement.value}个财产才能使用该技能`
          };
        }
        break;
        
      case 'season':
        if (gameState.season !== requirement.value) {
          return {
            isValid: false,
            reason: `只能在${requirement.value}季使用该技能`
          };
        }
        break;
    }
    
    return { isValid: true };
  }

  /**
   * 构建执行上下文
   */
  private buildExecutionContext(
    action: PlayerAction,
    gameState: GameState,
    actingPlayer?: Player
  ): RuleExecutionContext {
    const player =
      actingPlayer || gameState.players.find((p) => p.id === action.playerId) || gameState.players[gameState.currentPlayerIndex];

    if (!player) {
      throw new Error('无法创建执行上下文：未找到对应玩家');
    }

    const targetCell = gameState.board[player.position];

    return {
      gameState,
      action,
      currentPlayer: player,
      targetCell,
      affectedPlayers: gameState.players,
      environmentalFactors: {
        season: gameState.season,
        weather: gameState.weather,
        marketTrends: gameState.marketTrends
      }
    };
  }

  /**
   * 执行验证
   */
  private async performValidation(context: RuleExecutionContext): Promise<RuleValidationResult> {
    const applicableRules = this.getApplicableRules(context.action, context.gameState);

    if (applicableRules.length === 0 && this.hasRuleForAction(context.action.type)) {
      return {
        isValid: false,
        reason: '当前阶段不允许执行该动作'
      };
    }
    
    for (const rule of applicableRules) {
      const result = rule.validator(context);
      if (!result.isValid) {
        return result;
      }
    }
    
    return { isValid: true };
  }

  /**
   * 执行动作
   */
  private async performExecution(context: RuleExecutionContext): Promise<RuleExecutionResult> {
    const applicableRules = this.getApplicableRules(context.action, context.gameState);
    
    let combinedResult: RuleExecutionResult = {
      success: true,
      message: '动作执行成功',
      effects: [],
      validationsPassed: [],
      validationsFailed: [],
      stateChanges: [],
      triggeredEvents: []
    };
    
    for (const rule of applicableRules) {
      const result = rule.executor(context);
      
      // 合并结果
      combinedResult.effects.push(...result.effects);
      combinedResult.validationsPassed.push(...result.validationsPassed);
      combinedResult.stateChanges.push(...result.stateChanges);
      combinedResult.triggeredEvents.push(...result.triggeredEvents);
      
      if (result.nextPhase) {
        combinedResult.nextPhase = result.nextPhase;
      }
      
      if (!result.success) {
        combinedResult.success = false;
        combinedResult.message = result.message;
        break;
      }
    }
    
    return combinedResult;
  }

  /**
   * 验证规则定义
   */
  private validateRuleDefinition(rule: RuleDefinition): void {
    if (!rule.id || !rule.name || !rule.category) {
      throw new Error('规则定义必须包含id、name和category');
    }
    
    if (typeof rule.validator !== 'function' || typeof rule.executor !== 'function') {
      throw new Error('规则必须包含validator和executor函数');
    }
  }

  /**
   * 检查规则冲突
   */
  private checkRuleConflicts(rule: RuleDefinition): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`规则ID ${rule.id} 已存在`);
    }
    
    // 检查冲突规则
    if (rule.conflictsWith) {
      for (const conflictId of rule.conflictsWith) {
        if (this.rules.has(conflictId)) {
          throw new Error(`规则 ${rule.id} 与现有规则 ${conflictId} 冲突`);
        }
      }
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(action: PlayerAction, gameState: GameState): string {
    return `${action.type}_${action.playerId}_${gameState.phase}_${gameState.turn}`;
  }

  /**
   * 清除缓存
   */
  private clearCache(): void {
    this.ruleCache.clear();
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(result: RuleExecutionResult): void {
    this.executionHistory.push(result);
    
    // 限制历史记录大小
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * 计算性能指标
   */
  private calculatePerformanceMetrics(): any {
    return {
      totalExecutions: this.executionHistory.length,
      successRate: this.executionHistory.filter(r => r.success).length / this.executionHistory.length,
      averageValidationTime: 0, // TODO: 实现时间测量
      cacheHitRate: 0 // TODO: 实现缓存命中率统计
    };
  }

  private hasRuleForAction(actionType: ActionType): boolean {
    for (const rule of this.rules.values()) {
      if (rule.applicableActions.includes(actionType)) {
        return true;
      }
    }
    return false;
  }
}
