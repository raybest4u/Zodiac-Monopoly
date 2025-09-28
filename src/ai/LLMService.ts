import type {
  AIState,
  AIPersonality,
  AIDecision,
  SituationAnalysis
} from '../types/ai';

import type {
  GameState,
  Player,
  GameEvent
} from '../types/game';

/**
 * 大语言模型服务 - 支持多种LLM提供商的智能对话和决策支持
 */

import { llmConfig, LLMProvider } from '../config/LLMConfig';
export class LLMService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly provider: LLMProvider;
  private requestCache: Map<string, CachedResponse> = new Map();
  private readonly config: LLMConfig;

  constructor(config?: Partial<LLMConfig & { provider?: LLMProvider }>) {
    // 使用配置管理器或手动配置
    const provider = config?.provider || llmConfig.getDefaultProvider();
    const providerConfig = config ? {
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      model: config.model,
      maxTokens: config.maxTokens
    } : llmConfig.getLLMServiceConfig(provider);
    
    this.provider = provider;
    this.apiUrl = providerConfig.apiUrl;
    this.apiKey = providerConfig.apiKey;
    this.model = providerConfig.model;
    
    const commonConfig = llmConfig.getCommonConfig();
    this.config = {
      maxTokens: providerConfig.maxTokens || 2000,
      temperature: providerConfig.temperature || 0.7,
      topP: 0.9,
      enableCache: true,
      cacheTimeout: 300000, // 5 minutes
      maxRetries: commonConfig.retryAttempts,
      timeout: commonConfig.timeout,
      enableRateLimiting: true,
      requestsPerMinute: 60,
      ...config
    };

    if (!this.apiKey) {
      throw new Error(`API key for ${this.provider} provider is required but not configured`);
    }
  }

  /**
   * 生成AI个性化描述和特征
   */
  async generatePersonalityProfile(
    zodiac: string,
    difficulty: string,
    basePersonality?: Partial<AIPersonality>
  ): Promise<EnhancedPersonalityProfile> {
    const prompt = this.buildPersonalityPrompt(zodiac, difficulty, basePersonality);
    
    const response = await this.callLLM(prompt, {
      temperature: 0.8,
      maxTokens: 1500,
      systemMessage: `你是一个专业的游戏AI个性设计师，专门为十二生肖大富翁游戏创建独特且有趣的AI角色个性。
      请创建详细、生动、符合中国传统文化的角色个性描述。`
    });

    return this.parsePersonalityResponse(response, zodiac, difficulty);
  }

  /**
   * 生成动态对话内容
   */
  async generateConversation(
    aiState: AIState,
    context: ConversationContext,
    targetPlayerId?: string
  ): Promise<ConversationResponse> {
    const prompt = this.buildConversationPrompt(aiState, context, targetPlayerId);
    
    const response = await this.callLLM(prompt, {
      temperature: 0.9,
      maxTokens: 500,
      systemMessage: `你是一个${aiState.personality.zodiac_traits?.strengths?.[0] || '聪明'}的${this.getZodiacName(aiState.id)}，
      正在玩十二生肖大富翁游戏。请用生动有趣的语言与其他玩家互动，体现你的个性特点。`
    });

    return this.parseConversationResponse(response, context);
  }

  /**
   * 生成谈判和交易对话
   */
  async generateNegotiationDialogue(
    aiState: AIState,
    negotiationContext: NegotiationContext
  ): Promise<NegotiationDialogue> {
    const prompt = this.buildNegotiationPrompt(aiState, negotiationContext);
    
    const response = await this.callLLM(prompt, {
      temperature: 0.7,
      maxTokens: 800,
      systemMessage: `你是一个精明的谈判者，正在进行游戏内的交易谈判。
      根据你的个性特点和当前游戏状况，进行合理的谈判对话。`
    });

    return this.parseNegotiationResponse(response, negotiationContext);
  }

  /**
   * 为决策生成详细推理说明
   */
  async generateDecisionReasoning(
    aiState: AIState,
    decision: AIDecision,
    gameState: GameState,
    analysis: SituationAnalysis
  ): Promise<DetailedReasoning> {
    const prompt = this.buildReasoningPrompt(aiState, decision, gameState, analysis);
    
    const response = await this.callLLM(prompt, {
      temperature: 0.6,
      maxTokens: 1000,
      systemMessage: `你是一个游戏策略分析师，需要为AI的决策提供详细、逻辑清晰的推理解释。
      解释要符合角色的个性特点和当前游戏情况。`
    });

    return this.parseReasoningResponse(response, decision);
  }

  /**
   * 生成事件叙述和故事内容
   */
  async generateEventNarration(
    event: GameEvent,
    affectedPlayers: Player[],
    gameContext: GameContext
  ): Promise<EventNarration> {
    const prompt = this.buildNarrationPrompt(event, affectedPlayers, gameContext);
    
    const response = await this.callLLM(prompt, {
      temperature: 0.8,
      maxTokens: 600,
      systemMessage: `你是一个生动的游戏叙述者，专门为十二生肖大富翁游戏创作有趣的事件描述。
      请用引人入胜的语言描述游戏事件，增加游戏的趣味性和沉浸感。`
    });

    return this.parseNarrationResponse(response, event);
  }

  /**
   * 生成玩家互动反馈
   */
  async generatePlayerInteraction(
    aiState: AIState,
    interactionType: InteractionType,
    targetPlayer: Player,
    gameState: GameState
  ): Promise<InteractionResponse> {
    const prompt = this.buildInteractionPrompt(aiState, interactionType, targetPlayer, gameState);
    
    const response = await this.callLLM(prompt, {
      temperature: 0.8,
      maxTokens: 400,
      systemMessage: `你正在与其他玩家进行游戏互动，请根据你的个性特点给出自然、有趣的反应。`
    });

    return this.parseInteractionResponse(response, interactionType);
  }

  /**
   * 批量生成多个内容
   */
  async generateBatchContent(
    requests: LLMRequest[]
  ): Promise<LLMBatchResponse> {
    const results: LLMResponse[] = [];
    const errors: LLMError[] = [];

    // 并行处理请求（考虑速率限制）
    const batchSize = Math.min(5, requests.length);
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const response = await this.callLLM(request.prompt, request.options);
          return { id: request.id, content: response, success: true };
        } catch (error) {
          errors.push({
            id: request.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
          });
          return { id: request.id, content: '', success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 速率限制延迟
      if (i + batchSize < requests.length) {
        await this.sleep(1000); // 1秒延迟
      }
    }

    return {
      results,
      errors,
      totalRequests: requests.length,
      successfulRequests: results.filter(r => r.success).length,
      timestamp: Date.now()
    };
  }

  /**
   * 清理缓存和资源
   */
  cleanup(): void {
    this.requestCache.clear();
  }

  // 私有方法

  private async callLLM(
    prompt: string,
    options: Partial<LLMCallOptions> = {}
  ): Promise<string> {
    // 检查缓存
    if (this.config.enableCache) {
      const cacheKey = this.generateCacheKey(prompt, options);
      const cached = this.requestCache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return cached.content;
      }
    }

    // 速率限制检查
    if (this.config.enableRateLimiting) {
      await this.checkRateLimit();
    }

    const requestOptions: LLMCallOptions = {
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      topP: this.config.topP,
      systemMessage: '',
      ...options
    };

    let lastError: Error | null = null;

    // 重试机制
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeAPIRequest(prompt, requestOptions);
        
        // 缓存响应
        if (this.config.enableCache) {
          const cacheKey = this.generateCacheKey(prompt, options);
          this.requestCache.set(cacheKey, {
            content: response,
            timestamp: Date.now(),
            prompt,
            options: requestOptions
          });
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`LLM API call attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.config.maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000); // 指数退避
        }
      }
    }

    throw new Error(`LLM API call failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  private async makeAPIRequest(prompt: string, options: LLMCallOptions): Promise<string> {
    const messages = [];
    
    if (options.systemMessage) {
      messages.push({
        role: 'system',
        content: options.systemMessage
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const requestBody = {
      model: this.model,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      top_p: options.topP,
      stream: false
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('No response content received from API');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // 提示词构建方法

  private buildPersonalityPrompt(
    zodiac: string,
    difficulty: string,
    basePersonality?: Partial<AIPersonality>
  ): string {
    return `请为一个${zodiac}生肖的AI玩家创建详细的个性档案，难度等级为${difficulty}。

要求：
1. 个性特征要符合${zodiac}的传统特点
2. 包含具体的数值化个性参数（风险承受度、攻击性、合作性等）
3. 描述独特的说话风格和行为习惯
4. 提供游戏策略偏好和决策倾向
5. 包含文化背景和个人故事

${basePersonality ? `基础个性参考：${JSON.stringify(basePersonality)}` : ''}

请以JSON格式返回，包含以下字段：
- name: 角色名字
- description: 详细个性描述
- characteristics: 个性特征列表
- speechStyle: 说话风格描述
- strategies: 喜欢的游戏策略
- backstory: 简短背景故事
- personality_values: 数值化个性参数`;
  }

  private buildConversationPrompt(
    aiState: AIState,
    context: ConversationContext,
    targetPlayerId?: string
  ): string {
    const personality = aiState.personality;
    const mood = aiState.emotionalState?.mood || 'neutral';
    
    return `当前游戏情况：
- 游戏阶段：${context.gamePhase}
- 当前心情：${mood}
- 个性特点：${personality.zodiac_traits?.strengths?.join(', ') || '聪明善良'}
- 游戏表现：${context.currentPerformance}

场景：${context.situation}
${targetPlayerId ? `对话对象：${targetPlayerId}` : ''}

请生成1-2句自然的对话，体现角色个性特点和当前情绪状态。`;
  }

  private buildNegotiationPrompt(aiState: AIState, context: NegotiationContext): string {
    return `谈判场景：
- 谈判类型：${context.negotiationType}
- 己方优势：${context.playerAdvantages.join(', ')}
- 对方优势：${context.opponentAdvantages.join(', ')}
- 期望结果：${context.desiredOutcome}
- 个性风格：${aiState.personality.negotiation_style?.style || '合作'}

请生成合理的谈判对话，包含：
1. 开场白（1-2句）
2. 主要论点（2-3个要点）
3. 让步条件（如果需要）
4. 结束语

要求体现角色个性特点和谈判策略。`;
  }

  private buildReasoningPrompt(
    aiState: AIState,
    decision: AIDecision,
    gameState: GameState,
    analysis: SituationAnalysis
  ): string {
    return `决策分析：
- 选择的行动：${decision.action.type}
- 决策置信度：${(decision.confidence * 100).toFixed(1)}%
- 游戏阶段：${analysis.gamePhase.phase}
- 经济状况：排名第${analysis.economicSituation.moneyRank}位
- 主要威胁：${analysis.threats.map(t => t.source).join(', ') || '无'}
- 机会：${analysis.opportunities.length}个

角色特点：
- 生肖：${this.getZodiacName(aiState.id)}
- 策略偏好：${aiState.currentStrategy.focus}
- 风险承受度：${aiState.personality.risk_tolerance}

请详细解释这个决策的原因，包含：
1. 当前形势分析
2. 决策考虑因素
3. 预期效果
4. 风险评估

用第一人称，体现角色个性特点。`;
  }

  private buildNarrationPrompt(
    event: GameEvent,
    affectedPlayers: Player[],
    context: GameContext
  ): string {
    return `游戏事件叙述：
- 事件类型：${event.type}
- 事件标题：${event.title}
- 事件描述：${event.description}
- 影响玩家：${affectedPlayers.map(p => p.name).join(', ')}
- 游戏背景：${context.season}季，${context.weather}天
- 稀有度：${event.rarity}

请创作生动有趣的事件叙述，要求：
1. 符合十二生肖大富翁的游戏氛围
2. 突出事件的戏剧性和趣味性
3. 体现中国传统文化元素
4. 长度控制在100-200字
5. 语言生动活泼，有画面感`;
  }

  private buildInteractionPrompt(
    aiState: AIState,
    interactionType: InteractionType,
    targetPlayer: Player,
    gameState: GameState
  ): string {
    const relationship = aiState.memory.playerRelationships[targetPlayer.id];
    
    return `玩家互动：
- 互动类型：${interactionType}
- 目标玩家：${targetPlayer.name}（${targetPlayer.zodiac}）
- 关系状态：${relationship?.trustLevel ? (relationship.trustLevel > 0.7 ? 'friendly' : relationship.trustLevel < 0.3 ? 'hostile' : 'neutral') : 'neutral'}
- 信任度：${((relationship?.trustLevel || 0.5) * 100).toFixed(0)}%
- 当前心情：${aiState.emotionalState?.mood || 'neutral'}

请生成适当的互动回应，要求：
1. 体现角色个性特点
2. 考虑玩家关系状态
3. 符合当前游戏情况
4. 语言自然有趣
5. 1-2句话表达完整`;
  }

  // 响应解析方法

  private parsePersonalityResponse(
    response: string,
    zodiac: string,
    difficulty: string
  ): EnhancedPersonalityProfile {
    try {
      // 处理可能的markdown格式化内容
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return {
        name: parsed.name || `${zodiac}大师`,
        description: parsed.description || `一个典型的${zodiac}性格角色`,
        characteristics: parsed.characteristics || [],
        speechStyle: parsed.speechStyle || '温和友善',
        strategies: parsed.strategies || [],
        backstory: parsed.backstory || '来自古老家族的传人',
        personalityValues: parsed.personality_values || {},
        generatedAt: Date.now(),
        zodiac,
        difficulty
      };
    } catch (error) {
      console.warn('Failed to parse personality response:', error);
      return this.createDefaultPersonalityProfile(zodiac, difficulty);
    }
  }

  private parseConversationResponse(response: string, context: ConversationContext): ConversationResponse {
    return {
      content: response,
      tone: this.analyzeTone(response),
      context: context.situation,
      timestamp: Date.now()
    };
  }

  private parseNegotiationResponse(response: string, context: NegotiationContext): NegotiationDialogue {
    const lines = response.split('\n').filter(line => line.trim());
    return {
      opening: lines[0] || response.substring(0, 100),
      mainPoints: lines.slice(1, -1).filter(line => line.includes('要点') || line.includes('论点')),
      concessions: lines.filter(line => line.includes('让步') || line.includes('条件')),
      closing: lines[lines.length - 1] || '',
      negotiationType: context.negotiationType,
      timestamp: Date.now()
    };
  }

  private parseReasoningResponse(response: string, decision: AIDecision): DetailedReasoning {
    return {
      decisionType: decision.action.type,
      situationAnalysis: this.extractSection(response, '形势分析'),
      considerationFactors: this.extractSection(response, '考虑因素'),
      expectedEffects: this.extractSection(response, '预期效果'),
      riskAssessment: this.extractSection(response, '风险评估'),
      fullExplanation: response,
      confidence: decision.confidence,
      timestamp: Date.now()
    };
  }

  private parseNarrationResponse(response: string, event: GameEvent): EventNarration {
    return {
      title: event.title,
      narration: response,
      mood: this.extractNarrationMood(response),
      culturalElements: this.extractCulturalElements(response),
      visualCues: this.extractVisualCues(response),
      eventType: event.type,
      timestamp: Date.now()
    };
  }

  private parseInteractionResponse(response: string, interactionType: InteractionType): InteractionResponse {
    return {
      content: response,
      interactionType,
      sentiment: this.analyzeSentiment(response),
      suggestedReactions: this.extractSuggestedReactions(response),
      timestamp: Date.now()
    };
  }

  // 辅助方法

  private generateCacheKey(prompt: string, options: Partial<LLMCallOptions>): string {
    const keyData = {
      prompt: prompt.substring(0, 100),
      temperature: options.temperature,
      maxTokens: options.maxTokens
    };
    
    try {
      // 使用 Buffer.from() 代替 btoa() 来处理中文字符
      const jsonString = JSON.stringify(keyData);
      const base64 = Buffer.from(jsonString, 'utf-8').toString('base64');
      return base64.replace(/[^a-zA-Z0-9]/g, '');
    } catch (error) {
      // 如果仍然失败，使用简单的哈希
      const hash = this.simpleHash(JSON.stringify(keyData));
      return hash.toString(36);
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private isCacheValid(cached: CachedResponse): boolean {
    return Date.now() - cached.timestamp < this.config.cacheTimeout;
  }

  private async checkRateLimit(): Promise<void> {
    // 简化的速率限制检查
    // 实际实现应该更sophisticated
    await this.sleep(1000 / (this.config.requestsPerMinute / 60));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getZodiacName(aiId: string): string {
    // 从aiId或其他方式获取生肖名称
    return '智者'; // 简化实现
  }

  private createDefaultPersonalityProfile(zodiac: string, difficulty: string): EnhancedPersonalityProfile {
    return {
      name: `${zodiac}大师`,
      description: `一个典型的${zodiac}性格AI角色，具有传统生肖特点`,
      characteristics: [`${zodiac}特质`, '聪明', '友善'],
      speechStyle: '温和而睿智',
      strategies: ['稳健发展', '合作共赢'],
      backstory: `来自古老家族的${zodiac}传人`,
      personalityValues: {},
      generatedAt: Date.now(),
      zodiac,
      difficulty
    };
  }

  private analyzeTone(text: string): 'friendly' | 'aggressive' | 'neutral' | 'cooperative' | 'competitive' {
    // 简化的语调分析
    if (text.includes('朋友') || text.includes('合作')) return 'friendly';
    if (text.includes('竞争') || text.includes('战胜')) return 'competitive';
    if (text.includes('一起') || text.includes('共同')) return 'cooperative';
    return 'neutral';
  }

  private extractSection(text: string, sectionName: string): string {
    const lines = text.split('\n');
    const sectionLine = lines.findIndex(line => line.includes(sectionName));
    if (sectionLine >= 0 && sectionLine < lines.length - 1) {
      return lines[sectionLine + 1].trim();
    }
    return '';
  }

  private extractNarrationMood(text: string): 'exciting' | 'mysterious' | 'humorous' | 'dramatic' | 'peaceful' {
    if (text.includes('惊险') || text.includes('激动')) return 'exciting';
    if (text.includes('神秘') || text.includes('未知')) return 'mysterious';
    if (text.includes('有趣') || text.includes('好笑')) return 'humorous';
    if (text.includes('戏剧性') || text.includes('震撼')) return 'dramatic';
    return 'peaceful';
  }

  private extractCulturalElements(text: string): string[] {
    const elements = [];
    if (text.includes('龙')) elements.push('dragon');
    if (text.includes('凤凰')) elements.push('phoenix');
    if (text.includes('太极')) elements.push('taiji');
    return elements;
  }

  private extractVisualCues(text: string): string[] {
    const cues = [];
    if (text.includes('金光')) cues.push('golden_light');
    if (text.includes('红色')) cues.push('red_color');
    return cues;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // 简化的情感分析
    const positiveWords = ['好', '棒', '优秀', '赞'];
    const negativeWords = ['差', '糟', '讨厌', '愤怒'];
    
    const hasPositive = positiveWords.some(word => text.includes(word));
    const hasNegative = negativeWords.some(word => text.includes(word));
    
    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    return 'neutral';
  }

  private extractSuggestedReactions(text: string): string[] {
    return ['继续对话', '表示赞同', '提出建议'];
  }
}

// 类型定义
export interface LLMConfig {
  apiUrl?: string;
  apiKey?: string; // 可选，优先使用配置管理器
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: LLMProvider; // 指定提供商
  topP?: number;
  enableCache?: boolean;
  cacheTimeout?: number;
  maxRetries?: number;
  timeout?: number;
  enableRateLimiting?: boolean;
  requestsPerMinute?: number;
}

export interface LLMCallOptions {
  temperature: number;
  maxTokens: number;
  topP: number;
  systemMessage: string;
}

export interface CachedResponse {
  content: string;
  timestamp: number;
  prompt: string;
  options: LLMCallOptions;
}

export interface EnhancedPersonalityProfile {
  name: string;
  description: string;
  characteristics: string[];
  speechStyle: string;
  strategies: string[];
  backstory: string;
  personalityValues: Record<string, number>;
  generatedAt: number;
  zodiac: string;
  difficulty: string;
}

export interface ConversationContext {
  situation: string;
  gamePhase: string;
  currentPerformance: string;
  otherPlayers?: string[];
}

export interface ConversationResponse {
  content: string;
  tone: 'friendly' | 'aggressive' | 'neutral' | 'cooperative' | 'competitive';
  context: string;
  timestamp: number;
}

export interface NegotiationContext {
  negotiationType: 'trade' | 'alliance' | 'conflict_resolution';
  playerAdvantages: string[];
  opponentAdvantages: string[];
  desiredOutcome: string;
}

export interface NegotiationDialogue {
  opening: string;
  mainPoints: string[];
  concessions: string[];
  closing: string;
  negotiationType: string;
  timestamp: number;
}

export interface DetailedReasoning {
  decisionType: string;
  situationAnalysis: string;
  considerationFactors: string;
  expectedEffects: string;
  riskAssessment: string;
  fullExplanation: string;
  confidence: number;
  timestamp: number;
}

export interface EventNarration {
  title: string;
  narration: string;
  mood: 'exciting' | 'mysterious' | 'humorous' | 'dramatic' | 'peaceful';
  culturalElements: string[];
  visualCues: string[];
  eventType: string;
  timestamp: number;
}

export interface GameContext {
  season: string;
  weather: string;
  turn: number;
  phase: string;
}

export interface InteractionResponse {
  content: string;
  interactionType: InteractionType;
  sentiment: 'positive' | 'negative' | 'neutral';
  suggestedReactions: string[];
  timestamp: number;
}

export interface LLMRequest {
  id: string;
  prompt: string;
  options?: Partial<LLMCallOptions>;
}

export interface LLMResponse {
  id: string;
  content: string;
  success: boolean;
}

export interface LLMError {
  id: string;
  error: string;
  timestamp: number;
}

export interface LLMBatchResponse {
  results: LLMResponse[];
  errors: LLMError[];
  totalRequests: number;
  successfulRequests: number;
  timestamp: number;
}

export type InteractionType = 
  | 'greeting' 
  | 'taunt' 
  | 'compliment' 
  | 'threat' 
  | 'alliance_proposal'
  | 'trade_offer'
  | 'celebration'
  | 'sympathy'
  | 'competitive_banter';