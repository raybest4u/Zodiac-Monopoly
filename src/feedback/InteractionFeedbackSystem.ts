/**
 * 用户交互反馈系统
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface FeedbackEvent {
  type: FeedbackType;
  intensity: FeedbackIntensity;
  duration?: number;
  data?: any;
  timestamp: number;
}

export type FeedbackType =
  | 'button_press'
  | 'hover_enter'
  | 'hover_exit'
  | 'focus_gain'
  | 'focus_loss'
  | 'drag_start'
  | 'drag_end'
  | 'scroll'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'achievement'
  | 'level_up'
  | 'skill_ready'
  | 'turn_start'
  | 'game_event';

export type FeedbackIntensity = 'light' | 'medium' | 'strong' | 'extreme';

export interface FeedbackConfig {
  visual: VisualFeedbackConfig;
  haptic: HapticFeedbackConfig;
  audio: AudioFeedbackConfig;
  accessibility: AccessibilityConfig;
}

export interface VisualFeedbackConfig {
  enabled: boolean;
  animations: boolean;
  particles: boolean;
  screenEffects: boolean;
  colorBlindSupport: boolean;
  reducedMotion: boolean;
}

export interface HapticFeedbackConfig {
  enabled: boolean;
  intensity: number; // 0-1
  patterns: HapticPatternConfig;
}

export interface HapticPatternConfig {
  light: number | number[];
  medium: number | number[];
  strong: number | number[];
  extreme: number | number[];
}

export interface AudioFeedbackConfig {
  enabled: boolean;
  volume: number; // 0-1
  spatialAudio: boolean;
  voiceOver: boolean;
}

export interface AccessibilityConfig {
  screenReader: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  largeText: boolean;
  announcements: boolean;
}

/**
 * 交互反馈系统主类
 */
export class InteractionFeedbackSystem extends EventEmitter {
  private config: FeedbackConfig;
  private visualFeedback: VisualFeedbackManager;
  private hapticFeedback: HapticFeedbackManager;
  private audioFeedback: AudioFeedbackManager;
  private accessibilityFeedback: AccessibilityFeedbackManager;
  private feedbackQueue: FeedbackEvent[] = [];
  private isProcessing = false;

  constructor(config: Partial<FeedbackConfig> = {}) {
    super();
    
    this.config = {
      visual: {
        enabled: true,
        animations: true,
        particles: true,
        screenEffects: true,
        colorBlindSupport: false,
        reducedMotion: false,
        ...config.visual
      },
      haptic: {
        enabled: true,
        intensity: 0.7,
        patterns: {
          light: 50,
          medium: [50, 50, 100],
          strong: [100, 100, 200],
          extreme: [200, 100, 200, 100, 300]
        },
        ...config.haptic
      },
      audio: {
        enabled: true,
        volume: 0.5,
        spatialAudio: false,
        voiceOver: false,
        ...config.audio
      },
      accessibility: {
        screenReader: false,
        keyboardNavigation: true,
        highContrast: false,
        largeText: false,
        announcements: true,
        ...config.accessibility
      }
    };

    this.visualFeedback = new VisualFeedbackManager(this.config.visual);
    this.hapticFeedback = new HapticFeedbackManager(this.config.haptic);
    this.audioFeedback = new AudioFeedbackManager(this.config.audio);
    this.accessibilityFeedback = new AccessibilityFeedbackManager(this.config.accessibility);

    this.detectUserPreferences();
    this.setupEventListeners();
  }

  /**
   * 检测用户偏好设置
   */
  private detectUserPreferences(): void {
    // 检测动画偏好
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.visual.reducedMotion = true;
      this.config.visual.animations = false;
      this.config.visual.particles = false;
    }

    // 检测对比度偏好
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.config.accessibility.highContrast = true;
    }

    // 检测颜色方案偏好
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.visualFeedback.setDarkMode(true);
    }

    // 检测是否支持触觉反馈
    if (!('vibrate' in navigator)) {
      this.config.haptic.enabled = false;
    }

    // 检测屏幕阅读器
    if (window.speechSynthesis || this.config.accessibility.screenReader) {
      this.config.accessibility.announcements = true;
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听系统设置变化
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.config.visual.reducedMotion = e.matches;
      this.config.visual.animations = !e.matches;
      this.updateConfig();
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.config.accessibility.highContrast = e.matches;
      this.updateConfig();
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseFeedback();
      } else {
        this.resumeFeedback();
      }
    });

    // 监听焦点变化
    document.addEventListener('focusin', (e) => {
      this.triggerFeedback('focus_gain', 'light', { target: e.target });
    });

    document.addEventListener('focusout', (e) => {
      this.triggerFeedback('focus_loss', 'light', { target: e.target });
    });
  }

  /**
   * 触发反馈
   */
  async triggerFeedback(
    type: FeedbackType,
    intensity: FeedbackIntensity = 'medium',
    data?: any,
    duration?: number
  ): Promise<void> {
    const feedbackEvent: FeedbackEvent = {
      type,
      intensity,
      duration,
      data,
      timestamp: Date.now()
    };

    this.feedbackQueue.push(feedbackEvent);
    
    if (!this.isProcessing) {
      await this.processFeedbackQueue();
    }

    this.emit('feedbackTriggered', feedbackEvent);
  }

  /**
   * 处理反馈队列
   */
  private async processFeedbackQueue(): Promise<void> {
    if (this.isProcessing || this.feedbackQueue.length === 0) return;

    this.isProcessing = true;

    while (this.feedbackQueue.length > 0) {
      const feedback = this.feedbackQueue.shift()!;
      await this.executeFeedback(feedback);
    }

    this.isProcessing = false;
  }

  /**
   * 执行反馈
   */
  private async executeFeedback(feedback: FeedbackEvent): Promise<void> {
    const promises: Promise<void>[] = [];

    // 视觉反馈
    if (this.config.visual.enabled) {
      promises.push(this.visualFeedback.provideFeedback(feedback));
    }

    // 触觉反馈
    if (this.config.haptic.enabled) {
      promises.push(this.hapticFeedback.provideFeedback(feedback));
    }

    // 音频反馈
    if (this.config.audio.enabled) {
      promises.push(this.audioFeedback.provideFeedback(feedback));
    }

    // 无障碍反馈
    if (this.config.accessibility.announcements) {
      promises.push(this.accessibilityFeedback.provideFeedback(feedback));
    }

    await Promise.all(promises);
  }

  /**
   * 设置按钮交互反馈
   */
  setupButtonFeedback(button: HTMLElement): void {
    // 鼠标/触摸事件
    button.addEventListener('mouseenter', () => {
      this.triggerFeedback('hover_enter', 'light', { element: button });
    });

    button.addEventListener('mouseleave', () => {
      this.triggerFeedback('hover_exit', 'light', { element: button });
    });

    button.addEventListener('mousedown', () => {
      this.triggerFeedback('button_press', 'medium', { element: button });
    });

    button.addEventListener('touchstart', () => {
      this.triggerFeedback('button_press', 'medium', { element: button });
    }, { passive: true });

    // 键盘事件
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        this.triggerFeedback('button_press', 'medium', { element: button, keyboard: true });
      }
    });

    // 添加视觉状态类
    button.classList.add('feedback-enabled');
  }

  /**
   * 设置拖拽反馈
   */
  setupDragFeedback(element: HTMLElement): void {
    let isDragging = false;

    element.addEventListener('dragstart', (e) => {
      isDragging = true;
      this.triggerFeedback('drag_start', 'strong', { element, dataTransfer: e.dataTransfer });
    });

    element.addEventListener('dragend', () => {
      if (isDragging) {
        isDragging = false;
        this.triggerFeedback('drag_end', 'medium', { element });
      }
    });

    // 触摸拖拽支持
    let touchStartPos: { x: number; y: number } | null = null;

    element.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
      if (!touchStartPos) return;
      
      const touch = e.touches[0];
      const distance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.x, 2) + 
        Math.pow(touch.clientY - touchStartPos.y, 2)
      );

      if (distance > 10 && !isDragging) {
        isDragging = true;
        this.triggerFeedback('drag_start', 'strong', { element, touch: true });
      }
    }, { passive: true });

    element.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        this.triggerFeedback('drag_end', 'medium', { element, touch: true });
      }
      touchStartPos = null;
    }, { passive: true });
  }

  /**
   * 设置滚动反馈
   */
  setupScrollFeedback(container: HTMLElement): void {
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;

    container.addEventListener('scroll', () => {
      if (!isScrolling) {
        isScrolling = true;
        this.triggerFeedback('scroll', 'light', { 
          element: container,
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft
        });
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 150);
    }, { passive: true });
  }

  /**
   * 提供游戏事件反馈
   */
  provideGameFeedback(eventType: string, data?: any): void {
    let feedbackType: FeedbackType;
    let intensity: FeedbackIntensity;

    switch (eventType) {
      case 'dice_rolled':
        feedbackType = 'game_event';
        intensity = 'medium';
        break;
      case 'property_bought':
        feedbackType = 'success';
        intensity = 'strong';
        break;
      case 'money_lost':
        feedbackType = 'warning';
        intensity = 'medium';
        break;
      case 'player_eliminated':
        feedbackType = 'error';
        intensity = 'extreme';
        break;
      case 'level_up':
        feedbackType = 'level_up';
        intensity = 'extreme';
        break;
      case 'achievement_unlocked':
        feedbackType = 'achievement';
        intensity = 'extreme';
        break;
      case 'turn_start':
        feedbackType = 'turn_start';
        intensity = 'medium';
        break;
      case 'skill_ready':
        feedbackType = 'skill_ready';
        intensity = 'light';
        break;
      default:
        feedbackType = 'info';
        intensity = 'light';
    }

    this.triggerFeedback(feedbackType, intensity, data);
  }

  /**
   * 暂停反馈
   */
  pauseFeedback(): void {
    this.visualFeedback.pause();
    this.audioFeedback.pause();
    this.emit('feedbackPaused');
  }

  /**
   * 恢复反馈
   */
  resumeFeedback(): void {
    this.visualFeedback.resume();
    this.audioFeedback.resume();
    this.emit('feedbackResumed');
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<FeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.visualFeedback.updateConfig(this.config.visual);
    this.hapticFeedback.updateConfig(this.config.haptic);
    this.audioFeedback.updateConfig(this.config.audio);
    this.accessibilityFeedback.updateConfig(this.config.accessibility);
    this.emit('configUpdated', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): FeedbackConfig {
    return { ...this.config };
  }

  /**
   * 销毁反馈系统
   */
  destroy(): void {
    this.visualFeedback.destroy();
    this.hapticFeedback.destroy();
    this.audioFeedback.destroy();
    this.accessibilityFeedback.destroy();
    this.removeAllListeners();
  }
}

/**
 * 视觉反馈管理器
 */
class VisualFeedbackManager {
  private config: VisualFeedbackConfig;
  private particleSystem: VisualParticleSystem | null = null;
  private animationSystem: VisualAnimationSystem | null = null;
  private darkMode = false;
  private isPaused = false;

  constructor(config: VisualFeedbackConfig) {
    this.config = config;
    this.initializeSystems();
  }

  private initializeSystems(): void {
    if (this.config.particles) {
      this.particleSystem = new VisualParticleSystem();
    }

    if (this.config.animations) {
      this.animationSystem = new VisualAnimationSystem(this.config.reducedMotion);
    }
  }

  async provideFeedback(feedback: FeedbackEvent): Promise<void> {
    if (this.isPaused) return;

    const { type, intensity, data } = feedback;

    // 根据反馈类型提供视觉效果
    switch (type) {
      case 'button_press':
        await this.animateButtonPress(data.element, intensity);
        break;
      case 'hover_enter':
        await this.animateHoverEnter(data.element);
        break;
      case 'hover_exit':
        await this.animateHoverExit(data.element);
        break;
      case 'focus_gain':
        await this.animateFocusGain(data.target);
        break;
      case 'success':
        await this.showSuccessEffect(data);
        break;
      case 'error':
        await this.showErrorEffect(data);
        break;
      case 'achievement':
        await this.showAchievementEffect(data);
        break;
      case 'level_up':
        await this.showLevelUpEffect(data);
        break;
    }
  }

  private async animateButtonPress(element: HTMLElement, intensity: FeedbackIntensity): Promise<void> {
    if (!this.animationSystem || !element) return;

    const scaleAmount = {
      light: 0.95,
      medium: 0.9,
      strong: 0.85,
      extreme: 0.8
    }[intensity];

    await this.animationSystem.animate(element, [
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: `scale(${scaleAmount})`, filter: 'brightness(1.2)' },
      { transform: 'scale(1)', filter: 'brightness(1)' }
    ], {
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
  }

  private async animateHoverEnter(element: HTMLElement): Promise<void> {
    if (!element) return;

    element.style.transition = 'all 0.2s ease';
    element.style.transform = 'scale(1.05)';
    element.style.filter = 'brightness(1.1)';
  }

  private async animateHoverExit(element: HTMLElement): Promise<void> {
    if (!element) return;

    element.style.transform = 'scale(1)';
    element.style.filter = 'brightness(1)';
  }

  private async animateFocusGain(element: HTMLElement): Promise<void> {
    if (!element) return;

    element.style.outline = '2px solid #4A90E2';
    element.style.outlineOffset = '2px';
    element.style.boxShadow = '0 0 0 4px rgba(74, 144, 226, 0.3)';
  }

  private async showSuccessEffect(data: any): Promise<void> {
    if (this.particleSystem) {
      this.particleSystem.createSuccessParticles(data.position || { x: 0, y: 0 });
    }

    this.createScreenFlash('#00FF00', 0.1);
  }

  private async showErrorEffect(data: any): Promise<void> {
    if (this.particleSystem) {
      this.particleSystem.createErrorParticles(data.position || { x: 0, y: 0 });
    }

    this.createScreenFlash('#FF0000', 0.15);
  }

  private async showAchievementEffect(data: any): Promise<void> {
    if (this.particleSystem) {
      this.particleSystem.createAchievementParticles();
    }

    this.createScreenFlash('#FFD700', 0.3);
  }

  private async showLevelUpEffect(data: any): Promise<void> {
    if (this.particleSystem) {
      this.particleSystem.createLevelUpParticles(data.position || { x: 0, y: 0 });
    }

    this.createScreenFlash('#FFFF00', 0.25);
  }

  private createScreenFlash(color: string, opacity: number): void {
    if (!this.config.screenEffects) return;

    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: ${color};
      opacity: ${opacity};
      pointer-events: none;
      z-index: 999999;
      animation: screen-flash 0.3s ease-out;
    `;

    document.body.appendChild(flash);

    setTimeout(() => {
      document.body.removeChild(flash);
    }, 300);
  }

  setDarkMode(enabled: boolean): void {
    this.darkMode = enabled;
    document.body.classList.toggle('dark-mode', enabled);
  }

  pause(): void {
    this.isPaused = true;
    this.particleSystem?.pause();
    this.animationSystem?.pause();
  }

  resume(): void {
    this.isPaused = false;
    this.particleSystem?.resume();
    this.animationSystem?.resume();
  }

  updateConfig(config: VisualFeedbackConfig): void {
    this.config = config;
    
    if (config.particles && !this.particleSystem) {
      this.particleSystem = new VisualParticleSystem();
    } else if (!config.particles && this.particleSystem) {
      this.particleSystem.destroy();
      this.particleSystem = null;
    }

    if (config.animations && !this.animationSystem) {
      this.animationSystem = new VisualAnimationSystem(config.reducedMotion);
    } else if (!config.animations && this.animationSystem) {
      this.animationSystem.destroy();
      this.animationSystem = null;
    }
  }

  destroy(): void {
    this.particleSystem?.destroy();
    this.animationSystem?.destroy();
  }
}

/**
 * 触觉反馈管理器
 */
class HapticFeedbackManager {
  private config: HapticFeedbackConfig;

  constructor(config: HapticFeedbackConfig) {
    this.config = config;
  }

  async provideFeedback(feedback: FeedbackEvent): Promise<void> {
    if (!this.config.enabled || !navigator.vibrate) return;

    const pattern = this.getVibrationPattern(feedback.type, feedback.intensity);
    if (pattern) {
      navigator.vibrate(pattern);
    }
  }

  private getVibrationPattern(type: FeedbackType, intensity: FeedbackIntensity): number | number[] | null {
    const basePattern = this.config.patterns[intensity];
    const intensityMultiplier = this.config.intensity;

    // 根据反馈类型调整模式
    if (Array.isArray(basePattern)) {
      return basePattern.map(duration => Math.floor(duration * intensityMultiplier));
    } else {
      return Math.floor(basePattern * intensityMultiplier);
    }
  }

  updateConfig(config: HapticFeedbackConfig): void {
    this.config = config;
  }

  destroy(): void {
    // 停止当前震动
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  }
}

/**
 * 音频反馈管理器
 */
class AudioFeedbackManager {
  private config: AudioFeedbackConfig;
  private audioContext: AudioContext | null = null;
  private soundLibrary = new Map<string, AudioBuffer>();
  private isPaused = false;

  constructor(config: AudioFeedbackConfig) {
    this.config = config;
    this.initializeAudio();
  }

  private async initializeAudio(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.loadSounds();
    } catch (error) {
      console.warn('Audio feedback initialization failed:', error);
    }
  }

  private async loadSounds(): Promise<void> {
    // 生成各种反馈音效
    const soundTypes = [
      'button_press', 'hover', 'success', 'error', 'warning',
      'achievement', 'level_up', 'turn_start', 'skill_ready'
    ];

    for (const type of soundTypes) {
      try {
        const buffer = await this.generateSound(type);
        this.soundLibrary.set(type, buffer);
      } catch (error) {
        console.warn(`Failed to generate sound for ${type}:`, error);
      }
    }
  }

  private async generateSound(type: string): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const duration = 0.2;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // 根据类型生成不同的音效
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (type) {
        case 'button_press':
          sample = Math.sin(t * Math.PI * 800) * Math.exp(-t * 8) * 0.3;
          break;
        case 'hover':
          sample = Math.sin(t * Math.PI * 1200) * Math.exp(-t * 12) * 0.1;
          break;
        case 'success':
          sample = Math.sin(t * Math.PI * (440 + t * 220)) * Math.exp(-t * 3) * 0.4;
          break;
        case 'error':
          sample = Math.sin(t * Math.PI * 150) * Math.exp(-t * 2) * 0.5;
          break;
        case 'achievement':
          sample = Math.sin(t * Math.PI * (880 + Math.sin(t * 20) * 100)) * Math.exp(-t * 2) * 0.4;
          break;
      }

      data[i] = sample;
    }

    return buffer;
  }

  async provideFeedback(feedback: FeedbackEvent): Promise<void> {
    if (!this.config.enabled || this.isPaused || !this.audioContext) return;

    const soundName = this.getSoundName(feedback.type);
    const buffer = this.soundLibrary.get(soundName);

    if (buffer) {
      this.playSound(buffer, this.config.volume);
    }
  }

  private getSoundName(type: FeedbackType): string {
    const soundMap: { [key: string]: string } = {
      'button_press': 'button_press',
      'hover_enter': 'hover',
      'hover_exit': 'hover',
      'success': 'success',
      'error': 'error',
      'warning': 'warning',
      'achievement': 'achievement',
      'level_up': 'level_up',
      'turn_start': 'turn_start',
      'skill_ready': 'skill_ready'
    };

    return soundMap[type] || 'button_press';
  }

  private playSound(buffer: AudioBuffer, volume: number): void {
    if (!this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  updateConfig(config: AudioFeedbackConfig): void {
    this.config = config;
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.soundLibrary.clear();
  }
}

/**
 * 无障碍反馈管理器
 */
class AccessibilityFeedbackManager {
  private config: AccessibilityConfig;
  private announcer: HTMLElement | null = null;

  constructor(config: AccessibilityConfig) {
    this.config = config;
    this.createAnnouncer();
  }

  private createAnnouncer(): void {
    if (!this.config.announcements) return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.announcer);
  }

  async provideFeedback(feedback: FeedbackEvent): Promise<void> {
    if (!this.config.announcements || !this.announcer) return;

    const message = this.getFeedbackMessage(feedback);
    if (message) {
      // 清空后重新设置，确保屏幕阅读器读取
      this.announcer.textContent = '';
      setTimeout(() => {
        if (this.announcer) {
          this.announcer.textContent = message;
        }
      }, 100);
    }
  }

  private getFeedbackMessage(feedback: FeedbackEvent): string | null {
    const { type, data } = feedback;

    switch (type) {
      case 'button_press':
        return '按钮已激活';
      case 'focus_gain':
        return '元素已获得焦点';
      case 'success':
        return data?.message || '操作成功';
      case 'error':
        return data?.message || '操作失败';
      case 'achievement':
        return `成就解锁: ${data?.name || '未知成就'}`;
      case 'level_up':
        return `等级提升到 ${data?.level || ''}`;
      case 'turn_start':
        return '轮到你了';
      case 'skill_ready':
        return '技能已准备就绪';
      default:
        return null;
    }
  }

  updateConfig(config: AccessibilityConfig): void {
    this.config = config;
    
    if (config.announcements && !this.announcer) {
      this.createAnnouncer();
    } else if (!config.announcements && this.announcer) {
      document.body.removeChild(this.announcer);
      this.announcer = null;
    }
  }

  destroy(): void {
    if (this.announcer) {
      document.body.removeChild(this.announcer);
      this.announcer = null;
    }
  }
}

// 辅助类定义
class VisualParticleSystem {
  createSuccessParticles(position: { x: number; y: number }): void {
    // 实现成功粒子效果
  }

  createErrorParticles(position: { x: number; y: number }): void {
    // 实现错误粒子效果
  }

  createAchievementParticles(): void {
    // 实现成就粒子效果
  }

  createLevelUpParticles(position: { x: number; y: number }): void {
    // 实现升级粒子效果
  }

  pause(): void {
    // 暂停粒子系统
  }

  resume(): void {
    // 恢复粒子系统
  }

  destroy(): void {
    // 销毁粒子系统
  }
}

class VisualAnimationSystem {
  private reducedMotion: boolean;

  constructor(reducedMotion: boolean) {
    this.reducedMotion = reducedMotion;
  }

  async animate(element: HTMLElement, keyframes: any[], options: any): Promise<void> {
    if (this.reducedMotion) {
      // 在减少动画模式下使用简化动画
      options.duration = Math.min(options.duration, 100);
    }

    return new Promise(resolve => {
      element.animate(keyframes, options).addEventListener('finish', () => resolve());
    });
  }

  pause(): void {
    // 暂停动画系统
  }

  resume(): void {
    // 恢复动画系统
  }

  destroy(): void {
    // 销毁动画系统
  }
}

// 添加CSS样式
const feedbackStyles = document.createElement('style');
feedbackStyles.textContent = `
  @keyframes screen-flash {
    0% { opacity: 0; }
    50% { opacity: var(--flash-opacity, 0.1); }
    100% { opacity: 0; }
  }

  .feedback-enabled {
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .feedback-enabled:focus-visible {
    outline: 2px solid #4A90E2;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .feedback-enabled {
      transition: none;
    }
  }

  @media (prefers-contrast: high) {
    .feedback-enabled:focus-visible {
      outline-width: 3px;
    }
  }
`;

document.head.appendChild(feedbackStyles);

export default InteractionFeedbackSystem;