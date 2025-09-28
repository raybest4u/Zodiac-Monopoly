import { EventEmitter } from '../utils/EventEmitter';
import { GameBalanceAnalyzer, BalanceMetrics, BalanceAlert } from './GameBalanceAnalyzer';
import type { GameState, Player, Property, ZodiacSign } from '../types/game';

export interface BalanceRule {
  id: string;
  name: string;
  category: BalanceCategory;
  priority: number;
  condition: BalanceCondition;
  action: BalanceAction;
  enabled: boolean;
  cooldown: number;
  lastTriggered: number;
}

export type BalanceCategory = 
  | 'economy' 
  | 'zodiac' 
  | 'property' 
  | 'skill' 
  | 'progression' 
  | 'social' 
  | 'special_system';

export interface BalanceCondition {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  threshold: number;
  duration?: number;
  context?: string[];
}

export interface BalanceAction {
  type: BalanceActionType;
  target: string;
  parameter: string;
  adjustment: number | string | BalanceFormula;
  scope: 'global' | 'player' | 'zodiac' | 'property' | 'skill';
  maxAdjustment?: number;
  reversible?: boolean;
}

export type BalanceActionType = 
  | 'adjust_value' 
  | 'modify_multiplier' 
  | 'enable_feature' 
  | 'disable_feature' 
  | 'apply_bonus' 
  | 'apply_penalty' 
  | 'redistribute' 
  | 'scale';

export interface BalanceFormula {
  formula: string;
  variables: Record<string, number>;
  constraints?: BalanceConstraint[];
}

export interface BalanceConstraint {
  variable: string;
  min?: number;
  max?: number;
  stepSize?: number;
}

export interface BalanceTarget {
  metric: string;
  targetValue: number;
  tolerance: number;
  weight: number;
  timeHorizon: number;
}

export interface BalanceStrategy {
  id: string;
  name: string;
  description: string;
  targets: BalanceTarget[];
  rules: string[];
  priority: number;
  active: boolean;
}

export interface BalanceAdjustment {
  id: string;
  timestamp: number;
  ruleId: string;
  target: string;
  parameter: string;
  oldValue: number;
  newValue: number;
  reason: string;
  impact: number;
  duration: number;
  reversible: boolean;
}

export interface BalanceState {
  currentMetrics: BalanceMetrics;
  activeAdjustments: BalanceAdjustment[];
  recentAlerts: BalanceAlert[];
  systemHealth: number;
  stabilityScore: number;
  fairnessIndex: number;
}

export class GameBalanceSystem extends EventEmitter {
  private analyzer: GameBalanceAnalyzer;
  private rules: Map<string, BalanceRule> = new Map();
  private strategies: Map<string, BalanceStrategy> = new Map();
  private adjustments: BalanceAdjustment[] = [];
  private currentState: BalanceState | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private enabled: boolean = true;
  private monitoringFrequency: number = 30000; // 30秒

  constructor() {
    super();
    this.analyzer = new GameBalanceAnalyzer();
    this.initializeDefaultRules();
    this.initializeDefaultStrategies();
  }

  public async analyzeAndBalance(gameState: GameState): Promise<BalanceState> {
    try {
      // 分析当前平衡状态
      const metrics = this.analyzer.analyzeBalance(gameState);
      const alerts = this.analyzer.detectBalanceIssues(metrics);

      // 评估系统健康度
      const systemHealth = this.calculateSystemHealth(metrics, alerts);
      const stabilityScore = this.calculateStabilityScore(metrics);
      const fairnessIndex = this.calculateFairnessIndex(metrics);

      // 创建当前状态
      this.currentState = {
        currentMetrics: metrics,
        activeAdjustments: this.getActiveAdjustments(),
        recentAlerts: alerts,
        systemHealth,
        stabilityScore,
        fairnessIndex
      };

      // 触发平衡规则
      if (this.enabled) {
        await this.processBalanceRules(gameState, metrics, alerts);
      }

      this.emit('balance_analyzed', {
        state: this.currentState,
        adjustments: this.adjustments.slice(-10)
      });

      return this.currentState;

    } catch (error) {
      this.emit('error', { type: 'balance_analysis_failed', error });
      throw error;
    }
  }

  public async applyBalanceAdjustment(gameState: GameState, adjustment: Partial<BalanceAdjustment>): Promise<boolean> {
    try {
      const fullAdjustment: BalanceAdjustment = {
        id: adjustment.id || this.generateId(),
        timestamp: adjustment.timestamp || Date.now(),
        ruleId: adjustment.ruleId || 'manual',
        target: adjustment.target || '',
        parameter: adjustment.parameter || '',
        oldValue: adjustment.oldValue || 0,
        newValue: adjustment.newValue || 0,
        reason: adjustment.reason || 'Manual adjustment',
        impact: adjustment.impact || 0,
        duration: adjustment.duration || 0,
        reversible: adjustment.reversible ?? true
      };

      const success = await this.executeAdjustment(gameState, fullAdjustment);
      
      if (success) {
        this.adjustments.push(fullAdjustment);
        this.cleanupOldAdjustments();
        
        this.emit('adjustment_applied', { adjustment: fullAdjustment });
      }

      return success;

    } catch (error) {
      this.emit('error', { type: 'adjustment_failed', error });
      return false;
    }
  }

  public addBalanceRule(rule: BalanceRule): void {
    this.rules.set(rule.id, rule);
    this.emit('rule_added', { rule });
  }

  public removeBalanceRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.emit('rule_removed', { ruleId });
    }
    return removed;
  }

  public addBalanceStrategy(strategy: BalanceStrategy): void {
    this.strategies.set(strategy.id, strategy);
    this.emit('strategy_added', { strategy });
  }

  public activateStrategy(strategyId: string): boolean {
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      strategy.active = true;
      this.emit('strategy_activated', { strategyId });
      return true;
    }
    return false;
  }

  public deactivateStrategy(strategyId: string): boolean {
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      strategy.active = false;
      this.emit('strategy_deactivated', { strategyId });
      return true;
    }
    return false;
  }

  public startMonitoring(gameState: GameState): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.analyzeAndBalance(gameState);
      } catch (error) {
        this.emit('error', { type: 'monitoring_error', error });
      }
    }, this.monitoringFrequency);

    this.emit('monitoring_started');
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.emit('monitoring_stopped');
    }
  }

  private async processBalanceRules(gameState: GameState, metrics: BalanceMetrics, alerts: BalanceAlert[]): Promise<void> {
    const triggeredRules: BalanceRule[] = [];

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled || this.isInCooldown(rule)) {
        continue;
      }

      if (await this.evaluateRuleCondition(rule.condition, metrics, gameState)) {
        triggeredRules.push(rule);
      }
    }

    // 按优先级排序并执行
    triggeredRules.sort((a, b) => b.priority - a.priority);

    for (const rule of triggeredRules.slice(0, 5)) { // 限制同时触发的规则数量
      await this.executeRule(rule, gameState, metrics);
    }
  }

  private async evaluateRuleCondition(condition: BalanceCondition, metrics: BalanceMetrics, gameState: GameState): Promise<boolean> {
    const value = this.extractMetricValue(condition.metric, metrics);
    if (value === undefined) return false;

    switch (condition.operator) {
      case '>': return value > condition.threshold;
      case '<': return value < condition.threshold;
      case '=': return Math.abs(value - condition.threshold) < 0.01;
      case '>=': return value >= condition.threshold;
      case '<=': return value <= condition.threshold;
      case '!=': return Math.abs(value - condition.threshold) >= 0.01;
      default: return false;
    }
  }

  private async executeRule(rule: BalanceRule, gameState: GameState, metrics: BalanceMetrics): Promise<void> {
    try {
      const adjustment = await this.createAdjustmentFromAction(rule.action, rule.id, gameState, metrics);
      await this.applyBalanceAdjustment(gameState, adjustment);
      
      rule.lastTriggered = Date.now();
      
      this.emit('rule_triggered', { rule, adjustment });

    } catch (error) {
      this.emit('error', { type: 'rule_execution_failed', error, ruleId: rule.id });
    }
  }

  private async createAdjustmentFromAction(action: BalanceAction, ruleId: string, gameState: GameState, metrics: BalanceMetrics): Promise<Partial<BalanceAdjustment>> {
    const currentValue = await this.getCurrentValue(action.target, action.parameter, gameState);
    const newValue = await this.calculateNewValue(action, currentValue, metrics);

    return {
      ruleId,
      target: action.target,
      parameter: action.parameter,
      oldValue: currentValue,
      newValue,
      reason: `Rule ${ruleId} triggered`,
      impact: Math.abs(newValue - currentValue) / Math.max(1, currentValue),
      duration: 0,
      reversible: action.reversible ?? true
    };
  }

  private async executeAdjustment(gameState: GameState, adjustment: BalanceAdjustment): Promise<boolean> {
    try {
      switch (adjustment.target) {
        case 'property_price':
          return this.adjustPropertyPrices(gameState, adjustment);
        case 'rent_multiplier':
          return this.adjustRentMultipliers(gameState, adjustment);
        case 'skill_cooldown':
          return this.adjustSkillCooldowns(gameState, adjustment);
        case 'zodiac_bonus':
          return this.adjustZodiacBonuses(gameState, adjustment);
        case 'starting_money':
          return this.adjustStartingMoney(gameState, adjustment);
        default:
          return false;
      }
    } catch (error) {
      this.emit('error', { type: 'adjustment_execution_failed', error });
      return false;
    }
  }

  private adjustPropertyPrices(gameState: GameState, adjustment: BalanceAdjustment): boolean {
    const properties = gameState.board?.spaces?.filter(space => space.type === 'property') || [];
    const targetProperty = properties.find(p => p.id === adjustment.parameter);
    
    if (targetProperty && 'price' in targetProperty) {
      (targetProperty as any).price = adjustment.newValue;
      return true;
    }
    return false;
  }

  private adjustRentMultipliers(gameState: GameState, adjustment: BalanceAdjustment): boolean {
    // 调整租金倍数的实现
    return true;
  }

  private adjustSkillCooldowns(gameState: GameState, adjustment: BalanceAdjustment): boolean {
    // 调整技能冷却时间的实现
    return true;
  }

  private adjustZodiacBonuses(gameState: GameState, adjustment: BalanceAdjustment): boolean {
    // 调整生肖加成的实现
    return true;
  }

  private adjustStartingMoney(gameState: GameState, adjustment: BalanceAdjustment): boolean {
    // 调整起始资金的实现
    return true;
  }

  private calculateSystemHealth(metrics: BalanceMetrics, alerts: BalanceAlert[]): number {
    let health = 1.0;

    // 基于警告严重程度降低健康度
    for (const alert of alerts) {
      switch (alert.severity) {
        case 'critical': health -= 0.3; break;
        case 'high': health -= 0.2; break;
        case 'medium': health -= 0.1; break;
        case 'low': health -= 0.05; break;
      }
    }

    // 基于关键指标调整
    if (metrics.giniCoefficient > 0.7) health -= 0.1;
    if (metrics.playerEngagement < 0.3) health -= 0.1;

    return Math.max(0, Math.min(1, health));
  }

  private calculateStabilityScore(metrics: BalanceMetrics): number {
    // 基于指标变化率计算稳定性
    let stability = 1.0;

    if (metrics.wealthVariance > 0.8) stability -= 0.2;
    if (metrics.earlyGameAdvantage > 0.8) stability -= 0.2;

    return Math.max(0, Math.min(1, stability));
  }

  private calculateFairnessIndex(metrics: BalanceMetrics): number {
    // 综合多个公平性指标
    const giniScore = 1 - Math.abs(metrics.giniCoefficient - 0.4);
    const zodiacBalance = this.calculateZodiacBalance(metrics);
    const skillBalance = this.calculateSkillBalance(metrics);

    return (giniScore + zodiacBalance + skillBalance) / 3;
  }

  private calculateZodiacBalance(metrics: BalanceMetrics): number {
    const winRates = Object.values(metrics.zodiacWinRates);
    if (winRates.length === 0) return 1;

    const mean = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length;
    const variance = winRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / winRates.length;
    
    return Math.max(0, 1 - Math.sqrt(variance) * 10);
  }

  private calculateSkillBalance(metrics: BalanceMetrics): number {
    const effectiveness = Object.values(metrics.skillEffectiveness);
    if (effectiveness.length === 0) return 1;

    const mean = effectiveness.reduce((sum, eff) => sum + eff, 0) / effectiveness.length;
    const variance = effectiveness.reduce((sum, eff) => sum + Math.pow(eff - mean, 2), 0) / effectiveness.length;
    
    return Math.max(0, 1 - Math.sqrt(variance) * 5);
  }

  private getActiveAdjustments(): BalanceAdjustment[] {
    const now = Date.now();
    return this.adjustments.filter(adj => 
      adj.duration === 0 || (now - adj.timestamp) < adj.duration
    );
  }

  private isInCooldown(rule: BalanceRule): boolean {
    return Date.now() - rule.lastTriggered < rule.cooldown;
  }

  private extractMetricValue(metric: string, metrics: BalanceMetrics): number | undefined {
    const keys = metric.split('.');
    let value: any = metrics;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return typeof value === 'number' ? value : undefined;
  }

  private async getCurrentValue(target: string, parameter: string, gameState: GameState): Promise<number> {
    // 根据目标和参数获取当前值
    return 0; // 简化实现
  }

  private async calculateNewValue(action: BalanceAction, currentValue: number, metrics: BalanceMetrics): Promise<number> {
    let newValue = currentValue;

    if (typeof action.adjustment === 'number') {
      switch (action.type) {
        case 'adjust_value':
          newValue = currentValue + action.adjustment;
          break;
        case 'modify_multiplier':
          newValue = currentValue * action.adjustment;
          break;
        case 'scale':
          newValue = currentValue * (1 + action.adjustment);
          break;
      }
    }

    // 应用最大调整限制
    if (action.maxAdjustment) {
      const maxChange = currentValue * action.maxAdjustment;
      newValue = Math.max(currentValue - maxChange, Math.min(currentValue + maxChange, newValue));
    }

    return newValue;
  }

  private cleanupOldAdjustments(): void {
    const maxHistory = 1000;
    if (this.adjustments.length > maxHistory) {
      this.adjustments = this.adjustments.slice(-maxHistory);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private initializeDefaultRules(): void {
    // 经济平衡规则
    this.addBalanceRule({
      id: 'wealth_inequality_control',
      name: '财富不平等控制',
      category: 'economy',
      priority: 9,
      condition: {
        metric: 'giniCoefficient',
        operator: '>',
        threshold: 0.6
      },
      action: {
        type: 'redistribute',
        target: 'player_wealth',
        parameter: 'all',
        adjustment: 0.1,
        scope: 'global'
      },
      enabled: true,
      cooldown: 60000,
      lastTriggered: 0
    });

    // 生肖平衡规则
    this.addBalanceRule({
      id: 'zodiac_winrate_balance',
      name: '生肖胜率平衡',
      category: 'zodiac',
      priority: 8,
      condition: {
        metric: 'zodiacWinRates',
        operator: '>',
        threshold: 0.15
      },
      action: {
        type: 'adjust_value',
        target: 'zodiac_bonus',
        parameter: 'underperforming',
        adjustment: 0.05,
        scope: 'zodiac'
      },
      enabled: true,
      cooldown: 120000,
      lastTriggered: 0
    });

    // 游戏进度规则
    this.addBalanceRule({
      id: 'game_duration_control',
      name: '游戏时长控制',
      category: 'progression',
      priority: 6,
      condition: {
        metric: 'averageGameDuration',
        operator: '>',
        threshold: 4500
      },
      action: {
        type: 'modify_multiplier',
        target: 'turn_speed',
        parameter: 'global',
        adjustment: 1.1,
        scope: 'global'
      },
      enabled: true,
      cooldown: 180000,
      lastTriggered: 0
    });
  }

  private initializeDefaultStrategies(): void {
    this.addBalanceStrategy({
      id: 'competitive_balance',
      name: '竞技平衡策略',
      description: '确保所有玩家都有竞争机会',
      targets: [
        { metric: 'giniCoefficient', targetValue: 0.4, tolerance: 0.1, weight: 1.0, timeHorizon: 3600 },
        { metric: 'zodiacWinRates', targetValue: 0.083, tolerance: 0.02, weight: 0.8, timeHorizon: 7200 }
      ],
      rules: ['wealth_inequality_control', 'zodiac_winrate_balance'],
      priority: 1,
      active: true
    });

    this.addBalanceStrategy({
      id: 'engagement_optimization',
      name: '参与度优化策略',
      description: '提高玩家参与度和游戏体验',
      targets: [
        { metric: 'playerEngagement', targetValue: 0.7, tolerance: 0.1, weight: 1.0, timeHorizon: 1800 },
        { metric: 'averageGameDuration', targetValue: 3600, tolerance: 600, weight: 0.6, timeHorizon: 3600 }
      ],
      rules: ['game_duration_control'],
      priority: 2,
      active: true
    });
  }

  public getCurrentState(): BalanceState | null {
    return this.currentState;
  }

  public getAdjustmentHistory(limit: number = 50): BalanceAdjustment[] {
    return this.adjustments.slice(-limit);
  }

  public getAllRules(): BalanceRule[] {
    return Array.from(this.rules.values());
  }

  public getAllStrategies(): BalanceStrategy[] {
    return Array.from(this.strategies.values());
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.emit('system_toggled', { enabled });
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setMonitoringFrequency(frequency: number): void {
    this.monitoringFrequency = Math.max(1000, frequency);
    if (this.monitoringInterval) {
      this.stopMonitoring();
      // 需要在适当的时候重新开始监控
    }
  }

  public getSystemStats(): { 
    rulesCount: number; 
    strategiesCount: number; 
    adjustmentsCount: number; 
    systemHealth: number;
    enabled: boolean;
  } {
    return {
      rulesCount: this.rules.size,
      strategiesCount: this.strategies.size,
      adjustmentsCount: this.adjustments.length,
      systemHealth: this.currentState?.systemHealth || 0,
      enabled: this.enabled
    };
  }
}