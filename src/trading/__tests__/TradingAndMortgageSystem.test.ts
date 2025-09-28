/**
 * 交易和抵押系统综合测试
 * Comprehensive tests for Trading and Mortgage systems
 */

import {
  TradingAndMortgageManager,
  MortgageSystem,
  EnhancedTradingSystem,
  TradingSystemFactory
} from '../index';

import type {
  GameState,
  Player,
  PropertyCell,
  TradeItem
} from '../../types/game';

describe('交易和抵押系统测试', () => {
  let manager: TradingAndMortgageManager;
  let gameState: GameState;
  let testPlayer1: Player;
  let testPlayer2: Player;
  let testProperty: PropertyCell;

  beforeEach(() => {
    manager = TradingSystemFactory.getManager();
    
    // 创建测试用的游戏状态
    testPlayer1 = {
      id: 'player1',
      name: '测试玩家1',
      zodiac: '龙',
      money: 50000,
      position: 0,
      properties: ['prop1', 'prop2'],
      items: [],
      skills: [],
      statusEffects: [],
      statistics: {
        turnsPlayed: 10,
        moneyEarned: 60000,
        moneySpent: 10000,
        propertiesBought: 2,
        propertiesSold: 0,
        skillsUsed: 5,
        eventsTriggered: 3,
        rentCollected: 5000,
        rentPaid: 2000
      }
    };

    testPlayer2 = {
      id: 'player2',
      name: '测试玩家2',
      zodiac: '虎',
      money: 30000,
      position: 5,
      properties: ['prop3'],
      items: [],
      skills: [],
      statusEffects: [],
      statistics: {
        turnsPlayed: 10,
        moneyEarned: 40000,
        moneySpent: 10000,
        propertiesBought: 1,
        propertiesSold: 0,
        skillsUsed: 3,
        eventsTriggered: 2,
        rentCollected: 3000,
        rentPaid: 1500
      }
    };

    testProperty = {
      id: 'prop1',
      name: '龙府豪宅',
      type: 'property',
      position: 3,
      price: 20000,
      rent: 2000,
      owner: 'player1',
      color: 'blue',
      upgrades: []
    };

    gameState = {
      gameId: 'test-game',
      currentPlayerId: 'player1',
      players: [testPlayer1, testPlayer2],
      board: [testProperty],
      turn: 15,
      phase: 'playing',
      dice: { values: [3, 4], total: 7 },
      lastAction: null,
      events: [],
      marketTrends: {
        propertyPriceMultiplier: 1.1,
        rentMultiplier: 1.0,
        salaryBonus: 1000,
        taxRate: 0.05,
        skillCooldownModifier: 0.9
      }
    };
  });

  afterEach(() => {
    TradingSystemFactory.resetManager();
  });

  describe('系统初始化测试', () => {
    test('应该能成功初始化交易系统', () => {
      const result = manager.initialize(gameState);
      expect(result.success).toBe(true);
      expect(result.message).toContain('初始化成功');
    });

    test('应该能创建交易会话', () => {
      const session = manager.createTradingSession(['player1', 'player2']);
      expect(session.id).toBeDefined();
      expect(session.participants).toEqual(['player1', 'player2']);
      expect(session.status).toBe('active');
    });
  });

  describe('玩家交易测试', () => {
    beforeEach(() => {
      manager.initialize(gameState);
    });

    test('应该能发起玩家间交易', () => {
      const offeredItems: TradeItem[] = [
        {
          type: 'money',
          amount: 5000,
          description: '现金报价',
          value: 5000
        }
      ];

      const requestedItems: TradeItem[] = [
        {
          type: 'property',
          id: 'prop3',
          description: '请求房产',
          value: 15000
        }
      ];

      const result = manager.initiatePlayerTrade(
        'player1',
        'player2',
        offeredItems,
        requestedItems,
        gameState
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('交易提案已发送');
    });

    test('应该拒绝资金不足的交易', () => {
      const offeredItems: TradeItem[] = [
        {
          type: 'money',
          amount: 100000, // 超过玩家资金
          description: '现金报价',
          value: 100000
        }
      ];

      const requestedItems: TradeItem[] = [
        {
          type: 'property',
          id: 'prop3',
          description: '请求房产',
          value: 15000
        }
      ];

      const result = manager.initiatePlayerTrade(
        'player1',
        'player2',
        offeredItems,
        requestedItems,
        gameState
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('资金不足');
    });

    test('应该拒绝不拥有的房产交易', () => {
      const offeredItems: TradeItem[] = [
        {
          type: 'property',
          id: 'prop3', // 玩家1不拥有
          description: '房产报价',
          value: 15000
        }
      ];

      const requestedItems: TradeItem[] = [
        {
          type: 'money',
          amount: 10000,
          description: '请求现金',
          value: 10000
        }
      ];

      const result = manager.initiatePlayerTrade(
        'player1',
        'player2',
        offeredItems,
        requestedItems,
        gameState
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('不拥有该房产');
    });
  });

  describe('AI交易建议测试', () => {
    beforeEach(() => {
      manager.initialize(gameState);
    });

    test('应该能获取AI交易建议', () => {
      const recommendations = manager.getAITradeRecommendations('player1', gameState);
      expect(Array.isArray(recommendations)).toBe(true);
    });

    test('AI建议应该包含必要的信息', () => {
      const recommendations = manager.getAITradeRecommendations('player1', gameState);
      
      if (recommendations.length > 0) {
        const recommendation = recommendations[0];
        expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
        expect(recommendation.confidence).toBeLessThanOrEqual(1);
        expect(recommendation.reasoning).toBeDefined();
        expect(recommendation.type).toBeDefined();
      }
    });
  });

  describe('抵押系统测试', () => {
    beforeEach(() => {
      manager.initialize(gameState);
    });

    test('应该能申请房产抵押', () => {
      const result = manager.applyForMortgage(
        'player1',
        'prop1',
        15000,
        gameState
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('抵押');
    });

    test('应该拒绝过高的抵押金额', () => {
      const result = manager.applyForMortgage(
        'player1',
        'prop1',
        50000, // 远超房产价值
        gameState
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('超过最大抵押额度');
    });

    test('应该拒绝不拥有的房产抵押', () => {
      const result = manager.applyForMortgage(
        'player1',
        'prop3', // 玩家1不拥有
        10000,
        gameState
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('不拥有此房产');
    });
  });

  describe('拍卖系统测试', () => {
    beforeEach(() => {
      manager.initialize(gameState);
    });

    test('应该能创建房产拍卖', () => {
      const result = manager.createPropertyAuction(
        'player1',
        'prop1',
        10000,
        24 * 60 * 60 * 1000, // 24小时
        gameState,
        {
          reservePrice: 15000,
          buyoutPrice: 25000
        }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('拍卖已创建');
    });

    test('应该拒绝不拥有房产的拍卖', () => {
      const result = manager.createPropertyAuction(
        'player1',
        'prop3', // 玩家1不拥有
        10000,
        24 * 60 * 60 * 1000,
        gameState
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('不拥有该房产');
    });
  });

  describe('财务分析测试', () => {
    beforeEach(() => {
      manager.initialize(gameState);
    });

    test('应该能获取玩家财务摘要', () => {
      const summary = manager.getPlayerFinancialSummary('player1', gameState);
      
      expect(summary.playerId).toBe('player1');
      expect(summary.liquidAssets).toBe(testPlayer1.money);
      expect(summary.totalAssets).toBeGreaterThan(summary.liquidAssets);
      expect(summary.netWorth).toBeDefined();
      expect(summary.creditRating).toBeDefined();
    });

    test('应该能获取市场活动摘要', () => {
      const activity = manager.getMarketActivity();
      
      expect(activity.activeOffers).toBeGreaterThanOrEqual(0);
      expect(activity.completedTrades).toBeGreaterThanOrEqual(0);
      expect(activity.auctionsActive).toBeGreaterThanOrEqual(0);
      expect(activity.mortgagesActive).toBeGreaterThanOrEqual(0);
      expect(activity.totalTradingVolume).toBeGreaterThanOrEqual(0);
    });

    test('应该能获取完整市场分析', () => {
      const analysis = manager.getCompleteMarketAnalysis(gameState);
      
      expect(analysis.propertyPrices).toBeDefined();
      expect(analysis.itemPrices).toBeDefined();
      expect(analysis.marketTrends).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.mortgageMarket).toBeDefined();
      expect(analysis.activity).toBeDefined();
      expect(analysis.riskIndicators).toBeDefined();
    });
  });

  describe('系统集成测试', () => {
    beforeEach(() => {
      manager.initialize(gameState);
    });

    test('应该能处理定期系统更新', () => {
      const results = manager.processPeriodicUpdate(gameState);
      expect(Array.isArray(results)).toBe(true);
    });

    test('抵押和交易应该能协同工作', async () => {
      // 先抵押房产获得资金
      const mortgageResult = manager.applyForMortgage(
        'player2',
        'prop3',
        10000,
        gameState
      );
      
      expect(mortgageResult.success).toBe(true);
      
      // 更新玩家资金（模拟抵押成功）
      testPlayer2.money += 10000;
      
      // 然后用资金进行交易
      const tradeResult = manager.initiatePlayerTrade(
        'player2',
        'player1',
        [{ type: 'money', amount: 15000, description: '现金报价', value: 15000 }],
        [{ type: 'property', id: 'prop2', description: '请求房产', value: 18000 }],
        gameState
      );
      
      expect(tradeResult.success).toBe(true);
    });
  });

  describe('错误处理测试', () => {
    test('应该处理不存在的玩家', () => {
      const result = manager.initiatePlayerTrade(
        'nonexistent',
        'player2',
        [],
        [],
        gameState
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('玩家不存在');
    });

    test('应该处理获取不存在玩家的财务摘要', () => {
      expect(() => {
        manager.getPlayerFinancialSummary('nonexistent', gameState);
      }).toThrow('玩家不存在');
    });
  });

  describe('工厂模式测试', () => {
    test('应该能创建独立的抵押系统', () => {
      const mortgageSystem = TradingSystemFactory.createMortgageSystem();
      expect(mortgageSystem).toBeInstanceOf(MortgageSystem);
    });

    test('应该能创建独立的增强交易系统', () => {
      const tradingSystem = TradingSystemFactory.createEnhancedTradingSystem();
      expect(tradingSystem).toBeInstanceOf(EnhancedTradingSystem);
    });

    test('管理器应该是单例模式', () => {
      const manager1 = TradingSystemFactory.getManager();
      const manager2 = TradingSystemFactory.getManager();
      expect(manager1).toBe(manager2);
    });

    test('应该能重置管理器', () => {
      const manager1 = TradingSystemFactory.getManager();
      TradingSystemFactory.resetManager();
      const manager2 = TradingSystemFactory.getManager();
      expect(manager1).not.toBe(manager2);
    });
  });
});