import type {
  SaveData,
  SaveInfo,
  GameConfig,
  StorageResult,
  BackupInfo,
  StorageConfig,
  StorageAnalytics,
  QuotaManagement,
  DataIntegrity,
  CompressionConfig,
  EncryptionConfig
} from '../types/storage';
import type { GameState } from '../types/game';
import type { AIState } from '../types/ai';
import { EventEmitter, generateId, deepClone } from '../utils/index';
import { DatabaseManager } from './DatabaseManager';
import { CompressionService } from './CompressionService';
import { ValidationService } from './ValidationService';

/**
 * 存档管理器 - 负责游戏存档的创建、读取、更新、删除等操作
 */
export class SaveManager {
  private dbManager: DatabaseManager;
  private compressionService: CompressionService;
  private validationService: ValidationService;
  private eventEmitter: EventEmitter;
  private config: StorageConfig;
  private analytics: StorageAnalytics;
  private quotaManager: QuotaManagement;
  private inMemorySaves = new Map<string, SaveData>();
  private inMemoryInfos = new Map<string, SaveInfo>();
  
  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      databaseName: 'zodiac_monopoly_db',
      version: 1,
      cacheConfig: {
        maxSize: 50 * 1024 * 1024, // 50MB
        ttl: 3600000, // 1 hour
        cleanupInterval: 300000 // 5 minutes
      },
      compressionEnabled: true,
      encryptionEnabled: false,
      autoBackupEnabled: true,
      maxBackups: 10,
      ...config
    };

    this.dbManager = new DatabaseManager(this.config);
    this.compressionService = new CompressionService({
      enabled: this.config.compressionEnabled,
      algorithm: 'gzip',
      level: 6,
      threshold: 1024, // 1KB
      excludeTypes: [],
      chunkSize: 64 * 1024, // 64KB
      parallelCompression: false
    });
    this.validationService = new ValidationService();
    this.eventEmitter = new EventEmitter();
    
    this.analytics = {
      totalReads: 0,
      totalWrites: 0,
      totalDeletes: 0,
      averageReadTime: 0,
      averageWriteTime: 0,
      cacheHitRate: 0,
      totalSize: 0,
      saveDataSize: 0,
      settingsSize: 0,
      cacheSize: 0,
      readErrors: 0,
      writeErrors: 0,
      corruptionErrors: 0,
      period: 'session',
      lastReset: Date.now()
    };

    this.quotaManager = {
      maxTotalSize: 200 * 1024 * 1024, // 200MB
      maxSaveSize: 50 * 1024 * 1024, // 50MB per save
      maxSaveCount: 50,
      warningThreshold: 80, // 80%
      criticalThreshold: 95, // 95%
      overflowAction: 'delete_oldest',
      prioritySaves: []
    };
  }

  /**
   * 初始化存储管理器
   */
  async initialize(): Promise<void> {
    try {
      await this.dbManager.initialize();
      this.eventEmitter.emit('storage:initialized');
      console.log('SaveManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SaveManager:', error);
      throw error;
    }
  }

  /**
   * 创建新的存档
   */
  async createSave(
    name: string,
    gameState: GameState,
    aiStates: AIState[] = [],
    config?: GameConfig
  ): Promise<StorageResult<SaveData>> {
    const startTime = Date.now();
    
    try {
      // 验证配额
      const quotaCheck = await this.checkQuota();
      if (!quotaCheck.canSave) {
        throw new Error(`Storage quota exceeded: ${quotaCheck.reason}`);
      }

      // 创建存档数据
      const saveData: SaveData = {
        version: '1.0.0',
        saveId: generateId(),
        name,
        gameState: deepClone(gameState),
        aiStates: deepClone(aiStates),
        timestamp: Date.now(),
        playTime: gameState.elapsedTime || 0,
        round: gameState.round,
        difficulty: config?.difficulty || 'normal',
        checksum: ''
      };

      // 生成校验和
      saveData.checksum = await this.generateChecksum(saveData);

      // 压缩数据
      let finalData: any = saveData;
      let compressed = false;
      let originalSize = 0;

      if (this.config.compressionEnabled) {
        const serialized = JSON.stringify(saveData);
        originalSize = new Blob([serialized]).size;
        
        if (originalSize > this.compressionService.getThreshold()) {
          const compressedData = await this.compressionService.compress(serialized);
          if (compressedData.size < originalSize) {
            finalData = compressedData;
            compressed = true;
            saveData.compressed = true;
            saveData.originalSize = originalSize;
          }
        }
      }

      // 保存到数据库
      await this.dbManager.saveSaveData(saveData.saveId, finalData);

      // 创建存档信息
      const saveInfo: SaveInfo = {
        saveId: saveData.saveId,
        name: saveData.name,
        timestamp: saveData.timestamp,
        round: saveData.round,
        playTime: saveData.playTime,
        difficulty: saveData.difficulty,
        playerCount: gameState.players.length,
        size: compressed ? finalData.size : new Blob([JSON.stringify(saveData)]).size
      };

      await this.dbManager.saveSaveInfo(saveData.saveId, saveInfo);

      // 维护内存副本，便于在无IndexedDB环境下运行（如单元测试）
      this.inMemorySaves.set(saveData.saveId, deepClone(saveData));
      this.inMemoryInfos.set(saveData.saveId, { ...saveInfo });

      // 更新分析数据
      this.updateAnalytics('write', Date.now() - startTime);

      // 发布事件
      this.eventEmitter.emit('save_created', { saveId: saveData.saveId, name });

      // 自动备份
      if (this.config.autoBackupEnabled) {
        await this.createBackup(`Auto backup - ${name}`);
      }

      return {
        success: true,
        data: saveData,
        metadata: {
          operation: 'save',
          duration: Date.now() - startTime,
          compressed,
          encrypted: false
        }
      };

    } catch (error) {
      this.analytics.writeErrors++;
      console.error('Failed to create save:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          operation: 'save',
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * 加载存档
   */
  async loadSave(saveId: string): Promise<StorageResult<SaveData>> {
    const startTime = Date.now();
    
    try {
      const cachedSave = this.inMemorySaves.get(saveId);
      if (cachedSave) {
        const validation = await this.validateSaveData(cachedSave);
        if (!validation.isValid) {
          this.analytics.corruptionErrors++;
          throw new Error(`Save data corrupted: ${validation.errors.join(', ')}`);
        }

        const duration = Date.now() - startTime;
        this.updateAnalytics('read', duration, true);
        this.eventEmitter.emit('save_loaded', { saveId });

        return {
          success: true,
          data: deepClone(cachedSave),
          metadata: {
            operation: 'load',
            duration,
            cacheHit: true,
            compressed: cachedSave.compressed || false
          }
        };
      }

      // 从数据库加载
      const rawData = await this.dbManager.loadSaveData(saveId);
      if (!rawData) {
        throw new Error(`Save not found: ${saveId}`);
      }

      let saveData: SaveData;

      // 检查是否为压缩数据
      if (rawData instanceof Blob) {
        // 解压缩
        const decompressed = await this.compressionService.decompress(rawData);
        saveData = JSON.parse(decompressed);
      } else {
        saveData = rawData as SaveData;
      }

      // 验证数据完整性
      const isValid = await this.validateSaveData(saveData);
      if (!isValid.isValid) {
        this.analytics.corruptionErrors++;
        throw new Error(`Save data corrupted: ${isValid.errors.join(', ')}`);
      }

      // 缓存结果，便于后续快速读取
      this.inMemorySaves.set(saveId, deepClone(saveData));

      // 更新分析数据
      this.updateAnalytics('read', Date.now() - startTime, false);

      // 发布事件
      this.eventEmitter.emit('save_loaded', { saveId });

      return {
        success: true,
        data: saveData,
        metadata: {
          operation: 'load',
          duration: Date.now() - startTime,
          cacheHit: false,
          compressed: saveData.compressed || false
        }
      };

    } catch (error) {
      this.analytics.readErrors++;
      console.error('Failed to load save:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          operation: 'load',
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * 更新存档
   */
  async updateSave(
    saveId: string,
    gameState: GameState,
    aiStates: AIState[] = []
  ): Promise<StorageResult<SaveData>> {
    const startTime = Date.now();
    
    try {
      // 加载现有存档信息，优先使用内存缓存
      let existingSaveInfo = this.inMemoryInfos.get(saveId);
      if (!existingSaveInfo) {
        existingSaveInfo = await this.dbManager.loadSaveInfo(saveId);
      }
      if (!existingSaveInfo) {
        throw new Error(`Save not found: ${saveId}`);
      }

      // 创建更新的存档数据
      const updatedSaveData: SaveData = {
        version: '1.0.0',
        saveId,
        name: existingSaveInfo.name,
        gameState: deepClone(gameState),
        aiStates: deepClone(aiStates),
        timestamp: Date.now(),
        playTime: gameState.elapsedTime || 0,
        round: gameState.round,
        difficulty: existingSaveInfo.difficulty,
        checksum: ''
      };

      // 生成新的校验和
      updatedSaveData.checksum = await this.generateChecksum(updatedSaveData);

      // 压缩和保存
      let finalData: any = updatedSaveData;
      let compressed = false;

      if (this.config.compressionEnabled) {
        const serialized = JSON.stringify(updatedSaveData);
        const originalSize = new Blob([serialized]).size;
        
        if (originalSize > this.compressionService.getThreshold()) {
          const compressedData = await this.compressionService.compress(serialized);
          if (compressedData.size < originalSize) {
            finalData = compressedData;
            compressed = true;
            updatedSaveData.compressed = true;
            updatedSaveData.originalSize = originalSize;
          }
        }
      }

      await this.dbManager.saveSaveData(saveId, finalData);

      // 更新存档信息
      const updatedSaveInfo: SaveInfo = {
        ...existingSaveInfo,
        timestamp: updatedSaveData.timestamp,
        round: updatedSaveData.round,
        playTime: updatedSaveData.playTime,
        playerCount: gameState.players.length,
        size: compressed ? finalData.size : new Blob([JSON.stringify(updatedSaveData)]).size
      };

      await this.dbManager.saveSaveInfo(saveId, updatedSaveInfo);

      // 更新内存缓存
      this.inMemorySaves.set(saveId, deepClone(updatedSaveData));
      this.inMemoryInfos.set(saveId, { ...updatedSaveInfo });

      // 更新分析数据
      this.updateAnalytics('write', Date.now() - startTime);

      // 发布事件
      this.eventEmitter.emit('save_updated', { saveId });

      return {
        success: true,
        data: updatedSaveData,
        metadata: {
          operation: 'save',
          duration: Date.now() - startTime,
          compressed
        }
      };

    } catch (error) {
      this.analytics.writeErrors++;
      console.error('Failed to update save:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          operation: 'save',
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * 删除存档
   */
  async deleteSave(saveId: string): Promise<StorageResult<boolean>> {
    const startTime = Date.now();
    
    try {
      let saveInfo = this.inMemoryInfos.get(saveId);
      if (!saveInfo) {
        saveInfo = await this.dbManager.loadSaveInfo(saveId);
      }
      if (!saveInfo) {
        throw new Error(`Save not found: ${saveId}`);
      }

      await this.dbManager.deleteSaveData(saveId);
      await this.dbManager.deleteSaveInfo(saveId);

      // 更新分析数据
      this.analytics.totalDeletes++;

      // 清理内存缓存
      this.inMemorySaves.delete(saveId);
      this.inMemoryInfos.delete(saveId);

      // 发布事件
      this.eventEmitter.emit('save_deleted', { saveId, name: saveInfo.name });

      return {
        success: true,
        data: true,
        metadata: {
          operation: 'delete',
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Failed to delete save:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          operation: 'delete',
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * 获取所有存档列表
   */
  async listSaves(): Promise<StorageResult<SaveInfo[]>> {
    const startTime = Date.now();
    
    try {
      let saves: SaveInfo[] = [];
      try {
        saves = await this.dbManager.listSaves();
      } catch (error) {
        console.warn('Failed to list saves from database, falling back to memory cache:', error);
      }

      if (!Array.isArray(saves) || saves.length === 0) {
        saves = Array.from(this.inMemoryInfos.values()).map((info) => ({ ...info }));
      } else {
        for (const info of saves) {
          this.inMemoryInfos.set(info.saveId, { ...info });
        }
      }

      // 按时间排序（最新的在前）
      saves.sort((a, b) => b.timestamp - a.timestamp);

      return {
        success: true,
        data: saves.map((info) => ({ ...info })),
        metadata: {
          operation: 'list',
          duration: Date.now() - startTime
        }
      };

    } catch (error) {
      console.error('Failed to list saves:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          operation: 'list',
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * 创建备份
   */
  async createBackup(description?: string): Promise<StorageResult<BackupInfo>> {
    const startTime = Date.now();
    
    try {
      const saves = await this.listSaves();
      if (!saves.success || !saves.data) {
        throw new Error('Failed to get saves for backup');
      }

      const backupId = generateId();
      const backupInfo: BackupInfo = {
        id: backupId,
        timestamp: Date.now(),
        size: 0,
        saveCount: saves.data.length,
        checksum: '',
        description
      };

      // 打包所有存档数据
      const backupData = {
        backupInfo,
        saves: []
      };

      for (const saveInfo of saves.data) {
        const saveResult = await this.loadSave(saveInfo.saveId);
        if (saveResult.success && saveResult.data) {
          backupData.saves.push(saveResult.data);
        }
      }

      // 压缩备份数据
      const serialized = JSON.stringify(backupData);
      const compressed = await this.compressionService.compress(serialized);
      
      backupInfo.size = compressed.size;
      backupInfo.checksum = await this.generateChecksum(backupData);

      // 保存备份
      await this.dbManager.saveBackup(backupId, compressed);
      await this.dbManager.saveBackupInfo(backupId, backupInfo);

      // 清理旧备份
      await this.cleanupOldBackups();

      // 发布事件
      this.eventEmitter.emit('backup_created', { backupId, description });

      return {
        success: true,
        data: backupInfo,
        metadata: {
          operation: 'backup',
          duration: Date.now() - startTime,
          compressed: true
        }
      };

    } catch (error) {
      console.error('Failed to create backup:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          operation: 'backup',
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * 获取存储分析数据
   */
  getAnalytics(): StorageAnalytics {
    return { ...this.analytics };
  }

  /**
   * 获取事件发射器
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * 清理存储空间
   */
  async cleanup(): Promise<void> {
    try {
      await this.dbManager.cleanup();
      await this.cleanupOldBackups();
      this.inMemorySaves.clear();
      this.inMemoryInfos.clear();
      this.eventEmitter.emit('storage:cleaned');
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }

  // 私有方法

  /**
   * 检查存储配额
   */
  private async checkQuota(): Promise<{ canSave: boolean; reason?: string }> {
    try {
      const usage = await this.dbManager.getStorageUsage();
      const usagePercent = (usage.totalSize / this.quotaManager.maxTotalSize) * 100;

      if (usagePercent >= this.quotaManager.criticalThreshold) {
        return { canSave: false, reason: 'Storage usage critical' };
      }

      if (usage.totalSaves >= this.quotaManager.maxSaveCount) {
        return { canSave: false, reason: 'Too many saves' };
      }

      return { canSave: true };

    } catch (error) {
      console.error('Failed to check quota:', error);
      return { canSave: true }; // 默认允许保存
    }
  }

  /**
   * 生成校验和
   */
  private async generateChecksum(data: any): Promise<string> {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(serialized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 验证存档数据
   */
  private async validateSaveData(saveData: SaveData): Promise<{ isValid: boolean; errors: string[] }> {
    return this.validationService.validateSaveData(saveData);
  }

  /**
   * 更新分析数据
   */
  private updateAnalytics(operation: 'read' | 'write', duration: number, cacheHit = false): void {
    if (operation === 'read') {
      this.analytics.totalReads++;
      this.analytics.averageReadTime = 
        (this.analytics.averageReadTime * (this.analytics.totalReads - 1) + duration) / this.analytics.totalReads;
      if (cacheHit) {
        this.analytics.cacheHitRate = 
          (this.analytics.cacheHitRate * (this.analytics.totalReads - 1) + 1) / this.analytics.totalReads;
      }
    } else if (operation === 'write') {
      this.analytics.totalWrites++;
      this.analytics.averageWriteTime = 
        (this.analytics.averageWriteTime * (this.analytics.totalWrites - 1) + duration) / this.analytics.totalWrites;
    }
  }

  /**
   * 清理旧备份
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.dbManager.listBackups();
      if (backups.length <= this.config.maxBackups) return;

      // 按时间排序，删除最旧的备份
      backups.sort((a, b) => a.timestamp - b.timestamp);
      const toDelete = backups.slice(0, backups.length - this.config.maxBackups);

      for (const backup of toDelete) {
        await this.dbManager.deleteBackup(backup.id);
        await this.dbManager.deleteBackupInfo(backup.id);
      }

    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }
}
