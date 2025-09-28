import { 
    DifficultyAnalyzer, 
    DifficultyMetrics, 
    PlayerSkillMetrics, 
    GameplayMetrics, 
    DifficultyAnalysisResult,
    DifficultyAdjustmentRecommendation 
} from './DifficultyAnalyzer';

export interface DifficultyAdjustmentStrategy {
    id: string;
    name: string;
    description: string;
    targetMetrics: (keyof DifficultyMetrics)[];
    adjustmentFunction: (current: number, target: number, magnitude: number) => number;
    constraints: {
        minValue: number;
        maxValue: number;
        maxChangePerStep: number;
    };
    cooldownPeriod: number;
    effectiveRange: [number, number]; // Skill level range where this strategy is most effective
}

export interface DifficultyTransition {
    id: string;
    timestamp: number;
    playerId: string;
    fromDifficulty: DifficultyMetrics;
    toDifficulty: DifficultyMetrics;
    strategy: string;
    reason: string;
    expectedImpact: any;
    actualImpact?: any;
    success: boolean;
    playerReaction?: PlayerReactionMetrics;
}

export interface PlayerReactionMetrics {
    satisfactionChange: number;     // -1 to 1
    engagementChange: number;       // -1 to 1
    frustrationChange: number;      // -1 to 1
    performanceChange: number;      // -1 to 1
    retentionLikelihood: number;    // 0 to 1
    adaptationTime: number;         // Time to adapt to new difficulty
}

export interface DifficultyEngineConfig {
    adjustmentFrequency: number;    // How often to check for adjustments (ms)
    minimumDataPoints: number;      // Minimum data points before adjusting
    maxAdjustmentMagnitude: number; // Maximum change per adjustment
    smoothingFactor: number;        // How smooth transitions should be
    emergencyThresholds: {
        frustrationLevel: number;
        engagementLevel: number;
        errorRate: number;
    };
    adaptationTimeouts: {
        minor: number;
        major: number;
        emergency: number;
    };
    validationPeriod: number;       // Time to validate adjustment effects
}

export interface DifficultyPrediction {
    timeHorizon: number;
    predictedPlayerSkill: PlayerSkillMetrics;
    recommendedDifficulty: DifficultyMetrics;
    confidence: number;
    alternativeScenarios: Array<{
        scenario: string;
        probability: number;
        recommendedDifficulty: DifficultyMetrics;
    }>;
}

export interface EmergencyResponse {
    triggered: boolean;
    type: 'frustration' | 'disengagement' | 'overload' | 'boredom';
    severity: 'low' | 'medium' | 'high' | 'critical';
    immediateAction: DifficultyMetrics;
    followUpActions: DifficultyMetrics[];
    estimatedRecoveryTime: number;
}

export class DynamicDifficultyEngine {
    private difficultyAnalyzer: DifficultyAnalyzer;
    private adjustmentStrategies: Map<string, DifficultyAdjustmentStrategy>;
    private transitionHistory: Map<string, DifficultyTransition[]>;
    private currentDifficulties: Map<string, DifficultyMetrics>;
    private adjustmentTimers: Map<string, number>;
    private validationTrackers: Map<string, ValidationTracker>;
    private predictionModels: Map<string, DifficultyPredictionModel>;
    
    private config: DifficultyEngineConfig;
    private isRunning: boolean;
    private lastAdjustmentTime: Map<string, number>;
    private emergencyStates: Map<string, EmergencyResponse>;
    private playerAdaptationTrackers: Map<string, AdaptationProgressTracker>;

    constructor(
        difficultyAnalyzer: DifficultyAnalyzer,
        config?: Partial<DifficultyEngineConfig>
    ) {
        this.difficultyAnalyzer = difficultyAnalyzer;
        this.initializeConfiguration(config);
        this.initializeDataStructures();
        this.initializeAdjustmentStrategies();
        this.initializePredictionModels();
        this.startDifficultyEngine();
    }

    private initializeConfiguration(config?: Partial<DifficultyEngineConfig>): void {
        this.config = {
            adjustmentFrequency: 30000,        // 30 seconds
            minimumDataPoints: 5,
            maxAdjustmentMagnitude: 0.2,
            smoothingFactor: 0.3,
            emergencyThresholds: {
                frustrationLevel: 0.8,
                engagementLevel: 0.3,
                errorRate: 0.5
            },
            adaptationTimeouts: {
                minor: 60000,      // 1 minute
                major: 180000,     // 3 minutes
                emergency: 30000   // 30 seconds
            },
            validationPeriod: 120000,          // 2 minutes
            ...config
        };
    }

    private initializeDataStructures(): void {
        this.adjustmentStrategies = new Map();
        this.transitionHistory = new Map();
        this.currentDifficulties = new Map();
        this.adjustmentTimers = new Map();
        this.validationTrackers = new Map();
        this.predictionModels = new Map();
        this.lastAdjustmentTime = new Map();
        this.emergencyStates = new Map();
        this.playerAdaptationTrackers = new Map();
        this.isRunning = false;
    }

    private initializeAdjustmentStrategies(): void {
        const strategies: DifficultyAdjustmentStrategy[] = [
            {
                id: 'gradual_ai_skill',
                name: 'Gradual AI Skill Adjustment',
                description: 'Smoothly adjust AI skill level to match player capability',
                targetMetrics: ['aiSkillLevel'],
                adjustmentFunction: (current, target, magnitude) => {
                    const change = (target - current) * magnitude * 0.5;
                    return current + Math.max(-0.1, Math.min(0.1, change));
                },
                constraints: {
                    minValue: 0.1,
                    maxValue: 1.0,
                    maxChangePerStep: 0.1
                },
                cooldownPeriod: 45000,
                effectiveRange: [0.0, 1.0]
            },
            {
                id: 'aggressive_response',
                name: 'AI Aggressiveness Tuning',
                description: 'Adjust AI aggressiveness based on player risk tolerance',
                targetMetrics: ['aiAggressiveness'],
                adjustmentFunction: (current, target, magnitude) => {
                    const change = (target - current) * magnitude * 0.7;
                    return current + Math.max(-0.15, Math.min(0.15, change));
                },
                constraints: {
                    minValue: 0.2,
                    maxValue: 0.9,
                    maxChangePerStep: 0.15
                },
                cooldownPeriod: 60000,
                effectiveRange: [0.2, 0.8]
            },
            {
                id: 'complexity_scaling',
                name: 'Game Complexity Scaling',
                description: 'Scale game complexity based on player understanding',
                targetMetrics: ['gameComplexity'],
                adjustmentFunction: (current, target, magnitude) => {
                    const change = (target - current) * magnitude * 0.4;
                    return current + Math.max(-0.08, Math.min(0.08, change));
                },
                constraints: {
                    minValue: 0.3,
                    maxValue: 1.0,
                    maxChangePerStep: 0.08
                },
                cooldownPeriod: 90000,
                effectiveRange: [0.0, 1.0]
            },
            {
                id: 'time_pressure_modulation',
                name: 'Time Pressure Modulation',
                description: 'Adjust time constraints based on decision speed',
                targetMetrics: ['timePresssure'],
                adjustmentFunction: (current, target, magnitude) => {
                    const change = (target - current) * magnitude * 0.6;
                    return current + Math.max(-0.12, Math.min(0.12, change));
                },
                constraints: {
                    minValue: 0.1,
                    maxValue: 0.8,
                    maxChangePerStep: 0.12
                },
                cooldownPeriod: 30000,
                effectiveRange: [0.1, 0.9]
            },
            {
                id: 'market_volatility_tuning',
                name: 'Market Volatility Tuning',
                description: 'Adjust market unpredictability based on adaptation skills',
                targetMetrics: ['marketVolatility'],
                adjustmentFunction: (current, target, magnitude) => {
                    const change = (target - current) * magnitude * 0.5;
                    return current + Math.max(-0.1, Math.min(0.1, change));
                },
                constraints: {
                    minValue: 0.2,
                    maxValue: 0.8,
                    maxChangePerStep: 0.1
                },
                cooldownPeriod: 120000,
                effectiveRange: [0.3, 0.8]
            },
            {
                id: 'resource_scarcity_adjustment',
                name: 'Resource Scarcity Adjustment',
                description: 'Modify resource availability based on optimization skills',
                targetMetrics: ['resourceScarcity'],
                adjustmentFunction: (current, target, magnitude) => {
                    const change = (target - current) * magnitude * 0.4;
                    return current + Math.max(-0.08, Math.min(0.08, change));
                },
                constraints: {
                    minValue: 0.2,
                    maxValue: 0.9,
                    maxChangePerStep: 0.08
                },
                cooldownPeriod: 150000,
                effectiveRange: [0.2, 0.9]
            },
            {
                id: 'emergency_difficulty_reduction',
                name: 'Emergency Difficulty Reduction',
                description: 'Rapidly reduce difficulty during high frustration',
                targetMetrics: ['overallDifficulty', 'aiAggressiveness', 'timePresssure'],
                adjustmentFunction: (current, target, magnitude) => {
                    const reduction = magnitude * 0.3;
                    return Math.max(0.1, current - reduction);
                },
                constraints: {
                    minValue: 0.1,
                    maxValue: 1.0,
                    maxChangePerStep: 0.3
                },
                cooldownPeriod: 15000,
                effectiveRange: [0.0, 1.0]
            },
            {
                id: 'flow_state_optimization',
                name: 'Flow State Optimization',
                description: 'Fine-tune difficulty to maintain optimal flow state',
                targetMetrics: ['overallDifficulty'],
                adjustmentFunction: (current, target, magnitude) => {
                    const optimalDiff = target;
                    const change = (optimalDiff - current) * magnitude * 0.2;
                    return current + Math.max(-0.05, Math.min(0.05, change));
                },
                constraints: {
                    minValue: 0.2,
                    maxValue: 0.9,
                    maxChangePerStep: 0.05
                },
                cooldownPeriod: 45000,
                effectiveRange: [0.3, 0.8]
            }
        ];

        strategies.forEach(strategy => this.adjustmentStrategies.set(strategy.id, strategy));
    }

    private initializePredictionModels(): void {
        this.predictionModels.set('skill_progression', new SkillProgressionPredictionModel());
        this.predictionModels.set('engagement_prediction', new EngagementPredictionModel());
        this.predictionModels.set('difficulty_response', new DifficultyResponsePredictionModel());
    }

    private startDifficultyEngine(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        console.log('🎯 Dynamic Difficulty Engine started');

        // Main adjustment loop
        setInterval(() => {
            this.processAllPlayers();
        }, this.config.adjustmentFrequency);

        // Emergency monitoring loop (more frequent)
        setInterval(() => {
            this.monitorEmergencyStates();
        }, 10000);

        // Validation loop
        setInterval(() => {
            this.validateAdjustments();
        }, this.config.validationPeriod);
    }

    public async processDifficultyAdjustment(
        playerId: string,
        gameData: any,
        performanceData: any
    ): Promise<DifficultyTransition | null> {
        try {
            // Analyze current player state
            const playerSkill = await this.difficultyAnalyzer.analyzePlayerSkill(playerId, gameData, performanceData);
            const gameplayQuality = await this.difficultyAnalyzer.analyzeGameplayQuality(playerId, gameData);
            const currentDifficulty = this.getCurrentDifficulty(playerId);

            // Perform difficulty analysis
            const analysis = await this.difficultyAnalyzer.analyzeDifficultyGap(
                playerId,
                currentDifficulty,
                playerSkill,
                gameplayQuality
            );

            // Check for emergency situations
            const emergencyResponse = this.checkEmergencyConditions(playerId, gameplayQuality);
            if (emergencyResponse.triggered) {
                return await this.executeEmergencyAdjustment(playerId, emergencyResponse, analysis);
            }

            // Check if adjustment is needed and allowed
            if (!this.shouldAdjustDifficulty(playerId, analysis)) {
                return null;
            }

            // Select and execute adjustment strategy
            const strategy = this.selectAdjustmentStrategy(playerId, analysis, playerSkill);
            const transition = await this.executeAdjustment(playerId, strategy, analysis);

            // Record and track the adjustment
            this.recordTransition(playerId, transition);
            this.startValidationTracking(playerId, transition);

            return transition;

        } catch (error) {
            console.error(`Error processing difficulty adjustment for player ${playerId}:`, error);
            return null;
        }
    }

    private getCurrentDifficulty(playerId: string): DifficultyMetrics {
        if (!this.currentDifficulties.has(playerId)) {
            // Initialize with default difficulty
            this.currentDifficulties.set(playerId, {
                aiAggressiveness: 0.5,
                aiSkillLevel: 0.5,
                gameComplexity: 0.5,
                timePresssure: 0.5,
                resourceScarcity: 0.5,
                marketVolatility: 0.5,
                randomEventFrequency: 0.5,
                competitionIntensity: 0.5,
                overallDifficulty: 0.5
            });
        }
        return this.currentDifficulties.get(playerId)!;
    }

    private checkEmergencyConditions(playerId: string, gameplay: GameplayMetrics): EmergencyResponse {
        const thresholds = this.config.emergencyThresholds;
        let emergencyType: EmergencyResponse['type'] | null = null;
        let severity: EmergencyResponse['severity'] = 'low';

        // Check frustration level
        if (gameplay.frustrationLevel > thresholds.frustrationLevel) {
            emergencyType = 'frustration';
            severity = gameplay.frustrationLevel > 0.9 ? 'critical' : 'high';
        }

        // Check engagement level
        if (gameplay.engagementLevel < thresholds.engagementLevel) {
            emergencyType = emergencyType || 'disengagement';
            severity = gameplay.engagementLevel < 0.2 ? 'critical' : 'medium';
        }

        // Check error rate
        if (gameplay.errorRate > thresholds.errorRate) {
            emergencyType = emergencyType || 'overload';
            severity = gameplay.errorRate > 0.7 ? 'critical' : 'high';
        }

        // Check for boredom (high skill, low challenge)
        if (gameplay.flowStateIndicator < 0.3 && gameplay.engagementLevel < 0.5) {
            emergencyType = emergencyType || 'boredom';
            severity = 'medium';
        }

        const triggered = emergencyType !== null;
        
        if (triggered) {
            console.warn(`🚨 Emergency condition detected for player ${playerId}: ${emergencyType} (${severity})`);
        }

        return {
            triggered,
            type: emergencyType || 'frustration',
            severity,
            immediateAction: this.calculateEmergencyAdjustment(emergencyType, severity),
            followUpActions: this.calculateFollowUpActions(emergencyType, severity),
            estimatedRecoveryTime: this.estimateRecoveryTime(emergencyType, severity)
        };
    }

    private calculateEmergencyAdjustment(type: string, severity: string): DifficultyMetrics {
        const baseReduction = severity === 'critical' ? 0.4 : severity === 'high' ? 0.3 : 0.2;
        
        return {
            aiAggressiveness: Math.max(0.1, 0.5 - baseReduction),
            aiSkillLevel: Math.max(0.2, 0.5 - baseReduction * 0.8),
            gameComplexity: Math.max(0.3, 0.5 - baseReduction * 0.6),
            timePresssure: Math.max(0.1, 0.5 - baseReduction),
            resourceScarcity: Math.max(0.2, 0.5 - baseReduction * 0.7),
            marketVolatility: Math.max(0.2, 0.5 - baseReduction * 0.5),
            randomEventFrequency: Math.max(0.1, 0.5 - baseReduction * 0.8),
            competitionIntensity: Math.max(0.2, 0.5 - baseReduction * 0.9),
            overallDifficulty: Math.max(0.2, 0.5 - baseReduction)
        };
    }

    private calculateFollowUpActions(type: string, severity: string): DifficultyMetrics[] {
        // Return a series of gradual adjustments to bring difficulty back up
        const actions: DifficultyMetrics[] = [];
        const steps = severity === 'critical' ? 5 : 3;
        
        for (let i = 1; i <= steps; i++) {
            const progress = i / steps;
            const targetDifficulty = 0.2 + (0.3 * progress); // Gradually increase to 0.5
            
            actions.push({
                aiAggressiveness: targetDifficulty,
                aiSkillLevel: targetDifficulty + 0.1,
                gameComplexity: targetDifficulty + 0.05,
                timePresssure: targetDifficulty,
                resourceScarcity: targetDifficulty + 0.05,
                marketVolatility: targetDifficulty,
                randomEventFrequency: targetDifficulty,
                competitionIntensity: targetDifficulty,
                overallDifficulty: targetDifficulty
            });
        }
        
        return actions;
    }

    private estimateRecoveryTime(type: string, severity: string): number {
        const baseTime = {
            frustration: 180000,    // 3 minutes
            disengagement: 120000,  // 2 minutes
            overload: 240000,       // 4 minutes
            boredom: 60000          // 1 minute
        };
        
        const multiplier = severity === 'critical' ? 2 : severity === 'high' ? 1.5 : 1;
        return (baseTime[type as keyof typeof baseTime] || 120000) * multiplier;
    }

    private shouldAdjustDifficulty(playerId: string, analysis: DifficultyAnalysisResult): boolean {
        // Check minimum confidence
        if (analysis.confidence < 0.6) {
            return false;
        }

        // Check minimum gap threshold
        if (Math.abs(analysis.difficultyGap) < 0.15) {
            return false;
        }

        // Check cooldown period
        const lastAdjustment = this.lastAdjustmentTime.get(playerId) || 0;
        const timeSinceLastAdjustment = Date.now() - lastAdjustment;
        
        if (timeSinceLastAdjustment < this.config.adaptationTimeouts.minor) {
            return false;
        }

        // Check if player is currently adapting
        const adaptationTracker = this.getAdaptationTracker(playerId);
        if (adaptationTracker.isCurrentlyAdapting()) {
            return false;
        }

        return true;
    }

    private selectAdjustmentStrategy(
        playerId: string,
        analysis: DifficultyAnalysisResult,
        playerSkill: PlayerSkillMetrics
    ): DifficultyAdjustmentStrategy {
        const recommendation = analysis.adjustmentRecommendation;
        const skillLevel = playerSkill.overallSkillLevel;
        
        // Emergency strategy for high priority adjustments
        if (recommendation.priority === 'critical') {
            return this.adjustmentStrategies.get('emergency_difficulty_reduction')!;
        }

        // Flow state optimization for balanced players
        if (analysis.gameplayQuality.flowStateIndicator > 0.5 && Math.abs(analysis.difficultyGap) < 0.3) {
            return this.adjustmentStrategies.get('flow_state_optimization')!;
        }

        // Select strategy based on which metrics need the most adjustment
        const strategies = Array.from(this.adjustmentStrategies.values()).filter(strategy => {
            const [minSkill, maxSkill] = strategy.effectiveRange;
            return skillLevel >= minSkill && skillLevel <= maxSkill;
        });

        // Prioritize strategies based on recommendation
        let bestStrategy = strategies[0];
        let bestScore = 0;

        strategies.forEach(strategy => {
            let score = 0;
            
            // Score based on target metrics alignment
            strategy.targetMetrics.forEach(metric => {
                if (recommendation.targetMetrics[metric] !== undefined) {
                    score += 1;
                }
            });
            
            // Score based on priority
            if (recommendation.priority === 'high') score += 2;
            if (recommendation.priority === 'medium') score += 1;
            
            if (score > bestScore) {
                bestScore = score;
                bestStrategy = strategy;
            }
        });

        return bestStrategy || this.adjustmentStrategies.get('gradual_ai_skill')!;
    }

    private async executeAdjustment(
        playerId: string,
        strategy: DifficultyAdjustmentStrategy,
        analysis: DifficultyAnalysisResult
    ): Promise<DifficultyTransition> {
        const currentDifficulty = this.getCurrentDifficulty(playerId);
        const recommendation = analysis.adjustmentRecommendation;
        const newDifficulty = { ...currentDifficulty };

        // Apply strategy to each target metric
        strategy.targetMetrics.forEach(metric => {
            const currentValue = currentDifficulty[metric];
            const targetValue = recommendation.targetMetrics[metric] || currentValue;
            const magnitude = Math.min(recommendation.magnitude, strategy.constraints.maxChangePerStep);
            
            const newValue = strategy.adjustmentFunction(currentValue, targetValue, magnitude);
            const constrainedValue = Math.max(
                strategy.constraints.minValue,
                Math.min(strategy.constraints.maxValue, newValue)
            );
            
            newDifficulty[metric] = constrainedValue;
        });

        // Update overall difficulty
        newDifficulty.overallDifficulty = this.calculateOverallDifficulty(newDifficulty);

        // Apply smoothing
        const smoothedDifficulty = this.applySmoothTransition(
            currentDifficulty,
            newDifficulty,
            this.config.smoothingFactor
        );

        // Create transition record
        const transition: DifficultyTransition = {
            id: `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            playerId,
            fromDifficulty: currentDifficulty,
            toDifficulty: smoothedDifficulty,
            strategy: strategy.id,
            reason: recommendation.reasoning.join('; '),
            expectedImpact: recommendation.expectedImpact,
            success: true
        };

        // Update current difficulty
        this.currentDifficulties.set(playerId, smoothedDifficulty);
        this.lastAdjustmentTime.set(playerId, Date.now());

        console.log(`🎯 Difficulty adjusted for player ${playerId}: ${strategy.name}`);
        console.log(`   Direction: ${recommendation.direction}, Magnitude: ${recommendation.magnitude.toFixed(2)}`);
        console.log(`   Overall Difficulty: ${currentDifficulty.overallDifficulty.toFixed(2)} → ${smoothedDifficulty.overallDifficulty.toFixed(2)}`);

        return transition;
    }

    private async executeEmergencyAdjustment(
        playerId: string,
        emergency: EmergencyResponse,
        analysis: DifficultyAnalysisResult
    ): Promise<DifficultyTransition> {
        const currentDifficulty = this.getCurrentDifficulty(playerId);
        const emergencyDifficulty = emergency.immediateAction;

        const transition: DifficultyTransition = {
            id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            playerId,
            fromDifficulty: currentDifficulty,
            toDifficulty: emergencyDifficulty,
            strategy: 'emergency_response',
            reason: `Emergency response to ${emergency.type} (${emergency.severity})`,
            expectedImpact: {
                engagementChange: 0.3,
                frustrationChange: -0.5,
                flowStateChange: 0.2,
                retentionChange: 0.4
            },
            success: true
        };

        // Immediately apply emergency difficulty
        this.currentDifficulties.set(playerId, emergencyDifficulty);
        this.lastAdjustmentTime.set(playerId, Date.now());
        this.emergencyStates.set(playerId, emergency);

        // Schedule follow-up actions
        this.scheduleFollowUpActions(playerId, emergency);

        console.log(`🚨 Emergency difficulty adjustment for player ${playerId}: ${emergency.type}`);
        console.log(`   Severity: ${emergency.severity}`);
        console.log(`   Recovery time: ${Math.floor(emergency.estimatedRecoveryTime / 1000)}s`);

        return transition;
    }

    private scheduleFollowUpActions(playerId: string, emergency: EmergencyResponse): void {
        const followUpActions = emergency.followUpActions;
        const intervalTime = emergency.estimatedRecoveryTime / followUpActions.length;

        followUpActions.forEach((difficulty, index) => {
            setTimeout(() => {
                if (this.emergencyStates.has(playerId)) {
                    this.currentDifficulties.set(playerId, difficulty);
                    console.log(`🔄 Follow-up difficulty adjustment ${index + 1}/${followUpActions.length} for player ${playerId}`);
                    
                    // Clear emergency state after final action
                    if (index === followUpActions.length - 1) {
                        this.emergencyStates.delete(playerId);
                        console.log(`✅ Emergency recovery complete for player ${playerId}`);
                    }
                }
            }, intervalTime * (index + 1));
        });
    }

    private calculateOverallDifficulty(difficulty: DifficultyMetrics): number {
        const weights = {
            aiSkillLevel: 0.25,
            aiAggressiveness: 0.20,
            gameComplexity: 0.15,
            timePresssure: 0.15,
            marketVolatility: 0.10,
            resourceScarcity: 0.10,
            competitionIntensity: 0.05
        };

        let weightedSum = 0;
        Object.entries(weights).forEach(([metric, weight]) => {
            weightedSum += difficulty[metric as keyof DifficultyMetrics] * weight;
        });

        return Math.max(0, Math.min(1, weightedSum));
    }

    private applySmoothTransition(
        from: DifficultyMetrics,
        to: DifficultyMetrics,
        smoothingFactor: number
    ): DifficultyMetrics {
        const smoothed: Partial<DifficultyMetrics> = {};

        Object.keys(from).forEach(key => {
            const metric = key as keyof DifficultyMetrics;
            const fromValue = from[metric];
            const toValue = to[metric];
            smoothed[metric] = fromValue + (toValue - fromValue) * smoothingFactor;
        });

        return smoothed as DifficultyMetrics;
    }

    private recordTransition(playerId: string, transition: DifficultyTransition): void {
        if (!this.transitionHistory.has(playerId)) {
            this.transitionHistory.set(playerId, []);
        }

        const history = this.transitionHistory.get(playerId)!;
        history.push(transition);

        // Keep only recent history
        if (history.length > 50) {
            history.shift();
        }
    }

    private startValidationTracking(playerId: string, transition: DifficultyTransition): void {
        const tracker = new ValidationTracker(transition, this.config.validationPeriod);
        this.validationTrackers.set(transition.id, tracker);

        // Schedule validation
        setTimeout(() => {
            this.validateTransition(transition.id);
        }, this.config.validationPeriod);
    }

    private async validateTransition(transitionId: string): Promise<void> {
        const tracker = this.validationTrackers.get(transitionId);
        if (!tracker) return;

        const transition = tracker.getTransition();
        const playerId = transition.playerId;

        try {
            // Collect post-adjustment data
            const postAdjustmentData = await this.collectValidationData(playerId);
            const actualImpact = this.calculateActualImpact(transition, postAdjustmentData);
            
            // Update transition with actual results
            transition.actualImpact = actualImpact;
            transition.playerReaction = postAdjustmentData.playerReaction;

            // Evaluate success
            const success = this.evaluateAdjustmentSuccess(transition);
            transition.success = success;

            // Learn from the result
            this.updatePredictionModels(transition);

            console.log(`📊 Validation complete for transition ${transitionId}: ${success ? 'Success' : 'Failed'}`);

        } catch (error) {
            console.error(`Error validating transition ${transitionId}:`, error);
        } finally {
            this.validationTrackers.delete(transitionId);
        }
    }

    private async collectValidationData(playerId: string): Promise<any> {
        // This would collect actual player data post-adjustment
        // For now, return simulated data
        return {
            playerReaction: {
                satisfactionChange: Math.random() * 0.4 - 0.2,
                engagementChange: Math.random() * 0.6 - 0.3,
                frustrationChange: Math.random() * 0.4 - 0.2,
                performanceChange: Math.random() * 0.3 - 0.15,
                retentionLikelihood: Math.random() * 0.3 + 0.7,
                adaptationTime: Math.random() * 60000 + 30000
            },
            gameplayMetrics: {
                // Post-adjustment gameplay metrics would be collected here
            }
        };
    }

    private calculateActualImpact(transition: DifficultyTransition, validationData: any): any {
        return {
            engagementChange: validationData.playerReaction.engagementChange,
            frustrationChange: validationData.playerReaction.frustrationChange,
            flowStateChange: (validationData.playerReaction.engagementChange - validationData.playerReaction.frustrationChange) * 0.5,
            retentionChange: validationData.playerReaction.retentionLikelihood - 0.7
        };
    }

    private evaluateAdjustmentSuccess(transition: DifficultyTransition): boolean {
        if (!transition.actualImpact || !transition.expectedImpact) return false;

        const actual = transition.actualImpact;
        const expected = transition.expectedImpact;

        // Check if actual impact aligns with expected impact
        const engagementSuccess = Math.abs(actual.engagementChange - expected.engagementChange) < 0.3;
        const frustrationSuccess = Math.abs(actual.frustrationChange - expected.frustrationChange) < 0.3;
        const retentionSuccess = actual.retentionChange > -0.1;

        return engagementSuccess && frustrationSuccess && retentionSuccess;
    }

    private updatePredictionModels(transition: DifficultyTransition): void {
        this.predictionModels.forEach(model => {
            model.learn(transition);
        });
    }

    public async predictOptimalDifficulty(
        playerId: string,
        timeHorizon: number
    ): Promise<DifficultyPrediction> {
        const skillModel = this.predictionModels.get('skill_progression')!;
        const engagementModel = this.predictionModels.get('engagement_prediction')!;
        const responseModel = this.predictionModels.get('difficulty_response')!;

        const predictedSkill = await skillModel.predictSkill(playerId, timeHorizon);
        const recommendedDifficulty = await responseModel.predictOptimalDifficulty(playerId, predictedSkill);
        const confidence = await this.calculatePredictionConfidence(playerId, timeHorizon);

        const alternativeScenarios = await this.generateAlternativeScenarios(playerId, predictedSkill);

        return {
            timeHorizon,
            predictedPlayerSkill: predictedSkill,
            recommendedDifficulty,
            confidence,
            alternativeScenarios
        };
    }

    private async calculatePredictionConfidence(playerId: string, timeHorizon: number): Promise<number> {
        const history = this.transitionHistory.get(playerId) || [];
        const dataPoints = history.length;
        
        let confidence = Math.min(1, dataPoints / 10);
        
        // Reduce confidence for longer time horizons
        confidence *= Math.max(0.3, 1 - timeHorizon / 3600000); // 1 hour = max horizon
        
        return confidence;
    }

    private async generateAlternativeScenarios(playerId: string, predictedSkill: PlayerSkillMetrics): Promise<any[]> {
        return [
            {
                scenario: 'conservative',
                probability: 0.3,
                recommendedDifficulty: this.createConservativeDifficulty(predictedSkill)
            },
            {
                scenario: 'aggressive',
                probability: 0.2,
                recommendedDifficulty: this.createAggressiveDifficulty(predictedSkill)
            }
        ];
    }

    private createConservativeDifficulty(skill: PlayerSkillMetrics): DifficultyMetrics {
        const base = skill.overallSkillLevel * 0.8; // 20% easier than skill level
        
        return {
            aiAggressiveness: Math.max(0.1, base - 0.1),
            aiSkillLevel: Math.max(0.2, base),
            gameComplexity: Math.max(0.3, base - 0.05),
            timePresssure: Math.max(0.1, base - 0.2),
            resourceScarcity: Math.max(0.2, base - 0.1),
            marketVolatility: Math.max(0.2, base - 0.15),
            randomEventFrequency: Math.max(0.1, base - 0.2),
            competitionIntensity: Math.max(0.2, base - 0.15),
            overallDifficulty: Math.max(0.2, base)
        };
    }

    private createAggressiveDifficulty(skill: PlayerSkillMetrics): DifficultyMetrics {
        const base = skill.overallSkillLevel * 1.2; // 20% harder than skill level
        
        return {
            aiAggressiveness: Math.min(0.9, base + 0.1),
            aiSkillLevel: Math.min(1.0, base + 0.1),
            gameComplexity: Math.min(1.0, base + 0.05),
            timePresssure: Math.min(0.8, base + 0.1),
            resourceScarcity: Math.min(0.9, base + 0.1),
            marketVolatility: Math.min(0.8, base + 0.05),
            randomEventFrequency: Math.min(0.7, base + 0.1),
            competitionIntensity: Math.min(0.9, base + 0.1),
            overallDifficulty: Math.min(1.0, base)
        };
    }

    private processAllPlayers(): void {
        // This would process all active players
        // For now, just maintain internal state
        console.log(`🔄 Processing difficulty adjustments for ${this.currentDifficulties.size} players`);
    }

    private monitorEmergencyStates(): void {
        this.emergencyStates.forEach((emergency, playerId) => {
            const timeInEmergency = Date.now() - emergency.estimatedRecoveryTime;
            if (timeInEmergency > emergency.estimatedRecoveryTime * 1.5) {
                console.warn(`⚠️ Extended emergency state for player ${playerId}: ${emergency.type}`);
            }
        });
    }

    private validateAdjustments(): void {
        const activeValidations = this.validationTrackers.size;
        console.log(`📊 Validating ${activeValidations} active difficulty adjustments`);
    }

    private getAdaptationTracker(playerId: string): AdaptationProgressTracker {
        if (!this.playerAdaptationTrackers.has(playerId)) {
            this.playerAdaptationTrackers.set(playerId, new AdaptationProgressTracker(playerId));
        }
        return this.playerAdaptationTrackers.get(playerId)!;
    }

    // Public API methods
    public getDifficultyForPlayer(playerId: string): DifficultyMetrics {
        return this.getCurrentDifficulty(playerId);
    }

    public getTransitionHistory(playerId: string): DifficultyTransition[] {
        return this.transitionHistory.get(playerId) || [];
    }

    public getEngineStatistics(): any {
        const totalTransitions = Array.from(this.transitionHistory.values()).reduce((sum, history) => sum + history.length, 0);
        const activePlayers = this.currentDifficulties.size;
        const emergencyStates = this.emergencyStates.size;
        const activeValidations = this.validationTrackers.size;

        return {
            activePlayers,
            totalTransitions,
            emergencyStates,
            activeValidations,
            isRunning: this.isRunning,
            adjustmentFrequency: this.config.adjustmentFrequency
        };
    }

    public stopEngine(): void {
        this.isRunning = false;
        console.log('🛑 Dynamic Difficulty Engine stopped');
    }
}

// Supporting classes
class ValidationTracker {
    private transition: DifficultyTransition;
    private validationPeriod: number;
    private startTime: number;

    constructor(transition: DifficultyTransition, validationPeriod: number) {
        this.transition = transition;
        this.validationPeriod = validationPeriod;
        this.startTime = Date.now();
    }

    getTransition(): DifficultyTransition {
        return this.transition;
    }

    isValidationComplete(): boolean {
        return Date.now() - this.startTime >= this.validationPeriod;
    }
}

class AdaptationProgressTracker {
    private playerId: string;
    private adaptationPeriods: Array<{ start: number; end?: number; type: string }>;

    constructor(playerId: string) {
        this.playerId = playerId;
        this.adaptationPeriods = [];
    }

    startAdaptation(type: string): void {
        this.adaptationPeriods.push({
            start: Date.now(),
            type
        });
    }

    endAdaptation(): void {
        const current = this.adaptationPeriods[this.adaptationPeriods.length - 1];
        if (current && !current.end) {
            current.end = Date.now();
        }
    }

    isCurrentlyAdapting(): boolean {
        const current = this.adaptationPeriods[this.adaptationPeriods.length - 1];
        return current && !current.end && (Date.now() - current.start < 120000); // 2 minutes
    }
}

// Prediction model interfaces
abstract class PredictionModel {
    abstract learn(data: any): void;
}

class SkillProgressionPredictionModel extends PredictionModel {
    async predictSkill(playerId: string, timeHorizon: number): Promise<PlayerSkillMetrics> {
        // Simplified skill prediction
        return {
            decisionSpeed: 0.6,
            strategicThinking: 0.65,
            riskManagement: 0.55,
            resourceOptimization: 0.6,
            adaptability: 0.7,
            gameKnowledge: 0.7,
            consistencyLevel: 0.6,
            learningRate: 0.4,
            overallSkillLevel: 0.62
        };
    }

    learn(data: any): void {
        // Learn from transition data
    }
}

class EngagementPredictionModel extends PredictionModel {
    async predictEngagement(playerId: string, difficulty: DifficultyMetrics): Promise<number> {
        // Simplified engagement prediction
        return 0.7;
    }

    learn(data: any): void {
        // Learn from engagement data
    }
}

class DifficultyResponsePredictionModel extends PredictionModel {
    async predictOptimalDifficulty(playerId: string, skill: PlayerSkillMetrics): Promise<DifficultyMetrics> {
        const base = skill.overallSkillLevel;
        
        return {
            aiAggressiveness: base * 0.9,
            aiSkillLevel: base,
            gameComplexity: base * 0.8,
            timePresssure: base * 0.7,
            resourceScarcity: base * 0.8,
            marketVolatility: base * 0.6,
            randomEventFrequency: base * 0.5,
            competitionIntensity: base * 0.9,
            overallDifficulty: base
        };
    }

    learn(data: any): void {
        // Learn from difficulty response data
    }
}