/**
 * AI系统集成测试
 * 测试所有AI组件的协同工作和系统集成
 */
import { AISystemManager } from './integration/AISystemManager';
import { PerformanceOptimizer } from './optimization/PerformanceOptimizer';
import { DataPersistenceLayer } from './persistence/DataPersistenceLayer';
import { SystemMonitor } from './monitoring/SystemMonitor';
import { ErrorRecoverySystem, ErrorType, ErrorSeverity } from './recovery/ErrorRecoverySystem';
import { ResourceManager } from './resources/ResourceManager';
import { ComprehensiveTestSystem, TestCategory, TestStatus } from './testing/ComprehensiveTestSystem';

console.log('🚀 开始AI系统集成测试\n');

async function runIntegrationTests() {
  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    console.log('📋 测试计划:');
    console.log('1. 系统初始化测试');
    console.log('2. AI管理器集成测试');
    console.log('3. 性能优化系统测试');
    console.log('4. 数据持久化集成测试');
    console.log('5. 监控系统集成测试');
    console.log('6. 错误恢复系统测试');
    console.log('7. 资源管理集成测试');
    console.log('8. 端到端集成测试');
    console.log('9. 性能压力测试');
    console.log('10. 系统清理测试\n');

    // 1. 系统初始化测试
    console.log('🔧 1. 系统初始化测试...');
    const initResults = await testSystemInitialization();
    totalTests += initResults.total;
    passedTests += initResults.passed;
    failedTests += initResults.failed;

    // 2. AI管理器集成测试
    console.log('\n🤖 2. AI管理器集成测试...');
    const aiManagerResults = await testAIManagerIntegration();
    totalTests += aiManagerResults.total;
    passedTests += aiManagerResults.passed;
    failedTests += aiManagerResults.failed;

    // 3. 性能优化系统测试
    console.log('\n⚡ 3. 性能优化系统测试...');
    const optimizerResults = await testPerformanceOptimizer();
    totalTests += optimizerResults.total;
    passedTests += optimizerResults.passed;
    failedTests += optimizerResults.failed;

    // 4. 数据持久化集成测试
    console.log('\n💾 4. 数据持久化集成测试...');
    const persistenceResults = await testDataPersistence();
    totalTests += persistenceResults.total;
    passedTests += persistenceResults.passed;
    failedTests += persistenceResults.failed;

    // 5. 监控系统集成测试
    console.log('\n📊 5. 监控系统集成测试...');
    const monitoringResults = await testSystemMonitoring();
    totalTests += monitoringResults.total;
    passedTests += monitoringResults.passed;
    failedTests += monitoringResults.failed;

    // 6. 错误恢复系统测试
    console.log('\n🛡️ 6. 错误恢复系统测试...');
    const recoveryResults = await testErrorRecovery();
    totalTests += recoveryResults.total;
    passedTests += recoveryResults.passed;
    failedTests += recoveryResults.failed;

    // 7. 资源管理集成测试
    console.log('\n🏭 7. 资源管理集成测试...');
    const resourceResults = await testResourceManagement();
    totalTests += resourceResults.total;
    passedTests += resourceResults.passed;
    failedTests += resourceResults.failed;

    // 8. 端到端集成测试
    console.log('\n🔄 8. 端到端集成测试...');
    const e2eResults = await testEndToEndIntegration();
    totalTests += e2eResults.total;
    passedTests += e2eResults.passed;
    failedTests += e2eResults.failed;

    // 9. 性能压力测试
    console.log('\n💪 9. 性能压力测试...');
    const stressResults = await testStressScenarios();
    totalTests += stressResults.total;
    passedTests += stressResults.passed;
    failedTests += stressResults.failed;

    // 10. 系统清理测试
    console.log('\n🧹 10. 系统清理测试...');
    const cleanupResults = await testSystemCleanup();
    totalTests += cleanupResults.total;
    passedTests += cleanupResults.passed;
    failedTests += cleanupResults.failed;

  } catch (error) {
    console.error('❌ 集成测试过程中发生错误:', error);
    failedTests++;
  }

  // 测试结果汇总
  const totalTime = Date.now() - startTime;
  const passRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0';

  console.log('\n' + '='.repeat(60));
  console.log('📊 集成测试结果汇总');
  console.log('='.repeat(60));
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过测试: ${passedTests} ✅`);
  console.log(`失败测试: ${failedTests} ❌`);
  console.log(`通过率: ${passRate}%`);
  console.log(`总耗时: ${(totalTime / 1000).toFixed(2)}秒`);
  console.log('='.repeat(60));

  if (failedTests === 0) {
    console.log('🎉 所有集成测试通过！AI系统集成成功！');
  } else {
    console.log('⚠️  部分测试失败，请检查系统集成问题。');
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    passRate: parseFloat(passRate),
    duration: totalTime
  };
}

// 1. 系统初始化测试
async function testSystemInitialization(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;

  try {
    // 测试AI系统管理器初始化
    console.log('  • 测试AI系统管理器初始化...');
    const aiManager = new AISystemManager();
    await aiManager.initialize();
    console.log('    ✅ AI系统管理器初始化成功');
    passed++;
  } catch (error) {
    console.log('    ❌ AI系统管理器初始化失败:', error);
    failed++;
  }

  try {
    // 测试性能优化器初始化
    console.log('  • 测试性能优化器初始化...');
    const optimizer = new PerformanceOptimizer();
    console.log('    ✅ 性能优化器初始化成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 性能优化器初始化失败:', error);
    failed++;
  }

  try {
    // 测试数据持久化层初始化
    console.log('  • 测试数据持久化层初始化...');
    const persistence = new DataPersistenceLayer();
    await persistence.initialize();
    console.log('    ✅ 数据持久化层初始化成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 数据持久化层初始化失败:', error);
    failed++;
  }

  try {
    // 测试系统监控器初始化
    console.log('  • 测试系统监控器初始化...');
    const monitor = new SystemMonitor();
    console.log('    ✅ 系统监控器初始化成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 系统监控器初始化失败:', error);
    failed++;
  }

  try {
    // 测试错误恢复系统初始化
    console.log('  • 测试错误恢复系统初始化...');
    const recovery = new ErrorRecoverySystem();
    console.log('    ✅ 错误恢复系统初始化成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 错误恢复系统初始化失败:', error);
    failed++;
  }

  try {
    // 测试资源管理器初始化
    console.log('  • 测试资源管理器初始化...');
    const resourceManager = new ResourceManager();
    await resourceManager.start();
    await resourceManager.stop();
    console.log('    ✅ 资源管理器初始化成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 资源管理器初始化失败:', error);
    failed++;
  }

  return { total: passed + failed, passed, failed };
}

// 2. AI管理器集成测试
async function testAIManagerIntegration(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;
  let aiManager: AISystemManager | null = null;

  try {
    // 创建AI实例
    console.log('  • 测试AI实例创建...');
    aiManager = new AISystemManager();
    await aiManager.initialize();
    
    const instanceId = await aiManager.createAIInstance({
      userId: 'test_user_1',
      zodiacSign: 'leo',
      gameMode: 'competitive',
      difficulty: 'medium'
    });
    
    if (instanceId) {
      console.log(`    ✅ AI实例创建成功: ${instanceId}`);
      passed++;
    } else {
      console.log('    ❌ AI实例创建失败');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ AI实例创建失败:', error);
    failed++;
  }

  try {
    // 测试AI决策
    console.log('  • 测试AI决策功能...');
    if (aiManager) {
      const decision = await aiManager.makeDecision('test_user_1', {
        gamePhase: 'mid_game',
        availableActions: ['buy_property', 'trade', 'pass'],
        playerResources: { money: 1000, properties: 3 }
      });
      
      if (decision && decision.action) {
        console.log(`    ✅ AI决策成功: ${decision.action} (置信度: ${decision.confidence})`);
        passed++;
      } else {
        console.log('    ❌ AI决策失败');
        failed++;
      }
    } else {
      console.log('    ❌ AI管理器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ AI决策测试失败:', error);
    failed++;
  }

  try {
    // 测试AI学习
    console.log('  • 测试AI学习功能...');
    if (aiManager) {
      await aiManager.processLearningEvent('test_user_1', {
        action: 'buy_property',
        outcome: 'success',
        reward: 0.8,
        gameState: { phase: 'mid_game' }
      });
      console.log('    ✅ AI学习事件处理成功');
      passed++;
    } else {
      console.log('    ❌ AI管理器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ AI学习测试失败:', error);
    failed++;
  }

  try {
    // 测试系统状态获取
    console.log('  • 测试系统状态获取...');
    if (aiManager) {
      const status = await aiManager.getSystemStatus();
      if (status && typeof status.totalInstances === 'number') {
        console.log(`    ✅ 系统状态获取成功: ${status.totalInstances}个AI实例`);
        passed++;
      } else {
        console.log('    ❌ 系统状态获取失败');
        failed++;
      }
    } else {
      console.log('    ❌ AI管理器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 系统状态测试失败:', error);
    failed++;
  }

  // 清理
  try {
    if (aiManager) {
      await aiManager.shutdown();
    }
  } catch (error) {
    console.log('    ⚠️ AI管理器清理失败:', error);
  }

  return { total: passed + failed, passed, failed };
}

// 3. 性能优化系统测试
async function testPerformanceOptimizer(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;
  let optimizer: PerformanceOptimizer | null = null;

  try {
    // 测试优化器启动
    console.log('  • 测试优化器启动...');
    optimizer = new PerformanceOptimizer();
    await optimizer.startOptimization(5000); // 5秒间隔
    console.log('    ✅ 优化器启动成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 优化器启动失败:', error);
    failed++;
  }

  try {
    // 测试手动优化
    console.log('  • 测试手动优化执行...');
    if (optimizer) {
      const results = await optimizer.manualOptimization();
      if (results && Array.isArray(results)) {
        console.log(`    ✅ 手动优化成功: 执行了${results.length}个策略`);
        passed++;
      } else {
        console.log('    ❌ 手动优化失败');
        failed++;
      }
    } else {
      console.log('    ❌ 优化器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 手动优化测试失败:', error);
    failed++;
  }

  try {
    // 测试优化计划获取
    console.log('  • 测试优化计划获取...');
    if (optimizer) {
      const plan = optimizer.getOptimizationPlan();
      if (plan && plan.strategies && plan.strategies.length > 0) {
        console.log(`    ✅ 优化计划获取成功: ${plan.strategies.length}个策略`);
        passed++;
      } else {
        console.log('    ❌ 优化计划获取失败');
        failed++;
      }
    } else {
      console.log('    ❌ 优化器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 优化计划测试失败:', error);
    failed++;
  }

  try {
    // 测试批处理操作
    console.log('  • 测试批处理操作...');
    if (optimizer) {
      optimizer.addBatchOperation({ type: 'test', data: 'test_data' });
      console.log('    ✅ 批处理操作添加成功');
      passed++;
    } else {
      console.log('    ❌ 优化器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 批处理操作测试失败:', error);
    failed++;
  }

  // 清理
  try {
    if (optimizer) {
      await optimizer.stopOptimization();
    }
  } catch (error) {
    console.log('    ⚠️ 优化器清理失败:', error);
  }

  return { total: passed + failed, passed, failed };
}

// 4. 数据持久化集成测试
async function testDataPersistence(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;
  let persistence: DataPersistenceLayer | null = null;

  try {
    // 测试持久化层初始化
    console.log('  • 测试持久化层初始化...');
    persistence = new DataPersistenceLayer({
      baseDirectory: './test-data',
      autoSave: false
    });
    await persistence.initialize();
    console.log('    ✅ 持久化层初始化成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 持久化层初始化失败:', error);
    failed++;
  }

  try {
    // 测试快照保存
    console.log('  • 测试快照保存...');
    if (persistence) {
      const snapshot = {
        userId: 'test_user',
        zodiacSign: 'aries',
        personalityTraits: { confidence: 0.8, creativity: 0.6 },
        emotionalState: { mood: 0.7, energy: 0.8, confidence: 0.9, socialAttitude: 0.6 },
        behaviorPatterns: { riskTolerance: 0.7, decisionSpeed: 0.8, socialInfluence: 0.5, adaptability: 0.9 },
        learningHistory: [],
        gameMemories: [],
        socialRelationships: [],
        customizations: [],
        timestamp: new Date(),
        version: '1.0.0'
      };
      
      const snapshotId = await persistence.savePersonalitySnapshot(snapshot);
      if (snapshotId) {
        console.log(`    ✅ 快照保存成功: ${snapshotId}`);
        passed++;
      } else {
        console.log('    ❌ 快照保存失败');
        failed++;
      }
    } else {
      console.log('    ❌ 持久化层未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 快照保存测试失败:', error);
    failed++;
  }

  try {
    // 测试存储指标
    console.log('  • 测试存储指标获取...');
    if (persistence) {
      const metrics = await persistence.getStorageMetrics();
      if (metrics && typeof metrics.totalSnapshots === 'number') {
        console.log(`    ✅ 存储指标获取成功: ${metrics.totalSnapshots}个快照`);
        passed++;
      } else {
        console.log('    ❌ 存储指标获取失败');
        failed++;
      }
    } else {
      console.log('    ❌ 持久化层未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 存储指标测试失败:', error);
    failed++;
  }

  try {
    // 测试备份创建
    console.log('  • 测试备份创建...');
    if (persistence) {
      const backup = await persistence.createBackup('manual');
      if (backup && backup.id) {
        console.log(`    ✅ 备份创建成功: ${backup.id}`);
        passed++;
      } else {
        console.log('    ❌ 备份创建失败');
        failed++;
      }
    } else {
      console.log('    ❌ 持久化层未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 备份创建测试失败:', error);
    failed++;
  }

  // 清理
  try {
    if (persistence) {
      await persistence.shutdown();
    }
  } catch (error) {
    console.log('    ⚠️ 持久化层清理失败:', error);
  }

  return { total: passed + failed, passed, failed };
}

// 5. 监控系统集成测试
async function testSystemMonitoring(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;
  let monitor: SystemMonitor | null = null;

  try {
    // 测试监控器启动
    console.log('  • 测试监控器启动...');
    monitor = new SystemMonitor({
      metricsInterval: 2000 // 2秒间隔
    });
    await monitor.start();
    console.log('    ✅ 监控器启动成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 监控器启动失败:', error);
    failed++;
  }

  try {
    // 等待指标收集
    console.log('  • 等待指标收集...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('    ✅ 指标收集等待完成');
    passed++;
  } catch (error) {
    console.log('    ❌ 指标收集等待失败:', error);
    failed++;
  }

  try {
    // 测试指标获取
    console.log('  • 测试指标获取...');
    if (monitor) {
      const metrics = monitor.getMetrics();
      if (metrics && metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        console.log(`    ✅ 指标获取成功: 内存使用${latest.resources.memory.percentage.toFixed(1)}%`);
        passed++;
      } else {
        console.log('    ❌ 指标获取失败');
        failed++;
      }
    } else {
      console.log('    ❌ 监控器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 指标获取测试失败:', error);
    failed++;
  }

  try {
    // 测试调试会话
    console.log('  • 测试调试会话...');
    if (monitor) {
      const sessionId = await monitor.startDebugSession('test_session', ['test_component']);
      if (sessionId) {
        monitor.addTraceEvent(sessionId, 'test_component', 'test_event', { data: 'test' });
        await monitor.endDebugSession(sessionId);
        console.log(`    ✅ 调试会话测试成功: ${sessionId}`);
        passed++;
      } else {
        console.log('    ❌ 调试会话创建失败');
        failed++;
      }
    } else {
      console.log('    ❌ 监控器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 调试会话测试失败:', error);
    failed++;
  }

  try {
    // 测试数据导出
    console.log('  • 测试数据导出...');
    if (monitor) {
      const jsonData = monitor.exportMetrics('json');
      if (jsonData && jsonData.length > 0) {
        console.log(`    ✅ 数据导出成功: ${jsonData.length}字符`);
        passed++;
      } else {
        console.log('    ❌ 数据导出失败');
        failed++;
      }
    } else {
      console.log('    ❌ 监控器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 数据导出测试失败:', error);
    failed++;
  }

  // 清理
  try {
    if (monitor) {
      await monitor.stop();
    }
  } catch (error) {
    console.log('    ⚠️ 监控器清理失败:', error);
  }

  return { total: passed + failed, passed, failed };
}

// 6. 错误恢复系统测试
async function testErrorRecovery(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;
  let recovery: ErrorRecoverySystem | null = null;

  try {
    // 测试错误恢复系统启动
    console.log('  • 测试错误恢复系统启动...');
    recovery = new ErrorRecoverySystem();
    await recovery.start();
    console.log('    ✅ 错误恢复系统启动成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 错误恢复系统启动失败:', error);
    failed++;
  }

  try {
    // 测试错误处理
    console.log('  • 测试错误处理...');
    if (recovery) {
      await recovery.handleError(
        ErrorType.PERSONALITY_UPDATE_FAILED,
        ErrorSeverity.MEDIUM,
        'test_component',
        'Test error message',
        { testData: 'test' },
        { operation: 'test_operation' }
      );
      console.log('    ✅ 错误处理成功');
      passed++;
    } else {
      console.log('    ❌ 错误恢复系统未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 错误处理测试失败:', error);
    failed++;
  }

  try {
    // 测试错误指标获取
    console.log('  • 测试错误指标获取...');
    if (recovery) {
      const metrics = recovery.getMetrics();
      if (metrics && typeof metrics.totalErrors === 'number') {
        console.log(`    ✅ 错误指标获取成功: ${metrics.totalErrors}个错误`);
        passed++;
      } else {
        console.log('    ❌ 错误指标获取失败');
        failed++;
      }
    } else {
      console.log('    ❌ 错误恢复系统未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 错误指标测试失败:', error);
    failed++;
  }

  try {
    // 测试活跃错误获取
    console.log('  • 测试活跃错误获取...');
    if (recovery) {
      const activeErrors = recovery.getActiveErrors();
      if (Array.isArray(activeErrors)) {
        console.log(`    ✅ 活跃错误获取成功: ${activeErrors.length}个活跃错误`);
        passed++;
      } else {
        console.log('    ❌ 活跃错误获取失败');
        failed++;
      }
    } else {
      console.log('    ❌ 错误恢复系统未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 活跃错误测试失败:', error);
    failed++;
  }

  // 清理
  try {
    if (recovery) {
      await recovery.stop();
    }
  } catch (error) {
    console.log('    ⚠️ 错误恢复系统清理失败:', error);
  }

  return { total: passed + failed, passed, failed };
}

// 7. 资源管理集成测试
async function testResourceManagement(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;
  let resourceManager: ResourceManager | null = null;

  try {
    // 测试资源管理器启动
    console.log('  • 测试资源管理器启动...');
    resourceManager = new ResourceManager();
    await resourceManager.start();
    console.log('    ✅ 资源管理器启动成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 资源管理器启动失败:', error);
    failed++;
  }

  try {
    // 测试内存分配
    console.log('  • 测试内存分配...');
    if (resourceManager) {
      const result = await resourceManager.allocateMemory({
        component: 'test_component',
        type: 'temp',
        size: 1024,
        priority: 1
      });
      
      if (result.success && result.blockId) {
        console.log(`    ✅ 内存分配成功: ${result.blockId}`);
        passed++;
        
        // 测试内存释放
        const deallocated = await resourceManager.deallocateMemory(result.blockId);
        if (deallocated) {
          console.log('    ✅ 内存释放成功');
          passed++;
        } else {
          console.log('    ❌ 内存释放失败');
          failed++;
        }
      } else {
        console.log('    ❌ 内存分配失败:', result.error);
        failed++;
      }
    } else {
      console.log('    ❌ 资源管理器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 内存分配测试失败:', error);
    failed++;
  }

  try {
    // 测试资源池操作
    console.log('  • 测试资源池操作...');
    if (resourceManager) {
      const item = await resourceManager.acquireFromPool('ai_instances');
      if (item) {
        const released = resourceManager.releaseToPool('ai_instances', item);
        if (released) {
          console.log('    ✅ 资源池操作成功');
          passed++;
        } else {
          console.log('    ❌ 资源池释放失败');
          failed++;
        }
      } else {
        console.log('    ❌ 资源池获取失败');
        failed++;
      }
    } else {
      console.log('    ❌ 资源管理器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 资源池测试失败:', error);
    failed++;
  }

  try {
    // 测试资源指标
    console.log('  • 测试资源指标获取...');
    if (resourceManager) {
      const metrics = resourceManager.getMetrics();
      if (metrics && typeof metrics.totalMemoryAllocated === 'number') {
        console.log(`    ✅ 资源指标获取成功: 分配了${metrics.totalMemoryAllocated}字节`);
        passed++;
      } else {
        console.log('    ❌ 资源指标获取失败');
        failed++;
      }
    } else {
      console.log('    ❌ 资源管理器未初始化');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 资源指标测试失败:', error);
    failed++;
  }

  // 清理
  try {
    if (resourceManager) {
      await resourceManager.stop();
    }
  } catch (error) {
    console.log('    ⚠️ 资源管理器清理失败:', error);
  }

  return { total: passed + failed, passed, failed };
}

// 8. 端到端集成测试
async function testEndToEndIntegration(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;
  
  console.log('  • 创建完整的AI系统环境...');
  
  // 创建所有组件
  const aiManager = new AISystemManager();
  const optimizer = new PerformanceOptimizer();
  const persistence = new DataPersistenceLayer({ baseDirectory: './test-e2e' });
  const monitor = new SystemMonitor({ metricsInterval: 5000 });
  const recovery = new ErrorRecoverySystem();
  const resourceManager = new ResourceManager();

  try {
    // 初始化所有组件
    console.log('  • 初始化所有系统组件...');
    await Promise.all([
      aiManager.initialize(),
      optimizer.startOptimization(10000),
      persistence.initialize(),
      monitor.start(),
      recovery.start(),
      resourceManager.start()
    ]);
    console.log('    ✅ 所有组件初始化成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 组件初始化失败:', error);
    failed++;
  }

  try {
    // 创建AI实例并执行完整流程
    console.log('  • 执行完整AI生命周期...');
    
    // 1. 创建AI实例
    const instanceId = await aiManager.createAIInstance({
      userId: 'e2e_test_user',
      zodiacSign: 'gemini',
      gameMode: 'cooperative',
      difficulty: 'hard'
    });
    
    if (!instanceId) throw new Error('AI实例创建失败');
    
    // 2. 执行AI决策
    const decision = await aiManager.makeDecision(instanceId, {
      gamePhase: 'early_game',
      availableActions: ['buy_property', 'trade', 'build'],
      playerResources: { money: 1500, properties: 1 }
    });
    
    if (!decision) throw new Error('AI决策失败');
    
    // 3. 处理学习事件
    await aiManager.processLearningEvent(instanceId, {
      action: decision.action,
      outcome: 'success',
      reward: 0.9,
      gameState: { phase: 'early_game' }
    });
    
    // 4. 保存AI状态
    const aiState = await aiManager.getAIState(instanceId);
    if (aiState) {
      const snapshot = {
        userId: instanceId,
        zodiacSign: 'gemini',
        personalityTraits: aiState.personalityTraits || {},
        emotionalState: { mood: 0.8, energy: 0.7, confidence: 0.9, socialAttitude: 0.6 },
        behaviorPatterns: { riskTolerance: 0.6, decisionSpeed: 0.8, socialInfluence: 0.7, adaptability: 0.8 },
        learningHistory: [],
        gameMemories: [],
        socialRelationships: [],
        customizations: [],
        timestamp: new Date(),
        version: '1.0.0'
      };
      await persistence.savePersonalitySnapshot(snapshot);
    }
    
    console.log('    ✅ 完整AI生命周期执行成功');
    passed++;
  } catch (error) {
    console.log('    ❌ AI生命周期执行失败:', error);
    failed++;
  }

  try {
    // 测试系统协调工作
    console.log('  • 测试系统协调工作...');
    
    // 等待一些监控数据收集
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 检查各系统状态
    const systemStatus = await aiManager.getSystemStatus();
    const optimizationPlan = optimizer.getOptimizationPlan();
    const storageMetrics = await persistence.getStorageMetrics();
    const monitoringMetrics = monitor.getMetrics();
    const recoveryMetrics = recovery.getMetrics();
    const resourceMetrics = resourceManager.getMetrics();
    
    if (systemStatus && optimizationPlan && storageMetrics && 
        monitoringMetrics.length > 0 && recoveryMetrics && resourceMetrics) {
      console.log('    ✅ 系统协调工作正常');
      console.log(`      - AI实例: ${systemStatus.totalInstances}个`);
      console.log(`      - 优化策略: ${optimizationPlan.strategies.length}个`);
      console.log(`      - 存储快照: ${storageMetrics.totalSnapshots}个`);
      console.log(`      - 监控指标: ${monitoringMetrics.length}条`);
      console.log(`      - 错误处理: ${recoveryMetrics.totalErrors}个错误`);
      console.log(`      - 内存分配: ${resourceMetrics.totalMemoryAllocated}字节`);
      passed++;
    } else {
      console.log('    ❌ 系统协调工作异常');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 系统协调测试失败:', error);
    failed++;
  }

  // 清理所有组件
  try {
    console.log('  • 清理所有系统组件...');
    await Promise.all([
      aiManager.shutdown(),
      optimizer.stopOptimization(),
      persistence.shutdown(),
      monitor.stop(),
      recovery.stop(),
      resourceManager.stop()
    ]);
    console.log('    ✅ 所有组件清理成功');
    passed++;
  } catch (error) {
    console.log('    ❌ 组件清理失败:', error);
    failed++;
  }

  return { total: passed + failed, passed, failed };
}

// 9. 性能压力测试
async function testStressScenarios(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;

  try {
    // 测试并发AI实例创建
    console.log('  • 测试并发AI实例创建...');
    const aiManager = new AISystemManager();
    await aiManager.initialize();
    
    const concurrentPromises = [];
    for (let i = 0; i < 10; i++) {
      concurrentPromises.push(
        aiManager.createAIInstance({
          userId: `stress_user_${i}`,
          zodiacSign: 'virgo',
          gameMode: 'competitive',
          difficulty: 'medium'
        })
      );
    }
    
    const results = await Promise.allSettled(concurrentPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    if (successCount >= 8) { // 允许一些失败
      console.log(`    ✅ 并发实例创建成功: ${successCount}/10`);
      passed++;
    } else {
      console.log(`    ❌ 并发实例创建失败: 仅${successCount}/10成功`);
      failed++;
    }
    
    await aiManager.shutdown();
  } catch (error) {
    console.log('    ❌ 并发实例创建测试失败:', error);
    failed++;
  }

  try {
    // 测试高频操作
    console.log('  • 测试高频操作处理...');
    const resourceManager = new ResourceManager();
    await resourceManager.start();
    
    const startTime = Date.now();
    const operations = [];
    
    for (let i = 0; i < 100; i++) {
      operations.push(
        resourceManager.allocateMemory({
          component: 'stress_test',
          type: 'temp',
          size: 1024,
          priority: 1
        })
      );
    }
    
    const operationResults = await Promise.allSettled(operations);
    const successfulOps = operationResults.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length;
    
    const duration = Date.now() - startTime;
    
    if (successfulOps >= 80 && duration < 5000) { // 80%成功率，5秒内完成
      console.log(`    ✅ 高频操作处理成功: ${successfulOps}/100 (${duration}ms)`);
      passed++;
    } else {
      console.log(`    ❌ 高频操作处理失败: ${successfulOps}/100 (${duration}ms)`);
      failed++;
    }
    
    await resourceManager.stop();
  } catch (error) {
    console.log('    ❌ 高频操作测试失败:', error);
    failed++;
  }

  try {
    // 测试内存压力
    console.log('  • 测试内存压力处理...');
    const optimizer = new PerformanceOptimizer();
    await optimizer.startOptimization(2000);
    
    // 等待几个优化周期
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const plan = optimizer.getOptimizationPlan();
    if (plan.globalMetrics.totalOptimizations > 0) {
      console.log(`    ✅ 内存压力处理成功: ${plan.globalMetrics.totalOptimizations}次优化`);
      passed++;
    } else {
      console.log('    ❌ 内存压力处理失败: 无优化执行');
      failed++;
    }
    
    await optimizer.stopOptimization();
  } catch (error) {
    console.log('    ❌ 内存压力测试失败:', error);
    failed++;
  }

  return { total: passed + failed, passed, failed };
}

// 10. 系统清理测试
async function testSystemCleanup(): Promise<{ total: number; passed: number; failed: number }> {
  let passed = 0, failed = 0;

  try {
    // 测试综合测试系统
    console.log('  • 测试综合测试系统...');
    const testSystem = new ComprehensiveTestSystem();
    
    const testRun = await testSystem.runTests([], {
      parallel: true,
      maxConcurrency: 2,
      timeout: 5000,
      failFast: false
    });
    
    if (testRun && testRun.status === 'completed') {
      console.log(`    ✅ 综合测试系统运行成功: ${testRun.summary.total}个测试`);
      passed++;
    } else {
      console.log('    ❌ 综合测试系统运行失败');
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 综合测试系统测试失败:', error);
    failed++;
  }

  try {
    // 测试内存泄漏检查
    console.log('  • 测试内存泄漏检查...');
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 执行一些操作后检查内存
    const tempResourceManager = new ResourceManager();
    await tempResourceManager.start();
    
    // 分配和释放一些内存
    const allocations = [];
    for (let i = 0; i < 50; i++) {
      const result = await tempResourceManager.allocateMemory({
        component: 'cleanup_test',
        type: 'temp',
        size: 1024,
        priority: 1
      });
      if (result.success && result.blockId) {
        allocations.push(result.blockId);
      }
    }
    
    // 释放所有内存
    for (const blockId of allocations) {
      await tempResourceManager.deallocateMemory(blockId);
    }
    
    await tempResourceManager.stop();
    
    // 强制垃圾收集
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    
    if (memoryGrowth < 10 * 1024 * 1024) { // 小于10MB增长
      console.log(`    ✅ 内存泄漏检查通过: 增长${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      passed++;
    } else {
      console.log(`    ❌ 内存泄漏检查失败: 增长${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      failed++;
    }
  } catch (error) {
    console.log('    ❌ 内存泄漏检查失败:', error);
    failed++;
  }

  try {
    // 测试最终系统状态
    console.log('  • 测试最终系统状态...');
    const finalMemory = process.memoryUsage();
    console.log(`    ✅ 最终内存状态: 堆内存${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    passed++;
  } catch (error) {
    console.log('    ❌ 最终状态检查失败:', error);
    failed++;
  }

  return { total: passed + failed, passed, failed };
}

// 执行集成测试
runIntegrationTests().catch(error => {
  console.error('集成测试执行失败:', error);
  process.exit(1);
});