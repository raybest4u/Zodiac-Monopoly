/**
 * 完整的游戏规则引擎
 * 提供全面的业务规则验证和执行
 */

import { UnifiedGameState, BoardCell } from '../types/gameState';
import { Player } from '../types/player';
import { ActionType, GamePhase, PlayerId, Position, Money } from '../types/core';
import { getLogger, createContextLogger, ContextLogger } from './Logger';

// ===== 规则验证结果 =====

export interface RuleValidationResult {
  readonly isValid: boolean;
  readonly violations: RuleViolation[];
  readonly warnings: RuleWarning[];
  readonly suggestions?: string[];
}

export interface RuleViolation {
  readonly rule: string;
  readonly message: string;
  readonly severity: 'error' | 'critical';
  readonly context?: Record<string, any>;
}

export interface RuleWarning {
  readonly rule: string;
  readonly message: string;
  readonly context?: Record<string, any>;
}

// ===== 游戏操作接口 =====

export interface GameAction {
  readonly type: ActionType;
  readonly playerId: PlayerId;
  readonly data?: Record<string, any>;
  readonly timestamp: number;
}

// ===== 规则接口 =====

export interface GameRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: RuleCategory;
  readonly priority: number;
  validate(action: GameAction, gameState: UnifiedGameState): RuleValidationResult;
}

export type RuleCategory = 
  | 'basic'           // 基础规则
  | 'turn_order'      // 回合顺序
  | 'movement'        // 移动规则
  | 'property'        // 地产规则
  | 'money'           // 金钱规则
  | 'trading'         // 交易规则
  | 'skills'          // 技能规则
  | 'events'          // 事件规则
  | 'endgame';        // 游戏结束规则

// ===== 核心规则实现 =====

/**
 * 基础回合规则
 */
export class TurnOrderRule implements GameRule {
  readonly id = 'turn_order';
  readonly name = '回合顺序规则';
  readonly description = '确保只有当前玩家可以执行操作';
  readonly category: RuleCategory = 'turn_order';
  readonly priority = 100;

  validate(action: GameAction, gameState: UnifiedGameState): RuleValidationResult {
    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // 检查是否是当前玩家的操作
    if (action.playerId !== currentPlayer?.id) {
      // 某些操作允许其他玩家执行（如回应交易）
      const allowedOutOfTurnActions: ActionType[] = ['trade_accept', 'trade_reject'];
      
      if (!allowedOutOfTurnActions.includes(action.type)) {
        violations.push({
          rule: this.id,
          message: `不是玩家 ${action.playerId} 的回合，当前玩家是 ${currentPlayer?.name}`,
          severity: 'error',
          context: { 
            actionPlayerId: action.playerId, 
            currentPlayerId: currentPlayer?.id,
            currentPlayerName: currentPlayer?.name
          }
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }
}

/**
 * 游戏阶段规则
 */
export class PhaseRule implements GameRule {
  readonly id = 'phase_validation';
  readonly name = '阶段验证规则';
  readonly description = '验证操作是否在正确的游戏阶段执行';
  readonly category: RuleCategory = 'basic';
  readonly priority = 90;

  private readonly phaseActionMap: Record<GamePhase, ActionType[]> = {
    'roll_dice': ['roll_dice', 'use_skill', 'end_turn'],
    'move_player': ['use_skill', 'end_turn'],
    'process_cell': ['buy_property', 'skip_purchase', 'pay_rent', 'upgrade_property', 'skip_upgrade', 'use_skill', 'event_choice', 'end_turn'],
    'property_action': ['buy_property', 'skip_purchase', 'upgrade_property', 'skip_upgrade', 'use_skill', 'end_turn'],
    'pay_rent': ['pay_rent', 'use_skill', 'declare_bankruptcy', 'end_turn'],
    'handle_event': ['event_choice', 'use_skill', 'end_turn'],
    'use_skill': ['skill_target', 'end_turn'],
    'end_turn': ['end_turn'],
    'check_win': ['end_turn']
  };

  validate(action: GameAction, gameState: UnifiedGameState): RuleValidationResult {
    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];

    const allowedActions = this.phaseActionMap[gameState.phase] || [];
    
    if (!allowedActions.includes(action.type)) {
      violations.push({
        rule: this.id,
        message: `在阶段 "${gameState.phase}" 中不允许执行操作 "${action.type}"`,
        severity: 'error',
        context: {
          currentPhase: gameState.phase,
          actionType: action.type,
          allowedActions
        }
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }
}

/**
 * 地产购买规则
 */
export class PropertyPurchaseRule implements GameRule {
  readonly id = 'property_purchase';
  readonly name = '地产购买规则';
  readonly description = '验证地产购买的合法性';
  readonly category: RuleCategory = 'property';
  readonly priority = 80;

  validate(action: GameAction, gameState: UnifiedGameState): RuleValidationResult {
    if (action.type !== 'buy_property') {
      return { isValid: true, violations: [], warnings: [] };
    }

    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];

    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      violations.push({
        rule: this.id,
        message: '找不到玩家',
        severity: 'critical'
      });
      return { isValid: false, violations, warnings };
    }

    const currentCell = gameState.board.find(cell => cell.position === player.position);
    if (!currentCell) {
      violations.push({
        rule: this.id,
        message: '找不到当前位置的格子',
        severity: 'critical',
        context: { position: player.position }
      });
      return { isValid: false, violations, warnings };
    }

    // 检查是否是可购买的地产
    if (currentCell.type !== 'property' && currentCell.type !== 'utility' && currentCell.type !== 'railroad') {
      violations.push({
        rule: this.id,
        message: '当前格子不是可购买的地产',
        severity: 'error',
        context: { 
          cellType: currentCell.type,
          cellName: currentCell.name,
          position: currentCell.position
        }
      });
    }

    // 检查地产是否已被购买
    if (currentCell.owner) {
      violations.push({
        rule: this.id,
        message: '地产已被其他玩家拥有',
        severity: 'error',
        context: {
          owner: currentCell.owner,
          cellName: currentCell.name
        }
      });
    }

    // 检查玩家资金
    const price = currentCell.price || 0;
    if (player.money < price) {
      violations.push({
        rule: this.id,
        message: '资金不足以购买此地产',
        severity: 'error',
        context: {
          playerMoney: player.money,
          propertyPrice: price,
          shortage: price - player.money
        }
      });
    }

    // 警告：购买后资金不足
    if (player.money - price < 200) {
      warnings.push({
        rule: this.id,
        message: '购买后现金不足，可能面临破产风险',
        context: {
          remainingMoney: player.money - price
        }
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }
}

/**
 * 租金支付规则
 */
export class RentPaymentRule implements GameRule {
  readonly id = 'rent_payment';
  readonly name = '租金支付规则';
  readonly description = '验证租金支付的合法性';
  readonly category: RuleCategory = 'property';
  readonly priority = 80;

  validate(action: GameAction, gameState: UnifiedGameState): RuleValidationResult {
    if (action.type !== 'pay_rent') {
      return { isValid: true, violations: [], warnings: [] };
    }

    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];

    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      violations.push({
        rule: this.id,
        message: '找不到玩家',
        severity: 'critical'
      });
      return { isValid: false, violations, warnings };
    }

    const currentCell = gameState.board.find(cell => cell.position === player.position);
    if (!currentCell || !currentCell.owner) {
      violations.push({
        rule: this.id,
        message: '当前位置不需要支付租金',
        severity: 'error',
        context: { position: player.position }
      });
      return { isValid: false, violations, warnings };
    }

    // 检查是否给自己支付租金
    if (currentCell.owner === player.id) {
      violations.push({
        rule: this.id,
        message: '不能给自己支付租金',
        severity: 'error'
      });
    }

    // 检查租金金额
    const rentAmount = currentCell.rent || 0;
    if (player.money < rentAmount) {
      // 资金不足，但允许支付（可能触发破产流程）
      warnings.push({
        rule: this.id,
        message: '资金不足以支付全额租金，可能需要出售资产或宣布破产',
        context: {
          playerMoney: player.money,
          rentAmount,
          shortage: rentAmount - player.money
        }
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }
}

/**
 * 掷骰子规则
 */
export class DiceRollRule implements GameRule {
  readonly id = 'dice_roll';
  readonly name = '掷骰子规则';
  readonly description = '验证掷骰子操作的合法性';
  readonly category: RuleCategory = 'movement';
  readonly priority = 70;

  validate(action: GameAction, gameState: UnifiedGameState): RuleValidationResult {
    if (action.type !== 'roll_dice') {
      return { isValid: true, violations: [], warnings: [] };
    }

    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];

    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      violations.push({
        rule: this.id,
        message: '找不到玩家',
        severity: 'critical'
      });
      return { isValid: false, violations, warnings };
    }

    // 检查玩家是否已经掷过骰子
    if (player.hasRolledThisTurn) {
      violations.push({
        rule: this.id,
        message: '本回合已经掷过骰子',
        severity: 'error'
      });
    }

    // 检查玩家是否在监狱
    if (player.isInJail) {
      // 在监狱中的特殊规则
      if (player.jailTurns >= 3) {
        // 必须支付保释金或使用出狱卡
        warnings.push({
          rule: this.id,
          message: '已在监狱3回合，必须支付保释金才能掷骰子',
          context: { jailTurns: player.jailTurns }
        });
      }
    }

    // 检查连续双数
    if (player.consecutiveDoubles >= 2) {
      warnings.push({
        rule: this.id,
        message: '已连续掷出2次双数，再次掷出双数将进入监狱',
        context: { consecutiveDoubles: player.consecutiveDoubles }
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }
}

/**
 * 技能使用规则
 */
export class SkillUsageRule implements GameRule {
  readonly id = 'skill_usage';
  readonly name = '技能使用规则';
  readonly description = '验证技能使用的合法性';
  readonly category: RuleCategory = 'skills';
  readonly priority = 70;

  validate(action: GameAction, gameState: UnifiedGameState): RuleValidationResult {
    if (action.type !== 'use_skill') {
      return { isValid: true, violations: [], warnings: [] };
    }

    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];

    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      violations.push({
        rule: this.id,
        message: '找不到玩家',
        severity: 'critical'
      });
      return { isValid: false, violations, warnings };
    }

    const skillId = action.data?.skillId;
    if (!skillId) {
      violations.push({
        rule: this.id,
        message: '未指定技能ID',
        severity: 'error'
      });
      return { isValid: false, violations, warnings };
    }

    const skill = player.skills.find(s => s.id === skillId);
    if (!skill) {
      violations.push({
        rule: this.id,
        message: '玩家不拥有此技能',
        severity: 'error',
        context: { skillId }
      });
      return { isValid: false, violations, warnings };
    }

    // 检查技能使用次数
    if (skill.maxUsage && skill.usageCount >= skill.maxUsage) {
      violations.push({
        rule: this.id,
        message: '技能已达到最大使用次数',
        severity: 'error',
        context: {
          skillName: skill.name,
          usageCount: skill.usageCount,
          maxUsage: skill.maxUsage
        }
      });
    }

    // 检查冷却时间
    if (skill.lastUsed && skill.cooldown) {
      const timeSinceLastUse = Date.now() - skill.lastUsed;
      if (timeSinceLastUse < skill.cooldown) {
        violations.push({
          rule: this.id,
          message: '技能仍在冷却中',
          severity: 'error',
          context: {
            skillName: skill.name,
            remainingCooldown: skill.cooldown - timeSinceLastUse
          }
        });
      }
    }

    // 检查技能费用
    if (skill.cost && player.money < skill.cost) {
      violations.push({
        rule: this.id,
        message: '资金不足以使用此技能',
        severity: 'error',
        context: {
          skillName: skill.name,
          skillCost: skill.cost,
          playerMoney: player.money
        }
      });
    }

    // 检查玩家是否被禁止使用技能
    if (!player.canUseSkills) {
      violations.push({
        rule: this.id,
        message: '当前状态下不能使用技能',
        severity: 'error'
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }
}

/**
 * 破产规则
 */
export class BankruptcyRule implements GameRule {
  readonly id = 'bankruptcy';
  readonly name = '破产规则';
  readonly description = '处理玩家破产相关规则';
  readonly category: RuleCategory = 'endgame';
  readonly priority = 60;

  validate(action: GameAction, gameState: UnifiedGameState): RuleValidationResult {
    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];

    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) {
      return { isValid: true, violations, warnings };
    }

    // 检查玩家是否应该破产
    const totalAssets = this.calculateTotalAssets(player, gameState);
    
    if (totalAssets <= 0 && action.type !== 'declare_bankruptcy') {
      violations.push({
        rule: this.id,
        message: '玩家已无力偿还债务，必须宣布破产',
        severity: 'critical',
        context: { totalAssets }
      });
    }

    // 警告：接近破产
    if (totalAssets > 0 && totalAssets < 200) {
      warnings.push({
        rule: this.id,
        message: '总资产不足，接近破产',
        context: { totalAssets }
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  private calculateTotalAssets(player: Player, gameState: UnifiedGameState): number {
    let totalValue = player.money;
    
    // 计算地产价值
    for (const ownership of player.properties) {
      const cell = gameState.board.find(c => c.position === ownership.propertyPosition);
      if (cell && !cell.isMortgaged) {
        totalValue += ownership.purchasePrice * 0.5; // 出售价值通常是购买价的一半
      }
    }

    return totalValue;
  }
}

// ===== 主要规则引擎类 =====

/**
 * 游戏规则引擎
 */
export class GameRuleEngine {
  private rules: Map<string, GameRule> = new Map();
  private logger: ContextLogger;

  constructor() {
    this.logger = createContextLogger({ component: 'GameRuleEngine' });
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认规则
   */
  private initializeDefaultRules(): void {
    const defaultRules: GameRule[] = [
      new TurnOrderRule(),
      new PhaseRule(),
      new PropertyPurchaseRule(),
      new RentPaymentRule(),
      new DiceRollRule(),
      new SkillUsageRule(),
      new BankruptcyRule()
    ];

    for (const rule of defaultRules) {
      this.addRule(rule);
    }

    this.logger.info(`Initialized ${defaultRules.length} default rules`);
  }

  /**
   * 添加规则
   */
  addRule(rule: GameRule): void {
    this.rules.set(rule.id, rule);
    this.logger.debug(`Added rule: ${rule.name}`, { ruleId: rule.id, category: rule.category });
  }

  /**
   * 移除规则
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.logger.debug(`Removed rule: ${ruleId}`);
    }
    return removed;
  }

  /**
   * 获取规则
   */
  getRule(ruleId: string): GameRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * 获取所有规则
   */
  getAllRules(): GameRule[] {
    return Array.from(this.rules.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * 验证游戏操作
   */
  validateAction(action: GameAction, gameState: UnifiedGameState): RuleValidationResult {
    const startTime = performance.now();
    
    let allViolations: RuleViolation[] = [];
    let allWarnings: RuleWarning[] = [];
    let allSuggestions: string[] = [];

    // 按优先级顺序验证所有规则
    const sortedRules = this.getAllRules();
    
    for (const rule of sortedRules) {
      try {
        const result = rule.validate(action, gameState);
        
        allViolations = allViolations.concat(result.violations);
        allWarnings = allWarnings.concat(result.warnings);
        
        if (result.suggestions) {
          allSuggestions = allSuggestions.concat(result.suggestions);
        }
        
        // 如果有严重违规，停止验证
        if (result.violations.some(v => v.severity === 'critical')) {
          this.logger.warn(`Critical rule violation in ${rule.id}, stopping validation`, {
            actionType: action.type,
            playerId: action.playerId,
            violations: result.violations.filter(v => v.severity === 'critical')
          });
          break;
        }
        
      } catch (error) {
        this.logger.error(`Error in rule validation: ${rule.id}`, {
          actionType: action.type,
          playerId: action.playerId,
          ruleId: rule.id
        }, error as Error);
        
        allViolations.push({
          rule: rule.id,
          message: `规则验证内部错误: ${(error as Error).message}`,
          severity: 'critical'
        });
      }
    }

    const duration = performance.now() - startTime;
    
    const validationResult: RuleValidationResult = {
      isValid: allViolations.length === 0,
      violations: allViolations,
      warnings: allWarnings,
      suggestions: allSuggestions.length > 0 ? allSuggestions : undefined
    };

    this.logger.performance('Rule validation', duration, {
      actionType: action.type,
      playerId: action.playerId,
      isValid: validationResult.isValid,
      violationCount: allViolations.length,
      warningCount: allWarnings.length,
      rulesChecked: sortedRules.length
    });

    return validationResult;
  }

  /**
   * 验证游戏状态完整性
   */
  validateGameState(gameState: UnifiedGameState): RuleValidationResult {
    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];

    // 基础状态验证
    if (gameState.players.length === 0) {
      violations.push({
        rule: 'game_state',
        message: '游戏中没有玩家',
        severity: 'critical'
      });
    }

    if (gameState.currentPlayerIndex < 0 || gameState.currentPlayerIndex >= gameState.players.length) {
      violations.push({
        rule: 'game_state',
        message: '当前玩家索引无效',
        severity: 'critical',
        context: {
          currentPlayerIndex: gameState.currentPlayerIndex,
          playerCount: gameState.players.length
        }
      });
    }

    if (gameState.round < 1) {
      violations.push({
        rule: 'game_state',
        message: '回合数无效',
        severity: 'error',
        context: { round: gameState.round }
      });
    }

    // 玩家状态验证
    for (const player of gameState.players) {
      if (player.money < 0) {
        violations.push({
          rule: 'player_state',
          message: `玩家 ${player.name} 的金钱为负数`,
          severity: 'error',
          context: { playerId: player.id, money: player.money }
        });
      }

      if (player.position < 0 || player.position >= gameState.board.length) {
        violations.push({
          rule: 'player_state',
          message: `玩家 ${player.name} 的位置无效`,
          severity: 'error',
          context: { 
            playerId: player.id, 
            position: player.position,
            boardSize: gameState.board.length
          }
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * 获取规则建议
   */
  getActionSuggestions(gameState: UnifiedGameState, playerId: PlayerId): string[] {
    const suggestions: string[] = [];
    const player = gameState.players.find(p => p.id === playerId);
    
    if (!player) return suggestions;

    // 基于当前状态提供建议
    switch (gameState.phase) {
      case 'roll_dice':
        suggestions.push('掷骰子开始移动');
        if (player.skills.length > 0) {
          suggestions.push('考虑使用技能获得优势');
        }
        break;
        
      case 'property_action':
        const currentCell = gameState.board.find(c => c.position === player.position);
        if (currentCell && currentCell.price) {
          if (player.money >= currentCell.price) {
            suggestions.push('购买此地产可以获得租金收入');
          } else {
            suggestions.push('资金不足，考虑跳过购买');
          }
        }
        break;
        
      case 'pay_rent':
        if (player.money < (gameState.board.find(c => c.position === player.position)?.rent || 0)) {
          suggestions.push('考虑出售资产或宣布破产');
        }
        break;
    }

    // 财务建议
    if (player.money < 200) {
      suggestions.push('现金不足，注意破产风险');
    }

    return suggestions;
  }
}

// ===== 默认导出 =====

export default GameRuleEngine;