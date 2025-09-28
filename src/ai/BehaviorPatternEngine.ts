import { EventEmitter } from '../utils/EventEmitter';

export interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  category: BehaviorCategory;
  traits: BehaviorTrait[];
  triggers: BehaviorTrigger[];
  actions: BehaviorAction[];
  constraints: BehaviorConstraint[];
  adaptability: number;
  stability: number;
  confidence: number;
}

export type BehaviorCategory = 
  | 'aggressive' 
  | 'conservative' 
  | 'opportunistic' 
  | 'defensive' 
  | 'collaborative' 
  | 'unpredictable' 
  | 'analytical' 
  | 'emotional';

export interface BehaviorTrait {
  name: string;
  value: number;
  weight: number;
  volatility: number;
  influenceFactors: string[];
}

export interface BehaviorTrigger {
  event: string;
  condition: string;
  threshold: number;
  priority: number;
  cooldown: number;
  context: string[];
}

export interface BehaviorAction {
  type: string;
  parameters: Record<string, any>;
  probability: number;
  intensity: number;
  duration: number;
  prerequisites: string[];
}

export interface BehaviorConstraint {
  type: 'resource' | 'time' | 'social' | 'ethical' | 'strategic';
  condition: string;
  severity: number;
  penalty: number;
}

export interface BehaviorContext {
  playerId: string;
  gameState: GameState;
  playerStates: PlayerState[];
  recentEvents: GameEvent[];
  socialDynamics: SocialDynamics;
  environmentalFactors: EnvironmentalFactor[];
  timeConstraints: TimeConstraint;
}

export interface GameState {
  phase: string;
  round: number;
  turn: string;
  board: BoardState;
  market: MarketState;
  events: ActiveEvent[];
}

export interface PlayerState {
  id: string;
  position: number;
  cash: number;
  properties: Property[];
  status: string;
  reputation: number;
  alliances: string[];
  conflicts: string[];
}

export interface Property {
  id: string;
  name: string;
  owner: string;
  value: number;
  rent: number;
  monopoly: boolean;
}

export interface GameEvent {
  type: string;
  timestamp: number;
  participants: string[];
  outcome: string;
  impact: number;
}

export interface SocialDynamics {
  alliances: Alliance[];
  conflicts: Conflict[];
  trustLevels: Map<string, number>;
  influenceNetwork: Map<string, number>;
  socialPressure: number;
}

export interface Alliance {
  members: string[];
  strength: number;
  purpose: string;
  duration: number;
}

export interface Conflict {
  parties: string[];
  intensity: number;
  cause: string;
  resolution: string;
}

export interface EnvironmentalFactor {
  name: string;
  value: number;
  trend: string;
  impact: number;
}

export interface TimeConstraint {
  timeRemaining: number;
  pressure: number;
  urgency: number;
}

export interface BoardState {
  properties: Property[];
  specialSpaces: SpecialSpace[];
  cards: CardDeck[];
}

export interface SpecialSpace {
  id: string;
  type: string;
  effect: string;
  activated: boolean;
}

export interface CardDeck {
  type: string;
  cards: Card[];
  remaining: number;
}

export interface Card {
  id: string;
  type: string;
  effect: string;
  value: number;
}

export interface MarketState {
  volatility: number;
  liquidity: number;
  sentiment: string;
  trends: MarketTrend[];
}

export interface MarketTrend {
  sector: string;
  direction: string;
  strength: number;
  duration: number;
}

export interface ActiveEvent {
  id: string;
  type: string;
  effect: string;
  duration: number;
  affectedPlayers: string[];
}

export interface BehaviorDecision {
  pattern: BehaviorPattern;
  actions: BehaviorAction[];
  confidence: number;
  reasoning: string;
  alternatives: BehaviorAlternative[];
  riskAssessment: number;
  expectedOutcome: string;
}

export interface BehaviorAlternative {
  pattern: BehaviorPattern;
  probability: number;
  reasoning: string;
}

export interface BehaviorAnalysis {
  dominantPatterns: BehaviorPattern[];
  emergentBehaviors: EmergentBehavior[];
  adaptationNeeds: AdaptationNeed[];
  socialInfluences: SocialInfluence[];
  performanceMetrics: BehaviorMetrics;
}

export interface EmergentBehavior {
  description: string;
  frequency: number;
  triggers: string[];
  impact: number;
}

export interface AdaptationNeed {
  area: string;
  urgency: number;
  recommendation: string;
}

export interface SocialInfluence {
  source: string;
  type: string;
  strength: number;
  direction: string;
}

export interface BehaviorMetrics {
  consistency: number;
  effectiveness: number;
  adaptability: number;
  predictability: number;
  socialAlignment: number;
}

export class BehaviorPatternEngine extends EventEmitter {
  private patterns: Map<string, BehaviorPattern> = new Map();
  private activeBehaviors: Map<string, BehaviorPattern[]> = new Map();
  private behaviorHistory: Map<string, BehaviorDecision[]> = new Map();
  private socialGraph: Map<string, Map<string, number>> = new Map();
  private contextMemory: BehaviorContext[] = [];
  private learningRate: number = 0.1;
  private adaptationThreshold: number = 0.7;

  constructor() {
    super();
    this.initializeDefaultPatterns();
  }

  public async selectBehaviorPattern(context: BehaviorContext): Promise<BehaviorDecision> {
    try {
      const candidatePatterns = await this.evaluatePatterns(context);
      const selectedPattern = this.selectOptimalPattern(candidatePatterns, context);
      const actions = await this.generateActions(selectedPattern, context);
      const alternatives = this.generateAlternatives(candidatePatterns, context);

      const decision: BehaviorDecision = {
        pattern: selectedPattern,
        actions,
        confidence: this.calculateConfidence(selectedPattern, context),
        reasoning: this.generateReasoning(selectedPattern, context),
        alternatives,
        riskAssessment: this.assessRisk(selectedPattern, context),
        expectedOutcome: this.predictOutcome(selectedPattern, actions, context)
      };

      await this.recordDecision(context.playerId, decision);
      this.updateSocialDynamics(decision, context);
      
      this.emit('behavior_selected', { decision, context });
      return decision;

    } catch (error) {
      this.emit('error', { type: 'behavior_selection_failed', error });
      return this.getDefaultBehaviorDecision(context);
    }
  }

  private async evaluatePatterns(context: BehaviorContext): Promise<Array<{ pattern: BehaviorPattern; score: number }>> {
    const evaluations: Array<{ pattern: BehaviorPattern; score: number }> = [];

    for (const [id, pattern] of this.patterns) {
      const score = await this.calculatePatternScore(pattern, context);
      if (score > 0) {
        evaluations.push({ pattern, score });
      }
    }

    return evaluations.sort((a, b) => b.score - a.score);
  }

  private async calculatePatternScore(pattern: BehaviorPattern, context: BehaviorContext): Promise<number> {
    let score = 0;

    score += this.evaluateTraitAlignment(pattern.traits, context);
    score += this.evaluateTriggerActivation(pattern.triggers, context);
    score += this.evaluateSocialCompatibility(pattern, context);
    score += this.evaluateHistoricalPerformance(pattern, context);
    score += this.evaluateEnvironmentalFit(pattern, context);

    score *= pattern.confidence;
    score *= this.getContextualBonus(pattern, context);

    return Math.max(0, Math.min(1, score));
  }

  private evaluateTraitAlignment(traits: BehaviorTrait[], context: BehaviorContext): number {
    let alignment = 0;
    
    for (const trait of traits) {
      const contextValue = this.extractContextValue(trait.name, context);
      const difference = Math.abs(trait.value - contextValue);
      const traitScore = Math.max(0, 1 - difference) * trait.weight;
      alignment += traitScore;
    }
    
    return traits.length > 0 ? alignment / traits.length : 0;
  }

  private evaluateTriggerActivation(triggers: BehaviorTrigger[], context: BehaviorContext): number {
    let activation = 0;
    
    for (const trigger of triggers) {
      if (this.isTriggerActivated(trigger, context)) {
        activation += trigger.priority;
      }
    }
    
    return triggers.length > 0 ? Math.min(1, activation / triggers.length) : 0;
  }

  private evaluateSocialCompatibility(pattern: BehaviorPattern, context: BehaviorContext): number {
    const playerSocial = this.socialGraph.get(context.playerId);
    if (!playerSocial) return 0.5;

    let compatibility = 0;
    let relationships = 0;

    for (const playerState of context.playerStates) {
      if (playerState.id === context.playerId) continue;
      
      const relationship = playerSocial.get(playerState.id) || 0;
      const patternCompatibility = this.calculatePatternCompatibility(pattern, playerState);
      compatibility += relationship * patternCompatibility;
      relationships++;
    }

    return relationships > 0 ? compatibility / relationships : 0.5;
  }

  private evaluateHistoricalPerformance(pattern: BehaviorPattern, context: BehaviorContext): number {
    const history = this.behaviorHistory.get(context.playerId) || [];
    const patternHistory = history.filter(decision => decision.pattern.id === pattern.id);
    
    if (patternHistory.length === 0) return 0.5;
    
    const recentHistory = patternHistory.slice(-10);
    const avgConfidence = recentHistory.reduce((sum, decision) => sum + decision.confidence, 0) / recentHistory.length;
    
    return avgConfidence;
  }

  private evaluateEnvironmentalFit(pattern: BehaviorPattern, context: BehaviorContext): number {
    const gamePhaseScore = this.evaluateGamePhaseAlignment(pattern, context.gameState.phase);
    const marketScore = this.evaluateMarketAlignment(pattern, context.gameState.market);
    const eventScore = this.evaluateEventAlignment(pattern, context.recentEvents);
    
    return (gamePhaseScore + marketScore + eventScore) / 3;
  }

  private selectOptimalPattern(candidates: Array<{ pattern: BehaviorPattern; score: number }>, context: BehaviorContext): BehaviorPattern {
    if (candidates.length === 0) {
      return this.getDefaultPattern();
    }

    const topCandidates = candidates.slice(0, 3);
    const weights = topCandidates.map(c => c.score);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) {
      return candidates[0].pattern;
    }

    const random = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (let i = 0; i < topCandidates.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return topCandidates[i].pattern;
      }
    }
    
    return topCandidates[0].pattern;
  }

  private async generateActions(pattern: BehaviorPattern, context: BehaviorContext): Promise<BehaviorAction[]> {
    const relevantActions = pattern.actions.filter(action => 
      this.isActionApplicable(action, context)
    );

    const prioritizedActions = relevantActions
      .map(action => ({
        ...action,
        adjustedProbability: this.adjustActionProbability(action, context)
      }))
      .filter(action => action.adjustedProbability > 0.1)
      .sort((a, b) => b.adjustedProbability - a.adjustedProbability);

    return prioritizedActions.slice(0, 5);
  }

  private generateAlternatives(candidates: Array<{ pattern: BehaviorPattern; score: number }>, context: BehaviorContext): BehaviorAlternative[] {
    return candidates
      .slice(1, 4)
      .map(candidate => ({
        pattern: candidate.pattern,
        probability: candidate.score,
        reasoning: this.generateAlternativeReasoning(candidate.pattern, context)
      }));
  }

  private calculateConfidence(pattern: BehaviorPattern, context: BehaviorContext): number {
    const baseConfidence = pattern.confidence;
    const historicalConfidence = this.evaluateHistoricalPerformance(pattern, context);
    const contextConfidence = this.evaluateContextCertainty(context);
    
    return (baseConfidence + historicalConfidence + contextConfidence) / 3;
  }

  private generateReasoning(pattern: BehaviorPattern, context: BehaviorContext): string {
    const reasons = [];
    
    if (pattern.category === 'aggressive' && context.gameState.phase === 'late') {
      reasons.push('Late game requires aggressive tactics');
    }
    
    if (pattern.category === 'conservative' && context.gameState.market.volatility > 0.7) {
      reasons.push('High market volatility favors conservative approach');
    }
    
    const activeTriggers = pattern.triggers.filter(trigger => 
      this.isTriggerActivated(trigger, context)
    );
    
    if (activeTriggers.length > 0) {
      reasons.push(`Triggered by: ${activeTriggers.map(t => t.event).join(', ')}`);
    }
    
    return reasons.length > 0 ? reasons.join('; ') : `Selected ${pattern.name} pattern based on current context`;
  }

  private assessRisk(pattern: BehaviorPattern, context: BehaviorContext): number {
    let risk = 0;
    
    if (pattern.category === 'aggressive') {
      risk += 0.3;
    }
    
    if (pattern.category === 'unpredictable') {
      risk += 0.4;
    }
    
    const marketRisk = context.gameState.market.volatility * 0.2;
    const socialRisk = this.calculateSocialRisk(pattern, context) * 0.3;
    const resourceRisk = this.calculateResourceRisk(pattern, context) * 0.2;
    
    return Math.min(1, risk + marketRisk + socialRisk + resourceRisk);
  }

  private predictOutcome(pattern: BehaviorPattern, actions: BehaviorAction[], context: BehaviorContext): string {
    const outcomes = [];
    
    if (pattern.category === 'aggressive') {
      outcomes.push('High risk, high reward potential');
    }
    
    if (pattern.category === 'conservative') {
      outcomes.push('Stable, gradual progress expected');
    }
    
    if (actions.some(action => action.type === 'trade')) {
      outcomes.push('Trade opportunities likely');
    }
    
    return outcomes.length > 0 ? outcomes.join('; ') : 'Moderate success expected';
  }

  private async recordDecision(playerId: string, decision: BehaviorDecision): Promise<void> {
    if (!this.behaviorHistory.has(playerId)) {
      this.behaviorHistory.set(playerId, []);
    }
    
    const history = this.behaviorHistory.get(playerId)!;
    history.push(decision);
    
    if (history.length > 100) {
      history.shift();
    }
    
    await this.updatePatternLearning(decision);
  }

  private updateSocialDynamics(decision: BehaviorDecision, context: BehaviorContext): void {
    const playerId = context.playerId;
    
    if (!this.socialGraph.has(playerId)) {
      this.socialGraph.set(playerId, new Map());
    }
    
    const playerSocial = this.socialGraph.get(playerId)!;
    
    for (const action of decision.actions) {
      this.updateSocialRelationships(playerId, action, context, playerSocial);
    }
  }

  private getDefaultBehaviorDecision(context: BehaviorContext): BehaviorDecision {
    const defaultPattern = this.getDefaultPattern();
    
    return {
      pattern: defaultPattern,
      actions: defaultPattern.actions.slice(0, 2),
      confidence: 0.3,
      reasoning: 'Fallback to default behavior',
      alternatives: [],
      riskAssessment: 0.5,
      expectedOutcome: 'Neutral outcome expected'
    };
  }

  private initializeDefaultPatterns(): void {
    const aggressivePattern: BehaviorPattern = {
      id: 'aggressive',
      name: 'Aggressive Player',
      description: 'High-risk, high-reward strategy',
      category: 'aggressive',
      traits: [
        { name: 'risk_tolerance', value: 0.8, weight: 1.0, volatility: 0.2, influenceFactors: ['market_volatility'] },
        { name: 'competitiveness', value: 0.9, weight: 0.8, volatility: 0.1, influenceFactors: ['opponent_strength'] }
      ],
      triggers: [
        { event: 'property_available', condition: 'high_value', threshold: 0.7, priority: 0.8, cooldown: 0, context: ['market'] }
      ],
      actions: [
        { type: 'bid_high', parameters: { multiplier: 1.2 }, probability: 0.8, intensity: 0.9, duration: 1000, prerequisites: [] }
      ],
      constraints: [
        { type: 'resource', condition: 'cash > 500', severity: 0.8, penalty: 0.5 }
      ],
      adaptability: 0.7,
      stability: 0.6,
      confidence: 0.7
    };

    const conservativePattern: BehaviorPattern = {
      id: 'conservative',
      name: 'Conservative Player',
      description: 'Low-risk, steady progress strategy',
      category: 'conservative',
      traits: [
        { name: 'risk_tolerance', value: 0.2, weight: 1.0, volatility: 0.1, influenceFactors: ['market_stability'] },
        { name: 'patience', value: 0.8, weight: 0.9, volatility: 0.05, influenceFactors: ['time_pressure'] }
      ],
      triggers: [
        { event: 'safe_investment', condition: 'low_risk', threshold: 0.3, priority: 0.9, cooldown: 0, context: ['market'] }
      ],
      actions: [
        { type: 'conservative_bid', parameters: { multiplier: 0.8 }, probability: 0.9, intensity: 0.5, duration: 1000, prerequisites: [] }
      ],
      constraints: [
        { type: 'resource', condition: 'cash > 1000', severity: 0.9, penalty: 0.8 }
      ],
      adaptability: 0.5,
      stability: 0.9,
      confidence: 0.8
    };

    this.patterns.set('aggressive', aggressivePattern);
    this.patterns.set('conservative', conservativePattern);
  }

  private extractContextValue(traitName: string, context: BehaviorContext): number {
    switch (traitName) {
      case 'risk_tolerance':
        return context.gameState.market.volatility;
      case 'competitiveness':
        return context.socialDynamics.socialPressure;
      case 'patience':
        return 1 - context.timeConstraints.pressure;
      default:
        return 0.5;
    }
  }

  private isTriggerActivated(trigger: BehaviorTrigger, context: BehaviorContext): boolean {
    return Math.random() > 0.5;
  }

  private calculatePatternCompatibility(pattern: BehaviorPattern, playerState: PlayerState): number {
    return 0.5;
  }

  private evaluateGamePhaseAlignment(pattern: BehaviorPattern, phase: string): number {
    const phaseAlignment = {
      'aggressive': { 'early': 0.3, 'mid': 0.7, 'late': 0.9 },
      'conservative': { 'early': 0.8, 'mid': 0.6, 'late': 0.4 }
    };
    
    return phaseAlignment[pattern.category]?.[phase] || 0.5;
  }

  private evaluateMarketAlignment(pattern: BehaviorPattern, market: MarketState): number {
    if (pattern.category === 'aggressive' && market.volatility > 0.7) {
      return 0.8;
    }
    if (pattern.category === 'conservative' && market.volatility < 0.3) {
      return 0.8;
    }
    return 0.5;
  }

  private evaluateEventAlignment(pattern: BehaviorPattern, events: GameEvent[]): number {
    return 0.5;
  }

  private getDefaultPattern(): BehaviorPattern {
    return this.patterns.get('conservative')!;
  }

  private isActionApplicable(action: BehaviorAction, context: BehaviorContext): boolean {
    return action.prerequisites.every(prereq => this.checkPrerequisite(prereq, context));
  }

  private adjustActionProbability(action: BehaviorAction, context: BehaviorContext): number {
    return action.probability;
  }

  private generateAlternativeReasoning(pattern: BehaviorPattern, context: BehaviorContext): string {
    return `Alternative ${pattern.name} pattern considered`;
  }

  private evaluateContextCertainty(context: BehaviorContext): number {
    return 0.7;
  }

  private calculateSocialRisk(pattern: BehaviorPattern, context: BehaviorContext): number {
    return 0.3;
  }

  private calculateResourceRisk(pattern: BehaviorPattern, context: BehaviorContext): number {
    return 0.2;
  }

  private async updatePatternLearning(decision: BehaviorDecision): Promise<void> {
    
  }

  private updateSocialRelationships(playerId: string, action: BehaviorAction, context: BehaviorContext, playerSocial: Map<string, number>): void {
    
  }

  private checkPrerequisite(prereq: string, context: BehaviorContext): boolean {
    return true;
  }

  private getContextualBonus(pattern: BehaviorPattern, context: BehaviorContext): number {
    return 1.0;
  }

  public addCustomPattern(pattern: BehaviorPattern): void {
    this.patterns.set(pattern.id, pattern);
    this.emit('pattern_added', { pattern });
  }

  public removePattern(patternId: string): boolean {
    const removed = this.patterns.delete(patternId);
    if (removed) {
      this.emit('pattern_removed', { patternId });
    }
    return removed;
  }

  public getPatternAnalysis(playerId: string): BehaviorAnalysis {
    const history = this.behaviorHistory.get(playerId) || [];
    const recentDecisions = history.slice(-20);
    
    const dominantPatterns = this.calculateDominantPatterns(recentDecisions);
    const emergentBehaviors = this.identifyEmergentBehaviors(recentDecisions);
    const adaptationNeeds = this.assessAdaptationNeeds(recentDecisions);
    const socialInfluences = this.analyzeSocialInfluences(playerId);
    const performanceMetrics = this.calculateBehaviorMetrics(recentDecisions);

    return {
      dominantPatterns,
      emergentBehaviors,
      adaptationNeeds,
      socialInfluences,
      performanceMetrics
    };
  }

  private calculateDominantPatterns(decisions: BehaviorDecision[]): BehaviorPattern[] {
    const patternCounts = new Map<string, number>();
    
    for (const decision of decisions) {
      const count = patternCounts.get(decision.pattern.id) || 0;
      patternCounts.set(decision.pattern.id, count + 1);
    }
    
    const sortedPatterns = Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    return sortedPatterns
      .map(([patternId]) => this.patterns.get(patternId))
      .filter(pattern => pattern !== undefined) as BehaviorPattern[];
  }

  private identifyEmergentBehaviors(decisions: BehaviorDecision[]): EmergentBehavior[] {
    return [];
  }

  private assessAdaptationNeeds(decisions: BehaviorDecision[]): AdaptationNeed[] {
    return [];
  }

  private analyzeSocialInfluences(playerId: string): SocialInfluence[] {
    return [];
  }

  private calculateBehaviorMetrics(decisions: BehaviorDecision[]): BehaviorMetrics {
    if (decisions.length === 0) {
      return {
        consistency: 0.5,
        effectiveness: 0.5,
        adaptability: 0.5,
        predictability: 0.5,
        socialAlignment: 0.5
      };
    }

    const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
    const patternVariety = new Set(decisions.map(d => d.pattern.id)).size;
    
    return {
      consistency: avgConfidence,
      effectiveness: avgConfidence,
      adaptability: Math.min(1, patternVariety / 5),
      predictability: 1 - (patternVariety / decisions.length),
      socialAlignment: 0.5
    };
  }

  public getActivePatterns(playerId: string): BehaviorPattern[] {
    return this.activeBehaviors.get(playerId) || [];
  }

  public getAllPatterns(): BehaviorPattern[] {
    return Array.from(this.patterns.values());
  }

  public getBehaviorHistory(playerId: string): BehaviorDecision[] {
    return this.behaviorHistory.get(playerId) || [];
  }
}