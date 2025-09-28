/**
 * 状态同步管理器 - 游戏状态的实时同步和一致性保证
 * 提供多层次的状态同步、冲突解决和数据完整性验证
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { GameState, Player } from '../types/game';
import type { SaveData, StorageResult } from '../types/storage';

export interface SyncConfiguration {
  // 同步策略
  syncStrategy: 'immediate' | 'batched' | 'scheduled';
  batchSize: number;
  batchInterval: number;
  
  // 冲突解决
  conflictResolution: 'client_wins' | 'server_wins' | 'timestamp_wins' | 'merge';
  maxRetries: number;
  retryDelay: number;
  
  // 一致性级别
  consistencyLevel: 'eventual' | 'strong' | 'causal';
  
  // 性能设置
  enableCompression: boolean;
  enableDeltaSync: boolean;
  maxSyncPayloadSize: number;
  
  // 监控设置
  enableMetrics: boolean;
  metricsInterval: number;
}

export interface SyncEvent {
  id: string;
  type: SyncEventType;
  timestamp: number;
  source: string;
  data: any;
  checksum?: string;
  version?: number;
}

export type SyncEventType = 
  | 'state_changed' | 'state_synced' | 'sync_conflict' | 'sync_error'
  | 'batch_sync_start' | 'batch_sync_complete' | 'rollback_required'
  | 'consistency_check' | 'data_corruption_detected';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'batch';
  path: string;
  oldValue?: any;
  newValue?: any;
  timestamp: number;
  metadata: SyncMetadata;
}

export interface SyncMetadata {
  source: string;
  version: number;
  dependencies: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  tags: string[];
}

export interface SyncResult {
  success: boolean;
  operationId: string;
  timestamp: number;
  latency: number;
  conflicts: SyncConflict[];
  applied: boolean;
  rollback?: SyncOperation[];
}

export interface SyncConflict {
  id: string;
  path: string;
  localValue: any;
  remoteValue: any;
  resolution: 'auto' | 'manual' | 'pending';
  resolvedValue?: any;
  reason: string;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSyncTime: number;
  pendingOperations: number;
  conflictCount: number;
  latency: number;
  throughput: number;
  errorRate: number;
}

export interface SyncMetrics {
  totalOperations: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageLatency: number;
  throughputPerSecond: number;
  conflictRate: number;
  dataIntegrityScore: number;
  recentOperations: SyncOperation[];
}

/**
 * 状态同步管理器
 */
export class StateSyncManager extends EventEmitter {
  private config: SyncConfiguration;
  private pendingOperations = new Map<string, SyncOperation>();
  private syncQueue: SyncOperation[] = [];
  private conflictResolutionQueue: SyncConflict[] = [];
  
  private issyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private metricsTimer: NodeJS.Timeout | null = null;
  
  private metrics: SyncMetrics;
  private checksumCache = new Map<string, string>();
  private versionVector = new Map<string, number>();
  
  private readonly maxQueueSize = 10000;
  private readonly maxConflictAge = 300000; // 5分钟

  constructor(config: Partial<SyncConfiguration> = {}) {
    super();
    
    this.config = {
      syncStrategy: 'batched',
      batchSize: 50,
      batchInterval: 1000,
      conflictResolution: 'timestamp_wins',
      maxRetries: 3,
      retryDelay: 1000,
      consistencyLevel: 'eventual',
      enableCompression: true,
      enableDeltaSync: true,
      maxSyncPayloadSize: 1024 * 1024, // 1MB
      enableMetrics: true,
      metricsInterval: 30000, // 30秒
      ...config
    };

    this.metrics = {
      totalOperations: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageLatency: 0,
      throughputPerSecond: 0,
      conflictRate: 0,
      dataIntegrityScore: 1.0,
      recentOperations: []
    };

    this.initializeSyncSystem();
  }

  /**
   * 初始化同步系统
   */
  private initializeSyncSystem(): void {
    // 启动批量同步定时器
    if (this.config.syncStrategy === 'batched' || this.config.syncStrategy === 'scheduled') {
      this.startBatchSyncTimer();
    }

    // 启动度量收集
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    // 监听内部事件
    this.setupInternalEventHandlers();
  }

  /**
   * 同步游戏状态变更
   */
  async syncStateChange(
    path: string,
    oldValue: any,
    newValue: any,
    metadata: Partial<SyncMetadata> = {}
  ): Promise<SyncResult> {
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type: 'update',
      path,
      oldValue,
      newValue,
      timestamp: Date.now(),
      metadata: {
        source: 'local',
        version: this.getNextVersion(path),
        dependencies: [],
        priority: 'normal',
        tags: [],
        ...metadata
      }
    };

    return await this.processSyncOperation(operation);
  }

  /**
   * 批量同步多个状态变更
   */
  async syncBatchChanges(operations: Omit<SyncOperation, 'id' | 'timestamp'>[]): Promise<SyncResult[]> {
    const batchOperation: SyncOperation = {
      id: this.generateOperationId(),
      type: 'batch',
      path: 'batch',
      newValue: operations.map(op => ({
        ...op,
        id: this.generateOperationId(),
        timestamp: Date.now()
      })),
      timestamp: Date.now(),
      metadata: {
        source: 'local',
        version: this.getNextVersion('batch'),
        dependencies: [],
        priority: 'normal',
        tags: ['batch']
      }
    };

    const result = await this.processSyncOperation(batchOperation);
    return [result]; // 批量操作返回单个结果
  }

  /**
   * 强制完整状态同步
   */
  async syncFullState(gameState: GameState): Promise<SyncResult> {
    const checksum = this.calculateChecksum(gameState);
    
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type: 'update',
      path: 'gameState',
      newValue: gameState,
      timestamp: Date.now(),
      metadata: {
        source: 'local',
        version: this.getNextVersion('gameState'),
        dependencies: [],
        priority: 'high',
        tags: ['full_sync', 'checksum:' + checksum]
      }
    };

    return await this.processSyncOperation(operation);
  }

  /**
   * 处理远程状态变更
   */
  async handleRemoteStateChange(operation: SyncOperation): Promise<SyncResult> {
    const startTime = Date.now();
    let applied = false;
    const conflicts: SyncConflict[] = [];

    try {
      // 检查冲突
      const conflict = await this.detectConflict(operation);
      if (conflict) {
        conflicts.push(conflict);
        
        // 尝试自动解决冲突
        const resolved = await this.resolveConflict(conflict);
        if (resolved) {
          operation.newValue = conflict.resolvedValue;
          applied = true;
        }
      } else {
        applied = true;
      }

      if (applied) {
        await this.applyOperation(operation);
        this.updateVersionVector(operation);
        this.emit('stateChanged', {
          path: operation.path,
          value: operation.newValue,
          source: 'remote'
        });
      }

      const result: SyncResult = {
        success: true,
        operationId: operation.id,
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        conflicts,
        applied
      };

      this.updateMetrics(result);
      return result;

    } catch (error) {
      const result: SyncResult = {
        success: false,
        operationId: operation.id,
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        conflicts,
        applied: false
      };

      this.updateMetrics(result);
      this.emit('syncError', { operation, error });
      
      return result;
    }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    const now = Date.now();
    const recentOps = this.metrics.recentOperations.filter(
      op => now - op.timestamp < 60000
    );

    return {
      isConnected: true, // 在实际实现中应该检查网络连接
      lastSyncTime: this.getLastSyncTime(),
      pendingOperations: this.syncQueue.length,
      conflictCount: this.conflictResolutionQueue.length,
      latency: this.metrics.averageLatency,
      throughput: recentOps.length,
      errorRate: this.calculateErrorRate()
    };
  }

  /**
   * 获取同步指标
   */
  getSyncMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * 验证数据完整性
   */
  async validateDataIntegrity(gameState: GameState): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }> {
    const errors: string[] = [];
    const suggestions: string[] = [];

    try {
      // 检查玩家数据完整性
      for (const player of gameState.players) {
        if (!player.id || !player.name) {
          errors.push(`玩家数据不完整: ${player.id || '未知'}`);
        }
        
        if (player.money < 0 && player.money < -10000) {
          errors.push(`玩家${player.name}金钱异常: ${player.money}`);
          suggestions.push('检查金钱变更逻辑');
        }
        
        if (player.position < 0 || player.position >= gameState.board.length) {
          errors.push(`玩家${player.name}位置无效: ${player.position}`);
          suggestions.push('重置玩家位置');
        }
      }

      // 检查棋盘完整性
      if (!gameState.board || gameState.board.length === 0) {
        errors.push('棋盘数据缺失');
        suggestions.push('重新初始化棋盘');
      }

      // 检查游戏状态一致性
      if (gameState.currentPlayerIndex >= gameState.players.length) {
        errors.push('当前玩家索引超出范围');
        suggestions.push('重置当前玩家索引');
      }

      // 检查时间戳合理性
      const now = Date.now();
      if (gameState.lastUpdateTime > now + 60000) { // 允许1分钟误差
        errors.push('最后更新时间在未来');
        suggestions.push('同步系统时间');
      }

      return {
        isValid: errors.length === 0,
        errors,
        suggestions
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`数据完整性检查失败: ${error instanceof Error ? error.message : String(error)}`],
        suggestions: ['重新加载游戏状态']
      };
    }
  }

  /**
   * 回滚到指定版本
   */
  async rollbackToVersion(path: string, version: number): Promise<SyncResult> {
    // 在实际实现中，这里应该从版本历史中恢复
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type: 'update',
      path,
      newValue: null, // 应该从版本历史获取
      timestamp: Date.now(),
      metadata: {
        source: 'rollback',
        version,
        dependencies: [],
        priority: 'high',
        tags: ['rollback']
      }
    };

    return await this.processSyncOperation(operation);
  }

  /**
   * 清理过期数据
   */
  cleanup(): void {
    const now = Date.now();
    
    // 清理过期冲突
    this.conflictResolutionQueue = this.conflictResolutionQueue.filter(
      conflict => now - conflict.timestamp < this.maxConflictAge
    );
    
    // 清理校验和缓存
    this.checksumCache.clear();
    
    // 清理操作历史
    this.metrics.recentOperations = this.metrics.recentOperations.filter(
      op => now - op.timestamp < 300000 // 保留5分钟
    );
  }

  /**
   * 停止同步系统
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    this.pendingOperations.clear();
    this.syncQueue = [];
    this.conflictResolutionQueue = [];
    this.removeAllListeners();
  }

  // 私有方法

  /**
   * 处理同步操作
   */
  private async processSyncOperation(operation: SyncOperation): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      this.metrics.totalOperations++;
      
      // 添加到队列
      this.addToSyncQueue(operation);
      
      // 立即同步或等待批处理
      if (this.config.syncStrategy === 'immediate') {
        return await this.executeSyncOperation(operation);
      } else {
        // 返回待处理结果
        return {
          success: true,
          operationId: operation.id,
          timestamp: Date.now(),
          latency: Date.now() - startTime,
          conflicts: [],
          applied: false
        };
      }
      
    } catch (error) {
      this.metrics.failedSyncs++;
      return {
        success: false,
        operationId: operation.id,
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        conflicts: [],
        applied: false
      };
    }
  }

  /**
   * 执行同步操作
   */
  private async executeSyncOperation(operation: SyncOperation): Promise<SyncResult> {
    const startTime = Date.now();
    let conflicts: SyncConflict[] = [];
    
    try {
      // 检查冲突
      const conflict = await this.detectConflict(operation);
      if (conflict) {
        conflicts = [conflict];
        
        // 尝试解决冲突
        const resolved = await this.resolveConflict(conflict);
        if (!resolved) {
          throw new Error(`无法解决冲突: ${conflict.reason}`);
        }
        
        operation.newValue = conflict.resolvedValue;
      }
      
      // 应用操作
      await this.applyOperation(operation);
      
      // 更新版本向量
      this.updateVersionVector(operation);
      
      // 发出事件
      this.emit('stateChanged', {
        path: operation.path,
        value: operation.newValue,
        source: 'local'
      });
      
      const result: SyncResult = {
        success: true,
        operationId: operation.id,
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        conflicts,
        applied: true
      };
      
      this.updateMetrics(result);
      this.metrics.successfulSyncs++;
      
      return result;
      
    } catch (error) {
      this.metrics.failedSyncs++;
      
      return {
        success: false,
        operationId: operation.id,
        timestamp: Date.now(),
        latency: Date.now() - startTime,
        conflicts,
        applied: false
      };
    }
  }

  /**
   * 检测冲突
   */
  private async detectConflict(operation: SyncOperation): Promise<SyncConflict | null> {
    // 检查版本冲突
    const currentVersion = this.versionVector.get(operation.path) || 0;
    
    if (operation.metadata.version <= currentVersion) {
      return {
        id: this.generateConflictId(),
        path: operation.path,
        localValue: null, // 应该获取当前值
        remoteValue: operation.newValue,
        resolution: 'pending',
        reason: '版本冲突',
        timestamp: Date.now()
      };
    }
    
    return null;
  }

  /**
   * 解决冲突
   */
  private async resolveConflict(conflict: SyncConflict): Promise<boolean> {
    switch (this.config.conflictResolution) {
      case 'client_wins':
        conflict.resolvedValue = conflict.localValue;
        conflict.resolution = 'auto';
        return true;
        
      case 'server_wins':
        conflict.resolvedValue = conflict.remoteValue;
        conflict.resolution = 'auto';
        return true;
        
      case 'timestamp_wins':
        // 应该比较时间戳
        conflict.resolvedValue = conflict.remoteValue;
        conflict.resolution = 'auto';
        return true;
        
      case 'merge':
        // 实现智能合并逻辑
        conflict.resolvedValue = this.mergeValues(conflict.localValue, conflict.remoteValue);
        conflict.resolution = 'auto';
        return true;
        
      default:
        conflict.resolution = 'manual';
        this.conflictResolutionQueue.push(conflict);
        return false;
    }
  }

  /**
   * 合并值
   */
  private mergeValues(localValue: any, remoteValue: any): any {
    // 简单的合并策略，实际应该更复杂
    if (typeof localValue === 'object' && typeof remoteValue === 'object') {
      return { ...localValue, ...remoteValue };
    }
    
    return remoteValue; // 默认使用远程值
  }

  /**
   * 应用操作
   */
  private async applyOperation(operation: SyncOperation): Promise<void> {
    // 在实际实现中，这里应该更新实际的游戏状态
    this.emit('operationApplied', operation);
  }

  /**
   * 添加到同步队列
   */
  private addToSyncQueue(operation: SyncOperation): void {
    if (this.syncQueue.length >= this.maxQueueSize) {
      // 移除最旧的操作
      this.syncQueue.shift();
    }
    
    this.syncQueue.push(operation);
    this.pendingOperations.set(operation.id, operation);
  }

  /**
   * 启动批量同步定时器
   */
  private startBatchSyncTimer(): void {
    this.syncTimer = setInterval(async () => {
      if (this.syncQueue.length > 0 && !this.issyncing) {
        await this.processBatchSync();
      }
    }, this.config.batchInterval);
  }

  /**
   * 处理批量同步
   */
  private async processBatchSync(): Promise<void> {
    if (this.issyncing || this.syncQueue.length === 0) {
      return;
    }
    
    this.issyncing = true;
    
    try {
      const batch = this.syncQueue.splice(0, this.config.batchSize);
      
      this.emit('batchSyncStart', { operations: batch.length });
      
      for (const operation of batch) {
        await this.executeSyncOperation(operation);
        this.pendingOperations.delete(operation.id);
      }
      
      this.emit('batchSyncComplete', { operations: batch.length });
      
    } catch (error) {
      this.emit('syncError', { error, context: 'batch_sync' });
    } finally {
      this.issyncing = false;
    }
  }

  /**
   * 启动指标收集
   */
  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsInterval);
  }

  /**
   * 收集指标
   */
  private collectMetrics(): void {
    const now = Date.now();
    const recentOps = this.metrics.recentOperations.filter(
      op => now - op.timestamp < this.config.metricsInterval
    );
    
    this.metrics.throughputPerSecond = recentOps.length / (this.config.metricsInterval / 1000);
    this.metrics.conflictRate = this.conflictResolutionQueue.length / this.metrics.totalOperations;
    
    this.emit('metricsUpdated', this.metrics);
  }

  /**
   * 更新指标
   */
  private updateMetrics(result: SyncResult): void {
    // 更新平均延迟
    const total = this.metrics.averageLatency * this.metrics.totalOperations;
    this.metrics.averageLatency = (total + result.latency) / (this.metrics.totalOperations + 1);
    
    // 添加到最近操作
    this.metrics.recentOperations.push({
      id: result.operationId,
      type: 'update',
      path: '',
      timestamp: result.timestamp,
      metadata: {
        source: 'metrics',
        version: 0,
        dependencies: [],
        priority: 'low',
        tags: []
      }
    });
    
    // 限制最近操作数量
    if (this.metrics.recentOperations.length > 1000) {
      this.metrics.recentOperations = this.metrics.recentOperations.slice(-500);
    }
  }

  /**
   * 设置内部事件处理器
   */
  private setupInternalEventHandlers(): void {
    this.on('stateChanged', (data) => {
      // 记录状态变更
    });
    
    this.on('syncError', (data) => {
      console.error('同步错误:', data);
    });
  }

  /**
   * 生成操作ID
   */
  private generateOperationId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成冲突ID
   */
  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * 获取下一个版本号
   */
  private getNextVersion(path: string): number {
    const current = this.versionVector.get(path) || 0;
    const next = current + 1;
    this.versionVector.set(path, next);
    return next;
  }

  /**
   * 更新版本向量
   */
  private updateVersionVector(operation: SyncOperation): void {
    this.versionVector.set(operation.path, operation.metadata.version);
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(data: any): string {
    // 简单的校验和实现，实际应该使用更强的哈希算法
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  /**
   * 获取最后同步时间
   */
  private getLastSyncTime(): number {
    return this.metrics.recentOperations.length > 0 
      ? Math.max(...this.metrics.recentOperations.map(op => op.timestamp))
      : 0;
  }

  /**
   * 计算错误率
   */
  private calculateErrorRate(): number {
    if (this.metrics.totalOperations === 0) return 0;
    return this.metrics.failedSyncs / this.metrics.totalOperations;
  }
}