/**
 * 游戏循环集成组件 - 连接UI和游戏引擎
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { GameConfig } from '../types/storage';
import type { Player, GameEvent } from '../types/game';
// 暂时注释掉可能有问题的导入
// import { GameState } from '../state/GameState';
// import { EnhancedGameInterface } from './EnhancedGameInterface';
// import { EnhancedPlayerCard, EnhancedPlayerControls, EnhancedPlayerList } from './player/EnhancedPlayerInterface';
// import { SimpleGameControls } from './SimpleGameControls';
// import { GameBoard } from './GameBoard';
// import { DiceRollAnimation, PlayerMoveAnimation, GameEventNotification, MoneyAnimation } from './GameVisualEffects';
// import { EnhancedGameLayout } from './EnhancedGameLayout';
// import { InteractionFeedbackSystem } from '../feedback/InteractionFeedbackSystem';

// 组件Props类型
interface GameLoopProps {
  gameConfig: GameConfig;
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
  // const feedbackSystemRef = useRef<InteractionFeedbackSystem | null>(null);

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
    notifications: [] as Array<{ id: string; message: string; type: string }>
  });

  // 视觉效果状态
  const [visualEffects, setVisualEffects] = useState({
    diceRoll: {
      isRolling: false,
      result: null as number[] | null,
      showResult: false
    },
    playerMove: {
      isMoving: false,
      playerName: '',
      fromPosition: 0,
      toPosition: 0
    },
    gameEvent: null as any,
    moneyAnimation: {
      show: false,
      amount: 0,
      isGain: true,
      position: { x: 0, y: 0 }
    }
  });

  /**
   * 初始化游戏引擎
   */
  const initializeGameEngine = useCallback(async () => {
    if (gameEngineRef.current) return;

    try {
      setGameState(prev => ({ ...prev, isLoading: true, error: null }));

      // 创建游戏引擎
      const gameEngine = new GameEngine();
      gameEngineRef.current = gameEngine;

      // 设置事件监听器 - 内联定义避免依赖问题
      gameEngine.on('game:initialized', (gameEngineState) => {
        console.log('Game initialized:', gameEngineState);
        setGameState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          players: gameEngineState.players || [],
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
        addNotification('游戏开始！', 'info');
      });

      // 其他关键事件
      gameEngine.on('turnStarted', (data) => {
        const { player, round } = data;
        setGameState(prev => ({
          ...prev,
          currentPlayer: player,
          round: round || prev.round,
          gamePhase: 'roll_dice'
        }));
        if (player.isHuman) {
          addNotification('轮到你了！', 'info');
        } else {
          addNotification(`${player.name}的回合`, 'info');
        }
      });

      gameEngine.on('diceRolled', (data) => {
        const { player, result } = data;
        addNotification(
          `${player.name}投出了${result.sum}点 (${result.value1}+${result.value2})`,
          'info'
        );
        if (result.isDouble) {
          addNotification('双数！获得额外奖励！', 'success');
        }
      });

      gameEngine.on('game:ended', (data) => {
        const { winCondition, finalStats } = data;
        setGameState(prev => ({
          ...prev,
          isPlaying: false,
          gameResult: { winCondition, finalStats }
        }));
        addNotification('游戏结束！', 'info');
        onGameEnd?.(data);
      });

      // 初始化游戏
      await gameEngine.initialize(gameConfig);

      setGameState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        players: []
      }));

    } catch (error) {
      console.error('Game initialization failed:', error);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: `游戏初始化失败: ${error instanceof Error ? error.message : '未知错误'}`
      }));
    }
  }, [gameConfig]);

  /**
   * 添加通知
   */
  const notificationCounter = useRef(0);
  const addNotification = useCallback((message: string, type: string) => {
    notificationCounter.current++;
    const notification = {
      id: `notification_${Date.now()}_${notificationCounter.current}`,
      message,
      type
    };

    setUiState(prev => ({
      ...prev,
      notifications: [...prev.notifications, notification]
    }));

    // 自动移除通知
    setTimeout(() => {
      setUiState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notification.id)
      }));
    }, 5000);
  }, []);

  /**
   * 设置游戏引擎事件监听器
   */
  // DELETED: setupGameEngineListeners - moved inline to initializeGameEngine
  /*const setupGameEngineListeners = useCallback((gameEngine: GameEngine) => {
    // 游戏初始化完成
    gameEngine.on('game:initialized', (gameEngineState) => {
      console.log('Game initialized:', gameEngineState);
      setGameState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        players: gameEngineState.players || [],
        round: gameEngineState.round || 1,
        gamePhase: gameEngineState.phase || 'roll_dice',
        currentPlayer: gameEngineState.players?.[gameEngineState.currentPlayerIndex] || null
      }));
      addNotification('游戏初始化完成', 'success');
    });

    // 游戏开始
    gameEngine.on('game:started', (gameEngineState) => {
      setGameState(prev => ({ 
        ...prev, 
        isPlaying: true,
        gamePhase: gameEngineState.phase || 'roll_dice',
        currentPlayer: gameEngineState.players?.[gameEngineState.currentPlayerIndex] || prev.currentPlayer
      }));
      addNotification('游戏开始！', 'info');
    });

    // 回合开始
    gameEngine.on('turnStarted', (data) => {
      const { player, round } = data;
      setGameState(prev => ({
        ...prev,
        currentPlayer: player,
        round,
        gamePhase: player.isHuman ? 'roll_dice' : 'ai_turn'
      }));

      if (player.isHuman) {
        addNotification('轮到你了！', 'info');
        // 提供游戏反馈
        // feedbackSystemRef.current?.provideGameFeedback('turn_start', { player });
      } else {
        addNotification(`${player.name}的回合`, 'info');
      }
    });

    // 回合结束
    gameEngine.on('turnCompleted', (data) => {
      const updatedGameState = data.gameState;
      setGameState(prev => ({
        ...prev,
        players: updatedGameState.players,
        gamePhase: 'end_turn'
      }));

      // 通知父组件状态变化
      onGameStateChange?.(updatedGameState);
    });

    // 骰子投掷
    gameEngine.on('diceRolled', (data) => {
      const { player, result } = data;
      addNotification(
        `${player.name}投出了${result.sum}点 (${result.value1}+${result.value2})`,
        'info'
      );
      
      // 双数特殊提示
      if (result.isDouble) {
        addNotification('双数！获得额外奖励！', 'success');
        // feedbackSystemRef.current?.provideGameFeedback('achievement', { type: 'double_dice' });
      }
    });

    // 属性购买
    gameEngine.on('propertyPurchased', (data) => {
      const { player, property } = data;
      addNotification(
        `${player.name}购买了${property.name}`,
        'success'
      );
      // feedbackSystemRef.current?.provideGameFeedback('property_bought', { player, property });
    });

    // 技能使用
    gameEngine.on('skillUsed', (data) => {
      const { player, skill } = data;
      addNotification(
        `${player.name}使用了技能：${skill.name}`,
        'info'
      );
      // feedbackSystemRef.current?.provideGameFeedback('skill_ready', { player, skill });
    });

    // 经过起点
    gameEngine.on('passedStart', (data) => {
      const { player, bonus } = data;
      addNotification(
        `${player.name}经过起点，获得${bonus}金币`,
        'success'
      );
    });

    // 玩家淘汰
    gameEngine.on('playerEliminated', (data) => {
      const { player } = data;
      addNotification(
        `${player.name}被淘汰了！`,
        'warning'
      );
      // feedbackSystemRef.current?.provideGameFeedback('player_eliminated', { player });
    });

    // 游戏结束
    gameEngine.on('gameEnded', (data) => {
      const { winCondition, finalStats } = data;
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        gamePhase: 'game_over',
        gameResult: { winCondition, finalStats }
      }));
      
      addNotification('游戏结束！', 'info');
      onGameEnd?.(data);
    });

    // 游戏暂停/恢复
    gameEngine.on('gamePaused', () => {
      setGameState(prev => ({ ...prev, isPaused: true }));
      addNotification('游戏已暂停', 'info');
    });

    gameEngine.on('gameResumed', () => {
      setGameState(prev => ({ ...prev, isPaused: false }));
      addNotification('游戏已恢复', 'info');
    });

    // AI回合事件
    gameEngine.on('aiTurnStarted', (data) => {
      addNotification(`${data.player.name}正在思考...`, 'info');
    });

    gameEngine.on('aiTurnCompleted', (data) => {
      addNotification(`${data.player.name}完成了回合`, 'info');
    });

    // 错误处理
    gameEngine.on('gameError', (data) => {
      console.error('Game error:', data.error);
      setGameState(prev => ({
        ...prev,
        error: `游戏错误: ${data.error.message || '未知错误'}`
      }));
    });

    gameEngine.on('turnError', (data) => {
      console.error('Turn error:', data.error);
      addNotification('回合执行出错', 'error');
    });

    // 通用游戏事件
    gameEngine.on('actionExecuted', (data) => {
      onGameEvent?.(data);
    });

  }, [onGameEvent, onGameStateChange, onGameEnd, addNotification]);*/


  /**
   * 开始游戏
   */
  const startGame = useCallback(async () => {
    if (!gameEngineRef.current) return;

    try {
      await gameEngineRef.current.startGame();
      
      // 获取初始游戏状态并同步到UI
      const initialGameState = gameEngineRef.current.getGameState();
      if (initialGameState) {
        setGameState(prev => ({
          ...prev,
          isPlaying: true,
          error: null,
          currentPlayer: initialGameState.players[initialGameState.currentPlayerIndex] || null,
          gamePhase: initialGameState.phase,
          round: initialGameState.round,
          players: initialGameState.players
        }));
        
        addNotification('游戏开始！', 'success');
        
        // 如果第一个玩家是AI，自动开始AI回合
        const firstPlayer = initialGameState.players[initialGameState.currentPlayerIndex];
        if (firstPlayer && !firstPlayer.isHuman) {
          setTimeout(() => {
            handleAITurn();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      setGameState(prev => ({
        ...prev,
        error: `启动游戏失败: ${error instanceof Error ? error.message : '未知错误'}`
      }));
    }
  }, [addNotification]);

  /**
   * 暂停/恢复游戏
   */
  const togglePause = useCallback(() => {
    if (!gameEngineRef.current) return;

    if (gameState.isPaused) {
      gameEngineRef.current.resumeGame();
    } else {
      gameEngineRef.current.pauseGame();
    }
  }, [gameState.isPaused]);

  /**
   * 保存游戏
   */
  const saveGame = useCallback(async (saveName?: string) => {
    if (!gameEngineRef.current) return;

    try {
      const saveId = await gameEngineRef.current.saveGame(saveName);
      addNotification(`游戏已保存`, 'success');
      return saveId;
    } catch (error) {
      console.error('Failed to save game:', error);
      addNotification('保存游戏失败', 'error');
    }
  }, [addNotification]);

  /**
   * 处理玩家操作
   */
  const handlePlayerAction = useCallback(async (action: any) => {
    if (!gameEngineRef.current) {
      console.error('游戏引擎未初始化');
      addNotification('游戏引擎未初始化', 'error');
      return;
    }

    console.log('处理玩家操作:', action, '当前游戏状态:', gameState);

    try {
      // 提供反馈
      // feedbackSystemRef.current?.provideGameFeedback('action_start', action);
      
      // 执行操作
      const result = await gameEngineRef.current.processPlayerAction(action);
      console.log('操作结果:', result);
      
      // 获取更新后的游戏状态
      const updatedGameState = gameEngineRef.current.getGameState();
      if (updatedGameState) {
        console.log('同步游戏状态到UI:', {
          actionType: action.type,
          playersCount: updatedGameState.players.length,
          playerProperties: updatedGameState.players.map(p => ({ name: p.name, propertiesCount: p.properties?.length || 0 }))
        });
        // 同步游戏状态到UI
        setGameState(prev => ({
          ...prev,
          currentPlayer: updatedGameState.players[updatedGameState.currentPlayerIndex] || null,
          gamePhase: updatedGameState.phase,
          round: updatedGameState.round,
          players: updatedGameState.players,
          isPlaying: !updatedGameState.isGameOver
        }));
      }
      
      // 通知父组件
      onPlayerAction?.(action);
      
      // 更新游戏阶段和视觉效果
      if (action.type === 'roll_dice') {
        // 获取真实的骰子结果
        const diceResultFromEngine = updatedGameState?.lastDiceResult;
        const diceResult = diceResultFromEngine 
          ? [diceResultFromEngine.dice1, diceResultFromEngine.dice2]
          : [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        const totalMoves = diceResult.reduce((a, b) => a + b, 0);
        
        // 开始骰子动画
        setVisualEffects(prev => ({
          ...prev,
          diceRoll: {
            isRolling: true,
            result: diceResult,
            showResult: false
          }
        }));
        
        setTimeout(() => {
          setVisualEffects(prev => ({
            ...prev,
            diceRoll: {
              ...prev.diceRoll,
              isRolling: false,
              showResult: true
            }
          }));
          addNotification(`骰子已掷出！点数：${totalMoves}`, 'success');
          
          // 开始玩家移动动画
          if (updatedGameState && updatedGameState.players[updatedGameState.currentPlayerIndex]) {
            const currentPlayer = updatedGameState.players[updatedGameState.currentPlayerIndex];
            const fromPos = gameState.currentPlayer?.position || 0;
            const toPos = currentPlayer.position;
            
            setVisualEffects(prev => ({
              ...prev,
              playerMove: {
                isMoving: true,
                playerName: currentPlayer.name,
                fromPosition: fromPos,
                toPosition: toPos
              }
            }));
            
            // 移动动画完成后，显示格子事件或允许结束回合
            setTimeout(() => {
              // 检查当前格子类型，显示相应事件
              const boardCells = [
                { id: 0, name: '起点', type: 'start' },
                { id: 1, name: '鼠年商街', type: 'property' },
                { id: 2, name: '机会', type: 'chance' },
                { id: 3, name: '牛年农场', type: 'property' },
                // ... 其他格子
              ];
              
              const currentCell = boardCells.find(cell => cell.id === toPos);
              if (currentCell && currentCell.type !== 'start') {
                setVisualEffects(prev => ({
                  ...prev,
                  gameEvent: {
                    type: currentCell.type,
                    message: `到达 ${currentCell.name}`,
                    icon: currentCell.type === 'property' ? '🏠' : '❓',
                    color: '#4299e1'
                  }
                }));
              }
            }, 2000); // 等待移动动画完成
          }
        }, 1500);
        
      } else if (action.type === 'end_turn') {
        addNotification('回合结束', 'info');
        
        // 检查下一个玩家是否是AI
        if (updatedGameState && !updatedGameState.players[updatedGameState.currentPlayerIndex].isHuman) {
          setTimeout(() => {
            handleAITurn();
          }, 1000);
        }
        
      } else if (action.type === 'use_skill') {
        // 显示技能效果
        setVisualEffects(prev => ({
          ...prev,
          gameEvent: {
            type: 'skill',
            message: `${gameState.currentPlayer?.name} 使用了生肖技能！`,
            icon: '⚡',
            color: '#9f7aea'
          }
        }));
        addNotification('技能使用成功！', 'success');
      }
      
      // 操作成功反馈
      // feedbackSystemRef.current?.provideGameFeedback('action_success', { action, result });
      
    } catch (error) {
      console.error('Player action failed:', error);
      // feedbackSystemRef.current?.provideGameFeedback('action_failed', { action, error });
      addNotification(`操作失败: ${error}`, 'error');
    }
  }, [onPlayerAction, addNotification, gameState]);

  /**
   * 处理AI玩家回合
   */
  const handleAITurn = useCallback(async () => {
    if (!gameEngineRef.current) return;
    
    const currentGameState = gameEngineRef.current.getGameState();
    if (!currentGameState) return;
    
    const currentPlayer = currentGameState.players[currentGameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman) return;
    
    try {
      console.log(`AI玩家 ${currentPlayer.name} 开始回合，当前阶段: ${currentGameState.phase}`);
      addNotification(`AI玩家 ${currentPlayer.name} 正在思考...`, 'info');
      
      // 根据游戏阶段执行相应操作
      if (currentGameState.phase === 'roll_dice') {
        // AI掷骰子
        await new Promise(resolve => setTimeout(resolve, 1000)); // 思考时间
        await handlePlayerAction({ type: 'roll_dice', playerId: currentPlayer.id });
        
        // 等待移动动画完成后，继续处理
        setTimeout(() => {
          handleAITurnContinue(currentPlayer.id);
        }, 4000); // 等待骰子动画 + 移动动画完成
        
      } else if (currentGameState.phase === 'process_cell') {
        // AI处理格子事件
        setTimeout(() => {
          handleAITurnContinue(currentPlayer.id);
        }, 1500);
      }
      
    } catch (error) {
      console.error('AI回合处理失败:', error);
      addNotification('AI操作失败', 'error');
    }
  }, [handlePlayerAction, addNotification]);

  /**
   * AI回合后续处理
   */
  const handleAITurnContinue = useCallback(async (playerId: string) => {
    if (!gameEngineRef.current) return;
    
    const currentGameState = gameEngineRef.current.getGameState();
    if (!currentGameState) return;
    
    const currentPlayer = currentGameState.players[currentGameState.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman || currentPlayer.id !== playerId) return;
    
    try {
      // AI根据格子类型做决策
      const boardCells = [
        { id: 0, name: '起点', type: 'start' },
        { id: 1, name: '鼠年商街', type: 'property' },
        { id: 2, name: '机会', type: 'chance' },
        { id: 3, name: '牛年农场', type: 'property' },
        // 可以扩展更多格子
      ];
      
      const currentCell = boardCells.find(cell => cell.id === currentPlayer.position);
      
      if (currentCell?.type === 'property') {
        // AI考虑是否购买地产
        addNotification(`${currentPlayer.name} 考虑购买 ${currentCell.name}...`, 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 简单AI逻辑：如果有足够资金就购买
        if (currentPlayer.money > 1000) {
          addNotification(`${currentPlayer.name} 决定购买 ${currentCell.name}！`, 'success');
        } else {
          addNotification(`${currentPlayer.name} 资金不足，放弃购买`, 'info');
        }
      } else if (currentCell?.type === 'chance') {
        addNotification(`${currentPlayer.name} 触发机会事件！`, 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // AI结束回合
      await new Promise(resolve => setTimeout(resolve, 1000));
      await handlePlayerAction({ type: 'end_turn', playerId: currentPlayer.id });
      
    } catch (error) {
      console.error('AI回合后续处理失败:', error);
    }
  }, [handlePlayerAction, addNotification]);

  /**
   * 处理UI交互
   */
  const handleUIInteraction = useCallback((type: string, data: any) => {
    switch (type) {
      case 'showPlayerDetails':
        setUiState(prev => ({
          ...prev,
          showPlayerDetails: true,
          selectedPlayerId: data.playerId
        }));
        break;
      
      case 'hidePlayerDetails':
        setUiState(prev => ({
          ...prev,
          showPlayerDetails: false,
          selectedPlayerId: null
        }));
        break;
        
      case 'toggleGameMenu':
        setUiState(prev => ({
          ...prev,
          showGameMenu: !prev.showGameMenu
        }));
        break;
        
      case 'toggleSettings':
        setUiState(prev => ({
          ...prev,
          showSettings: !prev.showSettings
        }));
        break;
        
      case 'closeModal':
        setUiState(prev => ({
          ...prev,
          showPlayerDetails: false,
          showGameMenu: false,
          showSettings: false,
          selectedPlayerId: null
        }));
        break;
    }
    
    // 通知父组件UI交互
    onUIInteraction?.(type, data);
  }, [onUIInteraction]);

  // 初始化效果
  useEffect(() => {
    initializeGameEngine();

    // 清理函数
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
      // if (feedbackSystemRef.current) {
        // feedbackSystemRef.current.destroy();
        // feedbackSystemRef.current = null;
      // }
    };
  }, [initializeGameEngine]);

  // 自动开始游戏
  useEffect(() => {
    if (gameState.isInitialized && !gameState.isPlaying && !gameState.error) {
      startGame();
    }
  }, [gameState.isInitialized, gameState.isPlaying, gameState.error, startGame]);

  // 渲染加载状态
  if (gameState.isLoading) {
    return (
      <div className="game-loop-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">正在初始化游戏...</div>
      </div>
    );
  }

  // 渲染错误状态
  if (gameState.error) {
    return (
      <div className="game-loop-error">
        <div className="error-message">{gameState.error}</div>
        <button 
          className="retry-button"
          onClick={initializeGameEngine}
        >
          重试
        </button>
      </div>
    );
  }

  // 渲染游戏结束状态
  if (gameState.gameResult) {
    return (
      <div className="game-loop-result">
        <div className="result-content">
          <h2>游戏结束</h2>
          <div className="winner-info">
            {/* 游戏结果内容 */}
          </div>
          <button 
            className="new-game-button"
            onClick={initializeGameEngine}
          >
            开始新游戏
          </button>
        </div>
      </div>
    );
  }

  // 辅助函数：获取玩家颜色
  const getPlayerColor = (zodiac: string): string => {
    const colors: Record<string, string> = {
      '龙': '#e53e3e', '虎': '#ed8936', '兔': '#ecc94b', '猴': '#d69e2e',
      '鼠': '#4299e1', '牛': '#48bb78', '蛇': '#9f7aea', '马': '#38b2ac',
      '羊': '#f56565', '鸡': '#38a169', '狗': '#805ad5', '猪': '#e53e3e'
    };
    return colors[zodiac] || '#666';
  };

  // 主游戏界面 - 简化版
  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {/* 游戏标题 */}
        <h1 style={{ 
          textAlign: 'center', 
          color: '#2d3748',
          marginBottom: '30px',
          fontSize: '2.5rem'
        }}>
          🎲 十二生肖大富翁
        </h1>
        
        {/* 游戏状态信息 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>游戏信息</h3>
            <p>回合: {gameState.round}</p>
            <p>阶段: {gameState.gamePhase}</p>
            <p>状态: {gameState.isPlaying ? '进行中' : '未开始'}</p>
          </div>
          
          {gameState.currentPlayer && (
            <div style={{ background: '#e6fffa', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>当前玩家</h3>
              <p><strong>{gameState.currentPlayer.name}</strong></p>
              <p>生肖: {gameState.currentPlayer.zodiac}</p>
              <p>资金: ${gameState.currentPlayer.money}</p>
              <p>位置: {gameState.currentPlayer.position}</p>
            </div>
          )}
        </div>

        {/* 双环大富翁棋盘 */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '15px', textAlign: 'center' }}>🎲 双环十二生肖棋盘</h3>
          <div style={{
            width: '700px',
            height: '700px',
            margin: '0 auto',
            position: 'relative',
            border: '3px solid #2d3748',
            borderRadius: '12px',
            background: 'linear-gradient(45deg, #e6fffa 0%, #f0fff4 50%, #fef5e7 100%)'
          }}>
            {/* 外环格子 (40个) */}
            {Array.from({ length: 40 }, (_, index) => {
              const position = index;
              const playersOnCell = gameState.players.filter(p => p.position === position);
              
              // 计算外环格子位置 (沿着棋盘边缘)
              let x = 0, y = 0;
              const cellSize = 50;
              const boardSize = 700;
              
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
              const getOuterSpecialCell = (pos: number) => {
                if (pos === 0) return { name: '起点', color: '#48bb78', icon: '🏠', ring: '外环', type: 'start', price: 0 };
                if (pos === 10) return { name: '监狱', color: '#e53e3e', icon: '🔒', ring: '外环', type: 'jail', price: 0 };
                if (pos === 20) return { name: '免费停车', color: '#9f7aea', icon: '🅿️', ring: '外环', type: 'free_parking', price: 0 };
                if (pos === 30) return { name: '入狱', color: '#e53e3e', icon: '👮', ring: '外环', type: 'go_to_jail', price: 0 };
                if ([5, 15, 25, 35].includes(pos)) return { name: '车站', color: '#4299e1', icon: '🚂', ring: '外环', type: 'station', price: 200 };
                if ([12, 28].includes(pos)) return { name: '电厂', color: '#ed8936', icon: '⚡', ring: '外环', type: 'utility', price: 150 };
                if ([2, 17, 33].includes(pos)) return { name: '机会', color: '#ffd700', icon: '❓', ring: '外环', type: 'chance', price: 0 };
                if ([7, 22, 36].includes(pos)) return { name: '命运', color: '#ff6b6b', icon: '🎭', ring: '外环', type: 'community', price: 0 };
                
                // 可购买地产
                const propertyPrices = [60, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 350, 400];
                const propertyIndex = [1, 3, 4, 6, 8, 9, 11, 13, 14, 16, 18, 19, 21, 23, 24, 26, 27, 29, 31, 32, 34, 37, 38, 39].indexOf(pos);
                const price = propertyIndex >= 0 ? propertyPrices[propertyIndex % propertyPrices.length] : 100;
                
                return { name: `地产${pos}`, color: '#e2e8f0', icon: '🏢', ring: '外环', type: 'property', price };
              };

              const cellInfo = getOuterSpecialCell(position);

              return (
                <div
                  key={`outer-${position}`}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    width: '50px',
                    height: '50px',
                    border: '2px solid #2d3748',
                    background: cellInfo.color,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    borderRadius: '6px',
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
              const innerCellSize = 40;
              const innerRingOffset = 150; // 距离边缘的距离
              const innerBoardSize = 700 - (innerRingOffset * 2);
              
              if (index <= 6) {
                // 内环底边 (从右到左)
                x = innerRingOffset + innerBoardSize - innerCellSize - (index * (innerBoardSize - innerCellSize) / 6);
                y = 700 - innerRingOffset - innerCellSize;
              } else if (index <= 12) {
                // 内环左边 (从下到上)
                x = innerRingOffset;
                y = 700 - innerRingOffset - innerCellSize - ((index - 6) * (innerBoardSize - innerCellSize) / 6);
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
                    width: '40px',
                    height: '40px',
                    border: '2px solid #553c9a',
                    background: innerCellInfo.color,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '7px',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: playersOnInnerCell.length > 0 ? '0 0 8px rgba(138, 43, 226, 0.8)' : '0 2px 4px rgba(85, 60, 154, 0.3)'
                  }}
                  onClick={() => handleUIInteraction('cellClick', { position, cellInfo: innerCellInfo })}
                  title={`${innerCellInfo.name} (${innerCellInfo.ring}) - 位置${position} - 价格$${innerCellInfo.price}`}
                >
                  <div style={{ fontSize: '12px' }}>{innerCellInfo.icon}</div>
                  <div style={{ fontSize: '6px', textAlign: 'center', marginTop: '1px' }}>
                    {position}
                  </div>
                  
                  {/* 显示在内环格子上的玩家 */}
                  {playersOnInnerCell.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-18px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '1px'
                    }}>
                      {playersOnInnerCell.map((player, idx) => (
                        <div
                          key={player.id}
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: getPlayerColor(player.zodiac),
                            color: 'white',
                            fontSize: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            zIndex: 300 + idx
                          }}
                          title={`${player.name} (${player.zodiac}) - 内环`}
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
              width: '200px',
              height: '200px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #553c9a',
              boxShadow: '0 8px 32px rgba(85, 60, 154, 0.3)',
              textAlign: 'center'
            }}>
              <h2 style={{ color: '#553c9a', fontSize: '1.2rem', marginBottom: '8px' }}>
                🎲 双环大富翁
              </h2>
              <div style={{ color: '#4a5568', fontSize: '0.85rem' }}>
                <p><strong>回合:</strong> {gameState.round}</p>
                <p><strong>阶段:</strong> {gameState.gamePhase}</p>
                {gameState.currentPlayer && (
                  <>
                    <p style={{ marginTop: '8px', fontSize: '0.9rem', fontWeight: 'bold', color: '#553c9a' }}>
                      {gameState.currentPlayer.name}
                    </p>
                    <p style={{ fontSize: '0.8rem' }}>
                      {gameState.currentPlayer.zodiac} | ${gameState.currentPlayer.money}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#718096' }}>
                      {gameState.currentPlayer.position >= 100 ? '内环' : '外环'} {gameState.currentPlayer.position}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* 环之间的连接通道 */}
            <div style={{
              position: 'absolute',
              top: '25px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '30px',
              height: '30px',
              background: '#4299e1',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #2d3748',
              cursor: 'pointer',
              fontSize: '16px'
            }} title="外环→内环通道">
              🔄
            </div>

            <div style={{
              position: 'absolute',
              bottom: '25px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '30px',
              height: '30px',
              background: '#ed8936',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #2d3748',
              cursor: 'pointer',
              fontSize: '16px'
            }} title="内环→外环通道">
              🔄
            </div>
          </div>
        </div>

        {/* 玩家列表 - 简化版 */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '15px' }}>玩家状态</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px'
          }}>
            {gameState.players.map((player, index) => (
              <div key={player.id} style={{
                background: player.id === gameState.currentPlayer?.id ? '#ffd89b' : '#f7fafc',
                padding: '15px',
                borderRadius: '8px',
                border: player.id === gameState.currentPlayer?.id ? '2px solid #ed8936' : '1px solid #e2e8f0',
                fontSize: '0.9rem'
              }}>
                <div style={{ fontWeight: 'bold', color: '#2d3748', marginBottom: '8px' }}>
                  {player.name} {player.isHuman ? '👤' : '🤖'}
                </div>
                <div style={{ marginBottom: '4px' }}>生肖: {player.zodiac} | 资金: ${player.money}</div>
                <div style={{ marginBottom: '4px' }}>位置: {player.position} ({player.position >= 100 ? '内环' : '外环'})</div>
                <div style={{ marginBottom: '4px' }}>拥有资产: {player.properties?.length || 0} 处</div>
                {/* 调试信息 */}
                {!player.isHuman && (
                  <div style={{ fontSize: '0.7rem', color: '#999', marginBottom: '4px' }}>
                    调试UI: {JSON.stringify(player.properties)}<br/>
                    引擎数据: {gameEngineRef.current ? JSON.stringify(gameEngineRef.current.getGameState()?.players.find(p => p.id === player.id)?.properties) : 'N/A'}
                  </div>
                )}
                {player.properties && Array.isArray(player.properties) && player.properties.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px' }}>
                    <strong>资产列表:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {player.properties.map((prop: any) => (
                        <span key={prop.position} style={{
                          background: '#e2e8f0',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem'
                        }}>
                          {prop.position}({prop.level || 0}级)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 游戏控制 */}
        {gameState.currentPlayer && gameState.currentPlayer.isHuman && gameState.isPlaying && (
          <div style={{
            background: '#e6fffa',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>你的回合</h3>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {gameState.gamePhase === 'roll_dice' && (
                <button
                  onClick={() => handlePlayerAction({ type: 'roll_dice' })}
                  style={{
                    padding: '12px 24px',
                    fontSize: '1.1rem',
                    background: '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  🎲 掷骰子
                </button>
              )}
              
              {gameState.gamePhase === 'property_action' && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handlePlayerAction({ type: 'buy_property' })}
                    style={{
                      padding: '12px 24px',
                      fontSize: '1.1rem',
                      background: '#38a169',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    💰 购买地产
                  </button>
                  <button
                    onClick={() => handlePlayerAction({ type: 'skip_purchase' })}
                    style={{
                      padding: '12px 24px',
                      fontSize: '1.1rem',
                      background: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    ❌ 跳过购买
                  </button>
                </div>
              )}
              
              {gameState.gamePhase === 'pay_rent' && (
                <button
                  onClick={() => handlePlayerAction({ type: 'pay_rent' })}
                  style={{
                    padding: '12px 24px',
                    fontSize: '1.1rem',
                    background: '#d69e2e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  💳 支付租金
                </button>
              )}
              
              {gameState.gamePhase === 'upgrade_property' && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handlePlayerAction({ type: 'upgrade_property' })}
                    style={{
                      padding: '12px 24px',
                      fontSize: '1.1rem',
                      background: '#9f7aea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    🏗️ 升级地产
                  </button>
                  <button
                    onClick={() => handlePlayerAction({ type: 'skip_upgrade' })}
                    style={{
                      padding: '12px 24px',
                      fontSize: '1.1rem',
                      background: '#718096',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    ⏭️ 跳过升级
                  </button>
                </div>
              )}
              
              <button
                onClick={() => handlePlayerAction({ type: 'end_turn' })}
                style={{
                  padding: '12px 24px',
                  fontSize: '1.1rem',
                  background: '#4299e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                ⏭️ 结束回合
              </button>
            </div>
          </div>
        )}

        {/* 骰子结果 */}
        {visualEffects.diceRoll.showResult && (
          <div style={{
            background: '#fff5f5',
            border: '2px solid #fc8181',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#c53030' }}>骰子结果</h3>
            <p style={{ fontSize: '1.5rem', margin: 0 }}>
              🎲 {visualEffects.diceRoll.result?.value1 || 0} + {visualEffects.diceRoll.result?.value2 || 0} = {visualEffects.diceRoll.result?.sum || 0}
            </p>
          </div>
        )}

        {/* 地产信息显示 */}
        {gameState.currentPlayer && gameState.currentPlayer.isHuman && gameState.gamePhase === 'property_action' && (
          <div style={{
            background: '#f0fff4',
            border: '2px solid #68d391',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2f855a' }}>🏢 地产信息</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.95rem' }}>
              <div>
                <p><strong>位置:</strong> {gameState.currentPlayer.position}</p>
                <p><strong>名称:</strong> 地产{gameState.currentPlayer.position}</p>
                <p><strong>环:</strong> {gameState.currentPlayer.position >= 100 ? '内环' : '外环'}</p>
              </div>
              <div>
                <p><strong>价格:</strong> ${gameState.currentPlayer.position >= 100 ? '400-800' : '60-400'}</p>
                <p><strong>状态:</strong> 可购买</p>
                <p><strong>你的资金:</strong> ${gameState.currentPlayer.money}</p>
              </div>
            </div>
          </div>
        )}

        {/* 租金信息显示 */}
        {gameState.currentPlayer && gameState.currentPlayer.isHuman && gameState.gamePhase === 'pay_rent' && (
          <div style={{
            background: '#fffaf0',
            border: '2px solid #ed8936',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#c05621' }}>💳 需要支付租金</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.95rem' }}>
              <div>
                <p><strong>位置:</strong> {gameState.currentPlayer.position}</p>
                <p><strong>地产名称:</strong> 地产{gameState.currentPlayer.position}</p>
                <p><strong>业主:</strong> AI玩家</p>
              </div>
              <div>
                <p><strong>租金:</strong> $50-200</p>
                <p><strong>你的资金:</strong> ${gameState.currentPlayer.money}</p>
                <p style={{ color: gameState.currentPlayer.money < 100 ? '#e53e3e' : '#38a169' }}>
                  <strong>{gameState.currentPlayer.money < 100 ? '资金不足!' : '资金充足'}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 游戏控制按钮 */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '20px'
        }}>
          <button
            onClick={togglePause}
            disabled={!gameState.isPlaying}
            style={{
              padding: '10px 20px',
              background: gameState.isPaused ? '#48bb78' : '#ed8936',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
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
              padding: '10px 20px',
              background: '#9f7aea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: gameState.isPlaying ? 'pointer' : 'not-allowed',
              opacity: gameState.isPlaying ? 1 : 0.5
            }}
          >
            💾 保存游戏
          </button>
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

  // 备用代码 - 如果需要回退到旧界面
  const renderOldInterface = () => (
    <div className="game-loop-container" style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '20px'
    }}>
      {/* 游戏棋盘 */}
      <GameBoard
        players={gameState.players.map(p => ({
          ...p,
          color: getPlayerColor(p.zodiac)
        }))}
        currentPlayer={gameState.currentPlayer}
        diceResult={visualEffects.diceRoll.result}
        showDiceAnimation={visualEffects.diceRoll.showResult}
        onCellClick={(position) => handleUIInteraction('cellClick', { position })}
      />

      {/* 简化的游戏控制界面 */}
      {gameState.currentPlayer && gameState.currentPlayer.isHuman && gameState.isPlaying && (
        <SimpleGameControls
          onDiceRoll={() => handlePlayerAction({ type: 'roll_dice' })}
          onEndTurn={() => handlePlayerAction({ type: 'end_turn' })}
          onSkillUse={(skillId) => handlePlayerAction({ type: 'use_skill', skillId })}
          canRollDice={gameState.gamePhase === 'roll_dice'}
          currentPhase={gameState.gamePhase}
          playerName={gameState.currentPlayer.name}
          playerMoney={gameState.currentPlayer.money}
        />
      )}

      {/* 玩家信息面板 */}
      <div className="players-panel">
        <EnhancedPlayerList
          players={gameState.players}
          gameState={gameState}
          currentPlayer={gameState.currentPlayer}
          onPlayerSelect={(playerId) => handleUIInteraction('showPlayerDetails', { playerId })}
          onSkillUse={(playerId, skillId) => handlePlayerAction({ type: 'use_skill', playerId, skillId })}
        />
      </div>

      {/* 游戏控制面板 */}
      <div className="game-controls">
        <button 
          className="pause-button"
          onClick={togglePause}
          disabled={!gameState.isPlaying}
        >
          {gameState.isPaused ? '恢复' : '暂停'}
        </button>
        
        <button 
          className="save-button"
          onClick={() => saveGame()}
          disabled={!gameState.isPlaying}
        >
          保存
        </button>
        
        <button 
          className="menu-button"
          onClick={() => handleUIInteraction('toggleGameMenu', {})}
        >
          菜单
        </button>
      </div>

      {/* 通知系统 */}
      <div className="notifications">
        {uiState.notifications.map(notification => (
          <div 
            key={notification.id}
            className={`notification notification-${notification.type}`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* 游戏菜单 */}
      {uiState.showGameMenu && (
        <div className="game-menu-overlay">
          <div className="game-menu">
            <h3>游戏菜单</h3>
            <button onClick={() => handleUIInteraction('toggleSettings', {})}>
              设置
            </button>
            <button onClick={() => saveGame()}>
              保存游戏
            </button>
            <button onClick={() => handleUIInteraction('toggleGameMenu', {})}>
              返回游戏
            </button>
          </div>
        </div>
      )}

      {/* 玩家详情弹窗 */}
      {uiState.showPlayerDetails && uiState.selectedPlayerId && (
        <div className="player-details-overlay">
          <div className="player-details-modal">
            <button 
              className="close-button"
              onClick={() => handleUIInteraction('hidePlayerDetails', {})}
            >
              ×
            </button>
            {gameState.players.find(p => p.id === uiState.selectedPlayerId) && (
              <EnhancedPlayerCard
                player={gameState.players.find(p => p.id === uiState.selectedPlayerId)!}
                gameState={gameState}
                isCurrentPlayer={uiState.selectedPlayerId === gameState.currentPlayer?.id}
                isCompact={false}
                showDetails={true}
                onSkillUse={(skillId) => handlePlayerAction({ type: 'use_skill', playerId: uiState.selectedPlayerId, skillId })}
                className="modal-player-card"
              />
            )}
          </div>
        </div>
      )}

      {/* 游戏状态指示器 */}
      <div className="game-status">
        <div className="phase-indicator">
          阶段: {gameState.gamePhase}
        </div>
        <div className="round-indicator">
          回合: {gameState.round}
        </div>
        {gameState.currentPlayer && (
          <div className="current-player-indicator">
            当前: {gameState.currentPlayer.name}
          </div>
        )}
      </div>

      {/* 视觉效果组件 */}
      <DiceRollAnimation
        isRolling={visualEffects.diceRoll.isRolling}
        result={visualEffects.diceRoll.result}
        onAnimationComplete={() => {
          setVisualEffects(prev => ({
            ...prev,
            diceRoll: { ...prev.diceRoll, showResult: false }
          }));
        }}
      />

      <PlayerMoveAnimation
        isMoving={visualEffects.playerMove.isMoving}
        playerName={visualEffects.playerMove.playerName}
        fromPosition={visualEffects.playerMove.fromPosition}
        toPosition={visualEffects.playerMove.toPosition}
        onAnimationComplete={() => {
          setVisualEffects(prev => ({
            ...prev,
            playerMove: { ...prev.playerMove, isMoving: false }
          }));
        }}
      />

      <GameEventNotification
        event={visualEffects.gameEvent}
        onClose={() => {
          setVisualEffects(prev => ({
            ...prev,
            gameEvent: null
          }));
        }}
      />

      <MoneyAnimation
        show={visualEffects.moneyAnimation.show}
        amount={visualEffects.moneyAnimation.amount}
        isGain={visualEffects.moneyAnimation.isGain}
        position={visualEffects.moneyAnimation.position}
        onAnimationComplete={() => {
          setVisualEffects(prev => ({
            ...prev,
            moneyAnimation: { ...prev.moneyAnimation, show: false }
          }));
        }}
      />
    </div>
  );
};

export default GameLoop;