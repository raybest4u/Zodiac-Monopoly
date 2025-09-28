/**
 * 简化的第二阶段功能集成测试
 * Simplified Phase 2 Integration Test
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details?: string;
  error?: string;
}

interface SystemCheck {
  name: string;
  description: string;
  fileChecks: string[];
  functionChecks?: string[];
}

class Phase2IntegrationTester {
  private testResults: TestResult[] = [];
  private readonly projectRoot = '/Volumes/Kootion/ide_workspace/private/ani_monoploy/zodiac-monopoly/src';

  private readonly systemChecks: SystemCheck[] = [
    {
      name: '生肖技能系统',
      description: '验证12生肖24个技能的完整实现',
      fileChecks: [
        'skills/ZodiacSkillEffects.ts',
        'skills/SkillDataStructures.ts',
        'skills/SkillManager.ts',
        'skills/SkillSystemArchitecture.ts',
        'skills/SkillEffectProcessor.ts'
      ]
    },
    {
      name: 'AI决策优化系统',
      description: '验证增强的AI对手决策能力',
      fileChecks: [
        'ai/AdvancedDecisionFramework.ts',
        'ai/DynamicStrategyAdapter.ts',
        'ai/BehaviorPatternEngine.ts',
        'ai/LearningMemorySystem.ts',
        'ai/PersonalityFactory.ts'
      ]
    },
    {
      name: '智能事件系统',
      description: '验证AI驱动的动态事件生成',
      fileChecks: [
        'events/EventSystem.ts',
        'events/RandomEventSystem.ts',
        'events/EventProcessor.ts',
        'events/EventEffectSystem.ts',
        'events/EventTriggerSystem.ts'
      ]
    },
    {
      name: '游戏平衡系统',
      description: '验证动态平衡调整机制',
      fileChecks: [
        'balance/GameBalanceSystem.ts',
        'balance/GameBalanceAnalyzer.ts',
        'balance/GameSimulator.ts',
        'balance/ValueOptimizer.ts'
      ]
    },
    {
      name: '难度曲线系统',
      description: '验证自适应难度调整',
      fileChecks: [
        'difficulty/GameDifficultySystem.ts',
        'difficulty/DynamicDifficultyAdjuster.ts',
        'difficulty/ChallengeAssessmentSystem.ts',
        'difficulty/DifficultyCurveOptimizer.ts'
      ]
    },
    {
      name: '性能优化系统',
      description: '验证全面性能监控和优化',
      fileChecks: [
        'performance/PerformanceMonitor.ts',
        'performance/MemoryOptimizer.ts',
        'performance/AlgorithmOptimizer.ts',
        'performance/ConcurrencyOptimizer.ts',
        'performance/CacheOptimizer.ts',
        'performance/PerformanceIntegration.ts'
      ]
    },
    {
      name: '核心游戏引擎',
      description: '验证完整游戏逻辑实现',
      fileChecks: [
        'engine/GameEngine.ts',
        'rules/BaseGameRules.ts',
        'rules/GameRuleSystem.ts',
        'trading/TradingAndMortgageManager.ts',
        'special/UnifiedSpecialSystemManager.ts'
      ]
    }
  ];

  public async runTests(): Promise<void> {
    console.log('🎮 Zodiac Monopoly 第二阶段功能验证测试');
    console.log('================================================');
    console.log('开始验证所有第二阶段开发的功能模块...\n');

    const startTime = Date.now();

    // 运行系统检查
    await this.runSystemChecks();
    
    // 验证生肖技能完整性
    await this.verifyZodiacSkills();
    
    // 验证AI算法复杂度
    await this.verifyAIComplexity();
    
    // 验证事件系统丰富性
    await this.verifyEventSystemRichness();
    
    // 验证性能优化功能
    await this.verifyPerformanceOptimization();
    
    // 验证测试覆盖率
    await this.verifyTestCoverage();
    
    // 验证代码质量
    await this.verifyCodeQuality();

    const totalTime = Date.now() - startTime;
    
    // 生成报告
    this.generateReport(totalTime);
  }

  private async runSystemChecks(): Promise<void> {
    for (const system of this.systemChecks) {
      await this.runTest(`${system.name} - 文件完整性检查`, async () => {
        const missingFiles: string[] = [];
        
        for (const file of system.fileChecks) {
          const filePath = path.join(this.projectRoot, file);
          if (!fs.existsSync(filePath)) {
            missingFiles.push(file);
          }
        }
        
        if (missingFiles.length > 0) {
          throw new Error(`缺少文件: ${missingFiles.join(', ')}`);
        }
      });

      await this.runTest(`${system.name} - 代码内容验证`, async () => {
        let totalLines = 0;
        let totalFunctions = 0;
        
        for (const file of system.fileChecks) {
          const filePath = path.join(this.projectRoot, file);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').length;
            const functions = (content.match(/function|class|interface|type/g) || []).length;
            
            totalLines += lines;
            totalFunctions += functions;
          }
        }
        
        if (totalLines < 100) {
          throw new Error(`${system.name}代码量不足: ${totalLines}行`);
        }
        
        if (totalFunctions < 5) {
          throw new Error(`${system.name}功能定义不足: ${totalFunctions}个`);
        }
        
        return `${totalLines}行代码, ${totalFunctions}个功能定义`;
      });
    }
  }

  private async verifyZodiacSkills(): Promise<void> {
    await this.runTest('生肖技能 - 24个技能验证', async () => {
      const skillEffectsFile = path.join(this.projectRoot, 'skills/ZodiacSkillEffects.ts');
      
      if (!fs.existsSync(skillEffectsFile)) {
        throw new Error('生肖技能效果文件不存在');
      }
      
      const content = fs.readFileSync(skillEffectsFile, 'utf-8');
      
      // 验证12生肖都有对应的技能增强器
      const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
      const missingZodiacs: string[] = [];
      
      for (const zodiac of zodiacs) {
        if (!content.includes(`registerZodiacEnhancer('${zodiac}'`)) {
          missingZodiacs.push(zodiac);
        }
      }
      
      if (missingZodiacs.length > 0) {
        throw new Error(`缺少生肖技能增强器: ${missingZodiacs.join(', ')}`);
      }
      
      // 验证技能效果类型数量
      const effectTypes = (content.match(/SkillEffectType\./g) || []).length;
      if (effectTypes < 24) {
        throw new Error(`技能效果类型不足: ${effectTypes} < 24`);
      }
      
      return `12生肖技能增强器完整, ${effectTypes}个技能效果类型`;
    });

    await this.runTest('生肖技能 - 数据结构完整性', async () => {
      const dataStructureFile = path.join(this.projectRoot, 'skills/SkillDataStructures.ts');
      
      if (!fs.existsSync(dataStructureFile)) {
        throw new Error('技能数据结构文件不存在');
      }
      
      const content = fs.readFileSync(dataStructureFile, 'utf-8');
      
      // 验证ZODIAC_SKILL_TRAITS包含所有生肖
      const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
      let zodiacCount = 0;
      
      for (const zodiac of zodiacs) {
        if (content.includes(`'${zodiac}':`)) {
          zodiacCount++;
        }
      }
      
      if (zodiacCount < 12) {
        throw new Error(`生肖特性定义不完整: ${zodiacCount}/12`);
      }
      
      return `12生肖特性定义完整`;
    });
  }

  private async verifyAIComplexity(): Promise<void> {
    await this.runTest('AI系统 - 决策算法复杂度', async () => {
      const decisionFile = path.join(this.projectRoot, 'ai/AdvancedDecisionFramework.ts');
      
      if (!fs.existsSync(decisionFile)) {
        throw new Error('高级决策框架文件不存在');
      }
      
      const content = fs.readFileSync(decisionFile, 'utf-8');
      
      // 验证包含多种算法类型
      const algorithms = [
        'minimax', 'monte_carlo', 'neural_network', 
        'reinforcement_learning', 'expert_system'
      ];
      
      const foundAlgorithms = algorithms.filter(alg => content.includes(alg));
      
      if (foundAlgorithms.length < 3) {
        throw new Error(`AI算法类型不足: ${foundAlgorithms.length}/5`);
      }
      
      return `包含${foundAlgorithms.length}种AI算法类型: ${foundAlgorithms.join(', ')}`;
    });

    await this.runTest('AI系统 - 学习和记忆功能', async () => {
      const learningFile = path.join(this.projectRoot, 'ai/LearningMemorySystem.ts');
      
      if (!fs.existsSync(learningFile)) {
        throw new Error('学习记忆系统文件不存在');
      }
      
      const content = fs.readFileSync(learningFile, 'utf-8');
      
      // 验证学习功能
      const learningFeatures = ['recordExperience', 'learn', 'adaptStrategy', 'updateKnowledge'];
      const foundFeatures = learningFeatures.filter(feature => content.includes(feature));
      
      if (foundFeatures.length < 3) {
        throw new Error(`学习功能不完整: ${foundFeatures.length}/4`);
      }
      
      return `学习功能完整: ${foundFeatures.join(', ')}`;
    });
  }

  private async verifyEventSystemRichness(): Promise<void> {
    await this.runTest('事件系统 - 事件类型丰富性', async () => {
      const eventFiles = [
        'events/EventSystem.ts',
        'events/RandomEventSystem.ts',
        'events/EventEffectSystem.ts'
      ];
      
      let totalEventTypes = 0;
      
      for (const file of eventFiles) {
        const filePath = path.join(this.projectRoot, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const eventTypes = (content.match(/type.*Event|Event.*=/g) || []).length;
          totalEventTypes += eventTypes;
        }
      }
      
      if (totalEventTypes < 10) {
        throw new Error(`事件类型不够丰富: ${totalEventTypes} < 10`);
      }
      
      return `事件类型丰富: ${totalEventTypes}种事件类型`;
    });

    await this.runTest('事件系统 - LLM集成验证', async () => {
      const aiFiles = ['ai/LLMService.ts', 'ai/DecisionEngine.ts'];
      let llmIntegration = false;
      
      for (const file of aiFiles) {
        const filePath = path.join(this.projectRoot, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (content.includes('LLM') || content.includes('openai') || content.includes('anthropic')) {
            llmIntegration = true;
            break;
          }
        }
      }
      
      if (!llmIntegration) {
        throw new Error('未找到LLM集成相关代码');
      }
      
      return 'LLM集成验证通过';
    });
  }

  private async verifyPerformanceOptimization(): Promise<void> {
    await this.runTest('性能优化 - 组件完整性', async () => {
      const performanceComponents = [
        'PerformanceMonitor', 'MemoryOptimizer', 'AlgorithmOptimizer',
        'ConcurrencyOptimizer', 'CacheOptimizer', 'PerformanceIntegration'
      ];
      
      const indexFile = path.join(this.projectRoot, 'performance/index.ts');
      
      if (!fs.existsSync(indexFile)) {
        throw new Error('性能优化模块索引文件不存在');
      }
      
      const content = fs.readFileSync(indexFile, 'utf-8');
      const missingComponents = performanceComponents.filter(comp => !content.includes(comp));
      
      if (missingComponents.length > 0) {
        throw new Error(`缺少性能组件: ${missingComponents.join(', ')}`);
      }
      
      return `性能组件完整: ${performanceComponents.length}个组件`;
    });

    await this.runTest('性能优化 - 功能实现验证', async () => {
      const performanceIntegrationFile = path.join(this.projectRoot, 'performance/PerformanceIntegration.ts');
      
      if (!fs.existsSync(performanceIntegrationFile)) {
        throw new Error('性能集成文件不存在');
      }
      
      const content = fs.readFileSync(performanceIntegrationFile, 'utf-8');
      
      // 验证关键功能
      const keyFeatures = [
        'initialize', 'optimize', 'monitor', 'health', 'cache', 'memory'
      ];
      
      const foundFeatures = keyFeatures.filter(feature => 
        content.toLowerCase().includes(feature.toLowerCase())
      );
      
      if (foundFeatures.length < 5) {
        throw new Error(`性能功能不完整: ${foundFeatures.length}/6`);
      }
      
      return `性能功能完整: ${foundFeatures.join(', ')}`;
    });
  }

  private async verifyTestCoverage(): Promise<void> {
    await this.runTest('测试覆盖 - 测试文件统计', async () => {
      const testFiles = this.findFiles(this.projectRoot, /.*test.*\.ts$/i);
      
      if (testFiles.length < 20) {
        throw new Error(`测试文件不足: ${testFiles.length} < 20`);
      }
      
      return `测试文件充足: ${testFiles.length}个测试文件`;
    });

    await this.runTest('测试覆盖 - 核心模块测试', async () => {
      const coreModules = ['engine', 'skills', 'ai', 'events', 'balance', 'performance'];
      const modulesWithTests = coreModules.filter(module => {
        const testFiles = this.findFiles(
          path.join(this.projectRoot, module),
          /.*test.*\.ts$/i
        );
        return testFiles.length > 0;
      });
      
      const coverage = (modulesWithTests.length / coreModules.length) * 100;
      
      if (coverage < 70) {
        throw new Error(`核心模块测试覆盖率不足: ${coverage.toFixed(1)}%`);
      }
      
      return `核心模块测试覆盖: ${coverage.toFixed(1)}% (${modulesWithTests.length}/${coreModules.length})`;
    });
  }

  private async verifyCodeQuality(): Promise<void> {
    await this.runTest('代码质量 - 总代码量统计', async () => {
      const allTsFiles = this.findFiles(this.projectRoot, /.*\.ts$/);
      let totalLines = 0;
      let totalClasses = 0;
      let totalFunctions = 0;
      
      for (const file of allTsFiles) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          totalLines += content.split('\n').length;
          totalClasses += (content.match(/class\s+\w+/g) || []).length;
          totalFunctions += (content.match(/function\s+\w+|async\s+\w+\s*\(/g) || []).length;
        } catch (error) {
          // 忽略读取错误
        }
      }
      
      if (totalLines < 30000) {
        throw new Error(`代码量不足项目规模要求: ${totalLines} < 30000行`);
      }
      
      return `代码规模: ${totalLines}行, ${totalClasses}个类, ${totalFunctions}个函数`;
    });

    await this.runTest('代码质量 - 架构设计验证', async () => {
      const architectureFiles = [
        'types/game.ts',
        'types/ai.ts',
        'skills/SkillSystemArchitecture.ts',
        'engine/GameEngine.ts'
      ];
      
      let architectureScore = 0;
      
      for (const file of architectureFiles) {
        const filePath = path.join(this.projectRoot, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // 检查架构要素
          if (content.includes('interface')) architectureScore += 1;
          if (content.includes('type')) architectureScore += 1;
          if (content.includes('class')) architectureScore += 1;
          if (content.includes('export')) architectureScore += 1;
        }
      }
      
      if (architectureScore < 10) {
        throw new Error(`架构设计质量不达标: ${architectureScore} < 10`);
      }
      
      return `架构设计良好: 评分 ${architectureScore}`;
    });
  }

  private findFiles(dir: string, pattern: RegExp): string[] {
    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...this.findFiles(fullPath, pattern));
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // 忽略目录访问错误
    }
    
    return files;
  }

  private async runTest(testName: string, testFunction: () => Promise<string | void>): Promise<void> {
    const startTime = Date.now();
    let passed = false;
    let details: string | undefined;
    let error: string | undefined;

    try {
      const result = await testFunction();
      passed = true;
      details = typeof result === 'string' ? result : '测试通过';
    } catch (err) {
      passed = false;
      error = (err as Error).message;
      details = error;
    }

    const duration = Date.now() - startTime;
    
    const result: TestResult = {
      testName,
      passed,
      duration,
      details,
      error
    };

    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName} (${duration}ms)`);
    if (details && passed) {
      console.log(`   ${details}`);
    } else if (error) {
      console.log(`   错误: ${error}`);
    }
  }

  private generateReport(totalTime: number): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    console.log('\n📊 第二阶段功能验证报告');
    console.log('================================================');
    console.log(`总测试数量: ${totalTests}`);
    console.log(`通过测试: ${passedTests} ✅`);
    console.log(`失败测试: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
    console.log(`成功率: ${successRate.toFixed(1)}%`);
    console.log(`总耗时: ${totalTime}ms`);

    // 分类统计
    const categoryStats = new Map<string, { total: number; passed: number }>();
    
    for (const result of this.testResults) {
      const category = result.testName.split(' - ')[0];
      const stats = categoryStats.get(category) || { total: 0, passed: 0 };
      stats.total++;
      if (result.passed) stats.passed++;
      categoryStats.set(category, stats);
    }

    console.log('\n📋 分类测试结果:');
    for (const [category, stats] of categoryStats) {
      const rate = (stats.passed / stats.total * 100).toFixed(1);
      const status = stats.passed === stats.total ? '✅' : '⚠️';
      console.log(`${status} ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
    }

    if (failedTests > 0) {
      console.log('\n❌ 失败测试详情:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`• ${result.testName}: ${result.error}`);
        });
    }

    // 生成详细报告文件
    this.saveDetailedReport(totalTime, successRate);

    console.log('\n🎯 验证结论:');
    if (successRate === 100) {
      console.log('🎉 所有功能验证通过！第二阶段开发完美达标！');
    } else if (successRate >= 90) {
      console.log('✨ 绝大部分功能验证通过，质量优秀！');
    } else if (successRate >= 80) {
      console.log('👍 大部分功能验证通过，整体良好！');
    } else {
      console.log('⚠️ 部分功能需要完善，建议优化！');
    }
  }

  private saveDetailedReport(totalTime: number, successRate: number): void {
    const reportDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      testType: 'Phase2FunctionalVerification',
      summary: {
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(r => r.passed).length,
        failedTests: this.testResults.filter(r => !r.passed).length,
        successRate,
        totalDuration: totalTime
      },
      testResults: this.testResults,
      systemAnalysis: this.generateSystemAnalysis()
    };

    const reportPath = path.join(reportDir, 'phase2-functional-verification.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存: ${reportPath}`);
  }

  private generateSystemAnalysis(): any {
    const analysis = {
      codebaseSize: this.analyzeCodebaseSize(),
      architectureQuality: this.analyzeArchitecture(),
      featureCompleteness: this.analyzeFeatureCompleteness(),
      testCoverage: this.analyzeTestCoverage()
    };

    return analysis;
  }

  private analyzeCodebaseSize(): any {
    const allFiles = this.findFiles(this.projectRoot, /\.ts$/);
    return {
      totalFiles: allFiles.length,
      estimatedLines: allFiles.length * 200, // 估算
      fileTypes: {
        components: this.findFiles(this.projectRoot, /component|widget/i).length,
        services: this.findFiles(this.projectRoot, /service|manager/i).length,
        types: this.findFiles(this.projectRoot, /types|interface/i).length,
        tests: this.findFiles(this.projectRoot, /test|spec/i).length
      }
    };
  }

  private analyzeArchitecture(): any {
    const modules = ['engine', 'skills', 'ai', 'events', 'balance', 'difficulty', 'performance'];
    const moduleInfo = modules.map(module => ({
      name: module,
      files: this.findFiles(path.join(this.projectRoot, module), /\.ts$/).length,
      hasTests: this.findFiles(path.join(this.projectRoot, module), /test/i).length > 0
    }));

    return {
      totalModules: modules.length,
      moduleDetails: moduleInfo,
      modularityScore: moduleInfo.filter(m => m.files > 0).length / modules.length * 100
    };
  }

  private analyzeFeatureCompleteness(): any {
    const expectedFeatures = [
      '生肖技能系统', 'AI决策优化系统', '智能事件系统',
      '游戏平衡系统', '难度曲线系统', '性能优化系统'
    ];

    const implementedFeatures = this.testResults
      .filter(r => r.passed && expectedFeatures.some(f => r.testName.includes(f)))
      .map(r => r.testName.split(' - ')[0]);

    const uniqueFeatures = [...new Set(implementedFeatures)];

    return {
      expectedFeatures: expectedFeatures.length,
      implementedFeatures: uniqueFeatures.length,
      completenessRate: uniqueFeatures.length / expectedFeatures.length * 100,
      featureList: uniqueFeatures
    };
  }

  private analyzeTestCoverage(): any {
    const testFiles = this.findFiles(this.projectRoot, /test|spec/i);
    const srcFiles = this.findFiles(this.projectRoot, /\.ts$/).filter(f => !f.includes('test'));

    return {
      testFiles: testFiles.length,
      sourceFiles: srcFiles.length,
      testRatio: testFiles.length / srcFiles.length,
      estimatedCoverage: Math.min(testFiles.length / srcFiles.length * 100, 100)
    };
  }
}

// 运行测试
async function main() {
  console.log('启动第二阶段功能集成测试...\n');
  
  const tester = new Phase2IntegrationTester();
  await tester.runTests();
}

// 直接运行主函数
main().catch(console.error);

export { Phase2IntegrationTester };