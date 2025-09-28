import { EventEmitter } from '../utils/EventEmitter';
import { GameStateAnalyzer, GameStateSnapshot, StateAnalysisResult } from './GameStateAnalyzer';
import { EventTriggerSystem } from './EventTriggerSystem';
import { LLMEventIntegration } from './LLMEventIntegration';
import { IntelligentEventContentGenerator } from './EventContentGenerator';
import { EventSystemManager, EventData, ProcessedEvent } from './EventSystemArchitecture';
import { GameEventType, EventPriority, EventRarity } from './EventTypeDefinitions';
import { Player, GameState } from '../types/game';

export interface DynamicEventConfig {
  analysisInterval: number;
  maxEventsPerCycle: number;
  enableLLMGeneration: boolean;
  enableAdaptiveDifficulty: boolean;
  eventGenerationThreshold: number;
  balanceWeight: number;
  storyWeight: number;
  performanceWeight: number;
}

export interface EventGenerationRequest {
  id: string;
  trigger: EventTrigger;
  context: GenerationContext;
  urgency: EventUrgency;
  expectedImpact: number;
  constraints: EventConstraint[];
}

export interface EventTrigger {
  type: TriggerType;
  source: string;
  data: Record<string, any>;
  confidence: number;
  timestamp: number;
}

export interface GenerationContext {
  gameState: GameState;
  players: Player[];
  recentEvents: ProcessedEvent[];
  stateAnalysis: StateAnalysisResult;
  narrativeContext: NarrativeContext;
  performanceMetrics: PerformanceMetrics;
}

export interface NarrativeContext {
  currentArc: string;
  storyTension: number;
  characterDevelopment: Record<string, number>;
  plotPoints: PlotPoint[];
  themeFocus: string[];
}

export interface PlotPoint {
  id: string;
  type: 'setup' | 'conflict' | 'climax' | 'resolution';
  weight: number;
  timestamp: number;
  resolved: boolean;
}

export interface PerformanceMetrics {
  playerEngagement: number;
  gameBalance: number;
  eventQuality: number;
  culturalResonance: number;
  technicalPerformance: number;
}

export interface EventConstraint {
  type: 'timing' | 'frequency' | 'impact' | 'resources' | 'narrative';
  constraint: string;
  value: any;
  priority: number;
}

export interface DynamicEvent extends ProcessedEvent {
  generationMethod: 'analysis' | 'trigger' | 'llm' | 'hybrid';
  adaptationLevel: number;
  storyIntegration: number;
  balanceImpact: number;
  culturalWeight: number;
  playerRelevance: Record<string, number>;
  emergentProperties: EmergentProperty[];
}

export interface EmergentProperty {
  type: 'synergy' | 'cascade' | 'amplification' | 'mitigation';
  description: string;
  strength: number;
  duration: number;
  affectedSystems: string[];
}

export interface EventChain {
  id: string;
  rootEvent: string;
  chainedEvents: ChainedEvent[];
  totalImpact: number;
  coherenceScore: number;
  isActive: boolean;
}

export interface ChainedEvent {
  eventId: string;
  triggerDelay: number;
  probability: number;
  conditions: string[];
  amplificationFactor: number;
}

export type TriggerType = 
  | 'state_analysis'
  | 'performance_drop'
  | 'balance_issue'
  | 'narrative_need'
  | 'player_action'
  | 'temporal'
  | 'cultural'
  | 'emergent';

export type EventUrgency = 'low' | 'medium' | 'high' | 'critical';

export class DynamicEventEngine extends EventEmitter {
  private gameStateAnalyzer: GameStateAnalyzer;
  private triggerSystem: EventTriggerSystem;
  private llmIntegration: LLMEventIntegration;
  private contentGenerator: IntelligentEventContentGenerator;
  private eventSystem: EventSystemManager;
  
  private config: DynamicEventConfig;
  private isRunning = false;
  private analysisTimer?: NodeJS.Timeout;
  
  private generationQueue: EventGenerationRequest[] = [];
  private activeChains = new Map<string, EventChain>();
  private recentGenerations: Map<string, number> = new Map();
  private performanceHistory: PerformanceMetrics[] = [];
  private adaptiveParameters = new AdaptiveParameters();
  
  constructor(
    gameStateAnalyzer: GameStateAnalyzer,
    config: Partial<DynamicEventConfig> = {}
  ) {
    super();
    
    this.gameStateAnalyzer = gameStateAnalyzer;
    this.triggerSystem = new EventTriggerSystem(gameStateAnalyzer);
    this.llmIntegration = new LLMEventIntegration();
    this.contentGenerator = new IntelligentEventContentGenerator();
    this.eventSystem = new EventSystemManager();
    
    this.config = {
      analysisInterval: 5000, // 5 seconds
      maxEventsPerCycle: 3,
      enableLLMGeneration: true,
      enableAdaptiveDifficulty: true,
      eventGenerationThreshold: 0.6,
      balanceWeight: 0.4,
      storyWeight: 0.3,
      performanceWeight: 0.3,
      ...config
    };
    
    this.setupEventListeners();
  }
  
  public async startEventGeneration(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.analysisTimer = setInterval(() => {
      this.runGenerationCycle();
    }, this.config.analysisInterval);
    
    this.emit('engine_started');
  }
  
  public stopEventGeneration(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = undefined;
    }
    
    this.emit('engine_stopped');
  }
  
  public async generateEventForState(
    gameState: GameState,
    players: Player[]
  ): Promise<DynamicEvent[]> {
    const context = await this.buildGenerationContext(gameState, players);
    const triggers = await this.identifyEventTriggers(context);
    
    const generationRequests = triggers.map(trigger => ({
      id: `manual_${Date.now()}_${Math.random()}`,
      trigger,
      context,
      urgency: this.determineUrgency(trigger),
      expectedImpact: trigger.confidence,
      constraints: this.determineConstraints(context, trigger)
    }));
    
    return this.processGenerationRequests(generationRequests);
  }
  
  public async generateEventChain(
    rootEventType: string,
    chainLength: number,
    players: Player[],
    gameState: GameState
  ): Promise<EventChain> {
    const chainId = `chain_${Date.now()}`;
    const context = await this.buildGenerationContext(gameState, players);
    
    // Generate root event
    const rootEvent = await this.generateSingleEvent({
      id: `${chainId}_root`,
      trigger: {
        type: 'narrative_need',
        source: 'chain_generator',
        data: { rootEventType },
        confidence: 0.8,
        timestamp: Date.now()
      },
      context,
      urgency: 'medium',
      expectedImpact: 0.7,
      constraints: []
    });
    
    // Generate chained events
    const chainedEvents: ChainedEvent[] = [];
    let previousEvent = rootEvent;
    
    for (let i = 1; i < chainLength; i++) {
      const chainedEventType = this.selectChainedEventType(previousEvent, i, chainLength);
      const delay = this.calculateChainDelay(i);
      
      chainedEvents.push({
        eventId: `${chainId}_${i}`,
        triggerDelay: delay,
        probability: Math.max(0.3, 1 - (i * 0.2)), // Decreasing probability
        conditions: [`previous_event_${previousEvent.id}`],
        amplificationFactor: 1 + (i * 0.1)
      });
    }
    
    const eventChain: EventChain = {
      id: chainId,
      rootEvent: rootEvent.id,
      chainedEvents,
      totalImpact: this.calculateChainImpact(rootEvent, chainedEvents),
      coherenceScore: this.calculateCoherenceScore(rootEvent, chainedEvents),
      isActive: true
    };
    
    this.activeChains.set(chainId, eventChain);
    this.emit('event_chain_created', eventChain);
    
    return eventChain;
  }
  
  private async runGenerationCycle(): Promise<void> {
    try {
      // Check if we should generate events this cycle
      if (!this.shouldGenerateEvents()) {
        return;
      }
      
      // Get current game state from the most recent analysis
      const latestAnalysis = this.getLatestAnalysis();
      if (!latestAnalysis) {
        return;
      }
      
      const context = await this.buildGenerationContextFromAnalysis(latestAnalysis);
      const triggers = await this.identifyEventTriggers(context);
      
      if (triggers.length === 0) {
        return;
      }
      
      // Create generation requests
      const requests = triggers
        .slice(0, this.config.maxEventsPerCycle)
        .map(trigger => this.createGenerationRequest(trigger, context));
      
      // Process requests
      const generatedEvents = await this.processGenerationRequests(requests);
      
      // Update adaptive parameters
      this.updateAdaptiveParameters(generatedEvents, context);
      
      // Emit results
      if (generatedEvents.length > 0) {
        this.emit('events_generated', generatedEvents);
      }
      
    } catch (error) {
      console.error('Error in generation cycle:', error);
      this.emit('generation_error', error);
    }
  }
  
  private async buildGenerationContext(
    gameState: GameState,
    players: Player[]
  ): Promise<GenerationContext> {
    const stateAnalysis = this.gameStateAnalyzer.analyzeGameState(gameState, players);
    
    return {
      gameState,
      players,
      recentEvents: this.getRecentEvents(),
      stateAnalysis,
      narrativeContext: this.buildNarrativeContext(gameState, players),
      performanceMetrics: this.getCurrentPerformanceMetrics()
    };
  }
  
  private async buildGenerationContextFromAnalysis(
    analysis: StateAnalysisResult
  ): Promise<GenerationContext> {
    // This would be called when we have a pre-computed analysis
    const gameState = {} as GameState; // Would come from analysis
    const players: Player[] = []; // Would come from analysis
    
    return {
      gameState,
      players,
      recentEvents: this.getRecentEvents(),
      stateAnalysis: analysis,
      narrativeContext: this.buildNarrativeContext(gameState, players),
      performanceMetrics: this.getCurrentPerformanceMetrics()
    };
  }
  
  private async identifyEventTriggers(context: GenerationContext): Promise<EventTrigger[]> {
    const triggers: EventTrigger[] = [];
    
    // State analysis triggers
    const stateRisks = context.stateAnalysis.risks;
    stateRisks.forEach(risk => {
      if (risk.severity > 0.6) {
        triggers.push({
          type: 'state_analysis',
          source: 'risk_analyzer',
          data: { risk },
          confidence: risk.severity,
          timestamp: Date.now()
        });
      }
    });
    
    // Performance triggers
    const performance = context.performanceMetrics;
    if (performance.playerEngagement < 0.5) {
      triggers.push({
        type: 'performance_drop',
        source: 'engagement_monitor',
        data: { metric: 'engagement', value: performance.playerEngagement },
        confidence: (0.5 - performance.playerEngagement) * 2,
        timestamp: Date.now()
      });
    }
    
    // Balance triggers
    if (performance.gameBalance < 0.4) {
      triggers.push({
        type: 'balance_issue',
        source: 'balance_monitor',
        data: { metric: 'balance', value: performance.gameBalance },
        confidence: (0.4 - performance.gameBalance) * 2.5,
        timestamp: Date.now()
      });
    }
    
    // Narrative triggers
    const narrative = context.narrativeContext;
    if (narrative.storyTension < 0.3 && narrative.currentArc !== 'resolution') {
      triggers.push({
        type: 'narrative_need',
        source: 'story_manager',
        data: { need: 'tension_boost', currentTension: narrative.storyTension },
        confidence: 0.7,
        timestamp: Date.now()
      });
    }
    
    // Trigger system triggers
    const triggerResults = this.triggerSystem.evaluateAllTriggers(
      context.gameState,
      context.players
    );
    
    triggerResults.triggeredEvents.forEach(event => {
      triggers.push({
        type: 'state_analysis',
        source: 'trigger_system',
        data: { event },
        confidence: 0.8,
        timestamp: Date.now()
      });
    });
    
    return triggers.sort((a, b) => b.confidence - a.confidence);
  }
  
  private createGenerationRequest(
    trigger: EventTrigger,
    context: GenerationContext
  ): EventGenerationRequest {
    return {
      id: `req_${Date.now()}_${Math.random()}`,
      trigger,
      context,
      urgency: this.determineUrgency(trigger),
      expectedImpact: trigger.confidence,
      constraints: this.determineConstraints(context, trigger)
    };
  }
  
  private async processGenerationRequests(
    requests: EventGenerationRequest[]
  ): Promise<DynamicEvent[]> {
    const generatedEvents: DynamicEvent[] = [];
    
    for (const request of requests) {
      try {
        const event = await this.generateSingleEvent(request);
        if (event) {
          generatedEvents.push(event);
          this.recordGeneration(request);
        }
      } catch (error) {
        console.error(`Failed to generate event for request ${request.id}:`, error);
      }
    }
    
    return generatedEvents;
  }
  
  private async generateSingleEvent(request: EventGenerationRequest): Promise<DynamicEvent> {
    const { trigger, context } = request;
    
    // Determine generation method
    const generationMethod = this.selectGenerationMethod(trigger, context);
    
    let baseEvent: EventData;
    let contentQuality = 0.5;
    
    // Generate base event using selected method
    switch (generationMethod) {
      case 'llm':
        if (this.config.enableLLMGeneration) {
          const llmEvent = await this.generateWithLLM(request);
          baseEvent = llmEvent;
          contentQuality = 0.8;
        } else {
          baseEvent = this.generateAnalyticalEvent(request);
          contentQuality = 0.6;
        }
        break;
        
      case 'trigger':
        baseEvent = this.generateTriggeredEvent(request);
        contentQuality = 0.7;
        break;
        
      case 'analysis':
        baseEvent = this.generateAnalyticalEvent(request);
        contentQuality = 0.6;
        break;
        
      case 'hybrid':
        baseEvent = await this.generateHybridEvent(request);
        contentQuality = 0.9;
        break;
        
      default:
        baseEvent = this.generateAnalyticalEvent(request);
        contentQuality = 0.5;
    }
    
    // Enhance with dynamic properties
    const dynamicEvent: DynamicEvent = {
      ...baseEvent,
      generationMethod,
      adaptationLevel: this.calculateAdaptationLevel(request, context),
      storyIntegration: this.calculateStoryIntegration(baseEvent, context),
      balanceImpact: this.calculateBalanceImpact(baseEvent, context),
      culturalWeight: this.calculateCulturalWeight(baseEvent, context),
      playerRelevance: this.calculatePlayerRelevance(baseEvent, context),
      emergentProperties: this.identifyEmergentProperties(baseEvent, context)
    };
    
    // Apply adaptive modifications
    if (this.config.enableAdaptiveDifficulty) {
      this.applyAdaptiveModifications(dynamicEvent, context);
    }
    
    return dynamicEvent;
  }
  
  private selectGenerationMethod(
    trigger: EventTrigger,
    context: GenerationContext
  ): 'analysis' | 'trigger' | 'llm' | 'hybrid' {
    const performance = context.performanceMetrics;
    
    // Use LLM for high-quality narrative needs
    if (trigger.type === 'narrative_need' && this.config.enableLLMGeneration) {
      return performance.eventQuality < 0.7 ? 'llm' : 'hybrid';
    }
    
    // Use triggers for well-defined state issues
    if (trigger.type === 'state_analysis' && trigger.confidence > 0.8) {
      return 'trigger';
    }
    
    // Use hybrid for complex scenarios
    if (trigger.confidence > 0.7 && performance.gameBalance < 0.5) {
      return 'hybrid';
    }
    
    // Default to analysis
    return 'analysis';
  }
  
  private async generateWithLLM(request: EventGenerationRequest): Promise<EventData> {
    const llmRequest = {
      triggerEvent: {
        id: request.id,
        type: request.trigger.type,
        source: request.trigger.source,
        data: request.trigger.data,
        timestamp: request.trigger.timestamp,
        priority: this.urgencyToPriority(request.urgency)
      },
      context: {
        gameState: request.context.gameState,
        affectedPlayers: request.context.players,
        seasonalContext: request.context.gameState.season || 'spring',
        recentEvents: request.context.recentEvents.map(e => e.type),
        playerRelationships: this.extractPlayerRelationships(request.context),
        culturalMoments: this.extractCulturalMoments(request.context),
        gamePhase: request.context.stateAnalysis.snapshot.gamePhase
      },
      requestedTypes: ['event_description', 'narrative_moment']
    };
    
    const llmEvent = await this.llmIntegration.processEventWithLLM(
      llmRequest.triggerEvent,
      llmRequest.context,
      llmRequest.requestedTypes
    );
    
    return llmEvent;
  }
  
  private generateTriggeredEvent(request: EventGenerationRequest): EventData {
    const { trigger } = request;
    
    return {
      id: `triggered_${Date.now()}`,
      type: this.mapTriggerToEventType(trigger.type),
      source: 'dynamic_engine',
      data: {
        triggerType: trigger.type,
        triggerSource: trigger.source,
        triggerData: trigger.data,
        generatedAt: Date.now()
      },
      timestamp: Date.now(),
      priority: this.urgencyToPriority(request.urgency)
    };
  }
  
  private generateAnalyticalEvent(request: EventGenerationRequest): EventData {
    const { trigger, context } = request;
    
    // Analyze context to determine best event type
    const eventType = this.analyzeContextForEventType(context, trigger);
    const eventData = this.buildAnalyticalEventData(context, trigger);
    
    return {
      id: `analytical_${Date.now()}`,
      type: eventType,
      source: 'dynamic_engine',
      data: eventData,
      timestamp: Date.now(),
      priority: this.urgencyToPriority(request.urgency)
    };
  }
  
  private async generateHybridEvent(request: EventGenerationRequest): Promise<EventData> {
    // Combine multiple generation methods
    const analyticalEvent = this.generateAnalyticalEvent(request);
    
    let enhancedEvent = analyticalEvent;
    
    // Enhance with LLM if available
    if (this.config.enableLLMGeneration) {
      try {
        const llmEnhancement = await this.generateWithLLM(request);
        enhancedEvent = this.mergeEvents(analyticalEvent, llmEnhancement);
      } catch (error) {
        console.warn('LLM enhancement failed, using analytical event:', error);
      }
    }
    
    return enhancedEvent;
  }
  
  private buildNarrativeContext(gameState: GameState, players: Player[]): NarrativeContext {
    return {
      currentArc: this.determineCurrentArc(gameState, players),
      storyTension: this.calculateStoryTension(gameState, players),
      characterDevelopment: this.analyzeCharacterDevelopment(players),
      plotPoints: this.identifyPlotPoints(gameState, players),
      themeFocus: this.determineThemeFocus(gameState, players)
    };
  }
  
  private getCurrentPerformanceMetrics(): PerformanceMetrics {
    const recent = this.performanceHistory.slice(-5);
    if (recent.length === 0) {
      return {
        playerEngagement: 0.7,
        gameBalance: 0.6,
        eventQuality: 0.5,
        culturalResonance: 0.6,
        technicalPerformance: 0.8
      };
    }
    
    return {
      playerEngagement: recent.reduce((sum, p) => sum + p.playerEngagement, 0) / recent.length,
      gameBalance: recent.reduce((sum, p) => sum + p.gameBalance, 0) / recent.length,
      eventQuality: recent.reduce((sum, p) => sum + p.eventQuality, 0) / recent.length,
      culturalResonance: recent.reduce((sum, p) => sum + p.culturalResonance, 0) / recent.length,
      technicalPerformance: recent.reduce((sum, p) => sum + p.technicalPerformance, 0) / recent.length
    };
  }
  
  private determineUrgency(trigger: EventTrigger): EventUrgency {
    if (trigger.confidence > 0.9) return 'critical';
    if (trigger.confidence > 0.7) return 'high';
    if (trigger.confidence > 0.5) return 'medium';
    return 'low';
  }
  
  private determineConstraints(
    context: GenerationContext,
    trigger: EventTrigger
  ): EventConstraint[] {
    const constraints: EventConstraint[] = [];
    
    // Frequency constraints
    const recentCount = this.getRecentGenerationCount(trigger.type);
    if (recentCount > 2) {
      constraints.push({
        type: 'frequency',
        constraint: 'max_per_hour',
        value: 2,
        priority: 8
      });
    }
    
    // Impact constraints
    if (context.performanceMetrics.gameBalance < 0.3) {
      constraints.push({
        type: 'impact',
        constraint: 'balance_preserving',
        value: true,
        priority: 9
      });
    }
    
    // Narrative constraints
    const narrative = context.narrativeContext;
    if (narrative.storyTension > 0.8) {
      constraints.push({
        type: 'narrative',
        constraint: 'tension_reducing',
        value: true,
        priority: 6
      });
    }
    
    return constraints;
  }
  
  private shouldGenerateEvents(): boolean {
    // Check generation threshold
    const recentGenerationRate = this.calculateRecentGenerationRate();
    if (recentGenerationRate > this.config.eventGenerationThreshold) {
      return false;
    }
    
    // Check system performance
    const performance = this.getCurrentPerformanceMetrics();
    if (performance.technicalPerformance < 0.3) {
      return false;
    }
    
    return true;
  }
  
  private calculateRecentGenerationRate(): number {
    const now = Date.now();
    const recentWindow = 60000; // 1 minute
    const recentGenerations = Array.from(this.recentGenerations.values())
      .filter(timestamp => (now - timestamp) < recentWindow);
    
    return recentGenerations.length / 60; // events per second
  }
  
  private getLatestAnalysis(): StateAnalysisResult | null {
    // This would get the most recent analysis from the state analyzer
    // For now, return null to indicate no analysis available
    return null;
  }
  
  private getRecentEvents(): ProcessedEvent[] {
    // This would get recent events from the event system
    return [];
  }
  
  private setupEventListeners(): void {
    this.gameStateAnalyzer.on('analysis_completed', (analysis: StateAnalysisResult) => {
      this.onAnalysisCompleted(analysis);
    });
    
    this.triggerSystem.on('rule_triggered', (data) => {
      this.onTriggerActivated(data);
    });
  }
  
  private onAnalysisCompleted(analysis: StateAnalysisResult): void {
    // Update performance metrics based on analysis
    this.updatePerformanceMetrics(analysis);
    
    // Check for immediate generation needs
    const urgentRisks = analysis.risks.filter(r => r.severity > 0.8);
    if (urgentRisks.length > 0 && this.isRunning) {
      // Trigger immediate generation cycle
      setTimeout(() => this.runGenerationCycle(), 100);
    }
  }
  
  private onTriggerActivated(data: any): void {
    // Handle trigger system activations
    this.emit('trigger_activated', data);
  }
  
  private updatePerformanceMetrics(analysis: StateAnalysisResult): void {
    const snapshot = analysis.snapshot;
    
    const newMetrics: PerformanceMetrics = {
      playerEngagement: snapshot.gameFlow.playerEngagement,
      gameBalance: snapshot.powerBalance.balanceIndex,
      eventQuality: this.assessEventQuality(),
      culturalResonance: snapshot.culturalMoments.length / 5, // Normalize to 0-1
      technicalPerformance: 0.8 // Would be measured from system metrics
    };
    
    this.performanceHistory.push(newMetrics);
    
    // Keep only recent history
    if (this.performanceHistory.length > 50) {
      this.performanceHistory = this.performanceHistory.slice(-25);
    }
  }
  
  private assessEventQuality(): number {
    // Assess the quality of recently generated events
    // This is a simplified version
    return 0.7;
  }
  
  // Helper methods for event generation
  private urgencyToPriority(urgency: EventUrgency): EventPriority {
    const mapping = {
      'low': EventPriority.LOW,
      'medium': EventPriority.MEDIUM,
      'high': EventPriority.HIGH,
      'critical': EventPriority.CRITICAL
    };
    
    return mapping[urgency];
  }
  
  private mapTriggerToEventType(triggerType: TriggerType): string {
    const mapping = {
      'state_analysis': GameEventType.GAME_STATE_CHANGED,
      'performance_drop': GameEventType.PERFORMANCE_ADJUSTMENT,
      'balance_issue': GameEventType.BALANCE_ADJUSTMENT,
      'narrative_need': GameEventType.STORY_MOMENT,
      'player_action': GameEventType.PLAYER_ACTION,
      'temporal': GameEventType.TIME_EVENT,
      'cultural': GameEventType.CULTURAL_EVENT,
      'emergent': GameEventType.EMERGENT_EVENT
    };
    
    return mapping[triggerType] || GameEventType.DYNAMIC_EVENT;
  }
  
  private analyzeContextForEventType(
    context: GenerationContext,
    trigger: EventTrigger
  ): string {
    // Analyze context to select the most appropriate event type
    const analysis = context.stateAnalysis;
    
    if (analysis.risks.some(r => r.type === 'stagnation')) {
      return GameEventType.EXCITEMENT_BOOST;
    }
    
    if (analysis.risks.some(r => r.type === 'imbalance')) {
      return GameEventType.BALANCE_ADJUSTMENT;
    }
    
    if (context.narrativeContext.storyTension < 0.3) {
      return GameEventType.STORY_MOMENT;
    }
    
    return GameEventType.DYNAMIC_EVENT;
  }
  
  private buildAnalyticalEventData(
    context: GenerationContext,
    trigger: EventTrigger
  ): Record<string, any> {
    return {
      analysisSource: trigger.source,
      contextSummary: {
        gamePhase: context.stateAnalysis.snapshot.gamePhase,
        playerCount: context.players.length,
        balanceIndex: context.stateAnalysis.snapshot.powerBalance.balanceIndex,
        engagement: context.performanceMetrics.playerEngagement
      },
      adaptiveData: {
        generatedAt: Date.now(),
        confidence: trigger.confidence,
        method: 'analytical'
      }
    };
  }
  
  private mergeEvents(base: EventData, enhancement: EventData): EventData {
    return {
      ...base,
      data: {
        ...base.data,
        ...enhancement.data,
        merged: true,
        enhancementSource: enhancement.source
      },
      metadata: {
        ...base.metadata,
        ...enhancement.metadata,
        generationMethod: 'hybrid'
      }
    };
  }
  
  // Dynamic properties calculation methods
  private calculateAdaptationLevel(request: EventGenerationRequest, context: GenerationContext): number {
    const baseLevel = 0.5;
    const performanceBoost = (1 - context.performanceMetrics.gameBalance) * 0.3;
    const urgencyBoost = (request.urgency === 'critical' ? 0.3 : request.urgency === 'high' ? 0.2 : 0.1);
    
    return Math.min(1, baseLevel + performanceBoost + urgencyBoost);
  }
  
  private calculateStoryIntegration(event: EventData, context: GenerationContext): number {
    const narrative = context.narrativeContext;
    let integration = 0.5;
    
    // Higher integration for narrative events
    if (event.type.includes('STORY') || event.type.includes('NARRATIVE')) {
      integration += 0.3;
    }
    
    // Consider current story tension
    if (narrative.storyTension < 0.3 && event.type === GameEventType.STORY_MOMENT) {
      integration += 0.2;
    }
    
    return Math.min(1, integration);
  }
  
  private calculateBalanceImpact(event: EventData, context: GenerationContext): number {
    const currentBalance = context.performanceMetrics.gameBalance;
    
    // Higher impact for balance-correcting events when balance is poor
    if (currentBalance < 0.5 && event.type === GameEventType.BALANCE_ADJUSTMENT) {
      return 0.8;
    }
    
    // Lower impact for potentially destabilizing events when balance is good
    if (currentBalance > 0.7 && event.type === GameEventType.POWER_SHIFT) {
      return 0.3;
    }
    
    return 0.5;
  }
  
  private calculateCulturalWeight(event: EventData, context: GenerationContext): number {
    const culturalMoments = context.stateAnalysis.snapshot.culturalMoments.length;
    let weight = 0.5;
    
    // Higher weight for cultural events
    if (event.type.includes('CULTURAL') || event.type.includes('ZODIAC') || event.type.includes('SEASONAL')) {
      weight += 0.3;
    }
    
    // Consider cultural resonance performance
    weight += context.performanceMetrics.culturalResonance * 0.2;
    
    return Math.min(1, weight);
  }
  
  private calculatePlayerRelevance(event: EventData, context: GenerationContext): Record<string, number> {
    const relevance: Record<string, number> = {};
    
    context.players.forEach(player => {
      let playerRelevance = 0.5; // Base relevance
      
      // Higher relevance for events that mention the player
      if (event.data.affectedPlayers?.includes(player.id)) {
        playerRelevance += 0.3;
      }
      
      // Consider player's current game situation
      const playerMetric = context.stateAnalysis.snapshot.playerMetrics.find(p => p.playerId === player.id);
      if (playerMetric) {
        // Higher relevance for players in extreme positions (very good or very bad)
        const extremePosition = Math.abs(playerMetric.economicRank - (context.players.length / 2));
        playerRelevance += (extremePosition / context.players.length) * 0.2;
      }
      
      relevance[player.id] = Math.min(1, playerRelevance);
    });
    
    return relevance;
  }
  
  private identifyEmergentProperties(event: EventData, context: GenerationContext): EmergentProperty[] {
    const properties: EmergentProperty[] = [];
    
    // Check for synergies with recent events
    const recentEvents = context.recentEvents.slice(-3);
    if (recentEvents.some(e => this.eventsHaveSynergy(e, event))) {
      properties.push({
        type: 'synergy',
        description: 'Event synergizes with recent game events',
        strength: 0.7,
        duration: 3,
        affectedSystems: ['narrative', 'engagement']
      });
    }
    
    // Check for cascade potential
    if (event.priority === EventPriority.HIGH && context.performanceMetrics.gameBalance < 0.5) {
      properties.push({
        type: 'cascade',
        description: 'Event may trigger additional balance adjustments',
        strength: 0.8,
        duration: 5,
        affectedSystems: ['balance', 'economics']
      });
    }
    
    return properties;
  }
  
  private eventsHaveSynergy(event1: ProcessedEvent, event2: EventData): boolean {
    // Simplified synergy detection
    const synergisticTypes = [
      [GameEventType.CULTURAL_EVENT, GameEventType.SEASONAL_EVENT_TRIGGERED],
      [GameEventType.ECONOMIC_CRISIS, GameEventType.BALANCE_ADJUSTMENT],
      [GameEventType.STORY_MOMENT, GameEventType.PLAYER_INTERACTION]
    ];
    
    return synergisticTypes.some(([type1, type2]) => 
      (event1.type === type1 && event2.type === type2) ||
      (event1.type === type2 && event2.type === type1)
    );
  }
  
  private applyAdaptiveModifications(event: DynamicEvent, context: GenerationContext): void {
    const adaptiveLevel = event.adaptationLevel;
    
    // Modify event impact based on adaptive level
    if (event.data.impact) {
      event.data.impact *= (1 + adaptiveLevel * 0.5);
    }
    
    // Adjust duration for high-adaptation events
    if (adaptiveLevel > 0.7 && event.data.duration) {
      event.data.duration = Math.ceil(event.data.duration * (1 + adaptiveLevel * 0.3));
    }
    
    // Add adaptive metadata
    event.metadata = {
      ...event.metadata,
      adaptiveModifications: {
        level: adaptiveLevel,
        modifications: ['impact_scaling', 'duration_adjustment'],
        timestamp: Date.now()
      }
    };
  }
  
  private recordGeneration(request: EventGenerationRequest): void {
    this.recentGenerations.set(request.id, Date.now());
    
    // Clean old records
    const cutoff = Date.now() - 300000; // 5 minutes
    for (const [id, timestamp] of this.recentGenerations) {
      if (timestamp < cutoff) {
        this.recentGenerations.delete(id);
      }
    }
  }
  
  private getRecentGenerationCount(triggerType: TriggerType): number {
    const now = Date.now();
    const hourAgo = now - 3600000; // 1 hour
    
    return Array.from(this.recentGenerations.values())
      .filter(timestamp => timestamp > hourAgo)
      .length;
  }
  
  private updateAdaptiveParameters(events: DynamicEvent[], context: GenerationContext): void {
    this.adaptiveParameters.update(events, context.performanceMetrics);
  }
  
  // Chain-related helper methods
  private selectChainedEventType(previousEvent: DynamicEvent, index: number, totalLength: number): string {
    // Logic to select appropriate chained event types
    const eventTypeChains = {
      [GameEventType.ECONOMIC_CRISIS]: [GameEventType.BALANCE_ADJUSTMENT, GameEventType.RECOVERY_EVENT],
      [GameEventType.STORY_MOMENT]: [GameEventType.CHARACTER_DEVELOPMENT, GameEventType.PLOT_RESOLUTION],
      [GameEventType.CULTURAL_EVENT]: [GameEventType.SEASONAL_EVENT_TRIGGERED, GameEventType.TRADITION_BONUS]
    };
    
    const chainOptions = eventTypeChains[previousEvent.type as keyof typeof eventTypeChains];
    if (chainOptions && chainOptions[index - 1]) {
      return chainOptions[index - 1];
    }
    
    return GameEventType.DYNAMIC_EVENT;
  }
  
  private calculateChainDelay(index: number): number {
    // Progressive delays for chained events
    return index * 2000; // 2 seconds per step
  }
  
  private calculateChainImpact(rootEvent: DynamicEvent, chainedEvents: ChainedEvent[]): number {
    const rootImpact = rootEvent.data.impact || 0.5;
    const chainImpact = chainedEvents.reduce((sum, event) => 
      sum + (event.amplificationFactor * event.probability), 0
    );
    
    return rootImpact + (chainImpact * 0.3); // Chain events have 30% of their potential impact
  }
  
  private calculateCoherenceScore(rootEvent: DynamicEvent, chainedEvents: ChainedEvent[]): number {
    // Simplified coherence calculation
    let coherence = 0.8; // Base coherence
    
    // Reduce coherence for longer chains
    coherence -= (chainedEvents.length * 0.1);
    
    // Adjust based on event type compatibility
    // This would be more sophisticated in a real implementation
    
    return Math.max(0.1, Math.min(1, coherence));
  }
  
  // Narrative context helper methods
  private determineCurrentArc(gameState: GameState, players: Player[]): string {
    const turn = gameState.turn || 0;
    const maxTurns = 50; // Estimated game length
    
    const progress = turn / maxTurns;
    
    if (progress < 0.2) return 'setup';
    if (progress < 0.6) return 'development';
    if (progress < 0.8) return 'climax';
    return 'resolution';
  }
  
  private calculateStoryTension(gameState: GameState, players: Player[]): number {
    // Calculate tension based on competition, conflicts, and dramatic moments
    let tension = 0.5;
    
    // Higher tension when players are close in score
    const wealthValues = players.map(p => p.money);
    const wealthSpread = Math.max(...wealthValues) - Math.min(...wealthValues);
    const avgWealth = wealthValues.reduce((a, b) => a + b, 0) / wealthValues.length;
    
    if (avgWealth > 0) {
      const normalizedSpread = wealthSpread / avgWealth;
      tension += (1 - normalizedSpread) * 0.3; // Higher tension for closer competition
    }
    
    return Math.min(1, tension);
  }
  
  private analyzeCharacterDevelopment(players: Player[]): Record<string, number> {
    const development: Record<string, number> = {};
    
    players.forEach(player => {
      // Simplified character development calculation
      // In a real implementation, this would track player growth, relationships, achievements, etc.
      development[player.id] = 0.5 + (Math.random() * 0.3); // Placeholder
    });
    
    return development;
  }
  
  private identifyPlotPoints(gameState: GameState, players: Player[]): PlotPoint[] {
    // Identify key plot points that could affect the narrative
    const plotPoints: PlotPoint[] = [];
    
    // Check for dramatic wealth disparities
    const wealthValues = players.map(p => p.money).sort((a, b) => b - a);
    if (wealthValues[0] > wealthValues[1] * 2) {
      plotPoints.push({
        id: 'wealth_disparity',
        type: 'conflict',
        weight: 0.8,
        timestamp: Date.now(),
        resolved: false
      });
    }
    
    return plotPoints;
  }
  
  private determineThemeFocus(gameState: GameState, players: Player[]): string[] {
    const themes: string[] = [];
    
    // Determine themes based on game state
    if (gameState.season) {
      themes.push(`seasonal_${gameState.season}`);
    }
    
    // Add zodiac themes based on player composition
    const zodiacs = players.map(p => p.zodiac).filter(Boolean);
    if (zodiacs.length > 0) {
      themes.push('zodiac_harmony');
    }
    
    themes.push('competition', 'strategy', 'fortune');
    
    return themes;
  }
  
  private extractPlayerRelationships(context: GenerationContext): Record<string, Record<string, number>> {
    // Extract player relationships from context
    return context.stateAnalysis.snapshot.relationshipMatrix.trustLevels;
  }
  
  private extractCulturalMoments(context: GenerationContext): string[] {
    return context.stateAnalysis.snapshot.culturalMoments.map(m => m.name);
  }
  
  // Public interface methods
  public updateConfiguration(newConfig: Partial<DynamicEventConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config_updated', this.config);
  }
  
  public getEngineStatus(): EngineStatus {
    return {
      isRunning: this.isRunning,
      config: this.config,
      queueSize: this.generationQueue.length,
      activeChains: this.activeChains.size,
      recentGenerations: this.recentGenerations.size,
      performanceMetrics: this.getCurrentPerformanceMetrics(),
      adaptiveParameters: this.adaptiveParameters.getSnapshot()
    };
  }
  
  public forceGenerationCycle(): Promise<void> {
    return this.runGenerationCycle();
  }
  
  public clearEventHistory(): void {
    this.recentGenerations.clear();
    this.performanceHistory = [];
    this.emit('history_cleared');
  }
}

// Adaptive parameters management
class AdaptiveParameters {
  private parameters = {
    eventFrequency: 1.0,
    eventIntensity: 1.0,
    balanceSensitivity: 1.0,
    narrativeWeight: 1.0,
    culturalEmphasis: 1.0
  };
  
  update(events: DynamicEvent[], performance: PerformanceMetrics): void {
    // Adjust parameters based on event outcomes and performance
    
    // Increase frequency if engagement is low
    if (performance.playerEngagement < 0.5) {
      this.parameters.eventFrequency = Math.min(2.0, this.parameters.eventFrequency * 1.1);
    } else if (performance.playerEngagement > 0.8) {
      this.parameters.eventFrequency = Math.max(0.5, this.parameters.eventFrequency * 0.95);
    }
    
    // Adjust intensity based on game balance
    if (performance.gameBalance < 0.4) {
      this.parameters.eventIntensity = Math.min(2.0, this.parameters.eventIntensity * 1.15);
    } else if (performance.gameBalance > 0.8) {
      this.parameters.eventIntensity = Math.max(0.5, this.parameters.eventIntensity * 0.9);
    }
    
    // Adjust cultural emphasis based on cultural resonance
    if (performance.culturalResonance < 0.5) {
      this.parameters.culturalEmphasis = Math.min(2.0, this.parameters.culturalEmphasis * 1.1);
    }
  }
  
  getSnapshot(): Record<string, number> {
    return { ...this.parameters };
  }
}

interface EngineStatus {
  isRunning: boolean;
  config: DynamicEventConfig;
  queueSize: number;
  activeChains: number;
  recentGenerations: number;
  performanceMetrics: PerformanceMetrics;
  adaptiveParameters: Record<string, number>;
}

export const createDynamicEventEngine = (
  gameStateAnalyzer: GameStateAnalyzer,
  config?: Partial<DynamicEventConfig>
): DynamicEventEngine => {
  return new DynamicEventEngine(gameStateAnalyzer, config);
};

export default DynamicEventEngine;