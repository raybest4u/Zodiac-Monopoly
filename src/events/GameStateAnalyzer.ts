import { EventEmitter } from '../utils/EventEmitter';
import { Player, GameState } from '../types/game';
import { GameEventType, EventPriority, EventRarity } from './EventTypeDefinitions';

export interface GameStateSnapshot {
  timestamp: number;
  gamePhase: GamePhase;
  turn: number;
  economicMetrics: EconomicMetrics;
  playerMetrics: PlayerMetrics[];
  relationshipMatrix: RelationshipMatrix;
  powerBalance: PowerBalance;
  gameFlow: GameFlowMetrics;
  seasonalContext: SeasonalContext;
  culturalMoments: CulturalMoment[];
}

export interface EconomicMetrics {
  totalWealth: number;
  wealthDistribution: WealthDistribution;
  propertyOwnership: PropertyOwnership;
  tradeActivity: TradeActivity;
  economicGrowth: number;
  inflationRate: number;
  marketStability: number;
}

export interface WealthDistribution {
  giniCoefficient: number;
  wealthGaps: number[];
  richestPlayer: string;
  poorestPlayer: string;
  middleClass: string[];
}

export interface PropertyOwnership {
  totalProperties: number;
  ownedProperties: number;
  monopolies: PropertyMonopoly[];
  developmentLevel: number;
  strategicLocations: string[];
}

export interface PropertyMonopoly {
  ownerId: string;
  propertyGroup: string;
  properties: string[];
  developmentLevel: number;
  rentPower: number;
}

export interface TradeActivity {
  totalTrades: number;
  recentTrades: number;
  tradeFrequency: number;
  averageTradeValue: number;
  tradeNetworks: TradeNetwork[];
}

export interface TradeNetwork {
  participants: string[];
  tradeVolume: number;
  trustLevel: number;
  tradingPairs: TradingPair[];
}

export interface TradingPair {
  player1: string;
  player2: string;
  tradeCount: number;
  successRate: number;
  averageValue: number;
}

export interface PlayerMetrics {
  playerId: string;
  economicRank: number;
  propertyCount: number;
  liquidCash: number;
  netWorth: number;
  strategicPosition: number;
  influenceLevel: number;
  riskLevel: RiskLevel;
  momentum: PlayerMomentum;
  zodiacAlignment: ZodiacAlignment;
}

export interface PlayerMomentum {
  direction: 'ascending' | 'descending' | 'stable';
  velocity: number;
  recentActions: string[];
  successRate: number;
  adaptabilityScore: number;
}

export interface ZodiacAlignment {
  seasonalBonus: number;
  elementalStrength: number;
  culturalResonance: number;
  compatibilityWithOthers: Record<string, number>;
  mysticalPower: number;
}

export interface RelationshipMatrix {
  alliances: Alliance[];
  rivalries: Rivalry[];
  neutralRelations: string[][];
  trustLevels: Record<string, Record<string, number>>;
  cooperationIndex: number;
  conflictLevel: number;
}

export interface Alliance {
  members: string[];
  strength: number;
  purpose: 'economic' | 'strategic' | 'defensive' | 'cultural';
  stability: number;
  benefits: string[];
}

export interface Rivalry {
  participants: string[];
  intensity: number;
  cause: string;
  duration: number;
  escalationRisk: number;
}

export interface PowerBalance {
  dominantPlayers: string[];
  emergingThreats: string[];
  underperformers: string[];
  powerShifts: PowerShift[];
  balanceIndex: number;
  competitiveHealth: number;
}

export interface PowerShift {
  player: string;
  direction: 'gaining' | 'losing';
  magnitude: number;
  timeframe: number;
  causes: string[];
}

export interface GameFlowMetrics {
  paceOfPlay: number;
  decisionComplexity: number;
  playerEngagement: number;
  dramaLevel: number;
  suspenseIndex: number;
  entertainmentValue: number;
}

export interface SeasonalContext {
  currentSeason: string;
  seasonProgress: number;
  seasonalEffects: SeasonalEffect[];
  upcomingTransitions: SeasonTransition[];
  culturalEvents: string[];
  naturalCycles: NaturalCycle[];
}

export interface SeasonalEffect {
  type: 'economic' | 'social' | 'mystical' | 'environmental';
  magnitude: number;
  affectedPlayers: string[];
  duration: number;
}

export interface SeasonTransition {
  fromSeason: string;
  toSeason: string;
  transitionProbability: number;
  expectedEffects: string[];
}

export interface NaturalCycle {
  cycleName: string;
  phase: string;
  influence: number;
  zodiacResonance: Record<string, number>;
}

export interface CulturalMoment {
  type: 'festival' | 'tradition' | 'ceremony' | 'celebration';
  name: string;
  significance: number;
  participants: string[];
  culturalImpact: number;
  timing: 'immediate' | 'upcoming' | 'seasonal';
}

export interface StateAnalysisResult {
  snapshot: GameStateSnapshot;
  trends: StateTrend[];
  predictions: StatePrediction[];
  opportunities: GameOpportunity[];
  risks: GameRisk[];
  recommendations: ActionRecommendation[];
}

export interface StateTrend {
  category: 'economic' | 'social' | 'strategic' | 'cultural';
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  magnitude: number;
  duration: number;
  significance: number;
}

export interface StatePrediction {
  eventType: string;
  probability: number;
  timeframe: number;
  potentialImpact: number;
  affectedPlayers: string[];
  triggers: string[];
}

export interface GameOpportunity {
  type: 'economic' | 'strategic' | 'social' | 'cultural';
  description: string;
  beneficiaries: string[];
  requirements: string[];
  timeWindow: number;
  potentialValue: number;
}

export interface GameRisk {
  type: 'stagnation' | 'imbalance' | 'conflict' | 'boredom';
  severity: number;
  probability: number;
  affectedAspects: string[];
  mitigationOptions: string[];
}

export interface ActionRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  expectedOutcome: string;
  implementationDifficulty: number;
}

export type GamePhase = 
  | 'early_game' 
  | 'expansion' 
  | 'mid_game' 
  | 'late_game' 
  | 'endgame';

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

export class GameStateAnalyzer extends EventEmitter {
  private historicalSnapshots: GameStateSnapshot[] = [];
  private analysisCache = new Map<string, StateAnalysisResult>();
  private trendCalculators = new Map<string, TrendCalculator>();
  private predictionModels = new Map<string, PredictionModel>();
  
  constructor() {
    super();
    this.initializeTrendCalculators();
    this.initializePredictionModels();
  }
  
  public analyzeGameState(gameState: GameState, players: Player[]): StateAnalysisResult {
    const snapshot = this.createSnapshot(gameState, players);
    this.historicalSnapshots.push(snapshot);
    
    // Limit historical data to last 100 snapshots
    if (this.historicalSnapshots.length > 100) {
      this.historicalSnapshots.shift();
    }
    
    const cacheKey = this.generateCacheKey(snapshot);
    
    if (this.analysisCache.has(cacheKey)) {
      const cached = this.analysisCache.get(cacheKey)!;
      this.emit('analysis_cached', cached);
      return cached;
    }
    
    const analysis: StateAnalysisResult = {
      snapshot,
      trends: this.analyzeTrends(),
      predictions: this.generatePredictions(snapshot),
      opportunities: this.identifyOpportunities(snapshot),
      risks: this.assessRisks(snapshot),
      recommendations: this.generateRecommendations(snapshot)
    };
    
    this.analysisCache.set(cacheKey, analysis);
    this.emit('analysis_completed', analysis);
    
    return analysis;
  }
  
  public getEconomicHealth(snapshot: GameStateSnapshot): number {
    const metrics = snapshot.economicMetrics;
    const distribution = metrics.wealthDistribution;
    
    let healthScore = 0.5; // Base score
    
    // Factor in wealth distribution (lower Gini is better)
    healthScore += (1 - distribution.giniCoefficient) * 0.2;
    
    // Market stability
    healthScore += metrics.marketStability * 0.2;
    
    // Economic growth
    healthScore += Math.max(0, metrics.economicGrowth) * 0.1;
    
    // Trade activity
    const tradeHealth = Math.min(1, metrics.tradeActivity.tradeFrequency / 10);
    healthScore += tradeHealth * 0.1;
    
    return Math.max(0, Math.min(1, healthScore));
  }
  
  public getSocialDynamicsHealth(snapshot: GameStateSnapshot): number {
    const relationships = snapshot.relationshipMatrix;
    
    let socialHealth = 0.5;
    
    // Cooperation vs conflict balance
    const cooperationRatio = relationships.cooperationIndex / 
      (relationships.cooperationIndex + relationships.conflictLevel + 0.1);
    socialHealth += cooperationRatio * 0.3;
    
    // Alliance stability
    const allianceStrength = relationships.alliances.reduce((sum, alliance) => 
      sum + alliance.strength, 0) / Math.max(1, relationships.alliances.length);
    socialHealth += (allianceStrength / 10) * 0.2;
    
    // Rivalry management
    const rivalryImpact = relationships.rivalries.reduce((sum, rivalry) => 
      sum + rivalry.intensity, 0) / Math.max(1, relationships.rivalries.length);
    socialHealth -= (rivalryImpact / 10) * 0.1;
    
    return Math.max(0, Math.min(1, socialHealth));
  }
  
  public getCompetitiveBalance(snapshot: GameStateSnapshot): number {
    const power = snapshot.powerBalance;
    
    // Perfect balance would be close to 1
    return power.balanceIndex * power.competitiveHealth;
  }
  
  public getGameEngagement(snapshot: GameStateSnapshot): number {
    const flow = snapshot.gameFlow;
    
    const engagement = (
      flow.playerEngagement * 0.4 +
      flow.dramaLevel * 0.2 +
      flow.suspenseIndex * 0.2 +
      flow.entertainmentValue * 0.2
    );
    
    return Math.max(0, Math.min(1, engagement));
  }
  
  public identifyStagnationRisk(snapshot: GameStateSnapshot): number {
    const flow = snapshot.gameFlow;
    const economic = snapshot.economicMetrics;
    
    let stagnationRisk = 0;
    
    // Low pace of play
    if (flow.paceOfPlay < 0.3) stagnationRisk += 0.3;
    
    // Low trade activity
    if (economic.tradeActivity.tradeFrequency < 2) stagnationRisk += 0.2;
    
    // Low player engagement
    if (flow.playerEngagement < 0.4) stagnationRisk += 0.3;
    
    // Economic stagnation
    if (economic.economicGrowth <= 0) stagnationRisk += 0.2;
    
    return Math.max(0, Math.min(1, stagnationRisk));
  }
  
  public identifyDominanceRisk(snapshot: GameStateSnapshot): number {
    const power = snapshot.powerBalance;
    const economic = snapshot.economicMetrics;
    
    let dominanceRisk = 0;
    
    // Check for extreme wealth concentration
    if (economic.wealthDistribution.giniCoefficient > 0.8) {
      dominanceRisk += 0.4;
    }
    
    // Check for monopoly concentration
    const monopolyCount = economic.propertyOwnership.monopolies.length;
    if (monopolyCount > 0) {
      const monopolyRisk = Math.min(0.3, monopolyCount * 0.1);
      dominanceRisk += monopolyRisk;
    }
    
    // Check power imbalance
    dominanceRisk += (1 - power.balanceIndex) * 0.3;
    
    return Math.max(0, Math.min(1, dominanceRisk));
  }
  
  public predictNextEvents(snapshot: GameStateSnapshot, count: number = 5): StatePrediction[] {
    const predictions: StatePrediction[] = [];
    
    // Economic event predictions
    if (snapshot.economicMetrics.economicGrowth < -0.1) {
      predictions.push({
        eventType: GameEventType.ECONOMIC_CRISIS,
        probability: 0.7,
        timeframe: 3,
        potentialImpact: 0.8,
        affectedPlayers: snapshot.playerMetrics.map(p => p.playerId),
        triggers: ['economic_decline', 'market_instability']
      });
    }
    
    // Trade opportunity predictions
    if (snapshot.economicMetrics.tradeActivity.tradeFrequency > 5) {
      predictions.push({
        eventType: GameEventType.TRADE_BOOM,
        probability: 0.6,
        timeframe: 2,
        potentialImpact: 0.6,
        affectedPlayers: this.getActiveTraders(snapshot),
        triggers: ['high_trade_activity', 'market_confidence']
      });
    }
    
    // Seasonal event predictions
    const seasonalPrediction = this.predictSeasonalEvent(snapshot);
    if (seasonalPrediction) {
      predictions.push(seasonalPrediction);
    }
    
    // Social event predictions
    const socialPredictions = this.predictSocialEvents(snapshot);
    predictions.push(...socialPredictions);
    
    // Power shift predictions
    const powerPredictions = this.predictPowerShifts(snapshot);
    predictions.push(...powerPredictions);
    
    return predictions
      .sort((a, b) => (b.probability * b.potentialImpact) - (a.probability * a.potentialImpact))
      .slice(0, count);
  }
  
  private createSnapshot(gameState: GameState, players: Player[]): GameStateSnapshot {
    return {
      timestamp: Date.now(),
      gamePhase: this.determineGamePhase(gameState, players),
      turn: gameState.turn || 0,
      economicMetrics: this.analyzeEconomics(gameState, players),
      playerMetrics: this.analyzePlayerMetrics(players, gameState),
      relationshipMatrix: this.analyzeRelationships(players, gameState),
      powerBalance: this.analyzePowerBalance(players, gameState),
      gameFlow: this.analyzeGameFlow(gameState, players),
      seasonalContext: this.analyzeSeasonalContext(gameState),
      culturalMoments: this.identifyCulturalMoments(gameState, players)
    };
  }
  
  private determineGamePhase(gameState: GameState, players: Player[]): GamePhase {
    const turn = gameState.turn || 0;
    const avgProperties = players.reduce((sum, p) => sum + (p.properties?.length || 0), 0) / players.length;
    const totalProperties = gameState.board?.properties?.length || 40;
    const ownershipRatio = avgProperties / totalProperties;
    
    if (turn <= 10 && ownershipRatio < 0.2) return 'early_game';
    if (turn <= 25 && ownershipRatio < 0.4) return 'expansion';
    if (turn <= 50 && ownershipRatio < 0.7) return 'mid_game';
    if (ownershipRatio < 0.9) return 'late_game';
    return 'endgame';
  }
  
  private analyzeEconomics(gameState: GameState, players: Player[]): EconomicMetrics {
    const totalWealth = players.reduce((sum, p) => sum + p.money, 0);
    const sortedWealth = players.map(p => p.money).sort((a, b) => b - a);
    
    return {
      totalWealth,
      wealthDistribution: this.calculateWealthDistribution(players),
      propertyOwnership: this.analyzePropertyOwnership(players, gameState),
      tradeActivity: this.analyzeTradeActivity(gameState),
      economicGrowth: this.calculateEconomicGrowth(),
      inflationRate: this.calculateInflationRate(),
      marketStability: this.assessMarketStability(players)
    };
  }
  
  private calculateWealthDistribution(players: Player[]): WealthDistribution {
    const sortedPlayers = [...players].sort((a, b) => b.money - a.money);
    const totalWealth = players.reduce((sum, p) => sum + p.money, 0);
    
    // Calculate Gini coefficient
    let giniSum = 0;
    for (let i = 0; i < players.length; i++) {
      for (let j = 0; j < players.length; j++) {
        giniSum += Math.abs(players[i].money - players[j].money);
      }
    }
    const giniCoefficient = giniSum / (2 * players.length * players.length * (totalWealth / players.length));
    
    const wealthGaps = sortedPlayers.slice(0, -1).map((p, i) => 
      p.money - sortedPlayers[i + 1].money
    );
    
    return {
      giniCoefficient: Math.min(1, giniCoefficient),
      wealthGaps,
      richestPlayer: sortedPlayers[0].id,
      poorestPlayer: sortedPlayers[sortedPlayers.length - 1].id,
      middleClass: sortedPlayers.slice(1, -1).map(p => p.id)
    };
  }
  
  private analyzePropertyOwnership(players: Player[], gameState: GameState): PropertyOwnership {
    const totalProperties = gameState.board?.properties?.length || 40;
    const ownedProperties = players.reduce((sum, p) => sum + (p.properties?.length || 0), 0);
    
    const monopolies = this.identifyMonopolies(players, gameState);
    const developmentLevel = this.calculateDevelopmentLevel(players);
    
    return {
      totalProperties,
      ownedProperties,
      monopolies,
      developmentLevel,
      strategicLocations: this.identifyStrategicLocations(gameState)
    };
  }
  
  private identifyMonopolies(players: Player[], gameState: GameState): PropertyMonopoly[] {
    const monopolies: PropertyMonopoly[] = [];
    
    // This would analyze property groups and identify complete sets
    // Implementation would depend on specific property data structure
    
    return monopolies;
  }
  
  private calculateDevelopmentLevel(players: Player[]): number {
    // Calculate overall property development level
    let totalDevelopment = 0;
    let totalProperties = 0;
    
    players.forEach(player => {
      if (player.properties) {
        totalProperties += player.properties.length;
        // This would sum up house/hotel counts
        // totalDevelopment += player.properties.reduce((sum, prop) => sum + prop.developmentLevel, 0);
      }
    });
    
    return totalProperties > 0 ? totalDevelopment / totalProperties : 0;
  }
  
  private identifyStrategicLocations(gameState: GameState): string[] {
    // Identify high-value or strategic properties
    return ['Boardwalk', 'Park Place', 'Go', 'Jail']; // Example
  }
  
  private analyzeTradeActivity(gameState: GameState): TradeActivity {
    // This would analyze recent trades from game history
    return {
      totalTrades: 0,
      recentTrades: 0,
      tradeFrequency: 0,
      averageTradeValue: 0,
      tradeNetworks: []
    };
  }
  
  private calculateEconomicGrowth(): number {
    if (this.historicalSnapshots.length < 2) return 0;
    
    const current = this.historicalSnapshots[this.historicalSnapshots.length - 1];
    const previous = this.historicalSnapshots[this.historicalSnapshots.length - 2];
    
    const growthRate = (current.economicMetrics.totalWealth - previous.economicMetrics.totalWealth) 
                     / previous.economicMetrics.totalWealth;
    
    return Math.max(-1, Math.min(1, growthRate));
  }
  
  private calculateInflationRate(): number {
    // Calculate price inflation in the game economy
    return 0.02; // 2% base inflation
  }
  
  private assessMarketStability(players: Player[]): number {
    // Assess market stability based on various factors
    const wealthVariance = this.calculateWealthVariance(players);
    const stability = Math.max(0, 1 - (wealthVariance / 10000));
    return Math.min(1, stability);
  }
  
  private calculateWealthVariance(players: Player[]): number {
    const avgWealth = players.reduce((sum, p) => sum + p.money, 0) / players.length;
    const variance = players.reduce((sum, p) => sum + Math.pow(p.money - avgWealth, 2), 0) / players.length;
    return variance;
  }
  
  private analyzePlayerMetrics(players: Player[], gameState: GameState): PlayerMetrics[] {
    return players.map((player, index) => ({
      playerId: player.id,
      economicRank: index + 1, // This would be calculated based on actual ranking
      propertyCount: player.properties?.length || 0,
      liquidCash: player.money,
      netWorth: this.calculateNetWorth(player),
      strategicPosition: this.calculateStrategicPosition(player, gameState),
      influenceLevel: this.calculateInfluenceLevel(player, players),
      riskLevel: this.assessPlayerRiskLevel(player),
      momentum: this.analyzePlayerMomentum(player),
      zodiacAlignment: this.analyzeZodiacAlignment(player, gameState)
    }));
  }
  
  private calculateNetWorth(player: Player): number {
    let netWorth = player.money;
    
    if (player.properties) {
      // Add property values
      netWorth += player.properties.reduce((sum, prop) => sum + (prop.value || 0), 0);
    }
    
    return netWorth;
  }
  
  private calculateStrategicPosition(player: Player, gameState: GameState): number {
    // Calculate player's strategic position based on properties and position
    let position = 0.5; // Base position
    
    // Factor in property ownership
    if (player.properties && player.properties.length > 0) {
      position += Math.min(0.3, player.properties.length * 0.05);
    }
    
    // Factor in current board position
    const currentPosition = player.position || 0;
    const strategicSpaces = [0, 10, 20, 30]; // Go, Jail, Free Parking, etc.
    if (strategicSpaces.includes(currentPosition)) {
      position += 0.1;
    }
    
    return Math.max(0, Math.min(1, position));
  }
  
  private calculateInfluenceLevel(player: Player, allPlayers: Player[]): number {
    // Calculate player's influence based on wealth rank and social connections
    const wealthRank = allPlayers
      .sort((a, b) => b.money - a.money)
      .findIndex(p => p.id === player.id);
    
    const wealthInfluence = 1 - (wealthRank / allPlayers.length);
    return Math.max(0, Math.min(1, wealthInfluence));
  }
  
  private assessPlayerRiskLevel(player: Player): RiskLevel {
    const cashRatio = player.money / 1000; // Relative to some baseline
    
    if (cashRatio < 0.2) return 'extreme';
    if (cashRatio < 0.5) return 'high';
    if (cashRatio < 0.8) return 'medium';
    return 'low';
  }
  
  private analyzePlayerMomentum(player: Player): PlayerMomentum {
    // Analyze player's recent performance trajectory
    return {
      direction: 'stable',
      velocity: 0,
      recentActions: [],
      successRate: 0.5,
      adaptabilityScore: 0.5
    };
  }
  
  private analyzeZodiacAlignment(player: Player, gameState: GameState): ZodiacAlignment {
    const season = gameState.season || 'spring';
    const zodiac = player.zodiac;
    
    return {
      seasonalBonus: this.calculateSeasonalBonus(zodiac, season),
      elementalStrength: this.calculateElementalStrength(zodiac),
      culturalResonance: 0.7,
      compatibilityWithOthers: {},
      mysticalPower: 0.5
    };
  }
  
  private calculateSeasonalBonus(zodiac: string, season: string): number {
    const seasonalCompatibility: Record<string, Record<string, number>> = {
      'spring': { '虎': 0.8, '兔': 0.9, '龙': 0.7 },
      'summer': { '蛇': 0.9, '马': 0.8, '羊': 0.7 },
      'autumn': { '猴': 0.8, '鸡': 0.9, '狗': 0.7 },
      'winter': { '猪': 0.7, '鼠': 0.8, '牛': 0.6 }
    };
    
    return seasonalCompatibility[season]?.[zodiac] || 0.5;
  }
  
  private calculateElementalStrength(zodiac: string): number {
    // Calculate elemental strength based on five elements theory
    const elementalPower: Record<string, number> = {
      '鼠': 0.8, '牛': 0.7, '虎': 0.9, '兔': 0.6,
      '龙': 1.0, '蛇': 0.8, '马': 0.7, '羊': 0.6,
      '猴': 0.8, '鸡': 0.7, '狗': 0.6, '猪': 0.5
    };
    
    return elementalPower[zodiac] || 0.5;
  }
  
  private analyzeRelationships(players: Player[], gameState: GameState): RelationshipMatrix {
    // Analyze player relationships and social dynamics
    return {
      alliances: [],
      rivalries: [],
      neutralRelations: [],
      trustLevels: {},
      cooperationIndex: 0.5,
      conflictLevel: 0.2
    };
  }
  
  private analyzePowerBalance(players: Player[], gameState: GameState): PowerBalance {
    const sortedPlayers = [...players].sort((a, b) => b.money - a.money);
    
    return {
      dominantPlayers: sortedPlayers.slice(0, 2).map(p => p.id),
      emergingThreats: sortedPlayers.slice(2, 4).map(p => p.id),
      underperformers: sortedPlayers.slice(-2).map(p => p.id),
      powerShifts: [],
      balanceIndex: this.calculateBalanceIndex(players),
      competitiveHealth: this.calculateCompetitiveHealth(players)
    };
  }
  
  private calculateBalanceIndex(players: Player[]): number {
    if (players.length === 0) return 1;
    
    const totalWealth = players.reduce((sum, p) => sum + p.money, 0);
    const avgWealth = totalWealth / players.length;
    
    const deviations = players.map(p => Math.abs(p.money - avgWealth));
    const maxDeviation = Math.max(...deviations);
    
    // Perfect balance = 1, complete imbalance = 0
    return maxDeviation > 0 ? Math.max(0, 1 - (maxDeviation / avgWealth)) : 1;
  }
  
  private calculateCompetitiveHealth(players: Player[]): number {
    // Assess how competitive the game remains
    const wealthSpread = this.calculateWealthSpread(players);
    const competitiveHealth = Math.max(0.2, 1 - (wealthSpread / 2));
    return Math.min(1, competitiveHealth);
  }
  
  private calculateWealthSpread(players: Player[]): number {
    if (players.length === 0) return 0;
    
    const wealths = players.map(p => p.money).sort((a, b) => b - a);
    const richest = wealths[0];
    const poorest = wealths[wealths.length - 1];
    
    return richest > 0 ? (richest - poorest) / richest : 0;
  }
  
  private analyzeGameFlow(gameState: GameState, players: Player[]): GameFlowMetrics {
    return {
      paceOfPlay: 0.7,
      decisionComplexity: 0.6,
      playerEngagement: 0.8,
      dramaLevel: 0.5,
      suspenseIndex: 0.6,
      entertainmentValue: 0.7
    };
  }
  
  private analyzeSeasonalContext(gameState: GameState): SeasonalContext {
    const currentSeason = gameState.season || 'spring';
    
    return {
      currentSeason,
      seasonProgress: 0.5,
      seasonalEffects: [],
      upcomingTransitions: [],
      culturalEvents: [],
      naturalCycles: []
    };
  }
  
  private identifyCulturalMoments(gameState: GameState, players: Player[]): CulturalMoment[] {
    return [];
  }
  
  private analyzeTrends(): StateTrend[] {
    if (this.historicalSnapshots.length < 2) return [];
    
    const trends: StateTrend[] = [];
    
    // Analyze economic trends
    const economicTrend = this.analyzeEconomicTrend();
    if (economicTrend) trends.push(economicTrend);
    
    return trends;
  }
  
  private analyzeEconomicTrend(): StateTrend | null {
    if (this.historicalSnapshots.length < 3) return null;
    
    const recent = this.historicalSnapshots.slice(-3);
    const growthRates = recent.slice(1).map((snapshot, i) => {
      const prev = recent[i];
      return (snapshot.economicMetrics.totalWealth - prev.economicMetrics.totalWealth) 
             / prev.economicMetrics.totalWealth;
    });
    
    const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    
    return {
      category: 'economic',
      trend: avgGrowth > 0.05 ? 'increasing' : avgGrowth < -0.05 ? 'decreasing' : 'stable',
      magnitude: Math.abs(avgGrowth),
      duration: growthRates.length,
      significance: Math.min(1, Math.abs(avgGrowth) * 10)
    };
  }
  
  private generatePredictions(snapshot: GameStateSnapshot): StatePrediction[] {
    return this.predictNextEvents(snapshot, 5);
  }
  
  private identifyOpportunities(snapshot: GameStateSnapshot): GameOpportunity[] {
    const opportunities: GameOpportunity[] = [];
    
    // Trade opportunities
    if (snapshot.economicMetrics.tradeActivity.tradeFrequency < 3) {
      opportunities.push({
        type: 'economic',
        description: 'Market conditions favor increased trading activity',
        beneficiaries: snapshot.playerMetrics
          .filter(p => p.liquidCash > 500)
          .map(p => p.playerId),
        requirements: ['available_properties', 'willing_partners'],
        timeWindow: 5,
        potentialValue: 0.6
      });
    }
    
    return opportunities;
  }
  
  private assessRisks(snapshot: GameStateSnapshot): GameRisk[] {
    const risks: GameRisk[] = [];
    
    // Stagnation risk
    const stagnationRisk = this.identifyStagnationRisk(snapshot);
    if (stagnationRisk > 0.3) {
      risks.push({
        type: 'stagnation',
        severity: stagnationRisk,
        probability: stagnationRisk * 0.8,
        affectedAspects: ['player_engagement', 'game_flow'],
        mitigationOptions: ['introduce_events', 'modify_rules', 'add_incentives']
      });
    }
    
    // Dominance risk
    const dominanceRisk = this.identifyDominanceRisk(snapshot);
    if (dominanceRisk > 0.4) {
      risks.push({
        type: 'imbalance',
        severity: dominanceRisk,
        probability: dominanceRisk * 0.9,
        affectedAspects: ['competitive_balance', 'player_motivation'],
        mitigationOptions: ['balancing_events', 'catch_up_mechanics', 'progressive_taxation']
      });
    }
    
    return risks;
  }
  
  private generateRecommendations(snapshot: GameStateSnapshot): ActionRecommendation[] {
    const recommendations: ActionRecommendation[] = [];
    
    const stagnationRisk = this.identifyStagnationRisk(snapshot);
    if (stagnationRisk > 0.3) {
      recommendations.push({
        priority: 'high',
        action: 'Trigger dynamic event to increase engagement',
        reasoning: 'Game flow metrics indicate potential stagnation',
        expectedOutcome: 'Increased player activity and interest',
        implementationDifficulty: 0.3
      });
    }
    
    const economicHealth = this.getEconomicHealth(snapshot);
    if (economicHealth < 0.4) {
      recommendations.push({
        priority: 'medium',
        action: 'Introduce economic stimulus event',
        reasoning: 'Economic metrics show declining health',
        expectedOutcome: 'Improved market activity and wealth circulation',
        implementationDifficulty: 0.4
      });
    }
    
    return recommendations;
  }
  
  private predictSeasonalEvent(snapshot: GameStateSnapshot): StatePrediction | null {
    const seasonal = snapshot.seasonalContext;
    
    if (seasonal.seasonProgress > 0.8) {
      return {
        eventType: GameEventType.SEASONAL_EVENT_TRIGGERED,
        probability: 0.8,
        timeframe: 2,
        potentialImpact: 0.6,
        affectedPlayers: snapshot.playerMetrics.map(p => p.playerId),
        triggers: ['seasonal_transition', 'cultural_calendar']
      };
    }
    
    return null;
  }
  
  private predictSocialEvents(snapshot: GameStateSnapshot): StatePrediction[] {
    const predictions: StatePrediction[] = [];
    
    // Alliance formation prediction
    if (snapshot.relationshipMatrix.cooperationIndex > 0.6) {
      predictions.push({
        eventType: GameEventType.ALLIANCE_FORMED,
        probability: 0.5,
        timeframe: 3,
        potentialImpact: 0.7,
        affectedPlayers: snapshot.playerMetrics
          .filter(p => p.influenceLevel > 0.6)
          .map(p => p.playerId),
        triggers: ['high_cooperation', 'mutual_benefit']
      });
    }
    
    return predictions;
  }
  
  private predictPowerShifts(snapshot: GameStateSnapshot): StatePrediction[] {
    const predictions: StatePrediction[] = [];
    
    // Look for players with high momentum
    const risingPlayers = snapshot.playerMetrics
      .filter(p => p.momentum.direction === 'ascending' && p.momentum.velocity > 0.5);
    
    if (risingPlayers.length > 0) {
      predictions.push({
        eventType: GameEventType.POWER_SHIFT,
        probability: 0.6,
        timeframe: 4,
        potentialImpact: 0.8,
        affectedPlayers: risingPlayers.map(p => p.playerId),
        triggers: ['momentum_buildup', 'strategic_advantages']
      });
    }
    
    return predictions;
  }
  
  private getActiveTraders(snapshot: GameStateSnapshot): string[] {
    return snapshot.playerMetrics
      .filter(p => p.liquidCash > 300) // Players with enough cash to trade
      .map(p => p.playerId);
  }
  
  private initializeTrendCalculators(): void {
    // Initialize different trend calculation methods
  }
  
  private initializePredictionModels(): void {
    // Initialize prediction models for different event types
  }
  
  private generateCacheKey(snapshot: GameStateSnapshot): string {
    const keyData = {
      turn: snapshot.turn,
      phase: snapshot.gamePhase,
      playerCount: snapshot.playerMetrics.length,
      economicHealth: Math.round(this.getEconomicHealth(snapshot) * 100)
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 20);
  }
  
  public getHistoricalSnapshots(): GameStateSnapshot[] {
    return [...this.historicalSnapshots];
  }
  
  public clearHistory(): void {
    this.historicalSnapshots = [];
    this.analysisCache.clear();
    this.emit('history_cleared');
  }
  
  public exportAnalysisData(): any {
    return {
      snapshots: this.historicalSnapshots,
      cacheSize: this.analysisCache.size,
      trends: this.historicalSnapshots.length > 1 ? this.analyzeTrends() : []
    };
  }
}

interface TrendCalculator {
  calculate(snapshots: GameStateSnapshot[]): StateTrend[];
}

interface PredictionModel {
  predict(snapshot: GameStateSnapshot): StatePrediction[];
}

export const createGameStateAnalyzer = (): GameStateAnalyzer => {
  return new GameStateAnalyzer();
};

export default GameStateAnalyzer;