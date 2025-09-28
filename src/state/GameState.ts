/**
 * 游戏状态管理器 - 中央状态存储和管理
 */

import { EventEmitter } from '../utils/EventEmitter';

// 游戏状态类型定义
export interface GameStateData {
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  phase: GamePhase;
  board: BoardCell[];
  gameHistory: GameEvent[];
  gameSettings: GameSettings;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  zodiac: string;
  isHuman: boolean;
  money: number;
  position: number;
  properties: string[];
  skills: Skill[];
  statusEffects: StatusEffect[];
  level: number;
  experience: number;
  isEliminated: boolean;
  avatar?: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  propertiesBought: number;
  totalMoneyEarned: number;
  totalMoneySpent: number;
  skillsUsed: number;
  turnsPlayed: number;
  passedStartCount: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  zodiac: string;
  type: 'active' | 'passive';
  cooldown: number;
  currentCooldown: number;
  level: number;
  isUnlocked: boolean;
  usageCount: number;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'neutral';
  duration: number;
  remainingTurns: number;
  effects: EffectModifier[];
  sourcePlayerId?: string;
}

export interface EffectModifier {
  property: string;
  modifier: number;
  type: 'add' | 'multiply' | 'set';
}

export interface BoardCell {
  id: string;
  position: number;
  type: 'property' | 'event' | 'special' | 'start' | 'jail' | 'tax';
  name: string;
  description?: string;
  data: any;
}

export interface Property extends BoardCell {
  type: 'property';
  price: number;
  rent: number;
  level: number;
  maxLevel: number;
  upgradePrice: number;
  ownerId?: string;
  zodiac: string;
  color: string;
}

export interface GameEvent {
  id: string;
  type: string;
  playerId?: string;
  data: any;
  timestamp: number;
  processed: boolean;
}

export interface GameSettings {
  gameMode: 'classic' | 'challenge' | 'tutorial' | 'custom';
  maxRounds: number;
  startingMoney: number;
  winConditions: WinCondition[];
  enableAnimations: boolean;
  enableSound: boolean;
  autoSave: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface WinCondition {
  type: 'bankruptcy' | 'wealth_goal' | 'property_mogul' | 'round_limit';
  target?: any;
}

export type GamePhase = 
  | 'waiting'
  | 'initializing' 
  | 'player_turn'
  | 'ai_turn'
  | 'dice_rolling'
  | 'moving'
  | 'action_phase'
  | 'event_processing'
  | 'end_turn'
  | 'game_over'
  | 'paused';

export interface InitializeOptions {
  players: Player[];
  boardConfig: BoardConfig;
  gameSettings: GameSettings;
}

export interface BoardConfig {
  centerX: number;
  centerY: number;
  outerRadius: number;
  innerRadius: number;
  cellCount: number;
  hasInnerRing: boolean;
  innerCellCount?: number;
}

/**
 * 游戏状态管理器主类
 */
export class GameState extends EventEmitter {
  private data: GameStateData;
  private isInitialized = false;
  private lastUpdateTime = 0;
  private changeQueue: StateChange[] = [];

  constructor() {
    super();
    
    this.data = {
      players: [],
      currentPlayerIndex: 0,
      round: 1,
      phase: 'waiting',
      board: [],
      gameHistory: [],
      gameSettings: this.getDefaultGameSettings(),
      timestamp: Date.now()
    };
  }

  /**
   * 初始化游戏状态
   */
  async initialize(options: InitializeOptions): Promise<void> {
    if (this.isInitialized) {
      throw new Error('GameState already initialized');
    }

    try {
      // 设置玩家
      this.data.players = options.players.map(player => ({
        ...player,
        stats: {
          propertiesBought: 0,
          totalMoneyEarned: 0,
          totalMoneySpent: 0,
          skillsUsed: 0,
          turnsPlayed: 0,
          passedStartCount: 0
        }
      }));

      // 设置游戏设置
      this.data.gameSettings = options.gameSettings;

      // 初始化棋盘
      this.data.board = this.generateBoard(options.boardConfig);

      // 重置游戏状态
      this.data.currentPlayerIndex = 0;
      this.data.round = 1;
      this.data.phase = 'initializing';
      this.data.gameHistory = [];
      this.data.timestamp = Date.now();

      this.isInitialized = true;

      this.emit('initialized', {
        players: this.data.players,
        board: this.data.board,
        settings: this.data.gameSettings
      });

    } catch (error) {
      this.emit('initializationFailed', { error });
      throw error;
    }
  }

  /**
   * 生成棋盘
   */
  private generateBoard(config: BoardConfig): BoardCell[] {
    const board: BoardCell[] = [];
    const cellCount = config.cellCount;

    // 定义生肖属性组
    const zodiacGroups = [
      { zodiac: '鼠', color: '#4A90E2', properties: 2 },
      { zodiac: '牛', color: '#8B4513', properties: 2 },
      { zodiac: '虎', color: '#FF8C00', properties: 2 },
      { zodiac: '兔', color: '#FFB6C1', properties: 2 },
      { zodiac: '龙', color: '#DAA520', properties: 2 },
      { zodiac: '蛇', color: '#6B8E23', properties: 2 },
      { zodiac: '马', color: '#CD853F', properties: 2 },
      { zodiac: '羊', color: '#E6E6FA', properties: 2 },
      { zodiac: '猴', color: '#DEB887', properties: 2 },
      { zodiac: '鸡', color: '#FF6347', properties: 2 },
      { zodiac: '狗', color: '#8FBC8F', properties: 2 },
      { zodiac: '猪', color: '#FFA0C9', properties: 2 }
    ];

    let propertyIndex = 0;
    let zodiacIndex = 0;

    for (let i = 0; i < cellCount; i++) {
      let cell: BoardCell;

      if (i === 0) {
        // 起点
        cell = {
          id: `start_${i}`,
          position: i,
          type: 'start',
          name: '起点',
          description: '经过或停留获得奖励',
          data: { bonus: 2000 }
        };
      } else if (i % 6 === 0) {
        // 特殊格子
        const specialTypes = ['event', 'tax', 'jail'];
        const specialType = specialTypes[Math.floor(i / 6) % specialTypes.length];
        
        cell = {
          id: `special_${i}`,
          position: i,
          type: specialType as any,
          name: this.getSpecialCellName(specialType),
          description: this.getSpecialCellDescription(specialType),
          data: this.getSpecialCellData(specialType)
        };
      } else {
        // 属性格子
        const zodiacGroup = zodiacGroups[zodiacIndex % zodiacGroups.length];
        const propertyInGroup = propertyIndex % zodiacGroup.properties;
        
        const property: Property = {
          id: `property_${i}`,
          position: i,
          type: 'property',
          name: `${zodiacGroup.zodiac}${propertyInGroup + 1}号地`,
          description: `${zodiacGroup.zodiac}生肖属性`,
          price: 1000 + (propertyIndex * 200),
          rent: 100 + (propertyIndex * 20),
          level: 0,
          maxLevel: 5,
          upgradePrice: 500 + (propertyIndex * 100),
          zodiac: zodiacGroup.zodiac,
          color: zodiacGroup.color,
          data: {
            zodiac: zodiacGroup.zodiac,
            color: zodiacGroup.color,
            groupIndex: zodiacIndex
          }
        };
        
        cell = property;
        propertyIndex++;
        
        if (propertyInGroup === zodiacGroup.properties - 1) {
          zodiacIndex++;
        }
      }

      board.push(cell);
    }

    return board;
  }

  /**
   * 获取特殊格子名称
   */
  private getSpecialCellName(type: string): string {
    const names = {
      event: '机遇',
      tax: '税收',
      jail: '监狱'
    };
    return names[type as keyof typeof names] || '特殊';
  }

  /**
   * 获取特殊格子描述
   */
  private getSpecialCellDescription(type: string): string {
    const descriptions = {
      event: '触发随机事件',
      tax: '缴纳税金',
      jail: '暂时停留'
    };
    return descriptions[type as keyof typeof descriptions] || '';
  }

  /**
   * 获取特殊格子数据
   */
  private getSpecialCellData(type: string): any {
    switch (type) {
      case 'tax':
        return { amount: 1000, type: 'fixed' };
      case 'jail':
        return { turns: 1, bailAmount: 500 };
      case 'event':
        return { eventPool: 'standard' };
      default:
        return {};
    }
  }

  /**
   * 获取默认游戏设置
   */
  private getDefaultGameSettings(): GameSettings {
    return {
      gameMode: 'classic',
      maxRounds: 50,
      startingMoney: 15000,
      winConditions: [
        { type: 'bankruptcy' },
        { type: 'wealth_goal', target: 100000 },
        { type: 'property_mogul', target: 15 },
        { type: 'round_limit' }
      ],
      enableAnimations: true,
      enableSound: true,
      autoSave: true,
      difficulty: 'medium'
    };
  }

  /**
   * 更新玩家位置
   */
  updatePlayerPosition(playerId: string, newPosition: number): void {
    const player = this.findPlayer(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);

    const oldPosition = player.position;
    player.position = newPosition;

    this.recordEvent({
      id: `pos_${Date.now()}`,
      type: 'player_moved',
      playerId,
      data: { oldPosition, newPosition },
      timestamp: Date.now(),
      processed: false
    });

    this.notifyStateChange({
      type: 'position_change',
      playerId,
      oldValue: oldPosition,
      newValue: newPosition
    });
  }

  /**
   * 更新玩家金钱
   */
  updatePlayerMoney(playerId: string, amount: number): void {
    const player = this.findPlayer(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);

    const oldMoney = player.money;
    player.money += amount;

    // 更新统计
    if (amount > 0) {
      player.stats.totalMoneyEarned += amount;
    } else {
      player.stats.totalMoneySpent += Math.abs(amount);
    }

    this.recordEvent({
      id: `money_${Date.now()}`,
      type: 'money_changed',
      playerId,
      data: { amount, oldMoney, newMoney: player.money },
      timestamp: Date.now(),
      processed: false
    });

    this.notifyStateChange({
      type: 'money_change',
      playerId,
      oldValue: oldMoney,
      newValue: player.money
    });

    // 检查破产
    if (player.money < 0 && !player.isEliminated) {
      this.eliminatePlayer(playerId);
    }
  }

  /**
   * 设置属性所有者
   */
  setPropertyOwner(propertyId: string, playerId: string): void {
    const property = this.getProperty(propertyId);
    if (!property) throw new Error(`Property ${propertyId} not found`);

    const player = this.findPlayer(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);

    const oldOwnerId = property.ownerId;
    property.ownerId = playerId;
    
    // 添加到玩家属性列表
    if (!player.properties.includes(propertyId)) {
      player.properties.push(propertyId);
      player.stats.propertiesBought++;
    }

    // 从原所有者移除
    if (oldOwnerId) {
      const oldOwner = this.findPlayer(oldOwnerId);
      if (oldOwner) {
        oldOwner.properties = oldOwner.properties.filter(id => id !== propertyId);
      }
    }

    this.recordEvent({
      id: `owner_${Date.now()}`,
      type: 'property_ownership_change',
      playerId,
      data: { propertyId, oldOwnerId, newOwnerId: playerId },
      timestamp: Date.now(),
      processed: false
    });

    this.notifyStateChange({
      type: 'property_ownership_change',
      playerId,
      oldValue: oldOwnerId,
      newValue: playerId,
      propertyId
    });
  }

  /**
   * 淘汰玩家
   */
  eliminatePlayer(playerId: string): void {
    const player = this.findPlayer(playerId);
    if (!player || player.isEliminated) return;

    player.isEliminated = true;

    // 释放所有属性
    player.properties.forEach(propertyId => {
      const property = this.getProperty(propertyId);
      if (property) {
        property.ownerId = undefined;
      }
    });
    player.properties = [];

    this.recordEvent({
      id: `elim_${Date.now()}`,
      type: 'player_eliminated',
      playerId,
      data: { reason: 'bankruptcy' },
      timestamp: Date.now(),
      processed: false
    });

    this.notifyStateChange({
      type: 'player_eliminated',
      playerId,
      oldValue: false,
      newValue: true
    });
  }

  /**
   * 添加状态效果
   */
  addStatusEffect(playerId: string, effect: StatusEffect): void {
    const player = this.findPlayer(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);

    // 移除同类型效果
    player.statusEffects = player.statusEffects.filter(e => e.id !== effect.id);
    
    // 添加新效果
    player.statusEffects.push(effect);

    this.recordEvent({
      id: `status_${Date.now()}`,
      type: 'status_effect_applied',
      playerId,
      data: { effect },
      timestamp: Date.now(),
      processed: false
    });

    this.notifyStateChange({
      type: 'status_effect_applied',
      playerId,
      oldValue: null,
      newValue: effect
    });
  }

  /**
   * 移除状态效果
   */
  removeStatusEffect(playerId: string, effectId: string): void {
    const player = this.findPlayer(playerId);
    if (!player) return;

    const effect = player.statusEffects.find(e => e.id === effectId);
    if (!effect) return;

    player.statusEffects = player.statusEffects.filter(e => e.id !== effectId);

    this.recordEvent({
      id: `status_rem_${Date.now()}`,
      type: 'status_effect_removed',
      playerId,
      data: { effectId, effect },
      timestamp: Date.now(),
      processed: false
    });

    this.notifyStateChange({
      type: 'status_effect_removed',
      playerId,
      oldValue: effect,
      newValue: null
    });
  }

  /**
   * 设置游戏阶段
   */
  setPhase(phase: GamePhase): void {
    const oldPhase = this.data.phase;
    this.data.phase = phase;
    this.data.timestamp = Date.now();

    this.recordEvent({
      id: `phase_${Date.now()}`,
      type: 'phase_change',
      data: { oldPhase, newPhase: phase },
      timestamp: Date.now(),
      processed: false
    });

    this.notifyStateChange({
      type: 'phase_change',
      oldValue: oldPhase,
      newValue: phase
    });
  }

  /**
   * 下一个玩家回合
   */
  nextTurn(): void {
    // 查找下一个未淘汰的玩家
    let nextIndex = (this.data.currentPlayerIndex + 1) % this.data.players.length;
    let attempts = 0;

    while (attempts < this.data.players.length) {
      const nextPlayer = this.data.players[nextIndex];
      if (nextPlayer && !nextPlayer.isEliminated) {
        break;
      }
      nextIndex = (nextIndex + 1) % this.data.players.length;
      attempts++;
    }

    // 检查是否完成一轮
    if (nextIndex <= this.data.currentPlayerIndex) {
      this.data.round++;
      
      this.recordEvent({
        id: `round_${Date.now()}`,
        type: 'round_complete',
        data: { round: this.data.round },
        timestamp: Date.now(),
        processed: false
      });
    }

    const oldPlayerIndex = this.data.currentPlayerIndex;
    this.data.currentPlayerIndex = nextIndex;

    // 更新当前玩家统计
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer) {
      currentPlayer.stats.turnsPlayed++;
    }

    this.notifyStateChange({
      type: 'turn_change',
      oldValue: oldPlayerIndex,
      newValue: nextIndex,
      playerId: currentPlayer?.id
    });
  }

  /**
   * 记录事件
   */
  recordEvent(event: GameEvent): void {
    this.data.gameHistory.push(event);
    this.emit('gameEvent', event);
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(change: StateChange): void {
    this.changeQueue.push(change);
    this.lastUpdateTime = Date.now();
    
    // 批量处理状态变化（防止过于频繁的更新）
    setTimeout(() => {
      if (this.changeQueue.length > 0) {
        const changes = [...this.changeQueue];
        this.changeQueue = [];
        
        this.emit('stateChanged', {
          changes,
          timestamp: this.lastUpdateTime,
          gameState: this.getSnapshot()
        });
      }
    }, 10);
  }

  // 查询方法
  getCurrentPlayer(): Player | null {
    return this.data.players[this.data.currentPlayerIndex] || null;
  }

  getPlayer(playerId: string): Player | null {
    return this.findPlayer(playerId);
  }

  getPlayers(): Player[] {
    return [...this.data.players];
  }

  findPlayer(playerId: string): Player | null {
    return this.data.players.find(p => p.id === playerId) || null;
  }

  getBoard(): BoardCell[] {
    return [...this.data.board];
  }

  getBoardCell(position: number): BoardCell | null {
    return this.data.board.find(cell => cell.position === position) || null;
  }

  getProperty(propertyId: string): Property | null {
    const cell = this.data.board.find(c => c.id === propertyId);
    return (cell?.type === 'property' ? cell : null) as Property | null;
  }

  getBoardSize(): number {
    return this.data.board.length;
  }

  getRound(): number {
    return this.data.round;
  }

  getPhase(): GamePhase {
    return this.data.phase;
  }

  getGameHistory(): GameEvent[] {
    return [...this.data.gameHistory];
  }

  getGameSettings(): GameSettings {
    return { ...this.data.gameSettings };
  }

  /**
   * 检查游戏是否结束
   */
  isGameOver(): boolean {
    const activePlayers = this.data.players.filter(p => !p.isEliminated);
    return activePlayers.length <= 1 || this.data.phase === 'game_over';
  }

  /**
   * 获取游戏状态快照
   */
  getSnapshot(): GameStateData {
    return {
      players: this.data.players.map(p => ({ ...p })),
      currentPlayerIndex: this.data.currentPlayerIndex,
      round: this.data.round,
      phase: this.data.phase,
      board: this.data.board.map(c => ({ ...c })),
      gameHistory: [...this.data.gameHistory],
      gameSettings: { ...this.data.gameSettings },
      timestamp: this.data.timestamp
    };
  }

  /**
   * 序列化游戏状态
   */
  serialize(): GameStateData {
    return this.getSnapshot();
  }

  /**
   * 反序列化游戏状态
   */
  deserialize(data: GameStateData): void {
    this.data = {
      ...data,
      timestamp: Date.now()
    };

    this.isInitialized = true;
    
    this.emit('stateRestored', {
      gameState: this.getSnapshot()
    });
  }

  /**
   * 验证游戏状态
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    // 验证玩家
    if (this.data.players.length === 0) {
      errors.push('No players in game');
    }

    // 验证当前玩家索引
    if (this.data.currentPlayerIndex >= this.data.players.length) {
      errors.push('Invalid current player index');
    }

    // 验证棋盘
    if (this.data.board.length === 0) {
      errors.push('Empty board');
    }

    // 验证属性所有权
    for (const player of this.data.players) {
      for (const propertyId of player.properties) {
        const property = this.getProperty(propertyId);
        if (!property || property.ownerId !== player.id) {
          errors.push(`Invalid property ownership: ${propertyId} for player ${player.id}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 重置游戏状态
   */
  reset(): void {
    this.data = {
      players: [],
      currentPlayerIndex: 0,
      round: 1,
      phase: 'waiting',
      board: [],
      gameHistory: [],
      gameSettings: this.getDefaultGameSettings(),
      timestamp: Date.now()
    };

    this.isInitialized = false;
    this.changeQueue = [];
    
    this.emit('reset');
  }

  /**
   * 销毁游戏状态
   */
  destroy(): void {
    this.reset();
    this.removeAllListeners();
  }
}

// 辅助接口
interface StateChange {
  type: string;
  playerId?: string;
  propertyId?: string;
  oldValue: any;
  newValue: any;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export default GameState;