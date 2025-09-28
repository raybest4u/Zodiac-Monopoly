/**
 * 事件响应系统集成器
 * Event Response System Integrator
 * 
 * 统一管理和协调所有事件响应组件，提供与游戏核心的完整集成接口
 * Unified management and coordination of all event response components, providing complete integration interface with game core
 */

import { EventEmitter } from '../utils/EventEmitter';
import { GameEvent, Player, GameState } from '../types/game';
import { PlayerResponseInputSystem, PlayerResponseInput, ResponseProcessingResult } from './PlayerResponseInputSystem';
import { EventEffectCalculationEngine, CalculatedEffect, AppliedEffect, EffectCalculationContext } from './EventEffectCalculationEngine';
import { ResponseValidationProcessor, ValidationResult } from './ResponseValidationProcessor';
import { EventOutcomeGenerationSystem, EventOutcome } from './EventOutcomeGenerationSystem';
import { MultiPlayerResponseCoordinator, MultiPlayerEventSession } from './MultiPlayerResponseCoordinator';

export interface EventResponseConfig {
  enableValidation: boolean;
  enableEffectCalculation: boolean;
  enableOutcomeGeneration: boolean;
  enableMultiPlayerCoordination: boolean;
  validateAsync: boolean;
  cacheResults: boolean;
  maxConcurrentEvents: number;
  defaultTimeLimit: number;
  autoResolveConflicts: boolean;
  generateDetailedOutcomes: boolean;
}

export interface EventResponseSession {
  sessionId: string;
  eventId: string;
  gameState: GameState;
  participants: string[];
  sessionType: 'single_player' | 'multi_player' | 'coordinated';
  startTime: number;
  timeLimit?: number;
  status: EventResponseSessionStatus;
  responses: Map<string, PlayerResponseInput>;
  validationResults: Map<string, ValidationResult>;
  calculatedEffects: Map<string, CalculatedEffect[]>;
  appliedEffects: AppliedEffect[];
  outcome?: EventOutcome;
  multiPlayerSessionId?: string;
  metadata: EventResponseSessionMetadata;
}

export type EventResponseSessionStatus = 
  | 'initializing' | 'collecting_responses' | 'validating' 
  | 'calculating_effects' | 'resolving_conflicts' | 'generating_outcome' 
  | 'completed' | 'cancelled' | 'error';

export interface EventResponseSessionMetadata {
  createdBy: string;
  complexity: number;
  estimatedDuration: number;
  actualDuration?: number;
  participantCount: number;
  responseCount: number;
  validationTime: number;
  calculationTime: number;
  outcomeGenerationTime: number;
  errors: EventResponseError[];
  performance: PerformanceMetrics;
}

export interface EventResponseError {
  timestamp: number;
  component: string;
  errorType: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
  recovery?: string;
}

export interface PerformanceMetrics {
  totalProcessingTime: number;
  validationTime: number;
  effectCalculationTime: number;
  outcomeGenerationTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  throughput: number;
}

export interface IntegratedEventResponse {
  sessionId: string;
  event: GameEvent;
  finalResponses: Map<string, PlayerResponseInput>;
  validationResults: Map<string, ValidationResult>;
  calculatedEffects: CalculatedEffect[];
  appliedEffects: AppliedEffect[];
  outcome: EventOutcome;
  gameStateChanges: GameStateChange[];
  participants: ParticipantSummary[];
  metrics: ResponseSessionMetrics;
  recommendations: SystemRecommendation[];
}

export interface GameStateChange {
  type: 'player_update' | 'board_update' | 'market_update' | 'rule_change' | 'event_history';
  target: string;
  changes: StateChangeRecord[];
  timestamp: number;
  reversible: boolean;
}

export interface StateChangeRecord {
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  confidence: number;
}

export interface ParticipantSummary {
  playerId: string;
  responseSubmitted: boolean;
  validationPassed: boolean;
  effectsApplied: number;
  satisfaction: number;
  performance: number;
  lessons: string[];
}

export interface ResponseSessionMetrics {
  totalDuration: number;
  responseRate: number;
  validationSuccessRate: number;
  effectApplicationSuccessRate: number;
  participantSatisfaction: number;
  systemPerformance: number;
  errorRate: number;
}

export interface SystemRecommendation {
  type: 'performance' | 'user_experience' | 'game_balance' | 'system_optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

export class EventResponseSystemIntegrator extends EventEmitter {
  private playerInputSystem: PlayerResponseInputSystem;
  private effectCalculationEngine: EventEffectCalculationEngine;
  private validationProcessor: ResponseValidationProcessor;
  private outcomeGenerator: EventOutcomeGenerationSystem;
  private multiPlayerCoordinator: MultiPlayerResponseCoordinator;

  private activeSessions = new Map<string, EventResponseSession>();
  private completedSessions = new Map<string, IntegratedEventResponse>();
  private config: EventResponseConfig;
  private performanceMonitor: PerformanceMonitor;

  constructor(config: Partial<EventResponseConfig> = {}) {
    super();
    
    this.config = {
      enableValidation: true,
      enableEffectCalculation: true,
      enableOutcomeGeneration: true,
      enableMultiPlayerCoordination: true,
      validateAsync: true,
      cacheResults: true,
      maxConcurrentEvents: 5,
      defaultTimeLimit: 120000,
      autoResolveConflicts: true,
      generateDetailedOutcomes: true,
      ...config
    };

    this.initializeComponents();
    this.performanceMonitor = new PerformanceMonitor();
    this.setupEventListeners();
  }

  /**
   * 初始化所有组件
   */
  private initializeComponents(): void {
    this.playerInputSystem = new PlayerResponseInputSystem();
    this.effectCalculationEngine = new EventEffectCalculationEngine();
    this.validationProcessor = new ResponseValidationProcessor();
    this.outcomeGenerator = new EventOutcomeGenerationSystem();
    this.multiPlayerCoordinator = new MultiPlayerResponseCoordinator();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听玩家输入系统事件
    this.playerInputSystem.on('responseProcessed', (data) => {
      this.handleResponseProcessed(data);
    });

    // 监听多玩家协调事件
    this.multiPlayerCoordinator.on('sessionCompleted', (data) => {
      this.handleMultiPlayerSessionCompleted(data);
    });

    // 监听验证处理器事件
    this.validationProcessor.on('validationCompleted', (data) => {
      this.handleValidationCompleted(data);
    });
  }

  /**
   * 开始事件响应处理
   */
  async startEventResponse(
    event: GameEvent,
    gameState: GameState,
    options: {
      timeLimit?: number;
      forceMultiPlayer?: boolean;
      validationRules?: any[];
      outcomeConfig?: any;
    } = {}
  ): Promise<string> {
    const sessionId = `event_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 确定参与者
    const participants = this.determineParticipants(event, gameState);
    
    // 创建响应会话
    const session = await this.createResponseSession(
      sessionId,
      event,
      gameState,
      participants,
      options
    );

    this.activeSessions.set(sessionId, session);

    // 启动响应收集
    await this.initiateResponseCollection(session);

    this.emit('eventResponseStarted', {
      sessionId,
      eventId: event.id,
      participants: participants.map(p => p.id),
      estimatedDuration: session.metadata.estimatedDuration
    });

    return sessionId;
  }

  /**
   * 创建响应会话
   */
  private async createResponseSession(
    sessionId: string,
    event: GameEvent,
    gameState: GameState,
    participants: Player[],
    options: any
  ): Promise<EventResponseSession> {
    const isMultiPlayer = participants.length > 1 || options.forceMultiPlayer;
    const timeLimit = options.timeLimit || this.config.defaultTimeLimit;

    const session: EventResponseSession = {
      sessionId,
      eventId: event.id,
      gameState: { ...gameState },
      participants: participants.map(p => p.id),
      sessionType: isMultiPlayer ? 'multi_player' : 'single_player',
      startTime: Date.now(),
      timeLimit,
      status: 'initializing',
      responses: new Map(),
      validationResults: new Map(),
      calculatedEffects: new Map(),
      appliedEffects: [],
      metadata: {
        createdBy: 'system',
        complexity: this.calculateEventComplexity(event, participants),
        estimatedDuration: this.estimateProcessingDuration(event, participants),
        participantCount: participants.length,
        responseCount: 0,
        validationTime: 0,
        calculationTime: 0,
        outcomeGenerationTime: 0,
        errors: [],
        performance: {
          totalProcessingTime: 0,
          validationTime: 0,
          effectCalculationTime: 0,
          outcomeGenerationTime: 0,
          memoryUsage: 0,
          cacheHitRate: 0,
          throughput: 0
        }
      }
    };

    return session;
  }

  /**
   * 启动响应收集
   */
  private async initiateResponseCollection(session: EventResponseSession): Promise<void> {
    session.status = 'collecting_responses';

    if (session.sessionType === 'multi_player' && this.config.enableMultiPlayerCoordination) {
      // 创建多玩家协调会话
      const participants = session.participants.map(id => 
        session.gameState.players.find(p => p.id === id)!
      );

      const multiPlayerSessionId = await this.multiPlayerCoordinator.createMultiPlayerSession(
        { id: session.eventId } as GameEvent,
        participants,
        session.gameState,
        {
          timeLimit: session.timeLimit,
          allowCollaboration: true
        }
      );

      session.multiPlayerSessionId = multiPlayerSessionId;
    } else {
      // 单玩家响应处理
      await this.handleSinglePlayerResponse(session);
    }
  }

  /**
   * 处理单玩家响应
   */
  private async handleSinglePlayerResponse(session: EventResponseSession): Promise<void> {
    const playerId = session.participants[0];
    const player = session.gameState.players.find(p => p.id === playerId);
    
    if (!player) {
      this.handleSessionError(session, 'player_not_found', '找不到玩家');
      return;
    }

    const event = await this.getEventById(session.eventId);
    if (!event) {
      this.handleSessionError(session, 'event_not_found', '找不到事件');
      return;
    }

    // 启动单玩家响应输入
    const inputSessionId = this.playerInputSystem.startResponseSession(
      event,
      player,
      session.gameState,
      session.timeLimit
    );

    // 等待响应或超时
    this.waitForSinglePlayerResponse(session, inputSessionId);
  }

  /**
   * 等待单玩家响应
   */
  private waitForSinglePlayerResponse(session: EventResponseSession, inputSessionId: string): void {
    const checkResponse = () => {
      const inputSessions = this.playerInputSystem.getActiveSessionInfo();
      const activeSession = inputSessions.find(s => s.sessionId === inputSessionId);
      
      if (!activeSession) {
        // 响应已完成，处理结果
        this.processSinglePlayerResponse(session);
      } else if (session.timeLimit && Date.now() - session.startTime > session.timeLimit) {
        // 超时处理
        this.handleResponseTimeout(session);
      } else {
        // 继续等待
        setTimeout(checkResponse, 1000);
      }
    };

    setTimeout(checkResponse, 1000);
  }

  /**
   * 处理单玩家响应完成
   */
  private async processSinglePlayerResponse(session: EventResponseSession): Promise<void> {
    // 这里应该从playerInputSystem获取响应结果
    // 简化实现：模拟响应处理
    await this.processAllResponses(session);
  }

  /**
   * 处理所有响应
   */
  private async processAllResponses(session: EventResponseSession): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 验证响应
      if (this.config.enableValidation) {
        session.status = 'validating';
        await this.validateAllResponses(session);
      }

      // 计算效果
      if (this.config.enableEffectCalculation) {
        session.status = 'calculating_effects';
        await this.calculateAllEffects(session);
      }

      // 生成结果
      if (this.config.enableOutcomeGeneration) {
        session.status = 'generating_outcome';
        await this.generateEventOutcome(session);
      }

      // 应用游戏状态变更
      await this.applyGameStateChanges(session);

      // 完成会话
      await this.completeSession(session);

      session.metadata.performance.totalProcessingTime = Date.now() - startTime;

    } catch (error) {
      this.handleSessionError(session, 'processing_error', error.message);
    }
  }

  /**
   * 验证所有响应
   */
  private async validateAllResponses(session: EventResponseSession): Promise<void> {
    const validationStartTime = Date.now();

    for (const [playerId, response] of session.responses) {
      const player = session.gameState.players.find(p => p.id === playerId);
      const event = await this.getEventById(session.eventId);
      
      if (player && event) {
        const validationResult = await this.validationProcessor.validateResponse(
          response,
          event,
          player,
          session.gameState,
          [] // 应该传入实际的验证规则
        );

        session.validationResults.set(playerId, validationResult);
      }
    }

    session.metadata.validationTime = Date.now() - validationStartTime;
  }

  /**
   * 计算所有效果
   */
  private async calculateAllEffects(session: EventResponseSession): Promise<void> {
    const calculationStartTime = Date.now();

    for (const [playerId, response] of session.responses) {
      const player = session.gameState.players.find(p => p.id === playerId);
      const event = await this.getEventById(session.eventId);

      if (player && event) {
        const context: EffectCalculationContext = {
          event,
          player,
          gameState: session.gameState,
          environmentalFactors: {
            season: session.gameState.season,
            weather: session.gameState.weather,
            timeOfDay: 'afternoon',
            gamePhase: session.gameState.phase,
            marketConditions: session.gameState.marketTrends,
            socialAtmosphere: {
              cooperationLevel: 0.7,
              competitionIntensity: 0.5,
              trustLevel: 0.6,
              conflictLevel: 0.3,
              groupMorale: 0.8
            }
          },
          previousEffects: session.appliedEffects
        };

        const calculatedEffects = await this.effectCalculationEngine.calculateEventEffects(
          event,
          context
        );

        session.calculatedEffects.set(playerId, calculatedEffects);

        // 应用效果
        const appliedEffects = await this.effectCalculationEngine.applyCalculatedEffects(
          calculatedEffects,
          context
        );

        session.appliedEffects.push(...appliedEffects);
      }
    }

    session.metadata.calculationTime = Date.now() - calculationStartTime;
  }

  /**
   * 生成事件结果
   */
  private async generateEventOutcome(session: EventResponseSession): Promise<void> {
    const outcomeStartTime = Date.now();

    const event = await this.getEventById(session.eventId);
    if (!event) return;

    // 构建参与者响应映射
    const participantResponses = new Map();
    for (const [playerId, response] of session.responses) {
      const validationResult = session.validationResults.get(playerId);
      const effects = session.appliedEffects.filter(e => e.playerId === playerId);
      
      participantResponses.set(playerId, {
        processedInput: response,
        validationResult,
        effects,
        success: validationResult?.isValid || false
      });
    }

    const outcome = await this.outcomeGenerator.generateEventOutcome(
      event,
      participantResponses,
      session.appliedEffects,
      session.gameState
    );

    session.outcome = outcome;
    session.metadata.outcomeGenerationTime = Date.now() - outcomeStartTime;
  }

  /**
   * 应用游戏状态变更
   */
  private async applyGameStateChanges(session: EventResponseSession): Promise<void> {
    const gameStateChanges: GameStateChange[] = [];

    // 应用玩家变更
    for (const effect of session.appliedEffects) {
      const change = this.convertEffectToStateChange(effect);
      if (change) {
        gameStateChanges.push(change);
        this.applyStateChange(session.gameState, change);
      }
    }

    // 更新事件历史
    if (session.outcome) {
      const event = await this.getEventById(session.eventId);
      if (event) {
        session.gameState.eventHistory.push(event);
        
        gameStateChanges.push({
          type: 'event_history',
          target: 'game',
          changes: [{
            field: 'eventHistory',
            oldValue: session.gameState.eventHistory.length - 1,
            newValue: session.gameState.eventHistory.length,
            reason: 'Event completed',
            confidence: 1.0
          }],
          timestamp: Date.now(),
          reversible: false
        });
      }
    }

    session.metadata.performance.totalProcessingTime = Date.now() - session.startTime;
  }

  /**
   * 完成会话
   */
  private async completeSession(session: EventResponseSession): Promise<void> {
    session.status = 'completed';
    session.metadata.actualDuration = Date.now() - session.startTime;

    // 生成集成响应结果
    const integratedResponse = await this.generateIntegratedResponse(session);
    
    // 缓存结果
    this.completedSessions.set(session.sessionId, integratedResponse);
    
    // 清理活跃会话
    this.activeSessions.delete(session.sessionId);

    // 性能监控
    this.performanceMonitor.recordSession(session);

    this.emit('eventResponseCompleted', {
      sessionId: session.sessionId,
      result: integratedResponse,
      duration: session.metadata.actualDuration
    });
  }

  /**
   * 生成集成响应结果
   */
  private async generateIntegratedResponse(session: EventResponseSession): Promise<IntegratedEventResponse> {
    const event = await this.getEventById(session.eventId);
    
    // 生成参与者摘要
    const participants: ParticipantSummary[] = [];
    for (const playerId of session.participants) {
      const response = session.responses.get(playerId);
      const validation = session.validationResults.get(playerId);
      const playerEffects = session.appliedEffects.filter(e => e.playerId === playerId);

      participants.push({
        playerId,
        responseSubmitted: !!response,
        validationPassed: validation?.isValid || false,
        effectsApplied: playerEffects.length,
        satisfaction: this.calculateParticipantSatisfaction(session, playerId),
        performance: this.calculateParticipantPerformance(session, playerId),
        lessons: this.generateParticipantLessons(session, playerId)
      });
    }

    // 计算会话指标
    const metrics: ResponseSessionMetrics = {
      totalDuration: session.metadata.actualDuration || 0,
      responseRate: session.responses.size / session.participants.length,
      validationSuccessRate: Array.from(session.validationResults.values())
        .filter(v => v.isValid).length / session.validationResults.size,
      effectApplicationSuccessRate: session.appliedEffects.filter(e => e.status === 'active').length / 
        session.appliedEffects.length,
      participantSatisfaction: participants.reduce((sum, p) => sum + p.satisfaction, 0) / participants.length,
      systemPerformance: this.calculateSystemPerformance(session),
      errorRate: session.metadata.errors.length / Math.max(1, session.metadata.responseCount)
    };

    // 生成系统建议
    const recommendations = await this.generateSystemRecommendations(session, metrics);

    return {
      sessionId: session.sessionId,
      event: event!,
      finalResponses: session.responses,
      validationResults: session.validationResults,
      calculatedEffects: Array.from(session.calculatedEffects.values()).flat(),
      appliedEffects: session.appliedEffects,
      outcome: session.outcome!,
      gameStateChanges: [], // 应该从实际应用的变更中获取
      participants,
      metrics,
      recommendations
    };
  }

  // 事件处理方法

  /**
   * 处理响应已处理事件
   */
  private handleResponseProcessed(data: any): void {
    // 查找相关会话并更新
    for (const [sessionId, session] of this.activeSessions) {
      if (session.participants.includes(data.input.playerId)) {
        session.responses.set(data.input.playerId, data.input);
        session.metadata.responseCount++;
        
        // 检查是否所有响应都已收集
        if (session.responses.size === session.participants.length) {
          this.processAllResponses(session);
        }
        break;
      }
    }
  }

  /**
   * 处理多玩家会话完成
   */
  private handleMultiPlayerSessionCompleted(data: any): void {
    // 查找相关会话
    for (const [sessionId, session] of this.activeSessions) {
      if (session.multiPlayerSessionId === data.sessionId) {
        // 提取最终响应
        for (const [playerId, response] of data.result.finalResponses) {
          session.responses.set(playerId, response);
        }
        
        // 继续处理
        this.processAllResponses(session);
        break;
      }
    }
  }

  /**
   * 处理验证完成
   */
  private handleValidationCompleted(data: any): void {
    // 记录验证结果
    console.log('Validation completed:', data);
  }

  /**
   * 处理会话错误
   */
  private handleSessionError(session: EventResponseSession, errorType: string, message: string): void {
    const error: EventResponseError = {
      timestamp: Date.now(),
      component: 'integrator',
      errorType,
      message,
      severity: 'high',
      handled: false
    };

    session.metadata.errors.push(error);
    session.status = 'error';

    this.emit('eventResponseError', {
      sessionId: session.sessionId,
      error
    });
  }

  /**
   * 处理响应超时
   */
  private handleResponseTimeout(session: EventResponseSession): void {
    session.status = 'cancelled';
    
    this.emit('eventResponseTimeout', {
      sessionId: session.sessionId,
      timeLimit: session.timeLimit
    });
  }

  // 辅助方法

  private determineParticipants(event: GameEvent, gameState: GameState): Player[] {
    // 基于事件类型确定参与者
    if (event.playerId) {
      const player = gameState.players.find(p => p.id === event.playerId);
      return player ? [player] : [];
    }
    
    // 默认返回所有玩家
    return gameState.players;
  }

  private calculateEventComplexity(event: GameEvent, participants: Player[]): number {
    let complexity = 1;
    
    complexity += participants.length * 0.5;
    if (event.choices && event.choices.length > 3) complexity += 1;
    if (event.zodiacRelated) complexity += 0.5;
    
    return complexity;
  }

  private estimateProcessingDuration(event: GameEvent, participants: Player[]): number {
    const baseTime = 30000; // 30秒基础时间
    const participantTime = participants.length * 10000; // 每个参与者10秒
    const complexityTime = this.calculateEventComplexity(event, participants) * 5000;
    
    return baseTime + participantTime + complexityTime;
  }

  private async getEventById(eventId: string): Promise<GameEvent | null> {
    // 这里应该从事件存储中获取事件
    // 简化实现：返回模拟事件
    return {
      id: eventId,
      type: 'chance_card',
      title: '测试事件',
      description: '这是一个测试事件',
      triggeredBy: 'land_on_cell',
      rarity: 'common',
      tags: [],
      timestamp: Date.now()
    };
  }

  private convertEffectToStateChange(effect: AppliedEffect): GameStateChange | null {
    // 将应用的效果转换为游戏状态变更
    if (effect.effect.originalEffect.type === 'money') {
      return {
        type: 'player_update',
        target: effect.playerId,
        changes: [{
          field: 'money',
          oldValue: 0, // 应该从实际状态获取
          newValue: effect.effect.finalValue,
          reason: 'Event effect applied',
          confidence: effect.effect.confidence
        }],
        timestamp: Date.now(),
        reversible: effect.effect.metadata.reversibility
      };
    }
    
    return null;
  }

  private applyStateChange(gameState: GameState, change: GameStateChange): void {
    // 应用状态变更到游戏状态
    if (change.type === 'player_update') {
      const player = gameState.players.find(p => p.id === change.target);
      if (player) {
        for (const stateChange of change.changes) {
          if (stateChange.field === 'money') {
            player.money += stateChange.newValue;
          }
        }
      }
    }
  }

  private calculateParticipantSatisfaction(session: EventResponseSession, playerId: string): number {
    // 计算参与者满意度
    const validation = session.validationResults.get(playerId);
    const response = session.responses.get(playerId);
    
    let satisfaction = 0.5; // 基础满意度
    
    if (validation?.isValid) satisfaction += 0.3;
    if (response) satisfaction += 0.2;
    
    return Math.min(1, satisfaction);
  }

  private calculateParticipantPerformance(session: EventResponseSession, playerId: string): number {
    // 计算参与者表现
    const response = session.responses.get(playerId);
    if (!response) return 0;
    
    const responseTime = response.metadata.responseTime;
    const maxTime = session.timeLimit || this.config.defaultTimeLimit;
    
    return Math.max(0, 1 - (responseTime / maxTime));
  }

  private generateParticipantLessons(session: EventResponseSession, playerId: string): string[] {
    const lessons: string[] = [];
    
    const validation = session.validationResults.get(playerId);
    if (validation && !validation.isValid) {
      lessons.push('注意验证响应的有效性');
    }
    
    const response = session.responses.get(playerId);
    if (response && response.metadata.responseTime > 60000) {
      lessons.push('尝试更快地做出决策');
    }
    
    return lessons;
  }

  private calculateSystemPerformance(session: EventResponseSession): number {
    const targetDuration = session.metadata.estimatedDuration;
    const actualDuration = session.metadata.actualDuration || 0;
    
    if (actualDuration === 0) return 0;
    
    return Math.max(0, 1 - Math.abs(actualDuration - targetDuration) / targetDuration);
  }

  private async generateSystemRecommendations(
    session: EventResponseSession, 
    metrics: ResponseSessionMetrics
  ): Promise<SystemRecommendation[]> {
    const recommendations: SystemRecommendation[] = [];
    
    if (metrics.responseRate < 0.8) {
      recommendations.push({
        type: 'user_experience',
        priority: 'high',
        title: '提高响应率',
        description: '响应率较低，需要改进用户体验',
        actionItems: ['优化界面设计', '增加提醒功能', '简化操作流程'],
        expectedImpact: '提高玩家参与度',
        implementationEffort: 'medium'
      });
    }
    
    if (metrics.systemPerformance < 0.7) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: '优化系统性能',
        description: '系统处理性能需要优化',
        actionItems: ['优化算法', '增加缓存', '并行处理'],
        expectedImpact: '减少处理时间',
        implementationEffort: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * 获取活跃会话
   */
  getActiveSession(sessionId: string): EventResponseSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * 获取已完成的响应
   */
  getCompletedResponse(sessionId: string): IntegratedEventResponse | undefined {
    return this.completedSessions.get(sessionId);
  }

  /**
   * 获取系统统计信息
   */
  getSystemStatistics(): any {
    return {
      activeSessions: this.activeSessions.size,
      completedSessions: this.completedSessions.size,
      averageProcessingTime: this.performanceMonitor.getAverageProcessingTime(),
      successRate: this.performanceMonitor.getSuccessRate(),
      systemLoad: this.performanceMonitor.getCurrentLoad(),
      config: this.config
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<EventResponseConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { newConfig: this.config });
  }

  /**
   * 强制取消会话
   */
  cancelSession(sessionId: string, reason: string = 'Manual cancellation'): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.status = 'cancelled';
    this.handleSessionError(session, 'cancelled', reason);
    this.activeSessions.delete(sessionId);

    this.emit('sessionCancelled', { sessionId, reason });
    return true;
  }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  private sessionMetrics: Array<{ duration: number; success: boolean; timestamp: number }> = [];
  
  recordSession(session: EventResponseSession): void {
    this.sessionMetrics.push({
      duration: session.metadata.actualDuration || 0,
      success: session.status === 'completed',
      timestamp: Date.now()
    });
    
    // 限制记录大小
    if (this.sessionMetrics.length > 1000) {
      this.sessionMetrics = this.sessionMetrics.slice(-500);
    }
  }
  
  getAverageProcessingTime(): number {
    if (this.sessionMetrics.length === 0) return 0;
    return this.sessionMetrics.reduce((sum, m) => sum + m.duration, 0) / this.sessionMetrics.length;
  }
  
  getSuccessRate(): number {
    if (this.sessionMetrics.length === 0) return 0;
    const successCount = this.sessionMetrics.filter(m => m.success).length;
    return successCount / this.sessionMetrics.length;
  }
  
  getCurrentLoad(): number {
    // 简化的负载计算
    const recentSessions = this.sessionMetrics.filter(
      m => Date.now() - m.timestamp < 60000 // 最近1分钟
    );
    return Math.min(1, recentSessions.length / 10);
  }
}