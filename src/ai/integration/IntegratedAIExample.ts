import { MasterAICoordinator, AIDecisionContext, AIComponentWeights } from './MasterAICoordinator';
import { AIPerformanceOptimizer } from './AIPerformanceOptimizer';
import { ConflictResolutionEngine } from './ConflictResolutionEngine';
import { AdaptiveAISwitcher } from './AdaptiveAISwitcher';
import { AIMonitoringAnalytics } from './AIMonitoringAnalytics';

import { NetworkArchitecture, TrainingConfig } from '../strategy/DeepStrategyNetwork';
import { OptimizationConfig } from '../strategy/StrategyOptimizer';
import { SchedulerConfig } from '../strategy/AdaptiveLearningScheduler';
import { IntegrationConfig } from '../strategy/StrategyGameIntegration';
import { BenchmarkConfig } from '../strategy/StrategyPerformanceEvaluator';
import { PredictionConfig } from '../prediction/PredictiveAI';

import { GameEngine } from '../../game/engine/GameEngine';
import { Player } from '../../game/models/Player';

export interface IntegratedAISystemConfig {
    networkArchitecture: NetworkArchitecture;
    trainingConfig: TrainingConfig;
    optimizationConfig: OptimizationConfig;
    schedulerConfig: SchedulerConfig;
    integrationConfig: IntegrationConfig;
    benchmarkConfig: BenchmarkConfig;
    predictionConfig: PredictionConfig;
    initialWeights: AIComponentWeights;
    enableMonitoring: boolean;
    enableOptimization: boolean;
    enableAdaptiveSwitching: boolean;
    enableConflictResolution: boolean;
}

export interface AISystemStatus {
    isRunning: boolean;
    overallHealth: number;
    componentStatuses: Record<string, any>;
    currentWeights: AIComponentWeights;
    performanceMetrics: any;
    activeAlerts: number;
    lastOptimization: number;
    systemUptime: number;
}

export interface IntegratedDecisionResult {
    decision: any;
    metadata: {
        processingTime: number;
        componentsUsed: string[];
        conflictsResolved: number;
        confidenceScore: number;
        optimizationApplied: boolean;
        monitoringData: any;
    };
}

export class IntegratedAIExample {
    private masterCoordinator: MasterAICoordinator;
    private performanceOptimizer: AIPerformanceOptimizer;
    private conflictResolver: ConflictResolutionEngine;
    private adaptiveSwitcher: AdaptiveAISwitcher;
    private monitoringAnalytics: AIMonitoringAnalytics;
    
    private gameEngine: GameEngine;
    private config: IntegratedAISystemConfig;
    private systemStartTime: number;
    private isInitialized: boolean;
    private performanceHistory: any[];
    private decisionCount: number;

    constructor(gameEngine: GameEngine, config?: Partial<IntegratedAISystemConfig>) {
        this.gameEngine = gameEngine;
        this.config = this.initializeConfig(config);
        this.systemStartTime = Date.now();
        this.isInitialized = false;
        this.performanceHistory = [];
        this.decisionCount = 0;
        
        this.initializeSystem();
    }

    private initializeConfig(config?: Partial<IntegratedAISystemConfig>): IntegratedAISystemConfig {
        return {
            networkArchitecture: {
                inputDimension: 32,
                outputDimension: 7,
                hiddenLayers: [
                    { type: 'dense', units: 128, activation: 'relu', dropout: 0.3 },
                    { type: 'dense', units: 64, activation: 'relu', dropout: 0.2 },
                    { type: 'dense', units: 32, activation: 'relu', dropout: 0.1 }
                ]
            },
            trainingConfig: {
                optimizer: 'adam',
                learningRate: 0.001,
                epochs: 100,
                batchSize: 32,
                validationSplit: 0.2,
                earlyStopping: true,
                patience: 10
            },
            optimizationConfig: {
                algorithm: 'genetic_algorithm',
                populationSize: 50,
                generations: 100,
                mutationRate: 0.1,
                crossoverRate: 0.8,
                elitismRate: 0.1,
                fitnessThreshold: 0.95,
                constraintHandling: 'penalty_function',
                objectiveWeights: { performance: 0.4, efficiency: 0.3, stability: 0.3 }
            },
            schedulerConfig: {
                strategy: 'adaptive',
                initialLearningRate: 0.001,
                patience: 5,
                factor: 0.5,
                minLearningRate: 0.0001,
                warmupSteps: 100,
                targetMetric: 'validation_loss'
            },
            integrationConfig: {
                cacheSize: 1000,
                timeoutMs: 5000,
                enableFallback: true,
                fallbackStrategy: 'conservative',
                performanceThreshold: 0.7,
                adaptiveMode: true
            },
            benchmarkConfig: {
                benchmarkSuites: ['standard', 'advanced', 'stress_test'],
                metricsToTrack: ['accuracy', 'speed', 'stability', 'robustness'],
                comparisonBaselines: ['random', 'heuristic', 'previous_best'],
                reportGeneration: true,
                detailedAnalysis: true
            },
            predictionConfig: {
                horizon: 'medium',
                confidence: 0.8,
                iterations: 1000,
                enableCaching: true,
                adaptivePrediction: true,
                multiHorizonPrediction: true,
                uncertaintyQuantification: true
            },
            initialWeights: {
                strategyNetwork: 0.3,
                predictiveAI: 0.25,
                planningAlgorithm: 0.2,
                behaviorTree: 0.15,
                reinforcementLearning: 0.1
            },
            enableMonitoring: true,
            enableOptimization: true,
            enableAdaptiveSwitching: true,
            enableConflictResolution: true,
            ...config
        };
    }

    private async initializeSystem(): Promise<void> {
        console.log('🚀 Initializing Integrated AI System...');

        try {
            this.masterCoordinator = new MasterAICoordinator(
                this.config.networkArchitecture,
                this.config.trainingConfig,
                this.config.optimizationConfig,
                this.config.schedulerConfig,
                this.config.integrationConfig,
                this.config.benchmarkConfig,
                this.config.predictionConfig,
                this.gameEngine
            );

            if (this.config.enableOptimization) {
                this.performanceOptimizer = new AIPerformanceOptimizer(this.config.initialWeights);
                console.log('✅ Performance Optimizer initialized');
            }

            if (this.config.enableConflictResolution) {
                this.conflictResolver = new ConflictResolutionEngine();
                console.log('✅ Conflict Resolution Engine initialized');
            }

            if (this.config.enableAdaptiveSwitching) {
                this.adaptiveSwitcher = new AdaptiveAISwitcher(
                    this.config.initialWeights,
                    {
                        performanceThreshold: 0.7,
                        switchingCooldown: 30000,
                        learningRate: 0.01,
                        explorationRate: 0.1,
                        confidenceThreshold: 0.8
                    }
                );
                console.log('✅ Adaptive AI Switcher initialized');
            }

            if (this.config.enableMonitoring) {
                this.monitoringAnalytics = new AIMonitoringAnalytics({
                    collectInterval: 5000,
                    enableRealTimeAlerts: true,
                    enablePredictiveAnalytics: true,
                    enableAnomalyDetection: true
                });
                console.log('✅ Monitoring & Analytics initialized');
            }

            await this.runInitialSystemTest();
            
            this.isInitialized = true;
            console.log('🎉 Integrated AI System successfully initialized!');

        } catch (error) {
            console.error('❌ Failed to initialize Integrated AI System:', error);
            throw error;
        }
    }

    private async runInitialSystemTest(): Promise<void> {
        console.log('🧪 Running initial system health check...');
        
        const testContext: AIDecisionContext = {
            playerId: 'test_player',
            gameState: this.generateMockGameState(),
            timeConstraint: 3000,
            riskTolerance: 0.5,
            strategicObjective: 'system_test',
            historicalPerformance: []
        };

        try {
            const healthCheckResult = await this.masterCoordinator.healthCheck();
            if (!healthCheckResult) {
                throw new Error('Master Coordinator health check failed');
            }

            const testDecision = await this.masterCoordinator.makeUnifiedDecision(testContext);
            if (!testDecision || testDecision.confidence < 0.2) {
                throw new Error('Test decision failed or low confidence');
            }

            console.log('✅ System health check passed');
            console.log(`   Test decision confidence: ${(testDecision.confidence * 100).toFixed(1)}%`);
            console.log(`   Recommended action: ${testDecision.recommendedAction}`);

        } catch (error) {
            console.error('❌ System health check failed:', error);
            throw error;
        }
    }

    public async makeIntelligentDecision(context: AIDecisionContext): Promise<IntegratedDecisionResult> {
        if (!this.isInitialized) {
            throw new Error('System not initialized. Call initializeSystem() first.');
        }

        const startTime = Date.now();
        this.decisionCount++;

        console.log(`\n🧠 Making intelligent decision #${this.decisionCount} for player ${context.playerId}`);
        console.log(`   Strategic objective: ${context.strategicObjective}`);
        console.log(`   Risk tolerance: ${(context.riskTolerance * 100).toFixed(0)}%`);
        console.log(`   Time constraint: ${context.timeConstraint}ms`);

        try {
            let adaptiveSwitchingResult = null;
            if (this.config.enableAdaptiveSwitching && this.adaptiveSwitcher) {
                const currentPerformance = this.getCurrentPerformanceMetrics();
                const componentStatuses = this.masterCoordinator.getSystemStatus().componentStatuses;
                
                adaptiveSwitchingResult = await this.adaptiveSwitcher.evaluateSwitching(
                    currentPerformance,
                    context,
                    new Map(Object.entries(componentStatuses))
                );

                if (adaptiveSwitchingResult.shouldSwitch && adaptiveSwitchingResult.recommendedWeights) {
                    console.log(`🔄 Adaptive switching triggered: ${adaptiveSwitchingResult.reason}`);
                    await this.adaptiveSwitcher.executeSwitching(
                        adaptiveSwitchingResult.recommendedWeights,
                        'adaptive_decision',
                        adaptiveSwitchingResult.reason,
                        context
                    );
                }
            }

            const decision = await this.masterCoordinator.makeUnifiedDecision(context);
            
            const processingTime = Date.now() - startTime;
            
            const result: IntegratedDecisionResult = {
                decision,
                metadata: {
                    processingTime,
                    componentsUsed: Object.keys(decision.componentContributions),
                    conflictsResolved: 0,
                    confidenceScore: decision.confidence,
                    optimizationApplied: adaptiveSwitchingResult?.shouldSwitch || false,
                    monitoringData: this.config.enableMonitoring ? this.monitoringAnalytics.getCurrentMetrics() : null
                }
            };

            await this.postDecisionProcessing(result, context);

            console.log(`✅ Decision completed in ${processingTime}ms`);
            console.log(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
            console.log(`   Action: ${decision.recommendedAction}`);
            console.log(`   Components used: ${result.metadata.componentsUsed.join(', ')}`);

            return result;

        } catch (error) {
            console.error(`❌ Decision making failed for player ${context.playerId}:`, error);
            
            const fallbackDecision = {
                recommendedAction: 'hold',
                confidence: 0.3,
                reasoning: ['Fallback decision due to system error'],
                alternativeOptions: ['wait', 'reassess'],
                expectedOutcome: { action: 'hold', risk: 'low' },
                riskAssessment: { level: 'low', factors: ['system_error'] },
                executionPlan: { steps: [{ action: 'hold', priority: 1 }], timeline: 'immediate' },
                componentContributions: { fallback: 1.0 },
                decisionMetadata: { error: true, timestamp: Date.now() }
            };

            return {
                decision: fallbackDecision,
                metadata: {
                    processingTime: Date.now() - startTime,
                    componentsUsed: ['fallback'],
                    conflictsResolved: 0,
                    confidenceScore: 0.3,
                    optimizationApplied: false,
                    monitoringData: null
                }
            };
        }
    }

    private async postDecisionProcessing(result: IntegratedDecisionResult, context: AIDecisionContext): Promise<void> {
        if (this.config.enableMonitoring && this.monitoringAnalytics) {
            const performanceMetrics = this.getCurrentPerformanceMetrics();
            const componentStatuses = this.masterCoordinator.getSystemStatus().componentStatuses;
            const systemStatus = this.getSystemStatus();

            this.monitoringAnalytics.collectMetrics(
                performanceMetrics,
                new Map(Object.entries(componentStatuses)),
                systemStatus
            );
        }

        if (this.config.enableOptimization && this.performanceOptimizer && this.decisionCount % 10 === 0) {
            console.log('🔧 Running periodic optimization...');
            try {
                const recentPerformance = this.performanceHistory.slice(-10);
                if (recentPerformance.length > 0) {
                    const optimizationResult = await this.performanceOptimizer.optimizeWeights(recentPerformance);
                    console.log(`   Optimization completed with ${(optimizationResult.performanceImprovement * 100).toFixed(1)}% improvement`);
                }
            } catch (error) {
                console.warn('⚠️ Optimization failed:', error);
            }
        }

        this.performanceHistory.push({
            decisionAccuracy: result.decision.confidence,
            responseTime: result.metadata.processingTime,
            strategyEffectiveness: 0.7,
            predictionAccuracy: 0.65,
            adaptability: 0.6,
            consistency: 0.7,
            resourceEfficiency: 0.8,
            learningRate: 0.01
        });

        if (this.performanceHistory.length > 100) {
            this.performanceHistory.shift();
        }
    }

    private getCurrentPerformanceMetrics(): any {
        if (this.performanceHistory.length === 0) {
            return {
                decisionAccuracy: 0.7,
                responseTime: 1500,
                strategyEffectiveness: 0.65,
                predictionAccuracy: 0.6,
                adaptability: 0.55,
                consistency: 0.6,
                resourceEfficiency: 0.75,
                learningRate: 0.01
            };
        }

        const recent = this.performanceHistory.slice(-5);
        return {
            decisionAccuracy: recent.reduce((sum, m) => sum + m.decisionAccuracy, 0) / recent.length,
            responseTime: recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length,
            strategyEffectiveness: recent.reduce((sum, m) => sum + m.strategyEffectiveness, 0) / recent.length,
            predictionAccuracy: recent.reduce((sum, m) => sum + m.predictionAccuracy, 0) / recent.length,
            adaptability: recent.reduce((sum, m) => sum + m.adaptability, 0) / recent.length,
            consistency: recent.reduce((sum, m) => sum + m.consistency, 0) / recent.length,
            resourceEfficiency: recent.reduce((sum, m) => sum + m.resourceEfficiency, 0) / recent.length,
            learningRate: recent.reduce((sum, m) => sum + m.learningRate, 0) / recent.length
        };
    }

    private getSystemStatus(): any {
        return {
            cpu: Math.random() * 0.3 + 0.2,
            memory: Math.random() * 0.2 + 0.3,
            network: Math.random() * 0.1 + 0.1,
            storage: Math.random() * 0.2 + 0.4,
            cacheHitRate: Math.random() * 0.2 + 0.7,
            threadPool: Math.random() * 0.3 + 0.4,
            dbConnections: Math.floor(Math.random() * 20) + 5,
            efficiency: Math.random() * 0.2 + 0.6
        };
    }

    public async runComprehensiveDemo(): Promise<void> {
        console.log('\n🎮 Starting Comprehensive AI Integration Demo');
        console.log('=' .repeat(60));

        const demoScenarios = [
            {
                name: 'Strategic Planning Scenario',
                context: {
                    playerId: 'player1',
                    gameState: this.generateGameState('strategic_phase'),
                    timeConstraint: 5000,
                    riskTolerance: 0.3,
                    strategicObjective: 'long_term_growth',
                    historicalPerformance: []
                }
            },
            {
                name: 'High-Pressure Quick Decision',
                context: {
                    playerId: 'player2',
                    gameState: this.generateGameState('urgent_phase'),
                    timeConstraint: 800,
                    riskTolerance: 0.8,
                    strategicObjective: 'immediate_action',
                    historicalPerformance: []
                }
            },
            {
                name: 'Risk-Averse Conservative Play',
                context: {
                    playerId: 'player3',
                    gameState: this.generateGameState('stable_phase'),
                    timeConstraint: 3000,
                    riskTolerance: 0.1,
                    strategicObjective: 'risk_minimization',
                    historicalPerformance: []
                }
            },
            {
                name: 'Complex Multi-Objective Decision',
                context: {
                    playerId: 'player4',
                    gameState: this.generateGameState('complex_phase'),
                    timeConstraint: 4000,
                    riskTolerance: 0.6,
                    strategicObjective: 'balanced_optimization',
                    historicalPerformance: []
                }
            }
        ];

        for (let i = 0; i < demoScenarios.length; i++) {
            const scenario = demoScenarios[i];
            console.log(`\n📋 Scenario ${i + 1}: ${scenario.name}`);
            console.log('-'.repeat(40));

            try {
                const result = await this.makeIntelligentDecision(scenario.context);
                
                console.log('📊 Results Summary:');
                console.log(`   Decision: ${result.decision.recommendedAction}`);
                console.log(`   Confidence: ${(result.decision.confidence * 100).toFixed(1)}%`);
                console.log(`   Processing Time: ${result.metadata.processingTime}ms`);
                console.log(`   Components Used: ${result.metadata.componentsUsed.join(', ')}`);
                
                if (result.decision.reasoning && result.decision.reasoning.length > 0) {
                    console.log(`   Reasoning: ${result.decision.reasoning.slice(0, 2).join('; ')}`);
                }

                await this.simulateDecisionOutcome(result);

            } catch (error) {
                console.error(`❌ Scenario ${i + 1} failed:`, error);
            }

            if (i < demoScenarios.length - 1) {
                console.log('\n⏳ Waiting before next scenario...');
                await this.delay(2000);
            }
        }

        await this.displaySystemSummary();
    }

    private async simulateDecisionOutcome(result: IntegratedDecisionResult): Promise<void> {
        const outcomeQuality = Math.random() * 0.4 + 0.6;
        const performanceImpact = outcomeQuality > 0.7 ? 0.1 : -0.05;
        
        console.log(`📈 Simulated Outcome: ${(outcomeQuality * 100).toFixed(1)}% success rate`);
        
        if (this.config.enableAdaptiveSwitching && this.adaptiveSwitcher) {
            await this.adaptiveSwitcher.evaluateSwitchingOutcome(
                {
                    timestamp: Date.now(),
                    fromConfiguration: this.config.initialWeights,
                    toConfiguration: this.config.initialWeights,
                    triggerRuleId: 'demo_outcome',
                    reason: 'Demo outcome evaluation',
                    success: outcomeQuality > 0.7,
                    performanceImpact,
                    contextSnapshot: {}
                },
                this.getCurrentPerformanceMetrics()
            );
        }
    }

    private async displaySystemSummary(): Promise<void> {
        console.log('\n📊 Integrated AI System Summary');
        console.log('=' .repeat(60));

        const systemStatus = this.getAISystemStatus();
        console.log(`🏥 System Health: ${(systemStatus.overallHealth * 100).toFixed(1)}%`);
        console.log(`⏱️  System Uptime: ${Math.floor(systemStatus.systemUptime / 1000)}s`);
        console.log(`🧮 Decisions Made: ${this.decisionCount}`);
        console.log(`🎯 Current Weights:`, JSON.stringify(systemStatus.currentWeights, null, 2));

        if (this.config.enableMonitoring && this.monitoringAnalytics) {
            const dashboardData = this.monitoringAnalytics.getDashboardData();
            console.log(`🚨 Active Alerts: ${dashboardData.activeAlerts}`);
            console.log(`⚠️  Critical Alerts: ${dashboardData.criticalAlerts}`);
        }

        if (this.config.enableOptimization && this.performanceOptimizer) {
            const optimizationStatus = this.performanceOptimizer.getOptimizationStatus();
            console.log(`🔧 Optimizations Run: ${optimizationStatus.optimizationHistory}`);
        }

        if (this.config.enableAdaptiveSwitching && this.adaptiveSwitcher) {
            const switchingStats = this.adaptiveSwitcher.getSwitchingStatistics();
            console.log(`🔄 AI Switches: ${switchingStats.totalSwitches}`);
            console.log(`✅ Switch Success Rate: ${(switchingStats.successRate * 100).toFixed(1)}%`);
        }

        console.log('\n💡 System Recommendations:');
        const recommendations = this.generateSystemRecommendations();
        recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
        });
    }

    private generateSystemRecommendations(): string[] {
        const recommendations: string[] = [];
        const currentMetrics = this.getCurrentPerformanceMetrics();

        if (currentMetrics.decisionAccuracy < 0.7) {
            recommendations.push('Consider tuning neural network parameters to improve decision accuracy');
        }

        if (currentMetrics.responseTime > 3000) {
            recommendations.push('Optimize performance bottlenecks to reduce response time');
        }

        if (this.config.enableAdaptiveSwitching && this.adaptiveSwitcher) {
            const switchingStats = this.adaptiveSwitcher.getSwitchingStatistics();
            if (switchingStats.successRate < 0.6) {
                recommendations.push('Review adaptive switching rules and thresholds');
            }
        }

        if (this.decisionCount > 50 && this.performanceHistory.length > 20) {
            const recentPerformance = this.performanceHistory.slice(-10);
            const avgAccuracy = recentPerformance.reduce((sum, m) => sum + m.decisionAccuracy, 0) / recentPerformance.length;
            
            if (avgAccuracy > 0.8) {
                recommendations.push('System performing well - consider increasing challenge level');
            }
        }

        if (recommendations.length === 0) {
            recommendations.push('System operating within normal parameters');
        }

        return recommendations;
    }

    public getAISystemStatus(): AISystemStatus {
        const coordinatorStatus = this.masterCoordinator.getSystemStatus();
        const currentMetrics = this.getCurrentPerformanceMetrics();
        
        return {
            isRunning: this.isInitialized,
            overallHealth: currentMetrics.decisionAccuracy * 0.4 + 
                          (1 - Math.min(currentMetrics.responseTime / 5000, 1)) * 0.3 + 
                          currentMetrics.consistency * 0.3,
            componentStatuses: coordinatorStatus.componentStatuses,
            currentWeights: coordinatorStatus.currentWeights,
            performanceMetrics: currentMetrics,
            activeAlerts: this.config.enableMonitoring ? this.monitoringAnalytics.getActiveAlerts().length : 0,
            lastOptimization: Date.now(),
            systemUptime: Date.now() - this.systemStartTime
        };
    }

    private generateMockGameState(): any {
        return {
            currentRound: Math.floor(Math.random() * 20) + 1,
            phase: Math.floor(Math.random() * 4),
            totalFunds: Math.floor(Math.random() * 1000000) + 500000,
            marketVolatility: Math.random() * 0.5 + 0.25,
            players: [
                {
                    id: 'test_player',
                    money: Math.floor(Math.random() * 50000) + 10000,
                    position: Math.floor(Math.random() * 40),
                    properties: Math.floor(Math.random() * 10),
                    buildings: Math.floor(Math.random() * 20),
                    skills: Math.floor(Math.random() * 5)
                }
            ]
        };
    }

    private generateGameState(phase: string): any {
        const baseState = this.generateMockGameState();
        
        switch (phase) {
            case 'strategic_phase':
                baseState.currentRound = Math.floor(Math.random() * 5) + 15;
                baseState.marketVolatility = 0.2;
                break;
            case 'urgent_phase':
                baseState.currentRound = Math.floor(Math.random() * 3) + 1;
                baseState.marketVolatility = 0.8;
                break;
            case 'stable_phase':
                baseState.currentRound = Math.floor(Math.random() * 10) + 5;
                baseState.marketVolatility = 0.1;
                break;
            case 'complex_phase':
                baseState.currentRound = Math.floor(Math.random() * 8) + 8;
                baseState.marketVolatility = 0.4;
                baseState.players.push({
                    id: 'opponent1',
                    money: Math.floor(Math.random() * 60000) + 15000,
                    position: Math.floor(Math.random() * 40),
                    properties: Math.floor(Math.random() * 12),
                    buildings: Math.floor(Math.random() * 25),
                    skills: Math.floor(Math.random() * 6)
                });
                break;
        }
        
        return baseState;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async shutdown(): Promise<void> {
        console.log('\n🛑 Shutting down Integrated AI System...');
        
        if (this.config.enableMonitoring && this.monitoringAnalytics) {
            this.monitoringAnalytics.stopMonitoring();
            console.log('✅ Monitoring stopped');
        }

        console.log(`📊 Final Statistics:`);
        console.log(`   Total decisions made: ${this.decisionCount}`);
        console.log(`   System uptime: ${Math.floor((Date.now() - this.systemStartTime) / 1000)}s`);
        console.log(`   Performance history entries: ${this.performanceHistory.length}`);
        
        console.log('✅ Integrated AI System shutdown complete');
    }

    public static async createAndRunDemo(gameEngine?: GameEngine): Promise<void> {
        const mockGameEngine = gameEngine || new MockGameEngine();
        
        console.log('\n🎯 Integrated AI System - Complete Demo');
        console.log('=' .repeat(60));
        console.log('This demo showcases the full integration of all AI components:');
        console.log('• Master AI Coordinator');
        console.log('• Performance Optimizer'); 
        console.log('• Conflict Resolution Engine');
        console.log('• Adaptive AI Switcher');
        console.log('• Monitoring & Analytics');
        console.log('=' .repeat(60));

        const aiSystem = new IntegratedAIExample(mockGameEngine, {
            enableMonitoring: true,
            enableOptimization: true,
            enableAdaptiveSwitching: true,
            enableConflictResolution: true
        });

        try {
            await aiSystem.runComprehensiveDemo();
            
            console.log('\n✨ Demo completed successfully!');
            console.log('\nKey Features Demonstrated:');
            console.log('✅ Unified decision making across multiple AI components');
            console.log('✅ Automatic performance optimization');
            console.log('✅ Intelligent conflict resolution');
            console.log('✅ Adaptive component switching');
            console.log('✅ Real-time monitoring and analytics');
            console.log('✅ Comprehensive system health tracking');
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        } finally {
            await aiSystem.shutdown();
        }
    }
}

class MockGameEngine {
    public getGameState(): any {
        return {
            currentRound: 10,
            phase: 2,
            totalFunds: 750000,
            marketVolatility: 0.3,
            players: [
                {
                    id: 'player1',
                    money: 25000,
                    position: 15,
                    properties: 5,
                    buildings: 8,
                    skills: 3
                }
            ]
        };
    }

    public executeAction(playerId: string, action: string): boolean {
        console.log(`Mock game engine executing action: ${action} for player ${playerId}`);
        return true;
    }
}

if (require.main === module) {
    IntegratedAIExample.createAndRunDemo().catch(console.error);
}