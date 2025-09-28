/**
 * 交易和抵押系统管理器 - 统一的交易和抵押功能入口
 * 
 * 整合增强交易系统、抵押系统和AI交易系统，提供统一的管理接口
 */

import type {
  GameState,
  Player,
  TradeOffer,
  PropertyCell,
  ActionResult,
  PlayerAction
} from '../types/game';

import { EnhancedTradingSystem, TradeMarket, Auction, MarketAnalysis } from './EnhancedTradingSystem';
import { MortgageSystem, MortgageContract, MortgageApplication, MortgageSystemStats } from './MortgageSystem';
import { TradingSystem } from '../ai/TradingSystem';

export interface TradingSession {
  id: string;
  participants: string[];
  startTime: number;
  endTime?: number;
  trades: TradeOffer[];
  mortgages: MortgageContract[];
  status: 'active' | 'completed' | 'cancelled';
}

export interface FinancialSummary {
  playerId: string;
  totalAssets: number;
  liquidAssets: number;
  propertyValue: number;
  mortgageDebt: number;
  netWorth: number;
  creditRating: string;
  tradingVolume: number;
  profitLoss: number;
}

export interface MarketActivity {
  activeOffers: number;
  completedTrades: number;
  auctionsActive: number;
  mortgagesActive: number;
  totalTradingVolume: number;
  averageTradeSize: number;
}

/**
 * 交易和抵押系统的统一管理器
 */
export class TradingAndMortgageManager {
  private enhancedTradingSystem: EnhancedTradingSystem;
  private mortgageSystem: MortgageSystem;
  private aiTradingSystem: TradingSystem;
  private sessions: Map<string, TradingSession> = new Map();
  private nextSessionId = 1;

  constructor() {
    this.enhancedTradingSystem = new EnhancedTradingSystem();
    this.mortgageSystem = new MortgageSystem();
    this.aiTradingSystem = new TradingSystem();
  }

  /**
   * 初始化交易系统
   */
  initialize(gameState: GameState): ActionResult {
    try {
      // 创建默认交易市场
      this.enhancedTradingSystem.createMarket(
        '十二生肖交易所',
        '专门的生肖房产和道具交易市场',
        'open',
        {
          tradingFee: 0.015, // 1.5% 交易费
          minimumTradeValue: 500,
          maxActiveOffersPerPlayer: 8
        }
      );

      return {
        success: true,
        message: '交易和抵押系统初始化成功',
        effects: [{
          type: 'status',
          target: 'player',
          value: 1,
          description: '交易系统已激活'
        }]
      };
    } catch (error) {
      return {
        success: false,
        message: `初始化失败: ${error instanceof Error ? error.message : '未知错误'}`,
        effects: []
      };
    }
  }

  /**
   * 创建交易会话
   */
  createTradingSession(participants: string[]): TradingSession {
    const session: TradingSession = {
      id: `session_${this.nextSessionId++}`,
      participants,
      startTime: Date.now(),
      trades: [],
      mortgages: [],
      status: 'active'
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * 玩家发起交易提案
   */
  initiatePlayerTrade(
    fromPlayerId: string,
    toPlayerId: string,
    offeredItems: any[],
    requestedItems: any[],
    gameState: GameState
  ): ActionResult {
    try {
      // 验证玩家存在
      const fromPlayer = gameState.players.find(p => p.id === fromPlayerId);
      const toPlayer = gameState.players.find(p => p.id === toPlayerId);
      
      if (!fromPlayer || !toPlayer) {
        return { success: false, message: '玩家不存在', effects: [] };
      }

      // 验证玩家拥有报价的物品
      const validationResult = this.validatePlayerAssets(fromPlayer, offeredItems, gameState);
      if (!validationResult.success) {
        return validationResult;
      }

      // 创建交易报价
      const tradeOffer: TradeOffer = {
        id: `player_trade_${Date.now()}`,
        fromPlayerId,
        toPlayerId,
        timestamp: Date.now(),
        offeredItems,
        requestedItems,
        status: 'pending',
        negotiations: [],
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24小时过期
      };

      // 发布到市场
      const marketResult = this.enhancedTradingSystem.publishTradeOffer('market_1', tradeOffer);
      
      if (marketResult.success) {
        return {
          success: true,
          message: `交易提案已发送给 ${toPlayer.name}`,
          effects: [{
            type: 'status',
            target: 'player',
            value: 1,
            description: '发起交易提案'
          }]
        };
      }

      return marketResult;
    } catch (error) {
      return {
        success: false,
        message: `交易创建失败: ${error instanceof Error ? error.message : '未知错误'}`,
        effects: []
      };
    }
  }

  /**
   * AI智能交易建议
   */
  getAITradeRecommendations(
    playerId: string,
    gameState: GameState
  ): TradeRecommendation[] {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return [];

    // 创建AI状态（简化版）
    const aiState = this.createAIStateFromPlayer(player, gameState);
    
    // 获取AI交易机会
    const opportunities = this.aiTradingSystem.evaluateTradeOpportunities(aiState, gameState);
    
    // 转换为推荐格式
    return opportunities.map(opp => ({
      type: 'ai_trade',
      targetPlayerId: opp.targetPlayerId,
      confidence: opp.value,
      reasoning: `AI分析: ${opp.benefits.map(b => b.description).join(', ')}`,
      urgency: opp.urgency,
      expectedProfit: this.calculateExpectedProfit(opp, gameState)
    }));
  }

  /**
   * 申请房产抵押
   */
  applyForMortgage(
    playerId: string,
    propertyId: string,
    requestedAmount: number,
    gameState: GameState
  ): ActionResult {
    try {
      const application = this.mortgageSystem.createMortgageApplication(
        playerId,
        propertyId,
        requestedAmount,
        gameState
      );

      // 自动评估和决定
      if (application.riskAssessment.level === 'critical') {
        return {
          success: false,
          message: '抵押申请被拒绝：风险过高',
          effects: []
        };
      }

      // 调整条件并批准
      const adjustedAmount = Math.min(requestedAmount, application.recommendedAmount);
      const duration = this.calculateMortgageDuration(application.creditRating.level);
      
      const contract = this.mortgageSystem.approveMortgage(
        { ...application, requestedAmount: adjustedAmount },
        duration
      );

      // 执行抵押
      return this.mortgageSystem.mortgageProperty(
        playerId,
        propertyId,
        adjustedAmount,
        duration,
        gameState
      );
    } catch (error) {
      return {
        success: false,
        message: `抵押申请失败: ${error instanceof Error ? error.message : '未知错误'}`,
        effects: []
      };
    }
  }

  /**
   * 创建房产拍卖
   */
  createPropertyAuction(
    auctioneerId: string,
    propertyId: string,
    startingBid: number,
    duration: number,
    gameState: GameState,
    options?: {
      reservePrice?: number;
      buyoutPrice?: number;
    }
  ): ActionResult {
    try {
      const player = gameState.players.find(p => p.id === auctioneerId);
      if (!player) {
        return { success: false, message: '玩家不存在', effects: [] };
      }

      if (!player.properties.includes(propertyId)) {
        return { success: false, message: '玩家不拥有该房产', effects: [] };
      }

      const auction = this.enhancedTradingSystem.createAuction(
        propertyId,
        'property',
        auctioneerId,
        startingBid,
        duration,
        options
      );

      return {
        success: true,
        message: `房产拍卖已创建，拍卖ID: ${auction.id}`,
        effects: [{
          type: 'status',
          target: 'player',
          value: 1,
          description: '创建房产拍卖'
        }]
      };
    } catch (error) {
      return {
        success: false,
        message: `拍卖创建失败: ${error instanceof Error ? error.message : '未知错误'}`,
        effects: []
      };
    }
  }

  /**
   * 获取玩家财务摘要
   */
  getPlayerFinancialSummary(playerId: string, gameState: GameState): FinancialSummary {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }

    // 计算房产价值
    const propertyValue = this.calculatePlayerPropertyValue(player, gameState);
    
    // 计算抵押债务
    const mortgageDebt = this.calculatePlayerMortgageDebt(playerId);
    
    // 计算交易量和盈亏
    const tradingStats = this.calculatePlayerTradingStats(playerId);
    
    // 获取信用评级
    const creditApplication = this.mortgageSystem.createMortgageApplication(
      playerId,
      player.properties[0] || 'dummy',
      1000,
      gameState
    );

    return {
      playerId,
      totalAssets: player.money + propertyValue,
      liquidAssets: player.money,
      propertyValue,
      mortgageDebt,
      netWorth: player.money + propertyValue - mortgageDebt,
      creditRating: creditApplication.creditRating.level,
      tradingVolume: tradingStats.volume,
      profitLoss: tradingStats.profitLoss
    };
  }

  /**
   * 获取市场活动摘要
   */
  getMarketActivity(): MarketActivity {
    const markets = this.getAllMarkets();
    const auctions = this.enhancedTradingSystem.getActiveAuctions();
    const mortgageStats = this.mortgageSystem.getSystemStatistics();

    const totalOffers = markets.reduce((sum, market) => sum + market.activeOffers.length, 0);
    const totalTrades = markets.reduce((sum, market) => sum + market.completedTrades.length, 0);
    const totalVolume = markets.reduce((sum, market) => 
      sum + market.completedTrades.reduce((vol, trade) => vol + trade.totalValue, 0), 0
    );

    return {
      activeOffers: totalOffers,
      completedTrades: totalTrades,
      auctionsActive: auctions.length,
      mortgagesActive: mortgageStats.activeContracts,
      totalTradingVolume: totalVolume,
      averageTradeSize: totalTrades > 0 ? totalVolume / totalTrades : 0
    };
  }

  /**
   * 获取完整的市场分析
   */
  getCompleteMarketAnalysis(gameState: GameState): CompleteMarketAnalysis {
    const marketAnalysis = this.enhancedTradingSystem.getMarketAnalysis(gameState);
    const mortgageStats = this.mortgageSystem.getSystemStatistics();
    const marketActivity = this.getMarketActivity();

    return {
      ...marketAnalysis,
      mortgageMarket: {
        totalContracts: mortgageStats.totalContracts,
        averageInterestRate: mortgageStats.averageInterestRate,
        defaultRate: mortgageStats.defaultRate,
        totalDebt: mortgageStats.totalOutstandingDebt
      },
      activity: marketActivity,
      riskIndicators: this.calculateMarketRiskIndicators(gameState)
    };
  }

  /**
   * 处理定期系统更新
   */
  processPeriodicUpdate(gameState: GameState): ActionResult[] {
    const results: ActionResult[] = [];

    // 处理过期的交易报价
    const expiredOffers = this.processExpiredOffers();
    results.push(...expiredOffers);

    // 处理到期的拍卖
    const auctionResults = this.processExpiredAuctions();
    results.push(...auctionResults);

    // 处理抵押利息计算
    const mortgageUpdates = this.processMortgageUpdates(gameState);
    results.push(...mortgageUpdates);

    return results;
  }

  // 私有辅助方法

  private validatePlayerAssets(player: Player, offeredItems: any[], gameState: GameState): ActionResult {
    for (const item of offeredItems) {
      switch (item.type) {
        case 'money':
          if (player.money < (item.amount || 0)) {
            return { success: false, message: '资金不足', effects: [] };
          }
          break;
        case 'property':
          if (!player.properties.includes(item.id)) {
            return { success: false, message: '不拥有该房产', effects: [] };
          }
          break;
        case 'item':
          const hasItem = player.items.some(playerItem => playerItem.id === item.id);
          if (!hasItem) {
            return { success: false, message: '不拥有该道具', effects: [] };
          }
          break;
      }
    }
    return { success: true, message: '资产验证通过', effects: [] };
  }

  private createAIStateFromPlayer(player: Player, gameState: GameState): any {
    // 简化的AI状态创建，实际应该更完整
    return {
      id: player.id,
      personality: {
        risk_tolerance: 0.5,
        cooperation: 0.7,
        negotiation_style: { style: 'cooperative', concessionRate: 0.3 }
      },
      currentStrategy: { focus: 'wealth_accumulation' },
      memory: { playerRelationships: {} },
      emotionalState: { mood: 'neutral' }
    };
  }

  private calculateExpectedProfit(opportunity: any, gameState: GameState): number {
    // 简化的利润计算
    return opportunity.value * 1000; // 基于机会价值估算
  }

  private calculateMortgageDuration(creditLevel: string): number {
    switch (creditLevel) {
      case 'excellent': return 60;
      case 'good': return 45;
      case 'fair': return 30;
      case 'poor': return 20;
      case 'bad': return 15;
      default: return 30;
    }
  }

  private calculatePlayerPropertyValue(player: Player, gameState: GameState): number {
    return player.properties.reduce((total, propertyId) => {
      const property = gameState.board.find(cell => cell.id === propertyId) as PropertyCell;
      return total + (property?.price || 0);
    }, 0);
  }

  private calculatePlayerMortgageDebt(playerId: string): number {
    const mortgages = this.mortgageSystem.getPlayerMortgages(playerId);
    return mortgages.reduce((total, mortgage) => total + mortgage.currentDebt, 0);
  }

  private calculatePlayerTradingStats(playerId: string): { volume: number; profitLoss: number } {
    const tradeHistory = this.enhancedTradingSystem.getPlayerTradeHistory(playerId);
    const volume = tradeHistory.reduce((sum, trade) => sum + trade.totalValue, 0);
    
    // 简化的盈亏计算
    const profitLoss = tradeHistory.length * 100; // 假设每笔交易平均盈利100
    
    return { volume, profitLoss };
  }

  private getAllMarkets(): TradeMarket[] {
    // 这里应该从EnhancedTradingSystem获取所有市场
    // 由于访问限制，返回空数组
    return [];
  }

  private calculateMarketRiskIndicators(gameState: GameState): MarketRiskIndicators {
    const mortgageStats = this.mortgageSystem.getSystemStatistics();
    
    return {
      systemicRisk: mortgageStats.defaultRate > 0.1 ? 'high' : 'low',
      liquidityRisk: 'medium', // 基于市场活动计算
      creditRisk: mortgageStats.averageInterestRate > 0.1 ? 'high' : 'medium',
      marketVolatility: 'low' // 基于价格波动计算
    };
  }

  private processExpiredOffers(): ActionResult[] {
    // 处理过期报价的逻辑
    return [];
  }

  private processExpiredAuctions(): ActionResult[] {
    const results: ActionResult[] = [];
    const auctions = this.enhancedTradingSystem.getActiveAuctions();
    const now = Date.now();

    auctions.forEach(auction => {
      if (auction.endTime <= now) {
        const result = this.enhancedTradingSystem.finalizeAuction(auction.id);
        results.push(result);
      }
    });

    return results;
  }

  private processMortgageUpdates(gameState: GameState): ActionResult[] {
    // 处理抵押更新的逻辑
    return [];
  }
}

// 辅助接口定义
export interface TradeRecommendation {
  type: string;
  targetPlayerId?: string;
  confidence: number;
  reasoning: string;
  urgency?: number;
  expectedProfit?: number;
}

export interface CompleteMarketAnalysis extends MarketAnalysis {
  mortgageMarket: {
    totalContracts: number;
    averageInterestRate: number;
    defaultRate: number;
    totalDebt: number;
  };
  activity: MarketActivity;
  riskIndicators: MarketRiskIndicators;
}

export interface MarketRiskIndicators {
  systemicRisk: 'low' | 'medium' | 'high';
  liquidityRisk: 'low' | 'medium' | 'high';
  creditRisk: 'low' | 'medium' | 'high';
  marketVolatility: 'low' | 'medium' | 'high';
}