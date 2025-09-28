import React, { useState, useMemo, useCallback } from 'react';
import type { Player, GameState, PlayerAction, PlayerSkill } from '../../types/game';
import type { ZodiacSign } from '../../types/game';
import { useResponsive } from '../layout/ResponsiveLayout';
import './EnhancedPlayerInterface.css';

// 生肖颜色和主题配置
const ZODIAC_THEMES = {
  '鼠': { 
    primary: '#4299e1', 
    secondary: '#63b3ed', 
    gradient: 'linear-gradient(135deg, #4299e1 0%, #63b3ed 100%)',
    shadow: 'rgba(66, 153, 225, 0.3)'
  },
  '牛': { 
    primary: '#48bb78', 
    secondary: '#68d391', 
    gradient: 'linear-gradient(135deg, #48bb78 0%, #68d391 100%)',
    shadow: 'rgba(72, 187, 120, 0.3)'
  },
  '虎': { 
    primary: '#ed8936', 
    secondary: '#f6ad55', 
    gradient: 'linear-gradient(135deg, #ed8936 0%, #f6ad55 100%)',
    shadow: 'rgba(237, 137, 54, 0.3)'
  },
  '兔': { 
    primary: '#ecc94b', 
    secondary: '#f6e05e', 
    gradient: 'linear-gradient(135deg, #ecc94b 0%, #f6e05e 100%)',
    shadow: 'rgba(236, 201, 75, 0.3)'
  },
  '龙': { 
    primary: '#e53e3e', 
    secondary: '#fc8181', 
    gradient: 'linear-gradient(135deg, #e53e3e 0%, #fc8181 100%)',
    shadow: 'rgba(229, 62, 62, 0.3)'
  },
  '蛇': { 
    primary: '#9f7aea', 
    secondary: '#b794f6', 
    gradient: 'linear-gradient(135deg, #9f7aea 0%, #b794f6 100%)',
    shadow: 'rgba(159, 122, 234, 0.3)'
  },
  '马': { 
    primary: '#38b2ac', 
    secondary: '#4fd1c7', 
    gradient: 'linear-gradient(135deg, #38b2ac 0%, #4fd1c7 100%)',
    shadow: 'rgba(56, 178, 172, 0.3)'
  },
  '羊': { 
    primary: '#f56565', 
    secondary: '#fc8181', 
    gradient: 'linear-gradient(135deg, #f56565 0%, #fc8181 100%)',
    shadow: 'rgba(245, 101, 101, 0.3)'
  },
  '猴': { 
    primary: '#d69e2e', 
    secondary: '#f6e05e', 
    gradient: 'linear-gradient(135deg, #d69e2e 0%, #f6e05e 100%)',
    shadow: 'rgba(214, 158, 46, 0.3)'
  },
  '鸡': { 
    primary: '#38a169', 
    secondary: '#68d391', 
    gradient: 'linear-gradient(135deg, #38a169 0%, #68d391 100%)',
    shadow: 'rgba(56, 161, 105, 0.3)'
  },
  '狗': { 
    primary: '#805ad5', 
    secondary: '#9f7aea', 
    gradient: 'linear-gradient(135deg, #805ad5 0%, #9f7aea 100%)',
    shadow: 'rgba(128, 90, 213, 0.3)'
  },
  '猪': { 
    primary: '#e53e3e', 
    secondary: '#f56565', 
    gradient: 'linear-gradient(135deg, #e53e3e 0%, #f56565 100%)',
    shadow: 'rgba(229, 62, 62, 0.3)'
  }
} as const;

// 增强版玩家信息卡片
interface EnhancedPlayerCardProps {
  player: Player;
  gameState: GameState;
  isCurrentPlayer: boolean;
  isCompact?: boolean;
  showDetails?: boolean;
  onSkillUse?: (skillId: string) => void;
  onPlayerClick?: () => void;
  className?: string;
}

export const EnhancedPlayerCard: React.FC<EnhancedPlayerCardProps> = ({
  player,
  gameState,
  isCurrentPlayer,
  isCompact = false,
  showDetails = false,
  onSkillUse,
  onPlayerClick,
  className = ''
}) => {
  const { isMobile } = useResponsive();
  const [expanded, setExpanded] = useState(showDetails);
  const [animating, setAnimating] = useState(false);
  
  const zodiacTheme = ZODIAC_THEMES[player.zodiac];
  
  // 计算玩家统计数据
  const playerStats = useMemo(() => ({
    totalWealth: player.money + (player.properties.length * 10000), // 简化计算
    propertyValue: player.properties.length * 10000,
    skillsReady: player.skills.filter(skill => skill.cooldown === 0).length,
    activeEffects: player.statusEffects.length
  }), [player]);

  // 处理技能使用
  const handleSkillUse = useCallback((skillId: string) => {
    setAnimating(true);
    onSkillUse?.(skillId);
    setTimeout(() => setAnimating(false), 600);
  }, [onSkillUse]);

  return (
    <div 
      className={`enhanced-player-card ${isCurrentPlayer ? 'current-player' : ''} ${isCompact ? 'compact' : ''} ${expanded ? 'expanded' : ''} ${animating ? 'animating' : ''} ${className}`}
      onClick={onPlayerClick}
    >
      {/* 卡片背景和装饰 */}
      <div className="card-background">
        <div 
          className="card-gradient"
          style={{ background: `linear-gradient(135deg, ${zodiacTheme.primary}15 0%, ${zodiacTheme.secondary}15 100%)` }}
        />
        <div className="card-pattern" />
        <div className="card-glow" />
      </div>

      {/* 主要内容区域 */}
      <div className="card-content">
        {/* 玩家头部信息 */}
        <div className="player-header">
          <div className="player-avatar-container">
            <div 
              className="player-avatar-main"
              style={{ background: zodiacTheme.gradient }}
            >
              <span className="avatar-zodiac">{player.zodiac}</span>
              <div className="avatar-ring" />
              {isCurrentPlayer && <div className="current-player-indicator" />}
            </div>
            
            {/* 玩家等级或排名指示 */}
            <div className="player-rank-badge">
              #{gameState.players.findIndex(p => p.id === player.id) + 1}
            </div>
          </div>

          <div className="player-main-info">
            <div className="player-name-section">
              <h3 className="player-name">{player.name}</h3>
              <div className="player-title">
                {isCurrentPlayer ? '当前玩家' : player.isHuman ? '人类玩家' : 'AI玩家'}
              </div>
            </div>

            {!isCompact && (
              <div className="player-quick-stats">
                <div className="quick-stat">
                  <span className="stat-icon">💰</span>
                  <span className="stat-value">¥{player.money.toLocaleString()}</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-icon">🏠</span>
                  <span className="stat-value">{player.properties.length}处</span>
                </div>
                <div className="quick-stat">
                  <span className="stat-icon">📍</span>
                  <span className="stat-value">第{player.position}格</span>
                </div>
              </div>
            )}
          </div>

          {!isCompact && (
            <div className="player-actions">
              <button 
                className="expand-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>▼</span>
              </button>
            </div>
          )}
        </div>

        {/* 展开的详细信息 */}
        {expanded && !isCompact && (
          <div className="player-details">
            {/* 详细统计 */}
            <div className="stats-section">
              <h4 className="section-title">
                <span className="title-icon">📊</span>
                玩家统计
              </h4>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-icon">💎</span>
                    <span className="stat-label">总资产</span>
                  </div>
                  <div className="stat-value">¥{playerStats.totalWealth.toLocaleString()}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-icon">🏆</span>
                    <span className="stat-label">房产价值</span>
                  </div>
                  <div className="stat-value">¥{playerStats.propertyValue.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* 技能面板 */}
            {player.skills.length > 0 && (
              <div className="skills-section">
                <h4 className="section-title">
                  <span className="title-icon">⚡</span>
                  技能状态
                  {playerStats.skillsReady > 0 && (
                    <span className="skills-ready-badge">{playerStats.skillsReady}个可用</span>
                  )}
                </h4>
                <div className="skills-grid">
                  {player.skills.map((skill) => (
                    <EnhancedSkillButton
                      key={skill.id}
                      skill={skill}
                      zodiacTheme={zodiacTheme}
                      canUse={skill.cooldown === 0 && isCurrentPlayer}
                      onUse={() => handleSkillUse(skill.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 状态效果 */}
            {player.statusEffects.length > 0 && (
              <div className="effects-section">
                <h4 className="section-title">
                  <span className="title-icon">✨</span>
                  状态效果
                </h4>
                <div className="effects-list">
                  {player.statusEffects.map((effect) => (
                    <div key={effect.id} className="effect-item">
                      <div className="effect-info">
                        <span className="effect-name">{effect.name}</span>
                        <span className="effect-description">{effect.description}</span>
                      </div>
                      <div className="effect-duration">
                        {effect.remainingTurns}回合
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 房产展示 */}
            {player.properties.length > 0 && (
              <div className="properties-section">
                <h4 className="section-title">
                  <span className="title-icon">🏘️</span>
                  拥有房产
                </h4>
                <div className="properties-preview">
                  <div className="property-count">{player.properties.length} 处房产</div>
                  <div className="property-types">
                    {/* 这里可以根据房产类型显示不同的图标 */}
                    <span className="property-type">🏢 商业</span>
                    <span className="property-type">🏠 住宅</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 当前玩家的特殊效果 */}
      {isCurrentPlayer && (
        <>
          <div className="current-player-glow" />
          <div className="current-player-pulse" />
        </>
      )}
    </div>
  );
};

// 增强版技能按钮组件
interface EnhancedSkillButtonProps {
  skill: PlayerSkill;
  zodiacTheme: typeof ZODIAC_THEMES[keyof typeof ZODIAC_THEMES];
  canUse: boolean;
  onUse: () => void;
}

const EnhancedSkillButton: React.FC<EnhancedSkillButtonProps> = ({
  skill,
  zodiacTheme,
  canUse,
  onUse
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`enhanced-skill-button ${canUse ? 'available' : 'cooldown'} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={canUse ? onUse : undefined}
      title={`${skill.name} - ${skill.description}`}
    >
      <div className="skill-background">
        {canUse ? (
          <div 
            className="skill-gradient"
            style={{ background: zodiacTheme.gradient }}
          />
        ) : (
          <div className="skill-disabled-bg" />
        )}
        <div className="skill-pattern" />
      </div>

      <div className="skill-content">
        <div className="skill-icon-container">
          <span className="skill-icon">⚡</span>
          {!canUse && (
            <div className="cooldown-overlay">
              <span className="cooldown-text">{skill.cooldown}</span>
            </div>
          )}
        </div>
        
        <div className="skill-info">
          <div className="skill-name">{skill.name}</div>
          <div className="skill-level">Lv.{skill.level}</div>
        </div>
      </div>

      {canUse && (
        <div className="skill-glow" style={{ boxShadow: `0 0 20px ${zodiacTheme.shadow}` }} />
      )}
    </div>
  );
};

// 增强版控制面板
interface EnhancedPlayerControlsProps {
  player: Player;
  gameState: GameState;
  availableActions: PlayerAction[];
  onDiceRoll?: () => void;
  onSkillUse?: (skillId: string) => void;
  onEndTurn?: () => void;
  onTrade?: () => void;
  className?: string;
}

export const EnhancedPlayerControls: React.FC<EnhancedPlayerControlsProps> = ({
  player,
  gameState,
  availableActions,
  onDiceRoll,
  onSkillUse,
  onEndTurn,
  onTrade,
  className = ''
}) => {
  const zodiacTheme = ZODIAC_THEMES[player.zodiac];
  const [diceRolling, setDiceRolling] = useState(false);

  const handleDiceRoll = useCallback(() => {
    setDiceRolling(true);
    onDiceRoll?.();
    setTimeout(() => setDiceRolling(false), 2000);
  }, [onDiceRoll]);

  const canRollDice = gameState.phase === 'roll_dice' && !diceRolling;
  const readySkills = player.skills.filter(skill => skill.cooldown === 0);

  return (
    <div className={`enhanced-player-controls ${className}`}>
      <div className="controls-background">
        <div className="controls-gradient" />
        <div className="controls-pattern" />
      </div>

      <div className="controls-content">
        <div className="controls-header">
          <h3 className="controls-title">
            <span className="title-icon">🎮</span>
            游戏操作
          </h3>
          <div className="turn-indicator">
            <span className="turn-text">第 {gameState.round} 回合</span>
            <span className="phase-text">{getPhaseDisplayName(gameState.phase)}</span>
          </div>
        </div>

        <div className="primary-controls">
          {/* 掷骰子按钮 */}
          <button
            className={`primary-control-button dice-button ${canRollDice ? 'active' : 'disabled'} ${diceRolling ? 'rolling' : ''}`}
            onClick={canRollDice ? handleDiceRoll : undefined}
            disabled={!canRollDice}
          >
            <div className="button-background">
              <div className="button-gradient" />
              <div className="button-shine" />
            </div>
            <div className="button-content">
              <span className="button-icon">🎲</span>
              <span className="button-text">
                {diceRolling ? '掷骰中...' : '掷骰子'}
              </span>
            </div>
            {diceRolling && <div className="rolling-animation" />}
          </button>

          {/* 结束回合按钮 */}
          <button
            className="primary-control-button end-turn-button"
            onClick={onEndTurn}
          >
            <div className="button-background">
              <div className="button-gradient" />
              <div className="button-shine" />
            </div>
            <div className="button-content">
              <span className="button-icon">⏭️</span>
              <span className="button-text">结束回合</span>
            </div>
          </button>
        </div>

        <div className="secondary-controls">
          {/* 技能快捷按钮 */}
          {readySkills.length > 0 && (
            <div className="skill-shortcuts">
              <div className="shortcut-title">快捷技能</div>
              <div className="shortcut-buttons">
                {readySkills.slice(0, 3).map((skill) => (
                  <button
                    key={skill.id}
                    className="skill-shortcut-button"
                    onClick={() => onSkillUse?.(skill.id)}
                    title={skill.name}
                    style={{ background: zodiacTheme.gradient }}
                  >
                    <span className="shortcut-icon">⚡</span>
                    <span className="shortcut-name">{skill.name.slice(0, 2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 其他控制按钮 */}
          <div className="utility-controls">
            <button className="utility-button" onClick={onTrade}>
              <span className="utility-icon">🔄</span>
              <span className="utility-label">交易</span>
            </button>
            <button className="utility-button">
              <span className="utility-icon">📊</span>
              <span className="utility-label">统计</span>
            </button>
            <button className="utility-button">
              <span className="utility-icon">⚙️</span>
              <span className="utility-label">设置</span>
            </button>
          </div>
        </div>

        {/* 游戏状态指示器 */}
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-icon">💰</span>
            <span className="status-label">资金</span>
            <span className="status-value">¥{player.money.toLocaleString()}</span>
          </div>
          <div className="status-item">
            <span className="status-icon">🏠</span>
            <span className="status-label">房产</span>
            <span className="status-value">{player.properties.length}</span>
          </div>
          <div className="status-item">
            <span className="status-icon">📍</span>
            <span className="status-label">位置</span>
            <span className="status-value">第{player.position}格</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 增强版玩家列表组件
interface EnhancedPlayerListProps {
  players: Player[];
  gameState: GameState;
  currentPlayer: Player;
  onPlayerSelect?: (playerId: string) => void;
  onSkillUse?: (playerId: string, skillId: string) => void;
  className?: string;
}

export const EnhancedPlayerList: React.FC<EnhancedPlayerListProps> = ({
  players,
  gameState,
  currentPlayer,
  onPlayerSelect,
  onSkillUse,
  className = ''
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  return (
    <div className={`enhanced-player-list ${className}`}>
      <div className="list-header">
        <h3 className="list-title">
          <span className="title-icon">👥</span>
          玩家列表
        </h3>
        <div className="player-count">{players.length} 位玩家</div>
      </div>

      <div className="players-container">
        {players.map((player) => (
          <EnhancedPlayerCard
            key={player.id}
            player={player}
            gameState={gameState}
            isCurrentPlayer={player.id === currentPlayer.id}
            isCompact={true}
            showDetails={selectedPlayer === player.id}
            onSkillUse={(skillId) => onSkillUse?.(player.id, skillId)}
            onPlayerClick={() => {
              setSelectedPlayer(selectedPlayer === player.id ? null : player.id);
              onPlayerSelect?.(player.id);
            }}
            className="list-item"
          />
        ))}
      </div>
    </div>
  );
};

// 辅助函数
const getPhaseDisplayName = (phase: string): string => {
  const phaseNames: Record<string, string> = {
    'roll_dice': '掷骰阶段',
    'move_player': '移动阶段',
    'process_cell': '处理格子',
    'handle_event': '事件处理',
    'end_turn': '回合结束',
    'check_win': '胜利检查'
  };
  return phaseNames[phase] || phase;
};

export default {
  EnhancedPlayerCard,
  EnhancedPlayerControls,
  EnhancedPlayerList
};