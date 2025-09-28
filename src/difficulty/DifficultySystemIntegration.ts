import { EventEmitter } from '../utils/EventEmitter';
import { GameDifficultySystem, PlayerDifficultyProfile } from './GameDifficultySystem';
import { DynamicDifficultyAdjuster } from './DynamicDifficultyAdjuster';
import { ChallengeAssessmentSystem } from './ChallengeAssessmentSystem';
import { DifficultyCurveOptimizer } from './DifficultyCurveOptimizer';
import type { GameState, Player } from '../types/game';

export interface DifficultyIntegrationConfig {
  enableRealTimeAdjustment: boolean;
  enableCurveOptimization: boolean;
  enableChallengeAssessment: boolean;
  adjustmentFrequency: number;
  optimizationFrequency: number;
  assessmentFrequency: number;
  adaptiveThreshold: number;
  emergencyInterventionThreshold: number;
  logLevel: 'minimal' | 'standard' | 'detailed' | 'debug';
}

export interface DifficultySystemState {
  systemHealth: number;
  adaptationEffectiveness: number;
  playerSatisfaction: number;
  activePlayers: number;
  activeAdjustments: number;
  systemLoad: number;
  lastUpdate: number;
  systemStatus: 'initializing' | 'running' | 'optimizing' | 'maintenance' | 'error';
}

export interface PlayerDifficultyStatus {
  playerId: string;
  currentDifficulty: string;
  skillProgression: Record<string, number>;
  engagementLevel: number;
  frustrationLevel: number;
  lastAdjustment: number;
  adaptationHistory: AdaptationRecord[];
  recommendations: string[];
  warnings: string[];
}

export interface AdaptationRecord {
  timestamp: number;
  type: 'difficulty_change' | 'parameter_adjustment' | 'intervention' | 'optimization';
  fromValue: number;
  toValue: number;
  reasoning: string;
  success: boolean;
  playerResponse: 'positive' | 'negative' | 'neutral';
}

export interface SystemMetrics {
  totalPlayers: number;
  averageDifficulty: number;
  difficultyDistribution: Record<string, number>;
  adaptationAccuracy: number;
  playerRetention: number;
  sessionDuration: number;
  frustrationRate: number;
  masteryRate: number;
  systemUptime: number;
}

export interface DifficultyEvent {
  type: DifficultyEventType;
  playerId?: string;
  timestamp: number;
  data: any;
  processed: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type DifficultyEventType = 
  | 'player_joined' 
  | 'player_left' 
  | 'difficulty_changed' 
  | 'performance_alert' 
  | 'frustration_spike' 
  | 'mastery_achieved' 
  | 'plateau_detected' 
  | 'system_overload';

export interface IntegrationResponse {
  success: boolean;
  adjustmentsMade: number;
  interventionsTriggered: number;
  playersAffected: string[];
  systemHealth: number;
  recommendations: string[];
  warnings: string[];
}

export class DifficultySystemIntegration extends EventEmitter {
  private difficultySystem: GameDifficultySystem;
  private dynamicAdjuster: DynamicDifficultyAdjuster;
  private challengeAssessment: ChallengeAssessmentSystem;
  private curveOptimizer: DifficultyCurveOptimizer;
  
  private config: DifficultyIntegrationConfig;
  private systemState: DifficultySystemState;
  private playerStatuses: Map<string, PlayerDifficultyStatus> = new Map();
  private eventQueue: DifficultyEvent[] = [];
  
  private systemTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private initializationComplete: boolean = false;

  constructor(config?: Partial<DifficultyIntegrationConfig>) {
    super();
    
    this.config = {
      enableRealTimeAdjustment: true,
      enableCurveOptimization: true,
      enableChallengeAssessment: true,
      adjustmentFrequency: 10000, // 10秒
      optimizationFrequency: 300000, // 5分钟
      assessmentFrequency: 30000, // 30秒
      adaptiveThreshold: 0.7,
      emergencyInterventionThreshold: 0.3,
      logLevel: 'standard',
      ...config
    };

    this.systemState = {
      systemHealth: 1.0,
      adaptationEffectiveness: 0.8,
      playerSatisfaction: 0.75,
      activePlayers: 0,
      activeAdjustments: 0,
      systemLoad: 0.1,
      lastUpdate: Date.now(),
      systemStatus: 'initializing'
    };

    this.initializeSubSystems();
  }

  public async initialize(gameState: GameState): Promise<void> {
    try {
      this.systemState.systemStatus = 'initializing';
      
      // 初始化子系统
      await this.initializePlayerProfiles(gameState.players);
      
      // 设置事件监听
      this.setupEventHandlers();
      
      // 启动系统监控
      this.startSystemMonitoring();
      
      this.initializationComplete = true;
      this.systemState.systemStatus = 'running';
      
      this.emit('system_initialized', { 
        config: this.config, 
        state: this.systemState 
      });

    } catch (error) {
      this.systemState.systemStatus = 'error';
      this.emit('error', { type: 'initialization_failed', error });
      throw error;
    }
  }

  public async processGameUpdate(gameState: GameState): Promise<IntegrationResponse> {
    try {
      if (!this.isRunning || !this.initializationComplete) {
        return this.createEmptyResponse();
      }

      const startTime = Date.now();
      let adjustmentsMade = 0;
      let interventionsTriggered = 0;
      const playersAffected: string[] = [];
      const recommendations: string[] = [];
      const warnings: string[] = [];

      // 更新玩家状态
      await this.updatePlayerStatuses(gameState);

      // 处理事件队列
      await this.processEventQueue();

      // 执行实时调整
      if (this.config.enableRealTimeAdjustment) {
        const adjustmentResults = await this.executeRealTimeAdjustments(gameState);
        adjustmentsMade += adjustmentResults.adjustmentsMade;
        playersAffected.push(...adjustmentResults.playersAffected);
      }

      // 检查紧急干预需求
      const emergencyResults = await this.checkEmergencyInterventions(gameState);
      interventionsTriggered += emergencyResults.interventionsTriggered;
      playersAffected.push(...emergencyResults.playersAffected);
      warnings.push(...emergencyResults.warnings);

      // 更新系统健康度
      this.updateSystemHealth();

      // 生成建议
      recommendations.push(...this.generateSystemRecommendations());

      const response: IntegrationResponse = {
        success: true,
        adjustmentsMade,
        interventionsTriggered,
        playersAffected: [...new Set(playersAffected)],
        systemHealth: this.systemState.systemHealth,
        recommendations,
        warnings
      };

      // 记录处理时间
      const processingTime = Date.now() - startTime;
      this.updateSystemLoad(processingTime);

      this.emit('game_update_processed', { response, processingTime });

      return response;

    } catch (error) {
      this.emit('error', { type: 'game_update_processing_failed', error });
      return {
        success: false,
        adjustmentsMade: 0,
        interventionsTriggered: 0,
        playersAffected: [],
        systemHealth: this.systemState.systemHealth,
        recommendations: [],
        warnings: ['System processing error occurred']
      };
    }
  }

  public async addPlayer(player: Player, gameState: GameState): Promise<void> {
    try {
      // 在难度系统中初始化玩家档案
      const profile = await this.difficultySystem.initializePlayerProfile(player);
      
      // 在动态调整器中创建实时指标
      await this.dynamicAdjuster.updateRealTimeMetrics(player.id, {
        gameSessionId: gameState.id || 'default',
        timeInSession: 0,
        interactionPattern: 'initial'
      });

      // 在曲线优化器中初始化进度跟踪
      if (this.config.enableCurveOptimization) {
        await this.curveOptimizer.initializePlayerProgression(player.id, profile, gameState);
      }

      // 创建玩家状态跟踪
      const playerStatus: PlayerDifficultyStatus = {
        playerId: player.id,
        currentDifficulty: profile.currentDifficulty,
        skillProgression: { ...profile.skillAssessment },
        engagementLevel: 0.7,
        frustrationLevel: 0.3,
        lastAdjustment: Date.now(),
        adaptationHistory: [],
        recommendations: [],
        warnings: []
      };

      this.playerStatuses.set(player.id, playerStatus);
      this.systemState.activePlayers++;

      // 添加玩家加入事件
      this.addEvent({
        type: 'player_joined',
        playerId: player.id,
        timestamp: Date.now(),
        data: { player, profile },
        processed: false,
        priority: 'medium'
      });

      this.emit('player_added', { playerId: player.id, profile, status: playerStatus });

    } catch (error) {
      this.emit('error', { type: 'player_addition_failed', error, playerId: player.id });
      throw error;
    }
  }

  public async removePlayer(playerId: string): Promise<void> {
    try {
      // 清理玩家相关数据
      this.playerStatuses.delete(playerId);
      this.systemState.activePlayers = Math.max(0, this.systemState.activePlayers - 1);

      // 添加玩家离开事件
      this.addEvent({
        type: 'player_left',
        playerId,
        timestamp: Date.now(),
        data: { playerId },
        processed: false,
        priority: 'low'
      });

      this.emit('player_removed', { playerId });

    } catch (error) {
      this.emit('error', { type: 'player_removal_failed', error, playerId });
    }
  }

  public async updatePlayerPerformance(
    playerId: string,
    performanceData: any,
    gameState: GameState
  ): Promise<void> {
    try {
      const playerStatus = this.playerStatuses.get(playerId);
      if (!playerStatus) {
        this.emit('warning', { message: `Player status not found: ${playerId}` });
        return;
      }

      // 更新难度系统中的表现数据
      await this.difficultySystem.updatePlayerPerformance(playerId, gameState, performanceData);

      // 更新动态调整器中的实时指标
      await this.dynamicAdjuster.updateRealTimeMetrics(playerId, {
        currentScore: performanceData.score || 0,
        efficiency: performanceData.efficiency || 0.5,
        errorCount: performanceData.errors || 0,
        emotionalState: {
          frustration: performanceData.frustration || 0.3,
          confidence: performanceData.confidence || 0.7,
          engagement: performanceData.engagement || 0.8,
          satisfaction: performanceData.satisfaction || 0.7,
          stress: performanceData.stress || 0.3
        }
      });

      // 更新玩家状态
      playerStatus.engagementLevel = performanceData.engagement || playerStatus.engagementLevel;
      playerStatus.frustrationLevel = performanceData.frustration || playerStatus.frustrationLevel;

      // 检查是否需要立即干预
      if (await this.needsImmediateIntervention(playerId, performanceData)) {
        await this.triggerImmediateIntervention(playerId, gameState);
      }

      this.emit('player_performance_updated', { 
        playerId, 
        performanceData, 
        status: playerStatus 
      });

    } catch (error) {
      this.emit('error', { 
        type: 'performance_update_failed', 
        error, 
        playerId 
      });
    }
  }

  public getPlayerDifficultyStatus(playerId: string): PlayerDifficultyStatus | undefined {
    return this.playerStatuses.get(playerId);
  }

  public getSystemMetrics(): SystemMetrics {
    const playerStatuses = Array.from(this.playerStatuses.values());
    
    return {
      totalPlayers: this.systemState.activePlayers,
      averageDifficulty: this.calculateAverageDifficulty(),
      difficultyDistribution: this.calculateDifficultyDistribution(),
      adaptationAccuracy: this.systemState.adaptationEffectiveness,
      playerRetention: this.calculatePlayerRetention(),
      sessionDuration: this.calculateAverageSessionDuration(),
      frustrationRate: this.calculateAverageFrustration(),
      masteryRate: this.calculateMasteryRate(),
      systemUptime: this.calculateSystemUptime()
    };
  }

  public async shutdown(): Promise<void> {
    try {
      this.isRunning = false;
      
      // 停止系统监控
      this.stopSystemMonitoring();
      
      // 停止子系统
      this.dynamicAdjuster.stopRealTimeAdjustment();
      this.curveOptimizer.stopOptimization();
      
      // 清理资源
      this.playerStatuses.clear();
      this.eventQueue = [];
      
      this.systemState.systemStatus = 'maintenance';
      
      this.emit('system_shutdown');

    } catch (error) {
      this.emit('error', { type: 'shutdown_failed', error });
      throw error;
    }
  }

  private initializeSubSystems(): void {
    this.difficultySystem = new GameDifficultySystem();
    this.dynamicAdjuster = new DynamicDifficultyAdjuster(this.difficultySystem);
    this.challengeAssessment = new ChallengeAssessmentSystem();
    this.curveOptimizer = new DifficultyCurveOptimizer(
      this.difficultySystem,
      this.dynamicAdjuster,
      this.challengeAssessment
    );
  }

  private async initializePlayerProfiles(players: Player[]): Promise<void> {
    for (const player of players) {
      await this.addPlayer(player, { players } as GameState);
    }
  }

  private setupEventHandlers(): void {
    // 难度系统事件
    this.difficultySystem.on('difficulty_adjusted', (data) => {
      this.handleDifficultyAdjustment(data);
    });

    // 动态调整器事件
    this.dynamicAdjuster.on('realtime_adjustment_started', () => {
      this.emit('subsystem_status', { system: 'dynamic_adjuster', status: 'active' });
    });

    this.dynamicAdjuster.on('immediate_adjustment_executed', (data) => {
      this.handleImmediateAdjustment(data);
    });

    // 挑战评估系统事件
    this.challengeAssessment.on('challenge_assessed', (data) => {
      this.handleChallengeAssessment(data);
    });

    // 曲线优化器事件
    this.curveOptimizer.on('optimization_started', () => {
      this.emit('subsystem_status', { system: 'curve_optimizer', status: 'optimizing' });
    });

    this.curveOptimizer.on('plateau_detected', (data) => {
      this.handlePlateauDetection(data);
    });
  }

  private startSystemMonitoring(): void {
    this.isRunning = true;
    
    this.systemTimer = setInterval(() => {
      this.performSystemMaintenance();
    }, 60000); // 每分钟执行一次

    // 启动子系统
    if (this.config.enableRealTimeAdjustment) {
      // this.dynamicAdjuster.startRealTimeAdjustment() 需要gameState参数
    }

    if (this.config.enableCurveOptimization) {
      this.curveOptimizer.startOptimization();
    }
  }

  private stopSystemMonitoring(): void {
    if (this.systemTimer) {
      clearInterval(this.systemTimer);
      this.systemTimer = null;
    }
  }

  private async updatePlayerStatuses(gameState: GameState): Promise<void> {
    for (const [playerId, status] of this.playerStatuses) {
      const profile = this.difficultySystem.getPlayerProfile(playerId);
      if (profile) {
        status.currentDifficulty = profile.currentDifficulty;
        status.skillProgression = { ...profile.skillAssessment };
      }
    }
  }

  private async processEventQueue(): Promise<void> {
    const highPriorityEvents = this.eventQueue.filter(e => 
      !e.processed && (e.priority === 'high' || e.priority === 'critical')
    );

    for (const event of highPriorityEvents.slice(0, 10)) { // 限制处理数量
      await this.processEvent(event);
      event.processed = true;
    }

    // 清理已处理的事件
    this.eventQueue = this.eventQueue.filter(e => !e.processed);
  }

  private async processEvent(event: DifficultyEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'performance_alert':
          await this.handlePerformanceAlert(event);
          break;
        case 'frustration_spike':
          await this.handleFrustrationSpike(event);
          break;
        case 'mastery_achieved':
          await this.handleMasteryAchievement(event);
          break;
        case 'plateau_detected':
          await this.handlePlateauEvent(event);
          break;
        case 'system_overload':
          await this.handleSystemOverload(event);
          break;
      }
    } catch (error) {
      this.emit('error', { type: 'event_processing_failed', error, event });
    }
  }

  private async executeRealTimeAdjustments(gameState: GameState): Promise<{ adjustmentsMade: number; playersAffected: string[] }> {
    let adjustmentsMade = 0;
    const playersAffected: string[] = [];

    for (const [playerId, status] of this.playerStatuses) {
      if (await this.shouldAdjustPlayer(playerId, status)) {
        const context = this.createAdjustmentContext(playerId, gameState);
        const success = await this.dynamicAdjuster.executeImmediateAdjustment(
          playerId, 
          'correction', 
          context
        );

        if (success) {
          adjustmentsMade++;
          playersAffected.push(playerId);
          this.recordAdjustment(playerId, 'real_time_adjustment');
        }
      }
    }

    return { adjustmentsMade, playersAffected };
  }

  private async checkEmergencyInterventions(gameState: GameState): Promise<{ interventionsTriggered: number; playersAffected: string[]; warnings: string[] }> {
    let interventionsTriggered = 0;
    const playersAffected: string[] = [];
    const warnings: string[] = [];

    for (const [playerId, status] of this.playerStatuses) {
      if (status.frustrationLevel > this.config.emergencyInterventionThreshold * 2) {
        const context = this.createAdjustmentContext(playerId, gameState);
        const success = await this.dynamicAdjuster.executeImmediateAdjustment(
          playerId, 
          'emergency', 
          context
        );

        if (success) {
          interventionsTriggered++;
          playersAffected.push(playerId);
          warnings.push(`Emergency intervention triggered for player ${playerId}`);
        }
      }
    }

    return { interventionsTriggered, playersAffected, warnings };
  }

  private updateSystemHealth(): void {
    let health = 1.0;

    // 基于玩家满意度
    const avgSatisfaction = this.calculateAveragePlayerSatisfaction();
    health *= (0.5 + avgSatisfaction * 0.5);

    // 基于系统负载
    health *= Math.max(0.3, 1 - this.systemState.systemLoad);

    // 基于错误率
    health *= Math.max(0.5, this.systemState.adaptationEffectiveness);

    this.systemState.systemHealth = Math.max(0, Math.min(1, health));
    this.systemState.lastUpdate = Date.now();
  }

  private generateSystemRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.systemState.systemHealth < 0.7) {
      recommendations.push('Consider reducing system load or adjusting thresholds');
    }

    const avgFrustration = this.calculateAverageFrustration();
    if (avgFrustration > 0.6) {
      recommendations.push('High frustration levels detected - review difficulty settings');
    }

    if (this.systemState.activePlayers > 50) {
      recommendations.push('High player count - monitor system performance');
    }

    return recommendations;
  }

  private createEmptyResponse(): IntegrationResponse {
    return {
      success: false,
      adjustmentsMade: 0,
      interventionsTriggered: 0,
      playersAffected: [],
      systemHealth: this.systemState.systemHealth,
      recommendations: [],
      warnings: ['System not running']
    };
  }

  private addEvent(event: DifficultyEvent): void {
    this.eventQueue.push(event);
    
    // 限制队列大小
    if (this.eventQueue.length > 1000) {
      this.eventQueue = this.eventQueue.slice(-1000);
    }
  }

  private async needsImmediateIntervention(playerId: string, performanceData: any): Promise<boolean> {
    return performanceData.frustration > 0.8 || 
           performanceData.engagement < 0.3 ||
           performanceData.errors > 10;
  }

  private async triggerImmediateIntervention(playerId: string, gameState: GameState): Promise<void> {
    this.addEvent({
      type: 'performance_alert',
      playerId,
      timestamp: Date.now(),
      data: { immediate: true },
      processed: false,
      priority: 'high'
    });
  }

  private createAdjustmentContext(playerId: string, gameState: GameState): any {
    const profile = this.difficultySystem.getPlayerProfile(playerId);
    return {
      gameState,
      playerProfile: profile,
      recentMetrics: [],
      sessionContext: {
        sessionLength: Date.now() - (profile?.lastUpdate || Date.now()),
        sessionType: 'normal',
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
        playerEnergy: 0.8,
        deviceType: 'desktop',
        connectionQuality: 0.9
      },
      socialContext: {
        isMultiplayer: gameState.players.length > 1,
        otherPlayerLevels: gameState.players.map(() => 5),
        competitiveBalance: 0.5,
        socialPressure: 0.3
      }
    };
  }

  private async shouldAdjustPlayer(playerId: string, status: PlayerDifficultyStatus): Promise<boolean> {
    const timeSinceLastAdjustment = Date.now() - status.lastAdjustment;
    return timeSinceLastAdjustment > this.config.adjustmentFrequency &&
           (status.frustrationLevel > 0.7 || status.engagementLevel < 0.4);
  }

  private recordAdjustment(playerId: string, type: string): void {
    const status = this.playerStatuses.get(playerId);
    if (status) {
      status.adaptationHistory.push({
        timestamp: Date.now(),
        type: type as any,
        fromValue: 0,
        toValue: 0,
        reasoning: type,
        success: true,
        playerResponse: 'neutral'
      });
      
      status.lastAdjustment = Date.now();
      
      // 限制历史记录大小
      if (status.adaptationHistory.length > 50) {
        status.adaptationHistory = status.adaptationHistory.slice(-50);
      }
    }
  }

  private performSystemMaintenance(): void {
    // 清理过期数据
    this.cleanupExpiredData();
    
    // 更新系统指标
    this.updateSystemMetrics();
    
    // 检查系统健康
    if (this.systemState.systemHealth < 0.5) {
      this.addEvent({
        type: 'system_overload',
        timestamp: Date.now(),
        data: { health: this.systemState.systemHealth },
        processed: false,
        priority: 'critical'
      });
    }
  }

  private cleanupExpiredData(): void {
    const oneHourAgo = Date.now() - 3600000;
    this.eventQueue = this.eventQueue.filter(event => event.timestamp > oneHourAgo);
  }

  private updateSystemMetrics(): void {
    this.systemState.playerSatisfaction = this.calculateAveragePlayerSatisfaction();
    this.systemState.adaptationEffectiveness = this.calculateAdaptationEffectiveness();
  }

  private updateSystemLoad(processingTime: number): void {
    const maxProcessingTime = 1000; // 1秒
    const loadContribution = Math.min(1, processingTime / maxProcessingTime);
    this.systemState.systemLoad = this.systemState.systemLoad * 0.9 + loadContribution * 0.1;
  }

  // 事件处理器
  private handleDifficultyAdjustment(data: any): void {
    if (data.playerId) {
      this.recordAdjustment(data.playerId, 'difficulty_change');
    }
  }

  private handleImmediateAdjustment(data: any): void {
    this.systemState.activeAdjustments++;
  }

  private handleChallengeAssessment(data: any): void {
    // 处理挑战评估结果
  }

  private handlePlateauDetection(data: any): void {
    this.addEvent({
      type: 'plateau_detected',
      playerId: data.playerId,
      timestamp: Date.now(),
      data: data.plateau,
      processed: false,
      priority: 'high'
    });
  }

  private async handlePerformanceAlert(event: DifficultyEvent): Promise<void> {
    // 处理性能警报
  }

  private async handleFrustrationSpike(event: DifficultyEvent): Promise<void> {
    // 处理挫折感激增
  }

  private async handleMasteryAchievement(event: DifficultyEvent): Promise<void> {
    // 处理掌握成就
  }

  private async handlePlateauEvent(event: DifficultyEvent): Promise<void> {
    // 处理平台期事件
  }

  private async handleSystemOverload(event: DifficultyEvent): Promise<void> {
    // 处理系统过载
    this.systemState.systemStatus = 'maintenance';
    this.emit('system_overload', { event });
  }

  // 计算方法
  private calculateAverageDifficulty(): number {
    const profiles = Array.from(this.playerStatuses.values());
    if (profiles.length === 0) return 5;
    
    return profiles.reduce((sum, status) => {
      const level = this.difficultySystem.getDifficultyLevel(status.currentDifficulty);
      return sum + (level?.numericValue || 5);
    }, 0) / profiles.length;
  }

  private calculateDifficultyDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const status of this.playerStatuses.values()) {
      const difficulty = status.currentDifficulty;
      distribution[difficulty] = (distribution[difficulty] || 0) + 1;
    }
    
    return distribution;
  }

  private calculatePlayerRetention(): number {
    return 0.85; // 简化实现
  }

  private calculateAverageSessionDuration(): number {
    return 1800; // 30分钟，简化实现
  }

  private calculateAverageFrustration(): number {
    const statuses = Array.from(this.playerStatuses.values());
    if (statuses.length === 0) return 0.3;
    
    return statuses.reduce((sum, status) => sum + status.frustrationLevel, 0) / statuses.length;
  }

  private calculateMasteryRate(): number {
    return 0.15; // 简化实现
  }

  private calculateSystemUptime(): number {
    return this.isRunning ? 0.99 : 0;
  }

  private calculateAveragePlayerSatisfaction(): number {
    const statuses = Array.from(this.playerStatuses.values());
    if (statuses.length === 0) return 0.75;
    
    return statuses.reduce((sum, status) => {
      return sum + (1 - status.frustrationLevel) * status.engagementLevel;
    }, 0) / statuses.length;
  }

  private calculateAdaptationEffectiveness(): number {
    // 基于调整成功率和玩家响应计算
    return 0.8; // 简化实现
  }

  // 公共接口
  public getSystemState(): DifficultySystemState {
    return { ...this.systemState };
  }

  public getAllPlayerStatuses(): PlayerDifficultyStatus[] {
    return Array.from(this.playerStatuses.values());
  }

  public updateConfiguration(newConfig: Partial<DifficultyIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configuration_updated', { config: this.config });
  }

  public getConfiguration(): DifficultyIntegrationConfig {
    return { ...this.config };
  }

  public isSystemRunning(): boolean {
    return this.isRunning && this.initializationComplete;
  }
}