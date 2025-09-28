import React, { useEffect, useState, useCallback } from 'react';
import type { GameConfig } from '../types/storage';

interface TestGameEngineProps {
  gameConfig: GameConfig;
  onGameEvent?: (event: any) => void;
  onGameStateChange?: (gameState: any) => void;
  onGameEnd?: (result: any) => void;
  onPlayerAction?: (action: any) => void;
  onUIInteraction?: (type: string, data: any) => void;
}

export const TestGameEngine: React.FC<TestGameEngineProps> = ({
  gameConfig,
  onGameEvent,
  onGameStateChange,
  onGameEnd,
  onPlayerAction,
  onUIInteraction
}) => {
  const [status, setStatus] = useState('mounting');
  const [error, setError] = useState<string | null>(null);
  const [gameEngine, setGameEngine] = useState<any>(null);

  // 测试GameEngine导入和创建
  const testGameEngine = useCallback(async () => {
    try {
      console.log('开始测试GameEngine导入...');
      setStatus('importing');
      
      // 动态导入GameEngine
      const { GameEngine } = await import('../engine/GameEngine');
      console.log('GameEngine导入成功');
      
      setStatus('creating');
      const engine = new GameEngine();
      console.log('GameEngine创建成功');
      
      setGameEngine(engine);
      setStatus('created');
      
      console.log('开始初始化GameEngine...');
      setStatus('initializing');
      await engine.initialize(gameConfig);
      console.log('GameEngine初始化成功');
      
      setStatus('initialized');
      
    } catch (error) {
      console.error('GameEngine测试失败:', error);
      setError(error instanceof Error ? error.message : '未知错误');
      setStatus('error');
    }
  }, [gameConfig]);

  useEffect(() => {
    console.log('TestGameEngine 组件挂载');
    testGameEngine();
    
    return () => {
      console.log('TestGameEngine 组件卸载');
    };
  }, [testGameEngine]);

  const statusMap = {
    mounting: '组件挂载中',
    importing: '导入GameEngine中',
    creating: '创建GameEngine实例中',
    created: 'GameEngine实例已创建',
    initializing: '初始化GameEngine中',
    initialized: 'GameEngine初始化完成',
    error: '出现错误'
  };

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#fee',
        color: '#c33',
        minHeight: '100vh'
      }}>
        <h1>❌ GameEngine测试错误</h1>
        <p><strong>错误信息:</strong> {error}</p>
        <p><strong>停止阶段:</strong> {statusMap[status as keyof typeof statusMap]}</p>
        <details style={{ textAlign: 'left', marginTop: '20px' }}>
          <summary>查看控制台输出</summary>
          <p>请按F12打开开发者工具查看详细错误信息</p>
        </details>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: '#f8f9fa',
      minHeight: '100vh',
      color: '#333'
    }}>
      <h1>🧪 GameEngine测试组件</h1>
      <h2>当前状态: {statusMap[status as keyof typeof statusMap]}</h2>
      
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '20px auto',
        maxWidth: '600px',
        textAlign: 'left'
      }}>
        <h3>测试进度</h3>
        <p><strong>组件挂载:</strong> ✅</p>
        <p><strong>GameEngine导入:</strong> {['importing', 'creating', 'created', 'initializing', 'initialized'].includes(status) ? '✅' : '⏳'}</p>
        <p><strong>GameEngine创建:</strong> {['created', 'initializing', 'initialized'].includes(status) ? '✅' : '⏳'}</p>
        <p><strong>GameEngine初始化:</strong> {status === 'initialized' ? '✅' : '⏳'}</p>
        
        <h4>GameEngine信息</h4>
        <p><strong>实例存在:</strong> {gameEngine ? '✅' : '❌'}</p>
        
        <h4>配置信息</h4>
        <p><strong>玩家:</strong> {gameConfig.playerName}</p>
        <p><strong>AI数量:</strong> {gameConfig.aiOpponents?.length || 0}</p>
        
        <h4>时间信息</h4>
        <p><strong>当前时间:</strong> {new Date().toLocaleString()}</p>
      </div>
      
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        这个组件专门测试GameEngine的导入、创建和初始化过程
      </p>
    </div>
  );
};