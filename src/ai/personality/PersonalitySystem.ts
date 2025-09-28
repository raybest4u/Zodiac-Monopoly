import { AICharacterProfile, PersonalityTraits } from './AICharacterGenerator';

export interface PersonalityState {
  currentMood: 'excited' | 'confident' | 'frustrated' | 'cautious' | 'aggressive' | 'calm';
  stressLevel: number;           // 0-1: 压力水平
  confidenceLevel: number;       // 0-1: 信心水平
  energyLevel: number;           // 0-1: 精力水平
  focusLevel: number;            // 0-1: 专注水平
  emotionalState: {
    dominance: number;           // 0-1: 主导性情绪
    arousal: number;             // 0-1: 兴奋度
    pleasure: number;            // 0-1: 愉悦度
  };
  socialDisposition: {
    cooperation: number;         // 0-1: 合作倾向
    trust: number;               // 0-1: 信任度
    aggression: number;          // 0-1: 攻击性
    empathy: number;             // 0-1: 共情能力
  };
  motivationalDrives: {
    achievement: number;         // 0-1: 成就驱动
    power: number;               // 0-1: 权力驱动
    affiliation: number;         // 0-1: 归属驱动
    autonomy: number;            // 0-1: 自主驱动
  };
}

export interface PersonalityEvent {
  type: 'game_event' | 'social_interaction' | 'decision_outcome' | 'external_trigger';
  description: string;
  impact: {
    trait: keyof PersonalityTraits;
    magnitude: number;           // -1 to 1
    duration: number;            // minutes
  }[];
  emotionalImpact: {
    mood: PersonalityState['currentMood'];
    stressChange: number;
    confidenceChange: number;
    energyChange: number;
  };
  timestamp: number;
}

export interface PersonalityMemory {
  eventId: string;
  playerInteraction: string;
  outcome: 'positive' | 'negative' | 'neutral';
  emotionalWeight: number;     // 0-1: 情感权重
  reinforcementValue: number;  // -1 to 1: 强化值
  decayRate: number;           // 记忆衰减率
  timestamp: number;
  associations: string[];      // 关联记忆
}

export interface PersonalityEvolution {
  baseTraits: PersonalityTraits;
  currentTraits: PersonalityTraits;
  temporaryModifiers: Map<string, {
    trait: keyof PersonalityTraits;
    modifier: number;
    expiry: number;
  }>;
  permanentAdjustments: Map<string, {
    trait: keyof PersonalityTraits;
    adjustment: number;
    reason: string;
    timestamp: number;
  }>;
  evolutionHistory: {
    timestamp: number;
    traitChange: Partial<PersonalityTraits>;
    trigger: string;
  }[];
}

export class PersonalitySystem {
  private characterProfile: AICharacterProfile;
  private currentState: PersonalityState;
  private evolution: PersonalityEvolution;
  private memories: Map<string, PersonalityMemory> = new Map();
  private eventHistory: PersonalityEvent[] = [];
  private stateUpdateInterval: NodeJS.Timeout | null = null;

  constructor(characterProfile: AICharacterProfile) {
    this.characterProfile = characterProfile;
    this.currentState = this.initializePersonalityState(characterProfile);
    this.evolution = this.initializePersonalityEvolution(characterProfile);
    this.startPersonalityEngine();
  }

  private initializePersonalityState(profile: AICharacterProfile): PersonalityState {
    const traits = profile.personalityTraits;
    
    return {
      currentMood: this.determineMoodFromTraits(traits),
      stressLevel: 0.3,
      confidenceLevel: (traits.leadership + traits.independence + traits.analytical) / 3,
      energyLevel: (traits.aggression + traits.risktaking + traits.adaptability) / 3,
      focusLevel: (traits.patience + traits.analytical) / 2,
      emotionalState: {
        dominance: (traits.leadership + traits.aggression) / 2,
        arousal: (traits.emotional + traits.risktaking) / 2,
        pleasure: 0.6
      },
      socialDisposition: {
        cooperation: traits.social * 0.7 + traits.loyalty * 0.3,
        trust: traits.loyalty,
        aggression: traits.aggression,
        empathy: traits.social * 0.6 + traits.emotional * 0.4
      },
      motivationalDrives: {
        achievement: (traits.leadership + traits.analytical) / 2,
        power: (traits.aggression + traits.leadership) / 2,
        affiliation: traits.social,
        autonomy: traits.independence
      }
    };
  }

  private initializePersonalityEvolution(profile: AICharacterProfile): PersonalityEvolution {
    return {
      baseTraits: { ...profile.personalityTraits },
      currentTraits: { ...profile.personalityTraits },
      temporaryModifiers: new Map(),
      permanentAdjustments: new Map(),
      evolutionHistory: []
    };
  }

  private determineMoodFromTraits(traits: PersonalityTraits): PersonalityState['currentMood'] {
    if (traits.aggression > 0.7) return 'aggressive';
    if (traits.emotional > 0.7 && traits.risktaking > 0.6) return 'excited';
    if (traits.analytical > 0.7 && traits.patience > 0.6) return 'calm';
    if (traits.leadership > 0.7) return 'confident';
    if (traits.risktaking < 0.4) return 'cautious';
    return 'calm';
  }

  public processEvent(event: PersonalityEvent): void {
    this.eventHistory.push(event);
    
    // 更新情绪状态
    this.updateEmotionalState(event);
    
    // 处理特质影响
    this.processTraitImpacts(event);
    
    // 存储记忆
    this.storeEventMemory(event);
    
    // 触发适应性变化
    this.triggerAdaptiveChanges(event);
    
    // 限制历史长度
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-80);
    }
  }

  private updateEmotionalState(event: PersonalityEvent): void {
    const impact = event.emotionalImpact;
    
    // 更新情绪状态
    this.currentState.currentMood = impact.mood;
    this.currentState.stressLevel = Math.max(0, Math.min(1, 
      this.currentState.stressLevel + impact.stressChange
    ));
    this.currentState.confidenceLevel = Math.max(0, Math.min(1, 
      this.currentState.confidenceLevel + impact.confidenceChange
    ));
    this.currentState.energyLevel = Math.max(0, Math.min(1, 
      this.currentState.energyLevel + impact.energyChange
    ));

    // 更新复合情绪指标
    this.updateComplexEmotionalStates(event);
  }

  private updateComplexEmotionalStates(event: PersonalityEvent): void {
    const emotionalState = this.currentState.emotionalState;
    const socialDisposition = this.currentState.socialDisposition;
    
    // 基于事件类型调整情绪维度
    switch (event.type) {
      case 'game_event':
        if (event.description.includes('win') || event.description.includes('success')) {
          emotionalState.pleasure += 0.1;
          emotionalState.dominance += 0.05;
          socialDisposition.cooperation += 0.02;
        } else if (event.description.includes('loss') || event.description.includes('fail')) {
          emotionalState.pleasure -= 0.1;
          emotionalState.arousal += 0.05;
          socialDisposition.aggression += 0.03;
        }
        break;
        
      case 'social_interaction':
        if (event.description.includes('alliance') || event.description.includes('cooperation')) {
          socialDisposition.trust += 0.05;
          socialDisposition.cooperation += 0.1;
          emotionalState.pleasure += 0.05;
        } else if (event.description.includes('betrayal') || event.description.includes('conflict')) {
          socialDisposition.trust -= 0.1;
          socialDisposition.aggression += 0.1;
          emotionalState.arousal += 0.1;
        }
        break;
    }

    // 归一化数值
    this.normalizeEmotionalStates();
  }

  private processTraitImpacts(event: PersonalityEvent): void {
    for (const impact of event.impact) {
      const modifierId = `${event.type}_${Date.now()}_${Math.random()}`;
      const expiry = Date.now() + (impact.duration * 60 * 1000);
      
      this.evolution.temporaryModifiers.set(modifierId, {
        trait: impact.trait,
        modifier: impact.magnitude,
        expiry
      });
    }

    this.updateCurrentTraits();
  }

  private updateCurrentTraits(): void {
    // 从基础特质开始
    const currentTraits = { ...this.evolution.baseTraits };
    
    // 应用永久调整
    for (const adjustment of this.evolution.permanentAdjustments.values()) {
      currentTraits[adjustment.trait] = Math.max(0, Math.min(1, 
        currentTraits[adjustment.trait] + adjustment.adjustment
      ));
    }
    
    // 应用临时修饰符
    const now = Date.now();
    for (const [id, modifier] of this.evolution.temporaryModifiers.entries()) {
      if (now > modifier.expiry) {
        this.evolution.temporaryModifiers.delete(id);
        continue;
      }
      
      currentTraits[modifier.trait] = Math.max(0, Math.min(1, 
        currentTraits[modifier.trait] + modifier.modifier
      ));
    }
    
    this.evolution.currentTraits = currentTraits;
  }

  private storeEventMemory(event: PersonalityEvent): void {
    const memory: PersonalityMemory = {
      eventId: `memory_${Date.now()}_${Math.random()}`,
      playerInteraction: event.description,
      outcome: this.determineOutcome(event),
      emotionalWeight: this.calculateEmotionalWeight(event),
      reinforcementValue: this.calculateReinforcementValue(event),
      decayRate: 0.01, // 每天衰减1%
      timestamp: Date.now(),
      associations: this.findMemoryAssociations(event)
    };

    this.memories.set(memory.eventId, memory);
    
    // 限制记忆数量
    if (this.memories.size > 200) {
      this.pruneOldMemories();
    }
  }

  private determineOutcome(event: PersonalityEvent): PersonalityMemory['outcome'] {
    const overallImpact = event.impact.reduce((sum, imp) => sum + imp.magnitude, 0);
    if (overallImpact > 0.1) return 'positive';
    if (overallImpact < -0.1) return 'negative';
    return 'neutral';
  }

  private calculateEmotionalWeight(event: PersonalityEvent): number {
    const stressImpact = Math.abs(event.emotionalImpact.stressChange);
    const confidenceImpact = Math.abs(event.emotionalImpact.confidenceChange);
    const energyImpact = Math.abs(event.emotionalImpact.energyChange);
    
    return Math.min(1, (stressImpact + confidenceImpact + energyImpact) / 3);
  }

  private calculateReinforcementValue(event: PersonalityEvent): number {
    const outcome = this.determineOutcome(event);
    const emotionalWeight = this.calculateEmotionalWeight(event);
    
    switch (outcome) {
      case 'positive': return emotionalWeight;
      case 'negative': return -emotionalWeight;
      default: return 0;
    }
  }

  private findMemoryAssociations(event: PersonalityEvent): string[] {
    const associations: string[] = [];
    const keywords = event.description.toLowerCase().split(' ');
    
    for (const memory of this.memories.values()) {
      const memoryKeywords = memory.playerInteraction.toLowerCase().split(' ');
      const commonWords = keywords.filter(word => memoryKeywords.includes(word));
      
      if (commonWords.length > 1) {
        associations.push(memory.eventId);
      }
    }
    
    return associations.slice(0, 5); // 最多5个关联
  }

  private triggerAdaptiveChanges(event: PersonalityEvent): void {
    // 检查是否需要永久性格调整
    const recentSimilarEvents = this.getRecentSimilarEvents(event, 7); // 7天内
    
    if (recentSimilarEvents.length >= 3) {
      this.applyPermanentPersonalityAdjustment(event, recentSimilarEvents);
    }
    
    // 检查极端情况
    if (this.currentState.stressLevel > 0.8) {
      this.handleHighStressAdaptation();
    }
    
    if (this.currentState.confidenceLevel < 0.2) {
      this.handleLowConfidenceAdaptation();
    }
  }

  private getRecentSimilarEvents(targetEvent: PersonalityEvent, days: number): PersonalityEvent[] {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    return this.eventHistory.filter(event => 
      event.timestamp > cutoffTime &&
      event.type === targetEvent.type &&
      this.calculateEventSimilarity(event, targetEvent) > 0.7
    );
  }

  private calculateEventSimilarity(event1: PersonalityEvent, event2: PersonalityEvent): number {
    const keywords1 = event1.description.toLowerCase().split(' ');
    const keywords2 = event2.description.toLowerCase().split(' ');
    
    const commonWords = keywords1.filter(word => keywords2.includes(word));
    const totalWords = new Set([...keywords1, ...keywords2]).size;
    
    return commonWords.length / totalWords;
  }

  private applyPermanentPersonalityAdjustment(
    triggerEvent: PersonalityEvent, 
    similarEvents: PersonalityEvent[]
  ): void {
    const adjustmentId = `permanent_${Date.now()}`;
    
    // 计算调整幅度
    const avgImpact = similarEvents.reduce((sum, event) => 
      sum + event.impact.reduce((impSum, imp) => impSum + Math.abs(imp.magnitude), 0), 0
    ) / similarEvents.length;
    
    const adjustmentMagnitude = Math.min(0.1, avgImpact * 0.1); // 最大10%调整
    
    // 选择受影响最大的特质
    const traitImpacts = new Map<keyof PersonalityTraits, number>();
    
    for (const event of similarEvents) {
      for (const impact of event.impact) {
        const current = traitImpacts.get(impact.trait) || 0;
        traitImpacts.set(impact.trait, current + impact.magnitude);
      }
    }
    
    const mostImpactedTrait = Array.from(traitImpacts.entries())
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
    
    if (mostImpactedTrait) {
      const adjustment = mostImpactedTrait[1] > 0 ? adjustmentMagnitude : -adjustmentMagnitude;
      
      this.evolution.permanentAdjustments.set(adjustmentId, {
        trait: mostImpactedTrait[0],
        adjustment,
        reason: `Repeated ${triggerEvent.type} experiences`,
        timestamp: Date.now()
      });
      
      this.evolution.evolutionHistory.push({
        timestamp: Date.now(),
        traitChange: { [mostImpactedTrait[0]]: adjustment },
        trigger: `Repeated pattern: ${triggerEvent.description}`
      });
      
      console.log(`Personality evolution: ${mostImpactedTrait[0]} adjusted by ${adjustment.toFixed(3)}`);
    }
  }

  private handleHighStressAdaptation(): void {
    // 高压力情况下的适应机制
    const stressReductionModifier = {
      trait: 'patience' as keyof PersonalityTraits,
      modifier: 0.1,
      expiry: Date.now() + (60 * 60 * 1000) // 1小时
    };
    
    this.evolution.temporaryModifiers.set(`stress_adaptation_${Date.now()}`, stressReductionModifier);
    
    // 降低攻击性
    this.currentState.socialDisposition.aggression *= 0.9;
    this.currentState.socialDisposition.cooperation += 0.05;
  }

  private handleLowConfidenceAdaptation(): void {
    // 低信心情况下的适应机制
    const confidenceBoostModifier = {
      trait: 'analytical' as keyof PersonalityTraits,
      modifier: 0.05,
      expiry: Date.now() + (30 * 60 * 1000) // 30分钟
    };
    
    this.evolution.temporaryModifiers.set(`confidence_adaptation_${Date.now()}`, confidenceBoostModifier);
    
    // 增加谨慎性
    this.currentState.currentMood = 'cautious';
    this.currentState.socialDisposition.trust *= 0.9;
  }

  private normalizeEmotionalStates(): void {
    // 确保所有情绪状态在合理范围内
    const emotional = this.currentState.emotionalState;
    const social = this.currentState.socialDisposition;
    
    emotional.dominance = Math.max(0, Math.min(1, emotional.dominance));
    emotional.arousal = Math.max(0, Math.min(1, emotional.arousal));
    emotional.pleasure = Math.max(0, Math.min(1, emotional.pleasure));
    
    social.cooperation = Math.max(0, Math.min(1, social.cooperation));
    social.trust = Math.max(0, Math.min(1, social.trust));
    social.aggression = Math.max(0, Math.min(1, social.aggression));
    social.empathy = Math.max(0, Math.min(1, social.empathy));
  }

  private pruneOldMemories(): void {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30天
    const memoriesToRemove: string[] = [];
    
    for (const [id, memory] of this.memories.entries()) {
      // 应用衰减
      memory.emotionalWeight *= (1 - memory.decayRate);
      
      // 移除过期或权重过低的记忆
      if (memory.timestamp < cutoffTime || memory.emotionalWeight < 0.1) {
        memoriesToRemove.push(id);
      }
    }
    
    memoriesToRemove.forEach(id => this.memories.delete(id));
  }

  private startPersonalityEngine(): void {
    this.stateUpdateInterval = setInterval(() => {
      this.updatePersonalityState();
      this.updateCurrentTraits();
      this.pruneOldMemories();
    }, 30000); // 每30秒更新一次
  }

  private updatePersonalityState(): void {
    // 自然情绪衰减
    this.currentState.stressLevel *= 0.995;
    this.currentState.energyLevel = Math.min(1, this.currentState.energyLevel + 0.01);
    
    // 情绪状态自然恢复
    const emotional = this.currentState.emotionalState;
    emotional.arousal *= 0.98;
    emotional.pleasure = 0.6 + (emotional.pleasure - 0.6) * 0.95;
    
    // 社交倾向缓慢回归
    const social = this.currentState.socialDisposition;
    const baseCooperation = this.evolution.currentTraits.social * 0.7 + this.evolution.currentTraits.loyalty * 0.3;
    social.cooperation = baseCooperation + (social.cooperation - baseCooperation) * 0.9;
  }

  public getCurrentPersonalityState(): PersonalityState {
    return { ...this.currentState };
  }

  public getCurrentTraits(): PersonalityTraits {
    return { ...this.evolution.currentTraits };
  }

  public getPersonalityAnalysis(): any {
    return {
      currentState: this.currentState,
      traitEvolution: {
        base: this.evolution.baseTraits,
        current: this.evolution.currentTraits,
        changes: this.calculateTraitChanges()
      },
      memoryProfile: this.analyzeMemoryProfile(),
      adaptationMetrics: this.calculateAdaptationMetrics(),
      predictions: this.generatePersonalityPredictions()
    };
  }

  private calculateTraitChanges(): Record<keyof PersonalityTraits, number> {
    const changes: Partial<Record<keyof PersonalityTraits, number>> = {};
    
    for (const [trait, currentValue] of Object.entries(this.evolution.currentTraits)) {
      const baseValue = this.evolution.baseTraits[trait as keyof PersonalityTraits];
      changes[trait as keyof PersonalityTraits] = currentValue - baseValue;
    }
    
    return changes as Record<keyof PersonalityTraits, number>;
  }

  private analyzeMemoryProfile(): any {
    const positiveMemories = Array.from(this.memories.values()).filter(m => m.outcome === 'positive');
    const negativeMemories = Array.from(this.memories.values()).filter(m => m.outcome === 'negative');
    
    return {
      totalMemories: this.memories.size,
      positiveRatio: positiveMemories.length / this.memories.size,
      negativeRatio: negativeMemories.length / this.memories.size,
      averageEmotionalWeight: Array.from(this.memories.values())
        .reduce((sum, m) => sum + m.emotionalWeight, 0) / this.memories.size,
      strongestMemories: Array.from(this.memories.values())
        .sort((a, b) => b.emotionalWeight - a.emotionalWeight)
        .slice(0, 5)
        .map(m => ({ description: m.playerInteraction, weight: m.emotionalWeight }))
    };
  }

  private calculateAdaptationMetrics(): any {
    return {
      adaptationEvents: this.evolution.permanentAdjustments.size,
      evolutionRate: this.evolution.evolutionHistory.length / Math.max(1, 
        (Date.now() - (this.evolution.evolutionHistory[0]?.timestamp || Date.now())) / (24 * 60 * 60 * 1000)
      ),
      stressResilience: 1 - this.currentState.stressLevel,
      emotionalStability: 1 - this.calculateEmotionalVolatility(),
      socialAdaptability: this.currentState.socialDisposition.cooperation * 
                           this.currentState.socialDisposition.empathy
    };
  }

  private calculateEmotionalVolatility(): number {
    if (this.eventHistory.length < 5) return 0;
    
    const recentMoods = this.eventHistory.slice(-10).map(e => e.emotionalImpact.stressChange);
    const avgChange = recentMoods.reduce((sum, change) => sum + Math.abs(change), 0) / recentMoods.length;
    
    return Math.min(1, avgChange);
  }

  private generatePersonalityPredictions(): any {
    const recentTrend = this.calculateTraitChanges();
    const predictions: Record<string, any> = {};
    
    for (const [trait, change] of Object.entries(recentTrend)) {
      predictions[trait] = {
        direction: change > 0.01 ? 'increasing' : change < -0.01 ? 'decreasing' : 'stable',
        magnitude: Math.abs(change),
        confidence: Math.min(1, this.eventHistory.length / 20)
      };
    }
    
    return predictions;
  }

  public simulatePersonalityResponse(scenario: string): any {
    const traits = this.evolution.currentTraits;
    const state = this.currentState;
    
    // 基于当前性格特质和状态预测反应
    const response = {
      emotionalReaction: this.predictEmotionalReaction(scenario, traits, state),
      behavioralTendency: this.predictBehavioralTendency(scenario, traits, state),
      decisionFactors: this.identifyDecisionFactors(scenario, traits, state),
      riskAssessment: this.assessRiskTolerance(scenario, traits, state)
    };
    
    return response;
  }

  private predictEmotionalReaction(scenario: string, traits: PersonalityTraits, state: PersonalityState): any {
    // 基于性格特质预测情绪反应
    let emotionalIntensity = traits.emotional * 0.7 + state.emotionalState.arousal * 0.3;
    let positivity = state.emotionalState.pleasure;
    
    if (scenario.includes('conflict') || scenario.includes('competition')) {
      emotionalIntensity += traits.aggression * 0.3;
      positivity -= (1 - traits.aggression) * 0.2;
    }
    
    return {
      intensity: Math.max(0, Math.min(1, emotionalIntensity)),
      positivity: Math.max(0, Math.min(1, positivity)),
      dominantEmotion: this.identifyDominantEmotion(traits, state)
    };
  }

  private predictBehavioralTendency(scenario: string, traits: PersonalityTraits, state: PersonalityState): any {
    const behavioral = {
      approachAvoidance: traits.risktaking * 0.6 + state.energyLevel * 0.4,
      socialEngagement: traits.social * 0.7 + state.socialDisposition.cooperation * 0.3,
      analyticalDepth: traits.analytical * 0.8 + state.focusLevel * 0.2,
      impulsivity: (1 - traits.patience) * 0.6 + state.emotionalState.arousal * 0.4
    };
    
    return behavioral;
  }

  private identifyDecisionFactors(scenario: string, traits: PersonalityTraits, state: PersonalityState): string[] {
    const factors: string[] = [];
    
    if (traits.analytical > 0.7) factors.push('logical_analysis');
    if (traits.intuition > 0.7) factors.push('gut_feeling');
    if (traits.social > 0.7) factors.push('social_impact');
    if (traits.emotional > 0.7) factors.push('emotional_considerations');
    if (state.stressLevel > 0.6) factors.push('stress_response');
    if (state.confidenceLevel > 0.7) factors.push('confident_decision');
    
    return factors;
  }

  private assessRiskTolerance(scenario: string, traits: PersonalityTraits, state: PersonalityState): any {
    const baseRiskTolerance = traits.risktaking;
    const stressModifier = 1 - (state.stressLevel * 0.3);
    const confidenceModifier = 1 + (state.confidenceLevel - 0.5) * 0.2;
    
    const adjustedRiskTolerance = baseRiskTolerance * stressModifier * confidenceModifier;
    
    return {
      level: Math.max(0, Math.min(1, adjustedRiskTolerance)),
      factors: {
        personality: baseRiskTolerance,
        stress_impact: stressModifier - 1,
        confidence_impact: confidenceModifier - 1
      }
    };
  }

  private identifyDominantEmotion(traits: PersonalityTraits, state: PersonalityState): string {
    if (state.stressLevel > 0.7) return 'stress';
    if (state.confidenceLevel > 0.8) return 'confidence';
    if (state.energyLevel > 0.8 && traits.aggression > 0.6) return 'excitement';
    if (traits.emotional > 0.7 && state.emotionalState.pleasure < 0.4) return 'frustration';
    if (state.socialDisposition.cooperation > 0.7) return 'cooperative';
    return 'neutral';
  }

  public cleanup(): void {
    if (this.stateUpdateInterval) {
      clearInterval(this.stateUpdateInterval);
      this.stateUpdateInterval = null;
    }
    this.memories.clear();
    this.eventHistory = [];
  }
}