/**
 * 游戏循环集成测试
 * 测试游戏引擎、UI组件和状态管理的集成
 */

import { GameEngine } from './engine/GameEngine';
import { GameState } from './state/GameState';
import type { GameConfig } from './types/storage';

// 测试配置
const testConfig: GameConfig = {
  playerName: '测试玩家',
  playerZodiac: '龙',
  aiOpponents: [
    {
      id: 'ai_1',
      name: 'AI老虎',
      zodiac: '虎',
      difficulty: 'normal',
      personality: 'aggressive'
    },
    {
      id: 'ai_2', 
      name: 'AI兔子',
      zodiac: '兔',
      difficulty: 'easy',
      personality: 'conservative'
    }
  ],
  gameSettings: {
    startingMoney: 15000,
    maxRounds: 50,
    winCondition: 'last_standing'
  },
  difficulty: 'normal'
};

async function testGameLoop() {
  console.log('🎮 开始测试游戏循环集成...');

  try {
    // 1. 创建和初始化游戏引擎
    console.log('\n📦 步骤1: 创建游戏引擎...');
    const gameEngine = new GameEngine();
    
    // 设置事件监听器
    gameEngine.on('game:initialized', (gameState) => {
      console.log('✅ 游戏初始化完成，玩家数量:', gameState.players.length);
    });

    gameEngine.on('game:started', () => {
      console.log('✅ 游戏开始');
    });

    gameEngine.on('turn:start', (player) => {
      console.log(`🎯 ${player.name} 的回合开始 (${player.zodiac})`);
    });

    gameEngine.on('dice:rolled', (data) => {
      console.log(`🎲 ${data.player.name} 掷出了 ${data.result.total} 点`);
    });

    gameEngine.on('turn:ended', (data) => {
      console.log(`⏭️ ${data.player.name} 结束回合`);
    });

    gameEngine.on('game:error', (error) => {
      console.error('❌ 游戏错误:', error.message);
    });

    // 2. 初始化游戏
    console.log('\n🚀 步骤2: 初始化游戏...');
    await gameEngine.initialize(testConfig);

    // 3. 开始游戏
    console.log('\n▶️ 步骤3: 开始游戏...');
    await gameEngine.startGame();

    // 4. 模拟玩家操作
    console.log('\n🎮 步骤4: 模拟玩家操作...');
    
    // 模拟掷骰子
    const rollResult = await gameEngine.processPlayerAction({
      type: 'roll_dice'
    });
    console.log('掷骰子结果:', rollResult);

    // 等待一段时间让游戏循环处理
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. 测试保存游戏
    console.log('\n💾 步骤5: 测试游戏保存...');
    const saveId = await gameEngine.saveGame('测试存档');
    console.log('保存成功，存档ID:', saveId);

    // 6. 测试加载游戏
    console.log('\n📂 步骤6: 测试游戏加载...');
    const saveList = await gameEngine.getSaveList();
    console.log('存档列表:', saveList.map(s => ({ name: s.name, timestamp: new Date(s.timestamp) })));

    // 7. 获取游戏状态
    console.log('\n📊 步骤7: 获取游戏状态...');
    const currentState = gameEngine.getGameState();
    if (currentState) {
      console.log('当前状态:', {
        status: currentState.status,
        round: currentState.round,
        phase: currentState.phase,
        playerCount: currentState.players.length,
        currentPlayer: currentState.players[currentState.currentPlayerIndex]?.name
      });
    }

    // 8. 清理资源
    console.log('\n🧹 步骤8: 清理资源...');
    gameEngine.destroy();

    console.log('\n✅ 游戏循环集成测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    throw error;
  }
}

// 测试状态管理器
async function testGameStateManager() {
  console.log('\n🎯 测试游戏状态管理器...');
  
  try {
    const gameState = new GameState();
    
    // 初始化状态
    await gameState.initialize({
      players: [
        { id: 'player1', name: '玩家1', zodiac: '龙' },
        { id: 'player2', name: '玩家2', zodiac: '虎' }
      ],
      board: [],
      settings: testConfig.gameSettings
    });

    console.log('✅ 状态管理器初始化成功');

    // 测试状态更新
    gameState.updatePlayerMoney('player1', 1000);
    gameState.updatePlayerPosition('player1', 5);
    
    console.log('✅ 状态更新测试成功');

  } catch (error) {
    console.error('❌ 状态管理器测试失败:', error);
    throw error;
  }
}

// 运行测试
async function runAllTests() {
  console.log('🧪 开始完整的游戏循环集成测试\n');
  
  try {
    await testGameStateManager();
    await testGameLoop();
    
    console.log('\n🎉 所有测试通过！游戏循环集成成功！');
    
  } catch (error) {
    console.error('\n💥 测试失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { testGameLoop, testGameStateManager, runAllTests };