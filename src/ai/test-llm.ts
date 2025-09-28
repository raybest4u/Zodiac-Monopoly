/**
 * DeepSeek LLM服务测试脚本
 */
import { createLLMService } from './LLMServiceFactory';

async function testLLMService() {
  console.log('🧪 开始测试 DeepSeek LLM 服务...\n');

  // 初始化LLM服务
  const llmService = createLLMService();

  try {
    // 测试1：生成AI个性档案
    console.log('📝 测试1: 生成龙生肖AI个性档案...');
    const personalityProfile = await llmService.generatePersonalityProfile(
      '龙',
      'medium'
    );
    
    console.log('✅ 个性档案生成成功:');
    console.log(`- 角色名: ${personalityProfile.name}`);
    console.log(`- 描述: ${personalityProfile.description.substring(0, 100)}...`);
    console.log(`- 特征: ${personalityProfile.characteristics.join(', ')}`);
    console.log('');

    // 测试2：生成简单对话
    console.log('💬 测试2: 生成对话内容...');
    const conversation = await llmService.generateConversation(
      {
        id: 'test_ai',
        personality: {
          zodiac_traits: { strengths: ['智慧', '威严'] }
        },
        emotionalState: { mood: 'confident' },
        memory: { playerRelationships: {} }
      } as any,
      {
        situation: '刚刚购买了一块昂贵的土地',
        gamePhase: '中期',
        currentPerformance: '领先'
      }
    );

    console.log('✅ 对话生成成功:');
    console.log(`- 内容: ${conversation.content}`);
    console.log(`- 语调: ${conversation.tone}`);
    console.log('');

    // 测试3：测试API连接和响应时间
    console.log('⚡ 测试3: API连接性能测试...');
    const startTime = Date.now();
    
    await llmService.generateConversation(
      {
        id: 'perf_test',
        personality: { zodiac_traits: { strengths: ['敏捷'] } },
        emotionalState: { mood: 'neutral' },
        memory: { playerRelationships: {} }
      } as any,
      {
        situation: '性能测试',
        gamePhase: '测试',
        currentPerformance: '正常'
      }
    );

    const responseTime = Date.now() - startTime;
    console.log(`✅ API响应时间: ${responseTime}ms`);
    console.log('');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.log('🔑 API密钥可能无效或已过期');
      } else if (error.message.includes('timeout')) {
        console.log('⏰ 请求超时，网络可能有问题');
      } else if (error.message.includes('fetch')) {
        console.log('🌐 网络连接失败，请检查网络设置');
      }
    }
  } finally {
    // 清理资源
    llmService.cleanup();
    console.log('🧹 测试完成，资源已清理');
  }
}

// 运行测试
testLLMService().catch(console.error);

export { testLLMService };