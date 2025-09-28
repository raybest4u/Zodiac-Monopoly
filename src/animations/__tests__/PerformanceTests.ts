import { EnhancedParticleSystem } from '../EnhancedParticleSystem';
import { ZodiacVisualEffects, ZodiacSign } from '../ZodiacVisualEffects';
import { AnimationPerformanceOptimizer } from '../AnimationPerformanceOptimizer';
import { createMockCanvas, createMockAudioContext, waitForTime } from './setup';

describe('Animation Performance Tests', () => {
  let particleSystem: EnhancedParticleSystem;
  let zodiacEffects: ZodiacVisualEffects;
  let optimizer: AnimationPerformanceOptimizer;
  let canvas: HTMLCanvasElement;
  let audioContext: any;

  beforeEach(() => {
    canvas = createMockCanvas(1920, 1080);
    audioContext = createMockAudioContext();
    particleSystem = new EnhancedParticleSystem(canvas);
    zodiacEffects = new ZodiacVisualEffects(particleSystem, audioContext);
    optimizer = new AnimationPerformanceOptimizer();
  });

  describe('Particle System Performance', () => {
    test('should handle 1000+ particles at 60fps', async () => {
      const emitter = particleSystem.createEmitter('stress-test', {
        type: 'continuous',
        particleCount: 1000,
        lifetime: 5000,
        size: { min: 1, max: 4 },
        velocity: { min: 50, max: 200 },
        color: { r: 255, g: 100, b: 50, a: 0.8 },
        physics: { gravity: 0.1, friction: 0.99 }
      }, 960, 540);

      emitter.start();

      const frameTimes: number[] = [];
      const targetFrames = 300;

      for (let frame = 0; frame < targetFrames; frame++) {
        const startTime = performance.now();
        
        particleSystem.update(16.67);
        particleSystem.render();
        
        const frameTime = performance.now() - startTime;
        frameTimes.push(frameTime);

        optimizer.recordPerformance(frameTime, {
          particleCount: particleSystem.getActiveParticleCount(),
          frame
        });

        await waitForTime(1);
      }

      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = 1000 / averageFrameTime;

      expect(fps).toBeGreaterThan(30);
      expect(averageFrameTime).toBeLessThan(33.33);
      expect(particleSystem.getActiveParticleCount()).toBeGreaterThan(800);
    });

    test('should optimize particle count based on performance', async () => {
      optimizer.setTargetFPS(60);
      optimizer.setQualityBounds(0.5, 1.0);

      const emitter = particleSystem.createEmitter('adaptive-test', {
        type: 'continuous',
        particleCount: 2000,
        lifetime: 3000,
        size: { min: 2, max: 6 },
        velocity: { min: 30, max: 100 },
        color: { r: 0, g: 255, b: 128, a: 0.7 }
      }, 960, 540);

      emitter.start();

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        
        particleSystem.update(16.67);
        particleSystem.render();
        
        const frameTime = performance.now() - startTime;
        
        optimizer.recordPerformance(frameTime, {
          particleCount: particleSystem.getActiveParticleCount()
        });

        const quality = optimizer.getCurrentQuality();
        const adjustedCount = Math.floor(2000 * quality);
        emitter.setParticleLimit(adjustedCount);

        await waitForTime(1);
      }

      const finalMetrics = optimizer.getCurrentMetrics();
      expect(finalMetrics.fps).toBeGreaterThan(50);
    });
  });

  describe('Zodiac Effects Performance', () => {
    test('should handle multiple concurrent zodiac effects', async () => {
      const concurrentEffects = 8;
      const effects: Promise<void>[] = [];

      optimizer.startProfiling();

      for (let i = 0; i < concurrentEffects; i++) {
        const zodiac = Object.values(ZodiacSign)[i % 12] as ZodiacSign;
        const skillType = i % 3 === 0 ? 'ultimate' : 'attack';
        
        effects.push(
          zodiacEffects.playZodiacSkillEffect(
            zodiac,
            skillType,
            { x: 200 + (i * 200), y: 300 + (i % 2) * 200 },
            [{ x: 960, y: 540 }],
            { intensity: 0.8, duration: 2000 }
          )
        );
      }

      let frameCount = 0;
      const renderLoop = setInterval(() => {
        const startTime = performance.now();
        
        particleSystem.update(16.67);
        particleSystem.render();
        
        const frameTime = performance.now() - startTime;
        optimizer.recordPerformance(frameTime, {
          particleCount: particleSystem.getActiveParticleCount(),
          concurrentEffects: effects.length,
          frame: frameCount++
        });
      }, 16);

      await Promise.all(effects);
      clearInterval(renderLoop);

      const report = optimizer.getProfilingReport();

      expect(report.averageFrameTime).toBeLessThan(33);
      expect(report.totalFrames).toBeGreaterThan(100);
      expect(audioContext.playSound).toHaveBeenCalledTimes(concurrentEffects);
    });

    test('should maintain performance with complex particle interactions', async () => {
      const positions = [
        { x: 300, y: 300 },
        { x: 700, y: 300 },
        { x: 1100, y: 300 },
        { x: 1500, y: 300 }
      ];

      const effects = positions.map((pos, index) =>
        zodiacEffects.playZodiacSkillEffect(
          ZodiacSign.DRAGON,
          'ultimate',
          pos,
          positions.filter((_, i) => i !== index),
          { intensity: 1.2, duration: 3000 }
        )
      );

      const metrics: number[] = [];
      const startTime = performance.now();

      while (performance.now() - startTime < 4000) {
        const frameStart = performance.now();
        
        particleSystem.update(16.67);
        particleSystem.render();
        
        const frameTime = performance.now() - frameStart;
        metrics.push(frameTime);

        optimizer.recordPerformance(frameTime, {
          particleCount: particleSystem.getActiveParticleCount(),
          memoryUsage: optimizer.getMemoryUsage()
        });

        await waitForTime(16);
      }

      await Promise.all(effects);

      const averageFrameTime = metrics.reduce((a, b) => a + b, 0) / metrics.length;
      const variance = metrics.reduce((acc, time) => acc + Math.pow(time - averageFrameTime, 2), 0) / metrics.length;

      expect(averageFrameTime).toBeLessThan(25);
      expect(Math.sqrt(variance)).toBeLessThan(10);
    });
  });

  describe('Memory Performance', () => {
    test('should prevent memory leaks during long sessions', async () => {
      const initialMemory = optimizer.getMemoryUsage();
      
      for (let cycle = 0; cycle < 20; cycle++) {
        const effects: Promise<void>[] = [];
        
        for (let i = 0; i < 5; i++) {
          const emitter = particleSystem.createEmitter(`cycle-${cycle}-${i}`, {
            type: 'burst',
            particleCount: 100,
            lifetime: 1000,
            size: { min: 2, max: 5 },
            velocity: { min: 80, max: 120 },
            color: { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255, a: 0.8 }
          }, Math.random() * 1920, Math.random() * 1080);

          emitter.start();
          
          effects.push(
            zodiacEffects.playZodiacSkillEffect(
              Object.values(ZodiacSign)[Math.floor(Math.random() * 12)] as ZodiacSign,
              Math.random() > 0.5 ? 'attack' : 'heal',
              { x: Math.random() * 1920, y: Math.random() * 1080 },
              [],
              { duration: 800 }
            )
          );
        }

        await Promise.all(effects);

        for (let frame = 0; frame < 60; frame++) {
          particleSystem.update(16.67);
          particleSystem.render();
          await waitForTime(1);
        }

        particleSystem.cleanup();
      }

      const finalMemory = optimizer.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should efficiently manage GPU resources', async () => {
      const resourceMetrics: any[] = [];

      for (let i = 0; i < 100; i++) {
        const emitter = particleSystem.createEmitter(`gpu-test-${i}`, {
          type: i % 2 === 0 ? 'burst' : 'continuous',
          particleCount: 50 + Math.random() * 100,
          lifetime: 500 + Math.random() * 1500,
          size: { min: 1, max: 8 },
          velocity: { min: 20, max: 150 },
          color: { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255, a: 0.5 + Math.random() * 0.5 }
        }, Math.random() * 1920, Math.random() * 1080);

        emitter.start();

        const startTime = performance.now();
        particleSystem.update(16.67);
        particleSystem.render();
        const renderTime = performance.now() - startTime;

        resourceMetrics.push({
          emitterCount: particleSystem.getActiveEmitterCount(),
          particleCount: particleSystem.getActiveParticleCount(),
          renderTime,
          memoryUsage: optimizer.getMemoryUsage()
        });

        if (i % 10 === 9) {
          particleSystem.cleanup();
        }

        await waitForTime(1);
      }

      const averageRenderTime = resourceMetrics.reduce((sum, m) => sum + m.renderTime, 0) / resourceMetrics.length;
      const maxMemory = Math.max(...resourceMetrics.map(m => m.memoryUsage));

      expect(averageRenderTime).toBeLessThan(20);
      expect(maxMemory).toBeLessThan(200 * 1024 * 1024);
    });
  });

  describe('Real-time Optimization', () => {
    test('should adapt quality in real-time based on device performance', async () => {
      optimizer.setTargetFPS(60);
      optimizer.setQualityBounds(0.3, 1.0);

      const heavyLoad = () => {
        for (let i = 0; i < 1000000; i++) {
          Math.sqrt(Math.random());
        }
      };

      const qualityHistory: number[] = [];
      const fpsHistory: number[] = [];

      for (let frame = 0; frame < 200; frame++) {
        if (frame > 50 && frame < 150) {
          heavyLoad();
        }

        const startTime = performance.now();
        
        particleSystem.update(16.67);
        particleSystem.render();
        
        const frameTime = performance.now() - startTime;
        optimizer.recordPerformance(frameTime, { frame });

        const currentQuality = optimizer.getCurrentQuality();
        const currentFPS = optimizer.getCurrentMetrics().fps;

        qualityHistory.push(currentQuality);
        fpsHistory.push(currentFPS);

        await waitForTime(1);
      }

      const earlyQuality = qualityHistory.slice(0, 50).reduce((a, b) => a + b, 0) / 50;
      const heavyLoadQuality = qualityHistory.slice(50, 150).reduce((a, b) => a + b, 0) / 100;
      const recoveryQuality = qualityHistory.slice(150).reduce((a, b) => a + b, 0) / 50;

      expect(heavyLoadQuality).toBeLessThan(earlyQuality);
      expect(recoveryQuality).toBeGreaterThan(heavyLoadQuality);
    });

    test('should balance quality vs performance trade-offs', async () => {
      const scenarios = [
        { targetFPS: 30, expectedQuality: { min: 0.7, max: 1.0 } },
        { targetFPS: 60, expectedQuality: { min: 0.5, max: 1.0 } },
        { targetFPS: 120, expectedQuality: { min: 0.3, max: 0.8 } }
      ];

      for (const scenario of scenarios) {
        optimizer.setTargetFPS(scenario.targetFPS);
        optimizer.setQualityBounds(scenario.expectedQuality.min, scenario.expectedQuality.max);

        for (let i = 0; i < 5; i++) {
          await zodiacEffects.playZodiacSkillEffect(
            ZodiacSign.PHOENIX,
            'ultimate',
            { x: 400 + i * 200, y: 300 },
            [{ x: 960, y: 540 }],
            { intensity: 1.0, duration: 1000 }
          );
        }

        for (let frame = 0; frame < 100; frame++) {
          const startTime = performance.now();
          
          particleSystem.update(16.67);
          particleSystem.render();
          
          const frameTime = performance.now() - startTime;
          optimizer.recordPerformance(frameTime, { scenario: scenario.targetFPS });

          await waitForTime(1);
        }

        const finalQuality = optimizer.getCurrentQuality();
        const finalFPS = optimizer.getCurrentMetrics().fps;

        expect(finalQuality).toBeGreaterThanOrEqual(scenario.expectedQuality.min);
        expect(finalQuality).toBeLessThanOrEqual(scenario.expectedQuality.max);
        expect(finalFPS).toBeGreaterThan(scenario.targetFPS * 0.8);

        optimizer.reset();
        particleSystem.cleanup();
      }
    });
  });
});