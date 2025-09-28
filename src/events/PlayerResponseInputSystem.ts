/**
 * 玩家响应输入系统
 * Player Response Input System
 * 
 * 处理玩家对事件的响应输入，包括选择验证、输入处理和决策记录
 * Handles player response input to events, including choice validation, input processing, and decision recording
 */

import { EventEmitter } from '../utils/EventEmitter';
import { GameEvent, EventChoice, Player, ZodiacSign } from '../types/game';

export interface PlayerResponseInput {
  playerId: string;
  eventId: string;
  choiceId?: string;
  customInput?: any;
  timestamp: number;
  sessionId: string;
  inputType: ResponseInputType;
  metadata: {
    responseTime: number;
    inputMethod: InputMethod;
    confidence?: number;
    alternatives?: string[];
  };
}

export type ResponseInputType = 
  | 'choice_selection' 
  | 'text_input' 
  | 'numeric_input'
  | 'skill_activation'
  | 'item_usage'
  | 'trade_proposal'
  | 'auction_bid'
  | 'negotiation'
  | 'custom_action';

export type InputMethod = 
  | 'click' | 'keyboard' | 'voice' | 'gesture' 
  | 'ai_decision' | 'auto_pilot' | 'script';

export interface ResponseValidationRule {
  id: string;
  name: string;
  description: string;
  ruleType: ValidationRuleType;
  parameters: ValidationParameters;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

export type ValidationRuleType = 
  | 'required_choice'
  | 'resource_requirement'
  | 'time_limit'
  | 'skill_availability'
  | 'zodiac_compatibility'
  | 'game_state_condition'
  | 'custom_validation';

export interface ValidationParameters {
  minValue?: number;
  maxValue?: number;
  requiredResources?: Record<string, number>;
  timeLimit?: number;
  allowedChoices?: string[];
  skillRequirements?: SkillRequirement[];
  zodiacRestrictions?: ZodiacSign[];
  customValidator?: string;
}

export interface SkillRequirement {
  skillId: string;
  minLevel: number;
  cooldownCheck: boolean;
  resourceCost?: Record<string, number>;
}

export interface ResponseInputContext {
  event: GameEvent;
  player: Player;
  gameState: any;
  availableChoices: EventChoice[];
  timeRemaining?: number;
  previousResponses: PlayerResponseInput[];
  hints?: ResponseHint[];
}

export interface ResponseHint {
  id: string;
  type: 'suggestion' | 'warning' | 'tip' | 'zodiac_advice';
  content: string;
  priority: number;
  conditions?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: ResponseSuggestion[];
  modifiedInput?: PlayerResponseInput;
}

export interface ValidationError {
  ruleId: string;
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  ruleId: string;
  message: string;
  ignorable: boolean;
  consequences?: string[];
}

export interface ResponseSuggestion {
  type: 'alternative' | 'optimization' | 'zodiac_synergy';
  content: string;
  choiceId?: string;
  expectedOutcome?: string;
  confidence: number;
}

export interface ResponseProcessingResult {
  success: boolean;
  processedInput: PlayerResponseInput;
  validationResult: ValidationResult;
  effects: ResponseEffect[];
  nextActions?: NextActionSuggestion[];
  error?: Error;
}

export interface ResponseEffect {
  type: 'immediate' | 'delayed' | 'conditional';
  target: 'player' | 'game_state' | 'other_players' | 'board';
  effectId: string;
  parameters: Record<string, any>;
  duration?: number;
  priority: number;
}

export interface NextActionSuggestion {
  actionType: string;
  description: string;
  parameters?: Record<string, any>;
  timeFrame: 'immediate' | 'next_turn' | 'future';
  priority: number;
}

export class PlayerResponseInputSystem extends EventEmitter {
  private validationRules = new Map<string, ResponseValidationRule>();
  private activeInputSessions = new Map<string, ResponseInputContext>();
  private responseHistory = new Map<string, PlayerResponseInput[]>();
  private inputTimeouts = new Map<string, NodeJS.Timeout>();

  constructor() {
    super();
    this.initializeDefaultValidationRules();
  }

  /**
   * 开始响应输入会话
   */
  startResponseSession(
    event: GameEvent,
    player: Player,
    gameState: any,
    timeLimit?: number
  ): string {
    const sessionId = `session_${Date.now()}_${player.id}`;
    
    const context: ResponseInputContext = {
      event,
      player,
      gameState,
      availableChoices: event.choices || [],
      timeRemaining: timeLimit,
      previousResponses: this.getPlayerResponseHistory(player.id),
      hints: this.generateResponseHints(event, player, gameState)
    };

    this.activeInputSessions.set(sessionId, context);

    // 设置超时处理
    if (timeLimit && timeLimit > 0) {
      const timeout = setTimeout(() => {
        this.handleResponseTimeout(sessionId);
      }, timeLimit);
      
      this.inputTimeouts.set(sessionId, timeout);
    }

    this.emit('responseSessionStarted', { sessionId, context });
    return sessionId;
  }

  /**
   * 处理玩家响应输入
   */
  async processPlayerResponse(
    sessionId: string,
    input: Partial<PlayerResponseInput>
  ): Promise<ResponseProcessingResult> {
    const context = this.activeInputSessions.get(sessionId);
    if (!context) {
      throw new Error(`Invalid session ID: ${sessionId}`);
    }

    // 构造完整的响应输入
    const fullInput: PlayerResponseInput = {
      playerId: context.player.id,
      eventId: context.event.id,
      timestamp: Date.now(),
      sessionId,
      inputType: input.inputType || 'choice_selection',
      metadata: {
        responseTime: Date.now() - context.event.timestamp,
        inputMethod: input.metadata?.inputMethod || 'click',
        ...input.metadata
      },
      ...input
    };

    try {
      // 验证输入
      const validationResult = await this.validateResponse(fullInput, context);
      
      if (!validationResult.isValid) {
        return {
          success: false,
          processedInput: fullInput,
          validationResult,
          effects: [],
          error: new Error('Input validation failed')
        };
      }

      // 处理输入
      const effects = await this.processValidatedInput(fullInput, context);

      // 记录响应历史
      this.recordResponse(fullInput);

      // 清理会话
      this.cleanupSession(sessionId);

      // 触发后续处理
      this.emit('responseProcessed', {
        input: fullInput,
        context,
        effects
      });

      return {
        success: true,
        processedInput: fullInput,
        validationResult,
        effects,
        nextActions: this.generateNextActionSuggestions(fullInput, context)
      };

    } catch (error) {
      return {
        success: false,
        processedInput: fullInput,
        validationResult: { isValid: false, errors: [], warnings: [] },
        effects: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * 验证玩家响应
   */
  private async validateResponse(
    input: PlayerResponseInput,
    context: ResponseInputContext
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ResponseSuggestion[] = [];

    // 获取适用的验证规则
    const applicableRules = this.getApplicableValidationRules(input, context);

    for (const rule of applicableRules) {
      const ruleResult = await this.executeValidationRule(rule, input, context);
      
      if (ruleResult.errors) {
        errors.push(...ruleResult.errors);
      }
      
      if (ruleResult.warnings) {
        warnings.push(...ruleResult.warnings);
      }
      
      if (ruleResult.suggestions) {
        suggestions.push(...ruleResult.suggestions);
      }
    }

    // 检查选择有效性
    if (input.inputType === 'choice_selection' && input.choiceId) {
      const choiceExists = context.availableChoices.some(c => c.id === input.choiceId);
      if (!choiceExists) {
        errors.push({
          ruleId: 'invalid_choice',
          field: 'choiceId',
          message: '无效的选择',
          code: 'INVALID_CHOICE',
          severity: 'error'
        });
      }
    }

    // 检查时间限制
    if (context.timeRemaining && context.timeRemaining > 0) {
      const elapsed = Date.now() - context.event.timestamp;
      if (elapsed > context.timeRemaining) {
        errors.push({
          ruleId: 'time_limit_exceeded',
          field: 'timestamp',
          message: '响应时间超限',
          code: 'TIME_LIMIT_EXCEEDED',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * 获取适用的验证规则
   */
  private getApplicableValidationRules(
    input: PlayerResponseInput,
    context: ResponseInputContext
  ): ResponseValidationRule[] {
    const applicable: ResponseValidationRule[] = [];

    for (const rule of this.validationRules.values()) {
      if (this.isRuleApplicable(rule, input, context)) {
        applicable.push(rule);
      }
    }

    return applicable;
  }

  /**
   * 检查规则是否适用
   */
  private isRuleApplicable(
    rule: ResponseValidationRule,
    input: PlayerResponseInput,
    context: ResponseInputContext
  ): boolean {
    // 根据事件类型和输入类型判断规则适用性
    switch (rule.ruleType) {
      case 'required_choice':
        return input.inputType === 'choice_selection';
      case 'resource_requirement':
        return ['skill_activation', 'item_usage', 'trade_proposal'].includes(input.inputType);
      case 'time_limit':
        return context.timeRemaining !== undefined;
      case 'skill_availability':
        return input.inputType === 'skill_activation';
      case 'zodiac_compatibility':
        return context.event.zodiacRelated === true;
      default:
        return true;
    }
  }

  /**
   * 执行验证规则
   */
  private async executeValidationRule(
    rule: ResponseValidationRule,
    input: PlayerResponseInput,
    context: ResponseInputContext
  ): Promise<{
    errors?: ValidationError[];
    warnings?: ValidationWarning[];
    suggestions?: ResponseSuggestion[];
  }> {
    const result: {
      errors?: ValidationError[];
      warnings?: ValidationWarning[];
      suggestions?: ResponseSuggestion[];
    } = {};

    switch (rule.ruleType) {
      case 'required_choice':
        if (!input.choiceId && input.inputType === 'choice_selection') {
          result.errors = [{
            ruleId: rule.id,
            field: 'choiceId',
            message: rule.errorMessage,
            code: 'MISSING_CHOICE',
            severity: 'error'
          }];
        }
        break;

      case 'resource_requirement':
        const resourceCheck = this.checkResourceRequirements(
          rule.parameters.requiredResources || {},
          context.player
        );
        if (!resourceCheck.sufficient) {
          result.errors = [{
            ruleId: rule.id,
            field: 'resources',
            message: `资源不足: ${resourceCheck.missing.join(', ')}`,
            code: 'INSUFFICIENT_RESOURCES',
            severity: 'error'
          }];
        }
        break;

      case 'skill_availability':
        if (input.inputType === 'skill_activation' && input.customInput?.skillId) {
          const skillCheck = this.checkSkillAvailability(
            input.customInput.skillId,
            context.player
          );
          if (!skillCheck.available) {
            result.errors = [{
              ruleId: rule.id,
              field: 'skillId',
              message: skillCheck.reason || '技能不可用',
              code: 'SKILL_UNAVAILABLE',
              severity: 'error'
            }];
          }
        }
        break;

      case 'zodiac_compatibility':
        const compatibilityCheck = this.checkZodiacCompatibility(
          input,
          context.player.zodiac,
          context.event
        );
        if (compatibilityCheck.penalty > 0) {
          result.warnings = [{
            ruleId: rule.id,
            message: `生肖不匹配，可能有 ${compatibilityCheck.penalty}% 的效果减免`,
            ignorable: true,
            consequences: ['效果减弱', '可能的负面影响']
          }];
        }
        break;
    }

    return result;
  }

  /**
   * 检查资源需求
   */
  private checkResourceRequirements(
    requiredResources: Record<string, number>,
    player: Player
  ): { sufficient: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const [resource, amount] of Object.entries(requiredResources)) {
      let playerAmount = 0;
      
      switch (resource) {
        case 'money':
          playerAmount = player.money;
          break;
        case 'properties':
          playerAmount = player.properties.length;
          break;
        default:
          // 检查其他资源类型
          const item = player.items.find(i => i.name === resource);
          playerAmount = item?.usageCount || 0;
      }

      if (playerAmount < amount) {
        missing.push(`${resource}(需要${amount}, 拥有${playerAmount})`);
      }
    }

    return {
      sufficient: missing.length === 0,
      missing
    };
  }

  /**
   * 检查技能可用性
   */
  private checkSkillAvailability(
    skillId: string,
    player: Player
  ): { available: boolean; reason?: string } {
    const skill = player.skills.find(s => s.id === skillId);
    
    if (!skill) {
      return { available: false, reason: '技能不存在' };
    }

    // 检查冷却时间
    if (skill.lastUsed && skill.cooldown > 0) {
      const cooldownRemaining = skill.cooldown - (Date.now() - skill.lastUsed);
      if (cooldownRemaining > 0) {
        return { 
          available: false, 
          reason: `技能冷却中，剩余${Math.ceil(cooldownRemaining / 1000)}秒` 
        };
      }
    }

    // 检查技能需求
    if (skill.requirements) {
      for (const req of skill.requirements) {
        const meetsRequirement = this.checkSkillRequirement(req, player);
        if (!meetsRequirement.satisfied) {
          return { 
            available: false, 
            reason: meetsRequirement.reason 
          };
        }
      }
    }

    return { available: true };
  }

  /**
   * 检查技能需求
   */
  private checkSkillRequirement(
    requirement: any,
    player: Player
  ): { satisfied: boolean; reason?: string } {
    switch (requirement.type) {
      case 'level':
        if (player.statistics.turnsPlayed < requirement.value) {
          return { 
            satisfied: false, 
            reason: `需要等级${requirement.value}` 
          };
        }
        break;
      case 'money':
        if (player.money < requirement.value) {
          return { 
            satisfied: false, 
            reason: `需要${requirement.value}金币` 
          };
        }
        break;
      case 'property_count':
        if (player.properties.length < requirement.value) {
          return { 
            satisfied: false, 
            reason: `需要拥有${requirement.value}个地产` 
          };
        }
        break;
    }

    return { satisfied: true };
  }

  /**
   * 检查生肖兼容性
   */
  private checkZodiacCompatibility(
    input: PlayerResponseInput,
    playerZodiac: ZodiacSign,
    event: GameEvent
  ): { penalty: number; bonus: number } {
    // 简化的生肖兼容性检查
    // 实际实现应该基于更复杂的生肖关系矩阵
    
    if (!event.zodiacRelated) {
      return { penalty: 0, bonus: 0 };
    }

    // 基于生肖和事件类型计算兼容性
    const baseCompatibility = this.calculateZodiacEventCompatibility(playerZodiac, event);
    
    return {
      penalty: Math.max(0, (1 - baseCompatibility) * 30), // 最多30%惩罚
      bonus: Math.max(0, (baseCompatibility - 0.5) * 20)   // 最多20%奖励
    };
  }

  /**
   * 计算生肖事件兼容性
   */
  private calculateZodiacEventCompatibility(zodiac: ZodiacSign, event: GameEvent): number {
    // 简化实现，实际应该基于复杂的生肖关系
    const zodiacEventMap: Record<ZodiacSign, number> = {
      '鼠': 0.8, '牛': 0.7, '虎': 0.9, '兔': 0.6,
      '龙': 0.9, '蛇': 0.7, '马': 0.8, '羊': 0.6,
      '猴': 0.9, '鸡': 0.7, '狗': 0.8, '猪': 0.6
    };

    return zodiacEventMap[zodiac] || 0.5;
  }

  /**
   * 处理验证通过的输入
   */
  private async processValidatedInput(
    input: PlayerResponseInput,
    context: ResponseInputContext
  ): Promise<ResponseEffect[]> {
    const effects: ResponseEffect[] = [];

    switch (input.inputType) {
      case 'choice_selection':
        if (input.choiceId) {
          const choice = context.availableChoices.find(c => c.id === input.choiceId);
          if (choice) {
            effects.push(...this.convertChoiceEffectsToResponseEffects(choice.effects));
          }
        }
        break;

      case 'skill_activation':
        if (input.customInput?.skillId) {
          effects.push({
            type: 'immediate',
            target: 'player',
            effectId: 'skill_activation',
            parameters: {
              skillId: input.customInput.skillId,
              playerId: input.playerId
            },
            priority: 5
          });
        }
        break;

      case 'item_usage':
        if (input.customInput?.itemId) {
          effects.push({
            type: 'immediate',
            target: 'player',
            effectId: 'item_usage',
            parameters: {
              itemId: input.customInput.itemId,
              playerId: input.playerId
            },
            priority: 3
          });
        }
        break;

      case 'trade_proposal':
        effects.push({
          type: 'delayed',
          target: 'other_players',
          effectId: 'trade_proposal_created',
          parameters: {
            proposerId: input.playerId,
            proposal: input.customInput
          },
          priority: 2
        });
        break;
    }

    return effects;
  }

  /**
   * 转换选择效果为响应效果
   */
  private convertChoiceEffectsToResponseEffects(choiceEffects: any[]): ResponseEffect[] {
    return choiceEffects.map(effect => ({
      type: effect.duration ? 'delayed' : 'immediate',
      target: effect.target,
      effectId: effect.type,
      parameters: {
        value: effect.value,
        description: effect.description
      },
      duration: effect.duration,
      priority: 1
    }));
  }

  /**
   * 生成响应提示
   */
  private generateResponseHints(
    event: GameEvent,
    player: Player,
    gameState: any
  ): ResponseHint[] {
    const hints: ResponseHint[] = [];

    // 生肖相关提示
    if (event.zodiacRelated) {
      const compatibility = this.calculateZodiacEventCompatibility(player.zodiac, event);
      if (compatibility > 0.7) {
        hints.push({
          id: 'zodiac_bonus',
          type: 'zodiac_advice',
          content: `您的生肖${player.zodiac}与此事件高度匹配，建议积极参与`,
          priority: 8
        });
      } else if (compatibility < 0.4) {
        hints.push({
          id: 'zodiac_warning',
          type: 'warning',
          content: `您的生肖${player.zodiac}与此事件不太匹配，建议谨慎行动`,
          priority: 6
        });
      }
    }

    // 资源状况提示
    if (player.money < 1000) {
      hints.push({
        id: 'low_money',
        type: 'warning',
        content: '资金较低，建议保守选择',
        priority: 7
      });
    }

    // 技能使用建议
    const availableSkills = player.skills.filter(skill => {
      const check = this.checkSkillAvailability(skill.id, player);
      return check.available;
    });

    if (availableSkills.length > 0) {
      hints.push({
        id: 'skill_available',
        type: 'suggestion',
        content: `有${availableSkills.length}个技能可用，考虑是否使用`,
        priority: 5
      });
    }

    return hints.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 生成后续行动建议
   */
  private generateNextActionSuggestions(
    input: PlayerResponseInput,
    context: ResponseInputContext
  ): NextActionSuggestion[] {
    const suggestions: NextActionSuggestion[] = [];

    // 基于输入类型生成建议
    switch (input.inputType) {
      case 'choice_selection':
        suggestions.push({
          actionType: 'wait_for_results',
          description: '等待事件结果处理',
          timeFrame: 'immediate',
          priority: 10
        });
        break;

      case 'skill_activation':
        suggestions.push({
          actionType: 'monitor_cooldown',
          description: '监控技能冷却时间',
          timeFrame: 'future',
          priority: 3
        });
        break;

      case 'trade_proposal':
        suggestions.push({
          actionType: 'await_response',
          description: '等待其他玩家响应交易提案',
          timeFrame: 'future',
          priority: 5
        });
        break;
    }

    return suggestions;
  }

  /**
   * 记录响应历史
   */
  private recordResponse(input: PlayerResponseInput): void {
    const playerHistory = this.responseHistory.get(input.playerId) || [];
    playerHistory.push(input);
    
    // 限制历史记录大小
    if (playerHistory.length > 100) {
      playerHistory.splice(0, playerHistory.length - 100);
    }
    
    this.responseHistory.set(input.playerId, playerHistory);
  }

  /**
   * 获取玩家响应历史
   */
  private getPlayerResponseHistory(playerId: string): PlayerResponseInput[] {
    return this.responseHistory.get(playerId) || [];
  }

  /**
   * 处理响应超时
   */
  private handleResponseTimeout(sessionId: string): void {
    const context = this.activeInputSessions.get(sessionId);
    if (!context) return;

    // 生成默认响应
    const defaultInput: PlayerResponseInput = {
      playerId: context.player.id,
      eventId: context.event.id,
      choiceId: context.availableChoices[0]?.id, // 选择第一个选项
      timestamp: Date.now(),
      sessionId,
      inputType: 'choice_selection',
      metadata: {
        responseTime: context.timeRemaining || 0,
        inputMethod: 'auto_pilot'
      }
    };

    this.emit('responseTimeout', { sessionId, context, defaultInput });
    this.processPlayerResponse(sessionId, defaultInput);
  }

  /**
   * 清理会话
   */
  private cleanupSession(sessionId: string): void {
    this.activeInputSessions.delete(sessionId);
    
    const timeout = this.inputTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.inputTimeouts.delete(sessionId);
    }
  }

  /**
   * 添加验证规则
   */
  addValidationRule(rule: ResponseValidationRule): void {
    this.validationRules.set(rule.id, rule);
  }

  /**
   * 移除验证规则
   */
  removeValidationRule(ruleId: string): void {
    this.validationRules.delete(ruleId);
  }

  /**
   * 初始化默认验证规则
   */
  private initializeDefaultValidationRules(): void {
    // 必选选择规则
    this.addValidationRule({
      id: 'required_choice',
      name: '必选选择',
      description: '必须选择一个选项',
      ruleType: 'required_choice',
      parameters: {},
      errorMessage: '请选择一个选项',
      severity: 'error'
    });

    // 资源需求规则
    this.addValidationRule({
      id: 'sufficient_resources',
      name: '资源充足性',
      description: '检查玩家是否有足够的资源',
      ruleType: 'resource_requirement',
      parameters: {},
      errorMessage: '资源不足',
      severity: 'error'
    });

    // 时间限制规则
    this.addValidationRule({
      id: 'time_limit',
      name: '时间限制',
      description: '检查响应是否在时间限制内',
      ruleType: 'time_limit',
      parameters: {},
      errorMessage: '响应超时',
      severity: 'error'
    });

    // 技能可用性规则
    this.addValidationRule({
      id: 'skill_availability',
      name: '技能可用性',
      description: '检查技能是否可用',
      ruleType: 'skill_availability',
      parameters: {},
      errorMessage: '技能不可用',
      severity: 'error'
    });
  }

  /**
   * 获取活跃会话信息
   */
  getActiveSessionInfo(): Array<{ sessionId: string; playerId: string; eventId: string; timeRemaining?: number }> {
    const sessions: Array<{ sessionId: string; playerId: string; eventId: string; timeRemaining?: number }> = [];
    
    for (const [sessionId, context] of this.activeInputSessions) {
      sessions.push({
        sessionId,
        playerId: context.player.id,
        eventId: context.event.id,
        timeRemaining: context.timeRemaining
      });
    }
    
    return sessions;
  }

  /**
   * 强制结束会话
   */
  forceEndSession(sessionId: string): boolean {
    const context = this.activeInputSessions.get(sessionId);
    if (!context) return false;

    this.cleanupSession(sessionId);
    this.emit('sessionForceEnded', { sessionId, context });
    return true;
  }

  /**
   * 获取统计信息
   */
  getStatistics(): any {
    const totalResponses = Array.from(this.responseHistory.values())
      .reduce((sum, history) => sum + history.length, 0);
    
    const averageResponseTime = Array.from(this.responseHistory.values())
      .flat()
      .reduce((sum, response, index, array) => {
        return sum + response.metadata.responseTime / array.length;
      }, 0);

    return {
      activeSessions: this.activeInputSessions.size,
      totalResponses,
      averageResponseTime,
      validationRules: this.validationRules.size,
      responseHistory: Object.fromEntries(
        Array.from(this.responseHistory.entries()).map(([playerId, history]) => [
          playerId,
          history.length
        ])
      )
    };
  }
}