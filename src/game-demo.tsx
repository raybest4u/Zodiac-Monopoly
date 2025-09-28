/**
 * 游戏循环集成演示
 * 展示完整的游戏引擎、AI系统和UI组件集成
 */

import React, { useState, useEffect } from 'react';
import { GameLoop } from './components/GameLoop';
import { GameModeSelection } from './game-modes';
import type { GameConfig } from './types/storage';

// 单人对战AI配置
const demoConfig: GameConfig = {
  playerName: '玩家',
  playerZodiac: '龙',
  difficulty: 'medium' as any,
  aiOpponents: [
    {
      id: 'ai_tiger',
      name: '猛虎霸主',
      zodiac: '虎',
      difficulty: 'hard' as any,
      strategy: 'aggressive' as any
    },
    {
      id: 'ai_rabbit',
      name: '智兔谋士',
      zodiac: '兔',
      difficulty: 'medium' as any,
      strategy: 'conservative' as any
    },
    {
      id: 'ai_monkey',
      name: '灵猴商王',
      zodiac: '猴',
      difficulty: 'hard' as any,
      strategy: 'economic' as any
    }
  ],
  gameSettings: {
    startingMoney: 1500,
    maxRounds: 100,
    winCondition: 'wealth_goal'
  }
};

export const GameDemo: React.FC = () => {
  const [gameMode, setGameMode] = useState<'menu' | 'modeSelect' | 'game'>('menu');
  const [currentConfig, setCurrentConfig] = useState<GameConfig>(demoConfig);
  const [gameStats, setGameStats] = useState({
    eventsProcessed: 0,
    actionsExecuted: 0,
    uiUpdates: 0
  });

  // 游戏事件处理器
  const handleGameEvent = (event: any) => {
    console.log('游戏事件:', event);
    setGameStats(prev => ({
      ...prev,
      eventsProcessed: prev.eventsProcessed + 1
    }));
  };

  // 游戏状态变化处理器
  const handleGameStateChange = (gameState: any) => {
    console.log('游戏状态更新:', {
      status: gameState.status,
      round: gameState.round,
      currentPlayer: gameState.players?.[gameState.currentPlayerIndex]?.name
    });
    setGameStats(prev => ({
      ...prev,
      uiUpdates: prev.uiUpdates + 1
    }));
  };

  // 玩家操作处理器
  const handlePlayerAction = (action: any) => {
    console.log('玩家操作:', action);
    setGameStats(prev => ({
      ...prev,
      actionsExecuted: prev.actionsExecuted + 1
    }));
  };

  // UI交互处理器
  const handleUIInteraction = (type: string, data: any) => {
    console.log('UI交互:', type, data);
  };

  // 游戏结束处理器
  const handleGameEnd = (result: any) => {
    console.log('游戏结束:', result);
    setGameMode('menu');
  };

  // 模式选择处理器
  const handleModeSelect = (config: GameConfig) => {
    setCurrentConfig(config);
    setGameMode('game');
  };

  // 返回菜单
  const handleBackToMenu = () => {
    setGameMode('menu');
  };

  // 模式选择界面
  if (gameMode === 'modeSelect') {
    return (
      <GameModeSelection 
        onModeSelect={handleModeSelect}
        onBack={handleBackToMenu}
      />
    );
  }

  // 主菜单界面
  if (gameMode === 'menu') {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
          🎲 十二生肖大富翁
        </h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '3rem' }}>
          单人对战AI模式
        </h2>
        <div style={{ 
          background: 'rgba(255,215,0,0.2)', 
          padding: '1rem', 
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '2px solid rgba(255,215,0,0.5)'
        }}>
          <h3 style={{ color: '#ffd700', fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>🤖 AI对手阵容</h3>
          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>🐅 猛虎霸主 - 激进策略，高难度</p>
          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>🐰 智兔谋士 - 保守策略，中等难度</p>
          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>🐵 灵猴商王 - 经济策略，高难度</p>
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '2rem', 
          borderRadius: '12px',
          maxWidth: '600px',
          margin: '0 auto 3rem',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>单人对战AI特色</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
              <h4>🧠 智能AI</h4>
              <p>三种不同策略的AI对手，具备学习和适应能力</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
              <h4>🎯 多重策略</h4>
              <p>激进、保守、经济型策略，挑战不同类型对手</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
              <h4>🎮 即时对战</h4>
              <p>无需联网，随时开始单人对战模式</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
              <h4>💫 动态难度</h4>
              <p>AI会根据你的表现调整策略难度</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
              <h4>🎨 生肖主题</h4>
              <p>十二生肖特色技能和个性化AI行为</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
              <h4>💾 进度保存</h4>
              <p>随时保存游戏进度，继续挑战</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setGameMode('modeSelect')}
          style={{
            padding: '15px 40px',
            fontSize: '1.2rem',
            background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
            color: '#333',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
          }}
        >
          🎮 选择游戏模式
        </button>

        <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: '0.8' }}>
          <p>🎯 挑战三位不同策略的AI对手</p>
          <p>💰 目标：成为最富有的生肖大亨</p>
          <p>🧠 AI具备学习能力，每局都会更加智能</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 游戏统计面板 */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        fontSize: '0.8rem',
        zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>📊 集成统计</h4>
        <div>事件处理: {gameStats.eventsProcessed}</div>
        <div>操作执行: {gameStats.actionsExecuted}</div>
        <div>UI更新: {gameStats.uiUpdates}</div>
      </div>

      {/* 主游戏界面 */}
      <GameLoop
        gameConfig={currentConfig}
        onGameEvent={handleGameEvent}
        onGameStateChange={handleGameStateChange}
        onGameEnd={handleGameEnd}
        onPlayerAction={handlePlayerAction}
        onUIInteraction={handleUIInteraction}
      />
    </div>
  );
};

export default GameDemo;