/**
 * 事件结果生成系统
 * Event Outcome Generation System
 * 
 * 基于玩家响应和计算的效果生成最终的事件结果，包括叙事文本、视觉效果和长期影响
 * Generates final event outcomes based on player responses and calculated effects, including narrative text, visual effects, and long-term impacts
 */

import { EventEmitter } from '../utils/EventEmitter';
import { 
  GameEvent, 
  EventChoice, 
  Player, 
  GameState, 
  ZodiacSign 
} from '../types/game';
import { 
  PlayerResponseInput,
  ResponseProcessingResult 
} from './PlayerResponseInputSystem';
import { 
  CalculatedEffect,
  AppliedEffect 
} from './EventEffectCalculationEngine';

export interface EventOutcome {
  id: string;
  eventId: string;
  timestamp: number;
  participants: OutcomeParticipant[];
  narrative: OutcomeNarrative;
  effects: OutcomeEffect[];
  statistics: OutcomeStatistics;
  consequences: OutcomeConsequence[];
  achievements: UnlockedAchievement[];
  visualElements: VisualElement[];
  audioElements: AudioElement[];
  metadata: OutcomeMetadata;
}

export interface OutcomeParticipant {
  playerId: string;
  playerName: string;
  zodiac: ZodiacSign;
  response: PlayerResponseInput;
  role: ParticipantRole;
  contribution: number;
  satisfaction: number;
  personalOutcome: PersonalOutcome;
}

export type ParticipantRole = 
  | 'primary_actor' | 'secondary_actor' | 'observer' 
  | 'victim' | 'beneficiary' | 'catalyst' | 'mediator';

export interface PersonalOutcome {
  resourceChanges: ResourceChange[];
  statusEffects: StatusEffectChange[];
  relationshipChanges: RelationshipChange[];
  skillImpacts: SkillImpact[];
  emotionalImpact: EmotionalImpact;
}

export interface ResourceChange {
  type: 'money' | 'property' | 'item' | 'skill_point';
  amount: number;
  source: string;
  description: string;
}

export interface StatusEffectChange {
  effectId: string;
  action: 'added' | 'removed' | 'modified';
  duration?: number;
  intensity?: number;
}

export interface RelationshipChange {
  targetPlayerId: string;
  relationshipType: 'trust' | 'cooperation' | 'competition' | 'conflict';
  change: number;
  reason: string;
}

export interface SkillImpact {
  skillId: string;
  experienceGained: number;
  cooldownModification?: number;
  temporaryBonus?: number;
}

export interface EmotionalImpact {
  mood: 'happy' | 'satisfied' | 'neutral' | 'disappointed' | 'angry';
  intensity: number;
  duration: number;
  triggers: string[];
}

export interface OutcomeNarrative {
  title: string;
  mainStory: string;
  personalStories: Map<string, string>;
  epilogue?: string;
  narrativeStyle: NarrativeStyle;
  culturalElements: CulturalElement[];
  emotionalTone: EmotionalTone;
}

export interface NarrativeStyle {
  perspective: 'third_person' | 'omniscient' | 'player_focused';
  tone: 'formal' | 'casual' | 'dramatic' | 'humorous' | 'mystical';
  length: 'brief' | 'standard' | 'detailed' | 'epic';
  includeDialogue: boolean;
  emphasizeZodiac: boolean;
}

export interface CulturalElement {
  type: 'zodiac_reference' | 'seasonal_mention' | 'traditional_saying' | 'folklore_element';
  content: string;
  significance: number;
  playerRelevance: string[];
}

export interface EmotionalTone {
  primary: 'triumphant' | 'melancholic' | 'suspenseful' | 'hopeful' | 'mysterious';
  secondary?: string;
  intensity: number;
}

export interface OutcomeEffect {
  id: string;
  type: 'immediate' | 'delayed' | 'permanent' | 'conditional';
  scope: 'personal' | 'interpersonal' | 'global' | 'environmental';
  effect: CalculatedEffect;
  triggeredBy: string;
  affectedPlayers: string[];
  visibility: 'public' | 'private' | 'hidden';
}

export interface OutcomeStatistics {
  totalParticipants: number;
  responseTime: {
    fastest: number;
    slowest: number;
    average: number;
  };
  choiceDistribution: Record<string, number>;
  satisfactionScores: Record<string, number>;
  economicImpact: EconomicImpact;
  socialImpact: SocialImpact;
}

export interface EconomicImpact {
  totalWealthChange: number;
  wealthRedistribution: number;
  marketVolatility: number;
  newOpportunities: number;
}

export interface SocialImpact {
  cooperationChange: number;
  trustChange: number;
  conflictLevel: number;
  newAlliances: number;
  brokenRelationships: number;
}

export interface OutcomeConsequence {
  id: string;
  type: 'chain_event' | 'rule_change' | 'unlock_content' | 'story_branch';
  description: string;
  triggerConditions: string[];
  timeDelay?: number;
  probability: number;
  significance: 'minor' | 'moderate' | 'major' | 'game_changing';
}

export interface UnlockedAchievement {
  achievementId: string;
  playerId: string;
  title: string;
  description: string;
  rarity: string;
  points: number;
}

export interface VisualElement {
  type: 'animation' | 'effect' | 'ui_change' | 'character_expression';
  target: string;
  duration: number;
  parameters: Record<string, any>;
  priority: number;
}

export interface AudioElement {
  type: 'sound_effect' | 'music' | 'voice_line' | 'ambient';
  soundId: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
}

export interface OutcomeMetadata {
  generationTime: number;
  complexity: number;
  randomSeed: string;
  generationMethod: 'analytical' | 'llm_assisted' | 'hybrid';
  confidence: number;
  alternativeOutcomes?: number;
  culturalAccuracy: number;
}

export interface OutcomeGenerationConfig {
  narrativeStyle: Partial<NarrativeStyle>;
  includePersonalStories: boolean;
  generateConsequences: boolean;
  calculateSatisfaction: boolean;
  includeVisualElements: boolean;
  includeAudioElements: boolean;
  maxNarrativeLength: number;
  culturalDepth: 'basic' | 'moderate' | 'deep';
  emotionalDepth: 'minimal' | 'standard' | 'rich';
}

export class EventOutcomeGenerationSystem extends EventEmitter {
  private outcomeHistory = new Map<string, EventOutcome>();
  private narrativeTemplates = new Map<string, NarrativeTemplate>();
  private culturalDatabase = new Map<string, CulturalElement[]>();
  private achievementRegistry = new Map<string, AchievementDefinition>();

  constructor(private config: OutcomeGenerationConfig = {
    narrativeStyle: { tone: 'casual', length: 'standard' },
    includePersonalStories: true,
    generateConsequences: true,
    calculateSatisfaction: true,
    includeVisualElements: true,
    includeAudioElements: true,
    maxNarrativeLength: 500,
    culturalDepth: 'moderate',
    emotionalDepth: 'standard'
  }) {
    super();
    this.initializeNarrativeTemplates();
    this.initializeCulturalDatabase();
    this.initializeAchievementRegistry();
  }

  /**
   * 生成事件结果
   */
  async generateEventOutcome(
    event: GameEvent,
    participantResponses: Map<string, ResponseProcessingResult>,
    appliedEffects: AppliedEffect[],
    gameState: GameState
  ): Promise<EventOutcome> {
    const startTime = Date.now();
    const randomSeed = this.generateRandomSeed();

    try {
      // 分析参与者
      const participants = await this.analyzeParticipants(
        event, 
        participantResponses, 
        gameState
      );

      // 生成叙事内容
      const narrative = await this.generateNarrative(
        event, 
        participants, 
        appliedEffects, 
        gameState
      );

      // 处理效果
      const outcomeEffects = await this.processOutcomeEffects(
        appliedEffects, 
        participants
      );

      // 计算统计数据
      const statistics = await this.calculateStatistics(
        participants, 
        outcomeEffects, 
        gameState
      );

      // 生成后续影响
      const consequences = this.config.generateConsequences
        ? await this.generateConsequences(event, participants, outcomeEffects)
        : [];

      // 检查成就解锁
      const achievements = await this.checkAchievements(
        participants, 
        outcomeEffects, 
        statistics
      );

      // 生成视觉元素
      const visualElements = this.config.includeVisualElements
        ? await this.generateVisualElements(event, participants, outcomeEffects)
        : [];

      // 生成音频元素
      const audioElements = this.config.includeAudioElements
        ? await this.generateAudioElements(event, narrative, statistics)
        : [];

      const outcome: EventOutcome = {
        id: `outcome_${Date.now()}_${randomSeed}`,
        eventId: event.id,
        timestamp: Date.now(),
        participants,
        narrative,
        effects: outcomeEffects,
        statistics,
        consequences,
        achievements,
        visualElements,
        audioElements,
        metadata: {
          generationTime: Date.now() - startTime,
          complexity: this.calculateComplexity(participants, outcomeEffects),
          randomSeed,
          generationMethod: 'hybrid',
          confidence: this.calculateConfidence(participants, outcomeEffects),
          culturalAccuracy: this.assessCulturalAccuracy(narrative),
          alternativeOutcomes: this.countAlternativeOutcomes(event, participants)
        }
      };

      // 缓存结果
      this.outcomeHistory.set(outcome.id, outcome);

      this.emit('outcomeGenerated', { event, outcome, participants });
      return outcome;

    } catch (error) {
      this.emit('outcomeGenerationError', { event, error });
      throw new Error(`Failed to generate outcome: ${error.message}`);
    }
  }

  /**
   * 分析参与者
   */
  private async analyzeParticipants(
    event: GameEvent,
    participantResponses: Map<string, ResponseProcessingResult>,
    gameState: GameState
  ): Promise<OutcomeParticipant[]> {
    const participants: OutcomeParticipant[] = [];

    for (const [playerId, response] of participantResponses) {
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) continue;

      const role = this.determineParticipantRole(response, event);
      const contribution = this.calculateContribution(response, event);
      const personalOutcome = await this.generatePersonalOutcome(response, player, gameState);
      
      const satisfaction = this.config.calculateSatisfaction
        ? await this.calculatePlayerSatisfaction(response, personalOutcome, player)
        : 0.5;

      participants.push({
        playerId,
        playerName: player.name,
        zodiac: player.zodiac,
        response: response.processedInput,
        role,
        contribution,
        satisfaction,
        personalOutcome
      });
    }

    return participants.sort((a, b) => b.contribution - a.contribution);
  }

  /**
   * 生成叙事内容
   */
  private async generateNarrative(
    event: GameEvent,
    participants: OutcomeParticipant[],
    effects: AppliedEffect[],
    gameState: GameState
  ): Promise<OutcomeNarrative> {
    const narrativeStyle = { ...this.getDefaultNarrativeStyle(), ...this.config.narrativeStyle };
    
    // 生成主要故事
    const mainStory = await this.generateMainStory(
      event, 
      participants, 
      effects, 
      narrativeStyle
    );

    // 生成个人故事
    const personalStories = new Map<string, string>();
    if (this.config.includePersonalStories) {
      for (const participant of participants) {
        const personalStory = await this.generatePersonalStory(
          participant, 
          event, 
          narrativeStyle
        );
        personalStories.set(participant.playerId, personalStory);
      }
    }

    // 获取文化元素
    const culturalElements = await this.getCulturalElements(
      event, 
      participants, 
      this.config.culturalDepth
    );

    // 确定情感基调
    const emotionalTone = this.determineEmotionalTone(participants, effects);

    return {
      title: this.generateNarrativeTitle(event, participants),
      mainStory,
      personalStories,
      epilogue: await this.generateEpilogue(participants, effects),
      narrativeStyle,
      culturalElements,
      emotionalTone
    };
  }

  /**
   * 生成主要故事
   */
  private async generateMainStory(
    event: GameEvent,
    participants: OutcomeParticipant[],
    effects: AppliedEffect[],
    style: NarrativeStyle
  ): Promise<string> {
    const template = this.getNarrativeTemplate(event.type, style);
    
    let story = template.opening;
    
    // 描述主要行动
    const primaryActor = participants.find(p => p.role === 'primary_actor') || participants[0];
    if (primaryActor) {
      story += this.describePlayerAction(primaryActor, event, style);
    }

    // 描述其他参与者的反应
    for (const participant of participants.slice(1)) {
      story += this.describeParticipantReaction(participant, primaryActor, style);
    }

    // 描述结果
    story += this.describeOutcomeResults(effects, participants, style);

    // 应用文化色彩
    story = this.applyCulturalFlavor(story, participants, event);

    return this.truncateToMaxLength(story);
  }

  /**
   * 生成个人故事
   */
  private async generatePersonalStory(
    participant: OutcomeParticipant,
    event: GameEvent,
    style: NarrativeStyle
  ): Promise<string> {
    let story = '';

    // 个人动机
    story += this.describePersonalMotivation(participant, event);

    // 决策过程
    story += this.describeDecisionProcess(participant, event);

    // 个人结果
    story += this.describePersonalResults(participant);

    // 生肖影响
    if (style.emphasizeZodiac) {
      story += this.addZodiacPersonalInsight(participant, event);
    }

    return story;
  }

  /**
   * 处理结果效果
   */
  private async processOutcomeEffects(
    appliedEffects: AppliedEffect[],
    participants: OutcomeParticipant[]
  ): Promise<OutcomeEffect[]> {
    const outcomeEffects: OutcomeEffect[] = [];

    for (const appliedEffect of appliedEffects) {
      const outcomeEffect: OutcomeEffect = {
        id: `outcome_effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: this.classifyEffectType(appliedEffect),
        scope: this.determineEffectScope(appliedEffect, participants),
        effect: appliedEffect.effect,
        triggeredBy: appliedEffect.playerId,
        affectedPlayers: this.getAffectedPlayers(appliedEffect, participants),
        visibility: this.determineEffectVisibility(appliedEffect)
      };

      outcomeEffects.push(outcomeEffect);
    }

    return outcomeEffects;
  }

  /**
   * 计算统计数据
   */
  private async calculateStatistics(
    participants: OutcomeParticipant[],
    effects: OutcomeEffect[],
    gameState: GameState
  ): Promise<OutcomeStatistics> {
    const responseTimes = participants.map(p => p.response.metadata.responseTime);
    const choiceDistribution: Record<string, number> = {};
    const satisfactionScores: Record<string, number> = {};

    // 统计选择分布
    for (const participant of participants) {
      const choiceId = participant.response.choiceId || 'custom';
      choiceDistribution[choiceId] = (choiceDistribution[choiceId] || 0) + 1;
      satisfactionScores[participant.playerId] = participant.satisfaction;
    }

    return {
      totalParticipants: participants.length,
      responseTime: {
        fastest: Math.min(...responseTimes),
        slowest: Math.max(...responseTimes),
        average: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      },
      choiceDistribution,
      satisfactionScores,
      economicImpact: this.calculateEconomicImpact(effects, participants),
      socialImpact: this.calculateSocialImpact(participants, effects)
    };
  }

  /**
   * 生成后续影响
   */
  private async generateConsequences(
    event: GameEvent,
    participants: OutcomeParticipant[],
    effects: OutcomeEffect[]
  ): Promise<OutcomeConsequence[]> {
    const consequences: OutcomeConsequence[] = [];

    // 基于事件结果生成链式事件
    if (this.shouldTriggerChainEvent(event, participants, effects)) {
      consequences.push(this.createChainEventConsequence(event, participants));
    }

    // 检查是否解锁新内容
    const unlockConsequences = this.checkContentUnlocks(participants, effects);
    consequences.push(...unlockConsequences);

    // 检查关系变化是否触发故事分支
    const storyBranches = this.checkStoryBranches(participants);
    consequences.push(...storyBranches);

    return consequences;
  }

  /**
   * 检查成就解锁
   */
  private async checkAchievements(
    participants: OutcomeParticipant[],
    effects: OutcomeEffect[],
    statistics: OutcomeStatistics
  ): Promise<UnlockedAchievement[]> {
    const achievements: UnlockedAchievement[] = [];

    for (const participant of participants) {
      const unlockedAchievements = await this.checkPlayerAchievements(
        participant, 
        effects, 
        statistics
      );
      achievements.push(...unlockedAchievements);
    }

    return achievements;
  }

  /**
   * 生成视觉元素
   */
  private async generateVisualElements(
    event: GameEvent,
    participants: OutcomeParticipant[],
    effects: OutcomeEffect[]
  ): Promise<VisualElement[]> {
    const visualElements: VisualElement[] = [];

    // 主要结果动画
    visualElements.push({
      type: 'animation',
      target: 'event_outcome',
      duration: 2000,
      parameters: {
        animationType: 'outcome_reveal',
        participants: participants.map(p => p.playerId),
        intensity: this.calculateVisualIntensity(effects)
      },
      priority: 10
    });

    // 个人效果动画
    for (const participant of participants) {
      if (participant.personalOutcome.resourceChanges.length > 0) {
        visualElements.push({
          type: 'effect',
          target: participant.playerId,
          duration: 1500,
          parameters: {
            effectType: 'resource_change',
            changes: participant.personalOutcome.resourceChanges
          },
          priority: 5
        });
      }
    }

    return visualElements.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 生成音频元素
   */
  private async generateAudioElements(
    event: GameEvent,
    narrative: OutcomeNarrative,
    statistics: OutcomeStatistics
  ): Promise<AudioElement[]> {
    const audioElements: AudioElement[] = [];

    // 主题音效
    audioElements.push({
      type: 'sound_effect',
      soundId: this.getOutcomeSoundEffect(event, narrative.emotionalTone),
      volume: 0.7,
      fadeIn: 500
    });

    // 背景音乐调整
    if (narrative.emotionalTone.intensity > 0.7) {
      audioElements.push({
        type: 'music',
        soundId: this.getEmotionalMusic(narrative.emotionalTone),
        volume: 0.4,
        fadeIn: 1000,
        loop: true
      });
    }

    return audioElements;
  }

  // 辅助方法实现

  private determineParticipantRole(response: ResponseProcessingResult, event: GameEvent): ParticipantRole {
    // 基于响应类型和效果确定角色
    if (response.effects.length > 0) {
      return 'primary_actor';
    }
    return 'observer';
  }

  private calculateContribution(response: ResponseProcessingResult, event: GameEvent): number {
    // 计算贡献度
    return response.effects.reduce((sum, effect) => sum + Math.abs(effect.parameters.value || 0), 0) / 100;
  }

  private async generatePersonalOutcome(
    response: ResponseProcessingResult,
    player: Player,
    gameState: GameState
  ): Promise<PersonalOutcome> {
    return {
      resourceChanges: this.extractResourceChanges(response.effects),
      statusEffects: [],
      relationshipChanges: [],
      skillImpacts: [],
      emotionalImpact: {
        mood: 'satisfied',
        intensity: 0.7,
        duration: 30000,
        triggers: ['event_participation']
      }
    };
  }

  private async calculatePlayerSatisfaction(
    response: ResponseProcessingResult,
    outcome: PersonalOutcome,
    player: Player
  ): Promise<number> {
    let satisfaction = 0.5; // 基础满意度

    // 基于资源变化调整
    const totalResourceChange = outcome.resourceChanges.reduce((sum, change) => sum + change.amount, 0);
    satisfaction += Math.min(0.3, totalResourceChange / 1000); // 正面资源变化增加满意度

    // 基于生肖兼容性调整
    satisfaction += Math.random() * 0.2 - 0.1; // 添加一些随机性

    return Math.max(0, Math.min(1, satisfaction));
  }

  private getDefaultNarrativeStyle(): NarrativeStyle {
    return {
      perspective: 'third_person',
      tone: 'casual',
      length: 'standard',
      includeDialogue: false,
      emphasizeZodiac: true
    };
  }

  private getOutcomeSoundEffect(event: GameEvent, tone: EmotionalTone): string {
    const baseSound = event.type === 'chance_card' ? 'card_reveal' : 'event_complete';
    const toneModifier = tone.intensity > 0.7 ? '_dramatic' : '';
    return `${baseSound}${toneModifier}`;
  }

  private getEmotionalMusic(tone: EmotionalTone): string {
    switch (tone.primary) {
      case 'triumphant': return 'victory_theme';
      case 'melancholic': return 'sad_theme';
      case 'suspenseful': return 'tension_theme';
      case 'hopeful': return 'uplifting_theme';
      default: return 'neutral_theme';
    }
  }

  private extractResourceChanges(effects: any[]): ResourceChange[] {
    return effects
      .filter(effect => effect.effectId === 'money' || effect.effectId === 'property')
      .map(effect => ({
        type: effect.effectId as 'money' | 'property',
        amount: effect.parameters.value || 0,
        source: effect.effectId,
        description: `${effect.effectId}变化: ${effect.parameters.value || 0}`
      }));
  }

  private generateRandomSeed(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private calculateComplexity(participants: OutcomeParticipant[], effects: OutcomeEffect[]): number {
    return participants.length + effects.length;
  }

  private calculateConfidence(participants: OutcomeParticipant[], effects: OutcomeEffect[]): number {
    // 基于参与者数量和效果一致性计算置信度
    const baseConfidence = 0.8;
    const participantFactor = Math.min(1, participants.length / 4);
    return baseConfidence * participantFactor;
  }

  private assessCulturalAccuracy(narrative: OutcomeNarrative): number {
    // 评估文化准确性
    return narrative.culturalElements.length > 0 ? 0.9 : 0.7;
  }

  private countAlternativeOutcomes(event: GameEvent, participants: OutcomeParticipant[]): number {
    // 计算可能的替代结果数量
    return event.choices?.length || 1;
  }

  // 初始化方法

  private initializeNarrativeTemplates(): void {
    // 初始化叙事模板
  }

  private initializeCulturalDatabase(): void {
    // 初始化文化数据库
  }

  private initializeAchievementRegistry(): void {
    // 初始化成就注册表
  }

  // 其他辅助方法的简化实现

  private getNarrativeTemplate(eventType: string, style: NarrativeStyle): NarrativeTemplate {
    return { opening: `在这个${eventType}事件中，`, middle: '', ending: '最终，' };
  }

  private describePlayerAction(participant: OutcomeParticipant, event: GameEvent, style: NarrativeStyle): string {
    return `${participant.playerName}(${participant.zodiac})做出了选择。`;
  }

  private describeParticipantReaction(participant: OutcomeParticipant, primaryActor: OutcomeParticipant, style: NarrativeStyle): string {
    return `${participant.playerName}对此有不同的看法。`;
  }

  private describeOutcomeResults(effects: AppliedEffect[], participants: OutcomeParticipant[], style: NarrativeStyle): string {
    return `结果是，各方都有所收获。`;
  }

  private applyCulturalFlavor(story: string, participants: OutcomeParticipant[], event: GameEvent): string {
    return story;
  }

  private truncateToMaxLength(story: string): string {
    if (story.length > this.config.maxNarrativeLength) {
      return story.substring(0, this.config.maxNarrativeLength - 3) + '...';
    }
    return story;
  }

  private describePersonalMotivation(participant: OutcomeParticipant, event: GameEvent): string {
    return `${participant.playerName}基于${participant.zodiac}的性格特点，`;
  }

  private describeDecisionProcess(participant: OutcomeParticipant, event: GameEvent): string {
    return '经过深思熟虑后做出了决定。';
  }

  private describePersonalResults(participant: OutcomeParticipant): string {
    return '最终获得了预期的结果。';
  }

  private addZodiacPersonalInsight(participant: OutcomeParticipant, event: GameEvent): string {
    return `作为${participant.zodiac}，这个选择体现了其独特的智慧。`;
  }

  private classifyEffectType(effect: AppliedEffect): 'immediate' | 'delayed' | 'permanent' | 'conditional' {
    return effect.duration ? 'delayed' : 'immediate';
  }

  private determineEffectScope(effect: AppliedEffect, participants: OutcomeParticipant[]): 'personal' | 'interpersonal' | 'global' | 'environmental' {
    return 'personal';
  }

  private getAffectedPlayers(effect: AppliedEffect, participants: OutcomeParticipant[]): string[] {
    return [effect.playerId];
  }

  private determineEffectVisibility(effect: AppliedEffect): 'public' | 'private' | 'hidden' {
    return 'public';
  }

  private calculateEconomicImpact(effects: OutcomeEffect[], participants: OutcomeParticipant[]): EconomicImpact {
    return {
      totalWealthChange: 0,
      wealthRedistribution: 0,
      marketVolatility: 0,
      newOpportunities: 0
    };
  }

  private calculateSocialImpact(participants: OutcomeParticipant[], effects: OutcomeEffect[]): SocialImpact {
    return {
      cooperationChange: 0,
      trustChange: 0,
      conflictLevel: 0,
      newAlliances: 0,
      brokenRelationships: 0
    };
  }

  private shouldTriggerChainEvent(event: GameEvent, participants: OutcomeParticipant[], effects: OutcomeEffect[]): boolean {
    return Math.random() > 0.8; // 20% 概率触发链式事件
  }

  private createChainEventConsequence(event: GameEvent, participants: OutcomeParticipant[]): OutcomeConsequence {
    return {
      id: `chain_${Date.now()}`,
      type: 'chain_event',
      description: '这个事件引发了后续反应',
      triggerConditions: [],
      probability: 0.8,
      significance: 'moderate'
    };
  }

  private checkContentUnlocks(participants: OutcomeParticipant[], effects: OutcomeEffect[]): OutcomeConsequence[] {
    return [];
  }

  private checkStoryBranches(participants: OutcomeParticipant[]): OutcomeConsequence[] {
    return [];
  }

  private async checkPlayerAchievements(participant: OutcomeParticipant, effects: OutcomeEffect[], statistics: OutcomeStatistics): Promise<UnlockedAchievement[]> {
    return [];
  }

  private calculateVisualIntensity(effects: OutcomeEffect[]): number {
    return Math.min(1, effects.length * 0.2);
  }

  private generateNarrativeTitle(event: GameEvent, participants: OutcomeParticipant[]): string {
    return `${event.title}的结果`;
  }

  private async generateEpilogue(participants: OutcomeParticipant[], effects: AppliedEffect[]): Promise<string> {
    return '故事还在继续...';
  }

  private async getCulturalElements(event: GameEvent, participants: OutcomeParticipant[], depth: string): Promise<CulturalElement[]> {
    return [];
  }

  private determineEmotionalTone(participants: OutcomeParticipant[], effects: AppliedEffect[]): EmotionalTone {
    const avgSatisfaction = participants.reduce((sum, p) => sum + p.satisfaction, 0) / participants.length;
    
    let primary: EmotionalTone['primary'] = 'hopeful';
    if (avgSatisfaction > 0.8) primary = 'triumphant';
    else if (avgSatisfaction < 0.3) primary = 'melancholic';
    
    return {
      primary,
      intensity: Math.abs(avgSatisfaction - 0.5) * 2
    };
  }

  /**
   * 获取历史结果
   */
  getOutcomeHistory(eventId?: string): EventOutcome[] {
    if (eventId) {
      return Array.from(this.outcomeHistory.values()).filter(o => o.eventId === eventId);
    }
    return Array.from(this.outcomeHistory.values());
  }

  /**
   * 获取统计信息
   */
  getStatistics(): any {
    return {
      totalOutcomes: this.outcomeHistory.size,
      averageParticipants: this.calculateAverageParticipants(),
      averageSatisfaction: this.calculateAverageSatisfaction(),
      narrativeTemplates: this.narrativeTemplates.size,
      culturalElements: this.culturalDatabase.size
    };
  }

  private calculateAverageParticipants(): number {
    const outcomes = Array.from(this.outcomeHistory.values());
    if (outcomes.length === 0) return 0;
    return outcomes.reduce((sum, o) => sum + o.participants.length, 0) / outcomes.length;
  }

  private calculateAverageSatisfaction(): number {
    const outcomes = Array.from(this.outcomeHistory.values());
    if (outcomes.length === 0) return 0;
    
    const allParticipants = outcomes.flatMap(o => o.participants);
    if (allParticipants.length === 0) return 0;
    
    return allParticipants.reduce((sum, p) => sum + p.satisfaction, 0) / allParticipants.length;
  }
}

// 辅助类型定义
interface NarrativeTemplate {
  opening: string;
  middle: string;
  ending: string;
}

interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  rarity: string;
  points: number;
  requirements: any[];
}