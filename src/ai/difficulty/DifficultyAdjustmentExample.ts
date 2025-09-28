import { DifficultyAnalyzer, PlayerSkillMetrics, DifficultyMetrics } from './DifficultyAnalyzer';
import { DynamicDifficultyEngine } from './DynamicDifficultyEngine';
import { GameExperienceMonitor, ExperienceMetrics } from './GameExperienceMonitor';
import { AdaptiveAIOpponent } from './AdaptiveAIOpponent';
import { FlowStateDetector, FlowAnalysisResult } from './FlowStateDetector';

export interface IntegratedDifficultySystem {
  analyzer: DifficultyAnalyzer;
  engine: DynamicDifficultyEngine;
  monitor: GameExperienceMonitor;
  aiOpponent: AdaptiveAIOpponent;
  flowDetector: FlowStateDetector;
}

export interface DifficultyAdjustmentSession {
  playerId: string;
  sessionId: string;
  startTime: number;
  currentPhase: 'initialization' | 'monitoring' | 'adjusting' | 'optimizing' | 'complete';
  adjustmentHistory: DifficultyAdjustmentRecord[];
  performanceMetrics: SessionPerformanceMetrics;
}

export interface DifficultyAdjustmentRecord {
  timestamp: number;
  trigger: 'flow_decline' | 'frustration_spike' | 'engagement_drop' | 'skill_improvement' | 'manual_override';
  beforeState: SystemState;
  afterState: SystemState;
  adjustmentType: string;
  effectiveness: number;
  playerResponse: 'positive' | 'negative' | 'neutral';
}

export interface SystemState {
  playerSkill: PlayerSkillMetrics;
  difficulty: DifficultyMetrics;
  experience: ExperienceMetrics;
  flowScore: number;
  aiPersonality: any;
}

export interface SessionPerformanceMetrics {
  averageFlowScore: number;
  flowStabilityIndex: number;
  adjustmentFrequency: number;
  playerSatisfactionTrend: number[];
  engagementConsistency: number;
  optimalDifficultyHitRate: number;
}

export class ComprehensiveDifficultyAdjustmentExample {
  private system: IntegratedDifficultySystem;
  private activeSessions: Map<string, DifficultyAdjustmentSession> = new Map();
  private adjustmentCallbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.system = {
      analyzer: new DifficultyAnalyzer(),
      engine: new DynamicDifficultyEngine(),
      monitor: new GameExperienceMonitor(),
      aiOpponent: new AdaptiveAIOpponent(),
      flowDetector: new FlowStateDetector({
        sensitivityLevel: 'adaptive',
        detectionFrequency: 15000,
        historicalDataWindow: 30,
        adaptationSpeed: 0.15,
        flowThresholds: {
          entering: 0.35,
          maintaining: 0.55,
          optimal: 0.8,
          declining: 0.45
        }
      })
    };

    this.initializeSystemIntegration();
  }

  private initializeSystemIntegration(): void {
    this.system.monitor.on('experienceUpdate', async (playerId: string, experience: ExperienceMetrics) => {
      await this.handleExperienceUpdate(playerId, experience);
    });

    this.system.flowDetector.startFlowDetection = ((originalMethod) => {
      return function(this: any, playerId: string) {
        originalMethod.call(this, playerId);
        console.log(`Flow detection started for player: ${playerId}`);
      };
    })(this.system.flowDetector.startFlowDetection.bind(this.system.flowDetector));
  }

  public async startDifficultyAdjustmentSession(playerId: string, gameData: any): Promise<string> {
    const sessionId = `session_${playerId}_${Date.now()}`;
    
    const session: DifficultyAdjustmentSession = {
      playerId,
      sessionId,
      startTime: Date.now(),
      currentPhase: 'initialization',
      adjustmentHistory: [],
      performanceMetrics: {
        averageFlowScore: 0,
        flowStabilityIndex: 0,
        adjustmentFrequency: 0,
        playerSatisfactionTrend: [],
        engagementConsistency: 0,
        optimalDifficultyHitRate: 0
      }
    };

    this.activeSessions.set(sessionId, session);

    await this.initializePlayerProfile(playerId, gameData);
    
    this.system.monitor.startMonitoring(playerId);
    this.system.flowDetector.startFlowDetection(playerId);

    session.currentPhase = 'monitoring';

    console.log(`🎮 Started difficulty adjustment session for player ${playerId}`);
    console.log(`📊 Session ID: ${sessionId}`);
    
    return sessionId;
  }

  private async initializePlayerProfile(playerId: string, gameData: any): Promise<void> {
    console.log(`\n🔍 Initializing player profile for ${playerId}...`);

    const initialSkillAnalysis = await this.system.analyzer.analyzePlayerSkill(
      playerId, 
      gameData, 
      { recentMoves: [], decisionTimes: [], successRate: 0.5 }
    );

    console.log(`📈 Initial skill analysis:`, {
      decisionSpeed: initialSkillAnalysis.decisionSpeed.toFixed(2),
      strategicThinking: initialSkillAnalysis.strategicThinking.toFixed(2),
      riskManagement: initialSkillAnalysis.riskManagement.toFixed(2),
      adaptability: initialSkillAnalysis.adaptability.toFixed(2)
    });

    await this.system.aiOpponent.adaptToPlayer(
      playerId,
      initialSkillAnalysis,
      await this.getMockExperienceMetrics(playerId),
      await this.getMockDifficultyMetrics()
    );

    console.log(`🤖 AI opponent adapted to player skill level`);
  }

  private async handleExperienceUpdate(playerId: string, experience: ExperienceMetrics): Promise<void> {
    const session = this.getPlayerSession(playerId);
    if (!session) return;

    const flowAnalysis = await this.system.flowDetector.analyzeFlowState(playerId);
    await this.evaluateAdjustmentNeeds(session, experience, flowAnalysis);
  }

  private async evaluateAdjustmentNeeds(
    session: DifficultyAdjustmentSession, 
    experience: ExperienceMetrics,
    flowAnalysis: FlowAnalysisResult
  ): Promise<void> {
    const playerId = session.playerId;
    const flowScore = flowAnalysis.currentFlow.overallFlowScore;
    const flowPhase = flowAnalysis.currentFlow.flowPhase;

    console.log(`\n🌊 Flow analysis for ${playerId}:`);
    console.log(`   Current flow score: ${flowScore.toFixed(3)}`);
    console.log(`   Flow phase: ${flowPhase}`);
    console.log(`   Flow quality: ${flowAnalysis.currentFlow.flowQuality}`);

    let adjustmentTrigger: DifficultyAdjustmentRecord['trigger'] | null = null;

    if (experience.frustration > 0.7) {
      adjustmentTrigger = 'frustration_spike';
      console.log(`⚠️  High frustration detected: ${experience.frustration.toFixed(2)}`);
    } else if (experience.engagement < 0.4) {
      adjustmentTrigger = 'engagement_drop';
      console.log(`📉 Low engagement detected: ${experience.engagement.toFixed(2)}`);
    } else if (flowPhase === 'declining' && flowScore < 0.5) {
      adjustmentTrigger = 'flow_decline';
      console.log(`🌊 Flow state decline detected`);
    } else if (flowScore > 0.8 && flowAnalysis.currentFlow.flowStability > 0.7) {
      adjustmentTrigger = 'skill_improvement';
      console.log(`📈 Player skill improvement detected`);
    }

    if (adjustmentTrigger) {
      await this.executeDifficultyAdjustment(session, adjustmentTrigger, experience, flowAnalysis);
    }

    await this.updateSessionMetrics(session, experience, flowAnalysis);
  }

  private async executeDifficultyAdjustment(
    session: DifficultyAdjustmentSession,
    trigger: DifficultyAdjustmentRecord['trigger'],
    experience: ExperienceMetrics,
    flowAnalysis: FlowAnalysisResult
  ): Promise<void> {
    const playerId = session.playerId;
    session.currentPhase = 'adjusting';

    console.log(`\n🔧 Executing difficulty adjustment for ${playerId}`);
    console.log(`   Trigger: ${trigger}`);

    const beforeState = await this.captureSystemState(playerId);
    
    const playerSkill = await this.system.analyzer.analyzePlayerSkill(
      playerId,
      await this.getMockGameData(playerId),
      await this.getMockPerformanceData(playerId)
    );

    const difficultyTransition = await this.system.engine.processDifficultyAdjustment(
      playerId,
      await this.getMockGameData(playerId),
      await this.getMockPerformanceData(playerId)
    );

    if (difficultyTransition) {
      console.log(`   🎯 Difficulty adjustment strategy: ${difficultyTransition.strategy.type}`);
      console.log(`   📊 Confidence: ${difficultyTransition.strategy.confidence.toFixed(2)}`);
      
      await this.applyDifficultyAdjustment(playerId, difficultyTransition);
    }

    const aiAdaptationSuccess = await this.system.aiOpponent.adaptToPlayer(
      playerId,
      playerSkill,
      experience,
      await this.getMockDifficultyMetrics()
    );

    if (aiAdaptationSuccess) {
      console.log(`   🤖 AI opponent successfully adapted`);
    }

    const afterState = await this.captureSystemState(playerId);
    
    const adjustmentRecord: DifficultyAdjustmentRecord = {
      timestamp: Date.now(),
      trigger,
      beforeState,
      afterState,
      adjustmentType: difficultyTransition?.strategy.type || 'ai_adaptation',
      effectiveness: await this.calculateAdjustmentEffectiveness(beforeState, afterState),
      playerResponse: 'neutral'
    };

    session.adjustmentHistory.push(adjustmentRecord);
    session.currentPhase = 'monitoring';

    console.log(`   ✅ Adjustment completed with effectiveness: ${adjustmentRecord.effectiveness.toFixed(2)}`);

    await this.triggerAdjustmentCallbacks(playerId, adjustmentRecord);
  }

  private async applyDifficultyAdjustment(playerId: string, transition: any): Promise<void> {
    console.log(`   🎮 Applying ${transition.strategy.type} adjustment...`);
    
    switch (transition.strategy.type) {
      case 'reduce_complexity':
        console.log(`     - Reducing game complexity by ${(transition.strategy.magnitude * 100).toFixed(1)}%`);
        break;
      case 'increase_challenge':
        console.log(`     - Increasing challenge level by ${(transition.strategy.magnitude * 100).toFixed(1)}%`);
        break;
      case 'adjust_time_pressure':
        console.log(`     - Adjusting time pressure by ${(transition.strategy.magnitude * 100).toFixed(1)}%`);
        break;
      case 'modify_information_availability':
        console.log(`     - Modifying information availability`);
        break;
      case 'tune_randomness':
        console.log(`     - Tuning randomness level`);
        break;
      case 'adaptive_guidance':
        console.log(`     - Providing adaptive guidance`);
        break;
      case 'social_interaction_adjustment':
        console.log(`     - Adjusting social interaction complexity`);
        break;
      case 'personalized_content':
        console.log(`     - Delivering personalized content`);
        break;
    }
  }

  private async updateSessionMetrics(
    session: DifficultyAdjustmentSession,
    experience: ExperienceMetrics,
    flowAnalysis: FlowAnalysisResult
  ): Promise<void> {
    const metrics = session.performanceMetrics;
    const flowHistory = this.system.flowDetector.getFlowHistory(session.playerId);
    
    if (flowHistory.length > 0) {
      metrics.averageFlowScore = flowHistory.reduce((sum, flow) => sum + flow.overallFlowScore, 0) / flowHistory.length;
      metrics.flowStabilityIndex = flowAnalysis.currentFlow.flowStability;
    }

    metrics.playerSatisfactionTrend.push(experience.satisfaction);
    if (metrics.playerSatisfactionTrend.length > 20) {
      metrics.playerSatisfactionTrend = metrics.playerSatisfactionTrend.slice(-20);
    }

    metrics.adjustmentFrequency = session.adjustmentHistory.length / ((Date.now() - session.startTime) / (1000 * 60));
    metrics.engagementConsistency = this.calculateEngagementConsistency(session);
    metrics.optimalDifficultyHitRate = this.calculateOptimalDifficultyHitRate(session);
  }

  private calculateEngagementConsistency(session: DifficultyAdjustmentSession): number {
    const satisfactionTrend = session.performanceMetrics.playerSatisfactionTrend;
    if (satisfactionTrend.length < 3) return 0.5;

    const variance = this.calculateVariance(satisfactionTrend);
    return Math.max(0, Math.min(1, 1 - variance));
  }

  private calculateOptimalDifficultyHitRate(session: DifficultyAdjustmentSession): number {
    const flowHistory = this.system.flowDetector.getFlowHistory(session.playerId);
    if (flowHistory.length === 0) return 0;

    const optimalCount = flowHistory.filter(flow => flow.overallFlowScore >= 0.7).length;
    return optimalCount / flowHistory.length;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  public async demonstrateFullCycle(playerId: string): Promise<void> {
    console.log(`\n🚀 Starting comprehensive difficulty adjustment demonstration for player: ${playerId}`);
    console.log(`=================================================================`);

    const sessionId = await this.startDifficultyAdjustmentSession(playerId, {
      gameType: 'monopoly',
      previousSessions: [],
      initialPreferences: { difficulty: 'medium', pacing: 'normal' }
    });

    console.log(`\n⏱️  Phase 1: Initial Assessment (15 seconds)`);
    await this.simulateGameplayPhase(playerId, 'initial_assessment', 15000);

    console.log(`\n🎯 Phase 2: Skill Detection (30 seconds)`);
    await this.simulateGameplayPhase(playerId, 'skill_detection', 30000);

    console.log(`\n🔄 Phase 3: Adaptive Adjustments (45 seconds)`);
    await this.simulateGameplayPhase(playerId, 'adaptive_adjustments', 45000);

    console.log(`\n🌊 Phase 4: Flow Optimization (30 seconds)`);
    await this.simulateGameplayPhase(playerId, 'flow_optimization', 30000);

    const finalReport = await this.generateSessionReport(sessionId);
    console.log(`\n📊 Session Summary:`);
    console.log(`   Total adjustments: ${finalReport.totalAdjustments}`);
    console.log(`   Average flow score: ${finalReport.averageFlowScore.toFixed(3)}`);
    console.log(`   Optimal difficulty hit rate: ${(finalReport.optimalDifficultyHitRate * 100).toFixed(1)}%`);
    console.log(`   Player satisfaction trend: ${finalReport.satisfactionTrend}`);

    await this.endSession(sessionId);
    console.log(`\n✅ Demonstration completed successfully!`);
  }

  private async simulateGameplayPhase(playerId: string, phase: string, duration: number): Promise<void> {
    const startTime = Date.now();
    let iteration = 0;

    while (Date.now() - startTime < duration) {
      iteration++;
      
      const mockExperience = await this.generatePhaseSpecificExperience(phase, iteration);
      
      await this.system.monitor.updateExperienceMetrics(playerId, mockExperience);
      
      if (iteration % 3 === 0) {
        const flowAnalysis = await this.system.flowDetector.analyzeFlowState(playerId);
        console.log(`     [${phase}] Iteration ${iteration}: Flow=${flowAnalysis.currentFlow.overallFlowScore.toFixed(2)}, Engagement=${mockExperience.engagement.toFixed(2)}`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  private async generatePhaseSpecificExperience(phase: string, iteration: number): Promise<ExperienceMetrics> {
    const baseExperience = await this.getMockExperienceMetrics('demo_player');
    
    switch (phase) {
      case 'initial_assessment':
        return {
          ...baseExperience,
          engagement: 0.6 + (Math.random() * 0.2),
          challenge: 0.5 + (Math.random() * 0.3),
          satisfaction: 0.5 + (Math.random() * 0.2)
        };
        
      case 'skill_detection':
        return {
          ...baseExperience,
          engagement: 0.7 + (Math.random() * 0.2),
          challenge: 0.6 + (Math.random() * 0.3),
          frustration: Math.max(0, 0.4 - (iteration * 0.02)),
          flow: 0.4 + (iteration * 0.02)
        };
        
      case 'adaptive_adjustments':
        return {
          ...baseExperience,
          engagement: 0.75 + (Math.random() * 0.15),
          satisfaction: 0.7 + (iteration * 0.01),
          flow: 0.6 + (iteration * 0.015),
          frustration: Math.max(0, 0.3 - (iteration * 0.01))
        };
        
      case 'flow_optimization':
        return {
          ...baseExperience,
          engagement: 0.85 + (Math.random() * 0.1),
          satisfaction: 0.8 + (Math.random() * 0.1),
          flow: 0.8 + (Math.random() * 0.15),
          frustration: 0.1 + (Math.random() * 0.1)
        };
        
      default:
        return baseExperience;
    }
  }

  private async generateSessionReport(sessionId: string): Promise<any> {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const flowHistory = this.system.flowDetector.getFlowHistory(session.playerId);
    const metrics = session.performanceMetrics;

    return {
      sessionId,
      playerId: session.playerId,
      duration: Date.now() - session.startTime,
      totalAdjustments: session.adjustmentHistory.length,
      averageFlowScore: metrics.averageFlowScore,
      optimalDifficultyHitRate: metrics.optimalDifficultyHitRate,
      satisfactionTrend: metrics.playerSatisfactionTrend.length > 0 ? 
        (metrics.playerSatisfactionTrend[metrics.playerSatisfactionTrend.length - 1] > metrics.playerSatisfactionTrend[0] ? 'improving' : 'stable') : 'unknown',
      adjustmentHistory: session.adjustmentHistory.map(adj => ({
        trigger: adj.trigger,
        type: adj.adjustmentType,
        effectiveness: adj.effectiveness
      }))
    };
  }

  private async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    this.system.monitor.stopMonitoring(session.playerId);
    this.system.flowDetector.stopFlowDetection(session.playerId);
    
    session.currentPhase = 'complete';
    this.activeSessions.delete(sessionId);
    
    console.log(`🏁 Session ${sessionId} ended successfully`);
  }

  private getPlayerSession(playerId: string): DifficultyAdjustmentSession | undefined {
    for (const session of this.activeSessions.values()) {
      if (session.playerId === playerId) {
        return session;
      }
    }
    return undefined;
  }

  private async captureSystemState(playerId: string): Promise<SystemState> {
    return {
      playerSkill: await this.system.analyzer.analyzePlayerSkill(
        playerId,
        await this.getMockGameData(playerId),
        await this.getMockPerformanceData(playerId)
      ),
      difficulty: await this.getMockDifficultyMetrics(),
      experience: await this.getMockExperienceMetrics(playerId),
      flowScore: this.system.flowDetector.getCurrentFlowScore(playerId),
      aiPersonality: await this.system.aiOpponent.getCurrentPersonality(playerId)
    };
  }

  private async calculateAdjustmentEffectiveness(before: SystemState, after: SystemState): Promise<number> {
    const flowImprovement = after.flowScore - before.flowScore;
    const satisfactionImprovement = after.experience.satisfaction - before.experience.satisfaction;
    const frustrationReduction = before.experience.frustration - after.experience.frustration;
    
    const effectiveness = (flowImprovement * 0.4 + satisfactionImprovement * 0.3 + frustrationReduction * 0.3);
    return Math.max(0, Math.min(1, 0.5 + effectiveness));
  }

  private async triggerAdjustmentCallbacks(playerId: string, record: DifficultyAdjustmentRecord): Promise<void> {
    const callbacks = this.adjustmentCallbacks.get(playerId) || [];
    for (const callback of callbacks) {
      try {
        await callback(record);
      } catch (error) {
        console.error(`Callback error for player ${playerId}:`, error);
      }
    }
  }

  public onAdjustment(playerId: string, callback: Function): void {
    if (!this.adjustmentCallbacks.has(playerId)) {
      this.adjustmentCallbacks.set(playerId, []);
    }
    this.adjustmentCallbacks.get(playerId)!.push(callback);
  }

  private async getMockGameData(playerId: string): Promise<any> {
    return {
      currentProperty: 'Park Place',
      playerPosition: 35,
      ownedProperties: ['Reading Railroad', 'Pennsylvania Avenue'],
      cashAmount: 1500,
      turnsInJail: 0,
      gamePhase: 'mid_game'
    };
  }

  private async getMockPerformanceData(playerId: string): Promise<any> {
    return {
      recentMoves: ['buy_property', 'pay_rent', 'collect_go'],
      decisionTimes: [2.3, 1.8, 4.2, 3.1],
      successRate: 0.75,
      efficiency: 0.68
    };
  }

  private async getMockDifficultyMetrics(): Promise<DifficultyMetrics> {
    return {
      gameComplexity: 0.6,
      opponentStrength: 0.7,
      timeConstraints: 0.5,
      informationAvailability: 0.8,
      randomnessLevel: 0.3,
      socialComplexity: 0.6
    };
  }

  private async getMockExperienceMetrics(playerId: string): Promise<ExperienceMetrics> {
    return {
      engagement: 0.7 + (Math.random() * 0.2),
      frustration: 0.2 + (Math.random() * 0.3),
      satisfaction: 0.6 + (Math.random() * 0.3),
      flow: 0.5 + (Math.random() * 0.4),
      challenge: 0.6 + (Math.random() * 0.3),
      progression: 0.5 + (Math.random() * 0.3),
      social: 0.6 + (Math.random() * 0.2),
      immersion: 0.7 + (Math.random() * 0.2),
      enjoyment: 0.7 + (Math.random() * 0.2),
      anxiety: 0.2 + (Math.random() * 0.2),
      selfDoubt: 0.2 + (Math.random() * 0.2),
      distraction: 0.1 + (Math.random() * 0.2),
      focus: 0.7 + (Math.random() * 0.2),
      mentalFatigue: 0.3 + (Math.random() * 0.2),
      timePerceptionDistortion: 0.5 + (Math.random() * 0.3),
      curiosity: 0.7 + (Math.random() * 0.2),
      autonomy: 0.8 + (Math.random() * 0.1),
      mastery: 0.6 + (Math.random() * 0.2),
      purpose: 0.7 + (Math.random() * 0.2),
      goalClarity: 0.8 + (Math.random() * 0.1),
      feedbackQuality: 0.7 + (Math.random() * 0.2),
      overwhelm: 0.1 + (Math.random() * 0.2),
      confidence: 0.7 + (Math.random() * 0.2)
    };
  }

  public getSystemStatus(): any {
    return {
      activeSessions: this.activeSessions.size,
      systemComponents: {
        analyzer: 'active',
        engine: 'active',
        monitor: 'active',
        aiOpponent: 'active',
        flowDetector: 'active'
      }
    };
  }

  public cleanup(): void {
    for (const session of this.activeSessions.values()) {
      this.endSession(session.sessionId);
    }
    
    this.system.flowDetector.cleanup();
    this.adjustmentCallbacks.clear();
    
    console.log('🧹 Difficulty adjustment system cleaned up');
  }
}

export async function runDifficultyAdjustmentDemo(): Promise<void> {
  console.log(`\n🎮 Starting Comprehensive Difficulty Adjustment System Demo`);
  console.log(`============================================================`);
  
  const demo = new ComprehensiveDifficultyAdjustmentExample();
  
  try {
    await demo.demonstrateFullCycle('demo_player_001');
    
    console.log(`\n🎯 Demo completed successfully!`);
    console.log(`\nKey Features Demonstrated:`);
    console.log(`✅ Real-time skill analysis and adaptation`);
    console.log(`✅ Dynamic difficulty adjustment based on player state`);
    console.log(`✅ Flow state detection and optimization`);
    console.log(`✅ Adaptive AI opponent personality adjustment`);
    console.log(`✅ Comprehensive experience monitoring`);
    console.log(`✅ Predictive difficulty management`);
    
  } catch (error) {
    console.error(`❌ Demo failed:`, error);
  } finally {
    demo.cleanup();
  }
}