/**
 * 基础游戏规则 - 十二生肖大富翁核心规则定义
 * 包含所有基础游戏机制的规则实现
 */

import type {
  GameState,
  Player,
  PlayerAction,
  DiceResult,
  BoardCell,
  ZodiacSign,
  Season,
  PlayerSkill,
  GamePhase
} from '../types/game';
import type {
  RuleDefinition,
  RuleExecutionContext,
  RuleValidationResult,
  RuleExecutionResult,
  StateChange
} from './GameRuleSystem';

/**
 * 骰子规则
 */
export const DICE_RULES: RuleDefinition[] = [
  {
    id: 'dice_roll_basic',
    name: '基础掷骰子规则',
    description: '玩家在自己回合开始时必须掷骰子',
    category: 'movement',
    priority: 100,
    conditions: [],
    requirements: [],
    applicablePhases: ['roll_dice'],
    applicableActions: ['roll_dice'],
    validator: (context) => {
      const { gameState, currentPlayer } = context;
      
      // 检查是否轮到当前玩家
      if (gameState.players[gameState.currentPlayerIndex].id !== currentPlayer.id) {
        return {
          isValid: false,
          reason: '不是您的回合'
        };
      }
      
      // 检查游戏阶段
      if (gameState.phase !== 'roll_dice') {
        return {
          isValid: false,
          reason: '当前阶段不能掷骰子',
          suggestedActions: []
        };
      }
      
      return { isValid: true };
    },
    executor: (context) => {
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;
      const isDouble = dice1 === dice2;
      
      const diceResult: DiceResult = {
        dice1,
        dice2,
        total,
        isDouble,
        timestamp: Date.now()
      };
      
      const stateChanges: StateChange[] = [{
        path: 'lastDiceResult',
        oldValue: context.gameState.lastDiceResult,
        newValue: diceResult,
        reason: '掷骰子结果',
        reversible: false
      }];
      
      return {
        success: true,
        message: `掷出${dice1}和${dice2}，总计${total}点${isDouble ? '（双倍！）' : ''}`,
        effects: [],
        validationsPassed: ['dice_roll_basic'],
        validationsFailed: [],
        stateChanges,
        triggeredEvents: isDouble ? ['dice_rolled', 'double_rolled'] : ['dice_rolled'],
        nextPhase: 'move_player'
      };
    }
  },
  
  {
    id: 'double_dice_rule',
    name: '双倍骰子规则',
    description: '掷出双倍可以再次行动，但连续三次双倍会入狱',
    category: 'movement',
    priority: 95,
    conditions: [],
    requirements: [],
    applicablePhases: ['roll_dice'],
    applicableActions: ['roll_dice'],
    validator: (context) => {
      // 双倍规则总是可以验证
      return { isValid: true };
    },
    executor: (context) => {
      const { gameState } = context;
      const doubleCount = gameState.lastDiceResult?.isDouble ? 
        (context.currentPlayer.statistics.turnsPlayed % 3) : 0;
      
      if (doubleCount >= 3) {
        // 三次双倍入狱
        return {
          success: true,
          message: '连续三次双倍，进入监狱！',
          effects: [],
          validationsPassed: ['double_dice_rule'],
          validationsFailed: [],
          stateChanges: [{
            path: `players.${gameState.currentPlayerIndex}.position`,
            oldValue: context.currentPlayer.position,
            newValue: 10, // 假设监狱位置是10
            reason: '连续三次双倍入狱',
            reversible: false
          }],
          triggeredEvents: ['sent_to_jail'],
          nextPhase: 'end_turn'
        };
      }
      
      return {
        success: true,
        message: '双倍规则检查完成',
        effects: [],
        validationsPassed: ['double_dice_rule'],
        validationsFailed: [],
        stateChanges: [],
        triggeredEvents: []
      };
    }
  }
];

/**
 * 移动规则
 */
export const MOVEMENT_RULES: RuleDefinition[] = [
  {
    id: 'board_movement',
    name: '棋盘移动规则',
    description: '玩家在棋盘上的基本移动逻辑',
    category: 'movement',
    priority: 90,
    conditions: [],
    requirements: [],
    applicablePhases: ['move_player'],
    applicableActions: ['move_player'],
    validator: (context) => {
      const { gameState } = context;
      
      if (!gameState.lastDiceResult) {
        return {
          isValid: false,
          reason: '没有掷骰子结果'
        };
      }
      
      return { isValid: true };
    },
    executor: (context) => {
      const { gameState, currentPlayer } = context;
      const steps = gameState.lastDiceResult!.total;
      const oldPosition = currentPlayer.position;
      const newPosition = (oldPosition + steps) % gameState.board.length;
      const passedStart = newPosition < oldPosition;
      
      const stateChanges: StateChange[] = [{
        path: `players.${gameState.currentPlayerIndex}.position`,
        oldValue: oldPosition,
        newValue: newPosition,
        reason: `移动${steps}步`,
        reversible: false
      }];
      
      // 经过起点奖励
      if (passedStart) {
        stateChanges.push({
          path: `players.${gameState.currentPlayerIndex}.money`,
          oldValue: currentPlayer.money,
          newValue: currentPlayer.money + 2000,
          reason: '经过起点获得薪水',
          reversible: false
        });
      }
      
      return {
        success: true,
        message: `移动到位置${newPosition}${passedStart ? '，获得起点薪水2000元' : ''}`,
        effects: [],
        validationsPassed: ['board_movement'],
        validationsFailed: [],
        stateChanges,
        triggeredEvents: passedStart ? ['passed_start', 'salary_received'] : ['moved'],
        nextPhase: 'process_cell'
      };
    }
  }
];

/**
 * 财产规则
 */
export const PROPERTY_RULES: RuleDefinition[] = [
  {
    id: 'property_rent',
    name: '租金支付规则',
    description: '玩家停留在他人财产上需支付租金',
    category: 'property',
    priority: 85,
    conditions: [],
    requirements: [],
    applicablePhases: ['process_cell'],
    applicableActions: ['pay_rent'],
    validator: (context) => {
      const { currentPlayer, gameState } = context;
      const currentCell = gameState.board[currentPlayer.position];
      
      if (currentCell.type !== 'property' || !currentCell.ownerId) {
        return { isValid: false, reason: '当前位置不是他人财产' };
      }
      
      if (currentCell.ownerId === currentPlayer.id) {
        return { isValid: false, reason: '这是您自己的财产' };
      }
      
      return { isValid: true };
    },
    executor: (context) => {
      const { currentPlayer, gameState } = context;
      const currentCell = gameState.board[currentPlayer.position];
      const owner = gameState.players.find(p => p.id === currentCell.ownerId);
      const rent = currentCell.rent || 500;
      
      // 计算实际租金（考虑等级加成）
      const actualRent = rent * (currentCell.level || 1);
      
      const stateChanges: StateChange[] = [
        {
          path: `players.${gameState.currentPlayerIndex}.money`,
          oldValue: currentPlayer.money,
          newValue: Math.max(0, currentPlayer.money - actualRent),
          reason: `支付${currentCell.name}租金`,
          reversible: false
        }
      ];
      
      if (owner) {
        const ownerIndex = gameState.players.findIndex(p => p.id === owner.id);
        stateChanges.push({
          path: `players.${ownerIndex}.money`,
          oldValue: owner.money,
          newValue: owner.money + actualRent,
          reason: `收取${currentCell.name}租金`,
          reversible: false
        });
      }
      
      return {
        success: true,
        message: `支付${actualRent}元租金给${owner?.name}`,
        effects: [],
        validationsPassed: ['property_rent'],
        validationsFailed: [],
        stateChanges,
        triggeredEvents: ['rent_paid'],
        nextPhase: 'end_turn'
      };
    }
  },
  
  {
    id: 'property_upgrade',
    name: '财产升级规则',
    description: '玩家可以升级自己的财产以增加租金',
    category: 'property',
    priority: 80,
    conditions: [],
    requirements: [],
    applicablePhases: ['process_cell'],
    applicableActions: ['upgrade_property'],
    validator: (context) => {
      const { action, currentPlayer, gameState } = context;
      const propertyId = action.data?.propertyId;
      
      if (!propertyId) {
        return { isValid: false, reason: '未指定要升级的财产' };
      }
      
      const property = gameState.board.find(cell => cell.id === propertyId);
      if (!property || property.ownerId !== currentPlayer.id) {
        return { isValid: false, reason: '您不拥有该财产' };
      }
      
      const upgradeLevel = property.level || 1;
      if (upgradeLevel >= 5) {
        return { isValid: false, reason: '财产已达到最高等级' };
      }
      
      const upgradeCost = (property.price || 1000) * 0.5 * upgradeLevel;
      if (currentPlayer.money < upgradeCost) {
        return { 
          isValid: false, 
          reason: `升级需要${upgradeCost}元，资金不足` 
        };
      }
      
      return { isValid: true };
    },
    executor: (context) => {
      const { action, currentPlayer, gameState } = context;
      const propertyId = action.data?.propertyId;
      const property = gameState.board.find(cell => cell.id === propertyId)!;
      const propertyIndex = gameState.board.findIndex(cell => cell.id === propertyId);
      
      const currentLevel = property.level || 1;
      const upgradeCost = (property.price || 1000) * 0.5 * currentLevel;
      const newLevel = currentLevel + 1;
      
      const stateChanges: StateChange[] = [
        {
          path: `players.${gameState.currentPlayerIndex}.money`,
          oldValue: currentPlayer.money,
          newValue: currentPlayer.money - upgradeCost,
          reason: `升级财产${property.name}`,
          reversible: true
        },
        {
          path: `board.${propertyIndex}.level`,
          oldValue: currentLevel,
          newValue: newLevel,
          reason: `财产${property.name}升级到${newLevel}级`,
          reversible: true
        }
      ];
      
      return {
        success: true,
        message: `成功将${property.name}升级到${newLevel}级`,
        effects: [],
        validationsPassed: ['property_upgrade'],
        validationsFailed: [],
        stateChanges,
        triggeredEvents: ['property_upgraded']
      };
    }
  }
];

/**
 * 生肖技能规则
 */
export const ZODIAC_SKILL_RULES: RuleDefinition[] = [
  {
    id: 'zodiac_skill_cooldown',
    name: '生肖技能冷却规则',
    description: '生肖技能有冷却时间限制',
    category: 'skills',
    priority: 90,
    conditions: [],
    requirements: [],
    applicablePhases: ['roll_dice', 'process_cell', 'end_turn'],
    applicableActions: ['use_skill'],
    validator: (context) => {
      const { action, currentPlayer } = context;
      const skillId = action.data?.skillId;
      
      if (!skillId) {
        return { isValid: false, reason: '未指定技能ID' };
      }
      
      const skill = currentPlayer.skills.find(s => s.id === skillId);
      if (!skill) {
        return { isValid: false, reason: '玩家不拥有该技能' };
      }
      
      // 检查冷却时间
      if (skill.lastUsed) {
        const cooldownRemaining = skill.cooldown * 1000 - (Date.now() - skill.lastUsed);
        if (cooldownRemaining > 0) {
          return {
            isValid: false,
            reason: `技能还有${Math.ceil(cooldownRemaining / 1000)}秒冷却时间`
          };
        }
      }
      
      return { isValid: true };
    },
    executor: (context) => {
      const { action, currentPlayer, gameState } = context;
      const skillId = action.data?.skillId;
      const skill = currentPlayer.skills.find(s => s.id === skillId)!;
      const skillIndex = currentPlayer.skills.findIndex(s => s.id === skillId);
      
      const stateChanges: StateChange[] = [{
        path: `players.${gameState.currentPlayerIndex}.skills.${skillIndex}.lastUsed`,
        oldValue: skill.lastUsed,
        newValue: Date.now(),
        reason: `使用技能${skill.name}`,
        reversible: false
      }];
      
      return {
        success: true,
        message: `成功使用技能${skill.name}`,
        effects: skill.effects.map(effect => ({
          type: effect.type,
          target: effect.target,
          value: effect.value,
          description: `${skill.name}的效果`
        })),
        validationsPassed: ['zodiac_skill_cooldown'],
        validationsFailed: [],
        stateChanges,
        triggeredEvents: ['skill_used']
      };
    }
  },
  
  {
    id: 'seasonal_skill_bonus',
    name: '季节技能加成规则',
    description: '某些技能在特定季节有加成效果',
    category: 'skills',
    priority: 75,
    conditions: [],
    requirements: [],
    applicablePhases: ['roll_dice', 'process_cell', 'end_turn'],
    applicableActions: ['use_skill'],
    seasonalModifiers: true,
    validator: (context) => {
      return { isValid: true }; // 季节加成总是可以应用
    },
    executor: (context) => {
      const { action, currentPlayer, gameState } = context;
      const skillId = action.data?.skillId;
      const skill = currentPlayer.skills.find(s => s.id === skillId)!;
      const currentSeason = gameState.season;
      
      // 定义季节和生肖的对应关系
      const seasonalBonus = getSeasonalBonus(currentPlayer.zodiac, currentSeason);
      
      const stateChanges: StateChange[] = [];
      const triggeredEvents: string[] = [];
      
      if (seasonalBonus > 1) {
        stateChanges.push({
          path: `players.${gameState.currentPlayerIndex}.statusEffects`,
          oldValue: currentPlayer.statusEffects,
          newValue: [...currentPlayer.statusEffects, {
            id: 'seasonal_bonus',
            name: '季节加成',
            type: 'skill_cooldown',
            description: `${currentSeason}季技能加成`,
            duration: 1,
            remainingTurns: 1,
            value: seasonalBonus,
            stackable: false,
            source: 'seasonal_skill_bonus'
          }],
          reason: `${currentSeason}季技能加成`,
          reversible: true
        });
        
        triggeredEvents.push('seasonal_bonus_applied');
      }
      
      return {
        success: true,
        message: seasonalBonus > 1 ? 
          `获得${currentSeason}季技能加成(${seasonalBonus}x)` : 
          '技能使用成功',
        effects: [],
        validationsPassed: ['seasonal_skill_bonus'],
        validationsFailed: [],
        stateChanges,
        triggeredEvents
      };
    }
  }
];

/**
 * 胜利条件规则
 */
export const VICTORY_RULES: RuleDefinition[] = [
  {
    id: 'bankruptcy_victory',
    name: '破产胜利规则',
    description: '当只剩一个玩家未破产时游戏结束',
    category: 'winning',
    priority: 100,
    conditions: [],
    requirements: [],
    applicablePhases: ['check_win'],
    applicableActions: [],
    validator: (context) => {
      return { isValid: true };
    },
    executor: (context) => {
      const { gameState } = context;
      const solventPlayers = gameState.players.filter(p => p.money >= 0);
      
      if (solventPlayers.length <= 1) {
        return {
          success: true,
          message: solventPlayers.length === 1 ? 
            `${solventPlayers[0].name}获得胜利！` : 
            '游戏平局！',
          effects: [],
          validationsPassed: ['bankruptcy_victory'],
          validationsFailed: [],
          stateChanges: [{
            path: 'status',
            oldValue: gameState.status,
            newValue: 'ended',
            reason: '游戏结束',
            reversible: false
          }],
          triggeredEvents: ['game_ended']
        };
      }
      
      return {
        success: true,
        message: '游戏继续进行',
        effects: [],
        validationsPassed: ['bankruptcy_victory'],
        validationsFailed: [],
        stateChanges: [],
        triggeredEvents: []
      };
    }
  },
  
  {
    id: 'monopoly_victory',
    name: '垄断胜利规则',
    description: '拥有超过80%财产的玩家获胜',
    category: 'winning',
    priority: 95,
    conditions: [],
    requirements: [],
    applicablePhases: ['check_win'],
    applicableActions: [],
    validator: (context) => {
      return { isValid: true };
    },
    executor: (context) => {
      const { gameState } = context;
      const totalProperties = gameState.board.filter(cell => cell.type === 'property').length;
      
      for (const player of gameState.players) {
        const ownedProperties = player.properties.length;
        const ownershipPercentage = ownedProperties / totalProperties;
        
        if (ownershipPercentage >= 0.8) {
          return {
            success: true,
            message: `${player.name}通过垄断获得胜利！（拥有${Math.round(ownershipPercentage * 100)}%财产）`,
            effects: [],
            validationsPassed: ['monopoly_victory'],
            validationsFailed: [],
            stateChanges: [{
              path: 'status',
              oldValue: gameState.status,
              newValue: 'ended',
              reason: '垄断胜利',
              reversible: false
            }],
            triggeredEvents: ['game_ended', 'monopoly_victory']
          };
        }
      }
      
      return {
        success: true,
        message: '无垄断胜利条件',
        effects: [],
        validationsPassed: ['monopoly_victory'],
        validationsFailed: [],
        stateChanges: [],
        triggeredEvents: []
      };
    }
  }
];

/**
 * 特殊事件规则
 */
export const SPECIAL_EVENT_RULES: RuleDefinition[] = [
  {
    id: 'jail_rules',
    name: '监狱规则',
    description: '监狱相关的规则处理',
    category: 'special',
    priority: 85,
    conditions: [],
    requirements: [],
    applicablePhases: ['process_cell'],
    applicableActions: ['pay_bail', 'roll_for_freedom'],
    validator: (context) => {
      const { currentPlayer, gameState } = context;
      const jailPosition = 10; // 假设监狱位置
      
      if (currentPlayer.position !== jailPosition) {
        return { isValid: false, reason: '玩家不在监狱中' };
      }
      
      return { isValid: true };
    },
    executor: (context) => {
      const { action, currentPlayer, gameState } = context;
      
      if (action.type === 'pay_bail') {
        const bailCost = 500;
        if (currentPlayer.money < bailCost) {
          return {
            success: false,
            message: '资金不足以支付保释金',
            effects: [],
            validationsPassed: [],
            validationsFailed: ['insufficient_funds'],
            stateChanges: [],
            triggeredEvents: []
          };
        }
        
        return {
          success: true,
          message: `支付${bailCost}元保释金，获得自由`,
          effects: [],
          validationsPassed: ['jail_rules'],
          validationsFailed: [],
          stateChanges: [{
            path: `players.${gameState.currentPlayerIndex}.money`,
            oldValue: currentPlayer.money,
            newValue: currentPlayer.money - bailCost,
            reason: '支付保释金',
            reversible: false
          }],
          triggeredEvents: ['bail_paid', 'freed_from_jail'],
          nextPhase: 'roll_dice'
        };
      }
      
      // roll_for_freedom 逻辑
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const isDouble = dice1 === dice2;
      
      if (isDouble) {
        return {
          success: true,
          message: `掷出双倍(${dice1}, ${dice2})，获得自由！`,
          effects: [],
          validationsPassed: ['jail_rules'],
          validationsFailed: [],
          stateChanges: [],
          triggeredEvents: ['freed_from_jail'],
          nextPhase: 'move_player'
        };
      } else {
        return {
          success: true,
          message: `掷出(${dice1}, ${dice2})，继续留在监狱`,
          effects: [],
          validationsPassed: ['jail_rules'],
          validationsFailed: [],
          stateChanges: [],
          triggeredEvents: ['remain_in_jail'],
          nextPhase: 'end_turn'
        };
      }
    }
  }
];

/**
 * 获取季节加成
 */
function getSeasonalBonus(zodiac: ZodiacSign, season: Season): number {
  const seasonalMap: Record<Season, ZodiacSign[]> = {
    '春': ['虎', '兔', '龙'],
    '夏': ['蛇', '马', '羊'],
    '秋': ['猴', '鸡', '狗'],
    '冬': ['猪', '鼠', '牛']
  };
  
  return seasonalMap[season].includes(zodiac) ? 1.5 : 1.0;
}

/**
 * 导出所有规则
 */
export const ALL_BASE_RULES: RuleDefinition[] = [
  ...DICE_RULES,
  ...MOVEMENT_RULES,
  ...PROPERTY_RULES,
  ...ZODIAC_SKILL_RULES,
  ...VICTORY_RULES,
  ...SPECIAL_EVENT_RULES
];
