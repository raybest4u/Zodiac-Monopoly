/**
 * 交易和抵押系统演示
 * Trading and Mortgage System Demo
 */

import { TradingSystemFactory } from '../index';
import type { GameState, Player, PropertyCell } from '../../types/game';

/**
 * 交易和抵押系统演示类
 */
export class TradingSystemDemo {
  private manager = TradingSystemFactory.getManager();

  /**
   * 运行完整演示
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🏦 === 十二生肖大富翁 - 交易和抵押系统演示 === 🏦\n');

    try {
      // 创建演示用的游戏状态
      const gameState = this.createDemoGameState();
      
      // 初始化系统
      await this.initializeSystem(gameState);
      
      // 演示玩家交易
      await this.demonstratePlayerTrading(gameState);
      
      // 演示抵押系统
      await this.demonstrateMortgageSystem(gameState);
      
      // 演示拍卖系统
      await this.demonstrateAuctionSystem(gameState);
      
      // 演示AI交易建议
      await this.demonstrateAIRecommendations(gameState);
      
      // 演示市场分析
      await this.demonstrateMarketAnalysis(gameState);
      
      // 演示财务管理
      await this.demonstrateFinancialManagement(gameState);
      
      console.log('\n✨ 演示完成！交易和抵押系统运行正常。');
      
    } catch (error) {
      console.error('❌ 演示过程中发生错误:', error);
    }
  }

  /**
   * 创建演示用的游戏状态
   */
  private createDemoGameState(): GameState {
    const players: Player[] = [
      {
        id: 'dragon_player',
        name: '龙之商人',
        zodiac: '龙',
        money: 80000,
        position: 5,
        properties: ['dragon_palace', 'golden_tower'],
        items: [
          { id: 'lucky_coin', name: '幸运金币', type: 'consumable', effect: { type: 'money', value: 1000 } }
        ],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 20,
          moneyEarned: 100000,
          moneySpent: 20000,
          propertiesBought: 2,
          propertiesSold: 0,
          skillsUsed: 8,
          eventsTriggered: 5,
          rentCollected: 15000,
          rentPaid: 3000
        }
      },
      {
        id: 'tiger_player',
        name: '虎威大亨',
        zodiac: '虎',
        money: 45000,
        position: 12,
        properties: ['tiger_den', 'mountain_villa'],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 20,
          moneyEarned: 60000,
          moneySpent: 15000,
          propertiesBought: 2,
          propertiesSold: 0,
          skillsUsed: 6,
          eventsTriggered: 3,
          rentCollected: 8000,
          rentPaid: 4000
        }
      },
      {
        id: 'rabbit_player',
        name: '玉兔财神',
        zodiac: '兔',
        money: 35000,
        position: 18,
        properties: ['moon_palace'],
        items: [
          { id: 'wisdom_scroll', name: '智慧卷轴', type: 'permanent', effect: { type: 'skill_cooldown', value: -1 } }
        ],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 20,
          moneyEarned: 50000,
          moneySpent: 15000,
          propertiesBought: 1,
          propertiesSold: 0,
          skillsUsed: 4,
          eventsTriggered: 2,
          rentCollected: 5000,
          rentPaid: 6000
        }
      }
    ];

    const board: PropertyCell[] = [
      {
        id: 'dragon_palace',
        name: '龙宫',
        type: 'property',
        position: 3,
        price: 35000,
        rent: 3500,
        owner: 'dragon_player',
        color: 'gold',
        upgrades: [
          { id: 'luxury_garden', name: '豪华花园', level: 1, cost: 5000, rentBonus: 500 }
        ]
      },
      {
        id: 'golden_tower',
        name: '黄金塔',
        type: 'property',
        position: 8,
        price: 28000,
        rent: 2800,
        owner: 'dragon_player',
        color: 'gold',
        upgrades: []
      },
      {
        id: 'tiger_den',
        name: '虎穴',
        type: 'property',
        position: 15,
        price: 25000,
        rent: 2500,
        owner: 'tiger_player',
        color: 'orange',
        upgrades: []
      },
      {
        id: 'mountain_villa',
        name: '山间别墅',
        type: 'property',
        position: 22,
        price: 22000,
        rent: 2200,
        owner: 'tiger_player',
        color: 'orange',
        upgrades: []
      },
      {
        id: 'moon_palace',
        name: '月宫',
        type: 'property',
        position: 28,
        price: 30000,
        rent: 3000,
        owner: 'rabbit_player',
        color: 'silver',
        upgrades: []
      }
    ];

    return {
      gameId: 'trading_demo',
      currentPlayerId: 'dragon_player',
      players,
      board,
      turn: 25,
      phase: 'playing',
      dice: { values: [4, 3], total: 7 },
      lastAction: null,
      events: [],
      marketTrends: {
        propertyPriceMultiplier: 1.15,
        rentMultiplier: 1.05,
        salaryBonus: 2000,
        taxRate: 0.03,
        skillCooldownModifier: 0.85
      }
    };
  }

  /**
   * 初始化系统演示
   */
  private async initializeSystem(gameState: GameState): Promise<void> {
    console.log('🚀 初始化交易和抵押系统...\n');
    
    const result = this.manager.initialize(gameState);
    
    if (result.success) {
      console.log('✅ 系统初始化成功');
      console.log(`   消息: ${result.message}`);
      console.log(`   效果: ${result.effects.map(e => e.description).join(', ')}\n`);
    } else {
      console.log('❌ 系统初始化失败');
      console.log(`   错误: ${result.message}\n`);
    }
  }

  /**
   * 演示玩家交易
   */
  private async demonstratePlayerTrading(gameState: GameState): Promise<void> {
    console.log('💰 === 玩家交易演示 === 💰\n');
    
    // 龙之商人想要用现金购买虎威大亨的山间别墅
    console.log('📈 交易场景: 龙之商人想要购买虎威大亨的山间别墅');
    console.log('   报价: 30,000现金');
    console.log('   请求: 山间别墅 (价值22,000)\n');
    
    const offeredItems = [
      {
        type: 'money' as const,
        amount: 30000,
        description: '现金报价 - 30,000',
        value: 30000
      }
    ];
    
    const requestedItems = [
      {
        type: 'property' as const,
        id: 'mountain_villa',
        description: '山间别墅',
        value: 22000
      }
    ];
    
    const tradeResult = this.manager.initiatePlayerTrade(
      'dragon_player',
      'tiger_player',
      offeredItems,
      requestedItems,
      gameState
    );
    
    if (tradeResult.success) {
      console.log('✅ 交易提案发送成功');
      console.log(`   ${tradeResult.message}`);
      console.log('   等待对方回应...\n');
    } else {
      console.log('❌ 交易提案失败');
      console.log(`   原因: ${tradeResult.message}\n`);
    }
    
    // 演示无效交易
    console.log('⚠️  演示无效交易: 资金不足的交易');
    const invalidResult = this.manager.initiatePlayerTrade(
      'rabbit_player',
      'dragon_player',
      [{ type: 'money' as const, amount: 100000, description: '超额现金', value: 100000 }],
      [{ type: 'property' as const, id: 'dragon_palace', description: '龙宫', value: 35000 }],
      gameState
    );
    
    console.log(`   结果: ${invalidResult.success ? '成功' : '失败'}`);
    console.log(`   信息: ${invalidResult.message}\n`);
  }

  /**
   * 演示抵押系统
   */
  private async demonstrateMortgageSystem(gameState: GameState): Promise<void> {
    console.log('🏦 === 抵押系统演示 === 🏦\n');
    
    console.log('🏠 抵押场景: 玉兔财神想要抵押月宫获得流动资金');
    console.log('   房产: 月宫 (价值30,000)');
    console.log('   申请金额: 20,000 (约67%贷款价值比)\n');
    
    const mortgageResult = this.manager.applyForMortgage(
      'rabbit_player',
      'moon_palace',
      20000,
      gameState
    );
    
    if (mortgageResult.success) {
      console.log('✅ 抵押申请成功');
      console.log(`   ${mortgageResult.message}`);
      console.log(`   效果: ${mortgageResult.effects.map(e => e.description).join(', ')}`);
      
      // 更新玩家资金以反映抵押
      const player = gameState.players.find(p => p.id === 'rabbit_player');
      if (player) {
        player.money += 20000;
        console.log(`   玉兔财神当前资金: ${player.money.toLocaleString()}\n`);
      }
    } else {
      console.log('❌ 抵押申请失败');
      console.log(`   原因: ${mortgageResult.message}\n`);
    }
    
    // 演示过高的抵押申请
    console.log('⚠️  演示风险抵押: 申请过高金额');
    const riskResult = this.manager.applyForMortgage(
      'tiger_player',
      'tiger_den',
      50000, // 远超房产价值
      gameState
    );
    
    console.log(`   结果: ${riskResult.success ? '成功' : '失败'}`);
    console.log(`   信息: ${riskResult.message}\n`);
  }

  /**
   * 演示拍卖系统
   */
  private async demonstrateAuctionSystem(gameState: GameState): Promise<void> {
    console.log('🔨 === 拍卖系统演示 === 🔨\n');
    
    console.log('🏛️ 拍卖场景: 虎威大亨拍卖虎穴');
    console.log('   起拍价: 20,000');
    console.log('   保留价: 23,000');
    console.log('   一口价: 30,000');
    console.log('   拍卖时长: 24小时\n');
    
    const auctionResult = this.manager.createPropertyAuction(
      'tiger_player',
      'tiger_den',
      20000,
      24 * 60 * 60 * 1000, // 24小时
      gameState,
      {
        reservePrice: 23000,
        buyoutPrice: 30000
      }
    );
    
    if (auctionResult.success) {
      console.log('✅ 拍卖创建成功');
      console.log(`   ${auctionResult.message}`);
      console.log('   拍卖已开始，等待竞拍者...\n');
    } else {
      console.log('❌ 拍卖创建失败');
      console.log(`   原因: ${auctionResult.message}\n`);
    }
    
    // 演示无效拍卖
    console.log('⚠️  演示无效拍卖: 不拥有的房产');
    const invalidAuction = this.manager.createPropertyAuction(
      'dragon_player',
      'moon_palace', // 龙之商人不拥有
      15000,
      24 * 60 * 60 * 1000,
      gameState
    );
    
    console.log(`   结果: ${invalidAuction.success ? '成功' : '失败'}`);
    console.log(`   信息: ${invalidAuction.message}\n`);
  }

  /**
   * 演示AI交易建议
   */
  private async demonstrateAIRecommendations(gameState: GameState): Promise<void> {
    console.log('🤖 === AI交易建议演示 === 🤖\n');
    
    const players = ['dragon_player', 'tiger_player', 'rabbit_player'];
    
    for (const playerId of players) {
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) continue;
      
      console.log(`🎯 ${player.name} 的AI交易建议:`);
      
      const recommendations = this.manager.getAITradeRecommendations(playerId, gameState);
      
      if (recommendations.length > 0) {
        recommendations.slice(0, 2).forEach((rec, index) => {
          const targetPlayer = gameState.players.find(p => p.id === rec.targetPlayerId);
          console.log(`   ${index + 1}. 类型: ${rec.type}`);
          console.log(`      目标: ${targetPlayer?.name || '未知'}`);
          console.log(`      信心度: ${(rec.confidence * 100).toFixed(1)}%`);
          console.log(`      建议理由: ${rec.reasoning}`);
          if (rec.expectedProfit) {
            console.log(`      预期收益: ${rec.expectedProfit.toLocaleString()}`);
          }
          console.log('');
        });
      } else {
        console.log('   暂无推荐的交易机会\n');
      }
    }
  }

  /**
   * 演示市场分析
   */
  private async demonstrateMarketAnalysis(gameState: GameState): Promise<void> {
    console.log('📊 === 市场分析演示 === 📊\n');
    
    const analysis = this.manager.getCompleteMarketAnalysis(gameState);
    
    console.log('🏠 房产市场概况:');
    analysis.propertyPrices.forEach((data, propertyId) => {
      const property = gameState.board.find(p => p.id === propertyId);
      if (property) {
        console.log(`   ${property.name}:`);
        console.log(`     当前价值: ${data.currentValue.toLocaleString()}`);
        console.log(`     平均价格: ${data.averagePrice.toLocaleString()}`);
        console.log(`     24h变化: ${(data.priceChange24h * 100).toFixed(2)}%`);
        console.log(`     7d变化: ${(data.priceChange7d * 100).toFixed(2)}%`);
        console.log('');
      }
    });
    
    console.log('💼 抵押市场概况:');
    console.log(`   活跃合同数: ${analysis.mortgageMarket.totalContracts}`);
    console.log(`   平均利率: ${(analysis.mortgageMarket.averageInterestRate * 100).toFixed(2)}%`);
    console.log(`   违约率: ${(analysis.mortgageMarket.defaultRate * 100).toFixed(2)}%`);
    console.log(`   总债务: ${analysis.mortgageMarket.totalDebt.toLocaleString()}\n`);
    
    console.log('📈 市场趋势:');
    console.log(`   整体方向: ${this.translateDirection(analysis.marketTrends.overallDirection)}`);
    console.log(`   波动性: ${(analysis.marketTrends.volatility * 100).toFixed(2)}%`);
    console.log(`   流动性指数: ${(analysis.marketTrends.liquidityIndex * 100).toFixed(1)}%`);
    console.log(`   活跃交易者: ${analysis.marketTrends.activeTraders}`);
    console.log(`   平均交易规模: ${analysis.marketTrends.averageTradeSize.toLocaleString()}\n`);
    
    console.log('🚨 风险指标:');
    console.log(`   系统性风险: ${this.translateRisk(analysis.riskIndicators.systemicRisk)}`);
    console.log(`   流动性风险: ${this.translateRisk(analysis.riskIndicators.liquidityRisk)}`);
    console.log(`   信用风险: ${this.translateRisk(analysis.riskIndicators.creditRisk)}`);
    console.log(`   市场波动风险: ${this.translateRisk(analysis.riskIndicators.marketVolatility)}\n`);
    
    if (analysis.recommendations.length > 0) {
      console.log('💡 交易建议:');
      analysis.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${this.translateAction(rec.type)} ${rec.targetItem}`);
        console.log(`      信心度: ${(rec.confidence * 100).toFixed(1)}%`);
        console.log(`      理由: ${rec.reasoning}`);
        console.log(`      时间框架: ${this.translateTimeFrame(rec.timeFrame)}`);
        console.log('');
      });
    }
  }

  /**
   * 演示财务管理
   */
  private async demonstrateFinancialManagement(gameState: GameState): Promise<void> {
    console.log('💎 === 财务管理演示 === 💎\n');
    
    console.log('👥 玩家财务状况:');
    
    for (const player of gameState.players) {
      try {
        const summary = this.manager.getPlayerFinancialSummary(player.id, gameState);
        
        console.log(`🎭 ${player.name} (${player.zodiac}):`);
        console.log(`   总资产: ${summary.totalAssets.toLocaleString()}`);
        console.log(`   流动资产: ${summary.liquidAssets.toLocaleString()}`);
        console.log(`   房产价值: ${summary.propertyValue.toLocaleString()}`);
        console.log(`   抵押债务: ${summary.mortgageDebt.toLocaleString()}`);
        console.log(`   净资产: ${summary.netWorth.toLocaleString()}`);
        console.log(`   信用评级: ${this.translateCreditRating(summary.creditRating)}`);
        console.log(`   交易量: ${summary.tradingVolume.toLocaleString()}`);
        console.log(`   盈亏: ${summary.profitLoss >= 0 ? '+' : ''}${summary.profitLoss.toLocaleString()}`);
        console.log('');
      } catch (error) {
        console.log(`   ❌ 无法获取 ${player.name} 的财务信息\n`);
      }
    }
    
    console.log('📊 市场活动概况:');
    const activity = this.manager.getMarketActivity();
    console.log(`   活跃报价: ${activity.activeOffers}`);
    console.log(`   完成交易: ${activity.completedTrades}`);
    console.log(`   活跃拍卖: ${activity.auctionsActive}`);
    console.log(`   活跃抵押: ${activity.mortgagesActive}`);
    console.log(`   总交易量: ${activity.totalTradingVolume.toLocaleString()}`);
    console.log(`   平均交易规模: ${activity.averageTradeSize.toLocaleString()}\n`);
  }

  // 辅助方法
  private translateDirection(direction: string): string {
    const translations: Record<string, string> = {
      'bullish': '看涨',
      'bearish': '看跌',
      'neutral': '中性'
    };
    return translations[direction] || direction;
  }

  private translateRisk(risk: string): string {
    const translations: Record<string, string> = {
      'low': '低',
      'medium': '中',
      'high': '高',
      'critical': '极高'
    };
    return translations[risk] || risk;
  }

  private translateAction(action: string): string {
    const translations: Record<string, string> = {
      'buy': '买入',
      'sell': '卖出',
      'hold': '持有'
    };
    return translations[action] || action;
  }

  private translateTimeFrame(timeFrame: string): string {
    const translations: Record<string, string> = {
      'immediate': '立即',
      'short_term': '短期',
      'long_term': '长期'
    };
    return translations[timeFrame] || timeFrame;
  }

  private translateCreditRating(rating: string): string {
    const translations: Record<string, string> = {
      'excellent': '优秀',
      'good': '良好',
      'fair': '一般',
      'poor': '较差',
      'bad': '很差'
    };
    return translations[rating] || rating;
  }
}

/**
 * 运行演示的便捷函数
 */
export async function runTradingSystemDemo(): Promise<void> {
  const demo = new TradingSystemDemo();
  await demo.runCompleteDemo();
}

/**
 * 如果直接运行此文件，则执行演示
 */
if (require.main === module) {
  runTradingSystemDemo().catch(console.error);
}