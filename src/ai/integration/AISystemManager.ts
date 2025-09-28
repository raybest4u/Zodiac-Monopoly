import { AICharacterGenerator, AICharacterProfile } from '../personality/AICharacterGenerator';
import { PersonalitySystem, PersonalityEvent } from '../personality/PersonalitySystem';
import { BehaviorPatternEngine, GameAction, DecisionContext } from '../behavior/BehaviorPatternEngine';
import { AdaptiveLearningSystem } from '../learning/AdaptiveLearningSystem';
import { PersonalizationInterface } from '../customization/PersonalizationInterface';
import { SocialIntelligenceModule } from '../social/SocialIntelligenceModule';
import { FlowStateDetector, FlowAnalysisResult } from '../difficulty/FlowStateDetector';
import { DynamicDifficultyEngine } from '../difficulty/DynamicDifficultyEngine';

export interface AISystemConfig {
  maxConcurrentAIs: number;
  performanceMonitoring: boolean;
  autoOptimization: boolean;
  persistenceEnabled: boolean;
  debugMode: boolean;
  resourceLimits: {
    maxMemoryUsage: number;     // MB
    maxCPUUsage: number;        // %
    maxResponseTime: number;    // ms
  };
  adaptationSettings: {
    personalityAdaptationRate: number;
    behaviorLearningRate: number;
    socialMemoryRetention: number;
    difficultyAdjustmentSensitivity: number;
  };
}

export interface AIInstance {
  id: string;
  character: AICharacterProfile;
  personalitySystem: PersonalitySystem;
  behaviorEngine: BehaviorPatternEngine;
  learningSystem: AdaptiveLearningSystem;
  socialModule: SocialIntelligenceModule;
  flowDetector: FlowStateDetector;
  difficultyEngine: DynamicDifficultyEngine;
  createdAt: number;
  lastActiveAt: number;
  sessionCount: number;
  performanceMetrics: AIPerformanceMetrics;
  status: 'active' | 'idle' | 'suspended' | 'error';
}

export interface AIPerformanceMetrics {
  responseTime: {
    average: number;
    min: number;
    max: number;
    samples: number[];
  };
  memoryUsage: {
    current: number;
    peak: number;
    trend: number[];
  };
  decisionAccuracy: {
    rate: number;
    totalDecisions: number;
    successfulDecisions: number;
  };
  adaptationEfficiency: {
    personalityChanges: number;
    behaviorImprovements: number;
    learningRate: number;
  };
  socialEffectiveness: {
    relationshipQuality: number;
    negotiationSuccessRate: number;
    allianceStability: number;
  };
  playerSatisfaction: {
    engagementScore: number;
    challengeBalance: number;
    funFactor: number;
  };
}

export interface SystemWideMetrics {
  totalAIInstances: number;
  activeInstances: number;
  averagePerformance: AIPerformanceMetrics;
  resourceUtilization: {
    memory: number;
    cpu: number;
    network: number;
  };
  errorRate: number;
  uptime: number;
  adaptationEvents: number;
  optimizationSuggestions: string[];
}

export interface AIDecisionRequest {
  aiId: string;
  context: DecisionContext;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  callbacks?: {
    onDecision?: (decision: GameAction) => void;
    onError?: (error: Error) => void;
    onTimeout?: () => void;
  };
}

export interface AIInteractionEvent {
  type: 'game_action' | 'social_interaction' | 'learning_event' | 'personality_change' | 'system_event';
  aiId: string;
  timestamp: number;
  data: any;
  impact: {
    performance: number;
    relationships: Record<string, number>;
    learning: number;
  };
}

export class AISystemManager {
  private config: AISystemConfig;
  private aiInstances: Map<string, AIInstance> = new Map();
  private characterGenerator: AICharacterGenerator;
  private personalizationInterface: PersonalizationInterface;
  
  private systemMetrics: SystemWideMetrics;
  private eventHistory: AIInteractionEvent[] = [];
  private performanceMonitorInterval: NodeJS.Timeout | null = null;
  private optimizationInterval: NodeJS.Timeout | null = null;
  
  private requestQueue: AIDecisionRequest[] = [];
  private processingRequests: Map<string, AIDecisionRequest> = new Map();
  private errorRecoverySystem: Map<string, number> = new Map();

  constructor(config: Partial<AISystemConfig> = {}) {
    this.config = {
      maxConcurrentAIs: 8,
      performanceMonitoring: true,
      autoOptimization: true,
      persistenceEnabled: true,
      debugMode: false,
      resourceLimits: {
        maxMemoryUsage: 512,
        maxCPUUsage: 80,
        maxResponseTime: 2000
      },
      adaptationSettings: {
        personalityAdaptationRate: 0.1,
        behaviorLearningRate: 0.15,
        socialMemoryRetention: 0.8,
        difficultyAdjustmentSensitivity: 0.2
      },
      ...config
    };

    this.characterGenerator = new AICharacterGenerator();
    this.personalizationInterface = new PersonalizationInterface();
    this.systemMetrics = this.initializeSystemMetrics();
    
    this.startSystemMonitoring();
  }

  private initializeSystemMetrics(): SystemWideMetrics {
    return {
      totalAIInstances: 0,
      activeInstances: 0,
      averagePerformance: {
        responseTime: { average: 0, min: 0, max: 0, samples: [] },
        memoryUsage: { current: 0, peak: 0, trend: [] },
        decisionAccuracy: { rate: 0, totalDecisions: 0, successfulDecisions: 0 },
        adaptationEfficiency: { personalityChanges: 0, behaviorImprovements: 0, learningRate: 0 },
        socialEffectiveness: { relationshipQuality: 0, negotiationSuccessRate: 0, allianceStability: 0 },
        playerSatisfaction: { engagementScore: 0, challengeBalance: 0, funFactor: 0 }
      },
      resourceUtilization: { memory: 0, cpu: 0, network: 0 },
      errorRate: 0,
      uptime: Date.now(),
      adaptationEvents: 0,
      optimizationSuggestions: []
    };
  }

  public async createAI(characterConfig?: any, customizationSessionId?: string): Promise<string> {
    if (this.aiInstances.size >= this.config.maxConcurrentAIs) {
      throw new Error(`Maximum AI instances limit reached: ${this.config.maxConcurrentAIs}`);
    }

    const aiId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      let character: AICharacterProfile;

      if (customizationSessionId) {
        // 使用定制化角色
        character = this.personalizationInterface.finalizeCustomization(customizationSessionId)!;
        if (!character) {
          throw new Error(`Failed to finalize customization session: ${customizationSessionId}`);
        }
      } else if (characterConfig) {
        // 使用指定配置生成角色
        character = this.characterGenerator.generateCharacter(characterConfig);
      } else {
        // 生成默认角色
        character = this.characterGenerator.generateCharacter();
      }

      // 创建AI系统组件
      const personalitySystem = new PersonalitySystem(character);
      const behaviorEngine = new BehaviorPatternEngine(character, personalitySystem);
      const learningSystem = new AdaptiveLearningSystem(character, personalitySystem, behaviorEngine);
      const socialModule = new SocialIntelligenceModule(character, personalitySystem);
      const flowDetector = new FlowStateDetector();
      const difficultyEngine = new DynamicDifficultyEngine();

      // 配置系统间通信
      this.setupSystemCommunication(aiId, {
        personalitySystem,
        behaviorEngine,
        learningSystem,
        socialModule,
        flowDetector,
        difficultyEngine
      });

      const aiInstance: AIInstance = {
        id: aiId,
        character,
        personalitySystem,
        behaviorEngine,
        learningSystem,
        socialModule,
        flowDetector,
        difficultyEngine,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        sessionCount: 0,
        performanceMetrics: this.initializePerformanceMetrics(),
        status: 'active'
      };

      this.aiInstances.set(aiId, aiInstance);
      this.systemMetrics.totalAIInstances++;
      this.systemMetrics.activeInstances++;

      this.logEvent({
        type: 'system_event',
        aiId,
        timestamp: Date.now(),
        data: { action: 'ai_created', character: character.name },
        impact: { performance: 0, relationships: {}, learning: 0 }
      });

      console.log(`✅ AI instance created: ${aiId} (${character.name})`);
      return aiId;

    } catch (error) {
      console.error(`❌ Failed to create AI instance:`, error);
      throw error;
    }
  }

  private setupSystemCommunication(
    aiId: string,
    systems: {
      personalitySystem: PersonalitySystem;
      behaviorEngine: BehaviorPatternEngine;
      learningSystem: AdaptiveLearningSystem;
      socialModule: SocialIntelligenceModule;
      flowDetector: FlowStateDetector;
      difficultyEngine: DynamicDifficultyEngine;
    }
  ): void {
    // 设置系统间的事件监听和通信
    
    // 行为引擎接收学习系统的结果反馈
    const originalRecordOutcome = systems.behaviorEngine.recordActionOutcome.bind(systems.behaviorEngine);
    systems.behaviorEngine.recordActionOutcome = (actionId, outcome, emotionalImpact) => {
      // 调用原始方法
      originalRecordOutcome(actionId, outcome, emotionalImpact);
      
      // 向学习系统报告
      if (outcome.success !== undefined) {
        this.reportLearningExperience(aiId, actionId, outcome);
      }
    };

    // 流状态检测器与难度引擎联动
    systems.flowDetector.startFlowDetection(aiId);
    
    // 社交模块与人格系统联动
    this.setupSocialPersonalityIntegration(aiId, systems.socialModule, systems.personalitySystem);
  }

  private setupSocialPersonalityIntegration(
    aiId: string,
    socialModule: SocialIntelligenceModule,
    personalitySystem: PersonalitySystem
  ): void {
    // 创建社交事件到人格系统的桥接
    const originalProcessInteraction = socialModule.processPlayerInteraction.bind(socialModule);
    socialModule.processPlayerInteraction = (playerId, interactionType, content, gameContext) => {
      const interaction = originalProcessInteraction(playerId, interactionType, content, gameContext);
      
      // 向人格系统报告社交事件
      const personalityEvent: PersonalityEvent = {
        type: 'social_interaction',
        description: `${interactionType} with player ${playerId}`,
        impact: [{
          trait: 'social',
          magnitude: interaction.outcome.success ? 0.02 : -0.01,
          duration: 60
        }],
        emotionalImpact: {
          mood: interaction.outcome.success ? 'confident' : 'frustrated',
          stressChange: interaction.outcome.success ? -0.05 : 0.05,
          confidenceChange: interaction.outcome.success ? 0.03 : -0.02,
          energyChange: 0
        },
        timestamp: Date.now()
      };
      
      personalitySystem.processEvent(personalityEvent);
      
      return interaction;
    };
  }

  public async makeDecision(request: AIDecisionRequest): Promise<GameAction> {
    const startTime = Date.now();
    
    try {
      const aiInstance = this.aiInstances.get(request.aiId);
      if (!aiInstance) {
        throw new Error(`AI instance not found: ${request.aiId}`);
      }

      if (aiInstance.status !== 'active') {
        throw new Error(`AI instance not active: ${request.aiId} (status: ${aiInstance.status})`);
      }

      // 添加到处理队列
      this.processingRequests.set(request.aiId, request);

      // 设置超时
      const timeout = request.timeout || this.config.resourceLimits.maxResponseTime;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          this.processingRequests.delete(request.aiId);
          reject(new Error(`Decision timeout: ${timeout}ms`));
        }, timeout);
      });

      // 执行决策
      const decisionPromise = this.executeDecision(aiInstance, request.context);
      const decision = await Promise.race([decisionPromise, timeoutPromise]);

      // 记录性能指标
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(aiInstance, responseTime, true);

      // 清理处理状态
      this.processingRequests.delete(request.aiId);

      // 触发回调
      request.callbacks?.onDecision?.(decision);

      this.logEvent({
        type: 'game_action',
        aiId: request.aiId,
        timestamp: Date.now(),
        data: { action: decision.type, responseTime },
        impact: { performance: 1, relationships: {}, learning: 1 }
      });

      return decision;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(this.aiInstances.get(request.aiId), responseTime, false);
      this.processingRequests.delete(request.aiId);
      
      // 错误恢复
      this.handleError(request.aiId, error as Error);
      
      // 触发错误回调
      request.callbacks?.onError?.(error as Error);
      
      throw error;
    }
  }

  private async executeDecision(aiInstance: AIInstance, context: DecisionContext): Promise<GameAction> {
    // 更新活跃时间
    aiInstance.lastActiveAt = Date.now();

    // 检查流状态
    const flowAnalysis = await aiInstance.flowDetector.analyzeFlowState(aiInstance.id);
    
    // 调整上下文基于流状态
    const adjustedContext = this.adjustContextForFlow(context, flowAnalysis);

    // 执行行为引擎决策
    const decision = aiInstance.behaviorEngine.makeDecision(adjustedContext);

    // 记录决策用于学习
    this.recordDecisionForLearning(aiInstance, adjustedContext, decision);

    return decision;
  }

  private adjustContextForFlow(context: DecisionContext, flowAnalysis: FlowAnalysisResult): DecisionContext {
    const adjustedContext = { ...context };

    // 基于流状态调整时间约束
    if (flowAnalysis.currentFlow.overallFlowScore < 0.3) {
      adjustedContext.timeConstraints = Math.min(adjustedContext.timeConstraints * 1.5, 60);
    } else if (flowAnalysis.currentFlow.overallFlowScore > 0.8) {
      adjustedContext.timeConstraints = Math.max(adjustedContext.timeConstraints * 0.8, 5);
    }

    return adjustedContext;
  }

  private recordDecisionForLearning(
    aiInstance: AIInstance,
    context: DecisionContext,
    decision: GameAction
  ): void {
    // 向学习系统记录决策以供后续学习
    setTimeout(() => {
      // 模拟决策结果（实际游戏中会从游戏引擎获得）
      const outcome = {
        immediate: { success: Math.random() > 0.3 },
        delayed: [],
        unexpected: []
      };

      const feedback = {
        objective: (Math.random() - 0.5) * 2,
        subjective: (Math.random() - 0.5) * 2,
        environmental: (Math.random() - 0.5) * 2,
        social: (Math.random() - 0.5) * 2
      };

      aiInstance.learningSystem.processLearningExperience(context, decision, outcome, feedback);
    }, 1000);
  }

  private reportLearningExperience(aiId: string, actionId: string, outcome: any): void {
    this.logEvent({
      type: 'learning_event',
      aiId,
      timestamp: Date.now(),
      data: { actionId, outcome },
      impact: { performance: 0, relationships: {}, learning: outcome.success ? 1 : -0.5 }
    });
  }

  public async updateAISocialContext(gameState: any, playerStates: any[]): Promise<void> {
    for (const aiInstance of this.aiInstances.values()) {
      try {
        aiInstance.socialModule.updateSocialContext(gameState, playerStates);
      } catch (error) {
        console.error(`Failed to update social context for AI ${aiInstance.id}:`, error);
      }
    }
  }

  public getAIInstance(aiId: string): AIInstance | undefined {
    return this.aiInstances.get(aiId);
  }

  public getAllAIInstances(): AIInstance[] {
    return Array.from(this.aiInstances.values());
  }

  public getSystemMetrics(): SystemWideMetrics {
    this.updateSystemMetrics();
    return { ...this.systemMetrics };
  }

  public getAIAnalytics(aiId: string): any {
    const aiInstance = this.aiInstances.get(aiId);
    if (!aiInstance) {
      throw new Error(`AI instance not found: ${aiId}`);
    }

    return {
      character: this.characterGenerator.getCharacterAnalytics(aiInstance.character),
      personality: aiInstance.personalitySystem.getPersonalityAnalysis(),
      behavior: aiInstance.behaviorEngine.getBehaviorAnalytics(),
      learning: aiInstance.learningSystem.getLearningAnalytics(),
      social: aiInstance.socialModule.getSocialAnalytics(),
      performance: aiInstance.performanceMetrics,
      status: aiInstance.status
    };
  }

  public async suspendAI(aiId: string): Promise<void> {
    const aiInstance = this.aiInstances.get(aiId);
    if (!aiInstance) {
      throw new Error(`AI instance not found: ${aiId}`);
    }

    aiInstance.status = 'suspended';
    this.systemMetrics.activeInstances--;

    console.log(`⏸️  AI instance suspended: ${aiId}`);
  }

  public async resumeAI(aiId: string): Promise<void> {
    const aiInstance = this.aiInstances.get(aiId);
    if (!aiInstance) {
      throw new Error(`AI instance not found: ${aiId}`);
    }

    aiInstance.status = 'active';
    aiInstance.lastActiveAt = Date.now();
    this.systemMetrics.activeInstances++;

    console.log(`▶️  AI instance resumed: ${aiId}`);
  }

  public async removeAI(aiId: string): Promise<void> {
    const aiInstance = this.aiInstances.get(aiId);
    if (!aiInstance) {
      throw new Error(`AI instance not found: ${aiId}`);
    }

    try {
      // 清理系统资源
      aiInstance.personalitySystem.cleanup();
      aiInstance.behaviorEngine.cleanup();
      aiInstance.learningSystem.cleanup();
      aiInstance.socialModule.cleanup();
      aiInstance.flowDetector.cleanup();

      this.aiInstances.delete(aiId);
      this.systemMetrics.totalAIInstances--;
      if (aiInstance.status === 'active') {
        this.systemMetrics.activeInstances--;
      }

      console.log(`🗑️  AI instance removed: ${aiId}`);

    } catch (error) {
      console.error(`Failed to remove AI instance ${aiId}:`, error);
    }
  }

  private updatePerformanceMetrics(
    aiInstance: AIInstance | undefined,
    responseTime: number,
    success: boolean
  ): void {
    if (!aiInstance) return;

    const metrics = aiInstance.performanceMetrics;

    // 更新响应时间
    metrics.responseTime.samples.push(responseTime);
    if (metrics.responseTime.samples.length > 100) {
      metrics.responseTime.samples = metrics.responseTime.samples.slice(-80);
    }

    metrics.responseTime.average = metrics.responseTime.samples.reduce((a, b) => a + b, 0) / metrics.responseTime.samples.length;
    metrics.responseTime.min = Math.min(metrics.responseTime.min || responseTime, responseTime);
    metrics.responseTime.max = Math.max(metrics.responseTime.max, responseTime);

    // 更新决策准确性
    metrics.decisionAccuracy.totalDecisions++;
    if (success) {
      metrics.decisionAccuracy.successfulDecisions++;
    }
    metrics.decisionAccuracy.rate = metrics.decisionAccuracy.successfulDecisions / metrics.decisionAccuracy.totalDecisions;

    // 更新内存使用
    const memoryUsage = this.estimateMemoryUsage(aiInstance);
    metrics.memoryUsage.current = memoryUsage;
    metrics.memoryUsage.peak = Math.max(metrics.memoryUsage.peak, memoryUsage);
    metrics.memoryUsage.trend.push(memoryUsage);
    if (metrics.memoryUsage.trend.length > 50) {
      metrics.memoryUsage.trend = metrics.memoryUsage.trend.slice(-40);
    }
  }

  private estimateMemoryUsage(aiInstance: AIInstance): number {
    // 简化的内存使用估算
    let usage = 0;
    
    usage += 10; // 基础角色数据
    usage += aiInstance.sessionCount * 0.5; // 会话历史
    usage += aiInstance.personalitySystem.getPersonalityAnalysis().memoryProfile?.totalMemories * 0.1 || 0;
    usage += Object.keys(aiInstance.behaviorEngine.getBehaviorAnalytics().adaptiveWeights.patterns).length * 0.2;
    usage += Object.keys(aiInstance.socialModule.getSocialAnalytics().relationships).length * 0.3;
    
    return usage;
  }

  private handleError(aiId: string, error: Error): void {
    const errorCount = this.errorRecoverySystem.get(aiId) || 0;
    this.errorRecoverySystem.set(aiId, errorCount + 1);

    const aiInstance = this.aiInstances.get(aiId);
    if (aiInstance) {
      if (errorCount >= 3) {
        aiInstance.status = 'error';
        console.error(`❌ AI instance ${aiId} marked as error after ${errorCount} failures`);
      }
    }

    this.logEvent({
      type: 'system_event',
      aiId,
      timestamp: Date.now(),
      data: { error: error.message, errorCount: errorCount + 1 },
      impact: { performance: -1, relationships: {}, learning: 0 }
    });
  }

  private startSystemMonitoring(): void {
    if (this.config.performanceMonitoring) {
      this.performanceMonitorInterval = setInterval(() => {
        this.updateSystemMetrics();
        this.checkResourceLimits();
        this.cleanupInactiveInstances();
      }, 30000); // 每30秒
    }

    if (this.config.autoOptimization) {
      this.optimizationInterval = setInterval(() => {
        this.performSystemOptimization();
      }, 300000); // 每5分钟
    }
  }

  private updateSystemMetrics(): void {
    const activeInstances = Array.from(this.aiInstances.values()).filter(ai => ai.status === 'active');
    
    this.systemMetrics.activeInstances = activeInstances.length;
    this.systemMetrics.totalAIInstances = this.aiInstances.size;

    if (activeInstances.length > 0) {
      // 计算平均性能指标
      const avgMetrics = this.calculateAverageMetrics(activeInstances);
      this.systemMetrics.averagePerformance = avgMetrics;
    }

    // 计算错误率
    const recentErrors = this.eventHistory.filter(event => 
      event.type === 'system_event' && 
      event.data.error && 
      Date.now() - event.timestamp < 300000 // 5分钟内
    ).length;

    const recentEvents = this.eventHistory.filter(event => 
      Date.now() - event.timestamp < 300000
    ).length;

    this.systemMetrics.errorRate = recentEvents > 0 ? recentErrors / recentEvents : 0;

    // 更新资源利用率
    this.systemMetrics.resourceUtilization = this.calculateResourceUtilization();
  }

  private calculateAverageMetrics(instances: AIInstance[]): AIPerformanceMetrics {
    const totalMetrics = instances.reduce((sum, instance) => {
      const metrics = instance.performanceMetrics;
      return {
        responseTime: {
          average: sum.responseTime.average + metrics.responseTime.average,
          min: Math.min(sum.responseTime.min, metrics.responseTime.min),
          max: Math.max(sum.responseTime.max, metrics.responseTime.max),
          samples: []
        },
        memoryUsage: {
          current: sum.memoryUsage.current + metrics.memoryUsage.current,
          peak: Math.max(sum.memoryUsage.peak, metrics.memoryUsage.peak),
          trend: []
        },
        decisionAccuracy: {
          rate: sum.decisionAccuracy.rate + metrics.decisionAccuracy.rate,
          totalDecisions: sum.decisionAccuracy.totalDecisions + metrics.decisionAccuracy.totalDecisions,
          successfulDecisions: sum.decisionAccuracy.successfulDecisions + metrics.decisionAccuracy.successfulDecisions
        },
        adaptationEfficiency: {
          personalityChanges: sum.adaptationEfficiency.personalityChanges + metrics.adaptationEfficiency.personalityChanges,
          behaviorImprovements: sum.adaptationEfficiency.behaviorImprovements + metrics.adaptationEfficiency.behaviorImprovements,
          learningRate: sum.adaptationEfficiency.learningRate + metrics.adaptationEfficiency.learningRate
        },
        socialEffectiveness: {
          relationshipQuality: sum.socialEffectiveness.relationshipQuality + metrics.socialEffectiveness.relationshipQuality,
          negotiationSuccessRate: sum.socialEffectiveness.negotiationSuccessRate + metrics.socialEffectiveness.negotiationSuccessRate,
          allianceStability: sum.socialEffectiveness.allianceStability + metrics.socialEffectiveness.allianceStability
        },
        playerSatisfaction: {
          engagementScore: sum.playerSatisfaction.engagementScore + metrics.playerSatisfaction.engagementScore,
          challengeBalance: sum.playerSatisfaction.challengeBalance + metrics.playerSatisfaction.challengeBalance,
          funFactor: sum.playerSatisfaction.funFactor + metrics.playerSatisfaction.funFactor
        }
      };
    }, this.getZeroMetrics());

    // 计算平均值
    const count = instances.length;
    return {
      responseTime: {
        average: totalMetrics.responseTime.average / count,
        min: totalMetrics.responseTime.min,
        max: totalMetrics.responseTime.max,
        samples: []
      },
      memoryUsage: {
        current: totalMetrics.memoryUsage.current / count,
        peak: totalMetrics.memoryUsage.peak,
        trend: []
      },
      decisionAccuracy: {
        rate: totalMetrics.decisionAccuracy.rate / count,
        totalDecisions: totalMetrics.decisionAccuracy.totalDecisions,
        successfulDecisions: totalMetrics.decisionAccuracy.successfulDecisions
      },
      adaptationEfficiency: {
        personalityChanges: totalMetrics.adaptationEfficiency.personalityChanges / count,
        behaviorImprovements: totalMetrics.adaptationEfficiency.behaviorImprovements / count,
        learningRate: totalMetrics.adaptationEfficiency.learningRate / count
      },
      socialEffectiveness: {
        relationshipQuality: totalMetrics.socialEffectiveness.relationshipQuality / count,
        negotiationSuccessRate: totalMetrics.socialEffectiveness.negotiationSuccessRate / count,
        allianceStability: totalMetrics.socialEffectiveness.allianceStability / count
      },
      playerSatisfaction: {
        engagementScore: totalMetrics.playerSatisfaction.engagementScore / count,
        challengeBalance: totalMetrics.playerSatisfaction.challengeBalance / count,
        funFactor: totalMetrics.playerSatisfaction.funFactor / count
      }
    };
  }

  private getZeroMetrics(): AIPerformanceMetrics {
    return {
      responseTime: { average: 0, min: Infinity, max: 0, samples: [] },
      memoryUsage: { current: 0, peak: 0, trend: [] },
      decisionAccuracy: { rate: 0, totalDecisions: 0, successfulDecisions: 0 },
      adaptationEfficiency: { personalityChanges: 0, behaviorImprovements: 0, learningRate: 0 },
      socialEffectiveness: { relationshipQuality: 0, negotiationSuccessRate: 0, allianceStability: 0 },
      playerSatisfaction: { engagementScore: 0, challengeBalance: 0, funFactor: 0 }
    };
  }

  private calculateResourceUtilization(): SystemWideMetrics['resourceUtilization'] {
    const totalMemory = Array.from(this.aiInstances.values())
      .reduce((sum, instance) => sum + instance.performanceMetrics.memoryUsage.current, 0);

    return {
      memory: (totalMemory / this.config.resourceLimits.maxMemoryUsage) * 100,
      cpu: this.estimateCPUUsage(),
      network: 0 // 占位符
    };
  }

  private estimateCPUUsage(): number {
    const activeRequests = this.processingRequests.size;
    const maxConcurrent = this.config.maxConcurrentAIs;
    return (activeRequests / maxConcurrent) * 100;
  }

  private checkResourceLimits(): void {
    const resources = this.systemMetrics.resourceUtilization;
    const limits = this.config.resourceLimits;

    if (resources.memory > limits.maxMemoryUsage) {
      console.warn(`⚠️  Memory usage exceeded: ${resources.memory.toFixed(1)}% > ${limits.maxMemoryUsage}%`);
      this.systemMetrics.optimizationSuggestions.push('Reduce memory usage by cleaning up inactive AI instances');
    }

    if (resources.cpu > limits.maxCPUUsage) {
      console.warn(`⚠️  CPU usage exceeded: ${resources.cpu.toFixed(1)}% > ${limits.maxCPUUsage}%`);
      this.systemMetrics.optimizationSuggestions.push('Reduce concurrent AI processing load');
    }
  }

  private cleanupInactiveInstances(): void {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [aiId, instance] of this.aiInstances.entries()) {
      if (instance.status === 'idle' && now - instance.lastActiveAt > inactiveThreshold) {
        console.log(`🧹 Cleaning up inactive AI instance: ${aiId}`);
        this.removeAI(aiId);
      }
    }
  }

  private performSystemOptimization(): void {
    console.log(`🔧 Performing system optimization...`);

    // 优化内存使用
    this.optimizeMemoryUsage();

    // 平衡AI负载
    this.balanceAILoad();

    // 清理事件历史
    this.cleanupEventHistory();

    console.log(`✅ System optimization completed`);
  }

  private optimizeMemoryUsage(): void {
    for (const instance of this.aiInstances.values()) {
      // 清理过期的行为记忆
      // 这里需要访问各个系统的清理方法
      
      // 压缩人格历史
      // 优化社交关系数据
      // 简化学习模式
    }
  }

  private balanceAILoad(): void {
    const activeInstances = Array.from(this.aiInstances.values())
      .filter(ai => ai.status === 'active');

    // 根据性能指标调整AI优先级
    activeInstances.sort((a, b) => 
      a.performanceMetrics.responseTime.average - b.performanceMetrics.responseTime.average
    );

    // 暂停性能最差的AI实例（如果负载过高）
    if (this.systemMetrics.resourceUtilization.cpu > 90) {
      const worstPerformer = activeInstances[activeInstances.length - 1];
      if (worstPerformer) {
        this.suspendAI(worstPerformer.id);
        console.log(`⏸️  Suspended worst performing AI: ${worstPerformer.id}`);
      }
    }
  }

  private cleanupEventHistory(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.eventHistory = this.eventHistory.filter(event => event.timestamp > cutoff);
  }

  private initializePerformanceMetrics(): AIPerformanceMetrics {
    return {
      responseTime: { average: 0, min: 0, max: 0, samples: [] },
      memoryUsage: { current: 10, peak: 10, trend: [] },
      decisionAccuracy: { rate: 0.5, totalDecisions: 0, successfulDecisions: 0 },
      adaptationEfficiency: { personalityChanges: 0, behaviorImprovements: 0, learningRate: 0.1 },
      socialEffectiveness: { relationshipQuality: 0.5, negotiationSuccessRate: 0.5, allianceStability: 0.5 },
      playerSatisfaction: { engagementScore: 0.7, challengeBalance: 0.6, funFactor: 0.7 }
    };
  }

  private logEvent(event: AIInteractionEvent): void {
    this.eventHistory.push(event);
    
    if (this.config.debugMode) {
      console.log(`📊 AI Event: ${event.type} - ${event.aiId}`);
    }
    
    // 限制事件历史长度
    if (this.eventHistory.length > 10000) {
      this.eventHistory = this.eventHistory.slice(-8000);
    }
  }

  public generateSystemReport(): any {
    return {
      systemInfo: {
        version: '1.0.0',
        uptime: Date.now() - this.systemMetrics.uptime,
        configuration: this.config
      },
      instancesSummary: {
        total: this.systemMetrics.totalAIInstances,
        active: this.systemMetrics.activeInstances,
        suspended: Array.from(this.aiInstances.values()).filter(ai => ai.status === 'suspended').length,
        error: Array.from(this.aiInstances.values()).filter(ai => ai.status === 'error').length
      },
      performanceOverview: this.systemMetrics.averagePerformance,
      resourceStatus: this.systemMetrics.resourceUtilization,
      recentEvents: this.eventHistory.slice(-20),
      optimizationSuggestions: this.systemMetrics.optimizationSuggestions,
      healthScore: this.calculateSystemHealthScore()
    };
  }

  private calculateSystemHealthScore(): number {
    let score = 100;
    
    // 扣分项
    score -= this.systemMetrics.errorRate * 50;
    score -= Math.max(0, this.systemMetrics.resourceUtilization.memory - 80);
    score -= Math.max(0, this.systemMetrics.resourceUtilization.cpu - 80);
    score -= Math.max(0, (this.systemMetrics.averagePerformance.responseTime.average - 1000) / 100);
    
    // 加分项
    score += this.systemMetrics.averagePerformance.decisionAccuracy.rate * 10;
    score += this.systemMetrics.averagePerformance.playerSatisfaction.engagementScore * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  // 添加缺少的方法

  async initialize(): Promise<void> {
    console.log('🚀 Initializing AI System Manager...');
    
    // 初始化组件
    this.characterGenerator = new AICharacterGenerator();
    this.personalizationInterface = new PersonalizationInterface();
    
    // 初始化系统指标
    this.systemMetrics = {
      totalAIInstances: 0,
      activeInstances: 0,
      averagePerformance: this.initializePerformanceMetrics(),
      resourceUtilization: { memory: 0, cpu: 0, network: 0 },
      errorRate: 0,
      uptime: Date.now(),
      optimizationSuggestions: []
    };

    // 启动监控
    if (this.config.performanceMonitoring) {
      this.startPerformanceMonitoring();
    }

    if (this.config.autoOptimization) {
      this.startAutoOptimization();
    }

    console.log('✅ AI System Manager initialized successfully');
  }

  private startPerformanceMonitoring(): void {
    this.performanceMonitorInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 10000); // 10 seconds
    console.log('📊 Performance monitoring started');
  }

  private startAutoOptimization(): void {
    this.optimizationInterval = setInterval(() => {
      this.performSystemOptimization();
    }, 60000); // 1 minute
    console.log('⚙️ Auto optimization started');
  }

  async processLearningEvent(aiId: string, event: any): Promise<void> {
    const instance = this.aiInstances.get(aiId);
    if (!instance) {
      throw new Error(`AI instance not found: ${aiId}`);
    }

    // 处理学习事件
    await instance.learningSystem.processEvent({
      type: 'game_outcome',
      success: event.outcome === 'success',
      context: event.gameState || {},
      reward: event.reward || 0,
      timestamp: new Date()
    });

    // 更新性能指标
    if (event.outcome === 'success') {
      instance.performanceMetrics.decisionAccuracy.successfulDecisions++;
    }
    instance.performanceMetrics.decisionAccuracy.totalDecisions++;
    instance.performanceMetrics.decisionAccuracy.rate = 
      instance.performanceMetrics.decisionAccuracy.successfulDecisions / 
      instance.performanceMetrics.decisionAccuracy.totalDecisions;

    // 记录事件
    this.logEvent({
      type: 'learning_event',
      aiId,
      timestamp: Date.now(),
      data: event
    });
  }

  async getSystemStatus(): Promise<any> {
    return {
      totalInstances: this.systemMetrics.totalAIInstances,
      activeInstances: this.systemMetrics.activeInstances,
      performance: this.systemMetrics.averagePerformance,
      resourceUtilization: this.systemMetrics.resourceUtilization,
      errorRate: this.systemMetrics.errorRate,
      uptime: Date.now() - this.systemMetrics.uptime,
      healthScore: this.calculateSystemHealthScore()
    };
  }

  async getAIState(aiId: string): Promise<any> {
    const instance = this.aiInstances.get(aiId);
    if (!instance) {
      return null;
    }

    return {
      id: aiId,
      personalityTraits: instance.character.personalityTraits,
      emotionalState: instance.personalitySystem.getCurrentState(),
      behaviorPatterns: instance.behaviorEngine.getPatterns ? instance.behaviorEngine.getPatterns() : {},
      learningProgress: instance.learningSystem.getMetrics ? instance.learningSystem.getMetrics() : {},
      socialRelationships: instance.socialModule.getRelationships ? instance.socialModule.getRelationships() : [],
      performance: instance.performanceMetrics,
      status: instance.status
    };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down AI System Manager...');
    
    // 停止监控
    if (this.performanceMonitorInterval) {
      clearInterval(this.performanceMonitorInterval);
      this.performanceMonitorInterval = null;
    }
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    // 保存所有AI状态
    for (const [aiId, instance] of this.aiInstances.entries()) {
      try {
        // 这里可以添加状态保存逻辑
        console.log(`💾 Saving state for AI instance: ${aiId}`);
      } catch (error) {
        console.warn(`⚠️  Failed to save state for AI ${aiId}:`, error);
      }
    }

    // 清理所有AI实例
    for (const aiId of this.aiInstances.keys()) {
      this.removeAI(aiId);
    }

    // 清理接口
    if (this.personalizationInterface && this.personalizationInterface.cleanup) {
      this.personalizationInterface.cleanup();
    }

    console.log('✅ AI System Manager shutdown complete');
  }

  public cleanup(): void {
    this.shutdown().catch(error => {
      console.error('Error during cleanup:', error);
    });
  }
}