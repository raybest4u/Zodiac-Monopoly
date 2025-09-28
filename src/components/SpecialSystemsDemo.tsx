import React, { useState, useEffect } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { UnifiedSpecialSystemManager } from '../special/UnifiedSpecialSystemManager';
import type { GameState, Player } from '../types/game';

interface SpecialSystemsDemoProps {
  gameEngine: GameEngine;
}

interface SystemStatus {
  prison: {
    totalPrisoners: number;
    totalSentences: number;
    totalReleases: number;
  };
  lottery: {
    totalTicketsSold: number;
    totalJackpot: number;
    totalWinners: number;
  };
  insurance: {
    totalPolicies: number;
    totalClaims: number;
    totalPayout: number;
  };
  banking: {
    totalLoans: number;
    totalDeposits: number;
    totalInterest: number;
  };
  teleportation: {
    totalTeleports: number;
    totalNodes: number;
  };
}

export const SpecialSystemsDemo: React.FC<SpecialSystemsDemoProps> = ({ gameEngine }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<'prison' | 'lottery' | 'insurance' | 'banking' | 'teleport' | 'special'>('lottery');
  const [actionLog, setActionLog] = useState<string[]>([]);

  useEffect(() => {
    const updateState = () => {
      const state = gameEngine.getGameState();
      setGameState(state);
      
      if (state) {
        const status = gameEngine.getSpecialSystemStatus();
        setSystemStatus(status);
        
        if (!selectedPlayer && state.players.length > 0) {
          setSelectedPlayer(state.players[0].id);
        }
      }
    };

    // 初始更新
    updateState();

    // 监听游戏状态变化
    const handleStateUpdate = () => updateState();
    gameEngine.on('game:state_updated', handleStateUpdate);
    gameEngine.on('special:action_executed', handleSpecialAction);

    return () => {
      gameEngine.off('game:state_updated', handleStateUpdate);
      gameEngine.off('special:action_executed', handleSpecialAction);
    };
  }, [gameEngine, selectedPlayer]);

  const handleSpecialAction = (data: any) => {
    const { playerId, systemType, actionData, result } = data;
    const player = gameState?.players.find(p => p.id === playerId);
    const playerName = player?.name || playerId;
    
    const message = `${playerName} 在 ${systemType} 系统执行了操作: ${JSON.stringify(actionData)} - ${result.success ? '成功' : '失败'}`;
    setActionLog(prev => [message, ...prev.slice(0, 9)]); // 保留最近10条记录
  };

  const executeSpecialAction = async (actionData: any) => {
    if (!selectedPlayer) return;

    try {
      const result = await gameEngine.executeSpecialAction(selectedPlayer, selectedSystem, actionData);
      console.log('Special action result:', result);
    } catch (error) {
      console.error('Special action failed:', error);
      setActionLog(prev => [`操作失败: ${error}`, ...prev.slice(0, 9)]);
    }
  };

  const renderPrisonPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">🔒 监狱系统</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => executeSpecialAction({ action: 'arrest', crime: 'trespassing' })}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          逮捕玩家
        </button>
        <button
          onClick={() => executeSpecialAction({ action: 'release', releaseType: 'bail' })}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          保释出狱
        </button>
        <button
          onClick={() => executeSpecialAction({ action: 'processTurn' })}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          处理监狱回合
        </button>
        <button
          onClick={() => executeSpecialAction({ action: 'release', releaseType: 'serve_time' })}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          服刑完毕
        </button>
      </div>
    </div>
  );

  const renderLotteryPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">🎲 彩票系统</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => executeSpecialAction({ action: 'buyTicket', numbers: [1, 2, 3, 4, 5] })}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
        >
          购买彩票 (1-5)
        </button>
        <button
          onClick={() => executeSpecialAction({ action: 'buyTicket', numbers: [6, 7, 8, 9, 10] })}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          购买彩票 (6-10)
        </button>
        <button
          onClick={() => executeSpecialAction({ action: 'drawWinner', lotteryId: 'daily' })}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          开奖
        </button>
        <button
          onClick={() => executeSpecialAction({ action: 'buyTicket', numbers: Array.from({length: 5}, () => Math.floor(Math.random() * 10) + 1) })}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          随机选号
        </button>
      </div>
    </div>
  );

  const renderInsurancePanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">🛡️ 保险系统</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => executeSpecialAction({ 
            action: 'purchase', 
            policyType: 'property', 
            coverage: [{ type: 'property_damage', amount: 5000 }] 
          })}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          购买房产保险
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'purchase', 
            policyType: 'life', 
            coverage: [{ type: 'life_insurance', amount: 10000 }] 
          })}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        >
          购买人寿保险
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'claim', 
            policyId: 'property_001', 
            claimType: 'property_damage', 
            amount: 2000 
          })}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          申请理赔
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'purchase', 
            policyType: 'travel', 
            coverage: [{ type: 'travel_accident', amount: 3000 }] 
          })}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
        >
          购买旅行保险
        </button>
      </div>
    </div>
  );

  const renderBankingPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">🏦 银行系统</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => executeSpecialAction({ 
            action: 'loan', 
            loanType: 'personal', 
            amount: 3000, 
            term: 12, 
            collateral: [] 
          })}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          申请个人贷款
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'loan', 
            loanType: 'mortgage', 
            amount: 10000, 
            term: 24, 
            collateral: [{ type: 'property', id: 'prop_001', value: 15000 }] 
          })}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          申请房屋贷款
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'deposit', 
            amount: 2000, 
            term: 6 
          })}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          存款
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'repay', 
            loanId: 'loan_001', 
            amount: 1000 
          })}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          还款
        </button>
      </div>
    </div>
  );

  const renderTeleportPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">🚪 传送系统</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => executeSpecialAction({ 
            action: 'teleport', 
            fromNode: 'start', 
            toNode: 'center' 
          })}
          className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
        >
          传送到中心
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'teleport', 
            fromNode: 'center', 
            toNode: 'commercial' 
          })}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
        >
          传送到商业区
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'createNode', 
            position: { x: 100, y: 100 }, 
            nodeType: 'public', 
            requirements: [] 
          })}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        >
          创建传送点
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'teleport', 
            fromNode: 'commercial', 
            toNode: 'residential' 
          })}
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
        >
          传送到住宅区
        </button>
      </div>
    </div>
  );

  const renderSpecialPanel = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">✨ 特殊事件</h3>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => executeSpecialAction({ 
            action: 'redistribute', 
            redistributionType: 'tax_based' 
          })}
          className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
        >
          税收重分配
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'redistribute', 
            redistributionType: 'robin_hood' 
          })}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          劫富济贫
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'specialEvent', 
            eventType: 'market_crash' 
          })}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          市场崩盘
        </button>
        <button
          onClick={() => executeSpecialAction({ 
            action: 'specialEvent', 
            eventType: 'economic_boom' 
          })}
          className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
        >
          经济繁荣
        </button>
      </div>
    </div>
  );

  const renderSystemPanel = () => {
    switch (selectedSystem) {
      case 'prison': return renderPrisonPanel();
      case 'lottery': return renderLotteryPanel();
      case 'insurance': return renderInsurancePanel();
      case 'banking': return renderBankingPanel();
      case 'teleport': return renderTeleportPanel();
      case 'special': return renderSpecialPanel();
      default: return <div>请选择一个系统</div>;
    }
  };

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading game state...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          🎮 Day 3: 监狱和特殊机制系统演示
        </h1>
        
        {/* 玩家选择 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择玩家:
          </label>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {gameState.players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.zodiacSign}) - ${player.money}
              </option>
            ))}
          </select>
        </div>

        {/* 系统选择 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'prison', label: '🔒 监狱', color: 'bg-red-100 text-red-800' },
              { key: 'lottery', label: '🎲 彩票', color: 'bg-yellow-100 text-yellow-800' },
              { key: 'insurance', label: '🛡️ 保险', color: 'bg-blue-100 text-blue-800' },
              { key: 'banking', label: '🏦 银行', color: 'bg-green-100 text-green-800' },
              { key: 'teleport', label: '🚪 传送', color: 'bg-purple-100 text-purple-800' },
              { key: 'special', label: '✨ 特殊', color: 'bg-pink-100 text-pink-800' }
            ].map((system) => (
              <button
                key={system.key}
                onClick={() => setSelectedSystem(system.key as any)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedSystem === system.key 
                    ? 'bg-indigo-500 text-white' 
                    : system.color
                }`}
              >
                {system.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 操作面板 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {renderSystemPanel()}
        </div>

        {/* 状态面板 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 系统状态</h3>
          {systemStatus && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800">监狱系统</h4>
                <div className="text-sm text-red-600">
                  <p>在押人数: {systemStatus.prison.totalPrisoners}</p>
                  <p>总判刑数: {systemStatus.prison.totalSentences}</p>
                  <p>总释放数: {systemStatus.prison.totalReleases}</p>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800">彩票系统</h4>
                <div className="text-sm text-yellow-600">
                  <p>彩票销售: {systemStatus.lottery.totalTicketsSold}</p>
                  <p>奖金池: ${systemStatus.lottery.totalJackpot}</p>
                  <p>中奖人数: {systemStatus.lottery.totalWinners}</p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">保险系统</h4>
                <div className="text-sm text-blue-600">
                  <p>保单数量: {systemStatus.insurance.totalPolicies}</p>
                  <p>理赔次数: {systemStatus.insurance.totalClaims}</p>
                  <p>理赔金额: ${systemStatus.insurance.totalPayout}</p>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">银行系统</h4>
                <div className="text-sm text-green-600">
                  <p>贷款数量: {systemStatus.banking.totalLoans}</p>
                  <p>存款总额: ${systemStatus.banking.totalDeposits}</p>
                  <p>利息收入: ${systemStatus.banking.totalInterest}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 操作日志 */}
      <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 操作日志</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {actionLog.length === 0 ? (
            <p className="text-gray-500">暂无操作记录</p>
          ) : (
            actionLog.map((log, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded border-l-4 border-blue-500 text-sm"
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecialSystemsDemo;