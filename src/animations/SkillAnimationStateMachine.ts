/**
 * 技能动画状态机
 * Day 4: 技能动画和特效
 * 
 * 实现复杂的技能动画流程管理，包括：
 * - 状态转换和条件控制
 * - 动画队列和优先级管理
 * - 并发动画协调
 * - 动画中断和恢复
 * - 性能监控和优化
 * - 调试和可视化工具
 */

import type { ZodiacSign, Season } from '../types/game';
import { EnhancedParticleSystem } from './EnhancedParticleSystem';
import ZodiacVisualEffects from './ZodiacVisualEffects';

/**
 * 动画状态枚举
 */
export enum AnimationState {
  IDLE = 'idle',                    // 空闲状态
  PREPARING = 'preparing',          // 准备中
  CASTING = 'casting',             // 施法中
  CHANNELING = 'channeling',       // 引导中
  EXECUTING = 'executing',         // 执行中
  IMPACTING = 'impacting',         // 冲击中
  RECOVERING = 'recovering',       // 恢复中
  INTERRUPTED = 'interrupted',     // 被中断
  COMPLETED = 'completed',         // 已完成
  FAILED = 'failed'               // 失败
}

/**
 * 动画事件枚举
 */
export enum AnimationEvent {
  START = 'start',
  PREPARE = 'prepare',
  CAST = 'cast',
  CHANNEL = 'channel',
  EXECUTE = 'execute',
  IMPACT = 'impact',
  RECOVER = 'recover',
  COMPLETE = 'complete',
  INTERRUPT = 'interrupt',
  FAIL = 'fail',
  RESET = 'reset'
}

/**
 * 动画优先级枚举
 */
export enum AnimationPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
  IMMEDIATE = 4
}

/**
 * 动画配置接口
 */
export interface AnimationConfig {
  id: string;
  priority: AnimationPriority;
  duration: number;
  interruptible: boolean;
  canQueue: boolean;
  maxInstances: number;
  
  // 状态配置
  states: {
    [key in AnimationState]?: {
      duration?: number;
      canSkip?: boolean;
      requiredConditions?: string[];
      onEnter?: () => void | Promise<void>;
      onUpdate?: (progress: number) => void;
      onExit?: () => void | Promise<void>;
    };
  };
  
  // 转换规则
  transitions: {
    from: AnimationState;
    to: AnimationState;
    event: AnimationEvent;
    condition?: () => boolean;
    action?: () => void | Promise<void>;
  }[];
  
  // 技能特定配置
  skillConfig?: {
    zodiac: ZodiacSign;
    skillType: string;
    visualEffects: boolean;
    soundEffects: boolean;
    cameraEffects: boolean;
  };
}

/**
 * 动画实例接口
 */
export interface AnimationInstance {
  id: string;
  config: AnimationConfig;
  currentState: AnimationState;
  startTime: number;
  stateStartTime: number;
  progress: number;
  context: AnimationContext;
  
  // 运行时数据
  runtimeData: Map<string, any>;
  
  // 状态历史
  stateHistory: Array<{
    state: AnimationState;
    timestamp: number;
    duration: number;
  }>;
}

/**
 * 动画上下文接口
 */
export interface AnimationContext {
  position: { x: number; y: number };
  targets: Array<{ x: number; y: number }>;
  caster?: {
    id: string;
    zodiac: ZodiacSign;
    level: number;
  };
  environment?: {
    season: Season;
    timeOfDay: string;
    weather?: string;
  };
  gameState?: any;
}

/**
 * 状态转换规则
 */
interface StateTransition {
  from: AnimationState;
  to: AnimationState;
  event: AnimationEvent;
  condition?: () => boolean;
  action?: () => void | Promise<void>;
}

/**
 * 动画队列项
 */
interface QueuedAnimation {
  config: AnimationConfig;
  context: AnimationContext;
  priority: AnimationPriority;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

/**
 * 技能动画状态机主类
 */
export class SkillAnimationStateMachine {
  // 系统组件
  private particleSystem: EnhancedParticleSystem;
  private zodiacEffects: ZodiacVisualEffects;
  
  // 状态管理
  private activeAnimations: Map<string, AnimationInstance> = new Map();
  private animationQueue: QueuedAnimation[] = [];
  private stateTransitions: Map<string, StateTransition[]> = new Map();
  
  // 性能监控
  private performanceMonitor: PerformanceMonitor;
  private maxConcurrentAnimations: number = 10;
  private frameRate: number = 60;
  private lastFrameTime: number = 0;
  
  // 调试和监控
  private debugMode: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();
  
  // 定时器
  private updateTimer: number = 0;
  private isRunning: boolean = false;
  
  constructor(
    canvas: HTMLCanvasElement,
    options: {
      maxConcurrentAnimations?: number;
      debugMode?: boolean;
      frameRate?: number;
    } = {}
  ) {
    this.particleSystem = new EnhancedParticleSystem(canvas);
    this.zodiacEffects = new ZodiacVisualEffects(canvas);
    this.performanceMonitor = new PerformanceMonitor();
    
    this.maxConcurrentAnimations = options.maxConcurrentAnimations || 10;
    this.debugMode = options.debugMode || false;
    this.frameRate = options.frameRate || 60;
    
    this.initializeDefaultTransitions();
    this.start();
  }
  
  /**
   * 初始化默认状态转换
   */
  private initializeDefaultTransitions(): void {
    const defaultTransitions: StateTransition[] = [
      // 启动流程
      { from: AnimationState.IDLE, to: AnimationState.PREPARING, event: AnimationEvent.START },
      { from: AnimationState.PREPARING, to: AnimationState.CASTING, event: AnimationEvent.PREPARE },
      { from: AnimationState.CASTING, to: AnimationState.CHANNELING, event: AnimationEvent.CAST },
      { from: AnimationState.CHANNELING, to: AnimationState.EXECUTING, event: AnimationEvent.CHANNEL },
      { from: AnimationState.EXECUTING, to: AnimationState.IMPACTING, event: AnimationEvent.EXECUTE },
      { from: AnimationState.IMPACTING, to: AnimationState.RECOVERING, event: AnimationEvent.IMPACT },
      { from: AnimationState.RECOVERING, to: AnimationState.COMPLETED, event: AnimationEvent.RECOVER },
      
      // 异常处理
      { from: AnimationState.PREPARING, to: AnimationState.INTERRUPTED, event: AnimationEvent.INTERRUPT },
      { from: AnimationState.CASTING, to: AnimationState.INTERRUPTED, event: AnimationEvent.INTERRUPT },
      { from: AnimationState.CHANNELING, to: AnimationState.INTERRUPTED, event: AnimationEvent.INTERRUPT },
      { from: AnimationState.EXECUTING, to: AnimationState.FAILED, event: AnimationEvent.FAIL },
      
      // 恢复和重置
      { from: AnimationState.INTERRUPTED, to: AnimationState.IDLE, event: AnimationEvent.RESET },
      { from: AnimationState.FAILED, to: AnimationState.IDLE, event: AnimationEvent.RESET },
      { from: AnimationState.COMPLETED, to: AnimationState.IDLE, event: AnimationEvent.RESET }
    ];
    
    // 组织转换规则
    for (const transition of defaultTransitions) {
      const key = `${transition.from}`;
      if (!this.stateTransitions.has(key)) {
        this.stateTransitions.set(key, []);
      }
      this.stateTransitions.get(key)!.push(transition);
    }
  }
  
  /**
   * 播放技能动画
   */
  public async playSkillAnimation(
    config: AnimationConfig,
    context: AnimationContext
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查是否可以立即执行
      if (this.canExecuteImmediately(config)) {
        this.executeAnimation(config, context).then(resolve).catch(reject);
      } else if (config.canQueue) {
        // 加入队列
        this.animationQueue.push({
          config,
          context,
          priority: config.priority,
          timestamp: Date.now(),
          resolve,
          reject
        });
        this.sortQueue();
      } else {
        reject(new Error('动画无法执行且不允许排队'));
      }
    });
  }
  
  /**
   * 检查是否可以立即执行动画
   */
  private canExecuteImmediately(config: AnimationConfig): boolean {
    // 检查并发限制
    if (this.activeAnimations.size >= this.maxConcurrentAnimations) {
      return false;
    }
    
    // 检查实例限制
    const sameTypeCount = Array.from(this.activeAnimations.values())
      .filter(instance => instance.config.id === config.id).length;
    
    if (sameTypeCount >= config.maxInstances) {
      return false;
    }
    
    // 检查优先级
    if (config.priority < AnimationPriority.HIGH) {
      const hasHighPriorityAnimations = Array.from(this.activeAnimations.values())
        .some(instance => instance.config.priority >= AnimationPriority.HIGH);
      
      if (hasHighPriorityAnimations) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 执行动画
   */
  private async executeAnimation(
    config: AnimationConfig,
    context: AnimationContext
  ): Promise<void> {
    const instanceId = `${config.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建动画实例
    const instance: AnimationInstance = {
      id: instanceId,
      config: config,
      currentState: AnimationState.IDLE,
      startTime: Date.now(),
      stateStartTime: Date.now(),
      progress: 0,
      context: context,
      runtimeData: new Map(),
      stateHistory: []
    };
    
    this.activeAnimations.set(instanceId, instance);
    
    try {
      // 发送启动事件
      await this.sendEvent(instance, AnimationEvent.START);
      
      // 等待动画完成
      await this.waitForCompletion(instance);
      
      this.emit('animationCompleted', { instance });
    } catch (error) {
      this.emit('animationFailed', { instance, error });
      throw error;
    } finally {
      this.activeAnimations.delete(instanceId);
      this.processQueue();
    }
  }
  
  /**
   * 发送事件到动画实例
   */
  private async sendEvent(instance: AnimationInstance, event: AnimationEvent): Promise<void> {
    const currentState = instance.currentState;
    const transitions = this.stateTransitions.get(currentState) || 
                       instance.config.transitions.filter(t => t.from === currentState);
    
    // 查找匹配的转换
    const transition = transitions.find(t => 
      t.event === event && (!t.condition || t.condition())
    );
    
    if (!transition) {
      if (this.debugMode) {
        console.warn(`无法从状态 ${currentState} 处理事件 ${event}`);
      }
      return;
    }
    
    // 记录状态历史
    instance.stateHistory.push({
      state: instance.currentState,
      timestamp: Date.now(),
      duration: Date.now() - instance.stateStartTime
    });
    
    // 退出当前状态
    const currentStateConfig = instance.config.states[currentState];
    if (currentStateConfig?.onExit) {
      await currentStateConfig.onExit();
    }
    
    // 执行转换动作
    if (transition.action) {
      await transition.action();
    }
    
    // 进入新状态
    instance.currentState = transition.to;
    instance.stateStartTime = Date.now();
    
    const newStateConfig = instance.config.states[transition.to];
    if (newStateConfig?.onEnter) {
      await newStateConfig.onEnter();
    }
    
    // 触发特定状态的效果
    await this.executeStateEffect(instance, transition.to);
    
    this.emit('stateChanged', {
      instance,
      from: currentState,
      to: transition.to,
      event
    });
    
    if (this.debugMode) {
      console.log(`动画 ${instance.id}: ${currentState} -> ${transition.to} (${event})`);
    }
  }
  
  /**
   * 执行状态特效
   */
  private async executeStateEffect(instance: AnimationInstance, state: AnimationState): Promise<void> {
    const { context, config } = instance;
    const skillConfig = config.skillConfig;
    
    if (!skillConfig || !skillConfig.visualEffects) {
      return;
    }
    
    try {
      switch (state) {
        case AnimationState.PREPARING:
          // 创建准备阶段特效
          await this.zodiacEffects.playZodiacSkillEffect(
            skillConfig.zodiac,
            'preparation',
            context.position,
            [],
            {
              season: context.environment?.season,
              intensity: 0.5,
              duration: config.states.preparing?.duration || 500
            }
          );
          break;
          
        case AnimationState.CASTING:
          // 创建施法阶段特效
          await this.zodiacEffects.playZodiacSkillEffect(
            skillConfig.zodiac,
            'casting',
            context.position,
            context.targets,
            {
              season: context.environment?.season,
              intensity: 1.0,
              duration: config.states.casting?.duration || 1000
            }
          );
          break;
          
        case AnimationState.IMPACTING:
          // 创建冲击阶段特效
          for (const target of context.targets) {
            await this.zodiacEffects.playZodiacSkillEffect(
              skillConfig.zodiac,
              'impact',
              target,
              [],
              {
                season: context.environment?.season,
                intensity: 1.5,
                duration: config.states.impacting?.duration || 800
              }
            );
          }
          break;
      }
    } catch (error) {
      console.warn('状态特效执行失败:', error);
    }
  }
  
  /**
   * 等待动画完成
   */
  private async waitForCompletion(instance: AnimationInstance): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        if (instance.currentState === AnimationState.COMPLETED) {
          resolve();
        } else if (instance.currentState === AnimationState.FAILED) {
          reject(new Error('动画执行失败'));
        } else {
          // 继续等待
          setTimeout(checkCompletion, 50);
        }
      };
      
      checkCompletion();
    });
  }
  
  /**
   * 中断动画
   */
  public async interruptAnimation(instanceId: string): Promise<void> {
    const instance = this.activeAnimations.get(instanceId);
    if (!instance) {
      return;
    }
    
    if (instance.config.interruptible) {
      await this.sendEvent(instance, AnimationEvent.INTERRUPT);
    }
  }
  
  /**
   * 中断所有动画
   */
  public async interruptAllAnimations(): Promise<void> {
    const promises = Array.from(this.activeAnimations.keys())
      .map(id => this.interruptAnimation(id));
    
    await Promise.all(promises);
  }
  
  /**
   * 排序队列
   */
  private sortQueue(): void {
    this.animationQueue.sort((a, b) => {
      // 优先级优先
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // 时间戳其次
      return a.timestamp - b.timestamp;
    });
  }
  
  /**
   * 处理队列
   */
  private processQueue(): void {
    while (this.animationQueue.length > 0) {
      const queued = this.animationQueue[0];
      
      if (this.canExecuteImmediately(queued.config)) {
        this.animationQueue.shift();
        this.executeAnimation(queued.config, queued.context)
          .then(queued.resolve)
          .catch(queued.reject);
      } else {
        break;
      }
    }
  }
  
  /**
   * 开始状态机
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.lastFrameTime = Date.now();
    this.gameLoop();
  }
  
  /**
   * 停止状态机
   */
  public stop(): void {
    this.isRunning = false;
    if (this.updateTimer) {
      cancelAnimationFrame(this.updateTimer);
    }
  }
  
  /**
   * 游戏循环
   */
  private gameLoop(): void {
    if (!this.isRunning) {
      return;
    }
    
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // 更新所有活跃动画
    this.updateAnimations(deltaTime);
    
    // 处理队列
    this.processQueue();
    
    // 更新性能监控
    this.performanceMonitor.update(deltaTime);
    
    // 继续循环
    this.updateTimer = requestAnimationFrame(() => this.gameLoop());
  }
  
  /**
   * 更新所有动画
   */
  private updateAnimations(deltaTime: number): void {
    for (const [id, instance] of this.activeAnimations) {
      try {
        this.updateAnimation(instance, deltaTime);
      } catch (error) {
        console.error(`更新动画 ${id} 时出错:`, error);
        this.sendEvent(instance, AnimationEvent.FAIL);
      }
    }
  }
  
  /**
   * 更新单个动画
   */
  private updateAnimation(instance: AnimationInstance, deltaTime: number): void {
    const currentTime = Date.now();
    const stateElapsed = currentTime - instance.stateStartTime;
    const totalElapsed = currentTime - instance.startTime;
    
    // 更新进度
    instance.progress = totalElapsed / instance.config.duration;
    
    // 调用状态更新回调
    const stateConfig = instance.config.states[instance.currentState];
    if (stateConfig?.onUpdate) {
      const stateProgress = stateConfig.duration ? 
        stateElapsed / stateConfig.duration : 0;
      stateConfig.onUpdate(stateProgress);
    }
    
    // 检查状态是否应该自动转换
    this.checkAutoTransitions(instance, stateElapsed);
    
    // 检查总体超时
    if (totalElapsed >= instance.config.duration) {
      if (instance.currentState !== AnimationState.COMPLETED) {
        this.sendEvent(instance, AnimationEvent.COMPLETE);
      }
    }
  }
  
  /**
   * 检查自动转换
   */
  private checkAutoTransitions(instance: AnimationInstance, stateElapsed: number): void {
    const stateConfig = instance.config.states[instance.currentState];
    
    if (stateConfig?.duration && stateElapsed >= stateConfig.duration) {
      // 自动转换到下一个状态
      const nextEvent = this.getNextEvent(instance.currentState);
      if (nextEvent) {
        this.sendEvent(instance, nextEvent);
      }
    }
  }
  
  /**
   * 获取下一个事件
   */
  private getNextEvent(currentState: AnimationState): AnimationEvent | null {
    const eventMap: { [key in AnimationState]: AnimationEvent | null } = {
      [AnimationState.IDLE]: AnimationEvent.START,
      [AnimationState.PREPARING]: AnimationEvent.PREPARE,
      [AnimationState.CASTING]: AnimationEvent.CAST,
      [AnimationState.CHANNELING]: AnimationEvent.CHANNEL,
      [AnimationState.EXECUTING]: AnimationEvent.EXECUTE,
      [AnimationState.IMPACTING]: AnimationEvent.IMPACT,
      [AnimationState.RECOVERING]: AnimationEvent.RECOVER,
      [AnimationState.INTERRUPTED]: AnimationEvent.RESET,
      [AnimationState.COMPLETED]: null,
      [AnimationState.FAILED]: AnimationEvent.RESET
    };
    
    return eventMap[currentState];
  }
  
  /**
   * 事件发射器
   */
  private emit(eventName: string, data: any): void {
    const listeners = this.eventListeners.get(eventName) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('事件监听器出错:', error);
      }
    });
  }
  
  /**
   * 添加事件监听器
   */
  public on(eventName: string, listener: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(listener);
  }
  
  /**
   * 移除事件监听器
   */
  public off(eventName: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * 获取性能统计
   */
  public getPerformanceStats(): {
    activeAnimations: number;
    queuedAnimations: number;
    averageFrameTime: number;
    memoryUsage: number;
    particleStats: any;
  } {
    return {
      activeAnimations: this.activeAnimations.size,
      queuedAnimations: this.animationQueue.length,
      averageFrameTime: this.performanceMonitor.getAverageFrameTime(),
      memoryUsage: this.performanceMonitor.getMemoryUsage(),
      particleStats: this.particleSystem.getPerformanceStats()
    };
  }
  
  /**
   * 获取调试信息
   */
  public getDebugInfo(): {
    activeAnimations: Array<{
      id: string;
      state: AnimationState;
      progress: number;
      stateHistory: any[];
    }>;
    queueInfo: Array<{
      priority: AnimationPriority;
      timestamp: number;
      configId: string;
    }>;
  } {
    return {
      activeAnimations: Array.from(this.activeAnimations.values()).map(instance => ({
        id: instance.id,
        state: instance.currentState,
        progress: instance.progress,
        stateHistory: instance.stateHistory
      })),
      queueInfo: this.animationQueue.map(queued => ({
        priority: queued.priority,
        timestamp: queued.timestamp,
        configId: queued.config.id
      }))
    };
  }
  
  /**
   * 创建标准技能动画配置
   */
  public static createStandardSkillConfig(
    skillId: string,
    zodiac: ZodiacSign,
    skillType: string,
    duration: number = 3000
  ): AnimationConfig {
    return {
      id: skillId,
      priority: AnimationPriority.NORMAL,
      duration: duration,
      interruptible: true,
      canQueue: true,
      maxInstances: 3,
      
      states: {
        [AnimationState.PREPARING]: {
          duration: duration * 0.2,
          canSkip: false
        },
        [AnimationState.CASTING]: {
          duration: duration * 0.4,
          canSkip: false
        },
        [AnimationState.EXECUTING]: {
          duration: duration * 0.2,
          canSkip: false
        },
        [AnimationState.IMPACTING]: {
          duration: duration * 0.15,
          canSkip: true
        },
        [AnimationState.RECOVERING]: {
          duration: duration * 0.05,
          canSkip: true
        }
      },
      
      transitions: [],
      
      skillConfig: {
        zodiac: zodiac,
        skillType: skillType,
        visualEffects: true,
        soundEffects: true,
        cameraEffects: false
      }
    };
  }
  
  /**
   * 清理所有动画
   */
  public clearAllAnimations(): void {
    this.activeAnimations.clear();
    this.animationQueue = [];
    this.particleSystem.clearAll();
    this.zodiacEffects.clearAllEffects();
  }
  
  /**
   * 销毁状态机
   */
  public destroy(): void {
    this.stop();
    this.clearAllAnimations();
    this.particleSystem.destroy();
    this.zodiacEffects.destroy();
    this.eventListeners.clear();
  }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  private frameTimes: number[] = [];
  private maxSamples: number = 60;
  
  update(deltaTime: number): void {
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }
  
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }
  
  getMemoryUsage(): number {
    // 简化版内存使用估算
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}

export default SkillAnimationStateMachine;