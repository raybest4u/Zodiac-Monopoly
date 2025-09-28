import { EventEmitter } from '../utils/EventEmitter';
import type { GameState, Player, PlayerAction } from '../types/game';
import type { StateSyncManager, SyncConfiguration, SyncMetadata } from './StateSyncManager';

export interface RealtimeConfig {
  broadcastDebounceMs: number;
  maxBatchSize: number;
  heartbeatIntervalMs: number;
  connectionTimeoutMs: number;
  enableOptimisticUpdates: boolean;
  enableConflictPrevention: boolean;
  retryPolicy: {
    maxRetries: number;
    baseDelayMs: number;
    backoffMultiplier: number;
  };
}

export interface StateUpdateEvent {
  type: 'state_changed' | 'player_action' | 'bulk_update' | 'rollback';
  path: string;
  oldValue: any;
  newValue: any;
  playerId?: string;
  actionId?: string;
  timestamp: number;
  optimistic?: boolean;
  metadata: SyncMetadata;
}

export interface ConnectionInfo {
  playerId: string;
  connectionId: string;
  lastHeartbeat: number;
  status: 'connected' | 'disconnected' | 'reconnecting';
  lag: number;
  version: string;
}

export interface StateSnapshot {
  gameState: GameState;
  version: number;
  timestamp: number;
  checksum: string;
  delta?: StateDelta;
}

export interface StateDelta {
  operations: StateOperation[];
  fromVersion: number;
  toVersion: number;
  timestamp: number;
}

export interface StateOperation {
  type: 'set' | 'merge' | 'delete' | 'array_push' | 'array_remove';
  path: string;
  value: any;
  oldValue?: any;
  playerId?: string;
}

export interface OptimisticUpdate {
  id: string;
  playerId: string;
  operation: StateOperation;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'rejected';
  rollbackData?: any;
}

export class RealTimeStateManager extends EventEmitter {
  private connections = new Map<string, ConnectionInfo>();
  private pendingUpdates = new Map<string, OptimisticUpdate>();
  private stateHistory: StateSnapshot[] = [];
  private currentVersion = 0;
  private lastBroadcast = 0;
  private broadcastQueue: StateUpdateEvent[] = [];
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isProcessingUpdates = false;

  constructor(
    private stateSyncManager: StateSyncManager,
    private config: RealtimeConfig
  ) {
    super();
    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private setupEventHandlers(): void {
    this.stateSyncManager.on('syncOperationCompleted', this.handleSyncComplete.bind(this));
    this.stateSyncManager.on('syncOperationFailed', this.handleSyncFailed.bind(this));
    this.stateSyncManager.on('conflictDetected', this.handleConflictDetected.bind(this));
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkConnections();
      this.sendHeartbeat();
    }, this.config.heartbeatIntervalMs);
  }

  async registerConnection(playerId: string, connectionId: string, version: string): Promise<void> {
    const connectionInfo: ConnectionInfo = {
      playerId,
      connectionId,
      lastHeartbeat: Date.now(),
      status: 'connected',
      lag: 0,
      version
    };

    this.connections.set(playerId, connectionInfo);
    this.emit('playerConnected', { playerId, connectionId });

    const currentSnapshot = await this.getCurrentSnapshot();
    this.emit('syncSnapshot', { playerId, snapshot: currentSnapshot });
  }

  async unregisterConnection(playerId: string): Promise<void> {
    const connection = this.connections.get(playerId);
    if (connection) {
      connection.status = 'disconnected';
      this.emit('playerDisconnected', { playerId, connectionId: connection.connectionId });
      
      setTimeout(() => {
        if (this.connections.get(playerId)?.status === 'disconnected') {
          this.connections.delete(playerId);
        }
      }, this.config.connectionTimeoutMs);
    }
  }

  async updateHeartbeat(playerId: string, lag: number): Promise<void> {
    const connection = this.connections.get(playerId);
    if (connection) {
      connection.lastHeartbeat = Date.now();
      connection.lag = lag;
      connection.status = 'connected';
    }
  }

  async applyStateUpdate(
    playerId: string,
    operation: StateOperation,
    optimistic = false
  ): Promise<{success: boolean; updateId?: string; error?: string}> {
    try {
      if (this.config.enableOptimisticUpdates && optimistic) {
        return await this.applyOptimisticUpdate(playerId, operation);
      } else {
        return await this.applyDirectUpdate(playerId, operation);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async applyOptimisticUpdate(
    playerId: string,
    operation: StateOperation
  ): Promise<{success: boolean; updateId: string}> {
    const updateId = `${playerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const optimisticUpdate: OptimisticUpdate = {
      id: updateId,
      playerId,
      operation,
      timestamp: Date.now(),
      status: 'pending',
      rollbackData: await this.captureRollbackData(operation.path)
    };

    this.pendingUpdates.set(updateId, optimisticUpdate);

    this.emit('optimisticUpdate', {
      updateId,
      playerId,
      operation,
      timestamp: optimisticUpdate.timestamp
    });

    this.stateSyncManager.syncStateChange(
      operation.path,
      operation.oldValue,
      operation.value,
      { playerId, actionId: updateId, optimistic: true }
    ).then(result => {
      if (result.success) {
        this.confirmOptimisticUpdate(updateId);
      } else {
        this.rejectOptimisticUpdate(updateId, result.message);
      }
    }).catch(error => {
      this.rejectOptimisticUpdate(updateId, error.message);
    });

    return { success: true, updateId };
  }

  private async applyDirectUpdate(
    playerId: string,
    operation: StateOperation
  ): Promise<{success: boolean; updateId?: string}> {
    const result = await this.stateSyncManager.syncStateChange(
      operation.path,
      operation.oldValue,
      operation.value,
      { playerId, optimistic: false }
    );

    if (result.success) {
      const updateEvent: StateUpdateEvent = {
        type: 'state_changed',
        path: operation.path,
        oldValue: operation.oldValue,
        newValue: operation.value,
        playerId,
        timestamp: Date.now(),
        metadata: { playerId, optimistic: false }
      };

      this.queueBroadcast(updateEvent);
      return { success: true, updateId: result.operationId };
    } else {
      return { success: false, error: result.message };
    }
  }

  private async confirmOptimisticUpdate(updateId: string): Promise<void> {
    const update = this.pendingUpdates.get(updateId);
    if (update) {
      update.status = 'confirmed';
      this.pendingUpdates.delete(updateId);

      const updateEvent: StateUpdateEvent = {
        type: 'state_changed',
        path: update.operation.path,
        oldValue: update.operation.oldValue,
        newValue: update.operation.value,
        playerId: update.playerId,
        actionId: updateId,
        timestamp: update.timestamp,
        optimistic: false,
        metadata: { playerId: update.playerId, actionId: updateId, optimistic: false }
      };

      this.queueBroadcast(updateEvent);
      this.emit('optimisticUpdateConfirmed', { updateId, playerId: update.playerId });
    }
  }

  private async rejectOptimisticUpdate(updateId: string, reason: string): Promise<void> {
    const update = this.pendingUpdates.get(updateId);
    if (update && update.rollbackData) {
      update.status = 'rejected';
      
      const rollbackEvent: StateUpdateEvent = {
        type: 'rollback',
        path: update.operation.path,
        oldValue: update.operation.value,
        newValue: update.rollbackData,
        playerId: update.playerId,
        actionId: updateId,
        timestamp: Date.now(),
        metadata: { playerId: update.playerId, actionId: updateId, rollback: true }
      };

      this.queueBroadcast(rollbackEvent);
      this.pendingUpdates.delete(updateId);
      
      this.emit('optimisticUpdateRejected', { 
        updateId, 
        playerId: update.playerId, 
        reason 
      });
    }
  }

  private async captureRollbackData(path: string): Promise<any> {
    const currentSnapshot = await this.getCurrentSnapshot();
    return this.getValueAtPath(currentSnapshot.gameState, path);
  }

  private getValueAtPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async processBulkUpdate(
    playerId: string,
    operations: StateOperation[]
  ): Promise<{success: boolean; results: Array<{success: boolean; updateId?: string; error?: string}>}> {
    if (!this.isValidConnection(playerId)) {
      return {
        success: false,
        results: operations.map(() => ({ success: false, error: 'Invalid connection' }))
      };
    }

    this.isProcessingUpdates = true;

    try {
      const results = await Promise.all(
        operations.map(operation => this.applyStateUpdate(playerId, operation, false))
      );

      const bulkUpdateEvent: StateUpdateEvent = {
        type: 'bulk_update',
        path: 'bulk',
        oldValue: null,
        newValue: operations,
        playerId,
        timestamp: Date.now(),
        metadata: { playerId, bulk: true, operationCount: operations.length }
      };

      this.queueBroadcast(bulkUpdateEvent);

      return {
        success: results.every(r => r.success),
        results
      };
    } finally {
      this.isProcessingUpdates = false;
    }
  }

  async handlePlayerAction(action: PlayerAction, gameState: GameState): Promise<void> {
    const actionEvent: StateUpdateEvent = {
      type: 'player_action',
      path: `actions.${action.type}`,
      oldValue: null,
      newValue: action,
      playerId: action.playerId,
      actionId: `action_${Date.now()}`,
      timestamp: action.timestamp,
      metadata: { playerId: action.playerId, actionType: action.type }
    };

    this.queueBroadcast(actionEvent);
    
    this.emit('playerAction', {
      action,
      gameState,
      timestamp: Date.now()
    });
  }

  private queueBroadcast(event: StateUpdateEvent): void {
    this.broadcastQueue.push(event);
    this.debouncedBroadcast();
  }

  private debouncedBroadcast(): void {
    const now = Date.now();
    if (now - this.lastBroadcast >= this.config.broadcastDebounceMs) {
      this.processBroadcastQueue();
    } else {
      setTimeout(() => {
        if (this.broadcastQueue.length > 0) {
          this.processBroadcastQueue();
        }
      }, this.config.broadcastDebounceMs - (now - this.lastBroadcast));
    }
  }

  private processBroadcastQueue(): void {
    if (this.broadcastQueue.length === 0) return;

    const events = this.broadcastQueue.splice(0, this.config.maxBatchSize);
    this.lastBroadcast = Date.now();

    for (const [playerId, connection] of this.connections) {
      if (connection.status === 'connected') {
        this.emit('broadcastToPlayer', {
          playerId,
          connectionId: connection.connectionId,
          events: events.filter(e => e.playerId !== playerId)
        });
      }
    }

    this.emit('broadcastCompleted', {
      eventCount: events.length,
      timestamp: this.lastBroadcast
    });
  }

  private checkConnections(): void {
    const now = Date.now();
    const timeout = this.config.connectionTimeoutMs;

    for (const [playerId, connection] of this.connections) {
      if (now - connection.lastHeartbeat > timeout) {
        if (connection.status === 'connected') {
          connection.status = 'reconnecting';
          this.emit('playerReconnecting', { playerId });
        } else if (connection.status === 'reconnecting' && 
                   now - connection.lastHeartbeat > timeout * 2) {
          this.unregisterConnection(playerId);
        }
      }
    }
  }

  private sendHeartbeat(): void {
    this.emit('heartbeat', {
      timestamp: Date.now(),
      activeConnections: this.connections.size,
      pendingUpdates: this.pendingUpdates.size
    });
  }

  private isValidConnection(playerId: string): boolean {
    const connection = this.connections.get(playerId);
    return connection !== undefined && connection.status === 'connected';
  }

  private async getCurrentSnapshot(): Promise<StateSnapshot> {
    if (this.stateHistory.length > 0) {
      return this.stateHistory[this.stateHistory.length - 1];
    }

    throw new Error('No state snapshot available');
  }

  async saveSnapshot(gameState: GameState): Promise<void> {
    const checksum = await this.calculateChecksum(gameState);
    const snapshot: StateSnapshot = {
      gameState: JSON.parse(JSON.stringify(gameState)),
      version: ++this.currentVersion,
      timestamp: Date.now(),
      checksum
    };

    this.stateHistory.push(snapshot);

    if (this.stateHistory.length > 50) {
      this.stateHistory = this.stateHistory.slice(-30);
    }

    this.emit('snapshotSaved', { version: snapshot.version, timestamp: snapshot.timestamp });
  }

  private async calculateChecksum(data: any): Promise<string> {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private handleSyncComplete(data: any): void {
    this.emit('stateUpdateCompleted', data);
  }

  private handleSyncFailed(data: any): void {
    this.emit('stateUpdateFailed', data);
  }

  private handleConflictDetected(data: any): void {
    this.emit('conflictResolved', data);
  }

  getConnectionStats(): {[playerId: string]: ConnectionInfo} {
    const stats: {[playerId: string]: ConnectionInfo} = {};
    for (const [playerId, connection] of this.connections) {
      stats[playerId] = { ...connection };
    }
    return stats;
  }

  getPendingUpdatesCount(): number {
    return this.pendingUpdates.size;
  }

  getCurrentVersion(): number {
    return this.currentVersion;
  }

  async cleanup(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.connections.clear();
    this.pendingUpdates.clear();
    this.broadcastQueue = [];
    this.removeAllListeners();
  }
}