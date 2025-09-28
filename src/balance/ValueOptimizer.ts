import type { GameState, Player, ZodiacSign } from '../types/game';
import type { BalanceMetrics, BalanceAlert } from './GameBalanceAnalyzer';

export interface OptimizationTarget {
  parameter: string;
  category: 'economy' | 'zodiac' | 'skill' | 'progression' | 'special';
  currentValue: number;
  targetValue: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  adjustmentRange: [number, number]; // [min, max]
  impactWeight: number; // 对整体平衡的影响权重
}

export interface OptimizationResult {
  parameter: string;
  oldValue: number;
  newValue: number;
  improvement: number;
  confidence: number;
  reasoning: string;
}

export interface GameParameters {
  // 经济参数
  startingMoney: number;
  passingGoBonus: number;
  propertyPriceMultiplier: number;
  rentMultiplier: number;
  taxRate: number;
  
  // 生肖参数
  zodiacSkillCooldownMultiplier: Record<ZodiacSign, number>;
  zodiacMoneyBonus: Record<ZodiacSign, number>;
  zodiacPropertyDiscount: Record<ZodiacSign, number>;
  
  // 技能参数
  skillCooldownBase: number;
  skillEffectMultiplier: number;
  maxSkillsPerPlayer: number;
  
  // 特殊系统参数
  lotteryTicketPrice: number;
  lotteryJackpotMultiplier: number;
  insurancePremiumRate: number;
  bankLoanInterestRate: number;
  prisonBailMultiplier: number;
  
  // 游戏进度参数
  maxRounds: number;
  turnTimeLimit: number;
  winConditionThreshold: number;
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  targetMetrics: string[];
  parameterWeights: Record<string, number>;
  convergenceThreshold: number;
  maxIterations: number;
}

export class ValueOptimizer {
  private currentParameters: GameParameters;
  private originalParameters: GameParameters;
  private optimizationHistory: OptimizationResult[] = [];
  private strategy: OptimizationStrategy;

  constructor(initialParameters: GameParameters, strategy?: OptimizationStrategy) {
    this.currentParameters = { ...initialParameters };
    this.originalParameters = { ...initialParameters };
    
    this.strategy = strategy || this.getDefaultStrategy();
  }

  // 默认优化策略
  private getDefaultStrategy(): OptimizationStrategy {
    return {
      name: 'balanced_gameplay',
      description: '平衡游戏体验优化策略',
      targetMetrics: ['giniCoefficient', 'zodiacWinRates', 'averageGameDuration'],
      parameterWeights: {
        startingMoney: 0.3,
        propertyPriceMultiplier: 0.25,
        rentMultiplier: 0.2,
        zodiacMoneyBonus: 0.15,
        skillCooldownBase: 0.1
      },
      convergenceThreshold: 0.05,
      maxIterations: 100
    };
  }

  // 基于平衡分析优化参数
  optimizeParameters(
    balanceMetrics: BalanceMetrics, 
    alerts: BalanceAlert[]
  ): OptimizationResult[] {
    const optimizationTargets = this.identifyOptimizationTargets(balanceMetrics, alerts);
    const results: OptimizationResult[] = [];

    for (const target of optimizationTargets) {
      const result = this.optimizeParameter(target, balanceMetrics);
      if (result) {
        results.push(result);
        this.applyOptimization(result);
      }
    }

    this.optimizationHistory.push(...results);
    return results;
  }

  // 识别需要优化的目标
  private identifyOptimizationTargets(
    metrics: BalanceMetrics, 
    alerts: BalanceAlert[]
  ): OptimizationTarget[] {
    const targets: OptimizationTarget[] = [];

    // 基于警告生成优化目标
    alerts.forEach(alert => {
      const target = this.alertToOptimizationTarget(alert, metrics);
      if (target) {
        targets.push(target);
      }
    });

    // 基于指标偏差生成额外目标
    targets.push(...this.generateMetricBasedTargets(metrics));

    // 按优先级排序
    return targets.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // 将警告转换为优化目标
  private alertToOptimizationTarget(
    alert: BalanceAlert, 
    metrics: BalanceMetrics
  ): OptimizationTarget | null {
    switch (alert.category) {
      case 'economy':
        if (alert.metric === 'giniCoefficient') {
          return {
            parameter: 'startingMoney',
            category: 'economy',
            currentValue: this.currentParameters.startingMoney,
            targetValue: this.calculateTargetStartingMoney(alert.targetValue, alert.currentValue),
            priority: alert.severity as any,
            adjustmentRange: [5000, 20000],
            impactWeight: 0.8
          };
        }
        break;
      
      case 'zodiac':
        if (alert.metric === 'zodiacWinRates') {
          return {
            parameter: 'zodiacMoneyBonus',
            category: 'zodiac',
            currentValue: this.getAverageZodiacBonus(),
            targetValue: this.calculateBalancedZodiacBonus(),
            priority: alert.severity as any,
            adjustmentRange: [0.8, 1.2],
            impactWeight: 0.7
          };
        }
        break;
      
      case 'progression':
        if (alert.metric === 'averageGameDuration') {
          return {
            parameter: 'maxRounds',
            category: 'progression',
            currentValue: this.currentParameters.maxRounds,
            targetValue: this.calculateTargetMaxRounds(alert.targetValue, alert.currentValue),
            priority: alert.severity as any,
            adjustmentRange: [50, 200],
            impactWeight: 0.6
          };
        }
        break;
    }

    return null;
  }

  // 基于指标生成优化目标
  private generateMetricBasedTargets(metrics: BalanceMetrics): OptimizationTarget[] {
    const targets: OptimizationTarget[] = [];

    // 如果玩家参与度低，调整技能冷却
    if (metrics.playerEngagement < 0.5) {
      targets.push({
        parameter: 'skillCooldownBase',
        category: 'skill',
        currentValue: this.currentParameters.skillCooldownBase,
        targetValue: Math.max(1, this.currentParameters.skillCooldownBase * 0.8),
        priority: 'medium',
        adjustmentRange: [1, 10],
        impactWeight: 0.4
      });
    }

    // 如果彩票ROI过低，调整奖金倍数
    if (metrics.lotteryROI < 0.7) {
      targets.push({
        parameter: 'lotteryJackpotMultiplier',
        category: 'special',
        currentValue: this.currentParameters.lotteryJackpotMultiplier,
        targetValue: this.currentParameters.lotteryJackpotMultiplier * 1.2,
        priority: 'low',
        adjustmentRange: [1.0, 3.0],
        impactWeight: 0.2
      });
    }

    return targets;
  }

  // 优化单个参数
  private optimizeParameter(
    target: OptimizationTarget, 
    metrics: BalanceMetrics
  ): OptimizationResult | null {
    const parameterPath = target.parameter;
    const oldValue = target.currentValue;
    
    // 使用梯度下降或二分搜索找到最优值
    const newValue = this.findOptimalValue(target, metrics);
    
    if (Math.abs(newValue - oldValue) < 0.01) {
      return null; // 变化太小，不值得调整
    }

    const improvement = this.calculateImprovement(target, oldValue, newValue);
    const confidence = this.calculateConfidence(target, improvement);

    return {
      parameter: parameterPath,
      oldValue,
      newValue,
      improvement,
      confidence,
      reasoning: this.generateOptimizationReasoning(target, oldValue, newValue)
    };
  }

  // 寻找最优值
  private findOptimalValue(target: OptimizationTarget, metrics: BalanceMetrics): number {
    const [minValue, maxValue] = target.adjustmentRange;
    const currentValue = target.currentValue;
    const targetValue = target.targetValue;

    // 简化的优化算法：向目标值移动
    const direction = targetValue > currentValue ? 1 : -1;
    const stepSize = Math.abs(targetValue - currentValue) * 0.1;
    
    let candidate = currentValue + direction * stepSize;
    
    // 确保在允许范围内
    candidate = Math.max(minValue, Math.min(maxValue, candidate));
    
    return candidate;
  }

  // 应用优化结果
  private applyOptimization(result: OptimizationResult): void {
    const parameter = result.parameter as keyof GameParameters;
    
    if (parameter in this.currentParameters) {
      (this.currentParameters as any)[parameter] = result.newValue;
    }
  }

  // 计算改进程度
  private calculateImprovement(
    target: OptimizationTarget, 
    oldValue: number, 
    newValue: number
  ): number {
    const targetValue = target.targetValue;
    const oldDistance = Math.abs(oldValue - targetValue);
    const newDistance = Math.abs(newValue - targetValue);
    
    if (oldDistance === 0) return 0;
    
    return (oldDistance - newDistance) / oldDistance;
  }

  // 计算置信度
  private calculateConfidence(target: OptimizationTarget, improvement: number): number {
    // 基于改进程度、优先级和影响权重计算置信度
    const priorityWeight = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 }[target.priority];
    return Math.min(1.0, improvement * priorityWeight * target.impactWeight);
  }

  // 生成优化推理
  private generateOptimizationReasoning(
    target: OptimizationTarget, 
    oldValue: number, 
    newValue: number
  ): string {
    const change = newValue - oldValue;
    const direction = change > 0 ? '增加' : '减少';
    const percentage = Math.abs(change / oldValue * 100).toFixed(1);
    
    return `${direction} ${target.parameter} ${percentage}% (${oldValue} → ${newValue}) 以改善 ${target.category} 平衡`;
  }

  // 模拟参数调整效果
  simulateParameterAdjustment(
    parameter: keyof GameParameters,
    newValue: number,
    sampleGameStates: GameState[]
  ): { beforeMetrics: BalanceMetrics, afterMetrics: BalanceMetrics } {
    // 保存当前参数
    const oldValue = this.currentParameters[parameter];
    
    // 临时应用新参数
    (this.currentParameters as any)[parameter] = newValue;
    
    // 模拟计算前后的平衡指标
    // 这里需要一个简化的模拟器
    const beforeMetrics = this.simulateBalanceMetrics(sampleGameStates, oldValue, parameter);
    const afterMetrics = this.simulateBalanceMetrics(sampleGameStates, newValue, parameter);
    
    // 恢复原参数
    (this.currentParameters as any)[parameter] = oldValue;
    
    return { beforeMetrics, afterMetrics };
  }

  // 简化的平衡指标模拟
  private simulateBalanceMetrics(
    gameStates: GameState[], 
    parameterValue: number, 
    parameter: keyof GameParameters
  ): BalanceMetrics {
    // 这里应该有更复杂的模拟逻辑
    // 为了简化，返回基本的模拟结果
    return {
      averageWealth: 10000 * (parameter === 'startingMoney' ? parameterValue / 10000 : 1),
      wealthVariance: 0.5,
      giniCoefficient: 0.4,
      economicMobility: 0.5,
      zodiacWinRates: this.getDefaultZodiacWinRates(),
      zodiacAverageWealth: this.getDefaultZodiacWealth(),
      zodiacSkillUsage: this.getDefaultZodiacSkillUsage(),
      zodiacPropertyOwnership: this.getDefaultZodiacPropertyOwnership(),
      averageGameDuration: 3600,
      turnEfficiency: 60,
      playerEngagement: 0.7,
      earlyGameAdvantage: 0.5,
      prisonImpact: 0.1,
      lotteryROI: 0.85,
      insuranceBenefit: 0.3,
      bankingUsage: 0.4,
      skillEffectiveness: {},
      skillCooldownEfficiency: {},
      skillCombinations: {}
    };
  }

  // 批量优化
  batchOptimize(
    gameStatesHistory: GameState[], 
    targetMetrics: Partial<BalanceMetrics>
  ): OptimizationResult[] {
    const results: OptimizationResult[] = [];
    let currentBestScore = 0;
    let iterations = 0;

    while (iterations < this.strategy.maxIterations) {
      // 计算当前配置的得分
      const currentScore = this.evaluateParameterSet(gameStatesHistory, targetMetrics);
      
      if (currentScore > currentBestScore) {
        currentBestScore = currentScore;
      }
      
      // 检查收敛
      if (iterations > 10 && Math.abs(currentScore - currentBestScore) < this.strategy.convergenceThreshold) {
        break;
      }
      
      // 尝试参数调整
      const adjustments = this.generateParameterAdjustments();
      for (const adjustment of adjustments) {
        const result = this.testParameterAdjustment(adjustment, gameStatesHistory, targetMetrics);
        if (result && result.improvement > 0) {
          results.push(result);
          this.applyOptimization(result);
        }
      }
      
      iterations++;
    }

    return results;
  }

  // 评估参数集合
  private evaluateParameterSet(
    gameStates: GameState[], 
    targetMetrics: Partial<BalanceMetrics>
  ): number {
    // 简化的评估函数
    let score = 0;
    
    // 基于目标指标计算得分
    for (const [metric, targetValue] of Object.entries(targetMetrics)) {
      if (targetValue !== undefined) {
        // 模拟当前参数下的指标值
        const simulatedValue = this.simulateMetricValue(metric, gameStates);
        const distance = Math.abs(simulatedValue - targetValue);
        score += 1 / (1 + distance); // 距离越近得分越高
      }
    }
    
    return score;
  }

  // 生成参数调整方案
  private generateParameterAdjustments(): Array<{parameter: keyof GameParameters, adjustment: number}> {
    const adjustments: Array<{parameter: keyof GameParameters, adjustment: number}> = [];
    
    // 基于策略权重生成调整
    for (const [param, weight] of Object.entries(this.strategy.parameterWeights)) {
      const parameter = param as keyof GameParameters;
      const currentValue = this.currentParameters[parameter] as number;
      
      // 生成小幅调整
      const adjustmentSize = currentValue * 0.05 * weight; // 5%的调整
      adjustments.push(
        { parameter, adjustment: adjustmentSize },
        { parameter, adjustment: -adjustmentSize }
      );
    }
    
    return adjustments;
  }

  // 测试参数调整
  private testParameterAdjustment(
    adjustment: {parameter: keyof GameParameters, adjustment: number},
    gameStates: GameState[],
    targetMetrics: Partial<BalanceMetrics>
  ): OptimizationResult | null {
    const { parameter, adjustment: delta } = adjustment;
    const oldValue = this.currentParameters[parameter] as number;
    const newValue = oldValue + delta;
    
    // 计算改进
    const oldScore = this.evaluateParameterSet(gameStates, targetMetrics);
    
    // 临时应用调整
    (this.currentParameters as any)[parameter] = newValue;
    const newScore = this.evaluateParameterSet(gameStates, targetMetrics);
    
    // 恢复原值
    (this.currentParameters as any)[parameter] = oldValue;
    
    const improvement = (newScore - oldScore) / Math.max(oldScore, 0.01);
    
    if (improvement > 0.01) { // 至少1%的改进
      return {
        parameter: parameter as string,
        oldValue,
        newValue,
        improvement,
        confidence: Math.min(1.0, improvement * 2),
        reasoning: `调整${parameter}以提高整体平衡得分`
      };
    }
    
    return null;
  }

  // 辅助方法
  private calculateTargetStartingMoney(targetGini: number, currentGini: number): number {
    // 简化计算：基尼系数与起始资金的关系
    const currentMoney = this.currentParameters.startingMoney;
    const factor = currentGini > targetGini ? 1.1 : 0.9; // 需要增加或减少起始资金
    return Math.round(currentMoney * factor);
  }

  private getAverageZodiacBonus(): number {
    const bonuses = Object.values(this.currentParameters.zodiacMoneyBonus);
    return bonuses.reduce((sum, bonus) => sum + bonus, 0) / bonuses.length;
  }

  private calculateBalancedZodiacBonus(): number {
    return 1.0; // 目标是平衡的1.0倍数
  }

  private calculateTargetMaxRounds(targetDuration: number, currentDuration: number): number {
    const currentRounds = this.currentParameters.maxRounds;
    const factor = targetDuration / currentDuration;
    return Math.round(currentRounds * factor);
  }

  private simulateMetricValue(metric: string, gameStates: GameState[]): number {
    // 简化的指标模拟
    switch (metric) {
      case 'giniCoefficient': return 0.4;
      case 'averageGameDuration': return 3600;
      case 'playerEngagement': return 0.7;
      default: return 0.5;
    }
  }

  private getDefaultZodiacWinRates(): Record<ZodiacSign, number> {
    const rate = 1/12;
    return {
      rat: rate, ox: rate, tiger: rate, rabbit: rate, dragon: rate, snake: rate,
      horse: rate, goat: rate, monkey: rate, rooster: rate, dog: rate, pig: rate
    };
  }

  private getDefaultZodiacWealth(): Record<ZodiacSign, number> {
    const wealth = 10000;
    return {
      rat: wealth, ox: wealth, tiger: wealth, rabbit: wealth, dragon: wealth, snake: wealth,
      horse: wealth, goat: wealth, monkey: wealth, rooster: wealth, dog: wealth, pig: wealth
    };
  }

  private getDefaultZodiacSkillUsage(): Record<ZodiacSign, number> {
    const usage = 5;
    return {
      rat: usage, ox: usage, tiger: usage, rabbit: usage, dragon: usage, snake: usage,
      horse: usage, goat: usage, monkey: usage, rooster: usage, dog: usage, pig: usage
    };
  }

  private getDefaultZodiacPropertyOwnership(): Record<ZodiacSign, number> {
    const properties = 3;
    return {
      rat: properties, ox: properties, tiger: properties, rabbit: properties, dragon: properties, snake: properties,
      horse: properties, goat: properties, monkey: properties, rooster: properties, dog: properties, pig: properties
    };
  }

  // 公共接口方法
  getCurrentParameters(): GameParameters {
    return { ...this.currentParameters };
  }

  getOriginalParameters(): GameParameters {
    return { ...this.originalParameters };
  }

  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  resetToOriginal(): void {
    this.currentParameters = { ...this.originalParameters };
    this.optimizationHistory = [];
  }

  exportOptimizedParameters(): string {
    return JSON.stringify(this.currentParameters, null, 2);
  }
}