/**
 * 监狱系统 - 十二生肖大富翁监狱机制
 * 
 * 提供监狱相关的所有功能，包括入狱、出狱、特殊规则等
 */

import type {
  GameState,
  Player,
  ActionResult,
  GameEffect,
  PlayerAction
} from '../types/game';

export interface PrisonRecord {
  id: string;
  playerId: string;
  crime: PrisonCrime;
  sentenceDate: number;
  sentenceDuration: number; // 刑期（回合数）
  remainingTurns: number;
  
  // 监狱状态
  cellType: CellType;
  prisonLevel: PrisonLevel;
  behavior: PrisonBehavior;
  
  // 出狱方式
  releaseOptions: ReleaseOption[];
  bailAmount?: number;
  workServiceHours?: number;
  
  // 监狱效果
  restrictions: PrisonRestriction[];
  penalties: PrisonPenalty[];
  
  // 特殊机制
  zodiacBonus?: ZodiacPrisonBonus;
  specialEvents: PrisonEvent[];
}

export interface PrisonCrime {
  type: CrimeType;
  severity: CrimeSeverity;
  description: string;
  evidence: string[];
  witnesses?: string[];
}

export interface ReleaseOption {
  type: ReleaseType;
  cost?: number;
  requirements?: ReleaseRequirement[];
  successChance: number;
  consequences?: GameEffect[];
}

export interface PrisonRestriction {
  type: RestrictionType;
  description: string;
  duration: number;
  severity: number;
}

export interface PrisonPenalty {
  type: PenaltyType;
  amount: number;
  frequency: 'once' | 'per_turn' | 'on_release';
  description: string;
}

export interface ZodiacPrisonBonus {
  zodiac: string;
  bonusType: 'reduced_sentence' | 'special_skill' | 'visitor_bonus' | 'work_efficiency';
  value: number;
  description: string;
}

export interface PrisonEvent {
  id: string;
  name: string;
  description: string;
  type: PrisonEventType;
  effects: GameEffect[];
  rarity: 'common' | 'uncommon' | 'rare';
  triggers: PrisonEventTrigger[];
}

export interface PrisonStats {
  totalIncarcerations: number;
  averageSentence: number;
  mostCommonCrime: CrimeType;
  escapeAttempts: number;
  successfulEscapes: number;
  bailPayments: number;
  workServiceHours: number;
}

export type CrimeType = 
  | 'tax_evasion' | 'fraud' | 'theft' | 'assault' | 'vandalism'
  | 'trespassing' | 'disturbing_peace' | 'gambling' | 'smuggling'
  | 'zodiac_violation';

export type CrimeSeverity = 'minor' | 'moderate' | 'serious' | 'major' | 'extreme';

export type CellType = 'standard' | 'luxury' | 'solitary' | 'work_camp' | 'zodiac_wing';

export type PrisonLevel = 'minimum' | 'medium' | 'maximum' | 'supermax';

export type PrisonBehavior = 'model' | 'good' | 'average' | 'poor' | 'disruptive';

export type ReleaseType = 
  | 'serve_time' | 'pay_bail' | 'work_service' | 'legal_challenge'
  | 'zodiac_favor' | 'escape' | 'pardon' | 'visitor_help';

export type RestrictionType = 
  | 'no_movement' | 'no_trading' | 'no_property_actions' | 'no_skill_use'
  | 'reduced_income' | 'no_dice_bonus' | 'limited_communication';

export type PenaltyType = 
  | 'fine' | 'asset_seizure' | 'property_maintenance' | 'legal_fees'
  | 'reputation_loss' | 'skill_cooldown' | 'dice_penalty';

export type PrisonEventType = 
  | 'riot' | 'escape_attempt' | 'visitor_day' | 'work_opportunity'
  | 'guard_favor' | 'inmate_conflict' | 'zodiac_ceremony' | 'early_release';

export type PrisonEventTrigger = 
  | 'turn_start' | 'turn_end' | 'random' | 'behavior_change'
  | 'zodiac_alignment' | 'seasonal_change' | 'visitor_arrival';

/**
 * 监狱系统管理器
 */
export class PrisonSystem {
  private prisonRecords: Map<string, PrisonRecord> = new Map();
  private prisonHistory: PrisonRecord[] = [];
  private nextRecordId = 1;

  /**
   * 逮捕玩家并送入监狱
   */
  arrestPlayer(
    playerId: string,
    crime: PrisonCrime,
    gameState: GameState
  ): ActionResult {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    // 检查玩家是否已在监狱
    if (this.isPlayerInPrison(playerId)) {
      return { success: false, message: '玩家已在监狱中', effects: [] };
    }

    // 计算刑期
    const sentenceDuration = this.calculateSentenceDuration(crime, player, gameState);
    const cellType = this.determineCellType(crime, player);
    const prisonLevel = this.determinePrisonLevel(crime.severity);
    
    // 创建监狱记录
    const record: PrisonRecord = {
      id: `prison_${this.nextRecordId++}`,
      playerId,
      crime,
      sentenceDate: Date.now(),
      sentenceDuration,
      remainingTurns: sentenceDuration,
      cellType,
      prisonLevel,
      behavior: 'average',
      releaseOptions: this.generateReleaseOptions(crime, player, gameState),
      restrictions: this.generateRestrictions(crime, cellType),
      penalties: this.generatePenalties(crime, player),
      zodiacBonus: this.getZodiacPrisonBonus(player.zodiac),
      specialEvents: []
    };

    // 应用生肖加成
    if (record.zodiacBonus?.bonusType === 'reduced_sentence') {
      record.remainingTurns = Math.max(1, Math.floor(record.remainingTurns * (1 - record.zodiacBonus.value)));
    }

    this.prisonRecords.set(playerId, record);

    // 移动玩家到监狱位置
    const effects: GameEffect[] = [
      {
        type: 'position',
        target: 'player',
        value: 10, // 监狱位置
        description: `${player.name} 被逮捕入狱`
      }
    ];

    // 应用立即惩罚
    const immediatePenalties = record.penalties.filter(p => p.frequency === 'once');
    immediatePenalties.forEach(penalty => {
      switch (penalty.type) {
        case 'fine':
          effects.push({
            type: 'money',
            target: 'player',
            value: -penalty.amount,
            description: `罚金 ${penalty.amount}`
          });
          break;
        case 'reputation_loss':
          effects.push({
            type: 'status',
            target: 'player',
            value: -penalty.amount,
            description: `声誉损失 ${penalty.amount}`
          });
          break;
      }
    });

    return {
      success: true,
      message: `${player.name} 因 ${this.translateCrime(crime.type)} 被判刑 ${sentenceDuration} 回合`,
      effects,
      newGameState: {
        players: gameState.players.map(p => 
          p.id === playerId ? { ...p, position: 10 } : p
        )
      }
    };
  }

  /**
   * 尝试出狱
   */
  attemptRelease(
    playerId: string,
    releaseType: ReleaseType,
    gameState: GameState
  ): ActionResult {
    const record = this.prisonRecords.get(playerId);
    if (!record) {
      return { success: false, message: '玩家不在监狱中', effects: [] };
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    const releaseOption = record.releaseOptions.find(option => option.type === releaseType);
    if (!releaseOption) {
      return { success: false, message: '无效的出狱方式', effects: [] };
    }

    // 检查出狱要求
    const requirementCheck = this.checkReleaseRequirements(releaseOption, player, gameState);
    if (!requirementCheck.success) {
      return requirementCheck;
    }

    // 计算成功概率
    let successChance = releaseOption.successChance;
    
    // 应用生肖加成
    if (record.zodiacBonus?.bonusType === 'special_skill' && releaseType === 'escape') {
      successChance += record.zodiacBonus.value;
    }
    
    // 应用行为修正
    successChance *= this.getBehaviorModifier(record.behavior);

    // 进行成功判定
    const isSuccessful = Math.random() < successChance;

    if (isSuccessful) {
      return this.executeSuccessfulRelease(playerId, releaseType, releaseOption, gameState);
    } else {
      return this.executeFailedRelease(playerId, releaseType, gameState);
    }
  }

  /**
   * 处理监狱回合
   */
  processPrisonTurn(playerId: string, gameState: GameState): ActionResult {
    const record = this.prisonRecords.get(playerId);
    if (!record) {
      return { success: false, message: '玩家不在监狱中', effects: [] };
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    const effects: GameEffect[] = [];
    let message = `${player.name} 在监狱中度过一个回合`;

    // 减少剩余刑期
    record.remainingTurns--;

    // 应用每回合惩罚
    const turnPenalties = record.penalties.filter(p => p.frequency === 'per_turn');
    turnPenalties.forEach(penalty => {
      switch (penalty.type) {
        case 'fine':
          effects.push({
            type: 'money',
            target: 'player',
            value: -penalty.amount,
            description: penalty.description
          });
          break;
        case 'skill_cooldown':
          effects.push({
            type: 'skill_cooldown',
            target: 'player',
            value: penalty.amount,
            description: penalty.description
          });
          break;
      }
    });

    // 处理工作服务
    if (record.workServiceHours && record.workServiceHours > 0) {
      const workEfficiency = record.zodiacBonus?.bonusType === 'work_efficiency' ? 
        record.zodiacBonus.value : 1;
      const hoursWorked = Math.floor(8 * workEfficiency);
      record.workServiceHours = Math.max(0, record.workServiceHours - hoursWorked);
      
      if (record.workServiceHours === 0) {
        message += '，完成了工作服务';
        record.remainingTurns = 0;
      }
    }

    // 触发随机监狱事件
    const randomEvent = this.triggerRandomPrisonEvent(record, gameState);
    if (randomEvent) {
      message += `，遇到了${randomEvent.name}`;
      effects.push(...randomEvent.effects);
    }

    // 检查是否可以自动释放
    if (record.remainingTurns <= 0) {
      const releaseResult = this.releasePlayer(playerId, 'serve_time', gameState);
      return {
        success: true,
        message: `${message}。刑期结束，${player.name} 被释放`,
        effects: [...effects, ...releaseResult.effects],
        newGameState: releaseResult.newGameState
      };
    }

    // 更新行为评级
    this.updatePrisonBehavior(record);

    return {
      success: true,
      message: `${message}。剩余刑期：${record.remainingTurns} 回合`,
      effects
    };
  }

  /**
   * 释放玩家
   */
  releasePlayer(
    playerId: string,
    releaseType: ReleaseType,
    gameState: GameState
  ): ActionResult {
    const record = this.prisonRecords.get(playerId);
    if (!record) {
      return { success: false, message: '玩家不在监狱中', effects: [] };
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, message: '玩家不存在', effects: [] };
    }

    // 移除监狱记录
    this.prisonRecords.delete(playerId);
    
    // 添加到历史记录
    record.remainingTurns = 0;
    this.prisonHistory.push(record);

    const effects: GameEffect[] = [];

    // 应用出狱惩罚
    const releasePenalties = record.penalties.filter(p => p.frequency === 'on_release');
    releasePenalties.forEach(penalty => {
      switch (penalty.type) {
        case 'reputation_loss':
          effects.push({
            type: 'status',
            target: 'player',
            value: -penalty.amount,
            description: penalty.description
          });
          break;
        case 'property_maintenance':
          effects.push({
            type: 'money',
            target: 'player',
            value: -penalty.amount,
            description: '房产维护费用'
          });
          break;
      }
    });

    // 根据出狱方式应用特殊效果
    switch (releaseType) {
      case 'escape':
        effects.push({
          type: 'status',
          target: 'player',
          value: -10,
          description: '逃狱者标记'
        });
        break;
      case 'pay_bail':
        effects.push({
          type: 'money',
          target: 'player',
          value: -(record.bailAmount || 0),
          description: `保释金 ${record.bailAmount}`
        });
        break;
    }

    return {
      success: true,
      message: `${player.name} 通过 ${this.translateReleaseType(releaseType)} 出狱`,
      effects,
      newGameState: {
        players: gameState.players.map(p => 
          p.id === playerId ? { ...p, position: 10 } : p // 在监狱门口
        )
      }
    };
  }

  /**
   * 检查玩家是否在监狱
   */
  isPlayerInPrison(playerId: string): boolean {
    return this.prisonRecords.has(playerId);
  }

  /**
   * 获取玩家监狱信息
   */
  getPlayerPrisonInfo(playerId: string): PrisonRecord | null {
    return this.prisonRecords.get(playerId) || null;
  }

  /**
   * 获取监狱统计信息
   */
  getPrisonStatistics(): PrisonStats {
    const allRecords = [...this.prisonHistory, ...Array.from(this.prisonRecords.values())];
    
    if (allRecords.length === 0) {
      return {
        totalIncarcerations: 0,
        averageSentence: 0,
        mostCommonCrime: 'tax_evasion',
        escapeAttempts: 0,
        successfulEscapes: 0,
        bailPayments: 0,
        workServiceHours: 0
      };
    }

    const crimeCount = new Map<CrimeType, number>();
    let totalSentence = 0;
    let escapeAttempts = 0;
    let successfulEscapes = 0;
    let bailPayments = 0;
    let workServiceHours = 0;

    allRecords.forEach(record => {
      const crimeType = record.crime.type;
      crimeCount.set(crimeType, (crimeCount.get(crimeType) || 0) + 1);
      totalSentence += record.sentenceDuration;
      
      // 统计特殊事件
      record.specialEvents.forEach(event => {
        if (event.type === 'escape_attempt') escapeAttempts++;
      });
      
      if (record.bailAmount) bailPayments++;
      if (record.workServiceHours) workServiceHours += record.workServiceHours;
    });

    const mostCommonCrime = Array.from(crimeCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'tax_evasion';

    return {
      totalIncarcerations: allRecords.length,
      averageSentence: totalSentence / allRecords.length,
      mostCommonCrime,
      escapeAttempts,
      successfulEscapes,
      bailPayments,
      workServiceHours
    };
  }

  // 私有辅助方法

  private calculateSentenceDuration(crime: PrisonCrime, player: Player, gameState: GameState): number {
    const baseDuration: Record<CrimeSeverity, number> = {
      'minor': 1,
      'moderate': 2,
      'serious': 3,
      'major': 4,
      'extreme': 5
    };

    let duration = baseDuration[crime.severity];

    // 根据犯罪类型调整
    switch (crime.type) {
      case 'tax_evasion':
        duration += Math.floor(player.money / 20000); // 根据财富调整
        break;
      case 'fraud':
        duration += player.properties.length; // 根据房产数量调整
        break;
      case 'zodiac_violation':
        duration += 1; // 生肖违规额外刑期
        break;
    }

    // 考虑前科
    const priorRecord = this.prisonHistory.filter(r => r.playerId === player.id).length;
    duration += Math.floor(priorRecord / 2);

    return Math.max(1, Math.min(duration, 10)); // 限制在1-10回合
  }

  private determineCellType(crime: PrisonCrime, player: Player): CellType {
    if (crime.type === 'zodiac_violation') return 'zodiac_wing';
    if (crime.severity === 'extreme') return 'solitary';
    if (player.money > 100000) return 'luxury';
    if (crime.type === 'tax_evasion') return 'work_camp';
    return 'standard';
  }

  private determinePrisonLevel(severity: CrimeSeverity): PrisonLevel {
    switch (severity) {
      case 'minor': return 'minimum';
      case 'moderate': return 'minimum';
      case 'serious': return 'medium';
      case 'major': return 'maximum';
      case 'extreme': return 'supermax';
    }
  }

  private generateReleaseOptions(crime: PrisonCrime, player: Player, gameState: GameState): ReleaseOption[] {
    const options: ReleaseOption[] = [
      {
        type: 'serve_time',
        successChance: 1.0,
        requirements: []
      }
    ];

    // 保释选项
    if (crime.severity !== 'extreme') {
      const bailAmount = this.calculateBailAmount(crime, player);
      options.push({
        type: 'pay_bail',
        cost: bailAmount,
        successChance: 1.0,
        requirements: [
          { type: 'money', amount: bailAmount }
        ]
      });
    }

    // 工作服务选项
    if (crime.type !== 'assault' && crime.severity !== 'extreme') {
      options.push({
        type: 'work_service',
        successChance: 1.0,
        requirements: []
      });
    }

    // 逃狱选项（高风险）
    options.push({
      type: 'escape',
      successChance: 0.3,
      consequences: [
        {
          type: 'status',
          target: 'player',
          value: -20,
          description: '逃犯标记'
        }
      ]
    });

    // 生肖特殊选项
    if (this.hasZodiacSpecialOption(player.zodiac, crime)) {
      options.push({
        type: 'zodiac_favor',
        successChance: 0.7,
        requirements: [
          { type: 'zodiac_skill', zodiac: player.zodiac }
        ]
      });
    }

    return options;
  }

  private generateRestrictions(crime: PrisonCrime, cellType: CellType): PrisonRestriction[] {
    const restrictions: PrisonRestriction[] = [
      {
        type: 'no_movement',
        description: '无法移动',
        duration: -1, // 永久直到出狱
        severity: 1
      }
    ];

    if (cellType === 'solitary') {
      restrictions.push({
        type: 'limited_communication',
        description: '限制通讯',
        duration: -1,
        severity: 2
      });
    }

    if (crime.type === 'fraud') {
      restrictions.push({
        type: 'no_trading',
        description: '禁止交易',
        duration: -1,
        severity: 1
      });
    }

    return restrictions;
  }

  private generatePenalties(crime: PrisonCrime, player: Player): PrisonPenalty[] {
    const penalties: PrisonPenalty[] = [];

    // 根据犯罪类型生成惩罚
    switch (crime.type) {
      case 'tax_evasion':
        penalties.push({
          type: 'fine',
          amount: Math.floor(player.money * 0.1),
          frequency: 'once',
          description: '税务罚金'
        });
        break;
      case 'fraud':
        penalties.push({
          type: 'reputation_loss',
          amount: 10,
          frequency: 'once',
          description: '声誉损失'
        });
        break;
      case 'theft':
        penalties.push({
          type: 'asset_seizure',
          amount: 5000,
          frequency: 'once',
          description: '资产没收'
        });
        break;
    }

    // 每回合维护费
    if (player.properties.length > 0) {
      penalties.push({
        type: 'property_maintenance',
        amount: player.properties.length * 200,
        frequency: 'per_turn',
        description: '房产维护费'
      });
    }

    return penalties;
  }

  private getZodiacPrisonBonus(zodiac: string): ZodiacPrisonBonus | undefined {
    const bonuses: Record<string, ZodiacPrisonBonus> = {
      '鼠': {
        zodiac: '鼠',
        bonusType: 'special_skill',
        value: 0.2,
        description: '机敏逃脱能力提升20%'
      },
      '牛': {
        zodiac: '牛',
        bonusType: 'work_efficiency',
        value: 1.5,
        description: '工作效率提升50%'
      },
      '虎': {
        zodiac: '虎',
        bonusType: 'reduced_sentence',
        value: 0.1,
        description: '刑期减少10%'
      },
      '兔': {
        zodiac: '兔',
        bonusType: 'visitor_bonus',
        value: 0.3,
        description: '访客帮助概率提升30%'
      },
      '龙': {
        zodiac: '龙',
        bonusType: 'special_skill',
        value: 0.15,
        description: '威严减刑能力'
      },
      '蛇': {
        zodiac: '蛇',
        bonusType: 'special_skill',
        value: 0.25,
        description: '狡猾脱身能力提升25%'
      }
    };

    return bonuses[zodiac];
  }

  private calculateBailAmount(crime: PrisonCrime, player: Player): number {
    const baseBail: Record<CrimeSeverity, number> = {
      'minor': 5000,
      'moderate': 10000,
      'serious': 20000,
      'major': 50000,
      'extreme': 100000
    };

    let bail = baseBail[crime.severity];

    // 根据玩家财富调整
    const wealthMultiplier = Math.max(1, player.money / 50000);
    bail *= wealthMultiplier;

    return Math.floor(bail);
  }

  private checkReleaseRequirements(
    option: ReleaseOption,
    player: Player,
    gameState: GameState
  ): ActionResult {
    if (!option.requirements) {
      return { success: true, message: '无特殊要求', effects: [] };
    }

    for (const req of option.requirements) {
      switch (req.type) {
        case 'money':
          if (player.money < req.amount) {
            return { 
              success: false, 
              message: `资金不足，需要 ${req.amount}`, 
              effects: [] 
            };
          }
          break;
        case 'zodiac_skill':
          // 检查生肖技能可用性
          if (!this.hasAvailableZodiacSkill(player)) {
            return {
              success: false,
              message: '生肖技能不可用',
              effects: []
            };
          }
          break;
      }
    }

    return { success: true, message: '要求满足', effects: [] };
  }

  private executeSuccessfulRelease(
    playerId: string,
    releaseType: ReleaseType,
    option: ReleaseOption,
    gameState: GameState
  ): ActionResult {
    const releaseResult = this.releasePlayer(playerId, releaseType, gameState);
    
    // 应用成功释放的后果
    if (option.consequences) {
      releaseResult.effects.push(...option.consequences);
    }

    return {
      ...releaseResult,
      message: `出狱成功！${releaseResult.message}`
    };
  }

  private executeFailedRelease(
    playerId: string,
    releaseType: ReleaseType,
    gameState: GameState
  ): ActionResult {
    const record = this.prisonRecords.get(playerId);
    if (!record) {
      return { success: false, message: '监狱记录不存在', effects: [] };
    }

    // 失败后果
    const effects: GameEffect[] = [];
    let additionalSentence = 0;

    switch (releaseType) {
      case 'escape':
        additionalSentence = 2;
        record.behavior = 'disruptive';
        effects.push({
          type: 'status',
          target: 'player',
          value: -5,
          description: '逃狱失败声誉损失'
        });
        break;
      case 'legal_challenge':
        effects.push({
          type: 'money',
          target: 'player',
          value: -5000,
          description: '律师费用'
        });
        break;
    }

    record.remainingTurns += additionalSentence;

    return {
      success: false,
      message: `出狱失败！${additionalSentence > 0 ? `额外刑期 ${additionalSentence} 回合` : ''}`,
      effects
    };
  }

  private getBehaviorModifier(behavior: PrisonBehavior): number {
    const modifiers: Record<PrisonBehavior, number> = {
      'model': 1.2,
      'good': 1.1,
      'average': 1.0,
      'poor': 0.9,
      'disruptive': 0.8
    };
    return modifiers[behavior];
  }

  private triggerRandomPrisonEvent(record: PrisonRecord, gameState: GameState): PrisonEvent | null {
    if (Math.random() > 0.1) return null; // 10% 概率触发事件

    const events: PrisonEvent[] = [
      {
        id: 'visitor_day',
        name: '探监日',
        description: '亲友探访，心情好转',
        type: 'visitor_day',
        effects: [
          {
            type: 'status',
            target: 'player',
            value: 5,
            description: '心情提升'
          }
        ],
        rarity: 'common',
        triggers: ['random']
      },
      {
        id: 'work_opportunity',
        name: '工作机会',
        description: '获得额外工作机会',
        type: 'work_opportunity',
        effects: [
          {
            type: 'money',
            target: 'player',
            value: 1000,
            description: '工作收入'
          }
        ],
        rarity: 'uncommon',
        triggers: ['random']
      },
      {
        id: 'early_release_chance',
        name: '减刑机会',
        description: '表现良好获得减刑机会',
        type: 'early_release',
        effects: [],
        rarity: 'rare',
        triggers: ['behavior_change']
      }
    ];

    const availableEvents = events.filter(event => {
      if (event.type === 'early_release' && record.behavior !== 'model') return false;
      return true;
    });

    if (availableEvents.length === 0) return null;

    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    
    // 应用生肖加成
    if (record.zodiacBonus?.bonusType === 'visitor_bonus' && event.type === 'visitor_day') {
      event.effects.forEach(effect => {
        if (effect.type === 'status') {
          effect.value *= (1 + record.zodiacBonus!.value);
        }
      });
    }

    record.specialEvents.push(event);
    return event;
  }

  private updatePrisonBehavior(record: PrisonRecord): void {
    // 根据随机因素和事件更新行为
    const behaviorChange = Math.random();
    
    if (behaviorChange < 0.1) {
      const behaviors: PrisonBehavior[] = ['model', 'good', 'average', 'poor', 'disruptive'];
      const currentIndex = behaviors.indexOf(record.behavior);
      
      if (behaviorChange < 0.05 && currentIndex > 0) {
        record.behavior = behaviors[currentIndex - 1]; // 行为改善
      } else if (currentIndex < behaviors.length - 1) {
        record.behavior = behaviors[currentIndex + 1]; // 行为恶化
      }
    }
  }

  private hasZodiacSpecialOption(zodiac: string, crime: PrisonCrime): boolean {
    // 某些生肖在特定犯罪类型下有特殊选项
    const specialOptions: Record<string, CrimeType[]> = {
      '龙': ['tax_evasion', 'fraud'],
      '虎': ['assault', 'disturbing_peace'],
      '蛇': ['theft', 'smuggling'],
      '猴': ['fraud', 'gambling']
    };

    return specialOptions[zodiac]?.includes(crime.type) || false;
  }

  private hasAvailableZodiacSkill(player: Player): boolean {
    // 简化的生肖技能检查
    return player.skills.some(skill => 
      skill.cooldown === 0 && skill.category === 'zodiac'
    );
  }

  // 翻译辅助方法
  private translateCrime(crimeType: CrimeType): string {
    const translations: Record<CrimeType, string> = {
      'tax_evasion': '逃税',
      'fraud': '欺诈',
      'theft': '盗窃',
      'assault': '袭击',
      'vandalism': '破坏公物',
      'trespassing': '非法入侵',
      'disturbing_peace': '妨害风化',
      'gambling': '非法赌博',
      'smuggling': '走私',
      'zodiac_violation': '生肖违规'
    };
    return translations[crimeType] || crimeType;
  }

  private translateReleaseType(releaseType: ReleaseType): string {
    const translations: Record<ReleaseType, string> = {
      'serve_time': '服刑期满',
      'pay_bail': '缴纳保释金',
      'work_service': '工作服务',
      'legal_challenge': '法律挑战',
      'zodiac_favor': '生肖恩典',
      'escape': '越狱',
      'pardon': '特赦',
      'visitor_help': '访客帮助'
    };
    return translations[releaseType] || releaseType;
  }
}

// 辅助类型定义
interface ReleaseRequirement {
  type: 'money' | 'property' | 'zodiac_skill' | 'behavior_level';
  amount?: number;
  zodiac?: string;
  level?: string;
}