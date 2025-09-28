/**
 * 综合测试和边界条件处理框架
 * 提供全面的测试工具、边界条件验证和自动化测试
 */

import { UnifiedGameState } from '../types/gameState';
import { Player } from '../types/player';
import { ActionType, GamePhase, PlayerId, Position, Money } from '../types/core';
import { getLogger, createContextLogger, ContextLogger } from './Logger';
import { StateManager } from './StateManager';
import GameRuleEngine, { GameAction, RuleValidationResult } from './GameRuleEngine';

// ===== 测试接口 =====

export interface TestCase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: TestCategory;
  readonly priority: TestPriority;
  readonly setup: () => Promise<TestContext>;
  readonly execute: (context: TestContext) => Promise<TestResult>;
  readonly cleanup?: (context: TestContext) => Promise<void>;
  readonly timeout?: number;
}

export type TestCategory = 
  | 'unit'           // 单元测试
  | 'integration'    // 集成测试
  | 'performance'    // 性能测试
  | 'boundary'       // 边界条件测试
  | 'stress'         // 压力测试
  | 'regression'     // 回归测试
  | 'end_to_end';    // 端到端测试

export type TestPriority = 'low' | 'normal' | 'high' | 'critical';

export interface TestContext {
  readonly testId: string;
  readonly gameState: UnifiedGameState;
  readonly stateManager: StateManager;
  readonly ruleEngine: GameRuleEngine;
  readonly logger: ContextLogger;
  readonly startTime: number;
  readonly testData: Record<string, any>;
}

export interface TestResult {
  readonly testId: string;
  readonly success: boolean;
  readonly duration: number;
  readonly message: string;
  readonly details?: TestDetails;
  readonly errors?: TestError[];
  readonly performance?: PerformanceMetrics;
}

export interface TestDetails {
  readonly assertions: AssertionResult[];
  readonly coverage?: CoverageReport;
  readonly logs?: LogEntry[];
  readonly screenshots?: string[];
}

export interface TestError {
  readonly type: 'assertion' | 'runtime' | 'timeout' | 'setup' | 'cleanup';
  readonly message: string;
  readonly stack?: string;
  readonly context?: Record<string, any>;
}

export interface AssertionResult {
  readonly description: string;
  readonly passed: boolean;
  readonly expected: any;
  readonly actual: any;
  readonly operator: string;
}

export interface CoverageReport {
  readonly totalFunctions: number;
  readonly coveredFunctions: number;
  readonly totalLines: number;
  readonly coveredLines: number;
  readonly percentage: number;
}

export interface PerformanceMetrics {
  readonly executionTime: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
  readonly networkCalls: number;
}

// ===== 边界条件接口 =====

export interface BoundaryCondition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly validator: (context: TestContext) => BoundaryValidationResult;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface BoundaryValidationResult {
  readonly isValid: boolean;
  readonly violations: BoundaryViolation[];
  readonly warnings: BoundaryWarning[];
  readonly metrics?: Record<string, number>;
}

export interface BoundaryViolation {
  readonly condition: string;
  readonly message: string;
  readonly actualValue: any;
  readonly expectedRange: string;
  readonly impact: string;
}

export interface BoundaryWarning {
  readonly condition: string;
  readonly message: string;
  readonly recommendation: string;
}

// ===== 断言工具 =====

export class AssertionEngine {
  private results: AssertionResult[] = [];
  private logger: ContextLogger;

  constructor(testId: string) {
    this.logger = createContextLogger({ 
      component: 'AssertionEngine',
      testId 
    });
  }

  /**
   * 基础断言
   */
  assert(condition: boolean, description: string): void {
    const result: AssertionResult = {
      description,
      passed: condition,
      expected: true,
      actual: condition,
      operator: 'toBe'
    };

    this.results.push(result);

    if (!condition) {
      this.logger.error(`Assertion failed: ${description}`);
      throw new Error(`Assertion failed: ${description}`);
    } else {
      this.logger.debug(`Assertion passed: ${description}`);
    }
  }

  /**
   * 相等断言
   */
  assertEqual<T>(actual: T, expected: T, description: string): void {
    const passed = actual === expected;
    
    const result: AssertionResult = {
      description,
      passed,
      expected,
      actual,
      operator: 'toEqual'
    };

    this.results.push(result);

    if (!passed) {
      const message = `Expected ${expected}, but got ${actual}`;
      this.logger.error(`Assertion failed: ${description} - ${message}`);
      throw new Error(`Assertion failed: ${description} - ${message}`);
    } else {
      this.logger.debug(`Assertion passed: ${description}`);
    }
  }

  /**
   * 深度相等断言
   */
  assertDeepEqual<T>(actual: T, expected: T, description: string): void {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    
    const result: AssertionResult = {
      description,
      passed,
      expected,
      actual,
      operator: 'toDeepEqual'
    };

    this.results.push(result);

    if (!passed) {
      const message = `Deep equality check failed`;
      this.logger.error(`Assertion failed: ${description} - ${message}`, {
        expected,
        actual
      });
      throw new Error(`Assertion failed: ${description} - ${message}`);
    } else {
      this.logger.debug(`Assertion passed: ${description}`);
    }
  }

  /**
   * 范围断言
   */
  assertInRange(actual: number, min: number, max: number, description: string): void {
    const passed = actual >= min && actual <= max;
    
    const result: AssertionResult = {
      description,
      passed,
      expected: `${min} <= value <= ${max}`,
      actual,
      operator: 'toBeInRange'
    };

    this.results.push(result);

    if (!passed) {
      const message = `Expected value to be between ${min} and ${max}, but got ${actual}`;
      this.logger.error(`Assertion failed: ${description} - ${message}`);
      throw new Error(`Assertion failed: ${description} - ${message}`);
    } else {
      this.logger.debug(`Assertion passed: ${description}`);
    }
  }

  /**
   * 抛出异常断言
   */
  async assertThrows(
    fn: () => Promise<any> | any,
    expectedError?: string,
    description: string = 'should throw error'
  ): Promise<void> {
    let threw = false;
    let actualError: any = null;

    try {
      const result = fn();
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      threw = true;
      actualError = error;
    }

    const passed = threw && (!expectedError || (actualError && actualError.message.includes(expectedError)));
    
    const result: AssertionResult = {
      description,
      passed,
      expected: expectedError || 'any error',
      actual: actualError?.message || 'no error',
      operator: 'toThrow'
    };

    this.results.push(result);

    if (!passed) {
      const message = threw 
        ? `Expected error "${expectedError}", but got "${actualError?.message}"`
        : 'Expected function to throw, but it did not';
      this.logger.error(`Assertion failed: ${description} - ${message}`);
      throw new Error(`Assertion failed: ${description} - ${message}`);
    } else {
      this.logger.debug(`Assertion passed: ${description}`);
    }
  }

  /**
   * 获取断言结果
   */
  getResults(): AssertionResult[] {
    return [...this.results];
  }

  /**
   * 清除结果
   */
  clear(): void {
    this.results = [];
  }
}

// ===== 边界条件验证器 =====

export class BoundaryValidator {
  private conditions: Map<string, BoundaryCondition> = new Map();
  private logger: ContextLogger;

  constructor() {
    this.logger = createContextLogger({ component: 'BoundaryValidator' });
    this.initializeDefaultConditions();
  }

  private initializeDefaultConditions(): void {
    // 玩家金钱边界条件
    this.addCondition({
      id: 'player_money_bounds',
      name: '玩家金钱边界检查',
      description: '确保玩家金钱在合理范围内',
      severity: 'error',
      validator: (context) => {
        const violations: BoundaryViolation[] = [];
        const warnings: BoundaryWarning[] = [];

        for (const player of context.gameState.players) {
          if (player.money < 0) {
            violations.push({
              condition: 'player_money_negative',
              message: `玩家 ${player.name} 的金钱为负数`,
              actualValue: player.money,
              expectedRange: '>= 0',
              impact: '可能导致游戏逻辑错误'
            });
          }

          if (player.money > 1000000) {
            warnings.push({
              condition: 'player_money_excessive',
              message: `玩家 ${player.name} 的金钱过多`,
              recommendation: '检查是否存在金钱溢出'
            });
          }
        }

        return {
          isValid: violations.length === 0,
          violations,
          warnings
        };
      }
    });

    // 玩家位置边界条件
    this.addCondition({
      id: 'player_position_bounds',
      name: '玩家位置边界检查',
      description: '确保玩家位置在棋盘范围内',
      severity: 'critical',
      validator: (context) => {
        const violations: BoundaryViolation[] = [];
        const boardSize = context.gameState.board.length;

        for (const player of context.gameState.players) {
          if (player.position < 0 || player.position >= boardSize) {
            violations.push({
              condition: 'player_position_out_of_bounds',
              message: `玩家 ${player.name} 的位置超出棋盘范围`,
              actualValue: player.position,
              expectedRange: `0 <= position < ${boardSize}`,
              impact: '会导致游戏崩溃'
            });
          }
        }

        return {
          isValid: violations.length === 0,
          violations,
          warnings: []
        };
      }
    });

    // 游戏回合边界条件
    this.addCondition({
      id: 'game_round_bounds',
      name: '游戏回合边界检查',
      description: '确保游戏回合数在合理范围内',
      severity: 'warning',
      validator: (context) => {
        const violations: BoundaryViolation[] = [];
        const warnings: BoundaryWarning[] = [];

        if (context.gameState.round < 1) {
          violations.push({
            condition: 'invalid_round_number',
            message: '游戏回合数小于1',
            actualValue: context.gameState.round,
            expectedRange: '>= 1',
            impact: '游戏状态不一致'
          });
        }

        if (context.gameState.round > 1000) {
          warnings.push({
            condition: 'excessive_rounds',
            message: '游戏回合数过多',
            recommendation: '检查是否存在死循环'
          });
        }

        return {
          isValid: violations.length === 0,
          violations,
          warnings
        };
      }
    });

    this.logger.info('Default boundary conditions initialized');
  }

  /**
   * 添加边界条件
   */
  addCondition(condition: BoundaryCondition): void {
    this.conditions.set(condition.id, condition);
    this.logger.debug(`Boundary condition added: ${condition.name}`);
  }

  /**
   * 移除边界条件
   */
  removeCondition(id: string): boolean {
    const removed = this.conditions.delete(id);
    if (removed) {
      this.logger.debug(`Boundary condition removed: ${id}`);
    }
    return removed;
  }

  /**
   * 验证所有边界条件
   */
  validateAll(context: TestContext): BoundaryValidationResult {
    const allViolations: BoundaryViolation[] = [];
    const allWarnings: BoundaryWarning[] = [];
    const metrics: Record<string, number> = {};

    for (const [id, condition] of this.conditions) {
      try {
        const startTime = performance.now();
        const result = condition.validator(context);
        const duration = performance.now() - startTime;

        metrics[`${id}_duration`] = duration;

        allViolations.push(...result.violations);
        allWarnings.push(...result.warnings);

        if (result.metrics) {
          Object.assign(metrics, result.metrics);
        }

      } catch (error) {
        this.logger.error(`Boundary condition validation error: ${id}`, {
          conditionId: id
        }, error as Error);

        allViolations.push({
          condition: id,
          message: `边界条件验证失败: ${(error as Error).message}`,
          actualValue: 'error',
          expectedRange: 'valid execution',
          impact: '验证系统可能存在问题'
        });
      }
    }

    return {
      isValid: allViolations.length === 0,
      violations: allViolations,
      warnings: allWarnings,
      metrics
    };
  }
}

// ===== 测试运行器 =====

export class TestRunner {
  private testCases = new Map<string, TestCase>();
  private results = new Map<string, TestResult>();
  private logger: ContextLogger;
  private isRunning = false;

  constructor() {
    this.logger = createContextLogger({ component: 'TestRunner' });
  }

  /**
   * 注册测试用例
   */
  registerTest(testCase: TestCase): void {
    this.testCases.set(testCase.id, testCase);
    this.logger.debug(`Test case registered: ${testCase.name}`, {
      testId: testCase.id,
      category: testCase.category,
      priority: testCase.priority
    });
  }

  /**
   * 运行单个测试
   */
  async runTest(testId: string): Promise<TestResult> {
    const testCase = this.testCases.get(testId);
    if (!testCase) {
      throw new Error(`Test case not found: ${testId}`);
    }

    const startTime = performance.now();
    let context: TestContext | null = null;

    this.logger.info(`Running test: ${testCase.name}`, { testId });

    try {
      // 设置测试环境
      context = await this.setupTest(testCase);

      // 执行测试
      const result = await this.executeTestWithTimeout(testCase, context);
      
      // 记录结果
      this.results.set(testId, result);
      
      this.logger.info(`Test completed: ${testCase.name}`, {
        testId,
        success: result.success,
        duration: result.duration
      });

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      const result: TestResult = {
        testId,
        success: false,
        duration,
        message: `Test execution failed: ${(error as Error).message}`,
        errors: [{
          type: 'runtime',
          message: (error as Error).message,
          stack: (error as Error).stack
        }]
      };

      this.results.set(testId, result);
      
      this.logger.error(`Test failed: ${testCase.name}`, {
        testId,
        duration
      }, error as Error);

      return result;

    } finally {
      // 清理测试环境
      if (context && testCase.cleanup) {
        try {
          await testCase.cleanup(context);
        } catch (error) {
          this.logger.error(`Test cleanup failed: ${testCase.name}`, {
            testId
          }, error as Error);
        }
      }
    }
  }

  /**
   * 运行多个测试
   */
  async runTests(
    filter?: {
      categories?: TestCategory[];
      priorities?: TestPriority[];
      pattern?: string;
    }
  ): Promise<Map<string, TestResult>> {
    if (this.isRunning) {
      throw new Error('Test runner is already running');
    }

    this.isRunning = true;
    const results = new Map<string, TestResult>();

    try {
      const filteredTests = this.filterTests(filter);
      const sortedTests = this.sortTestsByPriority(filteredTests);

      this.logger.info(`Running ${sortedTests.length} tests`, {
        totalTests: this.testCases.size,
        filteredTests: sortedTests.length
      });

      for (const testCase of sortedTests) {
        const result = await this.runTest(testCase.id);
        results.set(testCase.id, result);
      }

      const summary = this.generateSummary(results);
      this.logger.info('Test run completed', summary);

      return results;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 设置测试环境
   */
  private async setupTest(testCase: TestCase): Promise<TestContext> {
    const context = await testCase.setup();
    
    this.logger.debug(`Test setup completed: ${testCase.name}`, {
      testId: testCase.id
    });

    return context;
  }

  /**
   * 带超时的测试执行
   */
  private async executeTestWithTimeout(
    testCase: TestCase,
    context: TestContext
  ): Promise<TestResult> {
    const timeout = testCase.timeout || 30000; // 默认30秒超时

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timeout after ${timeout}ms`));
      }, timeout);

      testCase.execute(context)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * 过滤测试用例
   */
  private filterTests(filter?: {
    categories?: TestCategory[];
    priorities?: TestPriority[];
    pattern?: string;
  }): TestCase[] {
    let tests = Array.from(this.testCases.values());

    if (filter) {
      if (filter.categories) {
        tests = tests.filter(test => filter.categories!.includes(test.category));
      }

      if (filter.priorities) {
        tests = tests.filter(test => filter.priorities!.includes(test.priority));
      }

      if (filter.pattern) {
        const regex = new RegExp(filter.pattern, 'i');
        tests = tests.filter(test => 
          regex.test(test.name) || regex.test(test.description)
        );
      }
    }

    return tests;
  }

  /**
   * 按优先级排序测试
   */
  private sortTestsByPriority(tests: TestCase[]): TestCase[] {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    
    return tests.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * 生成测试摘要
   */
  private generateSummary(results: Map<string, TestResult>): {
    total: number;
    passed: number;
    failed: number;
    duration: number;
    passRate: number;
  } {
    const total = results.size;
    let passed = 0;
    let failed = 0;
    let totalDuration = 0;

    for (const result of results.values()) {
      if (result.success) {
        passed++;
      } else {
        failed++;
      }
      totalDuration += result.duration;
    }

    return {
      total,
      passed,
      failed,
      duration: totalDuration,
      passRate: total > 0 ? (passed / total) * 100 : 0
    };
  }

  /**
   * 获取测试结果
   */
  getResults(): Map<string, TestResult> {
    return new Map(this.results);
  }

  /**
   * 清除结果
   */
  clearResults(): void {
    this.results.clear();
  }
}

// ===== 综合测试框架 =====

/**
 * 主要测试框架类
 */
export class GameTestFramework {
  private testRunner: TestRunner;
  private boundaryValidator: BoundaryValidator;
  private logger: ContextLogger;

  constructor() {
    this.testRunner = new TestRunner();
    this.boundaryValidator = new BoundaryValidator();
    this.logger = createContextLogger({ component: 'GameTestFramework' });
    
    this.initializeBuiltInTests();
  }

  /**
   * 初始化内置测试
   */
  private initializeBuiltInTests(): void {
    // 基础游戏状态测试
    this.testRunner.registerTest({
      id: 'basic_game_state',
      name: '基础游戏状态测试',
      description: '验证基础游戏状态的完整性',
      category: 'unit',
      priority: 'high',
      setup: async () => this.createBasicTestContext(),
      execute: async (context) => {
        const assertions = new AssertionEngine(context.testId);
        const startTime = performance.now();

        try {
          // 验证游戏状态基础字段
          assertions.assert(!!context.gameState.gameId, '游戏ID不为空');
          assertions.assert(context.gameState.players.length > 0, '至少有一个玩家');
          assertions.assert(context.gameState.board.length > 0, '棋盘不为空');
          assertions.assertInRange(
            context.gameState.currentPlayerIndex,
            0,
            context.gameState.players.length - 1,
            '当前玩家索引在有效范围内'
          );

          // 验证玩家状态
          for (const player of context.gameState.players) {
            assertions.assert(!!player.id, `玩家 ${player.name} 有ID`);
            assertions.assert(player.money >= 0, `玩家 ${player.name} 金钱非负`);
            assertions.assertInRange(
              player.position,
              0,
              context.gameState.board.length - 1,
              `玩家 ${player.name} 位置有效`
            );
          }

          const duration = performance.now() - startTime;

          return {
            testId: context.testId,
            success: true,
            duration,
            message: '基础游戏状态验证通过',
            details: {
              assertions: assertions.getResults()
            }
          };

        } catch (error) {
          const duration = performance.now() - startTime;
          return {
            testId: context.testId,
            success: false,
            duration,
            message: `基础游戏状态验证失败: ${(error as Error).message}`,
            errors: [{
              type: 'assertion',
              message: (error as Error).message
            }],
            details: {
              assertions: assertions.getResults()
            }
          };
        }
      }
    });

    // 边界条件测试
    this.testRunner.registerTest({
      id: 'boundary_conditions',
      name: '边界条件测试',
      description: '验证游戏边界条件',
      category: 'boundary',
      priority: 'critical',
      setup: async () => this.createBoundaryTestContext(),
      execute: async (context) => {
        const startTime = performance.now();

        try {
          const validation = this.boundaryValidator.validateAll(context);
          const duration = performance.now() - startTime;

          return {
            testId: context.testId,
            success: validation.isValid,
            duration,
            message: validation.isValid 
              ? '边界条件验证通过' 
              : `发现 ${validation.violations.length} 个边界条件违规`,
            details: {
              assertions: validation.violations.map(v => ({
                description: v.condition,
                passed: false,
                expected: v.expectedRange,
                actual: v.actualValue,
                operator: 'toBeInRange'
              }))
            }
          };

        } catch (error) {
          const duration = performance.now() - startTime;
          return {
            testId: context.testId,
            success: false,
            duration,
            message: `边界条件验证失败: ${(error as Error).message}`,
            errors: [{
              type: 'runtime',
              message: (error as Error).message
            }]
          };
        }
      }
    });

    this.logger.info('Built-in tests initialized');
  }

  /**
   * 创建基础测试上下文
   */
  private async createBasicTestContext(): Promise<TestContext> {
    const stateManager = new StateManager('test_game');
    const ruleEngine = new GameRuleEngine();
    
    // 初始化基础游戏状态
    stateManager.updateState({
      players: [
        {
          id: 'test_player_1',
          name: '测试玩家1',
          zodiac: '龙',
          isHuman: true,
          position: 0,
          money: 1500,
          properties: [],
          items: [],
          skills: [],
          statusEffects: [],
          statistics: {
            turnsPlayed: 0,
            moneyEarned: 0,
            moneySpent: 0,
            propertiesBought: 0,
            propertiesSold: 0,
            rentPaid: 0,
            rentReceived: 0,
            skillsUsed: 0,
            eventsTriggered: 0
          },
          isInJail: false,
          jailTurns: 0,
          consecutiveDoubles: 0,
          hasRolledThisTurn: false,
          hasMovedThisTurn: false,
          canUseSkills: true
        }
      ],
      board: Array.from({ length: 40 }, (_, i) => ({
        position: i,
        type: i === 0 ? 'start' : 'property',
        name: i === 0 ? '起点' : `地产${i}`,
        price: i === 0 ? undefined : 100 + i * 10
      })),
      isInitialized: true
    });

    return {
      testId: 'basic_test_' + Date.now(),
      gameState: stateManager.getGameState(),
      stateManager,
      ruleEngine,
      logger: createContextLogger({ component: 'TestContext' }),
      startTime: Date.now(),
      testData: {}
    };
  }

  /**
   * 创建边界条件测试上下文
   */
  private async createBoundaryTestContext(): Promise<TestContext> {
    const context = await this.createBasicTestContext();
    
    // 创建一些边界条件场景
    const extremePlayer = {
      ...context.gameState.players[0],
      id: 'extreme_player',
      name: '极端测试玩家',
      money: -100, // 负数金钱
      position: 999, // 超出棋盘范围的位置
    };

    context.stateManager.updateState({
      players: [...context.gameState.players, extremePlayer as any],
      round: -5 // 负数回合
    });

    return context;
  }

  /**
   * 获取测试运行器
   */
  getTestRunner(): TestRunner {
    return this.testRunner;
  }

  /**
   * 获取边界验证器
   */
  getBoundaryValidator(): BoundaryValidator {
    return this.boundaryValidator;
  }

  /**
   * 运行完整测试套件
   */
  async runFullTestSuite(): Promise<{
    results: Map<string, TestResult>;
    summary: {
      total: number;
      passed: number;
      failed: number;
      duration: number;
      passRate: number;
    };
  }> {
    this.logger.info('Running full test suite');

    const results = await this.testRunner.runTests();
    
    // 生成汇总报告
    const summary = this.generateFullSummary(results);
    
    this.logger.info('Full test suite completed', summary);

    return { results, summary };
  }

  /**
   * 生成完整摘要
   */
  private generateFullSummary(results: Map<string, TestResult>): {
    total: number;
    passed: number;
    failed: number;
    duration: number;
    passRate: number;
  } {
    const total = results.size;
    let passed = 0;
    let failed = 0;
    let totalDuration = 0;

    for (const result of results.values()) {
      if (result.success) {
        passed++;
      } else {
        failed++;
      }
      totalDuration += result.duration;
    }

    return {
      total,
      passed,
      failed,
      duration: totalDuration,
      passRate: total > 0 ? (passed / total) * 100 : 0
    };
  }
}

// ===== 导出 =====

export default GameTestFramework;