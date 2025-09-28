/**
 * 游戏交互系统 - 核心交互逻辑管理
 */

import { EventEmitter } from '../utils/EventEmitter';

// 交互事件类型
export interface InteractionEvent {
  type: InteractionEventType;
  playerId: string;
  position?: BoardPosition;
  data?: any;
  timestamp: number;
}

export type InteractionEventType =
  | 'player_click'
  | 'cell_click'
  | 'dice_roll_request'
  | 'property_purchase'
  | 'skill_activation'
  | 'gesture_detected'
  | 'animation_complete';

export interface BoardPosition {
  x: number;
  y: number;
  cellIndex?: number;
}

export interface InteractionState {
  currentPlayer: string;
  allowedActions: ActionType[];
  isAnimating: boolean;
  interactionBlocked: boolean;
  pendingActions: PendingAction[];
}

export type ActionType = 
  | 'roll_dice'
  | 'buy_property'
  | 'use_skill'
  | 'end_turn'
  | 'view_property'
  | 'make_trade';

export interface PendingAction {
  id: string;
  type: ActionType;
  playerId: string;
  data: any;
  timeout?: number;
}

/**
 * 游戏交互系统核心类
 */
export class GameInteractionSystem extends EventEmitter {
  private interactionState: InteractionState;
  private gestureManager: GestureManager;
  private actionQueue: ActionQueue;
  private feedbackManager: FeedbackManager;

  constructor() {
    super();
    this.interactionState = {
      currentPlayer: '',
      allowedActions: [],
      isAnimating: false,
      interactionBlocked: false,
      pendingActions: []
    };

    this.gestureManager = new GestureManager();
    this.actionQueue = new ActionQueue();
    this.feedbackManager = new FeedbackManager();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 手势事件监听
    this.gestureManager.on('tap', this.handleTapGesture.bind(this));
    this.gestureManager.on('longPress', this.handleLongPressGesture.bind(this));
    this.gestureManager.on('swipe', this.handleSwipeGesture.bind(this));
    this.gestureManager.on('pinch', this.handlePinchGesture.bind(this));

    // 动作队列事件
    this.actionQueue.on('actionComplete', this.handleActionComplete.bind(this));
    this.actionQueue.on('actionFailed', this.handleActionFailed.bind(this));
  }

  /**
   * 初始化交互系统
   */
  async initialize(): Promise<void> {
    await this.gestureManager.initialize();
    await this.actionQueue.initialize();
    await this.feedbackManager.initialize();
  }

  /**
   * 设置当前玩家
   */
  setCurrentPlayer(playerId: string, allowedActions: ActionType[]): void {
    this.interactionState.currentPlayer = playerId;
    this.interactionState.allowedActions = allowedActions;
    this.emit('playerChanged', { playerId, allowedActions });
  }

  /**
   * 阻止/解除交互
   */
  setInteractionBlocked(blocked: boolean, reason?: string): void {
    this.interactionState.interactionBlocked = blocked;
    this.emit('interactionStateChanged', { 
      blocked, 
      reason,
      isAnimating: this.interactionState.isAnimating
    });
  }

  /**
   * 设置动画状态
   */
  setAnimating(animating: boolean): void {
    this.interactionState.isAnimating = animating;
    this.emit('animationStateChanged', { animating });
  }

  /**
   * 处理点击手势
   */
  private async handleTapGesture(event: GestureEvent): Promise<void> {
    if (this.isInteractionBlocked()) return;

    const { position, target } = event;
    
    // 确定点击目标类型
    const targetType = this.identifyTarget(position, target);
    
    switch (targetType.type) {
      case 'dice':
        await this.handleDiceClick();
        break;
        
      case 'cell':
        await this.handleCellClick(targetType.cellIndex!);
        break;
        
      case 'player':
        await this.handlePlayerClick(targetType.playerId!);
        break;
        
      case 'property_card':
        await this.handlePropertyCardClick(targetType.propertyId!);
        break;
        
      case 'skill_button':
        await this.handleSkillClick(targetType.skillId!);
        break;
        
      default:
        // 空白区域点击
        await this.handleEmptyAreaClick(position);
    }
  }

  /**
   * 处理长按手势
   */
  private async handleLongPressGesture(event: GestureEvent): Promise<void> {
    if (this.isInteractionBlocked()) return;

    const { position, target } = event;
    const targetType = this.identifyTarget(position, target);

    switch (targetType.type) {
      case 'cell':
        await this.showCellDetails(targetType.cellIndex!);
        break;
        
      case 'player':
        await this.showPlayerDetails(targetType.playerId!);
        break;
        
      case 'property_card':
        await this.showPropertyDetails(targetType.propertyId!);
        break;
    }
  }

  /**
   * 处理滑动手势
   */
  private async handleSwipeGesture(event: SwipeGestureEvent): Promise<void> {
    const { direction, velocity } = event;

    switch (direction) {
      case 'up':
        this.emit('panelSlideUp', { velocity });
        break;
        
      case 'down':
        this.emit('panelSlideDown', { velocity });
        break;
        
      case 'left':
        this.emit('boardPanLeft', { velocity });
        break;
        
      case 'right':
        this.emit('boardPanRight', { velocity });
        break;
    }
  }

  /**
   * 处理缩放手势
   */
  private async handlePinchGesture(event: PinchGestureEvent): Promise<void> {
    const { scale, center } = event;
    this.emit('boardZoom', { scale, center });
  }

  /**
   * 处理骰子点击
   */
  private async handleDiceClick(): Promise<void> {
    if (!this.isActionAllowed('roll_dice')) return;

    try {
      this.setInteractionBlocked(true, 'rolling_dice');
      
      const action: PendingAction = {
        id: `dice_roll_${Date.now()}`,
        type: 'roll_dice',
        playerId: this.interactionState.currentPlayer,
        data: {},
        timeout: 5000
      };

      await this.actionQueue.addAction(action);
      this.feedbackManager.provideFeedback('dice_roll_start');
      
    } catch (error) {
      console.error('Dice roll failed:', error);
      this.setInteractionBlocked(false);
      this.feedbackManager.provideFeedback('action_failed', { error: error.message });
    }
  }

  /**
   * 处理格子点击
   */
  private async handleCellClick(cellIndex: number): Promise<void> {
    const cellInfo = this.getCellInfo(cellIndex);
    
    if (cellInfo.type === 'property' && !cellInfo.ownerId) {
      if (this.isActionAllowed('buy_property')) {
        await this.handlePropertyPurchase(cellIndex);
      }
    }
    
    this.emit('cellClicked', { cellIndex, cellInfo });
  }

  /**
   * 处理属性购买
   */
  private async handlePropertyPurchase(cellIndex: number): Promise<void> {
    try {
      this.setInteractionBlocked(true, 'processing_purchase');

      const action: PendingAction = {
        id: `property_purchase_${Date.now()}`,
        type: 'buy_property',
        playerId: this.interactionState.currentPlayer,
        data: { cellIndex },
        timeout: 10000
      };

      await this.actionQueue.addAction(action);
      this.feedbackManager.provideFeedback('property_purchase_start');
      
    } catch (error) {
      console.error('Property purchase failed:', error);
      this.setInteractionBlocked(false);
      this.feedbackManager.provideFeedback('action_failed', { error: error.message });
    }
  }

  /**
   * 处理技能点击
   */
  private async handleSkillClick(skillId: string): Promise<void> {
    if (!this.isActionAllowed('use_skill')) return;

    try {
      this.setInteractionBlocked(true, 'using_skill');

      const action: PendingAction = {
        id: `skill_use_${Date.now()}`,
        type: 'use_skill',
        playerId: this.interactionState.currentPlayer,
        data: { skillId },
        timeout: 8000
      };

      await this.actionQueue.addAction(action);
      this.feedbackManager.provideFeedback('skill_use_start', { skillId });
      
    } catch (error) {
      console.error('Skill use failed:', error);
      this.setInteractionBlocked(false);
      this.feedbackManager.provideFeedback('action_failed', { error: error.message });
    }
  }

  /**
   * 处理玩家点击
   */
  private async handlePlayerClick(playerId: string): Promise<void> {
    this.emit('playerSelected', { playerId });
    this.feedbackManager.provideFeedback('player_selected', { playerId });
  }

  /**
   * 处理空白区域点击
   */
  private async handleEmptyAreaClick(position: BoardPosition): Promise<void> {
    this.emit('emptyAreaClicked', { position });
    // 可以用于取消选择或关闭面板
  }

  /**
   * 显示格子详情
   */
  private async showCellDetails(cellIndex: number): Promise<void> {
    const cellInfo = this.getCellInfo(cellIndex);
    this.emit('showCellDetails', { cellIndex, cellInfo });
    this.feedbackManager.provideFeedback('cell_details_shown', { cellIndex });
  }

  /**
   * 显示玩家详情
   */
  private async showPlayerDetails(playerId: string): Promise<void> {
    this.emit('showPlayerDetails', { playerId });
    this.feedbackManager.provideFeedback('player_details_shown', { playerId });
  }

  /**
   * 显示属性详情
   */
  private async showPropertyDetails(propertyId: string): Promise<void> {
    this.emit('showPropertyDetails', { propertyId });
    this.feedbackManager.provideFeedback('property_details_shown', { propertyId });
  }

  /**
   * 处理动作完成
   */
  private handleActionComplete(action: PendingAction): void {
    this.setInteractionBlocked(false);
    this.emit('actionCompleted', action);
    this.feedbackManager.provideFeedback('action_completed', { 
      actionType: action.type 
    });
  }

  /**
   * 处理动作失败
   */
  private handleActionFailed(action: PendingAction, error: Error): void {
    this.setInteractionBlocked(false);
    this.emit('actionFailed', { action, error });
    this.feedbackManager.provideFeedback('action_failed', { 
      actionType: action.type,
      error: error.message 
    });
  }

  /**
   * 检查交互是否被阻止
   */
  private isInteractionBlocked(): boolean {
    return this.interactionState.interactionBlocked || 
           this.interactionState.isAnimating;
  }

  /**
   * 检查动作是否被允许
   */
  private isActionAllowed(actionType: ActionType): boolean {
    return this.interactionState.allowedActions.includes(actionType);
  }

  /**
   * 识别点击目标
   */
  private identifyTarget(position: BoardPosition, target: any): TargetInfo {
    // 实现目标识别逻辑
    // 这里需要根据实际的DOM结构和坐标系统来实现
    
    if (target?.classList?.contains('dice')) {
      return { type: 'dice' };
    }
    
    if (target?.classList?.contains('board-cell')) {
      const cellIndex = parseInt(target.dataset.cellIndex || '0');
      return { type: 'cell', cellIndex };
    }
    
    if (target?.classList?.contains('player-marker')) {
      const playerId = target.dataset.playerId;
      return { type: 'player', playerId };
    }
    
    if (target?.classList?.contains('property-card')) {
      const propertyId = target.dataset.propertyId;
      return { type: 'property_card', propertyId };
    }
    
    if (target?.classList?.contains('skill-button')) {
      const skillId = target.dataset.skillId;
      return { type: 'skill_button', skillId };
    }
    
    return { type: 'empty' };
  }

  /**
   * 获取格子信息
   */
  private getCellInfo(cellIndex: number): CellInfo {
    // 这里需要从游戏状态中获取格子信息
    // 临时返回示例数据
    return {
      type: 'property',
      name: `Property ${cellIndex}`,
      price: 1000 + cellIndex * 100,
      ownerId: null,
      level: 0
    };
  }

  /**
   * 获取当前交互状态
   */
  getInteractionState(): InteractionState {
    return { ...this.interactionState };
  }

  /**
   * 销毁交互系统
   */
  destroy(): void {
    this.gestureManager.destroy();
    this.actionQueue.destroy();
    this.feedbackManager.destroy();
    this.removeAllListeners();
  }
}

// 辅助接口定义
interface GestureEvent {
  position: BoardPosition;
  target: any;
  timestamp: number;
}

interface SwipeGestureEvent extends GestureEvent {
  direction: 'up' | 'down' | 'left' | 'right';
  velocity: number;
  distance: number;
}

interface PinchGestureEvent extends GestureEvent {
  scale: number;
  center: BoardPosition;
}

interface TargetInfo {
  type: 'dice' | 'cell' | 'player' | 'property_card' | 'skill_button' | 'empty';
  cellIndex?: number;
  playerId?: string;
  propertyId?: string;
  skillId?: string;
}

interface CellInfo {
  type: 'property' | 'event' | 'special';
  name: string;
  price?: number;
  ownerId?: string | null;
  level?: number;
}

/**
 * 手势管理器
 */
class GestureManager extends EventEmitter {
  private isInitialized = false;
  private touchStartTime = 0;
  private touchStartPosition: BoardPosition | null = null;
  private longPressTimer: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 设置触摸事件监听
    this.setupTouchListeners();
    this.isInitialized = true;
  }

  private setupTouchListeners(): void {
    // 实现触摸事件监听逻辑
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    
    // 鼠标事件（桌面端兼容）
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    this.touchStartTime = Date.now();
    const touch = event.touches[0];
    this.touchStartPosition = {
      x: touch.clientX,
      y: touch.clientY
    };

    // 设置长按定时器
    this.longPressTimer = setTimeout(() => {
      this.emit('longPress', {
        position: this.touchStartPosition!,
        target: event.target,
        timestamp: Date.now()
      });
    }, 800);
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const duration = Date.now() - this.touchStartTime;
    if (duration < 800 && this.touchStartPosition) {
      // 短按识别为点击
      this.emit('tap', {
        position: this.touchStartPosition,
        target: event.target,
        timestamp: Date.now()
      });
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    this.touchStartTime = Date.now();
    this.touchStartPosition = {
      x: event.clientX,
      y: event.clientY
    };
  }

  private handleMouseUp(event: MouseEvent): void {
    const duration = Date.now() - this.touchStartTime;
    if (duration < 800 && this.touchStartPosition) {
      this.emit('tap', {
        position: this.touchStartPosition,
        target: event.target,
        timestamp: Date.now()
      });
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    // 鼠标移动处理
  }

  destroy(): void {
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    
    this.removeAllListeners();
  }
}

/**
 * 动作队列管理器
 */
class ActionQueue extends EventEmitter {
  private queue: PendingAction[] = [];
  private isProcessing = false;

  async initialize(): Promise<void> {
    // 初始化队列处理逻辑
  }

  async addAction(action: PendingAction): Promise<void> {
    this.queue.push(action);
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const action = this.queue.shift()!;
      
      try {
        await this.executeAction(action);
        this.emit('actionComplete', action);
      } catch (error) {
        this.emit('actionFailed', action, error);
      }
    }

    this.isProcessing = false;
  }

  private async executeAction(action: PendingAction): Promise<void> {
    // 实现具体的动作执行逻辑
    // 这里需要与游戏引擎集成
    
    return new Promise((resolve, reject) => {
      // 模拟动作执行
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90%成功率
          resolve();
        } else {
          reject(new Error('Action execution failed'));
        }
      }, 1000);
    });
  }

  destroy(): void {
    this.queue = [];
    this.isProcessing = false;
    this.removeAllListeners();
  }
}

/**
 * 反馈管理器
 */
class FeedbackManager {
  async initialize(): Promise<void> {
    // 初始化反馈系统
  }

  provideFeedback(type: string, data?: any): void {
    console.log(`Feedback: ${type}`, data);
    
    // 实现具体的反馈逻辑
    switch (type) {
      case 'dice_roll_start':
        this.showMessage('正在投掷骰子...');
        this.playSound('dice_roll');
        this.vibrate('light');
        break;
        
      case 'property_purchase_start':
        this.showMessage('正在购买属性...');
        this.playSound('purchase');
        break;
        
      case 'skill_use_start':
        this.showMessage('正在使用技能...');
        this.playSound('skill');
        this.vibrate('medium');
        break;
        
      case 'action_completed':
        this.showMessage('动作完成');
        this.playSound('success');
        this.vibrate('light');
        break;
        
      case 'action_failed':
        this.showMessage('动作失败: ' + (data?.error || '未知错误'));
        this.playSound('error');
        this.vibrate('heavy');
        break;
    }
  }

  private showMessage(message: string): void {
    // 实现消息显示
    console.log('Message:', message);
  }

  private playSound(soundType: string): void {
    // 实现声音播放
    console.log('Play sound:', soundType);
  }

  private vibrate(intensity: 'light' | 'medium' | 'heavy'): void {
    // 实现震动反馈
    if (navigator.vibrate) {
      const patterns = {
        light: 100,
        medium: 200,
        heavy: 300
      };
      navigator.vibrate(patterns[intensity]);
    }
  }

  destroy(): void {
    // 清理反馈系统资源
  }
}

export default GameInteractionSystem;