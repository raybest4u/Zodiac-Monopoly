/**
 * 交易和抵押系统统一导出
 * Trading and Mortgage System Unified Exports
 */

// 核心系统
export { MortgageSystem } from './MortgageSystem';
export { EnhancedTradingSystem } from './EnhancedTradingSystem';
export { TradingAndMortgageManager } from './TradingAndMortgageManager';

// 抵押系统类型
export type {
  MortgageContract,
  MortgagePayment,
  MortgageTerms,
  MortgageOffer,
  MortgageApplication,
  CreditRating,
  RiskAssessment,
  PaymentHistoryRecord,
  MortgageSystemStats,
  MortgageStatus,
  RiskLevel
} from './MortgageSystem';

// 增强交易系统类型
export type {
  TradeMarket,
  Auction,
  AuctionBid,
  CompletedTrade,
  PriceHistory,
  MarketAnalysis,
  PropertyMarketData,
  ItemMarketData,
  MarketTrendData,
  TradeRecommendation as MarketTradeRecommendation,
  MarketType,
  AuctionStatus,
  TradingHours
} from './EnhancedTradingSystem';

// 统一管理器类型
export type {
  TradingSession,
  FinancialSummary,
  MarketActivity,
  TradeRecommendation,
  CompleteMarketAnalysis,
  MarketRiskIndicators
} from './TradingAndMortgageManager';

/**
 * 便捷的工厂函数
 */
export class TradingSystemFactory {
  private static managerInstance: TradingAndMortgageManager | null = null;

  /**
   * 获取交易和抵押管理器单例
   */
  static getManager(): TradingAndMortgageManager {
    if (!this.managerInstance) {
      this.managerInstance = new TradingAndMortgageManager();
    }
    return this.managerInstance;
  }

  /**
   * 创建独立的抵押系统
   */
  static createMortgageSystem(): MortgageSystem {
    return new MortgageSystem();
  }

  /**
   * 创建独立的增强交易系统
   */
  static createEnhancedTradingSystem(): EnhancedTradingSystem {
    return new EnhancedTradingSystem();
  }

  /**
   * 重置管理器（主要用于测试）
   */
  static resetManager(): void {
    this.managerInstance = null;
  }
}

/**
 * 默认导出
 */
export default TradingSystemFactory;