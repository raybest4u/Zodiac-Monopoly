import type { GameState, Player } from '../types/game';
import type { SaveManager } from './SaveManager';

export interface PersistenceConfig {
  autoSaveIntervalMs: number;
  maxHistoryEntries: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupStrategy: 'incremental' | 'full' | 'differential';
  storageQuotaLimitMB: number;
  cleanupThresholdDays: number;
  replicationTargets: string[];
}

export interface PersistenceMetadata {
  gameId: string;
  version: number;
  timestamp: number;
  checksum: string;
  size: number;
  compressionRatio?: number;
  encrypted: boolean;
  tags: string[];
  playersCount: number;
  gamePhase: string;
}

export interface StorageEntry {
  id: string;
  gameId: string;
  data: GameState;
  metadata: PersistenceMetadata;
  createdAt: number;
  updatedAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface BackupEntry {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  baseVersion?: number;
  data: any;
  metadata: PersistenceMetadata;
  createdAt: number;
}

export interface RestorePoint {
  id: string;
  gameId: string;
  description: string;
  gameState: GameState;
  metadata: PersistenceMetadata;
  createdAt: number;
  automatic: boolean;
}

export interface PersistenceStats {
  totalEntries: number;
  totalSize: number;
  averageSize: number;
  oldestEntry: number;
  newestEntry: number;
  compressionRatio: number;
  storageUtilization: number;
  backupCount: number;
  restorePointCount: number;
}

export interface StorageCleanupResult {
  entriesRemoved: number;
  spaceFreed: number;
  backupsRemoved: number;
  errors: string[];
}

export class StatePersistenceManager {
  private storage = new Map<string, StorageEntry>();
  private backups = new Map<string, BackupEntry>();
  private restorePoints = new Map<string, RestorePoint>();
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private currentVersion = 0;
  private lastBackupVersion = 0;

  constructor(
    private saveManager: SaveManager,
    private config: PersistenceConfig
  ) {
    this.startAutoSave();
    this.startPeriodicCleanup();
  }

  private startAutoSave(): void {
    if (this.config.autoSaveIntervalMs > 0) {
      this.autoSaveTimer = setInterval(async () => {
        await this.performAutoSave();
      }, this.config.autoSaveIntervalMs);
    }
  }

  private startPeriodicCleanup(): void {
    const cleanupInterval = 24 * 60 * 60 * 1000; // 每天清理一次
    this.cleanupTimer = setInterval(async () => {
      await this.performCleanup();
    }, cleanupInterval);
  }

  async saveGameState(
    gameId: string,
    gameState: GameState,
    tags: string[] = [],
    createRestorePoint = false
  ): Promise<{success: boolean; entryId?: string; error?: string}> {
    try {
      const entryId = `${gameId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();
      
      const processedData = await this.preprocessData(gameState);
      const checksum = await this.calculateChecksum(processedData);
      const size = this.calculateSize(processedData);

      const metadata: PersistenceMetadata = {
        gameId,
        version: ++this.currentVersion,
        timestamp,
        checksum,
        size,
        encrypted: this.config.encryptionEnabled,
        tags: [...tags, 'auto-save'],
        playersCount: gameState.players.length,
        gamePhase: gameState.phase
      };

      if (this.config.compressionEnabled) {
        const compressed = await this.compressData(processedData);
        metadata.compressionRatio = size / this.calculateSize(compressed);
        processedData.data = compressed;
      }

      const entry: StorageEntry = {
        id: entryId,
        gameId,
        data: processedData,
        metadata,
        createdAt: timestamp,
        updatedAt: timestamp,
        accessCount: 0,
        lastAccessed: timestamp
      };

      this.storage.set(entryId, entry);

      await this.saveManager.saveGame(gameId, processedData);

      if (createRestorePoint) {
        await this.createRestorePoint(gameId, gameState, `Manual save at ${new Date().toISOString()}`);
      }

      await this.createBackup(entry);

      await this.enforceStorageQuota();

      return { success: true, entryId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during save'
      };
    }
  }

  async loadGameState(
    entryId: string
  ): Promise<{success: boolean; gameState?: GameState; metadata?: PersistenceMetadata; error?: string}> {
    try {
      const entry = this.storage.get(entryId);
      if (!entry) {
        return { success: false, error: 'Entry not found' };
      }

      entry.accessCount++;
      entry.lastAccessed = Date.now();

      let gameState = entry.data;

      if (this.config.compressionEnabled && entry.metadata.compressionRatio) {
        gameState = await this.decompressData(gameState);
      }

      if (entry.metadata.encrypted) {
        gameState = await this.decryptData(gameState);
      }

      const isValid = await this.validateChecksum(gameState, entry.metadata.checksum);
      if (!isValid) {
        return { success: false, error: 'Data integrity check failed' };
      }

      return {
        success: true,
        gameState,
        metadata: entry.metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during load'
      };
    }
  }

  async loadLatestGameState(gameId: string): Promise<{success: boolean; gameState?: GameState; metadata?: PersistenceMetadata; error?: string}> {
    const entries = Array.from(this.storage.values())
      .filter(entry => entry.gameId === gameId)
      .sort((a, b) => b.metadata.version - a.metadata.version);

    if (entries.length === 0) {
      return { success: false, error: 'No saved states found for this game' };
    }

    return await this.loadGameState(entries[0].id);
  }

  async listGameStates(gameId: string): Promise<PersistenceMetadata[]> {
    return Array.from(this.storage.values())
      .filter(entry => entry.gameId === gameId)
      .map(entry => entry.metadata)
      .sort((a, b) => b.version - a.version);
  }

  async createRestorePoint(
    gameId: string,
    gameState: GameState,
    description: string,
    automatic = false
  ): Promise<{success: boolean; restorePointId?: string; error?: string}> {
    try {
      const restorePointId = `restore_${gameId}_${Date.now()}`;
      const timestamp = Date.now();

      const processedData = await this.preprocessData(gameState);
      const checksum = await this.calculateChecksum(processedData);

      const metadata: PersistenceMetadata = {
        gameId,
        version: this.currentVersion,
        timestamp,
        checksum,
        size: this.calculateSize(processedData),
        encrypted: false,
        tags: automatic ? ['auto-restore'] : ['manual-restore'],
        playersCount: gameState.players.length,
        gamePhase: gameState.phase
      };

      const restorePoint: RestorePoint = {
        id: restorePointId,
        gameId,
        description,
        gameState: processedData,
        metadata,
        createdAt: timestamp,
        automatic
      };

      this.restorePoints.set(restorePointId, restorePoint);

      await this.enforceRestorePointLimit();

      return { success: true, restorePointId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create restore point'
      };
    }
  }

  async restoreFromPoint(
    restorePointId: string
  ): Promise<{success: boolean; gameState?: GameState; error?: string}> {
    try {
      const restorePoint = this.restorePoints.get(restorePointId);
      if (!restorePoint) {
        return { success: false, error: 'Restore point not found' };
      }

      const isValid = await this.validateChecksum(
        restorePoint.gameState,
        restorePoint.metadata.checksum
      );

      if (!isValid) {
        return { success: false, error: 'Restore point data integrity check failed' };
      }

      return {
        success: true,
        gameState: restorePoint.gameState
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore from point'
      };
    }
  }

  async listRestorePoints(gameId: string): Promise<Array<{id: string; description: string; timestamp: number; automatic: boolean}>> {
    return Array.from(this.restorePoints.values())
      .filter(point => point.gameId === gameId)
      .map(point => ({
        id: point.id,
        description: point.description,
        timestamp: point.createdAt,
        automatic: point.automatic
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  private async createBackup(entry: StorageEntry): Promise<void> {
    const shouldCreateBackup = this.shouldCreateBackup(entry.metadata.version);
    if (!shouldCreateBackup) return;

    const backupId = `backup_${entry.gameId}_${entry.metadata.version}`;
    const backupType = this.determineBackupType(entry.metadata.version);

    let backupData: any;
    let baseVersion: number | undefined;

    switch (backupType) {
      case 'full':
        backupData = entry.data;
        break;
      case 'incremental':
        backupData = await this.createIncrementalBackup(entry);
        baseVersion = this.lastBackupVersion;
        break;
      case 'differential':
        backupData = await this.createDifferentialBackup(entry);
        baseVersion = this.getLastFullBackupVersion();
        break;
    }

    const backup: BackupEntry = {
      id: backupId,
      type: backupType,
      baseVersion,
      data: backupData,
      metadata: entry.metadata,
      createdAt: Date.now()
    };

    this.backups.set(backupId, backup);
    this.lastBackupVersion = entry.metadata.version;
  }

  private shouldCreateBackup(version: number): boolean {
    const versionsSinceLastBackup = version - this.lastBackupVersion;
    return versionsSinceLastBackup >= 5; // 每5个版本创建一次备份
  }

  private determineBackupType(version: number): 'full' | 'incremental' | 'differential' {
    if (version % 20 === 0) return 'full'; // 每20个版本全备份
    return this.config.backupStrategy;
  }

  private async createIncrementalBackup(entry: StorageEntry): Promise<any> {
    const lastBackup = this.getLastBackup();
    if (!lastBackup) {
      return entry.data; // 首次备份，返回完整数据
    }

    return this.calculateDelta(lastBackup.data, entry.data);
  }

  private async createDifferentialBackup(entry: StorageEntry): Promise<any> {
    const lastFullBackup = this.getLastFullBackup();
    if (!lastFullBackup) {
      return entry.data; // 没有全备份，返回完整数据
    }

    return this.calculateDelta(lastFullBackup.data, entry.data);
  }

  private getLastBackup(): BackupEntry | undefined {
    const backups = Array.from(this.backups.values())
      .sort((a, b) => b.createdAt - a.createdAt);
    return backups[0];
  }

  private getLastFullBackup(): BackupEntry | undefined {
    const fullBackups = Array.from(this.backups.values())
      .filter(backup => backup.type === 'full')
      .sort((a, b) => b.createdAt - a.createdAt);
    return fullBackups[0];
  }

  private getLastFullBackupVersion(): number {
    const lastFullBackup = this.getLastFullBackup();
    return lastFullBackup ? lastFullBackup.metadata.version : 0;
  }

  private calculateDelta(oldData: any, newData: any): any {
    return {
      type: 'delta',
      changes: this.deepDiff(oldData, newData),
      timestamp: Date.now()
    };
  }

  private deepDiff(obj1: any, obj2: any, path = ''): any[] {
    const changes: any[] = [];

    if (typeof obj1 !== typeof obj2) {
      changes.push({
        path,
        type: 'replace',
        oldValue: obj1,
        newValue: obj2
      });
      return changes;
    }

    if (typeof obj1 === 'object' && obj1 !== null) {
      const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      
      for (const key of keys) {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj1)) {
          changes.push({
            path: newPath,
            type: 'add',
            newValue: obj2[key]
          });
        } else if (!(key in obj2)) {
          changes.push({
            path: newPath,
            type: 'remove',
            oldValue: obj1[key]
          });
        } else {
          changes.push(...this.deepDiff(obj1[key], obj2[key], newPath));
        }
      }
    } else if (obj1 !== obj2) {
      changes.push({
        path,
        type: 'replace',
        oldValue: obj1,
        newValue: obj2
      });
    }

    return changes;
  }

  private async performAutoSave(): Promise<void> {
    // 这里需要与实时状态管理器集成，获取当前游戏状态
    // 暂时留空，实际实现时需要注入当前游戏状态
  }

  private async enforceStorageQuota(): Promise<void> {
    const stats = await this.getStorageStats();
    const quotaBytes = this.config.storageQuotaLimitMB * 1024 * 1024;

    if (stats.totalSize > quotaBytes) {
      await this.performCleanup();
    }
  }

  private async enforceRestorePointLimit(): Promise<void> {
    const points = Array.from(this.restorePoints.values())
      .sort((a, b) => b.createdAt - a.createdAt);

    if (points.length > this.config.maxHistoryEntries) {
      const toRemove = points.slice(this.config.maxHistoryEntries);
      for (const point of toRemove) {
        this.restorePoints.delete(point.id);
      }
    }
  }

  private async performCleanup(): Promise<StorageCleanupResult> {
    const result: StorageCleanupResult = {
      entriesRemoved: 0,
      spaceFreed: 0,
      backupsRemoved: 0,
      errors: []
    };

    try {
      const cutoffTime = Date.now() - (this.config.cleanupThresholdDays * 24 * 60 * 60 * 1000);

      // 清理旧的存储条目
      for (const [id, entry] of this.storage) {
        if (entry.createdAt < cutoffTime && entry.accessCount === 0) {
          result.spaceFreed += entry.metadata.size;
          this.storage.delete(id);
          result.entriesRemoved++;
        }
      }

      // 清理旧的备份
      for (const [id, backup] of this.backups) {
        if (backup.createdAt < cutoffTime) {
          this.backups.delete(id);
          result.backupsRemoved++;
        }
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown cleanup error');
    }

    return result;
  }

  private async preprocessData(gameState: GameState): Promise<any> {
    let processedData = JSON.parse(JSON.stringify(gameState));

    if (this.config.encryptionEnabled) {
      processedData = await this.encryptData(processedData);
    }

    return processedData;
  }

  private async encryptData(data: any): Promise<any> {
    // 简化的加密实现，实际项目中应使用真正的加密库
    return {
      encrypted: true,
      data: Buffer.from(JSON.stringify(data)).toString('base64')
    };
  }

  private async decryptData(data: any): Promise<any> {
    if (data.encrypted) {
      const decrypted = Buffer.from(data.data, 'base64').toString();
      return JSON.parse(decrypted);
    }
    return data;
  }

  private async compressData(data: any): Promise<any> {
    // 简化的压缩实现，实际项目中应使用压缩库
    const str = JSON.stringify(data);
    return {
      compressed: true,
      data: str,
      originalSize: str.length
    };
  }

  private async decompressData(data: any): Promise<any> {
    if (data.compressed) {
      return JSON.parse(data.data);
    }
    return data;
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

  private async validateChecksum(data: any, expectedChecksum: string): Promise<boolean> {
    const actualChecksum = await this.calculateChecksum(data);
    return actualChecksum === expectedChecksum;
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  async getStorageStats(): Promise<PersistenceStats> {
    const entries = Array.from(this.storage.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.metadata.size, 0);
    const compressionRatios = entries
      .filter(entry => entry.metadata.compressionRatio)
      .map(entry => entry.metadata.compressionRatio!);

    return {
      totalEntries: entries.length,
      totalSize,
      averageSize: entries.length > 0 ? totalSize / entries.length : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.createdAt)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.createdAt)) : 0,
      compressionRatio: compressionRatios.length > 0 
        ? compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length 
        : 1,
      storageUtilization: (totalSize / (this.config.storageQuotaLimitMB * 1024 * 1024)) * 100,
      backupCount: this.backups.size,
      restorePointCount: this.restorePoints.size
    };
  }

  async cleanup(): Promise<void> {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.storage.clear();
    this.backups.clear();
    this.restorePoints.clear();
  }
}