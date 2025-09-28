/**
 * 自适应故事叙述与事件叙述管理系统
 * 集成LLM服务提供动态、有趣的游戏叙述体验
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

import { LLMService, type LLMConfig, type EventNarration, type GameContext } from './LLMService';

/**
 * 故事叙述管理器 - 提供沉浸式的游戏叙述体验
 */
export class StorytellingManager {
  private llmService?: LLMService;
  private narrativeHistory: NarrativeEvent[] = [];
  private characterArcs: Map<string, CharacterArc> = new Map();
  private seasonalContext: SeasonalContext;
  private culturalElements: CulturalElement[] = [];
  
  constructor(llmConfig?: LLMConfig) {
    if (llmConfig) {
      try {
        this.llmService = new LLMService(llmConfig);
      } catch (error) {
        console.warn('StorytellingManager: LLM service initialization failed:', error);
      }
    }

    // 初始化季节性上下文
    this.seasonalContext = this.initializeSeasonalContext();
    
    // 初始化文化元素
    this.culturalElements = this.initializeCulturalElements();
  }

  /**
   * 为游戏事件生成动态叙述
   */
  async generateEventNarration(
    event: GameEvent,
    affectedPlayers: Player[],
    gameState: GameState,
    context?: NarrationContext
  ): Promise<EventNarration> {
    const gameContext = this.buildGameContext(gameState, context);
    
    if (this.llmService) {
      try {
        const narration = await this.llmService.generateEventNarration(
          event,
          affectedPlayers,
          gameContext
        );

        // 记录叙述历史
        this.recordNarrativeEvent({
          eventId: event.id,
          narration: narration.narration,
          timestamp: Date.now(),
          participants: affectedPlayers.map(p => p.id),
          mood: narration.mood,
          culturalElements: narration.culturalElements
        });

        // 更新角色弧线
        this.updateCharacterArcs(affectedPlayers, event, narration);

        console.log(`✨ 事件叙述生成成功: ${event.type} - ${narration.mood}风格`);
        return narration;

      } catch (error) {
        console.warn(`LLM事件叙述生成失败 (${event.type}):`, error);
      }
    }

    // 后备方案：传统叙述
    return this.generateFallbackNarration(event, affectedPlayers, gameContext);
  }

  /**
   * 生成游戏开场故事
   */
  async generateOpeningStory(
    players: Player[],
    gameSettings: GameSettings
  ): Promise<OpeningNarration> {
    const context = this.buildOpeningContext(players, gameSettings);
    
    if (this.llmService) {
      try {
        const prompt = this.buildOpeningStoryPrompt(players, gameSettings);
        const narration = await this.llmService.generateEventNarration(
          {
            id: 'opening',
            type: 'game_start',
            title: '十二生肖大富翁传说开始',
            description: '古老的生肖智慧与现代商业智慧的碰撞',
            rarity: 'legendary'
          } as GameEvent,
          players,
          context
        );

        // 初始化所有玩家的角色弧线
        this.initializePlayerArcs(players, narration);

        return {
          title: '传说的开始',
          introduction: narration.narration,
          characterIntroductions: this.generateCharacterIntroductions(players),
          settingDescription: this.generateSettingDescription(gameSettings),
          prophecy: this.generateGameProphecy(players),
          mood: narration.mood,
          timestamp: Date.now()
        };

      } catch (error) {
        console.warn('LLM开场故事生成失败:', error);
      }
    }

    // 后备方案
    return this.generateFallbackOpeningStory(players, gameSettings);
  }

  /**
   * 生成回合过渡叙述
   */
  async generateTurnTransition(
    currentPlayer: Player,
    gameState: GameState,
    previousEvents: GameEvent[]
  ): Promise<TurnNarration> {
    const context = this.buildTurnTransitionContext(currentPlayer, gameState, previousEvents);
    
    if (this.llmService) {
      try {
        const event = {
          id: `turn_${gameState.turn}`,
          type: 'turn_transition',
          title: `${currentPlayer.name}的回合`,
          description: `轮到${currentPlayer.zodiac}展现智慧的时刻`,
          rarity: 'common'
        } as GameEvent;

        const narration = await this.llmService.generateEventNarration(
          event,
          [currentPlayer],
          context
        );

        return {
          playerName: currentPlayer.name,
          zodiac: currentPlayer.zodiac,
          transitionText: narration.narration,
          characterMoment: this.getCharacterMoment(currentPlayer),
          gamePhaseHint: this.getGamePhaseHint(gameState),
          mood: narration.mood,
          timestamp: Date.now()
        };

      } catch (error) {
        console.warn(`回合过渡叙述生成失败 (${currentPlayer.name}):`, error);
      }
    }

    // 后备方案
    return this.generateFallbackTurnTransition(currentPlayer, gameState);
  }

  /**
   * 生成特殊事件的史诗叙述
   */
  async generateEpicEventNarration(
    event: EpicGameEvent,
    allPlayers: Player[],
    gameState: GameState
  ): Promise<EpicNarration> {
    const context = this.buildEpicEventContext(event, allPlayers, gameState);
    
    if (this.llmService) {
      try {
        const narration = await this.llmService.generateEventNarration(
          event,
          allPlayers,
          context
        );

        // 史诗事件会显著影响角色弧线
        this.updateAllCharacterArcs(allPlayers, event, narration);

        return {
          eventTitle: event.title,
          epicNarration: narration.narration,
          impactAnalysis: this.analyzeEpicEventImpact(event, allPlayers),
          characterReactions: await this.generateCharacterReactions(allPlayers, event),
          legendaryMoment: this.createLegendaryMoment(event, narration),
          consequences: this.predictEventConsequences(event, gameState),
          mood: 'dramatic',
          timestamp: Date.now()
        };

      } catch (error) {
        console.warn(`史诗事件叙述生成失败 (${event.type}):`, error);
      }
    }

    // 后备方案
    return this.generateFallbackEpicNarration(event, allPlayers);
  }

  /**
   * 生成游戏结局故事
   */
  async generateEndingStory(
    winner: Player,
    allPlayers: Player[],
    gameState: GameState,
    gameHistory: GameEvent[]
  ): Promise<EndingNarration> {
    const context = this.buildEndingContext(winner, allPlayers, gameState, gameHistory);
    
    if (this.llmService) {
      try {
        const event = {
          id: 'game_ending',
          type: 'game_end',
          title: `${winner.name}的胜利传说`,
          description: `${winner.zodiac}的智慧最终征服了商业战场`,
          rarity: 'legendary'
        } as GameEvent;

        const narration = await this.llmService.generateEventNarration(
          event,
          [winner],
          context
        );

        return {
          winnerName: winner.name,
          winnerZodiac: winner.zodiac,
          victoryNarration: narration.narration,
          journeySummary: this.generateJourneySummary(winner),
          characterEpilogues: this.generateCharacterEpilogues(allPlayers, winner),
          finalWisdom: this.generateFinalWisdom(winner.zodiac),
          legendStatus: this.calculateLegendStatus(winner, gameHistory),
          mood: 'triumphant',
          timestamp: Date.now()
        };

      } catch (error) {
        console.warn('结局故事生成失败:', error);
      }
    }

    // 后备方案
    return this.generateFallbackEndingStory(winner, allPlayers);
  }

  /**
   * 获取叙述历史
   */
  getNarrativeHistory(limit?: number): NarrativeEvent[] {
    const history = this.narrativeHistory;
    return limit ? history.slice(-limit) : history;
  }

  /**
   * 获取角色弧线信息
   */
  getCharacterArc(playerId: string): CharacterArc | undefined {
    return this.characterArcs.get(playerId);
  }

  /**
   * 更新季节性上下文
   */
  updateSeasonalContext(season: string, weather: string): void {
    this.seasonalContext = {
      season,
      weather,
      atmosphere: this.determineAtmosphere(season, weather),
      culturalEvents: this.getSeasonalCulturalEvents(season),
      timestamp: Date.now()
    };
  }

  /**
   * 分析叙述质量
   */
  analyzeNarrativeQuality(): NarrativeAnalysis {
    const recentNarrations = this.narrativeHistory.slice(-10);
    
    return {
      diversityScore: this.calculateNarrativeDiversity(recentNarrations),
      emotionalRange: this.analyzeEmotionalRange(recentNarrations),
      culturalRichness: this.analyzeCulturalRichness(recentNarrations),
      playerEngagement: this.assessPlayerEngagement(recentNarrations),
      averageLength: this.calculateAverageLength(recentNarrations),
      consistencyScore: this.calculateConsistencyScore(recentNarrations)
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.llmService) {
      this.llmService.cleanup();
    }
  }

  // 私有辅助方法

  private buildGameContext(gameState: GameState, context?: NarrationContext): GameContext {
    return {
      season: this.seasonalContext.season,
      weather: this.seasonalContext.weather,
      turn: gameState.turn || 0,
      phase: this.determineGamePhase(gameState)
    };
  }

  private buildOpeningContext(players: Player[], settings: GameSettings): GameContext {
    return {
      season: settings.startingSeason || '春',
      weather: settings.startingWeather || '晴朗',
      turn: 0,
      phase: 'opening'
    };
  }

  private buildTurnTransitionContext(
    player: Player, 
    gameState: GameState, 
    events: GameEvent[]
  ): GameContext {
    return {
      season: this.seasonalContext.season,
      weather: this.seasonalContext.weather,
      turn: gameState.turn || 0,
      phase: this.determineGamePhase(gameState),
      recentEvents: events
    };
  }

  private buildEpicEventContext(
    event: EpicGameEvent, 
    players: Player[], 
    gameState: GameState
  ): GameContext {
    return {
      season: this.seasonalContext.season,
      weather: '雷雨', // 史诗事件通常伴随戏剧性天气
      turn: gameState.turn || 0,
      phase: 'climax',
      epicEvent: event
    };
  }

  private buildEndingContext(
    winner: Player, 
    players: Player[], 
    gameState: GameState, 
    history: GameEvent[]
  ): GameContext {
    return {
      season: '冬',
      weather: '雪花纷飞',
      turn: gameState.turn || 0,
      phase: 'ending',
      gameHistory: history,
      finalRankings: this.calculateFinalRankings(players)
    };
  }

  private generateFallbackNarration(
    event: GameEvent, 
    players: Player[], 
    context: GameContext
  ): EventNarration {
    const templates = this.getNarrationTemplates(event.type);
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return {
      title: event.title,
      narration: template
        .replace('{player}', players[0]?.name || '玩家')
        .replace('{zodiac}', players[0]?.zodiac || '智者')
        .replace('{season}', context.season),
      mood: 'neutral',
      culturalElements: ['traditional'],
      visualCues: [],
      eventType: event.type,
      timestamp: Date.now()
    };
  }

  private generateFallbackOpeningStory(players: Player[], settings: GameSettings): OpeningNarration {
    return {
      title: '十二生肖大富翁传说',
      introduction: '古老的生肖智慧与现代商业相遇，一场精彩的财富之战即将开始...',
      characterIntroductions: players.map(p => `${p.name}(${p.zodiac})：准备展现生肖的智慧`),
      settingDescription: '在这片充满机遇的土地上，智慧与运气将决定最终的胜者。',
      prophecy: '传说中，最智慧的生肖将获得最终的胜利。',
      mood: 'mysterious',
      timestamp: Date.now()
    };
  }

  private generateFallbackTurnTransition(player: Player, gameState: GameState): TurnNarration {
    return {
      playerName: player.name,
      zodiac: player.zodiac,
      transitionText: `现在轮到${player.name}展现${player.zodiac}的智慧了...`,
      characterMoment: `${player.zodiac}的特质正在指引着前进的方向`,
      gamePhaseHint: '时机很重要，选择需要谨慎。',
      mood: 'focused',
      timestamp: Date.now()
    };
  }

  private generateFallbackEpicNarration(event: EpicGameEvent, players: Player[]): EpicNarration {
    return {
      eventTitle: event.title,
      epicNarration: `一个传奇的时刻降临了！${event.description}`,
      impactAnalysis: '这个事件将深刻影响所有参与者的命运。',
      characterReactions: players.map(p => `${p.name}(${p.zodiac})：对此事件感到震撼`),
      legendaryMoment: '这一刻将被载入史册。',
      consequences: ['改变游戏格局', '影响玩家策略', '创造新的机会'],
      mood: 'dramatic',
      timestamp: Date.now()
    };
  }

  private generateFallbackEndingStory(winner: Player, players: Player[]): EndingNarration {
    return {
      winnerName: winner.name,
      winnerZodiac: winner.zodiac,
      victoryNarration: `${winner.name}凭借${winner.zodiac}的智慧获得了最终的胜利！`,
      journeySummary: '这是一段充满挑战与机遇的旅程。',
      characterEpilogues: players.map(p => `${p.name}在游戏中展现了${p.zodiac}的特质`),
      finalWisdom: this.generateFinalWisdom(winner.zodiac),
      legendStatus: 'champion',
      mood: 'triumphant',
      timestamp: Date.now()
    };
  }

  // 数据处理和分析方法

  private recordNarrativeEvent(event: NarrativeEvent): void {
    this.narrativeHistory.push(event);
    
    // 限制历史记录数量
    if (this.narrativeHistory.length > 100) {
      this.narrativeHistory.shift();
    }
  }

  private updateCharacterArcs(players: Player[], event: GameEvent, narration: EventNarration): void {
    players.forEach(player => {
      let arc = this.characterArcs.get(player.id);
      if (!arc) {
        arc = this.createNewCharacterArc(player);
        this.characterArcs.set(player.id, arc);
      }

      arc.keyEvents.push({
        eventId: event.id,
        eventType: event.type,
        impact: this.calculateEventImpact(event, player),
        characterGrowth: this.assessCharacterGrowth(event, player),
        timestamp: Date.now()
      });

      arc.currentMood = narration.mood;
      arc.lastUpdated = Date.now();
    });
  }

  private createNewCharacterArc(player: Player): CharacterArc {
    return {
      playerId: player.id,
      playerName: player.name,
      zodiac: player.zodiac,
      arcType: 'hero_journey',
      keyEvents: [],
      currentMood: 'neutral',
      characterDevelopment: 0,
      relationships: new Map(),
      personalGrowth: [],
      lastUpdated: Date.now()
    };
  }

  private initializeSeasonalContext(): SeasonalContext {
    const currentMonth = new Date().getMonth();
    const seasons = ['春', '夏', '秋', '冬'];
    const season = seasons[Math.floor(currentMonth / 3)];
    
    return {
      season,
      weather: '晴朗',
      atmosphere: 'peaceful',
      culturalEvents: this.getSeasonalCulturalEvents(season),
      timestamp: Date.now()
    };
  }

  private initializeCulturalElements(): CulturalElement[] {
    return [
      { name: 'dragon', description: '龙的智慧与威严', frequency: 0.8 },
      { name: 'phoenix', description: '凤凰的重生与美丽', frequency: 0.6 },
      { name: 'taiji', description: '太极的平衡与和谐', frequency: 0.7 },
      { name: 'fortune', description: '运势的变化', frequency: 0.9 },
      { name: 'wisdom', description: '古老的智慧', frequency: 0.8 }
    ];
  }

  // 辅助计算方法

  private determineGamePhase(gameState: GameState): string {
    const turn = gameState.turn || 0;
    if (turn < 15) return 'early';
    if (turn < 45) return 'middle';
    if (turn < 60) return 'late';
    return 'ending';
  }

  private determineAtmosphere(season: string, weather: string): string {
    const atmosphereMap = {
      '春_晴朗': 'hopeful',
      '夏_炎热': 'intense',
      '秋_凉爽': 'contemplative',
      '冬_寒冷': 'challenging'
    };
    return atmosphereMap[`${season}_${weather}`] || 'neutral';
  }

  private getSeasonalCulturalEvents(season: string): string[] {
    const events = {
      '春': ['春节', '元宵节', '清明节'],
      '夏': ['端午节', '七夕节'],
      '秋': ['中秋节', '重阳节'],
      '冬': ['冬至', '腊八节', '除夕']
    };
    return events[season] || [];
  }

  private getNarrationTemplates(eventType: string): string[] {
    const templates = {
      'property_purchase': [
        '{player}运用{zodiac}的智慧，在{season}季成功购买了这块宝地。',
        '如{zodiac}般精明的{player}选择了这个绝佳的时机。'
      ],
      'trade': [
        '{player}展现了{zodiac}的交易天赋，达成了这笔重要的协议。',
        '在{season}的微风中，{player}完成了一次精彩的谈判。'
      ],
      'default': [
        '{player}按照{zodiac}的特质，做出了明智的选择。'
      ]
    };
    return templates[eventType] || templates['default'];
  }

  private calculateEventImpact(event: GameEvent, player: Player): number {
    // 简化的事件影响计算
    return Math.random() * 0.5 + 0.3; // 0.3-0.8之间
  }

  private assessCharacterGrowth(event: GameEvent, player: Player): string {
    const growthTypes = ['wisdom', 'courage', 'patience', 'strategy', 'leadership'];
    return growthTypes[Math.floor(Math.random() * growthTypes.length)];
  }

  // 更多辅助方法...
  private generateFinalWisdom(zodiac: string): string {
    const wisdom = {
      '龙': '真正的龙王不仅拥有财富，更拥有征服人心的智慧。',
      '虎': '勇猛的老虎知道，有时候最大的胜利来自于适时的等待。',
      '兔': '温和的兔子证明了，智慧和耐心比蛮力更有价值。',
      '蛇': '神秘的蛇向我们展示，深谋远虑是成功的关键。'
    };
    return wisdom[zodiac] || '每个生肖都有自己独特的智慧之路。';
  }

  private calculateNarrativeDiversity(narrations: NarrativeEvent[]): number {
    // 计算叙述多样性
    const moods = new Set(narrations.map(n => n.mood));
    return moods.size / 7; // 假设有7种基本情绪
  }

  private analyzeEmotionalRange(narrations: NarrativeEvent[]): string[] {
    return [...new Set(narrations.map(n => n.mood))];
  }

  private analyzeCulturalRichness(narrations: NarrativeEvent[]): number {
    const elements = narrations.flatMap(n => n.culturalElements || []);
    const uniqueElements = new Set(elements);
    return uniqueElements.size;
  }

  private assessPlayerEngagement(narrations: NarrativeEvent[]): number {
    // 简化的参与度评估
    return Math.random() * 0.3 + 0.7; // 0.7-1.0之间
  }

  private calculateAverageLength(narrations: NarrativeEvent[]): number {
    const totalLength = narrations.reduce((sum, n) => sum + n.narration.length, 0);
    return totalLength / Math.max(narrations.length, 1);
  }

  private calculateConsistencyScore(narrations: NarrativeEvent[]): number {
    // 简化的一致性评分
    return 0.85; // 固定值，实际应该分析风格一致性
  }
}

// 类型定义

export interface NarrationContext {
  previousEvents?: GameEvent[];
  playerRelationships?: Map<string, PlayerRelationship>;
  specialConditions?: string[];
}

export interface GameSettings {
  startingSeason?: string;
  startingWeather?: string;
  culturalTheme?: string;
  difficultyLevel?: string;
}

export interface NarrativeEvent {
  eventId: string;
  narration: string;
  timestamp: number;
  participants: string[];
  mood: string;
  culturalElements?: string[];
}

export interface CharacterArc {
  playerId: string;
  playerName: string;
  zodiac: string;
  arcType: 'hero_journey' | 'rise_and_fall' | 'redemption' | 'transformation';
  keyEvents: CharacterEvent[];
  currentMood: string;
  characterDevelopment: number;
  relationships: Map<string, number>;
  personalGrowth: string[];
  lastUpdated: number;
}

export interface CharacterEvent {
  eventId: string;
  eventType: string;
  impact: number;
  characterGrowth: string;
  timestamp: number;
}

export interface SeasonalContext {
  season: string;
  weather: string;
  atmosphere: string;
  culturalEvents: string[];
  timestamp: number;
}

export interface CulturalElement {
  name: string;
  description: string;
  frequency: number;
}

export interface OpeningNarration {
  title: string;
  introduction: string;
  characterIntroductions: string[];
  settingDescription: string;
  prophecy: string;
  mood: string;
  timestamp: number;
}

export interface TurnNarration {
  playerName: string;
  zodiac: string;
  transitionText: string;
  characterMoment: string;
  gamePhaseHint: string;
  mood: string;
  timestamp: number;
}

export interface EpicGameEvent extends GameEvent {
  epicLevel: 'legendary' | 'mythical' | 'divine';
  affectedPlayers: string[];
  worldChangingEffect: string;
}

export interface EpicNarration {
  eventTitle: string;
  epicNarration: string;
  impactAnalysis: string;
  characterReactions: string[];
  legendaryMoment: string;
  consequences: string[];
  mood: string;
  timestamp: number;
}

export interface EndingNarration {
  winnerName: string;
  winnerZodiac: string;
  victoryNarration: string;
  journeySummary: string;
  characterEpilogues: string[];
  finalWisdom: string;
  legendStatus: string;
  mood: string;
  timestamp: number;
}

export interface NarrativeAnalysis {
  diversityScore: number;
  emotionalRange: string[];
  culturalRichness: number;
  playerEngagement: number;
  averageLength: number;
  consistencyScore: number;
}