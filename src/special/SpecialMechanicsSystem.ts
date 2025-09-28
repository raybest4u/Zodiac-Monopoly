/**
 * 特殊机制系统 - 十二生肖大富翁特殊游戏机制
 * 
 * 提供各种特殊游戏机制，包括彩票、保险、银行贷款、特殊事件等
 */

import type {
  GameState,
  Player,
  ActionResult,
  GameEffect,
  PlayerAction,
  ZodiacSign,
  Season,
  Weather
} from '../types/game';

export interface LotterySystem {
  id: string;
  name: string;
  description: string;
  
  // 彩票配置
  ticketPrice: number;
  jackpot: number;
  drawFrequency: number; // 每几回合开奖一次
  winningNumbers: number[];
  
  // 参与记录
  participants: LotteryTicket[];
  drawHistory: LotteryDraw[];
  
  // 生肖加成
  zodiacBonuses: Map<ZodiacSign, number>;
  seasonalMultipliers: Map<Season, number>;
}

export interface LotteryTicket {
  id: string;
  playerId: string;
  numbers: number[];
  purchaseTime: number;
  cost: number;
  zodiacBonus?: number;
}

export interface LotteryDraw {
  id: string;
  drawTime: number;
  winningNumbers: number[];
  winners: LotteryWinner[];
  jackpotAmount: number;
  totalTickets: number;
}

export interface LotteryWinner {
  playerId: string;
  ticketId: string;
  matchedNumbers: number;
  prize: number;
  zodiacBonus: number;
}

export interface InsurancePolicy {
  id: string;
  playerId: string;
  policyType: InsurancePolicyType;
  
  // 保险条款
  coverage: InsuranceCoverage[];
  premium: number;
  deductible: number;
  maxPayout: number;
  
  // 保险状态
  isActive: boolean;
  startDate: number;
  renewalDate: number;
  claimsHistory: InsuranceClaim[];
  
  // 风险评估
  riskLevel: 'low' | 'medium' | 'high';
  discounts: InsuranceDiscount[];
}

export interface InsuranceCoverage {
  type: CoverageType;
  amount: number;
  conditions: string[];
}

export interface InsuranceClaim {
  id: string;
  claimDate: number;
  claimType: ClaimType;
  claimAmount: number;
  payoutAmount: number;
  status: ClaimStatus;
  evidence: string[];
}

export interface BankLoan {
  id: string;
  playerId: string;
  loanType: LoanType;
  
  // 贷款条款
  principal: number;
  interestRate: number;
  term: number; // 期限（回合数）
  monthlyPayment: number;
  
  // 当前状态
  remainingBalance: number;
  remainingTerms: number;
  paymentHistory: LoanPayment[];
  
  // 抵押品
  collateral: LoanCollateral[];
  
  // 状态
  status: LoanStatus;
  defaultRisk: number;
}

export interface LoanPayment {
  id: string;
  paymentDate: number;
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  type: SpecialEventType;
  
  // 触发条件
  triggers: EventTrigger[];
  requirements: EventRequirement[];
  
  // 事件效果
  effects: SpecialEventEffect[];
  choices?: EventChoice[];
  
  // 时间和概率
  duration: number;
  probability: number;
  cooldown: number;
  
  // 生肖相关
  zodiacAffinity: Map<ZodiacSign, number>;
  seasonalBonus: Map<Season, number>;
}

export interface SpecialEventEffect {
  type: EffectType;
  target: EffectTarget;
  value: number;
  duration?: number;
  condition?: string;
  zodiacMultiplier?: Map<ZodiacSign, number>;
}

export interface TeleportationNetwork {
  id: string;
  name: string;
  nodes: TeleportNode[];
  connections: TeleportConnection[];
  
  // 使用规则
  usageCost: number;
  cooldownTime: number;
  restrictions: string[];
  
  // 生肖权限
  zodiacAccess: Map<ZodiacSign, AccessLevel>;
}

export interface TeleportNode {
  id: string;
  name: string;
  position: number;
  nodeType: 'temple' | 'portal' | 'shrine' | 'gateway';
  zodiacGuardian?: ZodiacSign;
  specialEffects: GameEffect[];
}

export interface TeleportConnection {
  fromNode: string;
  toNode: string;
  cost: number;
  requirements: string[];
  zodiacBonus: Map<ZodiacSign, number>;
}

export interface WealthRedistribution {
  id: string;
  eventName: string;
  triggerCondition: 'wealth_gap' | 'seasonal_change' | 'special_event';
  
  // 重分配规则
  redistributionRate: number;
  minimumWealth: number;
  maximumWealth: number;
  
  // 执行记录
  executionHistory: RedistributionRecord[];
}

export interface RedistributionRecord {
  executionDate: number;
  playersAffected: string[];
  totalRedistributed: number;
  redistributionDetails: PlayerRedistribution[];
}

export interface PlayerRedistribution {
  playerId: string;
  amountTaken: number;
  amountReceived: number;
  netChange: number;
}

// 类型定义
export type InsurancePolicyType = 
  | 'property_damage' | 'theft_protection' | 'business_interruption'
  | 'liability' | 'life_insurance' | 'zodiac_blessing';

export type CoverageType = 
  | 'property_loss' | 'rental_income' | 'legal_fees' | 'medical_expenses'
  | 'business_loss' | 'natural_disaster' | 'zodiac_curse';

export type ClaimType = 
  | 'fire_damage' | 'theft' | 'vandalism' | 'natural_disaster'
  | 'legal_dispute' | 'medical_emergency' | 'zodiac_incident';

export type ClaimStatus = 'pending' | 'approved' | 'denied' | 'paid';

export type LoanType = 
  | 'personal' | 'business' | 'mortgage' | 'emergency'
  | 'investment' | 'zodiac_enhancement';

export type LoanStatus = 
  | 'active' | 'paid_off' | 'defaulted' | 'restructured';

export type LoanCollateral = {
  type: 'property' | 'item' | 'income' | 'guarantee';
  value: number;
  identifier: string;
};

export type SpecialEventType = 
  | 'market_crash' | 'economic_boom' | 'natural_disaster'
  | 'zodiac_convergence' | 'seasonal_festival' | 'government_policy'
  | 'technological_advance' | 'social_movement';

export type EventTrigger = 
  | 'turn_count' | 'player_action' | 'wealth_threshold'
  | 'property_count' | 'zodiac_alignment' | 'seasonal_change'
  | 'random_chance' | 'player_interaction';

export type EventRequirement = {
  type: 'money' | 'property' | 'zodiac' | 'season' | 'position';
  value: any;
  comparison: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
};

export type EffectType = 
  | 'money' | 'property_value' | 'rent_multiplier' | 'tax_rate'
  | 'skill_enhancement' | 'movement_restriction' | 'trading_bonus'
  | 'dice_modification' | 'zodiac_power';

export type EffectTarget = 'all_players' | 'single_player' | 'property_owners' | 'zodiac_group';

export type AccessLevel = 'forbidden' | 'restricted' | 'normal' | 'privileged';

export interface EventChoice {
  id: string;
  text: string;
  description: string;
  requirements?: EventRequirement[];
  effects: SpecialEventEffect[];
  probability: number;
}

/**
 * 特殊机制系统管理器
 */
export class SpecialMechanicsSystem {
  private lotterySystem: LotterySystem;
  private insurancePolicies: Map<string, InsurancePolicy> = new Map();
  private bankLoans: Map<string, BankLoan> = new Map();
  private activeEvents: Map<string, SpecialEvent> = new Map();
  private teleportNetwork: TeleportationNetwork;
  private wealthRedistribution: WealthRedistribution;
  private nextLotteryId = 1;
  private nextInsuranceId = 1;
  private nextLoanId = 1;
  private nextEventId = 1;

  constructor() {
    this.initializeLotterySystem();
    this.initializeTeleportNetwork();
    this.initializeWealthRedistribution();
  }

  /**
   * 购买彩票
   */
  purchaseLotteryTicket(
    playerId: string,
    numbers: number[],
    gameState: GameState
  ): ActionResult {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    if (numbers.length !== 6 || numbers.some(n => n < 1 || n > 49)) {
      return { success: false, message: '号码格式错误（需要6个1-49的数字）', effects: [] };
    }

    if (player.money < this.lotterySystem.ticketPrice) {
      return { success: false, message: '资金不足', effects: [] };
    }

    // 计算生肖加成
    const zodiacBonus = this.lotterySystem.zodiacBonuses.get(player.zodiac) || 1;
    const actualCost = Math.floor(this.lotterySystem.ticketPrice / zodiacBonus);

    const ticket: LotteryTicket = {
      id: `lottery_${this.nextLotteryId++}`,
      playerId,
      numbers,
      purchaseTime: Date.now(),
      cost: actualCost,
      zodiacBonus
    };

    this.lotterySystem.participants.push(ticket);
    this.lotterySystem.jackpot += actualCost * 0.5; // 50%进入奖池

    return {
      success: true,
      message: `购买彩票成功，号码：${numbers.join(', ')}`,
      effects: [{
        type: 'money',
        target: 'player',
        value: -actualCost,
        description: `彩票费用 ${actualCost}`
      }],
      newGameState: {
        players: gameState.players.map(p => 
          p.id === playerId ? { ...p, money: p.money - actualCost } : p
        )
      }
    };
  }

  /**
   * 彩票开奖
   */
  conductLotteryDraw(gameState: GameState): ActionResult {
    if (this.lotterySystem.participants.length === 0) {
      return { success: false, message: '无人参与彩票', effects: [] };
    }

    // 生成中奖号码
    const winningNumbers = this.generateWinningNumbers();
    
    // 计算中奖者
    const winners = this.calculateLotteryWinners(winningNumbers, gameState);
    
    const draw: LotteryDraw = {
      id: `draw_${Date.now()}`,
      drawTime: Date.now(),
      winningNumbers,
      winners,
      jackpotAmount: this.lotterySystem.jackpot,
      totalTickets: this.lotterySystem.participants.length
    };

    this.lotterySystem.drawHistory.push(draw);
    
    // 重置彩票系统
    this.lotterySystem.participants = [];
    this.lotterySystem.jackpot = 10000; // 重置基础奖池

    const effects: GameEffect[] = [];
    let totalPayout = 0;

    winners.forEach(winner => {
      effects.push({
        type: 'money',
        target: 'player',
        value: winner.prize,
        description: `彩票中奖 ${winner.prize}`
      });
      totalPayout += winner.prize;
    });

    return {
      success: true,
      message: `彩票开奖：${winningNumbers.join(', ')}，共${winners.length}名中奖者`,
      effects,
      newGameState: {
        players: gameState.players.map(p => {
          const winnerData = winners.find(w => w.playerId === p.id);
          return winnerData ? { ...p, money: p.money + winnerData.prize } : p;
        })
      }
    };
  }

  /**
   * 购买保险
   */
  purchaseInsurance(
    playerId: string,
    policyType: InsurancePolicyType,
    coverage: InsuranceCoverage[],
    gameState: GameState
  ): ActionResult {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    const premium = this.calculateInsurancePremium(policyType, coverage, player);
    
    if (player.money < premium) {
      return { success: false, message: '资金不足支付保费', effects: [] };
    }

    const policy: InsurancePolicy = {
      id: `insurance_${this.nextInsuranceId++}`,
      playerId,
      policyType,
      coverage,
      premium,
      deductible: this.calculateDeductible(policyType, coverage),
      maxPayout: this.calculateMaxPayout(coverage),
      isActive: true,
      startDate: Date.now(),
      renewalDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30天后续费
      claimsHistory: [],
      riskLevel: this.assessInsuranceRisk(player, gameState),
      discounts: this.calculateInsuranceDiscounts(player)
    };

    this.insurancePolicies.set(policy.id, policy);

    return {
      success: true,
      message: `保险购买成功，保单号：${policy.id}`,
      effects: [{
        type: 'money',
        target: 'player',
        value: -premium,
        description: `保险费 ${premium}`
      }],
      newGameState: {
        players: gameState.players.map(p => 
          p.id === playerId ? { ...p, money: p.money - premium } : p
        )
      }
    };
  }

  /**
   * 申请保险理赔
   */
  fileInsuranceClaim(
    policyId: string,
    claimType: ClaimType,
    claimAmount: number,
    evidence: string[],
    gameState: GameState
  ): ActionResult {
    const policy = this.insurancePolicies.get(policyId);
    if (!policy) {
      return { success: false, message: '保单不存在', effects: [] };
    }

    if (!policy.isActive) {
      return { success: false, message: '保单未激活', effects: [] };
    }

    // 检查理赔条件
    const coverage = policy.coverage.find(c => this.matchesClaimType(c.type, claimType));
    if (!coverage) {
      return { success: false, message: '不在保险范围内', effects: [] };
    }

    // 计算理赔金额
    const payoutAmount = Math.min(
      Math.max(0, claimAmount - policy.deductible),
      coverage.amount,
      policy.maxPayout
    );

    const claim: InsuranceClaim = {
      id: `claim_${Date.now()}`,
      claimDate: Date.now(),
      claimType,
      claimAmount,
      payoutAmount,
      status: 'approved',
      evidence
    };

    policy.claimsHistory.push(claim);

    return {
      success: true,
      message: `理赔成功，获得赔偿 ${payoutAmount}`,
      effects: [{
        type: 'money',
        target: 'player',
        value: payoutAmount,
        description: `保险理赔 ${payoutAmount}`
      }],
      newGameState: {
        players: gameState.players.map(p => 
          p.id === policy.playerId ? { ...p, money: p.money + payoutAmount } : p
        )
      }
    };
  }

  /**
   * 申请银行贷款
   */
  applyForLoan(
    playerId: string,
    loanType: LoanType,
    amount: number,
    term: number,
    collateral: LoanCollateral[],
    gameState: GameState
  ): ActionResult {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    // 评估信用
    const creditScore = this.calculateCreditScore(player, gameState);
    const interestRate = this.calculateLoanInterestRate(loanType, creditScore, collateral);
    
    if (creditScore < 500) {
      return { success: false, message: '信用评分过低，贷款被拒', effects: [] };
    }

    const monthlyPayment = this.calculateMonthlyPayment(amount, interestRate, term);
    
    const loan: BankLoan = {
      id: `loan_${this.nextLoanId++}`,
      playerId,
      loanType,
      principal: amount,
      interestRate,
      term,
      monthlyPayment,
      remainingBalance: amount,
      remainingTerms: term,
      paymentHistory: [],
      collateral,
      status: 'active',
      defaultRisk: this.calculateDefaultRisk(player, monthlyPayment, gameState)
    };

    this.bankLoans.set(loan.id, loan);

    return {
      success: true,
      message: `贷款批准，金额：${amount}，月供：${monthlyPayment.toFixed(2)}`,
      effects: [{
        type: 'money',
        target: 'player',
        value: amount,
        description: `银行贷款 ${amount}`
      }],
      newGameState: {
        players: gameState.players.map(p => 
          p.id === playerId ? { ...p, money: p.money + amount } : p
        )
      }
    };
  }

  /**
   * 使用传送门
   */
  useTeleport(
    playerId: string,
    fromNode: string,
    toNode: string,
    gameState: GameState
  ): ActionResult {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    const connection = this.teleportNetwork.connections.find(
      c => c.fromNode === fromNode && c.toNode === toNode
    );
    
    if (!connection) {
      return { success: false, message: '传送路径不存在', effects: [] };
    }

    // 检查生肖权限
    const accessLevel = this.teleportNetwork.zodiacAccess.get(player.zodiac) || 'normal';
    if (accessLevel === 'forbidden') {
      return { success: false, message: '您的生肖无法使用此传送门', effects: [] };
    }

    // 计算费用
    const zodiacDiscount = connection.zodiacBonus.get(player.zodiac) || 1;
    const actualCost = Math.floor(connection.cost / zodiacDiscount);

    if (player.money < actualCost) {
      return { success: false, message: '传送费用不足', effects: [] };
    }

    const targetNode = this.teleportNetwork.nodes.find(n => n.id === toNode);
    if (!targetNode) {
      return { success: false, message: '目标节点不存在', effects: [] };
    }

    const effects: GameEffect[] = [
      {
        type: 'money',
        target: 'player',
        value: -actualCost,
        description: `传送费用 ${actualCost}`
      },
      {
        type: 'position',
        target: 'player',
        value: targetNode.position,
        description: `传送到 ${targetNode.name}`
      }
    ];

    // 应用节点特殊效果
    effects.push(...targetNode.specialEffects);

    return {
      success: true,
      message: `传送成功，到达 ${targetNode.name}`,
      effects,
      newGameState: {
        players: gameState.players.map(p => 
          p.id === playerId ? { 
            ...p, 
            position: targetNode.position,
            money: p.money - actualCost 
          } : p
        )
      }
    };
  }

  /**
   * 触发特殊事件
   */
  triggerSpecialEvent(
    eventType: SpecialEventType,
    gameState: GameState
  ): ActionResult {
    const event = this.generateSpecialEvent(eventType, gameState);
    if (!event) {
      return { success: false, message: '无法生成特殊事件', effects: [] };
    }

    this.activeEvents.set(event.id, event);

    const effects: GameEffect[] = [];
    let message = `特殊事件：${event.name} - ${event.description}`;

    // 应用事件效果
    event.effects.forEach(effect => {
      const targetPlayers = this.getTargetPlayers(effect.target, gameState);
      
      targetPlayers.forEach(player => {
        let effectValue = effect.value;
        
        // 应用生肖加成
        if (effect.zodiacMultiplier) {
          const multiplier = effect.zodiacMultiplier.get(player.zodiac) || 1;
          effectValue *= multiplier;
        }

        effects.push({
          type: effect.type,
          target: 'player',
          value: effectValue,
          description: `${event.name}效果`
        });
      });
    });

    return {
      success: true,
      message,
      effects
    };
  }

  /**
   * 执行财富重分配
   */
  executeWealthRedistribution(gameState: GameState): ActionResult {
    const redistribution = this.wealthRedistribution;
    const players = [...gameState.players];
    
    // 按财富排序
    players.sort((a, b) => b.money - a.money);
    
    const redistributionDetails: PlayerRedistribution[] = [];
    const totalWealth = players.reduce((sum, p) => sum + p.money, 0);
    const averageWealth = totalWealth / players.length;
    
    let totalRedistributed = 0;

    // 从富人征收
    players.forEach(player => {
      if (player.money > redistribution.maximumWealth) {
        const excess = player.money - redistribution.maximumWealth;
        const takeAmount = Math.floor(excess * redistribution.redistributionRate);
        
        redistributionDetails.push({
          playerId: player.id,
          amountTaken: takeAmount,
          amountReceived: 0,
          netChange: -takeAmount
        });
        
        totalRedistributed += takeAmount;
      }
    });

    // 分配给穷人
    const poorPlayers = players.filter(p => p.money < redistribution.minimumWealth);
    if (poorPlayers.length > 0 && totalRedistributed > 0) {
      const redistributionPerPlayer = Math.floor(totalRedistributed / poorPlayers.length);
      
      poorPlayers.forEach(player => {
        const existingDetail = redistributionDetails.find(d => d.playerId === player.id);
        if (existingDetail) {
          existingDetail.amountReceived = redistributionPerPlayer;
          existingDetail.netChange += redistributionPerPlayer;
        } else {
          redistributionDetails.push({
            playerId: player.id,
            amountTaken: 0,
            amountReceived: redistributionPerPlayer,
            netChange: redistributionPerPlayer
          });
        }
      });
    }

    const record: RedistributionRecord = {
      executionDate: Date.now(),
      playersAffected: redistributionDetails.map(d => d.playerId),
      totalRedistributed,
      redistributionDetails
    };

    redistribution.executionHistory.push(record);

    const effects: GameEffect[] = redistributionDetails.map(detail => ({
      type: 'money',
      target: 'player',
      value: detail.netChange,
      description: detail.netChange > 0 ? '财富重分配补贴' : '财富重分配税收'
    }));

    return {
      success: true,
      message: `财富重分配完成，重分配金额：${totalRedistributed}`,
      effects,
      newGameState: {
        players: gameState.players.map(player => {
          const detail = redistributionDetails.find(d => d.playerId === player.id);
          return detail ? { ...player, money: player.money + detail.netChange } : player;
        })
      }
    };
  }

  // 私有辅助方法

  private initializeLotterySystem(): void {
    this.lotterySystem = {
      id: 'zodiac_lottery',
      name: '生肖彩票',
      description: '十二生肖大富翁官方彩票',
      ticketPrice: 1000,
      jackpot: 10000,
      drawFrequency: 10,
      winningNumbers: [],
      participants: [],
      drawHistory: [],
      zodiacBonuses: new Map([
        ['龙', 1.2],
        ['凤', 1.15],
        ['虎', 1.1],
        ['兔', 1.05]
      ]),
      seasonalMultipliers: new Map([
        ['春', 1.1],
        ['夏', 1.0],
        ['秋', 1.05],
        ['冬', 1.15]
      ])
    };
  }

  private initializeTeleportNetwork(): void {
    this.teleportNetwork = {
      id: 'zodiac_portals',
      name: '生肖传送网络',
      nodes: [
        {
          id: 'dragon_temple',
          name: '龙宫传送点',
          position: 5,
          nodeType: 'temple',
          zodiacGuardian: '龙',
          specialEffects: [
            { type: 'money', target: 'player', value: 2000, description: '龙宫祝福' }
          ]
        },
        {
          id: 'tiger_shrine',
          name: '虎啸神坛',
          position: 15,
          nodeType: 'shrine',
          zodiacGuardian: '虎',
          specialEffects: [
            { type: 'dice_modifier', target: 'player', value: 2, description: '虎威加持' }
          ]
        },
        {
          id: 'rabbit_portal',
          name: '玉兔门户',
          position: 25,
          nodeType: 'portal',
          zodiacGuardian: '兔',
          specialEffects: [
            { type: 'skill_enhancement', target: 'player', value: 1, description: '敏捷提升' }
          ]
        }
      ],
      connections: [
        {
          fromNode: 'dragon_temple',
          toNode: 'tiger_shrine',
          cost: 3000,
          requirements: [],
          zodiacBonus: new Map([
            ['龙', 1.5],
            ['虎', 1.3]
          ])
        },
        {
          fromNode: 'tiger_shrine',
          toNode: 'rabbit_portal',
          cost: 2500,
          requirements: [],
          zodiacBonus: new Map([
            ['虎', 1.4],
            ['兔', 1.6]
          ])
        }
      ],
      usageCost: 2000,
      cooldownTime: 3,
      restrictions: ['no_debt', 'not_in_prison'],
      zodiacAccess: new Map([
        ['龙', 'privileged'],
        ['虎', 'privileged'],
        ['兔', 'privileged'],
        ['蛇', 'normal'],
        ['马', 'normal'],
        ['羊', 'restricted']
      ])
    };
  }

  private initializeWealthRedistribution(): void {
    this.wealthRedistribution = {
      id: 'zodiac_redistribution',
      eventName: '生肖财富平衡',
      triggerCondition: 'wealth_gap',
      redistributionRate: 0.2,
      minimumWealth: 10000,
      maximumWealth: 200000,
      executionHistory: []
    };
  }

  private generateWinningNumbers(): number[] {
    const numbers: number[] = [];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 49) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  private calculateLotteryWinners(winningNumbers: number[], gameState: GameState): LotteryWinner[] {
    const winners: LotteryWinner[] = [];
    
    this.lotterySystem.participants.forEach(ticket => {
      const matchedNumbers = ticket.numbers.filter(n => winningNumbers.includes(n)).length;
      
      if (matchedNumbers >= 3) {
        const basePrize = this.calculateLotteryPrize(matchedNumbers, this.lotterySystem.jackpot);
        const finalPrize = Math.floor(basePrize * (ticket.zodiacBonus || 1));
        
        winners.push({
          playerId: ticket.playerId,
          ticketId: ticket.id,
          matchedNumbers,
          prize: finalPrize,
          zodiacBonus: ticket.zodiacBonus || 1
        });
      }
    });
    
    return winners;
  }

  private calculateLotteryPrize(matchedNumbers: number, jackpot: number): number {
    const prizeRates: Record<number, number> = {
      3: 0.05,  // 5%
      4: 0.15,  // 15%
      5: 0.30,  // 30%
      6: 0.50   // 50%
    };
    
    return Math.floor(jackpot * (prizeRates[matchedNumbers] || 0));
  }

  private calculateInsurancePremium(
    policyType: InsurancePolicyType,
    coverage: InsuranceCoverage[],
    player: Player
  ): number {
    const basePremium = coverage.reduce((sum, c) => sum + c.amount * 0.02, 0);
    
    // 根据保险类型调整
    const typeMultipliers: Record<InsurancePolicyType, number> = {
      'property_damage': 1.0,
      'theft_protection': 1.2,
      'business_interruption': 1.5,
      'liability': 0.8,
      'life_insurance': 1.1,
      'zodiac_blessing': 1.8
    };
    
    return Math.floor(basePremium * (typeMultipliers[policyType] || 1.0));
  }

  private calculateDeductible(policyType: InsurancePolicyType, coverage: InsuranceCoverage[]): number {
    const totalCoverage = coverage.reduce((sum, c) => sum + c.amount, 0);
    return Math.floor(totalCoverage * 0.1); // 10% 免赔额
  }

  private calculateMaxPayout(coverage: InsuranceCoverage[]): number {
    return coverage.reduce((sum, c) => sum + c.amount, 0);
  }

  private assessInsuranceRisk(player: Player, gameState: GameState): 'low' | 'medium' | 'high' {
    const riskFactors = [
      player.money < 50000, // 低收入
      player.properties.length > 5, // 房产过多
      // 其他风险因素...
    ];
    
    const riskScore = riskFactors.filter(Boolean).length;
    
    if (riskScore <= 1) return 'low';
    if (riskScore <= 3) return 'medium';
    return 'high';
  }

  private calculateInsuranceDiscounts(player: Player): InsuranceDiscount[] {
    const discounts: InsuranceDiscount[] = [];
    
    // 生肖折扣
    if (['牛', '羊', '狗'].includes(player.zodiac)) {
      discounts.push({
        type: 'zodiac_loyalty',
        amount: 0.1,
        description: '忠实生肖折扣'
      });
    }
    
    return discounts;
  }

  private matchesClaimType(coverageType: CoverageType, claimType: ClaimType): boolean {
    const mapping: Record<CoverageType, ClaimType[]> = {
      'property_loss': ['fire_damage', 'vandalism', 'natural_disaster'],
      'rental_income': ['natural_disaster', 'legal_dispute'],
      'legal_fees': ['legal_dispute'],
      'medical_expenses': ['medical_emergency'],
      'business_loss': ['natural_disaster', 'legal_dispute'],
      'natural_disaster': ['natural_disaster'],
      'zodiac_curse': ['zodiac_incident']
    };
    
    return mapping[coverageType]?.includes(claimType) || false;
  }

  private calculateCreditScore(player: Player, gameState: GameState): number {
    let score = 600; // 基础分数
    
    // 财富影响
    score += Math.min(200, player.money / 1000);
    
    // 房产影响
    score += player.properties.length * 20;
    
    // 其他因素...
    
    return Math.max(300, Math.min(850, score));
  }

  private calculateLoanInterestRate(
    loanType: LoanType,
    creditScore: number,
    collateral: LoanCollateral[]
  ): number {
    let baseRate = 0.08; // 8% 基础利率
    
    // 信用评分影响
    if (creditScore < 600) baseRate += 0.03;
    else if (creditScore > 750) baseRate -= 0.02;
    
    // 贷款类型影响
    const typeRates: Record<LoanType, number> = {
      'personal': 0.02,
      'business': 0.01,
      'mortgage': -0.01,
      'emergency': 0.05,
      'investment': 0.03,
      'zodiac_enhancement': 0.04
    };
    
    baseRate += typeRates[loanType] || 0;
    
    // 抵押品影响
    const collateralValue = collateral.reduce((sum, c) => sum + c.value, 0);
    if (collateralValue > 0) {
      baseRate -= 0.01;
    }
    
    return Math.max(0.03, baseRate);
  }

  private calculateMonthlyPayment(principal: number, annualRate: number, termInMonths: number): number {
    const monthlyRate = annualRate / 12;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / 
           (Math.pow(1 + monthlyRate, termInMonths) - 1);
  }

  private calculateDefaultRisk(player: Player, monthlyPayment: number, gameState: GameState): number {
    const monthlyIncome = this.estimateMonthlyIncome(player, gameState);
    const debtToIncomeRatio = monthlyPayment / Math.max(monthlyIncome, 1);
    
    return Math.min(1, debtToIncomeRatio);
  }

  private estimateMonthlyIncome(player: Player, gameState: GameState): number {
    // 简化的月收入估算
    const rentIncome = player.properties.length * 2000; // 假设每个房产月租2000
    const salaryIncome = 5000; // 基础工资
    
    return rentIncome + salaryIncome;
  }

  private generateSpecialEvent(eventType: SpecialEventType, gameState: GameState): SpecialEvent | null {
    const eventTemplates: Record<SpecialEventType, Partial<SpecialEvent>> = {
      'market_crash': {
        name: '市场崩盘',
        description: '经济危机导致房产价值暴跌',
        effects: [
          {
            type: 'property_value',
            target: 'all_players',
            value: -0.2,
            duration: 5
          }
        ]
      },
      'economic_boom': {
        name: '经济繁荣',
        description: '经济蓬勃发展，所有人受益',
        effects: [
          {
            type: 'money',
            target: 'all_players',
            value: 5000
          }
        ]
      },
      'zodiac_convergence': {
        name: '生肖汇聚',
        description: '十二生肖力量汇聚，带来特殊效果',
        effects: [
          {
            type: 'zodiac_power',
            target: 'all_players',
            value: 1,
            duration: 3
          }
        ]
      }
    };
    
    const template = eventTemplates[eventType];
    if (!template) return null;
    
    return {
      id: `event_${this.nextEventId++}`,
      type: eventType,
      duration: 5,
      probability: 0.8,
      cooldown: 20,
      zodiacAffinity: new Map(),
      seasonalBonus: new Map(),
      triggers: ['random_chance'],
      requirements: [],
      choices: [],
      ...template
    } as SpecialEvent;
  }

  private getTargetPlayers(target: EffectTarget, gameState: GameState): Player[] {
    switch (target) {
      case 'all_players':
        return gameState.players;
      case 'property_owners':
        return gameState.players.filter(p => p.properties.length > 0);
      default:
        return gameState.players;
    }
  }
}

// 辅助类型定义
interface InsuranceDiscount {
  type: string;
  amount: number;
  description: string;
}