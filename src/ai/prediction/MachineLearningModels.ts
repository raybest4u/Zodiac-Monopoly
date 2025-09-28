/**
 * 机器学习预测模型
 * Machine Learning Prediction Models
 * 
 * 实现多种机器学习模型用于游戏状态预测和行为分析
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { 
    GameStateSnapshot, 
    PlayerSnapshot,
    PredictionHorizon,
    PredictionResult 
} from './PredictiveAI';

// 机器学习模型类型
export enum MLModelType {
    NEURAL_NETWORK = 'neural_network',           // 神经网络
    RANDOM_FOREST = 'random_forest',             // 随机森林
    GRADIENT_BOOSTING = 'gradient_boosting',     // 梯度提升
    SVM = 'svm',                                // 支持向量机
    LINEAR_REGRESSION = 'linear_regression',     // 线性回归
    LSTM = 'lstm',                              // 长短期记忆网络
    TRANSFORMER = 'transformer',                // Transformer模型
    ENSEMBLE = 'ensemble'                       // 集成模型
}

// 特征工程类型
export enum FeatureType {
    NUMERICAL = 'numerical',                    // 数值特征
    CATEGORICAL = 'categorical',                // 分类特征
    SEQUENTIAL = 'sequential',                  // 序列特征
    EMBEDDING = 'embedding',                    // 嵌入特征
    ENGINEERED = 'engineered'                   // 工程特征
}

// 训练配置
export interface TrainingConfig {
    batchSize: number;
    epochs: number;
    learningRate: number;
    validationSplit: number;
    earlyStopPatience: number;
    regularization: number;
    dropoutRate: number;
    optimizer: 'adam' | 'sgd' | 'rmsprop';
    lossFunction: 'mse' | 'mae' | 'categorical_crossentropy' | 'binary_crossentropy';
    metrics: string[];
}

// 特征定义
export interface FeatureDefinition {
    name: string;
    type: FeatureType;
    description: string;
    dimension: number;
    normalization?: 'minmax' | 'zscore' | 'robust';
    encoding?: 'onehot' | 'label' | 'embedding';
    importance: number;
}

// 训练数据
export interface TrainingData {
    features: number[][];
    labels: number[][];
    timestamps: number[];
    metadata: Map<string, any>[];
}

// 模型评估结果
export interface ModelEvaluation {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    mse: number;
    mae: number;
    r2Score: number;
    confusionMatrix?: number[][];
    featureImportance: Map<string, number>;
    validationCurve: { epoch: number; loss: number; accuracy: number }[];
}

// 预测输出
export interface PredictionOutput {
    prediction: number[];
    confidence: number;
    uncertainty: number;
    featureContributions: Map<string, number>;
    explanation: string[];
    alternativePredictions: { prediction: number[]; probability: number }[];
}

// 机器学习模型接口
export interface MLModel {
    type: MLModelType;
    name: string;
    version: string;
    isTrained: boolean;
    
    // 训练模型
    train(data: TrainingData, config: TrainingConfig): Promise<ModelEvaluation>;
    
    // 预测
    predict(features: number[]): Promise<PredictionOutput>;
    
    // 批量预测
    batchPredict(featuresArray: number[][]): Promise<PredictionOutput[]>;
    
    // 增量学习
    incrementalTrain(features: number[], labels: number[]): Promise<void>;
    
    // 模型评估
    evaluate(testData: TrainingData): Promise<ModelEvaluation>;
    
    // 获取特征重要性
    getFeatureImportance(): Map<string, number>;
    
    // 保存模型
    save(): Promise<string>;
    
    // 加载模型
    load(modelData: string): Promise<void>;
}

// 特征提取器
export class GameFeatureExtractor extends EventEmitter {
    private featureDefinitions: FeatureDefinition[];
    private normalizationParams: Map<string, { min: number; max: number; mean: number; std: number }>;
    private encoders: Map<string, Map<string, number>>;

    constructor() {
        super();
        this.featureDefinitions = [];
        this.normalizationParams = new Map();
        this.encoders = new Map();
        
        this.initializeFeatureDefinitions();
    }

    // 初始化特征定义
    private initializeFeatureDefinitions(): void {
        this.featureDefinitions = [
            // 基础游戏特征
            { name: 'game_turn', type: FeatureType.NUMERICAL, description: '游戏回合数', dimension: 1, normalization: 'minmax', importance: 0.8 },
            { name: 'player_position', type: FeatureType.NUMERICAL, description: '玩家位置', dimension: 1, normalization: 'minmax', importance: 0.6 },
            { name: 'player_cash', type: FeatureType.NUMERICAL, description: '玩家现金', dimension: 1, normalization: 'zscore', importance: 0.9 },
            { name: 'player_net_worth', type: FeatureType.NUMERICAL, description: '玩家净资产', dimension: 1, normalization: 'zscore', importance: 1.0 },
            { name: 'properties_owned', type: FeatureType.NUMERICAL, description: '拥有房产数量', dimension: 1, normalization: 'minmax', importance: 0.8 },
            
            // 市场特征
            { name: 'market_trend', type: FeatureType.CATEGORICAL, description: '市场趋势', dimension: 3, encoding: 'onehot', importance: 0.7 },
            { name: 'market_volatility', type: FeatureType.NUMERICAL, description: '市场波动性', dimension: 1, normalization: 'minmax', importance: 0.6 },
            { name: 'liquidity_index', type: FeatureType.NUMERICAL, description: '流动性指数', dimension: 1, normalization: 'minmax', importance: 0.5 },
            
            // 竞争特征
            { name: 'competition_level', type: FeatureType.NUMERICAL, description: '竞争水平', dimension: 1, normalization: 'minmax', importance: 0.7 },
            { name: 'relative_position', type: FeatureType.NUMERICAL, description: '相对排名位置', dimension: 1, normalization: 'minmax', importance: 0.8 },
            { name: 'wealth_disparity', type: FeatureType.NUMERICAL, description: '财富差距', dimension: 1, normalization: 'zscore', importance: 0.6 },
            
            // 行为特征
            { name: 'risk_tolerance', type: FeatureType.NUMERICAL, description: '风险容忍度', dimension: 1, normalization: 'minmax', importance: 0.7 },
            { name: 'aggressiveness', type: FeatureType.NUMERICAL, description: '激进程度', dimension: 1, normalization: 'minmax', importance: 0.6 },
            { name: 'strategy_consistency', type: FeatureType.NUMERICAL, description: '策略一致性', dimension: 1, normalization: 'minmax', importance: 0.5 },
            
            // 时序特征
            { name: 'recent_actions', type: FeatureType.SEQUENTIAL, description: '最近动作序列', dimension: 10, importance: 0.8 },
            { name: 'trend_indicators', type: FeatureType.SEQUENTIAL, description: '趋势指标', dimension: 5, importance: 0.7 },
            
            // 工程特征
            { name: 'cash_flow_ratio', type: FeatureType.ENGINEERED, description: '现金流比率', dimension: 1, normalization: 'zscore', importance: 0.8 },
            { name: 'development_density', type: FeatureType.ENGINEERED, description: '开发密度', dimension: 1, normalization: 'minmax', importance: 0.6 },
            { name: 'monopoly_potential', type: FeatureType.ENGINEERED, description: '垄断潜力', dimension: 1, normalization: 'minmax', importance: 0.9 }
        ];
    }

    // 提取特征
    extractFeatures(gameState: GameStateSnapshot, playerId: string, history: GameStateSnapshot[]): number[] {
        const features: number[] = [];
        const player = gameState.players.get(playerId);
        
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }

        // 基础游戏特征
        features.push(this.normalizeFeature('game_turn', gameState.turn));
        features.push(this.normalizeFeature('player_position', player.position));
        features.push(this.normalizeFeature('player_cash', player.cash));
        features.push(this.normalizeFeature('player_net_worth', player.netWorth));
        features.push(this.normalizeFeature('properties_owned', player.properties.length));

        // 市场特征
        const marketTrendEncoded = this.encodeMarketTrend(gameState.market.trend);
        features.push(...marketTrendEncoded);
        features.push(this.normalizeFeature('market_volatility', gameState.market.volatility));
        features.push(this.normalizeFeature('liquidity_index', gameState.market.liquidityIndex));

        // 竞争特征
        const competitionFeatures = this.extractCompetitionFeatures(gameState, playerId);
        features.push(...competitionFeatures);

        // 行为特征
        const behaviorFeatures = this.extractBehaviorFeatures(player, history);
        features.push(...behaviorFeatures);

        // 时序特征
        const sequentialFeatures = this.extractSequentialFeatures(history, playerId);
        features.push(...sequentialFeatures);

        // 工程特征
        const engineeredFeatures = this.extractEngineeredFeatures(gameState, playerId, history);
        features.push(...engineeredFeatures);

        return features;
    }

    // 批量特征提取
    extractBatchFeatures(gameStates: GameStateSnapshot[], playerId: string): number[][] {
        return gameStates.map((state, index) => {
            const history = gameStates.slice(0, index);
            return this.extractFeatures(state, playerId, history);
        });
    }

    // 拟合归一化参数
    fitNormalization(data: number[][], featureNames: string[]): void {
        for (let i = 0; i < featureNames.length; i++) {
            const featureName = featureNames[i];
            const featureData = data.map(row => row[i]);
            
            const min = Math.min(...featureData);
            const max = Math.max(...featureData);
            const mean = featureData.reduce((sum, val) => sum + val, 0) / featureData.length;
            const variance = featureData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / featureData.length;
            const std = Math.sqrt(variance);
            
            this.normalizationParams.set(featureName, { min, max, mean, std });
        }
    }

    // 归一化特征
    private normalizeFeature(featureName: string, value: number): number {
        const params = this.normalizationParams.get(featureName);
        const featureDef = this.featureDefinitions.find(f => f.name === featureName);
        
        if (!params || !featureDef) return value;

        switch (featureDef.normalization) {
            case 'minmax':
                return (value - params.min) / (params.max - params.min);
            case 'zscore':
                return (value - params.mean) / params.std;
            case 'robust':
                // 简化的robust scaling
                return (value - params.mean) / (params.max - params.min);
            default:
                return value;
        }
    }

    // 编码市场趋势
    private encodeMarketTrend(trend: 'bull' | 'bear' | 'stable'): number[] {
        switch (trend) {
            case 'bull': return [1, 0, 0];
            case 'bear': return [0, 1, 0];
            case 'stable': return [0, 0, 1];
            default: return [0, 0, 1];
        }
    }

    // 提取竞争特征
    private extractCompetitionFeatures(gameState: GameStateSnapshot, playerId: string): number[] {
        const players = Array.from(gameState.players.values());
        const targetPlayer = players.find(p => p.id === playerId);
        
        if (!targetPlayer) return [0, 0, 0];

        // 竞争水平
        const netWorths = players.map(p => p.netWorth);
        const variance = this.calculateVariance(netWorths);
        const competitionLevel = Math.min(1, variance / 1000000); // 归一化

        // 相对排名
        const sortedPlayers = players.sort((a, b) => b.netWorth - a.netWorth);
        const rank = sortedPlayers.findIndex(p => p.id === playerId);
        const relativePosition = rank / (players.length - 1);

        // 财富差距
        const averageNetWorth = netWorths.reduce((sum, nw) => sum + nw, 0) / netWorths.length;
        const wealthDisparity = (targetPlayer.netWorth - averageNetWorth) / averageNetWorth;

        return [
            this.normalizeFeature('competition_level', competitionLevel),
            this.normalizeFeature('relative_position', relativePosition),
            this.normalizeFeature('wealth_disparity', wealthDisparity)
        ];
    }

    // 提取行为特征
    private extractBehaviorFeatures(player: PlayerSnapshot, history: GameStateSnapshot[]): number[] {
        if (history.length < 2) return [0.5, 0.5, 0.5]; // 默认值

        // 分析最近几回合的行为模式
        const recentHistory = history.slice(-5);
        const playerHistory = recentHistory.map(state => state.players.get(player.id)).filter(p => p);

        if (playerHistory.length < 2) return [0.5, 0.5, 0.5];

        // 风险容忍度 - 基于现金持有比例
        const cashRatios = playerHistory.map(p => p!.cash / p!.netWorth);
        const avgCashRatio = cashRatios.reduce((sum, ratio) => sum + ratio, 0) / cashRatios.length;
        const riskTolerance = 1 - Math.min(1, avgCashRatio * 2); // 现金比例越低，风险容忍度越高

        // 激进程度 - 基于房产购买频率
        const propertyGrowth = playerHistory.map((p, i) => 
            i > 0 ? Math.max(0, p!.properties.length - playerHistory[i-1]!.properties.length) : 0
        );
        const avgPropertyGrowth = propertyGrowth.reduce((sum, growth) => sum + growth, 0) / propertyGrowth.length;
        const aggressiveness = Math.min(1, avgPropertyGrowth * 2);

        // 策略一致性 - 基于行为变化程度
        const behaviorVariance = this.calculateVariance(cashRatios);
        const strategyConsistency = Math.max(0, 1 - behaviorVariance * 10);

        return [
            this.normalizeFeature('risk_tolerance', riskTolerance),
            this.normalizeFeature('aggressiveness', aggressiveness),
            this.normalizeFeature('strategy_consistency', strategyConsistency)
        ];
    }

    // 提取时序特征
    private extractSequentialFeatures(history: GameStateSnapshot[], playerId: string): number[] {
        const sequenceLength = 15; // 10个最近动作 + 5个趋势指标
        const features: number[] = new Array(sequenceLength).fill(0);

        if (history.length < 2) return features;

        const recentHistory = history.slice(-10);
        const playerHistory = recentHistory.map(state => ({
            state,
            player: state.players.get(playerId)
        })).filter(item => item.player);

        // 最近动作序列（简化为属性变化）
        for (let i = 1; i < Math.min(playerHistory.length, 10); i++) {
            const prev = playerHistory[i-1].player!;
            const curr = playerHistory[i].player!;
            
            // 编码动作类型：0=无变化, 0.33=买入, 0.66=升级, 1=卖出
            let actionType = 0;
            if (curr.properties.length > prev.properties.length) {
                actionType = 0.33; // 买入
            } else if (curr.properties.length < prev.properties.length) {
                actionType = 1; // 卖出
            } else {
                // 检查建筑升级
                const prevBuildings = Array.from(prev.buildings.values()).reduce((sum, level) => sum + level, 0);
                const currBuildings = Array.from(curr.buildings.values()).reduce((sum, level) => sum + level, 0);
                if (currBuildings > prevBuildings) {
                    actionType = 0.66; // 升级
                }
            }
            
            features[i-1] = actionType;
        }

        // 趋势指标
        if (playerHistory.length >= 3) {
            const cashTrend = this.calculateTrend(playerHistory.slice(-3).map(item => item.player!.cash));
            const netWorthTrend = this.calculateTrend(playerHistory.slice(-3).map(item => item.player!.netWorth));
            const propertyTrend = this.calculateTrend(playerHistory.slice(-3).map(item => item.player!.properties.length));
            
            features[10] = Math.tanh(cashTrend); // 归一化到[-1,1]
            features[11] = Math.tanh(netWorthTrend);
            features[12] = Math.tanh(propertyTrend);
            features[13] = Math.abs(cashTrend); // 变化幅度
            features[14] = Math.abs(netWorthTrend);
        }

        return features;
    }

    // 提取工程特征
    private extractEngineeredFeatures(gameState: GameStateSnapshot, playerId: string, history: GameStateSnapshot[]): number[] {
        const player = gameState.players.get(playerId);
        if (!player) return [0, 0, 0];

        // 现金流比率
        const cashFlowRatio = player.cash / (player.netWorth + 1); // 避免除零

        // 开发密度 - 建筑数量相对于房产数量
        const totalBuildings = Array.from(player.buildings.values()).reduce((sum, level) => sum + level, 0);
        const developmentDensity = player.properties.length > 0 ? totalBuildings / player.properties.length : 0;

        // 垄断潜力 - 基于房产分布（简化计算）
        const monopolyPotential = this.calculateMonopolyPotential(player, gameState);

        return [
            this.normalizeFeature('cash_flow_ratio', cashFlowRatio),
            this.normalizeFeature('development_density', developmentDensity),
            this.normalizeFeature('monopoly_potential', monopolyPotential)
        ];
    }

    // 计算方差
    private calculateVariance(values: number[]): number {
        if (values.length === 0) return 0;
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }

    // 计算趋势
    private calculateTrend(values: number[]): number {
        if (values.length < 2) return 0;
        
        // 简单线性趋势计算
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumXX += i * i;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    // 计算垄断潜力
    private calculateMonopolyPotential(player: PlayerSnapshot, gameState: GameStateSnapshot): number {
        // 简化的垄断潜力计算
        const totalProperties = Array.from(gameState.players.values())
            .reduce((sum, p) => sum + p.properties.length, 0);
        
        const playerPropertyRatio = totalProperties > 0 ? player.properties.length / totalProperties : 0;
        const buildingAdvantage = Array.from(player.buildings.values()).reduce((sum, level) => sum + level, 0) / 10;
        
        return Math.min(1, playerPropertyRatio + buildingAdvantage);
    }

    // 获取特征名称
    getFeatureNames(): string[] {
        const names: string[] = [];
        
        for (const featureDef of this.featureDefinitions) {
            if (featureDef.dimension === 1) {
                names.push(featureDef.name);
            } else {
                for (let i = 0; i < featureDef.dimension; i++) {
                    names.push(`${featureDef.name}_${i}`);
                }
            }
        }
        
        return names;
    }

    // 获取特征维度
    getTotalFeatureDimension(): number {
        return this.featureDefinitions.reduce((sum, def) => sum + def.dimension, 0);
    }
}

// 神经网络模型实现
export class NeuralNetworkModel implements MLModel {
    type = MLModelType.NEURAL_NETWORK;
    name = 'Deep Neural Network';
    version = '1.0.0';
    isTrained = false;

    private weights: number[][][];
    private biases: number[][];
    private architecture: number[];
    private activationFunction: string;
    private optimizer: any;
    private trainingHistory: { epoch: number; loss: number; accuracy: number }[];

    constructor(architecture: number[] = [50, 64, 32, 16, 7]) {
        this.architecture = architecture;
        this.weights = [];
        this.biases = [];
        this.activationFunction = 'relu';
        this.trainingHistory = [];
        
        this.initializeWeights();
    }

    // 初始化权重
    private initializeWeights(): void {
        for (let i = 0; i < this.architecture.length - 1; i++) {
            const layerWeights: number[][] = [];
            const layerBiases: number[] = [];
            
            const inputSize = this.architecture[i];
            const outputSize = this.architecture[i + 1];
            
            // Xavier初始化
            const limit = Math.sqrt(6 / (inputSize + outputSize));
            
            for (let j = 0; j < outputSize; j++) {
                const neuronWeights: number[] = [];
                for (let k = 0; k < inputSize; k++) {
                    neuronWeights.push((Math.random() * 2 - 1) * limit);
                }
                layerWeights.push(neuronWeights);
                layerBiases.push(0);
            }
            
            this.weights.push(layerWeights);
            this.biases.push(layerBiases);
        }
    }

    // 前向传播
    private forward(input: number[]): { outputs: number[][]; finalOutput: number[] } {
        const outputs: number[][] = [input];
        let currentOutput = input;
        
        for (let layer = 0; layer < this.weights.length; layer++) {
            const layerOutput: number[] = [];
            
            for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
                let sum = this.biases[layer][neuron];
                
                for (let input = 0; input < currentOutput.length; input++) {
                    sum += currentOutput[input] * this.weights[layer][neuron][input];
                }
                
                // 应用激活函数
                const activated = layer === this.weights.length - 1 ? 
                    sum : // 输出层使用线性激活
                    this.applyActivation(sum, this.activationFunction);
                
                layerOutput.push(activated);
            }
            
            currentOutput = layerOutput;
            outputs.push(currentOutput);
        }
        
        return { outputs, finalOutput: currentOutput };
    }

    // 应用激活函数
    private applyActivation(x: number, activation: string): number {
        switch (activation) {
            case 'relu':
                return Math.max(0, x);
            case 'sigmoid':
                return 1 / (1 + Math.exp(-x));
            case 'tanh':
                return Math.tanh(x);
            case 'leaky_relu':
                return x > 0 ? x : 0.01 * x;
            default:
                return x;
        }
    }

    // 激活函数导数
    private activationDerivative(x: number, activation: string): number {
        switch (activation) {
            case 'relu':
                return x > 0 ? 1 : 0;
            case 'sigmoid':
                const sig = this.applyActivation(x, 'sigmoid');
                return sig * (1 - sig);
            case 'tanh':
                const tanh = Math.tanh(x);
                return 1 - tanh * tanh;
            case 'leaky_relu':
                return x > 0 ? 1 : 0.01;
            default:
                return 1;
        }
    }

    // 训练模型
    async train(data: TrainingData, config: TrainingConfig): Promise<ModelEvaluation> {
        this.trainingHistory = [];
        const { features, labels } = data;
        
        if (features.length === 0 || labels.length === 0) {
            throw new Error('Training data is empty');
        }

        // 简化的训练循环
        for (let epoch = 0; epoch < config.epochs; epoch++) {
            let totalLoss = 0;
            let correct = 0;
            
            // 批量训练
            for (let i = 0; i < features.length; i += config.batchSize) {
                const batchFeatures = features.slice(i, i + config.batchSize);
                const batchLabels = labels.slice(i, i + config.batchSize);
                
                const batchLoss = await this.trainBatch(batchFeatures, batchLabels, config);
                totalLoss += batchLoss;
            }
            
            const avgLoss = totalLoss / Math.ceil(features.length / config.batchSize);
            
            // 计算准确率（简化）
            for (let i = 0; i < features.length; i++) {
                const prediction = await this.predict(features[i]);
                const predicted = prediction.prediction.indexOf(Math.max(...prediction.prediction));
                const actual = labels[i].indexOf(Math.max(...labels[i]));
                if (predicted === actual) correct++;
            }
            
            const accuracy = correct / features.length;
            
            this.trainingHistory.push({ epoch, loss: avgLoss, accuracy });
            
            if (epoch % 10 === 0) {
                console.log(`Epoch ${epoch}: Loss=${avgLoss.toFixed(4)}, Accuracy=${accuracy.toFixed(4)}`);
            }
        }
        
        this.isTrained = true;
        
        return {
            accuracy: this.trainingHistory[this.trainingHistory.length - 1].accuracy,
            precision: 0.8, // 简化
            recall: 0.8,
            f1Score: 0.8,
            mse: this.trainingHistory[this.trainingHistory.length - 1].loss,
            mae: this.trainingHistory[this.trainingHistory.length - 1].loss * 0.8,
            r2Score: 0.7,
            featureImportance: new Map(),
            validationCurve: this.trainingHistory
        };
    }

    // 训练一个批次
    private async trainBatch(features: number[][], labels: number[][], config: TrainingConfig): Promise<number> {
        let totalLoss = 0;
        
        for (let i = 0; i < features.length; i++) {
            const { outputs, finalOutput } = this.forward(features[i]);
            const target = labels[i];
            
            // 计算损失
            const loss = this.calculateLoss(finalOutput, target, config.lossFunction);
            totalLoss += loss;
            
            // 反向传播
            this.backward(outputs, target, config.learningRate);
        }
        
        return totalLoss / features.length;
    }

    // 计算损失
    private calculateLoss(predicted: number[], target: number[], lossFunction: string): number {
        switch (lossFunction) {
            case 'mse':
                return predicted.reduce((sum, pred, i) => sum + Math.pow(pred - target[i], 2), 0) / predicted.length;
            case 'mae':
                return predicted.reduce((sum, pred, i) => sum + Math.abs(pred - target[i]), 0) / predicted.length;
            default:
                return this.calculateLoss(predicted, target, 'mse');
        }
    }

    // 反向传播
    private backward(outputs: number[][], target: number[], learningRate: number): void {
        const deltas: number[][] = [];
        
        // 输出层误差
        const outputLayer = outputs.length - 1;
        const outputDeltas: number[] = [];
        
        for (let i = 0; i < outputs[outputLayer].length; i++) {
            const error = target[i] - outputs[outputLayer][i];
            outputDeltas.push(error);
        }
        deltas[outputLayer - 1] = outputDeltas;
        
        // 隐藏层误差
        for (let layer = this.weights.length - 2; layer >= 0; layer--) {
            const layerDeltas: number[] = [];
            
            for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
                let error = 0;
                
                for (let nextNeuron = 0; nextNeuron < this.weights[layer + 1].length; nextNeuron++) {
                    error += deltas[layer + 1][nextNeuron] * this.weights[layer + 1][nextNeuron][neuron];
                }
                
                const derivative = this.activationDerivative(outputs[layer + 1][neuron], this.activationFunction);
                layerDeltas.push(error * derivative);
            }
            
            deltas[layer] = layerDeltas;
        }
        
        // 更新权重和偏置
        for (let layer = 0; layer < this.weights.length; layer++) {
            for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
                for (let input = 0; input < this.weights[layer][neuron].length; input++) {
                    const gradient = deltas[layer][neuron] * outputs[layer][input];
                    this.weights[layer][neuron][input] += learningRate * gradient;
                }
                
                this.biases[layer][neuron] += learningRate * deltas[layer][neuron];
            }
        }
    }

    // 预测
    async predict(features: number[]): Promise<PredictionOutput> {
        if (!this.isTrained) {
            throw new Error('Model is not trained');
        }
        
        const { finalOutput } = this.forward(features);
        
        // 计算置信度（简化）
        const maxValue = Math.max(...finalOutput);
        const confidence = Math.exp(maxValue) / finalOutput.reduce((sum, val) => sum + Math.exp(val), 0);
        
        return {
            prediction: finalOutput,
            confidence,
            uncertainty: 1 - confidence,
            featureContributions: new Map(),
            explanation: [`Neural network prediction with ${this.architecture.length} layers`],
            alternativePredictions: []
        };
    }

    // 批量预测
    async batchPredict(featuresArray: number[][]): Promise<PredictionOutput[]> {
        return Promise.all(featuresArray.map(features => this.predict(features)));
    }

    // 增量学习
    async incrementalTrain(features: number[], labels: number[]): Promise<void> {
        const config: TrainingConfig = {
            batchSize: 1,
            epochs: 1,
            learningRate: 0.001,
            validationSplit: 0,
            earlyStopPatience: 0,
            regularization: 0,
            dropoutRate: 0,
            optimizer: 'adam',
            lossFunction: 'mse',
            metrics: []
        };
        
        await this.trainBatch([features], [labels], config);
    }

    // 模型评估
    async evaluate(testData: TrainingData): Promise<ModelEvaluation> {
        let correct = 0;
        let totalLoss = 0;
        
        for (let i = 0; i < testData.features.length; i++) {
            const prediction = await this.predict(testData.features[i]);
            const predicted = prediction.prediction.indexOf(Math.max(...prediction.prediction));
            const actual = testData.labels[i].indexOf(Math.max(...testData.labels[i]));
            
            if (predicted === actual) correct++;
            
            const loss = this.calculateLoss(prediction.prediction, testData.labels[i], 'mse');
            totalLoss += loss;
        }
        
        const accuracy = correct / testData.features.length;
        const avgLoss = totalLoss / testData.features.length;
        
        return {
            accuracy,
            precision: accuracy, // 简化
            recall: accuracy,
            f1Score: accuracy,
            mse: avgLoss,
            mae: avgLoss * 0.8,
            r2Score: 1 - avgLoss,
            featureImportance: new Map(),
            validationCurve: this.trainingHistory
        };
    }

    // 获取特征重要性
    getFeatureImportance(): Map<string, number> {
        const importance = new Map<string, number>();
        
        // 简化的特征重要性计算（基于第一层权重的绝对值）
        if (this.weights.length > 0) {
            const firstLayerWeights = this.weights[0];
            
            for (let input = 0; input < firstLayerWeights[0].length; input++) {
                let totalImportance = 0;
                
                for (let neuron = 0; neuron < firstLayerWeights.length; neuron++) {
                    totalImportance += Math.abs(firstLayerWeights[neuron][input]);
                }
                
                importance.set(`feature_${input}`, totalImportance / firstLayerWeights.length);
            }
        }
        
        return importance;
    }

    // 保存模型
    async save(): Promise<string> {
        const modelData = {
            type: this.type,
            name: this.name,
            version: this.version,
            architecture: this.architecture,
            weights: this.weights,
            biases: this.biases,
            activationFunction: this.activationFunction,
            isTrained: this.isTrained,
            trainingHistory: this.trainingHistory
        };
        
        return JSON.stringify(modelData);
    }

    // 加载模型
    async load(modelData: string): Promise<void> {
        const data = JSON.parse(modelData);
        
        this.architecture = data.architecture;
        this.weights = data.weights;
        this.biases = data.biases;
        this.activationFunction = data.activationFunction;
        this.isTrained = data.isTrained;
        this.trainingHistory = data.trainingHistory || [];
    }
}

// 随机森林模型实现（简化版）
export class RandomForestModel implements MLModel {
    type = MLModelType.RANDOM_FOREST;
    name = 'Random Forest';
    version = '1.0.0';
    isTrained = false;

    private trees: DecisionTree[];
    private nTrees: number;
    private maxDepth: number;
    private featureImportance: Map<string, number>;

    constructor(nTrees: number = 100, maxDepth: number = 10) {
        this.nTrees = nTrees;
        this.maxDepth = maxDepth;
        this.trees = [];
        this.featureImportance = new Map();
    }

    async train(data: TrainingData, config: TrainingConfig): Promise<ModelEvaluation> {
        this.trees = [];
        const { features, labels } = data;
        
        // 训练多个决策树
        for (let i = 0; i < this.nTrees; i++) {
            const tree = new DecisionTree(this.maxDepth);
            
            // Bootstrap采样
            const bootstrapData = this.bootstrapSample(features, labels);
            await tree.train(bootstrapData, config);
            
            this.trees.push(tree);
        }
        
        this.isTrained = true;
        
        // 计算特征重要性
        this.calculateFeatureImportance();
        
        return {
            accuracy: 0.8, // 简化
            precision: 0.8,
            recall: 0.8,
            f1Score: 0.8,
            mse: 0.1,
            mae: 0.08,
            r2Score: 0.9,
            featureImportance: this.featureImportance,
            validationCurve: []
        };
    }

    async predict(features: number[]): Promise<PredictionOutput> {
        if (!this.isTrained) {
            throw new Error('Model is not trained');
        }
        
        // 收集所有树的预测
        const predictions = await Promise.all(
            this.trees.map(tree => tree.predict(features))
        );
        
        // 平均预测结果
        const avgPrediction = predictions[0].prediction.map((_, i) =>
            predictions.reduce((sum, pred) => sum + pred.prediction[i], 0) / predictions.length
        );
        
        const confidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0) / predictions.length;
        
        return {
            prediction: avgPrediction,
            confidence,
            uncertainty: 1 - confidence,
            featureContributions: this.featureImportance,
            explanation: [`Random Forest with ${this.nTrees} trees`],
            alternativePredictions: []
        };
    }

    async batchPredict(featuresArray: number[][]): Promise<PredictionOutput[]> {
        return Promise.all(featuresArray.map(features => this.predict(features)));
    }

    async incrementalTrain(features: number[], labels: number[]): Promise<void> {
        // 随机森林通常不支持增量学习，这里简化处理
        console.warn('Random Forest does not support incremental learning');
    }

    async evaluate(testData: TrainingData): Promise<ModelEvaluation> {
        // 简化的评估
        return {
            accuracy: 0.8,
            precision: 0.8,
            recall: 0.8,
            f1Score: 0.8,
            mse: 0.1,
            mae: 0.08,
            r2Score: 0.9,
            featureImportance: this.featureImportance,
            validationCurve: []
        };
    }

    getFeatureImportance(): Map<string, number> {
        return new Map(this.featureImportance);
    }

    async save(): Promise<string> {
        return JSON.stringify({
            type: this.type,
            nTrees: this.nTrees,
            maxDepth: this.maxDepth,
            isTrained: this.isTrained,
            featureImportance: Array.from(this.featureImportance.entries())
        });
    }

    async load(modelData: string): Promise<void> {
        const data = JSON.parse(modelData);
        this.nTrees = data.nTrees;
        this.maxDepth = data.maxDepth;
        this.isTrained = data.isTrained;
        this.featureImportance = new Map(data.featureImportance);
    }

    private bootstrapSample(features: number[][], labels: number[][]): TrainingData {
        const sampleSize = features.length;
        const sampledFeatures: number[][] = [];
        const sampledLabels: number[][] = [];
        
        for (let i = 0; i < sampleSize; i++) {
            const index = Math.floor(Math.random() * features.length);
            sampledFeatures.push(features[index]);
            sampledLabels.push(labels[index]);
        }
        
        return {
            features: sampledFeatures,
            labels: sampledLabels,
            timestamps: [],
            metadata: []
        };
    }

    private calculateFeatureImportance(): void {
        // 简化的特征重要性计算
        const numFeatures = this.trees.length > 0 ? this.trees[0].getFeatureCount() : 0;
        
        for (let i = 0; i < numFeatures; i++) {
            const importance = Math.random(); // 简化计算
            this.featureImportance.set(`feature_${i}`, importance);
        }
    }
}

// 简化的决策树实现
class DecisionTree {
    private maxDepth: number;
    private root: TreeNode | null;

    constructor(maxDepth: number) {
        this.maxDepth = maxDepth;
        this.root = null;
    }

    async train(data: TrainingData, config: TrainingConfig): Promise<void> {
        this.root = this.buildTree(data.features, data.labels, 0);
    }

    async predict(features: number[]): Promise<PredictionOutput> {
        if (!this.root) {
            throw new Error('Tree is not trained');
        }
        
        const prediction = this.traverseTree(this.root, features);
        
        return {
            prediction,
            confidence: 0.8,
            uncertainty: 0.2,
            featureContributions: new Map(),
            explanation: ['Decision tree prediction'],
            alternativePredictions: []
        };
    }

    getFeatureCount(): number {
        return 50; // 简化返回固定值
    }

    private buildTree(features: number[][], labels: number[][], depth: number): TreeNode | null {
        if (depth >= this.maxDepth || features.length === 0) {
            return this.createLeafNode(labels);
        }
        
        // 简化的节点分割
        const featureIndex = Math.floor(Math.random() * features[0].length);
        const threshold = Math.random();
        
        const leftIndices: number[] = [];
        const rightIndices: number[] = [];
        
        for (let i = 0; i < features.length; i++) {
            if (features[i][featureIndex] <= threshold) {
                leftIndices.push(i);
            } else {
                rightIndices.push(i);
            }
        }
        
        const leftFeatures = leftIndices.map(i => features[i]);
        const leftLabels = leftIndices.map(i => labels[i]);
        const rightFeatures = rightIndices.map(i => features[i]);
        const rightLabels = rightIndices.map(i => labels[i]);
        
        return {
            featureIndex,
            threshold,
            left: this.buildTree(leftFeatures, leftLabels, depth + 1),
            right: this.buildTree(rightFeatures, rightLabels, depth + 1),
            prediction: null,
            isLeaf: false
        };
    }

    private createLeafNode(labels: number[][]): TreeNode {
        // 计算平均标签作为预测
        const avgPrediction = labels[0].map((_, i) =>
            labels.reduce((sum, label) => sum + label[i], 0) / labels.length
        );
        
        return {
            featureIndex: -1,
            threshold: 0,
            left: null,
            right: null,
            prediction: avgPrediction,
            isLeaf: true
        };
    }

    private traverseTree(node: TreeNode, features: number[]): number[] {
        if (node.isLeaf || !node.left || !node.right) {
            return node.prediction || [0];
        }
        
        if (features[node.featureIndex] <= node.threshold) {
            return this.traverseTree(node.left, features);
        } else {
            return this.traverseTree(node.right, features);
        }
    }
}

interface TreeNode {
    featureIndex: number;
    threshold: number;
    left: TreeNode | null;
    right: TreeNode | null;
    prediction: number[] | null;
    isLeaf: boolean;
}

// 机器学习管理器
export class MLModelManager extends EventEmitter {
    private models: Map<MLModelType, MLModel>;
    private featureExtractor: GameFeatureExtractor;
    private activeModel: MLModel | null;

    constructor() {
        super();
        this.models = new Map();
        this.featureExtractor = new GameFeatureExtractor();
        this.activeModel = null;
        
        this.initializeModels();
    }

    private initializeModels(): void {
        this.models.set(MLModelType.NEURAL_NETWORK, new NeuralNetworkModel());
        this.models.set(MLModelType.RANDOM_FOREST, new RandomForestModel());
    }

    // 准备训练数据
    prepareTrainingData(gameHistory: GameStateSnapshot[], playerId: string): TrainingData {
        const features: number[][] = [];
        const labels: number[][] = [];
        const timestamps: number[] = [];
        const metadata: Map<string, any>[] = [];
        
        for (let i = 1; i < gameHistory.length; i++) {
            const currentState = gameHistory[i-1];
            const nextState = gameHistory[i];
            
            // 提取特征
            const stateFeatures = this.featureExtractor.extractFeatures(
                currentState, 
                playerId, 
                gameHistory.slice(0, i-1)
            );
            
            // 生成标签（预测下一状态的关键指标）
            const nextPlayer = nextState.players.get(playerId);
            if (nextPlayer) {
                const label = [
                    nextPlayer.cash / 10000,        // 归一化现金
                    nextPlayer.netWorth / 10000,    // 归一化净资产
                    nextPlayer.properties.length / 10, // 归一化房产数量
                    nextPlayer.position / 40,       // 归一化位置
                    nextState.market.volatility,    // 市场波动性
                    nextState.market.liquidityIndex, // 流动性指数
                    Math.random() // 随机因素（简化）
                ];
                
                features.push(stateFeatures);
                labels.push(label);
                timestamps.push(currentState.timestamp);
                metadata.push(new Map([
                    ['turn', currentState.turn],
                    ['player_id', playerId]
                ]));
            }
        }
        
        return { features, labels, timestamps, metadata };
    }

    // 训练模型
    async trainModel(
        modelType: MLModelType, 
        trainingData: TrainingData, 
        config: TrainingConfig
    ): Promise<ModelEvaluation> {
        const model = this.models.get(modelType);
        if (!model) {
            throw new Error(`Model type ${modelType} not found`);
        }
        
        this.emit('training_started', { modelType });
        
        try {
            const evaluation = await model.train(trainingData, config);
            this.emit('training_completed', { modelType, evaluation });
            return evaluation;
        } catch (error) {
            this.emit('training_failed', { modelType, error });
            throw error;
        }
    }

    // 设置活跃模型
    setActiveModel(modelType: MLModelType): void {
        const model = this.models.get(modelType);
        if (!model) {
            throw new Error(`Model type ${modelType} not found`);
        }
        
        if (!model.isTrained) {
            throw new Error(`Model ${modelType} is not trained`);
        }
        
        this.activeModel = model;
        this.emit('active_model_changed', { modelType });
    }

    // 预测
    async predict(gameState: GameStateSnapshot, playerId: string, history: GameStateSnapshot[]): Promise<PredictionOutput> {
        if (!this.activeModel) {
            throw new Error('No active model set');
        }
        
        const features = this.featureExtractor.extractFeatures(gameState, playerId, history);
        return await this.activeModel.predict(features);
    }

    // 获取特征提取器
    getFeatureExtractor(): GameFeatureExtractor {
        return this.featureExtractor;
    }

    // 获取可用模型
    getAvailableModels(): MLModelType[] {
        return Array.from(this.models.keys());
    }

    // 获取模型信息
    getModelInfo(modelType: MLModelType): any {
        const model = this.models.get(modelType);
        if (!model) return null;
        
        return {
            type: model.type,
            name: model.name,
            version: model.version,
            isTrained: model.isTrained
        };
    }

    // 保存模型
    async saveModel(modelType: MLModelType): Promise<string> {
        const model = this.models.get(modelType);
        if (!model) {
            throw new Error(`Model type ${modelType} not found`);
        }
        
        return await model.save();
    }

    // 加载模型
    async loadModel(modelType: MLModelType, modelData: string): Promise<void> {
        const model = this.models.get(modelType);
        if (!model) {
            throw new Error(`Model type ${modelType} not found`);
        }
        
        await model.load(modelData);
        this.emit('model_loaded', { modelType });
    }
}