import React, { useEffect, useState, useMemo } from 'react';
import type { GameState, Player, PlayerAction } from '../types/game';
import type { ViewportSize, GameThemeConfig } from '../types/ui-components';

// 布局组件
import { ResponsiveProvider, useResponsive } from './layout/ResponsiveLayout';
import { GameLayout, GameHeader, GameMainContent, GameSidebar } from './layout/GameLayout';
import { GridContainer, GridItem } from './layout/GridContainer';

// 增强版游戏组件
import { EnhancedDualRingBoard } from './game/EnhancedDualRingBoard';
import { MobileGameInterface } from './mobile/MobileGameInterface';

// 样式
import './EnhancedGameInterface.css';

// 增强版主题配置
const ENHANCED_THEME: GameThemeConfig = {
  name: 'enhanced',
  colors: {
    primary: '#4299e1',
    secondary: '#48bb78',
    background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
    surface: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
    text: '#2d3748',
    border: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)',
    success: '#48bb78',
    warning: '#ed8936',
    error: '#e53e3e',
    info: '#4299e1',
    zodiac: {
      '鼠': '#4299e1', '牛': '#48bb78', '虎': '#ed8936', '兔': '#ecc94b',
      '龙': '#e53e3e', '蛇': '#9f7aea', '马': '#38b2ac', '羊': '#f56565',
      '猴': '#d69e2e', '鸡': '#38a169', '狗': '#805ad5', '猪': '#e53e3e'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '20px',
    full: '50%'
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 8px 16px rgba(0, 0, 0, 0.1)',
    lg: '0 16px 32px rgba(0, 0, 0, 0.15)',
    xl: '0 24px 48px rgba(0, 0, 0, 0.2)'
  },
  animations: {
    duration: {
      fast: '0.2s',
      normal: '0.4s',
      slow: '0.8s'
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
};

// 增强版游戏界面组件属性
interface EnhancedGameInterfaceProps {
  gameState: GameState;
  onAction?: (action: PlayerAction) => void;
  onDiceRoll?: () => void;
  onSkillUse?: (playerId: string, skillId: string) => void;
  onPropertyTrade?: (fromPlayer: string, toPlayer: string) => void;
  onEndTurn?: () => void;
  onSettings?: () => void;
  theme?: Partial<GameThemeConfig>;
  className?: string;
}

// 增强版游戏界面主组件
export const EnhancedGameInterface: React.FC<EnhancedGameInterfaceProps> = ({
  gameState,
  onAction,
  onDiceRoll,
  onSkillUse,
  onPropertyTrade,
  onEndTurn,
  onSettings,
  theme,
  className = ''
}) => {
  // 合并主题配置
  const mergedTheme = useMemo(() => ({
    ...ENHANCED_THEME,
    ...theme,
    colors: { ...ENHANCED_THEME.colors, ...theme?.colors }
  }), [theme]);

  // 当前玩家
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <ResponsiveProvider>
      <EnhancedGameInterfaceContent
        gameState={gameState}
        currentPlayer={currentPlayer}
        theme={mergedTheme}
        onAction={onAction}
        onDiceRoll={onDiceRoll}
        onSkillUse={onSkillUse}
        onPropertyTrade={onPropertyTrade}
        onEndTurn={onEndTurn}
        onSettings={onSettings}
        className={className}
      />
    </ResponsiveProvider>
  );
};

// 增强版游戏界面内容组件
const EnhancedGameInterfaceContent: React.FC<{
  gameState: GameState;
  currentPlayer: Player | undefined;
  theme: GameThemeConfig;
  onAction?: (action: PlayerAction) => void;
  onDiceRoll?: () => void;
  onSkillUse?: (playerId: string, skillId: string) => void;
  onPropertyTrade?: (fromPlayer: string, toPlayer: string) => void;
  onEndTurn?: () => void;
  onSettings?: () => void;
  className?: string;
}> = ({
  gameState,
  currentPlayer,
  theme,
  onAction,
  onDiceRoll,
  onSkillUse,
  onPropertyTrade,
  onEndTurn,
  onSettings,
  className
}) => {
  // 安全检查：如果没有当前玩家，显示加载状态
  if (!currentPlayer) {
    return <div className="game-loading">游戏加载中...</div>;
  }

  const { isMobile, viewportSize } = useResponsive();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [boardAnimations, setBoardAnimations] = useState<any[]>([]);
  const [highlightedCells, setHighlightedCells] = useState<any[]>([]);

  // CSS变量注入（增强版）
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--enhanced-color-${key}`, value);
      }
    });
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--enhanced-spacing-${key}`, value);
    });
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--enhanced-shadow-${key}`, value);
    });
  }, [theme]);

  // 处理骰子结果的视觉反馈
  useEffect(() => {
    if (gameState.lastDiceResult && currentPlayer?.position !== undefined) {
      // 高亮显示玩家可能到达的格子
      const targetPosition = (currentPlayer.position + gameState.lastDiceResult.total) % gameState.board.length;
      setHighlightedCells([
        { ring: 'outer', positions: [targetPosition] }
      ]);
      
      // 3秒后清除高亮
      setTimeout(() => {
        setHighlightedCells([]);
      }, 3000);
    }
  }, [gameState.lastDiceResult, currentPlayer?.position, gameState.board.length]);

  // 移动端界面
  if (isMobile) {
    return (
      <MobileGameInterface
        gameState={gameState}
        currentPlayer={currentPlayer}
        onAction={onAction}
        onDiceRoll={onDiceRoll}
        onSkillUse={(skillId) => onSkillUse?.(currentPlayer.id, skillId)}
        className={className}
      />
    );
  }

  // 桌面端增强界面
  return (
    <div className={`enhanced-game-interface desktop ${className}`}>
      <GameLayout
        mode="desktop"
        header={
          <EnhancedGameHeader
            title="十二生肖大富翁"
            season={gameState.season}
            round={gameState.round}
            weather="晴"
            currentPlayer={currentPlayer}
            onSettings={onSettings}
          />
        }
        sidebar={
          <GameSidebar
            position="left"
            collapsible={true}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <EnhancedPlayerInfoSidebar
              players={gameState.players}
              currentPlayer={currentPlayer}
              onSkillUse={onSkillUse}
            />
          </GameSidebar>
        }
      >
        <GridContainer
          areas={{
            desktop: ['board-area control-panel'],
            large: ['board-area board-area control-panel']
          }}
          columns={{
            desktop: 2,
            large: 3
          }}
          gap="20px"
          className="enhanced-game-content-grid"
        >
          {/* 增强版棋盘区域 */}
          <GridItem area="board-area">
            <div className="enhanced-board-container">
              <EnhancedDualRingBoard
                board={gameState.board}
                players={gameState.players}
                currentPlayer={currentPlayer}
                highlightedCells={highlightedCells}
                animations={boardAnimations}
                interactive={true}
                theme="light"
                onCellClick={(cell, ring, position) => {
                  console.log(`Enhanced cell clicked: ${cell.name} at ${ring} ring position ${position}`);
                  // 添加点击动画效果
                  setBoardAnimations([
                    {
                      type: 'cell_highlight',
                      target: { ring, position },
                      duration: 600,
                      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                  ]);
                }}
                onPlayerMove={(player, from, to, ring) => {
                  console.log(`Enhanced player ${player.name} moved from ${from} to ${to} in ${ring} ring`);
                  // 添加移动动画效果
                  setBoardAnimations([
                    {
                      type: 'player_move',
                      target: { playerId: player.id, from, to, ring },
                      duration: 800,
                      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                  ]);
                }}
              />
            </div>
          </GridItem>

          {/* 增强版控制面板 */}
          <GridItem area="control-panel">
            <EnhancedControlPanel
              gameState={gameState}
              currentPlayer={currentPlayer}
              onDiceRoll={onDiceRoll}
              onSkillUse={onSkillUse}
              onPropertyTrade={onPropertyTrade}
              onEndTurn={onEndTurn}
              onSettings={onSettings}
            />
          </GridItem>
        </GridContainer>
      </GameLayout>

      {/* 增强版消息面板 */}
      <EnhancedMessagePanel gameState={gameState} />
      
      {/* 骰子结果显示 */}
      {gameState.lastDiceResult && (
        <DiceResultOverlay result={gameState.lastDiceResult} />
      )}
    </div>
  );
};

// 增强版游戏头部
const EnhancedGameHeader: React.FC<{
  title: string;
  season: string;
  round: number;
  weather: string;
  currentPlayer: Player;
  onSettings?: () => void;
}> = ({ title, season, round, weather, currentPlayer, onSettings }) => {
  return (
    <header className="enhanced-game-header">
      <div className="header-background">
        <div className="header-gradient"></div>
        <div className="header-pattern"></div>
      </div>
      
      <div className="header-content">
        <div className="header-left">
          <div className="game-logo">
            <span className="logo-icon">🎲</span>
            <h1 className="game-title">{title}</h1>
          </div>
        </div>
        
        <div className="header-center">
          <div className="game-status">
            <div className="season-weather">
              <span className="season">{season} {getSeasonIcon(season)}</span>
              <span className="weather">{weather} {getWeatherIcon(weather)}</span>
            </div>
            <div className="round-info">第 {round} 回合</div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="current-player-indicator">
            <div 
              className="player-mini-avatar"
              style={{ backgroundColor: getZodiacColor(currentPlayer.zodiac) }}
            >
              {currentPlayer.zodiac}
            </div>
            <span className="player-name">{currentPlayer.name}</span>
          </div>
          
          <button 
            className="settings-button"
            onClick={onSettings}
            title="游戏设置"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
};

// 增强版玩家信息侧边栏
const EnhancedPlayerInfoSidebar: React.FC<{
  players: Player[];
  currentPlayer: Player;
  onSkillUse?: (playerId: string, skillId: string) => void;
}> = ({ players, currentPlayer, onSkillUse }) => {
  return (
    <div className="enhanced-player-info-sidebar">
      <h3 className="sidebar-title">
        <span className="title-icon">👥</span>
        玩家状态
      </h3>
      
      <div className="players-list">
        {players.map((player) => (
          <EnhancedPlayerCard
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayer.id}
            onSkillUse={(skillId) => onSkillUse?.(player.id, skillId)}
          />
        ))}
      </div>
      
      <div className="sidebar-stats">
        <div className="stats-title">游戏统计</div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{players.length}</div>
            <div className="stat-label">玩家数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{players.reduce((sum, p) => sum + p.properties.length, 0)}</div>
            <div className="stat-label">总房产</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 增强版玩家卡片
const EnhancedPlayerCard: React.FC<{
  player: Player;
  isCurrentPlayer: boolean;
  onSkillUse?: (skillId: string) => void;
}> = ({ player, isCurrentPlayer, onSkillUse }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`enhanced-player-card ${isCurrentPlayer ? 'current' : ''}`}>
      <div className="card-background">
        <div className="card-gradient"></div>
        <div className="card-shine"></div>
      </div>
      
      <div 
        className="player-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div 
          className="enhanced-player-avatar"
          style={{ backgroundColor: getZodiacColor(player.zodiac) }}
        >
          <span className="avatar-zodiac">{player.zodiac}</span>
          <div className="avatar-ring"></div>
        </div>
        
        <div className="player-main-info">
          <div className="player-name">{player.name}</div>
          <div className="player-money">¥{player.money.toLocaleString()}</div>
          <div className="player-position">位置: 第{player.position}格</div>
        </div>
        
        <div className="expand-indicator">
          {expanded ? '▼' : '▶'}
        </div>
      </div>
      
      {expanded && (
        <div className="player-details">
          <div className="details-section">
            <h4>房产信息</h4>
            <div className="property-count">{player.properties.length} 处房产</div>
          </div>
          
          {isCurrentPlayer && player.skills.length > 0 && (
            <div className="details-section">
              <h4>可用技能</h4>
              <div className="skills-list">
                {player.skills
                  .filter(skill => skill.cooldown === 0)
                  .map((skill) => (
                    <button
                      key={skill.id}
                      className="enhanced-skill-button"
                      onClick={() => onSkillUse?.(skill.id)}
                    >
                      <span className="skill-icon">⚡</span>
                      <span className="skill-name">{skill.name}</span>
                    </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 增强版控制面板
const EnhancedControlPanel: React.FC<{
  gameState: GameState;
  currentPlayer: Player;
  onDiceRoll?: () => void;
  onSkillUse?: (playerId: string, skillId: string) => void;
  onPropertyTrade?: (fromPlayer: string, toPlayer: string) => void;
  onEndTurn?: () => void;
  onSettings?: () => void;
}> = ({
  gameState,
  currentPlayer,
  onDiceRoll,
  onSkillUse,
  onPropertyTrade,
  onEndTurn,
  onSettings
}) => {
  return (
    <div className="enhanced-control-panel">
      <div className="panel-background">
        <div className="panel-gradient"></div>
      </div>
      
      <div className="panel-content">
        <h3 className="panel-title">
          <span className="title-icon">🎮</span>
          游戏控制
        </h3>
        
        {/* 主要操作按钮 */}
        <div className="primary-actions">
          <button 
            className="enhanced-primary-button dice-button"
            onClick={onDiceRoll}
            disabled={gameState.phase !== 'roll_dice'}
          >
            <span className="button-icon">🎲</span>
            <span className="button-text">掷骰子</span>
            <div className="button-shine"></div>
          </button>
          
          <button 
            className="enhanced-primary-button end-turn-button"
            onClick={onEndTurn}
          >
            <span className="button-icon">⏭</span>
            <span className="button-text">结束回合</span>
            <div className="button-shine"></div>
          </button>
        </div>

        {/* 次要操作 */}
        <div className="secondary-actions">
          <button className="enhanced-secondary-button">
            <span className="button-icon">⚡</span>
            <span className="button-label">技能</span>
          </button>
          <button className="enhanced-secondary-button">
            <span className="button-icon">🏠</span>
            <span className="button-label">交易</span>
          </button>
          <button className="enhanced-secondary-button">
            <span className="button-icon">📊</span>
            <span className="button-label">统计</span>
          </button>
          <button 
            className="enhanced-secondary-button"
            onClick={onSettings}
          >
            <span className="button-icon">⚙️</span>
            <span className="button-label">设置</span>
          </button>
        </div>

        {/* 游戏状态信息 */}
        <div className="game-status-info">
          <div className="status-title">当前状态</div>
          <div className="status-items">
            <div className="status-item">
              <span className="status-icon">🔄</span>
              <span className="status-text">{gameState.phase}</span>
            </div>
            <div className="status-item">
              <span className="status-icon">⏰</span>
              <span className="status-text">回合 {gameState.round}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 增强版消息面板
const EnhancedMessagePanel: React.FC<{
  gameState: GameState;
}> = ({ gameState }) => {
  if (!gameState.currentEvent) return null;

  return (
    <div className="enhanced-message-panel">
      <div className="message-container">
        <div className="message-icon">🎯</div>
        <div className="message-content">
          <div className="message-title">{gameState.currentEvent.title}</div>
          <div className="message-text">{gameState.currentEvent.description}</div>
        </div>
        <div className="message-close">✕</div>
      </div>
    </div>
  );
};

// 骰子结果叠加层
const DiceResultOverlay: React.FC<{
  result: any;
}> = ({ result }) => {
  return (
    <div className="dice-result-overlay">
      <div className="dice-container">
        <div className="dice">{result.dice1}</div>
        <div className="dice">{result.dice2}</div>
      </div>
      <div className="total-result">{result.total}</div>
      {result.isDouble && (
        <div className="double-indicator">双倍!</div>
      )}
    </div>
  );
};

// 辅助函数
const getZodiacColor = (zodiac: string): string => {
  const colorMap: Record<string, string> = {
    '鼠': '#4299e1', '牛': '#48bb78', '虎': '#ed8936', '兔': '#ecc94b',
    '龙': '#e53e3e', '蛇': '#9f7aea', '马': '#38b2ac', '羊': '#f56565',
    '猴': '#d69e2e', '鸡': '#38a169', '狗': '#805ad5', '猪': '#e53e3e'
  };
  return colorMap[zodiac] || '#4a5568';
};

const getSeasonIcon = (season: string): string => {
  const iconMap: Record<string, string> = {
    '春': '🌸', '夏': '☀️', '秋': '🍂', '冬': '❄️'
  };
  return iconMap[season] || '🌸';
};

const getWeatherIcon = (weather: string): string => {
  const iconMap: Record<string, string> = {
    '晴': '☀️', '雨': '🌧️', '雪': '❄️', '风': '💨', '雾': '🌫️'
  };
  return iconMap[weather] || '☀️';
};

export default EnhancedGameInterface;