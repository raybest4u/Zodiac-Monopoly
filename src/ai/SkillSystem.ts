import type {
  AIState,
  AIPersonality,
  SkillUsageTendency,
  SituationAnalysis
} from '../types/ai';

import type {
  GameState,
  Player,
  PlayerSkill,
  PlayerAction,
  SkillEffect,
  EffectTarget
} from '../types/game';

/**
 * AI技能使用系统
 * 负责分析技能使用时机、评估技能效果、制定技能使用策略
 */
export class SkillSystem {

  /**
   * 评估所有可用技能的使用价值
   */
  evaluateAvailableSkills(
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): SkillEvaluation[] {
    const aiPlayer = gameState.players.find(p => p.id === aiState.id);
    if (!aiPlayer || !aiPlayer.skills.length) return [];

    const availableSkills = this.getUsableSkills(aiPlayer, gameState);
    const evaluations: SkillEvaluation[] = [];

    for (const skill of availableSkills) {
      const evaluation = this.evaluateSkillUsage(skill, aiState, gameState, analysis);
      if (evaluation.score > 0.1) { // 只考虑有意义的技能使用
        evaluations.push(evaluation);
      }
    }

    return evaluations.sort((a, b) => b.score - a.score);
  }

  /**
   * 评估单个技能的使用价值
   */
  evaluateSkillUsage(
    skill: PlayerSkill,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): SkillEvaluation {
    let score = 0.5; // 基础分数
    const reasons: string[] = [];

    // 1. 基于技能类型的基础评估
    const typeScore = this.evaluateSkillType(skill, aiState, analysis);
    score += typeScore * 0.3;
    if (typeScore > 0.5) reasons.push(`${skill.type}技能在当前情况下有效`);

    // 2. 基于技能效果的评估
    const effectScore = this.evaluateSkillEffects(skill, aiState, gameState, analysis);
    score += effectScore * 0.4;
    if (effectScore > 0.6) reasons.push('技能效果符合当前需求');

    // 3. 基于时机的评估
    const timingScore = this.evaluateSkillTiming(skill, aiState, gameState, analysis);
    score += timingScore * 0.2;
    if (timingScore > 0.7) reasons.push('当前是使用技能的好时机');

    // 4. 基于个性的调整
    score = this.adjustScoreByPersonality(score, skill, aiState.personality);

    // 5. 基于策略的调整
    score = this.adjustScoreByStrategy(score, skill, aiState.currentStrategy);

    // 6. 基于情绪的调整
    if (aiState.emotionalState) {
      score = this.adjustScoreByEmotion(score, skill, aiState.emotionalState);
    }

    return {
      skill,
      score: Math.max(0, Math.min(1, score)),
      reasoning: reasons.join(', ') || '基础技能评估',
      priority: this.calculateSkillPriority(skill, aiState, analysis),
      expectedEffects: this.predictSkillEffects(skill, gameState)
    };
  }

  /**
   * 创建技能使用动作
   */
  createSkillAction(
    skillEvaluation: SkillEvaluation,
    aiId: string,
    targetId?: string
  ): PlayerAction {
    const parameters: Record<string, any> = {
      skillId: skillEvaluation.skill.id
    };

    // 如果技能需要目标，添加目标信息
    if (this.skillRequiresTarget(skillEvaluation.skill) && targetId) {
      parameters.targetId = targetId;
    }

    // 添加预期效果信息（用于日志和调试）
    parameters.expectedEffects = skillEvaluation.expectedEffects;

    return {
      type: 'use_skill',
      playerId: aiId,
      data: parameters,
      timestamp: Date.now()
    };
  }

  /**
   * 选择技能目标
   */
  selectSkillTarget(
    skill: PlayerSkill,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): string | null {
    const effects = skill.effects;
    const hasTargetedEffect = effects.some(effect => 
      effect.target === 'other_players' || effect.target === 'random_player'
    );

    if (!hasTargetedEffect) return null;

    const strategy = aiState.currentStrategy;
    const personality = aiState.personality;

    // 根据技能效果类型选择目标
    for (const effect of effects) {
      if (effect.target === 'other_players' || effect.target === 'random_player') {
        return this.selectTargetByEffectType(effect, aiState, gameState, analysis);
      }
    }

    return null;
  }

  /**
   * 预测技能使用后的游戏状态变化
   */
  predictSkillImpact(
    skill: PlayerSkill,
    aiState: AIState,
    gameState: GameState,
    targetId?: string
  ): SkillImpactPrediction {
    const impacts: EffectImpact[] = [];
    let overallBenefit = 0;

    for (const effect of skill.effects) {
      const impact = this.predictEffectImpact(effect, aiState, gameState, targetId);
      impacts.push(impact);
      overallBenefit += impact.benefitValue;
    }

    return {
      skill,
      targetId,
      impacts,
      overallBenefit,
      riskLevel: this.calculateSkillRisk(skill, gameState),
      confidence: this.calculatePredictionConfidence(impacts)
    };
  }

  // 私有方法

  private getUsableSkills(player: Player, gameState: GameState): PlayerSkill[] {
    const currentTime = Date.now();
    const cooldownModifier = gameState.marketTrends?.skillCooldownModifier || 1.0;

    return player.skills.filter(skill => {
      // 检查冷却时间
      if (skill.lastUsed) {
        const cooldownTime = skill.cooldown * cooldownModifier * 1000; // 转换为毫秒
        if (currentTime - skill.lastUsed < cooldownTime) {
          return false;
        }
      }

      // 检查技能需求
      return this.checkSkillRequirements(skill, player, gameState);
    });
  }

  private checkSkillRequirements(skill: PlayerSkill, player: Player, gameState: GameState): boolean {
    if (!skill.requirements) return true;

    return skill.requirements.every(requirement => {
      switch (requirement.type) {
        case 'money':
          const requiredMoney = typeof requirement.value === 'number' ? requirement.value : 0;
          return player.money >= requiredMoney;
        case 'property_count':
          const requiredCount = typeof requirement.value === 'number' ? requirement.value : 0;
          return player.properties.length >= requiredCount;
        case 'level':
          return skill.level >= (typeof requirement.value === 'number' ? requirement.value : 0);
        case 'season':
          return gameState.season === requirement.value;
        case 'weather':
          return gameState.weather === requirement.value;
        case 'zodiac_compatibility':
          return this.checkZodiacCompatibility(skill.zodiac, player.zodiac);
        default:
          return true;
      }
    });
  }

  private evaluateSkillType(
    skill: PlayerSkill,
    aiState: AIState,
    analysis: SituationAnalysis
  ): number {
    const tendency = aiState.personality.skill_usage_tendency;
    const gamePhase = analysis.gamePhase.phase;

    let score = 0.5;

    // 根据技能标签评估
    if (skill.tags.includes('offensive') || skill.tags.includes('aggressive')) {
      score += tendency.aggressiveSkills * 0.5;
      // 在竞争激烈时更有价值
      if (analysis.threats.length > 0) score += 0.2;
    }

    if (skill.tags.includes('defensive') || skill.tags.includes('protective')) {
      score += tendency.defensiveSkills * 0.5;
      // 在受到威胁时更有价值
      const highThreat = analysis.threats.some(t => t.severity > 0.7);
      if (highThreat) score += 0.3;
    }

    if (skill.tags.includes('economic') || skill.tags.includes('financial')) {
      score += tendency.economicSkills * 0.5;
      // 在经济困难时更有价值
      if (analysis.economicSituation.liquidityRatio < 0.3) score += 0.3;
    }

    // 游戏阶段调整
    if (skill.tags.includes('early_game') && gamePhase === 'early') score += 0.2;
    if (skill.tags.includes('late_game') && gamePhase === 'late') score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private evaluateSkillEffects(
    skill: PlayerSkill,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): number {
    let totalValue = 0;
    let effectCount = 0;

    for (const effect of skill.effects) {
      const value = this.evaluateSingleEffect(effect, aiState, gameState, analysis);
      totalValue += value;
      effectCount++;
    }

    return effectCount > 0 ? totalValue / effectCount : 0;
  }

  private evaluateSingleEffect(
    effect: SkillEffect,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): number {
    let value = 0.5;

    switch (effect.type) {
      case 'money':
        // 金钱效果在缺钱时更有价值
        const moneyRatio = analysis.economicSituation.liquidityRatio;
        value = effect.value > 0 ? (1.5 - moneyRatio) : moneyRatio;
        break;

      case 'position':
        // 位置效果根据当前位置和目标评估
        value = this.evaluatePositionEffect(effect, aiState, gameState);
        break;

      case 'property':
        // 房产效果根据策略评估
        if (aiState.currentStrategy.focus === 'property_monopoly') {
          value = 0.8;
        } else {
          value = 0.5;
        }
        break;

      case 'dice_modifier':
        // 骰子修饰符根据当前需求评估
        value = this.evaluateDiceModifier(effect, aiState, gameState);
        break;

      case 'skill_cooldown':
        // 冷却时间减少总是有价值的
        value = 0.7;
        break;

      case 'status':
        // 状态效果根据具体情况评估
        value = this.evaluateStatusEffect(effect, aiState, analysis);
        break;
    }

    // 根据目标范围调整价值
    switch (effect.target) {
      case 'self':
        // 对自己的效果最可靠
        break;
      case 'all_players':
        // 影响所有玩家的效果需要谨慎评估
        value *= 0.8;
        break;
      case 'other_players':
        // 对其他玩家的负面效果很有价值
        if (effect.value < 0) value *= 1.3;
        else value *= 0.6;
        break;
      case 'random_player':
        // 随机目标的不确定性
        value *= 0.7;
        break;
    }

    return Math.max(0, Math.min(1, value));
  }

  private evaluateSkillTiming(
    skill: PlayerSkill,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): number {
    let score = 0.5;

    const tendency = aiState.personality.skill_usage_tendency;
    const gamePhase = analysis.gamePhase.phase;

    // 根据时机偏好调整
    switch (tendency.timingPreference) {
      case 'early_game':
        score += gamePhase === 'early' ? 0.3 : -0.2;
        break;
      case 'mid_game':
        score += gamePhase === 'middle' ? 0.3 : -0.1;
        break;
      case 'late_game':
        score += gamePhase === 'late' ? 0.3 : -0.2;
        break;
      case 'opportunistic':
        // 机会主义者在有明显优势时使用技能
        if (analysis.opportunities.length > 0) score += 0.3;
        break;
    }

    // 季节性技能在对应季节使用
    if (skill.tags.includes('seasonal')) {
      const seasonBonus = this.getSeasonalBonus(skill, gameState.season);
      score += seasonBonus;
    }

    // 天气相关技能
    if (skill.tags.includes('weather_dependent')) {
      const weatherBonus = this.getWeatherBonus(skill, gameState.weather);
      score += weatherBonus;
    }

    return Math.max(0, Math.min(1, score));
  }

  private adjustScoreByPersonality(score: number, skill: PlayerSkill, personality: AIPersonality): number {
    let adjustedScore = score;

    // 风险承受能力影响
    if (skill.tags.includes('risky') || skill.tags.includes('aggressive')) {
      adjustedScore *= (0.5 + personality.risk_tolerance * 0.5);
    }

    // 合作倾向影响
    if (skill.tags.includes('cooperative') || skill.tags.includes('team_beneficial')) {
      adjustedScore *= (0.3 + personality.cooperation * 0.7);
    }

    // 攻击性影响
    if (skill.tags.includes('offensive') || skill.tags.includes('disruptive')) {
      adjustedScore *= (0.2 + personality.aggression * 0.8);
    }

    // 适应性影响
    if (skill.tags.includes('adaptive') || skill.tags.includes('flexible')) {
      adjustedScore *= (0.4 + personality.adaptability * 0.6);
    }

    return adjustedScore;
  }

  private adjustScoreByStrategy(score: number, skill: PlayerSkill, strategy: any): number {
    let adjustedScore = score;

    // 根据策略焦点调整
    switch (strategy.focus) {
      case 'wealth_accumulation':
        if (skill.tags.includes('economic') || skill.tags.includes('money_generating')) {
          adjustedScore *= 1.4;
        }
        break;
      case 'property_monopoly':
        if (skill.tags.includes('property_related') || skill.tags.includes('acquisition')) {
          adjustedScore *= 1.3;
        }
        break;
      case 'player_elimination':
        if (skill.tags.includes('offensive') || skill.tags.includes('disruptive')) {
          adjustedScore *= 1.5;
        }
        break;
      case 'risk_minimization':
        if (skill.tags.includes('defensive') || skill.tags.includes('protective')) {
          adjustedScore *= 1.2;
        } else if (skill.tags.includes('risky')) {
          adjustedScore *= 0.7;
        }
        break;
    }

    return adjustedScore;
  }

  private adjustScoreByEmotion(score: number, skill: PlayerSkill, emotionalState: any): number {
    let adjustedScore = score;
    const mood = emotionalState.mood;

    switch (mood) {
      case 'aggressive':
        if (skill.tags.includes('offensive')) adjustedScore *= 1.3;
        break;
      case 'confident':
        if (skill.tags.includes('risky')) adjustedScore *= 1.2;
        break;
      case 'desperate':
        // 绝望时更愿意使用任何技能
        adjustedScore *= 1.4;
        break;
      case 'cautious':
        if (skill.tags.includes('safe')) adjustedScore *= 1.2;
        else if (skill.tags.includes('risky')) adjustedScore *= 0.7;
        break;
      case 'frustrated':
        if (skill.tags.includes('disruptive')) adjustedScore *= 1.3;
        break;
    }

    return adjustedScore;
  }

  private calculateSkillPriority(skill: PlayerSkill, aiState: AIState, analysis: SituationAnalysis): SkillPriority {
    // 基于技能类型和当前情况计算优先级
    if (skill.tags.includes('emergency') && analysis.threats.length > 0) {
      return 'urgent';
    } else if (skill.tags.includes('optimal_timing')) {
      return 'high';
    } else if (skill.tags.includes('convenience')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private predictSkillEffects(skill: PlayerSkill, gameState: GameState): PredictedEffect[] {
    return skill.effects.map(effect => ({
      type: effect.type,
      value: effect.value,
      target: effect.target,
      confidence: this.calculateEffectConfidence(effect, gameState)
    }));
  }

  private skillRequiresTarget(skill: PlayerSkill): boolean {
    return skill.effects.some(effect => 
      effect.target === 'other_players' || effect.target === 'random_player'
    );
  }

  private selectTargetByEffectType(
    effect: SkillEffect,
    aiState: AIState,
    gameState: GameState,
    analysis: SituationAnalysis
  ): string | null {
    const otherPlayers = gameState.players.filter(p => p.id !== aiState.id);
    
    if (effect.value < 0) {
      // 负面效果：选择威胁最大的玩家
      const threats = analysis.threats.sort((a, b) => b.severity - a.severity);
      if (threats.length > 0) {
        return threats[0].source;
      }
    } else {
      // 正面效果：选择关系最好的玩家（如果是合作技能）
      if (skill.tags.includes('cooperative')) {
        const relationships = aiState.memory.playerRelationships;
        const bestAlly = Object.values(relationships)
          .filter(rel => rel.status === 'ally')
          .sort((a, b) => b.trustLevel - a.trustLevel)[0];
        
        return bestAlly?.playerId || null;
      }
    }

    // 默认选择第一个其他玩家
    return otherPlayers[0]?.id || null;
  }

  // 辅助方法（简化实现）
  private checkZodiacCompatibility(skillZodiac: string, playerZodiac: string): boolean {
    // 简化的生肖兼容性检查
    return skillZodiac === playerZodiac;
  }

  private evaluatePositionEffect(effect: SkillEffect, aiState: AIState, gameState: GameState): number {
    // 简化的位置效果评估
    return 0.6;
  }

  private evaluateDiceModifier(effect: SkillEffect, aiState: AIState, gameState: GameState): number {
    // 骰子修饰符通常有中等价值
    return 0.6;
  }

  private evaluateStatusEffect(effect: SkillEffect, aiState: AIState, analysis: SituationAnalysis): number {
    // 状态效果的价值取决于当前情况
    return 0.5;
  }

  private getSeasonalBonus(skill: PlayerSkill, season: string): number {
    // 简化的季节加成
    return skill.tags.includes('seasonal') ? 0.2 : 0;
  }

  private getWeatherBonus(skill: PlayerSkill, weather: string): number {
    // 简化的天气加成
    return skill.tags.includes('weather_dependent') ? 0.2 : 0;
  }

  private predictEffectImpact(effect: SkillEffect, aiState: AIState, gameState: GameState, targetId?: string): EffectImpact {
    return {
      effect,
      targetId,
      estimatedValue: Math.abs(effect.value) * 0.8,
      benefitValue: effect.value > 0 ? effect.value * 0.8 : -effect.value * 0.6,
      confidence: 0.7
    };
  }

  private calculateSkillRisk(skill: PlayerSkill, gameState: GameState): number {
    // 简化的风险计算
    return skill.tags.includes('risky') ? 0.8 : 0.3;
  }

  private calculatePredictionConfidence(impacts: EffectImpact[]): number {
    const avgConfidence = impacts.reduce((sum, impact) => sum + impact.confidence, 0) / impacts.length;
    return avgConfidence || 0.5;
  }

  private calculateEffectConfidence(effect: SkillEffect, gameState: GameState): number {
    // 基于效果类型和游戏状态计算置信度
    switch (effect.target) {
      case 'self': return 0.9;
      case 'all_players': return 0.8;
      case 'other_players': return 0.7;
      case 'random_player': return 0.5;
      default: return 0.6;
    }
  }
}

// 类型定义
export interface SkillEvaluation {
  skill: PlayerSkill;
  score: number;
  reasoning: string;
  priority: SkillPriority;
  expectedEffects: PredictedEffect[];
}

export interface PredictedEffect {
  type: string;
  value: number;
  target: EffectTarget;
  confidence: number;
}

export interface SkillImpactPrediction {
  skill: PlayerSkill;
  targetId?: string;
  impacts: EffectImpact[];
  overallBenefit: number;
  riskLevel: number;
  confidence: number;
}

export interface EffectImpact {
  effect: SkillEffect;
  targetId?: string;
  estimatedValue: number;
  benefitValue: number;
  confidence: number;
}

export type SkillPriority = 'urgent' | 'high' | 'medium' | 'low';