import { EventEmitter } from '../utils/EventEmitter';
import type { GameState, Player, ZodiacSign } from '../types/game';

export interface DifficultyLevel {
  id: string;
  name: string;
  displayName: string;
  description: string;
  numericValue: number; // 1-10 scale
  parameters: DifficultyParameters;
  prerequisites?: DifficultyPrerequisite[];
  rewards?: DifficultyReward[];
}

export interface DifficultyParameters {
  // AI 相关
  aiSkillLevel: number;
  aiAggressiveness: number;
  aiPredictability: number;
  aiResourceManagement: number;
  
  // 经济系统
  startingMoney: number;
  salaryMultiplier: number;
  propertyPriceVariation: number;
  bankruptcyThreshold: number;
  
  // 事件系统
  eventFrequency: number;
  eventSeverity: number;
  negativeEventChance: number;
  randomnessLevel: number;
  
  // 时间压力
  turnTimeLimit: number;
  decisionPressure: number;
  multitaskingRequirement: number;
  
  // 信息可见性
  hiddenInformation: number;
  uncertaintyLevel: number;
  predictionAccuracy: number;
  
  // 竞争强度
  competitionIntensity: number;
  playerAdvantageBalancing: number;
  catchupMechanisms: number;
}

export interface DifficultyPrerequisite {
  type: 'experience' | 'achievement' | 'skill_level' | 'playtime';
  requirement: string;
  value: number;
  description: string;
}

export interface DifficultyReward {
  type: 'experience_bonus' | 'unlock_content' | 'achievement' | 'cosmetic';
  value: number;
  description: string;
}

export interface PlayerDifficultyProfile {
  playerId: string;
  currentDifficulty: string;
  skillAssessment: SkillAssessment;
  performanceHistory: PerformanceRecord[];
  preferences: DifficultyPreferences;
  adaptationData: AdaptationData;
  lastUpdate: number;
}

export interface SkillAssessment {
  overallSkill: number;
  economicManagement: number;
  strategicPlanning: number;
  riskAssessment: number;
  socialInteraction: number;
  adaptability: number;
  decisionSpeed: number;
  pattern_recognition: number;
  confidence: number;
}

export interface PerformanceRecord {
  timestamp: number;
  difficultyLevel: string;
  gameMode: string;
  duration: number;
  outcome: 'victory' | 'defeat' | 'timeout' | 'quit';
  rank: number;
  score: number;
  efficiency: number;
  mistakes: number;
  helpUsed: number;
  satisfactionRating?: number;
  frustractionLevel?: number;
}

export interface DifficultyPreferences {
  preferredChallengeType: ChallengeType[];
  toleranceForRandomness: number;
  preferredGameLength: number;
  competitivenessLevel: number;
  learningOrientation: number;
  funOrientation: number;
  achievementOrientation: number;
}

export type ChallengeType = 
  | 'strategic_depth' 
  | 'time_pressure' 
  | 'information_scarcity' 
  | 'resource_management' 
  | 'social_dynamics' 
  | 'pattern_recognition' 
  | 'adaptation_speed';

export interface AdaptationData {
  learningRate: number;
  plateauDetection: PlateauData;
  strugglingIndicators: StruggleIndicator[];
  masteryIndicators: MasteryIndicator[];
  recommendedAdjustments: DifficultyAdjustment[];
}

export interface PlateauData {
  inPlateau: boolean;
  plateauStart: number;
  plateauDuration: number;
  stagnantMetrics: string[];
}

export interface StruggleIndicator {
  metric: string;
  severity: 'low' | 'medium' | 'high';
  duration: number;
  pattern: string;
  recommendation: string;
}

export interface MasteryIndicator {
  skill: string;
  masteryLevel: number;
  consistency: number;
  readyForAdvancement: boolean;
}

export interface DifficultyAdjustment {
  type: 'increase' | 'decrease' | 'lateral' | 'customize';
  target: string;
  magnitude: number;
  reasoning: string;
  confidence: number;
  timeframe: string;
}

export interface DifficultyTransition {
  fromLevel: string;
  toLevel: string;
  transitionType: 'gradual' | 'immediate' | 'trial' | 'optional';
  transitionSteps: TransitionStep[];
  player_preparation: string[];
  success_criteria: string[];
}

export interface TransitionStep {
  step: number;
  description: string;
  duration: number;
  parameters: Partial<DifficultyParameters>;
  validation: string[];
}

export interface DifficultyAnalytics {
  playerProgression: ProgressionAnalytics;
  systemPerformance: SystemPerformanceAnalytics;
  engagementMetrics: EngagementAnalytics;
  balanceMetrics: BalanceAnalytics;
}

export interface ProgressionAnalytics {
  averageProgressionRate: number;
  dropoffPoints: DropoffPoint[];
  masteryDistribution: Record<string, number>;
  timeToMastery: Record<string, number>;
  difficultyPreferences: Record<string, number>;
}

export interface DropoffPoint {
  difficultyLevel: string;
  dropoffRate: number;
  commonReasons: string[];
  recommendations: string[];
}

export interface SystemPerformanceAnalytics {
  adaptationAccuracy: number;
  recommendationSuccess: number;
  playerSatisfaction: number;
  retentionRate: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface EngagementAnalytics {
  averageSessionLength: number;
  retryRate: number;
  helpSeekingBehavior: number;
  explorationRate: number;
  socialInteractionLevel: number;
}

export interface BalanceAnalytics {
  winRateByDifficulty: Record<string, number>;
  averageGameLength: Record<string, number>;
  playerDistribution: Record<string, number>;
  satisfactionByDifficulty: Record<string, number>;
}

export class GameDifficultySystem extends EventEmitter {
  private difficultyLevels: Map<string, DifficultyLevel> = new Map();
  private playerProfiles: Map<string, PlayerDifficultyProfile> = new Map();
  private transitions: DifficultyTransition[] = [];
  private analytics: DifficultyAnalytics | null = null;
  private isEnabled: boolean = true;
  private adaptiveMode: boolean = true;

  constructor() {
    super();
    this.initializeDefaultDifficultyLevels();
    this.initializeTransitions();
  }

  public async initializePlayerProfile(player: Player, initialAssessment?: Partial<SkillAssessment>): Promise<PlayerDifficultyProfile> {
    try {
      const skillAssessment = await this.performInitialSkillAssessment(player, initialAssessment);
      const recommendedDifficulty = this.recommendInitialDifficulty(skillAssessment);

      const profile: PlayerDifficultyProfile = {
        playerId: player.id,
        currentDifficulty: recommendedDifficulty,
        skillAssessment,
        performanceHistory: [],
        preferences: this.initializeDefaultPreferences(),
        adaptationData: {
          learningRate: this.calculateInitialLearningRate(skillAssessment),
          plateauDetection: {
            inPlateau: false,
            plateauStart: 0,
            plateauDuration: 0,
            stagnantMetrics: []
          },
          strugglingIndicators: [],
          masteryIndicators: [],
          recommendedAdjustments: []
        },
        lastUpdate: Date.now()
      };

      this.playerProfiles.set(player.id, profile);
      
      this.emit('player_profile_created', {
        playerId: player.id,
        profile,
        recommendedDifficulty
      });

      return profile;

    } catch (error) {
      this.emit('error', { type: 'profile_initialization_failed', error });
      throw error;
    }
  }

  public async updatePlayerPerformance(
    playerId: string,
    gameState: GameState,
    performanceMetrics: Partial<PerformanceRecord>
  ): Promise<void> {
    try {
      const profile = this.playerProfiles.get(playerId);
      if (!profile) {
        throw new Error(`Player profile not found: ${playerId}`);
      }

      // 创建完整的性能记录
      const performanceRecord: PerformanceRecord = {
        timestamp: Date.now(),
        difficultyLevel: profile.currentDifficulty,
        gameMode: 'standard',
        duration: 0,
        outcome: 'victory',
        rank: 1,
        score: 0,
        efficiency: 0.5,
        mistakes: 0,
        helpUsed: 0,
        ...performanceMetrics
      };

      profile.performanceHistory.push(performanceRecord);

      // 限制历史记录大小
      if (profile.performanceHistory.length > 100) {
        profile.performanceHistory = profile.performanceHistory.slice(-100);
      }

      // 更新技能评估
      await this.updateSkillAssessment(profile, performanceRecord, gameState);

      // 检测适应需求
      await this.analyzeAdaptationNeeds(profile);

      // 如果启用自适应模式，应用调整
      if (this.adaptiveMode) {
        await this.applyAdaptiveAdjustments(profile);
      }

      profile.lastUpdate = Date.now();

      this.emit('performance_updated', {
        playerId,
        profile,
        performanceRecord
      });

    } catch (error) {
      this.emit('error', { type: 'performance_update_failed', error });
      throw error;
    }
  }

  public async recommendDifficultyAdjustment(playerId: string): Promise<DifficultyAdjustment[]> {
    try {
      const profile = this.playerProfiles.get(playerId);
      if (!profile) {
        throw new Error(`Player profile not found: ${playerId}`);
      }

      const adjustments: DifficultyAdjustment[] = [];

      // 分析最近表现
      const recentPerformance = this.getRecentPerformance(profile, 10);
      const averagePerformance = this.calculateAveragePerformance(recentPerformance);

      // 检查是否需要降低难度
      if (this.shouldDecreaseDifficulty(profile, averagePerformance)) {
        adjustments.push({
          type: 'decrease',
          target: 'overall_difficulty',
          magnitude: this.calculateAdjustmentMagnitude(profile, 'decrease'),
          reasoning: 'Player showing signs of struggle',
          confidence: this.calculateAdjustmentConfidence(profile, 'decrease'),
          timeframe: 'immediate'
        });
      }

      // 检查是否需要增加难度
      if (this.shouldIncreaseDifficulty(profile, averagePerformance)) {
        adjustments.push({
          type: 'increase',
          target: 'overall_difficulty',
          magnitude: this.calculateAdjustmentMagnitude(profile, 'increase'),
          reasoning: 'Player demonstrating mastery',
          confidence: this.calculateAdjustmentConfidence(profile, 'increase'),
          timeframe: 'gradual'
        });
      }

      // 检查特定技能调整
      const skillSpecificAdjustments = await this.analyzeSkillSpecificAdjustments(profile);
      adjustments.push(...skillSpecificAdjustments);

      // 更新推荐到玩家档案
      profile.adaptationData.recommendedAdjustments = adjustments;

      this.emit('difficulty_adjustments_recommended', {
        playerId,
        adjustments
      });

      return adjustments;

    } catch (error) {
      this.emit('error', { type: 'adjustment_recommendation_failed', error });
      throw error;
    }
  }

  public async applyDifficultyAdjustment(playerId: string, adjustment: DifficultyAdjustment): Promise<boolean> {
    try {
      const profile = this.playerProfiles.get(playerId);
      if (!profile) {
        throw new Error(`Player profile not found: ${playerId}`);
      }

      const currentLevel = this.difficultyLevels.get(profile.currentDifficulty);
      if (!currentLevel) {
        throw new Error(`Current difficulty level not found: ${profile.currentDifficulty}`);
      }

      let newDifficultyId: string;

      switch (adjustment.type) {
        case 'increase':
          newDifficultyId = this.getNextDifficultyLevel(profile.currentDifficulty);
          break;
        case 'decrease':
          newDifficultyId = this.getPreviousDifficultyLevel(profile.currentDifficulty);
          break;
        case 'lateral':
          newDifficultyId = this.getLateralDifficultyLevel(profile.currentDifficulty, adjustment.target);
          break;
        case 'customize':
          newDifficultyId = await this.createCustomDifficultyLevel(profile, adjustment);
          break;
        default:
          throw new Error(`Unknown adjustment type: ${adjustment.type}`);
      }

      // 应用调整
      if (newDifficultyId !== profile.currentDifficulty) {
        const transition = await this.createDifficultyTransition(
          profile.currentDifficulty,
          newDifficultyId,
          adjustment
        );

        profile.currentDifficulty = newDifficultyId;
        profile.lastUpdate = Date.now();

        this.emit('difficulty_adjusted', {
          playerId,
          fromLevel: currentLevel.id,
          toLevel: newDifficultyId,
          adjustment,
          transition
        });

        return true;
      }

      return false;

    } catch (error) {
      this.emit('error', { type: 'difficulty_adjustment_failed', error });
      return false;
    }
  }

  public getDifficultyLevel(levelId: string): DifficultyLevel | undefined {
    return this.difficultyLevels.get(levelId);
  }

  public getAllDifficultyLevels(): DifficultyLevel[] {
    return Array.from(this.difficultyLevels.values()).sort((a, b) => a.numericValue - b.numericValue);
  }

  public getPlayerProfile(playerId: string): PlayerDifficultyProfile | undefined {
    return this.playerProfiles.get(playerId);
  }

  private async performInitialSkillAssessment(player: Player, initialAssessment?: Partial<SkillAssessment>): Promise<SkillAssessment> {
    const defaultAssessment: SkillAssessment = {
      overallSkill: 5.0,
      economicManagement: 5.0,
      strategicPlanning: 5.0,
      riskAssessment: 5.0,
      socialInteraction: 5.0,
      adaptability: 5.0,
      decisionSpeed: 5.0,
      pattern_recognition: 5.0,
      confidence: 5.0
    };

    // 根据生肖特性调整初始评估
    const zodiacAdjustments = this.getZodiacSkillAdjustments(player.zodiacSign);
    Object.keys(zodiacAdjustments).forEach(skill => {
      if (skill in defaultAssessment) {
        (defaultAssessment as any)[skill] += zodiacAdjustments[skill];
      }
    });

    // 应用提供的初始评估
    return { ...defaultAssessment, ...initialAssessment };
  }

  private recommendInitialDifficulty(skillAssessment: SkillAssessment): string {
    const overallSkill = skillAssessment.overallSkill;
    
    if (overallSkill < 3) {
      return 'beginner';
    } else if (overallSkill < 5) {
      return 'easy';
    } else if (overallSkill < 7) {
      return 'normal';
    } else if (overallSkill < 8.5) {
      return 'hard';
    } else {
      return 'expert';
    }
  }

  private initializeDefaultPreferences(): DifficultyPreferences {
    return {
      preferredChallengeType: ['strategic_depth', 'resource_management'],
      toleranceForRandomness: 0.5,
      preferredGameLength: 30,
      competitivenessLevel: 0.5,
      learningOrientation: 0.7,
      funOrientation: 0.8,
      achievementOrientation: 0.6
    };
  }

  private calculateInitialLearningRate(skillAssessment: SkillAssessment): number {
    const baseRate = 0.1;
    const adaptabilityFactor = skillAssessment.adaptability / 10;
    return baseRate * (0.5 + adaptabilityFactor);
  }

  private async updateSkillAssessment(
    profile: PlayerDifficultyProfile,
    performance: PerformanceRecord,
    gameState: GameState
  ): Promise<void> {
    const learningRate = profile.adaptationData.learningRate;
    const performanceScore = this.calculatePerformanceScore(performance);

    // 更新整体技能
    profile.skillAssessment.overallSkill = this.updateSkillMetric(
      profile.skillAssessment.overallSkill,
      performanceScore * 10,
      learningRate
    );

    // 根据具体表现更新特定技能
    if (performance.efficiency > 0.8) {
      profile.skillAssessment.economicManagement = this.updateSkillMetric(
        profile.skillAssessment.economicManagement,
        performance.efficiency * 10,
        learningRate
      );
    }

    if (performance.outcome === 'victory') {
      profile.skillAssessment.strategicPlanning = this.updateSkillMetric(
        profile.skillAssessment.strategicPlanning,
        8.0,
        learningRate
      );
    }

    // 基于决策时间更新决策速度
    const decisionSpeedScore = this.calculateDecisionSpeedScore(performance.duration);
    profile.skillAssessment.decisionSpeed = this.updateSkillMetric(
      profile.skillAssessment.decisionSpeed,
      decisionSpeedScore,
      learningRate * 0.5
    );
  }

  private updateSkillMetric(current: number, target: number, learningRate: number): number {
    const adjustment = (target - current) * learningRate;
    return Math.max(0, Math.min(10, current + adjustment));
  }

  private calculatePerformanceScore(performance: PerformanceRecord): number {
    let score = 0;

    // 基础结果得分
    switch (performance.outcome) {
      case 'victory': score += 1.0; break;
      case 'defeat': score += 0.3; break;
      case 'timeout': score += 0.1; break;
      case 'quit': score += 0.0; break;
    }

    // 效率奖励
    score += performance.efficiency * 0.5;

    // 排名奖励
    if (performance.rank === 1) score += 0.3;
    else if (performance.rank <= 2) score += 0.1;

    // 错误惩罚
    score -= Math.min(0.3, performance.mistakes * 0.05);

    return Math.max(0, Math.min(1, score));
  }

  private calculateDecisionSpeedScore(duration: number): number {
    // 假设理想游戏时长为30分钟
    const idealDuration = 30 * 60 * 1000;
    const ratio = idealDuration / Math.max(duration, idealDuration * 0.5);
    return Math.min(10, Math.max(1, ratio * 5));
  }

  private async analyzeAdaptationNeeds(profile: PlayerDifficultyProfile): Promise<void> {
    // 检测学习平台期
    this.detectLearningPlateau(profile);

    // 识别挣扎指标
    this.identifyStruggleIndicators(profile);

    // 识别掌握指标
    this.identifyMasteryIndicators(profile);
  }

  private detectLearningPlateau(profile: PlayerDifficultyProfile): void {
    const recentPerformance = this.getRecentPerformance(profile, 15);
    if (recentPerformance.length < 10) return;

    const performanceScores = recentPerformance.map(p => this.calculatePerformanceScore(p));
    const variance = this.calculateVariance(performanceScores);
    const trend = this.calculateTrend(performanceScores);

    const isInPlateau = variance < 0.05 && Math.abs(trend) < 0.01;

    if (isInPlateau && !profile.adaptationData.plateauDetection.inPlateau) {
      profile.adaptationData.plateauDetection = {
        inPlateau: true,
        plateauStart: Date.now(),
        plateauDuration: 0,
        stagnantMetrics: ['overall_performance']
      };
    } else if (!isInPlateau && profile.adaptationData.plateauDetection.inPlateau) {
      profile.adaptationData.plateauDetection.inPlateau = false;
    }

    if (profile.adaptationData.plateauDetection.inPlateau) {
      profile.adaptationData.plateauDetection.plateauDuration = 
        Date.now() - profile.adaptationData.plateauDetection.plateauStart;
    }
  }

  private identifyStruggleIndicators(profile: PlayerDifficultyProfile): void {
    const recentPerformance = this.getRecentPerformance(profile, 10);
    if (recentPerformance.length < 5) return;

    const failureRate = recentPerformance.filter(p => p.outcome === 'defeat' || p.outcome === 'quit').length / recentPerformance.length;
    const averageEfficiency = recentPerformance.reduce((sum, p) => sum + p.efficiency, 0) / recentPerformance.length;
    const helpUsageRate = recentPerformance.reduce((sum, p) => sum + p.helpUsed, 0) / recentPerformance.length;

    const indicators: StruggleIndicator[] = [];

    if (failureRate > 0.6) {
      indicators.push({
        metric: 'failure_rate',
        severity: 'high',
        duration: this.calculateIndicatorDuration(profile, 'high_failure_rate'),
        pattern: 'consistent_failures',
        recommendation: 'decrease_difficulty'
      });
    }

    if (averageEfficiency < 0.3) {
      indicators.push({
        metric: 'efficiency',
        severity: 'medium',
        duration: this.calculateIndicatorDuration(profile, 'low_efficiency'),
        pattern: 'resource_mismanagement',
        recommendation: 'provide_economic_guidance'
      });
    }

    if (helpUsageRate > 3) {
      indicators.push({
        metric: 'help_seeking',
        severity: 'medium',
        duration: this.calculateIndicatorDuration(profile, 'excessive_help'),
        pattern: 'knowledge_gaps',
        recommendation: 'tutorial_reinforcement'
      });
    }

    profile.adaptationData.strugglingIndicators = indicators;
  }

  private identifyMasteryIndicators(profile: PlayerDifficultyProfile): void {
    const recentPerformance = this.getRecentPerformance(profile, 10);
    if (recentPerformance.length < 8) return;

    const successRate = recentPerformance.filter(p => p.outcome === 'victory').length / recentPerformance.length;
    const averageEfficiency = recentPerformance.reduce((sum, p) => sum + p.efficiency, 0) / recentPerformance.length;
    const consistencyScore = 1 - this.calculateVariance(recentPerformance.map(p => this.calculatePerformanceScore(p)));

    const indicators: MasteryIndicator[] = [];

    if (successRate > 0.8 && averageEfficiency > 0.7 && consistencyScore > 0.8) {
      indicators.push({
        skill: 'overall_gameplay',
        masteryLevel: 0.9,
        consistency: consistencyScore,
        readyForAdvancement: true
      });
    }

    profile.adaptationData.masteryIndicators = indicators;
  }

  private async applyAdaptiveAdjustments(profile: PlayerDifficultyProfile): Promise<void> {
    const adjustments = await this.recommendDifficultyAdjustment(profile.playerId);
    
    for (const adjustment of adjustments) {
      if (adjustment.confidence > 0.8) {
        await this.applyDifficultyAdjustment(profile.playerId, adjustment);
      }
    }
  }

  private getRecentPerformance(profile: PlayerDifficultyProfile, count: number): PerformanceRecord[] {
    return profile.performanceHistory
      .slice(-count)
      .filter(record => Date.now() - record.timestamp < 7 * 24 * 60 * 60 * 1000); // 最近7天
  }

  private calculateAveragePerformance(records: PerformanceRecord[]): number {
    if (records.length === 0) return 0.5;
    return records.reduce((sum, record) => sum + this.calculatePerformanceScore(record), 0) / records.length;
  }

  private shouldDecreaseDifficulty(profile: PlayerDifficultyProfile, averagePerformance: number): boolean {
    const strugglingIndicators = profile.adaptationData.strugglingIndicators;
    const hasHighSeverityIndicators = strugglingIndicators.some(indicator => indicator.severity === 'high');
    
    return averagePerformance < 0.3 || hasHighSeverityIndicators;
  }

  private shouldIncreaseDifficulty(profile: PlayerDifficultyProfile, averagePerformance: number): boolean {
    const masteryIndicators = profile.adaptationData.masteryIndicators;
    const readyForAdvancement = masteryIndicators.some(indicator => indicator.readyForAdvancement);
    
    return averagePerformance > 0.8 && readyForAdvancement;
  }

  private calculateAdjustmentMagnitude(profile: PlayerDifficultyProfile, type: 'increase' | 'decrease'): number {
    const baseAmount = 0.5;
    const learningRate = profile.adaptationData.learningRate;
    
    return baseAmount * (1 + learningRate);
  }

  private calculateAdjustmentConfidence(profile: PlayerDifficultyProfile, type: 'increase' | 'decrease'): number {
    const recentPerformance = this.getRecentPerformance(profile, 10);
    const sampleSize = recentPerformance.length;
    
    // 样本越大，信心越高
    const sampleConfidence = Math.min(1, sampleSize / 10);
    
    // 一致性越高，信心越高
    const performanceScores = recentPerformance.map(p => this.calculatePerformanceScore(p));
    const consistency = 1 - this.calculateVariance(performanceScores);
    
    return (sampleConfidence + consistency) / 2;
  }

  private async analyzeSkillSpecificAdjustments(profile: PlayerDifficultyProfile): Promise<DifficultyAdjustment[]> {
    const adjustments: DifficultyAdjustment[] = [];
    
    // 分析各项技能表现，提供针对性调整建议
    // 这里可以实现更细粒度的技能分析和调整建议
    
    return adjustments;
  }

  // 辅助方法
  private getNextDifficultyLevel(currentId: string): string {
    const levels = this.getAllDifficultyLevels();
    const currentIndex = levels.findIndex(level => level.id === currentId);
    
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1].id;
    }
    
    return currentId; // 已经是最高难度
  }

  private getPreviousDifficultyLevel(currentId: string): string {
    const levels = this.getAllDifficultyLevels();
    const currentIndex = levels.findIndex(level => level.id === currentId);
    
    if (currentIndex > 0) {
      return levels[currentIndex - 1].id;
    }
    
    return currentId; // 已经是最低难度
  }

  private getLateralDifficultyLevel(currentId: string, target: string): string {
    // 实现横向难度调整（相同数值难度，不同挑战类型）
    return currentId;
  }

  private async createCustomDifficultyLevel(profile: PlayerDifficultyProfile, adjustment: DifficultyAdjustment): Promise<string> {
    // 实现自定义难度创建
    return profile.currentDifficulty;
  }

  private async createDifficultyTransition(fromLevel: string, toLevel: string, adjustment: DifficultyAdjustment): Promise<DifficultyTransition> {
    return {
      fromLevel,
      toLevel,
      transitionType: adjustment.timeframe === 'immediate' ? 'immediate' : 'gradual',
      transitionSteps: [],
      player_preparation: [],
      success_criteria: []
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    // 简单线性趋势计算
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, value) => sum + value, 0);
    const sumXY = values.reduce((sum, value, index) => sum + value * index, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  private calculateIndicatorDuration(profile: PlayerDifficultyProfile, indicatorType: string): number {
    // 计算指标持续时间
    return 0;
  }

  private getZodiacSkillAdjustments(zodiacSign: ZodiacSign): Record<string, number> {
    // 根据生肖返回技能调整值
    const adjustments: Record<string, Record<string, number>> = {
      'rat': { strategicPlanning: 0.5, economicManagement: 0.3 },
      'ox': { riskAssessment: 0.4, strategicPlanning: 0.2 },
      'tiger': { decisionSpeed: 0.5, riskAssessment: -0.2 },
      'rabbit': { socialInteraction: 0.4, adaptability: 0.3 },
      'dragon': { overallSkill: 0.3, confidence: 0.5 },
      'snake': { pattern_recognition: 0.5, strategicPlanning: 0.3 },
      'horse': { decisionSpeed: 0.4, adaptability: 0.3 },
      'goat': { socialInteraction: 0.5, economicManagement: -0.1 },
      'monkey': { adaptability: 0.5, pattern_recognition: 0.4 },
      'rooster': { economicManagement: 0.4, confidence: 0.2 },
      'dog': { socialInteraction: 0.3, riskAssessment: 0.3 },
      'pig': { economicManagement: 0.2, socialInteraction: 0.4 }
    };
    
    return adjustments[zodiacSign] || {};
  }

  private initializeDefaultDifficultyLevels(): void {
    const levels: DifficultyLevel[] = [
      {
        id: 'tutorial',
        name: 'Tutorial',
        displayName: '教学模式',
        description: '学习基础游戏机制',
        numericValue: 1,
        parameters: {
          aiSkillLevel: 2, aiAggressiveness: 1, aiPredictability: 8, aiResourceManagement: 3,
          startingMoney: 2000, salaryMultiplier: 1.5, propertyPriceVariation: 0.1, bankruptcyThreshold: 0,
          eventFrequency: 0.3, eventSeverity: 0.2, negativeEventChance: 0.1, randomnessLevel: 0.2,
          turnTimeLimit: 0, decisionPressure: 0.1, multitaskingRequirement: 0.1,
          hiddenInformation: 0.1, uncertaintyLevel: 0.2, predictionAccuracy: 0.9,
          competitionIntensity: 0.2, playerAdvantageBalancing: 0.8, catchupMechanisms: 0.9
        }
      },
      {
        id: 'beginner',
        name: 'Beginner',
        displayName: '新手',
        description: '适合初学者的简单挑战',
        numericValue: 2,
        parameters: {
          aiSkillLevel: 3, aiAggressiveness: 2, aiPredictability: 7, aiResourceManagement: 4,
          startingMoney: 1800, salaryMultiplier: 1.3, propertyPriceVariation: 0.15, bankruptcyThreshold: 100,
          eventFrequency: 0.4, eventSeverity: 0.3, negativeEventChance: 0.2, randomnessLevel: 0.3,
          turnTimeLimit: 0, decisionPressure: 0.2, multitaskingRequirement: 0.2,
          hiddenInformation: 0.2, uncertaintyLevel: 0.3, predictionAccuracy: 0.8,
          competitionIntensity: 0.3, playerAdvantageBalancing: 0.7, catchupMechanisms: 0.8
        }
      },
      {
        id: 'easy',
        name: 'Easy',
        displayName: '简单',
        description: '轻松的游戏体验',
        numericValue: 3,
        parameters: {
          aiSkillLevel: 4, aiAggressiveness: 3, aiPredictability: 6, aiResourceManagement: 5,
          startingMoney: 1600, salaryMultiplier: 1.2, propertyPriceVariation: 0.2, bankruptcyThreshold: 200,
          eventFrequency: 0.5, eventSeverity: 0.4, negativeEventChance: 0.25, randomnessLevel: 0.4,
          turnTimeLimit: 0, decisionPressure: 0.3, multitaskingRequirement: 0.3,
          hiddenInformation: 0.3, uncertaintyLevel: 0.4, predictionAccuracy: 0.7,
          competitionIntensity: 0.4, playerAdvantageBalancing: 0.6, catchupMechanisms: 0.7
        }
      },
      {
        id: 'normal',
        name: 'Normal',
        displayName: '普通',
        description: '标准游戏体验',
        numericValue: 5,
        parameters: {
          aiSkillLevel: 5, aiAggressiveness: 5, aiPredictability: 5, aiResourceManagement: 6,
          startingMoney: 1500, salaryMultiplier: 1.0, propertyPriceVariation: 0.25, bankruptcyThreshold: 300,
          eventFrequency: 0.6, eventSeverity: 0.5, negativeEventChance: 0.3, randomnessLevel: 0.5,
          turnTimeLimit: 120, decisionPressure: 0.5, multitaskingRequirement: 0.5,
          hiddenInformation: 0.4, uncertaintyLevel: 0.5, predictionAccuracy: 0.6,
          competitionIntensity: 0.5, playerAdvantageBalancing: 0.5, catchupMechanisms: 0.5
        }
      },
      {
        id: 'hard',
        name: 'Hard',
        displayName: '困难',
        description: '具有挑战性的游戏',
        numericValue: 7,
        parameters: {
          aiSkillLevel: 7, aiAggressiveness: 6, aiPredictability: 4, aiResourceManagement: 7,
          startingMoney: 1400, salaryMultiplier: 0.9, propertyPriceVariation: 0.3, bankruptcyThreshold: 400,
          eventFrequency: 0.7, eventSeverity: 0.6, negativeEventChance: 0.35, randomnessLevel: 0.6,
          turnTimeLimit: 90, decisionPressure: 0.7, multitaskingRequirement: 0.7,
          hiddenInformation: 0.5, uncertaintyLevel: 0.6, predictionAccuracy: 0.5,
          competitionIntensity: 0.7, playerAdvantageBalancing: 0.3, catchupMechanisms: 0.3
        }
      },
      {
        id: 'expert',
        name: 'Expert',
        displayName: '专家',
        description: '极具挑战性的高级游戏',
        numericValue: 8,
        parameters: {
          aiSkillLevel: 8, aiAggressiveness: 7, aiPredictability: 3, aiResourceManagement: 8,
          startingMoney: 1300, salaryMultiplier: 0.8, propertyPriceVariation: 0.35, bankruptcyThreshold: 500,
          eventFrequency: 0.8, eventSeverity: 0.7, negativeEventChance: 0.4, randomnessLevel: 0.7,
          turnTimeLimit: 60, decisionPressure: 0.8, multitaskingRequirement: 0.8,
          hiddenInformation: 0.6, uncertaintyLevel: 0.7, predictionAccuracy: 0.4,
          competitionIntensity: 0.8, playerAdvantageBalancing: 0.2, catchupMechanisms: 0.2
        }
      },
      {
        id: 'master',
        name: 'Master',
        displayName: '大师',
        description: '最高难度挑战',
        numericValue: 10,
        parameters: {
          aiSkillLevel: 9, aiAggressiveness: 8, aiPredictability: 2, aiResourceManagement: 9,
          startingMoney: 1200, salaryMultiplier: 0.7, propertyPriceVariation: 0.4, bankruptcyThreshold: 600,
          eventFrequency: 0.9, eventSeverity: 0.8, negativeEventChance: 0.45, randomnessLevel: 0.8,
          turnTimeLimit: 45, decisionPressure: 0.9, multitaskingRequirement: 0.9,
          hiddenInformation: 0.7, uncertaintyLevel: 0.8, predictionAccuracy: 0.3,
          competitionIntensity: 0.9, playerAdvantageBalancing: 0.1, catchupMechanisms: 0.1
        }
      }
    ];

    levels.forEach(level => {
      this.difficultyLevels.set(level.id, level);
    });
  }

  private initializeTransitions(): void {
    // 初始化难度转换规则
    // 这里可以定义不同难度级别之间的转换逻辑
  }

  // 公共接口方法
  public setAdaptiveMode(enabled: boolean): void {
    this.adaptiveMode = enabled;
    this.emit('adaptive_mode_changed', { enabled });
  }

  public isAdaptiveModeEnabled(): boolean {
    return this.adaptiveMode;
  }

  public getSystemStatus(): { enabled: boolean; adaptive: boolean; playerCount: number } {
    return {
      enabled: this.isEnabled,
      adaptive: this.adaptiveMode,
      playerCount: this.playerProfiles.size
    };
  }
}