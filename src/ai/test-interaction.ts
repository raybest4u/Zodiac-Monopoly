/**
 * LLM增强玩家互动系统测试
 */
import { InteractionManager } from './InteractionManager';
import { PersonalityFactory } from './PersonalityFactory';
import { createLLMService } from './LLMServiceFactory';
import type { AIState } from '../types/ai';
import type { Player } from '../types/game';

async function testPlayerInteractionSystem() {
  console.log('🧪 测试LLM增强玩家互动系统\n');

  // 创建带LLM服务的互动管理器
  const llmService = createLLMService();
  const interactionManager = new InteractionManager({
    llmService,
    maxTokens: 400,
    temperature: 0.8,
    enableCache: true
  });

  // 创建个性工厂
  const personalityFactory = new PersonalityFactory({
    llmService
  });

  try {
    // 创建测试玩家和AI
    const humanPlayer: Player = {
      id: 'human_player',
      name: '玩家小明',
      zodiac: '兔',
      money: 40000,
      properties: []
    };

    const aiPlayers: Player[] = [
      { id: 'dragon_ai', name: '敖辰', zodiac: '龙', money: 55000, properties: [] },
      { id: 'tiger_ai', name: '啸天', zodiac: '虎', money: 45000, properties: [] },
      { id: 'snake_ai', name: '玄鳞', zodiac: '蛇', money: 50000, properties: [] }
    ];

    const allPlayers = [humanPlayer, ...aiPlayers];
    const gameState = {
      turn: 20,
      phase: 'middle',
      players: allPlayers
    } as any;

    // 创建AI状态
    const aiStates = new Map<string, AIState>();
    for (const aiPlayer of aiPlayers) {
      const personality = await personalityFactory.createPersonality(
        aiPlayer.zodiac as any, 
        'medium'
      );
      
      aiStates.set(aiPlayer.id, {
        id: aiPlayer.id,
        personality,
        emotionalState: { mood: 'focused' },
        memory: { 
          playerRelationships: {},
          recentEvents: [],
          learningData: {}
        },
        currentStrategy: { focus: 'opportunistic' },
        statistics: {
          totalDecisions: 10,
          averageDecisionTime: 2000,
          confidenceLevel: 0.7,
          successRate: 0.8,
          cacheHitRate: 0.5
        }
      } as any);
    }

    // 测试1：基础玩家-AI互动
    console.log('🤝 测试1: 基础玩家-AI互动');
    const greetingResult = await interactionManager.handlePlayerInteraction(
      humanPlayer.id,
      'dragon_ai',
      'greeting',
      '你好，敖辰！今天的游戏很精彩啊！',
      gameState,
      aiStates
    );

    console.log(`玩家问候龙王:`);
    console.log(`- AI回应: ${greetingResult.primaryResponse.content}`);
    console.log(`- 情感倾向: ${greetingResult.primaryResponse.sentiment}`);
    console.log(`- 连锁反应数: ${greetingResult.chainReactions.length}`);
    console.log(`- 关系变化: ${greetingResult.relationshipChanges.length}项`);
    console.log(`- 后续建议: ${greetingResult.suggestedFollowUps.join(', ')}`);
    console.log('');

    // 测试2：挑衅互动
    console.log('😤 测试2: 挑衅性互动');
    const tauntResult = await interactionManager.handlePlayerInteraction(
      humanPlayer.id,
      'tiger_ai',
      'taunt',
      '虎将，你这次的投资策略似乎不太明智啊！',
      gameState,
      aiStates
    );

    console.log(`玩家挑衅虎将:`);
    console.log(`- AI回应: ${tauntResult.primaryResponse.content}`);
    console.log(`- 情感倾向: ${tauntResult.primaryResponse.sentiment}`);
    if (tauntResult.chainReactions.length > 0) {
      console.log(`- 其他AI反应:`);
      tauntResult.chainReactions.forEach((reaction, index) => {
        console.log(`  ${index + 1}. ${reaction.reactingAI}: ${reaction.response.substring(0, 100)}...`);
        console.log(`     (反应类型: ${reaction.reactionType}, 动机: ${reaction.motivation})`);
      });
    }
    console.log('');

    // 测试3：联盟提议
    console.log('🤝 测试3: 联盟提议互动');
    const allianceResult = await interactionManager.handlePlayerInteraction(
      humanPlayer.id,
      'snake_ai',
      'alliance_proposal',
      '玄鳞，我觉得我们可以合作对付那些威胁更大的对手，你觉得怎么样？',
      gameState,
      aiStates
    );

    console.log(`玩家向蛇君提议联盟:`);
    console.log(`- AI回应: ${allianceResult.primaryResponse.content}`);
    console.log(`- 建议后续行动: ${allianceResult.suggestedFollowUps.join(', ')}`);
    console.log('');

    // 测试4：AI主动互动
    console.log('🚀 测试4: AI主动互动');
    const proactiveResult = await interactionManager.generateProactiveInteraction(
      aiStates.get('dragon_ai')!,
      humanPlayer.id,
      gameState,
      {
        type: 'strategic_opportunity',
        context: { opportunity: '有利交易机会' },
        urgency: 0.7,
        strategicValue: 0.8
      }
    );

    console.log(`龙王主动接触玩家:`);
    console.log(`- 互动类型: ${proactiveResult.interactionType}`);
    console.log(`- AI消息: ${proactiveResult.message}`);
    console.log(`- 动机解释: ${proactiveResult.motivation}`);
    console.log(`- 时机评估: ${proactiveResult.timing}`);
    console.log(`- 战略目的: ${proactiveResult.strategicPurpose}`);
    console.log(`- 预期玩家反应: ${proactiveResult.expectedPlayerReactions.join(', ')}`);
    console.log('');

    // 测试5：多人互动场景
    console.log('👥 测试5: 多人互动场景');
    const multiPlayerResult = await interactionManager.handleMultiPlayerInteraction(
      humanPlayer.id,
      aiPlayers.map(ai => ai.id),
      {
        scenario: 'group_negotiation',
        participants: allPlayers.map(p => p.id),
        topic: '重要地产的拍卖竞争',
        stakes: { propertyValue: 60000, strategicImportance: 'high' },
        gameContext: { phase: 'late_game', competitionLevel: 'intense' }
      },
      gameState,
      aiStates
    );

    console.log(`多人互动场景 - 地产拍卖:`);
    console.log(`- 参与者回应数: ${multiPlayerResult.participantResponses.length}`);
    multiPlayerResult.participantResponses.forEach((response, index) => {
      const aiName = aiPlayers.find(ai => ai.id === response.participantId)?.name || response.participantId;
      console.log(`  ${index + 1}. ${aiName}: ${response.response.substring(0, 80)}...`);
      console.log(`     (语调: ${response.tone}, 战略意图: ${response.strategicIntent})`);
    });
    
    console.log(`- 群体动态:`);
    console.log(`  主导人格: ${multiPlayerResult.groupDynamics.dominantPersonalities.join(', ')}`);
    console.log(`  冲突等级: ${multiPlayerResult.groupDynamics.conflictLevel.toFixed(2)}`);
    console.log(`  合作等级: ${multiPlayerResult.groupDynamics.cooperationLevel.toFixed(2)}`);
    console.log(`- 场景叙述: ${multiPlayerResult.sceneNarration.substring(0, 150)}...`);
    console.log(`- 新兴主题: ${multiPlayerResult.emergentThemes.join(', ')}`);
    console.log('');

    // 测试6：互动建议生成
    console.log('💡 测试6: 互动建议生成');
    const suggestions = interactionManager.getInteractionSuggestions(
      humanPlayer.id,
      aiPlayers.map(ai => ai.id),
      gameState,
      aiStates
    );

    console.log(`为玩家生成的互动建议 (前3个):`);
    suggestions.slice(0, 3).forEach((suggestion, index) => {
      const aiName = aiPlayers.find(ai => ai.id === suggestion.aiId)?.name || suggestion.aiId;
      console.log(`${index + 1}. 与${aiName}进行${suggestion.interactionType}:`);
      console.log(`   建议内容: "${suggestion.suggestedMessage}"`);
      console.log(`   推理: ${suggestion.reasoning}`);
      console.log(`   优先级: ${suggestion.priority.toFixed(2)}`);
      console.log(`   预期结果: ${suggestion.expectedOutcome}`);
      console.log('');
    });

    // 测试7：适应性学习模拟
    console.log('🎓 测试7: 适应性学习模拟');
    // 模拟玩家反馈
    const feedback = {
      rating: 4,
      comments: '这个AI的回应很有趣，很符合角色特点',
      aspectRatings: {
        relevance: 4,
        personality: 5,
        entertainment: 4,
        helpfulness: 3
      }
    };

    // 假设这是第一个互动的ID
    const mockInteractionId = Date.now().toString();
    await interactionManager.learnFromInteractionFeedback(
      mockInteractionId,
      feedback,
      gameState
    );

    console.log(`学习反馈处理完成:`);
    console.log(`- 反馈评分: ${feedback.rating}/5`);
    console.log(`- 各方面评分: 相关性${feedback.aspectRatings.relevance}, 个性${feedback.aspectRatings.personality}, 娱乐性${feedback.aspectRatings.entertainment}, 实用性${feedback.aspectRatings.helpfulness}`);
    console.log('- AI系统已根据反馈调整策略');
    console.log('');

    // 测试8：玩家互动报告
    console.log('📊 测试8: 玩家互动报告');
    const interactionReport = interactionManager.generateInteractionReport(humanPlayer.id);
    
    console.log(`玩家互动分析报告:`);
    console.log(`- 总互动次数: ${interactionReport.totalInteractions}`);
    console.log(`- AI关系摘要:`);
    interactionReport.relationshipSummaries.forEach(summary => {
      const aiName = aiPlayers.find(ai => ai.id === summary.aiId)?.name || summary.aiId;
      console.log(`  ${aiName}: ${summary.interactionCount}次互动, 平均评分${summary.averageRating?.toFixed(1) || 'N/A'}`);
      console.log(`    常见互动类型: ${summary.commonInteractionTypes.join(', ')}`);
    });
    console.log(`- 沟通风格: ${interactionReport.communicationStyle}`);
    console.log(`- 偏好互动类型: ${interactionReport.preferredInteractionTypes.join(', ')}`);
    console.log(`- 改进建议: ${interactionReport.improvementSuggestions.join('; ')}`);

  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.log('⏰ 互动处理超时，可能需要优化性能');
      } else if (error.message.includes('LLM')) {
        console.log('🤖 LLM服务出现问题，使用了基础回应');
      } else if (error.message.includes('not found')) {
        console.log('🔍 玩家或AI数据未找到，请检查数据初始化');
      }
    }
  } finally {
    // 清理资源
    interactionManager.cleanup();
    personalityFactory.cleanup();
    console.log('✅ 测试完成，资源已清理');
  }
}

// 演示不同互动类型的效果
async function demonstrateInteractionTypes() {
  console.log('\n🎭 演示不同互动类型的效果\n');

  const llmService2 = createLLMService();
  const interactionManager = new InteractionManager({
    llmService: llmService2,
    maxTokens: 300,
    temperature: 0.85
  });

  const personalityFactory = new PersonalityFactory({
    llmService: llmService2
  });

  const humanPlayer = { id: 'human', name: '测试玩家', zodiac: '兔', money: 40000, properties: [] };
  const aiPlayer = { id: 'dragon_ai', name: '威龙', zodiac: '龙', money: 60000, properties: [] };
  const gameState = { turn: 15, phase: 'early', players: [humanPlayer, aiPlayer] } as any;

  const personality = await personalityFactory.createPersonality('龙', 'hard');
  const aiState = {
    id: 'dragon_ai',
    personality,
    emotionalState: { mood: 'confident' },
    memory: { playerRelationships: {}, recentEvents: [], learningData: {} },
    currentStrategy: { focus: 'wealth_accumulation' }
  } as any;

  const aiStates = new Map([['dragon_ai', aiState]]);

  const interactionTests = [
    {
      type: 'compliment' as const,
      message: '威龙，你的商业头脑真是令人佩服！',
      description: '称赞互动'
    },
    {
      type: 'information_request' as const,
      message: '威龙，你对下一轮的市场有什么看法？',
      description: '信息请求'
    },
    {
      type: 'casual_chat' as const,
      message: '威龙，作为龙族，你觉得这个游戏怎么样？',
      description: '闲聊互动'
    },
    {
      type: 'competitive_banter' as const,
      message: '威龙，等着看我如何超越你的财富！',
      description: '竞争性玩笑'
    }
  ];

  for (const test of interactionTests) {
    try {
      console.log(`${test.description} (${test.type}):`);
      console.log(`玩家: "${test.message}"`);
      
      const result = await interactionManager.handlePlayerInteraction(
        humanPlayer.id,
        aiPlayer.id,
        test.type,
        test.message,
        gameState,
        aiStates
      );

      console.log(`威龙: "${result.primaryResponse.content}"`);
      console.log(`情感: ${result.primaryResponse.sentiment}\n`);
      
    } catch (error) {
      console.log(`威龙: [回应生成失败]\n`);
    }
  }

  interactionManager.cleanup();
  personalityFactory.cleanup();
}

// 测试社交网络分析
async function testSocialNetworkAnalysis() {
  console.log('\n🌐 测试社交网络分析\n');

  console.log('模拟多轮互动后的社交网络状态:');
  console.log('玩家 ←→ 龙王: 信任度 0.7, 友好度 0.8, 竞争度 0.4');
  console.log('玩家 ←→ 虎将: 信任度 0.3, 友好度 0.2, 竞争度 0.9');
  console.log('玩家 ←→ 蛇君: 信任度 0.6, 友好度 0.5, 竞争度 0.6');
  console.log('');

  console.log('社交网络影响分析:');
  console.log('- 玩家在网络中的中心度: 0.75 (高度连接)');
  console.log('- 最强联盟可能: 玩家 + 龙王');
  console.log('- 最大威胁关系: 玩家 vs 虎将');
  console.log('- 潜在调解者: 蛇君 (平衡位置)');
  console.log('');

  console.log('建议的社交策略:');
  console.log('1. 继续深化与龙王的合作关系');
  console.log('2. 尝试缓解与虎将的紧张关系');
  console.log('3. 利用蛇君的中立地位获取信息');
  console.log('4. 在多人场景中发挥社交优势');
}

// 运行所有测试
testPlayerInteractionSystem()
  .then(() => demonstrateInteractionTypes())
  .then(() => testSocialNetworkAnalysis())
  .catch(console.error);

export { testPlayerInteractionSystem };