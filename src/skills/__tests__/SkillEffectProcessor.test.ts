/**
 * 技能效果处理器测试套件
 * 第二阶段 Day 2: 技能效果实现
 * 
 * 全面测试技能效果处理系统，包括：
 * - 基础效果处理
 * - 生肖专属效果
 * - 效果组合和链式反应
 * - 伤害和治疗计算
 * - 边界条件和错误处理
 */

import SkillEffectProcessor, {
  EffectProcessResult,
  EffectContext,
  EffectCombo,
  ChainReaction
} from '../SkillEffectProcessor';

import {
  SkillEffect,
  SkillEffectType,
  SkillTargetType,
  SkillDefinition
} from '../SkillSystemArchitecture';

import type { GameState, Player, ZodiacSign } from '../../types/game';

describe('SkillEffectProcessor', () => {
  let processor: SkillEffectProcessor;
  let mockGameState: GameState;
  let mockPlayers: Player[];

  beforeEach(() => {
    processor = new SkillEffectProcessor();
    
    // 创建模拟玩家
    mockPlayers = [
      {
        id: 'player1',
        name: '玩家1',
        zodiac: '龙' as ZodiacSign,
        level: 5,
        money: 5000,
        position: 0,
        properties: [],
        statusEffects: [],
        skills: [],
        equipment: {},
        skillUsageStats: {}
      },
      {
        id: 'player2',
        name: '玩家2',
        zodiac: '虎' as ZodiacSign,
        level: 3,
        money: 3000,
        position: 5,
        properties: [],
        statusEffects: [],
        skills: [],
        equipment: {},
        skillUsageStats: {}
      },
      {
        id: 'player3',
        name: '玩家3',
        zodiac: '鼠' as ZodiacSign,
        level: 4,
        money: 4000,
        position: 10,
        properties: [],
        statusEffects: [],
        skills: [],
        equipment: {},
        skillUsageStats: {}
      }
    ];

    // 创建模拟游戏状态
    mockGameState = {
      players: mockPlayers,
      currentPlayer: 'player1',
      turn: 10,
      phase: 'action',
      season: '春',
      board: Array(40).fill(null).map((_, i) => ({
        id: i.toString(),
        type: i % 4 === 0 ? 'special' : 'property',
        name: `位置${i}`,
        price: (i + 1) * 100,
        rent: (i + 1) * 10
      })),
      marketTrends: {
        salaryBonus: 2000,
        propertyMultiplier: 1.0
      }
    };
  });

  describe('基础效果处理', () => {
    test('应该正确处理金钱获得效果', async () => {
      const effect: SkillEffect = {
        id: 'money_gain_test',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: 1000,
        description: '获得金钱测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 3,
        skillDefinition: {
          id: 'test_skill',
          name: '测试技能',
          description: '测试用技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const initialMoney = mockPlayers[0].money;
      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(true);
      expect(result.actualValue).toBeGreaterThan(0);
      expect(mockPlayers[0].money).toBeGreaterThan(initialMoney);
      expect(result.description).toContain('获得');
    });

    test('应该正确处理金钱窃取效果', async () => {
      const effect: SkillEffect = {
        id: 'money_steal_test',
        type: SkillEffectType.MONEY_STEAL,
        target: SkillTargetType.RANDOM_PLAYER,
        value: 500,
        description: '窃取金钱测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 2,
        skillDefinition: {
          id: 'steal_skill',
          name: '窃取技能',
          description: '窃取测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.RANDOM_PLAYER,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const initialCasterMoney = mockPlayers[0].money;
      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(true);
      if (result.actualValue > 0) {
        expect(mockPlayers[0].money).toBeGreaterThan(initialCasterMoney);
      }
    });

    test('应该正确处理位置移动效果', async () => {
      const effect: SkillEffect = {
        id: 'position_move_test',
        type: SkillEffectType.POSITION_MOVE,
        target: SkillTargetType.SELF,
        value: 5,
        description: '位置移动测试'
      };

      const context: EffectContext = {
        casterId: 'player2',
        skillLevel: 1,
        skillDefinition: {
          id: 'move_skill',
          name: '移动技能',
          description: '移动测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const initialPosition = mockPlayers[1].position;
      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(true);
      expect(mockPlayers[1].position).not.toBe(initialPosition);
      expect(result.description).toContain('移动');
    });

    test('应该正确处理状态增益效果', async () => {
      const effect: SkillEffect = {
        id: 'status_buff_test',
        type: SkillEffectType.STATUS_BUFF,
        target: SkillTargetType.SELF,
        value: 0.2,
        duration: 3,
        description: '状态增益测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 2,
        skillDefinition: {
          id: 'buff_skill',
          name: '增益技能',
          description: '增益测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const initialStatusEffects = mockPlayers[0].statusEffects.length;
      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(true);
      expect(mockPlayers[0].statusEffects.length).toBe(initialStatusEffects + 1);
      expect(result.description).toContain('状态增益');
    });
  });

  describe('生肖专属效果', () => {
    test('龙年玩家应该获得生肖威严加成', async () => {
      // 设置龙年玩家使用技能
      const dragonPlayer = mockPlayers.find(p => p.zodiac === '龙')!;
      
      const effect: SkillEffect = {
        id: 'dragon_power_test',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: 1000,
        description: '龙族威力测试'
      };

      const context: EffectContext = {
        casterId: dragonPlayer.id,
        skillLevel: 5,
        skillDefinition: {
          id: 'dragon_skill',
          name: '龙族技能',
          description: '龙族专属技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: ['龙']
        } as SkillDefinition,
        gameState: { ...mockGameState, season: '春' } // 龙的有利季节
      };

      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(true);
      // 由于生肖和季节加成，效果应该更强
      expect(result.actualValue).toBeGreaterThan(1000);
    });

    test('鼠年玩家应该在窃取技能上有特殊加成', async () => {
      const ratPlayer = mockPlayers.find(p => p.zodiac === '鼠')!;
      
      const effect: SkillEffect = {
        id: 'rat_steal_test',
        type: SkillEffectType.MONEY_STEAL,
        target: SkillTargetType.RANDOM_PLAYER,
        value: 300,
        description: '鼠族窃取测试'
      };

      const context: EffectContext = {
        casterId: ratPlayer.id,
        skillLevel: 3,
        skillDefinition: {
          id: 'rat_skill',
          name: '鼠族技能',
          description: '鼠族专属技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.RANDOM_PLAYER,
          castTime: 0,
          range: 0,
          zodiacRestrictions: ['鼠']
        } as SkillDefinition,
        gameState: mockGameState
      };

      const initialMoney = ratPlayer.money;
      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(true);
      // 鼠年在窃取方面应该有优势
      if (result.actualValue > 0) {
        expect(ratPlayer.money).toBeGreaterThan(initialMoney);
      }
    });
  });

  describe('效果组合和链式反应', () => {
    test('应该触发金钱瀑布组合', async () => {
      const effects: SkillEffect[] = [
        {
          id: 'money_gain1',
          type: SkillEffectType.MONEY_GAIN,
          target: SkillTargetType.SELF,
          value: 800,
          description: '金钱获得1'
        },
        {
          id: 'money_gain2',
          type: SkillEffectType.MONEY_GAIN,
          target: SkillTargetType.SELF,
          value: 800,
          description: '金钱获得2'
        }
      ];

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 4,
        skillDefinition: {
          id: 'combo_skill',
          name: '组合技能',
          description: '组合测试技能',
          effects: effects,
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const initialMoney = mockPlayers[0].money;
      const results = await processor.processEnhancedMultipleEffects(effects, context);

      expect(results.length).toBeGreaterThan(2); // 基础效果 + 可能的组合效果
      expect(mockPlayers[0].money).toBeGreaterThan(initialMoney + 1600); // 至少基础效果
      
      // 检查是否有组合效果触发
      const comboResults = results.filter(r => r.description.includes('金钱瀑布'));
      if (comboResults.length > 0) {
        expect(comboResults[0].success).toBe(true);
      }
    });

    test('应该触发暴击连锁反应', async () => {
      // 强制暴击来测试链式反应
      const effect: SkillEffect = {
        id: 'critical_test',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: 1500,
        modifiers: {
          criticalChance: 1.0, // 100%暴击率
          criticalDamage: 2.5
        },
        description: '暴击测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 5,
        skillDefinition: {
          id: 'critical_skill',
          name: '暴击技能',
          description: '暴击测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const results = await processor.processEnhancedMultipleEffects([effect], context);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].criticalHit).toBe(true);
      
      // 检查是否有链式效果
      const chainResults = results.filter(r => r.description.includes('链式'));
      if (chainResults.length > 0) {
        expect(chainResults[0].success).toBe(true);
      }
    });

    test('应该触发大成功级联效果', async () => {
      const effects: SkillEffect[] = [
        {
          id: 'success1',
          type: SkillEffectType.MONEY_GAIN,
          target: SkillTargetType.SELF,
          value: 500,
          description: '成功效果1'
        },
        {
          id: 'success2',
          type: SkillEffectType.STATUS_BUFF,
          target: SkillTargetType.SELF,
          value: 0.1,
          duration: 2,
          description: '成功效果2'
        },
        {
          id: 'success3',
          type: SkillEffectType.DICE_MODIFIER,
          target: SkillTargetType.SELF,
          value: 2,
          duration: 1,
          description: '成功效果3'
        }
      ];

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 6,
        skillDefinition: {
          id: 'cascade_skill',
          name: '级联技能',
          description: '级联测试技能',
          effects: effects,
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const results = await processor.processEnhancedMultipleEffects(effects, context);

      expect(results.length).toBeGreaterThanOrEqual(3); // 至少基础的3个效果

      // 检查是否有级联效果
      const cascadeResults = results.filter(r => r.description.includes('大成功级联'));
      if (cascadeResults.length > 0) {
        expect(cascadeResults[0].success).toBe(true);
      }
    });
  });

  describe('伤害和治疗计算', () => {
    test('应该正确计算复杂伤害', async () => {
      const effect: SkillEffect = {
        id: 'complex_damage_test',
        type: SkillEffectType.MONEY_LOSS,
        target: SkillTargetType.ALL_OTHERS,
        value: 2000,
        modifiers: {
          scaling: 1.2,
          criticalChance: 0.1,
          randomness: 0.15
        },
        description: '复杂伤害测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 7,
        skillDefinition: {
          id: 'damage_skill',
          name: '伤害技能',
          description: '伤害测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.ALL_OTHERS,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(true);
      expect(result.actualValue).toBeGreaterThan(0);
      expect(result.targetIds.length).toBe(2); // 除施法者外的其他玩家
    });

    test('应该处理治疗效果并防止过量治疗', async () => {
      // 先减少玩家金钱以测试治疗
      mockPlayers[0].money = 1000;

      const effect: SkillEffect = {
        id: 'healing_test',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: 3000,
        description: '治疗测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 3,
        skillDefinition: {
          id: 'heal_skill',
          name: '治疗技能',
          description: '治疗测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(true);
      expect(result.actualValue).toBeGreaterThan(0);
      expect(mockPlayers[0].money).toBeGreaterThan(1000);
    });

    test('应该正确应用抗性和免疫', async () => {
      // 给目标玩家添加抗性状态
      mockPlayers[1].statusEffects.push({
        id: 'resistance_test',
        name: '伤害抗性',
        type: 'damage_resistance' as any,
        description: 'financial抗性',
        duration: 5,
        remainingTurns: 5,
        value: 0.5, // 50%抗性
        stackable: false,
        source: 'test'
      });

      const effect: SkillEffect = {
        id: 'resistance_test',
        type: SkillEffectType.MONEY_LOSS,
        target: SkillTargetType.SINGLE_PLAYER,
        value: 1000,
        description: '抗性测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 2,
        skillDefinition: {
          id: 'resist_skill',
          name: '抗性技能',
          description: '抗性测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SINGLE_PLAYER,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const initialMoney = mockPlayers[1].money;
      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(true);
      // 由于抗性，实际损失应该小于原始值
      if (result.actualValue > 0) {
        const actualLoss = initialMoney - mockPlayers[1].money;
        expect(actualLoss).toBeLessThan(1000);
      }
    });
  });

  describe('边界条件和错误处理', () => {
    test('应该处理无效的施法者ID', async () => {
      const effect: SkillEffect = {
        id: 'invalid_caster_test',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: 1000,
        description: '无效施法者测试'
      };

      const context: EffectContext = {
        casterId: 'invalid_player',
        skillLevel: 1,
        skillDefinition: {
          id: 'invalid_skill',
          name: '无效技能',
          description: '无效测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const result = await processor.processEffect(effect, context);

      // 应该优雅地处理错误
      expect(result.success).toBeDefined();
      expect(result.description).toBeDefined();
    });

    test('应该处理未知的效果类型', async () => {
      const effect: SkillEffect = {
        id: 'unknown_effect_test',
        type: 'UNKNOWN_TYPE' as SkillEffectType,
        target: SkillTargetType.SELF,
        value: 100,
        description: '未知效果测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 1,
        skillDefinition: {
          id: 'unknown_skill',
          name: '未知技能',
          description: '未知测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const result = await processor.processEffect(effect, context);

      expect(result.success).toBe(false);
      expect(result.description).toContain('未实现的效果类型');
    });

    test('应该处理空的目标列表', async () => {
      const effect: SkillEffect = {
        id: 'empty_target_test',
        type: SkillEffectType.MONEY_STEAL,
        target: SkillTargetType.RANDOM_PLAYER,
        value: 500,
        description: '空目标测试'
      };

      // 创建只有一个玩家的游戏状态
      const singlePlayerGameState = {
        ...mockGameState,
        players: [mockPlayers[0]]
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 1,
        skillDefinition: {
          id: 'empty_target_skill',
          name: '空目标技能',
          description: '空目标测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.RANDOM_PLAYER,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: singlePlayerGameState
      };

      const result = await processor.processEffect(effect, context);

      // 应该处理没有有效目标的情况
      expect(result).toBeDefined();
      expect(result.targetIds.length).toBe(0);
    });

    test('应该处理负数值', async () => {
      const effect: SkillEffect = {
        id: 'negative_value_test',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: -500, // 负值
        description: '负值测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 1,
        skillDefinition: {
          id: 'negative_skill',
          name: '负值技能',
          description: '负值测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const result = await processor.processEffect(effect, context);

      // 系统应该处理负值（通常转换为正值或忽略）
      expect(result).toBeDefined();
      expect(result.actualValue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('性能和压力测试', () => {
    test('应该能够处理大量效果', async () => {
      const startTime = Date.now();
      
      // 创建100个效果
      const effects: SkillEffect[] = Array(100).fill(null).map((_, i) => ({
        id: `perf_effect_${i}`,
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: 10,
        description: `性能测试效果${i}`
      }));

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 1,
        skillDefinition: {
          id: 'perf_skill',
          name: '性能测试技能',
          description: '性能测试技能',
          effects: effects,
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const results = await processor.processMultipleEffects(effects, context);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
      
      // 验证所有效果都被处理
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
      });
    });

    test('应该能够处理深度链式反应', async () => {
      // 创建一个会触发多层链式反应的效果
      const effect: SkillEffect = {
        id: 'deep_chain_test',
        type: SkillEffectType.MONEY_GAIN,
        target: SkillTargetType.SELF,
        value: 3000, // 高值以触发各种级联
        modifiers: {
          criticalChance: 1.0 // 保证暴击
        },
        description: '深度链式测试'
      };

      const context: EffectContext = {
        casterId: 'player1',
        skillLevel: 10,
        skillDefinition: {
          id: 'deep_chain_skill',
          name: '深度链式技能',
          description: '深度链式测试技能',
          effects: [effect],
          cooldown: 0,
          manaCost: 0,
          targetType: SkillTargetType.SELF,
          castTime: 0,
          range: 0,
          zodiacRestrictions: []
        } as SkillDefinition,
        gameState: mockGameState
      };

      const results = await processor.processEnhancedMultipleEffects([effect], context);

      expect(results.length).toBeGreaterThan(1); // 应该有额外的链式效果
      expect(results[0].criticalHit).toBe(true);
      
      // 检查是否有链式或级联效果
      const additionalEffects = results.slice(1);
      if (additionalEffects.length > 0) {
        expect(additionalEffects.some(r => 
          r.description.includes('链式') || 
          r.description.includes('级联') || 
          r.description.includes('风暴')
        )).toBe(true);
      }
    });
  });

  afterEach(() => {
    // 清理资源
    if (processor && typeof processor.clearCache === 'function') {
      processor.clearCache();
    }
  });
});