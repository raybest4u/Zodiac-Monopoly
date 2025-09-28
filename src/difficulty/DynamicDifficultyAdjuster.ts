import { EventEmitter } from '../utils/EventEmitter';
import type { GameState, Player } from '../types/game';
import { GameDifficultySystem, DifficultyAdjustment, PlayerDifficultyProfile } from './GameDifficultySystem';

export interface AdjustmentRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: AdjustmentCondition[];
  actions: AdjustmentAction[];
  cooldown: number;
  lastTriggered: number;
  enabled: boolean;
}

export interface AdjustmentCondition {
  type: ConditionType;
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration?: number;
  weight: number;
}

export type ConditionType = 
  | 'performance' 
  | 'engagement' 
  | 'frustration' 
  | 'mastery' 
  | 'time_spent' 
  | 'help_seeking' 
  | 'error_rate';

export interface AdjustmentAction {
  type: ActionType;
  target: string;
  modification: ModificationType;
  value: number;
  gradual: boolean;
  duration: number;
  conditions?: string[];
}

export type ActionType = 
  | 'parameter_adjustment' 
  | 'content_modification' 
  | 'assistance_level' 
  | 'feedback_frequency' 
  | 'challenge_type';

export type ModificationType = 
  | 'increase' 
  | 'decrease' 
  | 'multiply' 
  | 'set' 
  | 'adaptive_scale';

export interface RealTimeMetrics {
  playerId: string;
  timestamp: number;
  gameSessionId: string;
  
  // 表现指标
  currentScore: number;
  efficiency: number;
  decisionTime: number;
  errorCount: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  
  // 参与度指标
  actionFrequency: number;
  pauseFrequency: number;
  menuAccess: number;
  helpRequests: number;
  
  // 挫折感指标
  backtrackingCount: number;
  undoActions: number;
  ragequitIndicators: number;
  emotionalState: EmotionalState;
  
  // 学习指标
  improvementRate: number;
  conceptMastery: Record<string, number>;
  skillProgression: Record<string, number>;
  
  // 上下文信息
  gamePhase: string;
  currentChallenge: string;
  timeInSession: number;
  interactionPattern: string;
}

export interface EmotionalState {
  frustration: number;
  confidence: number;
  engagement: number;
  satisfaction: number;
  stress: number;
}

export interface AdjustmentPlan {
  playerId: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  plannedAdjustments: PlannedAdjustment[];
  reasoning: string;
  expectedOutcome: string;
  rollbackPlan: string;
  monitoringMetrics: string[];
}

export interface PlannedAdjustment {
  action: AdjustmentAction;
  sequence: number;
  delay: number;
  preconditions: string[];
  successCriteria: string[];
  failureCriteria: string[];
}

export interface AdjustmentHistory {
  adjustmentId: string;
  playerId: string;
  timestamp: number;
  ruleTrigger: string;
  beforeState: RealTimeMetrics;
  adjustmentsMade: AdjustmentAction[];
  afterState: RealTimeMetrics;
  success: boolean;
  playerResponse: PlayerResponse;
  lessons: string[];
}

export interface PlayerResponse {
  immediateReaction: 'positive' | 'negative' | 'neutral' | 'mixed';
  performanceChange: number;
  engagementChange: number;
  satisfactionChange: number;
  adaptationTime: number;
  feedback?: string;
}

export interface AdjustmentContext {
  gameState: GameState;
  playerProfile: PlayerDifficultyProfile;
  recentMetrics: RealTimeMetrics[];
  sessionContext: SessionContext;
  socialContext: SocialContext;
}

export interface SessionContext {
  sessionLength: number;
  sessionType: string;
  timeOfDay: string;
  playerEnergy: number;
  deviceType: string;
  connectionQuality: number;
}

export interface SocialContext {
  isMultiplayer: boolean;
  otherPlayerLevels: number[];
  competitiveBalance: number;
  socialPressure: number;
  teamDynamics?: string;
}

export class DynamicDifficultyAdjuster extends EventEmitter {
  private difficultySystem: GameDifficultySystem;
  private adjustmentRules: Map<string, AdjustmentRule> = new Map();
  private adjustmentHistory: AdjustmentHistory[] = [];
  private currentMetrics: Map<string, RealTimeMetrics> = new Map();
  private pendingPlans: Map<string, AdjustmentPlan> = new Map();
  
  private isEnabled: boolean = true;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private adjustmentFrequency: number = 10000; // 10 seconds
  private learningEnabled: boolean = true;

  constructor(difficultySystem: GameDifficultySystem) {
    super();
    this.difficultySystem = difficultySystem;
    this.initializeDefaultRules();
  }

  public async startRealTimeAdjustment(gameState: GameState): Promise<void> {
    try {
      if (this.monitoringInterval) {
        this.stopRealTimeAdjustment();
      }

      this.monitoringInterval = setInterval(async () => {
        await this.processRealTimeAdjustments(gameState);
      }, this.adjustmentFrequency);

      this.emit('realtime_adjustment_started');

    } catch (error) {
      this.emit('error', { type: 'realtime_adjustment_start_failed', error });
      throw error;
    }
  }

  public stopRealTimeAdjustment(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.emit('realtime_adjustment_stopped');
    }
  }

  public async updateRealTimeMetrics(playerId: string, metrics: Partial<RealTimeMetrics>): Promise<void> {
    try {
      const currentTime = Date.now();
      const existingMetrics = this.currentMetrics.get(playerId);

      const updatedMetrics: RealTimeMetrics = {
        playerId,
        timestamp: currentTime,
        gameSessionId: metrics.gameSessionId || 'default',
        
        // 默认值和更新
        currentScore: 0,
        efficiency: 0.5,
        decisionTime: 30000,
        errorCount: 0,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        actionFrequency: 1,
        pauseFrequency: 0,
        menuAccess: 0,
        helpRequests: 0,
        backtrackingCount: 0,
        undoActions: 0,
        ragequitIndicators: 0,
        emotionalState: {
          frustration: 0.3,
          confidence: 0.7,
          engagement: 0.8,
          satisfaction: 0.7,
          stress: 0.3
        },
        improvementRate: 0,
        conceptMastery: {},
        skillProgression: {},
        gamePhase: 'playing',
        currentChallenge: 'general',
        timeInSession: 0,
        interactionPattern: 'normal',
        
        // 合并现有数据
        ...existingMetrics,
        ...metrics,
        timestamp: currentTime
      };

      this.currentMetrics.set(playerId, updatedMetrics);

      // 触发实时分析
      await this.analyzePlayerMetrics(playerId, updatedMetrics);

      this.emit('metrics_updated', { playerId, metrics: updatedMetrics });

    } catch (error) {
      this.emit('error', { type: 'metrics_update_failed', error, playerId });
      throw error;
    }
  }

  public async executeImmediateAdjustment(
    playerId: string, 
    adjustmentType: 'emergency' | 'opportunity' | 'correction',
    context: AdjustmentContext
  ): Promise<boolean> {
    try {
      const metrics = this.currentMetrics.get(playerId);
      if (!metrics) {
        throw new Error(`No metrics found for player: ${playerId}`);
      }

      const plan = await this.createImmediateAdjustmentPlan(
        playerId, 
        adjustmentType, 
        metrics, 
        context
      );

      const success = await this.executePlan(plan, context);

      if (success) {
        this.emit('immediate_adjustment_executed', { 
          playerId, 
          adjustmentType, 
          plan 
        });
      }

      return success;

    } catch (error) {
      this.emit('error', { type: 'immediate_adjustment_failed', error, playerId });
      return false;
    }
  }

  private async processRealTimeAdjustments(gameState: GameState): Promise<void> {
    try {
      for (const [playerId, metrics] of this.currentMetrics) {
        await this.evaluatePlayerForAdjustment(playerId, metrics, gameState);
      }
    } catch (error) {
      this.emit('error', { type: 'realtime_processing_failed', error });
    }
  }

  private async evaluatePlayerForAdjustment(
    playerId: string, 
    metrics: RealTimeMetrics, 
    gameState: GameState
  ): Promise<void> {
    try {
      const profile = this.difficultySystem.getPlayerProfile(playerId);
      if (!profile) return;

      const triggeredRules = await this.evaluateAdjustmentRules(metrics, profile);
      
      if (triggeredRules.length > 0) {
        const context: AdjustmentContext = {
          gameState,
          playerProfile: profile,
          recentMetrics: this.getRecentMetrics(playerId, 5),
          sessionContext: this.createSessionContext(metrics),
          socialContext: this.createSocialContext(gameState, playerId)
        };

        const plan = await this.createAdjustmentPlan(playerId, triggeredRules, context);
        
        if (plan.priority === 'critical' || plan.priority === 'high') {
          await this.executePlan(plan, context);
        } else {
          this.pendingPlans.set(playerId, plan);
        }
      }

    } catch (error) {
      this.emit('error', { type: 'player_evaluation_failed', error, playerId });
    }
  }

  private async evaluateAdjustmentRules(
    metrics: RealTimeMetrics, 
    profile: PlayerDifficultyProfile
  ): Promise<AdjustmentRule[]> {
    const triggeredRules: AdjustmentRule[] = [];
    const currentTime = Date.now();

    for (const [ruleId, rule] of this.adjustmentRules) {
      if (!rule.enabled || this.isRuleInCooldown(rule, currentTime)) {
        continue;
      }

      if (await this.evaluateRuleConditions(rule, metrics, profile)) {
        triggeredRules.push(rule);
        rule.lastTriggered = currentTime;
      }
    }

    return triggeredRules.sort((a, b) => b.priority - a.priority);
  }

  private async evaluateRuleConditions(
    rule: AdjustmentRule, 
    metrics: RealTimeMetrics, 
    profile: PlayerDifficultyProfile
  ): Promise<boolean> {
    let totalWeight = 0;
    let satisfiedWeight = 0;

    for (const condition of rule.conditions) {
      totalWeight += condition.weight;

      const value = this.extractMetricValue(condition.metric, metrics, profile);
      if (this.evaluateCondition(condition, value)) {
        satisfiedWeight += condition.weight;
      }
    }

    // 需要满足至少70%的加权条件
    return satisfiedWeight / totalWeight >= 0.7;
  }

  private extractMetricValue(
    metric: string, 
    metrics: RealTimeMetrics, 
    profile: PlayerDifficultyProfile
  ): number {
    // 从指标或档案中提取数值
    switch (metric) {
      case 'performance_score':
        return this.calculatePerformanceScore(metrics);
      case 'frustration_level':
        return metrics.emotionalState.frustration;
      case 'engagement_level':
        return metrics.emotionalState.engagement;
      case 'error_rate':
        return metrics.errorCount / Math.max(1, metrics.timeInSession / 60000);
      case 'decision_speed':
        return Math.max(0, 1 - (metrics.decisionTime - 10000) / 50000);
      case 'help_frequency':
        return metrics.helpRequests / Math.max(1, metrics.timeInSession / 300000);
      case 'mastery_level':
        return profile.skillAssessment.overallSkill / 10;
      default:
        return 0.5;
    }
  }

  private evaluateCondition(condition: AdjustmentCondition, value: number): boolean {
    switch (condition.operator) {
      case '>': return value > condition.threshold;
      case '<': return value < condition.threshold;
      case '>=': return value >= condition.threshold;
      case '<=': return value <= condition.threshold;
      case '==': return Math.abs(value - condition.threshold) < 0.01;
      case '!=': return Math.abs(value - condition.threshold) >= 0.01;
      default: return false;
    }
  }

  private async createAdjustmentPlan(
    playerId: string, 
    triggeredRules: AdjustmentRule[], 
    context: AdjustmentContext
  ): Promise<AdjustmentPlan> {
    const priority = this.determinePlanPriority(triggeredRules, context);
    const adjustments = this.consolidateAdjustments(triggeredRules);
    const reasoning = this.generatePlanReasoning(triggeredRules, context);

    const plan: AdjustmentPlan = {
      playerId,
      timestamp: Date.now(),
      priority,
      plannedAdjustments: await this.createPlannedAdjustments(adjustments, context),
      reasoning,
      expectedOutcome: this.predictPlanOutcome(adjustments, context),
      rollbackPlan: this.createRollbackPlan(adjustments),
      monitoringMetrics: this.identifyMonitoringMetrics(adjustments)
    };

    return plan;
  }

  private async executePlan(plan: AdjustmentPlan, context: AdjustmentContext): Promise<boolean> {
    try {
      const beforeState = this.currentMetrics.get(plan.playerId);
      if (!beforeState) return false;

      const executedActions: AdjustmentAction[] = [];

      for (const plannedAdjustment of plan.plannedAdjustments) {
        if (await this.checkPreconditions(plannedAdjustment.preconditions, context)) {
          if (plannedAdjustment.delay > 0) {
            await this.delay(plannedAdjustment.delay);
          }

          const success = await this.executeAdjustmentAction(
            plannedAdjustment.action, 
            context
          );

          if (success) {
            executedActions.push(plannedAdjustment.action);
          } else {
            // 如果关键调整失败，停止执行计划
            if (plan.priority === 'critical') {
              break;
            }
          }
        }
      }

      // 记录调整历史
      await this.recordAdjustmentHistory(plan, beforeState, executedActions, context);

      // 开始监控效果
      this.startPlanMonitoring(plan);

      this.emit('plan_executed', { plan, executedActions });

      return executedActions.length > 0;

    } catch (error) {
      this.emit('error', { type: 'plan_execution_failed', error, plan });
      return false;
    }
  }

  private async executeAdjustmentAction(
    action: AdjustmentAction, 
    context: AdjustmentContext
  ): Promise<boolean> {
    try {
      switch (action.type) {
        case 'parameter_adjustment':
          return await this.adjustGameParameters(action, context);
        case 'content_modification':
          return await this.modifyContent(action, context);
        case 'assistance_level':
          return await this.adjustAssistance(action, context);
        case 'feedback_frequency':
          return await this.adjustFeedback(action, context);
        case 'challenge_type':
          return await this.adjustChallengeType(action, context);
        default:
          return false;
      }
    } catch (error) {
      this.emit('error', { type: 'action_execution_failed', error, action });
      return false;
    }
  }

  private async adjustGameParameters(
    action: AdjustmentAction, 
    context: AdjustmentContext
  ): Promise<boolean> {
    // 实现游戏参数调整
    const currentLevel = this.difficultySystem.getDifficultyLevel(
      context.playerProfile.currentDifficulty
    );
    
    if (!currentLevel) return false;

    // 根据action修改参数
    const newParameters = { ...currentLevel.parameters };
    
    switch (action.target) {
      case 'ai_skill_level':
        newParameters.aiSkillLevel = this.applyModification(
          newParameters.aiSkillLevel, 
          action.modification, 
          action.value
        );
        break;
      case 'event_frequency':
        newParameters.eventFrequency = this.applyModification(
          newParameters.eventFrequency, 
          action.modification, 
          action.value
        );
        break;
      case 'time_pressure':
        newParameters.turnTimeLimit = this.applyModification(
          newParameters.turnTimeLimit, 
          action.modification, 
          action.value
        );
        break;
      // 更多参数调整...
    }

    this.emit('parameters_adjusted', { 
      playerId: context.playerProfile.playerId, 
      oldParameters: currentLevel.parameters, 
      newParameters 
    });

    return true;
  }

  private async modifyContent(action: AdjustmentAction, context: AdjustmentContext): Promise<boolean> {
    // 实现内容修改
    this.emit('content_modified', { 
      playerId: context.playerProfile.playerId, 
      modification: action 
    });
    return true;
  }

  private async adjustAssistance(action: AdjustmentAction, context: AdjustmentContext): Promise<boolean> {
    // 实现辅助级别调整
    this.emit('assistance_adjusted', { 
      playerId: context.playerProfile.playerId, 
      adjustment: action 
    });
    return true;
  }

  private async adjustFeedback(action: AdjustmentAction, context: AdjustmentContext): Promise<boolean> {
    // 实现反馈频率调整
    this.emit('feedback_adjusted', { 
      playerId: context.playerProfile.playerId, 
      adjustment: action 
    });
    return true;
  }

  private async adjustChallengeType(action: AdjustmentAction, context: AdjustmentContext): Promise<boolean> {
    // 实现挑战类型调整
    this.emit('challenge_type_adjusted', { 
      playerId: context.playerProfile.playerId, 
      adjustment: action 
    });
    return true;
  }

  private applyModification(
    currentValue: number, 
    modification: ModificationType, 
    value: number
  ): number {
    switch (modification) {
      case 'increase':
        return currentValue + value;
      case 'decrease':
        return Math.max(0, currentValue - value);
      case 'multiply':
        return currentValue * value;
      case 'set':
        return value;
      case 'adaptive_scale':
        return currentValue * (1 + value * (Math.random() - 0.5));
      default:
        return currentValue;
    }
  }

  private async analyzePlayerMetrics(playerId: string, metrics: RealTimeMetrics): Promise<void> {
    // 分析玩家指标变化趋势
    const recentMetrics = this.getRecentMetrics(playerId, 10);
    
    if (recentMetrics.length >= 3) {
      const trends = this.calculateMetricTrends(recentMetrics);
      
      // 检测异常模式
      const anomalies = this.detectAnomalies(metrics, recentMetrics);
      
      if (anomalies.length > 0) {
        this.emit('anomalies_detected', { playerId, anomalies, metrics });
      }
      
      // 检测学习进展
      const progress = this.assessLearningProgress(recentMetrics);
      
      if (progress.significantChange) {
        this.emit('learning_progress_detected', { playerId, progress });
      }
    }
  }

  private calculatePerformanceScore(metrics: RealTimeMetrics): number {
    let score = 0.5; // 基础分数

    // 基于效率
    score += metrics.efficiency * 0.3;

    // 基于错误率（倒数）
    const errorRate = metrics.errorCount / Math.max(1, metrics.timeInSession / 60000);
    score += Math.max(0, (1 - errorRate / 5)) * 0.2;

    // 基于决策速度
    const speedScore = Math.max(0, 1 - (metrics.decisionTime - 10000) / 40000);
    score += speedScore * 0.2;

    // 基于连续成功
    score += Math.min(0.3, metrics.consecutiveSuccesses * 0.05);

    return Math.max(0, Math.min(1, score));
  }

  // 辅助方法
  private isRuleInCooldown(rule: AdjustmentRule, currentTime: number): boolean {
    return currentTime - rule.lastTriggered < rule.cooldown;
  }

  private getRecentMetrics(playerId: string, count: number): RealTimeMetrics[] {
    // 获取最近的指标数据
    // 这里简化为返回当前指标
    const current = this.currentMetrics.get(playerId);
    return current ? [current] : [];
  }

  private createSessionContext(metrics: RealTimeMetrics): SessionContext {
    return {
      sessionLength: metrics.timeInSession,
      sessionType: 'normal',
      timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
      playerEnergy: 0.8,
      deviceType: 'desktop',
      connectionQuality: 0.9
    };
  }

  private createSocialContext(gameState: GameState, playerId: string): SocialContext {
    return {
      isMultiplayer: gameState.players.length > 1,
      otherPlayerLevels: gameState.players
        .filter(p => p.id !== playerId)
        .map(p => 5), // 简化实现
      competitiveBalance: 0.5,
      socialPressure: 0.3,
      teamDynamics: 'competitive'
    };
  }

  private async createImmediateAdjustmentPlan(
    playerId: string,
    adjustmentType: string,
    metrics: RealTimeMetrics,
    context: AdjustmentContext
  ): Promise<AdjustmentPlan> {
    // 创建紧急调整计划
    return {
      playerId,
      timestamp: Date.now(),
      priority: adjustmentType === 'emergency' ? 'critical' : 'high',
      plannedAdjustments: [],
      reasoning: `Immediate ${adjustmentType} adjustment needed`,
      expectedOutcome: 'Stabilize player experience',
      rollbackPlan: 'Revert to previous settings',
      monitoringMetrics: ['frustration', 'engagement']
    };
  }

  private determinePlanPriority(rules: AdjustmentRule[], context: AdjustmentContext): 'low' | 'medium' | 'high' | 'critical' {
    const maxPriority = Math.max(...rules.map(r => r.priority));
    
    if (maxPriority >= 9) return 'critical';
    if (maxPriority >= 7) return 'high';
    if (maxPriority >= 5) return 'medium';
    return 'low';
  }

  private consolidateAdjustments(rules: AdjustmentRule[]): AdjustmentAction[] {
    const actions: AdjustmentAction[] = [];
    
    for (const rule of rules) {
      actions.push(...rule.actions);
    }
    
    return actions;
  }

  private generatePlanReasoning(rules: AdjustmentRule[], context: AdjustmentContext): string {
    const ruleNames = rules.map(r => r.name).join(', ');
    return `Triggered by rules: ${ruleNames}`;
  }

  private async createPlannedAdjustments(actions: AdjustmentAction[], context: AdjustmentContext): Promise<PlannedAdjustment[]> {
    return actions.map((action, index) => ({
      action,
      sequence: index,
      delay: action.gradual ? index * 1000 : 0,
      preconditions: action.conditions || [],
      successCriteria: ['player_response_positive'],
      failureCriteria: ['player_response_negative']
    }));
  }

  private predictPlanOutcome(actions: AdjustmentAction[], context: AdjustmentContext): string {
    return 'Expected improvement in player experience';
  }

  private createRollbackPlan(actions: AdjustmentAction[]): string {
    return 'Revert all parameter changes';
  }

  private identifyMonitoringMetrics(actions: AdjustmentAction[]): string[] {
    return ['performance', 'engagement', 'satisfaction'];
  }

  private async checkPreconditions(preconditions: string[], context: AdjustmentContext): Promise<boolean> {
    return true; // 简化实现
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async recordAdjustmentHistory(
    plan: AdjustmentPlan,
    beforeState: RealTimeMetrics,
    executedActions: AdjustmentAction[],
    context: AdjustmentContext
  ): Promise<void> {
    const record: AdjustmentHistory = {
      adjustmentId: this.generateId(),
      playerId: plan.playerId,
      timestamp: Date.now(),
      ruleTrigger: plan.reasoning,
      beforeState,
      adjustmentsMade: executedActions,
      afterState: beforeState, // 将在后续更新
      success: executedActions.length > 0,
      playerResponse: {
        immediateReaction: 'neutral',
        performanceChange: 0,
        engagementChange: 0,
        satisfactionChange: 0,
        adaptationTime: 0
      },
      lessons: []
    };

    this.adjustmentHistory.push(record);
    
    if (this.adjustmentHistory.length > 1000) {
      this.adjustmentHistory = this.adjustmentHistory.slice(-1000);
    }
  }

  private startPlanMonitoring(plan: AdjustmentPlan): void {
    // 开始监控计划效果
    setTimeout(() => {
      this.evaluatePlanSuccess(plan);
    }, 30000); // 30秒后评估
  }

  private evaluatePlanSuccess(plan: AdjustmentPlan): void {
    // 评估计划成功性
    const currentMetrics = this.currentMetrics.get(plan.playerId);
    if (currentMetrics) {
      this.emit('plan_evaluation', { plan, currentMetrics });
    }
  }

  private calculateMetricTrends(metrics: RealTimeMetrics[]): Record<string, number> {
    // 计算指标趋势
    return {};
  }

  private detectAnomalies(current: RealTimeMetrics, recent: RealTimeMetrics[]): string[] {
    // 检测异常模式
    return [];
  }

  private assessLearningProgress(metrics: RealTimeMetrics[]): { significantChange: boolean } {
    // 评估学习进展
    return { significantChange: false };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private initializeDefaultRules(): void {
    // 高挫折感规则
    this.addAdjustmentRule({
      id: 'high_frustration',
      name: '高挫折感干预',
      description: '当玩家表现出高挫折感时降低难度',
      priority: 9,
      conditions: [
        {
          type: 'frustration',
          metric: 'frustration_level',
          operator: '>',
          threshold: 0.7,
          weight: 1.0
        }
      ],
      actions: [
        {
          type: 'parameter_adjustment',
          target: 'ai_skill_level',
          modification: 'decrease',
          value: 1,
          gradual: true,
          duration: 60000
        },
        {
          type: 'assistance_level',
          target: 'hint_frequency',
          modification: 'increase',
          value: 0.3,
          gradual: false,
          duration: 300000
        }
      ],
      cooldown: 120000,
      lastTriggered: 0,
      enabled: true
    });

    // 掌握程度高规则
    this.addAdjustmentRule({
      id: 'high_mastery',
      name: '高掌握度提升',
      description: '当玩家显示掌握时增加挑战',
      priority: 7,
      conditions: [
        {
          type: 'mastery',
          metric: 'mastery_level',
          operator: '>',
          threshold: 0.8,
          weight: 0.8
        },
        {
          type: 'performance',
          metric: 'performance_score',
          operator: '>',
          threshold: 0.85,
          weight: 0.2
        }
      ],
      actions: [
        {
          type: 'parameter_adjustment',
          target: 'ai_skill_level',
          modification: 'increase',
          value: 0.5,
          gradual: true,
          duration: 120000
        }
      ],
      cooldown: 180000,
      lastTriggered: 0,
      enabled: true
    });

    // 低参与度规则
    this.addAdjustmentRule({
      id: 'low_engagement',
      name: '低参与度激励',
      description: '当玩家参与度低时增加趣味性',
      priority: 6,
      conditions: [
        {
          type: 'engagement',
          metric: 'engagement_level',
          operator: '<',
          threshold: 0.4,
          weight: 1.0
        }
      ],
      actions: [
        {
          type: 'content_modification',
          target: 'event_variety',
          modification: 'increase',
          value: 0.5,
          gradual: false,
          duration: 180000
        },
        {
          type: 'challenge_type',
          target: 'challenge_diversity',
          modification: 'increase',
          value: 0.3,
          gradual: false,
          duration: 300000
        }
      ],
      cooldown: 240000,
      lastTriggered: 0,
      enabled: true
    });
  }

  public addAdjustmentRule(rule: AdjustmentRule): void {
    this.adjustmentRules.set(rule.id, rule);
    this.emit('rule_added', { rule });
  }

  public removeAdjustmentRule(ruleId: string): boolean {
    const removed = this.adjustmentRules.delete(ruleId);
    if (removed) {
      this.emit('rule_removed', { ruleId });
    }
    return removed;
  }

  public getAdjustmentHistory(playerId?: string, limit: number = 50): AdjustmentHistory[] {
    let history = this.adjustmentHistory;
    
    if (playerId) {
      history = history.filter(record => record.playerId === playerId);
    }
    
    return history.slice(-limit);
  }

  public getCurrentMetrics(playerId: string): RealTimeMetrics | undefined {
    return this.currentMetrics.get(playerId);
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.emit('adjuster_toggled', { enabled });
  }

  public isAdjusterEnabled(): boolean {
    return this.isEnabled;
  }

  public getSystemStats(): {
    rulesCount: number;
    activeMetrics: number;
    pendingPlans: number;
    historySize: number;
  } {
    return {
      rulesCount: this.adjustmentRules.size,
      activeMetrics: this.currentMetrics.size,
      pendingPlans: this.pendingPlans.size,
      historySize: this.adjustmentHistory.length
    };
  }
}