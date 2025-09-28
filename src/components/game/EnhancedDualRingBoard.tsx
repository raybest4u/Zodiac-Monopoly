import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { 
  DualRingBoardProps, 
  DualRingBoardConfig,
  ConnectionPath,
  BoardCellProps,
  PlayerTokenProps
} from '../../types/ui-components';
import type { BoardCell, Player, ZodiacSign } from '../../types/game';
import { useResponsive, getResponsiveValue } from '../layout/ResponsiveLayout';
import './EnhancedDualRingBoard.css';

// 增强版双环配置
const ENHANCED_DUAL_RING_CONFIG: DualRingBoardConfig = {
  outerRing: {
    cellCount: 40,
    cellSize: { mobile: 32, tablet: 38, desktop: 44, large: 50 },
    borderRadius: 6,
    spacing: 3
  },
  innerRing: {
    cellCount: 16,
    cellSize: { mobile: 28, tablet: 32, desktop: 36, large: 40 },
    borderRadius: 6,
    spacing: 3
  },
  connections: [
    {
      id: 'path1',
      fromRing: 'outer',
      toRing: 'inner',
      fromPosition: 10,
      toPosition: 4,
      style: { color: '#4299e1', width: 4, animated: true, dashArray: '8,4' }
    },
    {
      id: 'path2',
      fromRing: 'outer',
      toRing: 'inner',
      fromPosition: 30,
      toPosition: 12,
      style: { color: '#48bb78', width: 4, animated: true, dashArray: '8,4' }
    }
  ],
  center: {
    size: { mobile: 100, tablet: 120, desktop: 140, large: 160 },
    content: {
      type: 'info',
      content: null,
      background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
      border: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)'
    }
  }
};

// 生肖颜色映射（更丰富的渐变色）
const ZODIAC_COLORS: Record<ZodiacSign, { primary: string; secondary: string; gradient: string }> = {
  '鼠': { primary: '#4299e1', secondary: '#63b3ed', gradient: 'linear-gradient(135deg, #4299e1 0%, #63b3ed 100%)' },
  '牛': { primary: '#48bb78', secondary: '#68d391', gradient: 'linear-gradient(135deg, #48bb78 0%, #68d391 100%)' },
  '虎': { primary: '#ed8936', secondary: '#f6ad55', gradient: 'linear-gradient(135deg, #ed8936 0%, #f6ad55 100%)' },
  '兔': { primary: '#ecc94b', secondary: '#f6e05e', gradient: 'linear-gradient(135deg, #ecc94b 0%, #f6e05e 100%)' },
  '龙': { primary: '#e53e3e', secondary: '#fc8181', gradient: 'linear-gradient(135deg, #e53e3e 0%, #fc8181 100%)' },
  '蛇': { primary: '#9f7aea', secondary: '#b794f6', gradient: 'linear-gradient(135deg, #9f7aea 0%, #b794f6 100%)' },
  '马': { primary: '#38b2ac', secondary: '#4fd1c7', gradient: 'linear-gradient(135deg, #38b2ac 0%, #4fd1c7 100%)' },
  '羊': { primary: '#f56565', secondary: '#fc8181', gradient: 'linear-gradient(135deg, #f56565 0%, #fc8181 100%)' },
  '猴': { primary: '#d69e2e', secondary: '#f6e05e', gradient: 'linear-gradient(135deg, #d69e2e 0%, #f6e05e 100%)' },
  '鸡': { primary: '#38a169', secondary: '#68d391', gradient: 'linear-gradient(135deg, #38a169 0%, #68d391 100%)' },
  '狗': { primary: '#805ad5', secondary: '#9f7aea', gradient: 'linear-gradient(135deg, #805ad5 0%, #9f7aea 100%)' },
  '猪': { primary: '#e53e3e', secondary: '#f56565', gradient: 'linear-gradient(135deg, #e53e3e 0%, #f56565 100%)' }
};

// 格子类型颜色配置
const CELL_TYPE_COLORS = {
  start: { primary: '#48bb78', secondary: '#68d391', icon: '🏠' },
  property: { primary: '#4299e1', secondary: '#63b3ed', icon: '🏢' },
  chance: { primary: '#ed8936', secondary: '#f6ad55', icon: '❓' },
  community: { primary: '#9f7aea', secondary: '#b794f6', icon: '🎁' },
  tax: { primary: '#e53e3e', secondary: '#fc8181', icon: '💰' },
  jail: { primary: '#718096', secondary: '#a0aec0', icon: '🔒' },
  parking: { primary: '#38b2ac', secondary: '#4fd1c7', icon: '🅿️' },
  special: { primary: '#d69e2e', secondary: '#f6e05e', icon: '⭐' }
};

// 增强版双环棋盘组件
export const EnhancedDualRingBoard: React.FC<DualRingBoardProps> = ({
  config = ENHANCED_DUAL_RING_CONFIG,
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
  const [hoveredCell, setHoveredCell] = useState<{ ring: 'outer' | 'inner'; position: number } | null>(null);
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set());

  // 响应式配置值
  const outerCellSize = getResponsiveValue(config.outerRing.cellSize, viewportSize);
  const innerCellSize = getResponsiveValue(config.innerRing.cellSize, viewportSize);
  const centerSize = getResponsiveValue(config.center.size, viewportSize);

  // 计算棋盘尺寸
  const boardSize = useMemo(() => {
    const outerRingSize = (outerCellSize + config.outerRing.spacing) * config.outerRing.cellCount / Math.PI * 2;
    return Math.max(outerRingSize + outerCellSize * 2, 500);
  }, [outerCellSize, config]);

  // 更新棋盘尺寸
  useEffect(() => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height, boardSize);
      setBoardDimensions({
        width: size,
        height: size
      });
    }
  }, [boardSize, viewportSize]);

  // 分离外环和内环的格子
  const outerRingCells = board.slice(0, config.outerRing.cellCount);
  const innerRingCells = board.slice(config.outerRing.cellCount, config.outerRing.cellCount + config.innerRing.cellCount);

  // 处理格子点击动画
  const handleCellClick = useCallback((cell: BoardCell, ring: 'outer' | 'inner', position: number) => {
    const cellKey = `${ring}-${position}`;
    setAnimatingCells(prev => new Set(prev).add(cellKey));
    
    setTimeout(() => {
      setAnimatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }, 600);

    onCellClick?.(cell, ring, position);
  }, [onCellClick]);

  return (
    <div 
      ref={boardRef}
      className={`enhanced-dual-ring-board ${theme} ${className}`}
      style={{ 
        width: boardDimensions.width, 
        height: boardDimensions.height
      }}
    >
      {/* 棋盘背景装饰 */}
      <div className="board-background">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="bg-pattern"></div>
      </div>

      {/* SVG容器用于连接路径和装饰 */}
      <svg
        className="board-svg"
        width={boardDimensions.width}
        height={boardDimensions.height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {/* 定义渐变和滤镜 */}
        <defs>
          <linearGradient id="pathGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4299e1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#63b3ed" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="pathGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#48bb78" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#68d391" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* 外环装饰圆圈 */}
        <circle
          cx={boardDimensions.width / 2}
          cy={boardDimensions.height / 2}
          r={boardDimensions.width * 0.47}
          fill="none"
          stroke="url(#pathGradient1)"
          strokeWidth="2"
          strokeDasharray="10,5"
          className="decorative-circle outer"
        />

        {/* 内环装饰圆圈 */}
        <circle
          cx={boardDimensions.width / 2}
          cy={boardDimensions.height / 2}
          r={boardDimensions.width * 0.27}
          fill="none"
          stroke="url(#pathGradient2)"
          strokeWidth="2"
          strokeDasharray="8,4"
          className="decorative-circle inner"
        />

        {/* 连接路径 */}
        {config.connections.map((connection, index) => (
          <EnhancedConnectionLine
            key={connection.id}
            connection={connection}
            boardSize={boardDimensions}
            outerCellSize={outerCellSize}
            innerCellSize={innerCellSize}
            outerRingCount={config.outerRing.cellCount}
            innerRingCount={config.innerRing.cellCount}
            gradientId={`pathGradient${index + 1}`}
          />
        ))}
      </svg>

      {/* 外环 */}
      <EnhancedRingContainer
        ring="outer"
        cells={outerRingCells}
        cellCount={config.outerRing.cellCount}
        cellSize={outerCellSize}
        boardSize={boardDimensions}
        players={players}
        highlightedPositions={highlightedCells.find(h => h.ring === 'outer')?.positions || []}
        interactive={interactive}
        theme={theme}
        hoveredCell={hoveredCell}
        animatingCells={animatingCells}
        onCellClick={handleCellClick}
        onCellHover={(position) => setHoveredCell({ ring: 'outer', position })}
        onCellLeave={() => setHoveredCell(null)}
        onPlayerMove={(player, from, to) => onPlayerMove?.(player, from, to, 'outer')}
      />

      {/* 内环 */}
      <EnhancedRingContainer
        ring="inner"
        cells={innerRingCells}
        cellCount={config.innerRing.cellCount}
        cellSize={innerCellSize}
        boardSize={boardDimensions}
        players={players}
        highlightedPositions={highlightedCells.find(h => h.ring === 'inner')?.positions || []}
        interactive={interactive}
        theme={theme}
        hoveredCell={hoveredCell}
        animatingCells={animatingCells}
        isInnerRing={true}
        onCellClick={handleCellClick}
        onCellHover={(position) => setHoveredCell({ ring: 'inner', position })}
        onCellLeave={() => setHoveredCell(null)}
        onPlayerMove={(player, from, to) => onPlayerMove?.(player, from, to, 'inner')}
      />

      {/* 增强版中央信息区域 */}
      <EnhancedCenterInfo
        config={config.center}
        size={centerSize}
        boardSize={boardDimensions}
        currentPlayer={currentPlayer}
        theme={theme}
      />

      {/* 游戏状态指示器 */}
      <div className="game-status-indicators">
        <div className="season-indicator">
          <span className="season-icon">🌸</span>
          <span className="season-text">春</span>
        </div>
      </div>
    </div>
  );
};

// 增强版环形容器组件
const EnhancedRingContainer: React.FC<{
  ring: 'outer' | 'inner';
  cells: BoardCell[];
  cellCount: number;
  cellSize: number;
  boardSize: { width: number; height: number };
  players: Player[];
  highlightedPositions: number[];
  interactive: boolean;
  theme: string;
  hoveredCell: { ring: 'outer' | 'inner'; position: number } | null;
  animatingCells: Set<string>;
  isInnerRing?: boolean;
  onCellClick: (cell: BoardCell, ring: 'outer' | 'inner', position: number) => void;
  onCellHover: (position: number) => void;
  onCellLeave: () => void;
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
  hoveredCell,
  animatingCells,
  isInnerRing = false,
  onCellClick,
  onCellHover,
  onCellLeave,
  onPlayerMove
}) => {
  const radius = isInnerRing 
    ? boardSize.width * 0.25  
    : boardSize.width * 0.45;
  
  const centerX = boardSize.width / 2;
  const centerY = boardSize.height / 2;

  return (
    <div className={`enhanced-ring-container ${ring}-ring`}>
      {cells.map((cell, index) => {
        const angle = (index / cellCount) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius - cellSize / 2;
        const y = centerY + Math.sin(angle) * radius - cellSize / 2;

        const cellPlayers = players.filter(player => 
          player.position === (isInnerRing ? 40 + index : index)
        );

        const isHovered = hoveredCell?.ring === ring && hoveredCell?.position === index;
        const isAnimating = animatingCells.has(`${ring}-${index}`);

        return (
          <EnhancedBoardCell
            key={`${ring}-${index}`}
            cell={cell}
            ring={ring}
            position={index}
            size={cellSize}
            players={cellPlayers}
            highlighted={highlightedPositions.includes(index)}
            hovered={isHovered}
            animating={isAnimating}
            interactive={interactive}
            theme={theme}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `rotate(${angle + Math.PI / 2}rad)`,
              transformOrigin: 'center center'
            }}
            onClick={() => onCellClick(cell, ring, index)}
            onMouseEnter={() => onCellHover(index)}
            onMouseLeave={onCellLeave}
          />
        );
      })}
    </div>
  );
};

// 增强版棋盘格子组件
const EnhancedBoardCell: React.FC<BoardCellProps & {
  hovered?: boolean;
  animating?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}> = ({
  cell,
  ring,
  position,
  size,
  players,
  highlighted = false,
  hovered = false,
  animating = false,
  interactive = true,
  theme = 'light',
  style,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  const cellTypeConfig = CELL_TYPE_COLORS[cell.type] || CELL_TYPE_COLORS.property;
  
  const cellStyle: React.CSSProperties = {
    ...style,
    width: size,
    height: size,
    cursor: interactive ? 'pointer' : 'default'
  };

  return (
    <div
      className={`enhanced-board-cell ${ring}-cell ${highlighted ? 'highlighted' : ''} ${hovered ? 'hovered' : ''} ${animating ? 'animating' : ''} ${theme}`}
      style={cellStyle}
      onClick={interactive ? onClick : undefined}
      onMouseEnter={interactive ? onMouseEnter : undefined}
      onMouseLeave={interactive ? onMouseLeave : undefined}
      title={`${cell.name} ${cell.price ? `(¥${cell.price.toLocaleString()})` : ''}`}
    >
      <div className="enhanced-cell-content">
        {/* 格子背景渐变 */}
        <div 
          className="enhanced-cell-background" 
          style={{ 
            background: cell.color || `linear-gradient(135deg, ${cellTypeConfig.primary} 0%, ${cellTypeConfig.secondary} 100%)`
          }}
        />
        
        {/* 格子边框光效 */}
        <div className="cell-border-glow" />
        
        {/* 格子信息 */}
        <div className="enhanced-cell-info">
          {cell.type === 'start' && <span className="cell-type-icon">🏠</span>}
          {cell.type !== 'start' && <span className="cell-type-icon">{cellTypeConfig.icon}</span>}
          
          {cell.price && (
            <span className="enhanced-cell-price">
              ¥{Math.round(cell.price / 1000)}K
            </span>
          )}
          
          {cell.zodiac && (
            <span className="enhanced-cell-zodiac">{cell.zodiac}</span>
          )}
          
          {cell.ownerId && (
            <div className="ownership-indicator" />
          )}
        </div>

        {/* 玩家棋子 */}
        {players.length > 0 && (
          <div className="enhanced-cell-players">
            {players.map((player, index) => (
              <EnhancedPlayerToken
                key={player.id}
                player={player}
                size={size * 0.35}
                position={position}
                ring={ring}
                index={index}
                theme={theme}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 增强版玩家棋子组件
const EnhancedPlayerToken: React.FC<PlayerTokenProps & {
  index: number;
}> = ({
  player,
  size,
  position,
  ring,
  index,
  isMoving = false,
  isCurrentPlayer = false,
  theme = 'light'
}) => {
  const zodiacConfig = ZODIAC_COLORS[player.zodiac];
  
  const tokenStyle: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    background: zodiacConfig.gradient,
    border: isCurrentPlayer ? '3px solid #ffd700' : '2px solid rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.5,
    color: 'white',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: `translate(${index * (size * 0.2)}px, ${index * (size * 0.2)}px) ${isMoving ? 'scale(1.3)' : 'scale(1)'}`,
    zIndex: isCurrentPlayer ? 20 : 10 + index,
    boxShadow: isCurrentPlayer 
      ? '0 0 20px rgba(255, 215, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.3)',
    filter: isCurrentPlayer ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))' : 'none'
  };

  return (
    <div
      className={`enhanced-player-token ${isCurrentPlayer ? 'current' : ''} ${isMoving ? 'moving' : ''} ${theme}`}
      style={tokenStyle}
      title={`${player.name} (${player.zodiac}) - ¥${player.money.toLocaleString()}`}
    >
      <span className="token-zodiac">{player.zodiac}</span>
      {isCurrentPlayer && (
        <div className="current-player-ring" />
      )}
    </div>
  );
};

// 增强版连接路径组件
const EnhancedConnectionLine: React.FC<{
  connection: ConnectionPath;
  boardSize: { width: number; height: number };
  outerCellSize: number;
  innerCellSize: number;
  outerRingCount: number;
  innerRingCount: number;
  gradientId: string;
}> = ({
  connection,
  boardSize,
  outerCellSize,
  innerCellSize,
  outerRingCount,
  innerRingCount,
  gradientId
}) => {
  const centerX = boardSize.width / 2;
  const centerY = boardSize.height / 2;
  
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
  
  // 计算控制点，创建优美的贝塞尔曲线
  const midX = (startPos.x + endPos.x) / 2;
  const midY = (startPos.y + endPos.y) / 2;
  const controlX = midX + (centerX - midX) * 0.3;
  const controlY = midY + (centerY - midY) * 0.3;

  const pathData = `M ${startPos.x} ${startPos.y} Q ${controlX} ${controlY} ${endPos.x} ${endPos.y}`;

  return (
    <g className="enhanced-connection-path">
      {/* 路径背景阴影 */}
      <path
        d={pathData}
        stroke="rgba(0, 0, 0, 0.1)"
        strokeWidth={connection.style.width + 2}
        fill="none"
        className="path-shadow"
      />
      
      {/* 主路径 */}
      <path
        d={pathData}
        stroke={`url(#${gradientId})`}
        strokeWidth={connection.style.width}
        strokeDasharray={connection.style.dashArray}
        fill="none"
        filter="url(#glow)"
        className={connection.style.animated ? 'animated-path' : 'static-path'}
      />
      
      {/* 起点和终点装饰 */}
      <circle
        cx={startPos.x}
        cy={startPos.y}
        r="6"
        fill={`url(#${gradientId})`}
        filter="url(#shadow)"
        className="connection-point start"
      />
      <circle
        cx={endPos.x}
        cy={endPos.y}
        r="6"
        fill={`url(#${gradientId})`}
        filter="url(#shadow)"
        className="connection-point end"
      />
      
      {/* 路径方向指示箭头 */}
      <defs>
        <marker id={`arrow-${connection.id}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill={`url(#${gradientId})`} />
        </marker>
      </defs>
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="2"
        fill="none"
        markerEnd={`url(#arrow-${connection.id})`}
      />
    </g>
  );
};

// 增强版中央信息区域组件
const EnhancedCenterInfo: React.FC<{
  config: DualRingBoardConfig['center'];
  size: number;
  boardSize: { width: number; height: number };
  currentPlayer: Player;
  theme: string;
}> = ({ config, size, boardSize, currentPlayer, theme }) => {
  const zodiacConfig = ZODIAC_COLORS[currentPlayer.zodiac];
  
  const centerStyle: React.CSSProperties = {
    position: 'absolute',
    left: boardSize.width / 2 - size / 2,
    top: boardSize.height / 2 - size / 2,
    width: size,
    height: size,
    borderRadius: '50%',
    background: config.content.background,
    border: `3px solid transparent`,
    backgroundImage: `linear-gradient(white, white), ${config.content.border}`,
    backgroundOrigin: 'border-box',
    backgroundClip: 'content-box, border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.08,
    textAlign: 'center',
    padding: size * 0.1,
    boxSizing: 'border-box',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  };

  return (
    <div className={`enhanced-center-info ${theme}`} style={centerStyle}>
      <div className="center-content">
        {/* 当前玩家头像 */}
        <div 
          className="enhanced-player-avatar"
          style={{
            width: size * 0.35,
            height: size * 0.35,
            borderRadius: '50%',
            background: zodiacConfig.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: size * 0.15,
            fontWeight: 'bold',
            marginBottom: size * 0.05,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            border: '3px solid rgba(255, 255, 255, 0.9)',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <span className="center-zodiac">{currentPlayer.zodiac}</span>
          <div className="avatar-shine" />
        </div>
        
        {/* 玩家信息 */}
        <div className="center-player-info">
          <div 
            className="center-player-name" 
            style={{ 
              fontSize: size * 0.08, 
              fontWeight: 600,
              color: '#2d3748',
              marginBottom: size * 0.02
            }}
          >
            {currentPlayer.name}
          </div>
          
          <div 
            className="center-money" 
            style={{ 
              fontSize: size * 0.07, 
              color: '#48bb78',
              fontWeight: 500,
              marginBottom: size * 0.02
            }}
          >
            ¥{currentPlayer.money.toLocaleString()}
          </div>
          
          <div 
            className="center-season" 
            style={{ 
              fontSize: size * 0.06, 
              color: '#4a5568',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: size * 0.02
            }}
          >
            <span>🌸</span>
            <span>春季</span>
          </div>
        </div>
        
        {/* 装饰性脉冲环 */}
        <div className="center-pulse-ring" />
      </div>
    </div>
  );
};

export default EnhancedDualRingBoard;