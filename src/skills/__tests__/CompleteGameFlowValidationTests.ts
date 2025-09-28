import { SkillSystemIntegration, DEFAULT_SKILL_SYSTEM_CONFIG } from '../SkillSystemIntegration';
import { EnhancedParticleSystem } from '../../animations/EnhancedParticleSystem';
import { ZodiacVisualEffects } from '../../animations/ZodiacVisualEffects';
import { SkillAnimationStateMachine } from '../../animations/SkillAnimationStateMachine';
import { AnimationPerformanceOptimizer } from '../../animations/AnimationPerformanceOptimizer';
import {
  GameState,
  Player,
  ActionResult,
  GameEvent,
  EventType,
  EventTrigger,
  ZodiacSign as GameZodiacSign,
  Season,
  Weather,
  GamePhase,
  GameStatus,
  BoardCell,
  CellType,
  DiceResult,
  Achievement,
  AchievementCategory
} from '../../types/game';

interface GameFlowTestScenario {
  name: string;
  duration: number;
  playerCount: number;
  expectedEvents: string[];
  expectedSkillUsage: number;
  expectedAnimations: number;
  performanceThresholds: {
    maxMemoryMB: number;
    minFPS: number;
    maxLatencyMS: number;
  };
}

interface FullGameSimulation {
  gameState: GameState;
  skillSystem: SkillSystemIntegration;
  animationSystem: {
    particles: EnhancedParticleSystem;
    effects: ZodiacVisualEffects;
    stateMachine: SkillAnimationStateMachine;
    optimizer: AnimationPerformanceOptimizer;
  };
  metrics: {
    totalTurns: number;
    skillsUsed: number;
    animationsPlayed: number;
    eventsTriggered: number;
    memoryPeakMB: number;
    averageFPS: number;
    errors: string[];
  };
}

describe('Complete Game Flow Validation Tests', () => {
  let gameSimulation: FullGameSimulation;
  let mockCanvas: HTMLCanvasElement;
  let mockAudioContext: any;

  beforeEach(() => {
    mockCanvas = {
      getContext: jest.fn().mockReturnValue({
        save: jest.fn(),
        restore: jest.fn(),
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        arc: jest.fn(),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        drawImage: jest.fn(),
        setTransform: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        globalAlpha: 1,
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1
      }),
      width: 1920,
      height: 1080
    } as any;

    mockAudioContext = {
      playSound: jest.fn().mockResolvedValue(undefined),
      pauseSound: jest.fn().mockResolvedValue(undefined),
      stopSound: jest.fn().mockResolvedValue(undefined),
      setVolume: jest.fn(),
      createSoundGroup: jest.fn().mockReturnValue('test-group')
    };

    const particles = new EnhancedParticleSystem(mockCanvas);
    const effects = new ZodiacVisualEffects(particles, mockAudioContext);
    const stateMachine = new SkillAnimationStateMachine(effects, particles, mockAudioContext);
    const optimizer = new AnimationPerformanceOptimizer();

    const skillSystem = new SkillSystemIntegration({
      ...DEFAULT_SKILL_SYSTEM_CONFIG,
      debugMode: false
    });

    gameSimulation = {
      gameState: createCompleteGameState(),
      skillSystem,
      animationSystem: {
        particles,
        effects,
        stateMachine,
        optimizer
      },
      metrics: {
        totalTurns: 0,
        skillsUsed: 0,
        animationsPlayed: 0,
        eventsTriggered: 0,
        memoryPeakMB: 0,
        averageFPS: 0,
        errors: []
      }
    };

    skillSystem.activate();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createCompleteGameState = (): GameState => {
    const players: Player[] = [
      {
        id: 'player1',
        name: '龙族领主',
        zodiac: '龙' as GameZodiacSign,
        isHuman: true,
        position: 0,
        money: 1500,
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
      },
      {
        id: 'player2',
        name: '虎族战士',
        zodiac: '虎' as GameZodiacSign,
        isHuman: false,
        position: 0,
        money: 1500,
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
      },
      {
        id: 'player3',
        name: '兔族商人',
        zodiac: '兔' as GameZodiacSign,
        isHuman: false,
        position: 0,
        money: 1500,
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
      },
      {
        id: 'player4',
        name: '凤凰法师',
        zodiac: '鸡' as GameZodiacSign,
        isHuman: false,
        position: 0,
        money: 1500,
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
      }
    ];

    const board: BoardCell[] = Array.from({ length: 40 }, (_, index) => ({
      id: `cell_${index}`,
      position: index,
      type: index % 10 === 0 ? 'special' as CellType : 'property' as CellType,
      name: `位置${index}`,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      description: `第${index}个位置`,
      price: index === 0 ? undefined : 100 + index * 20,
      rent: index === 0 ? undefined : 10 + index * 2
    }));

    return {
      gameId: 'complete-flow-test',
      status: 'playing' as GameStatus,
      mode: 'classic',
      players,
      currentPlayerIndex: 0,
      round: 1,
      phase: 'roll_dice' as GamePhase,
      turn: 1,
      board,
      eventHistory: [],
      season: '春' as Season,
      weather: '晴' as Weather,
      marketTrends: {
        propertyPriceMultiplier: 1.0,
        rentMultiplier: 1.0,
        salaryBonus: 200,
        taxRate: 0.1,
        skillCooldownModifier: 1.0
      },
      startTime: Date.now(),
      elapsedTime: 0,
      lastUpdateTime: Date.now()
    };
  };

  const simulateDiceRoll = (): DiceResult => ({
    dice1: Math.floor(Math.random() * 6) + 1,
    dice2: Math.floor(Math.random() * 6) + 1,
    total: 0,
    isDouble: false,
    timestamp: Date.now()
  });

  const simulateGameEvent = (round: number): GameEvent => ({
    id: `event_${round}_${Math.random()}`,
    type: (['chance_card', 'community_chest', 'zodiac_event'] as EventType[])[Math.floor(Math.random() * 3)],
    title: `第${round}轮随机事件`,
    description: `游戏第${round}轮触发的随机事件`,
    triggeredBy: 'turn_start' as EventTrigger,
    rarity: 'common',
    tags: ['random', 'turn_based'],
    timestamp: Date.now()
  });

  describe('Complete Game Session Simulation', () => {
    const gameFlowScenarios: GameFlowTestScenario[] = [
      {
        name: '短期游戏（30轮）',
        duration: 30,
        playerCount: 4,
        expectedEvents: ['turn_start', 'skill_usage', 'property_interaction', 'turn_end'],
        expectedSkillUsage: 60,
        expectedAnimations: 45,
        performanceThresholds: {
          maxMemoryMB: 100,
          minFPS: 45,
          maxLatencyMS: 50
        }
      },
      {
        name: '中期游戏（100轮）',
        duration: 100,
        playerCount: 4,
        expectedEvents: ['game_progression', 'skill_evolution', 'market_changes', 'player_interactions'],
        expectedSkillUsage: 200,
        expectedAnimations: 150,
        performanceThresholds: {
          maxMemoryMB: 150,
          minFPS: 40,
          maxLatencyMS: 75
        }
      },
      {
        name: '长期游戏（300轮）',
        duration: 300,
        playerCount: 4,
        expectedEvents: ['endgame_scenarios', 'complex_strategies', 'alliance_formations', 'victory_conditions'],
        expectedSkillUsage: 600,
        expectedAnimations: 450,
        performanceThresholds: {
          maxMemoryMB: 200,
          minFPS: 35,
          maxLatencyMS: 100
        }
      }
    ];

    test.each(gameFlowScenarios)('should complete $name successfully', async (scenario) => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      const frameRates: number[] = [];
      const memoryUsages: number[] = [];

      for (let turn = 1; turn <= scenario.duration; turn++) {
        const frameStart = performance.now();

        const currentPlayerIndex = (turn - 1) % scenario.playerCount;
        const currentPlayer = gameSimulation.gameState.players[currentPlayerIndex];

        gameSimulation.gameState.currentPlayerIndex = currentPlayerIndex;
        gameSimulation.gameState.turn = turn;
        gameSimulation.gameState.round = Math.ceil(turn / scenario.playerCount);

        try {
          const turnStartResult = await gameSimulation.skillSystem.onTurnStart(
            currentPlayer.id,
            gameSimulation.gameState
          );

          expect(turnStartResult.success).toBe(true);

          const diceResult = simulateDiceRoll();
          diceResult.total = diceResult.dice1 + diceResult.dice2;
          diceResult.isDouble = diceResult.dice1 === diceResult.dice2;

          gameSimulation.gameState.lastDiceResult = diceResult;

          const oldPosition = currentPlayer.position;
          currentPlayer.position = (oldPosition + diceResult.total) % gameSimulation.gameState.board.length;

          if (turn % 5 === 0) {
            const gameEvent = simulateGameEvent(gameSimulation.gameState.round);
            gameSimulation.gameState.eventHistory.push(gameEvent);

            await gameSimulation.skillSystem.onGameEvent(gameEvent, gameSimulation.gameState);
            gameSimulation.metrics.eventsTriggered++;
          }

          if (Math.random() < 0.7) {
            const availableSkills = gameSimulation.skillSystem.getAvailableSkills(
              currentPlayer.id,
              gameSimulation.gameState
            );

            if (availableSkills.length > 0) {
              const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
              const possibleTargets = gameSimulation.gameState.players.filter(p => p.id !== currentPlayer.id);
              const targets = Math.random() < 0.5 ? [] : [possibleTargets[Math.floor(Math.random() * possibleTargets.length)].id];

              const skillResult = await gameSimulation.skillSystem.useSkill(
                currentPlayer.id,
                randomSkill.id,
                targets,
                gameSimulation.gameState
              );

              if (skillResult.success) {
                gameSimulation.metrics.skillsUsed++;
                gameSimulation.metrics.animationsPlayed++;
              }
            }
          }

          const turnEndResult = await gameSimulation.skillSystem.onTurnEnd(
            currentPlayer.id,
            gameSimulation.gameState
          );

          expect(turnEndResult.success).toBe(true);

          gameSimulation.animationSystem.particles.update(16.67);
          gameSimulation.animationSystem.particles.render();

          const frameTime = performance.now() - frameStart;
          const fps = 1000 / frameTime;
          frameRates.push(fps);

          gameSimulation.animationSystem.optimizer.recordPerformance(frameTime, {
            turn,
            particleCount: gameSimulation.animationSystem.particles.getActiveParticleCount(),
            skillsUsed: gameSimulation.metrics.skillsUsed
          });

          const memoryUsage = gameSimulation.animationSystem.optimizer.getMemoryUsage();
          memoryUsages.push(memoryUsage);

          if (turn % 50 === 0) {
            gameSimulation.animationSystem.particles.cleanup();
          }

          currentPlayer.statistics.turnsPlayed++;
          gameSimulation.metrics.totalTurns++;

        } catch (error) {
          gameSimulation.metrics.errors.push(`Turn ${turn}: ${error}`);
          console.error(`Error in turn ${turn}:`, error);
        }

        if (turn % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      gameSimulation.metrics.averageFPS = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
      gameSimulation.metrics.memoryPeakMB = Math.max(...memoryUsages) / (1024 * 1024);

      expect(gameSimulation.metrics.skillsUsed).toBeGreaterThan(scenario.expectedSkillUsage * 0.5);
      expect(gameSimulation.metrics.animationsPlayed).toBeGreaterThan(scenario.expectedAnimations * 0.5);
      expect(gameSimulation.metrics.averageFPS).toBeGreaterThan(scenario.performanceThresholds.minFPS);
      expect(gameSimulation.metrics.memoryPeakMB).toBeLessThan(scenario.performanceThresholds.maxMemoryMB);
      expect(gameSimulation.metrics.errors.length).toBe(0);
    }, 30000);

    test('should handle seasonal transitions throughout gameplay', async () => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      const seasons: Season[] = ['春', '夏', '秋', '冬'];
      const weatherTypes: Weather[] = ['晴', '雨', '雪', '风', '雾'];

      for (let seasonCycle = 0; seasonCycle < 4; seasonCycle++) {
        gameSimulation.gameState.season = seasons[seasonCycle];
        gameSimulation.gameState.weather = weatherTypes[seasonCycle % weatherTypes.length];

        for (let turn = 1; turn <= 25; turn++) {
          const currentPlayer = gameSimulation.gameState.players[turn % gameSimulation.gameState.players.length];

          await gameSimulation.skillSystem.onTurnStart(currentPlayer.id, gameSimulation.gameState);

          const seasonalSkillResult = await gameSimulation.skillSystem.useSkill(
            currentPlayer.id,
            'seasonal_adaptation_skill',
            [],
            gameSimulation.gameState
          );

          if (seasonalSkillResult.success) {
            const seasonalEffect = seasonalSkillResult.effects.find(effect =>
              effect.description.includes(gameSimulation.gameState.season)
            );
            expect(seasonalEffect).toBeDefined();
          }

          await gameSimulation.skillSystem.onTurnEnd(currentPlayer.id, gameSimulation.gameState);
        }
      }

      const systemStats = gameSimulation.skillSystem.getSystemStats();
      expect(systemStats.totalSkillsUsed).toBeGreaterThan(50);
    });

    test('should maintain data consistency across save/load cycles', async () => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      for (let cycle = 0; cycle < 5; cycle++) {
        for (let turn = 1; turn <= 20; turn++) {
          const currentPlayer = gameSimulation.gameState.players[turn % gameSimulation.gameState.players.length];

          await gameSimulation.skillSystem.onTurnStart(currentPlayer.id, gameSimulation.gameState);

          const skillResult = await gameSimulation.skillSystem.useSkill(
            currentPlayer.id,
            'persistent_effect_skill',
            [],
            gameSimulation.gameState
          );

          if (skillResult.success) {
            gameSimulation.metrics.skillsUsed++;
          }

          await gameSimulation.skillSystem.onTurnEnd(currentPlayer.id, gameSimulation.gameState);
        }

        const savedData = gameSimulation.skillSystem.saveSkillSystemData(gameSimulation.gameState);

        const newSkillSystem = new SkillSystemIntegration(DEFAULT_SKILL_SYSTEM_CONFIG);
        newSkillSystem.activate();
        newSkillSystem.loadSkillSystemData(savedData, gameSimulation.gameState);

        const originalStats = gameSimulation.skillSystem.getSystemStats();
        const restoredStats = newSkillSystem.getSystemStats();

        expect(restoredStats.totalSkillsUsed).toBe(originalStats.totalSkillsUsed);
        expect(restoredStats.totalPlayers).toBe(originalStats.totalPlayers);

        gameSimulation.skillSystem = newSkillSystem;
      }

      expect(gameSimulation.metrics.skillsUsed).toBeGreaterThan(50);
    });
  });

  describe('Stress Testing and Edge Cases', () => {
    test('should handle rapid skill usage without memory leaks', async () => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      const initialMemory = gameSimulation.animationSystem.optimizer.getMemoryUsage();
      const rapidSkillCount = 200;

      for (let i = 0; i < rapidSkillCount; i++) {
        const randomPlayer = gameSimulation.gameState.players[i % gameSimulation.gameState.players.length];

        const result = await gameSimulation.skillSystem.useSkill(
          randomPlayer.id,
          'rapid_fire_skill',
          [],
          gameSimulation.gameState
        );

        if (result.success) {
          gameSimulation.metrics.skillsUsed++;
        }

        gameSimulation.animationSystem.particles.update(16.67);
        gameSimulation.animationSystem.particles.render();

        if (i % 50 === 0) {
          gameSimulation.animationSystem.particles.cleanup();
        }
      }

      const finalMemory = gameSimulation.animationSystem.optimizer.getMemoryUsage();
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);

      expect(memoryIncrease).toBeLessThan(50);
      expect(gameSimulation.metrics.skillsUsed).toBeGreaterThan(rapidSkillCount * 0.8);
    });

    test('should recover from animation system failures gracefully', async () => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      let animationFailureCount = 0;
      const originalPlayAnimation = gameSimulation.animationSystem.stateMachine.playSkillAnimation;

      gameSimulation.animationSystem.stateMachine.playSkillAnimation = jest.fn().mockImplementation(async (config, context) => {
        animationFailureCount++;
        if (animationFailureCount % 5 === 0) {
          throw new Error('Simulated animation failure');
        }
        return originalPlayAnimation.call(gameSimulation.animationSystem.stateMachine, config, context);
      });

      for (let turn = 1; turn <= 50; turn++) {
        const currentPlayer = gameSimulation.gameState.players[turn % gameSimulation.gameState.players.length];

        try {
          await gameSimulation.skillSystem.onTurnStart(currentPlayer.id, gameSimulation.gameState);

          const skillResult = await gameSimulation.skillSystem.useSkill(
            currentPlayer.id,
            'animation_heavy_skill',
            [],
            gameSimulation.gameState
          );

          if (skillResult.success) {
            gameSimulation.metrics.skillsUsed++;
          }

          await gameSimulation.skillSystem.onTurnEnd(currentPlayer.id, gameSimulation.gameState);

        } catch (error) {
          gameSimulation.metrics.errors.push(`Turn ${turn}: ${error}`);
        }
      }

      expect(gameSimulation.metrics.skillsUsed).toBeGreaterThan(30);
      expect(gameSimulation.metrics.errors.length).toBeLessThan(15);
    });

    test('should handle concurrent player actions in multiplayer scenarios', async () => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      const concurrentActions = [];
      const actionCount = 50;

      for (let i = 0; i < actionCount; i++) {
        const randomPlayer = gameSimulation.gameState.players[i % gameSimulation.gameState.players.length];
        const targets = gameSimulation.gameState.players.filter(p => p.id !== randomPlayer.id);
        const randomTarget = targets[Math.floor(Math.random() * targets.length)];

        concurrentActions.push(
          gameSimulation.skillSystem.useSkill(
            randomPlayer.id,
            'concurrent_test_skill',
            [randomTarget.id],
            gameSimulation.gameState
          )
        );
      }

      const results = await Promise.all(concurrentActions);
      const successfulActions = results.filter(result => result.success);

      expect(successfulActions.length).toBeGreaterThan(actionCount * 0.7);

      const systemStats = gameSimulation.skillSystem.getSystemStats();
      expect(systemStats.totalSkillsUsed).toBe(successfulActions.length);
    });

    test('should maintain performance under maximum load conditions', async () => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      const maxLoadTurns = 100;
      const frameTimings: number[] = [];

      gameSimulation.animationSystem.optimizer.setTargetFPS(60);

      for (let turn = 1; turn <= maxLoadTurns; turn++) {
        const frameStart = performance.now();

        const allPlayerActions = gameSimulation.gameState.players.map(async (player, index) => {
          await gameSimulation.skillSystem.onTurnStart(player.id, gameSimulation.gameState);

          const skillResults = await Promise.all([
            gameSimulation.skillSystem.useSkill(player.id, 'max_load_skill_1', [], gameSimulation.gameState),
            gameSimulation.skillSystem.useSkill(player.id, 'max_load_skill_2', [], gameSimulation.gameState),
            gameSimulation.skillSystem.useSkill(player.id, 'max_load_skill_3', [], gameSimulation.gameState)
          ]);

          const successfulSkills = skillResults.filter(result => result.success);
          gameSimulation.metrics.skillsUsed += successfulSkills.length;

          await gameSimulation.skillSystem.onTurnEnd(player.id, gameSimulation.gameState);

          return successfulSkills;
        });

        await Promise.all(allPlayerActions);

        for (let frame = 0; frame < 5; frame++) {
          gameSimulation.animationSystem.particles.update(16.67);
          gameSimulation.animationSystem.particles.render();
        }

        const frameTime = performance.now() - frameStart;
        frameTimings.push(frameTime);

        gameSimulation.animationSystem.optimizer.recordPerformance(frameTime, {
          turn,
          loadTest: true,
          particleCount: gameSimulation.animationSystem.particles.getActiveParticleCount()
        });

        if (turn % 20 === 0) {
          gameSimulation.animationSystem.particles.cleanup();
        }
      }

      const averageFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
      const averageFPS = 1000 / averageFrameTime;

      expect(averageFPS).toBeGreaterThan(30);
      expect(gameSimulation.metrics.skillsUsed).toBeGreaterThan(maxLoadTurns * gameSimulation.gameState.players.length);

      const finalMemoryMB = gameSimulation.animationSystem.optimizer.getMemoryUsage() / (1024 * 1024);
      expect(finalMemoryMB).toBeLessThan(250);
    });
  });

  describe('Game State Integrity and Validation', () => {
    test('should maintain consistent game state throughout entire session', async () => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      const gameStateSnapshots: any[] = [];
      const validationTurns = 200;

      for (let turn = 1; turn <= validationTurns; turn++) {
        const currentPlayer = gameSimulation.gameState.players[turn % gameSimulation.gameState.players.length];

        gameSimulation.gameState.turn = turn;
        gameSimulation.gameState.elapsedTime = Date.now() - gameSimulation.gameState.startTime;
        gameSimulation.gameState.lastUpdateTime = Date.now();

        await gameSimulation.skillSystem.onTurnStart(currentPlayer.id, gameSimulation.gameState);

        const preSkillSnapshot = {
          playerMoney: gameSimulation.gameState.players.map(p => p.money),
          playerPositions: gameSimulation.gameState.players.map(p => p.position),
          totalProperties: gameSimulation.gameState.players.reduce((sum, p) => sum + p.properties.length, 0)
        };

        const skillResult = await gameSimulation.skillSystem.useSkill(
          currentPlayer.id,
          'state_changing_skill',
          [],
          gameSimulation.gameState
        );

        if (skillResult.success && skillResult.newGameState) {
          Object.assign(gameSimulation.gameState, skillResult.newGameState);
        }

        const postSkillSnapshot = {
          playerMoney: gameSimulation.gameState.players.map(p => p.money),
          playerPositions: gameSimulation.gameState.players.map(p => p.position),
          totalProperties: gameSimulation.gameState.players.reduce((sum, p) => sum + p.properties.length, 0)
        };

        gameStateSnapshots.push({
          turn,
          preSkill: preSkillSnapshot,
          postSkill: postSkillSnapshot,
          skillUsed: skillResult.success
        });

        expect(gameSimulation.gameState.players.every(p => p.money >= 0)).toBe(true);
        expect(gameSimulation.gameState.players.every(p => p.position >= 0 && p.position < gameSimulation.gameState.board.length)).toBe(true);

        await gameSimulation.skillSystem.onTurnEnd(currentPlayer.id, gameSimulation.gameState);

        if (turn % 50 === 0) {
          const systemHealthCheck = gameSimulation.skillSystem.getHealthCheck();
          expect(systemHealthCheck.isHealthy).toBe(true);
        }
      }

      const totalMoneyStart = 1500 * gameSimulation.gameState.players.length;
      const totalMoneyEnd = gameSimulation.gameState.players.reduce((sum, p) => sum + p.money, 0);
      const moneyVariation = Math.abs(totalMoneyEnd - totalMoneyStart) / totalMoneyStart;

      expect(moneyVariation).toBeLessThan(2.0);

      const invalidSnapshots = gameStateSnapshots.filter(snapshot => {
        const totalPreMoney = snapshot.preSkill.playerMoney.reduce((a: number, b: number) => a + b, 0);
        const totalPostMoney = snapshot.postSkill.playerMoney.reduce((a: number, b: number) => a + b, 0);
        return Math.abs(totalPostMoney - totalPreMoney) > totalPreMoney * 0.5;
      });

      expect(invalidSnapshots.length).toBeLessThan(validationTurns * 0.05);
    });

    test('should handle edge cases in game progression', async () => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      const edgeCaseScenarios = [
        {
          name: '玩家破产情况',
          setup: () => {
            gameSimulation.gameState.players[0].money = 10;
          },
          validation: (result: ActionResult) => {
            expect(result.success).toBe(true);
            expect(gameSimulation.gameState.players[0].money).toBeGreaterThanOrEqual(0);
          }
        },
        {
          name: '最大金额溢出',
          setup: () => {
            gameSimulation.gameState.players[1].money = 999999;
          },
          validation: (result: ActionResult) => {
            expect(result.success).toBe(true);
            expect(gameSimulation.gameState.players[1].money).toBeLessThan(1000000);
          }
        },
        {
          name: '所有属性被一人拥有',
          setup: () => {
            const allProperties = gameSimulation.gameState.board
              .filter(cell => cell.type === 'property')
              .map(cell => cell.id);
            gameSimulation.gameState.players[2].properties = allProperties;
          },
          validation: (result: ActionResult) => {
            expect(result.success).toBe(true);
          }
        }
      ];

      for (const scenario of edgeCaseScenarios) {
        scenario.setup();

        const result = await gameSimulation.skillSystem.useSkill(
          gameSimulation.gameState.players[0].id,
          'edge_case_test_skill',
          [],
          gameSimulation.gameState
        );

        scenario.validation(result);
      }
    });

    test('should validate achievement and progression systems', async () => {
      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);

      const progressionMilestones = [
        { skillsUsed: 10, expectedLevel: 1 },
        { skillsUsed: 25, expectedLevel: 2 },
        { skillsUsed: 50, expectedLevel: 3 },
        { skillsUsed: 100, expectedLevel: 4 }
      ];

      for (const milestone of progressionMilestones) {
        while (gameSimulation.metrics.skillsUsed < milestone.skillsUsed) {
          const randomPlayer = gameSimulation.gameState.players[
            gameSimulation.metrics.skillsUsed % gameSimulation.gameState.players.length
          ];

          const result = await gameSimulation.skillSystem.useSkill(
            randomPlayer.id,
            'progression_skill',
            [],
            gameSimulation.gameState
          );

          if (result.success) {
            gameSimulation.metrics.skillsUsed++;
          }
        }

        const playerSkills = gameSimulation.skillSystem.getPlayerSkills(gameSimulation.gameState.players[0].id);
        const highLevelSkills = playerSkills.filter(skill => skill.level >= milestone.expectedLevel);

        expect(highLevelSkills.length).toBeGreaterThan(0);
      }

      const finalSystemStats = gameSimulation.skillSystem.getSystemStats();
      expect(finalSystemStats.totalSkillsUsed).toBe(gameSimulation.metrics.skillsUsed);
      expect(finalSystemStats.averageSkillsPerPlayer).toBeGreaterThan(10);
    });
  });

  describe('Integration Completeness Validation', () => {
    test('should demonstrate complete system integration', async () => {
      const integrationChecklist = {
        skillSystemActive: false,
        animationSystemWorking: false,
        eventSystemResponding: false,
        performanceOptimized: false,
        dataConsistencyMaintained: false,
        errorRecoveryWorking: false
      };

      await gameSimulation.skillSystem.onGameStart(gameSimulation.gameState);
      integrationChecklist.skillSystemActive = gameSimulation.skillSystem.getSystemState().isActive;

      for (let integrationTurn = 1; integrationTurn <= 50; integrationTurn++) {
        const currentPlayer = gameSimulation.gameState.players[integrationTurn % gameSimulation.gameState.players.length];

        const turnResult = await gameSimulation.skillSystem.onTurnStart(currentPlayer.id, gameSimulation.gameState);
        expect(turnResult.success).toBe(true);

        const skillResult = await gameSimulation.skillSystem.useSkill(
          currentPlayer.id,
          'integration_test_skill',
          [],
          gameSimulation.gameState
        );

        if (skillResult.success) {
          integrationChecklist.animationSystemWorking = true;
          gameSimulation.metrics.skillsUsed++;
        }

        if (integrationTurn % 10 === 0) {
          const testEvent = simulateGameEvent(integrationTurn);
          const eventResult = await gameSimulation.skillSystem.onGameEvent(testEvent, gameSimulation.gameState);
          integrationChecklist.eventSystemResponding = eventResult.success;
        }

        gameSimulation.animationSystem.particles.update(16.67);
        gameSimulation.animationSystem.particles.render();

        const memoryUsage = gameSimulation.animationSystem.optimizer.getMemoryUsage() / (1024 * 1024);
        if (memoryUsage < 100) {
          integrationChecklist.performanceOptimized = true;
        }

        await gameSimulation.skillSystem.onTurnEnd(currentPlayer.id, gameSimulation.gameState);
      }

      const saveData = gameSimulation.skillSystem.saveSkillSystemData(gameSimulation.gameState);
      const newSystem = new SkillSystemIntegration(DEFAULT_SKILL_SYSTEM_CONFIG);
      newSystem.activate();
      newSystem.loadSkillSystemData(saveData, gameSimulation.gameState);

      const originalStats = gameSimulation.skillSystem.getSystemStats();
      const restoredStats = newSystem.getSystemStats();
      integrationChecklist.dataConsistencyMaintained = originalStats.totalSkillsUsed === restoredStats.totalSkillsUsed;

      try {
        throw new Error('Test error for recovery');
      } catch (error) {
        const errorRecoveryResult = await gameSimulation.skillSystem.useSkill(
          gameSimulation.gameState.players[0].id,
          'recovery_test_skill',
          [],
          gameSimulation.gameState
        );
        integrationChecklist.errorRecoveryWorking = errorRecoveryResult.success;
      }

      Object.entries(integrationChecklist).forEach(([feature, isWorking]) => {
        expect(isWorking).toBe(true);
      });

      expect(gameSimulation.metrics.skillsUsed).toBeGreaterThan(30);
      expect(gameSimulation.metrics.errors.length).toBe(0);
    });
  });
});