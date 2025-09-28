/**
 * 集成测试执行脚本
 * 执行全面的集成测试并生成详细报告
 */

import { ComprehensiveIntegrationTest, ComprehensiveTestReport } from './ComprehensiveIntegrationTest';
import { writeFileSync } from 'fs';
import { join } from 'path';

class TestReportGenerator {
  /**
   * 生成HTML测试报告
   */
  static generateHTMLReport(report: ComprehensiveTestReport): string {
    const { summary, suites, systemMetrics } = report;
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>十二生肖大富翁 - 集成测试报告</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6; color: #333; background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem;
            text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        
        .summary { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem; margin-bottom: 2rem;
        }
        .summary-card { 
            background: white; padding: 1.5rem; border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center;
        }
        .summary-card h3 { color: #555; margin-bottom: 0.5rem; }
        .summary-card .value { 
            font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem;
        }
        .success { color: #27ae60; }
        .warning { color: #f39c12; }
        .error { color: #e74c3c; }
        .info { color: #3498db; }
        
        .metrics { 
            background: white; padding: 1.5rem; border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 2rem;
        }
        .metrics h2 { margin-bottom: 1rem; color: #2c3e50; }
        .metrics-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        .metric-item { 
            padding: 1rem; background: #f8f9fa; border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        .metric-item .label { font-weight: bold; color: #555; }
        .metric-item .value { font-size: 1.2rem; color: #2c3e50; }
        
        .suites { display: grid; gap: 1.5rem; }
        .suite { 
            background: white; border-radius: 10px; overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .suite-header { 
            padding: 1rem 1.5rem; background: #ecf0f1;
            border-bottom: 1px solid #bdc3c7;
        }
        .suite-header h3 { 
            display: flex; justify-content: space-between; align-items: center;
        }
        .suite-status { 
            padding: 0.25rem 0.75rem; border-radius: 20px;
            font-size: 0.85rem; font-weight: bold;
        }
        .suite-status.passed { background: #d5f4e6; color: #27ae60; }
        .suite-status.failed { background: #ffeaea; color: #e74c3c; }
        
        .test-list { padding: 0; }
        .test-item { 
            display: flex; justify-content: space-between; align-items: center;
            padding: 0.75rem 1.5rem; border-bottom: 1px solid #ecf0f1;
        }
        .test-item:last-child { border-bottom: none; }
        .test-name { flex: 1; }
        .test-status { 
            display: flex; align-items: center; gap: 0.5rem;
            font-size: 0.9rem;
        }
        .test-icon { width: 16px; height: 16px; }
        .test-duration { color: #7f8c8d; font-size: 0.85rem; }
        
        .issues { margin-top: 2rem; }
        .issue-section { 
            background: white; padding: 1.5rem; border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 1rem;
        }
        .issue-section h3 { margin-bottom: 1rem; }
        .issue-list { list-style: none; }
        .issue-list li { 
            padding: 0.5rem 0; border-bottom: 1px solid #ecf0f1;
            display: flex; align-items: center; gap: 0.5rem;
        }
        .issue-list li:last-child { border-bottom: none; }
        .issue-icon { width: 16px; height: 16px; }
        
        .progress-bar { 
            width: 100%; height: 8px; background: #ecf0f1;
            border-radius: 4px; overflow: hidden;
        }
        .progress-fill { 
            height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71);
            transition: width 0.3s ease;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 2rem; }
            .summary { grid-template-columns: 1fr; }
            .metrics-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 十二生肖大富翁</h1>
            <p>集成测试报告 - ${new Date().toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>总体成功率</h3>
                <div class="value ${summary.successRate >= 0.9 ? 'success' : summary.successRate >= 0.7 ? 'warning' : 'error'}">
                    ${(summary.successRate * 100).toFixed(1)}%
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${summary.successRate * 100}%"></div>
                </div>
            </div>
            
            <div class="summary-card">
                <h3>测试套件</h3>
                <div class="value info">${summary.totalSuites}</div>
                <p>个测试套件</p>
            </div>
            
            <div class="summary-card">
                <h3>测试用例</h3>
                <div class="value info">${summary.totalTests}</div>
                <p>通过: <span class="success">${summary.passedTests}</span> | 失败: <span class="error">${summary.failedTests}</span></p>
            </div>
            
            <div class="summary-card">
                <h3>执行时间</h3>
                <div class="value info">${(summary.totalDuration / 1000).toFixed(1)}s</div>
                <p>总执行时间</p>
            </div>
        </div>
        
        <div class="metrics">
            <h2>📊 系统性能指标</h2>
            <div class="metrics-grid">
                <div class="metric-item">
                    <div class="label">内存使用</div>
                    <div class="value">${systemMetrics.memoryUsage.toFixed(1)} MB</div>
                </div>
                <div class="metric-item">
                    <div class="label">性能评分</div>
                    <div class="value ${systemMetrics.performanceScore >= 80 ? 'success' : systemMetrics.performanceScore >= 60 ? 'warning' : 'error'}">
                        ${systemMetrics.performanceScore.toFixed(1)}/100
                    </div>
                </div>
                <div class="metric-item">
                    <div class="label">错误率</div>
                    <div class="value ${systemMetrics.errorRate <= 0.05 ? 'success' : systemMetrics.errorRate <= 0.1 ? 'warning' : 'error'}">
                        ${(systemMetrics.errorRate * 100).toFixed(1)}%
                    </div>
                </div>
                <div class="metric-item">
                    <div class="label">平均响应时间</div>
                    <div class="value">${systemMetrics.averageResponseTime.toFixed(0)}ms</div>
                </div>
            </div>
        </div>
        
        <div class="suites">
            <h2>🧪 测试套件详情</h2>
            ${suites.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        <h3>
                            ${suite.name}
                            <span class="suite-status ${suite.success ? 'passed' : 'failed'}">
                                ${suite.success ? '✅ 通过' : '❌ 失败'}
                            </span>
                        </h3>
                        <p>执行时间: ${suite.duration}ms | 通过: ${suite.passedTests}/${suite.totalTests}</p>
                    </div>
                    <div class="test-list">
                        ${suite.tests.map(test => `
                            <div class="test-item">
                                <span class="test-name">${test.testName}</span>
                                <div class="test-status">
                                    <span class="${test.passed ? 'success' : 'error'}">
                                        ${test.passed ? '✅' : '❌'}
                                    </span>
                                    <span class="test-duration">${test.duration}ms</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${summary.criticalIssues.length > 0 || summary.warnings.length > 0 || summary.recommendations.length > 0 ? `
        <div class="issues">
            <h2>⚠️ 问题和建议</h2>
            
            ${summary.criticalIssues.length > 0 ? `
            <div class="issue-section">
                <h3 style="color: #e74c3c;">🚨 关键问题</h3>
                <ul class="issue-list">
                    ${summary.criticalIssues.map(issue => `
                        <li><span class="issue-icon">🚨</span> ${issue}</li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${summary.warnings.length > 0 ? `
            <div class="issue-section">
                <h3 style="color: #f39c12;">⚠️ 警告</h3>
                <ul class="issue-list">
                    ${summary.warnings.map(warning => `
                        <li><span class="issue-icon">⚠️</span> ${warning}</li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${summary.recommendations.length > 0 ? `
            <div class="issue-section">
                <h3 style="color: #3498db;">💡 优化建议</h3>
                <ul class="issue-list">
                    ${summary.recommendations.map(rec => `
                        <li><span class="issue-icon">💡</span> ${rec}</li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        ` : ''}
        
        <div style="margin-top: 2rem; padding: 1rem; background: white; border-radius: 10px; text-align: center; color: #7f8c8d; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p>🎯 测试报告生成于 ${new Date().toLocaleString('zh-CN')}</p>
            <p>十二生肖大富翁 - 集成测试系统</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * 生成Markdown测试报告
   */
  static generateMarkdownReport(report: ComprehensiveTestReport): string {
    const { summary, suites, systemMetrics } = report;
    
    return `# 十二生肖大富翁 - 集成测试报告

📅 **生成时间**: ${new Date().toLocaleString('zh-CN')}

## 📊 测试总览

| 指标 | 数值 | 状态 |
|------|------|------|
| 总体成功率 | ${(summary.successRate * 100).toFixed(1)}% | ${summary.successRate >= 0.9 ? '🟢 优秀' : summary.successRate >= 0.7 ? '🟡 良好' : '🔴 需要改进'} |
| 测试套件 | ${summary.totalSuites} | - |
| 测试用例 | ${summary.totalTests} (通过: ${summary.passedTests}, 失败: ${summary.failedTests}) | - |
| 执行时间 | ${(summary.totalDuration / 1000).toFixed(1)}s | ${summary.totalDuration < 30000 ? '🟢 快速' : summary.totalDuration < 60000 ? '🟡 正常' : '🔴 较慢'} |

## 🎯 系统性能指标

| 指标 | 数值 | 评级 |
|------|------|------|
| 内存使用 | ${systemMetrics.memoryUsage.toFixed(1)} MB | ${systemMetrics.memoryUsage < 50 ? '🟢 良好' : systemMetrics.memoryUsage < 100 ? '🟡 正常' : '🔴 偏高'} |
| 性能评分 | ${systemMetrics.performanceScore.toFixed(1)}/100 | ${systemMetrics.performanceScore >= 80 ? '🟢 优秀' : systemMetrics.performanceScore >= 60 ? '🟡 良好' : '🔴 需要优化'} |
| 错误率 | ${(systemMetrics.errorRate * 100).toFixed(1)}% | ${systemMetrics.errorRate <= 0.05 ? '🟢 优秀' : systemMetrics.errorRate <= 0.1 ? '🟡 可接受' : '🔴 过高'} |
| 平均响应时间 | ${systemMetrics.averageResponseTime.toFixed(0)}ms | ${systemMetrics.averageResponseTime < 100 ? '🟢 快速' : systemMetrics.averageResponseTime < 500 ? '🟡 正常' : '🔴 较慢'} |

## 🧪 测试套件详情

${suites.map(suite => `
### ${suite.success ? '✅' : '❌'} ${suite.name}

- **状态**: ${suite.success ? '通过' : '失败'}
- **执行时间**: ${suite.duration}ms
- **测试结果**: ${suite.passedTests}/${suite.totalTests} 通过

#### 测试用例

${suite.tests.map(test => 
  `- ${test.passed ? '✅' : '❌'} **${test.testName}** (${test.duration}ms)${test.error ? `\n  - ❌ 错误: ${test.error}` : ''}`
).join('\n')}
`).join('\n')}

${summary.criticalIssues.length > 0 ? `
## 🚨 关键问题

${summary.criticalIssues.map(issue => `- 🚨 ${issue}`).join('\n')}
` : ''}

${summary.warnings.length > 0 ? `
## ⚠️ 警告

${summary.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}
` : ''}

${summary.recommendations.length > 0 ? `
## 💡 优化建议

${summary.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}
` : ''}

---

**测试框架**: 十二生肖大富翁集成测试系统  
**生成时间**: ${new Date().toLocaleString('zh-CN')}
`;
  }

  /**
   * 生成JSON测试报告
   */
  static generateJSONReport(report: ComprehensiveTestReport): string {
    return JSON.stringify(report, null, 2);
  }
}

/**
 * 主测试执行函数
 */
async function runIntegrationTests(): Promise<void> {
  console.log('🚀 启动十二生肖大富翁集成测试...\n');
  
  const tester = new ComprehensiveIntegrationTest();
  
  try {
    // 执行测试
    const report = await tester.runComprehensiveTests();
    
    // 输出控制台摘要
    console.log('\n' + '='.repeat(80));
    console.log('📋 测试摘要');
    console.log('='.repeat(80));
    console.log(`总体成功率: ${(report.summary.successRate * 100).toFixed(1)}%`);
    console.log(`测试套件: ${report.summary.totalSuites} (成功: ${report.suites.filter(s => s.success).length})`);
    console.log(`测试用例: ${report.summary.totalTests} (通过: ${report.summary.passedTests}, 失败: ${report.summary.failedTests})`);
    console.log(`执行时间: ${(report.summary.totalDuration / 1000).toFixed(1)}s`);
    console.log(`性能评分: ${report.systemMetrics.performanceScore.toFixed(1)}/100`);
    
    if (report.summary.criticalIssues.length > 0) {
      console.log('\n🚨 关键问题:');
      report.summary.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (report.summary.warnings.length > 0) {
      console.log('\n⚠️ 警告:');
      report.summary.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (report.summary.recommendations.length > 0) {
      console.log('\n💡 建议:');
      report.summary.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    // 生成报告文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = join(process.cwd(), 'test-reports');
    
    try {
      // 确保报告目录存在
      const fs = require('fs');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      // 生成不同格式的报告
      const htmlReport = TestReportGenerator.generateHTMLReport(report);
      const markdownReport = TestReportGenerator.generateMarkdownReport(report);
      const jsonReport = TestReportGenerator.generateJSONReport(report);
      
      writeFileSync(join(reportDir, `integration-test-${timestamp}.html`), htmlReport);
      writeFileSync(join(reportDir, `integration-test-${timestamp}.md`), markdownReport);
      writeFileSync(join(reportDir, `integration-test-${timestamp}.json`), jsonReport);
      writeFileSync(join(reportDir, 'latest-integration-test.html'), htmlReport);
      writeFileSync(join(reportDir, 'latest-integration-test.md'), markdownReport);
      writeFileSync(join(reportDir, 'latest-integration-test.json'), jsonReport);
      
      console.log(`\n📄 测试报告已生成:`);
      console.log(`  - HTML: test-reports/latest-integration-test.html`);
      console.log(`  - Markdown: test-reports/latest-integration-test.md`);
      console.log(`  - JSON: test-reports/latest-integration-test.json`);
      
    } catch (fileError) {
      console.warn('⚠️ 无法生成报告文件:', fileError);
    }
    
    // 清理测试资源
    await tester.cleanup();
    
    // 根据测试结果设置退出码
    const exitCode = report.summary.criticalIssues.length > 0 ? 1 : 0;
    console.log(`\n${exitCode === 0 ? '✅' : '❌'} 测试完成 (退出码: ${exitCode})`);
    
    if (typeof process !== 'undefined') {
      process.exit(exitCode);
    }
    
  } catch (error) {
    console.error('❌ 测试执行过程中发生严重错误:', error);
    
    // 尝试清理资源
    try {
      await tester.cleanup();
    } catch (cleanupError) {
      console.warn('⚠️ 清理资源时发生错误:', cleanupError);
    }
    
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runIntegrationTests().catch(error => {
    console.error('❌ 无法启动集成测试:', error);
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  });
}

export { runIntegrationTests, TestReportGenerator };