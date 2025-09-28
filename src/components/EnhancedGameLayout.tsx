/**
 * 增强版游戏布局组件 - 解决遮挡问题，提升视觉质量
 */

import React, { useState, useRef, useEffect } from 'react';
import { GameBoard } from './GameBoard';
import { DiceRollAnimation, PlayerMoveAnimation, GameEventNotification, MoneyAnimation } from './GameVisualEffects';

interface Player {
  id: string;
  name: string;
  zodiac: string;
  position: number;
  money: number;
  color: string;
  isHuman: boolean;
}

interface EnhancedGameLayoutProps {
  players: Player[];
  currentPlayer: Player | null;
  gamePhase: string;
  round: number;
  visualEffects: any;
  onDiceRoll: () => void;
  onEndTurn: () => void;
  onSkillUse: (skillId: string) => void;
  onCellClick?: (position: number) => void;
  setVisualEffects: (fn: (prev: any) => any) => void;
}

export const EnhancedGameLayout: React.FC<EnhancedGameLayoutProps> = ({
  players,
  currentPlayer,
  gamePhase,
  round,
  visualEffects,
  onDiceRoll,
  onEndTurn,
  onSkillUse,
  onCellClick,
  setVisualEffects
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 处理掷骰子
  const handleDiceRoll = async () => {
    if (!currentPlayer || isRolling || gamePhase !== 'roll_dice') return;
    setIsRolling(true);
    await onDiceRoll();
    setTimeout(() => setIsRolling(false), 2000);
  };

  // 获取阶段显示名称
  const getPhaseDisplayName = (phase: string): string => {
    const phaseNames: Record<string, string> = {
      'waiting': '等待开始',
      'roll_dice': '掷骰阶段',
      'move_player': '移动中',
      'process_cell': '处理格子',
      'handle_event': '事件处理',
      'end_turn': '回合结束',
      'ai_turn': 'AI回合',
      'check_win': '胜利检查',
      'game_over': '游戏结束'
    };
    return phaseNames[phase] || phase;
  };

  return (
    <div 
      ref={layoutRef}
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d1b69 100%)',
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? '1fr' 
          : sidebarCollapsed ? '60px 1fr' : '320px 1fr',
        gridTemplateRows: isMobile 
          ? '60px 1fr 100px' 
          : '80px 1fr 120px',
        gridTemplateAreas: isMobile
          ? `
            "header"
            "main"
            "controls"
          `
          : `
            "header header"
            "sidebar main"
            "controls controls"
          `,
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* 顶部标题栏 */}
      <div style={{
        gridArea: 'header',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 15px' : '0 30px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px' }}>
          <h1 style={{ 
            fontSize: isMobile ? '1.2rem' : '1.8rem', 
            fontWeight: 'bold', 
            margin: 0,
            background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {isMobile ? '🎲 十二生肖' : '🎲 十二生肖大富翁'}
          </h1>
          {!isMobile && (
            <div style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              第 {round} 回合 • {getPhaseDisplayName(gamePhase)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {currentPlayer && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '25px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: currentPlayer.color || '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}>
                {currentPlayer.zodiac}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {currentPlayer.name}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  ¥{currentPlayer.money.toLocaleString()}
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowPlayerStats(!showPlayerStats)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            📊
          </button>
        </div>
      </div>

      {/* 左侧玩家信息栏 */}
      {!isMobile && (
        <div style={{
          gridArea: 'sidebar',
          background: 'linear-gradient(180deg, #1e1e3f 0%, #2a2a5a 100%)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ 
            color: 'white', 
            margin: 0, 
            fontSize: sidebarCollapsed ? '0' : '1.1rem',
            opacity: sidebarCollapsed ? 0 : 1,
            transition: 'all 0.3s ease'
          }}>
            👥 玩家列表
          </h3>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.2rem',
              cursor: 'pointer',
              transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          >
            ◀
          </button>
        </div>

        <div style={{
          flex: 1,
          padding: sidebarCollapsed ? '10px 5px' : '20px',
          overflow: 'auto'
        }}>
          {players.map((player, index) => (
            <div
              key={player.id}
              style={{
                background: player.id === currentPlayer?.id 
                  ? 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.1) 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: player.id === currentPlayer?.id 
                  ? '2px solid #ffd700' 
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: sidebarCollapsed ? '8px' : '16px',
                marginBottom: '12px',
                color: 'white',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = player.id === currentPlayer?.id 
                  ? 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.1) 100%)'
                  : 'rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {player.id === currentPlayer?.id && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  height: '3px',
                  background: 'linear-gradient(90deg, #ffd700, #ffed4e)',
                  animation: 'pulse 2s infinite'
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: sidebarCollapsed ? '24px' : '40px',
                  height: sidebarCollapsed ? '24px' : '40px',
                  borderRadius: '50%',
                  background: player.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: sidebarCollapsed ? '0.8rem' : '1.2rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}>
                  {player.zodiac}
                </div>

                {!sidebarCollapsed && (
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: 'bold',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {player.name}
                      {player.isHuman ? '👤' : '🤖'}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      opacity: 0.8,
                      marginBottom: '4px'
                    }}>
                      💰 ¥{player.money.toLocaleString()}
                    </div>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      opacity: 0.6,
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <span>📍 第{player.position}格</span>
                      <span>🏆 #{index + 1}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* 移动端浮动玩家信息 */}
      {isMobile && currentPlayer && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '10px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '15px',
          padding: '12px',
          zIndex: 200,
          color: 'white',
          fontSize: '0.8rem',
          minWidth: '150px'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: currentPlayer.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem'
            }}>
              {currentPlayer.zodiac}
            </div>
            {currentPlayer.name}
          </div>
          <div>💰 ¥{currentPlayer.money.toLocaleString()}</div>
          <div>📍 第{currentPlayer.position}格</div>
          <div style={{ 
            fontSize: '0.7rem', 
            opacity: 0.8,
            marginTop: '4px',
            padding: '2px 6px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            {getPhaseDisplayName(gamePhase)}
          </div>
        </div>
      )}

      {/* 中央游戏区域 */}
      <div style={{
        gridArea: 'main',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 背景装饰 */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: `
            radial-gradient(circle at 20% 20%, rgba(103, 126, 234, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 70%)
          `,
          pointerEvents: 'none'
        }} />

        {/* 游戏棋盘 */}
        <div style={{
          transform: isMobile ? 'scale(0.7)' : 'scale(0.9)',
          transformOrigin: 'center',
          zIndex: 1
        }}>
          <GameBoard
            players={players}
            currentPlayer={currentPlayer}
            diceResult={visualEffects.diceRoll.result}
            showDiceAnimation={visualEffects.diceRoll.showResult}
            onCellClick={onCellClick}
          />
        </div>
      </div>

      {/* 底部控制面板 */}
      <div style={{
        gridArea: 'controls',
        background: 'linear-gradient(90deg, #1e1e3f 0%, #2a2a5a 100%)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
      }}>
        {currentPlayer && currentPlayer.isHuman && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '10px' : '20px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            padding: isMobile ? '15px 20px' : '20px 40px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            width: isMobile ? 'calc(100% - 20px)' : 'auto'
          }}>
            {/* 掷骰子按钮 */}
            <button
              onClick={handleDiceRoll}
              disabled={gamePhase !== 'roll_dice' || isRolling}
              style={{
                padding: isMobile ? '12px 24px' : '16px 32px',
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 'bold',
                background: gamePhase === 'roll_dice' && !isRolling
                  ? 'linear-gradient(45deg, #ffd700, #ffed4e)'
                  : 'linear-gradient(45deg, #666, #888)',
                color: gamePhase === 'roll_dice' && !isRolling ? '#333' : '#ccc',
                border: 'none',
                borderRadius: '15px',
                cursor: gamePhase === 'roll_dice' && !isRolling ? 'pointer' : 'not-allowed',
                boxShadow: gamePhase === 'roll_dice' && !isRolling
                  ? '0 8px 25px rgba(255, 215, 0, 0.4)'
                  : 'none',
                transition: 'all 0.3s ease',
                transform: isRolling ? 'scale(0.95)' : 'scale(1)',
                minWidth: isMobile ? '120px' : '140px',
                width: isMobile ? '100%' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (gamePhase === 'roll_dice' && !isRolling) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 215, 0, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (gamePhase === 'roll_dice' && !isRolling) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.4)';
                }
              }}
            >
              🎲 {isRolling ? '掷骰中...' : '掷骰子'}
            </button>

            {/* 分隔线 */}
            {!isMobile && (
              <div style={{
                width: '1px',
                height: '40px',
                background: 'rgba(255,255,255,0.2)'
              }} />
            )}

            {/* 技能按钮 */}
            <button
              onClick={() => onSkillUse('default_skill')}
              style={{
                padding: isMobile ? '12px 20px' : '16px 28px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #9f7aea, #b794f6)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(159, 122, 234, 0.3)',
                transition: 'all 0.3s ease',
                minWidth: isMobile ? '100px' : '120px',
                width: isMobile ? '100%' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(159, 122, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(159, 122, 234, 0.3)';
              }}
            >
              ⚡ 技能
            </button>

            {/* 分隔线 */}
            {!isMobile && (
              <div style={{
                width: '1px',
                height: '40px',
                background: 'rgba(255,255,255,0.2)'
              }} />
            )}

            {/* 结束回合按钮 */}
            <button
              onClick={onEndTurn}
              style={{
                padding: isMobile ? '12px 20px' : '16px 28px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #4299e1, #63b3ed)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(66, 153, 225, 0.3)',
                transition: 'all 0.3s ease',
                minWidth: isMobile ? '100px' : '120px',
                width: isMobile ? '100%' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(66, 153, 225, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(66, 153, 225, 0.3)';
              }}
            >
              ⏭️ 结束回合
            </button>
          </div>
        )}

        {/* AI回合指示 */}
        {currentPlayer && !currentPlayer.isHuman && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            background: 'linear-gradient(135deg, rgba(255,152,0,0.2) 0%, rgba(255,152,0,0.1) 100%)',
            padding: '20px 40px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,152,0,0.3)',
            color: 'white'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #ff9800, #ffb74d)',
              animation: 'spin 2s linear infinite'
            }} />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                🤖 {currentPlayer.name} 正在思考...
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                AI正在分析最佳策略
              </div>
            </div>
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

      {/* CSS 动画 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EnhancedGameLayout;