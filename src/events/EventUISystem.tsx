/**
 * 事件UI反馈系统 - 事件的可视化展示和用户交互
 * 包括事件弹窗、动画效果、选择界面等
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EventEmitter } from '../utils/EventEmitter';
import type { RandomEvent, EventChoice, GameEvent } from './EventSystem';

export interface EventUIConfig {
  showAnimations: boolean;
  autoCloseDelay: number;
  maxConcurrentEvents: number;
  soundEnabled: boolean;
  hapticFeedback: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface EventUIState {
  activeEvents: EventUIInstance[];
  eventQueue: EventUIInstance[];
  isProcessing: boolean;
}

export interface EventUIInstance {
  id: string;
  event: RandomEvent | GameEvent;
  type: 'notification' | 'choice' | 'animation' | 'modal';
  priority: number;
  
  // UI配置
  ui: {
    title: string;
    description: string;
    icon?: string;
    theme: EventTheme;
    position: UIPosition;
    duration?: number;
  };
  
  // 交互配置
  interaction: {
    closeable: boolean;
    choices?: EventChoice[];
    onChoice?: (choiceId: string) => void;
    onClose?: () => void;
    onTimeout?: () => void;
  };
  
  // 状态
  status: 'pending' | 'displaying' | 'interacting' | 'completed';
  createdAt: number;
  displayedAt?: number;
  completedAt?: number;
}

export interface EventTheme {
  type: 'positive' | 'negative' | 'neutral' | 'special';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  effects: {
    glow: boolean;
    particles: boolean;
    shake: boolean;
    bounce: boolean;
  };
}

export interface UIPosition {
  x: 'left' | 'center' | 'right';
  y: 'top' | 'center' | 'bottom';
  offset?: { x: number; y: number };
}

/**
 * 事件UI系统主类
 */
export class EventUISystem extends EventEmitter {
  private config: EventUIConfig;
  private uiState: EventUIState;
  private themes: Map<string, EventTheme>;
  
  constructor(config: Partial<EventUIConfig> = {}) {
    super();
    
    this.config = {
      showAnimations: true,
      autoCloseDelay: 5000,
      maxConcurrentEvents: 3,
      soundEnabled: true,
      hapticFeedback: true,
      animationSpeed: 'normal',
      ...config
    };
    
    this.uiState = {
      activeEvents: [],
      eventQueue: [],
      isProcessing: false
    };
    
    this.themes = new Map();
    this.initializeThemes();
    this.startUIUpdateLoop();
  }

  /**
   * 显示事件
   */
  showEvent(event: RandomEvent | GameEvent, options: Partial<EventUIInstance> = {}): string {
    const uiInstance: EventUIInstance = {
      id: `ui_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      event,
      type: options.type || (event.choices ? 'choice' : 'notification'),
      priority: options.priority || this.calculateEventPriority(event),
      ui: {
        title: event.name,
        description: event.description,
        icon: this.getEventIcon(event),
        theme: this.getEventTheme(event),
        position: options.ui?.position || { x: 'center', y: 'center' },
        duration: options.ui?.duration || this.config.autoCloseDelay
      },
      interaction: {
        closeable: options.interaction?.closeable ?? true,
        choices: event.choices,
        onChoice: options.interaction?.onChoice,
        onClose: options.interaction?.onClose,
        onTimeout: options.interaction?.onTimeout
      },
      status: 'pending',
      createdAt: Date.now(),
      ...options
    };

    // 添加到队列或直接显示
    if (this.uiState.activeEvents.length < this.config.maxConcurrentEvents) {
      this.displayEventUI(uiInstance);
    } else {
      this.uiState.eventQueue.push(uiInstance);
      this.sortEventQueue();
    }

    this.emit('eventQueued', uiInstance);
    return uiInstance.id;
  }

  /**
   * 隐藏事件
   */
  hideEvent(eventId: string): boolean {
    const eventIndex = this.uiState.activeEvents.findIndex(e => e.id === eventId);
    
    if (eventIndex !== -1) {
      const event = this.uiState.activeEvents[eventIndex];
      event.status = 'completed';
      event.completedAt = Date.now();
      
      this.uiState.activeEvents.splice(eventIndex, 1);
      this.processEventQueue();
      
      this.emit('eventHidden', event);
      return true;
    }
    
    return false;
  }

  /**
   * 处理用户选择
   */
  handleChoice(eventId: string, choiceId: string): void {
    const event = this.uiState.activeEvents.find(e => e.id === eventId);
    
    if (!event || !event.interaction.choices) {
      return;
    }
    
    const choice = event.interaction.choices.find(c => c.id === choiceId);
    
    if (!choice) {
      return;
    }
    
    // 执行选择回调
    if (event.interaction.onChoice) {
      event.interaction.onChoice(choiceId);
    }
    
    // 触发选择效果
    this.emit('choiceMade', {
      eventId,
      choiceId,
      choice,
      event: event.event
    });
    
    // 关闭事件UI
    this.hideEvent(eventId);
  }

  /**
   * 显示通知
   */
  showNotification(
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration = 3000
  ): string {
    const notificationEvent: GameEvent = {
      id: `notification_${Date.now()}`,
      type: 'game_event_triggered',
      data: { title, message, notificationType: type },
      timestamp: Date.now(),
      processed: false,
      priority: 'normal'
    };

    return this.showEvent(notificationEvent, {
      type: 'notification',
      ui: {
        title,
        description: message,
        theme: this.getNotificationTheme(type),
        position: { x: 'right', y: 'top' },
        duration
      },
      interaction: {
        closeable: true,
        onTimeout: () => this.hideEvent(notificationEvent.id)
      }
    });
  }

  /**
   * 显示选择弹窗
   */
  showChoiceModal(
    title: string,
    description: string,
    choices: EventChoice[],
    onChoice: (choiceId: string) => void
  ): string {
    const choiceEvent: RandomEvent = {
      id: `choice_${Date.now()}`,
      name: title,
      description,
      type: 'neutral',
      rarity: 'common',
      conditions: [],
      effects: [],
      choices,
      timestamp: Date.now()
    };

    return this.showEvent(choiceEvent, {
      type: 'modal',
      ui: {
        title,
        description,
        theme: this.themes.get('neutral')!,
        position: { x: 'center', y: 'center' }
      },
      interaction: {
        closeable: false,
        choices,
        onChoice
      }
    });
  }

  // 私有方法

  /**
   * 初始化主题
   */
  private initializeThemes(): void {
    // 正面事件主题
    this.themes.set('positive', {
      type: 'positive',
      colors: {
        primary: '#10B981',
        secondary: '#34D399',
        background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
        text: '#065F46'
      },
      effects: {
        glow: true,
        particles: true,
        shake: false,
        bounce: true
      }
    });

    // 负面事件主题
    this.themes.set('negative', {
      type: 'negative',
      colors: {
        primary: '#EF4444',
        secondary: '#F87171',
        background: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)',
        text: '#991B1B'
      },
      effects: {
        glow: true,
        particles: false,
        shake: true,
        bounce: false
      }
    });

    // 中性事件主题
    this.themes.set('neutral', {
      type: 'neutral',
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        background: 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)',
        text: '#374151'
      },
      effects: {
        glow: false,
        particles: false,
        shake: false,
        bounce: false
      }
    });

    // 特殊事件主题
    this.themes.set('special', {
      type: 'special',
      colors: {
        primary: '#F59E0B',
        secondary: '#FBBF24',
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
        text: '#92400E'
      },
      effects: {
        glow: true,
        particles: true,
        shake: false,
        bounce: true
      }
    });
  }

  /**
   * 显示事件UI
   */
  private displayEventUI(uiInstance: EventUIInstance): void {
    uiInstance.status = 'displaying';
    uiInstance.displayedAt = Date.now();
    
    this.uiState.activeEvents.push(uiInstance);
    
    // 播放音效
    if (this.config.soundEnabled) {
      this.playEventSound(uiInstance.event);
    }
    
    // 触发触觉反馈
    if (this.config.hapticFeedback) {
      this.triggerHapticFeedback(uiInstance.event);
    }
    
    // 设置自动关闭
    if (uiInstance.ui.duration && uiInstance.interaction.closeable) {
      setTimeout(() => {
        if (uiInstance.status === 'displaying') {
          if (uiInstance.interaction.onTimeout) {
            uiInstance.interaction.onTimeout();
          }
          this.hideEvent(uiInstance.id);
        }
      }, uiInstance.ui.duration);
    }
    
    this.emit('eventDisplayed', uiInstance);
  }

  /**
   * 处理事件队列
   */
  private processEventQueue(): void {
    if (this.uiState.isProcessing) return;
    
    this.uiState.isProcessing = true;
    
    while (
      this.uiState.eventQueue.length > 0 && 
      this.uiState.activeEvents.length < this.config.maxConcurrentEvents
    ) {
      const nextEvent = this.uiState.eventQueue.shift()!;
      this.displayEventUI(nextEvent);
    }
    
    this.uiState.isProcessing = false;
  }

  /**
   * 排序事件队列
   */
  private sortEventQueue(): void {
    this.uiState.eventQueue.sort((a, b) => {
      // 按优先级排序，优先级高的先显示
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // 同优先级按创建时间排序
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * 计算事件优先级
   */
  private calculateEventPriority(event: RandomEvent | GameEvent): number {
    if ('rarity' in event) {
      switch (event.rarity) {
        case 'legendary': return 10;
        case 'rare': return 7;
        case 'uncommon': return 5;
        case 'common': return 3;
        default: return 1;
      }
    }
    
    if ('priority' in event) {
      switch (event.priority) {
        case 'critical': return 10;
        case 'high': return 7;
        case 'normal': return 5;
        case 'low': return 3;
        default: return 1;
      }
    }
    
    return 1;
  }

  /**
   * 获取事件图标
   */
  private getEventIcon(event: RandomEvent | GameEvent): string {
    if ('type' in event) {
      switch (event.type) {
        case 'positive': return '🌟';
        case 'negative': return '⚠️';
        case 'neutral': return 'ℹ️';
        default: return '🎲';
      }
    }
    
    return '🎮';
  }

  /**
   * 获取事件主题
   */
  private getEventTheme(event: RandomEvent | GameEvent): EventTheme {
    if ('type' in event) {
      return this.themes.get(event.type) || this.themes.get('neutral')!;
    }
    
    return this.themes.get('neutral')!;
  }

  /**
   * 获取通知主题
   */
  private getNotificationTheme(type: string): EventTheme {
    switch (type) {
      case 'success': return this.themes.get('positive')!;
      case 'error': return this.themes.get('negative')!;
      case 'warning': return this.themes.get('special')!;
      default: return this.themes.get('neutral')!;
    }
  }

  /**
   * 播放事件音效
   */
  private playEventSound(event: RandomEvent | GameEvent): void {
    if ('type' in event) {
      const soundMap: Record<string, string> = {
        'positive': 'event_positive',
        'negative': 'event_negative',
        'neutral': 'event_neutral'
      };
      
      const soundId = soundMap[event.type] || 'event_default';
      this.emit('playSound', { soundId, volume: 0.7 });
    }
  }

  /**
   * 触发触觉反馈
   */
  private triggerHapticFeedback(event: RandomEvent | GameEvent): void {
    if ('type' in event) {
      const hapticMap: Record<string, string> = {
        'positive': 'light',
        'negative': 'heavy',
        'neutral': 'medium'
      };
      
      const hapticType = hapticMap[event.type] || 'medium';
      this.emit('hapticFeedback', { type: hapticType });
    }
  }

  /**
   * 开始UI更新循环
   */
  private startUIUpdateLoop(): void {
    setInterval(() => {
      this.updateActiveEvents();
    }, 100); // 10fps更新频率
  }

  /**
   * 更新活动事件
   */
  private updateActiveEvents(): void {
    // 清理已完成的事件
    this.uiState.activeEvents = this.uiState.activeEvents.filter(event => 
      event.status !== 'completed'
    );
    
    // 处理等待中的事件
    this.processEventQueue();
  }

  /**
   * 获取UI状态
   */
  getUIState(): EventUIState {
    return { ...this.uiState };
  }

  /**
   * 获取系统统计
   */
  getSystemStats(): any {
    return {
      activeEvents: this.uiState.activeEvents.length,
      queuedEvents: this.uiState.eventQueue.length,
      isProcessing: this.uiState.isProcessing,
      registeredThemes: this.themes.size,
      config: this.config
    };
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.uiState.activeEvents = [];
    this.uiState.eventQueue = [];
    this.themes.clear();
    this.removeAllListeners();
  }
}

// React组件：事件显示组件
export const EventDisplay: React.FC<{
  eventInstance: EventUIInstance;
  onChoice?: (choiceId: string) => void;
  onClose?: () => void;
}> = ({ eventInstance, onChoice, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (eventInstance.ui.theme.effects.bounce) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [eventInstance]);

  const handleChoice = useCallback((choiceId: string) => {
    if (onChoice) {
      onChoice(choiceId);
    }
    setIsVisible(false);
  }, [onChoice]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300);
  }, [onClose]);

  const theme = eventInstance.ui.theme;
  const containerStyle = useMemo(() => ({
    background: theme.colors.background,
    borderLeft: `4px solid ${theme.colors.primary}`,
    boxShadow: theme.effects.glow 
      ? `0 0 20px ${theme.colors.primary}40`
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
    opacity: isVisible ? 1 : 0,
    animation: isAnimating ? 'bounce 0.6s ease-out' : undefined
  }), [theme, isVisible, isAnimating]);

  return (
    <div 
      className={`event-display ${eventInstance.type} ${theme.type}`}
      style={containerStyle}
    >
      <div className="event-header">
        <div className="event-icon">{eventInstance.ui.icon}</div>
        <div className="event-title" style={{ color: theme.colors.text }}>
          {eventInstance.ui.title}
        </div>
        {eventInstance.interaction.closeable && (
          <button 
            className="event-close"
            onClick={handleClose}
            style={{ color: theme.colors.text }}
          >
            ×
          </button>
        )}
      </div>
      
      <div 
        className="event-description"
        style={{ color: theme.colors.text }}
      >
        {eventInstance.ui.description}
      </div>
      
      {eventInstance.interaction.choices && (
        <div className="event-choices">
          {eventInstance.interaction.choices.map((choice) => (
            <button
              key={choice.id}
              className="event-choice-button"
              style={{
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: `1px solid ${theme.colors.secondary}`
              }}
              onClick={() => handleChoice(choice.id)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// React组件：事件容器组件
export const EventUIContainer: React.FC<{
  eventUISystem: EventUISystem;
}> = ({ eventUISystem }) => {
  const [uiState, setUIState] = useState<EventUIState>(eventUISystem.getUIState());

  useEffect(() => {
    const handleUpdate = () => {
      setUIState(eventUISystem.getUIState());
    };

    eventUISystem.on('eventDisplayed', handleUpdate);
    eventUISystem.on('eventHidden', handleUpdate);
    eventUISystem.on('eventQueued', handleUpdate);

    return () => {
      eventUISystem.off('eventDisplayed', handleUpdate);
      eventUISystem.off('eventHidden', handleUpdate);
      eventUISystem.off('eventQueued', handleUpdate);
    };
  }, [eventUISystem]);

  const handleChoice = useCallback((eventId: string, choiceId: string) => {
    eventUISystem.handleChoice(eventId, choiceId);
  }, [eventUISystem]);

  const handleClose = useCallback((eventId: string) => {
    eventUISystem.hideEvent(eventId);
  }, [eventUISystem]);

  return (
    <div className="event-ui-container">
      <div className="active-events">
        {uiState.activeEvents.map((eventInstance) => (
          <EventDisplay
            key={eventInstance.id}
            eventInstance={eventInstance}
            onChoice={(choiceId) => handleChoice(eventInstance.id, choiceId)}
            onClose={() => handleClose(eventInstance.id)}
          />
        ))}
      </div>
      
      {uiState.eventQueue.length > 0 && (
        <div className="event-queue-indicator">
          +{uiState.eventQueue.length} 个事件等待中...
        </div>
      )}
    </div>
  );
};