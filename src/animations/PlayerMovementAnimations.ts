/**
 * 玩家移动动画系统
 */

import { EventEmitter } from '../utils/EventEmitter';

// 动画相关类型定义
export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
  delay?: number;
  repeat?: boolean;
  yoyo?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface PlayerMovementData {
  playerId: string;
  startPosition: Position;
  endPosition: Position;
  path?: Position[];
  cellIndices?: number[];
}

export interface MovementAnimationOptions extends AnimationConfig {
  pathType: 'direct' | 'arc' | 'bounce' | 'follow_board';
  showTrail?: boolean;
  highlightCells?: boolean;
  pauseAtCells?: number[];
}

export type EasingFunction = 
  | 'linear'
  | 'easeIn' 
  | 'easeOut' 
  | 'easeInOut'
  | 'bounce'
  | 'elastic'
  | 'back'
  | 'spring';

/**
 * 玩家移动动画管理器
 */
export class PlayerMovementAnimations extends EventEmitter {
  private activeAnimations = new Map<string, Animation>();
  private animationFrame: number = 0;
  private boardConfig: BoardConfig;
  private cellPositions: Map<number, Position> = new Map();

  constructor(boardConfig: BoardConfig) {
    super();
    this.boardConfig = boardConfig;
    this.calculateCellPositions();
  }

  /**
   * 计算棋盘格子位置
   */
  private calculateCellPositions(): void {
    const { centerX, centerY, outerRadius, innerRadius, cellCount } = this.boardConfig;
    
    // 外环格子位置计算
    for (let i = 0; i < cellCount; i++) {
      const angle = (i / cellCount) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * outerRadius;
      const y = centerY + Math.sin(angle) * outerRadius;
      this.cellPositions.set(i, { x, y });
    }

    // 内环格子位置计算（如果存在）
    if (this.boardConfig.hasInnerRing) {
      const innerCellCount = this.boardConfig.innerCellCount || 8;
      for (let i = 0; i < innerCellCount; i++) {
        const angle = (i / innerCellCount) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * innerRadius;
        const y = centerY + Math.sin(angle) * innerRadius;
        this.cellPositions.set(cellCount + i, { x, y });
      }
    }
  }

  /**
   * 开始玩家移动动画
   */
  async animatePlayerMovement(
    movementData: PlayerMovementData,
    options: MovementAnimationOptions = {
      duration: 2000,
      easing: 'easeInOut',
      pathType: 'follow_board',
      showTrail: true,
      highlightCells: true
    }
  ): Promise<void> {
    const { playerId, startPosition, endPosition, cellIndices } = movementData;

    // 如果已有该玩家的动画在进行，先停止
    if (this.activeAnimations.has(playerId)) {
      this.stopAnimation(playerId);
    }

    // 计算移动路径
    const path = this.calculateMovementPath(
      startPosition,
      endPosition,
      cellIndices || [],
      options.pathType
    );

    // 创建动画对象
    const animation = new PlayerAnimation(
      playerId,
      path,
      options,
      this.getPlayerElement(playerId)
    );

    // 注册动画事件监听
    this.setupAnimationListeners(animation);

    // 开始动画
    this.activeAnimations.set(playerId, animation);
    await animation.start();

    this.emit('movementStarted', { playerId, path, options });
  }

  /**
   * 计算移动路径
   */
  private calculateMovementPath(
    startPosition: Position,
    endPosition: Position,
    cellIndices: number[],
    pathType: 'direct' | 'arc' | 'bounce' | 'follow_board'
  ): Position[] {
    const path: Position[] = [];

    switch (pathType) {
      case 'direct':
        path.push(startPosition, endPosition);
        break;

      case 'arc':
        path.push(...this.generateArcPath(startPosition, endPosition));
        break;

      case 'bounce':
        path.push(...this.generateBouncePath(startPosition, endPosition));
        break;

      case 'follow_board':
        path.push(...this.generateBoardPath(cellIndices));
        break;
    }

    return path;
  }

  /**
   * 生成弧形路径
   */
  private generateArcPath(start: Position, end: Position): Position[] {
    const path: Position[] = [start];
    const steps = 20;
    
    // 计算弧的控制点
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const controlX = midX;
    const controlY = midY - 100; // 弧形高度

    // 生成贝塞尔曲线路径
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = this.quadraticBezier(start.x, controlX, end.x, t);
      const y = this.quadraticBezier(start.y, controlY, end.y, t);
      path.push({ x, y });
    }

    return path;
  }

  /**
   * 生成弹跳路径
   */
  private generateBouncePath(start: Position, end: Position): Position[] {
    const path: Position[] = [start];
    const steps = 30;
    const bounceHeight = 50;
    const bounceCount = 3;

    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      
      // 线性插值基础位置
      const baseX = start.x + (end.x - start.x) * progress;
      const baseY = start.y + (end.y - start.y) * progress;
      
      // 添加弹跳效果
      const bounceOffset = Math.sin(progress * Math.PI * bounceCount) * 
                           bounceHeight * 
                           (1 - progress); // 逐渐减小弹跳幅度
      
      path.push({
        x: baseX,
        y: baseY - bounceOffset
      });
    }

    return path;
  }

  /**
   * 生成沿棋盘移动的路径
   */
  private generateBoardPath(cellIndices: number[]): Position[] {
    const path: Position[] = [];
    
    for (const cellIndex of cellIndices) {
      const position = this.cellPositions.get(cellIndex);
      if (position) {
        path.push(position);
      }
    }

    return path;
  }

  /**
   * 二次贝塞尔曲线计算
   */
  private quadraticBezier(p0: number, p1: number, p2: number, t: number): number {
    return Math.pow(1 - t, 2) * p0 + 2 * (1 - t) * t * p1 + Math.pow(t, 2) * p2;
  }

  /**
   * 设置动画事件监听
   */
  private setupAnimationListeners(animation: PlayerAnimation): void {
    animation.on('progress', (data) => {
      this.emit('movementProgress', data);
    });

    animation.on('cellReached', (data) => {
      this.emit('cellReached', data);
    });

    animation.on('complete', (data) => {
      this.activeAnimations.delete(data.playerId);
      this.emit('movementComplete', data);
    });

    animation.on('stopped', (data) => {
      this.activeAnimations.delete(data.playerId);
      this.emit('movementStopped', data);
    });
  }

  /**
   * 停止玩家动画
   */
  stopAnimation(playerId: string): void {
    const animation = this.activeAnimations.get(playerId);
    if (animation) {
      animation.stop();
      this.activeAnimations.delete(playerId);
    }
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations(): void {
    for (const [playerId, animation] of this.activeAnimations) {
      animation.stop();
    }
    this.activeAnimations.clear();
  }

  /**
   * 获取玩家DOM元素
   */
  private getPlayerElement(playerId: string): HTMLElement | null {
    return document.querySelector(`[data-player-id="${playerId}"]`);
  }

  /**
   * 检查动画是否正在进行
   */
  isAnimating(playerId?: string): boolean {
    if (playerId) {
      return this.activeAnimations.has(playerId);
    }
    return this.activeAnimations.size > 0;
  }

  /**
   * 获取活动动画数量
   */
  getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }
}

/**
 * 单个玩家动画类
 */
class PlayerAnimation extends EventEmitter {
  private playerId: string;
  private path: Position[];
  private options: MovementAnimationOptions;
  private element: HTMLElement | null;
  private startTime: number = 0;
  private currentIndex: number = 0;
  private isRunning: boolean = false;
  private animationId: number = 0;

  constructor(
    playerId: string,
    path: Position[],
    options: MovementAnimationOptions,
    element: HTMLElement | null
  ) {
    super();
    this.playerId = playerId;
    this.path = path;
    this.options = options;
    this.element = element;
  }

  /**
   * 开始动画
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = performance.now();
    this.currentIndex = 0;

    if (this.options.delay) {
      await this.delay(this.options.delay);
    }

    this.animate();

    return new Promise((resolve, reject) => {
      this.once('complete', resolve);
      this.once('stopped', reject);
    });
  }

  /**
   * 动画主循环
   */
  private animate(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.options.duration, 1);

    // 计算当前位置
    const position = this.calculateCurrentPosition(progress);
    
    // 更新元素位置
    this.updateElementPosition(position);

    // 发射进度事件
    this.emit('progress', {
      playerId: this.playerId,
      progress,
      position,
      elapsed
    });

    // 检查是否到达特定格子
    this.checkCellReached(position);

    if (progress >= 1) {
      this.complete();
    } else {
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * 计算当前位置
   */
  private calculateCurrentPosition(progress: number): Position {
    const easedProgress = this.applyEasing(progress, this.options.easing);
    
    if (this.path.length < 2) {
      return this.path[0] || { x: 0, y: 0 };
    }

    // 计算在路径上的位置
    const totalSegments = this.path.length - 1;
    const segmentProgress = easedProgress * totalSegments;
    const segmentIndex = Math.floor(segmentProgress);
    const segmentLocalProgress = segmentProgress - segmentIndex;

    if (segmentIndex >= totalSegments) {
      return this.path[this.path.length - 1];
    }

    const startPoint = this.path[segmentIndex];
    const endPoint = this.path[segmentIndex + 1];

    return {
      x: startPoint.x + (endPoint.x - startPoint.x) * segmentLocalProgress,
      y: startPoint.y + (endPoint.y - startPoint.y) * segmentLocalProgress
    };
  }

  /**
   * 应用缓动函数
   */
  private applyEasing(progress: number, easing: EasingFunction): number {
    switch (easing) {
      case 'linear':
        return progress;
      
      case 'easeIn':
        return Math.pow(progress, 2);
      
      case 'easeOut':
        return 1 - Math.pow(1 - progress, 2);
      
      case 'easeInOut':
        return progress < 0.5
          ? 2 * Math.pow(progress, 2)
          : 1 - 2 * Math.pow(1 - progress, 2);
      
      case 'bounce':
        return this.bounceEase(progress);
      
      case 'elastic':
        return this.elasticEase(progress);
      
      case 'back':
        return this.backEase(progress);
      
      case 'spring':
        return this.springEase(progress);
      
      default:
        return progress;
    }
  }

  /**
   * 弹跳缓动
   */
  private bounceEase(t: number): number {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }

  /**
   * 弹性缓动
   */
  private elasticEase(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * (2 * Math.PI) / 0.4) + 1;
  }

  /**
   * 回弹缓动
   */
  private backEase(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }

  /**
   * 弹簧缓动
   */
  private springEase(t: number): number {
    return 1 - Math.cos(t * Math.PI * 2) * Math.exp(-t * 6);
  }

  /**
   * 更新元素位置
   */
  private updateElementPosition(position: Position): void {
    if (!this.element) return;

    this.element.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    
    // 添加旋转效果（朝向移动方向）
    if (this.path.length > 1) {
      const direction = this.calculateDirection(position);
      this.element.style.transform += ` rotate(${direction}deg)`;
    }

    // 添加缩放效果
    const scale = 1 + Math.sin(performance.now() * 0.01) * 0.1;
    this.element.style.transform += ` scale(${scale})`;
  }

  /**
   * 计算移动方向
   */
  private calculateDirection(currentPosition: Position): number {
    // 简单的方向计算逻辑
    const nextIndex = Math.min(this.currentIndex + 1, this.path.length - 1);
    if (nextIndex === this.currentIndex) return 0;

    const next = this.path[nextIndex];
    const dx = next.x - currentPosition.x;
    const dy = next.y - currentPosition.y;
    
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * 检查是否到达格子
   */
  private checkCellReached(position: Position): void {
    // 检查是否接近某个格子位置
    // 这里需要根据实际需求实现
  }

  /**
   * 完成动画
   */
  private complete(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.emit('complete', {
      playerId: this.playerId,
      finalPosition: this.path[this.path.length - 1]
    });
  }

  /**
   * 停止动画
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.emit('stopped', {
      playerId: this.playerId,
      position: this.calculateCurrentPosition(
        Math.min((performance.now() - this.startTime) / this.options.duration, 1)
      )
    });
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 棋盘配置接口
interface BoardConfig {
  centerX: number;
  centerY: number;
  outerRadius: number;
  innerRadius: number;
  cellCount: number;
  hasInnerRing: boolean;
  innerCellCount?: number;
}

export default PlayerMovementAnimations;