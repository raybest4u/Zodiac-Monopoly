import type { ZodiacSign, PlayerAction, GameEvent } from './game';

// 难度等级
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

// AI个性特征
export interface AIPersonality {
  // 基础特征 (0-1)
  risk_tolerance: number;      // 风险承受能力
  aggression: number;          // 攻击性
  cooperation: number;         // 合作倾向
  adaptability: number;        // 适应性
  patience: number;            // 耐心程度
  
  // 投资偏好
  property_preference: PropertyPreference;
  skill_usage_tendency: SkillUsageTendency;
  
  // 社交特征
  negotiation_style: NegotiationStyle;
  reaction_patterns: ReactionPattern[];
  
  // 生肖特色
  zodiac_traits: ZodiacTraits;
  cultural_preferences: string[];
}

// 房产偏好
export interface PropertyPreference {
  preferredTypes: PropertyType[];
  investmentFocus: InvestmentFocus;
  maxInvestmentRatio: number;
}

// 技能使用倾向
export interface SkillUsageTendency {
  aggressiveSkills: number;    // 攻击性技能使用频率
  defensiveSkills: number;     // 防御性技能使用频率
  economicSkills: number;      // 经济技能使用频率
  timingPreference: TimingPreference;
}

// 谈判风格
export interface NegotiationStyle {
  style: 'aggressive' | 'cooperative' | 'calculating' | 'unpredictable';
  concessionRate: number;      // 让步速度
  bluffProbability: number;    // 虚张声势概率
  fairnessWeight: number;      // 公平性权重
}

// 反应模式
export interface ReactionPattern {
  trigger: ReactionTrigger;
  response: ReactionResponse;
  intensity: number;
  duration: number;
}

// 生肖特质
export interface ZodiacTraits {
  strengths: string[];
  weaknesses: string[];
  luckyNumbers: number[];
  luckyColors: string[];
  compatibleZodiacs: ZodiacSign[];
  conflictZodiacs: ZodiacSign[];
}

// AI决策
export interface AIDecision {
  action: PlayerAction;
  confidence: number;
  reasoning: string;
  alternatives: AlternativeAction[];
  
  // 决策过程
  analysis: SituationAnalysis;
  strategy: AIStrategy;
  
  timestamp: number;
}

// 替代方案
export interface AlternativeAction {
  action: PlayerAction;
  score: number;
  reasoning: string;
}

// 情况分析
export interface SituationAnalysis {
  gamePhase: GamePhaseAnalysis;
  playerPositions: PlayerPositionAnalysis[];
  economicSituation: EconomicAnalysis;
  threats: ThreatAnalysis[];
  opportunities: OpportunityAnalysis[];
}

// 游戏阶段分析
export interface GamePhaseAnalysis {
  phase: 'early' | 'middle' | 'late';
  turnsRemaining: number;
  winProbability: number;
  strategicFocus: StrategyFocus[];
}

// 玩家位置分析
export interface PlayerPositionAnalysis {
  playerId: string;
  rankPosition: number;
  threat: number;
  alliance: number;
  predictedMoves: string[];
}

// 经济分析
export interface EconomicAnalysis {
  cashFlow: number;
  netWorth: number;
  liquidityRatio: number;
  propertyValue: number;
  moneyRank: number;
  propertyRank: number;
}

// 威胁分析
export interface ThreatAnalysis {
  source: string;
  type: ThreatType;
  severity: number;
  probability: number;
  mitigation: string[];
}

// 机会分析
export interface OpportunityAnalysis {
  type: OpportunityType;
  value: number;
  probability: number;
  requirements: string[];
  timeWindow: number;
}

// AI策略
export interface AIStrategy {
  name: string;
  description: string;
  
  // 策略参数
  focus: StrategyFocus;
  timeHorizon: 'short' | 'medium' | 'long';
  riskLevel: 'conservative' | 'balanced' | 'aggressive';
  
  // 策略权重
  weights: StrategyWeights;
}

// 策略权重
export interface StrategyWeights {
  moneyAccumulation: number;
  propertyAcquisition: number;
  playerBlockade: number;
  riskAvoidance: number;
  opportunismWeight: number;
}

// AI反应
export interface AIReaction {
  type: ReactionType;
  intensity: number;
  message?: string;
  emotionalState: EmotionalState;
  behaviourChange?: BehaviourChange;
}

// AI对手配置
export interface AIOpponentConfig {
  id: string;
  name: string;
  zodiac: ZodiacSign;
  difficulty: DifficultyLevel;
  personalityOverrides?: Partial<AIPersonality>;
}

// AI状态
export interface AIState {
  id: string;
  personality: AIPersonality;
  currentStrategy: AIStrategy;
  emotionalState: EmotionalState;
  memory: AIMemory;
  learningData: LearningData;
}

// AI记忆
export interface AIMemory {
  recentEvents: MemoryEvent[];
  playerRelationships: Record<string, PlayerRelationship>;
  strategicKnowledge: StrategicKnowledge[];
  experienceBuffer: Experience[];
}

// 记忆事件
export interface MemoryEvent {
  event: GameEvent;
  importance: number;
  timestamp: number;
  associatedPlayers: string[];
}

// 玩家关系
export interface PlayerRelationship {
  playerId: string;
  trustLevel: number;
  aggressionLevel: number;
  predictability: number;
  lastInteraction: number;
}

// 战略知识
export interface StrategicKnowledge {
  pattern: string;
  effectiveness: number;
  conditions: string[];
  counter_strategies: string[];
}

// 经验
export interface Experience {
  situation: SituationSignature;
  action: PlayerAction;
  outcome: ExperienceOutcome;
  reward: number;
}

// 情况签名
export interface SituationSignature {
  gamePhase: string;
  relativePosition: number;
  moneyRatio: number;
  propertyRatio: number;
  threatLevel: number;
}

// 经验结果
export interface ExperienceOutcome {
  success: boolean;
  moneyChange: number;
  positionChange: number;
  gameStateChange: string;
}

// 学习数据
export interface LearningData {
  totalGames: number;
  winRate: number;
  averageScore: number;
  strategyEffectiveness: Record<string, number>;
  adaptationRate: number;
}

// 情绪状态
export interface EmotionalState {
  mood: EmotionalMood;
  confidence: number;
  frustration: number;
  excitement: number;
  lastMoodChange: number;
}

// 行为变化
export interface BehaviourChange {
  type: BehaviourChangeType;
  magnitude: number;
  duration: number;
  description: string;
}

// AI统计数据
export interface AIStatistics {
  totalDecisions: number;
  averageDecisionTime: number;
  confidenceLevel: number;
  successRate: number;
  cacheHitRate: number;
  learningProgress: number;
}

// 决策上下文
export interface DecisionContext {
  urgency: number;
  complexity: number;
  stakes: number;
  timeLimit?: number;
  additionalInfo?: Record<string, any>;
}

// 枚举类型
export type PropertyType = 'commercial' | 'residential' | 'industrial' | 'luxury' | 'agricultural' | 'financial' | 'transport' | 'tourism' | 'entertainment' | 'food' | 'service' | 'mixed';

export type InvestmentFocus = 'roi' | 'stability' | 'control' | 'safety' | 'prestige' | 'growth' | 'liquidity' | 'harmony' | 'flexibility' | 'consistency' | 'reliability' | 'diversification';

export type TimingPreference = 'early_game' | 'mid_game' | 'late_game' | 'opportunistic' | 'reactive';

export type ReactionTrigger = 'attacked' | 'helped' | 'outbid' | 'successful_trade' | 'failed_trade' | 'lucky_event' | 'unlucky_event';

export type ReactionResponse = 'aggressive' | 'defensive' | 'cooperative' | 'vengeful' | 'grateful' | 'neutral';

export type StrategyFocus = 'wealth_accumulation' | 'property_monopoly' | 'player_elimination' | 'risk_minimization' | 'opportunistic';

export type ThreatType = 'economic' | 'positional' | 'skill_based' | 'alliance_based';

export type OpportunityType = 'property_purchase' | 'trade_opportunity' | 'skill_usage' | 'alliance_formation' | 'market_timing';

export type ReactionType = 'verbal' | 'strategic' | 'emotional' | 'alliance_change';

export type EmotionalMood = 'confident' | 'frustrated' | 'excited' | 'cautious' | 'aggressive' | 'desperate' | 'content';

export type BehaviourChangeType = 'risk_tolerance' | 'aggression_level' | 'cooperation_level' | 'strategy_change';

// 高级AI功能接口

// AI决策树节点
export interface DecisionTreeNode {
  id: string;
  type: 'condition' | 'action' | 'probability';
  
  // 条件节点
  condition?: DecisionCondition;
  
  // 动作节点
  action?: DecisionAction;
  
  // 概率节点
  probability?: number;
  
  // 子节点
  children: DecisionTreeNode[];
  
  // 元数据
  weight: number;
  priority: number;
  description: string;
}

// 决策条件接口
export interface DecisionCondition {
  type: 'game_state' | 'player_state' | 'opponent_state' | 'market_state' | 'time_constraint';
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
  weight: number;
}

// 决策动作接口
export interface DecisionAction {
  type: 'immediate' | 'planned' | 'conditional';
  actionType: string;
  parameters: Record<string, any>;
  confidence: number;
  expectedOutcome: ExpectedOutcome;
}

// 预期结果接口
export interface ExpectedOutcome {
  probability: number;
  benefit: number;
  risk: number;
  timeline: number;
  description: string;
}

// AI学习系统接口
export interface LearningSystem {
  type: 'reinforcement' | 'supervised' | 'unsupervised' | 'hybrid';
  algorithm: LearningAlgorithm;
  parameters: LearningParameters;
  
  // 学习状态
  isTraining: boolean;
  learningRate: number;
  explorationRate: number;
  
  // 学习历史
  trainingHistory: TrainingSession[];
  
  // 模型状态
  modelVersion: string;
  lastUpdated: number;
  performance: ModelPerformance;
}

// 学习算法类型
export type LearningAlgorithm = 
  | 'q_learning' | 'deep_q_network' | 'policy_gradient' 
  | 'actor_critic' | 'monte_carlo' | 'temporal_difference'
  | 'neural_network' | 'decision_tree' | 'random_forest';

// 学习参数接口
export interface LearningParameters {
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
  batchSize: number;
  
  // 网络结构（如果适用）
  hiddenLayers?: number[];
  activationFunction?: string;
  
  // 训练参数
  maxEpisodes: number;
  maxStepsPerEpisode: number;
  updateFrequency: number;
}

// 训练会话接口
export interface TrainingSession {
  id: string;
  startTime: number;
  endTime: number;
  episodes: number;
  
  // 训练结果
  initialPerformance: number;
  finalPerformance: number;
  improvementRate: number;
  
  // 训练数据
  totalReward: number;
  averageReward: number;
  bestEpisode: number;
  convergenceEpisode?: number;
}

// 模型性能接口
export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  
  // 游戏特定指标
  winRate: number;
  averageScore: number;
  decisionQuality: number;
  adaptabilityScore: number;
  
  // 效率指标
  averageDecisionTime: number;
  memoryUsage: number;
  computationCost: number;
}

// AI行为模式接口
export interface BehaviorPattern {
  id: string;
  name: string;
  description: string;
  
  // 模式触发条件
  triggers: PatternTrigger[];
  
  // 行为序列
  behaviors: BehaviorSequence[];
  
  // 模式特征
  frequency: number;
  effectiveness: number;
  adaptability: number;
  
  // 学习状态
  isLearned: boolean;
  learnedAt?: number;
  usage_count: number;
}

// 模式触发器接口
export interface PatternTrigger {
  type: 'situation' | 'opponent_action' | 'game_event' | 'time_based';
  condition: string;
  threshold: number;
  weight: number;
}

// 行为序列接口
export interface BehaviorSequence {
  step: number;
  action: string;
  timing: BehaviorTiming;
  conditions?: string[];
  alternatives?: string[];
}

// 行为时机类型
export type BehaviorTiming = 'immediate' | 'delayed' | 'conditional' | 'reactive';

// AI个性进化接口
export interface PersonalityEvolution {
  basePersonality: AIPersonality;
  currentPersonality: AIPersonality;
  
  // 进化历史
  evolutionHistory: PersonalitySnapshot[];
  
  // 进化触发器
  evolutionTriggers: EvolutionTrigger[];
  
  // 进化参数
  evolutionRate: number;
  stabilityThreshold: number;
  maxDeviation: number;
}

// 个性快照接口
export interface PersonalitySnapshot {
  timestamp: number;
  personality: AIPersonality;
  trigger: string;
  context: EvolutionContext;
}

// 进化触发器接口
export interface EvolutionTrigger {
  type: 'performance' | 'interaction' | 'time' | 'event';
  condition: string;
  threshold: number;
  effect: PersonalityChange;
}

// 个性变化接口
export interface PersonalityChange {
  trait: keyof AIPersonality;
  delta: number;
  duration: number;
  description: string;
}

// 进化上下文接口
export interface EvolutionContext {
  gamePhase: string;
  performance: number;
  socialInteractions: number;
  stressLevel: number;
  successRate: number;
}

// AI沟通系统接口
export interface CommunicationSystem {
  // 语言生成
  languageModel: LanguageModel;
  
  // 沟通风格
  communicationStyle: CommunicationStyle;
  
  // 沟通历史
  conversationHistory: Conversation[];
  
  // 情感分析
  emotionAnalysis: EmotionAnalysis;
}

// 语言模型接口
export interface LanguageModel {
  modelType: 'rule_based' | 'template' | 'neural' | 'llm_api';
  modelId: string;
  parameters: LanguageModelParameters;
  
  // 生成配置
  maxTokens: number;
  temperature: number;
  topP: number;
  
  // 语言特性
  supportedLanguages: string[];
  culturalContext: string;
  personalityInfluence: boolean;
}

// 语言模型参数接口
export interface LanguageModelParameters {
  contextLength: number;
  responsiveness: number;
  creativity: number;
  formality: number;
  verbosity: number;
}

// 沟通风格接口
export interface CommunicationStyle {
  tone: CommunicationTone;
  formality: FormalityLevel;
  verbosity: VerbosityLevel;
  humor: HumorLevel;
  
  // 生肖特色
  zodiacInfluence: boolean;
  culturalReferences: boolean;
  traditionalPhrases: string[];
}

// 沟通语调类型
export type CommunicationTone = 
  | 'friendly' | 'neutral' | 'competitive' | 'cooperative'
  | 'confident' | 'humble' | 'playful' | 'serious';

// 正式程度类型
export type FormalityLevel = 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';

// 话语量类型
export type VerbosityLevel = 'brief' | 'concise' | 'moderate' | 'detailed' | 'verbose';

// 幽默程度类型
export type HumorLevel = 'none' | 'subtle' | 'moderate' | 'frequent' | 'heavy';

// 对话接口
export interface Conversation {
  id: string;
  participants: string[];
  startTime: number;
  endTime?: number;
  
  // 对话内容
  messages: ConversationMessage[];
  
  // 对话分析
  sentiment: ConversationSentiment;
  topics: string[];
  outcome: ConversationOutcome;
}

// 对话消息接口
export interface ConversationMessage {
  id: string;
  senderId: string;
  timestamp: number;
  
  // 消息内容
  content: string;
  type: MessageType;
  
  // 消息分析
  sentiment: number; // -1 到 1
  confidence: number;
  intent: MessageIntent;
  
  // 上下文
  context: MessageContext;
}

// 消息类型
export type MessageType = 
  | 'greeting' | 'taunt' | 'compliment' | 'threat' | 'offer'
  | 'acceptance' | 'rejection' | 'question' | 'statement' | 'reaction';

// 消息意图接口
export interface MessageIntent {
  primary: IntentType;
  secondary?: IntentType;
  confidence: number;
}

// 意图类型
export type IntentType = 
  | 'build_relationship' | 'intimidate' | 'negotiate' | 'information_gather'
  | 'alliance_form' | 'alliance_break' | 'celebrate' | 'sympathize';

// 消息上下文接口
export interface MessageContext {
  gamePhase: string;
  recentEvents: string[];
  relationshipStatus: number;
  powerBalance: number;
}

// 对话情感接口
export interface ConversationSentiment {
  overall: number;
  progression: number[];
  peak: number;
  valley: number;
}

// 对话结果接口
export interface ConversationOutcome {
  type: 'positive' | 'negative' | 'neutral';
  impact: ConversationImpact;
  duration: number;
}

// 对话影响接口
export interface ConversationImpact {
  relationshipChange: number;
  trustChange: number;
  respectChange: number;
  fearChange: number;
  
  // 游戏影响
  strategicAdvantage: number;
  informationGained: string[];
  allianceStrength: number;
}

// 情感分析接口
export interface EmotionAnalysis {
  currentEmotion: EmotionState;
  emotionHistory: EmotionSnapshot[];
  
  // 情感模式
  emotionPatterns: EmotionPattern[];
  
  // 情感触发器
  emotionTriggers: EmotionTrigger[];
}

// 情感状态接口
export interface EmotionState {
  primary: EmotionType;
  secondary?: EmotionType;
  intensity: number;
  duration: number;
  
  // 情感原因
  cause: string;
  triggers: string[];
}

// 情感类型
export type EmotionType = 
  | 'joy' | 'anger' | 'fear' | 'sadness' | 'surprise' | 'disgust'
  | 'confidence' | 'anxiety' | 'excitement' | 'frustration' | 'satisfaction'
  | 'envy' | 'pride' | 'shame' | 'curiosity' | 'boredom';

// 情感快照接口
export interface EmotionSnapshot {
  timestamp: number;
  emotion: EmotionState;
  context: EmotionContext;
}

// 情感上下文接口
export interface EmotionContext {
  gameEvent: string;
  performance: number;
  socialSituation: string;
  expectationMet: boolean;
}

// 情感模式接口
export interface EmotionPattern {
  id: string;
  name: string;
  description: string;
  
  // 模式特征
  emotionSequence: EmotionType[];
  duration: number;
  frequency: number;
  
  // 触发条件
  triggers: string[];
  preventers: string[];
}

// 情感触发器接口
export interface EmotionTrigger {
  event: string;
  emotion: EmotionType;
  intensity: number;
  duration: number;
  probability: number;
}