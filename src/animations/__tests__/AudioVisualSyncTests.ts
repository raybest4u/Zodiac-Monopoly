import { EnhancedParticleSystem } from '../EnhancedParticleSystem';
import { ZodiacVisualEffects, ZodiacSign } from '../ZodiacVisualEffects';
import { SkillAnimationStateMachine } from '../SkillAnimationStateMachine';
import { createMockCanvas, createMockAudioContext, waitForTime } from './setup';

interface TimingEvent {
  type: 'audio' | 'visual' | 'beat' | 'state';
  timestamp: number;
  data: any;
}

describe('Audio-Visual Synchronization Tests', () => {
  let particleSystem: EnhancedParticleSystem;
  let zodiacEffects: ZodiacVisualEffects;
  let stateMachine: SkillAnimationStateMachine;
  let audioContext: any;
  let canvas: HTMLCanvasElement;
  let timingEvents: TimingEvent[] = [];

  beforeEach(() => {
    timingEvents = [];
    canvas = createMockCanvas();
    audioContext = createMockAudioContext();
    
    audioContext.playSound = jest.fn().mockImplementation(async (soundId: string, options: any = {}) => {
      timingEvents.push({
        type: 'audio',
        timestamp: performance.now(),
        data: { soundId, options }
      });

      if (options.onBeat && options.beatTimes) {
        options.beatTimes.forEach((beatTime: number, index: number) => {
          setTimeout(() => {
            timingEvents.push({
              type: 'beat',
              timestamp: performance.now(),
              data: { beat: index, beatTime }
            });
            options.onBeat(index, beatTime);
          }, beatTime);
        });
      }

      return Promise.resolve();
    });

    particleSystem = new EnhancedParticleSystem(canvas);
    zodiacEffects = new ZodiacVisualEffects(particleSystem, audioContext);
    stateMachine = new SkillAnimationStateMachine(zodiacEffects, particleSystem, audioContext);
  });

  afterEach(() => {
    timingEvents = [];
  });

  describe('Beat Synchronization', () => {
    test('should trigger visual effects on audio beats', async () => {
      const beatTimes = [0, 250, 500, 750, 1000];
      let beatEffectsCount = 0;

      const emitter = particleSystem.createEmitter('beat-sync', {
        type: 'burst',
        particleCount: 30,
        lifetime: 200,
        size: { min: 3, max: 7 },
        velocity: { min: 100, max: 150 },
        color: { r: 255, g: 255, b: 0, a: 1 }
      }, 400, 300);

      await zodiacEffects.playZodiacSkillEffect(
        ZodiacSign.TIGER,
        'rhythmic-strike',
        { x: 400, y: 300 },
        [],
        {
          audioSync: true,
          beatTimes,
          onBeat: (beat: number, time: number) => {
            timingEvents.push({
              type: 'visual',
              timestamp: performance.now(),
              data: { beat, time, effect: 'burst' }
            });
            emitter.burst(30);
            beatEffectsCount++;
          }
        }
      );

      await waitForTime(1200);

      expect(beatEffectsCount).toBe(beatTimes.length);

      const audioEvents = timingEvents.filter(e => e.type === 'audio');
      const beatEvents = timingEvents.filter(e => e.type === 'beat');
      const visualEvents = timingEvents.filter(e => e.type === 'visual');

      expect(audioEvents.length).toBeGreaterThan(0);
      expect(beatEvents.length).toBe(beatTimes.length);
      expect(visualEvents.length).toBe(beatTimes.length);

      for (let i = 0; i < beatEvents.length; i++) {
        const beatEvent = beatEvents[i];
        const visualEvent = visualEvents[i];
        const timeDiff = Math.abs(visualEvent.timestamp - beatEvent.timestamp);
        expect(timeDiff).toBeLessThan(50);
      }
    });

    test('should maintain beat synchronization with tempo changes', async () => {
      const tempoChanges = [
        { time: 0, bpm: 120 },
        { time: 1000, bpm: 140 },
        { time: 2000, bpm: 100 },
        { time: 3000, bpm: 160 }
      ];

      let currentTempo = 120;
      let beatCount = 0;

      audioContext.playSound.mockImplementation(async (soundId: string, options: any = {}) => {
        timingEvents.push({
          type: 'audio',
          timestamp: performance.now(),
          data: { soundId, tempo: currentTempo }
        });

        if (options.onTempoChange) {
          tempoChanges.forEach(change => {
            setTimeout(() => {
              currentTempo = change.bpm;
              options.onTempoChange(change.bpm, change.time);
              timingEvents.push({
                type: 'beat',
                timestamp: performance.now(),
                data: { tempo: change.bpm, time: change.time }
              });
            }, change.time);
          });
        }

        return Promise.resolve();
      });

      await zodiacEffects.playZodiacSkillEffect(
        ZodiacSign.MONKEY,
        'tempo-dance',
        { x: 400, y: 300 },
        [],
        {
          audioSync: true,
          adaptiveTempo: true,
          onTempoChange: (newBpm: number, time: number) => {
            const beatInterval = 60000 / newBpm;
            
            timingEvents.push({
              type: 'visual',
              timestamp: performance.now(),
              data: { tempoChange: newBpm, beatInterval }
            });

            beatCount++;
          }
        }
      );

      await waitForTime(4000);

      expect(beatCount).toBe(tempoChanges.length);

      const tempoEvents = timingEvents.filter(e => e.type === 'visual' && e.data.tempoChange);
      expect(tempoEvents.length).toBe(tempoChanges.length);

      for (let i = 0; i < tempoEvents.length; i++) {
        expect(tempoEvents[i].data.tempoChange).toBe(tempoChanges[i].bpm);
      }
    });
  });

  describe('Latency Compensation', () => {
    test('should compensate for audio latency in visual effects', async () => {
      const audioLatency = 80;
      const targetSyncAccuracy = 20;

      audioContext.playSound.mockImplementation(async (soundId: string, options: any = {}) => {
        const audioStartTime = performance.now();
        
        setTimeout(() => {
          timingEvents.push({
            type: 'audio',
            timestamp: performance.now(),
            data: { soundId, actualStart: true }
          });
        }, audioLatency);

        return Promise.resolve();
      });

      await stateMachine.playSkillAnimation({
        id: 'latency-compensation-test',
        zodiac: ZodiacSign.DRAGON,
        sequence: [{
          name: 'precise-timing',
          duration: 500,
          effects: ['instant-flash'],
          sounds: ['precise-impact'],
          audioLatencyCompensation: audioLatency,
          transitions: []
        }]
      }, {
        position: { x: 400, y: 300 },
        targets: [],
        player: 'test-player'
      });

      const visualStartTime = performance.now();
      timingEvents.push({
        type: 'visual',
        timestamp: visualStartTime,
        data: { effect: 'instant-flash' }
      });

      await waitForTime(200);

      const audioEvents = timingEvents.filter(e => e.type === 'audio' && e.data.actualStart);
      const visualEvents = timingEvents.filter(e => e.type === 'visual');

      if (audioEvents.length > 0 && visualEvents.length > 0) {
        const timeDiff = Math.abs(audioEvents[0].timestamp - visualEvents[0].timestamp);
        expect(timeDiff).toBeLessThan(targetSyncAccuracy);
      }
    });

    test('should handle variable latency scenarios', async () => {
      const latencyScenarios = [
        { device: 'low-latency', latency: 20 },
        { device: 'normal', latency: 60 },
        { device: 'high-latency', latency: 150 },
        { device: 'variable', latency: () => 40 + Math.random() * 80 }
      ];

      for (const scenario of latencyScenarios) {
        const currentLatency = typeof scenario.latency === 'function' ? scenario.latency() : scenario.latency;
        
        audioContext.playSound.mockImplementation(async (soundId: string, options: any = {}) => {
          const delay = currentLatency;
          
          setTimeout(() => {
            timingEvents.push({
              type: 'audio',
              timestamp: performance.now(),
              data: { soundId, device: scenario.device, latency: delay }
            });
          }, delay);

          return Promise.resolve();
        });

        const startTime = performance.now();
        
        await zodiacEffects.playZodiacSkillEffect(
          ZodiacSign.PHOENIX,
          'adaptive-sync',
          { x: 400, y: 300 },
          [],
          {
            audioLatencyCompensation: currentLatency,
            device: scenario.device
          }
        );

        timingEvents.push({
          type: 'visual',
          timestamp: performance.now(),
          data: { device: scenario.device, expectedLatency: currentLatency }
        });

        await waitForTime(Math.max(currentLatency + 50, 100));
      }

      const deviceResults = latencyScenarios.map(scenario => {
        const audioEvent = timingEvents.find(e => 
          e.type === 'audio' && e.data.device === scenario.device
        );
        const visualEvent = timingEvents.find(e => 
          e.type === 'visual' && e.data.device === scenario.device
        );

        if (audioEvent && visualEvent) {
          return {
            device: scenario.device,
            syncAccuracy: Math.abs(audioEvent.timestamp - visualEvent.timestamp)
          };
        }
        return null;
      }).filter(Boolean);

      deviceResults.forEach(result => {
        if (result) {
          expect(result.syncAccuracy).toBeLessThan(100);
        }
      });
    });
  });

  describe('Animation State Synchronization', () => {
    test('should synchronize state transitions with audio cues', async () => {
      const stateTransitions = [
        { state: 'charge', duration: 800, audioTrigger: 'charge-start' },
        { state: 'release', duration: 400, audioTrigger: 'release-impact' },
        { state: 'aftermath', duration: 600, audioTrigger: 'aftermath-echo' }
      ];

      audioContext.playSound.mockImplementation(async (soundId: string, options: any = {}) => {
        timingEvents.push({
          type: 'audio',
          timestamp: performance.now(),
          data: { soundId, trigger: true }
        });

        if (options.onStateSync) {
          setTimeout(() => {
            options.onStateSync(soundId);
          }, 10);
        }

        return Promise.resolve();
      });

      await stateMachine.playSkillAnimation({
        id: 'state-sync-test',
        zodiac: ZodiacSign.TIGER,
        sequence: stateTransitions.map((transition, index) => ({
          name: transition.state,
          duration: transition.duration,
          effects: [`${transition.state}-effect`],
          sounds: [transition.audioTrigger],
          audioSync: true,
          onStateEnter: () => {
            timingEvents.push({
              type: 'state',
              timestamp: performance.now(),
              data: { state: transition.state, entered: true }
            });
          },
          transitions: index < stateTransitions.length - 1 ? [
            { to: stateTransitions[index + 1].state, condition: 'completed' }
          ] : []
        }))
      }, {
        position: { x: 400, y: 300 },
        targets: [],
        player: 'sync-test'
      });

      await waitForTime(2000);

      const audioEvents = timingEvents.filter(e => e.type === 'audio');
      const stateEvents = timingEvents.filter(e => e.type === 'state');

      expect(audioEvents.length).toBe(stateTransitions.length);
      expect(stateEvents.length).toBe(stateTransitions.length);

      for (let i = 0; i < stateTransitions.length; i++) {
        const audioEvent = audioEvents.find(e => 
          e.data.soundId === stateTransitions[i].audioTrigger
        );
        const stateEvent = stateEvents.find(e => 
          e.data.state === stateTransitions[i].state
        );

        if (audioEvent && stateEvent) {
          const timeDiff = Math.abs(audioEvent.timestamp - stateEvent.timestamp);
          expect(timeDiff).toBeLessThan(50);
        }
      }
    });

    test('should handle complex multi-layer audio-visual compositions', async () => {
      const composition = {
        layers: [
          {
            name: 'background-ambience',
            sounds: ['wind', 'distant-thunder'],
            effects: ['atmospheric-particles', 'subtle-glow'],
            timing: { start: 0, loop: true }
          },
          {
            name: 'main-action',
            sounds: ['sword-clash', 'impact'],
            effects: ['sword-trail', 'impact-burst'],
            timing: { start: 500, duration: 1000 }
          },
          {
            name: 'aftermath',
            sounds: ['echo-fade'],
            effects: ['dust-settle', 'fade-out'],
            timing: { start: 1500, duration: 800 }
          }
        ]
      };

      let layerCount = 0;

      audioContext.createSoundGroup.mockReturnValue('composition-group');
      audioContext.playSound.mockImplementation(async (soundId: string, options: any = {}) => {
        const layer = composition.layers.find(l => l.sounds.includes(soundId));
        
        timingEvents.push({
          type: 'audio',
          timestamp: performance.now(),
          data: { soundId, layer: layer?.name, group: 'composition-group' }
        });

        if (layer && options.onLayerSync) {
          options.onLayerSync(layer.name, soundId);
        }

        return Promise.resolve();
      });

      await zodiacEffects.playZodiacSkillEffect(
        ZodiacSign.DRAGON,
        'epic-composition',
        { x: 400, y: 300 },
        [{ x: 600, y: 200 }],
        {
          composition,
          audioSync: true,
          onLayerSync: (layerName: string, soundId: string) => {
            timingEvents.push({
              type: 'visual',
              timestamp: performance.now(),
              data: { layerName, soundId, synchronized: true }
            });
            layerCount++;
          }
        }
      );

      await waitForTime(3000);

      expect(layerCount).toBeGreaterThan(0);
      
      const audioLayers = timingEvents.filter(e => e.type === 'audio').map(e => e.data.layer);
      const visualLayers = timingEvents.filter(e => e.type === 'visual').map(e => e.data.layerName);
      
      composition.layers.forEach(layer => {
        expect(audioLayers).toContain(layer.name);
        expect(visualLayers).toContain(layer.name);
      });
    });
  });

  describe('Real-time Synchronization Monitoring', () => {
    test('should monitor and report synchronization accuracy', async () => {
      const syncMonitor = {
        measurements: [] as Array<{ audioTime: number; visualTime: number; accuracy: number }>,
        targetAccuracy: 30,
        
        measure(audioTime: number, visualTime: number) {
          const accuracy = Math.abs(audioTime - visualTime);
          this.measurements.push({ audioTime, visualTime, accuracy });
          return accuracy;
        },
        
        getAverageAccuracy() {
          return this.measurements.reduce((sum, m) => sum + m.accuracy, 0) / this.measurements.length;
        },
        
        getWorstAccuracy() {
          return Math.max(...this.measurements.map(m => m.accuracy));
        }
      };

      audioContext.playSound.mockImplementation(async (soundId: string, options: any = {}) => {
        const audioTime = performance.now();
        
        timingEvents.push({
          type: 'audio',
          timestamp: audioTime,
          data: { soundId }
        });

        if (options.onSync) {
          const visualTime = performance.now();
          const accuracy = syncMonitor.measure(audioTime, visualTime);
          
          timingEvents.push({
            type: 'visual',
            timestamp: visualTime,
            data: { soundId, syncAccuracy: accuracy }
          });
        }

        return Promise.resolve();
      });

      const testCases = [
        { zodiac: ZodiacSign.TIGER, skill: 'quick-strike' },
        { zodiac: ZodiacSign.DRAGON, skill: 'fire-breath' },
        { zodiac: ZodiacSign.PHOENIX, skill: 'resurrection' },
        { zodiac: ZodiacSign.TURTLE, skill: 'shield-bash' }
      ];

      for (const testCase of testCases) {
        await zodiacEffects.playZodiacSkillEffect(
          testCase.zodiac,
          testCase.skill,
          { x: 400, y: 300 },
          [],
          {
            monitorSync: true,
            onSync: () => {}
          }
        );

        await waitForTime(200);
      }

      expect(syncMonitor.measurements.length).toBeGreaterThan(0);
      expect(syncMonitor.getAverageAccuracy()).toBeLessThan(syncMonitor.targetAccuracy);
      expect(syncMonitor.getWorstAccuracy()).toBeLessThan(syncMonitor.targetAccuracy * 2);
    });

    test('should adapt to synchronization drift over time', async () => {
      let cumulativeDrift = 0;
      const driftRate = 2;
      const measurements: Array<{ time: number; drift: number; correction: number }> = [];

      audioContext.playSound.mockImplementation(async (soundId: string, options: any = {}) => {
        cumulativeDrift += driftRate;
        
        const audioTime = performance.now() + cumulativeDrift;
        const visualTime = performance.now();
        const drift = audioTime - visualTime;
        
        const correction = Math.min(drift * 0.5, 20);
        
        measurements.push({ time: performance.now(), drift, correction });
        
        timingEvents.push({
          type: 'audio',
          timestamp: audioTime,
          data: { soundId, drift, correction }
        });

        return Promise.resolve();
      });

      for (let i = 0; i < 20; i++) {
        await zodiacEffects.playZodiacSkillEffect(
          ZodiacSign.MONKEY,
          'drift-test',
          { x: 400, y: 300 },
          [],
          { adaptiveDrift: true }
        );

        await waitForTime(100);
      }

      const earlyMeasurements = measurements.slice(0, 5);
      const lateMeasurements = measurements.slice(-5);

      const earlyDrift = earlyMeasurements.reduce((sum, m) => sum + Math.abs(m.drift), 0) / earlyMeasurements.length;
      const lateDrift = lateMeasurements.reduce((sum, m) => sum + Math.abs(m.drift), 0) / lateMeasurements.length;

      expect(measurements.length).toBe(20);
      expect(lateDrift).toBeLessThan(earlyDrift * 1.5);
    });
  });
});