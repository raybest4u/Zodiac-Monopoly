/**
 * 属性购买和交易动画系统
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface TransactionData {
  type: 'purchase' | 'rent' | 'upgrade' | 'trade' | 'auction';
  fromPlayerId?: string;
  toPlayerId?: string;
  propertyId: string;
  amount: number;
  propertyData?: PropertyData;
}

export interface PropertyData {
  name: string;
  price: number;
  level: number;
  zodiac: string;
  color: string;
  position: { x: number; y: number };
}

export interface MoneyFlowOptions {
  duration: number;
  particleCount: number;
  showAmount: boolean;
  colorTheme: 'gold' | 'green' | 'red' | 'blue';
  pathType: 'direct' | 'arc' | 'spiral';
  includeSound: boolean;
}

export interface PropertyHighlightOptions {
  duration: number;
  glowIntensity: number;
  pulseCount: number;
  showOwnership: boolean;
  zodiacEffect: boolean;
}

/**
 * 交易动画管理器
 */
export class TransactionAnimations extends EventEmitter {
  private activeAnimations = new Map<string, TransactionAnimation>();
  private moneyParticlePool: MoneyParticle[] = [];
  private propertyElements = new Map<string, HTMLElement>();
  private playerElements = new Map<string, HTMLElement>();
  private soundManager: TransactionSoundManager;

  constructor() {
    super();
    this.soundManager = new TransactionSoundManager();
    this.initializeParticlePool();
  }

  /**
   * 初始化粒子池
   */
  private initializeParticlePool(): void {
    for (let i = 0; i < 50; i++) {
      const particle = new MoneyParticle();
      this.moneyParticlePool.push(particle);
    }
  }

  /**
   * 注册属性元素
   */
  registerPropertyElement(propertyId: string, element: HTMLElement): void {
    this.propertyElements.set(propertyId, element);
  }

  /**
   * 注册玩家元素
   */
  registerPlayerElement(playerId: string, element: HTMLElement): void {
    this.playerElements.set(playerId, element);
  }

  /**
   * 执行属性购买动画
   */
  async animatePropertyPurchase(
    transaction: TransactionData,
    options: Partial<MoneyFlowOptions & PropertyHighlightOptions> = {}
  ): Promise<void> {
    const animationId = `purchase_${Date.now()}`;
    
    const moneyOptions: MoneyFlowOptions = {
      duration: 1500,
      particleCount: 15,
      showAmount: true,
      colorTheme: 'gold',
      pathType: 'arc',
      includeSound: true,
      ...options
    };

    const propertyOptions: PropertyHighlightOptions = {
      duration: 2000,
      glowIntensity: 0.8,
      pulseCount: 3,
      showOwnership: true,
      zodiacEffect: true,
      ...options
    };

    try {
      this.emit('purchaseStarted', { transaction, animationId });

      // 同时执行多个动画
      await Promise.all([
        this.animateMoneyFlow(transaction, moneyOptions),
        this.animatePropertyHighlight(transaction, propertyOptions),
        this.animateOwnershipChange(transaction)
      ]);

      // 播放完成音效
      this.soundManager.playPurchaseComplete();

      this.emit('purchaseCompleted', { transaction, animationId });

    } catch (error) {
      this.emit('purchaseFailed', { transaction, animationId, error });
      throw error;
    }
  }

  /**
   * 执行金钱流动动画
   */
  private async animateMoneyFlow(
    transaction: TransactionData,
    options: MoneyFlowOptions
  ): Promise<void> {
    const { fromPlayerId, toPlayerId, amount } = transaction;
    
    if (!fromPlayerId && !toPlayerId) return;

    // 获取起点和终点位置
    const startElement = fromPlayerId ? this.playerElements.get(fromPlayerId) : null;
    const endElement = toPlayerId ? this.playerElements.get(toPlayerId) : 
                      this.propertyElements.get(transaction.propertyId);

    if (!startElement && !endElement) return;

    const startPos = this.getElementCenter(startElement);
    const endPos = this.getElementCenter(endElement);

    // 创建金钱粒子
    const particles = this.createMoneyParticles(
      startPos,
      endPos,
      amount,
      options
    );

    // 播放音效
    if (options.includeSound) {
      this.soundManager.playMoneyFlow(options.colorTheme);
    }

    // 执行粒子动画
    return this.animateParticles(particles, options);
  }

  /**
   * 创建金钱粒子
   */
  private createMoneyParticles(
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    amount: number,
    options: MoneyFlowOptions
  ): MoneyParticle[] {
    const particles: MoneyParticle[] = [];
    const particleCount = Math.min(options.particleCount, amount / 100);

    for (let i = 0; i < particleCount; i++) {
      let particle = this.moneyParticlePool.find(p => !p.isActive);
      
      if (!particle) {
        particle = new MoneyParticle();
        this.moneyParticlePool.push(particle);
      }

      // 配置粒子
      particle.configure({
        startPosition: {
          x: startPos.x + (Math.random() - 0.5) * 20,
          y: startPos.y + (Math.random() - 0.5) * 20
        },
        endPosition: {
          x: endPos.x + (Math.random() - 0.5) * 20,
          y: endPos.y + (Math.random() - 0.5) * 20
        },
        value: Math.floor(amount / particleCount),
        colorTheme: options.colorTheme,
        pathType: options.pathType,
        delay: i * (options.duration / particleCount / 2)
      });

      particles.push(particle);
    }

    return particles;
  }

  /**
   * 执行粒子动画
   */
  private async animateParticles(
    particles: MoneyParticle[],
    options: MoneyFlowOptions
  ): Promise<void> {
    return Promise.all(
      particles.map(particle => particle.animate(options.duration))
    ).then(() => {
      // 回收粒子
      particles.forEach(particle => particle.reset());
    });
  }

  /**
   * 属性高亮动画
   */
  private async animatePropertyHighlight(
    transaction: TransactionData,
    options: PropertyHighlightOptions
  ): Promise<void> {
    const propertyElement = this.propertyElements.get(transaction.propertyId);
    if (!propertyElement) return;

    const animation = new PropertyHighlightAnimation(
      propertyElement,
      transaction.propertyData,
      options
    );

    return animation.play();
  }

  /**
   * 所有权变更动画
   */
  private async animateOwnershipChange(transaction: TransactionData): Promise<void> {
    const propertyElement = this.propertyElements.get(transaction.propertyId);
    if (!propertyElement || !transaction.toPlayerId) return;

    // 添加所有者标识
    const ownershipBadge = this.createOwnershipBadge(
      transaction.toPlayerId,
      transaction.propertyData?.zodiac
    );

    // 淡入动画
    propertyElement.appendChild(ownershipBadge);
    
    return new Promise((resolve) => {
      ownershipBadge.style.opacity = '0';
      ownershipBadge.style.transform = 'scale(0.5)';
      
      setTimeout(() => {
        ownershipBadge.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        ownershipBadge.style.opacity = '1';
        ownershipBadge.style.transform = 'scale(1)';
        
        setTimeout(resolve, 500);
      }, 100);
    });
  }

  /**
   * 创建所有权标识
   */
  private createOwnershipBadge(
    playerId: string,
    zodiac?: string
  ): HTMLElement {
    const badge = document.createElement('div');
    badge.className = 'ownership-badge';
    badge.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
      z-index: 10;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

    // 显示生肖符号或玩家标识
    badge.textContent = zodiac ? this.getZodiacSymbol(zodiac) : playerId.charAt(0).toUpperCase();
    
    return badge;
  }

  /**
   * 获取生肖符号
   */
  private getZodiacSymbol(zodiac: string): string {
    const symbols = {
      '鼠': '🐭', '牛': '🐮', '虎': '🐯', '兔': '🐰',
      '龙': '🐲', '蛇': '🐍', '马': '🐴', '羊': '🐑',
      '猴': '🐵', '鸡': '🐔', '狗': '🐕', '猪': '🐷'
    };
    return symbols[zodiac as keyof typeof symbols] || zodiac;
  }

  /**
   * 执行租金支付动画
   */
  async animateRentPayment(
    transaction: TransactionData,
    options: Partial<MoneyFlowOptions> = {}
  ): Promise<void> {
    const rentOptions: MoneyFlowOptions = {
      duration: 1000,
      particleCount: 8,
      showAmount: true,
      colorTheme: 'red',
      pathType: 'direct',
      includeSound: true,
      ...options
    };

    await this.animateMoneyFlow(transaction, rentOptions);
    
    // 播放租金音效
    this.soundManager.playRentPayment();
    
    this.emit('rentPaid', { transaction });
  }

  /**
   * 执行属性升级动画
   */
  async animatePropertyUpgrade(
    transaction: TransactionData,
    options: Partial<PropertyHighlightOptions> = {}
  ): Promise<void> {
    const upgradeOptions: PropertyHighlightOptions = {
      duration: 1500,
      glowIntensity: 1.0,
      pulseCount: 4,
      showOwnership: false,
      zodiacEffect: true,
      ...options
    };

    const propertyElement = this.propertyElements.get(transaction.propertyId);
    if (!propertyElement) return;

    // 升级特效
    await Promise.all([
      this.animatePropertyHighlight(transaction, upgradeOptions),
      this.animateUpgradeEffect(propertyElement, transaction.propertyData?.level || 1)
    ]);

    this.soundManager.playUpgradeComplete();
    this.emit('propertyUpgraded', { transaction });
  }

  /**
   * 升级特效动画
   */
  private async animateUpgradeEffect(
    element: HTMLElement,
    level: number
  ): Promise<void> {
    // 创建升级光环
    const upgradeRing = document.createElement('div');
    upgradeRing.className = 'upgrade-ring';
    upgradeRing.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border: 3px solid gold;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.8;
      pointer-events: none;
      z-index: 5;
    `;

    element.appendChild(upgradeRing);

    return new Promise((resolve) => {
      // 扩张动画
      upgradeRing.animate([
        { width: '0', height: '0', opacity: 0.8 },
        { width: '120px', height: '120px', opacity: 0 }
      ], {
        duration: 800,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        element.removeChild(upgradeRing);
        resolve();
      });
    });
  }

  /**
   * 获取元素中心位置
   */
  private getElementCenter(element: HTMLElement | null): { x: number; y: number } {
    if (!element) return { x: 0, y: 0 };

    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations(): void {
    this.activeAnimations.forEach(animation => animation.stop());
    this.activeAnimations.clear();
    
    // 重置所有粒子
    this.moneyParticlePool.forEach(particle => particle.reset());
  }

  /**
   * 销毁动画系统
   */
  destroy(): void {
    this.stopAllAnimations();
    this.soundManager.destroy();
    this.propertyElements.clear();
    this.playerElements.clear();
    this.removeAllListeners();
  }
}

/**
 * 金钱粒子类
 */
class MoneyParticle {
  public isActive = false;
  private element: HTMLElement | null = null;
  private config: ParticleConfig | null = null;

  configure(config: ParticleConfig): void {
    this.config = config;
    this.createElement();
  }

  private createElement(): void {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = 'money-particle';
      this.element.style.cssText = `
        position: fixed;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      `;
    }

    if (this.config) {
      // 设置颜色主题
      const colors = this.getThemeColors(this.config.colorTheme);
      this.element.style.background = colors.background;
      this.element.style.color = colors.text;
      this.element.style.border = `1px solid ${colors.border}`;
      
      // 设置初始位置
      this.element.style.left = `${this.config.startPosition.x}px`;
      this.element.style.top = `${this.config.startPosition.y}px`;
      
      // 显示金额
      this.element.textContent = `$${this.config.value}`;
    }

    document.body.appendChild(this.element);
  }

  private getThemeColors(theme: string): { background: string; text: string; border: string } {
    const themes = {
      gold: { background: '#FFD700', text: '#8B4513', border: '#FFA500' },
      green: { background: '#32CD32', text: '#FFFFFF', border: '#228B22' },
      red: { background: '#FF4444', text: '#FFFFFF', border: '#CC0000' },
      blue: { background: '#4169E1', text: '#FFFFFF', border: '#0000CD' }
    };

    return themes[theme as keyof typeof themes] || themes.gold;
  }

  async animate(duration: number): Promise<void> {
    if (!this.element || !this.config) return;

    this.isActive = true;

    // 延迟开始
    if (this.config.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }

    return new Promise((resolve) => {
      if (!this.element || !this.config) {
        resolve();
        return;
      }

      // 计算路径
      const path = this.calculatePath();
      
      // 执行动画
      this.element.animate([
        {
          left: `${this.config.startPosition.x}px`,
          top: `${this.config.startPosition.y}px`,
          opacity: 1,
          transform: 'scale(1)'
        },
        {
          left: `${this.config.endPosition.x}px`,
          top: `${this.config.endPosition.y}px`,
          opacity: 0.8,
          transform: 'scale(1.2)',
          offset: 0.5
        },
        {
          left: `${this.config.endPosition.x}px`,
          top: `${this.config.endPosition.y}px`,
          opacity: 0,
          transform: 'scale(0.5)'
        }
      ], {
        duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        resolve();
      });
    });
  }

  private calculatePath(): { x: number; y: number }[] {
    if (!this.config) return [];

    const path = [this.config.startPosition];

    if (this.config.pathType === 'arc' || this.config.pathType === 'spiral') {
      // 生成弧形或螺旋路径
      const midX = (this.config.startPosition.x + this.config.endPosition.x) / 2;
      const midY = (this.config.startPosition.y + this.config.endPosition.y) / 2;
      
      const controlX = midX + (Math.random() - 0.5) * 100;
      const controlY = midY - 50;
      
      path.push({ x: controlX, y: controlY });
    }

    path.push(this.config.endPosition);
    return path;
  }

  reset(): void {
    this.isActive = false;
    this.config = null;
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * 属性高亮动画类
 */
class PropertyHighlightAnimation {
  private element: HTMLElement;
  private propertyData?: PropertyData;
  private options: PropertyHighlightOptions;

  constructor(
    element: HTMLElement,
    propertyData: PropertyData | undefined,
    options: PropertyHighlightOptions
  ) {
    this.element = element;
    this.propertyData = propertyData;
    this.options = options;
  }

  async play(): Promise<void> {
    const originalStyle = {
      boxShadow: this.element.style.boxShadow,
      transform: this.element.style.transform
    };

    try {
      // 脉冲效果
      await this.pulseEffect();
      
      // 发光效果
      if (this.options.glowIntensity > 0) {
        await this.glowEffect();
      }
      
      // 生肖特效
      if (this.options.zodiacEffect && this.propertyData?.zodiac) {
        await this.zodiacEffect();
      }

    } finally {
      // 恢复原始样式
      this.element.style.boxShadow = originalStyle.boxShadow;
      this.element.style.transform = originalStyle.transform;
    }
  }

  private async pulseEffect(): Promise<void> {
    const { pulseCount, duration } = this.options;
    const pulseDuration = duration / pulseCount;

    for (let i = 0; i < pulseCount; i++) {
      await new Promise<void>((resolve) => {
        this.element.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.05)' },
          { transform: 'scale(1)' }
        ], {
          duration: pulseDuration,
          easing: 'ease-in-out'
        }).addEventListener('finish', () => resolve());
      });
    }
  }

  private async glowEffect(): Promise<void> {
    const glowColor = this.propertyData?.color || '#FFD700';
    const intensity = this.options.glowIntensity;
    
    return new Promise<void>((resolve) => {
      this.element.animate([
        { boxShadow: 'none' },
        { 
          boxShadow: `
            0 0 ${20 * intensity}px ${glowColor}80,
            0 0 ${40 * intensity}px ${glowColor}60,
            0 0 ${60 * intensity}px ${glowColor}40
          `
        },
        { boxShadow: 'none' }
      ], {
        duration: this.options.duration,
        easing: 'ease-in-out'
      }).addEventListener('finish', () => resolve());
    });
  }

  private async zodiacEffect(): Promise<void> {
    // 根据生肖创建特殊效果
    const zodiac = this.propertyData?.zodiac;
    if (!zodiac) return;

    // 这里可以根据不同生肖实现不同的特效
    // 暂时实现一个通用的粒子效果
    this.createZodiacParticles(zodiac);
  }

  private createZodiacParticles(zodiac: string): void {
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 根据生肖选择颜色
    const zodiacColors = {
      '鼠': '#4A90E2', '牛': '#8B4513', '虎': '#FF8C00', '兔': '#FFB6C1',
      '龙': '#DAA520', '蛇': '#6B8E23', '马': '#CD853F', '羊': '#E6E6FA',
      '猴': '#DEB887', '鸡': '#FF6347', '狗': '#8FBC8F', '猪': '#FFA0C9'
    };

    const color = zodiacColors[zodiac as keyof typeof zodiacColors] || '#FFD700';

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${centerX}px;
        top: ${centerY}px;
      `;

      document.body.appendChild(particle);

      const angle = (i / 8) * Math.PI * 2;
      const distance = 40;
      
      particle.animate([
        {
          transform: 'translate(0, 0) scale(0)',
          opacity: 1
        },
        {
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(1)`,
          opacity: 0.5,
          offset: 0.7
        },
        {
          transform: `translate(${Math.cos(angle) * distance * 1.5}px, ${Math.sin(angle) * distance * 1.5}px) scale(0)`,
          opacity: 0
        }
      ], {
        duration: 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        document.body.removeChild(particle);
      });
    }
  }
}

/**
 * 交易音效管理器
 */
class TransactionSoundManager {
  private audioContext: AudioContext | null = null;
  private soundBuffers = new Map<string, AudioBuffer>();

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.generateSounds();
    } catch (error) {
      console.warn('Transaction sound initialization failed:', error);
    }
  }

  private async generateSounds(): Promise<void> {
    if (!this.audioContext) return;

    // 生成各种交易音效
    this.soundBuffers.set('purchase', await this.generatePurchaseSound());
    this.soundBuffers.set('rent', await this.generateRentSound());
    this.soundBuffers.set('upgrade', await this.generateUpgradeSound());
    this.soundBuffers.set('money_flow', await this.generateMoneyFlowSound());
  }

  private async generatePurchaseSound(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // 生成愉悦的购买音效
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(t * Math.PI * 880) * Math.exp(-t * 3) * 0.3 +
                Math.sin(t * Math.PI * 1320) * Math.exp(-t * 5) * 0.2;
    }

    return buffer;
  }

  private async generateRentSound(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    // 生成略显沉重的租金音效
    const duration = 0.2;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(t * Math.PI * 440) * Math.exp(-t * 4) * 0.4;
    }

    return buffer;
  }

  private async generateUpgradeSound(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    // 生成上升的升级音效
    const duration = 0.4;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const freq = 440 + t * 440; // 频率上升
      data[i] = Math.sin(t * Math.PI * freq) * Math.exp(-t * 2) * 0.3;
    }

    return buffer;
  }

  private async generateMoneyFlowSound(): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('Audio context not available');

    // 生成流动的金钱音效
    const duration = 0.15;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      data[i] = (Math.random() * 2 - 1) * 0.1 * Math.exp(-t * 8);
    }

    return buffer;
  }

  playPurchaseComplete(): void {
    this.playSound('purchase');
  }

  playRentPayment(): void {
    this.playSound('rent');
  }

  playUpgradeComplete(): void {
    this.playSound('upgrade');
  }

  playMoneyFlow(theme: string): void {
    this.playSound('money_flow');
  }

  private playSound(soundName: string, volume: number = 1): void {
    if (!this.audioContext) return;

    const buffer = this.soundBuffers.get(soundName);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.soundBuffers.clear();
  }
}

// 辅助接口和类
interface ParticleConfig {
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  value: number;
  colorTheme: string;
  pathType: string;
  delay: number;
}

abstract class TransactionAnimation {
  abstract stop(): void;
}

export default TransactionAnimations;