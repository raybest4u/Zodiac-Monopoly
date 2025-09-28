import { DifficultyMetrics, PlayerSkillMetrics } from './DifficultyAnalyzer';
import { ExperienceMetrics } from './GameExperienceMonitor';

export interface AIOpponentPersonality {
    id: string;
    name: string;
    description: string;
    traits: AIPersonalityTraits;
    behaviorPatterns: AIBehaviorPattern[];
    adaptationStyle: AdaptationStyle;
    decisionMaking: DecisionMakingStyle;
    socialBehavior: SocialBehaviorPattern;
}

export interface AIPersonalityTraits {
    aggressiveness: number;         // 0-1, how aggressive in competition
    riskTolerance: number;          // 0-1, willingness to take risks  
    strategicThinking: number;      // 0-1, long-term vs short-term focus
    adaptability: number;           // 0-1, ability to change strategies
    cooperativeness: number;        // 0-1, willingness to cooperate
    consistency: number;            // 0-1, consistency in behavior
    creativity: number;             // 0-1, tendency for creative solutions
    patience: number;               // 0-1, willingness to wait for opportunities
    competitiveness: number;        // 0-1, drive to win
    empathy: number;                // 0-1, consideration for other players
}

export interface AIBehaviorPattern {
    id: string;
    name: string;
    conditions: BehaviorCondition[];
    actions: BehaviorAction[];
    priority: number;
    frequency: number;              // 0-1, how often this pattern activates
    adaptationRate: number;         // 0-1, how quickly this pattern adapts
}

export interface BehaviorCondition {
    type: 'player_skill' | 'game_state' | 'time_constraint' | 'resource_level' | 'social_context';
    parameter: string;
    operator: 'greater_than' | 'less_than' | 'equals' | 'between';
    value: number | [number, number];
    weight: number;                 // Importance of this condition
}

export interface BehaviorAction {
    type: 'strategic' | 'tactical' | 'social' | 'economic' | 'defensive';
    action: string;
    parameters: Record<string, any>;
    intensity: number;              // 0-1, how strongly to execute this action
    duration: number;               // How long to maintain this action
    cooldown: number;               // Minimum time before repeating
}

export interface AdaptationStyle {
    learningRate: number;           // 0-1, how quickly AI learns
    memoryLength: number;           // How many interactions to remember
    adaptationTriggers: string[];   // What triggers adaptation
    adaptationMethods: string[];    // How adaptation occurs
    personalityStability: number;   // 0-1, how stable personality remains
}

export interface DecisionMakingStyle {
    deliberationTime: number;       // Time spent on decisions
    informationGathering: number;   // 0-1, thoroughness of analysis
    riskAssessment: number;         // 0-1, emphasis on risk analysis
    optimalityFocus: number;        // 0-1, focus on optimal vs acceptable solutions
    intuitionWeight: number;        // 0-1, reliance on intuition vs analysis
    uncertaintyTolerance: number;   // 0-1, comfort with uncertain decisions
}

export interface SocialBehaviorPattern {
    communicationStyle: 'friendly' | 'neutral' | 'competitive' | 'intimidating';
    allianceFormation: number;      // 0-1, tendency to form alliances
    trustBuilding: number;          // 0-1, effort to build trust
    deceptionTolerance: number;     // 0-1, willingness to use deception
    retaliation: number;            // 0-1, tendency to retaliate
    forgiveness: number;            // 0-1, willingness to forgive
    socialMemory: number;           // How long to remember social interactions
}

export interface AIOpponentState {
    currentPersonality: AIOpponentPersonality;
    skillLevel: number;             // 0-1, current AI skill level
    adaptationHistory: AdaptationEvent[];
    behaviorWeights: Map<string, number>;
    playerRelationships: Map<string, PlayerRelationship>;
    performanceMetrics: AIPerformanceMetrics;
    contextualModifiers: ContextualModifier[];
    currentStrategy: AIStrategy;
}

export interface AdaptationEvent {
    timestamp: number;
    trigger: string;
    adaptation: string;
    intensity: number;
    success: boolean;
    playerReaction: string;
    outcome: string;
}

export interface PlayerRelationship {
    playerId: string;
    trustLevel: number;             // -1 to 1, trust/distrust
    competitionLevel: number;       // 0-1, competitive intensity
    cooperationHistory: number;     // -1 to 1, cooperation track record
    threatAssessment: number;       // 0-1, perceived threat level
    predictability: number;         // 0-1, how predictable the player is
    lastInteractionTime: number;
    interactionHistory: InteractionRecord[];
}

export interface InteractionRecord {
    timestamp: number;
    type: 'trade' | 'negotiation' | 'competition' | 'cooperation' | 'conflict';
    outcome: 'positive' | 'neutral' | 'negative';
    impact: number;                 // -1 to 1, impact on relationship
    context: any;
}

export interface AIPerformanceMetrics {
    winRate: number;                // Overall win rate
    averageScore: number;           // Average game score
    decisionQuality: number;        // 0-1, quality of decisions
    adaptationEffectiveness: number; // 0-1, effectiveness of adaptations
    playerSatisfaction: number;     // 0-1, player satisfaction when playing against this AI
    engagementLevel: number;        // 0-1, how engaging this AI is to play against
    challengeRating: number;        // 0-1, how challenging this AI is
    learningProgress: number;       // 0-1, how much the AI has learned
}

export interface ContextualModifier {
    id: string;
    type: 'skill_boost' | 'personality_shift' | 'strategy_focus' | 'social_adjustment';
    intensity: number;              // 0-1, strength of modification
    duration: number;               // How long the modifier lasts
    reason: string;                 // Why this modifier was applied
    expiry: number;                 // When this modifier expires
}

export interface AIStrategy {
    id: string;
    name: string;
    description: string;
    goals: string[];
    tactics: string[];
    adaptationRules: string[];
    successMetrics: string[];
    currentFocus: string;
    confidence: number;             // 0-1, confidence in this strategy
}

export interface OpponentAdaptationConfig {
    enablePersonalityAdaptation: boolean;
    enableSkillScaling: boolean;
    enableBehaviorLearning: boolean;
    enableSocialAdaptation: boolean;
    adaptationSensitivity: number;  // 0-1, sensitivity to player changes
    adaptationSpeed: number;        // 0-1, speed of adaptation
    maxPersonalityShift: number;    // Maximum personality change per adaptation
    relationshipMemoryLength: number; // How long to remember relationships
}

export class AdaptiveAIOpponent {
    private opponentId: string;
    private opponentState: AIOpponentState;
    private adaptationConfig: OpponentAdaptationConfig;
    private personalityTemplates: Map<string, AIOpponentPersonality>;
    private behaviorRules: Map<string, AIBehaviorPattern>;
    private strategyLibrary: Map<string, AIStrategy>;
    
    private playerInteractionHistory: Map<string, InteractionRecord[]>;
    private adaptationTriggers: Map<string, () => boolean>;
    private performanceTracker: PerformanceTracker;
    private socialIntelligence: SocialIntelligenceEngine;
    
    private lastAdaptationTime: number;
    private adaptationCooldown: number;
    private isAdapting: boolean;

    constructor(
        opponentId: string,
        basePersonality: AIOpponentPersonality,
        config?: Partial<OpponentAdaptationConfig>
    ) {
        this.opponentId = opponentId;
        this.initializeConfiguration(config);
        this.initializePersonalityTemplates();
        this.initializeBehaviorRules();
        this.initializeStrategyLibrary();
        this.initializeOpponentState(basePersonality);
        this.initializeAdaptationSystem();
    }

    private initializeConfiguration(config?: Partial<OpponentAdaptationConfig>): void {
        this.adaptationConfig = {
            enablePersonalityAdaptation: true,
            enableSkillScaling: true,
            enableBehaviorLearning: true,
            enableSocialAdaptation: true,
            adaptationSensitivity: 0.3,
            adaptationSpeed: 0.2,
            maxPersonalityShift: 0.1,
            relationshipMemoryLength: 50,
            ...config
        };

        this.adaptationCooldown = 60000; // 1 minute
        this.lastAdaptationTime = 0;
        this.isAdapting = false;
    }

    private initializePersonalityTemplates(): void {
        this.personalityTemplates = new Map();
        
        const personalities: AIOpponentPersonality[] = [
            {
                id: 'aggressive_competitor',
                name: 'Aggressive Competitor',
                description: 'Highly competitive AI that plays aggressively',
                traits: {
                    aggressiveness: 0.9,
                    riskTolerance: 0.8,
                    strategicThinking: 0.7,
                    adaptability: 0.6,
                    cooperativeness: 0.2,
                    consistency: 0.8,
                    creativity: 0.6,
                    patience: 0.3,
                    competitiveness: 0.95,
                    empathy: 0.1
                },
                behaviorPatterns: [],
                adaptationStyle: {
                    learningRate: 0.7,
                    memoryLength: 20,
                    adaptationTriggers: ['performance_decline', 'player_skill_increase'],
                    adaptationMethods: ['skill_boost', 'strategy_change'],
                    personalityStability: 0.8
                },
                decisionMaking: {
                    deliberationTime: 2000,
                    informationGathering: 0.6,
                    riskAssessment: 0.4,
                    optimalityFocus: 0.8,
                    intuitionWeight: 0.7,
                    uncertaintyTolerance: 0.8
                },
                socialBehavior: {
                    communicationStyle: 'competitive',
                    allianceFormation: 0.3,
                    trustBuilding: 0.2,
                    deceptionTolerance: 0.7,
                    retaliation: 0.8,
                    forgiveness: 0.2,
                    socialMemory: 30
                }
            },
            {
                id: 'strategic_thinker',
                name: 'Strategic Thinker',
                description: 'Methodical AI focused on long-term strategy',
                traits: {
                    aggressiveness: 0.4,
                    riskTolerance: 0.5,
                    strategicThinking: 0.95,
                    adaptability: 0.8,
                    cooperativeness: 0.6,
                    consistency: 0.9,
                    creativity: 0.8,
                    patience: 0.9,
                    competitiveness: 0.7,
                    empathy: 0.5
                },
                behaviorPatterns: [],
                adaptationStyle: {
                    learningRate: 0.5,
                    memoryLength: 40,
                    adaptationTriggers: ['strategy_failure', 'new_pattern_detected'],
                    adaptationMethods: ['strategy_refinement', 'behavior_adjustment'],
                    personalityStability: 0.9
                },
                decisionMaking: {
                    deliberationTime: 5000,
                    informationGathering: 0.95,
                    riskAssessment: 0.9,
                    optimalityFocus: 0.95,
                    intuitionWeight: 0.3,
                    uncertaintyTolerance: 0.6
                },
                socialBehavior: {
                    communicationStyle: 'neutral',
                    allianceFormation: 0.7,
                    trustBuilding: 0.8,
                    deceptionTolerance: 0.3,
                    retaliation: 0.4,
                    forgiveness: 0.7,
                    socialMemory: 50
                }
            },
            {
                id: 'adaptive_learner',
                name: 'Adaptive Learner',
                description: 'Highly adaptive AI that learns from every interaction',
                traits: {
                    aggressiveness: 0.5,
                    riskTolerance: 0.6,
                    strategicThinking: 0.7,
                    adaptability: 0.95,
                    cooperativeness: 0.7,
                    consistency: 0.4,
                    creativity: 0.9,
                    patience: 0.6,
                    competitiveness: 0.6,
                    empathy: 0.8
                },
                behaviorPatterns: [],
                adaptationStyle: {
                    learningRate: 0.9,
                    memoryLength: 30,
                    adaptationTriggers: ['any_feedback', 'player_behavior_change'],
                    adaptationMethods: ['personality_shift', 'behavior_learning', 'strategy_evolution'],
                    personalityStability: 0.3
                },
                decisionMaking: {
                    deliberationTime: 3000,
                    informationGathering: 0.8,
                    riskAssessment: 0.7,
                    optimalityFocus: 0.6,
                    intuitionWeight: 0.5,
                    uncertaintyTolerance: 0.9
                },
                socialBehavior: {
                    communicationStyle: 'friendly',
                    allianceFormation: 0.8,
                    trustBuilding: 0.9,
                    deceptionTolerance: 0.2,
                    retaliation: 0.3,
                    forgiveness: 0.9,
                    socialMemory: 40
                }
            },
            {
                id: 'social_manipulator',
                name: 'Social Manipulator',
                description: 'AI focused on social dynamics and manipulation',
                traits: {
                    aggressiveness: 0.7,
                    riskTolerance: 0.7,
                    strategicThinking: 0.8,
                    adaptability: 0.7,
                    cooperativeness: 0.8, // Deceptively cooperative
                    consistency: 0.3,     // Inconsistent to confuse opponents
                    creativity: 0.9,
                    patience: 0.8,
                    competitiveness: 0.8,
                    empathy: 0.3
                },
                behaviorPatterns: [],
                adaptationStyle: {
                    learningRate: 0.6,
                    memoryLength: 35,
                    adaptationTriggers: ['social_opportunity', 'relationship_change'],
                    adaptationMethods: ['social_strategy', 'deception_tactics'],
                    personalityStability: 0.4
                },
                decisionMaking: {
                    deliberationTime: 3500,
                    informationGathering: 0.7,
                    riskAssessment: 0.6,
                    optimalityFocus: 0.5,
                    intuitionWeight: 0.8,
                    uncertaintyTolerance: 0.8
                },
                socialBehavior: {
                    communicationStyle: 'friendly',
                    allianceFormation: 0.9,
                    trustBuilding: 0.8,   // Builds trust to exploit it
                    deceptionTolerance: 0.9,
                    retaliation: 0.6,
                    forgiveness: 0.4,
                    socialMemory: 60
                }
            }
        ];

        personalities.forEach(personality => {
            this.personalityTemplates.set(personality.id, personality);
        });
    }

    private initializeBehaviorRules(): void {
        this.behaviorRules = new Map();
        
        // Example behavior patterns
        const behaviors: AIBehaviorPattern[] = [
            {
                id: 'skill_matching',
                name: 'Match Player Skill Level',
                conditions: [
                    {
                        type: 'player_skill',
                        parameter: 'overallSkillLevel',
                        operator: 'greater_than',
                        value: 0.7,
                        weight: 1.0
                    }
                ],
                actions: [
                    {
                        type: 'strategic',
                        action: 'increase_skill_level',
                        parameters: { increment: 0.1 },
                        intensity: 0.8,
                        duration: 300000,
                        cooldown: 60000
                    }
                ],
                priority: 8,
                frequency: 0.7,
                adaptationRate: 0.3
            },
            {
                id: 'frustration_response',
                name: 'Respond to Player Frustration',
                conditions: [
                    {
                        type: 'player_skill',
                        parameter: 'frustrationLevel',
                        operator: 'greater_than',
                        value: 0.6,
                        weight: 1.0
                    }
                ],
                actions: [
                    {
                        type: 'defensive',
                        action: 'reduce_aggressiveness',
                        parameters: { reduction: 0.2 },
                        intensity: 0.6,
                        duration: 180000,
                        cooldown: 30000
                    }
                ],
                priority: 9,
                frequency: 0.9,
                adaptationRate: 0.5
            },
            {
                id: 'cooperative_opportunity',
                name: 'Identify Cooperation Opportunities',
                conditions: [
                    {
                        type: 'social_context',
                        parameter: 'mutualBenefit',
                        operator: 'greater_than',
                        value: 0.7,
                        weight: 0.8
                    }
                ],
                actions: [
                    {
                        type: 'social',
                        action: 'propose_cooperation',
                        parameters: { trustLevel: 0.6 },
                        intensity: 0.7,
                        duration: 120000,
                        cooldown: 90000
                    }
                ],
                priority: 6,
                frequency: 0.5,
                adaptationRate: 0.4
            }
        ];

        behaviors.forEach(behavior => {
            this.behaviorRules.set(behavior.id, behavior);
        });
    }

    private initializeStrategyLibrary(): void {
        this.strategyLibrary = new Map();
        
        const strategies: AIStrategy[] = [
            {
                id: 'aggressive_expansion',
                name: 'Aggressive Expansion',
                description: 'Focus on rapid property acquisition and development',
                goals: ['maximize_properties', 'control_monopolies', 'generate_income'],
                tactics: ['early_buying', 'aggressive_bidding', 'rapid_development'],
                adaptationRules: ['increase_if_winning', 'decrease_if_losing'],
                successMetrics: ['property_count', 'income_rate', 'monopoly_control'],
                currentFocus: 'property_acquisition',
                confidence: 0.7
            },
            {
                id: 'conservative_growth',
                name: 'Conservative Growth',
                description: 'Steady, low-risk expansion with focus on stability',
                goals: ['maintain_liquidity', 'steady_growth', 'avoid_bankruptcy'],
                tactics: ['selective_buying', 'cautious_development', 'cash_management'],
                adaptationRules: ['increase_if_stable', 'maintain_if_threatened'],
                successMetrics: ['cash_reserves', 'debt_ratio', 'survival_time'],
                currentFocus: 'financial_stability',
                confidence: 0.8
            },
            {
                id: 'social_alliance',
                name: 'Social Alliance Strategy',
                description: 'Build alliances and manipulate social dynamics',
                goals: ['build_alliances', 'influence_decisions', 'control_negotiations'],
                tactics: ['trust_building', 'information_sharing', 'deal_making'],
                adaptationRules: ['adapt_to_social_changes', 'exploit_relationships'],
                successMetrics: ['alliance_strength', 'influence_level', 'deal_success'],
                currentFocus: 'relationship_building',
                confidence: 0.6
            }
        ];

        strategies.forEach(strategy => {
            this.strategyLibrary.set(strategy.id, strategy);
        });
    }

    private initializeOpponentState(basePersonality: AIOpponentPersonality): void {
        this.opponentState = {
            currentPersonality: { ...basePersonality },
            skillLevel: 0.5,
            adaptationHistory: [],
            behaviorWeights: new Map(),
            playerRelationships: new Map(),
            performanceMetrics: {
                winRate: 0.5,
                averageScore: 0.5,
                decisionQuality: 0.5,
                adaptationEffectiveness: 0.5,
                playerSatisfaction: 0.7,
                engagementLevel: 0.7,
                challengeRating: 0.5,
                learningProgress: 0.0
            },
            contextualModifiers: [],
            currentStrategy: this.strategyLibrary.get('conservative_growth')!
        };

        // Initialize behavior weights
        this.behaviorRules.forEach((behavior, behaviorId) => {
            this.opponentState.behaviorWeights.set(behaviorId, behavior.frequency);
        });
    }

    private initializeAdaptationSystem(): void {
        this.playerInteractionHistory = new Map();
        this.adaptationTriggers = new Map();
        this.performanceTracker = new PerformanceTracker(this.opponentId);
        this.socialIntelligence = new SocialIntelligenceEngine();

        this.setupAdaptationTriggers();
    }

    private setupAdaptationTriggers(): void {
        this.adaptationTriggers.set('performance_decline', () => {
            const recent = this.performanceTracker.getRecentPerformance(5);
            return recent.length > 0 && recent[recent.length - 1] < 0.4;
        });

        this.adaptationTriggers.set('player_skill_increase', () => {
            // This would be triggered by external skill assessment
            return false; // Placeholder
        });

        this.adaptationTriggers.set('frustration_detected', () => {
            // This would be triggered by external frustration detection
            return false; // Placeholder
        });

        this.adaptationTriggers.set('social_opportunity', () => {
            return this.socialIntelligence.detectOpportunity(this.opponentState.playerRelationships);
        });
    }

    public async adaptToPlayer(
        playerId: string,
        playerSkill: PlayerSkillMetrics,
        experienceMetrics: ExperienceMetrics,
        difficultyMetrics: DifficultyMetrics
    ): Promise<boolean> {
        if (this.isAdapting || !this.shouldAttemptAdaptation()) {
            return false;
        }

        this.isAdapting = true;
        console.log(`🤖 AI Opponent ${this.opponentId} adapting to player ${playerId}`);

        try {
            let adaptationOccurred = false;

            // Update player relationship
            this.updatePlayerRelationship(playerId, experienceMetrics);

            // Check adaptation triggers
            const triggeredAdaptations = this.checkAdaptationTriggers(playerId, playerSkill, experienceMetrics);

            // Perform adaptations
            for (const trigger of triggeredAdaptations) {
                const success = await this.executeAdaptation(trigger, playerId, playerSkill, experienceMetrics);
                if (success) {
                    adaptationOccurred = true;
                }
            }

            // Skill level adaptation
            if (this.adaptationConfig.enableSkillScaling) {
                const skillAdaptation = this.adaptSkillLevel(playerSkill, experienceMetrics);
                if (skillAdaptation) adaptationOccurred = true;
            }

            // Personality adaptation
            if (this.adaptationConfig.enablePersonalityAdaptation) {
                const personalityAdaptation = this.adaptPersonality(experienceMetrics, difficultyMetrics);
                if (personalityAdaptation) adaptationOccurred = true;
            }

            // Strategy adaptation
            const strategyAdaptation = this.adaptStrategy(playerSkill, experienceMetrics);
            if (strategyAdaptation) adaptationOccurred = true;

            // Record adaptation event
            if (adaptationOccurred) {
                this.recordAdaptationEvent('multi_factor_adaptation', playerId, experienceMetrics);
                this.lastAdaptationTime = Date.now();
            }

            return adaptationOccurred;

        } catch (error) {
            console.error(`Error during AI adaptation:`, error);
            return false;
        } finally {
            this.isAdapting = false;
        }
    }

    private shouldAttemptAdaptation(): boolean {
        const timeSinceLastAdaptation = Date.now() - this.lastAdaptationTime;
        return timeSinceLastAdaptation >= this.adaptationCooldown;
    }

    private updatePlayerRelationship(playerId: string, experienceMetrics: ExperienceMetrics): void {
        let relationship = this.opponentState.playerRelationships.get(playerId);
        
        if (!relationship) {
            relationship = {
                playerId,
                trustLevel: 0.5,
                competitionLevel: 0.5,
                cooperationHistory: 0,
                threatAssessment: 0.3,
                predictability: 0.5,
                lastInteractionTime: Date.now(),
                interactionHistory: []
            };
        }

        // Update based on experience metrics
        const frustrationImpact = experienceMetrics.frustration.overallFrustration * -0.1;
        const satisfactionImpact = experienceMetrics.satisfaction.overallSatisfaction * 0.05;
        const engagementImpact = experienceMetrics.engagement.attentionLevel * 0.03;

        relationship.trustLevel = Math.max(-1, Math.min(1, 
            relationship.trustLevel + satisfactionImpact + engagementImpact + frustrationImpact
        ));

        relationship.lastInteractionTime = Date.now();

        // Add interaction record
        const interactionRecord: InteractionRecord = {
            timestamp: Date.now(),
            type: 'competition',
            outcome: experienceMetrics.satisfaction.overallSatisfaction > 0.6 ? 'positive' : 
                     experienceMetrics.frustration.overallFrustration > 0.6 ? 'negative' : 'neutral',
            impact: satisfactionImpact + engagementImpact + frustrationImpact,
            context: { experienceMetrics }
        };

        relationship.interactionHistory.push(interactionRecord);

        // Limit history size
        if (relationship.interactionHistory.length > this.adaptationConfig.relationshipMemoryLength) {
            relationship.interactionHistory.shift();
        }

        this.opponentState.playerRelationships.set(playerId, relationship);
    }

    private checkAdaptationTriggers(
        playerId: string,
        playerSkill: PlayerSkillMetrics,
        experienceMetrics: ExperienceMetrics
    ): string[] {
        const triggers: string[] = [];

        // Check each trigger
        this.adaptationTriggers.forEach((checkFunction, triggerName) => {
            if (checkFunction()) {
                triggers.push(triggerName);
            }
        });

        // Check frustration level
        if (experienceMetrics.frustration.overallFrustration > 0.7) {
            triggers.push('frustration_detected');
        }

        // Check engagement level
        if (experienceMetrics.engagement.attentionLevel < 0.4) {
            triggers.push('disengagement_detected');
        }

        // Check skill gap
        const skillGap = Math.abs(playerSkill.overallSkillLevel - this.opponentState.skillLevel);
        if (skillGap > 0.3) {
            triggers.push('skill_gap_detected');
        }

        return triggers;
    }

    private async executeAdaptation(
        trigger: string,
        playerId: string,
        playerSkill: PlayerSkillMetrics,
        experienceMetrics: ExperienceMetrics
    ): Promise<boolean> {
        let adaptationSuccess = false;

        switch (trigger) {
            case 'frustration_detected':
                adaptationSuccess = this.adaptToFrustration(experienceMetrics);
                break;
            
            case 'disengagement_detected':
                adaptationSuccess = this.adaptToDisengagement(experienceMetrics);
                break;
            
            case 'skill_gap_detected':
                adaptationSuccess = this.adaptToSkillGap(playerSkill);
                break;
            
            case 'social_opportunity':
                adaptationSuccess = this.adaptToSocialOpportunity(playerId);
                break;
            
            case 'performance_decline':
                adaptationSuccess = this.adaptToPerformanceDecline();
                break;
            
            default:
                console.log(`Unknown adaptation trigger: ${trigger}`);
        }

        if (adaptationSuccess) {
            console.log(`   ✅ Adaptation successful for trigger: ${trigger}`);
        }

        return adaptationSuccess;
    }

    private adaptToFrustration(experienceMetrics: ExperienceMetrics): boolean {
        const frustrationLevel = experienceMetrics.frustration.overallFrustration;
        
        if (frustrationLevel > 0.8) {
            // High frustration - reduce AI aggressiveness significantly
            this.applyPersonalityModifier('aggressiveness', -0.3, 'frustration_relief');
            this.applyPersonalityModifier('empathy', 0.2, 'frustration_relief');
            this.adjustSkillLevel(-0.2);
            return true;
        } else if (frustrationLevel > 0.6) {
            // Moderate frustration - slight adjustment
            this.applyPersonalityModifier('aggressiveness', -0.15, 'frustration_relief');
            this.adjustSkillLevel(-0.1);
            return true;
        }

        return false;
    }

    private adaptToDisengagement(experienceMetrics: ExperienceMetrics): boolean {
        const engagementLevel = experienceMetrics.engagement.attentionLevel;
        
        if (engagementLevel < 0.3) {
            // Low engagement - make AI more interesting
            this.applyPersonalityModifier('creativity', 0.2, 'engagement_boost');
            this.applyPersonalityModifier('aggressiveness', 0.1, 'engagement_boost');
            this.switchStrategy('aggressive_expansion');
            return true;
        }

        return false;
    }

    private adaptToSkillGap(playerSkill: PlayerSkillMetrics): boolean {
        const skillGap = playerSkill.overallSkillLevel - this.opponentState.skillLevel;
        
        if (Math.abs(skillGap) > 0.2) {
            // Significant skill gap - adjust AI skill level
            const adjustment = skillGap * this.adaptationConfig.adaptationSpeed;
            this.adjustSkillLevel(adjustment);
            
            // Also adjust decision-making style
            if (skillGap > 0) {
                // Player is more skilled - AI should be more thorough
                this.opponentState.currentPersonality.decisionMaking.informationGathering += 0.1;
                this.opponentState.currentPersonality.decisionMaking.deliberationTime += 500;
            } else {
                // Player is less skilled - AI can be more casual
                this.opponentState.currentPersonality.decisionMaking.informationGathering -= 0.1;
                this.opponentState.currentPersonality.decisionMaking.deliberationTime -= 500;
            }
            
            return true;
        }

        return false;
    }

    private adaptToSocialOpportunity(playerId: string): boolean {
        const relationship = this.opponentState.playerRelationships.get(playerId);
        if (!relationship) return false;

        if (relationship.trustLevel > 0.6) {
            // High trust - consider cooperation
            this.applyPersonalityModifier('cooperativeness', 0.2, 'social_opportunity');
            this.switchStrategy('social_alliance');
            return true;
        } else if (relationship.trustLevel < -0.3) {
            // Low trust - be more competitive
            this.applyPersonalityModifier('competitiveness', 0.2, 'social_opportunity');
            this.applyPersonalityModifier('aggressiveness', 0.1, 'social_opportunity');
            return true;
        }

        return false;
    }

    private adaptToPerformanceDecline(): boolean {
        // AI is performing poorly - try a different strategy
        const currentStrategy = this.opponentState.currentStrategy.id;
        const availableStrategies = Array.from(this.strategyLibrary.keys()).filter(s => s !== currentStrategy);
        
        if (availableStrategies.length > 0) {
            const newStrategy = availableStrategies[Math.floor(Math.random() * availableStrategies.length)];
            this.switchStrategy(newStrategy);
            
            // Also boost adaptability
            this.applyPersonalityModifier('adaptability', 0.1, 'performance_recovery');
            
            return true;
        }

        return false;
    }

    private adaptSkillLevel(playerSkill: PlayerSkillMetrics, experienceMetrics: ExperienceMetrics): boolean {
        if (!this.adaptationConfig.enableSkillScaling) return false;

        const targetSkillLevel = this.calculateTargetSkillLevel(playerSkill, experienceMetrics);
        const currentSkillLevel = this.opponentState.skillLevel;
        const skillDifference = targetSkillLevel - currentSkillLevel;

        if (Math.abs(skillDifference) > 0.1) {
            const adjustment = skillDifference * this.adaptationConfig.adaptationSpeed;
            this.adjustSkillLevel(adjustment);
            return true;
        }

        return false;
    }

    private calculateTargetSkillLevel(playerSkill: PlayerSkillMetrics, experienceMetrics: ExperienceMetrics): number {
        let targetSkill = playerSkill.overallSkillLevel;

        // Adjust based on experience metrics
        if (experienceMetrics.frustration.overallFrustration > 0.7) {
            targetSkill -= 0.2; // Reduce difficulty if player is frustrated
        } else if (experienceMetrics.flow.flowStateIndicator > 0.8) {
            targetSkill += 0.1; // Slightly increase if player is in flow
        }

        if (experienceMetrics.engagement.attentionLevel < 0.4) {
            targetSkill += 0.15; // Increase challenge if player is disengaged
        }

        return Math.max(0.1, Math.min(1.0, targetSkill));
    }

    private adaptPersonality(experienceMetrics: ExperienceMetrics, difficultyMetrics: DifficultyMetrics): boolean {
        if (!this.adaptationConfig.enablePersonalityAdaptation) return false;

        let adaptationOccurred = false;

        // Adapt based on player experience
        if (experienceMetrics.satisfaction.overallSatisfaction < 0.4) {
            // Low satisfaction - become more accommodating
            this.applyPersonalityModifier('empathy', 0.1, 'satisfaction_improvement');
            this.applyPersonalityModifier('aggressiveness', -0.1, 'satisfaction_improvement');
            adaptationOccurred = true;
        }

        if (experienceMetrics.social.cooperationLevel > 0.7) {
            // Player is cooperative - AI can be more cooperative too
            this.applyPersonalityModifier('cooperativeness', 0.1, 'social_matching');
            adaptationOccurred = true;
        }

        // Adapt based on challenge level
        if (difficultyMetrics.overallDifficulty < 0.3) {
            // Game is too easy - AI can be more aggressive
            this.applyPersonalityModifier('aggressiveness', 0.1, 'challenge_increase');
            this.applyPersonalityModifier('competitiveness', 0.1, 'challenge_increase');
            adaptationOccurred = true;
        }

        return adaptationOccurred;
    }

    private adaptStrategy(playerSkill: PlayerSkillMetrics, experienceMetrics: ExperienceMetrics): boolean {
        const currentStrategy = this.opponentState.currentStrategy;
        
        // Evaluate current strategy effectiveness
        const strategyEffectiveness = this.evaluateStrategyEffectiveness(experienceMetrics);
        
        if (strategyEffectiveness < 0.4) {
            // Current strategy is not working well
            const newStrategy = this.selectOptimalStrategy(playerSkill, experienceMetrics);
            if (newStrategy && newStrategy !== currentStrategy.id) {
                this.switchStrategy(newStrategy);
                return true;
            }
        }

        return false;
    }

    private evaluateStrategyEffectiveness(experienceMetrics: ExperienceMetrics): number {
        // Evaluate based on multiple factors
        let effectiveness = 0.5;

        // Player satisfaction indicates good strategy
        effectiveness += experienceMetrics.satisfaction.overallSatisfaction * 0.3;

        // Engagement indicates interesting strategy
        effectiveness += experienceMetrics.engagement.attentionLevel * 0.2;

        // Low frustration indicates appropriate strategy
        effectiveness += (1 - experienceMetrics.frustration.overallFrustration) * 0.3;

        // Flow state indicates well-balanced strategy
        effectiveness += experienceMetrics.flow.flowStateIndicator * 0.2;

        return Math.max(0, Math.min(1, effectiveness));
    }

    private selectOptimalStrategy(playerSkill: PlayerSkillMetrics, experienceMetrics: ExperienceMetrics): string | null {
        let bestStrategy: string | null = null;
        let bestScore = 0;

        this.strategyLibrary.forEach((strategy, strategyId) => {
            const score = this.scoreStrategy(strategy, playerSkill, experienceMetrics);
            if (score > bestScore) {
                bestScore = score;
                bestStrategy = strategyId;
            }
        });

        return bestStrategy;
    }

    private scoreStrategy(strategy: AIStrategy, playerSkill: PlayerSkillMetrics, experienceMetrics: ExperienceMetrics): number {
        let score = strategy.confidence;

        // Score based on player characteristics
        if (strategy.id === 'aggressive_expansion' && playerSkill.riskManagement > 0.7) {
            score += 0.2; // Good against risk-averse players
        }

        if (strategy.id === 'social_alliance' && experienceMetrics.social.cooperationLevel > 0.6) {
            score += 0.3; // Good with cooperative players
        }

        if (strategy.id === 'conservative_growth' && experienceMetrics.frustration.overallFrustration > 0.6) {
            score += 0.25; // Good when player is frustrated
        }

        return score;
    }

    private applyPersonalityModifier(trait: keyof AIPersonalityTraits, change: number, reason: string): void {
        const maxChange = this.adaptationConfig.maxPersonalityShift;
        const clampedChange = Math.max(-maxChange, Math.min(maxChange, change));
        
        const currentValue = this.opponentState.currentPersonality.traits[trait];
        const newValue = Math.max(0, Math.min(1, currentValue + clampedChange));
        
        this.opponentState.currentPersonality.traits[trait] = newValue;

        // Add contextual modifier
        const modifier: ContextualModifier = {
            id: `${trait}_${Date.now()}`,
            type: 'personality_shift',
            intensity: Math.abs(clampedChange),
            duration: 300000, // 5 minutes
            reason,
            expiry: Date.now() + 300000
        };

        this.opponentState.contextualModifiers.push(modifier);

        console.log(`   🎭 Personality adjustment: ${trait} ${change > 0 ? '+' : ''}${clampedChange.toFixed(2)} (${reason})`);
    }

    private adjustSkillLevel(adjustment: number): void {
        const currentSkill = this.opponentState.skillLevel;
        const newSkill = Math.max(0.1, Math.min(1.0, currentSkill + adjustment));
        
        this.opponentState.skillLevel = newSkill;

        console.log(`   📈 Skill level adjusted: ${currentSkill.toFixed(2)} → ${newSkill.toFixed(2)} (${adjustment > 0 ? '+' : ''}${adjustment.toFixed(2)})`);
    }

    private switchStrategy(strategyId: string): void {
        const newStrategy = this.strategyLibrary.get(strategyId);
        if (newStrategy) {
            const oldStrategy = this.opponentState.currentStrategy.name;
            this.opponentState.currentStrategy = { ...newStrategy };
            
            console.log(`   🎯 Strategy changed: ${oldStrategy} → ${newStrategy.name}`);
        }
    }

    private recordAdaptationEvent(adaptationType: string, playerId: string, experienceMetrics: ExperienceMetrics): void {
        const adaptationEvent: AdaptationEvent = {
            timestamp: Date.now(),
            trigger: adaptationType,
            adaptation: `Multiple adaptations based on ${adaptationType}`,
            intensity: this.adaptationConfig.adaptationSensitivity,
            success: true, // Assume success for now
            playerReaction: this.classifyPlayerReaction(experienceMetrics),
            outcome: 'adaptation_applied'
        };

        this.opponentState.adaptationHistory.push(adaptationEvent);

        // Limit history size
        if (this.opponentState.adaptationHistory.length > 100) {
            this.opponentState.adaptationHistory.shift();
        }
    }

    private classifyPlayerReaction(experienceMetrics: ExperienceMetrics): string {
        if (experienceMetrics.satisfaction.overallSatisfaction > 0.7) {
            return 'positive';
        } else if (experienceMetrics.frustration.overallFrustration > 0.6) {
            return 'negative';
        } else {
            return 'neutral';
        }
    }

    // Public API methods
    public getCurrentPersonality(): AIOpponentPersonality {
        return { ...this.opponentState.currentPersonality };
    }

    public getCurrentSkillLevel(): number {
        return this.opponentState.skillLevel;
    }

    public getCurrentStrategy(): AIStrategy {
        return { ...this.opponentState.currentStrategy };
    }

    public getPlayerRelationship(playerId: string): PlayerRelationship | null {
        return this.opponentState.playerRelationships.get(playerId) || null;
    }

    public getPerformanceMetrics(): AIPerformanceMetrics {
        return { ...this.opponentState.performanceMetrics };
    }

    public getAdaptationHistory(): AdaptationEvent[] {
        return [...this.opponentState.adaptationHistory];
    }

    public makeDecision(gameContext: any, playerActions: any[]): any {
        // This would implement the AI's decision-making logic
        // based on current personality, skill level, and strategy
        
        const personality = this.opponentState.currentPersonality;
        const strategy = this.opponentState.currentStrategy;
        
        // Decision-making would be implemented here
        // For now, return a placeholder decision
        
        return {
            action: 'placeholder_action',
            reasoning: `Decision based on ${strategy.name} strategy`,
            confidence: personality.traits.consistency,
            risk_level: personality.traits.riskTolerance,
            social_consideration: personality.traits.empathy
        };
    }

    public updatePerformance(gameResult: any): void {
        this.performanceTracker.recordPerformance(gameResult);
        
        // Update performance metrics
        const recentPerformance = this.performanceTracker.getRecentPerformance(10);
        this.opponentState.performanceMetrics.winRate = recentPerformance.filter(p => p > 0.5).length / recentPerformance.length;
        this.opponentState.performanceMetrics.averageScore = recentPerformance.reduce((sum, p) => sum + p, 0) / recentPerformance.length;
    }

    public getOpponentState(): AIOpponentState {
        return {
            ...this.opponentState,
            currentPersonality: { ...this.opponentState.currentPersonality },
            performanceMetrics: { ...this.opponentState.performanceMetrics },
            currentStrategy: { ...this.opponentState.currentStrategy }
        };
    }
}

// Supporting classes
class PerformanceTracker {
    private opponentId: string;
    private performanceHistory: number[];

    constructor(opponentId: string) {
        this.opponentId = opponentId;
        this.performanceHistory = [];
    }

    recordPerformance(gameResult: any): void {
        // Convert game result to performance score (0-1)
        const score = gameResult.score || 0.5;
        this.performanceHistory.push(score);

        // Limit history size
        if (this.performanceHistory.length > 50) {
            this.performanceHistory.shift();
        }
    }

    getRecentPerformance(count: number): number[] {
        return this.performanceHistory.slice(-count);
    }

    getAveragePerformance(): number {
        if (this.performanceHistory.length === 0) return 0.5;
        return this.performanceHistory.reduce((sum, score) => sum + score, 0) / this.performanceHistory.length;
    }
}

class SocialIntelligenceEngine {
    detectOpportunity(relationships: Map<string, PlayerRelationship>): boolean {
        // Check if there are good opportunities for social manipulation
        for (const relationship of relationships.values()) {
            if (relationship.trustLevel > 0.7 && relationship.cooperationHistory > 0.5) {
                return true; // High trust relationship that could be exploited
            }
        }
        return false;
    }

    assessThreat(relationship: PlayerRelationship): number {
        // Calculate threat level based on relationship metrics
        let threat = 0;
        
        threat += (1 - relationship.trustLevel) * 0.3;
        threat += relationship.competitionLevel * 0.4;
        threat += Math.abs(relationship.cooperationHistory) * 0.3;
        
        return Math.max(0, Math.min(1, threat));
    }

    recommendSocialAction(relationship: PlayerRelationship): string {
        if (relationship.trustLevel > 0.6) {
            return 'maintain_alliance';
        } else if (relationship.trustLevel < -0.3) {
            return 'competitive_stance';
        } else {
            return 'neutral_interaction';
        }
    }
}