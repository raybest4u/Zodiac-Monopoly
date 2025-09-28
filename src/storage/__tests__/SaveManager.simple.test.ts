// Simple SaveManager test to debug issues

// Mock all dependencies completely
const mockDbManager = {
  initialize: jest.fn().mockResolvedValue(undefined),
  saveSaveData: jest.fn().mockResolvedValue(undefined),
  saveSaveInfo: jest.fn().mockResolvedValue(undefined),
  loadSaveData: jest.fn().mockResolvedValue(null),
  loadSaveInfo: jest.fn().mockResolvedValue(null),
  deleteSaveData: jest.fn().mockResolvedValue(undefined),
  deleteSaveInfo: jest.fn().mockResolvedValue(undefined),
  listSaves: jest.fn().mockResolvedValue([]),
  getStorageUsage: jest.fn().mockResolvedValue({
    totalSaves: 0,
    totalSize: 0,
    saves: []
  }),
  saveBackup: jest.fn().mockResolvedValue(undefined),
  saveBackupInfo: jest.fn().mockResolvedValue(undefined),
  listBackups: jest.fn().mockResolvedValue([]),
  deleteBackup: jest.fn().mockResolvedValue(undefined),
  deleteBackupInfo: jest.fn().mockResolvedValue(undefined),
  cleanup: jest.fn().mockResolvedValue(undefined)
};

const mockCompressionService = {
  compress: jest.fn().mockImplementation((data) => 
    Promise.resolve(new Blob([data], { type: 'application/json' }))
  ),
  decompress: jest.fn().mockImplementation((blob) => blob.text()),
  getThreshold: jest.fn().mockReturnValue(1024),
  shouldCompress: jest.fn().mockReturnValue(false)
};

const mockValidationService = {
  validateSaveData: jest.fn().mockResolvedValue({
    isValid: true,
    errors: [],
    warnings: []
  }),
  validateGameConfig: jest.fn().mockReturnValue({
    isValid: true,
    errors: [],
    warnings: []
  })
};

jest.mock('../DatabaseManager', () => ({
  DatabaseManager: jest.fn().mockImplementation(() => mockDbManager)
}));

jest.mock('../CompressionService', () => ({
  CompressionService: jest.fn().mockImplementation(() => mockCompressionService)
}));

jest.mock('../ValidationService', () => ({
  ValidationService: jest.fn().mockImplementation(() => mockValidationService)
}));

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockImplementation(() => {
        const mockHash = new ArrayBuffer(32);
        const view = new Uint8Array(mockHash);
        for (let i = 0; i < 32; i++) {
          view[i] = i;
        }
        return Promise.resolve(mockHash);
      })
    }
  }
});

// Mock TextEncoder
Object.defineProperty(global, 'TextEncoder', {
  value: jest.fn().mockImplementation(() => ({
    encode: jest.fn().mockImplementation((text) => {
      return new Uint8Array(Buffer.from(text, 'utf8'));
    })
  }))
});

// Mock TextDecoder
Object.defineProperty(global, 'TextDecoder', {
  value: jest.fn().mockImplementation(() => ({
    decode: jest.fn().mockImplementation((buffer) => {
      return Buffer.from(buffer).toString('utf8');
    })
  }))
});

import { SaveManager } from '../SaveManager';
import type { GameState } from '../../types/game';
import type { AIState } from '../../types/ai';

const mockGameState: GameState = {
  gameId: 'test-game-1',
  status: 'playing',
  mode: 'classic',
  players: [
    {
      id: 'player-1',
      name: '测试玩家',
      zodiac: '龙',
      isHuman: true,
      position: 5,
      money: 15000,
      properties: [],
      items: [],
      skills: [],
      statusEffects: [],
      statistics: {
        turnsPlayed: 10,
        moneyEarned: 5000,
        moneySpent: 3000,
        propertiesBought: 2,
        propertiesSold: 0,
        skillsUsed: 3,
        eventsTriggered: 5,
        rentCollected: 1200,
        rentPaid: 800
      }
    }
  ],
  currentPlayerIndex: 0,
  round: 3,
  phase: 'roll_dice',
  turn: 15,
  board: Array.from({ length: 40 }, (_, i) => ({
    id: `cell-${i}`,
    position: i,
    type: i === 0 ? 'start' as const : 'property' as const,
    name: i === 0 ? '起点' : `地产${i}`,
    color: '#4a90e2',
    description: i === 0 ? '游戏起始点' : `这是第${i}号地产`
  })),
  eventHistory: [],
  season: '春',
  weather: '晴',
  marketTrends: {
    propertyPriceMultiplier: 1.0,
    rentMultiplier: 1.0,
    salaryBonus: 0,
    taxRate: 0.1,
    skillCooldownModifier: 1.0
  },
  startTime: Date.now() - 3600000,
  elapsedTime: 3600000,
  lastUpdateTime: Date.now()
};

const mockAIStates: AIState[] = [];

describe('SaveManager Simple Test', () => {
  let saveManager: SaveManager;

  beforeEach(async () => {
    // Clear all mock calls
    jest.clearAllMocks();
    
    saveManager = new SaveManager({
      databaseName: 'test_db',
      version: 1,
      cacheConfig: {
        maxSize: 50 * 1024 * 1024, // 50MB
        ttl: 60000,
        cleanupInterval: 300000
      },
      compressionEnabled: false,
      encryptionEnabled: false,
      autoBackupEnabled: false,
      maxBackups: 10
    });

    await saveManager.initialize();
  });

  test('should create a save successfully', async () => {
    try {
      const result = await saveManager.createSave(
        '测试存档',
        mockGameState,
        mockAIStates
      );

      // Log the result regardless of success/failure
      if (result.success) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.name).toBe('测试存档');
        expect(result.data?.saveId).toBeDefined();
      } else {
        // Fail the test with the actual error message
        throw new Error(`SaveManager.createSave failed: ${result.error}`);
      }
    } catch (error) {
      throw new Error(`SaveManager.createSave threw exception: ${error}`);
    }
  });
});