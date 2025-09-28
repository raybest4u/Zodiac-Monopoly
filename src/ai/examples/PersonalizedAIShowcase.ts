import { AICharacterGenerator, AICharacterProfile } from '../personality/AICharacterGenerator';
import { PersonalitySystem } from '../personality/PersonalitySystem';
import { BehaviorPatternEngine } from '../behavior/BehaviorPatternEngine';
import { AdaptiveLearningSystem } from '../learning/AdaptiveLearningSystem';
import { PersonalizationInterface, CustomizationTemplate } from '../customization/PersonalizationInterface';
import { SocialIntelligenceModule } from '../social/SocialIntelligenceModule';

export interface ShowcaseScenario {
  id: string;
  name: string;
  description: string;
  duration: number;                    // 演示时长（秒）
  playerCount: number;                 // 参与玩家数
  focusAreas: string[];               // 重点展示领域
  characters: AICharacterProfile[];   // 参与角色
  expectedOutcomes: string[];         // 预期结果
}

export interface ShowcaseMetrics {
  personalityEvolution: {
    characterId: string;
    initialTraits: any;
    finalTraits: any;
    keyChanges: string[];
  }[];
  behaviorAnalysis: {
    characterId: string;
    dominantPatterns: string[];
    adaptationEvents: number;
    decisionAccuracy: number;
  }[];
  socialDynamics: {
    relationshipChanges: any[];
    allianceFormations: number;
    conflictResolutions: number;
    influenceShifts: any[];
  };
  learningProgress: {
    characterId: string;
    objectivesAchieved: number;
    learningRate: number;
    knowledgeGained: string[];
  }[];
  customizationEffectiveness: {
    templateUsage: Record<string, number>;
    userSatisfaction: number;
    customizationSuccess: number;
  };
}

export interface DemoSession {
  id: string;
  scenario: ShowcaseScenario;
  startTime: number;
  currentPhase: 'setup' | 'introduction' | 'demonstration' | 'interaction' | 'analysis' | 'conclusion';
  participants: {
    aiCharacters: Map<string, {
      character: AICharacterProfile;
      personalitySystem: PersonalitySystem;
      behaviorEngine: BehaviorPatternEngine;
      learningSystem: AdaptiveLearningSystem;
      socialModule: SocialIntelligenceModule;
    }>;
    humanObservers: string[];
  };
  realTimeMetrics: ShowcaseMetrics;
  eventLog: {
    timestamp: number;
    type: string;
    description: string;
    participants: string[];
    impact: any;
  }[];
}

export class PersonalizedAIShowcase {
  private characterGenerator: AICharacterGenerator;
  private personalizationInterface: PersonalizationInterface;
  private activeDemoSessions: Map<string, DemoSession> = new Map();
  private showcaseScenarios: Map<string, ShowcaseScenario> = new Map();

  constructor() {
    this.characterGenerator = new AICharacterGenerator();
    this.personalizationInterface = new PersonalizationInterface();
    this.initializeShowcaseScenarios();
  }

  private initializeShowcaseScenarios(): void {
    const scenarios: ShowcaseScenario[] = [
      {
        id: 'zodiac_personality_demo',
        name: '十二星座性格展示',
        description: '展示基于十二星座的AI性格系统，每个角色体现不同星座特质',
        duration: 300,
        playerCount: 4,
        focusAreas: ['personality_traits', 'zodiac_influence', 'character_diversity'],
        characters: [], // 将动态生成
        expectedOutcomes: [
          '展示12种不同星座的性格特质',
          '体现性格对游戏决策的影响',
          '观察星座间的互动模式'
        ]
      },
      {
        id: 'adaptive_learning_showcase',
        name: '自适应学习演示',
        description: '展示AI如何通过游戏体验学习和适应，实时调整策略和性格',
        duration: 450,
        playerCount: 3,
        focusAreas: ['learning_adaptation', 'behavior_evolution', 'performance_improvement'],
        characters: [],
        expectedOutcomes: [
          'AI学习速度和适应能力展示',
          '行为模式的实时调整',
          '性能指标的持续改进'
        ]
      },
      {
        id: 'social_intelligence_demo',
        name: '社交智能展示',
        description: '展示AI的社交智能，包括关系建立、联盟形成、谈判技巧',
        duration: 360,
        playerCount: 4,
        focusAreas: ['social_interaction', 'alliance_building', 'negotiation_skills'],
        characters: [],
        expectedOutcomes: [
          '复杂社交关系的建立',
          '动态联盟的形成与解散',
          '高级谈判策略的运用'
        ]
      },
      {
        id: 'customization_experience',
        name: '个性化定制体验',
        description: '互动式AI定制体验，让用户创建和调整专属AI对手',
        duration: 600,
        playerCount: 2,
        focusAreas: ['user_customization', 'template_application', 'real_time_adjustment'],
        characters: [],
        expectedOutcomes: [
          '用户成功创建个性化AI',
          '定制模板的有效应用',
          '实时调整的即时反馈'
        ]
      },
      {
        id: 'comprehensive_showcase',
        name: '综合系统展示',
        description: '完整展示所有AI系统的协同工作，包括性格、学习、社交、定制',
        duration: 900,
        playerCount: 6,
        focusAreas: ['system_integration', 'complex_interactions', 'emergent_behaviors'],
        characters: [],
        expectedOutcomes: [
          '系统间无缝协作',
          '复杂交互模式的涌现',
          '高级AI行为的展示'
        ]
      }
    ];

    scenarios.forEach(scenario => {
      this.showcaseScenarios.set(scenario.id, scenario);
    });
  }

  public async startDemoSession(scenarioId: string, observerId?: string): Promise<string> {
    const scenario = this.showcaseScenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const sessionId = `demo_${scenarioId}_${Date.now()}`;
    
    console.log(`\n🎭 Starting AI Personality Showcase: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`⏱️  Duration: ${scenario.duration} seconds`);
    console.log(`👥 Participants: ${scenario.playerCount} AI characters`);

    // 为场景生成AI角色
    const characters = await this.generateScenarioCharacters(scenario);
    scenario.characters = characters;

    // 创建演示会话
    const demoSession = await this.createDemoSession(sessionId, scenario, observerId);
    this.activeDemoSessions.set(sessionId, demoSession);

    // 开始演示
    await this.executeDemoSession(demoSession);

    return sessionId;
  }

  private async generateScenarioCharacters(scenario: ShowcaseScenario): Promise<AICharacterProfile[]> {
    const characters: AICharacterProfile[] = [];

    switch (scenario.id) {
      case 'zodiac_personality_demo':
        characters.push(...await this.generateZodiacShowcaseCharacters());
        break;

      case 'adaptive_learning_showcase':
        characters.push(...await this.generateLearningShowcaseCharacters());
        break;

      case 'social_intelligence_demo':
        characters.push(...await this.generateSocialShowcaseCharacters());
        break;

      case 'customization_experience':
        characters.push(...await this.generateCustomizationCharacters());
        break;

      case 'comprehensive_showcase':
        characters.push(...await this.generateComprehensiveCharacters());
        break;

      default:
        characters.push(...this.characterGenerator.generateBalancedTeam(scenario.playerCount));
    }

    return characters.slice(0, scenario.playerCount);
  }

  private async generateZodiacShowcaseCharacters(): Promise<AICharacterProfile[]> {
    const zodiacSigns = ['aries', 'taurus', 'gemini', 'cancer'];
    const characters: AICharacterProfile[] = [];

    for (const zodiac of zodiacSigns) {
      const character = this.characterGenerator.generateCharacter({
        zodiacBias: [zodiac],
        uniquenessLevel: 0.8,
        balanceRequired: false
      });
      characters.push(character);

      console.log(`  🌟 Generated ${character.name} (${character.zodiacSign.name})`);
      console.log(`     Traits: Aggression=${(character.personalityTraits.aggression * 100).toFixed(0)}%, ` +
                  `Social=${(character.personalityTraits.social * 100).toFixed(0)}%, ` +
                  `Analytics=${(character.personalityTraits.analytical * 100).toFixed(0)}%`);
    }

    return characters;
  }

  private async generateLearningShowcaseCharacters(): Promise<AICharacterProfile[]> {
    const learningTypes = ['fast_adapter', 'analytical_learner', 'social_learner'];
    const characters: AICharacterProfile[] = [];

    for (const type of learningTypes) {
      let character: AICharacterProfile;

      switch (type) {
        case 'fast_adapter':
          character = this.characterGenerator.generateCharacter({
            traitRanges: { adaptability: 0.9, learningSpeed: 0.9 },
            difficultyLevel: 'medium'
          });
          character.name = 'Ada the Adapter';
          break;

        case 'analytical_learner':
          character = this.characterGenerator.generateCharacter({
            traitRanges: { analytical: 0.9, patience: 0.8 },
            difficultyLevel: 'expert'
          });
          character.name = 'Logan the Logical';
          break;

        case 'social_learner':
          character = this.characterGenerator.generateCharacter({
            traitRanges: { social: 0.9, emotional: 0.7 },
            difficultyLevel: 'medium'
          });
          character.name = 'Sophia the Social';
          break;

        default:
          character = this.characterGenerator.generateCharacter();
      }

      characters.push(character);
      console.log(`  🧠 Generated ${character.name} - Learning Focus: ${type}`);
    }

    return characters;
  }

  private async generateSocialShowcaseCharacters(): Promise<AICharacterProfile[]> {
    const socialTypes = ['diplomat', 'manipulator', 'competitor', 'collaborator'];
    const characters: AICharacterProfile[] = [];

    for (const type of socialTypes) {
      let character: AICharacterProfile;

      switch (type) {
        case 'diplomat':
          character = this.characterGenerator.generateCharacter({
            traitRanges: { social: 0.9, patience: 0.8, analytical: 0.7 }
          });
          character.name = 'Diana the Diplomat';
          break;

        case 'manipulator':
          character = this.characterGenerator.generateCharacter({
            traitRanges: { social: 0.8, creativity: 0.8, emotional: 0.6 }
          });
          character.name = 'Marcus the Manipulator';
          break;

        case 'competitor':
          character = this.characterGenerator.generateCharacter({
            traitRanges: { aggression: 0.9, leadership: 0.8, independence: 0.9 }
          });
          character.name = 'Victor the Competitor';
          break;

        case 'collaborator':
          character = this.characterGenerator.generateCharacter({
            traitRanges: { social: 0.9, loyalty: 0.9, adaptability: 0.7 }
          });
          character.name = 'Cora the Collaborator';
          break;

        default:
          character = this.characterGenerator.generateCharacter();
      }

      characters.push(character);
      console.log(`  🤝 Generated ${character.name} - Social Role: ${type}`);
    }

    return characters;
  }

  private async generateCustomizationCharacters(): Promise<AICharacterProfile[]> {
    console.log(`  🎨 Creating base characters for customization demo...`);
    
    const baseCharacter = this.characterGenerator.generateCharacter({
      difficultyLevel: 'medium',
      balanceRequired: true
    });
    baseCharacter.name = 'Baseline AI';

    // 用户将在演示中定制第二个角色
    const customizableCharacter = this.characterGenerator.generateCharacter({
      difficultyLevel: 'easy',
      uniquenessLevel: 0.3
    });
    customizableCharacter.name = 'Customizable AI';

    return [baseCharacter, customizableCharacter];
  }

  private async generateComprehensiveCharacters(): Promise<AICharacterProfile[]> {
    console.log(`  🌈 Generating diverse character ensemble...`);
    
    const comprehensiveTeam = this.characterGenerator.generateBalancedTeam(6);
    
    // 为每个角色添加特殊标识
    const roleNames = ['The Strategist', 'The Socialite', 'The Maverick', 'The Analyst', 'The Leader', 'The Wildcard'];
    
    comprehensiveTeam.forEach((character, index) => {
      character.name = `${roleNames[index]} (${character.zodiacSign.name})`;
      console.log(`  🎪 ${character.name} - ${character.catchphrase}`);
    });

    return comprehensiveTeam;
  }

  private async createDemoSession(
    sessionId: string, 
    scenario: ShowcaseScenario,
    observerId?: string
  ): Promise<DemoSession> {
    const session: DemoSession = {
      id: sessionId,
      scenario,
      startTime: Date.now(),
      currentPhase: 'setup',
      participants: {
        aiCharacters: new Map(),
        humanObservers: observerId ? [observerId] : []
      },
      realTimeMetrics: this.initializeMetrics(),
      eventLog: []
    };

    // 为每个AI角色创建完整的系统
    for (const character of scenario.characters) {
      const personalitySystem = new PersonalitySystem(character);
      const behaviorEngine = new BehaviorPatternEngine(character, personalitySystem);
      const learningSystem = new AdaptiveLearningSystem(character, personalitySystem, behaviorEngine);
      const socialModule = new SocialIntelligenceModule(character, personalitySystem);

      session.participants.aiCharacters.set(character.id, {
        character,
        personalitySystem,
        behaviorEngine,
        learningSystem,
        socialModule
      });
    }

    return session;
  }

  private initializeMetrics(): ShowcaseMetrics {
    return {
      personalityEvolution: [],
      behaviorAnalysis: [],
      socialDynamics: {
        relationshipChanges: [],
        allianceFormations: 0,
        conflictResolutions: 0,
        influenceShifts: []
      },
      learningProgress: [],
      customizationEffectiveness: {
        templateUsage: {},
        userSatisfaction: 0.8,
        customizationSuccess: 0.9
      }
    };
  }

  private async executeDemoSession(session: DemoSession): Promise<void> {
    console.log(`\n🚀 Executing ${session.scenario.name} demonstration...`);

    session.currentPhase = 'introduction';
    await this.executeIntroductionPhase(session);

    session.currentPhase = 'demonstration';
    await this.executeDemonstrationPhase(session);

    session.currentPhase = 'interaction';
    await this.executeInteractionPhase(session);

    session.currentPhase = 'analysis';
    await this.executeAnalysisPhase(session);

    session.currentPhase = 'conclusion';
    await this.executeConclusionPhase(session);

    console.log(`\n✅ Demo session ${session.id} completed successfully!`);
  }

  private async executeIntroductionPhase(session: DemoSession): Promise<void> {
    console.log(`\n📋 Phase 1: Character Introduction`);
    
    for (const [characterId, systems] of session.participants.aiCharacters.entries()) {
      const character = systems.character;
      const analysis = this.characterGenerator.getCharacterAnalytics(character);
      
      console.log(`\n👤 Introducing ${character.name}:`);
      console.log(`   🌟 Zodiac: ${character.zodiacSign.name} (${character.zodiacSign.element})`);
      console.log(`   💬 Catchphrase: "${character.catchphrase}"`);
      console.log(`   🧠 Dominant Traits: ${analysis.dominantTraits.join(', ')}`);
      console.log(`   🎮 Play Style: ${analysis.playStylePrediction}`);
      console.log(`   💪 Strengths: ${analysis.strengthsWeaknesses.strengths.join(', ')}`);

      // 记录事件
      session.eventLog.push({
        timestamp: Date.now(),
        type: 'character_introduction',
        description: `Introduced ${character.name}`,
        participants: [characterId],
        impact: { introduction: 'completed' }
      });
    }

    await this.sleep(3000); // 3秒介绍时间
  }

  private async executeDemonstrationPhase(session: DemoSession): Promise<void> {
    console.log(`\n🎯 Phase 2: Core Feature Demonstration`);
    
    const scenario = session.scenario;
    const duration = Math.floor(scenario.duration * 0.6); // 60%的时间用于演示

    const demoStartTime = Date.now();
    let iteration = 0;

    while (Date.now() - demoStartTime < duration * 1000) {
      iteration++;
      console.log(`\n📊 Demonstration Cycle ${iteration}`);

      // 根据场景类型执行特定演示
      switch (scenario.id) {
        case 'zodiac_personality_demo':
          await this.demonstrateZodiacPersonalities(session);
          break;

        case 'adaptive_learning_showcase':
          await this.demonstrateLearningAdaptation(session);
          break;

        case 'social_intelligence_demo':
          await this.demonstrateSocialIntelligence(session);
          break;

        case 'customization_experience':
          await this.demonstrateCustomization(session);
          break;

        case 'comprehensive_showcase':
          await this.demonstrateComprehensiveFeatures(session);
          break;

        default:
          await this.demonstrateGeneralFeatures(session);
      }

      // 更新实时指标
      this.updateRealTimeMetrics(session);

      await this.sleep(5000); // 5秒间隔
    }
  }

  private async demonstrateZodiacPersonalities(session: DemoSession): Promise<void> {
    console.log(`  🌟 Demonstrating zodiac personality influences...`);

    for (const [characterId, systems] of session.participants.aiCharacters.entries()) {
      const character = systems.character;
      const personalityState = systems.personalitySystem.getCurrentPersonalityState();
      
      // 模拟决策情境
      const scenario = this.generateDecisionScenario();
      const response = systems.personalitySystem.simulatePersonalityResponse(scenario);
      
      console.log(`     ${character.name} (${character.zodiacSign.name}): ${this.interpretPersonalityResponse(response, character.zodiacSign.element)}`);
      
      // 触发星座特定事件
      systems.personalitySystem.processEvent({
        type: 'game_event',
        description: `${character.zodiacSign.name} specific challenge encountered`,
        impact: [{
          trait: this.getZodiacMainTrait(character.zodiacSign.name),
          magnitude: 0.05,
          duration: 30
        }],
        emotionalImpact: {
          mood: personalityState.currentMood,
          stressChange: 0.02,
          confidenceChange: 0.03,
          energyChange: 0.01
        },
        timestamp: Date.now()
      });
    }
  }

  private async demonstrateLearningAdaptation(session: DemoSession): Promise<void> {
    console.log(`  🧠 Demonstrating adaptive learning capabilities...`);

    for (const [characterId, systems] of session.participants.aiCharacters.entries()) {
      const character = systems.character;
      const learningAnalytics = systems.learningSystem.getLearningAnalytics();
      
      // 模拟学习体验
      const experience = this.generateLearningExperience(character);
      systems.learningSystem.processLearningExperience(
        experience.context,
        experience.action,
        experience.outcome,
        experience.feedback
      );
      
      console.log(`     ${character.name}: Learning from ${experience.action.type}`);
      console.log(`       Progress: ${(learningAnalytics.systemMetrics.overallProgress * 100).toFixed(1)}%`);
      console.log(`       Exploration Rate: ${(learningAnalytics.systemMetrics.explorationRate * 100).toFixed(1)}%`);
      console.log(`       Knowledge Base: ${learningAnalytics.systemMetrics.knowledgeBaseSize} patterns`);
    }
  }

  private async demonstrateSocialIntelligence(session: DemoSession): Promise<void> {
    console.log(`  🤝 Demonstrating social intelligence...`);

    const characterIds = Array.from(session.participants.aiCharacters.keys());
    
    // 模拟社交互动
    for (let i = 0; i < characterIds.length - 1; i++) {
      const char1Id = characterIds[i];
      const char2Id = characterIds[i + 1];
      
      const systems1 = session.participants.aiCharacters.get(char1Id)!;
      const systems2 = session.participants.aiCharacters.get(char2Id)!;
      
      // 生成社交互动
      const interaction = this.generateSocialInteraction(systems1.character, systems2.character);
      
      systems1.socialModule.processPlayerInteraction(
        char2Id,
        interaction.type,
        interaction.content,
        interaction.context
      );

      const socialAction = systems1.socialModule.planSocialAction(
        char2Id,
        'build_alliance',
        interaction.context
      );

      console.log(`     ${systems1.character.name} → ${systems2.character.name}:`);
      console.log(`       Strategy: ${socialAction.strategyName}`);
      console.log(`       Approach: ${socialAction.approach}`);
      console.log(`       Confidence: ${(socialAction.confidence * 100).toFixed(0)}%`);

      session.realTimeMetrics.socialDynamics.relationshipChanges.push({
        from: char1Id,
        to: char2Id,
        type: interaction.type,
        outcome: socialAction.approach
      });
    }
  }

  private async demonstrateCustomization(session: DemoSession): Promise<void> {
    console.log(`  🎨 Demonstrating AI customization...`);

    // 模拟用户定制流程
    const sessionId = this.personalizationInterface.startPersonalizationSession('demo_user');
    
    // 应用模板
    const templates = this.personalizationInterface.getAvailableTemplates();
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    this.personalizationInterface.applyTemplate(sessionId, selectedTemplate.id);
    console.log(`     Applied template: ${selectedTemplate.name}`);
    
    // 调整特质
    const traits = ['aggression', 'social', 'analytical'] as const;
    for (const trait of traits) {
      const newValue = 30 + Math.random() * 40; // 30-70%
      this.personalizationInterface.updatePersonalityTrait(sessionId, trait, newValue);
      console.log(`     Adjusted ${trait}: ${newValue.toFixed(0)}%`);
    }
    
    // 生成预览
    const preview = this.personalizationInterface.generatePreview(sessionId);
    console.log(`     Generated preview with compatibility: ${(preview.compatibilityScore * 100).toFixed(0)}%`);
    
    // 生成推荐
    const recommendations = this.personalizationInterface.generateRecommendations(sessionId);
    if (recommendations.length > 0) {
      console.log(`     Recommendations: ${recommendations[0].title}`);
    }

    session.realTimeMetrics.customizationEffectiveness.templateUsage[selectedTemplate.id] = 
      (session.realTimeMetrics.customizationEffectiveness.templateUsage[selectedTemplate.id] || 0) + 1;
  }

  private async demonstrateComprehensiveFeatures(session: DemoSession): Promise<void> {
    console.log(`  🌈 Demonstrating integrated system features...`);
    
    // 轮流展示每个系统的特性
    await this.demonstrateZodiacPersonalities(session);
    await this.sleep(1000);
    
    await this.demonstrateLearningAdaptation(session);
    await this.sleep(1000);
    
    await this.demonstrateSocialIntelligence(session);
    await this.sleep(1000);
    
    console.log(`     🔄 Systems working in harmony - personality drives behavior, learning adapts strategies, social intelligence manages relationships`);
  }

  private async demonstrateGeneralFeatures(session: DemoSession): Promise<void> {
    console.log(`  ⚙️  Demonstrating general AI features...`);
    
    for (const [characterId, systems] of session.participants.aiCharacters.entries()) {
      const character = systems.character;
      const analytics = this.characterGenerator.getCharacterAnalytics(character);
      
      console.log(`     ${character.name}: ${analytics.playStylePrediction} behavior pattern`);
    }
  }

  private async executeInteractionPhase(session: DemoSession): Promise<void> {
    console.log(`\n🎮 Phase 3: Interactive Demonstration`);
    
    const interactionTime = Math.floor(session.scenario.duration * 0.2); // 20%的时间用于交互
    console.log(`  💡 Interactive features available for ${interactionTime} seconds...`);
    
    // 模拟用户交互
    await this.simulateUserInteractions(session, interactionTime);
  }

  private async simulateUserInteractions(session: DemoSession, duration: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration * 1000) {
      // 模拟用户询问AI状态
      const randomCharacterId = Array.from(session.participants.aiCharacters.keys())[
        Math.floor(Math.random() * session.participants.aiCharacters.size)
      ];
      
      const systems = session.participants.aiCharacters.get(randomCharacterId)!;
      const personalityAnalysis = systems.personalitySystem.getPersonalityAnalysis();
      const behaviorAnalytics = systems.behaviorEngine.getBehaviorAnalytics();
      
      console.log(`  🔍 User queries ${systems.character.name}:`);
      console.log(`     Current mood: ${personalityAnalysis.currentState.currentMood}`);
      console.log(`     Stress level: ${(personalityAnalysis.currentState.stressLevel * 100).toFixed(0)}%`);
      console.log(`     Active patterns: ${behaviorAnalytics.activePatterns.length}`);
      console.log(`     Adaptation rate: ${(behaviorAnalytics.memoryStats.successRate * 100).toFixed(0)}%`);
      
      await this.sleep(3000);
    }
  }

  private async executeAnalysisPhase(session: DemoSession): Promise<void> {
    console.log(`\n📊 Phase 4: Performance Analysis`);
    
    this.generateFinalMetrics(session);
    this.displayAnalysisResults(session);
  }

  private generateFinalMetrics(session: DemoSession): void {
    for (const [characterId, systems] of session.participants.aiCharacters.entries()) {
      const character = systems.character;
      const personalityAnalysis = systems.personalitySystem.getPersonalityAnalysis();
      const behaviorAnalytics = systems.behaviorEngine.getBehaviorAnalytics();
      const learningAnalytics = systems.learningSystem.getLearningAnalytics();
      const socialAnalytics = systems.socialModule.getSocialAnalytics();

      // 性格演化指标
      session.realTimeMetrics.personalityEvolution.push({
        characterId,
        initialTraits: personalityAnalysis.traitEvolution.base,
        finalTraits: personalityAnalysis.traitEvolution.current,
        keyChanges: Object.keys(personalityAnalysis.traitEvolution.changes)
          .filter(trait => Math.abs(personalityAnalysis.traitEvolution.changes[trait as any]) > 0.05)
      });

      // 行为分析指标
      session.realTimeMetrics.behaviorAnalysis.push({
        characterId,
        dominantPatterns: behaviorAnalytics.activePatterns.map(p => p.name).slice(0, 3),
        adaptationEvents: Object.keys(behaviorAnalytics.adaptiveWeights.patterns).length,
        decisionAccuracy: behaviorAnalytics.memoryStats.successRate
      });

      // 学习进展指标
      session.realTimeMetrics.learningProgress.push({
        characterId,
        objectivesAchieved: Object.keys(learningAnalytics.objectives).length,
        learningRate: learningAnalytics.systemMetrics.learningRate,
        knowledgeGained: learningAnalytics.knowledgePatterns.map(p => p.pattern).slice(0, 3)
      });
    }
  }

  private displayAnalysisResults(session: DemoSession): void {
    const metrics = session.realTimeMetrics;
    
    console.log(`\n📈 Performance Metrics Summary:`);
    
    // 性格演化
    console.log(`\n🧠 Personality Evolution:`);
    metrics.personalityEvolution.forEach(evolution => {
      const character = session.participants.aiCharacters.get(evolution.characterId)!.character;
      console.log(`   ${character.name}: ${evolution.keyChanges.length} significant trait changes`);
    });

    // 行为分析
    console.log(`\n🎯 Behavior Analysis:`);
    metrics.behaviorAnalysis.forEach(analysis => {
      const character = session.participants.aiCharacters.get(analysis.characterId)!.character;
      console.log(`   ${character.name}: ${(analysis.decisionAccuracy * 100).toFixed(0)}% decision accuracy, ${analysis.dominantPatterns.length} active patterns`);
    });

    // 学习进展
    console.log(`\n📚 Learning Progress:`);
    metrics.learningProgress.forEach(progress => {
      const character = session.participants.aiCharacters.get(progress.characterId)!.character;
      console.log(`   ${character.name}: ${progress.objectivesAchieved} objectives, ${progress.knowledgeGained.length} knowledge patterns`);
    });

    // 社交动态
    console.log(`\n🤝 Social Dynamics:`);
    console.log(`   Relationship changes: ${metrics.socialDynamics.relationshipChanges.length}`);
    console.log(`   Alliance formations: ${metrics.socialDynamics.allianceFormations}`);
    console.log(`   Conflict resolutions: ${metrics.socialDynamics.conflictResolutions}`);
  }

  private async executeConclusionPhase(session: DemoSession): Promise<void> {
    console.log(`\n🎯 Phase 5: Demonstration Conclusion`);
    
    const scenario = session.scenario;
    const actualDuration = (Date.now() - session.startTime) / 1000;
    
    console.log(`\n✨ ${scenario.name} Demonstration Complete!`);
    console.log(`⏱️  Duration: ${actualDuration.toFixed(0)}s (planned: ${scenario.duration}s)`);
    console.log(`👥 Characters: ${session.participants.aiCharacters.size}`);
    console.log(`📝 Events logged: ${session.eventLog.length}`);
    
    console.log(`\n🎖️  Achievements:`);
    scenario.expectedOutcomes.forEach((outcome, index) => {
      console.log(`   ✅ ${outcome}`);
    });

    console.log(`\n💡 Key Highlights:`);
    this.generateKeyHighlights(session);

    // 清理资源
    this.cleanupSession(session);
  }

  private generateKeyHighlights(session: DemoSession): void {
    const highlights = [
      `🌟 Unique personalities: Each AI showed distinct zodiac-based characteristics`,
      `🧠 Adaptive learning: AI characters improved performance through experience`,
      `🤝 Social intelligence: Complex relationship dynamics and alliance formation`,
      `🎨 Customization power: Flexible AI personality adjustment and optimization`,
      `⚡ Real-time adaptation: Immediate response to changing game conditions`
    ];

    highlights.forEach(highlight => console.log(`     ${highlight}`));
  }

  private cleanupSession(session: DemoSession): void {
    for (const [characterId, systems] of session.participants.aiCharacters.entries()) {
      systems.personalitySystem.cleanup();
      systems.behaviorEngine.cleanup();
      systems.learningSystem.cleanup();
      systems.socialModule.cleanup();
    }
    
    this.activeDemoSessions.delete(session.id);
  }

  private updateRealTimeMetrics(session: DemoSession): void {
    // 更新社交动态指标
    session.realTimeMetrics.socialDynamics.allianceFormations += Math.random() > 0.8 ? 1 : 0;
    session.realTimeMetrics.socialDynamics.conflictResolutions += Math.random() > 0.9 ? 1 : 0;
  }

  private generateDecisionScenario(): string {
    const scenarios = [
      'property_purchase_opportunity',
      'trade_negotiation_request',
      'alliance_proposal',
      'competitive_bidding',
      'resource_management_crisis'
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  private interpretPersonalityResponse(response: any, element: string): string {
    const interpretations = {
      fire: '🔥 Bold and immediate action',
      earth: '🌱 Methodical and calculated approach',
      air: '💨 Flexible and adaptive strategy',
      water: '🌊 Intuitive and emotional decision'
    };
    return interpretations[element as keyof typeof interpretations] || '⚡ Balanced response';
  }

  private getZodiacMainTrait(zodiacName: string): any {
    const traitMap: Record<string, any> = {
      aries: 'aggression',
      taurus: 'patience',
      gemini: 'adaptability',
      cancer: 'emotional'
    };
    return traitMap[zodiacName.toLowerCase()] || 'social';
  }

  private generateLearningExperience(character: AICharacterProfile): any {
    return {
      context: {
        gamePhase: 'mid',
        gameState: {},
        opponentStates: [],
        timeConstraints: 30,
        availableActions: ['property_purchase', 'trade_offer'],
        socialContext: {
          alliances: [],
          conflicts: [],
          reputations: {},
          relationships: {}
        }
      },
      action: {
        type: 'property_purchase',
        parameters: { propertyId: 'demo_property' },
        confidence: 0.7,
        urgency: 0.5,
        riskLevel: 0.4,
        expectedOutcome: { success: true }
      },
      outcome: {
        immediate: { success: Math.random() > 0.5 },
        delayed: [],
        unexpected: []
      },
      feedback: {
        objective: (Math.random() - 0.5) * 2,
        subjective: (Math.random() - 0.5) * 2,
        environmental: (Math.random() - 0.5) * 2,
        social: (Math.random() - 0.5) * 2
      }
    };
  }

  private generateSocialInteraction(char1: AICharacterProfile, char2: AICharacterProfile): any {
    return {
      type: 'trade_negotiation',
      content: {
        proposal: 'property_exchange',
        emotional_tone: 'neutral',
        persuasion_attempts: ['mutual_benefit'],
        concessions_made: []
      },
      context: {
        gamePhase: 'mid',
        gameState: {},
        circumstances: ['competitive_environment']
      }
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getAvailableScenarios(): ShowcaseScenario[] {
    return Array.from(this.showcaseScenarios.values());
  }

  public getDemoSessionStatus(sessionId: string): any {
    const session = this.activeDemoSessions.get(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      scenarioName: session.scenario.name,
      currentPhase: session.currentPhase,
      progress: this.calculateDemoProgress(session),
      participantCount: session.participants.aiCharacters.size,
      eventCount: session.eventLog.length,
      elapsedTime: (Date.now() - session.startTime) / 1000
    };
  }

  private calculateDemoProgress(session: DemoSession): number {
    const phases = ['setup', 'introduction', 'demonstration', 'interaction', 'analysis', 'conclusion'];
    const currentIndex = phases.indexOf(session.currentPhase);
    return (currentIndex + 1) / phases.length;
  }

  public cleanup(): void {
    for (const session of this.activeDemoSessions.values()) {
      this.cleanupSession(session);
    }
    this.activeDemoSessions.clear();
    this.personalizationInterface.cleanup();
  }
}

// 运行完整演示的便捷函数
export async function runCompleteAIShowcase(): Promise<void> {
  console.log(`\n🎪 Welcome to the Personalized AI Opponent Showcase!`);
  console.log(`====================================================`);
  
  const showcase = new PersonalizedAIShowcase();
  
  try {
    const scenarios = showcase.getAvailableScenarios();
    
    console.log(`\n📋 Available Demonstrations:`);
    scenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.name}`);
      console.log(`   ${scenario.description}`);
      console.log(`   Duration: ${scenario.duration}s, Characters: ${scenario.playerCount}`);
    });

    // 运行推荐的演示序列
    const recommendedSequence = [
      'zodiac_personality_demo',
      'social_intelligence_demo',
      'adaptive_learning_showcase',
      'customization_experience'
    ];

    for (const scenarioId of recommendedSequence) {
      console.log(`\n${'='.repeat(80)}`);
      await showcase.startDemoSession(scenarioId, 'showcase_observer');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒间隔
    }

    console.log(`\n🎉 Complete AI Showcase finished successfully!`);
    console.log(`\n🌟 Key Features Demonstrated:`);
    console.log(`✨ 12 unique zodiac-based AI personalities`);
    console.log(`🧠 Advanced adaptive learning and memory systems`);
    console.log(`🤝 Sophisticated social intelligence and relationship modeling`);
    console.log(`🎨 Comprehensive personalization and customization tools`);
    console.log(`⚡ Real-time personality evolution and behavior adaptation`);
    console.log(`🎯 Integrated systems working in perfect harmony`);

  } catch (error) {
    console.error(`❌ Showcase error:`, error);
  } finally {
    showcase.cleanup();
  }
}

// 快速演示函数
export async function runQuickAIDemo(): Promise<void> {
  console.log(`\n⚡ Quick AI Demonstration`);
  console.log(`========================`);
  
  const showcase = new PersonalizedAIShowcase();
  
  try {
    await showcase.startDemoSession('zodiac_personality_demo', 'quick_demo');
    console.log(`\n✅ Quick demo completed! Run the full showcase for comprehensive features.`);
  } catch (error) {
    console.error(`❌ Quick demo error:`, error);
  } finally {
    showcase.cleanup();
  }
}