/**
 * 动态对话与谈判系统测试
 */
import { ConversationManager } from './ConversationManager';
import { PersonalityFactory } from './PersonalityFactory';
import { createLLMService } from './LLMServiceFactory';
import type { ZodiacSign } from '../types/game';

async function testConversationSystem() {
  console.log('🧪 测试动态对话与谈判系统\n');

  // 创建带LLM服务的对话管理器
  const llmService = createLLMService();
  const conversationManager = new ConversationManager({
    llmService,
    maxTokens: 800,
    temperature: 0.8,
    enableCache: true
  });

  // 创建个性工厂用于生成测试AI
  const personalityFactory = new PersonalityFactory({
    llmService
  });

  try {
    // 创建测试AI角色
    console.log('👤 创建测试AI角色...');
    const dragonPersonality = await personalityFactory.createPersonality('龙', 'medium');
    const tigerPersonality = await personalityFactory.createPersonality('虎', 'hard');

    const dragonState = {
      id: 'dragon_player',
      personality: dragonPersonality,
      emotionalState: { mood: 'confident' },
      memory: { playerRelationships: {} },
      currentStrategy: { focus: 'prestige' }
    } as any;

    const tigerState = {
      id: 'tiger_player', 
      personality: tigerPersonality,
      emotionalState: { mood: 'aggressive' },
      memory: { playerRelationships: {} },
      currentStrategy: { focus: 'growth' }
    } as any;

    const mockGameState = {
      turn: 25,
      players: [
        { id: 'dragon_player', name: '龙王', zodiac: '龙' },
        { id: 'tiger_player', name: '虎将', zodiac: '虎' },
        { id: 'player1', name: '玩家1', zodiac: '兔' }
      ]
    } as any;

    // 测试1：游戏场景对话
    console.log('💬 测试1: 游戏场景对话生成');
    const scenario = {
      type: 'property_purchase',
      description: '刚刚购买了市中心的一块昂贵土地',
      participants: ['dragon_player'],
      context: { property: '中央商务区', price: 50000 }
    };

    const scenarioDialogue = await conversationManager.generateScenarioDialogue(
      dragonState,
      scenario,
      mockGameState
    );
    
    console.log(`龙王: "${scenarioDialogue.content}"`);
    console.log(`语调: ${scenarioDialogue.tone}`);
    console.log('');

    // 测试2：启动谈判
    console.log('🤝 测试2: 启动贸易谈判');
    const negotiationDetails = {
      initiatorAdvantages: ['资金充足', '地段优势'],
      targetAdvantages: ['经验丰富', '人脉广泛'],
      desiredOutcome: '达成互利的土地交换协议'
    };

    const negotiationSession = await conversationManager.startNegotiation(
      dragonState,
      'tiger_player',
      'property_exchange',
      mockGameState,
      negotiationDetails
    );

    console.log(`谈判开始 (${negotiationSession.sessionId}):`);
    console.log(`龙王: "${negotiationSession.dialogueHistory[0].opening}"`);
    
    if (negotiationSession.dialogueHistory[0].mainPoints.length > 0) {
      console.log(`主要论点: ${negotiationSession.dialogueHistory[0].mainPoints.join(', ')}`);
    }
    console.log('');

    // 测试3：谈判回应
    console.log('🗣️ 测试3: 生成谈判回应');
    const negotiationResponse = await conversationManager.respondToNegotiation(
      tigerState,
      negotiationSession.sessionId,
      'counter',
      mockGameState
    );

    console.log(`虎将回应: "${negotiationResponse.opening}"`);
    if (negotiationResponse.mainPoints.length > 0) {
      console.log(`回应要点: ${negotiationResponse.mainPoints.join(', ')}`);
    }
    console.log('');

    // 测试4：情绪反应对话
    console.log('😤 测试4: 情绪反应对话');
    const emotionalTrigger = {
      emotion: 'frustrated' as const,
      situation: '被其他玩家抢先购买了心仪的地产',
      intensity: 0.8,
      cause: '竞价失败'
    };

    const emotionalResponse = await conversationManager.generateEmotionalResponse(
      tigerState,
      emotionalTrigger,
      mockGameState,
      'dragon_player'
    );

    console.log(`虎将(沮丧): "${emotionalResponse.content}"`);
    console.log(`情绪强度: ${emotionalTrigger.intensity}`);
    console.log('');

    // 测试5：对话历史和分析
    console.log('📊 测试5: 对话历史与影响分析');
    const conversationHistory = conversationManager.getConversationHistory('dragon_player', 5);
    console.log(`龙王对话历史记录数: ${conversationHistory.length}`);

    const conversationImpact = conversationManager.analyzeConversationImpact(
      scenarioDialogue,
      'dragon_player',
      'tiger_player'
    );
    console.log(`对话影响分析:`);
    console.log(`- 情感评分: ${conversationImpact.sentimentScore.toFixed(2)}`);
    console.log(`- 关系影响: ${conversationImpact.relationshipChange.toFixed(2)}`);
    console.log(`- 话题相关度: ${conversationImpact.topicRelevance.toFixed(2)}`);
    console.log('');

    // 测试6：结束谈判
    console.log('✅ 测试6: 结束谈判');
    const negotiationResult = {
      success: true,
      terms: { exchangeRatio: '1:1.2', additionalCash: 10000 },
      satisfaction: 0.8,
      relationshipImpact: 0.2
    };

    const concludedSession = conversationManager.concludeNegotiation(
      negotiationSession.sessionId,
      negotiationResult,
      '很高兴我们达成了协议！'
    );

    console.log(`谈判结束: ${concludedSession.status}`);
    console.log(`谈判满意度: ${negotiationResult.satisfaction}`);
    console.log(`对话轮数: ${concludedSession.dialogueHistory.length}`);
    console.log('');

    // 测试7：系统状态检查
    console.log('📈 测试7: 系统状态检查');
    const activeNegotiations = conversationManager.getActiveNegotiations();
    console.log(`当前活跃谈判数: ${activeNegotiations.length}`);
    
    const dragonHistory = conversationManager.getConversationHistory('dragon_player');
    console.log(`龙王总对话记录: ${dragonHistory.length}`);

  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.log('⏰ LLM请求超时，可能是网络问题');
      } else if (error.message.includes('API')) {
        console.log('🔌 API调用失败，请检查配置');
      }
    }
  } finally {
    // 清理资源
    conversationManager.cleanup();
    personalityFactory.cleanup();
    console.log('✅ 测试完成，资源已清理');
  }
}

// 辅助函数：展示对话上下文
function displayConversationContext(context: any) {
  console.log('对话上下文:');
  console.log(`- 情况: ${context.situation || 'N/A'}`);
  console.log(`- 游戏阶段: ${context.gamePhase || 'N/A'}`);
  console.log(`- 当前表现: ${context.currentPerformance || 'N/A'}`);
}

// 演示不同生肖的对话风格差异
async function demonstrateZodiacDialogueStyles() {
  console.log('\n🎭 演示不同生肖的对话风格\n');
  
  const llmService2 = createLLMService();
  const conversationManager = new ConversationManager({
    llmService: llmService2
  });

  const personalityFactory = new PersonalityFactory({
    llmService: llmService2
  });

  const scenario = {
    type: 'victory_celebration',
    description: '成功完成了一笔重要的商业交易',
    participants: [],
    context: { deal_value: 100000 }
  };

  const mockGameState = {
    turn: 30,
    players: [{ id: 'test', name: '测试', zodiac: '测试' }]
  } as any;

  const zodiacs: ZodiacSign[] = ['龙', '虎', '兔', '蛇'];
  
  for (const zodiac of zodiacs) {
    try {
      const personality = await personalityFactory.createPersonality(zodiac, 'medium');
      const aiState = {
        id: `${zodiac}_test`,
        personality,
        emotionalState: { mood: 'excited' },
        memory: { playerRelationships: {} }
      } as any;

      const dialogue = await conversationManager.generateScenarioDialogue(
        aiState,
        scenario,
        mockGameState
      );

      console.log(`${zodiac}: "${dialogue.content}"`);
    } catch (error) {
      console.log(`${zodiac}: [生成失败，使用传统模式]`);
    }
  }

  conversationManager.cleanup();
  personalityFactory.cleanup();
}

// 运行测试
testConversationSystem()
  .then(() => demonstrateZodiacDialogueStyles())
  .catch(console.error);

export { testConversationSystem };