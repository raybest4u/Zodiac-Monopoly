import { EventEmitter } from '../utils/EventEmitter';
import { LLMService } from '../ai/LLMService';
import { IntelligentEventContentGenerator, GeneratedEventContent, EventContext } from './EventContentGenerator';
import { EventRarity, GameEventType } from './EventTypeDefinitions';
import { Player } from '../types/game';

export interface ZodiacTheme {
  name: string;
  element: '金' | '木' | '水' | '火' | '土';
  personality: string[];
  strengths: string[];
  weaknesses: string[];
  luckyColors: string[];
  luckyNumbers: number[];
  seasonalAffinity: string[];
  mythologicalOrigin: string;
  culturalSignificance: string;
}

export interface ZodiacEventTemplate {
  zodiac: string;
  eventCategory: 'blessing' | 'challenge' | 'transformation' | 'wisdom' | 'harmony';
  title: string;
  baseDescription: string;
  rarity: EventRarity;
  effects: ZodiacEffect[];
  triggerConditions: string[];
  culturalContext: string;
}

export interface ZodiacEffect {
  type: 'economic' | 'social' | 'strategic' | 'mystical';
  description: string;
  magnitude: number;
  duration: number;
  scope: 'self' | 'target' | 'all' | 'zodiac_group';
}

export interface SeasonalZodiacEvent {
  season: string;
  compatibleZodiacs: string[];
  eventType: string;
  powerLevel: number;
  description: string;
  mythicalConnection: string;
}

export class ZodiacContentFactory extends EventEmitter {
  private llmService: LLMService;
  private contentGenerator: IntelligentEventContentGenerator;
  private zodiacThemes: Map<string, ZodiacTheme>;
  private eventTemplates: Map<string, ZodiacEventTemplate[]>;
  private seasonalEvents: Map<string, SeasonalZodiacEvent[]>;
  
  constructor(llmService?: LLMService) {
    super();
    this.llmService = llmService || new LLMService();
    this.contentGenerator = new IntelligentEventContentGenerator(this.llmService);
    this.zodiacThemes = new Map();
    this.eventTemplates = new Map();
    this.seasonalEvents = new Map();
    
    this.initializeZodiacThemes();
    this.initializeEventTemplates();
    this.initializeSeasonalEvents();
  }
  
  public async generateZodiacBlessingContent(
    zodiac: string,
    player: Player,
    context: EventContext,
    blessingType: 'fortune' | 'wisdom' | 'strength' | 'harmony' | 'transformation'
  ): Promise<GeneratedEventContent> {
    const zodiacTheme = this.zodiacThemes.get(zodiac);
    if (!zodiacTheme) {
      throw new Error(`Unknown zodiac: ${zodiac}`);
    }
    
    const prompt = this.buildZodiacBlessingPrompt(zodiac, zodiacTheme, blessingType, player, context);
    
    try {
      const response = await this.callLLMForZodiacContent(prompt, zodiac, blessingType);
      return this.parseZodiacBlessingResponse(response, zodiac, player, blessingType);
    } catch (error) {
      console.warn('LLM zodiac blessing generation failed:', error);
      return this.generateFallbackZodiacBlessing(zodiac, player, blessingType);
    }
  }
  
  public async generateZodiacCurseContent(
    zodiac: string,
    player: Player,
    context: EventContext,
    curseType: 'misfortune' | 'confusion' | 'weakness' | 'isolation' | 'stagnation'
  ): Promise<GeneratedEventContent> {
    const zodiacTheme = this.zodiacThemes.get(zodiac);
    if (!zodiacTheme) {
      throw new Error(`Unknown zodiac: ${zodiac}`);
    }
    
    const prompt = this.buildZodiacCursePrompt(zodiac, zodiacTheme, curseType, player, context);
    
    try {
      const response = await this.callLLMForZodiacContent(prompt, zodiac, curseType);
      return this.parseZodiacCurseResponse(response, zodiac, player, curseType);
    } catch (error) {
      console.warn('LLM zodiac curse generation failed:', error);
      return this.generateFallbackZodiacCurse(zodiac, player, curseType);
    }
  }
  
  public async generateZodiacEncounterContent(
    zodiac1: string,
    zodiac2: string,
    players: Player[],
    context: EventContext,
    encounterType: 'harmony' | 'conflict' | 'cooperation' | 'competition' | 'romance'
  ): Promise<GeneratedEventContent> {
    const compatibility = this.calculateZodiacCompatibility(zodiac1, zodiac2);
    const prompt = this.buildZodiacEncounterPrompt(zodiac1, zodiac2, encounterType, compatibility, players, context);
    
    try {
      const response = await this.callLLMForZodiacContent(prompt, `${zodiac1}_${zodiac2}`, encounterType);
      return this.parseZodiacEncounterResponse(response, zodiac1, zodiac2, players, encounterType);
    } catch (error) {
      console.warn('LLM zodiac encounter generation failed:', error);
      return this.generateFallbackZodiacEncounter(zodiac1, zodiac2, players, encounterType);
    }
  }
  
  public async generateSeasonalZodiacEvent(
    season: string,
    dominantZodiac: string,
    affectedPlayers: Player[],
    context: EventContext
  ): Promise<GeneratedEventContent> {
    const seasonalEvents = this.seasonalEvents.get(season) || [];
    const compatibleEvents = seasonalEvents.filter(event => 
      event.compatibleZodiacs.includes(dominantZodiac)
    );
    
    const selectedEvent = compatibleEvents.length > 0 
      ? compatibleEvents[Math.floor(Math.random() * compatibleEvents.length)]
      : seasonalEvents[0];
    
    if (!selectedEvent) {
      return this.generateGenericSeasonalEvent(season, dominantZodiac, affectedPlayers, context);
    }
    
    const prompt = this.buildSeasonalEventPrompt(season, dominantZodiac, selectedEvent, affectedPlayers, context);
    
    try {
      const response = await this.callLLMForZodiacContent(prompt, `seasonal_${season}`, selectedEvent.eventType);
      return this.parseSeasonalEventResponse(response, season, dominantZodiac, affectedPlayers, selectedEvent);
    } catch (error) {
      console.warn('LLM seasonal event generation failed:', error);
      return this.generateFallbackSeasonalEvent(season, dominantZodiac, affectedPlayers, selectedEvent);
    }
  }
  
  public async generateZodiacWisdomContent(
    zodiac: string,
    situation: string,
    player: Player,
    context: EventContext
  ): Promise<GeneratedEventContent> {
    const zodiacTheme = this.zodiacThemes.get(zodiac);
    if (!zodiacTheme) {
      throw new Error(`Unknown zodiac: ${zodiac}`);
    }
    
    const prompt = this.buildZodiacWisdomPrompt(zodiac, zodiacTheme, situation, player, context);
    
    try {
      const response = await this.callLLMForZodiacContent(prompt, zodiac, 'wisdom');
      return this.parseZodiacWisdomResponse(response, zodiac, player, situation);
    } catch (error) {
      console.warn('LLM zodiac wisdom generation failed:', error);
      return this.generateFallbackZodiacWisdom(zodiac, player, situation);
    }
  }
  
  public generateZodiacElementalEvent(
    element: '金' | '木' | '水' | '火' | '土',
    affectedZodiacs: string[],
    players: Player[],
    context: EventContext
  ): Promise<GeneratedEventContent> {
    const elementalPrompt = this.buildElementalEventPrompt(element, affectedZodiacs, players, context);
    return this.generateElementalContent(elementalPrompt, element, affectedZodiacs, players);
  }
  
  private async generateElementalContent(
    prompt: string,
    element: string,
    zodiacs: string[],
    players: Player[]
  ): Promise<GeneratedEventContent> {
    try {
      const response = await this.callLLMForZodiacContent(prompt, `elemental_${element}`, 'elemental');
      return this.parseElementalResponse(response, element, zodiacs, players);
    } catch (error) {
      return this.generateFallbackElementalEvent(element, zodiacs, players);
    }
  }
  
  private initializeZodiacThemes(): void {
    const zodiacs: ZodiacTheme[] = [
      {
        name: '鼠',
        element: '水',
        personality: ['机智', '灵活', '适应性强'],
        strengths: ['聪明', '勤劳', '节俭'],
        weaknesses: ['多疑', '胆小', '短视'],
        luckyColors: ['蓝', '金', '绿'],
        luckyNumbers: [2, 3],
        seasonalAffinity: ['冬', '春'],
        mythologicalOrigin: '十二生肖之首，机智过人的引路者',
        culturalSignificance: '象征智慧与财富，新的开始'
      },
      {
        name: '牛',
        element: '土',
        personality: ['稳重', '可靠', '踏实'],
        strengths: ['勤劳', '诚实', '耐心'],
        weaknesses: ['固执', '保守', '缺乏变通'],
        luckyColors: ['黄', '橙', '红'],
        luckyNumbers: [1, 4],
        seasonalAffinity: ['春', '夏'],
        mythologicalOrigin: '大地的守护者，农业的象征',
        culturalSignificance: '代表勤奋与丰收，稳定的力量'
      },
      {
        name: '虎',
        element: '木',
        personality: ['勇敢', '独立', '领导力强'],
        strengths: ['威武', '正义', '保护欲'],
        weaknesses: ['冲动', '傲慢', '孤僻'],
        luckyColors: ['橙', '红', '金'],
        luckyNumbers: [1, 3, 4],
        seasonalAffinity: ['春', '夏'],
        mythologicalOrigin: '森林之王，正义的化身',
        culturalSignificance: '象征权威与勇气，驱邪避凶'
      },
      {
        name: '兔',
        element: '木',
        personality: ['温和', '善良', '谨慎'],
        strengths: ['文雅', '仁慈', '敏感'],
        weaknesses: ['胆小', '犹豫', '过分谨慎'],
        luckyColors: ['粉', '红', '紫', '蓝'],
        luckyNumbers: [3, 4, 6],
        seasonalAffinity: ['春', '秋'],
        mythologicalOrigin: '月宫嫦娥的伴侣，长寿的象征',
        culturalSignificance: '代表和平与美好，月亮的守护者'
      },
      {
        name: '龙',
        element: '土',
        personality: ['威严', '智慧', '神秘'],
        strengths: ['权威', '创造力', '领导才能'],
        weaknesses: ['傲慢', '专断', '缺乏耐心'],
        luckyColors: ['金', '银', '白'],
        luckyNumbers: [1, 6, 7],
        seasonalAffinity: ['春', '夏', '秋', '冬'],
        mythologicalOrigin: '天子的象征，呼风唤雨的神灵',
        culturalSignificance: '代表皇权与威严，中华民族的图腾'
      },
      {
        name: '蛇',
        element: '火',
        personality: ['智慧', '神秘', '优雅'],
        strengths: ['直觉', '洞察力', '魅力'],
        weaknesses: ['冷漠', '多疑', '记仇'],
        luckyColors: ['黑', '红', '黄'],
        luckyNumbers: [2, 8, 9],
        seasonalAffinity: ['夏', '秋'],
        mythologicalOrigin: '古老智慧的化身，变化之神',
        culturalSignificance: '象征智慧与重生，医药之神'
      },
      {
        name: '马',
        element: '火',
        personality: ['自由', '热情', '活力'],
        strengths: ['奔放', '忠诚', '勇敢'],
        weaknesses: ['急躁', '善变', '缺乏耐心'],
        luckyColors: ['棕', '黄', '红'],
        luckyNumbers: [2, 3, 7],
        seasonalAffinity: ['夏', '秋'],
        mythologicalOrigin: '战场的伙伴，速度与自由的象征',
        culturalSignificance: '代表忠诚与奔放，成功的坐骑'
      },
      {
        name: '羊',
        element: '土',
        personality: ['温柔', '善良', '艺术气质'],
        strengths: ['仁慈', '创造力', '同情心'],
        weaknesses: ['优柔寡断', '依赖性强', '消极'],
        luckyColors: ['绿', '红', '紫'],
        luckyNumbers: [3, 9, 4],
        seasonalAffinity: ['夏', '秋'],
        mythologicalOrigin: '祥瑞的象征，和谐的使者',
        culturalSignificance: '代表和善与美好，吉祥如意'
      },
      {
        name: '猴',
        element: '金',
        personality: ['聪明', '活泼', '好奇'],
        strengths: ['机智', '灵活', '学习能力强'],
        weaknesses: ['浮躁', '狡猾', '不够专一'],
        luckyColors: ['白', '金', '蓝'],
        luckyNumbers: [1, 7, 8],
        seasonalAffinity: ['秋', '冬'],
        mythologicalOrigin: '齐天大圣的原型，72变的神通',
        culturalSignificance: '象征智慧与机敏，变化无穷'
      },
      {
        name: '鸡',
        element: '金',
        personality: ['勤奋', '守时', '自信'],
        strengths: ['负责', '勇敢', '坦率'],
        weaknesses: ['挑剔', '傲慢', '过分直接'],
        luckyColors: ['金', '棕', '橙'],
        luckyNumbers: [5, 7, 8],
        seasonalAffinity: ['秋', '冬'],
        mythologicalOrigin: '报时的使者，光明的先锋',
        culturalSignificance: '代表勤劳与光明，准时的守护者'
      },
      {
        name: '狗',
        element: '土',
        personality: ['忠诚', '诚实', '可靠'],
        strengths: ['正义', '保护欲', '责任心'],
        weaknesses: ['多疑', '悲观', '固执'],
        luckyColors: ['红', '绿', '紫'],
        luckyNumbers: [3, 4, 9],
        seasonalAffinity: ['秋', '冬'],
        mythologicalOrigin: '忠诚的守护者，正义的化身',
        culturalSignificance: '象征忠诚与保护，家庭的守护神'
      },
      {
        name: '猪',
        element: '水',
        personality: ['诚实', '慷慨', '乐观'],
        strengths: ['善良', '宽容', '勤劳'],
        weaknesses: ['天真', '懒惰', '缺乏判断力'],
        luckyColors: ['黄', '灰', '棕', '金'],
        luckyNumbers: [2, 5, 8],
        seasonalAffinity: ['冬', '春'],
        mythologicalOrigin: '丰收的象征，财富的使者',
        culturalSignificance: '代表富足与善良，福气的象征'
      }
    ];
    
    zodiacs.forEach(zodiac => {
      this.zodiacThemes.set(zodiac.name, zodiac);
    });
  }
  
  private initializeEventTemplates(): void {
    const templates: Record<string, ZodiacEventTemplate[]> = {
      '龙': [
        {
          zodiac: '龙',
          eventCategory: 'blessing',
          title: '龙王赐福',
          baseDescription: '天空中出现祥云，龙王降下祝福',
          rarity: EventRarity.RARE,
          effects: [
            {
              type: 'economic',
              description: '金钱增加',
              magnitude: 0.8,
              duration: 3,
              scope: 'self'
            }
          ],
          triggerConditions: ['turn_start', 'season_spring'],
          culturalContext: '龙在中国文化中代表至高无上的权力和好运'
        }
      ],
      '凤': [
        {
          zodiac: '凤',
          eventCategory: 'harmony',
          title: '凤凰于飞',
          baseDescription: '凤凰翩翩起舞，带来和谐之力',
          rarity: EventRarity.EPIC,
          effects: [
            {
              type: 'social',
              description: '所有玩家关系改善',
              magnitude: 0.6,
              duration: 5,
              scope: 'all'
            }
          ],
          triggerConditions: ['multiple_players_present'],
          culturalContext: '凤凰象征和谐美好，是吉祥的象征'
        }
      ]
    };
    
    Object.entries(templates).forEach(([zodiac, eventList]) => {
      this.eventTemplates.set(zodiac, eventList);
    });
  }
  
  private initializeSeasonalEvents(): void {
    const seasonalEventData: Record<string, SeasonalZodiacEvent[]> = {
      'spring': [
        {
          season: 'spring',
          compatibleZodiacs: ['虎', '兔', '龙'],
          eventType: '春回大地',
          powerLevel: 0.8,
          description: '万物复苏，生机勃勃',
          mythicalConnection: '东方青龙主春，木气旺盛'
        }
      ],
      'summer': [
        {
          season: 'summer',
          compatibleZodiacs: ['蛇', '马', '羊'],
          eventType: '夏日炎炎',
          powerLevel: 1.0,
          description: '烈日当空，火气冲天',
          mythicalConnection: '南方朱雀主夏，火气极盛'
        }
      ],
      'autumn': [
        {
          season: 'autumn',
          compatibleZodiacs: ['猴', '鸡', '狗'],
          eventType: '金秋送爽',
          powerLevel: 0.9,
          description: '秋高气爽，收获满满',
          mythicalConnection: '西方白虎主秋，金气凌厉'
        }
      ],
      'winter': [
        {
          season: 'winter',
          compatibleZodiacs: ['猪', '鼠', '牛'],
          eventType: '冬日藏锋',
          powerLevel: 0.7,
          description: '天寒地冻，蓄势待发',
          mythicalConnection: '北方玄武主冬，水气深沉'
        }
      ]
    };
    
    Object.entries(seasonalEventData).forEach(([season, events]) => {
      this.seasonalEvents.set(season, events);
    });
  }
  
  private buildZodiacBlessingPrompt(
    zodiac: string,
    theme: ZodiacTheme,
    blessingType: string,
    player: Player,
    context: EventContext
  ): string {
    return `
请为${zodiac}生肖创建一个${blessingType}类型的祝福事件内容：

生肖特征：
- 元素：${theme.element}
- 性格：${theme.personality.join('、')}
- 优点：${theme.strengths.join('、')}
- 幸运色：${theme.luckyColors.join('、')}
- 文化意义：${theme.culturalSignificance}

玩家信息：
- 姓名：${player.name}
- 当前位置：第${player.position}格
- 金钱：${player.money}

游戏背景：
- 季节：${context.season}
- 回合：${context.currentTurn}
- 游戏阶段：${context.gamePhase}

请生成包含以下内容的JSON格式回应：
- title: 事件标题（体现${zodiac}特色）
- description: 详细描述（100-150字）
- narrativeText: 生动的叙述（150-200字）
- flavorText: 风味文本（30-50字）
- characterDialogue: 角色对话（${zodiac}守护神的话语）
- visualCues: 视觉效果描述
- soundEffects: 音效建议
- culturalElements: 文化元素说明

要求：
1. 深度融入${zodiac}的文化内涵
2. 体现${blessingType}祝福的积极影响
3. 语言优美，富有诗意
4. 符合中国传统文化氛围
`;
  }
  
  private buildZodiacCursePrompt(
    zodiac: string,
    theme: ZodiacTheme,
    curseType: string,
    player: Player,
    context: EventContext
  ): string {
    return `
请为${zodiac}生肖创建一个${curseType}类型的挑战事件内容：

生肖特征：
- 弱点：${theme.weaknesses.join('、')}
- 需要克服的特质：${theme.personality.join('、')}

这不是一个负面诅咒，而是一个成长机会，让玩家学会克服${zodiac}的天性弱点。

请生成温和的挑战内容，最终帮助玩家成长。

要求：
1. 挑战应该是积极的成长机会
2. 体现${zodiac}需要学习的品质
3. 最终结果是正面的
4. 富有教育意义和文化内涵
`;
  }
  
  private buildZodiacEncounterPrompt(
    zodiac1: string,
    zodiac2: string,
    encounterType: string,
    compatibility: number,
    players: Player[],
    context: EventContext
  ): string {
    return `
请创建${zodiac1}和${zodiac2}之间的${encounterType}互动事件：

生肖配对：${zodiac1} 与 ${zodiac2}
兼容度：${(compatibility * 100).toFixed(1)}%
互动类型：${encounterType}

涉及玩家：
${players.map(p => `- ${p.name}（${p.zodiac}）`).join('\n')}

请生成体现两个生肖特色和互动关系的精彩内容。

要求：
1. 突出两个生肖的特点对比
2. 体现${encounterType}的互动性质
3. 创造有趣的戏剧冲突或和谐
4. 包含传统文化智慧
`;
  }
  
  private buildSeasonalEventPrompt(
    season: string,
    zodiac: string,
    seasonalEvent: SeasonalZodiacEvent,
    players: Player[],
    context: EventContext
  ): string {
    return `
请创建${season}季节的${zodiac}生肖特色事件：

季节特征：${seasonalEvent.description}
神话背景：${seasonalEvent.mythicalConnection}
能量等级：${seasonalEvent.powerLevel}

受影响玩家：
${players.map(p => `- ${p.name}（${p.zodiac}）`).join('\n')}

请生成富有季节特色和生肖文化的内容。

要求：
1. 突出${season}季节的自然特征
2. 体现${zodiac}在此季节的特殊意义
3. 融入中国传统节气文化
4. 创造诗意的描述
`;
  }
  
  private buildZodiacWisdomPrompt(
    zodiac: string,
    theme: ZodiacTheme,
    situation: string,
    player: Player,
    context: EventContext
  ): string {
    return `
请为${zodiac}生肖创建一个智慧启示事件：

当前情况：${situation}
生肖智慧：${theme.culturalSignificance}

玩家：${player.name}（${zodiac}）

请生成一个包含传统智慧和人生哲理的内容：

要求：
1. 体现${zodiac}的独特智慧
2. 针对当前情况给出启发
3. 包含中国传统文化典故
4. 语言富有哲理性
5. 给玩家带来思考和成长
`;
  }
  
  private buildElementalEventPrompt(
    element: string,
    zodiacs: string[],
    players: Player[],
    context: EventContext
  ): string {
    return `
请创建一个${element}元素的生肖群体事件：

相关生肖：${zodiacs.join('、')}
涉及玩家：${players.map(p => p.name).join('、')}

五行理论中${element}的特征：
- 金：收敛、坚固、肃杀
- 木：生长、舒展、条达
- 水：滋润、向下、寒冷
- 火：温热、向上、光明
- 土：载物、化生、包容

请生成体现${element}元素特性和相关生肖群体力量的事件内容。

要求：
1. 深入阐释五行文化
2. 展现元素的自然力量
3. 体现生肖群体的协同效应
4. 富有神秘色彩
`;
  }
  
  private async callLLMForZodiacContent(
    prompt: string,
    zodiacContext: string,
    eventType: string
  ): Promise<string> {
    const systemMessage = `你是一位精通中国传统文化的游戏内容创作大师，特别擅长十二生肖文化和五行理论。
    
你的任务是创作具有深厚文化底蕴的游戏事件内容，要求：
1. 准确体现生肖文化特征
2. 融入传统文化元素
3. 语言优美，富有诗意
4. 内容积极正面，具有教育意义
5. 适合游戏娱乐氛围

当前创作上下文：${zodiacContext}
事件类型：${eventType}`;
    
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
  
  private parseZodiacBlessingResponse(
    response: string,
    zodiac: string,
    player: Player,
    blessingType: string
  ): GeneratedEventContent {
    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return this.createZodiacEventContent(parsed, zodiac, player, `blessing_${blessingType}`);
    } catch (error) {
      return this.generateFallbackZodiacBlessing(zodiac, player, blessingType);
    }
  }
  
  private parseZodiacCurseResponse(
    response: string,
    zodiac: string,
    player: Player,
    curseType: string
  ): GeneratedEventContent {
    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return this.createZodiacEventContent(parsed, zodiac, player, `challenge_${curseType}`);
    } catch (error) {
      return this.generateFallbackZodiacCurse(zodiac, player, curseType);
    }
  }
  
  private parseZodiacEncounterResponse(
    response: string,
    zodiac1: string,
    zodiac2: string,
    players: Player[],
    encounterType: string
  ): GeneratedEventContent {
    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return this.createZodiacEventContent(parsed, `${zodiac1}_${zodiac2}`, players[0], `encounter_${encounterType}`);
    } catch (error) {
      return this.generateFallbackZodiacEncounter(zodiac1, zodiac2, players, encounterType);
    }
  }
  
  private parseSeasonalEventResponse(
    response: string,
    season: string,
    zodiac: string,
    players: Player[],
    seasonalEvent: SeasonalZodiacEvent
  ): GeneratedEventContent {
    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return this.createZodiacEventContent(parsed, zodiac, players[0], `seasonal_${season}`);
    } catch (error) {
      return this.generateFallbackSeasonalEvent(season, zodiac, players, seasonalEvent);
    }
  }
  
  private parseZodiacWisdomResponse(
    response: string,
    zodiac: string,
    player: Player,
    situation: string
  ): GeneratedEventContent {
    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return this.createZodiacEventContent(parsed, zodiac, player, `wisdom_${situation}`);
    } catch (error) {
      return this.generateFallbackZodiacWisdom(zodiac, player, situation);
    }
  }
  
  private parseElementalResponse(
    response: string,
    element: string,
    zodiacs: string[],
    players: Player[]
  ): GeneratedEventContent {
    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanResponse);
      return this.createZodiacEventContent(parsed, element, players[0], `elemental_${element}`);
    } catch (error) {
      return this.generateFallbackElementalEvent(element, zodiacs, players);
    }
  }
  
  private createZodiacEventContent(
    parsed: any,
    zodiacContext: string,
    player: Player,
    eventId: string
  ): GeneratedEventContent {
    return {
      id: eventId,
      title: parsed.title || `${zodiacContext}的神秘事件`,
      description: parsed.description || '一个充满神秘色彩的生肖事件正在发生',
      narrativeText: parsed.narrativeText || '古老的生肖力量开始觉醒...',
      flavorText: parsed.flavorText || '天地之间，灵气流转',
      characterDialogue: parsed.characterDialogue ? [parsed.characterDialogue] : [],
      visualCues: parsed.visualCues || [
        {
          type: 'lighting',
          description: '神秘的生肖光环',
          duration: 3000,
          intensity: 0.8
        }
      ],
      soundEffects: parsed.soundEffects || ['zodiac_mystical', 'ambient_traditional'],
      culturalElements: parsed.culturalElements || [
        {
          type: 'zodiac_symbolism',
          content: `体现${zodiacContext}的文化内涵`,
          significance: '连接古今的智慧桥梁'
        }
      ],
      timestamp: Date.now()
    };
  }
  
  private calculateZodiacCompatibility(zodiac1: string, zodiac2: string): number {
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      '鼠': { '牛': 0.9, '龙': 0.8, '猴': 0.9, '鸡': 0.6, '马': 0.3, '羊': 0.4 },
      '牛': { '鼠': 0.9, '蛇': 0.8, '鸡': 0.9, '虎': 0.3, '龙': 0.6, '羊': 0.4 },
      '虎': { '马': 0.9, '狗': 0.8, '猴': 0.3, '蛇': 0.4, '猪': 0.7 },
      '兔': { '羊': 0.9, '猪': 0.8, '狗': 0.7, '鸡': 0.3, '龙': 0.4 },
      '龙': { '鼠': 0.8, '猴': 0.9, '鸡': 0.8, '狗': 0.3, '兔': 0.4 },
      '蛇': { '牛': 0.8, '鸡': 0.9, '猴': 0.7, '虎': 0.4, '猪': 0.3 },
      '马': { '虎': 0.9, '狗': 0.8, '羊': 0.7, '鼠': 0.3, '牛': 0.4 },
      '羊': { '兔': 0.9, '猪': 0.8, '马': 0.7, '牛': 0.4, '狗': 0.3 },
      '猴': { '龙': 0.9, '鼠': 0.9, '蛇': 0.7, '虎': 0.3, '猪': 0.4 },
      '鸡': { '牛': 0.9, '蛇': 0.9, '龙': 0.8, '兔': 0.3, '狗': 0.4 },
      '狗': { '虎': 0.8, '马': 0.8, '兔': 0.7, '龙': 0.3, '鸡': 0.4 },
      '猪': { '兔': 0.8, '羊': 0.8, '虎': 0.7, '蛇': 0.3, '猴': 0.4 }
    };
    
    return compatibilityMatrix[zodiac1]?.[zodiac2] || 0.5;
  }
  
  // Fallback methods
  private generateFallbackZodiacBlessing(
    zodiac: string,
    player: Player,
    blessingType: string
  ): GeneratedEventContent {
    const theme = this.zodiacThemes.get(zodiac);
    return {
      id: `blessing_${zodiac}_${Date.now()}`,
      title: `${zodiac}之福`,
      description: `${zodiac}守护神降下${blessingType}祝福，为${player.name}带来好运`,
      narrativeText: `天空中出现${zodiac}的身影，祥瑞之光洒向大地，${theme?.culturalSignificance || '古老的智慧'}在此刻显现`,
      flavorText: `${zodiac}的力量与你同在`,
      characterDialogue: [],
      visualCues: [
        {
          type: 'animation',
          description: `${zodiac}守护神的光辉`,
          duration: 3000,
          intensity: 0.8
        }
      ],
      soundEffects: ['blessing_chime', 'zodiac_power'],
      culturalElements: [
        {
          type: 'zodiac_symbolism',
          content: theme?.culturalSignificance || `${zodiac}的传统象征意义`,
          significance: '生肖文化的传承'
        }
      ],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackZodiacCurse(
    zodiac: string,
    player: Player,
    curseType: string
  ): GeneratedEventContent {
    return {
      id: `challenge_${zodiac}_${Date.now()}`,
      title: `${zodiac}的考验`,
      description: `${zodiac}带来成长的挑战，帮助${player.name}克服弱点`,
      narrativeText: `古老的试炼开始了，这是${zodiac}给予的珍贵成长机会`,
      flavorText: '困难是成长的阶梯',
      characterDialogue: [],
      visualCues: [
        {
          type: 'animation',
          description: '挑战的光芒',
          duration: 2500,
          intensity: 0.6
        }
      ],
      soundEffects: ['challenge_bell', 'growth_theme'],
      culturalElements: [],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackZodiacEncounter(
    zodiac1: string,
    zodiac2: string,
    players: Player[],
    encounterType: string
  ): GeneratedEventContent {
    return {
      id: `encounter_${zodiac1}_${zodiac2}_${Date.now()}`,
      title: `${zodiac1}遇${zodiac2}`,
      description: `${zodiac1}与${zodiac2}的${encounterType}相遇`,
      narrativeText: `两种不同的生肖力量在此刻交汇，创造出独特的能量场`,
      flavorText: '不同的力量，相同的智慧',
      characterDialogue: [],
      visualCues: [
        {
          type: 'particle',
          description: '两种生肖能量的交融',
          duration: 4000,
          intensity: 0.7
        }
      ],
      soundEffects: ['encounter_harmony', 'dual_zodiac'],
      culturalElements: [],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackSeasonalEvent(
    season: string,
    zodiac: string,
    players: Player[],
    seasonalEvent: SeasonalZodiacEvent
  ): GeneratedEventContent {
    return {
      id: `seasonal_${season}_${zodiac}_${Date.now()}`,
      title: seasonalEvent.eventType,
      description: seasonalEvent.description,
      narrativeText: `${season}的力量与${zodiac}的特质完美结合，创造出这个特殊时刻`,
      flavorText: seasonalEvent.mythicalConnection,
      characterDialogue: [],
      visualCues: [
        {
          type: 'background',
          description: `${season}季节的自然景象`,
          duration: 5000,
          intensity: seasonalEvent.powerLevel
        }
      ],
      soundEffects: [`season_${season}`, 'nature_ambient'],
      culturalElements: [
        {
          type: 'seasonal_reference',
          content: seasonalEvent.mythicalConnection,
          significance: '四季轮回的智慧'
        }
      ],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackZodiacWisdom(
    zodiac: string,
    player: Player,
    situation: string
  ): GeneratedEventContent {
    const theme = this.zodiacThemes.get(zodiac);
    return {
      id: `wisdom_${zodiac}_${Date.now()}`,
      title: `${zodiac}的智慧`,
      description: `${zodiac}的古老智慧为当前困境指明方向`,
      narrativeText: `在这个关键时刻，${zodiac}的智慧如明灯般照亮前路`,
      flavorText: theme?.culturalSignificance || `${zodiac}的古老智慧`,
      characterDialogue: [],
      visualCues: [
        {
          type: 'lighting',
          description: '智慧之光',
          duration: 3500,
          intensity: 0.9
        }
      ],
      soundEffects: ['wisdom_bell', 'contemplative_theme'],
      culturalElements: [
        {
          type: 'traditional_wisdom',
          content: theme?.culturalSignificance || '传统智慧的指引',
          significance: '古代先贤的教诲'
        }
      ],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackElementalEvent(
    element: string,
    zodiacs: string[],
    players: Player[]
  ): GeneratedEventContent {
    const elementDescriptions = {
      '金': '肃杀之气弥漫，坚固的力量显现',
      '木': '生机勃勃，万物生长的能量涌动',
      '水': '润泽无声，智慧如水般流淌',
      '火': '热情如火，光明照亮一切',
      '土': '厚德载物，包容万象的力量'
    };
    
    return {
      id: `elemental_${element}_${Date.now()}`,
      title: `${element}行之力`,
      description: `${element}元素的力量觉醒，影响着${zodiacs.join('、')}的命运`,
      narrativeText: elementDescriptions[element as keyof typeof elementDescriptions] || '神秘的元素力量显现',
      flavorText: '五行相生，万物和谐',
      characterDialogue: [],
      visualCues: [
        {
          type: 'particle',
          description: `${element}元素的能量粒子`,
          duration: 6000,
          intensity: 1.0
        }
      ],
      soundEffects: [`element_${element}`, 'five_elements_theme'],
      culturalElements: [
        {
          type: 'zodiac_symbolism',
          content: `${element}行在五行理论中的重要地位`,
          significance: '古代哲学的智慧结晶'
        }
      ],
      timestamp: Date.now()
    };
  }
  
  private generateGenericSeasonalEvent(
    season: string,
    zodiac: string,
    players: Player[],
    context: EventContext
  ): GeneratedEventContent {
    return {
      id: `generic_seasonal_${season}_${Date.now()}`,
      title: `${season}之韵`,
      description: `${season}季的自然力量与生肖能量交融`,
      narrativeText: `${season}的气息弥漫在空气中，为这个时刻增添了特殊的意义`,
      flavorText: '季节轮回，生命不息',
      characterDialogue: [],
      visualCues: [
        {
          type: 'background',
          description: `${season}季节特色背景`,
          duration: 4000,
          intensity: 0.6
        }
      ],
      soundEffects: [`season_${season}`, 'natural_ambient'],
      culturalElements: [
        {
          type: 'seasonal_reference',
          content: `${season}季的文化内涵`,
          significance: '四季文化的体现'
        }
      ],
      timestamp: Date.now()
    };
  }
}

export const createZodiacContentFactory = (llmService?: LLMService): ZodiacContentFactory => {
  return new ZodiacContentFactory(llmService);
};

export default ZodiacContentFactory;