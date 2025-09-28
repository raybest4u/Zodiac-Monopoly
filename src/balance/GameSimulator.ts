import type { GameState, Player, ZodiacSign, BoardCell } from '../types/game';
import type { GameParameters } from './ValueOptimizer';
import { ZODIAC_DATA } from '../types/constants';

export interface SimulationConfig {
  playerCount: number;
  zodiacDistribution: ZodiacSign[]; // 指定每个玩家的生肖
  gameParameters: GameParameters;
  maxRounds: number;
  simulationSpeed: 'fast' | 'normal' | 'detailed';
  randomSeed?: number;
}

export interface SimulationResult {
  gameState: GameState;
  winner: Player | null;
  duration: number; // 游戏时长（毫秒）
  rounds: number;
  finalWealth: Record<string, number>;
  zodiacPerformance: Record<ZodiacSign, {
    averageWealth: number;
    winRate: number;
    skillsUsed: number;
    propertiesOwned: number;
  }>;
  balanceMetrics: {
    giniCoefficient: number;
    wealthVariance: number;
    playerEngagement: number;
    earlyGameAdvantage: number;
  };
}

export interface BatchSimulationResult {
  totalGames: number;
  averageDuration: number;
  zodiacWinRates: Record<ZodiacSign, number>;
  averageBalanceMetrics: {
    giniCoefficient: number;
    wealthVariance: number;
    playerEngagement: number;
  };
  parameterSensitivity: Record<string, number>; // 参数对结果的敏感度
}

export class GameSimulator {
  private rng: () => number;
  private simulationCount: number = 0;

  constructor(seed?: number) {
    // 简单的伪随机数生成器，用于可重现的模拟
    this.rng = seed ? this.createSeededRandom(seed) : Math.random;
  }

  // 创建有种子的随机数生成器
  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  // 单次游戏模拟
  async simulateGame(config: SimulationConfig): Promise<SimulationResult> {
    const startTime = Date.now();
    
    // 创建初始游戏状态
    const gameState = this.createInitialGameState(config);
    
    // 模拟游戏进行
    let rounds = 0;
    let winner: Player | null = null;
    
    while (rounds < config.maxRounds && !winner) {
      // 模拟一轮游戏
      await this.simulateRound(gameState, config);
      rounds++;
      
      // 检查胜利条件
      winner = this.checkWinCondition(gameState);
      
      // 更新游戏状态
      gameState.round = rounds;
      gameState.lastUpdateTime = Date.now();
    }

    const duration = Date.now() - startTime;
    
    // 计算最终结果
    const result: SimulationResult = {
      gameState,
      winner,
      duration,
      rounds,
      finalWealth: this.calculateFinalWealth(gameState.players),
      zodiacPerformance: this.calculateZodiacPerformance(gameState.players),
      balanceMetrics: this.calculateSimulationBalanceMetrics(gameState)
    };

    return result;
  }

  // 创建初始游戏状态
  private createInitialGameState(config: SimulationConfig): GameState {
    const players: Player[] = [];
    
    // 创建玩家
    for (let i = 0; i < config.playerCount; i++) {
      const zodiacSign = config.zodiacDistribution[i] || 'dragon';
      const zodiacData = ZODIAC_DATA[zodiacSign];
      
      const player: Player = {
        id: `player_${i + 1}`,
        name: `${zodiacData.name}玩家${i + 1}`,
        zodiacSign,
        isHuman: false,
        money: config.gameParameters.startingMoney,
        position: 0,
        properties: [],
        skills: this.generateInitialSkills(zodiacSign),
        statusEffects: [],
        isEliminated: false,
        statistics: {
          turnsPlayed: 0,
          propertiesBought: 0,
          moneyEarned: 0,
          moneySpent: 0,
          rentPaid: 0,
          rentCollected: 0,
          skillsUsed: 0
        }
      };
      
      players.push(player);
    }

    // 创建简化的游戏棋盘
    const board = this.createSimplifiedBoard();

    return {
      id: `simulation_${this.simulationCount++}`,
      players,
      board,
      currentPlayerIndex: 0,
      round: 0,
      phase: 'roll_dice',
      status: 'playing',
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      events: [],
      specialSystems: {
        prison: { records: {}, statistics: { totalArrests: 0, totalReleases: 0, totalRevenue: 0 } },
        lottery: [],
        insurance: [],
        banking: { loans: [], deposits: [], creditScores: {} },
        teleportation: { nodes: [], network: {} },
        wealthRedistribution: { history: [] },
        specialEvents: { history: [] }
      }
    };
  }

  // 生成初始技能
  private generateInitialSkills(zodiacSign: ZodiacSign) {
    const zodiacData = ZODIAC_DATA[zodiacSign];
    return zodiacData.skills.map((skill, index) => ({
      id: `${zodiacSign}_skill_${index}`,
      name: skill.name,
      description: skill.description,
      type: skill.type as any,
      effects: skill.effects,
      cooldown: skill.cooldown,
      lastUsed: null,
      level: 1
    }));
  }

  // 创建简化棋盘
  private createSimplifiedBoard(): BoardCell[] {
    const board: BoardCell[] = [];
    
    for (let i = 0; i < 40; i++) {
      let cellType: BoardCell['type'] = 'property';
      let name = `地产${i}`;
      
      // 特殊格子
      if (i === 0) { cellType = 'start'; name = '起点'; }
      else if (i === 10) { cellType = 'jail'; name = '监狱'; }
      else if (i === 20) { cellType = 'free_parking'; name = '免费停车'; }
      else if (i === 30) { cellType = 'go_to_jail'; name = '入狱'; }
      else if (i % 7 === 0) { cellType = 'chance'; name = '机会'; }
      else if (i % 11 === 0) { cellType = 'tax'; name = '税收'; }
      
      const basePrice = 1000 + i * 100;
      
      board.push({
        id: `cell_${i}`,
        position: i,
        type: cellType,
        name,
        price: cellType === 'property' ? basePrice : undefined,
        rent: cellType === 'property' ? Math.round(basePrice * 0.1) : undefined,
        ownerId: undefined
      });
    }
    
    return board;
  }

  // 模拟一轮游戏
  private async simulateRound(gameState: GameState, config: SimulationConfig): Promise<void> {
    for (let i = 0; i < gameState.players.length; i++) {
      if (gameState.status !== 'playing') break;
      
      gameState.currentPlayerIndex = i;
      const currentPlayer = gameState.players[i];
      
      if (currentPlayer.isEliminated) continue;
      
      // 模拟玩家回合
      await this.simulatePlayerTurn(currentPlayer, gameState, config);
    }
  }

  // 模拟玩家回合
  private async simulatePlayerTurn(
    player: Player, 
    gameState: GameState, 
    config: SimulationConfig
  ): Promise<void> {
    player.statistics.turnsPlayed++;
    
    // 1. 掷骰子移动
    const diceRoll = Math.floor(this.rng() * 6) + Math.floor(this.rng() * 6) + 2;
    const oldPosition = player.position;
    player.position = (player.position + diceRoll) % gameState.board.length;
    
    // 2. 检查是否经过起点
    if (player.position < oldPosition) {
      player.money += config.gameParameters.passingGoBonus;
      player.statistics.moneyEarned += config.gameParameters.passingGoBonus;
    }
    
    // 3. 处理着陆格子
    const currentCell = gameState.board[player.position];
    await this.handleCellLanding(player, currentCell, gameState, config);
    
    // 4. 随机使用技能
    if (this.rng() < 0.3) { // 30%概率使用技能
      this.simulateSkillUsage(player, gameState, config);
    }
    
    // 5. 随机购买房产
    if (currentCell.type === 'property' && !currentCell.ownerId && player.money >= (currentCell.price || 0)) {
      if (this.rng() < 0.6) { // 60%概率购买
        this.simulatePropertyPurchase(player, currentCell, config);
      }
    }
  }

  // 处理格子着陆
  private async handleCellLanding(
    player: Player, 
    cell: BoardCell, 
    gameState: GameState, 
    config: SimulationConfig
  ): Promise<void> {
    switch (cell.type) {
      case 'property':
        if (cell.ownerId && cell.ownerId !== player.id && cell.rent) {
          // 支付租金
          const owner = gameState.players.find(p => p.id === cell.ownerId);
          if (owner && player.money >= cell.rent) {
            const rentAmount = cell.rent * config.gameParameters.rentMultiplier;
            player.money -= rentAmount;
            owner.money += rentAmount;
            player.statistics.rentPaid += rentAmount;
            owner.statistics.rentCollected += rentAmount;
          }
        }
        break;
        
      case 'tax':
        const taxAmount = 200 * config.gameParameters.taxRate;
        if (player.money >= taxAmount) {
          player.money -= taxAmount;
          player.statistics.moneySpent += taxAmount;
        }
        break;
        
      case 'chance':
        // 模拟机会卡效果
        this.simulateChanceCard(player, config);
        break;
        
      case 'go_to_jail':
        // 送入监狱
        player.position = 10; // 监狱位置
        break;
    }
  }

  // 模拟技能使用
  private simulateSkillUsage(player: Player, gameState: GameState, config: SimulationConfig): void {
    const availableSkills = player.skills.filter(skill => 
      skill.cooldown === 0 && (!skill.lastUsed || Date.now() - skill.lastUsed > 60000)
    );
    
    if (availableSkills.length > 0) {
      const skill = availableSkills[Math.floor(this.rng() * availableSkills.length)];
      
      // 应用技能效果
      this.applySkillEffect(player, skill, config);
      
      // 设置冷却
      skill.lastUsed = Date.now();
      skill.cooldown = Math.floor(skill.cooldown * config.gameParameters.skillCooldownBase);
      
      player.statistics.skillsUsed++;
    }
  }

  // 应用技能效果
  private applySkillEffect(player: Player, skill: any, config: SimulationConfig): void {
    for (const effect of skill.effects) {
      switch (effect.type) {
        case 'money':
          const amount = effect.value * config.gameParameters.skillEffectMultiplier;
          player.money += amount;
          player.statistics.moneyEarned += amount;
          break;
          
        case 'property_discount':
          // 临时效果，影响下次购买
          player.statusEffects.push({
            type: 'property_discount',
            value: effect.value,
            remainingTurns: effect.duration || 1
          });
          break;
          
        case 'rent_immunity':
          player.statusEffects.push({
            type: 'rent_immunity',
            value: 1,
            remainingTurns: effect.duration || 2
          });
          break;
      }
    }
  }

  // 模拟房产购买
  private simulatePropertyPurchase(player: Player, cell: BoardCell, config: SimulationConfig): void {
    if (!cell.price) return;
    
    let finalPrice = cell.price * config.gameParameters.propertyPriceMultiplier;
    
    // 应用折扣效果
    const discountEffect = player.statusEffects.find(e => e.type === 'property_discount');
    if (discountEffect) {
      finalPrice *= (1 - discountEffect.value);
    }
    
    if (player.money >= finalPrice) {
      player.money -= finalPrice;
      player.statistics.moneySpent += finalPrice;
      player.statistics.propertiesBought++;
      player.properties.push(cell.id);
      cell.ownerId = player.id;
    }
  }

  // 模拟机会卡
  private simulateChanceCard(player: Player, config: SimulationConfig): void {
    const cardType = Math.floor(this.rng() * 5);
    
    switch (cardType) {
      case 0: // 获得金钱
        const bonus = 500 + Math.floor(this.rng() * 1000);
        player.money += bonus;
        player.statistics.moneyEarned += bonus;
        break;
        
      case 1: // 失去金钱
        const penalty = 200 + Math.floor(this.rng() * 500);
        if (player.money >= penalty) {
          player.money -= penalty;
          player.statistics.moneySpent += penalty;
        }
        break;
        
      case 2: // 移动到指定位置
        player.position = Math.floor(this.rng() * 40);
        break;
        
      case 3: // 获得技能冷却减少
        player.skills.forEach(skill => {
          skill.cooldown = Math.max(0, skill.cooldown - 1);
        });
        break;
        
      case 4: // 免费获得房产
        // 模拟获得一个便宜的房产
        const cheapProperty = { id: `bonus_property_${Date.now()}`, name: '奖励房产' };
        player.properties.push(cheapProperty.id);
        player.statistics.propertiesBought++;
        break;
    }
  }

  // 检查胜利条件
  private checkWinCondition(gameState: GameState): Player | null {
    const alivePlayers = gameState.players.filter(p => !p.isEliminated && p.money > 0);
    
    if (alivePlayers.length === 1) {
      return alivePlayers[0];
    }
    
    // 检查是否有玩家达到胜利财富
    const wealthyPlayer = alivePlayers.find(p => p.money >= 50000);
    if (wealthyPlayer) {
      return wealthyPlayer;
    }
    
    return null;
  }

  // 计算最终财富
  private calculateFinalWealth(players: Player[]): Record<string, number> {
    const wealth: Record<string, number> = {};
    
    players.forEach(player => {
      wealth[player.id] = player.money + player.properties.length * 2000; // 简化财产估值
    });
    
    return wealth;
  }

  // 计算生肖表现
  private calculateZodiacPerformance(players: Player[]): Record<ZodiacSign, any> {
    const performance: Record<ZodiacSign, any> = {} as any;
    
    // 按生肖分组
    const zodiacGroups = this.groupPlayersByZodiac(players);
    
    for (const [zodiac, zodiacPlayers] of Object.entries(zodiacGroups)) {
      const playerCount = zodiacPlayers.length;
      if (playerCount === 0) continue;
      
      performance[zodiac as ZodiacSign] = {
        averageWealth: zodiacPlayers.reduce((sum, p) => sum + p.money, 0) / playerCount,
        winRate: 0, // 需要在批量模拟中计算
        skillsUsed: zodiacPlayers.reduce((sum, p) => sum + p.statistics.skillsUsed, 0) / playerCount,
        propertiesOwned: zodiacPlayers.reduce((sum, p) => sum + p.properties.length, 0) / playerCount
      };
    }
    
    return performance;
  }

  // 计算模拟平衡指标
  private calculateSimulationBalanceMetrics(gameState: GameState) {
    const players = gameState.players;
    const wealths = players.map(p => p.money + p.properties.length * 2000);
    
    // 基尼系数
    const giniCoefficient = this.calculateGiniCoefficient(wealths);
    
    // 财富方差
    const avgWealth = wealths.reduce((sum, w) => sum + w, 0) / wealths.length;
    const variance = wealths.reduce((sum, w) => sum + Math.pow(w - avgWealth, 2), 0) / wealths.length;
    const wealthVariance = variance / (avgWealth * avgWealth);
    
    // 玩家参与度
    const totalActions = players.reduce((sum, p) => 
      sum + p.statistics.turnsPlayed + p.statistics.skillsUsed, 0
    );
    const playerEngagement = totalActions / (players.length * Math.max(1, gameState.round));
    
    // 早期优势
    const earlyGameAdvantage = this.calculateEarlyAdvantage(players);
    
    return {
      giniCoefficient,
      wealthVariance,
      playerEngagement,
      earlyGameAdvantage
    };
  }

  // 批量模拟
  async simulateBatch(
    config: SimulationConfig, 
    batchSize: number
  ): Promise<BatchSimulationResult> {
    const results: SimulationResult[] = [];
    
    console.log(`开始批量模拟 ${batchSize} 场游戏...`);
    
    for (let i = 0; i < batchSize; i++) {
      if (i % 10 === 0) {
        console.log(`模拟进度: ${i}/${batchSize}`);
      }
      
      const result = await this.simulateGame(config);
      results.push(result);
    }
    
    // 汇总结果
    const zodiacWinCounts: Record<ZodiacSign, number> = {} as any;
    let totalDuration = 0;
    const balanceMetrics = { giniCoefficient: 0, wealthVariance: 0, playerEngagement: 0 };
    
    // 初始化胜率统计
    const zodiacSigns: ZodiacSign[] = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 
                                     'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];
    zodiacSigns.forEach(zodiac => {
      zodiacWinCounts[zodiac] = 0;
    });
    
    // 统计结果
    results.forEach(result => {
      totalDuration += result.duration;
      
      if (result.winner) {
        zodiacWinCounts[result.winner.zodiacSign]++;
      }
      
      balanceMetrics.giniCoefficient += result.balanceMetrics.giniCoefficient;
      balanceMetrics.wealthVariance += result.balanceMetrics.wealthVariance;
      balanceMetrics.playerEngagement += result.balanceMetrics.playerEngagement;
    });
    
    // 计算平均值
    const averageDuration = totalDuration / results.length;
    balanceMetrics.giniCoefficient /= results.length;
    balanceMetrics.wealthVariance /= results.length;
    balanceMetrics.playerEngagement /= results.length;
    
    // 计算胜率
    const zodiacWinRates: Record<ZodiacSign, number> = {} as any;
    zodiacSigns.forEach(zodiac => {
      zodiacWinRates[zodiac] = zodiacWinCounts[zodiac] / results.length;
    });
    
    return {
      totalGames: batchSize,
      averageDuration,
      zodiacWinRates,
      averageBalanceMetrics: balanceMetrics,
      parameterSensitivity: {} // 需要额外分析计算
    };
  }

  // 参数敏感性分析
  async analyzeParameterSensitivity(
    baseConfig: SimulationConfig,
    parameterName: keyof GameParameters,
    valueRange: [number, number],
    steps: number,
    simulationsPerStep: number = 10
  ): Promise<Array<{value: number, metrics: any}>> {
    const results: Array<{value: number, metrics: any}> = [];
    const [minValue, maxValue] = valueRange;
    const stepSize = (maxValue - minValue) / (steps - 1);
    
    console.log(`分析参数 ${parameterName} 敏感性...`);
    
    for (let i = 0; i < steps; i++) {
      const value = minValue + i * stepSize;
      const config = { 
        ...baseConfig, 
        gameParameters: { 
          ...baseConfig.gameParameters, 
          [parameterName]: value 
        } 
      };
      
      const batchResult = await this.simulateBatch(config, simulationsPerStep);
      
      results.push({
        value,
        metrics: {
          averageDuration: batchResult.averageDuration,
          giniCoefficient: batchResult.averageBalanceMetrics.giniCoefficient,
          playerEngagement: batchResult.averageBalanceMetrics.playerEngagement,
          zodiacBalance: this.calculateZodiacBalance(batchResult.zodiacWinRates)
        }
      });
      
      console.log(`${parameterName} = ${value}: 完成`);
    }
    
    return results;
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

  private calculateEarlyAdvantage(players: Player[]): number {
    // 简化的早期优势计算
    const sortedByTurns = [...players].sort((a, b) => b.statistics.turnsPlayed - a.statistics.turnsPlayed);
    const sortedByWealth = [...players].sort((a, b) => b.money - a.money);
    
    // 回合数排名与财富排名的相关性
    let correlation = 0;
    for (let i = 0; i < players.length; i++) {
      const turnRank = sortedByTurns.findIndex(p => p.id === sortedByWealth[i].id);
      correlation += Math.abs(i - turnRank);
    }
    
    return 1 - (correlation / (players.length * players.length));
  }

  private calculateZodiacBalance(winRates: Record<ZodiacSign, number>): number {
    const rates = Object.values(winRates);
    const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / rates.length;
    return 1 / (1 + Math.sqrt(variance)); // 方差越小，平衡性越好
  }

  private groupPlayersByZodiac(players: Player[]): Record<string, Player[]> {
    return players.reduce((groups, player) => {
      const zodiac = player.zodiacSign;
      if (!groups[zodiac]) {
        groups[zodiac] = [];
      }
      groups[zodiac].push(player);
      return groups;
    }, {} as Record<string, Player[]>);
  }
}