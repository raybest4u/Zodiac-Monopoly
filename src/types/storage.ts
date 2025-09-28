import type { GameState, ZodiacSign } from './game';
import type { AIState, DifficultyLevel, AIOpponentConfig } from './ai';

// 存档数据
export interface SaveData {
  version: string;
  saveId: string;
  name: string;
  
  // 游戏数据
  gameState: GameState;
  aiStates: AIState[];
  
  // 元数据
  timestamp: number;
  playTime: number;
  round: number;
  difficulty: string;
  
  // 压缩标记
  compressed?: boolean;
  originalSize?: number;
  
  // 校验
  checksum: string;
}

// 存档信息
export interface SaveInfo {
  saveId: string;
  name: string;
  timestamp: number;
  round: number;
  playTime: number;
  difficulty: string;
  playerCount: number;
  size: number;
}

// 游戏配置
export interface GameConfig {
  // 基础设置
  playerName: string;
  playerZodiac: ZodiacSign;
  difficulty: DifficultyLevel;
  
  // AI配置
  aiOpponents: AIOpponentConfig[];
  
  // 游戏设置（简化版）
  gameSettings?: {
    startingMoney: number;
    maxRounds: number;
    winCondition: string;
  };
  
  // 向后兼容的字段
  gameRules?: GameRuleConfig;
  uiSettings?: UISettings;
}

// 游戏规则配置
export interface GameRuleConfig {
  // 基础规则
  startingMoney: number;
  passStartBonus: number;
  maxRounds: number;
  winCondition: WinCondition;
  
  // 房产规则
  propertyAuctionEnabled: boolean;
  mortgageEnabled: boolean;
  tradingEnabled: boolean;
  
  // 技能规则
  skillsEnabled: boolean;
  skillCooldownModifier: number;
  
  // 事件规则
  eventsEnabled: boolean;
  eventFrequency: EventFrequency;
  
  // 季节规则
  seasonalEffectsEnabled: boolean;
  seasonLength: number;
}

// UI设置
export interface UISettings {
  // 主题
  theme: ThemeType;
  
  // 显示设置
  animationSpeed: AnimationSpeed;
  soundEnabled: boolean;
  musicEnabled: boolean;
  
  // 交互设置
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  confirmActions: boolean;
  
  // 辅助功能
  highContrastMode: boolean;
  largeFontMode: boolean;
  voiceControlEnabled: boolean;
  
  // 调试设置
  showDebugInfo: boolean;
  logLevel: LogLevel;
}

// 存储信息
export interface StorageInfo {
  totalSaves: number;
  totalSize: number;
  lastBackup?: number;
  saves: SaveInfo[];
}

// 导出数据
export interface ExportData {
  version: string;
  exportTime: number;
  saves: SaveData[];
  settings: Record<string, any>;
  statistics: GameStatistics;
}

// 游戏统计
export interface GameStatistics {
  // 基础统计
  gamesPlayed: number;
  gamesWon: number;
  totalPlayTime: number;
  averageGameLength: number;
  
  // 偏好统计
  favoriteZodiac: ZodiacSign | '';
  mostUsedSkills: string[];
  preferredDifficulty: DifficultyLevel | '';
  
  // 成就统计
  bestScore: number;
  longestGame: number;
  fastestVictory: number;
  achievements: Achievement[];
  
  // 时间统计
  lastPlayed: number;
  firstPlayed: number;
  consecutiveDays: number;
  
  // AI对战统计
  aiOpponentWins: Record<DifficultyLevel, number>;
  aiOpponentLosses: Record<DifficultyLevel, number>;
}

// 成就
export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  rarity: AchievementRarity;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

// 缓存配置
export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  cleanupInterval: number;
}

// 存储配置
export interface StorageConfig {
  databaseName: string;
  version: number;
  cacheConfig: CacheConfig;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  autoBackupEnabled: boolean;
  maxBackups: number;
}

// 备份信息
export interface BackupInfo {
  id: string;
  timestamp: number;
  size: number;
  saveCount: number;
  checksum: string;
  description?: string;
}

// 存储操作结果
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: StorageMetadata;
}

// 存储元数据
export interface StorageMetadata {
  operation: StorageOperation;
  duration: number;
  cacheHit?: boolean;
  compressed?: boolean;
  encrypted?: boolean;
}

// 数据迁移配置
export interface MigrationConfig {
  fromVersion: string;
  toVersion: string;
  migrationSteps: MigrationStep[];
}

// 迁移步骤
export interface MigrationStep {
  name: string;
  description: string;
  execute: (data: any) => Promise<any>;
  rollback?: (data: any) => Promise<any>;
}

// 存储事件
export interface StorageEvent {
  type: StorageEventType;
  timestamp: number;
  data?: any;
  metadata?: Record<string, any>;
}

// 存储监听器
export interface StorageListener {
  eventType: StorageEventType;
  callback: (event: StorageEvent) => void;
}

// 枚举类型
export type WinCondition = 'last_standing' | 'wealth_goal' | 'property_monopoly' | 'time_limit' | 'score_based';

export type EventFrequency = 'rare' | 'normal' | 'frequent' | 'constant';

export type ThemeType = 'default' | 'dark' | 'zodiac' | 'traditional' | 'modern' | 'colorful';

export type AnimationSpeed = 'slow' | 'normal' | 'fast' | 'instant';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export type AchievementType = 'victory' | 'economic' | 'social' | 'skill' | 'zodiac' | 'special' | 'collection';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type StorageOperation = 'save' | 'load' | 'delete' | 'list' | 'backup' | 'restore' | 'export' | 'import';

export type StorageEventType = 'save_created' | 'save_loaded' | 'save_deleted' | 'backup_created' | 'storage_error' | 'cache_cleared' | 'migration_completed';

// 常量
export const STORAGE_CONSTANTS = {
  DEFAULT_DB_NAME: 'zodiac_monopoly_db',
  DEFAULT_VERSION: 1,
  MAX_SAVE_NAME_LENGTH: 50,
  MAX_SAVES_PER_USER: 20,
  AUTO_SAVE_INTERVAL: 300000, // 5 minutes
  CACHE_TTL: 3600000, // 1 hour
  BACKUP_RETENTION_DAYS: 30,
  COMPRESSION_THRESHOLD: 10240, // 10KB
} as const;

// 高级存储功能接口

// 云存储同步接口
export interface CloudSync {
  enabled: boolean;
  provider: CloudProvider;
  accountId: string;
  
  // 同步状态
  lastSyncTime: number;
  syncInProgress: boolean;
  conflictResolution: ConflictResolution;
  
  // 同步配置
  autoSync: boolean;
  syncInterval: number;
  maxRetries: number;
  
  // 同步历史
  syncHistory: SyncRecord[];
  
  // 错误处理
  lastError?: SyncError;
  errorCount: number;
}

// 云存储提供商类型
export type CloudProvider = 'google_drive' | 'icloud' | 'dropbox' | 'onedrive' | 'custom';

// 冲突解决策略
export type ConflictResolution = 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual_resolve';

// 同步记录接口
export interface SyncRecord {
  id: string;
  timestamp: number;
  type: SyncType;
  status: SyncStatus;
  
  // 同步详情
  itemsUploaded: number;
  itemsDownloaded: number;
  conflicts: number;
  errors: number;
  
  // 时间统计
  duration: number;
  bytesTransferred: number;
}

// 同步类型
export type SyncType = 'full' | 'incremental' | 'save_only' | 'settings_only' | 'manual';

// 同步状态
export type SyncStatus = 'success' | 'partial_success' | 'failed' | 'cancelled' | 'in_progress';

// 同步错误接口
export interface SyncError {
  code: string;
  message: string;
  timestamp: number;
  retryable: boolean;
  details?: Record<string, any>;
}

// 数据压缩接口
export interface CompressionConfig {
  enabled: boolean;
  algorithm: CompressionAlgorithm;
  level: number; // 1-9, 1 fastest, 9 best compression
  
  // 压缩策略
  threshold: number; // bytes
  excludeTypes: string[];
  
  // 性能设置
  chunkSize: number;
  parallelCompression: boolean;
}

// 压缩算法类型
export type CompressionAlgorithm = 'gzip' | 'deflate' | 'brotli' | 'lz4' | 'zstd';

// 加密配置接口
export interface EncryptionConfig {
  enabled: boolean;
  algorithm: EncryptionAlgorithm;
  keyDerivation: KeyDerivationConfig;
  
  // 密钥管理
  keyRotation: boolean;
  keyRotationInterval: number;
  
  // 加密范围
  encryptSaves: boolean;
  encryptSettings: boolean;
  encryptStatistics: boolean;
}

// 加密算法类型
export type EncryptionAlgorithm = 'aes-256-gcm' | 'chacha20-poly1305' | 'aes-256-cbc';

// 密钥派生配置接口
export interface KeyDerivationConfig {
  algorithm: 'pbkdf2' | 'scrypt' | 'argon2id';
  iterations: number;
  saltLength: number;
  keyLength: number;
}

// 数据完整性接口
export interface DataIntegrity {
  enabled: boolean;
  hashAlgorithm: HashAlgorithm;
  
  // 校验设置
  checksumSaves: boolean;
  checksumSettings: boolean;
  verifyOnLoad: boolean;
  
  // 自动修复
  autoRepair: boolean;
  backupOnCorruption: boolean;
}

// 哈希算法类型
export type HashAlgorithm = 'sha256' | 'sha512' | 'blake3' | 'xxhash';

// 存储优化接口
export interface StorageOptimization {
  // 自动清理
  autoCleanup: boolean;
  cleanupInterval: number;
  
  // 清理规则
  maxSaveAge: number; // days
  maxSaveCount: number;
  removeOrphanedData: boolean;
  
  // 压缩优化
  compactDatabase: boolean;
  compactThreshold: number; // usage percentage
  
  // 缓存优化
  cacheOptimization: boolean;
  maxCacheSize: number; // bytes
  cacheEvictionPolicy: CacheEvictionPolicy;
}

// 缓存淘汰策略
export type CacheEvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'random' | 'ttl';

// 存储配额管理接口
export interface QuotaManagement {
  // 配额限制
  maxTotalSize: number; // bytes
  maxSaveSize: number; // bytes
  maxSaveCount: number;
  
  // 警告阈值
  warningThreshold: number; // percentage
  criticalThreshold: number; // percentage
  
  // 超限处理
  overflowAction: OverflowAction;
  prioritySaves: string[]; // save IDs to preserve
}

// 超限处理动作
export type OverflowAction = 'reject_new' | 'delete_oldest' | 'compress_existing' | 'prompt_user';

// 存储分析接口
export interface StorageAnalytics {
  // 使用统计
  totalReads: number;
  totalWrites: number;
  totalDeletes: number;
  
  // 性能统计
  averageReadTime: number;
  averageWriteTime: number;
  cacheHitRate: number;
  
  // 容量统计
  totalSize: number;
  saveDataSize: number;
  settingsSize: number;
  cacheSize: number;
  
  // 错误统计
  readErrors: number;
  writeErrors: number;
  corruptionErrors: number;
  
  // 时间范围
  period: AnalyticsPeriod;
  lastReset: number;
}

// 分析时间范围
export type AnalyticsPeriod = 'session' | 'daily' | 'weekly' | 'monthly' | 'all_time';

// 数据导入导出接口
export interface DataPortability {
  // 导出配置
  exportFormat: ExportFormat;
  includeSettings: boolean;
  includeStatistics: boolean;
  includeAchievements: boolean;
  
  // 导入配置
  importValidation: boolean;
  mergeStrategy: MergeStrategy;
  backupBeforeImport: boolean;
  
  // 格式转换
  supportedFormats: ExportFormat[];
  customFormatHandlers: Record<string, FormatHandler>;
}

// 导出格式
export type ExportFormat = 'json' | 'binary' | 'csv' | 'xml' | 'compressed_json';

// 合并策略
export type MergeStrategy = 'overwrite' | 'merge' | 'skip_existing' | 'prompt_user';

// 格式处理器接口
export interface FormatHandler {
  export: (data: any) => Promise<Blob>;
  import: (data: Blob) => Promise<any>;
  validate: (data: Blob) => Promise<boolean>;
}

// 存储监控接口
export interface StorageMonitoring {
  // 性能监控
  performanceMetrics: PerformanceMetrics;
  
  // 健康检查
  healthCheck: HealthCheck;
  
  // 告警配置
  alertConfig: AlertConfig;
  
  // 监控历史
  monitoringHistory: MonitoringSnapshot[];
}

// 性能指标接口
export interface PerformanceMetrics {
  // 响应时间
  readLatency: LatencyMetrics;
  writeLatency: LatencyMetrics;
  deleteLatency: LatencyMetrics;
  
  // 吞吐量
  readsPerSecond: number;
  writesPerSecond: number;
  bytesPerSecond: number;
  
  // 资源使用
  memoryUsage: number;
  diskUsage: number;
  cpuUsage: number;
}

// 延迟指标接口
export interface LatencyMetrics {
  average: number;
  median: number;
  p95: number;
  p99: number;
  max: number;
}

// 健康检查接口
export interface HealthCheck {
  status: HealthStatus;
  lastCheck: number;
  
  // 检查项目
  databaseConnection: boolean;
  dataIntegrity: boolean;
  freeSpace: number;
  permissions: boolean;
  
  // 错误信息
  errors: HealthError[];
  warnings: HealthWarning[];
}

// 健康状态
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

// 健康错误接口
export interface HealthError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  resolved: boolean;
}

// 健康警告接口
export interface HealthWarning {
  code: string;
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
}

// 告警配置接口
export interface AlertConfig {
  enabled: boolean;
  
  // 告警阈值
  highLatencyThreshold: number;
  lowSpaceThreshold: number;
  errorRateThreshold: number;
  
  // 通知设置
  notifications: AlertNotification[];
  
  // 告警抑制
  suppressionRules: SuppressionRule[];
}

// 告警通知接口
export interface AlertNotification {
  type: 'console' | 'popup' | 'email' | 'webhook';
  config: Record<string, any>;
  conditions: AlertCondition[];
}

// 告警条件接口
export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne';
  threshold: number;
  duration: number;
}

// 抑制规则接口
export interface SuppressionRule {
  id: string;
  condition: string;
  duration: number;
  reason: string;
}

// 监控快照接口
export interface MonitoringSnapshot {
  timestamp: number;
  metrics: PerformanceMetrics;
  health: HealthStatus;
  alerts: AlertCondition[];
}