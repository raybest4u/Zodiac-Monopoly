/**
 * 策略性能评估系统
 * Strategy Performance Evaluation System
 * 
 * 实现全面的策略性能评估、基准测试和优化建议系统
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { 
    StrategyDecisionResult,
    GameAction,
    RiskAssessment,
    PerformanceStatistics
} from './StrategyGameIntegration';

import { 
    StrategyEvaluation,
    ObjectiveScores 
} from './DeepStrategyNetwork';

// 评估维度
export enum EvaluationDimension {
    PROFITABILITY = 'profitability',
    RISK_MANAGEMENT = 'risk_management',
    EFFICIENCY = 'efficiency',
    ADAPTABILITY = 'adaptability',
    CONSISTENCY = 'consistency',
    STRATEGIC_THINKING = 'strategic_thinking',
    DECISION_QUALITY = 'decision_quality',
    LEARNING_CAPABILITY = 'learning_capability'
}

// 评估指标
export interface EvaluationMetrics {
    // 财务指标
    totalReturn: number;
    riskAdjustedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    
    // 决策指标
    decisionAccuracy: number;
    decisionSpeed: number;
    decisionConsistency: number;
    strategicAlignment: number;
    
    // 学习指标
    improvementRate: number;
    adaptationSpeed: number;
    knowledgeRetention: number;
    generalizationAbility: number;
    
    // 竞争指标
    relativePerformance: number;
    marketShareGain: number;
    competitiveAdvantage: number;
    
    // 风险指标
    volatility: number;
    valueAtRisk: number;
    conditionalVaR: number;
    riskScore: number;
}

// 基准测试配置
export interface BenchmarkConfig {
    referenceStrategies: ReferenceStrategy[];
    evaluationPeriod: number;
    sampleSize: number;
    confidenceLevel: number;
    testConditions: TestCondition[];
    performanceThresholds: PerformanceThreshold[];
}

// 参考策略
export interface ReferenceStrategy {
    name: string;
    type: 'random' | 'conservative' | 'aggressive' | 'balanced' | 'expert';
    description: string;
    implementation: (gameState: any) => GameAction;
    expectedPerformance: EvaluationMetrics;
}

// 测试条件
export interface TestCondition {
    name: string;
    scenario: string;
    parameters: any;
    weight: number;
    description: string;
}

// 性能阈值
export interface PerformanceThreshold {
    metric: keyof EvaluationMetrics;
    minimum: number;
    target: number;
    excellent: number;
    description: string;
}

// 评估结果
export interface EvaluationResult {
    overallScore: number;
    dimensionScores: Map<EvaluationDimension, number>;
    metrics: EvaluationMetrics;
    benchmarkComparison: BenchmarkComparison;
    strengths: string[];
    weaknesses: string[];
    recommendations: Recommendation[];
    confidence: number;
    timestamp: number;
}

// 基准比较
export interface BenchmarkComparison {
    ranking: number;
    totalStrategies: number;
    relativePerformance: number;
    outperformed: string[];
    underperformed: string[];
    statisticalSignificance: number;
}

// 优化建议
export interface Recommendation {
    category: 'immediate' | 'short_term' | 'long_term';
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImprovement: number;
    implementationDifficulty: number;
    riskLevel: number;
    actionItems: string[];
}

// 性能历史记录
export interface PerformanceHistory {
    timestamp: number;
    gameId: string;
    playerId: string;
    decisions: StrategyDecisionResult[];
    gameOutcome: GameOutcome;
    metrics: EvaluationMetrics;
    contextualFactors: ContextualFactor[];
}

// 游戏结果
export interface GameOutcome {
    finalPosition: number;
    totalPlayers: number;
    finalScore: number;
    gameLength: number;
    victory: boolean;
    victoryType?: string;
}

// 上下文因素
export interface ContextualFactor {
    type: string;
    value: any;
    impact: number;
    description: string;
}

// 策略诊断
export interface StrategyDiagnosis {
    overallHealth: number;
    criticalIssues: Issue[];
    performanceTrends: PerformanceTrend[];
    riskFactors: RiskFactor[];
    opportunities: Opportunity[];
    predictedPerformance: PredictedPerformance;
}

// 问题识别
export interface Issue {
    severity: 'critical' | 'major' | 'minor';
    category: string;
    description: string;
    impact: number;
    frequency: number;
    suggestedFix: string;
    examples: string[];
}

// 性能趋势
export interface PerformanceTrend {
    metric: string;
    direction: 'improving' | 'declining' | 'stable';
    magnitude: number;
    confidence: number;
    timeframe: string;
    projection: number[];
}

// 风险因素
export interface RiskFactor {
    type: string;
    probability: number;
    impact: number;
    description: string;
    mitigation: string;
    monitoring: string;
}

// 机会识别
export interface Opportunity {
    type: string;
    potential: number;
    probability: number;
    description: string;
    requirements: string[];
    timeline: string;
}

// 性能预测
export interface PredictedPerformance {
    shortTerm: {
        expectedReturn: number;
        confidenceInterval: [number, number];
        riskLevel: number;
    };
    mediumTerm: {
        expectedReturn: number;
        confidenceInterval: [number, number];
        riskLevel: number;
    };
    longTerm: {
        expectedReturn: number;
        confidenceInterval: [number, number];
        riskLevel: number;
    };
}

// 主评估系统类
export class StrategyPerformanceEvaluator extends EventEmitter {
    private performanceHistory: PerformanceHistory[];
    private benchmarkConfig: BenchmarkConfig;
    private evaluationCache: Map<string, EvaluationResult>;
    private isEvaluating: boolean;
    
    constructor(benchmarkConfig: BenchmarkConfig) {
        super();
        this.benchmarkConfig = benchmarkConfig;
        this.performanceHistory = [];
        this.evaluationCache = new Map();
        this.isEvaluating = false;
        
        this.initializeReferenceStrategies();
    }
    
    // 初始化参考策略
    private initializeReferenceStrategies(): void {
        // 添加默认参考策略
        const defaultStrategies: ReferenceStrategy[] = [
            {
                name: 'Random Strategy',
                type: 'random',
                description: 'Makes random decisions',
                implementation: this.createRandomStrategy(),
                expectedPerformance: this.createBaselineMetrics(0.2)
            },
            {
                name: 'Conservative Strategy',
                type: 'conservative',
                description: 'Low-risk, steady approach',
                implementation: this.createConservativeStrategy(),
                expectedPerformance: this.createBaselineMetrics(0.5)
            },
            {
                name: 'Aggressive Strategy',
                type: 'aggressive',
                description: 'High-risk, high-reward approach',
                implementation: this.createAggressiveStrategy(),
                expectedPerformance: this.createBaselineMetrics(0.7)
            },
            {
                name: 'Balanced Strategy',
                type: 'balanced',
                description: 'Balanced risk-reward approach',
                implementation: this.createBalancedStrategy(),
                expectedPerformance: this.createBaselineMetrics(0.6)
            }
        ];
        
        this.benchmarkConfig.referenceStrategies.push(...defaultStrategies);
    }
    
    // 主评估方法
    async evaluateStrategy(
        playerId: string,
        decisions: StrategyDecisionResult[],
        gameOutcome: GameOutcome,
        contextualFactors: ContextualFactor[] = []
    ): Promise<EvaluationResult> {
        this.isEvaluating = true;
        
        try {
            this.emit('evaluation_started', { playerId });
            
            // 1. 记录性能历史
            const performanceRecord = this.recordPerformance(
                playerId,
                decisions,
                gameOutcome,
                contextualFactors
            );
            
            // 2. 计算评估指标
            const metrics = this.calculateMetrics(performanceRecord);
            
            // 3. 执行基准测试
            const benchmarkComparison = await this.performBenchmarkTest(
                performanceRecord,
                metrics
            );
            
            // 4. 多维度评估
            const dimensionScores = this.evaluateDimensions(
                performanceRecord,
                metrics
            );
            
            // 5. 识别优势和劣势
            const { strengths, weaknesses } = this.identifyStrengthsWeaknesses(
                dimensionScores,
                benchmarkComparison
            );
            
            // 6. 生成优化建议
            const recommendations = this.generateRecommendations(
                dimensionScores,
                metrics,
                weaknesses
            );
            
            // 7. 计算总体分数和置信度
            const overallScore = this.calculateOverallScore(dimensionScores);
            const confidence = this.calculateConfidence(metrics, benchmarkComparison);
            
            const result: EvaluationResult = {
                overallScore,
                dimensionScores,
                metrics,
                benchmarkComparison,
                strengths,
                weaknesses,
                recommendations,
                confidence,
                timestamp: Date.now()
            };
            
            // 8. 缓存结果
            this.cacheResult(playerId, result);
            
            this.emit('evaluation_completed', { playerId, result });
            
            return result;
            
        } finally {
            this.isEvaluating = false;
        }
    }
    
    // 记录性能
    private recordPerformance(
        playerId: string,
        decisions: StrategyDecisionResult[],
        gameOutcome: GameOutcome,
        contextualFactors: ContextualFactor[]
    ): PerformanceHistory {
        const metrics = this.calculateBasicMetrics(decisions, gameOutcome);
        
        const record: PerformanceHistory = {
            timestamp: Date.now(),
            gameId: `game_${Date.now()}`,
            playerId,
            decisions,
            gameOutcome,
            metrics,
            contextualFactors
        };
        
        this.performanceHistory.push(record);
        
        // 限制历史记录长度
        if (this.performanceHistory.length > 1000) {
            this.performanceHistory = this.performanceHistory.slice(-500);
        }
        
        return record;
    }
    
    // 计算基础指标
    private calculateBasicMetrics(
        decisions: StrategyDecisionResult[],
        gameOutcome: GameOutcome
    ): EvaluationMetrics {
        const totalDecisions = decisions.length;
        const accurateDecisions = decisions.filter(d => d.confidence > 0.7).length;
        const avgDecisionTime = decisions.reduce((sum, d) => sum + (d.executionPlan?.immediateActions.length || 1), 0) / totalDecisions;
        
        return {
            // 财务指标
            totalReturn: gameOutcome.finalScore / 1500 - 1, // 假设初始资金1500
            riskAdjustedReturn: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            winRate: gameOutcome.victory ? 1 : 0,
            averageWin: 0,
            averageLoss: 0,
            profitFactor: 0,
            
            // 决策指标
            decisionAccuracy: accurateDecisions / totalDecisions,
            decisionSpeed: 1 / avgDecisionTime,
            decisionConsistency: this.calculateConsistency(decisions),
            strategicAlignment: this.calculateStrategicAlignment(decisions),
            
            // 学习指标
            improvementRate: 0,
            adaptationSpeed: 0,
            knowledgeRetention: 0,
            generalizationAbility: 0,
            
            // 竞争指标
            relativePerformance: (gameOutcome.totalPlayers - gameOutcome.finalPosition + 1) / gameOutcome.totalPlayers,
            marketShareGain: 0,
            competitiveAdvantage: 0,
            
            // 风险指标
            volatility: this.calculateVolatility(decisions),
            valueAtRisk: 0,
            conditionalVaR: 0,
            riskScore: decisions.reduce((sum, d) => sum + d.riskAssessment.overallRisk, 0) / totalDecisions
        };
    }
    
    // 计算详细指标
    private calculateMetrics(record: PerformanceHistory): EvaluationMetrics {
        const baseMetrics = record.metrics;
        const playerHistory = this.getPlayerHistory(record.playerId);
        
        // 计算更复杂的指标
        const enhancedMetrics = { ...baseMetrics };
        
        if (playerHistory.length > 1) {
            enhancedMetrics.improvementRate = this.calculateImprovementRate(playerHistory);
            enhancedMetrics.adaptationSpeed = this.calculateAdaptationSpeed(playerHistory);
            enhancedMetrics.knowledgeRetention = this.calculateKnowledgeRetention(playerHistory);
            enhancedMetrics.generalizationAbility = this.calculateGeneralizationAbility(playerHistory);
        }
        
        // 计算风险调整指标
        enhancedMetrics.riskAdjustedReturn = this.calculateRiskAdjustedReturn(
            enhancedMetrics.totalReturn,
            enhancedMetrics.volatility
        );
        
        enhancedMetrics.sharpeRatio = this.calculateSharpeRatio(
            enhancedMetrics.totalReturn,
            enhancedMetrics.volatility
        );
        
        return enhancedMetrics;
    }
    
    // 执行基准测试
    private async performBenchmarkTest(
        record: PerformanceHistory,
        metrics: EvaluationMetrics
    ): Promise<BenchmarkComparison> {
        const benchmarkResults: Array<{ strategy: string; score: number }> = [];
        
        // 测试所有参考策略
        for (const strategy of this.benchmarkConfig.referenceStrategies) {
            const score = this.compareWithReference(metrics, strategy.expectedPerformance);
            benchmarkResults.push({ strategy: strategy.name, score });
        }
        
        // 排序并确定排名
        benchmarkResults.sort((a, b) => b.score - a.score);
        const currentScore = this.calculateOverallMetricScore(metrics);
        
        let ranking = 1;
        for (const result of benchmarkResults) {
            if (currentScore >= result.score) break;
            ranking++;
        }
        
        const outperformed = benchmarkResults
            .filter(r => r.score < currentScore)
            .map(r => r.strategy);
        
        const underperformed = benchmarkResults
            .filter(r => r.score > currentScore)
            .map(r => r.strategy);
        
        return {
            ranking,
            totalStrategies: benchmarkResults.length + 1,
            relativePerformance: currentScore,
            outperformed,
            underperformed,
            statisticalSignificance: this.calculateStatisticalSignificance(metrics, benchmarkResults)
        };
    }
    
    // 多维度评估
    private evaluateDimensions(
        record: PerformanceHistory,
        metrics: EvaluationMetrics
    ): Map<EvaluationDimension, number> {
        const scores = new Map<EvaluationDimension, number>();
        
        // 盈利能力
        scores.set(EvaluationDimension.PROFITABILITY, 
            Math.min(1, Math.max(0, (metrics.totalReturn + 1) / 2))
        );
        
        // 风险管理
        scores.set(EvaluationDimension.RISK_MANAGEMENT,
            Math.min(1, Math.max(0, 1 - metrics.riskScore))
        );
        
        // 效率
        scores.set(EvaluationDimension.EFFICIENCY,
            Math.min(1, metrics.decisionSpeed / 2)
        );
        
        // 适应性
        scores.set(EvaluationDimension.ADAPTABILITY,
            Math.min(1, metrics.adaptationSpeed)
        );
        
        // 一致性
        scores.set(EvaluationDimension.CONSISTENCY,
            metrics.decisionConsistency
        );
        
        // 战略思考
        scores.set(EvaluationDimension.STRATEGIC_THINKING,
            metrics.strategicAlignment
        );
        
        // 决策质量
        scores.set(EvaluationDimension.DECISION_QUALITY,
            metrics.decisionAccuracy
        );
        
        // 学习能力
        scores.set(EvaluationDimension.LEARNING_CAPABILITY,
            (metrics.improvementRate + metrics.knowledgeRetention + metrics.generalizationAbility) / 3
        );
        
        return scores;
    }
    
    // 识别优势和劣势
    private identifyStrengthsWeaknesses(
        dimensionScores: Map<EvaluationDimension, number>,
        benchmarkComparison: BenchmarkComparison
    ): { strengths: string[]; weaknesses: string[] } {
        const strengths: string[] = [];
        const weaknesses: string[] = [];
        
        for (const [dimension, score] of dimensionScores) {
            if (score > 0.8) {
                strengths.push(`Excellent ${dimension}: ${(score * 100).toFixed(1)}%`);
            } else if (score > 0.6) {
                strengths.push(`Good ${dimension}: ${(score * 100).toFixed(1)}%`);
            } else if (score < 0.4) {
                weaknesses.push(`Poor ${dimension}: ${(score * 100).toFixed(1)}%`);
            } else if (score < 0.6) {
                weaknesses.push(`Needs improvement in ${dimension}: ${(score * 100).toFixed(1)}%`);
            }
        }
        
        // 基于基准比较添加额外见解
        if (benchmarkComparison.ranking <= 2) {
            strengths.push(`Top performer (Rank ${benchmarkComparison.ranking}/${benchmarkComparison.totalStrategies})`);
        } else if (benchmarkComparison.ranking > benchmarkComparison.totalStrategies * 0.7) {
            weaknesses.push(`Below average performance (Rank ${benchmarkComparison.ranking}/${benchmarkComparison.totalStrategies})`);
        }
        
        return { strengths, weaknesses };
    }
    
    // 生成优化建议
    private generateRecommendations(
        dimensionScores: Map<EvaluationDimension, number>,
        metrics: EvaluationMetrics,
        weaknesses: string[]
    ): Recommendation[] {
        const recommendations: Recommendation[] = [];
        
        // 基于维度分数生成建议
        for (const [dimension, score] of dimensionScores) {
            if (score < 0.5) {
                const recommendation = this.createDimensionRecommendation(dimension, score);
                if (recommendation) {
                    recommendations.push(recommendation);
                }
            }
        }
        
        // 基于特定指标生成建议
        if (metrics.decisionSpeed < 0.5) {
            recommendations.push({
                category: 'immediate',
                priority: 'high',
                description: 'Improve decision-making speed through better pattern recognition',
                expectedImprovement: 0.3,
                implementationDifficulty: 0.4,
                riskLevel: 0.2,
                actionItems: [
                    'Practice common scenarios',
                    'Develop decision trees',
                    'Use automated decision aids'
                ]
            });
        }
        
        if (metrics.riskScore > 0.7) {
            recommendations.push({
                category: 'short_term',
                priority: 'high',
                description: 'Implement better risk management practices',
                expectedImprovement: 0.25,
                implementationDifficulty: 0.5,
                riskLevel: 0.1,
                actionItems: [
                    'Set stricter risk limits',
                    'Diversify strategies',
                    'Implement stop-loss mechanisms'
                ]
            });
        }
        
        if (metrics.improvementRate < 0.2) {
            recommendations.push({
                category: 'long_term',
                priority: 'medium',
                description: 'Enhance learning and adaptation capabilities',
                expectedImprovement: 0.4,
                implementationDifficulty: 0.7,
                riskLevel: 0.3,
                actionItems: [
                    'Implement continuous learning algorithms',
                    'Increase training data diversity',
                    'Add feedback mechanisms'
                ]
            });
        }
        
        // 排序建议
        recommendations.sort((a, b) => {
            const priorityScore = (p: string) => p === 'high' ? 3 : p === 'medium' ? 2 : 1;
            return priorityScore(b.priority) - priorityScore(a.priority) ||
                   b.expectedImprovement - a.expectedImprovement;
        });
        
        return recommendations.slice(0, 5); // 返回前5个建议
    }
    
    // 创建维度建议
    private createDimensionRecommendation(
        dimension: EvaluationDimension,
        score: number
    ): Recommendation | null {
        switch (dimension) {
            case EvaluationDimension.PROFITABILITY:
                return {
                    category: 'short_term',
                    priority: 'high',
                    description: 'Focus on high-return investment opportunities',
                    expectedImprovement: 0.3,
                    implementationDifficulty: 0.5,
                    riskLevel: 0.4,
                    actionItems: [
                        'Analyze market trends',
                        'Identify undervalued assets',
                        'Optimize portfolio allocation'
                    ]
                };
                
            case EvaluationDimension.RISK_MANAGEMENT:
                return {
                    category: 'immediate',
                    priority: 'high',
                    description: 'Strengthen risk assessment and mitigation',
                    expectedImprovement: 0.25,
                    implementationDifficulty: 0.3,
                    riskLevel: 0.1,
                    actionItems: [
                        'Implement risk metrics',
                        'Set position limits',
                        'Create contingency plans'
                    ]
                };
                
            case EvaluationDimension.EFFICIENCY:
                return {
                    category: 'short_term',
                    priority: 'medium',
                    description: 'Streamline decision-making processes',
                    expectedImprovement: 0.2,
                    implementationDifficulty: 0.4,
                    riskLevel: 0.2,
                    actionItems: [
                        'Automate routine decisions',
                        'Use decision support tools',
                        'Optimize information processing'
                    ]
                };
                
            default:
                return null;
        }
    }
    
    // 策略诊断
    async diagnoseStrategy(playerId: string): Promise<StrategyDiagnosis> {
        const playerHistory = this.getPlayerHistory(playerId);
        
        if (playerHistory.length === 0) {
            throw new Error('No performance history available for diagnosis');
        }
        
        const recentPerformance = playerHistory.slice(-10);
        const overallHealth = this.calculateOverallHealth(recentPerformance);
        
        const criticalIssues = this.identifyIssues(recentPerformance);
        const performanceTrends = this.analyzePerformanceTrends(playerHistory);
        const riskFactors = this.identifyRiskFactors(recentPerformance);
        const opportunities = this.identifyOpportunities(recentPerformance);
        const predictedPerformance = this.predictFuturePerformance(playerHistory);
        
        return {
            overallHealth,
            criticalIssues,
            performanceTrends,
            riskFactors,
            opportunities,
            predictedPerformance
        };
    }
    
    // 计算总体健康度
    private calculateOverallHealth(history: PerformanceHistory[]): number {
        if (history.length === 0) return 0;
        
        const avgReturn = history.reduce((sum, h) => sum + h.metrics.totalReturn, 0) / history.length;
        const avgRisk = history.reduce((sum, h) => sum + h.metrics.riskScore, 0) / history.length;
        const avgAccuracy = history.reduce((sum, h) => sum + h.metrics.decisionAccuracy, 0) / history.length;
        
        return (Math.max(0, avgReturn + 1) / 2 * 0.4 + 
                (1 - avgRisk) * 0.3 + 
                avgAccuracy * 0.3);
    }
    
    // 识别问题
    private identifyIssues(history: PerformanceHistory[]): Issue[] {
        const issues: Issue[] = [];
        
        // 检查一致性问题
        const consistencyScores = history.map(h => h.metrics.decisionConsistency);
        const avgConsistency = consistencyScores.reduce((sum, s) => sum + s, 0) / consistencyScores.length;
        
        if (avgConsistency < 0.3) {
            issues.push({
                severity: 'critical',
                category: 'consistency',
                description: 'Highly inconsistent decision-making patterns',
                impact: 0.8,
                frequency: 0.9,
                suggestedFix: 'Implement decision frameworks and guidelines',
                examples: ['Contradictory risk preferences', 'Inconsistent strategy application']
            });
        }
        
        // 检查风险管理问题
        const avgRisk = history.reduce((sum, h) => sum + h.metrics.riskScore, 0) / history.length;
        if (avgRisk > 0.8) {
            issues.push({
                severity: 'major',
                category: 'risk_management',
                description: 'Excessive risk-taking behavior',
                impact: 0.7,
                frequency: 0.8,
                suggestedFix: 'Implement stricter risk controls and limits',
                examples: ['High-risk investments', 'Inadequate diversification']
            });
        }
        
        return issues;
    }
    
    // 分析性能趋势
    private analyzePerformanceTrends(history: PerformanceHistory[]): PerformanceTrend[] {
        const trends: PerformanceTrend[] = [];
        
        if (history.length < 3) return trends;
        
        const metrics = ['totalReturn', 'decisionAccuracy', 'riskScore'];
        
        for (const metric of metrics) {
            const values = history.map(h => (h.metrics as any)[metric]);
            const trend = this.calculateTrendDirection(values);
            
            trends.push({
                metric,
                direction: trend.direction,
                magnitude: trend.magnitude,
                confidence: trend.confidence,
                timeframe: '30_days',
                projection: this.projectTrend(values, 5)
            });
        }
        
        return trends;
    }
    
    // 计算趋势方向
    private calculateTrendDirection(values: number[]): {
        direction: 'improving' | 'declining' | 'stable';
        magnitude: number;
        confidence: number;
    } {
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        
        // 线性回归计算斜率
        const sumX = x.reduce((sum, xi) => sum + xi, 0);
        const sumY = values.reduce((sum, yi) => sum + yi, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const magnitude = Math.abs(slope);
        
        // 计算R²作为置信度
        const yMean = sumY / n;
        const ssTotal = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const ssRes = values.reduce((sum, yi, i) => {
            const predicted = yMean + slope * (i - sumX / n);
            return sum + Math.pow(yi - predicted, 2);
        }, 0);
        
        const confidence = 1 - ssRes / ssTotal;
        
        let direction: 'improving' | 'declining' | 'stable';
        if (magnitude < 0.01) {
            direction = 'stable';
        } else if (slope > 0) {
            direction = 'improving';
        } else {
            direction = 'declining';
        }
        
        return { direction, magnitude, confidence: Math.max(0, confidence) };
    }
    
    // 辅助计算方法
    private calculateConsistency(decisions: StrategyDecisionResult[]): number {
        if (decisions.length < 2) return 1;
        
        const confidences = decisions.map(d => d.confidence);
        const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
        const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
        
        return 1 - Math.min(1, Math.sqrt(variance));
    }
    
    private calculateStrategicAlignment(decisions: StrategyDecisionResult[]): number {
        // 简化实现：基于决策推理的一致性
        return Math.random() * 0.3 + 0.4; // 0.4-0.7范围
    }
    
    private calculateVolatility(decisions: StrategyDecisionResult[]): number {
        const expectedValues = decisions.map(d => d.recommendedAction.expectedValue);
        const mean = expectedValues.reduce((sum, v) => sum + v, 0) / expectedValues.length;
        const variance = expectedValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / expectedValues.length;
        
        return Math.sqrt(variance) / (mean || 1);
    }
    
    private getPlayerHistory(playerId: string): PerformanceHistory[] {
        return this.performanceHistory.filter(h => h.playerId === playerId);
    }
    
    private calculateImprovementRate(history: PerformanceHistory[]): number {
        if (history.length < 2) return 0;
        
        const returns = history.map(h => h.metrics.totalReturn);
        const recent = returns.slice(-Math.min(5, returns.length));
        const earlier = returns.slice(0, -Math.min(5, returns.length));
        
        if (earlier.length === 0) return 0;
        
        const recentAvg = recent.reduce((sum, r) => sum + r, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, r) => sum + r, 0) / earlier.length;
        
        return Math.max(0, (recentAvg - earlierAvg) / Math.abs(earlierAvg || 1));
    }
    
    // 创建参考策略实现
    private createRandomStrategy() {
        return (gameState: any): GameAction => ({
            type: ['buy', 'sell', 'develop', 'trade', 'pass'][Math.floor(Math.random() * 5)] as any,
            priority: Math.random(),
            expectedValue: Math.random() * 1000,
            riskLevel: Math.random()
        });
    }
    
    private createConservativeStrategy() {
        return (gameState: any): GameAction => ({
            type: 'pass',
            priority: 0.3,
            expectedValue: 100,
            riskLevel: 0.2
        });
    }
    
    private createAggressiveStrategy() {
        return (gameState: any): GameAction => ({
            type: 'buy',
            priority: 0.9,
            expectedValue: 800,
            riskLevel: 0.8
        });
    }
    
    private createBalancedStrategy() {
        return (gameState: any): GameAction => ({
            type: 'develop',
            priority: 0.6,
            expectedValue: 500,
            riskLevel: 0.5
        });
    }
    
    private createBaselineMetrics(performanceLevel: number): EvaluationMetrics {
        return {
            totalReturn: performanceLevel * 0.5 - 0.1,
            riskAdjustedReturn: performanceLevel * 0.3,
            sharpeRatio: performanceLevel * 2,
            maxDrawdown: (1 - performanceLevel) * 0.5,
            winRate: performanceLevel * 0.7 + 0.1,
            averageWin: performanceLevel * 500,
            averageLoss: (1 - performanceLevel) * 300,
            profitFactor: performanceLevel * 2 + 0.5,
            decisionAccuracy: performanceLevel * 0.8 + 0.1,
            decisionSpeed: performanceLevel * 0.5 + 0.3,
            decisionConsistency: performanceLevel * 0.6 + 0.2,
            strategicAlignment: performanceLevel * 0.7 + 0.2,
            improvementRate: performanceLevel * 0.1,
            adaptationSpeed: performanceLevel * 0.3,
            knowledgeRetention: performanceLevel * 0.8,
            generalizationAbility: performanceLevel * 0.6,
            relativePerformance: performanceLevel,
            marketShareGain: performanceLevel * 0.1,
            competitiveAdvantage: performanceLevel * 0.5,
            volatility: (1 - performanceLevel) * 0.4 + 0.1,
            valueAtRisk: (1 - performanceLevel) * 0.3,
            conditionalVaR: (1 - performanceLevel) * 0.4,
            riskScore: (1 - performanceLevel) * 0.7 + 0.1
        };
    }
    
    // 其他必要的辅助方法
    private calculateAdaptationSpeed(history: PerformanceHistory[]): number {
        return Math.random() * 0.5 + 0.3; // 简化实现
    }
    
    private calculateKnowledgeRetention(history: PerformanceHistory[]): number {
        return Math.random() * 0.4 + 0.4; // 简化实现
    }
    
    private calculateGeneralizationAbility(history: PerformanceHistory[]): number {
        return Math.random() * 0.6 + 0.2; // 简化实现
    }
    
    private calculateRiskAdjustedReturn(totalReturn: number, volatility: number): number {
        return volatility > 0 ? totalReturn / volatility : totalReturn;
    }
    
    private calculateSharpeRatio(totalReturn: number, volatility: number): number {
        const riskFreeRate = 0.02; // 假设2%无风险利率
        return volatility > 0 ? (totalReturn - riskFreeRate) / volatility : 0;
    }
    
    private compareWithReference(metrics: EvaluationMetrics, reference: EvaluationMetrics): number {
        // 综合比较多个指标
        const weights = {
            totalReturn: 0.3,
            riskScore: 0.2,
            decisionAccuracy: 0.2,
            relativePerformance: 0.3
        };
        
        return (
            metrics.totalReturn * weights.totalReturn +
            (1 - metrics.riskScore) * weights.riskScore +
            metrics.decisionAccuracy * weights.decisionAccuracy +
            metrics.relativePerformance * weights.relativePerformance
        );
    }
    
    private calculateOverallMetricScore(metrics: EvaluationMetrics): number {
        return this.compareWithReference(metrics, metrics); // 自我比较获得绝对分数
    }
    
    private calculateStatisticalSignificance(
        metrics: EvaluationMetrics,
        benchmarkResults: Array<{ strategy: string; score: number }>
    ): number {
        // 简化的统计显著性计算
        const scores = benchmarkResults.map(r => r.score);
        const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const std = Math.sqrt(variance);
        
        const currentScore = this.calculateOverallMetricScore(metrics);
        const zScore = std > 0 ? Math.abs(currentScore - mean) / std : 0;
        
        return Math.min(1, zScore / 2); // 转换为0-1范围
    }
    
    private calculateOverallScore(dimensionScores: Map<EvaluationDimension, number>): number {
        const weights = {
            [EvaluationDimension.PROFITABILITY]: 0.25,
            [EvaluationDimension.RISK_MANAGEMENT]: 0.20,
            [EvaluationDimension.EFFICIENCY]: 0.15,
            [EvaluationDimension.ADAPTABILITY]: 0.10,
            [EvaluationDimension.CONSISTENCY]: 0.10,
            [EvaluationDimension.STRATEGIC_THINKING]: 0.10,
            [EvaluationDimension.DECISION_QUALITY]: 0.08,
            [EvaluationDimension.LEARNING_CAPABILITY]: 0.02
        };
        
        let weightedSum = 0;
        for (const [dimension, score] of dimensionScores) {
            weightedSum += score * weights[dimension];
        }
        
        return weightedSum;
    }
    
    private calculateConfidence(
        metrics: EvaluationMetrics,
        benchmarkComparison: BenchmarkComparison
    ): number {
        return Math.min(1, 
            metrics.decisionAccuracy * 0.5 + 
            benchmarkComparison.statisticalSignificance * 0.5
        );
    }
    
    private cacheResult(playerId: string, result: EvaluationResult): void {
        this.evaluationCache.set(`${playerId}_${Date.now()}`, result);
        
        // 清理旧缓存
        if (this.evaluationCache.size > 100) {
            const oldestKey = Array.from(this.evaluationCache.keys())[0];
            this.evaluationCache.delete(oldestKey);
        }
    }
    
    private identifyRiskFactors(history: PerformanceHistory[]): RiskFactor[] {
        return []; // 简化实现
    }
    
    private identifyOpportunities(history: PerformanceHistory[]): Opportunity[] {
        return []; // 简化实现
    }
    
    private predictFuturePerformance(history: PerformanceHistory[]): PredictedPerformance {
        const avgReturn = history.reduce((sum, h) => sum + h.metrics.totalReturn, 0) / history.length;
        const volatility = this.calculateVolatility(
            history.reduce((acc, h) => acc.concat(h.decisions), [] as StrategyDecisionResult[])
        );
        
        return {
            shortTerm: {
                expectedReturn: avgReturn,
                confidenceInterval: [avgReturn - volatility, avgReturn + volatility],
                riskLevel: volatility
            },
            mediumTerm: {
                expectedReturn: avgReturn * 1.1,
                confidenceInterval: [avgReturn * 0.8, avgReturn * 1.4],
                riskLevel: volatility * 1.2
            },
            longTerm: {
                expectedReturn: avgReturn * 1.2,
                confidenceInterval: [avgReturn * 0.6, avgReturn * 1.8],
                riskLevel: volatility * 1.5
            }
        };
    }
    
    private projectTrend(values: number[], steps: number): number[] {
        // 简单线性投影
        const trend = this.calculateTrendDirection(values);
        const lastValue = values[values.length - 1];
        
        return Array.from({ length: steps }, (_, i) => 
            lastValue + trend.magnitude * (trend.direction === 'improving' ? 1 : -1) * (i + 1)
        );
    }
    
    // 公共方法
    getEvaluationHistory(playerId: string): EvaluationResult[] {
        const results: EvaluationResult[] = [];
        for (const [key, result] of this.evaluationCache) {
            if (key.startsWith(playerId)) {
                results.push(result);
            }
        }
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    getPerformanceHistory(playerId: string): PerformanceHistory[] {
        return this.getPlayerHistory(playerId);
    }
    
    clearHistory(playerId?: string): void {
        if (playerId) {
            this.performanceHistory = this.performanceHistory.filter(h => h.playerId !== playerId);
            for (const key of this.evaluationCache.keys()) {
                if (key.startsWith(playerId)) {
                    this.evaluationCache.delete(key);
                }
            }
        } else {
            this.performanceHistory = [];
            this.evaluationCache.clear();
        }
        
        this.emit('history_cleared', { playerId });
    }
    
    exportEvaluationReport(playerId: string): string {
        const history = this.getPlayerHistory(playerId);
        const evaluations = this.getEvaluationHistory(playerId);
        
        const report = {
            playerId,
            generatedAt: new Date().toISOString(),
            summary: {
                totalGames: history.length,
                averageScore: history.reduce((sum, h) => sum + h.gameOutcome.finalScore, 0) / history.length,
                winRate: history.filter(h => h.gameOutcome.victory).length / history.length
            },
            latestEvaluation: evaluations[0],
            performanceHistory: history,
            evaluationHistory: evaluations
        };
        
        return JSON.stringify(report, null, 2);
    }
}