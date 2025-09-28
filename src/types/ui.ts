import type { ReactNode, MouseEvent, KeyboardEvent, TouchEvent } from 'react';
import type { ZodiacSign, Player, GameState, BoardCell, PlayerAction, GameEvent } from './game';

// 基础UI类型

// 主题类型
export type Theme = 'light' | 'dark' | 'zodiac' | 'traditional' | 'modern' | 'auto';

// 颜色方案接口
export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// 组件尺寸类型
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 动画类型
export type AnimationType = 
  | 'fade' | 'slide' | 'zoom' | 'bounce' | 'flip' | 'rotate' | 'shake' | 'pulse';

// 响应式断点
export interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// 布局组件接口

// 布局容器接口
export interface LayoutContainerProps {
  children: ReactNode;
  className?: string;
  responsive?: boolean;
  maxWidth?: string;
  padding?: string;
  background?: string;
}

// 网格系统接口
export interface GridProps {
  children: ReactNode;
  columns?: number;
  gap?: string;
  responsive?: ResponsiveGridConfig;
  className?: string;
}

// 响应式网格配置
export interface ResponsiveGridConfig {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

// 游戏组件接口

// 游戏棋盘组件接口
export interface GameBoardProps {
  board: BoardCell[];
  players: Player[];
  currentPlayer: Player;
  onCellClick?: (cell: BoardCell, position: number) => void;
  onPlayerMove?: (player: Player, from: number, to: number) => void;
  highlightedCells?: number[];
  animations?: BoardAnimation[];
  theme?: Theme;
  size?: ComponentSize;
  interactive?: boolean;
}

// 棋盘动画接口
export interface BoardAnimation {
  type: 'move_player' | 'highlight_cell' | 'property_purchase' | 'dice_roll';
  target: string | number;
  duration: number;
  delay?: number;
  easing?: string;
  onComplete?: () => void;
}

// 玩家卡片组件接口
export interface PlayerCardProps {
  player: Player;
  isCurrentPlayer?: boolean;
  showStats?: boolean;
  showSkills?: boolean;
  compact?: boolean;
  interactive?: boolean;
  onPlayerClick?: (player: Player) => void;
  onSkillClick?: (skillId: string) => void;
  className?: string;
}

// 技能面板组件接口
export interface SkillPanelProps {
  player: Player;
  gameState: GameState;
  onSkillUse?: (skillId: string) => void;
  onSkillUpgrade?: (skillId: string) => void;
  showDescriptions?: boolean;
  layout?: 'grid' | 'list' | 'carousel';
  filterBy?: SkillFilter;
  sortBy?: SkillSort;
}

// 技能筛选类型
export type SkillFilter = 'all' | 'available' | 'cooldown' | 'passive' | 'active';

// 技能排序类型
export type SkillSort = 'name' | 'level' | 'cooldown' | 'effectiveness' | 'zodiac';

// 控制面板组件接口
export interface ControlPanelProps {
  gameState: GameState;
  currentPlayer: Player;
  availableActions: PlayerAction[];
  onAction?: (action: PlayerAction) => void;
  onDiceRoll?: () => void;
  onEndTurn?: () => void;
  onSettings?: () => void;
  showHelp?: boolean;
  layout?: 'vertical' | 'horizontal' | 'compact';
}

// 骰子组件接口
export interface DiceProps {
  value1?: number;
  value2?: number;
  isRolling?: boolean;
  onRoll?: () => void;
  disabled?: boolean;
  size?: ComponentSize;
  theme?: 'classic' | 'zodiac' | 'modern';
  animation?: DiceAnimation;
}

// 骰子动画配置
export interface DiceAnimation {
  type: 'spin' | 'bounce' | 'fade' | 'zoom';
  duration: number;
  iterations?: number;
  delay?: number;
}

// 属性卡片组件接口
export interface PropertyCardProps {
  property: BoardCell;
  owner?: Player;
  canPurchase?: boolean;
  canUpgrade?: boolean;
  onPurchase?: () => void;
  onUpgrade?: () => void;
  onSell?: () => void;
  showValue?: boolean;
  size?: ComponentSize;
  interactive?: boolean;
}

// 事件对话框组件接口
export interface EventDialogProps {
  event: GameEvent;
  player: Player;
  gameState: GameState;
  onChoice?: (choiceId: string) => void;
  onClose?: () => void;
  autoClose?: boolean;
  timeout?: number;
  showAnimation?: boolean;
}

// 交互组件接口

// 按钮组件接口
export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ComponentSize;
  color?: ButtonColor;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

// 按钮变体类型
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' | 'icon';

// 按钮颜色类型
export type ButtonColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'zodiac';

// 模态框组件接口
export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
  centered?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  footer?: ReactNode;
  className?: string;
  overlayClassName?: string;
}

// 模态框尺寸类型
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// 输入框组件接口
export interface InputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: InputType;
  size?: ComponentSize;
  disabled?: boolean;
  readonly?: boolean;
  error?: string;
  label?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  maxLength?: number;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyPress?: (event: KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

// 输入框类型
export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';

// 选择器组件接口
export interface SelectProps {
  value?: string | string[];
  defaultValue?: string | string[];
  options: SelectOption[];
  placeholder?: string;
  size?: ComponentSize;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  error?: string;
  label?: string;
  onChange?: (value: string | string[]) => void;
  onSearch?: (search: string) => void;
  className?: string;
}

// 选择器选项接口
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
  group?: string;
}

// 滑块组件接口
export interface SliderProps {
  value?: number | number[];
  defaultValue?: number | number[];
  min?: number;
  max?: number;
  step?: number;
  range?: boolean;
  disabled?: boolean;
  marks?: SliderMark[];
  tooltip?: boolean;
  formatTooltip?: (value: number) => string;
  onChange?: (value: number | number[]) => void;
  onAfterChange?: (value: number | number[]) => void;
  className?: string;
}

// 滑块标记接口
export interface SliderMark {
  value: number;
  label: ReactNode;
  style?: React.CSSProperties;
}

// 通知组件接口

// 通知接口
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  icon?: ReactNode;
  action?: NotificationAction;
  timestamp: number;
  dismissed?: boolean;
}

// 通知类型
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'game';

// 通知动作接口
export interface NotificationAction {
  label: string;
  onClick: () => void;
}

// 通知提供者接口
export interface NotificationProviderProps {
  children: ReactNode;
  position?: NotificationPosition;
  maxCount?: number;
  duration?: number;
}

// 通知位置类型
export type NotificationPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// 加载组件接口

// 加载器组件接口
export interface LoaderProps {
  loading?: boolean;
  size?: ComponentSize;
  color?: string;
  overlay?: boolean;
  tip?: string;
  children?: ReactNode;
  className?: string;
}

// 骨架屏组件接口
export interface SkeletonProps {
  loading?: boolean;
  animated?: boolean;
  rows?: number;
  avatar?: boolean;
  title?: boolean;
  paragraph?: SkeletonParagraph;
  children?: ReactNode;
  className?: string;
}

// 骨架屏段落配置
export interface SkeletonParagraph {
  rows?: number;
  width?: string | string[];
}

// 进度条组件接口
export interface ProgressProps {
  percent: number;
  type?: ProgressType;
  size?: ComponentSize;
  status?: ProgressStatus;
  showInfo?: boolean;
  strokeColor?: string | ProgressStrokeColor;
  format?: (percent: number) => ReactNode;
  className?: string;
}

// 进度条类型
export type ProgressType = 'line' | 'circle' | 'dashboard';

// 进度条状态
export type ProgressStatus = 'normal' | 'active' | 'success' | 'exception';

// 进度条颜色配置
export interface ProgressStrokeColor {
  from: string;
  to: string;
  direction?: string;
}

// 导航组件接口

// 菜单组件接口
export interface MenuProps {
  items: MenuItem[];
  selectedKeys?: string[];
  openKeys?: string[];
  mode?: MenuMode;
  theme?: MenuTheme;
  collapsed?: boolean;
  onSelect?: (key: string, item: MenuItem) => void;
  onOpenChange?: (openKeys: string[]) => void;
  className?: string;
}

// 菜单项接口
export interface MenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  children?: MenuItem[];
  onClick?: (event: MouseEvent) => void;
}

// 菜单模式类型
export type MenuMode = 'vertical' | 'horizontal' | 'inline';

// 菜单主题类型
export type MenuTheme = 'light' | 'dark' | 'zodiac';

// 面包屑组件接口
export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

// 面包屑项接口
export interface BreadcrumbItem {
  title: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent) => void;
}

// 分页组件接口
export interface PaginationProps {
  current: number;
  total: number;
  pageSize?: number;
  pageSizeOptions?: string[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => ReactNode;
  size?: ComponentSize;
  disabled?: boolean;
  onChange?: (page: number, pageSize: number) => void;
  className?: string;
}

// 专用游戏组件接口

// 生肖选择器组件接口
export interface ZodiacSelectorProps {
  value?: ZodiacSign;
  onChange?: (zodiac: ZodiacSign) => void;
  disabled?: boolean;
  showDescription?: boolean;
  layout?: 'grid' | 'circle' | 'list';
  size?: ComponentSize;
  interactive?: boolean;
  className?: string;
}

// AI配置组件接口
export interface AIConfigProps {
  aiOpponents: AIOpponentConfig[];
  onChange?: (opponents: AIOpponentConfig[]) => void;
  maxOpponents?: number;
  showPreview?: boolean;
  allowCustomization?: boolean;
  className?: string;
}

// AI对手配置接口
export interface AIOpponentConfig {
  id: string;
  name: string;
  zodiac: ZodiacSign;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  avatar?: string;
  personalityOverrides?: Record<string, number>;
}

// 游戏统计组件接口
export interface GameStatsProps {
  stats: GameStatistics;
  timeframe?: 'session' | 'daily' | 'weekly' | 'monthly' | 'all_time';
  showCharts?: boolean;
  interactive?: boolean;
  exportable?: boolean;
  className?: string;
}

// 游戏统计接口
export interface GameStatistics {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  averageGameTime: number;
  totalPlayTime: number;
  favoriteZodiac: ZodiacSign;
  achievements: number;
  highScore: number;
}

// 语音控制组件接口
export interface VoiceControlProps {
  enabled?: boolean;
  language?: string;
  commands?: VoiceCommand[];
  onCommand?: (command: string, parameters: Record<string, any>) => void;
  onError?: (error: string) => void;
  showVisualization?: boolean;
  hotword?: string;
  className?: string;
}

// 语音命令接口
export interface VoiceCommand {
  pattern: string;
  action: string;
  description: string;
  parameters?: VoiceParameter[];
  aliases?: string[];
}

// 语音参数接口
export interface VoiceParameter {
  name: string;
  type: 'number' | 'string' | 'zodiac' | 'action';
  required?: boolean;
  defaultValue?: any;
}

// 音效组件接口
export interface AudioControlProps {
  enabled?: boolean;
  volume?: number;
  sounds?: SoundEffect[];
  onVolumeChange?: (volume: number) => void;
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

// 音效接口
export interface SoundEffect {
  id: string;
  name: string;
  url: string;
  volume?: number;
  loop?: boolean;
  category: SoundCategory;
}

// 音效类别类型
export type SoundCategory = 'ui' | 'game' | 'ambient' | 'voice' | 'music';

// 触摸手势接口
export interface TouchGestureProps {
  onSwipe?: (direction: SwipeDirection) => void;
  onPinch?: (scale: number) => void;
  onTap?: (event: TouchEvent) => void;
  onDoubleTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

// 滑动方向类型
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

// 可访问性接口
export interface AccessibilityProps {
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaHidden?: boolean;
  tabIndex?: number;
  onKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

// 工具提示组件接口
export interface TooltipProps {
  children: ReactNode;
  title: ReactNode;
  placement?: TooltipPlacement;
  trigger?: TooltipTrigger;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  overlayClassName?: string;
  delay?: number;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
}

// 工具提示位置类型
export type TooltipPlacement = 
  | 'top' | 'topLeft' | 'topRight'
  | 'bottom' | 'bottomLeft' | 'bottomRight'
  | 'left' | 'leftTop' | 'leftBottom'
  | 'right' | 'rightTop' | 'rightBottom';

// 工具提示触发方式
export type TooltipTrigger = 'hover' | 'focus' | 'click' | 'contextMenu';

// 拖拽接口
export interface DragDropProps {
  draggable?: boolean;
  droppable?: boolean;
  dragData?: any;
  onDragStart?: (data: any) => void;
  onDragEnd?: (data: any) => void;
  onDrop?: (data: any) => void;
  onDragOver?: (data: any) => boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

// 虚拟滚动组件接口
export interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => ReactNode;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

// 响应式图片组件接口
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  srcSet?: string;
  loading?: 'lazy' | 'eager';
  placeholder?: ReactNode;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}