import React, { useMemo, useRef, useEffect, useState } from 'react';
import type { 
  DualRingBoardProps, 
  DualRingBoardConfig,
  ConnectionPath,
  DualRingAnimation,
  BoardCellProps,
  PlayerTokenProps
} from '../../types/ui-components';
import type { BoardCell, Player, ZodiacSign } from '../../types/game';
import { useResponsive, getResponsiveValue } from '../layout/ResponsiveLayout';
import './DualRingBoard.css';

// 默认双环配置
const DEFAULT_DUAL_RING_CONFIG: DualRingBoardConfig = {
  outerRing: {
    cellCount: 40,
    cellSize: { mobile: 30, tablet: 35, desktop: 40, large: 45 },
    borderRadius: 4,
    spacing: 2
  },
  innerRing: {
    cellCount: 16,
    cellSize: { mobile: 25, tablet: 30, desktop: 32, large: 35 },
    borderRadius: 4,
    spacing: 2
  },
  connections: [
    {
      id: 'path1',
      fromRing: 'outer',
      toRing: 'inner',
      fromPosition: 10,
      toPosition: 4,
      style: { color: '#2d3748', width: 3, animated: false }
    },
    {
      id: 'path2',
      fromRing: 'outer',
      toRing: 'inner',
      fromPosition: 30,
      toPosition: 12,
      style: { color: '#2d3748', width: 3, animated: false }
    }
  ],
  center: {
    size: { mobile: 80, tablet: 100, desktop: 120, large: 140 },
    content: {
      type: 'info',
      content: null,
      background: 'white',
      border: '#e2e8f0'
    }
  }
};

// 双环棋盘主组件
export const DualRingBoard: React.FC<DualRingBoardProps> = ({
  config = DEFAULT_DUAL_RING_CONFIG,
  board,
  players,
  currentPlayer,
  onCellClick,
  onPlayerMove,
  highlightedCells = [],
  animations = [],
  theme = 'light',
  interactive = true,
  className = ''
}) => {
  const { viewportSize } = useResponsive();
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardDimensions, setBoardDimensions] = useState({ width: 600, height: 600 });

  // 响应式配置值
  const outerCellSize = getResponsiveValue(config.outerRing.cellSize, viewportSize);
  const innerCellSize = getResponsiveValue(config.innerRing.cellSize, viewportSize);
  const centerSize = getResponsiveValue(config.center.size, viewportSize);

  // 计算棋盘尺寸
  const boardSize = useMemo(() => {
    const outerRingSize = (outerCellSize + config.outerRing.spacing) * config.outerRing.cellCount / Math.PI * 2;
    return Math.max(outerRingSize + outerCellSize * 2, 400);
  }, [outerCellSize, config]);

  // 更新棋盘尺寸
  useEffect(() => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setBoardDimensions({
        width: Math.min(rect.width, boardSize),
        height: Math.min(rect.height, boardSize)
      });
    }
  }, [boardSize, viewportSize]);

  // 分离外环和内环的格子
  const outerRingCells = board.slice(0, config.outerRing.cellCount);
  const innerRingCells = board.slice(config.outerRing.cellCount, config.outerRing.cellCount + config.innerRing.cellCount);

  return (
    <div 
      ref={boardRef}
      className={`dual-ring-board ${theme} ${className}`}
      style={{ 
        width: boardDimensions.width, 
        height: boardDimensions.height,
        position: 'relative'
      }}
    >
      {/* SVG容器用于连接路径 */}
      <svg
        className="board-connections"
        width={boardDimensions.width}
        height={boardDimensions.height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {config.connections.map((connection) => (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            boardSize={boardDimensions}
            outerCellSize={outerCellSize}
            innerCellSize={innerCellSize}
            outerRingCount={config.outerRing.cellCount}
            innerRingCount={config.innerRing.cellCount}
          />
        ))}
      </svg>

      {/* 外环 */}
      <RingContainer
        ring="outer"
        cells={outerRingCells}
        cellCount={config.outerRing.cellCount}
        cellSize={outerCellSize}
        boardSize={boardDimensions}
        players={players}
        highlightedPositions={highlightedCells.find(h => h.ring === 'outer')?.positions || []}
        interactive={interactive}
        theme={theme}
        onCellClick={(cell, position) => onCellClick?.(cell, 'outer', position)}
        onPlayerMove={(player, from, to) => onPlayerMove?.(player, from, to, 'outer')}
      />

      {/* 内环 */}
      <RingContainer
        ring="inner"
        cells={innerRingCells}
        cellCount={config.innerRing.cellCount}
        cellSize={innerCellSize}
        boardSize={boardDimensions}
        players={players}
        highlightedPositions={highlightedCells.find(h => h.ring === 'inner')?.positions || []}
        interactive={interactive}
        theme={theme}
        onCellClick={(cell, position) => onCellClick?.(cell, 'inner', position)}
        onPlayerMove={(player, from, to) => onPlayerMove?.(player, from, to, 'inner')}
        isInnerRing={true}
      />

      {/* 中央信息区域 */}
      <CenterInfo
        config={config.center}
        size={centerSize}
        boardSize={boardDimensions}
        currentPlayer={currentPlayer}
        theme={theme}
      />
    </div>
  );
};

// 环形容器组件
const RingContainer: React.FC<{
  ring: 'outer' | 'inner';
  cells: BoardCell[];
  cellCount: number;
  cellSize: number;
  boardSize: { width: number; height: number };
  players: Player[];
  highlightedPositions: number[];
  interactive: boolean;
  theme: string;
  isInnerRing?: boolean;
  onCellClick: (cell: BoardCell, position: number) => void;
  onPlayerMove: (player: Player, from: number, to: number) => void;
}> = ({
  ring,
  cells,
  cellCount,
  cellSize,
  boardSize,
  players,
  highlightedPositions,
  interactive,
  theme,
  isInnerRing = false,
  onCellClick,
  onPlayerMove
}) => {
  const radius = isInnerRing 
    ? boardSize.width * 0.25  // 内环半径
    : boardSize.width * 0.45; // 外环半径
  
  const centerX = boardSize.width / 2;
  const centerY = boardSize.height / 2;

  return (
    <div className={`ring-container ${ring}-ring`}>
      {cells.map((cell, index) => {
        const angle = (index / cellCount) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius - cellSize / 2;
        const y = centerY + Math.sin(angle) * radius - cellSize / 2;

        // 获取在此格子上的玩家
        const cellPlayers = players.filter(player => 
          player.position === (isInnerRing ? 40 + index : index)
        );

        return (
          <BoardCellComponent
            key={`${ring}-${index}`}
            cell={cell}
            ring={ring}
            position={index}
            size={cellSize}
            players={cellPlayers}
            highlighted={highlightedPositions.includes(index)}
            interactive={interactive}
            theme={theme}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `rotate(${angle + Math.PI / 2}rad)`
            }}
            onClick={() => onCellClick(cell, index)}
          />
        );
      })}
    </div>
  );
};

// 棋盘格子组件
const BoardCellComponent: React.FC<BoardCellProps & {
  style?: React.CSSProperties;
  onClick?: () => void;
}> = ({
  cell,
  ring,
  position,
  size,
  players,
  highlighted = false,
  interactive = true,
  theme = 'light',
  style,
  onClick
}) => {
  const cellStyle: React.CSSProperties = {
    ...style,
    width: size,
    height: size,
    cursor: interactive ? 'pointer' : 'default'
  };

  return (
    <div
      className={`board-cell ${ring}-cell ${highlighted ? 'highlighted' : ''} ${theme}`}
      style={cellStyle}
      onClick={interactive ? onClick : undefined}
      title={cell.name}
    >
      <div className="cell-content">
        {/* 格子背景颜色 */}
        <div 
          className="cell-background" 
          style={{ backgroundColor: cell.color }}
        />
        
        {/* 格子信息 */}
        <div className="cell-info">
          {cell.type === 'start' && <span className="cell-icon">🏠</span>}
          {cell.price && <span className="cell-price">¥{cell.price / 1000}K</span>}
          {cell.zodiac && <span className="cell-zodiac">{cell.zodiac}</span>}
        </div>

        {/* 玩家棋子 */}
        {players.length > 0 && (
          <div className="cell-players">
            {players.map((player, index) => (
              <PlayerToken
                key={player.id}
                player={player}
                size={size * 0.3}
                position={position}
                ring={ring}
                style={{
                  position: 'absolute',
                  top: index * (size * 0.15),
                  left: index * (size * 0.15)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 玩家棋子组件
const PlayerToken: React.FC<PlayerTokenProps & {
  style?: React.CSSProperties;
}> = ({
  player,
  size,
  position,
  ring,
  isMoving = false,
  isCurrentPlayer = false,
  theme = 'light',
  style,
  onClick
}) => {
  const tokenStyle: React.CSSProperties = {
    ...style,
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: getZodiacColor(player.zodiac),
    border: isCurrentPlayer ? '2px solid #ffd700' : '1px solid white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.6,
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    transform: isMoving ? 'scale(1.2)' : 'scale(1)',
    zIndex: isCurrentPlayer ? 10 : 5
  };

  return (
    <div
      className={`player-token ${isCurrentPlayer ? 'current' : ''} ${theme}`}
      style={tokenStyle}
      onClick={onClick}
      title={`${player.name} (${player.zodiac})`}
    >
      {player.zodiac}
    </div>
  );
};

// 连接路径组件
const ConnectionLine: React.FC<{
  connection: ConnectionPath;
  boardSize: { width: number; height: number };
  outerCellSize: number;
  innerCellSize: number;
  outerRingCount: number;
  innerRingCount: number;
}> = ({
  connection,
  boardSize,
  outerCellSize,
  innerCellSize,
  outerRingCount,
  innerRingCount
}) => {
  const centerX = boardSize.width / 2;
  const centerY = boardSize.height / 2;
  
  // 计算起点和终点坐标
  const getPosition = (ring: 'outer' | 'inner', position: number) => {
    const isOuter = ring === 'outer';
    const radius = isOuter ? boardSize.width * 0.45 : boardSize.width * 0.25;
    const count = isOuter ? outerRingCount : innerRingCount;
    const angle = (position / count) * 2 * Math.PI - Math.PI / 2;
    
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  };

  const startPos = getPosition(connection.fromRing, connection.fromPosition);
  const endPos = getPosition(connection.toRing, connection.toPosition);

  return (
    <g className="connection-path">
      <line
        x1={startPos.x}
        y1={startPos.y}
        x2={endPos.x}
        y2={endPos.y}
        stroke={connection.style.color}
        strokeWidth={connection.style.width}
        strokeDasharray={connection.style.dashArray}
        className={connection.style.animated ? 'animated' : ''}
      />
      {/* 连接点标记 */}
      <circle
        cx={startPos.x}
        cy={startPos.y}
        r={4}
        fill={connection.style.color}
        className="connection-point"
      />
      <circle
        cx={endPos.x}
        cy={endPos.y}
        r={4}
        fill={connection.style.color}
        className="connection-point"
      />
    </g>
  );
};

// 中央信息区域组件
const CenterInfo: React.FC<{
  config: DualRingBoardConfig['center'];
  size: number;
  boardSize: { width: number; height: number };
  currentPlayer: Player;
  theme: string;
}> = ({ config, size, boardSize, currentPlayer, theme }) => {
  const centerStyle: React.CSSProperties = {
    position: 'absolute',
    left: boardSize.width / 2 - size / 2,
    top: boardSize.height / 2 - size / 2,
    width: size,
    height: size,
    borderRadius: '50%',
    background: config.content.background,
    border: `2px solid ${config.content.border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.1,
    textAlign: 'center',
    padding: size * 0.1,
    boxSizing: 'border-box'
  };

  return (
    <div className={`center-info ${theme}`} style={centerStyle}>
      <div className="current-player-info">
        <div 
          className="player-avatar"
          style={{
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: '50%',
            backgroundColor: getZodiacColor(currentPlayer.zodiac),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: size * 0.15,
            fontWeight: 'bold',
            marginBottom: size * 0.05
          }}
        >
          {currentPlayer.zodiac}
        </div>
        <div className="player-name" style={{ fontSize: size * 0.08 }}>
          {currentPlayer.name}
        </div>
        <div className="game-season" style={{ fontSize: size * 0.06, opacity: 0.7 }}>
          春季 🌸
        </div>
      </div>
    </div>
  );
};

// 获取生肖对应的颜色
function getZodiacColor(zodiac: ZodiacSign): string {
  const colorMap: Record<ZodiacSign, string> = {
    '鼠': '#4299e1',
    '牛': '#48bb78',
    '虎': '#ed8936',
    '兔': '#ecc94b',
    '龙': '#e53e3e',
    '蛇': '#9f7aea',
    '马': '#38b2ac',
    '羊': '#f56565',
    '猴': '#d69e2e',
    '鸡': '#38a169',
    '狗': '#805ad5',
    '猪': '#e53e3e'
  };
  return colorMap[zodiac] || '#4a5568';
}

export default DualRingBoard;