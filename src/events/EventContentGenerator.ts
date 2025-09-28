import { EventEmitter } from '../utils/EventEmitter';
import { LLMService } from '../ai/LLMService';
import { GameEventType, EventPriority, EventRarity } from './EventTypeDefinitions';
import { EventData, ProcessedEvent } from './EventSystemArchitecture';
import { GameState, Player } from '../types/game';

export interface EventContentRequest {
  id: string;
  eventType: string;
  context: EventContext;
  players?: Player[];
  priority: EventPriority;
  rarity: EventRarity;
  customPrompt?: string;
}

export interface EventContext {
  gamePhase: string;
  season: string;
  currentTurn: number;
  leadingPlayer?: string;
  gameEvents: string[];
  economicSituation: string;
  relationships: Record<string, number>;
  specialConditions: string[];
}

export interface GeneratedEventContent {
  id: string;
  title: string;
  description: string;
  narrativeText: string;
  flavorText: string;
  characterDialogue?: EventDialogue[];
  visualCues: VisualCue[];
  soundEffects: string[];
  culturalElements: CulturalElement[];
  timestamp: number;
}

export interface EventDialogue {
  speakerId: string;
  characterName: string;
  dialogue: string;
  emotion: string;
  zodiacPersonality: string;
}

export interface VisualCue {
  type: 'animation' | 'particle' | 'lighting' | 'background';
  description: string;
  duration: number;
  intensity: number;
}

export interface CulturalElement {
  type: 'zodiac_symbolism' | 'seasonal_reference' | 'traditional_wisdom' | 'festival';
  content: string;
  significance: string;
}

export class IntelligentEventContentGenerator extends EventEmitter {
  private llmService: LLMService;
  private contentCache = new Map<string, GeneratedEventContent>();
  private generationQueue: EventContentRequest[] = [];
  private isProcessing = false;
  
  constructor(llmService?: LLMService) {
    super();
    this.llmService = llmService || new LLMService();
  }
  
  public async generateEventContent(request: EventContentRequest): Promise<GeneratedEventContent> {
    const cacheKey = this.generateCacheKey(request);
    
    if (this.contentCache.has(cacheKey)) {
      const cached = this.contentCache.get(cacheKey)!;
      return { ...cached, id: request.id };
    }
    
    try {
      const content = await this.generateWithLLM(request);
      this.contentCache.set(cacheKey, content);
      
      this.emit('content_generated', { request, content });
      return content;
    } catch (error) {
      console.warn('LLM content generation failed, using fallback:', error);
      const fallbackContent = this.generateFallbackContent(request);
      this.emit('content_fallback', { request, content: fallbackContent, error });
      return fallbackContent;
    }
  }
  
  public async generateBatchContent(requests: EventContentRequest[]): Promise<GeneratedEventContent[]> {
    const results: GeneratedEventContent[] = [];
    
    for (const request of requests) {
      try {
        const content = await this.generateEventContent(request);
        results.push(content);
      } catch (error) {
        console.error(`Failed to generate content for ${request.id}:`, error);
        results.push(this.generateFallbackContent(request));
      }
    }
    
    return results;
  }
  
  public queueContentGeneration(request: EventContentRequest): void {
    this.generationQueue.push(request);
    this.processQueue();
  }
  
  public async generateZodiacEventContent(
    zodiacSign: string,
    eventType: string,
    context: EventContext,
    affectedPlayers: Player[]
  ): Promise<GeneratedEventContent> {
    const request: EventContentRequest = {
      id: `zodiac_${zodiacSign}_${Date.now()}`,
      eventType: `${GameEventType.ZODIAC_BLESSING_TRIGGERED}_${zodiacSign}`,
      context: {
        ...context,
        specialConditions: [...context.specialConditions, `zodiac_focus:${zodiacSign}`]
      },
      players: affectedPlayers,
      priority: EventPriority.HIGH,
      rarity: EventRarity.RARE,
      customPrompt: `生成一个关于${zodiacSign}生肖的特殊事件内容`
    };
    
    return this.generateEventContent(request);
  }
  
  public async generateSeasonalEventContent(
    season: string,
    eventType: string,
    context: EventContext
  ): Promise<GeneratedEventContent> {
    const request: EventContentRequest = {
      id: `seasonal_${season}_${Date.now()}`,
      eventType: `${GameEventType.SEASONAL_EVENT_TRIGGERED}_${season}`,
      context: {
        ...context,
        specialConditions: [...context.specialConditions, `season_focus:${season}`]
      },
      priority: EventPriority.MEDIUM,
      rarity: EventRarity.UNCOMMON,
      customPrompt: `生成一个关于${season}季节的特色事件内容`
    };
    
    return this.generateEventContent(request);
  }
  
  public async generatePropertyEventContent(
    propertyName: string,
    eventType: string,
    context: EventContext,
    owner?: Player
  ): Promise<GeneratedEventContent> {
    const request: EventContentRequest = {
      id: `property_${propertyName}_${Date.now()}`,
      eventType,
      context: {
        ...context,
        specialConditions: [...context.specialConditions, `property:${propertyName}`, owner ? `owner:${owner.name}` : 'unowned']
      },
      players: owner ? [owner] : undefined,
      priority: EventPriority.LOW,
      rarity: EventRarity.COMMON
    };
    
    return this.generateEventContent(request);
  }
  
  private async generateWithLLM(request: EventContentRequest): Promise<GeneratedEventContent> {
    const prompt = this.buildEventContentPrompt(request);
    const systemMessage = this.buildSystemMessage(request.eventType, request.rarity);
    
    const response = await this.llmService.generateEventNarration(
      {
        type: request.eventType,
        title: this.getEventTitle(request.eventType),
        description: request.customPrompt || '游戏事件',
        rarity: request.rarity
      } as any,
      request.players || [],
      {
        season: request.context.season,
        weather: this.getWeatherFromSeason(request.context.season),
        turn: request.context.currentTurn,
        phase: request.context.gamePhase
      }
    );
    
    const detailedPrompt = this.buildDetailedContentPrompt(request, response.narration);
    const detailedResponse = await this.callLLMForDetailedContent(detailedPrompt, systemMessage);
    
    return this.parseDetailedResponse(detailedResponse, request, response.narration);
  }
  
  private buildEventContentPrompt(request: EventContentRequest): string {
    const context = request.context;
    const playersInfo = request.players?.map(p => `${p.name}(${p.zodiac})`).join(', ') || '无特定玩家';
    
    return `
游戏背景：十二生肖大富翁游戏
事件类型：${request.eventType}
游戏阶段：${context.gamePhase}
当前季节：${context.season}
回合数：${context.currentTurn}
领先玩家：${context.leadingPlayer || '暂无'}
涉及玩家：${playersInfo}
经济状况：${context.economicSituation}
特殊条件：${context.specialConditions.join(', ')}
事件稀有度：${request.rarity}

${request.customPrompt || ''}

请生成富有创意和文化内涵的事件内容。
`;
  }
  
  private buildSystemMessage(eventType: string, rarity: EventRarity): string {
    const rarityDescriptions = {
      [EventRarity.COMMON]: '常见但有趣',
      [EventRarity.UNCOMMON]: '不常见且引人注目',
      [EventRarity.RARE]: '稀有且令人印象深刻',
      [EventRarity.EPIC]: '史诗级别且影响深远',
      [EventRarity.LEGENDARY]: '传奇级别且改变游戏格局'
    };
    
    return `你是十二生肖大富翁游戏的创意内容设计师。
你需要创造${rarityDescriptions[rarity]}的游戏事件内容。

要求：
1. 融入中国传统文化和生肖元素
2. 语言生动有趣，富有画面感
3. 符合游戏氛围和玩家体验
4. 包含适当的戏剧性和娱乐性
5. 体现事件的${rarity}稀有度特点

事件类型：${eventType}
请确保内容与事件类型高度匹配。`;
  }
  
  private buildDetailedContentPrompt(request: EventContentRequest, baseNarration: string): string {
    return `
基础叙述：${baseNarration}

请基于上述叙述，生成完整的事件内容，包括：

1. 事件标题（10字以内，有吸引力）
2. 详细描述（50-100字，描述事件具体内容）
3. 叙述文本（100-200字，生动的故事描述）
4. 风味文本（20-50字，增加趣味性的补充说明）
5. 角色对话（如果涉及特定玩家，为每个角色生成1-2句对话）
6. 视觉提示（描述应该配合的动画、特效等）
7. 音效建议（建议的背景音乐或音效）
8. 文化元素（体现的中国传统文化内容）

请以JSON格式返回，确保所有内容都符合十二生肖大富翁的游戏主题。
`;
  }
  
  private async callLLMForDetailedContent(prompt: string, systemMessage: string): Promise<string> {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-a'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.8,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    } catch (error) {
      throw new Error(`LLM API call failed: ${error}`);
    }
  }
  
  private parseDetailedResponse(
    response: string,
    request: EventContentRequest,
    baseNarration: string
  ): GeneratedEventContent {
    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      
      return {
        id: request.id,
        title: parsed.title || this.getEventTitle(request.eventType),
        description: parsed.description || '一个有趣的游戏事件发生了',
        narrativeText: parsed.narrativeText || baseNarration,
        flavorText: parsed.flavorText || '命运的齿轮开始转动...',
        characterDialogue: this.parseCharacterDialogue(parsed.characterDialogue, request.players),
        visualCues: this.parseVisualCues(parsed.visualCues),
        soundEffects: parsed.soundEffects || ['event_general'],
        culturalElements: this.parseCulturalElements(parsed.culturalElements),
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('Failed to parse detailed LLM response:', error);
      return this.generateStructuredFallback(request, baseNarration);
    }
  }
  
  private parseCharacterDialogue(dialogueData: any, players?: Player[]): EventDialogue[] {
    if (!dialogueData || !Array.isArray(dialogueData)) {
      return [];
    }
    
    return dialogueData.map((dialogue: any, index: number) => ({
      speakerId: players?.[index]?.id || `player_${index}`,
      characterName: players?.[index]?.name || dialogue.characterName || '神秘角色',
      dialogue: dialogue.dialogue || dialogue.text || '...',
      emotion: dialogue.emotion || 'neutral',
      zodiacPersonality: players?.[index]?.zodiac || dialogue.zodiac || '未知'
    }));
  }
  
  private parseVisualCues(visualData: any): VisualCue[] {
    if (!visualData || !Array.isArray(visualData)) {
      return [
        {
          type: 'animation',
          description: '事件发生的闪光效果',
          duration: 2000,
          intensity: 0.7
        }
      ];
    }
    
    return visualData.map((cue: any) => ({
      type: cue.type || 'animation',
      description: cue.description || '特效',
      duration: cue.duration || 2000,
      intensity: cue.intensity || 0.5
    }));
  }
  
  private parseCulturalElements(culturalData: any): CulturalElement[] {
    if (!culturalData || !Array.isArray(culturalData)) {
      return [];
    }
    
    return culturalData.map((element: any) => ({
      type: element.type || 'zodiac_symbolism',
      content: element.content || '',
      significance: element.significance || ''
    }));
  }
  
  private generateFallbackContent(request: EventContentRequest): GeneratedEventContent {
    const eventTypeTemplates = {
      [GameEventType.PLAYER_MOVED]: {
        title: '位移之路',
        description: '玩家在棋盘上移动到了新的位置',
        narrative: '命运的指引下，棋子落在了新的方格上，新的机遇与挑战即将开始。'
      },
      [GameEventType.PROPERTY_PURCHASED]: {
        title: '地产交易',
        description: '玩家成功购买了一处房产',
        narrative: '金钱与智慧的交换，新的财产归入囊中，商业帝国又添新砖。'
      },
      [GameEventType.SKILL_USED]: {
        title: '技能展现',
        description: '玩家使用了特殊技能',
        narrative: '生肖之力觉醒，古老的智慧在现代商战中绽放光芒。'
      },
      [GameEventType.ZODIAC_BLESSING_TRIGGERED]: {
        title: '生肖赐福',
        description: '生肖守护神降下祝福',
        narrative: '天地灵气汇聚，生肖守护之力显现，为有缘人带来意想不到的机遇。'
      }
    };
    
    const template = eventTypeTemplates[request.eventType as keyof typeof eventTypeTemplates] || eventTypeTemplates[GameEventType.PLAYER_MOVED];
    
    return {
      id: request.id,
      title: template.title,
      description: template.description,
      narrativeText: template.narrative,
      flavorText: '游戏世界中的精彩时刻...',
      characterDialogue: [],
      visualCues: [
        {
          type: 'animation',
          description: '基础事件动画',
          duration: 1500,
          intensity: 0.5
        }
      ],
      soundEffects: ['event_basic'],
      culturalElements: [],
      timestamp: Date.now()
    };
  }
  
  private generateStructuredFallback(request: EventContentRequest, baseNarration: string): GeneratedEventContent {
    return {
      id: request.id,
      title: this.getEventTitle(request.eventType),
      description: '游戏事件正在发生',
      narrativeText: baseNarration,
      flavorText: '命运在此刻悄然转变...',
      characterDialogue: [],
      visualCues: [
        {
          type: 'lighting',
          description: '柔和的光效变化',
          duration: 2000,
          intensity: 0.6
        }
      ],
      soundEffects: ['event_general', 'ambient_game'],
      culturalElements: [
        {
          type: 'zodiac_symbolism',
          content: '体现生肖文化的深厚底蕴',
          significance: '连接传统与现代的桥梁'
        }
      ],
      timestamp: Date.now()
    };
  }
  
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.generationQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      while (this.generationQueue.length > 0) {
        const request = this.generationQueue.shift()!;
        const content = await this.generateEventContent(request);
        this.emit('queued_content_generated', { request, content });
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  private generateCacheKey(request: EventContentRequest): string {
    const keyData = {
      eventType: request.eventType,
      season: request.context.season,
      phase: request.context.gamePhase,
      players: request.players?.length || 0,
      rarity: request.rarity,
      specialConditions: request.context.specialConditions.sort().join(',')
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 32);
  }
  
  private getEventTitle(eventType: string): string {
    const titleMap: Record<string, string> = {
      [GameEventType.GAME_STARTED]: '游戏开始',
      [GameEventType.TURN_STARTED]: '回合开启',
      [GameEventType.PLAYER_MOVED]: '移动命运',
      [GameEventType.PROPERTY_PURCHASED]: '地产投资',
      [GameEventType.SKILL_USED]: '技能释放',
      [GameEventType.ZODIAC_BLESSING_TRIGGERED]: '生肖祝福',
      [GameEventType.SEASONAL_EVENT_TRIGGERED]: '季节变迁',
      [GameEventType.TRADE_COMPLETED]: '交易达成'
    };
    
    return titleMap[eventType] || '神秘事件';
  }
  
  private getWeatherFromSeason(season: string): string {
    const weatherMap: Record<string, string> = {
      'spring': '春风和煦',
      'summer': '夏日炎炎',
      'autumn': '秋高气爽',
      'winter': '冬雪纷飞'
    };
    
    return weatherMap[season] || '天气宜人';
  }
  
  public clearCache(): void {
    this.contentCache.clear();
    this.emit('cache_cleared');
  }
  
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.contentCache.size,
      keys: Array.from(this.contentCache.keys())
    };
  }
}

export const createEventContentGenerator = (llmService?: LLMService): IntelligentEventContentGenerator => {
  return new IntelligentEventContentGenerator(llmService);
};

export default IntelligentEventContentGenerator;