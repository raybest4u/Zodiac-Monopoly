import type { ReactNode, CSSProperties } from 'react';
import type { ZodiacSign, Player, GameState, BoardCell, PlayerAction } from './game';
import type { Theme, ComponentSize, AnimationType } from './ui';

// ==================== 响应式布局系统 ====================

// 视口尺寸类型
export type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'large';

// 响应式断点配置
export interface ResponsiveBreakpoints {
  mobile: number;    // < 768px
  tablet: number;    // 768px - 1024px
  desktop: number;   // 1024px - 1440px
  large: number;     // >= 1440px
}

// 响应式配置接口
export interface ResponsiveConfig<T = any> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  large?: T;
}

// 响应式布局容器接口
export interface ResponsiveLayoutProps {
  children: ReactNode;
  maxWidth?: ResponsiveConfig<string>;
  padding?: ResponsiveConfig<string>;
  columns?: ResponsiveConfig<number>;
  gap?: ResponsiveConfig<string>;
  className?: string;
  style?: CSSProperties;
}

// 网格容器接口
export interface GridContainerProps {
  children: ReactNode;
  columns?: ResponsiveConfig<number>;
  rows?: ResponsiveConfig<number>;
  gap?: ResponsiveConfig<string>;
  areas?: ResponsiveConfig<string[]>;
  className?: string;
  style?: CSSProperties;
}

// 网格项接口
export interface GridItemProps {
  children: ReactNode;
  column?: ResponsiveConfig<string>;
  row?: ResponsiveConfig<string>;
  area?: ResponsiveConfig<string>;
  className?: string;
  style?: CSSProperties;
}

// ==================== 双环棋盘组件 ====================

// 双环棋盘配置
export interface DualRingBoardConfig {
  outerRing: {
    cellCount: number;
    cellSize: ResponsiveConfig<number>;
    borderRadius: number;
    spacing: number;
  };
  innerRing: {
    cellCount: number;
    cellSize: ResponsiveConfig<number>;
    borderRadius: number;
    spacing: number;
  };
  connections: ConnectionPath[];
  center: {
    size: ResponsiveConfig<number>;
    content: CenterContent;
  };
}

// 连接路径配置
export interface ConnectionPath {
  id: string;
  fromRing: 'outer' | 'inner';
  toRing: 'outer' | 'inner';
  fromPosition: number;
  toPosition: number;
  style: {
    color: string;
    width: number;
    dashArray?: string;
    animated?: boolean;
  };
}

// 中央内容配置
export interface CenterContent {
  type: 'info' | 'stats' | 'season' | 'custom';
  content: ReactNode;
  background: string;
  border: string;
}

// 双环棋盘组件接口
export interface DualRingBoardProps {
  config: DualRingBoardConfig;
  board: BoardCell[];
  players: Player[];
  currentPlayer: Player;
  onCellClick?: (cell: BoardCell, ring: 'outer' | 'inner', position: number) => void;
  onPlayerMove?: (player: Player, from: number, to: number, ring: 'outer' | 'inner') => void;
  highlightedCells?: { ring: 'outer' | 'inner'; positions: number[] }[];
  animations?: DualRingAnimation[];
  theme?: Theme;
  interactive?: boolean;
  className?: string;
}

// 双环动画配置
export interface DualRingAnimation {
  type: 'player_move' | 'cell_highlight' | 'ring_connection' | 'dice_roll';
  target: {
    ring?: 'outer' | 'inner';
    position?: number;
    playerId?: string;
  };
  duration: number;
  delay?: number;
  easing?: string;
  onComplete?: () => void;
}

// 棋盘格子组件接口
export interface BoardCellProps {
  cell: BoardCell;
  ring: 'outer' | 'inner';
  position: number;
  size: number;
  players: Player[];
  highlighted?: boolean;
  interactive?: boolean;
  theme?: Theme;
  onClick?: () => void;
  onPlayerMove?: (playerId: string, targetPosition: number) => void;
  className?: string;
}

// 玩家棋子组件接口
export interface PlayerTokenProps {
  player: Player;
  size: number;
  position: number;
  ring: 'outer' | 'inner';
  isMoving?: boolean;
  isCurrentPlayer?: boolean;
  theme?: Theme;
  onClick?: () => void;
  className?: string;
}

// ==================== 游戏界面主要组件 ====================

// 游戏主界面布局
export interface GameLayoutProps {
  children: ReactNode;
  mode: 'desktop' | 'mobile';
  sidebar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

// 玩家信息面板
export interface PlayerInfoPanelProps {
  player: Player;
  gameState: GameState;
  layout: 'sidebar' | 'bottom' | 'overlay';
  compact?: boolean;
  showAvatar?: boolean;
  showStats?: boolean;
  showSkills?: boolean;
  onSkillClick?: (skillId: string) => void;
  onPlayerClick?: () => void;
  className?: string;
}

// 游戏控制面板
export interface GameControlPanelProps {
  gameState: GameState;
  availableActions: PlayerAction[];
  layout: 'vertical' | 'horizontal' | 'grid';
  size?: ComponentSize;
  onDiceRoll?: () => void;
  onSkillUse?: (skillId: string) => void;
  onPropertyTrade?: () => void;
  onEndTurn?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  className?: string;
}

// 消息面板组件
export interface MessagePanelProps {
  messages: GameMessage[];
  maxMessages?: number;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  onClear?: () => void;
  className?: string;
}

// 游戏消息接口
export interface GameMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action' | 'system';
  playerId?: string;
  content: string;
  timestamp: number;
  icon?: ReactNode;
  duration?: number;
}

// ==================== 移动端特殊组件 ====================

// 移动端导航栏
export interface MobileNavigationProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: ReactNode;
    onClick: () => void;
  };
  rightAction?: {
    icon: ReactNode;
    onClick: () => void;
  };
  progress?: {
    current: number;
    total: number;
  };
  className?: string;
}

// 移动端底部控制栏
export interface MobileControlBarProps {
  primaryAction: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryActions?: {
    id: string;
    icon: ReactNode;
    label?: string;
    onClick: () => void;
    disabled?: boolean;
    badge?: number | string;
  }[];
  className?: string;
}

// 触摸手势识别
export interface TouchGestureConfig {
  swipe: {
    enabled: boolean;
    threshold: number;
    velocity: number;
    directions: SwipeDirection[];
  };
  pinch: {
    enabled: boolean;
    threshold: number;
    maxScale: number;
    minScale: number;
  };
  tap: {
    enabled: boolean;
    maxDistance: number;
    maxDuration: number;
  };
  longPress: {
    enabled: boolean;
    duration: number;
  };
}

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

// 移动端手势容器
export interface MobileGestureContainerProps {
  children: ReactNode;
  gestures: TouchGestureConfig;
  onSwipe?: (direction: SwipeDirection) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onTap?: (position: { x: number; y: number }) => void;
  onDoubleTap?: (position: { x: number; y: number }) => void;
  onLongPress?: (position: { x: number; y: number }) => void;
  className?: string;
}

// ==================== 主题和样式系统 ====================

// 主题配置接口
export interface GameThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    zodiac: Record<ZodiacSign, string>;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

// 主题提供者接口
export interface ThemeProviderProps {
  children: ReactNode;
  theme: GameThemeConfig;
  mode: 'light' | 'dark' | 'auto';
  responsive: boolean;
  className?: string;
}

// CSS变量生成器接口
export interface CSSVariables {
  [key: string]: string | number;
}

// ==================== 动画和过渡系统 ====================

// 动画配置
export interface AnimationConfig {
  name: string;
  duration: number;
  delay?: number;
  easing?: string;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  playState?: 'running' | 'paused';
}

// 过渡动画组件
export interface TransitionProps {
  children: ReactNode;
  show: boolean;
  enter?: AnimationConfig;
  exit?: AnimationConfig;
  onEnter?: () => void;
  onExit?: () => void;
  onEntered?: () => void;
  onExited?: () => void;
  className?: string;
}

// 页面过渡配置
export interface PageTransitionConfig {
  type: 'fade' | 'slide' | 'zoom' | 'flip';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration: number;
  easing: string;
}

// ==================== 性能优化组件 ====================

// 懒加载组件
export interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  onLoad?: () => void;
  className?: string;
}

// 虚拟化列表
export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: ResponsiveConfig<number>;
  containerHeight: number;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  overscan?: number;
  scrollToIndex?: number;
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  className?: string;
}

// 图片懒加载
export interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  threshold?: number;
  sizes?: ResponsiveConfig<string>;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

// ==================== 可访问性增强 ====================

// 键盘导航配置
export interface KeyboardNavigationConfig {
  enabled: boolean;
  focusVisible: boolean;
  trapFocus: boolean;
  restoreFocus: boolean;
  initialFocus?: string;
  keyMap: Record<string, string>;
}

// 屏幕阅读器支持
export interface ScreenReaderProps {
  children: ReactNode;
  announcements?: string[];
  liveRegion?: 'polite' | 'assertive' | 'off';
  skipLinks?: { href: string; text: string }[];
  landmarks?: boolean;
  className?: string;
}

// 高对比度模式
export interface HighContrastProps {
  enabled: boolean;
  level: 'normal' | 'enhanced' | 'maximum';
  children: ReactNode;
  className?: string;
}

// ==================== 调试和开发工具 ====================

// 组件调试信息
export interface ComponentDebugInfo {
  name: string;
  props: Record<string, any>;
  renderTime: number;
  updateCount: number;
  memoryUsage?: number;
}

// 性能监控组件
export interface PerformanceMonitorProps {
  children: ReactNode;
  enabled: boolean;
  onMetric?: (metric: PerformanceMetric) => void;
  className?: string;
}

// 性能指标
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  component?: string;
}

// 错误边界配置
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: any) => void;
  resetKeys?: any[];
  resetOnPropsChange?: boolean;
  className?: string;
}

export default {};