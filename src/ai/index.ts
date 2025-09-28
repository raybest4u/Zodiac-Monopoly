/**
 * AI系统入口模块
 * 
 * 导出所有AI相关的类和接口，提供统一的AI系统访问点
 */

// 核心AI管理器
export { AIManager } from './AIManager';

// AI个性系统
export { PersonalityFactory } from './PersonalityFactory';

// 决策引擎
export { DecisionEngine } from './DecisionEngine';

// 状态管理器
export { AIStateManager } from './AIStateManager';

// 交易系统
export { TradingSystem } from './TradingSystem';

// 技能系统
export { SkillSystem } from './SkillSystem';

// 决策树优化器
export { DecisionTreeOptimizer } from './DecisionTreeOptimizer';

// 性能分析系统
export { PerformanceAnalytics } from './PerformanceAnalytics';

// 决策速度优化器
export { DecisionSpeedOptimizer } from './DecisionSpeedOptimizer';

// 大语言模型服务
export { LLMService } from './LLMService';

// 对话管理系统
export { ConversationManager } from './ConversationManager';

// 故事叙述管理系统
export { StorytellingManager } from './StorytellingManager';

// 玩家互动管理系统
export { InteractionManager } from './InteractionManager';

// 重新导出AI相关类型
export type {
  // 核心状态类型
  AIState,
  AIPersonality,
  AIOpponentConfig,
  AIDecision,
  AIStatistics,
  
  // 决策相关类型
  SituationAnalysis,
  DecisionContext,
  AlternativeAction,
  AIStrategy,
  
  // 个性和行为类型
  PropertyPreference,
  SkillUsageTendency,
  NegotiationStyle,
  ReactionPattern,
  ZodiacTraits,
  
  // 情绪和记忆类型
  EmotionalState,
  AIMemory,
  MemoryEvent,
  PlayerRelationship,
  LearningData,
  
  // 分析类型
  GamePhaseAnalysis,
  PlayerPositionAnalysis,
  EconomicAnalysis,
  ThreatAnalysis,
  OpportunityAnalysis,
  
  // 枚举类型
  DifficultyLevel,
  PropertyType,
  InvestmentFocus,
  TimingPreference,
  StrategyFocus,
  EmotionalMood,
  
  // 高级AI类型
  DecisionTreeNode,
  LearningSystem,
  BehaviorPattern,
  CommunicationSystem
} from '../types/ai';

// AI工具函数
export class AIUtils {
  /**
   * 创建默认AI配置
   */
  static createDefaultAIConfig(
    id: string,
    name: string,
    zodiac: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
  ) {
    return {
      id,
      name,
      zodiac: zodiac as any,
      difficulty,
      personalityOverrides: undefined
    };
  }

  /**
   * 验证AI配置
   */
  static validateAIConfig(config: any): boolean {
    return !!(
      config.id &&
      config.name &&
      config.zodiac &&
      config.difficulty &&
      ['easy', 'medium', 'hard', 'expert'].includes(config.difficulty)
    );
  }

  /**
   * 获取生肖兼容性
   */
  static getZodiacCompatibility(zodiac1: string, zodiac2: string): number {
    // 简化的生肖兼容性计算
    const compatibilityMap: Record<string, string[]> = {
      '鼠': ['龙', '猴'],
      '牛': ['蛇', '鸡'],
      '虎': ['马', '狗'],
      '兔': ['羊', '猪'],
      '龙': ['鼠', '猴', '鸡'],
      '蛇': ['牛', '鸡'],
      '马': ['虎', '狗'],
      '羊': ['兔', '猪'],
      '猴': ['鼠', '龙'],
      '鸡': ['牛', '蛇', '龙'],
      '狗': ['虎', '马'],
      '猪': ['兔', '羊']
    };

    const compatible = compatibilityMap[zodiac1]?.includes(zodiac2) || false;
    return compatible ? 0.8 : 0.5;
  }

  /**
   * 计算AI难度系数
   */
  static getDifficultyMultiplier(difficulty: string): number {
    const multipliers = {
      easy: 0.7,
      medium: 1.0,
      hard: 1.3,
      expert: 1.6
    };
    
    return multipliers[difficulty as keyof typeof multipliers] || 1.0;
  }

  /**
   * 生成AI团队配置
   */
  static generateAITeam(playerZodiac: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium') {
    const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const names = ['小明', '小红', '小李', '小王', '小张', '小刘', '小陈', '小黄', '小周', '小吴', '小郑', '小冯'];
    
    // 排除玩家生肖
    const availableZodiacs = zodiacs.filter(z => z !== playerZodiac);
    
    // 随机选择3个AI对手
    const selectedZodiacs = [];
    const usedNames = [];
    
    for (let i = 0; i < 3; i++) {
      const zodiacIndex = Math.floor(Math.random() * availableZodiacs.length);
      const nameIndex = Math.floor(Math.random() * names.length);
      
      const zodiac = availableZodiacs.splice(zodiacIndex, 1)[0];
      let name = names[nameIndex];
      
      // 确保名字不重复
      while (usedNames.includes(name)) {
        const newIndex = Math.floor(Math.random() * names.length);
        name = names[newIndex];
      }
      
      usedNames.push(name);
      selectedZodiacs.push({
        id: `ai_${i + 1}`,
        name: `${name}(${zodiac})`,
        zodiac,
        difficulty
      });
    }
    
    return selectedZodiacs;
  }

  /**
   * 格式化AI决策信息
   */
  static formatDecision(decision: any): string {
    const { action, confidence, reasoning } = decision;
    const confidencePercent = Math.round(confidence * 100);
    
    return `动作: ${action.type}, 置信度: ${confidencePercent}%, 原因: ${reasoning}`;
  }

  /**
   * 计算AI表现评分
   */
  static calculatePerformanceScore(statistics: any): number {
    const {
      totalDecisions,
      averageDecisionTime,
      confidenceLevel,
      successRate,
      cacheHitRate
    } = statistics;

    // 综合评分计算
    const decisionScore = Math.min(totalDecisions / 100, 1) * 0.2;
    const speedScore = Math.max(0, 1 - averageDecisionTime / 10000) * 0.2;
    const confidenceScore = confidenceLevel * 0.3;
    const successScore = successRate * 0.2;
    const efficiencyScore = cacheHitRate * 0.1;

    return decisionScore + speedScore + confidenceScore + successScore + efficiencyScore;
  }
}

// AI常量
export const AI_CONSTANTS = {
  // 默认配置值
  DEFAULT_DIFFICULTY: 'medium' as const,
  DEFAULT_CONFIDENCE_THRESHOLD: 0.6,
  DEFAULT_DECISION_TIMEOUT: 5000,
  DEFAULT_MEMORY_SIZE: 50,
  
  // 生肖列表
  ZODIAC_SIGNS: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const,
  
  // 难度等级
  DIFFICULTY_LEVELS: ['easy', 'medium', 'hard', 'expert'] as const,
  
  // 策略焦点
  STRATEGY_FOCUSES: [
    'wealth_accumulation',
    'property_monopoly', 
    'player_elimination',
    'risk_minimization',
    'opportunistic'
  ] as const,
  
  // 情绪类型
  EMOTION_TYPES: [
    'confident', 'frustrated', 'excited', 'cautious', 
    'aggressive', 'desperate', 'content'
  ] as const,
  
  // 房产类型
  PROPERTY_TYPES: [
    'commercial', 'residential', 'industrial', 'luxury',
    'agricultural', 'financial', 'transport', 'tourism',
    'entertainment', 'food', 'service', 'mixed'
  ] as const
};

// AI事件类型
export const AI_EVENTS = {
  // 管理器事件
  MANAGER_INITIALIZED: 'ai_manager_initialized',
  OPPONENT_CREATED: 'ai_opponent_created',
  OPPONENT_REMOVED: 'ai_opponent_removed',
  DECISION_MADE: 'ai_decision_made',
  DECISION_FAILED: 'ai_decision_failed',
  
  // 状态事件
  STATE_CREATED: 'ai_state_created',
  STATE_UPDATED: 'ai_state_updated',
  STATE_SAVED: 'ai_state_saved',
  STATE_REMOVED: 'ai_state_removed',
  
  // 情绪事件
  EMOTIONAL_STATE_UPDATED: 'emotional_state_updated',
  MOOD_CHANGED: 'mood_changed',
  
  // 记忆事件
  MEMORY_UPDATED: 'memory_updated',
  RELATIONSHIP_CHANGED: 'relationship_changed',
  
  // 学习事件
  LEARNING_DATA_UPDATED: 'learning_data_updated',
  STRATEGY_ADJUSTED: 'strategy_adjusted',
  
  // 游戏事件
  GAME_EVENT_PROCESSED: 'game_event_processed',
  MULTIPLE_DECISIONS_MADE: 'multiple_decisions_made',
  
  // 系统事件
  CLEANUP_COMPLETED: 'cleanup_completed',
  STATISTICS_RESET: 'statistics_reset'
} as const;

/**
 * AI系统快速启动函数
 */
export async function createAISystem(config?: {
  maxCacheSize?: number;
  enableLearning?: boolean;
  enableAnalytics?: boolean;
  decisionTimeout?: number;
}) {
  const aiManager = new AIManager(config);
  await aiManager.initialize();
  return aiManager;
}

/**
 * 创建AI对手团队
 */
export async function createAITeam(
  aiManager: InstanceType<typeof AIManager>,
  playerZodiac: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
) {
  const teamConfig = AIUtils.generateAITeam(playerZodiac, difficulty);
  const aiIds = [];
  
  for (const config of teamConfig) {
    const aiId = await aiManager.createAIOpponent(config);
    aiIds.push(aiId);
  }
  
  return aiIds;
}