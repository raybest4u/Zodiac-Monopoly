import { UnifiedGameSystem, type UnifiedSystemConfig } from '../integration/UnifiedGameSystem';
import { GameSimulator, type SimulationConfig } from '../balance/GameSimulator';
import { GameBalanceAnalyzer } from '../balance/GameBalanceAnalyzer';
import type { GameState, Player, ZodiacSign } from '../types/game';

/**
 * 自动化游戏测试系统
 * 
 * 功能：
 * 1. 自动化完整游戏流程测试
 * 2. 多场景游戏模拟
 * 3. 压力测试和负载测试
 * 4. 回归测试
 * 5. 性能基准测试
 * 6. 平衡性验证
 * 7. 边界条件测试
 * 8. 异常情况处理测试
 */

interface AutoTestConfig {
  // 测试规模配置
  testDuration: number; // 测试持续时间（毫秒）
  maxConcurrentGames: number; // 最大并发游戏数
  gameRounds: number; // 每个游戏的回合数
  
  // 测试场景配置
  scenarios: TestScenario[];
  
  // 性能阈值
  performanceThresholds: {
    maxResponseTime: number; // 最大响应时间（毫秒）
    maxMemoryUsage: number; // 最大内存使用（字节）
    minSuccessRate: number; // 最小成功率
    maxErrorRate: number; // 最大错误率
  };
  
  // 验证规则
  validationRules: ValidationRule[];
}

interface TestScenario {
  name: string;
  description: string;
  playerCount: number;
  zodiacDistribution: ZodiacSign[];
  gameConfig: Partial<UnifiedSystemConfig>;
  expectedOutcome?: any;
  iterations: number;
}

interface ValidationRule {
  name: string;
  description: string;
  validator: (gameState: GameState, testResult: GameTestResult) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface GameTestResult {
  gameId: string;
  scenario: string;
  duration: number;
  rounds: number;
  winner: Player | null;
  finalState: GameState;
  playerStats: PlayerStats[];
  systemMetrics: SystemMetrics;
  errors: TestError[];
  warnings: TestWarning[];
}

interface PlayerStats {
  playerId: string;
  name: string;
  zodiac: ZodiacSign;
  finalMoney: number;
  propertiesOwned: number;
  totalTurns: number;
  skillsUsed: number;
  performanceScore: number;
}

interface SystemMetrics {
  avgResponseTime: number;
  maxResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorCount: number;
  actionCount: number;
  balanceScore: number;
}

interface TestError {
  type: string;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
}

interface TestWarning {
  type: string;
  message: string;
  timestamp: number;
  recommendation?: string;
}

interface AutoTestReport {
  startTime: number;
  endTime: number;
  totalDuration: number;
  
  // 测试统计
  totalGames: number;
  completedGames: number;
  failedGames: number;
  
  // 性能统计
  avgGameDuration: number;
  avgResponseTime: number;
  maxMemoryUsage: number;
  totalErrors: number;
  totalWarnings: number;
  
  // 场景结果
  scenarioResults: Map<string, ScenarioResult>;
  
  // 验证结果
  validationResults: ValidationResult[];
  
  // 平衡分析
  balanceAnalysis: any;
  
  // 建议
  recommendations: string[];
  
  // 详细结果
  gameResults: GameTestResult[];
}

interface ScenarioResult {
  scenario: string;
  gamesPlayed: number;
  successRate: number;
  avgDuration: number;
  avgBalance: number;
  commonIssues: string[];
}

interface ValidationResult {
  rule: string;
  passed: boolean;
  failureCount: number;
  severity: string;
  details: string;
}

export class AutomatedGameTester {
  private config: AutoTestConfig;
  private unifiedSystem: UnifiedGameSystem;
  private gameSimulator: GameSimulator;
  private balanceAnalyzer: GameBalanceAnalyzer;
  
  private isRunning: boolean = false;
  private gameResults: GameTestResult[] = [];
  private currentGameCount: number = 0;
  private startTime: number = 0;
  
  private performanceMonitor: Map<string, number[]> = new Map();

  constructor(config: Partial<AutoTestConfig> = {}) {
    this.config = this.mergeWithDefaultConfig(config);
    this.unifiedSystem = new UnifiedGameSystem();
    this.gameSimulator = new GameSimulator(Date.now()); // 使用当前时间作为种子
    this.balanceAnalyzer = new GameBalanceAnalyzer();
  }

  // 合并默认配置
  private mergeWithDefaultConfig(config: Partial<AutoTestConfig>): AutoTestConfig {
    return {
      testDuration: 600000, // 10分钟
      maxConcurrentGames: 5,
      gameRounds: 50,
      scenarios: this.getDefaultScenarios(),
      performanceThresholds: {
        maxResponseTime: 1000, // 1秒
        maxMemoryUsage: 500 * 1024 * 1024, // 500MB
        minSuccessRate: 0.95, // 95%
        maxErrorRate: 0.05 // 5%
      },
      validationRules: this.getDefaultValidationRules(),
      ...config
    };
  }

  // 获取默认测试场景
  private getDefaultScenarios(): TestScenario[] {
    return [
      {
        name: 'standard_game',
        description: '标准4人游戏',
        playerCount: 4,
        zodiacDistribution: ['dragon', 'tiger', 'rabbit', 'rat'],
        gameConfig: {},
        iterations: 10
      },
      {
        name: 'fast_game',
        description: '快速游戏模式',
        playerCount: 3,
        zodiacDistribution: ['dragon', 'tiger', 'rabbit'],
        gameConfig: {
          gameEngine: { maxRounds: 30 },
          balance: { enableAutoBalance: false }
        },
        iterations: 15
      },
      {
        name: 'special_features',
        description: '特殊功能全开',
        playerCount: 4,
        zodiacDistribution: ['dragon', 'tiger', 'rabbit', 'rat'],
        gameConfig: {
          specialSystems: {
            enablePrison: true,
            enableLottery: true,
            enableInsurance: true,
            enableBanking: true,
            enableTeleportation: true
          }
        },
        iterations: 8
      },
      {
        name: 'balance_stress',
        description: '平衡系统压力测试',
        playerCount: 4,
        zodiacDistribution: ['dragon', 'dragon', 'rat', 'rat'], // 不平衡的生肖分布
        gameConfig: {
          balance: { 
            enableAutoBalance: true,
            optimizationThreshold: 0.05
          }
        },
        iterations: 5
      },
      {
        name: 'ai_heavy',
        description: 'AI重度测试',
        playerCount: 4,
        zodiacDistribution: ['dragon', 'tiger', 'rabbit', 'rat'],
        gameConfig: {
          ai: {
            aiPlayerCount: 4,
            difficultyLevel: 'expert',
            enablePersonality: true,
            enableLLM: false
          }
        },
        iterations: 6
      }
    ];
  }

  // 获取默认验证规则
  private getDefaultValidationRules(): ValidationRule[] {
    return [
      {
        name: 'game_completion',
        description: '游戏必须正常完成',
        validator: (gameState, result) => result.winner !== null || result.rounds >= 100,
        severity: 'critical'
      },
      {
        name: 'player_money_positive',
        description: '获胜玩家必须有正数金钱',
        validator: (gameState, result) => !result.winner || result.winner.money > 0,
        severity: 'high'
      },
      {
        name: 'balance_within_range',
        description: '基尼系数应在合理范围内',
        validator: (gameState, result) => {
          const metrics = this.balanceAnalyzer.analyzeBalance(gameState);
          return metrics.giniCoefficient >= 0.2 && metrics.giniCoefficient <= 0.8;
        },
        severity: 'medium'
      },
      {
        name: 'response_time',
        description: '响应时间应在阈值内',
        validator: (gameState, result) => result.systemMetrics.avgResponseTime <= this.config.performanceThresholds.maxResponseTime,
        severity: 'medium'
      },
      {
        name: 'error_rate',
        description: '错误率应在可接受范围内',
        validator: (gameState, result) => {
          const errorRate = result.errors.length / Math.max(result.systemMetrics.actionCount, 1);
          return errorRate <= this.config.performanceThresholds.maxErrorRate;
        },
        severity: 'high'
      }
    ];
  }

  // 运行自动化测试
  async runAutomatedTests(): Promise<AutoTestReport> {
    if (this.isRunning) {
      throw new Error('测试已在运行中');
    }

    console.log('🚀 开始自动化游戏测试...');
    this.isRunning = true;
    this.startTime = Date.now();
    this.gameResults = [];
    this.currentGameCount = 0;

    try {
      // 初始化统一游戏系统
      await this.unifiedSystem.initialize();
      
      // 运行所有测试场景
      await this.runAllScenarios();
      
      // 生成测试报告
      const report = this.generateTestReport();
      
      console.log('✅ 自动化测试完成');
      return report;
      
    } catch (error) {
      console.error('❌ 自动化测试失败:', error);
      throw error;
    } finally {
      this.isRunning = false;
      await this.cleanup();
    }
  }

  // 运行所有测试场景
  private async runAllScenarios(): Promise<void> {
    console.log(`📋 执行 ${this.config.scenarios.length} 个测试场景...`);
    
    for (const scenario of this.config.scenarios) {
      console.log(`\n🎮 执行场景: ${scenario.name} (${scenario.iterations} 次)`);
      await this.runScenario(scenario);
    }
  }

  // 运行单个测试场景
  private async runScenario(scenario: TestScenario): Promise<void> {
    const scenarioStartTime = Date.now();
    
    for (let i = 0; i < scenario.iterations; i++) {
      if (!this.isRunning || Date.now() - this.startTime > this.config.testDuration) {
        console.log('⏰ 测试时间已到，停止当前场景');
        break;
      }
      
      console.log(`  游戏 ${i + 1}/${scenario.iterations}...`);
      
      try {
        const gameResult = await this.runSingleGame(scenario, i);
        this.gameResults.push(gameResult);
        this.currentGameCount++;
        
        // 记录性能指标
        this.recordPerformanceMetrics(gameResult);
        
      } catch (error) {
        console.error(`  游戏 ${i + 1} 失败:`, error);
        
        // 记录失败的游戏
        this.gameResults.push({
          gameId: `${scenario.name}_${i}`,
          scenario: scenario.name,
          duration: 0,
          rounds: 0,
          winner: null,
          finalState: {} as GameState,
          playerStats: [],
          systemMetrics: this.getEmptySystemMetrics(),
          errors: [{
            type: 'game_failure',
            message: error.toString(),
            timestamp: Date.now(),
            severity: 'critical'
          }],
          warnings: []
        });
      }
      
      // 短暂休息避免过载
      await this.delay(100);
    }
    
    const scenarioDuration = Date.now() - scenarioStartTime;
    console.log(`  场景 ${scenario.name} 完成，耗时 ${(scenarioDuration / 1000).toFixed(2)} 秒`);
  }

  // 运行单个游戏
  private async runSingleGame(scenario: TestScenario, gameIndex: number): Promise<GameTestResult> {
    const gameId = `${scenario.name}_${gameIndex}`;
    const gameStartTime = Date.now();
    
    // 创建游戏配置
    const gameConfig = this.mergeGameConfig(scenario.gameConfig);
    
    // 创建新的游戏系统实例
    const gameSystem = new UnifiedGameSystem(gameConfig);
    await gameSystem.initialize();
    
    // 创建玩家
    const players = this.createPlayers(scenario);
    
    // 启动游戏
    await gameSystem.startGame(players);
    
    // 收集指标
    const systemMetrics = this.getEmptySystemMetrics();
    const errors: TestError[] = [];
    const warnings: TestWarning[] = [];
    
    // 监听系统事件
    gameSystem.on('system:error', (event) => {
      errors.push({
        type: 'system_error',
        message: event.data.error,
        timestamp: event.timestamp,
        severity: 'high'
      });
    });
    
    // 模拟游戏进行
    let rounds = 0;
    let winner: Player | null = null;
    let gameState = gameSystem.getGameState()!;
    
    while (rounds < this.config.gameRounds && !winner) {
      try {
        // 模拟一轮游戏
        await this.simulateGameRound(gameSystem, gameState);
        
        // 更新状态
        gameState = gameSystem.getGameState()!;
        rounds = gameState.round;
        
        // 检查胜利条件
        winner = this.checkWinCondition(gameState);
        
        // 更新性能指标
        const status = gameSystem.getSystemStatus();
        systemMetrics.avgResponseTime = status.performance.responseTime;
        systemMetrics.maxResponseTime = Math.max(systemMetrics.maxResponseTime, status.performance.responseTime);
        systemMetrics.memoryUsage = status.performance.memoryUsage;
        systemMetrics.errorCount = status.performance.errorCount;
        systemMetrics.actionCount++;
        
      } catch (error) {
        errors.push({
          type: 'round_error',
          message: error.toString(),
          timestamp: Date.now(),
          severity: 'medium'
        });
        
        // 尝试恢复
        if (errors.length > 10) {
          break; // 太多错误，停止游戏
        }
      }
    }
    
    const gameDuration = Date.now() - gameStartTime;
    
    // 分析平衡性
    const balanceMetrics = this.balanceAnalyzer.analyzeBalance(gameState);
    systemMetrics.balanceScore = this.calculateBalanceScore(balanceMetrics);
    
    // 创建玩家统计
    const playerStats = this.createPlayerStats(gameState.players);
    
    // 清理游戏系统
    await gameSystem.resetSystem();
    
    return {
      gameId,
      scenario: scenario.name,
      duration: gameDuration,
      rounds,
      winner,
      finalState: gameState,
      playerStats,
      systemMetrics,
      errors,
      warnings
    };
  }

  // 模拟游戏回合
  private async simulateGameRound(gameSystem: UnifiedGameSystem, gameState: GameState): Promise<void> {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (currentPlayer.isEliminated) {
      return;
    }
    
    const actionStartTime = Date.now();
    
    try {
      // 掷骰子
      await gameSystem.executeAction(currentPlayer.id, 'roll_dice', {});
      
      // 随机执行其他动作
      if (Math.random() < 0.3) {
        const actions = ['use_skill', 'buy_property', 'propose_trade'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        try {
          await gameSystem.executeAction(currentPlayer.id, randomAction, {});
        } catch (error) {
          // 某些动作可能失败（如没有技能、没钱买房产等），这是正常的
        }
      }
      
      // 结束回合
      await gameSystem.executeAction(currentPlayer.id, 'end_turn', {});
      
    } catch (error) {
      throw new Error(`Player ${currentPlayer.name} action failed: ${error}`);
    }
    
    const actionTime = Date.now() - actionStartTime;
    this.recordPerformance('action_time', actionTime);
  }

  // 检查胜利条件
  private checkWinCondition(gameState: GameState): Player | null {
    // 检查是否只剩一个玩家有钱
    const alivePlayers = gameState.players.filter(p => !p.isEliminated && p.money > 0);
    if (alivePlayers.length === 1) {
      return alivePlayers[0];
    }
    
    // 检查是否有玩家达到胜利金额
    const richestPlayer = gameState.players.reduce((prev, current) => 
      prev.money > current.money ? prev : current
    );
    
    if (richestPlayer.money >= 50000) {
      return richestPlayer;
    }
    
    return null;
  }

  // 创建玩家
  private createPlayers(scenario: TestScenario): Array<{name: string, zodiac: ZodiacSign, isHuman: boolean}> {
    const players = [];
    
    for (let i = 0; i < scenario.playerCount; i++) {
      const zodiac = scenario.zodiacDistribution[i] || 'dragon';
      players.push({
        name: `Player_${i + 1}`,
        zodiac,
        isHuman: i === 0 // 第一个玩家是人类，其余是AI
      });
    }
    
    return players;
  }

  // 合并游戏配置
  private mergeGameConfig(scenarioConfig: Partial<UnifiedSystemConfig>): UnifiedSystemConfig {
    // 这里应该合并场景配置和默认配置
    return {
      gameEngine: {
        maxPlayers: 4,
        startMoney: 10000,
        passingGoBonus: 2000,
        maxRounds: 100
      },
      rules: {
        enableZodiacRules: true,
        enableSeasonalRules: true,
        strictValidation: true,
        customRules: []
      },
      trading: {
        enableTrading: true,
        enableMortgage: true,
        tradingTaxRate: 0.05,
        mortgageInterestRate: 0.08
      },
      specialSystems: {
        enablePrison: true,
        enableLottery: true,
        enableInsurance: true,
        enableBanking: true,
        enableTeleportation: true
      },
      balance: {
        enableAutoBalance: false, // 测试时禁用自动平衡
        balanceCheckInterval: 30000,
        optimizationThreshold: 0.1
      },
      ai: {
        aiPlayerCount: 3,
        difficultyLevel: 'medium',
        enablePersonality: true,
        enableLLM: false
      },
      events: {
        enableRandomEvents: true,
        eventFrequency: 0.2,
        customEvents: true
      },
      feedback: {
        enableVisualFeedback: false,
        enableAudioFeedback: false,
        enableHapticFeedback: false
      },
      ...scenarioConfig
    };
  }

  // 创建玩家统计
  private createPlayerStats(players: Player[]): PlayerStats[] {
    return players.map(player => ({
      playerId: player.id,
      name: player.name,
      zodiac: player.zodiacSign,
      finalMoney: player.money,
      propertiesOwned: player.properties.length,
      totalTurns: player.statistics.turnsPlayed,
      skillsUsed: player.statistics.skillsUsed,
      performanceScore: this.calculatePlayerPerformanceScore(player)
    }));
  }

  // 计算玩家表现得分
  private calculatePlayerPerformanceScore(player: Player): number {
    const moneyScore = Math.min(player.money / 20000, 1) * 40; // 最高40分
    const propertyScore = Math.min(player.properties.length / 10, 1) * 30; // 最高30分
    const skillScore = Math.min(player.statistics.skillsUsed / 20, 1) * 20; // 最高20分
    const turnScore = Math.min(player.statistics.turnsPlayed / 50, 1) * 10; // 最高10分
    
    return moneyScore + propertyScore + skillScore + turnScore;
  }

  // 计算平衡得分
  private calculateBalanceScore(balanceMetrics: any): number {
    let score = 100;
    
    // 基尼系数评分（越接近0.4越好）
    const giniDeviation = Math.abs(balanceMetrics.giniCoefficient - 0.4);
    score -= giniDeviation * 100;
    
    // 玩家参与度评分
    score -= (1 - balanceMetrics.playerEngagement) * 30;
    
    // 财富方差评分
    score -= Math.min(balanceMetrics.wealthVariance, 1) * 20;
    
    return Math.max(0, score);
  }

  // 生成测试报告
  private generateTestReport(): AutoTestReport {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    // 基本统计
    const completedGames = this.gameResults.filter(r => r.winner !== null || r.rounds > 0).length;
    const failedGames = this.gameResults.length - completedGames;
    
    // 性能统计
    const avgGameDuration = this.gameResults.reduce((sum, r) => sum + r.duration, 0) / this.gameResults.length;
    const avgResponseTime = this.gameResults.reduce((sum, r) => sum + r.systemMetrics.avgResponseTime, 0) / this.gameResults.length;
    const maxMemoryUsage = Math.max(...this.gameResults.map(r => r.systemMetrics.memoryUsage));
    const totalErrors = this.gameResults.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = this.gameResults.reduce((sum, r) => sum + r.warnings.length, 0);
    
    // 场景结果
    const scenarioResults = this.generateScenarioResults();
    
    // 验证结果
    const validationResults = this.runValidationRules();
    
    // 平衡分析
    const balanceAnalysis = this.generateBalanceAnalysis();
    
    // 生成建议
    const recommendations = this.generateRecommendations(validationResults, scenarioResults);
    
    return {
      startTime: this.startTime,
      endTime,
      totalDuration,
      totalGames: this.gameResults.length,
      completedGames,
      failedGames,
      avgGameDuration,
      avgResponseTime,
      maxMemoryUsage,
      totalErrors,
      totalWarnings,
      scenarioResults,
      validationResults,
      balanceAnalysis,
      recommendations,
      gameResults: this.gameResults
    };
  }

  // 生成场景结果
  private generateScenarioResults(): Map<string, ScenarioResult> {
    const scenarioResults = new Map<string, ScenarioResult>();
    
    // 按场景分组
    const gamesByScenario = new Map<string, GameTestResult[]>();
    this.gameResults.forEach(result => {
      if (!gamesByScenario.has(result.scenario)) {
        gamesByScenario.set(result.scenario, []);
      }
      gamesByScenario.get(result.scenario)!.push(result);
    });
    
    // 分析每个场景
    for (const [scenario, games] of gamesByScenario) {
      const successfulGames = games.filter(g => g.winner !== null || g.rounds > 0);
      const successRate = successfulGames.length / games.length;
      const avgDuration = games.reduce((sum, g) => sum + g.duration, 0) / games.length;
      const avgBalance = games.reduce((sum, g) => sum + g.systemMetrics.balanceScore, 0) / games.length;
      
      // 统计常见问题
      const errorCounts = new Map<string, number>();
      games.forEach(game => {
        game.errors.forEach(error => {
          errorCounts.set(error.type, (errorCounts.get(error.type) || 0) + 1);
        });
      });
      
      const commonIssues = Array.from(errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => `${type} (${count}次)`);
      
      scenarioResults.set(scenario, {
        scenario,
        gamesPlayed: games.length,
        successRate,
        avgDuration,
        avgBalance,
        commonIssues
      });
    }
    
    return scenarioResults;
  }

  // 运行验证规则
  private runValidationRules(): ValidationResult[] {
    return this.config.validationRules.map(rule => {
      let failureCount = 0;
      
      for (const gameResult of this.gameResults) {
        try {
          if (!rule.validator(gameResult.finalState, gameResult)) {
            failureCount++;
          }
        } catch (error) {
          failureCount++;
        }
      }
      
      const passed = failureCount === 0;
      const details = failureCount > 0 ? 
        `${failureCount}/${this.gameResults.length} 游戏未通过此验证` : 
        '所有游戏都通过了此验证';
      
      return {
        rule: rule.name,
        passed,
        failureCount,
        severity: rule.severity,
        details
      };
    });
  }

  // 生成平衡分析
  private generateBalanceAnalysis(): any {
    const allGameStates = this.gameResults.map(r => r.finalState).filter(s => s && s.players);
    
    if (allGameStates.length === 0) {
      return { error: '没有有效的游戏状态用于分析' };
    }
    
    // 合并分析结果
    const balanceMetrics = allGameStates.map(state => this.balanceAnalyzer.analyzeBalance(state));
    
    const avgGini = balanceMetrics.reduce((sum, m) => sum + m.giniCoefficient, 0) / balanceMetrics.length;
    const avgEngagement = balanceMetrics.reduce((sum, m) => sum + m.playerEngagement, 0) / balanceMetrics.length;
    const avgVariance = balanceMetrics.reduce((sum, m) => sum + m.wealthVariance, 0) / balanceMetrics.length;
    
    return {
      averageGiniCoefficient: avgGini,
      averagePlayerEngagement: avgEngagement,
      averageWealthVariance: avgVariance,
      recommendation: this.getBalanceRecommendation(avgGini, avgEngagement)
    };
  }

  // 获取平衡建议
  private getBalanceRecommendation(gini: number, engagement: number): string {
    if (gini > 0.6) {
      return '财富分配过于不平衡，建议调整起始资金或增加重分配机制';
    } else if (gini < 0.2) {
      return '财富分配过于平均，可能缺乏竞争性，建议增加技能差异化';
    } else if (engagement < 0.5) {
      return '玩家参与度较低，建议增加互动元素或缩短回合时间';
    } else {
      return '游戏平衡状态良好';
    }
  }

  // 生成建议
  private generateRecommendations(validationResults: ValidationResult[], scenarioResults: Map<string, ScenarioResult>): string[] {
    const recommendations: string[] = [];
    
    // 基于验证结果的建议
    const failedValidations = validationResults.filter(v => !v.passed);
    if (failedValidations.length > 0) {
      recommendations.push(`${failedValidations.length} 个验证规则未通过，需要关注相关问题`);
    }
    
    // 基于场景结果的建议
    for (const [scenario, result] of scenarioResults) {
      if (result.successRate < 0.9) {
        recommendations.push(`场景 ${scenario} 成功率较低 (${(result.successRate * 100).toFixed(1)}%)，需要检查相关功能`);
      }
      
      if (result.avgBalance < 60) {
        recommendations.push(`场景 ${scenario} 平衡得分较低，需要调整游戏参数`);
      }
    }
    
    // 基于性能的建议
    const totalErrors = this.gameResults.reduce((sum, r) => sum + r.errors.length, 0);
    const errorRate = totalErrors / this.gameResults.length;
    if (errorRate > 2) {
      recommendations.push('错误率较高，建议检查系统稳定性');
    }
    
    // 基于平衡分析的建议
    // 这些建议在 generateBalanceAnalysis 中已经生成
    
    return recommendations;
  }

  // 辅助方法
  private getEmptySystemMetrics(): SystemMetrics {
    return {
      avgResponseTime: 0,
      maxResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      errorCount: 0,
      actionCount: 0,
      balanceScore: 0
    };
  }

  private recordPerformanceMetrics(gameResult: GameTestResult): void {
    this.recordPerformance('response_time', gameResult.systemMetrics.avgResponseTime);
    this.recordPerformance('memory_usage', gameResult.systemMetrics.memoryUsage);
    this.recordPerformance('balance_score', gameResult.systemMetrics.balanceScore);
  }

  private recordPerformance(metric: string, value: number): void {
    if (!this.performanceMonitor.has(metric)) {
      this.performanceMonitor.set(metric, []);
    }
    
    const values = this.performanceMonitor.get(metric)!;
    values.push(value);
    
    // 保持最近1000个值
    if (values.length > 1000) {
      values.shift();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async cleanup(): Promise<void> {
    try {
      await this.unifiedSystem.resetSystem();
    } catch (error) {
      console.error('清理过程中出现错误:', error);
    }
  }

  // 公共接口方法
  isTestRunning(): boolean {
    return this.isRunning;
  }

  getProgress(): { completed: number; total: number; currentScenario: string } {
    const totalGames = this.config.scenarios.reduce((sum, s) => sum + s.iterations, 0);
    return {
      completed: this.currentGameCount,
      total: totalGames,
      currentScenario: this.gameResults.length > 0 ? this.gameResults[this.gameResults.length - 1].scenario : ''
    };
  }

  stopTesting(): void {
    this.isRunning = false;
  }

  exportReport(report: AutoTestReport): string {
    return JSON.stringify(report, null, 2);
  }
}

// 主入口函数
export async function runAutomatedGameTests(config?: Partial<AutoTestConfig>): Promise<AutoTestReport> {
  console.log('🤖 启动自动化游戏测试...\n');
  
  const tester = new AutomatedGameTester(config);
  
  try {
    const report = await tester.runAutomatedTests();
    
    console.log('\n📊 自动化测试报告：');
    console.log(`总游戏数: ${report.totalGames}`);
    console.log(`完成游戏数: ${report.completedGames}`);
    console.log(`失败游戏数: ${report.failedGames}`);
    console.log(`成功率: ${(report.completedGames / report.totalGames * 100).toFixed(1)}%`);
    console.log(`平均游戏时长: ${(report.avgGameDuration / 1000).toFixed(2)} 秒`);
    console.log(`平均响应时间: ${report.avgResponseTime.toFixed(2)}ms`);
    console.log(`总错误数: ${report.totalErrors}`);
    
    // 显示验证结果
    const failedValidations = report.validationResults.filter(v => !v.passed);
    if (failedValidations.length > 0) {
      console.log('\n❌ 未通过的验证:');
      failedValidations.forEach(v => {
        console.log(`  - ${v.rule}: ${v.details}`);
      });
    }
    
    // 显示建议
    if (report.recommendations.length > 0) {
      console.log('\n💡 建议:');
      report.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    
    return report;
    
  } catch (error) {
    console.error('\n❌ 自动化测试失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAutomatedGameTests()
    .then(report => {
      console.log('\n✅ 自动化游戏测试完成');
      process.exit(report.failedGames > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ 测试执行失败:', error);
      process.exit(1);
    });
}