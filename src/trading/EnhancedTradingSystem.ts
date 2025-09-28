/**
 * 增强交易系统 - 基于现有AI交易系统的扩展
 * 
 * 提供玩家间交易、拍卖、市场分析等高级交易功能
 */

import type {
  GameState,
  Player,
  TradeOffer,
  TradeItem,
  TradeNegotiation,
  TradeChange,
  PropertyCell,
  ActionResult,
  GameEffect
} from '../types/game';

import { TradingSystem } from '../ai/TradingSystem';

export interface TradeMarket {
  id: string;
  name: string;
  description: string;
  
  // 市场状态
  isActive: boolean;
  marketType: MarketType;
  tradingHours: TradingHours;
  
  // 市场参与者
  participants: string[]; // 玩家ID列表
  
  // 市场数据
  activeOffers: TradeOffer[];
  completedTrades: CompletedTrade[];
  priceHistory: PriceHistory[];
  
  // 市场规则
  tradingFee: number;
  minimumTradeValue: number;
  maxActiveOffersPerPlayer: number;
  offerExpiration: number; // 默认报价过期时间
}

export interface Auction {
  id: string;
  itemId: string;
  itemType: 'property' | 'item' | 'skill_usage';
  auctioneerId: string;
  
  // 拍卖条件
  startingBid: number;
  reservePrice?: number;
  buyoutPrice?: number;
  
  // 拍卖状态
  currentBid: number;
  currentBidder?: string;
  bidHistory: AuctionBid[];
  
  // 时间控制
  startTime: number;
  endTime: number;
  autoExtension: boolean; // 最后时刻出价自动延长
  
  status: AuctionStatus;
}

export interface AuctionBid {
  id: string;
  bidderId: string;
  amount: number;
  timestamp: number;
  isAutoBid: boolean; // 自动出价
  maxAmount?: number; // 自动出价的最高金额
}

export interface CompletedTrade {
  id: string;
  originalOfferId: string;
  participants: string[];
  timestamp: number;
  totalValue: number;
  tradedItems: TradeItem[];
  tradingFee: number;
}

export interface PriceHistory {
  itemId: string;
  itemType: string;
  price: number;
  timestamp: number;
  tradeId: string;
}

export interface MarketAnalysis {
  propertyPrices: Map<string, PropertyMarketData>;
  itemPrices: Map<string, ItemMarketData>;
  marketTrends: MarketTrendData;
  recommendations: TradeRecommendation[];
}

export interface PropertyMarketData {
  propertyId: string;
  currentValue: number;
  averagePrice: number;
  priceChange24h: number;
  priceChange7d: number;
  tradingVolume: number;
  lastTradePrice?: number;
  lastTradeTime?: number;
}

export interface ItemMarketData {
  itemType: string;
  averagePrice: number;
  priceRange: { min: number; max: number };
  demandLevel: 'low' | 'medium' | 'high';
  supplyLevel: 'low' | 'medium' | 'high';
  tradingVolume: number;
}

export interface MarketTrendData {
  overallDirection: 'bullish' | 'bearish' | 'neutral';
  volatility: number;
  liquidityIndex: number;
  activeTraders: number;
  averageTradeSize: number;
}

export interface TradeRecommendation {
  type: 'buy' | 'sell' | 'hold';
  targetItem: string;
  confidence: number;
  reasoning: string;
  suggestedPrice?: number;
  timeFrame: 'immediate' | 'short_term' | 'long_term';
}

export type MarketType = 'open' | 'auction_only' | 'private' | 'guild';
export type AuctionStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'failed';

export interface TradingHours {
  isAlwaysOpen: boolean;
  openHours?: { start: number; end: number }; // 小时制，如 9-17
  timeZone?: string;
}

/**
 * 增强交易系统管理器
 */
export class EnhancedTradingSystem extends TradingSystem {
  private markets: Map<string, TradeMarket> = new Map();
  private auctions: Map<string, Auction> = new Map();
  private nextMarketId = 1;
  private nextAuctionId = 1;
  private priceHistory: PriceHistory[] = [];

  constructor() {
    super();
    this.initializeDefaultMarket();
  }

  /**
   * 创建交易市场
   */
  createMarket(
    name: string,
    description: string,
    marketType: MarketType = 'open',
    config?: Partial<TradeMarket>
  ): TradeMarket {
    const market: TradeMarket = {
      id: `market_${this.nextMarketId++}`,
      name,
      description,
      isActive: true,
      marketType,
      tradingHours: { isAlwaysOpen: true },
      participants: [],
      activeOffers: [],
      completedTrades: [],
      priceHistory: [],
      tradingFee: 0.02, // 2% 交易费
      minimumTradeValue: 500,
      maxActiveOffersPerPlayer: 5,
      offerExpiration: 7 * 24 * 60 * 60 * 1000, // 7天
      ...config
    };

    this.markets.set(market.id, market);
    return market;
  }

  /**
   * 在市场中发布交易报价
   */
  publishTradeOffer(
    marketId: string,
    offer: Omit<TradeOffer, 'id' | 'timestamp' | 'status' | 'negotiations'>
  ): ActionResult {
    const market = this.markets.get(marketId);
    if (!market) {
      return { success: false, message: '市场不存在', effects: [] };
    }

    if (!market.isActive) {
      return { success: false, message: '市场已关闭', effects: [] };
    }

    // 检查交易时间
    if (!this.isMarketOpen(market)) {
      return { success: false, message: '市场未开放', effects: [] };
    }

    // 检查玩家报价数量限制
    const playerOffers = market.activeOffers.filter(o => o.fromPlayerId === offer.fromPlayerId);
    if (playerOffers.length >= market.maxActiveOffersPerPlayer) {
      return { success: false, message: '超过最大报价数量限制', effects: [] };
    }

    // 计算交易价值
    const tradeValue = this.calculateTradeValue(offer.offeredItems);
    if (tradeValue < market.minimumTradeValue) {
      return { 
        success: false, 
        message: `交易价值不足，最低需要 ${market.minimumTradeValue}`, 
        effects: [] 
      };
    }

    // 创建完整的交易报价
    const completeOffer: TradeOffer = {
      ...offer,
      id: `market_offer_${Date.now()}_${offer.fromPlayerId}`,
      timestamp: Date.now(),
      status: 'pending',
      negotiations: [],
      expiresAt: Date.now() + market.offerExpiration
    };

    // 添加到市场
    market.activeOffers.push(completeOffer);
    
    // 添加玩家到市场参与者列表
    if (!market.participants.includes(offer.fromPlayerId)) {
      market.participants.push(offer.fromPlayerId);
    }

    return {
      success: true,
      message: `交易报价已发布到市场 ${market.name}`,
      effects: [{
        type: 'status',
        target: 'player',
        value: 1,
        description: '发布交易报价'
      }]
    };
  }

  /**
   * 接受市场中的交易报价
   */
  acceptMarketOffer(
    marketId: string,
    offerId: string,
    accepterId: string,
    gameState: GameState
  ): ActionResult {
    const market = this.markets.get(marketId);
    if (!market) {
      return { success: false, message: '市场不存在', effects: [] };
    }

    const offerIndex = market.activeOffers.findIndex(o => o.id === offerId);
    if (offerIndex === -1) {
      return { success: false, message: '交易报价不存在', effects: [] };
    }

    const offer = market.activeOffers[offerIndex];
    
    // 检查报价是否过期
    if (offer.expiresAt && Date.now() > offer.expiresAt) {
      market.activeOffers.splice(offerIndex, 1);
      return { success: false, message: '交易报价已过期', effects: [] };
    }

    // 检查是否是报价者自己
    if (offer.fromPlayerId === accepterId) {
      return { success: false, message: '不能接受自己的报价', effects: [] };
    }

    // 验证交易可行性
    const validation = this.validateTradeExecution(offer, accepterId, gameState);
    if (!validation.success) {
      return validation;
    }

    // 执行交易
    const executionResult = this.executeMarketTrade(market, offer, accepterId, gameState);
    
    if (executionResult.success) {
      // 从市场移除已完成的报价
      market.activeOffers.splice(offerIndex, 1);
    }

    return executionResult;
  }

  /**
   * 创建拍卖
   */
  createAuction(
    itemId: string,
    itemType: 'property' | 'item' | 'skill_usage',
    auctioneerId: string,
    startingBid: number,
    duration: number,
    options?: {
      reservePrice?: number;
      buyoutPrice?: number;
      autoExtension?: boolean;
    }
  ): Auction {
    const auction: Auction = {
      id: `auction_${this.nextAuctionId++}`,
      itemId,
      itemType,
      auctioneerId,
      startingBid,
      reservePrice: options?.reservePrice,
      buyoutPrice: options?.buyoutPrice,
      currentBid: startingBid,
      bidHistory: [],
      startTime: Date.now(),
      endTime: Date.now() + duration,
      autoExtension: options?.autoExtension || false,
      status: 'active'
    };

    this.auctions.set(auction.id, auction);
    return auction;
  }

  /**
   * 参与拍卖出价
   */
  placeBid(
    auctionId: string,
    bidderId: string,
    bidAmount: number,
    isAutoBid: boolean = false,
    maxAmount?: number
  ): ActionResult {
    const auction = this.auctions.get(auctionId);
    if (!auction) {
      return { success: false, message: '拍卖不存在', effects: [] };
    }

    if (auction.status !== 'active') {
      return { success: false, message: '拍卖已结束', effects: [] };
    }

    if (Date.now() > auction.endTime) {
      this.finalizeAuction(auctionId);
      return { success: false, message: '拍卖时间已结束', effects: [] };
    }

    if (bidAmount <= auction.currentBid) {
      return { 
        success: false, 
        message: `出价必须高于当前价格 ${auction.currentBid}`, 
        effects: [] 
      };
    }

    if (auction.auctioneerId === bidderId) {
      return { success: false, message: '不能对自己的拍卖出价', effects: [] };
    }

    // 检查一口价
    if (auction.buyoutPrice && bidAmount >= auction.buyoutPrice) {
      return this.executeBuyout(auction, bidderId);
    }

    // 创建出价记录
    const bid: AuctionBid = {
      id: `bid_${Date.now()}`,
      bidderId,
      amount: bidAmount,
      timestamp: Date.now(),
      isAutoBid,
      maxAmount
    };

    auction.bidHistory.push(bid);
    auction.currentBid = bidAmount;
    auction.currentBidder = bidderId;

    // 自动延长拍卖时间
    if (auction.autoExtension && (auction.endTime - Date.now()) < 300000) { // 最后5分钟
      auction.endTime += 300000; // 延长5分钟
    }

    return {
      success: true,
      message: `成功出价 ${bidAmount}`,
      effects: [{
        type: 'status',
        target: 'player',
        value: 1,
        description: '参与拍卖出价'
      }]
    };
  }

  /**
   * 获取市场分析
   */
  getMarketAnalysis(gameState: GameState): MarketAnalysis {
    const propertyPrices = this.analyzePropertyPrices(gameState);
    const itemPrices = this.analyzeItemPrices();
    const marketTrends = this.analyzeMarketTrends();
    const recommendations = this.generateTradeRecommendations(gameState, propertyPrices, itemPrices);

    return {
      propertyPrices,
      itemPrices,
      marketTrends,
      recommendations
    };
  }

  /**
   * 获取玩家交易历史
   */
  getPlayerTradeHistory(playerId: string): CompletedTrade[] {
    const allTrades: CompletedTrade[] = [];
    
    for (const market of this.markets.values()) {
      const playerTrades = market.completedTrades.filter(trade => 
        trade.participants.includes(playerId)
      );
      allTrades.push(...playerTrades);
    }
    
    return allTrades.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取活跃的拍卖列表
   */
  getActiveAuctions(): Auction[] {
    const now = Date.now();
    return Array.from(this.auctions.values())
      .filter(auction => auction.status === 'active' && auction.endTime > now)
      .sort((a, b) => a.endTime - b.endTime);
  }

  /**
   * 处理拍卖结算
   */
  finalizeAuction(auctionId: string): ActionResult {
    const auction = this.auctions.get(auctionId);
    if (!auction) {
      return { success: false, message: '拍卖不存在', effects: [] };
    }

    if (auction.status !== 'active') {
      return { success: false, message: '拍卖已处理', effects: [] };
    }

    // 检查是否达到保留价
    if (auction.reservePrice && auction.currentBid < auction.reservePrice) {
      auction.status = 'failed';
      return {
        success: false,
        message: '未达到保留价，拍卖失败',
        effects: []
      };
    }

    // 检查是否有出价者
    if (!auction.currentBidder) {
      auction.status = 'failed';
      return {
        success: false,
        message: '无人出价，拍卖失败',
        effects: []
      };
    }

    auction.status = 'completed';
    
    const effects: GameEffect[] = [
      {
        type: 'money',
        target: 'player',
        value: auction.currentBid,
        description: `拍卖收入 ${auction.currentBid}`
      }
    ];

    return {
      success: true,
      message: `拍卖成功，成交价 ${auction.currentBid}`,
      effects
    };
  }

  // 私有辅助方法

  private initializeDefaultMarket(): void {
    this.createMarket(
      '中央交易所',
      '主要的房产和物品交易市场',
      'open',
      {
        tradingFee: 0.01,
        minimumTradeValue: 1000,
        maxActiveOffersPerPlayer: 10
      }
    );
  }

  private isMarketOpen(market: TradeMarket): boolean {
    if (market.tradingHours.isAlwaysOpen) {
      return true;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = market.tradingHours.openHours || { start: 0, end: 24 };
    
    return currentHour >= start && currentHour < end;
  }

  private calculateTradeValue(items: TradeItem[]): number {
    return items.reduce((total, item) => total + item.value, 0);
  }

  private validateTradeExecution(
    offer: TradeOffer,
    accepterId: string,
    gameState: GameState
  ): ActionResult {
    const accepter = gameState.players.find(p => p.id === accepterId);
    const offerer = gameState.players.find(p => p.id === offer.fromPlayerId);
    
    if (!accepter || !offerer) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    // 检查接受者是否有足够资源提供请求的物品
    for (const item of offer.requestedItems) {
      if (item.type === 'money' && accepter.money < (item.amount || 0)) {
        return { success: false, message: '接受者资金不足', effects: [] };
      }
      if (item.type === 'property' && !accepter.properties.includes(item.id || '')) {
        return { success: false, message: '接受者不拥有该房产', effects: [] };
      }
    }

    // 检查提供者是否仍有足够资源提供报价的物品
    for (const item of offer.offeredItems) {
      if (item.type === 'money' && offerer.money < (item.amount || 0)) {
        return { success: false, message: '提供者资金不足', effects: [] };
      }
      if (item.type === 'property' && !offerer.properties.includes(item.id || '')) {
        return { success: false, message: '提供者不拥有该房产', effects: [] };
      }
    }

    return { success: true, message: '交易验证通过', effects: [] };
  }

  private executeMarketTrade(
    market: TradeMarket,
    offer: TradeOffer,
    accepterId: string,
    gameState: GameState
  ): ActionResult {
    const tradeValue = this.calculateTradeValue([...offer.offeredItems, ...offer.requestedItems]);
    const tradingFee = tradeValue * market.tradingFee;
    
    // 创建完成的交易记录
    const completedTrade: CompletedTrade = {
      id: `trade_${Date.now()}`,
      originalOfferId: offer.id,
      participants: [offer.fromPlayerId, accepterId],
      timestamp: Date.now(),
      totalValue: tradeValue,
      tradedItems: [...offer.offeredItems, ...offer.requestedItems],
      tradingFee
    };

    market.completedTrades.push(completedTrade);
    
    // 记录价格历史
    this.recordPriceHistory(offer.offeredItems, completedTrade.id);
    this.recordPriceHistory(offer.requestedItems, completedTrade.id);

    const effects: GameEffect[] = [
      {
        type: 'status',
        target: 'player',
        value: 1,
        description: '完成市场交易'
      }
    ];

    // 添加交易费效果
    if (tradingFee > 0) {
      effects.push({
        type: 'money',
        target: 'player',
        value: -tradingFee / 2, // 双方各承担一半
        description: `交易费 ${tradingFee / 2}`
      });
    }

    return {
      success: true,
      message: `交易成功完成，总价值 ${tradeValue}`,
      effects
    };
  }

  private executeBuyout(auction: Auction, bidderId: string): ActionResult {
    auction.status = 'completed';
    auction.currentBid = auction.buyoutPrice!;
    auction.currentBidder = bidderId;
    
    const bid: AuctionBid = {
      id: `buyout_${Date.now()}`,
      bidderId,
      amount: auction.buyoutPrice!,
      timestamp: Date.now(),
      isAutoBid: false
    };
    
    auction.bidHistory.push(bid);

    return {
      success: true,
      message: `一口价购买成功，支付 ${auction.buyoutPrice}`,
      effects: [{
        type: 'money',
        target: 'player',
        value: -auction.buyoutPrice!,
        description: `一口价购买 ${auction.itemId}`
      }]
    };
  }

  private recordPriceHistory(items: TradeItem[], tradeId: string): void {
    const timestamp = Date.now();
    
    items.forEach(item => {
      this.priceHistory.push({
        itemId: item.id || item.type,
        itemType: item.type,
        price: item.value,
        timestamp,
        tradeId
      });
    });
    
    // 保持历史记录在合理范围内
    if (this.priceHistory.length > 1000) {
      this.priceHistory = this.priceHistory.slice(-500);
    }
  }

  private analyzePropertyPrices(gameState: GameState): Map<string, PropertyMarketData> {
    const propertyData = new Map<string, PropertyMarketData>();
    
    // 分析棋盘上的每个房产
    gameState.board.forEach(cell => {
      if (cell.type === 'property') {
        const property = cell as PropertyCell;
        const recentTrades = this.priceHistory
          .filter(h => h.itemId === property.id && h.itemType === 'property')
          .slice(-10);
        
        const averagePrice = recentTrades.length > 0 ?
          recentTrades.reduce((sum, trade) => sum + trade.price, 0) / recentTrades.length :
          property.price || 0;
        
        const lastTrade = recentTrades[recentTrades.length - 1];
        const priceChange24h = this.calculatePriceChange(recentTrades, 24 * 60 * 60 * 1000);
        const priceChange7d = this.calculatePriceChange(recentTrades, 7 * 24 * 60 * 60 * 1000);
        
        propertyData.set(property.id, {
          propertyId: property.id,
          currentValue: property.price || 0,
          averagePrice,
          priceChange24h,
          priceChange7d,
          tradingVolume: recentTrades.length,
          lastTradePrice: lastTrade?.price,
          lastTradeTime: lastTrade?.timestamp
        });
      }
    });
    
    return propertyData;
  }

  private analyzeItemPrices(): Map<string, ItemMarketData> {
    const itemData = new Map<string, ItemMarketData>();
    const itemTypes = ['consumable', 'permanent', 'equipment'];
    
    itemTypes.forEach(itemType => {
      const recentTrades = this.priceHistory
        .filter(h => h.itemType === itemType)
        .slice(-50);
      
      if (recentTrades.length === 0) return;
      
      const prices = recentTrades.map(trade => trade.price);
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      itemData.set(itemType, {
        itemType,
        averagePrice,
        priceRange: { min: minPrice, max: maxPrice },
        demandLevel: this.calculateDemandLevel(recentTrades),
        supplyLevel: this.calculateSupplyLevel(recentTrades),
        tradingVolume: recentTrades.length
      });
    });
    
    return itemData;
  }

  private analyzeMarketTrends(): MarketTrendData {
    const recentTrades = this.priceHistory.slice(-100);
    const totalVolume = recentTrades.length;
    
    if (totalVolume === 0) {
      return {
        overallDirection: 'neutral',
        volatility: 0,
        liquidityIndex: 0,
        activeTraders: 0,
        averageTradeSize: 0
      };
    }
    
    const averageTradeSize = recentTrades.reduce((sum, trade) => sum + trade.price, 0) / totalVolume;
    const volatility = this.calculateVolatility(recentTrades);
    const direction = this.calculateMarketDirection(recentTrades);
    
    return {
      overallDirection: direction,
      volatility,
      liquidityIndex: Math.min(totalVolume / 50, 1), // 标准化到0-1
      activeTraders: new Set(recentTrades.map(t => t.tradeId)).size,
      averageTradeSize
    };
  }

  private generateTradeRecommendations(
    gameState: GameState,
    propertyPrices: Map<string, PropertyMarketData>,
    itemPrices: Map<string, ItemMarketData>
  ): TradeRecommendation[] {
    const recommendations: TradeRecommendation[] = [];
    
    // 房产推荐
    propertyPrices.forEach((data, propertyId) => {
      if (data.priceChange7d < -0.1) { // 价格下跌超过10%
        recommendations.push({
          type: 'buy',
          targetItem: propertyId,
          confidence: 0.7,
          reasoning: '房产价格近期下跌，可能是购买良机',
          suggestedPrice: data.averagePrice * 0.9,
          timeFrame: 'short_term'
        });
      } else if (data.priceChange7d > 0.2) { // 价格上涨超过20%
        recommendations.push({
          type: 'sell',
          targetItem: propertyId,
          confidence: 0.8,
          reasoning: '房产价格大幅上涨，建议获利了结',
          suggestedPrice: data.currentValue * 1.1,
          timeFrame: 'immediate'
        });
      }
    });
    
    // 物品推荐
    itemPrices.forEach((data, itemType) => {
      if (data.demandLevel === 'high' && data.supplyLevel === 'low') {
        recommendations.push({
          type: 'sell',
          targetItem: itemType,
          confidence: 0.9,
          reasoning: '供不应求，价格看涨',
          timeFrame: 'immediate'
        });
      }
    });
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  private calculatePriceChange(trades: PriceHistory[], timeWindow: number): number {
    const now = Date.now();
    const oldTrades = trades.filter(t => now - t.timestamp > timeWindow);
    const newTrades = trades.filter(t => now - t.timestamp <= timeWindow);
    
    if (oldTrades.length === 0 || newTrades.length === 0) return 0;
    
    const oldAvg = oldTrades.reduce((sum, t) => sum + t.price, 0) / oldTrades.length;
    const newAvg = newTrades.reduce((sum, t) => sum + t.price, 0) / newTrades.length;
    
    return (newAvg - oldAvg) / oldAvg;
  }

  private calculateDemandLevel(trades: PriceHistory[]): 'low' | 'medium' | 'high' {
    const recentVolume = trades.filter(t => Date.now() - t.timestamp < 24 * 60 * 60 * 1000).length;
    if (recentVolume > 10) return 'high';
    if (recentVolume > 5) return 'medium';
    return 'low';
  }

  private calculateSupplyLevel(trades: PriceHistory[]): 'low' | 'medium' | 'high' {
    // 简化的供应量计算，实际应该基于市场上的活跃报价
    const avgPrice = trades.reduce((sum, t) => sum + t.price, 0) / trades.length;
    const recentAvg = trades.slice(-5).reduce((sum, t) => sum + t.price, 0) / Math.min(5, trades.length);
    
    const priceRatio = recentAvg / avgPrice;
    if (priceRatio > 1.1) return 'low'; // 价格上涨，供应不足
    if (priceRatio < 0.9) return 'high'; // 价格下跌，供应充足
    return 'medium';
  }

  private calculateVolatility(trades: PriceHistory[]): number {
    if (trades.length < 2) return 0;
    
    const prices = trades.map(t => t.price);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    
    return Math.sqrt(variance) / mean; // 变异系数
  }

  private calculateMarketDirection(trades: PriceHistory[]): 'bullish' | 'bearish' | 'neutral' {
    if (trades.length < 10) return 'neutral';
    
    const firstHalf = trades.slice(0, Math.floor(trades.length / 2));
    const secondHalf = trades.slice(Math.floor(trades.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, t) => sum + t.price, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.price, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'bullish';
    if (change < -0.05) return 'bearish';
    return 'neutral';
  }
}