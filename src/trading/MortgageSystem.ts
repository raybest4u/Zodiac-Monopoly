/**
 * 抵押系统 - 十二生肖大富翁游戏抵押管理
 * 
 * 提供房产抵押、赎回、利息计算和风险评估功能
 */

import type {
  GameState,
  Player,
  Property,
  PropertyCell,
  PropertyUpgrade,
  ActionResult,
  GameEffect
} from '../types/game';

export interface MortgageContract {
  id: string;
  propertyId: string;
  playerId: string;
  contractDate: number;
  
  // 抵押条件
  originalValue: number;
  mortgageAmount: number;
  interestRate: number;
  duration: number; // 抵押期限（回合数）
  
  // 当前状态
  currentDebt: number;
  interestAccrued: number;
  dueDate: number;
  status: MortgageStatus;
  
  // 还款记录
  payments: MortgagePayment[];
  
  // 风险评估
  riskLevel: RiskLevel;
  collateralRatio: number;
  
  // 条款
  terms: MortgageTerms;
}

export interface MortgagePayment {
  id: string;
  timestamp: number;
  amount: number;
  type: 'interest' | 'principal' | 'penalty' | 'full_redemption';
  balanceAfter: number;
  description: string;
}

export interface MortgageTerms {
  earlyRedemptionPenalty: number; // 提前赎回罚金比例
  defaultPenalty: number; // 违约罚金比例
  maxDuration: number; // 最大抵押期限
  minInterestPayment: number; // 最低利息支付
  gracePeriod: number; // 宽限期
  allowPartialPayment: boolean; // 允许分期还款
  autoRenewal: boolean; // 自动续期
}

export interface MortgageOffer {
  id: string;
  lenderId: string;
  borrowerId: string;
  propertyId: string;
  
  // 报价条件
  offeredAmount: number;
  interestRate: number;
  duration: number;
  
  // 报价详情
  terms: MortgageTerms;
  conditions: string[];
  expiresAt: number;
  
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export type MortgageStatus = 
  | 'active' 
  | 'defaulted' 
  | 'redeemed' 
  | 'foreclosed' 
  | 'transferred';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 抵押系统管理器
 */
export class MortgageSystem {
  private contracts: Map<string, MortgageContract> = new Map();
  private offers: Map<string, MortgageOffer> = new Map();
  private nextContractId = 1;
  private nextOfferId = 1;

  /**
   * 创建抵押申请
   */
  createMortgageApplication(
    playerId: string,
    propertyId: string,
    requestedAmount: number,
    gameState: GameState
  ): MortgageApplication {
    const player = gameState.players.find(p => p.id === playerId);
    const property = this.getPropertyById(propertyId, gameState);
    
    if (!player || !property) {
      throw new Error('玩家或房产不存在');
    }

    if (!player.properties.includes(propertyId)) {
      throw new Error('玩家不拥有此房产');
    }

    // 检查房产是否已被抵押
    if (this.isPropertyMortgaged(propertyId)) {
      throw new Error('房产已被抵押');
    }

    // 评估房产价值
    const propertyValue = this.evaluatePropertyValue(property, gameState);
    const maxMortgageAmount = propertyValue * 0.8; // 最大抵押比例80%

    if (requestedAmount > maxMortgageAmount) {
      throw new Error(`请求金额超过最大抵押额度 ${maxMortgageAmount}`);
    }

    // 评估玩家信用
    const creditRating = this.evaluatePlayerCredit(player, gameState);
    
    // 计算利率
    const baseInterestRate = this.calculateBaseInterestRate(gameState);
    const riskPremium = this.calculateRiskPremium(creditRating, propertyValue, requestedAmount);
    const finalInterestRate = baseInterestRate + riskPremium;

    return {
      id: `mortgage_app_${this.nextContractId++}`,
      playerId,
      propertyId,
      requestedAmount,
      propertyValue,
      maxMortgageAmount,
      recommendedAmount: Math.floor(propertyValue * 0.6), // 推荐抵押比例60%
      interestRate: finalInterestRate,
      creditRating,
      riskAssessment: this.assessMortgageRisk(player, property, requestedAmount, gameState),
      terms: this.generateStandardTerms(creditRating),
      timestamp: Date.now()
    };
  }

  /**
   * 批准抵押申请并创建合同
   */
  approveMortgage(
    application: MortgageApplication,
    duration: number,
    customTerms?: Partial<MortgageTerms>
  ): MortgageContract {
    const terms = { ...application.terms, ...customTerms };
    
    const contract: MortgageContract = {
      id: `mortgage_${this.nextContractId++}`,
      propertyId: application.propertyId,
      playerId: application.playerId,
      contractDate: Date.now(),
      originalValue: application.propertyValue,
      mortgageAmount: application.requestedAmount,
      interestRate: application.interestRate,
      duration,
      currentDebt: application.requestedAmount,
      interestAccrued: 0,
      dueDate: Date.now() + (duration * 24 * 60 * 60 * 1000), // 假设每回合1天
      status: 'active',
      payments: [],
      riskLevel: application.riskAssessment.level,
      collateralRatio: application.propertyValue / application.requestedAmount,
      terms
    };

    this.contracts.set(contract.id, contract);
    return contract;
  }

  /**
   * 处理定期利息支付
   */
  processInterestPayment(
    contractId: string,
    paymentAmount: number,
    gameState: GameState
  ): ActionResult {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      return { success: false, message: '抵押合同不存在', effects: [] };
    }

    const player = gameState.players.find(p => p.id === contract.playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    // 计算当前应付利息
    const currentInterest = this.calculateCurrentInterest(contract);
    
    if (paymentAmount < contract.terms.minInterestPayment) {
      return { 
        success: false, 
        message: `支付金额不足，最低需要支付 ${contract.terms.minInterestPayment}`, 
        effects: [] 
      };
    }

    if (player.money < paymentAmount) {
      return { 
        success: false, 
        message: '玩家资金不足', 
        effects: [] 
      };
    }

    // 处理支付
    const payment: MortgagePayment = {
      id: `payment_${Date.now()}`,
      timestamp: Date.now(),
      amount: paymentAmount,
      type: paymentAmount >= contract.currentDebt ? 'full_redemption' : 'interest',
      balanceAfter: 0,
      description: ''
    };

    // 优先偿还利息，然后偿还本金
    let remainingPayment = paymentAmount;
    
    if (remainingPayment >= currentInterest) {
      // 支付全部利息
      contract.interestAccrued = 0;
      remainingPayment -= currentInterest;
      
      // 剩余部分偿还本金
      if (remainingPayment > 0) {
        const principalPayment = Math.min(remainingPayment, contract.currentDebt);
        contract.currentDebt -= principalPayment;
        payment.type = principalPayment === contract.currentDebt ? 'full_redemption' : 'principal';
      }
    } else {
      // 部分支付利息
      contract.interestAccrued -= remainingPayment;
    }

    payment.balanceAfter = contract.currentDebt;
    payment.description = this.generatePaymentDescription(payment, currentInterest);
    
    contract.payments.push(payment);

    // 检查是否完全赎回
    if (contract.currentDebt === 0) {
      contract.status = 'redeemed';
      this.contracts.delete(contractId);
    }

    const effects: GameEffect[] = [
      {
        type: 'money',
        target: 'player',
        value: -paymentAmount,
        description: `支付抵押款项 ${paymentAmount}`
      }
    ];

    return {
      success: true,
      message: payment.description,
      effects,
      newGameState: {
        players: gameState.players.map(p => 
          p.id === player.id ? { ...p, money: p.money - paymentAmount } : p
        )
      }
    };
  }

  /**
   * 抵押房产
   */
  mortgageProperty(
    playerId: string,
    propertyId: string,
    requestedAmount: number,
    duration: number,
    gameState: GameState
  ): ActionResult {
    try {
      // 创建抵押申请
      const application = this.createMortgageApplication(playerId, propertyId, requestedAmount, gameState);
      
      // 自动批准（在真实游戏中可能需要玩家间协商）
      const contract = this.approveMortgage(application, duration);
      
      const effects: GameEffect[] = [
        {
          type: 'money',
          target: 'player',
          value: requestedAmount,
          description: `获得抵押贷款 ${requestedAmount}`
        }
      ];

      return {
        success: true,
        message: `成功抵押房产，获得 ${requestedAmount} 现金`,
        effects,
        newGameState: {
          players: gameState.players.map(p => 
            p.id === playerId ? { ...p, money: p.money + requestedAmount } : p
          )
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : '抵押失败',
        effects: []
      };
    }
  }

  /**
   * 赎回抵押房产
   */
  redeemProperty(
    contractId: string,
    gameState: GameState
  ): ActionResult {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      return { success: false, message: '抵押合同不存在', effects: [] };
    }

    const player = gameState.players.find(p => p.id === contract.playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    // 计算总赎回金额
    const currentInterest = this.calculateCurrentInterest(contract);
    const totalRedemptionAmount = contract.currentDebt + currentInterest;
    
    // 检查是否有提前赎回罚金
    const isEarlyRedemption = Date.now() < contract.dueDate;
    const earlyPenalty = isEarlyRedemption ? 
      contract.currentDebt * contract.terms.earlyRedemptionPenalty : 0;
    
    const finalAmount = totalRedemptionAmount + earlyPenalty;

    if (player.money < finalAmount) {
      return { 
        success: false, 
        message: `资金不足，需要 ${finalAmount}，当前拥有 ${player.money}`, 
        effects: [] 
      };
    }

    // 执行赎回
    return this.processInterestPayment(contractId, finalAmount, gameState);
  }

  /**
   * 处理违约和法拍
   */
  processDefault(
    contractId: string,
    gameState: GameState
  ): ActionResult {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      return { success: false, message: '抵押合同不存在', effects: [] };
    }

    // 标记为违约
    contract.status = 'defaulted';
    
    // 计算违约罚金
    const defaultPenalty = contract.currentDebt * contract.terms.defaultPenalty;
    contract.currentDebt += defaultPenalty;

    // 启动法拍程序
    const foreclosureResult = this.startForeclosure(contract, gameState);
    
    return {
      success: true,
      message: `房产 ${contract.propertyId} 因违约进入法拍程序`,
      effects: foreclosureResult.effects
    };
  }

  /**
   * 获取玩家的所有抵押合同
   */
  getPlayerMortgages(playerId: string): MortgageContract[] {
    return Array.from(this.contracts.values())
      .filter(contract => contract.playerId === playerId);
  }

  /**
   * 获取活跃的抵押报价
   */
  getActiveMortgageOffers(): MortgageOffer[] {
    return Array.from(this.offers.values())
      .filter(offer => offer.status === 'pending' && offer.expiresAt > Date.now());
  }

  /**
   * 计算抵押系统统计信息
   */
  getSystemStatistics(): MortgageSystemStats {
    const contracts = Array.from(this.contracts.values());
    const totalActive = contracts.filter(c => c.status === 'active').length;
    const totalDefaulted = contracts.filter(c => c.status === 'defaulted').length;
    const totalValue = contracts.reduce((sum, c) => sum + c.mortgageAmount, 0);
    const totalDebt = contracts.reduce((sum, c) => sum + c.currentDebt, 0);

    return {
      totalContracts: contracts.length,
      activeContracts: totalActive,
      defaultedContracts: totalDefaulted,
      totalMortgageValue: totalValue,
      totalOutstandingDebt: totalDebt,
      averageInterestRate: contracts.length > 0 ? 
        contracts.reduce((sum, c) => sum + c.interestRate, 0) / contracts.length : 0,
      defaultRate: contracts.length > 0 ? totalDefaulted / contracts.length : 0
    };
  }

  // 私有辅助方法

  private getPropertyById(propertyId: string, gameState: GameState): PropertyCell | undefined {
    return gameState.board.find(cell => cell.id === propertyId && cell.type === 'property') as PropertyCell;
  }

  private isPropertyMortgaged(propertyId: string): boolean {
    return Array.from(this.contracts.values())
      .some(contract => contract.propertyId === propertyId && contract.status === 'active');
  }

  private evaluatePropertyValue(property: PropertyCell, gameState: GameState): number {
    let baseValue = property.price || 0;
    
    // 考虑升级价值
    if (property.upgrades) {
      const upgradeValue = property.upgrades.reduce((sum, upgrade) => sum + (upgrade.cost || 0), 0);
      baseValue += upgradeValue;
    }
    
    // 考虑市场趋势
    if (gameState.marketTrends) {
      baseValue *= gameState.marketTrends.propertyPriceMultiplier;
    }
    
    // 考虑位置价值（靠近起点或特殊位置）
    const positionMultiplier = this.calculatePositionMultiplier(property);
    baseValue *= positionMultiplier;
    
    return Math.floor(baseValue);
  }

  private calculatePositionMultiplier(property: PropertyCell): number {
    // 基于房产位置计算价值倍数
    const position = property.position || 0;
    const boardSize = 40; // 假设40格棋盘
    
    // 角落位置通常更有价值
    if ([0, 10, 20, 30].includes(position)) {
      return 1.2;
    }
    
    // 中间位置
    if (position % 10 === 5) {
      return 1.1;
    }
    
    return 1.0;
  }

  private evaluatePlayerCredit(player: Player, gameState: GameState): CreditRating {
    const assets = player.money + this.calculatePlayerPropertyValue(player, gameState);
    const debts = this.calculatePlayerDebts(player.id);
    const netWorth = assets - debts;
    
    const paymentHistory = this.getPlayerPaymentHistory(player.id);
    const onTimePayments = paymentHistory.filter(p => p.onTime).length;
    const paymentRatio = paymentHistory.length > 0 ? onTimePayments / paymentHistory.length : 1;
    
    let score = 0;
    
    // 净资产评分 (40%)
    if (netWorth >= 50000) score += 40;
    else if (netWorth >= 20000) score += 30;
    else if (netWorth >= 10000) score += 20;
    else if (netWorth >= 5000) score += 10;
    
    // 还款历史评分 (35%)
    score += paymentRatio * 35;
    
    // 债务比率评分 (25%)
    const debtRatio = assets > 0 ? debts / assets : 1;
    if (debtRatio <= 0.3) score += 25;
    else if (debtRatio <= 0.5) score += 20;
    else if (debtRatio <= 0.7) score += 10;
    
    // 确定等级
    if (score >= 85) return { level: 'excellent', score };
    if (score >= 70) return { level: 'good', score };
    if (score >= 55) return { level: 'fair', score };
    if (score >= 40) return { level: 'poor', score };
    return { level: 'bad', score };
  }

  private calculatePlayerPropertyValue(player: Player, gameState: GameState): number {
    return player.properties.reduce((total, propertyId) => {
      const property = this.getPropertyById(propertyId, gameState);
      return total + (property ? this.evaluatePropertyValue(property, gameState) : 0);
    }, 0);
  }

  private calculatePlayerDebts(playerId: string): number {
    return Array.from(this.contracts.values())
      .filter(contract => contract.playerId === playerId && contract.status === 'active')
      .reduce((total, contract) => total + contract.currentDebt, 0);
  }

  private getPlayerPaymentHistory(playerId: string): PaymentHistoryRecord[] {
    const playerContracts = Array.from(this.contracts.values())
      .filter(contract => contract.playerId === playerId);
    
    const history: PaymentHistoryRecord[] = [];
    
    playerContracts.forEach(contract => {
      contract.payments.forEach(payment => {
        history.push({
          contractId: contract.id,
          paymentId: payment.id,
          amount: payment.amount,
          dueDate: contract.dueDate,
          paidDate: payment.timestamp,
          onTime: payment.timestamp <= contract.dueDate
        });
      });
    });
    
    return history.sort((a, b) => b.paidDate - a.paidDate);
  }

  private calculateBaseInterestRate(gameState: GameState): number {
    // 基础利率根据游戏阶段和市场状况调整
    const gamePhase = Math.min(gameState.turn / 100, 1); // 假设100回合为一个周期
    const baseRate = 0.05 + gamePhase * 0.03; // 5%到8%的基础利率
    
    // 考虑市场趋势
    if (gameState.marketTrends) {
      return baseRate * (1 + gameState.marketTrends.taxRate * 0.5);
    }
    
    return baseRate;
  }

  private calculateRiskPremium(creditRating: CreditRating, propertyValue: number, loanAmount: number): number {
    let premium = 0;
    
    // 信用等级风险溢价
    switch (creditRating.level) {
      case 'excellent': premium += 0.005; break;
      case 'good': premium += 0.01; break;
      case 'fair': premium += 0.02; break;
      case 'poor': premium += 0.035; break;
      case 'bad': premium += 0.05; break;
    }
    
    // 贷款价值比风险溢价
    const ltvRatio = loanAmount / propertyValue;
    if (ltvRatio > 0.8) premium += 0.02;
    else if (ltvRatio > 0.7) premium += 0.015;
    else if (ltvRatio > 0.6) premium += 0.01;
    
    return premium;
  }

  private assessMortgageRisk(
    player: Player, 
    property: PropertyCell, 
    loanAmount: number, 
    gameState: GameState
  ): RiskAssessment {
    const propertyValue = this.evaluatePropertyValue(property, gameState);
    const playerAssets = player.money + this.calculatePlayerPropertyValue(player, gameState);
    const existingDebts = this.calculatePlayerDebts(player.id);
    
    let riskScore = 0;
    const factors: string[] = [];
    
    // 贷款价值比风险
    const ltvRatio = loanAmount / propertyValue;
    if (ltvRatio > 0.8) {
      riskScore += 30;
      factors.push('高贷款价值比');
    } else if (ltvRatio > 0.6) {
      riskScore += 15;
      factors.push('中等贷款价值比');
    }
    
    // 债务收入比风险
    const totalDebt = existingDebts + loanAmount;
    const debtAssetRatio = totalDebt / Math.max(playerAssets, 1);
    if (debtAssetRatio > 0.7) {
      riskScore += 25;
      factors.push('高债务资产比');
    } else if (debtAssetRatio > 0.5) {
      riskScore += 15;
      factors.push('中等债务资产比');
    }
    
    // 流动性风险
    if (player.money < loanAmount * 0.1) {
      riskScore += 20;
      factors.push('流动性不足');
    }
    
    // 房产类型风险
    if (property.color === 'special') {
      riskScore += 10;
      factors.push('特殊房产风险');
    }
    
    // 确定风险等级
    let level: RiskLevel;
    if (riskScore >= 60) level = 'critical';
    else if (riskScore >= 40) level = 'high';
    else if (riskScore >= 20) level = 'medium';
    else level = 'low';
    
    return {
      level,
      score: riskScore,
      factors,
      recommendation: this.generateRiskRecommendation(level, factors)
    };
  }

  private generateRiskRecommendation(level: RiskLevel, factors: string[]): string {
    switch (level) {
      case 'low':
        return '风险较低，建议批准抵押申请';
      case 'medium':
        return '中等风险，建议适度调整条款后批准';
      case 'high':
        return '高风险，建议增加担保或降低贷款额度';
      case 'critical':
        return '极高风险，不建议批准抵押申请';
    }
  }

  private generateStandardTerms(creditRating: CreditRating): MortgageTerms {
    const baseTerms: MortgageTerms = {
      earlyRedemptionPenalty: 0.02,
      defaultPenalty: 0.1,
      maxDuration: 50,
      minInterestPayment: 100,
      gracePeriod: 3,
      allowPartialPayment: true,
      autoRenewal: false
    };
    
    // 根据信用等级调整条款
    switch (creditRating.level) {
      case 'excellent':
        baseTerms.earlyRedemptionPenalty = 0.01;
        baseTerms.defaultPenalty = 0.05;
        baseTerms.gracePeriod = 5;
        break;
      case 'good':
        baseTerms.earlyRedemptionPenalty = 0.015;
        baseTerms.defaultPenalty = 0.08;
        baseTerms.gracePeriod = 4;
        break;
      case 'poor':
        baseTerms.earlyRedemptionPenalty = 0.03;
        baseTerms.defaultPenalty = 0.15;
        baseTerms.gracePeriod = 2;
        baseTerms.minInterestPayment = 200;
        break;
      case 'bad':
        baseTerms.earlyRedemptionPenalty = 0.05;
        baseTerms.defaultPenalty = 0.2;
        baseTerms.gracePeriod = 1;
        baseTerms.minInterestPayment = 300;
        baseTerms.allowPartialPayment = false;
        break;
    }
    
    return baseTerms;
  }

  private calculateCurrentInterest(contract: MortgageContract): number {
    const timePassed = Date.now() - contract.contractDate;
    const periodsElapsed = Math.floor(timePassed / (24 * 60 * 60 * 1000)); // 假设每天一个计息周期
    const newInterest = contract.currentDebt * (contract.interestRate / 365) * periodsElapsed;
    
    return contract.interestAccrued + newInterest;
  }

  private generatePaymentDescription(payment: MortgagePayment, currentInterest: number): string {
    switch (payment.type) {
      case 'interest':
        return `支付利息 ${payment.amount}，剩余本金 ${payment.balanceAfter}`;
      case 'principal':
        return `支付本金 ${payment.amount}，剩余本金 ${payment.balanceAfter}`;
      case 'full_redemption':
        return `完全赎回抵押房产，支付 ${payment.amount}`;
      case 'penalty':
        return `支付罚金 ${payment.amount}`;
      default:
        return `支付 ${payment.amount}`;
    }
  }

  private startForeclosure(contract: MortgageContract, gameState: GameState): ActionResult {
    // 法拍逻辑：将房产转移给银行或进行拍卖
    contract.status = 'foreclosed';
    
    const effects: GameEffect[] = [
      {
        type: 'property',
        target: 'player',
        value: -1,
        description: `失去房产 ${contract.propertyId}`
      }
    ];
    
    return {
      success: true,
      message: `房产 ${contract.propertyId} 已被法拍`,
      effects
    };
  }
}

// 辅助类型定义
export interface MortgageApplication {
  id: string;
  playerId: string;
  propertyId: string;
  requestedAmount: number;
  propertyValue: number;
  maxMortgageAmount: number;
  recommendedAmount: number;
  interestRate: number;
  creditRating: CreditRating;
  riskAssessment: RiskAssessment;
  terms: MortgageTerms;
  timestamp: number;
}

export interface CreditRating {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'bad';
  score: number;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  factors: string[];
  recommendation: string;
}

export interface PaymentHistoryRecord {
  contractId: string;
  paymentId: string;
  amount: number;
  dueDate: number;
  paidDate: number;
  onTime: boolean;
}

export interface MortgageSystemStats {
  totalContracts: number;
  activeContracts: number;
  defaultedContracts: number;
  totalMortgageValue: number;
  totalOutstandingDebt: number;
  averageInterestRate: number;
  defaultRate: number;
}