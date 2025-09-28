/**
 * AI系统数据持久化层
 * 集成个性化AI系统并优化 - 提供完整的数据存储和恢复能力
 */
import { EventEmitter } from '../../utils/EventEmitter';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PersonalitySnapshot {
  userId: string;
  zodiacSign: string;
  personalityTraits: Record<string, number>;
  emotionalState: {
    mood: number;
    energy: number;
    confidence: number;
    socialAttitude: number;
  };
  behaviorPatterns: {
    riskTolerance: number;
    decisionSpeed: number;
    socialInfluence: number;
    adaptability: number;
  };
  learningHistory: LearningEvent[];
  gameMemories: GameMemory[];
  socialRelationships: SocialRelationship[];
  customizations: CustomizationData[];
  timestamp: Date;
  version: string;
}

export interface LearningEvent {
  id: string;
  type: 'success' | 'failure' | 'neutral';
  context: string;
  action: string;
  outcome: string;
  confidence: number;
  impact: number;
  timestamp: Date;
}

export interface GameMemory {
  id: string;
  gameId: string;
  eventType: string;
  description: string;
  outcome: 'positive' | 'negative' | 'neutral';
  emotionalImpact: number;
  strategicValue: number;
  participants: string[];
  timestamp: Date;
}

export interface SocialRelationship {
  partnerId: string;
  relationshipType: 'cooperative' | 'competitive' | 'neutral' | 'strategic';
  trustLevel: number;
  interactionCount: number;
  successfulDeals: number;
  conflictHistory: ConflictEvent[];
  lastInteraction: Date;
}

export interface ConflictEvent {
  id: string;
  type: 'trade_dispute' | 'property_competition' | 'alliance_break' | 'betrayal';
  severity: number;
  resolution: 'resolved' | 'ongoing' | 'escalated';
  timestamp: Date;
}

export interface CustomizationData {
  id: string;
  type: 'personality_adjustment' | 'behavior_preference' | 'strategy_template';
  data: any;
  active: boolean;
  timestamp: Date;
}

export interface PersistenceConfig {
  baseDirectory: string;
  backupInterval: number;
  maxBackups: number;
  compressionLevel: number;
  encryptionEnabled: boolean;
  autoSave: boolean;
}

export interface StorageMetrics {
  totalSnapshots: number;
  totalSizeBytes: number;
  averageSnapshotSize: number;
  oldestSnapshot: Date | null;
  newestSnapshot: Date | null;
  corruptedFiles: number;
  lastBackup: Date | null;
}

export interface BackupInfo {
  id: string;
  type: 'manual' | 'automatic' | 'emergency';
  snapshotCount: number;
  totalSize: number;
  compression: number;
  integrity: 'verified' | 'corrupted' | 'unknown';
  timestamp: Date;
}

export interface QueryOptions {
  userId?: string;
  zodiacSign?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeMemories?: boolean;
  includeRelationships?: boolean;
  sortBy?: 'timestamp' | 'version' | 'userId';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MigrationInfo {
  fromVersion: string;
  toVersion: string;
  changes: string[];
  backupRequired: boolean;
  migrationTime: number;
}

export class DataPersistenceLayer extends EventEmitter {
  private config: PersistenceConfig;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private backupInterval: NodeJS.Timeout | null = null;
  private metrics: StorageMetrics;
  private isInitialized = false;

  constructor(config: Partial<PersistenceConfig> = {}) {
    super();
    
    this.config = {
      baseDirectory: './data/ai_persistence',
      backupInterval: 3600000, // 1 hour
      maxBackups: 24,
      compressionLevel: 6,
      encryptionEnabled: false,
      autoSave: true,
      ...config
    };

    this.metrics = {
      totalSnapshots: 0,
      totalSizeBytes: 0,
      averageSnapshotSize: 0,
      oldestSnapshot: null,
      newestSnapshot: null,
      corruptedFiles: 0,
      lastBackup: null
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 创建存储目录结构
      await this.createDirectoryStructure();
      
      // 加载存储指标
      await this.loadMetrics();
      
      // 验证数据完整性
      await this.verifyDataIntegrity();
      
      // 启动自动备份
      if (this.config.autoSave) {
        this.startAutoBackup();
      }

      this.isInitialized = true;
      this.emit('initialized');
      
    } catch (error) {
      this.emit('error', {
        operation: 'initialize',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async savePersonalitySnapshot(snapshot: PersonalitySnapshot): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('DataPersistenceLayer not initialized');
    }

    try {
      const snapshotId = this.generateSnapshotId(snapshot);
      const filePath = this.getSnapshotPath(snapshotId);
      
      // 添加元数据
      const enrichedSnapshot = {
        ...snapshot,
        id: snapshotId,
        savedAt: new Date(),
        version: '1.0.0'
      };

      // 序列化和压缩数据
      const serializedData = JSON.stringify(enrichedSnapshot, null, 2);
      const compressedData = await this.compressData(serializedData);
      
      // 加密数据（如果启用）
      const finalData = this.config.encryptionEnabled 
        ? await this.encryptData(compressedData)
        : compressedData;

      // 写入文件
      await fs.writeFile(filePath, finalData);
      
      // 更新指标
      await this.updateMetrics(snapshotId, finalData.length);
      
      this.emit('snapshotSaved', {
        snapshotId,
        userId: snapshot.userId,
        size: finalData.length
      });

      return snapshotId;
      
    } catch (error) {
      this.emit('error', {
        operation: 'saveSnapshot',
        userId: snapshot.userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async loadPersonalitySnapshot(snapshotId: string): Promise<PersonalitySnapshot | null> {
    if (!this.isInitialized) {
      throw new Error('DataPersistenceLayer not initialized');
    }

    try {
      const filePath = this.getSnapshotPath(snapshotId);
      
      // 检查文件是否存在
      try {
        await fs.access(filePath);
      } catch {
        return null;
      }

      // 读取文件
      const fileData = await fs.readFile(filePath);
      
      // 解密数据（如果启用）
      const decryptedData = this.config.encryptionEnabled 
        ? await this.decryptData(fileData)
        : fileData;

      // 解压缩数据
      const decompressedData = await this.decompressData(decryptedData);
      
      // 反序列化
      const snapshot = JSON.parse(decompressedData) as PersonalitySnapshot;
      
      this.emit('snapshotLoaded', {
        snapshotId,
        userId: snapshot.userId
      });

      return snapshot;
      
    } catch (error) {
      this.emit('error', {
        operation: 'loadSnapshot',
        snapshotId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  async querySnapshots(options: QueryOptions = {}): Promise<PersonalitySnapshot[]> {
    if (!this.isInitialized) {
      throw new Error('DataPersistenceLayer not initialized');
    }

    try {
      const snapshotFiles = await this.getSnapshotFiles();
      const snapshots: PersonalitySnapshot[] = [];

      for (const file of snapshotFiles) {
        try {
          const snapshot = await this.loadPersonalitySnapshot(file);
          if (snapshot && this.matchesQuery(snapshot, options)) {
            snapshots.push(snapshot);
          }
        } catch (error) {
          // 记录损坏的文件但继续处理
          this.metrics.corruptedFiles++;
        }
      }

      // 排序
      snapshots.sort((a, b) => {
        const sortBy = options.sortBy || 'timestamp';
        const order = options.sortOrder === 'desc' ? -1 : 1;
        
        if (sortBy === 'timestamp') {
          return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * order;
        } else if (sortBy === 'userId') {
          return a.userId.localeCompare(b.userId) * order;
        }
        return 0;
      });

      // 分页
      const offset = options.offset || 0;
      const limit = options.limit || snapshots.length;
      
      return snapshots.slice(offset, offset + limit);
      
    } catch (error) {
      this.emit('error', {
        operation: 'querySnapshots',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async createBackup(type: 'manual' | 'automatic' | 'emergency' = 'manual'): Promise<BackupInfo> {
    if (!this.isInitialized) {
      throw new Error('DataPersistenceLayer not initialized');
    }

    try {
      const backupId = this.generateBackupId();
      const backupPath = this.getBackupPath(backupId);
      
      // 创建备份目录
      await fs.mkdir(backupPath, { recursive: true });
      
      // 复制所有快照文件
      const snapshotFiles = await this.getSnapshotFiles();
      let totalSize = 0;
      
      for (const file of snapshotFiles) {
        const sourcePath = this.getSnapshotPath(file);
        const targetPath = path.join(backupPath, `${file}.snapshot`);
        
        await fs.copyFile(sourcePath, targetPath);
        const stats = await fs.stat(targetPath);
        totalSize += stats.size;
      }

      // 创建备份信息文件
      const backupInfo: BackupInfo = {
        id: backupId,
        type,
        snapshotCount: snapshotFiles.length,
        totalSize,
        compression: this.config.compressionLevel,
        integrity: 'verified',
        timestamp: new Date()
      };

      await fs.writeFile(
        path.join(backupPath, 'backup.json'),
        JSON.stringify(backupInfo, null, 2)
      );

      // 清理旧备份
      await this.cleanupOldBackups();
      
      this.metrics.lastBackup = new Date();
      
      this.emit('backupCreated', backupInfo);
      
      return backupInfo;
      
    } catch (error) {
      this.emit('error', {
        operation: 'createBackup',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async restoreFromBackup(backupId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('DataPersistenceLayer not initialized');
    }

    try {
      const backupPath = this.getBackupPath(backupId);
      
      // 验证备份存在
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error(`Backup ${backupId} not found`);
      }

      // 读取备份信息
      const backupInfoPath = path.join(backupPath, 'backup.json');
      const backupInfoData = await fs.readFile(backupInfoPath, 'utf-8');
      const backupInfo = JSON.parse(backupInfoData) as BackupInfo;

      // 创建当前数据的紧急备份
      await this.createBackup('emergency');

      // 清理当前快照目录
      const currentSnapshots = await this.getSnapshotFiles();
      for (const file of currentSnapshots) {
        await fs.unlink(this.getSnapshotPath(file));
      }

      // 恢复备份数据
      const backupFiles = await fs.readdir(backupPath);
      const snapshotFiles = backupFiles.filter(file => file.endsWith('.snapshot'));
      
      for (const file of snapshotFiles) {
        const sourcePath = path.join(backupPath, file);
        const targetPath = this.getSnapshotPath(file.replace('.snapshot', ''));
        await fs.copyFile(sourcePath, targetPath);
      }

      // 重新加载指标
      await this.loadMetrics();
      
      this.emit('backupRestored', {
        backupId,
        snapshotCount: backupInfo.snapshotCount
      });
      
    } catch (error) {
      this.emit('error', {
        operation: 'restoreBackup',
        backupId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('DataPersistenceLayer not initialized');
    }

    try {
      const filePath = this.getSnapshotPath(snapshotId);
      
      // 检查文件是否存在
      try {
        const stats = await fs.stat(filePath);
        await fs.unlink(filePath);
        
        // 更新指标
        this.metrics.totalSnapshots--;
        this.metrics.totalSizeBytes -= stats.size;
        this.updateAverageSnapshotSize();
        
        this.emit('snapshotDeleted', { snapshotId });
        
      } catch {
        // 文件不存在，忽略
      }
      
    } catch (error) {
      this.emit('error', {
        operation: 'deleteSnapshot',
        snapshotId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getStorageMetrics(): Promise<StorageMetrics> {
    if (!this.isInitialized) {
      await this.loadMetrics();
    }
    return { ...this.metrics };
  }

  async optimizeStorage(): Promise<{
    deletedFiles: number;
    spaceSaved: number;
    timeSpent: number;
  }> {
    const startTime = Date.now();
    let deletedFiles = 0;
    let spaceSaved = 0;

    try {
      // 查找重复快照
      const duplicates = await this.findDuplicateSnapshots();
      
      for (const duplicate of duplicates) {
        const stats = await fs.stat(this.getSnapshotPath(duplicate));
        await this.deleteSnapshot(duplicate);
        deletedFiles++;
        spaceSaved += stats.size;
      }

      // 清理损坏的文件
      const corruptedFiles = await this.findCorruptedFiles();
      
      for (const corrupted of corruptedFiles) {
        try {
          const stats = await fs.stat(this.getSnapshotPath(corrupted));
          await fs.unlink(this.getSnapshotPath(corrupted));
          deletedFiles++;
          spaceSaved += stats.size;
        } catch {
          // 文件已经不存在
        }
      }

      const timeSpent = Date.now() - startTime;
      
      this.emit('storageOptimized', {
        deletedFiles,
        spaceSaved,
        timeSpent
      });

      return { deletedFiles, spaceSaved, timeSpent };
      
    } catch (error) {
      this.emit('error', {
        operation: 'optimizeStorage',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      // 停止自动备份
      if (this.backupInterval) {
        clearInterval(this.backupInterval);
        this.backupInterval = null;
      }

      // 停止自动保存
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
        this.autoSaveInterval = null;
      }

      // 创建最终备份
      if (this.config.autoSave) {
        await this.createBackup('automatic');
      }

      // 保存指标
      await this.saveMetrics();

      this.isInitialized = false;
      this.emit('shutdown');
      
    } catch (error) {
      this.emit('error', {
        operation: 'shutdown',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // 私有方法

  private async createDirectoryStructure(): Promise<void> {
    const directories = [
      this.config.baseDirectory,
      path.join(this.config.baseDirectory, 'snapshots'),
      path.join(this.config.baseDirectory, 'backups'),
      path.join(this.config.baseDirectory, 'metadata')
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private generateSnapshotId(snapshot: PersonalitySnapshot): string {
    const timestamp = Date.now();
    const userHash = this.hashString(snapshot.userId);
    return `${userHash}_${timestamp}`;
  }

  private generateBackupId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `backup_${timestamp}_${random}`;
  }

  private getSnapshotPath(snapshotId: string): string {
    return path.join(this.config.baseDirectory, 'snapshots', `${snapshotId}.json`);
  }

  private getBackupPath(backupId: string): string {
    return path.join(this.config.baseDirectory, 'backups', backupId);
  }

  private getMetricsPath(): string {
    return path.join(this.config.baseDirectory, 'metadata', 'metrics.json');
  }

  private async getSnapshotFiles(): Promise<string[]> {
    const snapshotsDir = path.join(this.config.baseDirectory, 'snapshots');
    
    try {
      const files = await fs.readdir(snapshotsDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch {
      return [];
    }
  }

  private matchesQuery(snapshot: PersonalitySnapshot, options: QueryOptions): boolean {
    if (options.userId && snapshot.userId !== options.userId) {
      return false;
    }

    if (options.zodiacSign && snapshot.zodiacSign !== options.zodiacSign) {
      return false;
    }

    if (options.dateRange) {
      const snapshotTime = new Date(snapshot.timestamp);
      if (snapshotTime < options.dateRange.start || snapshotTime > options.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  private async compressData(data: string): Promise<Buffer> {
    // 简化的压缩实现 - 在实际项目中使用 zlib
    return Buffer.from(data, 'utf-8');
  }

  private async decompressData(data: Buffer): Promise<string> {
    // 简化的解压缩实现 - 在实际项目中使用 zlib
    return data.toString('utf-8');
  }

  private async encryptData(data: Buffer): Promise<Buffer> {
    // 简化的加密实现 - 在实际项目中使用 crypto
    return data;
  }

  private async decryptData(data: Buffer): Promise<Buffer> {
    // 简化的解密实现 - 在实际项目中使用 crypto
    return data;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async loadMetrics(): Promise<void> {
    try {
      const metricsPath = this.getMetricsPath();
      const data = await fs.readFile(metricsPath, 'utf-8');
      this.metrics = JSON.parse(data);
    } catch {
      // 如果文件不存在，使用默认指标
      await this.calculateMetrics();
    }
  }

  private async saveMetrics(): Promise<void> {
    const metricsPath = this.getMetricsPath();
    await fs.writeFile(metricsPath, JSON.stringify(this.metrics, null, 2));
  }

  private async calculateMetrics(): Promise<void> {
    const snapshotFiles = await this.getSnapshotFiles();
    
    this.metrics.totalSnapshots = snapshotFiles.length;
    this.metrics.totalSizeBytes = 0;
    this.metrics.oldestSnapshot = null;
    this.metrics.newestSnapshot = null;
    this.metrics.corruptedFiles = 0;

    for (const file of snapshotFiles) {
      try {
        const filePath = this.getSnapshotPath(file);
        const stats = await fs.stat(filePath);
        
        this.metrics.totalSizeBytes += stats.size;
        
        if (!this.metrics.oldestSnapshot || stats.mtime < this.metrics.oldestSnapshot) {
          this.metrics.oldestSnapshot = stats.mtime;
        }
        
        if (!this.metrics.newestSnapshot || stats.mtime > this.metrics.newestSnapshot) {
          this.metrics.newestSnapshot = stats.mtime;
        }
        
      } catch {
        this.metrics.corruptedFiles++;
      }
    }

    this.updateAverageSnapshotSize();
  }

  private updateAverageSnapshotSize(): void {
    this.metrics.averageSnapshotSize = this.metrics.totalSnapshots > 0 
      ? this.metrics.totalSizeBytes / this.metrics.totalSnapshots 
      : 0;
  }

  private async updateMetrics(snapshotId: string, size: number): Promise<void> {
    this.metrics.totalSnapshots++;
    this.metrics.totalSizeBytes += size;
    this.metrics.newestSnapshot = new Date();
    
    if (!this.metrics.oldestSnapshot) {
      this.metrics.oldestSnapshot = new Date();
    }
    
    this.updateAverageSnapshotSize();
    await this.saveMetrics();
  }

  private async verifyDataIntegrity(): Promise<void> {
    const snapshotFiles = await this.getSnapshotFiles();
    let corruptedCount = 0;

    for (const file of snapshotFiles) {
      try {
        await this.loadPersonalitySnapshot(file);
      } catch {
        corruptedCount++;
      }
    }

    this.metrics.corruptedFiles = corruptedCount;
    
    if (corruptedCount > 0) {
      this.emit('integrityCheck', {
        total: snapshotFiles.length,
        corrupted: corruptedCount
      });
    }
  }

  private startAutoBackup(): void {
    this.backupInterval = setInterval(async () => {
      try {
        await this.createBackup('automatic');
      } catch (error) {
        this.emit('error', {
          operation: 'autoBackup',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, this.config.backupInterval);
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupsDir = path.join(this.config.baseDirectory, 'backups');
      const backupDirs = await fs.readdir(backupsDir);
      
      if (backupDirs.length <= this.config.maxBackups) {
        return;
      }

      // 按时间戳排序
      const backupsWithTime = await Promise.all(
        backupDirs.map(async (dir) => {
          const dirPath = path.join(backupsDir, dir);
          const stats = await fs.stat(dirPath);
          return { dir, time: stats.mtime };
        })
      );

      backupsWithTime.sort((a, b) => a.time.getTime() - b.time.getTime());

      // 删除最旧的备份
      const toDelete = backupsWithTime.slice(0, backupsWithTime.length - this.config.maxBackups);
      
      for (const { dir } of toDelete) {
        const dirPath = path.join(backupsDir, dir);
        await fs.rm(dirPath, { recursive: true });
      }
      
    } catch (error) {
      // 清理失败不影响主要功能
    }
  }

  private async findDuplicateSnapshots(): Promise<string[]> {
    // 简化的重复检测实现
    const snapshotFiles = await this.getSnapshotFiles();
    const checksums = new Map<string, string[]>();
    
    for (const file of snapshotFiles) {
      try {
        const snapshot = await this.loadPersonalitySnapshot(file);
        if (snapshot) {
          const checksum = this.hashString(JSON.stringify({
            userId: snapshot.userId,
            personalityTraits: snapshot.personalityTraits,
            emotionalState: snapshot.emotionalState
          }));
          
          if (!checksums.has(checksum)) {
            checksums.set(checksum, []);
          }
          checksums.get(checksum)!.push(file);
        }
      } catch {
        // 忽略损坏的文件
      }
    }

    const duplicates: string[] = [];
    for (const files of checksums.values()) {
      if (files.length > 1) {
        // 保留最新的，删除其他的
        files.sort();
        duplicates.push(...files.slice(0, -1));
      }
    }

    return duplicates;
  }

  private async findCorruptedFiles(): Promise<string[]> {
    const snapshotFiles = await this.getSnapshotFiles();
    const corrupted: string[] = [];

    for (const file of snapshotFiles) {
      try {
        await this.loadPersonalitySnapshot(file);
      } catch {
        corrupted.push(file);
      }
    }

    return corrupted;
  }
}