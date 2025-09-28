import { SkillSystemIntegration, DEFAULT_SKILL_SYSTEM_CONFIG } from '../SkillSystemIntegration';
import { SkillManager } from '../SkillManager';
import { EnhancedParticleSystem } from '../../animations/EnhancedParticleSystem';
import { ZodiacVisualEffects, ZodiacSign } from '../../animations/ZodiacVisualEffects';
import { SkillAnimationStateMachine } from '../../animations/SkillAnimationStateMachine';
import { 
  GameState, 
  Player, 
  GameEvent, 
  EventType, 
  EventTrigger,
  ActionResult,
  GamePhase,
  Season,
  Weather,
  PlayerSkill,
  ZodiacSign as GameZodiacSign
} from '../../types/game';

interface MockGameEngine {
  gameState: GameState;
  addEventListener: jest.Mock;
  usePlayerSkill?: (playerId: string, skillId: string, targets: string[], gameState: GameState) => Promise<ActionResult>;
  canUsePlayerSkill?: (playerId: string, skillId: string, gameState: GameState) => boolean;
  getPlayerSkills?: (playerId: string) => any[];
  getAvailableSkills?: (playerId: string, gameState: GameState) => any[];
  learnPlayerSkill?: (playerId: string, skillId: string) => boolean;
  getSkillSystemState?: () => any;
  getSkillSystemStats?: () => any;
  events: Array<{ type: string; data: any }>;
}

describe('Skill System and Game Logic Integration Tests', () => {
  let skillSystem: SkillSystemIntegration;
  let mockGameEngine: MockGameEngine;
  let mockGameState: GameState;
  let testPlayers: Player[];
  let particleSystem: EnhancedParticleSystem;
  let zodiacEffects: ZodiacVisualEffects;
  let animationStateMachine: SkillAnimationStateMachine;
  let mockCanvas: HTMLCanvasElement;
  let mockAudioContext: any;

  beforeEach(() => {
    mockCanvas = {
      getContext: jest.fn().mockReturnValue({
        save: jest.fn(),
        restore: jest.fn(),
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        arc: jest.fn(),
        beginPath: jest.fn(),
        fill: jest.fn(),
        drawImage: jest.fn(),
        setTransform: jest.fn(),
        globalAlpha: 1,
        fillStyle: '#000'
      }),
      width: 800,
      height: 600
    } as any;

    mockAudioContext = {
      playSound: jest.fn().mockResolvedValue(undefined),
      pauseSound: jest.fn().mockResolvedValue(undefined),
      setVolume: jest.fn(),
      createSoundGroup: jest.fn().mockReturnValue('test-group')
    };

    testPlayers = [
      {
        id: 'player1',
        name: '龙玩家',
        zodiac: '龙' as GameZodiacSign,
        isHuman: true,
        position: 0,
        money: 1500,
        properties: [],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 0,
          moneyEarned: 0,
          moneySpent: 0,
          propertiesBought: 0,
          propertiesSold: 0,
          skillsUsed: 0,
          eventsTriggered: 0,
          rentCollected: 0,
          rentPaid: 0
        }
      },
      {
        id: 'player2',
        name: '虎玩家',
        zodiac: '虎' as GameZodiacSign,
        isHuman: false,
        position: 5,
        money: 1200,
        properties: ['property1'],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 0,
          moneyEarned: 0,
          moneySpent: 0,
          propertiesBought: 1,
          propertiesSold: 0,
          skillsUsed: 0,
          eventsTriggered: 0,
          rentCollected: 0,
          rentPaid: 0
        }
      }
    ];

    mockGameState = {
      gameId: 'test-game-1',
      status: 'playing',
      mode: 'classic',
      players: testPlayers,
      currentPlayerIndex: 0,
      round: 1,
      phase: 'roll_dice' as GamePhase,
      turn: 1,
      board: [],
      eventHistory: [],
      season: '春' as Season,
      weather: '晴' as Weather,
      marketTrends: {
        propertyPriceMultiplier: 1.0,
        rentMultiplier: 1.0,
        salaryBonus: 0,
        taxRate: 0.1,
        skillCooldownModifier: 1.0
      },
      startTime: Date.now(),
      elapsedTime: 0,
      lastUpdateTime: Date.now()
    };

    mockGameEngine = {
      gameState: mockGameState,
      addEventListener: jest.fn(),
      events: []
    };

    particleSystem = new EnhancedParticleSystem(mockCanvas);
    zodiacEffects = new ZodiacVisualEffects(particleSystem, mockAudioContext);
    animationStateMachine = new SkillAnimationStateMachine(zodiacEffects, particleSystem, mockAudioContext);

    skillSystem = new SkillSystemIntegration({
      ...DEFAULT_SKILL_SYSTEM_CONFIG,
      debugMode: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Player State Integration', () => {
    test('should initialize player skills based on zodiac sign', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();

      await skillSystem.onGameStart(mockGameState);

      const dragonPlayerSkills = skillSystem.getPlayerSkills('player1');
      const tigerPlayerSkills = skillSystem.getPlayerSkills('player2');

      expect(dragonPlayerSkills.length).toBeGreaterThan(0);
      expect(tigerPlayerSkills.length).toBeGreaterThan(0);

      const dragonSkillNames = dragonPlayerSkills.map(skill => skill.name);
      const tigerSkillNames = tigerPlayerSkills.map(skill => skill.name);

      expect(dragonSkillNames).toContain('龙息攻击');
      expect(tigerSkillNames).toContain('虎跃突击');
    });

    test('should update player money after skill usage', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const initialMoney = mockGameState.players[0].money;
      
      const result = await skillSystem.useSkill('player1', 'money_boost', [], mockGameState);

      expect(result.success).toBe(true);

      const moneyEffect = result.effects.find(effect => effect.type === 'money');
      if (moneyEffect) {
        expect(moneyEffect.value).toBeGreaterThan(0);
        
        const updatedPlayer = mockGameState.players.find(p => p.id === 'player1');
        if (updatedPlayer && result.newGameState?.players) {
          const gameStatePlayer = result.newGameState.players.find(p => p.id === 'player1');
          expect(gameStatePlayer?.money).toBeGreaterThan(initialMoney);
        }
      }
    });

    test('should apply status effects to players', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const result = await skillSystem.useSkill('player1', 'protection_shield', ['player1'], mockGameState);

      expect(result.success).toBe(true);

      const statusEffect = result.effects.find(effect => effect.type === 'status');
      expect(statusEffect).toBeDefined();
      expect(statusEffect?.description).toContain('保护');
    });

    test('should handle skill cooldowns correctly', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const skillId = 'dragon_breath';
      
      const firstUse = await skillSystem.useSkill('player1', skillId, ['player2'], mockGameState);
      expect(firstUse.success).toBe(true);

      const canUseImmediately = skillSystem.canUseSkill('player1', skillId, mockGameState);
      expect(canUseImmediately).toBe(false);

      await skillSystem.onTurnStart('player1', mockGameState);

      const canUseAfterCooldown = skillSystem.canUseSkill('player1', skillId, mockGameState);
      expect(canUseAfterCooldown).toBe(true);
    });

    test('should handle skill learning and progression', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const initialSkills = skillSystem.getPlayerSkills('player1');
      const initialCount = initialSkills.length;

      const learned = skillSystem.learnSkill('player1', 'advanced_fire_magic');
      
      if (learned) {
        const updatedSkills = skillSystem.getPlayerSkills('player1');
        expect(updatedSkills.length).toBe(initialCount + 1);
        
        const newSkill = updatedSkills.find(skill => skill.id === 'advanced_fire_magic');
        expect(newSkill).toBeDefined();
        expect(newSkill?.level).toBe(1);
      }
    });
  });

  describe('Game Rule Validation Tests', () => {
    test('should prevent skill usage when player lacks resources', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      mockGameState.players[0].money = 50;

      const result = await skillSystem.useSkill('player1', 'expensive_skill', [], mockGameState);

      expect(result.success).toBe(false);
      expect(result.message).toContain('资源不足');
    });

    test('should validate skill targets', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const result = await skillSystem.useSkill('player1', 'targeted_attack', ['invalid_player'], mockGameState);

      expect(result.success).toBe(false);
      expect(result.message).toContain('无效目标');
    });

    test('should respect seasonal skill restrictions', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      mockGameState.season = '冬' as Season;

      const canUseWinterSkill = skillSystem.canUseSkill('player1', 'winter_exclusive_skill', mockGameState);
      const canUseSummerSkill = skillSystem.canUseSkill('player1', 'summer_exclusive_skill', mockGameState);

      expect(canUseWinterSkill).toBe(true);
      expect(canUseSummerSkill).toBe(false);
    });

    test('should handle zodiac compatibility bonuses', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const compatibleResult = await skillSystem.useSkill('player1', 'dragon_water_skill', [], mockGameState);
      const incompatibleResult = await skillSystem.useSkill('player1', 'dragon_earth_skill', [], mockGameState);

      if (compatibleResult.success && incompatibleResult.success) {
        const compatibleEffect = compatibleResult.effects.find(e => e.value > 0);
        const incompatibleEffect = incompatibleResult.effects.find(e => e.value > 0);

        expect(compatibleEffect?.value).toBeGreaterThan(incompatibleEffect?.value || 0);
      }
    });

    test('should enforce game phase restrictions', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      mockGameState.phase = 'move_player' as GamePhase;

      const canUseMovePhaseSkill = skillSystem.canUseSkill('player1', 'movement_skill', mockGameState);
      const canUseDicePhaseSkill = skillSystem.canUseSkill('player1', 'dice_modifier_skill', mockGameState);

      expect(canUseMovePhaseSkill).toBe(true);
      expect(canUseDicePhaseSkill).toBe(false);
    });
  });

  describe('Animation and Event System Integration', () => {
    test('should trigger animations when skills are used', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const playAnimationSpy = jest.spyOn(animationStateMachine, 'playSkillAnimation').mockResolvedValue();

      await skillSystem.useSkill('player1', 'dragon_breath', ['player2'], mockGameState);

      expect(playAnimationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          zodiac: ZodiacSign.DRAGON,
          sequence: expect.any(Array)
        }),
        expect.objectContaining({
          position: expect.any(Object),
          targets: expect.any(Array)
        })
      );
    });

    test('should synchronize skill effects with visual animations', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const playEffectSpy = jest.spyOn(zodiacEffects, 'playZodiacSkillEffect').mockResolvedValue();

      await skillSystem.useSkill('player1', 'fire_burst', ['player2'], mockGameState);

      expect(playEffectSpy).toHaveBeenCalledWith(
        ZodiacSign.DRAGON,
        'fire_burst',
        expect.any(Object),
        expect.any(Array),
        expect.objectContaining({
          intensity: expect.any(Number),
          duration: expect.any(Number)
        })
      );
    });

    test('should handle animation interruption during skill cancellation', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const stopAnimationSpy = jest.spyOn(animationStateMachine, 'stopAnimation').mockImplementation();

      const skillPromise = skillSystem.useSkill('player1', 'long_channel_skill', [], mockGameState);
      
      setTimeout(() => {
        animationStateMachine.stopAnimation('long_channel_skill');
      }, 100);

      await skillPromise;

      expect(stopAnimationSpy).toHaveBeenCalledWith('long_channel_skill');
    });

    test('should emit proper game events during skill usage', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const eventListener = jest.fn();
      skillSystem.addEventListener(eventListener);

      await skillSystem.useSkill('player1', 'healing_skill', ['player1'], mockGameState);

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          playerId: 'player1',
          skillId: 'healing_skill',
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('Multi-Player Skill Interactions', () => {
    test('should handle area-of-effect skills affecting multiple players', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      mockGameState.players.push({
        id: 'player3',
        name: '兔玩家',
        zodiac: '兔' as GameZodiacSign,
        isHuman: false,
        position: 3,
        money: 1000,
        properties: [],
        items: [],
        skills: [],
        statusEffects: [],
        statistics: {
          turnsPlayed: 0,
          moneyEarned: 0,
          moneySpent: 0,
          propertiesBought: 0,
          propertiesSold: 0,
          skillsUsed: 0,
          eventsTriggered: 0,
          rentCollected: 0,
          rentPaid: 0
        }
      });

      const result = await skillSystem.useSkill('player1', 'area_damage_skill', ['all'], mockGameState);

      expect(result.success).toBe(true);
      expect(result.effects.length).toBeGreaterThan(1);

      const affectedTargets = result.effects.filter(effect => effect.target !== 'self');
      expect(affectedTargets.length).toBe(2);
    });

    test('should handle skill combinations and combos', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const firstSkill = await skillSystem.useSkill('player1', 'fire_preparation', [], mockGameState);
      expect(firstSkill.success).toBe(true);

      const secondSkill = await skillSystem.useSkill('player1', 'enhanced_fire_blast', ['player2'], mockGameState);

      if (secondSkill.success) {
        const comboEffect = secondSkill.effects.find(effect => effect.description.includes('连击'));
        expect(comboEffect).toBeDefined();
        expect(comboEffect?.value).toBeGreaterThan(100);
      }
    });

    test('should resolve conflicting skill effects', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      await skillSystem.useSkill('player1', 'protection_field', ['player2'], mockGameState);
      const attackResult = await skillSystem.useSkill('player1', 'damage_skill', ['player2'], mockGameState);

      if (attackResult.success) {
        const damageEffect = attackResult.effects.find(effect => effect.type === 'money' && effect.value < 0);
        
        if (damageEffect) {
          expect(Math.abs(damageEffect.value)).toBeLessThan(100);
        }
      }
    });

    test('should handle skill trading and sharing', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const tradeResult = await skillSystem.useSkill('player1', 'skill_share', ['player2'], mockGameState);

      if (tradeResult.success) {
        const sharedSkillEffect = tradeResult.effects.find(effect => 
          effect.description.includes('技能共享') && effect.target === 'other_players'
        );
        expect(sharedSkillEffect).toBeDefined();
      }
    });
  });

  describe('Game Flow Completeness Validation', () => {
    test('should integrate properly with turn-based gameplay', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      for (let turn = 1; turn <= 5; turn++) {
        const currentPlayer = mockGameState.players[mockGameState.currentPlayerIndex];
        
        const turnStartResult = await skillSystem.onTurnStart(currentPlayer.id, mockGameState);
        expect(turnStartResult.success).toBe(true);

        if (skillSystem.getAvailableSkills(currentPlayer.id, mockGameState).length > 0) {
          const availableSkills = skillSystem.getAvailableSkills(currentPlayer.id, mockGameState);
          const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
          
          await skillSystem.useSkill(currentPlayer.id, randomSkill.id, [], mockGameState);
        }

        const gameEvent: GameEvent = {
          id: `event_turn_${turn}`,
          type: 'chance_card' as EventType,
          title: `回合 ${turn} 事件`,
          description: '随机事件',
          triggeredBy: 'turn_end' as EventTrigger,
          rarity: 'common',
          tags: ['turn_event'],
          timestamp: Date.now()
        };

        await skillSystem.onGameEvent(gameEvent, mockGameState);

        const turnEndResult = await skillSystem.onTurnEnd(currentPlayer.id, mockGameState);
        expect(turnEndResult.success).toBe(true);

        mockGameState.currentPlayerIndex = (mockGameState.currentPlayerIndex + 1) % mockGameState.players.length;
        mockGameState.turn = turn;
      }

      const systemStats = skillSystem.getSystemStats();
      expect(systemStats.totalSkillsUsed).toBeGreaterThan(0);
      expect(systemStats.playerStats).toBeDefined();
    });

    test('should handle game state persistence and restoration', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      await skillSystem.useSkill('player1', 'persistent_skill', [], mockGameState);
      skillSystem.learnSkill('player2', 'new_learned_skill');

      const savedData = skillSystem.saveSkillSystemData(mockGameState);
      expect(savedData).toBeDefined();
      expect(savedData.systemState).toBeDefined();
      expect(savedData.playerSkills).toBeDefined();

      const newSkillSystem = new SkillSystemIntegration(DEFAULT_SKILL_SYSTEM_CONFIG);
      newSkillSystem.setGameEngine(mockGameEngine);
      newSkillSystem.activate();

      newSkillSystem.loadSkillSystemData(savedData, mockGameState);

      const restoredPlayer1Skills = newSkillSystem.getPlayerSkills('player1');
      const restoredPlayer2Skills = newSkillSystem.getPlayerSkills('player2');

      expect(restoredPlayer1Skills.length).toBeGreaterThan(0);
      expect(restoredPlayer2Skills.some(skill => skill.id === 'new_learned_skill')).toBe(true);
    });

    test('should handle error recovery and edge cases', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const invalidSkillResult = await skillSystem.useSkill('invalid_player', 'any_skill', [], mockGameState);
      expect(invalidSkillResult.success).toBe(false);

      const emptyTargetsResult = await skillSystem.useSkill('player1', 'target_required_skill', [], mockGameState);
      expect(emptyTargetsResult.success).toBe(false);

      mockGameState.players = [];
      const noPlayersResult = await skillSystem.onTurnStart('player1', mockGameState);
      expect(noPlayersResult.success).toBe(true);
    });

    test('should maintain performance under load', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const performancePromises: Promise<ActionResult>[] = [];

      for (let i = 0; i < 50; i++) {
        const playerId = `player${(i % 2) + 1}`;
        const skillPromise = skillSystem.useSkill(playerId, 'quick_skill', [], mockGameState);
        performancePromises.push(skillPromise);
      }

      const results = await Promise.all(performancePromises);
      const successCount = results.filter(result => result.success).length;

      expect(successCount).toBeGreaterThan(40);

      const systemStats = skillSystem.getSystemStats();
      expect(systemStats.systemPerformance.isActive).toBe(true);
      expect(systemStats.totalSkillsUsed).toBe(successCount);
    });

    test('should handle complex game state transitions', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      await skillSystem.onGameStart(mockGameState);

      const gamePhases: GamePhase[] = ['roll_dice', 'move_player', 'process_cell', 'handle_event', 'end_turn'];
      
      for (const phase of gamePhases) {
        mockGameState.phase = phase;
        
        const phaseStartResult = await skillSystem.onTurnStart('player1', mockGameState);
        expect(phaseStartResult.success).toBe(true);

        const availableSkills = skillSystem.getAvailableSkills('player1', mockGameState);
        const phaseSpecificSkills = availableSkills.filter(skill => 
          skill.tags.includes('any_phase') || skill.tags.includes(phase)
        );

        if (phaseSpecificSkills.length > 0) {
          const skillResult = await skillSystem.useSkill('player1', phaseSpecificSkills[0].id, [], mockGameState);
          expect(skillResult.success).toBe(true);
        }
      }

      const healthCheck = skillSystem.getHealthCheck();
      expect(healthCheck.isHealthy).toBe(true);
      expect(healthCheck.issues.length).toBe(0);
    });
  });

  describe('Game Engine Extension Tests', () => {
    test('should properly extend game engine with skill methods', () => {
      skillSystem.extendGameEngine(mockGameEngine);

      expect(mockGameEngine.usePlayerSkill).toBeDefined();
      expect(mockGameEngine.canUsePlayerSkill).toBeDefined();
      expect(mockGameEngine.getPlayerSkills).toBeDefined();
      expect(mockGameEngine.getAvailableSkills).toBeDefined();
      expect(mockGameEngine.learnPlayerSkill).toBeDefined();
      expect(mockGameEngine.getSkillSystemState).toBeDefined();
      expect(mockGameEngine.getSkillSystemStats).toBeDefined();
    });

    test('should integrate with game engine event system', () => {
      skillSystem.extendGameEngine(mockGameEngine);

      expect(mockGameEngine.addEventListener).toHaveBeenCalledWith('gameStart', expect.any(Function));
      expect(mockGameEngine.addEventListener).toHaveBeenCalledWith('turnStart', expect.any(Function));
      expect(mockGameEngine.addEventListener).toHaveBeenCalledWith('turnEnd', expect.any(Function));
      expect(mockGameEngine.addEventListener).toHaveBeenCalledWith('gameEvent', expect.any(Function));
      expect(mockGameEngine.addEventListener).toHaveBeenCalledWith('playerAction', expect.any(Function));
    });

    test('should handle game engine method calls correctly', async () => {
      skillSystem.setGameEngine(mockGameEngine);
      skillSystem.activate();
      skillSystem.extendGameEngine(mockGameEngine);
      await skillSystem.onGameStart(mockGameState);

      if (mockGameEngine.usePlayerSkill) {
        const result = await mockGameEngine.usePlayerSkill('player1', 'test_skill', [], mockGameState);
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      }

      if (mockGameEngine.canUsePlayerSkill) {
        const canUse = mockGameEngine.canUsePlayerSkill('player1', 'test_skill', mockGameState);
        expect(typeof canUse).toBe('boolean');
      }

      if (mockGameEngine.getPlayerSkills) {
        const skills = mockGameEngine.getPlayerSkills('player1');
        expect(Array.isArray(skills)).toBe(true);
      }

      if (mockGameEngine.getSkillSystemState) {
        const state = mockGameEngine.getSkillSystemState();
        expect(state).toBeDefined();
        expect(state.isInitialized).toBe(true);
        expect(state.isActive).toBe(true);
      }
    });
  });
});