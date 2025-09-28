/**
 * 游戏状态验证器 - 验证游戏状态的完整性和一致性
 * 提供深度状态检查、数据一致性验证和自动修复功能
 */

import { EventEmitter } from '../utils/EventEmitter';
import type {
  GameState,
  Player,
  BoardCell,
  GamePhase,
  ZodiacSign,
  Season,
  Weather,
  PlayerSkill,
  StatusEffect,
  GameEvent
} from '../types/game';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  criticalIssues: CriticalIssue[];
  autoFixApplied: boolean;
  fixedErrors: ValidationError[];
  stateHash?: string;
}

export interface ValidationError {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: ValidationCategory;
  field: string;
  message: string;
  expectedValue?: any;
  actualValue?: any;
  fixable: boolean;
  fixAction?: FixAction;
}

export interface ValidationWarning {
  id: string;
  category: ValidationCategory;
  message: string;
  suggestion?: string;
}

export interface CriticalIssue {
  id: string;
  message: string;
  impact: string;
  requiredAction: 'restart_game' | 'reset_state' | 'manual_fix' | 'continue_with_risk';
}

export interface FixAction {
  type: 'set_value' | 'add_item' | 'remove_item' | 'calculate_value' | 'reset_section';
  target: string;
  value?: any;
  calculation?: string;
}

export type ValidationCategory = 
  | 'player_data' | 'board_state' | 'game_flow' | 'economy' 
  | 'skills' | 'properties' | 'consistency' | 'performance';

export interface ValidationOptions {
  enableAutoFix: boolean;
  deepValidation: boolean;
  performanceCheck: boolean;
  consistencyCheck: boolean;
  economyBalance: boolean;
  skillIntegrity: boolean;
  boardIntegrity: boolean;
}

/**
 * 游戏状态验证器
 */
export class GameStateValidator extends EventEmitter {
  private validationHistory: ValidationResult[] = [];
  private knownIssues = new Set<string>();
  private performanceBaseline: any = null;
  
  private readonly maxHistorySize = 50;
  private readonly defaultOptions: ValidationOptions = {
    enableAutoFix: true,
    deepValidation: true,
    performanceCheck: true,
    consistencyCheck: true,
    economyBalance: true,
    skillIntegrity: true,
    boardIntegrity: true
  };

  constructor() {
    super();
  }

  /**
   * 验证游戏状态
   */
  async validateGameState(
    gameState: GameState, 
    options: Partial<ValidationOptions> = {}
  ): Promise<ValidationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      criticalIssues: [],
      autoFixApplied: false,
      fixedErrors: []
    };

    try {
      // 基础结构验证
      await this.validateBasicStructure(gameState, result);
      
      // 玩家数据验证
      if (opts.deepValidation) {
        await this.validatePlayersData(gameState, result);
      }
      
      // 棋盘状态验证
      if (opts.boardIntegrity) {
        await this.validateBoardState(gameState, result);
      }
      
      // 经济系统验证
      if (opts.economyBalance) {
        await this.validateEconomyBalance(gameState, result);
      }
      
      // 技能系统验证
      if (opts.skillIntegrity) {
        await this.validateSkillSystem(gameState, result);
      }
      
      // 一致性检查
      if (opts.consistencyCheck) {
        await this.validateConsistency(gameState, result);
      }
      
      // 性能检查
      if (opts.performanceCheck) {
        await this.validatePerformance(gameState, result);
      }
      
      // 自动修复
      if (opts.enableAutoFix && result.errors.length > 0) {
        await this.applyAutoFix(gameState, result);
      }
      
      // 计算状态哈希
      result.stateHash = this.calculateStateHash(gameState);
      
      // 判断整体有效性
      result.isValid = result.errors.length === 0 && result.criticalIssues.length === 0;
      
      // 记录验证历史
      this.addToHistory(result);
      
      // 发出验证完成事件
      this.emit('validationCompleted', {
        result,
        duration: Date.now() - startTime,
        gameState
      });
      
      return result;
      
    } catch (error) {
      // 验证过程出错
      result.criticalIssues.push({
        id: 'validation_error',
        message: `验证过程发生错误: ${error instanceof Error ? error.message : String(error)}`,
        impact: '无法完成状态验证',
        requiredAction: 'manual_fix'
      });
      
      result.isValid = false;
      return result;
    }
  }

  /**
   * 验证特定玩家状态
   */
  async validatePlayer(player: Player, gameState: GameState): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      criticalIssues: [],
      autoFixApplied: false,
      fixedErrors: []
    };

    // 基础属性验证
    this.validatePlayerBasics(player, result);
    
    // 位置验证
    this.validatePlayerPosition(player, gameState, result);
    
    // 财产验证
    this.validatePlayerProperties(player, gameState, result);
    
    // 技能验证
    this.validatePlayerSkills(player, result);
    
    // 状态效果验证
    this.validatePlayerStatusEffects(player, result);
    
    result.isValid = result.errors.length === 0 && result.criticalIssues.length === 0;
    return result;
  }

  /**
   * 获取验证统计
   */
  getValidationStatistics(): any {
    return {
      totalValidations: this.validationHistory.length,
      recentValidations: this.validationHistory.slice(-10),
      averageValidationTime: this.calculateAverageValidationTime(),
      commonErrors: this.getCommonErrors(),
      fixSuccessRate: this.calculateFixSuccessRate(),
      knownIssues: Array.from(this.knownIssues)
    };
  }

  // 私有验证方法

  /**
   * 验证基础结构
   */
  private async validateBasicStructure(gameState: GameState, result: ValidationResult): Promise<void> {
    // 检查必需字段
    const requiredFields = [
      'gameId', 'status', 'players', 'currentPlayerIndex', 
      'round', 'phase', 'turn', 'board', 'season', 'weather'
    ];
    
    for (const field of requiredFields) {
      if (!(field in gameState) || gameState[field as keyof GameState] === undefined) {
        result.errors.push({
          id: `missing_${field}`,
          severity: 'critical',
          category: 'game_flow',
          field,
          message: `缺少必需字段: ${field}`,
          fixable: true,
          fixAction: {
            type: 'set_value',
            target: field,
            value: this.getDefaultValue(field)
          }
        });
      }
    }
    
    // 检查基础类型
    if (typeof gameState.gameId !== 'string') {
      result.errors.push({
        id: 'invalid_game_id',
        severity: 'high',
        category: 'game_flow',
        field: 'gameId',
        message: 'gameId必须是字符串',
        actualValue: typeof gameState.gameId,
        expectedValue: 'string',
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'gameId',
          value: `game_${Date.now()}`
        }
      });
    }
    
    // 检查玩家数量
    if (!Array.isArray(gameState.players)) {
      result.errors.push({
        id: 'invalid_players_array',
        severity: 'critical',
        category: 'player_data',
        field: 'players',
        message: 'players必须是数组',
        fixable: false
      });
    } else if (gameState.players.length < 2 || gameState.players.length > 4) {
      result.errors.push({
        id: 'invalid_player_count',
        severity: 'high',
        category: 'player_data',
        field: 'players',
        message: `玩家数量必须在2-4之间，当前: ${gameState.players.length}`,
        actualValue: gameState.players.length,
        expectedValue: '2-4',
        fixable: false
      });
    }
    
    // 检查当前玩家索引
    if (typeof gameState.currentPlayerIndex !== 'number' ||
        gameState.currentPlayerIndex < 0 ||
        gameState.currentPlayerIndex >= gameState.players.length) {
      result.errors.push({
        id: 'invalid_current_player_index',
        severity: 'high',
        category: 'game_flow',
        field: 'currentPlayerIndex',
        message: '当前玩家索引无效',
        actualValue: gameState.currentPlayerIndex,
        expectedValue: `0-${gameState.players.length - 1}`,
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'currentPlayerIndex',
          value: 0
        }
      });
    }
  }

  /**
   * 验证玩家数据
   */
  private async validatePlayersData(gameState: GameState, result: ValidationResult): Promise<void> {
    const playerIds = new Set<string>();
    
    for (let i = 0; i < gameState.players.length; i++) {
      const player = gameState.players[i];
      
      // 检查玩家ID唯一性
      if (playerIds.has(player.id)) {
        result.errors.push({
          id: `duplicate_player_id_${i}`,
          severity: 'critical',
          category: 'player_data',
          field: `players[${i}].id`,
          message: `玩家ID重复: ${player.id}`,
          fixable: true,
          fixAction: {
            type: 'set_value',
            target: `players[${i}].id`,
            value: `player_${i}_${Date.now()}`
          }
        });
      }
      playerIds.add(player.id);
      
      // 验证单个玩家
      const playerValidation = await this.validatePlayer(player, gameState);
      result.errors.push(...playerValidation.errors);
      result.warnings.push(...playerValidation.warnings);
      result.criticalIssues.push(...playerValidation.criticalIssues);
    }
  }

  /**
   * 验证棋盘状态
   */
  private async validateBoardState(gameState: GameState, result: ValidationResult): Promise<void> {
    if (!Array.isArray(gameState.board)) {
      result.criticalIssues.push({
        id: 'invalid_board',
        message: '棋盘数据不是有效数组',
        impact: '游戏无法正常进行',
        requiredAction: 'reset_state'
      });
      return;
    }
    
    // 检查棋盘长度
    if (gameState.board.length < 20 || gameState.board.length > 60) {
      result.warnings.push({
        id: 'unusual_board_size',
        category: 'board_state',
        message: `棋盘大小异常: ${gameState.board.length}`,
        suggestion: '标准棋盘应该有40个格子'
      });
    }
    
    // 检查位置连续性
    for (let i = 0; i < gameState.board.length; i++) {
      const cell = gameState.board[i];
      
      if (cell.position !== i) {
        result.errors.push({
          id: `invalid_cell_position_${i}`,
          severity: 'medium',
          category: 'board_state',
          field: `board[${i}].position`,
          message: `格子位置不匹配: 期望${i}，实际${cell.position}`,
          actualValue: cell.position,
          expectedValue: i,
          fixable: true,
          fixAction: {
            type: 'set_value',
            target: `board[${i}].position`,
            value: i
          }
        });
      }
      
      // 检查财产所有权
      if (cell.type === 'property' && cell.ownerId) {
        const owner = gameState.players.find(p => p.id === cell.ownerId);
        if (!owner) {
          result.errors.push({
            id: `invalid_property_owner_${i}`,
            severity: 'high',
            category: 'properties',
            field: `board[${i}].ownerId`,
            message: `财产${cell.name}的所有者不存在: ${cell.ownerId}`,
            fixable: true,
            fixAction: {
              type: 'set_value',
              target: `board[${i}].ownerId`,
              value: undefined
            }
          });
        } else if (!owner.properties.includes(cell.id)) {
          result.errors.push({
            id: `property_ownership_mismatch_${i}`,
            severity: 'high',
            category: 'properties',
            field: `board[${i}].ownerId`,
            message: `财产所有权不匹配: ${cell.name}`,
            fixable: true,
            fixAction: {
              type: 'add_item',
              target: `players[${gameState.players.indexOf(owner)}].properties`,
              value: cell.id
            }
          });
        }
      }
    }
  }

  /**
   * 验证经济平衡
   */
  private async validateEconomyBalance(gameState: GameState, result: ValidationResult): Promise<void> {
    let totalMoney = 0;
    let totalPropertyValue = 0;
    
    // 计算总资金
    for (const player of gameState.players) {
      totalMoney += player.money;
      
      // 计算玩家财产价值
      for (const propertyId of player.properties) {
        const property = gameState.board.find(cell => cell.id === propertyId);
        if (property && property.price) {
          totalPropertyValue += property.price;
        }
      }
    }
    
    const totalWealth = totalMoney + totalPropertyValue;
    const expectedInitialWealth = gameState.players.length * 10000; // 假设每人初始10000
    
    // 检查经济平衡
    const wealthDeviation = Math.abs(totalWealth - expectedInitialWealth) / expectedInitialWealth;
    if (wealthDeviation > 0.5) {
      result.warnings.push({
        id: 'economy_imbalance',
        category: 'economy',
        message: `经济系统可能不平衡，总财富偏差: ${Math.round(wealthDeviation * 100)}%`,
        suggestion: '检查是否有异常的金钱变化'
      });
    }
    
    // 检查负数金钱
    for (let i = 0; i < gameState.players.length; i++) {
      const player = gameState.players[i];
      if (player.money < -1000) { // 允许小量负债
        result.errors.push({
          id: `excessive_debt_${i}`,
          severity: 'medium',
          category: 'economy',
          field: `players[${i}].money`,
          message: `玩家${player.name}债务过多: ${player.money}`,
          actualValue: player.money,
          expectedValue: '>= -1000',
          fixable: true,
          fixAction: {
            type: 'set_value',
            target: `players[${i}].money`,
            value: 0
          }
        });
      }
    }
  }

  /**
   * 验证技能系统
   */
  private async validateSkillSystem(gameState: GameState, result: ValidationResult): Promise<void> {
    for (let playerIndex = 0; playerIndex < gameState.players.length; playerIndex++) {
      const player = gameState.players[playerIndex];
      
      for (let skillIndex = 0; skillIndex < player.skills.length; skillIndex++) {
        const skill = player.skills[skillIndex];
        
        // 检查技能冷却时间
        if (skill.lastUsed && skill.cooldown > 0) {
          const timeSinceUse = Date.now() - skill.lastUsed;
          const cooldownMs = skill.cooldown * 1000;
          
          if (timeSinceUse < 0) {
            result.errors.push({
              id: `invalid_skill_timestamp_${playerIndex}_${skillIndex}`,
              severity: 'medium',
              category: 'skills',
              field: `players[${playerIndex}].skills[${skillIndex}].lastUsed`,
              message: `技能${skill.name}的使用时间戳无效`,
              fixable: true,
              fixAction: {
                type: 'set_value',
                target: `players[${playerIndex}].skills[${skillIndex}].lastUsed`,
                value: undefined
              }
            });
          }
        }
        
        // 检查技能等级
        if (skill.level < 1 || skill.level > skill.maxLevel) {
          result.errors.push({
            id: `invalid_skill_level_${playerIndex}_${skillIndex}`,
            severity: 'medium',
            category: 'skills',
            field: `players[${playerIndex}].skills[${skillIndex}].level`,
            message: `技能${skill.name}等级无效: ${skill.level}`,
            actualValue: skill.level,
            expectedValue: `1-${skill.maxLevel}`,
            fixable: true,
            fixAction: {
              type: 'set_value',
              target: `players[${playerIndex}].skills[${skillIndex}].level`,
              value: Math.max(1, Math.min(skill.level, skill.maxLevel))
            }
          });
        }
        
        // 检查经验值
        if (skill.experiencePoints < 0) {
          result.errors.push({
            id: `negative_experience_${playerIndex}_${skillIndex}`,
            severity: 'low',
            category: 'skills',
            field: `players[${playerIndex}].skills[${skillIndex}].experiencePoints`,
            message: `技能${skill.name}经验值不能为负数`,
            fixable: true,
            fixAction: {
              type: 'set_value',
              target: `players[${playerIndex}].skills[${skillIndex}].experiencePoints`,
              value: 0
            }
          });
        }
      }
    }
  }

  /**
   * 验证一致性
   */
  private async validateConsistency(gameState: GameState, result: ValidationResult): Promise<void> {
    // 检查时间一致性
    if (gameState.lastUpdateTime > Date.now()) {
      result.errors.push({
        id: 'future_timestamp',
        severity: 'medium',
        category: 'consistency',
        field: 'lastUpdateTime',
        message: '最后更新时间在未来',
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'lastUpdateTime',
          value: Date.now()
        }
      });
    }
    
    // 检查回合和轮次一致性
    if (gameState.turn < 1) {
      result.errors.push({
        id: 'invalid_turn_number',
        severity: 'medium',
        category: 'consistency',
        field: 'turn',
        message: '回合数必须从1开始',
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'turn',
          value: 1
        }
      });
    }
    
    if (gameState.round < 1) {
      result.errors.push({
        id: 'invalid_round_number',
        severity: 'medium',
        category: 'consistency',
        field: 'round',
        message: '轮次数必须从1开始',
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'round',
          value: 1
        }
      });
    }
  }

  /**
   * 验证性能
   */
  private async validatePerformance(gameState: GameState, result: ValidationResult): Promise<void> {
    const currentSize = JSON.stringify(gameState).length;
    const maxSize = 1024 * 1024; // 1MB限制
    
    if (currentSize > maxSize) {
      result.warnings.push({
        id: 'large_game_state',
        category: 'performance',
        message: `游戏状态过大: ${Math.round(currentSize / 1024)}KB`,
        suggestion: '考虑清理历史数据或优化数据结构'
      });
    }
    
    // 检查事件历史长度
    if (gameState.eventHistory.length > 1000) {
      result.warnings.push({
        id: 'large_event_history',
        category: 'performance',
        message: `事件历史过长: ${gameState.eventHistory.length}条`,
        suggestion: '考虑限制事件历史长度'
      });
    }
  }

  /**
   * 验证玩家基础属性
   */
  private validatePlayerBasics(player: Player, result: ValidationResult): void {
    if (!player.id || typeof player.id !== 'string') {
      result.errors.push({
        id: 'invalid_player_id',
        severity: 'critical',
        category: 'player_data',
        field: 'id',
        message: '玩家ID无效',
        fixable: false
      });
    }
    
    if (!player.name || typeof player.name !== 'string') {
      result.errors.push({
        id: 'invalid_player_name',
        severity: 'high',
        category: 'player_data',
        field: 'name',
        message: '玩家姓名无效',
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'name',
          value: `玩家${player.id}`
        }
      });
    }
    
    if (typeof player.money !== 'number') {
      result.errors.push({
        id: 'invalid_money_type',
        severity: 'critical',
        category: 'player_data',
        field: 'money',
        message: '玩家金钱必须是数字',
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'money',
          value: 0
        }
      });
    }
  }

  /**
   * 验证玩家位置
   */
  private validatePlayerPosition(player: Player, gameState: GameState, result: ValidationResult): void {
    if (typeof player.position !== 'number' ||
        player.position < 0 ||
        player.position >= gameState.board.length) {
      result.errors.push({
        id: 'invalid_player_position',
        severity: 'high',
        category: 'player_data',
        field: 'position',
        message: `玩家位置无效: ${player.position}`,
        actualValue: player.position,
        expectedValue: `0-${gameState.board.length - 1}`,
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'position',
          value: 0
        }
      });
    }
  }

  /**
   * 验证玩家财产
   */
  private validatePlayerProperties(player: Player, gameState: GameState, result: ValidationResult): void {
    if (!Array.isArray(player.properties)) {
      result.errors.push({
        id: 'invalid_properties_array',
        severity: 'high',
        category: 'properties',
        field: 'properties',
        message: '玩家财产列表必须是数组',
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'properties',
          value: []
        }
      });
      return;
    }
    
    for (const propertyId of player.properties) {
      const property = gameState.board.find(cell => cell.id === propertyId);
      if (!property) {
        result.errors.push({
          id: 'invalid_property_reference',
          severity: 'medium',
          category: 'properties',
          field: 'properties',
          message: `引用的财产不存在: ${propertyId}`,
          fixable: true,
          fixAction: {
            type: 'remove_item',
            target: 'properties',
            value: propertyId
          }
        });
      }
    }
  }

  /**
   * 验证玩家技能
   */
  private validatePlayerSkills(player: Player, result: ValidationResult): void {
    if (!Array.isArray(player.skills)) {
      result.errors.push({
        id: 'invalid_skills_array',
        severity: 'medium',
        category: 'skills',
        field: 'skills',
        message: '玩家技能列表必须是数组',
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'skills',
          value: []
        }
      });
    }
  }

  /**
   * 验证玩家状态效果
   */
  private validatePlayerStatusEffects(player: Player, result: ValidationResult): void {
    if (!Array.isArray(player.statusEffects)) {
      result.errors.push({
        id: 'invalid_status_effects_array',
        severity: 'low',
        category: 'player_data',
        field: 'statusEffects',
        message: '玩家状态效果列表必须是数组',
        fixable: true,
        fixAction: {
          type: 'set_value',
          target: 'statusEffects',
          value: []
        }
      });
    }
  }

  /**
   * 应用自动修复
   */
  private async applyAutoFix(gameState: GameState, result: ValidationResult): Promise<void> {
    const fixableErrors = result.errors.filter(error => error.fixable && error.fixAction);
    
    for (const error of fixableErrors) {
      try {
        const success = this.applyFix(gameState, error.fixAction!);
        if (success) {
          result.fixedErrors.push(error);
          result.autoFixApplied = true;
        }
      } catch (fixError) {
        // 修复失败，保留原错误
        console.warn(`自动修复失败: ${error.id}`, fixError);
      }
    }
    
    // 保留原始错误记录，方便调用方了解发生过的异常
  }

  /**
   * 应用单个修复
   */
  private applyFix(gameState: any, fixAction: FixAction): boolean {
    const { type, target, value } = fixAction;
    
    try {
      switch (type) {
        case 'set_value':
          this.setNestedValue(gameState, target, value);
          break;
          
        case 'add_item':
          const array = this.getNestedValue(gameState, target);
          if (Array.isArray(array) && !array.includes(value)) {
            array.push(value);
          }
          break;
          
        case 'remove_item':
          const targetArray = this.getNestedValue(gameState, target);
          if (Array.isArray(targetArray)) {
            const index = targetArray.indexOf(value);
            if (index > -1) {
              targetArray.splice(index, 1);
            }
          }
          break;
          
        case 'calculate_value':
          // 实现计算逻辑
          break;
          
        case 'reset_section':
          this.setNestedValue(gameState, target, this.getDefaultValue(target));
          break;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        return current?.[arrayKey]?.[parseInt(index)];
      }
      return current?.[key];
    }, obj);
  }

  /**
   * 设置嵌套值
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    const target = parts.reduce((current, key) => {
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        return current[arrayKey][parseInt(index)];
      }
      return current[key];
    }, obj);
    
    target[last] = value;
  }

  /**
   * 获取默认值
   */
  private getDefaultValue(field: string): any {
    const defaults: Record<string, any> = {
      gameId: `game_${Date.now()}`,
      status: 'waiting',
      currentPlayerIndex: 0,
      round: 1,
      turn: 1,
      phase: 'roll_dice',
      season: '春',
      weather: '晴',
      money: 0,
      position: 0,
      properties: [],
      skills: [],
      statusEffects: [],
      eventHistory: []
    };
    
    return defaults[field] || null;
  }

  /**
   * 计算状态哈希
   */
  private calculateStateHash(gameState: GameState): string {
    const keyFields = {
      players: gameState.players.map(p => ({
        id: p.id,
        money: p.money,
        position: p.position,
        properties: p.properties.length
      })),
      turn: gameState.turn,
      phase: gameState.phase,
      currentPlayer: gameState.currentPlayerIndex
    };
    
    return btoa(JSON.stringify(keyFields)).slice(0, 16);
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(result: ValidationResult): void {
    this.validationHistory.push(result);
    
    if (this.validationHistory.length > this.maxHistorySize) {
      this.validationHistory.shift();
    }
  }

  /**
   * 计算平均验证时间
   */
  private calculateAverageValidationTime(): number {
    // TODO: 实现验证时间统计
    return 0;
  }

  /**
   * 获取常见错误
   */
  private getCommonErrors(): any {
    const errorCounts: Record<string, number> = {};
    
    for (const result of this.validationHistory) {
      for (const error of result.errors) {
        errorCounts[error.id] = (errorCounts[error.id] || 0) + 1;
      }
    }
    
    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }

  /**
   * 计算修复成功率
   */
  private calculateFixSuccessRate(): number {
    let totalFixAttempts = 0;
    let successfulFixes = 0;
    
    for (const result of this.validationHistory) {
      if (result.autoFixApplied) {
        totalFixAttempts += result.errors.length;
        successfulFixes += result.fixedErrors.length;
      }
    }
    
    return totalFixAttempts > 0 ? successfulFixes / totalFixAttempts : 0;
  }
}
