/**
 * 全面集成测试套件
 * 测试整个游戏系统的集成功能和稳定性
 */

import { GameEngine } from '../engine/GameEngine';
import { AIManager } from '../ai/AIManager';
import { SaveManager } from '../storage/SaveManager';
import { StateSyncManager } from '../sync/StateSyncManager';
import { IntegratedSyncSystem } from '../sync/IntegratedSyncSystem';
import { DataConsistencyChecker } from '../validation/DataConsistencyChecker';
import { EventSystem } from '../events/EventSystem';
import { InteractionFeedbackSystem } from '../feedback/InteractionFeedbackSystem';
import type { GameState, Player, PlayerAction, GameConfig } from '../types/game';
import type { AIOpponentConfig } from '../types/ai';

export interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: any;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  success: boolean;
}

export interface ComprehensiveTestReport {
  suites: TestSuite[];
  summary: {
    totalSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
    totalDuration: number;
    criticalIssues: string[];
    warnings: string[];
    recommendations: string[];
  };
  systemMetrics: {
    memoryUsage: number;
    performanceScore: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

export class ComprehensiveIntegrationTest {
  private gameEngine: GameEngine;
  private aiManager: AIManager;
  private saveManager: SaveManager;
  private syncSystem: IntegratedSyncSystem | null = null;
  private eventSystem: EventSystem;
  private feedbackSystem: InteractionFeedbackSystem;
  private consistencyChecker: DataConsistencyChecker;
  
  private testResults: TestSuite[] = [];
  private startTime: number = 0;
  private memoryBaseline: number = 0;

  constructor() {
    this.gameEngine = new GameEngine();
    this.aiManager = new AIManager();
    this.saveManager = new SaveManager();
    this.eventSystem = new EventSystem();
    this.feedbackSystem = new InteractionFeedbackSystem();
    this.consistencyChecker = new DataConsistencyChecker();
  }

  /**
   * 执行全面集成测试
   */
  async runComprehensiveTests(): Promise<ComprehensiveTestReport> {
    console.log('🚀 开始全面集成测试...');
    this.startTime = Date.now();
    this.memoryBaseline = this.getMemoryUsage();

    try {
      // 1. 游戏引擎集成测试
      await this.runGameEngineTests();
      
      // 2. AI系统集成测试
      await this.runAISystemTests();
      
      // 3. 存储系统集成测试
      await this.runStorageSystemTests();
      
      // 4. 同步系统集成测试
      await this.runSyncSystemTests();
      
      // 5. UI交互测试
      await this.runUIInteractionTests();
      
      // 6. 性能压力测试
      await this.runPerformanceTests();
      
      // 7. 稳定性测试
      await this.runStabilityTests();
      
      // 8. 端到端测试
      await this.runEndToEndTests();

    } catch (error) {
      console.error('❌ 集成测试过程中发生错误:', error);
    }

    return this.generateTestReport();
  }

  /**
   * 游戏引擎集成测试
   */
  private async runGameEngineTests(): Promise<void> {
    const suite: TestSuite = {
      name: '游戏引擎集成测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      success: false
    };

    const startTime = Date.now();

    // 测试1: 游戏引擎初始化
    suite.tests.push(await this.runTest('游戏引擎初始化', async () => {
      const config = this.createTestGameConfig();
      await this.gameEngine.initialize(config);
      
      const state = this.gameEngine.getGameState();
      if (!state) throw new Error('游戏状态未正确初始化');
      if (state.players.length !== 4) throw new Error('玩家数量不正确');
      if (!state.board || state.board.length !== 40) throw new Error('棋盘未正确生成');
      
      return { playersCount: state.players.length, boardSize: state.board.length };
    }));

    // 测试2: 游戏生命周期管理
    suite.tests.push(await this.runTest('游戏生命周期管理', async () => {
      await this.gameEngine.startGame();
      let state = this.gameEngine.getGameState()!;
      if (state.status !== 'playing') throw new Error('游戏未正确启动');

      await this.gameEngine.pauseGame();
      state = this.gameEngine.getGameState()!;
      if (state.status !== 'paused') throw new Error('游戏未正确暂停');

      await this.gameEngine.resumeGame();
      state = this.gameEngine.getGameState()!;
      if (state.status !== 'playing') throw new Error('游戏未正确恢复');

      return { lifecycle: 'success' };
    }));

    // 测试3: 玩家操作处理
    suite.tests.push(await this.runTest('玩家操作处理', async () => {
      const state = this.gameEngine.getGameState()!;
      const currentPlayer = state.players[state.currentPlayerIndex];
      
      // 掷骰子操作
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: currentPlayer.id,
        data: {},
        timestamp: Date.now()
      };

      const result = await this.gameEngine.executeAction(diceAction);
      if (!result.success) throw new Error(`掷骰子失败: ${result.message}`);
      
      const newState = this.gameEngine.getGameState()!;
      if (!newState.lastDiceResult) throw new Error('骰子结果未保存');

      return { 
        diceResult: newState.lastDiceResult,
        actionResult: result.success 
      };
    }));

    // 测试4: 事件发布和监听
    suite.tests.push(await this.runTest('事件发布和监听', async () => {
      let eventReceived = false;
      let eventData: any = null;

      this.gameEngine.on('game:turn_ended', (data) => {
        eventReceived = true;
        eventData = data;
      });

      // 结束当前回合
      await this.gameEngine.endTurn();
      
      // 等待事件处理
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!eventReceived) throw new Error('回合结束事件未正确发布');

      return { eventReceived, eventData };
    }));

    suite.duration = Date.now() - startTime;
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.passed).length;
    suite.failedTests = suite.tests.filter(t => !t.passed).length;
    suite.success = suite.failedTests === 0;

    this.testResults.push(suite);
  }

  /**
   * AI系统集成测试
   */
  private async runAISystemTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'AI系统集成测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      success: false
    };

    const startTime = Date.now();

    // 测试1: AI管理器初始化
    suite.tests.push(await this.runTest('AI管理器初始化', async () => {
      await this.aiManager.initialize();
      const stats = this.aiManager.getStatistics();
      
      return { initialized: true, stats };
    }));

    // 测试2: AI决策功能
    suite.tests.push(await this.runTest('AI决策功能', async () => {
      const gameState = this.gameEngine.getGameState()!;
      const aiPlayer = gameState.players.find(p => !p.isHuman);
      
      if (!aiPlayer) throw new Error('未找到AI玩家');

      const decision = await this.aiManager.makeDecision(aiPlayer.id, gameState);
      if (!decision) throw new Error('AI未做出决策');
      if (!decision.action) throw new Error('AI决策无效');

      return { 
        playerId: aiPlayer.id,
        decision: decision.action.type,
        confidence: decision.confidence 
      };
    }));

    // 测试3: 不同难度AI测试
    suite.tests.push(await this.runTest('不同难度AI测试', async () => {
      const difficulties = ['easy', 'medium', 'hard', 'expert'];
      const results: any[] = [];

      for (const difficulty of difficulties) {
        const aiConfig: AIOpponentConfig = {
          name: `AI_${difficulty}`,
          zodiac: '龙',
          difficulty: difficulty as any,
          isHuman: false
        };

        const aiId = await this.aiManager.createAIOpponent(aiConfig);
        const gameState = this.gameEngine.getGameState()!;
        
        const decision = await this.aiManager.makeDecision(aiId, gameState);
        results.push({
          difficulty,
          aiId,
          decisionMade: !!decision,
          confidence: decision?.confidence || 0
        });
      }

      return { results };
    }));

    // 测试4: AI决策超时处理
    suite.tests.push(await this.runTest('AI决策超时处理', async () => {
      // 创建一个会超时的场景
      const gameState = this.gameEngine.getGameState()!;
      const aiPlayer = gameState.players.find(p => !p.isHuman);
      
      if (!aiPlayer) throw new Error('未找到AI玩家');

      const startTime = Date.now();
      const decision = await this.aiManager.makeDecision(aiPlayer.id, gameState, { timeout: 1000 });
      const duration = Date.now() - startTime;

      // 应该在合理时间内返回决策（包括默认决策）
      if (duration > 2000) throw new Error('AI决策超时处理不当');

      return { 
        duration,
        hasDecision: !!decision,
        isTimeout: duration > 1000
      };
    }));

    suite.duration = Date.now() - startTime;
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.passed).length;
    suite.failedTests = suite.tests.filter(t => !t.passed).length;
    suite.success = suite.failedTests === 0;

    this.testResults.push(suite);
  }

  /**
   * 存储系统集成测试
   */
  private async runStorageSystemTests(): Promise<void> {
    const suite: TestSuite = {
      name: '存储系统集成测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      success: false
    };

    const startTime = Date.now();

    // 测试1: 存储管理器初始化
    suite.tests.push(await this.runTest('存储管理器初始化', async () => {
      await this.saveManager.initialize();
      const analytics = this.saveManager.getAnalytics();
      
      return { initialized: true, analytics };
    }));

    // 测试2: 游戏保存功能
    suite.tests.push(await this.runTest('游戏保存功能', async () => {
      const gameState = this.gameEngine.getGameState()!;
      const saveResult = await this.saveManager.saveGame('test-save-1', gameState);
      
      if (!saveResult.success) throw new Error(`保存失败: ${saveResult.message}`);
      
      return { saveId: saveResult.saveId, size: saveResult.size };
    }));

    // 测试3: 游戏加载功能
    suite.tests.push(await this.runTest('游戏加载功能', async () => {
      const loadResult = await this.saveManager.loadGame('test-save-1');
      
      if (!loadResult.success) throw new Error(`加载失败: ${loadResult.message}`);
      if (!loadResult.gameState) throw new Error('加载的游戏状态为空');
      
      // 验证数据完整性
      const originalState = this.gameEngine.getGameState()!;
      const loadedState = loadResult.gameState;
      
      if (loadedState.gameId !== originalState.gameId) {
        throw new Error('加载的游戏ID不匹配');
      }
      
      return { 
        gameId: loadedState.gameId,
        playersCount: loadedState.players.length 
      };
    }));

    // 测试4: 存档列表管理
    suite.tests.push(await this.runTest('存档列表管理', async () => {
      // 创建多个存档
      const gameState = this.gameEngine.getGameState()!;
      const saveIds: string[] = [];
      
      for (let i = 0; i < 3; i++) {
        const result = await this.saveManager.saveGame(`test-save-${i + 2}`, {
          ...gameState,
          round: gameState.round + i
        });
        if (result.success && result.saveId) {
          saveIds.push(result.saveId);
        }
      }

      const saveList = await this.saveManager.listSaves();
      
      if (saveList.length < 4) throw new Error('存档列表数量不正确');
      
      return { saveIds, totalSaves: saveList.length };
    }));

    // 测试5: 数据压缩和验证
    suite.tests.push(await this.runTest('数据压缩和验证', async () => {
      const gameState = this.gameEngine.getGameState()!;
      
      // 测试大数据保存（模拟复杂游戏状态）
      const complexState = {
        ...gameState,
        eventHistory: Array.from({ length: 1000 }, (_, i) => ({
          id: `event_${i}`,
          type: 'test_event',
          timestamp: Date.now() + i,
          data: { value: i, text: `Event ${i} with some data` }
        }))
      };

      const saveResult = await this.saveManager.saveGame('test-compression', complexState);
      if (!saveResult.success) throw new Error('大数据保存失败');

      const loadResult = await this.saveManager.loadGame('test-compression');
      if (!loadResult.success) throw new Error('大数据加载失败');

      // 验证数据完整性
      const verification = await this.saveManager.verifySave('test-compression');
      if (!verification.valid) throw new Error('数据验证失败');

      return {
        originalSize: JSON.stringify(complexState).length,
        compressedSize: saveResult.size,
        compressionRatio: saveResult.size ? saveResult.size / JSON.stringify(complexState).length : 1,
        verified: verification.valid
      };
    }));

    suite.duration = Date.now() - startTime;
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.passed).length;
    suite.failedTests = suite.tests.filter(t => !t.passed).length;
    suite.success = suite.failedTests === 0;

    this.testResults.push(suite);
  }

  /**
   * 同步系统集成测试
   */
  private async runSyncSystemTests(): Promise<void> {
    const suite: TestSuite = {
      name: '同步系统集成测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      success: false
    };

    const startTime = Date.now();

    // 测试1: 数据一致性检查
    suite.tests.push(await this.runTest('数据一致性检查', async () => {
      const gameState = this.gameEngine.getGameState()!;
      const result = await this.consistencyChecker.checkConsistency(gameState);
      
      if (!result.isValid && result.metrics.criticalViolations > 0) {
        throw new Error(`发现严重数据不一致: ${result.violations[0]?.message}`);
      }

      return {
        isValid: result.isValid,
        totalChecks: result.metrics.totalChecks,
        violations: result.metrics.criticalViolations + result.metrics.errorViolations
      };
    }));

    // 测试2: 状态同步性能
    suite.tests.push(await this.runTest('状态同步性能', async () => {
      const gameState = this.gameEngine.getGameState()!;
      const iterations = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        
        // 模拟状态变更
        const modifiedState = {
          ...gameState,
          lastUpdateTime: Date.now(),
          turn: gameState.turn + i
        };

        await this.consistencyChecker.checkConsistency(modifiedState);
        durations.push(Date.now() - start);
      }

      const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      if (averageDuration > 100) throw new Error('同步性能过慢');

      return {
        averageDuration,
        maxDuration,
        iterations
      };
    }));

    suite.duration = Date.now() - startTime;
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.passed).length;
    suite.failedTests = suite.tests.filter(t => !t.passed).length;
    suite.success = suite.failedTests === 0;

    this.testResults.push(suite);
  }

  /**
   * UI交互测试
   */
  private async runUIInteractionTests(): Promise<void> {
    const suite: TestSuite = {
      name: 'UI交互测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      success: false
    };

    const startTime = Date.now();

    // 测试1: 反馈系统初始化
    suite.tests.push(await this.runTest('反馈系统初始化', async () => {
      await this.feedbackSystem.initialize();
      const config = this.feedbackSystem.getConfiguration();
      
      return { initialized: true, config };
    }));

    // 测试2: 用户交互反馈
    suite.tests.push(await this.runTest('用户交互反馈', async () => {
      const interactions = ['click', 'hover', 'focus', 'success', 'error'];
      const results: any[] = [];

      for (const interaction of interactions) {
        const feedback = await this.feedbackSystem.provideFeedback(interaction, {
          element: 'test-button',
          data: { type: interaction }
        });

        results.push({
          interaction,
          feedbackProvided: !!feedback,
          feedbackType: feedback?.type
        });
      }

      return { results };
    }));

    suite.duration = Date.now() - startTime;
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.passed).length;
    suite.failedTests = suite.tests.filter(t => !t.passed).length;
    suite.success = suite.failedTests === 0;

    this.testResults.push(suite);
  }

  /**
   * 性能压力测试
   */
  private async runPerformanceTests(): Promise<void> {
    const suite: TestSuite = {
      name: '性能压力测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      success: false
    };

    const startTime = Date.now();

    // 测试1: 内存使用测试
    suite.tests.push(await this.runTest('内存使用测试', async () => {
      const beforeMemory = this.getMemoryUsage();
      
      // 执行一系列操作
      for (let i = 0; i < 50; i++) {
        const gameState = this.gameEngine.getGameState()!;
        await this.saveManager.saveGame(`perf-test-${i}`, gameState);
        await this.consistencyChecker.checkConsistency(gameState);
      }

      const afterMemory = this.getMemoryUsage();
      const memoryIncrease = afterMemory - beforeMemory;

      // 内存增长不应超过50MB
      if (memoryIncrease > 50 * 1024 * 1024) {
        throw new Error(`内存增长过多: ${memoryIncrease / 1024 / 1024}MB`);
      }

      return {
        beforeMemory: beforeMemory / 1024 / 1024,
        afterMemory: afterMemory / 1024 / 1024,
        memoryIncrease: memoryIncrease / 1024 / 1024
      };
    }));

    // 测试2: 并发操作测试
    suite.tests.push(await this.runTest('并发操作测试', async () => {
      const concurrentOperations = 20;
      const operations: Promise<any>[] = [];

      const gameState = this.gameEngine.getGameState()!;

      for (let i = 0; i < concurrentOperations; i++) {
        operations.push(
          this.saveManager.saveGame(`concurrent-${i}`, {
            ...gameState,
            turn: gameState.turn + i
          })
        );
      }

      const results = await Promise.allSettled(operations);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > concurrentOperations * 0.1) { // 允许10%失败率
        throw new Error(`并发操作失败率过高: ${failed}/${concurrentOperations}`);
      }

      return {
        total: concurrentOperations,
        successful,
        failed,
        successRate: successful / concurrentOperations
      };
    }));

    suite.duration = Date.now() - startTime;
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.passed).length;
    suite.failedTests = suite.tests.filter(t => !t.passed).length;
    suite.success = suite.failedTests === 0;

    this.testResults.push(suite);
  }

  /**
   * 稳定性测试
   */
  private async runStabilityTests(): Promise<void> {
    const suite: TestSuite = {
      name: '稳定性测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      success: false
    };

    const startTime = Date.now();

    // 测试1: 长时间运行稳定性
    suite.tests.push(await this.runTest('长时间运行稳定性', async () => {
      const iterations = 100;
      let errors = 0;
      const errorTypes: string[] = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const gameState = this.gameEngine.getGameState()!;
          const currentPlayer = gameState.players[gameState.currentPlayerIndex];
          
          // 模拟玩家操作
          const action: PlayerAction = {
            type: 'roll_dice',
            playerId: currentPlayer.id,
            data: {},
            timestamp: Date.now()
          };

          await this.gameEngine.executeAction(action);
          await this.gameEngine.endTurn();

          // 定期保存
          if (i % 10 === 0) {
            await this.saveManager.saveGame(`stability-${i}`, gameState);
          }

        } catch (error) {
          errors++;
          errorTypes.push(error instanceof Error ? error.message : 'Unknown error');
        }
      }

      const errorRate = errors / iterations;
      if (errorRate > 0.05) { // 允许5%错误率
        throw new Error(`稳定性测试错误率过高: ${errorRate * 100}%`);
      }

      return {
        iterations,
        errors,
        errorRate,
        errorTypes: [...new Set(errorTypes)]
      };
    }));

    suite.duration = Date.now() - startTime;
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.passed).length;
    suite.failedTests = suite.tests.filter(t => !t.passed).length;
    suite.success = suite.failedTests === 0;

    this.testResults.push(suite);
  }

  /**
   * 端到端测试
   */
  private async runEndToEndTests(): Promise<void> {
    const suite: TestSuite = {
      name: '端到端测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
      success: false
    };

    const startTime = Date.now();

    // 测试1: 完整游戏流程
    suite.tests.push(await this.runTest('完整游戏流程', async () => {
      // 重新初始化游戏
      const config = this.createTestGameConfig();
      const freshEngine = new GameEngine();
      await freshEngine.initialize(config);
      await freshEngine.startGame();

      let gameState = freshEngine.getGameState()!;
      const maxTurns = 20; // 限制测试轮数
      let turns = 0;

      while (gameState.status === 'playing' && turns < maxTurns) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        if (currentPlayer.isHuman) {
          // 模拟人类玩家操作
          const action: PlayerAction = {
            type: 'roll_dice',
            playerId: currentPlayer.id,
            data: {},
            timestamp: Date.now()
          };
          await freshEngine.executeAction(action);
        } else {
          // AI玩家自动决策
          const decision = await this.aiManager.makeDecision(currentPlayer.id, gameState);
          if (decision && decision.action) {
            await freshEngine.executeAction(decision.action);
          }
        }

        await freshEngine.endTurn();
        gameState = freshEngine.getGameState()!;
        turns++;
      }

      return {
        turns,
        finalStatus: gameState.status,
        playersAlive: gameState.players.filter(p => p.money > 0).length
      };
    }));

    suite.duration = Date.now() - startTime;
    suite.totalTests = suite.tests.length;
    suite.passedTests = suite.tests.filter(t => t.passed).length;
    suite.failedTests = suite.tests.filter(t => !t.passed).length;
    suite.success = suite.failedTests === 0;

    this.testResults.push(suite);
  }

  /**
   * 运行单个测试
   */
  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`  🔸 运行测试: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      console.log(`  ✅ 测试通过: ${testName} (${duration}ms)`);
      return {
        testName,
        passed: true,
        duration,
        details: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.log(`  ❌ 测试失败: ${testName} - ${errorMessage} (${duration}ms)`);
      return {
        testName,
        passed: false,
        duration,
        details: null,
        error: errorMessage
      };
    }
  }

  /**
   * 生成测试报告
   */
  private generateTestReport(): ComprehensiveTestReport {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = this.testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failedTests = this.testResults.reduce((sum, suite) => sum + suite.failedTests, 0);

    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // 分析测试结果
    for (const suite of this.testResults) {
      if (!suite.success) {
        if (suite.name.includes('引擎') || suite.name.includes('AI')) {
          criticalIssues.push(`${suite.name}存在关键问题`);
        } else {
          warnings.push(`${suite.name}存在问题`);
        }
      }

      if (suite.duration > 10000) {
        warnings.push(`${suite.name}执行时间过长 (${suite.duration}ms)`);
      }
    }

    // 性能建议
    const memoryUsage = this.getMemoryUsage() - this.memoryBaseline;
    if (memoryUsage > 100 * 1024 * 1024) {
      recommendations.push('优化内存使用，当前增长过多');
    }

    if (totalDuration > 60000) {
      recommendations.push('优化测试执行时间');
    }

    return {
      suites: this.testResults,
      summary: {
        totalSuites: this.testResults.length,
        totalTests,
        passedTests,
        failedTests,
        successRate: totalTests > 0 ? passedTests / totalTests : 0,
        totalDuration,
        criticalIssues,
        warnings,
        recommendations
      },
      systemMetrics: {
        memoryUsage: memoryUsage / 1024 / 1024, // MB
        performanceScore: this.calculatePerformanceScore(),
        errorRate: totalTests > 0 ? failedTests / totalTests : 0,
        averageResponseTime: totalDuration / totalTests
      }
    };
  }

  /**
   * 创建测试游戏配置
   */
  private createTestGameConfig(): GameConfig {
    return {
      playerName: '测试玩家',
      playerZodiac: '龙',
      aiOpponents: [
        { name: 'AI简单', zodiac: '虎', difficulty: 'easy', isHuman: false },
        { name: 'AI中等', zodiac: '兔', difficulty: 'medium', isHuman: false },
        { name: 'AI困难', zodiac: '蛇', difficulty: 'hard', isHuman: false }
      ],
      gameSettings: {
        startingMoney: 15000,
        maxRounds: 50,
        winCondition: 'last_standing'
      }
    };
  }

  /**
   * 获取内存使用量
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    // 浏览器环境的估算
    return performance.memory ? (performance.memory as any).usedJSHeapSize : 0;
  }

  /**
   * 计算性能评分
   */
  private calculatePerformanceScore(): number {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = this.testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    
    const successRate = totalTests > 0 ? passedTests / totalTests : 0;
    const speedScore = Math.max(0, 100 - (totalDuration / totalTests / 10)); // 每测试10ms扣1分
    const memoryScore = Math.max(0, 100 - ((this.getMemoryUsage() - this.memoryBaseline) / 1024 / 1024)); // 每MB扣1分

    return Math.min(100, (successRate * 60) + (speedScore * 0.2) + (memoryScore * 0.2));
  }

  /**
   * 清理测试资源
   */
  async cleanup(): Promise<void> {
    try {
      // 清理测试存档
      const saves = await this.saveManager.listSaves();
      for (const save of saves) {
        if (save.gameId.startsWith('test-') || save.gameId.startsWith('perf-') || save.gameId.startsWith('concurrent-') || save.gameId.startsWith('stability-')) {
          await this.saveManager.deleteSave(save.gameId);
        }
      }
    } catch (error) {
      console.warn('清理测试资源时出现错误:', error);
    }
  }
}