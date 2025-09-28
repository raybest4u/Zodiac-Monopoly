import type { 
  GameState, 
  Player, 
  DiceResult,
  GameEvent,
  PlayerAction,
  BoardCell,
  PlayerSkill,
  ZodiacSign
} from '../types/game';
import type { AIOpponentConfig } from '../types/ai';
import type { GameConfig } from '../types/storage';
import { EventEmitter, generateId, deepClone, delay } from '../utils/index';
import { ZODIAC_DATA } from '../types/constants';
import { SaveManager } from '../storage/SaveManager';
import { AIManager } from '../ai/AIManager';
import { UnifiedSpecialSystemManager } from '../special/UnifiedSpecialSystemManager';
import { BalanceDashboard } from '../balance/BalanceDashboard';
import type { GameParameters } from '../balance/ValueOptimizer';
import { getPropertyPrice, canBuyProperty, getRentInfo, needsToPayRent, canUpgradeProperty, getPropertyType } from './PropertyHelpers';

export class GameEngine {
  private gameState: GameState | null = null;
  private eventEmitter: EventEmitter;
  private isRunning: boolean = false;
  private gameLoopInterval: NodeJS.Timeout | null = null;
  private actionQueue: PlayerAction[] = [];
  private currentAction: PlayerAction | null = null;
  private stateHistory: GameState[] = [];
  private maxHistorySize: number = 50;
  private saveManager: SaveManager;
  private aiManager: AIManager;
  private specialSystemManager: UnifiedSpecialSystemManager;
  private balanceDashboard: BalanceDashboard;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.saveManager = new SaveManager();
    this.aiManager = new AIManager();
    this.specialSystemManager = new UnifiedSpecialSystemManager();
    this.balanceDashboard = new BalanceDashboard(this.getDefaultGameParameters());
    this.setupEventHandlers();
  }

  /**
   * 初始化游戏
   */
  async initialize(config: GameConfig): Promise<void> {
    try {
      console.log('Initializing game engine...');
      
      // 验证配置
      if (!config.playerName || !config.playerZodiac) {
        throw new Error('Player name and zodiac are required');
      }
      
      // 确保游戏设置存在
      if (!config.gameSettings) {
        config.gameSettings = {
          startingMoney: 15000,
          maxRounds: 100,
          winCondition: 'last_standing'
        };
      }
      
      // 创建新的游戏状态
      this.gameState = this.createInitialGameState(config);
      
      // 创建玩家
      const humanPlayer = this.createHumanPlayer(config);
      const aiPlayers = this.createAIPlayers(config.aiOpponents, config);
      
      // 设置玩家
      this.gameState.players = [humanPlayer, ...aiPlayers];
      this.gameState.currentPlayerIndex = 0;
      
      // 生成棋盘
      this.gameState.board = this.generateBoard();
      
      // 设置初始状态
      this.gameState.status = 'waiting';
      this.gameState.phase = 'roll_dice';
      this.gameState.startTime = Date.now();
      this.gameState.lastUpdateTime = Date.now();
      
      // 保存初始状态
      this.saveGameState();
      
      // 发布初始化完成事件
      this.eventEmitter.emit('game:initialized', this.gameState);
      
      console.log('Game engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize game engine:', error);
      throw error;
    }
  }

  /**
   * 开始游戏
   */
  async startGame(): Promise<void> {
    if (!this.gameState || this.gameState.status !== 'waiting') {
      throw new Error('Game is not in waiting state');
    }
    
    console.log('Starting game...');
    
    this.gameState.status = 'playing';
    this.isRunning = true;
    this.saveGameState();
    
    // 发布游戏开始事件
    this.eventEmitter.emit('game:started', this.gameState);
    
    // 开始游戏主循环
    await this.startGameLoop();
  }

  /**
   * 暂停游戏
   */
  pauseGame(): void {
    if (this.gameState && this.gameState.status === 'playing') {
      this.gameState.status = 'paused';
      this.isRunning = false;
      this.stopGameLoop();
      this.eventEmitter.emit('game:paused', this.gameState);
    }
  }

  /**
   * 恢复游戏
   */
  async resumeGame(): Promise<void> {
    if (this.gameState && this.gameState.status === 'paused') {
      this.gameState.status = 'playing';
      this.isRunning = true;
      this.eventEmitter.emit('game:resumed', this.gameState);
      await this.startGameLoop();
    }
  }

  /**
   * 结束游戏
   */
  endGame(winner?: Player): void {
    if (!this.gameState) return;
    
    this.gameState.status = 'ended';
    this.isRunning = false;
    this.stopGameLoop();
    
    this.saveGameState();
    this.eventEmitter.emit('game:ended', { gameState: this.gameState, winner });
  }

  /**
   * 掷骰子
   */
  rollDice(): DiceResult {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    const isDouble = dice1 === dice2;
    
    const result: DiceResult = {
      dice1,
      dice2,
      total,
      isDouble,
      timestamp: Date.now()
    };
    
    if (this.gameState) {
      this.gameState.lastDiceResult = result;
    }
    
    this.eventEmitter.emit('dice:rolled', result);
    
    return result;
  }

  /**
   * 获取当前玩家
   */
  getCurrentPlayer(): Player | null {
    if (!this.gameState) return null;
    return this.gameState.players[this.gameState.currentPlayerIndex] || null;
  }

  /**
   * 获取游戏状态
   */
  getGameState(): GameState | null {
    return this.gameState;
  }

  /**
   * 获取事件发射器
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * 检查游戏是否运行中
   */
  isGameRunning(): boolean {
    return this.isRunning && this.gameState?.status === 'playing';
  }

  /**
   * 执行玩家动作
   */
  async executePlayerAction(action: PlayerAction): Promise<boolean> {
    if (!this.gameState) {
      return false;
    }

    // 验证动作合法性
    if (!this.validateAction(action)) {
      this.eventEmitter.emit('action:invalid', action);
      return false;
    }

    // 将动作加入队列
    this.actionQueue.push(action);
    this.eventEmitter.emit('action:queued', action);

    return true;
  }

  /**
   * 移动玩家
   */
  async movePlayer(playerId: string, steps: number): Promise<void> {
    if (!this.gameState) return;

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return;

    const oldPosition = player.position;
    player.position = (player.position + steps) % this.gameState.board.length;

    // 检查是否经过起点
    if (player.position < oldPosition || steps >= this.gameState.board.length) {
      const passStartBonus = 2000; // TODO: 从配置获取
      player.money += passStartBonus;
      
      const passStartEvent: GameEvent = {
        id: generateId(),
        type: 'special_event',
        title: '经过起点',
        description: `${player.name} 经过起点，获得 ${passStartBonus} 元奖励`,
        playerId: player.id,
        triggeredBy: 'pass_cell',
        rarity: 'common',
        tags: ['movement', 'bonus'],
        timestamp: Date.now()
      };
      
      this.gameState.eventHistory.push(passStartEvent);
      this.eventEmitter.emit('player:pass_start', { player, bonus: passStartBonus });
    }

    // 触发位置事件
    const cell = this.gameState.board[player.position];
    if (cell) {
      await this.handleCellLanding(player, cell);
    }

    this.eventEmitter.emit('player:moved', { player, from: oldPosition, to: player.position });
    this.updateGameState();
  }

  /**
   * 下一个玩家回合
   */
  async nextTurn(): Promise<void> {
    if (!this.gameState) return;

    // 结束当前玩家回合
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer) {
      this.eventEmitter.emit('turn:end', currentPlayer);
    }

    // 切换到下一个玩家
    this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length;
    
    // 如果回到第一个玩家，回合数+1
    if (this.gameState.currentPlayerIndex === 0) {
      this.gameState.round++;
      this.eventEmitter.emit('round:new', this.gameState.round);
    }

    this.gameState.turn++;
    
    // 开始新玩家回合
    const newPlayer = this.getCurrentPlayer();
    if (newPlayer) {
      await this.startPlayerTurn(newPlayer);
    }

    this.updateGameState();
  }

  /**
   * 使用技能
   */
  async useSkill(playerId: string, skillId: string, target?: any): Promise<boolean> {
    if (!this.gameState) return false;

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    const skill = player.skills.find(s => s.id === skillId);
    if (!skill) return false;

    // 检查冷却时间
    if (skill.lastUsed && Date.now() - skill.lastUsed < skill.cooldown * 1000) {
      return false;
    }

    // 执行技能效果
    await this.executeSkillEffects(player, skill, target);
    
    // 更新技能使用时间
    skill.lastUsed = Date.now();
    player.statistics.skillsUsed++;

    // 记录事件
    const skillEvent: GameEvent = {
      id: generateId(),
      type: 'zodiac_event',
      title: '技能使用',
      description: `${player.name} 使用了 ${skill.name} 技能`,
      playerId: player.id,
      triggeredBy: 'turn_start',
      rarity: 'common',
      tags: ['skill', skill.zodiac],
      timestamp: Date.now()
    };
    
    this.gameState.eventHistory.push(skillEvent);
    this.eventEmitter.emit('skill:used', { player, skill, target });
    
    this.updateGameState();
    return true;
  }

  /**
   * 获取可用动作
   */
  getAvailableActions(playerId: string): PlayerAction[] {
    if (!this.gameState) return [];

    const player = this.gameState.players.find(p => p.id === playerId);
    if (!player || player.id !== this.getCurrentPlayer()?.id) return [];

    const actions: PlayerAction[] = [];

    // 基础动作
    if (this.gameState.phase === 'roll_dice') {
      actions.push({
        type: 'roll_dice',
        playerId: player.id,
        timestamp: Date.now(),
        data: {}
      });
    }

    // 技能动作
    player.skills.forEach(skill => {
      if (!skill.lastUsed || Date.now() - skill.lastUsed >= skill.cooldown * 1000) {
        actions.push({
          type: 'use_skill',
          playerId: player.id,
          timestamp: Date.now(),
          data: { skillId: skill.id }
        });
      }
    });

    return actions;
  }

  /**
   * 保存游戏状态到历史
   */
  saveGameState(): void {
    if (!this.gameState) return;

    const stateCopy = deepClone(this.gameState);
    this.stateHistory.push(stateCopy);

    // 限制历史记录大小
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * 恢复到之前的游戏状态
   */
  restoreGameState(stepsBack: number = 1): boolean {
    if (this.stateHistory.length <= stepsBack) {
      return false;
    }

    const targetIndex = this.stateHistory.length - stepsBack - 1;
    const targetState = this.stateHistory[targetIndex];
    
    if (targetState) {
      this.gameState = deepClone(targetState);
      // Remove states newer than the restored one
      this.stateHistory = this.stateHistory.slice(0, targetIndex + 1);
      this.eventEmitter.emit('game:state_restored', this.gameState);
      return true;
    }

    return false;
  }

  // 私有方法

  /**
   * 创建初始游戏状态
   */
  private createInitialGameState(_config: GameConfig): GameState {
    return {
      gameId: generateId(),
      status: 'initializing',
      mode: 'classic',
      players: [],
      currentPlayerIndex: 0,
      round: 1,
      phase: 'roll_dice',
      turn: 1,
      board: [],
      eventHistory: [],
      season: '春',
      weather: '晴',
      marketTrends: {
        propertyPriceMultiplier: 1.0,
        rentMultiplier: 1.0,
        salaryBonus: 0,
        taxRate: 0.1,
        skillCooldownModifier: 1.0
      },
      startTime: 0,
      elapsedTime: 0,
      lastUpdateTime: 0
    };
  }

  /**
   * 创建人类玩家
   */
  private createHumanPlayer(config: GameConfig): Player {
    // 使用 gameRules 或 gameSettings 或默认值
    const startingMoney = config.gameRules?.startingMoney 
      || config.gameSettings?.startingMoney 
      || 1500; // 默认起始金钱
    
    return {
      id: 'human_player',
      name: config.playerName,
      zodiac: config.playerZodiac,
      isHuman: true,
      position: 0,
      money: startingMoney,
      properties: [],
      items: [],
      skills: this.createZodiacSkills(config.playerZodiac),
      statusEffects: [],
      statistics: {
        turnsPlayed: 0,
        moneyEarned: 0,
        moneySpent: 0,
        propertiesBought: 0,
        propertiesSold: 0,
        skillsUsed: 0,
        eventsTriggered: 0,
        rentCollected: 0,
        rentPaid: 0
      }
    };
  }

  /**
   * 创建AI玩家
   */
  private createAIPlayers(configs: AIOpponentConfig[], gameConfig: GameConfig): Player[] {
    // 使用 gameRules 或 gameSettings 或默认值
    const startingMoney = gameConfig.gameRules?.startingMoney 
      || gameConfig.gameSettings?.startingMoney 
      || 1500; // 默认起始金钱
      
    return configs.map(config => ({
      id: config.id,
      name: config.name,
      zodiac: config.zodiac,
      isHuman: false,
      position: 0,
      money: startingMoney,
      properties: [],
      items: [],
      skills: this.createZodiacSkills(config.zodiac),
      statusEffects: [],
      statistics: {
        turnsPlayed: 0,
        moneyEarned: 0,
        moneySpent: 0,
        propertiesBought: 0,
        propertiesSold: 0,
        skillsUsed: 0,
        eventsTriggered: 0,
        rentCollected: 0,
        rentPaid: 0
      }
    }));
  }

  /**
   * 生成棋盘
   */
  private generateBoard(): BoardCell[] {
    const board: BoardCell[] = [];
    
    // 标准大富翁棋盘40个格子
    for (let i = 0; i < 40; i++) {
      const cellConfig = this.getCellConfig(i);
      board.push({
        id: `cell_${i}`,
        position: i,
        type: cellConfig.type,
        name: cellConfig.name,
        color: cellConfig.color,
        description: cellConfig.description,
        price: cellConfig.price,
        rent: cellConfig.rent,
        ownerId: undefined
      });
    }
    
    return board;
  }

  /**
   * 获取格子配置
   */
  private getCellConfig(position: number) {
    // 特殊格子
    if (position === 0) return { type: 'start' as const, name: '起点', color: '#FFD700', description: '游戏起始点，经过获得奖励', price: undefined, rent: undefined };
    if (position === 10) return { type: 'jail' as const, name: '监狱', color: '#808080', description: '监狱/探访', price: undefined, rent: undefined };
    if (position === 20) return { type: 'special' as const, name: '免费停车', color: '#90EE90', description: '免费停车场', price: undefined, rent: undefined };
    if (position === 30) return { type: 'special' as const, name: '入狱', color: '#FF6347', description: '直接入狱', price: undefined, rent: undefined };
    
    // 税收格子
    if (position === 4 || position === 38) return { type: 'tax' as const, name: '税收', color: '#DDA0DD', description: '缴纳税收', price: undefined, rent: undefined };
    
    // 机会/命运格子
    if ([2, 7, 17, 22, 33, 36].includes(position)) {
      return { type: 'chance' as const, name: '机会', color: '#FF69B4', description: '抽取机会卡', price: undefined, rent: undefined };
    }
    
    // 地产格子
    const basePrice = 1000 + (position * 150);
    const baseRent = Math.floor(basePrice * 0.1);
    
    return {
      type: 'property' as const,
      name: `${this.getPropertyName(position)}`,
      color: this.getPropertyColor(position),
      description: `优质地产，投资首选`,
      price: basePrice,
      rent: baseRent
    };
  }

  /**
   * 获取地产名称
   */
  private getPropertyName(position: number): string {
    const names = ['金鼠大厦', '银牛广场', '虎威商城', '玉兔花园', '龙腾大厦', '蛇影商街', '骏马商城', '羊咩花园', '猴王大厦', '金鸡广场', '忠犬商街', '福猪花园'];
    return names[position % names.length] || `地产${position}`;
  }

  /**
   * 获取地产颜色
   */
  private getPropertyColor(position: number): string {
    const colors = ['#8B4513', '#87CEEB', '#FF69B4', '#FFB6C1', '#FF0000', '#FFFF00', '#00FF00', '#0000FF', '#800080', '#FFA500'];
    return colors[Math.floor(position / 4) % colors.length];
  }

  /**
   * 创建生肖技能
   */
  private createZodiacSkills(zodiac: ZodiacSign): PlayerSkill[] {
    const zodiacData = ZODIAC_DATA[zodiac];
    if (!zodiacData) return [];

    // 每个生肖有2-3个专属技能
    const skills: PlayerSkill[] = [];
    
    // 基础技能（所有生肖都有）
    skills.push({
      id: `${zodiac}_basic`,
      name: `${zodiac}之力`,
      type: 'active',
      description: `激发${zodiac}的潜能，获得临时加成`,
      zodiac: zodiac,
      cooldown: 300, // 5分钟
      level: 1,
      maxLevel: 5,
      effects: [
        {
          type: 'money',
          value: 500,
          duration: 3,
          target: 'self'
        }
      ],
      experiencePoints: 0,
      nextLevelExp: 100,
      tags: ['economic']
    });

    // 特殊技能（根据生肖特点）
    if (zodiac === '鼠') {
      skills.push({
        id: 'rat_stealth',
        name: '鼠目寸光',
        type: 'passive',
        description: '机敏的鼠在夜晚行动时获得额外收益',
        zodiac: zodiac,
        cooldown: 0,
        level: 1,
        maxLevel: 3,
        effects: [
          {
            type: 'property',
            value: 0.2,
            duration: -1,
            target: 'self'
          }
        ],
        experiencePoints: 0,
        nextLevelExp: 200,
        tags: ['passive']
      });
    }

    return skills;
  }

  /**
   * 开始游戏循环
   */
  private async startGameLoop(): Promise<void> {
    if (!this.isRunning || !this.gameState) return;

    // 游戏主循环，每秒检查一次
    this.gameLoopInterval = setInterval(async () => {
      if (!this.isRunning || !this.gameState) {
        this.stopGameLoop();
        return;
      }

      try {
        await this.processGameLoop();
      } catch (error) {
        console.error('Game loop error:', error);
        this.handleGameError(error as Error);
      }
    }, 1000);
  }

  /**
   * 停止游戏循环
   */
  private stopGameLoop(): void {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  /**
   * 处理游戏循环
   */
  private async processGameLoop(): Promise<void> {
    if (!this.gameState) return;

    // 更新游戏时间
    this.gameState.elapsedTime = Date.now() - this.gameState.startTime;
    this.gameState.lastUpdateTime = Date.now();

    // 处理动作队列
    await this.processActionQueue();

    // 检查胜利条件
    this.checkWinConditions();

    // 更新AI状态（如果有AI玩家）
    await this.updateAIPlayers();

    // 发布循环更新事件
    this.eventEmitter.emit('game:loop_update', this.gameState);
  }

  /**
   * 处理动作队列
   */
  private async processActionQueue(): Promise<void> {
    if (this.actionQueue.length === 0 || this.currentAction) return;

    const action = this.actionQueue.shift();
    if (!action) return;

    this.currentAction = action;
    this.eventEmitter.emit('action:processing', action);

    try {
      await this.processAction(action);
      this.eventEmitter.emit('action:completed', action);
    } catch (error) {
      console.error('Action processing error:', error);
      this.eventEmitter.emit('action:error', { action, error });
    } finally {
      this.currentAction = null;
    }
  }

  /**
   * 处理单个动作
   */
  private async processAction(action: PlayerAction): Promise<void> {
    if (!this.gameState) return;

    switch (action.type) {
      case 'roll_dice':
        await this.handleRollDiceAction(action);
        break;
      case 'use_skill':
        if (action.data?.skillId) {
          await this.useSkill(action.playerId, action.data.skillId, action.data.target);
        }
        break;
      case 'buy_property':
        await this.handleBuyPropertyAction(action);
        break;
      case 'skip_purchase':
        await this.handleSkipPurchaseAction(action);
        break;
      case 'pay_rent':
        await this.handlePayRentAction(action);
        break;
      case 'upgrade_property':
        await this.handleUpgradePropertyAction(action);
        break;
      case 'skip_upgrade':
        await this.handleSkipUpgradeAction(action);
        break;
      case 'end_turn':
        await this.handleEndTurnAction(action);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * 处理掷骰子动作
   */
  private async handleRollDiceAction(action: PlayerAction): Promise<void> {
    if (!this.gameState) return;

    const diceResult = this.rollDice();
    const player = this.gameState.players.find(p => p.id === action.playerId);
    
    if (player) {
      // 移动玩家
      await this.movePlayer(player.id, diceResult.total);
      
      // 如果掷出双数，可以再次掷骰子
      if (diceResult.isDouble) {
        this.gameState.phase = 'roll_dice';
        this.eventEmitter.emit('dice:double', { player, diceResult });
      } else {
        // 检查新位置需要什么操作
        const position = player.position;
        const propertyType = getPropertyType(position);
        
        if (propertyType === 'property' || propertyType === 'station' || propertyType === 'utility' || propertyType === 'zodiac_temple') {
          // 检查是否可以购买或需要支付租金
          if (canBuyProperty(position, player)) {
            if (this.gameState) {
              this.gameState.phase = 'property_action';
            }
          } else if (needsToPayRent(position, player, this.gameState?.players || [])) {
            if (this.gameState) {
              this.gameState.phase = 'pay_rent';
            }
          } else {
            if (this.gameState) {
              this.gameState.phase = 'end_turn';
            }
          }
        } else {
          // 特殊位置，直接结束回合
          if (this.gameState) {
            this.gameState.phase = 'end_turn';
          } else {
            console.error('GameState is undefined when trying to set phase');
          }
        }
      }
    }
  }

  /**
   * 处理购买地产动作
   */
  private async handleBuyPropertyAction(action: PlayerAction): Promise<void> {
    if (!this.gameState) return;

    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) return;

    // 获取当前位置的地产信息
    const position = player.position;
    const price = this.getPropertyPrice(position);
    const canBuy = this.canBuyProperty(position, player);

    if (canBuy && price && player.money >= price) {
      // 购买地产
      player.money -= price;
      if (!player.properties) player.properties = [];
      player.properties.push({
        position: position,
        price: price,
        level: 1,
        rent: Math.floor(price * 0.1)
      });
      
      // 更新统计
      player.statistics.propertiesBought++;
      player.statistics.moneySpent += price;

      this.eventEmitter.emit('property:purchased', { player, position, price });
      
      // 切换到下一个阶段
      this.gameState.phase = 'end_turn';
      console.log(`玩家 ${player.name} 购买了位置 ${position} 的地产，花费 $${price}，当前拥有 ${player.properties.length} 处地产`);
      console.log('玩家地产列表:', player.properties);
      console.log('完整玩家对象:', JSON.stringify(player, null, 2));
    }
  }

  /**
   * 处理支付租金动作
   */
  private async handlePayRentAction(action: PlayerAction): Promise<void> {
    if (!this.gameState) return;

    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) return;

    const cell = this.gameState.board[player.position];
    if (!cell || !cell.ownerId || !cell.rent) return;

    const owner = this.gameState.players.find(p => p.id === cell.ownerId);
    if (!owner) return;

    const rentAmount = cell.rent;
    if (player.money >= rentAmount) {
      player.money -= rentAmount;
      owner.money += rentAmount;
      
      player.statistics.rentPaid += rentAmount;
      owner.statistics.rentCollected += rentAmount;

      this.eventEmitter.emit('rent:paid', { player, owner, amount: rentAmount, cell });
    } else {
      // 钱不够支付租金，可能触发破产
      this.handleBankruptcy(player);
    }
  }

  /**
   * 处理结束回合动作
   */
  private async handleEndTurnAction(action: PlayerAction): Promise<void> {
    if (!this.gameState) return;

    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) return;

    // 结束当前玩家的回合
    await this.endPlayerTurn(player);
    
    // 切换到下一个玩家
    await this.nextTurn();
  }

  /**
   * 结束玩家回合
   */
  private async endPlayerTurn(player: Player): Promise<void> {
    if (!this.gameState) return;

    // 处理回合结束效果
    this.processEndTurnEffects(player);
    
    // 更新状态效果持续时间
    this.updateStatusEffects(player);
    
    // 发布回合结束事件
    this.eventEmitter.emit('turn:ended', { player, gameState: this.gameState });
  }

  /**
   * 处理回合结束效果
   */
  private processEndTurnEffects(player: Player): void {
    // 冷却技能
    player.skills.forEach(skill => {
      if (skill.cooldown > 0) {
        skill.cooldown--;
      }
    });

    // 其他回合结束处理
    player.statistics.turnsPlayed++;
  }

  /**
   * 更新状态效果
   */
  private updateStatusEffects(player: Player): void {
    player.statusEffects = player.statusEffects.filter(effect => {
      effect.remainingTurns--;
      return effect.remainingTurns > 0;
    });
  }

  /**
   * 处理破产
   */
  private handleBankruptcy(player: Player): void {
    if (!this.gameState) return;

    player.isEliminated = true;
    
    // 将所有财产归还银行或转给债权人
    player.properties.forEach(propertyId => {
      const cell = this.gameState!.board.find(c => c.id === propertyId);
      if (cell) {
        cell.ownerId = undefined;
      }
    });
    
    player.properties = [];
    player.money = 0;
    
    this.eventEmitter.emit('player:bankrupted', { player });
  }

  /**
   * 开始玩家回合
   */
  private async startPlayerTurn(player: Player): Promise<void> {
    if (!this.gameState) return;

    player.statistics.turnsPlayed++;
    this.gameState.phase = 'roll_dice';
    
    this.eventEmitter.emit('turn:start', player);
    
    // 如果是AI玩家，自动开始AI决策
    if (!player.isHuman) {
      await delay(1000); // 给一点思考时间
      // TODO: 集成AI决策系统
      this.eventEmitter.emit('ai:turn_start', player);
    }
  }

  /**
   * 处理格子着陆事件
   */
  private async handleCellLanding(player: Player, cell: BoardCell): Promise<void> {
    this.eventEmitter.emit('cell:landed', { player, cell });

    switch (cell.type) {
      case 'property':
        await this.handlePropertyLanding(player, cell);
        break;
      case 'chance':
        await this.handleChanceLanding(player, cell);
        break;
      case 'tax':
        await this.handleTaxLanding(player, cell);
        break;
      case 'special':
        await this.handleSpecialLanding(player, cell);
        break;
    }
  }

  /**
   * 处理地产着陆
   */
  private async handlePropertyLanding(player: Player, cell: BoardCell): Promise<void> {
    if (!cell.ownerId) {
      // 无主地产，可以购买
      this.eventEmitter.emit('property:available', { player, cell });
    } else if (cell.ownerId !== player.id) {
      // 他人地产，需要支付租金
      await this.handlePayRentAction({
        type: 'buy_property',
        playerId: player.id,
        timestamp: Date.now(),
        data: {}
      });
    }
  }

  /**
   * 处理机会格着陆
   */
  private async handleChanceLanding(player: Player, cell: BoardCell): Promise<void> {
    // TODO: 实现机会卡系统
    this.eventEmitter.emit('chance:draw', { player, cell });
  }

  /**
   * 处理税收格着陆
   */
  private async handleTaxLanding(player: Player, _cell: BoardCell): Promise<void> {
    const taxAmount = 200; // 固定税收
    if (player.money >= taxAmount) {
      player.money -= taxAmount;
      player.statistics.moneySpent += taxAmount;
      this.eventEmitter.emit('tax:paid', { player, amount: taxAmount });
    }
  }

  /**
   * 处理特殊格着陆
   */
  private async handleSpecialLanding(player: Player, cell: BoardCell): Promise<void> {
    if (cell.name === '入狱') {
      // 使用新的监狱系统
      const result = this.specialSystemManager.handlePlayerAction(
        player.id, 'prison', { action: 'arrest', crime: 'trespassing' }, this.gameState!
      );
      if (result.success) {
        this.gameState = result.gameState;
        this.eventEmitter.emit('player:arrested', { player, cell, result });
      }
    } else if (cell.name === '免费停车') {
      // 免费停车，什么都不做
      this.eventEmitter.emit('player:free_parking', { player, cell });
    } else if (cell.name === '彩票中心') {
      // 彩票中心特殊事件
      this.eventEmitter.emit('special:lottery_center', { player, cell });
    } else if (cell.name === '保险公司') {
      // 保险公司特殊事件
      this.eventEmitter.emit('special:insurance_center', { player, cell });
    } else if (cell.name === '银行') {
      // 银行特殊事件
      this.eventEmitter.emit('special:bank_center', { player, cell });
    } else if (cell.name === '传送门') {
      // 传送门特殊事件
      this.eventEmitter.emit('special:teleport_gate', { player, cell });
    }
  }

  /**
   * 执行技能效果
   */
  private async executeSkillEffects(player: Player, skill: PlayerSkill, target?: any): Promise<void> {
    for (const effect of skill.effects) {
      await this.applySkillEffect(player, effect, target);
    }
  }

  /**
   * 应用技能效果
   */
  private async applySkillEffect(player: Player, effect: any, _target?: any): Promise<void> {
    switch (effect.type) {
      case 'money':
        player.money += effect.value;
        player.statistics.moneyEarned += effect.value;
        break;
      case 'property':
        // TODO: 实现租金加成效果
        break;
      // 添加更多效果类型
    }
  }

  /**
   * 验证动作合法性
   */
  private validateAction(action: PlayerAction): boolean {
    if (!this.gameState) return false;

    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) return false;

    // 检查是否是当前玩家的回合
    if (player.id !== this.getCurrentPlayer()?.id) {
      return false;
    }

    // 根据动作类型进行具体验证
    switch (action.type) {
      case 'roll_dice':
        // Allow roll dice in waiting or roll_dice phase for testing
        return this.gameState.phase === 'roll_dice' || this.gameState.status === 'waiting';
      case 'use_skill':
        return this.validateSkillAction(action);
      default:
        return true;
    }
  }

  /**
   * 验证技能动作
   */
  private validateSkillAction(action: PlayerAction): boolean {
    if (!action.data?.skillId) return false;
    
    const player = this.gameState?.players.find(p => p.id === action.playerId);
    if (!player) return false;

    const skill = player.skills.find(s => s.id === action.data.skillId);
    if (!skill) return false;

    // 检查冷却时间
    if (skill.lastUsed && Date.now() - skill.lastUsed < skill.cooldown * 1000) {
      return false;
    }

    return true;
  }


  /**
   * 检查胜利条件
   */
  private checkWinConditions(): void {
    if (!this.gameState) return;

    // TODO: 根据游戏配置实现不同的胜利条件
    
    // 检查是否只剩一个玩家有钱
    const alivePlayers = this.gameState.players.filter(p => p.money > 0);
    if (alivePlayers.length === 1) {
      this.endGame(alivePlayers[0]);
      return;
    }

    // 检查回合数限制
    if (this.gameState.round >= 100) { // 最大回合数
      const richestPlayer = this.gameState.players.reduce((prev, current) => 
        prev.money > current.money ? prev : current
      );
      this.endGame(richestPlayer);
    }
  }

  /**
   * 更新AI玩家
   */
  private async updateAIPlayers(): Promise<void> {
    if (!this.gameState) return;

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    
    // 如果当前玩家是AI且处于需要决策的阶段
    if (!currentPlayer.isHuman && this.gameState.phase === 'roll_dice') {
      try {
        // 获取AI决策
        const decision = await this.aiManager.makeDecision(currentPlayer.id, {
          gameState: this.gameState,
          availableActions: ['roll_dice'],
          timeLimit: 3000 // 3秒决策时间
        });

        if (decision && decision.action) {
          // 执行AI决策
          await this.processPlayerAction({
            type: decision.action.type,
            playerId: currentPlayer.id,
            data: decision.action.parameters
          });
        }
      } catch (error) {
        console.error('AI决策失败:', error);
        // 默认行为：AI掷骰子
        await this.processPlayerAction({
          type: 'roll_dice',
          playerId: currentPlayer.id
        });
      }
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.eventEmitter.on('error', this.handleGameError.bind(this));
  }

  /**
   * 处理游戏错误
   */
  private handleGameError(error: Error): void {
    console.error('Game error:', error);
    if (this.gameState) {
      this.gameState.status = 'error';
    }
    this.eventEmitter.emit('game:error', error);
  }

  /**
   * 处理玩家操作
   */
  async processPlayerAction(action: any): Promise<any> {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }

    const playerAction: PlayerAction = {
      id: generateId(),
      type: action.type,
      playerId: action.playerId || this.gameState.players[this.gameState.currentPlayerIndex].id,
      timestamp: Date.now(),
      data: action
    };

    // 验证操作是否有效
    if (!this.isValidAction(playerAction)) {
      console.log(`Action validation failed:`, {
        actionType: action.type,
        currentPhase: this.gameState.phase,
        currentPlayer: this.gameState.players[this.gameState.currentPlayerIndex]?.name,
        actionPlayerId: action.playerId
      });
      throw new Error(`Invalid action: ${action.type}`);
    }

    // 添加到动作队列
    this.actionQueue.push(playerAction);
    
    // 立即处理动作（对于同步操作）
    if (['roll_dice', 'end_turn', 'buy_property', 'skip_purchase', 'pay_rent', 'upgrade_property', 'skip_upgrade'].includes(action.type)) {
      await this.processActionQueue();
    }

    return { success: true, action: playerAction };
  }

  /**
   * 验证操作是否有效
   */
  private isValidAction(action: PlayerAction): boolean {
    if (!this.gameState) return false;

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    
    // 检查是否是当前玩家的操作
    if (action.playerId !== currentPlayer.id && !action.data?.skipPlayerCheck) {
      return false;
    }

    // end_turn 在任何阶段都应该被允许
    if (action.type === 'end_turn') {
      return true;
    }

    // 根据游戏阶段验证其他操作
    switch (this.gameState.phase) {
      case 'roll_dice':
        return action.type === 'roll_dice';
      case 'process_cell':
        return ['buy_property', 'pay_rent', 'use_skill', 'skip_purchase', 'upgrade_property', 'skip_upgrade'].includes(action.type);
      case 'property_action':
        return ['buy_property', 'skip_purchase', 'upgrade_property', 'skip_upgrade'].includes(action.type);
      case 'pay_rent':
        return action.type === 'pay_rent';
      case 'end_turn':
        return true; // 在 end_turn 阶段允许任何操作
      default:
        return false;
    }
  }

  /**
   * 保存游戏
   */
  async saveGame(saveName?: string): Promise<string> {
    if (!this.gameState) {
      throw new Error('No game state to save');
    }

    await this.saveManager.initialize();
    
    const name = saveName || `Save ${new Date().toLocaleString()}`;
    const result = await this.saveManager.createSave(name, this.gameState);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save game');
    }

    this.eventEmitter.emit('game:saved', { saveId: result.data?.saveId, name });
    return result.data?.saveId || '';
  }

  /**
   * 加载游戏
   */
  async loadGame(saveId: string): Promise<void> {
    await this.saveManager.initialize();
    
    const result = await this.saveManager.loadSave(saveId);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to load game');
    }

    this.gameState = result.data.gameState;
    this.eventEmitter.emit('game:loaded', { saveId, gameState: this.gameState });
  }

  /**
   * 获取存档列表
   */
  async getSaveList(): Promise<any[]> {
    await this.saveManager.initialize();
    
    const result = await this.saveManager.listSaves();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get save list');
    }

    return result.data || [];
  }

  /**
   * 销毁游戏引擎
   */
  destroy(): void {
    this.stopGameLoop();
    this.isRunning = false;
    this.gameState = null;
    this.actionQueue = [];
    this.currentAction = null;
    this.stateHistory = [];
    this.eventEmitter.removeAllListeners();
  }


  /**
   * 事件监听器接口（兼容旧的GameLoop组件）
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 移除事件监听器
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * 执行特殊系统操作
   */
  async executeSpecialAction(
    playerId: string,
    systemType: 'prison' | 'lottery' | 'insurance' | 'banking' | 'teleport' | 'special',
    actionData: any
  ): Promise<any> {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }

    const result = this.specialSystemManager.handlePlayerAction(
      playerId, systemType, actionData, this.gameState
    );

    if (result.success) {
      this.gameState = result.gameState;
      this.specialSystemManager.updateSystemStatus(this.gameState);
      this.updateGameState();
      this.eventEmitter.emit('special:action_executed', { playerId, systemType, actionData, result });
    }

    return result;
  }

  /**
   * 获取特殊系统状态
   */
  getSpecialSystemStatus(): any {
    return this.specialSystemManager.getSystemStatus();
  }

  /**
   * 获取特殊系统配置
   */
  getSpecialSystemConfig(): any {
    return this.specialSystemManager.getConfig();
  }

  /**
   * 更新特殊系统配置
   */
  updateSpecialSystemConfig(newConfig: any): void {
    this.specialSystemManager.updateConfig(newConfig);
    this.eventEmitter.emit('special:config_updated', newConfig);
  }

  /**
   * 重置特殊系统
   */
  async resetSpecialSystems(): Promise<void> {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }

    const result = this.specialSystemManager.resetAllSystems(this.gameState);
    if (result.success) {
      this.gameState = result.gameState;
      this.updateGameState();
      this.eventEmitter.emit('special:systems_reset');
    }
  }

  /**
   * 获取默认游戏参数
   */
  private getDefaultGameParameters(): GameParameters {
    return {
      // 经济参数
      startingMoney: 10000,
      passingGoBonus: 2000,
      propertyPriceMultiplier: 1.0,
      rentMultiplier: 1.0,
      taxRate: 1.0,
      
      // 生肖参数
      zodiacSkillCooldownMultiplier: {
        rat: 1.0, ox: 1.0, tiger: 1.0, rabbit: 1.0, dragon: 1.0, snake: 1.0,
        horse: 1.0, goat: 1.0, monkey: 1.0, rooster: 1.0, dog: 1.0, pig: 1.0
      },
      zodiacMoneyBonus: {
        rat: 1.0, ox: 1.0, tiger: 1.0, rabbit: 1.0, dragon: 1.0, snake: 1.0,
        horse: 1.0, goat: 1.0, monkey: 1.0, rooster: 1.0, dog: 1.0, pig: 1.0
      },
      zodiacPropertyDiscount: {
        rat: 1.0, ox: 1.0, tiger: 1.0, rabbit: 1.0, dragon: 1.0, snake: 1.0,
        horse: 1.0, goat: 1.0, monkey: 1.0, rooster: 1.0, dog: 1.0, pig: 1.0
      },
      
      // 技能参数
      skillCooldownBase: 3,
      skillEffectMultiplier: 1.0,
      maxSkillsPerPlayer: 3,
      
      // 特殊系统参数
      lotteryTicketPrice: 100,
      lotteryJackpotMultiplier: 2.0,
      insurancePremiumRate: 0.05,
      bankLoanInterestRate: 0.08,
      prisonBailMultiplier: 1.0,
      
      // 游戏进度参数
      maxRounds: 100,
      turnTimeLimit: 60,
      winConditionThreshold: 50000
    };
  }

  // 添加新的动作处理器
  private async handleSkipPurchaseAction(action: PlayerAction): Promise<void> {
    if (!this.gameState) return;
    
    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) return;
    
    console.log(`玩家 ${player.name} 跳过了购买位置 ${player.position} 的地产`);
    this.gameState.phase = 'end_turn';
  }

  private async handleUpgradePropertyAction(action: PlayerAction): Promise<void> {
    if (!this.gameState) return;
    
    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) return;
    
    // 找到玩家在当前位置的地产
    const property = player.properties?.find(p => p.position === player.position);
    if (property && player.money >= property.price * 0.5) {
      const upgradeCost = Math.floor(property.price * 0.5);
      player.money -= upgradeCost;
      property.level = (property.level || 1) + 1;
      property.rent = Math.floor(property.price * 0.1 * property.level);
      
      console.log(`玩家 ${player.name} 升级了位置 ${player.position} 的地产到 ${property.level} 级`);
    }
    
    this.gameState.phase = 'end_turn';
  }

  private async handleSkipUpgradeAction(action: PlayerAction): Promise<void> {
    if (!this.gameState) return;
    
    const player = this.gameState.players.find(p => p.id === action.playerId);
    if (!player) return;
    
    console.log(`玩家 ${player.name} 跳过了升级位置 ${player.position} 的地产`);
    this.gameState.phase = 'end_turn';
  }

  // 添加辅助方法
  public getPropertyPrice = getPropertyPrice;
  public canBuyProperty = canBuyProperty;
  public getRentInfo = (position: number, player: Player) => getRentInfo(position, player, this.gameState?.players || []);

  /**
   * 更新游戏状态（重写以包含平衡分析）
   */
  private updateGameState(): void {
    if (!this.gameState) return;

    this.gameState.lastUpdateTime = Date.now();
    
    // 添加到平衡分析系统
    this.balanceDashboard.updateGameState(this.gameState);
    
    this.saveGameState();
    this.eventEmitter.emit('game:state_updated', this.gameState);
  }

  /**
   * 获取平衡分析结果
   */
  async getBalanceAnalysis(): Promise<any> {
    return await this.balanceDashboard.performComprehensiveAnalysis();
  }

  /**
   * 执行参数优化
   */
  async optimizeGameParameters(): Promise<any> {
    return await this.balanceDashboard.optimizeParameters();
  }

  /**
   * 执行批量优化
   */
  async performBatchOptimization(iterations: number = 10): Promise<any> {
    return await this.balanceDashboard.performBatchOptimization(iterations);
  }

  /**
   * 分析参数敏感性
   */
  async analyzeParameterSensitivity(
    parameterName: keyof GameParameters,
    valueRange: [number, number],
    steps: number = 10
  ): Promise<any> {
    return await this.balanceDashboard.analyzeParameterSensitivity(parameterName, valueRange, steps);
  }

  /**
   * 获取平衡仪表板状态
   */
  getBalanceDashboardState(): any {
    return this.balanceDashboard.getDashboardState();
  }

  /**
   * 更新平衡系统配置
   */
  updateBalanceConfig(config: any): void {
    this.balanceDashboard.updateConfig(config);
  }

  /**
   * 生成平衡报告
   */
  generateBalanceReport(): string {
    return this.balanceDashboard.generateBalanceReport();
  }

  /**
   * 重置平衡优化
   */
  resetBalanceOptimization(): void {
    this.balanceDashboard.resetOptimization();
  }

  /**
   * 获取优化报告历史
   */
  getOptimizationReports(): any[] {
    return this.balanceDashboard.getOptimizationReports();
  }
}