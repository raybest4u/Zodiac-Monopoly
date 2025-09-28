/**
 * 技能系统模块索引
 * 第二阶段 Day 1: 技能系统架构
 * 
 * 导出所有技能系统相关的组件和接口
 */

// 核心架构
export * from './SkillSystemArchitecture';

// 数据结构
export * from './SkillDataStructures';

// 管理器
export { SkillManager } from './SkillManager';

// 触发系统
export { SkillTriggerSystem } from './SkillTriggerSystem';
export type { SkillTrigger, TriggerContext, TriggerResult } from './SkillTriggerSystem';

// 集成系统
export { SkillSystemIntegration, DEFAULT_SKILL_SYSTEM_CONFIG } from './SkillSystemIntegration';
export type { SkillSystemConfig, SkillSystemState } from './SkillSystemIntegration';

// 便捷导入
export {
  SkillRegistry,
  ZODIAC_SKILL_TRAITS,
  SKILL_BALANCE_CONFIG,
  RAT_SKILLS,
  OX_SKILLS,
  TIGER_SKILLS,
  UNIVERSAL_SKILLS,
  SKILL_COMBOS
} from './SkillDataStructures';

/**
 * 创建完整的技能系统实例
 * 这是最简单的使用方式
 */
export function createSkillSystem(config?: Partial<SkillSystemConfig>): SkillSystemIntegration {
  const fullConfig = {
    ...DEFAULT_SKILL_SYSTEM_CONFIG,
    ...config
  };
  
  return new SkillSystemIntegration(fullConfig);
}

/**
 * 技能系统版本信息
 */
export const SKILL_SYSTEM_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  build: 'day1-architecture',
  date: '2024-12-19',
  description: 'Day 1: 技能系统核心架构实现'
};

/**
 * 技能系统功能特性
 */
export const SKILL_SYSTEM_FEATURES = {
  // 核心功能
  skillDefinitions: true,      // 技能定义系统
  skillInstances: true,        // 技能实例管理
  skillEffects: true,          // 技能效果系统
  skillCooldowns: true,        // 冷却时间管理
  skillLeveling: true,         // 技能升级系统
  
  // 高级功能
  passiveSkills: true,         // 被动技能
  triggeredSkills: true,       // 触发技能
  comboSkills: true,           // 组合技能
  skillEnhancements: true,     // 技能增强
  zodiacSpecific: true,        // 生肖专属技能
  
  // 集成功能
  gameEngineIntegration: true, // 游戏引擎集成
  eventSystemIntegration: true, // 事件系统集成
  dataPersistence: true,       // 数据持久化
  statisticsTracking: true,    // 统计追踪
  debugSupport: true,          // 调试支持
  
  // 平衡和配置
  balanceSystem: true,         // 平衡系统
  configurationSystem: true,   // 配置系统
  performanceOptimization: true // 性能优化
};

/**
 * 快速开始指南
 */
export const QUICK_START_GUIDE = {
  basicUsage: `
// 1. 创建技能系统
import { createSkillSystem } from './skills';

const skillSystem = createSkillSystem({
  enableSkillSystem: true,
  enableAutoTriggers: true
});

// 2. 集成到游戏引擎
skillSystem.extendGameEngine(gameEngine);

// 3. 激活系统
skillSystem.activate();
  `,
  
  skillUsage: `
// 使用技能
await skillSystem.useSkill(playerId, skillId, targets, gameState);

// 检查技能是否可用
const canUse = skillSystem.canUseSkill(playerId, skillId, gameState);

// 获取玩家技能
const skills = skillSystem.getPlayerSkills(playerId);
  `,
  
  customSkills: `
// 注册自定义技能
const customSkill = {
  id: 'custom_heal',
  name: '治疗术',
  category: SkillCategory.ACTIVE_UTILITY,
  rarity: SkillRarity.COMMON,
  // ... 其他属性
};

skillSystem.skillManager.registerSkillDefinition(customSkill);
  `
};

/**
 * 技能系统常量
 */
export const SKILL_SYSTEM_CONSTANTS = {
  MAX_SKILLS_PER_PLAYER: 20,
  DEFAULT_COOLDOWN: 3,
  DEFAULT_MAX_LEVEL: 5,
  BASE_EXPERIENCE_GAIN: 10,
  COMBO_COOLDOWN_PENALTY: 1.5,
  TRIGGER_PRIORITY_RANGE: [0, 100],
  MAX_ACTIVATIONS_PER_TURN: 10
};

export default {
  createSkillSystem,
  SKILL_SYSTEM_VERSION,
  SKILL_SYSTEM_FEATURES,
  QUICK_START_GUIDE,
  SKILL_SYSTEM_CONSTANTS
};