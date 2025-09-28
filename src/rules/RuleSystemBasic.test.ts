/**
 * 规则系统基础测试
 * 测试规则系统核心功能，不依赖事件系统
 */

import { GameRuleSystem } from './GameRuleSystem';
import { GameStateValidator } from './GameStateValidator';
import { ActionRuleChecker } from './ActionRuleChecker';
import { RuleExecutionEngine } from './RuleExecutionEngine';
import { ALL_BASE_RULES } from './BaseGameRules';
import type {
  GameState,
  Player,
  PlayerAction,
  BoardCell,
  ZodiacSign
} from '../types/game';

describe('规则系统基础测试', () => {
  let ruleSystem: GameRuleSystem;
  let stateValidator: GameStateValidator;
  let actionChecker: ActionRuleChecker;
  let mockGameState: GameState;

  beforeEach(() => {
    ruleSystem = new GameRuleSystem();
    stateValidator = new GameStateValidator();
    actionChecker = new ActionRuleChecker();

    // 注册基础规则
    for (const rule of ALL_BASE_RULES) {
      ruleSystem.registerRule(rule);
    }

    // 创建模拟游戏状态
    mockGameState = createMockGameState();
  });

  describe('规则系统核心功能', () => {
    test('规则系统正确初始化', () => {
      expect(ruleSystem).toBeDefined();
      const stats = ruleSystem.getRuleStatistics();
      expect(stats.totalRules).toBeGreaterThan(0);
    });

    test('规则注册和管理', () => {
      const initialCount = ruleSystem.getRuleStatistics().totalRules;
      
      ruleSystem.registerRule({
        id: 'test-rule',
        name: '测试规则',
        description: '用于测试的规则',
        category: 'special',
        priority: 50,
        conditions: [],
        requirements: [],
        applicablePhases: ['roll_dice'],
        applicableActions: ['roll_dice'],
        validator: () => ({ isValid: true }),
        executor: () => ({
          success: true,
          message: '测试规则执行成功',
          effects: [],
          validationsPassed: ['test-rule'],
          validationsFailed: [],
          stateChanges: [],
          triggeredEvents: []
        })
      });

      const newCount = ruleSystem.getRuleStatistics().totalRules;
      expect(newCount).toBe(initialCount + 1);

      // 移除规则
      ruleSystem.unregisterRule('test-rule');
      const finalCount = ruleSystem.getRuleStatistics().totalRules;
      expect(finalCount).toBe(initialCount);
    });

    test('获取适用规则', () => {
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const applicableRules = ruleSystem.getApplicableRules(diceAction, mockGameState);
      expect(applicableRules.length).toBeGreaterThan(0);
      
      // 验证规则按优先级排序
      for (let i = 1; i < applicableRules.length; i++) {
        expect(applicableRules[i-1].priority).toBeGreaterThanOrEqual(applicableRules[i].priority);
      }
    });
  });

  describe('状态验证功能', () => {
    test('有效状态验证通过', async () => {
      const validation = await stateValidator.validateGameState(mockGameState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('检测基础结构错误', async () => {
      const invalidState = {
        ...mockGameState,
        gameId: undefined as any
      };

      const validation = await stateValidator.validateGameState(invalidState);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('检测玩家数据错误', async () => {
      const invalidState = {
        ...mockGameState,
        currentPlayerIndex: 99
      };

      const validation = await stateValidator.validateGameState(invalidState);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.id === 'invalid_current_player_index')).toBe(true);
    });

    test('自动修复功能', async () => {
      const fixableState = {
        ...mockGameState,
        turn: 0 // 无效的回合数
      };

      const validation = await stateValidator.validateGameState(fixableState, {
        enableAutoFix: true,
        deepValidation: false,
        performanceCheck: false,
        consistencyCheck: true,
        economyBalance: false,
        skillIntegrity: false,
        boardIntegrity: false
      });

      expect(validation.autoFixApplied).toBe(true);
      expect(validation.fixedErrors.length).toBeGreaterThan(0);
    });
  });

  describe('行动检查功能', () => {
    test('获取可用行动列表', async () => {
      const permissions = await actionChecker.getAvailableActions(mockGameState, 'player1');
      
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
      
      const rollDicePermission = permissions.find(p => p.actionType === 'roll_dice');
      expect(rollDicePermission).toBeDefined();
      expect(rollDicePermission?.allowed).toBe(true);
    });

    test('错误玩家被拒绝', async () => {
      const permissions = await actionChecker.getAvailableActions(mockGameState, 'invalid_player');
      expect(permissions).toHaveLength(0);
    });

    test('非当前玩家行动被限制', async () => {
      const permissions = await actionChecker.getAvailableActions(mockGameState, 'player2');
      
      const rollDicePermission = permissions.find(p => p.actionType === 'roll_dice');
      expect(rollDicePermission?.allowed).toBe(false);
    });

    test('快速行动验证', () => {
      const validAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const isValid = actionChecker.quickValidateAction(validAction, mockGameState);
      expect(isValid).toBe(true);

      const invalidAction: PlayerAction = {
        type: 'buy_property',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const isInvalid = actionChecker.quickValidateAction(invalidAction, mockGameState);
      expect(isInvalid).toBe(false); // 错误阶段
    });
  });

  describe('行动验证测试', () => {
    test('有效掷骰子行动', async () => {
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const validation = await ruleSystem.validateAction(diceAction, mockGameState);
      expect(validation.isValid).toBe(true);
    });

    test('无效玩家ID被拒绝', async () => {
      const invalidAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'nonexistent',
        data: {},
        timestamp: Date.now()
      };

      const validation = await ruleSystem.validateAction(invalidAction, mockGameState);
      expect(validation.isValid).toBe(false);
    });

    test('错误游戏阶段被拒绝', async () => {
      const wrongPhaseState = {
        ...mockGameState,
        phase: 'process_cell' as const
      };

      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const validation = await ruleSystem.validateAction(diceAction, wrongPhaseState);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('规则执行测试', () => {
    test('执行掷骰子规则', async () => {
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const result = await ruleSystem.executeAction(diceAction, mockGameState);
      expect(result.success).toBe(true);
      expect(result.stateChanges.length).toBeGreaterThan(0);
      expect(result.triggeredEvents).toContain('dice_rolled');
    });

    test('执行移动规则', async () => {
      // 先设置骰子结果
      mockGameState.lastDiceResult = {
        dice1: 3,
        dice2: 4,
        total: 7,
        isDouble: false,
        timestamp: Date.now()
      };
      mockGameState.phase = 'move_player';

      const moveAction: PlayerAction = {
        type: 'move_player',
        playerId: 'player1',
        data: { distance: 7 },
        timestamp: Date.now()
      };

      const result = await ruleSystem.executeAction(moveAction, mockGameState);
      expect(result.success).toBe(true);
      expect(result.stateChanges.some(c => c.path.includes('position'))).toBe(true);
    });

    test('执行财产购买规则', async () => {
      // 设置合适的状态
      mockGameState.players[0].position = 1;
      mockGameState.phase = 'process_cell';

      const purchaseAction: PlayerAction = {
        type: 'buy_property',
        playerId: 'player1',
        data: { propertyId: 'cell_1' },
        timestamp: Date.now()
      };

      const result = await ruleSystem.executeAction(purchaseAction, mockGameState);
      expect(result.success).toBe(true);
    });
  });

  describe('游戏状态一致性', () => {
    test('检查游戏状态一致性', () => {
      const validation = ruleSystem.validateGameState(mockGameState);
      expect(validation.isValid).toBe(true);
    });

    test('检测不一致状态', () => {
      const inconsistentState = {
        ...mockGameState,
        players: [] // 无玩家
      };

      const validation = ruleSystem.validateGameState(inconsistentState);
      expect(validation.isValid).toBe(false);
    });
  });

  describe('性能测试', () => {
    test('验证缓存机制', async () => {
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      // 第一次验证
      const start1 = Date.now();
      await ruleSystem.validateAction(diceAction, mockGameState);
      const time1 = Date.now() - start1;

      // 第二次验证（应该使用缓存）
      const start2 = Date.now();
      await ruleSystem.validateAction(diceAction, mockGameState);
      const time2 = Date.now() - start2;

      // 缓存的验证应该更快（虽然在测试环境中可能不明显）
      expect(time2).toBeLessThanOrEqual(time1 + 10); // 允许10ms误差
    });

    test('批量操作性能', async () => {
      const actions: PlayerAction[] = Array.from({ length: 5 }, (_, i) => ({
        type: 'roll_dice',
        playerId: 'player1',
        data: { index: i },
        timestamp: Date.now()
      }));

      const start = Date.now();
      
      for (const action of actions) {
        await ruleSystem.validateAction(action, mockGameState);
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // 5次验证少于500ms
    });
  });

  describe('错误处理', () => {
    test('处理规则执行错误', async () => {
      // 注册一个会失败的规则
      ruleSystem.registerRule({
        id: 'failing-rule',
        name: '失败规则',
        description: '总是失败的规则',
        category: 'special',
        priority: 99,
        conditions: [],
        requirements: [],
        applicablePhases: ['roll_dice'],
        applicableActions: ['roll_dice'],
        validator: () => ({ isValid: false, reason: '故意失败' }),
        executor: () => {
          throw new Error('执行失败');
        }
      });

      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const validation = await ruleSystem.validateAction(diceAction, mockGameState);
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toBe('故意失败');
    });
  });

  // 辅助函数
  function createMockGameState(): GameState {
    const players: Player[] = [
      {
        id: 'player1',
        name: '玩家1',
        zodiac: '龙' as ZodiacSign,
        isHuman: true,
        position: 0,
        money: 10000,
        properties: [],
        items: [],
        skills: [],
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
      },
      {
        id: 'player2',
        name: '玩家2',
        zodiac: '虎' as ZodiacSign,
        isHuman: false,
        position: 0,
        money: 10000,
        properties: [],
        items: [],
        skills: [],
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
      }
    ];

    const board: BoardCell[] = Array.from({ length: 40 }, (_, i) => ({
      id: `cell_${i}`,
      position: i,
      type: i === 0 ? 'start' : i % 10 === 0 ? 'special' : 'property',
      name: i === 0 ? '起点' : `财产${i}`,
      color: '#cccccc',
      description: `位置${i}的描述`,
      price: i > 0 && i % 10 !== 0 ? 1000 + i * 100 : undefined,
      rent: i > 0 && i % 10 !== 0 ? 100 + i * 10 : undefined
    }));

    return {
      gameId: 'test-game',
      status: 'playing',
      mode: 'classic',
      players,
      currentPlayerIndex: 0,
      round: 1,
      phase: 'roll_dice',
      turn: 1,
      board,
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
  }
});