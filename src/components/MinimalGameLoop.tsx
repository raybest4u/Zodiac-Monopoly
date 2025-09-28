import React, { useEffect, useState, useCallback } from 'react';
import type { GameConfig } from '../types/storage';

interface MinimalGameLoopProps {
  gameConfig: GameConfig;
  onGameEvent?: (event: any) => void;
  onGameStateChange?: (gameState: any) => void;
  onGameEnd?: (result: any) => void;
  onPlayerAction?: (action: any) => void;
  onUIInteraction?: (type: string, data: any) => void;
}

export const MinimalGameLoop: React.FC<MinimalGameLoopProps> = ({
  gameConfig,
  onGameEvent,
  onGameStateChange,
  onGameEnd,
  onPlayerAction,
  onUIInteraction
}) => {
  const [status, setStatus] = useState('mounting');
  const [error, setError] = useState<string | null>(null);

  // 测试异步初始化
  const testAsyncInit = useCallback(async () => {
    try {
      console.log('开始测试异步初始化...');
      setStatus('initializing');
      
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('异步初始化完成');
      setStatus('initialized');
      
    } catch (error) {
      console.error('初始化失败:', error);
      setError(error instanceof Error ? error.message : '未知错误');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    console.log('MinimalGameLoop 组件挂载');
    testAsyncInit();
    
    return () => {
      console.log('MinimalGameLoop 组件卸载');
    };
  }, [testAsyncInit]);

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#fee',
        color: '#c33',
        minHeight: '100vh'
      }}>
        <h1>❌ 错误</h1>
        <p>{error}</p>
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
      <h1>🧪 最小化测试组件</h1>
      <h2>状态: {status}</h2>
      
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '20px auto',
        maxWidth: '600px',
        textAlign: 'left'
      }}>
        <h3>测试结果</h3>
        <p><strong>组件挂载:</strong> ✅</p>
        <p><strong>Props接收:</strong> ✅</p>
        <p><strong>useState:</strong> ✅</p>
        <p><strong>useEffect:</strong> ✅</p>
        <p><strong>useCallback:</strong> ✅</p>
        <p><strong>异步操作:</strong> {status === 'initialized' ? '✅' : '⏳'}</p>
        
        <h4>配置信息</h4>
        <p><strong>玩家:</strong> {gameConfig.playerName}</p>
        <p><strong>AI数量:</strong> {gameConfig.aiOpponents?.length || 0}</p>
        
        <h4>时间信息</h4>
        <p><strong>当前时间:</strong> {new Date().toLocaleString()}</p>
      </div>
      
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        这是最小化测试组件，用于验证基本React hooks和异步操作
      </p>
    </div>
  );
};