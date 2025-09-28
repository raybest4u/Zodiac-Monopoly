import { EventEmitter } from '../utils/EventEmitter';
import { LLMService } from '../ai/LLMService';
import { GameEventIntegrator } from './EventGameIntegration';
import { IntelligentEventContentGenerator } from './EventContentGenerator';
import { ZodiacContentFactory } from './ZodiacContentFactory';
import { DialogueContentGenerator } from './DialogueContentGenerator';
import { DynamicStorylineGenerator } from './DynamicStorylineGenerator';
import { EventSystemManager, EventData, ProcessedEvent } from './EventSystemArchitecture';
import { EventListenerSystem, EventListener } from './EventListenerSystem';
import { EventPriorityQueueManager } from './EventPriorityQueueManager';
import { GameEventType, EventPriority, EventRarity } from './EventTypeDefinitions';
import { Player, GameState } from '../types/game';

export interface LLMEventSystemConfig {
  enableIntelligentContent: boolean;
  enableZodiacGeneration: boolean;
  enableDialogueGeneration: boolean;
  enableStorylineGeneration: boolean;
  enableAdaptiveLearning: boolean;
  contentQualityThreshold: number;
  fallbackToTraditional: boolean;
  maxConcurrentGenerations: number;
}

export interface LLMGeneratedEvent extends ProcessedEvent {
  llmGenerated: boolean;
  contentQuality: number;
  generationTime: number;
  fallbackUsed: boolean;
  culturalAccuracy: number;
  playerEngagement: number;
}

export interface EventGenerationRequest {
  id: string;
  triggerEvent: EventData;
  context: EventGenerationContext;
  requestedTypes: LLMContentType[];
  priority: EventPriority;
  deadline?: number;
}

export interface EventGenerationContext {
  gameState: GameState;
  affectedPlayers: Player[];
  seasonalContext: string;
  recentEvents: string[];
  playerRelationships: Record<string, Record<string, number>>;
  culturalMoments: string[];
  gamePhase: string;
}

export interface LLMEventResponse {
  eventContent?: any;
  zodiacContent?: any;
  dialogueContent?: any;
  storylineContent?: any;
  metadata: LLMResponseMetadata;
}

export interface LLMResponseMetadata {
  generationTime: number;
  tokenUsage: number;
  qualityScore: number;
  culturalRelevance: number;
  fallbackReason?: string;
  contentFlags: string[];
}

export type LLMContentType = 
  | 'event_description'
  | 'zodiac_blessing'
  | 'zodiac_challenge' 
  | 'character_dialogue'
  | 'narrative_moment'
  | 'seasonal_transition'
  | 'cultural_reference'
  | 'epic_conclusion';

export class LLMEventIntegration extends EventEmitter {
  private llmService: LLMService;
  private gameIntegrator: GameEventIntegrator;
  private contentGenerator: IntelligentEventContentGenerator;
  private zodiacFactory: ZodiacContentFactory;
  private dialogueGenerator: DialogueContentGenerator;
  private storylineGenerator: DynamicStorylineGenerator;
  private eventSystem: EventSystemManager;
  private config: LLMEventSystemConfig;
  
  private activeGenerations = new Map<string, EventGenerationRequest>();
  private generationQueue: EventGenerationRequest[] = [];
  private performanceMetrics = new Map<LLMContentType, PerformanceMetrics>();
  private adaptiveLearning = new AdaptiveLearningSystem();
  
  constructor(config: Partial<LLMEventSystemConfig> = {}) {
    super();
    
    this.config = {
      enableIntelligentContent: true,
      enableZodiacGeneration: true,
      enableDialogueGeneration: true,
      enableStorylineGeneration: true,
      enableAdaptiveLearning: true,
      contentQualityThreshold: 0.7,
      fallbackToTraditional: true,
      maxConcurrentGenerations: 3,
      ...config
    };
    
    this.initializeServices();
    this.setupEventListeners();
    this.initializePerformanceTracking();
  }
  
  public async processEventWithLLM(
    eventData: EventData,
    context: EventGenerationContext,
    requestedTypes: LLMContentType[] = ['event_description']
  ): Promise<LLMGeneratedEvent> {
    const request: EventGenerationRequest = {
      id: `llm_gen_${Date.now()}`,
      triggerEvent: eventData,
      context,
      requestedTypes,
      priority: eventData.priority || EventPriority.MEDIUM,
      deadline: Date.now() + 30000 // 30 seconds deadline
    };
    
    this.emit('generation_started', request);
    
    try {
      const response = await this.generateLLMContent(request);
      const enhancedEvent = await this.createEnhancedEvent(eventData, response, context);
      
      this.recordPerformanceMetrics(request, response);
      this.adaptiveLearning.recordSuccess(request, response);
      this.emit('generation_completed', enhancedEvent);
      
      return enhancedEvent;
    } catch (error) {
      console.error('LLM event generation failed:', error);
      
      if (this.config.fallbackToTraditional) {
        const fallbackEvent = await this.createFallbackEvent(eventData, context);
        this.adaptiveLearning.recordFailure(request, error as Error);
        this.emit('generation_fallback', fallbackEvent);
        return fallbackEvent;
      }
      
      throw error;
    }
  }
  
  public async generateBatchEventContent(
    requests: EventGenerationRequest[]
  ): Promise<LLMGeneratedEvent[]> {
    const results: LLMGeneratedEvent[] = [];
    const batches = this.organizeBatches(requests);
    
    for (const batch of batches) {
      const batchPromises = batch.map(request => 
        this.processEventWithLLM(
          request.triggerEvent,
          request.context,
          request.requestedTypes
        )
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch request ${batch[index].id} failed:`, result.reason);
          if (this.config.fallbackToTraditional) {
            const fallback = this.createSyncFallbackEvent(batch[index]);
            results.push(fallback);
          }
        }
      });
      
      // Rate limiting between batches
      await this.sleep(1000);
    }
    
    return results;
  }
  
  public async enhanceExistingEvent(
    existingEvent: ProcessedEvent,
    enhancementTypes: LLMContentType[]
  ): Promise<LLMGeneratedEvent> {
    const context = await this.buildContextFromExistingEvent(existingEvent);
    
    const request: EventGenerationRequest = {
      id: `enhance_${existingEvent.id}_${Date.now()}`,
      triggerEvent: existingEvent,
      context,
      requestedTypes: enhancementTypes,
      priority: EventPriority.LOW
    };
    
    try {
      const response = await this.generateLLMContent(request);
      const enhancedEvent = await this.mergeEnhancements(existingEvent, response);
      
      this.emit('event_enhanced', enhancedEvent);
      return enhancedEvent;
    } catch (error) {
      console.warn('Event enhancement failed:', error);
      return this.convertToLLMEvent(existingEvent, true);
    }
  }
  
  public async generateSeasonalEventSeries(
    season: string,
    players: Player[],
    duration: number = 7
  ): Promise<LLMGeneratedEvent[]> {
    const seasonalEvents: LLMGeneratedEvent[] = [];
    
    for (let day = 1; day <= duration; day++) {
      const dailyContext = this.buildSeasonalContext(season, day, players);
      
      const eventData: EventData = {
        id: `seasonal_${season}_day${day}_${Date.now()}`,
        type: GameEventType.SEASONAL_EVENT_TRIGGERED,
        source: 'seasonal_system',
        data: { season, day, players: players.map(p => p.id) },
        timestamp: Date.now(),
        priority: EventPriority.MEDIUM
      };
      
      try {
        const enhancedEvent = await this.processEventWithLLM(
          eventData,
          dailyContext,
          ['event_description', 'seasonal_transition', 'cultural_reference']
        );
        
        seasonalEvents.push(enhancedEvent);
      } catch (error) {
        console.warn(`Failed to generate day ${day} seasonal event:`, error);
      }
    }
    
    // Generate overall seasonal storyline
    if (this.config.enableStorylineGeneration && seasonalEvents.length > 0) {
      try {
        const seasonalStoryline = await this.storylineGenerator.generateSeasonalNarrativeTransition(
          'previous_season',
          season,
          players,
          seasonalEvents.map(e => e.type)
        );
        
        // Integrate storyline back into events
        this.integrateStorylineIntoEvents(seasonalEvents, seasonalStoryline);
      } catch (error) {
        console.warn('Failed to generate seasonal storyline:', error);
      }
    }
    
    return seasonalEvents;
  }
  
  public async generatePlayerInteractionEvent(
    initiator: Player,
    target: Player,
    interactionType: string,
    gameContext: EventGenerationContext
  ): Promise<LLMGeneratedEvent> {
    const interactionEventData: EventData = {
      id: `interaction_${initiator.id}_${target.id}_${Date.now()}`,
      type: GameEventType.PLAYER_INTERACTION,
      source: 'interaction_system',
      data: {
        initiator: initiator.id,
        target: target.id,
        interactionType,
        relationship: gameContext.playerRelationships[initiator.id]?.[target.id] || 0
      },
      timestamp: Date.now(),
      priority: EventPriority.MEDIUM
    };
    
    const interactionContext: EventGenerationContext = {
      ...gameContext,
      affectedPlayers: [initiator, target]
    };
    
    return this.processEventWithLLM(
      interactionEventData,
      interactionContext,
      ['event_description', 'character_dialogue', 'zodiac_blessing']
    );
  }
  
  private initializeServices(): void {
    this.llmService = new LLMService();
    this.gameIntegrator = new GameEventIntegrator();
    this.contentGenerator = new IntelligentEventContentGenerator(this.llmService);
    this.zodiacFactory = new ZodiacContentFactory(this.llmService);
    this.dialogueGenerator = new DialogueContentGenerator(this.llmService);
    this.storylineGenerator = new DynamicStorylineGenerator(this.llmService);
    this.eventSystem = new EventSystemManager();
  }
  
  private setupEventListeners(): void {
    this.contentGenerator.on('content_generated', (data) => {
      this.emit('llm_content_ready', { type: 'event_content', data });
    });
    
    this.zodiacFactory.on('content_generated', (data) => {
      this.emit('llm_content_ready', { type: 'zodiac_content', data });
    });
    
    this.dialogueGenerator.on('dialogue_generated', (data) => {
      this.emit('llm_content_ready', { type: 'dialogue_content', data });
    });
    
    this.storylineGenerator.on('story_opening_generated', (data) => {
      this.emit('llm_content_ready', { type: 'storyline_content', data });
    });
    
    // Listen for adaptive learning feedback
    this.on('player_feedback', (feedback) => {
      this.adaptiveLearning.processFeedback(feedback);
    });
  }
  
  private initializePerformanceTracking(): void {
    const contentTypes: LLMContentType[] = [
      'event_description',
      'zodiac_blessing',
      'character_dialogue',
      'narrative_moment',
      'seasonal_transition'
    ];
    
    contentTypes.forEach(type => {
      this.performanceMetrics.set(type, {
        totalRequests: 0,
        successfulRequests: 0,
        averageGenerationTime: 0,
        averageQuality: 0,
        fallbackRate: 0
      });
    });
  }
  
  private async generateLLMContent(request: EventGenerationRequest): Promise<LLMEventResponse> {
    this.activeGenerations.set(request.id, request);
    const startTime = Date.now();
    
    try {
      const results: Partial<LLMEventResponse> = { metadata: { 
        generationTime: 0, 
        tokenUsage: 0, 
        qualityScore: 0, 
        culturalRelevance: 0,
        contentFlags: []
      }};
      
      const generationPromises: Promise<any>[] = [];
      
      // Generate different types of content based on request
      if (request.requestedTypes.includes('event_description')) {
        generationPromises.push(this.generateEventContent(request));
      }
      
      if (request.requestedTypes.includes('zodiac_blessing') || 
          request.requestedTypes.includes('zodiac_challenge')) {
        generationPromises.push(this.generateZodiacContent(request));
      }
      
      if (request.requestedTypes.includes('character_dialogue')) {
        generationPromises.push(this.generateDialogueContent(request));
      }
      
      if (request.requestedTypes.includes('narrative_moment') || 
          request.requestedTypes.includes('seasonal_transition')) {
        generationPromises.push(this.generateStorylineContent(request));
      }
      
      const generationResults = await Promise.allSettled(generationPromises);
      
      // Compile results
      generationResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const contentType = request.requestedTypes[index];
          switch (contentType) {
            case 'event_description':
              results.eventContent = result.value;
              break;
            case 'zodiac_blessing':
            case 'zodiac_challenge':
              results.zodiacContent = result.value;
              break;
            case 'character_dialogue':
              results.dialogueContent = result.value;
              break;
            case 'narrative_moment':
            case 'seasonal_transition':
              results.storylineContent = result.value;
              break;
          }
        }
      });
      
      const generationTime = Date.now() - startTime;
      results.metadata = {
        generationTime,
        tokenUsage: this.estimateTokenUsage(request),
        qualityScore: await this.assessContentQuality(results),
        culturalRelevance: await this.assessCulturalRelevance(results, request.context),
        contentFlags: this.analyzeContentFlags(results)
      };
      
      return results as LLMEventResponse;
    } finally {
      this.activeGenerations.delete(request.id);
    }
  }
  
  private async generateEventContent(request: EventGenerationRequest): Promise<any> {
    const eventContext = {
      eventType: request.triggerEvent.type,
      context: {
        gamePhase: request.context.gamePhase,
        season: request.context.seasonalContext,
        currentTurn: 1,
        leadingPlayer: request.context.affectedPlayers[0]?.name,
        gameEvents: request.context.recentEvents,
        economicSituation: 'balanced',
        relationships: {},
        specialConditions: request.context.culturalMoments
      },
      players: request.context.affectedPlayers,
      priority: request.priority,
      rarity: EventRarity.COMMON
    };
    
    return this.contentGenerator.generateEventContent(eventContext);
  }
  
  private async generateZodiacContent(request: EventGenerationRequest): Promise<any> {
    const zodiacPlayer = request.context.affectedPlayers.find(p => p.zodiac);
    if (!zodiacPlayer) {
      throw new Error('No zodiac player found for zodiac content generation');
    }
    
    const contentType = request.requestedTypes.includes('zodiac_blessing') ? 'fortune' : 'wisdom';
    
    return this.zodiacFactory.generateZodiacBlessingContent(
      zodiacPlayer.zodiac,
      zodiacPlayer,
      {
        gamePhase: request.context.gamePhase,
        season: request.context.seasonalContext,
        currentTurn: 1,
        leadingPlayer: request.context.affectedPlayers[0]?.name,
        gameEvents: request.context.recentEvents,
        economicSituation: 'balanced',
        relationships: {},
        specialConditions: request.context.culturalMoments
      },
      contentType as any
    );
  }
  
  private async generateDialogueContent(request: EventGenerationRequest): Promise<any> {
    const dialogues = [];
    
    for (const player of request.context.affectedPlayers) {
      const dialogueRequest = {
        id: `dialogue_${player.id}_${Date.now()}`,
        speaker: player,
        context: {
          situation: request.triggerEvent.type,
          gamePhase: request.context.gamePhase,
          recentEvents: request.context.recentEvents,
          playerRelationships: request.context.playerRelationships[player.id] || {},
          gameStatus: {
            leadingPlayer: request.context.affectedPlayers[0]?.name || '',
            economicSituation: 'balanced',
            competitiveness: 0.5,
            cooperationLevel: 0.5,
            tension: 0.3
          },
          environmentalFactors: [request.context.seasonalContext]
        },
        dialogueType: 'competitive_banter' as any,
        targetPlayer: request.context.affectedPlayers.find(p => p.id !== player.id)
      };
      
      const dialogue = await this.dialogueGenerator.generateDialogue(dialogueRequest);
      dialogues.push(dialogue);
    }
    
    return dialogues;
  }
  
  private async generateStorylineContent(request: EventGenerationRequest): Promise<any> {
    if (request.requestedTypes.includes('seasonal_transition')) {
      return this.storylineGenerator.generateSeasonalNarrativeTransition(
        'previous_season',
        request.context.seasonalContext,
        request.context.affectedPlayers,
        request.context.culturalMoments
      );
    }
    
    // Generate epic moment narrative
    const eventContent = {
      title: request.triggerEvent.type,
      description: 'Epic game moment',
      narrativeText: 'A significant event unfolds',
      culturalElements: request.context.culturalMoments.map(cm => ({
        type: 'cultural_reference' as any,
        content: cm,
        significance: 'Traditional wisdom'
      }))
    };
    
    return this.storylineGenerator.generateEpicMomentNarrative(
      eventContent as any,
      request.context.affectedPlayers,
      {
        economicShift: 0.5,
        powerBalance: {},
        relationshipChanges: {},
        culturalResonance: 0.8
      }
    );
  }
  
  private async createEnhancedEvent(
    originalEvent: EventData,
    llmResponse: LLMEventResponse,
    context: EventGenerationContext
  ): Promise<LLMGeneratedEvent> {
    const enhancedEvent: LLMGeneratedEvent = {
      ...originalEvent,
      llmGenerated: true,
      contentQuality: llmResponse.metadata.qualityScore,
      generationTime: llmResponse.metadata.generationTime,
      fallbackUsed: false,
      culturalAccuracy: llmResponse.metadata.culturalRelevance,
      playerEngagement: this.estimatePlayerEngagement(llmResponse, context),
      metadata: {
        ...originalEvent.metadata,
        llmContent: {
          eventContent: llmResponse.eventContent,
          zodiacContent: llmResponse.zodiacContent,
          dialogueContent: llmResponse.dialogueContent,
          storylineContent: llmResponse.storylineContent
        },
        llmMetadata: llmResponse.metadata
      }
    };
    
    return enhancedEvent;
  }
  
  private async createFallbackEvent(
    originalEvent: EventData,
    context: EventGenerationContext
  ): Promise<LLMGeneratedEvent> {
    return {
      ...originalEvent,
      llmGenerated: false,
      contentQuality: 0.5,
      generationTime: 0,
      fallbackUsed: true,
      culturalAccuracy: 0.6,
      playerEngagement: 0.4,
      metadata: {
        ...originalEvent.metadata,
        fallbackReason: 'LLM generation failed'
      }
    };
  }
  
  private createSyncFallbackEvent(request: EventGenerationRequest): LLMGeneratedEvent {
    return {
      ...request.triggerEvent,
      llmGenerated: false,
      contentQuality: 0.4,
      generationTime: 0,
      fallbackUsed: true,
      culturalAccuracy: 0.5,
      playerEngagement: 0.3,
      metadata: {
        ...request.triggerEvent.metadata,
        fallbackReason: 'Synchronous fallback used'
      }
    };
  }
  
  private organizeBatches(requests: EventGenerationRequest[]): EventGenerationRequest[][] {
    const batches: EventGenerationRequest[][] = [];
    const batchSize = this.config.maxConcurrentGenerations;
    
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }
    
    return batches;
  }
  
  private async buildContextFromExistingEvent(event: ProcessedEvent): Promise<EventGenerationContext> {
    // Build context from existing event data
    return {
      gameState: {} as GameState,
      affectedPlayers: [],
      seasonalContext: 'spring',
      recentEvents: [event.type],
      playerRelationships: {},
      culturalMoments: [],
      gamePhase: 'mid_game'
    };
  }
  
  private async mergeEnhancements(
    originalEvent: ProcessedEvent,
    response: LLMEventResponse
  ): Promise<LLMGeneratedEvent> {
    return {
      ...originalEvent,
      llmGenerated: true,
      contentQuality: response.metadata.qualityScore,
      generationTime: response.metadata.generationTime,
      fallbackUsed: false,
      culturalAccuracy: response.metadata.culturalRelevance,
      playerEngagement: 0.7,
      metadata: {
        ...originalEvent.metadata,
        enhancedWith: response
      }
    };
  }
  
  private convertToLLMEvent(event: ProcessedEvent, fallback: boolean): LLMGeneratedEvent {
    return {
      ...event,
      llmGenerated: false,
      contentQuality: fallback ? 0.4 : 0.6,
      generationTime: 0,
      fallbackUsed: fallback,
      culturalAccuracy: 0.5,
      playerEngagement: 0.4
    };
  }
  
  private buildSeasonalContext(
    season: string,
    day: number,
    players: Player[]
  ): EventGenerationContext {
    return {
      gameState: {} as GameState,
      affectedPlayers: players,
      seasonalContext: season,
      recentEvents: [`${season}_day_${day - 1}`],
      playerRelationships: {},
      culturalMoments: [`${season}_cultural_moment_${day}`],
      gamePhase: 'seasonal_event'
    };
  }
  
  private integrateStorylineIntoEvents(
    events: LLMGeneratedEvent[],
    storyline: any
  ): void {
    events.forEach((event, index) => {
      if (event.metadata) {
        event.metadata.seasonalStoryline = {
          chapter: index + 1,
          narrative: storyline.narrative,
          connection: storyline.keyMoments?.[index]
        };
      }
    });
  }
  
  private async assessContentQuality(response: Partial<LLMEventResponse>): Promise<number> {
    // Simple quality assessment based on content completeness
    let score = 0;
    let criteria = 0;
    
    if (response.eventContent) {
      score += response.eventContent.title ? 0.2 : 0;
      score += response.eventContent.description ? 0.2 : 0;
      criteria += 2;
    }
    
    if (response.zodiacContent) {
      score += 0.3;
      criteria += 1;
    }
    
    if (response.dialogueContent) {
      score += 0.2;
      criteria += 1;
    }
    
    if (response.storylineContent) {
      score += 0.3;
      criteria += 1;
    }
    
    return criteria > 0 ? score / criteria : 0;
  }
  
  private async assessCulturalRelevance(
    response: Partial<LLMEventResponse>,
    context: EventGenerationContext
  ): Promise<number> {
    // Assess cultural relevance based on content analysis
    let relevanceScore = 0.5; // Base score
    
    if (response.eventContent?.culturalElements?.length > 0) {
      relevanceScore += 0.2;
    }
    
    if (context.culturalMoments.length > 0) {
      relevanceScore += 0.2;
    }
    
    if (response.zodiacContent) {
      relevanceScore += 0.1;
    }
    
    return Math.min(1.0, relevanceScore);
  }
  
  private analyzeContentFlags(response: Partial<LLMEventResponse>): string[] {
    const flags: string[] = [];
    
    if (response.eventContent && !response.eventContent.title) {
      flags.push('missing_title');
    }
    
    if (response.dialogueContent?.length === 0) {
      flags.push('no_dialogue');
    }
    
    return flags;
  }
  
  private estimateTokenUsage(request: EventGenerationRequest): number {
    // Rough estimation based on request complexity
    const baseTokens = 100;
    const perPlayerTokens = 50;
    const perTypeTokens = 200;
    
    return baseTokens + 
           (request.context.affectedPlayers.length * perPlayerTokens) +
           (request.requestedTypes.length * perTypeTokens);
  }
  
  private estimatePlayerEngagement(
    response: LLMEventResponse,
    context: EventGenerationContext
  ): number {
    // Estimate engagement based on content richness
    let engagement = 0.5;
    
    if (response.dialogueContent) engagement += 0.2;
    if (response.zodiacContent) engagement += 0.2;
    if (response.storylineContent) engagement += 0.1;
    
    return Math.min(1.0, engagement);
  }
  
  private recordPerformanceMetrics(
    request: EventGenerationRequest,
    response: LLMEventResponse
  ): void {
    request.requestedTypes.forEach(type => {
      const metrics = this.performanceMetrics.get(type);
      if (metrics) {
        metrics.totalRequests++;
        metrics.successfulRequests++;
        metrics.averageGenerationTime = 
          (metrics.averageGenerationTime * (metrics.totalRequests - 1) + 
           response.metadata.generationTime) / metrics.totalRequests;
        metrics.averageQuality = 
          (metrics.averageQuality * (metrics.totalRequests - 1) + 
           response.metadata.qualityScore) / metrics.totalRequests;
      }
    });
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  public getPerformanceMetrics(): Map<LLMContentType, PerformanceMetrics> {
    return this.performanceMetrics;
  }
  
  public getAdaptiveLearningInsights(): any {
    return this.adaptiveLearning.getInsights();
  }
  
  public updateConfiguration(updates: Partial<LLMEventSystemConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config_updated', this.config);
  }
  
  public async shutdown(): Promise<void> {
    // Wait for active generations to complete
    const activePromises = Array.from(this.activeGenerations.values()).map(req => 
      new Promise(resolve => {
        const timeout = setTimeout(resolve, req.deadline ? req.deadline - Date.now() : 5000);
        this.once('generation_completed', () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      })
    );
    
    await Promise.all(activePromises);
    
    // Clean up resources
    this.contentGenerator.clearCache();
    this.dialogueGenerator.clearCache();
    this.storylineGenerator.clearCache();
    
    this.emit('shutdown_complete');
  }
}

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  averageGenerationTime: number;
  averageQuality: number;
  fallbackRate: number;
}

class AdaptiveLearningSystem {
  private successPatterns = new Map<string, number>();
  private failurePatterns = new Map<string, number>();
  private qualityTrends = new Map<string, number[]>();
  
  recordSuccess(request: EventGenerationRequest, response: LLMEventResponse): void {
    const pattern = this.extractPattern(request);
    this.successPatterns.set(pattern, (this.successPatterns.get(pattern) || 0) + 1);
    
    const qualityHistory = this.qualityTrends.get(pattern) || [];
    qualityHistory.push(response.metadata.qualityScore);
    this.qualityTrends.set(pattern, qualityHistory.slice(-10)); // Keep last 10 scores
  }
  
  recordFailure(request: EventGenerationRequest, error: Error): void {
    const pattern = this.extractPattern(request);
    this.failurePatterns.set(pattern, (this.failurePatterns.get(pattern) || 0) + 1);
  }
  
  processFeedback(feedback: any): void {
    // Process user feedback for learning
    // This would be implemented based on specific feedback mechanisms
  }
  
  getInsights(): any {
    return {
      successPatterns: Object.fromEntries(this.successPatterns),
      failurePatterns: Object.fromEntries(this.failurePatterns),
      qualityTrends: Object.fromEntries(this.qualityTrends)
    };
  }
  
  private extractPattern(request: EventGenerationRequest): string {
    return `${request.triggerEvent.type}_${request.requestedTypes.join('_')}_${request.context.affectedPlayers.length}`;
  }
}

export const createLLMEventIntegration = (config?: Partial<LLMEventSystemConfig>): LLMEventIntegration => {
  return new LLMEventIntegration(config);
};

export default LLMEventIntegration;