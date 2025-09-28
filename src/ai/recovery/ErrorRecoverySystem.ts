/**
 * AI系统错误处理和恢复机制
 * 集成个性化AI系统并优化 - 提供智能错误处理、自动恢复和系统弹性
 */
import { EventEmitter } from '../../utils/EventEmitter';

export interface ErrorEvent {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  component: string;
  message: string;
  details: any;
  timestamp: Date;
  stackTrace?: string;
  context: ErrorContext;
  retryCount: number;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

export enum ErrorType {
  PERSONALITY_UPDATE_FAILED = 'personality_update_failed',
  LEARNING_PROCESS_ERROR = 'learning_process_error',
  DECISION_ENGINE_TIMEOUT = 'decision_engine_timeout',
  SOCIAL_INTERACTION_ERROR = 'social_interaction_error',
  PERSISTENCE_FAILURE = 'persistence_failure',
  OPTIMIZATION_ERROR = 'optimization_error',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  CONFIGURATION_ERROR = 'configuration_error',
  EXTERNAL_SERVICE_ERROR = 'external_service_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string;
  gameId?: string;
  aiInstanceId?: string;
  operation: string;
  requestId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  applicableTypes: ErrorType[];
  severityThreshold: ErrorSeverity;
  maxRetries: number;
  backoffStrategy: BackoffStrategy;
  enabled: boolean;
  execute(error: ErrorEvent): Promise<RecoveryResult>;
}

export enum BackoffStrategy {
  FIXED = 'fixed',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  RANDOM = 'random'
}

export interface RecoveryResult {
  success: boolean;
  action: string;
  details: string;
  nextRetry?: Date;
  permanent?: boolean;
  data?: any;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure?: Date;
  nextRetry?: Date;
  successes: number;
}

export interface FallbackConfig {
  enabled: boolean;
  strategies: FallbackStrategy[];
}

export interface FallbackStrategy {
  name: string;
  condition: (error: ErrorEvent) => boolean;
  action: (error: ErrorEvent) => Promise<any>;
  priority: number;
}

export interface HealthCheck {
  component: string;
  interval: number;
  timeout: number;
  retries: number;
  check(): Promise<boolean>;
}

export interface RecoveryMetrics {
  totalErrors: number;
  resolvedErrors: number;
  resolutionRate: number;
  averageResolutionTime: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recoverySuccessRate: number;
  circuitBreakerTrips: number;
  fallbackActivations: number;
}

export class ErrorRecoverySystem extends EventEmitter {
  private errors: Map<string, ErrorEvent> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private fallbackConfig: FallbackConfig;
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metrics: RecoveryMetrics;

  constructor() {
    super();
    
    this.fallbackConfig = {
      enabled: true,
      strategies: []
    };

    this.metrics = {
      totalErrors: 0,
      resolvedErrors: 0,
      resolutionRate: 0,
      averageResolutionTime: 0,
      errorsByType: {},
      errorsBySeverity: {},
      recoverySuccessRate: 0,
      circuitBreakerTrips: 0,
      fallbackActivations: 0
    };

    this.initializeDefaultStrategies();
    this.initializeDefaultFallbacks();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // 启动健康检查监控
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
      this.updateCircuitBreakers();
      this.cleanupResolvedErrors();
    }, 30000); // 30 seconds

    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('stopped');
  }

  async handleError(
    type: ErrorType,
    severity: ErrorSeverity,
    component: string,
    message: string,
    details: any = {},
    context: Partial<ErrorContext> = {}
  ): Promise<void> {
    const errorId = this.generateErrorId();
    
    const error: ErrorEvent = {
      id: errorId,
      type,
      severity,
      component,
      message,
      details,
      timestamp: new Date(),
      stackTrace: new Error().stack,
      context: {
        operation: 'unknown',
        metadata: {},
        ...context
      },
      retryCount: 0,
      resolved: false
    };

    this.errors.set(errorId, error);
    this.updateMetrics(error);

    this.emit('errorOccurred', error);

    // 检查断路器状态
    const circuitState = this.getCircuitBreakerState(component);
    if (circuitState.state === 'OPEN') {
      await this.activateFallback(error);
      return;
    }

    // 尝试自动恢复
    await this.attemptRecovery(error);
  }

  private async attemptRecovery(error: ErrorEvent): Promise<void> {
    const applicableStrategies = this.findApplicableStrategies(error);
    
    if (applicableStrategies.length === 0) {
      await this.activateFallback(error);
      return;
    }

    // 按优先级排序策略
    applicableStrategies.sort((a, b) => this.getStrategyPriority(a) - this.getStrategyPriority(b));

    for (const strategy of applicableStrategies) {
      if (error.retryCount >= strategy.maxRetries) {
        continue;
      }

      try {
        const result = await this.executeRecoveryStrategy(strategy, error);
        
        if (result.success) {
          await this.resolveError(error, result.action);
          return;
        } else if (result.permanent) {
          await this.activateFallback(error);
          return;
        }

        // 计划重试
        if (result.nextRetry) {
          this.scheduleRetry(error, strategy, result.nextRetry);
        }

      } catch (recoveryError) {
        this.emit('recoveryFailed', {
          errorId: error.id,
          strategy: strategy.name,
          recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
        });
      }
    }

    // 所有策略都失败了，激活降级
    await this.activateFallback(error);
  }

  private async executeRecoveryStrategy(strategy: RecoveryStrategy, error: ErrorEvent): Promise<RecoveryResult> {
    error.retryCount++;
    
    this.emit('recoveryAttempt', {
      errorId: error.id,
      strategy: strategy.name,
      attempt: error.retryCount
    });

    const startTime = Date.now();
    const result = await strategy.execute(error);
    const duration = Date.now() - startTime;

    this.emit('recoveryResult', {
      errorId: error.id,
      strategy: strategy.name,
      success: result.success,
      duration
    });

    return result;
  }

  private findApplicableStrategies(error: ErrorEvent): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = [];

    for (const strategy of this.recoveryStrategies.values()) {
      if (!strategy.enabled) continue;
      
      if (strategy.applicableTypes.includes(error.type) &&
          this.severityMeetsThreshold(error.severity, strategy.severityThreshold)) {
        strategies.push(strategy);
      }
    }

    return strategies;
  }

  private severityMeetsThreshold(errorSeverity: ErrorSeverity, threshold: ErrorSeverity): boolean {
    const severityLevels = {
      [ErrorSeverity.LOW]: 1,
      [ErrorSeverity.MEDIUM]: 2,
      [ErrorSeverity.HIGH]: 3,
      [ErrorSeverity.CRITICAL]: 4
    };

    return severityLevels[errorSeverity] >= severityLevels[threshold];
  }

  private getStrategyPriority(strategy: RecoveryStrategy): number {
    // 根据策略类型和配置计算优先级
    const priorityMap: Record<string, number> = {
      'restart_component': 1,
      'clear_cache': 2,
      'reset_state': 3,
      'failover': 4,
      'circuit_breaker': 5
    };

    return priorityMap[strategy.id] || 10;
  }

  private async resolveError(error: ErrorEvent, resolution: string): Promise<void> {
    error.resolved = true;
    error.resolvedAt = new Date();
    error.resolution = resolution;

    this.metrics.resolvedErrors++;
    this.updateResolutionMetrics();

    this.emit('errorResolved', error);
  }

  private async activateFallback(error: ErrorEvent): Promise<void> {
    if (!this.fallbackConfig.enabled) {
      return;
    }

    const applicableFallbacks = this.fallbackConfig.strategies
      .filter(strategy => strategy.condition(error))
      .sort((a, b) => a.priority - b.priority);

    for (const fallback of applicableFallbacks) {
      try {
        await fallback.action(error);
        this.metrics.fallbackActivations++;
        
        this.emit('fallbackActivated', {
          errorId: error.id,
          fallback: fallback.name
        });
        
        return;
      } catch (fallbackError) {
        this.emit('fallbackFailed', {
          errorId: error.id,
          fallback: fallback.name,
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        });
      }
    }
  }

  private scheduleRetry(error: ErrorEvent, strategy: RecoveryStrategy, retryTime: Date): void {
    const delay = retryTime.getTime() - Date.now();
    
    setTimeout(async () => {
      if (!error.resolved && this.isRunning) {
        await this.attemptRecovery(error);
      }
    }, Math.max(0, delay));
  }

  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.id, strategy);
    this.emit('strategyAdded', strategy);
  }

  removeRecoveryStrategy(strategyId: string): boolean {
    const removed = this.recoveryStrategies.delete(strategyId);
    if (removed) {
      this.emit('strategyRemoved', { strategyId });
    }
    return removed;
  }

  addHealthCheck(healthCheck: HealthCheck): void {
    this.healthChecks.set(healthCheck.component, healthCheck);
    this.emit('healthCheckAdded', healthCheck);
  }

  private async performHealthChecks(): Promise<void> {
    for (const [component, healthCheck] of this.healthChecks.entries()) {
      try {
        const healthy = await Promise.race([
          healthCheck.check(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), healthCheck.timeout)
          )
        ]);

        if (!healthy) {
          await this.handleError(
            ErrorType.RESOURCE_EXHAUSTION,
            ErrorSeverity.HIGH,
            component,
            'Health check failed',
            {},
            { operation: 'health_check' }
          );
        }

      } catch (error) {
        await this.handleError(
          ErrorType.RESOURCE_EXHAUSTION,
          ErrorSeverity.HIGH,
          component,
          `Health check error: ${error instanceof Error ? error.message : String(error)}`,
          { error },
          { operation: 'health_check' }
        );
      }
    }
  }

  private updateCircuitBreakers(): void {
    const now = Date.now();
    
    for (const [component, state] of this.circuitBreakers.entries()) {
      if (state.state === 'OPEN' && state.nextRetry && now >= state.nextRetry.getTime()) {
        state.state = 'HALF_OPEN';
        state.successes = 0;
        this.emit('circuitBreakerHalfOpen', { component });
      }
    }
  }

  private getCircuitBreakerState(component: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(component)) {
      this.circuitBreakers.set(component, {
        state: 'CLOSED',
        failures: 0,
        successes: 0
      });
    }
    return this.circuitBreakers.get(component)!;
  }

  private updateCircuitBreaker(component: string, success: boolean): void {
    const state = this.getCircuitBreakerState(component);
    const config: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      monitoringPeriod: 300000,
      halfOpenMaxCalls: 3
    };

    if (success) {
      state.successes++;
      if (state.state === 'HALF_OPEN' && state.successes >= config.halfOpenMaxCalls) {
        state.state = 'CLOSED';
        state.failures = 0;
        this.emit('circuitBreakerClosed', { component });
      }
    } else {
      state.failures++;
      state.lastFailure = new Date();
      
      if (state.state === 'CLOSED' && state.failures >= config.failureThreshold) {
        state.state = 'OPEN';
        state.nextRetry = new Date(Date.now() + config.recoveryTimeout);
        this.metrics.circuitBreakerTrips++;
        this.emit('circuitBreakerOpened', { component });
      } else if (state.state === 'HALF_OPEN') {
        state.state = 'OPEN';
        state.nextRetry = new Date(Date.now() + config.recoveryTimeout);
        this.emit('circuitBreakerOpened', { component });
      }
    }
  }

  private cleanupResolvedErrors(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    
    for (const [id, error] of this.errors.entries()) {
      if (error.resolved && error.resolvedAt && error.resolvedAt < cutoffTime) {
        this.errors.delete(id);
      }
    }
  }

  private updateMetrics(error: ErrorEvent): void {
    this.metrics.totalErrors++;
    
    if (!this.metrics.errorsByType[error.type]) {
      this.metrics.errorsByType[error.type] = 0;
    }
    this.metrics.errorsByType[error.type]++;
    
    if (!this.metrics.errorsBySeverity[error.severity]) {
      this.metrics.errorsBySeverity[error.severity] = 0;
    }
    this.metrics.errorsBySeverity[error.severity]++;
    
    this.updateResolutionMetrics();
  }

  private updateResolutionMetrics(): void {
    this.metrics.resolutionRate = this.metrics.totalErrors > 0 
      ? this.metrics.resolvedErrors / this.metrics.totalErrors 
      : 0;

    // 计算平均解决时间
    const resolvedErrors = Array.from(this.errors.values())
      .filter(e => e.resolved && e.resolvedAt);
    
    if (resolvedErrors.length > 0) {
      const totalResolutionTime = resolvedErrors.reduce((sum, error) => {
        return sum + (error.resolvedAt!.getTime() - error.timestamp.getTime());
      }, 0);
      
      this.metrics.averageResolutionTime = totalResolutionTime / resolvedErrors.length;
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  getMetrics(): RecoveryMetrics {
    return { ...this.metrics };
  }

  getActiveErrors(): ErrorEvent[] {
    return Array.from(this.errors.values()).filter(e => !e.resolved);
  }

  getResolvedErrors(): ErrorEvent[] {
    return Array.from(this.errors.values()).filter(e => e.resolved);
  }

  // 初始化默认恢复策略
  private initializeDefaultStrategies(): void {
    // 重启组件策略
    this.addRecoveryStrategy({
      id: 'restart_component',
      name: 'Restart Component',
      applicableTypes: [
        ErrorType.PERSONALITY_UPDATE_FAILED,
        ErrorType.DECISION_ENGINE_TIMEOUT,
        ErrorType.LEARNING_PROCESS_ERROR
      ],
      severityThreshold: ErrorSeverity.HIGH,
      maxRetries: 3,
      backoffStrategy: BackoffStrategy.EXPONENTIAL,
      enabled: true,
      async execute(error: ErrorEvent): Promise<RecoveryResult> {
        // 模拟组件重启
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          success: Math.random() > 0.3,
          action: 'Component restarted',
          details: `Restarted ${error.component} component`,
          nextRetry: new Date(Date.now() + Math.pow(2, error.retryCount) * 1000)
        };
      }
    });

    // 清理缓存策略
    this.addRecoveryStrategy({
      id: 'clear_cache',
      name: 'Clear Cache',
      applicableTypes: [
        ErrorType.PERSISTENCE_FAILURE,
        ErrorType.OPTIMIZATION_ERROR
      ],
      severityThreshold: ErrorSeverity.MEDIUM,
      maxRetries: 2,
      backoffStrategy: BackoffStrategy.FIXED,
      enabled: true,
      async execute(error: ErrorEvent): Promise<RecoveryResult> {
        // 模拟缓存清理
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          success: Math.random() > 0.2,
          action: 'Cache cleared',
          details: 'Cleared relevant caches',
          nextRetry: new Date(Date.now() + 5000)
        };
      }
    });

    // 状态重置策略
    this.addRecoveryStrategy({
      id: 'reset_state',
      name: 'Reset State',
      applicableTypes: [
        ErrorType.VALIDATION_ERROR,
        ErrorType.CONFIGURATION_ERROR
      ],
      severityThreshold: ErrorSeverity.LOW,
      maxRetries: 1,
      backoffStrategy: BackoffStrategy.FIXED,
      enabled: true,
      async execute(error: ErrorEvent): Promise<RecoveryResult> {
        // 模拟状态重置
        await new Promise(resolve => setTimeout(resolve, 200));
        
        return {
          success: Math.random() > 0.1,
          action: 'State reset',
          details: 'Reset component state to default',
          nextRetry: new Date(Date.now() + 2000)
        };
      }
    });
  }

  // 初始化默认降级策略
  private initializeDefaultFallbacks(): void {
    this.fallbackConfig.strategies = [
      {
        name: 'Simple AI Response',
        condition: (error) => error.type === ErrorType.DECISION_ENGINE_TIMEOUT,
        action: async (error) => {
          // 提供简单的AI响应
          return { action: 'simple_decision', confidence: 0.5 };
        },
        priority: 1
      },
      {
        name: 'Default Personality',
        condition: (error) => error.type === ErrorType.PERSONALITY_UPDATE_FAILED,
        action: async (error) => {
          // 使用默认人格配置
          return { personality: 'default' };
        },
        priority: 2
      },
      {
        name: 'Skip Learning',
        condition: (error) => error.type === ErrorType.LEARNING_PROCESS_ERROR,
        action: async (error) => {
          // 跳过学习过程
          return { learning: 'skipped' };
        },
        priority: 3
      }
    ];
  }
}