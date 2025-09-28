import type { GameState, Player, ZodiacSign } from '../types/game';

export interface BalanceMetrics {
  // 基础经济指标
  averageWealth: number;
  wealthVariance: number;
  giniCoefficient: number;
  economicMobility: number;
  
  // 生肖平衡指标
  zodiacWinRates: Record<ZodiacSign, number>;
  zodiacAverageWealth: Record<ZodiacSign, number>;
  zodiacSkillUsage: Record<ZodiacSign, number>;
  zodiacPropertyOwnership: Record<ZodiacSign, number>;
  
  // 游戏进度指标
  averageGameDuration: number;
  turnEfficiency: number;
  playerEngagement: number;
  earlyGameAdvantage: number;
  
  // 特殊系统指标
  prisonImpact: number;
  lotteryROI: number;
  insuranceBenefit: number;
  bankingUsage: number;
  
  // 技能平衡指标
  skillEffectiveness: Record<string, number>;
  skillCooldownEfficiency: Record<string, number>;
  skillCombinations: Record<string, number>;
}

export interface BalanceAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'economy' | 'zodiac' | 'skill' | 'progression' | 'special';
  metric: string;
  currentValue: number;
  targetValue: number;
  deviation: number;
  description: string;
  suggestions: string[];
}

export interface BalanceConfig {
  // 经济平衡目标
  targetGiniCoefficient: number;
  maxWealthVariance: number;
  targetGameDuration: number;
  
  // 生肖平衡目标
  maxZodiacWinRateDeviation: number;
  targetZodiacBalance: number;
  
  // 技能平衡目标
  maxSkillEffectivenessDeviation: number;
  targetSkillUsageRate: number;
  
  // 特殊系统目标
  targetPrisonImpact: number;
  targetLotteryROI: number;
}

export class GameBalanceAnalyzer {
  private gameHistory: GameState[] = [];
  private config: BalanceConfig;
  private currentMetrics: BalanceMetrics | null = null;

  constructor(config: Partial<BalanceConfig> = {}) {
    this.config = {
      // 默认平衡目标
      targetGiniCoefficient: 0.4, // 适中的财富分配不平等
      maxWealthVariance: 0.6,
      targetGameDuration: 3600, // 60分钟
      
      maxZodiacWinRateDeviation: 0.15, // 15%偏差范围
      targetZodiacBalance: 0.083, // 12生肖各占8.33%
      
      maxSkillEffectivenessDeviation: 0.2,
      targetSkillUsageRate: 0.7,
      
      targetPrisonImpact: 0.1, // 监狱对游戏结果的影响应适中
      targetLotteryROI: 0.85, // 彩票回报率
      
      ...config
    };
  }

  // 添加游戏状态到历史记录
  addGameState(gameState: GameState): void {
    this.gameHistory.push(JSON.parse(JSON.stringify(gameState)));
    
    // 保持历史记录在合理范围内
    if (this.gameHistory.length > 1000) {
      this.gameHistory = this.gameHistory.slice(-1000);
    }
  }

  // 分析当前游戏平衡
  analyzeBalance(gameState: GameState): BalanceMetrics {
    const players = gameState.players;
    
    const metrics: BalanceMetrics = {
      // 计算基础经济指标
      ...this.calculateEconomicMetrics(players),
      
      // 计算生肖平衡指标
      ...this.calculateZodiacMetrics(players),
      
      // 计算游戏进度指标
      ...this.calculateProgressionMetrics(gameState),
      
      // 计算特殊系统指标
      ...this.calculateSpecialSystemMetrics(gameState),
      
      // 计算技能平衡指标
      ...this.calculateSkillMetrics(players)
    };

    this.currentMetrics = metrics;
    return metrics;
  }

  // 计算经济指标
  private calculateEconomicMetrics(players: Player[]) {
    const wealths = players.map(p => p.money + (p.properties.length * 2000)); // 简化财产估值
    const averageWealth = wealths.reduce((sum, w) => sum + w, 0) / wealths.length;
    
    // 计算方差
    const variance = wealths.reduce((sum, w) => sum + Math.pow(w - averageWealth, 2), 0) / wealths.length;
    const wealthVariance = variance / (averageWealth * averageWealth);
    
    // 计算基尼系数
    const giniCoefficient = this.calculateGiniCoefficient(wealths);
    
    // 经济流动性（基于财富变化）
    const economicMobility = this.calculateEconomicMobility(players);

    return {
      averageWealth,
      wealthVariance,
      giniCoefficient,
      economicMobility
    };
  }

  // 计算生肖指标
  private calculateZodiacMetrics(players: Player[]) {
    const zodiacWinRates: Partial<Record<ZodiacSign, number>> = {};
    const zodiacAverageWealth: Partial<Record<ZodiacSign, number>> = {};
    const zodiacSkillUsage: Partial<Record<ZodiacSign, number>> = {};
    const zodiacPropertyOwnership: Partial<Record<ZodiacSign, number>> = {};

    // 按生肖分组分析
    const zodiacGroups = this.groupPlayersByZodiac(players);
    
    for (const [zodiac, zodiacPlayers] of Object.entries(zodiacGroups)) {
      const playerCount = zodiacPlayers.length;
      if (playerCount === 0) continue;

      // 平均财富
      const avgWealth = zodiacPlayers.reduce((sum, p) => sum + p.money, 0) / playerCount;
      zodiacAverageWealth[zodiac as ZodiacSign] = avgWealth;

      // 技能使用率
      const skillUsage = zodiacPlayers.reduce((sum, p) => sum + p.statistics.skillsUsed, 0) / playerCount;
      zodiacSkillUsage[zodiac as ZodiacSign] = skillUsage;

      // 房产拥有量
      const propertyCount = zodiacPlayers.reduce((sum, p) => sum + p.properties.length, 0) / playerCount;
      zodiacPropertyOwnership[zodiac as ZodiacSign] = propertyCount;

      // 胜率（需要从历史数据计算）
      zodiacWinRates[zodiac as ZodiacSign] = this.calculateZodiacWinRate(zodiac as ZodiacSign);
    }

    return {
      zodiacWinRates: zodiacWinRates as Record<ZodiacSign, number>,
      zodiacAverageWealth: zodiacAverageWealth as Record<ZodiacSign, number>,
      zodiacSkillUsage: zodiacSkillUsage as Record<ZodiacSign, number>,
      zodiacPropertyOwnership: zodiacPropertyOwnership as Record<ZodiacSign, number>
    };
  }

  // 计算游戏进度指标
  private calculateProgressionMetrics(gameState: GameState) {
    const currentTime = Date.now();
    const gameStartTime = gameState.startTime;
    const currentDuration = (currentTime - gameStartTime) / 1000; // 秒

    // 预估游戏总时长
    const progressRatio = Math.max(0.1, gameState.round / 100); // 假设100回合为完整游戏
    const estimatedTotalDuration = currentDuration / progressRatio;

    // 回合效率（每回合平均时间）
    const turnEfficiency = gameState.round > 0 ? currentDuration / gameState.round : 0;

    // 玩家参与度（基于操作频率）
    const totalActions = gameState.players.reduce((sum, p) => 
      sum + p.statistics.turnsPlayed + p.statistics.skillsUsed, 0
    );
    const playerEngagement = totalActions / (gameState.players.length * Math.max(1, gameState.round));

    // 早期游戏优势（前期领先者的持续优势）
    const earlyGameAdvantage = this.calculateEarlyGameAdvantage(gameState);

    return {
      averageGameDuration: estimatedTotalDuration,
      turnEfficiency,
      playerEngagement,
      earlyGameAdvantage
    };
  }

  // 计算特殊系统指标
  private calculateSpecialSystemMetrics(gameState: GameState) {
    let prisonImpact = 0;
    let lotteryROI = 0;
    let insuranceBenefit = 0;
    let bankingUsage = 0;

    if (gameState.specialSystems) {
      // 监狱系统影响
      const prisonRecords = Object.keys(gameState.specialSystems.prison?.records || {}).length;
      prisonImpact = prisonRecords / Math.max(1, gameState.players.length);

      // 彩票系统ROI
      if (gameState.specialSystems.lottery) {
        const totalTickets = gameState.specialSystems.lottery.reduce((sum, lottery) => 
          sum + lottery.participants.length, 0
        );
        const totalJackpot = gameState.specialSystems.lottery.reduce((sum, lottery) => 
          sum + lottery.jackpot, 0
        );
        lotteryROI = totalTickets > 0 ? totalJackpot / (totalTickets * 100) : 0; // 假设票价100
      }

      // 保险收益
      if (gameState.specialSystems.insurance) {
        insuranceBenefit = gameState.specialSystems.insurance.length / gameState.players.length;
      }

      // 银行使用率
      if (gameState.specialSystems.banking) {
        const totalLoans = gameState.specialSystems.banking.loans.length;
        const totalDeposits = gameState.specialSystems.banking.deposits.length;
        bankingUsage = (totalLoans + totalDeposits) / gameState.players.length;
      }
    }

    return {
      prisonImpact,
      lotteryROI,
      insuranceBenefit,
      bankingUsage
    };
  }

  // 计算技能指标
  private calculateSkillMetrics(players: Player[]) {
    const skillEffectiveness: Record<string, number> = {};
    const skillCooldownEfficiency: Record<string, number> = {};
    const skillCombinations: Record<string, number> = {};

    // 收集所有技能数据
    const allSkills = players.flatMap(p => p.skills);
    const skillGroups = this.groupBy(allSkills, skill => skill.id);

    for (const [skillId, skills] of Object.entries(skillGroups)) {
      // 技能效果评估（基于使用频率和收益）
      const usageCount = skills.reduce((sum, skill) => 
        sum + (skill.lastUsed ? 1 : 0), 0
      );
      skillEffectiveness[skillId] = usageCount / skills.length;

      // 冷却效率
      const avgCooldown = skills.reduce((sum, skill) => sum + skill.cooldown, 0) / skills.length;
      skillCooldownEfficiency[skillId] = avgCooldown > 0 ? 1 / avgCooldown : 1;
    }

    return {
      skillEffectiveness,
      skillCooldownEfficiency,
      skillCombinations
    };
  }

  // 检测平衡问题
  detectBalanceIssues(metrics: BalanceMetrics): BalanceAlert[] {
    const alerts: BalanceAlert[] = [];

    // 检查基尼系数
    if (Math.abs(metrics.giniCoefficient - this.config.targetGiniCoefficient) > 0.1) {
      alerts.push({
        severity: metrics.giniCoefficient > 0.6 ? 'high' : 'medium',
        category: 'economy',
        metric: 'giniCoefficient',
        currentValue: metrics.giniCoefficient,
        targetValue: this.config.targetGiniCoefficient,
        deviation: Math.abs(metrics.giniCoefficient - this.config.targetGiniCoefficient),
        description: '财富分配不平衡',
        suggestions: [
          '调整起始资金分配',
          '增加财富重分配机制',
          '平衡房产价格和租金'
        ]
      });
    }

    // 检查生肖胜率平衡
    const zodiacWinRates = Object.values(metrics.zodiacWinRates);
    const winRateVariance = this.calculateVariance(zodiacWinRates);
    if (winRateVariance > this.config.maxZodiacWinRateDeviation) {
      alerts.push({
        severity: 'high',
        category: 'zodiac',
        metric: 'zodiacWinRates',
        currentValue: winRateVariance,
        targetValue: this.config.maxZodiacWinRateDeviation,
        deviation: winRateVariance - this.config.maxZodiacWinRateDeviation,
        description: '生肖胜率不平衡',
        suggestions: [
          '调整生肖技能效果',
          '重新平衡生肖特殊能力',
          '修改生肖时间加成'
        ]
      });
    }

    // 检查游戏时长
    if (Math.abs(metrics.averageGameDuration - this.config.targetGameDuration) > 900) { // 15分钟偏差
      alerts.push({
        severity: 'medium',
        category: 'progression',
        metric: 'averageGameDuration',
        currentValue: metrics.averageGameDuration,
        targetValue: this.config.targetGameDuration,
        deviation: Math.abs(metrics.averageGameDuration - this.config.targetGameDuration),
        description: '游戏时长偏离目标',
        suggestions: [
          '调整回合限制',
          '修改胜利条件',
          '优化回合流程'
        ]
      });
    }

    return alerts;
  }

  // 生成平衡建议
  generateBalanceRecommendations(metrics: BalanceMetrics, alerts: BalanceAlert[]): string[] {
    const recommendations: string[] = [];

    // 基于警告生成建议
    alerts.forEach(alert => {
      recommendations.push(...alert.suggestions);
    });

    // 基于指标趋势生成额外建议
    if (metrics.playerEngagement < 0.5) {
      recommendations.push('增加互动元素提高玩家参与度');
    }

    if (metrics.earlyGameAdvantage > 0.7) {
      recommendations.push('减少早期优势的持续影响');
    }

    // 去重并排序
    return [...new Set(recommendations)].sort();
  }

  // 辅助方法
  private calculateGiniCoefficient(values: number[]): number {
    const sortedValues = [...values].sort((a, b) => a - b);
    const n = sortedValues.length;
    const totalSum = sortedValues.reduce((sum, val) => sum + val, 0);
    
    if (totalSum === 0) return 0;
    
    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * sortedValues[i];
    }
    
    return gini / (n * totalSum);
  }

  private calculateEconomicMobility(players: Player[]): number {
    // 简化的经济流动性计算
    // 在实际实现中，这需要基于历史数据
    return 0.5; // 占位符
  }

  private calculateZodiacWinRate(zodiac: ZodiacSign): number {
    // 基于历史游戏数据计算胜率
    // 这里使用简化的计算
    return 1 / 12; // 默认平均胜率
  }

  private calculateEarlyGameAdvantage(gameState: GameState): number {
    // 计算早期领先者的持续优势
    // 简化实现
    return 0.5;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private groupPlayersByZodiac(players: Player[]): Record<string, Player[]> {
    return this.groupBy(players, player => player.zodiacSign);
  }

  private groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }

  // 获取当前指标
  getCurrentMetrics(): BalanceMetrics | null {
    return this.currentMetrics;
  }

  // 更新配置
  updateConfig(newConfig: Partial<BalanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // 获取配置
  getConfig(): BalanceConfig {
    return { ...this.config };
  }
}