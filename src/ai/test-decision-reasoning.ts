/**
 * LLM增强决策推理系统测试
 */
import { DecisionEngine } from './DecisionEngine';
import { PersonalityFactory } from './PersonalityFactory';
import { createLLMService } from './LLMServiceFactory';
import type { ZodiacSign } from '../types/game';
import type { AIState, SituationAnalysis } from '../types/ai';

async function testEnhancedDecisionReasoning() {
  console.log('🧪 测试LLM增强决策推理系统\n');

  // 创建带LLM服务的决策引擎
  const llmService = createLLMService();
  const decisionEngine = new DecisionEngine({
    maxAnalysisDepth: 3,
    confidenceThreshold: 0.6,
    llmService,
    maxTokens: 1000,
    temperature: 0.7,
    enableCache: true
  });

  // 创建个性工厂
  const personalityFactory = new PersonalityFactory({
    llmService
  });

  try {
    // 初始化系统
    console.log('🔧 初始化决策系统...');
    await decisionEngine.initialize();

    // 创建测试AI角色
    const zodiac: ZodiacSign = '蛇';
    const personality = await personalityFactory.createPersonality(zodiac, 'hard');
    
    const aiState: AIState = {
      id: 'snake_ai',
      personality,
      emotionalState: { mood: 'calculating' as any },
      memory: { 
        playerRelationships: {},
        recentEvents: [],
        learningData: {}
      },
      currentStrategy: { focus: 'wealth_accumulation' as any },
      statistics: {
        totalDecisions: 15,
        averageDecisionTime: 2500,
        confidenceLevel: 0.8,
        successRate: 0.75,
        cacheHitRate: 0.6
      }
    };

    // 构建游戏状态
    const gameState = {
      turn: 35,
      phase: 'mid_game',
      players: [
        { id: 'snake_ai', name: '玄鳞', money: 45000, properties: [], zodiac: '蛇' },
        { id: 'dragon_ai', name: '敖辰', money: 52000, properties: [], zodiac: '龙' },
        { id: 'tiger_ai', name: '啸天', money: 38000, properties: [], zodiac: '虎' },
        { id: 'human', name: '玩家', money: 41000, properties: [], zodiac: '兔' }
      ],
      properties: [
        { id: 'prop1', name: '中央商务区', price: 30000, owner: null, type: 'commercial' },
        { id: 'prop2', name: '高档住宅区', price: 25000, owner: 'dragon_ai', type: 'residential' }
      ]
    } as any;

    // 构建情况分析
    const situationAnalysis: SituationAnalysis = {
      gamePhase: {
        phase: 'mid_game',
        remainingTurns: 25,
        progression: 0.6
      },
      playerPosition: [
        { playerId: 'dragon_ai', rankPosition: 1, threat: 0.8, alliance: 0.2, predictedMoves: [] },
        { playerId: 'snake_ai', rankPosition: 2, threat: 0, alliance: 0, predictedMoves: [] },
        { playerId: 'human', rankPosition: 3, threat: 0.4, alliance: 0.6, predictedMoves: [] },
        { playerId: 'tiger_ai', rankPosition: 4, threat: 0.6, alliance: 0.3, predictedMoves: [] }
      ],
      economicSituation: {
        cashFlow: 45000,
        netWorth: 45000,
        liquidityRatio: 1.0,
        propertyValue: 0,
        moneyRank: 2,
        propertyRank: 4
      },
      threats: [
        { source: 'dragon_ai', severity: 0.8, description: '龙王资金领先，可能垄断高价地产' },
        { source: 'tiger_ai', severity: 0.6, description: '虎将可能发起激进交易攻击' }
      ],
      opportunities: [
        { target: 'prop1', potential: 0.9, description: '中央商务区是关键战略位置' },
        { target: 'human', potential: 0.7, description: '与人类玩家结盟的机会' }
      ]
    };

    console.log('🎯 测试基础决策...');
    console.log('当前情况:');
    console.log(`- AI: ${aiState.id} (${zodiac}) - 资金: ${gameState.players[0].money}`);
    console.log(`- 游戏阶段: ${situationAnalysis.gamePhase.phase} - 回合: ${gameState.turn}`);
    console.log(`- 主要威胁: ${situationAnalysis.threats.map(t => t.source).join(', ')}`);
    console.log(`- 主要机会: ${situationAnalysis.opportunities.map(o => o.target).join(', ')}`);
    console.log('');

    // 测试1：基础决策制定
    const basicDecision = await decisionEngine.makeDecision(
      aiState,
      gameState,
      situationAnalysis
    );

    console.log('基础决策结果:');
    console.log(`- 选择动作: ${basicDecision.action.type}`);
    console.log(`- 决策置信度: ${(basicDecision.confidence * 100).toFixed(1)}%`);
    console.log(`- 基础推理: ${basicDecision.reasoning.substring(0, 150)}...`);
    console.log('');

    // 测试2：增强决策制定（带LLM详细推理）
    console.log('🔍 测试增强决策推理...');
    const enhancedDecision = await decisionEngine.makeEnhancedDecision(
      aiState,
      gameState,
      situationAnalysis
    );

    console.log('增强决策结果:');
    console.log(`- 选择动作: ${enhancedDecision.action.type}`);
    console.log(`- 决策置信度: ${(enhancedDecision.confidence * 100).toFixed(1)}%`);
    
    if (enhancedDecision.detailedReasoning) {
      console.log('- 详细推理分析:');
      console.log(`  * 形势分析: ${enhancedDecision.detailedReasoning.situationAnalysis}`);
      console.log(`  * 考虑因素: ${enhancedDecision.detailedReasoning.considerationFactors}`);
      console.log(`  * 预期效果: ${enhancedDecision.detailedReasoning.expectedEffects}`);
      console.log(`  * 风险评估: ${enhancedDecision.detailedReasoning.riskAssessment}`);
    }
    console.log('');

    // 测试3：策略分析
    console.log('📊 策略分析:');
    console.log(`- 短期目标: ${enhancedDecision.strategicAnalysis.shortTermGoals.join(', ')}`);
    console.log(`- 长期策略: ${enhancedDecision.strategicAnalysis.longTermStrategy}`);
    console.log(`- 策略对齐度: ${(enhancedDecision.strategicAnalysis.strategicAlignment * 100).toFixed(1)}%`);
    console.log(`- 需要调整: ${enhancedDecision.strategicAnalysis.adaptationNeeded ? '是' : '否'}`);
    console.log('');

    // 测试4：风险评估
    console.log('⚠️ 风险评估:');
    console.log(`- 整体风险: ${(enhancedDecision.riskAssessment.overallRisk * 100).toFixed(1)}%`);
    console.log(`- 具体风险: ${enhancedDecision.riskAssessment.specificRisks.join(', ')}`);
    console.log(`- 缓解策略: ${enhancedDecision.riskAssessment.mitigationStrategies.join(', ')}`);
    console.log(`- 风险容忍度: ${(enhancedDecision.riskAssessment.riskTolerance * 100).toFixed(1)}%`);
    console.log('');

    // 测试5：结果预测
    console.log('🔮 结果预测:');
    console.log(`- 预期收益: ${(enhancedDecision.expectedOutcome.expectedBenefit * 100).toFixed(1)}%`);
    console.log(`- 成功概率: ${(enhancedDecision.expectedOutcome.probabilityOfSuccess * 100).toFixed(1)}%`);
    console.log(`- 潜在后果: ${enhancedDecision.expectedOutcome.potentialConsequences.join(', ')}`);
    console.log(`- 预计时间: ${enhancedDecision.expectedOutcome.timeframe}`);
    console.log('');

    // 测试6：比较传统决策与LLM增强决策
    console.log('⚖️ 决策对比分析:');
    
    // 创建传统决策引擎（无LLM）
    const traditionalEngine = new DecisionEngine({ maxAnalysisDepth: 3 });
    await traditionalEngine.initialize();
    
    const traditionalDecision = await traditionalEngine.makeDecision(
      aiState,
      gameState,
      situationAnalysis
    );

    console.log('传统决策 vs LLM增强决策:');
    console.log(`动作选择: ${traditionalDecision.action.type} vs ${enhancedDecision.action.type}`);
    console.log(`置信度差异: ${Math.abs(traditionalDecision.confidence - enhancedDecision.confidence).toFixed(3)}`);
    console.log(`推理长度: ${traditionalDecision.reasoning.length} vs ${enhancedDecision.reasoning.length} 字符`);
    
    if (enhancedDecision.detailedReasoning) {
      console.log('LLM增强特性:');
      console.log(`- 提供了详细的${Object.keys(enhancedDecision.detailedReasoning).length}项分析要素`);
      console.log(`- 策略对齐度分析: ${enhancedDecision.strategicAnalysis.strategicAlignment.toFixed(2)}`);
      console.log(`- 风险识别: ${enhancedDecision.riskAssessment.specificRisks.length}项具体风险`);
    }

    traditionalEngine.cleanup();

  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.log('⏰ 决策制定超时，可能需要优化性能');
      } else if (error.message.includes('LLM')) {
        console.log('🤖 LLM服务出现问题，使用了传统推理方法');
      }
    }
  } finally {
    // 清理资源
    decisionEngine.cleanup();
    personalityFactory.cleanup();
    console.log('✅ 测试完成，资源已清理');
  }
}

// 演示不同生肖的决策推理风格
async function demonstrateZodiacDecisionStyles() {
  console.log('\n🎭 演示不同生肖的决策推理风格\n');

  const llmService2 = createLLMService();
  const decisionEngine = new DecisionEngine({
    llmService: llmService2,
    maxTokens: 600,
    temperature: 0.8
  });

  const personalityFactory = new PersonalityFactory({
    llmService: llmService2
  });

  await decisionEngine.initialize();

  const scenario = {
    situation: '面临一个高风险高收益的投资机会',
    gamePhase: { phase: 'mid_game', remainingTurns: 20, progression: 0.5 },
    economicSituation: { cashFlow: 40000, netWorth: 45000, liquidityRatio: 0.8, propertyValue: 5000, moneyRank: 2, propertyRank: 3 },
    threats: [{ source: 'competitor', severity: 0.7, description: '竞争对手资金充足' }],
    opportunities: [{ target: 'investment', potential: 0.9, description: '高价值投资机会' }]
  } as any;

  const gameState = {
    turn: 30,
    players: [{ id: 'test', name: '测试', money: 40000, properties: [] }]
  } as any;

  const zodiacs: ZodiacSign[] = ['龙', '虎', '兔', '蛇'];
  
  for (const zodiac of zodiacs) {
    try {
      const personality = await personalityFactory.createPersonality(zodiac, 'medium');
      const aiState = {
        id: `${zodiac}_test`,
        personality,
        emotionalState: { mood: 'focused' },
        memory: { playerRelationships: {}, recentEvents: [], learningData: {} },
        currentStrategy: { focus: 'opportunistic' },
        statistics: { totalDecisions: 10, averageDecisionTime: 2000, confidenceLevel: 0.7, successRate: 0.8, cacheHitRate: 0.5 }
      } as any;

      const decision = await decisionEngine.makeDecision(aiState, gameState, scenario);
      
      console.log(`${zodiac}的决策推理:`);
      console.log(`动作: ${decision.action.type}`);
      console.log(`推理: ${decision.reasoning.substring(0, 200)}...`);
      console.log(`置信度: ${(decision.confidence * 100).toFixed(1)}%\n`);
      
    } catch (error) {
      console.log(`${zodiac}: [决策生成失败，跳过]\n`);
    }
  }

  decisionEngine.cleanup();
  personalityFactory.cleanup();
}

// 运行测试
testEnhancedDecisionReasoning()
  .then(() => demonstrateZodiacDecisionStyles())
  .catch(console.error);

export { testEnhancedDecisionReasoning };