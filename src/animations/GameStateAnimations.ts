/**
 * 游戏状态变化动画系统
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface GameStateChange {
  type: GameStateChangeType;
  previousState: any;
  newState: any;
  playerId?: string;
  data?: any;
  timestamp: number;
}

export type GameStateChangeType =
  | 'turn_change'
  | 'phase_change'
  | 'player_eliminated'
  | 'round_complete'
  | 'game_pause'
  | 'game_resume'
  | 'property_ownership_change'
  | 'money_change'
  | 'position_change'
  | 'level_up'
  | 'skill_cooldown'
  | 'status_effect_applied'
  | 'status_effect_removed'
  | 'achievement_unlocked'
  | 'game_over';

export interface StateAnimationOptions {
  duration: number;
  easing: string;
  showNotification: boolean;
  playSound: boolean;
  includeParticles: boolean;
  cameraTransition: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
}

/**
 * 游戏状态变化动画管理器
 */
export class GameStateAnimations extends EventEmitter {
  private activeAnimations = new Map<string, StateAnimation>();
  private animationQueue: QueuedAnimation[] = [];
  private isProcessingQueue = false;
  private notificationSystem: NotificationSystem;
  private transitionEffects: TransitionEffects;
  private soundManager: StateAudioManager;

  constructor() {
    super();
    this.notificationSystem = new NotificationSystem();
    this.transitionEffects = new TransitionEffects();
    this.soundManager = new StateAudioManager();
  }

  /**
   * 处理游戏状态变化
   */
  async handleStateChange(
    change: GameStateChange,
    options: Partial<StateAnimationOptions> = {}
  ): Promise<void> {
    const animationOptions: StateAnimationOptions = {
      duration: 1000,
      easing: 'ease-out',
      showNotification: true,
      playSound: true,
      includeParticles: false,
      cameraTransition: false,
      priority: 'medium',
      ...options
    };

    const animationId = `state_${change.type}_${Date.now()}`;

    try {
      this.emit('stateAnimationStarted', { change, animationId });

      // 根据状态变化类型执行对应动画
      await this.executeStateAnimation(change, animationOptions);

      this.emit('stateAnimationCompleted', { change, animationId });

    } catch (error) {
      this.emit('stateAnimationFailed', { change, animationId, error });
      throw error;
    }
  }

  /**
   * 执行状态动画
   */
  private async executeStateAnimation(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    switch (change.type) {
      case 'turn_change':
        await this.animateTurnChange(change, options);
        break;
      case 'phase_change':
        await this.animatePhaseChange(change, options);
        break;
      case 'player_eliminated':
        await this.animatePlayerElimination(change, options);
        break;
      case 'round_complete':
        await this.animateRoundComplete(change, options);
        break;
      case 'game_pause':
        await this.animateGamePause(change, options);
        break;
      case 'game_resume':
        await this.animateGameResume(change, options);
        break;
      case 'property_ownership_change':
        await this.animatePropertyOwnershipChange(change, options);
        break;
      case 'money_change':
        await this.animateMoneyChange(change, options);
        break;
      case 'position_change':
        await this.animatePositionChange(change, options);
        break;
      case 'level_up':
        await this.animateLevelUp(change, options);
        break;
      case 'skill_cooldown':
        await this.animateSkillCooldown(change, options);
        break;
      case 'status_effect_applied':
        await this.animateStatusEffectApplied(change, options);
        break;
      case 'status_effect_removed':
        await this.animateStatusEffectRemoved(change, options);
        break;
      case 'achievement_unlocked':
        await this.animateAchievementUnlocked(change, options);
        break;
      case 'game_over':
        await this.animateGameOver(change, options);
        break;
    }
  }

  /**
   * 回合变化动画
   */
  private async animateTurnChange(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { playerId } = change;
    if (!playerId) return;

    // 播放音效
    if (options.playSound) {
      this.soundManager.playTurnChange();
    }

    // 显示通知
    if (options.showNotification) {
      const playerName = this.getPlayerName(playerId);
      this.notificationSystem.show({
        title: '轮到你了！',
        message: `${playerName}的回合`,
        type: 'info',
        icon: '🎯',
        position: 'top',
        duration: 2000
      });
    }

    // 高亮当前玩家
    await this.highlightCurrentPlayer(playerId, options.duration);

    // 相机聚焦
    if (options.cameraTransition) {
      this.transitionEffects.focusOnPlayer(playerId);
    }
  }

  /**
   * 阶段变化动画
   */
  private async animatePhaseChange(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { newState } = change;
    const phaseName = this.getPhaseDisplayName(newState);

    // 阶段指示器更新
    await this.updatePhaseIndicator(newState, options.duration);

    // 显示阶段通知
    if (options.showNotification && phaseName) {
      this.notificationSystem.show({
        title: '游戏阶段',
        message: phaseName,
        type: 'info',
        position: 'center',
        duration: 1500
      });
    }

    // 播放阶段音效
    if (options.playSound) {
      this.soundManager.playPhaseChange(newState);
    }
  }

  /**
   * 玩家淘汰动画
   */
  private async animatePlayerElimination(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { playerId } = change;
    if (!playerId) return;

    const playerName = this.getPlayerName(playerId);
    const playerElement = this.getPlayerElement(playerId);

    // 淘汰音效
    if (options.playSound) {
      this.soundManager.playPlayerEliminated();
    }

    // 显示淘汰通知
    if (options.showNotification) {
      this.notificationSystem.show({
        title: '玩家淘汰',
        message: `${playerName}已被淘汰`,
        type: 'warning',
        icon: '💥',
        position: 'center',
        duration: 3000
      });
    }

    // 玩家消失动画
    if (playerElement) {
      await this.animatePlayerFadeOut(playerElement, options.duration);
    }

    // 粒子效果
    if (options.includeParticles) {
      this.createEliminationParticles(playerElement);
    }
  }

  /**
   * 回合完成动画
   */
  private async animateRoundComplete(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { data } = change;
    const roundNumber = data?.roundNumber || 0;

    // 回合完成音效
    if (options.playSound) {
      this.soundManager.playRoundComplete();
    }

    // 显示回合完成通知
    if (options.showNotification) {
      this.notificationSystem.show({
        title: '回合结束',
        message: `第${roundNumber}回合完成`,
        type: 'success',
        icon: '🎉',
        position: 'top',
        duration: 2000
      });
    }

    // 全屏闪烁效果
    await this.createRoundCompleteFlash();

    // 更新回合计数器
    await this.updateRoundCounter(roundNumber);
  }

  /**
   * 游戏暂停动画
   */
  private async animateGamePause(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    // 暂停所有动画
    this.pauseAllAnimations();

    // 显示暂停遮罩
    await this.showPauseOverlay();

    // 播放暂停音效
    if (options.playSound) {
      this.soundManager.playGamePaused();
    }

    // 显示暂停通知
    if (options.showNotification) {
      this.notificationSystem.show({
        title: '游戏暂停',
        message: '游戏已暂停',
        type: 'info',
        icon: '⏸️',
        position: 'center',
        duration: 1000
      });
    }
  }

  /**
   * 游戏恢复动画
   */
  private async animateGameResume(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    // 隐藏暂停遮罩
    await this.hidePauseOverlay();

    // 恢复所有动画
    this.resumeAllAnimations();

    // 播放恢复音效
    if (options.playSound) {
      this.soundManager.playGameResumed();
    }

    // 显示恢复通知
    if (options.showNotification) {
      this.notificationSystem.show({
        title: '游戏继续',
        message: '游戏已恢复',
        type: 'success',
        icon: '▶️',
        position: 'center',
        duration: 1000
      });
    }
  }

  /**
   * 属性所有权变化动画
   */
  private async animatePropertyOwnershipChange(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { data } = change;
    const { propertyId, newOwnerId, previousOwnerId } = data;

    const propertyElement = this.getPropertyElement(propertyId);
    if (!propertyElement) return;

    // 所有权转移音效
    if (options.playSound) {
      this.soundManager.playPropertyOwnershipChange();
    }

    // 更新属性外观
    await this.updatePropertyOwnershipVisual(propertyElement, newOwnerId, previousOwnerId);

    // 显示通知
    if (options.showNotification) {
      const newOwnerName = this.getPlayerName(newOwnerId);
      const propertyName = this.getPropertyName(propertyId);
      
      this.notificationSystem.show({
        title: '属性转移',
        message: `${propertyName}现在属于${newOwnerName}`,
        type: 'info',
        icon: '🏠',
        duration: 2000
      });
    }
  }

  /**
   * 金钱变化动画
   */
  private async animateMoneyChange(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { playerId, previousState, newState } = change;
    if (!playerId) return;

    const difference = newState - previousState;
    const playerElement = this.getPlayerElement(playerId);

    // 金钱变化音效
    if (options.playSound) {
      if (difference > 0) {
        this.soundManager.playMoneyGain();
      } else {
        this.soundManager.playMoneyLoss();
      }
    }

    // 显示金钱变化动画
    if (playerElement) {
      await this.showMoneyChangeEffect(playerElement, difference);
    }

    // 更新金钱显示
    await this.updateMoneyDisplay(playerId, newState);
  }

  /**
   * 位置变化动画
   */
  private async animatePositionChange(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { playerId, previousState, newState } = change;
    if (!playerId) return;

    // 这个动画通常由PlayerMovementAnimations处理
    // 这里只处理辅助效果

    // 位置变化音效
    if (options.playSound) {
      this.soundManager.playPositionChange();
    }

    // 更新位置显示
    await this.updatePositionDisplay(playerId, newState);
  }

  /**
   * 等级提升动画
   */
  private async animateLevelUp(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { playerId, newState } = change;
    if (!playerId) return;

    const playerElement = this.getPlayerElement(playerId);
    const playerName = this.getPlayerName(playerId);

    // 升级音效
    if (options.playSound) {
      this.soundManager.playLevelUp();
    }

    // 显示升级通知
    if (options.showNotification) {
      this.notificationSystem.show({
        title: '等级提升！',
        message: `${playerName}升到了${newState}级`,
        type: 'success',
        icon: '⭐',
        position: 'center',
        duration: 3000
      });
    }

    // 升级特效
    if (playerElement) {
      await this.createLevelUpEffect(playerElement);
    }

    // 粒子效果
    if (options.includeParticles) {
      this.createLevelUpParticles(playerElement);
    }
  }

  /**
   * 技能冷却动画
   */
  private async animateSkillCooldown(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { data } = change;
    const { skillId, cooldownTime, playerId } = data;

    const skillElement = this.getSkillElement(skillId, playerId);
    if (!skillElement) return;

    // 开始冷却计时动画
    await this.startCooldownTimer(skillElement, cooldownTime);

    // 播放冷却音效
    if (options.playSound) {
      this.soundManager.playSkillCooldown();
    }
  }

  /**
   * 状态效果应用动画
   */
  private async animateStatusEffectApplied(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { playerId, data } = change;
    const { effectType, effectName } = data;

    const playerElement = this.getPlayerElement(playerId);
    if (!playerElement) return;

    // 添加状态效果标识
    await this.addStatusEffectVisual(playerElement, effectType, effectName);

    // 播放状态效果音效
    if (options.playSound) {
      this.soundManager.playStatusEffectApplied(effectType);
    }

    // 显示通知
    if (options.showNotification) {
      const playerName = this.getPlayerName(playerId);
      this.notificationSystem.show({
        title: '状态效果',
        message: `${playerName}获得了${effectName}`,
        type: 'info',
        duration: 2000
      });
    }
  }

  /**
   * 状态效果移除动画
   */
  private async animateStatusEffectRemoved(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { playerId, data } = change;
    const { effectType, effectName } = data;

    const playerElement = this.getPlayerElement(playerId);
    if (!playerElement) return;

    // 移除状态效果标识
    await this.removeStatusEffectVisual(playerElement, effectType);

    // 播放移除音效
    if (options.playSound) {
      this.soundManager.playStatusEffectRemoved();
    }
  }

  /**
   * 成就解锁动画
   */
  private async animateAchievementUnlocked(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { data } = change;
    const { achievementName, achievementIcon, playerId } = data;

    // 成就解锁音效
    if (options.playSound) {
      this.soundManager.playAchievementUnlocked();
    }

    // 显示成就通知
    if (options.showNotification) {
      const playerName = this.getPlayerName(playerId);
      this.notificationSystem.show({
        title: '成就解锁！',
        message: `${playerName}解锁了"${achievementName}"`,
        type: 'success',
        icon: achievementIcon || '🏆',
        position: 'center',
        duration: 4000
      });
    }

    // 全屏庆祝效果
    await this.createAchievementCelebration();

    // 粒子效果
    if (options.includeParticles) {
      this.createAchievementParticles();
    }
  }

  /**
   * 游戏结束动画
   */
  private async animateGameOver(
    change: GameStateChange,
    options: StateAnimationOptions
  ): Promise<void> {
    const { data } = change;
    const { winnerId, gameResult } = data;

    // 游戏结束音效
    if (options.playSound) {
      this.soundManager.playGameOver(gameResult);
    }

    // 显示游戏结束通知
    if (options.showNotification) {
      const winnerName = this.getPlayerName(winnerId);
      this.notificationSystem.show({
        title: '游戏结束',
        message: `恭喜${winnerName}获得胜利！`,
        type: 'success',
        icon: '👑',
        position: 'center',
        duration: 5000
      });
    }

    // 游戏结束特效序列
    await this.playGameOverSequence(winnerId, gameResult);
  }

  /**
   * 高亮当前玩家
   */
  private async highlightCurrentPlayer(playerId: string, duration: number): Promise<void> {
    const playerElement = this.getPlayerElement(playerId);
    if (!playerElement) return;

    // 移除其他玩家的高亮
    this.clearAllPlayerHighlights();

    // 添加当前玩家高亮
    playerElement.classList.add('current-player');
    
    // 脉冲动画
    return new Promise(resolve => {
      playerElement.animate([
        { transform: 'scale(1)', boxShadow: '0 0 0 rgba(255, 215, 0, 0)' },
        { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)' },
        { transform: 'scale(1)', boxShadow: '0 0 0 rgba(255, 215, 0, 0)' }
      ], {
        duration: duration,
        easing: 'ease-in-out',
        iterations: 2
      }).addEventListener('finish', () => resolve());
    });
  }

  /**
   * 更新阶段指示器
   */
  private async updatePhaseIndicator(phase: string, duration: number): Promise<void> {
    const phaseIndicator = document.querySelector('.phase-indicator');
    if (!phaseIndicator) return;

    const phaseText = phaseIndicator.querySelector('.phase-text') as HTMLElement;
    if (phaseText) {
      // 淡出旧文本
      await new Promise<void>(resolve => {
        phaseText.animate([
          { opacity: 1 },
          { opacity: 0 }
        ], {
          duration: duration / 2,
          fill: 'forwards'
        }).addEventListener('finish', () => resolve());
      });

      // 更新文本
      phaseText.textContent = this.getPhaseDisplayName(phase);

      // 淡入新文本
      return new Promise<void>(resolve => {
        phaseText.animate([
          { opacity: 0 },
          { opacity: 1 }
        ], {
          duration: duration / 2,
          fill: 'forwards'
        }).addEventListener('finish', () => resolve());
      });
    }
  }

  /**
   * 玩家消失动画
   */
  private async animatePlayerFadeOut(element: HTMLElement, duration: number): Promise<void> {
    return new Promise(resolve => {
      element.animate([
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.8)' }
      ], {
        duration,
        easing: 'ease-in',
        fill: 'forwards'
      }).addEventListener('finish', () => {
        element.classList.add('eliminated');
        resolve();
      });
    });
  }

  /**
   * 创建回合完成闪烁
   */
  private async createRoundCompleteFlash(): Promise<void> {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 255, 255, 0.3);
      pointer-events: none;
      z-index: 9999;
    `;

    document.body.appendChild(flash);

    return new Promise(resolve => {
      flash.animate([
        { opacity: 0 },
        { opacity: 1 },
        { opacity: 0 }
      ], {
        duration: 500,
        easing: 'ease-in-out'
      }).addEventListener('finish', () => {
        document.body.removeChild(flash);
        resolve();
      });
    });
  }

  /**
   * 显示暂停遮罩
   */
  private async showPauseOverlay(): Promise<void> {
    const overlay = document.createElement('div');
    overlay.id = 'pause-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;

    const pauseText = document.createElement('div');
    pauseText.style.cssText = `
      color: white;
      font-size: 48px;
      font-weight: bold;
      text-align: center;
    `;
    pauseText.textContent = '⏸️ 游戏暂停';

    overlay.appendChild(pauseText);
    document.body.appendChild(overlay);

    return new Promise(resolve => {
      overlay.animate([
        { opacity: 0 },
        { opacity: 1 }
      ], {
        duration: 300,
        fill: 'forwards'
      }).addEventListener('finish', () => resolve());
    });
  }

  /**
   * 隐藏暂停遮罩
   */
  private async hidePauseOverlay(): Promise<void> {
    const overlay = document.getElementById('pause-overlay');
    if (!overlay) return;

    return new Promise(resolve => {
      overlay.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], {
        duration: 300,
        fill: 'forwards'
      }).addEventListener('finish', () => {
        document.body.removeChild(overlay);
        resolve();
      });
    });
  }

  /**
   * 显示金钱变化效果
   */
  private async showMoneyChangeEffect(element: HTMLElement, difference: number): Promise<void> {
    const changeText = document.createElement('div');
    changeText.style.cssText = `
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      color: ${difference > 0 ? '#00FF00' : '#FF0000'};
      font-size: 18px;
      font-weight: bold;
      pointer-events: none;
      z-index: 1000;
    `;
    changeText.textContent = `${difference > 0 ? '+' : ''}${difference}`;

    element.appendChild(changeText);

    return new Promise(resolve => {
      changeText.animate([
        { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
        { opacity: 0, transform: 'translateX(-50%) translateY(-50px)' }
      ], {
        duration: 1500,
        easing: 'ease-out'
      }).addEventListener('finish', () => {
        element.removeChild(changeText);
        resolve();
      });
    });
  }

  /**
   * 创建升级特效
   */
  private async createLevelUpEffect(element: HTMLElement): Promise<void> {
    const effect = document.createElement('div');
    effect.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, #FFD700, transparent);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
      z-index: 999;
    `;

    element.appendChild(effect);

    return new Promise(resolve => {
      effect.animate([
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(2)', opacity: 0 }
      ], {
        duration: 1000,
        easing: 'ease-out'
      }).addEventListener('finish', () => {
        element.removeChild(effect);
        resolve();
      });
    });
  }

  // 辅助方法
  private getPlayerName(playerId: string): string {
    // 从游戏状态获取玩家名称
    return `玩家${playerId}`;
  }

  private getPlayerElement(playerId: string): HTMLElement | null {
    return document.querySelector(`[data-player-id="${playerId}"]`);
  }

  private getPropertyElement(propertyId: string): HTMLElement | null {
    return document.querySelector(`[data-property-id="${propertyId}"]`);
  }

  private getSkillElement(skillId: string, playerId: string): HTMLElement | null {
    return document.querySelector(`[data-skill-id="${skillId}"][data-player-id="${playerId}"]`);
  }

  private getPropertyName(propertyId: string): string {
    return `属性${propertyId}`;
  }

  private getPhaseDisplayName(phase: string): string {
    const phaseNames: { [key: string]: string } = {
      'roll_dice': '投掷骰子',
      'move': '移动',
      'action': '行动阶段',
      'end_turn': '回合结束'
    };
    return phaseNames[phase] || phase;
  }

  private clearAllPlayerHighlights(): void {
    const players = document.querySelectorAll('.player');
    players.forEach(player => {
      player.classList.remove('current-player');
    });
  }

  private pauseAllAnimations(): void {
    // 暂停所有CSS动画
    document.body.style.animationPlayState = 'paused';
  }

  private resumeAllAnimations(): void {
    // 恢复所有CSS动画
    document.body.style.animationPlayState = 'running';
  }

  private async updatePropertyOwnershipVisual(
    element: HTMLElement,
    newOwnerId: string,
    previousOwnerId?: string
  ): Promise<void> {
    // 更新属性的视觉所有权标识
    if (previousOwnerId) {
      element.classList.remove(`owner-${previousOwnerId}`);
    }
    element.classList.add(`owner-${newOwnerId}`);
  }

  private async updateMoneyDisplay(playerId: string, newAmount: number): Promise<void> {
    const moneyElement = document.querySelector(`[data-player-id="${playerId}"] .money-display`);
    if (moneyElement) {
      moneyElement.textContent = `$${newAmount}`;
    }
  }

  private async updatePositionDisplay(playerId: string, newPosition: number): Promise<void> {
    const positionElement = document.querySelector(`[data-player-id="${playerId}"] .position-display`);
    if (positionElement) {
      positionElement.textContent = `位置: ${newPosition}`;
    }
  }

  private async updateRoundCounter(roundNumber: number): Promise<void> {
    const roundCounter = document.querySelector('.round-counter');
    if (roundCounter) {
      roundCounter.textContent = `回合: ${roundNumber}`;
    }
  }

  private async startCooldownTimer(element: HTMLElement, cooldownTime: number): Promise<void> {
    // 在技能按钮上显示冷却计时
    element.classList.add('on-cooldown');
    
    const timer = document.createElement('div');
    timer.className = 'cooldown-timer';
    timer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      font-size: 14px;
      pointer-events: none;
    `;

    element.appendChild(timer);

    const startTime = Date.now();
    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, cooldownTime - elapsed);
      
      if (remaining > 0) {
        timer.textContent = Math.ceil(remaining / 1000).toString();
        requestAnimationFrame(updateTimer);
      } else {
        element.classList.remove('on-cooldown');
        element.removeChild(timer);
      }
    };

    updateTimer();
  }

  private async addStatusEffectVisual(
    element: HTMLElement,
    effectType: string,
    effectName: string
  ): Promise<void> {
    const statusContainer = element.querySelector('.status-effects') || 
      (() => {
        const container = document.createElement('div');
        container.className = 'status-effects';
        container.style.cssText = `
          position: absolute;
          top: -20px;
          left: 0;
          display: flex;
          gap: 4px;
        `;
        element.appendChild(container);
        return container;
      })();

    const statusIcon = document.createElement('div');
    statusIcon.className = `status-effect status-${effectType}`;
    statusIcon.style.cssText = `
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${this.getStatusEffectColor(effectType)};
      border: 1px solid white;
    `;
    statusIcon.title = effectName;

    statusContainer.appendChild(statusIcon);
  }

  private async removeStatusEffectVisual(element: HTMLElement, effectType: string): Promise<void> {
    const statusEffect = element.querySelector(`.status-${effectType}`);
    if (statusEffect) {
      statusEffect.remove();
    }
  }

  private getStatusEffectColor(effectType: string): string {
    const colors: { [key: string]: string } = {
      'buff': '#00FF00',
      'debuff': '#FF0000',
      'neutral': '#FFFF00'
    };
    return colors[effectType] || '#CCCCCC';
  }

  private createEliminationParticles(element: HTMLElement | null): void {
    // 创建淘汰粒子效果
  }

  private createLevelUpParticles(element: HTMLElement | null): void {
    // 创建升级粒子效果
  }

  private async createAchievementCelebration(): Promise<void> {
    // 创建成就庆祝效果
  }

  private createAchievementParticles(): void {
    // 创建成就粒子效果
  }

  private async playGameOverSequence(winnerId: string, gameResult: string): Promise<void> {
    // 播放游戏结束序列动画
  }

  /**
   * 停止所有状态动画
   */
  stopAllAnimations(): void {
    this.activeAnimations.forEach(animation => animation.stop());
    this.activeAnimations.clear();
  }

  /**
   * 销毁动画系统
   */
  destroy(): void {
    this.stopAllAnimations();
    this.notificationSystem.destroy();
    this.transitionEffects.destroy();
    this.soundManager.destroy();
    this.removeAllListeners();
  }
}

// 辅助类定义
abstract class StateAnimation {
  abstract stop(): void;
}

interface QueuedAnimation {
  change: GameStateChange;
  options: StateAnimationOptions;
  priority: number;
}

class NotificationSystem {
  show(notification: NotificationData): void {
    // 实现通知显示
  }

  destroy(): void {
    // 销毁通知系统
  }
}

class TransitionEffects {
  focusOnPlayer(playerId: string): void {
    // 实现相机聚焦
  }

  destroy(): void {
    // 销毁过渡效果
  }
}

class StateAudioManager {
  playTurnChange(): void { /* 实现音效 */ }
  playPhaseChange(phase: string): void { /* 实现音效 */ }
  playPlayerEliminated(): void { /* 实现音效 */ }
  playRoundComplete(): void { /* 实现音效 */ }
  playGamePaused(): void { /* 实现音效 */ }
  playGameResumed(): void { /* 实现音效 */ }
  playPropertyOwnershipChange(): void { /* 实现音效 */ }
  playMoneyGain(): void { /* 实现音效 */ }
  playMoneyLoss(): void { /* 实现音效 */ }
  playPositionChange(): void { /* 实现音效 */ }
  playLevelUp(): void { /* 实现音效 */ }
  playSkillCooldown(): void { /* 实现音效 */ }
  playStatusEffectApplied(effectType: string): void { /* 实现音效 */ }
  playStatusEffectRemoved(): void { /* 实现音效 */ }
  playAchievementUnlocked(): void { /* 实现音效 */ }
  playGameOver(result: string): void { /* 实现音效 */ }

  destroy(): void {
    // 销毁音效管理器
  }
}

export default GameStateAnimations;