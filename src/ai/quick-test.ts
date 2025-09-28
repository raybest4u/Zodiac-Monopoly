/**
 * AI系统快速验证测试
 */
import { AISystemManager } from './integration/AISystemManager';
import { PerformanceOptimizer } from './optimization/PerformanceOptimizer';
import { DataPersistenceLayer } from './persistence/DataPersistenceLayer';
import { SystemMonitor } from './monitoring/SystemMonitor';
import { ErrorRecoverySystem, ErrorType, ErrorSeverity } from './recovery/ErrorRecoverySystem';
import { ResourceManager } from './resources/ResourceManager';
import { ComprehensiveTestSystem } from './testing/ComprehensiveTestSystem';

async function quickTest() {
  console.log('🚀 AI系统快速验证测试\n');

  const results = {
    aiManager: false,
    optimizer: false,
    persistence: false,
    monitor: false,
    recovery: false,
    resources: false,
    testing: false
  };

  // 1. AI系统管理器测试
  try {
    console.log('1. 测试AI系统管理器...');
    const aiManager = new AISystemManager();
    await aiManager.initialize();
    const status = await aiManager.getSystemStatus();
    console.log(`   ✅ AI管理器: ${status.totalInstances}个实例`);
    await aiManager.shutdown();
    results.aiManager = true;
  } catch (error) {
    console.log('   ❌ AI管理器测试失败:', (error as Error).message);
  }

  // 2. 性能优化器测试
  try {
    console.log('2. 测试性能优化器...');
    const optimizer = new PerformanceOptimizer();
    await optimizer.startOptimization(1000);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const plan = optimizer.getOptimizationPlan();
    console.log(`   ✅ 性能优化器: ${plan.strategies.length}个策略`);
    await optimizer.stopOptimization();
    results.optimizer = true;
  } catch (error) {
    console.log('   ❌ 性能优化器测试失败:', (error as Error).message);
  }

  // 3. 数据持久化测试
  try {
    console.log('3. 测试数据持久化...');
    const persistence = new DataPersistenceLayer({ baseDirectory: './test-quick' });
    await persistence.initialize();
    const metrics = await persistence.getStorageMetrics();
    console.log(`   ✅ 数据持久化: ${metrics.totalSnapshots}个快照`);
    await persistence.shutdown();
    results.persistence = true;
  } catch (error) {
    console.log('   ❌ 数据持久化测试失败:', (error as Error).message);
  }

  // 4. 系统监控测试
  try {
    console.log('4. 测试系统监控...');
    const monitor = new SystemMonitor({ metricsInterval: 1000 });
    await monitor.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    const metrics = monitor.getMetrics();
    console.log(`   ✅ 系统监控: ${metrics.length}条指标`);
    await monitor.stop();
    results.monitor = true;
  } catch (error) {
    console.log('   ❌ 系统监控测试失败:', (error as Error).message);
  }

  // 5. 错误恢复测试
  try {
    console.log('5. 测试错误恢复...');
    const recovery = new ErrorRecoverySystem();
    await recovery.start();
    await recovery.handleError(
      ErrorType.PERSONALITY_UPDATE_FAILED,
      ErrorSeverity.LOW,
      'test',
      'Test error'
    );
    const errorMetrics = recovery.getMetrics();
    console.log(`   ✅ 错误恢复: ${errorMetrics.totalErrors}个错误`);
    await recovery.stop();
    results.recovery = true;
  } catch (error) {
    console.log('   ❌ 错误恢复测试失败:', (error as Error).message);
  }

  // 6. 资源管理测试
  try {
    console.log('6. 测试资源管理...');
    const resourceManager = new ResourceManager();
    await resourceManager.start();
    const allocation = await resourceManager.allocateMemory({
      component: 'test',
      type: 'temp',
      size: 1024,
      priority: 1
    });
    const resourceMetrics = resourceManager.getMetrics();
    console.log(`   ✅ 资源管理: ${resourceMetrics.totalMemoryAllocated}字节已分配`);
    if (allocation.success && allocation.blockId) {
      await resourceManager.deallocateMemory(allocation.blockId);
    }
    await resourceManager.stop();
    results.resources = true;
  } catch (error) {
    console.log('   ❌ 资源管理测试失败:', (error as Error).message);
  }

  // 7. 综合测试系统测试
  try {
    console.log('7. 测试综合测试系统...');
    const testSystem = new ComprehensiveTestSystem();
    const testRun = await testSystem.runTests([], {
      parallel: false,
      timeout: 1000,
      maxConcurrency: 1
    });
    console.log(`   ✅ 综合测试: ${testRun.summary.total}个测试`);
    results.testing = true;
  } catch (error) {
    console.log('   ❌ 综合测试系统测试失败:', (error as Error).message);
  }

  // 汇总结果
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(Boolean).length;
  const passRate = (passed / total * 100).toFixed(1);

  console.log('\n' + '='.repeat(50));
  console.log('📊 快速验证测试结果');
  console.log('='.repeat(50));
  console.log(`通过: ${passed}/${total} (${passRate}%)`);
  
  if (passed === total) {
    console.log('🎉 所有核心功能正常工作！');
  } else {
    console.log('⚠️  部分功能需要修复');
  }
  
  console.log('='.repeat(50));
}

quickTest().catch(error => {
  console.error('快速测试失败:', error);
  process.exit(1);
});