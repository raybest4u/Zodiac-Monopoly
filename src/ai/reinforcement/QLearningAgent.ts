/**
 * Q-Learning 强化学习算法实现
 * Q-Learning Reinforcement Learning Algorithm
 * 
 * 实现经典的Q-Learning算法，用于Zodiac Monopoly游戏的AI决策
 */

import { EventEmitter } from '../../utils/EventEmitter';
import type { 
  RLState, 
  RLAction, 
  RLReward, 
  RLExperience, 
  RLAgent,
  QTableConfig,
  PolicyParameters
} from './ReinforcementLearningFramework';

export interface QTable {
  stateActionValues: Map<string, Map<string, number>>;
  visitCounts: Map<string, Map<string, number>>;
  stateVisits: Map<string, number>;
  totalUpdates: number;
  lastUpdate: number;
}

export interface QLearningConfig {
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
  explorationDecay: number;
  minExplorationRate: number;
  qTableConfig: QTableConfig;
  eligibilityTraces?: boolean;
  traceDecay?: number;
}

export interface QLearningStats {
  episodeRewards: number[];
  explorationRates: number[];
  qValueChanges: number[];
  convergenceMetrics: {
    meanAbsoluteChange: number;
    maxAbsoluteChange: number;
    stabilityIndex: number;
  };
  explorationStats: {
    statesExplored: number;
    actionsExplored: number;
    noveltyScore: number;
  };
}

export interface EligibilityTrace {
  stateActionPairs: Map<string, number>;
  decayFactor: number;
  threshold: number;
}

export class QLearningAgent extends EventEmitter {
  private qTable: QTable;
  private config: QLearningConfig;
  private stats: QLearningStats;
  private eligibilityTrace?: EligibilityTrace;
  private currentEpisode: number = 0;
  private totalSteps: number = 0;

  constructor(config: QLearningConfig) {
    super();
    this.config = config;
    this.qTable = this.initializeQTable();
    this.stats = this.initializeStats();
    
    if (config.eligibilityTraces) {
      this.eligibilityTrace = this.initializeEligibilityTrace();
    }
  }

  // ============================================================================
  // Q-Learning 核心算法实现
  // ============================================================================

  /**
   * 选择动作 - ε-greedy策略
   */
  public selectAction(state: RLState, availableActions: RLAction[]): RLAction {
    const stateKey = this.getStateKey(state);
    
    // 确保状态在Q表中存在
    this.ensureStateInQTable(stateKey, availableActions);
    
    // ε-greedy 动作选择
    if (Math.random() < this.config.explorationRate) {
      // 探索：随机选择动作
      const randomIndex = Math.floor(Math.random() * availableActions.length);
      const selectedAction = availableActions[randomIndex];
      
      this.emit('action:exploration', {
        state: stateKey,
        action: selectedAction.id,
        explorationRate: this.config.explorationRate
      });
      
      return selectedAction;
    } else {
      // 利用：选择Q值最高的动作
      const bestAction = this.selectBestAction(stateKey, availableActions);
      
      this.emit('action:exploitation', {
        state: stateKey,
        action: bestAction.id,
        qValue: this.getQValue(stateKey, bestAction.id)
      });
      
      return bestAction;
    }
  }

  /**
   * 更新Q值 - Q-Learning更新规则
   */
  public updateQValue(
    state: RLState,
    action: RLAction,
    reward: RLReward,
    nextState: RLState,
    nextAvailableActions: RLAction[]
  ): void {
    const stateKey = this.getStateKey(state);
    const nextStateKey = this.getStateKey(nextState);
    const actionId = action.id;

    // 确保状态和下一状态都在Q表中
    this.ensureStateInQTable(stateKey, [action]);
    this.ensureStateInQTable(nextStateKey, nextAvailableActions);

    // 获取当前Q值
    const currentQ = this.getQValue(stateKey, actionId);

    // 计算下一状态的最大Q值
    const maxNextQ = this.getMaxQValue(nextStateKey, nextAvailableActions);

    // Q-Learning更新公式: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    const targetQ = reward.total + this.config.discountFactor * maxNextQ;
    const qValueChange = Math.abs(targetQ - currentQ);
    const newQ = currentQ + this.config.learningRate * (targetQ - currentQ);

    // 更新Q表
    this.setQValue(stateKey, actionId, newQ);
    this.updateVisitCounts(stateKey, actionId);

    // 更新资格迹（如果启用）
    if (this.eligibilityTrace) {
      this.updateEligibilityTrace(stateKey, actionId, reward.total, maxNextQ);
    }

    // 记录统计信息
    this.stats.qValueChanges.push(qValueChange);
    this.updateConvergenceMetrics(qValueChange);

    this.emit('qvalue:updated', {
      state: stateKey,
      action: actionId,
      oldValue: currentQ,
      newValue: newQ,
      reward: reward.total,
      change: qValueChange
    });

    this.totalSteps++;
  }

  /**
   * 完成一个回合
   */
  public completeEpisode(totalReward: number): void {
    this.currentEpisode++;
    this.stats.episodeRewards.push(totalReward);
    this.stats.explorationRates.push(this.config.explorationRate);

    // 更新探索率
    this.updateExplorationRate();

    // 重置资格迹
    if (this.eligibilityTrace) {
      this.resetEligibilityTrace();
    }

    // 更新探索统计
    this.updateExplorationStats();

    this.emit('episode:completed', {
      episode: this.currentEpisode,
      reward: totalReward,
      explorationRate: this.config.explorationRate,
      qTableSize: this.qTable.stateActionValues.size
    });
  }

  // ============================================================================
  // Q表管理方法
  // ============================================================================

  private initializeQTable(): QTable {
    return {
      stateActionValues: new Map(),
      visitCounts: new Map(),
      stateVisits: new Map(),
      totalUpdates: 0,
      lastUpdate: Date.now()
    };
  }

  private ensureStateInQTable(stateKey: string, actions: RLAction[]): void {
    if (!this.qTable.stateActionValues.has(stateKey)) {
      const actionMap = new Map<string, number>();
      const visitMap = new Map<string, number>();
      
      // 使用配置的初始值初始化所有动作
      actions.forEach(action => {
        actionMap.set(action.id, this.config.qTableConfig.initialValue);
        visitMap.set(action.id, 0);
      });
      
      this.qTable.stateActionValues.set(stateKey, actionMap);
      this.qTable.visitCounts.set(stateKey, visitMap);
      this.qTable.stateVisits.set(stateKey, 0);
    }
  }

  private getQValue(stateKey: string, actionId: string): number {
    const stateActions = this.qTable.stateActionValues.get(stateKey);
    return stateActions?.get(actionId) || this.config.qTableConfig.initialValue;
  }

  private setQValue(stateKey: string, actionId: string, value: number): void {
    const stateActions = this.qTable.stateActionValues.get(stateKey);
    if (stateActions) {
      stateActions.set(actionId, value);
      this.qTable.totalUpdates++;
      this.qTable.lastUpdate = Date.now();
    }
  }

  private getMaxQValue(stateKey: string, availableActions: RLAction[]): number {
    const stateActions = this.qTable.stateActionValues.get(stateKey);
    if (!stateActions) {
      return this.config.qTableConfig.initialValue;
    }

    let maxQ = -Infinity;
    for (const action of availableActions) {
      const qValue = stateActions.get(action.id) || this.config.qTableConfig.initialValue;
      maxQ = Math.max(maxQ, qValue);
    }

    return maxQ === -Infinity ? this.config.qTableConfig.initialValue : maxQ;
  }

  private selectBestAction(stateKey: string, availableActions: RLAction[]): RLAction {
    const stateActions = this.qTable.stateActionValues.get(stateKey);
    if (!stateActions) {
      return availableActions[0];
    }

    let bestAction = availableActions[0];
    let bestQ = stateActions.get(bestAction.id) || this.config.qTableConfig.initialValue;

    for (const action of availableActions) {
      const qValue = stateActions.get(action.id) || this.config.qTableConfig.initialValue;
      if (qValue > bestQ) {
        bestQ = qValue;
        bestAction = action;
      }
    }

    return bestAction;
  }

  private updateVisitCounts(stateKey: string, actionId: string): void {
    const stateVisits = this.qTable.visitCounts.get(stateKey);
    if (stateVisits) {
      const currentCount = stateVisits.get(actionId) || 0;
      stateVisits.set(actionId, currentCount + 1);
    }

    const totalStateVisits = this.qTable.stateVisits.get(stateKey) || 0;
    this.qTable.stateVisits.set(stateKey, totalStateVisits + 1);
  }

  // ============================================================================
  // 资格迹实现（TD(λ)）
  // ============================================================================

  private initializeEligibilityTrace(): EligibilityTrace {
    return {
      stateActionPairs: new Map(),
      decayFactor: this.config.traceDecay || 0.9,
      threshold: 0.01
    };
  }

  private updateEligibilityTrace(
    stateKey: string, 
    actionId: string, 
    reward: number, 
    maxNextQ: number
  ): void {
    if (!this.eligibilityTrace) return;

    const traceKey = `${stateKey}:${actionId}`;
    
    // 增加当前状态-动作对的资格迹
    this.eligibilityTrace.stateActionPairs.set(traceKey, 1.0);

    // 计算TD误差
    const currentQ = this.getQValue(stateKey, actionId);
    const tdError = reward + this.config.discountFactor * maxNextQ - currentQ;

    // 更新所有有资格迹的状态-动作对
    for (const [traceStateAction, eligibility] of this.eligibilityTrace.stateActionPairs) {
      const [traceState, traceAction] = traceStateAction.split(':');
      const currentTraceQ = this.getQValue(traceState, traceAction);
      const newQ = currentTraceQ + this.config.learningRate * tdError * eligibility;
      
      this.setQValue(traceState, traceAction, newQ);
      
      // 衰减资格迹
      const newEligibility = eligibility * this.config.discountFactor * this.eligibilityTrace.decayFactor;
      
      if (newEligibility < this.eligibilityTrace.threshold) {
        this.eligibilityTrace.stateActionPairs.delete(traceStateAction);
      } else {
        this.eligibilityTrace.stateActionPairs.set(traceStateAction, newEligibility);
      }
    }
  }

  private resetEligibilityTrace(): void {
    if (this.eligibilityTrace) {
      this.eligibilityTrace.stateActionPairs.clear();
    }
  }

  // ============================================================================
  // 探索策略和学习率调度
  // ============================================================================

  private updateExplorationRate(): void {
    // 指数衰减探索率
    this.config.explorationRate = Math.max(
      this.config.minExplorationRate,
      this.config.explorationRate * this.config.explorationDecay
    );
  }

  public setExplorationRate(rate: number): void {
    this.config.explorationRate = Math.max(0, Math.min(1, rate));
    this.emit('exploration:rateChanged', { newRate: this.config.explorationRate });
  }

  public setLearningRate(rate: number): void {
    this.config.learningRate = Math.max(0, Math.min(1, rate));
    this.emit('learning:rateChanged', { newRate: this.config.learningRate });
  }

  // ============================================================================
  // 统计和监控方法
  // ============================================================================

  private initializeStats(): QLearningStats {
    return {
      episodeRewards: [],
      explorationRates: [],
      qValueChanges: [],
      convergenceMetrics: {
        meanAbsoluteChange: 0,
        maxAbsoluteChange: 0,
        stabilityIndex: 0
      },
      explorationStats: {
        statesExplored: 0,
        actionsExplored: 0,
        noveltyScore: 0
      }
    };
  }

  private updateConvergenceMetrics(qValueChange: number): void {
    const recentChanges = this.stats.qValueChanges.slice(-100); // 最近100次更新
    
    this.stats.convergenceMetrics.meanAbsoluteChange = 
      recentChanges.reduce((sum, change) => sum + change, 0) / recentChanges.length;
    
    this.stats.convergenceMetrics.maxAbsoluteChange = 
      Math.max(...recentChanges);
    
    // 稳定性指数：最近变化的标准差的倒数
    const mean = this.stats.convergenceMetrics.meanAbsoluteChange;
    const variance = recentChanges.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / recentChanges.length;
    const stdDev = Math.sqrt(variance);
    this.stats.convergenceMetrics.stabilityIndex = stdDev > 0 ? 1 / stdDev : 1000;
  }

  private updateExplorationStats(): void {
    this.stats.explorationStats.statesExplored = this.qTable.stateActionValues.size;
    
    let totalActions = 0;
    for (const stateActions of this.qTable.stateActionValues.values()) {
      totalActions += stateActions.size;
    }
    this.stats.explorationStats.actionsExplored = totalActions;
    
    // 新颖性评分：基于状态访问的均匀性
    const visitCounts = Array.from(this.qTable.stateVisits.values());
    const maxVisits = Math.max(...visitCounts);
    const minVisits = Math.min(...visitCounts);
    this.stats.explorationStats.noveltyScore = maxVisits > 0 ? minVisits / maxVisits : 0;
  }

  public getStats(): QLearningStats {
    return { ...this.stats };
  }

  public getQTable(): QTable {
    return this.qTable;
  }

  public getConfig(): QLearningConfig {
    return { ...this.config };
  }

  // ============================================================================
  // 模型保存和加载
  // ============================================================================

  public saveModel(): any {
    const model = {
      config: this.config,
      qTable: {
        stateActionValues: Object.fromEntries(
          Array.from(this.qTable.stateActionValues.entries()).map(([state, actions]) => [
            state,
            Object.fromEntries(actions)
          ])
        ),
        visitCounts: Object.fromEntries(
          Array.from(this.qTable.visitCounts.entries()).map(([state, counts]) => [
            state,
            Object.fromEntries(counts)
          ])
        ),
        stateVisits: Object.fromEntries(this.qTable.stateVisits),
        totalUpdates: this.qTable.totalUpdates,
        lastUpdate: this.qTable.lastUpdate
      },
      stats: this.stats,
      metadata: {
        currentEpisode: this.currentEpisode,
        totalSteps: this.totalSteps,
        saveTime: Date.now(),
        version: '1.0.0'
      }
    };

    this.emit('model:saved', { modelSize: JSON.stringify(model).length });
    return model;
  }

  public loadModel(model: any): void {
    try {
      this.config = { ...this.config, ...model.config };
      
      // 重建Q表
      this.qTable = {
        stateActionValues: new Map(
          Object.entries(model.qTable.stateActionValues).map(([state, actions]) => [
            state,
            new Map(Object.entries(actions as Record<string, number>))
          ])
        ),
        visitCounts: new Map(
          Object.entries(model.qTable.visitCounts).map(([state, counts]) => [
            state,
            new Map(Object.entries(counts as Record<string, number>))
          ])
        ),
        stateVisits: new Map(Object.entries(model.qTable.stateVisits)),
        totalUpdates: model.qTable.totalUpdates,
        lastUpdate: model.qTable.lastUpdate
      };

      this.stats = model.stats;
      this.currentEpisode = model.metadata.currentEpisode;
      this.totalSteps = model.metadata.totalSteps;

      this.emit('model:loaded', { 
        qTableSize: this.qTable.stateActionValues.size,
        totalUpdates: this.qTable.totalUpdates
      });
    } catch (error) {
      this.emit('model:loadError', { error });
      throw new Error(`Failed to load Q-Learning model: ${error}`);
    }
  }

  // ============================================================================
  // 评估和分析方法
  // ============================================================================

  public evaluatePolicy(states: RLState[], availableActionsMap: Map<string, RLAction[]>): {
    averageValue: number;
    maxValue: number;
    minValue: number;
    stateValueDistribution: number[];
  } {
    const stateValues: number[] = [];

    for (const state of states) {
      const stateKey = this.getStateKey(state);
      const availableActions = availableActionsMap.get(stateKey) || [];
      const maxQ = this.getMaxQValue(stateKey, availableActions);
      stateValues.push(maxQ);
    }

    return {
      averageValue: stateValues.reduce((sum, val) => sum + val, 0) / stateValues.length,
      maxValue: Math.max(...stateValues),
      minValue: Math.min(...stateValues),
      stateValueDistribution: stateValues
    };
  }

  public analyzeActionPreferences(): Map<string, number> {
    const actionCounts = new Map<string, number>();
    
    for (const stateActions of this.qTable.visitCounts.values()) {
      for (const [action, count] of stateActions) {
        const currentCount = actionCounts.get(action) || 0;
        actionCounts.set(action, currentCount + count);
      }
    }

    return actionCounts;
  }

  public getTopStates(limit: number = 10): Array<{state: string, value: number, visits: number}> {
    const stateInfo: Array<{state: string, value: number, visits: number}> = [];

    for (const [stateKey, stateActions] of this.qTable.stateActionValues) {
      const maxValue = Math.max(...Array.from(stateActions.values()));
      const visits = this.qTable.stateVisits.get(stateKey) || 0;
      
      stateInfo.push({
        state: stateKey,
        value: maxValue,
        visits
      });
    }

    return stateInfo
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private getStateKey(state: RLState): string {
    // 使用状态特征创建唯一键
    return state.hash || state.id;
  }

  public reset(): void {
    this.qTable = this.initializeQTable();
    this.stats = this.initializeStats();
    this.currentEpisode = 0;
    this.totalSteps = 0;
    
    if (this.eligibilityTrace) {
      this.resetEligibilityTrace();
    }

    this.emit('agent:reset');
  }

  public getMetrics(): {
    totalStates: number;
    totalUpdates: number;
    currentEpisode: number;
    totalSteps: number;
    explorationRate: number;
    convergenceScore: number;
  } {
    return {
      totalStates: this.qTable.stateActionValues.size,
      totalUpdates: this.qTable.totalUpdates,
      currentEpisode: this.currentEpisode,
      totalSteps: this.totalSteps,
      explorationRate: this.config.explorationRate,
      convergenceScore: this.stats.convergenceMetrics.stabilityIndex
    };
  }
}