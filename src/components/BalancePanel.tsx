import React, { useState, useEffect } from 'react';
import { GameEngine } from '../engine/GameEngine';
import type { BalanceMetrics, BalanceAlert } from '../balance/GameBalanceAnalyzer';
import type { GameParameters, OptimizationResult } from '../balance/ValueOptimizer';

interface BalancePanelProps {
  gameEngine: GameEngine;
}

interface ParameterAdjustment {
  parameter: keyof GameParameters;
  value: number;
  originalValue: number;
}

export const BalancePanel: React.FC<BalancePanelProps> = ({ gameEngine }) => {
  const [balanceMetrics, setBalanceMetrics] = useState<BalanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<BalanceAlert[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [currentParameters, setCurrentParameters] = useState<GameParameters | null>(null);
  const [parameterAdjustments, setParameterAdjustments] = useState<ParameterAdjustment[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<keyof GameParameters>('startingMoney');
  const [sensitivityData, setSensitivityData] = useState<Array<{value: number, score: number}>>([]);
  const [autoOptimizeEnabled, setAutoOptimizeEnabled] = useState(false);

  useEffect(() => {
    loadBalanceData();
    
    // 监听游戏状态更新
    const handleStateUpdate = () => {
      if (autoOptimizeEnabled) {
        loadBalanceData();
      }
    };
    
    gameEngine.on('game:state_updated', handleStateUpdate);
    
    return () => {
      gameEngine.off('game:state_updated', handleStateUpdate);
    };
  }, [gameEngine, autoOptimizeEnabled]);

  const loadBalanceData = async () => {
    try {
      setIsAnalyzing(true);
      
      // 获取平衡分析
      const analysis = await gameEngine.getBalanceAnalysis();
      setBalanceMetrics(analysis.metrics);
      setAlerts(analysis.alerts);
      setRecommendations(analysis.recommendations);
      
      // 获取仪表板状态
      const dashboardState = gameEngine.getBalanceDashboardState();
      if (dashboardState.optimizationHistory) {
        setOptimizationResults(dashboardState.optimizationHistory);
      }
      
    } catch (error) {
      console.error('加载平衡数据失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runOptimization = async () => {
    try {
      setIsOptimizing(true);
      const results = await gameEngine.optimizeGameParameters();
      setOptimizationResults(prev => [...prev, ...results]);
      
      // 重新加载数据以显示优化后的状态
      await loadBalanceData();
      
    } catch (error) {
      console.error('参数优化失败:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const runBatchOptimization = async () => {
    try {
      setIsOptimizing(true);
      const report = await gameEngine.performBatchOptimization(5);
      
      console.log('批量优化完成:', report);
      await loadBalanceData();
      
    } catch (error) {
      console.error('批量优化失败:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const analyzeSensitivity = async () => {
    try {
      setIsAnalyzing(true);
      
      const parameterRanges: Record<keyof GameParameters, [number, number]> = {
        startingMoney: [5000, 20000],
        passingGoBonus: [1000, 5000],
        propertyPriceMultiplier: [0.5, 2.0],
        rentMultiplier: [0.5, 2.0],
        taxRate: [0.5, 2.0],
        skillCooldownBase: [1, 10],
        skillEffectMultiplier: [0.5, 2.0],
        maxSkillsPerPlayer: [1, 5],
        lotteryTicketPrice: [50, 200],
        lotteryJackpotMultiplier: [1.0, 5.0],
        insurancePremiumRate: [0.01, 0.1],
        bankLoanInterestRate: [0.02, 0.2],
        prisonBailMultiplier: [0.5, 2.0],
        maxRounds: [50, 200],
        turnTimeLimit: [30, 120],
        winConditionThreshold: [20000, 100000],
        zodiacSkillCooldownMultiplier: [0.5, 2.0],
        zodiacMoneyBonus: [0.5, 2.0],
        zodiacPropertyDiscount: [0.5, 1.5]
      };
      
      const range = parameterRanges[selectedParameter];
      const results = await gameEngine.analyzeParameterSensitivity(selectedParameter, range, 10);
      
      setSensitivityData(results.map(r => ({ value: r.value, score: r.score })));
      
    } catch (error) {
      console.error('敏感性分析失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetOptimization = () => {
    gameEngine.resetBalanceOptimization();
    setOptimizationResults([]);
    setParameterAdjustments([]);
    loadBalanceData();
  };

  const generateReport = () => {
    try {
      const report = gameEngine.generateBalanceReport();
      
      // 创建下载链接
      const blob = new Blob([report], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `balance-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('生成报告失败:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatNumber = (num: number) => {
    return num.toFixed(3);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            ⚖️ 游戏平衡和数值调优面板
          </h1>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoOptimizeEnabled}
                onChange={(e) => setAutoOptimizeEnabled(e.target.checked)}
                className="mr-2"
              />
              自动优化
            </label>
            <button
              onClick={loadBalanceData}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isAnalyzing ? '分析中...' : '刷新分析'}
            </button>
            <button
              onClick={generateReport}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              导出报告
            </button>
          </div>
        </div>

        {/* 平衡指标总览 */}
        {balanceMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">基尼系数</h3>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(balanceMetrics.giniCoefficient)}</p>
              <p className="text-sm text-blue-500">目标: 0.400</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">财富方差</h3>
              <p className="text-2xl font-bold text-green-600">{formatNumber(balanceMetrics.wealthVariance)}</p>
              <p className="text-sm text-green-500">越低越好</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">玩家参与度</h3>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(balanceMetrics.playerEngagement)}</p>
              <p className="text-sm text-purple-500">目标: 0.700</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-orange-800">游戏时长</h3>
              <p className="text-2xl font-bold text-orange-600">{Math.round(balanceMetrics.averageGameDuration / 60)}分</p>
              <p className="text-sm text-orange-500">目标: 60分钟</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 平衡警告 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⚠️ 平衡警告</h2>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-gray-500">暂无平衡问题</p>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{alert.description}</h4>
                      <p className="text-sm mt-1">
                        当前值: {formatNumber(alert.currentValue)} | 
                        目标值: {formatNumber(alert.targetValue)} | 
                        偏差: {formatNumber(alert.deviation)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">建议:</p>
                    <ul className="text-sm list-disc list-inside">
                      {alert.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 优化控制 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 参数优化</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={runOptimization}
                disabled={isOptimizing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isOptimizing ? '优化中...' : '快速优化'}
              </button>
              <button
                onClick={runBatchOptimization}
                disabled={isOptimizing}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {isOptimizing ? '优化中...' : '批量优化'}
              </button>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">参数敏感性分析</h3>
              <div className="flex space-x-2 mb-3">
                <select
                  value={selectedParameter}
                  onChange={(e) => setSelectedParameter(e.target.value as keyof GameParameters)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="startingMoney">起始资金</option>
                  <option value="rentMultiplier">租金倍数</option>
                  <option value="skillCooldownBase">技能冷却</option>
                  <option value="lotteryJackpotMultiplier">彩票奖金</option>
                </select>
                <button
                  onClick={analyzeSensitivity}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  分析
                </button>
              </div>
              
              {sensitivityData.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">敏感性图表:</h4>
                  <div className="h-32 bg-gray-100 rounded p-2">
                    {/* 简化的图表显示 */}
                    <div className="flex items-end justify-between h-full space-x-1">
                      {sensitivityData.map((point, index) => (
                        <div
                          key={index}
                          className="bg-blue-500 rounded-t"
                          style={{
                            height: `${(point.score / Math.max(...sensitivityData.map(p => p.score))) * 100}%`,
                            width: `${90 / sensitivityData.length}%`
                          }}
                          title={`值: ${point.value.toFixed(0)}, 得分: ${point.score.toFixed(2)}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={resetOptimization}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              重置优化
            </button>
          </div>
        </div>

        {/* 优化历史 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 优化历史</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {optimizationResults.length === 0 ? (
              <p className="text-gray-500">暂无优化记录</p>
            ) : (
              optimizationResults.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{result.parameter}</h4>
                      <p className="text-sm text-gray-600">
                        {result.oldValue.toFixed(2)} → {result.newValue.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600">
                        +{(result.improvement * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        置信度: {(result.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{result.reasoning}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 生肖平衡 */}
        {balanceMetrics && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🐲 生肖平衡分析</h2>
            <div className="space-y-3">
              {Object.entries(balanceMetrics.zodiacWinRates).map(([zodiac, winRate]) => (
                <div key={zodiac} className="flex items-center justify-between">
                  <span className="font-medium">{zodiac}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${winRate * 1200}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {(winRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">生肖财富分布</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {Object.entries(balanceMetrics.zodiacAverageWealth).slice(0, 6).map(([zodiac, wealth]) => (
                  <div key={zodiac} className="text-center p-2 bg-gray-100 rounded">
                    <div className="font-medium">{zodiac}</div>
                    <div className="text-gray-600">${wealth.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 推荐建议 */}
      {recommendations.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">💡 优化建议</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                <p className="text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BalancePanel;