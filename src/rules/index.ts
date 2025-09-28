/**
 * 规则系统统一入口 - 十二生肖大富翁游戏规则引擎
 * 
 * 本文件提供了完整的规则系统API，包括：
 * - 核心规则验证和执行
 * - 高级特性（事务、冲突解决、性能优化）
 * - 生肖季节特性
 * - 综合测试套件
 */

// 配置管理
import { ruleEngineConfig } from '../config/RuleEngineConfig';

// 核心规则系统
export { GameRuleSystem } from './GameRuleSystem';
export { GameStateValidator } from './GameStateValidator';
export { ActionRuleChecker } from './ActionRuleChecker';
export { RuleExecutionEngine } from './RuleExecutionEngine';
export { BaseGameRules, ALL_BASE_RULES } from './BaseGameRules';

// 高级规则特性
export { RuleConflictResolver } from './RuleConflictResolver';
export { RulePerformanceOptimizer } from './RulePerformanceOptimizer';
export {
  PriorityQueue,
  DeadlockDetector,
  CircuitBreaker,
  TransactionManager,
  TransactionContext,
  PerformanceCollector
} from './AdvancedRuleFeatures';

// 生肖季节规则
export {
  ZodiacSeasonalRuleGenerator,
  ZodiacCompatibilityCalculator,
  ZODIAC_SEASONAL_MAPPING,
  ZODIAC_ELEMENT_MAPPING,
  ELEMENTAL_CYCLES,
  ZODIAC_COMPATIBILITY_MATRIX,
  SEASONAL_EVENTS
} from './ZodiacSeasonalRules';

// 规则事件集成
export { RuleEventIntegration } from './RuleEventIntegration';

// 测试和质量保证
export {
  RuleSystemComprehensiveTester,
  runRuleSystemTests
} from './RuleSystemComprehensiveTests';

// 类型定义
export type {
  RuleDefinition,
  RuleExecutionContext,
  RuleValidationResult,
  RuleExecutionResult,
  RuleCondition,
  RuleConditionType,
  RuleCategory,
  StateChange
} from './GameRuleSystem';

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  CriticalIssue,
  ValidationOptions,
  ValidationCategory
} from './GameStateValidator';

export type {
  ActionPermission,
  ActionExecutionPlan,
  ExecutionStep,
  PermissionCache
} from './ActionRuleChecker';

export type {
  ExecutionContext,
  ExecutionResult,
  ExecutionPolicy,
  RetryPolicy,
  StateChangeRecord,
  PerformanceMetrics
} from './RuleExecutionEngine';

export type {
  RuleConflict,
  ConflictResolution,
  ConflictType,
  ConflictSeverity,
  ResolutionStrategy
} from './RuleConflictResolver';

export type {
  CacheConfiguration,
  PerformanceProfile,
  OptimizationSuggestion,
  BatchRequest,
  BatchResult
} from './RulePerformanceOptimizer';

export type {
  ZodiacSeasonalBonus,
  WeatherSensitivity,
  SeasonalEvent,
  ZodiacCompatibility,
  ElementalCycle,
  ZodiacElement
} from './ZodiacSeasonalRules';

export type {
  TestResult,
  TestSuite,
  TestReport,
  TestCategory
} from './RuleSystemComprehensiveTests';

/**
 * 规则引擎工厂类 - 提供便捷的规则系统创建和配置
 */
export class RuleEngineFactory {
  /**
   * 创建标准游戏规则引擎
   */
  static createStandardEngine(): RuleExecutionEngine {
    const config = ruleEngineConfig.getExecutionConfig();
    return new RuleExecutionEngine({
      strictValidation: true,
      allowPartialExecution: false,
      enableAutoCorrection: true,
      performanceOptimization: true,
      cacheResults: true,
      rollbackOnFailure: true,
      maxExecutionTime: config.maxExecutionTime.standard,
      transactionMode: false,
      deadlockDetection: true,
      priorityExecution: false,
      circuitBreakerEnabled: true
    });
  }

  /**
   * 创建高性能规则引擎（启用所有优化）
   */
  static createHighPerformanceEngine(): RuleExecutionEngine {
    const config = ruleEngineConfig.getExecutionConfig();
    return new RuleExecutionEngine({
      strictValidation: false, // 为性能牺牲一些验证
      allowPartialExecution: true,
      enableAutoCorrection: false,
      performanceOptimization: true,
      cacheResults: true,
      rollbackOnFailure: false,
      maxExecutionTime: config.maxExecutionTime.highPerformance,
      transactionMode: true,
      deadlockDetection: true,
      priorityExecution: true,
      circuitBreakerEnabled: true
    });
  }

  /**
   * 创建开发调试引擎（启用详细验证和日志）
   */
  static createDebugEngine(): RuleExecutionEngine {
    const config = ruleEngineConfig.getExecutionConfig();
    return new RuleExecutionEngine({
      strictValidation: true,
      allowPartialExecution: false,
      enableAutoCorrection: true,
      performanceOptimization: false,
      cacheResults: false, // 禁用缓存以便调试
      rollbackOnFailure: true,
      maxExecutionTime: config.maxExecutionTime.debug,
      transactionMode: true,
      deadlockDetection: true,
      priorityExecution: false,
      circuitBreakerEnabled: false
    });
  }

  /**
   * 创建测试专用引擎
   */
  static createTestEngine(): RuleExecutionEngine {
    const config = ruleEngineConfig.getExecutionConfig();
    return new RuleExecutionEngine({
      strictValidation: true,
      allowPartialExecution: true,
      enableAutoCorrection: true,
      performanceOptimization: false,
      cacheResults: false,
      rollbackOnFailure: true,
      maxExecutionTime: config.maxExecutionTime.test,
      transactionMode: false,
      deadlockDetection: false,
      priorityExecution: false,
      circuitBreakerEnabled: false
    });
  }
}

/**
 * 规则系统管理器 - 提供统一的规则系统管理接口
 */
export class RuleSystemManager {
  private ruleSystem: GameRuleSystem;
  private stateValidator: GameStateValidator;
  private actionChecker: ActionRuleChecker;
  private executionEngine: RuleExecutionEngine;
  private conflictResolver: RuleConflictResolver;
  private performanceOptimizer: RulePerformanceOptimizer;

  constructor(
    engineType: 'standard' | 'high-performance' | 'debug' | 'test' = 'standard'
  ) {
    this.ruleSystem = new GameRuleSystem();
    this.stateValidator = new GameStateValidator();
    this.actionChecker = new ActionRuleChecker();
    this.conflictResolver = new RuleConflictResolver();
    this.performanceOptimizer = new RulePerformanceOptimizer();

    // 根据类型创建执行引擎
    switch (engineType) {
      case 'high-performance':
        this.executionEngine = RuleEngineFactory.createHighPerformanceEngine();
        break;
      case 'debug':
        this.executionEngine = RuleEngineFactory.createDebugEngine();
        break;
      case 'test':
        this.executionEngine = RuleEngineFactory.createTestEngine();
        break;
      default:
        this.executionEngine = RuleEngineFactory.createStandardEngine();
    }

    this.initializeSystem();
  }

  /**
   * 初始化规则系统
   */
  private initializeSystem(): void {
    // 注册基础规则
    const baseRules = ALL_BASE_RULES;
    for (const rule of baseRules) {
      this.ruleSystem.registerRule(rule);
    }

    // 注册生肖季节规则
    const zodiacRules = ZodiacSeasonalRuleGenerator.generateAllRules();
    for (const rule of zodiacRules) {
      this.ruleSystem.registerRule(rule);
    }
  }

  /**
   * 获取规则系统组件
   */
  getRuleSystem(): GameRuleSystem {
    return this.ruleSystem;
  }

  getStateValidator(): GameStateValidator {
    return this.stateValidator;
  }

  getActionChecker(): ActionRuleChecker {
    return this.actionChecker;
  }

  getExecutionEngine(): RuleExecutionEngine {
    return this.executionEngine;
  }

  getConflictResolver(): RuleConflictResolver {
    return this.conflictResolver;
  }

  getPerformanceOptimizer(): RulePerformanceOptimizer {
    return this.performanceOptimizer;
  }

  /**
   * 运行系统健康检查
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const ruleStats = this.ruleSystem.getRuleStatistics();
    const validatorStats = this.stateValidator.getValidationStatistics();
    const executionStats = this.executionEngine.getExecutionStatistics();
    const performanceStats = this.performanceOptimizer.getPerformanceStatistics();

    return {
      status: 'healthy',
      timestamp: Date.now(),
      components: {
        ruleSystem: {
          status: ruleStats.totalRules > 0 ? 'healthy' : 'warning',
          rulesCount: ruleStats.totalRules,
          details: ruleStats
        },
        stateValidator: {
          status: 'healthy',
          validationsCount: validatorStats.totalValidations,
          details: validatorStats
        },
        executionEngine: {
          status: executionStats.failedExecutions / executionStats.totalExecutions < 0.1 ? 'healthy' : 'warning',
          executionsCount: executionStats.totalExecutions,
          successRate: executionStats.successfulExecutions / executionStats.totalExecutions,
          details: executionStats
        },
        performanceOptimizer: {
          status: performanceStats.cacheHitRate > 0.6 ? 'healthy' : 'warning',
          cacheHitRate: performanceStats.cacheHitRate,
          details: performanceStats
        }
      },
      recommendations: []
    };
  }

  /**
   * 获取系统统计信息
   */
  getSystemStatistics(): SystemStatistics {
    return {
      rules: this.ruleSystem.getRuleStatistics(),
      validation: this.stateValidator.getValidationStatistics(),
      execution: this.executionEngine.getExecutionStatistics(),
      conflicts: this.conflictResolver.getConflictStatistics(),
      performance: this.performanceOptimizer.getPerformanceStatistics()
    };
  }

  /**
   * 运行综合测试
   */
  async runTests(): Promise<TestReport> {
    return await runRuleSystemTests();
  }
}

// 辅助类型定义
export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error';
  timestamp: number;
  components: {
    [componentName: string]: {
      status: 'healthy' | 'warning' | 'error';
      details: any;
      [key: string]: any;
    };
  };
  recommendations: string[];
}

export interface SystemStatistics {
  rules: any;
  validation: any;
  execution: any;
  conflicts: any;
  performance: any;
}

/**
 * 默认导出 - 提供最常用的功能
 */
const defaultExport = {
  // 工厂方法
  createEngine: RuleEngineFactory.createStandardEngine,
  createManager: (type?: 'standard' | 'high-performance' | 'debug' | 'test') => new RuleSystemManager(type),
  
  // 核心类
  GameRuleSystem,
  GameStateValidator,
  ActionRuleChecker,
  RuleExecutionEngine,
  
  // 生肖规则
  ZodiacSeasonalRuleGenerator,
  ZodiacCompatibilityCalculator,
  
  // 测试
  runTests: runRuleSystemTests
};

export default defaultExport;