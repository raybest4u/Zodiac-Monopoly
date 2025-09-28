# 十二生肖大富翁 - 事件系统

本项目实现了一个完整的事件驱动架构，用于处理游戏中的各种事件，包括随机事件、玩家行动、游戏状态变化等。

## 系统架构

### 核心组件

1. **EventTriggerSystem** - 事件触发系统
   - 基于条件的事件触发
   - 时间触发器
   - 状态变化触发器
   - 事件链支持

2. **EventProcessingSystem** - 事件处理系统
   - 高性能事件处理
   - 批量处理支持
   - 优先级队列
   - 错误恢复机制

3. **EventResponseSystem** - 事件响应系统
   - UI更新响应
   - 音效播放
   - 动画效果
   - 数据统计

4. **RandomEventSystem** - 随机事件系统
   - 模板化事件生成
   - 条件触发
   - 权重系统
   - 事件历史跟踪

5. **EventEffectSystem** - 事件效果系统
   - 金钱变化
   - 位置移动
   - 状态效果
   - 财产变更

6. **EventUISystem** - 事件UI系统
   - React组件渲染
   - 事件显示
   - 用户交互
   - 主题系统

## 使用方式

### 基础集成

```typescript
import { IntegratedEventSystem } from './EventSystemDemo';

// 创建事件系统实例
const eventSystem = new IntegratedEventSystem();

// 启动系统
eventSystem.start({
  players: [
    { id: 'player1', money: 10000, position: 0, properties: [] }
  ],
  currentPlayerIndex: 0,
  turn: 1
});

// 处理玩家行动
await eventSystem.handlePlayerAction('player1', 'player-move', {
  fromPosition: 0,
  toPosition: 5
});

// 触发随机事件检查
await eventSystem.checkRandomEvents();

// 获取系统统计
const stats = eventSystem.getSystemStats();
console.log('事件系统状态:', stats);
```

### 自定义事件处理器

```typescript
// 注册自定义事件处理器
processingSystem.registerProcessor({
  id: 'custom-processor',
  name: '自定义处理器',
  eventTypes: ['custom-event'],
  priority: 5,
  enabled: true,
  process: async (event, context) => {
    // 自定义处理逻辑
    console.log('处理自定义事件:', event);
    
    return {
      success: true,
      data: { customProcessed: true },
      duration: 100
    };
  },
  options: {
    concurrent: true,
    timeout: 5000,
    retries: 2
  },
  stats: { processed: 0, succeeded: 0, failed: 0, averageTime: 0 }
});
```

### 创建随机事件模板

```typescript
// 注册随机事件模板
randomEventSystem.registerTemplate({
  id: 'lucky-find',
  name: '幸运发现',
  description: '玩家在路上发现金钱的随机事件',
  category: 'luck',
  tags: ['money', 'positive'],
  generationRules: {
    valueRanges: {
      amount: [500, 2000]
    },
    textVariations: {
      title: ['意外收获', '幸运发现', '路边惊喜'],
      description: ['你在路上发现了钱包！', '你捡到了掉落的钞票！']
    },
    conditionalElements: []
  },
  baseEvent: {
    title: '意外收获',
    description: '你在路上发现了一些钱！',
    type: 'luck',
    effects: [{
      id: 'money-bonus',
      type: 'money',
      operation: 'add',
      value: 1000,
      target: 'current_player',
      conditions: []
    }],
    choices: [],
    metadata: { category: 'luck', rarity: 'common' }
  }
});
```

### 事件效果应用

```typescript
// 应用金钱效果
const moneyEffect = {
  id: 'bonus-money',
  type: 'money',
  operation: 'add',
  value: 1500,
  target: 'current_player',
  conditions: []
};

const context = {
  gameState: gameState,
  playerState: currentPlayer,
  boardState: { currentPosition: currentPlayer.position },
  eventData: { source: 'random-event' },
  timestamp: Date.now()
};

const result = await effectSystem.applyEffect(moneyEffect, context);
if (result.success) {
  console.log('金钱效果应用成功:', result.changes);
}
```

## 事件类型

### 游戏事件类型
- `player-move` - 玩家移动
- `player-buy` - 玩家购买财产
- `player-sell` - 玩家出售财产
- `random-event` - 随机事件
- `game-state-update` - 游戏状态更新
- `turn-end` - 回合结束
- `game-win` - 游戏胜利
- `game-lose` - 游戏失败

### 随机事件类型
- `luck` - 幸运事件
- `disaster` - 灾难事件
- `choice` - 选择事件
- `challenge` - 挑战事件
- `achievement` - 成就事件

### 效果类型
- `money` - 金钱变化
- `position` - 位置移动
- `property` - 财产变更
- `status` - 状态效果
- `special` - 特殊效果

## 配置选项

### 处理系统配置
```typescript
const processingOptions = {
  batchSize: 10,          // 批处理大小
  maxConcurrent: 3,       // 最大并发数
  timeoutMs: 5000,        // 超时时间
  retryAttempts: 2,       // 重试次数
  priorityWeights: {      // 优先级权重
    low: 1,
    normal: 2,
    high: 3,
    critical: 4
  }
};
```

### 随机事件配置
```typescript
const randomEventOptions = {
  baseChance: 0.15,         // 基础触发概率
  maxEventsPerCheck: 2,     // 每次检查最大事件数
  enableEventChains: true,  // 启用事件链
  historyInfluence: 0.1     // 历史影响权重
};
```

## 测试

系统包含完整的测试套件：

```bash
# 运行所有事件系统测试
npm test src/events/

# 运行特定测试
npm test src/events/EventSystemValidation.test.ts
npm test src/events/EventSystemBasicIntegration.test.ts
```

## 性能特性

- **批量处理**: 支持事件批量处理，提高性能
- **并发处理**: 支持并发事件处理
- **优先级队列**: 基于优先级的事件处理顺序
- **错误恢复**: 自动重试和错误恢复机制
- **内存管理**: 自动清理已处理事件
- **统计监控**: 完整的性能统计和监控

## 扩展性

系统设计为高度可扩展：

1. **自定义处理器**: 轻松添加新的事件处理器
2. **插件架构**: 支持插件式扩展
3. **配置驱动**: 通过配置文件驱动行为
4. **模板系统**: 基于模板的事件生成
5. **钩子系统**: 丰富的生命周期钩子

## 调试和监控

```typescript
// 启用调试日志
eventSystem.logSystemStats();

// 获取详细统计
const detailedStats = {
  processing: processingSystem.getSystemStats(),
  responses: responseSystem.getSystemStats(),
  randomEvents: randomEventSystem.getStats(),
  effects: effectSystem.getSystemStats(),
  ui: uiSystem.getStats()
};

console.log('详细系统状态:', detailedStats);
```

## 最佳实践

1. **事件命名**: 使用描述性的事件名称
2. **错误处理**: 总是处理可能的错误情况
3. **性能监控**: 定期检查系统性能统计
4. **内存管理**: 及时清理不需要的事件和数据
5. **测试覆盖**: 为所有自定义处理器编写测试
6. **文档更新**: 保持文档与代码同步

## 故障排除

### 常见问题

1. **事件未被处理**: 检查处理器是否正确注册，事件类型是否匹配
2. **性能问题**: 检查批处理大小和并发设置
3. **内存泄漏**: 确保正确调用destroy()方法清理资源
4. **随机事件不触发**: 检查概率设置和触发条件

### 调试技巧

```typescript
// 启用详细日志
processingSystem.on('eventProcessed', (data) => {
  console.log('事件已处理:', data);
});

processingSystem.on('processingError', (error) => {
  console.error('处理错误:', error);
});

// 监控队列状态
setInterval(() => {
  const stats = processingSystem.getSystemStats();
  if (stats.queueSize > 100) {
    console.warn('事件队列积压:', stats.queueSize);
  }
}, 5000);
```