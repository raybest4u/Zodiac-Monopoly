/**
 * 统一日志系统
 * 提供结构化日志记录、错误跟踪和性能监控
 */

import { GameErrorType, GameError } from '../types/core';

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * 日志上下文
 */
export interface LogContext {
  readonly component?: string;      // 组件名称
  readonly playerId?: string;       // 玩家ID
  readonly round?: number;          // 游戏回合
  readonly phase?: string;          // 游戏阶段
  readonly action?: string;         // 操作类型
  readonly timestamp?: number;      // 时间戳
  readonly sessionId?: string;      // 会话ID
  readonly gameId?: string;         // 游戏ID
  readonly [key: string]: any;      // 其他上下文数据
}

/**
 * 日志条目
 */
export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: number;
  readonly context: LogContext;
  readonly error?: Error;
  readonly stack?: string;
  readonly id: string;
}

/**
 * 日志输出器接口
 */
export interface LogOutput {
  write(entry: LogEntry): void;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

/**
 * 控制台输出器
 */
export class ConsoleOutput implements LogOutput {
  private useColors: boolean;

  constructor(useColors = true) {
    this.useColors = useColors && typeof window !== 'undefined';
  }

  write(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = LogLevel[entry.level];
    const component = entry.context.component || 'Unknown';
    
    let message = `[${timestamp}] [${level}] [${component}] ${entry.message}`;
    
    // 添加上下文信息
    if (Object.keys(entry.context).length > 1) {
      const contextStr = JSON.stringify(entry.context, null, 2);
      message += `\nContext: ${contextStr}`;
    }

    // 添加错误堆栈
    if (entry.error && entry.stack) {
      message += `\nStack: ${entry.stack}`;
    }

    // 根据级别使用不同的控制台方法
    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.useColors) {
          console.debug(`%c${message}`, 'color: #888');
        } else {
          console.debug(message);
        }
        break;
      case LogLevel.INFO:
        if (this.useColors) {
          console.info(`%c${message}`, 'color: #0066cc');
        } else {
          console.info(message);
        }
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message);
        break;
    }
  }
}

/**
 * 内存缓冲输出器
 */
export class MemoryOutput implements LogOutput {
  private buffer: LogEntry[] = [];
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  write(entry: LogEntry): void {
    this.buffer.push(entry);
    
    // 保持缓冲区大小
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getEntries(): readonly LogEntry[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }

  async flush(): Promise<void> {
    // 内存输出器不需要刷新
  }
}

/**
 * 文件输出器（Node.js环境）
 */
export class FileOutput implements LogOutput {
  private filePath: string;
  private buffer: string[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(filePath: string, autoFlushInterval = 5000) {
    this.filePath = filePath;
    
    // 定期刷新到文件
    if (autoFlushInterval > 0) {
      this.flushInterval = setInterval(() => {
        this.flush().catch(console.error);
      }, autoFlushInterval);
    }
  }

  write(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = LogLevel[entry.level];
    const component = entry.context.component || 'Unknown';
    
    const logLine = JSON.stringify({
      timestamp,
      level,
      component,
      message: entry.message,
      context: entry.context,
      error: entry.error?.message,
      stack: entry.stack,
      id: entry.id
    });
    
    this.buffer.push(logLine);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs').promises;
        const content = this.buffer.join('\n') + '\n';
        await fs.appendFile(this.filePath, content);
        this.buffer = [];
      } catch (error) {
        console.error('Failed to write log file:', error);
      }
    }
  }

  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

/**
 * 主要日志器类
 */
export class Logger {
  private static instance: Logger | null = null;
  private outputs: LogOutput[] = [];
  private currentLevel: LogLevel = LogLevel.INFO;
  private defaultContext: LogContext = {};
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.addOutput(new ConsoleOutput());
  }

  /**
   * 获取单例实例
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * 设置默认上下文
   */
  setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...context };
  }

  /**
   * 添加输出器
   */
  addOutput(output: LogOutput): void {
    this.outputs.push(output);
  }

  /**
   * 移除输出器
   */
  removeOutput(output: LogOutput): void {
    const index = this.outputs.indexOf(output);
    if (index > -1) {
      this.outputs.splice(index, 1);
    }
  }

  /**
   * 记录日志
   */
  log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    if (level < this.currentLevel) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context: {
        ...this.defaultContext,
        ...context,
        sessionId: this.sessionId
      },
      error,
      stack: error?.stack,
      id: this.generateLogId()
    };

    // 写入所有输出器
    for (const output of this.outputs) {
      try {
        output.write(entry);
      } catch (e) {
        console.error('Log output error:', e);
      }
    }
  }

  /**
   * Debug级别日志
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info级别日志
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning级别日志
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error级别日志
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Fatal级别日志
   */
  fatal(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /**
   * 记录性能指标
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      ...context,
      operation,
      duration,
      type: 'performance'
    });
  }

  /**
   * 记录用户操作
   */
  userAction(action: string, playerId: string, result: 'success' | 'failed', context?: LogContext): void {
    this.info(`User action: ${action} - ${result}`, {
      ...context,
      playerId,
      action,
      result,
      type: 'user_action'
    });
  }

  /**
   * 记录游戏事件
   */
  gameEvent(event: string, context?: LogContext): void {
    this.info(`Game event: ${event}`, {
      ...context,
      event,
      type: 'game_event'
    });
  }

  /**
   * 记录状态变化
   */
  stateChange(from: string, to: string, context?: LogContext): void {
    this.info(`State change: ${from} -> ${to}`, {
      ...context,
      from,
      to,
      type: 'state_change'
    });
  }

  /**
   * 刷新所有输出器
   */
  async flush(): Promise<void> {
    const promises = this.outputs
      .map(output => output.flush?.())
      .filter(Boolean) as Promise<void>[];
    
    await Promise.all(promises);
  }

  /**
   * 关闭日志器
   */
  async close(): Promise<void> {
    await this.flush();
    
    const promises = this.outputs
      .map(output => output.close?.())
      .filter(Boolean) as Promise<void>[];
    
    await Promise.all(promises);
    
    this.outputs = [];
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成日志ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 游戏错误处理器
 */
export class GameErrorHandler {
  private logger: Logger;
  private errorCallbacks: Map<GameErrorType, ((error: GameError) => void)[]> = new Map();

  constructor(logger?: Logger) {
    this.logger = logger || Logger.getInstance();
  }

  /**
   * 处理游戏错误
   */
  handleError(error: GameError): void {
    // 记录错误日志
    this.logger.error(`Game error: ${error.message}`, {
      component: 'ErrorHandler',
      errorType: error.type,
      errorCode: error.code,
      errorContext: error.context
    });

    // 调用特定类型的错误回调
    const callbacks = this.errorCallbacks.get(error.type) || [];
    for (const callback of callbacks) {
      try {
        callback(error);
      } catch (e) {
        this.logger.error('Error in error callback', { component: 'ErrorHandler' }, e as Error);
      }
    }
  }

  /**
   * 注册错误回调
   */
  onError(type: GameErrorType, callback: (error: GameError) => void): void {
    if (!this.errorCallbacks.has(type)) {
      this.errorCallbacks.set(type, []);
    }
    this.errorCallbacks.get(type)!.push(callback);
  }

  /**
   * 创建并处理错误
   */
  createError(type: GameErrorType, message: string, code?: string, context?: Record<string, any>): GameError {
    const error: GameError = {
      type,
      message,
      code,
      timestamp: Date.now(),
      context
    };

    this.handleError(error);
    return error;
  }
}

// ===== 便捷函数 =====

/**
 * 获取默认日志器实例
 */
export function getLogger(): Logger {
  return Logger.getInstance();
}

/**
 * 创建带上下文的日志器
 */
export function createContextLogger(context: LogContext): ContextLogger {
  return new ContextLogger(Logger.getInstance(), context);
}

/**
 * 带上下文的日志器
 */
export class ContextLogger {
  private logger: Logger;
  private context: LogContext;

  constructor(logger: Logger, context: LogContext) {
    this.logger = logger;
    this.context = context;
  }

  debug(message: string, additionalContext?: LogContext): void {
    this.logger.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: LogContext): void {
    this.logger.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: LogContext): void {
    this.logger.warn(message, { ...this.context, ...additionalContext });
  }

  error(message: string, additionalContext?: LogContext, error?: Error): void {
    this.logger.error(message, { ...this.context, ...additionalContext }, error);
  }

  fatal(message: string, additionalContext?: LogContext, error?: Error): void {
    this.logger.fatal(message, { ...this.context, ...additionalContext }, error);
  }

  performance(operation: string, duration: number, additionalContext?: LogContext): void {
    this.logger.performance(operation, duration, { ...this.context, ...additionalContext });
  }

  userAction(action: string, playerId: string, result: 'success' | 'failed', additionalContext?: LogContext): void {
    this.logger.userAction(action, playerId, result, { ...this.context, ...additionalContext });
  }

  gameEvent(event: string, additionalContext?: LogContext): void {
    this.logger.gameEvent(event, { ...this.context, ...additionalContext });
  }

  stateChange(from: string, to: string, additionalContext?: LogContext): void {
    this.logger.stateChange(from, to, { ...this.context, ...additionalContext });
  }
}

// ===== 性能监控工具 =====

/**
 * 性能计时器
 */
export class PerformanceTimer {
  private startTime: number;
  private logger: Logger;
  private operation: string;
  private context: LogContext;

  constructor(operation: string, context: LogContext = {}, logger?: Logger) {
    this.operation = operation;
    this.context = context;
    this.logger = logger || Logger.getInstance();
    this.startTime = performance.now();
  }

  /**
   * 结束计时并记录
   */
  end(additionalContext?: LogContext): number {
    const duration = performance.now() - this.startTime;
    this.logger.performance(this.operation, duration, {
      ...this.context,
      ...additionalContext
    });
    return duration;
  }
}

/**
 * 性能监控装饰器
 */
export function measurePerformance(operation: string, context?: LogContext) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const timer = new PerformanceTimer(operation, {
        ...context,
        component: target.constructor.name,
        method: propertyName
      });

      try {
        const result = method.apply(this, args);
        
        if (result instanceof Promise) {
          return result.finally(() => timer.end());
        } else {
          timer.end();
          return result;
        }
      } catch (error) {
        timer.end({ error: true });
        throw error;
      }
    };

    return descriptor;
  };
}