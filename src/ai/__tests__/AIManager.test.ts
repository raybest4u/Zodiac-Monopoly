import { AIManager } from '../AIManager';
import { AIUtils, AI_CONSTANTS } from '../index';
import type { GameState } from '../../types/game';

// Mock dependencies
jest.mock('../PersonalityFactory', () => ({
  PersonalityFactory: jest.fn().mockImplementation(() => ({
    createPersonality: jest.fn().mockResolvedValue({
      risk_tolerance: 0.5,
      aggression: 0.5,
      cooperation: 0.5,
      adaptability: 0.5,
      patience: 0.5,
      property_preference: {
        preferredTypes: ['commercial'],
        investmentFocus: 'roi',
        maxInvestmentRatio: 0.7
      },
      skill_usage_tendency: {
        aggressiveSkills: 0.5,
        defensiveSkills: 0.5,
        economicSkills: 0.7,
        timingPreference: 'mid_game'
      },
      negotiation_style: {
        style: 'cooperative',
        concessionRate: 0.5,
        bluffProbability: 0.3,
        fairnessWeight: 0.7
      },
      reaction_patterns: [],
      zodiac_traits: {
        strengths: ['test'],
        weaknesses: ['test'],
        luckyNumbers: [1, 2],
        luckyColors: ['red'],
        compatibleZodiacs: ['龙'],
        conflictZodiacs: ['狗']
      },
      cultural_preferences: ['test']
    })
  }))
}));

jest.mock('../DecisionEngine', () => ({
  DecisionEngine: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    makeDecision: jest.fn().mockImplementation((aiState, gameState) => Promise.resolve({
      action: { type: 'end_turn', playerId: aiState.id, parameters: {} },
      confidence: 0.8,
      reasoning: 'Test decision',
      alternatives: [],
      analysis: {
        gamePhase: { phase: 'middle', turnsRemaining: 50, winProbability: 0.25, strategicFocus: ['wealth_accumulation'] },
        playerPositions: [],
        economicSituation: { cashFlow: 10000, netWorth: 15000, liquidityRatio: 0.6, propertyValue: 5000, moneyRank: 1, propertyRank: 1 },
        threats: [],
        opportunities: []
      },
      strategy: {
        name: 'test_strategy',
        description: 'Test strategy',
        focus: 'wealth_accumulation',
        timeHorizon: 'medium',
        riskLevel: 'balanced',
        weights: { moneyAccumulation: 0.8, propertyAcquisition: 0.6, playerBlockade: 0.3, riskAvoidance: 0.5, opportunismWeight: 0.4 }
      },
      timestamp: Date.now()
    })),
    analyzeSituation: jest.fn().mockResolvedValue({
      gamePhase: { phase: 'middle', turnsRemaining: 50, winProbability: 0.25, strategicFocus: ['wealth_accumulation'] },
      playerPositions: [],
      economicSituation: { cashFlow: 10000, netWorth: 15000, liquidityRatio: 0.6, propertyValue: 5000, moneyRank: 1, propertyRank: 1 },
      threats: [],
      opportunities: []
    }),
    cleanup: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('../AIStateManager', () => ({
  AIStateManager: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    createAIState: jest.fn().mockImplementation((aiId) => Promise.resolve({
      id: aiId,
      personality: {},
      currentStrategy: {
        name: 'test_strategy',
        description: 'Test strategy',
        focus: 'wealth_accumulation',
        timeHorizon: 'medium',
        riskLevel: 'balanced',
        weights: { moneyAccumulation: 0.8, propertyAcquisition: 0.6, playerBlockade: 0.3, riskAvoidance: 0.5, opportunismWeight: 0.4 }
      },
      emotionalState: { mood: 'content', confidence: 0.5, frustration: 0, excitement: 0, lastMoodChange: Date.now() },
      memory: { recentEvents: [], playerRelationships: {}, strategicKnowledge: [], experienceBuffer: [] },
      learningData: { totalGames: 0, winRate: 0, averageScore: 0, strategyEffectiveness: {}, adaptationRate: 0.5 }
    })),
    removeAIState: jest.fn().mockResolvedValue(undefined),
    saveAIState: jest.fn().mockResolvedValue(undefined),
    updateEmotionalState: jest.fn().mockResolvedValue(undefined),
    updateMemory: jest.fn().mockResolvedValue(undefined),
    updateLearningData: jest.fn().mockResolvedValue(undefined),
    processGameEvent: jest.fn().mockResolvedValue(undefined),
    cleanup: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('AIManager', () => {
  let aiManager: AIManager;
  let mockGameState: GameState;

  beforeEach(async () => {
    aiManager = new AIManager({
      maxCacheSize: 10,
      enableLearning: false,
      enableAnalytics: true,
      decisionTimeout: 1000
    });

    await aiManager.initialize();

    // Create mock game state
    mockGameState = {
      gameId: 'test-game-1',
      status: 'playing',
      mode: 'classic',
      players: [
        {
          id: 'player-1',
          name: '测试玩家',
          zodiac: '龙',
          isHuman: true,
          position: 5,
          money: 15000,
          properties: ['prop-1'],
          items: [],
          skills: [],
          statusEffects: [],
          statistics: {
            turnsPlayed: 10,
            moneyEarned: 5000,
            moneySpent: 3000,
            propertiesBought: 1,
            propertiesSold: 0,
            skillsUsed: 3,
            eventsTriggered: 5,
            rentCollected: 1200,
            rentPaid: 800
          }
        },
        {
          id: 'ai-1',
          name: '小明(鼠)',
          zodiac: '鼠',
          isHuman: false,
          position: 8,
          money: 12000,
          properties: ['prop-2'],
          items: [],
          skills: [],
          statusEffects: [],
          statistics: {
            turnsPlayed: 10,
            moneyEarned: 4000,
            moneySpent: 2500,
            propertiesBought: 1,
            propertiesSold: 0,
            skillsUsed: 2,
            eventsTriggered: 3,
            rentCollected: 800,
            rentPaid: 1200
          }
        }
      ],
      currentPlayerIndex: 0,
      round: 3,
      phase: 'roll_dice',
      turn: 15,
      board: Array.from({ length: 40 }, (_, i) => ({
        id: `cell-${i}`,
        position: i,
        type: i === 0 ? 'start' as const : 'property' as const,
        name: i === 0 ? '起点' : `地产${i}`,
        color: '#4a90e2',
        description: i === 0 ? '游戏起始点' : `这是第${i}号地产`,
        price: i === 0 ? undefined : 1000 + i * 100
      })),
      eventHistory: [],
      season: '春',
      weather: '晴',
      marketTrends: {
        propertyPriceMultiplier: 1.0,
        rentMultiplier: 1.0,
        salaryBonus: 0,
        taxRate: 0.1,
        skillCooldownModifier: 1.0
      },
      startTime: Date.now() - 3600000,
      elapsedTime: 3600000,
      lastUpdateTime: Date.now()
    };
  });

  afterEach(async () => {
    await aiManager.cleanup();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const newAIManager = new AIManager();
      await expect(newAIManager.initialize()).resolves.not.toThrow();
      await newAIManager.cleanup();
    });

    test('should provide event emitter', () => {
      const eventEmitter = aiManager.getEventEmitter();
      expect(eventEmitter).toBeDefined();
      expect(typeof eventEmitter.emit).toBe('function');
    });

    test('should provide initial statistics', () => {
      const statistics = aiManager.getStatistics();
      expect(statistics).toBeDefined();
      expect(typeof statistics.totalDecisions).toBe('number');
      expect(typeof statistics.averageDecisionTime).toBe('number');
      expect(typeof statistics.confidenceLevel).toBe('number');
    });
  });

  describe('AI Opponent Management', () => {
    test('should create AI opponent successfully', async () => {
      const config = AIUtils.createDefaultAIConfig('ai-test', '测试AI', '虎', 'medium');
      
      const aiId = await aiManager.createAIOpponent(config);
      
      expect(aiId).toBe(config.id);
      
      const aiState = aiManager.getAIState(aiId);
      expect(aiState).toBeDefined();
      expect(aiState?.id).toBe(aiId);
    });

    test('should remove AI opponent successfully', async () => {
      const config = AIUtils.createDefaultAIConfig('ai-remove-test', '移除测试AI', '兔', 'easy');
      
      const aiId = await aiManager.createAIOpponent(config);
      expect(aiManager.getAIState(aiId)).toBeDefined();
      
      await aiManager.removeAIOpponent(aiId);
      expect(aiManager.getAIState(aiId)).toBeUndefined();
    });

    test('should handle multiple AI opponents', async () => {
      const configs = [
        AIUtils.createDefaultAIConfig('ai-1', 'AI 1', '鼠', 'easy'),
        AIUtils.createDefaultAIConfig('ai-2', 'AI 2', '虎', 'medium'),
        AIUtils.createDefaultAIConfig('ai-3', 'AI 3', '龙', 'hard')
      ];

      const aiIds = [];
      for (const config of configs) {
        const aiId = await aiManager.createAIOpponent(config);
        aiIds.push(aiId);
      }

      expect(aiIds).toHaveLength(3);
      
      const allStates = aiManager.getAllAIStates();
      expect(allStates.size).toBe(3);

      // Clean up
      for (const aiId of aiIds) {
        await aiManager.removeAIOpponent(aiId);
      }
    });

    test('should validate AI config', () => {
      const validConfig = AIUtils.createDefaultAIConfig('valid-ai', '有效AI', '马', 'expert');
      expect(AIUtils.validateAIConfig(validConfig)).toBe(true);

      const invalidConfig = { id: 'invalid' };
      expect(AIUtils.validateAIConfig(invalidConfig)).toBe(false);
    });
  });

  describe('Decision Making', () => {
    let aiId: string;

    beforeEach(async () => {
      const config = AIUtils.createDefaultAIConfig('decision-ai', '决策AI', '猴', 'medium');
      aiId = await aiManager.createAIOpponent(config);
    });

    test('should make single decision', async () => {
      const decision = await aiManager.makeDecision(aiId, mockGameState);
      
      expect(decision).toBeDefined();
      expect(decision.action).toBeDefined();
      expect(decision.action.type).toBeDefined();
      expect(decision.action.playerId).toBe(aiId);
      expect(typeof decision.confidence).toBe('number');
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
      expect(typeof decision.reasoning).toBe('string');
      expect(decision.timestamp).toBeDefined();
    });

    test('should make multiple decisions', async () => {
      // Add more AI opponents
      const config2 = AIUtils.createDefaultAIConfig('decision-ai-2', '决策AI2', '羊', 'hard');
      const aiId2 = await aiManager.createAIOpponent(config2);

      const decisions = await aiManager.makeMultipleDecisions([aiId, aiId2], mockGameState);
      
      expect(decisions.size).toBe(2);
      expect(decisions.has(aiId)).toBe(true);
      expect(decisions.has(aiId2)).toBe(true);

      const decision1 = decisions.get(aiId);
      const decision2 = decisions.get(aiId2);
      
      expect(decision1).toBeDefined();
      expect(decision2).toBeDefined();
      expect(decision1?.action.playerId).toBe(aiId);
      expect(decision2?.action.playerId).toBe(aiId2);
    });

    test('should handle decision context', async () => {
      const context = {
        urgency: 0.8,
        complexity: 0.6,
        stakes: 0.9,
        timeLimit: 3000
      };

      const decision = await aiManager.makeDecision(aiId, mockGameState, context);
      
      expect(decision).toBeDefined();
      expect(decision.action.playerId).toBe(aiId);
    });

    test('should handle non-existent AI', async () => {
      const decision = await aiManager.makeDecision('non-existent-ai', mockGameState);
      
      expect(decision).toBeDefined();
      expect(decision.confidence).toBeLessThan(0.5); // Should be fallback decision
    });
  });

  describe('Statistics and Analytics', () => {
    let aiId: string;

    beforeEach(async () => {
      const config = AIUtils.createDefaultAIConfig('stats-ai', '统计AI', '鸡', 'medium');
      aiId = await aiManager.createAIOpponent(config);
    });

    test('should update statistics after decisions', async () => {
      const initialStats = aiManager.getStatistics();
      const initialDecisions = initialStats.totalDecisions;

      await aiManager.makeDecision(aiId, mockGameState);

      const updatedStats = aiManager.getStatistics();
      expect(updatedStats.totalDecisions).toBe(initialDecisions + 1);
      expect(updatedStats.averageDecisionTime).toBeGreaterThanOrEqual(0);
    });

    test('should reset statistics', () => {
      const initialStats = aiManager.getStatistics();
      initialStats.totalDecisions = 10; // Simulate some decisions

      aiManager.resetStatistics();

      const resetStats = aiManager.getStatistics();
      expect(resetStats.totalDecisions).toBe(0);
      expect(resetStats.averageDecisionTime).toBe(0);
    });

    test('should calculate performance score', () => {
      const stats = {
        totalDecisions: 50,
        averageDecisionTime: 2000,
        confidenceLevel: 0.8,
        successRate: 0.7,
        cacheHitRate: 0.6
      };

      const score = AIUtils.calculatePerformanceScore(stats);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Utility Functions', () => {
    test('should get zodiac compatibility', () => {
      const compatibility1 = AIUtils.getZodiacCompatibility('鼠', '龙');
      expect(compatibility1).toBe(0.8); // Compatible

      const compatibility2 = AIUtils.getZodiacCompatibility('鼠', '马');
      expect(compatibility2).toBe(0.5); // Not specifically compatible
    });

    test('should get difficulty multiplier', () => {
      expect(AIUtils.getDifficultyMultiplier('easy')).toBe(0.7);
      expect(AIUtils.getDifficultyMultiplier('medium')).toBe(1.0);
      expect(AIUtils.getDifficultyMultiplier('hard')).toBe(1.3);
      expect(AIUtils.getDifficultyMultiplier('expert')).toBe(1.6);
      expect(AIUtils.getDifficultyMultiplier('invalid')).toBe(1.0);
    });

    test('should generate AI team', () => {
      const team = AIUtils.generateAITeam('龙', 'hard');
      
      expect(team).toHaveLength(3);
      team.forEach(ai => {
        expect(ai.id).toBeDefined();
        expect(ai.name).toBeDefined();
        expect(ai.zodiac).toBeDefined();
        expect(ai.zodiac).not.toBe('龙'); // Should not include player's zodiac
        expect(ai.difficulty).toBe('hard');
        expect(AI_CONSTANTS.ZODIAC_SIGNS.includes(ai.zodiac as any)).toBe(true);
      });

      // Check for unique zodiacs
      const zodiacs = team.map(ai => ai.zodiac);
      const uniqueZodiacs = new Set(zodiacs);
      expect(uniqueZodiacs.size).toBe(3);
    });

    test('should format decision', () => {
      const decision = {
        action: { type: 'buy_property', playerId: 'ai-1', parameters: {} },
        confidence: 0.75,
        reasoning: '这是一个好的投资机会'
      };

      const formatted = AIUtils.formatDecision(decision);
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('buy_property');
      expect(formatted).toContain('75%');
      expect(formatted).toContain('这是一个好的投资机会');
    });
  });

  describe('Constants', () => {
    test('should provide valid constants', () => {
      expect(AI_CONSTANTS.ZODIAC_SIGNS).toHaveLength(12);
      expect(AI_CONSTANTS.DIFFICULTY_LEVELS).toHaveLength(4);
      expect(AI_CONSTANTS.STRATEGY_FOCUSES.length).toBeGreaterThan(0);
      expect(AI_CONSTANTS.EMOTION_TYPES.length).toBeGreaterThan(0);
      expect(AI_CONSTANTS.PROPERTY_TYPES.length).toBeGreaterThan(0);

      expect(AI_CONSTANTS.DEFAULT_DIFFICULTY).toBe('medium');
      expect(typeof AI_CONSTANTS.DEFAULT_CONFIDENCE_THRESHOLD).toBe('number');
      expect(typeof AI_CONSTANTS.DEFAULT_DECISION_TIMEOUT).toBe('number');
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      // This test would need proper mocking to simulate initialization failures
      // For now, just ensure cleanup doesn't throw
      await expect(aiManager.cleanup()).resolves.not.toThrow();
    });

    test('should handle invalid AI removal', async () => {
      await expect(aiManager.removeAIOpponent('non-existent-ai')).rejects.toThrow();
    });

    test('should provide fallback decisions on errors', async () => {
      const decision = await aiManager.makeDecision('invalid-ai', mockGameState);
      
      expect(decision).toBeDefined();
      expect(decision.confidence).toBeLessThan(0.5);
      expect(decision.action.type).toBe('end_turn');
    });
  });
});