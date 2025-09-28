import { EventEmitter } from '../utils/EventEmitter';
import { LLMService } from '../ai/LLMService';
import { Player } from '../types/game';
import { AIState } from '../types/ai';

export interface DialogueRequest {
  id: string;
  speaker: Player;
  context: DialogueContext;
  dialogueType: DialogueType;
  targetPlayer?: Player;
  mood?: EmotionalState;
  customPrompt?: string;
}

export interface DialogueContext {
  situation: string;
  gamePhase: string;
  recentEvents: string[];
  playerRelationships: Record<string, number>;
  gameStatus: GameStatus;
  environmentalFactors: string[];
}

export interface GameStatus {
  leadingPlayer: string;
  economicSituation: string;
  competitiveness: number;
  cooperationLevel: number;
  tension: number;
}

export interface GeneratedDialogue {
  id: string;
  speakerId: string;
  content: string;
  emotion: EmotionalState;
  tone: DialogueTone;
  culturalElements: string[];
  zodiacPersonality: string;
  responseOptions?: DialogueOption[];
  visualCues: DialogueVisualCue[];
  timestamp: number;
}

export interface DialogueOption {
  id: string;
  text: string;
  mood: EmotionalState;
  consequence: string;
}

export interface DialogueVisualCue {
  type: 'expression' | 'gesture' | 'aura' | 'background';
  description: string;
  intensity: number;
}

export type DialogueType = 
  | 'greeting'
  | 'taunt'
  | 'compliment' 
  | 'threat'
  | 'alliance_proposal'
  | 'trade_negotiation'
  | 'celebration'
  | 'sympathy'
  | 'competitive_banter'
  | 'wisdom_sharing'
  | 'cultural_reference'
  | 'seasonal_comment'
  | 'philosophical_musing';

export type EmotionalState = 
  | 'joy'
  | 'anger'
  | 'sadness'
  | 'excitement'
  | 'confidence'
  | 'anxiety'
  | 'contentment'
  | 'determination'
  | 'contemplation'
  | 'mischief';

export type DialogueTone = 
  | 'formal'
  | 'casual'
  | 'poetic'
  | 'humorous'
  | 'serious'
  | 'mystical'
  | 'wise'
  | 'playful';

export class DialogueContentGenerator extends EventEmitter {
  private llmService: LLMService;
  private dialogueCache = new Map<string, GeneratedDialogue>();
  private zodiacPersonalities = new Map<string, ZodiacPersonality>();
  private dialogueTemplates = new Map<DialogueType, DialogueTemplate[]>();
  
  constructor(llmService?: LLMService) {
    super();
    this.llmService = llmService || new LLMService();
    this.initializeZodiacPersonalities();
    this.initializeDialogueTemplates();
  }
  
  public async generateDialogue(request: DialogueRequest): Promise<GeneratedDialogue> {
    const cacheKey = this.generateCacheKey(request);
    
    if (this.dialogueCache.has(cacheKey)) {
      const cached = this.dialogueCache.get(cacheKey)!;
      return { ...cached, id: request.id };
    }
    
    try {
      const dialogue = await this.generateWithLLM(request);
      this.dialogueCache.set(cacheKey, dialogue);
      this.emit('dialogue_generated', { request, dialogue });
      return dialogue;
    } catch (error) {
      console.warn('LLM dialogue generation failed:', error);
      const fallback = this.generateFallbackDialogue(request);
      this.emit('dialogue_fallback', { request, dialogue: fallback, error });
      return fallback;
    }
  }
  
  public async generateConversationChain(
    initiator: Player,
    responder: Player,
    context: DialogueContext,
    turns: number = 3
  ): Promise<GeneratedDialogue[]> {
    const conversation: GeneratedDialogue[] = [];
    let currentContext = { ...context };
    
    for (let i = 0; i < turns; i++) {
      const speaker = i % 2 === 0 ? initiator : responder;
      const dialogueType = this.selectAppropriateDialogueType(currentContext, i);
      
      const request: DialogueRequest = {
        id: `conversation_${i}_${Date.now()}`,
        speaker,
        context: currentContext,
        dialogueType,
        targetPlayer: speaker === initiator ? responder : initiator,
        mood: this.determineEmotionalState(currentContext, speaker)
      };
      
      const dialogue = await this.generateDialogue(request);
      conversation.push(dialogue);
      
      // Update context for next turn
      currentContext = this.updateContextWithDialogue(currentContext, dialogue);
    }
    
    return conversation;
  }
  
  public async generateZodiacWisdomDialogue(
    speaker: Player,
    context: DialogueContext,
    wisdomTopic: string
  ): Promise<GeneratedDialogue> {
    const request: DialogueRequest = {
      id: `wisdom_${speaker.zodiac}_${Date.now()}`,
      speaker,
      context,
      dialogueType: 'wisdom_sharing',
      customPrompt: `分享关于${wisdomTopic}的${speaker.zodiac}生肖智慧`
    };
    
    return this.generateDialogue(request);
  }
  
  public async generateSeasonalDialogue(
    speaker: Player,
    season: string,
    context: DialogueContext
  ): Promise<GeneratedDialogue> {
    const request: DialogueRequest = {
      id: `seasonal_${season}_${Date.now()}`,
      speaker,
      context: {
        ...context,
        environmentalFactors: [...context.environmentalFactors, `season:${season}`]
      },
      dialogueType: 'seasonal_comment',
      customPrompt: `根据${season}季节发表感想`
    };
    
    return this.generateDialogue(request);
  }
  
  public async generateCulturalReferenceDialogue(
    speaker: Player,
    culturalElement: string,
    context: DialogueContext
  ): Promise<GeneratedDialogue> {
    const request: DialogueRequest = {
      id: `cultural_${culturalElement}_${Date.now()}`,
      speaker,
      context,
      dialogueType: 'cultural_reference',
      customPrompt: `引用${culturalElement}相关的文化典故`
    };
    
    return this.generateDialogue(request);
  }
  
  public async generateReactiveDialogue(
    speaker: Player,
    triggerEvent: string,
    context: DialogueContext,
    targetPlayer?: Player
  ): Promise<GeneratedDialogue> {
    const reactionType = this.determineReactionType(triggerEvent, speaker, targetPlayer);
    
    const request: DialogueRequest = {
      id: `reaction_${triggerEvent}_${Date.now()}`,
      speaker,
      context: {
        ...context,
        recentEvents: [triggerEvent, ...context.recentEvents]
      },
      dialogueType: reactionType,
      targetPlayer,
      mood: this.determineReactionMood(triggerEvent, speaker)
    };
    
    return this.generateDialogue(request);
  }
  
  private async generateWithLLM(request: DialogueRequest): Promise<GeneratedDialogue> {
    const prompt = this.buildDialoguePrompt(request);
    const systemMessage = this.buildSystemMessage(request.speaker, request.dialogueType);
    
    const response = await this.callLLMForDialogue(prompt, systemMessage);
    return this.parseDialogueResponse(response, request);
  }
  
  private buildDialoguePrompt(request: DialogueRequest): string {
    const speaker = request.speaker;
    const zodiacPersonality = this.zodiacPersonalities.get(speaker.zodiac);
    const context = request.context;
    
    return `
说话人：${speaker.name}（${speaker.zodiac}）
对话类型：${request.dialogueType}
${request.targetPlayer ? `对话对象：${request.targetPlayer.name}（${request.targetPlayer.zodiac}）` : ''}
当前心情：${request.mood || 'neutral'}

生肖性格特点：
- 说话风格：${zodiacPersonality?.speechPattern || '自然随和'}
- 性格特征：${zodiacPersonality?.traits.join('、') || '聪明善良'}
- 文化背景：${zodiacPersonality?.culturalBackground || '传统文化熏陶'}

游戏情况：
- 当前阶段：${context.gamePhase}
- 游戏场景：${context.situation}
- 最近事件：${context.recentEvents.join('、') || '无特殊事件'}
- 领先玩家：${context.gameStatus.leadingPlayer}
- 游戏氛围：${this.describeGameAtmosphere(context.gameStatus)}

${request.customPrompt ? `特殊要求：${request.customPrompt}` : ''}

请生成符合角色特点的对话内容（1-2句话），要求：
1. 体现${speaker.zodiac}的性格特征和说话风格
2. 符合${request.dialogueType}的对话类型
3. 考虑当前游戏情况和关系状态
4. 融入适当的中国传统文化元素
5. 语言自然生动，富有个性

请以JSON格式返回：
{
  "content": "对话内容",
  "emotion": "情绪状态",
  "tone": "语调风格",
  "culturalElements": ["文化元素1", "文化元素2"],
  "visualCues": [{"type": "表情类型", "description": "视觉描述", "intensity": 强度}]
}
`;
  }
  
  private buildSystemMessage(speaker: Player, dialogueType: DialogueType): string {
    const zodiacPersonality = this.zodiacPersonalities.get(speaker.zodiac);
    
    return `你是十二生肖大富翁游戏中的对话内容生成师，专门为${speaker.zodiac}生肖的角色创作对话。

角色特点：
- 生肖：${speaker.zodiac}
- 性格：${zodiacPersonality?.traits.join('、') || '独特个性'}
- 说话风格：${zodiacPersonality?.speechPattern || '自然表达'}

当前任务：生成${dialogueType}类型的对话内容

要求：
1. 严格按照${speaker.zodiac}的生肖特征说话
2. 体现中国传统文化底蕴
3. 语言生动有趣，符合游戏氛围
4. 对话长度适中（20-60字）
5. 情感表达真实自然

注意：
- 避免现代网络用语
- 多用传统文化典故和比喻
- 体现生肖的智慧和特点
- 保持角色的一致性`;
  }
  
  private async callLLMForDialogue(prompt: string, systemMessage: string): Promise<string> {
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
          max_tokens: 800,
          temperature: 0.9,
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
  
  private parseDialogueResponse(response: string, request: DialogueRequest): GeneratedDialogue {
    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      
      return {
        id: request.id,
        speakerId: request.speaker.id,
        content: parsed.content || '...',
        emotion: parsed.emotion || request.mood || 'contentment',
        tone: parsed.tone || 'casual',
        culturalElements: parsed.culturalElements || [],
        zodiacPersonality: request.speaker.zodiac,
        visualCues: parsed.visualCues || [
          {
            type: 'expression',
            description: '自然的表情',
            intensity: 0.5
          }
        ],
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('Failed to parse dialogue response:', error);
      return this.generateStructuredFallback(request, response);
    }
  }
  
  private generateFallbackDialogue(request: DialogueRequest): GeneratedDialogue {
    const templates = this.dialogueTemplates.get(request.dialogueType) || [];
    const template = templates.length > 0 
      ? templates[Math.floor(Math.random() * templates.length)]
      : this.getDefaultTemplate(request.dialogueType);
    
    const zodiacPersonality = this.zodiacPersonalities.get(request.speaker.zodiac);
    
    return {
      id: request.id,
      speakerId: request.speaker.id,
      content: this.customizeTemplate(template.content, request.speaker, request.targetPlayer),
      emotion: request.mood || template.defaultEmotion,
      tone: zodiacPersonality?.preferredTone || template.defaultTone,
      culturalElements: zodiacPersonality?.culturalReferences || [],
      zodiacPersonality: request.speaker.zodiac,
      visualCues: [
        {
          type: 'expression',
          description: template.visualDescription,
          intensity: 0.6
        }
      ],
      timestamp: Date.now()
    };
  }
  
  private generateStructuredFallback(request: DialogueRequest, rawResponse: string): GeneratedDialogue {
    const zodiacPersonality = this.zodiacPersonalities.get(request.speaker.zodiac);
    
    return {
      id: request.id,
      speakerId: request.speaker.id,
      content: rawResponse.substring(0, 100) || `${request.speaker.zodiac}有话要说...`,
      emotion: request.mood || 'contentment',
      tone: zodiacPersonality?.preferredTone || 'casual',
      culturalElements: zodiacPersonality?.culturalReferences || [],
      zodiacPersonality: request.speaker.zodiac,
      visualCues: [
        {
          type: 'expression',
          description: '若有所思的表情',
          intensity: 0.5
        }
      ],
      timestamp: Date.now()
    };
  }
  
  private initializeZodiacPersonalities(): void {
    const personalities: Record<string, ZodiacPersonality> = {
      '鼠': {
        traits: ['机智', '灵活', '精明'],
        speechPattern: '言辞巧妙，善用比喻',
        culturalBackground: '商贾文化，重视实利',
        culturalReferences: ['积少成多', '未雨绸缪'],
        preferredTone: 'casual',
        emotionalRange: ['mischief', 'confidence', 'anxiety']
      },
      '牛': {
        traits: ['稳重', '诚实', '勤劳'],
        speechPattern: '言简意赅，朴实无华',
        culturalBackground: '农耕文化，崇尚勤劳',
        culturalReferences: ['春华秋实', '勤能补拙'],
        preferredTone: 'serious',
        emotionalRange: ['contentment', 'determination', 'contemplation']
      },
      '虎': {
        traits: ['勇猛', '威严', '正直'],
        speechPattern: '声音洪亮，气势磅礴',
        culturalBackground: '武将文化，重视正义',
        culturalReferences: ['虎啸山林', '义薄云天'],
        preferredTone: 'formal',
        emotionalRange: ['confidence', 'anger', 'excitement']
      },
      '兔': {
        traits: ['温和', '细心', '优雅'],
        speechPattern: '轻声细语，措辞优美',
        culturalBackground: '文人雅士，重视礼仪',
        culturalReferences: ['月宫嫦娥', '兰心蕙质'],
        preferredTone: 'poetic',
        emotionalRange: ['joy', 'anxiety', 'contemplation']
      },
      '龙': {
        traits: ['威严', '智慧', '神秘'],
        speechPattern: '言辞华丽，富含哲理',
        culturalBackground: '皇家文化，至高无上',
        culturalReferences: ['龙腾九天', '帝王之相'],
        preferredTone: 'mystical',
        emotionalRange: ['confidence', 'contemplation', 'determination']
      },
      '蛇': {
        traits: ['智慧', '神秘', '冷静'],
        speechPattern: '话语深沉，富含暗示',
        culturalBackground: '道家文化，追求变化',
        culturalReferences: ['蛇化为龙', '深藏不露'],
        preferredTone: 'mystical',
        emotionalRange: ['contemplation', 'confidence', 'mischief']
      },
      '马': {
        traits: ['奔放', '自由', '忠诚'],
        speechPattern: '语速较快，充满激情',
        culturalBackground: '游牧文化，崇尚自由',
        culturalReferences: ['千里马遇伯乐', '马到成功'],
        preferredTone: 'playful',
        emotionalRange: ['excitement', 'joy', 'determination']
      },
      '羊': {
        traits: ['温柔', '善良', '艺术'],
        speechPattern: '语调温和，富有诗意',
        culturalBackground: '文艺复兴，重视美感',
        culturalReferences: ['羊质虎皮', '温文尔雅'],
        preferredTone: 'poetic',
        emotionalRange: ['contentment', 'joy', 'contemplation']
      },
      '猴': {
        traits: ['聪明', '活泼', '多变'],
        speechPattern: '语言机智，善于调侃',
        culturalBackground: '民间文化，机智幽默',
        culturalReferences: ['七十二变', '火眼金睛'],
        preferredTone: 'humorous',
        emotionalRange: ['mischief', 'joy', 'excitement']
      },
      '鸡': {
        traits: ['勤奋', '准时', '直率'],
        speechPattern: '言辞直接，条理分明',
        culturalBackground: '农家文化，重视秩序',
        culturalReferences: ['闻鸡起舞', '金鸡报晓'],
        preferredTone: 'serious',
        emotionalRange: ['confidence', 'determination', 'contentment']
      },
      '狗': {
        traits: ['忠诚', '正义', '守护'],
        speechPattern: '言词忠诚，充满正义感',
        culturalBackground: '忠义文化，保家卫国',
        culturalReferences: ['忠犬护主', '义犬救主'],
        preferredTone: 'serious',
        emotionalRange: ['determination', 'contentment', 'anger']
      },
      '猪': {
        traits: ['善良', '乐观', '憨厚'],
        speechPattern: '语言朴实，充满善意',
        culturalBackground: '农家文化，知足常乐',
        culturalReferences: ['猪年大吉', '憨厚老实'],
        preferredTone: 'casual',
        emotionalRange: ['joy', 'contentment', 'contentment']
      }
    };
    
    Object.entries(personalities).forEach(([zodiac, personality]) => {
      this.zodiacPersonalities.set(zodiac, personality);
    });
  }
  
  private initializeDialogueTemplates(): void {
    const templates: Record<DialogueType, DialogueTemplate[]> = {
      'greeting': [
        {
          content: '道友，今日风和日丽，正是博弈的好时机啊！',
          defaultEmotion: 'joy',
          defaultTone: 'casual',
          visualDescription: '友善的笑容'
        }
      ],
      'taunt': [
        {
          content: '看来{target}今日运势不佳，不如早些认输如何？',
          defaultEmotion: 'mischief',
          defaultTone: 'playful',
          visualDescription: '挑衅的眼神'
        }
      ],
      'wisdom_sharing': [
        {
          content: '古人云，知己知彼百战不殆，此乃制胜之道也。',
          defaultEmotion: 'contemplation',
          defaultTone: 'wise',
          visualDescription: '深思熟虑的表情'
        }
      ]
    };
    
    Object.entries(templates).forEach(([type, templateList]) => {
      this.dialogueTemplates.set(type as DialogueType, templateList);
    });
  }
  
  private generateCacheKey(request: DialogueRequest): string {
    const keyData = {
      speaker: request.speaker.zodiac,
      type: request.dialogueType,
      situation: request.context.situation.substring(0, 50),
      mood: request.mood,
      target: request.targetPlayer?.zodiac
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 32);
  }
  
  private selectAppropriateDialogueType(context: DialogueContext, turnIndex: number): DialogueType {
    const types: DialogueType[] = ['greeting', 'compliment', 'competitive_banter', 'wisdom_sharing'];
    
    if (turnIndex === 0) return 'greeting';
    if (context.gameStatus.tension > 0.7) return 'taunt';
    if (context.gameStatus.cooperationLevel > 0.7) return 'alliance_proposal';
    
    return types[Math.floor(Math.random() * types.length)];
  }
  
  private determineEmotionalState(context: DialogueContext, speaker: Player): EmotionalState {
    const personality = this.zodiacPersonalities.get(speaker.zodiac);
    const emotionalRange = personality?.emotionalRange || ['contentment'];
    
    return emotionalRange[Math.floor(Math.random() * emotionalRange.length)];
  }
  
  private updateContextWithDialogue(context: DialogueContext, dialogue: GeneratedDialogue): DialogueContext {
    return {
      ...context,
      recentEvents: [dialogue.content, ...context.recentEvents.slice(0, 4)]
    };
  }
  
  private determineReactionType(
    triggerEvent: string,
    speaker: Player,
    targetPlayer?: Player
  ): DialogueType {
    if (triggerEvent.includes('purchase')) return 'celebration';
    if (triggerEvent.includes('attack') || triggerEvent.includes('skill')) return 'threat';
    if (triggerEvent.includes('trade')) return 'trade_negotiation';
    if (triggerEvent.includes('blessing')) return 'celebration';
    
    return 'competitive_banter';
  }
  
  private determineReactionMood(triggerEvent: string, speaker: Player): EmotionalState {
    const personality = this.zodiacPersonalities.get(speaker.zodiac);
    
    if (triggerEvent.includes('success') || triggerEvent.includes('blessing')) {
      return 'joy';
    }
    if (triggerEvent.includes('attack') || triggerEvent.includes('loss')) {
      return personality?.emotionalRange.includes('anger') ? 'anger' : 'determination';
    }
    
    return 'contentment';
  }
  
  private describeGameAtmosphere(gameStatus: GameStatus): string {
    if (gameStatus.tension > 0.8) return '剑拔弩张，竞争激烈';
    if (gameStatus.cooperationLevel > 0.8) return '和谐友好，合作共赢';
    if (gameStatus.competitiveness > 0.8) return '暗潮汹涌，各显神通';
    
    return '风平浪静，其乐融融';
  }
  
  private getDefaultTemplate(dialogueType: DialogueType): DialogueTemplate {
    return {
      content: '此时无声胜有声...',
      defaultEmotion: 'contemplation',
      defaultTone: 'casual',
      visualDescription: '若有所思'
    };
  }
  
  private customizeTemplate(
    template: string,
    speaker: Player,
    target?: Player
  ): string {
    let result = template.replace('{speaker}', speaker.name);
    if (target) {
      result = result.replace('{target}', target.name);
    }
    return result;
  }
  
  public clearCache(): void {
    this.dialogueCache.clear();
    this.emit('cache_cleared');
  }
}

interface ZodiacPersonality {
  traits: string[];
  speechPattern: string;
  culturalBackground: string;
  culturalReferences: string[];
  preferredTone: DialogueTone;
  emotionalRange: EmotionalState[];
}

interface DialogueTemplate {
  content: string;
  defaultEmotion: EmotionalState;
  defaultTone: DialogueTone;
  visualDescription: string;
}

export const createDialogueContentGenerator = (llmService?: LLMService): DialogueContentGenerator => {
  return new DialogueContentGenerator(llmService);
};

export default DialogueContentGenerator;