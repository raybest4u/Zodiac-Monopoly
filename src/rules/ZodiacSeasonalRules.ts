/**
 * 十二生肖季节规则 - 实现生肖与季节相关的特殊规则
 */

import { ruleEngineConfig } from '../config/RuleEngineConfig';

import type {
  RuleDefinition,
  RuleExecutionContext,
  RuleValidationResult,
  RuleExecutionResult
} from './GameRuleSystem';
import type {
  GameState,
  Player,
  PlayerAction,
  ZodiacSign,
  Season,
  Weather,
  GameEffect,
  ZodiacSkill
} from '../types/game';

export interface ZodiacSeasonalBonus {
  zodiac: ZodiacSign;
  favorableSeason: Season;
  bonusMultiplier: number;
  specialAbilities: string[];
  weatherSensitivity: WeatherSensitivity;
}

export interface WeatherSensitivity {
  favorableWeather: Weather[];
  unfavorableWeather: Weather[];
  bonusInFavorable: number;
  penaltyInUnfavorable: number;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  season: Season;
  triggerConditions: SeasonalTrigger[];
  effects: SeasonalEffect[];
  duration: number; // 持续回合数
  affectedZodiacs: ZodiacSign[] | 'all';
}

export interface SeasonalTrigger {
  type: 'turn_start' | 'season_change' | 'weather_change' | 'player_action' | 'zodiac_specific';
  condition: string;
  probability: number;
}

export interface SeasonalEffect {
  type: 'money_modifier' | 'skill_enhancement' | 'movement_bonus' | 'property_discount' | 'special_action';
  target: 'self' | 'all_players' | 'specific_zodiac' | 'opponents';
  value: number | string;
  description: string;
}

export interface ZodiacCompatibility {
  zodiac1: ZodiacSign;
  zodiac2: ZodiacSign;
  compatibility: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
  tradeBonus: number;
  cooperationBonus: number;
  conflictPenalty: number;
}

export interface ElementalCycle {
  element: ZodiacElement;
  strengthensAgainst: ZodiacElement[];
  weakensAgainst: ZodiacElement[];
  seasonalPower: Record<Season, number>;
}

export type ZodiacElement = '金' | '木' | '水' | '火' | '土';

/**
 * 生肖季节属性映射
 */
export const ZODIAC_SEASONAL_MAPPING: Record<ZodiacSign, ZodiacSeasonalBonus> = {
  '鼠': {
    zodiac: '鼠',
    favorableSeason: '冬',
    bonusMultiplier: ruleEngineConfig.getZodiacConfig().bonusMultipliers['鼠'],
    specialAbilities: ['夜间活动', '资源收集', '信息获取'],
    weatherSensitivity: {
      favorableWeather: ['雪', '阴'],
      unfavorableWeather: ['晴', '热'],
      bonusInFavorable: 0.15,
      penaltyInUnfavorable: -0.05
    }
  },
  '牛': {
    zodiac: '牛',
    favorableSeason: '春',
    bonusMultiplier: ruleEngineConfig.getZodiacConfig().bonusMultipliers['牛'],
    specialAbilities: ['勤劳工作', '稳定收益', '防御加成'],
    weatherSensitivity: {
      favorableWeather: ['雨', '阴'],
      unfavorableWeather: ['雪', '风'],
      bonusInFavorable: 0.1,
      penaltyInUnfavorable: -0.1
    }
  },
  '虎': {
    zodiac: '虎',
    favorableSeason: '春',
    bonusMultiplier: ruleEngineConfig.getZodiacConfig().bonusMultipliers['虎'],
    specialAbilities: ['威猛攻击', '领域控制', '威慑效果'],
    weatherSensitivity: {
      favorableWeather: ['晴', '风'],
      unfavorableWeather: ['雨', '雪'],
      bonusInFavorable: 0.2,
      penaltyInUnfavorable: -0.15
    }
  },
  '兔': {
    zodiac: '兔',
    favorableSeason: '春',
    bonusMultiplier: ruleEngineConfig.getZodiacConfig().bonusMultipliers['兔'],
    specialAbilities: ['敏捷移动', '幸运加成', '逃脱技能'],
    weatherSensitivity: {
      favorableWeather: ['晴', '阴'],
      unfavorableWeather: ['雪', '风'],
      bonusInFavorable: 0.12,
      penaltyInUnfavorable: -0.08
    }
  },
  '龙': {
    zodiac: '龙',
    favorableSeason: '春',
    bonusMultiplier: 1.3,
    specialAbilities: ['呼风唤雨', '威严压制', '财富聚集'],
    weatherSensitivity: {
      favorableWeather: ['雨', '风'],
      unfavorableWeather: ['雪'],
      bonusInFavorable: 0.25,
      penaltyInUnfavorable: -0.1
    }
  },
  '蛇': {
    zodiac: '蛇',
    favorableSeason: '夏',
    bonusMultiplier: 1.2,
    specialAbilities: ['隐蔽行动', '毒计策略', '智慧洞察'],
    weatherSensitivity: {
      favorableWeather: ['晴', '热'],
      unfavorableWeather: ['雪', '雨'],
      bonusInFavorable: 0.18,
      penaltyInUnfavorable: -0.2
    }
  },
  '马': {
    zodiac: '马',
    favorableSeason: '夏',
    bonusMultiplier: 1.2,
    specialAbilities: ['快速移动', '冲锋陷阵', '持久耐力'],
    weatherSensitivity: {
      favorableWeather: ['晴', '风'],
      unfavorableWeather: ['雨', '雪'],
      bonusInFavorable: 0.15,
      penaltyInUnfavorable: -0.12
    }
  },
  '羊': {
    zodiac: '羊',
    favorableSeason: '夏',
    bonusMultiplier: 1.1,
    specialAbilities: ['温和协调', '群体合作', '资源共享'],
    weatherSensitivity: {
      favorableWeather: ['晴', '阴'],
      unfavorableWeather: ['风', '雪'],
      bonusInFavorable: 0.1,
      penaltyInUnfavorable: -0.15
    }
  },
  '猴': {
    zodiac: '猴',
    favorableSeason: '秋',
    bonusMultiplier: 1.18,
    specialAbilities: ['机智变通', '模仿学习', '灵活操作'],
    weatherSensitivity: {
      favorableWeather: ['晴', '阴'],
      unfavorableWeather: ['雨', '雪'],
      bonusInFavorable: 0.15,
      penaltyInUnfavorable: -0.1
    }
  },
  '鸡': {
    zodiac: '鸡',
    favorableSeason: '秋',
    bonusMultiplier: 1.12,
    specialAbilities: ['精确计算', '勤勉工作', '准时行动'],
    weatherSensitivity: {
      favorableWeather: ['晴', '阴'],
      unfavorableWeather: ['雨', '风'],
      bonusInFavorable: 0.12,
      penaltyInUnfavorable: -0.08
    }
  },
  '狗': {
    zodiac: '狗',
    favorableSeason: '秋',
    bonusMultiplier: 1.15,
    specialAbilities: ['忠诚守护', '敏锐嗅觉', '团队协作'],
    weatherSensitivity: {
      favorableWeather: ['阴', '风'],
      unfavorableWeather: ['热', '雪'],
      bonusInFavorable: 0.13,
      penaltyInUnfavorable: -0.07
    }
  },
  '猪': {
    zodiac: '猪',
    favorableSeason: '冬',
    bonusMultiplier: 1.1,
    specialAbilities: ['财富积累', '满足常乐', '福气加身'],
    weatherSensitivity: {
      favorableWeather: ['阴', '雨'],
      unfavorableWeather: ['热', '风'],
      bonusInFavorable: 0.12,
      penaltyInUnfavorable: -0.08
    }
  }
};

/**
 * 生肖元素映射
 */
export const ZODIAC_ELEMENT_MAPPING: Record<ZodiacSign, ZodiacElement> = {
  '鼠': '水', '牛': '土', '虎': '木', '兔': '木',
  '龙': '土', '蛇': '火', '马': '火', '羊': '土',
  '猴': '金', '鸡': '金', '狗': '土', '猪': '水'
};

/**
 * 元素相克相生循环
 */
export const ELEMENTAL_CYCLES: Record<ZodiacElement, ElementalCycle> = {
  '金': {
    element: '金',
    strengthensAgainst: ['木'],
    weakensAgainst: ['火'],
    seasonalPower: { '春': 0.8, '夏': 0.7, '秋': 1.3, '冬': 1.1 }
  },
  '木': {
    element: '木',
    strengthensAgainst: ['土'],
    weakensAgainst: ['金'],
    seasonalPower: { '春': 1.3, '夏': 1.1, '秋': 0.8, '冬': 0.9 }
  },
  '水': {
    element: '水',
    strengthensAgainst: ['火'],
    weakensAgainst: ['土'],
    seasonalPower: { '春': 1.1, '夏': 0.8, '秋': 1.0, '冬': 1.3 }
  },
  '火': {
    element: '火',
    strengthensAgainst: ['金'],
    weakensAgainst: ['水'],
    seasonalPower: { '春': 1.0, '夏': 1.3, '秋': 1.1, '冬': 0.7 }
  },
  '土': {
    element: '土',
    strengthensAgainst: ['水'],
    weakensAgainst: ['木'],
    seasonalPower: { '春': 0.9, '夏': 1.1, '秋': 1.1, '冬': 1.0 }
  }
};

/**
 * 生肖兼容性矩阵
 */
export const ZODIAC_COMPATIBILITY_MATRIX: ZodiacCompatibility[] = [
  // 相合组合
  { zodiac1: '鼠', zodiac2: '龙', compatibility: 'excellent', tradeBonus: 0.2, cooperationBonus: 0.25, conflictPenalty: 0 },
  { zodiac1: '牛', zodiac2: '蛇', compatibility: 'excellent', tradeBonus: 0.18, cooperationBonus: 0.2, conflictPenalty: 0 },
  { zodiac1: '虎', zodiac2: '马', compatibility: 'excellent', tradeBonus: 0.22, cooperationBonus: 0.25, conflictPenalty: 0 },
  { zodiac1: '兔', zodiac2: '羊', compatibility: 'excellent', tradeBonus: 0.15, cooperationBonus: 0.18, conflictPenalty: 0 },
  
  // 相冲组合
  { zodiac1: '鼠', zodiac2: '马', compatibility: 'terrible', tradeBonus: -0.2, cooperationBonus: -0.25, conflictPenalty: -0.3 },
  { zodiac1: '牛', zodiac2: '羊', compatibility: 'terrible', tradeBonus: -0.18, cooperationBonus: -0.2, conflictPenalty: -0.25 },
  { zodiac1: '虎', zodiac2: '猴', compatibility: 'terrible', tradeBonus: -0.22, cooperationBonus: -0.25, conflictPenalty: -0.3 },
  { zodiac1: '兔', zodiac2: '鸡', compatibility: 'terrible', tradeBonus: -0.15, cooperationBonus: -0.18, conflictPenalty: -0.2 },
  { zodiac1: '龙', zodiac2: '狗', compatibility: 'terrible', tradeBonus: -0.2, cooperationBonus: -0.22, conflictPenalty: -0.28 },
  { zodiac1: '蛇', zodiac2: '猪', compatibility: 'terrible', tradeBonus: -0.18, cooperationBonus: -0.2, conflictPenalty: -0.25 }
];

/**
 * 季节性事件库
 */
export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'spring_revival',
    name: '万物复苏',
    description: '春天到来，所有生肖都感受到生机活力',
    season: '春',
    triggerConditions: [{
      type: 'season_change',
      condition: 'season === "春"',
      probability: 1.0
    }],
    effects: [{
      type: 'money_modifier',
      target: 'all_players',
      value: 200,
      description: '春季红利，每位玩家获得200金钱'
    }],
    duration: 3,
    affectedZodiacs: 'all'
  },
  {
    id: 'summer_prosperity',
    name: '夏日繁荣',
    description: '夏季的炎热带来商业繁荣',
    season: '夏',
    triggerConditions: [{
      type: 'season_change',
      condition: 'season === "夏"',
      probability: 0.8
    }],
    effects: [{
      type: 'property_discount',
      target: 'all_players',
      value: 0.1,
      description: '夏季促销，购买财产享受9折优惠'
    }],
    duration: 2,
    affectedZodiacs: 'all'
  },
  {
    id: 'autumn_harvest',
    name: '秋收时节',
    description: '秋天收获的季节，辛勤工作获得回报',
    season: '秋',
    triggerConditions: [{
      type: 'season_change',
      condition: 'season === "秋"',
      probability: 0.9
    }],
    effects: [{
      type: 'skill_enhancement',
      target: 'all_players',
      value: 1.2,
      description: '秋季技能效果提升20%'
    }],
    duration: 3,
    affectedZodiacs: 'all'
  },
  {
    id: 'winter_hibernation',
    name: '冬日蛰伏',
    description: '冬季的寒冷让人更加谨慎',
    season: '冬',
    triggerConditions: [{
      type: 'season_change',
      condition: 'season === "冬"',
      probability: 0.7
    }],
    effects: [{
      type: 'movement_bonus',
      target: 'all_players',
      value: -1,
      description: '冬季行动力降低，移动距离-1'
    }],
    duration: 2,
    affectedZodiacs: 'all'
  },
  {
    id: 'dragon_year_blessing',
    name: '龙年大吉',
    description: '龙的祝福降临，带来无上好运',
    season: '春',
    triggerConditions: [{
      type: 'zodiac_specific',
      condition: 'hasPlayerWithZodiac("龙")',
      probability: 0.3
    }],
    effects: [{
      type: 'money_modifier',
      target: 'specific_zodiac',
      value: 1000,
      description: '龙年特别奖励1000金钱'
    }],
    duration: 1,
    affectedZodiacs: ['龙']
  }
];

/**
 * 生肖季节规则生成器
 */
export class ZodiacSeasonalRuleGenerator {
  /**
   * 生成所有生肖季节相关规则
   */
  static generateAllRules(): RuleDefinition[] {
    const rules: RuleDefinition[] = [];
    
    // 1. 季节加成规则
    rules.push(...this.generateSeasonalBonusRules());
    
    // 2. 天气影响规则
    rules.push(...this.generateWeatherRules());
    
    // 3. 生肖兼容性规则
    rules.push(...this.generateCompatibilityRules());
    
    // 4. 元素相克规则
    rules.push(...this.generateElementalRules());
    
    // 5. 季节事件规则
    rules.push(...this.generateSeasonalEventRules());
    
    // 6. 特殊技能强化规则
    rules.push(...this.generateSkillEnhancementRules());
    
    return rules;
  }

  /**
   * 生成季节加成规则
   */
  private static generateSeasonalBonusRules(): RuleDefinition[] {
    const rules: RuleDefinition[] = [];
    
    for (const [zodiac, bonus] of Object.entries(ZODIAC_SEASONAL_MAPPING)) {
      rules.push({
        id: `seasonal_bonus_${zodiac}`,
        name: `${zodiac}的季节加成`,
        description: `${zodiac}在${bonus.favorableSeason}季获得特殊加成`,
        category: 'zodiac',
        priority: 75,
        conditions: [],
        requirements: [],
        applicablePhases: ['process_cell', 'use_skill'],
        applicableActions: ['buy_property', 'use_skill', 'roll_dice'],
        zodiacSpecific: [zodiac as ZodiacSign],
        seasonalModifiers: true,
        
        validator: (context) => this.validateSeasonalBonus(context, zodiac as ZodiacSign, bonus),
        executor: (context) => this.executeSeasonalBonus(context, zodiac as ZodiacSign, bonus)
      });
    }
    
    return rules;
  }

  /**
   * 生成天气影响规则
   */
  private static generateWeatherRules(): RuleDefinition[] {
    const rules: RuleDefinition[] = [];
    
    for (const [zodiac, bonus] of Object.entries(ZODIAC_SEASONAL_MAPPING)) {
      rules.push({
        id: `weather_effect_${zodiac}`,
        name: `${zodiac}的天气影响`,
        description: `天气变化对${zodiac}产生特殊影响`,
        category: 'zodiac',
        priority: 70,
        conditions: [],
        requirements: [],
        applicablePhases: ['turn_start', 'process_cell'],
        applicableActions: [],
        zodiacSpecific: [zodiac as ZodiacSign],
        seasonalModifiers: true,
        
        validator: (context) => this.validateWeatherEffect(context, zodiac as ZodiacSign, bonus.weatherSensitivity),
        executor: (context) => this.executeWeatherEffect(context, zodiac as ZodiacSign, bonus.weatherSensitivity)
      });
    }
    
    return rules;
  }

  /**
   * 生成兼容性规则
   */
  private static generateCompatibilityRules(): RuleDefinition[] {
    return [{
      id: 'zodiac_compatibility',
      name: '生肖兼容性',
      description: '不同生肖之间的相性影响交易和合作',
      category: 'zodiac',
      priority: 80,
      conditions: [],
      requirements: [],
      applicablePhases: ['process_cell'],
      applicableActions: ['trade_request', 'buy_property'],
      
      validator: (context) => this.validateCompatibility(context),
      executor: (context) => this.executeCompatibility(context)
    }];
  }

  /**
   * 生成元素相克规则
   */
  private static generateElementalRules(): RuleDefinition[] {
    return [{
      id: 'elemental_interaction',
      name: '五行相克',
      description: '生肖五行元素之间的相克相生关系',
      category: 'zodiac',
      priority: 85,
      conditions: [],
      requirements: [],
      applicablePhases: ['use_skill', 'process_cell'],
      applicableActions: ['use_skill', 'attack_player'],
      
      validator: (context) => this.validateElementalInteraction(context),
      executor: (context) => this.executeElementalInteraction(context)
    }];
  }

  /**
   * 生成季节事件规则
   */
  private static generateSeasonalEventRules(): RuleDefinition[] {
    const rules: RuleDefinition[] = [];
    
    for (const event of SEASONAL_EVENTS) {
      rules.push({
        id: `seasonal_event_${event.id}`,
        name: event.name,
        description: event.description,
        category: 'seasonal',
        priority: 90,
        conditions: [],
        requirements: [],
        applicablePhases: ['turn_start', 'season_change'],
        applicableActions: [],
        seasonalModifiers: true,
        
        validator: (context) => this.validateSeasonalEvent(context, event),
        executor: (context) => this.executeSeasonalEvent(context, event)
      });
    }
    
    return rules;
  }

  /**
   * 生成技能强化规则
   */
  private static generateSkillEnhancementRules(): RuleDefinition[] {
    return [{
      id: 'zodiac_skill_enhancement',
      name: '生肖技能强化',
      description: '基于生肖特性的技能强化效果',
      category: 'skills',
      priority: 88,
      conditions: [],
      requirements: [],
      applicablePhases: ['use_skill'],
      applicableActions: ['use_skill'],
      
      validator: (context) => this.validateSkillEnhancement(context),
      executor: (context) => this.executeSkillEnhancement(context)
    }];
  }

  // 验证方法

  private static validateSeasonalBonus(
    context: RuleExecutionContext,
    zodiac: ZodiacSign,
    bonus: ZodiacSeasonalBonus
  ): RuleValidationResult {
    const { currentPlayer, gameState } = context;
    
    if (currentPlayer.zodiac !== zodiac) {
      return { isValid: false, reason: '生肖不匹配' };
    }
    
    if (gameState.season !== bonus.favorableSeason) {
      return { isValid: false, reason: '非有利季节' };
    }
    
    return { isValid: true };
  }

  private static validateWeatherEffect(
    context: RuleExecutionContext,
    zodiac: ZodiacSign,
    weatherSensitivity: WeatherSensitivity
  ): RuleValidationResult {
    const { currentPlayer, gameState } = context;
    
    if (currentPlayer.zodiac !== zodiac) {
      return { isValid: false, reason: '生肖不匹配' };
    }
    
    const currentWeather = gameState.weather;
    const isFavorable = weatherSensitivity.favorableWeather.includes(currentWeather);
    const isUnfavorable = weatherSensitivity.unfavorableWeather.includes(currentWeather);
    
    if (!isFavorable && !isUnfavorable) {
      return { isValid: false, reason: '天气无特殊影响' };
    }
    
    return { isValid: true };
  }

  private static validateCompatibility(context: RuleExecutionContext): RuleValidationResult {
    // 检查是否涉及多个玩家的互动
    return { isValid: true };
  }

  private static validateElementalInteraction(context: RuleExecutionContext): RuleValidationResult {
    return { isValid: true };
  }

  private static validateSeasonalEvent(
    context: RuleExecutionContext,
    event: SeasonalEvent
  ): RuleValidationResult {
    const { gameState } = context;
    
    if (gameState.season !== event.season) {
      return { isValid: false, reason: '季节不匹配' };
    }
    
    // 检查触发条件
    for (const trigger of event.triggerConditions) {
      if (!this.evaluateTriggerCondition(trigger, context)) {
        return { isValid: false, reason: '触发条件未满足' };
      }
    }
    
    return { isValid: true };
  }

  private static validateSkillEnhancement(context: RuleExecutionContext): RuleValidationResult {
    const { action } = context;
    
    if (action.type !== 'use_skill') {
      return { isValid: false, reason: '非技能使用行动' };
    }
    
    return { isValid: true };
  }

  // 执行方法

  private static executeSeasonalBonus(
    context: RuleExecutionContext,
    zodiac: ZodiacSign,
    bonus: ZodiacSeasonalBonus
  ): RuleExecutionResult {
    const effects: GameEffect[] = [{
      type: 'money',
      target: 'self',
      value: context.action.data?.baseValue * bonus.bonusMultiplier || 0,
      description: `${zodiac}季节加成 (${bonus.bonusMultiplier}x)`
    }];

    return {
      success: true,
      message: `${zodiac}在${bonus.favorableSeason}季获得特殊加成`,
      effects,
      validationsPassed: [`seasonal_bonus_${zodiac}`],
      validationsFailed: [],
      stateChanges: [],
      triggeredEvents: ['seasonal_bonus_applied']
    };
  }

  private static executeWeatherEffect(
    context: RuleExecutionContext,
    zodiac: ZodiacSign,
    weatherSensitivity: WeatherSensitivity
  ): RuleExecutionResult {
    const { gameState } = context;
    const currentWeather = gameState.weather;
    
    let modifier = 0;
    let description = '';
    
    if (weatherSensitivity.favorableWeather.includes(currentWeather)) {
      modifier = weatherSensitivity.bonusInFavorable;
      description = `${zodiac}在${currentWeather}天获得加成`;
    } else if (weatherSensitivity.unfavorableWeather.includes(currentWeather)) {
      modifier = weatherSensitivity.penaltyInUnfavorable;
      description = `${zodiac}在${currentWeather}天受到影响`;
    }

    const effects: GameEffect[] = [{
      type: 'modifier',
      target: 'self',
      value: modifier,
      description
    }];

    return {
      success: true,
      message: description,
      effects,
      validationsPassed: [`weather_effect_${zodiac}`],
      validationsFailed: [],
      stateChanges: [],
      triggeredEvents: ['weather_effect_applied']
    };
  }

  private static executeCompatibility(context: RuleExecutionContext): RuleExecutionResult {
    // 实现兼容性效果
    return {
      success: true,
      message: '生肖兼容性效果已应用',
      effects: [],
      validationsPassed: ['zodiac_compatibility'],
      validationsFailed: [],
      stateChanges: [],
      triggeredEvents: []
    };
  }

  private static executeElementalInteraction(context: RuleExecutionContext): RuleExecutionResult {
    // 实现元素相克效果
    return {
      success: true,
      message: '五行相克效果已应用',
      effects: [],
      validationsPassed: ['elemental_interaction'],
      validationsFailed: [],
      stateChanges: [],
      triggeredEvents: []
    };
  }

  private static executeSeasonalEvent(
    context: RuleExecutionContext,
    event: SeasonalEvent
  ): RuleExecutionResult {
    const effects: GameEffect[] = event.effects.map(effect => ({
      type: effect.type as any,
      target: effect.target as any,
      value: effect.value,
      description: effect.description
    }));

    return {
      success: true,
      message: `季节事件"${event.name}"已触发`,
      effects,
      validationsPassed: [`seasonal_event_${event.id}`],
      validationsFailed: [],
      stateChanges: [],
      triggeredEvents: ['seasonal_event_triggered']
    };
  }

  private static executeSkillEnhancement(context: RuleExecutionContext): RuleExecutionResult {
    const { currentPlayer, gameState } = context;
    const zodiacData = ZODIAC_SEASONAL_MAPPING[currentPlayer.zodiac];
    
    let enhancementMultiplier = 1.0;
    
    // 季节加成
    if (gameState.season === zodiacData.favorableSeason) {
      enhancementMultiplier *= 1.2;
    }
    
    // 天气加成
    const weatherBonus = this.calculateWeatherBonus(currentPlayer.zodiac, gameState.weather);
    enhancementMultiplier *= (1 + weatherBonus);
    
    const effects: GameEffect[] = [{
      type: 'skill_enhancement',
      target: 'self',
      value: enhancementMultiplier,
      description: `${currentPlayer.zodiac}技能强化 (${enhancementMultiplier.toFixed(1)}x)`
    }];

    return {
      success: true,
      message: `${currentPlayer.zodiac}技能获得强化`,
      effects,
      validationsPassed: ['zodiac_skill_enhancement'],
      validationsFailed: [],
      stateChanges: [],
      triggeredEvents: ['skill_enhanced']
    };
  }

  // 辅助方法

  private static evaluateTriggerCondition(
    trigger: SeasonalTrigger,
    context: RuleExecutionContext
  ): boolean {
    // 简化的条件评估
    return Math.random() < trigger.probability;
  }

  private static calculateWeatherBonus(zodiac: ZodiacSign, weather: Weather): number {
    const zodiacData = ZODIAC_SEASONAL_MAPPING[zodiac];
    const weatherSensitivity = zodiacData.weatherSensitivity;
    
    if (weatherSensitivity.favorableWeather.includes(weather)) {
      return weatherSensitivity.bonusInFavorable;
    } else if (weatherSensitivity.unfavorableWeather.includes(weather)) {
      return weatherSensitivity.penaltyInUnfavorable;
    }
    
    return 0;
  }
}

/**
 * 生肖兼容性计算器
 */
export class ZodiacCompatibilityCalculator {
  /**
   * 计算两个生肖之间的兼容性
   */
  static calculateCompatibility(zodiac1: ZodiacSign, zodiac2: ZodiacSign): ZodiacCompatibility | null {
    return ZODIAC_COMPATIBILITY_MATRIX.find(
      comp => (comp.zodiac1 === zodiac1 && comp.zodiac2 === zodiac2) ||
              (comp.zodiac1 === zodiac2 && comp.zodiac2 === zodiac1)
    ) || null;
  }

  /**
   * 计算元素相克加成
   */
  static calculateElementalBonus(
    attackerZodiac: ZodiacSign,
    defenderZodiac: ZodiacSign,
    season: Season
  ): number {
    const attackerElement = ZODIAC_ELEMENT_MAPPING[attackerZodiac];
    const defenderElement = ZODIAC_ELEMENT_MAPPING[defenderZodiac];
    
    const attackerCycle = ELEMENTAL_CYCLES[attackerElement];
    const seasonPower = attackerCycle.seasonalPower[season];
    
    let elementalBonus = 1.0;
    
    if (attackerCycle.strengthensAgainst.includes(defenderElement)) {
      elementalBonus = 1.3; // 相克加成30%
    } else if (attackerCycle.weakensAgainst.includes(defenderElement)) {
      elementalBonus = 0.7; // 被克减少30%
    }
    
    return elementalBonus * seasonPower;
  }

  /**
   * 获取生肖在当前季节的整体力量
   */
  static getZodiacSeasonalPower(zodiac: ZodiacSign, season: Season, weather: Weather): number {
    const zodiacData = ZODIAC_SEASONAL_MAPPING[zodiac];
    const element = ZODIAC_ELEMENT_MAPPING[zodiac];
    const elementalCycle = ELEMENTAL_CYCLES[element];
    
    let totalPower = 1.0;
    
    // 季节加成
    if (season === zodiacData.favorableSeason) {
      totalPower *= zodiacData.bonusMultiplier;
    }
    
    // 元素季节力量
    totalPower *= elementalCycle.seasonalPower[season];
    
    // 天气影响
    const weatherSensitivity = zodiacData.weatherSensitivity;
    if (weatherSensitivity.favorableWeather.includes(weather)) {
      totalPower *= (1 + weatherSensitivity.bonusInFavorable);
    } else if (weatherSensitivity.unfavorableWeather.includes(weather)) {
      totalPower *= (1 + weatherSensitivity.penaltyInUnfavorable);
    }
    
    return totalPower;
  }
}