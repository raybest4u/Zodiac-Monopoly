/**
 * 生肖专属视觉特效系统
 * Day 4: 技能动画和特效
 * 
 * 实现十二生肖的专属视觉特效，包括：
 * - 生肖形象动画
 * - 传统文化元素融合
 * - 五行相生相克特效
 * - 季节性变化效果
 * - 3D变换和光照效果
 * - 文化符号动画
 */

import type { ZodiacSign, Season } from '../types/game';
import { EnhancedParticleSystem, ParticleType, ParticleMovementPattern } from './EnhancedParticleSystem';

/**
 * 生肖视觉特效配置
 */
export interface ZodiacVisualConfig {
  // 基础属性
  zodiac: ZodiacSign;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // 动画属性
  animationType: string;
  duration: number;
  intensity: number;
  
  // 文化元素
  culturalSymbol: string;
  traditionalPattern: string;
  luckyNumber: number;
  
  // 五行属性
  element: '金' | '木' | '水' | '火' | '土';
  elementColor: string;
  
  // 季节适应
  favorableSeason: Season;
  seasonalBonus: number;
}

/**
 * 特效层级枚举
 */
export enum EffectLayer {
  BACKGROUND = 0,     // 背景层
  PARTICLE = 1,       // 粒子层
  SYMBOL = 2,         // 符号层
  HIGHLIGHT = 3,      // 高亮层
  OVERLAY = 4         // 覆盖层
}

/**
 * 动画阶段枚举
 */
export enum AnimationPhase {
  PREPARATION = 'preparation',   // 准备阶段
  CASTING = 'casting',          // 施法阶段
  IMPACT = 'impact',            // 冲击阶段
  AFTERMATH = 'aftermath'       // 余波阶段
}

/**
 * 生肖专属视觉特效管理器
 */
export class ZodiacVisualEffects {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particleSystem: EnhancedParticleSystem;
  
  // 特效配置库
  private zodiacConfigs: Map<ZodiacSign, ZodiacVisualConfig>;
  
  // 活跃特效管理
  private activeEffects: Map<string, ZodiacEffect> = new Map();
  
  // 文化符号缓存
  private symbolCache: Map<string, HTMLCanvasElement> = new Map();
  
  // 3D变换矩阵
  private transformMatrix: DOMMatrix;
  
  // 光照系统
  private lightingSystem: LightingSystem;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = this.ensureContext(canvas);
    this.particleSystem = new EnhancedParticleSystem(canvas);
    this.transformMatrix = this.createTransformMatrix();
    this.lightingSystem = new LightingSystem();
    
    this.initializeZodiacConfigs();
    this.setupCanvas();
  }

  private ensureContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    if (canvas && typeof canvas.getContext === 'function') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        return ctx;
      }
    }

    return ZodiacVisualEffects.createFallbackContext();
  }

  private createTransformMatrix(): DOMMatrix {
    if (typeof DOMMatrix !== 'undefined') {
      return new DOMMatrix();
    }

    const fallback: any = {
      multiply: () => fallback,
      translateSelf: () => fallback,
      rotateSelf: () => fallback,
      scaleSelf: () => fallback,
      invertSelf: () => fallback,
      toString: () => 'DOMMatrixFallback'
    };

    return fallback as DOMMatrix;
  }

  private static createFallbackContext(): CanvasRenderingContext2D {
    const noop = () => {};
    const gradient = { addColorStop: noop };

    const fallback: any = {
      canvas: { width: 0, height: 0 },
      save: noop,
      restore: noop,
      clearRect: noop,
      fillRect: noop,
      strokeRect: noop,
      drawImage: noop,
      setTransform: noop,
      translate: noop,
      rotate: noop,
      scale: noop,
      beginPath: noop,
      closePath: noop,
      fill: noop,
      stroke: noop,
      arc: noop,
      moveTo: noop,
      lineTo: noop,
      bezierCurveTo: noop,
      quadraticCurveTo: noop,
      ellipse: noop,
      clip: noop,
      createRadialGradient: () => gradient,
      fillText: noop,
      strokeText: noop,
      measureText: () => ({ width: 0 }),
      globalAlpha: 1,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'medium',
      lineCap: 'round',
      lineJoin: 'round',
      shadowBlur: 0,
      shadowColor: 'rgba(0,0,0,0)',
      font: '16px sans-serif',
      textAlign: 'center',
      textBaseline: 'middle'
    };

    return fallback as CanvasRenderingContext2D;
  }
  
  /**
   * 初始化生肖配置
   */
  private initializeZodiacConfigs(): void {
    this.zodiacConfigs = new Map([
      ['鼠', {
        zodiac: '鼠',
        primaryColor: '#4A90E2',
        secondaryColor: '#87CEEB',
        accentColor: '#E0F6FF',
        animationType: 'swift_dash',
        duration: 1500,
        intensity: 0.8,
        culturalSymbol: '子',
        traditionalPattern: 'water_ripples',
        luckyNumber: 1,
        element: '水',
        elementColor: '#0080FF',
        favorableSeason: '冬',
        seasonalBonus: 0.3
      }],
      
      ['牛', {
        zodiac: '牛',
        primaryColor: '#8B4513',
        secondaryColor: '#DEB887',
        accentColor: '#F5E6D3',
        animationType: 'earth_stomp',
        duration: 2500,
        intensity: 1.2,
        culturalSymbol: '丑',
        traditionalPattern: 'mountain_peaks',
        luckyNumber: 2,
        element: '土',
        elementColor: '#8B4513',
        favorableSeason: '春',
        seasonalBonus: 0.2
      }],
      
      ['虎', {
        zodiac: '虎',
        primaryColor: '#FF8C00',
        secondaryColor: '#FFD700',
        accentColor: '#FFF8DC',
        animationType: 'fierce_pounce',
        duration: 1800,
        intensity: 1.5,
        culturalSymbol: '寅',
        traditionalPattern: 'tiger_stripes',
        luckyNumber: 3,
        element: '木',
        elementColor: '#228B22',
        favorableSeason: '春',
        seasonalBonus: 0.4
      }],
      
      ['兔', {
        zodiac: '兔',
        primaryColor: '#FFB6C1',
        secondaryColor: '#FFC0CB',
        accentColor: '#FFEBEF',
        animationType: 'gentle_hop',
        duration: 1200,
        intensity: 0.6,
        culturalSymbol: '卯',
        traditionalPattern: 'cherry_blossoms',
        luckyNumber: 4,
        element: '木',
        elementColor: '#90EE90',
        favorableSeason: '春',
        seasonalBonus: 0.25
      }],
      
      ['龙', {
        zodiac: '龙',
        primaryColor: '#DAA520',
        secondaryColor: '#FFD700',
        accentColor: '#FFFACD',
        animationType: 'majestic_spiral',
        duration: 3000,
        intensity: 2.0,
        culturalSymbol: '辰',
        traditionalPattern: 'dragon_clouds',
        luckyNumber: 5,
        element: '土',
        elementColor: '#DAA520',
        favorableSeason: '夏',
        seasonalBonus: 0.5
      }],
      
      ['蛇', {
        zodiac: '蛇',
        primaryColor: '#6B8E23',
        secondaryColor: '#9ACD32',
        accentColor: '#F0FFF0',
        animationType: 'sinuous_wave',
        duration: 2200,
        intensity: 1.1,
        culturalSymbol: '巳',
        traditionalPattern: 'flowing_water',
        luckyNumber: 6,
        element: '火',
        elementColor: '#FF4500',
        favorableSeason: '夏',
        seasonalBonus: 0.35
      }],
      
      ['马', {
        zodiac: '马',
        primaryColor: '#CD853F',
        secondaryColor: '#DEB887',
        accentColor: '#FDF5E6',
        animationType: 'galloping_charge',
        duration: 1600,
        intensity: 1.3,
        culturalSymbol: '午',
        traditionalPattern: 'wind_trails',
        luckyNumber: 7,
        element: '火',
        elementColor: '#FF6347',
        favorableSeason: '夏',
        seasonalBonus: 0.3
      }],
      
      ['羊', {
        zodiac: '羊',
        primaryColor: '#E6E6FA',
        secondaryColor: '#DDA0DD',
        accentColor: '#F8F8FF',
        animationType: 'peaceful_float',
        duration: 2000,
        intensity: 0.7,
        culturalSymbol: '未',
        traditionalPattern: 'soft_clouds',
        luckyNumber: 8,
        element: '土',
        elementColor: '#D2B48C',
        favorableSeason: '夏',
        seasonalBonus: 0.2
      }],
      
      ['猴', {
        zodiac: '猴',
        primaryColor: '#DEB887',
        secondaryColor: '#F4A460',
        accentColor: '#FFF8DC',
        animationType: 'playful_swing',
        duration: 1400,
        intensity: 1.0,
        culturalSymbol: '申',
        traditionalPattern: 'banana_leaves',
        luckyNumber: 9,
        element: '金',
        elementColor: '#FFD700',
        favorableSeason: '秋',
        seasonalBonus: 0.25
      }],
      
      ['鸡', {
        zodiac: '鸡',
        primaryColor: '#FF6347',
        secondaryColor: '#FFD700',
        accentColor: '#FFFAF0',
        animationType: 'proud_strut',
        duration: 1700,
        intensity: 1.1,
        culturalSymbol: '酉',
        traditionalPattern: 'golden_feathers',
        luckyNumber: 10,
        element: '金',
        elementColor: '#FFD700',
        favorableSeason: '秋',
        seasonalBonus: 0.3
      }],
      
      ['狗', {
        zodiac: '狗',
        primaryColor: '#8FBC8F',
        secondaryColor: '#98FB98',
        accentColor: '#F0FFF0',
        animationType: 'loyal_guard',
        duration: 1900,
        intensity: 0.9,
        culturalSymbol: '戌',
        traditionalPattern: 'paw_prints',
        luckyNumber: 11,
        element: '土',
        elementColor: '#A0522D',
        favorableSeason: '秋',
        seasonalBonus: 0.2
      }],
      
      ['猪', {
        zodiac: '猪',
        primaryColor: '#FFA0C9',
        secondaryColor: '#FFB6C1',
        accentColor: '#FFF0F5',
        animationType: 'content_roll',
        duration: 2100,
        intensity: 0.8,
        culturalSymbol: '亥',
        traditionalPattern: 'prosperity_coins',
        luckyNumber: 12,
        element: '水',
        elementColor: '#4682B4',
        favorableSeason: '冬',
        seasonalBonus: 0.25
      }]
    ]);
  }
  
  /**
   * 设置画布
   */
  private setupCanvas(): void {
    // 启用高质量渲染
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // 设置文字渲染
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 预渲染文化符号
    this.prerenderCulturalSymbols();
  }
  
  /**
   * 预渲染文化符号
   */
  private prerenderCulturalSymbols(): void {
    for (const [zodiac, config] of this.zodiacConfigs) {
      const symbolCanvas = document.createElement('canvas');
      symbolCanvas.width = 100;
      symbolCanvas.height = 100;
      const symbolCtx = this.ensureContext(symbolCanvas);
      
      this.renderCulturalSymbol(symbolCtx, config, 50, 50, 40);
      this.symbolCache.set(zodiac, symbolCanvas);
    }
  }
  
  /**
   * 播放生肖技能特效
   */
  public async playZodiacSkillEffect(
    zodiac: ZodiacSign,
    skillType: string,
    position: { x: number; y: number },
    targets: Array<{ x: number; y: number }> = [],
    options: {
      season?: Season;
      intensity?: number;
      duration?: number;
    } = {}
  ): Promise<void> {
    const config = this.zodiacConfigs.get(zodiac);
    if (!config) {
      throw new Error(`未找到生肖 ${zodiac} 的配置`);
    }
    
    const effectId = `zodiac_${zodiac}_${Date.now()}`;
    
    // 创建特效实例
    const effect = new ZodiacEffect(
      effectId,
      config,
      skillType,
      position,
      targets,
      {
        season: options.season,
        intensity: options.intensity || config.intensity,
        duration: options.duration || config.duration
      }
    );
    
    this.activeEffects.set(effectId, effect);
    
    try {
      // 执行完整的特效序列
      await this.executeEffectSequence(effect);
    } finally {
      this.activeEffects.delete(effectId);
    }
  }
  
  /**
   * 执行特效序列
   */
  private async executeEffectSequence(effect: ZodiacEffect): Promise<void> {
    const phases = [
      { phase: AnimationPhase.PREPARATION, duration: 0.2 },
      { phase: AnimationPhase.CASTING, duration: 0.4 },
      { phase: AnimationPhase.IMPACT, duration: 0.3 },
      { phase: AnimationPhase.AFTERMATH, duration: 0.1 }
    ];
    
    for (const { phase, duration } of phases) {
      const phaseDuration = effect.options.duration * duration;
      await this.executePhase(effect, phase, phaseDuration);
    }
  }
  
  /**
   * 执行特效阶段
   */
  private async executePhase(
    effect: ZodiacEffect, 
    phase: AnimationPhase, 
    duration: number
  ): Promise<void> {
    switch (phase) {
      case AnimationPhase.PREPARATION:
        await this.executePreparationPhase(effect, duration);
        break;
      case AnimationPhase.CASTING:
        await this.executeCastingPhase(effect, duration);
        break;
      case AnimationPhase.IMPACT:
        await this.executeImpactPhase(effect, duration);
        break;
      case AnimationPhase.AFTERMATH:
        await this.executeAftermathPhase(effect, duration);
        break;
    }
  }
  
  /**
   * 执行准备阶段
   */
  private async executePreparationPhase(effect: ZodiacEffect, duration: number): Promise<void> {
    const { config, position } = effect;
    
    // 创建聚能粒子效果
    const gatheringEffectId = this.particleSystem.createPresetEffect(
      'energy_gathering',
      position.x,
      position.y,
      config.zodiac
    );
    
    // 绘制文化符号预兆
    this.renderCulturalPremonition(position, config);
    
    // 环境光照变化
    this.lightingSystem.setAmbientLight(config.primaryColor, 0.3);
    
    await this.delay(duration);
    
    // 清理聚能效果
    this.particleSystem.removeEmitter(gatheringEffectId);
  }
  
  /**
   * 执行施法阶段
   */
  private async executeCastingPhase(effect: ZodiacEffect, duration: number): Promise<void> {
    const { config, position, skillType } = effect;
    
    // 根据生肖类型选择特定动画
    switch (config.animationType) {
      case 'swift_dash':
        await this.playSwiftDashAnimation(effect, duration);
        break;
      case 'earth_stomp':
        await this.playEarthStompAnimation(effect, duration);
        break;
      case 'fierce_pounce':
        await this.playFiercePounceAnimation(effect, duration);
        break;
      case 'gentle_hop':
        await this.playGentleHopAnimation(effect, duration);
        break;
      case 'majestic_spiral':
        await this.playMajesticSpiralAnimation(effect, duration);
        break;
      case 'sinuous_wave':
        await this.playSinuousWaveAnimation(effect, duration);
        break;
      case 'galloping_charge':
        await this.playGallopingChargeAnimation(effect, duration);
        break;
      case 'peaceful_float':
        await this.playPeacefulFloatAnimation(effect, duration);
        break;
      case 'playful_swing':
        await this.playPlayfulSwingAnimation(effect, duration);
        break;
      case 'proud_strut':
        await this.playProudStrutAnimation(effect, duration);
        break;
      case 'loyal_guard':
        await this.playLoyalGuardAnimation(effect, duration);
        break;
      case 'content_roll':
        await this.playContentRollAnimation(effect, duration);
        break;
      default:
        await this.playDefaultAnimation(effect, duration);
        break;
    }
  }
  
  /**
   * 执行冲击阶段
   */
  private async executeImpactPhase(effect: ZodiacEffect, duration: number): Promise<void> {
    const { config, targets } = effect;
    
    // 对每个目标创建冲击效果
    for (const target of targets) {
      // 创建冲击波粒子效果
      const impactEffectId = this.particleSystem.createPresetEffect(
        'impact_burst',
        target.x,
        target.y,
        config.zodiac
      );
      
      // 创建冲击波动画
      this.createImpactWave(target, config);
      
      // 目标震动效果
      this.createTargetShake(target, duration * 0.5);
    }
    
    // 屏幕震动效果
    if (effect.options.intensity > 1.0) {
      this.createScreenShake(duration * 0.3, effect.options.intensity);
    }
    
    await this.delay(duration);
  }
  
  /**
   * 执行余波阶段
   */
  private async executeAftermathPhase(effect: ZodiacEffect, duration: number): Promise<void> {
    const { config, position } = effect;
    
    // 创建余波粒子效果
    const afterglowEffectId = this.particleSystem.createPresetEffect(
      'afterglow',
      position.x,
      position.y,
      config.zodiac
    );
    
    // 恢复环境光照
    this.lightingSystem.fadeToDefault(duration);
    
    await this.delay(duration);
    
    // 清理余波效果
    this.particleSystem.removeEmitter(afterglowEffectId);
  }
  
  /**
   * 鼠 - 敏捷冲刺动画
   */
  private async playSwiftDashAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建快速移动的光线效果
    const dashTrail = this.createDashTrail(position, config.primaryColor);
    
    // 水元素粒子效果
    const waterParticles = this.particleSystem.createEmitter('rat_water', {
      type: ParticleType.WATER_DROP,
      count: 30,
      lifetime: duration,
      size: { min: 2, max: 6 },
      color: { start: config.primaryColor, end: config.secondaryColor },
      opacity: { start: 0.8, end: 0 },
      movement: ParticleMovementPattern.SPIRAL,
      speed: { min: 80, max: 120 },
      direction: { min: 0, max: Math.PI * 2 },
      gravity: 0,
      friction: 0.95,
      bounce: 0,
      mass: 0.5,
      emissionRate: 20,
      glow: true,
      trail: true,
      rotation: false,
      pulsate: false,
      blendMode: 'screen'
    }, position.x, position.y);
    
    await this.delay(duration);
  }
  
  /**
   * 牛 - 大地践踏动画
   */
  private async playEarthStompAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建地面裂纹效果
    this.createGroundCracks(position, config.elementColor);
    
    // 土元素粒子效果
    const earthParticles = this.particleSystem.createEmitter('ox_earth', {
      type: ParticleType.EARTH_CRYSTAL,
      count: 50,
      lifetime: duration * 1.5,
      size: { min: 4, max: 12 },
      color: { start: config.primaryColor, end: config.elementColor },
      opacity: { start: 1, end: 0.3 },
      movement: ParticleMovementPattern.EXPLOSION,
      speed: { min: 30, max: 80 },
      direction: { min: 0, max: Math.PI * 2 },
      gravity: 200,
      friction: 0.9,
      bounce: 0.7,
      mass: 2,
      emissionRate: 0,
      burstCount: 50,
      glow: false,
      trail: false,
      rotation: true,
      pulsate: false,
      blendMode: 'normal'
    }, position.x, position.y);
    
    await this.delay(duration);
  }
  
  /**
   * 虎 - 猛烈扑击动画
   */
  private async playFiercePounceAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config, targets } = effect;
    
    // 创建虎纹效果
    this.renderTigerStripes(position, config);
    
    // 火元素爆发效果
    for (const target of targets) {
      const fireBlast = this.particleSystem.createEmitter('tiger_fire', {
        type: ParticleType.FIRE,
        count: 80,
        lifetime: duration,
        size: { min: 6, max: 15 },
        color: { 
          start: config.primaryColor, 
          middle: '#FF4500', 
          end: config.elementColor 
        },
        opacity: { start: 0.9, end: 0 },
        movement: ParticleMovementPattern.EXPLOSION,
        speed: { min: 60, max: 150 },
        direction: { min: 0, max: Math.PI * 2 },
        gravity: -30,
        friction: 0.97,
        bounce: 0,
        mass: 0.8,
        emissionRate: 60,
        glow: true,
        trail: false,
        rotation: false,
        pulsate: true,
        blendMode: 'add'
      }, target.x, target.y);
    }
    
    await this.delay(duration);
  }
  
  /**
   * 兔 - 温和跳跃动画
   */
  private async playGentleHopAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建花瓣飘散效果
    const petalEffect = this.particleSystem.createEmitter('rabbit_petals', {
      type: ParticleType.PETAL,
      count: 40,
      lifetime: duration * 2,
      size: { min: 3, max: 8 },
      color: { start: config.primaryColor, end: config.accentColor },
      opacity: { start: 0.7, end: 0 },
      movement: ParticleMovementPattern.WAVE,
      speed: { min: 20, max: 50 },
      direction: { min: -Math.PI / 4, max: Math.PI / 4 },
      gravity: -10,
      friction: 0.99,
      bounce: 0,
      mass: 0.3,
      emissionRate: 15,
      glow: false,
      trail: false,
      rotation: true,
      pulsate: false,
      blendMode: 'normal'
    }, position.x, position.y - 30);
    
    await this.delay(duration);
  }
  
  /**
   * 龙 - 威严螺旋动画
   */
  private async playMajesticSpiralAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建龙形螺旋效果
    this.createDragonSpiral(position, config);
    
    // 能量球轨道效果
    const energyOrbs = this.particleSystem.createEmitter('dragon_orbs', {
      type: ParticleType.ENERGY_ORB,
      count: 12,
      lifetime: duration,
      size: { min: 8, max: 20 },
      color: { start: config.primaryColor, end: config.secondaryColor },
      opacity: { start: 1, end: 0.5 },
      movement: ParticleMovementPattern.ORBITAL,
      speed: { min: 100, max: 200 },
      direction: { min: 0, max: Math.PI * 2 },
      gravity: 0,
      friction: 1,
      bounce: 0,
      mass: 1,
      emissionRate: 0,
      burstCount: 12,
      glow: true,
      trail: true,
      trailLength: 10,
      rotation: false,
      pulsate: true,
      blendMode: 'screen'
    }, position.x, position.y);
    
    await this.delay(duration);
  }
  
  /**
   * 蛇 - 蜿蜒波浪动画
   */
  private async playSinuousWaveAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建波浪路径效果
    this.createWavePath(position, config);
    
    await this.delay(duration);
  }
  
  /**
   * 马 - 奔腾冲锋动画
   */
  private async playGallopingChargeAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建风迹效果
    this.createWindTrails(position, config);
    
    await this.delay(duration);
  }
  
  /**
   * 羊 - 和平漂浮动画
   */
  private async playPeacefulFloatAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建云朵效果
    this.createCloudEffect(position, config);
    
    await this.delay(duration);
  }
  
  /**
   * 猴 - 顽皮摆荡动画
   */
  private async playPlayfulSwingAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建摆荡轨迹
    this.createSwingTrajectory(position, config);
    
    await this.delay(duration);
  }
  
  /**
   * 鸡 - 骄傲踱步动画
   */
  private async playProudStrutAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建羽毛飞散效果
    const featherEffect = this.particleSystem.createEmitter('rooster_feathers', {
      type: ParticleType.FEATHER,
      count: 25,
      lifetime: duration * 1.5,
      size: { min: 4, max: 10 },
      color: { start: config.primaryColor, end: config.secondaryColor },
      opacity: { start: 0.8, end: 0.2 },
      movement: ParticleMovementPattern.RANDOM,
      speed: { min: 30, max: 70 },
      direction: { min: 0, max: Math.PI * 2 },
      gravity: 50,
      friction: 0.98,
      bounce: 0.3,
      mass: 0.6,
      emissionRate: 12,
      glow: true,
      trail: false,
      rotation: true,
      pulsate: false,
      blendMode: 'normal'
    }, position.x, position.y - 20);
    
    await this.delay(duration);
  }
  
  /**
   * 狗 - 忠诚守护动画
   */
  private async playLoyalGuardAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建保护光环
    this.createProtectionAura(position, config);
    
    await this.delay(duration);
  }
  
  /**
   * 猪 - 满足翻滚动画
   */
  private async playContentRollAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const { position, config } = effect;
    
    // 创建幸运符号雨
    this.createLuckySymbolRain(position, config);
    
    await this.delay(duration);
  }
  
  /**
   * 默认动画
   */
  private async playDefaultAnimation(effect: ZodiacEffect, duration: number): Promise<void> {
    const sparkleEffect = this.particleSystem.createPresetEffect(
      'sparkle_burst',
      effect.position.x,
      effect.position.y,
      effect.config.zodiac
    );
    
    await this.delay(duration);
  }
  
  /**
   * 渲染文化符号
   */
  private renderCulturalSymbol(
    ctx: CanvasRenderingContext2D, 
    config: ZodiacVisualConfig, 
    x: number, 
    y: number, 
    size: number
  ): void {
    ctx.save();
    
    // 设置文本样式
    ctx.font = `${size}px "STKaiti", "KaiTi", serif`;
    ctx.fillStyle = config.elementColor;
    ctx.strokeStyle = config.primaryColor;
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 绘制文化符号
    ctx.strokeText(config.culturalSymbol, x, y);
    ctx.fillText(config.culturalSymbol, x, y);
    
    ctx.restore();
  }
  
  /**
   * 辅助方法实现（简化版）
   */
  private renderCulturalPremonition(position: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现文化符号预兆效果
  }
  
  private createDashTrail(position: { x: number; y: number }, color: string): void {
    // 实现冲刺轨迹效果
  }
  
  private createGroundCracks(position: { x: number; y: number }, color: string): void {
    // 实现地面裂纹效果
  }
  
  private renderTigerStripes(position: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现虎纹效果
  }
  
  private createDragonSpiral(position: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现龙形螺旋效果
  }
  
  private createWavePath(position: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现波浪路径效果
  }
  
  private createWindTrails(position: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现风迹效果
  }
  
  private createCloudEffect(position: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现云朵效果
  }
  
  private createSwingTrajectory(position: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现摆荡轨迹
  }
  
  private createProtectionAura(position: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现保护光环
  }
  
  private createLuckySymbolRain(position: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现幸运符号雨
  }
  
  private createImpactWave(target: { x: number; y: number }, config: ZodiacVisualConfig): void {
    // 实现冲击波动画
  }
  
  private createTargetShake(target: { x: number; y: number }, duration: number): void {
    // 实现目标震动效果
  }
  
  private createScreenShake(duration: number, intensity: number): void {
    // 实现屏幕震动效果
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 获取性能统计
   */
  public getPerformanceStats(): {
    activeEffects: number;
    particleStats: any;
    memoryUsage: string;
  } {
    return {
      activeEffects: this.activeEffects.size,
      particleStats: this.particleSystem.getPerformanceStats(),
      memoryUsage: `${this.activeEffects.size * 1000}B`
    };
  }
  
  /**
   * 清理所有特效
   */
  public clearAllEffects(): void {
    this.activeEffects.clear();
    this.particleSystem.clearAll();
  }
  
  /**
   * 销毁特效系统
   */
  public destroy(): void {
    this.clearAllEffects();
    this.particleSystem.destroy();
    this.lightingSystem.destroy();
    this.symbolCache.clear();
  }
}

/**
 * 生肖特效实例类
 */
class ZodiacEffect {
  public readonly id: string;
  public readonly config: ZodiacVisualConfig;
  public readonly skillType: string;
  public readonly position: { x: number; y: number };
  public readonly targets: Array<{ x: number; y: number }>;
  public readonly options: {
    season?: Season;
    intensity: number;
    duration: number;
  };
  
  constructor(
    id: string,
    config: ZodiacVisualConfig,
    skillType: string,
    position: { x: number; y: number },
    targets: Array<{ x: number; y: number }>,
    options: {
      season?: Season;
      intensity: number;
      duration: number;
    }
  ) {
    this.id = id;
    this.config = config;
    this.skillType = skillType;
    this.position = position;
    this.targets = targets;
    this.options = options;
    
    // 应用季节性增强
    if (options.season === config.favorableSeason) {
      this.options.intensity *= (1 + config.seasonalBonus);
    }
  }
}

/**
 * 光照系统（简化版）
 */
class LightingSystem {
  private ambientColor: string = '#FFFFFF';
  private ambientIntensity: number = 1.0;
  
  setAmbientLight(color: string, intensity: number): void {
    this.ambientColor = color;
    this.ambientIntensity = intensity;
  }
  
  fadeToDefault(duration: number): void {
    // 实现渐变到默认光照
  }
  
  destroy(): void {
    // 清理光照系统
  }
}

export default ZodiacVisualEffects;
