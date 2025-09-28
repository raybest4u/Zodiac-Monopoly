/**
 * 自适应故事叙述系统测试
 */
import { StorytellingManager } from './StorytellingManager';
import { createLLMService } from './LLMServiceFactory';
import type { GameEvent, Player } from '../types/game';

async function testStorytellingSystem() {
  console.log('🧪 测试自适应故事叙述系统\n');

  // 创建带LLM服务的故事管理器
  const llmService = createLLMService();
  const storytellingManager = new StorytellingManager({
    llmService,
    maxTokens: 600,
    temperature: 0.8,
    enableCache: true
  });

  try {
    // 创建测试玩家
    const players: Player[] = [
      { id: 'dragon', name: '敖辰', zodiac: '龙', money: 50000, properties: [] },
      { id: 'tiger', name: '啸天', zodiac: '虎', money: 45000, properties: [] },
      { id: 'snake', name: '玄鳞', zodiac: '蛇', money: 48000, properties: [] },
      { id: 'rabbit', name: '月华', zodiac: '兔', money: 42000, properties: [] }
    ];

    const gameState = {
      turn: 25,
      phase: 'middle',
      players
    } as any;

    // 测试1：游戏开场故事
    console.log('📖 测试1: 生成游戏开场故事');
    const gameSettings = {
      startingSeason: '春',
      startingWeather: '晴朗',
      culturalTheme: 'traditional',
      difficultyLevel: 'medium'
    };

    const openingStory = await storytellingManager.generateOpeningStory(players, gameSettings);
    
    console.log(`标题: ${openingStory.title}`);
    console.log(`开场白: ${openingStory.introduction.substring(0, 200)}...`);
    console.log(`角色介绍数: ${openingStory.characterIntroductions.length}`);
    console.log(`预言: ${openingStory.prophecy}`);
    console.log(`氛围: ${openingStory.mood}`);
    console.log('');

    // 测试2：事件叙述生成
    console.log('🎯 测试2: 生成游戏事件叙述');
    const gameEvent: GameEvent = {
      id: 'trade_001',
      type: 'property_trade',
      title: '龙王与蛇君的地产交易',
      description: '一场涉及高价地产的重要交易',
      rarity: 'rare'
    };

    const eventNarration = await storytellingManager.generateEventNarration(
      gameEvent,
      [players[0], players[2]], // 龙和蛇
      gameState
    );

    console.log(`事件标题: ${eventNarration.title}`);
    console.log(`叙述内容: ${eventNarration.narration}`);
    console.log(`叙述风格: ${eventNarration.mood}`);
    console.log(`文化元素: ${eventNarration.culturalElements?.join(', ')}`);
    console.log('');

    // 测试3：回合过渡叙述
    console.log('🔄 测试3: 生成回合过渡叙述');
    const previousEvents = [gameEvent];
    
    const turnNarration = await storytellingManager.generateTurnTransition(
      players[1], // 虎将
      gameState,
      previousEvents
    );

    console.log(`回合玩家: ${turnNarration.playerName} (${turnNarration.zodiac})`);
    console.log(`过渡文本: ${turnNarration.transitionText}`);
    console.log(`角色时刻: ${turnNarration.characterMoment}`);
    console.log(`游戏提示: ${turnNarration.gamePhaseHint}`);
    console.log('');

    // 测试4：史诗事件叙述
    console.log('⚡ 测试4: 生成史诗事件叙述');
    const epicEvent = {
      id: 'epic_001',
      type: 'zodiac_convergence',
      title: '十二生肖的大汇聚',
      description: '所有生肖的力量在此刻汇聚，改变了整个游戏格局',
      rarity: 'legendary',
      epicLevel: 'mythical',
      affectedPlayers: players.map(p => p.id),
      worldChangingEffect: '重新分配所有玩家的运势'
    } as any;

    const epicNarration = await storytellingManager.generateEpicEventNarration(
      epicEvent,
      players,
      gameState
    );

    console.log(`史诗事件: ${epicNarration.eventTitle}`);
    console.log(`史诗叙述: ${epicNarration.epicNarration.substring(0, 200)}...`);
    console.log(`影响分析: ${epicNarration.impactAnalysis}`);
    console.log(`角色反应数: ${epicNarration.characterReactions.length}`);
    console.log(`传奇时刻: ${epicNarration.legendaryMoment}`);
    console.log('');

    // 测试5：角色弧线追踪
    console.log('👤 测试5: 角色弧线追踪');
    const dragonArc = storytellingManager.getCharacterArc('dragon');
    if (dragonArc) {
      console.log(`龙王角色弧线:`);
      console.log(`- 弧线类型: ${dragonArc.arcType}`);
      console.log(`- 当前心情: ${dragonArc.currentMood}`);
      console.log(`- 关键事件数: ${dragonArc.keyEvents.length}`);
      console.log(`- 角色发展度: ${dragonArc.characterDevelopment.toFixed(2)}`);
      console.log(`- 成长方面: ${dragonArc.personalGrowth.join(', ')}`);
    }
    console.log('');

    // 测试6：季节性上下文更新
    console.log('🌸 测试6: 季节性上下文管理');
    storytellingManager.updateSeasonalContext('秋', '微风');
    
    const autumnEvent: GameEvent = {
      id: 'autumn_001',
      type: 'seasonal_bonus',
      title: '秋日的丰收奖励',
      description: '秋天带来了意外的收获',
      rarity: 'common'
    };

    const seasonalNarration = await storytellingManager.generateEventNarration(
      autumnEvent,
      [players[3]], // 兔子
      gameState
    );

    console.log(`秋日叙述: ${seasonalNarration.narration}`);
    console.log(`季节氛围: ${seasonalNarration.mood}`);
    console.log('');

    // 测试7：游戏结局故事
    console.log('🏆 测试7: 生成游戏结局故事');
    const winner = players[0]; // 龙王获胜
    const gameHistory = [gameEvent, epicEvent, autumnEvent];
    
    const endingStory = await storytellingManager.generateEndingStory(
      winner,
      players,
      gameState,
      gameHistory
    );

    console.log(`胜利者: ${endingStory.winnerName} (${endingStory.winnerZodiac})`);
    console.log(`胜利叙述: ${endingStory.victoryNarration.substring(0, 200)}...`);
    console.log(`旅程总结: ${endingStory.journeySummary}`);
    console.log(`最终智慧: ${endingStory.finalWisdom}`);
    console.log(`传奇地位: ${endingStory.legendStatus}`);
    console.log('');

    // 测试8：叙述质量分析
    console.log('📊 测试8: 叙述质量分析');
    const narrativeAnalysis = storytellingManager.analyzeNarrativeQuality();
    
    console.log(`叙述多样性: ${(narrativeAnalysis.diversityScore * 100).toFixed(1)}%`);
    console.log(`情感范围: ${narrativeAnalysis.emotionalRange.join(', ')}`);
    console.log(`文化丰富度: ${narrativeAnalysis.culturalRichness}种文化元素`);
    console.log(`玩家参与度: ${(narrativeAnalysis.playerEngagement * 100).toFixed(1)}%`);
    console.log(`平均长度: ${narrativeAnalysis.averageLength.toFixed(0)}字符`);
    console.log(`一致性评分: ${(narrativeAnalysis.consistencyScore * 100).toFixed(1)}%`);
    console.log('');

    // 测试9：叙述历史记录
    console.log('📚 测试9: 叙述历史查看');
    const narrativeHistory = storytellingManager.getNarrativeHistory(5);
    console.log(`最近5条叙述记录:`);
    narrativeHistory.forEach((record, index) => {
      console.log(`${index + 1}. ${record.eventId}: ${record.mood}风格 (${record.participants.length}个参与者)`);
    });

  } catch (error) {
    console.error('❌ 测试失败:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.log('⏰ LLM请求超时，可能是网络问题');
      } else if (error.message.includes('API')) {
        console.log('🔌 API调用失败，请检查配置');
      }
    }
  } finally {
    // 清理资源
    storytellingManager.cleanup();
    console.log('✅ 测试完成，资源已清理');
  }
}

// 演示不同生肖的叙述风格差异
async function demonstrateZodiacNarrationStyles() {
  console.log('\n🎭 演示不同生肖的叙述风格\n');
  
  const llmService2 = createLLMService();
  const storytellingManager = new StorytellingManager({
    llmService: llmService2,
    maxTokens: 400,
    temperature: 0.9
  });

  const gameState = {
    turn: 20,
    phase: 'middle',
    players: []
  } as any;

  const baseEvent: GameEvent = {
    id: 'achievement',
    type: 'major_achievement',
    title: '重大成就达成',
    description: '完成了一个重要的商业里程碑',
    rarity: 'rare'
  };

  const zodiacPlayers = [
    { id: 'dragon', name: '敖辰', zodiac: '龙', money: 60000, properties: [] },
    { id: 'tiger', name: '啸天', zodiac: '虎', money: 55000, properties: [] },
    { id: 'rabbit', name: '月华', zodiac: '兔', money: 52000, properties: [] },
    { id: 'snake', name: '玄鳞', zodiac: '蛇', money: 58000, properties: [] }
  ];

  for (const player of zodiacPlayers) {
    try {
      const personalizedEvent = {
        ...baseEvent,
        id: `${player.zodiac}_achievement`,
        title: `${player.name}的${player.zodiac}式胜利`
      };

      const narration = await storytellingManager.generateEventNarration(
        personalizedEvent,
        [player],
        gameState
      );

      console.log(`${player.zodiac} (${player.name}) 的叙述风格:`);
      console.log(`${narration.narration}`);
      console.log(`风格特点: ${narration.mood}，文化元素: ${narration.culturalElements?.join(', ')}\n`);
      
    } catch (error) {
      console.log(`${player.zodiac}: [叙述生成失败，跳过]\n`);
    }
  }

  storytellingManager.cleanup();
}

// 测试特殊场景叙述
async function testSpecialScenarioNarration() {
  console.log('\n🌟 测试特殊场景叙述\n');

  const llmService3 = createLLMService();
  const storytellingManager = new StorytellingManager({
    llmService: llmService3,
    temperature: 0.85
  });

  const players: Player[] = [
    { id: 'p1', name: '风云', zodiac: '龙', money: 30000, properties: [] },
    { id: 'p2', name: '烈焰', zodiac: '虎', money: 25000, properties: [] }
  ];

  const gameState = { turn: 45, phase: 'late', players } as any;

  // 特殊场景1：逆转局面
  const comebackEvent: GameEvent = {
    id: 'comeback',
    type: 'dramatic_comeback',
    title: '绝地反击',
    description: '在最困难的时刻实现了惊人的逆转',
    rarity: 'legendary'
  };

  const comebackNarration = await storytellingManager.generateEventNarration(
    comebackEvent,
    [players[1]], // 虎将逆转
    gameState
  );

  console.log('🔥 绝地反击场景:');
  console.log(comebackNarration.narration);
  console.log('');

  // 特殊场景2：终极对决
  const finalBattleEvent: GameEvent = {
    id: 'final_battle',
    type: 'final_confrontation',
    title: '龙虎终极对决',
    description: '两大强者的最终较量',
    rarity: 'legendary'
  };

  const battleNarration = await storytellingManager.generateEventNarration(
    finalBattleEvent,
    players,
    gameState
  );

  console.log('⚔️ 终极对决场景:');
  console.log(battleNarration.narration);

  storytellingManager.cleanup();
}

// 运行所有测试
testStorytellingSystem()
  .then(() => demonstrateZodiacNarrationStyles())
  .then(() => testSpecialScenarioNarration())
  .catch(console.error);

export { testStorytellingSystem };