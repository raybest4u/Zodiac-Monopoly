import { EnhancedParticleSystem } from '../EnhancedParticleSystem';
import { ZodiacVisualEffects, ZodiacSign } from '../ZodiacVisualEffects';
import { SkillAnimationStateMachine } from '../SkillAnimationStateMachine';
import { AnimationPerformanceOptimizer } from '../AnimationPerformanceOptimizer';

interface MockAudioContext {
  playSound: jest.Mock;
  pauseSound: jest.Mock;
  setVolume: jest.Mock;
  createSoundGroup: jest.Mock;
}

interface MockCanvas {
  getContext: jest.Mock;
  width: number;
  height: number;
}

describe('Animation and Sound Integration Tests', () => {
  let particleSystem: EnhancedParticleSystem;
  let zodiacEffects: ZodiacVisualEffects;
  let stateMachine: SkillAnimationStateMachine;
  let optimizer: AnimationPerformanceOptimizer;
  let mockCanvas: MockCanvas;
  let mockAudioContext: MockAudioContext;
  let mockAnimationFrame: jest.SpyInstance;

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
      width: 800,
      height: 600
    };

    mockAudioContext = {
      playSound: jest.fn().mockResolvedValue(undefined),
      pauseSound: jest.fn().mockResolvedValue(undefined),
      setVolume: jest.fn(),
      createSoundGroup: jest.fn().mockReturnValue('test-group-id')
    };

    mockAnimationFrame = jest.spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        setTimeout(() => callback(performance.now()), 16);
        return 1;
      });

    particleSystem = new EnhancedParticleSystem(mockCanvas as any);
    zodiacEffects = new ZodiacVisualEffects(particleSystem, mockAudioContext as any);
    stateMachine = new SkillAnimationStateMachine(zodiacEffects, particleSystem, mockAudioContext as any);
    optimizer = new AnimationPerformanceOptimizer();
  });

  afterEach(() => {
    mockAnimationFrame.mockRestore();
    jest.clearAllMocks();
  });

  describe('Particle System Integration', () => {
    test('should create and manage particle emitters with sound synchronization', async () => {
      const emitterId = 'fire-burst';
      const config = {
        type: 'burst' as const,
        particleCount: 50,
        lifetime: 2000,
        size: { min: 2, max: 8 },
        velocity: { min: 50, max: 150 },
        color: { r: 255, g: 100, b: 0, a: 1 },
        physics: { gravity: 0.5, friction: 0.95 }
      };

      const emitter = particleSystem.createEmitter(emitterId, config, 400, 300);
      
      expect(emitter).toBeDefined();
      expect(emitter.isActive()).toBe(false);

      emitter.start();
      expect(emitter.isActive()).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));
      
      particleSystem.update(16);
      particleSystem.render();

      expect(mockCanvas.getContext().clearRect).toHaveBeenCalled();
    });

    test('should handle particle system performance optimization', () => {
      const emitter = particleSystem.createEmitter('performance-test', {
        type: 'continuous',
        particleCount: 1000,
        lifetime: 5000,
        size: { min: 1, max: 3 },
        velocity: { min: 20, max: 80 },
        color: { r: 100, g: 150, b: 255, a: 0.8 }
      }, 400, 300);

      emitter.start();

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        particleSystem.update(16);
        particleSystem.render();
        const deltaTime = performance.now() - startTime;

        optimizer.recordPerformance(deltaTime, {
          particleCount: particleSystem.getActiveParticleCount(),
          emitterCount: particleSystem.getActiveEmitterCount()
        });
      }

      const metrics = optimizer.getCurrentMetrics();
      expect(metrics.averageFrameTime).toBeGreaterThan(0);
      expect(metrics.fps).toBeGreaterThan(0);
    });
  });

  describe('Zodiac Visual Effects Integration', () => {
    test('should play zodiac skill effects with synchronized audio', async () => {
      const position = { x: 400, y: 300 };
      const targets = [{ x: 500, y: 200 }, { x: 300, y: 400 }];

      await zodiacEffects.playZodiacSkillEffect(
        ZodiacSign.DRAGON,
        'ultimate',
        position,
        targets,
        { intensity: 0.8, duration: 3000 }
      );

      expect(mockAudioContext.playSound).toHaveBeenCalledWith(
        expect.stringContaining('dragon'),
        expect.any(Object)
      );
    });

    test('should handle multiple concurrent zodiac effects', async () => {
      const effects = [
        zodiacEffects.playZodiacSkillEffect(ZodiacSign.TIGER, 'attack', { x: 200, y: 200 }),
        zodiacEffects.playZodiacSkillEffect(ZodiacSign.PHOENIX, 'heal', { x: 600, y: 400 }),
        zodiacEffects.playZodiacSkillEffect(ZodiacSign.DRAGON, 'ultimate', { x: 400, y: 300 })
      ];

      await Promise.all(effects);

      expect(mockAudioContext.playSound).toHaveBeenCalledTimes(3);
      expect(mockAudioContext.createSoundGroup).toHaveBeenCalled();
    });

    test('should apply seasonal modifiers to effects', async () => {
      await zodiacEffects.playZodiacSkillEffect(
        ZodiacSign.RABBIT,
        'heal',
        { x: 400, y: 300 },
        [],
        { season: 'spring', intensity: 1.2 }
      );

      const springConfig = zodiacEffects.getZodiacConfig(ZodiacSign.RABBIT);
      expect(springConfig.element).toBe('wood');
    });
  });

  describe('Animation State Machine Integration', () => {
    test('should execute complex skill animation sequences', async () => {
      const animationConfig = {
        id: 'complex-skill-sequence',
        zodiac: ZodiacSign.DRAGON,
        sequence: [
          {
            name: 'charge',
            duration: 1000,
            effects: ['energy-buildup', 'screen-flash'],
            sounds: ['charge-sound'],
            transitions: [{ to: 'execute', condition: 'completed' }]
          },
          {
            name: 'execute',
            duration: 2000,
            effects: ['dragon-roar', 'fire-breath'],
            sounds: ['roar-sound', 'fire-sound'],
            transitions: [{ to: 'cooldown', condition: 'completed' }]
          },
          {
            name: 'cooldown',
            duration: 500,
            effects: ['fade-out'],
            sounds: [],
            transitions: []
          }
        ]
      };

      const context = {
        position: { x: 400, y: 300 },
        targets: [{ x: 600, y: 200 }],
        player: 'player1'
      };

      await stateMachine.playSkillAnimation(animationConfig, context);

      expect(mockAudioContext.playSound).toHaveBeenCalledWith('charge-sound', expect.any(Object));
      expect(mockAudioContext.playSound).toHaveBeenCalledWith('roar-sound', expect.any(Object));
      expect(mockAudioContext.playSound).toHaveBeenCalledWith('fire-sound', expect.any(Object));
    });

    test('should handle animation interruption and cleanup', async () => {
      const animationConfig = {
        id: 'interruptible-animation',
        zodiac: ZodiacSign.TIGER,
        sequence: [
          {
            name: 'long-animation',
            duration: 5000,
            effects: ['continuous-effect'],
            sounds: ['long-sound'],
            transitions: []
          }
        ]
      };

      const animationPromise = stateMachine.playSkillAnimation(animationConfig, {
        position: { x: 400, y: 300 },
        targets: [],
        player: 'player1'
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      
      stateMachine.stopAnimation('interruptible-animation');

      await animationPromise;

      expect(mockAudioContext.pauseSound).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization Integration', () => {
    test('should adapt animation quality based on performance', async () => {
      optimizer.setTargetFPS(60);
      optimizer.setQualityBounds(0.3, 1.0);

      for (let i = 0; i < 20; i++) {
        const startTime = performance.now();
        
        await zodiacEffects.playZodiacSkillEffect(
          ZodiacSign.DRAGON,
          'attack',
          { x: 400, y: 300 }
        );
        
        particleSystem.update(33);
        particleSystem.render();
        
        const deltaTime = performance.now() - startTime;
        optimizer.recordPerformance(deltaTime, {
          particleCount: particleSystem.getActiveParticleCount()
        });
      }

      const currentQuality = optimizer.getCurrentQuality();
      expect(currentQuality).toBeGreaterThan(0);
      expect(currentQuality).toBeLessThanOrEqual(1.0);
    });

    test('should optimize memory usage during intensive effects', async () => {
      const initialMemory = optimizer.getMemoryUsage();

      const heavyEffects = Array.from({ length: 10 }, (_, i) =>
        zodiacEffects.playZodiacSkillEffect(
          ZodiacSign.PHOENIX,
          'ultimate',
          { x: 100 + i * 70, y: 300 },
          [{ x: 400, y: 300 }]
        )
      );

      await Promise.all(heavyEffects);

      for (let i = 0; i < 30; i++) {
        particleSystem.update(16);
        particleSystem.render();
        
        optimizer.recordPerformance(16, {
          particleCount: particleSystem.getActiveParticleCount(),
          memoryUsage: optimizer.getMemoryUsage()
        });
      }

      const finalMemory = optimizer.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Audio-Visual Synchronization', () => {
    test('should synchronize particle effects with audio beats', async () => {
      const audioTimeline = {
        beats: [0, 500, 1000, 1500, 2000],
        duration: 2500
      };

      mockAudioContext.playSound.mockImplementation((soundId, options) => {
        if (options.onBeat) {
          audioTimeline.beats.forEach((beatTime, index) => {
            setTimeout(() => options.onBeat(index, beatTime), beatTime);
          });
        }
        return Promise.resolve();
      });

      let beatCount = 0;
      const emitter = particleSystem.createEmitter('sync-test', {
        type: 'burst',
        particleCount: 20,
        lifetime: 300,
        size: { min: 3, max: 6 },
        velocity: { min: 80, max: 120 },
        color: { r: 255, g: 255, b: 0, a: 1 }
      }, 400, 300);

      await zodiacEffects.playZodiacSkillEffect(
        ZodiacSign.TIGER,
        'rhythmic-attack',
        { x: 400, y: 300 },
        [],
        {
          audioSync: true,
          onBeat: (beat: number, time: number) => {
            beatCount++;
            emitter.burst(20);
          }
        }
      );

      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(beatCount).toBe(audioTimeline.beats.length);
    });

    test('should handle audio latency compensation', async () => {
      const audioLatency = 50;
      let effectTriggeredTime = 0;

      mockAudioContext.playSound.mockImplementation(async (soundId, options) => {
        await new Promise(resolve => setTimeout(resolve, audioLatency));
        effectTriggeredTime = performance.now();
      });

      const startTime = performance.now();
      
      await stateMachine.playSkillAnimation({
        id: 'latency-test',
        zodiac: ZodiacSign.MONKEY,
        sequence: [{
          name: 'immediate',
          duration: 100,
          effects: ['flash'],
          sounds: ['impact'],
          audioLatencyCompensation: audioLatency,
          transitions: []
        }]
      }, {
        position: { x: 400, y: 300 },
        targets: [],
        player: 'test'
      });

      const totalTime = effectTriggeredTime - startTime;
      expect(totalTime).toBeGreaterThanOrEqual(audioLatency - 10);
      expect(totalTime).toBeLessThanOrEqual(audioLatency + 100);
    });
  });

  describe('Cross-System Integration', () => {
    test('should coordinate between all animation systems', async () => {
      const integratedTest = async () => {
        optimizer.startProfiling();

        const animationPromises = [
          stateMachine.playSkillAnimation({
            id: 'system-integration-test',
            zodiac: ZodiacSign.DRAGON,
            sequence: [{
              name: 'complex-multi-system',
              duration: 2000,
              effects: ['particle-storm', 'screen-shake', 'color-shift'],
              sounds: ['epic-roar', 'magic-surge'],
              transitions: []
            }]
          }, {
            position: { x: 300, y: 200 },
            targets: [{ x: 500, y: 400 }],
            player: 'integration-test'
          }),

          zodiacEffects.playZodiacSkillEffect(
            ZodiacSign.PHOENIX,
            'resurrection',
            { x: 500, y: 400 },
            [],
            { intensity: 1.5, duration: 2000 }
          )
        ];

        const renderLoop = () => {
          const startTime = performance.now();
          
          particleSystem.update(16);
          particleSystem.render();
          
          const deltaTime = performance.now() - startTime;
          optimizer.recordPerformance(deltaTime, {
            particleCount: particleSystem.getActiveParticleCount(),
            activeAnimations: stateMachine.getActiveAnimationCount()
          });
        };

        const renderInterval = setInterval(renderLoop, 16);

        await Promise.all(animationPromises);
        
        clearInterval(renderInterval);
        optimizer.stopProfiling();

        return optimizer.getProfilingReport();
      };

      const report = await integratedTest();

      expect(report.totalFrames).toBeGreaterThan(100);
      expect(report.averageFrameTime).toBeLessThan(33);
      expect(mockAudioContext.playSound).toHaveBeenCalledTimes(4);
    });

    test('should maintain stable performance under load', async () => {
      const loadTest = async () => {
        const effects: Promise<void>[] = [];
        
        for (let i = 0; i < 5; i++) {
          effects.push(
            zodiacEffects.playZodiacSkillEffect(
              Object.values(ZodiacSign)[i % 12] as ZodiacSign,
              i % 2 === 0 ? 'attack' : 'ultimate',
              { x: 200 + i * 100, y: 300 },
              [{ x: 400, y: 300 }],
              { intensity: 0.7 + (i * 0.1) }
            )
          );
        }

        let frameCount = 0;
        const maxFrames = 180;
        
        while (frameCount < maxFrames) {
          const startTime = performance.now();
          
          particleSystem.update(16);
          particleSystem.render();
          
          const deltaTime = performance.now() - startTime;
          optimizer.recordPerformance(deltaTime, {
            particleCount: particleSystem.getActiveParticleCount(),
            frameNumber: frameCount
          });
          
          frameCount++;
          await new Promise(resolve => setTimeout(resolve, 16));
        }

        await Promise.all(effects);
      };

      await loadTest();

      const metrics = optimizer.getCurrentMetrics();
      expect(metrics.fps).toBeGreaterThan(30);
      expect(metrics.frameTimeVariance).toBeLessThan(50);
    });
  });
});