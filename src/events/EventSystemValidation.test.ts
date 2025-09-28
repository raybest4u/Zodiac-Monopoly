/**
 * 事件系统验证测试
 * 验证事件系统组件能够正常工作
 */

import { EventProcessingSystem } from './EventProcessor';
import type { GameEvent, EventType } from './EventSystem';

describe('事件系统验证测试', () => {
  let processingSystem: EventProcessingSystem;

  beforeEach(() => {
    processingSystem = new EventProcessingSystem();
  });

  afterEach(() => {
    processingSystem.destroy();
  });

  test('处理系统基本功能', async () => {
    // 系统初始状态
    expect(processingSystem).toBeDefined();
    const initialStats = processingSystem.getSystemStats();
    expect(initialStats.registeredProcessors).toBe(0);

    // 注册处理器
    processingSystem.registerProcessor({
      id: 'validator-processor',
      name: '验证处理器',
      eventTypes: ['validation-test' as EventType],
      priority: 1,
      enabled: true,
      process: async (event, context) => ({
        success: true,
        data: { 
          processed: true,
          eventId: event.id,
          eventType: event.type
        },
        duration: 5
      }),
      options: {},
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });

    // 验证处理器已注册
    const postRegisterStats = processingSystem.getSystemStats();
    expect(postRegisterStats.registeredProcessors).toBe(1);

    // 创建和处理事件
    const testEvent: GameEvent = {
      id: 'validation-event-1',
      type: 'validation-test' as EventType,
      priority: 'normal',
      timestamp: Date.now(),
      data: { message: 'Hello from validation test' },
      processed: false
    };

    const context = {
      gameState: { mode: 'test' },
      eventHistory: [],
      processingId: 'validation-proc-1',
      timestamp: Date.now(),
      metadata: { test: true }
    };

    // 处理事件
    const results = await processingSystem.processEvent(testEvent, context);

    // 验证处理结果
    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].data.processed).toBe(true);
    expect(results[0].data.eventId).toBe(testEvent.id);
    expect(testEvent.processed).toBe(true);

    // 验证统计信息
    const finalStats = processingSystem.getSystemStats();
    expect(finalStats.processedEvents).toBe(1);
  });

  test('批量事件处理验证', async () => {
    // 注册批处理器
    processingSystem.registerProcessor({
      id: 'batch-validator',
      name: '批量验证器',
      eventTypes: ['batch-validation' as EventType],
      priority: 1,
      enabled: true,
      process: async (event, context) => ({
        success: true,
        data: { batchIndex: event.data?.index },
        duration: 3
      }),
      options: { concurrent: true },
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });

    // 创建批量事件
    const batchEvents: GameEvent[] = [
      {
        id: 'batch-1',
        type: 'batch-validation' as EventType,
        priority: 'normal' as const,
        timestamp: Date.now(),
        data: { index: 1 },
        processed: false
      },
      {
        id: 'batch-2',
        type: 'batch-validation' as EventType,
        priority: 'normal' as const,
        timestamp: Date.now(),
        data: { index: 2 },
        processed: false
      }
    ];

    // 添加批量事件
    const batchId = processingSystem.addEventBatch(batchEvents, 'normal');
    expect(batchId).toBeDefined();

    // 等待处理完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 验证处理完成
    const stats = processingSystem.getSystemStats();
    expect(stats.processedEvents).toBe(2);
  });

  test('处理器错误处理验证', async () => {
    let attemptCount = 0;

    processingSystem.registerProcessor({
      id: 'error-validator',
      name: '错误验证器',
      eventTypes: ['error-validation' as EventType],
      priority: 1,
      enabled: true,
      process: async (event, context) => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('验证失败');
        }
        return {
          success: true,
          data: { recovered: true, attempts: attemptCount },
          duration: 5
        };
      },
      options: { retries: 1 },
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });

    const errorEvent: GameEvent = {
      id: 'error-validation-1',
      type: 'error-validation' as EventType,
      priority: 'normal',
      timestamp: Date.now(),
      data: {},
      processed: false
    };

    const context = {
      gameState: {},
      eventHistory: [],
      processingId: 'error-validation',
      timestamp: Date.now(),
      metadata: {}
    };

    const results = await processingSystem.processEvent(errorEvent, context);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].data.recovered).toBe(true);
    expect(attemptCount).toBe(2);
  });

  test('处理器统计验证', async () => {
    processingSystem.registerProcessor({
      id: 'stats-validator',
      name: '统计验证器',
      eventTypes: ['stats-validation' as EventType],
      priority: 1,
      enabled: true,
      process: async (event, context) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          success: true,
          data: { statsTest: true },
          duration: 10
        };
      },
      options: {},
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });

    const events = [
      {
        id: 'stats-1',
        type: 'stats-validation' as EventType,
        priority: 'normal' as const,
        timestamp: Date.now(),
        data: {},
        processed: false
      },
      {
        id: 'stats-2',
        type: 'stats-validation' as EventType,
        priority: 'normal' as const,
        timestamp: Date.now(),
        data: {},
        processed: false
      }
    ];

    const context = {
      gameState: {},
      eventHistory: [],
      processingId: 'stats-validation',
      timestamp: Date.now(),
      metadata: {}
    };

    for (const event of events) {
      await processingSystem.processEvent(event, context);
    }

    const stats = processingSystem.getProcessorStats('stats-validator');
    expect(stats.processed).toBe(2);
    expect(stats.succeeded).toBe(2);
    expect(stats.failed).toBe(0);
    expect(stats.averageTime).toBeGreaterThan(0);
  });

  test('事件链验证', async () => {
    let chainCompleted = false;

    // 第一个处理器 - 触发链式事件
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
          type: 'chain-continuation' as EventType,
          priority: 'normal' as const,
          data: { originalChain: event.data?.chainId }
        }],
        duration: 5
      }),
      options: {},
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });

    // 第二个处理器 - 处理链式事件
    processingSystem.registerProcessor({
      id: 'chain-continuation',
      name: '链式继续器',
      eventTypes: ['chain-continuation' as EventType],
      priority: 1,
      enabled: true,
      process: async (event, context) => {
        chainCompleted = true;
        return {
          success: true,
          data: { chainCompleted: true },
          duration: 5
        };
      },
      options: {},
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });

    // 启动事件链
    const chainEvent: GameEvent = {
      id: 'chain-validation-1',
      type: 'chain-start' as EventType,
      priority: 'normal',
      timestamp: Date.now(),
      data: { chainId: 'validation-chain' },
      processed: false
    };

    processingSystem.addEvent(chainEvent);

    // 等待链式处理完成
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(chainCompleted).toBe(true);
    const stats = processingSystem.getSystemStats();
    expect(stats.processedEvents).toBeGreaterThanOrEqual(2);
  });
});