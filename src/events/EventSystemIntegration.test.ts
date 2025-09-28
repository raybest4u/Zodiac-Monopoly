/**
 * 事件系统集成测试
 * 测试所有事件系统组件的协同工作
 */

import { EventTriggerSystem } from './EventTriggerSystem';
import { EventProcessingSystem } from './EventProcessor';
import { EventResponseSystem } from './EventResponseSystem';
import { RandomEventSystem } from './RandomEventSystem';
import { EventEffectSystem } from './EventEffectSystem';
import { EventUISystem } from './EventUISystem';
import type { GameEvent, EventType } from './EventSystem';

describe('事件系统集成测试', () => {
  let triggerSystem: EventTriggerSystem;
  let processingSystem: EventProcessingSystem;
  let responseSystem: EventResponseSystem;
  let randomEventSystem: RandomEventSystem;
  let effectSystem: EventEffectSystem;
  let uiSystem: EventUISystem;

  beforeEach(() => {
    triggerSystem = new EventTriggerSystem();
    processingSystem = new EventProcessingSystem();
    responseSystem = new EventResponseSystem();
    randomEventSystem = new RandomEventSystem();
    effectSystem = new EventEffectSystem();
    uiSystem = new EventUISystem();
  });

  afterEach(() => {
    triggerSystem.destroy();
    processingSystem.destroy();
    responseSystem.destroy();
    randomEventSystem.destroy();
    effectSystem.destroy();
    uiSystem.destroy();
  });

  describe('基础系统初始化', () => {
    test('所有系统正确初始化', () => {
      expect(triggerSystem).toBeDefined();
      expect(processingSystem).toBeDefined();
      expect(responseSystem).toBeDefined();
      expect(randomEventSystem).toBeDefined();
      expect(effectSystem).toBeDefined();
      expect(uiSystem).toBeDefined();
    });

    test('系统状态正确', () => {
      expect(triggerSystem).toBeDefined();
      expect(processingSystem.getSystemStats().registeredProcessors).toBe(0);
      expect(responseSystem.getSystemStats().activeResponses).toBe(0);
      expect(randomEventSystem.getStats().totalEvents).toBe(0);
      expect(effectSystem.getSystemStats().totalProcessed).toBe(0);
    });
  });

  describe('事件触发到处理流程', () => {
    test('完整事件流程：触发 -> 处理 -> 响应', async () => {
      // 注册事件处理器
      processingSystem.registerProcessor({
        id: 'test-processor',
        name: '测试处理器',
        eventTypes: ['test-event' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => ({
          success: true,
          data: { processed: true },
          duration: 10
        }),
        options: {},
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      // 注册事件响应器
      responseSystem.registerResponse({
        id: 'test-response',
        name: '测试响应',
        eventTypes: ['test-event' as EventType],
        priority: 1,
        enabled: true,
        execute: async (event, gameState, playerState) => ({
          success: true,
          responses: [{
            type: 'ui',
            delay: 0,
            data: { message: '事件已处理' }
          }]
        }),
        options: {}
      });

      // 创建测试事件
      const testEvent: GameEvent = {
        id: 'test-event-1',
        type: 'test-event' as EventType,
        priority: 'normal',
        timestamp: Date.now(),
        data: { test: true },
        processed: false
      };

      // 添加事件到处理队列
      processingSystem.addEvent(testEvent);

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证事件已被处理
      const stats = processingSystem.getSystemStats();
      expect(stats.processedEvents).toBe(1);
    });

    test('随机事件生成和处理', async () => {
      // 注册随机事件模板
      randomEventSystem.registerTemplate({
        id: 'luck-template',
        name: '幸运事件模板',
        category: 'luck',
        weight: 100,
        conditions: [],
        eventData: {
          title: '幸运降临',
          description: '你获得了意外收获！',
          effects: [{
            type: 'money',
            operation: 'add',
            value: 1000,
            target: 'current_player'
          }]
        }
      });

      // 尝试触发随机事件
      const context = {
        gameState: { turn: 1, players: [] },
        playerState: { id: 'player1', money: 5000 },
        boardState: { currentPosition: 5 },
        timestamp: Date.now()
      };

      const randomEvent = await randomEventSystem.tryTriggerEvent(context);
      
      if (randomEvent) {
        expect(randomEvent.title).toBe('幸运降临');
        expect(randomEvent.effects).toHaveLength(1);
        expect(randomEvent.effects[0].type).toBe('money');
      }
    });
  });

  describe('事件效果应用', () => {
    test('金钱效果应用', async () => {
      const playerState = {
        id: 'player1',
        money: 5000,
        position: 0,
        properties: [],
        statusEffects: []
      };

      const moneyEffect = {
        id: 'money-bonus',
        type: 'money' as const,
        operation: 'add' as const,
        value: 1000,
        target: 'current_player' as const,
        conditions: []
      };

      const context = {
        gameState: { players: [playerState] },
        playerState,
        boardState: { currentPosition: 0 },
        eventData: {},
        timestamp: Date.now()
      };

      const result = await effectSystem.applyEffect(moneyEffect, context);
      
      expect(result.success).toBe(true);
      expect(result.changes).toBeDefined();
      expect(result.changes?.money).toBe(1000);
    });

    test('位置效果应用', async () => {
      const playerState = {
        id: 'player1',
        money: 5000,
        position: 5,
        properties: [],
        statusEffects: []
      };

      const positionEffect = {
        id: 'position-change',
        type: 'position' as const,
        operation: 'set' as const,
        value: 10,
        target: 'current_player' as const,
        conditions: []
      };

      const context = {
        gameState: { players: [playerState] },
        playerState,
        boardState: { currentPosition: 5 },
        eventData: {},
        timestamp: Date.now()
      };

      const result = await effectSystem.applyEffect(positionEffect, context);
      
      expect(result.success).toBe(true);
      expect(result.changes).toBeDefined();
      expect(result.changes?.position).toBe(10);
    });
  });

  describe('事件链和批处理', () => {
    test('事件链触发', async () => {
      // 注册事件处理器，产生链式事件
      processingSystem.registerProcessor({
        id: 'chain-processor',
        name: '链式处理器',
        eventTypes: ['chain-start' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => ({
          success: true,
          nextEvents: [{
            type: 'chain-next' as EventType,
            priority: 'normal' as const,
            data: { chainId: event.data?.chainId, step: 2 }
          }],
          duration: 10
        }),
        options: {},
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      processingSystem.registerProcessor({
        id: 'chain-next-processor',
        name: '链式下一步处理器',
        eventTypes: ['chain-next' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => ({
          success: true,
          data: { chainCompleted: true },
          duration: 10
        }),
        options: {},
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      // 启动事件链
      const chainStartEvent: GameEvent = {
        id: 'chain-start-1',
        type: 'chain-start' as EventType,
        priority: 'normal',
        timestamp: Date.now(),
        data: { chainId: 'test-chain' },
        processed: false
      };

      processingSystem.addEvent(chainStartEvent);

      // 等待链式处理完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const stats = processingSystem.getSystemStats();
      expect(stats.processedEvents).toBeGreaterThanOrEqual(2);
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
          data: { batchProcessed: true },
          duration: 5
        }),
        options: { concurrent: true },
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      // 创建批量事件
      const batchEvents: GameEvent[] = Array.from({ length: 5 }, (_, i) => ({
        id: `batch-event-${i}`,
        type: 'batch-event' as EventType,
        priority: 'normal' as const,
        timestamp: Date.now(),
        data: { batchIndex: i },
        processed: false
      }));

      // 添加批量事件
      const batchId = processingSystem.addEventBatch(batchEvents, 'normal');
      
      expect(batchId).toBeDefined();

      // 等待批处理完成
      await new Promise(resolve => setTimeout(resolve, 200));

      const stats = processingSystem.getSystemStats();
      expect(stats.processedEvents).toBe(5);
    });
  });

  describe('UI系统集成', () => {
    test('事件UI显示', () => {
      const testEvent = {
        id: 'ui-test-event',
        title: '测试事件',
        description: '这是一个测试事件',
        type: 'luck' as const,
        effects: [],
        choices: [],
        metadata: {}
      };

      const instanceId = uiSystem.showEvent(testEvent, {
        theme: 'luck',
        position: 'center',
        autoClose: true,
        autoCloseDelay: 3000
      });

      expect(instanceId).toBeDefined();
      
      const instance = uiSystem.getEventInstance(instanceId);
      expect(instance).toBeDefined();
      expect(instance?.event.title).toBe('测试事件');
      expect(instance?.theme).toBe('luck');
    });

    test('事件选择处理', async () => {
      const choiceEvent = {
        id: 'choice-test-event',
        title: '选择事件',
        description: '请做出选择',
        type: 'choice' as const,
        effects: [],
        choices: [
          {
            id: 'choice1',
            text: '选择1',
            effects: [{ type: 'money', operation: 'add', value: 500, target: 'current_player', conditions: [] }]
          },
          {
            id: 'choice2',
            text: '选择2',
            effects: [{ type: 'money', operation: 'subtract', value: 200, target: 'current_player', conditions: [] }]
          }
        ],
        metadata: {}
      };

      const instanceId = uiSystem.showEvent(choiceEvent);
      
      // 模拟用户选择
      const choice = await uiSystem.handleChoice(instanceId, 'choice1');
      
      expect(choice).toBeDefined();
      expect(choice.choiceId).toBe('choice1');
      expect(choice.effects).toHaveLength(1);
    });
  });

  describe('错误处理和恢复', () => {
    test('处理器错误恢复', async () => {
      let attemptCount = 0;
      
      // 注册一个会失败的处理器
      processingSystem.registerProcessor({
        id: 'failing-processor',
        name: '失败处理器',
        eventTypes: ['error-test' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('模拟处理失败');
          }
          return {
            success: true,
            data: { recovered: true },
            duration: 10
          };
        },
        options: { retries: 3 },
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

      processingSystem.addEvent(errorEvent);

      // 等待重试完成
      await new Promise(resolve => setTimeout(resolve, 500));

      const stats = processingSystem.getProcessorStats('failing-processor');
      expect(stats.succeeded).toBe(1);
      expect(attemptCount).toBe(3);
    });

    test('系统超时处理', async () => {
      // 注册一个超时的处理器
      processingSystem.registerProcessor({
        id: 'timeout-processor',
        name: '超时处理器',
        eventTypes: ['timeout-test' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: { delayed: true },
                duration: 6000
              });
            }, 6000); // 超过默认5秒超时
          });
        },
        options: { timeout: 1000 }, // 1秒超时
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      const timeoutEvent: GameEvent = {
        id: 'timeout-test-1',
        type: 'timeout-test' as EventType,
        priority: 'normal',
        timestamp: Date.now(),
        data: {},
        processed: false
      };

      processingSystem.addEvent(timeoutEvent);

      // 等待超时处理
      await new Promise(resolve => setTimeout(resolve, 2000));

      const stats = processingSystem.getProcessorStats('timeout-processor');
      expect(stats.failed).toBeGreaterThan(0);
    });
  });

  describe('性能和统计', () => {
    test('系统性能统计', async () => {
      // 注册高性能处理器
      processingSystem.registerProcessor({
        id: 'perf-processor',
        name: '性能处理器',
        eventTypes: ['perf-test' as EventType],
        priority: 1,
        enabled: true,
        process: async (event, context) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return {
            success: true,
            data: { processed: true },
            duration: 50
          };
        },
        options: {},
        stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
      });

      // 处理多个事件以获取统计信息
      for (let i = 0; i < 10; i++) {
        const perfEvent: GameEvent = {
          id: `perf-test-${i}`,
          type: 'perf-test' as EventType,
          priority: 'normal',
          timestamp: Date.now(),
          data: { index: i },
          processed: false
        };
        processingSystem.addEvent(perfEvent);
      }

      // 等待所有处理完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      const stats = processingSystem.getProcessorStats('perf-processor');
      expect(stats.processed).toBe(10);
      expect(stats.succeeded).toBe(10);
      expect(stats.averageTime).toBeGreaterThan(0);

      const systemStats = processingSystem.getSystemStats();
      expect(systemStats.processedEvents).toBeGreaterThanOrEqual(10);
    });

    test('随机事件系统统计', async () => {
      // 添加多个事件模板
      randomEventSystem.registerTemplate({
        id: 'frequent-event',
        name: '频繁事件',
        category: 'common',
        weight: 50,
        conditions: [],
        eventData: {
          title: '普通事件',
          description: '普通描述',
          effects: []
        }
      });

      randomEventSystem.registerTemplate({
        id: 'rare-event',
        name: '稀有事件',
        category: 'rare',
        weight: 5,
        conditions: [],
        eventData: {
          title: '稀有事件',
          description: '稀有描述',
          effects: []
        }
      });

      const context = {
        gameState: { turn: 1, players: [] },
        playerState: { id: 'player1', money: 5000 },
        boardState: { currentPosition: 5 },
        timestamp: Date.now()
      };

      // 尝试多次触发
      let eventCount = 0;
      for (let i = 0; i < 20; i++) {
        const event = await randomEventSystem.tryTriggerEvent(context);
        if (event) eventCount++;
      }

      const stats = randomEventSystem.getStats();
      expect(stats.totalEvents).toBe(eventCount);
      expect(stats.templateCount).toBe(2);
    });
  });
});