import { SkillSystemIntegration, DEFAULT_SKILL_SYSTEM_CONFIG } from '../SkillSystemIntegration';
import { SkillManager } from '../SkillManager';
import {
  GameState,
  Player,
  ActionResult,
  GameEffect,
  EffectType,
  EffectTarget,
  ZodiacSign as GameZodiacSign,
  Season,
  Weather,
  GamePhase,
  StatusEffect
} from '../../types/game';

interface SkillEffectTestCase {
  name: string;
  skillId: string;
  zodiac: GameZodiacSign;
  targets: string[];
  expectedEffects: {
    type: EffectType;
    target: EffectTarget;
    minValue?: number;
    maxValue?: number;
    description?: string;
  }[];
  gameStateModifications?: Partial<GameState>;
  playerModifications?: Record<string, Partial<Player>>;
  expectedValidation: boolean;
  expectedMessage?: string;
}

describe('Skill Effect and Game Rule Validation Tests', () => {
  let skillSystem: SkillSystemIntegration;
  let mockGameState: GameState;
  let testPlayers: Player[];

  beforeEach(() => {
    testPlayers = [
      {
        id: 'player1',
        name: '龙玩家',
        zodiac: '龙' as GameZodiacSign,
        isHuman: true,
        position: 0,
        money: 2000,
        properties: ['property1', 'property2'],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 5,
          moneyEarned: 500,
          moneySpent: 300,
          propertiesBought: 2,
          propertiesSold: 0,
          skillsUsed: 3,
          eventsTriggered: 2,
          rentCollected: 200,
          rentPaid: 150
        }
      },
      {
        id: 'player2',
        name: '虎玩家',
        zodiac: '虎' as GameZodiacSign,
        isHuman: false,
        position: 10,
        money: 1500,
        properties: ['property3'],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 5,
          moneyEarned: 300,
          moneySpent: 200,
          propertiesBought: 1,
          propertiesSold: 0,
          skillsUsed: 2,
          eventsTriggered: 1,
          rentCollected: 100,
          rentPaid: 250
        }
      },
      {
        id: 'player3',
        name: '兔玩家',
        zodiac: '兔' as GameZodiacSign,
        isHuman: true,
        position: 15,
        money: 800,
        properties: [],
        items: [],
        skills: [],
        statusEffects: [
          {
            id: 'protection_1',
            name: '保护',
            type: 'status',
            description: '受到保护效果',
            duration: 3,
            remainingTurns: 2,
            value: 50,
            stackable: false,
            source: 'skill'
          }
        ],
        statistics: {
          turnsPlayed: 5,
          moneyEarned: 200,
          moneySpent: 100,
          propertiesBought: 0,
          propertiesSold: 0,
          skillsUsed: 1,
          eventsTriggered: 0,
          rentCollected: 0,
          rentPaid: 200
        }
      }
    ];

    mockGameState = {
      gameId: 'validation-test-game',
      status: 'playing',
      mode: 'classic',
      players: testPlayers,
      currentPlayerIndex: 0,
      round: 3,
      phase: 'process_cell' as GamePhase,
      turn: 15,
      board: [],
      eventHistory: [],
      season: '春' as Season,
      weather: '晴' as Weather,
      marketTrends: {
        propertyPriceMultiplier: 1.2,
        rentMultiplier: 0.9,
        salaryBonus: 50,
        taxRate: 0.15,
        skillCooldownModifier: 0.8
      },
      startTime: Date.now() - 300000,
      elapsedTime: 300000,
      lastUpdateTime: Date.now()
    };

    skillSystem = new SkillSystemIntegration({
      ...DEFAULT_SKILL_SYSTEM_CONFIG,
      debugMode: true
    });

    skillSystem.activate();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Economic Effect Validation', () => {
    const economicTestCases: SkillEffectTestCase[] = [
      {
        name: '财富增长技能',
        skillId: 'wealth_growth',
        zodiac: '龙',
        targets: [],
        expectedEffects: [
          {
            type: 'money',
            target: 'self',
            minValue: 100,
            maxValue: 500
          }
        ],
        expectedValidation: true
      },
      {
        name: '资金不足时的昂贵技能',
        skillId: 'expensive_ultimate',
        zodiac: '龙',
        targets: [],
        playerModifications: {
          player1: { money: 50 }
        },
        expectedEffects: [],
        expectedValidation: false,
        expectedMessage: '资金不足'
      },
      {
        name: '租金加倍技能',
        skillId: 'rent_doubler',
        zodiac: '龙',
        targets: ['property1'],
        expectedEffects: [
          {
            type: 'property',
            target: 'self',
            description: '租金'
          }
        ],
        expectedValidation: true
      },
      {
        name: '税收减免技能',
        skillId: 'tax_reduction',
        zodiac: '兔',
        targets: [],
        expectedEffects: [
          {
            type: 'money',
            target: 'self',
            minValue: 0
          }
        ],
        expectedValidation: true
      }
    ];

    test.each(economicTestCases)('should validate $name', async (testCase) => {
      if (testCase.playerModifications) {
        Object.entries(testCase.playerModifications).forEach(([playerId, modifications]) => {
          const player = mockGameState.players.find(p => p.id === playerId);
          if (player) {
            Object.assign(player, modifications);
          }
        });
      }

      await skillSystem.onGameStart(mockGameState);

      const result = await skillSystem.useSkill(
        'player1',
        testCase.skillId,
        testCase.targets,
        mockGameState
      );

      expect(result.success).toBe(testCase.expectedValidation);

      if (testCase.expectedMessage) {
        expect(result.message).toContain(testCase.expectedMessage);
      }

      if (testCase.expectedValidation && testCase.expectedEffects.length > 0) {
        testCase.expectedEffects.forEach(expectedEffect => {
          const matchingEffect = result.effects.find(effect => 
            effect.type === expectedEffect.type && 
            effect.target === expectedEffect.target
          );

          expect(matchingEffect).toBeDefined();

          if (expectedEffect.minValue !== undefined) {
            expect(matchingEffect!.value).toBeGreaterThanOrEqual(expectedEffect.minValue);
          }

          if (expectedEffect.maxValue !== undefined) {
            expect(matchingEffect!.value).toBeLessThanOrEqual(expectedEffect.maxValue);
          }

          if (expectedEffect.description) {
            expect(matchingEffect!.description).toContain(expectedEffect.description);
          }
        });
      }
    });

    test('should handle property ownership validation', async () => {
      await skillSystem.onGameStart(mockGameState);

      const ownedPropertyResult = await skillSystem.useSkill(
        'player1',
        'property_upgrade',
        ['property1'],
        mockGameState
      );

      expect(ownedPropertyResult.success).toBe(true);

      const unownedPropertyResult = await skillSystem.useSkill(
        'player1',
        'property_upgrade',
        ['property3'],
        mockGameState
      );

      expect(unownedPropertyResult.success).toBe(false);
      expect(unownedPropertyResult.message).toContain('不拥有该物业');
    });

    test('should validate market trend effects', async () => {
      mockGameState.marketTrends.propertyPriceMultiplier = 2.0;

      await skillSystem.onGameStart(mockGameState);

      const result = await skillSystem.useSkill(
        'player1',
        'property_purchase_boost',
        [],
        mockGameState
      );

      if (result.success) {
        const propertyEffect = result.effects.find(effect => effect.type === 'property');
        expect(propertyEffect?.value).toBeGreaterThan(100);
      }
    });
  });

  describe('Combat and Status Effect Validation', () => {
    test('should validate damage calculation and reduction', async () => {
      await skillSystem.onGameStart(mockGameState);

      const protectedTargetResult = await skillSystem.useSkill(
        'player1',
        'attack_skill',
        ['player3'],
        mockGameState
      );

      if (protectedTargetResult.success) {
        const damageEffect = protectedTargetResult.effects.find(
          effect => effect.type === 'money' && effect.value < 0
        );

        if (damageEffect) {
          expect(Math.abs(damageEffect.value)).toBeLessThan(100);
        }
      }

      const unprotectedTargetResult = await skillSystem.useSkill(
        'player1',
        'attack_skill',
        ['player2'],
        mockGameState
      );

      if (unprotectedTargetResult.success) {
        const damageEffect = unprotectedTargetResult.effects.find(
          effect => effect.type === 'money' && effect.value < 0
        );

        if (damageEffect) {
          expect(Math.abs(damageEffect.value)).toBeGreaterThanOrEqual(100);
        }
      }
    });

    test('should validate status effect stacking rules', async () => {
      await skillSystem.onGameStart(mockGameState);

      const firstShieldResult = await skillSystem.useSkill(
        'player1',
        'shield_skill',
        ['player1'],
        mockGameState
      );

      expect(firstShieldResult.success).toBe(true);

      const secondShieldResult = await skillSystem.useSkill(
        'player1',
        'shield_skill',
        ['player1'],
        mockGameState
      );

      if (secondShieldResult.success) {
        const stackableEffects = secondShieldResult.effects.filter(
          effect => effect.description.includes('可叠加')
        );
        const nonStackableEffects = secondShieldResult.effects.filter(
          effect => effect.description.includes('不可叠加')
        );

        expect(stackableEffects.length + nonStackableEffects.length).toBeGreaterThan(0);
      }
    });

    test('should validate skill range and targeting', async () => {
      mockGameState.players[0].position = 0;
      mockGameState.players[1].position = 20;

      await skillSystem.onGameStart(mockGameState);

      const shortRangeResult = await skillSystem.useSkill(
        'player1',
        'short_range_skill',
        ['player2'],
        mockGameState
      );

      expect(shortRangeResult.success).toBe(false);
      expect(shortRangeResult.message).toContain('目标超出范围');

      const longRangeResult = await skillSystem.useSkill(
        'player1',
        'long_range_skill',
        ['player2'],
        mockGameState
      );

      expect(longRangeResult.success).toBe(true);
    });

    test('should validate healing overflow prevention', async () => {
      mockGameState.players[0].money = 1950;

      await skillSystem.onGameStart(mockGameState);

      const healingResult = await skillSystem.useSkill(
        'player1',
        'healing_skill',
        ['player1'],
        mockGameState
      );

      if (healingResult.success && healingResult.newGameState?.players) {
        const healedPlayer = healingResult.newGameState.players.find(p => p.id === 'player1');
        if (healedPlayer) {
          expect(healedPlayer.money).toBeLessThanOrEqual(2000);
        }
      }
    });
  });

  describe('Seasonal and Environmental Validation', () => {
    const seasonalTestCases = [
      {
        season: '春' as Season,
        weather: '雨' as Weather,
        skillId: 'wood_growth_skill',
        expectedBonus: true
      },
      {
        season: '夏' as Season,
        weather: '晴' as Weather,
        skillId: 'fire_skill',
        expectedBonus: true
      },
      {
        season: '秋' as Season,
        weather: '风' as Weather,
        skillId: 'metal_skill',
        expectedBonus: true
      },
      {
        season: '冬' as Season,
        weather: '雪' as Weather,
        skillId: 'water_skill',
        expectedBonus: true
      }
    ];

    test.each(seasonalTestCases)('should validate seasonal bonus for $season $weather', async (testCase) => {
      mockGameState.season = testCase.season;
      mockGameState.weather = testCase.weather;

      await skillSystem.onGameStart(mockGameState);

      const result = await skillSystem.useSkill(
        'player1',
        testCase.skillId,
        [],
        mockGameState
      );

      if (result.success && testCase.expectedBonus) {
        const seasonalBonus = result.effects.find(
          effect => effect.description.includes('季节加成') || effect.description.includes('天气加成')
        );
        expect(seasonalBonus).toBeDefined();
      }
    });

    test('should validate weather-dependent skill availability', async () => {
      mockGameState.weather = '雾' as Weather;

      await skillSystem.onGameStart(mockGameState);

      const fogDependentSkillResult = await skillSystem.useSkill(
        'player1',
        'mist_concealment',
        [],
        mockGameState
      );

      expect(fogDependentSkillResult.success).toBe(true);

      mockGameState.weather = '晴' as Weather;

      const sunnyWeatherResult = await skillSystem.useSkill(
        'player1',
        'mist_concealment',
        [],
        mockGameState
      );

      expect(sunnyWeatherResult.success).toBe(false);
      expect(sunnyWeatherResult.message).toContain('天气不符合');
    });

    test('should validate time-of-day restrictions', async () => {
      const currentHour = new Date().getHours();
      
      if (currentHour >= 6 && currentHour < 18) {
        const daySkillResult = await skillSystem.useSkill(
          'player1',
          'daylight_skill',
          [],
          mockGameState
        );

        expect(daySkillResult.success).toBe(true);

        const nightSkillResult = await skillSystem.useSkill(
          'player1',
          'night_skill',
          [],
          mockGameState
        );

        expect(nightSkillResult.success).toBe(false);
      } else {
        const nightSkillResult = await skillSystem.useSkill(
          'player1',
          'night_skill',
          [],
          mockGameState
        );

        expect(nightSkillResult.success).toBe(true);

        const daySkillResult = await skillSystem.useSkill(
          'player1',
          'daylight_skill',
          [],
          mockGameState
        );

        expect(daySkillResult.success).toBe(false);
      }
    });
  });

  describe('Zodiac Compatibility Validation', () => {
    const zodiacCompatibilityTests = [
      {
        caster: '龙' as GameZodiacSign,
        target: '鸡' as GameZodiacSign,
        relationship: 'compatible',
        expectedBonus: true
      },
      {
        caster: '龙' as GameZodiacSign,
        target: '狗' as GameZodiacSign,
        relationship: 'conflict',
        expectedPenalty: true
      },
      {
        caster: '虎' as GameZodiacSign,
        target: '猴' as GameZodiacSign,
        relationship: 'conflict',
        expectedPenalty: true
      },
      {
        caster: '兔' as GameZodiacSign,
        target: '狗' as GameZodiacSign,
        relationship: 'compatible',
        expectedBonus: true
      }
    ];

    test.each(zodiacCompatibilityTests)('should validate $caster -> $target compatibility', async (testCase) => {
      mockGameState.players[1].zodiac = testCase.target;

      await skillSystem.onGameStart(mockGameState);

      const casterPlayerId = mockGameState.players.find(p => p.zodiac === testCase.caster)?.id || 'player1';

      const result = await skillSystem.useSkill(
        casterPlayerId,
        'zodiac_interaction_skill',
        ['player2'],
        mockGameState
      );

      if (result.success) {
        if (testCase.expectedBonus) {
          const compatibilityBonus = result.effects.find(
            effect => effect.description.includes('生肖兼容') && effect.value > 0
          );
          expect(compatibilityBonus).toBeDefined();
        }

        if (testCase.expectedPenalty) {
          const compatibilityPenalty = result.effects.find(
            effect => effect.description.includes('生肖冲突') || effect.value < 0
          );
          expect(compatibilityPenalty).toBeDefined();
        }
      }
    });

    test('should validate zodiac synergy skills', async () => {
      mockGameState.players.push({
        id: 'player4',
        name: '蛇玩家',
        zodiac: '蛇' as GameZodiacSign,
        isHuman: false,
        position: 8,
        money: 1000,
        properties: [],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 0,
          moneyEarned: 0,
          moneySpent: 0,
          propertiesBought: 0,
          propertiesSold: 0,
          skillsUsed: 0,
          eventsTriggered: 0,
          rentCollected: 0,
          rentPaid: 0
        }
      });

      await skillSystem.onGameStart(mockGameState);

      const dragonSnakeSynergyResult = await skillSystem.useSkill(
        'player1',
        'dragon_snake_synergy',
        ['player4'],
        mockGameState
      );

      expect(dragonSnakeSynergyResult.success).toBe(true);

      if (dragonSnakeSynergyResult.success) {
        const synergyEffect = dragonSnakeSynergyResult.effects.find(
          effect => effect.description.includes('协同') || effect.description.includes('合击')
        );
        expect(synergyEffect).toBeDefined();
        expect(synergyEffect?.value).toBeGreaterThan(100);
      }
    });
  });

  describe('Game Phase and State Validation', () => {
    const phaseTestCases = [
      {
        phase: 'roll_dice' as GamePhase,
        skillId: 'dice_modifier',
        shouldSucceed: true
      },
      {
        phase: 'move_player' as GamePhase,
        skillId: 'movement_boost',
        shouldSucceed: true
      },
      {
        phase: 'process_cell' as GamePhase,
        skillId: 'cell_interaction_bonus',
        shouldSucceed: true
      },
      {
        phase: 'handle_event' as GamePhase,
        skillId: 'event_manipulation',
        shouldSucceed: true
      },
      {
        phase: 'end_turn' as GamePhase,
        skillId: 'turn_end_bonus',
        shouldSucceed: true
      },
      {
        phase: 'roll_dice' as GamePhase,
        skillId: 'movement_boost',
        shouldSucceed: false
      }
    ];

    test.each(phaseTestCases)('should validate skill usage in $phase phase', async (testCase) => {
      mockGameState.phase = testCase.phase;

      await skillSystem.onGameStart(mockGameState);

      const result = await skillSystem.useSkill(
        'player1',
        testCase.skillId,
        [],
        mockGameState
      );

      expect(result.success).toBe(testCase.shouldSucceed);

      if (!testCase.shouldSucceed) {
        expect(result.message).toContain('当前阶段无法使用');
      }
    });

    test('should validate cooldown effects across turns', async () => {
      await skillSystem.onGameStart(mockGameState);

      const initialUse = await skillSystem.useSkill('player1', 'cooldown_skill', [], mockGameState);
      expect(initialUse.success).toBe(true);

      const immediateReuse = await skillSystem.useSkill('player1', 'cooldown_skill', [], mockGameState);
      expect(immediateReuse.success).toBe(false);
      expect(immediateReuse.message).toContain('冷却中');

      for (let turn = 1; turn <= 3; turn++) {
        await skillSystem.onTurnStart('player1', mockGameState);
        await skillSystem.onTurnEnd('player1', mockGameState);
      }

      const afterCooldown = await skillSystem.useSkill('player1', 'cooldown_skill', [], mockGameState);
      expect(afterCooldown.success).toBe(true);
    });

    test('should validate skill prerequisites', async () => {
      await skillSystem.onGameStart(mockGameState);

      const missingPrereqResult = await skillSystem.useSkill(
        'player1',
        'advanced_skill_without_prereq',
        [],
        mockGameState
      );

      expect(missingPrereqResult.success).toBe(false);
      expect(missingPrereqResult.message).toContain('前置条件不满足');

      skillSystem.learnSkill('player1', 'basic_prerequisite_skill');

      const withPrereqResult = await skillSystem.useSkill(
        'player1',
        'advanced_skill_with_prereq',
        [],
        mockGameState
      );

      expect(withPrereqResult.success).toBe(true);
    });
  });

  describe('Edge Case and Error Handling', () => {
    test('should handle invalid target specifications', async () => {
      await skillSystem.onGameStart(mockGameState);

      const invalidTargetResult = await skillSystem.useSkill(
        'player1',
        'targeted_skill',
        ['nonexistent_player'],
        mockGameState
      );

      expect(invalidTargetResult.success).toBe(false);
      expect(invalidTargetResult.message).toContain('无效目标');

      const tooManyTargetsResult = await skillSystem.useSkill(
        'player1',
        'single_target_skill',
        ['player2', 'player3'],
        mockGameState
      );

      expect(tooManyTargetsResult.success).toBe(false);
      expect(tooManyTargetsResult.message).toContain('目标数量');
    });

    test('should handle extreme game state values', async () => {
      mockGameState.players[0].money = 99999999;

      await skillSystem.onGameStart(mockGameState);

      const extremeValueResult = await skillSystem.useSkill(
        'player1',
        'percentage_based_skill',
        [],
        mockGameState
      );

      if (extremeValueResult.success) {
        const effect = extremeValueResult.effects.find(effect => effect.type === 'money');
        expect(effect?.value).toBeLessThan(1000000);
      }

      mockGameState.players[0].money = -1000;

      const negativeMoneyResult = await skillSystem.useSkill(
        'player1',
        'money_cost_skill',
        [],
        mockGameState
      );

      expect(negativeMoneyResult.success).toBe(false);
      expect(negativeMoneyResult.message).toContain('资金不足');
    });

    test('should handle concurrent skill usage attempts', async () => {
      await skillSystem.onGameStart(mockGameState);

      const concurrentPromises = [
        skillSystem.useSkill('player1', 'exclusive_skill', [], mockGameState),
        skillSystem.useSkill('player1', 'exclusive_skill', [], mockGameState),
        skillSystem.useSkill('player1', 'exclusive_skill', [], mockGameState)
      ];

      const results = await Promise.all(concurrentPromises);
      const successCount = results.filter(result => result.success).length;

      expect(successCount).toBeLessThanOrEqual(1);
    });

    test('should validate skill effect overflow protection', async () => {
      await skillSystem.onGameStart(mockGameState);

      const stackingPromises = [];
      for (let i = 0; i < 10; i++) {
        stackingPromises.push(
          skillSystem.useSkill('player1', 'stackable_buff', ['player1'], mockGameState)
        );
      }

      const stackingResults = await Promise.all(stackingPromises);
      const successfulStacks = stackingResults.filter(result => result.success);

      expect(successfulStacks.length).toBeLessThanOrEqual(5);
    });
  });
});