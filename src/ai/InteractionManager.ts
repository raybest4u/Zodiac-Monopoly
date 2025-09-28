/**
 * LLM增强玩家互动系统
 * 管理人类玩家与AI之间的智能化互动体验
 */
import type {
  AIState,
  PlayerRelationship
} from '../types/ai';

import type {
  GameState,
  Player,
  GameEvent
} from '../types/game';

import { LLMService, type LLMConfig, type InteractionResponse, type ConversationResponse } from './LLMService';
import { ConversationManager } from './ConversationManager';
import { StorytellingManager } from './StorytellingManager';

/**
 * 互动管理器 - 提供智能化的玩家-AI互动体验
 */
export class InteractionManager {
  private llmService?: LLMService;
  private conversationManager: ConversationManager;
  private storytellingManager: StorytellingManager;
  
  private playerPreferences: Map<string, PlayerPreferences> = new Map();
  private interactionHistory: InteractionRecord[] = [];
  private relationshipTracker: Map<string, Map<string, PlayerRelationshipState>> = new Map();
  private adaptiveResponses: Map<string, AdaptiveResponseData> = new Map();
  
  constructor(llmConfig?: LLMConfig) {
    if (llmConfig) {
      try {
        this.llmService = new LLMService(llmConfig);
      } catch (error) {
        console.warn('InteractionManager: LLM service initialization failed:', error);
      }
    }

    this.conversationManager = new ConversationManager(llmConfig);
    this.storytellingManager = new StorytellingManager(llmConfig);
  }

  /**
   * 处理玩家与AI的直接互动
   */
  async handlePlayerInteraction(
    humanPlayerId: string,
    targetAIId: string,
    interactionType: InteractionType,
    message: string,
    gameState: GameState,
    aiStates: Map<string, AIState>
  ): Promise<InteractionResult> {
    const targetAI = aiStates.get(targetAIId);
    if (!targetAI) {
      throw new Error(`AI ${targetAIId} not found`);
    }

    const humanPlayer = gameState.players?.find(p => p.id === humanPlayerId);
    if (!humanPlayer) {
      throw new Error(`Human player ${humanPlayerId} not found`);
    }

    try {
      // 分析玩家意图
      const intentAnalysis = await this.analyzePlayerIntent(message, interactionType, gameState);
      
      // 生成AI回应
      const aiResponse = await this.generateAIResponse(
        targetAI,
        humanPlayer,
        interactionType,
        message,
        intentAnalysis,
        gameState
      );

      // 更新关系状态
      this.updatePlayerRelationship(humanPlayerId, targetAIId, interactionType, aiResponse);

      // 记录互动历史
      this.recordInteraction({
        humanPlayerId,
        aiId: targetAIId,
        interactionType,
        humanMessage: message,
        aiResponse: aiResponse.content,
        intentAnalysis,
        relationshipImpact: this.calculateRelationshipImpact(interactionType, aiResponse),
        timestamp: Date.now()
      });

      // 触发连锁反应（其他AI的反应）
      const chainReactions = await this.generateChainReactions(
        humanPlayerId,
        targetAIId,
        interactionType,
        aiResponse,
        aiStates,
        gameState
      );

      return {
        primaryResponse: aiResponse,
        chainReactions,
        relationshipChanges: this.getRelationshipChanges(humanPlayerId, targetAIId),
        suggestedFollowUps: this.generateFollowUpSuggestions(interactionType, aiResponse, targetAI),
        narrativeImpact: await this.assessNarrativeImpact(interactionType, aiResponse, gameState)
      };

    } catch (error) {
      console.error(`Interaction handling failed (${humanPlayerId} -> ${targetAIId}):`, error);
      return this.generateFallbackInteraction(targetAI, interactionType, message);
    }
  }

  /**
   * 生成智能化的AI主动互动
   */
  async generateProactiveInteraction(
    aiState: AIState,
    targetPlayerId: string,
    gameState: GameState,
    trigger: ProactiveInteractionTrigger
  ): Promise<ProactiveInteractionResult> {
    const targetPlayer = gameState.players?.find(p => p.id === targetPlayerId);
    if (!targetPlayer) {
      throw new Error(`Target player ${targetPlayerId} not found`);
    }

    const interactionType = this.determineProactiveInteractionType(trigger, aiState, targetPlayer);
    
    if (this.llmService) {
      try {
        const response = await this.llmService.generatePlayerInteraction(
          aiState,
          interactionType,
          targetPlayer,
          gameState
        );

        // 生成配套的叙述
        const contextualNarration = await this.storytellingManager.generateEventNarration(
          {
            id: `proactive_${aiState.id}_${Date.now()}`,
            type: 'ai_initiative',
            title: `${this.getAIDisplayName(aiState)}的主动接触`,
            description: `AI主动与${targetPlayer.name}进行交流`,
            rarity: 'common'
          } as GameEvent,
          [targetPlayer],
          gameState
        );

        return {
          initiatorAI: aiState.id,
          targetPlayer: targetPlayerId,
          interactionType,
          message: response.content,
          motivation: this.explainAIMotivation(trigger, aiState),
          timing: this.assessInteractionTiming(gameState, aiState),
          contextualNarration,
          expectedPlayerReactions: this.predictPlayerReactions(response, targetPlayer, aiState),
          strategicPurpose: this.identifyStrategicPurpose(trigger, aiState)
        };

      } catch (error) {
        console.warn(`Proactive interaction generation failed (${aiState.id}):`, error);
      }
    }

    // 后备方案
    return this.generateFallbackProactiveInteraction(aiState, targetPlayer, trigger);
  }

  /**
   * 管理多人互动场景
   */
  async handleMultiPlayerInteraction(
    initiatorId: string,
    participantIds: string[],
    interactionContext: MultiPlayerInteractionContext,
    gameState: GameState,
    aiStates: Map<string, AIState>
  ): Promise<MultiPlayerInteractionResult> {
    const allParticipants = [initiatorId, ...participantIds];
    const responses: ParticipantResponse[] = [];
    
    // 生成每个参与者的反应
    for (const participantId of participantIds) {
      const aiState = aiStates.get(participantId);
      if (!aiState) continue;

      try {
        const response = await this.generateMultiPartyResponse(
          aiState,
          interactionContext,
          allParticipants,
          gameState
        );
        
        responses.push({
          participantId,
          response: response.content,
          tone: response.sentiment as any,
          strategicIntent: this.analyzeStrategicIntent(response, aiState),
          socialDynamics: this.analyzeSocialDynamics(response, allParticipants, aiState)
        });

      } catch (error) {
        console.warn(`Multi-party response generation failed (${participantId}):`, error);
        responses.push(this.generateFallbackMultiPartyResponse(participantId, interactionContext));
      }
    }

    // 分析群体动态
    const groupDynamics = this.analyzeGroupDynamics(responses, interactionContext, aiStates);
    
    // 生成场景叙述
    const sceneNarration = await this.generateMultiPlayerSceneNarration(
      interactionContext,
      responses,
      gameState
    );

    return {
      participantResponses: responses,
      groupDynamics,
      sceneNarration,
      emergentThemes: this.identifyEmergentThemes(responses),
      socialNetworkChanges: this.calculateSocialNetworkChanges(allParticipants, responses),
      followUpOpportunities: this.identifyFollowUpOpportunities(responses, interactionContext)
    };
  }

  /**
   * 适应性回应学习
   */
  async learnFromInteractionFeedback(
    interactionId: string,
    feedback: PlayerFeedback,
    gameState: GameState
  ): Promise<void> {
    const interaction = this.interactionHistory.find(i => i.timestamp.toString() === interactionId);
    if (!interaction) {
      console.warn(`Interaction ${interactionId} not found for learning`);
      return;
    }

    // 更新适应性回应数据
    const aiId = interaction.aiId;
    let adaptiveData = this.adaptiveResponses.get(aiId);
    if (!adaptiveData) {
      adaptiveData = {
        aiId,
        successfulPatterns: [],
        unsuccessfulPatterns: [],
        playerPreferences: new Map(),
        adaptationHistory: [],
        lastUpdated: Date.now()
      };
      this.adaptiveResponses.set(aiId, adaptiveData);
    }

    // 分析反馈并更新模式
    const pattern: ResponsePattern = {
      interactionType: interaction.interactionType,
      messagePattern: this.extractMessagePattern(interaction.aiResponse),
      context: this.extractContextFeatures(interaction, gameState),
      outcome: feedback.rating > 3 ? 'success' : 'failure',
      playerType: this.classifyPlayerType(interaction.humanPlayerId),
      timestamp: Date.now()
    };

    if (pattern.outcome === 'success') {
      adaptiveData.successfulPatterns.push(pattern);
    } else {
      adaptiveData.unsuccessfulPatterns.push(pattern);
    }

    // 更新玩家偏好
    const playerId = interaction.humanPlayerId;
    let playerPref = adaptiveData.playerPreferences.get(playerId);
    if (!playerPref) {
      playerPref = {
        preferredTones: [],
        dislikedPatterns: [],
        responseTimePreference: 'normal',
        culturalPreferences: [],
        interactionFrequency: 'moderate'
      };
    }

    // 根据反馈调整偏好
    this.updatePlayerPreferences(playerPref, feedback, interaction);
    adaptiveData.playerPreferences.set(playerId, playerPref);
    
    adaptiveData.lastUpdated = Date.now();

    console.log(`✨ AI ${aiId} 从玩家反馈中学习，适应性得到提升`);
  }

  /**
   * 获取玩家互动建议
   */
  getInteractionSuggestions(
    playerId: string,
    aiIds: string[],
    gameState: GameState,
    aiStates: Map<string, AIState>
  ): InteractionSuggestion[] {
    const suggestions: InteractionSuggestion[] = [];
    
    for (const aiId of aiIds) {
      const aiState = aiStates.get(aiId);
      if (!aiState) continue;

      const relationship = this.getPlayerRelationship(playerId, aiId);
      const recentInteractions = this.getRecentInteractions(playerId, aiId, 5);
      
      // 基于关系状态和AI个性生成建议
      const aiSuggestions = this.generateAISuggestions(
        aiState,
        relationship,
        recentInteractions,
        gameState
      );
      
      suggestions.push(...aiSuggestions);
    }

    // 按优先级排序
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 生成玩家互动报告
   */
  generateInteractionReport(playerId: string): PlayerInteractionReport {
    const playerInteractions = this.interactionHistory.filter(
      i => i.humanPlayerId === playerId
    );

    const aiPartners = [...new Set(playerInteractions.map(i => i.aiId))];
    const relationshipSummaries = aiPartners.map(aiId => ({
      aiId,
      relationshipState: this.getPlayerRelationship(playerId, aiId),
      interactionCount: playerInteractions.filter(i => i.aiId === aiId).length,
      averageRating: this.calculateAverageInteractionRating(playerId, aiId),
      commonInteractionTypes: this.getCommonInteractionTypes(playerId, aiId)
    }));

    return {
      playerId,
      totalInteractions: playerInteractions.length,
      relationshipSummaries,
      communicationStyle: this.analyzePlayerCommunicationStyle(playerId),
      preferredInteractionTypes: this.getPreferredInteractionTypes(playerId),
      socialNetwork: this.buildPlayerSocialNetwork(playerId),
      improvementSuggestions: this.generateImprovementSuggestions(playerId),
      generatedAt: Date.now()
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.llmService) {
      this.llmService.cleanup();
    }
    this.conversationManager.cleanup();
    this.storytellingManager.cleanup();
  }

  // 私有辅助方法

  private async analyzePlayerIntent(
    message: string, 
    interactionType: InteractionType, 
    gameState: GameState
  ): Promise<IntentAnalysis> {
    // 简化的意图分析
    return {
      primaryIntent: this.classifyIntent(message, interactionType),
      confidence: 0.8,
      secondaryIntents: [],
      emotionalTone: this.detectEmotionalTone(message),
      strategicImplication: this.analyzeStrategicImplication(message, gameState)
    };
  }

  private async generateAIResponse(
    aiState: AIState,
    humanPlayer: Player,
    interactionType: InteractionType,
    message: string,
    intentAnalysis: IntentAnalysis,
    gameState: GameState
  ): Promise<InteractionResponse> {
    if (this.llmService) {
      return await this.llmService.generatePlayerInteraction(
        aiState,
        interactionType,
        humanPlayer,
        gameState
      );
    }

    // 后备方案
    return {
      content: this.generateFallbackResponse(aiState, interactionType, message),
      interactionType,
      sentiment: 'neutral',
      suggestedReactions: ['继续对话', '结束互动'],
      timestamp: Date.now()
    };
  }

  private async generateChainReactions(
    humanPlayerId: string,
    primaryAIId: string,
    interactionType: InteractionType,
    primaryResponse: InteractionResponse,
    aiStates: Map<string, AIState>,
    gameState: GameState
  ): Promise<ChainReaction[]> {
    const reactions: ChainReaction[] = [];
    
    // 只有某些互动类型会触发连锁反应
    if (!this.shouldTriggerChainReactions(interactionType)) {
      return reactions;
    }

    for (const [aiId, aiState] of aiStates.entries()) {
      if (aiId === primaryAIId) continue; // 跳过主要回应的AI
      
      // 判断此AI是否会对互动产生反应
      if (this.shouldReactToInteraction(aiState, interactionType, primaryResponse)) {
        try {
          const reactionResponse = await this.generateReactionResponse(
            aiState,
            humanPlayerId,
            interactionType,
            primaryResponse,
            gameState
          );

          reactions.push({
            reactingAI: aiId,
            reactionType: this.classifyReactionType(reactionResponse, aiState),
            response: reactionResponse.content,
            motivation: this.explainReactionMotivation(aiState, interactionType, primaryResponse),
            timestamp: Date.now()
          });

        } catch (error) {
          console.warn(`Chain reaction generation failed for AI ${aiId}:`, error);
        }
      }
    }

    return reactions;
  }

  // 更多私有方法...
  private generateFallbackResponse(aiState: AIState, interactionType: InteractionType, message: string): string {
    const templates = {
      greeting: '你好！很高兴与你交流。',
      compliment: '谢谢你的称赞，我也认为你很不错。',
      taunt: '哈哈，我们拭目以待吧。',
      alliance_proposal: '让我考虑一下你的提议...',
      trade_offer: '这个交易听起来很有意思。'
    };
    
    return templates[interactionType] || '我明白你的意思。';
  }

  private classifyIntent(message: string, interactionType: InteractionType): string {
    const intentMap = {
      greeting: 'social',
      compliment: 'relationship_building',
      taunt: 'intimidation',
      alliance_proposal: 'strategic_alliance',
      trade_offer: 'business_negotiation'
    };
    
    return intentMap[interactionType] || 'general_communication';
  }

  private detectEmotionalTone(message: string): string {
    // 简化的情感检测
    if (message.includes('!') || message.includes('？')) return 'excited';
    if (message.includes('...')) return 'thoughtful';
    return 'neutral';
  }

  private getAIDisplayName(aiState: AIState): string {
    return (aiState as any)._enhancedProfile?.name || `${aiState.id}AI`;
  }

  // ... 更多辅助方法的简化实现
}

// 类型定义
export type InteractionType = 
  | 'greeting'
  | 'compliment' 
  | 'taunt'
  | 'alliance_proposal'
  | 'trade_offer'
  | 'information_request'
  | 'casual_chat'
  | 'strategic_discussion'
  | 'emotional_support'
  | 'competitive_banter';

export interface PlayerPreferences {
  preferredTones: string[];
  dislikedPatterns: string[];
  responseTimePreference: 'fast' | 'normal' | 'slow';
  culturalPreferences: string[];
  interactionFrequency: 'high' | 'moderate' | 'low';
}

export interface InteractionRecord {
  humanPlayerId: string;
  aiId: string;
  interactionType: InteractionType;
  humanMessage: string;
  aiResponse: string;
  intentAnalysis: IntentAnalysis;
  relationshipImpact: number;
  timestamp: number;
}

export interface PlayerRelationshipState {
  trustLevel: number;
  friendliness: number;
  rivalry: number;
  respect: number;
  lastInteraction: number;
  interactionCount: number;
  relationship_history: RelationshipEvent[];
}

export interface AdaptiveResponseData {
  aiId: string;
  successfulPatterns: ResponsePattern[];
  unsuccessfulPatterns: ResponsePattern[];
  playerPreferences: Map<string, PlayerPreferences>;
  adaptationHistory: AdaptationEvent[];
  lastUpdated: number;
}

export interface InteractionResult {
  primaryResponse: InteractionResponse;
  chainReactions: ChainReaction[];
  relationshipChanges: RelationshipChange[];
  suggestedFollowUps: string[];
  narrativeImpact: NarrativeImpact;
}

export interface ProactiveInteractionTrigger {
  type: 'game_event' | 'relationship_based' | 'strategic_opportunity' | 'emotional_state';
  context: any;
  urgency: number;
  strategicValue: number;
}

export interface ProactiveInteractionResult {
  initiatorAI: string;
  targetPlayer: string;
  interactionType: InteractionType;
  message: string;
  motivation: string;
  timing: string;
  contextualNarration: any;
  expectedPlayerReactions: string[];
  strategicPurpose: string;
}

export interface MultiPlayerInteractionContext {
  scenario: string;
  participants: string[];
  topic: string;
  stakes: any;
  gameContext: any;
}

export interface MultiPlayerInteractionResult {
  participantResponses: ParticipantResponse[];
  groupDynamics: GroupDynamics;
  sceneNarration: string;
  emergentThemes: string[];
  socialNetworkChanges: SocialNetworkChange[];
  followUpOpportunities: string[];
}

export interface ParticipantResponse {
  participantId: string;
  response: string;
  tone: string;
  strategicIntent: string;
  socialDynamics: string;
}

export interface PlayerFeedback {
  rating: number; // 1-5
  comments?: string;
  aspectRatings?: {
    relevance: number;
    personality: number;
    entertainment: number;
    helpfulness: number;
  };
}

export interface InteractionSuggestion {
  aiId: string;
  interactionType: InteractionType;
  suggestedMessage: string;
  reasoning: string;
  priority: number;
  expectedOutcome: string;
}

export interface PlayerInteractionReport {
  playerId: string;
  totalInteractions: number;
  relationshipSummaries: RelationshipSummary[];
  communicationStyle: string;
  preferredInteractionTypes: InteractionType[];
  socialNetwork: SocialNetworkNode[];
  improvementSuggestions: string[];
  generatedAt: number;
}

// 简化的接口定义
export interface IntentAnalysis {
  primaryIntent: string;
  confidence: number;
  secondaryIntents: string[];
  emotionalTone: string;
  strategicImplication: string;
}

export interface ChainReaction {
  reactingAI: string;
  reactionType: string;
  response: string;
  motivation: string;
  timestamp: number;
}

export interface RelationshipChange {
  aiId: string;
  changeType: string;
  magnitude: number;
  newState: any;
}

export interface NarrativeImpact {
  significance: number;
  storyInfluence: string;
  characterDevelopment: string[];
}

export interface ResponsePattern {
  interactionType: InteractionType;
  messagePattern: string;
  context: any;
  outcome: 'success' | 'failure';
  playerType: string;
  timestamp: number;
}

export interface AdaptationEvent {
  change: string;
  trigger: string;
  effectiveness: number;
  timestamp: number;
}

export interface RelationshipEvent {
  eventType: string;
  impact: number;
  description: string;
  timestamp: number;
}

export interface GroupDynamics {
  dominantPersonalities: string[];
  conflictLevel: number;
  cooperationLevel: number;
  emergentLeadership: string[];
}

export interface SocialNetworkChange {
  relationship: string;
  change: string;
  strength: number;
}

export interface RelationshipSummary {
  aiId: string;
  relationshipState: any;
  interactionCount: number;
  averageRating: number;
  commonInteractionTypes: InteractionType[];
}

export interface SocialNetworkNode {
  nodeId: string;
  connections: Connection[];
  influence: number;
  centrality: number;
}

export interface Connection {
  targetId: string;
  strength: number;
  type: string;
}