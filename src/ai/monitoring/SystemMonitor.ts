/**
 * AI系统监控和调试工具
 * 集成个性化AI系统并优化 - 提供全面的系统监控、性能分析和调试能力
 */
import { EventEmitter } from '../../utils/EventEmitter';

export interface SystemMetrics {
  timestamp: Date;
  performance: PerformanceMetrics;
  resources: ResourceMetrics;
  ai: AIMetrics;
  errors: ErrorMetrics;
  health: HealthMetrics;
}

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    min: number;
    max: number;
    percentile95: number;
    percentile99: number;
  };
  throughput: {
    requestsPerSecond: number;
    decisionsPerMinute: number;
    peakThroughput: number;
  };
  latency: {
    aiDecision: number;
    personalityUpdate: number;
    learningProcessing: number;
    socialInteraction: number;
  };
}

export interface ResourceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    external: number;
    buffers: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
    processes: number;
  };
  disk: {
    reads: number;
    writes: number;
    readSpeed: number;
    writeSpeed: number;
    freeSpace: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    connectionCount: number;
  };
}

export interface AIMetrics {
  instances: {
    total: number;
    active: number;
    idle: number;
    learning: number;
    decision_making: number;
  };
  personalitySystem: {
    traits_updated: number;
    emotional_state_changes: number;
    adaptation_events: number;
  };
  learningSystem: {
    learning_events: number;
    successful_adaptations: number;
    pattern_recognitions: number;
    optimization_cycles: number;
  };
  decisionEngine: {
    decisions_made: number;
    cache_hits: number;
    cache_misses: number;
    average_confidence: number;
  };
  socialIntelligence: {
    interactions_processed: number;
    relationships_updated: number;
    trust_calculations: number;
  };
}

export interface ErrorMetrics {
  total: number;
  rate: number;
  byType: Record<string, number>;
  bySeverity: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  recovery: {
    successful: number;
    failed: number;
    time_to_recovery: number;
  };
}

export interface HealthMetrics {
  overall: number;
  subsystems: {
    personality: number;
    learning: number;
    decision: number;
    social: number;
    optimization: number;
    persistence: number;
  };
  availability: number;
  stability: number;
  responsiveness: number;
}

export interface AlertConfig {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  cooldown: number;
  actions: AlertAction[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  threshold: number;
  duration?: number;
}

export interface AlertAction {
  type: 'log' | 'email' | 'webhook' | 'restart' | 'scale';
  config: any;
}

export interface Alert {
  id: string;
  configId: string;
  severity: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved?: Date;
  actions_taken: string[];
}

export interface DebugSession {
  id: string;
  name: string;
  started: Date;
  ended?: Date;
  components: string[];
  breakpoints: Breakpoint[];
  traces: TraceEvent[];
  variables: VariableSnapshot[];
}

export interface Breakpoint {
  id: string;
  component: string;
  condition: string;
  enabled: boolean;
  hitCount: number;
  lastHit?: Date;
}

export interface TraceEvent {
  id: string;
  timestamp: Date;
  component: string;
  event: string;
  data: any;
  stackTrace?: string;
  duration?: number;
  severity: 'debug' | 'info' | 'warn' | 'error';
}

export interface VariableSnapshot {
  timestamp: Date;
  component: string;
  variables: Record<string, any>;
}

export interface MonitoringConfig {
  metricsInterval: number;
  retentionPeriod: number;
  alertsEnabled: boolean;
  debugMode: boolean;
  tracingEnabled: boolean;
  maxTraceEvents: number;
  exportFormat: 'json' | 'csv' | 'prometheus';
}

export class SystemMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private debugSessions: Map<string, DebugSession> = new Map();
  private isRunning = false;
  private metricsInterval: NodeJS.Timeout | null = null;
  private lastAlertTimes: Map<string, Date> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    
    this.config = {
      metricsInterval: 5000, // 5 seconds
      retentionPeriod: 86400000, // 24 hours
      alertsEnabled: true,
      debugMode: false,
      tracingEnabled: true,
      maxTraceEvents: 10000,
      exportFormat: 'json',
      ...config
    };

    this.initializeDefaultAlerts();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // 开始定期收集指标
    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, this.config.metricsInterval);

    // 立即收集一次指标
    await this.collectMetrics();

    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // 结束所有调试会话
    for (const session of this.debugSessions.values()) {
      await this.endDebugSession(session.id);
    }

    this.emit('stopped');
  }

  async collectMetrics(): Promise<SystemMetrics> {
    try {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        performance: await this.collectPerformanceMetrics(),
        resources: await this.collectResourceMetrics(),
        ai: await this.collectAIMetrics(),
        errors: await this.collectErrorMetrics(),
        health: await this.calculateHealthMetrics()
      };

      this.metrics.push(metrics);

      // 清理旧指标
      this.cleanupOldMetrics();

      // 检查警报
      if (this.config.alertsEnabled) {
        await this.checkAlerts(metrics);
      }

      this.emit('metricsCollected', metrics);
      
      return metrics;
      
    } catch (error) {
      this.emit('error', {
        operation: 'collectMetrics',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    // 模拟性能指标收集
    const responseTimeSamples = this.getRecentResponseTimes();
    
    return {
      responseTime: {
        average: this.calculateAverage(responseTimeSamples),
        min: Math.min(...responseTimeSamples, 0),
        max: Math.max(...responseTimeSamples, 0),
        percentile95: this.calculatePercentile(responseTimeSamples, 95),
        percentile99: this.calculatePercentile(responseTimeSamples, 99)
      },
      throughput: {
        requestsPerSecond: this.calculateThroughput('requests'),
        decisionsPerMinute: this.calculateThroughput('decisions') * 60,
        peakThroughput: this.getPeakThroughput()
      },
      latency: {
        aiDecision: 45 + Math.random() * 20,
        personalityUpdate: 12 + Math.random() * 8,
        learningProcessing: 78 + Math.random() * 30,
        socialInteraction: 23 + Math.random() * 15
      }
    };
  }

  private async collectResourceMetrics(): Promise<ResourceMetrics> {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        buffers: 0
      },
      cpu: {
        usage: this.getCPUUsage(),
        loadAverage: [0.5, 0.7, 0.6], // Simulated
        processes: 1
      },
      disk: {
        reads: 150 + Math.random() * 100,
        writes: 75 + Math.random() * 50,
        readSpeed: 120 + Math.random() * 80,
        writeSpeed: 85 + Math.random() * 60,
        freeSpace: 1024 * 1024 * 1024 * 50 // 50GB
      },
      network: {
        bytesIn: 1024 + Math.random() * 512,
        bytesOut: 768 + Math.random() * 256,
        packetsIn: 45 + Math.random() * 20,
        packetsOut: 32 + Math.random() * 15,
        connectionCount: 3
      }
    };
  }

  private async collectAIMetrics(): Promise<AIMetrics> {
    return {
      instances: {
        total: 12,
        active: 8 + Math.floor(Math.random() * 4),
        idle: 2 + Math.floor(Math.random() * 3),
        learning: 1 + Math.floor(Math.random() * 2),
        decision_making: 5 + Math.floor(Math.random() * 3)
      },
      personalitySystem: {
        traits_updated: 15 + Math.floor(Math.random() * 10),
        emotional_state_changes: 8 + Math.floor(Math.random() * 6),
        adaptation_events: 3 + Math.floor(Math.random() * 4)
      },
      learningSystem: {
        learning_events: 25 + Math.floor(Math.random() * 15),
        successful_adaptations: 18 + Math.floor(Math.random() * 10),
        pattern_recognitions: 12 + Math.floor(Math.random() * 8),
        optimization_cycles: 2 + Math.floor(Math.random() * 3)
      },
      decisionEngine: {
        decisions_made: 45 + Math.floor(Math.random() * 25),
        cache_hits: 32 + Math.floor(Math.random() * 15),
        cache_misses: 8 + Math.floor(Math.random() * 5),
        average_confidence: 0.75 + Math.random() * 0.2
      },
      socialIntelligence: {
        interactions_processed: 28 + Math.floor(Math.random() * 20),
        relationships_updated: 14 + Math.floor(Math.random() * 10),
        trust_calculations: 35 + Math.floor(Math.random() * 25)
      }
    };
  }

  private async collectErrorMetrics(): Promise<ErrorMetrics> {
    const recentErrors = this.getRecentErrors();
    
    return {
      total: recentErrors.length,
      rate: recentErrors.length / (this.config.metricsInterval / 1000),
      byType: this.groupErrorsByType(recentErrors),
      bySeverity: {
        critical: recentErrors.filter(e => e.severity === 'critical').length,
        error: recentErrors.filter(e => e.severity === 'error').length,
        warning: recentErrors.filter(e => e.severity === 'warning').length,
        info: recentErrors.filter(e => e.severity === 'info').length
      },
      recovery: {
        successful: 15,
        failed: 2,
        time_to_recovery: 1250
      }
    };
  }

  private async calculateHealthMetrics(): Promise<HealthMetrics> {
    const subsystems = {
      personality: this.calculateSubsystemHealth('personality'),
      learning: this.calculateSubsystemHealth('learning'),
      decision: this.calculateSubsystemHealth('decision'),
      social: this.calculateSubsystemHealth('social'),
      optimization: this.calculateSubsystemHealth('optimization'),
      persistence: this.calculateSubsystemHealth('persistence')
    };

    const overall = Object.values(subsystems).reduce((sum, health) => sum + health, 0) / Object.keys(subsystems).length;

    return {
      overall,
      subsystems,
      availability: 0.995 + Math.random() * 0.004,
      stability: 0.92 + Math.random() * 0.06,
      responsiveness: 0.88 + Math.random() * 0.08
    };
  }

  addAlertConfig(config: AlertConfig): void {
    this.alertConfigs.set(config.id, config);
    this.emit('alertConfigAdded', config);
  }

  removeAlertConfig(id: string): boolean {
    const removed = this.alertConfigs.delete(id);
    if (removed) {
      this.emit('alertConfigRemoved', { id });
    }
    return removed;
  }

  private async checkAlerts(metrics: SystemMetrics): Promise<void> {
    for (const config of this.alertConfigs.values()) {
      if (!config.enabled) continue;

      const lastAlertTime = this.lastAlertTimes.get(config.id);
      if (lastAlertTime && Date.now() - lastAlertTime.getTime() < config.cooldown) {
        continue;
      }

      const triggered = this.evaluateAlertCondition(config.condition, metrics);
      
      if (triggered) {
        const alert = await this.createAlert(config, metrics);
        this.alerts.push(alert);
        this.lastAlertTimes.set(config.id, new Date());
        
        await this.executeAlertActions(config, alert);
        this.emit('alertTriggered', alert);
      }
    }
  }

  private evaluateAlertCondition(condition: AlertCondition, metrics: SystemMetrics): boolean {
    const value = this.extractMetricValue(condition.metric, metrics);
    
    switch (condition.operator) {
      case 'gt': return value > condition.threshold;
      case 'lt': return value < condition.threshold;
      case 'eq': return value === condition.threshold;
      case 'gte': return value >= condition.threshold;
      case 'lte': return value <= condition.threshold;
      case 'ne': return value !== condition.threshold;
      default: return false;
    }
  }

  private extractMetricValue(metricPath: string, metrics: SystemMetrics): number {
    const parts = metricPath.split('.');
    let current: any = metrics;
    
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return 0;
      }
    }
    
    return typeof current === 'number' ? current : 0;
  }

  private async createAlert(config: AlertConfig, metrics: SystemMetrics): Promise<Alert> {
    const value = this.extractMetricValue(config.condition.metric, metrics);
    
    return {
      id: this.generateAlertId(),
      configId: config.id,
      severity: config.severity,
      message: `${config.name}: ${config.condition.metric} ${config.condition.operator} ${config.condition.threshold} (current: ${value})`,
      metric: config.condition.metric,
      value,
      threshold: config.condition.threshold,
      timestamp: new Date(),
      actions_taken: []
    };
  }

  private async executeAlertActions(config: AlertConfig, alert: Alert): Promise<void> {
    for (const action of config.actions) {
      try {
        await this.executeAction(action, alert);
        alert.actions_taken.push(action.type);
      } catch (error) {
        this.emit('actionError', {
          alertId: alert.id,
          action: action.type,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async executeAction(action: AlertAction, alert: Alert): Promise<void> {
    switch (action.type) {
      case 'log':
        console.log(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
        break;
      case 'email':
        // 实现邮件发送逻辑
        break;
      case 'webhook':
        // 实现webhook调用逻辑
        break;
      case 'restart':
        // 实现重启逻辑
        break;
      case 'scale':
        // 实现扩容逻辑
        break;
    }
  }

  async startDebugSession(name: string, components: string[] = []): Promise<string> {
    const sessionId = this.generateSessionId();
    
    const session: DebugSession = {
      id: sessionId,
      name,
      started: new Date(),
      components,
      breakpoints: [],
      traces: [],
      variables: []
    };

    this.debugSessions.set(sessionId, session);
    this.emit('debugSessionStarted', session);
    
    return sessionId;
  }

  async endDebugSession(sessionId: string): Promise<void> {
    const session = this.debugSessions.get(sessionId);
    if (session) {
      session.ended = new Date();
      this.emit('debugSessionEnded', session);
      this.debugSessions.delete(sessionId);
    }
  }

  addBreakpoint(sessionId: string, component: string, condition: string): string {
    const session = this.debugSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debug session ${sessionId} not found`);
    }

    const breakpointId = this.generateBreakpointId();
    const breakpoint: Breakpoint = {
      id: breakpointId,
      component,
      condition,
      enabled: true,
      hitCount: 0
    };

    session.breakpoints.push(breakpoint);
    this.emit('breakpointAdded', { sessionId, breakpoint });
    
    return breakpointId;
  }

  addTraceEvent(sessionId: string, component: string, event: string, data: any, severity: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    const traceEvent: TraceEvent = {
      id: this.generateTraceId(),
      timestamp: new Date(),
      component,
      event,
      data,
      severity
    };

    session.traces.push(traceEvent);

    // 限制追踪事件数量
    if (session.traces.length > this.config.maxTraceEvents) {
      session.traces.shift();
    }

    this.emit('traceAdded', { sessionId, traceEvent });
  }

  captureVariables(sessionId: string, component: string, variables: Record<string, any>): void {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    const snapshot: VariableSnapshot = {
      timestamp: new Date(),
      component,
      variables: JSON.parse(JSON.stringify(variables)) // Deep copy
    };

    session.variables.push(snapshot);
    this.emit('variablesCaptured', { sessionId, snapshot });
  }

  getMetrics(since?: Date, until?: Date): SystemMetrics[] {
    let filtered = this.metrics;
    
    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since);
    }
    
    if (until) {
      filtered = filtered.filter(m => m.timestamp <= until);
    }
    
    return filtered;
  }

  getAlerts(resolved?: boolean): Alert[] {
    if (resolved === undefined) {
      return this.alerts;
    }
    
    return this.alerts.filter(alert => 
      resolved ? alert.resolved !== undefined : alert.resolved === undefined
    );
  }

  getDebugSession(sessionId: string): DebugSession | undefined {
    return this.debugSessions.get(sessionId);
  }

  exportMetrics(format: 'json' | 'csv' | 'prometheus' = this.config.exportFormat): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.metrics, null, 2);
      case 'csv':
        return this.convertToCSV(this.metrics);
      case 'prometheus':
        return this.convertToPrometheus(this.metrics);
      default:
        return JSON.stringify(this.metrics, null, 2);
    }
  }

  // 私有方法

  private initializeDefaultAlerts(): void {
    const defaultAlerts: AlertConfig[] = [
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: {
          metric: 'resources.memory.percentage',
          operator: 'gt',
          threshold: 85
        },
        severity: 'warning',
        enabled: true,
        cooldown: 300000, // 5 minutes
        actions: [{ type: 'log', config: {} }]
      },
      {
        id: 'low_system_health',
        name: 'Low System Health',
        condition: {
          metric: 'health.overall',
          operator: 'lt',
          threshold: 0.7
        },
        severity: 'error',
        enabled: true,
        cooldown: 600000, // 10 minutes
        actions: [{ type: 'log', config: {} }]
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: {
          metric: 'errors.rate',
          operator: 'gt',
          threshold: 10
        },
        severity: 'critical',
        enabled: true,
        cooldown: 180000, // 3 minutes
        actions: [{ type: 'log', config: {} }]
      }
    ];

    for (const alert of defaultAlerts) {
      this.addAlertConfig(alert);
    }
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionPeriod);
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffTime);
  }

  private getRecentResponseTimes(): number[] {
    // 模拟最近的响应时间数据
    return Array.from({ length: 100 }, () => 50 + Math.random() * 100);
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  private calculateThroughput(type: string): number {
    // 模拟吞吐量计算
    return 5 + Math.random() * 10;
  }

  private getPeakThroughput(): number {
    return 25 + Math.random() * 15;
  }

  private getCPUUsage(): number {
    return 30 + Math.random() * 40;
  }

  private getRecentErrors(): any[] {
    // 模拟最近的错误数据
    return [];
  }

  private groupErrorsByType(errors: any[]): Record<string, number> {
    return {};
  }

  private calculateSubsystemHealth(subsystem: string): number {
    return 0.85 + Math.random() * 0.12;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateBreakpointId(): string {
    return `bp_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private convertToCSV(metrics: SystemMetrics[]): string {
    if (metrics.length === 0) return '';
    
    const headers = [
      'timestamp',
      'memory_percentage',
      'cpu_usage',
      'response_time_avg',
      'throughput_rps',
      'health_overall',
      'errors_total'
    ];
    
    const rows = metrics.map(m => [
      m.timestamp.toISOString(),
      m.resources.memory.percentage,
      m.resources.cpu.usage,
      m.performance.responseTime.average,
      m.performance.throughput.requestsPerSecond,
      m.health.overall,
      m.errors.total
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private convertToPrometheus(metrics: SystemMetrics[]): string {
    if (metrics.length === 0) return '';
    
    const latest = metrics[metrics.length - 1];
    const timestamp = Math.floor(latest.timestamp.getTime() / 1000);
    
    return [
      `# HELP memory_usage_percentage Memory usage percentage`,
      `# TYPE memory_usage_percentage gauge`,
      `memory_usage_percentage ${latest.resources.memory.percentage} ${timestamp}`,
      `# HELP cpu_usage_percentage CPU usage percentage`,
      `# TYPE cpu_usage_percentage gauge`,
      `cpu_usage_percentage ${latest.resources.cpu.usage} ${timestamp}`,
      `# HELP health_overall_score Overall system health score`,
      `# TYPE health_overall_score gauge`,
      `health_overall_score ${latest.health.overall} ${timestamp}`
    ].join('\n');
  }
}