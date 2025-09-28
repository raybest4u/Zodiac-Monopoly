import { EventEmitter } from '../utils/EventEmitter';
import { GameBalanceSystem } from './GameBalanceSystem';
import { DynamicBalanceAdjuster } from './DynamicBalanceAdjuster';
import { FairnessDetectionSystem } from './FairnessDetectionSystem';
import { GameBalanceAnalyzer } from './GameBalanceAnalyzer';
import type { GameState, Player } from '../types/game';

export interface BalanceIntegrationConfig {
  enableRealTimeBalancing: boolean;
  enableFairnessMonitoring: boolean;
  balanceUpdateFrequency: number;
  fairnessCheckFrequency: number;
  autoAdjustmentThreshold: number;
  emergencyInterventionThreshold: number;
  logDetailLevel: 'minimal' | 'standard' | 'detailed' | 'debug';
}

export interface BalanceSystemState {
  systemHealth: number;
  balanceScore: number;
  fairnessScore: number;
  activeAdjustments: number;
  pendingInterventions: number;
  lastUpdate: number;
  systemStatus: 'healthy' | 'warning' | 'critical' | 'offline';
}

export interface BalanceIntervention {
  id: string;
  timestamp: number;
  type: InterventionType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  target: string;
  description: string;
  automaticResponse: boolean;
  success: boolean;
  impact: InterventionImpact;
}

export type InterventionType = 
  | 'immediate_adjustment' 
  | 'gradual_rebalance' 
  | 'fairness_correction' 
  | 'emergency_intervention' 
  | 'preventive_action';

export interface InterventionImpact {
  balanceImprovement: number;
  fairnessImprovement: number;
  playerSatisfactionChange: number;
  gameFlowDisruption: number;
}

export interface BalanceEvent {
  timestamp: number;
  type: BalanceEventType;
  source: string;
  data: any;
  processed: boolean;
  response?: BalanceResponse;
}

export type BalanceEventType = 
  | 'balance_alert' 
  | 'fairness_violation' 
  | 'system_anomaly' 
  | 'player_complaint' 
  | 'performance_degradation';

export interface BalanceResponse {
  responseTime: number;
  actions: string[];
  effectiveness: number;
  followUpRequired: boolean;
}

export interface BalanceMetrics {
  systemPerformance: SystemPerformanceMetrics;
  gameBalance: GameBalanceMetrics;
  playerExperience: PlayerExperienceMetrics;
  fairnessIndicators: FairnessIndicators;
}

export interface SystemPerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  resourceUsage: number;
  uptime: number;
}

export interface GameBalanceMetrics {
  economicBalance: number;
  competitiveBalance: number;
  zodiacBalance: number;
  skillBalance: number;
  progressionBalance: number;
}

export interface PlayerExperienceMetrics {
  satisfactionScore: number;
  engagementLevel: number;
  frustrationIndicator: number;
  learningCurve: number;
  retentionProbability: number;
}

export interface FairnessIndicators {
  opportunityFairness: number;
  outcomeFairness: number;
  processFairness: number;
  representationFairness: number;
  overallFairness: number;
}

export class BalanceSystemIntegration extends EventEmitter {
  private balanceSystem: GameBalanceSystem;
  private adjuster: DynamicBalanceAdjuster;
  private fairnessDetector: FairnessDetectionSystem;
  private analyzer: GameBalanceAnalyzer;
  
  private config: BalanceIntegrationConfig;
  private currentState: BalanceSystemState;
  private eventQueue: BalanceEvent[] = [];
  private interventionHistory: BalanceIntervention[] = [];
  
  private balanceTimer: NodeJS.Timeout | null = null;
  private fairnessTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config?: Partial<BalanceIntegrationConfig>) {
    super();
    
    this.config = {
      enableRealTimeBalancing: true,
      enableFairnessMonitoring: true,
      balanceUpdateFrequency: 30000, // 30秒
      fairnessCheckFrequency: 60000, // 1分钟
      autoAdjustmentThreshold: 0.7,
      emergencyInterventionThreshold: 0.3,
      logDetailLevel: 'standard',
      ...config
    };

    this.balanceSystem = new GameBalanceSystem();
    this.adjuster = new DynamicBalanceAdjuster();
    this.fairnessDetector = new FairnessDetectionSystem();
    this.analyzer = new GameBalanceAnalyzer();

    this.currentState = {
      systemHealth: 1.0,
      balanceScore: 0.8,
      fairnessScore: 0.8,
      activeAdjustments: 0,
      pendingInterventions: 0,
      lastUpdate: Date.now(),
      systemStatus: 'healthy'
    };

    this.initializeSystemIntegration();
  }

  public async startBalanceSystem(gameState: GameState): Promise<void> {
    try {
      if (this.isRunning) {
        this.emit('warning', { message: 'Balance system already running' });
        return;
      }

      this.isRunning = true;
      
      // 初始化系统状态
      await this.initializeSystemState(gameState);
      
      // 启动各个子系统
      if (this.config.enableRealTimeBalancing) {
        this.startBalanceMonitoring(gameState);
      }
      
      if (this.config.enableFairnessMonitoring) {
        this.startFairnessMonitoring(gameState);
      }
      
      // 启动事件处理
      this.startEventProcessing();
      
      this.emit('system_started', { state: this.currentState });
      
    } catch (error) {
      this.emit('error', { type: 'system_start_failed', error });
      throw error;
    }
  }

  public async stopBalanceSystem(): Promise<void> {
    try {
      this.isRunning = false;
      
      // 停止定时器
      if (this.balanceTimer) {
        clearInterval(this.balanceTimer);
        this.balanceTimer = null;
      }
      
      if (this.fairnessTimer) {
        clearInterval(this.fairnessTimer);
        this.fairnessTimer = null;
      }
      
      // 停止子系统监控
      this.balanceSystem.stopMonitoring();
      this.fairnessDetector.stopMonitoring();
      
      this.currentState.systemStatus = 'offline';
      this.emit('system_stopped', { state: this.currentState });
      
    } catch (error) {
      this.emit('error', { type: 'system_stop_failed', error });
      throw error;
    }
  }

  public async processGameUpdate(gameState: GameState): Promise<void> {
    try {
      if (!this.isRunning) return;

      // 更新系统状态
      await this.updateSystemState(gameState);
      
      // 检查是否需要紧急干预
      const needsIntervention = await this.checkEmergencyIntervention(gameState);
      if (needsIntervention) {
        await this.executeEmergencyIntervention(gameState);
      }
      
      // 处理待处理的事件
      await this.processEventQueue(gameState);
      
      this.emit('game_update_processed', { 
        state: this.currentState,
        interventions: this.interventionHistory.slice(-5)
      });
      
    } catch (error) {
      this.emit('error', { type: 'game_update_failed', error });
    }
  }

  public async forceBalanceCheck(gameState: GameState): Promise<BalanceSystemState> {
    try {
      // 强制执行完整的平衡检查
      const balanceState = await this.balanceSystem.analyzeAndBalance(gameState);
      const fairnessReport = await this.fairnessDetector.analyzeFairness(gameState);
      
      // 更新系统状态
      this.currentState.balanceScore = balanceState.systemHealth;
      this.currentState.fairnessScore = fairnessReport.overallScore;
      this.currentState.lastUpdate = Date.now();
      
      // 检查是否需要调整
      if (this.shouldTriggerAdjustment(balanceState, fairnessReport)) {
        await this.triggerBalanceAdjustment(gameState, balanceState, fairnessReport);
      }
      
      this.emit('force_check_completed', { 
        state: this.currentState,
        balanceState,
        fairnessReport
      });
      
      return this.currentState;
      
    } catch (error) {
      this.emit('error', { type: 'force_check_failed', error });
      throw error;
    }
  }

  public async addBalanceEvent(event: Partial<BalanceEvent>): Promise<void> {
    const fullEvent: BalanceEvent = {
      timestamp: event.timestamp || Date.now(),
      type: event.type || 'system_anomaly',
      source: event.source || 'unknown',
      data: event.data || {},
      processed: false
    };

    this.eventQueue.push(fullEvent);
    this.emit('event_added', { event: fullEvent });
    
    // 如果是高优先级事件，立即处理
    if (this.isHighPriorityEvent(fullEvent)) {
      await this.processEvent(fullEvent);
    }
  }

  private async initializeSystemState(gameState: GameState): Promise<void> {
    try {
      // 初始分析
      const initialBalance = await this.balanceSystem.analyzeAndBalance(gameState);
      const initialFairness = await this.fairnessDetector.analyzeFairness(gameState);
      
      this.currentState = {
        systemHealth: this.calculateSystemHealth(initialBalance, initialFairness),
        balanceScore: initialBalance.systemHealth,
        fairnessScore: initialFairness.overallScore,
        activeAdjustments: 0,
        pendingInterventions: 0,
        lastUpdate: Date.now(),
        systemStatus: 'healthy'
      };
      
    } catch (error) {
      this.emit('error', { type: 'initialization_failed', error });
      throw error;
    }
  }

  private startBalanceMonitoring(gameState: GameState): void {
    this.balanceTimer = setInterval(async () => {
      try {
        await this.performBalanceCheck(gameState);
      } catch (error) {
        this.emit('error', { type: 'balance_monitoring_error', error });
      }
    }, this.config.balanceUpdateFrequency);
  }

  private startFairnessMonitoring(gameState: GameState): void {
    this.fairnessTimer = setInterval(async () => {
      try {
        await this.performFairnessCheck(gameState);
      } catch (error) {
        this.emit('error', { type: 'fairness_monitoring_error', error });
      }
    }, this.config.fairnessCheckFrequency);
  }

  private startEventProcessing(): void {
    // 启动事件处理循环
    setInterval(async () => {
      if (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event && !event.processed) {
          await this.processEvent(event);
        }
      }
    }, 5000); // 每5秒处理一次事件队列
  }

  private async performBalanceCheck(gameState: GameState): Promise<void> {
    try {
      const balanceState = await this.balanceSystem.analyzeAndBalance(gameState);
      
      // 检查是否需要调整
      if (balanceState.systemHealth < this.config.autoAdjustmentThreshold) {
        await this.scheduleBalanceAdjustment(gameState, balanceState);
      }
      
      this.currentState.balanceScore = balanceState.systemHealth;
      this.currentState.lastUpdate = Date.now();
      
    } catch (error) {
      this.emit('error', { type: 'balance_check_failed', error });
    }
  }

  private async performFairnessCheck(gameState: GameState): Promise<void> {
    try {
      const fairnessReport = await this.fairnessDetector.analyzeFairness(gameState);
      
      // 检查公平性违规
      if (fairnessReport.violations.length > 0) {
        await this.handleFairnessViolations(gameState, fairnessReport.violations);
      }
      
      this.currentState.fairnessScore = fairnessReport.overallScore;
      this.currentState.lastUpdate = Date.now();
      
    } catch (error) {
      this.emit('error', { type: 'fairness_check_failed', error });
    }
  }

  private async processEvent(event: BalanceEvent): Promise<void> {
    try {
      const startTime = Date.now();
      let actions: string[] = [];
      let effectiveness = 0;

      switch (event.type) {
        case 'balance_alert':
          actions = await this.handleBalanceAlert(event);
          effectiveness = 0.8;
          break;
        case 'fairness_violation':
          actions = await this.handleFairnessViolation(event);
          effectiveness = 0.7;
          break;
        case 'system_anomaly':
          actions = await this.handleSystemAnomaly(event);
          effectiveness = 0.6;
          break;
        case 'player_complaint':
          actions = await this.handlePlayerComplaint(event);
          effectiveness = 0.5;
          break;
        case 'performance_degradation':
          actions = await this.handlePerformanceDegradation(event);
          effectiveness = 0.9;
          break;
      }

      event.response = {
        responseTime: Date.now() - startTime,
        actions,
        effectiveness,
        followUpRequired: effectiveness < 0.7
      };

      event.processed = true;
      this.emit('event_processed', { event });

    } catch (error) {
      this.emit('error', { type: 'event_processing_failed', error, event });
    }
  }

  private async checkEmergencyIntervention(gameState: GameState): Promise<boolean> {
    return (
      this.currentState.systemHealth < this.config.emergencyInterventionThreshold ||
      this.currentState.fairnessScore < this.config.emergencyInterventionThreshold ||
      this.currentState.balanceScore < this.config.emergencyInterventionThreshold
    );
  }

  private async executeEmergencyIntervention(gameState: GameState): Promise<void> {
    try {
      const intervention: BalanceIntervention = {
        id: this.generateId(),
        timestamp: Date.now(),
        type: 'emergency_intervention',
        severity: 'critical',
        target: 'system_wide',
        description: 'Emergency intervention triggered due to system health degradation',
        automaticResponse: true,
        success: false,
        impact: {
          balanceImprovement: 0,
          fairnessImprovement: 0,
          playerSatisfactionChange: 0,
          gameFlowDisruption: 0
        }
      };

      // 执行紧急措施
      const success = await this.performEmergencyActions(gameState);
      intervention.success = success;

      if (success) {
        intervention.impact = await this.measureInterventionImpact(intervention, gameState);
      }

      this.interventionHistory.push(intervention);
      this.currentState.pendingInterventions = Math.max(0, this.currentState.pendingInterventions - 1);

      this.emit('emergency_intervention', { intervention });

    } catch (error) {
      this.emit('error', { type: 'emergency_intervention_failed', error });
    }
  }

  private async updateSystemState(gameState: GameState): Promise<void> {
    // 计算系统健康度
    const health = this.calculateCurrentSystemHealth(gameState);
    this.currentState.systemHealth = health;

    // 更新系统状态
    if (health > 0.8) {
      this.currentState.systemStatus = 'healthy';
    } else if (health > 0.6) {
      this.currentState.systemStatus = 'warning';
    } else {
      this.currentState.systemStatus = 'critical';
    }

    this.currentState.lastUpdate = Date.now();
  }

  private async processEventQueue(gameState: GameState): Promise<void> {
    const unprocessedEvents = this.eventQueue.filter(e => !e.processed);
    
    for (const event of unprocessedEvents.slice(0, 5)) { // 每次最多处理5个事件
      await this.processEvent(event);
    }
  }

  private calculateSystemHealth(balanceState: any, fairnessReport: any): number {
    return (balanceState.systemHealth + fairnessReport.overallScore) / 2;
  }

  private calculateCurrentSystemHealth(gameState: GameState): number {
    // 基于多个因素计算当前系统健康度
    let health = 1.0;

    // 基于活跃调整数量
    if (this.currentState.activeAdjustments > 10) {
      health -= 0.2;
    }

    // 基于待处理干预数量
    if (this.currentState.pendingInterventions > 5) {
      health -= 0.3;
    }

    // 基于时间因素
    const timeSinceUpdate = Date.now() - this.currentState.lastUpdate;
    if (timeSinceUpdate > 300000) { // 5分钟
      health -= 0.1;
    }

    return Math.max(0, Math.min(1, health));
  }

  private shouldTriggerAdjustment(balanceState: any, fairnessReport: any): boolean {
    return (
      balanceState.systemHealth < this.config.autoAdjustmentThreshold ||
      fairnessReport.overallScore < this.config.autoAdjustmentThreshold ||
      fairnessReport.violations.some((v: any) => v.severity === 'critical')
    );
  }

  private async triggerBalanceAdjustment(gameState: GameState, balanceState: any, fairnessReport: any): Promise<void> {
    try {
      // 创建调整上下文
      const context = {
        gameState,
        recentHistory: [],
        playerBehavior: {
          engagementLevel: 0.7,
          skillUsagePatterns: new Map(),
          decisionLatency: 1000,
          adaptabilityScore: 0.6,
          frustractionLevel: 0.3
        },
        systemMetrics: {
          performanceScore: 0.8,
          stabilityIndex: 0.9,
          responseTime: 100,
          resourceUsage: 0.6,
          errorRate: 0.01
        },
        environmentalFactors: []
      };

      const adjustments = await this.adjuster.analyzeAndAdjust(context);
      this.currentState.activeAdjustments += adjustments.length;

      this.emit('adjustments_triggered', { 
        adjustments,
        trigger: { balanceState, fairnessReport }
      });

    } catch (error) {
      this.emit('error', { type: 'adjustment_trigger_failed', error });
    }
  }

  private async scheduleBalanceAdjustment(gameState: GameState, balanceState: any): Promise<void> {
    // 安排平衡调整
    this.currentState.pendingInterventions++;
    await this.triggerBalanceAdjustment(gameState, balanceState, null);
  }

  private async handleFairnessViolations(gameState: GameState, violations: any[]): Promise<void> {
    for (const violation of violations) {
      if (violation.severity === 'critical' || violation.severity === 'major') {
        await this.addBalanceEvent({
          type: 'fairness_violation',
          source: 'fairness_detector',
          data: { violation }
        });
      }
    }
  }

  private isHighPriorityEvent(event: BalanceEvent): boolean {
    return (
      event.type === 'fairness_violation' ||
      event.type === 'performance_degradation' ||
      (event.type === 'balance_alert' && event.data.severity === 'critical')
    );
  }

  // 事件处理方法
  private async handleBalanceAlert(event: BalanceEvent): Promise<string[]> {
    return ['adjust_parameters', 'notify_administrators'];
  }

  private async handleFairnessViolation(event: BalanceEvent): Promise<string[]> {
    return ['investigate_bias', 'apply_corrective_measures'];
  }

  private async handleSystemAnomaly(event: BalanceEvent): Promise<string[]> {
    return ['system_diagnostic', 'temporary_stabilization'];
  }

  private async handlePlayerComplaint(event: BalanceEvent): Promise<string[]> {
    return ['analyze_complaint', 'investigate_cause'];
  }

  private async handlePerformanceDegradation(event: BalanceEvent): Promise<string[]> {
    return ['optimize_performance', 'reduce_system_load'];
  }

  private async performEmergencyActions(gameState: GameState): Promise<boolean> {
    try {
      // 执行紧急措施
      // 这里应该包含具体的紧急干预逻辑
      return true;
    } catch (error) {
      return false;
    }
  }

  private async measureInterventionImpact(intervention: BalanceIntervention, gameState: GameState): Promise<InterventionImpact> {
    return {
      balanceImprovement: 0.2,
      fairnessImprovement: 0.15,
      playerSatisfactionChange: 0.1,
      gameFlowDisruption: 0.05
    };
  }

  private initializeSystemIntegration(): void {
    // 设置子系统之间的事件监听
    this.balanceSystem.on('balance_analyzed', (data) => {
      this.emit('balance_update', data);
    });

    this.fairnessDetector.on('fairness_analyzed', (data) => {
      this.emit('fairness_update', data);
    });

    this.adjuster.on('adjustments_completed', (data) => {
      this.emit('adjustments_update', data);
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 公共接口方法
  public getCurrentState(): BalanceSystemState {
    return { ...this.currentState };
  }

  public getSystemMetrics(): BalanceMetrics {
    return {
      systemPerformance: {
        responseTime: 100,
        throughput: 1000,
        errorRate: 0.01,
        resourceUsage: 0.6,
        uptime: 0.99
      },
      gameBalance: {
        economicBalance: this.currentState.balanceScore,
        competitiveBalance: 0.8,
        zodiacBalance: 0.85,
        skillBalance: 0.7,
        progressionBalance: 0.75
      },
      playerExperience: {
        satisfactionScore: 0.8,
        engagementLevel: 0.7,
        frustrationIndicator: 0.2,
        learningCurve: 0.6,
        retentionProbability: 0.85
      },
      fairnessIndicators: {
        opportunityFairness: this.currentState.fairnessScore,
        outcomeFairness: 0.8,
        processFairness: 0.9,
        representationFairness: 0.75,
        overallFairness: this.currentState.fairnessScore
      }
    };
  }

  public getInterventionHistory(limit: number = 50): BalanceIntervention[] {
    return this.interventionHistory.slice(-limit);
  }

  public updateConfig(newConfig: Partial<BalanceIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config_updated', { config: this.config });
  }

  public getConfig(): BalanceIntegrationConfig {
    return { ...this.config };
  }

  public isSystemRunning(): boolean {
    return this.isRunning;
  }
}