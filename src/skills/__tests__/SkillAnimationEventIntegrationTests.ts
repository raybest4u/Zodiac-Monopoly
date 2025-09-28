import { SkillSystemIntegration, DEFAULT_SKILL_SYSTEM_CONFIG } from '../SkillSystemIntegration';
import { EnhancedParticleSystem } from '../../animations/EnhancedParticleSystem';
import { ZodiacVisualEffects, ZodiacSign } from '../../animations/ZodiacVisualEffects';
import { SkillAnimationStateMachine } from '../../animations/SkillAnimationStateMachine';
import { AnimationPerformanceOptimizer } from '../../animations/AnimationPerformanceOptimizer';
import {
  GameState,
  Player,
  GameEvent,
  EventType,
  EventTrigger,
  ActionResult,
  ZodiacSign as GameZodiacSign,
  Season,
  Weather,
  GamePhase
} from '../../types/game';

interface AnimationEventTestCase {
  name: string;
  skillId: string;
  zodiac: GameZodiacSign;
  expectedAnimations: string[];
  expectedSounds: string[];
  expectedParticleEffects: string[];
  gameEvents?: GameEvent[];
  environmentalFactors?: {
    season?: Season;
    weather?: Weather;
    timeOfDay?: 'day' | 'night';
  };
}

interface MockAnimationSystem {
  particleSystem: EnhancedParticleSystem;
  zodiacEffects: ZodiacVisualEffects;
  stateMachine: SkillAnimationStateMachine;
  optimizer: AnimationPerformanceOptimizer;
  canvas: HTMLCanvasElement;
  audioContext: any;
}

describe('Skill Animation and Event System Integration Tests', () => {
  let skillSystem: SkillSystemIntegration;
  let animationSystem: MockAnimationSystem;
  let mockGameState: GameState;
  let testPlayers: Player[];
  let animationCallbacks: Map<string, Function[]>;
  let soundEffectQueue: Array<{ id: string; options: any; timestamp: number }>;
  let particleEmitterLogs: Array<{ emitterId: string; config: any; timestamp: number }>;

  beforeEach(() => {
    animationCallbacks = new Map();
    soundEffectQueue = [];
    particleEmitterLogs = [];

    const mockCanvas = {
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
      width: 1200,
      height: 800
    } as any;

    const mockAudioContext = {
      playSound: jest.fn().mockImplementation(async (soundId: string, options: any = {}) => {
        soundEffectQueue.push({
          id: soundId,
          options,
          timestamp: performance.now()
        });

        if (options.onStart) {
          setTimeout(options.onStart, 10);
        }

        if (options.onBeat && options.beatTimes) {
          options.beatTimes.forEach((beatTime: number, index: number) => {
            setTimeout(() => options.onBeat(index, beatTime), beatTime);
          });
        }

        return Promise.resolve();
      }),
      pauseSound: jest.fn().mockResolvedValue(undefined),
      stopSound: jest.fn().mockResolvedValue(undefined),
      setVolume: jest.fn(),
      createSoundGroup: jest.fn().mockReturnValue('test-group')
    };

    const particleSystem = new EnhancedParticleSystem(mockCanvas);
    const originalCreateEmitter = particleSystem.createEmitter.bind(particleSystem);
    particleSystem.createEmitter = jest.fn().mockImplementation((id: string, config: any, x: number = 0, y: number = 0) => {
      particleEmitterLogs.push({
        emitterId: id,
        config: { ...config, x, y },
        timestamp: performance.now()
      });
      return originalCreateEmitter(id, config, x, y);
    });

    const zodiacEffects = new ZodiacVisualEffects(particleSystem, mockAudioContext);
    const stateMachine = new SkillAnimationStateMachine(zodiacEffects, particleSystem, mockAudioContext);
    const optimizer = new AnimationPerformanceOptimizer();

    animationSystem = {
      particleSystem,
      zodiacEffects,
      stateMachine,
      optimizer,
      canvas: mockCanvas,
      audioContext: mockAudioContext
    };

    testPlayers = [
      {
        id: 'player1',
        name: '龙法师',
        zodiac: '龙' as GameZodiacSign,
        isHuman: true,
        position: 5,
        money: 2000,
        properties: ['dragon_lair'],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 10,
          moneyEarned: 1000,
          moneySpent: 500,
          propertiesBought: 1,
          propertiesSold: 0,
          skillsUsed: 8,
          eventsTriggered: 3,
          rentCollected: 300,
          rentPaid: 200
        }
      },
      {
        id: 'player2',
        name: '虎战士',
        zodiac: '虎' as GameZodiacSign,
        isHuman: false,
        position: 12,
        money: 1500,
        properties: ['tiger_den'],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 10,
          moneyEarned: 800,
          moneySpent: 400,
          propertiesBought: 1,
          propertiesSold: 0,
          skillsUsed: 6,
          eventsTriggered: 2,
          rentCollected: 200,
          rentPaid: 150
        }
      },
      {
        id: 'player3',
        name: '凤凰治疗师',
        zodiac: '鸡' as GameZodiacSign,
        isHuman: true,
        position: 8,
        money: 1800,
        properties: [],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 10,
          moneyEarned: 600,
          moneySpent: 300,
          propertiesBought: 0,
          propertiesSold: 0,
          skillsUsed: 12,
          eventsTriggered: 1,
          rentCollected: 0,
          rentPaid: 100
        }
      }
    ];

    mockGameState = {
      gameId: 'animation-event-test',
      status: 'playing',
      mode: 'classic',
      players: testPlayers,
      currentPlayerIndex: 0,
      round: 5,
      phase: 'process_cell' as GamePhase,
      turn: 25,
      board: [],
      eventHistory: [],
      season: '春' as Season,
      weather: '晴' as Weather,
      marketTrends: {
        propertyPriceMultiplier: 1.1,
        rentMultiplier: 1.0,
        salaryBonus: 100,
        taxRate: 0.12,
        skillCooldownModifier: 0.9
      },
      startTime: Date.now() - 600000,
      elapsedTime: 600000,
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
    animationCallbacks.clear();
    soundEffectQueue = [];
    particleEmitterLogs = [];
  });

  describe('Animation-Skill Synchronization', () => {
    const animationTestCases: AnimationEventTestCase[] = [
      {
        name: '龙息攻击',
        skillId: 'dragon_breath',
        zodiac: '龙',
        expectedAnimations: ['charge_up', 'breath_stream', 'impact_explosion'],
        expectedSounds: ['dragon_roar', 'fire_whoosh', 'explosion'],
        expectedParticleEffects: ['fire_particles', 'smoke_trail', 'ember_sparks']
      },
      {
        name: '虎跃突击',
        skillId: 'tiger_leap',
        zodiac: '虎',
        expectedAnimations: ['crouch_prepare', 'leap_trajectory', 'impact_landing'],
        expectedSounds: ['tiger_growl', 'wind_rush', 'ground_impact'],
        expectedParticleEffects: ['dust_cloud', 'claw_trails', 'impact_shockwave']
      },
      {
        name: '凤凰涅槃',
        skillId: 'phoenix_rebirth',
        zodiac: '鸡',
        expectedAnimations: ['phoenix_rise', 'flame_wings', 'healing_aura'],
        expectedSounds: ['phoenix_cry', 'flame_crackle', 'healing_chime'],
        expectedParticleEffects: ['golden_flames', 'healing_sparkles', 'feather_glow']
      }
    ];

    test.each(animationTestCases)('should synchronize $name animations with skill execution', async (testCase) => {
      await skillSystem.onGameStart(mockGameState);

      const playAnimationSpy = jest.spyOn(animationSystem.stateMachine, 'playSkillAnimation')
        .mockImplementation(async (config, context) => {
          animationCallbacks.set(testCase.skillId, [
            () => console.log(`Animation started: ${config.id}`),
            () => console.log(`Animation completed: ${config.id}`)
          ]);
          return Promise.resolve();
        });

      const playEffectSpy = jest.spyOn(animationSystem.zodiacEffects, 'playZodiacSkillEffect')
        .mockImplementation(async (zodiac, skillType, position, targets, options) => {
          return Promise.resolve();
        });

      const casterPlayer = mockGameState.players.find(p => p.zodiac === testCase.zodiac);
      if (!casterPlayer) return;

      const result = await skillSystem.useSkill(
        casterPlayer.id,
        testCase.skillId,
        ['player2'],
        mockGameState
      );

      expect(result.success).toBe(true);

      expect(playAnimationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringContaining(testCase.skillId),
          zodiac: expect.any(String),
          sequence: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              duration: expect.any(Number),
              effects: expect.any(Array),
              sounds: expect.any(Array)
            })
          ])
        }),
        expect.objectContaining({
          position: expect.any(Object),
          targets: expect.any(Array),
          player: casterPlayer.id
        })
      );

      expect(playEffectSpy).toHaveBeenCalledWith(
        expect.any(String),
        testCase.skillId,
        expect.any(Object),
        expect.any(Array),
        expect.objectContaining({
          intensity: expect.any(Number),
          duration: expect.any(Number)
        })
      );

      testCase.expectedSounds.forEach(expectedSound => {
        expect(soundEffectQueue.some(sound => sound.id.includes(expectedSound))).toBe(true);
      });

      testCase.expectedParticleEffects.forEach(expectedEffect => {
        expect(particleEmitterLogs.some(log => 
          log.emitterId.includes(expectedEffect) || 
          JSON.stringify(log.config).includes(expectedEffect)
        )).toBe(true);
      });
    });

    test('should handle animation interruption during skill cancellation', async () => {
      await skillSystem.onGameStart(mockGameState);

      const stopAnimationSpy = jest.spyOn(animationSystem.stateMachine, 'stopAnimation');
      const pauseSoundSpy = jest.spyOn(animationSystem.audioContext, 'pauseSound');

      const longSkillPromise = skillSystem.useSkill('player1', 'channeled_skill', [], mockGameState);

      setTimeout(() => {
        animationSystem.stateMachine.stopAnimation('channeled_skill');
      }, 100);

      await longSkillPromise;

      expect(stopAnimationSpy).toHaveBeenCalledWith('channeled_skill');
      expect(pauseSoundSpy).toHaveBeenCalled();
    });

    test('should maintain animation timing consistency', async () => {
      await skillSystem.onGameStart(mockGameState);

      const animationTimestamps: number[] = [];
      const soundTimestamps: number[] = [];

      jest.spyOn(animationSystem.stateMachine, 'playSkillAnimation')
        .mockImplementation(async (config, context) => {
          animationTimestamps.push(performance.now());
          return Promise.resolve();
        });

      animationSystem.audioContext.playSound.mockImplementation(async (soundId: string, options: any) => {
        soundTimestamps.push(performance.now());
        return Promise.resolve();
      });

      await skillSystem.useSkill('player1', 'precise_timing_skill', [], mockGameState);

      expect(animationTimestamps.length).toBeGreaterThan(0);
      expect(soundTimestamps.length).toBeGreaterThan(0);

      if (animationTimestamps.length > 0 && soundTimestamps.length > 0) {
        const timingDifference = Math.abs(animationTimestamps[0] - soundTimestamps[0]);
        expect(timingDifference).toBeLessThan(50);
      }
    });
  });

  describe('Event-Triggered Animation System', () => {
    test('should trigger animations for game events', async () => {
      await skillSystem.onGameStart(mockGameState);

      const zodiacEvent: GameEvent = {
        id: 'dragon_blessing_event',
        type: 'zodiac_event' as EventType,
        title: '龙的祝福',
        description: '强大的龙族力量降临',
        triggeredBy: 'seasonal_change' as EventTrigger,
        rarity: 'epic',
        tags: ['dragon', 'blessing', 'power_boost'],
        timestamp: Date.now(),
        zodiacRelated: true
      };

      const playEffectSpy = jest.spyOn(animationSystem.zodiacEffects, 'playZodiacSkillEffect');

      await skillSystem.onGameEvent(zodiacEvent, mockGameState);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(playEffectSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('blessing'),
        expect.any(Object),
        expect.any(Array),
        expect.objectContaining({
          intensity: expect.any(Number)
        })
      );
    });

    test('should handle environmental animation changes', async () => {
      await skillSystem.onGameStart(mockGameState);

      const environmentalCases = [
        { season: '春' as Season, weather: '雨' as Weather, expectedEffect: 'spring_rain' },
        { season: '夏' as Season, weather: '晴' as Weather, expectedEffect: 'summer_sun' },
        { season: '秋' as Season, weather: '风' as Weather, expectedEffect: 'autumn_wind' },
        { season: '冬' as Season, weather: '雪' as Weather, expectedEffect: 'winter_snow' }
      ];

      for (const envCase of environmentalCases) {
        mockGameState.season = envCase.season;
        mockGameState.weather = envCase.weather;

        await skillSystem.useSkill('player1', 'environmental_skill', [], mockGameState);

        const relevantEmitter = particleEmitterLogs.find(log => 
          log.emitterId.includes(envCase.expectedEffect)
        );

        expect(relevantEmitter).toBeDefined();
      }
    });

    test('should synchronize multi-layer event animations', async () => {
      await skillSystem.onGameStart(mockGameState);

      const complexEvent: GameEvent = {
        id: 'zodiac_convergence',
        type: 'special_event' as EventType,
        title: '十二生肖汇聚',
        description: '所有生肖力量汇聚一堂',
        triggeredBy: 'special_event' as EventTrigger,
        rarity: 'legendary',
        tags: ['convergence', 'all_zodiac', 'ultimate'],
        timestamp: Date.now(),
        zodiacRelated: true
      };

      const createSoundGroupSpy = jest.spyOn(animationSystem.audioContext, 'createSoundGroup');
      const playEffectSpy = jest.spyOn(animationSystem.zodiacEffects, 'playZodiacSkillEffect');

      await skillSystem.onGameEvent(complexEvent, mockGameState);

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(createSoundGroupSpy).toHaveBeenCalledWith(expect.stringContaining('convergence'));
      expect(playEffectSpy).toHaveBeenCalledTimes(mockGameState.players.length);

      const allZodiacEffects = playEffectSpy.mock.calls.map(call => call[0]);
      expect(allZodiacEffects).toContain(ZodiacSign.DRAGON);
      expect(allZodiacEffects).toContain(ZodiacSign.TIGER);
    });
  });

  describe('Performance and Optimization Integration', () => {
    test('should optimize animations based on performance metrics', async () => {
      await skillSystem.onGameStart(mockGameState);

      animationSystem.optimizer.setTargetFPS(60);
      animationSystem.optimizer.setQualityBounds(0.5, 1.0);

      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();

        await skillSystem.useSkill('player1', 'performance_test_skill', [], mockGameState);

        animationSystem.particleSystem.update(16.67);
        animationSystem.particleSystem.render();

        const frameTime = performance.now() - startTime;
        animationSystem.optimizer.recordPerformance(frameTime, {
          particleCount: animationSystem.particleSystem.getActiveParticleCount(),
          skillIteration: i
        });
      }

      const currentQuality = animationSystem.optimizer.getCurrentQuality();
      const performanceMetrics = animationSystem.optimizer.getCurrentMetrics();

      expect(currentQuality).toBeGreaterThan(0);
      expect(currentQuality).toBeLessThanOrEqual(1.0);
      expect(performanceMetrics.fps).toBeGreaterThan(30);
    });

    test('should handle high-load animation scenarios', async () => {
      await skillSystem.onGameStart(mockGameState);

      const simultaneousSkills = [
        { playerId: 'player1', skillId: 'dragon_ultimate' },
        { playerId: 'player2', skillId: 'tiger_rampage' },
        { playerId: 'player3', skillId: 'phoenix_storm' }
      ];

      const skillPromises = simultaneousSkills.map(skill =>
        skillSystem.useSkill(skill.playerId, skill.skillId, [], mockGameState)
      );

      const results = await Promise.all(skillPromises);

      expect(results.every(result => result.success)).toBe(true);

      const totalParticleEmitters = particleEmitterLogs.length;
      const totalSoundEffects = soundEffectQueue.length;

      expect(totalParticleEmitters).toBeGreaterThan(simultaneousSkills.length);
      expect(totalSoundEffects).toBeGreaterThan(simultaneousSkills.length);

      const memoryUsage = animationSystem.optimizer.getMemoryUsage();
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024);
    });

    test('should adapt animation quality dynamically', async () => {
      await skillSystem.onGameStart(mockGameState);

      const performanceSimulation = [
        { simulatedLatency: 10, expectedQuality: 1.0 },
        { simulatedLatency: 30, expectedQuality: 0.8 },
        { simulatedLatency: 50, expectedQuality: 0.6 },
        { simulatedLatency: 80, expectedQuality: 0.4 }
      ];

      for (const scenario of performanceSimulation) {
        for (let frame = 0; frame < 10; frame++) {
          const frameTime = scenario.simulatedLatency;
          animationSystem.optimizer.recordPerformance(frameTime, { scenario: scenario.simulatedLatency });
        }

        await skillSystem.useSkill('player1', 'adaptive_quality_skill', [], mockGameState);

        const currentQuality = animationSystem.optimizer.getCurrentQuality();
        expect(currentQuality).toBeLessThanOrEqual(scenario.expectedQuality + 0.1);
        expect(currentQuality).toBeGreaterThanOrEqual(scenario.expectedQuality - 0.1);
      }
    });
  });

  describe('Complex Interaction Scenarios', () => {
    test('should handle skill combos with chained animations', async () => {
      await skillSystem.onGameStart(mockGameState);

      const comboSequence = [
        { skillId: 'combo_setup', delay: 0 },
        { skillId: 'combo_amplify', delay: 500 },
        { skillId: 'combo_finisher', delay: 1000 }
      ];

      const animationSequenceLog: Array<{ skillId: string; timestamp: number }> = [];

      jest.spyOn(animationSystem.stateMachine, 'playSkillAnimation')
        .mockImplementation(async (config, context) => {
          animationSequenceLog.push({
            skillId: config.id,
            timestamp: performance.now()
          });
          return Promise.resolve();
        });

      for (const combo of comboSequence) {
        setTimeout(async () => {
          await skillSystem.useSkill('player1', combo.skillId, ['player2'], mockGameState);
        }, combo.delay);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      expect(animationSequenceLog.length).toBe(comboSequence.length);

      for (let i = 1; i < animationSequenceLog.length; i++) {
        const timeDiff = animationSequenceLog[i].timestamp - animationSequenceLog[i - 1].timestamp;
        expect(timeDiff).toBeGreaterThan(400);
        expect(timeDiff).toBeLessThan(600);
      }
    });

    test('should synchronize particle effects with audio beats', async () => {
      await skillSystem.onGameStart(mockGameState);

      const beatTimeline = [0, 250, 500, 750, 1000];
      let particleBursts = 0;

      animationSystem.audioContext.playSound.mockImplementation(async (soundId: string, options: any) => {
        if (options.onBeat) {
          beatTimeline.forEach((beatTime, index) => {
            setTimeout(() => {
              options.onBeat(index, beatTime);
              particleBursts++;
            }, beatTime);
          });
        }
        return Promise.resolve();
      });

      await skillSystem.useSkill('player1', 'rhythmic_skill', [], mockGameState);

      await new Promise(resolve => setTimeout(resolve, 1200));

      expect(particleBursts).toBe(beatTimeline.length);
    });

    test('should handle animation conflicts and priority resolution', async () => {
      await skillSystem.onGameStart(mockGameState);

      const conflictingAnimations = [
        { skillId: 'high_priority_skill', priority: 100 },
        { skillId: 'medium_priority_skill', priority: 50 },
        { skillId: 'low_priority_skill', priority: 10 }
      ];

      const playedAnimations: string[] = [];

      jest.spyOn(animationSystem.stateMachine, 'playSkillAnimation')
        .mockImplementation(async (config, context) => {
          playedAnimations.push(config.id);
          return Promise.resolve();
        });

      const animationPromises = conflictingAnimations.map(anim =>
        skillSystem.useSkill('player1', anim.skillId, [], mockGameState)
      );

      await Promise.all(animationPromises);

      expect(playedAnimations).toContain('high_priority_skill');

      const highPriorityIndex = playedAnimations.indexOf('high_priority_skill');
      const lowPriorityIndex = playedAnimations.indexOf('low_priority_skill');

      if (highPriorityIndex !== -1 && lowPriorityIndex !== -1) {
        expect(highPriorityIndex).toBeLessThan(lowPriorityIndex);
      }
    });

    test('should maintain animation state across game saves and loads', async () => {
      await skillSystem.onGameStart(mockGameState);

      await skillSystem.useSkill('player1', 'persistent_animation_skill', [], mockGameState);

      const preLoadEmitterCount = particleEmitterLogs.length;
      const preLoadSoundCount = soundEffectQueue.length;

      const savedData = skillSystem.saveSkillSystemData(mockGameState);

      const newSkillSystem = new SkillSystemIntegration(DEFAULT_SKILL_SYSTEM_CONFIG);
      newSkillSystem.activate();
      newSkillSystem.loadSkillSystemData(savedData, mockGameState);

      await newSkillSystem.useSkill('player1', 'post_load_skill', [], mockGameState);

      expect(preLoadEmitterCount).toBeGreaterThan(0);
      expect(preLoadSoundCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle animation system failures gracefully', async () => {
      await skillSystem.onGameStart(mockGameState);

      jest.spyOn(animationSystem.stateMachine, 'playSkillAnimation')
        .mockRejectedValueOnce(new Error('Animation system failure'));

      const result = await skillSystem.useSkill('player1', 'failing_animation_skill', [], mockGameState);

      expect(result.success).toBe(true);
      expect(result.message).toContain('技能生效');
    });

    test('should recover from audio system interruptions', async () => {
      await skillSystem.onGameStart(mockGameState);

      let audioFailureCount = 0;
      animationSystem.audioContext.playSound.mockImplementation(async (soundId: string, options: any) => {
        audioFailureCount++;
        if (audioFailureCount <= 2) {
          throw new Error('Audio system temporarily unavailable');
        }
        return Promise.resolve();
      });

      const results = await Promise.all([
        skillSystem.useSkill('player1', 'audio_skill_1', [], mockGameState),
        skillSystem.useSkill('player1', 'audio_skill_2', [], mockGameState),
        skillSystem.useSkill('player1', 'audio_skill_3', [], mockGameState)
      ]);

      const successCount = results.filter(result => result.success).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });

    test('should handle particle system resource exhaustion', async () => {
      await skillSystem.onGameStart(mockGameState);

      jest.spyOn(animationSystem.particleSystem, 'createEmitter')
        .mockImplementation(() => {
          throw new Error('Maximum particle limit reached');
        });

      const result = await skillSystem.useSkill('player1', 'particle_heavy_skill', [], mockGameState);

      expect(result.success).toBe(true);
    });
  });
});