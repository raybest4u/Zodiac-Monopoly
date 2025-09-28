/**
 * 技能释放视觉效果动画系统
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface SkillData {
  id: string;
  name: string;
  zodiac: string;
  type: SkillType;
  level: number;
  cooldown: number;
  description: string;
  targetType: 'self' | 'opponent' | 'property' | 'global';
}

export type SkillType = 
  | 'attack' 
  | 'defense' 
  | 'economic' 
  | 'movement' 
  | 'special' 
  | 'buff' 
  | 'debuff';

export interface SkillEffectOptions {
  duration: number;
  intensity: number;
  showParticles: boolean;
  showTrails: boolean;
  screenShake: boolean;
  soundEnabled: boolean;
  cameraFollow: boolean;
}

export interface SkillTarget {
  type: 'player' | 'property' | 'board' | 'screen';
  id?: string;
  position?: { x: number; y: number };
  element?: HTMLElement;
}

/**
 * 技能效果动画管理器
 */
export class SkillEffectAnimations extends EventEmitter {
  private activeEffects = new Map<string, SkillEffect>();
  private zodiacEffectLibrary: Map<string, ZodiacEffectConfig>;
  private particleSystem: ParticleSystem;
  private cameraSystem: CameraSystem;
  private soundManager: SkillSoundManager;

  constructor() {
    super();
    this.zodiacEffectLibrary = new Map();
    this.particleSystem = new ParticleSystem();
    this.cameraSystem = new CameraSystem();
    this.soundManager = new SkillSoundManager();

    this.initializeZodiacEffects();
  }

  /**
   * 初始化十二生肖技能效果配置
   */
  private initializeZodiacEffects(): void {
    // 鼠 - 敏捷灵巧
    this.zodiacEffectLibrary.set('鼠', {
      primaryColor: '#4A90E2',
      secondaryColor: '#87CEEB',
      particleType: 'sparkle',
      soundType: 'quick',
      animationType: 'dash',
      trailColor: '#E0F6FF'
    });

    // 牛 - 坚实厚重
    this.zodiacEffectLibrary.set('牛', {
      primaryColor: '#8B4513',
      secondaryColor: '#DEB887',
      particleType: 'rock',
      soundType: 'heavy',
      animationType: 'stomp',
      trailColor: '#F5E6D3'
    });

    // 虎 - 威猛霸气
    this.zodiacEffectLibrary.set('虎', {
      primaryColor: '#FF8C00',
      secondaryColor: '#FFD700',
      particleType: 'flame',
      soundType: 'roar',
      animationType: 'pounce',
      trailColor: '#FFF8DC'
    });

    // 兔 - 轻灵跳跃
    this.zodiacEffectLibrary.set('兔', {
      primaryColor: '#FFB6C1',
      secondaryColor: '#FFC0CB',
      particleType: 'petal',
      soundType: 'soft',
      animationType: 'bounce',
      trailColor: '#FFEBEF'
    });

    // 龙 - 神秘威严
    this.zodiacEffectLibrary.set('龙', {
      primaryColor: '#DAA520',
      secondaryColor: '#FFD700',
      particleType: 'energy',
      soundType: 'mystical',
      animationType: 'spiral',
      trailColor: '#FFFACD'
    });

    // 蛇 - 蜿蜒流动
    this.zodiacEffectLibrary.set('蛇', {
      primaryColor: '#6B8E23',
      secondaryColor: '#9ACD32',
      particleType: 'liquid',
      soundType: 'hiss',
      animationType: 'wave',
      trailColor: '#F0FFF0'
    });

    // 马 - 奔腾速度
    this.zodiacEffectLibrary.set('马', {
      primaryColor: '#CD853F',
      secondaryColor: '#DEB887',
      particleType: 'dust',
      soundType: 'gallop',
      animationType: 'charge',
      trailColor: '#FDF5E6'
    });

    // 羊 - 温和柔顺
    this.zodiacEffectLibrary.set('羊', {
      primaryColor: '#E6E6FA',
      secondaryColor: '#DDA0DD',
      particleType: 'cloud',
      soundType: 'gentle',
      animationType: 'float',
      trailColor: '#F8F8FF'
    });

    // 猴 - 机智活泼
    this.zodiacEffectLibrary.set('猴', {
      primaryColor: '#DEB887',
      secondaryColor: '#F4A460',
      particleType: 'banana',
      soundType: 'playful',
      animationType: 'swing',
      trailColor: '#FFF8DC'
    });

    // 鸡 - 华丽绚烂
    this.zodiacEffectLibrary.set('鸡', {
      primaryColor: '#FF6347',
      secondaryColor: '#FFD700',
      particleType: 'feather',
      soundType: 'crow',
      animationType: 'flap',
      trailColor: '#FFFAF0'
    });

    // 狗 - 忠诚坚定
    this.zodiacEffectLibrary.set('狗', {
      primaryColor: '#8FBC8F',
      secondaryColor: '#98FB98',
      particleType: 'paw',
      soundType: 'bark',
      animationType: 'guard',
      trailColor: '#F0FFF0'
    });

    // 猪 - 朴实憨厚
    this.zodiacEffectLibrary.set('猪', {
      primaryColor: '#FFA0C9',
      secondaryColor: '#FFB6C1',
      particleType: 'heart',
      soundType: 'grunt',
      animationType: 'tumble',
      trailColor: '#FFF0F5'
    });
  }

  /**
   * 播放技能效果动画
   */
  async playSkillEffect(
    skillData: SkillData,
    caster: SkillTarget,
    targets: SkillTarget[] = [],
    options: Partial<SkillEffectOptions> = {}
  ): Promise<void> {
    const effectId = `skill_${skillData.id}_${Date.now()}`;
    
    const effectOptions: SkillEffectOptions = {
      duration: 2000,
      intensity: 1.0,
      showParticles: true,
      showTrails: true,
      screenShake: false,
      soundEnabled: true,
      cameraFollow: true,
      ...options
    };

    try {
      this.emit('skillEffectStarted', { skillData, effectId });

      // 创建技能效果
      const skillEffect = new SkillEffect(
        skillData,
        caster,
        targets,
        effectOptions,
        this.zodiacEffectLibrary.get(skillData.zodiac)!
      );

      this.activeEffects.set(effectId, skillEffect);

      // 播放音效
      if (effectOptions.soundEnabled) {
        this.soundManager.playSkillSound(skillData);
      }

      // 相机跟随
      if (effectOptions.cameraFollow) {
        this.cameraSystem.focusOnTarget(caster);
      }

      // 执行动画序列
      await this.executeSkillSequence(skillEffect, effectOptions);

      this.emit('skillEffectCompleted', { skillData, effectId });

    } catch (error) {
      this.emit('skillEffectFailed', { skillData, effectId, error });
      throw error;
    } finally {
      this.activeEffects.delete(effectId);
    }
  }

  /**
   * 执行技能动画序列
   */
  private async executeSkillSequence(
    skillEffect: SkillEffect,
    options: SkillEffectOptions
  ): Promise<void> {
    const { skillData } = skillEffect;

    // 阶段1: 蓄力效果 (Charging)
    await this.playChargingEffect(skillEffect, options.duration * 0.3);

    // 阶段2: 释放效果 (Casting)
    await this.playCastingEffect(skillEffect, options.duration * 0.4);

    // 阶段3: 命中效果 (Impact)
    await this.playImpactEffect(skillEffect, options.duration * 0.3);

    // 额外效果
    if (skillData.type === 'special') {
      await this.playSpecialEffect(skillEffect, options.duration * 0.5);
    }
  }

  /**
   * 播放蓄力效果
   */
  private async playChargingEffect(
    skillEffect: SkillEffect,
    duration: number
  ): Promise<void> {
    const { caster, zodiacConfig } = skillEffect;
    
    if (!caster.element) return;

    // 创建蓄力光环
    const chargingRing = this.createChargingRing(caster.element, zodiacConfig);
    
    // 粒子聚集效果
    if (skillEffect.options.showParticles) {
      this.particleSystem.createGatheringParticles(
        caster.position || { x: 0, y: 0 },
        zodiacConfig.primaryColor,
        duration
      );
    }

    // 元素发光和震动
    await this.animateElementCharge(caster.element, zodiacConfig, duration);

    // 清理
    if (chargingRing.parentNode) {
      chargingRing.parentNode.removeChild(chargingRing);
    }
  }

  /**
   * 播放释放效果
   */
  private async playCastingEffect(
    skillEffect: SkillEffect,
    duration: number
  ): Promise<void> {
    const { skillData, caster, targets, zodiacConfig } = skillEffect;

    // 根据技能类型选择不同的释放效果
    switch (skillData.type) {
      case 'attack':
        await this.playAttackCasting(caster, targets, zodiacConfig, duration);
        break;
      case 'defense':
        await this.playDefenseCasting(caster, zodiacConfig, duration);
        break;
      case 'economic':
        await this.playEconomicCasting(caster, zodiacConfig, duration);
        break;
      case 'movement':
        await this.playMovementCasting(caster, targets, zodiacConfig, duration);
        break;
      case 'buff':
        await this.playBuffCasting(caster, targets, zodiacConfig, duration);
        break;
      case 'debuff':
        await this.playDebuffCasting(caster, targets, zodiacConfig, duration);
        break;
      case 'special':
        await this.playSpecialCasting(caster, targets, zodiacConfig, duration);
        break;
    }
  }

  /**
   * 播放命中效果
   */
  private async playImpactEffect(
    skillEffect: SkillEffect,
    duration: number
  ): Promise<void> {
    const { targets, zodiacConfig, options } = skillEffect;

    for (const target of targets) {
      if (!target.element) continue;

      // 创建冲击波效果
      await this.createImpactWave(target.element, zodiacConfig);

      // 目标震动效果
      this.animateTargetHit(target.element, duration);

      // 屏幕震动
      if (options.screenShake) {
        this.cameraSystem.shakeScreen(0.3, 200);
      }
    }
  }

  /**
   * 攻击技能释放效果
   */
  private async playAttackCasting(
    caster: SkillTarget,
    targets: SkillTarget[],
    config: ZodiacEffectConfig,
    duration: number
  ): Promise<void> {
    for (const target of targets) {
      if (!caster.position || !target.position) continue;

      // 创建攻击射线
      const projectile = this.createProjectile(
        caster.position,
        target.position,
        config.primaryColor,
        config.animationType
      );

      // 轨迹粒子
      this.particleSystem.createTrailParticles(
        caster.position,
        target.position,
        config.trailColor,
        duration
      );

      // 等待射线到达目标
      await projectile.animate(duration);
    }
  }

  /**
   * 防御技能释放效果
   */
  private async playDefenseCasting(
    caster: SkillTarget,
    config: ZodiacEffectConfig,
    duration: number
  ): Promise<void> {
    if (!caster.element) return;

    // 创建防护罩
    const shield = this.createShield(caster.element, config);
    
    // 防护罩展开动画
    shield.animate([
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.2)', opacity: 0.8, offset: 0.7 },
      { transform: 'scale(1)', opacity: 0.6 }
    ], {
      duration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });

    // 延迟清理
    setTimeout(() => {
      if (shield.parentNode) {
        shield.parentNode.removeChild(shield);
      }
    }, duration + 1000);
  }

  /**
   * 经济技能释放效果
   */
  private async playEconomicCasting(
    caster: SkillTarget,
    config: ZodiacEffectConfig,
    duration: number
  ): Promise<void> {
    if (!caster.position) return;

    // 创建金币雨效果
    this.particleSystem.createCoinRain(
      caster.position,
      config.primaryColor,
      duration
    );

    // 金光闪烁效果
    this.createGoldFlash(caster.position, duration);
  }

  /**
   * 移动技能释放效果
   */
  private async playMovementCasting(
    caster: SkillTarget,
    targets: SkillTarget[],
    config: ZodiacEffectConfig,
    duration: number
  ): Promise<void> {
    if (!caster.element) return;

    // 创建传送门效果
    const portal = this.createPortal(caster.element, config);
    
    // 传送粒子效果
    this.particleSystem.createTeleportParticles(
      caster.position || { x: 0, y: 0 },
      config.primaryColor,
      duration
    );

    await new Promise(resolve => setTimeout(resolve, duration));

    if (portal.parentNode) {
      portal.parentNode.removeChild(portal);
    }
  }

  /**
   * Buff技能释放效果
   */
  private async playBuffCasting(
    caster: SkillTarget,
    targets: SkillTarget[],
    config: ZodiacEffectConfig,
    duration: number
  ): Promise<void> {
    for (const target of targets) {
      if (!target.element) continue;

      // 创建增益光环
      const buffAura = this.createBuffAura(target.element, config);
      
      // 上升粒子效果
      this.particleSystem.createRisingParticles(
        target.position || { x: 0, y: 0 },
        config.secondaryColor,
        duration
      );
    }
  }

  /**
   * Debuff技能释放效果
   */
  private async playDebuffCasting(
    caster: SkillTarget,
    targets: SkillTarget[],
    config: ZodiacEffectConfig,
    duration: number
  ): Promise<void> {
    for (const target of targets) {
      if (!target.element) continue;

      // 创建削弱效果
      const debuffEffect = this.createDebuffEffect(target.element, config);
      
      // 下降粒子效果
      this.particleSystem.createFallingParticles(
        target.position || { x: 0, y: 0 },
        '#666666',
        duration
      );
    }
  }

  /**
   * 特殊技能释放效果
   */
  private async playSpecialCasting(
    caster: SkillTarget,
    targets: SkillTarget[],
    config: ZodiacEffectConfig,
    duration: number
  ): Promise<void> {
    // 全屏特效
    this.createFullScreenEffect(config, duration);
    
    // 时间停止效果
    this.createTimeStopEffect(duration * 0.5);
    
    // 复杂粒子系统
    this.particleSystem.createComplexEffect(
      caster.position || { x: 0, y: 0 },
      config,
      duration
    );
  }

  /**
   * 创建蓄力光环
   */
  private createChargingRing(element: HTMLElement, config: ZodiacEffectConfig): HTMLElement {
    const ring = document.createElement('div');
    ring.className = 'charging-ring';
    ring.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border: 2px solid ${config.primaryColor};
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: charging-pulse 1s ease-in-out infinite;
      pointer-events: none;
      z-index: 100;
    `;

    element.appendChild(ring);

    // 扩张动画
    ring.animate([
      { width: '0', height: '0', borderWidth: '2px' },
      { width: '80px', height: '80px', borderWidth: '4px' }
    ], {
      duration: 800,
      fill: 'forwards',
      easing: 'ease-out'
    });

    return ring;
  }

  /**
   * 元素充能动画
   */
  private async animateElementCharge(
    element: HTMLElement,
    config: ZodiacEffectConfig,
    duration: number
  ): Promise<void> {
    const originalBoxShadow = element.style.boxShadow;
    const originalTransform = element.style.transform;

    return new Promise(resolve => {
      element.animate([
        {
          boxShadow: `0 0 0 ${config.primaryColor}00`,
          transform: originalTransform + ' scale(1)'
        },
        {
          boxShadow: `0 0 20px ${config.primaryColor}80, 0 0 40px ${config.primaryColor}40`,
          transform: originalTransform + ' scale(1.05)',
          offset: 0.5
        },
        {
          boxShadow: `0 0 30px ${config.primaryColor}FF, 0 0 60px ${config.primaryColor}80`,
          transform: originalTransform + ' scale(1.1)'
        }
      ], {
        duration,
        easing: 'ease-in-out',
        fill: 'forwards'
      }).addEventListener('finish', () => {
        // 恢复原状
        setTimeout(() => {
          element.style.boxShadow = originalBoxShadow;
          element.style.transform = originalTransform;
        }, 500);
        resolve();
      });
    });
  }

  /**
   * 创建射弹
   */
  private createProjectile(
    start: { x: number; y: number },
    end: { x: number; y: number },
    color: string,
    animationType: string
  ): Projectile {
    return new Projectile(start, end, color, animationType);
  }

  /**
   * 创建冲击波
   */
  private async createImpactWave(element: HTMLElement, config: ZodiacEffectConfig): Promise<void> {
    const wave = document.createElement('div');
    wave.className = 'impact-wave';
    wave.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border: 3px solid ${config.primaryColor};
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 99;
    `;

    element.appendChild(wave);

    return new Promise(resolve => {
      wave.animate([
        { width: '0', height: '0', opacity: 1 },
        { width: '150px', height: '150px', opacity: 0 }
      ], {
        duration: 600,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        if (wave.parentNode) {
          wave.parentNode.removeChild(wave);
        }
        resolve();
      });
    });
  }

  /**
   * 目标被击中动画
   */
  private animateTargetHit(element: HTMLElement, duration: number): void {
    const originalTransform = element.style.transform;
    
    element.animate([
      { transform: originalTransform },
      { transform: originalTransform + ' translateX(-5px)', offset: 0.1 },
      { transform: originalTransform + ' translateX(5px)', offset: 0.2 },
      { transform: originalTransform + ' translateX(-3px)', offset: 0.3 },
      { transform: originalTransform + ' translateX(3px)', offset: 0.4 },
      { transform: originalTransform }
    ], {
      duration: duration * 0.3,
      easing: 'linear'
    });
  }

  /**
   * 创建防护罩
   */
  private createShield(element: HTMLElement, config: ZodiacEffectConfig): HTMLElement {
    const shield = document.createElement('div');
    shield.className = 'skill-shield';
    shield.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100px;
      height: 100px;
      border: 3px solid ${config.primaryColor};
      border-radius: 50%;
      background: radial-gradient(circle, ${config.primaryColor}20, ${config.secondaryColor}10);
      transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
      z-index: 98;
    `;

    element.appendChild(shield);
    return shield;
  }

  /**
   * 创建传送门
   */
  private createPortal(element: HTMLElement, config: ZodiacEffectConfig): HTMLElement {
    const portal = document.createElement('div');
    portal.className = 'skill-portal';
    portal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80px;
      height: 80px;
      background: conic-gradient(${config.primaryColor}, ${config.secondaryColor}, ${config.primaryColor});
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: portal-spin 2s linear infinite;
      pointer-events: none;
      z-index: 97;
    `;

    element.appendChild(portal);
    return portal;
  }

  /**
   * 创建增益光环
   */
  private createBuffAura(element: HTMLElement, config: ZodiacEffectConfig): HTMLElement {
    const aura = document.createElement('div');
    aura.className = 'skill-buff-aura';
    aura.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, transparent 40%, ${config.secondaryColor}40, transparent 70%);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: buff-glow 2s ease-in-out infinite;
      pointer-events: none;
      z-index: 96;
    `;

    element.appendChild(aura);
    return aura;
  }

  /**
   * 创建削弱效果
   */
  private createDebuffEffect(element: HTMLElement, config: ZodiacEffectConfig): HTMLElement {
    const debuff = document.createElement('div');
    debuff.className = 'skill-debuff';
    debuff.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 30%, #66666640, transparent 70%);
      border-radius: inherit;
      animation: debuff-pulse 1s ease-in-out infinite;
      pointer-events: none;
      z-index: 95;
    `;

    element.appendChild(debuff);
    return debuff;
  }

  /**
   * 创建全屏特效
   */
  private createFullScreenEffect(config: ZodiacEffectConfig, duration: number): void {
    const overlay = document.createElement('div');
    overlay.className = 'skill-fullscreen-effect';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle, transparent, ${config.primaryColor}30);
      pointer-events: none;
      z-index: 9999;
    `;

    document.body.appendChild(overlay);

    overlay.animate([
      { opacity: 0 },
      { opacity: 1, offset: 0.3 },
      { opacity: 0 }
    ], {
      duration,
      easing: 'ease-in-out'
    }).addEventListener('finish', () => {
      document.body.removeChild(overlay);
    });
  }

  /**
   * 创建时间停止效果
   */
  private createTimeStopEffect(duration: number): void {
    // 暂时禁用所有动画
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-play-state: paused !important;
        transition: none !important;
      }
    `;
    
    document.head.appendChild(style);

    setTimeout(() => {
      document.head.removeChild(style);
    }, duration);
  }

  /**
   * 创建金光闪烁效果
   */
  private createGoldFlash(position: { x: number; y: number }, duration: number): void {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      left: ${position.x - 25}px;
      top: ${position.y - 25}px;
      width: 50px;
      height: 50px;
      background: radial-gradient(circle, #FFD700, transparent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
    `;

    document.body.appendChild(flash);

    flash.animate([
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(2)', opacity: 1, offset: 0.3 },
      { transform: 'scale(3)', opacity: 0 }
    ], {
      duration: duration,
      easing: 'ease-out'
    }).addEventListener('finish', () => {
      document.body.removeChild(flash);
    });
  }

  /**
   * 停止所有技能效果
   */
  stopAllEffects(): void {
    this.activeEffects.forEach(effect => effect.stop());
    this.activeEffects.clear();
    this.particleSystem.clearAll();
  }

  /**
   * 销毁动画系统
   */
  destroy(): void {
    this.stopAllEffects();
    this.particleSystem.destroy();
    this.cameraSystem.destroy();
    this.soundManager.destroy();
    this.removeAllListeners();
  }
}

// 技能效果类
class SkillEffect {
  public readonly skillData: SkillData;
  public readonly caster: SkillTarget;
  public readonly targets: SkillTarget[];
  public readonly options: SkillEffectOptions;
  public readonly zodiacConfig: ZodiacEffectConfig;

  constructor(
    skillData: SkillData,
    caster: SkillTarget,
    targets: SkillTarget[],
    options: SkillEffectOptions,
    zodiacConfig: ZodiacEffectConfig
  ) {
    this.skillData = skillData;
    this.caster = caster;
    this.targets = targets;
    this.options = options;
    this.zodiacConfig = zodiacConfig;
  }

  stop(): void {
    // 停止当前效果的实现
  }
}

// 射弹类
class Projectile {
  private element: HTMLElement;
  private startPos: { x: number; y: number };
  private endPos: { x: number; y: number };

  constructor(
    start: { x: number; y: number },
    end: { x: number; y: number },
    color: string,
    animationType: string
  ) {
    this.startPos = start;
    this.endPos = end;
    
    this.element = document.createElement('div');
    this.element.className = `projectile ${animationType}`;
    this.element.style.cssText = `
      position: fixed;
      left: ${start.x}px;
      top: ${start.y}px;
      width: 8px;
      height: 8px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 1001;
      box-shadow: 0 0 10px ${color};
    `;

    document.body.appendChild(this.element);
  }

  async animate(duration: number): Promise<void> {
    return new Promise(resolve => {
      this.element.animate([
        {
          left: `${this.startPos.x}px`,
          top: `${this.startPos.y}px`,
          opacity: 1
        },
        {
          left: `${this.endPos.x}px`,
          top: `${this.endPos.y}px`,
          opacity: 0
        }
      ], {
        duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        resolve();
      });
    });
  }
}

// 粒子系统（简化版）
class ParticleSystem {
  createGatheringParticles(center: { x: number; y: number }, color: string, duration: number): void {
    // 实现聚集粒子效果
  }
  
  createTrailParticles(start: { x: number; y: number }, end: { x: number; y: number }, color: string, duration: number): void {
    // 实现轨迹粒子效果
  }
  
  createCoinRain(center: { x: number; y: number }, color: string, duration: number): void {
    // 实现金币雨效果
  }
  
  createTeleportParticles(center: { x: number; y: number }, color: string, duration: number): void {
    // 实现传送粒子效果
  }
  
  createRisingParticles(center: { x: number; y: number }, color: string, duration: number): void {
    // 实现上升粒子效果
  }
  
  createFallingParticles(center: { x: number; y: number }, color: string, duration: number): void {
    // 实现下降粒子效果
  }
  
  createComplexEffect(center: { x: number; y: number }, config: ZodiacEffectConfig, duration: number): void {
    // 实现复杂粒子效果
  }
  
  clearAll(): void {
    // 清理所有粒子
  }
  
  destroy(): void {
    // 销毁粒子系统
  }
}

// 相机系统（简化版）
class CameraSystem {
  focusOnTarget(target: SkillTarget): void {
    // 实现相机聚焦
  }
  
  shakeScreen(intensity: number, duration: number): void {
    // 实现屏幕震动
  }
  
  destroy(): void {
    // 销毁相机系统
  }
}

// 技能音效管理器（简化版）
class SkillSoundManager {
  playSkillSound(skillData: SkillData): void {
    // 实现技能音效播放
  }
  
  destroy(): void {
    // 销毁音效管理器
  }
}

// 生肖效果配置接口
interface ZodiacEffectConfig {
  primaryColor: string;
  secondaryColor: string;
  particleType: string;
  soundType: string;
  animationType: string;
  trailColor: string;
}

// 添加CSS动画样式
const skillStyles = document.createElement('style');
skillStyles.textContent = `
  @keyframes charging-pulse {
    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  }
  
  @keyframes portal-spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
  
  @keyframes buff-glow {
    0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  }
  
  @keyframes debuff-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
`;

document.head.appendChild(skillStyles);

export default SkillEffectAnimations;