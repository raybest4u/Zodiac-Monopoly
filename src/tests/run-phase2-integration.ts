#!/usr/bin/env node

/**
 * 第二阶段集成测试运行器
 * Phase 2 Integration Test Runner
 */

import { runPhase2IntegrationTests } from './Phase2IntegrationTest';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🎮 Zodiac Monopoly 第二阶段功能集成测试');
  console.log('================================================');
  console.log('测试范围:');
  console.log('• 游戏引擎集成');
  console.log('• 十二生肖技能系统');
  console.log('• AI决策优化');
  console.log('• 智能事件系统');
  console.log('• 游戏平衡系统');
  console.log('• 难度曲线调整');
  console.log('• 性能优化系统');
  console.log('• 跨系统交互');
  console.log('• 压力测试');
  console.log('================================================\n');

  const startTime = Date.now();

  try {
    // 运行集成测试
    const report = await runPhase2IntegrationTests();
    
    const totalTime = Date.now() - startTime;
    
    // 打印测试结果摘要
    console.log('\n📊 测试结果摘要');
    console.log('================================================');
    console.log(`总测试数量: ${report.totalTests}`);
    console.log(`通过测试: ${report.passedTests} ✅`);
    console.log(`失败测试: ${report.failedTests} ${report.failedTests > 0 ? '❌' : ''}`);
    console.log(`成功率: ${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`);
    console.log(`总耗时: ${totalTime}ms`);
    console.log(`平均测试时间: ${Math.round(report.totalDuration / report.totalTests)}ms`);
    
    // 性能健康状况
    console.log('\n🏥 系统健康状况');
    console.log('================================================');
    console.log(`整体健康: ${getHealthEmoji(report.systemHealth.overall)} ${report.systemHealth.overall}`);
    console.log(`性能评分: ${report.systemHealth.score}/100`);
    console.log(`内存状况: ${getHealthEmoji(report.systemHealth.memory)} ${report.systemHealth.memory}`);
    console.log(`处理性能: ${getHealthEmoji(report.systemHealth.processing)} ${report.systemHealth.processing}`);
    console.log(`缓存效率: ${getHealthEmoji(report.systemHealth.caching)} ${report.systemHealth.caching}`);
    console.log(`并发状况: ${getHealthEmoji(report.systemHealth.concurrency)} ${report.systemHealth.concurrency}`);

    // 详细测试结果
    if (report.failedTests > 0) {
      console.log('\n❌ 失败测试详情');
      console.log('================================================');
      report.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`• ${result.testName}`);
          console.log(`  错误: ${result.details}`);
          console.log(`  耗时: ${result.duration}ms\n`);
        });
    }

    // 性能指标
    console.log('\n⚡ 性能指标');
    console.log('================================================');
    const perfMetrics = report.performanceMetrics;
    if (perfMetrics.monitoring?.profile?.summary) {
      const summary = perfMetrics.monitoring.profile.summary;
      console.log(`平均帧率: ${summary.avgFrameRate.toFixed(1)} fps`);
      console.log(`平均内存使用: ${summary.avgMemoryUsage.toFixed(1)} MB`);
      console.log(`平均CPU使用: ${summary.avgCpuUsage.toFixed(1)}%`);
      console.log(`告警总数: ${summary.totalAlerts}`);
      console.log(`关键告警: ${summary.criticalAlerts}`);
    }

    // 缓存性能
    if (perfMetrics.caching?.report?.globalStats) {
      const cacheStats = perfMetrics.caching.report.globalStats;
      console.log(`全局缓存命中率: ${cacheStats.globalHitRate?.toFixed(1) || 'N/A'}%`);
      console.log(`缓存请求总数: ${cacheStats.totalRequests || 'N/A'}`);
      console.log(`缓存命中数: ${cacheStats.totalHits || 'N/A'}`);
    }

    // 生成JSON报告
    const reportPath = path.join(__dirname, '../../reports/phase2-integration-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const jsonReport = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      testType: 'Phase2Integration',
      summary: {
        totalTests: report.totalTests,
        passedTests: report.passedTests,
        failedTests: report.failedTests,
        successRate: (report.passedTests / report.totalTests) * 100,
        totalDuration: totalTime,
        averageTestTime: report.totalDuration / report.totalTests
      },
      systemHealth: report.systemHealth,
      performanceMetrics: report.performanceMetrics,
      testResults: report.results,
      recommendations: generateRecommendations(report)
    };

    fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2));
    console.log(`\n📋 详细报告已保存至: ${reportPath}`);

    // 生成HTML报告
    generateHTMLReport(jsonReport, reportDir);

    // 结论
    console.log('\n🎯 测试结论');
    console.log('================================================');
    
    if (report.failedTests === 0) {
      console.log('🎉 所有测试通过！第二阶段功能集成完美！');
      console.log('✨ 系统已准备好进入生产环境');
    } else if (report.failedTests <= 2) {
      console.log('⚠️  大部分测试通过，有少量问题需要关注');
      console.log('🔧 建议修复失败的测试后再部署');
    } else {
      console.log('🚨 多个测试失败，需要重点关注系统稳定性');
      console.log('🛠️  建议优先修复关键问题');
    }

    // 推荐优化建议
    const recommendations = generateRecommendations(report);
    if (recommendations.length > 0) {
      console.log('\n💡 优化建议');
      console.log('================================================');
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    process.exit(report.failedTests > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n💥 测试运行失败:', error);
    process.exit(1);
  }
}

function getHealthEmoji(status: string): string {
  switch (status) {
    case 'excellent': return '🟢';
    case 'good': return '🟢';
    case 'warning': return '🟡';
    case 'critical': return '🔴';
    default: return '⚪';
  }
}

function generateRecommendations(report: any): string[] {
  const recommendations: string[] = [];
  
  // 基于测试结果的建议
  if (report.failedTests > 0) {
    recommendations.push('优先修复失败的测试用例，确保系统稳定性');
  }
  
  if (report.systemHealth.score < 80) {
    recommendations.push('系统性能需要优化，建议运行性能调优');
  }
  
  if (report.systemHealth.memory === 'warning' || report.systemHealth.memory === 'critical') {
    recommendations.push('内存使用率偏高，建议启用内存优化策略');
  }
  
  // 基于缓存性能的建议
  const cacheHitRate = report.performanceMetrics?.caching?.report?.globalStats?.globalHitRate || 0;
  if (cacheHitRate < 70) {
    recommendations.push('缓存命中率较低，建议调整缓存策略和大小');
  }
  
  // 基于测试耗时的建议
  const avgTestTime = report.summary?.averageTestTime || 0;
  if (avgTestTime > 1000) {
    recommendations.push('平均测试时间较长，建议优化测试性能');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('系统运行良好，保持当前配置');
  }
  
  return recommendations;
}

function generateHTMLReport(jsonReport: any, reportDir: string): void {
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zodiac Monopoly 第二阶段集成测试报告</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { padding: 30px; }
        .metric-card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 10px; text-align: center; border-left: 4px solid #007bff; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .danger { border-left-color: #dc3545; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .test-result { padding: 10px; margin: 5px 0; border-radius: 5px; }
        .test-passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .chart-container { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .recommendation { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Zodiac Monopoly</h1>
            <h2>第二阶段功能集成测试报告</h2>
            <p>生成时间: ${jsonReport.timestamp}</p>
        </div>
        
        <div class="content">
            <div class="metrics-grid">
                <div class="metric-card ${jsonReport.summary.successRate === 100 ? 'success' : jsonReport.summary.successRate > 80 ? 'warning' : 'danger'}">
                    <h3>测试成功率</h3>
                    <div style="font-size: 2em; font-weight: bold;">${jsonReport.summary.successRate.toFixed(1)}%</div>
                    <p>${jsonReport.summary.passedTests}/${jsonReport.summary.totalTests} 通过</p>
                </div>
                
                <div class="metric-card ${jsonReport.systemHealth.score > 80 ? 'success' : jsonReport.systemHealth.score > 60 ? 'warning' : 'danger'}">
                    <h3>系统健康评分</h3>
                    <div style="font-size: 2em; font-weight: bold;">${jsonReport.systemHealth.score}/100</div>
                    <p>整体状况: ${jsonReport.systemHealth.overall}</p>
                </div>
                
                <div class="metric-card">
                    <h3>测试耗时</h3>
                    <div style="font-size: 2em; font-weight: bold;">${(jsonReport.summary.totalDuration / 1000).toFixed(1)}s</div>
                    <p>平均: ${jsonReport.summary.averageTestTime.toFixed(0)}ms/测试</p>
                </div>
            </div>

            <h2>🧪 测试结果详情</h2>
            <div class="test-results">
                ${jsonReport.testResults.map((test: any) => `
                    <div class="test-result ${test.passed ? 'test-passed' : 'test-failed'}">
                        <strong>${test.passed ? '✅' : '❌'} ${test.testName}</strong>
                        <span style="float: right;">${test.duration}ms</span>
                        ${test.details ? `<div style="margin-top: 5px; font-size: 0.9em;">${test.details}</div>` : ''}
                    </div>
                `).join('')}
            </div>

            <h2>🏥 系统健康状况</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>内存状况</h4>
                    <p>${jsonReport.systemHealth.memory}</p>
                </div>
                <div class="metric-card">
                    <h4>处理性能</h4>
                    <p>${jsonReport.systemHealth.processing}</p>
                </div>
                <div class="metric-card">
                    <h4>缓存效率</h4>
                    <p>${jsonReport.systemHealth.caching}</p>
                </div>
                <div class="metric-card">
                    <h4>并发处理</h4>
                    <p>${jsonReport.systemHealth.concurrency}</p>
                </div>
            </div>

            ${jsonReport.recommendations.length > 0 ? `
            <h2>💡 优化建议</h2>
            ${jsonReport.recommendations.map((rec: string) => `
                <div class="recommendation">
                    ${rec}
                </div>
            `).join('')}
            ` : ''}
        </div>
    </div>
</body>
</html>`;

  const htmlPath = path.join(reportDir, 'phase2-integration-report.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`📊 HTML报告已生成: ${htmlPath}`);
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}