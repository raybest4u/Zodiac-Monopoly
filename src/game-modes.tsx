/**
 * 单人对战AI游戏模式选择
 */

import React, { useState } from 'react';
import type { GameConfig } from './types/storage';

// 预设的AI对手组合
const AI_PRESETS = {
  beginner: {
    name: '新手练习',
    description: '适合新手玩家，AI较为温和',
    opponents: [
      {
        id: 'easy_ox',
        name: '温和小牛',
        zodiac: '牛' as any,
        difficulty: 'easy' as any,
        strategy: 'conservative' as any
      },
      {
        id: 'easy_sheep',
        name: '友善小羊',
        zodiac: '羊' as any,
        difficulty: 'easy' as any,
        strategy: 'balanced' as any
      }
    ],
    startingMoney: 2000,
    maxRounds: 30
  },
  
  standard: {
    name: '标准对战',
    description: '平衡的游戏体验，适合大多数玩家',
    opponents: [
      {
        id: 'med_tiger',
        name: '猛虎霸主',
        zodiac: '虎' as any,
        difficulty: 'medium' as any,
        strategy: 'aggressive' as any
      },
      {
        id: 'med_rabbit',
        name: '智兔谋士',
        zodiac: '兔' as any,
        difficulty: 'medium' as any,
        strategy: 'conservative' as any
      },
      {
        id: 'med_monkey',
        name: '灵猴商王',
        zodiac: '猴' as any,
        difficulty: 'medium' as any,
        strategy: 'economic' as any
      }
    ],
    startingMoney: 1500,
    maxRounds: 50
  },
  
  expert: {
    name: '专家挑战',
    description: '高难度AI，需要高超策略',
    opponents: [
      {
        id: 'hard_dragon',
        name: '霸王神龙',
        zodiac: '龙' as any,
        difficulty: 'hard' as any,
        strategy: 'aggressive' as any
      },
      {
        id: 'hard_snake',
        name: '毒蛇商贾',
        zodiac: '蛇' as any,
        difficulty: 'hard' as any,
        strategy: 'economic' as any
      },
      {
        id: 'hard_horse',
        name: '千里神驹',
        zodiac: '马' as any,
        difficulty: 'hard' as any,
        strategy: 'balanced' as any
      }
    ],
    startingMoney: 1000,
    maxRounds: 80
  },
  
  legendary: {
    name: '传奇对决',
    description: '最强AI阵容，极限挑战',
    opponents: [
      {
        id: 'legend_dragon',
        name: '九天真龙',
        zodiac: '龙' as any,
        difficulty: 'expert' as any,
        strategy: 'adaptive' as any
      },
      {
        id: 'legend_phoenix',
        name: '不死凤凰',
        zodiac: '鸡' as any,
        difficulty: 'expert' as any,
        strategy: 'aggressive' as any
      },
      {
        id: 'legend_tiger',
        name: '白虎战神',
        zodiac: '虎' as any,
        difficulty: 'expert' as any,
        strategy: 'economic' as any
      },
      {
        id: 'legend_serpent',
        name: '玄武神蛇',
        zodiac: '蛇' as any,
        difficulty: 'expert' as any,
        strategy: 'conservative' as any
      }
    ],
    startingMoney: 800,
    maxRounds: 100
  }
};

interface GameModeSelectionProps {
  onModeSelect: (config: GameConfig) => void;
  onBack?: () => void;
}

export const GameModeSelection: React.FC<GameModeSelectionProps> = ({ onModeSelect, onBack }) => {
  const [selectedMode, setSelectedMode] = useState<string>('standard');
  const [playerName, setPlayerName] = useState('玩家');
  const [playerZodiac, setPlayerZodiac] = useState<any>('龙');

  const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

  const handleStartGame = () => {
    const preset = AI_PRESETS[selectedMode as keyof typeof AI_PRESETS];
    
    const config: GameConfig = {
      playerName,
      playerZodiac,
      difficulty: preset.opponents[0].difficulty,
      aiOpponents: preset.opponents,
      gameSettings: {
        startingMoney: preset.startingMoney,
        maxRounds: preset.maxRounds,
        winCondition: 'wealth_goal'
      }
    };
    
    onModeSelect(config);
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            🎲 十二生肖大富翁
          </h1>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            单人对战AI模式选择
          </h2>
          <p style={{ opacity: 0.8, fontSize: '1rem' }}>
            选择您的对手，开始单人挑战之旅！
          </p>
        </div>

        {/* 玩家设置 */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>👤 玩家设置</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>玩家姓名:</label>
              <input 
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>选择生肖:</label>
              <select 
                value={playerZodiac}
                onChange={(e) => setPlayerZodiac(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '1rem'
                }}
              >
                {zodiacs.map(zodiac => (
                  <option key={zodiac} value={zodiac}>{zodiac}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 游戏模式选择 */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🎮 选择游戏模式</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {Object.entries(AI_PRESETS).map(([key, preset]) => (
              <div 
                key={key}
                onClick={() => setSelectedMode(key)}
                style={{ 
                  background: selectedMode === key 
                    ? 'rgba(255,215,0,0.3)' 
                    : 'rgba(255,255,255,0.1)',
                  border: selectedMode === key 
                    ? '2px solid #ffd700' 
                    : '2px solid rgba(255,255,255,0.3)',
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedMode !== key) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedMode !== key) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }
                }}
              >
                <h4 style={{ 
                  color: selectedMode === key ? '#ffd700' : 'white',
                  marginBottom: '0.5rem',
                  fontSize: '1.2rem'
                }}>
                  {preset.name}
                </h4>
                <p style={{ 
                  fontSize: '0.9rem', 
                  opacity: 0.8, 
                  marginBottom: '1rem' 
                }}>
                  {preset.description}
                </p>
                <div style={{ fontSize: '0.8rem' }}>
                  <p>💰 起始资金: {preset.startingMoney}</p>
                  <p>🎯 最大回合: {preset.maxRounds}</p>
                  <p>🤖 AI对手: {preset.opponents.length}位</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 选中模式详情 */}
        {selectedMode && (
          <div style={{ 
            background: 'rgba(255,215,0,0.2)', 
            padding: '1.5rem', 
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '2px solid rgba(255,215,0,0.5)'
          }}>
            <h3 style={{ color: '#ffd700', marginBottom: '1rem' }}>
              🤖 {AI_PRESETS[selectedMode as keyof typeof AI_PRESETS].name} - AI对手详情
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {AI_PRESETS[selectedMode as keyof typeof AI_PRESETS].opponents.map((opponent, index) => (
                <div key={opponent.id} style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '1rem', 
                  borderRadius: '6px' 
                }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>{opponent.name}</h4>
                  <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    生肖: {opponent.zodiac} | 难度: {opponent.difficulty}
                  </p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    策略: {opponent.strategy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={handleStartGame}
            style={{
              padding: '15px 40px',
              fontSize: '1.2rem',
              background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
              color: '#333',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              marginRight: '1rem'
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
            🚀 开始单人对战
          </button>
          
          {onBack && (
            <button 
              onClick={onBack}
              style={{
                padding: '15px 30px',
                fontSize: '1rem',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
            >
              ← 返回
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameModeSelection;