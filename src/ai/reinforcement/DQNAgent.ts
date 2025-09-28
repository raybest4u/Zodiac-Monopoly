/**
 * Deep Q-Network (DQN) 强化学习算法实现
 * Deep Q-Network Reinforcement Learning Algorithm
 * 
 * 实现基于深度神经网络的Q学习算法，包括Experience Replay、Target Network等先进技术
 */

import { EventEmitter } from '../../utils/EventEmitter';
import type { 
  RLState, 
  RLAction, 
  RLReward, 
  RLExperience,
  DQNConfig,
  NetworkLayer,
  OptimizerConfig
} from './ReinforcementLearningFramework';

export interface DQNModel {
  id: string;
  name: string;
  architecture: NetworkLayer[];
  weights: Float32Array[];
  biases: Float32Array[];
  inputDimension: number;
  outputDimension: number;
  activationFunctions: Map<number, ActivationFunction>;
}

export interface ExperienceReplayBuffer {
  capacity: number;
  size: number;
  experiences: RLExperience[];
  priorities?: Float32Array;
  isPrioritized: boolean;
  alpha?: number; // 优先级指数
  beta?: number;  // 重要性采样指数
  epsilon?: number; // 优先级平滑因子
}

export interface DQNTrainingConfig {
  batchSize: number;
  targetUpdateFrequency: number;
  learningRate: number;
  optimizer: OptimizerConfig;
  doubleDQN: boolean;
  duelingDQN: boolean;
  prioritizedReplay: boolean;
  noisyNetworks: boolean;
  distributionalRL: boolean;
  multiStepLearning?: {
    nSteps: number;
    gamma: number;
  };
}

export interface DQNMetrics {
  loss: number;
  qValueMean: number;
  qValueStd: number;
  targetQMean: number;
  gradientNorm: number;
  replayBufferSize: number;
  explorationRate: number;
  learningProgress: number[];
}

export interface ActivationFunction {
  forward: (x: number) => number;
  backward: (x: number) => number;
  name: string;
}

export interface LayerOutput {
  values: Float32Array;
  activations: Float32Array;
  gradients?: Float32Array;
}

export class DQNAgent extends EventEmitter {
  private mainNetwork: DQNModel;
  private targetNetwork: DQNModel;
  private replayBuffer: ExperienceReplayBuffer;
  private config: DQNTrainingConfig;
  private metrics: DQNMetrics;
  private optimizer: Optimizer;
  private stepCount: number = 0;
  private episodeCount: number = 0;
  private lastTargetUpdate: number = 0;

  constructor(
    networkConfig: DQNConfig,
    trainingConfig: DQNTrainingConfig,
    inputDim: number,
    outputDim: number
  ) {
    super();
    
    this.config = trainingConfig;
    this.mainNetwork = this.createNetwork('main', networkConfig, inputDim, outputDim);
    this.targetNetwork = this.createNetwork('target', networkConfig, inputDim, outputDim);
    this.replayBuffer = this.createReplayBuffer(trainingConfig);
    this.optimizer = this.createOptimizer(trainingConfig.optimizer);
    this.metrics = this.initializeMetrics();
    
    // 初始化目标网络
    this.copyNetworkWeights(this.mainNetwork, this.targetNetwork);
    
    this.emit('dqn:initialized', {
      networkArchitecture: networkConfig.networkArchitecture,
      totalParameters: this.countNetworkParameters(this.mainNetwork)
    });
  }

  // ============================================================================
  // DQN 核心算法实现
  // ============================================================================

  public selectAction(state: RLState, availableActions: RLAction[], explorationRate: number): RLAction {
    // ε-greedy 动作选择 with neural network
    if (Math.random() < explorationRate) {
      // 探索：随机选择
      const randomIndex = Math.floor(Math.random() * availableActions.length);
      return availableActions[randomIndex];
    } else {
      // 利用：使用神经网络预测Q值
      const stateVector = this.stateToVector(state);
      const qValues = this.forwardPass(this.mainNetwork, stateVector);
      
      // 找到最高Q值对应的动作
      const bestActionIndex = this.findBestActionIndex(qValues, availableActions);
      
      this.emit('action:selected', {
        state: state.id,
        action: availableActions[bestActionIndex].id,
        qValue: qValues.values[bestActionIndex],
        method: 'exploitation'
      });
      
      return availableActions[bestActionIndex];
    }
  }

  public storeExperience(experience: RLExperience): void {
    if (this.replayBuffer.size < this.replayBuffer.capacity) {
      this.replayBuffer.experiences.push(experience);
      this.replayBuffer.size++;
    } else {
      // 覆盖最旧的经验
      const index = this.stepCount % this.replayBuffer.capacity;
      this.replayBuffer.experiences[index] = experience;
    }

    // 如果使用优先级经验回放，计算TD误差作为优先级
    if (this.replayBuffer.isPrioritized && this.replayBuffer.priorities) {
      const priority = this.calculateTDError(experience);
      const index = this.replayBuffer.size < this.replayBuffer.capacity ? 
        this.replayBuffer.size - 1 : this.stepCount % this.replayBuffer.capacity;
      this.replayBuffer.priorities[index] = Math.abs(priority) + (this.replayBuffer.epsilon || 1e-6);
    }

    this.stepCount++;
  }

  public async trainNetwork(): Promise<void> {
    if (this.replayBuffer.size < this.config.batchSize) {
      return; // 样本不足，跳过训练
    }

    // 从经验回放缓冲区采样
    const batch = this.sampleBatch();
    
    // 计算目标Q值
    const targets = await this.computeTargets(batch);
    
    // 前向传播获取当前Q值
    const currentQValues = batch.map(exp => 
      this.forwardPass(this.mainNetwork, this.stateToVector(exp.state))
    );

    // 计算损失
    const loss = this.computeLoss(currentQValues, targets, batch);
    
    // 反向传播更新网络权重
    await this.backwardPass(currentQValues, targets, batch);
    
    // 更新目标网络
    if (this.stepCount - this.lastTargetUpdate >= this.config.targetUpdateFrequency) {
      this.updateTargetNetwork();
      this.lastTargetUpdate = this.stepCount;
    }

    // 更新指标
    this.updateMetrics(loss, currentQValues, targets);

    this.emit('network:trained', {
      step: this.stepCount,
      loss: loss,
      qValueMean: this.metrics.qValueMean,
      bufferSize: this.replayBuffer.size
    });
  }

  // ============================================================================
  // 神经网络实现
  // ============================================================================

  private createNetwork(name: string, config: DQNConfig, inputDim: number, outputDim: number): DQNModel {
    const architecture = this.buildArchitecture(config.networkArchitecture, inputDim, outputDim);
    const { weights, biases } = this.initializeWeights(architecture);
    
    const model: DQNModel = {
      id: `${name}_${Date.now()}`,
      name,
      architecture,
      weights,
      biases,
      inputDimension: inputDim,
      outputDimension: outputDim,
      activationFunctions: this.createActivationFunctions()
    };

    return model;
  }

  private buildArchitecture(layers: NetworkLayer[], inputDim: number, outputDim: number): NetworkLayer[] {
    const architecture: NetworkLayer[] = [];
    let currentDim = inputDim;

    // 输入层
    architecture.push({
      type: 'DENSE',
      units: inputDim,
      activation: 'linear'
    });

    // 隐藏层
    for (const layer of layers) {
      const layerUnits = layer.units || currentDim;
      architecture.push({
        ...layer,
        units: layerUnits
      });
      currentDim = layerUnits;
    }

    // 输出层
    if (this.config.duelingDQN) {
      // Dueling DQN: 分别计算状态值和优势值
      architecture.push({
        type: 'DENSE',
        units: 1,
        activation: 'linear' // 状态值流
      });
      architecture.push({
        type: 'DENSE',
        units: outputDim,
        activation: 'linear' // 优势值流
      });
    } else {
      // 标准DQN
      architecture.push({
        type: 'DENSE',
        units: outputDim,
        activation: 'linear'
      });
    }

    return architecture;
  }

  private initializeWeights(architecture: NetworkLayer[]): { weights: Float32Array[]; biases: Float32Array[] } {
    const weights: Float32Array[] = [];
    const biases: Float32Array[] = [];

    for (let i = 1; i < architecture.length; i++) {
      const prevLayerSize = architecture[i - 1].units!;
      const currentLayerSize = architecture[i].units!;

      // Xavier/Glorot 初始化
      const limit = Math.sqrt(6 / (prevLayerSize + currentLayerSize));
      const layerWeights = new Float32Array(prevLayerSize * currentLayerSize);
      
      for (let j = 0; j < layerWeights.length; j++) {
        layerWeights[j] = (Math.random() * 2 - 1) * limit;
      }

      const layerBiases = new Float32Array(currentLayerSize);
      layerBiases.fill(0); // 偏置初始化为0

      weights.push(layerWeights);
      biases.push(layerBiases);
    }

    return { weights, biases };
  }

  private createActivationFunctions(): Map<number, ActivationFunction> {
    const functions = new Map<number, ActivationFunction>();

    functions.set(0, {
      name: 'relu',
      forward: (x: number) => Math.max(0, x),
      backward: (x: number) => x > 0 ? 1 : 0
    });

    functions.set(1, {
      name: 'tanh',
      forward: (x: number) => Math.tanh(x),
      backward: (x: number) => 1 - Math.tanh(x) ** 2
    });

    functions.set(2, {
      name: 'sigmoid',
      forward: (x: number) => 1 / (1 + Math.exp(-x)),
      backward: (x: number) => {
        const s = 1 / (1 + Math.exp(-x));
        return s * (1 - s);
      }
    });

    functions.set(3, {
      name: 'linear',
      forward: (x: number) => x,
      backward: (x: number) => 1
    });

    return functions;
  }

  private forwardPass(network: DQNModel, input: Float32Array): LayerOutput {
    let currentValues = new Float32Array(input);
    let activations = new Float32Array(input);

    for (let layerIndex = 0; layerIndex < network.weights.length; layerIndex++) {
      const weights = network.weights[layerIndex];
      const biases = network.biases[layerIndex];
      const layerConfig = network.architecture[layerIndex + 1];
      
      const outputSize = layerConfig.units!;
      const inputSize = currentValues.length;
      
      const newValues = new Float32Array(outputSize);
      
      // 矩阵乘法: output = weights * input + bias
      for (let i = 0; i < outputSize; i++) {
        let sum = biases[i];
        for (let j = 0; j < inputSize; j++) {
          sum += weights[i * inputSize + j] * currentValues[j];
        }
        newValues[i] = sum;
      }

      // 应用激活函数
      const activationName = layerConfig.activation || 'relu';
      const activation = this.getActivationByName(activationName);
      
      for (let i = 0; i < newValues.length; i++) {
        activations[i] = activation.forward(newValues[i]);
      }

      currentValues = new Float32Array(activations);
    }

    // Dueling DQN 特殊处理
    if (this.config.duelingDQN && network.architecture.length >= 2) {
      return this.applyDuelingArchitecture(currentValues);
    }

    return {
      values: currentValues,
      activations: activations
    };
  }

  private applyDuelingArchitecture(values: Float32Array): LayerOutput {
    // 假设最后两层分别是状态值和优势值
    const stateValue = values[0]; // 状态值 V(s)
    const advantages = values.slice(1); // 优势值 A(s,a)
    
    // 计算优势值的平均值
    const avgAdvantage = advantages.reduce((sum, val) => sum + val, 0) / advantages.length;
    
    // Q(s,a) = V(s) + (A(s,a) - mean(A(s,a)))
    const qValues = new Float32Array(advantages.length);
    for (let i = 0; i < advantages.length; i++) {
      qValues[i] = stateValue + (advantages[i] - avgAdvantage);
    }

    return {
      values: qValues,
      activations: qValues
    };
  }

  // ============================================================================
  // 经验回放实现
  // ============================================================================

  private createReplayBuffer(config: DQNTrainingConfig): ExperienceReplayBuffer {
    const buffer: ExperienceReplayBuffer = {
      capacity: 100000, // 默认容量
      size: 0,
      experiences: [],
      isPrioritized: config.prioritizedReplay
    };

    if (config.prioritizedReplay) {
      buffer.priorities = new Float32Array(buffer.capacity);
      buffer.alpha = 0.6; // 优先级指数
      buffer.beta = 0.4;  // 重要性采样指数
      buffer.epsilon = 1e-6; // 平滑因子
    }

    return buffer;
  }

  private sampleBatch(): RLExperience[] {
    const batchSize = this.config.batchSize;
    const batch: RLExperience[] = [];

    if (this.replayBuffer.isPrioritized && this.replayBuffer.priorities) {
      // 优先级采样
      return this.prioritizedSample(batchSize);
    } else {
      // 均匀随机采样
      for (let i = 0; i < batchSize; i++) {
        const randomIndex = Math.floor(Math.random() * this.replayBuffer.size);
        batch.push(this.replayBuffer.experiences[randomIndex]);
      }
    }

    return batch;
  }

  private prioritizedSample(batchSize: number): RLExperience[] {
    const batch: RLExperience[] = [];
    const priorities = this.replayBuffer.priorities!;
    const alpha = this.replayBuffer.alpha!;
    
    // 计算优先级的累积分布
    const prioritySum = priorities.slice(0, this.replayBuffer.size).reduce((sum, p) => sum + Math.pow(p, alpha), 0);
    
    for (let i = 0; i < batchSize; i++) {
      const randomValue = Math.random() * prioritySum;
      let cumulativeProb = 0;
      let selectedIndex = 0;
      
      for (let j = 0; j < this.replayBuffer.size; j++) {
        cumulativeProb += Math.pow(priorities[j], alpha);
        if (randomValue <= cumulativeProb) {
          selectedIndex = j;
          break;
        }
      }
      
      batch.push(this.replayBuffer.experiences[selectedIndex]);
    }

    return batch;
  }

  // ============================================================================
  // 目标计算和损失函数
  // ============================================================================

  private async computeTargets(batch: RLExperience[]): Promise<Float32Array[]> {
    const targets: Float32Array[] = [];

    for (const experience of batch) {
      const currentStateVector = this.stateToVector(experience.state);
      const nextStateVector = this.stateToVector(experience.nextState);
      
      // 获取当前Q值
      const currentQ = this.forwardPass(this.mainNetwork, currentStateVector);
      
      // 获取下一状态的Q值
      let nextQ: number;
      
      if (this.config.doubleDQN) {
        // Double DQN: 使用主网络选择动作，目标网络计算Q值
        const nextQMain = this.forwardPass(this.mainNetwork, nextStateVector);
        const bestActionIndex = this.argMax(nextQMain.values);
        const nextQTarget = this.forwardPass(this.targetNetwork, nextStateVector);
        nextQ = nextQTarget.values[bestActionIndex];
      } else {
        // 标准DQN: 使用目标网络
        const nextQTarget = this.forwardPass(this.targetNetwork, nextStateVector);
        nextQ = Math.max(...Array.from(nextQTarget.values));
      }

      // 计算目标Q值: r + γ * max(Q'(s',a'))
      const discountFactor = 0.99;
      const targetValue = experience.reward.total + (experience.done ? 0 : discountFactor * nextQ);
      
      // 创建目标向量（只更新执行的动作对应的Q值）
      const target = new Float32Array(currentQ.values);
      const actionIndex = this.getActionIndex(experience.action);
      target[actionIndex] = targetValue;
      
      targets.push(target);
    }

    return targets;
  }

  private computeLoss(
    predictions: LayerOutput[], 
    targets: Float32Array[], 
    batch: RLExperience[]
  ): number {
    let totalLoss = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      const actionIndex = this.getActionIndex(batch[i].action);
      const predicted = predictions[i].values[actionIndex];
      const target = targets[i][actionIndex];
      
      // Huber损失（更稳定的训练）
      const error = target - predicted;
      const huberLoss = Math.abs(error) <= 1.0 ? 
        0.5 * error * error : 
        Math.abs(error) - 0.5;
      
      totalLoss += huberLoss;
    }

    return totalLoss / predictions.length;
  }

  // ============================================================================
  // 反向传播和权重更新
  // ============================================================================

  private async backwardPass(
    predictions: LayerOutput[], 
    targets: Float32Array[], 
    batch: RLExperience[]
  ): Promise<void> {
    // 计算输出层梯度
    const outputGradients: Float32Array[] = [];
    
    for (let i = 0; i < predictions.length; i++) {
      const actionIndex = this.getActionIndex(batch[i].action);
      const gradient = new Float32Array(predictions[i].values.length);
      
      // 只对执行的动作计算梯度
      const error = targets[i][actionIndex] - predictions[i].values[actionIndex];
      gradient[actionIndex] = -error; // 负号因为我们最小化损失
      
      outputGradients.push(gradient);
    }

    // 应用梯度并更新权重
    this.optimizer.updateWeights(this.mainNetwork, outputGradients);
    
    this.emit('network:weightsUpdated', {
      step: this.stepCount,
      gradientNorm: this.calculateGradientNorm(outputGradients)
    });
  }

  private updateTargetNetwork(): void {
    this.copyNetworkWeights(this.mainNetwork, this.targetNetwork);
    this.emit('network:targetUpdated', { step: this.stepCount });
  }

  private copyNetworkWeights(source: DQNModel, target: DQNModel): void {
    for (let i = 0; i < source.weights.length; i++) {
      target.weights[i] = new Float32Array(source.weights[i]);
      target.biases[i] = new Float32Array(source.biases[i]);
    }
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private stateToVector(state: RLState): Float32Array {
    return new Float32Array(state.features);
  }

  private getActionIndex(action: RLAction): number {
    // 简化实现：假设动作ID可以直接转换为索引
    return parseInt(action.id) || 0;
  }

  private findBestActionIndex(qValues: LayerOutput, availableActions: RLAction[]): number {
    let bestIndex = 0;
    let bestValue = qValues.values[0];
    
    for (let i = 1; i < Math.min(qValues.values.length, availableActions.length); i++) {
      if (qValues.values[i] > bestValue) {
        bestValue = qValues.values[i];
        bestIndex = i;
      }
    }
    
    return bestIndex;
  }

  private argMax(array: Float32Array): number {
    let maxIndex = 0;
    let maxValue = array[0];
    
    for (let i = 1; i < array.length; i++) {
      if (array[i] > maxValue) {
        maxValue = array[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }

  private getActivationByName(name: string): ActivationFunction {
    for (const [_, activation] of this.mainNetwork.activationFunctions) {
      if (activation.name === name) {
        return activation;
      }
    }
    return this.mainNetwork.activationFunctions.get(0)!; // 默认ReLU
  }

  private calculateTDError(experience: RLExperience): number {
    const stateVector = this.stateToVector(experience.state);
    const nextStateVector = this.stateToVector(experience.nextState);
    
    const currentQ = this.forwardPass(this.mainNetwork, stateVector);
    const nextQ = this.forwardPass(this.targetNetwork, nextStateVector);
    
    const actionIndex = this.getActionIndex(experience.action);
    const maxNextQ = Math.max(...Array.from(nextQ.values));
    
    const discountFactor = 0.99;
    const targetQ = experience.reward.total + (experience.done ? 0 : discountFactor * maxNextQ);
    
    return targetQ - currentQ.values[actionIndex];
  }

  private calculateGradientNorm(gradients: Float32Array[]): number {
    let norm = 0;
    for (const gradient of gradients) {
      for (const value of gradient) {
        norm += value * value;
      }
    }
    return Math.sqrt(norm);
  }

  private countNetworkParameters(network: DQNModel): number {
    let count = 0;
    for (const weights of network.weights) {
      count += weights.length;
    }
    for (const biases of network.biases) {
      count += biases.length;
    }
    return count;
  }

  // ============================================================================
  // 指标和统计
  // ============================================================================

  private initializeMetrics(): DQNMetrics {
    return {
      loss: 0,
      qValueMean: 0,
      qValueStd: 0,
      targetQMean: 0,
      gradientNorm: 0,
      replayBufferSize: 0,
      explorationRate: 1.0,
      learningProgress: []
    };
  }

  private updateMetrics(loss: number, predictions: LayerOutput[], targets: Float32Array[]): void {
    this.metrics.loss = loss;
    this.metrics.replayBufferSize = this.replayBuffer.size;
    
    // 计算Q值统计
    const qValues: number[] = [];
    for (const prediction of predictions) {
      qValues.push(...Array.from(prediction.values));
    }
    
    this.metrics.qValueMean = qValues.reduce((sum, val) => sum + val, 0) / qValues.length;
    const variance = qValues.reduce((sum, val) => sum + Math.pow(val - this.metrics.qValueMean, 2), 0) / qValues.length;
    this.metrics.qValueStd = Math.sqrt(variance);
    
    // 记录学习进度
    this.metrics.learningProgress.push(loss);
    if (this.metrics.learningProgress.length > 1000) {
      this.metrics.learningProgress.shift();
    }
  }

  public getMetrics(): DQNMetrics {
    return { ...this.metrics };
  }

  // ============================================================================
  // 模型保存和加载
  // ============================================================================

  public saveModel(): any {
    return {
      mainNetwork: this.serializeNetwork(this.mainNetwork),
      targetNetwork: this.serializeNetwork(this.targetNetwork),
      config: this.config,
      metrics: this.metrics,
      metadata: {
        stepCount: this.stepCount,
        episodeCount: this.episodeCount,
        saveTime: Date.now(),
        version: '1.0.0'
      }
    };
  }

  public loadModel(model: any): void {
    this.mainNetwork = this.deserializeNetwork(model.mainNetwork);
    this.targetNetwork = this.deserializeNetwork(model.targetNetwork);
    this.config = model.config;
    this.metrics = model.metrics;
    this.stepCount = model.metadata.stepCount;
    this.episodeCount = model.metadata.episodeCount;

    this.emit('model:loaded', {
      stepCount: this.stepCount,
      parameters: this.countNetworkParameters(this.mainNetwork)
    });
  }

  private serializeNetwork(network: DQNModel): any {
    return {
      id: network.id,
      name: network.name,
      architecture: network.architecture,
      weights: network.weights.map(w => Array.from(w)),
      biases: network.biases.map(b => Array.from(b)),
      inputDimension: network.inputDimension,
      outputDimension: network.outputDimension
    };
  }

  private deserializeNetwork(data: any): DQNModel {
    return {
      id: data.id,
      name: data.name,
      architecture: data.architecture,
      weights: data.weights.map((w: number[]) => new Float32Array(w)),
      biases: data.biases.map((b: number[]) => new Float32Array(b)),
      inputDimension: data.inputDimension,
      outputDimension: data.outputDimension,
      activationFunctions: this.createActivationFunctions()
    };
  }

  public reset(): void {
    this.stepCount = 0;
    this.episodeCount = 0;
    this.lastTargetUpdate = 0;
    this.replayBuffer.size = 0;
    this.replayBuffer.experiences = [];
    this.metrics = this.initializeMetrics();
    
    // 重新初始化网络权重
    const { weights, biases } = this.initializeWeights(this.mainNetwork.architecture);
    this.mainNetwork.weights = weights;
    this.mainNetwork.biases = biases;
    this.copyNetworkWeights(this.mainNetwork, this.targetNetwork);

    this.emit('agent:reset');
  }
}

// ============================================================================
// 优化器实现
// ============================================================================

export interface Optimizer {
  updateWeights(network: DQNModel, gradients: Float32Array[]): void;
  getConfig(): OptimizerConfig;
}

export class AdamOptimizer implements Optimizer {
  private config: OptimizerConfig;
  private momentum: Float32Array[] = [];
  private velocity: Float32Array[] = [];
  private step: number = 0;

  constructor(config: OptimizerConfig) {
    this.config = config;
  }

  public updateWeights(network: DQNModel, gradients: Float32Array[]): void {
    this.step++;
    const lr = this.config.learningRate;
    const beta1 = this.config.beta1 || 0.9;
    const beta2 = this.config.beta2 || 0.999;
    const epsilon = this.config.epsilon || 1e-8;

    // 初始化动量和速度向量
    if (this.momentum.length === 0) {
      for (let i = 0; i < network.weights.length; i++) {
        this.momentum.push(new Float32Array(network.weights[i].length));
        this.velocity.push(new Float32Array(network.weights[i].length));
      }
    }

    // Adam更新
    for (let layerIdx = 0; layerIdx < network.weights.length; layerIdx++) {
      const weights = network.weights[layerIdx];
      const gradient = gradients[layerIdx];
      const m = this.momentum[layerIdx];
      const v = this.velocity[layerIdx];

      for (let i = 0; i < weights.length; i++) {
        // 更新一阶矩估计
        m[i] = beta1 * m[i] + (1 - beta1) * gradient[i];
        
        // 更新二阶矩估计
        v[i] = beta2 * v[i] + (1 - beta2) * gradient[i] * gradient[i];
        
        // 偏差校正
        const mHat = m[i] / (1 - Math.pow(beta1, this.step));
        const vHat = v[i] / (1 - Math.pow(beta2, this.step));
        
        // 权重更新
        weights[i] -= lr * mHat / (Math.sqrt(vHat) + epsilon);
      }
    }
  }

  public getConfig(): OptimizerConfig {
    return { ...this.config };
  }
}

export function createOptimizer(config: OptimizerConfig): Optimizer {
  switch (config.type) {
    case 'ADAM':
      return new AdamOptimizer(config);
    default:
      throw new Error(`Optimizer type ${config.type} not implemented`);
  }
}