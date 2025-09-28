/**
 * 自适应事件难度系统
 * Adaptive Event Difficulty System
 * 
 * 根据玩家表现、游戏进度和群体行为动态调整事件难度
 * Dynamically adjusts event difficulty based on player performance, game progress, and group behavior
 */

import { GameEvent, EventType, EventPriority, ZodiacSign, GameState, Player } from '../types/GameTypes';
import { GameStateAnalyzer } from './GameStateAnalyzer';

export interface DifficultyProfile {
  playerId: string;
  currentLevel: number; // 0-10 difficulty scale
  skillMetrics: {
    economicManagement: number;
    socialNavigation: number;
    strategicPlanning: number;
    riskTolerance: number;
    adaptability: number;
  };
  performanceHistory: PerformanceRecord[];
  learningRate: number;
  preferredChallengeType: EventType[];
  lastAdjustment: Date;
}

export interface PerformanceRecord {
  timestamp: Date;
  eventId: string;
  eventType: EventType;
  difficulty: number;
  outcome: 'success' | 'failure' | 'partial';
  responseTime: number;
  resourcesUsed: number;
  collaborationScore?: number;
  innovationScore?: number;
}

export interface GroupDynamics {
  averageSkillLevel: number;
  skillVariance: number;
  dominantPlayers: string[];
  strugglingPlayers: string[];
  cooperationLevel: number;
  competitionIntensity: number;
  groupMorale: number;
}

export interface AdaptiveDifficultyConfig {
  baseAdjustmentRate: number;
  maxDifficultyJump: number;
  learningWindowSize: number;
  groupBalancingWeight: number;
  zodiacInfluenceFactor: number;
  performanceThresholds: {
    excellence: number;
    good: number;
    adequate: number;
    poor: number;
  };
}

export interface DynamicEventModifier {
  type: 'resource_scaling' | 'time_pressure' | 'complexity_increase' | 'cooperation_required' | 'information_limitation';
  value: number;
  description: string;
  zodiacSpecific?: ZodiacSign[];
}

export interface AdaptiveEventGeneration {
  baseEvent: GameEvent;
  difficultyModifiers: DynamicEventModifier[];
  targetDifficulty: number;
  playerSpecificAdjustments: Map<string, DynamicEventModifier[]>;
  groupChallengeBonus: number;
}

export class AdaptiveDifficultySystem {
  private playerProfiles: Map<string, DifficultyProfile> = new Map();
  private groupDynamics: GroupDynamics | null = null;
  private gameStateAnalyzer: GameStateAnalyzer;
  private config: AdaptiveDifficultyConfig;

  constructor(
    gameStateAnalyzer: GameStateAnalyzer,
    config: Partial<AdaptiveDifficultyConfig> = {}
  ) {
    this.gameStateAnalyzer = gameStateAnalyzer;
    this.config = {
      baseAdjustmentRate: 0.1,
      maxDifficultyJump: 1.5,
      learningWindowSize: 10,
      groupBalancingWeight: 0.3,
      zodiacInfluenceFactor: 0.15,
      performanceThresholds: {
        excellence: 0.9,
        good: 0.7,
        adequate: 0.5,
        poor: 0.3
      },
      ...config
    };
  }

  /**
   * 初始化玩家难度档案
   */
  initializePlayerProfile(player: Player): DifficultyProfile {
    const profile: DifficultyProfile = {
      playerId: player.id,
      currentLevel: 5.0, // 中等难度开始
      skillMetrics: {
        economicManagement: 5.0,
        socialNavigation: 5.0,
        strategicPlanning: 5.0,
        riskTolerance: 5.0,
        adaptability: 5.0
      },
      performanceHistory: [],
      learningRate: this.calculateInitialLearningRate(player),
      preferredChallengeType: this.inferPreferredChallenges(player),
      lastAdjustment: new Date()
    };

    this.playerProfiles.set(player.id, profile);
    return profile;
  }

  /**
   * 分析玩家表现并更新难度档案
   */
  async analyzePerformance(
    playerId: string,
    eventId: string,
    eventType: EventType,
    outcome: 'success' | 'failure' | 'partial',
    gameState: GameState,
    performanceMetrics: {
      responseTime: number;
      resourcesUsed: number;
      collaborationScore?: number;
      innovationScore?: number;
    }
  ): Promise<void> {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) {
      return;
    }

    // 记录表现
    const record: PerformanceRecord = {
      timestamp: new Date(),
      eventId,
      eventType,
      difficulty: profile.currentLevel,
      outcome,
      responseTime: performanceMetrics.responseTime,
      resourcesUsed: performanceMetrics.resourcesUsed,
      collaborationScore: performanceMetrics.collaborationScore,
      innovationScore: performanceMetrics.innovationScore
    };

    profile.performanceHistory.push(record);

    // 限制历史记录大小
    if (profile.performanceHistory.length > this.config.learningWindowSize * 2) {
      profile.performanceHistory = profile.performanceHistory.slice(-this.config.learningWindowSize * 2);
    }

    // 更新技能指标
    await this.updateSkillMetrics(profile, record, gameState);

    // 调整难度水平
    await this.adjustDifficultyLevel(profile, gameState);
  }

  /**
   * 更新技能指标
   */
  private async updateSkillMetrics(
    profile: DifficultyProfile,
    record: PerformanceRecord,
    gameState: GameState
  ): Promise<void> {
    const learningFactor = profile.learningRate * 0.1;
    const performanceScore = this.calculatePerformanceScore(record);

    // 更新相关技能指标
    switch (record.eventType) {
      case 'economic':
        profile.skillMetrics.economicManagement = this.updateSkill(
          profile.skillMetrics.economicManagement,
          performanceScore,
          learningFactor
        );
        break;

      case 'social':
        profile.skillMetrics.socialNavigation = this.updateSkill(
          profile.skillMetrics.socialNavigation,
          performanceScore,
          learningFactor
        );
        if (record.collaborationScore !== undefined) {
          profile.skillMetrics.socialNavigation = this.updateSkill(
            profile.skillMetrics.socialNavigation,
            record.collaborationScore * 0.1,
            learningFactor * 0.5
          );
        }
        break;

      case 'cultural':
        profile.skillMetrics.adaptability = this.updateSkill(
          profile.skillMetrics.adaptability,
          performanceScore,
          learningFactor
        );
        break;

      case 'challenge':
        profile.skillMetrics.strategicPlanning = this.updateSkill(
          profile.skillMetrics.strategicPlanning,
          performanceScore,
          learningFactor
        );
        break;

      case 'random':
        profile.skillMetrics.riskTolerance = this.updateSkill(
          profile.skillMetrics.riskTolerance,
          performanceScore,
          learningFactor * 0.7
        );
        break;
    }

    // 根据创新得分更新适应性
    if (record.innovationScore !== undefined) {
      profile.skillMetrics.adaptability = this.updateSkill(
        profile.skillMetrics.adaptability,
        record.innovationScore * 0.1,
        learningFactor * 0.3
      );
    }
  }

  /**
   * 更新单个技能
   */
  private updateSkill(currentSkill: number, performanceScore: number, learningFactor: number): number {
    const targetSkill = performanceScore * 10; // 转换为0-10量表
    const adjustment = (targetSkill - currentSkill) * learningFactor;
    return Math.max(0, Math.min(10, currentSkill + adjustment));
  }

  /**
   * 计算表现得分
   */
  private calculatePerformanceScore(record: PerformanceRecord): number {
    let score = 0;

    // 基础成功得分
    switch (record.outcome) {
      case 'success': score += 1.0; break;
      case 'partial': score += 0.6; break;
      case 'failure': score += 0.2; break;
    }

    // 响应时间奖励（假设最优响应时间为30秒）
    const timeScore = Math.max(0, 1 - (record.responseTime - 30000) / 60000);
    score += timeScore * 0.2;

    // 资源效率奖励
    const resourceEfficiency = Math.max(0, 1 - record.resourcesUsed * 0.1);
    score += resourceEfficiency * 0.2;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 调整难度水平
   */
  private async adjustDifficultyLevel(
    profile: DifficultyProfile,
    gameState: GameState
  ): Promise<void> {
    const recentPerformance = this.getRecentPerformance(profile);
    const avgPerformance = recentPerformance.reduce((sum, r) => 
      sum + this.calculatePerformanceScore(r), 0) / recentPerformance.length;

    let adjustment = 0;

    // 基于表现的调整
    if (avgPerformance >= this.config.performanceThresholds.excellence) {
      adjustment = this.config.baseAdjustmentRate * 1.5;
    } else if (avgPerformance >= this.config.performanceThresholds.good) {
      adjustment = this.config.baseAdjustmentRate;
    } else if (avgPerformance >= this.config.performanceThresholds.adequate) {
      adjustment = 0;
    } else if (avgPerformance >= this.config.performanceThresholds.poor) {
      adjustment = -this.config.baseAdjustmentRate;
    } else {
      adjustment = -this.config.baseAdjustmentRate * 1.5;
    }

    // 群体平衡调整
    if (this.groupDynamics) {
      const groupAdjustment = this.calculateGroupBalanceAdjustment(profile);
      adjustment += groupAdjustment * this.config.groupBalancingWeight;
    }

    // 生肖特性调整
    const zodiacAdjustment = await this.calculateZodiacAdjustment(profile, gameState);
    adjustment += zodiacAdjustment * this.config.zodiacInfluenceFactor;

    // 应用调整（限制最大跳跃）
    adjustment = Math.max(-this.config.maxDifficultyJump, 
                         Math.min(this.config.maxDifficultyJump, adjustment));

    profile.currentLevel = Math.max(1, Math.min(10, profile.currentLevel + adjustment));
    profile.lastAdjustment = new Date();
  }

  /**
   * 获取最近表现记录
   */
  private getRecentPerformance(profile: DifficultyProfile): PerformanceRecord[] {
    return profile.performanceHistory
      .slice(-this.config.learningWindowSize)
      .filter(record => 
        Date.now() - record.timestamp.getTime() < 24 * 60 * 60 * 1000 // 24小时内
      );
  }

  /**
   * 计算群体平衡调整
   */
  private calculateGroupBalanceAdjustment(profile: DifficultyProfile): number {
    if (!this.groupDynamics) {
      return 0;
    }

    const playerSkillLevel = this.getOverallSkillLevel(profile);
    const skillGap = playerSkillLevel - this.groupDynamics.averageSkillLevel;

    // 降低技能差距
    if (Math.abs(skillGap) > 2.0) {
      return skillGap > 0 ? 0.2 : -0.2; // 技能高的增加难度，技能低的降低难度
    }

    return 0;
  }

  /**
   * 计算生肖调整
   */
  private async calculateZodiacAdjustment(
    profile: DifficultyProfile,
    gameState: GameState
  ): Promise<number> {
    // 根据玩家生肖和当前游戏状态调整难度
    // 这里可以实现季节性调整、生肖相性等逻辑
    return 0; // 简化实现
  }

  /**
   * 获取整体技能水平
   */
  private getOverallSkillLevel(profile: DifficultyProfile): number {
    const skills = profile.skillMetrics;
    return (skills.economicManagement + skills.socialNavigation + 
            skills.strategicPlanning + skills.riskTolerance + 
            skills.adaptability) / 5;
  }

  /**
   * 生成自适应事件
   */
  async generateAdaptiveEvent(
    baseEvent: GameEvent,
    targetPlayers: string[],
    gameState: GameState
  ): Promise<AdaptiveEventGeneration> {
    const playerSpecificAdjustments = new Map<string, DynamicEventModifier[]>();
    let averageTargetDifficulty = 0;

    // 为每个玩家生成特定调整
    for (const playerId of targetPlayers) {
      const profile = this.playerProfiles.get(playerId);
      if (profile) {
        const modifiers = await this.generatePlayerModifiers(profile, baseEvent, gameState);
        playerSpecificAdjustments.set(playerId, modifiers);
        averageTargetDifficulty += profile.currentLevel;
      }
    }

    averageTargetDifficulty /= targetPlayers.length;

    // 生成基础难度修饰符
    const baseModifiers = this.generateBaseDifficultyModifiers(
      baseEvent,
      averageTargetDifficulty,
      gameState
    );

    // 计算群体挑战奖励
    const groupBonus = this.calculateGroupChallengeBonus(targetPlayers, gameState);

    return {
      baseEvent,
      difficultyModifiers: baseModifiers,
      targetDifficulty: averageTargetDifficulty,
      playerSpecificAdjustments,
      groupChallengeBonus: groupBonus
    };
  }

  /**
   * 为玩家生成修饰符
   */
  private async generatePlayerModifiers(
    profile: DifficultyProfile,
    baseEvent: GameEvent,
    gameState: GameState
  ): Promise<DynamicEventModifier[]> {
    const modifiers: DynamicEventModifier[] = [];
    const skillLevel = this.getOverallSkillLevel(profile);
    const difficultyRatio = profile.currentLevel / 5.0; // 标准化到基准难度5

    // 资源缩放
    if (difficultyRatio > 1.2) {
      modifiers.push({
        type: 'resource_scaling',
        value: 1 / difficultyRatio,
        description: `资源限制增加${Math.round((1 - 1/difficultyRatio) * 100)}%`
      });
    }

    // 时间压力
    if (profile.skillMetrics.strategicPlanning > 7 && difficultyRatio > 1.1) {
      modifiers.push({
        type: 'time_pressure',
        value: difficultyRatio * 0.8,
        description: `决策时间减少${Math.round((1 - difficultyRatio * 0.8) * 100)}%`
      });
    }

    // 复杂度增加
    if (profile.skillMetrics.adaptability > 6 && difficultyRatio > 1.3) {
      modifiers.push({
        type: 'complexity_increase',
        value: difficultyRatio * 1.2,
        description: `事件复杂度提升${Math.round((difficultyRatio * 1.2 - 1) * 100)}%`
      });
    }

    // 合作要求
    if (profile.skillMetrics.socialNavigation < 4 && baseEvent.type === 'social') {
      modifiers.push({
        type: 'cooperation_required',
        value: 0.7,
        description: '增加团队协作要求'
      });
    }

    return modifiers;
  }

  /**
   * 生成基础难度修饰符
   */
  private generateBaseDifficultyModifiers(
    baseEvent: GameEvent,
    targetDifficulty: number,
    gameState: GameState
  ): DynamicEventModifier[] {
    const modifiers: DynamicEventModifier[] = [];
    const difficultyRatio = targetDifficulty / 5.0;

    // 根据整体难度调整基础参数
    if (difficultyRatio > 1.5) {
      modifiers.push({
        type: 'information_limitation',
        value: 0.7,
        description: '限制部分信息可见度'
      });
    }

    return modifiers;
  }

  /**
   * 计算群体挑战奖励
   */
  private calculateGroupChallengeBonus(
    targetPlayers: string[],
    gameState: GameState
  ): number {
    if (targetPlayers.length < 2) {
      return 0;
    }

    // 基于群体协作水平给予奖励
    let cooperationBonus = 0;
    if (this.groupDynamics && this.groupDynamics.cooperationLevel > 0.7) {
      cooperationBonus = 0.2;
    }

    return Math.min(0.5, targetPlayers.length * 0.1 + cooperationBonus);
  }

  /**
   * 更新群体动态分析
   */
  async updateGroupDynamics(gameState: GameState): Promise<void> {
    const allProfiles = Array.from(this.playerProfiles.values());
    
    if (allProfiles.length === 0) {
      return;
    }

    const skillLevels = allProfiles.map(p => this.getOverallSkillLevel(p));
    const averageSkill = skillLevels.reduce((sum, skill) => sum + skill, 0) / skillLevels.length;
    const skillVariance = skillLevels.reduce((sum, skill) => 
      sum + Math.pow(skill - averageSkill, 2), 0) / skillLevels.length;

    // 识别主导和困难玩家
    const sortedPlayers = allProfiles
      .map(p => ({ id: p.playerId, skill: this.getOverallSkillLevel(p) }))
      .sort((a, b) => b.skill - a.skill);

    const dominantPlayers = sortedPlayers.slice(0, Math.ceil(sortedPlayers.length * 0.3))
      .map(p => p.id);
    const strugglingPlayers = sortedPlayers.slice(-Math.ceil(sortedPlayers.length * 0.3))
      .map(p => p.id);

    // 分析合作水平
    const cooperationLevel = await this.analyzeCooperationLevel(gameState);
    const competitionIntensity = await this.analyzeCompetitionIntensity(gameState);
    const groupMorale = this.calculateGroupMorale(allProfiles);

    this.groupDynamics = {
      averageSkillLevel: averageSkill,
      skillVariance,
      dominantPlayers,
      strugglingPlayers,
      cooperationLevel,
      competitionIntensity,
      groupMorale
    };
  }

  /**
   * 分析合作水平
   */
  private async analyzeCooperationLevel(gameState: GameState): Promise<number> {
    // 基于游戏状态分析玩家间合作程度
    // 简化实现
    return 0.5;
  }

  /**
   * 分析竞争强度
   */
  private async analyzeCompetitionIntensity(gameState: GameState): Promise<number> {
    // 基于游戏状态分析竞争激烈程度
    // 简化实现
    return 0.5;
  }

  /**
   * 计算群体士气
   */
  private calculateGroupMorale(profiles: DifficultyProfile[]): number {
    const recentSuccessRates = profiles.map(profile => {
      const recentRecords = this.getRecentPerformance(profile);
      if (recentRecords.length === 0) return 0.5;
      
      const successCount = recentRecords.filter(r => r.outcome === 'success').length;
      return successCount / recentRecords.length;
    });

    return recentSuccessRates.reduce((sum, rate) => sum + rate, 0) / recentSuccessRates.length;
  }

  /**
   * 计算初始学习率
   */
  private calculateInitialLearningRate(player: Player): number {
    // 基于玩家生肖特性设定初始学习率
    // 简化实现
    return 0.1;
  }

  /**
   * 推断偏好的挑战类型
   */
  private inferPreferredChallenges(player: Player): EventType[] {
    // 基于玩家生肖特性推断偏好
    // 简化实现
    return ['economic', 'social', 'cultural'];
  }

  /**
   * 获取玩家难度统计
   */
  getPlayerDifficultyStats(playerId: string): any {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) {
      return null;
    }

    const recentPerformance = this.getRecentPerformance(profile);
    const avgPerformance = recentPerformance.length > 0 
      ? recentPerformance.reduce((sum, r) => sum + this.calculatePerformanceScore(r), 0) / recentPerformance.length
      : 0;

    return {
      currentLevel: profile.currentLevel,
      skillMetrics: profile.skillMetrics,
      overallSkill: this.getOverallSkillLevel(profile),
      recentPerformance: avgPerformance,
      learningRate: profile.learningRate,
      totalEvents: profile.performanceHistory.length,
      lastAdjustment: profile.lastAdjustment
    };
  }

  /**
   * 获取系统统计信息
   */
  getSystemStatistics(): any {
    return {
      totalPlayers: this.playerProfiles.size,
      groupDynamics: this.groupDynamics,
      averageDifficulty: Array.from(this.playerProfiles.values())
        .reduce((sum, p) => sum + p.currentLevel, 0) / this.playerProfiles.size,
      config: this.config
    };
  }
}