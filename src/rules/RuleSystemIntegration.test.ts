/**
 * 规则系统完整性测试
 * 测试整个规则系统的集成和协同工作
 */

import { GameRuleSystem } from './GameRuleSystem';
import { GameStateValidator } from './GameStateValidator';
import { ActionRuleChecker } from './ActionRuleChecker';
import { RuleExecutionEngine } from './RuleExecutionEngine';
import { RuleEventIntegration } from './RuleEventIntegration';
import { ALL_BASE_RULES } from './BaseGameRules';
import type {
  GameState,
  Player,
  PlayerAction,
  BoardCell,
  ZodiacSign
} from '../types/game';

describe('规则系统完整性测试', () => {
  let ruleSystem: GameRuleSystem;
  let stateValidator: GameStateValidator;
  let actionChecker: ActionRuleChecker;
  let executionEngine: RuleExecutionEngine;
  let eventIntegration: RuleEventIntegration;
  let mockGameState: GameState;

  beforeEach(() => {
    ruleSystem = new GameRuleSystem();
    stateValidator = new GameStateValidator();
    actionChecker = new ActionRuleChecker();
    executionEngine = new RuleExecutionEngine();
    eventIntegration = new RuleEventIntegration(executionEngine);

    // 注册基础规则
    for (const rule of ALL_BASE_RULES) {
      ruleSystem.registerRule(rule);
    }

    // 创建模拟游戏状态
    mockGameState = createMockGameState();
  });

  afterEach(() => {
    // 清理资源
    ruleSystem.removeAllListeners();
    stateValidator.removeAllListeners();
    actionChecker.removeAllListeners();
    executionEngine.removeAllListeners();
    eventIntegration.removeAllListeners();
  });

  describe('基础功能测试', () => {
    test('规则系统正确初始化', () => {
      expect(ruleSystem).toBeDefined();
      const stats = ruleSystem.getRuleStatistics();
      expect(stats.totalRules).toBeGreaterThan(0);
    });

    test('状态验证器正确工作', async () => {
      const validation = await stateValidator.validateGameState(mockGameState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('行动检查器获取可用行动', async () => {
      const actions = await actionChecker.getAvailableActions(mockGameState, 'player1');
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    test('执行引擎处理简单行动', async () => {
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const result = await executionEngine.executeAction(diceAction, mockGameState);
      expect(result.success).toBe(true);
    });
  });

  describe('规则验证测试', () => {
    test('掷骰子规则验证', async () => {
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const validation = await ruleSystem.validateAction(diceAction, mockGameState);
      expect(validation.isValid).toBe(true);
    });

    test('无效玩家行动被拒绝', async () => {
      const invalidAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'invalid_player',
        data: {},
        timestamp: Date.now()
      };

      const validation = await ruleSystem.validateAction(invalidAction, mockGameState);
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('玩家不存在');
    });

    test('错误阶段的行动被拒绝', async () => {
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

  describe('行动执行测试', () => {
    test('完整的掷骰子流程', async () => {
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const result = await executionEngine.executeAction(diceAction, mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.validationResult.isValid).toBe(true);
      expect(result.stateChanges.length).toBeGreaterThan(0);
    });

    test('玩家移动流程', async () => {
      // 先掷骰子
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      await executionEngine.executeAction(diceAction, mockGameState);

      // 模拟骰子结果
      mockGameState.lastDiceResult = {
        dice1: 3,
        dice2: 4,
        total: 7,
        isDouble: false,
        timestamp: Date.now()
      };
      mockGameState.phase = 'move_player';

      // 执行移动
      const moveAction: PlayerAction = {
        type: 'move_player',
        playerId: 'player1',
        data: { distance: 7 },
        timestamp: Date.now()
      };

      const result = await executionEngine.executeAction(moveAction, mockGameState);
      expect(result.success).toBe(true);
    });

    test('财产购买流程', async () => {
      // 设置玩家位置到可购买财产
      const propertyPosition = 1;
      mockGameState.players[0].position = propertyPosition;
      mockGameState.phase = 'process_cell';

      const purchaseAction: PlayerAction = {
        type: 'buy_property',
        playerId: 'player1',
        data: { propertyId: 'property_1' },
        timestamp: Date.now()
      };

      const result = await executionEngine.executeAction(purchaseAction, mockGameState);
      expect(result.success).toBe(true);
    });
  });

  describe('状态验证测试', () => {
    test('有效游戏状态通过验证', async () => {
      const validation = await stateValidator.validateGameState(mockGameState);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('无效游戏状态被检测', async () => {
      const invalidState = {
        ...mockGameState,
        currentPlayerIndex: 99 // 超出范围
      };

      const validation = await stateValidator.validateGameState(invalidState);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('自动修复功能', async () => {
      const invalidState = {
        ...mockGameState,
        turn: 0 // 无效回合数
      };

      const validation = await stateValidator.validateGameState(invalidState, {
        enableAutoFix: true,
        deepValidation: true,
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

  describe('权限检查测试', () => {
    test('获取玩家可用行动', async () => {
      const permissions = await actionChecker.getAvailableActions(mockGameState, 'player1');
      
      const allowedActions = permissions.filter(p => p.allowed);
      expect(allowedActions.length).toBeGreaterThan(0);
      
      const rollDicePermission = permissions.find(p => p.actionType === 'roll_dice');
      expect(rollDicePermission?.allowed).toBe(true);
    });

    test('非当前玩家无法行动', async () => {
      const permissions = await actionChecker.getAvailableActions(mockGameState, 'player2');
      
      const rollDicePermission = permissions.find(p => p.actionType === 'roll_dice');
      expect(rollDicePermission?.allowed).toBe(false);
      expect(rollDicePermission?.reason).toContain('回合');
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
        type: 'roll_dice',
        playerId: 'player2',
        data: {},
        timestamp: Date.now()
      };

      const isInvalid = actionChecker.quickValidateAction(invalidAction, mockGameState);
      expect(isInvalid).toBe(false);
    });
  });

  describe('执行引擎集成测试', () => {
    test('批量行动执行', async () => {
      const actions: PlayerAction[] = [
        {
          type: 'roll_dice',
          playerId: 'player1',
          data: {},
          timestamp: Date.now()
        }
      ];

      const results = await executionEngine.executeBatchActions(actions, mockGameState);
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    test('行动模拟', async () => {
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const result = await executionEngine.simulateAction(diceAction, mockGameState);
      expect(result.success).toBe(true);
      
      // 确保模拟不影响实际历史
      const stats = executionEngine.getExecutionStatistics();
      expect(stats.totalExecutions).toBe(0); // 模拟不计入历史
    });

    test('推荐行动获取', async () => {
      const recommendations = await executionEngine.getRecommendedActions(
        mockGameState, 
        'player1', 
        3
      );
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(3);
      
      if (recommendations.length > 0) {
        expect(recommendations[0].allowed).toBe(true);
      }
    });
  });

  describe('事件集成测试', () => {
    test('事件集成系统初始化', async () => {
      await eventIntegration.initialize();
      
      const stats = eventIntegration.getIntegrationStatistics();
      expect(stats.totalBindings).toBeGreaterThan(0);
    });

    test('规则触发事件', async () => {
      await eventIntegration.initialize();
      
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const result = await eventIntegration.executeRuleWithEvents(diceAction, mockGameState);
      expect(result.success).toBe(true);
    });
  });

  describe('性能测试', () => {
    test('大量规则执行性能', async () => {
      const startTime = Date.now();
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const diceAction: PlayerAction = {
          type: 'roll_dice',
          playerId: 'player1',
          data: {},
          timestamp: Date.now()
        };

        await executionEngine.executeAction(diceAction, mockGameState);
      }
      
      const duration = Date.now() - startTime;
      const avgTime = duration / iterations;
      
      expect(avgTime).toBeLessThan(100); // 平均每次执行少于100ms
    });

    test('状态验证性能', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        await stateValidator.validateGameState(mockGameState);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // 5次验证少于1秒
    });
  });

  describe('错误处理测试', () => {
    test('处理无效规则', () => {
      expect(() => {
        ruleSystem.registerRule({
          id: '',
          name: '无效规则',
          description: '',
          category: 'movement',
          priority: 0,
          conditions: [],
          requirements: [],
          applicablePhases: [],
          applicableActions: [],
          validator: () => ({ isValid: true }),
          executor: () => ({
            success: true,
            message: '',
            effects: [],
            validationsPassed: [],
            validationsFailed: [],
            stateChanges: [],
            triggeredEvents: []
          })
        });
      }).toThrow();
    });

    test('处理执行异常', async () => {
      // 注册一个会抛异常的规则
      ruleSystem.registerRule({
        id: 'error-rule',
        name: '错误规则',
        description: '用于测试错误处理',
        category: 'special',
        priority: 99,
        conditions: [],
        requirements: [],
        applicablePhases: ['roll_dice'],
        applicableActions: ['roll_dice'],
        validator: () => ({ isValid: true }),
        executor: () => {
          throw new Error('模拟执行错误');
        }
      });

      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      const result = await executionEngine.executeAction(diceAction, mockGameState);
      expect(result.success).toBe(false);
      expect(result.message).toContain('异常');
    });
  });

  describe('统计和监控测试', () => {
    test('规则系统统计', () => {
      const stats = ruleSystem.getRuleStatistics();
      
      expect(stats.totalRules).toBeGreaterThan(0);
      expect(stats.rulesByCategory).toBeDefined();
      expect(stats.performanceMetrics).toBeDefined();
    });

    test('执行引擎统计', async () => {
      // 执行一些行动以生成统计数据
      const diceAction: PlayerAction = {
        type: 'roll_dice',
        playerId: 'player1',
        data: {},
        timestamp: Date.now()
      };

      await executionEngine.executeAction(diceAction, mockGameState);
      
      const stats = executionEngine.getExecutionStatistics();
      expect(stats.totalExecutions).toBe(1);
      expect(stats.successfulExecutions).toBe(1);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
    });

    test('验证器统计', async () => {
      await stateValidator.validateGameState(mockGameState);
      
      const stats = stateValidator.getValidationStatistics();
      expect(stats.totalValidations).toBe(1);
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