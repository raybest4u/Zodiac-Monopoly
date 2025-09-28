import { GameEngine } from '../engine/GameEngine';
import { GameBalanceAnalyzer } from '../balance/GameBalanceAnalyzer';
import { ValueOptimizer, type GameParameters } from '../balance/ValueOptimizer';
import { GameSimulator, type SimulationConfig } from '../balance/GameSimulator';
import { BalanceDashboard } from '../balance/BalanceDashboard';
import type { GameState, Player, ZodiacSign } from '../types/game';

/**
 * Day 4 游戏平衡和数值调优测试
 * 
 * 测试以下功能：
 * 1. 平衡分析算法
 * 2. 数值优化系统
 * 3. 游戏模拟器
 * 4. 平衡仪表板
 * 5. 参数敏感性分析
 */

class Day4BalanceTest {
  private gameEngine: GameEngine;
  private balanceAnalyzer: GameBalanceAnalyzer;
  private valueOptimizer: ValueOptimizer;
  private gameSimulator: GameSimulator;
  private balanceDashboard: BalanceDashboard;
  private testParameters: GameParameters;

  constructor() {
    this.gameEngine = new GameEngine();
    this.balanceAnalyzer = new GameBalanceAnalyzer();
    this.testParameters = this.createTestParameters();
    this.valueOptimizer = new ValueOptimizer(this.testParameters);
    this.gameSimulator = new GameSimulator(12345); // 固定种子用于可重现测试
    this.balanceDashboard = new BalanceDashboard(this.testParameters);
  }

  // 创建测试参数
  private createTestParameters(): GameParameters {
    return {
      // 经济参数
      startingMoney: 10000,
      passingGoBonus: 2000,
      propertyPriceMultiplier: 1.0,
      rentMultiplier: 1.0,
      taxRate: 1.0,
      
      // 生肖参数
      zodiacSkillCooldownMultiplier: {
        rat: 0.9, ox: 1.1, tiger: 0.8, rabbit: 1.0, dragon: 0.7, snake: 1.0,
        horse: 0.9, goat: 1.0, monkey: 0.8, rooster: 1.0, dog: 1.1, pig: 1.0
      },
      zodiacMoneyBonus: {
        rat: 1.1, ox: 1.0, tiger: 1.2, rabbit: 0.9, dragon: 1.3, snake: 1.0,
        horse: 1.1, goat: 0.9, monkey: 1.2, rooster: 1.0, dog: 1.0, pig: 1.1
      },
      zodiacPropertyDiscount: {
        rat: 0.95, ox: 1.0, tiger: 0.9, rabbit: 1.05, dragon: 0.85, snake: 1.0,
        horse: 0.95, goat: 1.05, monkey: 0.9, rooster: 1.0, dog: 1.0, pig: 1.0
      },
      
      // 技能参数
      skillCooldownBase: 3,
      skillEffectMultiplier: 1.0,
      maxSkillsPerPlayer: 3,
      
      // 特殊系统参数
      lotteryTicketPrice: 100,
      lotteryJackpotMultiplier: 2.0,
      insurancePremiumRate: 0.05,
      bankLoanInterestRate: 0.08,
      prisonBailMultiplier: 1.0,
      
      // 游戏进度参数
      maxRounds: 100,
      turnTimeLimit: 60,
      winConditionThreshold: 50000
    };
  }

  // 运行所有测试
  async runAllTests(): Promise<void> {
    console.log('🎯 开始执行 Day 4 游戏平衡和数值调优测试...\n');

    try {
      await this.testBalanceAnalyzer();
      await this.testValueOptimizer();
      await this.testGameSimulator();
      await this.testBalanceDashboard();
      await this.testParameterSensitivityAnalysis();
      await this.testIntegratedBalanceSystem();
      await this.testOptimizationScenarios();

      console.log('✅ 所有测试通过！Day 4 游戏平衡和数值调优测试完成\n');
    } catch (error) {
      console.error('❌ 测试失败：', error);
      throw error;
    }
  }

  // 测试平衡分析器
  private async testBalanceAnalyzer(): Promise<void> {
    console.log('📊 测试平衡分析器...');

    // 创建测试游戏状态
    const testGameState = this.createTestGameState();
    
    // 测试平衡指标计算
    console.log('  测试平衡指标计算...');
    const metrics = this.balanceAnalyzer.analyzeBalance(testGameState);
    
    if (!metrics || typeof metrics.giniCoefficient !== 'number') {
      throw new Error('平衡指标计算失败');
    }
    console.log(`  基尼系数: ${metrics.giniCoefficient.toFixed(3)}`);
    console.log(`  财富方差: ${metrics.wealthVariance.toFixed(3)}`);
    console.log(`  玩家参与度: ${metrics.playerEngagement.toFixed(3)}`);
    
    // 测试平衡问题检测
    console.log('  测试平衡问题检测...');
    const alerts = this.balanceAnalyzer.detectBalanceIssues(metrics);
    console.log(`  检测到 ${alerts.length} 个平衡问题`);
    
    // 测试建议生成
    console.log('  测试建议生成...');
    const recommendations = this.balanceAnalyzer.generateBalanceRecommendations(metrics, alerts);
    console.log(`  生成 ${recommendations.length} 条建议`);
    
    console.log('✅ 平衡分析器测试完成\n');
  }

  // 测试数值优化器
  private async testValueOptimizer(): Promise<void> {
    console.log('🔧 测试数值优化器...');

    // 测试参数优化
    console.log('  测试参数优化...');
    const testGameState = this.createTestGameState();
    const metrics = this.balanceAnalyzer.analyzeBalance(testGameState);
    const alerts = this.balanceAnalyzer.detectBalanceIssues(metrics);
    
    const optimizationResults = this.valueOptimizer.optimizeParameters(metrics, alerts);
    console.log(`  优化了 ${optimizationResults.length} 个参数`);
    
    // 测试参数模拟
    console.log('  测试参数模拟...');
    const sampleGameStates = [testGameState];
    const simulationResult = this.valueOptimizer.simulateParameterAdjustment(
      'startingMoney', 12000, sampleGameStates
    );
    
    if (!simulationResult.beforeMetrics || !simulationResult.afterMetrics) {
      throw new Error('参数模拟失败');
    }
    
    // 测试批量优化
    console.log('  测试批量优化...');
    const batchResults = this.valueOptimizer.batchOptimize(sampleGameStates, {
      giniCoefficient: 0.4,
      playerEngagement: 0.7
    });
    console.log(`  批量优化产生 ${batchResults.length} 个改进`);
    
    console.log('✅ 数值优化器测试完成\n');
  }

  // 测试游戏模拟器
  private async testGameSimulator(): Promise<void> {
    console.log('🎮 测试游戏模拟器...');

    // 创建模拟配置
    const config: SimulationConfig = {
      playerCount: 4,
      zodiacDistribution: ['dragon', 'tiger', 'rabbit', 'rat'],
      gameParameters: this.testParameters,
      maxRounds: 50, // 减少轮次以加快测试
      simulationSpeed: 'fast'
    };

    // 测试单次模拟
    console.log('  测试单次游戏模拟...');
    const singleResult = await this.gameSimulator.simulateGame(config);
    
    if (!singleResult.gameState || !singleResult.balanceMetrics) {
      throw new Error('单次模拟失败');
    }
    console.log(`  模拟完成：${singleResult.rounds} 回合，耗时 ${singleResult.duration}ms`);
    console.log(`  胜者：${singleResult.winner?.name || '无'}`);
    
    // 测试批量模拟
    console.log('  测试批量模拟...');
    const batchResult = await this.gameSimulator.simulateBatch(config, 10);
    
    if (!batchResult.zodiacWinRates) {
      throw new Error('批量模拟失败');
    }
    console.log(`  批量模拟完成：${batchResult.totalGames} 场游戏`);
    console.log(`  平均时长：${(batchResult.averageDuration / 1000).toFixed(1)}秒`);
    
    // 验证生肖胜率分布
    const winRates = Object.values(batchResult.zodiacWinRates);
    const avgWinRate = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length;
    console.log(`  平均胜率：${(avgWinRate * 100).toFixed(1)}%`);
    
    console.log('✅ 游戏模拟器测试完成\n');
  }

  // 测试平衡仪表板
  private async testBalanceDashboard(): Promise<void> {
    console.log('📋 测试平衡仪表板...');

    // 添加测试游戏状态
    console.log('  添加测试数据...');
    const testGameStates = this.createMultipleTestGameStates(5);
    testGameStates.forEach(state => this.balanceDashboard.updateGameState(state));
    
    // 测试综合分析
    console.log('  测试综合分析...');
    const analysis = await this.balanceDashboard.performComprehensiveAnalysis();
    
    if (!analysis.metrics || !analysis.alerts) {
      throw new Error('综合分析失败');
    }
    console.log(`  分析完成：${analysis.alerts.length} 个警告，${analysis.recommendations.length} 条建议`);
    
    // 测试参数优化
    console.log('  测试仪表板参数优化...');
    const optimizations = await this.balanceDashboard.optimizeParameters();
    console.log(`  优化完成：${optimizations.length} 个参数调整`);
    
    // 测试配置管理
    console.log('  测试配置管理...');
    const originalConfig = this.balanceDashboard.getConfig();
    this.balanceDashboard.updateConfig({ autoOptimize: true });
    const updatedConfig = this.balanceDashboard.getConfig();
    
    if (!updatedConfig.autoOptimize) {
      throw new Error('配置更新失败');
    }
    
    // 测试报告生成
    console.log('  测试报告生成...');
    const report = this.balanceDashboard.generateBalanceReport();
    
    if (!report || report.length < 100) {
      throw new Error('报告生成失败');
    }
    
    console.log('✅ 平衡仪表板测试完成\n');
  }

  // 测试参数敏感性分析
  private async testParameterSensitivityAnalysis(): Promise<void> {
    console.log('🔍 测试参数敏感性分析...');

    // 测试起始资金敏感性
    console.log('  分析起始资金敏感性...');
    const sensitivityResults = await this.balanceDashboard.analyzeParameterSensitivity(
      'startingMoney',
      [5000, 15000],
      5 // 5个步骤以加快测试
    );
    
    if (!sensitivityResults || sensitivityResults.length !== 5) {
      throw new Error('参数敏感性分析失败');
    }
    
    // 验证结果趋势
    console.log('  验证敏感性结果：');
    sensitivityResults.forEach((result, index) => {
      console.log(`    资金 ${result.value}: 得分 ${result.score.toFixed(2)}`);
    });
    
    // 测试租金倍数敏感性
    console.log('  分析租金倍数敏感性...');
    const rentSensitivity = await this.balanceDashboard.analyzeParameterSensitivity(
      'rentMultiplier',
      [0.5, 2.0],
      5
    );
    
    if (!rentSensitivity || rentSensitivity.length !== 5) {
      throw new Error('租金倍数敏感性分析失败');
    }
    
    console.log('✅ 参数敏感性分析测试完成\n');
  }

  // 测试集成平衡系统
  private async testIntegratedBalanceSystem(): Promise<void> {
    console.log('🔗 测试集成平衡系统...');

    // 初始化游戏引擎
    console.log('  初始化游戏引擎...');
    await this.gameEngine.initialize({
      playerName: '测试玩家',
      playerZodiac: 'dragon',
      gameSettings: {
        maxPlayers: 4,
        turnTime: 30,
        startMoney: 10000,
        passingStartBonus: 2000
      }
    });
    
    // 测试平衡分析集成
    console.log('  测试平衡分析集成...');
    const balanceAnalysis = await this.gameEngine.getBalanceAnalysis();
    
    if (!balanceAnalysis) {
      throw new Error('集成平衡分析失败');
    }
    
    // 测试参数优化集成
    console.log('  测试参数优化集成...');
    const optimizationResults = await this.gameEngine.optimizeGameParameters();
    console.log(`  集成优化完成：${optimizationResults.length} 个参数调整`);
    
    // 测试仪表板状态
    console.log('  测试仪表板状态...');
    const dashboardState = this.gameEngine.getBalanceDashboardState();
    
    if (!dashboardState) {
      throw new Error('仪表板状态获取失败');
    }
    
    // 测试报告生成
    console.log('  测试报告生成...');
    const report = this.gameEngine.generateBalanceReport();
    
    if (!report || report.length < 50) {
      throw new Error('集成报告生成失败');
    }
    
    console.log('✅ 集成平衡系统测试完成\n');
  }

  // 测试优化场景
  private async testOptimizationScenarios(): Promise<void> {
    console.log('🎭 测试优化场景...');

    // 场景1: 生肖不平衡优化
    console.log('  场景1: 生肖不平衡优化...');
    const imbalancedParameters = { ...this.testParameters };
    imbalancedParameters.zodiacMoneyBonus.dragon = 2.0; // 龙生肖过强
    imbalancedParameters.zodiacMoneyBonus.pig = 0.5;    // 猪生肖过弱
    
    const imbalancedOptimizer = new ValueOptimizer(imbalancedParameters);
    const testGameState = this.createTestGameState();
    const metrics = this.balanceAnalyzer.analyzeBalance(testGameState);
    const alerts = this.balanceAnalyzer.detectBalanceIssues(metrics);
    
    const optimizations = imbalancedOptimizer.optimizeParameters(metrics, alerts);
    console.log(`  生肖平衡优化：${optimizations.length} 个调整`);
    
    // 场景2: 经济通胀优化
    console.log('  场景2: 经济通胀优化...');
    const inflatedParameters = { ...this.testParameters };
    inflatedParameters.startingMoney = 50000; // 过高的起始资金
    inflatedParameters.rentMultiplier = 0.1;  // 过低的租金
    
    const inflationOptimizer = new ValueOptimizer(inflatedParameters);
    const inflationOptimizations = inflationOptimizer.optimizeParameters(metrics, alerts);
    console.log(`  通胀控制优化：${inflationOptimizations.length} 个调整`);
    
    // 场景3: 游戏时长优化
    console.log('  场景3: 游戏时长优化...');
    const slowParameters = { ...this.testParameters };
    slowParameters.maxRounds = 500;           // 过长的游戏
    slowParameters.winConditionThreshold = 100000; // 过高的胜利条件
    
    const speedOptimizer = new ValueOptimizer(slowParameters);
    const speedOptimizations = speedOptimizer.optimizeParameters(metrics, alerts);
    console.log(`  游戏节奏优化：${speedOptimizations.length} 个调整`);
    
    console.log('✅ 优化场景测试完成\n');
  }

  // 性能测试
  async runPerformanceTest(): Promise<void> {
    console.log('⚡ 开始性能测试...');

    const iterations = 100;
    const startTime = Date.now();

    // 测试平衡分析性能
    console.log('  测试平衡分析性能...');
    const testGameState = this.createTestGameState();
    
    for (let i = 0; i < iterations; i++) {
      this.balanceAnalyzer.analyzeBalance(testGameState);
    }
    
    const analysisTime = Date.now() - startTime;
    console.log(`  ${iterations} 次平衡分析耗时：${analysisTime}ms`);
    
    // 测试优化算法性能
    console.log('  测试优化算法性能...');
    const optimizationStart = Date.now();
    const metrics = this.balanceAnalyzer.analyzeBalance(testGameState);
    const alerts = this.balanceAnalyzer.detectBalanceIssues(metrics);
    
    for (let i = 0; i < 50; i++) {
      this.valueOptimizer.optimizeParameters(metrics, alerts);
    }
    
    const optimizationTime = Date.now() - optimizationStart;
    console.log(`  50 次参数优化耗时：${optimizationTime}ms`);
    
    console.log('✅ 性能测试完成\n');
  }

  // 辅助方法：创建测试游戏状态
  private createTestGameState(): GameState {
    const players: Player[] = [
      this.createTestPlayer('player1', 'dragon', 12000, 3),
      this.createTestPlayer('player2', 'tiger', 8000, 1),
      this.createTestPlayer('player3', 'rabbit', 15000, 2),
      this.createTestPlayer('player4', 'rat', 6000, 0)
    ];

    return {
      id: 'test-game-balance',
      players,
      board: [], // 简化测试
      currentPlayerIndex: 0,
      round: 25,
      phase: 'roll_dice',
      status: 'playing',
      startTime: Date.now() - 1800000, // 30分钟前开始
      lastUpdateTime: Date.now(),
      events: [],
      specialSystems: {
        prison: { records: {}, statistics: { totalArrests: 0, totalReleases: 0, totalRevenue: 0 } },
        lottery: [],
        insurance: [],
        banking: { loans: [], deposits: [], creditScores: {} },
        teleportation: { nodes: [], network: {} },
        wealthRedistribution: { history: [] },
        specialEvents: { history: [] }
      }
    };
  }

  // 创建测试玩家
  private createTestPlayer(id: string, zodiac: ZodiacSign, money: number, properties: number): Player {
    return {
      id,
      name: `${zodiac}测试玩家`,
      zodiacSign: zodiac,
      isHuman: false,
      money,
      position: Math.floor(Math.random() * 40),
      properties: Array.from({ length: properties }, (_, i) => `property_${id}_${i}`),
      skills: [],
      statusEffects: [],
      isEliminated: false,
      statistics: {
        turnsPlayed: Math.floor(Math.random() * 30) + 20,
        propertiesBought: properties,
        moneyEarned: money + Math.floor(Math.random() * 5000),
        moneySpent: Math.floor(Math.random() * 3000),
        rentPaid: Math.floor(Math.random() * 2000),
        rentCollected: Math.floor(Math.random() * 1500),
        skillsUsed: Math.floor(Math.random() * 10)
      }
    };
  }

  // 创建多个测试游戏状态
  private createMultipleTestGameStates(count: number): GameState[] {
    const states: GameState[] = [];
    
    for (let i = 0; i < count; i++) {
      const state = this.createTestGameState();
      state.id = `test-game-${i}`;
      state.round = 10 + i * 5;
      state.startTime = Date.now() - (3600000 - i * 300000); // 不同的开始时间
      
      // 随机调整玩家状态
      state.players.forEach(player => {
        player.money += Math.floor(Math.random() * 4000) - 2000;
        player.statistics.turnsPlayed += Math.floor(Math.random() * 10);
      });
      
      states.push(state);
    }
    
    return states;
  }

  // 清理测试环境
  cleanup(): void {
    this.gameEngine.destroy();
    console.log('🧹 测试环境清理完成');
  }
}

// 演示函数
export async function runDay4Demo(): Promise<void> {
  console.log('🎯 开始 Day 4 游戏平衡和数值调优演示...\n');

  const demo = new Day4BalanceTest();

  try {
    await demo.runAllTests();
    await demo.runPerformanceTest();
    
    console.log('🎉 Day 4 演示完成！\n');
    console.log('📋 实现的功能总结：');
    console.log('  ✅ 完整的平衡分析系统');
    console.log('  ✅ 智能参数优化算法');
    console.log('  ✅ 高性能游戏模拟器');
    console.log('  ✅ 集成平衡仪表板');
    console.log('  ✅ 参数敏感性分析');
    console.log('  ✅ 自动化优化建议');
    console.log('  ✅ 性能监控和报告');
    
  } catch (error) {
    console.error('❌ 演示过程中出现错误：', error);
  } finally {
    demo.cleanup();
  }
}

// 主测试入口
if (require.main === module) {
  runDay4Demo().catch(console.error);
}

export { Day4BalanceTest };