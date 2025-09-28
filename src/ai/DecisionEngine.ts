import type {
  AIState,
  AIDecision,
  AlternativeAction,
  SituationAnalysis,
  GamePhaseAnalysis,
  PlayerPositionAnalysis,
  EconomicAnalysis,
  ThreatAnalysis,
  OpportunityAnalysis,
  AIStrategy,
  DecisionContext,
  DecisionTreeNode,
  DecisionCondition,
  DecisionAction
} from '../types/ai';

import type {
  GameState,
  Player,
  PlayerAction,
  GamePhase
} from '../types/game';

import { TradingSystem } from './TradingSystem';
import { SkillSystem } from './SkillSystem';
import { DecisionTreeOptimizer } from './DecisionTreeOptimizer';
import { LLMService, type LLMConfig, type DetailedReasoning } from './LLMService';
import { getPropertyPrice, canBuyProperty, getRentInfo, needsToPayRent } from '../engine/PropertyHelpers';

/**
 * AI决策引擎 - 负责分析游戏状态并做出智能决策
 * 现在集成LLM服务提供上下文推理和解释
 */
export class DecisionEngine {
  private decisionTrees: Map<string, DecisionTreeNode[]> = new Map();
  private strategyWeights: Map<string, number> = new Map();
  private tradingSystem: TradingSystem;
  private skillSystem: SkillSystem;
  private decisionTreeOptimizer: DecisionTreeOptimizer;
  private llmService?: LLMService;
  
  private readonly config: DecisionEngineConfig;

  constructor(config: Partial<DecisionEngineConfig & { llmConfig?: LLMConfig }> = {}) {
    this.config = {
      maxAnalysisDepth: 3,
      maxAlternatives: 5,
      confidenceThreshold: 0.6,
      timeoutMs: 5000,
      cacheEnabled: true,
      learningEnabled: true,
      ...config
    };
    
    this.tradingSystem = new TradingSystem();
    this.skillSystem = new SkillSystem();
    this.decisionTreeOptimizer = new DecisionTreeOptimizer({
      maxDepth: config.maxAnalysisDepth || 3,
      adaptationRate: 0.05,
      performanceWindowSize: 100
    });

    // 初始化LLM服务（如果提供配置）
    if (config.llmConfig) {
      try {
        this.llmService = new LLMService(config.llmConfig);
      } catch (error) {
        console.warn('DecisionEngine: LLM service initialization failed:', error);
      }
    }
  }

  /**
   * 初始化决策引擎
   */
  async initialize(): Promise<void> {
    try {
      await this.loadDecisionTrees();
      this.initializeStrategyWeights();
      console.log('DecisionEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DecisionEngine:', error);
      throw error;
    }
  }

  /**
   * 做出AI决策
   */
  async makeDecision(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis,
    context?: DecisionContext
  ): Promise<AIDecision> {
    const startTime = Date.now();
    
    try {
      // 1. 获取可用动作
      const availableActions = this.getAvailableActions(aiState.id, gameState);
      
      if (availableActions.length === 0) {
        return this.createEndTurnDecision(aiState, gameState, analysis);
      }

      // 2. 评估每个动作
      const actionScores = await this.evaluateActions(
        availableActions,
        aiState,
        gameState,
        analysis
      );

      // 3. 选择最佳动作
      const bestAction = this.selectBestAction(actionScores, aiState);

      // 4. 生成替代方案
      const alternatives = this.generateAlternatives(actionScores, bestAction);

      // 5. 计算决策置信度
      const confidence = this.calculateConfidence(actionScores, bestAction, aiState);

      // 6. 生成决策推理
      const reasoning = await this.generateReasoning(bestAction, analysis, aiState, gameState);

      const decision: AIDecision = {
        action: bestAction.action,
        confidence,
        reasoning,
        alternatives,
        analysis,
        strategy: aiState.currentStrategy,
        timestamp: Date.now()
      };

      console.log(`Decision made in ${Date.now() - startTime}ms: ${bestAction.action.type} (confidence: ${confidence.toFixed(2)})`);
      return decision;

    } catch (error) {
      console.error('Failed to make decision:', error);
      return this.createFallbackDecision(aiState, gameState, analysis);
    }
  }

  /**
   * 使用优化决策树做出高级决策
   */
  async makeOptimizedDecision(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis,
    context?: DecisionContext
  ): Promise<AIDecision> {
    const startTime = Date.now();

    try {
      // 1. 获取或构建个性化决策树
      const treeId = `tree_${aiState.id}_${analysis.gamePhase.phase}`;
      let decisionTree = this.getExistingTree(treeId);
      
      if (!decisionTree) {
        const gameContext = {
          phase: analysis.gamePhase.phase,
          difficulty: 'medium', // 可以从游戏状态获取
          playerCount: gameState.players.length
        };
        decisionTree = await this.decisionTreeOptimizer.buildPersonalizedDecisionTree(
          aiState,
          gameContext
        );
      }

      // 2. 获取可用动作
      const availableActions = this.getAvailableActionsForOptimization(aiState.id, gameState);

      // 3. 使用决策树执行优化决策
      const optimizedDecision = await this.decisionTreeOptimizer.executeDecisionTree(
        decisionTree.id,
        gameState,
        analysis,
        availableActions.map(a => a.action)
      );

      // 4. 构建AI决策响应
      const decision: AIDecision = {
        action: optimizedDecision.action,
        confidence: optimizedDecision.confidence,
        reasoning: optimizedDecision.reasoning,
        alternatives: this.generateAlternativesFromTree(availableActions, optimizedDecision),
        analysis,
        strategy: aiState.currentStrategy,
        timestamp: Date.now(),
        optimizationData: {
          decisionPath: optimizedDecision.decisionPath,
          executionTime: optimizedDecision.executionTime,
          riskAssessment: optimizedDecision.riskAssessment
        }
      };

      console.log(`Optimized decision made in ${Date.now() - startTime}ms: ${optimizedDecision.action.type} (confidence: ${optimizedDecision.confidence.toFixed(2)})`);
      
      // 5. 记录决策用于后续优化
      this.recordDecisionForOptimization(decisionTree.id, decision);

      return decision;

    } catch (error) {
      console.error('Failed to make optimized decision, falling back to standard decision:', error);
      // 降级到标准决策
      return this.makeDecision(aiState, gameState, analysis, context);
    }
  }

  /**
   * 基于反馈优化决策树
   */
  async optimizeDecisionTreeFromFeedback(
    aiId: string,
    decision: AIDecision,
    actualOutcome: any,
    success: boolean
  ): Promise<void> {
    const treeId = `tree_${aiId}_${decision.analysis.gamePhase.phase}`;
    
    const feedback = {
      success,
      confidence: decision.confidence,
      actualOutcome: {
        probability: success ? 0.8 : 0.2,
        benefit: success ? 0.7 : -0.3,
        risk: success ? 0.3 : 0.7,
        timeline: 1
      }
    };

    await this.decisionTreeOptimizer.optimizeTreeBasedOnFeedback(treeId, feedback);
  }

  /**
   * 获取决策树性能分析
   */
  getDecisionTreePerformance(aiId: string, gamePhase: string) {
    const treeId = `tree_${aiId}_${gamePhase}`;
    try {
      return this.decisionTreeOptimizer.getTreePerformanceAnalysis(treeId);
    } catch (error) {
      console.warn(`No performance data available for tree: ${treeId}`);
      return null;
    }
  }

  /**
   * 分析当前游戏情况
   */
  async analyzeSituation(gameState: GameState, aiId: string): Promise<SituationAnalysis> {
    try {
      const gamePhase = this.analyzeGamePhase(gameState);
      const playerPositions = this.analyzePlayerPositions(gameState, aiId);
      const economicSituation = this.analyzeEconomicSituation(gameState, aiId);
      const threats = this.analyzeThreat(gameState, aiId);
      const opportunities = this.analyzeOpportunities(gameState, aiId);

      return {
        gamePhase,
        playerPositions,
        economicSituation,
        threats,
        opportunities
      };
    } catch (error) {
      console.error('Failed to analyze situation:', error);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    this.decisionTrees.clear();
    this.strategyWeights.clear();
  }

  // 私有方法

  /**
   * 获取可用动作
   */
  private getAvailableActions(aiId: string, gameState: GameState): ActionScore[] {
    const actions: ActionScore[] = [];
    const player = gameState.players.find(p => p.id === aiId);
    
    if (!player) return actions;

    // 基础动作
    actions.push({
      action: { type: 'end_turn', playerId: aiId, parameters: {} },
      score: 0.5,
      reasoning: 'End current turn'
    });

    // 如果是玩家回合
    if (gameState.currentPlayerIndex === gameState.players.findIndex(p => p.id === aiId)) {
      
      // 掷骰子动作
      if (gameState.phase === 'roll_dice') {
        actions.push({
          action: { type: 'roll_dice', playerId: aiId, parameters: {} },
          score: 1.0,
          reasoning: 'Roll dice to move'
        });
      }

      // 购买房产动作
      if (gameState.phase === 'property_action') {
        const position = player.position;
        if (canBuyProperty(position, player)) {
          const price = getPropertyPrice(position);
          const affordability = player.money / price;
          const score = Math.min(0.9, 0.4 + affordability * 0.3);
          
          actions.push({
            action: { 
              type: 'buy_property', 
              playerId: aiId, 
              parameters: { position } 
            },
            score,
            reasoning: `Consider buying property at position ${position} for $${price}`
          });
        }
        
        // 也提供跳过购买的选项
        actions.push({
          action: { 
            type: 'skip_purchase', 
            playerId: aiId, 
            parameters: {} 
          },
          score: 0.3,
          reasoning: 'Skip buying this property'
        });
      }
      
      // 支付租金动作
      if (gameState.phase === 'pay_rent') {
        const position = player.position;
        const { owner, rentAmount } = getRentInfo(position, player, gameState.players);
        
        if (owner && rentAmount) {
          actions.push({
            action: { 
              type: 'pay_rent', 
              playerId: aiId, 
              parameters: { amount: rentAmount, ownerId: owner.id } 
            },
            score: 1.0, // 必须支付租金
            reasoning: `Pay $${rentAmount} rent to ${owner.name}`
          });
        }
      }

      // 使用技能动作
      if (player.skills.length > 0) {
        player.skills.forEach(skill => {
          if (this.canUseSkill(skill, player, gameState)) {
            actions.push({
              action: {
                type: 'use_skill',
                playerId: aiId,
                parameters: { skillId: skill.id }
              },
              score: 0.7,
              reasoning: `Use skill: ${skill.name}`
            });
          }
        });
      }

      // 交易动作 - 评估交易机会
      if (gameState.players.length > 1) {
        const tradeOpportunities = this.tradingSystem.evaluateTradeOpportunities(
          { id: aiId } as AIState, // 临时类型转换，实际使用时会传入完整的AIState
          gameState
        );

        tradeOpportunities.forEach(opportunity => {
          if (opportunity.value > 0.4) { // 只考虑价值较高的交易机会
            actions.push({
              action: {
                type: 'trade_request',
                playerId: aiId,
                parameters: {
                  targetPlayerId: opportunity.targetPlayerId,
                  tradeType: 'initiate'
                }
              },
              score: opportunity.value * 0.8, // 交易机会的基础评分
              reasoning: `交易机会: ${opportunity.benefits.map(b => b.description).join(', ')}`
            });
          }
        });
      }
    }

    return actions;
  }

  /**
   * 评估动作分数
   */
  private async evaluateActions(
    actions: ActionScore[],
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): Promise<ActionScore[]> {
    const evaluatedActions: ActionScore[] = [];

    for (const actionScore of actions) {
      const evaluatedScore = await this.evaluateSingleAction(
        actionScore,
        aiState,
        gameState,
        analysis
      );
      evaluatedActions.push(evaluatedScore);
    }

    return evaluatedActions.sort((a, b) => b.score - a.score);
  }

  /**
   * 评估单个动作
   */
  private async evaluateSingleAction(
    actionScore: ActionScore,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): Promise<ActionScore> {
    let score = actionScore.score;
    let reasoning = actionScore.reasoning;

    const { action } = actionScore;
    const personality = aiState.personality;

    switch (action.type) {
      case 'roll_dice':
        // 掷骰子总是必要的
        score = 1.0;
        break;

      case 'buy_property':
        score = this.evaluatePropertyPurchase(action, aiState, gameState, analysis);
        reasoning = 'Property purchase evaluation based on investment strategy';
        break;

      case 'use_skill':
        score = this.evaluateSkillUsage(action, aiState, gameState, analysis);
        reasoning = 'Skill usage evaluation based on personality and situation';
        break;

      case 'trade_request':
        score = await this.evaluateTradeAction(action, aiState, gameState, analysis);
        reasoning = 'Trade opportunity evaluation based on mutual benefits and relationships';
        break;

      case 'end_turn':
        // 结束回合的基础分数
        score = 0.3;
        // 如果没有更好的选择，结束回合
        if (gameState.phase === 'wait_for_input') {
          score = 0.8;
        }
        break;

      default:
        score = 0.1;
    }

    // 根据个性调整分数
    score = this.adjustScoreByPersonality(score, action, personality);

    // 根据策略调整分数
    score = this.adjustScoreByStrategy(score, action, aiState.currentStrategy);

    // 根据游戏情况调整分数
    score = this.adjustScoreByGameSituation(score, action, analysis);

    return {
      action,
      score: Math.max(0, Math.min(1, score)), // 确保分数在0-1范围内
      reasoning
    };
  }

  /**
   * 评估房产购买
   */
  private evaluatePropertyPurchase(
    action: PlayerAction,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): number {
    const player = gameState.players.find(p => p.id === action.playerId);
    if (!player) return 0;

    const propertyId = action.parameters.propertyId;
    const property = gameState.board.find(cell => cell.id === propertyId);
    if (!property || property.type !== 'property') return 0;

    let score = 0.3; // 降低基础分数，让评估更严格

    const personality = aiState.personality;
    const strategy = aiState.currentStrategy;
    const gamePhase = analysis.gamePhase.phase;

    // 1. 财务可行性评估 (35%权重)
    const financialScore = this.evaluatePropertyFinancials(property, player, personality);
    score += financialScore * 0.35;

    // 2. 战略价值评估 (25%权重)
    const strategicScore = this.evaluatePropertyStrategy(property, player, gameState, strategy);
    score += strategicScore * 0.25;

    // 3. 市场价值评估 (20%权重)
    const marketScore = this.evaluatePropertyMarket(property, gameState, analysis);
    score += marketScore * 0.20;

    // 4. 风险评估 (10%权重)
    const riskScore = this.evaluatePropertyRisk(property, gameState, personality);
    score += riskScore * 0.10;

    // 5. 竞争态势评估 (10%权重)
    const competitionScore = this.evaluatePropertyCompetition(property, gameState, aiState.id);
    score += competitionScore * 0.10;

    // 游戏阶段调整
    score = this.adjustScoreByGamePhase(score, gamePhase, strategy);

    // 情绪状态调整
    if (aiState.emotionalState) {
      score = this.adjustScoreByEmotion(score, aiState.emotionalState, action.type);
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 评估房产财务状况
   */
  private evaluatePropertyFinancials(property: any, player: any, personality: any): number {
    if (!property.price) return 0;

    let score = 0;
    const affordabilityRatio = property.price / player.money;

    // 可负担性评估
    if (affordabilityRatio <= 0.3) {
      score += 0.8; // 非常便宜
    } else if (affordabilityRatio <= 0.5) {
      score += 0.6; // 较便宜
    } else if (affordabilityRatio <= personality.property_preference.maxInvestmentRatio) {
      score += 0.4; // 可接受
    } else if (affordabilityRatio <= 0.9) {
      score += 0.1; // 勉强可负担
    } else {
      return 0; // 无法负担
    }

    // 投资回报率评估
    const expectedROI = this.calculatePropertyROI(property, { players: [player] } as any);
    if (expectedROI > 0.25) score += 0.3;
    else if (expectedROI > 0.15) score += 0.2;
    else if (expectedROI > 0.1) score += 0.1;

    // 现金流考虑
    const remainingCash = player.money - property.price;
    if (remainingCash < 2000) score -= 0.2; // 现金流紧张
    if (remainingCash < 1000) score -= 0.3; // 现金流严重不足

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 评估房产战略价值
   */
  private evaluatePropertyStrategy(property: any, player: any, gameState: any, strategy: any): number {
    let score = 0;

    // 根据策略焦点调整
    switch (strategy.focus) {
      case 'wealth_accumulation':
        // 关注高收益房产
        if (property.rent && property.rent > 200) score += 0.4;
        break;
      case 'property_monopoly':
        // 关注形成垄断的机会
        score += this.calculateMonopolyPotential(property, player, gameState) * 0.6;
        break;
      case 'player_elimination':
        // 关注能够威胁对手的房产
        score += this.calculateEliminationPotential(property, gameState) * 0.5;
        break;
      case 'risk_minimization':
        // 关注稳定收益的房产
        score += 0.3; // 保守策略，适度投资
        break;
      case 'opportunistic':
        // 关注机会成本
        score += this.calculateOpportunityValue(property, gameState) * 0.4;
        break;
    }

    // 位置战略价值
    const locationValue = this.calculateLocationValue(property, gameState);
    score += locationValue * 0.3;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 评估房产市场价值
   */
  private evaluatePropertyMarket(property: any, gameState: any, analysis: any): number {
    let score = 0;

    // 市场趋势影响
    const marketTrends = gameState.marketTrends;
    if (marketTrends) {
      score += (marketTrends.propertyPriceMultiplier - 1) * 0.5;
      score += (marketTrends.rentMultiplier - 1) * 0.3;
    }

    // 经济环境评估
    const economicHealth = analysis.economicSituation;
    if (economicHealth && economicHealth.netWorth > 10000) {
      score += 0.2; // 经济状况良好时更积极投资
    }

    // 季节和天气影响（如果房产类型相关）
    if (gameState.season && property.zodiac) {
      // 生肖相关的季节加成
      score += this.calculateSeasonalBonus(property.zodiac, gameState.season) * 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 评估房产投资风险
   */
  private evaluatePropertyRisk(property: any, gameState: any, personality: any): number {
    let riskScore = 0.5; // 中性风险

    // 房产位置风险
    const positionRisk = this.calculatePositionRisk(property, gameState);
    riskScore -= positionRisk * 0.3;

    // 竞争风险
    const competitorCount = this.countNearbyCompetitors(property, gameState);
    riskScore -= competitorCount * 0.1;

    // 个性化风险调整
    const riskTolerance = personality.risk_tolerance || 0.5;
    if (riskTolerance > 0.7) {
      riskScore += 0.2; // 高风险承受能力
    } else if (riskTolerance < 0.3) {
      riskScore -= 0.2; // 低风险承受能力
    }

    return Math.max(0, Math.min(1, riskScore));
  }

  /**
   * 评估房产竞争态势
   */
  private evaluatePropertyCompetition(property: any, gameState: any, aiId: string): number {
    let score = 0.5;

    // 检查是否有其他玩家也对此房产感兴趣
    const competitors = gameState.players.filter((p: any) => 
      p.id !== aiId && p.money >= property.price
    );

    // 竞争者越少，购买价值越高
    const competitionLevel = competitors.length / (gameState.players.length - 1);
    score += (1 - competitionLevel) * 0.3;

    // 检查附近是否有强势玩家的房产
    const nearbyThreats = this.countNearbyThreats(property, gameState, aiId);
    score -= nearbyThreats * 0.2;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 评估技能使用
   */
  private evaluateSkillUsage(
    action: PlayerAction,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): number {
    const skillId = action.parameters.skillId;
    const aiPlayer = gameState.players.find(p => p.id === aiState.id);
    
    if (!aiPlayer) return 0;
    
    // 找到对应的技能
    const skill = aiPlayer.skills.find(s => s.id === skillId);
    if (!skill) return 0;

    // 使用SkillSystem进行详细评估
    const evaluation = this.skillSystem.evaluateSkillUsage(skill, aiState, gameState, analysis);
    
    // 返回评估分数
    return evaluation.score;
  }

  /**
   * 评估交易动作
   */
  private async evaluateTradeAction(
    action: PlayerAction,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): Promise<number> {
    const targetPlayerId = action.parameters.targetPlayerId;
    if (!targetPlayerId) return 0;

    // 获取交易机会评估
    const opportunities = this.tradingSystem.evaluateTradeOpportunities(
      aiState,
      gameState,
      targetPlayerId
    );

    if (opportunities.length === 0) return 0;

    const bestOpportunity = opportunities[0]; // 已经按价值排序
    let score = bestOpportunity.value;

    // 根据关系调整
    const relationship = aiState.memory.playerRelationships[targetPlayerId];
    if (relationship) {
      const trustMultiplier = 0.5 + relationship.trustLevel * 0.5;
      score *= trustMultiplier;
    }

    // 根据个性调整
    const personality = aiState.personality;
    if (personality.cooperation > 0.7) {
      score *= 1.2; // 高合作性更愿意交易
    } else if (personality.cooperation < 0.3) {
      score *= 0.8; // 低合作性更谨慎
    }

    // 根据策略调整
    const strategy = aiState.currentStrategy;
    switch (strategy.focus) {
      case 'wealth_accumulation':
        // 财富积累策略更看重现金交易
        if (bestOpportunity.benefits.some(b => b.type === 'cash_for_property')) {
          score *= 1.3;
        }
        break;
      case 'property_monopoly':
        // 垄断策略更看重房产交换
        if (bestOpportunity.benefits.some(b => b.type === 'monopoly_formation')) {
          score *= 1.5;
        }
        break;
      case 'risk_minimization':
        // 风险最小化策略更保守
        score *= 0.9;
        break;
    }

    // 根据情绪状态调整
    if (aiState.emotionalState) {
      switch (aiState.emotionalState.mood) {
        case 'confident':
          score *= 1.1;
          break;
        case 'desperate':
          score *= 1.4; // 绝望时更愿意尝试交易
          break;
        case 'cautious':
          score *= 0.8;
          break;
        case 'frustrated':
          score *= 0.7; // 沮丧时不太愿意合作
          break;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 根据个性调整分数
   */
  private adjustScoreByPersonality(
    score: number,
    action: PlayerAction,
    personality: any
  ): number {
    let adjustedScore = score;

    switch (action.type) {
      case 'buy_property':
        // 风险承受能力影响房产投资
        adjustedScore *= (0.5 + personality.risk_tolerance * 0.5);
        break;

      case 'use_skill':
        // 攻击性影响技能使用积极性
        if (action.parameters.skillId?.includes('aggressive')) {
          adjustedScore *= (0.3 + personality.aggression * 0.7);
        }
        break;

      case 'trade':
      case 'trade_request':
        // 合作倾向影响交易意愿
        adjustedScore *= (0.2 + personality.cooperation * 0.8);
        break;
    }

    return adjustedScore;
  }

  /**
   * 根据策略调整分数
   */
  private adjustScoreByStrategy(
    score: number,
    action: PlayerAction,
    strategy: AIStrategy
  ): number {
    let adjustedScore = score;

    const weights = strategy.weights;

    switch (action.type) {
      case 'buy_property':
        adjustedScore *= weights.propertyAcquisition;
        break;

      case 'use_skill':
        if (action.parameters.skillId?.includes('economic')) {
          adjustedScore *= weights.moneyAccumulation;
        } else if (action.parameters.skillId?.includes('aggressive')) {
          adjustedScore *= weights.playerBlockade;
        }
        break;
    }

    return adjustedScore;
  }

  /**
   * 根据游戏情况调整分数
   */
  private adjustScoreByGameSituation(
    score: number,
    action: PlayerAction,
    analysis: SituationAnalysis
  ): number {
    let adjustedScore = score;

    // 根据经济状况调整
    if (analysis.economicSituation.liquidityRatio < 0.3 && action.type === 'buy_property') {
      adjustedScore *= 0.5; // 流动性不足时减少房产购买
    }

    // 根据威胁等级调整
    const highThreat = analysis.threats.some(t => t.severity > 0.7);
    if (highThreat && action.type === 'use_skill' && action.parameters.skillId?.includes('defensive')) {
      adjustedScore *= 1.3; // 高威胁时增加防御技能使用
    }

    return adjustedScore;
  }

  /**
   * 选择最佳动作
   */
  private selectBestAction(actionScores: ActionScore[], aiState: AIState): ActionScore {
    if (actionScores.length === 0) {
      throw new Error('No actions available');
    }

    // 考虑个性中的随机性和不确定性
    const personality = aiState.personality;
    const randomnessFactor = 1 - personality.adaptability * 0.3; // 适应性越高，随机性越低

    // 使用加权随机选择，而不是总是选择最高分
    if (Math.random() < randomnessFactor && actionScores.length > 1) {
      // 从前几个最佳选择中随机选择
      const topChoices = actionScores.slice(0, Math.min(3, actionScores.length));
      const randomIndex = Math.floor(Math.random() * topChoices.length);
      return topChoices[randomIndex];
    }

    return actionScores[0]; // 返回最高分动作
  }

  /**
   * 生成替代方案
   */
  private generateAlternatives(
    actionScores: ActionScore[],
    selectedAction: ActionScore
  ): AlternativeAction[] {
    const alternatives: AlternativeAction[] = [];
    
    for (let i = 0; i < Math.min(this.config.maxAlternatives, actionScores.length); i++) {
      const actionScore = actionScores[i];
      if (actionScore !== selectedAction) {
        alternatives.push({
          action: actionScore.action,
          score: actionScore.score,
          reasoning: actionScore.reasoning
        });
      }
    }

    return alternatives;
  }

  /**
   * 计算决策置信度
   */
  private calculateConfidence(
    actionScores: ActionScore[],
    selectedAction: ActionScore,
    aiState: AIState
  ): number {
    if (actionScores.length === 0) return 0;

    let confidence = selectedAction.score;

    // 如果最佳选择明显优于其他选择，增加置信度
    if (actionScores.length > 1) {
      const scoreDifference = selectedAction.score - actionScores[1].score;
      confidence += scoreDifference * 0.3;
    }

    // 根据个性调整置信度
    const personality = aiState.personality;
    confidence *= (0.7 + personality.adaptability * 0.3);

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 生成决策推理 - 现在支持LLM增强
   */
  private async generateReasoning(
    selectedAction: ActionScore,
    analysis: SituationAnalysis,
    aiState: AIState,
    gameState: GameState
  ): Promise<string> {
    // 构建基础决策对象
    const decision: AIDecision = {
      action: selectedAction.action,
      confidence: selectedAction.score,
      reasoning: selectedAction.reasoning,
      alternatives: [],
      analysis,
      strategy: aiState.currentStrategy,
      timestamp: Date.now()
    };

    // 如果有LLM服务，使用它生成详细推理
    if (this.llmService) {
      try {
        const detailedReasoning = await this.llmService.generateDecisionReasoning(
          aiState,
          decision,
          gameState,
          analysis
        );

        console.log(`✨ LLM决策推理生成成功 (${aiState.id}): ${selectedAction.action.type}`);
        return detailedReasoning.fullExplanation;
      } catch (error) {
        console.warn(`LLM决策推理生成失败 (${aiState.id}):`, error);
      }
    }

    // 后备方案：传统推理生成
    return this.generateTraditionalReasoning(selectedAction, analysis, aiState);
  }

  /**
   * 传统推理生成（后备方案）
   */
  private generateTraditionalReasoning(
    selectedAction: ActionScore,
    analysis: SituationAnalysis,
    aiState: AIState
  ): string {
    const baseReasoning = selectedAction.reasoning;
    const gamePhase = analysis.gamePhase.phase;
    const economicSituation = analysis.economicSituation;
    const personality = aiState.personality;

    let reasoning = baseReasoning;

    // 添加情境信息
    reasoning += ` 当前游戏处于${gamePhase}阶段`;
    
    if (economicSituation.moneyRank <= 2) {
      reasoning += '，经济状况良好';
    } else if (economicSituation.moneyRank >= 4) {
      reasoning += '，需要改善经济状况';
    }

    // 添加个性影响
    if (personality.risk_tolerance > 0.7) {
      reasoning += '，基于积极的投资策略';
    } else if (personality.risk_tolerance < 0.3) {
      reasoning += '，基于保守的投资策略';
    }

    return reasoning;
  }

  /**
   * 生成带详细分析的决策
   */
  async makeEnhancedDecision(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis,
    context?: DecisionContext
  ): Promise<EnhancedAIDecision> {
    const baseDecision = await this.makeDecision(aiState, gameState, analysis, context);
    
    let detailedReasoning: DetailedReasoning | undefined;
    
    if (this.llmService) {
      try {
        detailedReasoning = await this.llmService.generateDecisionReasoning(
          aiState,
          baseDecision,
          gameState,
          analysis
        );
      } catch (error) {
        console.warn('Enhanced reasoning generation failed:', error);
      }
    }

    return {
      ...baseDecision,
      detailedReasoning,
      strategicAnalysis: this.generateStrategicAnalysis(baseDecision, analysis, aiState),
      riskAssessment: this.generateRiskAssessment(baseDecision, analysis, aiState),
      expectedOutcome: this.predictOutcome(baseDecision, gameState, aiState)
    };
  }

  /**
   * 创建结束回合决策
   */
  private createEndTurnDecision(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): AIDecision {
    return {
      action: { type: 'end_turn', playerId: aiState.id, parameters: {} },
      confidence: 0.8,
      reasoning: '没有其他可执行的动作，结束回合',
      alternatives: [],
      analysis,
      strategy: aiState.currentStrategy,
      timestamp: Date.now()
    };
  }

  /**
   * 创建回退决策
   */
  private createFallbackDecision(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): AIDecision {
    return {
      action: { type: 'end_turn', playerId: aiState.id, parameters: {} },
      confidence: 0.1,
      reasoning: '决策失败，采用默认动作',
      alternatives: [],
      analysis,
      strategy: aiState.currentStrategy,
      timestamp: Date.now()
    };
  }

  // 分析方法

  /**
   * 分析游戏阶段
   */
  private analyzeGamePhase(gameState: GameState): GamePhaseAnalysis {
    const totalTurns = 100; // 假设游戏总回合数
    const currentTurn = gameState.turn;
    
    let phase: 'early' | 'middle' | 'late';
    if (currentTurn < totalTurns * 0.3) {
      phase = 'early';
    } else if (currentTurn < totalTurns * 0.7) {
      phase = 'middle';  
    } else {
      phase = 'late';
    }

    return {
      phase,
      turnsRemaining: totalTurns - currentTurn,
      winProbability: 1 / gameState.players.length, // 简单估算
      strategicFocus: this.getStrategicFocusForPhase(phase)
    };
  }

  /**
   * 分析玩家位置
   */
  private analyzePlayerPositions(gameState: GameState, aiId: string): PlayerPositionAnalysis[] {
    return gameState.players.map(player => {
      const netWorth = this.calculatePlayerNetWorth(player, gameState);
      const rank = this.calculatePlayerRank(player, gameState);
      
      return {
        playerId: player.id,
        rankPosition: rank,
        threat: player.id !== aiId ? this.calculateThreatLevel(player, gameState) : 0,
        alliance: 0, // 暂时设为0，后续可以添加联盟分析
        predictedMoves: [] // 暂时为空，后续可以添加行为预测
      };
    });
  }

  /**
   * 分析经济情况
   */
  private analyzeEconomicSituation(gameState: GameState, aiId: string): EconomicAnalysis {
    const player = gameState.players.find(p => p.id === aiId);
    if (!player) {
      throw new Error(`Player ${aiId} not found`);
    }

    const propertyValue = this.calculatePlayerPropertyValue(player, gameState);
    const netWorth = player.money + propertyValue;
    const liquidityRatio = player.money / Math.max(netWorth, 1);

    return {
      cashFlow: player.money,
      netWorth,
      liquidityRatio,
      propertyValue,
      moneyRank: this.calculateMoneyRank(player, gameState),
      propertyRank: this.calculatePropertyRank(player, gameState)
    };
  }

  /**
   * 分析威胁
   */
  private analyzeThreat(gameState: GameState, aiId: string): ThreatAnalysis[] {
    const threats: ThreatAnalysis[] = [];
    
    gameState.players.forEach(player => {
      if (player.id !== aiId) {
        const threatLevel = this.calculateThreatLevel(player, gameState);
        
        if (threatLevel > 0.5) {
          threats.push({
            source: player.id,
            type: 'economic',
            severity: threatLevel,
            probability: 0.7,
            mitigation: ['增强防御', '寻求合作']
          });
        }
      }
    });

    return threats;
  }

  /**
   * 分析机会
   */
  private analyzeOpportunities(gameState: GameState, aiId: string): OpportunityAnalysis[] {
    const opportunities: OpportunityAnalysis[] = [];
    
    // 寻找可购买的优质房产
    gameState.board.forEach(cell => {
      if (cell.type === 'property' && !cell.ownerId) {
        const value = this.calculatePropertyValue(cell, gameState);
        if (value > 0.6) {
          opportunities.push({
            type: 'property_purchase',
            value,
            probability: 0.8,
            requirements: [`资金: ${cell.price}元`],
            timeWindow: 5
          });
        }
      }
    });

    return opportunities;
  }

  // 辅助计算方法

  private canUseSkill(skill: any, player: Player, gameState: GameState): boolean {
    // 简单的技能可用性检查
    return skill.cooldownRemaining <= 0;
  }

  private calculatePropertyROI(property: any, gameState: GameState): number {
    // 简单的ROI计算
    const expectedRent = property.price * 0.1; // 假设年租金为房价的10%
    return expectedRent / property.price;
  }

  private calculateStrategicValue(property: any, player: Player, gameState: GameState): number {
    // 计算房产的战略价值
    let value = 0;
    
    // 如果玩家已经拥有同类型房产，增加价值
    const sameTypeProperties = player.properties.filter(p => 
      gameState.board.find(cell => cell.id === p)?.subType === property.subType
    );
    
    value += sameTypeProperties.length * 0.1;
    
    return Math.min(value, 1);
  }

  private calculatePlayerNetWorth(player: Player, gameState: GameState): number {
    const propertyValue = this.calculatePlayerPropertyValue(player, gameState);
    return player.money + propertyValue;
  }

  private calculatePlayerPropertyValue(player: Player, gameState: GameState): number {
    return player.properties.reduce((total, propertyId) => {
      const property = gameState.board.find(cell => cell.id === propertyId);
      return total + (property?.price || 0);
    }, 0);
  }

  private calculatePlayerRank(player: Player, gameState: GameState): number {
    const players = gameState.players.slice().sort((a, b) => 
      this.calculatePlayerNetWorth(b, gameState) - this.calculatePlayerNetWorth(a, gameState)
    );
    return players.findIndex(p => p.id === player.id) + 1;
  }

  private calculateThreatLevel(player: Player, gameState: GameState): number {
    const netWorth = this.calculatePlayerNetWorth(player, gameState);
    const avgNetWorth = gameState.players.reduce((sum, p) => 
      sum + this.calculatePlayerNetWorth(p, gameState), 0
    ) / gameState.players.length;
    
    return Math.min(netWorth / avgNetWorth / 2, 1);
  }

  private calculateMoneyRank(player: Player, gameState: GameState): number {
    const players = gameState.players.slice().sort((a, b) => b.money - a.money);
    return players.findIndex(p => p.id === player.id) + 1;
  }

  private calculatePropertyRank(player: Player, gameState: GameState): number {
    const players = gameState.players.slice().sort((a, b) => 
      b.properties.length - a.properties.length
    );
    return players.findIndex(p => p.id === player.id) + 1;
  }

  private calculatePropertyValue(property: any, gameState: GameState): number {
    // 简单的房产价值评估
    return Math.random() * 0.8 + 0.2; // 返回0.2-1.0的随机值
  }

  /**
   * 计算垄断潜力
   */
  private calculateMonopolyPotential(property: any, player: any, gameState: any): number {
    const sameTypeCount = player.properties.filter((propId: string) => {
      const prop = gameState.board.find((cell: any) => cell.id === propId);
      return prop && prop.subType === property.subType;
    }).length;

    const totalSameType = gameState.board.filter((cell: any) => 
      cell.type === 'property' && cell.subType === property.subType
    ).length;

    return totalSameType > 0 ? (sameTypeCount + 1) / totalSameType : 0;
  }

  /**
   * 计算消除对手的潜力
   */
  private calculateEliminationPotential(property: any, gameState: any): number {
    // 评估此房产对其他玩家造成财务压力的潜力
    const rent = property.rent || 0;
    const averageMoney = gameState.players.reduce((sum: number, p: any) => sum + p.money, 0) / gameState.players.length;
    return Math.min(rent / averageMoney, 1);
  }

  /**
   * 计算机会价值
   */
  private calculateOpportunityValue(property: any, gameState: any): number {
    // 评估当前购买机会的稀缺性
    const availableProperties = gameState.board.filter((cell: any) => 
      cell.type === 'property' && !cell.ownerId
    ).length;
    
    const totalProperties = gameState.board.filter((cell: any) => cell.type === 'property').length;
    return totalProperties > 0 ? 1 - (availableProperties / totalProperties) : 0;
  }

  /**
   * 计算位置价值
   */
  private calculateLocationValue(property: any, gameState: any): number {
    // 根据房产在棋盘上的位置评估价值
    const position = property.position;
    const boardSize = gameState.board.length;
    
    // 角落和中心位置通常更有价值
    const distanceFromCenter = Math.abs(position - boardSize / 2);
    const normalizedDistance = distanceFromCenter / (boardSize / 2);
    
    return 1 - normalizedDistance * 0.5; // 距离中心越近价值越高
  }

  /**
   * 计算季节性加成
   */
  private calculateSeasonalBonus(zodiac: string, season: string): number {
    // 简化的生肖季节匹配
    const seasonalMatches: Record<string, string[]> = {
      '春': ['虎', '兔', '龙'],
      '夏': ['蛇', '马', '羊'],
      '秋': ['猴', '鸡', '狗'],
      '冬': ['猪', '鼠', '牛']
    };
    
    return seasonalMatches[season]?.includes(zodiac) ? 0.2 : 0;
  }

  /**
   * 计算位置风险
   */
  private calculatePositionRisk(property: any, gameState: any): number {
    // 评估房产位置的风险（如靠近监狱等）
    const riskPositions = [10, 20, 30]; // 假设的高风险位置
    const position = property.position;
    
    const minDistance = Math.min(...riskPositions.map(rp => Math.abs(position - rp)));
    return Math.max(0, (5 - minDistance) / 5); // 距离风险位置越近风险越高
  }

  /**
   * 计算附近竞争者数量
   */
  private countNearbyCompetitors(property: any, gameState: any): number {
    const position = property.position;
    const range = 3; // 检查周围3个位置
    
    let count = 0;
    for (let i = -range; i <= range; i++) {
      const checkPosition = (position + i + gameState.board.length) % gameState.board.length;
      const nearbyCell = gameState.board[checkPosition];
      
      if (nearbyCell && nearbyCell.type === 'property' && nearbyCell.ownerId) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * 计算附近威胁数量
   */
  private countNearbyThreats(property: any, gameState: any, aiId: string): number {
    const position = property.position;
    const range = 5; // 检查周围5个位置
    
    let threats = 0;
    for (let i = -range; i <= range; i++) {
      const checkPosition = (position + i + gameState.board.length) % gameState.board.length;
      const nearbyCell = gameState.board[checkPosition];
      
      if (nearbyCell && nearbyCell.type === 'property' && nearbyCell.ownerId && nearbyCell.ownerId !== aiId) {
        const owner = gameState.players.find((p: any) => p.id === nearbyCell.ownerId);
        if (owner && this.calculateThreatLevel(owner, gameState) > 0.5) {
          threats++;
        }
      }
    }
    
    return threats;
  }

  /**
   * 根据游戏阶段调整分数
   */
  private adjustScoreByGamePhase(score: number, phase: string, strategy: any): number {
    let adjustedScore = score;
    
    switch (phase) {
      case 'early':
        // 早期游戏，积极投资
        if (strategy.focus === 'wealth_accumulation') adjustedScore *= 1.2;
        break;
      case 'middle':
        // 中期游戏，平衡策略
        adjustedScore *= 1.0;
        break;
      case 'late':
        // 后期游戏，谨慎投资
        if (strategy.focus === 'risk_minimization') adjustedScore *= 1.1;
        else adjustedScore *= 0.9;
        break;
    }
    
    return adjustedScore;
  }

  /**
   * 根据情绪状态调整分数
   */
  private adjustScoreByEmotion(score: number, emotionalState: any, actionType: string): number {
    let adjustedScore = score;
    const mood = emotionalState.mood;
    const confidence = emotionalState.confidence || 0.5;
    const excitement = emotionalState.excitement || 0;
    
    if (actionType === 'buy_property') {
      switch (mood) {
        case 'confident':
          adjustedScore *= (1 + confidence * 0.3);
          break;
        case 'excited':
          adjustedScore *= (1 + excitement * 0.4);
          break;
        case 'frustrated':
          adjustedScore *= 0.8; // 沮丧时不太愿意投资
          break;
        case 'cautious':
          adjustedScore *= 0.9; // 谨慎时投资更保守
          break;
        case 'desperate':
          adjustedScore *= 1.3; // 绝望时可能冒险
          break;
      }
    }
    
    return adjustedScore;
  }

  private getStrategicFocusForPhase(phase: 'early' | 'middle' | 'late') {
    switch (phase) {
      case 'early':
        return ['wealth_accumulation', 'property_monopoly'];
      case 'middle':
        return ['property_monopoly', 'player_elimination'];
      case 'late':
        return ['player_elimination', 'risk_minimization'];
    }
  }

  /**
   * 加载决策树
   */
  private async loadDecisionTrees(): Promise<void> {
    // 这里可以从文件或数据库加载预定义的决策树
    // 目前使用简单的内存初始化
    this.decisionTrees.set('default', []);
  }

  /**
   * 初始化策略权重
   */
  private initializeStrategyWeights(): void {
    this.strategyWeights.set('wealth_accumulation', 1.0);
    this.strategyWeights.set('property_monopoly', 0.8);
    this.strategyWeights.set('player_elimination', 0.6);
    this.strategyWeights.set('risk_minimization', 0.9);
    this.strategyWeights.set('opportunistic', 0.7);
  }

  // 决策树优化相关的辅助方法

  /**
   * 获取现有决策树
   */
  private getExistingTree(treeId: string): any {
    // 简化实现：返回null，实际应该从缓存或存储中获取
    return null;
  }

  /**
   * 获取可用动作用于优化
   */
  private getAvailableActionsForOptimization(aiId: string, gameState: GameState): ActionScore[] {
    // 重用现有的getAvailableActions方法
    return this.getAvailableActions(aiId, gameState);
  }

  /**
   * 从决策树生成替代方案
   */
  private generateAlternativesFromTree(availableActions: ActionScore[], optimizedDecision: any): AlternativeAction[] {
    // 从可用动作中生成替代方案，排除已选择的动作
    return availableActions
      .filter(a => a.action.type !== optimizedDecision.action.type)
      .slice(0, 3)
      .map(a => ({
        action: a.action,
        score: a.score,
        reasoning: a.reasoning,
        confidence: a.score * 0.8
      }));
  }

  /**
   * 记录决策用于后续优化
   */
  private recordDecisionForOptimization(treeId: string, decision: AIDecision): void {
    // 记录决策数据供后续分析和优化使用
    console.log(`Recording decision for optimization - Tree: ${treeId}, Action: ${decision.action.type}, Confidence: ${decision.confidence}`);
    // 实际实现应该将数据存储到持久化存储中
  }

  /**
   * 生成策略分析
   */
  private generateStrategicAnalysis(
    decision: AIDecision,
    analysis: SituationAnalysis,
    aiState: AIState
  ): StrategicAnalysis {
    return {
      shortTermGoals: this.identifyShortTermGoals(decision, aiState),
      longTermStrategy: this.identifyLongTermStrategy(aiState),
      strategicAlignment: this.calculateStrategicAlignment(decision, aiState),
      adaptationNeeded: this.assessAdaptationNeed(analysis, aiState)
    };
  }

  /**
   * 生成风险评估
   */
  private generateRiskAssessment(
    decision: AIDecision,
    analysis: SituationAnalysis,
    aiState: AIState
  ): RiskAssessment {
    return {
      overallRisk: this.calculateOverallRisk(decision, analysis),
      specificRisks: this.identifySpecificRisks(decision, analysis),
      mitigationStrategies: this.suggestMitigationStrategies(decision, analysis),
      riskTolerance: aiState.personality.risk_tolerance
    };
  }

  /**
   * 预测决策结果
   */
  private predictOutcome(
    decision: AIDecision,
    gameState: GameState,
    aiState: AIState
  ): OutcomePrediction {
    return {
      expectedBenefit: this.calculateExpectedBenefit(decision, gameState, aiState),
      probabilityOfSuccess: this.calculateSuccessProbability(decision, gameState, aiState),
      potentialConsequences: this.identifyPotentialConsequences(decision, gameState),
      timeframe: this.estimateTimeframe(decision)
    };
  }

  // 辅助方法

  private identifyShortTermGoals(decision: AIDecision, aiState: AIState): string[] {
    return [`完成${decision.action.type}`, '维持经济稳定', '观察对手反应'];
  }

  private identifyLongTermStrategy(aiState: AIState): string {
    const strategy = aiState.currentStrategy.focus;
    const strategyMap = {
      wealth_accumulation: '财富积累策略',
      property_monopoly: '房产垄断策略',
      player_elimination: '玩家淘汰策略',
      risk_minimization: '风险最小化策略',
      opportunistic: '机会主义策略'
    };
    return strategyMap[strategy] || '平衡发展策略';
  }

  private calculateStrategicAlignment(decision: AIDecision, aiState: AIState): number {
    // 简化的策略对齐度计算
    return 0.8; // 暂时固定值
  }

  private assessAdaptationNeed(analysis: SituationAnalysis, aiState: AIState): boolean {
    // 根据威胁和机会评估是否需要策略调整
    return analysis.threats.length > analysis.opportunities.length;
  }

  private calculateOverallRisk(decision: AIDecision, analysis: SituationAnalysis): number {
    // 基于决策置信度和游戏状况计算整体风险
    const confidenceRisk = 1 - decision.confidence;
    const threatRisk = analysis.threats.length * 0.1;
    return Math.min(1, confidenceRisk + threatRisk);
  }

  private identifySpecificRisks(decision: AIDecision, analysis: SituationAnalysis): string[] {
    const risks = [];
    
    if (decision.confidence < 0.6) {
      risks.push('决策不确定性较高');
    }
    
    if (analysis.threats.length > 2) {
      risks.push('面临多重威胁');
    }
    
    if (analysis.economicSituation.liquidityRatio < 0.3) {
      risks.push('流动性不足');
    }

    return risks;
  }

  private suggestMitigationStrategies(decision: AIDecision, analysis: SituationAnalysis): string[] {
    return ['制定后备计划', '密切监控市场变化', '保持足够现金流'];
  }

  private calculateExpectedBenefit(decision: AIDecision, gameState: GameState, aiState: AIState): number {
    // 简化的收益计算
    return decision.confidence * 0.7; // 基于置信度
  }

  private calculateSuccessProbability(decision: AIDecision, gameState: GameState, aiState: AIState): number {
    return decision.confidence; // 简化为置信度
  }

  private identifyPotentialConsequences(decision: AIDecision, gameState: GameState): string[] {
    return ['改变资源分配', '影响玩家关系', '调整游戏平衡'];
  }

  private estimateTimeframe(decision: AIDecision): string {
    const actionTypes = {
      'buy_property': '立即生效',
      'sell_property': '立即生效',
      'trade': '需要对方同意',
      'skill_use': '立即生效',
      'end_turn': '立即生效'
    };
    return actionTypes[decision.action.type] || '1-2回合';
  }

}

// 配置接口
interface DecisionEngineConfig {
  maxAnalysisDepth: number;
  maxAlternatives: number;
  confidenceThreshold: number;
  timeoutMs: number;
  cacheEnabled: boolean;
  learningEnabled: boolean;
}

// 动作评分接口
interface ActionScore {
  action: PlayerAction;
  score: number;
  reasoning: string;
}

// 增强AI决策接口
export interface EnhancedAIDecision extends AIDecision {
  detailedReasoning?: DetailedReasoning;
  strategicAnalysis: StrategicAnalysis;
  riskAssessment: RiskAssessment;
  expectedOutcome: OutcomePrediction;
}

// 策略分析接口
export interface StrategicAnalysis {
  shortTermGoals: string[];
  longTermStrategy: string;
  strategicAlignment: number;
  adaptationNeeded: boolean;
}

// 风险评估接口
export interface RiskAssessment {
  overallRisk: number;
  specificRisks: string[];
  mitigationStrategies: string[];
  riskTolerance: number;
}

// 结果预测接口
export interface OutcomePrediction {
  expectedBenefit: number;
  probabilityOfSuccess: number;
  potentialConsequences: string[];
  timeframe: string;
}