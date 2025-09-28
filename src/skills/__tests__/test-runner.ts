/**
 * 技能系统测试运行器
 * 第二阶段 Day 2: 技能效果实现
 * 
 * 用于手动运行技能效果测试和验证系统功能
 */

import SkillEffectProcessor from '../SkillEffectProcessor';
import SkillDamageCalculator from '../SkillDamageCalculation';
import { ZodiacSkillEffects } from '../ZodiacSkillEffects';

// 简单的测试框架实现
class SimpleTestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => Promise<void> | void) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🚀 开始运行技能系统测试...\n');
    
    for (const { name, fn } of this.tests) {
      try {
        console.log(`⏳ 运行测试: ${name}`);
        await fn();
        console.log(`✅ 通过: ${name}`);
        this.passed++;
      } catch (error) {
        console.error(`❌ 失败: ${name}`);
        console.error(`   错误: ${error}`);
        this.failed++;
      }
      console.log('');
    }

    console.log('📊 测试结果:');
    console.log(`   通过: ${this.passed}`);
    console.log(`   失败: ${this.failed}`);
    console.log(`   总计: ${this.tests.length}`);
    
    if (this.failed === 0) {
      console.log('🎉 所有测试都通过了！');
    } else {
      console.log('⚠️  有测试失败，请检查实现');
    }
  }
}

// 创建测试实例
const runner = new SimpleTestRunner();

// 基础功能测试
runner.test('SkillEffectProcessor 初始化', () => {
  const processor = new SkillEffectProcessor();
  if (!processor) {
    throw new Error('SkillEffectProcessor 初始化失败');
  }
  console.log('   ✓ SkillEffectProcessor 成功初始化');
});

runner.test('SkillDamageCalculator 初始化', () => {
  const calculator = new SkillDamageCalculator();
  if (!calculator) {
    throw new Error('SkillDamageCalculator 初始化失败');
  }
  console.log('   ✓ SkillDamageCalculator 成功初始化');
});

runner.test('ZodiacSkillEffects 初始化', () => {
  const zodiacEffects = new ZodiacSkillEffects();
  if (!zodiacEffects) {
    throw new Error('ZodiacSkillEffects 初始化失败');
  }
  console.log('   ✓ ZodiacSkillEffects 成功初始化');
});

// 集成测试
runner.test('技能效果处理器集成测试', async () => {
  const processor = new SkillEffectProcessor();
  
  // 创建测试数据
  const mockGameState = {
    players: [
      {
        id: 'test_player',
        name: '测试玩家',
        zodiac: '龙' as any,
        level: 5,
        money: 5000,
        position: 0,
        properties: [],
        statusEffects: [],
        skills: [],
        equipment: {},
        skillUsageStats: {}
      }
    ],
    currentPlayer: 'test_player',
    turn: 1,
    phase: 'action',
    season: '春',
    board: Array(40).fill(null).map((_, i) => ({
      id: i.toString(),
      type: 'property',
      name: `位置${i}`,
      price: 1000,
      rent: 100
    })),
    marketTrends: {
      salaryBonus: 2000,
      propertyMultiplier: 1.0
    }
  };

  const testEffect = {
    id: 'test_effect',
    type: 'MONEY_GAIN' as any,
    target: 'SELF' as any,
    value: 1000,
    description: '测试效果'
  };

  const context = {
    casterId: 'test_player',
    skillLevel: 3,
    skillDefinition: {
      id: 'test_skill',
      name: '测试技能',
      description: '用于测试的技能',
      effects: [testEffect],
      cooldown: 0,
      manaCost: 0,
      targetType: 'SELF' as any,
      castTime: 0,
      range: 0,
      zodiacRestrictions: []
    },
    gameState: mockGameState
  };

  const result = await processor.processEffect(testEffect, context);
  
  if (!result) {
    throw new Error('效果处理返回空结果');
  }
  
  if (typeof result.success !== 'boolean') {
    throw new Error('结果格式不正确');
  }
  
  console.log(`   ✓ 效果处理成功，结果: ${result.description}`);
  console.log(`   ✓ 处理值: ${result.actualValue}`);
});

runner.test('伤害计算器集成测试', () => {
  const calculator = new SkillDamageCalculator();
  
  const mockContext = {
    caster: {
      id: 'test_caster',
      name: '测试施法者',
      zodiac: '龙' as any,
      level: 8,
      money: 8000,
      position: 0,
      properties: [],
      statusEffects: [],
      skills: [],
      equipment: {},
      skillUsageStats: {}
    },
    targets: [{
      id: 'test_target',
      name: '测试目标',
      zodiac: '虎' as any,
      level: 5,
      money: 5000,
      position: 10,
      properties: [],
      statusEffects: [],
      skills: [],
      equipment: {},
      skillUsageStats: {}
    }],
    skill: {
      id: 'test_damage_skill',
      name: '测试伤害技能',
      description: '测试伤害计算',
      effects: [],
      cooldown: 0,
      manaCost: 0,
      targetType: 'SINGLE_PLAYER' as any,
      castTime: 0,
      range: 0,
      zodiacRestrictions: []
    },
    effect: {
      id: 'test_damage_effect',
      type: 'MONEY_LOSS' as any,
      target: 'SINGLE_PLAYER' as any,
      value: 1500,
      description: '测试伤害效果'
    },
    gameState: {
      players: [],
      currentPlayer: 'test_caster',
      turn: 5,
      phase: 'action',
      season: '春',
      board: [],
      marketTrends: { salaryBonus: 2000, propertyMultiplier: 1.0 }
    },
    skillLevel: 6,
    isCombo: false,
    isChain: false,
    chainLength: 0,
    season: '春',
    timeOfDay: 'noon' as any,
    customModifiers: [],
    ignoreResistance: false,
    guaranteedCritical: false,
    recentDamage: [],
    consecutiveCrits: 0
  };

  const result = calculator.calculateDetailedDamage(mockContext);
  
  if (!result) {
    throw new Error('伤害计算返回空结果');
  }
  
  if (typeof result.finalDamage !== 'number' || result.finalDamage < 0) {
    throw new Error('伤害计算结果无效');
  }
  
  console.log(`   ✓ 伤害计算成功`);
  console.log(`   ✓ 基础伤害: ${result.baseDamage}`);
  console.log(`   ✓ 最终伤害: ${result.finalDamage}`);
  console.log(`   ✓ 伤害类型: ${result.damageType}`);
  console.log(`   ✓ 元素类型: ${result.elementType}`);
  console.log(`   ✓ 暴击: ${result.isCritical ? '是' : '否'}`);
});

runner.test('效果组合系统测试', async () => {
  const processor = new SkillEffectProcessor();
  
  // 测试多个金钱效果是否能触发组合
  const effects = [
    {
      id: 'money_effect_1',
      type: 'MONEY_GAIN' as any,
      target: 'SELF' as any,
      value: 800,
      description: '金钱效果1'
    },
    {
      id: 'money_effect_2',
      type: 'MONEY_GAIN' as any,
      target: 'SELF' as any,
      value: 800,
      description: '金钱效果2'
    }
  ];

  const mockGameState = {
    players: [{
      id: 'combo_player',
      name: '组合玩家',
      zodiac: '龙' as any,
      level: 7,
      money: 7000,
      position: 0,
      properties: [],
      statusEffects: [],
      skills: [],
      equipment: {},
      skillUsageStats: {}
    }],
    currentPlayer: 'combo_player',
    turn: 10,
    phase: 'action',
    season: '春',
    board: Array(40).fill(null).map((_, i) => ({
      id: i.toString(),
      type: 'property',
      name: `位置${i}`,
      price: 1000,
      rent: 100
    })),
    marketTrends: { salaryBonus: 2000, propertyMultiplier: 1.0 }
  };

  const context = {
    casterId: 'combo_player',
    skillLevel: 5,
    skillDefinition: {
      id: 'combo_skill',
      name: '组合技能',
      description: '测试组合效果',
      effects: effects,
      cooldown: 0,
      manaCost: 0,
      targetType: 'SELF' as any,
      castTime: 0,
      range: 0,
      zodiacRestrictions: []
    },
    gameState: mockGameState
  };

  const results = await processor.processEnhancedMultipleEffects(effects, context);
  
  if (!results || results.length === 0) {
    throw new Error('组合效果处理失败');
  }
  
  console.log(`   ✓ 处理了 ${results.length} 个效果`);
  console.log(`   ✓ 基础效果: ${effects.length}`);
  
  if (results.length > effects.length) {
    console.log(`   ✓ 检测到额外效果，可能包含组合或链式反应`);
  }
  
  results.forEach((result, index) => {
    console.log(`   ✓ 效果 ${index + 1}: ${result.description} (值: ${result.actualValue})`);
  });
});

runner.test('生肖效果增强测试', async () => {
  const zodiacProcessor = new ZodiacSkillEffects();
  
  const dragonContext = {
    casterId: 'dragon_player',
    skillLevel: 4,
    skillDefinition: {
      id: 'dragon_skill',
      name: '龙族技能',
      description: '龙族专属技能',
      effects: [],
      cooldown: 0,
      manaCost: 0,
      targetType: 'SELF' as any,
      castTime: 0,
      range: 0,
      zodiacRestrictions: ['龙']
    },
    gameState: {
      players: [{
        id: 'dragon_player',
        name: '龙年玩家',
        zodiac: '龙' as any,
        level: 10,
        money: 10000,
        position: 0,
        properties: [],
        statusEffects: [],
        skills: [],
        equipment: {},
        skillUsageStats: {}
      }],
      currentPlayer: 'dragon_player',
      turn: 8,
      phase: 'action',
      season: '春', // 测试季节效果
      board: [],
      marketTrends: { salaryBonus: 2000, propertyMultiplier: 1.0 }
    }
  };

  const testEffect = {
    id: 'dragon_test_effect',
    type: 'MONEY_GAIN' as any,
    target: 'SELF' as any,
    value: 2000,
    description: '龙族测试效果'
  };

  const result = await zodiacProcessor.processEffect(testEffect, dragonContext);
  
  if (!result) {
    throw new Error('生肖效果增强失败');
  }
  
  console.log(`   ✓ 生肖效果处理成功`);
  console.log(`   ✓ 效果描述: ${result.description}`);
  console.log(`   ✓ 处理值: ${result.actualValue}`);
  
  // 检查生肖增强
  if (result.actualValue > 2000) {
    console.log(`   ✓ 检测到生肖增强效果 (原始: 2000, 增强后: ${result.actualValue})`);
  }
});

// 运行所有测试
if (require.main === module) {
  runner.run().catch(console.error);
}

export default runner;