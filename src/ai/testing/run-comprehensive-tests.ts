/**
 * 综合测试执行脚本
 * 第3周：执行全面的AI系统测试和调优
 */
import { ComprehensiveTestFramework } from './ComprehensiveTestFramework';

async function runAllTests() {
  console.log('🚀 启动AI系统综合测试\n');
  console.log('='.repeat(60));
  console.log('第三周：全面测试AI系统并进行调优');
  console.log('='.repeat(60));
  console.log('');

  const testFramework = new ComprehensiveTestFramework();
  
  try {
    const results = await testFramework.runComprehensiveTests();
    
    // 详细报告
    console.log('\n📈 详细测试报告:');
    console.log('='.repeat(40));
    
    results.moduleResults.forEach(module => {
      console.log(`\n${module.moduleName}模块:`);
      console.log(`- 总测试: ${module.totalTests}`);
      console.log(`- 通过: ${module.passedTests} ✅`);
      console.log(`- 失败: ${module.failedTests} ❌`);
      console.log(`- 成功率: ${(module.passRate * 100).toFixed(1)}%`);
      console.log(`- 耗时: ${(module.duration / 1000).toFixed(2)}秒`);
      
      // 显示失败的测试
      const failedTests = module.results.filter(r => !r.passed);
      if (failedTests.length > 0) {
        console.log(`- 失败测试:`);
        failedTests.forEach(test => {
          console.log(`  * ${test.testName}: ${test.error}`);
        });
      }
    });

    // 性能指标
    console.log('\n⚡ 性能指标:');
    console.log(`- 总测试耗时: ${(results.totalDuration / 1000).toFixed(2)}秒`);
    console.log(`- 平均测试时间: ${(results.totalDuration / results.totalTests).toFixed(0)}ms`);
    
    // 优化建议
    console.log('\n💡 优化建议:');
    generateOptimizationRecommendations(results);

    // 质量评级
    const qualityGrade = calculateQualityGrade(results);
    console.log(`\n🏆 系统质量评级: ${qualityGrade.grade} (${qualityGrade.score.toFixed(1)}/100)`);
    console.log(`评语: ${qualityGrade.comment}`);

  } catch (error) {
    console.error('❌ 测试执行失败:', error);
  } finally {
    testFramework.cleanup();
  }
}

function generateOptimizationRecommendations(results: any) {
  const recommendations = [];
  
  // 基于测试结果生成建议
  if (results.passRate < 0.9) {
    recommendations.push('建议重点关注失败的测试用例，提升系统稳定性');
  }
  
  if (results.totalDuration > 60000) { // 超过1分钟
    recommendations.push('建议优化性能，减少响应时间');
  }
  
  const performanceModules = results.moduleResults.filter(m => 
    m.moduleName.includes('性能') || m.moduleName.includes('LLM')
  );
  
  if (performanceModules.some(m => m.passRate < 0.8)) {
    recommendations.push('建议优化LLM调用频率和缓存策略');
  }
  
  const multiAIModule = results.moduleResults.find(m => m.moduleName.includes('多AI'));
  if (multiAIModule && multiAIModule.passRate < 0.85) {
    recommendations.push('建议改进多AI协作算法');
  }

  if (recommendations.length === 0) {
    recommendations.push('系统表现良好，可以考虑添加更多高级功能');
    recommendations.push('建议进行更大规模的压力测试');
    recommendations.push('可以开始准备生产环境部署');
  }

  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
}

function calculateQualityGrade(results: any): { grade: string; score: number; comment: string } {
  let score = 0;
  
  // 基础分：通过率
  score += results.passRate * 60;
  
  // 性能分：基于响应时间
  if (results.totalDuration < 30000) score += 20;
  else if (results.totalDuration < 60000) score += 15;
  else if (results.totalDuration < 120000) score += 10;
  else score += 5;
  
  // 稳定性分：基于各模块表现
  const avgModulePassRate = results.moduleResults.reduce((sum: number, m: any) => sum + m.passRate, 0) / results.moduleResults.length;
  score += avgModulePassRate * 20;

  // 确定等级和评语
  let grade: string;
  let comment: string;
  
  if (score >= 90) {
    grade = 'A+';
    comment = '优秀！系统质量达到生产级别标准';
  } else if (score >= 80) {
    grade = 'A';
    comment = '良好！系统基本满足要求，可进行微调优化';
  } else if (score >= 70) {
    grade = 'B+';
    comment = '中等！需要针对性优化部分功能模块';
  } else if (score >= 60) {
    grade = 'B';
    comment = '及格！需要大幅改进系统稳定性和性能';
  } else {
    grade = 'C';
    comment = '不合格！需要重新审视系统架构和实现';
  }

  return { grade, score, comment };
}

// 执行测试
runAllTests().catch(console.error);

export { runAllTests };