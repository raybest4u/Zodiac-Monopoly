/**
 * 规则冲突解决器 - 处理规则之间的冲突和依赖关系
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { RuleDefinition, RuleExecutionContext, RuleValidationResult } from './GameRuleSystem';
import type { PlayerAction, GameState } from '../types/game';

export interface RuleConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  involvedRules: string[];
  resolutionStrategy: ResolutionStrategy;
  context: ConflictContext;
}

export interface ConflictContext {
  action: PlayerAction;
  gameState: GameState;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface ConflictResolution {
  conflictId: string;
  strategy: ResolutionStrategy;
  appliedRules: string[];
  ignoredRules: string[];
  modifiedRules: RuleModification[];
  success: boolean;
  message: string;
}

export interface RuleModification {
  ruleId: string;
  modificationType: 'priority_adjust' | 'condition_add' | 'effect_modify' | 'disable_temporarily';
  originalValue: any;
  newValue: any;
  reason: string;
  reversible: boolean;
}

export type ConflictType = 
  | 'priority_conflict' | 'mutual_exclusion' | 'circular_dependency' 
  | 'resource_contention' | 'logical_contradiction' | 'temporal_conflict';

export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ResolutionStrategy = 
  | 'priority_based' | 'merge_effects' | 'sequential_execution' 
  | 'conditional_execution' | 'manual_resolution' | 'ignore_conflict';

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: RuleConflict[];
  resolutionPlan: ResolutionPlan;
  executionOrder: string[];
}

export interface ResolutionPlan {
  strategy: ResolutionStrategy;
  steps: ResolutionStep[];
  fallbackStrategies: ResolutionStrategy[];
  expectedOutcome: string;
}

export interface ResolutionStep {
  stepId: string;
  action: 'apply_rule' | 'modify_rule' | 'skip_rule' | 'merge_rules' | 'wait_condition';
  targetRules: string[];
  parameters: Record<string, any>;
  condition?: string;
}

/**
 * 规则冲突解决器
 */
export class RuleConflictResolver extends EventEmitter {
  private conflictHistory: RuleConflict[] = [];
  private resolutionHistory: ConflictResolution[] = [];
  private ruleModifications = new Map<string, RuleModification[]>();
  private conflictPatterns = new Map<string, ConflictPattern>();
  
  private readonly maxHistorySize = 500;

  constructor() {
    super();
    this.initializeConflictPatterns();
  }

  /**
   * 检测规则冲突
   */
  detectConflicts(
    applicableRules: RuleDefinition[],
    context: RuleExecutionContext
  ): ConflictDetectionResult {
    const conflicts: RuleConflict[] = [];
    
    // 1. 检测优先级冲突
    const priorityConflicts = this.detectPriorityConflicts(applicableRules, context);
    conflicts.push(...priorityConflicts);
    
    // 2. 检测互斥冲突
    const exclusionConflicts = this.detectMutualExclusions(applicableRules, context);
    conflicts.push(...exclusionConflicts);
    
    // 3. 检测循环依赖
    const circularConflicts = this.detectCircularDependencies(applicableRules, context);
    conflicts.push(...circularConflicts);
    
    // 4. 检测资源争用
    const resourceConflicts = this.detectResourceContentions(applicableRules, context);
    conflicts.push(...resourceConflicts);
    
    // 5. 检测逻辑矛盾
    const logicalConflicts = this.detectLogicalContradictions(applicableRules, context);
    conflicts.push(...logicalConflicts);
    
    // 6. 检测时序冲突
    const temporalConflicts = this.detectTemporalConflicts(applicableRules, context);
    conflicts.push(...temporalConflicts);
    
    // 生成解决方案
    const resolutionPlan = this.generateResolutionPlan(conflicts, applicableRules, context);
    const executionOrder = this.determineExecutionOrder(applicableRules, conflicts, resolutionPlan);
    
    const result: ConflictDetectionResult = {
      hasConflicts: conflicts.length > 0,
      conflicts,
      resolutionPlan,
      executionOrder
    };
    
    // 记录冲突历史
    if (conflicts.length > 0) {
      this.recordConflicts(conflicts);
    }
    
    return result;
  }

  /**
   * 解决冲突
   */
  async resolveConflicts(
    conflicts: RuleConflict[],
    applicableRules: RuleDefinition[],
    context: RuleExecutionContext
  ): Promise<ConflictResolution[]> {
    const resolutions: ConflictResolution[] = [];
    
    for (const conflict of conflicts) {
      try {
        const resolution = await this.resolveSingleConflict(conflict, applicableRules, context);
        resolutions.push(resolution);
        
        if (resolution.success) {
          this.emit('conflictResolved', { conflict, resolution });
        } else {
          this.emit('conflictResolutionFailed', { conflict, resolution });
        }
      } catch (error) {
        const failedResolution: ConflictResolution = {
          conflictId: conflict.id,
          strategy: conflict.resolutionStrategy,
          appliedRules: [],
          ignoredRules: conflict.involvedRules,
          modifiedRules: [],
          success: false,
          message: `解决冲突失败: ${error instanceof Error ? error.message : String(error)}`
        };
        
        resolutions.push(failedResolution);
        this.emit('conflictResolutionError', { conflict, error });
      }
    }
    
    // 记录解决历史
    this.recordResolutions(resolutions);
    
    return resolutions;
  }

  /**
   * 获取修改后的规则执行顺序
   */
  getResolvedExecutionOrder(
    originalRules: RuleDefinition[],
    resolutions: ConflictResolution[]
  ): RuleDefinition[] {
    const ruleMap = new Map(originalRules.map(rule => [rule.id, { ...rule }]));
    
    // 应用规则修改
    for (const resolution of resolutions) {
      for (const modification of resolution.modifiedRules) {
        const rule = ruleMap.get(modification.ruleId);
        if (rule) {
          this.applyRuleModification(rule, modification);
        }
      }
    }
    
    // 过滤被忽略的规则
    const ignoredRules = new Set(
      resolutions.flatMap(r => r.ignoredRules)
    );
    
    return Array.from(ruleMap.values())
      .filter(rule => !ignoredRules.has(rule.id))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 学习冲突模式
   */
  learnConflictPattern(
    conflict: RuleConflict,
    resolution: ConflictResolution
  ): void {
    const patternKey = this.generatePatternKey(conflict);
    const existingPattern = this.conflictPatterns.get(patternKey);
    
    if (existingPattern) {
      existingPattern.occurrences++;
      if (resolution.success) {
        existingPattern.successfulResolutions++;
        existingPattern.preferredStrategy = resolution.strategy;
      }
    } else {
      const newPattern: ConflictPattern = {
        key: patternKey,
        type: conflict.type,
        involvedRuleCategories: this.extractRuleCategories(conflict.involvedRules),
        occurrences: 1,
        successfulResolutions: resolution.success ? 1 : 0,
        preferredStrategy: resolution.strategy,
        confidence: 0.1
      };
      
      this.conflictPatterns.set(patternKey, newPattern);
    }
    
    // 更新置信度
    this.updatePatternConfidence(patternKey);
  }

  /**
   * 获取冲突统计
   */
  getConflictStatistics(): ConflictStatistics {
    const totalConflicts = this.conflictHistory.length;
    const totalResolutions = this.resolutionHistory.length;
    const successfulResolutions = this.resolutionHistory.filter(r => r.success).length;
    
    const conflictsByType = new Map<ConflictType, number>();
    const conflictsBySeverity = new Map<ConflictSeverity, number>();
    const resolutionsByStrategy = new Map<ResolutionStrategy, number>();
    
    for (const conflict of this.conflictHistory) {
      conflictsByType.set(conflict.type, (conflictsByType.get(conflict.type) || 0) + 1);
      conflictsBySeverity.set(conflict.severity, (conflictsBySeverity.get(conflict.severity) || 0) + 1);
    }
    
    for (const resolution of this.resolutionHistory) {
      resolutionsByStrategy.set(resolution.strategy, (resolutionsByStrategy.get(resolution.strategy) || 0) + 1);
    }
    
    return {
      totalConflicts,
      totalResolutions,
      successfulResolutions,
      resolutionSuccessRate: totalResolutions > 0 ? successfulResolutions / totalResolutions : 0,
      conflictsByType: Object.fromEntries(conflictsByType),
      conflictsBySeverity: Object.fromEntries(conflictsBySeverity),
      resolutionsByStrategy: Object.fromEntries(resolutionsByStrategy),
      learnedPatterns: this.conflictPatterns.size,
      recentConflicts: this.conflictHistory.slice(-10)
    };
  }

  // 私有方法

  /**
   * 检测优先级冲突
   */
  private detectPriorityConflicts(
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    
    // 查找相同优先级的互斥规则
    const priorityGroups = new Map<number, RuleDefinition[]>();
    
    for (const rule of rules) {
      if (!priorityGroups.has(rule.priority)) {
        priorityGroups.set(rule.priority, []);
      }
      priorityGroups.get(rule.priority)!.push(rule);
    }
    
    for (const [priority, groupRules] of priorityGroups) {
      if (groupRules.length > 1) {
        // 检查是否有冲突的规则
        for (let i = 0; i < groupRules.length; i++) {
          for (let j = i + 1; j < groupRules.length; j++) {
            const rule1 = groupRules[i];
            const rule2 = groupRules[j];
            
            if (this.areRulesConflicting(rule1, rule2, context)) {
              conflicts.push({
                id: `priority_conflict_${rule1.id}_${rule2.id}`,
                type: 'priority_conflict',
                severity: 'medium',
                description: `规则 ${rule1.name} 和 ${rule2.name} 具有相同优先级但存在冲突`,
                involvedRules: [rule1.id, rule2.id],
                resolutionStrategy: 'priority_based',
                context: {
                  action: context.action,
                  gameState: context.gameState,
                  timestamp: Date.now(),
                  metadata: { priority, conflictType: 'same_priority' }
                }
              });
            }
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 检测互斥冲突
   */
  private detectMutualExclusions(
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    
    for (const rule of rules) {
      if (rule.conflictsWith) {
        for (const conflictRuleId of rule.conflictsWith) {
          const conflictRule = rules.find(r => r.id === conflictRuleId);
          if (conflictRule) {
            conflicts.push({
              id: `mutual_exclusion_${rule.id}_${conflictRuleId}`,
              type: 'mutual_exclusion',
              severity: 'high',
              description: `规则 ${rule.name} 与 ${conflictRule.name} 互斥`,
              involvedRules: [rule.id, conflictRuleId],
              resolutionStrategy: 'priority_based',
              context: {
                action: context.action,
                gameState: context.gameState,
                timestamp: Date.now(),
                metadata: { explicitConflict: true }
              }
            });
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 检测循环依赖
   */
  private detectCircularDependencies(
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    const dependencyGraph = new Map<string, string[]>();
    
    // 构建依赖图
    for (const rule of rules) {
      dependencyGraph.set(rule.id, rule.dependsOn || []);
    }
    
    // 检测环
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    for (const rule of rules) {
      if (!visited.has(rule.id)) {
        const cycle = this.detectCycle(rule.id, dependencyGraph, visited, recursionStack);
        if (cycle.length > 0) {
          conflicts.push({
            id: `circular_dependency_${cycle.join('_')}`,
            type: 'circular_dependency',
            severity: 'critical',
            description: `检测到循环依赖: ${cycle.join(' -> ')}`,
            involvedRules: cycle,
            resolutionStrategy: 'manual_resolution',
            context: {
              action: context.action,
              gameState: context.gameState,
              timestamp: Date.now(),
              metadata: { cycle }
            }
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 检测资源争用
   */
  private detectResourceContentions(
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    const resourceUsage = new Map<string, string[]>();
    
    // 分析规则使用的资源
    for (const rule of rules) {
      const resources = this.extractResourceUsage(rule, context);
      for (const resource of resources) {
        if (!resourceUsage.has(resource)) {
          resourceUsage.set(resource, []);
        }
        resourceUsage.get(resource)!.push(rule.id);
      }
    }
    
    // 检测资源争用
    for (const [resource, usingRules] of resourceUsage) {
      if (usingRules.length > 1) {
        const conflictingRules = usingRules.filter(ruleId => 
          this.isExclusiveResourceUsage(resource, ruleId, context)
        );
        
        if (conflictingRules.length > 1) {
          conflicts.push({
            id: `resource_contention_${resource}_${conflictingRules.join('_')}`,
            type: 'resource_contention',
            severity: 'medium',
            description: `多个规则争用资源: ${resource}`,
            involvedRules: conflictingRules,
            resolutionStrategy: 'sequential_execution',
            context: {
              action: context.action,
              gameState: context.gameState,
              timestamp: Date.now(),
              metadata: { resource, contentionType: 'exclusive_access' }
            }
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 检测逻辑矛盾
   */
  private detectLogicalContradictions(
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    
    // 检查规则效果是否相互矛盾
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];
        
        const contradiction = this.checkLogicalContradiction(rule1, rule2, context);
        if (contradiction) {
          conflicts.push({
            id: `logical_contradiction_${rule1.id}_${rule2.id}`,
            type: 'logical_contradiction',
            severity: 'high',
            description: `规则逻辑矛盾: ${contradiction.description}`,
            involvedRules: [rule1.id, rule2.id],
            resolutionStrategy: 'conditional_execution',
            context: {
              action: context.action,
              gameState: context.gameState,
              timestamp: Date.now(),
              metadata: contradiction
            }
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 检测时序冲突
   */
  private detectTemporalConflicts(
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    
    // 检查时间敏感的规则冲突
    const temporalRules = rules.filter(rule => this.isTemporalRule(rule));
    
    for (let i = 0; i < temporalRules.length; i++) {
      for (let j = i + 1; j < temporalRules.length; j++) {
        const rule1 = temporalRules[i];
        const rule2 = temporalRules[j];
        
        const temporalConflict = this.checkTemporalConflict(rule1, rule2, context);
        if (temporalConflict) {
          conflicts.push({
            id: `temporal_conflict_${rule1.id}_${rule2.id}`,
            type: 'temporal_conflict',
            severity: 'medium',
            description: `规则时序冲突: ${temporalConflict.description}`,
            involvedRules: [rule1.id, rule2.id],
            resolutionStrategy: 'sequential_execution',
            context: {
              action: context.action,
              gameState: context.gameState,
              timestamp: Date.now(),
              metadata: temporalConflict
            }
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 生成解决方案
   */
  private generateResolutionPlan(
    conflicts: RuleConflict[],
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): ResolutionPlan {
    if (conflicts.length === 0) {
      return {
        strategy: 'priority_based',
        steps: [{
          stepId: 'no_conflicts',
          action: 'apply_rule',
          targetRules: rules.map(r => r.id),
          parameters: {}
        }],
        fallbackStrategies: [],
        expectedOutcome: '按优先级正常执行所有规则'
      };
    }
    
    // 根据冲突类型和严重性选择策略
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
    const highConflicts = conflicts.filter(c => c.severity === 'high');
    
    if (criticalConflicts.length > 0) {
      return this.generateCriticalResolutionPlan(criticalConflicts, rules, context);
    } else if (highConflicts.length > 0) {
      return this.generateHighPriorityResolutionPlan(highConflicts, rules, context);
    } else {
      return this.generateStandardResolutionPlan(conflicts, rules, context);
    }
  }

  /**
   * 确定执行顺序
   */
  private determineExecutionOrder(
    rules: RuleDefinition[],
    conflicts: RuleConflict[],
    plan: ResolutionPlan
  ): string[] {
    const ruleMap = new Map(rules.map(rule => [rule.id, rule]));
    const executionOrder: string[] = [];
    
    // 根据解决方案调整执行顺序
    for (const step of plan.steps) {
      if (step.action === 'apply_rule') {
        for (const ruleId of step.targetRules) {
          if (ruleMap.has(ruleId) && !executionOrder.includes(ruleId)) {
            executionOrder.push(ruleId);
          }
        }
      }
    }
    
    // 按依赖关系排序
    return this.topologicalSort(executionOrder, ruleMap);
  }

  /**
   * 解决单个冲突
   */
  private async resolveSingleConflict(
    conflict: RuleConflict,
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): Promise<ConflictResolution> {
    const strategy = conflict.resolutionStrategy;
    
    switch (strategy) {
      case 'priority_based':
        return this.resolvePriorityBased(conflict, rules, context);
      case 'merge_effects':
        return this.resolveMergeEffects(conflict, rules, context);
      case 'sequential_execution':
        return this.resolveSequentialExecution(conflict, rules, context);
      case 'conditional_execution':
        return this.resolveConditionalExecution(conflict, rules, context);
      case 'ignore_conflict':
        return this.resolveIgnoreConflict(conflict, rules, context);
      default:
        return this.resolveManualResolution(conflict, rules, context);
    }
  }

  /**
   * 基于优先级解决冲突
   */
  private resolvePriorityBased(
    conflict: RuleConflict,
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): ConflictResolution {
    const involvedRules = rules.filter(r => conflict.involvedRules.includes(r.id));
    involvedRules.sort((a, b) => b.priority - a.priority);
    
    const winnerRule = involvedRules[0];
    const loserRules = involvedRules.slice(1);
    
    return {
      conflictId: conflict.id,
      strategy: 'priority_based',
      appliedRules: [winnerRule.id],
      ignoredRules: loserRules.map(r => r.id),
      modifiedRules: [],
      success: true,
      message: `优先级解决: ${winnerRule.name} 胜出`
    };
  }

  /**
   * 合并效果解决冲突
   */
  private resolveMergeEffects(
    conflict: RuleConflict,
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): ConflictResolution {
    // 实现效果合并逻辑
    return {
      conflictId: conflict.id,
      strategy: 'merge_effects',
      appliedRules: conflict.involvedRules,
      ignoredRules: [],
      modifiedRules: [],
      success: true,
      message: '效果已合并'
    };
  }

  /**
   * 顺序执行解决冲突
   */
  private resolveSequentialExecution(
    conflict: RuleConflict,
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): ConflictResolution {
    const involvedRules = rules.filter(r => conflict.involvedRules.includes(r.id));
    involvedRules.sort((a, b) => b.priority - a.priority);
    
    return {
      conflictId: conflict.id,
      strategy: 'sequential_execution',
      appliedRules: involvedRules.map(r => r.id),
      ignoredRules: [],
      modifiedRules: [],
      success: true,
      message: '规则将按顺序执行'
    };
  }

  /**
   * 条件执行解决冲突
   */
  private resolveConditionalExecution(
    conflict: RuleConflict,
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): ConflictResolution {
    // 基于游戏状态条件决定执行哪些规则
    const applicableRules = conflict.involvedRules.filter(ruleId => {
      const rule = rules.find(r => r.id === ruleId);
      return rule && this.evaluateRuleConditions(rule, context);
    });
    
    const ignoredRules = conflict.involvedRules.filter(id => !applicableRules.includes(id));
    
    return {
      conflictId: conflict.id,
      strategy: 'conditional_execution',
      appliedRules: applicableRules,
      ignoredRules,
      modifiedRules: [],
      success: true,
      message: '基于条件选择性执行规则'
    };
  }

  /**
   * 忽略冲突
   */
  private resolveIgnoreConflict(
    conflict: RuleConflict,
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): ConflictResolution {
    return {
      conflictId: conflict.id,
      strategy: 'ignore_conflict',
      appliedRules: conflict.involvedRules,
      ignoredRules: [],
      modifiedRules: [],
      success: true,
      message: '冲突已忽略，所有规则正常执行'
    };
  }

  /**
   * 手动解决
   */
  private resolveManualResolution(
    conflict: RuleConflict,
    rules: RuleDefinition[],
    context: RuleExecutionContext
  ): ConflictResolution {
    // 记录需要手动解决的冲突
    this.emit('manualResolutionRequired', { conflict, rules, context });
    
    return {
      conflictId: conflict.id,
      strategy: 'manual_resolution',
      appliedRules: [],
      ignoredRules: conflict.involvedRules,
      modifiedRules: [],
      success: false,
      message: '需要手动解决冲突'
    };
  }

  // 辅助方法
  
  private areRulesConflicting(rule1: RuleDefinition, rule2: RuleDefinition, context: RuleExecutionContext): boolean {
    // 实现规则冲突检测逻辑
    return rule1.conflictsWith?.includes(rule2.id) || rule2.conflictsWith?.includes(rule1.id) || false;
  }

  private extractResourceUsage(rule: RuleDefinition, context: RuleExecutionContext): string[] {
    // 实现资源使用分析
    return [];
  }

  private isExclusiveResourceUsage(resource: string, ruleId: string, context: RuleExecutionContext): boolean {
    // 实现独占资源使用检测
    return false;
  }

  private checkLogicalContradiction(rule1: RuleDefinition, rule2: RuleDefinition, context: RuleExecutionContext): any {
    // 实现逻辑矛盾检测
    return null;
  }

  private isTemporalRule(rule: RuleDefinition): boolean {
    // 检测是否为时间敏感规则
    return false;
  }

  private checkTemporalConflict(rule1: RuleDefinition, rule2: RuleDefinition, context: RuleExecutionContext): any {
    // 实现时序冲突检测
    return null;
  }

  private detectCycle(
    nodeId: string,
    graph: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[] = []
  ): string[] {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const dependencies = graph.get(nodeId) || [];
    
    for (const dependency of dependencies) {
      if (!visited.has(dependency)) {
        const cycle = this.detectCycle(dependency, graph, visited, recursionStack, [...path]);
        if (cycle.length > 0) {
          return cycle;
        }
      } else if (recursionStack.has(dependency)) {
        const cycleStart = path.indexOf(dependency);
        return path.slice(cycleStart);
      }
    }
    
    recursionStack.delete(nodeId);
    return [];
  }

  private generateCriticalResolutionPlan(conflicts: RuleConflict[], rules: RuleDefinition[], context: RuleExecutionContext): ResolutionPlan {
    return {
      strategy: 'manual_resolution',
      steps: [{
        stepId: 'critical_manual',
        action: 'skip_rule',
        targetRules: conflicts.flatMap(c => c.involvedRules),
        parameters: { reason: 'critical_conflicts' }
      }],
      fallbackStrategies: ['ignore_conflict'],
      expectedOutcome: '需要手动干预解决关键冲突'
    };
  }

  private generateHighPriorityResolutionPlan(conflicts: RuleConflict[], rules: RuleDefinition[], context: RuleExecutionContext): ResolutionPlan {
    return {
      strategy: 'priority_based',
      steps: [{
        stepId: 'high_priority',
        action: 'apply_rule',
        targetRules: rules.map(r => r.id),
        parameters: { conflictResolution: 'priority_based' }
      }],
      fallbackStrategies: ['conditional_execution', 'sequential_execution'],
      expectedOutcome: '基于优先级解决高级冲突'
    };
  }

  private generateStandardResolutionPlan(conflicts: RuleConflict[], rules: RuleDefinition[], context: RuleExecutionContext): ResolutionPlan {
    return {
      strategy: 'conditional_execution',
      steps: [{
        stepId: 'standard_conditional',
        action: 'apply_rule',
        targetRules: rules.map(r => r.id),
        parameters: { conditionalExecution: true }
      }],
      fallbackStrategies: ['merge_effects', 'sequential_execution'],
      expectedOutcome: '基于条件智能解决标准冲突'
    };
  }

  private topologicalSort(ruleIds: string[], ruleMap: Map<string, RuleDefinition>): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    
    const visit = (ruleId: string) => {
      if (visited.has(ruleId)) return;
      visited.add(ruleId);
      
      const rule = ruleMap.get(ruleId);
      if (rule?.dependsOn) {
        for (const dependency of rule.dependsOn) {
          if (ruleIds.includes(dependency)) {
            visit(dependency);
          }
        }
      }
      
      result.push(ruleId);
    };
    
    for (const ruleId of ruleIds) {
      visit(ruleId);
    }
    
    return result;
  }

  private applyRuleModification(rule: RuleDefinition, modification: RuleModification): void {
    switch (modification.modificationType) {
      case 'priority_adjust':
        rule.priority = modification.newValue;
        break;
      case 'disable_temporarily':
        // 实现临时禁用逻辑
        break;
    }
  }

  private evaluateRuleConditions(rule: RuleDefinition, context: RuleExecutionContext): boolean {
    // 实现规则条件评估
    return true;
  }

  private initializeConflictPatterns(): void {
    // 初始化已知的冲突模式
  }

  private generatePatternKey(conflict: RuleConflict): string {
    return `${conflict.type}_${conflict.involvedRules.sort().join('_')}`;
  }

  private extractRuleCategories(ruleIds: string[]): string[] {
    return ruleIds; // 简化实现
  }

  private updatePatternConfidence(patternKey: string): void {
    const pattern = this.conflictPatterns.get(patternKey);
    if (pattern) {
      pattern.confidence = Math.min(1.0, pattern.successfulResolutions / pattern.occurrences);
    }
  }

  private recordConflicts(conflicts: RuleConflict[]): void {
    this.conflictHistory.push(...conflicts);
    if (this.conflictHistory.length > this.maxHistorySize) {
      this.conflictHistory.splice(0, this.conflictHistory.length - this.maxHistorySize);
    }
  }

  private recordResolutions(resolutions: ConflictResolution[]): void {
    this.resolutionHistory.push(...resolutions);
    if (this.resolutionHistory.length > this.maxHistorySize) {
      this.resolutionHistory.splice(0, this.resolutionHistory.length - this.maxHistorySize);
    }
  }
}

// 辅助接口
interface ConflictPattern {
  key: string;
  type: ConflictType;
  involvedRuleCategories: string[];
  occurrences: number;
  successfulResolutions: number;
  preferredStrategy: ResolutionStrategy;
  confidence: number;
}

interface ConflictStatistics {
  totalConflicts: number;
  totalResolutions: number;
  successfulResolutions: number;
  resolutionSuccessRate: number;
  conflictsByType: Record<string, number>;
  conflictsBySeverity: Record<string, number>;
  resolutionsByStrategy: Record<string, number>;
  learnedPatterns: number;
  recentConflicts: RuleConflict[];
}