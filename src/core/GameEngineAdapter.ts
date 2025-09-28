/**
 * GameEngine适配器
 * 提供向后兼容性，同时逐步迁移到新的状态管理系统
 */

import { StateManager } from './StateManager';
import { UnifiedGameState } from '../types/gameState';
import { Player } from '../types/player';
import { GamePhase, GameStatus, PlayerId } from '../types/core';

// 导入旧的类型定义（为了兼容性）
import type { GameState as LegacyGameState, Player as LegacyPlayer } from '../types/game';

/**
 * 状态适配器 - 在新旧状态格式之间转换
 */
export class StateAdapter {
  /**
   * 将新状态转换为旧状态格式（向后兼容）
   */
  static toLegacyState(newState: UnifiedGameState): LegacyGameState {
    return {
      // 基础信息
      gameId: newState.gameId,
      status: this.mapNewStatusToLegacy(newState.status),
      mode: newState.mode,
      
      // 玩家信息
      players: newState.players.map(this.toLegacyPlayer),
      currentPlayerIndex: newState.currentPlayerIndex,
      
      // 游戏进度
      round: newState.round,
      phase: newState.phase,
      
      // 板块
      board: newState.board.map(cell => ({
        position: cell.position,
        type: cell.type,
        name: cell.name,
        price: cell.price,
        rent: cell.rent,
        level: cell.level || 0,
        owner: cell.owner,
        description: cell.description
      })),
      
      // 时间
      startTime: newState.startTime,
      lastUpdateTime: newState.lastUpdateTime,
      
      // 历史和设置
      gameHistory: newState.gameHistory,
      gameSettings: newState.settings,
      
      // 其他
      isInitialized: newState.isInitialized,
      diceResult: newState.diceResult,
      
      // 默认值
      winner: newState.winner,
      gameResult: newState.gameResult
    } as LegacyGameState;
  }

  /**
   * 将旧状态转换为新状态格式
   */
  static fromLegacyState(legacyState: LegacyGameState, gameId: string): UnifiedGameState {
    return {
      // 基础游戏信息
      gameId: legacyState.gameId || gameId,
      status: this.mapLegacyStatusToNew(legacyState.status),
      phase: legacyState.phase,
      mode: legacyState.mode,
      difficulty: 'normal', // 默认值
      
      // 时间和回合
      round: legacyState.round,
      currentPlayerIndex: legacyState.currentPlayerIndex,
      startTime: legacyState.startTime,
      lastUpdateTime: legacyState.lastUpdateTime,
      
      // 玩家和板块
      players: legacyState.players.map(this.fromLegacyPlayer),
      board: legacyState.board?.map(cell => ({
        position: cell.position,
        type: cell.type,
        name: cell.name,
        description: cell.description,
        price: cell.price,
        rent: cell.rent,
        level: cell.level,
        owner: cell.owner
      })) || [],
      
      // 游戏历史和事件
      gameHistory: legacyState.gameHistory || [],
      activeEvents: [],
      eventQueue: [],
      
      // 游戏设置
      settings: legacyState.gameSettings || {
        mode: 'classic',
        difficulty: 'normal',
        startingMoney: 1500,
        winConditions: ['elimination'],
        specialRules: [],
        boardConfig: {
          size: 40,
          layout: 'classic',
          specialCells: [],
          startingPosition: 0
        }
      },
      
      // 环境状态
      season: '春',
      weather: '晴',
      seasonRound: 1,
      
      // 游戏流控制
      isPaused: false,
      isInitialized: legacyState.isInitialized || false,
      lastAction: undefined,
      
      // 胜利条件和结果
      winner: legacyState.winner,
      gameResult: legacyState.gameResult,
      
      // 临时状态
      diceResult: legacyState.diceResult,
      pendingAction: undefined,
      notifications: []
    };
  }

  /**
   * 转换玩家对象到新格式
   */
  private static fromLegacyPlayer(legacyPlayer: LegacyPlayer): Player {
    return {
      // 基础信息
      id: legacyPlayer.id,
      name: legacyPlayer.name,
      zodiac: legacyPlayer.zodiac,
      isHuman: legacyPlayer.isHuman,
      avatar: legacyPlayer.avatar,
      
      // 游戏状态
      position: legacyPlayer.position,
      money: legacyPlayer.money,
      
      // 地产系统 - 处理类型不一致问题
      properties: this.normalizeProperties(legacyPlayer.properties),
      
      // 物品和技能
      items: legacyPlayer.items || [],
      skills: legacyPlayer.skills || [],
      statusEffects: legacyPlayer.statusEffects || [],
      
      // 统计数据
      statistics: legacyPlayer.statistics || {
        turnsPlayed: 0,
        moneyEarned: 0,
        moneySpent: 0,
        propertiesBought: 0,
        propertiesSold: 0,
        rentPaid: 0,
        rentReceived: 0,
        skillsUsed: 0,
        eventsTriggered: 0
      },
      
      // 游戏状态
      isInJail: legacyPlayer.isInJail || false,
      jailTurns: legacyPlayer.jailTurns || 0,
      consecutiveDoubles: legacyPlayer.consecutiveDoubles || 0,
      
      // 临时状态
      hasRolledThisTurn: false,
      hasMovedThisTurn: false,
      canUseSkills: true,
      
      // AI相关
      aiPersonality: undefined,
      aiStrategy: undefined
    };
  }

  /**
   * 转换玩家对象到旧格式
   */
  private static toLegacyPlayer(newPlayer: Player): LegacyPlayer {
    return {
      id: newPlayer.id,
      name: newPlayer.name,
      zodiac: newPlayer.zodiac,
      isHuman: newPlayer.isHuman,
      avatar: newPlayer.avatar,
      
      position: newPlayer.position,
      money: newPlayer.money,
      
      // 转换properties回旧格式
      properties: newPlayer.properties.map(prop => ({
        position: prop.propertyPosition,
        price: prop.purchasePrice,
        level: 1, // 默认值
        rent: 0   // 默认值
      })),
      
      items: newPlayer.items,
      skills: newPlayer.skills,
      statusEffects: newPlayer.statusEffects,
      statistics: newPlayer.statistics,
      
      isInJail: newPlayer.isInJail,
      jailTurns: newPlayer.jailTurns,
      consecutiveDoubles: newPlayer.consecutiveDoubles
    } as LegacyPlayer;
  }

  /**
   * 标准化properties字段 - 解决类型不一致问题
   */
  private static normalizeProperties(properties: any): any[] {
    if (!properties) return [];
    
    if (Array.isArray(properties)) {
      // 处理两种可能的格式
      return properties.map((prop, index) => {
        if (typeof prop === 'string') {
          // 如果是字符串，转换为PropertyOwnership格式
          return {
            propertyPosition: parseInt(prop) || index,
            ownerId: '', // 这里需要从上下文获取
            purchasePrice: 0,
            purchaseRound: 1
          };
        } else if (typeof prop === 'object' && prop !== null) {
          // 如果是对象，检查是否已经是正确格式
          if ('propertyPosition' in prop) {
            return prop; // 已经是新格式
          } else if ('position' in prop) {
            // 转换旧格式
            return {
              propertyPosition: prop.position,
              ownerId: '', // 这里需要从上下文获取
              purchasePrice: prop.price || 0,
              purchaseRound: 1
            };
          }
        }
        
        // 兜底情况
        return {
          propertyPosition: index,
          ownerId: '',
          purchasePrice: 0,
          purchaseRound: 1
        };
      });
    }
    
    return [];
  }

  /**
   * 映射新状态到旧状态
   */
  private static mapNewStatusToLegacy(newStatus: GameStatus): string {
    const statusMap: Record<GameStatus, string> = {
      'waiting': 'waiting',
      'initializing': 'initializing',
      'playing': 'playing',
      'paused': 'paused',
      'game_over': 'game_over',
      'error': 'error'
    };
    
    return statusMap[newStatus] || 'waiting';
  }

  /**
   * 映射旧状态到新状态
   */
  private static mapLegacyStatusToNew(legacyStatus: string): GameStatus {
    const statusMap: Record<string, GameStatus> = {
      'waiting': 'waiting',
      'initializing': 'initializing',
      'playing': 'playing',
      'paused': 'paused',
      'game_over': 'game_over',
      'error': 'error'
    };
    
    return statusMap[legacyStatus] || 'waiting';
  }
}

/**
 * GameEngine适配器 - 包装StateManager以提供旧API
 */
export class GameEngineAdapter {
  private stateManager: StateManager;

  constructor(gameId: string) {
    this.stateManager = new StateManager(gameId);
  }

  /**
   * 获取游戏状态（旧格式）
   */
  getGameState(): LegacyGameState | null {
    try {
      const newState = this.stateManager.getGameState();
      return StateAdapter.toLegacyState(newState);
    } catch (error) {
      console.error('Error adapting game state:', error);
      return null;
    }
  }

  /**
   * 设置游戏状态（从旧格式）
   */
  setGameState(legacyState: LegacyGameState): void {
    try {
      const newState = StateAdapter.fromLegacyState(legacyState, legacyState.gameId);
      // 这里需要完整替换状态，而不是更新
      this.stateManager.updateState(newState, { validate: true, source: 'legacy_adapter' });
    } catch (error) {
      console.error('Error setting legacy game state:', error);
    }
  }

  /**
   * 获取StateManager实例
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }

  /**
   * 同步状态变化事件
   */
  onStateChange(callback: (legacyState: LegacyGameState) => void): void {
    this.stateManager.on('state:changed', (changeEvent) => {
      try {
        const legacyState = StateAdapter.toLegacyState(changeEvent.newState as UnifiedGameState);
        callback(legacyState);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * 获取当前玩家（旧格式）
   */
  getCurrentPlayer(): LegacyPlayer | null {
    const player = this.stateManager.getCurrentPlayer();
    if (!player) return null;
    
    return StateAdapter['toLegacyPlayer'](player);
  }

  /**
   * 更新游戏阶段
   */
  setPhase(phase: GamePhase): void {
    this.stateManager.setPhase(phase, { source: 'engine_adapter' });
  }

  /**
   * 更新玩家
   */
  updatePlayer(playerId: PlayerId, updates: Partial<LegacyPlayer>): void {
    // 转换更新到新格式
    const newUpdates: Partial<Player> = {
      ...updates,
      properties: updates.properties ? StateAdapter['normalizeProperties'](updates.properties) : undefined
    };
    
    this.stateManager.updatePlayer(playerId, newUpdates, { source: 'engine_adapter' });
  }

  /**
   * 销毁适配器
   */
  destroy(): void {
    this.stateManager.destroy();
  }
}