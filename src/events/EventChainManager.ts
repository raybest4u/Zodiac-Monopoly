/**
 * 事件链管理系统
 * Event Chain Management System
 * 
 * 管理事件序列、级联反应和复杂的事件依赖关系
 * Manages event sequences, cascading reactions, and complex event dependencies
 */

import { GameEvent, EventType, EventPriority, ZodiacSign, GameState, Player } from '../types/GameTypes';
import { GameStateAnalyzer } from './GameStateAnalyzer';
import { DynamicEventEngine } from './DynamicEventEngine';

export interface EventChainNode {
  id: string;
  eventId: string;
  parentIds: string[];
  childIds: string[];
  triggerConditions: EventChainCondition[];
  delayMs?: number;
  probability: number;
  weight: number;
  metadata: Record<string, any>;
}

export interface EventChainCondition {
  type: 'time_delay' | 'player_action' | 'game_state' | 'random' | 'custom';
  value: any;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'custom';
  target?: string;
}

export interface EventChain {
  id: string;
  name: string;
  description: string;
  rootNodeIds: string[];
  nodes: Map<string, EventChainNode>;
  priority: EventPriority;
  isActive: boolean;
  cooldownMs: number;
  lastTriggered?: Date;
  metadata: {
    category: string;
    complexity: number;
    expectedDuration: number;
    playerCount: number;
    zodiacThemes: ZodiacSign[];
  };
}

export interface CascadingReaction {
  id: string;
  triggerId: string;
  chainId: string;
  amplitude: number; // 反应强度 0-1
  propagationRate: number; // 传播速率
  decayRate: number; // 衰减率
  affectedPlayers: string[];
  emergentEffects: EmergentEffect[];
}

export interface EmergentEffect {
  type: 'economic_bubble' | 'social_movement' | 'cultural_shift' | 'power_vacuum' | 'alliance_formation';
  intensity: number;
  duration: number;
  description: string;
  gameStateModifiers: Record<string, any>;
}

export interface ChainExecutionContext {
  chainId: string;
  currentNodeId: string;
  startTime: Date;
  activeNodes: Set<string>;
  completedNodes: Set<string>;
  pendingNodes: Map<string, { conditions: EventChainCondition[], scheduledTime?: Date }>;
  variables: Map<string, any>;
  emergentProperties: Map<string, any>;
}

export class EventChainManager {
  private chains: Map<string, EventChain> = new Map();
  private activeChainContexts: Map<string, ChainExecutionContext> = new Map();
  private cascadingReactions: Map<string, CascadingReaction> = new Map();
  private gameStateAnalyzer: GameStateAnalyzer;
  private eventEngine?: DynamicEventEngine;

  constructor(gameStateAnalyzer: GameStateAnalyzer) {
    this.gameStateAnalyzer = gameStateAnalyzer;
    this.initializePrebuiltChains();
  }

  setEventEngine(engine: DynamicEventEngine): void {
    this.eventEngine = engine;
  }

  /**
   * 创建事件链
   */
  createEventChain(
    name: string,
    description: string,
    rootEvents: GameEvent[],
    options: {
      priority?: EventPriority;
      cooldownMs?: number;
      category?: string;
      zodiacThemes?: ZodiacSign[];
    } = {}
  ): EventChain {
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chain: EventChain = {
      id: chainId,
      name,
      description,
      rootNodeIds: [],
      nodes: new Map(),
      priority: options.priority || 'normal',
      isActive: false,
      cooldownMs: options.cooldownMs || 300000, // 5分钟默认冷却
      metadata: {
        category: options.category || 'general',
        complexity: rootEvents.length,
        expectedDuration: rootEvents.length * 30000, // 预估30秒每事件
        playerCount: 0,
        zodiacThemes: options.zodiacThemes || []
      }
    };

    // 创建根节点
    for (const event of rootEvents) {
      const nodeId = this.createChainNode(chainId, event, [], []);
      chain.rootNodeIds.push(nodeId);
    }

    this.chains.set(chainId, chain);
    return chain;
  }

  /**
   * 创建事件链节点
   */
  createChainNode(
    chainId: string,
    event: GameEvent,
    parentIds: string[] = [],
    childIds: string[] = [],
    options: {
      triggerConditions?: EventChainCondition[];
      delayMs?: number;
      probability?: number;
      weight?: number;
    } = {}
  ): string {
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const node: EventChainNode = {
      id: nodeId,
      eventId: event.id,
      parentIds: [...parentIds],
      childIds: [...childIds],
      triggerConditions: options.triggerConditions || [],
      delayMs: options.delayMs,
      probability: options.probability || 1.0,
      weight: options.weight || 1.0,
      metadata: {
        eventType: event.type,
        eventCategory: event.category,
        createdAt: new Date()
      }
    };

    const chain = this.chains.get(chainId);
    if (chain) {
      chain.nodes.set(nodeId, node);
      
      // 更新父节点的子节点引用
      for (const parentId of parentIds) {
        const parentNode = chain.nodes.get(parentId);
        if (parentNode && !parentNode.childIds.includes(nodeId)) {
          parentNode.childIds.push(nodeId);
        }
      }
    }

    return nodeId;
  }

  /**
   * 启动事件链
   */
  async startEventChain(chainId: string, gameState: GameState): Promise<boolean> {
    const chain = this.chains.get(chainId);
    if (!chain || chain.isActive) {
      return false;
    }

    // 检查冷却时间
    if (chain.lastTriggered && 
        Date.now() - chain.lastTriggered.getTime() < chain.cooldownMs) {
      return false;
    }

    // 创建执行上下文
    const context: ChainExecutionContext = {
      chainId,
      currentNodeId: '',
      startTime: new Date(),
      activeNodes: new Set(),
      completedNodes: new Set(),
      pendingNodes: new Map(),
      variables: new Map(),
      emergentProperties: new Map()
    };

    this.activeChainContexts.set(chainId, context);
    chain.isActive = true;
    chain.lastTriggered = new Date();

    // 激活根节点
    for (const rootNodeId of chain.rootNodeIds) {
      await this.activateChainNode(chainId, rootNodeId, gameState);
    }

    return true;
  }

  /**
   * 激活事件链节点
   */
  private async activateChainNode(
    chainId: string, 
    nodeId: string, 
    gameState: GameState
  ): Promise<void> {
    const chain = this.chains.get(chainId);
    const context = this.activeChainContexts.get(chainId);
    const node = chain?.nodes.get(nodeId);

    if (!chain || !context || !node) {
      return;
    }

    // 检查节点是否已经激活或完成
    if (context.activeNodes.has(nodeId) || context.completedNodes.has(nodeId)) {
      return;
    }

    // 检查触发条件
    const canTrigger = await this.evaluateChainConditions(
      node.triggerConditions, 
      gameState, 
      context
    );

    if (!canTrigger) {
      // 将节点标记为待处理
      context.pendingNodes.set(nodeId, {
        conditions: node.triggerConditions,
        scheduledTime: node.delayMs ? new Date(Date.now() + node.delayMs) : undefined
      });
      return;
    }

    // 概率检查
    if (Math.random() > node.probability) {
      context.completedNodes.add(nodeId);
      return;
    }

    // 激活节点
    context.activeNodes.add(nodeId);
    context.currentNodeId = nodeId;

    try {
      // 执行事件（通过事件引擎）
      if (this.eventEngine) {
        const event = await this.eventEngine.getEventById(node.eventId);
        if (event) {
          await this.executeChainEvent(event, gameState, context);
        }
      }

      // 标记节点完成
      context.activeNodes.delete(nodeId);
      context.completedNodes.add(nodeId);

      // 检查级联反应
      await this.processCascadingReactions(chainId, nodeId, gameState);

      // 激活子节点
      for (const childId of node.childIds) {
        await this.activateChainNode(chainId, childId, gameState);
      }

      // 检查链是否完成
      this.checkChainCompletion(chainId);

    } catch (error) {
      console.error(`Error executing chain node ${nodeId}:`, error);
      context.activeNodes.delete(nodeId);
    }
  }

  /**
   * 执行链事件
   */
  private async executeChainEvent(
    event: GameEvent,
    gameState: GameState,
    context: ChainExecutionContext
  ): Promise<void> {
    // 应用链上下文变量到事件
    if (context.variables.size > 0) {
      event = this.applyContextVariables(event, context);
    }

    // 记录事件到链变量
    const eventResult = {
      eventId: event.id,
      timestamp: new Date(),
      playerAffected: event.playerIds,
      outcome: 'success'
    };

    context.variables.set(`event_${event.id}`, eventResult);

    // 分析紧急属性
    await this.analyzeEmergentProperties(context, gameState);
  }

  /**
   * 应用上下文变量到事件
   */
  private applyContextVariables(
    event: GameEvent, 
    context: ChainExecutionContext
  ): GameEvent {
    const modifiedEvent = { ...event };

    // 动态调整事件参数
    context.variables.forEach((value, key) => {
      if (key.startsWith('modifier_')) {
        const modifierType = key.replace('modifier_', '');
        if (modifiedEvent.effects) {
          // 应用修饰符到事件效果
          modifiedEvent.effects = modifiedEvent.effects.map(effect => {
            if (effect.type === modifierType) {
              return {
                ...effect,
                value: effect.value * (value as number)
              };
            }
            return effect;
          });
        }
      }
    });

    return modifiedEvent;
  }

  /**
   * 处理级联反应
   */
  private async processCascadingReactions(
    chainId: string,
    triggeredNodeId: string,
    gameState: GameState
  ): Promise<void> {
    const reaction = this.cascadingReactions.get(triggeredNodeId);
    if (!reaction) {
      return;
    }

    // 计算反应强度
    const currentIntensity = reaction.amplitude * 
      Math.exp(-reaction.decayRate * (Date.now() - new Date().getTime()) / 1000);

    if (currentIntensity < 0.1) {
      return; // 反应太弱，忽略
    }

    // 触发紧急效应
    for (const emergentEffect of reaction.emergentEffects) {
      await this.triggerEmergentEffect(emergentEffect, gameState, currentIntensity);
    }

    // 传播到其他链
    await this.propagateReactionToOtherChains(reaction, currentIntensity, gameState);
  }

  /**
   * 触发紧急效应
   */
  private async triggerEmergentEffect(
    effect: EmergentEffect,
    gameState: GameState,
    intensity: number
  ): Promise<void> {
    const adjustedIntensity = effect.intensity * intensity;

    switch (effect.type) {
      case 'economic_bubble':
        await this.handleEconomicBubble(adjustedIntensity, gameState);
        break;
      case 'social_movement':
        await this.handleSocialMovement(adjustedIntensity, gameState);
        break;
      case 'cultural_shift':
        await this.handleCulturalShift(adjustedIntensity, gameState);
        break;
      case 'power_vacuum':
        await this.handlePowerVacuum(adjustedIntensity, gameState);
        break;
      case 'alliance_formation':
        await this.handleAllianceFormation(adjustedIntensity, gameState);
        break;
    }
  }

  /**
   * 评估链条件
   */
  private async evaluateChainConditions(
    conditions: EventChainCondition[],
    gameState: GameState,
    context: ChainExecutionContext
  ): Promise<boolean> {
    if (conditions.length === 0) {
      return true;
    }

    for (const condition of conditions) {
      const result = await this.evaluateSingleCondition(condition, gameState, context);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  /**
   * 评估单个条件
   */
  private async evaluateSingleCondition(
    condition: EventChainCondition,
    gameState: GameState,
    context: ChainExecutionContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'time_delay':
        const elapsedTime = Date.now() - context.startTime.getTime();
        return this.compareValues(elapsedTime, condition.value, condition.operator);

      case 'player_action':
        // 检查玩家是否执行了特定动作
        return context.variables.has(`player_action_${condition.value}`);

      case 'game_state':
        const stateValue = this.getGameStateValue(gameState, condition.target || '');
        return this.compareValues(stateValue, condition.value, condition.operator);

      case 'random':
        return Math.random() < condition.value;

      case 'custom':
        // 自定义条件评估
        return await this.evaluateCustomCondition(condition, gameState, context);

      default:
        return true;
    }
  }

  /**
   * 比较值
   */
  private compareValues(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'gt': return actual > expected;
      case 'lt': return actual < expected;
      case 'gte': return actual >= expected;
      case 'lte': return actual <= expected;
      case 'contains': 
        return Array.isArray(actual) ? actual.includes(expected) : 
               typeof actual === 'string' ? actual.includes(expected) : false;
      default: return true;
    }
  }

  /**
   * 获取游戏状态值
   */
  private getGameStateValue(gameState: GameState, path: string): any {
    const keys = path.split('.');
    let value: any = gameState;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * 分析紧急属性
   */
  private async analyzeEmergentProperties(
    context: ChainExecutionContext,
    gameState: GameState
  ): Promise<void> {
    const stateAnalysis = await this.gameStateAnalyzer.analyzeGameState(gameState);

    // 检测紧急模式
    if (stateAnalysis.economicHealth < 0.3) {
      context.emergentProperties.set('economic_crisis', {
        severity: 1 - stateAnalysis.economicHealth,
        timestamp: new Date()
      });
    }

    if (stateAnalysis.socialStability < 0.4) {
      context.emergentProperties.set('social_unrest', {
        severity: 1 - stateAnalysis.socialStability,
        timestamp: new Date()
      });
    }

    // 检测联盟形成
    const strongAlliances = Object.values(stateAnalysis.relationships)
      .filter(rel => rel.trust > 0.8 && rel.cooperation > 0.7);
    
    if (strongAlliances.length > 0) {
      context.emergentProperties.set('alliance_emergence', {
        alliances: strongAlliances,
        strength: strongAlliances.reduce((sum, rel) => sum + rel.trust, 0) / strongAlliances.length,
        timestamp: new Date()
      });
    }
  }

  /**
   * 检查链完成
   */
  private checkChainCompletion(chainId: string): void {
    const chain = this.chains.get(chainId);
    const context = this.activeChainContexts.get(chainId);

    if (!chain || !context) {
      return;
    }

    const totalNodes = chain.nodes.size;
    const completedNodes = context.completedNodes.size;
    const activeNodes = context.activeNodes.size;

    // 如果所有节点都完成或没有活跃节点，链完成
    if (completedNodes === totalNodes || (activeNodes === 0 && context.pendingNodes.size === 0)) {
      chain.isActive = false;
      this.activeChainContexts.delete(chainId);
      
      console.log(`Event chain ${chain.name} completed. Nodes completed: ${completedNodes}/${totalNodes}`);
    }
  }

  /**
   * 初始化预构建链
   */
  private initializePrebuiltChains(): void {
    // 这里可以添加预定义的事件链
    this.createZodiacSeasonalChain();
    this.createEconomicCrisisChain();
    this.createCulturalFestivalChain();
  }

  /**
   * 创建生肖季节链
   */
  private createZodiacSeasonalChain(): void {
    // 示例：春节庆典事件链
    // 实际实现会更复杂
  }

  /**
   * 创建经济危机链
   */
  private createEconomicCrisisChain(): void {
    // 示例：经济衰退连锁反应
    // 实际实现会更复杂
  }

  /**
   * 创建文化节庆链
   */
  private createCulturalFestivalChain(): void {
    // 示例：传统节日庆典序列
    // 实际实现会更复杂
  }

  // 紧急效应处理方法
  private async handleEconomicBubble(intensity: number, gameState: GameState): Promise<void> {
    console.log(`Economic bubble triggered with intensity: ${intensity}`);
  }

  private async handleSocialMovement(intensity: number, gameState: GameState): Promise<void> {
    console.log(`Social movement triggered with intensity: ${intensity}`);
  }

  private async handleCulturalShift(intensity: number, gameState: GameState): Promise<void> {
    console.log(`Cultural shift triggered with intensity: ${intensity}`);
  }

  private async handlePowerVacuum(intensity: number, gameState: GameState): Promise<void> {
    console.log(`Power vacuum triggered with intensity: ${intensity}`);
  }

  private async handleAllianceFormation(intensity: number, gameState: GameState): Promise<void> {
    console.log(`Alliance formation triggered with intensity: ${intensity}`);
  }

  private async evaluateCustomCondition(
    condition: EventChainCondition,
    gameState: GameState,
    context: ChainExecutionContext
  ): Promise<boolean> {
    // 自定义条件评估逻辑
    return true;
  }

  private async propagateReactionToOtherChains(
    reaction: CascadingReaction,
    intensity: number,
    gameState: GameState
  ): Promise<void> {
    // 反应传播到其他链的逻辑
    console.log(`Propagating reaction with intensity: ${intensity}`);
  }

  /**
   * 获取活跃链状态
   */
  getActiveChains(): Array<{ chainId: string; name: string; progress: number }> {
    const activeChains: Array<{ chainId: string; name: string; progress: number }> = [];

    for (const [chainId, context] of this.activeChainContexts) {
      const chain = this.chains.get(chainId);
      if (chain) {
        const totalNodes = chain.nodes.size;
        const completedNodes = context.completedNodes.size;
        const progress = totalNodes > 0 ? completedNodes / totalNodes : 0;

        activeChains.push({
          chainId,
          name: chain.name,
          progress
        });
      }
    }

    return activeChains;
  }

  /**
   * 强制停止事件链
   */
  stopEventChain(chainId: string): boolean {
    const chain = this.chains.get(chainId);
    const context = this.activeChainContexts.get(chainId);

    if (chain && context) {
      chain.isActive = false;
      this.activeChainContexts.delete(chainId);
      return true;
    }

    return false;
  }

  /**
   * 获取链统计信息
   */
  getChainStatistics(): Record<string, any> {
    return {
      totalChains: this.chains.size,
      activeChains: this.activeChainContexts.size,
      cascadingReactions: this.cascadingReactions.size,
      averageChainComplexity: Array.from(this.chains.values())
        .reduce((sum, chain) => sum + chain.metadata.complexity, 0) / this.chains.size
    };
  }
}