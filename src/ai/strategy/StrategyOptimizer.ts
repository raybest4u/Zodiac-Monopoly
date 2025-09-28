/**
 * 策略优化算法
 * Strategy Optimization Algorithms
 * 
 * 实现高级策略优化算法，包括遗传算法、粒子群优化、模拟退火等
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { 
    StrategyInput, 
    StrategyEvaluation, 
    StrategyOptimization,
    OptimizedStrategy,
    StrategicAction,
    ResourceAllocation,
    ContingencyPlan,
    RiskMitigation,
    PerformancePrediction,
    AdaptiveAdjustment
} from './DeepStrategyNetwork';

// 优化算法类型
export enum OptimizationAlgorithm {
    GENETIC_ALGORITHM = 'genetic',
    PARTICLE_SWARM = 'pso',
    SIMULATED_ANNEALING = 'sa',
    DIFFERENTIAL_EVOLUTION = 'de',
    BAYESIAN_OPTIMIZATION = 'bo',
    GRADIENT_DESCENT = 'gd',
    EVOLUTIONARY_STRATEGY = 'es',
    MULTI_OBJECTIVE = 'nsga2'
}

// 优化配置
export interface OptimizationConfig {
    algorithm: OptimizationAlgorithm;
    populationSize: number;
    generations: number;
    mutationRate: number;
    crossoverRate: number;
    eliteRatio: number;
    convergenceThreshold: number;
    maxIterations: number;
    objectiveWeights: ObjectiveWeights;
    constraints: OptimizationConstraints;
}

// 目标权重
export interface ObjectiveWeights {
    profitability: number;
    riskMinimization: number;
    timeEfficiency: number;
    resourceUtilization: number;
    competitiveAdvantage: number;
    sustainability: number;
    adaptability: number;
}

// 优化约束
export interface OptimizationConstraints {
    maxRisk: number;
    minReturn: number;
    resourceLimits: ResourceLimits;
    timeLimits: TimeLimits;
    legalConstraints: string[];
    gameRuleConstraints: string[];
}

// 资源限制
export interface ResourceLimits {
    maxCashUsage: number;
    maxPropertyCount: number;
    maxDevelopmentCost: number;
    reserveRequirement: number;
}

// 时间限制
export interface TimeLimits {
    maxDecisionTime: number;
    planningHorizon: number;
    evaluationPeriod: number;
}

// 策略基因
export interface StrategyGene {
    id: string;
    actions: StrategicAction[];
    parameters: StrategyParameters;
    fitness: number;
    objectives: ObjectiveScores;
    generation: number;
}

// 策略参数
export interface StrategyParameters {
    aggressiveness: number;
    riskTolerance: number;
    cooperationLevel: number;
    timeHorizon: number;
    resourceAllocation: ResourceAllocation;
    adaptationSpeed: number;
    learningRate: number;
}

// 目标分数
export interface ObjectiveScores {
    profitability: number;
    risk: number;
    efficiency: number;
    competitiveness: number;
    sustainability: number;
    adaptability: number;
    overall: number;
}

// 粒子（PSO用）
export interface Particle {
    id: string;
    position: StrategyParameters;
    velocity: StrategyParameters;
    bestPosition: StrategyParameters;
    bestFitness: number;
    currentFitness: number;
}

// 优化结果
export interface OptimizationResult {
    bestStrategy: OptimizedStrategy;
    convergenceHistory: ConvergencePoint[];
    finalFitness: number;
    iterationsUsed: number;
    executionTime: number;
    paretoFront?: StrategyGene[];
    statistics: OptimizationStatistics;
}

// 收敛点
export interface ConvergencePoint {
    iteration: number;
    bestFitness: number;
    averageFitness: number;
    diversity: number;
    timestamp: number;
}

// 优化统计
export interface OptimizationStatistics {
    totalEvaluations: number;
    convergenceRate: number;
    diversityMaintained: number;
    constraintViolations: number;
    improvedSolutions: number;
}

// 主策略优化器类
export class AdvancedStrategyOptimizer extends EventEmitter {
    private config: OptimizationConfig;
    private population: StrategyGene[];
    private globalBest: StrategyGene | null;
    private convergenceHistory: ConvergencePoint[];
    private currentGeneration: number;
    private evaluationCount: number;
    private startTime: number;
    
    constructor(config: OptimizationConfig) {
        super();
        this.config = config;
        this.population = [];
        this.globalBest = null;
        this.convergenceHistory = [];
        this.currentGeneration = 0;
        this.evaluationCount = 0;
        this.startTime = 0;
    }
    
    // 主优化方法
    async optimize(
        initialStrategy: StrategyInput,
        evaluationFunction: (gene: StrategyGene) => Promise<ObjectiveScores>
    ): Promise<OptimizationResult> {
        this.startTime = Date.now();
        this.currentGeneration = 0;
        this.evaluationCount = 0;
        this.convergenceHistory = [];
        
        this.emit('optimization_started', {
            algorithm: this.config.algorithm,
            populationSize: this.config.populationSize,
            generations: this.config.generations
        });
        
        try {
            // 初始化种群
            await this.initializePopulation(initialStrategy);
            
            // 评估初始种群
            await this.evaluatePopulation(evaluationFunction);
            
            // 根据算法类型执行优化
            switch (this.config.algorithm) {
                case OptimizationAlgorithm.GENETIC_ALGORITHM:
                    return await this.runGeneticAlgorithm(evaluationFunction);
                case OptimizationAlgorithm.PARTICLE_SWARM:
                    return await this.runParticleSwarmOptimization(evaluationFunction);
                case OptimizationAlgorithm.SIMULATED_ANNEALING:
                    return await this.runSimulatedAnnealing(evaluationFunction);
                case OptimizationAlgorithm.DIFFERENTIAL_EVOLUTION:
                    return await this.runDifferentialEvolution(evaluationFunction);
                case OptimizationAlgorithm.BAYESIAN_OPTIMIZATION:
                    return await this.runBayesianOptimization(evaluationFunction);
                case OptimizationAlgorithm.MULTI_OBJECTIVE:
                    return await this.runNSGA2(evaluationFunction);
                default:
                    return await this.runGeneticAlgorithm(evaluationFunction);
            }
        } catch (error) {
            this.emit('optimization_error', error);
            throw error;
        }
    }
    
    // 初始化种群
    private async initializePopulation(initialStrategy: StrategyInput): Promise<void> {
        this.population = [];
        
        for (let i = 0; i < this.config.populationSize; i++) {
            const gene = this.createRandomGene(initialStrategy, i);
            this.population.push(gene);
        }
        
        this.emit('population_initialized', { size: this.population.length });
    }
    
    // 创建随机基因
    private createRandomGene(baseStrategy: StrategyInput, index: number): StrategyGene {
        const actions = this.generateRandomActions();
        const parameters = this.generateRandomParameters();
        
        return {
            id: `gene_${index}_${Date.now()}`,
            actions,
            parameters,
            fitness: 0,
            objectives: {
                profitability: 0,
                risk: 0,
                efficiency: 0,
                competitiveness: 0,
                sustainability: 0,
                adaptability: 0,
                overall: 0
            },
            generation: 0
        };
    }
    
    // 生成随机动作
    private generateRandomActions(): StrategicAction[] {
        const actionTypes: Array<StrategicAction['type']> = [
            'acquire', 'develop', 'trade', 'defend', 'attack', 'cooperate', 'skill_use'
        ];
        
        const actionCount = Math.floor(Math.random() * 5) + 3; // 3-7个动作
        const actions: StrategicAction[] = [];
        
        for (let i = 0; i < actionCount; i++) {
            const type = actionTypes[Math.floor(Math.random() * actionTypes.length)];
            const action: StrategicAction = {
                type,
                priority: Math.random(),
                expectedValue: Math.random() * 1000,
                riskLevel: Math.random(),
                timeframe: ['immediate', 'short', 'medium', 'long'][Math.floor(Math.random() * 4)] as any,
                dependencies: [],
                alternatives: []
            };
            
            actions.push(action);
        }
        
        return actions.sort((a, b) => b.priority - a.priority);
    }
    
    // 生成随机参数
    private generateRandomParameters(): StrategyParameters {
        return {
            aggressiveness: Math.random(),
            riskTolerance: Math.random(),
            cooperationLevel: Math.random(),
            timeHorizon: Math.random() * 100 + 10,
            resourceAllocation: {
                cashReserve: Math.random() * 0.5,
                investmentBudget: Math.random() * 0.8,
                developmentFund: Math.random() * 0.6,
                riskBuffer: Math.random() * 0.3,
                opportunityFund: Math.random() * 0.4
            },
            adaptationSpeed: Math.random(),
            learningRate: Math.random() * 0.1 + 0.01
        };
    }
    
    // 评估种群
    private async evaluatePopulation(
        evaluationFunction: (gene: StrategyGene) => Promise<ObjectiveScores>
    ): Promise<void> {
        const evaluationPromises = this.population.map(async (gene) => {
            const scores = await evaluationFunction(gene);
            gene.objectives = scores;
            gene.fitness = this.calculateFitness(scores);
            this.evaluationCount++;
            return gene;
        });
        
        await Promise.all(evaluationPromises);
        
        // 更新全局最佳
        this.updateGlobalBest();
        
        // 记录收敛点
        this.recordConvergencePoint();
    }
    
    // 计算适应度
    private calculateFitness(objectives: ObjectiveScores): number {
        const weights = this.config.objectiveWeights;
        
        return (
            weights.profitability * objectives.profitability +
            weights.riskMinimization * (1 - objectives.risk) +
            weights.timeEfficiency * objectives.efficiency +
            weights.resourceUtilization * objectives.competitiveness +
            weights.competitiveAdvantage * objectives.sustainability +
            weights.sustainability * objectives.adaptability +
            weights.adaptability * objectives.overall
        );
    }
    
    // 遗传算法实现
    private async runGeneticAlgorithm(
        evaluationFunction: (gene: StrategyGene) => Promise<ObjectiveScores>
    ): Promise<OptimizationResult> {
        
        for (let generation = 0; generation < this.config.generations; generation++) {
            this.currentGeneration = generation;
            
            // 选择
            const parents = this.selection();
            
            // 交叉
            const offspring = this.crossover(parents);
            
            // 变异
            this.mutation(offspring);
            
            // 合并种群
            this.population = [...parents, ...offspring];
            
            // 评估新个体
            await this.evaluatePopulation(evaluationFunction);
            
            // 环境选择
            this.environmentalSelection();
            
            // 检查收敛
            if (this.checkConvergence()) {
                console.log(`Converged at generation ${generation}`);
                break;
            }
            
            this.emit('generation_completed', {
                generation,
                bestFitness: this.globalBest?.fitness || 0,
                averageFitness: this.calculateAverageFitness()
            });
        }
        
        return this.createOptimizationResult();
    }
    
    // 选择操作
    private selection(): StrategyGene[] {
        const eliteCount = Math.floor(this.config.populationSize * this.config.eliteRatio);
        const tournamentSize = 3;
        
        // 精英保留
        const sortedPopulation = [...this.population].sort((a, b) => b.fitness - a.fitness);
        const elite = sortedPopulation.slice(0, eliteCount);
        
        // 锦标赛选择
        const selected: StrategyGene[] = [...elite];
        
        while (selected.length < this.config.populationSize) {
            const tournament = [];
            for (let i = 0; i < tournamentSize; i++) {
                const randomIndex = Math.floor(Math.random() * this.population.length);
                tournament.push(this.population[randomIndex]);
            }
            
            tournament.sort((a, b) => b.fitness - a.fitness);
            selected.push(this.cloneGene(tournament[0]));
        }
        
        return selected;
    }
    
    // 交叉操作
    private crossover(parents: StrategyGene[]): StrategyGene[] {
        const offspring: StrategyGene[] = [];
        
        for (let i = 0; i < parents.length - 1; i += 2) {
            if (Math.random() < this.config.crossoverRate) {
                const [child1, child2] = this.singlePointCrossover(parents[i], parents[i + 1]);
                offspring.push(child1, child2);
            } else {
                offspring.push(this.cloneGene(parents[i]), this.cloneGene(parents[i + 1]));
            }
        }
        
        return offspring;
    }
    
    // 单点交叉
    private singlePointCrossover(parent1: StrategyGene, parent2: StrategyGene): [StrategyGene, StrategyGene] {
        const crossoverPoint = Math.floor(Math.random() * parent1.actions.length);
        
        const child1 = this.cloneGene(parent1);
        const child2 = this.cloneGene(parent2);
        
        // 交换动作
        const temp1 = child1.actions.slice(crossoverPoint);
        const temp2 = child2.actions.slice(crossoverPoint);
        
        child1.actions = [...child1.actions.slice(0, crossoverPoint), ...temp2];
        child2.actions = [...child2.actions.slice(0, crossoverPoint), ...temp1];
        
        // 交换参数（均匀交叉）
        if (Math.random() < 0.5) {
            [child1.parameters.aggressiveness, child2.parameters.aggressiveness] = 
            [child2.parameters.aggressiveness, child1.parameters.aggressiveness];
        }
        
        if (Math.random() < 0.5) {
            [child1.parameters.riskTolerance, child2.parameters.riskTolerance] = 
            [child2.parameters.riskTolerance, child1.parameters.riskTolerance];
        }
        
        child1.id = `gene_cross_${Date.now()}_1`;
        child2.id = `gene_cross_${Date.now()}_2`;
        child1.generation = this.currentGeneration;
        child2.generation = this.currentGeneration;
        
        return [child1, child2];
    }
    
    // 变异操作
    private mutation(offspring: StrategyGene[]): void {
        offspring.forEach(gene => {
            if (Math.random() < this.config.mutationRate) {
                this.mutateGene(gene);
            }
        });
    }
    
    // 基因变异
    private mutateGene(gene: StrategyGene): void {
        // 参数变异
        if (Math.random() < 0.3) {
            gene.parameters.aggressiveness += (Math.random() - 0.5) * 0.2;
            gene.parameters.aggressiveness = Math.max(0, Math.min(1, gene.parameters.aggressiveness));
        }
        
        if (Math.random() < 0.3) {
            gene.parameters.riskTolerance += (Math.random() - 0.5) * 0.2;
            gene.parameters.riskTolerance = Math.max(0, Math.min(1, gene.parameters.riskTolerance));
        }
        
        if (Math.random() < 0.3) {
            gene.parameters.cooperationLevel += (Math.random() - 0.5) * 0.2;
            gene.parameters.cooperationLevel = Math.max(0, Math.min(1, gene.parameters.cooperationLevel));
        }
        
        // 动作变异
        if (Math.random() < 0.2 && gene.actions.length > 0) {
            const randomIndex = Math.floor(Math.random() * gene.actions.length);
            gene.actions[randomIndex].priority += (Math.random() - 0.5) * 0.4;
            gene.actions[randomIndex].priority = Math.max(0, Math.min(1, gene.actions[randomIndex].priority));
        }
        
        // 添加新动作
        if (Math.random() < 0.1) {
            const newActions = this.generateRandomActions();
            if (newActions.length > 0) {
                gene.actions.push(newActions[0]);
            }
        }
        
        // 删除动作
        if (Math.random() < 0.1 && gene.actions.length > 2) {
            gene.actions.splice(Math.floor(Math.random() * gene.actions.length), 1);
        }
        
        gene.id = `gene_mut_${Date.now()}`;
    }
    
    // 环境选择
    private environmentalSelection(): void {
        // 根据适应度排序并保留最佳个体
        this.population.sort((a, b) => b.fitness - a.fitness);
        this.population = this.population.slice(0, this.config.populationSize);
    }
    
    // 粒子群优化实现
    private async runParticleSwarmOptimization(
        evaluationFunction: (gene: StrategyGene) => Promise<ObjectiveScores>
    ): Promise<OptimizationResult> {
        const particles: Particle[] = this.initializeParticles();
        let globalBestPosition: StrategyParameters | null = null;
        let globalBestFitness = -Infinity;
        
        for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
            // 评估粒子
            for (const particle of particles) {
                const gene = this.particleToGene(particle);
                const scores = await evaluationFunction(gene);
                const fitness = this.calculateFitness(scores);
                
                particle.currentFitness = fitness;
                
                // 更新个体最佳
                if (fitness > particle.bestFitness) {
                    particle.bestFitness = fitness;
                    particle.bestPosition = { ...particle.position };
                }
                
                // 更新全局最佳
                if (fitness > globalBestFitness) {
                    globalBestFitness = fitness;
                    globalBestPosition = { ...particle.position };
                }
            }
            
            // 更新粒子速度和位置
            this.updateParticles(particles, globalBestPosition!);
            
            this.emit('pso_iteration_completed', {
                iteration,
                globalBestFitness,
                averageFitness: particles.reduce((sum, p) => sum + p.currentFitness, 0) / particles.length
            });
        }
        
        return this.createOptimizationResult();
    }
    
    // 初始化粒子
    private initializeParticles(): Particle[] {
        const particles: Particle[] = [];
        
        for (let i = 0; i < this.config.populationSize; i++) {
            const position = this.generateRandomParameters();
            const particle: Particle = {
                id: `particle_${i}`,
                position,
                velocity: this.generateRandomParameters(),
                bestPosition: { ...position },
                bestFitness: -Infinity,
                currentFitness: 0
            };
            
            particles.push(particle);
        }
        
        return particles;
    }
    
    // 更新粒子
    private updateParticles(particles: Particle[], globalBest: StrategyParameters): void {
        const w = 0.7; // 惯性权重
        const c1 = 1.5; // 个体学习因子
        const c2 = 1.5; // 社会学习因子
        
        particles.forEach(particle => {
            // 更新速度
            particle.velocity.aggressiveness = 
                w * particle.velocity.aggressiveness +
                c1 * Math.random() * (particle.bestPosition.aggressiveness - particle.position.aggressiveness) +
                c2 * Math.random() * (globalBest.aggressiveness - particle.position.aggressiveness);
            
            particle.velocity.riskTolerance = 
                w * particle.velocity.riskTolerance +
                c1 * Math.random() * (particle.bestPosition.riskTolerance - particle.position.riskTolerance) +
                c2 * Math.random() * (globalBest.riskTolerance - particle.position.riskTolerance);
            
            particle.velocity.cooperationLevel = 
                w * particle.velocity.cooperationLevel +
                c1 * Math.random() * (particle.bestPosition.cooperationLevel - particle.position.cooperationLevel) +
                c2 * Math.random() * (globalBest.cooperationLevel - particle.position.cooperationLevel);
            
            // 更新位置
            particle.position.aggressiveness += particle.velocity.aggressiveness;
            particle.position.riskTolerance += particle.velocity.riskTolerance;
            particle.position.cooperationLevel += particle.velocity.cooperationLevel;
            
            // 边界处理
            particle.position.aggressiveness = Math.max(0, Math.min(1, particle.position.aggressiveness));
            particle.position.riskTolerance = Math.max(0, Math.min(1, particle.position.riskTolerance));
            particle.position.cooperationLevel = Math.max(0, Math.min(1, particle.position.cooperationLevel));
        });
    }
    
    // 模拟退火实现
    private async runSimulatedAnnealing(
        evaluationFunction: (gene: StrategyGene) => Promise<ObjectiveScores>
    ): Promise<OptimizationResult> {
        let current = this.population[0];
        let best = this.cloneGene(current);
        
        const initialTemp = 1000;
        const coolingRate = 0.95;
        let temperature = initialTemp;
        
        for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
            // 生成邻居解
            const neighbor = this.generateNeighbor(current);
            
            // 评估邻居解
            const scores = await evaluationFunction(neighbor);
            neighbor.fitness = this.calculateFitness(scores);
            
            // 接受准则
            const deltaE = neighbor.fitness - current.fitness;
            if (deltaE > 0 || Math.random() < Math.exp(deltaE / temperature)) {
                current = neighbor;
                
                if (current.fitness > best.fitness) {
                    best = this.cloneGene(current);
                }
            }
            
            // 降温
            temperature *= coolingRate;
            
            this.emit('sa_iteration_completed', {
                iteration,
                temperature,
                currentFitness: current.fitness,
                bestFitness: best.fitness
            });
        }
        
        this.globalBest = best;
        return this.createOptimizationResult();
    }
    
    // 生成邻居解
    private generateNeighbor(gene: StrategyGene): StrategyGene {
        const neighbor = this.cloneGene(gene);
        
        // 小幅度随机变化
        const changeAmount = 0.1;
        
        if (Math.random() < 0.5) {
            neighbor.parameters.aggressiveness += (Math.random() - 0.5) * changeAmount;
            neighbor.parameters.aggressiveness = Math.max(0, Math.min(1, neighbor.parameters.aggressiveness));
        }
        
        if (Math.random() < 0.5) {
            neighbor.parameters.riskTolerance += (Math.random() - 0.5) * changeAmount;
            neighbor.parameters.riskTolerance = Math.max(0, Math.min(1, neighbor.parameters.riskTolerance));
        }
        
        neighbor.id = `neighbor_${Date.now()}`;
        return neighbor;
    }
    
    // NSGA-II多目标优化
    private async runNSGA2(
        evaluationFunction: (gene: StrategyGene) => Promise<ObjectiveScores>
    ): Promise<OptimizationResult> {
        // 评估种群
        await this.evaluatePopulation(evaluationFunction);
        
        for (let generation = 0; generation < this.config.generations; generation++) {
            // 非支配排序
            const fronts = this.nonDominatedSort();
            
            // 拥挤度计算
            fronts.forEach(front => this.calculateCrowdingDistance(front));
            
            // 选择下一代
            const newPopulation = this.selectNextGeneration(fronts);
            
            // 交叉变异
            const offspring = this.generateOffspring(newPopulation);
            
            // 合并父代和子代
            this.population = [...newPopulation, ...offspring];
            
            // 评估新个体
            await this.evaluatePopulation(evaluationFunction);
            
            this.emit('nsga2_generation_completed', {
                generation,
                paretoFrontSize: fronts[0]?.length || 0
            });
        }
        
        return this.createOptimizationResult();
    }
    
    // 非支配排序
    private nonDominatedSort(): StrategyGene[][] {
        const fronts: StrategyGene[][] = [];
        const dominationCounts = new Map<string, number>();
        const dominatedSets = new Map<string, StrategyGene[]>();
        
        // 计算支配关系
        this.population.forEach(p1 => {
            dominationCounts.set(p1.id, 0);
            dominatedSets.set(p1.id, []);
            
            this.population.forEach(p2 => {
                if (this.dominates(p1, p2)) {
                    dominatedSets.get(p1.id)!.push(p2);
                } else if (this.dominates(p2, p1)) {
                    dominationCounts.set(p1.id, dominationCounts.get(p1.id)! + 1);
                }
            });
        });
        
        // 第一层（非支配解）
        const firstFront: StrategyGene[] = [];
        this.population.forEach(gene => {
            if (dominationCounts.get(gene.id) === 0) {
                firstFront.push(gene);
            }
        });
        
        fronts.push(firstFront);
        
        // 后续层
        let currentFront = 0;
        while (fronts[currentFront].length > 0) {
            const nextFront: StrategyGene[] = [];
            
            fronts[currentFront].forEach(p1 => {
                dominatedSets.get(p1.id)!.forEach(p2 => {
                    const count = dominationCounts.get(p2.id)! - 1;
                    dominationCounts.set(p2.id, count);
                    
                    if (count === 0) {
                        nextFront.push(p2);
                    }
                });
            });
            
            if (nextFront.length > 0) {
                fronts.push(nextFront);
            }
            currentFront++;
        }
        
        return fronts;
    }
    
    // 判断支配关系
    private dominates(gene1: StrategyGene, gene2: StrategyGene): boolean {
        const obj1 = gene1.objectives;
        const obj2 = gene2.objectives;
        
        let atLeastOneBetter = false;
        
        // 检查每个目标
        if (obj1.profitability >= obj2.profitability && 
            obj1.efficiency >= obj2.efficiency &&
            obj1.competitiveness >= obj2.competitiveness &&
            obj1.sustainability >= obj2.sustainability &&
            obj1.adaptability >= obj2.adaptability &&
            obj1.risk <= obj2.risk) {
            
            if (obj1.profitability > obj2.profitability ||
                obj1.efficiency > obj2.efficiency ||
                obj1.competitiveness > obj2.competitiveness ||
                obj1.sustainability > obj2.sustainability ||
                obj1.adaptability > obj2.adaptability ||
                obj1.risk < obj2.risk) {
                atLeastOneBetter = true;
            }
        }
        
        return atLeastOneBetter;
    }
    
    // 计算拥挤度距离
    private calculateCrowdingDistance(front: StrategyGene[]): void {
        if (front.length <= 2) {
            front.forEach(gene => (gene as any).crowdingDistance = Infinity);
            return;
        }
        
        front.forEach(gene => (gene as any).crowdingDistance = 0);
        
        const objectives = ['profitability', 'risk', 'efficiency', 'competitiveness', 'sustainability', 'adaptability'];
        
        objectives.forEach(objective => {
            front.sort((a, b) => (a.objectives as any)[objective] - (b.objectives as any)[objective]);
            
            (front[0] as any).crowdingDistance = Infinity;
            (front[front.length - 1] as any).crowdingDistance = Infinity;
            
            const maxObj = (front[front.length - 1].objectives as any)[objective];
            const minObj = (front[0].objectives as any)[objective];
            const range = maxObj - minObj;
            
            if (range > 0) {
                for (let i = 1; i < front.length - 1; i++) {
                    const distance = ((front[i + 1].objectives as any)[objective] - 
                                    (front[i - 1].objectives as any)[objective]) / range;
                    (front[i] as any).crowdingDistance += distance;
                }
            }
        });
    }
    
    // 选择下一代
    private selectNextGeneration(fronts: StrategyGene[][]): StrategyGene[] {
        const newPopulation: StrategyGene[] = [];
        let frontIndex = 0;
        
        while (newPopulation.length < this.config.populationSize && frontIndex < fronts.length) {
            const front = fronts[frontIndex];
            
            if (newPopulation.length + front.length <= this.config.populationSize) {
                newPopulation.push(...front);
            } else {
                // 根据拥挤度距离选择
                front.sort((a, b) => (b as any).crowdingDistance - (a as any).crowdingDistance);
                const remaining = this.config.populationSize - newPopulation.length;
                newPopulation.push(...front.slice(0, remaining));
            }
            
            frontIndex++;
        }
        
        return newPopulation;
    }
    
    // 生成子代
    private generateOffspring(population: StrategyGene[]): StrategyGene[] {
        const offspring: StrategyGene[] = [];
        
        while (offspring.length < this.config.populationSize) {
            const parent1 = this.tournamentSelection(population);
            const parent2 = this.tournamentSelection(population);
            
            if (Math.random() < this.config.crossoverRate) {
                const [child1, child2] = this.singlePointCrossover(parent1, parent2);
                offspring.push(child1, child2);
            } else {
                offspring.push(this.cloneGene(parent1), this.cloneGene(parent2));
            }
        }
        
        this.mutation(offspring);
        return offspring.slice(0, this.config.populationSize);
    }
    
    // 锦标赛选择
    private tournamentSelection(population: StrategyGene[]): StrategyGene {
        const tournamentSize = 2;
        const tournament = [];
        
        for (let i = 0; i < tournamentSize; i++) {
            const randomIndex = Math.floor(Math.random() * population.length);
            tournament.push(population[randomIndex]);
        }
        
        return tournament.reduce((best, current) => 
            current.fitness > best.fitness ? current : best
        );
    }
    
    // 辅助方法
    private cloneGene(gene: StrategyGene): StrategyGene {
        return {
            id: `clone_${gene.id}_${Date.now()}`,
            actions: gene.actions.map(action => ({ ...action })),
            parameters: { ...gene.parameters },
            fitness: gene.fitness,
            objectives: { ...gene.objectives },
            generation: gene.generation
        };
    }
    
    private particleToGene(particle: Particle): StrategyGene {
        return {
            id: particle.id,
            actions: this.generateRandomActions(),
            parameters: particle.position,
            fitness: 0,
            objectives: {
                profitability: 0,
                risk: 0,
                efficiency: 0,
                competitiveness: 0,
                sustainability: 0,
                adaptability: 0,
                overall: 0
            },
            generation: this.currentGeneration
        };
    }
    
    private updateGlobalBest(): void {
        const bestGene = this.population.reduce((best, current) => 
            current.fitness > (best?.fitness || -Infinity) ? current : best
        );
        
        if (!this.globalBest || bestGene.fitness > this.globalBest.fitness) {
            this.globalBest = this.cloneGene(bestGene);
        }
    }
    
    private recordConvergencePoint(): void {
        const avgFitness = this.calculateAverageFitness();
        const diversity = this.calculateDiversity();
        
        this.convergenceHistory.push({
            iteration: this.currentGeneration,
            bestFitness: this.globalBest?.fitness || 0,
            averageFitness: avgFitness,
            diversity,
            timestamp: Date.now()
        });
    }
    
    private calculateAverageFitness(): number {
        return this.population.reduce((sum, gene) => sum + gene.fitness, 0) / this.population.length;
    }
    
    private calculateDiversity(): number {
        // 简化的多样性计算
        const avgParams = this.population.reduce((acc, gene) => ({
            aggressiveness: acc.aggressiveness + gene.parameters.aggressiveness,
            riskTolerance: acc.riskTolerance + gene.parameters.riskTolerance,
            cooperationLevel: acc.cooperationLevel + gene.parameters.cooperationLevel
        }), { aggressiveness: 0, riskTolerance: 0, cooperationLevel: 0 });
        
        avgParams.aggressiveness /= this.population.length;
        avgParams.riskTolerance /= this.population.length;
        avgParams.cooperationLevel /= this.population.length;
        
        const variance = this.population.reduce((acc, gene) => {
            const aggressDiff = gene.parameters.aggressiveness - avgParams.aggressiveness;
            const riskDiff = gene.parameters.riskTolerance - avgParams.riskTolerance;
            const coopDiff = gene.parameters.cooperationLevel - avgParams.cooperationLevel;
            
            return acc + aggressDiff * aggressDiff + riskDiff * riskDiff + coopDiff * coopDiff;
        }, 0) / this.population.length;
        
        return Math.sqrt(variance);
    }
    
    private checkConvergence(): boolean {
        if (this.convergenceHistory.length < 10) return false;
        
        const recent = this.convergenceHistory.slice(-10);
        const maxFitness = Math.max(...recent.map(p => p.bestFitness));
        const minFitness = Math.min(...recent.map(p => p.bestFitness));
        
        return (maxFitness - minFitness) < this.config.convergenceThreshold;
    }
    
    private createOptimizationResult(): OptimizationResult {
        const executionTime = Date.now() - this.startTime;
        
        const optimizedStrategy: OptimizedStrategy = {
            actionSequence: this.globalBest?.actions || [],
            priorityOrder: this.globalBest?.actions.map((_, index) => index) || [],
            resourceAllocation: this.globalBest?.parameters.resourceAllocation || {
                cashReserve: 0.3,
                investmentBudget: 0.5,
                developmentFund: 0.4,
                riskBuffer: 0.2,
                opportunityFund: 0.3
            },
            contingencyPlans: [],
            adaptationTriggers: []
        };
        
        const statistics: OptimizationStatistics = {
            totalEvaluations: this.evaluationCount,
            convergenceRate: this.convergenceHistory.length > 0 ? 
                this.convergenceHistory[this.convergenceHistory.length - 1].bestFitness / this.convergenceHistory.length : 0,
            diversityMaintained: this.convergenceHistory.length > 0 ? 
                this.convergenceHistory[this.convergenceHistory.length - 1].diversity : 0,
            constraintViolations: 0,
            improvedSolutions: this.convergenceHistory.filter((point, index) => 
                index === 0 || point.bestFitness > this.convergenceHistory[index - 1].bestFitness
            ).length
        };
        
        return {
            bestStrategy: optimizedStrategy,
            convergenceHistory: this.convergenceHistory,
            finalFitness: this.globalBest?.fitness || 0,
            iterationsUsed: this.currentGeneration,
            executionTime,
            statistics
        };
    }
}