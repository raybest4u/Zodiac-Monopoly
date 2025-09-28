/**
 * LLM增强个性生成系统测试
 */
import { PersonalityFactory } from './PersonalityFactory';
import { createLLMService } from './LLMServiceFactory';
import type { ZodiacSign } from '../types/game';

async function testLLMPersonalityGeneration() {
  console.log('🧪 测试 LLM 增强个性生成系统\n');

  // 创建带LLM服务的个性工厂
  const llmService = createLLMService();
  const factory = new PersonalityFactory({
    llmService,
    enableCache: true,
    maxRetries: 2,
    timeout: 15000
  });

  try {
    // 测试1：创建传统个性 vs LLM增强个性
    console.log('📊 测试1: 对比传统个性与LLM增强个性');
    const zodiac: ZodiacSign = '龙';
    const difficulty = 'medium';
    
    // 创建无LLM的传统个性
    const traditionalFactory = new PersonalityFactory();
    const traditionalPersonality = await traditionalFactory.createPersonality(zodiac, difficulty);
    
    // 创建LLM增强个性
    const enhancedPersonality = await factory.createPersonality(zodiac, difficulty);
    const profile = enhancedPersonality.profile || { name: 'Default', description: 'Default description', characteristics: [], speechStyle: 'Default', strategies: [], backstory: 'Default backstory' };
    
    console.log('传统个性特征:');
    console.log(`- 风险承受度: ${traditionalPersonality.risk_tolerance.toFixed(2)}`);
    console.log(`- 攻击性: ${traditionalPersonality.aggression.toFixed(2)}`);
    console.log(`- 合作性: ${traditionalPersonality.cooperation.toFixed(2)}`);
    console.log(`- 生肖优势: ${traditionalPersonality.zodiac_traits.strengths.join(', ')}`);
    
    console.log('\nLLM增强个性特征:');
    console.log(`- 角色名: ${profile.name}`);
    console.log(`- 描述: ${profile.description.substring(0, 100)}...`);
    console.log(`- 特征: ${profile.characteristics.join(', ')}`);
    console.log(`- 说话风格: ${profile.speechStyle}`);
    console.log(`- 策略偏好: ${profile.strategies.join(', ')}`);
    console.log(`- 背景故事: ${profile.backstory}`);
    console.log('');

    // 测试2：批量生成AI团队
    console.log('👥 测试2: 生成LLM增强AI团队');
    const teamZodiacs: ZodiacSign[] = ['虎', '兔', '蛇'];
    const teamPersonalities = await Promise.all(teamZodiacs.map(zodiac => factory.createPersonality(zodiac, 'hard')));
    
    console.log('AI团队成员特征:');
    teamPersonalities.forEach((personality, index) => {
      const zodiac = teamZodiacs[index];
      const enhancedProfile = (personality as any)._enhancedProfile;
      
      console.log(`${index + 1}. ${zodiac} - 攻击性: ${personality.aggression.toFixed(2)}, 风险承受度: ${personality.risk_tolerance.toFixed(2)}`);
      
      if (enhancedProfile) {
        console.log(`   角色: ${enhancedProfile.name}`);
        console.log(`   风格: ${enhancedProfile.speechStyle}`);
      }
    });
    console.log('');

    // 测试3：验证个性一致性
    console.log('🔍 测试3: 验证生成个性的一致性');
    const personality1 = await factory.createPersonality('猴', 'expert');
    const personality2 = await factory.createPersonality('猴', 'expert');
    
    const diff = Math.abs(personality1.adaptability - personality2.adaptability);
    console.log(`猴生肖适应性差异: ${diff.toFixed(3)} (应该较小，说明基础特征保持一致)`);
    
    // 测试4：性能测试
    console.log('⚡ 测试4: 性能测试');
    const startTime = Date.now();
    
    await Promise.all([
      factory.createPersonality('羊', 'easy'),
      factory.createPersonality('鸡', 'medium'),
      factory.createPersonality('狗', 'hard')
    ]);
    
    const duration = Date.now() - startTime;
    console.log(`并发生成3个AI个性耗时: ${duration}ms`);

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    // 清理资源
    factory.cleanup();
    console.log('✅ 测试完成，资源已清理');
  }
}

// 比较个性特征的函数
function comparePersonalities(traditional: any, enhanced: any) {
  console.log('\n📈 个性对比分析:');
  
  const traits = ['risk_tolerance', 'aggression', 'cooperation', 'adaptability', 'patience'];
  traits.forEach(trait => {
    const traditional_val = traditional[trait];
    const enhanced_val = enhanced[trait];
    const diff = Math.abs(traditional_val - enhanced_val);
    
    console.log(`${trait}: 传统 ${traditional_val.toFixed(2)} -> LLM ${enhanced_val.toFixed(2)} (差异: ${diff.toFixed(3)})`);
  });
}

// 运行测试
testLLMPersonalityGeneration().catch(console.error);

export { testLLMPersonalityGeneration };