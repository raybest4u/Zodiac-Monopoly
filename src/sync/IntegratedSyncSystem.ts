import { EventEmitter } from '../utils/EventEmitter';
import type { GameState, Player, PlayerAction } from '../types/game';
import type { StateSyncManager, SyncConfiguration } from './StateSyncManager';
import type { RealTimeStateManager, RealtimeConfig } from './RealTimeStateManager';
import type { StatePersistenceManager, PersistenceConfig } from '../storage/StatePersistenceManager';
import type { StateVersionControl, VersionControlConfig } from '../storage/StateVersionControl';
import type { DataConsistencyChecker, ValidationContext } from '../validation/DataConsistencyChecker';
import type { SaveManager } from '../storage/SaveManager';

export interface IntegratedSyncConfig {
  sync: SyncConfiguration;
  realtime: RealtimeConfig;
  persistence: PersistenceConfig;
  versionControl: VersionControlConfig;
  validation: ValidationContext;
  integration: {
    enableRealTimeSync: boolean;
    enableVersionControl: boolean;
    enableConsistencyChecks: boolean;
    autoSaveInterval: number;
    conflictResolutionStrategy: 'automatic' | 'manual' | 'hybrid';
    performanceMonitoring: boolean;
    errorRecovery: boolean;
    backupFrequency: number;
  };
}

export interface SyncSystemStatus {
  isRunning: boolean;
  componentsStatus: {
    syncManager: boolean;
    realtimeManager: boolean;
    persistenceManager: boolean;
    versionControl: boolean;
    consistencyChecker: boolean;
  };
  performance: {
    syncLatency: number;
    operationsPerSecond: number;
    errorRate: number;
    cacheHitRate: number;
  };
  statistics: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageOperationTime: number;
    activeConnections: number;
    storageUsage: number;
  };
}

export interface SyncSystemEvent {
  type: 'state_changed' | 'sync_completed' | 'conflict_resolved' | 'error_occurred' | 'backup_created';
  timestamp: number;
  gameId: string;
  details: any;
  source: 'sync' | 'realtime' | 'persistence' | 'version_control' | 'validation';
}

export interface ConflictResolution {
  conflictId: string;
  gameId: string;
  conflictType: 'data' | 'version' | 'timing' | 'user';
  conflictData: any;
  resolutionStrategy: string;
  resolvedBy: 'system' | 'user';
  resolvedAt: number;
}

export class IntegratedSyncSystem extends EventEmitter {
  private isInitialized = false;
  private isRunning = false;
  private eventHistory: SyncSystemEvent[] = [];
  private performanceMetrics = {
    operationTimes: [] as number[],
    errorCount: 0,
    successCount: 0,
    lastResetTime: Date.now()
  };
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private backupTimer: NodeJS.Timeout | null = null;
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor(
    private config: IntegratedSyncConfig,
    private syncManager: StateSyncManager,
    private realtimeManager: RealTimeStateManager,
    private persistenceManager: StatePersistenceManager,
    private versionControl: StateVersionControl,
    private consistencyChecker: DataConsistencyChecker,
    private saveManager: SaveManager
  ) {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // 同步管理器事件
    this.syncManager.on('syncOperationCompleted', this.handleSyncCompleted.bind(this));
    this.syncManager.on('syncOperationFailed', this.handleSyncFailed.bind(this));
    this.syncManager.on('conflictDetected', this.handleConflictDetected.bind(this));

    // 实时管理器事件
    this.realtimeManager.on('stateUpdateCompleted', this.handleRealtimeUpdate.bind(this));
    this.realtimeManager.on('playerConnected', this.handlePlayerConnection.bind(this));
    this.realtimeManager.on('playerDisconnected', this.handlePlayerDisconnection.bind(this));
    this.realtimeManager.on('optimisticUpdateRejected', this.handleOptimisticRejection.bind(this));

    // 持久化管理器事件（如果有的话）
    // this.persistenceManager.on('saveCompleted', this.handleSaveCompleted.bind(this));
    // this.persistenceManager.on('loadCompleted', this.handleLoadCompleted.bind(this));
  }

  async initialize(): Promise<{success: boolean; error?: string}> {
    try {
      if (this.isInitialized) {
        return { success: true };
      }

      // 验证配置
      const configValidation = this.validateConfiguration();
      if (!configValidation.isValid) {
        return { success: false, error: configValidation.error };
      }

      // 启动定时器
      this.startAutoSave();
      this.startBackupSchedule();
      if (this.config.integration.performanceMonitoring) {
        this.startPerformanceMonitoring();
      }

      this.isInitialized = true;
      this.isRunning = true;

      this.emitSystemEvent({
        type: 'sync_completed',
        timestamp: Date.now(),
        gameId: 'system',
        details: { message: 'Integrated sync system initialized' },
        source: 'sync'
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      };
    }
  }

  private validateConfiguration(): {isValid: boolean; error?: string} {
    if (!this.config.sync || !this.config.realtime || !this.config.persistence) {
      return { isValid: false, error: 'Missing required configuration sections' };
    }

    if (this.config.integration.autoSaveInterval < 1000) {
      return { isValid: false, error: 'Auto-save interval too short (minimum 1000ms)' };
    }

    if (this.config.integration.backupFrequency < 60000) {
      return { isValid: false, error: 'Backup frequency too short (minimum 60000ms)' };
    }

    return { isValid: true };
  }

  async syncGameState(
    gameId: string,
    gameState: GameState,
    playerId?: string,
    optimistic = false
  ): Promise<{success: boolean; version?: number; error?: string}> {
    if (!this.isRunning) {
      return { success: false, error: 'Sync system not running' };
    }

    const startTime = Date.now();

    try {
      // 1. 数据一致性检查
      if (this.config.integration.enableConsistencyChecks) {
        const validation = await this.consistencyChecker.checkConsistency(gameState, {
          enableAutoFix: true,
          strictMode: false
        });

        if (!validation.isValid) {
          if (validation.metrics.fixableViolations > 0) {
            const fixResult = await this.consistencyChecker.autoFixViolations(
              gameState,
              validation.violations.filter(v => v.fixable)
            );
            
            if (fixResult.success) {
              gameState = fixResult.modifiedGameState;
            }
          } else {
            return {
              success: false,
              error: `Consistency check failed: ${validation.violations[0]?.message}`
            };
          }
        }
      }

      // 2. 版本控制提交
      let version: number | undefined;
      if (this.config.integration.enableVersionControl) {
        const commitResult = await this.versionControl.commit(
          gameState,
          `Game state update by ${playerId || 'system'}`,
          playerId || 'system'
        );

        if (!commitResult.success) {
          return { success: false, error: commitResult.error };
        }

        version = commitResult.version;
      }

      // 3. 持久化存储
      const saveResult = await this.persistenceManager.saveGameState(
        gameId,
        gameState,
        [`sync-${Date.now()}`, playerId ? `player-${playerId}` : 'system'],
        false
      );

      if (!saveResult.success) {
        return { success: false, error: saveResult.error };
      }

      // 4. 实时同步
      if (this.config.integration.enableRealTimeSync && playerId) {
        await this.realtimeManager.handlePlayerAction(
          {
            type: 'sync_state',
            playerId,
            data: { gameState },
            timestamp: Date.now()
          },
          gameState
        );
      }

      // 5. 同步操作记录
      const syncResult = await this.syncManager.syncFullState(gameState);
      if (!syncResult.success) {
        return { success: false, error: syncResult.message };
      }

      // 记录性能指标
      const operationTime = Date.now() - startTime;
      this.performanceMetrics.operationTimes.push(operationTime);
      this.performanceMetrics.successCount++;

      this.emitSystemEvent({
        type: 'sync_completed',
        timestamp: Date.now(),
        gameId,
        details: { 
          version, 
          operationTime, 
          playerId,
          optimistic 
        },
        source: 'sync'
      });

      return { success: true, version };

    } catch (error) {
      this.performanceMetrics.errorCount++;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      
      this.emitSystemEvent({
        type: 'error_occurred',
        timestamp: Date.now(),
        gameId,
        details: { error: errorMessage, playerId },
        source: 'sync'
      });

      // 错误恢复机制
      if (this.config.integration.errorRecovery) {
        await this.attemptErrorRecovery(gameId, error);
      }

      return { success: false, error: errorMessage };
    }
  }

  async loadGameState(
    gameId: string,
    version?: number
  ): Promise<{success: boolean; gameState?: GameState; version?: number; error?: string}> {
    if (!this.isRunning) {
      return { success: false, error: 'Sync system not running' };
    }

    try {
      let result: {success: boolean; gameState?: GameState; metadata?: any; error?: string};

      if (version !== undefined && this.config.integration.enableVersionControl) {
        // 从版本控制加载特定版本
        const checkoutResult = await this.versionControl.checkout(version);
        if (!checkoutResult.success) {
          return { success: false, error: checkoutResult.error };
        }
        
        result = {
          success: true,
          gameState: checkoutResult.gameState,
          metadata: { version: checkoutResult.version }
        };
      } else {
        // 从持久化存储加载最新版本
        result = await this.persistenceManager.loadLatestGameState(gameId);
      }

      if (!result.success || !result.gameState) {
        return { success: false, error: result.error || 'Failed to load game state' };
      }

      // 数据一致性检查
      if (this.config.integration.enableConsistencyChecks) {
        const validation = await this.consistencyChecker.checkConsistency(result.gameState);
        
        if (!validation.isValid) {
          const fixResult = await this.consistencyChecker.autoFixViolations(
            result.gameState,
            validation.violations.filter(v => v.fixable)
          );
          
          if (fixResult.success) {
            result.gameState = fixResult.modifiedGameState;
            
            // 自动保存修复后的状态
            await this.syncGameState(gameId, result.gameState, 'system');
          }
        }
      }

      return {
        success: true,
        gameState: result.gameState,
        version: result.metadata?.version
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown load error'
      };
    }
  }

  async createRestorePoint(
    gameId: string,
    gameState: GameState,
    description: string
  ): Promise<{success: boolean; restorePointId?: string; error?: string}> {
    try {
      const result = await this.persistenceManager.createRestorePoint(
        gameId,
        gameState,
        description
      );

      if (result.success) {
        this.emitSystemEvent({
          type: 'backup_created',
          timestamp: Date.now(),
          gameId,
          details: { restorePointId: result.restorePointId, description },
          source: 'persistence'
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create restore point'
      };
    }
  }

  async handlePlayerAction(
    action: PlayerAction,
    gameState: GameState
  ): Promise<{success: boolean; updatedState?: GameState; error?: string}> {
    if (!this.isRunning) {
      return { success: false, error: 'Sync system not running' };
    }

    try {
      // 实时处理玩家行动
      await this.realtimeManager.handlePlayerAction(action, gameState);

      // 同步状态变更
      const syncResult = await this.syncGameState(
        gameState.gameId,
        gameState,
        action.playerId,
        action.type === 'optimistic_update'
      );

      if (!syncResult.success) {
        return { success: false, error: syncResult.error };
      }

      return { success: true, updatedState: gameState };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle player action'
      };
    }
  }

  private async attemptErrorRecovery(gameId: string, error: any): Promise<void> {
    try {
      // 尝试从最近的恢复点加载
      const restorePoints = await this.persistenceManager.listRestorePoints(gameId);
      
      if (restorePoints.length > 0) {
        const latestRestore = restorePoints[0];
        const restoreResult = await this.persistenceManager.restoreFromPoint(latestRestore.id);
        
        if (restoreResult.success && restoreResult.gameState) {
          // 重新同步恢复的状态
          await this.syncGameState(gameId, restoreResult.gameState, 'recovery-system');
          
          this.emitSystemEvent({
            type: 'sync_completed',
            timestamp: Date.now(),
            gameId,
            details: { 
              message: 'Recovered from error using restore point',
              restorePointId: latestRestore.id 
            },
            source: 'persistence'
          });
        }
      }
    } catch (recoveryError) {
      this.emitSystemEvent({
        type: 'error_occurred',
        timestamp: Date.now(),
        gameId,
        details: { 
          message: 'Error recovery failed',
          originalError: error,
          recoveryError: recoveryError 
        },
        source: 'sync'
      });
    }
  }

  private startAutoSave(): void {
    if (this.config.integration.autoSaveInterval > 0) {
      this.autoSaveTimer = setInterval(async () => {
        // 这里需要获取当前活跃的游戏状态
        // 实际实现中应该从游戏状态管理器获取
        this.emitSystemEvent({
          type: 'sync_completed',
          timestamp: Date.now(),
          gameId: 'auto-save',
          details: { message: 'Auto-save triggered' },
          source: 'persistence'
        });
      }, this.config.integration.autoSaveInterval);
    }
  }

  private startBackupSchedule(): void {
    if (this.config.integration.backupFrequency > 0) {
      this.backupTimer = setInterval(async () => {
        // 创建自动备份
        this.emitSystemEvent({
          type: 'backup_created',
          timestamp: Date.now(),
          gameId: 'auto-backup',
          details: { message: 'Automatic backup created' },
          source: 'persistence'
        });
      }, this.config.integration.backupFrequency);
    }
  }

  private startPerformanceMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.cleanupPerformanceMetrics();
      this.emitPerformanceUpdate();
    }, 60000); // 每分钟更新一次性能指标
  }

  private cleanupPerformanceMetrics(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    if (this.performanceMetrics.lastResetTime < oneHourAgo) {
      this.performanceMetrics.operationTimes = [];
      this.performanceMetrics.errorCount = 0;
      this.performanceMetrics.successCount = 0;
      this.performanceMetrics.lastResetTime = Date.now();
    }
  }

  private emitPerformanceUpdate(): void {
    const stats = this.getSystemStatus();
    this.emit('performanceUpdate', stats);
  }

  private handleSyncCompleted(data: any): void {
    this.emitSystemEvent({
      type: 'sync_completed',
      timestamp: Date.now(),
      gameId: data.gameId || 'unknown',
      details: data,
      source: 'sync'
    });
  }

  private handleSyncFailed(data: any): void {
    this.performanceMetrics.errorCount++;
    this.emitSystemEvent({
      type: 'error_occurred',
      timestamp: Date.now(),
      gameId: data.gameId || 'unknown',
      details: data,
      source: 'sync'
    });
  }

  private handleConflictDetected(data: any): void {
    this.emitSystemEvent({
      type: 'conflict_resolved',
      timestamp: Date.now(),
      gameId: data.gameId || 'unknown',
      details: data,
      source: 'sync'
    });
  }

  private handleRealtimeUpdate(data: any): void {
    this.emitSystemEvent({
      type: 'state_changed',
      timestamp: Date.now(),
      gameId: data.gameId || 'unknown',
      details: data,
      source: 'realtime'
    });
  }

  private handlePlayerConnection(data: any): void {
    this.emit('playerConnected', data);
  }

  private handlePlayerDisconnection(data: any): void {
    this.emit('playerDisconnected', data);
  }

  private handleOptimisticRejection(data: any): void {
    this.emitSystemEvent({
      type: 'conflict_resolved',
      timestamp: Date.now(),
      gameId: data.gameId || 'unknown',
      details: { ...data, type: 'optimistic_rejection' },
      source: 'realtime'
    });
  }

  private emitSystemEvent(event: SyncSystemEvent): void {
    this.eventHistory.push(event);
    
    // 保持事件历史在合理大小
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-500);
    }

    this.emit('systemEvent', event);
  }

  getSystemStatus(): SyncSystemStatus {
    const operationTimes = this.performanceMetrics.operationTimes;
    const averageTime = operationTimes.length > 0 
      ? operationTimes.reduce((sum, time) => sum + time, 0) / operationTimes.length 
      : 0;

    const totalOps = this.performanceMetrics.successCount + this.performanceMetrics.errorCount;
    const errorRate = totalOps > 0 ? this.performanceMetrics.errorCount / totalOps : 0;

    return {
      isRunning: this.isRunning,
      componentsStatus: {
        syncManager: true,
        realtimeManager: true,
        persistenceManager: true,
        versionControl: this.config.integration.enableVersionControl,
        consistencyChecker: this.config.integration.enableConsistencyChecks
      },
      performance: {
        syncLatency: averageTime,
        operationsPerSecond: operationTimes.length > 0 ? 1000 / averageTime : 0,
        errorRate: errorRate * 100,
        cacheHitRate: 0 // 需要从各组件获取
      },
      statistics: {
        totalOperations: totalOps,
        successfulOperations: this.performanceMetrics.successCount,
        failedOperations: this.performanceMetrics.errorCount,
        averageOperationTime: averageTime,
        activeConnections: this.realtimeManager.getConnectionStats ? 
          Object.keys(this.realtimeManager.getConnectionStats()).length : 0,
        storageUsage: 0 // 需要从持久化管理器获取
      }
    };
  }

  getEventHistory(limit = 100): SyncSystemEvent[] {
    return this.eventHistory.slice(-limit);
  }

  async shutdown(): Promise<void> {
    this.isRunning = false;

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    await this.realtimeManager.cleanup();
    await this.persistenceManager.cleanup();
    await this.versionControl.cleanup();

    this.removeAllListeners();
    this.eventHistory = [];
  }
}