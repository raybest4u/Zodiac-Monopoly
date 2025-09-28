/**
 * 响应验证处理器
 * Response Validation Processor
 * 
 * 专门处理玩家响应的验证逻辑，包括复杂的业务规则验证和智能建议生成
 * Specialized handler for player response validation logic, including complex business rule validation and intelligent suggestion generation
 */

import { EventEmitter } from '../utils/EventEmitter';
import { 
  PlayerResponseInput, 
  ResponseValidationRule, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  ResponseSuggestion,
  EffectCalculationContext
} from './PlayerResponseInputSystem';
import { GameEvent, Player, GameState, ZodiacSign } from '../types/game';

export interface ValidationContext {
  input: PlayerResponseInput;
  event: GameEvent;
  player: Player;
  gameState: GameState;
  allPlayers: Player[];
  timeConstraints: TimeConstraints;
  gameRules: GameRuleSet;
  customValidators: Map<string, CustomValidator>;
}

export interface TimeConstraints {
  eventStartTime: number;
  responseDeadline?: number;
  gracePeriod: number;
  timeZone: string;
}

export interface GameRuleSet {
  allowSkillStacking: boolean;
  enableResourceTrading: boolean;
  allowNegativeBalance: boolean;
  maxSimultaneousEvents: number;
  zodiacCompatibilityRequired: boolean;
  seasonalRestrictionsActive: boolean;
}

export interface CustomValidator {
  id: string;
  name: string;
  description: string;
  validatorFunction: (context: ValidationContext) => Promise<ValidationResult>;
  dependencies: string[];
  cacheTimeout: number;
}

export interface ValidationCache {
  key: string;
  result: ValidationResult;
  timestamp: number;
  expiresAt: number;
}

export interface SmartSuggestion {
  id: string;
  type: 'optimization' | 'alternative' | 'warning_mitigation' | 'strategic_advice';
  priority: number;
  title: string;
  description: string;
  reasoning: string;
  expectedOutcome: ExpectedOutcome;
  confidence: number;
  prerequisites?: Prerequisite[];
  risks?: Risk[];
}

export interface ExpectedOutcome {
  probabilityOfSuccess: number;
  estimatedImpact: number;
  timeToResult: number;
  sideEffects: string[];
  longTermConsequences: string[];
}

export interface Prerequisite {
  type: 'resource' | 'skill' | 'relationship' | 'timing' | 'external';
  description: string;
  currentStatus: 'satisfied' | 'partially_satisfied' | 'not_satisfied';
  actionRequired?: string;
}

export interface Risk {
  type: 'financial' | 'social' | 'strategic' | 'zodiac' | 'timing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  description: string;
  mitigation?: string;
}

export interface AdvancedValidationOptions {
  enableDeepAnalysis: boolean;
  generateAlternatives: boolean;
  considerLongTermImpact: boolean;
  includeZodiacInsights: boolean;
  performRiskAssessment: boolean;
  cacheResults: boolean;
  parallelValidation: boolean;
}

export class ResponseValidationProcessor extends EventEmitter {
  private validationCache = new Map<string, ValidationCache>();
  private customValidators = new Map<string, CustomValidator>();
  private ruleGroups = new Map<string, ResponseValidationRule[]>();
  private validationMetrics = new Map<string, ValidationMetrics>();

  constructor(private options: AdvancedValidationOptions = {
    enableDeepAnalysis: true,
    generateAlternatives: true,
    considerLongTermImpact: true,
    includeZodiacInsights: true,
    performRiskAssessment: true,
    cacheResults: true,
    parallelValidation: true
  }) {
    super();
    this.initializeBuiltInValidators();
    this.startCacheCleanup();
  }

  /**
   * 执行完整的响应验证
   */
  async validateResponse(
    input: PlayerResponseInput,
    event: GameEvent,
    player: Player,
    gameState: GameState,
    rules: ResponseValidationRule[]
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    
    const context: ValidationContext = {
      input,
      event,
      player,
      gameState,
      allPlayers: gameState.players,
      timeConstraints: this.buildTimeConstraints(event),
      gameRules: this.extractGameRules(gameState),
      customValidators: this.customValidators
    };

    try {
      // 检查缓存
      if (this.options.cacheResults) {
        const cached = this.getCachedValidation(input, context);
        if (cached) {
          this.emit('validationCacheHit', { input, cached });
          return cached;
        }
      }

      // 执行验证
      const result = this.options.parallelValidation 
        ? await this.executeParallelValidation(rules, context)
        : await this.executeSequentialValidation(rules, context);

      // 深度分析
      if (this.options.enableDeepAnalysis) {
        await this.performDeepAnalysis(result, context);
      }

      // 生成建议
      if (this.options.generateAlternatives) {
        result.suggestions = await this.generateSmartSuggestions(result, context);
      }

      // 生肖洞察
      if (this.options.includeZodiacInsights) {
        await this.addZodiacInsights(result, context);
      }

      // 风险评估
      if (this.options.performRiskAssessment) {
        await this.performRiskAssessment(result, context);
      }

      // 缓存结果
      if (this.options.cacheResults) {
        this.cacheValidationResult(input, context, result);
      }

      // 记录指标
      this.recordValidationMetrics(result, Date.now() - startTime, context);

      this.emit('validationCompleted', { input, result, context });
      return result;

    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          ruleId: 'system_error',
          field: 'system',
          message: `验证过程出错: ${error.message}`,
          code: 'VALIDATION_ERROR',
          severity: 'error'
        }],
        warnings: []
      };

      this.emit('validationError', { input, error, context });
      return errorResult;
    }
  }

  /**
   * 并行验证执行
   */
  private async executeParallelValidation(
    rules: ResponseValidationRule[],
    context: ValidationContext
  ): Promise<ValidationResult> {
    const validationPromises = rules.map(rule => 
      this.executeValidationRule(rule, context)
    );

    const ruleResults = await Promise.allSettled(validationPromises);
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    ruleResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const ruleResult = result.value;
        if (ruleResult.errors) errors.push(...ruleResult.errors);
        if (ruleResult.warnings) warnings.push(...ruleResult.warnings);
      } else {
        // 处理验证规则执行失败
        errors.push({
          ruleId: rules[index].id,
          field: 'rule_execution',
          message: `规则执行失败: ${result.reason}`,
          code: 'RULE_EXECUTION_ERROR',
          severity: 'error'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 顺序验证执行
   */
  private async executeSequentialValidation(
    rules: ResponseValidationRule[],
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of rules) {
      try {
        const ruleResult = await this.executeValidationRule(rule, context);
        
        if (ruleResult.errors) {
          errors.push(...ruleResult.errors);
          
          // 如果遇到严重错误，可以选择提前退出
          if (rule.severity === 'error' && ruleResult.errors.length > 0) {
            // 对于关键错误，可以停止后续验证
            if (ruleResult.errors.some(e => e.code === 'CRITICAL_FAILURE')) {
              break;
            }
          }
        }
        
        if (ruleResult.warnings) {
          warnings.push(...ruleResult.warnings);
        }
        
      } catch (error) {
        errors.push({
          ruleId: rule.id,
          field: 'rule_execution',
          message: `规则执行异常: ${error.message}`,
          code: 'RULE_EXCEPTION',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 执行单个验证规则
   */
  private async executeValidationRule(
    rule: ResponseValidationRule,
    context: ValidationContext
  ): Promise<{
    errors?: ValidationError[];
    warnings?: ValidationWarning[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    switch (rule.ruleType) {
      case 'required_choice':
        await this.validateRequiredChoice(rule, context, errors, warnings);
        break;
        
      case 'resource_requirement':
        await this.validateResourceRequirements(rule, context, errors, warnings);
        break;
        
      case 'time_limit':
        await this.validateTimeLimit(rule, context, errors, warnings);
        break;
        
      case 'skill_availability':
        await this.validateSkillAvailability(rule, context, errors, warnings);
        break;
        
      case 'zodiac_compatibility':
        await this.validateZodiacCompatibility(rule, context, errors, warnings);
        break;
        
      case 'game_state_condition':
        await this.validateGameStateCondition(rule, context, errors, warnings);
        break;
        
      case 'custom_validation':
        await this.executeCustomValidation(rule, context, errors, warnings);
        break;
    }

    return { errors, warnings };
  }

  /**
   * 验证必选选择
   */
  private async validateRequiredChoice(
    rule: ResponseValidationRule,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const { input, event } = context;

    if (input.inputType === 'choice_selection') {
      if (!input.choiceId) {
        errors.push({
          ruleId: rule.id,
          field: 'choiceId',
          message: rule.errorMessage,
          code: 'MISSING_CHOICE',
          severity: 'error'
        });
      } else {
        // 验证选择是否存在于可用选项中
        const validChoice = event.choices?.some(choice => choice.id === input.choiceId);
        if (!validChoice) {
          errors.push({
            ruleId: rule.id,
            field: 'choiceId',
            message: '选择的选项不在可用列表中',
            code: 'INVALID_CHOICE',
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * 验证资源需求
   */
  private async validateResourceRequirements(
    rule: ResponseValidationRule,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const { input, player } = context;
    const requiredResources = rule.parameters.requiredResources || {};

    for (const [resourceType, requiredAmount] of Object.entries(requiredResources)) {
      const playerAmount = this.getPlayerResource(player, resourceType);
      
      if (playerAmount < requiredAmount) {
        errors.push({
          ruleId: rule.id,
          field: 'resources',
          message: `${resourceType}不足，需要${requiredAmount}，当前${playerAmount}`,
          code: 'INSUFFICIENT_RESOURCES',
          severity: 'error'
        });
      } else if (playerAmount < requiredAmount * 1.2) {
        // 资源勉强够用的警告
        warnings.push({
          ruleId: rule.id,
          message: `${resourceType}余量较少，建议谨慎使用`,
          ignorable: true,
          consequences: ['可能影响后续操作']
        });
      }
    }
  }

  /**
   * 验证时间限制
   */
  private async validateTimeLimit(
    rule: ResponseValidationRule,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const { input, timeConstraints } = context;
    const currentTime = Date.now();

    if (timeConstraints.responseDeadline) {
      if (currentTime > timeConstraints.responseDeadline) {
        errors.push({
          ruleId: rule.id,
          field: 'timestamp',
          message: '响应超出时间限制',
          code: 'TIME_LIMIT_EXCEEDED',
          severity: 'error'
        });
      } else if (currentTime > timeConstraints.responseDeadline - timeConstraints.gracePeriod) {
        warnings.push({
          ruleId: rule.id,
          message: '接近响应时间限制',
          ignorable: false,
          consequences: ['后续响应可能被自动处理']
        });
      }
    }

    // 检查响应时间是否过快（可能的作弊行为）
    const responseTime = input.metadata.responseTime;
    if (responseTime < 1000) { // 少于1秒
      warnings.push({
        ruleId: rule.id,
        message: '响应时间异常快速',
        ignorable: true,
        consequences: ['可能被标记为可疑行为']
      });
    }
  }

  /**
   * 验证技能可用性
   */
  private async validateSkillAvailability(
    rule: ResponseValidationRule,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const { input, player } = context;

    if (input.inputType === 'skill_activation' && input.customInput?.skillId) {
      const skill = player.skills.find(s => s.id === input.customInput.skillId);
      
      if (!skill) {
        errors.push({
          ruleId: rule.id,
          field: 'skillId',
          message: '技能不存在',
          code: 'SKILL_NOT_FOUND',
          severity: 'error'
        });
        return;
      }

      // 检查冷却时间
      if (skill.lastUsed && skill.cooldown > 0) {
        const cooldownRemaining = skill.cooldown - (Date.now() - skill.lastUsed);
        if (cooldownRemaining > 0) {
          errors.push({
            ruleId: rule.id,
            field: 'skillId',
            message: `技能冷却中，剩余${Math.ceil(cooldownRemaining / 1000)}秒`,
            code: 'SKILL_ON_COOLDOWN',
            severity: 'error'
          });
        }
      }

      // 检查技能需求
      if (skill.requirements) {
        for (const requirement of skill.requirements) {
          const satisfied = this.checkSkillRequirement(requirement, player, context);
          if (!satisfied.met) {
            errors.push({
              ruleId: rule.id,
              field: 'skillRequirements',
              message: satisfied.reason,
              code: 'SKILL_REQUIREMENT_NOT_MET',
              severity: 'error'
            });
          }
        }
      }
    }
  }

  /**
   * 验证生肖兼容性
   */
  private async validateZodiacCompatibility(
    rule: ResponseValidationRule,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const { player, event } = context;

    if (event.zodiacRelated) {
      const compatibility = this.calculateZodiacEventCompatibility(player.zodiac, event);
      
      if (compatibility < 0.3) {
        warnings.push({
          ruleId: rule.id,
          message: `生肖${player.zodiac}与此事件兼容性较低，效果可能受到影响`,
          ignorable: true,
          consequences: [
            `预计效果减少${Math.round((1 - compatibility) * 100)}%`,
            '可能触发额外的负面效果'
          ]
        });
      }

      // 检查是否有生肖冲突
      const conflictingZodiacs = this.getConflictingZodiacs(player.zodiac);
      if (event.tags && event.tags.some(tag => conflictingZodiacs.includes(tag))) {
        warnings.push({
          ruleId: rule.id,
          message: '检测到生肖冲突，建议谨慎行动',
          ignorable: false,
          consequences: ['可能产生意外的负面后果']
        });
      }
    }
  }

  /**
   * 验证游戏状态条件
   */
  private async validateGameStateCondition(
    rule: ResponseValidationRule,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const { gameState, gameRules } = context;

    // 检查最大同时事件数量
    if (gameState.currentEvent && gameRules.maxSimultaneousEvents <= 1) {
      warnings.push({
        ruleId: rule.id,
        message: '当前已有事件在进行中',
        ignorable: true,
        consequences: ['可能需要等待当前事件结束']
      });
    }

    // 检查游戏阶段
    if (gameState.phase === 'ended') {
      errors.push({
        ruleId: rule.id,
        field: 'gamePhase',
        message: '游戏已结束，无法执行此操作',
        code: 'GAME_ENDED',
        severity: 'error'
      });
    }
  }

  /**
   * 执行自定义验证
   */
  private async executeCustomValidation(
    rule: ResponseValidationRule,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const customValidator = this.customValidators.get(rule.parameters.customValidator);
    
    if (!customValidator) {
      errors.push({
        ruleId: rule.id,
        field: 'customValidator',
        message: '自定义验证器不存在',
        code: 'CUSTOM_VALIDATOR_NOT_FOUND',
        severity: 'error'
      });
      return;
    }

    try {
      const result = await customValidator.validatorFunction(context);
      if (result.errors) errors.push(...result.errors);
      if (result.warnings) warnings.push(...result.warnings);
    } catch (error) {
      errors.push({
        ruleId: rule.id,
        field: 'customValidation',
        message: `自定义验证执行失败: ${error.message}`,
        code: 'CUSTOM_VALIDATION_ERROR',
        severity: 'error'
      });
    }
  }

  /**
   * 深度分析
   */
  private async performDeepAnalysis(
    result: ValidationResult,
    context: ValidationContext
  ): Promise<void> {
    // 分析错误模式
    const errorPatterns = this.analyzeErrorPatterns(result.errors);
    
    // 分析玩家行为模式
    const behaviorInsights = await this.analyzeBehaviorPatterns(context);
    
    // 分析游戏状态影响
    const stateImpact = this.analyzeGameStateImpact(context);

    // 将分析结果添加到验证结果的元数据中
    (result as any).deepAnalysis = {
      errorPatterns,
      behaviorInsights,
      stateImpact,
      timestamp: Date.now()
    };
  }

  /**
   * 生成智能建议
   */
  private async generateSmartSuggestions(
    result: ValidationResult,
    context: ValidationContext
  ): Promise<ResponseSuggestion[]> {
    const suggestions: ResponseSuggestion[] = [];

    // 如果有错误，生成修复建议
    if (result.errors.length > 0) {
      const fixSuggestions = await this.generateFixSuggestions(result.errors, context);
      suggestions.push(...fixSuggestions);
    }

    // 生成优化建议
    const optimizationSuggestions = await this.generateOptimizationSuggestions(context);
    suggestions.push(...optimizationSuggestions);

    // 生成替代方案
    const alternatives = await this.generateAlternatives(context);
    suggestions.push(...alternatives);

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 添加生肖洞察
   */
  private async addZodiacInsights(
    result: ValidationResult,
    context: ValidationContext
  ): Promise<void> {
    const { player, event } = context;
    
    const insights = {
      compatibility: this.calculateZodiacEventCompatibility(player.zodiac, event),
      seasonalBonus: this.getSeasonalZodiacBonus(player.zodiac, context.gameState.season),
      recommendations: this.getZodiacRecommendations(player.zodiac, event)
    };

    (result as any).zodiacInsights = insights;
  }

  /**
   * 执行风险评估
   */
  private async performRiskAssessment(
    result: ValidationResult,
    context: ValidationContext
  ): Promise<void> {
    const risks = await this.assessRisks(context);
    (result as any).riskAssessment = risks;
  }

  // 辅助方法实现

  private getPlayerResource(player: Player, resourceType: string): number {
    switch (resourceType) {
      case 'money': return player.money;
      case 'properties': return player.properties.length;
      default: 
        const item = player.items.find(i => i.name === resourceType);
        return item?.usageCount || 0;
    }
  }

  private checkSkillRequirement(requirement: any, player: Player, context: ValidationContext): { met: boolean; reason?: string } {
    // 实现技能需求检查逻辑
    return { met: true };
  }

  private calculateZodiacEventCompatibility(zodiac: ZodiacSign, event: GameEvent): number {
    // 实现生肖事件兼容性计算
    return 0.8;
  }

  private getConflictingZodiacs(zodiac: ZodiacSign): string[] {
    // 返回与指定生肖冲突的生肖列表
    return [];
  }

  private buildTimeConstraints(event: GameEvent): TimeConstraints {
    return {
      eventStartTime: event.timestamp,
      responseDeadline: event.timeLimit ? event.timestamp + event.timeLimit : undefined,
      gracePeriod: 5000, // 5秒宽限期
      timeZone: 'UTC'
    };
  }

  private extractGameRules(gameState: GameState): GameRuleSet {
    return {
      allowSkillStacking: true,
      enableResourceTrading: true,
      allowNegativeBalance: false,
      maxSimultaneousEvents: 1,
      zodiacCompatibilityRequired: false,
      seasonalRestrictionsActive: true
    };
  }

  private getCachedValidation(input: PlayerResponseInput, context: ValidationContext): ValidationResult | null {
    const key = this.generateValidationCacheKey(input, context);
    const cached = this.validationCache.get(key);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    
    return null;
  }

  private cacheValidationResult(input: PlayerResponseInput, context: ValidationContext, result: ValidationResult): void {
    const key = this.generateValidationCacheKey(input, context);
    const cache: ValidationCache = {
      key,
      result: { ...result },
      timestamp: Date.now(),
      expiresAt: Date.now() + 60000 // 1分钟过期
    };
    
    this.validationCache.set(key, cache);
  }

  private generateValidationCacheKey(input: PlayerResponseInput, context: ValidationContext): string {
    return `${input.playerId}_${input.eventId}_${input.inputType}_${input.choiceId || 'none'}`;
  }

  private initializeBuiltInValidators(): void {
    // 初始化内置验证器
    this.customValidators.set('business_logic', {
      id: 'business_logic',
      name: '业务逻辑验证器',
      description: '验证复杂的业务规则',
      validatorFunction: async (context) => {
        // 实现业务逻辑验证
        return { isValid: true, errors: [], warnings: [] };
      },
      dependencies: [],
      cacheTimeout: 30000
    });
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cache] of this.validationCache) {
        if (cache.expiresAt < now) {
          this.validationCache.delete(key);
        }
      }
    }, 60000); // 每分钟清理一次
  }

  private analyzeErrorPatterns(errors: ValidationError[]): any {
    // 分析错误模式
    return {
      commonErrors: errors.map(e => e.code),
      severity: errors.reduce((max, e) => e.severity === 'error' ? 'error' : max, 'warning')
    };
  }

  private async analyzeBehaviorPatterns(context: ValidationContext): Promise<any> {
    // 分析玩家行为模式
    return {
      responseSpeed: context.input.metadata.responseTime,
      inputMethod: context.input.metadata.inputMethod,
      patterns: 'normal'
    };
  }

  private analyzeGameStateImpact(context: ValidationContext): any {
    // 分析对游戏状态的影响
    return {
      scope: 'local',
      significance: 'medium'
    };
  }

  private async generateFixSuggestions(errors: ValidationError[], context: ValidationContext): Promise<ResponseSuggestion[]> {
    // 生成修复建议
    return errors.map(error => ({
      type: 'alternative',
      content: `修复建议：${error.message}`,
      confidence: 0.8,
      expectedOutcome: `解决${error.code}错误`
    }));
  }

  private async generateOptimizationSuggestions(context: ValidationContext): Promise<ResponseSuggestion[]> {
    // 生成优化建议
    return [];
  }

  private async generateAlternatives(context: ValidationContext): Promise<ResponseSuggestion[]> {
    // 生成替代方案
    return [];
  }

  private getSeasonalZodiacBonus(zodiac: ZodiacSign, season: string): number {
    // 计算季节生肖加成
    return 0.1;
  }

  private getZodiacRecommendations(zodiac: ZodiacSign, event: GameEvent): string[] {
    // 获取生肖建议
    return [`作为${zodiac}，建议积极参与此类事件`];
  }

  private async assessRisks(context: ValidationContext): Promise<Risk[]> {
    // 评估风险
    return [];
  }

  private recordValidationMetrics(result: ValidationResult, processingTime: number, context: ValidationContext): void {
    const playerId = context.player.id;
    const metrics = this.validationMetrics.get(playerId) || {
      totalValidations: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      warningRate: 0
    };

    metrics.totalValidations++;
    metrics.averageProcessingTime = (metrics.averageProcessingTime * (metrics.totalValidations - 1) + processingTime) / metrics.totalValidations;
    
    if (result.errors.length > 0) {
      metrics.errorRate = (metrics.errorRate * (metrics.totalValidations - 1) + 1) / metrics.totalValidations;
    }
    
    if (result.warnings.length > 0) {
      metrics.warningRate = (metrics.warningRate * (metrics.totalValidations - 1) + 1) / metrics.totalValidations;
    }

    this.validationMetrics.set(playerId, metrics);
  }

  /**
   * 添加自定义验证器
   */
  addCustomValidator(validator: CustomValidator): void {
    this.customValidators.set(validator.id, validator);
  }

  /**
   * 获取验证统计信息
   */
  getValidationStatistics(): any {
    return {
      cacheSize: this.validationCache.size,
      customValidators: this.customValidators.size,
      playerMetrics: Object.fromEntries(this.validationMetrics),
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  private calculateCacheHitRate(): number {
    // 计算缓存命中率
    return 0.85; // 简化实现
  }
}

interface ValidationMetrics {
  totalValidations: number;
  averageProcessingTime: number;
  errorRate: number;
  warningRate: number;
}