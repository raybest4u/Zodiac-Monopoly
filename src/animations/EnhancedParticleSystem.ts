/**
 * 增强版粒子效果系统
 * Day 4: 技能动画和特效
 * 
 * 实现高性能、功能丰富的粒子系统，支持：
 * - 多种粒子类型和行为
 * - 物理模拟和碰撞检测
 * - 生肖主题的粒子效果
 * - GPU加速和批量渲染
 * - 动态光照和色彩混合
 * - 粒子生命周期管理
 */

import type { ZodiacSign } from '../types/game';

/**
 * 粒子类型枚举
 */
export enum ParticleType {
  // 基础粒子
  SPARKLE = 'sparkle',           // 闪光粒子
  FIRE = 'fire',                 // 火焰粒子
  ICE = 'ice',                   // 冰晶粒子
  LIGHTNING = 'lightning',       // 闪电粒子
  SMOKE = 'smoke',               // 烟雾粒子
  
  // 形状粒子
  STAR = 'star',                 // 星形粒子
  HEART = 'heart',               // 心形粒子
  DIAMOND = 'diamond',           // 钻石粒子
  CIRCLE = 'circle',             // 圆形粒子
  SQUARE = 'square',             // 方形粒子
  
  // 生肖主题粒子
  PETAL = 'petal',               // 花瓣（兔）
  FEATHER = 'feather',           // 羽毛（鸡）
  PAW_PRINT = 'paw_print',       // 爪印（狗、虎）
  COIN = 'coin',                 // 金币（经济技能）
  DRAGON_SCALE = 'dragon_scale', // 龙鳞（龙）
  
  // 特殊粒子
  ENERGY_ORB = 'energy_orb',     // 能量球
  SPIRIT_WISP = 'spirit_wisp',   // 灵魂之光
  NATURE_LEAF = 'nature_leaf',   // 自然叶片
  WATER_DROP = 'water_drop',     // 水滴
  EARTH_CRYSTAL = 'earth_crystal' // 土系水晶
}

/**
 * 粒子运动模式
 */
export enum ParticleMovementPattern {
  LINEAR = 'linear',             // 直线运动
  SPIRAL = 'spiral',             // 螺旋运动
  ORBITAL = 'orbital',           // 轨道运动
  WAVE = 'wave',                 // 波浪运动
  RANDOM = 'random',             // 随机运动
  GRAVITY = 'gravity',           // 重力影响
  MAGNETIC = 'magnetic',         // 磁性吸引
  EXPLOSION = 'explosion',       // 爆炸扩散
  IMPLOSION = 'implosion',       // 内爆收缩
  FOLLOW_PATH = 'follow_path'    // 路径跟随
}

/**
 * 粒子配置接口
 */
export interface ParticleConfig {
  // 基础属性
  type: ParticleType;
  count: number;
  lifetime: number;          // 生命周期（毫秒）
  
  // 外观属性
  size: { min: number; max: number };
  color: {
    start: string;
    middle?: string;
    end: string;
  };
  opacity: { start: number; end: number };
  
  // 运动属性
  movement: ParticleMovementPattern;
  speed: { min: number; max: number };
  direction: { min: number; max: number }; // 角度（弧度）
  
  // 物理属性
  gravity: number;
  friction: number;
  bounce: number;           // 弹性系数
  mass: number;
  
  // 发射属性
  emissionRate: number;     // 每秒发射数量
  burstCount?: number;      // 爆发发射数量
  
  // 特殊效果
  glow: boolean;
  trail: boolean;
  trailLength?: number;
  rotation: boolean;
  pulsate: boolean;
  
  // 混合模式
  blendMode: 'normal' | 'add' | 'multiply' | 'screen' | 'overlay';
}

/**
 * 单个粒子实例
 */
export class Particle {
  // 位置和运动
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;      // x方向速度
  public vy: number = 0;      // y方向速度
  public ax: number = 0;      // x方向加速度
  public ay: number = 0;      // y方向加速度
  
  // 外观属性
  public size: number = 1;
  public color: string = '#ffffff';
  public opacity: number = 1;
  public rotation: number = 0;
  public rotationSpeed: number = 0;
  
  // 生命周期
  public age: number = 0;
  public lifetime: number = 1000;
  public isDead: boolean = false;
  
  // 物理属性
  public mass: number = 1;
  public friction: number = 0.98;
  public bounce: number = 0.8;
  
  // 特殊属性
  public trail: Array<{x: number, y: number}> = [];
  public maxTrailLength: number = 10;
  
  // 配置引用
  public config: ParticleConfig;
  
  constructor(config: ParticleConfig, x: number = 0, y: number = 0) {
    this.config = config;
    this.x = x;
    this.y = y;
    this.lifetime = config.lifetime;
    
    // 初始化随机属性
    this.initializeRandomProperties();
  }
  
  /**
   * 初始化随机属性
   */
  private initializeRandomProperties(): void {
    // 随机大小
    const sizeRange = this.config.size.max - this.config.size.min;
    this.size = this.config.size.min + Math.random() * sizeRange;
    
    // 随机速度
    const speedRange = this.config.speed.max - this.config.speed.min;
    const speed = this.config.speed.min + Math.random() * speedRange;
    
    // 随机方向
    const dirRange = this.config.direction.max - this.config.direction.min;
    const direction = this.config.direction.min + Math.random() * dirRange;
    
    this.vx = Math.cos(direction) * speed;
    this.vy = Math.sin(direction) * speed;
    
    // 旋转速度
    if (this.config.rotation) {
      this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    // 质量
    this.mass = this.config.mass + (Math.random() - 0.5) * 0.5;
  }
  
  /**
   * 更新粒子状态
   */
  public update(deltaTime: number): void {
    if (this.isDead) return;
    
    // 更新年龄
    this.age += deltaTime;
    if (this.age >= this.lifetime) {
      this.isDead = true;
      return;
    }
    
    // 更新运动
    this.updateMovement(deltaTime);
    
    // 更新外观
    this.updateAppearance();
    
    // 更新拖尾
    if (this.config.trail) {
      this.updateTrail();
    }
  }
  
  /**
   * 更新运动状态
   */
  private updateMovement(deltaTime: number): void {
    const dt = deltaTime / 1000; // 转换为秒
    
    // 应用重力
    this.ay += this.config.gravity * dt;
    
    // 根据运动模式更新速度
    switch (this.config.movement) {
      case ParticleMovementPattern.LINEAR:
        // 线性运动，无额外处理
        break;
        
      case ParticleMovementPattern.SPIRAL:
        const spiralRadius = this.age * 0.001;
        const spiralAngle = this.age * 0.005;
        this.vx = Math.cos(spiralAngle) * spiralRadius;
        this.vy = Math.sin(spiralAngle) * spiralRadius;
        break;
        
      case ParticleMovementPattern.WAVE:
        this.vy += Math.sin(this.age * 0.01) * 0.5;
        break;
        
      case ParticleMovementPattern.RANDOM:
        this.vx += (Math.random() - 0.5) * 2;
        this.vy += (Math.random() - 0.5) * 2;
        break;
        
      case ParticleMovementPattern.ORBITAL:
        const centerX = 0; // 可以设置轨道中心
        const centerY = 0;
        const orbitRadius = 50;
        const orbitSpeed = 0.02;
        const angle = this.age * orbitSpeed;
        this.x = centerX + Math.cos(angle) * orbitRadius;
        this.y = centerY + Math.sin(angle) * orbitRadius;
        return; // 直接设置位置，不需要速度更新
    }
    
    // 应用加速度到速度
    this.vx += this.ax * dt;
    this.vy += this.ay * dt;
    
    // 应用摩擦力
    this.vx *= this.friction;
    this.vy *= this.friction;
    
    // 更新位置
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // 更新旋转
    if (this.config.rotation) {
      this.rotation += this.rotationSpeed * dt;
    }
    
    // 重置加速度
    this.ax = 0;
    this.ay = 0;
  }
  
  /**
   * 更新外观属性
   */
  private updateAppearance(): void {
    const lifeProgress = this.age / this.lifetime;
    
    // 更新透明度
    const opacityStart = this.config.opacity.start;
    const opacityEnd = this.config.opacity.end;
    this.opacity = opacityStart + (opacityEnd - opacityStart) * lifeProgress;
    
    // 更新颜色
    this.color = this.interpolateColor(lifeProgress);
    
    // 脉动效果
    if (this.config.pulsate) {
      const pulsate = 1 + Math.sin(this.age * 0.01) * 0.2;
      this.size *= pulsate;
    }
  }
  
  /**
   * 颜色插值
   */
  private interpolateColor(progress: number): string {
    const { start, middle, end } = this.config.color;
    
    if (middle && progress < 0.5) {
      // 前半段：start -> middle
      return this.lerpColor(start, middle, progress * 2);
    } else if (middle && progress >= 0.5) {
      // 后半段：middle -> end
      return this.lerpColor(middle, end, (progress - 0.5) * 2);
    } else {
      // 直接从start -> end
      return this.lerpColor(start, end, progress);
    }
  }
  
  /**
   * 线性插值颜色
   */
  private lerpColor(color1: string, color2: string, t: number): string {
    // 简化版颜色插值，实际实现需要解析hex/rgb颜色
    return t < 0.5 ? color1 : color2;
  }
  
  /**
   * 更新拖尾
   */
  private updateTrail(): void {
    this.trail.push({ x: this.x, y: this.y });
    
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }
  
  /**
   * 应用力
   */
  public applyForce(fx: number, fy: number): void {
    this.ax += fx / this.mass;
    this.ay += fy / this.mass;
  }
}

/**
 * 粒子发射器
 */
export class ParticleEmitter {
  public x: number = 0;
  public y: number = 0;
  public active: boolean = true;
  
  private particles: Particle[] = [];
  private config: ParticleConfig;
  private timeSinceLastEmission: number = 0;
  private burstEmitted: boolean = false;
  
  constructor(config: ParticleConfig, x: number = 0, y: number = 0) {
    this.config = config;
    this.x = x;
    this.y = y;
  }
  
  /**
   * 更新发射器
   */
  public update(deltaTime: number): void {
    if (!this.active) return;
    
    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime);
      
      if (particle.isDead) {
        this.particles.splice(i, 1);
      }
    }
    
    // 发射新粒子
    this.timeSinceLastEmission += deltaTime;
    
    // 持续发射
    if (this.config.emissionRate > 0) {
      const emissionInterval = 1000 / this.config.emissionRate;
      
      while (this.timeSinceLastEmission >= emissionInterval) {
        this.emitParticle();
        this.timeSinceLastEmission -= emissionInterval;
      }
    }
    
    // 爆发发射
    if (this.config.burstCount && !this.burstEmitted) {
      for (let i = 0; i < this.config.burstCount; i++) {
        this.emitParticle();
      }
      this.burstEmitted = true;
    }
  }
  
  /**
   * 发射单个粒子
   */
  private emitParticle(): void {
    const particle = new Particle(this.config, this.x, this.y);
    this.particles.push(particle);
  }
  
  /**
   * 获取所有活跃粒子
   */
  public getParticles(): Particle[] {
    return this.particles.filter(p => !p.isDead);
  }
  
  /**
   * 停止发射
   */
  public stop(): void {
    this.active = false;
  }
  
  /**
   * 清空所有粒子
   */
  public clear(): void {
    this.particles = [];
  }
  
  /**
   * 获取粒子数量
   */
  public getParticleCount(): number {
    return this.particles.length;
  }
}

/**
 * 增强版粒子系统主类
 */
export class EnhancedParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private emitters: Map<string, ParticleEmitter> = new Map();
  private lastUpdateTime: number = 0;
  private animationHandle: number | NodeJS.Timeout | null = null;
  
  // 性能优化
  private maxParticles: number = 10000;
  private currentParticleCount: number = 0;
  private isRunning: boolean = false;
  
  // 渲染优化
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private useOffscreenRendering = true;

  constructor(canvas: HTMLCanvasElement, options: { maxParticles?: number } = {}) {
    this.canvas = canvas;
    this.maxParticles = options.maxParticles || 10000;

    this.ctx = this.ensureRenderingCapabilities(this.safeGetContext(canvas));

    // 设置离屏画布（在无DOM环境下退化为主画布）
    this.useOffscreenRendering = typeof document !== 'undefined';
    if (this.useOffscreenRendering) {
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offscreenCtx = this.ensureRenderingCapabilities(this.safeGetContext(offscreen));

      if (offscreenCtx) {
        this.offscreenCanvas = offscreen;
        this.offscreenCtx = offscreenCtx;
      } else {
        this.useOffscreenRendering = false;
        this.offscreenCanvas = this.canvas;
        this.offscreenCtx = this.ctx;
      }
    } else {
      this.offscreenCanvas = this.canvas;
      this.offscreenCtx = this.ctx;
    }
    
    this.setupCanvasOptimizations();
    this.start();
  }
  
  /**
   * 设置画布优化
   */
  private setupCanvasOptimizations(): void {
    // 启用图像平滑
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // 设置合成模式
    this.ctx.globalCompositeOperation = 'source-over';
    
    // 优化线条渲染
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }
  
  /**
   * 创建粒子发射器
   */
  public createEmitter(
    id: string, 
    config: ParticleConfig, 
    x: number = 0, 
    y: number = 0
  ): ParticleEmitter {
    const emitter = new ParticleEmitter(config, x, y);
    this.emitters.set(id, emitter);
    return emitter;
  }
  
  /**
   * 移除粒子发射器
   */
  public removeEmitter(id: string): boolean {
    return this.emitters.delete(id);
  }
  
  /**
   * 获取粒子发射器
   */
  public getEmitter(id: string): ParticleEmitter | undefined {
    return this.emitters.get(id);
  }
  
  /**
   * 开始粒子系统
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastUpdateTime = Date.now();
    this.animationHandle = this.requestFrame(() => this.gameLoop());
  }
  
  /**
   * 停止粒子系统
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationHandle !== null) {
      this.cancelFrame(this.animationHandle);
      this.animationHandle = null;
    }
  }
  
  /**
   * 游戏循环
   */
  private gameLoop(): void {
    if (!this.isRunning) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    // 更新所有发射器
    this.update(deltaTime);
    
    // 渲染
    this.render();
    
    // 继续循环
    this.animationHandle = this.requestFrame(() => this.gameLoop());
  }
  
  /**
   * 更新所有粒子
   */
  private update(deltaTime: number): void {
    this.currentParticleCount = 0;
    
    for (const [id, emitter] of this.emitters) {
      emitter.update(deltaTime);
      this.currentParticleCount += emitter.getParticleCount();
      
      // 性能保护：如果粒子数量过多，停止某些发射器
      if (this.currentParticleCount > this.maxParticles) {
        emitter.stop();
      }
    }
  }
  
  /**
   * 渲染所有粒子
   */
  private render(): void {
    // 清空画布
    if (this.useOffscreenRendering) {
      this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    const targetCtx = this.useOffscreenRendering ? this.offscreenCtx : this.ctx;
    
    // 按混合模式分组渲染
    const particlesByBlendMode = new Map<string, Particle[]>();
    
    for (const emitter of this.emitters.values()) {
      const particles = emitter.getParticles();
      
      for (const particle of particles) {
        const blendMode = particle.config.blendMode;
        if (!particlesByBlendMode.has(blendMode)) {
          particlesByBlendMode.set(blendMode, []);
        }
        particlesByBlendMode.get(blendMode)!.push(particle);
      }
    }
    
    // 按混合模式渲染粒子
    for (const [blendMode, particles] of particlesByBlendMode) {
      targetCtx.globalCompositeOperation = blendMode as GlobalCompositeOperation;
      
      for (const particle of particles) {
        this.renderParticle(targetCtx, particle);
      }
    }
    
    // 将离屏画布绘制到主画布
    if (this.useOffscreenRendering) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
  }

  private safeGetContext(canvas: HTMLCanvasElement | undefined | null): CanvasRenderingContext2D | null {
    if (!canvas || typeof canvas.getContext !== 'function') {
      return null;
    }

    try {
      return canvas.getContext('2d');
    } catch (error) {
      return null;
    }
  }

  private ensureRenderingCapabilities(ctx: CanvasRenderingContext2D | null): CanvasRenderingContext2D {
    const fallback = EnhancedParticleSystem.createFallbackContext();
    const target = ctx ?? fallback;

    const methodNames: Array<keyof CanvasRenderingContext2D> = [
      'save', 'restore', 'clearRect', 'fillRect', 'strokeRect', 'drawImage', 'setTransform',
      'translate', 'rotate', 'scale', 'beginPath', 'closePath', 'fill', 'stroke', 'arc',
      'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'ellipse', 'clip',
      'fillText', 'strokeText', 'measureText'
    ];

    for (const method of methodNames) {
      const current = (target as any)[method];
      if (typeof current !== 'function') {
        (target as any)[method] = (fallback as any)[method];
      }
    }

    if (typeof (target as any).createRadialGradient !== 'function') {
      (target as any).createRadialGradient = (fallback as any).createRadialGradient;
    }

    const defaultProps: Record<string, any> = {
      globalAlpha: 1,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      lineCap: 'round',
      lineJoin: 'round',
      shadowBlur: 0,
      shadowColor: 'rgba(0,0,0,0)',
      font: '16px sans-serif',
      textAlign: 'center',
      textBaseline: 'middle'
    };

    for (const [prop, value] of Object.entries(defaultProps)) {
      if ((target as any)[prop] === undefined) {
        (target as any)[prop] = value;
      }
    }

    return target;
  }

  private requestFrame(callback: FrameRequestCallback): number | NodeJS.Timeout {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(callback);
    }

    return setTimeout(() => callback(Date.now()), 16);
  }

  private cancelFrame(handle: number | NodeJS.Timeout): void {
    if (typeof handle === 'number' && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(handle);
      return;
    }

    clearTimeout(handle as NodeJS.Timeout);
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
   * 渲染单个粒子
   */
  private renderParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
    ctx.save();
    
    // 设置透明度
    ctx.globalAlpha = particle.opacity;
    
    // 移动到粒子位置
    ctx.translate(particle.x, particle.y);
    
    // 旋转
    if (particle.config.rotation) {
      ctx.rotate(particle.rotation);
    }
    
    // 绘制拖尾
    if (particle.config.trail && particle.trail.length > 1) {
      this.renderTrail(ctx, particle);
    }
    
    // 绘制粒子主体
    this.renderParticleBody(ctx, particle);
    
    // 绘制发光效果
    if (particle.config.glow) {
      this.renderGlow(ctx, particle);
    }
    
    ctx.restore();
  }
  
  /**
   * 渲染粒子主体
   */
  private renderParticleBody(ctx: CanvasRenderingContext2D, particle: Particle): void {
    const halfSize = particle.size / 2;
    
    ctx.fillStyle = particle.color;
    
    switch (particle.config.type) {
      case ParticleType.CIRCLE:
        ctx.beginPath();
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case ParticleType.SQUARE:
        ctx.fillRect(-halfSize, -halfSize, particle.size, particle.size);
        break;
        
      case ParticleType.STAR:
        this.drawStar(ctx, 0, 0, 5, halfSize, halfSize * 0.5);
        ctx.fill();
        break;
        
      case ParticleType.HEART:
        this.drawHeart(ctx, 0, 0, particle.size);
        ctx.fill();
        break;
        
      case ParticleType.DIAMOND:
        this.drawDiamond(ctx, 0, 0, particle.size);
        ctx.fill();
        break;
        
      case ParticleType.PETAL:
        this.drawPetal(ctx, 0, 0, particle.size);
        ctx.fill();
        break;
        
      case ParticleType.FEATHER:
        this.drawFeather(ctx, 0, 0, particle.size);
        ctx.fill();
        break;
        
      case ParticleType.DRAGON_SCALE:
        this.drawDragonScale(ctx, 0, 0, particle.size);
        ctx.fill();
        break;
        
      default:
        // 默认绘制圆形
        ctx.beginPath();
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }
  
  /**
   * 渲染拖尾
   */
  private renderTrail(ctx: CanvasRenderingContext2D, particle: Particle): void {
    if (particle.trail.length < 2) return;
    
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = particle.size * 0.3;
    
    ctx.beginPath();
    const firstPoint = particle.trail[0];
    ctx.moveTo(firstPoint.x - particle.x, firstPoint.y - particle.y);
    
    for (let i = 1; i < particle.trail.length; i++) {
      const point = particle.trail[i];
      const alpha = i / particle.trail.length;
      ctx.globalAlpha = alpha * particle.opacity;
      ctx.lineTo(point.x - particle.x, point.y - particle.y);
    }
    
    ctx.stroke();
  }
  
  /**
   * 渲染发光效果
   */
  private renderGlow(ctx: CanvasRenderingContext2D, particle: Particle): void {
    const glowRadius = particle.size * 2;
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    gradient.addColorStop(0, particle.color + '80'); // 50% 透明
    gradient.addColorStop(1, particle.color + '00'); // 完全透明
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  /**
   * 绘制星形
   */
  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }
  
  /**
   * 绘制心形
   */
  private drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const x = cx;
    const y = cy - size / 4;
    const width = size;
    const height = size;
    
    ctx.beginPath();
    const topCurveHeight = height * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    
    // 左边的曲线
    ctx.bezierCurveTo(
      x, y, 
      x - width / 2, y, 
      x - width / 2, y + topCurveHeight
    );
    
    ctx.bezierCurveTo(
      x - width / 2, y + (height + topCurveHeight) / 2, 
      x, y + (height + topCurveHeight) / 2, 
      x, y + height
    );
    
    ctx.bezierCurveTo(
      x, y + (height + topCurveHeight) / 2, 
      x + width / 2, y + (height + topCurveHeight) / 2, 
      x + width / 2, y + topCurveHeight
    );
    
    // 右边的曲线
    ctx.bezierCurveTo(
      x + width / 2, y, 
      x, y, 
      x, y + topCurveHeight
    );
    
    ctx.closePath();
  }
  
  /**
   * 绘制钻石
   */
  private drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const halfSize = size / 2;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - halfSize);        // 顶点
    ctx.lineTo(cx + halfSize, cy);        // 右点
    ctx.lineTo(cx, cy + halfSize);        // 底点
    ctx.lineTo(cx - halfSize, cy);        // 左点
    ctx.closePath();
  }
  
  /**
   * 绘制花瓣
   */
  private drawPetal(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const halfSize = size / 2;
    
    ctx.beginPath();
    ctx.ellipse(cx, cy - halfSize / 2, halfSize / 3, halfSize, 0, 0, Math.PI * 2);
  }
  
  /**
   * 绘制羽毛
   */
  private drawFeather(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const halfSize = size / 2;
    
    ctx.beginPath();
    // 羽毛主体
    ctx.ellipse(cx, cy, halfSize / 4, halfSize, 0, 0, Math.PI * 2);
    
    // 羽毛分叉
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * halfSize / 3;
      ctx.moveTo(cx, cy + offset);
      ctx.lineTo(cx - halfSize / 3, cy + offset - halfSize / 6);
      ctx.lineTo(cx + halfSize / 3, cy + offset - halfSize / 6);
    }
  }
  
  /**
   * 绘制龙鳞
   */
  private drawDragonScale(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const halfSize = size / 2;
    
    ctx.beginPath();
    // 龙鳞的弧形顶部
    ctx.arc(cx, cy - halfSize / 3, halfSize / 2, 0, Math.PI);
    // 连接到底部的尖角
    ctx.lineTo(cx, cy + halfSize / 2);
    ctx.closePath();
  }
  
  /**
   * 创建预定义的粒子效果
   */
  public createPresetEffect(
    preset: string, 
    x: number, 
    y: number, 
    zodiac?: ZodiacSign
  ): string {
    const effectId = `preset_${preset}_${Date.now()}`;
    let config: ParticleConfig;
    
    switch (preset) {
      case 'sparkle_burst':
        config = this.getSparkleConfig(zodiac);
        break;
        
      case 'fire_explosion':
        config = this.getFireConfig();
        break;
        
      case 'healing_aura':
        config = this.getHealingConfig(zodiac);
        break;
        
      case 'money_rain':
        config = this.getMoneyRainConfig();
        break;
        
      case 'zodiac_blessing':
        config = this.getZodiacBlessingConfig(zodiac);
        break;
        
      default:
        config = this.getDefaultConfig();
        break;
    }
    
    this.createEmitter(effectId, config, x, y);
    return effectId;
  }
  
  /**
   * 获取闪光配置
   */
  private getSparkleConfig(zodiac?: ZodiacSign): ParticleConfig {
    const zodiacColors = this.getZodiacColors(zodiac);
    
    return {
      type: ParticleType.SPARKLE,
      count: 50,
      lifetime: 2000,
      size: { min: 2, max: 8 },
      color: {
        start: zodiacColors.primary,
        end: zodiacColors.secondary
      },
      opacity: { start: 1, end: 0 },
      movement: ParticleMovementPattern.EXPLOSION,
      speed: { min: 50, max: 150 },
      direction: { min: 0, max: Math.PI * 2 },
      gravity: 0,
      friction: 0.95,
      bounce: 0.8,
      mass: 1,
      emissionRate: 0,
      burstCount: 50,
      glow: true,
      trail: false,
      rotation: true,
      pulsate: true,
      blendMode: 'add'
    };
  }
  
  /**
   * 获取火焰配置
   */
  private getFireConfig(): ParticleConfig {
    return {
      type: ParticleType.FIRE,
      count: 100,
      lifetime: 1500,
      size: { min: 3, max: 12 },
      color: {
        start: '#FF4500',
        middle: '#FF8C00',
        end: '#FFD700'
      },
      opacity: { start: 0.8, end: 0 },
      movement: ParticleMovementPattern.RANDOM,
      speed: { min: 20, max: 80 },
      direction: { min: -Math.PI / 4, max: Math.PI / 4 },
      gravity: -50,
      friction: 0.98,
      bounce: 0,
      mass: 0.5,
      emissionRate: 60,
      glow: true,
      trail: false,
      rotation: false,
      pulsate: true,
      blendMode: 'add'
    };
  }
  
  /**
   * 获取治疗光环配置
   */
  private getHealingConfig(zodiac?: ZodiacSign): ParticleConfig {
    const colors = zodiac ? this.getZodiacColors(zodiac) : { primary: '#90EE90', secondary: '#FFFFFF' };
    
    return {
      type: ParticleType.SPIRIT_WISP,
      count: 30,
      lifetime: 3000,
      size: { min: 4, max: 10 },
      color: {
        start: colors.primary,
        end: colors.secondary
      },
      opacity: { start: 0.6, end: 0 },
      movement: ParticleMovementPattern.SPIRAL,
      speed: { min: 30, max: 60 },
      direction: { min: 0, max: Math.PI * 2 },
      gravity: -20,
      friction: 0.99,
      bounce: 0,
      mass: 0.3,
      emissionRate: 10,
      glow: true,
      trail: true,
      trailLength: 5,
      rotation: false,
      pulsate: true,
      blendMode: 'screen'
    };
  }
  
  /**
   * 获取金币雨配置
   */
  private getMoneyRainConfig(): ParticleConfig {
    return {
      type: ParticleType.COIN,
      count: 80,
      lifetime: 2500,
      size: { min: 6, max: 12 },
      color: {
        start: '#FFD700',
        end: '#FFA500'
      },
      opacity: { start: 1, end: 0.7 },
      movement: ParticleMovementPattern.GRAVITY,
      speed: { min: 0, max: 20 },
      direction: { min: 0, max: Math.PI * 2 },
      gravity: 300,
      friction: 0.98,
      bounce: 0.6,
      mass: 2,
      emissionRate: 30,
      glow: true,
      trail: false,
      rotation: true,
      pulsate: false,
      blendMode: 'normal'
    };
  }
  
  /**
   * 获取生肖祝福配置
   */
  private getZodiacBlessingConfig(zodiac?: ZodiacSign): ParticleConfig {
    const colors = this.getZodiacColors(zodiac);
    const particleType = this.getZodiacParticleType(zodiac);
    
    return {
      type: particleType,
      count: 60,
      lifetime: 4000,
      size: { min: 5, max: 15 },
      color: {
        start: colors.primary,
        middle: colors.secondary,
        end: colors.accent
      },
      opacity: { start: 0.9, end: 0 },
      movement: ParticleMovementPattern.ORBITAL,
      speed: { min: 40, max: 100 },
      direction: { min: 0, max: Math.PI * 2 },
      gravity: 0,
      friction: 0.99,
      bounce: 0,
      mass: 1,
      emissionRate: 15,
      glow: true,
      trail: true,
      trailLength: 8,
      rotation: true,
      pulsate: true,
      blendMode: 'screen'
    };
  }
  
  /**
   * 获取默认配置
   */
  private getDefaultConfig(): ParticleConfig {
    return {
      type: ParticleType.CIRCLE,
      count: 20,
      lifetime: 1000,
      size: { min: 2, max: 6 },
      color: {
        start: '#FFFFFF',
        end: '#CCCCCC'
      },
      opacity: { start: 1, end: 0 },
      movement: ParticleMovementPattern.LINEAR,
      speed: { min: 20, max: 50 },
      direction: { min: 0, max: Math.PI * 2 },
      gravity: 0,
      friction: 1,
      bounce: 0,
      mass: 1,
      emissionRate: 10,
      glow: false,
      trail: false,
      rotation: false,
      pulsate: false,
      blendMode: 'normal'
    };
  }
  
  /**
   * 获取生肖颜色
   */
  private getZodiacColors(zodiac?: ZodiacSign): { primary: string; secondary: string; accent: string } {
    const colorMap = {
      '鼠': { primary: '#4A90E2', secondary: '#87CEEB', accent: '#E0F6FF' },
      '牛': { primary: '#8B4513', secondary: '#DEB887', accent: '#F5E6D3' },
      '虎': { primary: '#FF8C00', secondary: '#FFD700', accent: '#FFF8DC' },
      '兔': { primary: '#FFB6C1', secondary: '#FFC0CB', accent: '#FFEBEF' },
      '龙': { primary: '#DAA520', secondary: '#FFD700', accent: '#FFFACD' },
      '蛇': { primary: '#6B8E23', secondary: '#9ACD32', accent: '#F0FFF0' },
      '马': { primary: '#CD853F', secondary: '#DEB887', accent: '#FDF5E6' },
      '羊': { primary: '#E6E6FA', secondary: '#DDA0DD', accent: '#F8F8FF' },
      '猴': { primary: '#DEB887', secondary: '#F4A460', accent: '#FFF8DC' },
      '鸡': { primary: '#FF6347', secondary: '#FFD700', accent: '#FFFAF0' },
      '狗': { primary: '#8FBC8F', secondary: '#98FB98', accent: '#F0FFF0' },
      '猪': { primary: '#FFA0C9', secondary: '#FFB6C1', accent: '#FFF0F5' }
    };
    
    return colorMap[zodiac as keyof typeof colorMap] || { primary: '#FFFFFF', secondary: '#CCCCCC', accent: '#F0F0F0' };
  }
  
  /**
   * 获取生肖粒子类型
   */
  private getZodiacParticleType(zodiac?: ZodiacSign): ParticleType {
    const typeMap = {
      '鼠': ParticleType.SPARKLE,
      '牛': ParticleType.EARTH_CRYSTAL,
      '虎': ParticleType.FIRE,
      '兔': ParticleType.PETAL,
      '龙': ParticleType.DRAGON_SCALE,
      '蛇': ParticleType.WATER_DROP,
      '马': ParticleType.STAR,
      '羊': ParticleType.SPIRIT_WISP,
      '猴': ParticleType.SPARKLE,
      '鸡': ParticleType.FEATHER,
      '狗': ParticleType.PAW_PRINT,
      '猪': ParticleType.HEART
    };
    
    return typeMap[zodiac as keyof typeof typeMap] || ParticleType.CIRCLE;
  }
  
  /**
   * 获取当前性能统计
   */
  public getPerformanceStats(): {
    emitterCount: number;
    particleCount: number;
    fps: number;
    memoryUsage: string;
  } {
    return {
      emitterCount: this.emitters.size,
      particleCount: this.currentParticleCount,
      fps: Math.round(1000 / 16.67), // 简化版FPS计算
      memoryUsage: `${this.currentParticleCount * 200}B` // 估计内存使用
    };
  }
  
  /**
   * 清空所有粒子
   */
  public clearAll(): void {
    for (const emitter of this.emitters.values()) {
      emitter.clear();
    }
  }
  
  /**
   * 销毁粒子系统
   */
  public destroy(): void {
    this.stop();
    this.clearAll();
    this.emitters.clear();
  }
}

export default EnhancedParticleSystem;
