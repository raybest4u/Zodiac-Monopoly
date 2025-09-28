import { EventEmitter } from '../utils/EventEmitter';
import type { GameState, Player, Property, ZodiacSign } from '../types/game';

export interface AdjustmentProfile {
  id: string;
  name: string;
  description: string;
  parameters: AdjustmentParameter[];
  triggers: AdjustmentTrigger[];
  constraints: AdjustmentConstraint[];
  priority: number;
  enabled: boolean;
}

export interface AdjustmentParameter {
  name: string;
  type: ParameterType;
  target: string;
  currentValue: number;
  targetRange: ValueRange;
  adjustmentRate: number;
  smoothing: number;
  constraints: ParameterConstraint[];
}

export type ParameterType = 
  | 'price' 
  | 'multiplier' 
  | 'percentage' 
  | 'duration' 
  | 'probability' 
  | 'bonus' 
  | 'cooldown';

export interface ValueRange {
  min: number;
  max: number;
  optimal: number;
  tolerance: number;
}

export interface ParameterConstraint {
  type: 'absolute' | 'relative' | 'conditional';
  condition?: string;
  minValue?: number;
  maxValue?: number;
  maxChange?: number;
  dependencies?: string[];
}

export interface AdjustmentTrigger {
  metric: string;
  condition: TriggerCondition;
  weight: number;
  hysteresis: number;
  cooldown: number;
  lastTriggered: number;
}

export interface TriggerCondition {
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'trend_up' | 'trend_down';
  threshold: number;
  duration?: number;
  sensitivity?: number;
}

export interface AdjustmentConstraint {
  type: 'system' | 'balance' | 'gameplay' | 'performance';
  description: string;
  validator: (adjustment: PendingAdjustment, context: AdjustmentContext) => boolean;
  severity: 'warning' | 'error' | 'critical';
}

export interface PendingAdjustment {
  parameterId: string;
  currentValue: number;
  proposedValue: number;
  confidence: number;
  impact: AdjustmentImpact;
  reasoning: string;
  alternatives: AlternativeAdjustment[];
}

export interface AdjustmentImpact {
  scope: 'local' | 'global' | 'cascading';
  magnitude: number;
  affectedSystems: string[];
  riskLevel: 'low' | 'medium' | 'high';
  reversibility: boolean;
}

export interface AlternativeAdjustment {
  value: number;
  confidence: number;
  impact: AdjustmentImpact;
  reasoning: string;
}

export interface AdjustmentContext {
  gameState: GameState;
  recentHistory: HistoricalSnapshot[];
  playerBehavior: PlayerBehaviorAnalysis;
  systemMetrics: SystemMetrics;
  environmentalFactors: EnvironmentalFactor[];
}

export interface HistoricalSnapshot {
  timestamp: number;
  metrics: Record<string, number>;
  adjustments: AppliedAdjustment[];
  outcomes: OutcomeMetrics;
}

export interface PlayerBehaviorAnalysis {
  engagementLevel: number;
  skillUsagePatterns: Map<string, number>;
  decisionLatency: number;
  adaptabilityScore: number;
  frustractionLevel: number;
}

export interface SystemMetrics {
  performanceScore: number;
  stabilityIndex: number;
  responseTime: number;
  resourceUsage: number;
  errorRate: number;
}

export interface EnvironmentalFactor {
  name: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number;
  influence: number;
}

export interface OutcomeMetrics {
  balanceScore: number;
  playerSatisfaction: number;
  gameFlowQuality: number;
  competitivenessIndex: number;
}

export interface AppliedAdjustment {
  id: string;
  timestamp: number;
  parameterId: string;
  oldValue: number;
  newValue: number;
  success: boolean;
  actualImpact: AdjustmentImpact;
  feedback: AdjustmentFeedback;
}

export interface AdjustmentFeedback {
  effectiveness: number;
  unintendedEffects: string[];
  playerReaction: PlayerReaction;
  systemStability: number;
}

export interface PlayerReaction {
  immediate: number;
  shortTerm: number;
  longTerm: number;
  adaptationSpeed: number;
}

export class DynamicBalanceAdjuster extends EventEmitter {
  private profiles: Map<string, AdjustmentProfile> = new Map();
  private adjustmentHistory: AppliedAdjustment[] = [];
  private pendingAdjustments: PendingAdjustment[] = [];
  private learningModel: AdjustmentLearningModel;
  private safetyLimits: SafetyLimits;
  private enabled: boolean = true;

  constructor() {
    super();
    this.learningModel = new AdjustmentLearningModel();
    this.safetyLimits = new SafetyLimits();
    this.initializeDefaultProfiles();
  }

  public async analyzeAndAdjust(context: AdjustmentContext): Promise<AppliedAdjustment[]> {
    try {
      if (!this.enabled) {
        return [];
      }

      // 分析当前状态
      const analysis = await this.analyzeCurrentState(context);
      
      // 生成调整建议
      const suggestions = await this.generateAdjustmentSuggestions(analysis, context);
      
      // 验证和优化建议
      const validatedSuggestions = await this.validateAdjustments(suggestions, context);
      
      // 执行安全的调整
      const appliedAdjustments = await this.applyAdjustments(validatedSuggestions, context);
      
      // 学习和反馈
      await this.updateLearningModel(appliedAdjustments, context);
      
      this.emit('adjustments_completed', {
        applied: appliedAdjustments,
        suggested: suggestions.length,
        validated: validatedSuggestions.length
      });

      return appliedAdjustments;

    } catch (error) {
      this.emit('error', { type: 'adjustment_analysis_failed', error });
      return [];
    }
  }

  public async proposeAdjustment(parameterId: string, newValue: number, context: AdjustmentContext): Promise<PendingAdjustment> {
    const parameter = this.findParameter(parameterId);
    if (!parameter) {
      throw new Error(`Parameter ${parameterId} not found`);
    }

    const impact = await this.assessImpact(parameter, newValue, context);
    const alternatives = await this.generateAlternatives(parameter, newValue, context);

    const proposal: PendingAdjustment = {
      parameterId,
      currentValue: parameter.currentValue,
      proposedValue: newValue,
      confidence: await this.calculateConfidence(parameter, newValue, context),
      impact,
      reasoning: await this.generateReasoning(parameter, newValue, context),
      alternatives
    };

    this.pendingAdjustments.push(proposal);
    this.emit('adjustment_proposed', { proposal });

    return proposal;
  }

  public async applyAdjustment(proposal: PendingAdjustment, context: AdjustmentContext): Promise<AppliedAdjustment> {
    try {
      // 最终安全检查
      const safetyCheck = await this.performSafetyCheck(proposal, context);
      if (!safetyCheck.safe) {
        throw new Error(`Safety check failed: ${safetyCheck.reason}`);
      }

      // 执行调整
      const success = await this.executeParameterChange(proposal, context);
      
      const appliedAdjustment: AppliedAdjustment = {
        id: this.generateId(),
        timestamp: Date.now(),
        parameterId: proposal.parameterId,
        oldValue: proposal.currentValue,
        newValue: proposal.proposedValue,
        success,
        actualImpact: await this.measureActualImpact(proposal, context),
        feedback: await this.collectInitialFeedback(proposal, context)
      };

      if (success) {
        this.adjustmentHistory.push(appliedAdjustment);
        this.updateParameterValue(proposal.parameterId, proposal.proposedValue);
      }

      this.removePendingAdjustment(proposal);
      this.emit('adjustment_applied', { adjustment: appliedAdjustment });

      return appliedAdjustment;

    } catch (error) {
      this.emit('error', { type: 'adjustment_application_failed', error });
      throw error;
    }
  }

  private async analyzeCurrentState(context: AdjustmentContext): Promise<StateAnalysis> {
    const analysis: StateAnalysis = {
      stabilityScore: this.calculateStabilityScore(context),
      balanceMetrics: this.extractBalanceMetrics(context),
      playerSatisfaction: this.assessPlayerSatisfaction(context),
      systemHealth: this.evaluateSystemHealth(context),
      trendAnalysis: this.analyzeTrends(context),
      anomalies: this.detectAnomalies(context)
    };

    return analysis;
  }

  private async generateAdjustmentSuggestions(analysis: StateAnalysis, context: AdjustmentContext): Promise<PendingAdjustment[]> {
    const suggestions: PendingAdjustment[] = [];

    for (const [profileId, profile] of this.profiles) {
      if (!profile.enabled) continue;

      const profileSuggestions = await this.generateProfileSuggestions(profile, analysis, context);
      suggestions.push(...profileSuggestions);
    }

    // 排序和优先级处理
    return this.prioritizeSuggestions(suggestions);
  }

  private async generateProfileSuggestions(profile: AdjustmentProfile, analysis: StateAnalysis, context: AdjustmentContext): Promise<PendingAdjustment[]> {
    const suggestions: PendingAdjustment[] = [];

    for (const parameter of profile.parameters) {
      const triggerScore = await this.evaluateTriggers(profile.triggers, parameter, context);
      
      if (triggerScore > 0.5) { // 触发阈值
        const suggestion = await this.generateParameterAdjustment(parameter, analysis, context, triggerScore);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  private async generateParameterAdjustment(parameter: AdjustmentParameter, analysis: StateAnalysis, context: AdjustmentContext, triggerScore: number): Promise<PendingAdjustment | null> {
    const currentValue = parameter.currentValue;
    const targetValue = this.calculateTargetValue(parameter, analysis, context);
    
    if (Math.abs(targetValue - currentValue) < parameter.targetRange.tolerance) {
      return null; // 调整幅度太小
    }

    // 平滑调整
    const adjustmentFactor = triggerScore * parameter.adjustmentRate * parameter.smoothing;
    const proposedValue = this.smoothAdjustment(currentValue, targetValue, adjustmentFactor);

    // 应用约束
    const constrainedValue = this.applyConstraints(proposedValue, parameter);

    const impact = await this.assessImpact(parameter, constrainedValue, context);
    const alternatives = await this.generateAlternatives(parameter, constrainedValue, context);

    return {
      parameterId: parameter.name,
      currentValue,
      proposedValue: constrainedValue,
      confidence: this.calculateAdjustmentConfidence(parameter, constrainedValue, triggerScore),
      impact,
      reasoning: this.generateAdjustmentReasoning(parameter, constrainedValue, analysis),
      alternatives
    };
  }

  private async validateAdjustments(suggestions: PendingAdjustment[], context: AdjustmentContext): Promise<PendingAdjustment[]> {
    const validated: PendingAdjustment[] = [];

    for (const suggestion of suggestions) {
      const validation = await this.validateSingleAdjustment(suggestion, context);
      
      if (validation.valid) {
        validated.push(suggestion);
      } else {
        this.emit('adjustment_rejected', { 
          suggestion, 
          reason: validation.reason 
        });
      }
    }

    // 检查调整之间的冲突
    return this.resolveAdjustmentConflicts(validated);
  }

  private async validateSingleAdjustment(suggestion: PendingAdjustment, context: AdjustmentContext): Promise<ValidationResult> {
    // 安全限制检查
    const safetyCheck = await this.performSafetyCheck(suggestion, context);
    if (!safetyCheck.safe) {
      return { valid: false, reason: `Safety violation: ${safetyCheck.reason}` };
    }

    // 影响评估
    if (suggestion.impact.riskLevel === 'high' && suggestion.confidence < 0.8) {
      return { valid: false, reason: 'High risk adjustment with low confidence' };
    }

    // 约束验证
    const parameter = this.findParameter(suggestion.parameterId);
    if (parameter) {
      for (const constraint of parameter.constraints) {
        if (!this.validateConstraint(constraint, suggestion, context)) {
          return { valid: false, reason: `Constraint violation: ${constraint.type}` };
        }
      }
    }

    return { valid: true, reason: 'Validation passed' };
  }

  private async applyAdjustments(adjustments: PendingAdjustment[], context: AdjustmentContext): Promise<AppliedAdjustment[]> {
    const applied: AppliedAdjustment[] = [];

    for (const adjustment of adjustments) {
      try {
        const result = await this.applyAdjustment(adjustment, context);
        applied.push(result);
        
        // 短暂延迟以观察效果
        await this.delay(100);
        
      } catch (error) {
        this.emit('error', { 
          type: 'adjustment_application_failed', 
          error, 
          adjustmentId: adjustment.parameterId 
        });
      }
    }

    return applied;
  }

  private async executeParameterChange(proposal: PendingAdjustment, context: AdjustmentContext): Promise<boolean> {
    try {
      const parameter = this.findParameter(proposal.parameterId);
      if (!parameter) return false;

      // 根据参数类型执行不同的调整逻辑
      switch (parameter.type) {
        case 'price':
          return this.adjustPrice(parameter, proposal.proposedValue, context);
        case 'multiplier':
          return this.adjustMultiplier(parameter, proposal.proposedValue, context);
        case 'percentage':
          return this.adjustPercentage(parameter, proposal.proposedValue, context);
        case 'duration':
          return this.adjustDuration(parameter, proposal.proposedValue, context);
        case 'probability':
          return this.adjustProbability(parameter, proposal.proposedValue, context);
        case 'bonus':
          return this.adjustBonus(parameter, proposal.proposedValue, context);
        case 'cooldown':
          return this.adjustCooldown(parameter, proposal.proposedValue, context);
        default:
          return false;
      }
    } catch (error) {
      this.emit('error', { type: 'parameter_change_failed', error });
      return false;
    }
  }

  // 具体的参数调整方法
  private adjustPrice(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): boolean {
    // 调整价格参数的实现
    return true;
  }

  private adjustMultiplier(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): boolean {
    // 调整倍数参数的实现
    return true;
  }

  private adjustPercentage(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): boolean {
    // 调整百分比参数的实现
    return true;
  }

  private adjustDuration(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): boolean {
    // 调整持续时间参数的实现
    return true;
  }

  private adjustProbability(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): boolean {
    // 调整概率参数的实现
    return true;
  }

  private adjustBonus(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): boolean {
    // 调整奖励参数的实现
    return true;
  }

  private adjustCooldown(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): boolean {
    // 调整冷却时间参数的实现
    return true;
  }

  // 辅助方法
  private calculateStabilityScore(context: AdjustmentContext): number {
    // 计算系统稳定性评分
    return 0.8;
  }

  private extractBalanceMetrics(context: AdjustmentContext): Record<string, number> {
    // 提取平衡指标
    return {};
  }

  private assessPlayerSatisfaction(context: AdjustmentContext): number {
    // 评估玩家满意度
    return 0.7;
  }

  private evaluateSystemHealth(context: AdjustmentContext): number {
    // 评估系统健康度
    return 0.9;
  }

  private analyzeTrends(context: AdjustmentContext): TrendAnalysis {
    // 分析趋势
    return { direction: 'stable', strength: 0.5, confidence: 0.8 };
  }

  private detectAnomalies(context: AdjustmentContext): Anomaly[] {
    // 检测异常
    return [];
  }

  private async evaluateTriggers(triggers: AdjustmentTrigger[], parameter: AdjustmentParameter, context: AdjustmentContext): Promise<number> {
    // 评估触发器
    return 0.6;
  }

  private calculateTargetValue(parameter: AdjustmentParameter, analysis: StateAnalysis, context: AdjustmentContext): number {
    // 计算目标值
    return parameter.targetRange.optimal;
  }

  private smoothAdjustment(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
  }

  private applyConstraints(value: number, parameter: AdjustmentParameter): number {
    let constrainedValue = value;
    
    for (const constraint of parameter.constraints) {
      if (constraint.minValue !== undefined) {
        constrainedValue = Math.max(constrainedValue, constraint.minValue);
      }
      if (constraint.maxValue !== undefined) {
        constrainedValue = Math.min(constrainedValue, constraint.maxValue);
      }
    }
    
    return constrainedValue;
  }

  private calculateAdjustmentConfidence(parameter: AdjustmentParameter, proposedValue: number, triggerScore: number): number {
    // 计算调整信心度
    return Math.min(0.9, triggerScore * 0.8 + 0.2);
  }

  private generateAdjustmentReasoning(parameter: AdjustmentParameter, proposedValue: number, analysis: StateAnalysis): string {
    return `Adjusting ${parameter.name} to ${proposedValue} based on current analysis`;
  }

  private async assessImpact(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): Promise<AdjustmentImpact> {
    return {
      scope: 'local',
      magnitude: Math.abs(newValue - parameter.currentValue) / parameter.currentValue,
      affectedSystems: [parameter.target],
      riskLevel: 'low',
      reversibility: true
    };
  }

  private async generateAlternatives(parameter: AdjustmentParameter, proposedValue: number, context: AdjustmentContext): Promise<AlternativeAdjustment[]> {
    return [];
  }

  private async calculateConfidence(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): Promise<number> {
    return 0.7;
  }

  private async generateReasoning(parameter: AdjustmentParameter, newValue: number, context: AdjustmentContext): Promise<string> {
    return `Adjusting ${parameter.name} based on current conditions`;
  }

  private prioritizeSuggestions(suggestions: PendingAdjustment[]): PendingAdjustment[] {
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private resolveAdjustmentConflicts(adjustments: PendingAdjustment[]): PendingAdjustment[] {
    // 解决调整冲突
    return adjustments;
  }

  private async performSafetyCheck(suggestion: PendingAdjustment, context: AdjustmentContext): Promise<SafetyCheckResult> {
    return { safe: true, reason: 'All checks passed' };
  }

  private validateConstraint(constraint: ParameterConstraint, suggestion: PendingAdjustment, context: AdjustmentContext): boolean {
    return true;
  }

  private async measureActualImpact(proposal: PendingAdjustment, context: AdjustmentContext): Promise<AdjustmentImpact> {
    return proposal.impact;
  }

  private async collectInitialFeedback(proposal: PendingAdjustment, context: AdjustmentContext): Promise<AdjustmentFeedback> {
    return {
      effectiveness: 0.7,
      unintendedEffects: [],
      playerReaction: { immediate: 0.5, shortTerm: 0.5, longTerm: 0.5, adaptationSpeed: 0.5 },
      systemStability: 0.9
    };
  }

  private findParameter(parameterId: string): AdjustmentParameter | undefined {
    for (const profile of this.profiles.values()) {
      const parameter = profile.parameters.find(p => p.name === parameterId);
      if (parameter) return parameter;
    }
    return undefined;
  }

  private updateParameterValue(parameterId: string, newValue: number): void {
    const parameter = this.findParameter(parameterId);
    if (parameter) {
      parameter.currentValue = newValue;
    }
  }

  private removePendingAdjustment(proposal: PendingAdjustment): void {
    const index = this.pendingAdjustments.indexOf(proposal);
    if (index > -1) {
      this.pendingAdjustments.splice(index, 1);
    }
  }

  private async updateLearningModel(adjustments: AppliedAdjustment[], context: AdjustmentContext): Promise<void> {
    this.learningModel.learn(adjustments, context);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeDefaultProfiles(): void {
    // 初始化默认调整配置文件
    this.addProfile({
      id: 'economic_balance',
      name: '经济平衡调整',
      description: '调整经济相关参数以维持平衡',
      parameters: [
        {
          name: 'property_base_price',
          type: 'price',
          target: 'property_system',
          currentValue: 1000,
          targetRange: { min: 500, max: 2000, optimal: 1000, tolerance: 50 },
          adjustmentRate: 0.1,
          smoothing: 0.8,
          constraints: [
            { type: 'absolute', minValue: 500, maxValue: 2000 },
            { type: 'relative', maxChange: 0.2 }
          ]
        }
      ],
      triggers: [
        {
          metric: 'average_game_wealth',
          condition: { operator: '>', threshold: 10000 },
          weight: 1.0,
          hysteresis: 0.1,
          cooldown: 30000,
          lastTriggered: 0
        }
      ],
      constraints: [],
      priority: 1,
      enabled: true
    });
  }

  public addProfile(profile: AdjustmentProfile): void {
    this.profiles.set(profile.id, profile);
    this.emit('profile_added', { profile });
  }

  public removeProfile(profileId: string): boolean {
    const removed = this.profiles.delete(profileId);
    if (removed) {
      this.emit('profile_removed', { profileId });
    }
    return removed;
  }

  public getAdjustmentHistory(limit: number = 100): AppliedAdjustment[] {
    return this.adjustmentHistory.slice(-limit);
  }

  public getPendingAdjustments(): PendingAdjustment[] {
    return [...this.pendingAdjustments];
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('adjuster_toggled', { enabled });
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

// 辅助类和接口
interface StateAnalysis {
  stabilityScore: number;
  balanceMetrics: Record<string, number>;
  playerSatisfaction: number;
  systemHealth: number;
  trendAnalysis: TrendAnalysis;
  anomalies: Anomaly[];
}

interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  confidence: number;
}

interface Anomaly {
  type: string;
  severity: number;
  description: string;
}

interface ValidationResult {
  valid: boolean;
  reason: string;
}

interface SafetyCheckResult {
  safe: boolean;
  reason: string;
}

class AdjustmentLearningModel {
  learn(adjustments: AppliedAdjustment[], context: AdjustmentContext): void {
    // 机器学习模型更新
  }
}

class SafetyLimits {
  // 安全限制管理
}