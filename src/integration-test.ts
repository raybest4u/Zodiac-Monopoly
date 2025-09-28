/**
 * 游戏循环集成测试 - 简化版
 */

import { GameEngine } from './engine/GameEngine';
import type { GameConfig } from './types/storage';

// 基础测试配置
const testConfig: GameConfig = {
  playerName: '测试玩家',
  playerZodiac: '龙',
  difficulty: 'easy' as any,
  aiOpponents: [
    {
      id: 'ai_1',
      name: 'AI老虎',
      zodiac: '虎',
      difficulty: 'easy' as any,
      strategy: 'balanced' as any
    }
  ]
};

async function basicIntegrationTest() {
  console.log('🎮 开始基础集成测试...');

  const gameEngine = new GameEngine();
  
  try {
    // 设置基础事件监听
    gameEngine.on('game:initialized', () => {
      console.log('✅ 游戏初始化完成');
    });

    gameEngine.on('game:started', () => {
      console.log('✅ 游戏开始');
    });

    gameEngine.on('game:error', (error) => {
      console.error('❌ 游戏错误:', error);
    });

    // 初始化游戏
    console.log('📦 正在初始化游戏引擎...');
    await gameEngine.initialize(testConfig);

    // 开始游戏
    console.log('🚀 正在开始游戏...');
    await gameEngine.startGame();

    // 获取游戏状态
    const gameState = gameEngine.getGameState();
    if (gameState) {
      console.log('✅ 游戏状态获取成功:', {
        status: gameState.status,
        playerCount: gameState.players.length,
        currentPlayerName: gameState.players[gameState.currentPlayerIndex]?.name
      });
    }

    // 清理
    gameEngine.destroy();
    console.log('✅ 基础集成测试通过！');

    return true;

  } catch (error) {
    console.error('❌ 基础集成测试失败:', error);
    gameEngine.destroy();
    return false;
  }
}

// 运行测试
if (require.main === module) {
  basicIntegrationTest()
    .then(success => {
      if (success) {
        console.log('\n🎉 游戏循环集成测试成功！');
        process.exit(0);
      } else {
        console.log('\n💥 游戏循环集成测试失败！');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 测试执行失败:', error);
      process.exit(1);
    });
}

export { basicIntegrationTest };