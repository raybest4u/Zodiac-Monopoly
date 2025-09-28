import { GameEngine } from '../GameEngine';
import type { GameConfig } from '../../types/storage';

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockConfig: GameConfig;

  beforeEach(() => {
    gameEngine = new GameEngine();
    mockConfig = {
      playerName: '测试玩家',
      playerZodiac: '龙',
      difficulty: 'easy',
      aiOpponents: [
        {
          id: 'ai1',
          name: 'AI对手1',
          zodiac: '虎',
          difficulty: 'easy'
        }
      ],
      gameRules: {
        startingMoney: 10000,
        passStartBonus: 2000,
        maxRounds: 50,
        winCondition: 'last_standing',
        propertyAuctionEnabled: true,
        mortgageEnabled: true,
        tradingEnabled: true,
        skillsEnabled: true,
        skillCooldownModifier: 1.0,
        eventsEnabled: true,
        eventFrequency: 'normal',
        seasonalEffectsEnabled: true,
        seasonLength: 10
      },
      uiSettings: {
        theme: 'default',
        animationSpeed: 'normal',
        soundEnabled: true,
        musicEnabled: true,
        autoSaveEnabled: true,
        autoSaveInterval: 300000,
        confirmActions: true,
        highContrastMode: false,
        largeFontMode: false,
        voiceControlEnabled: false,
        showDebugInfo: false,
        logLevel: 'info'
      }
    };
  });

  afterEach(() => {
    // 清理
    if (gameEngine.isGameRunning()) {
      gameEngine.pauseGame();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await gameEngine.initialize(mockConfig);
      
      const gameState = gameEngine.getGameState();
      expect(gameState).not.toBeNull();
      expect(gameState?.status).toBe('waiting');
      expect(gameState?.players).toHaveLength(2); // 1 human + 1 AI
    });

    test('should create human player correctly', async () => {
      await gameEngine.initialize(mockConfig);
      
      const gameState = gameEngine.getGameState();
      const humanPlayer = gameState?.players.find(p => p.isHuman);
      
      expect(humanPlayer).toBeDefined();
      expect(humanPlayer?.name).toBe('测试玩家');
      expect(humanPlayer?.zodiac).toBe('龙');
      expect(humanPlayer?.money).toBe(10000);
      expect(humanPlayer?.position).toBe(0);
    });

    test('should create AI players correctly', async () => {
      await gameEngine.initialize(mockConfig);
      
      const gameState = gameEngine.getGameState();
      const aiPlayers = gameState?.players.filter(p => !p.isHuman);
      
      expect(aiPlayers).toHaveLength(1);
      expect(aiPlayers?.[0]?.name).toBe('AI对手1');
      expect(aiPlayers?.[0]?.zodiac).toBe('虎');
    });

    test('should generate board correctly', async () => {
      await gameEngine.initialize(mockConfig);
      
      const gameState = gameEngine.getGameState();
      expect(gameState?.board).toHaveLength(40);
      expect(gameState?.board[0].type).toBe('start');
      expect(gameState?.board[0].name).toBe('起点');
    });
  });

  describe('Game Control', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should start game successfully', async () => {
      const gameState = gameEngine.getGameState();
      expect(gameState?.status).toBe('waiting');

      await gameEngine.startGame();
      
      expect(gameEngine.isGameRunning()).toBe(true);
      expect(gameState?.status).toBe('playing');
    });

    test('should pause and resume game', async () => {
      await gameEngine.startGame();
      
      gameEngine.pauseGame();
      expect(gameEngine.getGameState()?.status).toBe('paused');
      
      gameEngine.resumeGame();
      expect(gameEngine.getGameState()?.status).toBe('playing');
    });

    test('should not start game if not waiting', async () => {
      await gameEngine.startGame();
      
      await expect(gameEngine.startGame()).rejects.toThrow();
    });
  });

  describe('Dice Rolling', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should roll dice within valid range', () => {
      const result = gameEngine.rollDice();
      
      expect(result.dice1).toBeGreaterThanOrEqual(1);
      expect(result.dice1).toBeLessThanOrEqual(6);
      expect(result.dice2).toBeGreaterThanOrEqual(1);
      expect(result.dice2).toBeLessThanOrEqual(6);
      expect(result.total).toBe(result.dice1 + result.dice2);
      expect(result.isDouble).toBe(result.dice1 === result.dice2);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    test('should update game state with dice result', () => {
      const result = gameEngine.rollDice();
      const gameState = gameEngine.getGameState();
      
      expect(gameState?.lastDiceResult).toEqual(result);
    });
  });

  describe('Player Management', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should get current player', () => {
      const currentPlayer = gameEngine.getCurrentPlayer();
      const gameState = gameEngine.getGameState();
      
      expect(currentPlayer).toBeDefined();
      expect(currentPlayer).toBe(gameState?.players[0]);
    });
  });

  describe('Player Actions', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should execute roll dice action', async () => {
      const player = gameEngine.getCurrentPlayer();
      expect(player).toBeDefined();

      const action = {
        type: 'roll_dice' as const,
        playerId: player!.id,
        timestamp: Date.now(),
        data: {}
      };

      const result = await gameEngine.executePlayerAction(action);
      expect(result).toBe(true);
    });

    test('should get available actions for current player', () => {
      const player = gameEngine.getCurrentPlayer();
      expect(player).toBeDefined();

      const actions = gameEngine.getAvailableActions(player!.id);
      expect(actions).toBeInstanceOf(Array);
      expect(actions.length).toBeGreaterThan(0);
      
      // Should have at least roll dice action
      const rollDiceAction = actions.find(a => a.type === 'roll_dice');
      expect(rollDiceAction).toBeDefined();
    });

    test('should not allow actions from non-current player', () => {
      const gameState = gameEngine.getGameState();
      expect(gameState).toBeDefined();
      
      // Get a player that's not current
      const otherPlayer = gameState!.players.find(p => p.id !== gameState!.players[gameState!.currentPlayerIndex].id);
      expect(otherPlayer).toBeDefined();

      const actions = gameEngine.getAvailableActions(otherPlayer!.id);
      expect(actions).toHaveLength(0);
    });
  });

  describe('Player Movement', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should move player correctly', async () => {
      const player = gameEngine.getCurrentPlayer();
      expect(player).toBeDefined();

      const initialPosition = player!.position;
      await gameEngine.movePlayer(player!.id, 5);

      expect(player!.position).toBe((initialPosition + 5) % 40);
    });

    test('should handle passing start', async () => {
      const player = gameEngine.getCurrentPlayer();
      expect(player).toBeDefined();

      const initialMoney = player!.money;
      player!.position = 38; // Near the end of board
      
      await gameEngine.movePlayer(player!.id, 5); // Should pass start

      expect(player!.position).toBe(3); // 38 + 5 - 40 = 3
      expect(player!.money).toBeGreaterThan(initialMoney); // Should get pass start bonus
    });
  });

  describe('Turn Management', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should advance to next turn', async () => {
      const gameState = gameEngine.getGameState();
      expect(gameState).toBeDefined();

      const initialPlayerIndex = gameState!.currentPlayerIndex;
      const initialTurn = gameState!.turn;

      await gameEngine.nextTurn();

      expect(gameState!.currentPlayerIndex).toBe((initialPlayerIndex + 1) % gameState!.players.length);
      expect(gameState!.turn).toBe(initialTurn + 1);
    });

    test('should increment round when completing player cycle', async () => {
      const gameState = gameEngine.getGameState();
      expect(gameState).toBeDefined();

      const initialRound = gameState!.round;
      const playerCount = gameState!.players.length;

      // Complete a full cycle of players
      for (let i = 0; i < playerCount; i++) {
        await gameEngine.nextTurn();
      }

      expect(gameState!.round).toBe(initialRound + 1);
    });
  });

  describe('Game State Management', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should save and restore game state', () => {
      const initialGameState = gameEngine.getGameState();
      expect(initialGameState).toBeDefined();

      const initialTurn = initialGameState!.turn;
      gameEngine.saveGameState();

      // Modify state
      initialGameState!.turn = initialTurn + 5;

      // Restore previous state
      const restored = gameEngine.restoreGameState(1);
      expect(restored).toBe(true);
      
      // Get the restored state (new object reference)
      const restoredState = gameEngine.getGameState();
      expect(restoredState!.turn).toBe(initialTurn);
    });

    test('should handle insufficient history for restoration', () => {
      const restored = gameEngine.restoreGameState(100);
      expect(restored).toBe(false);
    });
  });

  describe('Skill System', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should create zodiac skills for players', () => {
      const gameState = gameEngine.getGameState();
      expect(gameState).toBeDefined();

      const humanPlayer = gameState!.players.find(p => p.isHuman);
      expect(humanPlayer).toBeDefined();
      expect(humanPlayer!.skills.length).toBeGreaterThan(0);

      // Should have a basic skill
      const basicSkill = humanPlayer!.skills.find(s => s.tags.includes('economic'));
      expect(basicSkill).toBeDefined();
    });

    test('should use skill correctly', async () => {
      const player = gameEngine.getCurrentPlayer();
      expect(player).toBeDefined();

      const skill = player!.skills[0];
      expect(skill).toBeDefined();

      const result = await gameEngine.useSkill(player!.id, skill.id);

      expect(result).toBe(true);
      expect(skill.lastUsed).toBeDefined();
      expect(player!.statistics.skillsUsed).toBe(1);
    });

    test('should respect skill cooldowns', async () => {
      const player = gameEngine.getCurrentPlayer();
      expect(player).toBeDefined();

      const skill = player!.skills[0];
      expect(skill).toBeDefined();

      // Use skill first time
      await gameEngine.useSkill(player!.id, skill.id);

      // Try to use again immediately (should fail due to cooldown)
      const result = await gameEngine.useSkill(player!.id, skill.id);
      expect(result).toBe(false);
    });
  });

  describe('Board Interaction', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should handle property landing', async () => {
      const gameState = gameEngine.getGameState();
      const player = gameEngine.getCurrentPlayer();
      expect(gameState && player).toBeTruthy();

      // Find a property cell
      const propertyCell = gameState!.board.find(cell => cell.type === 'property');
      expect(propertyCell).toBeDefined();

      // Move player to property
      player!.position = propertyCell!.position;
      
      const eventEmitter = gameEngine.getEventEmitter();
      let eventEmitted = false;

      eventEmitter.on('property:available', () => {
        eventEmitted = true;
      });

      // Trigger cell landing
      await (gameEngine as any).handleCellLanding(player, propertyCell);
      
      expect(eventEmitted).toBe(true);
    });

    test('should handle special cell landing', async () => {
      const gameState = gameEngine.getGameState();
      const player = gameEngine.getCurrentPlayer();
      expect(gameState && player).toBeTruthy();

      // Find the jail cell (position 30 - go to jail)
      const jailCell = gameState!.board.find(cell => cell.name === '入狱');
      expect(jailCell).toBeDefined();

      // Move player to go-to-jail cell
      player!.position = jailCell!.position;
      
      const eventEmitter = gameEngine.getEventEmitter();
      let playerJailed = false;

      eventEmitter.on('player:jailed', () => {
        playerJailed = true;
      });

      // Trigger cell landing
      await (gameEngine as any).handleCellLanding(player, jailCell);
      
      expect(playerJailed).toBe(true);
      expect(player!.position).toBe(10); // Should be moved to jail position
    });
  });

  describe('Game End Conditions', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should end game correctly', () => {
      const gameState = gameEngine.getGameState();
      const player = gameEngine.getCurrentPlayer();
      expect(gameState && player).toBeTruthy();

      let gameEnded = false;
      const eventEmitter = gameEngine.getEventEmitter();
      
      eventEmitter.on('game:ended', () => {
        gameEnded = true;
      });

      gameEngine.endGame(player!);

      expect(gameState!.status).toBe('ended');
      expect(gameEngine.isGameRunning()).toBe(false);
      expect(gameEnded).toBe(true);
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await gameEngine.initialize(mockConfig);
    });

    test('should emit events correctly', (done) => {
      const eventEmitter = gameEngine.getEventEmitter();
      
      eventEmitter.on('test:event', (data) => {
        expect(data).toBe('test data');
        done();
      });
      
      eventEmitter.emit('test:event', 'test data');
    });

    test('should emit dice roll events', (done) => {
      const eventEmitter = gameEngine.getEventEmitter();
      
      eventEmitter.on('dice:rolled', (result) => {
        expect(result).toBeDefined();
        expect(result.total).toBeGreaterThanOrEqual(2);
        expect(result.total).toBeLessThanOrEqual(12);
        done();
      });
      
      gameEngine.rollDice();
    });

    test('should track game events in history', async () => {
      const gameState = gameEngine.getGameState();
      const player = gameEngine.getCurrentPlayer();
      expect(gameState && player).toBeTruthy();

      const initialEventCount = gameState!.eventHistory.length;

      // Trigger an event by using a skill
      if (player!.skills.length > 0) {
        await gameEngine.useSkill(player!.id, player!.skills[0].id);
        expect(gameState!.eventHistory.length).toBe(initialEventCount + 1);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      const invalidConfig = { ...mockConfig } as any;
      delete invalidConfig.playerName;

      await expect(gameEngine.initialize(invalidConfig)).rejects.toThrow();
    });

    test('should handle invalid player actions', async () => {
      await gameEngine.initialize(mockConfig);
      
      const result = await gameEngine.executePlayerAction({
        type: 'use_skill',
        playerId: 'invalid-player-id',
        timestamp: Date.now(),
        data: { skillId: 'invalid-skill' }
      });

      expect(result).toBe(false);
    });
  });
});