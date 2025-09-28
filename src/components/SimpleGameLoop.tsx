import React from 'react';
import type { GameConfig } from '../types/storage';

interface SimpleGameLoopProps {
  gameConfig: GameConfig;
  onGameEvent?: (event: any) => void;
  onGameStateChange?: (gameState: any) => void;
  onGameEnd?: (result: any) => void;
  onPlayerAction?: (action: any) => void;
  onUIInteraction?: (type: string, data: any) => void;
}

export const SimpleGameLoop: React.FC<SimpleGameLoopProps> = ({
  gameConfig,
  onGameEvent,
  onGameStateChange,
  onGameEnd,
  onPlayerAction,
  onUIInteraction
}) => {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: '#f8f9fa',
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1>🎲 十二生肖大富翁</h1>
      <h2>游戏界面 (简化版)</h2>
      
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '20px 0',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <h3>当前配置</h3>
        <p><strong>玩家:</strong> {gameConfig.playerName} ({gameConfig.playerZodiac})</p>
        <p><strong>AI对手:</strong> {gameConfig.aiOpponents?.length || 0} 位</p>
        <p><strong>起始资金:</strong> {gameConfig.gameSettings?.startingMoney || 1500}</p>
        <p><strong>最大回合:</strong> {gameConfig.gameSettings?.maxRounds || 100}</p>
        
        <div style={{ marginTop: '20px' }}>
          <h4>AI对手列表</h4>
          {gameConfig.aiOpponents?.map((ai, index) => (
            <div key={ai.id} style={{ 
              padding: '10px', 
              margin: '5px 0', 
              background: '#f8f9fa',
              borderRadius: '4px',
              textAlign: 'left'
            }}>
              <strong>{ai.name}</strong> ({ai.zodiac}) - {ai.strategy} 策略
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          这是简化版游戏界面，用于测试组件是否能正常渲染
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          如果能看到这个页面，说明组件渲染正常
        </p>
      </div>
    </div>
  );
};