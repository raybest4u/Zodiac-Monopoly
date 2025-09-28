import type { SaveData, GameConfig } from '../types/storage';
import type { GameState } from '../types/game';
import type { AIState } from '../types/ai';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 数据验证服务
 */
export class ValidationService {
  /**
   * 验证存档数据
   */
  async validateSaveData(saveData: SaveData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 基本字段验证
      if (!saveData.saveId || typeof saveData.saveId !== 'string') {
        errors.push('Invalid save ID');
      }

      if (!saveData.name || typeof saveData.name !== 'string') {
        errors.push('Invalid save name');
      }

      if (!saveData.version || typeof saveData.version !== 'string') {
        errors.push('Invalid version');
      }

      if (!saveData.timestamp || typeof saveData.timestamp !== 'number') {
        errors.push('Invalid timestamp');
      }

      if (typeof saveData.playTime !== 'number' || saveData.playTime < 0) {
        errors.push('Invalid play time');
      }

      if (typeof saveData.round !== 'number' || saveData.round < 1) {
        errors.push('Invalid round number');
      }

      if (!saveData.checksum || typeof saveData.checksum !== 'string') {
        errors.push('Invalid checksum');
      }

      // 游戏状态验证
      const gameStateResult = this.validateGameState(saveData.gameState);
      errors.push(...gameStateResult.errors);
      warnings.push(...gameStateResult.warnings);

      // AI状态验证
      if (Array.isArray(saveData.aiStates)) {
        for (let i = 0; i < saveData.aiStates.length; i++) {
          const aiStateResult = this.validateAIState(saveData.aiStates[i]);
          errors.push(...aiStateResult.errors.map(err => `AI[${i}]: ${err}`));
          warnings.push(...aiStateResult.warnings.map(warn => `AI[${i}]: ${warn}`));
        }
      } else if (saveData.aiStates !== undefined) {
        errors.push('AI states must be an array');
      }

      // 校验和验证
      const checksumResult = await this.validateChecksum(saveData);
      if (!checksumResult.isValid) {
        errors.push('Checksum validation failed - data may be corrupted');
      }

      // 版本兼容性检查
      const versionResult = this.validateVersion(saveData.version);
      warnings.push(...versionResult.warnings);

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  validateGameConfig(config: GameConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 基本配置验证
      if (!config.playerName || typeof config.playerName !== 'string' || config.playerName.trim().length === 0) {
        errors.push('Player name is required');
      }

      if (!config.playerZodiac || typeof config.playerZodiac !== 'string') {
        errors.push('Player zodiac is required');
      }

      if (!config.difficulty || typeof config.difficulty !== 'string') {
        errors.push('Difficulty setting is required');
      }

      // AI对手验证
      if (!Array.isArray(config.aiOpponents)) {
        errors.push('AI opponents must be an array');
      } else {
        for (let i = 0; i < config.aiOpponents.length; i++) {
          const ai = config.aiOpponents[i];
          if (!ai.id || !ai.name || !ai.zodiac) {
            errors.push(`AI opponent[${i}] is missing required fields`);
          }
        }
      }

      // 游戏规则验证
      if (config.gameRules) {
        const rulesResult = this.validateGameRules(config.gameRules);
        errors.push(...rulesResult.errors);
        warnings.push(...rulesResult.warnings);
      } else {
        errors.push('Game rules are required');
      }

      // UI设置验证
      if (config.uiSettings) {
        const uiResult = this.validateUISettings(config.uiSettings);
        warnings.push(...uiResult.warnings);
      }

    } catch (error) {
      errors.push(`Config validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证游戏状态
   */
  private validateGameState(gameState: GameState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!gameState) {
        errors.push('Game state is required');
        return { isValid: false, errors, warnings };
      }

      // 基本字段验证
      if (!gameState.gameId || typeof gameState.gameId !== 'string') {
        errors.push('Invalid game ID');
      }

      if (!gameState.status || typeof gameState.status !== 'string') {
        errors.push('Invalid game status');
      }

      if (typeof gameState.round !== 'number' || gameState.round < 1) {
        errors.push('Invalid round number');
      }

      if (typeof gameState.turn !== 'number' || gameState.turn < 1) {
        errors.push('Invalid turn number');
      }

      if (typeof gameState.currentPlayerIndex !== 'number' || gameState.currentPlayerIndex < 0) {
        errors.push('Invalid current player index');
      }

      // 玩家数据验证
      if (!Array.isArray(gameState.players)) {
        errors.push('Players must be an array');
      } else {
        if (gameState.players.length === 0) {
          errors.push('At least one player is required');
        }

        if (gameState.currentPlayerIndex >= gameState.players.length) {
          errors.push('Current player index out of bounds');
        }

        for (let i = 0; i < gameState.players.length; i++) {
          const player = gameState.players[i];
          if (!player.id || !player.name || !player.zodiac) {
            errors.push(`Player[${i}] is missing required fields`);
          }

          if (typeof player.money !== 'number' || player.money < 0) {
            errors.push(`Player[${i}] has invalid money amount`);
          }

          if (typeof player.position !== 'number' || player.position < 0) {
            errors.push(`Player[${i}] has invalid position`);
          }
        }
      }

      // 棋盘验证
      if (!Array.isArray(gameState.board)) {
        errors.push('Board must be an array');
      } else {
        if (gameState.board.length !== 40) {
          warnings.push('Non-standard board size detected');
        }

        for (let i = 0; i < gameState.board.length; i++) {
          const cell = gameState.board[i];
          if (!cell.id || typeof cell.position !== 'number' || !cell.type) {
            errors.push(`Board cell[${i}] is missing required fields`);
          }
        }
      }

      // 事件历史验证
      if (!Array.isArray(gameState.eventHistory)) {
        errors.push('Event history must be an array');
      }

      // 时间戳验证
      if (typeof gameState.startTime !== 'number' || gameState.startTime <= 0) {
        warnings.push('Invalid start time');
      }

      if (typeof gameState.lastUpdateTime !== 'number' || gameState.lastUpdateTime <= 0) {
        warnings.push('Invalid last update time');
      }

    } catch (error) {
      errors.push(`Game state validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证AI状态
   */
  private validateAIState(aiState: AIState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!aiState) {
        errors.push('AI state is required');
        return { isValid: false, errors, warnings };
      }

      if (!aiState.id || typeof aiState.id !== 'string') {
        errors.push('AI ID is required');
      }

      if (!aiState.personality || typeof aiState.personality !== 'object') {
        warnings.push('AI personality data missing');
      }

      if (!aiState.currentStrategy || typeof aiState.currentStrategy !== 'object') {
        warnings.push('AI strategy data missing');
      }

      if (!aiState.emotionalState || typeof aiState.emotionalState !== 'object') {
        warnings.push('AI emotional state data missing');
      }

      if (!aiState.memory || typeof aiState.memory !== 'object') {
        warnings.push('AI memory data missing');
      }

      if (!aiState.learningData || typeof aiState.learningData !== 'object') {
        warnings.push('AI learning data missing');
      }

    } catch (error) {
      errors.push(`AI state validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证游戏规则
   */
  private validateGameRules(gameRules: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (typeof gameRules.startingMoney !== 'number' || gameRules.startingMoney <= 0) {
        errors.push('Invalid starting money amount');
      }

      if (typeof gameRules.passStartBonus !== 'number' || gameRules.passStartBonus < 0) {
        errors.push('Invalid pass start bonus');
      }

      if (typeof gameRules.maxRounds !== 'number' || gameRules.maxRounds <= 0) {
        warnings.push('Invalid max rounds setting');
      }

      if (!gameRules.winCondition || typeof gameRules.winCondition !== 'string') {
        warnings.push('Win condition not specified');
      }

    } catch (error) {
      errors.push(`Game rules validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证UI设置
   */
  private validateUISettings(uiSettings: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (typeof uiSettings.soundEnabled !== 'boolean') {
        warnings.push('Sound setting should be boolean');
      }

      if (typeof uiSettings.musicEnabled !== 'boolean') {
        warnings.push('Music setting should be boolean');
      }

      if (typeof uiSettings.autoSaveEnabled !== 'boolean') {
        warnings.push('Auto save setting should be boolean');
      }

      if (typeof uiSettings.autoSaveInterval !== 'number' || uiSettings.autoSaveInterval < 60000) {
        warnings.push('Auto save interval should be at least 1 minute');
      }

    } catch (error) {
      warnings.push(`UI settings validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证校验和
   */
  private async validateChecksum(saveData: SaveData): Promise<ValidationResult> {
    try {
      // 创建数据副本，排除checksum字段
      const dataForChecksum = { ...saveData };
      delete (dataForChecksum as any).checksum;

      // 计算校验和
      const serialized = JSON.stringify(dataForChecksum, Object.keys(dataForChecksum).sort());
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(serialized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedChecksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const isValid = calculatedChecksum === saveData.checksum;

      return {
        isValid,
        errors: isValid ? [] : ['Checksum mismatch'],
        warnings: []
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Checksum validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * 验证版本兼容性
   */
  private validateVersion(version: string): ValidationResult {
    const warnings: string[] = [];

    try {
      const currentVersion = '1.0.0';
      const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
      const [saveMajor, saveMinor] = version.split('.').map(Number);

      if (saveMajor > currentMajor) {
        warnings.push('Save was created with a newer version - compatibility not guaranteed');
      } else if (saveMajor < currentMajor) {
        warnings.push('Save was created with an older major version - migration may be required');
      } else if (saveMinor > currentMinor) {
        warnings.push('Save was created with a newer minor version');
      }

    } catch (error) {
      warnings.push('Unable to validate version compatibility');
    }

    return {
      isValid: true,
      errors: [],
      warnings
    };
  }
}