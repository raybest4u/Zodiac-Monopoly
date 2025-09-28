/**
 * 统一游戏状态Hook
 * 解决UI组件和GameEngine之间的状态同步问题
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { StateManager } from '../core/StateManager';
import { GameEngineAdapter } from '../core/GameEngineAdapter';
import { UnifiedGameState } from '../types/gameState';
import { Player } from '../types/player';
import { GamePhase, GameStatus, PlayerId } from '../types/core';

/**
 * UI层游戏状态接口 - 统一字段命名
 */
export interface UIGameState {
  // 基础状态
  isInitialized: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  
  // 游戏信息
  gameId: string;
  status: GameStatus;          // 游戏整体状态
  phase: GamePhase;            // 当前回合阶段（统一使用phase，不再使用gamePhase）
  round: number;
  
  // 玩家信息
  currentPlayer: Player | null;
  currentPlayerIndex: number;
  players: Player[];
  
  // 错误和结果
  error: string | null;
  gameResult: any | null;
  winner?: PlayerId;
  
  // 临时状态
  diceResult?: {
    dice1: number;
    dice2: number;
    total: number;
    isDouble: boolean;
  };
  
  // 通知
  notifications: GameNotification[];
}

export interface GameNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
  autoHide?: boolean;
}

/**
 * 游戏状态Hook配置
 */
export interface UseGameStateConfig {
  gameId: string;
  onStateChange?: (state: UIGameState) => void;
  onError?: (error: string) => void;
  onGameEnd?: (result: any) => void;
}

/**
 * 游戏状态Hook返回值
 */
export interface UseGameStateReturn {
  // 状态
  gameState: UIGameState;
  
  // 状态更新方法
  setPhase: (phase: GamePhase) => void;
  setStatus: (status: GameStatus) => void;
  setCurrentPlayer: (index: number) => void;
  nextPlayer: () => void;
  incrementRound: () => void;
  updatePlayer: (playerId: PlayerId, updates: Partial<Player>) => void;
  setPaused: (paused: boolean) => void;
  
  // 通知管理
  addNotification: (message: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // 错误处理
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // 工具方法
  getStateManager: () => StateManager;
  getCurrentPlayer: () => Player | null;
  getPlayer: (playerId: PlayerId) => Player | null;
  
  // 状态验证
  isValidState: () => boolean;
  validateState: () => { isValid: boolean; errors: string[] };
}

/**
 * 统一游戏状态Hook
 */
export function useGameState(config: UseGameStateConfig): UseGameStateReturn {
  const { gameId, onStateChange, onError, onGameEnd } = config;
  
  // StateManager实例
  const stateManagerRef = useRef<StateManager | null>(null);
  const adapterRef = useRef<GameEngineAdapter | null>(null);
  
  // 初始UI状态
  const [uiState, setUIState] = useState<UIGameState>({
    isInitialized: false,
    isLoading: false,
    isPlaying: false,
    isPaused: false,
    
    gameId,
    status: 'waiting',
    phase: 'roll_dice',
    round: 1,
    
    currentPlayer: null,
    currentPlayerIndex: 0,
    players: [],
    
    error: null,
    gameResult: null,
    
    notifications: []
  });

  // 初始化StateManager
  useEffect(() => {
    if (!stateManagerRef.current) {
      stateManagerRef.current = new StateManager(gameId);
      adapterRef.current = new GameEngineAdapter(gameId);
      
      // 设置状态变化监听器
      stateManagerRef.current.on('state:changed', handleStateChange);
      stateManagerRef.current.on('state:phase', handlePhaseChange);
      stateManagerRef.current.on('state:player', handlePlayerChange);
      stateManagerRef.current.on('state:error', handleStateError);
    }

    return () => {
      if (stateManagerRef.current) {
        stateManagerRef.current.destroy();
        stateManagerRef.current = null;
      }
      if (adapterRef.current) {
        adapterRef.current.destroy();
        adapterRef.current = null;
      }
    };
  }, [gameId]);

  // 状态变化处理器
  const handleStateChange = useCallback((changeEvent: any) => {
    const unifiedState = changeEvent.newState as UnifiedGameState;
    
    const newUIState: UIGameState = {
      isInitialized: unifiedState.isInitialized,
      isLoading: false,
      isPlaying: unifiedState.status === 'playing',
      isPaused: unifiedState.isPaused,
      
      gameId: unifiedState.gameId,
      status: unifiedState.status,
      phase: unifiedState.phase,  // 统一使用phase字段
      round: unifiedState.round,
      
      currentPlayer: unifiedState.players[unifiedState.currentPlayerIndex] || null,
      currentPlayerIndex: unifiedState.currentPlayerIndex,
      players: [...unifiedState.players],
      
      error: null,
      gameResult: unifiedState.gameResult,
      winner: unifiedState.winner,
      
      diceResult: unifiedState.diceResult,
      
      notifications: [...unifiedState.notifications]
    };

    setUIState(newUIState);
    
    // 触发外部状态变化回调
    if (onStateChange) {
      onStateChange(newUIState);
    }

    // 检查游戏结束
    if (unifiedState.status === 'game_over' && onGameEnd) {
      onGameEnd(unifiedState.gameResult);
    }
  }, [onStateChange, onGameEnd]);

  // 阶段变化处理器
  const handlePhaseChange = useCallback((changeEvent: any) => {
    console.log(`Phase changed: ${changeEvent.previousState.phase} -> ${changeEvent.newState.phase}`);
  }, []);

  // 玩家变化处理器
  const handlePlayerChange = useCallback((changeEvent: any) => {
    const currentPlayer = changeEvent.newState.players?.[changeEvent.newState.currentPlayerIndex];
    console.log(`Player changed: ${currentPlayer?.name} (${currentPlayer?.id})`);
  }, []);

  // 状态错误处理器
  const handleStateError = useCallback((error: any) => {
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown state error';
    setUIState(prev => ({ ...prev, error: errorMessage }));
    
    if (onError) {
      onError(errorMessage);
    }
  }, [onError]);

  // 状态更新方法
  const setPhase = useCallback((phase: GamePhase) => {
    stateManagerRef.current?.setPhase(phase, { source: 'ui_hook' });
  }, []);

  const setStatus = useCallback((status: GameStatus) => {
    stateManagerRef.current?.setStatus(status, { source: 'ui_hook' });
  }, []);

  const setCurrentPlayer = useCallback((index: number) => {
    stateManagerRef.current?.setCurrentPlayerIndex(index, { source: 'ui_hook' });
  }, []);

  const nextPlayer = useCallback(() => {
    stateManagerRef.current?.nextPlayer({ source: 'ui_hook' });
  }, []);

  const incrementRound = useCallback(() => {
    stateManagerRef.current?.incrementRound({ source: 'ui_hook' });
  }, []);

  const updatePlayer = useCallback((playerId: PlayerId, updates: Partial<Player>) => {
    stateManagerRef.current?.updatePlayer(playerId, updates, { source: 'ui_hook' });
  }, []);

  const setPaused = useCallback((paused: boolean) => {
    stateManagerRef.current?.setPaused(paused, { source: 'ui_hook' });
  }, []);

  // 通知管理
  const addNotification = useCallback((message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    const notification: GameNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      autoHide: type === 'info' || type === 'success'
    };

    setUIState(prev => ({
      ...prev,
      notifications: [...prev.notifications, notification]
    }));

    // 自动隐藏通知
    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 3000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setUIState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      notifications: []
    }));
  }, []);

  // 错误处理
  const setError = useCallback((error: string | null) => {
    setUIState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setUIState(prev => ({ ...prev, error: null }));
  }, []);

  // 工具方法
  const getStateManager = useCallback(() => {
    if (!stateManagerRef.current) {
      throw new Error('StateManager not initialized');
    }
    return stateManagerRef.current;
  }, []);

  const getCurrentPlayer = useCallback(() => {
    return stateManagerRef.current?.getCurrentPlayer() || null;
  }, []);

  const getPlayer = useCallback((playerId: PlayerId) => {
    return stateManagerRef.current?.getPlayer(playerId) || null;
  }, []);

  // 状态验证
  const isValidState = useCallback(() => {
    return stateManagerRef.current?.validateCurrentState().isValid || false;
  }, []);

  const validateState = useCallback(() => {
    return stateManagerRef.current?.validateCurrentState() || { isValid: false, errors: ['StateManager not initialized'] };
  }, []);

  return {
    gameState: uiState,
    
    setPhase,
    setStatus,
    setCurrentPlayer,
    nextPlayer,
    incrementRound,
    updatePlayer,
    setPaused,
    
    addNotification,
    removeNotification,
    clearNotifications,
    
    setError,
    clearError,
    
    getStateManager,
    getCurrentPlayer,
    getPlayer,
    
    isValidState,
    validateState
  };
}

// 导出类型
export type { UIGameState, GameNotification, UseGameStateConfig, UseGameStateReturn };