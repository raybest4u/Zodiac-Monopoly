/**
 * 同步系统集成测试
 * 测试完整的状态同步和存储机制
 */

import { StateSyncManager } from './StateSyncManager';
import { RealTimeStateManager } from './RealTimeStateManager';
import { StatePersistenceManager } from '../storage/StatePersistenceManager';
import { StateVersionControl } from '../storage/StateVersionControl';
import { DataConsistencyChecker } from '../validation/DataConsistencyChecker';
import { IntegratedSyncSystem } from './IntegratedSyncSystem';
import type {
  GameState,
  Player,
  PlayerAction,
  BoardCell,
  ZodiacSign
} from '../types/game';

describe('同步系统集成测试', () => {
  let syncManager: StateSyncManager;
  let realtimeManager: RealTimeStateManager;
  let persistenceManager: StatePersistenceManager;
  let versionControl: StateVersionControl;
  let consistencyChecker: DataConsistencyChecker;
  let integratedSystem: IntegratedSyncSystem;
  let mockGameState: GameState;
  let mockSaveManager: any;

  beforeEach(async () => {
    // 创建模拟SaveManager
    mockSaveManager = {
      saveGame: jest.fn().mockResolvedValue({ success: true }),
      loadGame: jest.fn().mockResolvedValue({ success: true, data: null }),
      deleteGame: jest.fn().mockResolvedValue({ success: true })
    };

    // 初始化各个组件
    syncManager = new StateSyncManager({
      syncStrategy: 'immediate',
      batchSize: 10,
      batchInterval: 1000,
      conflictResolution: 'timestamp_wins',
      consistencyLevel: 'strong',
      enableCompression: false,
      enableDeltaSync: true
    });

    realtimeManager = new RealTimeStateManager(syncManager, {
      broadcastDebounceMs: 100,
      maxBatchSize: 20,
      heartbeatIntervalMs: 5000,
      connectionTimeoutMs: 30000,
      enableOptimisticUpdates: true,
      enableConflictPrevention: true,
      retryPolicy: {
        maxRetries: 3,
        baseDelayMs: 100,
        backoffMultiplier: 2
      }
    });

    persistenceManager = new StatePersistenceManager(mockSaveManager, {
      autoSaveIntervalMs: 10000,
      maxHistoryEntries: 100,
      compressionEnabled: false,
      encryptionEnabled: false,
      backupStrategy: 'incremental',
      storageQuotaLimitMB: 100,
      cleanupThresholdDays: 30,
      replicationTargets: []
    });

    versionControl = new StateVersionControl({
      maxVersionsPerBranch: 50,
      enableAutoTagging: true,
      compressionThreshold: 1024,
      cleanupIntervalMs: 60000,
      maxBranches: 10,
      defaultBranch: 'main',
      enableBranchProtection: false,
      maxDiffSize: 10240
    });

    consistencyChecker = new DataConsistencyChecker();

    integratedSystem = new IntegratedSyncSystem(
      {
        sync: {
          syncStrategy: 'immediate',
          batchSize: 10,
          batchInterval: 1000,
          conflictResolution: 'timestamp_wins',
          consistencyLevel: 'strong',
          enableCompression: false,
          enableDeltaSync: true
        },
        realtime: {
          broadcastDebounceMs: 100,
          maxBatchSize: 20,
          heartbeatIntervalMs: 5000,
          connectionTimeoutMs: 30000,
          enableOptimisticUpdates: true,
          enableConflictPrevention: true,
          retryPolicy: {
            maxRetries: 3,
            baseDelayMs: 100,
            backoffMultiplier: 2
          }
        },
        persistence: {
          autoSaveIntervalMs: 10000,
          maxHistoryEntries: 100,
          compressionEnabled: false,
          encryptionEnabled: false,
          backupStrategy: 'incremental',
          storageQuotaLimitMB: 100,
          cleanupThresholdDays: 30,
          replicationTargets: []
        },
        versionControl: {
          maxVersionsPerBranch: 50,
          enableAutoTagging: true,
          compressionThreshold: 1024,
          cleanupIntervalMs: 60000,
          maxBranches: 10,
          defaultBranch: 'main',
          enableBranchProtection: false,
          maxDiffSize: 10240
        },
        validation: {
          enableAutoFix: true,
          strictMode: false,
          categories: [],
          maxViolations: 100,
          timeoutMs: 5000,
          customRules: []
        },
        integration: {
          enableRealTimeSync: true,
          enableVersionControl: true,
          enableConsistencyChecks: true,
          autoSaveInterval: 10000,
          conflictResolutionStrategy: 'automatic',
          performanceMonitoring: true,
          errorRecovery: true,
          backupFrequency: 60000
        }
      },
      syncManager,
      realtimeManager,
      persistenceManager,
      versionControl,
      consistencyChecker,
      mockSaveManager
    );

    mockGameState = createMockGameState();
    
    await integratedSystem.initialize();
  });

  afterEach(async () => {
    await integratedSystem.shutdown();
  });

  describe('系统初始化和配置', () => {
    test('集成系统正确初始化', async () => {
      const status = integratedSystem.getSystemStatus();
      expect(status.isRunning).toBe(true);
      expect(status.componentsStatus.syncManager).toBe(true);
      expect(status.componentsStatus.realtimeManager).toBe(true);
      expect(status.componentsStatus.persistenceManager).toBe(true);
    });

    test('系统状态监控正常工作', () => {
      const status = integratedSystem.getSystemStatus();
      
      expect(status.performance).toBeDefined();
      expect(status.statistics).toBeDefined();
      expect(typeof status.performance.syncLatency).toBe('number');
      expect(typeof status.statistics.totalOperations).toBe('number');
    });
  });

  describe('完整同步流程测试', () => {
    test('完整游戏状态同步流程', async () => {
      const gameId = 'test-game-001';
      
      // 1. 同步游戏状态
      const syncResult = await integratedSystem.syncGameState(
        gameId,
        mockGameState,
        'player1'
      );
      
      expect(syncResult.success).toBe(true);
      expect(syncResult.version).toBeDefined();

      // 2. 验证状态保存
      expect(mockSaveManager.saveGame).toHaveBeenCalled();

      // 3. 加载游戏状态
      const loadResult = await integratedSystem.loadGameState(gameId);
      expect(loadResult.success).toBe(true);
    });

    test('玩家行动处理流程', async () => {
      const gameId = 'test-game-002';
      await integratedSystem.syncGameState(gameId, mockGameState, 'player1');

      const action: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const actionResult = await integratedSystem.handlePlayerAction(action, mockGameState);
      expect(actionResult.success).toBe(true);
    });

    test('恢复点创建和恢复', async () => {
      const gameId = 'test-game-003';
      
      // 创建恢复点
      const restoreResult = await integratedSystem.createRestorePoint(
        gameId,
        mockGameState,
        '测试恢复点'
      );
      
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restorePointId).toBeDefined();

      // 验证恢复点列表
      const restorePoints = await persistenceManager.listRestorePoints(gameId);
      expect(restorePoints.length).toBeGreaterThan(0);
    });
  });

  describe('数据一致性测试', () => {
    test('数据一致性检查和自动修复', async () => {
      // 创建有问题的游戏状态
      const invalidState = {
        ...mockGameState,
        currentPlayerIndex: 999, // 无效的玩家索引
        players: mockGameState.players.map(p => ({
          ...p,
          money: -100 // 无效的金钱数量
        }))
      };

      const syncResult = await integratedSystem.syncGameState(
        'test-game-004',
        invalidState,
        'player1'
      );

      // 系统应该自动修复问题并同步成功
      expect(syncResult.success).toBe(true);
    });

    test('严重数据错误被正确拒绝', async () => {
      const criticallyInvalidState = {
        ...mockGameState,
        gameId: null, // 严重错误：缺少游戏ID
        players: [] // 严重错误：没有玩家
      } as any;

      const syncResult = await integratedSystem.syncGameState(
        'test-game-005',
        criticallyInvalidState,
        'player1'
      );

      expect(syncResult.success).toBe(false);
      expect(syncResult.error).toContain('Consistency check failed');
    });
  });

  describe('版本控制集成测试', () => {
    test('版本控制和分支管理', async () => {
      const gameId = 'test-game-006';
      
      // 初始提交
      const initialSync = await integratedSystem.syncGameState(
        gameId,
        mockGameState,
        'player1'
      );
      expect(initialSync.success).toBe(true);

      // 创建分支
      const branchResult = await versionControl.createBranch(
        'feature-test',
        initialSync.version,
        '测试分支'
      );
      expect(branchResult.success).toBe(true);

      // 在分支上进行修改
      const modifiedState = {
        ...mockGameState,
        round: mockGameState.round + 1
      };

      versionControl.switchBranch('feature-test');
      const branchSync = await integratedSystem.syncGameState(
        gameId,
        modifiedState,
        'player1'
      );
      expect(branchSync.success).toBe(true);

      // 验证分支版本
      const branches = versionControl.getBranches();
      const featureBranch = branches.find(b => b.name === 'feature-test');
      expect(featureBranch).toBeDefined();
      expect(featureBranch!.currentVersion).toBeGreaterThan(initialSync.version!);
    });

    test('版本差异计算', async () => {
      const gameId = 'test-game-007';
      
      // 第一个版本
      const v1Result = await integratedSystem.syncGameState(
        gameId,
        mockGameState,
        'player1'
      );

      // 修改状态
      const modifiedState = {
        ...mockGameState,
        turn: mockGameState.turn + 1,
        players: mockGameState.players.map(p => ({
          ...p,
          money: p.money + 100
        }))
      };

      // 第二个版本
      const v2Result = await integratedSystem.syncGameState(
        gameId,
        modifiedState,
        'player1'
      );

      // 计算差异
      const diffResult = await versionControl.diff(v1Result.version!, v2Result.version!);
      expect(diffResult.success).toBe(true);
      expect(diffResult.diff).toBeDefined();
      expect(diffResult.diff!.changes.length).toBeGreaterThan(0);
    });
  });

  describe('实时同步测试', () => {
    test('玩家连接和断开', async () => {
      const connectionEvents: any[] = [];
      const disconnectionEvents: any[] = [];

      integratedSystem.on('playerConnected', (data) => {
        connectionEvents.push(data);
      });

      integratedSystem.on('playerDisconnected', (data) => {
        disconnectionEvents.push(data);
      });

      // 模拟玩家连接
      await realtimeManager.registerConnection('player1', 'conn1', '1.0');
      await realtimeManager.registerConnection('player2', 'conn2', '1.0');

      // 等待事件处理
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(connectionEvents.length).toBe(2);

      // 模拟玩家断开
      await realtimeManager.unregisterConnection('player1');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(disconnectionEvents.length).toBe(1);
    });

    test('乐观更新和冲突解决', async () => {
      const gameId = 'test-game-008';
      await integratedSystem.syncGameState(gameId, mockGameState, 'player1');

      // 注册玩家连接
      await realtimeManager.registerConnection('player1', 'conn1', '1.0');

      // 发送乐观更新
      const optimisticUpdate = {
        type: 'set' as const,
        path: 'players[0].money',
        value: 5000,
        oldValue: mockGameState.players[0].money,
        playerId: 'player1'
      };

      const updateResult = await realtimeManager.applyStateUpdate(
        'player1',
        optimisticUpdate,
        true
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.updateId).toBeDefined();
    });
  });

  describe('错误处理和恢复测试', () => {
    test('同步错误自动恢复', async () => {
      const gameId = 'test-game-009';
      
      // 先创建一个有效的恢复点
      await integratedSystem.syncGameState(gameId, mockGameState, 'player1');
      await integratedSystem.createRestorePoint(gameId, mockGameState, '安全检查点');

      // 模拟保存失败
      mockSaveManager.saveGame.mockRejectedValueOnce(new Error('存储失败'));

      const errorResult = await integratedSystem.syncGameState(
        gameId,
        mockGameState,
        'player1'
      );

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toContain('存储失败');
    });

    test('系统事件记录', async () => {
      const gameId = 'test-game-010';
      
      // 执行一些操作
      await integratedSystem.syncGameState(gameId, mockGameState, 'player1');
      await integratedSystem.createRestorePoint(gameId, mockGameState, '测试事件');

      // 检查事件历史
      const eventHistory = integratedSystem.getEventHistory(10);
      expect(eventHistory.length).toBeGreaterThan(0);
      
      const syncEvents = eventHistory.filter(e => e.type === 'sync_completed');
      const backupEvents = eventHistory.filter(e => e.type === 'backup_created');
      
      expect(syncEvents.length).toBeGreaterThan(0);
      expect(backupEvents.length).toBeGreaterThan(0);
    });
  });

  describe('性能和压力测试', () => {
    test('批量操作性能', async () => {
      const gameId = 'test-game-011';
      const operationCount = 10;
      const operations: Promise<any>[] = [];

      const startTime = Date.now();

      for (let i = 0; i < operationCount; i++) {
        const modifiedState = {
          ...mockGameState,
          turn: mockGameState.turn + i
        };

        operations.push(
          integratedSystem.syncGameState(gameId, modifiedState, `player${i % 2 + 1}`)
        );
      }

      const results = await Promise.all(operations);
      const endTime = Date.now();

      const successfulOps = results.filter(r => r.success).length;
      const duration = endTime - startTime;

      expect(successfulOps).toBe(operationCount);
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成

      console.log(`批量操作性能: ${operationCount}次操作用时${duration}ms, 平均${duration/operationCount}ms/操作`);
    });

    test('并发访问处理', async () => {
      const gameId = 'test-game-012';
      
      // 并发同步相同游戏状态
      const concurrentOps = Array.from({ length: 5 }, (_, i) => {
        const state = {
          ...mockGameState,
          lastUpdateTime: Date.now() + i
        };
        return integratedSystem.syncGameState(gameId, state, `player${i + 1}`);
      });

      const results = await Promise.all(concurrentOps);
      const successCount = results.filter(r => r.success).length;

      expect(successCount).toBeGreaterThan(0); // 至少有一个操作成功
    });
  });

  describe('数据持久化验证', () => {
    test('持久化数据完整性', async () => {
      const gameId = 'test-game-013';
      
      // 保存多个版本
      const versions: number[] = [];
      for (let i = 0; i < 5; i++) {
        const state = {
          ...mockGameState,
          round: mockGameState.round + i,
          turn: mockGameState.turn + i
        };

        const result = await integratedSystem.syncGameState(gameId, state, 'player1');
        expect(result.success).toBe(true);
        if (result.version) {
          versions.push(result.version);
        }
      }

      // 验证版本历史
      const history = await versionControl.getVersionHistory({
        limit: 10
      });

      expect(history.length).toBeGreaterThanOrEqual(5);
      
      // 验证每个版本都可以正确加载
      for (const version of versions) {
        const loadResult = await integratedSystem.loadGameState(gameId, version);
        expect(loadResult.success).toBe(true);
        expect(loadResult.gameState).toBeDefined();
      }
    });

    test('存储统计信息准确性', async () => {
      const gameId = 'test-game-014';
      
      // 执行多次操作
      for (let i = 0; i < 3; i++) {
        const state = { ...mockGameState, turn: mockGameState.turn + i };
        await integratedSystem.syncGameState(gameId, state, 'player1');
        await integratedSystem.createRestorePoint(gameId, state, `恢复点${i}`);
      }

      const stats = await persistenceManager.getStorageStats();
      
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.restorePointCount).toBeGreaterThanOrEqual(3);
      expect(stats.averageSize).toBeGreaterThan(0);
    });
  });

  // 辅助函数
  function createMockGameState(): GameState {
    const players: Player[] = [
      {
        id: 'player1',
        name: '玩家1',
        zodiac: '龙' as ZodiacSign,
        isHuman: true,
        position: 0,
        money: 10000,
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
        name: '玩家2',
        zodiac: '虎' as ZodiacSign,
        isHuman: false,
        position: 0,
        money: 10000,
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

    const board: BoardCell[] = Array.from({ length: 40 }, (_, i) => ({
      id: `cell_${i}`,
      position: i,
      type: i === 0 ? 'start' : i % 10 === 0 ? 'special' : 'property',
      name: i === 0 ? '起点' : `财产${i}`,
      color: '#cccccc',
      description: `位置${i}的描述`,
      price: i > 0 && i % 10 !== 0 ? 1000 + i * 100 : undefined,
      rent: i > 0 && i % 10 !== 0 ? 100 + i * 10 : undefined
    }));

    return {
      gameId: 'test-game',
      status: 'playing',
      mode: 'classic',
      players,
      currentPlayerIndex: 0,
      round: 1,
      phase: 'roll_dice',
      turn: 1,
      board,
      eventHistory: [],
      season: '春',
      weather: '晴',
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
    };
  }
});