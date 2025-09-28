/**
 * 规则引擎配置管理系统
 * Rule Engine Configuration Management System
 * 
 * 提供统一的配置管理，支持环境变量和默认值
 * Provides unified configuration management with environment variables and defaults
 */

export interface RuleEngineConfiguration {
  // 执行引擎配置
  execution: {
    maxExecutionTime: {
      standard: number;
      highPerformance: number;
      debug: number;
      test: number;
    };
    maxRetries: number;
    circuitBreakerFailureThreshold: number;
    maxConcurrentExecutions: number;
  };

  // 性能配置
  performance: {
    cacheMaxSize: number;
    batchSize: number;
    enablePerformanceLogging: boolean;
  };

  // 生肖配置
  zodiac: {
    bonusMultipliers: {
      [zodiac: string]: number;
    };
    compatibility: {
      excellent: {
        tradeBonus: number;
        cooperationBonus: number;
      };
      good: {
        tradeBonus: number;
        cooperationBonus: number;
      };
      neutral: {
        tradeBonus: number;
        cooperationBonus: number;
      };
      poor: {
        tradePenalty: number;
        cooperationPenalty: number;
      };
      conflict: {
        tradePenalty: number;
        cooperationPenalty: number;
      };
    };
  };

  // 季节事件配置
  seasonalEvents: {
    durations: {
      [eventName: string]: number;
    };
  };

  // 优先级配置
  priorities: {
    critical: number;
    high: number;
    normal: number;
    low: number;
    background: number;
  };

  // 事件配置
  events: {
    integrationTimeout: number;
    handlerPriorities: {
      critical: number;
      high: number;
      normal: number;
      low: number;
      background: number;
    };
  };

  // 健康检查配置
  healthCheck: {
    successRateThreshold: number;
    cacheHitRateThreshold: number;
  };

  // 安全配置
  security: {
    enableRuleValidation: boolean;
    enableStateEncryption: boolean;
  };

  // 日志配置
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableDebugLogging: boolean;
  };

  // 测试配置
  testing: {
    rulePriority: number;
    timeout: number;
  };
}

/**
 * 配置管理器类
 */
export class RuleEngineConfigManager {
  private static instance: RuleEngineConfigManager;
  private config: RuleEngineConfiguration;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * 获取配置管理器单例
   */
  public static getInstance(): RuleEngineConfigManager {
    if (!RuleEngineConfigManager.instance) {
      RuleEngineConfigManager.instance = new RuleEngineConfigManager();
    }
    return RuleEngineConfigManager.instance;
  }

  /**
   * 加载配置
   */
  private loadConfiguration(): RuleEngineConfiguration {
    return {
      execution: {
        maxExecutionTime: {
          standard: this.getNumericEnvVar('RULE_MAX_EXECUTION_TIME', 10000),
          highPerformance: this.getNumericEnvVar('RULE_MAX_EXECUTION_TIME_HIGH_PERFORMANCE', 5000),
          debug: this.getNumericEnvVar('RULE_MAX_EXECUTION_TIME_DEBUG', 30000),
          test: this.getNumericEnvVar('RULE_MAX_EXECUTION_TIME_TEST', 1000)
        },
        maxRetries: this.getNumericEnvVar('RULE_MAX_RETRIES', 3),
        circuitBreakerFailureThreshold: this.getNumericEnvVar('RULE_CIRCUIT_BREAKER_FAILURE_THRESHOLD', 5),
        maxConcurrentExecutions: this.getNumericEnvVar('MAX_CONCURRENT_EXECUTIONS', 100)
      },

      performance: {
        cacheMaxSize: this.getNumericEnvVar('RULE_CACHE_MAX_SIZE', 50 * 1024 * 1024), // 50MB
        batchSize: this.getNumericEnvVar('RULE_BATCH_SIZE', 10),
        enablePerformanceLogging: this.getBooleanEnvVar('ENABLE_PERFORMANCE_LOGGING', true)
      },

      zodiac: {
        bonusMultipliers: {
          '鼠': this.getNumericEnvVar('ZODIAC_RAT_BONUS_MULTIPLIER', 1.2),
          '牛': this.getNumericEnvVar('ZODIAC_OX_BONUS_MULTIPLIER', 1.1),
          '虎': this.getNumericEnvVar('ZODIAC_TIGER_BONUS_MULTIPLIER', 1.25),
          '兔': this.getNumericEnvVar('ZODIAC_RABBIT_BONUS_MULTIPLIER', 1.15),
          '龙': this.getNumericEnvVar('ZODIAC_DRAGON_BONUS_MULTIPLIER', 1.3),
          '蛇': this.getNumericEnvVar('ZODIAC_SNAKE_BONUS_MULTIPLIER', 1.2),
          '马': this.getNumericEnvVar('ZODIAC_HORSE_BONUS_MULTIPLIER', 1.2),
          '羊': this.getNumericEnvVar('ZODIAC_GOAT_BONUS_MULTIPLIER', 1.1),
          '猴': this.getNumericEnvVar('ZODIAC_MONKEY_BONUS_MULTIPLIER', 1.18),
          '鸡': this.getNumericEnvVar('ZODIAC_ROOSTER_BONUS_MULTIPLIER', 1.12),
          '狗': this.getNumericEnvVar('ZODIAC_DOG_BONUS_MULTIPLIER', 1.15),
          '猪': this.getNumericEnvVar('ZODIAC_PIG_BONUS_MULTIPLIER', 1.1)
        },
        compatibility: {
          excellent: {
            tradeBonus: this.getNumericEnvVar('ZODIAC_EXCELLENT_TRADE_BONUS', 0.2),
            cooperationBonus: this.getNumericEnvVar('ZODIAC_EXCELLENT_COOPERATION_BONUS', 0.25)
          },
          good: {
            tradeBonus: this.getNumericEnvVar('ZODIAC_GOOD_TRADE_BONUS', 0.15),
            cooperationBonus: this.getNumericEnvVar('ZODIAC_GOOD_COOPERATION_BONUS', 0.18)
          },
          neutral: {
            tradeBonus: this.getNumericEnvVar('ZODIAC_NEUTRAL_TRADE_BONUS', 0.0),
            cooperationBonus: this.getNumericEnvVar('ZODIAC_NEUTRAL_COOPERATION_BONUS', 0.0)
          },
          poor: {
            tradePenalty: this.getNumericEnvVar('ZODIAC_POOR_TRADE_PENALTY', 0.1),
            cooperationPenalty: this.getNumericEnvVar('ZODIAC_POOR_COOPERATION_PENALTY', 0.15)
          },
          conflict: {
            tradePenalty: this.getNumericEnvVar('ZODIAC_CONFLICT_TRADE_PENALTY', 0.2),
            cooperationPenalty: this.getNumericEnvVar('ZODIAC_CONFLICT_COOPERATION_PENALTY', 0.3)
          }
        }
      },

      seasonalEvents: {
        durations: {
          springProsperity: this.getNumericEnvVar('SPRING_PROSPERITY_DURATION', 3),
          summerEnergy: this.getNumericEnvVar('SUMMER_ENERGY_DURATION', 2),
          autumnHarvest: this.getNumericEnvVar('AUTUMN_HARVEST_DURATION', 3),
          winterContemplation: this.getNumericEnvVar('WINTER_CONTEMPLATION_DURATION', 2),
          eclipseChaos: this.getNumericEnvVar('ECLIPSE_CHAOS_DURATION', 1)
        }
      },

      priorities: {
        critical: this.getNumericEnvVar('RULE_PRIORITY_CRITICAL', 100),
        high: this.getNumericEnvVar('RULE_PRIORITY_HIGH', 95),
        normal: this.getNumericEnvVar('RULE_PRIORITY_NORMAL', 85),
        low: this.getNumericEnvVar('RULE_PRIORITY_LOW', 75),
        background: this.getNumericEnvVar('RULE_PRIORITY_BACKGROUND', 50)
      },

      events: {
        integrationTimeout: this.getNumericEnvVar('EVENT_INTEGRATION_TIMEOUT', 5000),
        handlerPriorities: {
          critical: this.getNumericEnvVar('EVENT_HANDLER_PRIORITY_CRITICAL', 100),
          high: this.getNumericEnvVar('EVENT_HANDLER_PRIORITY_HIGH', 90),
          normal: this.getNumericEnvVar('EVENT_HANDLER_PRIORITY_NORMAL', 80),
          low: this.getNumericEnvVar('EVENT_HANDLER_PRIORITY_LOW', 75),
          background: this.getNumericEnvVar('EVENT_HANDLER_PRIORITY_BACKGROUND', 10)
        }
      },

      healthCheck: {
        successRateThreshold: this.getNumericEnvVar('HEALTH_CHECK_SUCCESS_RATE_THRESHOLD', 0.9),
        cacheHitRateThreshold: this.getNumericEnvVar('HEALTH_CHECK_CACHE_HIT_RATE_THRESHOLD', 0.6)
      },

      security: {
        enableRuleValidation: this.getBooleanEnvVar('ENABLE_RULE_VALIDATION', true),
        enableStateEncryption: this.getBooleanEnvVar('ENABLE_STATE_ENCRYPTION', false)
      },

      logging: {
        level: (process.env.LOG_LEVEL as any) || 'info',
        enableDebugLogging: this.getBooleanEnvVar('ENABLE_DEBUG_LOGGING', false)
      },

      testing: {
        rulePriority: this.getNumericEnvVar('TEST_RULE_PRIORITY', 50),
        timeout: this.getNumericEnvVar('TEST_TIMEOUT', 5000)
      }
    };
  }

  /**
   * 获取数值类型环境变量
   */
  private getNumericEnvVar(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * 获取布尔类型环境变量
   */
  private getBooleanEnvVar(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * 获取字符串类型环境变量
   */
  private getStringEnvVar(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  /**
   * 获取完整配置
   */
  public getConfig(): RuleEngineConfiguration {
    return this.config;
  }

  /**
   * 获取执行引擎配置
   */
  public getExecutionConfig() {
    return this.config.execution;
  }

  /**
   * 获取性能配置
   */
  public getPerformanceConfig() {
    return this.config.performance;
  }

  /**
   * 获取生肖配置
   */
  public getZodiacConfig() {
    return this.config.zodiac;
  }

  /**
   * 获取季节事件配置
   */
  public getSeasonalEventsConfig() {
    return this.config.seasonalEvents;
  }

  /**
   * 获取优先级配置
   */
  public getPrioritiesConfig() {
    return this.config.priorities;
  }

  /**
   * 获取事件配置
   */
  public getEventsConfig() {
    return this.config.events;
  }

  /**
   * 获取健康检查配置
   */
  public getHealthCheckConfig() {
    return this.config.healthCheck;
  }

  /**
   * 获取安全配置
   */
  public getSecurityConfig() {
    return this.config.security;
  }

  /**
   * 获取日志配置
   */
  public getLoggingConfig() {
    return this.config.logging;
  }

  /**
   * 获取测试配置
   */
  public getTestingConfig() {
    return this.config.testing;
  }

  /**
   * 重新加载配置
   */
  public reloadConfig(): void {
    this.config = this.loadConfiguration();
  }

  /**
   * 验证配置
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证执行时间配置
    if (this.config.execution.maxExecutionTime.standard <= 0) {
      errors.push('Standard execution time must be positive');
    }

    // 验证缓存大小
    if (this.config.performance.cacheMaxSize <= 0) {
      errors.push('Cache max size must be positive');
    }

    // 验证生肖倍数
    for (const [zodiac, multiplier] of Object.entries(this.config.zodiac.bonusMultipliers)) {
      if (multiplier <= 0) {
        errors.push(`Zodiac ${zodiac} bonus multiplier must be positive`);
      }
    }

    // 验证优先级范围
    const priorities = Object.values(this.config.priorities);
    for (const priority of priorities) {
      if (priority < 0 || priority > 100) {
        errors.push(`Priority must be between 0 and 100, got ${priority}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取配置摘要
   */
  public getConfigSummary(): object {
    return {
      execution: {
        standardTimeout: this.config.execution.maxExecutionTime.standard,
        maxRetries: this.config.execution.maxRetries
      },
      performance: {
        cacheSize: `${Math.round(this.config.performance.cacheMaxSize / 1024 / 1024)}MB`,
        batchSize: this.config.performance.batchSize
      },
      zodiac: {
        zodiacCount: Object.keys(this.config.zodiac.bonusMultipliers).length,
        avgMultiplier: Object.values(this.config.zodiac.bonusMultipliers).reduce((a, b) => a + b, 0) / 12
      },
      security: {
        validationEnabled: this.config.security.enableRuleValidation,
        encryptionEnabled: this.config.security.enableStateEncryption
      }
    };
  }
}

// 默认导出配置管理器实例
export const ruleEngineConfig = RuleEngineConfigManager.getInstance();
export default ruleEngineConfig;