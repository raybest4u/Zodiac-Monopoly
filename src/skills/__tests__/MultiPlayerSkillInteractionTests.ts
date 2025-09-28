import { SkillSystemIntegration, DEFAULT_SKILL_SYSTEM_CONFIG } from '../SkillSystemIntegration';
import {
  GameState,
  Player,
  ActionResult,
  ZodiacSign as GameZodiacSign,
  Season,
  Weather,
  GamePhase,
  StatusEffect,
  TradeOffer,
  TradeStatus
} from '../../types/game';

interface MultiPlayerTestScenario {
  name: string;
  players: Array<{
    id: string;
    zodiac: GameZodiacSign;
    initialMoney: number;
    initialPosition: number;
    initialSkills?: string[];
  }>;
  interactions: Array<{
    playerId: string;
    skillId: string;
    targets: string[];
    expectedEffects: Array<{
      targetId: string;
      effectType: string;
      expectedValue?: number;
      expectedOutcome: 'positive' | 'negative' | 'neutral';
    }>;
  }>;
  expectedFinalState: {
    playerConditions: Record<string, {
      moneyRange?: [number, number];
      statusEffects?: string[];
      skillsLearned?: string[];
    }>;
  };
}

describe('Multi-Player Skill Interaction Tests', () => {
  let skillSystem: SkillSystemIntegration;
  let mockGameState: GameState;
  let testPlayers: Player[];

  beforeEach(() => {
    testPlayers = [];
    skillSystem = new SkillSystemIntegration({
      ...DEFAULT_SKILL_SYSTEM_CONFIG,
      debugMode: true
    });
    skillSystem.activate();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createTestPlayer = (
    id: string,
    name: string,
    zodiac: GameZodiacSign,
    position: number = 0,
    money: number = 1500
  ): Player => ({
    id,
    name,
    zodiac,
    isHuman: id === 'player1',
    position,
    money,
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

  const createGameState = (players: Player[]): GameState => ({
    gameId: 'multiplayer-test',
    status: 'playing',
    mode: 'classic',
    players,
    currentPlayerIndex: 0,
    round: 1,
    phase: 'process_cell' as GamePhase,
    turn: 1,
    board: [],
    eventHistory: [],
    season: '春' as Season,
    weather: '晴' as Weather,
    marketTrends: {
      propertyPriceMultiplier: 1.0,
      rentMultiplier: 1.0,
      salaryBonus: 0,
      taxRate: 0.1,
      skillCooldownModifier: 1.0
    },
    startTime: Date.now(),
    elapsedTime: 0,
    lastUpdateTime: Date.now()
  });

  describe('Competitive Skill Interactions', () => {
    const competitiveScenarios: MultiPlayerTestScenario[] = [
      {
        name: '龙虎争斗',
        players: [
          { id: 'dragon_player', zodiac: '龙', initialMoney: 2000, initialPosition: 5 },
          { id: 'tiger_player', zodiac: '虎', initialMoney: 1800, initialPosition: 8 }
        ],
        interactions: [
          {
            playerId: 'dragon_player',
            skillId: 'dragon_dominance',
            targets: ['tiger_player'],
            expectedEffects: [
              {
                targetId: 'tiger_player',
                effectType: 'money',
                expectedOutcome: 'negative'
              }
            ]
          },
          {
            playerId: 'tiger_player',
            skillId: 'tiger_counter_attack',
            targets: ['dragon_player'],
            expectedEffects: [
              {
                targetId: 'dragon_player',
                effectType: 'money',
                expectedOutcome: 'negative'
              }
            ]
          }
        ],
        expectedFinalState: {
          playerConditions: {
            dragon_player: { moneyRange: [1800, 2200] },
            tiger_player: { moneyRange: [1600, 2000] }
          }
        }
      },
      {
        name: '群体攻击与防御',
        players: [
          { id: 'attacker', zodiac: '龙', initialMoney: 2500, initialPosition: 0 },
          { id: 'defender1', zodiac: '龟', initialMoney: 1500, initialPosition: 10 },
          { id: 'defender2', zodiac: '牛', initialMoney: 1500, initialPosition: 15 },
          { id: 'healer', zodiac: '兔', initialMoney: 1000, initialPosition: 20 }
        ],
        interactions: [
          {
            playerId: 'attacker',
            skillId: 'area_devastation',
            targets: ['defender1', 'defender2'],
            expectedEffects: [
              {
                targetId: 'defender1',
                effectType: 'money',
                expectedOutcome: 'negative'
              },
              {
                targetId: 'defender2',
                effectType: 'money',
                expectedOutcome: 'negative'
              }
            ]
          },
          {
            playerId: 'healer',
            skillId: 'group_healing',
            targets: ['defender1', 'defender2'],
            expectedEffects: [
              {
                targetId: 'defender1',
                effectType: 'money',
                expectedOutcome: 'positive'
              },
              {
                targetId: 'defender2',
                effectType: 'money',
                expectedOutcome: 'positive'
              }
            ]
          }
        ],
        expectedFinalState: {
          playerConditions: {
            attacker: { moneyRange: [2300, 2500] },
            defender1: { moneyRange: [1400, 1600] },
            defender2: { moneyRange: [1400, 1600] },
            healer: { moneyRange: [900, 1100] }
          }
        }
      }
    ];

    test.each(competitiveScenarios)('should handle $name scenario', async (scenario) => {
      const players = scenario.players.map(p => 
        createTestPlayer(p.id, `${p.zodiac}玩家`, p.zodiac, p.initialPosition, p.initialMoney)
      );

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      for (const interaction of scenario.interactions) {
        const result = await skillSystem.useSkill(
          interaction.playerId,
          interaction.skillId,
          interaction.targets,
          mockGameState
        );

        expect(result.success).toBe(true);

        if (result.newGameState?.players) {
          interaction.expectedEffects.forEach(expectedEffect => {
            const targetPlayer = result.newGameState!.players!.find(p => p.id === expectedEffect.targetId);
            expect(targetPlayer).toBeDefined();

            const effect = result.effects.find(effect => 
              effect.type === expectedEffect.effectType
            );

            if (effect) {
              switch (expectedEffect.expectedOutcome) {
                case 'positive':
                  expect(effect.value).toBeGreaterThan(0);
                  break;
                case 'negative':
                  expect(effect.value).toBeLessThan(0);
                  break;
                case 'neutral':
                  expect(effect.value).toBe(0);
                  break;
              }
            }
          });
        }
      }

      Object.entries(scenario.expectedFinalState.playerConditions).forEach(([playerId, conditions]) => {
        const finalPlayer = mockGameState.players.find(p => p.id === playerId);
        expect(finalPlayer).toBeDefined();

        if (conditions.moneyRange) {
          expect(finalPlayer!.money).toBeGreaterThanOrEqual(conditions.moneyRange[0]);
          expect(finalPlayer!.money).toBeLessThanOrEqual(conditions.moneyRange[1]);
        }
      });
    });

    test('should handle skill interruption and counter-skills', async () => {
      const players = [
        createTestPlayer('caster', '施法者', '龙', 0, 2000),
        createTestPlayer('interrupter', '干扰者', '猴', 5, 1500)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const channelingPromise = skillSystem.useSkill('caster', 'long_channel_skill', [], mockGameState);

      setTimeout(async () => {
        await skillSystem.useSkill('interrupter', 'interrupt_skill', ['caster'], mockGameState);
      }, 100);

      const channelingResult = await channelingPromise;

      expect(channelingResult.success).toBe(false);
      expect(channelingResult.message).toContain('被打断');
    });

    test('should resolve simultaneous skill usage conflicts', async () => {
      const players = [
        createTestPlayer('fast_player', '敏捷者', '马', 0, 1500),
        createTestPlayer('slow_player', '稳重者', '牛', 0, 1500)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const simultaneousSkills = [
        skillSystem.useSkill('fast_player', 'quick_strike', ['slow_player'], mockGameState),
        skillSystem.useSkill('slow_player', 'counter_strike', ['fast_player'], mockGameState)
      ];

      const results = await Promise.all(simultaneousSkills);

      expect(results[0].success || results[1].success).toBe(true);

      if (results[0].success && results[1].success) {
        const fastPlayerEffect = results[0].effects.find(e => e.target === 'other_players');
        const slowPlayerEffect = results[1].effects.find(e => e.target === 'other_players');

        expect(Math.abs(fastPlayerEffect?.value || 0)).toBeGreaterThan(Math.abs(slowPlayerEffect?.value || 0));
      }
    });
  });

  describe('Cooperative Skill Interactions', () => {
    test('should handle skill combinations and synergies', async () => {
      const players = [
        createTestPlayer('fire_mage', '火法师', '龙', 0, 1500),
        createTestPlayer('wind_mage', '风法师', '鸡', 5, 1500)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const fireSkillResult = await skillSystem.useSkill('fire_mage', 'fire_preparation', [], mockGameState);
      expect(fireSkillResult.success).toBe(true);

      const comboResult = await skillSystem.useSkill('wind_mage', 'wind_amplify_fire', ['fire_mage'], mockGameState);

      if (comboResult.success) {
        const comboEffect = comboResult.effects.find(effect => 
          effect.description.includes('组合') || effect.description.includes('协同')
        );
        expect(comboEffect).toBeDefined();
        expect(comboEffect?.value).toBeGreaterThan(100);
      }
    });

    test('should handle skill sharing and teaching', async () => {
      const players = [
        createTestPlayer('master', '师父', '龙', 0, 2000),
        createTestPlayer('apprentice', '学徒', '蛇', 5, 1000)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const teachingResult = await skillSystem.useSkill('master', 'teach_skill', ['apprentice'], mockGameState);

      expect(teachingResult.success).toBe(true);

      const apprenticeSkills = skillSystem.getPlayerSkills('apprentice');
      const newSkill = apprenticeSkills.find(skill => skill.name.includes('传授'));
      expect(newSkill).toBeDefined();
    });

    test('should handle group buff and support skills', async () => {
      const players = [
        createTestPlayer('supporter', '支援者', '羊', 0, 1200),
        createTestPlayer('ally1', '盟友1', '猪', 10, 1500),
        createTestPlayer('ally2', '盟友2', '狗', 15, 1500),
        createTestPlayer('ally3', '盟友3', '兔', 20, 1500)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const groupBuffResult = await skillSystem.useSkill(
        'supporter',
        'group_blessing',
        ['ally1', 'ally2', 'ally3'],
        mockGameState
      );

      expect(groupBuffResult.success).toBe(true);

      const buffEffects = groupBuffResult.effects.filter(effect => 
        effect.target === 'other_players' && effect.value > 0
      );

      expect(buffEffects.length).toBeGreaterThanOrEqual(3);

      players.slice(1).forEach(ally => {
        const allyBuffEffect = buffEffects.find(effect => 
          effect.description.includes(ally.name) || effect.target === 'other_players'
        );
        expect(allyBuffEffect).toBeDefined();
      });
    });

    test('should handle resource sharing mechanics', async () => {
      const players = [
        createTestPlayer('rich_player', '富翁', '龙', 0, 3000),
        createTestPlayer('poor_player', '困难者', '鼠', 10, 500)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const initialRichMoney = players[0].money;
      const initialPoorMoney = players[1].money;

      const shareResult = await skillSystem.useSkill('rich_player', 'wealth_share', ['poor_player'], mockGameState);

      expect(shareResult.success).toBe(true);

      if (shareResult.newGameState?.players) {
        const finalRichPlayer = shareResult.newGameState.players.find(p => p.id === 'rich_player');
        const finalPoorPlayer = shareResult.newGameState.players.find(p => p.id === 'poor_player');

        expect(finalRichPlayer!.money).toBeLessThan(initialRichMoney);
        expect(finalPoorPlayer!.money).toBeGreaterThan(initialPoorMoney);

        const totalMoney = finalRichPlayer!.money + finalPoorPlayer!.money;
        const initialTotal = initialRichMoney + initialPoorMoney;
        expect(Math.abs(totalMoney - initialTotal)).toBeLessThan(100);
      }
    });
  });

  describe('Skill Trading and Economy', () => {
    test('should handle skill usage as currency', async () => {
      const players = [
        createTestPlayer('healer', '治疗师', '兔', 0, 1000),
        createTestPlayer('warrior', '战士', '虎', 5, 2000)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const healingServiceResult = await skillSystem.useSkill(
        'healer',
        'healing_service',
        ['warrior'],
        mockGameState
      );

      expect(healingServiceResult.success).toBe(true);

      const paymentEffect = healingServiceResult.effects.find(effect => 
        effect.type === 'money' && effect.target === 'self'
      );
      const healingEffect = healingServiceResult.effects.find(effect => 
        effect.type === 'money' && effect.target === 'other_players' && effect.value > 0
      );

      expect(paymentEffect).toBeDefined();
      expect(healingEffect).toBeDefined();
      expect(paymentEffect!.value).toBeGreaterThan(0);
    });

    test('should handle skill-based contracts and agreements', async () => {
      const players = [
        createTestPlayer('contractor', '承包商', '牛', 0, 1500),
        createTestPlayer('client', '客户', '马', 10, 2000)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const contractResult = await skillSystem.useSkill(
        'contractor',
        'skill_contract',
        ['client'],
        mockGameState
      );

      expect(contractResult.success).toBe(true);

      const contractEffect = contractResult.effects.find(effect => 
        effect.description.includes('合约') || effect.description.includes('契约')
      );

      expect(contractEffect).toBeDefined();

      const clientPlayer = mockGameState.players.find(p => p.id === 'client');
      const contractStatus = clientPlayer?.statusEffects.find(status => 
        status.name.includes('合约')
      );

      expect(contractStatus).toBeDefined();
    });

    test('should handle skill insurance and protection services', async () => {
      const players = [
        createTestPlayer('insurer', '保险商', '龟', 0, 2500),
        createTestPlayer('insured1', '被保险人1', '鼠', 5, 1200),
        createTestPlayer('insured2', '被保险人2', '兔', 15, 1300),
        createTestPlayer('attacker', '攻击者', '虎', 20, 1800)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const insuranceResult1 = await skillSystem.useSkill(
        'insurer',
        'protection_insurance',
        ['insured1'],
        mockGameState
      );

      const insuranceResult2 = await skillSystem.useSkill(
        'insurer',
        'protection_insurance',
        ['insured2'],
        mockGameState
      );

      expect(insuranceResult1.success).toBe(true);
      expect(insuranceResult2.success).toBe(true);

      const attackResult = await skillSystem.useSkill(
        'attacker',
        'powerful_attack',
        ['insured1', 'insured2'],
        mockGameState
      );

      if (attackResult.success) {
        const protectedDamage = attackResult.effects.filter(effect => 
          effect.description.includes('保险') || effect.description.includes('保护')
        );

        expect(protectedDamage.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Complex Multi-Player Scenarios', () => {
    test('should handle large-scale battle royale scenario', async () => {
      const zodiacs: GameZodiacSign[] = ['鼠', '牛', '虎', '兔', '龙', '蛇'];
      const players = zodiacs.map((zodiac, index) => 
        createTestPlayer(`player${index + 1}`, `${zodiac}玩家`, zodiac, index * 5, 1500)
      );

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const battleActions = [];
      for (let round = 1; round <= 3; round++) {
        for (let i = 0; i < players.length; i++) {
          const currentPlayer = players[i];
          const availableTargets = players.filter(p => p.id !== currentPlayer.id);
          const randomTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];

          battleActions.push(
            skillSystem.useSkill(currentPlayer.id, 'zodiac_signature_skill', [randomTarget.id], mockGameState)
          );
        }
      }

      const results = await Promise.all(battleActions);
      const successfulActions = results.filter(result => result.success);

      expect(successfulActions.length).toBeGreaterThan(players.length);

      const systemStats = skillSystem.getSystemStats();
      expect(systemStats.totalSkillsUsed).toBe(successfulActions.length);
      expect(systemStats.playerStats).toBeDefined();
    });

    test('should handle alliance formation and betrayal mechanics', async () => {
      const players = [
        createTestPlayer('leader', '首领', '龙', 0, 2000),
        createTestPlayer('loyal_ally', '忠诚盟友', '虎', 5, 1500),
        createTestPlayer('potential_traitor', '潜在叛徒', '蛇', 10, 1500),
        createTestPlayer('neutral', '中立者', '兔', 15, 1500)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const allianceResult = await skillSystem.useSkill(
        'leader',
        'form_alliance',
        ['loyal_ally', 'potential_traitor'],
        mockGameState
      );

      expect(allianceResult.success).toBe(true);

      const allianceBonusResult = await skillSystem.useSkill(
        'loyal_ally',
        'alliance_boost',
        ['leader', 'potential_traitor'],
        mockGameState
      );

      expect(allianceBonusResult.success).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const betrayalResult = await skillSystem.useSkill(
        'potential_traitor',
        'betray_alliance',
        ['leader', 'loyal_ally'],
        mockGameState
      );

      if (betrayalResult.success) {
        const betrayalDamage = betrayalResult.effects.filter(effect => 
          effect.description.includes('背叛') && effect.value < 0
        );

        expect(betrayalDamage.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('should handle dynamic team formation during gameplay', async () => {
      const players = [
        createTestPlayer('diplomat', '外交家', '羊', 0, 1800),
        createTestPlayer('warrior1', '战士1', '虎', 5, 1500),
        createTestPlayer('warrior2', '战士2', '龙', 10, 1500),
        createTestPlayer('mage', '法师', '蛇', 15, 1200),
        createTestPlayer('assassin', '刺客', '猴', 20, 1300)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const teamFormationResult = await skillSystem.useSkill(
        'diplomat',
        'dynamic_team_formation',
        ['warrior1', 'mage'],
        mockGameState
      );

      expect(teamFormationResult.success).toBe(true);

      const coordinated1 = await skillSystem.useSkill('warrior1', 'coordinated_attack', ['assassin'], mockGameState);
      const coordinated2 = await skillSystem.useSkill('mage', 'support_magic', ['warrior1'], mockGameState);

      const teamResults = [coordinated1, coordinated2];
      const successfulTeamActions = teamResults.filter(result => result.success);

      expect(successfulTeamActions.length).toBe(2);

      const teamSynergyEffects = successfulTeamActions.flatMap(result => 
        result.effects.filter(effect => effect.description.includes('团队') || effect.description.includes('协作'))
      );

      expect(teamSynergyEffects.length).toBeGreaterThan(0);
    });

    test('should handle escalating conflict resolution', async () => {
      const conflictParties = [
        createTestPlayer('faction_a_leader', '势力A首领', '龙', 0, 2000),
        createTestPlayer('faction_a_member', '势力A成员', '马', 5, 1500),
        createTestPlayer('faction_b_leader', '势力B首领', '虎', 10, 2000),
        createTestPlayer('faction_b_member', '势力B成员', '牛', 15, 1500),
        createTestPlayer('mediator', '调解者', '兔', 20, 1000)
      ];

      mockGameState = createGameState(conflictParties);
      await skillSystem.onGameStart(mockGameState);

      const conflictPhases = [
        {
          phase: 'escalation',
          actions: [
            { playerId: 'faction_a_leader', skillId: 'declare_hostility', targets: ['faction_b_leader'] },
            { playerId: 'faction_b_leader', skillId: 'counter_hostility', targets: ['faction_a_leader'] }
          ]
        },
        {
          phase: 'all_out_war',
          actions: [
            { playerId: 'faction_a_member', skillId: 'support_leader', targets: ['faction_a_leader'] },
            { playerId: 'faction_b_member', skillId: 'support_leader', targets: ['faction_b_leader'] }
          ]
        },
        {
          phase: 'mediation',
          actions: [
            { playerId: 'mediator', skillId: 'peace_negotiation', targets: ['faction_a_leader', 'faction_b_leader'] }
          ]
        }
      ];

      const phaseResults = [];
      for (const phase of conflictPhases) {
        const phaseActionResults = [];
        for (const action of phase.actions) {
          const result = await skillSystem.useSkill(action.playerId, action.skillId, action.targets, mockGameState);
          phaseActionResults.push(result);
        }
        phaseResults.push({ phase: phase.phase, results: phaseActionResults });
      }

      const escalationResults = phaseResults[0].results;
      const warResults = phaseResults[1].results;
      const mediationResults = phaseResults[2].results;

      expect(escalationResults.every(result => result.success)).toBe(true);
      expect(warResults.every(result => result.success)).toBe(true);
      expect(mediationResults.every(result => result.success)).toBe(true);

      const peaceMakingEffect = mediationResults[0].effects.find(effect => 
        effect.description.includes('和平') || effect.description.includes('调解')
      );

      expect(peaceMakingEffect).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle massive multiplayer scenarios efficiently', async () => {
      const largePlayerCount = 12;
      const players = [];

      for (let i = 0; i < largePlayerCount; i++) {
        const zodiacIndex = i % 12;
        const zodiacs: GameZodiacSign[] = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
        
        players.push(createTestPlayer(
          `player${i + 1}`,
          `${zodiacs[zodiacIndex]}${i + 1}`,
          zodiacs[zodiacIndex],
          i * 3,
          1500
        ));
      }

      mockGameState = createGameState(players);

      const initStart = performance.now();
      await skillSystem.onGameStart(mockGameState);
      const initTime = performance.now() - initStart;

      expect(initTime).toBeLessThan(1000);

      const massiveSkillUsage = [];
      for (let i = 0; i < players.length; i++) {
        const targets = players.filter((_, index) => index !== i).slice(0, 2);
        massiveSkillUsage.push(
          skillSystem.useSkill(players[i].id, 'mass_interaction_skill', targets.map(t => t.id), mockGameState)
        );
      }

      const massiveStart = performance.now();
      const massiveResults = await Promise.all(massiveSkillUsage);
      const massiveTime = performance.now() - massiveStart;

      expect(massiveTime).toBeLessThan(2000);
      expect(massiveResults.filter(result => result.success).length).toBeGreaterThan(largePlayerCount * 0.8);

      const systemStats = skillSystem.getSystemStats();
      expect(systemStats.systemPerformance.memoryUsage).toBeLessThan(50 * 1024 * 1024);
    });

    test('should maintain performance with complex skill chains', async () => {
      const players = [
        createTestPlayer('chain_starter', '连锁发起者', '龙', 0, 2000),
        createTestPlayer('chain_link1', '连锁环节1', '蛇', 5, 1500),
        createTestPlayer('chain_link2', '连锁环节2', '马', 10, 1500),
        createTestPlayer('chain_target', '连锁目标', '虎', 15, 1500)
      ];

      mockGameState = createGameState(players);
      await skillSystem.onGameStart(mockGameState);

      const chainLength = 10;
      const chainPromises = [];

      for (let i = 0; i < chainLength; i++) {
        const currentPlayer = players[i % players.length];
        const nextPlayer = players[(i + 1) % players.length];

        chainPromises.push(
          skillSystem.useSkill(currentPlayer.id, 'chain_reaction_skill', [nextPlayer.id], mockGameState)
        );
      }

      const chainStart = performance.now();
      const chainResults = await Promise.all(chainPromises);
      const chainTime = performance.now() - chainStart;

      expect(chainTime).toBeLessThan(1000);
      expect(chainResults.filter(result => result.success).length).toBeGreaterThan(chainLength * 0.7);
    });
  });
});