import type { GameState, Player, ZodiacSign } from '../types/game';
import { GameEngine } from '../engine/GameEngine';
import { GameRuleSystem } from '../rules/GameRuleSystem';
import { TradingAndMortgageManager } from '../trading/TradingAndMortgageManager';
import { UnifiedSpecialSystemManager } from '../special/UnifiedSpecialSystemManager';
import { BalanceDashboard } from '../balance/BalanceDashboard';
import { AIManager } from '../ai/AIManager';
import { EventSystem } from '../events/EventSystem';
import { InteractionFeedbackSystem } from '../feedback/InteractionFeedbackSystem';
import { StateSyncManager } from '../sync/StateSyncManager';

/**
 * 统一游戏系统 - 集成所有游戏组件的中央管理器
 * 
 * 功能范围：
 * 1. 核心游戏引擎管理
 * 2. 规则系统集成
 * 3. 交易和抵押系统
 * 4. 特殊机制系统（监狱、彩票等）
 * 5. 平衡和调优系统
 * 6. AI系统
 * 7. 事件系统
 * 8. 反馈系统
 * 9. 状态同步系统
 */

export interface UnifiedSystemConfig {
  // 核心配置
  gameEngine: {
    maxPlayers: number;
    startMoney: number;
    passingGoBonus: number;
    maxRounds: number;
  };
  
  // 规则配置
  rules: {
    enableZodiacRules: boolean;
    enableSeasonalRules: boolean;
    strictValidation: boolean;
    customRules: string[];
  };
  
  // 交易配置
  trading: {
    enableTrading: boolean;
    enableMortgage: boolean;
    tradingTaxRate: number;
    mortgageInterestRate: number;
  };
  
  // 特殊系统配置
  specialSystems: {
    enablePrison: boolean;
    enableLottery: boolean;
    enableInsurance: boolean;
    enableBanking: boolean;
    enableTeleportation: boolean;
  };
  
  // 平衡配置
  balance: {
    enableAutoBalance: boolean;
    balanceCheckInterval: number;
    optimizationThreshold: number;
  };
  
  // AI配置
  ai: {
    aiPlayerCount: number;
    difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert';
    enablePersonality: boolean;
    enableLLM: boolean;
  };
  
  // 事件配置
  events: {
    enableRandomEvents: boolean;
    eventFrequency: number;
    customEvents: boolean;
  };
  
  // 反馈配置
  feedback: {
    enableVisualFeedback: boolean;
    enableAudioFeedback: boolean;
    enableHapticFeedback: boolean;
  };
}

export interface SystemStatus {
  gameEngine: {
    isRunning: boolean;
    currentPhase: string;
    currentRound: number;
    activePlayers: number;
  };
  
  subsystems: {
    rules: boolean;
    trading: boolean;
    special: boolean;
    balance: boolean;
    ai: boolean;
    events: boolean;
    feedback: boolean;
    sync: boolean;
  };
  
  performance: {
    fps: number;
    memoryUsage: number;
    responseTime: number;
    errorCount: number;
  };
  
  metrics: {
    totalGamesPlayed: number;
    averageGameDuration: number;
    playerSatisfaction: number;
    systemStability: number;
  };
}

export interface UnifiedSystemEvent {
  id: string;
  type: 'game' | 'rule' | 'trading' | 'special' | 'balance' | 'ai' | 'event' | 'feedback' | 'sync';
  subtype: string;
  source: string;
  target?: string;
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class UnifiedGameSystem {
  // 核心系统组件
  private gameEngine: GameEngine;
  private ruleSystem: GameRuleSystem;
  private tradingManager: TradingAndMortgageManager;
  private specialSystemManager: UnifiedSpecialSystemManager;
  private balanceDashboard: BalanceDashboard;
  private aiManager: AIManager;
  private eventSystem: EventSystem;
  private feedbackSystem: InteractionFeedbackSystem;
  private syncManager: StateSyncManager;
  
  // 配置和状态
  private config: UnifiedSystemConfig;
  private status: SystemStatus;
  private isInitialized: boolean = false;
  private eventQueue: UnifiedSystemEvent[] = [];
  private performanceMetrics: Map<string, number[]> = new Map();
  
  // 事件监听器
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: Partial<UnifiedSystemConfig> = {}) {
    this.config = this.mergeWithDefaultConfig(config);
    this.status = this.createInitialStatus();
    
    // 初始化核心组件
    this.initializeCoreComponents();
    this.setupEventHandlers();
    this.setupPerformanceMonitoring();
  }

  // 合并默认配置
  private mergeWithDefaultConfig(config: Partial<UnifiedSystemConfig>): UnifiedSystemConfig {
    return {
      gameEngine: {
        maxPlayers: 4,
        startMoney: 10000,
        passingGoBonus: 2000,
        maxRounds: 100,
        ...config.gameEngine
      },
      rules: {
        enableZodiacRules: true,
        enableSeasonalRules: true,
        strictValidation: true,
        customRules: [],
        ...config.rules
      },
      trading: {
        enableTrading: true,
        enableMortgage: true,
        tradingTaxRate: 0.05,
        mortgageInterestRate: 0.08,
        ...config.trading
      },
      specialSystems: {
        enablePrison: true,
        enableLottery: true,
        enableInsurance: true,
        enableBanking: true,
        enableTeleportation: true,
        ...config.specialSystems
      },
      balance: {
        enableAutoBalance: true,
        balanceCheckInterval: 30000, // 30秒
        optimizationThreshold: 0.1,
        ...config.balance
      },
      ai: {
        aiPlayerCount: 3,
        difficultyLevel: 'medium',
        enablePersonality: true,
        enableLLM: true,
        ...config.ai
      },
      events: {
        enableRandomEvents: true,
        eventFrequency: 0.3,
        customEvents: true,
        ...config.events
      },
      feedback: {
        enableVisualFeedback: true,
        enableAudioFeedback: true,
        enableHapticFeedback: false,
        ...config.feedback
      }
    };
  }

  // 创建初始状态
  private createInitialStatus(): SystemStatus {
    return {
      gameEngine: {
        isRunning: false,
        currentPhase: 'waiting',
        currentRound: 0,
        activePlayers: 0
      },
      subsystems: {
        rules: false,
        trading: false,
        special: false,
        balance: false,
        ai: false,
        events: false,
        feedback: false,
        sync: false
      },
      performance: {
        fps: 60,
        memoryUsage: 0,
        responseTime: 0,
        errorCount: 0
      },
      metrics: {
        totalGamesPlayed: 0,
        averageGameDuration: 0,
        playerSatisfaction: 0.8,
        systemStability: 1.0
      }
    };
  }

  // 初始化核心组件
  private initializeCoreComponents(): void {
    try {
      // 游戏引擎
      this.gameEngine = new GameEngine();
      this.status.subsystems.rules = true;
      
      // 规则系统
      this.ruleSystem = new GameRuleSystem();
      this.status.subsystems.rules = true;
      
      // 交易管理器
      this.tradingManager = new TradingAndMortgageManager();
      this.status.subsystems.trading = true;
      
      // 特殊系统管理器
      this.specialSystemManager = new UnifiedSpecialSystemManager();
      this.status.subsystems.special = true;
      
      // 平衡仪表板
      const defaultParameters = this.getDefaultGameParameters();
      this.balanceDashboard = new BalanceDashboard(defaultParameters, {
        autoOptimize: this.config.balance.enableAutoBalance,
        optimizationThreshold: this.config.balance.optimizationThreshold
      });
      this.status.subsystems.balance = true;
      
      // AI管理器
      this.aiManager = new AIManager();
      this.status.subsystems.ai = true;
      
      // 事件系统
      this.eventSystem = new EventSystem();
      this.status.subsystems.events = true;
      
      // 反馈系统
      this.feedbackSystem = new InteractionFeedbackSystem();
      this.status.subsystems.feedback = true;
      
      // 状态同步管理器
      this.syncManager = new StateSyncManager();
      this.status.subsystems.sync = true;
      
    } catch (error) {
      console.error('核心组件初始化失败:', error);
      throw new Error(`UnifiedGameSystem initialization failed: ${error}`);
    }
  }

  // 设置事件处理器
  private setupEventHandlers(): void {
    // 游戏引擎事件
    this.gameEngine.on('game:state_updated', (gameState: GameState) => {
      this.handleGameStateUpdate(gameState);
    });
    
    this.gameEngine.on('game:error', (error: Error) => {
      this.handleSystemError('gameEngine', error);
    });
    
    // 规则系统事件
    this.ruleSystem.on('rule:violation', (violation: any) => {
      this.handleRuleViolation(violation);
    });
    
    // 交易系统事件
    this.tradingManager.on('trade:completed', (trade: any) => {
      this.handleTradeCompleted(trade);
    });
    
    // 特殊系统事件
    this.specialSystemManager.on('special:action_executed', (action: any) => {
      this.handleSpecialAction(action);
    });
    
    // 平衡系统事件
    this.balanceDashboard.on('balance:alert', (alert: any) => {
      this.handleBalanceAlert(alert);
    });
    
    // AI系统事件
    this.aiManager.on('ai:decision_made', (decision: any) => {
      this.handleAIDecision(decision);
    });
    
    // 事件系统事件
    this.eventSystem.on('event:triggered', (event: any) => {
      this.handleEventTriggered(event);
    });
  }

  // 设置性能监控
  private setupPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 1000);
  }

  // 初始化统一游戏系统
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('UnifiedGameSystem is already initialized');
    }

    try {
      console.log('🚀 开始初始化统一游戏系统...');
      
      // 初始化游戏引擎
      await this.gameEngine.initialize({
        playerName: 'System Player',
        playerZodiac: 'dragon',
        gameSettings: {
          maxPlayers: this.config.gameEngine.maxPlayers,
          turnTime: 60,
          startMoney: this.config.gameEngine.startMoney,
          passingStartBonus: this.config.gameEngine.passingGoBonus
        }
      });
      
      // 初始化各子系统
      await this.initializeSubsystems();
      
      // 验证系统集成
      await this.validateSystemIntegration();
      
      this.isInitialized = true;
      this.status.gameEngine.isRunning = true;
      
      console.log('✅ 统一游戏系统初始化完成');
      this.emitEvent('system:initialized', 'unified', {});
      
    } catch (error) {
      console.error('❌ 统一游戏系统初始化失败:', error);
      throw error;
    }
  }

  // 初始化子系统
  private async initializeSubsystems(): Promise<void> {
    // 初始化规则系统
    if (this.config.rules.enableZodiacRules) {
      this.ruleSystem.enableZodiacRules();
    }
    
    if (this.config.rules.enableSeasonalRules) {
      this.ruleSystem.enableSeasonalRules();
    }
    
    // 初始化AI系统
    await this.aiManager.initialize();
    
    // 初始化事件系统
    this.eventSystem.initialize();
    
    // 初始化反馈系统
    await this.feedbackSystem.initialize({
      enableVisual: this.config.feedback.enableVisualFeedback,
      enableAudio: this.config.feedback.enableAudioFeedback,
      enableHaptic: this.config.feedback.enableHapticFeedback
    });
    
    // 初始化同步管理器
    await this.syncManager.initialize();
  }

  // 验证系统集成
  private async validateSystemIntegration(): Promise<void> {
    const validationResults = [];
    
    // 验证各子系统状态
    for (const [system, status] of Object.entries(this.status.subsystems)) {
      if (!status) {
        validationResults.push(`${system} 子系统未正确初始化`);
      }
    }
    
    // 验证组件间通信
    try {
      const testGameState = this.gameEngine.getGameState();
      if (!testGameState) {
        validationResults.push('游戏引擎状态获取失败');
      }
    } catch (error) {
      validationResults.push(`游戏引擎通信失败: ${error}`);
    }
    
    if (validationResults.length > 0) {
      throw new Error(`系统集成验证失败: ${validationResults.join(', ')}`);
    }
  }

  // 启动游戏
  async startGame(players: Array<{name: string, zodiac: ZodiacSign, isHuman: boolean}>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    try {
      console.log('🎮 启动游戏...');
      
      // 创建游戏状态
      const gameState = await this.createGameState(players);
      
      // 启动游戏引擎
      await this.gameEngine.startGame();
      
      // 更新状态
      this.status.gameEngine.isRunning = true;
      this.status.gameEngine.activePlayers = players.length;
      this.status.metrics.totalGamesPlayed++;
      
      this.emitEvent('game:started', 'unified', { playerCount: players.length });
      
    } catch (error) {
      console.error('游戏启动失败:', error);
      throw error;
    }
  }

  // 创建游戏状态
  private async createGameState(players: Array<{name: string, zodiac: ZodiacSign, isHuman: boolean}>): Promise<GameState> {
    // 这里可以根据配置创建定制的游戏状态
    // 包括特殊规则、初始资源等
    
    const gameState = this.gameEngine.getGameState();
    if (!gameState) {
      throw new Error('Failed to get initial game state');
    }
    
    // 添加玩家到游戏状态
    players.forEach((player, index) => {
      gameState.players.push({
        id: `player_${index}`,
        name: player.name,
        zodiacSign: player.zodiac,
        isHuman: player.isHuman,
        money: this.config.gameEngine.startMoney,
        position: 0,
        properties: [],
        skills: [],
        statusEffects: [],
        isEliminated: false,
        statistics: {
          turnsPlayed: 0,
          propertiesBought: 0,
          moneyEarned: 0,
          moneySpent: 0,
          rentPaid: 0,
          rentCollected: 0,
          skillsUsed: 0
        }
      });
    });
    
    return gameState;
  }

  // 执行游戏动作
  async executeAction(playerId: string, actionType: string, actionData: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }

    try {
      const startTime = Date.now();
      
      // 验证动作
      const validation = await this.ruleSystem.validateAction({
        type: actionType,
        playerId,
        data: actionData
      });
      
      if (!validation.isValid) {
        throw new Error(`Action validation failed: ${validation.reason}`);
      }
      
      // 执行动作
      let result;
      switch (actionType) {
        case 'roll_dice':
        case 'buy_property':
        case 'pay_rent':
        case 'use_skill':
        case 'end_turn':
          result = await this.gameEngine.processPlayerAction({
            type: actionType,
            playerId,
            data: actionData
          });
          break;
          
        case 'propose_trade':
        case 'accept_trade':
        case 'reject_trade':
        case 'mortgage_property':
        case 'unmortgage_property':
          result = await this.tradingManager.executeAction(actionType, playerId, actionData);
          break;
          
        case 'prison_action':
        case 'lottery_action':
        case 'insurance_action':
        case 'banking_action':
        case 'teleport_action':
          result = await this.specialSystemManager.handlePlayerAction(
            playerId, actionType.split('_')[0] as any, actionData, this.gameEngine.getGameState()!
          );
          break;
          
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }
      
      // 记录性能
      const responseTime = Date.now() - startTime;
      this.recordPerformance('action_response_time', responseTime);
      
      // 触发后处理
      await this.postProcessAction(actionType, playerId, result);
      
      return result;
      
    } catch (error) {
      this.handleSystemError('action_execution', error);
      throw error;
    }
  }

  // 动作后处理
  private async postProcessAction(actionType: string, playerId: string, result: any): Promise<void> {
    // 更新游戏状态
    const gameState = this.gameEngine.getGameState();
    if (gameState) {
      // 平衡系统分析
      if (this.config.balance.enableAutoBalance) {
        this.balanceDashboard.updateGameState(gameState);
      }
      
      // 事件系统处理
      if (this.config.events.enableRandomEvents && Math.random() < this.config.events.eventFrequency) {
        await this.eventSystem.triggerRandomEvent(gameState);
      }
      
      // 反馈系统处理
      await this.feedbackSystem.processGameAction({
        type: actionType,
        playerId,
        result,
        gameState
      });
      
      // 状态同步
      await this.syncManager.syncGameState(gameState);
    }
  }

  // 获取系统状态
  getSystemStatus(): SystemStatus {
    return { ...this.status };
  }

  // 获取系统配置
  getSystemConfig(): UnifiedSystemConfig {
    return { ...this.config };
  }

  // 更新系统配置
  updateSystemConfig(newConfig: Partial<UnifiedSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emitEvent('config:updated', 'unified', newConfig);
  }

  // 获取游戏状态
  getGameState(): GameState | null {
    return this.gameEngine.getGameState();
  }

  // 暂停游戏
  async pauseGame(): Promise<void> {
    await this.gameEngine.pauseGame();
    this.status.gameEngine.isRunning = false;
    this.emitEvent('game:paused', 'unified', {});
  }

  // 恢复游戏
  async resumeGame(): Promise<void> {
    await this.gameEngine.resumeGame();
    this.status.gameEngine.isRunning = true;
    this.emitEvent('game:resumed', 'unified', {});
  }

  // 结束游戏
  async endGame(): Promise<void> {
    await this.gameEngine.endGame();
    this.status.gameEngine.isRunning = false;
    this.updateGameMetrics();
    this.emitEvent('game:ended', 'unified', {});
  }

  // 重置系统
  async resetSystem(): Promise<void> {
    await this.gameEngine.destroy();
    this.isInitialized = false;
    this.status = this.createInitialStatus();
    this.eventQueue = [];
    this.performanceMetrics.clear();
    this.emitEvent('system:reset', 'unified', {});
  }

  // 事件处理方法
  private handleGameStateUpdate(gameState: GameState): void {
    this.status.gameEngine.currentPhase = gameState.phase;
    this.status.gameEngine.currentRound = gameState.round;
    this.emitEvent('game:state_updated', 'gameEngine', gameState);
  }

  private handleSystemError(source: string, error: Error): void {
    this.status.performance.errorCount++;
    console.error(`系统错误 [${source}]:`, error);
    this.emitEvent('system:error', source, { error: error.message });
  }

  private handleRuleViolation(violation: any): void {
    console.warn('规则违反:', violation);
    this.emitEvent('rule:violation', 'ruleSystem', violation);
  }

  private handleTradeCompleted(trade: any): void {
    console.log('交易完成:', trade);
    this.emitEvent('trade:completed', 'tradingManager', trade);
  }

  private handleSpecialAction(action: any): void {
    console.log('特殊动作执行:', action);
    this.emitEvent('special:action', 'specialSystem', action);
  }

  private handleBalanceAlert(alert: any): void {
    console.warn('平衡警告:', alert);
    this.emitEvent('balance:alert', 'balanceSystem', alert);
  }

  private handleAIDecision(decision: any): void {
    console.log('AI决策:', decision);
    this.emitEvent('ai:decision', 'aiManager', decision);
  }

  private handleEventTriggered(event: any): void {
    console.log('事件触发:', event);
    this.emitEvent('event:triggered', 'eventSystem', event);
  }

  // 性能监控
  private updatePerformanceMetrics(): void {
    // 更新FPS
    this.status.performance.fps = this.calculateFPS();
    
    // 更新内存使用
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      this.status.performance.memoryUsage = (window as any).performance.memory.usedJSHeapSize;
    }
    
    // 更新平均响应时间
    const responseTimes = this.performanceMetrics.get('action_response_time') || [];
    if (responseTimes.length > 0) {
      this.status.performance.responseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }
  }

  private calculateFPS(): number {
    // 简化的FPS计算
    return 60; // 占位符
  }

  private recordPerformance(metric: string, value: number): void {
    if (!this.performanceMetrics.has(metric)) {
      this.performanceMetrics.set(metric, []);
    }
    
    const values = this.performanceMetrics.get(metric)!;
    values.push(value);
    
    // 保持最近100个值
    if (values.length > 100) {
      values.shift();
    }
  }

  private updateGameMetrics(): void {
    const gameState = this.gameEngine.getGameState();
    if (gameState) {
      const duration = Date.now() - gameState.startTime;
      const currentAvg = this.status.metrics.averageGameDuration;
      const totalGames = this.status.metrics.totalGamesPlayed;
      
      this.status.metrics.averageGameDuration = 
        (currentAvg * (totalGames - 1) + duration) / totalGames;
    }
  }

  // 事件系统
  private emitEvent(type: string, source: string, data: any): void {
    const event: UnifiedSystemEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.getEventCategory(source),
      subtype: type,
      source,
      data,
      timestamp: Date.now(),
      priority: this.getEventPriority(type)
    };
    
    this.eventQueue.push(event);
    this.notifyEventListeners(event);
    
    // 保持事件队列大小
    if (this.eventQueue.length > 1000) {
      this.eventQueue.shift();
    }
  }

  private getEventCategory(source: string): UnifiedSystemEvent['type'] {
    if (source.includes('game') || source.includes('engine')) return 'game';
    if (source.includes('rule')) return 'rule';
    if (source.includes('trading')) return 'trading';
    if (source.includes('special')) return 'special';
    if (source.includes('balance')) return 'balance';
    if (source.includes('ai')) return 'ai';
    if (source.includes('event')) return 'event';
    if (source.includes('feedback')) return 'feedback';
    if (source.includes('sync')) return 'sync';
    return 'game';
  }

  private getEventPriority(type: string): UnifiedSystemEvent['priority'] {
    if (type.includes('error') || type.includes('violation')) return 'critical';
    if (type.includes('alert') || type.includes('warning')) return 'high';
    if (type.includes('completed') || type.includes('decision')) return 'medium';
    return 'low';
  }

  private notifyEventListeners(event: UnifiedSystemEvent): void {
    const listeners = this.eventListeners.get(event.subtype) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('事件监听器错误:', error);
      }
    });
  }

  // 公共接口方法
  on(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  off(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  getEventHistory(): UnifiedSystemEvent[] {
    return [...this.eventQueue];
  }

  getPerformanceMetrics(): Map<string, number[]> {
    return new Map(this.performanceMetrics);
  }

  // 辅助方法
  private getDefaultGameParameters(): any {
    return {
      startingMoney: this.config.gameEngine.startMoney,
      passingGoBonus: this.config.gameEngine.passingGoBonus,
      propertyPriceMultiplier: 1.0,
      rentMultiplier: 1.0,
      taxRate: 1.0,
      zodiacSkillCooldownMultiplier: {
        rat: 1.0, ox: 1.0, tiger: 1.0, rabbit: 1.0, dragon: 1.0, snake: 1.0,
        horse: 1.0, goat: 1.0, monkey: 1.0, rooster: 1.0, dog: 1.0, pig: 1.0
      },
      zodiacMoneyBonus: {
        rat: 1.0, ox: 1.0, tiger: 1.0, rabbit: 1.0, dragon: 1.0, snake: 1.0,
        horse: 1.0, goat: 1.0, monkey: 1.0, rooster: 1.0, dog: 1.0, pig: 1.0
      },
      zodiacPropertyDiscount: {
        rat: 1.0, ox: 1.0, tiger: 1.0, rabbit: 1.0, dragon: 1.0, snake: 1.0,
        horse: 1.0, goat: 1.0, monkey: 1.0, rooster: 1.0, dog: 1.0, pig: 1.0
      },
      skillCooldownBase: 3,
      skillEffectMultiplier: 1.0,
      maxSkillsPerPlayer: 3,
      lotteryTicketPrice: 100,
      lotteryJackpotMultiplier: 2.0,
      insurancePremiumRate: 0.05,
      bankLoanInterestRate: 0.08,
      prisonBailMultiplier: 1.0,
      maxRounds: this.config.gameEngine.maxRounds,
      turnTimeLimit: 60,
      winConditionThreshold: 50000
    };
  }
}