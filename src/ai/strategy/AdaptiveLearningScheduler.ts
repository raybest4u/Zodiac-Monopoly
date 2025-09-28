/**
 * 自适应学习率调度器
 * Adaptive Learning Rate Scheduler
 * 
 * 实现多种自适应学习率调度算法，优化深度学习训练过程
 */

import { EventEmitter } from '../../utils/EventEmitter';

// 调度器类型
export enum SchedulerType {
    STEP_DECAY = 'step_decay',
    EXPONENTIAL_DECAY = 'exponential_decay',
    COSINE_ANNEALING = 'cosine_annealing',
    REDUCE_ON_PLATEAU = 'reduce_on_plateau',
    CYCLIC_LR = 'cyclic_lr',
    ONE_CYCLE = 'one_cycle',
    WARM_RESTART = 'warm_restart',
    ADAPTIVE_MOMENTUM = 'adaptive_momentum',
    POLYNOMIAL_DECAY = 'polynomial_decay',
    NOAM_SCHEDULER = 'noam'
}

// 调度器配置
export interface SchedulerConfig {
    type: SchedulerType;
    initialLearningRate: number;
    parameters: SchedulerParameters;
    warmupSteps?: number;
    minLearningRate?: number;
    maxLearningRate?: number;
    patience?: number;
    factor?: number;
    verbose?: boolean;
}

// 调度器参数
export interface SchedulerParameters {
    [key: string]: any;
    
    // Step Decay
    stepSize?: number;
    gamma?: number;
    
    // Exponential Decay
    decayRate?: number;
    
    // Cosine Annealing
    T_max?: number;
    eta_min?: number;
    
    // Reduce on Plateau
    mode?: 'min' | 'max';
    threshold?: number;
    threshold_mode?: 'rel' | 'abs';
    cooldown?: number;
    
    // Cyclic LR
    base_lr?: number;
    max_lr?: number;
    step_size_up?: number;
    step_size_down?: number;
    mode_cyclic?: 'triangular' | 'triangular2' | 'exp_range';
    
    // One Cycle
    max_lr_one_cycle?: number;
    total_steps?: number;
    pct_start?: number;
    anneal_strategy?: 'cos' | 'linear';
    
    // Warm Restart
    T_0?: number;
    T_mult?: number;
    
    // Polynomial Decay
    power?: number;
    end_learning_rate?: number;
    
    // Noam Scheduler
    model_size?: number;
    warmup_steps?: number;
}

// 学习率历史记录
export interface LearningRateHistory {
    step: number;
    epoch: number;
    learningRate: number;
    loss?: number;
    metric?: number;
    timestamp: number;
}

// 调度器状态
export interface SchedulerState {
    currentStep: number;
    currentEpoch: number;
    currentLearningRate: number;
    bestMetric: number;
    plateauCount: number;
    cyclePosition: number;
    lastRestart: number;
    isWarmup: boolean;
}

// 性能指标
export interface PerformanceMetrics {
    convergenceSpeed: number;
    finalLoss: number;
    stabilityScore: number;
    overfittingRisk: number;
    learningEfficiency: number;
}

// 自适应学习率调度器主类
export class AdaptiveLearningScheduler extends EventEmitter {
    private config: SchedulerConfig;
    private state: SchedulerState;
    private history: LearningRateHistory[];
    private performance: PerformanceMetrics;
    private isActive: boolean;
    
    constructor(config: SchedulerConfig) {
        super();
        this.config = config;
        this.history = [];
        this.isActive = true;
        
        this.initializeState();
        this.initializePerformanceMetrics();
    }
    
    // 初始化状态
    private initializeState(): void {
        this.state = {
            currentStep: 0,
            currentEpoch: 0,
            currentLearningRate: this.config.initialLearningRate,
            bestMetric: this.config.parameters.mode === 'min' ? Infinity : -Infinity,
            plateauCount: 0,
            cyclePosition: 0,
            lastRestart: 0,
            isWarmup: (this.config.warmupSteps || 0) > 0
        };
    }
    
    // 初始化性能指标
    private initializePerformanceMetrics(): void {
        this.performance = {
            convergenceSpeed: 0,
            finalLoss: Infinity,
            stabilityScore: 0,
            overfittingRisk: 0,
            learningEfficiency: 0
        };
    }
    
    // 获取当前学习率
    getCurrentLearningRate(): number {
        return this.state.currentLearningRate;
    }
    
    // 步骤更新
    step(loss?: number, metric?: number): number {
        if (!this.isActive) return this.state.currentLearningRate;
        
        this.state.currentStep++;
        
        // 处理预热阶段
        if (this.state.isWarmup && this.config.warmupSteps) {
            if (this.state.currentStep <= this.config.warmupSteps) {
                this.state.currentLearningRate = this.calculateWarmupLR();
            } else {
                this.state.isWarmup = false;
            }
        } else {
            // 根据调度器类型更新学习率
            this.state.currentLearningRate = this.calculateLearningRate(loss, metric);
        }
        
        // 应用边界限制
        this.applyBounds();
        
        // 记录历史
        this.recordHistory(loss, metric);
        
        // 更新性能指标
        this.updatePerformanceMetrics(loss, metric);
        
        // 发出事件
        this.emit('learning_rate_updated', {
            step: this.state.currentStep,
            learningRate: this.state.currentLearningRate,
            loss,
            metric
        });
        
        return this.state.currentLearningRate;
    }
    
    // 周期更新
    epochStep(epoch: number, loss?: number, metric?: number): number {
        this.state.currentEpoch = epoch;
        
        // 某些调度器需要周期级别的更新
        if (this.config.type === SchedulerType.REDUCE_ON_PLATEAU) {
            this.handleReduceOnPlateau(metric || loss);
        }
        
        this.emit('epoch_completed', {
            epoch,
            learningRate: this.state.currentLearningRate,
            loss,
            metric
        });
        
        return this.step(loss, metric);
    }
    
    // 计算预热学习率
    private calculateWarmupLR(): number {
        const warmupProgress = this.state.currentStep / this.config.warmupSteps!;
        return this.config.initialLearningRate * warmupProgress;
    }
    
    // 计算学习率
    private calculateLearningRate(loss?: number, metric?: number): number {
        switch (this.config.type) {
            case SchedulerType.STEP_DECAY:
                return this.calculateStepDecay();
            
            case SchedulerType.EXPONENTIAL_DECAY:
                return this.calculateExponentialDecay();
            
            case SchedulerType.COSINE_ANNEALING:
                return this.calculateCosineAnnealing();
            
            case SchedulerType.REDUCE_ON_PLATEAU:
                return this.state.currentLearningRate; // 在epochStep中处理
            
            case SchedulerType.CYCLIC_LR:
                return this.calculateCyclicLR();
            
            case SchedulerType.ONE_CYCLE:
                return this.calculateOneCycle();
            
            case SchedulerType.WARM_RESTART:
                return this.calculateWarmRestart();
            
            case SchedulerType.POLYNOMIAL_DECAY:
                return this.calculatePolynomialDecay();
            
            case SchedulerType.NOAM_SCHEDULER:
                return this.calculateNoamScheduler();
            
            case SchedulerType.ADAPTIVE_MOMENTUM:
                return this.calculateAdaptiveMomentum(loss, metric);
            
            default:
                return this.state.currentLearningRate;
        }
    }
    
    // 阶梯衰减
    private calculateStepDecay(): number {
        const stepSize = this.config.parameters.stepSize || 100;
        const gamma = this.config.parameters.gamma || 0.1;
        
        const decayCount = Math.floor(this.state.currentStep / stepSize);
        return this.config.initialLearningRate * Math.pow(gamma, decayCount);
    }
    
    // 指数衰减
    private calculateExponentialDecay(): number {
        const decayRate = this.config.parameters.decayRate || 0.96;
        return this.config.initialLearningRate * Math.pow(decayRate, this.state.currentStep);
    }
    
    // 余弦退火
    private calculateCosineAnnealing(): number {
        const T_max = this.config.parameters.T_max || 100;
        const eta_min = this.config.parameters.eta_min || 0;
        
        const progress = (this.state.currentStep % T_max) / T_max;
        const cosine = (1 + Math.cos(Math.PI * progress)) / 2;
        
        return eta_min + (this.config.initialLearningRate - eta_min) * cosine;
    }
    
    // 平台降低
    private handleReduceOnPlateau(metric?: number): void {
        if (metric === undefined) return;
        
        const mode = this.config.parameters.mode || 'min';
        const threshold = this.config.parameters.threshold || 1e-4;
        const patience = this.config.patience || 10;
        const factor = this.config.factor || 0.1;
        
        let improved = false;
        
        if (mode === 'min') {
            improved = metric < this.state.bestMetric - threshold;
        } else {
            improved = metric > this.state.bestMetric + threshold;
        }
        
        if (improved) {
            this.state.bestMetric = metric;
            this.state.plateauCount = 0;
        } else {
            this.state.plateauCount++;
            
            if (this.state.plateauCount >= patience) {
                this.state.currentLearningRate *= factor;
                this.state.plateauCount = 0;
                
                this.emit('plateau_detected', {
                    newLearningRate: this.state.currentLearningRate,
                    metric,
                    bestMetric: this.state.bestMetric
                });
            }
        }
    }
    
    // 循环学习率
    private calculateCyclicLR(): number {
        const base_lr = this.config.parameters.base_lr || this.config.minLearningRate || 0.001;
        const max_lr = this.config.parameters.max_lr || this.config.maxLearningRate || 0.01;
        const step_size_up = this.config.parameters.step_size_up || 100;
        const step_size_down = this.config.parameters.step_size_down || step_size_up;
        const mode = this.config.parameters.mode_cyclic || 'triangular';
        
        const cycle_length = step_size_up + step_size_down;
        const cycle_position = this.state.currentStep % cycle_length;
        
        let scale_factor = 1.0;
        
        if (cycle_position <= step_size_up) {
            // 上升阶段
            const progress = cycle_position / step_size_up;
            scale_factor = progress;
        } else {
            // 下降阶段
            const progress = (cycle_position - step_size_up) / step_size_down;
            scale_factor = 1.0 - progress;
        }
        
        // 应用模式
        switch (mode) {
            case 'triangular2':
                scale_factor *= Math.pow(0.5, Math.floor(this.state.currentStep / cycle_length));
                break;
            case 'exp_range':
                scale_factor *= Math.pow(0.99994, this.state.currentStep);
                break;
        }
        
        return base_lr + (max_lr - base_lr) * scale_factor;
    }
    
    // 单周期学习率
    private calculateOneCycle(): number {
        const max_lr = this.config.parameters.max_lr_one_cycle || this.config.maxLearningRate || 0.01;
        const total_steps = this.config.parameters.total_steps || 1000;
        const pct_start = this.config.parameters.pct_start || 0.3;
        const anneal_strategy = this.config.parameters.anneal_strategy || 'cos';
        
        const step_up = Math.floor(total_steps * pct_start);
        const step_down = total_steps - step_up;
        
        if (this.state.currentStep <= step_up) {
            // 上升阶段
            const progress = this.state.currentStep / step_up;
            return this.config.initialLearningRate + 
                   (max_lr - this.config.initialLearningRate) * progress;
        } else {
            // 下降阶段
            const progress = (this.state.currentStep - step_up) / step_down;
            
            if (anneal_strategy === 'cos') {
                const cosine = (1 + Math.cos(Math.PI * progress)) / 2;
                return (this.config.minLearningRate || 0) + 
                       (max_lr - (this.config.minLearningRate || 0)) * cosine;
            } else {
                return max_lr - (max_lr - (this.config.minLearningRate || 0)) * progress;
            }
        }
    }
    
    // 热重启余弦退火
    private calculateWarmRestart(): number {
        const T_0 = this.config.parameters.T_0 || 10;
        const T_mult = this.config.parameters.T_mult || 2;
        const eta_min = this.config.parameters.eta_min || 0;
        
        let T_cur = this.state.currentStep - this.state.lastRestart;
        let T_i = T_0;
        let epoch_in_cycle = 0;
        
        // 找到当前周期
        while (T_cur >= T_i) {
            T_cur -= T_i;
            this.state.lastRestart += T_i;
            T_i *= T_mult;
            epoch_in_cycle++;
        }
        
        const progress = T_cur / T_i;
        const cosine = (1 + Math.cos(Math.PI * progress)) / 2;
        
        return eta_min + (this.config.initialLearningRate - eta_min) * cosine;
    }
    
    // 多项式衰减
    private calculatePolynomialDecay(): number {
        const power = this.config.parameters.power || 1.0;
        const end_lr = this.config.parameters.end_learning_rate || 0.0001;
        const decay_steps = this.config.parameters.total_steps || 1000;
        
        if (this.state.currentStep >= decay_steps) {
            return end_lr;
        }
        
        const decay_factor = Math.pow(1 - this.state.currentStep / decay_steps, power);
        return (this.config.initialLearningRate - end_lr) * decay_factor + end_lr;
    }
    
    // Noam调度器（Transformer论文中使用）
    private calculateNoamScheduler(): number {
        const model_size = this.config.parameters.model_size || 512;
        const warmup_steps = this.config.parameters.warmup_steps || 4000;
        
        const step = Math.max(this.state.currentStep, 1);
        const scale = Math.pow(model_size, -0.5);
        const warmup = Math.min(step * Math.pow(warmup_steps, -1.5), Math.pow(step, -0.5));
        
        return scale * warmup;
    }
    
    // 自适应动量调度
    private calculateAdaptiveMomentum(loss?: number, metric?: number): number {
        if (this.history.length < 2) {
            return this.state.currentLearningRate;
        }
        
        const recent = this.history.slice(-5);
        const losses = recent.map(h => h.loss || Infinity).filter(l => l !== Infinity);
        
        if (losses.length < 2) {
            return this.state.currentLearningRate;
        }
        
        // 计算损失变化趋势
        const recentTrend = this.calculateTrend(losses);
        const volatility = this.calculateVolatility(losses);
        
        let adjustment = 1.0;
        
        if (recentTrend > 0) {
            // 损失增加，降低学习率
            adjustment = 0.8;
        } else if (recentTrend < -0.01) {
            // 损失快速下降，可以提高学习率
            adjustment = 1.1;
        }
        
        // 考虑波动性
        if (volatility > 0.1) {
            adjustment *= 0.9; // 高波动时更保守
        }
        
        return this.state.currentLearningRate * adjustment;
    }
    
    // 计算趋势
    private calculateTrend(values: number[]): number {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }
    
    // 计算波动性
    private calculateVolatility(values: number[]): number {
        if (values.length < 2) return 0;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        return Math.sqrt(variance) / mean;
    }
    
    // 应用边界限制
    private applyBounds(): void {
        if (this.config.minLearningRate !== undefined) {
            this.state.currentLearningRate = Math.max(
                this.state.currentLearningRate,
                this.config.minLearningRate
            );
        }
        
        if (this.config.maxLearningRate !== undefined) {
            this.state.currentLearningRate = Math.min(
                this.state.currentLearningRate,
                this.config.maxLearningRate
            );
        }
    }
    
    // 记录历史
    private recordHistory(loss?: number, metric?: number): void {
        this.history.push({
            step: this.state.currentStep,
            epoch: this.state.currentEpoch,
            learningRate: this.state.currentLearningRate,
            loss,
            metric,
            timestamp: Date.now()
        });
        
        // 限制历史记录长度
        if (this.history.length > 10000) {
            this.history = this.history.slice(-5000);
        }
    }
    
    // 更新性能指标
    private updatePerformanceMetrics(loss?: number, metric?: number): void {
        if (loss !== undefined) {
            this.performance.finalLoss = loss;
            
            // 计算收敛速度
            if (this.history.length > 10) {
                const recentLosses = this.history.slice(-10).map(h => h.loss || Infinity);
                const improvement = recentLosses[0] - recentLosses[recentLosses.length - 1];
                this.performance.convergenceSpeed = improvement / 10;
            }
            
            // 计算稳定性
            if (this.history.length > 20) {
                const recentLosses = this.history.slice(-20).map(h => h.loss || Infinity);
                const volatility = this.calculateVolatility(recentLosses.filter(l => l !== Infinity));
                this.performance.stabilityScore = 1 / (1 + volatility);
            }
        }
        
        // 计算学习效率
        const totalSteps = this.state.currentStep;
        const totalImprovement = this.config.initialLearningRate - this.state.currentLearningRate;
        this.performance.learningEfficiency = totalImprovement / totalSteps;
    }
    
    // 获取状态
    getState(): SchedulerState {
        return { ...this.state };
    }
    
    // 获取历史
    getHistory(): LearningRateHistory[] {
        return [...this.history];
    }
    
    // 获取性能指标
    getPerformanceMetrics(): PerformanceMetrics {
        return { ...this.performance };
    }
    
    // 重置调度器
    reset(): void {
        this.initializeState();
        this.history = [];
        this.initializePerformanceMetrics();
        
        this.emit('scheduler_reset');
    }
    
    // 暂停调度器
    pause(): void {
        this.isActive = false;
        this.emit('scheduler_paused');
    }
    
    // 恢复调度器
    resume(): void {
        this.isActive = true;
        this.emit('scheduler_resumed');
    }
    
    // 设置学习率
    setLearningRate(lr: number): void {
        this.state.currentLearningRate = lr;
        this.applyBounds();
        
        this.emit('learning_rate_set', { learningRate: lr });
    }
    
    // 获取调度器信息
    getSchedulerInfo(): any {
        return {
            type: this.config.type,
            currentLR: this.state.currentLearningRate,
            step: this.state.currentStep,
            epoch: this.state.currentEpoch,
            isActive: this.isActive,
            performance: this.performance
        };
    }
    
    // 预测未来学习率
    predictFutureLR(steps: number): number[] {
        const futureLRs: number[] = [];
        const originalState = { ...this.state };
        
        for (let i = 1; i <= steps; i++) {
            this.state.currentStep = originalState.currentStep + i;
            const futureLR = this.calculateLearningRate();
            futureLRs.push(futureLR);
        }
        
        // 恢复原始状态
        this.state = originalState;
        
        return futureLRs;
    }
    
    // 自动调优
    autoTune(performanceHistory: number[], targetImprovement: number): SchedulerConfig {
        // 基于性能历史自动调整参数
        const currentPerformance = this.performance.convergenceSpeed;
        
        let newConfig = { ...this.config };
        
        if (currentPerformance < targetImprovement) {
            // 性能不达标，调整参数
            switch (this.config.type) {
                case SchedulerType.STEP_DECAY:
                    newConfig.parameters.gamma = Math.max(0.05, (newConfig.parameters.gamma || 0.1) * 0.8);
                    break;
                    
                case SchedulerType.EXPONENTIAL_DECAY:
                    newConfig.parameters.decayRate = Math.max(0.9, (newConfig.parameters.decayRate || 0.96) * 0.98);
                    break;
                    
                case SchedulerType.CYCLIC_LR:
                    const currentRange = (newConfig.parameters.max_lr || 0.01) - (newConfig.parameters.base_lr || 0.001);
                    newConfig.parameters.max_lr = (newConfig.parameters.max_lr || 0.01) + currentRange * 0.2;
                    break;
            }
        }
        
        this.emit('auto_tuned', { oldConfig: this.config, newConfig });
        
        return newConfig;
    }
    
    // 保存调度器状态
    saveState(): string {
        const stateData = {
            config: this.config,
            state: this.state,
            history: this.history.slice(-1000), // 保存最近1000个记录
            performance: this.performance,
            timestamp: Date.now()
        };
        
        return JSON.stringify(stateData);
    }
    
    // 加载调度器状态
    loadState(stateJson: string): void {
        try {
            const stateData = JSON.parse(stateJson);
            
            this.config = stateData.config;
            this.state = stateData.state;
            this.history = stateData.history || [];
            this.performance = stateData.performance || this.performance;
            
            this.emit('state_loaded');
        } catch (error) {
            this.emit('state_load_error', error);
            throw error;
        }
    }
}