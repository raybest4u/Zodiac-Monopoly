import { EventEmitter } from '../utils/EventEmitter';
import { GameDifficultySystem, PlayerDifficultyProfile } from './GameDifficultySystem';
import { DynamicDifficultyAdjuster } from './DynamicDifficultyAdjuster';
import { ChallengeAssessmentSystem, ChallengeAssessment } from './ChallengeAssessmentSystem';
import type { GameState, Player } from '../types/game';

export interface DifficultyProgression {
  playerId: string;
  progressionPath: ProgressionPoint[];
  targetProgression: ProgressionPoint[];
  currentOptimization: OptimizationState;
  learningVelocity: number;
  plateauHistory: PlateauRecord[];
  masteryGoals: MasteryGoal[];
}

export interface ProgressionPoint {
  timestamp: number;
  difficultyLevel: number;
  skillLevels: Record<string, number>;
  performanceScore: number;
  engagementLevel: number;
  frustrationLevel: number;
  masteryIndicators: Record<string, number>;
  contextualFactors: ContextualFactor[];
}

export interface ContextualFactor {
  type: string;
  value: number;
  impact: number;
  description: string;
}

export interface OptimizationState {
  phase: OptimizationPhase;
  targetDifficulty: number;
  adjustmentStrategy: AdjustmentStrategy;
  confidence: number;
  remainingSteps: number;
  interventionHistory: OptimizationIntervention[];
}

export type OptimizationPhase = 
  | 'assessment' 
  | 'calibration' 
  | 'gradual_increase' 
  | 'plateau_breaking' 
  | 'mastery_consolidation' 
  | 'adaptive_maintenance';

export interface AdjustmentStrategy {
  type: StrategyType;
  parameters: StrategyParameters;
  successCriteria: SuccessCriteria[];
  fallbackStrategies: FallbackStrategy[];
  timeframe: number;
}

export type StrategyType = 
  | 'gradual_linear' 
  | 'exponential_curve' 
  | 'stepped_progression' 
  | 'adaptive_spiral' 
  | 'challenge_burst' 
  | 'skill_focused';

export interface StrategyParameters {
  incrementSize: number;
  timeInterval: number;
  smoothingFactor: number;
  adaptationRate: number;
  maxAdjustmentPerStep: number;
  consolidationPeriod: number;
  riskTolerance: number;
}

export interface SuccessCriteria {
  metric: string;
  threshold: number;
  evaluationWindow: number;
  weight: number;
}

export interface FallbackStrategy {
  condition: string;
  strategy: StrategyType;
  parameters: Partial<StrategyParameters>;
  priority: number;
}

export interface PlateauRecord {
  startTime: number;
  endTime?: number;
  difficultyLevel: number;
  duration: number;
  breakoutStrategy: string;
  breakoutSuccess: boolean;
  skillsStagnant: string[];
  interventionsAttempted: string[];
}

export interface MasteryGoal {
  skillArea: string;
  currentLevel: number;
  targetLevel: number;
  timeline: number;
  milestones: Milestone[];
  priority: number;
  dependencies: string[];
}

export interface Milestone {
  level: number;
  criteria: string[];
  estimatedTime: number;
  rewards: string[];
}

export interface OptimizationIntervention {
  timestamp: number;
  type: InterventionType;
  reasoning: string;
  targetMetric: string;
  expectedImpact: number;
  actualImpact?: number;
  success: boolean;
  sideEffects: string[];
}

export type InterventionType = 
  | 'difficulty_adjustment' 
  | 'pacing_modification' 
  | 'challenge_type_change' 
  | 'support_addition' 
  | 'motivation_boost' 
  | 'plateau_intervention';

export interface CurveOptimizationConfig {
  targetEngagement: number;
  maxFrustrationThreshold: number;
  plateauDetectionWindow: number;
  masteryThreshold: number;
  adaptationSensitivity: number;
  progressionAggression: number;
  safetyMargin: number;
}

export interface OptimizationAnalytics {
  playerId: string;
  optimizationEffectiveness: number;
  progressionRate: number;
  engagementTrend: TrendAnalysis;
  skillDevelopmentRate: Record<string, number>;
  plateauFrequency: number;
  interventionSuccessRate: number;
  timeToMastery: Record<string, number>;
  optimalDifficultyRange: { min: number; max: number };
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: number;
  consistency: number;
  prediction: number;
  confidence: number;
}

export interface CurveRecommendation {
  type: RecommendationType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rationale: string;
  implementation: ImplementationPlan;
  expectedOutcome: ExpectedOutcome;
  riskAssessment: RiskAssessment;
}

export type RecommendationType = 
  | 'progression_acceleration' 
  | 'progression_deceleration' 
  | 'plateau_intervention' 
  | 'mastery_consolidation' 
  | 'motivation_enhancement' 
  | 'stress_reduction' 
  | 'challenge_diversification';

export interface ImplementationPlan {
  steps: ImplementationStep[];
  timeline: number;
  resources: string[];
  monitoring: string[];
  successMetrics: string[];
}

export interface ImplementationStep {
  step: number;
  action: string;
  parameters: Record<string, any>;
  duration: number;
  validation: string[];
}

export interface ExpectedOutcome {
  primaryBenefit: string;
  secondaryBenefits: string[];
  timeToEffect: number;
  sustainabilityPeriod: number;
  measurableMetrics: string[];
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  mitigationStrategies: string[];
  rollbackPlan: string;
  monitoringRequirements: string[];
}

export class DifficultyCurveOptimizer extends EventEmitter {
  private difficultySystem: GameDifficultySystem;
  private dynamicAdjuster: DynamicDifficultyAdjuster;
  private challengeAssessment: ChallengeAssessmentSystem;
  
  private playerProgressions: Map<string, DifficultyProgression> = new Map();
  private optimizationConfig: CurveOptimizationConfig;
  private optimizationAnalytics: Map<string, OptimizationAnalytics> = new Map();
  
  private optimizationInterval: NodeJS.Timeout | null = null;
  private isOptimizing: boolean = false;
  private optimizationFrequency: number = 300000; // 5 minutes

  constructor(
    difficultySystem: GameDifficultySystem,
    dynamicAdjuster: DynamicDifficultyAdjuster,
    challengeAssessment: ChallengeAssessmentSystem,
    config?: Partial<CurveOptimizationConfig>
  ) {
    super();
    
    this.difficultySystem = difficultySystem;
    this.dynamicAdjuster = dynamicAdjuster;
    this.challengeAssessment = challengeAssessment;
    
    this.optimizationConfig = {
      targetEngagement: 0.75,
      maxFrustrationThreshold: 0.6,
      plateauDetectionWindow: 1800000, // 30 minutes
      masteryThreshold: 0.85,
      adaptationSensitivity: 0.7,
      progressionAggression: 0.5,
      safetyMargin: 0.1,
      ...config
    };
  }

  public async startOptimization(): Promise<void> {
    try {
      if (this.isOptimizing) {
        this.emit('warning', { message: 'Optimization already running' });
        return;
      }

      this.isOptimizing = true;
      
      this.optimizationInterval = setInterval(async () => {
        await this.performOptimizationCycle();
      }, this.optimizationFrequency);

      this.emit('optimization_started');

    } catch (error) {
      this.emit('error', { type: 'optimization_start_failed', error });
      throw error;
    }
  }

  public stopOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    
    this.isOptimizing = false;
    this.emit('optimization_stopped');
  }

  public async initializePlayerProgression(
    playerId: string,
    playerProfile: PlayerDifficultyProfile,
    gameState: GameState
  ): Promise<DifficultyProgression> {
    try {
      const initialPoint = await this.createProgressionPoint(playerId, playerProfile, gameState);
      const targetProgression = await this.generateTargetProgression(playerProfile);
      const masteryGoals = await this.generateMasteryGoals(playerProfile);

      const progression: DifficultyProgression = {
        playerId,
        progressionPath: [initialPoint],
        targetProgression,
        currentOptimization: {
          phase: 'assessment',
          targetDifficulty: playerProfile.skillAssessment.overallSkill,
          adjustmentStrategy: this.createInitialStrategy(playerProfile),
          confidence: 0.5,
          remainingSteps: 10,
          interventionHistory: []
        },
        learningVelocity: this.calculateInitialLearningVelocity(playerProfile),
        plateauHistory: [],
        masteryGoals
      };

      this.playerProgressions.set(playerId, progression);
      
      this.emit('player_progression_initialized', { playerId, progression });

      return progression;

    } catch (error) {
      this.emit('error', { type: 'progression_initialization_failed', error });
      throw error;
    }
  }

  public async updatePlayerProgression(
    playerId: string,
    assessments: ChallengeAssessment[],
    gameState: GameState
  ): Promise<void> {
    try {
      const progression = this.playerProgressions.get(playerId);
      if (!progression) {
        this.emit('warning', { message: `No progression found for player: ${playerId}` });
        return;
      }

      const playerProfile = this.difficultySystem.getPlayerProfile(playerId);
      if (!playerProfile) return;

      // 创建新的进度点
      const newPoint = await this.createProgressionPoint(playerId, playerProfile, gameState);
      progression.progressionPath.push(newPoint);

      // 限制历史记录大小
      if (progression.progressionPath.length > 100) {
        progression.progressionPath = progression.progressionPath.slice(-100);
      }

      // 更新学习速度
      progression.learningVelocity = this.calculateLearningVelocity(progression.progressionPath);

      // 检测平台期
      await this.detectAndRecordPlateaus(progression);

      // 更新掌握目标进度
      this.updateMasteryGoalProgress(progression, assessments);

      // 分析优化需求
      const optimizationNeeds = await this.analyzeOptimizationNeeds(progression);
      
      if (optimizationNeeds.length > 0) {
        await this.planOptimizationInterventions(progression, optimizationNeeds);
      }

      this.emit('player_progression_updated', { playerId, progression });

    } catch (error) {
      this.emit('error', { type: 'progression_update_failed', error, playerId });
    }
  }

  public async optimizeDifficultyCurve(playerId: string): Promise<CurveRecommendation[]> {
    try {
      const progression = this.playerProgressions.get(playerId);
      if (!progression) {
        throw new Error(`No progression found for player: ${playerId}`);
      }

      const analytics = await this.generateOptimizationAnalytics(progression);
      const recommendations = await this.generateOptimizationRecommendations(progression, analytics);

      this.optimizationAnalytics.set(playerId, analytics);

      this.emit('curve_optimized', { playerId, recommendations, analytics });

      return recommendations;

    } catch (error) {
      this.emit('error', { type: 'curve_optimization_failed', error, playerId });
      throw error;
    }
  }

  private async performOptimizationCycle(): Promise<void> {
    try {
      for (const [playerId, progression] of this.playerProgressions) {
        await this.optimizePlayerCurve(playerId, progression);
      }
    } catch (error) {
      this.emit('error', { type: 'optimization_cycle_failed', error });
    }
  }

  private async optimizePlayerCurve(playerId: string, progression: DifficultyProgression): Promise<void> {
    try {
      // 分析当前状态
      const currentState = this.analyzeCurrentProgressionState(progression);
      
      // 确定优化阶段
      const nextPhase = this.determineOptimizationPhase(progression, currentState);
      
      if (nextPhase !== progression.currentOptimization.phase) {
        progression.currentOptimization.phase = nextPhase;
        this.emit('optimization_phase_changed', { playerId, phase: nextPhase });
      }

      // 执行阶段特定的优化
      await this.executePhaseOptimization(progression, nextPhase);

      // 评估优化效果
      const effectiveness = this.evaluateOptimizationEffectiveness(progression);
      
      if (effectiveness < 0.5) {
        await this.adjustOptimizationStrategy(progression);
      }

    } catch (error) {
      this.emit('error', { type: 'player_curve_optimization_failed', error, playerId });
    }
  }

  private async createProgressionPoint(
    playerId: string,
    playerProfile: PlayerDifficultyProfile,
    gameState: GameState
  ): Promise<ProgressionPoint> {
    const currentTime = Date.now();
    
    // 获取当前难度水平
    const currentLevel = this.difficultySystem.getDifficultyLevel(playerProfile.currentDifficulty);
    const difficultyLevel = currentLevel?.numericValue || 5;

    // 计算表现分数
    const recentPerformance = this.getRecentPerformanceScores(playerId);
    const performanceScore = recentPerformance.length > 0 
      ? recentPerformance.reduce((sum, score) => sum + score, 0) / recentPerformance.length
      : 0.5;

    // 计算参与度和挫折感
    const engagementLevel = this.calculateCurrentEngagement(playerId);
    const frustrationLevel = this.calculateCurrentFrustration(playerId);

    // 计算掌握指标
    const masteryIndicators = this.calculateMasteryIndicators(playerProfile, gameState);

    // 分析上下文因素
    const contextualFactors = this.analyzeContextualFactors(gameState);

    return {
      timestamp: currentTime,
      difficultyLevel,
      skillLevels: { ...playerProfile.skillAssessment },
      performanceScore,
      engagementLevel,
      frustrationLevel,
      masteryIndicators,
      contextualFactors
    };
  }

  private async generateTargetProgression(playerProfile: PlayerDifficultyProfile): Promise<ProgressionPoint[]> {
    const targetPoints: ProgressionPoint[] = [];
    const currentSkill = playerProfile.skillAssessment.overallSkill;
    const learningRate = playerProfile.adaptationData.learningRate;
    
    // 生成未来6个月的目标进度点
    for (let weeks = 1; weeks <= 24; weeks++) {
      const targetSkillGrowth = this.calculateExpectedSkillGrowth(currentSkill, learningRate, weeks);
      const targetDifficulty = Math.min(10, currentSkill + targetSkillGrowth);
      
      targetPoints.push({
        timestamp: Date.now() + weeks * 7 * 24 * 60 * 60 * 1000,
        difficultyLevel: targetDifficulty,
        skillLevels: this.projectSkillLevels(playerProfile.skillAssessment, weeks, learningRate),
        performanceScore: Math.min(0.9, 0.6 + targetSkillGrowth * 0.1),
        engagementLevel: this.optimizationConfig.targetEngagement,
        frustrationLevel: Math.max(0.1, this.optimizationConfig.maxFrustrationThreshold - 0.2),
        masteryIndicators: this.projectMasteryIndicators(playerProfile, weeks),
        contextualFactors: []
      });
    }

    return targetPoints;
  }

  private async generateMasteryGoals(playerProfile: PlayerDifficultyProfile): Promise<MasteryGoal[]> {
    const goals: MasteryGoal[] = [];
    
    for (const [skillName, currentLevel] of Object.entries(playerProfile.skillAssessment)) {
      if (currentLevel < 8) { // 还有提升空间
        const targetLevel = Math.min(10, currentLevel + 3);
        const timeline = this.estimateMasteryTimeline(currentLevel, targetLevel, playerProfile.adaptationData.learningRate);
        
        goals.push({
          skillArea: skillName,
          currentLevel,
          targetLevel,
          timeline,
          milestones: this.generateSkillMilestones(currentLevel, targetLevel),
          priority: this.calculateSkillPriority(skillName, playerProfile),
          dependencies: this.identifySkillDependencies(skillName)
        });
      }
    }

    return goals.sort((a, b) => b.priority - a.priority);
  }

  private createInitialStrategy(playerProfile: PlayerDifficultyProfile): AdjustmentStrategy {
    const learningRate = playerProfile.adaptationData.learningRate;
    const overallSkill = playerProfile.skillAssessment.overallSkill;
    
    return {
      type: overallSkill < 4 ? 'gradual_linear' : 'adaptive_spiral',
      parameters: {
        incrementSize: 0.2 + learningRate * 0.3,
        timeInterval: Math.max(300000, 900000 - learningRate * 300000), // 5-15分钟
        smoothingFactor: 0.7,
        adaptationRate: learningRate,
        maxAdjustmentPerStep: 0.5,
        consolidationPeriod: 1800000, // 30分钟
        riskTolerance: 0.3 + playerProfile.preferences.competitivenessLevel * 0.4
      },
      successCriteria: [
        { metric: 'engagement', threshold: 0.7, evaluationWindow: 600000, weight: 0.4 },
        { metric: 'performance', threshold: 0.6, evaluationWindow: 900000, weight: 0.4 },
        { metric: 'frustration', threshold: 0.5, evaluationWindow: 300000, weight: 0.2 }
      ],
      fallbackStrategies: [
        {
          condition: 'high_frustration',
          strategy: 'gradual_linear',
          parameters: { incrementSize: 0.1 },
          priority: 1
        }
      ],
      timeframe: 3600000 // 1小时
    };
  }

  private calculateInitialLearningVelocity(playerProfile: PlayerDifficultyProfile): number {
    const baseVelocity = playerProfile.adaptationData.learningRate;
    const skillFactor = playerProfile.skillAssessment.adaptability / 10;
    const motivationFactor = (playerProfile.preferences.learningOrientation + 
                             playerProfile.preferences.achievementOrientation) / 2;
    
    return baseVelocity * (0.5 + skillFactor * 0.3 + motivationFactor * 0.2);
  }

  private calculateLearningVelocity(progressionPath: ProgressionPoint[]): number {
    if (progressionPath.length < 3) return 0.1;

    const recent = progressionPath.slice(-5);
    const skillGrowths: number[] = [];

    for (let i = 1; i < recent.length; i++) {
      const timeElapsed = recent[i].timestamp - recent[i-1].timestamp;
      const skillGrowth = Object.values(recent[i].skillLevels).reduce((sum, level) => sum + level, 0) -
                          Object.values(recent[i-1].skillLevels).reduce((sum, level) => sum + level, 0);
      
      if (timeElapsed > 0) {
        skillGrowths.push(skillGrowth / (timeElapsed / 3600000)); // 每小时的技能增长
      }
    }

    return skillGrowths.length > 0 
      ? skillGrowths.reduce((sum, growth) => sum + growth, 0) / skillGrowths.length
      : 0.1;
  }

  private async detectAndRecordPlateaus(progression: DifficultyProgression): Promise<void> {
    const recentPoints = progression.progressionPath.slice(-10);
    if (recentPoints.length < 5) return;

    const isInPlateau = this.detectPlateau(recentPoints);
    const currentPlateau = progression.plateauHistory.find(p => !p.endTime);

    if (isInPlateau && !currentPlateau) {
      // 开始新的平台期
      const plateau: PlateauRecord = {
        startTime: Date.now(),
        difficultyLevel: recentPoints[recentPoints.length - 1].difficultyLevel,
        duration: 0,
        breakoutStrategy: '',
        breakoutSuccess: false,
        skillsStagnant: this.identifyStagnantSkills(recentPoints),
        interventionsAttempted: []
      };
      
      progression.plateauHistory.push(plateau);
      
      this.emit('plateau_detected', { 
        playerId: progression.playerId, 
        plateau 
      });
      
    } else if (!isInPlateau && currentPlateau) {
      // 结束平台期
      currentPlateau.endTime = Date.now();
      currentPlateau.duration = currentPlateau.endTime - currentPlateau.startTime;
      currentPlateau.breakoutSuccess = true;
      
      this.emit('plateau_resolved', { 
        playerId: progression.playerId, 
        plateau: currentPlateau 
      });
    }
  }

  private detectPlateau(points: ProgressionPoint[]): boolean {
    if (points.length < 3) return false;

    // 检查技能增长停滞
    const skillVariances = this.calculateSkillVariances(points);
    const lowVarianceSkills = Object.values(skillVariances).filter(variance => variance < 0.01).length;
    
    // 检查表现分数停滞
    const performanceScores = points.map(p => p.performanceScore);
    const performanceVariance = this.calculateVariance(performanceScores);
    
    // 检查参与度下降
    const engagementScores = points.map(p => p.engagementLevel);
    const engagementTrend = this.calculateTrend(engagementScores);
    
    return lowVarianceSkills >= 3 && 
           performanceVariance < 0.02 && 
           engagementTrend < -0.05;
  }

  private identifyStagnantSkills(points: ProgressionPoint[]): string[] {
    const skillVariances = this.calculateSkillVariances(points);
    return Object.entries(skillVariances)
      .filter(([_, variance]) => variance < 0.01)
      .map(([skill, _]) => skill);
  }

  private calculateSkillVariances(points: ProgressionPoint[]): Record<string, number> {
    const variances: Record<string, number> = {};
    const skillNames = Object.keys(points[0].skillLevels);

    for (const skill of skillNames) {
      const values = points.map(p => p.skillLevels[skill]);
      variances[skill] = this.calculateVariance(values);
    }

    return variances;
  }

  private updateMasteryGoalProgress(progression: DifficultyProgression, assessments: ChallengeAssessment[]): void {
    const currentPoint = progression.progressionPath[progression.progressionPath.length - 1];
    
    for (const goal of progression.masteryGoals) {
      const currentLevel = currentPoint.skillLevels[goal.skillArea] || goal.currentLevel;
      goal.currentLevel = currentLevel;
      
      // 更新里程碑进度
      for (const milestone of goal.milestones) {
        if (currentLevel >= milestone.level && !milestone.criteria.every(c => this.checkMilestoneCriteria(c, assessments))) {
          // 里程碑达成逻辑
        }
      }
    }
  }

  private async analyzeOptimizationNeeds(progression: DifficultyProgression): Promise<OptimizationNeed[]> {
    const needs: OptimizationNeed[] = [];
    const currentPoint = progression.progressionPath[progression.progressionPath.length - 1];

    // 检查挫折感过高
    if (currentPoint.frustrationLevel > this.optimizationConfig.maxFrustrationThreshold) {
      needs.push({
        type: 'frustration_reduction',
        urgency: 'high',
        description: 'Player showing high frustration levels',
        recommendedActions: ['reduce_difficulty', 'add_support', 'change_challenge_type']
      });
    }

    // 检查参与度过低
    if (currentPoint.engagementLevel < this.optimizationConfig.targetEngagement * 0.8) {
      needs.push({
        type: 'engagement_boost',
        urgency: 'medium',
        description: 'Player engagement below target threshold',
        recommendedActions: ['increase_variety', 'add_rewards', 'adjust_pacing']
      });
    }

    // 检查平台期
    const activePlateau = progression.plateauHistory.find(p => !p.endTime);
    if (activePlateau && Date.now() - activePlateau.startTime > this.optimizationConfig.plateauDetectionWindow) {
      needs.push({
        type: 'plateau_intervention',
        urgency: 'high',
        description: 'Player stuck in learning plateau',
        recommendedActions: ['breakthrough_challenge', 'skill_focus', 'motivation_boost']
      });
    }

    return needs;
  }

  private async planOptimizationInterventions(progression: DifficultyProgression, needs: OptimizationNeed[]): Promise<void> {
    for (const need of needs) {
      const intervention = await this.createOptimizationIntervention(progression, need);
      progression.currentOptimization.interventionHistory.push(intervention);
      
      this.emit('optimization_intervention_planned', {
        playerId: progression.playerId,
        intervention,
        need
      });
    }
  }

  private async createOptimizationIntervention(progression: DifficultyProgression, need: OptimizationNeed): Promise<OptimizationIntervention> {
    return {
      timestamp: Date.now(),
      type: this.mapNeedToInterventionType(need.type),
      reasoning: need.description,
      targetMetric: this.getTargetMetricForNeed(need.type),
      expectedImpact: this.estimateInterventionImpact(need),
      success: false,
      sideEffects: []
    };
  }

  // 计算和分析方法
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    let trend = 0;
    for (let i = 1; i < values.length; i++) {
      trend += values[i] - values[i-1];
    }
    
    return trend / (values.length - 1);
  }

  private getRecentPerformanceScores(playerId: string): number[] {
    const assessments = this.challengeAssessment.getPlayerAssessmentHistory(playerId, 10);
    return assessments.map(a => a.performance.overallScore);
  }

  private calculateCurrentEngagement(playerId: string): number {
    const assessments = this.challengeAssessment.getPlayerAssessmentHistory(playerId, 5);
    if (assessments.length === 0) return 0.5;
    
    const avgEngagement = assessments.reduce((sum, a) => sum + a.engagement.attentionLevel, 0) / assessments.length;
    return avgEngagement;
  }

  private calculateCurrentFrustration(playerId: string): number {
    const assessments = this.challengeAssessment.getPlayerAssessmentHistory(playerId, 5);
    if (assessments.length === 0) return 0.3;
    
    const avgFrustration = assessments.reduce((sum, a) => sum + a.engagement.frustractionLevel, 0) / assessments.length;
    return avgFrustration;
  }

  private calculateMasteryIndicators(playerProfile: PlayerDifficultyProfile, gameState: GameState): Record<string, number> {
    const indicators: Record<string, number> = {};
    
    for (const [skillName, skillLevel] of Object.entries(playerProfile.skillAssessment)) {
      indicators[skillName] = Math.min(1, skillLevel / 8); // 8分以上认为接近掌握
    }
    
    return indicators;
  }

  private analyzeContextualFactors(gameState: GameState): ContextualFactor[] {
    return [
      {
        type: 'game_phase',
        value: this.getGamePhaseValue(gameState),
        impact: 0.2,
        description: 'Current game phase influence'
      },
      {
        type: 'player_count',
        value: gameState.players.length / 4, // 假设最大4人
        impact: 0.1,
        description: 'Number of players effect'
      }
    ];
  }

  private getGamePhaseValue(gameState: GameState): number {
    // 简化的游戏阶段计算
    if (gameState.round < 10) return 0.2; // 早期
    if (gameState.round < 30) return 0.5; // 中期
    return 0.8; // 后期
  }

  // 更多辅助方法...
  private calculateExpectedSkillGrowth(currentSkill: number, learningRate: number, weeks: number): number {
    return learningRate * Math.log(1 + weeks) * (10 - currentSkill) / 10;
  }

  private projectSkillLevels(currentSkills: Record<string, number>, weeks: number, learningRate: number): Record<string, number> {
    const projected: Record<string, number> = {};
    
    for (const [skill, level] of Object.entries(currentSkills)) {
      const growth = this.calculateExpectedSkillGrowth(level, learningRate, weeks);
      projected[skill] = Math.min(10, level + growth);
    }
    
    return projected;
  }

  private projectMasteryIndicators(playerProfile: PlayerDifficultyProfile, weeks: number): Record<string, number> {
    const indicators: Record<string, number> = {};
    
    for (const [skill, level] of Object.entries(playerProfile.skillAssessment)) {
      const projectedLevel = level + weeks * 0.1; // 简化投影
      indicators[skill] = Math.min(1, projectedLevel / 8);
    }
    
    return indicators;
  }

  private estimateMasteryTimeline(currentLevel: number, targetLevel: number, learningRate: number): number {
    const skillGap = targetLevel - currentLevel;
    const weeklyGrowth = learningRate * 0.5; // 假设每周增长
    return Math.ceil(skillGap / weeklyGrowth) * 7 * 24 * 60 * 60 * 1000; // 毫秒
  }

  private generateSkillMilestones(currentLevel: number, targetLevel: number): Milestone[] {
    const milestones: Milestone[] = [];
    const steps = Math.ceil((targetLevel - currentLevel) / 0.5);
    
    for (let i = 1; i <= steps; i++) {
      const level = currentLevel + (i * 0.5);
      milestones.push({
        level,
        criteria: [`Achieve ${level.toFixed(1)} skill level`],
        estimatedTime: i * 7 * 24 * 60 * 60 * 1000,
        rewards: [`Level ${level.toFixed(1)} achievement`]
      });
    }
    
    return milestones;
  }

  private calculateSkillPriority(skillName: string, playerProfile: PlayerDifficultyProfile): number {
    // 基于技能在偏好挑战类型中的重要性
    return 0.5;
  }

  private identifySkillDependencies(skillName: string): string[] {
    const dependencies: Record<string, string[]> = {
      'strategicPlanning': ['economicManagement'],
      'socialInteraction': ['adaptability'],
      'riskAssessment': ['economicManagement', 'pattern_recognition']
    };
    
    return dependencies[skillName] || [];
  }

  private analyzeCurrentProgressionState(progression: DifficultyProgression): any {
    return {
      recentProgress: progression.progressionPath.slice(-5),
      learningVelocity: progression.learningVelocity,
      hasActivePlateau: progression.plateauHistory.some(p => !p.endTime)
    };
  }

  private determineOptimizationPhase(progression: DifficultyProgression, state: any): OptimizationPhase {
    if (state.hasActivePlateau) return 'plateau_breaking';
    if (progression.progressionPath.length < 5) return 'assessment';
    if (state.learningVelocity > 0.2) return 'gradual_increase';
    return 'adaptive_maintenance';
  }

  private async executePhaseOptimization(progression: DifficultyProgression, phase: OptimizationPhase): Promise<void> {
    switch (phase) {
      case 'assessment':
        await this.executeAssessmentPhase(progression);
        break;
      case 'gradual_increase':
        await this.executeGradualIncreasePhase(progression);
        break;
      case 'plateau_breaking':
        await this.executePlateauBreakingPhase(progression);
        break;
      // 其他阶段...
    }
  }

  private async executeAssessmentPhase(progression: DifficultyProgression): Promise<void> {
    // 实现评估阶段逻辑
  }

  private async executeGradualIncreasePhase(progression: DifficultyProgression): Promise<void> {
    // 实现渐进增加阶段逻辑
  }

  private async executePlateauBreakingPhase(progression: DifficultyProgression): Promise<void> {
    // 实现平台期突破阶段逻辑
  }

  private evaluateOptimizationEffectiveness(progression: DifficultyProgression): number {
    // 评估优化效果
    return 0.7;
  }

  private async adjustOptimizationStrategy(progression: DifficultyProgression): Promise<void> {
    // 调整优化策略
  }

  private async generateOptimizationAnalytics(progression: DifficultyProgression): Promise<OptimizationAnalytics> {
    return {
      playerId: progression.playerId,
      optimizationEffectiveness: 0.7,
      progressionRate: progression.learningVelocity,
      engagementTrend: { direction: 'stable', strength: 0.5, consistency: 0.8, prediction: 0.6, confidence: 0.7 },
      skillDevelopmentRate: {},
      plateauFrequency: progression.plateauHistory.length,
      interventionSuccessRate: 0.8,
      timeToMastery: {},
      optimalDifficultyRange: { min: 4, max: 8 }
    };
  }

  private async generateOptimizationRecommendations(progression: DifficultyProgression, analytics: OptimizationAnalytics): Promise<CurveRecommendation[]> {
    return [];
  }

  private checkMilestoneCriteria(criteria: string, assessments: ChallengeAssessment[]): boolean {
    return true;
  }

  private mapNeedToInterventionType(needType: string): InterventionType {
    const mapping: Record<string, InterventionType> = {
      'frustration_reduction': 'difficulty_adjustment',
      'engagement_boost': 'motivation_boost',
      'plateau_intervention': 'plateau_intervention'
    };
    return mapping[needType] || 'difficulty_adjustment';
  }

  private getTargetMetricForNeed(needType: string): string {
    const mapping: Record<string, string> = {
      'frustration_reduction': 'frustration_level',
      'engagement_boost': 'engagement_level',
      'plateau_intervention': 'skill_growth'
    };
    return mapping[needType] || 'performance';
  }

  private estimateInterventionImpact(need: OptimizationNeed): number {
    const impactMapping: Record<string, number> = {
      'frustration_reduction': 0.3,
      'engagement_boost': 0.4,
      'plateau_intervention': 0.6
    };
    return impactMapping[need.type] || 0.3;
  }

  // 公共接口方法
  public getPlayerProgression(playerId: string): DifficultyProgression | undefined {
    return this.playerProgressions.get(playerId);
  }

  public getOptimizationAnalytics(playerId: string): OptimizationAnalytics | undefined {
    return this.optimizationAnalytics.get(playerId);
  }

  public isOptimizerRunning(): boolean {
    return this.isOptimizing;
  }

  public updateOptimizationConfig(newConfig: Partial<CurveOptimizationConfig>): void {
    this.optimizationConfig = { ...this.optimizationConfig, ...newConfig };
    this.emit('config_updated', { config: this.optimizationConfig });
  }
}

// 相关接口定义
interface OptimizationNeed {
  type: string;
  urgency: 'low' | 'medium' | 'high';
  description: string;
  recommendedActions: string[];
}