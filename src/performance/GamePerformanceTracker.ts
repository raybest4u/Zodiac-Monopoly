import { EventEmitter } from '../utils/EventEmitter';
import { performanceMonitor, PerformanceMetrics } from './PerformanceMonitor';

export interface GamePerformanceData {
  sessionId: string;
  gameId: string;
  playerId: string;
  timestamp: number;
  gameState: {
    round: number;
    playersCount: number;
    activePlayer: string;
    gamePhase: 'setup' | 'playing' | 'trading' | 'auction' | 'endgame';
  };
  actionMetrics: {
    actionType: string;
    duration: number;
    complexity: number;
    success: boolean;
  };
  uiMetrics: {
    inputLatency: number;
    animationFrameRate: number;
    uiResponseTime: number;
  };
  aiMetrics: {
    decisionTime: number;
    algorithmUsed: string;
    complexityScore: number;
    cacheHitRate: number;
  };
}

export interface PerformanceBaseline {
  gameType: string;
  playerCount: number;
  avgMetrics: {
    frameRate: number;
    renderTime: number;
    aiDecisionTime: number;
    memoryUsage: number;
    actionLatency: number;
  };
  optimalThresholds: {
    maxRenderTime: number;
    maxAiDecisionTime: number;
    maxMemoryUsage: number;
    minFrameRate: number;
  };
}

export interface PerformanceComparison {
  currentSession: string;
  baselineSession: string;
  comparison: {
    frameRateChange: number;
    renderTimeChange: number;
    memoryUsageChange: number;
    aiPerformanceChange: number;
    overallScore: number;
  };
  recommendations: string[];
}

export class GamePerformanceTracker extends EventEmitter {
  private gameSessionData: Map<string, GamePerformanceData[]> = new Map();
  private activeGameSessions: Set<string> = new Set();
  private performanceBaselines: Map<string, PerformanceBaseline> = new Map();
  private actionStartTimes: Map<string, number> = new Map();
  private currentGameData: GamePerformanceData | null = null;

  constructor() {
    super();
    this.setupPerformanceMonitorListeners();
    this.initializeBaselines();
  }

  public startGameSession(gameId: string, playerId: string, gameConfig: any): void {
    const sessionId = `${gameId}_${Date.now()}`;
    
    this.activeGameSessions.add(sessionId);
    this.gameSessionData.set(sessionId, []);
    
    this.currentGameData = {
      sessionId,
      gameId,
      playerId,
      timestamp: Date.now(),
      gameState: {
        round: 0,
        playersCount: gameConfig.playersCount || 2,
        activePlayer: playerId,
        gamePhase: 'setup',
      },
      actionMetrics: {
        actionType: 'gameStart',
        duration: 0,
        complexity: 1,
        success: true,
      },
      uiMetrics: {
        inputLatency: 0,
        animationFrameRate: 60,
        uiResponseTime: 0,
      },
      aiMetrics: {
        decisionTime: 0,
        algorithmUsed: 'none',
        complexityScore: 0,
        cacheHitRate: 1,
      },
    };

    performanceMonitor.startMonitoring(sessionId);
    this.emit('gameSession:started', { sessionId, gameId, playerId });
  }

  public endGameSession(sessionId: string): void {
    if (!this.activeGameSessions.has(sessionId)) {
      return;
    }

    this.activeGameSessions.delete(sessionId);
    const profile = performanceMonitor.stopMonitoring();
    
    if (profile) {
      this.generateSessionReport(sessionId, profile);
    }

    this.emit('gameSession:ended', { sessionId });
  }

  public trackGameAction(actionType: string, complexity: number = 1): void {
    const actionId = `${actionType}_${Date.now()}`;
    this.actionStartTimes.set(actionId, performance.now());
    
    performanceMonitor.startTimer(`action_${actionId}`);
    this.emit('action:started', { actionId, actionType, complexity });
  }

  public completeGameAction(actionType: string, success: boolean = true): void {
    const actionId = Array.from(this.actionStartTimes.keys())
      .find(id => id.startsWith(actionType));
    
    if (!actionId) return;

    const duration = performanceMonitor.endTimer(`action_${actionId}`);
    const startTime = this.actionStartTimes.get(actionId);
    
    if (startTime && this.currentGameData) {
      this.currentGameData.actionMetrics = {
        actionType,
        duration,
        complexity: this.getActionComplexity(actionType),
        success,
      };

      this.recordGameData();
    }

    this.actionStartTimes.delete(actionId);
    this.emit('action:completed', { actionId, actionType, duration, success });
  }

  public trackAIDecision(algorithmUsed: string, complexityScore: number, cacheHitRate: number): void {
    const startTime = performance.now();
    performanceMonitor.startTimer('ai_decision');
    
    return new Promise<void>((resolve) => {
      // Simulate AI decision completion
      setTimeout(() => {
        const decisionTime = performanceMonitor.endTimer('ai_decision');
        
        if (this.currentGameData) {
          this.currentGameData.aiMetrics = {
            decisionTime,
            algorithmUsed,
            complexityScore,
            cacheHitRate,
          };
          this.recordGameData();
        }

        this.emit('ai:decisionCompleted', { 
          algorithmUsed, 
          decisionTime, 
          complexityScore, 
          cacheHitRate 
        });
        
        resolve();
      }, 0);
    }) as any;
  }

  public trackUIInteraction(interactionType: string): void {
    const startTime = performance.now();
    
    // Simulate UI response measurement
    requestAnimationFrame(() => {
      const uiResponseTime = performance.now() - startTime;
      
      if (this.currentGameData) {
        this.currentGameData.uiMetrics.uiResponseTime = uiResponseTime;
        this.currentGameData.uiMetrics.inputLatency = uiResponseTime;
        this.recordGameData();
      }

      this.emit('ui:interactionTracked', { interactionType, uiResponseTime });
    });
  }

  public updateGameState(gameState: Partial<GamePerformanceData['gameState']>): void {
    if (this.currentGameData) {
      this.currentGameData.gameState = {
        ...this.currentGameData.gameState,
        ...gameState,
      };
      this.recordGameData();
    }
  }

  public getSessionData(sessionId: string): GamePerformanceData[] {
    return this.gameSessionData.get(sessionId) || [];
  }

  public getAllSessionData(): Map<string, GamePerformanceData[]> {
    return new Map(this.gameSessionData);
  }

  public compareWithBaseline(sessionId: string, gameType: string): PerformanceComparison | null {
    const sessionData = this.gameSessionData.get(sessionId);
    const baseline = this.performanceBaselines.get(gameType);
    
    if (!sessionData || !baseline || sessionData.length === 0) {
      return null;
    }

    const avgSessionMetrics = this.calculateAverageMetrics(sessionData);
    
    const comparison: PerformanceComparison = {
      currentSession: sessionId,
      baselineSession: gameType,
      comparison: {
        frameRateChange: ((avgSessionMetrics.frameRate - baseline.avgMetrics.frameRate) / baseline.avgMetrics.frameRate) * 100,
        renderTimeChange: ((avgSessionMetrics.renderTime - baseline.avgMetrics.renderTime) / baseline.avgMetrics.renderTime) * 100,
        memoryUsageChange: ((avgSessionMetrics.memoryUsage - baseline.avgMetrics.memoryUsage) / baseline.avgMetrics.memoryUsage) * 100,
        aiPerformanceChange: ((baseline.avgMetrics.aiDecisionTime - avgSessionMetrics.aiDecisionTime) / baseline.avgMetrics.aiDecisionTime) * 100,
        overallScore: 0,
      },
      recommendations: [],
    };

    // Calculate overall performance score
    comparison.comparison.overallScore = (
      comparison.comparison.frameRateChange * 0.3 +
      (-comparison.comparison.renderTimeChange) * 0.3 +
      (-comparison.comparison.memoryUsageChange) * 0.2 +
      comparison.comparison.aiPerformanceChange * 0.2
    );

    // Generate recommendations
    comparison.recommendations = this.generatePerformanceRecommendations(comparison);

    return comparison;
  }

  public getPerformanceReport(sessionId: string): any {
    const sessionData = this.gameSessionData.get(sessionId);
    if (!sessionData || sessionData.length === 0) {
      return null;
    }

    const avgMetrics = this.calculateAverageMetrics(sessionData);
    const performanceIssues = this.identifyPerformanceIssues(sessionData);
    const optimizationOpportunities = this.identifyOptimizationOpportunities(sessionData);

    return {
      sessionId,
      duration: sessionData[sessionData.length - 1].timestamp - sessionData[0].timestamp,
      dataPoints: sessionData.length,
      averageMetrics: avgMetrics,
      performanceIssues,
      optimizationOpportunities,
      overallScore: this.calculateOverallScore(avgMetrics),
      recommendations: performanceMonitor.getOptimizationRecommendations(),
    };
  }

  private setupPerformanceMonitorListeners(): void {
    performanceMonitor.on('metrics:collected', (metrics: PerformanceMetrics) => {
      if (this.currentGameData) {
        // Update current game data with latest performance metrics
        this.currentGameData.timestamp = metrics.timestamp;
        this.recordGameData();
      }
    });

    performanceMonitor.on('alert:created', (alert) => {
      this.emit('performance:alert', alert);
    });

    performanceMonitor.on('frame:completed', ({ frameTime, frameRate }) => {
      if (this.currentGameData) {
        this.currentGameData.uiMetrics.animationFrameRate = frameRate;
      }
    });
  }

  private initializeBaselines(): void {
    // Initialize performance baselines for different game configurations
    this.performanceBaselines.set('standard_2player', {
      gameType: 'standard_2player',
      playerCount: 2,
      avgMetrics: {
        frameRate: 60,
        renderTime: 16,
        aiDecisionTime: 200,
        memoryUsage: 100 * 1024 * 1024, // 100MB
        actionLatency: 50,
      },
      optimalThresholds: {
        maxRenderTime: 33,
        maxAiDecisionTime: 500,
        maxMemoryUsage: 200 * 1024 * 1024,
        minFrameRate: 30,
      },
    });

    this.performanceBaselines.set('standard_4player', {
      gameType: 'standard_4player',
      playerCount: 4,
      avgMetrics: {
        frameRate: 55,
        renderTime: 18,
        aiDecisionTime: 300,
        memoryUsage: 150 * 1024 * 1024,
        actionLatency: 75,
      },
      optimalThresholds: {
        maxRenderTime: 40,
        maxAiDecisionTime: 800,
        maxMemoryUsage: 300 * 1024 * 1024,
        minFrameRate: 25,
      },
    });
  }

  private recordGameData(): void {
    if (!this.currentGameData) return;

    const sessionData = this.gameSessionData.get(this.currentGameData.sessionId);
    if (sessionData) {
      sessionData.push({ ...this.currentGameData });
    }

    this.emit('gameData:recorded', this.currentGameData);
  }

  private getActionComplexity(actionType: string): number {
    const complexityMap: Record<string, number> = {
      'move': 1,
      'buyProperty': 2,
      'buildHouse': 3,
      'trade': 4,
      'auction': 3,
      'payRent': 1,
      'drawCard': 1,
      'aiDecision': 3,
      'gameSetup': 2,
    };
    
    return complexityMap[actionType] || 1;
  }

  private calculateAverageMetrics(sessionData: GamePerformanceData[]): any {
    if (sessionData.length === 0) return {};

    const totals = sessionData.reduce((acc, data) => ({
      frameRate: acc.frameRate + data.uiMetrics.animationFrameRate,
      renderTime: acc.renderTime + data.actionMetrics.duration,
      aiDecisionTime: acc.aiDecisionTime + data.aiMetrics.decisionTime,
      memoryUsage: acc.memoryUsage + (data.actionMetrics.duration * 1000), // Simplified
      actionLatency: acc.actionLatency + data.uiMetrics.uiResponseTime,
    }), {
      frameRate: 0,
      renderTime: 0,
      aiDecisionTime: 0,
      memoryUsage: 0,
      actionLatency: 0,
    });

    const count = sessionData.length;
    return {
      frameRate: totals.frameRate / count,
      renderTime: totals.renderTime / count,
      aiDecisionTime: totals.aiDecisionTime / count,
      memoryUsage: totals.memoryUsage / count,
      actionLatency: totals.actionLatency / count,
    };
  }

  private identifyPerformanceIssues(sessionData: GamePerformanceData[]): string[] {
    const issues: string[] = [];
    const avgMetrics = this.calculateAverageMetrics(sessionData);

    if (avgMetrics.frameRate < 30) {
      issues.push('Low frame rate detected');
    }
    if (avgMetrics.renderTime > 50) {
      issues.push('High render times affecting performance');
    }
    if (avgMetrics.aiDecisionTime > 1000) {
      issues.push('AI decision times are too slow');
    }
    if (avgMetrics.actionLatency > 100) {
      issues.push('High input latency affecting user experience');
    }

    return issues;
  }

  private identifyOptimizationOpportunities(sessionData: GamePerformanceData[]): string[] {
    const opportunities: string[] = [];
    
    // Analyze AI cache hit rates
    const avgCacheHitRate = sessionData.reduce((sum, data) => sum + data.aiMetrics.cacheHitRate, 0) / sessionData.length;
    if (avgCacheHitRate < 0.8) {
      opportunities.push('Improve AI decision caching strategies');
    }

    // Analyze action complexity patterns
    const complexActions = sessionData.filter(data => data.actionMetrics.complexity > 3);
    if (complexActions.length > sessionData.length * 0.3) {
      opportunities.push('Optimize complex action processing');
    }

    // Analyze UI performance patterns
    const slowUIResponses = sessionData.filter(data => data.uiMetrics.uiResponseTime > 50);
    if (slowUIResponses.length > sessionData.length * 0.2) {
      opportunities.push('Optimize UI rendering and event handling');
    }

    return opportunities;
  }

  private calculateOverallScore(avgMetrics: any): number {
    // Calculate a performance score from 0-100
    let score = 100;

    // Frame rate impact (30% weight)
    if (avgMetrics.frameRate < 60) {
      score -= (60 - avgMetrics.frameRate) * 0.5;
    }

    // Render time impact (25% weight)
    if (avgMetrics.renderTime > 16) {
      score -= (avgMetrics.renderTime - 16) * 0.3;
    }

    // AI decision time impact (25% weight)
    if (avgMetrics.aiDecisionTime > 200) {
      score -= (avgMetrics.aiDecisionTime - 200) * 0.02;
    }

    // Action latency impact (20% weight)
    if (avgMetrics.actionLatency > 50) {
      score -= (avgMetrics.actionLatency - 50) * 0.2;
    }

    return Math.max(0, Math.min(100, score));
  }

  private generatePerformanceRecommendations(comparison: PerformanceComparison): string[] {
    const recommendations: string[] = [];

    if (comparison.comparison.frameRateChange < -10) {
      recommendations.push('Frame rate has decreased significantly - consider optimizing rendering');
    }
    if (comparison.comparison.renderTimeChange > 20) {
      recommendations.push('Render times have increased - review recent UI changes');
    }
    if (comparison.comparison.memoryUsageChange > 15) {
      recommendations.push('Memory usage has increased - check for memory leaks');
    }
    if (comparison.comparison.aiPerformanceChange < -20) {
      recommendations.push('AI performance has degraded - optimize decision algorithms');
    }

    if (comparison.comparison.overallScore < -10) {
      recommendations.push('Overall performance has declined - consider performance audit');
    } else if (comparison.comparison.overallScore > 10) {
      recommendations.push('Performance improvements detected - great work!');
    }

    return recommendations;
  }

  private generateSessionReport(sessionId: string, profile: any): void {
    const report = this.getPerformanceReport(sessionId);
    if (report) {
      this.emit('sessionReport:generated', { sessionId, report, profile });
    }
  }
}

export const gamePerformanceTracker = new GamePerformanceTracker();