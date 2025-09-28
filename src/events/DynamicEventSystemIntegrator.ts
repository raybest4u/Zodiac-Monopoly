/**
 * 动态事件系统集成器
 * Dynamic Event System Integrator
 * 
 * 统一管理和协调所有动态事件系统组件，提供与游戏核心的接口
 * Unified management and coordination of all dynamic event system components, providing interface with game core
 */

import { GameEvent, EventType, EventPriority, ZodiacSign, GameState, Player } from '../types/GameTypes';
import { GameStateAnalyzer } from './GameStateAnalyzer';
import { EventTriggerSystem } from './EventTriggerSystem';
import { DynamicEventEngine } from './DynamicEventEngine';
import { EventChainManager } from './EventChainManager';
import { AdaptiveDifficultySystem } from './AdaptiveDifficultySystem';
import { LLMEventIntegration } from './LLMEventIntegration';

export interface DynamicEventSystemConfig {
  enableLLMGeneration: boolean;
  enableAdaptiveDifficulty: boolean;
  enableEventChains: boolean;
  enableRealtimeAnalysis: boolean;
  maxConcurrentEvents: number;
  globalCooldownMs: number;
  priorityWeights: Record<EventPriority, number>;
  performanceThresholds: {
    maxProcessingTimeMs: number;
    maxMemoryUsageMB: number;
    maxConcurrentChains: number;
  };
}

export interface EventSystemStatus {
  isActive: boolean;
  lastUpdate: Date;
  processedEvents: number;
  activeChains: number;
  avgProcessingTime: number;
  memoryUsage: number;
  errors: EventSystemError[];
}

export interface EventSystemError {
  timestamp: Date;
  component: string;
  errorType: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface IntegratedEventGeneration {
  event: GameEvent;
  source: 'analytical' | 'llm' | 'hybrid' | 'chain';
  difficultyAdjustments: any;
  chainContext?: string;
  processingTime: number;
  confidence: number;
}

export class DynamicEventSystemIntegrator {
  private gameStateAnalyzer: GameStateAnalyzer;
  private eventTriggerSystem: EventTriggerSystem;
  private dynamicEventEngine: DynamicEventEngine;
  private eventChainManager: EventChainManager;
  private adaptiveDifficultySystem: AdaptiveDifficultySystem;
  private llmEventIntegration: LLMEventIntegration;

  private config: DynamicEventSystemConfig;
  private status: EventSystemStatus;
  private isInitialized: boolean = false;
  private eventQueue: GameEvent[] = [];
  private processingLock: boolean = false;

  constructor(config: Partial<DynamicEventSystemConfig> = {}) {
    this.config = {
      enableLLMGeneration: true,
      enableAdaptiveDifficulty: true,
      enableEventChains: true,
      enableRealtimeAnalysis: true,
      maxConcurrentEvents: 5,
      globalCooldownMs: 10000,
      priorityWeights: {
        critical: 10,
        high: 5,
        normal: 1,
        low: 0.5
      },
      performanceThresholds: {
        maxProcessingTimeMs: 5000,
        maxMemoryUsageMB: 100,
        maxConcurrentChains: 3
      },
      ...config
    };

    this.status = {
      isActive: false,
      lastUpdate: new Date(),
      processedEvents: 0,
      activeChains: 0,
      avgProcessingTime: 0,
      memoryUsage: 0,
      errors: []
    };

    this.initializeComponents();
  }

  /**
   * 初始化所有组件
   */
  private async initializeComponents(): Promise<void> {
    try {
      // 初始化基础组件
      this.gameStateAnalyzer = new GameStateAnalyzer();
      this.eventTriggerSystem = new EventTriggerSystem();
      
      // 初始化高级组件
      this.dynamicEventEngine = new DynamicEventEngine(
        this.gameStateAnalyzer,
        this.eventTriggerSystem
      );

      if (this.config.enableEventChains) {
        this.eventChainManager = new EventChainManager(this.gameStateAnalyzer);
        this.eventChainManager.setEventEngine(this.dynamicEventEngine);
      }

      if (this.config.enableAdaptiveDifficulty) {
        this.adaptiveDifficultySystem = new AdaptiveDifficultySystem(this.gameStateAnalyzer);
      }

      if (this.config.enableLLMGeneration) {
        this.llmEventIntegration = new LLMEventIntegration();
        this.dynamicEventEngine.setLLMIntegration(this.llmEventIntegration);
      }

      this.isInitialized = true;
      this.status.isActive = true;

      console.log('Dynamic Event System initialized successfully');
    } catch (error) {
      this.logError('initialization', 'critical', `Failed to initialize system: ${error.message}`);
      throw error;
    }
  }

  /**
   * 启动动态事件系统
   */
  async start(gameState: GameState): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeComponents();
    }

    this.status.isActive = true;
    this.status.lastUpdate = new Date();

    // 初始化玩家档案
    if (this.config.enableAdaptiveDifficulty) {
      for (const player of gameState.players) {
        this.adaptiveDifficultySystem.initializePlayerProfile(player);
      }
    }

    // 开始实时分析
    if (this.config.enableRealtimeAnalysis) {
      this.startRealtimeAnalysis(gameState);
    }

    console.log('Dynamic Event System started');
  }

  /**
   * 停止动态事件系统
   */
  async stop(): Promise<void> {
    this.status.isActive = false;
    
    // 停止所有活跃的事件链
    if (this.config.enableEventChains) {
      const activeChains = this.eventChainManager.getActiveChains();
      for (const chain of activeChains) {
        this.eventChainManager.stopEventChain(chain.chainId);
      }
    }

    console.log('Dynamic Event System stopped');
  }

  /**
   * 处理游戏状态更新
   */
  async processGameStateUpdate(gameState: GameState): Promise<void> {
    if (!this.status.isActive || this.processingLock) {
      return;
    }

    this.processingLock = true;
    const startTime = Date.now();

    try {
      // 更新游戏状态分析
      await this.gameStateAnalyzer.analyzeGameState(gameState);

      // 更新群体动态
      if (this.config.enableAdaptiveDifficulty) {
        await this.adaptiveDifficultySystem.updateGroupDynamics(gameState);
      }

      // 检查事件触发条件
      const triggeredEvents = await this.eventTriggerSystem.checkTriggers(gameState);

      // 处理触发的事件
      for (const trigger of triggeredEvents) {
        await this.processTriggeredEvent(trigger, gameState);
      }

      // 更新系统状态
      const processingTime = Date.now() - startTime;
      this.updateSystemStatus(processingTime);

    } catch (error) {
      this.logError('processing', 'high', `Game state update failed: ${error.message}`);
    } finally {
      this.processingLock = false;
    }
  }

  /**
   * 处理触发的事件
   */
  private async processTriggeredEvent(
    trigger: any,
    gameState: GameState
  ): Promise<void> {
    try {
      // 生成集成事件
      const integratedEvent = await this.generateIntegratedEvent(trigger, gameState);

      // 应用自适应难度调整
      if (this.config.enableAdaptiveDifficulty && integratedEvent.event.playerIds.length > 0) {
        const adaptiveGeneration = await this.adaptiveDifficultySystem.generateAdaptiveEvent(
          integratedEvent.event,
          integratedEvent.event.playerIds,
          gameState
        );
        
        integratedEvent.difficultyAdjustments = adaptiveGeneration;
      }

      // 检查是否应该创建事件链
      if (this.config.enableEventChains) {
        await this.evaluateEventChainCreation(integratedEvent.event, gameState);
      }

      // 将事件添加到队列
      this.eventQueue.push(integratedEvent.event);

      // 处理事件队列
      await this.processEventQueue(gameState);

    } catch (error) {
      this.logError('event-processing', 'medium', `Failed to process triggered event: ${error.message}`);
    }
  }

  /**
   * 生成集成事件
   */
  private async generateIntegratedEvent(
    trigger: any,
    gameState: GameState
  ): Promise<IntegratedEventGeneration> {
    const startTime = Date.now();

    let event: GameEvent;
    let source: 'analytical' | 'llm' | 'hybrid' | 'chain';
    let confidence: number = 0.8;

    // 决定生成方法
    const generateWithLLM = this.config.enableLLMGeneration && 
                           this.shouldUseLLMGeneration(trigger, gameState);

    if (generateWithLLM) {
      // 使用LLM生成
      try {
        event = await this.dynamicEventEngine.generateEventWithLLM(
          trigger.eventType,
          gameState,
          { useIntelligentContent: true }
        );
        source = 'llm';
        confidence = 0.9;
      } catch (error) {
        // 回退到分析生成
        event = await this.dynamicEventEngine.generateAnalyticalEvent(
          trigger.eventType,
          gameState
        );
        source = 'analytical';
        confidence = 0.7;
      }
    } else {
      // 使用分析生成
      event = await this.dynamicEventEngine.generateAnalyticalEvent(
        trigger.eventType,
        gameState
      );
      source = 'analytical';
    }

    const processingTime = Date.now() - startTime;

    return {
      event,
      source,
      difficultyAdjustments: null,
      processingTime,
      confidence
    };
  }

  /**
   * 判断是否应该使用LLM生成
   */
  private shouldUseLLMGeneration(trigger: any, gameState: GameState): boolean {
    // 基于复杂度、玩家数量、事件类型等因素决定
    const complexity = this.calculateEventComplexity(trigger, gameState);
    const playerCount = gameState.players.length;
    
    // 复杂事件或多玩家场景倾向于使用LLM
    return complexity > 0.6 || playerCount > 2;
  }

  /**
   * 计算事件复杂度
   */
  private calculateEventComplexity(trigger: any, gameState: GameState): number {
    let complexity = 0.5; // 基础复杂度

    // 基于游戏状态复杂度调整
    const stateComplexity = this.analyzeGameStateComplexity(gameState);
    complexity += stateComplexity * 0.3;

    // 基于触发条件复杂度调整
    if (trigger.conditions && trigger.conditions.length > 2) {
      complexity += 0.2;
    }

    return Math.min(1.0, complexity);
  }

  /**
   * 分析游戏状态复杂度
   */
  private analyzeGameStateComplexity(gameState: GameState): number {
    let complexity = 0;

    // 基于玩家数量
    complexity += Math.min(0.5, gameState.players.length * 0.1);

    // 基于回合数（游戏进度）
    if (gameState.currentRound) {
      complexity += Math.min(0.3, gameState.currentRound * 0.01);
    }

    // 基于活跃事件数量
    complexity += Math.min(0.2, this.eventQueue.length * 0.05);

    return Math.min(1.0, complexity);
  }

  /**
   * 评估事件链创建
   */
  private async evaluateEventChainCreation(
    event: GameEvent,
    gameState: GameState
  ): Promise<void> {
    // 检查是否应该创建新的事件链
    const shouldCreateChain = this.shouldCreateEventChain(event, gameState);

    if (shouldCreateChain) {
      await this.createEventChain(event, gameState);
    }
  }

  /**
   * 判断是否应该创建事件链
   */
  private shouldCreateEventChain(event: GameEvent, gameState: GameState): boolean {
    // 基于事件类型、重要性、玩家参与度等因素
    const isHighImpact = event.priority === 'critical' || event.priority === 'high';
    const isMultiPlayer = event.playerIds.length > 1;
    const activeChainCount = this.status.activeChains;

    return isHighImpact && 
           isMultiPlayer && 
           activeChainCount < this.config.performanceThresholds.maxConcurrentChains;
  }

  /**
   * 创建事件链
   */
  private async createEventChain(event: GameEvent, gameState: GameState): Promise<void> {
    try {
      const followUpEvents = await this.generateFollowUpEvents(event, gameState);
      
      const chain = this.eventChainManager.createEventChain(
        `Chain_${event.type}_${Date.now()}`,
        `Event chain triggered by ${event.title}`,
        [event, ...followUpEvents],
        {
          priority: event.priority,
          category: event.category,
          zodiacThemes: event.zodiacElements
        }
      );

      await this.eventChainManager.startEventChain(chain.id, gameState);
      this.status.activeChains++;

    } catch (error) {
      this.logError('chain-creation', 'medium', `Failed to create event chain: ${error.message}`);
    }
  }

  /**
   * 生成后续事件
   */
  private async generateFollowUpEvents(
    triggerEvent: GameEvent,
    gameState: GameState
  ): Promise<GameEvent[]> {
    const followUpEvents: GameEvent[] = [];

    // 基于触发事件类型生成相关后续事件
    switch (triggerEvent.type) {
      case 'economic':
        // 经济事件可能引发社会反应
        const socialEvent = await this.dynamicEventEngine.generateAnalyticalEvent(
          'social',
          gameState
        );
        followUpEvents.push(socialEvent);
        break;

      case 'social':
        // 社会事件可能引发文化变迁
        const culturalEvent = await this.dynamicEventEngine.generateAnalyticalEvent(
          'cultural',
          gameState
        );
        followUpEvents.push(culturalEvent);
        break;

      case 'cultural':
        // 文化事件可能创造挑战机会
        const challengeEvent = await this.dynamicEventEngine.generateAnalyticalEvent(
          'challenge',
          gameState
        );
        followUpEvents.push(challengeEvent);
        break;
    }

    return followUpEvents;
  }

  /**
   * 处理事件队列
   */
  private async processEventQueue(gameState: GameState): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    // 按优先级排序
    this.eventQueue.sort((a, b) => {
      const weightA = this.config.priorityWeights[a.priority] || 1;
      const weightB = this.config.priorityWeights[b.priority] || 1;
      return weightB - weightA;
    });

    // 处理高优先级事件
    const eventsToProcess = this.eventQueue.splice(0, this.config.maxConcurrentEvents);
    
    for (const event of eventsToProcess) {
      await this.executeEvent(event, gameState);
    }
  }

  /**
   * 执行事件
   */
  private async executeEvent(event: GameEvent, gameState: GameState): Promise<void> {
    try {
      // 记录事件执行
      this.status.processedEvents++;

      // 如果启用了自适应难度，记录玩家表现
      if (this.config.enableAdaptiveDifficulty) {
        // 这里应该在事件完成后调用，现在作为示例
        setTimeout(() => {
          for (const playerId of event.playerIds) {
            this.adaptiveDifficultySystem.analyzePerformance(
              playerId,
              event.id,
              event.type,
              'success', // 这应该基于实际结果
              gameState,
              {
                responseTime: 30000,
                resourcesUsed: 0.5,
                collaborationScore: 0.8
              }
            );
          }
        }, 1000);
      }

      console.log(`Event executed: ${event.title}`);

    } catch (error) {
      this.logError('event-execution', 'medium', `Failed to execute event ${event.id}: ${error.message}`);
    }
  }

  /**
   * 开始实时分析
   */
  private startRealtimeAnalysis(gameState: GameState): void {
    // 定期更新分析（简化实现）
    setInterval(async () => {
      if (this.status.isActive) {
        await this.processGameStateUpdate(gameState);
      }
    }, this.config.globalCooldownMs);
  }

  /**
   * 更新系统状态
   */
  private updateSystemStatus(processingTime: number): void {
    this.status.lastUpdate = new Date();
    
    // 更新平均处理时间
    if (this.status.avgProcessingTime === 0) {
      this.status.avgProcessingTime = processingTime;
    } else {
      this.status.avgProcessingTime = (this.status.avgProcessingTime * 0.9) + (processingTime * 0.1);
    }

    // 更新活跃链数量
    if (this.config.enableEventChains) {
      this.status.activeChains = this.eventChainManager.getActiveChains().length;
    }

    // 估算内存使用（简化）
    this.status.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    // 检查性能阈值
    this.checkPerformanceThresholds();
  }

  /**
   * 检查性能阈值
   */
  private checkPerformanceThresholds(): void {
    const thresholds = this.config.performanceThresholds;

    if (this.status.avgProcessingTime > thresholds.maxProcessingTimeMs) {
      this.logError('performance', 'medium', 
        `Processing time ${this.status.avgProcessingTime}ms exceeds threshold ${thresholds.maxProcessingTimeMs}ms`);
    }

    if (this.status.memoryUsage > thresholds.maxMemoryUsageMB) {
      this.logError('performance', 'high', 
        `Memory usage ${this.status.memoryUsage}MB exceeds threshold ${thresholds.maxMemoryUsageMB}MB`);
    }

    if (this.status.activeChains > thresholds.maxConcurrentChains) {
      this.logError('performance', 'medium', 
        `Active chains ${this.status.activeChains} exceeds threshold ${thresholds.maxConcurrentChains}`);
    }
  }

  /**
   * 记录错误
   */
  private logError(component: string, severity: 'low' | 'medium' | 'high' | 'critical', message: string): void {
    const error: EventSystemError = {
      timestamp: new Date(),
      component,
      errorType: severity,
      message,
      severity
    };

    this.status.errors.push(error);

    // 限制错误日志大小
    if (this.status.errors.length > 100) {
      this.status.errors = this.status.errors.slice(-50);
    }

    console.error(`[${severity.toUpperCase()}] ${component}: ${message}`);
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): EventSystemStatus {
    return { ...this.status };
  }

  /**
   * 获取系统统计信息
   */
  getSystemStatistics(): any {
    const stats: any = {
      integrator: this.getSystemStatus(),
      eventQueue: this.eventQueue.length,
      config: this.config
    };

    if (this.config.enableAdaptiveDifficulty) {
      stats.adaptiveDifficulty = this.adaptiveDifficultySystem.getSystemStatistics();
    }

    if (this.config.enableEventChains) {
      stats.eventChains = this.eventChainManager.getChainStatistics();
    }

    if (this.gameStateAnalyzer) {
      stats.stateAnalyzer = {
        lastAnalysis: this.gameStateAnalyzer.getLastAnalysisTime(),
        cacheSize: this.gameStateAnalyzer.getCacheSize?.() || 0
      };
    }

    return stats;
  }

  /**
   * 手动触发事件
   */
  async triggerManualEvent(
    eventType: EventType,
    targetPlayers: string[],
    gameState: GameState,
    options: any = {}
  ): Promise<GameEvent> {
    const event = await this.dynamicEventEngine.generateAnalyticalEvent(eventType, gameState);
    event.playerIds = targetPlayers;

    // 应用选项
    if (options.priority) {
      event.priority = options.priority;
    }

    // 添加到队列
    this.eventQueue.push(event);
    await this.processEventQueue(gameState);

    return event;
  }

  /**
   * 配置更新
   */
  updateConfig(newConfig: Partial<DynamicEventSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Dynamic Event System configuration updated');
  }
}