/**
 * 事件系统演示和集成示例
 * 展示如何在游戏中使用完整的事件系统
 */

import { EventTriggerSystem } from './EventTriggerSystem';
import { EventProcessingSystem } from './EventProcessor';
import { EventResponseSystem } from './EventResponseSystem';
import { RandomEventSystem } from './RandomEventSystem';
import { EventEffectSystem } from './EventEffectSystem';
import { EventUISystem } from './EventUISystem';
import type { GameEvent, EventType } from './EventSystem';

export class IntegratedEventSystem {
  private triggerSystem: EventTriggerSystem;
  private processingSystem: EventProcessingSystem;
  private responseSystem: EventResponseSystem;
  private randomEventSystem: RandomEventSystem;
  private effectSystem: EventEffectSystem;
  private uiSystem: EventUISystem;

  private gameState: any = {};
  private isRunning = false;

  constructor() {
    this.initializeSystems();
    this.setupEventHandlers();
    this.registerDefaultProcessors();
    this.registerDefaultResponses();
    this.setupRandomEvents();
  }

  private initializeSystems(): void {
    this.triggerSystem = new EventTriggerSystem();
    this.processingSystem = new EventProcessingSystem({
      batchSize: 5,
      maxConcurrent: 3,
      timeoutMs: 10000,
      retryAttempts: 2
    });
    this.responseSystem = new EventResponseSystem();
    this.randomEventSystem = new RandomEventSystem({
      baseChance: 0.15,
      maxEventsPerCheck: 2,
      enableEventChains: true
    });
    this.effectSystem = new EventEffectSystem();
    this.uiSystem = new EventUISystem();
  }

  private setupEventHandlers(): void {
    // 系统间事件转发
    this.processingSystem.on('eventProcessed', (data) => {
      if (data.result.success && data.result.nextEvents) {
        for (const nextEventData of data.result.nextEvents) {
          const nextEvent: GameEvent = {
            ...nextEventData,
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            processed: false
          };
          this.processingSystem.addEvent(nextEvent);
        }
      }
    });

    // 随机事件生成后自动处理
    this.randomEventSystem.on('eventGenerated', (randomEvent) => {
      const gameEvent: GameEvent = {
        id: randomEvent.id,
        type: 'random-event' as EventType,
        priority: 'normal',
        timestamp: Date.now(),
        data: randomEvent,
        processed: false
      };
      this.processingSystem.addEvent(gameEvent);
    });

    // 效果应用完成后更新UI
    this.effectSystem.on('effectApplied', (result) => {
      if (result.success && result.changes) {
        this.uiSystem.showNotification({
          type: 'effect',
          message: `效果已应用: ${JSON.stringify(result.changes)}`,
          duration: 3000
        });
      }
    });
  }

  private registerDefaultProcessors(): void {
    // 随机事件处理器
    this.processingSystem.registerProcessor({
      id: 'random-event-processor',
      name: '随机事件处理器',
      eventTypes: ['random-event' as EventType],
      priority: 5,
      enabled: true,
      process: async (event, context) => {
        const randomEvent = event.data;
        
        // 显示事件UI
        const uiInstanceId = this.uiSystem.showEvent(randomEvent, {
          theme: randomEvent.type,
          position: 'center'
        });

        // 应用事件效果
        const effectResults = [];
        if (randomEvent.effects && randomEvent.effects.length > 0) {
          for (const effect of randomEvent.effects) {
            const effectContext = {
              gameState: context.gameState,
              playerState: this.getCurrentPlayerState(),
              boardState: this.getBoardState(),
              eventData: randomEvent,
              timestamp: Date.now()
            };
            
            const result = await this.effectSystem.applyEffect(effect, effectContext);
            effectResults.push(result);
          }
        }

        return {
          success: true,
          data: {
            uiInstanceId,
            effectResults,
            randomEvent
          },
          duration: 100
        };
      },
      options: {
        concurrent: false,
        timeout: 15000
      },
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });

    // 玩家行动处理器
    this.processingSystem.registerProcessor({
      id: 'player-action-processor',
      name: '玩家行动处理器',
      eventTypes: ['player-move', 'player-buy', 'player-sell'] as EventType[],
      priority: 10,
      enabled: true,
      process: async (event, context) => {
        const { type, data } = event;
        
        switch (type) {
          case 'player-move':
            return this.handlePlayerMove(data, context);
          case 'player-buy':
            return this.handlePlayerBuy(data, context);
          case 'player-sell':
            return this.handlePlayerSell(data, context);
          default:
            return {
              success: false,
              error: new Error(`Unknown player action: ${type}`),
              duration: 0
            };
        }
      },
      options: {
        concurrent: false,
        timeout: 5000,
        retries: 1
      },
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });

    // 游戏状态更新处理器
    this.processingSystem.registerProcessor({
      id: 'game-state-processor',
      name: '游戏状态处理器',
      eventTypes: ['game-state-update'] as EventType[],
      priority: 15,
      enabled: true,
      process: async (event, context) => {
        const { data } = event;
        
        // 更新游戏状态
        Object.assign(this.gameState, data);
        
        // 检查游戏规则和触发条件
        const triggeredEvents = await this.triggerSystem.checkTriggers({
          gameState: this.gameState,
          playerState: this.getCurrentPlayerState(),
          boardState: this.getBoardState(),
          timestamp: Date.now()
        });

        return {
          success: true,
          data: { stateUpdated: true },
          nextEvents: triggeredEvents.map(eventId => ({
            type: 'triggered-event' as EventType,
            priority: 'normal' as const,
            data: { triggeredEventId: eventId }
          })),
          duration: 50
        };
      },
      options: {},
      stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
    });
  }

  private registerDefaultResponses(): void {
    // 游戏音效响应
    this.responseSystem.registerResponse({
      id: 'audio-response',
      name: '音效响应',
      eventTypes: ['*'] as EventType[],
      priority: 1,
      enabled: true,
      execute: async (event, gameState, playerState) => {
        const audioMap: Record<string, string> = {
          'player-move': 'move.mp3',
          'player-buy': 'buy.mp3',
          'random-event': 'event.mp3',
          'game-win': 'victory.mp3',
          'game-lose': 'defeat.mp3'
        };

        const audioFile = audioMap[event.type];
        if (audioFile) {
          return {
            success: true,
            responses: [{
              type: 'audio',
              delay: 0,
              data: { file: audioFile, volume: 0.7 }
            }]
          };
        }

        return { success: true, responses: [] };
      },
      options: {}
    });

    // UI动画响应
    this.responseSystem.registerResponse({
      id: 'animation-response',
      name: '动画响应',
      eventTypes: ['player-move', 'random-event'] as EventType[],
      priority: 2,
      enabled: true,
      execute: async (event, gameState, playerState) => {
        const animations: any[] = [];

        if (event.type === 'player-move') {
          animations.push({
            type: 'animation',
            delay: 0,
            data: {
              target: `player-${playerState.id}`,
              animation: 'move',
              duration: 1000,
              from: event.data?.fromPosition,
              to: event.data?.toPosition
            }
          });
        }

        if (event.type === 'random-event') {
          animations.push({
            type: 'animation',
            delay: 500,
            data: {
              target: 'event-popup',
              animation: 'fadeIn',
              duration: 500
            }
          });
        }

        return {
          success: true,
          responses: animations
        };
      },
      options: {}
    });

    // 数据统计响应
    this.responseSystem.registerResponse({
      id: 'analytics-response',
      name: '数据统计响应',
      eventTypes: ['*'] as EventType[],
      priority: 0,
      enabled: true,
      execute: async (event, gameState, playerState) => {
        // 记录事件统计
        const analytics = {
          eventType: event.type,
          playerId: playerState.id,
          timestamp: event.timestamp,
          gameState: {
            turn: gameState.turn,
            phase: gameState.phase
          }
        };

        return {
          success: true,
          responses: [{
            type: 'analytics',
            delay: 0,
            data: analytics
          }]
        };
      },
      options: {}
    });
  }

  private setupRandomEvents(): void {
    // 幸运事件模板
    this.randomEventSystem.addEventTemplate({
      id: 'luck-bonus',
      name: '幸运奖金',
      category: 'luck',
      weight: 30,
      conditions: [
        { type: 'player_money', operator: 'lt', value: 10000 }
      ],
      eventData: {
        title: '幸运之神眷顾',
        description: '你在路上发现了一个钱包，里面有现金！',
        type: 'luck',
        effects: [{
          type: 'money',
          operation: 'add',
          value: 2000,
          target: 'current_player',
          conditions: []
        }],
        choices: [],
        metadata: { category: 'luck', rarity: 'common' }
      }
    });

    // 挑战事件模板
    this.randomEventSystem.addEventTemplate({
      id: 'investment-choice',
      name: '投资机会',
      category: 'choice',
      weight: 25,
      conditions: [
        { type: 'player_money', operator: 'gte', value: 5000 }
      ],
      eventData: {
        title: '投资机会',
        description: '你遇到了一个投资机会，要投资吗？',
        type: 'choice',
        effects: [],
        choices: [
          {
            id: 'invest-yes',
            text: '投资 (花费 3000)',
            effects: [{
              type: 'money',
              operation: 'subtract',
              value: 3000,
              target: 'current_player',
              conditions: []
            }],
            probability: 0.7,
            successEffect: {
              type: 'money',
              operation: 'add',
              value: 5000,
              target: 'current_player',
              conditions: []
            }
          },
          {
            id: 'invest-no',
            text: '不投资',
            effects: []
          }
        ],
        metadata: { category: 'choice', rarity: 'uncommon' }
      }
    });

    // 灾难事件模板
    this.randomEventSystem.addEventTemplate({
      id: 'market-crash',
      name: '市场崩盘',
      category: 'disaster',
      weight: 10,
      conditions: [
        { type: 'game_turn', operator: 'gte', value: 10 },
        { type: 'player_properties', operator: 'gte', value: 3 }
      ],
      eventData: {
        title: '股市崩盘',
        description: '经济危机来临，所有玩家都受到影响！',
        type: 'disaster',
        effects: [{
          type: 'money',
          operation: 'multiply',
          value: 0.8,
          target: 'all_players',
          conditions: []
        }],
        choices: [],
        metadata: { category: 'disaster', rarity: 'rare', affectsAll: true }
      }
    });

    // 特殊成就事件
    this.randomEventSystem.addEventTemplate({
      id: 'monopoly-master',
      name: '垄断大师',
      category: 'achievement',
      weight: 5,
      conditions: [
        { type: 'player_properties', operator: 'gte', value: 8 }
      ],
      eventData: {
        title: '垄断大师',
        description: '你已经成为真正的地产大亨！',
        type: 'achievement',
        effects: [{
          type: 'status',
          operation: 'add',
          value: 'monopoly_master',
          target: 'current_player',
          conditions: []
        }, {
          type: 'money',
          operation: 'add',
          value: 10000,
          target: 'current_player',
          conditions: []
        }],
        choices: [],
        metadata: { category: 'achievement', rarity: 'legendary' }
      }
    });
  }

  // 公共接口方法

  /**
   * 启动事件系统
   */
  start(initialGameState: any): void {
    this.gameState = { ...initialGameState };
    this.isRunning = true;
    
    console.log('集成事件系统已启动');
    this.logSystemStats();
  }

  /**
   * 停止事件系统
   */
  stop(): void {
    this.isRunning = false;
    this.destroy();
    console.log('集成事件系统已停止');
  }

  /**
   * 处理玩家行动
   */
  async handlePlayerAction(playerId: string, action: string, data: any): Promise<void> {
    const event: GameEvent = {
      id: `player-action-${Date.now()}`,
      type: action as EventType,
      priority: 'high',
      timestamp: Date.now(),
      data: { playerId, ...data },
      processed: false
    };

    this.processingSystem.addEvent(event);
  }

  /**
   * 更新游戏状态
   */
  async updateGameState(stateChanges: any): Promise<void> {
    const event: GameEvent = {
      id: `state-update-${Date.now()}`,
      type: 'game-state-update' as EventType,
      priority: 'high',
      timestamp: Date.now(),
      data: stateChanges,
      processed: false
    };

    this.processingSystem.addEvent(event);
  }

  /**
   * 手动触发随机事件检查
   */
  async checkRandomEvents(): Promise<void> {
    const context = {
      gameState: this.gameState,
      playerState: this.getCurrentPlayerState(),
      boardState: this.getBoardState(),
      timestamp: Date.now()
    };

    await this.randomEventSystem.tryTriggerEvent(context);
  }

  /**
   * 获取系统统计信息
   */
  getSystemStats(): any {
    return {
      processing: this.processingSystem.getSystemStats(),
      responses: this.responseSystem.getSystemStats(),
      randomEvents: this.randomEventSystem.getStats(),
      effects: this.effectSystem.getSystemStats(),
      ui: this.uiSystem.getStats(),
      triggers: this.triggerSystem.getStats()
    };
  }

  /**
   * 显示系统状态日志
   */
  logSystemStats(): void {
    const stats = this.getSystemStats();
    console.log('=== 事件系统状态 ===');
    console.log('处理系统:', stats.processing);
    console.log('响应系统:', stats.responses);
    console.log('随机事件:', stats.randomEvents);
    console.log('效果系统:', stats.effects);
    console.log('UI系统:', stats.ui);
    console.log('触发系统:', stats.triggers);
  }

  // 私有辅助方法

  private async handlePlayerMove(data: any, context: any): Promise<any> {
    const { playerId, fromPosition, toPosition } = data;
    
    // 更新玩家位置
    const player = this.gameState.players?.find((p: any) => p.id === playerId);
    if (player) {
      player.position = toPosition;
    }

    // 检查是否触发位置相关事件
    const positionEvent = await this.randomEventSystem.tryTriggerEvent({
      ...context,
      playerState: player,
      boardState: { currentPosition: toPosition }
    });

    return {
      success: true,
      data: { 
        playerMoved: true,
        positionEvent: positionEvent?.id || null
      },
      stateChanges: { [`players.${playerId}.position`]: toPosition },
      duration: 200
    };
  }

  private async handlePlayerBuy(data: any, context: any): Promise<any> {
    const { playerId, propertyId, cost } = data;
    
    const player = this.gameState.players?.find((p: any) => p.id === playerId);
    if (!player || player.money < cost) {
      return {
        success: false,
        error: new Error('资金不足或玩家不存在'),
        duration: 100
      };
    }

    // 扣除资金，增加财产
    player.money -= cost;
    player.properties = player.properties || [];
    player.properties.push(propertyId);

    return {
      success: true,
      data: { propertyBought: true },
      stateChanges: {
        [`players.${playerId}.money`]: -cost,
        [`players.${playerId}.properties`]: propertyId
      },
      duration: 300
    };
  }

  private async handlePlayerSell(data: any, context: any): Promise<any> {
    const { playerId, propertyId, price } = data;
    
    const player = this.gameState.players?.find((p: any) => p.id === playerId);
    if (!player || !player.properties?.includes(propertyId)) {
      return {
        success: false,
        error: new Error('玩家不拥有该财产'),
        duration: 100
      };
    }

    // 增加资金，移除财产
    player.money += price;
    player.properties = player.properties.filter((p: string) => p !== propertyId);

    return {
      success: true,
      data: { propertySold: true },
      stateChanges: {
        [`players.${playerId}.money`]: price,
        [`players.${playerId}.properties`]: propertyId
      },
      duration: 300
    };
  }

  private getCurrentPlayerState(): any {
    return this.gameState.players?.[this.gameState.currentPlayerIndex] || {};
  }

  private getBoardState(): any {
    return {
      currentPosition: this.getCurrentPlayerState().position || 0,
      properties: this.gameState.properties || {},
      specialTiles: this.gameState.specialTiles || []
    };
  }

  private destroy(): void {
    this.triggerSystem.destroy();
    this.processingSystem.destroy();
    this.responseSystem.destroy();
    this.randomEventSystem.destroy();
    this.effectSystem.destroy();
    this.uiSystem.destroy();
  }
}

// 导出单例实例
export const gameEventSystem = new IntegratedEventSystem();