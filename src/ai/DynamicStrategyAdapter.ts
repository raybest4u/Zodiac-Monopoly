import { EventEmitter } from '../utils/EventEmitter';

export interface StrategyAdaptationConfig {
  adaptationThreshold: number;
  learningRate: number;
  memoryHorizon: number;
  adaptationStrategies: AdaptationStrategy[];
  environmentalFactors: EnvironmentalFactor[];
}

export interface AdaptationStrategy {
  id: string;
  name: string;
  triggers: StrategyTrigger[];
  adaptations: StrategyAdaptation[];
  priority: number;
  cooldown: number;
  effectiveness: number;
}

export interface StrategyTrigger {
  type: 'performance' | 'opponent_behavior' | 'game_phase' | 'market_condition' | 'resource_state';
  condition: string;
  threshold: number;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  weight: number;
}

export interface StrategyAdaptation {
  parameter: string;
  modification: 'increase' | 'decrease' | 'set' | 'multiply' | 'function';
  value: number | string | Function;
  intensity: number;
  duration: number;
}

export interface EnvironmentalFactor {
  name: string;
  value: number;
  weight: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number;
}

export interface AdaptationContext {
  playerId: string;
  gamePhase: string;
  roundNumber: number;
  performanceHistory: PerformanceMetrics[];
  opponentBehaviors: OpponentBehaviorPattern[];
  marketConditions: MarketCondition[];
  resourceState: ResourceState;
  environmentalFactors: EnvironmentalFactor[];
}

export interface PerformanceMetrics {
  timestamp: number;
  decision: string;
  outcome: 'success' | 'failure' | 'neutral';
  score: number;
  efficiency: number;
  risk: number;
  adaptability: number;
}

export interface OpponentBehaviorPattern {
  playerId: string;
  behaviorType: string;
  frequency: number;
  intensity: number;
  predictability: number;
  countermeasures: string[];
}

export interface MarketCondition {
  property: string;
  demand: number;
  supply: number;
  volatility: number;
  trend: 'bull' | 'bear' | 'sideways';
  momentum: number;
}

export interface ResourceState {
  cash: number;
  properties: number;
  debt: number;
  income: number;
  liquidity: number;
  diversification: number;
}

export interface StrategyState {
  baseStrategy: string;
  activeAdaptations: ActiveAdaptation[];
  adaptationHistory: AdaptationRecord[];
  confidence: number;
  stability: number;
  effectiveness: number;
}

export interface ActiveAdaptation {
  strategyId: string;
  adaptationId: string;
  startTime: number;
  endTime: number;
  intensity: number;
  performance: number;
}

export interface AdaptationRecord {
  timestamp: number;
  trigger: string;
  adaptation: string;
  context: Partial<AdaptationContext>;
  outcome: number;
  duration: number;
}

export interface AdaptationDecision {
  shouldAdapt: boolean;
  adaptations: StrategyAdaptation[];
  confidence: number;
  reasoning: string;
  expectedImpact: number;
  riskAssessment: number;
}

export class DynamicStrategyAdapter extends EventEmitter {
  private config: StrategyAdaptationConfig;
  private strategyState: StrategyState;
  private adaptationHistory: AdaptationRecord[] = [];
  private lastAdaptationTime: number = 0;
  private performanceBaseline: number = 0;
  private adaptationCooldowns: Map<string, number> = new Map();

  constructor(config: StrategyAdaptationConfig) {
    super();
    this.config = config;
    this.strategyState = {
      baseStrategy: 'balanced',
      activeAdaptations: [],
      adaptationHistory: [],
      confidence: 0.5,
      stability: 1.0,
      effectiveness: 0.5
    };
    this.calculatePerformanceBaseline();
  }

  public async evaluateAdaptationNeed(context: AdaptationContext): Promise<AdaptationDecision> {
    try {
      const triggers = await this.evaluateTriggers(context);
      const significantTriggers = triggers.filter(t => t.score > this.config.adaptationThreshold);

      if (significantTriggers.length === 0) {
        return {
          shouldAdapt: false,
          adaptations: [],
          confidence: 0,
          reasoning: 'No significant triggers detected',
          expectedImpact: 0,
          riskAssessment: 0
        };
      }

      const adaptations = await this.generateAdaptations(significantTriggers, context);
      const impact = this.estimateImpact(adaptations, context);
      const risk = this.assessRisk(adaptations, context);

      const shouldAdapt = this.shouldExecuteAdaptation(impact, risk, context);

      return {
        shouldAdapt,
        adaptations,
        confidence: this.calculateConfidence(significantTriggers, adaptations),
        reasoning: this.generateReasoning(significantTriggers, adaptations),
        expectedImpact: impact,
        riskAssessment: risk
      };
    } catch (error) {
      this.emit('error', { type: 'adaptation_evaluation_failed', error });
      return {
        shouldAdapt: false,
        adaptations: [],
        confidence: 0,
        reasoning: 'Evaluation failed',
        expectedImpact: 0,
        riskAssessment: 1
      };
    }
  }

  public async executeAdaptation(adaptations: StrategyAdaptation[], context: AdaptationContext): Promise<boolean> {
    try {
      const timestamp = Date.now();

      for (const adaptation of adaptations) {
        await this.applyAdaptation(adaptation, context);
        
        this.strategyState.activeAdaptations.push({
          strategyId: context.playerId,
          adaptationId: adaptation.parameter,
          startTime: timestamp,
          endTime: timestamp + adaptation.duration,
          intensity: adaptation.intensity,
          performance: 0
        });
      }

      this.recordAdaptation(adaptations, context);
      this.updateStrategyState(adaptations, context);
      
      this.emit('adaptation_executed', {
        adaptations,
        context,
        timestamp
      });

      return true;
    } catch (error) {
      this.emit('error', { type: 'adaptation_execution_failed', error });
      return false;
    }
  }

  private async evaluateTriggers(context: AdaptationContext): Promise<Array<{ strategy: AdaptationStrategy; score: number }>> {
    const evaluations: Array<{ strategy: AdaptationStrategy; score: number }> = [];

    for (const strategy of this.config.adaptationStrategies) {
      if (this.isInCooldown(strategy.id)) {
        continue;
      }

      let totalScore = 0;
      let triggerCount = 0;

      for (const trigger of strategy.triggers) {
        const score = await this.evaluateTrigger(trigger, context);
        totalScore += score * trigger.weight;
        triggerCount++;
      }

      const normalizedScore = triggerCount > 0 ? totalScore / triggerCount : 0;
      
      if (normalizedScore > 0) {
        evaluations.push({ strategy, score: normalizedScore });
      }
    }

    return evaluations.sort((a, b) => b.score - a.score);
  }

  private async evaluateTrigger(trigger: StrategyTrigger, context: AdaptationContext): Promise<number> {
    let value: number;

    switch (trigger.type) {
      case 'performance':
        value = this.calculatePerformanceScore(context.performanceHistory);
        break;
      case 'opponent_behavior':
        value = this.analyzeOpponentBehavior(context.opponentBehaviors);
        break;
      case 'game_phase':
        value = this.evaluateGamePhase(context.gamePhase, context.roundNumber);
        break;
      case 'market_condition':
        value = this.assessMarketConditions(context.marketConditions);
        break;
      case 'resource_state':
        value = this.evaluateResourceState(context.resourceState);
        break;
      default:
        value = 0;
    }

    return this.compareWithThreshold(value, trigger.threshold, trigger.operator);
  }

  private calculatePerformanceScore(history: PerformanceMetrics[]): number {
    if (history.length === 0) return 0.5;

    const recentHistory = history.slice(-this.config.memoryHorizon);
    const scores = recentHistory.map(h => h.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return Math.max(0, Math.min(1, avgScore));
  }

  private analyzeOpponentBehavior(behaviors: OpponentBehaviorPattern[]): number {
    if (behaviors.length === 0) return 0.5;

    const aggressiveness = behaviors.reduce((sum, b) => sum + b.intensity, 0) / behaviors.length;
    const predictability = behaviors.reduce((sum, b) => sum + b.predictability, 0) / behaviors.length;
    
    return (aggressiveness + (1 - predictability)) / 2;
  }

  private evaluateGamePhase(phase: string, round: number): number {
    const phaseValues = {
      'early': 0.2,
      'mid': 0.5,
      'late': 0.8,
      'endgame': 0.9
    };
    
    const baseValue = phaseValues[phase] || 0.5;
    const roundFactor = Math.min(1, round / 100);
    
    return baseValue * 0.7 + roundFactor * 0.3;
  }

  private assessMarketConditions(conditions: MarketCondition[]): number {
    if (conditions.length === 0) return 0.5;

    const volatilitySum = conditions.reduce((sum, c) => sum + c.volatility, 0);
    const avgVolatility = volatilitySum / conditions.length;
    
    return Math.max(0, Math.min(1, avgVolatility));
  }

  private evaluateResourceState(state: ResourceState): number {
    const factors = [
      state.liquidity,
      Math.min(1, state.cash / 1000),
      Math.min(1, state.income / 100),
      state.diversification
    ];
    
    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private compareWithThreshold(value: number, threshold: number, operator: string): number {
    let matches: boolean;
    
    switch (operator) {
      case '>': matches = value > threshold; break;
      case '<': matches = value < threshold; break;
      case '=': matches = Math.abs(value - threshold) < 0.01; break;
      case '>=': matches = value >= threshold; break;
      case '<=': matches = value <= threshold; break;
      case '!=': matches = Math.abs(value - threshold) >= 0.01; break;
      default: matches = false;
    }
    
    return matches ? Math.abs(value - threshold) : 0;
  }

  private async generateAdaptations(triggers: Array<{ strategy: AdaptationStrategy; score: number }>, context: AdaptationContext): Promise<StrategyAdaptation[]> {
    const adaptations: StrategyAdaptation[] = [];
    
    for (const { strategy, score } of triggers.slice(0, 3)) {
      const relevantAdaptations = strategy.adaptations.filter(adaptation => 
        this.isAdaptationRelevant(adaptation, context)
      );
      
      for (const adaptation of relevantAdaptations) {
        const adjustedAdaptation = this.adjustAdaptationIntensity(adaptation, score);
        adaptations.push(adjustedAdaptation);
      }
    }
    
    return this.deduplicateAdaptations(adaptations);
  }

  private isAdaptationRelevant(adaptation: StrategyAdaptation, context: AdaptationContext): boolean {
    return true;
  }

  private adjustAdaptationIntensity(adaptation: StrategyAdaptation, triggerScore: number): StrategyAdaptation {
    return {
      ...adaptation,
      intensity: adaptation.intensity * triggerScore,
      value: typeof adaptation.value === 'number' ? 
        adaptation.value * triggerScore : adaptation.value
    };
  }

  private deduplicateAdaptations(adaptations: StrategyAdaptation[]): StrategyAdaptation[] {
    const seen = new Set<string>();
    return adaptations.filter(adaptation => {
      const key = adaptation.parameter;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private estimateImpact(adaptations: StrategyAdaptation[], context: AdaptationContext): number {
    return adaptations.reduce((sum, adaptation) => {
      const baseImpact = adaptation.intensity;
      const contextMultiplier = this.getContextMultiplier(adaptation, context);
      return sum + (baseImpact * contextMultiplier);
    }, 0) / Math.max(1, adaptations.length);
  }

  private assessRisk(adaptations: StrategyAdaptation[], context: AdaptationContext): number {
    let totalRisk = 0;
    
    for (const adaptation of adaptations) {
      const intensityRisk = adaptation.intensity > 0.8 ? 0.3 : 0.1;
      const durationRisk = adaptation.duration > 10000 ? 0.2 : 0.05;
      const noveltyRisk = this.isNovelAdaptation(adaptation) ? 0.4 : 0.1;
      
      totalRisk += intensityRisk + durationRisk + noveltyRisk;
    }
    
    return Math.min(1, totalRisk / adaptations.length);
  }

  private shouldExecuteAdaptation(impact: number, risk: number, context: AdaptationContext): boolean {
    const impactThreshold = 0.3;
    const riskThreshold = 0.7;
    const confidenceThreshold = 0.6;
    
    return impact >= impactThreshold && 
           risk <= riskThreshold && 
           this.strategyState.confidence >= confidenceThreshold;
  }

  private calculateConfidence(triggers: Array<{ strategy: AdaptationStrategy; score: number }>, adaptations: StrategyAdaptation[]): number {
    const triggerConfidence = triggers.reduce((sum, t) => sum + t.score, 0) / triggers.length;
    const historyConfidence = this.getHistoricalConfidence(adaptations);
    const stabilityConfidence = this.strategyState.stability;
    
    return (triggerConfidence + historyConfidence + stabilityConfidence) / 3;
  }

  private generateReasoning(triggers: Array<{ strategy: AdaptationStrategy; score: number }>, adaptations: StrategyAdaptation[]): string {
    const triggerNames = triggers.map(t => t.strategy.name).join(', ');
    const adaptationNames = adaptations.map(a => a.parameter).join(', ');
    
    return `Triggered by: ${triggerNames}. Applying adaptations: ${adaptationNames}`;
  }

  private async applyAdaptation(adaptation: StrategyAdaptation, context: AdaptationContext): Promise<void> {
    this.emit('adaptation_applied', { adaptation, context });
  }

  private recordAdaptation(adaptations: StrategyAdaptation[], context: AdaptationContext): void {
    const record: AdaptationRecord = {
      timestamp: Date.now(),
      trigger: 'multi-trigger',
      adaptation: adaptations.map(a => a.parameter).join(','),
      context: {
        playerId: context.playerId,
        gamePhase: context.gamePhase,
        roundNumber: context.roundNumber
      },
      outcome: 0,
      duration: Math.max(...adaptations.map(a => a.duration))
    };
    
    this.adaptationHistory.push(record);
    this.strategyState.adaptationHistory.push(record);
    
    if (this.adaptationHistory.length > this.config.memoryHorizon) {
      this.adaptationHistory.shift();
    }
  }

  private updateStrategyState(adaptations: StrategyAdaptation[], context: AdaptationContext): void {
    this.strategyState.stability *= 0.95;
    this.lastAdaptationTime = Date.now();
    
    for (const adaptation of adaptations) {
      this.adaptationCooldowns.set(adaptation.parameter, Date.now() + 5000);
    }
  }

  private isInCooldown(strategyId: string): boolean {
    const cooldownEnd = this.adaptationCooldowns.get(strategyId);
    return cooldownEnd ? Date.now() < cooldownEnd : false;
  }

  private getContextMultiplier(adaptation: StrategyAdaptation, context: AdaptationContext): number {
    return 1.0;
  }

  private isNovelAdaptation(adaptation: StrategyAdaptation): boolean {
    return !this.adaptationHistory.some(record => 
      record.adaptation.includes(adaptation.parameter)
    );
  }

  private getHistoricalConfidence(adaptations: StrategyAdaptation[]): number {
    if (this.adaptationHistory.length === 0) return 0.5;
    
    const relevantHistory = this.adaptationHistory.filter(record =>
      adaptations.some(adaptation => record.adaptation.includes(adaptation.parameter))
    );
    
    if (relevantHistory.length === 0) return 0.5;
    
    const avgOutcome = relevantHistory.reduce((sum, record) => sum + record.outcome, 0) / relevantHistory.length;
    return Math.max(0, Math.min(1, avgOutcome + 0.5));
  }

  private calculatePerformanceBaseline(): void {
    this.performanceBaseline = 0.5;
  }

  public getStrategyState(): StrategyState {
    return { ...this.strategyState };
  }

  public updatePerformanceFeedback(adaptationId: string, performance: number): void {
    const adaptation = this.strategyState.activeAdaptations.find(a => a.adaptationId === adaptationId);
    if (adaptation) {
      adaptation.performance = performance;
      this.adjustStrategyEffectiveness(performance);
    }
  }

  private adjustStrategyEffectiveness(performance: number): void {
    const learningRate = this.config.learningRate;
    const currentEffectiveness = this.strategyState.effectiveness;
    this.strategyState.effectiveness = currentEffectiveness + learningRate * (performance - currentEffectiveness);
  }

  public cleanupExpiredAdaptations(): void {
    const now = Date.now();
    this.strategyState.activeAdaptations = this.strategyState.activeAdaptations.filter(adaptation => 
      adaptation.endTime > now
    );
  }

  public getAdaptationMetrics(): { total: number; active: number; success_rate: number } {
    const total = this.adaptationHistory.length;
    const active = this.strategyState.activeAdaptations.length;
    const successful = this.adaptationHistory.filter(record => record.outcome > 0).length;
    const success_rate = total > 0 ? successful / total : 0;
    
    return { total, active, success_rate };
  }
}