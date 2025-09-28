import { GameState, ActionResult, ZodiacSign } from '../types/game';
import { PrisonSystem } from '../prison/PrisonSystem';
import { SpecialMechanicsSystem } from './SpecialMechanicsSystem';

export interface SpecialSystemConfig {
  prisonEnabled: boolean;
  lotteryEnabled: boolean;
  insuranceEnabled: boolean;
  bankingEnabled: boolean;
  teleportationEnabled: boolean;
  wealthRedistributionEnabled: boolean;
  specialEventsEnabled: boolean;
  zodiacBonusMultiplier: number;
}

export interface SystemStatus {
  prison: {
    totalPrisoners: number;
    totalSentences: number;
    totalReleases: number;
  };
  lottery: {
    totalTicketsSold: number;
    totalJackpot: number;
    totalWinners: number;
  };
  insurance: {
    totalPolicies: number;
    totalClaims: number;
    totalPayout: number;
  };
  banking: {
    totalLoans: number;
    totalDeposits: number;
    totalInterest: number;
  };
  teleportation: {
    totalTeleports: number;
    totalNodes: number;
  };
}

export class UnifiedSpecialSystemManager {
  private prisonSystem: PrisonSystem;
  private specialMechanicsSystem: SpecialMechanicsSystem;
  private config: SpecialSystemConfig;
  private systemStatus: SystemStatus;

  constructor(config: Partial<SpecialSystemConfig> = {}) {
    this.prisonSystem = new PrisonSystem();
    this.specialMechanicsSystem = new SpecialMechanicsSystem();
    
    this.config = {
      prisonEnabled: true,
      lotteryEnabled: true,
      insuranceEnabled: true,
      bankingEnabled: true,
      teleportationEnabled: true,
      wealthRedistributionEnabled: true,
      specialEventsEnabled: true,
      zodiacBonusMultiplier: 1.0,
      ...config
    };

    this.systemStatus = {
      prison: { totalPrisoners: 0, totalSentences: 0, totalReleases: 0 },
      lottery: { totalTicketsSold: 0, totalJackpot: 0, totalWinners: 0 },
      insurance: { totalPolicies: 0, totalClaims: 0, totalPayout: 0 },
      banking: { totalLoans: 0, totalDeposits: 0, totalInterest: 0 },
      teleportation: { totalTeleports: 0, totalNodes: 0 }
    };
  }

  // 统一的玩家行动处理
  handlePlayerAction(
    playerId: string,
    actionType: 'prison' | 'lottery' | 'insurance' | 'banking' | 'teleport' | 'special',
    actionData: any,
    gameState: GameState
  ): ActionResult {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return {
        success: false,
        message: '玩家不存在',
        gameState
      };
    }

    // 检查生肖特殊时间加成
    const zodiacBonus = this.calculateZodiacTimeBonus(player.zodiac, gameState);
    
    switch (actionType) {
      case 'prison':
        if (!this.config.prisonEnabled) {
          return { success: false, message: '监狱系统未启用', gameState };
        }
        return this.handlePrisonAction(playerId, actionData, gameState);

      case 'lottery':
        if (!this.config.lotteryEnabled) {
          return { success: false, message: '彩票系统未启用', gameState };
        }
        return this.handleLotteryAction(playerId, actionData, gameState, zodiacBonus);

      case 'insurance':
        if (!this.config.insuranceEnabled) {
          return { success: false, message: '保险系统未启用', gameState };
        }
        return this.handleInsuranceAction(playerId, actionData, gameState, zodiacBonus);

      case 'banking':
        if (!this.config.bankingEnabled) {
          return { success: false, message: '银行系统未启用', gameState };
        }
        return this.handleBankingAction(playerId, actionData, gameState, zodiacBonus);

      case 'teleport':
        if (!this.config.teleportationEnabled) {
          return { success: false, message: '传送系统未启用', gameState };
        }
        return this.handleTeleportAction(playerId, actionData, gameState, zodiacBonus);

      case 'special':
        if (!this.config.specialEventsEnabled) {
          return { success: false, message: '特殊事件系统未启用', gameState };
        }
        return this.handleSpecialEventAction(playerId, actionData, gameState, zodiacBonus);

      default:
        return {
          success: false,
          message: '未知的行动类型',
          gameState
        };
    }
  }

  // 计算生肖时间加成
  private calculateZodiacTimeBonus(zodiacSign: ZodiacSign, gameState: GameState): number {
    const currentHour = new Date().getHours();
    const zodiacHours: Record<ZodiacSign, number[]> = {
      '鼠': [23, 0, 1],
      '牛': [1, 2, 3],
      '虎': [3, 4, 5],
      '兔': [5, 6, 7],
      '龙': [7, 8, 9],
      '蛇': [9, 10, 11],
      '马': [11, 12, 13],
      '羊': [13, 14, 15],
      '猴': [15, 16, 17],
      '鸡': [17, 18, 19],
      '狗': [19, 20, 21],
      '猪': [21, 22, 23]
    };

    const zodiacHourRange = zodiacHours[zodiacSign];
    if (!zodiacHourRange) {
      console.warn(`Unknown zodiac sign: ${zodiacSign}`);
      return 1.0;
    }
    const isZodiacTime = zodiacHourRange.includes(currentHour);
    return isZodiacTime ? this.config.zodiacBonusMultiplier : 1.0;
  }

  // 监狱行动处理
  private handlePrisonAction(playerId: string, actionData: any, gameState: GameState): ActionResult {
    const { action, ...params } = actionData;
    
    switch (action) {
      case 'arrest':
        return this.prisonSystem.arrestPlayer(playerId, params.crime, gameState);
      case 'release':
        return this.prisonSystem.attemptRelease(playerId, params.releaseType, gameState);
      case 'processTurn':
        return this.prisonSystem.processPrisonTurn(playerId, gameState);
      default:
        return { success: false, message: '未知的监狱行动', gameState };
    }
  }

  // 彩票行动处理
  private handleLotteryAction(playerId: string, actionData: any, gameState: GameState, zodiacBonus: number): ActionResult {
    const { action, ...params } = actionData;
    
    switch (action) {
      case 'buyTicket':
        return this.specialMechanicsSystem.purchaseLotteryTicket(playerId, params.numbers, gameState);
      case 'drawWinner':
        return this.specialMechanicsSystem.conductLotteryDraw(params.lotteryId, gameState);
      default:
        return { success: false, message: '未知的彩票行动', gameState };
    }
  }

  // 保险行动处理
  private handleInsuranceAction(playerId: string, actionData: any, gameState: GameState, zodiacBonus: number): ActionResult {
    const { action, ...params } = actionData;
    
    switch (action) {
      case 'purchase':
        return this.specialMechanicsSystem.purchaseInsurance(playerId, params.policyType, params.coverage, gameState);
      case 'claim':
        return this.specialMechanicsSystem.fileInsuranceClaim(playerId, params.policyId, params.claimType, params.amount, gameState);
      default:
        return { success: false, message: '未知的保险行动', gameState };
    }
  }

  // 银行行动处理
  private handleBankingAction(playerId: string, actionData: any, gameState: GameState, zodiacBonus: number): ActionResult {
    const { action, ...params } = actionData;
    
    switch (action) {
      case 'loan':
        return this.specialMechanicsSystem.applyForLoan(playerId, params.loanType, params.amount, params.term, params.collateral, gameState);
      case 'deposit':
        return this.specialMechanicsSystem.makeDeposit(playerId, params.amount, params.term, gameState);
      case 'repay':
        return this.specialMechanicsSystem.repayLoan(playerId, params.loanId, params.amount, gameState);
      default:
        return { success: false, message: '未知的银行行动', gameState };
    }
  }

  // 传送行动处理
  private handleTeleportAction(playerId: string, actionData: any, gameState: GameState, zodiacBonus: number): ActionResult {
    const { action, ...params } = actionData;
    
    switch (action) {
      case 'teleport':
        return this.specialMechanicsSystem.useTeleport(playerId, params.fromNode, params.toNode, gameState);
      case 'createNode':
        return this.specialMechanicsSystem.createTeleportNode(params.position, params.nodeType, params.requirements, gameState);
      default:
        return { success: false, message: '未知的传送行动', gameState };
    }
  }

  // 特殊事件行动处理
  private handleSpecialEventAction(playerId: string, actionData: any, gameState: GameState, zodiacBonus: number): ActionResult {
    const { action, ...params } = actionData;
    
    switch (action) {
      case 'redistribute':
        return this.specialMechanicsSystem.triggerWealthRedistribution(params.redistributionType, gameState);
      case 'specialEvent':
        return this.specialMechanicsSystem.triggerSpecialEvent(params.eventType, params.targetPlayerId || playerId, gameState);
      default:
        return { success: false, message: '未知的特殊事件行动', gameState };
    }
  }

  // 系统状态更新
  updateSystemStatus(gameState: GameState): void {
    // 更新监狱统计
    if (gameState.specialSystems?.prison) {
      this.systemStatus.prison.totalPrisoners = Object.keys(gameState.specialSystems.prison.records || {}).length;
    }

    // 更新彩票统计
    if (gameState.specialSystems?.lottery) {
      this.systemStatus.lottery.totalJackpot = gameState.specialSystems.lottery.reduce(
        (sum, lottery) => sum + lottery.jackpot, 0
      );
    }

    // 更新其他系统统计...
  }

  // 获取系统状态
  getSystemStatus(): SystemStatus {
    return { ...this.systemStatus };
  }

  // 获取配置
  getConfig(): SpecialSystemConfig {
    return { ...this.config };
  }

  // 更新配置
  updateConfig(newConfig: Partial<SpecialSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 重置所有系统
  resetAllSystems(gameState: GameState): ActionResult {
    const newGameState = { ...gameState };
    
    // 清除所有特殊系统数据
    if (newGameState.specialSystems) {
      newGameState.specialSystems = {
        prison: { records: {}, statistics: { totalArrests: 0, totalReleases: 0, totalRevenue: 0 } },
        lottery: [],
        insurance: [],
        banking: { loans: [], deposits: [], creditScores: {} },
        teleportation: { nodes: [], network: {} },
        wealthRedistribution: { history: [] },
        specialEvents: { history: [] }
      };
    }

    // 重置统计数据
    this.systemStatus = {
      prison: { totalPrisoners: 0, totalSentences: 0, totalReleases: 0 },
      lottery: { totalTicketsSold: 0, totalJackpot: 0, totalWinners: 0 },
      insurance: { totalPolicies: 0, totalClaims: 0, totalPayout: 0 },
      banking: { totalLoans: 0, totalDeposits: 0, totalInterest: 0 },
      teleportation: { totalTeleports: 0, totalNodes: 0 }
    };

    return {
      success: true,
      message: '所有特殊系统已重置',
      gameState: newGameState
    };
  }
}