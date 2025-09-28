import type {
  SaveData,
  SaveInfo,
  BackupInfo,
  StorageConfig,
  StorageInfo
} from '../types/storage';

/**
 * 数据库管理器 - 负责IndexedDB的底层操作
 */
export class DatabaseManager {
  private db: IDBDatabase | null = null;
  private config: StorageConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: StorageConfig) {
    this.config = config;
    this.startCacheCleanup();
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.databaseName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log(`Database ${this.config.databaseName} opened successfully`);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建存档数据对象存储
        if (!db.objectStoreNames.contains('saveData')) {
          const saveDataStore = db.createObjectStore('saveData', { keyPath: 'saveId' });
          saveDataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 创建存档信息对象存储
        if (!db.objectStoreNames.contains('saveInfo')) {
          const saveInfoStore = db.createObjectStore('saveInfo', { keyPath: 'saveId' });
          saveInfoStore.createIndex('timestamp', 'timestamp', { unique: false });
          saveInfoStore.createIndex('name', 'name', { unique: false });
        }

        // 创建备份数据对象存储
        if (!db.objectStoreNames.contains('backupData')) {
          db.createObjectStore('backupData', { keyPath: 'backupId' });
        }

        // 创建备份信息对象存储
        if (!db.objectStoreNames.contains('backupInfo')) {
          const backupInfoStore = db.createObjectStore('backupInfo', { keyPath: 'id' });
          backupInfoStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 创建设置对象存储
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // 创建统计对象存储
        if (!db.objectStoreNames.contains('statistics')) {
          db.createObjectStore('statistics', { keyPath: 'key' });
        }

        console.log('Database schema created/updated successfully');
      };
    });
  }

  /**
   * 保存存档数据
   */
  async saveSaveData(saveId: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['saveData'], 'readwrite');
      const store = transaction.objectStore('saveData');
      
      const saveRecord = {
        saveId,
        data,
        timestamp: Date.now()
      };

      const request = store.put(saveRecord);

      request.onerror = () => {
        reject(new Error(`Failed to save data: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        // 更新缓存
        this.updateCache(`saveData:${saveId}`, saveRecord);
        resolve();
      };
    });
  }

  /**
   * 加载存档数据
   */
  async loadSaveData(saveId: string): Promise<any> {
    // 检查缓存
    const cached = this.getFromCache(`saveData:${saveId}`);
    if (cached) {
      return cached.data;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['saveData'], 'readonly');
      const store = transaction.objectStore('saveData');
      const request = store.get(saveId);

      request.onerror = () => {
        reject(new Error(`Failed to load save data: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // 更新缓存
          this.updateCache(`saveData:${saveId}`, result);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
    });
  }

  /**
   * 删除存档数据
   */
  async deleteSaveData(saveId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['saveData'], 'readwrite');
      const store = transaction.objectStore('saveData');
      const request = store.delete(saveId);

      request.onerror = () => {
        reject(new Error(`Failed to delete save data: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        // 清理缓存
        this.removeFromCache(`saveData:${saveId}`);
        resolve();
      };
    });
  }

  /**
   * 保存存档信息
   */
  async saveSaveInfo(saveId: string, saveInfo: SaveInfo): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['saveInfo'], 'readwrite');
      const store = transaction.objectStore('saveInfo');
      const request = store.put(saveInfo);

      request.onerror = () => {
        reject(new Error(`Failed to save info: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        // 更新缓存
        this.updateCache(`saveInfo:${saveId}`, saveInfo);
        resolve();
      };
    });
  }

  /**
   * 加载存档信息
   */
  async loadSaveInfo(saveId: string): Promise<SaveInfo | null> {
    // 检查缓存
    const cached = this.getFromCache(`saveInfo:${saveId}`);
    if (cached) {
      return cached;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['saveInfo'], 'readonly');
      const store = transaction.objectStore('saveInfo');
      const request = store.get(saveId);

      request.onerror = () => {
        reject(new Error(`Failed to load save info: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // 更新缓存
          this.updateCache(`saveInfo:${saveId}`, result);
        }
        resolve(result || null);
      };
    });
  }

  /**
   * 删除存档信息
   */
  async deleteSaveInfo(saveId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['saveInfo'], 'readwrite');
      const store = transaction.objectStore('saveInfo');
      const request = store.delete(saveId);

      request.onerror = () => {
        reject(new Error(`Failed to delete save info: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        // 清理缓存
        this.removeFromCache(`saveInfo:${saveId}`);
        resolve();
      };
    });
  }

  /**
   * 获取所有存档信息
   */
  async listSaves(): Promise<SaveInfo[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['saveInfo'], 'readonly');
      const store = transaction.objectStore('saveInfo');
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error(`Failed to list saves: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  /**
   * 保存备份数据
   */
  async saveBackup(backupId: string, data: Blob): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backupData'], 'readwrite');
      const store = transaction.objectStore('backupData');
      
      const backupRecord = {
        backupId,
        data,
        timestamp: Date.now()
      };

      const request = store.put(backupRecord);

      request.onerror = () => {
        reject(new Error(`Failed to save backup: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * 保存备份信息
   */
  async saveBackupInfo(backupId: string, backupInfo: BackupInfo): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backupInfo'], 'readwrite');
      const store = transaction.objectStore('backupInfo');
      const request = store.put(backupInfo);

      request.onerror = () => {
        reject(new Error(`Failed to save backup info: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * 获取所有备份信息
   */
  async listBackups(): Promise<BackupInfo[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backupInfo'], 'readonly');
      const store = transaction.objectStore('backupInfo');
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error(`Failed to list backups: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  /**
   * 删除备份数据
   */
  async deleteBackup(backupId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backupData'], 'readwrite');
      const store = transaction.objectStore('backupData');
      const request = store.delete(backupId);

      request.onerror = () => {
        reject(new Error(`Failed to delete backup: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * 删除备份信息
   */
  async deleteBackupInfo(backupId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['backupInfo'], 'readwrite');
      const store = transaction.objectStore('backupInfo');
      const request = store.delete(backupId);

      request.onerror = () => {
        reject(new Error(`Failed to delete backup info: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<StorageInfo> {
    if (!this.db) throw new Error('Database not initialized');

    const saveInfos = await this.listSaves();
    const backupInfos = await this.listBackups();

    const totalSize = saveInfos.reduce((sum, save) => sum + save.size, 0) +
                     backupInfos.reduce((sum, backup) => sum + backup.size, 0);

    return {
      totalSaves: saveInfos.length,
      totalSize,
      lastBackup: backupInfos.length > 0 ? Math.max(...backupInfos.map(b => b.timestamp)) : undefined,
      saves: saveInfos
    };
  }

  /**
   * 保存设置
   */
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onerror = () => {
        reject(new Error(`Failed to save setting: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        // 更新缓存
        this.updateCache(`settings:${key}`, value);
        resolve();
      };
    });
  }

  /**
   * 加载设置
   */
  async loadSetting(key: string): Promise<any> {
    // 检查缓存
    const cached = this.getFromCache(`settings:${key}`);
    if (cached !== undefined) {
      return cached;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onerror = () => {
        reject(new Error(`Failed to load setting: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const result = request.result;
        const value = result ? result.value : null;
        
        // 更新缓存
        this.updateCache(`settings:${key}`, value);
        resolve(value);
      };
    });
  }

  /**
   * 清理数据库
   */
  async cleanup(): Promise<void> {
    if (!this.db) return;

    try {
      // 清理缓存
      this.cache.clear();
      
      // TODO: 添加更多清理逻辑，如删除过期数据等
      console.log('Database cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup database:', error);
    }
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.cache.clear();
    }
  }

  // 私有方法

  /**
   * 更新缓存
   */
  private updateCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 检查缓存大小限制
    if (this.cache.size > 100) { // 简单的缓存大小限制
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查缓存是否过期
    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheConfig.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 从缓存移除数据
   */
  private removeFromCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 启动缓存清理定时器
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const ttl = this.config.cacheConfig.ttl;

      for (const [key, cached] of Array.from(this.cache.entries())) {
        if (now - cached.timestamp > ttl) {
          this.cache.delete(key);
        }
      }
    }, this.config.cacheConfig.cleanupInterval);
  }
}