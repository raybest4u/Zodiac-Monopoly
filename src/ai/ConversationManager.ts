/**
 * 动态对话与谈判管理系统
 * 集成LLM服务，提供智能化的AI对话和谈判功能
 */
import type {
  AIState,
  AIDecision,
  PlayerRelationship
} from '../types/ai';

import type {
  GameState,
  Player,
  GameEvent
} from '../types/game';

import { LLMService, type LLMConfig, type ConversationResponse, type NegotiationDialogue } from './LLMService';

/**
 * 对话管理器 - 处理AI间的动态对话和谈判
 */
export class ConversationManager {
  private llmService?: LLMService;
  private conversationHistory: Map<string, ConversationRecord[]> = new Map();
  private activeNegotiations: Map<string, ActiveNegotiation> = new Map();
  
  constructor(llmConfig?: LLMConfig) {
    if (llmConfig) {
      try {
        this.llmService = new LLMService(llmConfig);
      } catch (error) {
        console.warn('ConversationManager: LLM service initialization failed:', error);
      }
    }
  }

  /**
   * 生成游戏场景对话
   */
  async generateScenarioDialogue(
    aiState: AIState,
    scenario: GameScenario,
    gameState: GameState,
    targetPlayerId?: string
  ): Promise<ConversationResponse> {
    const context = this.buildConversationContext(aiState, scenario, gameState);
    
    if (this.llmService) {
      try {
        const response = await this.llmService.generateConversation(
          aiState, 
          context, 
          targetPlayerId
        );
        
        // 记录对话历史
        this.recordConversation(aiState.id, {
          type: 'scenario_dialogue',
          content: response.content,
          context: scenario,
          timestamp: Date.now(),
          targetPlayerId
        });

        return response;
      } catch (error) {
        console.warn(`LLM对话生成失败 (${aiState.id}):`, error);
      }
    }

    // 后备方案：使用预设对话
    return this.generateFallbackDialogue(aiState, scenario, targetPlayerId);
  }

  /**
   * 启动谈判对话
   */
  async startNegotiation(
    initiatorState: AIState,
    targetPlayerId: string,
    negotiationType: NegotiationType,
    gameState: GameState,
    negotiationDetails: NegotiationDetails
  ): Promise<NegotiationSession> {
    const sessionId = `${initiatorState.id}_${targetPlayerId}_${Date.now()}`;
    
    const context = this.buildNegotiationContext(
      initiatorState, 
      targetPlayerId, 
      negotiationType, 
      gameState, 
      negotiationDetails
    );

    let openingDialogue: NegotiationDialogue;
    
    if (this.llmService) {
      try {
        openingDialogue = await this.llmService.generateNegotiationDialogue(
          initiatorState,
          context
        );
      } catch (error) {
        console.warn(`谈判开场白生成失败 (${initiatorState.id}):`, error);
        openingDialogue = this.generateFallbackNegotiationOpening(initiatorState, context);
      }
    } else {
      openingDialogue = this.generateFallbackNegotiationOpening(initiatorState, context);
    }

    const session: NegotiationSession = {
      sessionId,
      initiatorId: initiatorState.id,
      targetPlayerId,
      negotiationType,
      status: 'active',
      dialogueHistory: [openingDialogue],
      context,
      startTime: Date.now(),
      lastActivityTime: Date.now()
    };

    this.activeNegotiations.set(sessionId, {
      session,
      stateHistory: [{ ...context }]
    });

    return session;
  }

  /**
   * 响应谈判
   */
  async respondToNegotiation(
    responderState: AIState,
    sessionId: string,
    responseType: NegotiationResponseType,
    gameState: GameState
  ): Promise<NegotiationDialogue> {
    const negotiation = this.activeNegotiations.get(sessionId);
    if (!negotiation) {
      throw new Error(`谈判会话不存在: ${sessionId}`);
    }

    const responseContext = this.buildNegotiationResponseContext(
      responderState,
      negotiation.session,
      responseType,
      gameState
    );

    let responseDialogue: NegotiationDialogue;

    if (this.llmService) {
      try {
        responseDialogue = await this.llmService.generateNegotiationDialogue(
          responderState,
          responseContext
        );
      } catch (error) {
        console.warn(`谈判回应生成失败 (${responderState.id}):`, error);
        responseDialogue = this.generateFallbackNegotiationResponse(responderState, responseContext);
      }
    } else {
      responseDialogue = this.generateFallbackNegotiationResponse(responderState, responseContext);
    }

    // 更新谈判会话
    negotiation.session.dialogueHistory.push(responseDialogue);
    negotiation.session.lastActivityTime = Date.now();

    return responseDialogue;
  }

  /**
   * 生成情境反应对话
   */
  async generateEmotionalResponse(
    aiState: AIState,
    trigger: EmotionalTrigger,
    gameState: GameState,
    targetPlayerId?: string
  ): Promise<ConversationResponse> {
    const emotionalContext = this.buildEmotionalContext(aiState, trigger, gameState);
    
    if (this.llmService) {
      try {
        const response = await this.llmService.generatePlayerInteraction(
          aiState,
          this.mapTriggerToInteractionType(trigger),
          targetPlayerId ? this.findPlayerById(gameState, targetPlayerId) : null,
          gameState
        );
        
        return {
          content: response.content,
          tone: this.mapSentimentToTone(response.sentiment),
          context: trigger.situation,
          timestamp: Date.now()
        };
      } catch (error) {
        console.warn(`情绪反应生成失败 (${aiState.id}):`, error);
      }
    }

    return this.generateFallbackEmotionalResponse(aiState, trigger);
  }

  /**
   * 获取对话历史
   */
  getConversationHistory(playerId: string, limit: number = 10): ConversationRecord[] {
    const history = this.conversationHistory.get(playerId) || [];
    return history.slice(-limit);
  }

  /**
   * 获取活跃谈判列表
   */
  getActiveNegotiations(playerId?: string): NegotiationSession[] {
    const negotiations = Array.from(this.activeNegotiations.values());
    if (playerId) {
      return negotiations
        .filter(n => n.session.initiatorId === playerId || n.session.targetPlayerId === playerId)
        .map(n => n.session);
    }
    return negotiations.map(n => n.session);
  }

  /**
   * 结束谈判
   */
  concludeNegotiation(
    sessionId: string, 
    result: NegotiationResult, 
    finalMessage?: string
  ): NegotiationSession {
    const negotiation = this.activeNegotiations.get(sessionId);
    if (!negotiation) {
      throw new Error(`谈判会话不存在: ${sessionId}`);
    }

    negotiation.session.status = result.success ? 'concluded_success' : 'concluded_failure';
    negotiation.session.result = result;
    negotiation.session.endTime = Date.now();

    if (finalMessage) {
      negotiation.session.dialogueHistory.push({
        opening: finalMessage,
        mainPoints: [],
        concessions: [],
        closing: '',
        negotiationType: 'conclusion',
        timestamp: Date.now()
      });
    }

    // 从活跃谈判中移除
    this.activeNegotiations.delete(sessionId);

    return negotiation.session;
  }

  /**
   * 分析对话情感和关系影响
   */
  analyzeConversationImpact(
    conversation: ConversationResponse,
    fromPlayerId: string,
    toPlayerId?: string
  ): ConversationImpact {
    // 简化的情感分析
    const sentimentScore = this.analyzeSentimentScore(conversation.content);
    const toneImpact = this.analyzeToneImpact(conversation.tone);
    
    return {
      sentimentScore,
      relationshipChange: sentimentScore * 0.1, // 基础关系影响
      emotionalImpact: toneImpact,
      topicRelevance: this.analyzeTopicRelevance(conversation.context),
      timestamp: Date.now()
    };
  }

  /**
   * 清理过期对话和谈判
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30分钟

    // 清理过期谈判
    for (const [sessionId, negotiation] of this.activeNegotiations.entries()) {
      if (now - negotiation.session.lastActivityTime > maxAge) {
        this.activeNegotiations.delete(sessionId);
      }
    }

    // 清理过期对话历史
    for (const [playerId, history] of this.conversationHistory.entries()) {
      const filteredHistory = history.filter(record => now - record.timestamp < maxAge);
      if (filteredHistory.length === 0) {
        this.conversationHistory.delete(playerId);
      } else {
        this.conversationHistory.set(playerId, filteredHistory);
      }
    }

    // 清理LLM服务
    if (this.llmService) {
      this.llmService.cleanup();
    }
  }

  // 私有辅助方法

  private buildConversationContext(
    aiState: AIState,
    scenario: GameScenario,
    gameState: GameState
  ): any {
    return {
      situation: scenario.description,
      gamePhase: this.determineGamePhase(gameState),
      currentPerformance: this.evaluatePerformance(aiState, gameState),
      otherPlayers: gameState.players?.map(p => p.name) || []
    };
  }

  private buildNegotiationContext(
    initiatorState: AIState,
    targetPlayerId: string,
    negotiationType: NegotiationType,
    gameState: GameState,
    details: NegotiationDetails
  ): any {
    return {
      negotiationType,
      playerAdvantages: details.initiatorAdvantages || [],
      opponentAdvantages: details.targetAdvantages || [],
      desiredOutcome: details.desiredOutcome || '达成互利协议'
    };
  }

  private buildNegotiationResponseContext(
    responderState: AIState,
    session: NegotiationSession,
    responseType: NegotiationResponseType,
    gameState: GameState
  ): any {
    const lastDialogue = session.dialogueHistory[session.dialogueHistory.length - 1];
    
    return {
      negotiationType: session.negotiationType + '_response',
      playerAdvantages: this.analyzePlayerAdvantages(responderState, gameState),
      opponentAdvantages: this.analyzeOpponentAdvantages(session.initiatorId, gameState),
      desiredOutcome: this.determineResponseOutcome(responderState, responseType),
      previousOffer: lastDialogue.mainPoints
    };
  }

  private buildEmotionalContext(
    aiState: AIState,
    trigger: EmotionalTrigger,
    gameState: GameState
  ): any {
    return {
      emotion: trigger.emotion,
      situation: trigger.situation,
      intensity: trigger.intensity || 0.5,
      gameContext: this.getGameContext(gameState)
    };
  }

  private recordConversation(playerId: string, record: ConversationRecord): void {
    if (!this.conversationHistory.has(playerId)) {
      this.conversationHistory.set(playerId, []);
    }
    
    const history = this.conversationHistory.get(playerId)!;
    history.push(record);
    
    // 限制历史记录数量
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  private generateFallbackDialogue(
    aiState: AIState,
    scenario: GameScenario,
    targetPlayerId?: string
  ): ConversationResponse {
    const templates = this.getDialogueTemplates(aiState.personality.zodiac_traits?.strengths?.[0] || '默认');
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return {
      content: template.replace('{scenario}', scenario.description),
      tone: 'neutral',
      context: scenario.description,
      timestamp: Date.now()
    };
  }

  private generateFallbackNegotiationOpening(
    aiState: AIState,
    context: any
  ): NegotiationDialogue {
    return {
      opening: `关于${context.negotiationType}，我想我们可以谈谈。`,
      mainPoints: ['互利共赢', '公平交易'],
      concessions: [],
      closing: '期待您的回应。',
      negotiationType: context.negotiationType,
      timestamp: Date.now()
    };
  }

  private generateFallbackNegotiationResponse(
    aiState: AIState,
    context: any
  ): NegotiationDialogue {
    return {
      opening: `让我考虑一下您的提议...`,
      mainPoints: ['需要评估风险', '考虑长期利益'],
      concessions: [],
      closing: '我会慎重考虑的。',
      negotiationType: context.negotiationType,
      timestamp: Date.now()
    };
  }

  private generateFallbackEmotionalResponse(
    aiState: AIState,
    trigger: EmotionalTrigger
  ): ConversationResponse {
    const emotionTemplates = {
      excited: ['太棒了！', '这真是个好消息！'],
      frustrated: ['这有点让人头疼...', '情况似乎不太理想。'],
      confident: ['我对此很有信心。', '这在我的预料之中。'],
      worried: ['我有些担心...', '这个情况需要小心处理。']
    };

    const templates = emotionTemplates[trigger.emotion] || ['好的，我知道了。'];
    const content = templates[Math.floor(Math.random() * templates.length)];

    return {
      content,
      tone: 'neutral',
      context: trigger.situation,
      timestamp: Date.now()
    };
  }

  // 辅助分析方法

  private determineGamePhase(gameState: GameState): string {
    const turn = gameState.turn || 0;
    if (turn < 20) return '早期';
    if (turn < 60) return '中期';
    return '后期';
  }

  private evaluatePerformance(aiState: AIState, gameState: GameState): string {
    // 简化的表现评估
    const playerRank = this.calculatePlayerRank(aiState.id, gameState);
    if (playerRank === 1) return '领先';
    if (playerRank === 2) return '紧随其后';
    return '需要努力';
  }

  private calculatePlayerRank(playerId: string, gameState: GameState): number {
    // 简化实现
    return Math.floor(Math.random() * (gameState.players?.length || 4)) + 1;
  }

  private mapTriggerToInteractionType(trigger: EmotionalTrigger): any {
    const mapping = {
      excited: 'celebration',
      frustrated: 'competitive_banter',
      confident: 'taunt',
      worried: 'sympathy'
    };
    return mapping[trigger.emotion] || 'greeting';
  }

  private mapSentimentToTone(sentiment: string): any {
    const mapping = {
      positive: 'friendly',
      negative: 'aggressive',
      neutral: 'neutral'
    };
    return mapping[sentiment] || 'neutral';
  }

  private findPlayerById(gameState: GameState, playerId: string): Player | null {
    return gameState.players?.find(p => p.id === playerId) || null;
  }

  private analyzeSentimentScore(content: string): number {
    // 简化的情感评分
    const positiveWords = ['好', '棒', '优秀', '同意', '支持'];
    const negativeWords = ['差', '糟', '反对', '拒绝', '不满'];
    
    let score = 0;
    positiveWords.forEach(word => {
      if (content.includes(word)) score += 0.2;
    });
    negativeWords.forEach(word => {
      if (content.includes(word)) score -= 0.2;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  private analyzeToneImpact(tone: string): number {
    const impacts = {
      friendly: 0.3,
      cooperative: 0.2,
      neutral: 0,
      competitive: -0.1,
      aggressive: -0.3
    };
    return impacts[tone] || 0;
  }

  private analyzeTopicRelevance(context: string): number {
    // 简化的话题相关性评估
    return Math.random() * 0.5 + 0.5; // 0.5-1.0之间
  }

  private getDialogueTemplates(trait: string): string[] {
    const templates = {
      '智慧': ['让我们理性地分析{scenario}', '从长远来看，{scenario}'],
      '勇敢': ['面对{scenario}，我们不能退缩', '这个{scenario}正是展现实力的时候'],
      '默认': ['关于{scenario}，我有些想法', '这个{scenario}很有意思']
    };
    return templates[trait] || templates['默认'];
  }

  private analyzePlayerAdvantages(aiState: AIState, gameState: GameState): string[] {
    return ['经验丰富', '资源充足']; // 简化实现
  }

  private analyzeOpponentAdvantages(playerId: string, gameState: GameState): string[] {
    return ['位置优势', '时机把握好']; // 简化实现
  }

  private determineResponseOutcome(aiState: AIState, responseType: NegotiationResponseType): string {
    const outcomes = {
      accept: '接受提议并建立合作关系',
      counter: '提出更有利的反提议',
      reject: '礼貌拒绝但保持关系',
      delay: '需要更多时间考虑'
    };
    return outcomes[responseType] || '寻求最佳解决方案';
  }

  private getGameContext(gameState: GameState): any {
    return {
      turn: gameState.turn || 0,
      phase: this.determineGamePhase(gameState),
      playerCount: gameState.players?.length || 0
    };
  }
}

// 类型定义

export interface GameScenario {
  type: string;
  description: string;
  participants: string[];
  context: any;
}

export interface NegotiationDetails {
  initiatorAdvantages?: string[];
  targetAdvantages?: string[];
  desiredOutcome?: string;
  stakes?: any;
}

export interface NegotiationSession {
  sessionId: string;
  initiatorId: string;
  targetPlayerId: string;
  negotiationType: NegotiationType;
  status: 'active' | 'concluded_success' | 'concluded_failure' | 'abandoned';
  dialogueHistory: NegotiationDialogue[];
  context: any;
  startTime: number;
  lastActivityTime: number;
  endTime?: number;
  result?: NegotiationResult;
}

export interface ActiveNegotiation {
  session: NegotiationSession;
  stateHistory: any[];
}

export interface ConversationRecord {
  type: string;
  content: string;
  context: any;
  timestamp: number;
  targetPlayerId?: string;
}

export interface EmotionalTrigger {
  emotion: 'excited' | 'frustrated' | 'confident' | 'worried' | 'angry' | 'happy';
  situation: string;
  intensity?: number;
  cause?: string;
}

export interface NegotiationResult {
  success: boolean;
  terms?: any;
  satisfaction: number;
  relationshipImpact: number;
}

export interface ConversationImpact {
  sentimentScore: number;
  relationshipChange: number;
  emotionalImpact: number;
  topicRelevance: number;
  timestamp: number;
}

export type NegotiationType = 'trade' | 'alliance' | 'conflict_resolution' | 'property_exchange' | 'loan_request';
export type NegotiationResponseType = 'accept' | 'counter' | 'reject' | 'delay';