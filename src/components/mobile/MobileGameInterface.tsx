import React, { useState, useRef, useEffect } from 'react';
import type {
  MobileNavigationProps,
  MobileControlBarProps,
  MobileGestureContainerProps,
  TouchGestureConfig,
  SwipeDirection
} from '../../types/ui-components';
import type { Player, GameState, PlayerAction } from '../../types/game';
import { useResponsive } from '../layout/ResponsiveLayout';
import { DualRingBoard } from '../game/DualRingBoard';
import './MobileGameInterface.css';

// 移动端导航栏
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  progress,
  className = ''
}) => {
  return (
    <nav className={`mobile-navigation ${className}`}>
      <div className="nav-left">
        {leftAction && (
          <button 
            className="nav-action-button"
            onClick={leftAction.onClick}
            aria-label="返回"
          >
            {leftAction.icon}
          </button>
        )}
      </div>
      
      <div className="nav-center">
        <h1 className="nav-title">{title}</h1>
        {subtitle && <span className="nav-subtitle">{subtitle}</span>}
        
        {progress && (
          <div className="nav-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <span className="progress-text">
              {progress.current}/{progress.total}
            </span>
          </div>
        )}
      </div>
      
      <div className="nav-right">
        {rightAction && (
          <button 
            className="nav-action-button"
            onClick={rightAction.onClick}
            aria-label="设置"
          >
            {rightAction.icon}
          </button>
        )}
      </div>
    </nav>
  );
};

// 移动端底部控制栏
export const MobileControlBar: React.FC<MobileControlBarProps> = ({
  primaryAction,
  secondaryActions = [],
  className = ''
}) => {
  return (
    <div className={`mobile-control-bar ${className}`}>
      {/* 主要操作按钮 */}
      <button
        className={`primary-action-button ${primaryAction.disabled ? 'disabled' : ''}`}
        onClick={primaryAction.onClick}
        disabled={primaryAction.disabled}
      >
        {primaryAction.loading && (
          <div className="loading-spinner" />
        )}
        {primaryAction.icon && (
          <span className="action-icon">{primaryAction.icon}</span>
        )}
        <span className="action-label">{primaryAction.label}</span>
      </button>
      
      {/* 次要操作按钮 */}
      {secondaryActions.length > 0 && (
        <div className="secondary-actions">
          {secondaryActions.map((action) => (
            <button
              key={action.id}
              className={`secondary-action-button ${action.disabled ? 'disabled' : ''}`}
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.label}
            >
              <span className="action-icon">{action.icon}</span>
              {action.badge && (
                <span className="action-badge">{action.badge}</span>
              )}
              {action.label && (
                <span className="action-label">{action.label}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 移动端手势容器
export const MobileGestureContainer: React.FC<MobileGestureContainerProps> = ({
  children,
  gestures,
  onSwipe,
  onPinch,
  onTap,
  onDoubleTap,
  onLongPress,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);

  // 获取触摸距离
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: now
    });

    // 多点触控 - 捏合手势
    if (e.touches.length === 2 && gestures.pinch.enabled) {
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setPinchDistance(distance);
    }

    // 长按检测
    if (gestures.longPress.enabled && !isLongPress) {
      const timer = setTimeout(() => {
        setIsLongPress(true);
        onLongPress?.({
          x: touch.clientX,
          y: touch.clientY
        });
      }, gestures.longPress.duration);
      
      setLongPressTimer(timer);
    }
  };

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    // 取消长按
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // 捏合手势处理
    if (e.touches.length === 2 && gestures.pinch.enabled && pinchDistance) {
      const newDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = newDistance / pinchDistance;
      
      if (Math.abs(scale - 1) > gestures.pinch.threshold) {
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        onPinch?.(Math.max(gestures.pinch.minScale, Math.min(gestures.pinch.maxScale, scale)), {
          x: centerX,
          y: centerY
        });
      }
    }
  };

  // 处理触摸结束
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const now = Date.now();
    
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: now
    });

    // 清除长按定时器
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // 如果是长按，不处理其他手势
    if (isLongPress) {
      setIsLongPress(false);
      return;
    }

    // 处理滑动手势
    if (touchStart && gestures.swipe.enabled) {
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = now - touchStart.time;
      const velocity = distance / duration;

      if (distance > gestures.swipe.threshold && velocity > gestures.swipe.velocity) {
        let direction: SwipeDirection;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        if (gestures.swipe.directions.includes(direction)) {
          onSwipe?.(direction);
        }
      }
    }

    // 处理点击手势
    if (touchStart && gestures.tap.enabled) {
      const distance = Math.sqrt(
        Math.pow(touch.clientX - touchStart.x, 2) + 
        Math.pow(touch.clientY - touchStart.y, 2)
      );
      const duration = now - touchStart.time;

      if (distance < gestures.tap.maxDistance && duration < gestures.tap.maxDuration) {
        // 双击检测
        if (now - lastTap < 300) {
          onDoubleTap?.({ x: touch.clientX, y: touch.clientY });
        } else {
          onTap?.({ x: touch.clientX, y: touch.clientY });
        }
        setLastTap(now);
      }
    }

    // 重置状态
    setPinchDistance(null);
  };

  return (
    <div
      ref={containerRef}
      className={`mobile-gesture-container ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

// 移动端玩家信息面板
export const MobilePlayerPanel: React.FC<{
  player: Player;
  gameState: GameState;
  compact?: boolean;
  onSkillClick?: (skillId: string) => void;
  className?: string;
}> = ({
  player,
  gameState,
  compact = false,
  onSkillClick,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);

  const getZodiacColor = (zodiac: string): string => {
    const colorMap: Record<string, string> = {
      '鼠': '#4299e1', '牛': '#48bb78', '虎': '#ed8936', '兔': '#ecc94b',
      '龙': '#e53e3e', '蛇': '#9f7aea', '马': '#38b2ac', '羊': '#f56565',
      '猴': '#d69e2e', '鸡': '#38a169', '狗': '#805ad5', '猪': '#e53e3e'
    };
    return colorMap[zodiac] || '#4a5568';
  };

  return (
    <div className={`mobile-player-panel ${compact ? 'compact' : ''} ${className}`}>
      <div 
        className="player-header"
        onClick={() => !compact && setExpanded(!expanded)}
      >
        <div 
          className="player-avatar"
          style={{ backgroundColor: getZodiacColor(player.zodiac) }}
        >
          {player.zodiac}
        </div>
        
        <div className="player-info">
          <div className="player-name">{player.name}</div>
          <div className="player-stats">
            <span className="money">💰 ¥{player.money.toLocaleString()}</span>
            <span className="properties">🏠 {player.properties.length}处</span>
            <span className="position">📍 第{player.position}格</span>
          </div>
        </div>
        
        {!compact && (
          <button className="expand-button">
            {expanded ? '▼' : '▶'}
          </button>
        )}
      </div>
      
      {expanded && !compact && (
        <div className="player-details">
          <div className="skills-section">
            <h4>技能状态</h4>
            <div className="skills-grid">
              {player.skills.map((skill) => (
                <button
                  key={skill.id}
                  className={`skill-button ${skill.cooldown > 0 ? 'cooldown' : 'available'}`}
                  onClick={() => onSkillClick?.(skill.id)}
                  disabled={skill.cooldown > 0}
                >
                  <span className="skill-icon">{skill.cooldown > 0 ? '❌' : '✅'}</span>
                  <span className="skill-name">{skill.name}</span>
                  {skill.cooldown > 0 && (
                    <span className="cooldown-time">{skill.cooldown}回合</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="status-effects">
            <h4>状态效果</h4>
            {player.statusEffects.length > 0 ? (
              player.statusEffects.map((effect) => (
                <div key={effect.id} className="status-effect">
                  <span className="effect-name">{effect.name}</span>
                  <span className="effect-duration">{effect.remainingTurns}回合</span>
                </div>
              ))
            ) : (
              <div className="no-effects">无状态效果</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 移动端完整游戏界面
export const MobileGameInterface: React.FC<{
  gameState: GameState;
  currentPlayer: Player;
  onAction?: (action: PlayerAction) => void;
  onDiceRoll?: () => void;
  onSkillUse?: (skillId: string) => void;
  className?: string;
}> = ({
  gameState,
  currentPlayer,
  onAction,
  onDiceRoll,
  onSkillUse,
  className = ''
}) => {
  const { isMobile } = useResponsive();
  const [showPlayerList, setShowPlayerList] = useState(false);

  // 默认触摸手势配置
  const gestureConfig: TouchGestureConfig = {
    swipe: {
      enabled: true,
      threshold: 50,
      velocity: 0.5,
      directions: ['up', 'down', 'left', 'right']
    },
    pinch: {
      enabled: true,
      threshold: 0.1,
      maxScale: 2,
      minScale: 0.5
    },
    tap: {
      enabled: true,
      maxDistance: 10,
      maxDuration: 300
    },
    longPress: {
      enabled: true,
      duration: 500
    }
  };

  const handleSwipe = (direction: SwipeDirection) => {
    switch (direction) {
      case 'up':
        setShowPlayerList(true);
        break;
      case 'down':
        setShowPlayerList(false);
        break;
      case 'left':
        // 可以用于切换面板
        break;
      case 'right':
        // 可以用于切换面板
        break;
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <div className={`mobile-game-interface ${className}`}>
      {/* 顶部导航 */}
      <MobileNavigation
        title="十二生肖大富翁"
        subtitle={`回合 ${gameState.round} · ${gameState.season}`}
        progress={{
          current: gameState.round,
          total: 50
        }}
        rightAction={{
          icon: '⚙️',
          onClick: () => {/* 打开设置 */}
        }}
      />

      {/* 手势容器包装棋盘 */}
      <MobileGestureContainer
        gestures={gestureConfig}
        onSwipe={handleSwipe}
        className="game-board-container"
      >
        <DualRingBoard
          board={gameState.board}
          players={gameState.players}
          currentPlayer={currentPlayer}
          interactive={true}
          theme="light"
        />
      </MobileGestureContainer>

      {/* 玩家信息面板 */}
      <MobilePlayerPanel
        player={currentPlayer}
        gameState={gameState}
        compact={!showPlayerList}
        onSkillClick={onSkillUse}
      />

      {/* 玩家列表 (可滑动显示) */}
      {showPlayerList && (
        <div className="player-list-overlay">
          <div className="player-list">
            <div className="list-header">
              <h3>所有玩家</h3>
              <button 
                className="close-button"
                onClick={() => setShowPlayerList(false)}
              >
                ✕
              </button>
            </div>
            {gameState.players.map((player) => (
              <MobilePlayerPanel
                key={player.id}
                player={player}
                gameState={gameState}
                compact={true}
                className={player.id === currentPlayer.id ? 'current-player' : ''}
              />
            ))}
          </div>
        </div>
      )}

      {/* 底部控制栏 */}
      <MobileControlBar
        primaryAction={{
          label: '掷骰子',
          icon: '🎲',
          onClick: onDiceRoll || (() => {}),
          disabled: false
        }}
        secondaryActions={[
          {
            id: 'skills',
            icon: '⚡',
            label: '技能',
            onClick: () => {/* 打开技能面板 */},
            badge: currentPlayer.skills.filter(s => s.cooldown === 0).length
          },
          {
            id: 'trade',
            icon: '🏠',
            label: '交易',
            onClick: () => {/* 打开交易面板 */}
          },
          {
            id: 'info',
            icon: '📊',
            label: '统计',
            onClick: () => {/* 打开统计面板 */}
          }
        ]}
      />

      {/* 消息提示 */}
      <div className="game-messages">
        {gameState.currentEvent && (
          <div className="current-event">
            <span className="event-icon">🎯</span>
            <span className="event-text">{gameState.currentEvent.description}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileGameInterface;