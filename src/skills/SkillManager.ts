/**
 * 技能管理器实现
 * 第二阶段 Day 1: 技能系统架构
 * 
 * 实现技能系统的核心管理器，负责：
 * - 技能学习和遗忘
 * - 技能使用和效果处理
 * - 冷却时间管理
 * - 技能升级系统
 * - 组合技能处理
 */

import type { ZodiacSign, Player, GameState, ActionResult } from '../types/game';
import {
  ISkillSystem,
  SkillDefinition,
  PlayerSkillInstance,
  SkillEffect,
  SkillEnhancement,
  SkillCategory,
  SkillRarity,
  SkillEffectType,
  SkillTargetType,
  SkillConditionType,
  SkillSystemEvent,
  SkillSystemEventType,
  SkillStatistics,
  SkillCondition
} from './SkillSystemArchitecture';
import { SkillRegistry, ZODIAC_SKILL_TRAITS, SKILL_BALANCE_CONFIG } from './SkillDataStructures';

/**
 * 技能管理器核心实现
 */
export class SkillManager implements ISkillSystem {
  private skillRegistry: SkillRegistry;
  private playerSkills: Map<string, PlayerSkillInstance[]> = new Map();
  private skillCooldowns: Map<string, Map<string, number>> = new Map();
  private skillStatistics: Map<string, Map<string, SkillStatistics>> = new Map();
  private eventListeners: ((event: SkillSystemEvent) => void)[] = [];

  constructor() {
    this.skillRegistry = SkillRegistry.getInstance();
    this.initializeSkillSystem();
  }

  // ============================================================================
  // 初始化和配置
  // ============================================================================

  private initializeSkillSystem(): void {
    console.log('🎯 技能系统初始化开始...');
    
    // 初始化数据结构
    this.playerSkills.clear();
    this.skillCooldowns.clear();
    this.skillStatistics.clear();
    
    console.log('✅ 技能系统初始化完成');
  }

  /**
   * 为玩家初始化技能系统
   */
  public initializePlayerSkills(playerId: string, zodiac: ZodiacSign): void {
    if (!this.playerSkills.has(playerId)) {
      this.playerSkills.set(playerId, []);
      this.skillCooldowns.set(playerId, new Map());
      this.skillStatistics.set(playerId, new Map());
      
      // 根据生肖自动学习基础技能
      this.learnZodiacBasicSkills(playerId, zodiac);
    }
  }

  private learnZodiacBasicSkills(playerId: string, zodiac: ZodiacSign): void {
    const zodiacSkills = this.skillRegistry.getSkillsByZodiac(zodiac)
      .filter(skill => skill.rarity === SkillRarity.COMMON);
    
    zodiacSkills.forEach(skill => {
      this.learnSkill(playerId, skill.id);
    });
  }

  // ============================================================================
  // 技能定义管理
  // ============================================================================

  public registerSkillDefinition(definition: SkillDefinition): void {
    this.skillRegistry.registerSkill(definition);
    this.emitEvent({
      type: SkillSystemEventType.SKILL_LEARNED,
      playerId: 'system',
      skillId: definition.id,
      timestamp: Date.now(),
      data: { definition }
    });
  }

  public getSkillDefinition(skillId: string): SkillDefinition | null {
    return this.skillRegistry.getSkill(skillId) || null;
  }

  public getAllSkillDefinitions(): SkillDefinition[] {
    return this.skillRegistry.getAllSkills();
  }

  public getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
    return this.skillRegistry.getSkillsByCategory(category);
  }

  public getSkillsByZodiac(zodiac: ZodiacSign): SkillDefinition[] {
    return this.skillRegistry.getSkillsByZodiac(zodiac);
  }

  // ============================================================================
  // 玩家技能管理
  // ============================================================================

  public learnSkill(playerId: string, skillId: string): boolean {
    const skillDef = this.getSkillDefinition(skillId);
    if (!skillDef) {
      console.warn(`技能定义不存在: ${skillId}`);
      return false;
    }

    const playerSkills = this.playerSkills.get(playerId) || [];
    
    // 检查是否已经学会该技能
    if (playerSkills.some(skill => skill.definitionId === skillId)) {
      console.warn(`玩家 ${playerId} 已经学会技能 ${skillId}`);
      return false;
    }

    // 检查学习条件
    if (!this.checkLearnRequirements(playerId, skillDef)) {
      console.warn(`玩家 ${playerId} 不满足学习技能 ${skillId} 的条件`);
      return false;
    }

    // 创建技能实例
    const skillInstance: PlayerSkillInstance = {
      definitionId: skillId,
      playerId: playerId,
      level: 1,
      experience: 0,
      usageCount: 0,
      isActive: skillDef.category.includes('passive'),
      isCooldown: false,
      remainingCooldown: 0,
      statistics: {
        timesUsed: 0,
        totalDamage: 0,
        totalHealing: 0,
        criticalHits: 0,
        targetHits: 0,
        comboTriggers: 0,
        experienceGained: 0
      }
    };

    playerSkills.push(skillInstance);
    this.playerSkills.set(playerId, playerSkills);

    // 初始化技能统计
    const playerStats = this.skillStatistics.get(playerId) || new Map();
    playerStats.set(skillId, skillInstance.statistics);
    this.skillStatistics.set(playerId, playerStats);

    this.emitEvent({
      type: SkillSystemEventType.SKILL_LEARNED,
      playerId,
      skillId,
      timestamp: Date.now(),
      data: { skillInstance }
    });

    console.log(`✅ 玩家 ${playerId} 学会了技能 ${skillDef.name}`);
    return true;
  }

  public forgetSkill(playerId: string, skillId: string): boolean {
    const playerSkills = this.playerSkills.get(playerId) || [];
    const skillIndex = playerSkills.findIndex(skill => skill.definitionId === skillId);
    
    if (skillIndex === -1) {
      console.warn(`玩家 ${playerId} 没有技能 ${skillId}`);
      return false;
    }

    playerSkills.splice(skillIndex, 1);
    this.playerSkills.set(playerId, playerSkills);

    // 清理相关数据
    const playerCooldowns = this.skillCooldowns.get(playerId);
    if (playerCooldowns) {
      playerCooldowns.delete(skillId);
    }

    const playerStats = this.skillStatistics.get(playerId);
    if (playerStats) {
      playerStats.delete(skillId);
    }

    console.log(`🗑️ 玩家 ${playerId} 遗忘了技能 ${skillId}`);
    return true;
  }

  public getPlayerSkills(playerId: string): PlayerSkillInstance[] {
    return this.playerSkills.get(playerId) || [];
  }

  public getAvailableSkills(playerId: string, gameState: GameState): PlayerSkillInstance[] {
    const allSkills = this.getPlayerSkills(playerId);
    return allSkills.filter(skill => this.canUseSkill(playerId, skill.definitionId, gameState));
  }

  // ============================================================================
  // 技能使用
  // ============================================================================

  public canUseSkill(playerId: string, skillId: string, gameState: GameState): boolean {
    const skillInstance = this.getPlayerSkill(playerId, skillId);
    if (!skillInstance) return false;

    const skillDef = this.getSkillDefinition(skillId);
    if (!skillDef) return false;

    // 检查冷却时间
    if (skillInstance.isCooldown || skillInstance.remainingCooldown > 0) {
      return false;
    }

    // 检查资源消耗
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    if (skillDef.moneyCost && player.money < skillDef.moneyCost) {
      return false;
    }

    if (skillDef.energyCost) {
      // TODO: 实现能量系统检查
    }

    // 检查技能条件
    if (skillDef.effects.some(effect => effect.conditions && 
        !this.checkSkillConditions(effect.conditions, player, gameState))) {
      return false;
    }

    return true;
  }

  public async useSkill(
    playerId: string, 
    skillId: string, 
    targets: string[], 
    gameState: GameState
  ): Promise<ActionResult> {
    if (!this.canUseSkill(playerId, skillId, gameState)) {
      return {
        success: false,
        message: '无法使用该技能',
        effects: []
      };
    }

    const skillInstance = this.getPlayerSkill(playerId, skillId);
    const skillDef = this.getSkillDefinition(skillId);
    
    if (!skillInstance || !skillDef) {
      return {
        success: false,
        message: '技能不存在',
        effects: []
      };
    }

    try {
      // 消耗资源
      await this.consumeSkillCosts(playerId, skillDef, gameState);

      // 设置冷却
      this.setCooldown(playerId, skillId, skillDef.cooldown);

      // 应用技能效果
      const result = await this.applySkillEffects(
        skillDef.effects, 
        playerId, 
        targets, 
        gameState, 
        skillInstance.level
      );

      // 更新统计信息
      this.updateSkillStatistics(playerId, skillId, result);

      // 获得经验值
      this.gainExperience(playerId, skillId, this.calculateExperienceGain(skillDef, result));

      this.emitEvent({
        type: SkillSystemEventType.SKILL_USED,
        playerId,
        skillId,
        timestamp: Date.now(),
        data: { targets, result }
      });

      console.log(`⚡ 玩家 ${playerId} 使用了技能 ${skillDef.name}`);
      
      return {
        ...result,
        success: true,
        message: `成功使用技能 ${skillDef.name}`
      };

    } catch (error) {
      console.error(`技能使用失败:`, error);
      return {
        success: false,
        message: `技能使用失败: ${error}`,
        effects: []
      };
    }
  }

  // ============================================================================
  // 技能效果处理
  // ============================================================================

  public async applySkillEffects(
    effects: SkillEffect[], 
    casterId: string,
    targets: string[],
    gameState: GameState,
    skillLevel: number = 1
  ): Promise<ActionResult> {
    const appliedEffects: any[] = [];
    let success = true;
    let message = '';

    for (const effect of effects) {
      try {
        const effectResult = await this.applySingleEffect(
          effect, 
          casterId, 
          targets, 
          gameState, 
          skillLevel
        );
        
        appliedEffects.push(...effectResult.effects);
        
        if (!effectResult.success) {
          success = false;
          message += effectResult.message + ' ';
        }
        
      } catch (error) {
        console.error(`应用技能效果失败:`, error);
        success = false;
        message += `效果应用失败: ${error} `;
      }
    }

    return {
      success,
      message: message.trim() || '技能效果已应用',
      effects: appliedEffects
    };
  }

  private async applySingleEffect(
    effect: SkillEffect,
    casterId: string,
    targets: string[],
    gameState: GameState,
    skillLevel: number
  ): Promise<ActionResult> {
    const effectTargets = this.resolveEffectTargets(effect, casterId, targets, gameState);
    const scaledValue = this.scaleEffectValue(effect, skillLevel);

    switch (effect.type) {
      case SkillEffectType.MONEY_GAIN:
        return this.applyMoneyEffect(effectTargets, scaledValue, gameState);
      
      case SkillEffectType.MONEY_STEAL:
        return this.applyMoneyStealEffect(casterId, effectTargets, scaledValue, gameState);
      
      case SkillEffectType.POSITION_MOVE:
        return this.applyPositionMoveEffect(effectTargets, scaledValue, gameState);
      
      case SkillEffectType.POSITION_TELEPORT:
        return this.applyTeleportEffect(effectTargets, targets, gameState);
      
      case SkillEffectType.DICE_REROLL:
        return this.applyDiceRerollEffect(effectTargets, gameState);
      
      case SkillEffectType.DICE_CONTROL:
        return this.applyDiceControlEffect(effectTargets, scaledValue, gameState);
      
      case SkillEffectType.STATUS_BUFF:
        return this.applyStatusEffect(effectTargets, effect, scaledValue, gameState, true);
      
      case SkillEffectType.STATUS_DEBUFF:
        return this.applyStatusEffect(effectTargets, effect, scaledValue, gameState, false);
      
      case SkillEffectType.SKILL_COOLDOWN_REDUCE:
        return this.applyCooldownReductionEffect(effectTargets, scaledValue);
      
      default:
        return {
          success: true,
          message: `未实现的效果类型: ${effect.type}`,
          effects: []
        };
    }
  }

  public calculateSkillDamage(
    effect: SkillEffect, 
    level: number, 
    enhancements: SkillEnhancement[]
  ): number {
    let baseValue = typeof effect.value === 'number' ? effect.value : 0;
    
    // 等级缩放
    if (effect.modifiers?.scaling) {
      baseValue *= Math.pow(effect.modifiers.scaling, level - 1);
    }

    // 增强效果
    let enhancementMultiplier = 1.0;
    enhancements.forEach(enhancement => {
      if (enhancement.type === 'effect_power') {
        enhancementMultiplier += enhancement.modifier;
      }
    });
    
    baseValue *= enhancementMultiplier;

    // 随机性
    if (effect.modifiers?.randomness) {
      const randomFactor = 1 + (Math.random() - 0.5) * effect.modifiers.randomness;
      baseValue *= randomFactor;
    }

    // 暴击
    if (effect.modifiers?.criticalChance && Math.random() < effect.modifiers.criticalChance) {
      baseValue *= 2.0;
    }

    return Math.round(baseValue);
  }

  // ============================================================================
  // 冷却系统
  // ============================================================================

  public updateCooldowns(playerId: string): void {
    const playerCooldowns = this.skillCooldowns.get(playerId);
    if (!playerCooldowns) return;

    const playerSkills = this.getPlayerSkills(playerId);
    
    playerCooldowns.forEach((cooldown, skillId) => {
      if (cooldown > 0) {
        const newCooldown = cooldown - 1;
        playerCooldowns.set(skillId, newCooldown);
        
        // 更新技能实例状态
        const skillInstance = playerSkills.find(s => s.definitionId === skillId);
        if (skillInstance) {
          skillInstance.remainingCooldown = newCooldown;
          skillInstance.isCooldown = newCooldown > 0;
          
          if (newCooldown === 0) {
            this.emitEvent({
              type: SkillSystemEventType.COOLDOWN_FINISHED,
              playerId,
              skillId,
              timestamp: Date.now()
            });
          }
        }
      }
    });
  }

  public reduceCooldown(playerId: string, skillId: string, amount: number): void {
    const playerCooldowns = this.skillCooldowns.get(playerId);
    if (!playerCooldowns) return;

    const currentCooldown = playerCooldowns.get(skillId) || 0;
    const newCooldown = Math.max(0, currentCooldown - amount);
    playerCooldowns.set(skillId, newCooldown);

    // 更新技能实例
    const skillInstance = this.getPlayerSkill(playerId, skillId);
    if (skillInstance) {
      skillInstance.remainingCooldown = newCooldown;
      skillInstance.isCooldown = newCooldown > 0;
    }
  }

  private setCooldown(playerId: string, skillId: string, cooldown: number): void {
    let playerCooldowns = this.skillCooldowns.get(playerId);
    if (!playerCooldowns) {
      playerCooldowns = new Map();
      this.skillCooldowns.set(playerId, playerCooldowns);
    }

    // 应用全局冷却修正
    const adjustedCooldown = Math.ceil(cooldown * SKILL_BALANCE_CONFIG.globalCooldownMultiplier);
    
    playerCooldowns.set(skillId, adjustedCooldown);

    // 更新技能实例
    const skillInstance = this.getPlayerSkill(playerId, skillId);
    if (skillInstance) {
      skillInstance.remainingCooldown = adjustedCooldown;
      skillInstance.isCooldown = adjustedCooldown > 0;
      skillInstance.lastUsedTurn = Date.now();
    }
  }

  // ============================================================================
  // 升级系统
  // ============================================================================

  public gainExperience(playerId: string, skillId: string, amount: number): boolean {
    const skillInstance = this.getPlayerSkill(playerId, skillId);
    const skillDef = this.getSkillDefinition(skillId);
    
    if (!skillInstance || !skillDef) return false;

    const adjustedAmount = Math.ceil(amount * SKILL_BALANCE_CONFIG.experienceGainRate);
    skillInstance.experience += adjustedAmount;
    skillInstance.statistics.experienceGained += adjustedAmount;

    // 检查是否可以升级
    const expNeededForNextLevel = this.calculateExpNeededForLevel(skillInstance.level + 1);
    if (skillInstance.experience >= expNeededForNextLevel && skillInstance.level < skillDef.maxLevel) {
      return this.levelUpSkill(playerId, skillId);
    }

    return true;
  }

  public levelUpSkill(playerId: string, skillId: string): boolean {
    const skillInstance = this.getPlayerSkill(playerId, skillId);
    const skillDef = this.getSkillDefinition(skillId);
    
    if (!skillInstance || !skillDef) return false;

    if (skillInstance.level >= skillDef.maxLevel) {
      console.warn(`技能 ${skillId} 已达到最大等级`);
      return false;
    }

    const oldLevel = skillInstance.level;
    skillInstance.level += 1;
    
    // 扣除升级所需经验
    const expNeeded = this.calculateExpNeededForLevel(skillInstance.level);
    skillInstance.experience -= expNeeded;

    this.emitEvent({
      type: SkillSystemEventType.SKILL_LEVELED_UP,
      playerId,
      skillId,
      timestamp: Date.now(),
      data: { oldLevel, newLevel: skillInstance.level }
    });

    console.log(`⬆️ 玩家 ${playerId} 的技能 ${skillDef.name} 升级到 ${skillInstance.level} 级`);
    return true;
  }

  private calculateExpNeededForLevel(level: number): number {
    // 指数增长的经验需求
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  // ============================================================================
  // 组合技能
  // ============================================================================

  public checkComboAvailability(playerId: string, skillIds: string[]): boolean {
    // 检查玩家是否拥有所有技能
    const playerSkills = this.getPlayerSkills(playerId);
    const playerSkillIds = playerSkills.map(s => s.definitionId);
    
    if (!skillIds.every(id => playerSkillIds.includes(id))) {
      return false;
    }

    // 检查技能是否都不在冷却中
    return skillIds.every(id => this.getSkillCooldown(playerId, id) === 0);
  }

  public async executeComboSkill(
    playerId: string, 
    skillIds: string[], 
    gameState: GameState
  ): Promise<ActionResult> {
    if (!this.checkComboAvailability(playerId, skillIds)) {
      return {
        success: false,
        message: '无法执行组合技能',
        effects: []
      };
    }

    // TODO: 实现完整的组合技能逻辑
    console.log(`🔥 玩家 ${playerId} 执行组合技能: ${skillIds.join(' + ')}`);
    
    return {
      success: true,
      message: '组合技能执行成功',
      effects: []
    };
  }

  // ============================================================================
  // 技能增强
  // ============================================================================

  public addSkillEnhancement(
    playerId: string, 
    skillId: string, 
    enhancement: SkillEnhancement
  ): void {
    const skillInstance = this.getPlayerSkill(playerId, skillId);
    if (!skillInstance) return;

    if (!skillInstance.enhancements) {
      skillInstance.enhancements = [];
    }

    skillInstance.enhancements.push(enhancement);

    this.emitEvent({
      type: SkillSystemEventType.SKILL_ENHANCED,
      playerId,
      skillId,
      timestamp: Date.now(),
      data: { enhancement }
    });
  }

  public removeSkillEnhancement(
    playerId: string, 
    skillId: string, 
    enhancementId: string
  ): void {
    const skillInstance = this.getPlayerSkill(playerId, skillId);
    if (!skillInstance || !skillInstance.enhancements) return;

    const index = skillInstance.enhancements.findIndex(e => e.id === enhancementId);
    if (index !== -1) {
      skillInstance.enhancements.splice(index, 1);
    }
  }

  // ============================================================================
  // 数据持久化
  // ============================================================================

  public saveSkillData(playerId: string): any {
    return {
      skills: this.playerSkills.get(playerId) || [],
      cooldowns: Object.fromEntries(this.skillCooldowns.get(playerId) || new Map()),
      statistics: Object.fromEntries(this.skillStatistics.get(playerId) || new Map())
    };
  }

  public loadSkillData(playerId: string, data: any): void {
    if (data.skills) {
      this.playerSkills.set(playerId, data.skills);
    }
    
    if (data.cooldowns) {
      this.skillCooldowns.set(playerId, new Map(Object.entries(data.cooldowns)));
    }
    
    if (data.statistics) {
      this.skillStatistics.set(playerId, new Map(Object.entries(data.statistics)));
    }
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private getPlayerSkill(playerId: string, skillId: string): PlayerSkillInstance | null {
    const playerSkills = this.getPlayerSkills(playerId);
    return playerSkills.find(skill => skill.definitionId === skillId) || null;
  }

  private getSkillCooldown(playerId: string, skillId: string): number {
    const playerCooldowns = this.skillCooldowns.get(playerId);
    return playerCooldowns?.get(skillId) || 0;
  }

  private checkLearnRequirements(playerId: string, skillDef: SkillDefinition): boolean {
    // TODO: 实现完整的学习条件检查
    return true;
  }

  private checkSkillConditions(
    conditions: SkillCondition[], 
    player: Player, 
    gameState: GameState
  ): boolean {
    return conditions.every(condition => {
      // TODO: 实现完整的条件检查逻辑
      return true;
    });
  }

  private async consumeSkillCosts(
    playerId: string, 
    skillDef: SkillDefinition, 
    gameState: GameState
  ): Promise<void> {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) throw new Error('玩家不存在');

    if (skillDef.moneyCost) {
      player.money -= skillDef.moneyCost;
    }

    // TODO: 实现能量消耗
  }

  private resolveEffectTargets(
    effect: SkillEffect,
    casterId: string,
    explicitTargets: string[],
    gameState: GameState
  ): string[] {
    switch (effect.target) {
      case SkillTargetType.SELF:
        return [casterId];
      case SkillTargetType.SINGLE_PLAYER:
        return explicitTargets.slice(0, 1);
      case SkillTargetType.ALL_PLAYERS:
        return gameState.players.map(p => p.id);
      case SkillTargetType.ALL_OTHERS:
        return gameState.players.filter(p => p.id !== casterId).map(p => p.id);
      case SkillTargetType.RANDOM_PLAYER:
        const otherPlayers = gameState.players.filter(p => p.id !== casterId);
        return otherPlayers.length > 0 ? [otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id] : [];
      default:
        return explicitTargets;
    }
  }

  private scaleEffectValue(effect: SkillEffect, level: number): number {
    const baseValue = typeof effect.value === 'number' ? effect.value : 0;
    if (effect.modifiers?.scaling) {
      return Math.round(baseValue * Math.pow(effect.modifiers.scaling, level - 1));
    }
    return baseValue;
  }

  private updateSkillStatistics(playerId: string, skillId: string, result: ActionResult): void {
    const playerStats = this.skillStatistics.get(playerId);
    const skillStats = playerStats?.get(skillId);
    
    if (skillStats) {
      skillStats.timesUsed += 1;
      // TODO: 更新其他统计信息
    }
  }

  private calculateExperienceGain(skillDef: SkillDefinition, result: ActionResult): number {
    // 基于技能稀有度和使用效果计算经验值
    const baseExp = {
      [SkillRarity.COMMON]: 10,
      [SkillRarity.UNCOMMON]: 15,
      [SkillRarity.RARE]: 25,
      [SkillRarity.EPIC]: 40,
      [SkillRarity.LEGENDARY]: 60
    }[skillDef.rarity] || 10;

    return result.success ? baseExp : Math.floor(baseExp * 0.3);
  }

  private emitEvent(event: SkillSystemEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('技能系统事件监听器错误:', error);
      }
    });
  }

  public addEventListener(listener: (event: SkillSystemEvent) => void): void {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: (event: SkillSystemEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index !== -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // ============================================================================
  // 效果应用方法（简化实现）
  // ============================================================================

  private async applyMoneyEffect(targets: string[], amount: number, gameState: GameState): Promise<ActionResult> {
    targets.forEach(targetId => {
      const player = gameState.players.find(p => p.id === targetId);
      if (player) {
        player.money += amount;
      }
    });

    return {
      success: true,
      message: `${targets.length}个目标获得${amount}金钱`,
      effects: []
    };
  }

  private async applyMoneyStealEffect(
    stealerId: string, 
    targets: string[], 
    amount: number, 
    gameState: GameState
  ): Promise<ActionResult> {
    const stealer = gameState.players.find(p => p.id === stealerId);
    if (!stealer) {
      return { success: false, message: '施法者不存在', effects: [] };
    }

    let totalStolen = 0;
    targets.forEach(targetId => {
      const target = gameState.players.find(p => p.id === targetId);
      if (target) {
        const stolen = Math.min(amount, target.money);
        target.money -= stolen;
        totalStolen += stolen;
      }
    });

    stealer.money += totalStolen;

    return {
      success: true,
      message: `偷取了${totalStolen}金钱`,
      effects: []
    };
  }

  private async applyPositionMoveEffect(targets: string[], distance: number, gameState: GameState): Promise<ActionResult> {
    targets.forEach(targetId => {
      const player = gameState.players.find(p => p.id === targetId);
      if (player) {
        player.position = (player.position + distance) % gameState.board.length;
        if (player.position < 0) {
          player.position += gameState.board.length;
        }
      }
    });

    return {
      success: true,
      message: `移动了${distance}步`,
      effects: []
    };
  }

  private async applyTeleportEffect(targets: string[], positions: string[], gameState: GameState): Promise<ActionResult> {
    // 简化实现：传送到随机位置
    targets.forEach(targetId => {
      const player = gameState.players.find(p => p.id === targetId);
      if (player) {
        player.position = Math.floor(Math.random() * gameState.board.length);
      }
    });

    return {
      success: true,
      message: '传送成功',
      effects: []
    };
  }

  private async applyDiceRerollEffect(targets: string[], gameState: GameState): Promise<ActionResult> {
    // TODO: 实现骰子重投逻辑
    return {
      success: true,
      message: '骰子重投',
      effects: []
    };
  }

  private async applyDiceControlEffect(targets: string[], value: number, gameState: GameState): Promise<ActionResult> {
    // TODO: 实现骰子控制逻辑
    return {
      success: true,
      message: `骰子结果设置为${value}`,
      effects: []
    };
  }

  private async applyStatusEffect(
    targets: string[], 
    effect: SkillEffect, 
    value: number, 
    gameState: GameState,
    isBuff: boolean
  ): Promise<ActionResult> {
    // TODO: 实现状态效果逻辑
    return {
      success: true,
      message: `应用${isBuff ? '增益' : '减益'}状态`,
      effects: []
    };
  }

  private async applyCooldownReductionEffect(targets: string[], reduction: number): Promise<ActionResult> {
    targets.forEach(targetId => {
      const playerSkills = this.getPlayerSkills(targetId);
      playerSkills.forEach(skill => {
        this.reduceCooldown(targetId, skill.definitionId, reduction);
      });
    });

    return {
      success: true,
      message: `减少${reduction}回合冷却`,
      effects: []
    };
  }
}

export default SkillManager;