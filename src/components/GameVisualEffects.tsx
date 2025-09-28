/**
 * 游戏视觉效果组件
 */

import React, { useState, useEffect } from 'react';

interface DiceRollAnimationProps {
  isRolling: boolean;
  result?: number[];
  onAnimationComplete?: () => void;
}

export const DiceRollAnimation: React.FC<DiceRollAnimationProps> = ({
  isRolling,
  result,
  onAnimationComplete
}) => {
  const [currentValues, setCurrentValues] = useState([1, 1]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setShowResult(false);
      const interval = setInterval(() => {
        setCurrentValues([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        if (result) {
          setCurrentValues(result);
          setShowResult(true);
          onAnimationComplete?.();
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isRolling, result, onAnimationComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      display: isRolling || showResult ? 'flex' : 'none',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'rgba(0,0,0,0.8)',
      padding: '40px',
      borderRadius: '20px',
      backdropFilter: 'blur(10px)'
    }}>
      <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '1.5rem' }}>
        🎲 掷骰子
      </h2>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {currentValues.map((value, index) => (
          <div
            key={index}
            style={{
              width: '80px',
              height: '80px',
              background: 'white',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#333',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              animation: isRolling ? 'diceShake 0.1s infinite' : showResult ? 'diceResult 0.6s ease-out' : 'none'
            }}
          >
            {value}
          </div>
        ))}
      </div>

      {showResult && (
        <div style={{
          color: '#ffd700',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          animation: 'fadeInUp 0.5s ease-out'
        }}>
          总点数: {currentValues.reduce((a, b) => a + b, 0)}
        </div>
      )}

      <style jsx>{`
        @keyframes diceShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        
        @keyframes diceResult {
          0% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

interface PlayerMoveAnimationProps {
  isMoving: boolean;
  playerName: string;
  fromPosition: number;
  toPosition: number;
  onAnimationComplete?: () => void;
}

export const PlayerMoveAnimation: React.FC<PlayerMoveAnimationProps> = ({
  isMoving,
  playerName,
  fromPosition,
  toPosition,
  onAnimationComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = Math.abs(toPosition - fromPosition);

  useEffect(() => {
    if (isMoving && steps > 0) {
      let stepCount = 0;
      const interval = setInterval(() => {
        stepCount++;
        setCurrentStep(stepCount);
        
        if (stepCount >= steps) {
          clearInterval(interval);
          setTimeout(() => {
            onAnimationComplete?.();
          }, 500);
        }
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isMoving, steps, onAnimationComplete]);

  if (!isMoving) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '15px 30px',
      borderRadius: '25px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
      animation: 'slideDown 0.5s ease-out'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px' }}>
          🚶‍♂️ {playerName} 移动中...
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          {fromPosition} → {toPosition} ({currentStep}/{steps})
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          0% { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

interface GameEventNotificationProps {
  event: {
    type: string;
    message: string;
    icon: string;
    color: string;
  } | null;
  onClose?: () => void;
}

export const GameEventNotification: React.FC<GameEventNotificationProps> = ({
  event,
  onClose
}) => {
  useEffect(() => {
    if (event) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 998,
      background: `linear-gradient(135deg, ${event.color}90 0%, ${event.color}70 100%)`,
      color: 'white',
      padding: '20px 30px',
      borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(10px)',
      animation: 'eventPop 0.6s ease-out',
      maxWidth: '400px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
        {event.icon}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px' }}>
        游戏事件
      </div>
      <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
        {event.message}
      </div>

      <style jsx>{`
        @keyframes eventPop {
          0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
          50% { transform: translateX(-50%) scale(1.1); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

interface MoneyAnimationProps {
  show: boolean;
  amount: number;
  isGain: boolean;
  position: { x: number; y: number };
  onAnimationComplete?: () => void;
}

export const MoneyAnimation: React.FC<MoneyAnimationProps> = ({
  show,
  amount,
  isGain,
  position,
  onAnimationComplete
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onAnimationComplete]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      zIndex: 997,
      color: isGain ? '#4CAF50' : '#F44336',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      pointerEvents: 'none',
      animation: 'moneyFloat 2s ease-out forwards'
    }}>
      {isGain ? '+' : '-'}¥{Math.abs(amount).toLocaleString()}

      <style jsx>{`
        @keyframes moneyFloat {
          0% { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
          100% { 
            transform: translateY(-100px) scale(1.2); 
            opacity: 0; 
          }
        }
      `}</style>
    </div>
  );
};

export default {
  DiceRollAnimation,
  PlayerMoveAnimation,
  GameEventNotification,
  MoneyAnimation
};