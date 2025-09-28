/**
 * 事件系统基础集成测试
 * 测试核心系统组件的基本功能
 */

import { EventProcessingSystem } from './EventProcessor';
import { EventEffectSystem } from './EventEffectSystem';
import type { GameEvent, EventType } from './EventSystem';

describe('事件系统基础集成测试', () => {
  let processingSystem: EventProcessingSystem;
  let effectSystem: EventEffectSystem;

  beforeEach(() => {
    processingSystem = new EventProcessingSystem();
    effectSystem = new EventEffectSystem();
  });

  afterEach(() => {
    processingSystem.destroy();
    effectSystem.destroy();
  });

  describe('系统初始化', () => {
    test('处理系统正确初始化', () => {
      expect(processingSystem).toBeDefined();
      const stats = processingSystem.getSystemStats();
      expect(stats.registeredProcessors).toBe(0);
      expect(stats.processedEvents).toBe(0);
    });

    test('效果系统正确初始化', () => {
      expect(effectSystem).toBeDefined();
      const stats = effectSystem.getSystemStats();
      expect(stats.totalEffectsApplied).toBe(0);
      expect(stats.registeredHandlers).toBe(0);
    });
  });

  describe('事件处理流程', () => {
    test('注册和执行事件处理器', async () => {
      // 注册测试处理器
      processingSystem.registerProcessor({
        id: 'test-processor',
        name: '测试处理器',
        eventTypes: ['test-event' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => ({
          success: true,
          data: { processed: true, eventId: event.id },
          duration: 10
        }),
        options: {},
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      // 创建测试事件
      const testEvent: GameEvent = {
        id: 'test-event-1',
        type: 'test-event' as EventType,
        priority: 'normal',
        timestamp: Date.now(),
        data: { testData: 'hello world' },
        processed: false
      };

      // 处理事件
      const context = {
        gameState: { players: [] },
        eventHistory: [],
        processingId: 'test-proc-1',
        timestamp: Date.now(),
        metadata: {}
      };

      const results = await processingSystem.processEvent(testEvent, context);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].data.processed).toBe(true);
      expect(testEvent.processed).toBe(true);
    });

    test('批量事件处理', async () => {
      // 注册批处理器
      processingSystem.registerProcessor({
        id: 'batch-processor',
        name: '批处理器',
        eventTypes: ['batch-event' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => ({
          success: true,
          data: { batchId: event.data?.batchId },
          duration: 5
        }),
        options: { concurrent: true },
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      // 创建批量事件
      const batchEvents: GameEvent[] = Array.from({ length: 3 }, (_, i) => ({
        id: `batch-event-${i}`,
        type: 'batch-event' as EventType,
        priority: 'normal' as const,
        timestamp: Date.now(),
        data: { batchId: 'test-batch', index: i },
        processed: false
      }));

      // 添加批量事件
      const batchId = processingSystem.addEventBatch(batchEvents, 'normal');
      expect(batchId).toBeDefined();

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = processingSystem.getSystemStats();
      expect(stats.processedEvents).toBe(3);
    });
  });

  describe('事件效果应用', () => {
    test('金钱效果处理', async () => {
      const playerState = {
        id: 'player1',
        money: 5000,
        position: 0,
        properties: [],
        statusEffects: []
      };

      const moneyEffect = {
        id: 'test-money-effect',
        type: 'money' as const,
        operation: 'add' as const,
        value: 1500,
        target: 'current_player' as const,
        conditions: []
      };

      const context = {
        gameState: { players: [playerState] },
        playerState,
        boardState: { currentPosition: 0 },
        eventData: { testEvent: true },
        timestamp: Date.now()
      };

      const result = await effectSystem.applyEffect(moneyEffect, context);
      
      expect(result.success).toBe(true);
      expect(result.changes).toBeDefined();
    });

    test('多个效果连续应用', async () => {
      const playerState = {
        id: 'player1',
        money: 5000,
        position: 5,
        properties: [],
        statusEffects: []
      };

      const effects = [
        {
          id: 'effect1',
          type: 'money' as const,
          operation: 'add' as const,
          value: 1000,
          target: 'current_player' as const,
          conditions: []
        },
        {
          id: 'effect2',
          type: 'position' as const,
          operation: 'set' as const,
          value: 10,
          target: 'current_player' as const,
          conditions: []
        }
      ];

      const context = {
        gameState: { players: [playerState] },
        playerState,
        boardState: { currentPosition: 5 },
        eventData: {},
        timestamp: Date.now()
      };

      const results = [];
      for (const effect of effects) {
        const result = await effectSystem.applyEffect(effect, context);
        results.push(result);
      }

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('错误处理', () => {
    test('处理器异常恢复', async () => {
      let attemptCount = 0;
      
      processingSystem.registerProcessor({
        id: 'error-processor',
        name: '错误处理器',
        eventTypes: ['error-test' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('第一次尝试失败');
          }
          return {
            success: true,
            data: { attempt: attemptCount },
            duration: 10
          };
        },
        options: { retries: 2 },
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      const errorEvent: GameEvent = {
        id: 'error-test-1',
        type: 'error-test' as EventType,
        priority: 'normal',
        timestamp: Date.now(),
        data: {},
        processed: false
      };

      const context = {
        gameState: {},
        eventHistory: [],
        processingId: 'error-test',
        timestamp: Date.now(),
        metadata: {}
      };

      const results = await processingSystem.processEvent(errorEvent, context);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(attemptCount).toBe(2);
    });

    test('无效效果处理', async () => {
      const invalidEffect = {
        id: 'invalid-effect',
        type: 'invalid-type' as any,
        operation: 'invalid-op' as any,
        value: 'not-a-number' as any,
        target: 'invalid-target' as any,
        conditions: []
      };

      const context = {
        gameState: {},
        playerState: { id: 'player1' },
        boardState: {},
        eventData: {},
        timestamp: Date.now()
      };

      const result = await effectSystem.applyEffect(invalidEffect, context);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('系统统计', () => {
    test('处理器统计信息', async () => {
      processingSystem.registerProcessor({
        id: 'stats-processor',
        name: '统计处理器',
        eventTypes: ['stats-test' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => {
          await new Promise(resolve => setTimeout(resolve, 25));
          return {
            success: true,
            data: { processed: true },
            duration: 25
          };
        },
        options: {},
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      const events = Array.from({ length: 3 }, (_, i) => ({
        id: `stats-event-${i}`,
        type: 'stats-test' as EventType,
        priority: 'normal' as const,
        timestamp: Date.now(),
        data: { index: i },
        processed: false
      }));

      const context = {
        gameState: {},
        eventHistory: [],
        processingId: 'stats-test',
        timestamp: Date.now(),
        metadata: {}
      };

      // 处理所有事件
      for (const event of events) {
        await processingSystem.processEvent(event, context);
      }

      const stats = processingSystem.getProcessorStats('stats-processor');
      expect(stats.processed).toBe(3);
      expect(stats.succeeded).toBe(3);
      expect(stats.failed).toBe(0);
      expect(stats.averageTime).toBeGreaterThan(0);
    });
  });

  describe('事件链', () => {
    test('触发后续事件', async () => {
      let chainEventProcessed = false;

      // 注册链式处理器
      processingSystem.registerProcessor({
        id: 'chain-starter',
        name: '链式启动器',
        eventTypes: ['chain-start' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => ({
          success: true,
          data: { chainStarted: true },
          nextEvents: [{
            type: 'chain-next' as EventType,
            priority: 'normal' as const,
            data: { chainId: event.data?.chainId }
          }],
          duration: 10
        }),
        options: {},
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      processingSystem.registerProcessor({
        id: 'chain-next',
        name: '链式下一步',
        eventTypes: ['chain-next' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => {
          chainEventProcessed = true;
          return {
            success: true,
            data: { chainCompleted: true },
            duration: 10
          };
        },
        options: {},
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      const chainEvent: GameEvent = {
        id: 'chain-start-1',
        type: 'chain-start' as EventType,
        priority: 'normal',
        timestamp: Date.now(),
        data: { chainId: 'test-chain' },
        processed: false
      };

      processingSystem.addEvent(chainEvent);

      // 等待链式处理完成
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(chainEventProcessed).toBe(true);
      const stats = processingSystem.getSystemStats();
      expect(stats.processedEvents).toBeGreaterThanOrEqual(2);
    });
  });
});