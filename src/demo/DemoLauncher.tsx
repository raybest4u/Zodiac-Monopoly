/**
 * 演示启动器
 * 提供演示版本的启动界面和配置选择
 */

import React, { useState, useEffect } from 'react';
import { DemoConfiguration, DemoConfig, DemoScenario } from './DemoConfiguration';
import { GameEngine } from '../engine/GameEngine';
import { GameLoop } from '../components/GameLoop';
import { EnhancedGameInterface } from '../components/EnhancedGameInterface';
import type { GameState } from '../types/game';

interface DemoLauncherProps {
  onDemoComplete?: () => void;
  onDemoError?: (error: Error) => void;
}

interface DemoState {
  isRunning: boolean;
  currentConfig: DemoConfig | null;
  currentScenario: DemoScenario | null;
  currentStep: number;
  gameEngine: GameEngine | null;
  gameState: GameState | null;
  progress: number;
  logs: DemoLog[];
  startTime: number;
}

interface DemoLog {
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
}

export const DemoLauncher: React.FC<DemoLauncherProps> = ({
  onDemoComplete,
  onDemoError
}) => {
  const [demoState, setDemoState] = useState<DemoState>({
    isRunning: false,
    currentConfig: null,
    currentScenario: null,
    currentStep: 0,
    gameEngine: null,
    gameState: null,
    progress: 0,
    logs: [],
    startTime: 0
  });

  const [selectedConfig, setSelectedConfig] = useState<string>('quick');
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  const availableConfigs = DemoConfiguration.getAvailableConfigs();
  const demoStats = DemoConfiguration.generateDemoStats();

  useEffect(() => {
    // 清理定时器
    return () => {
      if (demoState.isRunning) {
        stopDemo();
      }
    };
  }, []);

  /**
   * 启动演示
   */
  const startDemo = async (configName: string) => {
    try {
      const config = DemoConfiguration.getDemoConfig(configName);
      if (!config) {
        throw new Error(`演示配置 '${configName}' 未找到`);
      }

      // 验证配置
      const validation = DemoConfiguration.validateConfig(config);
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
      }

      addLog('info', `开始启动演示: ${config.name}`);
      
      // 初始化游戏引擎
      const gameEngine = new GameEngine();
      await gameEngine.initialize(config.gameConfig);
      
      const gameState = gameEngine.getGameState();
      if (!gameState) {
        throw new Error('游戏状态初始化失败');
      }

      // 启动游戏
      await gameEngine.startGame();

      setDemoState(prev => ({
        ...prev,
        isRunning: true,
        currentConfig: config,
        gameEngine,
        gameState,
        startTime: Date.now(),
        progress: 0,
        currentStep: 0
      }));

      setShowConfigPanel(false);
      addLog('success', '演示启动成功');

      // 如果启用自动播放，开始执行演示步骤
      if (config.autoPlay && autoPlayEnabled) {
        startAutoDemo(config);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      addLog('error', `演示启动失败: ${message}`);
      onDemoError?.(error instanceof Error ? error : new Error(message));
    }
  };

  /**
   * 停止演示
   */
  const stopDemo = () => {
    addLog('info', '停止演示');
    
    setDemoState(prev => ({
      ...prev,
      isRunning: false,
      currentConfig: null,
      currentScenario: null,
      gameEngine: null,
      gameState: null,
      progress: 0,
      currentStep: 0
    }));

    setShowConfigPanel(true);
    onDemoComplete?.();
  };

  /**
   * 开始自动演示
   */
  const startAutoDemo = async (config: DemoConfig) => {
    addLog('info', '开始自动演示模式');
    
    // 选择合适的演示场景
    const scenarioId = getRecommendedScenario(config);
    const scenario = DemoConfiguration.getDemoScenario(scenarioId);
    
    if (!scenario) {
      addLog('warning', '未找到合适的演示场景，使用手动模式');
      return;
    }

    setDemoState(prev => ({
      ...prev,
      currentScenario: scenario
    }));

    // 执行演示步骤
    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      
      setDemoState(prev => ({
        ...prev,
        currentStep: i,
        progress: (i / scenario.steps.length) * 100
      }));

      addLog('info', `执行步骤 ${i + 1}/${scenario.steps.length}: ${step.title}`);

      try {
        await executeStep(step);
        addLog('success', `步骤完成: ${step.title}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : '步骤执行失败';
        addLog('error', `步骤失败: ${step.title} - ${message}`);
        
        if (!step.skipable) {
          addLog('error', '关键步骤失败，停止演示');
          stopDemo();
          return;
        }
      }

      // 检查是否超时
      const elapsed = Date.now() - demoState.startTime;
      if (elapsed > config.duration * 1000) {
        addLog('warning', '演示时间已到，自动结束');
        break;
      }
    }

    // 演示完成
    setDemoState(prev => ({
      ...prev,
      progress: 100
    }));

    addLog('success', '自动演示完成');
    setTimeout(stopDemo, 2000); // 2秒后自动停止
  };

  /**
   * 执行演示步骤
   */
  const executeStep = async (step: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        switch (step.action.type) {
          case 'narration':
            addLog('info', `旁白: ${step.description}`);
            break;
          case 'ui_interaction':
            addLog('info', `UI交互: ${step.action.target}`);
            break;
          case 'game_action':
            addLog('info', `游戏操作: ${step.action.target}`);
            break;
          case 'system_demo':
            addLog('info', `系统演示: ${step.action.target}`);
            break;
          case 'wait':
            addLog('info', '等待中...');
            break;
        }
        resolve();
      }, step.duration);
    });
  };

  /**
   * 获取推荐的演示场景
   */
  const getRecommendedScenario = (config: DemoConfig): string => {
    if (config.name.includes('技术')) {
      return 'technical_deep_dive';
    } else if (config.features.includes('AI对手智能决策')) {
      return 'ai_showcase';
    } else {
      return 'gameflow';
    }
  };

  /**
   * 添加日志
   */
  const addLog = (level: DemoLog['level'], message: string, data?: any) => {
    const log: DemoLog = {
      timestamp: Date.now(),
      level,
      message,
      data
    };

    setDemoState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-99), log] // 保留最近100条日志
    }));

    // 控制台输出
    const prefix = `[Demo ${level.toUpperCase()}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, data);
        break;
      case 'warning':
        console.warn(prefix, message, data);
        break;
      case 'success':
        console.log(prefix, '✅', message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  };

  /**
   * 渲染配置选择面板
   */
  const renderConfigPanel = () => (
    <div className="demo-config-panel">
      <div className="demo-header">
        <h1>🎮 十二生肖大富翁 - 演示版本</h1>
        <p>选择演示配置开始体验</p>
      </div>

      <div className="demo-stats">
        <div className="stat-item">
          <span className="label">演示配置</span>
          <span className="value">{demoStats.totalConfigs}</span>
        </div>
        <div className="stat-item">
          <span className="label">演示场景</span>
          <span className="value">{demoStats.totalScenarios}</span>
        </div>
        <div className="stat-item">
          <span className="label">总步骤</span>
          <span className="value">{demoStats.totalSteps}</span>
        </div>
        <div className="stat-item">
          <span className="label">预计时长</span>
          <span className="value">{Math.ceil(demoStats.estimatedTotalDuration / 60)}分钟</span>
        </div>
      </div>

      <div className="config-selection">
        <h3>选择演示配置</h3>
        <div className="config-grid">
          {availableConfigs.map(({ name, config }) => (
            <div
              key={name}
              className={`config-card ${selectedConfig === name ? 'selected' : ''}`}
              onClick={() => setSelectedConfig(name)}
            >
              <h4>{config.name}</h4>
              <p>{config.description}</p>
              <div className="config-details">
                <span className="duration">⏱️ {Math.ceil(config.duration / 60)}分钟</span>
                <span className="features">🎯 {config.features.length}个特性</span>
                <span className="auto">{config.autoPlay ? '🤖 自动' : '👤 手动'}</span>
              </div>
              <div className="feature-list">
                {config.features.slice(0, 3).map((feature, index) => (
                  <span key={index} className="feature-tag">{feature}</span>
                ))}
                {config.features.length > 3 && (
                  <span className="feature-more">+{config.features.length - 3}个</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-options">
        <label className="option-item">
          <input
            type="checkbox"
            checked={autoPlayEnabled}
            onChange={(e) => setAutoPlayEnabled(e.target.checked)}
          />
          <span>启用自动播放模式</span>
        </label>
      </div>

      <div className="demo-actions">
        <button
          className="start-demo-button"
          onClick={() => startDemo(selectedConfig)}
          disabled={!selectedConfig}
        >
          🚀 开始演示
        </button>
      </div>
    </div>
  );

  /**
   * 渲染演示控制面板
   */
  const renderControlPanel = () => (
    <div className="demo-control-panel">
      <div className="control-header">
        <h3>{demoState.currentConfig?.name}</h3>
        <div className="control-actions">
          <button onClick={stopDemo} className="stop-button">
            ⏹️ 停止演示
          </button>
        </div>
      </div>

      {demoState.currentScenario && (
        <div className="scenario-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${demoState.progress}%` }}
            />
          </div>
          <div className="step-info">
            步骤 {demoState.currentStep + 1} / {demoState.currentScenario.steps.length}
          </div>
        </div>
      )}

      <div className="demo-logs">
        <h4>演示日志</h4>
        <div className="log-container">
          {demoState.logs.slice(-10).map((log, index) => (
            <div key={index} className={`log-item log-${log.level}`}>
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * 渲染游戏界面
   */
  const renderGameInterface = () => {
    if (!demoState.gameState || !demoState.currentConfig) {
      return null;
    }

    return (
      <EnhancedGameInterface
        gameState={demoState.gameState}
        theme={{
          name: demoState.currentConfig.uiConfig.theme,
          colors: {},
          spacing: {},
          borderRadius: {},
          shadows: {},
          animations: {}
        }}
        onAction={(action) => {
          addLog('info', `玩家操作: ${action.type}`);
        }}
        onDiceRoll={() => {
          addLog('info', '掷骰子');
        }}
        onSkillUse={(playerId, skillId) => {
          addLog('info', `使用技能: ${skillId}`);
        }}
        onEndTurn={() => {
          addLog('info', '结束回合');
        }}
      />
    );
  };

  return (
    <div className="demo-launcher">
      {showConfigPanel ? (
        renderConfigPanel()
      ) : (
        <div className="demo-runtime">
          <div className="demo-game-area">
            {renderGameInterface()}
          </div>
          <div className="demo-control-area">
            {renderControlPanel()}
          </div>
        </div>
      )}

      <style jsx>{`
        .demo-launcher {
          width: 100%;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
        }

        .demo-config-panel {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          color: white;
        }

        .demo-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .demo-header h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .demo-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .stat-item {
          background: rgba(255,255,255,0.1);
          padding: 1rem;
          border-radius: 10px;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .stat-item .label {
          display: block;
          font-size: 0.9rem;
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }

        .stat-item .value {
          display: block;
          font-size: 2rem;
          font-weight: bold;
        }

        .config-selection h3 {
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }

        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .config-card {
          background: rgba(255,255,255,0.1);
          padding: 1.5rem;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 2px solid transparent;
        }

        .config-card:hover {
          background: rgba(255,255,255,0.15);
          transform: translateY(-5px);
        }

        .config-card.selected {
          border-color: #4299e1;
          background: rgba(66,153,225,0.2);
        }

        .config-card h4 {
          margin-bottom: 0.5rem;
          font-size: 1.2rem;
        }

        .config-details {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
          font-size: 0.9rem;
        }

        .feature-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .feature-tag {
          background: rgba(255,255,255,0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 15px;
          font-size: 0.8rem;
        }

        .demo-options {
          margin: 2rem 0;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .demo-actions {
          text-align: center;
        }

        .start-demo-button {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 25px;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .start-demo-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        .start-demo-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .demo-runtime {
          display: grid;
          grid-template-columns: 1fr 300px;
          height: 100vh;
        }

        .demo-game-area {
          background: white;
          overflow: hidden;
        }

        .demo-control-area {
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 1rem;
          overflow-y: auto;
        }

        .control-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }

        .stop-button {
          background: #e53e3e;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 5px;
          cursor: pointer;
        }

        .scenario-progress {
          margin-bottom: 1rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: #4299e1;
          transition: width 0.3s ease;
        }

        .demo-logs h4 {
          margin-bottom: 0.5rem;
        }

        .log-container {
          max-height: 300px;
          overflow-y: auto;
        }

        .log-item {
          padding: 0.25rem 0;
          font-size: 0.9rem;
          border-left: 3px solid transparent;
          padding-left: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .log-info { border-color: #4299e1; }
        .log-success { border-color: #48bb78; }
        .log-warning { border-color: #ed8936; }
        .log-error { border-color: #e53e3e; }

        .log-time {
          color: rgba(255,255,255,0.6);
          font-size: 0.8rem;
          margin-right: 0.5rem;
        }

        @media (max-width: 768px) {
          .demo-runtime {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
          }
          
          .demo-control-area {
            max-height: 200px;
          }
          
          .config-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};