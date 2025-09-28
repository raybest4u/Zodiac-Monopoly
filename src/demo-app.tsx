/**
 * 演示版本应用入口
 * 专为演示优化的应用启动文件
 */

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoLauncher } from './demo/DemoLauncher';
import { DemoConfiguration } from './demo/DemoConfiguration';
import { ComprehensiveIntegrationTest } from './tests/ComprehensiveIntegrationTest';
import { UIResponsivenessTest } from './tests/UIResponsivenessTest';
import './index.css';

interface DemoAppState {
  mode: 'launcher' | 'testing' | 'showcase';
  isLoading: boolean;
  error: string | null;
  testResults: any | null;
}

const DemoApp: React.FC = () => {
  const [state, setState] = useState<DemoAppState>({
    mode: 'launcher',
    isLoading: false,
    error: null,
    testResults: null
  });

  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') as DemoAppState['mode'];
    const autoStart = urlParams.get('autostart') === 'true';
    const skipWelcome = urlParams.get('skipwelcome') === 'true';

    if (mode && ['launcher', 'testing', 'showcase'].includes(mode)) {
      setState(prev => ({ ...prev, mode }));
    }

    if (skipWelcome) {
      setShowWelcome(false);
    }

    if (autoStart) {
      setShowWelcome(false);
      if (mode === 'testing') {
        runTests();
      }
    }

    // 设置演示模式标识
    document.title = '十二生肖大富翁 - 演示版本';
    document.body.classList.add('demo-mode');

    // 添加版本信息到控制台
    console.log(`
    🎮 十二生肖大富翁 - 演示版本
    📅 构建时间: ${import.meta.env.VITE_BUILD_TIME || '开发模式'}
    🔧 版本: ${import.meta.env.PACKAGE_VERSION || '1.0.0'}
    🚀 模式: ${import.meta.env.MODE}
    `);
  }, []);

  /**
   * 运行测试套件
   */
  const runTests = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🧪 开始运行测试套件...');
      
      // 运行集成测试
      const integrationTester = new ComprehensiveIntegrationTest();
      const integrationResults = await integrationTester.runComprehensiveTests();
      
      // 运行UI测试
      const uiTester = new UIResponsivenessTest();
      const uiResults = await uiTester.runUITests();

      const combinedResults = {
        integration: integrationResults,
        ui: uiResults,
        summary: {
          totalTests: integrationResults.summary.totalTests + uiResults.summary.totalTests,
          passedTests: integrationResults.summary.passedTests + uiResults.summary.passedTests,
          successRate: (integrationResults.summary.passedTests + uiResults.summary.passedTests) / 
                      (integrationResults.summary.totalTests + uiResults.summary.totalTests),
          duration: integrationResults.summary.totalDuration + uiResults.summary.totalDuration
        }
      };

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        testResults: combinedResults 
      }));

      console.log('✅ 测试完成:', combinedResults.summary);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '测试运行失败';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      console.error('❌ 测试失败:', error);
    }
  };

  /**
   * 处理演示完成
   */
  const handleDemoComplete = () => {
    setState(prev => ({ ...prev, mode: 'launcher' }));
  };

  /**
   * 处理演示错误
   */
  const handleDemoError = (error: Error) => {
    setState(prev => ({ ...prev, error: error.message }));
    console.error('演示错误:', error);
  };

  /**
   * 渲染欢迎界面
   */
  const renderWelcome = () => (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-header">
          <h1>🎮 十二生肖大富翁</h1>
          <p>演示版本 - 体验完整的游戏功能</p>
        </div>

        <div className="welcome-features">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>完整游戏循环</h3>
              <p>掷骰子、移动、购买、技能等完整玩法体验</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>智能AI对手</h3>
              <p>4个难度等级，具有不同性格和策略的AI</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🐉</div>
              <h3>十二生肖主题</h3>
              <p>每个生肖都有独特技能和文化特色</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>响应式设计</h3>
              <p>完美适配PC端和移动端设备</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>本地存储</h3>
              <p>IndexedDB本地存档，支持多存档管理</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>高性能</h3>
              <p>优化的渲染和状态管理，流畅运行</p>
            </div>
          </div>
        </div>

        <div className="welcome-actions">
          <button 
            className="action-button primary"
            onClick={() => {
              setShowWelcome(false);
              setState(prev => ({ ...prev, mode: 'launcher' }));
            }}
          >
            🚀 开始演示
          </button>
          <button 
            className="action-button secondary"
            onClick={() => {
              setShowWelcome(false);
              setState(prev => ({ ...prev, mode: 'testing' }));
              runTests();
            }}
          >
            🧪 运行测试
          </button>
        </div>

        <div className="welcome-info">
          <p>
            <strong>技术栈:</strong> React 18 + TypeScript + Vite
          </p>
          <p>
            <strong>构建时间:</strong> {import.meta.env.VITE_BUILD_TIME || '开发模式'}
          </p>
        </div>
      </div>
    </div>
  );

  /**
   * 渲染测试界面
   */
  const renderTesting = () => (
    <div className="testing-screen">
      <div className="testing-header">
        <h2>🧪 系统测试</h2>
        <button 
          className="back-button"
          onClick={() => setState(prev => ({ ...prev, mode: 'launcher' }))}
        >
          ← 返回
        </button>
      </div>

      {state.isLoading && (
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>正在运行测试套件...</p>
        </div>
      )}

      {state.error && (
        <div className="error-section">
          <h3>❌ 测试失败</h3>
          <p>{state.error}</p>
          <button onClick={runTests}>重新运行测试</button>
        </div>
      )}

      {state.testResults && (
        <div className="results-section">
          <h3>✅ 测试结果</h3>
          <div className="results-summary">
            <div className="summary-item">
              <span className="label">总测试数</span>
              <span className="value">{state.testResults.summary.totalTests}</span>
            </div>
            <div className="summary-item">
              <span className="label">通过测试</span>
              <span className="value success">{state.testResults.summary.passedTests}</span>
            </div>
            <div className="summary-item">
              <span className="label">成功率</span>
              <span className="value">{(state.testResults.summary.successRate * 100).toFixed(1)}%</span>
            </div>
            <div className="summary-item">
              <span className="label">耗时</span>
              <span className="value">{(state.testResults.summary.duration / 1000).toFixed(1)}s</span>
            </div>
          </div>
          
          <div className="test-actions">
            <button onClick={runTests}>🔄 重新测试</button>
            <button 
              onClick={() => setState(prev => ({ ...prev, mode: 'launcher' }))}
            >
              🎮 开始演示
            </button>
          </div>
        </div>
      )}
    </div>
  );

  /**
   * 渲染错误界面
   */
  const renderError = () => (
    <div className="error-screen">
      <h2>❌ 发生错误</h2>
      <p>{state.error}</p>
      <button onClick={() => setState(prev => ({ ...prev, error: null }))}>
        重试
      </button>
    </div>
  );

  return (
    <div className="demo-app">
      {showWelcome ? (
        renderWelcome()
      ) : state.error ? (
        renderError()
      ) : state.mode === 'testing' ? (
        renderTesting()
      ) : (
        <DemoLauncher 
          onDemoComplete={handleDemoComplete}
          onDemoError={handleDemoError}
        />
      )}

      <style jsx>{`
        .demo-app {
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        /* 欢迎界面样式 */
        .welcome-screen {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          padding: 2rem;
        }

        .welcome-content {
          max-width: 1200px;
          text-align: center;
        }

        .welcome-header h1 {
          font-size: 4rem;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .welcome-header p {
          font-size: 1.5rem;
          opacity: 0.9;
          margin-bottom: 3rem;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin: 3rem 0;
        }

        .feature-card {
          background: rgba(255,255,255,0.1);
          padding: 2rem;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          text-align: center;
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .welcome-actions {
          display: flex;
          gap: 2rem;
          justify-content: center;
          margin: 3rem 0;
        }

        .action-button {
          padding: 1rem 2rem;
          border: none;
          border-radius: 25px;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 150px;
        }

        .action-button.primary {
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .action-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        .action-button.secondary {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 2px solid rgba(255,255,255,0.3);
        }

        .action-button.secondary:hover {
          background: rgba(255,255,255,0.3);
        }

        .welcome-info {
          margin-top: 2rem;
          opacity: 0.8;
        }

        .welcome-info p {
          margin: 0.5rem 0;
          font-size: 1rem;
        }

        /* 测试界面样式 */
        .testing-screen {
          padding: 2rem;
          height: 100vh;
          background: #f5f5f5;
          overflow-y: auto;
        }

        .testing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .back-button {
          background: #4299e1;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 5px;
          cursor: pointer;
        }

        .loading-section {
          text-align: center;
          padding: 4rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4299e1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-section {
          background: #fee;
          border: 1px solid #fcc;
          padding: 2rem;
          border-radius: 10px;
          text-align: center;
        }

        .results-section {
          background: white;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .results-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 2rem 0;
        }

        .summary-item {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          text-align: center;
        }

        .summary-item .label {
          display: block;
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .summary-item .value {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .summary-item .value.success {
          color: #27ae60;
        }

        .test-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .test-actions button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }

        /* 错误界面样式 */
        .error-screen {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #fee;
          color: #c53030;
          text-align: center;
          padding: 2rem;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .welcome-header h1 {
            font-size: 2.5rem;
          }
          
          .feature-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .welcome-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .results-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// 启动应用
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<DemoApp />);
} else {
  console.error('Root container not found');
}