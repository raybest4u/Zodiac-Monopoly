/**
 * 游戏循环集成组件 - 连接UI和游戏引擎
 * 包含完整的游戏功能和优化的布局
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { GameConfig } from '../types/storage';
import type { Player, GameEvent } from '../types/game';

// 组件Props类型
interface GameLoopProps {
  gameConfig?: GameConfig;
  onGameEvent?: (event: GameEvent) => void;
  onGameStateChange?: (gameState: any) => void;
  onGameEnd?: (result: any) => void;
  onPlayerAction?: (action: any) => void;
  onUIInteraction?: (type: string, data: any) => void;
}

// 游戏状态类型
interface GameLoopState {
  isInitialized: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentPlayer: Player | null;
  gamePhase: string;
  round: number;
  players: Player[];
  board?: any[];  // 添加棋盘属性
  error: string | null;
  gameResult: any | null;
}

/**
 * 游戏循环集成组件
 */
export const GameLoop: React.FC<GameLoopProps> = ({
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

  // UI状态
  const [uiState, setUiState] = useState({
    showPlayerDetails: false,
    selectedPlayerId: null as string | null,
    showGameMenu: false,
    showSettings: false,
    notifications: [] as Array<{ id: string; message: string; type: string }>,
    showNegotiateModal: false,
    negotiateTarget: null as any,
    negotiateProperty: null as any,
    aiProcessing: false
  });

  // 视觉效果状态
  const [visualEffects, setVisualEffects] = useState({
    diceRoll: {
      showResult: false,
      result: null as any
    },
    playerMove: {
      isAnimating: false,
      fromPosition: 0,
      toPosition: 0
    },
    moneyChange: {
      show: false,
      amount: 0,
      type: 'gain' as 'gain' | 'loss'
    }
  });

  // 初始化游戏引擎
  const initializeGameEngine = useCallback(async () => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true, error: null }));

      // 创建游戏引擎
      console.log('🏗️ 创建新的 GameEngine 实例');
      const gameEngine = new GameEngine();
      gameEngineRef.current = gameEngine;

      // 设置事件监听器
      gameEngine.on('game:initialized', (gameEngineState) => {
        console.log('Game initialized:', gameEngineState);
        setGameState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          players: gameEngineState.players || [],
          board: gameEngineState.board || [],
          round: gameEngineState.round || 1,
          gamePhase: gameEngineState.phase || 'roll_dice',
          currentPlayer: gameEngineState.players?.[gameEngineState.currentPlayerIndex] || null
        }));
        addNotification('游戏初始化完成', 'success');
      });

      gameEngine.on('game:started', (gameEngineState) => {
        setGameState(prev => ({ 
          ...prev, 
          isPlaying: true,
          gamePhase: gameEngineState.phase || 'roll_dice',
          currentPlayer: gameEngineState.players?.[gameEngineState.currentPlayerIndex] || prev.currentPlayer
        }));
        addNotification('游戏开始！', 'success');
      });

      // 玩家动作处理
      gameEngine.on('playerAction', (data) => {
        const { action, playerId, result } = data;
        console.log(`🎮 玩家动作: ${action} by ${playerId}`, result);
        
        if (result.success) {
          const updatedGameState = gameEngine.getGameState();
          if (updatedGameState) {
            setGameState(prev => ({
              ...prev,
              currentPlayer: updatedGameState.players[updatedGameState.currentPlayerIndex] || null,
              gamePhase: updatedGameState.phase,
              round: updatedGameState.round,
              players: updatedGameState.players,
              board: updatedGameState.board
            }));
          }
        }
      });

      // 回合完成
      gameEngine.on('turnCompleted', (data) => {
        const updatedGameState = data.gameState;
        setGameState(prev => ({
          ...prev,
          players: updatedGameState.players,
          board: updatedGameState.board,
          gamePhase: 'end_turn'
        }));

        onGameStateChange?.(updatedGameState);
      });

      // 初始化游戏
      await gameEngine.initializeGame();
      addNotification('游戏初始化成功', 'success');

    } catch (error) {
      console.error('初始化游戏引擎失败:', error);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: `游戏初始化失败: ${error instanceof Error ? error.message : '未知错误'}`
      }));
      addNotification('游戏初始化失败', 'error');
    }
  }, [onGameStateChange]);

  // 启动游戏
  const startGame = useCallback(async () => {
    if (!gameEngineRef.current) {
      console.error('GameEngine not initialized');
      return;
    }

    try {
      setGameState(prev => ({
        ...prev,
        isPlaying: true,
        error: null,
      }));

      const initialGameState = gameEngineRef.current.getGameState();
      if (initialGameState) {
        setGameState(prev => ({
          ...prev,
          isPlaying: true,
          error: null,
          currentPlayer: initialGameState.players[initialGameState.currentPlayerIndex] || null,
          gamePhase: initialGameState.phase,
          round: initialGameState.round,
          players: initialGameState.players,
          board: initialGameState.board
        }));
        
        addNotification('游戏开始！', 'success');
      }
    } catch (error) {
      console.error('启动游戏失败:', error);
      setGameState(prev => ({
        ...prev,
        error: `启动游戏失败: ${error instanceof Error ? error.message : '未知错误'}`
      }));
      addNotification('启动游戏失败', 'error');
    }
  }, []);

  // 处理玩家动作
  const handlePlayerAction = useCallback(async (action: any) => {
    if (!gameEngineRef.current || !gameState.isPlaying) {
      console.warn('游戏未初始化或未开始');
      return;
    }

    try {
      console.log('🎮 处理玩家动作:', action);
      
      const result = await gameEngineRef.current.handlePlayerAction(action);
      console.log('🎮 动作结果:', result);
      
      if (result.success) {
        const updatedGameState = gameEngineRef.current.getGameState();
        if (updatedGameState) {
          setGameState(prev => ({
            ...prev,
            currentPlayer: updatedGameState.players[updatedGameState.currentPlayerIndex] || null,
            gamePhase: updatedGameState.phase,
            round: updatedGameState.round,
            players: updatedGameState.players,
            board: updatedGameState.board,
            isPlaying: !updatedGameState.isGameOver
          }));
        }
      }
      
      onPlayerAction?.(action);
      
    } catch (error) {
      console.error('处理玩家动作失败:', error);
      addNotification(`动作失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }, [gameState.isPlaying, onPlayerAction]);

  // 处理UI交互
  const handleUIInteraction = useCallback((type: string, data: any) => {
    console.log('🖱️ UI交互:', type, data);
    onUIInteraction?.(type, data);
  }, [onUIInteraction]);

  // 添加通知
  const addNotification = useCallback((message: string, type: string) => {
    const id = Date.now().toString();
    setUiState(prev => ({
      ...prev,
      notifications: [...prev.notifications, { id, message, type }]
    }));

    setTimeout(() => {
      setUiState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id)
      }));
    }, 3000);
  }, []);

  // 暂停/恢复游戏
  const togglePause = useCallback(() => {
    if (gameState.isPaused) {
      setGameState(prev => ({ ...prev, isPaused: false }));
      addNotification('游戏已恢复', 'info');
    } else {
      setGameState(prev => ({ ...prev, isPaused: true }));
      addNotification('游戏已暂停', 'info');
    }
  }, [gameState.isPaused]);

  // 保存游戏
  const saveGame = useCallback(() => {
    if (gameEngineRef.current) {
      const gameState = gameEngineRef.current.getGameState();
      localStorage.setItem('zodiac-monopoly-save', JSON.stringify(gameState));
      addNotification('游戏已保存', 'success');
    }
  }, []);

  // 组件挂载时初始化
  useEffect(() => {
    initializeGameEngine();
  }, [initializeGameEngine]);

  // 获取玩家颜色
  const getPlayerColor = (zodiac: string): string => {
    const colors: Record<string, string> = {
      '龙': '#e53e3e', '虎': '#ed8936', '兔': '#ecc94b', '猴': '#d69e2e',
      '鼠': '#4299e1', '牛': '#48bb78', '蛇': '#9f7aea', '马': '#38b2ac',
      '羊': '#f56565', '鸡': '#38a169', '狗': '#805ad5', '猪': '#e53e3e'
    };
    return colors[zodiac] || '#666';
  };

  // 错误界面
  if (gameState.error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#e53e3e', marginBottom: '20px' }}>⚠️ 游戏错误</h2>
          <p style={{ color: '#4a5568', marginBottom: '30px' }}>{gameState.error}</p>
          <button 
            onClick={initializeGameEngine}
            style={{
              background: '#4299e1',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔄 重新初始化
          </button>
        </div>
      </div>
    );
  }

  // 加载界面
  if (gameState.isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>🎲</div>
          <h2 style={{ color: '#2d3748', marginBottom: '10px' }}>加载游戏中...</h2>
          <p style={{ color: '#4a5568' }}>正在初始化游戏引擎</p>
        </div>
      </div>
    );
  }

  // 游戏结束界面
  if (gameState.gameResult) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2>游戏结束</h2>
          <button 
            onClick={initializeGameEngine}
            style={{
              background: '#4299e1',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            开始新游戏
          </button>
        </div>
      </div>
    );
  }

  // 主游戏界面 - 优化布局
  return (
    <div style={{ 
      height: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '10px',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      <div style={{ 
        width: '100%',
        height: '100%',
        background: 'white',
        borderRadius: '8px',
        padding: '15px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 游戏标题 - 紧凑版 */}
        <h1 style={{ 
          textAlign: 'center', 
          color: '#2d3748',
          marginBottom: '15px',
          fontSize: '1.8rem',
          margin: '0 0 15px 0'
        }}>
          🎲 十二生肖大富翁
        </h1>
        
        {/* 主内容区域 - 使用flex布局 */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          gap: '15px',
          minHeight: 0
        }}>
          {/* 左侧：棋盘和游戏信息 */}
          <div style={{ 
            flex: '0 0 450px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* 游戏状态信息 - 紧凑版 */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <div style={{ 
                flex: 1,
                background: '#f7fafc', 
                padding: '10px', 
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>游戏信息</div>
                <div>回合: {gameState.round} | 阶段: {gameState.gamePhase}</div>
                <div>状态: {gameState.isPlaying ? '进行中' : '未开始'}</div>
              </div>
              
              {gameState.currentPlayer && (
                <div style={{ 
                  flex: 1,
                  background: '#e6fffa', 
                  padding: '10px', 
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>当前玩家</div>
                  <div><strong>{gameState.currentPlayer.name}</strong> ({gameState.currentPlayer.zodiac})</div>
                  <div>资金: ${gameState.currentPlayer.money} | 位置: {gameState.currentPlayer.position}</div>
                </div>
              )}
            </div>

            {/* 双环大富翁棋盘 - 紧凑版 */}
            <div style={{ flex: 1 }}>
              <h4 style={{ 
                color: '#2d3748', 
                marginBottom: '8px', 
                textAlign: 'center',
                fontSize: '1rem',
                margin: '0 0 8px 0'
              }}>🎲 双环十二生肖棋盘</h4>
              <div style={{
                width: '400px',
                height: '400px',
                margin: '0 auto',
                position: 'relative',
                border: '2px solid #2d3748',
                borderRadius: '8px',
                background: 'linear-gradient(45deg, #e6fffa 0%, #f0fff4 50%, #fef5e7 100%)'
              }}>
                {/* 外环格子 (40个) */}
                {Array.from({ length: 40 }, (_, index) => {
                  const position = index;
                  const playersOnCell = gameState.players.filter(p => p.position === position);
                  
                  // 计算外环格子位置 (沿着棋盘边缘)
                  let x = 0, y = 0;
                  const cellSize = 35;
                  const boardSize = 400;
                  
                  if (position <= 10) {
                    // 底边 (从右到左)
                    x = boardSize - cellSize - (position * (boardSize - cellSize) / 10);
                    y = boardSize - cellSize;
                  } else if (position <= 20) {
                    // 左边 (从下到上)
                    x = 0;
                    y = boardSize - cellSize - ((position - 10) * (boardSize - cellSize) / 10);
                  } else if (position <= 30) {
                    // 顶边 (从左到右)
                    x = (position - 20) * (boardSize - cellSize) / 10;
                    y = 0;
                  } else {
                    // 右边 (从上到下)
                    x = boardSize - cellSize;
                    y = (position - 30) * (boardSize - cellSize) / 10;
                  }

                  // 外环特殊格子类型
                  const getSpecialCell = (pos: number) => {
                    if (pos === 0) return { name: '起点', color: '#68d391', icon: '🏠', ring: '外环', type: 'start', price: 0 };
                    if (pos === 10) return { name: '监狱', color: '#a0aec0', icon: '🔒', ring: '外环', type: 'jail', price: 0 };
                    if (pos === 20) return { name: '免费停车', color: '#90cdf4', icon: '🅿️', ring: '外环', type: 'parking', price: 0 };
                    if (pos === 30) return { name: '入狱', color: '#fc8181', icon: '👮', ring: '外环', type: 'go_to_jail', price: 0 };
                    if ([2, 7, 17, 22, 33, 36].includes(pos)) return { name: '机会', color: '#fbb6ce', icon: '❓', ring: '外环', type: 'chance', price: 0 };
                    if ([4, 38].includes(pos)) return { name: '税收', color: '#d6bcfa', icon: '💸', ring: '外环', type: 'tax', price: 0 };
                    if ([5, 15, 25, 35].includes(pos)) return { name: '车站', color: '#90cdf4', icon: '🚂', ring: '外环', type: 'station', price: 200 };
                    if ([12, 28].includes(pos)) return { name: '公用事业', color: '#fbd38d', icon: '⚡', ring: '外环', type: 'utility', price: 150 };
                    
                    // 普通地产
                    const basePrice = 60 + (pos * 20);
                    return { name: `地产${pos}`, color: '#fed7e2', icon: '🏠', ring: '外环', type: 'property', price: basePrice };
                  };

                  const cellInfo = getSpecialCell(position);

                  return (
                    <div
                      key={`outer-${position}`}
                      style={{
                        position: 'absolute',
                        left: `${x}px`,
                        top: `${y}px`,
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        background: cellInfo.color,
                        border: '1px solid #2d3748',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        color: '#2d3748',
                        cursor: 'pointer',
                        boxShadow: playersOnCell.length > 0 ? '0 0 8px rgba(255, 215, 0, 0.8)' : '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onClick={() => handleUIInteraction('cellClick', { position, cellInfo })}
                      title={`${cellInfo.name} (${cellInfo.ring}) - 位置${position} - 价格$${cellInfo.price}`}
                    >
                      <div style={{ fontSize: '14px' }}>{cellInfo.icon}</div>
                      <div style={{ fontSize: '7px', textAlign: 'center', marginTop: '1px' }}>
                        {position}
                      </div>
                      
                      {/* 显示在此格子上的玩家 */}
                      {playersOnCell.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '1px'
                        }}>
                          {playersOnCell.map((player, idx) => (
                            <div
                              key={player.id}
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: getPlayerColor(player.zodiac),
                                color: 'white',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                zIndex: 200 + idx
                              }}
                              title={`${player.name} (${player.zodiac})`}
                            >
                              {player.name.charAt(0)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 内环格子 (24个) */}
                {Array.from({ length: 24 }, (_, index) => {
                  const position = index + 100; // 内环位置从100开始编号
                  const playersOnInnerCell = gameState.players.filter(p => p.position === position);
                  
                  // 计算内环格子位置
                  let x = 0, y = 0;
                  const innerCellSize = 28;
                  const innerRingOffset = 85; // 距离边缘的距离
                  const innerBoardSize = 400 - (innerRingOffset * 2);
                  
                  if (index <= 6) {
                    // 内环底边 (从右到左)
                    x = innerRingOffset + innerBoardSize - innerCellSize - (index * (innerBoardSize - innerCellSize) / 6);
                    y = 400 - innerRingOffset - innerCellSize;
                  } else if (index <= 12) {
                    // 内环左边 (从下到上)
                    x = innerRingOffset;
                    y = 400 - innerRingOffset - innerCellSize - ((index - 6) * (innerBoardSize - innerCellSize) / 6);
                  } else if (index <= 18) {
                    // 内环顶边 (从左到右)
                    x = innerRingOffset + (index - 12) * (innerBoardSize - innerCellSize) / 6;
                    y = innerRingOffset;
                  } else {
                    // 内环右边 (从上到下)
                    x = innerRingOffset + innerBoardSize - innerCellSize;
                    y = innerRingOffset + (index - 18) * (innerBoardSize - innerCellSize) / 6;
                  }

                  // 内环特殊格子类型
                  const getInnerSpecialCell = (pos: number) => {
                    const innerIndex = pos - 100;
                    if (innerIndex === 0) return { name: '内环起点', color: '#68d391', icon: '🌟', ring: '内环', type: 'inner_start', price: 0 };
                    if (innerIndex === 6) return { name: '宝库', color: '#ffd700', icon: '💰', ring: '内环', type: 'treasure', price: 0 };
                    if (innerIndex === 12) return { name: '神庙', color: '#b794f6', icon: '⛩️', ring: '内环', type: 'temple', price: 0 };
                    if (innerIndex === 18) return { name: '市场', color: '#4fd1c7', icon: '🏪', ring: '内环', type: 'market', price: 0 };
                    if ([3, 9, 15, 21].includes(innerIndex)) return { name: '传送门', color: '#fc8181', icon: '🌀', ring: '内环', type: 'portal', price: 0 };
                    if ([1, 7, 13, 19].includes(innerIndex)) return { name: '生肖殿', color: '#f6ad55', icon: '🏯', ring: '内环', type: 'zodiac_temple', price: 300 };
                    
                    // 内环高级地产
                    const innerPropertyPrices = [400, 450, 500, 550, 600, 650, 700, 750, 800];
                    const innerPropertyIndex = [2, 4, 5, 8, 10, 11, 14, 16, 17, 20, 22, 23].indexOf(innerIndex);
                    const price = innerPropertyIndex >= 0 ? innerPropertyPrices[innerPropertyIndex % innerPropertyPrices.length] : 400;
                    
                    return { name: `内环${innerIndex}`, color: '#fed7e2', icon: '🏠', ring: '内环', type: 'property', price };
                  };

                  const innerCellInfo = getInnerSpecialCell(position);

                  return (
                    <div
                      key={`inner-${position}`}
                      style={{
                        position: 'absolute',
                        left: `${x}px`,
                        top: `${y}px`,
                        width: `${innerCellSize}px`,
                        height: `${innerCellSize}px`,
                        background: innerCellInfo.color,
                        border: '1px solid #2d3748',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '6px',
                        color: '#2d3748',
                        cursor: 'pointer',
                        boxShadow: playersOnInnerCell.length > 0 ? '0 0 6px rgba(255, 215, 0, 0.8)' : '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onClick={() => handleUIInteraction('cellClick', { position, cellInfo: innerCellInfo })}
                      title={`${innerCellInfo.name} (${innerCellInfo.ring}) - 位置${position} - 价格$${innerCellInfo.price}`}
                    >
                      <div style={{ fontSize: '10px' }}>{innerCellInfo.icon}</div>
                      <div style={{ fontSize: '6px', textAlign: 'center' }}>
                        {position}
                      </div>
                      
                      {/* 显示在此格子上的玩家 */}
                      {playersOnInnerCell.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-15px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '1px'
                        }}>
                          {playersOnInnerCell.map((player, idx) => (
                            <div
                              key={player.id}
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: getPlayerColor(player.zodiac),
                                color: 'white',
                                fontSize: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid white',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                zIndex: 300 + idx
                              }}
                              title={`${player.name} (${player.zodiac})`}
                            >
                              {player.name.charAt(0)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 中央信息区域 */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120px',
                  height: '120px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #553c9a',
                  boxShadow: '0 4px 16px rgba(85, 60, 154, 0.3)',
                  textAlign: 'center'
                }}>
                  <h4 style={{ color: '#553c9a', fontSize: '0.8rem', marginBottom: '4px', margin: '0 0 4px 0' }}>
                    🎲 双环
                  </h4>
                  <div style={{ color: '#4a5568', fontSize: '0.7rem' }}>
                    <div><strong>R{gameState.round}</strong></div>
                    {gameState.currentPlayer && (
                      <>
                        <div style={{ marginTop: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: '#553c9a' }}>
                          {gameState.currentPlayer.name}
                        </div>
                        <div style={{ fontSize: '0.65rem' }}>
                          ${gameState.currentPlayer.money}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#718096' }}>
                          {gameState.currentPlayer.position >= 100 ? '内' : '外'}{gameState.currentPlayer.position}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 环之间的连接通道 */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '20px',
                  background: '#4299e1',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #2d3748',
                  cursor: 'pointer',
                  fontSize: '10px'
                }} title="外环→内环通道">
                  🔄
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '20px',
                  background: '#ed8936',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #2d3748',
                  cursor: 'pointer',
                  fontSize: '10px'
                }} title="内环→外环通道">
                  🔄
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：玩家状态、操作控制和信息显示 */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflow: 'auto'
          }}>
            {/* 玩家列表 - 紧凑版 */}
            <div>
              <h4 style={{ color: '#2d3748', marginBottom: '8px', fontSize: '1rem', margin: '0 0 8px 0' }}>玩家状态</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '8px'
              }}>
                {gameState.players.map((player, index) => (
                  <div key={player.id} style={{
                    background: player.id === gameState.currentPlayer?.id ? '#ffd89b' : '#f7fafc',
                    padding: '8px',
                    borderRadius: '6px',
                    border: player.id === gameState.currentPlayer?.id ? '2px solid #ed8936' : '1px solid #e2e8f0',
                    fontSize: '0.75rem'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#2d3748', marginBottom: '4px', fontSize: '0.8rem' }}>
                      {player.name} {player.isHuman ? '👤' : '🤖'}
                    </div>
                    <div style={{ marginBottom: '2px' }}>{player.zodiac} | ${player.money}</div>
                    <div style={{ marginBottom: '2px' }}>位置: {player.position} ({player.position >= 100 ? '内环' : '外环'})</div>
                    <div style={{ marginBottom: '2px' }}>资产: {player.properties?.length || 0} 处</div>
                    {player.properties && Array.isArray(player.properties) && player.properties.length > 0 && (
                      <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px' }}>
                        {player.properties.map((prop: any) => (
                          <span key={prop.position} style={{
                            background: '#e2e8f0',
                            padding: '1px 3px',
                            borderRadius: '2px',
                            fontSize: '0.6rem',
                            marginRight: '2px'
                          }}>
                            {prop.position}({prop.level || 0})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 游戏控制 - 紧凑版 */}
            {gameState.currentPlayer && gameState.currentPlayer.isHuman && gameState.isPlaying && (
              <div style={{
                background: '#e6fffa',
                padding: '10px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#2d3748', fontSize: '0.9rem' }}>你的回合</h4>
                
                {/* 当前阶段状态指示器 */}
                <div style={{
                  background: '#f7fafc',
                  border: '1px solid #e2e8f0',
                  padding: '6px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  <span style={{ 
                    color: gameState.gamePhase === 'roll_dice' ? '#48bb78' : 
                          gameState.gamePhase === 'property_action' ? '#ed8936' : 
                          gameState.gamePhase === 'pay_rent' ? '#e53e3e' : '#4299e1',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}>
                    {
                      gameState.gamePhase === 'roll_dice' ? '🎲 请掷骰子' :
                      gameState.gamePhase === 'property_action' ? '🏠 地产操作' :
                      gameState.gamePhase === 'pay_rent' ? '💰 支付租金' :
                      gameState.gamePhase === 'upgrade_property' ? '🏗️ 升级地产' :
                      gameState.gamePhase === 'end_turn' ? '✅ 结束回合' :
                      gameState.gamePhase
                    }
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {gameState.gamePhase === 'roll_dice' && gameState.currentPlayer?.isHuman && (
                    <button
                      onClick={() => handlePlayerAction({ type: 'roll_dice' })}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        background: '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      🎲 掷骰子
                    </button>
                  )}
                  
                  {gameState.gamePhase === 'property_action' && (() => {
                    const currentPlayer = gameState.currentPlayer;
                    const position = currentPlayer?.position;
                    const cell = position !== undefined && gameState.board ? gameState.board[position] : null;
                    const isPurchasableCell = cell && ['property', 'station', 'utility', 'zodiac_temple'].includes(cell.type);
                    const isHumanPlayerTurn = currentPlayer?.isHuman === true;
                    
                    return isPurchasableCell && isHumanPlayerTurn;
                  })() && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handlePlayerAction({ type: 'buy_property' })}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          background: '#38a169',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        💰 购买
                      </button>
                      <button
                        onClick={() => handlePlayerAction({ type: 'skip_purchase' })}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          background: '#e53e3e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        ❌ 跳过
                      </button>
                    </div>
                  )}
                  
                  {gameState.gamePhase === 'property_action' && (() => {
                    const currentPlayer = gameState.currentPlayer;
                    const position = currentPlayer?.position;
                    const cell = position !== undefined && gameState.board ? gameState.board[position] : null;
                    const isPurchasableCell = cell && ['property', 'station', 'utility', 'zodiac_temple'].includes(cell.type);
                    const isNotPurchasableCell = !isPurchasableCell;
                    const isHumanPlayerTurn = currentPlayer?.isHuman === true;
                    
                    return isNotPurchasableCell && isHumanPlayerTurn;
                  })() && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <div style={{ 
                        padding: '6px 12px', 
                        background: '#f7fafc', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        🏛️ 特殊位置
                      </div>
                      <button
                        onClick={() => handlePlayerAction({ type: 'end_turn' })}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          background: '#4299e1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        ✅ 结束回合
                      </button>
                    </div>
                  )}
                  
                  {gameState.gamePhase === 'pay_rent' && gameState.currentPlayer?.isHuman && (
                    <button
                      onClick={() => handlePlayerAction({ type: 'pay_rent' })}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        background: '#d69e2e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      💳 支付租金
                    </button>
                  )}
                  
                  {gameState.gamePhase === 'upgrade_property' && gameState.currentPlayer?.isHuman && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handlePlayerAction({ type: 'upgrade_property' })}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          background: '#9f7aea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        🏗️ 升级
                      </button>
                      <button
                        onClick={() => handlePlayerAction({ type: 'skip_upgrade' })}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          background: '#718096',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        ⏭️ 跳过
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handlePlayerAction({ type: 'end_turn' })}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      background: '#4299e1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    ⏭️ 结束回合
                  </button>
                </div>
              )}

            {/* 游戏信息显示 - 紧凑版 */}
            {/* 骰子结果 */}
            {visualEffects.diceRoll.showResult && (
              <div style={{
                background: '#fff5f5',
                border: '1px solid #fc8181',
                padding: '8px',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '0.8rem'
              }}>
                <div style={{ fontWeight: 'bold', color: '#c53030', marginBottom: '4px' }}>骰子结果</div>
                <div style={{ fontSize: '1rem' }}>
                  🎲 {visualEffects.diceRoll.result?.value1 || 0} + {visualEffects.diceRoll.result?.value2 || 0} = {visualEffects.diceRoll.result?.sum || 0}
                </div>
              </div>
            )}

            {/* 地产信息显示 */}
            {gameState.currentPlayer && gameState.currentPlayer.isHuman && gameState.gamePhase === 'property_action' && (
              <div style={{
                background: '#f0fff4',
                border: '1px solid #68d391',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '0.75rem'
              }}>
                <div style={{ fontWeight: 'bold', color: '#2f855a', marginBottom: '4px' }}>🏢 地产信息</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div><strong>位置:</strong> {gameState.currentPlayer.position}</div>
                    <div><strong>名称:</strong> 地产{gameState.currentPlayer.position}</div>
                    <div><strong>环:</strong> {gameState.currentPlayer.position >= 100 ? '内环' : '外环'}</div>
                  </div>
                  <div>
                    <div><strong>价格:</strong> ${gameState.currentPlayer.position >= 100 ? '400-800' : '60-400'}</div>
                    <div><strong>状态:</strong> 可购买</div>
                    <div><strong>资金:</strong> ${gameState.currentPlayer.money}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 租金信息显示 */}
            {gameState.currentPlayer && gameState.currentPlayer.isHuman && gameState.gamePhase === 'pay_rent' && (
              <div style={{
                background: '#fffaf0',
                border: '1px solid #ed8936',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '0.75rem'
              }}>
                <div style={{ fontWeight: 'bold', color: '#c05621', marginBottom: '4px' }}>💳 需要支付租金</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div><strong>位置:</strong> {gameState.currentPlayer.position}</div>
                    <div><strong>地产:</strong> 地产{gameState.currentPlayer.position}</div>
                    <div><strong>业主:</strong> AI玩家</div>
                  </div>
                  <div>
                    <div><strong>租金:</strong> $50-200</div>
                    <div><strong>资金:</strong> ${gameState.currentPlayer.money}</div>
                    <div style={{ color: gameState.currentPlayer.money < 100 ? '#e53e3e' : '#38a169' }}>
                      <strong>{gameState.currentPlayer.money < 100 ? '资金不足!' : '资金充足'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 游戏控制按钮 - 紧凑版 */}
            <div style={{
              display: 'flex',
              gap: '6px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '10px'
            }}>
              <button
                onClick={togglePause}
                disabled={!gameState.isPlaying}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  background: gameState.isPaused ? '#48bb78' : '#ed8936',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: gameState.isPlaying ? 'pointer' : 'not-allowed',
                  opacity: gameState.isPlaying ? 1 : 0.5
                }}
              >
                {gameState.isPaused ? '▶️ 恢复' : '⏸️ 暂停'}
              </button>
              
              <button
                onClick={() => saveGame()}
                disabled={!gameState.isPlaying}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  background: '#9f7aea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: gameState.isPlaying ? 'pointer' : 'not-allowed',
                  opacity: gameState.isPlaying ? 1 : 0.5
                }}
              >
                💾 保存
              </button>
            </div>
          </div>
        </div>

        {/* 通知区域 */}
        {uiState.notifications.length > 0 && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000
          }}>
            {uiState.notifications.map(notification => (
              <div
                key={notification.id}
                style={{
                  background: notification.type === 'error' ? '#fed7d7' : notification.type === 'success' ? '#c6f6d5' : '#bee3f8',
                  color: notification.type === 'error' ? '#c53030' : notification.type === 'success' ? '#2f855a' : '#2b6cb0',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  maxWidth: '300px'
                }}
              >
                {notification.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLoop;