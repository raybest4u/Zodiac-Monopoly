/**
 * 游戏棋盘组件 - 十二生肖大富翁
 */

import React, { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  zodiac: string;
  position: number;
  money: number;
  color: string;
}

interface GameBoardProps {
  players: Player[];
  currentPlayer: Player | null;
  onCellClick?: (position: number) => void;
  diceResult?: number[];
  showDiceAnimation?: boolean;
}

// 棋盘格子配置
const BOARD_CELLS = [
  { id: 0, name: '起点', type: 'start', icon: '🏠', color: '#4CAF50' },
  { id: 1, name: '鼠年商街', type: 'property', icon: '🐭', color: '#2196F3' },
  { id: 2, name: '机会', type: 'chance', icon: '❓', color: '#FF9800' },
  { id: 3, name: '牛年农场', type: 'property', icon: '🐮', color: '#4CAF50' },
  { id: 4, name: '税收', type: 'tax', icon: '💰', color: '#F44336' },
  { id: 5, name: '虎年森林', type: 'property', icon: '🐅', color: '#FF5722' },
  { id: 6, name: '监狱', type: 'jail', icon: '🏢', color: '#9E9E9E' },
  { id: 7, name: '兔年花园', type: 'property', icon: '🐰', color: '#E91E63' },
  { id: 8, name: '命运', type: 'destiny', icon: '🔮', color: '#9C27B0' },
  { id: 9, name: '龙年宫殿', type: 'property', icon: '🐉', color: '#3F51B5' },
  { id: 10, name: '免费停车', type: 'parking', icon: '🅿️', color: '#607D8B' },
  { id: 11, name: '蛇年神庙', type: 'property', icon: '🐍', color: '#009688' },
  { id: 12, name: '马年赛场', type: 'property', icon: '🐎', color: '#795548' },
  { id: 13, name: '羊年牧场', type: 'property', icon: '🐑', color: '#8BC34A' },
  { id: 14, name: '猴年山林', type: 'property', icon: '🐵', color: '#FFC107' },
  { id: 15, name: '鸡年农庄', type: 'property', icon: '🐓', color: '#FF9800' },
  { id: 16, name: '狗年守护', type: 'property', icon: '🐕', color: '#795548' },
  { id: 17, name: '机会', type: 'chance', icon: '❓', color: '#FF9800' },
  { id: 18, name: '猪年福地', type: 'property', icon: '🐷', color: '#E91E63' },
  { id: 19, name: '终点大奖', type: 'end', icon: '🏆', color: '#FFD700' }
];

export const GameBoard: React.FC<GameBoardProps> = ({
  players,
  currentPlayer,
  onCellClick,
  diceResult,
  showDiceAnimation = false
}) => {
  const [highlightedCell, setHighlightedCell] = useState<number | null>(null);
  const [animatingPlayers, setAnimatingPlayers] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 玩家颜色映射
  const playerColors: Record<string, string> = {
    '龙': '#e53e3e',
    '虎': '#ed8936', 
    '兔': '#ecc94b',
    '猴': '#d69e2e',
    '鼠': '#4299e1',
    '牛': '#48bb78',
    '蛇': '#9f7aea',
    '马': '#38b2ac',
    '羊': '#f56565',
    '鸡': '#38a169',
    '狗': '#805ad5',
    '猪': '#e53e3e'
  };

  // 计算棋盘布局位置
  const getBoardCellStyle = (index: number) => {
    const totalCells = BOARD_CELLS.length;
    const cellsPerSide = 5; // 每边5个格子
    const cellSize = isMobile ? 60 : 80;
    const gap = isMobile ? 3 : 4;
    
    let x = 0, y = 0;
    
    if (index < cellsPerSide) {
      // 底边
      x = index * (cellSize + gap);
      y = 4 * (cellSize + gap);
    } else if (index < cellsPerSide * 2) {
      // 右边
      x = 4 * (cellSize + gap);
      y = (4 - (index - cellsPerSide)) * (cellSize + gap);
    } else if (index < cellsPerSide * 3) {
      // 顶边
      x = (4 - (index - cellsPerSide * 2)) * (cellSize + gap);
      y = 0;
    } else {
      // 左边
      x = 0;
      y = (index - cellsPerSide * 3) * (cellSize + gap);
    }

    return {
      position: 'absolute' as const,
      left: `${x}px`,
      top: `${y}px`,
      width: `${cellSize}px`,
      height: `${cellSize}px`
    };
  };

  // 获取玩家在格子中的位置
  const getPlayerPositionInCell = (playerIndex: number) => {
    const positions = [
      { left: '5px', top: '5px' },
      { right: '5px', top: '5px' },
      { left: '5px', bottom: '5px' },
      { right: '5px', bottom: '5px' }
    ];
    return positions[playerIndex % 4];
  };

  return (
    <div style={{
      position: 'relative',
      width: isMobile ? '380px' : '500px',
      height: isMobile ? '380px' : '500px',
      margin: isMobile ? '10px auto' : '20px auto',
      background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(224, 242, 254, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: isMobile ? '20px' : '25px',
      boxShadow: '0 30px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2)',
      padding: isMobile ? '15px' : '20px',
      border: '2px solid rgba(255,255,255,0.3)'
    }}>
      {/* 中央区域 */}
      <div style={{
        position: 'absolute',
        left: isMobile ? '63px' : '84px',
        top: isMobile ? '63px' : '84px',
        width: isMobile ? '189px' : '248px',
        height: isMobile ? '189px' : '248px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '15px' : '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>🎲 十二生肖</h2>
        <h3 style={{ margin: '0 0 15px 0', fontSize: isMobile ? '1rem' : '1.2rem' }}>大富翁</h3>
        
        {/* 骰子区域 */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '10px',
          marginBottom: isMobile ? '12px' : '15px'
        }}>
          {diceResult && diceResult.map((value, index) => (
            <div
              key={index}
              style={{
                width: isMobile ? '30px' : '40px',
                height: isMobile ? '30px' : '40px',
                background: 'white',
                borderRadius: isMobile ? '6px' : '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: isMobile ? '1.2rem' : '1.5rem',
                fontWeight: 'bold',
                color: '#333',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                animation: showDiceAnimation ? 'diceRoll 0.6s ease-out' : 'none'
              }}
            >
              {value}
            </div>
          ))}
        </div>

        {/* 当前玩家信息 */}
        {currentPlayer && (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '12px' : '16px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: isMobile ? '12px' : '15px',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: isMobile ? '1rem' : '1.2rem', 
              fontWeight: '700', 
              marginBottom: isMobile ? '6px' : '8px',
              background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {currentPlayer.zodiac} {currentPlayer.name}
            </div>
            <div style={{ 
              fontSize: isMobile ? '0.85rem' : '1rem', 
              opacity: 0.95,
              marginBottom: '4px',
              fontWeight: '500'
            }}>
              💰 ¥{currentPlayer.money.toLocaleString()}
            </div>
            <div style={{ 
              fontSize: isMobile ? '0.75rem' : '0.85rem', 
              opacity: 0.85,
              background: 'rgba(255,255,255,0.1)',
              padding: isMobile ? '3px 6px' : '4px 8px',
              borderRadius: isMobile ? '6px' : '8px',
              display: 'inline-block'
            }}>
              📍 第 {currentPlayer.position} 格
            </div>
          </div>
        )}
      </div>

      {/* 棋盘格子 */}
      {BOARD_CELLS.map((cell, index) => {
        const cellPlayers = players.filter(p => p.position === cell.id);
        const isHighlighted = highlightedCell === cell.id;
        
        return (
          <div
            key={cell.id}
            style={{
              ...getBoardCellStyle(index),
              background: isHighlighted 
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.95) 0%, rgba(255, 237, 78, 0.95) 100%)'
                : `linear-gradient(135deg, ${cell.color}20 0%, ${cell.color}35 100%)`,
              backdropFilter: 'blur(10px)',
              border: `2px solid ${isHighlighted ? '#ffd700' : cell.color}`,
              borderRadius: '15px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHighlighted ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
              boxShadow: isHighlighted 
                ? '0 15px 35px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                : '0 8px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '6px'
            }}
            onClick={() => onCellClick?.(cell.id)}
            onMouseEnter={() => setHighlightedCell(cell.id)}
            onMouseLeave={() => setHighlightedCell(null)}
          >
            {/* 格子图标 */}
            <div style={{ fontSize: '1.8rem', marginBottom: '2px' }}>
              {cell.icon}
            </div>
            
            {/* 格子名称 */}
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 'bold',
              textAlign: 'center',
              color: cell.color,
              lineHeight: '1',
              maxHeight: '20px',
              overflow: 'hidden'
            }}>
              {cell.name}
            </div>

            {/* 玩家指示器 */}
            {cellPlayers.map((player, playerIndex) => (
              <div
                key={player.id}
                style={{
                  position: 'absolute',
                  ...getPlayerPositionInCell(playerIndex),
                  width: '18px',
                  height: '18px',
                  background: `linear-gradient(135deg, ${playerColors[player.zodiac] || '#666'} 0%, ${playerColors[player.zodiac] || '#888'}dd 100%)`,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  zIndex: 10,
                  animation: animatingPlayers.has(player.id) ? 'playerMove 0.6s ease-out' : 'none',
                  backdropFilter: 'blur(5px)'
                }}
                title={`${player.name} (${player.zodiac})`}
              >
                {player.zodiac}
              </div>
            ))}
          </div>
        );
      })}

      {/* CSS 动画 */}
      <style jsx>{`
        @keyframes diceRoll {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.2); }
          50% { transform: rotate(180deg) scale(1.1); }
          75% { transform: rotate(270deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes playerMove {
          0% { transform: scale(1); }
          50% { transform: scale(1.5); box-shadow: 0 0 20px rgba(255,215,0,0.6); }
          100% { transform: scale(1); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default GameBoard;