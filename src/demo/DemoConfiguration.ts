/**
 * 演示版本配置
 * 为演示目的优化的游戏配置和设置
 */

import type { GameConfig } from '../types/storage';
import type { AIOpponentConfig } from '../types/ai';

export interface DemoConfig {
  name: string;
  description: string;
  features: string[];
  gameConfig: GameConfig;
  uiConfig: DemoUIConfig;
  performanceConfig: DemoPerformanceConfig;
  autoPlay: boolean;
  duration: number; // 演示时长(秒)
}

export interface DemoUIConfig {
  theme: 'light' | 'dark' | 'zodiac' | 'auto';
  showDebugInfo: boolean;
  showPerformanceMetrics: boolean;
  enableAnimations: boolean;
  enableSoundEffects: boolean;
  autoAdvanceSteps: boolean;
  highlightFeatures: boolean;
  showTooltips: boolean;
}

export interface DemoPerformanceConfig {
  targetFPS: number;
  enableOptimizations: boolean;
  reducedAnimations: boolean;
  preloadAssets: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  steps: DemoStep[];
  estimatedDuration: number;
  complexity: 'basic' | 'intermediate' | 'advanced';
}

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: DemoAction;
  duration: number;
  skipable: boolean;
  highlights: string[];
}

export interface DemoAction {
  type: 'narration' | 'ui_interaction' | 'game_action' | 'system_demo' | 'wait';
  target?: string;
  data?: any;
  automated: boolean;
}

export class DemoConfiguration {
  // 预定义的演示配置
  static readonly DEMO_CONFIGS: Record<string, DemoConfig> = {
    // 快速演示 - 3分钟核心功能展示
    quick: {
      name: '快速演示',
      description: '3分钟展示游戏核心功能和特色',
      features: [
        '游戏启动和初始化',
        'AI对手智能决策',
        '十二生肖技能系统',
        '响应式界面设计',
        '存档和加载功能'
      ],
      gameConfig: {
        playerName: '演示玩家',
        playerZodiac: '龙',
        aiOpponents: [
          { name: 'AI-虎', zodiac: '虎', difficulty: 'medium', isHuman: false },
          { name: 'AI-兔', zodiac: '兔', difficulty: 'easy', isHuman: false },
          { name: 'AI-蛇', zodiac: '蛇', difficulty: 'hard', isHuman: false }
        ],
        gameSettings: {
          startingMoney: 20000,
          maxRounds: 15,
          winCondition: 'money_threshold'
        }
      },
      uiConfig: {
        theme: 'zodiac',
        showDebugInfo: false,
        showPerformanceMetrics: true,
        enableAnimations: true,
        enableSoundEffects: true,
        autoAdvanceSteps: true,
        highlightFeatures: true,
        showTooltips: true
      },
      performanceConfig: {
        targetFPS: 60,
        enableOptimizations: true,
        reducedAnimations: false,
        preloadAssets: true,
        cacheStrategy: 'aggressive'
      },
      autoPlay: true,
      duration: 180 // 3分钟
    },

    // 完整演示 - 10分钟详细展示
    full: {
      name: '完整演示',
      description: '10分钟详细展示所有游戏功能和技术特性',
      features: [
        '完整游戏流程',
        '高级AI对战',
        '技能系统深度体验',
        '事件系统展示',
        '存储和同步机制',
        '响应式设计适配',
        '性能优化效果',
        '无障碍功能'
      ],
      gameConfig: {
        playerName: '体验玩家',
        playerZodiac: '龙',
        aiOpponents: [
          { name: 'AI-专家', zodiac: '虎', difficulty: 'expert', isHuman: false },
          { name: 'AI-智者', zodiac: '猴', difficulty: 'hard', isHuman: false },
          { name: 'AI-新手', zodiac: '羊', difficulty: 'medium', isHuman: false }
        ],
        gameSettings: {
          startingMoney: 15000,
          maxRounds: 30,
          winCondition: 'last_standing'
        }
      },
      uiConfig: {
        theme: 'auto',
        showDebugInfo: true,
        showPerformanceMetrics: true,
        enableAnimations: true,
        enableSoundEffects: true,
        autoAdvanceSteps: false,
        highlightFeatures: true,
        showTooltips: true
      },
      performanceConfig: {
        targetFPS: 60,
        enableOptimizations: true,
        reducedAnimations: false,
        preloadAssets: true,
        cacheStrategy: 'moderate'
      },
      autoPlay: false,
      duration: 600 // 10分钟
    },

    // 技术演示 - 5分钟技术特性展示
    technical: {
      name: '技术演示',
      description: '5分钟展示技术架构和创新特性',
      features: [
        '模块化架构设计',
        '状态管理和同步',
        'AI决策引擎',
        '性能优化技术',
        '测试和质量保证',
        '可扩展性设计',
        '开发工具集成'
      ],
      gameConfig: {
        playerName: '开发者',
        playerZodiac: '猴',
        aiOpponents: [
          { name: 'Debug-AI', zodiac: '鼠', difficulty: 'medium', isHuman: false },
          { name: 'Test-AI', zodiac: '牛', difficulty: 'easy', isHuman: false }
        ],
        gameSettings: {
          startingMoney: 25000,
          maxRounds: 10,
          winCondition: 'money_threshold'
        }
      },
      uiConfig: {
        theme: 'dark',
        showDebugInfo: true,
        showPerformanceMetrics: true,
        enableAnimations: true,
        enableSoundEffects: false,
        autoAdvanceSteps: true,
        highlightFeatures: true,
        showTooltips: false
      },
      performanceConfig: {
        targetFPS: 60,
        enableOptimizations: false, // 显示优化前后对比
        reducedAnimations: false,
        preloadAssets: true,
        cacheStrategy: 'minimal'
      },
      autoPlay: true,
      duration: 300 // 5分钟
    },

    // 移动端演示 - 适配移动设备的演示
    mobile: {
      name: '移动端演示',
      description: '展示移动端优化和触摸交互',
      features: [
        '移动端界面适配',
        '触摸手势支持',
        '性能优化',
        '离线功能',
        '快速启动',
        '电池优化'
      ],
      gameConfig: {
        playerName: '手机玩家',
        playerZodiac: '马',
        aiOpponents: [
          { name: '移动AI', zodiac: '鸡', difficulty: 'easy', isHuman: false },
          { name: '快速AI', zodiac: '狗', difficulty: 'medium', isHuman: false }
        ],
        gameSettings: {
          startingMoney: 18000,
          maxRounds: 12,
          winCondition: 'money_threshold'
        }
      },
      uiConfig: {
        theme: 'light',
        showDebugInfo: false,
        showPerformanceMetrics: false,
        enableAnimations: true,
        enableSoundEffects: true,
        autoAdvanceSteps: true,
        highlightFeatures: true,
        showTooltips: true
      },
      performanceConfig: {
        targetFPS: 30, // 移动端较低目标帧率
        enableOptimizations: true,
        reducedAnimations: true,
        preloadAssets: false, // 减少预加载
        cacheStrategy: 'minimal'
      },
      autoPlay: true,
      duration: 240 // 4分钟
    }
  };

  // 预定义的演示场景
  static readonly DEMO_SCENARIOS: Record<string, DemoScenario> = {
    gameflow: {
      id: 'gameflow',
      name: '游戏流程演示',
      description: '展示完整的游戏流程',
      estimatedDuration: 180,
      complexity: 'basic',
      steps: [
        {
          id: 'init',
          title: '游戏初始化',
          description: '展示游戏启动和初始化过程',
          action: { type: 'system_demo', automated: true },
          duration: 15,
          skipable: false,
          highlights: ['快速启动', '状态加载', '界面渲染']
        },
        {
          id: 'setup',
          title: '玩家设置',
          description: '配置玩家信息和AI对手',
          action: { type: 'ui_interaction', target: 'player-setup', automated: true },
          duration: 20,
          skipable: true,
          highlights: ['十二生肖选择', 'AI难度设置', '个性化配置']
        },
        {
          id: 'gameplay',
          title: '核心玩法',
          description: '展示掷骰子、移动、购买等核心操作',
          action: { type: 'game_action', target: 'core-gameplay', automated: true },
          duration: 90,
          skipable: false,
          highlights: ['掷骰子动画', '角色移动', '财产交易', 'AI决策']
        },
        {
          id: 'skills',
          title: '技能系统',
          description: '展示十二生肖特殊技能',
          action: { type: 'game_action', target: 'skill-demo', automated: true },
          duration: 30,
          skipable: true,
          highlights: ['技能激活', '效果展示', '冷却机制']
        },
        {
          id: 'save',
          title: '存档功能',
          description: '演示游戏保存和加载',
          action: { type: 'system_demo', target: 'save-load', automated: true },
          duration: 25,
          skipable: true,
          highlights: ['快速保存', '存档管理', '数据同步']
        }
      ]
    },

    ai_showcase: {
      id: 'ai_showcase',
      name: 'AI智能展示',
      description: '重点展示AI系统的智能决策',
      estimatedDuration: 150,
      complexity: 'intermediate',
      steps: [
        {
          id: 'ai_intro',
          title: 'AI系统介绍',
          description: '介绍AI的四个难度等级',
          action: { type: 'narration', automated: true },
          duration: 20,
          skipable: true,
          highlights: ['难度分级', '个性系统', '学习能力']
        },
        {
          id: 'ai_decision',
          title: 'AI决策过程',
          description: '展示AI的决策思考过程',
          action: { type: 'system_demo', target: 'ai-thinking', automated: true },
          duration: 40,
          skipable: false,
          highlights: ['状态分析', '策略制定', '风险评估']
        },
        {
          id: 'ai_personality',
          title: '个性化AI',
          description: '展示不同生肖AI的个性特点',
          action: { type: 'game_action', target: 'personality-demo', automated: true },
          duration: 60,
          skipable: false,
          highlights: ['保守策略', '激进策略', '平衡策略']
        },
        {
          id: 'ai_adaptation',
          title: 'AI学习适应',
          description: '展示AI如何根据对手调整策略',
          action: { type: 'system_demo', target: 'ai-learning', automated: true },
          duration: 30,
          skipable: true,
          highlights: ['策略调整', '对手分析', '动态优化']
        }
      ]
    },

    technical_deep_dive: {
      id: 'technical_deep_dive',
      name: '技术深度展示',
      description: '展示技术架构和创新特性',
      estimatedDuration: 300,
      complexity: 'advanced',
      steps: [
        {
          id: 'architecture',
          title: '系统架构',
          description: '展示模块化架构设计',
          action: { type: 'system_demo', target: 'architecture-view', automated: true },
          duration: 45,
          skipable: false,
          highlights: ['模块分离', '事件驱动', '依赖注入']
        },
        {
          id: 'state_management',
          title: '状态管理',
          description: '展示状态同步和管理机制',
          action: { type: 'system_demo', target: 'state-sync', automated: true },
          duration: 60,
          skipable: false,
          highlights: ['状态树', '同步机制', '版本控制']
        },
        {
          id: 'performance',
          title: '性能优化',
          description: '展示各种性能优化技术',
          action: { type: 'system_demo', target: 'performance-demo', automated: true },
          duration: 90,
          skipable: false,
          highlights: ['渲染优化', '内存管理', '缓存策略']
        },
        {
          id: 'testing',
          title: '测试体系',
          description: '展示自动化测试和质量保证',
          action: { type: 'system_demo', target: 'testing-demo', automated: true },
          duration: 60,
          skipable: true,
          highlights: ['单元测试', '集成测试', '性能测试']
        },
        {
          id: 'extensibility',
          title: '扩展性设计',
          description: '展示系统的扩展能力',
          action: { type: 'system_demo', target: 'extension-demo', automated: true },
          duration: 45,
          skipable: true,
          highlights: ['插件系统', '模块热替换', 'API设计']
        }
      ]
    }
  };

  /**
   * 获取演示配置
   */
  static getDemoConfig(configName: string): DemoConfig | null {
    return this.DEMO_CONFIGS[configName] || null;
  }

  /**
   * 获取演示场景
   */
  static getDemoScenario(scenarioId: string): DemoScenario | null {
    return this.DEMO_SCENARIOS[scenarioId] || null;
  }

  /**
   * 获取所有可用的演示配置
   */
  static getAvailableConfigs(): Array<{name: string; config: DemoConfig}> {
    return Object.entries(this.DEMO_CONFIGS).map(([name, config]) => ({
      name,
      config
    }));
  }

  /**
   * 获取所有可用的演示场景
   */
  static getAvailableScenarios(): Array<{id: string; scenario: DemoScenario}> {
    return Object.entries(this.DEMO_SCENARIOS).map(([id, scenario]) => ({
      id,
      scenario
    }));
  }

  /**
   * 创建自定义演示配置
   */
  static createCustomConfig(
    name: string,
    baseConfig: string = 'quick',
    overrides: Partial<DemoConfig> = {}
  ): DemoConfig {
    const base = this.getDemoConfig(baseConfig);
    if (!base) {
      throw new Error(`Base config '${baseConfig}' not found`);
    }

    return {
      ...base,
      ...overrides,
      name,
      gameConfig: {
        ...base.gameConfig,
        ...overrides.gameConfig
      },
      uiConfig: {
        ...base.uiConfig,
        ...overrides.uiConfig
      },
      performanceConfig: {
        ...base.performanceConfig,
        ...overrides.performanceConfig
      }
    };
  }

  /**
   * 验证演示配置
   */
  static validateConfig(config: DemoConfig): {valid: boolean; errors: string[]} {
    const errors: string[] = [];

    // 基本字段验证
    if (!config.name) errors.push('演示名称不能为空');
    if (!config.description) errors.push('演示描述不能为空');
    if (config.duration <= 0) errors.push('演示时长必须大于0');

    // 游戏配置验证
    if (!config.gameConfig.playerName) errors.push('玩家名称不能为空');
    if (!config.gameConfig.playerZodiac) errors.push('玩家生肖不能为空');
    if (!config.gameConfig.aiOpponents || config.gameConfig.aiOpponents.length === 0) {
      errors.push('至少需要一个AI对手');
    }

    // UI配置验证
    const validThemes = ['light', 'dark', 'zodiac', 'auto'];
    if (!validThemes.includes(config.uiConfig.theme)) {
      errors.push('无效的主题设置');
    }

    // 性能配置验证
    if (config.performanceConfig.targetFPS <= 0 || config.performanceConfig.targetFPS > 120) {
      errors.push('目标帧率应在1-120之间');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取推荐的演示配置
   */
  static getRecommendedConfig(context: 'presentation' | 'development' | 'testing' | 'mobile'): string {
    switch (context) {
      case 'presentation':
        return 'quick';
      case 'development':
        return 'technical';
      case 'testing':
        return 'full';
      case 'mobile':
        return 'mobile';
      default:
        return 'quick';
    }
  }

  /**
   * 生成演示统计信息
   */
  static generateDemoStats(): {
    totalConfigs: number;
    totalScenarios: number;
    totalSteps: number;
    estimatedTotalDuration: number;
    complexityDistribution: Record<string, number>;
  } {
    const configs = Object.values(this.DEMO_CONFIGS);
    const scenarios = Object.values(this.DEMO_SCENARIOS);
    
    const totalSteps = scenarios.reduce((sum, scenario) => sum + scenario.steps.length, 0);
    const estimatedTotalDuration = scenarios.reduce((sum, scenario) => sum + scenario.estimatedDuration, 0);
    
    const complexityDistribution = scenarios.reduce((dist, scenario) => {
      dist[scenario.complexity] = (dist[scenario.complexity] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      totalConfigs: configs.length,
      totalScenarios: scenarios.length,
      totalSteps,
      estimatedTotalDuration,
      complexityDistribution
    };
  }
}