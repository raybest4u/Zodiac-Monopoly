/**
 * 统一状态管理器
 * 解决GameEngine和UI组件之间的状态同步问题
 */

import { EventEmitter } from 'events';
import { UnifiedGameState, createEmptyGameState, validateGameState, getCurrentPlayer } from '../types/gameState';
import { Player } from '../types/player';
import { GamePhase, GameStatus, PlayerId } from '../types/core';

/**
 * 状态变化事件
 */
export interface StateChangeEvent {
  readonly type: 'phase' | 'status' | 'player' | 'board' | 'round' | 'full';
  readonly previousState: Partial<UnifiedGameState>;
  readonly newState: Partial<UnifiedGameState>;
  readonly timestamp: number;
  readonly triggeredBy?: string;
}

/**
 * 状态更新选项
 */
export interface StateUpdateOptions {
  readonly silent?: boolean;      // 是否静默更新（不触发事件）
  readonly validate?: boolean;    // 是否验证状态
  readonly merge?: boolean;       // 是否合并更新
  readonly source?: string;       // 更新来源
}

/**
 * 统一状态管理器
 * 负责管理游戏状态的读写、验证和同步
 */
export class StateManager extends EventEmitter {
  private gameState: UnifiedGameState;
  private stateHistory: UnifiedGameState[] = [];
  private maxHistorySize = 100;
  private updateQueue: StateUpdate[] = [];
  private isProcessingUpdates = false;

  constructor(gameId: string) {
    super();
    this.gameState = createEmptyGameState(gameId);
  }

  // ===== 状态读取 =====

  /**
   * 获取完整游戏状态（只读）
   */
  getGameState(): Readonly<UnifiedGameState> {
    return { ...this.gameState };
  }

  /**
   * 获取当前游戏阶段
   */
  getCurrentPhase(): GamePhase {
    return this.gameState.phase;
  }

  /**
   * 获取当前游戏状态
   */
  getCurrentStatus(): GameStatus {
    return this.gameState.status;
  }

  /**
   * 获取当前玩家
   */
  getCurrentPlayer(): Player | null {
    return getCurrentPlayer(this.gameState);
  }

  /**
   * 获取指定玩家
   */
  getPlayer(playerId: PlayerId): Player | null {
    return this.gameState.players.find(p => p.id === playerId) || null;
  }

  /**
   * 获取所有玩家
   */
  getAllPlayers(): readonly Player[] {
    return [...this.gameState.players];
  }

  /**
   * 获取游戏回合数
   */
  getCurrentRound(): number {
    return this.gameState.round;
  }

  /**
   * 检查游戏是否已初始化
   */
  isInitialized(): boolean {
    return this.gameState.isInitialized;
  }

  /**
   * 检查游戏是否暂停
   */
  isPaused(): boolean {
    return this.gameState.isPaused;
  }

  /**
   * 检查游戏是否结束
   */
  isGameOver(): boolean {
    return this.gameState.status === 'game_over' || !!this.gameState.winner;
  }

  // ===== 状态更新 =====

  /**
   * 更新游戏阶段
   */
  setPhase(newPhase: GamePhase, options: StateUpdateOptions = {}): void {
    this.updateState({ phase: newPhase }, { ...options, type: 'phase' });
  }

  /**
   * 更新游戏状态
   */
  setStatus(newStatus: GameStatus, options: StateUpdateOptions = {}): void {
    this.updateState({ status: newStatus }, { ...options, type: 'status' });
  }

  /**
   * 更新当前玩家索引
   */
  setCurrentPlayerIndex(index: number, options: StateUpdateOptions = {}): void {
    if (index >= 0 && index < this.gameState.players.length) {
      this.updateState({ currentPlayerIndex: index }, { ...options, type: 'player' });
    }
  }

  /**
   * 切换到下一个玩家
   */
  nextPlayer(options: StateUpdateOptions = {}): void {
    const nextIndex = (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length;
    this.setCurrentPlayerIndex(nextIndex, options);
  }

  /**
   * 更新回合数
   */
  incrementRound(options: StateUpdateOptions = {}): void {
    this.updateState({ 
      round: this.gameState.round + 1,
      lastUpdateTime: Date.now()
    }, { ...options, type: 'round' });
  }

  /**
   * 更新玩家数据
   */
  updatePlayer(playerId: PlayerId, updates: Partial<Player>, options: StateUpdateOptions = {}): void {
    const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const updatedPlayers = [...this.gameState.players];
    updatedPlayers[playerIndex] = { ...updatedPlayers[playerIndex], ...updates };

    this.updateState({ 
      players: updatedPlayers,
      lastUpdateTime: Date.now()
    }, { ...options, type: 'player' });
  }

  /**
   * 设置游戏初始化状态
   */
  setInitialized(initialized: boolean, options: StateUpdateOptions = {}): void {
    this.updateState({ 
      isInitialized: initialized,
      lastUpdateTime: Date.now()
    }, options);
  }

  /**
   * 设置暂停状态
   */
  setPaused(paused: boolean, options: StateUpdateOptions = {}): void {
    this.updateState({ 
      isPaused: paused,
      lastUpdateTime: Date.now()
    }, options);
  }

  /**
   * 通用状态更新方法
   */
  updateState(updates: Partial<UnifiedGameState>, options: StateUpdateOptions & { type?: string } = {}): void {
    const updateItem: StateUpdate = {
      updates,
      options,
      timestamp: Date.now()
    };

    this.updateQueue.push(updateItem);
    this.processUpdateQueue();
  }

  // ===== 状态历史管理 =====

  /**
   * 保存当前状态到历史
   */
  private saveToHistory(): void {
    this.stateHistory.push({ ...this.gameState });
    
    // 限制历史记录大小
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * 获取状态历史
   */
  getStateHistory(): readonly UnifiedGameState[] {
    return [...this.stateHistory];
  }

  /**
   * 回滚到上一个状态
   */
  rollback(): boolean {
    if (this.stateHistory.length === 0) return false;
    
    const previousState = this.stateHistory.pop()!;
    this.gameState = previousState;
    
    this.emit('state:rollback', {
      type: 'rollback',
      newState: this.gameState,
      timestamp: Date.now()
    });

    return true;
  }

  // ===== 内部更新处理 =====

  /**
   * 处理更新队列
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessingUpdates || this.updateQueue.length === 0) return;

    this.isProcessingUpdates = true;

    try {
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift()!;
        await this.applyUpdate(update);
      }
    } finally {
      this.isProcessingUpdates = false;
    }
  }

  /**
   * 应用单个状态更新
   */
  private async applyUpdate(update: StateUpdate): Promise<void> {
    const previousState = { ...this.gameState };
    
    // 保存到历史（在更新前）
    this.saveToHistory();

    // 应用更新
    if (update.options.merge !== false) {
      this.gameState = { ...this.gameState, ...update.updates };
    } else {
      Object.assign(this.gameState, update.updates);
    }

    // 验证状态（如果需要）
    if (update.options.validate !== false) {
      if (!validateGameState(this.gameState)) {
        console.error('State validation failed, rolling back');
        this.gameState = previousState;
        this.stateHistory.pop(); // 移除无效的历史记录
        return;
      }
    }

    // 触发事件（如果不是静默更新）
    if (!update.options.silent) {
      const changeEvent: StateChangeEvent = {
        type: (update.options as any).type || 'full',
        previousState,
        newState: this.gameState,
        timestamp: update.timestamp,
        triggeredBy: update.options.source
      };

      this.emit('state:changed', changeEvent);
      
      // 触发特定类型的事件
      if ((update.options as any).type) {
        this.emit(`state:${(update.options as any).type}`, changeEvent);
      }
    }
  }

  // ===== 状态重置和清理 =====

  /**
   * 重置游戏状态
   */
  resetState(gameId?: string): void {
    const newGameId = gameId || this.gameState.gameId;
    this.gameState = createEmptyGameState(newGameId);
    this.stateHistory = [];
    this.updateQueue = [];
    
    this.emit('state:reset', {
      type: 'reset',
      newState: this.gameState,
      timestamp: Date.now()
    });
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.removeAllListeners();
    this.stateHistory = [];
    this.updateQueue = [];
    this.isProcessingUpdates = false;
  }

  // ===== 调试和工具方法 =====

  /**
   * 获取状态摘要（用于调试）
   */
  getStateSummary(): StateSummary {
    const currentPlayer = this.getCurrentPlayer();
    
    return {
      gameId: this.gameState.gameId,
      status: this.gameState.status,
      phase: this.gameState.phase,
      round: this.gameState.round,
      currentPlayer: currentPlayer ? {
        id: currentPlayer.id,
        name: currentPlayer.name,
        position: currentPlayer.position,
        money: currentPlayer.money
      } : null,
      playerCount: this.gameState.players.length,
      isInitialized: this.gameState.isInitialized,
      isPaused: this.gameState.isPaused,
      lastUpdate: this.gameState.lastUpdateTime
    };
  }

  /**
   * 验证状态完整性
   */
  validateCurrentState(): ValidationResult {
    const isValid = validateGameState(this.gameState);
    const errors: string[] = [];

    if (!isValid) {
      if (!this.gameState.gameId) errors.push('Missing game ID');
      if (!this.gameState.players || this.gameState.players.length === 0) errors.push('No players');
      if (this.gameState.currentPlayerIndex < 0 || this.gameState.currentPlayerIndex >= this.gameState.players.length) {
        errors.push('Invalid current player index');
      }
      if (this.gameState.round < 1) errors.push('Invalid round number');
    }

    return { isValid, errors };
  }
}

// ===== 辅助类型 =====

interface StateUpdate {
  readonly updates: Partial<UnifiedGameState>;
  readonly options: StateUpdateOptions;
  readonly timestamp: number;
}

interface StateSummary {
  readonly gameId: string;
  readonly status: GameStatus;
  readonly phase: GamePhase;
  readonly round: number;
  readonly currentPlayer: {
    readonly id: string;
    readonly name: string;
    readonly position: number;
    readonly money: number;
  } | null;
  readonly playerCount: number;
  readonly isInitialized: boolean;
  readonly isPaused: boolean;
  readonly lastUpdate: number;
}

interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
}

// ===== 默认导出 =====

export default StateManager;