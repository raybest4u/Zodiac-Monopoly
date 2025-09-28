import type { ZodiacSign } from './game';

// 游戏常量
export const GAME_CONSTANTS = {
  // 基础游戏设置
  BOARD_SIZE: 40,
  MAX_PLAYERS: 4,
  MIN_PLAYERS: 2,
  STARTING_MONEY: 10000,
  PASS_START_BONUS: 2000,
  MAX_ROUNDS: 100,
  
  // 骰子
  DICE_MIN: 1,
  DICE_MAX: 6,
  DICE_COUNT: 2,
  
  // 属性
  MAX_PROPERTY_LEVEL: 5,
  PROPERTY_GROUPS: 8,
  PROPERTIES_PER_GROUP: 3,
  
  // 技能
  MAX_SKILL_LEVEL: 10,
  SKILLS_PER_ZODIAC: 2,
  SKILL_COOLDOWN_BASE: 3,
  
  // 时间
  TURN_TIME_LIMIT: 120, // 秒
  ANIMATION_DURATION: 1000, // 毫秒
  AUTO_SAVE_INTERVAL: 300000, // 5分钟
  
  // 经济
  INFLATION_RATE: 0.02,
  TAX_RATE: 0.1,
  AUCTION_INCREMENT: 100,
  
  // AI
  AI_DECISION_TIME: 2000, // 毫秒
  AI_DIFFICULTY_LEVELS: 4,
  AI_LEARNING_RATE: 0.1,
} as const;

// 十二生肖数据
export const ZODIAC_DATA = {
  鼠: {
    name: '鼠',
    index: 0,
    element: '水',
    traits: ['机敏', '勤奋', '适应性强'],
    color: '#FFB800',
    lucky_numbers: [2, 3, 6, 8],
    compatible: ['龙', '猴'] as ZodiacSign[],
    conflict: ['马'] as ZodiacSign[],
    season_bonus: '冬',
    emoji: '🐭'
  },
  牛: {
    name: '牛',
    index: 1,
    element: '土',
    traits: ['稳重', '勤劳', '可靠'],
    color: '#8B4513',
    lucky_numbers: [1, 4, 5, 9],
    compatible: ['蛇', '鸡'] as ZodiacSign[],
    conflict: ['羊'] as ZodiacSign[],
    season_bonus: '春',
    emoji: '🐮'
  },
  虎: {
    name: '虎',
    index: 2,
    element: '木',
    traits: ['勇猛', '独立', '冒险'],
    color: '#FF4500',
    lucky_numbers: [1, 3, 4, 7],
    compatible: ['马', '狗'] as ZodiacSign[],
    conflict: ['猴'] as ZodiacSign[],
    season_bonus: '春',
    emoji: '🐯'
  },
  兔: {
    name: '兔',
    index: 3,
    element: '木',
    traits: ['温和', '细心', '优雅'],
    color: '#FFB6C1',
    lucky_numbers: [3, 4, 6, 9],
    compatible: ['羊', '猪'] as ZodiacSign[],
    conflict: ['鸡'] as ZodiacSign[],
    season_bonus: '春',
    emoji: '🐰'
  },
  龙: {
    name: '龙',
    index: 4,
    element: '土',
    traits: ['威严', '智慧', '领导力'],
    color: '#FFD700',
    lucky_numbers: [1, 6, 7, 8],
    compatible: ['鼠', '猴'] as ZodiacSign[],
    conflict: ['狗'] as ZodiacSign[],
    season_bonus: '夏',
    emoji: '🐲'
  },
  蛇: {
    name: '蛇',
    index: 5,
    element: '火',
    traits: ['神秘', '智慧', '直觉'],
    color: '#9370DB',
    lucky_numbers: [2, 8, 9],
    compatible: ['牛', '鸡'] as ZodiacSign[],
    conflict: ['猪'] as ZodiacSign[],
    season_bonus: '夏',
    emoji: '🐍'
  },
  马: {
    name: '马',
    index: 6,
    element: '火',
    traits: ['活力', '自由', '热情'],
    color: '#DC143C',
    lucky_numbers: [2, 3, 7],
    compatible: ['虎', '狗'] as ZodiacSign[],
    conflict: ['鼠'] as ZodiacSign[],
    season_bonus: '夏',
    emoji: '🐴'
  },
  羊: {
    name: '羊',
    index: 7,
    element: '土',
    traits: ['温柔', '艺术', '和谐'],
    color: '#98FB98',
    lucky_numbers: [2, 7, 8],
    compatible: ['兔', '猪'] as ZodiacSign[],
    conflict: ['牛'] as ZodiacSign[],
    season_bonus: '秋',
    emoji: '🐑'
  },
  猴: {
    name: '猴',
    index: 8,
    element: '金',
    traits: ['聪明', '机智', '灵活'],
    color: '#FFA500',
    lucky_numbers: [4, 9],
    compatible: ['鼠', '龙'] as ZodiacSign[],
    conflict: ['虎'] as ZodiacSign[],
    season_bonus: '秋',
    emoji: '🐵'
  },
  鸡: {
    name: '鸡',
    index: 9,
    element: '金',
    traits: ['勤奋', '准时', '负责'],
    color: '#FF6347',
    lucky_numbers: [5, 7, 8],
    compatible: ['牛', '蛇'] as ZodiacSign[],
    conflict: ['兔'] as ZodiacSign[],
    season_bonus: '秋',
    emoji: '🐔'
  },
  狗: {
    name: '狗',
    index: 10,
    element: '土',
    traits: ['忠诚', '诚实', '责任感'],
    color: '#8B4513',
    lucky_numbers: [3, 4, 9],
    compatible: ['虎', '马'] as ZodiacSign[],
    conflict: ['龙'] as ZodiacSign[],
    season_bonus: '冬',
    emoji: '🐕'
  },
  猪: {
    name: '猪',
    index: 11,
    element: '水',
    traits: ['善良', '慷慨', '乐观'],
    color: '#FFB6C1',
    lucky_numbers: [2, 5, 8],
    compatible: ['兔', '羊'] as ZodiacSign[],
    conflict: ['蛇'] as ZodiacSign[],
    season_bonus: '冬',
    emoji: '🐷'
  }
} as const;

// 季节数据
export const SEASON_DATA = {
  春: {
    name: '春',
    index: 0,
    element: '木',
    months: [3, 4, 5],
    bonus_zodiacs: ['虎', '兔'],
    weather_effects: {
      property_growth: 1.1,
      skill_cooldown: 0.9,
      event_frequency: 1.2
    },
    emoji: '🌸',
    color: '#90EE90'
  },
  夏: {
    name: '夏',
    index: 1,
    element: '火',
    months: [6, 7, 8],
    bonus_zodiacs: ['马', '蛇', '龙'],
    weather_effects: {
      energy_bonus: 1.2,
      travel_speed: 1.1,
      trade_bonus: 1.1
    },
    emoji: '☀️',
    color: '#FFD700'
  },
  秋: {
    name: '秋',
    index: 2,
    element: '金',
    months: [9, 10, 11],
    bonus_zodiacs: ['猴', '鸡', '羊'],
    weather_effects: {
      harvest_bonus: 1.3,
      property_value: 1.1,
      wisdom_bonus: 1.2
    },
    emoji: '🍂',
    color: '#FF8C00'
  },
  冬: {
    name: '冬',
    index: 3,
    element: '水',
    months: [12, 1, 2],
    bonus_zodiacs: ['鼠', '狗', '猪'],
    weather_effects: {
      patience_bonus: 1.2,
      defense_bonus: 1.1,
      planning_bonus: 1.1
    },
    emoji: '❄️',
    color: '#87CEEB'
  }
} as const;

// 棋盘配置
export const BOARD_CONFIG = {
  // 特殊格子位置
  START_POSITION: 0,
  JAIL_POSITION: 10,
  FREE_PARKING_POSITION: 20,
  GO_TO_JAIL_POSITION: 30,
  
  // 格子类型分布
  PROPERTY_POSITIONS: [1, 3, 6, 8, 9, 11, 13, 14, 16, 18, 19, 21, 23, 24, 26, 27, 29, 31, 32, 34, 37, 39],
  CHANCE_POSITIONS: [7, 22, 36],
  COMMUNITY_CHEST_POSITIONS: [2, 17, 33],
  TAX_POSITIONS: [4, 38],
  UTILITY_POSITIONS: [12, 28],
  RAILROAD_POSITIONS: [5, 15, 25, 35],
  
  // 属性组
  PROPERTY_GROUPS: {
    brown: [1, 3],
    light_blue: [6, 8, 9],
    pink: [11, 13, 14],
    orange: [16, 18, 19],
    red: [21, 23, 24],
    yellow: [26, 27, 29],
    green: [31, 32, 34],
    blue: [37, 39]
  },
  
  // 属性组颜色
  GROUP_COLORS: {
    brown: '#8B4513',
    light_blue: '#87CEEB',
    pink: '#FFB6C1',
    orange: '#FFA500',
    red: '#FF0000',
    yellow: '#FFFF00',
    green: '#008000',
    blue: '#0000FF'
  }
} as const;

// 技能常量
export const SKILL_CONSTANTS = {
  // 技能类型
  TYPES: {
    ACTIVE: 'active',
    PASSIVE: 'passive',
    TRIGGERED: 'triggered'
  },
  
  // 技能标签
  TAGS: {
    OFFENSIVE: 'offensive',
    DEFENSIVE: 'defensive',
    ECONOMIC: 'economic',
    SOCIAL: 'social',
    ZODIAC_SYNERGY: 'zodiac_synergy',
    SEASONAL: 'seasonal'
  },
  
  // 冷却时间基础值
  COOLDOWN_BASE: {
    LOW: 1,
    MEDIUM: 3,
    HIGH: 5,
    ULTIMATE: 8
  },
  
  // 技能效果强度
  EFFECT_POWER: {
    WEAK: 0.1,
    MODERATE: 0.25,
    STRONG: 0.5,
    VERY_STRONG: 0.75,
    ULTIMATE: 1.0
  }
} as const;

// AI常量
export const AI_CONSTANTS = {
  // 难度设置
  DIFFICULTY: {
    EASY: {
      level: 'easy',
      decision_time: 3000,
      mistake_rate: 0.3,
      optimization: 0.4
    },
    MEDIUM: {
      level: 'medium',
      decision_time: 2000,
      mistake_rate: 0.15,
      optimization: 0.7
    },
    HARD: {
      level: 'hard',
      decision_time: 1500,
      mistake_rate: 0.05,
      optimization: 0.9
    },
    EXPERT: {
      level: 'expert',
      decision_time: 1000,
      mistake_rate: 0.01,
      optimization: 0.95
    }
  },
  
  // 个性特征范围
  PERSONALITY_RANGES: {
    MIN: 0.0,
    MAX: 1.0,
    DEFAULT: 0.5,
    VARIANCE: 0.2
  },
  
  // 学习参数
  LEARNING: {
    RATE: 0.1,
    DISCOUNT_FACTOR: 0.9,
    EXPLORATION_RATE: 0.1,
    BATCH_SIZE: 32
  }
} as const;

// UI常量
export const UI_CONSTANTS = {
  // 断点
  BREAKPOINTS: {
    XS: 0,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1400
  },
  
  // 动画时长
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    EXTRA_SLOW: 1000
  },
  
  // Z-index层级
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1010,
    FIXED: 1020,
    MODAL_BACKDROP: 1030,
    MODAL: 1040,
    POPOVER: 1050,
    TOOLTIP: 1060,
    NOTIFICATION: 1070
  },
  
  // 颜色
  COLORS: {
    PRIMARY: '#1890ff',
    SUCCESS: '#52c41a',
    WARNING: '#faad14',
    ERROR: '#f5222d',
    INFO: '#1890ff',
    TEXT: '#000000d9',
    TEXT_SECONDARY: '#00000073',
    BORDER: '#d9d9d9',
    BACKGROUND: '#ffffff'
  }
} as const;

// 音效常量
export const AUDIO_CONSTANTS = {
  // 音效类型
  TYPES: {
    UI: 'ui',
    GAME: 'game',
    AMBIENT: 'ambient',
    VOICE: 'voice',
    MUSIC: 'music'
  },
  
  // 默认音量
  DEFAULT_VOLUME: {
    MASTER: 0.8,
    UI: 0.6,
    GAME: 0.8,
    AMBIENT: 0.4,
    VOICE: 1.0,
    MUSIC: 0.5
  },
  
  // 音效文件
  SOUNDS: {
    // UI音效
    CLICK: '/sounds/ui/click.mp3',
    HOVER: '/sounds/ui/hover.mp3',
    ERROR: '/sounds/ui/error.mp3',
    SUCCESS: '/sounds/ui/success.mp3',
    
    // 游戏音效
    DICE_ROLL: '/sounds/game/dice_roll.mp3',
    MOVE_PIECE: '/sounds/game/move_piece.mp3',
    BUY_PROPERTY: '/sounds/game/buy_property.mp3',
    SKILL_USE: '/sounds/game/skill_use.mp3',
    
    // 环境音效
    BACKGROUND_MUSIC: '/sounds/ambient/background.mp3',
    WIND: '/sounds/ambient/wind.mp3',
    
    // 生肖音效
    ZODIAC_SOUNDS: {
      鼠: '/sounds/zodiac/rat.mp3',
      牛: '/sounds/zodiac/ox.mp3',
      虎: '/sounds/zodiac/tiger.mp3',
      兔: '/sounds/zodiac/rabbit.mp3',
      龙: '/sounds/zodiac/dragon.mp3',
      蛇: '/sounds/zodiac/snake.mp3',
      马: '/sounds/zodiac/horse.mp3',
      羊: '/sounds/zodiac/goat.mp3',
      猴: '/sounds/zodiac/monkey.mp3',
      鸡: '/sounds/zodiac/rooster.mp3',
      狗: '/sounds/zodiac/dog.mp3',
      猪: '/sounds/zodiac/pig.mp3'
    }
  }
} as const;

// 语音控制常量
export const VOICE_CONSTANTS = {
  // 支持的语言
  LANGUAGES: ['zh-CN', 'en-US'],
  
  // 命令模式
  PATTERNS: {
    ROLL_DICE: ['掷骰子', '投骰子', 'roll dice', 'throw dice'],
    BUY_PROPERTY: ['购买', '买下', 'buy', 'purchase'],
    USE_SKILL: ['使用技能', '释放技能', 'use skill', 'cast skill'],
    END_TURN: ['结束回合', '回合结束', 'end turn', 'finish turn'],
    HELP: ['帮助', '说明', 'help', 'instructions']
  },
  
  // 识别阈值
  CONFIDENCE_THRESHOLD: 0.7,
  
  // 超时设置
  TIMEOUT: {
    LISTENING: 5000,
    PROCESSING: 3000
  }
} as const;

// 本地化常量
export const LOCALIZATION = {
  // 默认语言
  DEFAULT_LANGUAGE: 'zh-CN',
  
  // 支持的语言
  SUPPORTED_LANGUAGES: ['zh-CN', 'en-US'],
  
  // 日期格式
  DATE_FORMATS: {
    'zh-CN': 'YYYY年MM月DD日',
    'en-US': 'MM/DD/YYYY'
  },
  
  // 数字格式
  NUMBER_FORMATS: {
    'zh-CN': {
      currency: '¥',
      decimal: '.',
      thousand: ','
    },
    'en-US': {
      currency: '$',
      decimal: '.',
      thousand: ','
    }
  }
} as const;

// 性能常量
export const PERFORMANCE_CONSTANTS = {
  // 帧率目标
  TARGET_FPS: 60,
  
  // 渲染批次大小
  RENDER_BATCH_SIZE: 50,
  
  // 内存限制
  MEMORY_LIMITS: {
    CACHE_SIZE: 50 * 1024 * 1024, // 50MB
    TEXTURE_SIZE: 20 * 1024 * 1024, // 20MB
    AUDIO_SIZE: 10 * 1024 * 1024 // 10MB
  },
  
  // 性能阈值
  PERFORMANCE_THRESHOLDS: {
    FRAME_TIME: 16.67, // ms (60fps)
    MEMORY_WARNING: 0.8, // 80%
    MEMORY_CRITICAL: 0.95 // 95%
  }
} as const;

// 调试常量
export const DEBUG_CONSTANTS = {
  // 日志级别
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    VERBOSE: 4
  },
  
  // 调试模式
  MODES: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    DEBUG: 'debug'
  },
  
  // 性能监控
  MONITORING: {
    ENABLED: true,
    SAMPLE_RATE: 0.1,
    METRICS_INTERVAL: 1000
  }
} as const;

// 导出所有常量的类型
export type ZodiacDataType = typeof ZODIAC_DATA;
export type SeasonDataType = typeof SEASON_DATA;
export type GameConstantsType = typeof GAME_CONSTANTS;
export type BoardConfigType = typeof BOARD_CONFIG;
export type SkillConstantsType = typeof SKILL_CONSTANTS;
export type AIConstantsType = typeof AI_CONSTANTS;
export type UIConstantsType = typeof UI_CONSTANTS;
export type AudioConstantsType = typeof AUDIO_CONSTANTS;
export type VoiceConstantsType = typeof VOICE_CONSTANTS;

// 辅助函数类型
export type GetZodiacData = (zodiac: ZodiacSign) => typeof ZODIAC_DATA[ZodiacSign];
export type GetSeasonData = (season: keyof typeof SEASON_DATA) => typeof SEASON_DATA[keyof typeof SEASON_DATA];