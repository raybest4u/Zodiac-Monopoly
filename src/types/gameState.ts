/**
 * 统一的游戏状态定义
 * 解决当前状态管理混乱的问题
 */

import { 
  PlayerId, Position, Money, Round, GamePhase, GameStatus, 
  GameMode, GameDifficulty, WinCondition, EventType, Season, Weather
} from './core';
import { Player } from './player';

// ===== 游戏板块相关 =====

export interface BoardCell {
  readonly position: Position;
  readonly type: CellType;
  readonly name: string;
  readonly description?: string;
  
  // 地产相关
  price?: Money;
  rent?: Money;
  level?: number;
  owner?: PlayerId;
  isMortgaged?: boolean;
  
  // 特殊格子
  tax?: Money;
  effect?: CellEffect;
  
  // 元数据
  readonly group?: string;
  readonly color?: string;
  readonly special?: boolean;
}

export interface CellEffect {
  readonly type: 'money' | 'movement' | 'card' | 'jail' | 'teleport';
  readonly value?: number;
  readonly target?: 'self' | 'all' | 'others';
  readonly condition?: string;
}

export type CellType = 
  | 'start' | 'property' | 'chance' | 'community'
  | 'tax' | 'jail' | 'parking' | 'go_to_jail'
  | 'utility' | 'railroad' | 'special';

// ===== 游戏事件系统 =====

export interface GameEvent {
  readonly id: string;
  readonly type: EventType;
  readonly timestamp: number;
  readonly round: Round;
  readonly triggeredBy?: PlayerId;
  readonly data: EventData;
}

export interface EventData {
  readonly description: string;
  readonly effects: EventEffect[];
  readonly choices?: EventChoice[];
  readonly duration?: number;
}

export interface EventEffect {
  readonly type: 'money' | 'movement' | 'property' | 'status' | 'skill';
  readonly target: 'self' | 'all' | 'others' | 'random';
  readonly value: number;
  readonly description: string;
}

export interface EventChoice {
  readonly id: string;
  readonly description: string;
  readonly effects: EventEffect[];
  readonly cost?: Money;
  readonly requirement?: string;
}

// ===== 游戏设置 =====

export interface GameSettings {
  readonly mode: GameMode;
  readonly difficulty: GameDifficulty;
  readonly maxRounds?: Round;
  readonly timeLimit?: number; // 毫秒
  readonly startingMoney: Money;
  readonly winConditions: WinCondition[];
  readonly specialRules: SpecialRule[];
  readonly boardConfig: BoardConfiguration;
}

export interface SpecialRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly parameters?: Record<string, any>;
}

export interface BoardConfiguration {
  readonly size: number;
  readonly layout: 'classic' | 'zodiac' | 'custom';
  readonly specialCells: Position[];
  readonly startingPosition: Position;
}

// ===== 主要游戏状态接口 =====

/**
 * 统一的游戏状态接口
 * 这是整个游戏的核心状态容器
 */
export interface UnifiedGameState {
  // ===== 基础游戏信息 =====
  readonly gameId: string;
  readonly status: GameStatus;           // 游戏整体状态
  readonly phase: GamePhase;             // 当前回合阶段
  readonly mode: GameMode;
  readonly difficulty: GameDifficulty;
  
  // ===== 时间和回合 =====
  readonly round: Round;
  readonly currentPlayerIndex: number;
  readonly startTime: number;
  readonly lastUpdateTime: number;
  readonly timeLimit?: number;
  
  // ===== 玩家和板块 =====
  readonly players: Player[];
  readonly board: BoardCell[];
  
  // ===== 游戏历史和事件 =====
  readonly gameHistory: GameEvent[];
  readonly activeEvents: GameEvent[];
  readonly eventQueue: QueuedEvent[];
  
  // ===== 游戏设置 =====
  readonly settings: GameSettings;
  
  // ===== 环境状态 =====
  readonly season: Season;
  readonly weather: Weather;
  readonly seasonRound: Round;           // 当前季节的回合数
  
  // ===== 游戏流控制 =====
  readonly isPaused: boolean;
  readonly isInitialized: boolean;
  readonly lastAction?: LastAction;
  
  // ===== 胜利条件和结果 =====
  readonly winner?: PlayerId;
  readonly gameResult?: GameResult;
  
  // ===== 临时状态 =====
  readonly diceResult?: DiceResult;
  readonly pendingAction?: PendingAction;
  readonly notifications: GameNotification[];
}

// ===== 辅助类型 =====

export interface QueuedEvent {
  readonly event: GameEvent;
  readonly triggerRound: Round;
  readonly priority: number;
}

export interface LastAction {
  readonly type: string;
  readonly playerId: PlayerId;
  readonly timestamp: number;
  readonly success: boolean;
  readonly result?: any;
}

export interface GameResult {
  readonly winner: PlayerId;
  readonly winCondition: WinCondition;
  readonly finalStats: PlayerFinalStats[];
  readonly duration: number; // 毫秒
  readonly totalRounds: Round;
}

export interface PlayerFinalStats {
  readonly playerId: PlayerId;
  readonly finalMoney: Money;
  readonly finalAssets: Money;
  readonly propertiesOwned: number;
  readonly rank: number;
}

export interface DiceResult {
  readonly dice1: number;
  readonly dice2: number;
  readonly total: number;
  readonly isDouble: boolean;
  readonly timestamp: number;
}

export interface PendingAction {
  readonly type: string;
  readonly playerId: PlayerId;
  readonly data: any;
  readonly expiresAt: number;
}

export interface GameNotification {
  readonly id: string;
  readonly type: 'info' | 'warning' | 'error' | 'success';
  readonly message: string;
  readonly timestamp: number;
  readonly playerId?: PlayerId;
  readonly autoHide?: boolean;
}

// ===== 状态验证和工具函数 =====

/**
 * 验证游戏状态的完整性
 */
export function validateGameState(gameState: UnifiedGameState): boolean {
  // 基础验证
  if (!gameState.gameId || !gameState.players || !gameState.board) {
    return false;
  }
  
  // 玩家验证
  if (gameState.players.length === 0) {
    return false;
  }
  
  // 当前玩家索引验证
  if (gameState.currentPlayerIndex < 0 || gameState.currentPlayerIndex >= gameState.players.length) {
    return false;
  }
  
  // 回合数验证
  if (gameState.round < 1) {
    return false;
  }
  
  // 板块验证
  if (gameState.board.length === 0) {
    return false;
  }
  
  return true;
}

/**
 * 获取当前玩家
 */
export function getCurrentPlayer(gameState: UnifiedGameState): Player | null {
  if (gameState.currentPlayerIndex >= 0 && gameState.currentPlayerIndex < gameState.players.length) {
    return gameState.players[gameState.currentPlayerIndex];
  }
  return null;
}

/**
 * 获取指定位置的板块
 */
export function getBoardCell(gameState: UnifiedGameState, position: Position): BoardCell | null {
  return gameState.board.find(cell => cell.position === position) || null;
}

/**
 * 获取玩家拥有的地产列表
 */
export function getPlayerProperties(gameState: UnifiedGameState, playerId: PlayerId): BoardCell[] {
  return gameState.board.filter(cell => cell.owner === playerId);
}

/**
 * 检查游戏是否结束
 */
export function isGameOver(gameState: UnifiedGameState): boolean {
  return gameState.status === 'game_over' || !!gameState.winner;
}

/**
 * 获取活跃玩家列表（未破产的玩家）
 */
export function getActivePlayers(gameState: UnifiedGameState): Player[] {
  return gameState.players.filter(player => player.money > 0 || getPlayerProperties(gameState, player.id).length > 0);
}

/**
 * 创建空的游戏状态
 */
export function createEmptyGameState(gameId: string): UnifiedGameState {
  return {
    gameId,
    status: 'waiting',
    phase: 'roll_dice',
    mode: 'classic',
    difficulty: 'normal',
    
    round: 1,
    currentPlayerIndex: 0,
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    
    players: [],
    board: [],
    
    gameHistory: [],
    activeEvents: [],
    eventQueue: [],
    
    settings: {
      mode: 'classic',
      difficulty: 'normal',
      startingMoney: 1500,
      winConditions: ['elimination'],
      specialRules: [],
      boardConfig: {
        size: 40,
        layout: 'classic',
        specialCells: [],
        startingPosition: 0
      }
    },
    
    season: '春',
    weather: '晴',
    seasonRound: 1,
    
    isPaused: false,
    isInitialized: false,
    
    notifications: []
  };
}