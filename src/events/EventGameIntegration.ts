import { EventEmitter } from '../utils/EventEmitter';
import { EventSystemManager, IEventSystem, EventData, ProcessedEvent } from './EventSystemArchitecture';
import { AdvancedEventManager } from './EventManagerAndScheduler';
import { GameEventType, EventTypeDefinition, EventPriority, EventRarity } from './EventTypeDefinitions';
import { EventListenerSystem, EventListener } from './EventListenerSystem';
import { EventPriorityQueueManager } from './EventPriorityQueueManager';

export interface GameCoreIntegration {
  eventSystem: IEventSystem;
  eventManager: AdvancedEventManager;
  listenerSystem: EventListenerSystem;
  queueManager: EventPriorityQueueManager;
  
  initializeGameEvents(): Promise<void>;
  handleGameStateChange(state: GameState): Promise<void>;
  processPlayerAction(action: PlayerAction): Promise<void>;
  handleSkillActivation(skill: SkillData): Promise<void>;
  triggerZodiacEvent(zodiac: string, event: string): Promise<void>;
}

export interface GameState {
  currentPlayer: string;
  turn: number;
  phase: 'preparation' | 'movement' | 'action' | 'skill' | 'end';
  players: Player[];
  board: BoardState;
  activeSkills: ActiveSkill[];
}

export interface Player {
  id: string;
  name: string;
  zodiac: string;
  position: number;
  money: number;
  properties: Property[];
  skills: Skill[];
  status: PlayerStatus[];
}

export interface PlayerAction {
  playerId: string;
  actionType: 'move' | 'buy' | 'trade' | 'skill' | 'pass';
  targetId?: string;
  data?: any;
  timestamp: number;
}

export interface SkillData {
  skillId: string;
  playerId: string;
  targetId?: string;
  zodiacPower: number;
  cooldown: number;
  effects: SkillEffect[];
}

export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'modify';
  value: number;
  duration?: number;
  target: 'self' | 'opponent' | 'all' | 'property';
}

export interface BoardState {
  properties: Property[];
  specialSpaces: SpecialSpace[];
  events: BoardEvent[];
}

export interface Property {
  id: string;
  name: string;
  type: 'normal' | 'zodiac' | 'special';
  owner?: string;
  level: number;
  value: number;
  rent: number;
}

export interface SpecialSpace {
  id: string;
  type: 'start' | 'chance' | 'community' | 'jail' | 'free_parking';
  position: number;
  effects: SpaceEffect[];
}

export interface SpaceEffect {
  type: 'money' | 'card' | 'move' | 'skill' | 'zodiac';
  value: number;
  condition?: string;
}

export interface BoardEvent {
  id: string;
  type: string;
  trigger: string;
  effects: EventEffect[];
  duration: number;
  active: boolean;
}

export interface EventEffect {
  type: 'global' | 'player' | 'property' | 'skill';
  modifier: string;
  value: number;
  targets?: string[];
}

export interface ActiveSkill {
  skillId: string;
  playerId: string;
  remainingTurns: number;
  effects: SkillEffect[];
}

export interface PlayerStatus {
  type: 'blessed' | 'cursed' | 'protected' | 'weakened';
  source: string;
  duration: number;
  effects: StatusEffect[];
}

export interface StatusEffect {
  stat: 'money' | 'movement' | 'skill_power' | 'rent';
  modifier: number;
  type: 'add' | 'multiply' | 'set';
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  zodiac: string;
  cost: number;
  cooldown: number;
  effects: SkillEffect[];
  rarity: EventRarity;
}

export class GameEventIntegrator extends EventEmitter implements GameCoreIntegration {
  public eventSystem: EventSystemManager;
  public eventManager: AdvancedEventManager;
  public listenerSystem: EventListenerSystem;
  public queueManager: EventPriorityQueueManager;
  
  private gameState: GameState | null = null;
  private eventBridges = new Map<string, EventBridge>();
  private gameListeners = new Map<string, string>();
  
  constructor() {
    super();
    this.eventSystem = new EventSystemManager();
    this.eventManager = new AdvancedEventManager();
    this.listenerSystem = new EventListenerSystem();
    this.queueManager = new EventPriorityQueueManager();
    
    this.setupEventBridges();
  }
  
  public async initializeGameEvents(): Promise<void> {
    await this.registerCoreGameListeners();
    await this.setupGameStateListeners();
    await this.initializeSkillEventHandlers();
    await this.setupZodiacEventListeners();
    
    this.emit('events_initialized');
  }
  
  public async handleGameStateChange(state: GameState): Promise<void> {
    const previousState = this.gameState;
    this.gameState = state;
    
    const stateChangeEvent: EventData = {
      id: `state_change_${Date.now()}`,
      type: GameEventType.GAME_STATE_CHANGED,
      source: 'game_core',
      data: {
        previousState,
        currentState: state,
        changes: this.calculateStateChanges(previousState, state)
      },
      timestamp: Date.now(),
      priority: EventPriority.HIGH,
      metadata: {
        turn: state.turn,
        phase: state.phase,
        currentPlayer: state.currentPlayer
      }
    };
    
    await this.eventSystem.emitEvent(stateChangeEvent);
    
    if (previousState?.phase !== state.phase) {
      await this.handlePhaseChange(previousState?.phase, state.phase);
    }
    
    if (previousState?.currentPlayer !== state.currentPlayer) {
      await this.handlePlayerTurnChange(previousState?.currentPlayer, state.currentPlayer);
    }
  }
  
  public async processPlayerAction(action: PlayerAction): Promise<void> {
    const actionEvent: EventData = {
      id: `player_action_${action.playerId}_${Date.now()}`,
      type: this.getActionEventType(action.actionType),
      source: 'player_input',
      data: action,
      timestamp: action.timestamp,
      priority: EventPriority.MEDIUM,
      metadata: {
        playerId: action.playerId,
        actionType: action.actionType
      }
    };
    
    await this.eventSystem.emitEvent(actionEvent);
    
    switch (action.actionType) {
      case 'move':
        await this.handlePlayerMovement(action);
        break;
      case 'buy':
        await this.handlePropertyPurchase(action);
        break;
      case 'trade':
        await this.handlePlayerTrade(action);
        break;
      case 'skill':
        await this.handleSkillActivation(action.data as SkillData);
        break;
    }
  }
  
  public async handleSkillActivation(skill: SkillData): Promise<void> {
    const skillEvent: EventData = {
      id: `skill_${skill.skillId}_${Date.now()}`,
      type: GameEventType.SKILL_USED,
      source: 'skill_system',
      data: skill,
      timestamp: Date.now(),
      priority: EventPriority.HIGH,
      metadata: {
        skillId: skill.skillId,
        playerId: skill.playerId,
        zodiacPower: skill.zodiacPower
      }
    };
    
    await this.eventSystem.emitEvent(skillEvent);
    
    for (const effect of skill.effects) {
      await this.processSkillEffect(skill, effect);
    }
    
    const cooldownEvent: EventData = {
      id: `skill_cooldown_${skill.skillId}_${Date.now()}`,
      type: GameEventType.SKILL_COOLDOWN_STARTED,
      source: 'skill_system',
      data: {
        skillId: skill.skillId,
        playerId: skill.playerId,
        cooldown: skill.cooldown
      },
      timestamp: Date.now(),
      priority: EventPriority.LOW
    };
    
    await this.eventManager.scheduleSmartEvent(cooldownEvent, {
      delay: skill.cooldown * 1000
    });
  }
  
  public async triggerZodiacEvent(zodiac: string, eventName: string): Promise<void> {
    const zodiacEvent: EventData = {
      id: `zodiac_${zodiac}_${eventName}_${Date.now()}`,
      type: GameEventType.ZODIAC_BLESSING_TRIGGERED,
      source: 'zodiac_system',
      data: {
        zodiac,
        eventName,
        players: this.getPlayersWithZodiac(zodiac)
      },
      timestamp: Date.now(),
      priority: EventPriority.HIGH,
      metadata: {
        zodiac,
        eventName,
        season: this.getCurrentSeason()
      }
    };
    
    await this.eventSystem.emitEvent(zodiacEvent);
  }
  
  private setupEventBridges(): void {
    const gameStateBridge: EventBridge = {
      name: 'game_state_bridge',
      eventTypes: [
        GameEventType.GAME_STARTED,
        GameEventType.GAME_ENDED,
        GameEventType.TURN_STARTED,
        GameEventType.TURN_ENDED,
        GameEventType.PHASE_CHANGED
      ],
      handler: async (event) => {
        this.emit('game_state_event', event);
      }
    };
    
    const skillBridge: EventBridge = {
      name: 'skill_bridge',
      eventTypes: [
        GameEventType.SKILL_USED,
        GameEventType.SKILL_COOLDOWN_STARTED,
        GameEventType.SKILL_COOLDOWN_ENDED,
        GameEventType.SKILL_UPGRADED
      ],
      handler: async (event) => {
        this.emit('skill_event', event);
      }
    };
    
    const zodiacBridge: EventBridge = {
      name: 'zodiac_bridge',
      eventTypes: [
        GameEventType.ZODIAC_BLESSING_TRIGGERED,
        GameEventType.ZODIAC_CURSE_APPLIED,
        GameEventType.SEASONAL_EVENT_TRIGGERED
      ],
      handler: async (event) => {
        this.emit('zodiac_event', event);
      }
    };
    
    this.eventBridges.set('game_state', gameStateBridge);
    this.eventBridges.set('skill', skillBridge);
    this.eventBridges.set('zodiac', zodiacBridge);
  }
  
  private async registerCoreGameListeners(): Promise<void> {
    const gameStartListener: EventListener = {
      id: 'game_start_listener',
      eventTypes: [GameEventType.GAME_STARTED],
      handler: async (event) => {
        console.log('Game started:', event.data);
        await this.initializePlayerSkills();
        await this.activateSeasonalEvents();
      },
      priority: EventPriority.HIGH,
      active: true
    };
    
    const turnChangeListener: EventListener = {
      id: 'turn_change_listener',
      eventTypes: [GameEventType.TURN_STARTED, GameEventType.TURN_ENDED],
      handler: async (event) => {
        if (event.type === GameEventType.TURN_STARTED) {
          await this.processTurnStartEffects(event.data.playerId);
        } else {
          await this.processTurnEndEffects(event.data.playerId);
        }
      },
      priority: EventPriority.MEDIUM,
      active: true
    };
    
    const skillActivationListener: EventListener = {
      id: 'skill_activation_listener',
      eventTypes: [GameEventType.SKILL_USED],
      handler: async (event) => {
        await this.validateSkillUsage(event.data);
        await this.applySkillEffects(event.data);
        await this.updateSkillCooldowns(event.data);
      },
      priority: EventPriority.HIGH,
      active: true
    };
    
    this.gameListeners.set('game_start', this.listenerSystem.addListener(gameStartListener));
    this.gameListeners.set('turn_change', this.listenerSystem.addListener(turnChangeListener));
    this.gameListeners.set('skill_activation', this.listenerSystem.addListener(skillActivationListener));
  }
  
  private async setupGameStateListeners(): Promise<void> {
    const stateChangeListener: EventListener = {
      id: 'state_change_listener',
      eventTypes: [GameEventType.GAME_STATE_CHANGED],
      handler: async (event) => {
        await this.synchronizeGameState(event.data);
        await this.validateGameRules(event.data.currentState);
        await this.triggerStateBasedEvents(event.data.currentState);
      },
      priority: EventPriority.HIGH,
      active: true
    };
    
    this.gameListeners.set('state_change', this.listenerSystem.addListener(stateChangeListener));
  }
  
  private async initializeSkillEventHandlers(): Promise<void> {
    const skillEffectListener: EventListener = {
      id: 'skill_effect_listener',
      eventTypes: [GameEventType.SKILL_EFFECT_APPLIED],
      handler: async (event) => {
        await this.processSkillEffectChain(event.data);
        await this.checkForComboSkills(event.data);
      },
      priority: EventPriority.MEDIUM,
      active: true
    };
    
    const skillCooldownListener: EventListener = {
      id: 'skill_cooldown_listener',
      eventTypes: [GameEventType.SKILL_COOLDOWN_ENDED],
      handler: async (event) => {
        await this.notifySkillAvailable(event.data);
      },
      priority: EventPriority.LOW,
      active: true
    };
    
    this.gameListeners.set('skill_effect', this.listenerSystem.addListener(skillEffectListener));
    this.gameListeners.set('skill_cooldown', this.listenerSystem.addListener(skillCooldownListener));
  }
  
  private async setupZodiacEventListeners(): Promise<void> {
    const zodiacBlessingListener: EventListener = {
      id: 'zodiac_blessing_listener',
      eventTypes: [GameEventType.ZODIAC_BLESSING_TRIGGERED],
      handler: async (event) => {
        await this.applyZodiacBlessing(event.data);
        await this.checkForZodiacSynergy(event.data);
      },
      priority: EventPriority.HIGH,
      active: true
    };
    
    const seasonalEventListener: EventListener = {
      id: 'seasonal_event_listener',
      eventTypes: [GameEventType.SEASONAL_EVENT_TRIGGERED],
      handler: async (event) => {
        await this.activateSeasonalEffect(event.data);
      },
      priority: EventPriority.MEDIUM,
      active: true
    };
    
    this.gameListeners.set('zodiac_blessing', this.listenerSystem.addListener(zodiacBlessingListener));
    this.gameListeners.set('seasonal_event', this.listenerSystem.addListener(seasonalEventListener));
  }
  
  private calculateStateChanges(previous: GameState | null, current: GameState): any {
    if (!previous) return { initial: true };
    
    return {
      turnChanged: previous.turn !== current.turn,
      phaseChanged: previous.phase !== current.phase,
      playerChanged: previous.currentPlayer !== current.currentPlayer,
      playersChanged: JSON.stringify(previous.players) !== JSON.stringify(current.players),
      boardChanged: JSON.stringify(previous.board) !== JSON.stringify(current.board)
    };
  }
  
  private async handlePhaseChange(previousPhase: string | undefined, currentPhase: string): Promise<void> {
    const phaseEvent: EventData = {
      id: `phase_change_${Date.now()}`,
      type: GameEventType.PHASE_CHANGED,
      source: 'game_core',
      data: {
        previousPhase,
        currentPhase,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      priority: EventPriority.HIGH
    };
    
    await this.eventSystem.emitEvent(phaseEvent);
  }
  
  private async handlePlayerTurnChange(previousPlayer: string | undefined, currentPlayer: string): Promise<void> {
    if (previousPlayer) {
      const turnEndEvent: EventData = {
        id: `turn_end_${previousPlayer}_${Date.now()}`,
        type: GameEventType.TURN_ENDED,
        source: 'game_core',
        data: { playerId: previousPlayer },
        timestamp: Date.now(),
        priority: EventPriority.MEDIUM
      };
      
      await this.eventSystem.emitEvent(turnEndEvent);
    }
    
    const turnStartEvent: EventData = {
      id: `turn_start_${currentPlayer}_${Date.now()}`,
      type: GameEventType.TURN_STARTED,
      source: 'game_core',
      data: { playerId: currentPlayer },
      timestamp: Date.now(),
      priority: EventPriority.MEDIUM
    };
    
    await this.eventSystem.emitEvent(turnStartEvent);
  }
  
  private getActionEventType(actionType: string): string {
    const eventMap: Record<string, string> = {
      'move': GameEventType.PLAYER_MOVED,
      'buy': GameEventType.PROPERTY_PURCHASED,
      'trade': GameEventType.TRADE_COMPLETED,
      'skill': GameEventType.SKILL_USED,
      'pass': GameEventType.TURN_ENDED
    };
    
    return eventMap[actionType] || GameEventType.PLAYER_ACTION;
  }
  
  private async handlePlayerMovement(action: PlayerAction): Promise<void> {
    const moveEvent: EventData = {
      id: `player_move_${action.playerId}_${Date.now()}`,
      type: GameEventType.PLAYER_MOVED,
      source: 'movement_system',
      data: action.data,
      timestamp: Date.now(),
      priority: EventPriority.MEDIUM
    };
    
    await this.eventSystem.emitEvent(moveEvent);
  }
  
  private async handlePropertyPurchase(action: PlayerAction): Promise<void> {
    const purchaseEvent: EventData = {
      id: `property_purchase_${action.playerId}_${Date.now()}`,
      type: GameEventType.PROPERTY_PURCHASED,
      source: 'property_system',
      data: action.data,
      timestamp: Date.now(),
      priority: EventPriority.MEDIUM
    };
    
    await this.eventSystem.emitEvent(purchaseEvent);
  }
  
  private async handlePlayerTrade(action: PlayerAction): Promise<void> {
    const tradeEvent: EventData = {
      id: `trade_${action.playerId}_${Date.now()}`,
      type: GameEventType.TRADE_COMPLETED,
      source: 'trade_system',
      data: action.data,
      timestamp: Date.now(),
      priority: EventPriority.MEDIUM
    };
    
    await this.eventSystem.emitEvent(tradeEvent);
  }
  
  private async processSkillEffect(skill: SkillData, effect: SkillEffect): Promise<void> {
    const effectEvent: EventData = {
      id: `skill_effect_${skill.skillId}_${Date.now()}`,
      type: GameEventType.SKILL_EFFECT_APPLIED,
      source: 'skill_system',
      data: {
        skill,
        effect,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      priority: EventPriority.MEDIUM
    };
    
    await this.eventSystem.emitEvent(effectEvent);
  }
  
  private getPlayersWithZodiac(zodiac: string): Player[] {
    return this.gameState?.players.filter(player => player.zodiac === zodiac) || [];
  }
  
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
  
  private async initializePlayerSkills(): Promise<void> {
    console.log('Initializing player skills...');
  }
  
  private async activateSeasonalEvents(): Promise<void> {
    console.log('Activating seasonal events...');
  }
  
  private async processTurnStartEffects(playerId: string): Promise<void> {
    console.log(`Processing turn start effects for player ${playerId}`);
  }
  
  private async processTurnEndEffects(playerId: string): Promise<void> {
    console.log(`Processing turn end effects for player ${playerId}`);
  }
  
  private async validateSkillUsage(skillData: SkillData): Promise<void> {
    console.log('Validating skill usage:', skillData.skillId);
  }
  
  private async applySkillEffects(skillData: SkillData): Promise<void> {
    console.log('Applying skill effects:', skillData.skillId);
  }
  
  private async updateSkillCooldowns(skillData: SkillData): Promise<void> {
    console.log('Updating skill cooldowns:', skillData.skillId);
  }
  
  private async synchronizeGameState(data: any): Promise<void> {
    console.log('Synchronizing game state...');
  }
  
  private async validateGameRules(state: GameState): Promise<void> {
    console.log('Validating game rules...');
  }
  
  private async triggerStateBasedEvents(state: GameState): Promise<void> {
    console.log('Triggering state-based events...');
  }
  
  private async processSkillEffectChain(data: any): Promise<void> {
    console.log('Processing skill effect chain...');
  }
  
  private async checkForComboSkills(data: any): Promise<void> {
    console.log('Checking for combo skills...');
  }
  
  private async notifySkillAvailable(data: any): Promise<void> {
    console.log('Notifying skill available:', data.skillId);
  }
  
  private async applyZodiacBlessing(data: any): Promise<void> {
    console.log('Applying zodiac blessing:', data.zodiac);
  }
  
  private async checkForZodiacSynergy(data: any): Promise<void> {
    console.log('Checking for zodiac synergy...');
  }
  
  private async activateSeasonalEffect(data: any): Promise<void> {
    console.log('Activating seasonal effect...');
  }
}

export interface EventBridge {
  name: string;
  eventTypes: string[];
  handler: (event: ProcessedEvent) => Promise<void>;
}

export const createGameEventIntegrator = (): GameEventIntegrator => {
  return new GameEventIntegrator();
};

export default GameEventIntegrator;