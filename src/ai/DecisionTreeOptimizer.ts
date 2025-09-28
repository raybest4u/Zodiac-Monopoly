import type {
  AIState,
  DecisionTreeNode,
  DecisionCondition,
  DecisionAction,
  ExpectedOutcome,
  SituationAnalysis,
  AIStrategy,
  AIPersonality
} from '../types/ai';

import type {
  GameState,
  Player,
  PlayerAction
} from '../types/game';

/**
 * AI决策树优化器
 * 负责构建、优化和执行高级决策树算法以提升AI决策质量
 */
export class DecisionTreeOptimizer {
  private decisionTrees: Map<string, DecisionTree> = new Map();
  private performanceHistory: Map<string, DecisionPerformance[]> = new Map();
  private readonly config: DecisionTreeConfig;

  constructor(config: Partial<DecisionTreeConfig> = {}) {
    this.config = {
      maxDepth: 8,
      minSamplesPerLeaf: 3,
      maxNodes: 100,
      pruningThreshold: 0.1,
      adaptationRate: 0.05,
      performanceWindowSize: 50,
      ...config
    };
  }

  /**
   * 为AI构建个性化决策树
   */
  async buildPersonalizedDecisionTree(
    aiState: AIState,
    gameContext: GameContext
  ): Promise<DecisionTree> {
    const treeId = `tree_${aiState.id}_${gameContext.phase}`;
    
    // 1. 分析AI个性和策略特征
    const personalityFeatures = this.extractPersonalityFeatures(aiState.personality);
    const strategyFeatures = this.extractStrategyFeatures(aiState.currentStrategy);
    
    // 2. 收集历史决策数据
    const historicalData = this.getHistoricalDecisions(aiState.id);
    
    // 3. 构建决策树结构
    const rootNode = await this.buildTreeStructure(
      personalityFeatures,
      strategyFeatures,
      historicalData,
      gameContext
    );
    
    // 4. 优化决策树
    const optimizedTree = this.optimizeDecisionTree(rootNode);
    
    // 5. 验证和校准
    const validatedTree = await this.validateAndCalibrateTree(optimizedTree, aiState);
    
    const decisionTree: DecisionTree = {
      id: treeId,
      aiId: aiState.id,
      root: validatedTree,
      metadata: {
        buildTime: Date.now(),
        personalityHash: this.hashPersonality(aiState.personality),
        strategyHash: this.hashStrategy(aiState.currentStrategy),
        performanceScore: 0,
        usageCount: 0,
        lastOptimization: Date.now()
      },
      statistics: {
        totalDecisions: 0,
        successfulDecisions: 0,
        averageConfidence: 0,
        averageExecutionTime: 0
      }
    };
    
    this.decisionTrees.set(treeId, decisionTree);
    return decisionTree;
  }

  /**
   * 使用决策树做出最优决策
   */
  async executeDecisionTree(
    treeId: string,
    gameState: GameState,
    analysis: SituationAnalysis,
    availableActions: PlayerAction[]
  ): Promise<OptimizedDecision> {
    const tree = this.decisionTrees.get(treeId);
    if (!tree) {
      throw new Error(`Decision tree not found: ${treeId}`);
    }

    const startTime = Date.now();
    
    // 1. 构建决策上下文
    const context = this.buildDecisionContext(gameState, analysis, availableActions);
    
    // 2. 遍历决策树
    const path = await this.traverseDecisionTree(tree.root, context);
    
    // 3. 提取最佳决策
    const decision = this.extractOptimalDecision(path, availableActions);
    
    // 4. 计算置信度和风险评估
    const confidence = this.calculateDecisionConfidence(path, context);
    const riskAssessment = this.assessDecisionRisk(decision, context);
    
    // 5. 记录性能数据
    const executionTime = Date.now() - startTime;
    this.recordDecisionPerformance(treeId, decision, confidence, executionTime);
    
    return {
      action: decision,
      confidence,
      riskAssessment,
      decisionPath: path,
      executionTime,
      treeId,
      reasoning: this.generateDecisionReasoning(path)
    };
  }

  /**
   * 基于反馈优化决策树
   */
  async optimizeTreeBasedOnFeedback(
    treeId: string,
    feedback: DecisionFeedback
  ): Promise<void> {
    const tree = this.decisionTrees.get(treeId);
    if (!tree) return;

    // 1. 分析反馈数据
    const feedbackAnalysis = this.analyzeFeedback(feedback);
    
    // 2. 识别需要优化的节点
    const optimizationTargets = this.identifyOptimizationTargets(tree, feedbackAnalysis);
    
    // 3. 应用优化策略
    for (const target of optimizationTargets) {
      await this.applyNodeOptimization(tree, target, feedbackAnalysis);
    }
    
    // 4. 重新平衡树结构
    this.rebalanceTree(tree);
    
    // 5. 更新性能统计
    this.updateTreeStatistics(tree, feedback);
    
    tree.metadata.lastOptimization = Date.now();
  }

  /**
   * 动态调整决策策略
   */
  adaptDecisionStrategy(
    aiState: AIState,
    gameState: GameState,
    performanceMetrics: PerformanceMetrics
  ): StrategyAdjustment {
    const currentTree = this.getCurrentTree(aiState.id, gameState);
    if (!currentTree) {
      return { adjustmentType: 'none', reasoning: 'No active decision tree' };
    }

    const adaptationNeeded = this.assessAdaptationNeed(performanceMetrics, currentTree);
    
    if (!adaptationNeeded.isNeeded) {
      return { adjustmentType: 'none', reasoning: adaptationNeeded.reason };
    }

    // 确定调整类型
    const adjustmentType = this.determineAdjustmentType(adaptationNeeded, performanceMetrics);
    
    // 执行策略调整
    const adjustmentDetails = this.executeStrategyAdjustment(
      currentTree,
      adjustmentType,
      performanceMetrics
    );

    return {
      adjustmentType,
      reasoning: adjustmentDetails.reasoning,
      changes: adjustmentDetails.changes,
      expectedImprovement: adjustmentDetails.expectedImprovement
    };
  }

  /**
   * 获取决策树性能分析
   */
  getTreePerformanceAnalysis(treeId: string): TreePerformanceAnalysis {
    const tree = this.decisionTrees.get(treeId);
    if (!tree) {
      throw new Error(`Tree not found: ${treeId}`);
    }

    const performances = this.performanceHistory.get(treeId) || [];
    
    return {
      treeId,
      totalDecisions: tree.statistics.totalDecisions,
      successRate: tree.statistics.successfulDecisions / Math.max(tree.statistics.totalDecisions, 1),
      averageConfidence: tree.statistics.averageConfidence,
      averageExecutionTime: tree.statistics.averageExecutionTime,
      trendAnalysis: this.analyzeTrends(performances),
      strengthsAndWeaknesses: this.identifyStrengthsAndWeaknesses(tree, performances),
      optimizationRecommendations: this.generateOptimizationRecommendations(tree, performances)
    };
  }

  // 私有方法

  private extractPersonalityFeatures(personality: AIPersonality): PersonalityFeatures {
    return {
      riskTolerance: personality.risk_tolerance,
      aggression: personality.aggression,
      cooperation: personality.cooperation,
      adaptability: personality.adaptability,
      patience: personality.patience,
      propertyFocus: personality.property_preference.investmentFocus,
      skillPreferences: {
        aggressive: personality.skill_usage_tendency.aggressiveSkills,
        defensive: personality.skill_usage_tendency.defensiveSkills,
        economic: personality.skill_usage_tendency.economicSkills
      },
      negotiationStyle: personality.negotiation_style.style,
      timingPreference: personality.skill_usage_tendency.timingPreference
    };
  }

  private extractStrategyFeatures(strategy: AIStrategy): StrategyFeatures {
    return {
      focus: strategy.focus,
      timeHorizon: strategy.timeHorizon,
      riskLevel: strategy.riskLevel,
      weights: { ...strategy.weights }
    };
  }

  private getHistoricalDecisions(aiId: string): HistoricalDecision[] {
    // 简化实现：返回空数组，实际应该从存储中获取历史数据
    return [];
  }

  private async buildTreeStructure(
    personality: PersonalityFeatures,
    strategy: StrategyFeatures,
    history: HistoricalDecision[],
    context: GameContext
  ): Promise<DecisionTreeNode> {
    // 构建根节点
    const root: DecisionTreeNode = {
      id: 'root',
      type: 'condition',
      condition: {
        type: 'game_state',
        field: 'phase',
        operator: 'eq',
        value: context.phase,
        weight: 1.0
      },
      children: [],
      weight: 1.0,
      priority: 1,
      description: 'Root decision node'
    };

    // 构建主要决策分支
    const branches = this.createDecisionBranches(personality, strategy, context);
    root.children = branches;

    return root;
  }

  private createDecisionBranches(
    personality: PersonalityFeatures,
    strategy: StrategyFeatures,
    context: GameContext
  ): DecisionTreeNode[] {
    const branches: DecisionTreeNode[] = [];

    // 1. 经济决策分支
    if (strategy.focus === 'wealth_accumulation' || personality.propertyFocus === 'roi') {
      branches.push(this.createEconomicDecisionBranch(personality, strategy));
    }

    // 2. 房产决策分支
    if (strategy.focus === 'property_monopoly') {
      branches.push(this.createPropertyDecisionBranch(personality, strategy));
    }

    // 3. 竞争决策分支
    if (strategy.focus === 'player_elimination' || personality.aggression > 0.7) {
      branches.push(this.createCompetitiveDecisionBranch(personality, strategy));
    }

    // 4. 防御决策分支
    if (strategy.focus === 'risk_minimization' || personality.riskTolerance < 0.3) {
      branches.push(this.createDefensiveDecisionBranch(personality, strategy));
    }

    // 5. 社交决策分支
    if (personality.cooperation > 0.6) {
      branches.push(this.createSocialDecisionBranch(personality, strategy));
    }

    return branches;
  }

  private createEconomicDecisionBranch(personality: PersonalityFeatures, strategy: StrategyFeatures): DecisionTreeNode {
    return {
      id: 'economic_branch',
      type: 'condition',
      condition: {
        type: 'player_state',
        field: 'money',
        operator: 'gt',
        value: 5000,
        weight: strategy.weights.moneyAccumulation
      },
      children: [
        {
          id: 'buy_property_action',
          type: 'action',
          action: {
            type: 'immediate',
            actionType: 'buy_property',
            parameters: { aggressive: personality.aggression > 0.5 },
            confidence: 0.8,
            expectedOutcome: {
              probability: 0.7,
              benefit: 0.8,
              risk: 0.3,
              timeline: 10
            }
          },
          children: [],
          weight: personality.propertyFocus === 'roi' ? 0.9 : 0.6,
          priority: 2,
          description: 'Purchase property for economic gain'
        }
      ],
      weight: 0.8,
      priority: 1,
      description: 'Economic decision making branch'
    };
  }

  private createPropertyDecisionBranch(personality: PersonalityFeatures, strategy: StrategyFeatures): DecisionTreeNode {
    return {
      id: 'property_branch',
      type: 'condition',
      condition: {
        type: 'game_state',
        field: 'availableProperties',
        operator: 'gt',
        value: 0,
        weight: strategy.weights.propertyAcquisition
      },
      children: [],
      weight: 0.7,
      priority: 2,
      description: 'Property acquisition branch'
    };
  }

  private createCompetitiveDecisionBranch(personality: PersonalityFeatures, strategy: StrategyFeatures): DecisionTreeNode {
    return {
      id: 'competitive_branch',
      type: 'condition',
      condition: {
        type: 'opponent_state',
        field: 'threat_level',
        operator: 'gt',
        value: 0.5,
        weight: personality.aggression
      },
      children: [],
      weight: personality.aggression,
      priority: 3,
      description: 'Competitive action branch'
    };
  }

  private createDefensiveDecisionBranch(personality: PersonalityFeatures, strategy: StrategyFeatures): DecisionTreeNode {
    return {
      id: 'defensive_branch',
      type: 'condition',
      condition: {
        type: 'player_state',
        field: 'vulnerability',
        operator: 'gt',
        value: 0.4,
        weight: 1.0 - personality.riskTolerance
      },
      children: [],
      weight: 1.0 - personality.riskTolerance,
      priority: 4,
      description: 'Defensive strategy branch'
    };
  }

  private createSocialDecisionBranch(personality: PersonalityFeatures, strategy: StrategyFeatures): DecisionTreeNode {
    return {
      id: 'social_branch',
      type: 'condition',
      condition: {
        type: 'game_state',
        field: 'trade_opportunities',
        operator: 'gt',
        value: 0,
        weight: personality.cooperation
      },
      children: [],
      weight: personality.cooperation,
      priority: 5,
      description: 'Social interaction branch'
    };
  }

  private optimizeDecisionTree(root: DecisionTreeNode): DecisionTreeNode {
    // 1. 剪枝低效分支
    this.pruneIneffectiveBranches(root);
    
    // 2. 平衡树结构
    this.balanceTreeStructure(root);
    
    // 3. 优化权重分配
    this.optimizeNodeWeights(root);
    
    return root;
  }

  private async validateAndCalibrateTree(tree: DecisionTreeNode, aiState: AIState): Promise<DecisionTreeNode> {
    // 简化实现：返回原树
    return tree;
  }

  private buildDecisionContext(
    gameState: GameState,
    analysis: SituationAnalysis,
    availableActions: PlayerAction[]
  ): DecisionContext {
    return {
      gameState: {
        phase: gameState.phase,
        turn: gameState.turn,
        players: gameState.players.length,
        availableProperties: gameState.board.filter(cell => 
          cell.type === 'property' && !cell.ownerId
        ).length
      },
      playerState: {
        money: 0, // 将从gameState中获取
        properties: 0,
        position: 0,
        vulnerability: 0.3
      },
      opponentState: {
        threatLevel: analysis.threats.length > 0 ? 
          Math.max(...analysis.threats.map(t => t.severity)) : 0,
        competitionLevel: 0.5
      },
      availableActions,
      timestamp: Date.now()
    };
  }

  private async traverseDecisionTree(
    node: DecisionTreeNode,
    context: DecisionContext
  ): Promise<DecisionPath> {
    const path: DecisionPathNode[] = [];
    let currentNode = node;
    
    while (currentNode) {
      const pathNode: DecisionPathNode = {
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        decision: null,
        confidence: 0
      };

      if (currentNode.type === 'condition' && currentNode.condition) {
        const conditionMet = this.evaluateCondition(currentNode.condition, context);
        pathNode.decision = conditionMet;
        pathNode.confidence = conditionMet ? 0.8 : 0.2;
        
        // 选择下一个节点
        if (conditionMet && currentNode.children.length > 0) {
          currentNode = this.selectBestChild(currentNode.children, context);
        } else {
          break;
        }
      } else if (currentNode.type === 'action' && currentNode.action) {
        pathNode.decision = currentNode.action;
        pathNode.confidence = currentNode.action.confidence;
        break;
      } else {
        break;
      }
      
      path.push(pathNode);
    }

    return { nodes: path, finalNode: currentNode };
  }

  private evaluateCondition(condition: DecisionCondition, context: DecisionContext): boolean {
    let value: any;
    
    switch (condition.type) {
      case 'game_state':
        value = (context.gameState as any)[condition.field];
        break;
      case 'player_state':
        value = (context.playerState as any)[condition.field];
        break;
      case 'opponent_state':
        value = (context.opponentState as any)[condition.field];
        break;
      default:
        return false;
    }

    return this.compareValues(value, condition.operator, condition.value);
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'ne': return actual !== expected;
      case 'gt': return actual > expected;
      case 'gte': return actual >= expected;
      case 'lt': return actual < expected;
      case 'lte': return actual <= expected;
      case 'in': return Array.isArray(expected) && expected.includes(actual);
      case 'contains': return typeof actual === 'string' && actual.includes(expected);
      default: return false;
    }
  }

  private selectBestChild(children: DecisionTreeNode[], context: DecisionContext): DecisionTreeNode {
    // 基于权重和优先级选择最佳子节点
    return children.reduce((best, current) => {
      const bestScore = best.weight * best.priority;
      const currentScore = current.weight * current.priority;
      return currentScore > bestScore ? current : best;
    });
  }

  private extractOptimalDecision(path: DecisionPath, availableActions: PlayerAction[]): PlayerAction {
    // 从路径中提取最终决策
    const finalNode = path.finalNode;
    if (finalNode?.action) {
      // 尝试匹配可用动作
      const matchingAction = availableActions.find(action => 
        action.type === finalNode.action?.actionType
      );
      return matchingAction || availableActions[0] || {
        type: 'pass',
        playerId: '',
        data: {},
        timestamp: Date.now()
      };
    }
    
    return availableActions[0] || {
      type: 'pass',
      playerId: '',
      data: {},
      timestamp: Date.now()
    };
  }

  private calculateDecisionConfidence(path: DecisionPath, context: DecisionContext): number {
    if (path.nodes.length === 0) return 0.5;
    
    const avgConfidence = path.nodes.reduce((sum, node) => sum + node.confidence, 0) / path.nodes.length;
    return Math.max(0.1, Math.min(0.95, avgConfidence));
  }

  private assessDecisionRisk(decision: PlayerAction, context: DecisionContext): RiskAssessment {
    return {
      level: 'medium',
      factors: ['market_volatility', 'competition'],
      probability: 0.3,
      mitigation: ['diversify_portfolio', 'maintain_reserves']
    };
  }

  private recordDecisionPerformance(
    treeId: string,
    decision: PlayerAction,
    confidence: number,
    executionTime: number
  ): void {
    const performance: DecisionPerformance = {
      timestamp: Date.now(),
      decision: decision.type,
      confidence,
      executionTime,
      outcome: null // 将在后续反馈中更新
    };

    const history = this.performanceHistory.get(treeId) || [];
    history.push(performance);
    
    // 保持历史记录在配置的窗口大小内
    if (history.length > this.config.performanceWindowSize) {
      history.splice(0, history.length - this.config.performanceWindowSize);
    }
    
    this.performanceHistory.set(treeId, history);
  }

  private generateDecisionReasoning(path: DecisionPath): string {
    const reasons = path.nodes.map(node => {
      if (node.nodeType === 'condition') {
        return `评估条件${node.nodeId}: ${node.decision ? '满足' : '不满足'}`;
      } else if (node.nodeType === 'action') {
        return `执行动作: ${JSON.stringify(node.decision)}`;
      }
      return '';
    }).filter(Boolean);

    return reasons.join(' -> ') || '基于决策树的标准流程';
  }

  // 简化的辅助方法实现
  private hashPersonality(personality: AIPersonality): string {
    return `p_${personality.risk_tolerance}_${personality.aggression}_${personality.cooperation}`;
  }

  private hashStrategy(strategy: AIStrategy): string {
    return `s_${strategy.focus}_${strategy.riskLevel}`;
  }

  private pruneIneffectiveBranches(node: DecisionTreeNode): void {
    // 简化实现
  }

  private balanceTreeStructure(node: DecisionTreeNode): void {
    // 简化实现
  }

  private optimizeNodeWeights(node: DecisionTreeNode): void {
    // 简化实现
  }

  private analyzeFeedback(feedback: DecisionFeedback): FeedbackAnalysis {
    return {
      success: feedback.success,
      impactLevel: feedback.actualOutcome?.benefit || 0,
      accuracy: feedback.success ? 0.8 : 0.3
    };
  }

  private identifyOptimizationTargets(tree: DecisionTree, analysis: FeedbackAnalysis): OptimizationTarget[] {
    return [];
  }

  private async applyNodeOptimization(
    tree: DecisionTree,
    target: OptimizationTarget,
    analysis: FeedbackAnalysis
  ): Promise<void> {
    // 优化实现
  }

  private rebalanceTree(tree: DecisionTree): void {
    // 重新平衡实现
  }

  private updateTreeStatistics(tree: DecisionTree, feedback: DecisionFeedback): void {
    tree.statistics.totalDecisions++;
    if (feedback.success) {
      tree.statistics.successfulDecisions++;
    }
    
    tree.statistics.averageConfidence = 
      (tree.statistics.averageConfidence * (tree.statistics.totalDecisions - 1) + 
       feedback.confidence) / tree.statistics.totalDecisions;
  }

  private getCurrentTree(aiId: string, gameState: GameState): DecisionTree | undefined {
    for (const tree of this.decisionTrees.values()) {
      if (tree.aiId === aiId) {
        return tree;
      }
    }
    return undefined;
  }

  private assessAdaptationNeed(metrics: PerformanceMetrics, tree: DecisionTree): AdaptationAssessment {
    return {
      isNeeded: metrics.successRate < 0.6,
      reason: metrics.successRate < 0.6 ? '成功率较低需要调整' : '表现良好无需调整',
      urgency: metrics.successRate < 0.4 ? 'high' : 'low'
    };
  }

  private determineAdjustmentType(assessment: AdaptationAssessment, metrics: PerformanceMetrics): string {
    if (metrics.successRate < 0.4) return 'major_restructure';
    if (metrics.averageConfidence < 0.5) return 'confidence_boost';
    return 'minor_tuning';
  }

  private executeStrategyAdjustment(
    tree: DecisionTree,
    adjustmentType: string,
    metrics: PerformanceMetrics
  ): AdjustmentDetails {
    return {
      reasoning: `执行${adjustmentType}调整以改善性能`,
      changes: [`调整类型: ${adjustmentType}`],
      expectedImprovement: 0.15
    };
  }

  private analyzeTrends(performances: DecisionPerformance[]): TrendAnalysis {
    return {
      direction: 'stable',
      confidence: 0.7,
      prediction: '性能保持稳定'
    };
  }

  private identifyStrengthsAndWeaknesses(
    tree: DecisionTree,
    performances: DecisionPerformance[]
  ): StrengthsAndWeaknesses {
    return {
      strengths: ['决策速度快', '置信度稳定'],
      weaknesses: ['复杂情况下表现有待提升'],
      opportunities: ['优化分支权重', '增加学习机制']
    };
  }

  private generateOptimizationRecommendations(
    tree: DecisionTree,
    performances: DecisionPerformance[]
  ): string[] {
    return [
      '增加更多条件分支以处理边缘情况',
      '调整权重分配以提升整体性能',
      '加强反馈学习机制'
    ];
  }
}

// 类型定义
export interface DecisionTreeConfig {
  maxDepth: number;
  minSamplesPerLeaf: number;
  maxNodes: number;
  pruningThreshold: number;
  adaptationRate: number;
  performanceWindowSize: number;
}

export interface DecisionTree {
  id: string;
  aiId: string;
  root: DecisionTreeNode;
  metadata: TreeMetadata;
  statistics: TreeStatistics;
}

export interface TreeMetadata {
  buildTime: number;
  personalityHash: string;
  strategyHash: string;
  performanceScore: number;
  usageCount: number;
  lastOptimization: number;
}

export interface TreeStatistics {
  totalDecisions: number;
  successfulDecisions: number;
  averageConfidence: number;
  averageExecutionTime: number;
}

export interface GameContext {
  phase: string;
  difficulty: string;
  playerCount: number;
}

export interface PersonalityFeatures {
  riskTolerance: number;
  aggression: number;
  cooperation: number;
  adaptability: number;
  patience: number;
  propertyFocus: string;
  skillPreferences: {
    aggressive: number;
    defensive: number;
    economic: number;
  };
  negotiationStyle: string;
  timingPreference: string;
}

export interface StrategyFeatures {
  focus: string;
  timeHorizon: string;
  riskLevel: string;
  weights: Record<string, number>;
}

export interface HistoricalDecision {
  action: string;
  outcome: string;
  success: boolean;
  timestamp: number;
}

export interface DecisionContext {
  gameState: {
    phase: string;
    turn: number;
    players: number;
    availableProperties: number;
  };
  playerState: {
    money: number;
    properties: number;
    position: number;
    vulnerability: number;
  };
  opponentState: {
    threatLevel: number;
    competitionLevel: number;
  };
  availableActions: PlayerAction[];
  timestamp: number;
}

export interface DecisionPath {
  nodes: DecisionPathNode[];
  finalNode?: DecisionTreeNode;
}

export interface DecisionPathNode {
  nodeId: string;
  nodeType: string;
  decision: any;
  confidence: number;
}

export interface OptimizedDecision {
  action: PlayerAction;
  confidence: number;
  riskAssessment: RiskAssessment;
  decisionPath: DecisionPath;
  executionTime: number;
  treeId: string;
  reasoning: string;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  probability: number;
  mitigation: string[];
}

export interface DecisionPerformance {
  timestamp: number;
  decision: string;
  confidence: number;
  executionTime: number;
  outcome: any;
}

export interface DecisionFeedback {
  success: boolean;
  confidence: number;
  actualOutcome?: ExpectedOutcome;
}

export interface PerformanceMetrics {
  successRate: number;
  averageConfidence: number;
  averageExecutionTime: number;
}

export interface StrategyAdjustment {
  adjustmentType: string;
  reasoning: string;
  changes?: string[];
  expectedImprovement?: number;
}

export interface TreePerformanceAnalysis {
  treeId: string;
  totalDecisions: number;
  successRate: number;
  averageConfidence: number;
  averageExecutionTime: number;
  trendAnalysis: TrendAnalysis;
  strengthsAndWeaknesses: StrengthsAndWeaknesses;
  optimizationRecommendations: string[];
}

export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable';
  confidence: number;
  prediction: string;
}

export interface StrengthsAndWeaknesses {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export interface FeedbackAnalysis {
  success: boolean;
  impactLevel: number;
  accuracy: number;
}

export interface OptimizationTarget {
  nodeId: string;
  issue: string;
  priority: number;
}

export interface AdaptationAssessment {
  isNeeded: boolean;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface AdjustmentDetails {
  reasoning: string;
  changes: string[];
  expectedImprovement: number;
}