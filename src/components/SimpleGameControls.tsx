/**
 * 简化的游戏控制组件 - 确保基本操作可用
 */

import React, { useState } from 'react';

interface SimpleGameControlsProps {
  onDiceRoll: () => void;
  onEndTurn: () => void;
  onSkillUse?: (skillId: string) => void;
  canRollDice?: boolean;
  currentPhase?: string;
  playerName?: string;
  playerMoney?: number;
}

export const SimpleGameControls: React.FC<SimpleGameControlsProps> = ({
  onDiceRoll,
  onEndTurn,
  onSkillUse,
  canRollDice = true,
  currentPhase = 'roll_dice',
  playerName = '玩家',
  playerMoney = 0
}) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleDiceRoll = async () => {
    if (!canRollDice || isRolling) return;
    
    setIsRolling(true);
    try {
      await onDiceRoll();
    } catch (error) {
      console.error('掷骰子失败:', error);
    } finally {
      setTimeout(() => setIsRolling(false), 1000);
    }
  };

  const handleEndTurn = async () => {
    try {
      await onEndTurn();
    } catch (error) {
      console.error('结束回合失败:', error);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '24px',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
      color: 'white',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* 玩家信息 */}
      <div style={{ 
        marginBottom: '20px', 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '15px',
        padding: '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '1.3rem', 
          fontWeight: '600',
          background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>🎮 {playerName}</h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '0.9rem',
          opacity: 0.9 
        }}>
          <span>💰 ¥{playerMoney.toLocaleString()}</span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem'
          }}>
            📋 {getPhaseDisplayName(currentPhase)}
          </span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center',
        alignItems: 'center' 
      }}>
        {/* 掷骰子按钮 */}
        <button
          onClick={handleDiceRoll}
          disabled={!canRollDice || isRolling}
          style={{
            padding: '16px 28px',
            fontSize: '1.1rem',
            fontWeight: '600',
            background: canRollDice && !isRolling 
              ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffc107 100%)' 
              : 'linear-gradient(135deg, #666 0%, #888 100%)',
            color: canRollDice && !isRolling ? '#2d3748' : '#a0aec0',
            border: canRollDice && !isRolling 
              ? '2px solid rgba(255, 215, 0, 0.3)' 
              : '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '30px',
            cursor: canRollDice && !isRolling ? 'pointer' : 'not-allowed',
            boxShadow: canRollDice && !isRolling 
              ? '0 8px 25px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
              : '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isRolling ? 'scale(0.95)' : 'scale(1)',
            minWidth: '140px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (canRollDice && !isRolling) {
              e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 215, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (canRollDice && !isRolling) {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
            }
          }}
        >
          {isRolling ? '🎲 掷骰中...' : '🎲 掷骰子'}
        </button>

        {/* 结束回合按钮 */}
        <button
          onClick={handleEndTurn}
          style={{
            padding: '16px 28px',
            fontSize: '1.1rem',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #4299e1 0%, #63b3ed 50%, #90cdf4 100%)',
            color: 'white',
            border: '2px solid rgba(66, 153, 225, 0.3)',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(66, 153, 225, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '140px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(66, 153, 225, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(66, 153, 225, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
        >
          ⏭️ 结束回合
        </button>

        {/* 技能按钮 */}
        <button
          onClick={() => onSkillUse?.('default_skill')}
          style={{
            padding: '16px 24px',
            fontSize: '1.1rem',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #9f7aea 0%, #b794f6 50%, #d6bcfa 100%)',
            color: 'white',
            border: '2px solid rgba(159, 122, 234, 0.3)',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(159, 122, 234, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: '120px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(159, 122, 234, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(159, 122, 234, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
        >
          ⚡ 技能
        </button>
      </div>

      {/* 操作提示 */}
      <div style={{ 
        marginTop: '20px', 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '12px 16px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(5px)'
      }}>
        <div style={{
          fontSize: '0.9rem',
          fontWeight: '500',
          opacity: 0.9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          {currentPhase === 'roll_dice' ? (
            <>
              <span style={{ fontSize: '1.2rem' }}>🎲</span>
              <span>点击"掷骰子"开始您的回合</span>
            </>
          ) : currentPhase === 'process_cell' ? (
            <>
              <span style={{ fontSize: '1.2rem' }}>🎯</span>
              <span>处理当前格子的事件</span>
            </>
          ) : currentPhase === 'end_turn' ? (
            <>
              <span style={{ fontSize: '1.2rem' }}>⏭️</span>
              <span>点击"结束回合"让下一位玩家开始</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.2rem' }}>🎮</span>
              <span>等待轮到您的回合...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 辅助函数：获取阶段显示名称
const getPhaseDisplayName = (phase: string): string => {
  const phaseNames: Record<string, string> = {
    'waiting': '等待开始',
    'roll_dice': '掷骰阶段',
    'move_player': '移动中',
    'process_cell': '处理格子',
    'handle_event': '事件处理',
    'end_turn': '回合结束',
    'check_win': '胜利检查',
    'game_over': '游戏结束'
  };
  return phaseNames[phase] || phase;
};

export default SimpleGameControls;