import React, { useEffect, useState, useMemo } from 'react';
import type { GameState, Player, PlayerAction } from '../types/game';
import type { ViewportSize, GameThemeConfig } from '../types/ui-components';

// 布局组件
import { ResponsiveProvider, useResponsive } from './layout/ResponsiveLayout';
import { GameLayout, GameHeader, GameMainContent, GameSidebar } from './layout/GameLayout';
import { GridContainer, GridItem } from './layout/GridContainer';

// 游戏组件
import { DualRingBoard } from './game/DualRingBoard';
import { MobileGameInterface } from './mobile/MobileGameInterface';

// 样式
import './GameInterface.css';

// 默认主题配置
const DEFAULT_THEME: GameThemeConfig = {
  name: 'default',
  colors: {
    primary: '#4299e1',
    secondary: '#48bb78',
    background: '#f7fafc',
    surface: '#ffffff',
    text: '#2d3748',
    border: '#e2e8f0',
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
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '50%'
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
  },
  animations: {
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.6s'
    },
    easing: {
      linear: 'linear',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  }
};

// 主游戏界面组件属性
interface GameInterfaceProps {
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

// 主游戏界面组件
export const GameInterface: React.FC<GameInterfaceProps> = ({
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
    ...DEFAULT_THEME,
    ...theme,
    colors: { ...DEFAULT_THEME.colors, ...theme?.colors }
  }), [theme]);

  // 当前玩家
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <ResponsiveProvider>
      <GameInterfaceContent
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

// 游戏界面内容组件
const GameInterfaceContent: React.FC<{
  gameState: GameState;
  currentPlayer: Player;
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
  const { isMobile, viewportSize } = useResponsive();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // CSS变量注入
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value);
      }
    });
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
  }, [theme]);

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

  // 桌面端界面
  return (
    <div className={`game-interface desktop ${className}`}>
      <GameLayout
        mode="desktop"
        header={
          <GameHeader
            title="十二生肖大富翁"
            season={gameState.season}
            round={gameState.round}
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
            <PlayerInfoSidebar
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
          gap="16px"
          className="game-content-grid"
        >
          {/* 棋盘区域 */}
          <GridItem area="board-area">
            <div className="board-container">
              <DualRingBoard
                board={gameState.board}
                players={gameState.players}
                currentPlayer={currentPlayer}
                interactive={true}
                theme="light"
                onCellClick={(cell, ring, position) => {
                  console.log(`Cell clicked: ${cell.name} at ${ring} ring position ${position}`);
                }}
                onPlayerMove={(player, from, to, ring) => {
                  console.log(`Player ${player.name} moved from ${from} to ${to} in ${ring} ring`);
                }}
              />
            </div>
          </GridItem>

          {/* 控制面板 */}
          <GridItem area="control-panel">
            <ControlPanel
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

      {/* 消息面板 */}
      <MessagePanel gameState={gameState} />
    </div>
  );
};

// 玩家信息侧边栏
const PlayerInfoSidebar: React.FC<{
  players: Player[];
  currentPlayer: Player;
  onSkillUse?: (playerId: string, skillId: string) => void;
}> = ({ players, currentPlayer, onSkillUse }) => {
  return (
    <div className="player-info-sidebar">
      <h3>玩家信息</h3>
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isCurrentPlayer={player.id === currentPlayer.id}
          onSkillUse={(skillId) => onSkillUse?.(player.id, skillId)}
        />
      ))}
    </div>
  );
};

// 玩家卡片
const PlayerCard: React.FC<{
  player: Player;
  isCurrentPlayer: boolean;
  onSkillUse?: (skillId: string) => void;
}> = ({ player, isCurrentPlayer, onSkillUse }) => {
  const getZodiacColor = (zodiac: string) => {
    const colors = DEFAULT_THEME.colors.zodiac as Record<string, string>;
    return colors[zodiac] || DEFAULT_THEME.colors.primary;
  };

  return (
    <div className={`player-card ${isCurrentPlayer ? 'current' : ''}`}>
      <div className="player-header">
        <div 
          className="player-avatar"
          style={{ backgroundColor: getZodiacColor(player.zodiac) }}
        >
          {player.zodiac}
        </div>
        <div className="player-info">
          <div className="player-name">{player.name}</div>
          <div className="player-money">¥{player.money.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="player-stats">
        <div className="stat">
          <span className="stat-label">房产</span>
          <span className="stat-value">{player.properties.length}处</span>
        </div>
        <div className="stat">
          <span className="stat-label">位置</span>
          <span className="stat-value">第{player.position}格</span>
        </div>
      </div>

      {isCurrentPlayer && player.skills.length > 0 && (
        <div className="player-skills">
          <h4>可用技能</h4>
          {player.skills.filter(skill => skill.cooldown === 0).map((skill) => (
            <button
              key={skill.id}
              className="skill-button"
              onClick={() => onSkillUse?.(skill.id)}
            >
              {skill.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 控制面板
const ControlPanel: React.FC<{
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
    <div className="control-panel">
      <h3>游戏控制</h3>
      
      {/* 主要操作按钮 */}
      <div className="primary-actions">
        <button 
          className="primary-button dice-button"
          onClick={onDiceRoll}
          disabled={gameState.phase !== 'roll_dice'}
        >
          🎲 掷骰子
        </button>
        
        <button 
          className="primary-button end-turn-button"
          onClick={onEndTurn}
        >
          ⏭ 结束回合
        </button>
      </div>

      {/* 次要操作 */}
      <div className="secondary-actions">
        <button className="secondary-button" title="技能">
          ⚡ 技能
        </button>
        <button className="secondary-button" title="交易">
          🏠 交易
        </button>
        <button className="secondary-button" title="统计">
          📊 统计
        </button>
        <button 
          className="secondary-button" 
          onClick={onSettings}
          title="设置"
        >
          ⚙️ 设置
        </button>
      </div>

      {/* 游戏信息 */}
      <div className="game-info">
        <div className="info-item">
          <span className="info-label">回合</span>
          <span className="info-value">{gameState.round}</span>
        </div>
        <div className="info-item">
          <span className="info-label">季节</span>
          <span className="info-value">{gameState.season} 🌸</span>
        </div>
        <div className="info-item">
          <span className="info-label">阶段</span>
          <span className="info-value">{gameState.phase}</span>
        </div>
      </div>
    </div>
  );
};

// 消息面板
const MessagePanel: React.FC<{
  gameState: GameState;
}> = ({ gameState }) => {
  return (
    <div className="message-panel">
      {gameState.currentEvent && (
        <div className="current-message">
          <span className="message-icon">🎯</span>
          <span className="message-text">{gameState.currentEvent.description}</span>
        </div>
      )}
    </div>
  );
};

export default GameInterface;