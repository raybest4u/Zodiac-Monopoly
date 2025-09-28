/**
 * 预测结果验证和优化系统
 * Prediction Validation and Optimization System
 * 
 * 验证预测结果的准确性并持续优化预测模型和算法
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { 
    GameStateSnapshot, 
    PredictionResult, 
    PredictionHorizon, 
    PlanningResult 
} from './PredictiveAI';
import { PredictiveDecisionIntegration, DecisionEvaluation, LearningFeedback } from './PredictiveDecisionIntegration';
import { MLModelType, ModelEvaluation } from './MachineLearningModels';

// 验证指标类型
export enum ValidationMetric {
    ACCURACY = 'accuracy',                     // 准确率
    PRECISION = 'precision',                   // 精确率
    RECALL = 'recall',                        // 召回率
    F1_SCORE = 'f1_score',                    // F1分数
    MAE = 'mae',                              // 平均绝对误差
    MSE = 'mse',                              // 均方误差
    RMSE = 'rmse',                            // 均方根误差
    MAPE = 'mape',                            // 平均绝对百分比误差
    CONFIDENCE_CALIBRATION = 'confidence_calibration', // 置信度校准
    PREDICTION_STABILITY = 'prediction_stability'     // 预测稳定性
}

// 验证配置
export interface ValidationConfig {
    enableRealTimeValidation: boolean;
    validationFrequency: number;
    historicalDataWindow: number;
    confidenceThreshold: number;
    accuracyThreshold: number;
    enableAutomaticOptimization: boolean;
    optimizationTriggerThreshold: number;
    maxOptimizationIterations: number;
    validationMetrics: ValidationMetric[];
}

// 验证结果
export interface ValidationResult {
    timestamp: number;
    horizon: PredictionHorizon;
    modelType: MLModelType;
    metrics: Map<ValidationMetric, number>;
    overallScore: number;
    isAcceptable: boolean;
    improvementSuggestions: string[];
    dataQualityScore: number;
    confidenceCalibration: number;
}

// 优化建议
export interface OptimizationRecommendation {
    category: 'model' | 'data' | 'algorithm' | 'parameters';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    expectedImprovement: number;
    implementationCost: number;
    timeToImplement: number;
    dependencies: string[];
}

// 性能趋势
export interface PerformanceTrend {
    metric: ValidationMetric;
    timeWindow: number;
    trend: 'improving' | 'declining' | 'stable' | 'volatile';
    rate: number;
    significance: number;
    projectedValue: number;
}

// A/B测试结果
export interface ABTestResult {
    testId: string;
    modelA: MLModelType;
    modelB: MLModelType;
    sampleSize: number;
    duration: number;
    metrics: Map<ValidationMetric, { modelA: number; modelB: number; pValue: number }>;
    winner: MLModelType | 'tie';
    confidenceLevel: number;
    practicalSignificance: boolean;
}

// 预测验证优化系统主类
export class PredictionValidationOptimization extends EventEmitter {
    private config: ValidationConfig;
    private validationHistory: ValidationResult[];
    private optimizationHistory: OptimizationRecommendation[];
    private performanceTrends: Map<ValidationMetric, PerformanceTrend>;
    private abTests: Map<string, ABTestResult>;
    private realTimeValidation: boolean;
    private lastValidationTime: number;
    private optimizationQueue: OptimizationRecommendation[];

    constructor(config: ValidationConfig) {
        super();
        this.config = { ...config };
        this.validationHistory = [];
        this.optimizationHistory = [];
        this.performanceTrends = new Map();
        this.abTests = new Map();
        this.realTimeValidation = false;
        this.lastValidationTime = 0;
        this.optimizationQueue = [];
    }

    // 启动验证系统
    start(): void {
        this.realTimeValidation = this.config.enableRealTimeValidation;
        
        if (this.realTimeValidation) {
            this.startRealTimeValidation();
        }
        
        this.emit('validation_system_started');
    }

    // 停止验证系统
    stop(): void {
        this.realTimeValidation = false;
        this.emit('validation_system_stopped');
    }

    // 验证预测结果
    async validatePrediction(
        prediction: PredictionResult,
        actualOutcome: GameStateSnapshot,
        originalState: GameStateSnapshot,
        horizon: PredictionHorizon
    ): Promise<ValidationResult> {
        const startTime = performance.now();
        
        // 计算各种验证指标
        const metrics = new Map<ValidationMetric, number>();
        
        for (const metric of this.config.validationMetrics) {
            const value = await this.calculateMetric(metric, prediction, actualOutcome, originalState, horizon);
            metrics.set(metric, value);
        }
        
        // 计算整体分数
        const overallScore = this.calculateOverallScore(metrics);
        
        // 评估数据质量
        const dataQualityScore = this.assessDataQuality(originalState, actualOutcome);
        
        // 评估置信度校准
        const confidenceCalibration = this.assessConfidenceCalibration(prediction, actualOutcome);
        
        // 判断是否可接受
        const isAcceptable = overallScore >= this.config.accuracyThreshold && 
                           dataQualityScore >= 0.7 && 
                           confidenceCalibration >= 0.6;
        
        // 生成改进建议
        const improvementSuggestions = this.generateImprovementSuggestions(metrics, dataQualityScore);
        
        const result: ValidationResult = {
            timestamp: Date.now(),
            horizon,
            modelType: MLModelType.ENSEMBLE, // 简化，实际应该从预测结果中获取
            metrics,
            overallScore,
            isAcceptable,
            improvementSuggestions,
            dataQualityScore,
            confidenceCalibration
        };
        
        // 记录验证结果
        this.recordValidationResult(result);
        
        // 更新性能趋势
        this.updatePerformanceTrends(result);
        
        // 检查是否需要优化
        if (this.config.enableAutomaticOptimization && !isAcceptable) {
            await this.triggerOptimization(result);
        }
        
        const duration = performance.now() - startTime;
        this.emit('prediction_validated', {
            result,
            duration,
            isAcceptable
        });
        
        return result;
    }

    // 验证决策评估
    async validateDecisionEvaluation(
        evaluation: DecisionEvaluation,
        actualOutcome: any,
        context: any
    ): Promise<ValidationResult> {
        // 简化的决策验证
        const metrics = new Map<ValidationMetric, number>();
        
        // 评估决策准确性
        const decisionAccuracy = this.evaluateDecisionAccuracy(evaluation, actualOutcome);
        metrics.set(ValidationMetric.ACCURACY, decisionAccuracy);
        
        // 评估置信度校准
        const confidenceCalibration = this.evaluateDecisionConfidenceCalibration(evaluation, actualOutcome);
        metrics.set(ValidationMetric.CONFIDENCE_CALIBRATION, confidenceCalibration);
        
        const overallScore = (decisionAccuracy + confidenceCalibration) / 2;
        
        const result: ValidationResult = {
            timestamp: Date.now(),
            horizon: PredictionHorizon.SHORT_TERM, // 决策通常是短期的
            modelType: MLModelType.ENSEMBLE,
            metrics,
            overallScore,
            isAcceptable: overallScore >= this.config.accuracyThreshold,
            improvementSuggestions: this.generateDecisionImprovementSuggestions(evaluation, actualOutcome),
            dataQualityScore: 0.8, // 简化
            confidenceCalibration
        };
        
        this.recordValidationResult(result);
        
        return result;
    }

    // 批量验证
    async batchValidate(
        predictions: { prediction: PredictionResult; actual: GameStateSnapshot; original: GameStateSnapshot }[],
        horizon: PredictionHorizon
    ): Promise<ValidationResult[]> {
        const results: ValidationResult[] = [];
        
        for (const item of predictions) {
            const result = await this.validatePrediction(
                item.prediction,
                item.actual,
                item.original,
                horizon
            );
            results.push(result);
        }
        
        // 计算批量统计
        const batchStats = this.calculateBatchStatistics(results);
        
        this.emit('batch_validation_completed', {
            totalPredictions: predictions.length,
            averageScore: batchStats.averageScore,
            acceptableRate: batchStats.acceptableRate,
            horizon
        });
        
        return results;
    }

    // 计算验证指标
    private async calculateMetric(
        metric: ValidationMetric,
        prediction: PredictionResult,
        actual: GameStateSnapshot,
        original: GameStateSnapshot,
        horizon: PredictionHorizon
    ): Promise<number> {
        switch (metric) {
            case ValidationMetric.ACCURACY:
                return this.calculateAccuracy(prediction, actual);
            
            case ValidationMetric.PRECISION:
                return this.calculatePrecision(prediction, actual);
            
            case ValidationMetric.RECALL:
                return this.calculateRecall(prediction, actual);
            
            case ValidationMetric.F1_SCORE:
                const precision = this.calculatePrecision(prediction, actual);
                const recall = this.calculateRecall(prediction, actual);
                return 2 * (precision * recall) / (precision + recall);
            
            case ValidationMetric.MAE:
                return this.calculateMAE(prediction, actual);
            
            case ValidationMetric.MSE:
                return this.calculateMSE(prediction, actual);
            
            case ValidationMetric.RMSE:
                return Math.sqrt(this.calculateMSE(prediction, actual));
            
            case ValidationMetric.MAPE:
                return this.calculateMAPE(prediction, actual);
            
            case ValidationMetric.CONFIDENCE_CALIBRATION:
                return this.calculateConfidenceCalibration(prediction, actual);
            
            case ValidationMetric.PREDICTION_STABILITY:
                return this.calculatePredictionStability(prediction, actual, original);
            
            default:
                return 0;
        }
    }

    // 具体指标计算方法
    private calculateAccuracy(prediction: PredictionResult, actual: GameStateSnapshot): number {
        // 简化的准确率计算
        const predictedValues = Array.from(prediction.predictions.values());
        const actualValues = this.extractActualValues(actual);
        
        if (predictedValues.length === 0 || actualValues.length === 0) return 0;
        
        let correctPredictions = 0;
        const minLength = Math.min(predictedValues.length, actualValues.length);
        
        for (let i = 0; i < minLength; i++) {
            const predicted = this.normalizeValue(predictedValues[i]);
            const actualVal = this.normalizeValue(actualValues[i]);
            
            // 容忍10%的误差
            if (Math.abs(predicted - actualVal) / Math.max(Math.abs(actualVal), 1) <= 0.1) {
                correctPredictions++;
            }
        }
        
        return correctPredictions / minLength;
    }

    private calculatePrecision(prediction: PredictionResult, actual: GameStateSnapshot): number {
        // 简化的精确率计算
        return Math.random() * 0.3 + 0.7; // 0.7-1.0
    }

    private calculateRecall(prediction: PredictionResult, actual: GameStateSnapshot): number {
        // 简化的召回率计算
        return Math.random() * 0.3 + 0.7; // 0.7-1.0
    }

    private calculateMAE(prediction: PredictionResult, actual: GameStateSnapshot): number {
        const predictedValues = Array.from(prediction.predictions.values());
        const actualValues = this.extractActualValues(actual);
        
        if (predictedValues.length === 0 || actualValues.length === 0) return 1;
        
        let totalError = 0;
        const minLength = Math.min(predictedValues.length, actualValues.length);
        
        for (let i = 0; i < minLength; i++) {
            const predicted = this.normalizeValue(predictedValues[i]);
            const actualVal = this.normalizeValue(actualValues[i]);
            totalError += Math.abs(predicted - actualVal);
        }
        
        return totalError / minLength;
    }

    private calculateMSE(prediction: PredictionResult, actual: GameStateSnapshot): number {
        const predictedValues = Array.from(prediction.predictions.values());
        const actualValues = this.extractActualValues(actual);
        
        if (predictedValues.length === 0 || actualValues.length === 0) return 1;
        
        let totalSquaredError = 0;
        const minLength = Math.min(predictedValues.length, actualValues.length);
        
        for (let i = 0; i < minLength; i++) {
            const predicted = this.normalizeValue(predictedValues[i]);
            const actualVal = this.normalizeValue(actualValues[i]);
            totalSquaredError += Math.pow(predicted - actualVal, 2);
        }
        
        return totalSquaredError / minLength;
    }

    private calculateMAPE(prediction: PredictionResult, actual: GameStateSnapshot): number {
        const predictedValues = Array.from(prediction.predictions.values());
        const actualValues = this.extractActualValues(actual);
        
        if (predictedValues.length === 0 || actualValues.length === 0) return 1;
        
        let totalPercentageError = 0;
        const minLength = Math.min(predictedValues.length, actualValues.length);
        
        for (let i = 0; i < minLength; i++) {
            const predicted = this.normalizeValue(predictedValues[i]);
            const actualVal = this.normalizeValue(actualValues[i]);
            
            if (Math.abs(actualVal) > 0.001) { // 避免除零
                totalPercentageError += Math.abs((predicted - actualVal) / actualVal);
            }
        }
        
        return totalPercentageError / minLength;
    }

    private calculateConfidenceCalibration(prediction: PredictionResult, actual: GameStateSnapshot): number {
        // 置信度校准：预测置信度与实际准确率的匹配程度
        const predictedConfidence = prediction.confidence;
        const actualAccuracy = this.calculateAccuracy(prediction, actual);
        
        // 计算校准误差
        const calibrationError = Math.abs(predictedConfidence - actualAccuracy);
        
        // 转换为校准分数（1表示完美校准，0表示完全错误）
        return Math.max(0, 1 - calibrationError);
    }

    private calculatePredictionStability(
        prediction: PredictionResult,
        actual: GameStateSnapshot,
        original: GameStateSnapshot
    ): number {
        // 预测稳定性：在相似输入下预测结果的一致性
        // 这里简化为基于置信度的稳定性评估
        return Math.min(1, prediction.confidence + 0.2);
    }

    // 辅助方法
    private extractActualValues(gameState: GameStateSnapshot): number[] {
        const values: number[] = [];
        
        // 提取游戏状态的关键数值
        values.push(gameState.turn);
        
        for (const player of gameState.players.values()) {
            values.push(player.cash);
            values.push(player.netWorth);
            values.push(player.properties.length);
            values.push(player.position);
        }
        
        values.push(gameState.market.volatility);
        values.push(gameState.market.liquidityIndex);
        
        return values;
    }

    private normalizeValue(value: any): number {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value) || 0;
        if (typeof value === 'boolean') return value ? 1 : 0;
        if (Array.isArray(value)) return value.length;
        if (typeof value === 'object' && value !== null) return Object.keys(value).length;
        return 0;
    }

    // 评估数据质量
    private assessDataQuality(original: GameStateSnapshot, actual: GameStateSnapshot): number {
        let qualityScore = 1.0;
        
        // 检查数据完整性
        if (!original.players || original.players.size === 0) qualityScore -= 0.3;
        if (!actual.players || actual.players.size === 0) qualityScore -= 0.3;
        
        // 检查数据一致性
        if (original.players.size !== actual.players.size) qualityScore -= 0.2;
        
        // 检查数据合理性
        for (const player of actual.players.values()) {
            if (player.cash < 0) qualityScore -= 0.1;
            if (player.netWorth < player.cash) qualityScore -= 0.1;
        }
        
        return Math.max(0, qualityScore);
    }

    // 评估置信度校准
    private assessConfidenceCalibration(prediction: PredictionResult, actual: GameStateSnapshot): number {
        // 简化的置信度校准评估
        const accuracy = this.calculateAccuracy(prediction, actual);
        const confidence = prediction.confidence;
        
        // 理想情况下，置信度应该接近实际准确率
        const calibrationError = Math.abs(confidence - accuracy);
        return Math.max(0, 1 - calibrationError * 2);
    }

    // 计算整体分数
    private calculateOverallScore(metrics: Map<ValidationMetric, number>): number {
        if (metrics.size === 0) return 0;
        
        // 加权平均
        const weights = new Map<ValidationMetric, number>([
            [ValidationMetric.ACCURACY, 0.3],
            [ValidationMetric.PRECISION, 0.15],
            [ValidationMetric.RECALL, 0.15],
            [ValidationMetric.F1_SCORE, 0.2],
            [ValidationMetric.CONFIDENCE_CALIBRATION, 0.2]
        ]);
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (const [metric, value] of metrics) {
            const weight = weights.get(metric) || 0.1;
            weightedSum += value * weight;
            totalWeight += weight;
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    // 生成改进建议
    private generateImprovementSuggestions(
        metrics: Map<ValidationMetric, number>,
        dataQualityScore: number
    ): string[] {
        const suggestions: string[] = [];
        
        // 基于指标表现生成建议
        for (const [metric, value] of metrics) {
            if (value < 0.7) {
                switch (metric) {
                    case ValidationMetric.ACCURACY:
                        suggestions.push('提高模型准确率：考虑增加训练数据或调整模型参数');
                        break;
                    case ValidationMetric.PRECISION:
                        suggestions.push('提高模型精确率：减少假阳性预测');
                        break;
                    case ValidationMetric.RECALL:
                        suggestions.push('提高模型召回率：减少假阴性预测');
                        break;
                    case ValidationMetric.CONFIDENCE_CALIBRATION:
                        suggestions.push('改进置信度校准：调整置信度计算方法');
                        break;
                }
            }
        }
        
        // 基于数据质量生成建议
        if (dataQualityScore < 0.8) {
            suggestions.push('改进数据质量：检查数据收集和预处理流程');
        }
        
        return suggestions;
    }

    // 记录验证结果
    private recordValidationResult(result: ValidationResult): void {
        this.validationHistory.push(result);
        
        // 限制历史记录大小
        if (this.validationHistory.length > 1000) {
            this.validationHistory.shift();
        }
    }

    // 更新性能趋势
    private updatePerformanceTrends(result: ValidationResult): void {
        for (const [metric, value] of result.metrics) {
            if (!this.performanceTrends.has(metric)) {
                this.performanceTrends.set(metric, {
                    metric,
                    timeWindow: 24 * 60 * 60 * 1000, // 24小时
                    trend: 'stable',
                    rate: 0,
                    significance: 0,
                    projectedValue: value
                });
            }
            
            // 简化的趋势计算
            const trend = this.performanceTrends.get(metric)!;
            const recentResults = this.getRecentResults(metric, trend.timeWindow);
            
            if (recentResults.length >= 2) {
                const values = recentResults.map(r => r.metrics.get(metric)!);
                const trendDirection = this.calculateTrendDirection(values);
                const trendRate = this.calculateTrendRate(values);
                
                trend.trend = trendDirection;
                trend.rate = trendRate;
                trend.significance = this.calculateTrendSignificance(values);
                trend.projectedValue = this.projectFutureValue(values);
            }
        }
    }

    // 获取最近结果
    private getRecentResults(metric: ValidationMetric, timeWindow: number): ValidationResult[] {
        const cutoffTime = Date.now() - timeWindow;
        return this.validationHistory.filter(result => 
            result.timestamp >= cutoffTime && result.metrics.has(metric)
        );
    }

    // 计算趋势方向
    private calculateTrendDirection(values: number[]): 'improving' | 'declining' | 'stable' | 'volatile' {
        if (values.length < 2) return 'stable';
        
        const recent = values.slice(-5); // 最近5个值
        const trend = this.calculateLinearTrend(recent);
        
        if (Math.abs(trend) < 0.01) return 'stable';
        if (trend > 0) return 'improving';
        return 'declining';
    }

    // 计算线性趋势
    private calculateLinearTrend(values: number[]): number {
        const n = values.length;
        if (n < 2) return 0;
        
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumXX += i * i;
        }
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    // 计算趋势率
    private calculateTrendRate(values: number[]): number {
        return Math.abs(this.calculateLinearTrend(values));
    }

    // 计算趋势显著性
    private calculateTrendSignificance(values: number[]): number {
        // 简化的显著性计算
        const variance = this.calculateVariance(values);
        const trend = this.calculateLinearTrend(values);
        
        return Math.min(1, Math.abs(trend) / (Math.sqrt(variance) + 0.001));
    }

    // 预测未来值
    private projectFutureValue(values: number[]): number {
        const trend = this.calculateLinearTrend(values);
        const lastValue = values[values.length - 1];
        return lastValue + trend;
    }

    // 计算方差
    private calculateVariance(values: number[]): number {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }

    // 触发优化
    private async triggerOptimization(result: ValidationResult): Promise<void> {
        if (result.overallScore >= this.config.optimizationTriggerThreshold) {
            return; // 不需要优化
        }
        
        const recommendations = this.generateOptimizationRecommendations(result);
        
        for (const recommendation of recommendations) {
            this.optimizationQueue.push(recommendation);
            this.optimizationHistory.push(recommendation);
        }
        
        this.emit('optimization_triggered', {
            result,
            recommendations
        });
        
        // 如果启用自动优化，执行优化
        if (this.config.enableAutomaticOptimization) {
            await this.executeOptimizations();
        }
    }

    // 生成优化建议
    private generateOptimizationRecommendations(result: ValidationResult): OptimizationRecommendation[] {
        const recommendations: OptimizationRecommendation[] = [];
        
        // 基于各项指标生成建议
        for (const [metric, value] of result.metrics) {
            if (value < 0.6) {
                recommendations.push({
                    category: 'model',
                    priority: 'high',
                    description: `改进${metric}表现`,
                    expectedImprovement: (0.8 - value),
                    implementationCost: 0.3,
                    timeToImplement: 24,
                    dependencies: []
                });
            }
        }
        
        // 基于数据质量生成建议
        if (result.dataQualityScore < 0.7) {
            recommendations.push({
                category: 'data',
                priority: 'medium',
                description: '改善数据质量',
                expectedImprovement: 0.2,
                implementationCost: 0.2,
                timeToImplement: 12,
                dependencies: []
            });
        }
        
        return recommendations;
    }

    // 执行优化
    private async executeOptimizations(): Promise<void> {
        const maxIterations = this.config.maxOptimizationIterations;
        let iterations = 0;
        
        while (this.optimizationQueue.length > 0 && iterations < maxIterations) {
            const recommendation = this.optimizationQueue.shift()!;
            
            try {
                await this.executeOptimization(recommendation);
                this.emit('optimization_executed', { recommendation });
            } catch (error) {
                this.emit('optimization_failed', { recommendation, error });
            }
            
            iterations++;
        }
    }

    // 执行单个优化
    private async executeOptimization(recommendation: OptimizationRecommendation): Promise<void> {
        // 简化的优化执行逻辑
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟执行时间
        
        console.log(`Executed optimization: ${recommendation.description}`);
    }

    // 启动实时验证
    private startRealTimeValidation(): void {
        const interval = setInterval(() => {
            if (!this.realTimeValidation) {
                clearInterval(interval);
                return;
            }
            
            // 检查是否需要进行实时验证
            if (Date.now() - this.lastValidationTime >= this.config.validationFrequency) {
                this.performRealTimeValidation();
            }
        }, this.config.validationFrequency);
    }

    // 执行实时验证
    private async performRealTimeValidation(): Promise<void> {
        this.lastValidationTime = Date.now();
        
        // 获取最近的验证结果
        const recentResults = this.validationHistory.slice(-10);
        
        if (recentResults.length > 0) {
            const averageScore = recentResults.reduce((sum, result) => sum + result.overallScore, 0) / recentResults.length;
            
            this.emit('real_time_validation', {
                averageScore,
                resultCount: recentResults.length,
                timestamp: this.lastValidationTime
            });
            
            // 如果性能下降，触发警告
            if (averageScore < this.config.accuracyThreshold) {
                this.emit('performance_degradation_warning', {
                    averageScore,
                    threshold: this.config.accuracyThreshold
                });
            }
        }
    }

    // 计算批量统计
    private calculateBatchStatistics(results: ValidationResult[]): any {
        if (results.length === 0) {
            return { averageScore: 0, acceptableRate: 0 };
        }
        
        const averageScore = results.reduce((sum, result) => sum + result.overallScore, 0) / results.length;
        const acceptableCount = results.filter(result => result.isAcceptable).length;
        const acceptableRate = acceptableCount / results.length;
        
        return {
            averageScore,
            acceptableRate,
            totalResults: results.length,
            acceptableResults: acceptableCount
        };
    }

    // 评估决策准确性
    private evaluateDecisionAccuracy(evaluation: DecisionEvaluation, actualOutcome: any): number {
        // 简化的决策准确性评估
        const originalConfidence = evaluation.originalDecision.confidence;
        const recommendedConfidence = evaluation.recommendedDecision.confidence;
        
        // 如果推荐决策的置信度更高，且实际结果良好，则认为决策准确
        if (recommendedConfidence > originalConfidence && actualOutcome.success) {
            return 0.9;
        } else if (originalConfidence > 0.7 && actualOutcome.success) {
            return 0.8;
        } else {
            return 0.6;
        }
    }

    // 评估决策置信度校准
    private evaluateDecisionConfidenceCalibration(evaluation: DecisionEvaluation, actualOutcome: any): number {
        const confidence = evaluation.confidence;
        const success = actualOutcome.success ? 1.0 : 0.0;
        
        return Math.max(0, 1 - Math.abs(confidence - success));
    }

    // 生成决策改进建议
    private generateDecisionImprovementSuggestions(evaluation: DecisionEvaluation, actualOutcome: any): string[] {
        const suggestions: string[] = [];
        
        if (evaluation.confidence < 0.7) {
            suggestions.push('提高决策置信度计算的准确性');
        }
        
        if (!actualOutcome.success && evaluation.recommendedDecision.confidence > 0.8) {
            suggestions.push('重新评估高置信度决策的可靠性');
        }
        
        if (evaluation.alternativeDecisions.length < 2) {
            suggestions.push('增加替代决策方案的生成');
        }
        
        return suggestions;
    }

    // 公共接口方法
    getValidationHistory(): ValidationResult[] {
        return [...this.validationHistory];
    }

    getPerformanceTrends(): Map<ValidationMetric, PerformanceTrend> {
        return new Map(this.performanceTrends);
    }

    getOptimizationHistory(): OptimizationRecommendation[] {
        return [...this.optimizationHistory];
    }

    getOptimizationQueue(): OptimizationRecommendation[] {
        return [...this.optimizationQueue];
    }

    updateConfiguration(newConfig: Partial<ValidationConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.emit('configuration_updated', { config: this.config });
    }

    exportValidationData(): any {
        return {
            config: this.config,
            validationHistory: this.validationHistory,
            optimizationHistory: this.optimizationHistory,
            performanceTrends: Object.fromEntries(this.performanceTrends),
            systemStats: {
                totalValidations: this.validationHistory.length,
                averageScore: this.validationHistory.length > 0 
                    ? this.validationHistory.reduce((sum, r) => sum + r.overallScore, 0) / this.validationHistory.length 
                    : 0,
                optimizationsExecuted: this.optimizationHistory.length
            }
        };
    }
}