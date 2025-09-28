import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { GameConfig } from '../types/storage';
import type { Player, GameEvent } from '../types/game';

interface DebugGameLoopProps {
  gameConfig: GameConfig;
  onGameEvent?: (event: GameEvent) => void;
  onGameStateChange?: (gameState: any) => void;
  onGameEnd?: (result: any) => void;
  onPlayerAction?: (action: any) => void;
  onUIInteraction?: (type: string, data: any) => void;
}

interface GameLoopState {
  isInitialized: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentPlayer: Player | null;
  gamePhase: string;
  round: number;
  players: Player[];
  error: string | null;
  gameResult: any | null;
}

export const DebugGameLoop: React.FC<DebugGameLoopProps> = ({
  gameConfig,
  onGameEvent,
  onGameStateChange,
  onGameEnd,
  onPlayerAction,
  onUIInteraction
}) => {
  // 游戏引擎引用
  const gameEngineRef = useRef<GameEngine | null>(null);

  // 组件状态
  const [gameState, setGameState] = useState<GameLoopState>({
    isInitialized: false,
    isLoading: false,
    isPlaying: false,
    isPaused: false,
    currentPlayer: null,
    gamePhase: 'waiting',
    round: 1,
    players: [],
    error: null,
    gameResult: null
  });

  // 简单的通知函数
  const addNotification = useCallback((message: string, type: string) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  /**
   * 简单的游戏引擎初始化
   */
  const initializeGameEngine = useCallback(async () => {
    if (gameEngineRef.current) return;

    try {
      console.log('开始初始化游戏引擎...');
      setGameState(prev => ({ ...prev, isLoading: true, error: null }));

      // 创建游戏引擎
      const gameEngine = new GameEngine();
      gameEngineRef.current = gameEngine;

      console.log('游戏引擎创建成功');

      // 简单的事件监听
      gameEngine.on('game:initialized', (gameEngineState) => {
        console.log('游戏初始化完成');
        addNotification('游戏初始化完成', 'success');
      });

      // 初始化游戏
      await gameEngine.initialize(gameConfig);

      setGameState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        players: []
      }));

      console.log('游戏引擎初始化完成');

    } catch (error) {
      console.error('游戏初始化失败:', error);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: `游戏初始化失败: ${error instanceof Error ? error.message : '未知错误'}`
      }));
    }
  }, [gameConfig, addNotification]);

  // 组件挂载时初始化
  useEffect(() => {
    console.log('DebugGameLoop 组件挂载，开始初始化...');
    initializeGameEngine();

    return () => {
      console.log('DebugGameLoop 组件卸载，清理资源...');
      if (gameEngineRef.current) {
        // 简单清理
        gameEngineRef.current = null;
      }
    };
  }, [initializeGameEngine]);

  if (gameState.error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#fee',
        color: '#c33',
        minHeight: '100vh'
      }}>
        <h1>❌ 游戏初始化错误</h1>
        <p>{gameState.error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          重新加载页面
        </button>
      </div>
    );
  }

  if (gameState.isLoading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <h1>⏳ 正在初始化游戏...</h1>
        <p>请稍候，游戏引擎正在启动...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: '#f8f9fa',
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1>🎲 调试版游戏界面</h1>
      <h2>游戏引擎已初始化: {gameState.isInitialized ? '✅' : '❌'}</h2>
      
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '20px 0',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'left'
      }}>
        <h3>游戏状态</h3>
        <p><strong>初始化状态:</strong> {gameState.isInitialized ? '已初始化' : '未初始化'}</p>
        <p><strong>游戏阶段:</strong> {gameState.gamePhase}</p>
        <p><strong>当前回合:</strong> {gameState.round}</p>
        <p><strong>玩家数量:</strong> {gameState.players.length}</p>
        
        <h4>游戏配置</h4>
        <p><strong>玩家:</strong> {gameConfig.playerName} ({gameConfig.playerZodiac})</p>
        <p><strong>AI对手:</strong> {gameConfig.aiOpponents?.length || 0} 位</p>
        <p><strong>起始资金:</strong> {gameConfig.gameSettings?.startingMoney || 1500}</p>
        
        <h4>调试信息</h4>
        <p><strong>游戏引擎:</strong> {gameEngineRef.current ? '已创建' : '未创建'}</p>
        <p><strong>时间:</strong> {new Date().toLocaleTimeString()}</p>
      </div>
      
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        这是调试版本，用于检查游戏引擎初始化是否正常
      </p>
    </div>
  );
};