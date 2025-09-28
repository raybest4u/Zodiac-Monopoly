/**
 * 骰子动画系统
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface DiceResult {
  value1: number;
  value2: number;
  sum: number;
  isDouble: boolean;
}

export interface DiceAnimationOptions {
  duration: number;
  bounceCount: number;
  showTrail: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  rollSpeed: number;
  finalPause: number;
}

export interface DiceVisualEffect {
  type: 'spark' | 'glow' | 'shadow' | 'rotation';
  intensity: number;
  color?: string;
  duration?: number;
}

/**
 * 骰子动画管理器
 */
export class DiceAnimations extends EventEmitter {
  private diceElements: HTMLElement[] = [];
  private isAnimating = false;
  private animationConfig: DiceAnimationOptions;
  private audioContext: AudioContext | null = null;
  private rollSound: AudioBuffer | null = null;
  private bounceSound: AudioBuffer | null = null;

  constructor(
    diceElements: HTMLElement[] = [],
    config: Partial<DiceAnimationOptions> = {}
  ) {
    super();
    
    this.diceElements = diceElements;
    this.animationConfig = {
      duration: 2000,
      bounceCount: 8,
      showTrail: true,
      soundEnabled: true,
      hapticEnabled: true,
      rollSpeed: 50,
      finalPause: 500,
      ...config
    };

    this.initializeAudio();
  }

  /**
   * 初始化音频系统
   */
  private async initializeAudio(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.loadSounds();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      this.animationConfig.soundEnabled = false;
    }
  }

  /**
   * 加载音效
   */
  private async loadSounds(): Promise<void> {
    try {
      // 这里应该加载实际的音频文件
      // 暂时使用合成音效
      this.rollSound = await this.generateRollSound();
      this.bounceSound = await this.generateBounceSound();
    } catch (error) {
      console.warn('Sound loading failed:', error);
    }
  }

  /**
   * 生成投掷音效
   */
  private async generateRollSound(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const duration = 0.1;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成白噪音效果
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    return buffer;
  }

  /**
   * 生成弹跳音效
   */
  private async generateBounceSound(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const duration = 0.05;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成短促的点击音效
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = Math.sin(t * Math.PI * 880) * Math.exp(-t * 10) * 0.2;
    }

    return buffer;
  }

  /**
   * 播放音效
   */
  private playSound(buffer: AudioBuffer | null, volume: number = 1): void {
    if (!this.audioContext || !buffer || !this.animationConfig.soundEnabled) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  /**
   * 设置骰子元素
   */
  setDiceElements(elements: HTMLElement[]): void {
    this.diceElements = elements;
  }

  /**
   * 开始投掷动画
   */
  async rollDice(targetResult?: DiceResult): Promise<DiceResult> {
    if (this.isAnimating) {
      throw new Error('Dice animation already in progress');
    }

    this.isAnimating = true;
    this.emit('rollStarted');

    try {
      // 生成结果（如果没有指定）
      const result = targetResult || this.generateDiceResult();
      
      // 播放投掷音效
      this.playSound(this.rollSound);
      
      // 触发震动反馈
      if (this.animationConfig.hapticEnabled) {
        this.triggerHaptic('medium');
      }

      // 开始视觉动画
      await this.animateRoll(result);

      this.emit('rollCompleted', result);
      return result;

    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * 生成骰子结果
   */
  private generateDiceResult(): DiceResult {
    const value1 = Math.floor(Math.random() * 6) + 1;
    const value2 = Math.floor(Math.random() * 6) + 1;
    
    return {
      value1,
      value2,
      sum: value1 + value2,
      isDouble: value1 === value2
    };
  }

  /**
   * 执行投掷动画
   */
  private async animateRoll(result: DiceResult): Promise<void> {
    const { duration, bounceCount, rollSpeed } = this.animationConfig;
    
    // 阶段1: 初始抛掷
    await this.animateThrow();
    
    // 阶段2: 旋转翻滚
    await this.animateRolling(rollSpeed, bounceCount);
    
    // 阶段3: 弹跳减速
    await this.animateBouncing(result);
    
    // 阶段4: 最终静止
    await this.animateFinalSettle(result);
  }

  /**
   * 初始抛掷动画
   */
  private async animateThrow(): Promise<void> {
    const duration = 300;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        this.diceElements.forEach((dice, index) => {
          const offsetY = Math.sin(progress * Math.PI) * 50;
          const rotation = progress * 720 + index * 180;
          const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
          
          dice.style.transform = `
            translateY(${-offsetY}px) 
            rotateX(${rotation}deg) 
            rotateY(${rotation * 1.3}deg)
            scale(${scale})
          `;
          
          // 添加阴影效果
          dice.style.filter = `drop-shadow(0 ${offsetY * 0.3}px ${offsetY * 0.1}px rgba(0,0,0,0.3))`;
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * 旋转翻滚动画
   */
  private async animateRolling(speed: number, bounceCount: number): Promise<void> {
    const duration = 800;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        this.diceElements.forEach((dice, index) => {
          // 快速旋转
          const rotationX = progress * speed * 360 + index * 90;
          const rotationY = progress * speed * 480 + index * 120;
          const rotationZ = progress * speed * 240 + index * 60;
          
          // 随机晃动
          const shakeX = (Math.random() - 0.5) * 10 * (1 - progress);
          const shakeY = (Math.random() - 0.5) * 10 * (1 - progress);
          
          // 渐变透明度（制造模糊效果）
          const opacity = 0.7 + 0.3 * Math.sin(progress * Math.PI * bounceCount);
          
          dice.style.transform = `
            translateX(${shakeX}px)
            translateY(${shakeY}px)
            rotateX(${rotationX}deg)
            rotateY(${rotationY}deg)
            rotateZ(${rotationZ}deg)
          `;
          
          dice.style.opacity = opacity.toString();
          
          // 动态模糊效果
          dice.style.filter = `blur(${(1 - progress) * 2}px)`;
        });

        // 播放连续的弹跳音效
        if (Math.random() < 0.1) {
          this.playSound(this.bounceSound, 0.3);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * 弹跳减速动画
   */
  private async animateBouncing(result: DiceResult): Promise<void> {
    const duration = 600;
    const startTime = performance.now();
    const bounces = 4;

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        this.diceElements.forEach((dice, index) => {
          // 弹跳效果
          const bounceHeight = 20 * (1 - progress);
          const bounceOffset = Math.abs(Math.sin(progress * Math.PI * bounces)) * bounceHeight;
          
          // 逐渐减缓的旋转
          const rotation = (1 - progress) * 180;
          
          // 逐渐恢复透明度
          const opacity = 0.7 + 0.3 * progress;
          
          dice.style.transform = `
            translateY(${-bounceOffset}px)
            rotateX(${rotation}deg)
            rotateY(${rotation * 0.7}deg)
          `;
          
          dice.style.opacity = opacity.toString();
          dice.style.filter = `blur(${(1 - progress) * 1}px)`;
        });

        // 弹跳音效
        const bouncePhase = Math.sin(progress * Math.PI * bounces);
        if (bouncePhase > 0.9 && Math.random() < 0.3) {
          this.playSound(this.bounceSound, 0.5 * (1 - progress));
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * 最终静止动画
   */
  private async animateFinalSettle(result: DiceResult): Promise<void> {
    const duration = this.animationConfig.finalPause;
    
    // 设置最终状态
    this.diceElements.forEach((dice, index) => {
      const finalValue = index === 0 ? result.value1 : result.value2;
      
      dice.style.transform = 'translateY(0) rotateX(0) rotateY(0) rotateZ(0)';
      dice.style.opacity = '1';
      dice.style.filter = 'none';
      
      // 显示最终点数
      this.displayDiceValue(dice, finalValue);
      
      // 如果是双数，添加特殊效果
      if (result.isDouble) {
        this.addDoubleEffect(dice);
      }
    });

    // 播放完成音效
    if (result.isDouble) {
      this.playSound(this.rollSound, 1.2); // 双数时音量更大
      this.triggerHaptic('heavy');
    } else {
      this.playSound(this.bounceSound, 0.8);
      this.triggerHaptic('light');
    }

    // 等待最终暂停时间
    await new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * 显示骰子点数
   */
  private displayDiceValue(diceElement: HTMLElement, value: number): void {
    // 清除之前的点数显示
    diceElement.innerHTML = '';
    
    // 创建点数显示
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'dice-dots';
    dotsContainer.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 2px;
      padding: 8px;
    `;

    // 根据点数创建点
    const dotPositions = this.getDotPositions(value);
    
    for (let i = 0; i < 9; i++) {
      const dot = document.createElement('div');
      dot.className = 'dice-dot';
      dot.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: ${dotPositions.includes(i) ? '#333' : 'transparent'};
        transition: all 0.3s ease;
      `;
      
      dotsContainer.appendChild(dot);
    }
    
    diceElement.appendChild(dotsContainer);

    // 添加点数动画
    this.animateDotsAppear(dotsContainer);
  }

  /**
   * 获取骰子点数位置
   */
  private getDotPositions(value: number): number[] {
    const positions = {
      1: [4], // 中心
      2: [0, 8], // 对角
      3: [0, 4, 8], // 对角加中心
      4: [0, 2, 6, 8], // 四角
      5: [0, 2, 4, 6, 8], // 四角加中心
      6: [0, 1, 2, 6, 7, 8] // 两列
    };
    
    return positions[value as keyof typeof positions] || [];
  }

  /**
   * 点数出现动画
   */
  private animateDotsAppear(container: HTMLElement): void {
    const dots = container.querySelectorAll('.dice-dot');
    
    dots.forEach((dot, index) => {
      const element = dot as HTMLElement;
      if (element.style.background !== 'transparent') {
        element.style.transform = 'scale(0)';
        element.style.opacity = '0';
        
        setTimeout(() => {
          element.style.transform = 'scale(1)';
          element.style.opacity = '1';
        }, index * 50);
      }
    });
  }

  /**
   * 添加双数特效
   */
  private addDoubleEffect(diceElement: HTMLElement): void {
    // 添加发光效果
    diceElement.style.boxShadow = `
      0 0 20px rgba(255, 215, 0, 0.8),
      0 0 40px rgba(255, 215, 0, 0.6),
      inset 0 0 20px rgba(255, 215, 0, 0.3)
    `;
    
    // 脉冲动画
    diceElement.style.animation = 'dice-double-pulse 1s ease-in-out 3';
    
    // 创建粒子效果
    this.createParticleEffect(diceElement);
    
    // 清除效果
    setTimeout(() => {
      diceElement.style.boxShadow = '';
      diceElement.style.animation = '';
    }, 3000);
  }

  /**
   * 创建粒子效果
   */
  private createParticleEffect(centerElement: HTMLElement): void {
    const rect = centerElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'dice-particle';
      particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: gold;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${centerX}px;
        top: ${centerY}px;
      `;
      
      document.body.appendChild(particle);
      
      // 粒子运动
      const angle = (i / 12) * Math.PI * 2;
      const distance = 50 + Math.random() * 30;
      const duration = 800 + Math.random() * 400;
      
      particle.animate([
        { 
          transform: 'translate(0, 0) scale(1)',
          opacity: 1 
        },
        { 
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
          opacity: 0 
        }
      ], {
        duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        document.body.removeChild(particle);
      });
    }
  }

  /**
   * 触发震动反馈
   */
  private triggerHaptic(intensity: 'light' | 'medium' | 'heavy'): void {
    if (!this.animationConfig.hapticEnabled || !navigator.vibrate) return;
    
    const patterns = {
      light: 50,
      medium: [50, 50, 100],
      heavy: [100, 100, 200]
    };
    
    navigator.vibrate(patterns[intensity]);
  }

  /**
   * 停止当前动画
   */
  stopAnimation(): void {
    this.isAnimating = false;
    
    // 恢复骰子状态
    this.diceElements.forEach(dice => {
      dice.style.transform = '';
      dice.style.opacity = '1';
      dice.style.filter = '';
      dice.style.boxShadow = '';
      dice.style.animation = '';
    });
    
    this.emit('animationStopped');
  }

  /**
   * 更新动画配置
   */
  updateConfig(config: Partial<DiceAnimationOptions>): void {
    this.animationConfig = { ...this.animationConfig, ...config };
  }

  /**
   * 检查是否正在动画
   */
  isRolling(): boolean {
    return this.isAnimating;
  }

  /**
   * 销毁动画系统
   */
  destroy(): void {
    this.stopAnimation();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.removeAllListeners();
  }
}

// 添加CSS动画样式
const diceStyles = document.createElement('style');
diceStyles.textContent = `
  @keyframes dice-double-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
  
  .dice-dots {
    pointer-events: none;
  }
  
  .dice-dot {
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .dice-particle {
    animation: particle-fade 0.8s ease-out forwards;
  }
  
  @keyframes particle-fade {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0); }
  }
`;

document.head.appendChild(diceStyles);

export default DiceAnimations;