import { PlayerSkillMetrics } from './DifficultyAnalyzer';
import { ExperienceMetrics } from './GameExperienceMonitor';
import { DifficultyMetrics } from './DifficultyAnalyzer';

export interface FlowIndicators {
  skillChallengeBalance: number;
  concentration: number;
  timeDistortion: number;
  intrinsicMotivation: number;
  selfConsciousness: number;
  autotelic: number;
  controlSense: number;
  clearGoals: number;
  immediateFeedback: number;
}

export interface FlowStateMetrics {
  overallFlowScore: number;
  flowIndicators: FlowIndicators;
  flowPhase: 'entering' | 'in_flow' | 'maintaining' | 'declining' | 'lost';
  flowStability: number;
  flowDuration: number;
  flowQuality: 'shallow' | 'moderate' | 'deep' | 'optimal';
  flowTrends: {
    direction: 'improving' | 'stable' | 'declining';
    velocity: number;
    acceleration: number;
  };
}

export interface FlowOptimizationSuggestion {
  type: 'difficulty_adjustment' | 'challenge_modification' | 'feedback_enhancement' | 'goal_clarification' | 'distraction_reduction';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  targetIndicator: keyof FlowIndicators;
  expectedImpact: number;
  implementationComplexity: 'simple' | 'moderate' | 'complex';
  timeToEffect: number;
}

export interface FlowAnalysisResult {
  currentFlow: FlowStateMetrics;
  flowHistory: FlowStateMetrics[];
  optimizationSuggestions: FlowOptimizationSuggestion[];
  predictionModel: {
    predictedFlowIn5Minutes: number;
    predictedFlowIn15Minutes: number;
    flowRiskFactors: string[];
    flowOpportunities: string[];
  };
  actionableInsights: {
    immediateActions: string[];
    strategicRecommendations: string[];
    preventative措施: string[];
  };
}

export interface FlowDetectionConfig {
  sensitivityLevel: 'low' | 'medium' | 'high' | 'adaptive';
  detectionFrequency: number;
  historicalDataWindow: number;
  adaptationSpeed: number;
  flowThresholds: {
    entering: number;
    maintaining: number;
    optimal: number;
    declining: number;
  };
}

export class FlowStateDetector {
  private flowHistory: Map<string, FlowStateMetrics[]> = new Map();
  private config: FlowDetectionConfig;
  private detectionIntervals: Map<string, NodeJS.Timeout> = new Map();
  private flowPredictionModels: Map<string, any> = new Map();
  private lastFlowUpdate: Map<string, number> = new Map();

  constructor(config: FlowDetectionConfig = {
    sensitivityLevel: 'adaptive',
    detectionFrequency: 30000,
    historicalDataWindow: 20,
    adaptationSpeed: 0.1,
    flowThresholds: {
      entering: 0.3,
      maintaining: 0.5,
      optimal: 0.8,
      declining: 0.4
    }
  }) {
    this.config = config;
  }

  public startFlowDetection(playerId: string): void {
    if (this.detectionIntervals.has(playerId)) {
      this.stopFlowDetection(playerId);
    }

    const interval = setInterval(async () => {
      await this.detectCurrentFlowState(playerId);
    }, this.config.detectionFrequency);

    this.detectionIntervals.set(playerId, interval);
    
    if (!this.flowHistory.has(playerId)) {
      this.flowHistory.set(playerId, []);
    }
  }

  public stopFlowDetection(playerId: string): void {
    const interval = this.detectionIntervals.get(playerId);
    if (interval) {
      clearInterval(interval);
      this.detectionIntervals.delete(playerId);
    }
  }

  private async detectCurrentFlowState(playerId: string): Promise<FlowStateMetrics> {
    const gameData = await this.getPlayerGameData(playerId);
    const performanceData = await this.getPlayerPerformanceData(playerId);
    const experienceData = await this.getPlayerExperienceData(playerId);

    const flowIndicators = this.calculateFlowIndicators(
      gameData.playerSkill,
      gameData.difficulty,
      experienceData
    );

    const flowMetrics = this.synthesizeFlowMetrics(playerId, flowIndicators);
    
    this.updateFlowHistory(playerId, flowMetrics);
    this.updatePredictionModel(playerId, flowMetrics);
    
    return flowMetrics;
  }

  private calculateFlowIndicators(
    playerSkill: PlayerSkillMetrics,
    difficulty: DifficultyMetrics,
    experience: ExperienceMetrics
  ): FlowIndicators {
    const skillChallengeBalance = this.calculateSkillChallengeBalance(playerSkill, difficulty);
    const concentration = this.calculateConcentration(experience);
    const timeDistortion = this.calculateTimeDistortion(experience);
    const intrinsicMotivation = this.calculateIntrinsicMotivation(experience);
    const selfConsciousness = 1 - experience.anxiety - experience.selfDoubt;
    const autotelic = experience.enjoyment * experience.satisfaction;
    const controlSense = this.calculateControlSense(playerSkill, experience);
    const clearGoals = experience.goalClarity || 0.7;
    const immediateFeedback = experience.feedbackQuality || 0.8;

    return {
      skillChallengeBalance,
      concentration,
      timeDistortion,
      intrinsicMotivation,
      selfConsciousness: Math.max(0, Math.min(1, selfConsciousness)),
      autotelic: Math.max(0, Math.min(1, autotelic)),
      controlSense,
      clearGoals,
      immediateFeedback
    };
  }

  private calculateSkillChallengeBalance(skill: PlayerSkillMetrics, difficulty: DifficultyMetrics): number {
    const skillLevel = (
      skill.decisionSpeed * 0.15 +
      skill.strategicThinking * 0.2 +
      skill.riskManagement * 0.15 +
      skill.resourceManagement * 0.15 +
      skill.adaptability * 0.15 +
      skill.socialIntelligence * 0.1 +
      skill.gameKnowledge * 0.1
    );

    const challengeLevel = (
      difficulty.gameComplexity * 0.3 +
      difficulty.opponentStrength * 0.25 +
      difficulty.timeConstraints * 0.15 +
      difficulty.informationAvailability * 0.1 +
      difficulty.randomnessLevel * 0.1 +
      difficulty.socialComplexity * 0.1
    );

    const balance = 1 - Math.abs(skillLevel - challengeLevel);
    return Math.max(0, Math.min(1, balance));
  }

  private calculateConcentration(experience: ExperienceMetrics): number {
    const concentrationFactors = [
      experience.engagement,
      1 - experience.distraction,
      experience.focus,
      1 - experience.mentalFatigue
    ];

    return concentrationFactors.reduce((sum, factor) => sum + (factor || 0.5), 0) / concentrationFactors.length;
  }

  private calculateTimeDistortion(experience: ExperienceMetrics): number {
    const timePerception = experience.timePerceptionDistortion || 0.5;
    const immersion = experience.immersion || 0.5;
    
    return (timePerception + immersion) / 2;
  }

  private calculateIntrinsicMotivation(experience: ExperienceMetrics): number {
    const motivationFactors = [
      experience.enjoyment,
      experience.curiosity,
      experience.autonomy,
      experience.mastery,
      experience.purpose
    ];

    return motivationFactors.reduce((sum, factor) => sum + (factor || 0.5), 0) / motivationFactors.length;
  }

  private calculateControlSense(skill: PlayerSkillMetrics, experience: ExperienceMetrics): number {
    const skillConfidence = (skill.confidence || 0.5);
    const performanceSatisfaction = experience.satisfaction;
    const challengeManagement = 1 - (experience.overwhelm || 0);

    return (skillConfidence + performanceSatisfaction + challengeManagement) / 3;
  }

  private synthesizeFlowMetrics(playerId: string, indicators: FlowIndicators): FlowStateMetrics {
    const overallFlowScore = this.calculateOverallFlowScore(indicators);
    const flowPhase = this.determineFlowPhase(playerId, overallFlowScore);
    const flowStability = this.calculateFlowStability(playerId, overallFlowScore);
    const flowDuration = this.calculateFlowDuration(playerId);
    const flowQuality = this.determineFlowQuality(overallFlowScore, indicators);
    const flowTrends = this.calculateFlowTrends(playerId, overallFlowScore);

    return {
      overallFlowScore,
      flowIndicators: indicators,
      flowPhase,
      flowStability,
      flowDuration,
      flowQuality,
      flowTrends
    };
  }

  private calculateOverallFlowScore(indicators: FlowIndicators): number {
    const weights = {
      skillChallengeBalance: 0.25,
      concentration: 0.15,
      timeDistortion: 0.1,
      intrinsicMotivation: 0.15,
      selfConsciousness: 0.1,
      autotelic: 0.1,
      controlSense: 0.1,
      clearGoals: 0.025,
      immediateFeedback: 0.025
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [indicator, weight] of Object.entries(weights)) {
      const value = indicators[indicator as keyof FlowIndicators];
      weightedSum += value * weight;
      totalWeight += weight;
    }

    return weightedSum / totalWeight;
  }

  private determineFlowPhase(playerId: string, currentFlowScore: number): FlowStateMetrics['flowPhase'] {
    const history = this.flowHistory.get(playerId) || [];
    const thresholds = this.config.flowThresholds;

    if (history.length === 0) {
      if (currentFlowScore >= thresholds.entering) return 'entering';
      return 'lost';
    }

    const lastFlow = history[history.length - 1];
    const trend = currentFlowScore - lastFlow.overallFlowScore;

    if (currentFlowScore >= thresholds.optimal) {
      return trend >= 0 ? 'maintaining' : 'declining';
    } else if (currentFlowScore >= thresholds.maintaining) {
      return trend > 0 ? 'entering' : 'maintaining';
    } else if (currentFlowScore >= thresholds.entering) {
      return trend > 0 ? 'entering' : 'declining';
    } else {
      return 'lost';
    }
  }

  private calculateFlowStability(playerId: string, currentScore: number): number {
    const history = this.flowHistory.get(playerId) || [];
    if (history.length < 3) return 0.5;

    const recentScores = [...history.slice(-5).map(h => h.overallFlowScore), currentScore];
    const variance = this.calculateVariance(recentScores);
    
    return Math.max(0, Math.min(1, 1 - variance));
  }

  private calculateFlowDuration(playerId: string): number {
    const history = this.flowHistory.get(playerId) || [];
    const thresholds = this.config.flowThresholds;
    
    let duration = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].overallFlowScore >= thresholds.maintaining) {
        duration += this.config.detectionFrequency;
      } else {
        break;
      }
    }

    return duration;
  }

  private determineFlowQuality(score: number, indicators: FlowIndicators): FlowStateMetrics['flowQuality'] {
    const keyIndicators = [
      indicators.skillChallengeBalance,
      indicators.concentration,
      indicators.intrinsicMotivation
    ];

    const averageKey = keyIndicators.reduce((sum, val) => sum + val, 0) / keyIndicators.length;

    if (score >= 0.8 && averageKey >= 0.75) return 'optimal';
    if (score >= 0.6 && averageKey >= 0.6) return 'deep';
    if (score >= 0.4 && averageKey >= 0.4) return 'moderate';
    return 'shallow';
  }

  private calculateFlowTrends(playerId: string, currentScore: number): FlowStateMetrics['flowTrends'] {
    const history = this.flowHistory.get(playerId) || [];
    if (history.length < 2) {
      return {
        direction: 'stable',
        velocity: 0,
        acceleration: 0
      };
    }

    const recentScores = [...history.slice(-3).map(h => h.overallFlowScore), currentScore];
    const velocity = this.calculateVelocity(recentScores);
    const acceleration = this.calculateAcceleration(recentScores);

    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    if (velocity > 0.02) direction = 'improving';
    else if (velocity < -0.02) direction = 'declining';

    return { direction, velocity, acceleration };
  }

  public async analyzeFlowState(playerId: string): Promise<FlowAnalysisResult> {
    const currentFlow = await this.detectCurrentFlowState(playerId);
    const flowHistory = this.flowHistory.get(playerId) || [];
    const optimizationSuggestions = this.generateOptimizationSuggestions(currentFlow);
    const predictionModel = this.generateFlowPredictions(playerId, currentFlow);
    const actionableInsights = this.generateActionableInsights(currentFlow, optimizationSuggestions);

    return {
      currentFlow,
      flowHistory,
      optimizationSuggestions,
      predictionModel,
      actionableInsights
    };
  }

  private generateOptimizationSuggestions(flow: FlowStateMetrics): FlowOptimizationSuggestion[] {
    const suggestions: FlowOptimizationSuggestion[] = [];
    const indicators = flow.flowIndicators;

    if (indicators.skillChallengeBalance < 0.6) {
      suggestions.push({
        type: 'difficulty_adjustment',
        priority: 'high',
        description: '调整游戏难度以匹配玩家技能水平',
        targetIndicator: 'skillChallengeBalance',
        expectedImpact: 0.3,
        implementationComplexity: 'moderate',
        timeToEffect: 30
      });
    }

    if (indicators.concentration < 0.5) {
      suggestions.push({
        type: 'distraction_reduction',
        priority: 'medium',
        description: '减少界面干扰元素，增强专注度',
        targetIndicator: 'concentration',
        expectedImpact: 0.2,
        implementationComplexity: 'simple',
        timeToEffect: 5
      });
    }

    if (indicators.intrinsicMotivation < 0.5) {
      suggestions.push({
        type: 'challenge_modification',
        priority: 'high',
        description: '增加有意义的挑战和奖励机制',
        targetIndicator: 'intrinsicMotivation',
        expectedImpact: 0.25,
        implementationComplexity: 'complex',
        timeToEffect: 60
      });
    }

    if (indicators.immediateFeedback < 0.6) {
      suggestions.push({
        type: 'feedback_enhancement',
        priority: 'medium',
        description: '优化实时反馈系统',
        targetIndicator: 'immediateFeedback',
        expectedImpact: 0.15,
        implementationComplexity: 'moderate',
        timeToEffect: 15
      });
    }

    return suggestions.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  private generateFlowPredictions(playerId: string, currentFlow: FlowStateMetrics): FlowAnalysisResult['predictionModel'] {
    const history = this.flowHistory.get(playerId) || [];
    const trends = currentFlow.flowTrends;

    const predictedFlowIn5Minutes = Math.max(0, Math.min(1, 
      currentFlow.overallFlowScore + (trends.velocity * 5) + (trends.acceleration * 12.5)
    ));

    const predictedFlowIn15Minutes = Math.max(0, Math.min(1,
      currentFlow.overallFlowScore + (trends.velocity * 15) + (trends.acceleration * 112.5)
    ));

    const flowRiskFactors: string[] = [];
    const flowOpportunities: string[] = [];

    if (currentFlow.flowIndicators.skillChallengeBalance < 0.4) {
      flowRiskFactors.push('技能挑战不平衡');
    }
    if (currentFlow.flowIndicators.concentration < 0.5) {
      flowRiskFactors.push('专注度不足');
    }
    if (trends.direction === 'declining' && trends.velocity < -0.05) {
      flowRiskFactors.push('流状态快速下降');
    }

    if (currentFlow.flowIndicators.intrinsicMotivation > 0.7) {
      flowOpportunities.push('高内在动机');
    }
    if (currentFlow.flowStability > 0.7) {
      flowOpportunities.push('流状态稳定');
    }
    if (trends.direction === 'improving') {
      flowOpportunities.push('流状态改善趋势');
    }

    return {
      predictedFlowIn5Minutes,
      predictedFlowIn15Minutes,
      flowRiskFactors,
      flowOpportunities
    };
  }

  private generateActionableInsights(
    flow: FlowStateMetrics, 
    suggestions: FlowOptimizationSuggestion[]
  ): FlowAnalysisResult['actionableInsights'] {
    const immediateActions: string[] = [];
    const strategicRecommendations: string[] = [];
    const preventative措施: string[] = [];

    const highPrioritySuggestions = suggestions.filter(s => 
      s.priority === 'high' || s.priority === 'critical'
    );

    for (const suggestion of highPrioritySuggestions) {
      if (suggestion.timeToEffect <= 30) {
        immediateActions.push(suggestion.description);
      } else {
        strategicRecommendations.push(suggestion.description);
      }
    }

    if (flow.flowPhase === 'declining') {
      preventative措施.push('监控流状态下降趋势');
      preventative措施.push('准备应急难度调整');
    }

    if (flow.flowStability < 0.5) {
      preventative措施.push('增强游戏体验稳定性');
    }

    if (flow.overallFlowScore < 0.3) {
      immediateActions.unshift('立即执行流状态恢复程序');
    }

    return {
      immediateActions,
      strategicRecommendations,
      preventative措施
    };
  }

  private updateFlowHistory(playerId: string, flowMetrics: FlowStateMetrics): void {
    if (!this.flowHistory.has(playerId)) {
      this.flowHistory.set(playerId, []);
    }

    const history = this.flowHistory.get(playerId)!;
    history.push(flowMetrics);

    if (history.length > this.config.historicalDataWindow) {
      history.shift();
    }

    this.lastFlowUpdate.set(playerId, Date.now());
  }

  private updatePredictionModel(playerId: string, flowMetrics: FlowStateMetrics): void {
    const history = this.flowHistory.get(playerId) || [];
    if (history.length < 5) return;

    const model = {
      averageFlow: history.reduce((sum, h) => sum + h.overallFlowScore, 0) / history.length,
      volatility: this.calculateVariance(history.map(h => h.overallFlowScore)),
      trendCoefficient: this.calculateTrendCoefficient(history.map(h => h.overallFlowScore)),
      lastUpdate: Date.now()
    };

    this.flowPredictionModels.set(playerId, model);
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private calculateVelocity(values: number[]): number {
    if (values.length < 2) return 0;
    
    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }
    
    return diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
  }

  private calculateAcceleration(values: number[]): number {
    if (values.length < 3) return 0;
    
    const velocities = [];
    for (let i = 1; i < values.length; i++) {
      velocities.push(values[i] - values[i - 1]);
    }
    
    return this.calculateVelocity(velocities);
  }

  private calculateTrendCoefficient(values: number[]): number {
    if (values.length < 3) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = values.reduce((sum, val, index) => sum + (index * index), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private async getPlayerGameData(playerId: string): Promise<any> {
    return {
      playerSkill: {
        decisionSpeed: 0.7,
        strategicThinking: 0.6,
        riskManagement: 0.8,
        resourceManagement: 0.5,
        adaptability: 0.7,
        socialIntelligence: 0.6,
        gameKnowledge: 0.8,
        patternRecognition: 0.7,
        stressManagement: 0.6
      },
      difficulty: {
        gameComplexity: 0.6,
        opponentStrength: 0.7,
        timeConstraints: 0.5,
        informationAvailability: 0.8,
        randomnessLevel: 0.3,
        socialComplexity: 0.6
      }
    };
  }

  private async getPlayerPerformanceData(playerId: string): Promise<any> {
    return {
      recentMoves: [],
      decisionTimes: [],
      successRate: 0.7,
      efficiency: 0.6
    };
  }

  private async getPlayerExperienceData(playerId: string): Promise<ExperienceMetrics> {
    return {
      engagement: 0.7,
      frustration: 0.3,
      satisfaction: 0.8,
      flow: 0.6,
      challenge: 0.7,
      progression: 0.6,
      social: 0.5,
      immersion: 0.8,
      enjoyment: 0.7,
      anxiety: 0.2,
      selfDoubt: 0.3,
      distraction: 0.2,
      focus: 0.8,
      mentalFatigue: 0.3,
      timePerceptionDistortion: 0.6,
      curiosity: 0.7,
      autonomy: 0.8,
      mastery: 0.6,
      purpose: 0.7,
      goalClarity: 0.8,
      feedbackQuality: 0.7,
      overwhelm: 0.2,
      confidence: 0.7
    };
  }

  public getFlowHistory(playerId: string): FlowStateMetrics[] {
    return this.flowHistory.get(playerId) || [];
  }

  public getCurrentFlowScore(playerId: string): number {
    const history = this.flowHistory.get(playerId);
    if (!history || history.length === 0) return 0;
    return history[history.length - 1].overallFlowScore;
  }

  public isInFlowState(playerId: string): boolean {
    const currentScore = this.getCurrentFlowScore(playerId);
    return currentScore >= this.config.flowThresholds.maintaining;
  }

  public cleanup(): void {
    for (const [playerId, interval] of this.detectionIntervals) {
      clearInterval(interval);
    }
    this.detectionIntervals.clear();
    this.flowHistory.clear();
    this.flowPredictionModels.clear();
    this.lastFlowUpdate.clear();
  }
}