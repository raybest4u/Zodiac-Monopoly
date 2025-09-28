/**
 * 技能系统集成
 * 第二阶段 Day 1: 技能系统架构
 * 
 * 将技能系统集成到游戏引擎中，包括：
 * - 游戏引擎接口扩展
 * - 技能系统生命周期管理
 * - 事件系统集成
 * - 状态同步
 * - 数据持久化
 */

import type { GameState, Player, GameEvent, ActionResult } from '../types/game';
import { SkillManager } from './SkillManager';
import { SkillTriggerSystem } from './SkillTriggerSystem';
import {
  ISkillSystem,
  SkillSystemEvent,
  SkillSystemEventType,
  PlayerSkillInstance
} from './SkillSystemArchitecture';

/**
 * 技能系统集成配置
 */
export interface SkillSystemConfig {
  enableSkillSystem: boolean;
  enableAutoTriggers: boolean;
  enableSkillExperience: boolean;
  enableSkillCombos: boolean;
  skillBalanceMode: 'normal' | 'competitive' | 'casual';
  debugMode: boolean;
}

/**
 * 技能系统集成状态
 */
export interface SkillSystemState {
  isInitialized: boolean;
  isActive: boolean;
  playerSkillCounts: Record<string, number>;
  totalSkillsUsed: number;
  currentTurnSkillActivations: number;
  lastSkillUsage: Record<string, number>;
}

/**
 * 技能系统集成器
 * 负责将技能系统无缝集成到游戏引擎中
 */
export class SkillSystemIntegration {
  private skillManager: SkillManager;
  private triggerSystem: SkillTriggerSystem;
  private config: SkillSystemConfig;
  private state: SkillSystemState;
  private gameEngine: any; // 游戏引擎引用
  private eventListeners: Set<(event: SkillSystemEvent) => void> = new Set();

  constructor(config: SkillSystemConfig) {
    this.config = config;
    this.state = {
      isInitialized: false,
      isActive: false,
      playerSkillCounts: {},
      totalSkillsUsed: 0,
      currentTurnSkillActivations: 0,
      lastSkillUsage: {}
    };

    this.initializeSkillSystem();
  }

  // ============================================================================
  // 初始化和配置
  // ============================================================================

  private initializeSkillSystem(): void {
    console.log('🔧 初始化技能系统集成...');

    try {
      // 创建技能管理器
      this.skillManager = new SkillManager();
      
      // 创建触发系统
      this.triggerSystem = new SkillTriggerSystem(this.skillManager);

      // 设置事件监听
      this.setupEventListeners();

      this.state.isInitialized = true;
      console.log('✅ 技能系统集成初始化完成');

    } catch (error) {
      console.error('❌ 技能系统集成初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置游戏引擎引用
   */
  public setGameEngine(gameEngine: any): void {
    this.gameEngine = gameEngine;
    console.log('🔗 技能系统已连接到游戏引擎');
  }

  /**
   * 激活技能系统
   */
  public activate(): void {
    if (!this.state.isInitialized) {
      throw new Error('技能系统未初始化');
    }

    this.state.isActive = true;
    console.log('🚀 技能系统已激活');
  }

  /**
   * 停用技能系统
   */
  public deactivate(): void {
    this.state.isActive = false;
    console.log('⏹️ 技能系统已停用');
  }

  // ============================================================================
  // 游戏生命周期集成
  // ============================================================================

  /**
   * 游戏开始时初始化所有玩家的技能
   */
  public onGameStart(gameState: GameState): void {
    if (!this.state.isActive) return;

    console.log('🎮 游戏开始 - 初始化玩家技能系统');

    gameState.players.forEach(player => {
      this.initializePlayerSkills(player);
      this.state.playerSkillCounts[player.id] = 0;
    });

    this.emitSkillSystemEvent({
      type: SkillSystemEventType.SKILL_LEARNED,
      playerId: 'system',
      skillId: 'game_start',
      timestamp: Date.now(),
      data: { gameState }
    });
  }

  /**
   * 初始化单个玩家的技能
   */
  private initializePlayerSkills(player: Player): void {
    // 为玩家初始化技能系统
    this.skillManager.initializePlayerSkills(player.id, player.zodiac);
    
    // 初始化触发器
    this.triggerSystem.initializePlayerTriggers(player.id);

    console.log(`👤 玩家 ${player.name} (${player.zodiac}) 技能系统初始化完成`);
  }

  /**
   * 回合开始处理
   */
  public async onTurnStart(playerId: string, gameState: GameState): Promise<ActionResult> {
    if (!this.state.isActive) {
      return { success: true, message: '技能系统未激活', effects: [] };
    }

    // 重置回合技能激活计数
    this.state.currentTurnSkillActivations = 0;

    // 更新技能冷却
    this.skillManager.updateCooldowns(playerId);

    // 检查回合开始触发
    const triggerResult = await this.triggerSystem.handleTurnPhase('turn_start', playerId, {
      gameState,
      triggeredBy: 'turn_start'
    });

    // 检查被动技能
    const passiveResult = await this.triggerSystem.checkPassiveSkills(playerId, {
      gameState,
      triggeredBy: 'passive_check'
    });

    // 合并结果
    const combinedResult: ActionResult = {
      success: true,
      message: [triggerResult.message, passiveResult.message].filter(m => m).join(' '),
      effects: [...triggerResult.effects, ...passiveResult.effects]
    };

    if (this.config.debugMode) {
      console.log(`🔄 回合开始技能处理 (玩家: ${playerId}):`, combinedResult);
    }

    return combinedResult;
  }

  /**
   * 回合结束处理
   */
  public async onTurnEnd(playerId: string, gameState: GameState): Promise<ActionResult> {
    if (!this.state.isActive) {
      return { success: true, message: '技能系统未激活', effects: [] };
    }

    // 检查回合结束触发
    const triggerResult = await this.triggerSystem.handleTurnPhase('turn_end', playerId, {
      gameState,
      triggeredBy: 'turn_end'
    });

    // 更新统计
    this.updateTurnStats(playerId);

    if (this.config.debugMode) {
      console.log(`🔚 回合结束技能处理 (玩家: ${playerId}):`, triggerResult);
    }

    return {
      success: true,
      message: triggerResult.message || '回合结束',
      effects: triggerResult.effects
    };
  }

  /**
   * 游戏事件处理
   */
  public async onGameEvent(event: GameEvent, gameState: GameState): Promise<ActionResult> {
    if (!this.state.isActive || !this.config.enableAutoTriggers) {
      return { success: true, message: '事件技能处理跳过', effects: [] };
    }

    const triggerResult = await this.triggerSystem.handleGameEvent(event, {
      gameState,
      triggeredBy: 'game_event',
      eventData: event
    });

    if (triggerResult.triggered && this.config.debugMode) {
      console.log(`🎯 游戏事件触发技能:`, triggerResult);
    }

    return {
      success: true,
      message: triggerResult.message || '事件处理完成',
      effects: triggerResult.effects
    };
  }

  /**
   * 玩家行动处理
   */
  public async onPlayerAction(
    playerId: string,
    actionType: string,
    actionData: any,
    gameState: GameState
  ): Promise<ActionResult> {
    if (!this.state.isActive || !this.config.enableAutoTriggers) {
      return { success: true, message: '行动技能处理跳过', effects: [] };
    }

    const triggerResult = await this.triggerSystem.handlePlayerAction(playerId, actionType, actionData, {
      gameState,
      triggeredBy: 'player_action',
      actionData
    });

    if (triggerResult.triggered) {
      this.state.currentTurnSkillActivations += triggerResult.skillsActivated.length;
      this.state.totalSkillsUsed += triggerResult.skillsActivated.length;
      this.state.lastSkillUsage[playerId] = Date.now();

      if (this.config.debugMode) {
        console.log(`⚡ 玩家行动触发技能:`, triggerResult);
      }
    }

    return {
      success: true,
      message: triggerResult.message || '行动处理完成',
      effects: triggerResult.effects
    };
  }

  // ============================================================================
  // 技能使用接口
  // ============================================================================

  /**
   * 使用技能
   */
  public async useSkill(
    playerId: string,
    skillId: string,
    targets: string[],
    gameState: GameState
  ): Promise<ActionResult> {
    if (!this.state.isActive) {
      return {
        success: false,
        message: '技能系统未激活',
        effects: []
      };
    }

    try {
      const result = await this.skillManager.useSkill(playerId, skillId, targets, gameState);
      
      if (result.success) {
        // 更新统计
        this.state.currentTurnSkillActivations += 1;
        this.state.totalSkillsUsed += 1;
        this.state.lastSkillUsage[playerId] = Date.now();
        this.state.playerSkillCounts[playerId] = (this.state.playerSkillCounts[playerId] || 0) + 1;

        // 触发后续效果检查
        if (this.config.enableAutoTriggers) {
          await this.onPlayerAction(playerId, 'use_skill', { skillId, targets }, gameState);
        }
      }

      return result;

    } catch (error) {
      console.error('技能使用失败:', error);
      return {
        success: false,
        message: `技能使用失败: ${error}`,
        effects: []
      };
    }
  }

  /**
   * 检查技能是否可用
   */
  public canUseSkill(playerId: string, skillId: string, gameState: GameState): boolean {
    if (!this.state.isActive) return false;
    return this.skillManager.canUseSkill(playerId, skillId, gameState);
  }

  /**
   * 获取玩家可用技能
   */
  public getAvailableSkills(playerId: string, gameState: GameState): PlayerSkillInstance[] {
    if (!this.state.isActive) return [];
    return this.skillManager.getAvailableSkills(playerId, gameState);
  }

  /**
   * 获取玩家所有技能
   */
  public getPlayerSkills(playerId: string): PlayerSkillInstance[] {
    if (!this.state.isActive) return [];
    return this.skillManager.getPlayerSkills(playerId);
  }

  /**
   * 学习技能
   */
  public learnSkill(playerId: string, skillId: string): boolean {
    if (!this.state.isActive) return false;
    
    const result = this.skillManager.learnSkill(playerId, skillId);
    if (result) {
      // 重新初始化触发器
      this.triggerSystem.initializePlayerTriggers(playerId);
    }
    
    return result;
  }

  // ============================================================================
  // 游戏引擎扩展接口
  // ============================================================================

  /**
   * 扩展游戏引擎的技能相关方法
   */
  public extendGameEngine(gameEngine: any): void {
    this.gameEngine = gameEngine;

    // 扩展游戏引擎方法
    gameEngine.usePlayerSkill = this.useSkill.bind(this);
    gameEngine.canUsePlayerSkill = this.canUseSkill.bind(this);
    gameEngine.getPlayerSkills = this.getPlayerSkills.bind(this);
    gameEngine.getAvailableSkills = this.getAvailableSkills.bind(this);
    gameEngine.learnPlayerSkill = this.learnSkill.bind(this);
    gameEngine.getSkillSystemState = () => this.getSystemState();
    gameEngine.getSkillSystemStats = () => this.getSystemStats();

    // 集成到游戏引擎事件循环
    this.integrateWithGameEvents(gameEngine);

    console.log('🔗 游戏引擎技能系统扩展完成');
  }

  /**
   * 集成到游戏引擎事件系统
   */
  private integrateWithGameEvents(gameEngine: any): void {
    // 监听游戏引擎事件
    if (gameEngine.addEventListener) {
      gameEngine.addEventListener('gameStart', (data: any) => {
        this.onGameStart(data.gameState);
      });

      gameEngine.addEventListener('turnStart', (data: any) => {
        this.onTurnStart(data.playerId, data.gameState);
      });

      gameEngine.addEventListener('turnEnd', (data: any) => {
        this.onTurnEnd(data.playerId, data.gameState);
      });

      gameEngine.addEventListener('gameEvent', (data: any) => {
        this.onGameEvent(data.event, data.gameState);
      });

      gameEngine.addEventListener('playerAction', (data: any) => {
        this.onPlayerAction(data.playerId, data.actionType, data.actionData, data.gameState);
      });
    }
  }

  // ============================================================================
  // 数据持久化
  // ============================================================================

  /**
   * 保存技能系统数据
   */
  public saveSkillSystemData(gameState: GameState): any {
    const skillData: any = {
      systemState: this.state,
      playerSkills: {},
      config: this.config
    };

    // 保存每个玩家的技能数据
    gameState.players.forEach(player => {
      skillData.playerSkills[player.id] = this.skillManager.saveSkillData(player.id);
    });

    return skillData;
  }

  /**
   * 加载技能系统数据
   */
  public loadSkillSystemData(skillData: any, gameState: GameState): void {
    if (!skillData) return;

    // 恢复系统状态
    if (skillData.systemState) {
      this.state = { ...this.state, ...skillData.systemState };
    }

    // 恢复配置
    if (skillData.config) {
      this.config = { ...this.config, ...skillData.config };
    }

    // 恢复每个玩家的技能数据
    if (skillData.playerSkills) {
      gameState.players.forEach(player => {
        const playerSkillData = skillData.playerSkills[player.id];
        if (playerSkillData) {
          this.skillManager.loadSkillData(player.id, playerSkillData);
          this.triggerSystem.initializePlayerTriggers(player.id);
        }
      });
    }

    console.log('📥 技能系统数据加载完成');
  }

  // ============================================================================
  // 状态和统计
  // ============================================================================

  /**
   * 获取系统状态
   */
  public getSystemState(): SkillSystemState {
    return { ...this.state };
  }

  /**
   * 获取系统统计信息
   */
  public getSystemStats(): any {
    return {
      totalPlayers: Object.keys(this.state.playerSkillCounts).length,
      totalSkillsUsed: this.state.totalSkillsUsed,
      averageSkillsPerPlayer: this.calculateAverageSkillsPerPlayer(),
      currentTurnActivations: this.state.currentTurnSkillActivations,
      playerStats: this.getPlayerStats(),
      systemPerformance: this.getPerformanceMetrics()
    };
  }

  private calculateAverageSkillsPerPlayer(): number {
    const playerIds = Object.keys(this.state.playerSkillCounts);
    if (playerIds.length === 0) return 0;
    
    const totalSkills = playerIds.reduce((sum, playerId) => 
      sum + this.state.playerSkillCounts[playerId], 0);
    
    return totalSkills / playerIds.length;
  }

  private getPlayerStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    Object.keys(this.state.playerSkillCounts).forEach(playerId => {
      const playerSkills = this.getPlayerSkills(playerId);
      const triggerStats = this.triggerSystem.getTriggerStats(playerId);
      
      stats[playerId] = {
        skillCount: playerSkills.length,
        skillsUsed: this.state.playerSkillCounts[playerId],
        lastUsage: this.state.lastSkillUsage[playerId],
        triggerStats
      };
    });
    
    return stats;
  }

  private getPerformanceMetrics(): any {
    return {
      isActive: this.state.isActive,
      isInitialized: this.state.isInitialized,
      memoryUsage: this.estimateMemoryUsage(),
      eventListeners: this.eventListeners.size
    };
  }

  private estimateMemoryUsage(): number {
    // 简化的内存使用估算
    let usage = 0;
    
    Object.keys(this.state.playerSkillCounts).forEach(playerId => {
      const playerSkills = this.getPlayerSkills(playerId);
      usage += playerSkills.length * 1024; // 假设每个技能1KB
    });
    
    return usage;
  }

  private updateTurnStats(playerId: string): void {
    // 更新回合统计信息
    this.state.lastSkillUsage[playerId] = Date.now();
  }

  // ============================================================================
  // 事件系统
  // ============================================================================

  private setupEventListeners(): void {
    // 监听技能管理器事件
    this.skillManager.addEventListener((event: SkillSystemEvent) => {
      this.emitSkillSystemEvent(event);
    });
  }

  private emitSkillSystemEvent(event: SkillSystemEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('技能系统事件监听器错误:', error);
      }
    });
  }

  /**
   * 添加事件监听器
   */
  public addEventListener(listener: (event: SkillSystemEvent) => void): void {
    this.eventListeners.add(listener);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(listener: (event: SkillSystemEvent) => void): void {
    this.eventListeners.delete(listener);
  }

  // ============================================================================
  // 调试和开发工具
  // ============================================================================

  /**
   * 启用调试模式
   */
  public enableDebugMode(): void {
    this.config.debugMode = true;
    console.log('🐛 技能系统调试模式已启用');
  }

  /**
   * 禁用调试模式
   */
  public disableDebugMode(): void {
    this.config.debugMode = false;
    console.log('🐛 技能系统调试模式已禁用');
  }

  /**
   * 获取调试信息
   */
  public getDebugInfo(): any {
    return {
      config: this.config,
      state: this.state,
      skillManager: this.skillManager,
      triggerSystem: this.triggerSystem,
      eventListeners: this.eventListeners.size
    };
  }

  /**
   * 重置技能系统
   */
  public reset(): void {
    this.state = {
      isInitialized: false,
      isActive: false,
      playerSkillCounts: {},
      totalSkillsUsed: 0,
      currentTurnSkillActivations: 0,
      lastSkillUsage: {}
    };

    this.initializeSkillSystem();
    console.log('🔄 技能系统已重置');
  }

  /**
   * 获取系统健康状态
   */
  public getHealthCheck(): any {
    return {
      isHealthy: this.state.isInitialized && this.state.isActive,
      issues: this.detectIssues(),
      recommendations: this.getRecommendations()
    };
  }

  private detectIssues(): string[] {
    const issues: string[] = [];
    
    if (!this.state.isInitialized) {
      issues.push('系统未初始化');
    }
    
    if (!this.state.isActive) {
      issues.push('系统未激活');
    }
    
    if (this.estimateMemoryUsage() > 10 * 1024 * 1024) { // 10MB
      issues.push('内存使用过高');
    }
    
    return issues;
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.state.totalSkillsUsed === 0) {
      recommendations.push('考虑添加更多引导玩家使用技能的机制');
    }
    
    if (this.state.currentTurnSkillActivations > 10) {
      recommendations.push('当前回合技能激活过多，考虑调整平衡');
    }
    
    return recommendations;
  }
}

/**
 * 默认技能系统配置
 */
export const DEFAULT_SKILL_SYSTEM_CONFIG: SkillSystemConfig = {
  enableSkillSystem: true,
  enableAutoTriggers: true,
  enableSkillExperience: true,
  enableSkillCombos: true,
  skillBalanceMode: 'normal',
  debugMode: false
};

export default SkillSystemIntegration;