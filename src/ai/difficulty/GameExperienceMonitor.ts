import { GameplayMetrics, PlayerSkillMetrics, DifficultyMetrics } from './DifficultyAnalyzer';

export interface ExperienceMetrics {
    engagement: EngagementMetrics;
    frustration: FrustrationMetrics;
    satisfaction: SatisfactionMetrics;
    flow: FlowStateMetrics;
    challenge: ChallengeMetrics;
    progression: ProgressionMetrics;
    social: SocialExperienceMetrics;
    immersion: ImmersionMetrics;
}

export interface EngagementMetrics {
    attentionLevel: number;         // 0-1, focus and attention
    participationRate: number;      // 0-1, active participation
    sessionDuration: number;        // Actual vs expected session time
    actionFrequency: number;        // Actions per minute
    featureExploration: number;     // 0-1, exploration of game features
    returnRate: number;             // 0-1, likelihood to return
    timeToAction: number;           // Average time between actions
    idleTime: number;               // Percentage of idle time
}

export interface FrustrationMetrics {
    difficultyFrustration: number;  // 0-1, frustration from difficulty
    interfaceFrustration: number;   // 0-1, frustration from UI/UX
    repetitionFrustration: number;  // 0-1, frustration from repetition
    fairnessFrustration: number;    // 0-1, frustration from perceived unfairness
    progressFrustration: number;    // 0-1, frustration from lack of progress
    overallFrustration: number;     // 0-1, combined frustration level
    frustrationTriggers: string[];  // Specific events causing frustration
    recoveryTime: number;           // Time to recover from frustration
}

export interface SatisfactionMetrics {
    achievementSatisfaction: number;    // 0-1, satisfaction from achievements
    progressSatisfaction: number;       // 0-1, satisfaction from progress
    challengeSatisfaction: number;      // 0-1, satisfaction from overcoming challenges
    creativeSatisfaction: number;       // 0-1, satisfaction from creative expression
    socialSatisfaction: number;         // 0-1, satisfaction from social interaction
    overallSatisfaction: number;        // 0-1, combined satisfaction level
    satisfactionTrends: number[];       // Historical satisfaction levels
    peakExperiences: number;            // Count of exceptional moments
}

export interface FlowStateMetrics {
    challengeSkillBalance: number;      // 0-1, balance between challenge and skill
    clearGoals: number;                 // 0-1, clarity of objectives
    immediateResponse: number;          // 0-1, feedback responsiveness
    concentrationLevel: number;         // 0-1, depth of concentration
    selfConsciousness: number;          // 0-1, loss of self-consciousness
    timeDistortion: number;             // 0-1, altered perception of time
    intrinsicMotivation: number;        // 0-1, internal drive to continue
    flowStateIndicator: number;         // 0-1, overall flow state
    flowDuration: number;               // Duration of flow state periods
    flowFrequency: number;              // Frequency of entering flow state
}

export interface ChallengeMetrics {
    perceivedDifficulty: number;        // 0-1, player's perception of difficulty
    actualDifficulty: number;           // 0-1, measured difficulty
    difficultyProgression: number;      // 0-1, appropriate difficulty curve
    challengeVariety: number;           // 0-1, variety in challenges
    mastery: number;                    // 0-1, sense of mastery
    competence: number;                 // 0-1, feeling of competence
    autonomy: number;                   // 0-1, sense of control
    optimalChallengeZone: boolean;      // Whether in optimal challenge zone
}

export interface ProgressionMetrics {
    skillImprovement: number;           // 0-1, rate of skill improvement
    knowledgeGrowth: number;            // 0-1, learning and understanding
    achievementProgress: number;        // 0-1, progress toward goals
    masteryProgress: number;            // 0-1, progress toward mastery
    learningCurve: number;              // 0-1, appropriateness of learning curve
    progressVisibility: number;         // 0-1, visibility of progress
    milestoneCompletion: number;        // 0-1, completion of milestones
    progressSatisfaction: number;       // 0-1, satisfaction with progress rate
}

export interface SocialExperienceMetrics {
    cooperationLevel: number;           // 0-1, level of cooperation
    competitionLevel: number;           // 0-1, level of competition
    communicationQuality: number;       // 0-1, quality of player communication
    teamCohesion: number;               // 0-1, team unity and coordination
    socialPresence: number;             // 0-1, feeling of social presence
    socialSupport: number;              // 0-1, support from other players
    socialConflict: number;             // 0-1, level of social conflict
    communityEngagement: number;        // 0-1, engagement with game community
}

export interface ImmersionMetrics {
    narrativeEngagement: number;        // 0-1, engagement with game story
    worldBelievability: number;         // 0-1, believability of game world
    characterConnection: number;        // 0-1, connection to game characters
    emotionalInvestment: number;        // 0-1, emotional investment in game
    suspensionOfDisbelief: number;      // 0-1, immersion in game reality
    presenceFeeling: number;            // 0-1, feeling of being "in" the game
    immersionBreaks: number;            // Count of immersion-breaking events
    immersionDepth: number;             // 0-1, depth of immersion experience
}

export interface ExperienceEvent {
    id: string;
    timestamp: number;
    playerId: string;
    eventType: ExperienceEventType;
    intensity: number;              // 0-1, intensity of the experience
    duration: number;               // Duration of the event
    context: any;                   // Game context when event occurred
    metrics: Partial<ExperienceMetrics>;
    triggers: string[];             // What triggered this event
    consequences: string[];         // What resulted from this event
}

export enum ExperienceEventType {
    FLOW_STATE_ENTERED = 'flow_state_entered',
    FLOW_STATE_EXITED = 'flow_state_exited',
    FRUSTRATION_SPIKE = 'frustration_spike',
    SATISFACTION_PEAK = 'satisfaction_peak',
    ENGAGEMENT_INCREASE = 'engagement_increase',
    ENGAGEMENT_DECREASE = 'engagement_decrease',
    CHALLENGE_OVERCOME = 'challenge_overcome',
    PROGRESS_MILESTONE = 'progress_milestone',
    SOCIAL_INTERACTION = 'social_interaction',
    IMMERSION_BREAK = 'immersion_break',
    DIFFICULTY_ADJUSTMENT = 'difficulty_adjustment',
    ACHIEVEMENT_UNLOCKED = 'achievement_unlocked'
}

export interface ExperienceAnalysisResult {
    overallExperience: number;          // 0-1, overall experience quality
    experienceBreakdown: ExperienceMetrics;
    criticalEvents: ExperienceEvent[];
    improvementAreas: string[];
    strengths: string[];
    recommendations: ExperienceRecommendation[];
    predictedSatisfaction: number;      // 0-1, predicted future satisfaction
    retentionRisk: number;              // 0-1, risk of player leaving
    confidenceLevel: number;            // 0-1, confidence in analysis
}

export interface ExperienceRecommendation {
    type: 'immediate' | 'short_term' | 'long_term';
    category: 'difficulty' | 'content' | 'interface' | 'social' | 'progression';
    description: string;
    expectedImpact: number;             // 0-1, expected positive impact
    implementationComplexity: 'low' | 'medium' | 'high';
    priority: number;                   // 1-10, implementation priority
    targetMetrics: string[];            // Which metrics this should improve
}

export interface MonitoringConfig {
    samplingRate: number;               // How often to sample metrics (ms)
    eventDetectionThreshold: number;    // Threshold for detecting significant events
    flowStateWindow: number;            // Time window for flow state detection
    frustrationSensitivity: number;    // Sensitivity to frustration detection
    engagementWindow: number;           // Time window for engagement calculation
    satisfactionUpdateFrequency: number; // How often to update satisfaction
}

export class GameExperienceMonitor {
    private experienceHistory: Map<string, ExperienceMetrics[]>;
    private experienceEvents: Map<string, ExperienceEvent[]>;
    private realtimeMetrics: Map<string, ExperienceMetrics>;
    private eventDetectors: Map<string, ExperienceEventDetector>;
    private analysisEngines: Map<string, ExperienceAnalysisEngine>;
    
    private config: MonitoringConfig;
    private isMonitoring: boolean;
    private samplingTimers: Map<string, NodeJS.Timeout>;
    private alertThresholds: Map<string, number>;
    private correlationTrackers: Map<string, CorrelationTracker>;

    constructor(config?: Partial<MonitoringConfig>) {
        this.initializeConfiguration(config);
        this.initializeDataStructures();
        this.initializeEventDetectors();
        this.initializeAnalysisEngines();
    }

    private initializeConfiguration(config?: Partial<MonitoringConfig>): void {
        this.config = {
            samplingRate: 5000,                 // 5 seconds
            eventDetectionThreshold: 0.3,       // 30% change
            flowStateWindow: 60000,             // 1 minute
            frustrationSensitivity: 0.2,        // 20% threshold
            engagementWindow: 120000,           // 2 minutes
            satisfactionUpdateFrequency: 30000, // 30 seconds
            ...config
        };
    }

    private initializeDataStructures(): void {
        this.experienceHistory = new Map();
        this.experienceEvents = new Map();
        this.realtimeMetrics = new Map();
        this.eventDetectors = new Map();
        this.analysisEngines = new Map();
        this.samplingTimers = new Map();
        this.alertThresholds = new Map();
        this.correlationTrackers = new Map();
        this.isMonitoring = false;
    }

    private initializeEventDetectors(): void {
        this.eventDetectors.set('flow_state', new FlowStateDetector());
        this.eventDetectors.set('frustration', new FrustrationDetector());
        this.eventDetectors.set('engagement', new EngagementDetector());
        this.eventDetectors.set('satisfaction', new SatisfactionDetector());
        this.eventDetectors.set('challenge', new ChallengeDetector());
        this.eventDetectors.set('progression', new ProgressionDetector());
    }

    private initializeAnalysisEngines(): void {
        this.analysisEngines.set('experience', new ExperienceAnalysisEngine());
        this.analysisEngines.set('prediction', new ExperiencePredictionEngine());
        this.analysisEngines.set('recommendation', new RecommendationEngine());
    }

    public startMonitoring(playerId: string): void {
        if (this.samplingTimers.has(playerId)) {
            return; // Already monitoring
        }

        console.log(`🎮 Starting experience monitoring for player ${playerId}`);

        // Initialize player data
        this.experienceHistory.set(playerId, []);
        this.experienceEvents.set(playerId, []);
        this.correlationTrackers.set(playerId, new CorrelationTracker(playerId));

        // Start sampling timer
        const timer = setInterval(() => {
            this.sampleExperienceMetrics(playerId);
        }, this.config.samplingRate);

        this.samplingTimers.set(playerId, timer);
        this.isMonitoring = true;
    }

    public stopMonitoring(playerId: string): void {
        const timer = this.samplingTimers.get(playerId);
        if (timer) {
            clearInterval(timer);
            this.samplingTimers.delete(playerId);
            console.log(`🛑 Stopped experience monitoring for player ${playerId}`);
        }
    }

    private async sampleExperienceMetrics(playerId: string): Promise<void> {
        try {
            // Collect current metrics
            const currentMetrics = await this.collectCurrentMetrics(playerId);
            
            // Update realtime metrics
            this.realtimeMetrics.set(playerId, currentMetrics);
            
            // Add to history
            const history = this.experienceHistory.get(playerId) || [];
            history.push(currentMetrics);
            
            // Limit history size
            if (history.length > 100) {
                history.shift();
            }
            
            this.experienceHistory.set(playerId, history);

            // Detect experience events
            await this.detectExperienceEvents(playerId, currentMetrics);

            // Update correlations
            const correlationTracker = this.correlationTrackers.get(playerId);
            if (correlationTracker) {
                correlationTracker.update(currentMetrics);
            }

        } catch (error) {
            console.error(`Error sampling experience metrics for player ${playerId}:`, error);
        }
    }

    private async collectCurrentMetrics(playerId: string): Promise<ExperienceMetrics> {
        // This would collect real metrics from game data
        // For now, return simulated metrics based on realistic patterns
        
        const engagement = await this.calculateEngagementMetrics(playerId);
        const frustration = await this.calculateFrustrationMetrics(playerId);
        const satisfaction = await this.calculateSatisfactionMetrics(playerId);
        const flow = await this.calculateFlowStateMetrics(playerId);
        const challenge = await this.calculateChallengeMetrics(playerId);
        const progression = await this.calculateProgressionMetrics(playerId);
        const social = await this.calculateSocialMetrics(playerId);
        const immersion = await this.calculateImmersionMetrics(playerId);

        return {
            engagement,
            frustration,
            satisfaction,
            flow,
            challenge,
            progression,
            social,
            immersion
        };
    }

    private async calculateEngagementMetrics(playerId: string): Promise<EngagementMetrics> {
        // Simulate engagement calculation based on player behavior
        const baseEngagement = 0.6 + Math.random() * 0.3;
        
        return {
            attentionLevel: baseEngagement + (Math.random() - 0.5) * 0.2,
            participationRate: baseEngagement + (Math.random() - 0.5) * 0.1,
            sessionDuration: Math.random() * 3600000 + 1800000, // 30-90 minutes
            actionFrequency: Math.random() * 10 + 5, // 5-15 actions per minute
            featureExploration: Math.random() * 0.4 + 0.3,
            returnRate: baseEngagement + (Math.random() - 0.5) * 0.2,
            timeToAction: Math.random() * 8000 + 2000, // 2-10 seconds
            idleTime: Math.random() * 0.3 // 0-30% idle time
        };
    }

    private async calculateFrustrationMetrics(playerId: string): Promise<FrustrationMetrics> {
        const baseFrustration = Math.random() * 0.4; // Generally low frustration
        
        return {
            difficultyFrustration: baseFrustration + Math.random() * 0.2,
            interfaceFrustration: Math.random() * 0.2,
            repetitionFrustration: Math.random() * 0.3,
            fairnessFrustration: Math.random() * 0.3,
            progressFrustration: baseFrustration + Math.random() * 0.2,
            overallFrustration: baseFrustration,
            frustrationTriggers: this.generateFrustrationTriggers(),
            recoveryTime: Math.random() * 60000 + 30000 // 30-90 seconds
        };
    }

    private async calculateSatisfactionMetrics(playerId: string): Promise<SatisfactionMetrics> {
        const baseSatisfaction = 0.6 + Math.random() * 0.3;
        
        return {
            achievementSatisfaction: baseSatisfaction + (Math.random() - 0.5) * 0.2,
            progressSatisfaction: baseSatisfaction + (Math.random() - 0.5) * 0.1,
            challengeSatisfaction: baseSatisfaction + (Math.random() - 0.5) * 0.2,
            creativeSatisfaction: Math.random() * 0.6 + 0.2,
            socialSatisfaction: Math.random() * 0.5 + 0.3,
            overallSatisfaction: baseSatisfaction,
            satisfactionTrends: this.generateSatisfactionTrends(playerId),
            peakExperiences: Math.floor(Math.random() * 3)
        };
    }

    private async calculateFlowStateMetrics(playerId: string): Promise<FlowStateMetrics> {
        const flowPotential = Math.random() * 0.8 + 0.2;
        
        return {
            challengeSkillBalance: flowPotential + (Math.random() - 0.5) * 0.1,
            clearGoals: Math.random() * 0.4 + 0.6,
            immediateResponse: Math.random() * 0.3 + 0.7,
            concentrationLevel: flowPotential + (Math.random() - 0.5) * 0.2,
            selfConsciousness: Math.random() * 0.3,
            timeDistortion: flowPotential > 0.7 ? Math.random() * 0.6 + 0.4 : Math.random() * 0.3,
            intrinsicMotivation: flowPotential + (Math.random() - 0.5) * 0.1,
            flowStateIndicator: flowPotential,
            flowDuration: flowPotential > 0.7 ? Math.random() * 180000 + 60000 : 0, // 1-4 minutes
            flowFrequency: Math.random() * 0.3 + 0.1
        };
    }

    private async calculateChallengeMetrics(playerId: string): Promise<ChallengeMetrics> {
        const challengeLevel = Math.random() * 0.8 + 0.2;
        
        return {
            perceivedDifficulty: challengeLevel + (Math.random() - 0.5) * 0.2,
            actualDifficulty: challengeLevel,
            difficultyProgression: Math.random() * 0.4 + 0.6,
            challengeVariety: Math.random() * 0.3 + 0.5,
            mastery: Math.random() * 0.6 + 0.2,
            competence: Math.random() * 0.5 + 0.4,
            autonomy: Math.random() * 0.4 + 0.6,
            optimalChallengeZone: challengeLevel >= 0.4 && challengeLevel <= 0.8
        };
    }

    private async calculateProgressionMetrics(playerId: string): Promise<ProgressionMetrics> {
        const progressRate = Math.random() * 0.6 + 0.3;
        
        return {
            skillImprovement: progressRate + (Math.random() - 0.5) * 0.1,
            knowledgeGrowth: progressRate + (Math.random() - 0.5) * 0.1,
            achievementProgress: Math.random() * 0.8 + 0.1,
            masteryProgress: Math.random() * 0.5 + 0.2,
            learningCurve: Math.random() * 0.4 + 0.6,
            progressVisibility: Math.random() * 0.3 + 0.7,
            milestoneCompletion: Math.random() * 0.6 + 0.2,
            progressSatisfaction: progressRate + (Math.random() - 0.5) * 0.2
        };
    }

    private async calculateSocialMetrics(playerId: string): Promise<SocialExperienceMetrics> {
        return {
            cooperationLevel: Math.random() * 0.6 + 0.3,
            competitionLevel: Math.random() * 0.7 + 0.2,
            communicationQuality: Math.random() * 0.5 + 0.4,
            teamCohesion: Math.random() * 0.6 + 0.3,
            socialPresence: Math.random() * 0.5 + 0.4,
            socialSupport: Math.random() * 0.4 + 0.5,
            socialConflict: Math.random() * 0.3,
            communityEngagement: Math.random() * 0.5 + 0.3
        };
    }

    private async calculateImmersionMetrics(playerId: string): Promise<ImmersionMetrics> {
        const immersionLevel = Math.random() * 0.7 + 0.3;
        
        return {
            narrativeEngagement: immersionLevel + (Math.random() - 0.5) * 0.2,
            worldBelievability: Math.random() * 0.4 + 0.6,
            characterConnection: Math.random() * 0.6 + 0.3,
            emotionalInvestment: immersionLevel + (Math.random() - 0.5) * 0.1,
            suspensionOfDisbelief: immersionLevel,
            presenceFeeling: immersionLevel + (Math.random() - 0.5) * 0.1,
            immersionBreaks: Math.floor(Math.random() * 3),
            immersionDepth: immersionLevel
        };
    }

    private generateFrustrationTriggers(): string[] {
        const triggers = [
            'difficult_challenge',
            'unfair_outcome',
            'interface_confusion',
            'progress_blocked',
            'time_pressure',
            'repeated_failure'
        ];
        
        const count = Math.floor(Math.random() * 3);
        return triggers.slice(0, count);
    }

    private generateSatisfactionTrends(playerId: string): number[] {
        const history = this.experienceHistory.get(playerId) || [];
        return history.slice(-10).map(h => h.satisfaction.overallSatisfaction);
    }

    private async detectExperienceEvents(playerId: string, currentMetrics: ExperienceMetrics): Promise<void> {
        const previousMetrics = this.getPreviousMetrics(playerId);
        if (!previousMetrics) return;

        // Detect events using each detector
        for (const [detectorType, detector] of this.eventDetectors) {
            const events = detector.detectEvents(previousMetrics, currentMetrics, playerId);
            
            if (events.length > 0) {
                const playerEvents = this.experienceEvents.get(playerId) || [];
                playerEvents.push(...events);
                
                // Limit event history
                if (playerEvents.length > 200) {
                    playerEvents.splice(0, playerEvents.length - 200);
                }
                
                this.experienceEvents.set(playerId, playerEvents);

                // Log significant events
                events.forEach(event => {
                    if (event.intensity > 0.7) {
                        console.log(`🎯 Significant experience event for player ${playerId}: ${event.eventType} (intensity: ${event.intensity.toFixed(2)})`);
                    }
                });
            }
        }
    }

    private getPreviousMetrics(playerId: string): ExperienceMetrics | null {
        const history = this.experienceHistory.get(playerId) || [];
        return history.length > 0 ? history[history.length - 1] : null;
    }

    public async analyzePlayerExperience(playerId: string): Promise<ExperienceAnalysisResult> {
        const history = this.experienceHistory.get(playerId) || [];
        const events = this.experienceEvents.get(playerId) || [];
        const currentMetrics = this.realtimeMetrics.get(playerId);

        if (history.length === 0 || !currentMetrics) {
            throw new Error(`Insufficient data for player ${playerId}`);
        }

        const analysisEngine = this.analysisEngines.get('experience')!;
        const predictionEngine = this.analysisEngines.get('prediction')!;
        const recommendationEngine = this.analysisEngines.get('recommendation')!;

        const overallExperience = this.calculateOverallExperience(currentMetrics);
        const criticalEvents = this.identifyCriticalEvents(events);
        const improvementAreas = this.identifyImprovementAreas(currentMetrics);
        const strengths = this.identifyStrengths(currentMetrics);
        const recommendations = recommendationEngine.generateRecommendations(currentMetrics, history, events);
        const predictedSatisfaction = predictionEngine.predictSatisfaction(playerId, history);
        const retentionRisk = this.calculateRetentionRisk(currentMetrics, events);
        const confidenceLevel = this.calculateAnalysisConfidence(history.length, events.length);

        return {
            overallExperience,
            experienceBreakdown: currentMetrics,
            criticalEvents,
            improvementAreas,
            strengths,
            recommendations,
            predictedSatisfaction,
            retentionRisk,
            confidenceLevel
        };
    }

    private calculateOverallExperience(metrics: ExperienceMetrics): number {
        const weights = {
            engagement: 0.25,
            frustration: -0.15, // Negative weight
            satisfaction: 0.25,
            flow: 0.20,
            challenge: 0.15,
            progression: 0.10
        };

        let score = 0;
        score += metrics.engagement.attentionLevel * weights.engagement;
        score += (1 - metrics.frustration.overallFrustration) * Math.abs(weights.frustration);
        score += metrics.satisfaction.overallSatisfaction * weights.satisfaction;
        score += metrics.flow.flowStateIndicator * weights.flow;
        score += (metrics.challenge.competence) * weights.challenge;
        score += metrics.progression.progressSatisfaction * weights.progression;

        return Math.max(0, Math.min(1, score));
    }

    private identifyCriticalEvents(events: ExperienceEvent[]): ExperienceEvent[] {
        return events
            .filter(event => event.intensity > 0.7 || this.isCriticalEventType(event.eventType))
            .sort((a, b) => b.intensity - a.intensity)
            .slice(0, 10);
    }

    private isCriticalEventType(eventType: ExperienceEventType): boolean {
        const criticalTypes = [
            ExperienceEventType.FRUSTRATION_SPIKE,
            ExperienceEventType.FLOW_STATE_ENTERED,
            ExperienceEventType.SATISFACTION_PEAK,
            ExperienceEventType.IMMERSION_BREAK
        ];
        
        return criticalTypes.includes(eventType);
    }

    private identifyImprovementAreas(metrics: ExperienceMetrics): string[] {
        const areas: string[] = [];
        const thresholds = {
            engagement: 0.6,
            satisfaction: 0.6,
            flow: 0.5,
            frustration: 0.4,
            challenge: 0.6,
            progression: 0.6
        };

        if (metrics.engagement.attentionLevel < thresholds.engagement) {
            areas.push('Player engagement could be improved');
        }
        
        if (metrics.frustration.overallFrustration > thresholds.frustration) {
            areas.push('Frustration levels are concerning');
        }
        
        if (metrics.satisfaction.overallSatisfaction < thresholds.satisfaction) {
            areas.push('Player satisfaction needs attention');
        }
        
        if (metrics.flow.flowStateIndicator < thresholds.flow) {
            areas.push('Flow state achievement is low');
        }
        
        if (!metrics.challenge.optimalChallengeZone) {
            areas.push('Challenge level may not be optimal');
        }
        
        if (metrics.progression.progressSatisfaction < thresholds.progression) {
            areas.push('Progress perception could be enhanced');
        }

        return areas;
    }

    private identifyStrengths(metrics: ExperienceMetrics): string[] {
        const strengths: string[] = [];
        
        if (metrics.engagement.attentionLevel > 0.8) {
            strengths.push('High player engagement');
        }
        
        if (metrics.flow.flowStateIndicator > 0.7) {
            strengths.push('Strong flow state achievement');
        }
        
        if (metrics.satisfaction.overallSatisfaction > 0.8) {
            strengths.push('Excellent player satisfaction');
        }
        
        if (metrics.challenge.optimalChallengeZone && metrics.challenge.competence > 0.7) {
            strengths.push('Well-balanced challenge and competence');
        }
        
        if (metrics.progression.progressSatisfaction > 0.8) {
            strengths.push('Strong sense of progress');
        }
        
        if (metrics.immersion.immersionDepth > 0.8) {
            strengths.push('Deep immersion experience');
        }

        return strengths;
    }

    private calculateRetentionRisk(metrics: ExperienceMetrics, events: ExperienceEvent[]): number {
        let risk = 0;

        // High frustration increases risk
        risk += metrics.frustration.overallFrustration * 0.4;

        // Low engagement increases risk
        risk += (1 - metrics.engagement.attentionLevel) * 0.3;

        // Low satisfaction increases risk
        risk += (1 - metrics.satisfaction.overallSatisfaction) * 0.2;

        // Recent frustration spikes increase risk
        const recentFrustrationEvents = events
            .filter(e => e.eventType === ExperienceEventType.FRUSTRATION_SPIKE)
            .filter(e => Date.now() - e.timestamp < 300000); // Last 5 minutes
        
        risk += recentFrustrationEvents.length * 0.1;

        return Math.max(0, Math.min(1, risk));
    }

    private calculateAnalysisConfidence(historyLength: number, eventCount: number): number {
        let confidence = 0.3; // Base confidence
        
        // More data increases confidence
        confidence += Math.min(0.4, historyLength / 50);
        
        // More events increase confidence
        confidence += Math.min(0.2, eventCount / 20);
        
        // Recent data increases confidence
        confidence += 0.1;

        return Math.max(0.3, Math.min(1, confidence));
    }

    // Public API methods
    public getCurrentMetrics(playerId: string): ExperienceMetrics | null {
        return this.realtimeMetrics.get(playerId) || null;
    }

    public getExperienceHistory(playerId: string): ExperienceMetrics[] {
        return this.experienceHistory.get(playerId) || [];
    }

    public getExperienceEvents(playerId: string): ExperienceEvent[] {
        return this.experienceEvents.get(playerId) || [];
    }

    public getRecentEvents(playerId: string, timeWindow: number = 300000): ExperienceEvent[] {
        const events = this.experienceEvents.get(playerId) || [];
        const cutoff = Date.now() - timeWindow;
        return events.filter(event => event.timestamp > cutoff);
    }

    public isInFlowState(playerId: string): boolean {
        const metrics = this.realtimeMetrics.get(playerId);
        return metrics ? metrics.flow.flowStateIndicator > 0.7 : false;
    }

    public getEngagementLevel(playerId: string): number {
        const metrics = this.realtimeMetrics.get(playerId);
        return metrics ? metrics.engagement.attentionLevel : 0;
    }

    public getFrustrationLevel(playerId: string): number {
        const metrics = this.realtimeMetrics.get(playerId);
        return metrics ? metrics.frustration.overallFrustration : 0;
    }

    public stopAllMonitoring(): void {
        this.samplingTimers.forEach((timer, playerId) => {
            clearInterval(timer);
            console.log(`🛑 Stopped monitoring for player ${playerId}`);
        });
        
        this.samplingTimers.clear();
        this.isMonitoring = false;
        console.log('🛑 All experience monitoring stopped');
    }

    public getMonitoringStatistics(): any {
        return {
            activeMonitors: this.samplingTimers.size,
            totalPlayers: this.experienceHistory.size,
            totalEvents: Array.from(this.experienceEvents.values()).reduce((sum, events) => sum + events.length, 0),
            averageHistoryLength: Array.from(this.experienceHistory.values()).reduce((sum, history) => sum + history.length, 0) / Math.max(this.experienceHistory.size, 1),
            isMonitoring: this.isMonitoring,
            samplingRate: this.config.samplingRate
        };
    }
}

// Supporting classes for event detection
abstract class ExperienceEventDetector {
    abstract detectEvents(
        previous: ExperienceMetrics,
        current: ExperienceMetrics,
        playerId: string
    ): ExperienceEvent[];
}

class FlowStateDetector extends ExperienceEventDetector {
    detectEvents(previous: ExperienceMetrics, current: ExperienceMetrics, playerId: string): ExperienceEvent[] {
        const events: ExperienceEvent[] = [];
        
        const wasInFlow = previous.flow.flowStateIndicator > 0.7;
        const isInFlow = current.flow.flowStateIndicator > 0.7;
        
        if (!wasInFlow && isInFlow) {
            events.push({
                id: `flow_enter_${Date.now()}`,
                timestamp: Date.now(),
                playerId,
                eventType: ExperienceEventType.FLOW_STATE_ENTERED,
                intensity: current.flow.flowStateIndicator,
                duration: 0,
                context: {},
                metrics: { flow: current.flow },
                triggers: ['optimal_challenge_skill_balance'],
                consequences: ['increased_engagement', 'time_distortion']
            });
        } else if (wasInFlow && !isInFlow) {
            events.push({
                id: `flow_exit_${Date.now()}`,
                timestamp: Date.now(),
                playerId,
                eventType: ExperienceEventType.FLOW_STATE_EXITED,
                intensity: 1 - current.flow.flowStateIndicator,
                duration: 0,
                context: {},
                metrics: { flow: current.flow },
                triggers: ['challenge_imbalance'],
                consequences: ['potential_disengagement']
            });
        }
        
        return events;
    }
}

class FrustrationDetector extends ExperienceEventDetector {
    detectEvents(previous: ExperienceMetrics, current: ExperienceMetrics, playerId: string): ExperienceEvent[] {
        const events: ExperienceEvent[] = [];
        
        const frustrationIncrease = current.frustration.overallFrustration - previous.frustration.overallFrustration;
        
        if (frustrationIncrease > 0.3) {
            events.push({
                id: `frustration_spike_${Date.now()}`,
                timestamp: Date.now(),
                playerId,
                eventType: ExperienceEventType.FRUSTRATION_SPIKE,
                intensity: frustrationIncrease,
                duration: 0,
                context: {},
                metrics: { frustration: current.frustration },
                triggers: current.frustration.frustrationTriggers,
                consequences: ['potential_quit', 'disengagement', 'negative_emotion']
            });
        }
        
        return events;
    }
}

class EngagementDetector extends ExperienceEventDetector {
    detectEvents(previous: ExperienceMetrics, current: ExperienceMetrics, playerId: string): ExperienceEvent[] {
        const events: ExperienceEvent[] = [];
        
        const engagementChange = current.engagement.attentionLevel - previous.engagement.attentionLevel;
        
        if (engagementChange > 0.3) {
            events.push({
                id: `engagement_increase_${Date.now()}`,
                timestamp: Date.now(),
                playerId,
                eventType: ExperienceEventType.ENGAGEMENT_INCREASE,
                intensity: engagementChange,
                duration: 0,
                context: {},
                metrics: { engagement: current.engagement },
                triggers: ['interesting_content', 'achievement', 'challenge'],
                consequences: ['extended_play', 'positive_emotion']
            });
        } else if (engagementChange < -0.3) {
            events.push({
                id: `engagement_decrease_${Date.now()}`,
                timestamp: Date.now(),
                playerId,
                eventType: ExperienceEventType.ENGAGEMENT_DECREASE,
                intensity: Math.abs(engagementChange),
                duration: 0,
                context: {},
                metrics: { engagement: current.engagement },
                triggers: ['boredom', 'repetition', 'confusion'],
                consequences: ['potential_quit', 'reduced_attention']
            });
        }
        
        return events;
    }
}

class SatisfactionDetector extends ExperienceEventDetector {
    detectEvents(previous: ExperienceMetrics, current: ExperienceMetrics, playerId: string): ExperienceEvent[] {
        const events: ExperienceEvent[] = [];
        
        if (current.satisfaction.overallSatisfaction > 0.9) {
            events.push({
                id: `satisfaction_peak_${Date.now()}`,
                timestamp: Date.now(),
                playerId,
                eventType: ExperienceEventType.SATISFACTION_PEAK,
                intensity: current.satisfaction.overallSatisfaction,
                duration: 0,
                context: {},
                metrics: { satisfaction: current.satisfaction },
                triggers: ['achievement', 'progress', 'mastery'],
                consequences: ['positive_emotion', 'motivation_boost', 'retention']
            });
        }
        
        return events;
    }
}

class ChallengeDetector extends ExperienceEventDetector {
    detectEvents(previous: ExperienceMetrics, current: ExperienceMetrics, playerId: string): ExperienceEvent[] {
        const events: ExperienceEvent[] = [];
        
        if (current.challenge.mastery > previous.challenge.mastery + 0.2) {
            events.push({
                id: `challenge_overcome_${Date.now()}`,
                timestamp: Date.now(),
                playerId,
                eventType: ExperienceEventType.CHALLENGE_OVERCOME,
                intensity: current.challenge.mastery,
                duration: 0,
                context: {},
                metrics: { challenge: current.challenge },
                triggers: ['skill_improvement', 'persistence'],
                consequences: ['confidence_boost', 'satisfaction', 'progression']
            });
        }
        
        return events;
    }
}

class ProgressionDetector extends ExperienceEventDetector {
    detectEvents(previous: ExperienceMetrics, current: ExperienceMetrics, playerId: string): ExperienceEvent[] {
        const events: ExperienceEvent[] = [];
        
        if (current.progression.milestoneCompletion > previous.progression.milestoneCompletion + 0.3) {
            events.push({
                id: `progress_milestone_${Date.now()}`,
                timestamp: Date.now(),
                playerId,
                eventType: ExperienceEventType.PROGRESS_MILESTONE,
                intensity: current.progression.milestoneCompletion,
                duration: 0,
                context: {},
                metrics: { progression: current.progression },
                triggers: ['goal_achievement', 'skill_development'],
                consequences: ['satisfaction', 'motivation', 'continued_engagement']
            });
        }
        
        return events;
    }
}

// Analysis engines
abstract class ExperienceAnalysisEngine {
    abstract analyze(metrics: ExperienceMetrics[], events: ExperienceEvent[]): any;
}

class ExperiencePredictionEngine extends ExperienceAnalysisEngine {
    analyze(metrics: ExperienceMetrics[], events: ExperienceEvent[]): any {
        return {};
    }

    predictSatisfaction(playerId: string, history: ExperienceMetrics[]): number {
        if (history.length === 0) return 0.5;
        
        const recent = history.slice(-5);
        const trend = this.calculateSatisfactionTrend(recent);
        const current = recent[recent.length - 1].satisfaction.overallSatisfaction;
        
        return Math.max(0, Math.min(1, current + trend * 0.5));
    }

    private calculateSatisfactionTrend(history: ExperienceMetrics[]): number {
        if (history.length < 2) return 0;
        
        const satisfactionValues = history.map(h => h.satisfaction.overallSatisfaction);
        const slope = this.calculateSlope(satisfactionValues);
        
        return slope;
    }

    private calculateSlope(values: number[]): number {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    }
}

class RecommendationEngine extends ExperienceAnalysisEngine {
    analyze(metrics: ExperienceMetrics[], events: ExperienceEvent[]): ExperienceRecommendation[] {
        return [];
    }

    generateRecommendations(
        current: ExperienceMetrics,
        history: ExperienceMetrics[],
        events: ExperienceEvent[]
    ): ExperienceRecommendation[] {
        const recommendations: ExperienceRecommendation[] = [];
        
        // Frustration-based recommendations
        if (current.frustration.overallFrustration > 0.6) {
            recommendations.push({
                type: 'immediate',
                category: 'difficulty',
                description: 'Reduce game difficulty to alleviate frustration',
                expectedImpact: 0.7,
                implementationComplexity: 'low',
                priority: 9,
                targetMetrics: ['frustration', 'satisfaction']
            });
        }
        
        // Engagement-based recommendations
        if (current.engagement.attentionLevel < 0.5) {
            recommendations.push({
                type: 'short_term',
                category: 'content',
                description: 'Introduce new content or features to boost engagement',
                expectedImpact: 0.6,
                implementationComplexity: 'medium',
                priority: 7,
                targetMetrics: ['engagement', 'satisfaction']
            });
        }
        
        // Flow state recommendations
        if (current.flow.flowStateIndicator < 0.4) {
            recommendations.push({
                type: 'immediate',
                category: 'difficulty',
                description: 'Adjust challenge-skill balance to promote flow state',
                expectedImpact: 0.8,
                implementationComplexity: 'low',
                priority: 8,
                targetMetrics: ['flow', 'engagement', 'satisfaction']
            });
        }
        
        return recommendations.sort((a, b) => b.priority - a.priority);
    }
}

// Correlation tracking
class CorrelationTracker {
    private playerId: string;
    private correlationData: Array<{ timestamp: number; metrics: ExperienceMetrics; context: any }>;

    constructor(playerId: string) {
        this.playerId = playerId;
        this.correlationData = [];
    }

    update(metrics: ExperienceMetrics): void {
        this.correlationData.push({
            timestamp: Date.now(),
            metrics,
            context: {}
        });
        
        // Keep only recent data
        if (this.correlationData.length > 100) {
            this.correlationData.shift();
        }
    }

    calculateCorrelations(): Record<string, number> {
        // Calculate correlations between different metrics
        const correlations: Record<string, number> = {};
        
        if (this.correlationData.length < 10) return correlations;
        
        const engagementValues = this.correlationData.map(d => d.metrics.engagement.attentionLevel);
        const frustrationValues = this.correlationData.map(d => d.metrics.frustration.overallFrustration);
        const satisfactionValues = this.correlationData.map(d => d.metrics.satisfaction.overallSatisfaction);
        const flowValues = this.correlationData.map(d => d.metrics.flow.flowStateIndicator);
        
        correlations['engagement_satisfaction'] = this.calculateCorrelation(engagementValues, satisfactionValues);
        correlations['frustration_satisfaction'] = this.calculateCorrelation(frustrationValues, satisfactionValues);
        correlations['flow_engagement'] = this.calculateCorrelation(flowValues, engagementValues);
        
        return correlations;
    }

    private calculateCorrelation(x: number[], y: number[]): number {
        if (x.length !== y.length || x.length === 0) return 0;
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
}