import { EventEmitter } from '../utils/EventEmitter';
import { LLMService } from '../ai/LLMService';
import { Player } from '../types/game';
import { GeneratedEventContent } from './EventContentGenerator';
import { GeneratedDialogue } from './DialogueContentGenerator';

export interface StoryArc {
  id: string;
  title: string;
  theme: StoryTheme;
  protagonists: string[];
  antagonists: string[];
  currentChapter: number;
  totalChapters: number;
  plotPoints: PlotPoint[];
  resolution: StoryResolution | null;
  startTime: number;
  isActive: boolean;
}

export interface PlotPoint {
  id: string;
  chapter: number;
  event: string;
  description: string;
  keyCharacters: string[];
  dramaticTension: number;
  culturalSignificance: string;
  consequencesForFuture: string[];
}

export interface StoryContext {
  gameState: GameStoryState;
  playerArcs: Map<string, PlayerArc>;
  historicalEvents: HistoricalEvent[];
  seasonalNarrative: SeasonalNarrative;
  culturaThemes: CulturalTheme[];
}

export interface GameStoryState {
  phase: 'opening' | 'rising_action' | 'climax' | 'falling_action' | 'resolution';
  overallTension: number;
  dominantTheme: StoryTheme;
  keyConflicts: string[];
  alliances: PlayerAlliance[];
  rivalries: PlayerRivalry[];
}

export interface PlayerArc {
  playerId: string;
  arcType: 'hero_journey' | 'rise_to_power' | 'redemption' | 'tragic_fall' | 'mentor_figure';
  currentStage: string;
  personalConflicts: string[];
  achievements: string[];
  relationshipDynamics: Record<string, RelationshipType>;
  characterGrowth: CharacterGrowthStage[];
}

export interface HistoricalEvent {
  id: string;
  timestamp: number;
  description: string;
  participants: string[];
  impact: EventImpact;
  culturalReferences: string[];
  mythologicalParallels: string[];
}

export interface EventImpact {
  economicShift: number;
  powerBalance: Record<string, number>;
  relationshipChanges: Record<string, number>;
  culturalResonance: number;
}

export interface SeasonalNarrative {
  season: string;
  mythologicalContext: string;
  dominantMoods: string[];
  culturalCelebrations: string[];
  naturalSymbolism: string[];
}

export interface CulturalTheme {
  name: string;
  description: string;
  zodiacConnections: string[];
  literaryReferences: string[];
  moralLessons: string[];
}

export interface PlayerAlliance {
  members: string[];
  purpose: string;
  strength: number;
  culturalBasis: string;
}

export interface PlayerRivalry {
  participants: string[];
  cause: string;
  intensity: number;
  historicalParallel: string;
}

export interface CharacterGrowthStage {
  stage: string;
  description: string;
  lessons: string[];
  timestamp: number;
}

export interface GeneratedStoryline {
  id: string;
  title: string;
  narrative: string;
  chapterSummary: string;
  keyMoments: StoryMoment[];
  characterDevelopment: CharacterDevelopment[];
  culturalWeaving: CulturalWeaving[];
  foreshadowing: string[];
  visualNarrative: VisualNarrative[];
  timestamp: number;
}

export interface StoryMoment {
  type: 'conflict' | 'resolution' | 'revelation' | 'alliance' | 'betrayal' | 'triumph' | 'sacrifice';
  description: string;
  participants: string[];
  emotionalWeight: number;
  symbolism: string;
}

export interface CharacterDevelopment {
  playerId: string;
  growth: string;
  internalConflict: string;
  externalChallenge: string;
  zodiacWisdom: string;
}

export interface CulturalWeaving {
  theme: string;
  integration: string;
  symbolism: string[];
  historicalConnection: string;
}

export interface VisualNarrative {
  sceneType: 'establishing' | 'action' | 'emotional' | 'symbolic' | 'transitional';
  description: string;
  mood: string;
  colors: string[];
  composition: string;
}

export type StoryTheme = 
  | 'harmony_vs_chaos'
  | 'tradition_vs_innovation'  
  | 'wisdom_through_adversity'
  | 'unity_in_diversity'
  | 'cyclical_nature_of_fortune'
  | 'balance_of_elements'
  | 'generational_wisdom'
  | 'cosmic_justice';

export type RelationshipType = 'alliance' | 'rivalry' | 'mentorship' | 'romance' | 'family' | 'neutral';

export type StoryResolution = 'heroic_victory' | 'collective_triumph' | 'bittersweet_ending' | 'moral_lesson' | 'cyclical_return';

export class DynamicStorylineGenerator extends EventEmitter {
  private llmService: LLMService;
  private storyContext: StoryContext;
  private activeArcs: Map<string, StoryArc> = new Map();
  private storyCache = new Map<string, GeneratedStoryline>();
  private narrativeTemplates = new Map<StoryTheme, NarrativeTemplate[]>();
  
  constructor(llmService?: LLMService) {
    super();
    this.llmService = llmService || new LLMService();
    this.storyContext = this.initializeStoryContext();
    this.initializeNarrativeTemplates();
  }
  
  public async generateGameOpeningStory(
    players: Player[],
    gameSettings: GameSettings
  ): Promise<GeneratedStoryline> {
    const openingContext = this.buildOpeningContext(players, gameSettings);
    
    try {
      const storyline = await this.generateOpeningWithLLM(openingContext);
      this.initializePlayerArcs(players);
      this.emit('story_opening_generated', storyline);
      return storyline;
    } catch (error) {
      console.warn('LLM opening story generation failed:', error);
      return this.generateFallbackOpening(players, gameSettings);
    }
  }
  
  public async generateChapterTransition(
    fromChapter: number,
    toChapter: number,
    keyEvents: HistoricalEvent[],
    players: Player[]
  ): Promise<GeneratedStoryline> {
    const transitionContext = this.buildTransitionContext(fromChapter, toChapter, keyEvents, players);
    
    try {
      const storyline = await this.generateTransitionWithLLM(transitionContext);
      this.updateStoryArcs(storyline, keyEvents);
      this.emit('chapter_transition_generated', storyline);
      return storyline;
    } catch (error) {
      console.warn('LLM chapter transition generation failed:', error);
      return this.generateFallbackTransition(fromChapter, toChapter, keyEvents);
    }
  }
  
  public async generateEpicMomentNarrative(
    event: GeneratedEventContent,
    affectedPlayers: Player[],
    gameImpact: EventImpact
  ): Promise<GeneratedStoryline> {
    const epicContext = this.buildEpicMomentContext(event, affectedPlayers, gameImpact);
    
    try {
      const storyline = await this.generateEpicMomentWithLLM(epicContext);
      this.recordEpicMoment(storyline, event, affectedPlayers);
      this.emit('epic_moment_generated', storyline);
      return storyline;
    } catch (error) {
      console.warn('LLM epic moment generation failed:', error);
      return this.generateFallbackEpicMoment(event, affectedPlayers);
    }
  }
  
  public async generateCharacterArcProgression(
    player: Player,
    recentActions: string[],
    relationships: Record<string, number>
  ): Promise<GeneratedStoryline> {
    const arcContext = this.buildCharacterArcContext(player, recentActions, relationships);
    
    try {
      const storyline = await this.generateCharacterArcWithLLM(arcContext);
      this.updatePlayerArc(player.id, storyline);
      this.emit('character_arc_generated', storyline);
      return storyline;
    } catch (error) {
      console.warn('LLM character arc generation failed:', error);
      return this.generateFallbackCharacterArc(player, recentActions);
    }
  }
  
  public async generateSeasonalNarrativeTransition(
    fromSeason: string,
    toSeason: string,
    dominantPlayers: Player[],
    culturalEvents: string[]
  ): Promise<GeneratedStoryline> {
    const seasonalContext = this.buildSeasonalContext(fromSeason, toSeason, dominantPlayers, culturalEvents);
    
    try {
      const storyline = await this.generateSeasonalWithLLM(seasonalContext);
      this.updateSeasonalNarrative(toSeason, storyline);
      this.emit('seasonal_narrative_generated', storyline);
      return storyline;
    } catch (error) {
      console.warn('LLM seasonal narrative generation failed:', error);
      return this.generateFallbackSeasonal(fromSeason, toSeason, culturalEvents);
    }
  }
  
  public async generateGameEndingStory(
    winner: Player,
    finalRankings: Player[],
    keyStoryMoments: HistoricalEvent[]
  ): Promise<GeneratedStoryline> {
    const endingContext = this.buildEndingContext(winner, finalRankings, keyStoryMoments);
    
    try {
      const storyline = await this.generateEndingWithLLM(endingContext);
      this.concludeAllArcs(storyline);
      this.emit('story_ending_generated', storyline);
      return storyline;
    } catch (error) {
      console.warn('LLM ending story generation failed:', error);
      return this.generateFallbackEnding(winner, finalRankings);
    }
  }
  
  public async weaveDialogueIntoNarrative(
    baseStoryline: GeneratedStoryline,
    characterDialogues: GeneratedDialogue[]
  ): Promise<GeneratedStoryline> {
    const weavingContext = this.buildDialogueWeavingContext(baseStoryline, characterDialogues);
    
    try {
      const enrichedStoryline = await this.weaveDialogueWithLLM(weavingContext);
      this.emit('dialogue_woven', enrichedStoryline);
      return enrichedStoryline;
    } catch (error) {
      console.warn('LLM dialogue weaving failed:', error);
      return this.weavDialogueManually(baseStoryline, characterDialogues);
    }
  }
  
  private async generateOpeningWithLLM(context: OpeningContext): Promise<GeneratedStoryline> {
    const prompt = this.buildOpeningPrompt(context);
    const systemMessage = this.buildStorySystemMessage('opening');
    
    const response = await this.callLLMForStory(prompt, systemMessage);
    return this.parseStorylineResponse(response, 'opening', context.players);
  }
  
  private async generateTransitionWithLLM(context: TransitionContext): Promise<GeneratedStoryline> {
    const prompt = this.buildTransitionPrompt(context);
    const systemMessage = this.buildStorySystemMessage('transition');
    
    const response = await this.callLLMForStory(prompt, systemMessage);
    return this.parseStorylineResponse(response, 'transition', context.players);
  }
  
  private async generateEpicMomentWithLLM(context: EpicMomentContext): Promise<GeneratedStoryline> {
    const prompt = this.buildEpicMomentPrompt(context);
    const systemMessage = this.buildStorySystemMessage('epic_moment');
    
    const response = await this.callLLMForStory(prompt, systemMessage);
    return this.parseStorylineResponse(response, 'epic_moment', context.players);
  }
  
  private async generateCharacterArcWithLLM(context: CharacterArcContext): Promise<GeneratedStoryline> {
    const prompt = this.buildCharacterArcPrompt(context);
    const systemMessage = this.buildStorySystemMessage('character_arc');
    
    const response = await this.callLLMForStory(prompt, systemMessage);
    return this.parseStorylineResponse(response, 'character_arc', [context.player]);
  }
  
  private async generateSeasonalWithLLM(context: SeasonalContext): Promise<GeneratedStoryline> {
    const prompt = this.buildSeasonalPrompt(context);
    const systemMessage = this.buildStorySystemMessage('seasonal');
    
    const response = await this.callLLMForStory(prompt, systemMessage);
    return this.parseStorylineResponse(response, 'seasonal', context.players);
  }
  
  private async generateEndingWithLLM(context: EndingContext): Promise<GeneratedStoryline> {
    const prompt = this.buildEndingPrompt(context);
    const systemMessage = this.buildStorySystemMessage('ending');
    
    const response = await this.callLLMForStory(prompt, systemMessage);
    return this.parseStorylineResponse(response, 'ending', context.players);
  }
  
  private async weaveDialogueWithLLM(context: DialogueWeavingContext): Promise<GeneratedStoryline> {
    const prompt = this.buildDialogueWeavingPrompt(context);
    const systemMessage = this.buildStorySystemMessage('dialogue_weaving');
    
    const response = await this.callLLMForStory(prompt, systemMessage);
    return this.parseStorylineResponse(response, 'dialogue_weaving', []);
  }
  
  private buildOpeningPrompt(context: OpeningContext): string {
    const playerDescriptions = context.players.map(p => 
      `${p.name}（${p.zodiac}）- 性格特点：${this.getZodiacTraits(p.zodiac)}`
    ).join('\n');
    
    return `
创作十二生肖大富翁游戏的开场故事：

游戏设定：
- 玩家数量：${context.players.length}
- 游戏主题：${context.gameTheme}
- 季节背景：${context.season}
- 文化设定：${context.culturalSetting}

参与玩家：
${playerDescriptions}

故事要求：
1. 营造神秘而富有仪式感的开场氛围
2. 介绍每个玩家的生肖特色和个性
3. 建立游戏世界的文化背景和规则
4. 预示即将展开的商业争斗和友谊
5. 融入中国传统文化和生肖神话
6. 长度控制在300-500字

请创作一个引人入胜的开场故事，为整个游戏体验奠定基调。
`;
  }
  
  private buildTransitionPrompt(context: TransitionContext): string {
    const eventsDescription = context.keyEvents.map(e => e.description).join('；');
    
    return `
创作游戏章节转换的过渡故事：

章节信息：
- 从第${context.fromChapter}章过渡到第${context.toChapter}章
- 关键事件：${eventsDescription}
- 整体氛围：${context.overallMood}

角色状况：
${context.players.map(p => `${p.name}（${p.zodiac}）- 当前状态：${this.getPlayerStatus(p)}`).join('\n')}

要求：
1. 总结前一章节的重要发展
2. 营造新章节的期待感
3. 突出角色关系的变化
4. 体现故事的连贯性和发展
5. 长度200-300字

请创作承上启下的过渡叙述。
`;
  }
  
  private buildEpicMomentPrompt(context: EpicMomentContext): string {
    return `
创作史诗级游戏事件的叙述：

核心事件：${context.event.title}
事件描述：${context.event.description}
事件叙述：${context.event.narrativeText}

受影响角色：
${context.players.map(p => `${p.name}（${p.zodiac}）`).join('、')}

事件影响：
- 经济变化：${context.impact.economicShift}
- 权力平衡变化：${JSON.stringify(context.impact.powerBalance)}
- 文化共鸣度：${context.impact.culturalResonance}

要求：
1. 将事件提升到史诗的高度
2. 突出戏剧冲突和转折
3. 体现深厚的文化内涵
4. 描绘角色的情感冲击
5. 预示未来的发展方向
6. 长度400-600字

请创作震撼人心的史诗叙述。
`;
  }
  
  private buildCharacterArcPrompt(context: CharacterArcContext): string {
    const playerArc = this.storyContext.playerArcs.get(context.player.id);
    
    return `
创作角色成长弧线的叙述：

角色信息：
- 姓名：${context.player.name}
- 生肖：${context.player.zodiac}
- 当前弧线类型：${playerArc?.arcType || '英雄之旅'}
- 成长阶段：${playerArc?.currentStage || '启程'}

最近行为：
${context.recentActions.join('；')}

人际关系：
${Object.entries(context.relationships).map(([id, level]) => 
  `与${id}的关系：${level > 0 ? '友好' : level < 0 ? '敌对' : '中立'}`
).join('\n')}

要求：
1. 突出角色的内心成长
2. 体现生肖特质的发挥或克服
3. 展现人际关系的影响
4. 包含传统文化智慧的启发
5. 预示角色的未来发展
6. 长度250-350字

请创作深度的角色发展叙述。
`;
  }
  
  private buildSeasonalPrompt(context: SeasonalContext): string {
    return `
创作季节转换的文化叙述：

季节变化：从${context.fromSeason}转入${context.toSeason}
主导角色：${context.dominantPlayers.map(p => `${p.name}（${p.zodiac}）`).join('、')}
文化事件：${context.culturalEvents.join('、')}

季节特征：
- ${context.toSeason}的自然特色
- 相关的传统节日和习俗
- 对应的五行元素和生肖影响
- 季节性的商业机遇和挑战

要求：
1. 营造浓厚的季节氛围
2. 融入中国传统节气文化
3. 体现不同生肖在该季节的特点
4. 预示季节变化带来的机遇
5. 长度300-400字

请创作富有诗意的季节叙述。
`;
  }
  
  private buildEndingPrompt(context: EndingContext): string {
    const storyHighlights = context.keyMoments.slice(0, 5).map(m => m.description).join('；');
    
    return `
创作游戏结局的史诗总结：

游戏结果：
- 胜利者：${context.winner.name}（${context.winner.zodiac}）
- 最终排名：${context.finalRankings.map((p, i) => `第${i+1}名：${p.name}`).join('、')}

故事亮点：
${storyHighlights}

要求：
1. 庆祝胜利者的成就和智慧
2. 赞美所有参与者的精彩表现
3. 总结整个游戏的文化价值
4. 体现中国传统文化的智慧
5. 留下对友谊和成长的思考
6. 营造温馨而有意义的结尾
7. 长度400-600字

请创作感人至深的结局故事。
`;
  }
  
  private buildDialogueWeavingPrompt(context: DialogueWeavingContext): string {
    const dialoguesSummary = context.dialogues.map(d => 
      `${d.zodiacPersonality}说："${d.content}"（情绪：${d.emotion}）`
    ).join('\n');
    
    return `
将对话巧妙融入现有故事叙述：

原始故事：
${context.baseStoryline.narrative}

角色对话：
${dialoguesSummary}

要求：
1. 保持原故事的主题和结构
2. 自然地插入角色对话
3. 确保对话与叙述的协调
4. 增强故事的戏剧张力
5. 体现角色的个性特点
6. 保持文化氛围的一致性

请创作对话与叙述融合的完整故事。
`;
  }
  
  private buildStorySystemMessage(storyType: string): string {
    return `你是一位精通中国传统文化的资深故事创作家，专门为十二生肖大富翁游戏创作富有文化内涵的叙述内容。

创作风格：
- 语言优美，富有文学性
- 深度融入生肖文化和传统智慧
- 营造浓厚的中国古典氛围
- 体现人文关怀和哲学思考
- 适合游戏娱乐的轻松基调

当前任务：创作${storyType}类型的故事内容

创作要求：
1. 内容积极向上，富有教育意义
2. 文化元素准确，避免刻板印象
3. 情节引人入胜，节奏把握得当
4. 角色刻画生动，性格鲜明
5. 语言流畅自然，适合朗读

请按照JSON格式返回完整的故事内容。`;
  }
  
  private async callLLMForStory(prompt: string, systemMessage: string): Promise<string> {
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
          max_tokens: 2500,
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
  
  private parseStorylineResponse(
    response: string,
    storyType: string,
    players: Player[]
  ): GeneratedStoryline {
    try {
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      // 如果不是JSON格式，直接使用文本作为narrative
      let parsed: any;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch {
        parsed = {
          title: this.generateDefaultTitle(storyType),
          narrative: cleanResponse,
          chapterSummary: cleanResponse.substring(0, 200) + '...'
        };
      }
      
      return {
        id: `story_${storyType}_${Date.now()}`,
        title: parsed.title || this.generateDefaultTitle(storyType),
        narrative: parsed.narrative || cleanResponse,
        chapterSummary: parsed.chapterSummary || parsed.narrative?.substring(0, 200) + '...' || '',
        keyMoments: this.extractKeyMoments(parsed.keyMoments, players),
        characterDevelopment: this.extractCharacterDevelopment(parsed.characterDevelopment, players),
        culturalWeaving: this.extractCulturalWeaving(parsed.culturalWeaving),
        foreshadowing: parsed.foreshadowing || [],
        visualNarrative: this.extractVisualNarrative(parsed.visualNarrative),
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('Failed to parse storyline response:', error);
      return this.generateFallbackStoryline(storyType, response, players);
    }
  }
  
  private initializeStoryContext(): StoryContext {
    return {
      gameState: {
        phase: 'opening',
        overallTension: 0.3,
        dominantTheme: 'harmony_vs_chaos',
        keyConflicts: [],
        alliances: [],
        rivalries: []
      },
      playerArcs: new Map(),
      historicalEvents: [],
      seasonalNarrative: {
        season: 'spring',
        mythologicalContext: '春回大地，万物复苏',
        dominantMoods: ['希望', '活力', '新生'],
        culturalCelebrations: ['春节', '元宵', '清明'],
        naturalSymbolism: ['嫩芽', '花开', '细雨']
      },
      culturaThemes: [
        {
          name: '五行相生',
          description: '金木水火土的相互作用',
          zodiacConnections: ['所有生肖'],
          literaryReferences: ['易经', '道德经'],
          moralLessons: ['平衡', '和谐', '循环']
        }
      ]
    };
  }
  
  private initializeNarrativeTemplates(): void {
    // Initialize narrative templates for different themes
    // This would contain template structures for various story themes
  }
  
  private initializePlayerArcs(players: Player[]): void {
    players.forEach(player => {
      const arc: PlayerArc = {
        playerId: player.id,
        arcType: 'hero_journey',
        currentStage: '启程之初',
        personalConflicts: [],
        achievements: [],
        relationshipDynamics: {},
        characterGrowth: []
      };
      
      this.storyContext.playerArcs.set(player.id, arc);
    });
  }
  
  private buildOpeningContext(players: Player[], gameSettings: GameSettings): OpeningContext {
    return {
      players,
      gameTheme: gameSettings.theme || 'classic',
      season: gameSettings.season || 'spring',
      culturalSetting: gameSettings.culturalSetting || 'traditional'
    };
  }
  
  private buildTransitionContext(
    fromChapter: number,
    toChapter: number,
    keyEvents: HistoricalEvent[],
    players: Player[]
  ): TransitionContext {
    return {
      fromChapter,
      toChapter,
      keyEvents,
      players,
      overallMood: this.determineOverallMood(keyEvents)
    };
  }
  
  private buildEpicMomentContext(
    event: GeneratedEventContent,
    players: Player[],
    impact: EventImpact
  ): EpicMomentContext {
    return {
      event,
      players,
      impact,
      culturalSignificance: event.culturalElements.map(ce => ce.content).join('；')
    };
  }
  
  private buildCharacterArcContext(
    player: Player,
    recentActions: string[],
    relationships: Record<string, number>
  ): CharacterArcContext {
    return {
      player,
      recentActions,
      relationships,
      currentArc: this.storyContext.playerArcs.get(player.id)
    };
  }
  
  private buildSeasonalContext(
    fromSeason: string,
    toSeason: string,
    dominantPlayers: Player[],
    culturalEvents: string[]
  ): SeasonalContext {
    return {
      fromSeason,
      toSeason,
      dominantPlayers,
      culturalEvents
    };
  }
  
  private buildEndingContext(
    winner: Player,
    finalRankings: Player[],
    keyMoments: HistoricalEvent[]
  ): EndingContext {
    return {
      winner,
      finalRankings,
      keyMoments,
      gameTheme: this.storyContext.gameState.dominantTheme
    };
  }
  
  private buildDialogueWeavingContext(
    baseStoryline: GeneratedStoryline,
    dialogues: GeneratedDialogue[]
  ): DialogueWeavingContext {
    return {
      baseStoryline,
      dialogues
    };
  }
  
  // Helper methods for data processing
  private getZodiacTraits(zodiac: string): string {
    const traits: Record<string, string> = {
      '鼠': '机智灵活，善于经商',
      '牛': '勤劳踏实，值得信赖',
      '虎': '勇猛威严，天生领袖',
      '兔': '温和善良，心思细腻',
      '龙': '威严神秘，天赋异禀',
      '蛇': '智慧深沉，洞察力强',
      '马': '热情奔放，追求自由',
      '羊': '温柔艺术，富有创意',
      '猴': '聪明活泼，变化无穷',
      '鸡': '勤奋守时，认真负责',
      '狗': '忠诚正直，保护他人',
      '猪': '善良乐观，知足常乐'
    };
    
    return traits[zodiac] || '独特个性，魅力非凡';
  }
  
  private getPlayerStatus(player: Player): string {
    // This would analyze the player's current game state
    return `资产${player.money}，位置第${player.position}格`;
  }
  
  private determineOverallMood(events: HistoricalEvent[]): string {
    if (events.length === 0) return '平静';
    
    const avgImpact = events.reduce((sum, e) => sum + e.impact.culturalResonance, 0) / events.length;
    
    if (avgImpact > 0.8) return '激动人心';
    if (avgImpact > 0.6) return '紧张刺激';
    if (avgImpact > 0.4) return '变化莫测';
    return '波澜不惊';
  }
  
  private generateDefaultTitle(storyType: string): string {
    const titles: Record<string, string> = {
      'opening': '生肖传说的开始',
      'transition': '命运的转折',
      'epic_moment': '史诗般的时刻',
      'character_arc': '成长的足迹',
      'seasonal': '季节的轮回',
      'ending': '传说的终章'
    };
    
    return titles[storyType] || '神秘的故事';
  }
  
  private extractKeyMoments(moments: any, players: Player[]): StoryMoment[] {
    if (!Array.isArray(moments)) return [];
    
    return moments.map(m => ({
      type: m.type || 'conflict',
      description: m.description || '',
      participants: m.participants || [],
      emotionalWeight: m.emotionalWeight || 0.5,
      symbolism: m.symbolism || ''
    }));
  }
  
  private extractCharacterDevelopment(development: any, players: Player[]): CharacterDevelopment[] {
    if (!Array.isArray(development)) return [];
    
    return development.map(d => ({
      playerId: d.playerId || '',
      growth: d.growth || '',
      internalConflict: d.internalConflict || '',
      externalChallenge: d.externalChallenge || '',
      zodiacWisdom: d.zodiacWisdom || ''
    }));
  }
  
  private extractCulturalWeaving(weaving: any): CulturalWeaving[] {
    if (!Array.isArray(weaving)) return [];
    
    return weaving.map(w => ({
      theme: w.theme || '',
      integration: w.integration || '',
      symbolism: w.symbolism || [],
      historicalConnection: w.historicalConnection || ''
    }));
  }
  
  private extractVisualNarrative(visual: any): VisualNarrative[] {
    if (!Array.isArray(visual)) return [];
    
    return visual.map(v => ({
      sceneType: v.sceneType || 'establishing',
      description: v.description || '',
      mood: v.mood || 'neutral',
      colors: v.colors || [],
      composition: v.composition || ''
    }));
  }
  
  private generateFallbackStoryline(
    storyType: string,
    rawResponse: string,
    players: Player[]
  ): GeneratedStoryline {
    return {
      id: `fallback_${storyType}_${Date.now()}`,
      title: this.generateDefaultTitle(storyType),
      narrative: rawResponse || `这是一个关于${players.map(p => p.zodiac).join('、')}的精彩故事...`,
      chapterSummary: '故事继续发展，新的冒险即将开始...',
      keyMoments: [],
      characterDevelopment: [],
      culturalWeaving: [],
      foreshadowing: [],
      visualNarrative: [],
      timestamp: Date.now()
    };
  }
  
  // Fallback methods for different story types
  private generateFallbackOpening(players: Player[], gameSettings: GameSettings): GeneratedStoryline {
    const playerList = players.map(p => `${p.name}（${p.zodiac}）`).join('、');
    
    return {
      id: `opening_fallback_${Date.now()}`,
      title: '十二生肖聚首',
      narrative: `在这个祥瑞的日子里，${playerList}齐聚一堂，准备开始一场智慧与运气的较量。古老的生肖力量在此刻觉醒，每位参与者都带着自己生肖的独特天赋，即将在商业的棋盘上展现各自的风采。让我们拭目以待，看谁能在这场传统与现代结合的博弈中脱颖而出！`,
      chapterSummary: '游戏开始，各路英雄集结',
      keyMoments: [],
      characterDevelopment: [],
      culturalWeaving: [],
      foreshadowing: ['激烈的竞争即将展开'],
      visualNarrative: [],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackTransition(
    fromChapter: number,
    toChapter: number,
    events: HistoricalEvent[]
  ): GeneratedStoryline {
    return {
      id: `transition_fallback_${Date.now()}`,
      title: `第${fromChapter}章到第${toChapter}章`,
      narrative: `随着时间的推移，游戏进入了新的阶段。前一章的精彩还历历在目，而新的挑战已经悄然来临。每位参与者都在这个过程中有所成长，他们的命运也因为各种机缘而发生着微妙的变化。`,
      chapterSummary: '故事继续，新的篇章开启',
      keyMoments: [],
      characterDevelopment: [],
      culturalWeaving: [],
      foreshadowing: [],
      visualNarrative: [],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackEpicMoment(
    event: GeneratedEventContent,
    players: Player[]
  ): GeneratedStoryline {
    return {
      id: `epic_fallback_${Date.now()}`,
      title: `史诗时刻：${event.title}`,
      narrative: `${event.narrativeText}\n\n这个时刻注定会被铭记在游戏的历史中。${players.map(p => p.name).join('、')}都感受到了这个事件带来的深远影响，他们的命运也因此发生了不可逆转的改变。`,
      chapterSummary: '关键事件改变了游戏格局',
      keyMoments: [],
      characterDevelopment: [],
      culturalWeaving: [],
      foreshadowing: [],
      visualNarrative: [],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackCharacterArc(player: Player, recentActions: string[]): GeneratedStoryline {
    return {
      id: `character_arc_fallback_${Date.now()}`,
      title: `${player.name}的成长之路`,
      narrative: `${player.name}作为${player.zodiac}生肖的代表，在最近的行动中展现出了独特的智慧。${recentActions.join('，')}这些经历让${player.name}更加成熟，也更加了解自己的能力和局限。每一步都是成长的足迹，每一次选择都在塑造着未来的命运。`,
      chapterSummary: `${player.name}的个人成长`,
      keyMoments: [],
      characterDevelopment: [],
      culturalWeaving: [],
      foreshadowing: [],
      visualNarrative: [],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackSeasonal(
    fromSeason: string,
    toSeason: string,
    culturalEvents: string[]
  ): GeneratedStoryline {
    return {
      id: `seasonal_fallback_${Date.now()}`,
      title: `从${fromSeason}到${toSeason}`,
      narrative: `时光荏苒，季节轮回。从${fromSeason}转入${toSeason}，大自然的变化也影响着游戏的进程。${culturalEvents.join('、')}这些传统节日为游戏增添了浓厚的文化氛围，也为参与者们提供了新的机遇和挑战。`,
      chapterSummary: '季节更替带来新的机遇',
      keyMoments: [],
      characterDevelopment: [],
      culturalWeaving: [],
      foreshadowing: [],
      visualNarrative: [],
      timestamp: Date.now()
    };
  }
  
  private generateFallbackEnding(winner: Player, finalRankings: Player[]): GeneratedStoryline {
    return {
      id: `ending_fallback_${Date.now()}`,
      title: `${winner.name}的胜利`,
      narrative: `经过一番激烈的角逐，${winner.name}（${winner.zodiac}）最终脱颖而出，成为了这场生肖大富翁游戏的胜利者。但真正的收获不仅仅是胜利本身，更是在这个过程中所体验到的友谊、智慧和成长。每一位参与者都是赢家，因为他们都在这场游戏中发现了更好的自己。`,
      chapterSummary: '游戏结束，友谊长存',
      keyMoments: [],
      characterDevelopment: [],
      culturalWeaving: [],
      foreshadowing: [],
      visualNarrative: [],
      timestamp: Date.now()
    };
  }
  
  private weavDialogueManually(
    baseStoryline: GeneratedStoryline,
    dialogues: GeneratedDialogue[]
  ): GeneratedStoryline {
    let enrichedNarrative = baseStoryline.narrative;
    
    dialogues.forEach(dialogue => {
      const insertPoint = Math.floor(Math.random() * enrichedNarrative.length);
      const dialogueText = `\n\n"${dialogue.content}"——这是来自${dialogue.zodiacPersonality}的声音，充满了${dialogue.emotion}的情绪。\n\n`;
      
      enrichedNarrative = enrichedNarrative.slice(0, insertPoint) + 
                         dialogueText + 
                         enrichedNarrative.slice(insertPoint);
    });
    
    return {
      ...baseStoryline,
      narrative: enrichedNarrative,
      id: `woven_${baseStoryline.id}`,
      timestamp: Date.now()
    };
  }
  
  // Update methods
  private updateStoryArcs(storyline: GeneratedStoryline, events: HistoricalEvent[]): void {
    events.forEach(event => {
      this.storyContext.historicalEvents.push(event);
    });
  }
  
  private recordEpicMoment(
    storyline: GeneratedStoryline,
    event: GeneratedEventContent,
    players: Player[]
  ): void {
    const historicalEvent: HistoricalEvent = {
      id: storyline.id,
      timestamp: Date.now(),
      description: event.title,
      participants: players.map(p => p.id),
      impact: {
        economicShift: 0.5,
        powerBalance: {},
        relationshipChanges: {},
        culturalResonance: 0.8
      },
      culturalReferences: event.culturalElements.map(ce => ce.content),
      mythologicalParallels: []
    };
    
    this.storyContext.historicalEvents.push(historicalEvent);
  }
  
  private updatePlayerArc(playerId: string, storyline: GeneratedStoryline): void {
    const arc = this.storyContext.playerArcs.get(playerId);
    if (arc) {
      arc.characterGrowth.push({
        stage: storyline.title,
        description: storyline.chapterSummary,
        lessons: storyline.foreshadowing,
        timestamp: Date.now()
      });
    }
  }
  
  private updateSeasonalNarrative(season: string, storyline: GeneratedStoryline): void {
    this.storyContext.seasonalNarrative.season = season;
    // Additional seasonal updates could be implemented here
  }
  
  private concludeAllArcs(storyline: GeneratedStoryline): void {
    this.activeArcs.forEach(arc => {
      arc.isActive = false;
      arc.resolution = 'moral_lesson';
    });
  }
  
  public getStoryContext(): StoryContext {
    return this.storyContext;
  }
  
  public getActiveArcs(): Map<string, StoryArc> {
    return this.activeArcs;
  }
  
  public clearCache(): void {
    this.storyCache.clear();
    this.emit('cache_cleared');
  }
}

// Supporting interfaces
interface GameSettings {
  theme?: string;
  season?: string;
  culturalSetting?: string;
}

interface OpeningContext {
  players: Player[];
  gameTheme: string;
  season: string;
  culturalSetting: string;
}

interface TransitionContext {
  fromChapter: number;
  toChapter: number;
  keyEvents: HistoricalEvent[];
  players: Player[];
  overallMood: string;
}

interface EpicMomentContext {
  event: GeneratedEventContent;
  players: Player[];
  impact: EventImpact;
  culturalSignificance: string;
}

interface CharacterArcContext {
  player: Player;
  recentActions: string[];
  relationships: Record<string, number>;
  currentArc?: PlayerArc;
}

interface SeasonalContext {
  fromSeason: string;
  toSeason: string;
  dominantPlayers: Player[];
  culturalEvents: string[];
}

interface EndingContext {
  winner: Player;
  finalRankings: Player[];
  keyMoments: HistoricalEvent[];
  gameTheme: StoryTheme;
}

interface DialogueWeavingContext {
  baseStoryline: GeneratedStoryline;
  dialogues: GeneratedDialogue[];
}

interface NarrativeTemplate {
  structure: string[];
  themes: string[];
  culturalElements: string[];
  pacing: string;
}

export const createDynamicStorylineGenerator = (llmService?: LLMService): DynamicStorylineGenerator => {
  return new DynamicStorylineGenerator(llmService);
};

export default DynamicStorylineGenerator;