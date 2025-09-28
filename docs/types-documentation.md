# 十二生肖大富翁游戏类型文档

本文档详细介绍了游戏中使用的所有TypeScript类型定义、接口和使用示例。

## 目录

- [核心游戏类型](#核心游戏类型)
- [AI系统类型](#ai系统类型)
- [存储系统类型](#存储系统类型)
- [UI组件类型](#ui组件类型)
- [常量定义](#常量定义)
- [类型验证](#类型验证)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)

## 核心游戏类型

### ZodiacSign - 生肖类型

十二生肖的联合类型定义：

```typescript
export type ZodiacSign = 
  | '鼠' | '牛' | '虎' | '兔' | '龙' | '蛇'
  | '马' | '羊' | '猴' | '鸡' | '狗' | '猪';
```

**使用示例：**
```typescript
import type { ZodiacSign } from '@types/game';

const playerZodiac: ZodiacSign = '龙';
const isValidZodiac = (zodiac: string): zodiac is ZodiacSign => {
  const validZodiacs: ZodiacSign[] = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  return validZodiacs.includes(zodiac as ZodiacSign);
};
```

### Player - 玩家接口

玩家的完整数据结构：

```typescript
export interface Player {
  id: string;
  name: string;
  zodiac: ZodiacSign;
  isHuman: boolean;
  avatar?: string;
  
  // 游戏状态
  position: number;
  money: number;
  properties: string[];
  items: GameItem[];
  
  // 技能和状态
  skills: PlayerSkill[];
  statusEffects: StatusEffect[];
  
  // 统计数据
  statistics: PlayerStatistics;
}
```

**使用示例：**
```typescript
import type { Player, ZodiacSign } from '@types/game';

const createPlayer = (name: string, zodiac: ZodiacSign, isHuman = false): Player => {
  return {
    id: generateId(),
    name,
    zodiac,
    isHuman,
    position: 0,
    money: 10000,
    properties: [],
    items: [],
    skills: getZodiacSkills(zodiac),
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
};

// 使用示例
const humanPlayer = createPlayer('玩家', '龙', true);
const aiPlayer = createPlayer('智能对手', '虎', false);
```

### GameState - 游戏状态接口

游戏的完整状态信息：

```typescript
export interface GameState {
  // 基础信息
  gameId: string;
  status: GameStatus;
  mode: GameMode;
  
  // 玩家信息
  players: Player[];
  currentPlayerIndex: number;
  
  // 游戏进度
  round: number;
  phase: GamePhase;
  turn: number;
  
  // 棋盘状态
  board: BoardCell[];
  
  // 游戏事件
  currentEvent?: GameEvent;
  eventHistory: GameEvent[];
  
  // 市场状态
  season: Season;
  weather: Weather;
  marketTrends: MarketTrends;
  
  // 时间信息
  startTime: number;
  elapsedTime: number;
  lastUpdateTime: number;
  lastSaveTime?: number;
  
  // 最后掷骰结果
  lastDiceResult?: DiceResult;
}
```

**使用示例：**
```typescript
import type { GameState, GameStatus, GamePhase } from '@types/game';

const initializeGameState = (players: Player[]): GameState => {
  return {
    gameId: generateId(),
    status: 'waiting' as GameStatus,
    mode: 'classic',
    players,
    currentPlayerIndex: 0,
    round: 1,
    phase: 'roll_dice' as GamePhase,
    turn: 1,
    board: generateBoard(),
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
    startTime: Date.now(),
    elapsedTime: 0,
    lastUpdateTime: Date.now()
  };
};

// 游戏状态更新示例
const updateGameState = (state: GameState, updates: Partial<GameState>): GameState => {
  return {
    ...state,
    ...updates,
    lastUpdateTime: Date.now()
  };
};
```

### PlayerSkill - 玩家技能接口

技能系统的核心接口：

```typescript
export interface PlayerSkill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  zodiac: ZodiacSign;
  cooldown: number;
  lastUsed?: number;
  level: number;
  maxLevel: number;
  effects: SkillEffect[];
  
  // 技能条件
  requirements?: SkillRequirement[];
  
  // 技能升级
  experiencePoints: number;
  nextLevelExp: number;
  
  // 视觉和音效
  iconUrl?: string;
  animationName?: string;
  soundEffect?: string;
  
  // 技能标签
  tags: SkillTag[];
  
  // 技能增强
  enhancements?: SkillEnhancement[];
}
```

**使用示例：**
```typescript
import type { PlayerSkill, ZodiacSign, SkillType } from '@types/game';

const createZodiacSkill = (zodiac: ZodiacSign): PlayerSkill[] => {
  const skills: Record<ZodiacSign, PlayerSkill[]> = {
    '龙': [
      {
        id: 'dragon_majesty',
        name: '龙威',
        type: 'active' as SkillType,
        description: '展现龙的威严，增加谈判成功率',
        zodiac: '龙',
        cooldown: 5,
        level: 1,
        maxLevel: 5,
        effects: [
          {
            type: 'negotiation_bonus',
            value: 0.3,
            target: 'self',
            duration: 3
          }
        ],
        experiencePoints: 0,
        nextLevelExp: 100,
        tags: ['social', 'zodiac_synergy'],
        iconUrl: '/icons/skills/dragon_majesty.png'
      }
    ],
    // ... 其他生肖技能
  };
  
  return skills[zodiac] || [];
};

// 技能使用示例
const useSkill = (player: Player, skillId: string): boolean => {
  const skill = player.skills.find(s => s.id === skillId);
  if (!skill) return false;
  
  // 检查冷却时间
  const now = Date.now();
  if (skill.lastUsed && (now - skill.lastUsed) < skill.cooldown * 1000) {
    return false;
  }
  
  // 使用技能
  skill.lastUsed = now;
  skill.experiencePoints += 10;
  
  // 检查升级
  if (skill.experiencePoints >= skill.nextLevelExp && skill.level < skill.maxLevel) {
    skill.level++;
    skill.experiencePoints = 0;
    skill.nextLevelExp *= 1.5;
  }
  
  return true;
};
```

## AI系统类型

### AIPersonality - AI个性接口

AI对手的个性特征定义：

```typescript
export interface AIPersonality {
  // 基础特征 (0-1)
  risk_tolerance: number;      // 风险承受能力
  aggression: number;          // 攻击性
  cooperation: number;         // 合作倾向
  adaptability: number;        // 适应性
  patience: number;           // 耐心程度
  
  // 投资偏好
  property_preference: PropertyPreference;
  skill_usage_tendency: SkillUsageTendency;
  
  // 社交特征
  negotiation_style: NegotiationStyle;
  reaction_patterns: ReactionPattern[];
  
  // 生肖特色
  zodiac_traits: ZodiacTraits;
  cultural_preferences: string[];
}
```

**使用示例：**
```typescript
import type { AIPersonality, ZodiacSign } from '@types/ai';

const generateAIPersonality = (zodiac: ZodiacSign, difficulty: string): AIPersonality => {
  const baseTraits = getZodiacBasePersonality(zodiac);
  const difficultyModifier = getDifficultyModifier(difficulty);
  
  return {
    risk_tolerance: clamp(baseTraits.risk_tolerance + randomVariance(), 0, 1),
    aggression: clamp(baseTraits.aggression * difficultyModifier, 0, 1),
    cooperation: clamp(baseTraits.cooperation, 0, 1),
    adaptability: clamp(baseTraits.adaptability + difficultyModifier * 0.2, 0, 1),
    patience: clamp(baseTraits.patience, 0, 1),
    
    property_preference: {
      preferredTypes: getZodiacPropertyPreference(zodiac),
      investmentFocus: 'balanced',
      maxInvestmentRatio: 0.6
    },
    
    skill_usage_tendency: {
      aggressiveSkills: baseTraits.aggression,
      defensiveSkills: 1 - baseTraits.aggression,
      economicSkills: 0.7,
      timingPreference: 'opportunistic'
    },
    
    negotiation_style: {
      style: baseTraits.aggression > 0.7 ? 'aggressive' : 'cooperative',
      concessionRate: 1 - baseTraits.patience,
      bluffProbability: baseTraits.risk_tolerance * 0.8,
      fairnessWeight: baseTraits.cooperation
    },
    
    reaction_patterns: generateReactionPatterns(zodiac),
    zodiac_traits: getZodiacTraits(zodiac),
    cultural_preferences: getCulturalPreferences(zodiac)
  };
};

// AI决策示例
const makeAIDecision = (
  personality: AIPersonality, 
  gameState: GameState, 
  availableActions: string[]
): AIDecision => {
  const analysis = analyzeGameSituation(gameState, personality);
  const bestAction = selectBestAction(availableActions, analysis, personality);
  
  return {
    action: bestAction,
    confidence: calculateConfidence(analysis, personality),
    reasoning: generateReasoning(bestAction, analysis),
    alternatives: generateAlternatives(availableActions, analysis),
    analysis,
    strategy: getCurrentStrategy(personality, gameState),
    timestamp: Date.now()
  };
};
```

### AIDecision - AI决策接口

AI做出的决策信息：

```typescript
export interface AIDecision {
  action: PlayerAction;
  confidence: number;
  reasoning: string;
  alternatives: AlternativeAction[];
  
  // 决策过程
  analysis: SituationAnalysis;
  strategy: AIStrategy;
  
  timestamp: number;
}
```

## 存储系统类型

### SaveData - 存档数据接口

```typescript
export interface SaveData {
  version: string;
  saveId: string;
  name: string;
  
  // 游戏数据
  gameState: GameState;
  aiStates: AIState[];
  
  // 元数据
  timestamp: number;
  playTime: number;
  round: number;
  difficulty: string;
  
  // 压缩标记
  compressed?: boolean;
  originalSize?: number;
  
  // 校验
  checksum: string;
}
```

**使用示例：**
```typescript
import type { SaveData, GameState } from '@types/storage';

const createSaveData = (
  gameState: GameState, 
  aiStates: AIState[], 
  saveName: string
): SaveData => {
  const saveData: SaveData = {
    version: '1.0.0',
    saveId: generateId(),
    name: saveName,
    gameState,
    aiStates,
    timestamp: Date.now(),
    playTime: gameState.elapsedTime,
    round: gameState.round,
    difficulty: 'normal',
    checksum: ''
  };
  
  // 计算校验和
  saveData.checksum = calculateChecksum(saveData);
  
  return saveData;
};

// 存档加载示例
const loadGameFromSave = async (saveId: string): Promise<{gameState: GameState, aiStates: AIState[]}> => {
  const saveData = await storageManager.loadGame(saveId);
  
  // 验证存档
  if (!validateSaveData(saveData)) {
    throw new Error('Invalid save data');
  }
  
  // 验证校验和
  if (!verifyChecksum(saveData)) {
    throw new Error('Save data corrupted');
  }
  
  return {
    gameState: saveData.gameState,
    aiStates: saveData.aiStates
  };
};
```

## UI组件类型

### ButtonProps - 按钮组件属性

```typescript
export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ComponentSize;
  color?: ButtonColor;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}
```

**使用示例：**
```typescript
import React from 'react';
import type { ButtonProps } from '@types/ui';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  color = 'default',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  onClick,
  className = ''
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      className={`btn btn-${variant} btn-${size} btn-${color} ${fullWidth ? 'w-full' : ''} ${rounded ? 'rounded-full' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? <Spinner /> : (
        <>
          {icon && iconPosition === 'left' && <span className="btn-icon-left">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="btn-icon-right">{icon}</span>}
        </>
      )}
    </button>
  );
};

// 使用示例
const GameControlPanel = () => {
  return (
    <div className="control-panel">
      <Button
        variant="primary"
        size="lg"
        onClick={() => rollDice()}
        icon={<DiceIcon />}
      >
        掷骰子
      </Button>
      
      <Button
        variant="secondary"
        color="success"
        onClick={() => buyProperty()}
        disabled={!canBuyProperty}
      >
        购买房产
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => showHelp()}
      >
        帮助
      </Button>
    </div>
  );
};
```

## 常量定义

### GAME_CONSTANTS - 游戏常量

```typescript
export const GAME_CONSTANTS = {
  // 基础游戏设置
  BOARD_SIZE: 40,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  STARTING_MONEY: 10000,
  PASS_START_BONUS: 2000,
  MAX_ROUNDS: 100,
  
  // 骰子
  DICE_MIN: 1,
  DICE_MAX: 6,
  DICE_COUNT: 2,
  
  // 属性
  MAX_PROPERTY_LEVEL: 5,
  PROPERTY_GROUPS: 8,
  PROPERTIES_PER_GROUP: 3,
  
  // 技能
  MAX_SKILL_LEVEL: 10,
  SKILLS_PER_ZODIAC: 2,
  SKILL_COOLDOWN_BASE: 3,
} as const;
```

**使用示例：**
```typescript
import { GAME_CONSTANTS, ZODIAC_DATA } from '@types/constants';

// 验证玩家数量
const validatePlayerCount = (playerCount: number): boolean => {
  return playerCount >= GAME_CONSTANTS.MIN_PLAYERS && 
         playerCount <= GAME_CONSTANTS.MAX_PLAYERS;
};

// 生成起始资金
const getStartingMoney = (difficulty: string): number => {
  const base = GAME_CONSTANTS.STARTING_MONEY;
  switch (difficulty) {
    case 'easy': return base * 1.5;
    case 'hard': return base * 0.7;
    default: return base;
  }
};

// 使用生肖数据
const getZodiacInfo = (zodiac: ZodiacSign) => {
  const data = ZODIAC_DATA[zodiac];
  return {
    name: data.name,
    element: data.element,
    traits: data.traits,
    color: data.color,
    emoji: data.emoji
  };
};
```

## 类型验证

### 验证工具使用

```typescript
import { validate, ValidationResult } from '@utils/typeValidation';

// 验证玩家数据
const validatePlayerData = (playerData: unknown): boolean => {
  const result: ValidationResult = validate.player(playerData);
  
  if (!result.isValid) {
    console.error('Player validation failed:', result.errors);
    result.errors.forEach(error => {
      console.error(`Field: ${error.field}, Message: ${error.message}`);
    });
    return false;
  }
  
  if (result.warnings.length > 0) {
    console.warn('Player validation warnings:', result.warnings);
  }
  
  return true;
};

// 验证游戏状态
const validateGameStateData = (gameStateData: unknown): boolean => {
  const result = validate.gameState(gameStateData);
  return result.isValid;
};

// 验证游戏是否可以开始
const checkCanStartGame = (gameState: GameState): boolean => {
  const result = validate.canStartGame(gameState);
  
  if (!result.isValid) {
    result.errors.forEach(error => {
      notificationService.showError(`无法开始游戏: ${error.message}`);
    });
    return false;
  }
  
  return true;
};
```

## 使用示例

### 完整的游戏初始化示例

```typescript
import type { 
  GameConfig, 
  GameState, 
  Player, 
  AIOpponentConfig 
} from '@types/storage';
import { validate } from '@utils/typeValidation';
import { GAME_CONSTANTS } from '@types/constants';

const initializeNewGame = async (config: GameConfig): Promise<GameState> => {
  // 验证配置
  const configResult = validate.gameConfig(config);
  if (!configResult.isValid) {
    throw new Error(`Invalid game config: ${configResult.errors.map(e => e.message).join(', ')}`);
  }
  
  // 创建人类玩家
  const humanPlayer: Player = createPlayer(
    config.playerName,
    config.playerZodiac,
    true
  );
  
  // 创建AI玩家
  const aiPlayers: Player[] = config.aiOpponents.map(aiConfig => 
    createPlayer(aiConfig.name, aiConfig.zodiac, false)
  );
  
  const allPlayers = [humanPlayer, ...aiPlayers];
  
  // 验证玩家
  for (const player of allPlayers) {
    const playerResult = validate.player(player);
    if (!playerResult.isValid) {
      throw new Error(`Invalid player: ${playerResult.errors.map(e => e.message).join(', ')}`);
    }
  }
  
  // 创建游戏状态
  const gameState: GameState = {
    gameId: generateId(),
    status: 'waiting',
    mode: 'classic',
    players: allPlayers,
    currentPlayerIndex: 0,
    round: 1,
    phase: 'roll_dice',
    turn: 1,
    board: generateBoard(),
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
    startTime: Date.now(),
    elapsedTime: 0,
    lastUpdateTime: Date.now()
  };
  
  // 验证游戏状态
  const stateResult = validate.gameState(gameState);
  if (!stateResult.isValid) {
    throw new Error(`Invalid game state: ${stateResult.errors.map(e => e.message).join(', ')}`);
  }
  
  // 检查是否可以开始游戏
  const canStartResult = validate.canStartGame(gameState);
  if (!canStartResult.isValid) {
    throw new Error(`Cannot start game: ${canStartResult.errors.map(e => e.message).join(', ')}`);
  }
  
  return gameState;
};
```

### React组件中的类型使用示例

```typescript
import React, { useState, useEffect } from 'react';
import type { 
  GameState, 
  Player, 
  ZodiacSign,
  DiceResult 
} from '@types/game';
import type { GameBoardProps, PlayerCardProps } from '@types/ui';

interface GameComponentProps {
  initialGameState: GameState;
  onGameStateChange: (gameState: GameState) => void;
}

const GameComponent: React.FC<GameComponentProps> = ({
  initialGameState,
  onGameStateChange
}) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  const handleDiceRoll = () => {
    const result: DiceResult = {
      dice1: Math.floor(Math.random() * 6) + 1,
      dice2: Math.floor(Math.random() * 6) + 1,
      total: 0,
      isDouble: false,
      timestamp: Date.now()
    };
    
    result.total = result.dice1 + result.dice2;
    result.isDouble = result.dice1 === result.dice2;
    
    setDiceResult(result);
    
    // 更新游戏状态
    const updatedGameState: GameState = {
      ...gameState,
      lastDiceResult: result,
      lastUpdateTime: Date.now()
    };
    
    setGameState(updatedGameState);
    onGameStateChange(updatedGameState);
  };
  
  const handlePlayerMove = (player: Player, from: number, to: number) => {
    const updatedPlayers = gameState.players.map(p => 
      p.id === player.id ? { ...p, position: to } : p
    );
    
    const updatedGameState: GameState = {
      ...gameState,
      players: updatedPlayers,
      lastUpdateTime: Date.now()
    };
    
    setGameState(updatedGameState);
    onGameStateChange(updatedGameState);
  };
  
  return (
    <div className="game-container">
      <div className="game-board-section">
        <GameBoard
          board={gameState.board}
          players={gameState.players}
          currentPlayer={currentPlayer}
          onPlayerMove={handlePlayerMove}
          highlightedCells={diceResult ? [currentPlayer.position + diceResult.total] : []}
        />
      </div>
      
      <div className="players-section">
        {gameState.players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayer.id}
            showStats={true}
            showSkills={player.isHuman}
          />
        ))}
      </div>
      
      <div className="controls-section">
        <button 
          onClick={handleDiceRoll}
          disabled={gameState.status !== 'playing' || gameState.phase !== 'roll_dice'}
        >
          掷骰子
        </button>
        
        {diceResult && (
          <div className="dice-result">
            <span>骰子结果: {diceResult.dice1} + {diceResult.dice2} = {diceResult.total}</span>
            {diceResult.isDouble && <span className="double-notice">双数!</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameComponent;
```

## 最佳实践

### 1. 类型安全

```typescript
// ✅ 好的做法：使用类型守护
const isPlayer = (obj: unknown): obj is Player => {
  return typeof obj === 'object' && obj !== null && 
         'id' in obj && 'name' in obj && 'zodiac' in obj;
};

// ✅ 好的做法：使用联合类型
type GameAction = 'roll_dice' | 'buy_property' | 'use_skill' | 'end_turn';

// ❌ 避免：使用 any
const processAction = (action: any) => { /* ... */ };

// ✅ 好的做法：使用具体类型
const processAction = (action: GameAction) => { /* ... */ };
```

### 2. 错误处理

```typescript
// ✅ 好的做法：使用 Result 模式
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const createPlayer = (name: string, zodiac: ZodiacSign): Result<Player> => {
  try {
    const player = { /* ... */ };
    const validationResult = validate.player(player);
    
    if (!validationResult.isValid) {
      return { 
        success: false, 
        error: new Error(validationResult.errors.map(e => e.message).join(', ')) 
      };
    }
    
    return { success: true, data: player };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};
```

### 3. 性能优化

```typescript
// ✅ 好的做法：使用 readonly 对于不变数据
type ReadonlyGameState = Readonly<GameState>;

// ✅ 好的做法：使用部分类型更新
const updateGameState = (
  state: GameState, 
  updates: Partial<Pick<GameState, 'status' | 'phase' | 'turn'>>
): GameState => {
  return { ...state, ...updates, lastUpdateTime: Date.now() };
};

// ✅ 好的做法：使用工厂函数
const createEmptyGameState = (): GameState => ({
  gameId: '',
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
});
```

### 4. 可维护性

```typescript
// ✅ 好的做法：使用命名空间组织相关类型
namespace GameTypes {
  export interface Player { /* ... */ }
  export interface GameState { /* ... */ }
  export interface BoardCell { /* ... */ }
}

// ✅ 好的做法：使用条件类型
type PlayerAction<T extends Player> = T extends { isHuman: true }
  ? HumanPlayerAction
  : AIPlayerAction;

// ✅ 好的做法：使用映射类型
type PlayerStatus = {
  readonly [K in keyof Player]: Player[K] extends number ? 'valid' | 'invalid' : 'unknown';
};
```

这份文档涵盖了游戏中所有主要的类型定义和使用方法。建议开发团队定期更新此文档，确保类型定义与实际代码保持同步。