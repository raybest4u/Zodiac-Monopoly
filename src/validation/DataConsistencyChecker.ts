import type { GameState, Player, BoardCell } from '../types/game';

export interface ConsistencyRule {
  id: string;
  name: string;
  description: string;
  category: 'structure' | 'business' | 'player' | 'board' | 'economy' | 'timing';
  severity: 'critical' | 'error' | 'warning' | 'info';
  checker: (gameState: GameState) => Promise<ConsistencyResult>;
  autoFix?: (gameState: GameState, violation: ConsistencyViolation) => Promise<GameState>;
}

export interface ConsistencyResult {
  isValid: boolean;
  violations: ConsistencyViolation[];
  metrics: ConsistencyMetrics;
  suggestions: string[];
}

export interface ConsistencyViolation {
  ruleId: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  path: string;
  expectedValue?: any;
  actualValue?: any;
  context?: {[key: string]: any};
  fixable: boolean;
  impact: 'game_breaking' | 'logic_error' | 'performance' | 'cosmetic';
}

export interface ConsistencyMetrics {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  criticalViolations: number;
  errorViolations: number;
  warningViolations: number;
  infoViolations: number;
  fixableViolations: number;
  performanceMs: number;
}

export interface ValidationContext {
  enableAutoFix: boolean;
  strictMode: boolean;
  categories: string[];
  maxViolations: number;
  timeoutMs: number;
  customRules: ConsistencyRule[];
}

export interface FixResult {
  success: boolean;
  fixedViolations: ConsistencyViolation[];
  remainingViolations: ConsistencyViolation[];
  modifiedGameState: GameState;
  fixLog: string[];
}

export class DataConsistencyChecker {
  private rules = new Map<string, ConsistencyRule>();
  private cache = new Map<string, ConsistencyResult>();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    this.registerDefaultRules();
  }

  private registerDefaultRules(): void {
    this.registerRule({
      id: 'game_structure_basic',
      name: '基础游戏结构检查',
      description: '检查游戏状态的基本结构完整性',
      category: 'structure',
      severity: 'critical',
      checker: async (gameState: GameState) => {
        const violations: ConsistencyViolation[] = [];

        if (!gameState.gameId || typeof gameState.gameId !== 'string') {
          violations.push({
            ruleId: 'game_structure_basic',
            severity: 'critical',
            message: '游戏ID缺失或格式错误',
            path: 'gameId',
            expectedValue: 'string',
            actualValue: gameState.gameId,
            fixable: false,
            impact: 'game_breaking'
          });
        }

        if (!Array.isArray(gameState.players) || gameState.players.length === 0) {
          violations.push({
            ruleId: 'game_structure_basic',
            severity: 'critical',
            message: '玩家数组缺失或为空',
            path: 'players',
            expectedValue: 'Player[]',
            actualValue: gameState.players,
            fixable: false,
            impact: 'game_breaking'
          });
        }

        if (!Array.isArray(gameState.board) || gameState.board.length === 0) {
          violations.push({
            ruleId: 'game_structure_basic',
            severity: 'critical',
            message: '棋盘数组缺失或为空',
            path: 'board',
            expectedValue: 'BoardCell[]',
            actualValue: gameState.board,
            fixable: false,
            impact: 'game_breaking'
          });
        }

        return {
          isValid: violations.length === 0,
          violations,
          metrics: {
            totalChecks: 3,
            passedChecks: 3 - violations.length,
            failedChecks: violations.length,
            criticalViolations: violations.filter(v => v.severity === 'critical').length,
            errorViolations: 0,
            warningViolations: 0,
            infoViolations: 0,
            fixableViolations: violations.filter(v => v.fixable).length,
            performanceMs: 0
          },
          suggestions: violations.length > 0 ? ['请确保游戏状态包含所有必需的基础字段'] : []
        };
      }
    });

    this.registerRule({
      id: 'player_data_integrity',
      name: '玩家数据完整性检查',
      description: '检查所有玩家数据的完整性和有效性',
      category: 'player',
      severity: 'error',
      checker: async (gameState: GameState) => {
        const violations: ConsistencyViolation[] = [];
        const playerIds = new Set<string>();

        gameState.players.forEach((player, index) => {
          if (!player.id || typeof player.id !== 'string') {
            violations.push({
              ruleId: 'player_data_integrity',
              severity: 'critical',
              message: `玩家${index}的ID缺失或格式错误`,
              path: `players[${index}].id`,
              expectedValue: 'string',
              actualValue: player.id,
              fixable: true,
              impact: 'game_breaking'
            });
          }

          if (playerIds.has(player.id)) {
            violations.push({
              ruleId: 'player_data_integrity',
              severity: 'critical',
              message: `玩家ID重复: ${player.id}`,
              path: `players[${index}].id`,
              fixable: true,
              impact: 'game_breaking'
            });
          } else {
            playerIds.add(player.id);
          }

          if (typeof player.money !== 'number' || player.money < 0) {
            violations.push({
              ruleId: 'player_data_integrity',
              severity: 'error',
              message: `玩家${player.id}的金钱数量无效`,
              path: `players[${index}].money`,
              expectedValue: 'number >= 0',
              actualValue: player.money,
              fixable: true,
              impact: 'logic_error'
            });
          }

          if (typeof player.position !== 'number' || 
              player.position < 0 || 
              player.position >= gameState.board.length) {
            violations.push({
              ruleId: 'player_data_integrity',
              severity: 'error',
              message: `玩家${player.id}的位置无效`,
              path: `players[${index}].position`,
              expectedValue: `0-${gameState.board.length - 1}`,
              actualValue: player.position,
              fixable: true,
              impact: 'logic_error'
            });
          }
        });

        return {
          isValid: violations.length === 0,
          violations,
          metrics: {
            totalChecks: gameState.players.length * 3,
            passedChecks: (gameState.players.length * 3) - violations.length,
            failedChecks: violations.length,
            criticalViolations: violations.filter(v => v.severity === 'critical').length,
            errorViolations: violations.filter(v => v.severity === 'error').length,
            warningViolations: 0,
            infoViolations: 0,
            fixableViolations: violations.filter(v => v.fixable).length,
            performanceMs: 0
          },
          suggestions: violations.length > 0 ? ['检查玩家数据的格式和有效性'] : []
        };
      },
      autoFix: async (gameState: GameState, violation: ConsistencyViolation) => {
        const newState = JSON.parse(JSON.stringify(gameState));

        if (violation.path.includes('.money') && violation.actualValue < 0) {
          const playerIndex = parseInt(violation.path.match(/\[(\d+)\]/)?.[1] || '0');
          newState.players[playerIndex].money = 0;
        }

        if (violation.path.includes('.position')) {
          const playerIndex = parseInt(violation.path.match(/\[(\d+)\]/)?.[1] || '0');
          newState.players[playerIndex].position = 0;
        }

        if (violation.path.includes('.id') && !violation.actualValue) {
          const playerIndex = parseInt(violation.path.match(/\[(\d+)\]/)?.[1] || '0');
          newState.players[playerIndex].id = `player_${playerIndex}_${Date.now()}`;
        }

        return newState;
      }
    });

    this.registerRule({
      id: 'board_consistency',
      name: '棋盘一致性检查',
      description: '检查棋盘数据的一致性和完整性',
      category: 'board',
      severity: 'error',
      checker: async (gameState: GameState) => {
        const violations: ConsistencyViolation[] = [];
        const positions = new Set<number>();

        gameState.board.forEach((cell, index) => {
          if (cell.position !== index) {
            violations.push({
              ruleId: 'board_consistency',
              severity: 'error',
              message: `格子位置不匹配: 期望${index}, 实际${cell.position}`,
              path: `board[${index}].position`,
              expectedValue: index,
              actualValue: cell.position,
              fixable: true,
              impact: 'logic_error'
            });
          }

          if (positions.has(cell.position)) {
            violations.push({
              ruleId: 'board_consistency',
              severity: 'critical',
              message: `棋盘位置重复: ${cell.position}`,
              path: `board[${index}].position`,
              fixable: true,
              impact: 'game_breaking'
            });
          } else {
            positions.add(cell.position);
          }

          if (!cell.id || typeof cell.id !== 'string') {
            violations.push({
              ruleId: 'board_consistency',
              severity: 'error',
              message: `格子${index}的ID缺失或格式错误`,
              path: `board[${index}].id`,
              expectedValue: 'string',
              actualValue: cell.id,
              fixable: true,
              impact: 'logic_error'
            });
          }
        });

        if (gameState.board.length !== 40) {
          violations.push({
            ruleId: 'board_consistency',
            severity: 'warning',
            message: `棋盘格子数量异常: 期望40, 实际${gameState.board.length}`,
            path: 'board.length',
            expectedValue: 40,
            actualValue: gameState.board.length,
            fixable: false,
            impact: 'logic_error'
          });
        }

        return {
          isValid: violations.length === 0,
          violations,
          metrics: {
            totalChecks: gameState.board.length * 2 + 1,
            passedChecks: (gameState.board.length * 2 + 1) - violations.length,
            failedChecks: violations.length,
            criticalViolations: violations.filter(v => v.severity === 'critical').length,
            errorViolations: violations.filter(v => v.severity === 'error').length,
            warningViolations: violations.filter(v => v.severity === 'warning').length,
            infoViolations: 0,
            fixableViolations: violations.filter(v => v.fixable).length,
            performanceMs: 0
          },
          suggestions: violations.length > 0 ? ['检查棋盘数据的完整性和位置映射'] : []
        };
      },
      autoFix: async (gameState: GameState, violation: ConsistencyViolation) => {
        const newState = JSON.parse(JSON.stringify(gameState));

        if (violation.path.includes('.position')) {
          const cellIndex = parseInt(violation.path.match(/\[(\d+)\]/)?.[1] || '0');
          newState.board[cellIndex].position = cellIndex;
        }

        if (violation.path.includes('.id') && !violation.actualValue) {
          const cellIndex = parseInt(violation.path.match(/\[(\d+)\]/)?.[1] || '0');
          newState.board[cellIndex].id = `cell_${cellIndex}`;
        }

        return newState;
      }
    });

    this.registerRule({
      id: 'economic_balance',
      name: '经济平衡检查',
      description: '检查游戏中的经济平衡和财产分配',
      category: 'economy',
      severity: 'warning',
      checker: async (gameState: GameState) => {
        const violations: ConsistencyViolation[] = [];
        
        const totalMoney = gameState.players.reduce((sum, p) => sum + p.money, 0);
        const averageMoney = totalMoney / gameState.players.length;
        
        const richestPlayer = Math.max(...gameState.players.map(p => p.money));
        const poorestPlayer = Math.min(...gameState.players.map(p => p.money));
        const wealthGap = richestPlayer - poorestPlayer;

        if (wealthGap > averageMoney * 5) {
          violations.push({
            ruleId: 'economic_balance',
            severity: 'info',
            message: `财富差距过大: 最富${richestPlayer}, 最穷${poorestPlayer}`,
            path: 'players.money',
            context: { wealthGap, averageMoney },
            fixable: false,
            impact: 'cosmetic'
          });
        }

        gameState.players.forEach((player, index) => {
          if (player.money <= 0 && gameState.status === 'playing') {
            violations.push({
              ruleId: 'economic_balance',
              severity: 'warning',
              message: `玩家${player.id}破产但游戏仍在进行`,
              path: `players[${index}].money`,
              actualValue: player.money,
              fixable: false,
              impact: 'logic_error'
            });
          }
        });

        const totalProperties = gameState.board.filter(cell => cell.type === 'property').length;
        const ownedProperties = gameState.players.reduce((sum, p) => sum + p.properties.length, 0);
        
        if (ownedProperties > totalProperties) {
          violations.push({
            ruleId: 'economic_balance',
            severity: 'error',
            message: `拥有的财产数量超过了棋盘上的财产总数`,
            path: 'players.properties',
            expectedValue: `<= ${totalProperties}`,
            actualValue: ownedProperties,
            fixable: true,
            impact: 'logic_error'
          });
        }

        return {
          isValid: violations.filter(v => v.severity === 'error' || v.severity === 'critical').length === 0,
          violations,
          metrics: {
            totalChecks: 3 + gameState.players.length,
            passedChecks: (3 + gameState.players.length) - violations.length,
            failedChecks: violations.length,
            criticalViolations: 0,
            errorViolations: violations.filter(v => v.severity === 'error').length,
            warningViolations: violations.filter(v => v.severity === 'warning').length,
            infoViolations: violations.filter(v => v.severity === 'info').length,
            fixableViolations: violations.filter(v => v.fixable).length,
            performanceMs: 0
          },
          suggestions: violations.length > 0 ? ['关注游戏经济平衡，确保游戏逻辑正确'] : []
        };
      }
    });

    this.registerRule({
      id: 'timing_consistency',
      name: '时间一致性检查',
      description: '检查游戏时间和回合的一致性',
      category: 'timing',
      severity: 'warning',
      checker: async (gameState: GameState) => {
        const violations: ConsistencyViolation[] = [];

        if (gameState.currentPlayerIndex < 0 || 
            gameState.currentPlayerIndex >= gameState.players.length) {
          violations.push({
            ruleId: 'timing_consistency',
            severity: 'error',
            message: `当前玩家索引无效: ${gameState.currentPlayerIndex}`,
            path: 'currentPlayerIndex',
            expectedValue: `0-${gameState.players.length - 1}`,
            actualValue: gameState.currentPlayerIndex,
            fixable: true,
            impact: 'logic_error'
          });
        }

        if (gameState.turn <= 0) {
          violations.push({
            ruleId: 'timing_consistency',
            severity: 'warning',
            message: `回合数无效: ${gameState.turn}`,
            path: 'turn',
            expectedValue: '>= 1',
            actualValue: gameState.turn,
            fixable: true,
            impact: 'logic_error'
          });
        }

        if (gameState.round <= 0) {
          violations.push({
            ruleId: 'timing_consistency',
            severity: 'warning',
            message: `轮数无效: ${gameState.round}`,
            path: 'round',
            expectedValue: '>= 1',
            actualValue: gameState.round,
            fixable: true,
            impact: 'logic_error'
          });
        }

        const now = Date.now();
        if (gameState.lastUpdateTime > now) {
          violations.push({
            ruleId: 'timing_consistency',
            severity: 'warning',
            message: `最后更新时间在未来: ${new Date(gameState.lastUpdateTime)}`,
            path: 'lastUpdateTime',
            actualValue: gameState.lastUpdateTime,
            fixable: true,
            impact: 'logic_error'
          });
        }

        return {
          isValid: violations.filter(v => v.severity === 'error' || v.severity === 'critical').length === 0,
          violations,
          metrics: {
            totalChecks: 4,
            passedChecks: 4 - violations.length,
            failedChecks: violations.length,
            criticalViolations: 0,
            errorViolations: violations.filter(v => v.severity === 'error').length,
            warningViolations: violations.filter(v => v.severity === 'warning').length,
            infoViolations: 0,
            fixableViolations: violations.filter(v => v.fixable).length,
            performanceMs: 0
          },
          suggestions: violations.length > 0 ? ['检查游戏时间和回合状态的正确性'] : []
        };
      },
      autoFix: async (gameState: GameState, violation: ConsistencyViolation) => {
        const newState = JSON.parse(JSON.stringify(gameState));

        if (violation.path === 'currentPlayerIndex') {
          newState.currentPlayerIndex = 0;
        } else if (violation.path === 'turn') {
          newState.turn = 1;
        } else if (violation.path === 'round') {
          newState.round = 1;
        } else if (violation.path === 'lastUpdateTime') {
          newState.lastUpdateTime = Date.now();
        }

        return newState;
      }
    });
  }

  registerRule(rule: ConsistencyRule): void {
    this.rules.set(rule.id, rule);
  }

  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  async checkConsistency(
    gameState: GameState,
    context: Partial<ValidationContext> = {}
  ): Promise<ConsistencyResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(gameState, context);
    
    if (!context.strictMode) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - startTime < this.cacheTimeout) {
        return cached;
      }
    }

    const config: ValidationContext = {
      enableAutoFix: false,
      strictMode: false,
      categories: [],
      maxViolations: 1000,
      timeoutMs: 30000,
      customRules: [],
      ...context
    };

    const allViolations: ConsistencyViolation[] = [];
    const allMetrics: ConsistencyMetrics[] = [];
    const allSuggestions: string[] = [];

    const rulesToCheck = Array.from(this.rules.values())
      .concat(config.customRules)
      .filter(rule => 
        config.categories.length === 0 || 
        config.categories.includes(rule.category)
      );

    for (const rule of rulesToCheck) {
      if (Date.now() - startTime > config.timeoutMs) {
        break;
      }

      if (allViolations.length >= config.maxViolations) {
        break;
      }

      try {
        const ruleStartTime = Date.now();
        const result = await rule.checker(gameState);
        result.metrics.performanceMs = Date.now() - ruleStartTime;

        allViolations.push(...result.violations);
        allMetrics.push(result.metrics);
        allSuggestions.push(...result.suggestions);
      } catch (error) {
        allViolations.push({
          ruleId: rule.id,
          severity: 'error',
          message: `规则检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
          path: 'system',
          fixable: false,
          impact: 'logic_error'
        });
      }
    }

    const combinedMetrics: ConsistencyMetrics = {
      totalChecks: allMetrics.reduce((sum, m) => sum + m.totalChecks, 0),
      passedChecks: allMetrics.reduce((sum, m) => sum + m.passedChecks, 0),
      failedChecks: allMetrics.reduce((sum, m) => sum + m.failedChecks, 0),
      criticalViolations: allViolations.filter(v => v.severity === 'critical').length,
      errorViolations: allViolations.filter(v => v.severity === 'error').length,
      warningViolations: allViolations.filter(v => v.severity === 'warning').length,
      infoViolations: allViolations.filter(v => v.severity === 'info').length,
      fixableViolations: allViolations.filter(v => v.fixable).length,
      performanceMs: Date.now() - startTime
    };

    const result: ConsistencyResult = {
      isValid: combinedMetrics.criticalViolations === 0 && combinedMetrics.errorViolations === 0,
      violations: allViolations,
      metrics: combinedMetrics,
      suggestions: Array.from(new Set(allSuggestions))
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  async autoFixViolations(
    gameState: GameState,
    violations: ConsistencyViolation[]
  ): Promise<FixResult> {
    const fixLog: string[] = [];
    const fixedViolations: ConsistencyViolation[] = [];
    const remainingViolations: ConsistencyViolation[] = [];
    let modifiedGameState = JSON.parse(JSON.stringify(gameState));

    for (const violation of violations) {
      if (!violation.fixable) {
        remainingViolations.push(violation);
        continue;
      }

      const rule = this.rules.get(violation.ruleId);
      if (!rule || !rule.autoFix) {
        remainingViolations.push(violation);
        continue;
      }

      try {
        const fixedState = await rule.autoFix(modifiedGameState, violation);
        modifiedGameState = fixedState;
        fixedViolations.push(violation);
        fixLog.push(`Fixed violation in ${violation.path}: ${violation.message}`);
      } catch (error) {
        remainingViolations.push(violation);
        fixLog.push(`Failed to fix violation in ${violation.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: fixedViolations.length > 0,
      fixedViolations,
      remainingViolations,
      modifiedGameState,
      fixLog
    };
  }

  private generateCacheKey(gameState: GameState, context: Partial<ValidationContext>): string {
    const stateHash = this.hashGameState(gameState);
    const contextHash = JSON.stringify(context);
    return `${stateHash}_${contextHash}`;
  }

  private hashGameState(gameState: GameState): string {
    const keyData = {
      gameId: gameState.gameId,
      playersCount: gameState.players.length,
      turn: gameState.turn,
      round: gameState.round,
      phase: gameState.phase,
      status: gameState.status,
      lastUpdate: gameState.lastUpdateTime
    };
    
    return JSON.stringify(keyData);
  }

  getRegisteredRules(): ConsistencyRule[] {
    return Array.from(this.rules.values());
  }

  getRulesByCategory(category: string): ConsistencyRule[] {
    return Array.from(this.rules.values()).filter(rule => rule.category === category);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getStats(): {rulesCount: number; cacheSize: number; categories: string[]} {
    const categories = Array.from(new Set(
      Array.from(this.rules.values()).map(rule => rule.category)
    ));

    return {
      rulesCount: this.rules.size,
      cacheSize: this.cache.size,
      categories
    };
  }
}