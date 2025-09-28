import type {
  ZodiacSign,
  Player,
  GameState,
  DiceResult,
  PlayerSkill
} from '../types/game';
import type {
  AIPersonality,
  AIDecision,
  AIOpponentConfig
} from '../types/ai';
import type {
  SaveData,
  GameConfig
} from '../types/storage';
import { ZODIAC_DATA, GAME_CONSTANTS } from '../types/constants';

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// 验证错误接口
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

// 验证警告接口
export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// 基础类型验证器
export class TypeValidator {
  /**
   * 验证字符串不为空
   */
  static validateNonEmptyString(value: unknown, fieldName: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'string') {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be a string`,
        code: 'INVALID_TYPE',
        severity: 'error'
      });
    } else if (value.trim().length === 0) {
      errors.push({
        field: fieldName,
        message: `${fieldName} cannot be empty`,
        code: 'EMPTY_STRING',
        severity: 'error'
      });
    }
    
    return errors;
  }

  /**
   * 验证数字范围
   */
  static validateNumberRange(
    value: unknown,
    fieldName: string,
    min?: number,
    max?: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'number') {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be a number`,
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return errors;
    }
    
    if (!Number.isFinite(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be a finite number`,
        code: 'INVALID_NUMBER',
        severity: 'error'
      });
      return errors;
    }
    
    if (min !== undefined && value < min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
        code: 'VALUE_TOO_LOW',
        severity: 'error'
      });
    }
    
    if (max !== undefined && value > max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must not exceed ${max}`,
        code: 'VALUE_TOO_HIGH',
        severity: 'error'
      });
    }
    
    return errors;
  }

  /**
   * 验证数组不为空
   */
  static validateNonEmptyArray(value: unknown, fieldName: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!Array.isArray(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be an array`,
        code: 'INVALID_TYPE',
        severity: 'error'
      });
    } else if (value.length === 0) {
      errors.push({
        field: fieldName,
        message: `${fieldName} cannot be empty`,
        code: 'EMPTY_ARRAY',
        severity: 'error'
      });
    }
    
    return errors;
  }

  /**
   * 验证枚举值
   */
  static validateEnum<T extends string>(
    value: unknown,
    fieldName: string,
    allowedValues: readonly T[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'string') {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be a string`,
        code: 'INVALID_TYPE',
        severity: 'error'
      });
    } else if (!allowedValues.includes(value as T)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        code: 'INVALID_ENUM_VALUE',
        severity: 'error'
      });
    }
    
    return errors;
  }

  /**
   * 验证时间戳
   */
  static validateTimestamp(value: unknown, fieldName: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (typeof value !== 'number') {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be a number`,
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return errors;
    }
    
    const now = Date.now();
    const minTimestamp = new Date('2020-01-01').getTime();
    const maxTimestamp = now + (365 * 24 * 60 * 60 * 1000); // 1 year from now
    
    if (value < minTimestamp || value > maxTimestamp) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is not a valid timestamp`,
        code: 'INVALID_TIMESTAMP',
        severity: 'error'
      });
    }
    
    return errors;
  }
}

// 生肖验证器
export class ZodiacValidator {
  /**
   * 验证生肖类型
   */
  static validateZodiacSign(zodiac: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const zodiacSigns = Object.keys(ZODIAC_DATA) as ZodiacSign[];
    errors.push(...TypeValidator.validateEnum(zodiac, 'zodiac', zodiacSigns));
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证生肖兼容性
   */
  static validateZodiacCompatibility(zodiac1: ZodiacSign, zodiac2: ZodiacSign): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // 验证两个生肖都有效
    const result1 = this.validateZodiacSign(zodiac1);
    const result2 = this.validateZodiacSign(zodiac2);
    
    errors.push(...result1.errors, ...result2.errors);
    
    if (errors.length === 0) {
      const data1 = ZODIAC_DATA[zodiac1];
      
      // 检查冲突
      if (data1.conflict.includes(zodiac2)) {
        warnings.push({
          field: 'compatibility',
          message: `${zodiac1} and ${zodiac2} are in conflict`,
          suggestion: 'Consider choosing compatible zodiac signs for better synergy'
        });
      }
      
      // 检查兼容性
      if (data1.compatible.includes(zodiac2)) {
        // 这是好事，不需要警告
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// 玩家验证器
export class PlayerValidator {
  /**
   * 验证玩家对象
   */
  static validatePlayer(player: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!player || typeof player !== 'object') {
      errors.push({
        field: 'player',
        message: 'Player must be an object',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
    
    const p = player as Partial<Player>;
    
    // 验证必填字段
    errors.push(...TypeValidator.validateNonEmptyString(p.id, 'id'));
    errors.push(...TypeValidator.validateNonEmptyString(p.name, 'name'));
    
    // 验证生肖
    const zodiacResult = ZodiacValidator.validateZodiacSign(p.zodiac);
    errors.push(...zodiacResult.errors);
    
    // 验证游戏状态
    errors.push(...TypeValidator.validateNumberRange(p.position, 'position', 0, GAME_CONSTANTS.BOARD_SIZE - 1));
    errors.push(...TypeValidator.validateNumberRange(p.money, 'money', 0));
    
    // 验证布尔值
    if (typeof p.isHuman !== 'boolean') {
      errors.push({
        field: 'isHuman',
        message: 'isHuman must be a boolean',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
    }
    
    // 验证数组
    if (p.properties && !Array.isArray(p.properties)) {
      errors.push({
        field: 'properties',
        message: 'properties must be an array',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
    }
    
    if (p.skills && !Array.isArray(p.skills)) {
      errors.push({
        field: 'skills',
        message: 'skills must be an array',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
    }
    
    // 添加建议
    if (p.name && p.name.length > 20) {
      warnings.push({
        field: 'name',
        message: 'Player name is quite long',
        suggestion: 'Consider using a shorter name for better display'
      });
    }
    
    if (p.money !== undefined && p.money > 1000000) {
      warnings.push({
        field: 'money',
        message: 'Player has very high amount of money',
        suggestion: 'Check if this is intended or if there\'s a balance issue'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证玩家技能
   */
  static validatePlayerSkill(skill: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!skill || typeof skill !== 'object') {
      errors.push({
        field: 'skill',
        message: 'Skill must be an object',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
    
    const s = skill as Partial<PlayerSkill>;
    
    // 验证必填字段
    errors.push(...TypeValidator.validateNonEmptyString(s.id, 'id'));
    errors.push(...TypeValidator.validateNonEmptyString(s.name, 'name'));
    errors.push(...TypeValidator.validateNonEmptyString(s.description, 'description'));
    
    // 验证技能类型
    errors.push(...TypeValidator.validateEnum(s.type, 'type', ['active', 'passive', 'triggered']));
    
    // 验证生肖
    const zodiacResult = ZodiacValidator.validateZodiacSign(s.zodiac);
    errors.push(...zodiacResult.errors);
    
    // 验证数值范围
    errors.push(...TypeValidator.validateNumberRange(s.level, 'level', 1, GAME_CONSTANTS.MAX_SKILL_LEVEL));
    errors.push(...TypeValidator.validateNumberRange(s.maxLevel, 'maxLevel', 1, GAME_CONSTANTS.MAX_SKILL_LEVEL));
    errors.push(...TypeValidator.validateNumberRange(s.cooldown, 'cooldown', 0));
    
    // 验证等级逻辑
    if (typeof s.level === 'number' && typeof s.maxLevel === 'number' && s.level > s.maxLevel) {
      errors.push({
        field: 'level',
        message: 'Skill level cannot exceed max level',
        code: 'INVALID_LEVEL',
        severity: 'error'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// 游戏状态验证器
export class GameStateValidator {
  /**
   * 验证游戏状态
   */
  static validateGameState(gameState: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!gameState || typeof gameState !== 'object') {
      errors.push({
        field: 'gameState',
        message: 'Game state must be an object',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
    
    const gs = gameState as Partial<GameState>;
    
    // 验证必填字段
    errors.push(...TypeValidator.validateNonEmptyString(gs.gameId, 'gameId'));
    
    // 验证状态枚举
    errors.push(...TypeValidator.validateEnum(
      gs.status,
      'status',
      ['initializing', 'waiting', 'playing', 'paused', 'ended', 'error']
    ));
    
    errors.push(...TypeValidator.validateEnum(
      gs.mode,
      'mode',
      ['classic', 'quick', 'custom']
    ));
    
    errors.push(...TypeValidator.validateEnum(
      gs.phase,
      'phase',
      ['roll_dice', 'move_player', 'process_cell', 'handle_event', 'end_turn', 'check_win']
    ));
    
    // 验证玩家
    if (gs.players) {
      errors.push(...TypeValidator.validateNonEmptyArray(gs.players, 'players'));
      
      if (Array.isArray(gs.players)) {
        if (gs.players.length < GAME_CONSTANTS.MIN_PLAYERS) {
          errors.push({
            field: 'players',
            message: `Game requires at least ${GAME_CONSTANTS.MIN_PLAYERS} players`,
            code: 'INSUFFICIENT_PLAYERS',
            severity: 'error'
          });
        }
        
        if (gs.players.length > GAME_CONSTANTS.MAX_PLAYERS) {
          errors.push({
            field: 'players',
            message: `Game cannot have more than ${GAME_CONSTANTS.MAX_PLAYERS} players`,
            code: 'TOO_MANY_PLAYERS',
            severity: 'error'
          });
        }
        
        // 验证每个玩家
        gs.players.forEach((player, index) => {
          const playerResult = PlayerValidator.validatePlayer(player);
          playerResult.errors.forEach(error => {
            errors.push({
              ...error,
              field: `players[${index}].${error.field}`
            });
          });
        });
        
        // 验证玩家ID唯一性
        const playerIds = gs.players.map(p => p?.id).filter(Boolean);
        const uniqueIds = new Set(playerIds);
        if (playerIds.length !== uniqueIds.size) {
          errors.push({
            field: 'players',
            message: 'Player IDs must be unique',
            code: 'DUPLICATE_PLAYER_ID',
            severity: 'error'
          });
        }
      }
    }
    
    // 验证当前玩家索引
    if (gs.players && Array.isArray(gs.players)) {
      errors.push(...TypeValidator.validateNumberRange(
        gs.currentPlayerIndex,
        'currentPlayerIndex',
        0,
        gs.players.length - 1
      ));
    }
    
    // 验证回合和轮次
    errors.push(...TypeValidator.validateNumberRange(gs.round, 'round', 1));
    errors.push(...TypeValidator.validateNumberRange(gs.turn, 'turn', 1));
    
    // 验证时间戳
    if (gs.startTime !== undefined) {
      errors.push(...TypeValidator.validateTimestamp(gs.startTime, 'startTime'));
    }
    
    if (gs.lastUpdateTime !== undefined) {
      errors.push(...TypeValidator.validateTimestamp(gs.lastUpdateTime, 'lastUpdateTime'));
    }
    
    // 验证棋盘
    if (gs.board) {
      if (!Array.isArray(gs.board)) {
        errors.push({
          field: 'board',
          message: 'Board must be an array',
          code: 'INVALID_TYPE',
          severity: 'error'
        });
      } else if (gs.board.length !== GAME_CONSTANTS.BOARD_SIZE) {
        errors.push({
          field: 'board',
          message: `Board must have exactly ${GAME_CONSTANTS.BOARD_SIZE} cells`,
          code: 'INVALID_BOARD_SIZE',
          severity: 'error'
        });
      }
    }
    
    // 添加性能相关警告
    if (gs.players && gs.players.length > 3) {
      warnings.push({
        field: 'players',
        message: 'Large number of players may affect performance',
        suggestion: 'Consider optimizing rendering for better performance'
      });
    }
    
    if (gs.round && gs.round > 100) {
      warnings.push({
        field: 'round',
        message: 'Game has been running for many rounds',
        suggestion: 'Consider checking for infinite game scenarios'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证骰子结果
   */
  static validateDiceResult(diceResult: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!diceResult || typeof diceResult !== 'object') {
      errors.push({
        field: 'diceResult',
        message: 'Dice result must be an object',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
    
    const dr = diceResult as Partial<DiceResult>;
    
    // 验证骰子值
    errors.push(...TypeValidator.validateNumberRange(dr.dice1, 'dice1', GAME_CONSTANTS.DICE_MIN, GAME_CONSTANTS.DICE_MAX));
    errors.push(...TypeValidator.validateNumberRange(dr.dice2, 'dice2', GAME_CONSTANTS.DICE_MIN, GAME_CONSTANTS.DICE_MAX));
    
    // 验证总和
    if (typeof dr.dice1 === 'number' && typeof dr.dice2 === 'number' && typeof dr.total === 'number') {
      if (dr.total !== dr.dice1 + dr.dice2) {
        errors.push({
          field: 'total',
          message: 'Total must equal dice1 + dice2',
          code: 'INVALID_TOTAL',
          severity: 'error'
        });
      }
    }
    
    // 验证双数判断
    if (typeof dr.dice1 === 'number' && typeof dr.dice2 === 'number' && typeof dr.isDouble === 'boolean') {
      if (dr.isDouble !== (dr.dice1 === dr.dice2)) {
        errors.push({
          field: 'isDouble',
          message: 'isDouble must correctly reflect whether dice values are equal',
          code: 'INVALID_DOUBLE_FLAG',
          severity: 'error'
        });
      }
    }
    
    // 验证时间戳
    errors.push(...TypeValidator.validateTimestamp(dr.timestamp, 'timestamp'));
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// AI验证器
export class AIValidator {
  /**
   * 验证AI个性
   */
  static validateAIPersonality(personality: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!personality || typeof personality !== 'object') {
      errors.push({
        field: 'personality',
        message: 'AI personality must be an object',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
    
    const p = personality as Partial<AIPersonality>;
    
    // 验证基础特征 (0-1 范围)
    const traits = ['risk_tolerance', 'aggression', 'cooperation', 'adaptability', 'patience'] as const;
    traits.forEach(trait => {
      errors.push(...TypeValidator.validateNumberRange(p[trait], trait, 0, 1));
    });
    
    // 检查极端值警告
    traits.forEach(trait => {
      const value = p[trait];
      if (typeof value === 'number') {
        if (value <= 0.1 || value >= 0.9) {
          warnings.push({
            field: trait,
            message: `${trait} has extreme value (${value})`,
            suggestion: 'Extreme personality values may lead to predictable AI behavior'
          });
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证AI决策
   */
  static validateAIDecision(decision: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!decision || typeof decision !== 'object') {
      errors.push({
        field: 'decision',
        message: 'AI decision must be an object',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
    
    const d = decision as Partial<AIDecision>;
    
    // 验证置信度
    errors.push(...TypeValidator.validateNumberRange(d.confidence, 'confidence', 0, 1));
    
    // 验证推理
    errors.push(...TypeValidator.validateNonEmptyString(d.reasoning, 'reasoning'));
    
    // 验证时间戳
    errors.push(...TypeValidator.validateTimestamp(d.timestamp, 'timestamp'));
    
    // 检查低置信度警告
    if (typeof d.confidence === 'number' && d.confidence < 0.3) {
      warnings.push({
        field: 'confidence',
        message: 'AI decision has low confidence',
        suggestion: 'Consider improving AI training or providing more context'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// 存储验证器
export class StorageValidator {
  /**
   * 验证存档数据
   */
  static validateSaveData(saveData: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!saveData || typeof saveData !== 'object') {
      errors.push({
        field: 'saveData',
        message: 'Save data must be an object',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
    
    const sd = saveData as Partial<SaveData>;
    
    // 验证必填字段
    errors.push(...TypeValidator.validateNonEmptyString(sd.version, 'version'));
    errors.push(...TypeValidator.validateNonEmptyString(sd.saveId, 'saveId'));
    errors.push(...TypeValidator.validateNonEmptyString(sd.name, 'name'));
    
    // 验证游戏状态
    if (sd.gameState) {
      const gameStateResult = GameStateValidator.validateGameState(sd.gameState);
      errors.push(...gameStateResult.errors);
      warnings.push(...gameStateResult.warnings);
    }
    
    // 验证时间戳
    errors.push(...TypeValidator.validateTimestamp(sd.timestamp, 'timestamp'));
    
    // 验证数值
    errors.push(...TypeValidator.validateNumberRange(sd.playTime, 'playTime', 0));
    errors.push(...TypeValidator.validateNumberRange(sd.round, 'round', 1));
    
    // 验证校验和
    errors.push(...TypeValidator.validateNonEmptyString(sd.checksum, 'checksum'));
    
    // 添加大小警告
    const dataSize = JSON.stringify(saveData).length;
    if (dataSize > 1024 * 1024) { // 1MB
      warnings.push({
        field: 'size',
        message: 'Save data is quite large',
        suggestion: 'Consider data compression or cleanup to improve performance'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证游戏配置
   */
  static validateGameConfig(config: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!config || typeof config !== 'object') {
      errors.push({
        field: 'config',
        message: 'Game config must be an object',
        code: 'INVALID_TYPE',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
    
    const gc = config as Partial<GameConfig>;
    
    // 验证基础设置
    errors.push(...TypeValidator.validateNonEmptyString(gc.playerName, 'playerName'));
    
    const zodiacResult = ZodiacValidator.validateZodiacSign(gc.playerZodiac);
    errors.push(...zodiacResult.errors);
    
    errors.push(...TypeValidator.validateEnum(
      gc.difficulty,
      'difficulty',
      ['easy', 'medium', 'hard', 'expert']
    ));
    
    // 验证AI对手配置
    if (gc.aiOpponents) {
      if (!Array.isArray(gc.aiOpponents)) {
        errors.push({
          field: 'aiOpponents',
          message: 'AI opponents must be an array',
          code: 'INVALID_TYPE',
          severity: 'error'
        });
      } else {
        gc.aiOpponents.forEach((opponent, index) => {
          if (opponent && typeof opponent === 'object') {
            const opp = opponent as Partial<AIOpponentConfig>;
            errors.push(...TypeValidator.validateNonEmptyString(opp.id, `aiOpponents[${index}].id`));
            errors.push(...TypeValidator.validateNonEmptyString(opp.name, `aiOpponents[${index}].name`));
            
            const oppZodiacResult = ZodiacValidator.validateZodiacSign(opp.zodiac);
            oppZodiacResult.errors.forEach(error => {
              errors.push({
                ...error,
                field: `aiOpponents[${index}].${error.field}`
              });
            });
          }
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// 综合验证器
export class GameValidator {
  /**
   * 验证完整的游戏实例
   */
  static validateGameInstance(gameData: {
    config: unknown;
    gameState: unknown;
    players: unknown[];
  }): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // 验证配置
    const configResult = StorageValidator.validateGameConfig(gameData.config);
    errors.push(...configResult.errors);
    warnings.push(...configResult.warnings);
    
    // 验证游戏状态
    const stateResult = GameStateValidator.validateGameState(gameData.gameState);
    errors.push(...stateResult.errors);
    warnings.push(...stateResult.warnings);
    
    // 验证玩家
    gameData.players.forEach((player, index) => {
      const playerResult = PlayerValidator.validatePlayer(player);
      playerResult.errors.forEach(error => {
        errors.push({
          ...error,
          field: `players[${index}].${error.field}`
        });
      });
    });
    
    // 交叉验证
    if (gameData.config && gameData.gameState && gameData.players) {
      // 确保玩家数量一致
      if (Array.isArray(gameData.players) && typeof gameData.gameState === 'object') {
        const gs = gameData.gameState as any;
        if (gs.players && Array.isArray(gs.players) && gs.players.length !== gameData.players.length) {
          errors.push({
            field: 'players',
            message: 'Player count mismatch between gameState and players array',
            code: 'PLAYER_COUNT_MISMATCH',
            severity: 'error'
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 快速验证游戏是否可以开始
   */
  static canStartGame(gameState: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const stateResult = GameStateValidator.validateGameState(gameState);
    errors.push(...stateResult.errors);
    
    if (stateResult.isValid && gameState && typeof gameState === 'object') {
      const gs = gameState as GameState;
      
      // 检查游戏状态
      if (gs.status !== 'waiting') {
        errors.push({
          field: 'status',
          message: 'Game must be in waiting state to start',
          code: 'INVALID_STATUS',
          severity: 'error'
        });
      }
      
      // 检查玩家数量
      if (!gs.players || gs.players.length < GAME_CONSTANTS.MIN_PLAYERS) {
        errors.push({
          field: 'players',
          message: 'Not enough players to start game',
          code: 'INSUFFICIENT_PLAYERS',
          severity: 'error'
        });
      }
      
      // 检查是否有人类玩家
      const hasHumanPlayer = gs.players?.some(p => p.isHuman);
      if (!hasHumanPlayer) {
        warnings.push({
          field: 'players',
          message: 'No human players detected',
          suggestion: 'Game will run in AI-only mode'
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// 导出便捷验证函数
export const validate = {
  zodiac: ZodiacValidator.validateZodiacSign,
  player: PlayerValidator.validatePlayer,
  gameState: GameStateValidator.validateGameState,
  aiPersonality: AIValidator.validateAIPersonality,
  saveData: StorageValidator.validateSaveData,
  gameConfig: StorageValidator.validateGameConfig,
  canStartGame: GameValidator.canStartGame,
  gameInstance: GameValidator.validateGameInstance
};