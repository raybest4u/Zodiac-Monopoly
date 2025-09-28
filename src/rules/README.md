# 十二生肖大富翁 - 游戏规则系统

本项目实现了一个完整的游戏规则验证和执行系统，为十二生肖大富翁游戏提供可靠的规则引擎支持。

## 系统架构

### 核心组件

1. **GameRuleSystem** - 核心规则系统
   - 规则注册和管理
   - 行动验证和执行
   - 优先级处理和冲突解决
   - 性能优化和缓存

2. **GameStateValidator** - 游戏状态验证器
   - 深度状态检查
   - 数据一致性验证
   - 自动修复功能
   - 性能监控

3. **ActionRuleChecker** - 行动规则检查器
   - 实时权限检查
   - 行动验证
   - 执行计划生成
   - 条件评估

4. **RuleExecutionEngine** - 规则执行引擎
   - 协调所有规则系统
   - 批量执行支持
   - 错误处理和回滚
   - 性能分析

5. **BaseGameRules** - 基础游戏规则
   - 骰子规则
   - 移动规则
   - 财产规则
   - 技能规则
   - 胜利条件

6. **RuleEventIntegration** - 规则事件集成
   - 规则与事件系统双向集成
   - 事件驱动规则执行
   - 规则触发事件生成

## 功能特性

### 规则验证
- **多层验证**: 预验证、执行验证、后验证
- **缓存机制**: 智能缓存提高性能
- **条件检查**: 复杂条件和依赖关系处理
- **错误恢复**: 自动重试和故障恢复

### 状态管理
- **一致性检查**: 确保游戏状态完整性
- **自动修复**: 检测并修复常见问题
- **历史追踪**: 完整的状态变更历史
- **性能监控**: 实时性能指标

### 权限控制
- **细粒度权限**: 基于游戏状态的动态权限
- **时间窗口**: 时间相关的行动限制
- **条件评估**: 复杂条件的实时评估
- **快速检查**: 高性能的快速验证

## 使用方式

### 基础使用

```typescript
import { RuleExecutionEngine } from './rules/RuleExecutionEngine';
import type { PlayerAction, GameState } from './types/game';

// 创建规则执行引擎
const ruleEngine = new RuleExecutionEngine({
  strictValidation: true,
  enableAutoCorrection: true,
  performanceOptimization: true
});

// 执行玩家行动
const action: PlayerAction = {
  type: 'roll_dice',
  playerId: 'player1',
  data: {},
  timestamp: Date.now()
};

const result = await ruleEngine.executeAction(action, gameState);
if (result.success) {
  console.log('行动执行成功:', result.message);
} else {
  console.log('行动执行失败:', result.message);
}
```

### 验证游戏状态

```typescript
import { GameStateValidator } from './rules/GameStateValidator';

const validator = new GameStateValidator();

// 验证当前游戏状态
const validation = await validator.validateGameState(gameState, {
  enableAutoFix: true,
  deepValidation: true,
  consistencyCheck: true
});

if (!validation.isValid) {
  console.log('状态验证失败:', validation.errors);
  
  if (validation.autoFixApplied) {
    console.log('已自动修复:', validation.fixedErrors);
  }
}
```

### 检查可用行动

```typescript
import { ActionRuleChecker } from './rules/ActionRuleChecker';

const actionChecker = new ActionRuleChecker();

// 获取玩家可执行的行动
const permissions = await actionChecker.getAvailableActions(gameState, playerId);

const allowedActions = permissions.filter(p => p.allowed);
console.log('可用行动:', allowedActions.map(a => a.actionType));

// 快速验证特定行动
const isValid = actionChecker.quickValidateAction(action, gameState);
```

### 自定义规则

```typescript
import { GameRuleSystem } from './rules/GameRuleSystem';
import type { RuleDefinition } from './rules/GameRuleSystem';

const ruleSystem = new GameRuleSystem();

// 注册自定义规则
const customRule: RuleDefinition = {
  id: 'custom-skill-rule',
  name: '自定义技能规则',
  description: '玩家在特定条件下可以使用特殊技能',
  category: 'skills',
  priority: 80,
  conditions: [],
  requirements: [],
  applicablePhases: ['process_cell'],
  applicableActions: ['use_skill'],
  
  validator: (context) => {
    // 验证逻辑
    const { currentPlayer, gameState } = context;
    
    if (currentPlayer.money < 1000) {
      return {
        isValid: false,
        reason: '需要至少1000金钱才能使用此技能'
      };
    }
    
    return { isValid: true };
  },
  
  executor: (context) => {
    // 执行逻辑
    const { currentPlayer } = context;
    
    return {
      success: true,
      message: '技能使用成功',
      effects: [{
        type: 'money',
        target: 'self',
        value: -1000,
        description: '使用技能消耗金钱'
      }],
      validationsPassed: ['custom-skill-rule'],
      validationsFailed: [],
      stateChanges: [{
        path: `players.${currentPlayer.id}.money`,
        oldValue: currentPlayer.money,
        newValue: currentPlayer.money - 1000,
        reason: '技能消耗',
        reversible: false
      }],
      triggeredEvents: ['skill_used']
    };
  }
};

ruleSystem.registerRule(customRule);
```

### 事件集成

```typescript
import { RuleEventIntegration } from './rules/RuleEventIntegration';

const integration = new RuleEventIntegration(ruleEngine);

// 初始化集成
await integration.initialize();

// 执行规则并触发相关事件
const result = await integration.executeRuleWithEvents(action, gameState);

// 注册自定义绑定
integration.registerBinding({
  id: 'property-purchase-celebration',
  ruleId: 'property_purchase',
  eventType: 'celebration-event',
  direction: 'rule_to_event',
  priority: 50,
  enabled: true
});
```

## 规则类型

### 核心游戏规则

1. **骰子规则**
   - 基础掷骰子验证
   - 双倍骰子处理
   - 连续双倍限制

2. **移动规则**
   - 棋盘移动逻辑
   - 起点奖励处理
   - 位置验证

3. **财产规则**
   - 财产购买验证
   - 租金支付逻辑
   - 财产升级规则

4. **技能规则**
   - 冷却时间管理
   - 季节加成计算
   - 技能条件检查

5. **胜利规则**
   - 破产胜利检测
   - 垄断胜利条件
   - 游戏结束处理

### 特殊规则

1. **监狱规则**
   - 入狱条件检查
   - 保释金支付
   - 自由获取机制

2. **季节规则**
   - 季节变化影响
   - 生肖季节加成
   - 环境效果

3. **事件规则**
   - 随机事件触发
   - 事件选择处理
   - 事件链执行

## 配置选项

### 执行引擎配置

```typescript
const executionPolicy = {
  strictValidation: true,          // 严格验证模式
  allowPartialExecution: false,    // 允许部分执行
  enableAutoCorrection: true,      // 启用自动修正
  performanceOptimization: true,   // 性能优化
  cacheResults: true,              // 结果缓存
  rollbackOnFailure: true,         // 失败回滚
  maxExecutionTime: 10000,         // 最大执行时间(ms)
  retryPolicy: {
    enabled: true,
    maxRetries: 3,
    backoffStrategy: 'exponential',
    baseDelay: 100,
    maxDelay: 2000
  }
};
```

### 验证器配置

```typescript
const validationOptions = {
  enableAutoFix: true,       // 启用自动修复
  deepValidation: true,      // 深度验证
  performanceCheck: true,    // 性能检查
  consistencyCheck: true,    // 一致性检查
  economyBalance: true,      // 经济平衡检查
  skillIntegrity: true,      // 技能完整性检查
  boardIntegrity: true       // 棋盘完整性检查
};
```

## 测试

系统包含完整的测试套件：

```bash
# 运行基础规则测试
npm test src/rules/RuleSystemBasic.test.ts

# 运行所有规则测试
npm test src/rules/

# 运行性能测试
npm test src/rules/ -- --testNamePattern="性能测试"
```

## 性能特性

- **智能缓存**: 验证结果和权限检查缓存
- **批量处理**: 支持批量行动执行
- **异步执行**: 非阻塞的规则处理
- **内存管理**: 自动清理过期数据
- **性能监控**: 实时性能指标收集

## 扩展性

### 添加新规则

1. 实现 `RuleDefinition` 接口
2. 注册到规则系统
3. 编写相应测试
4. 更新文档

### 自定义验证器

1. 继承 `GameStateValidator`
2. 重写验证方法
3. 配置验证选项
4. 集成到执行引擎

### 事件集成

1. 定义规则事件绑定
2. 实现数据转换
3. 注册到集成系统
4. 测试双向集成

## 调试和监控

```typescript
// 获取规则统计
const ruleStats = ruleSystem.getRuleStatistics();
console.log('规则统计:', ruleStats);

// 获取执行统计
const execStats = ruleEngine.getExecutionStatistics();
console.log('执行统计:', execStats);

// 获取验证统计
const validStats = validator.getValidationStatistics();
console.log('验证统计:', validStats);

// 监听规则执行事件
ruleEngine.on('executionCompleted', (result) => {
  console.log('规则执行完成:', result.executionId);
});

ruleEngine.on('executionFailed', (data) => {
  console.error('规则执行失败:', data.error);
});
```

## 最佳实践

1. **规则设计**
   - 保持规则单一职责
   - 使用描述性的规则名称
   - 合理设置优先级

2. **性能优化**
   - 利用缓存机制
   - 避免不必要的深度验证
   - 使用快速验证

3. **错误处理**
   - 提供清晰的错误信息
   - 实现适当的重试逻辑
   - 考虑回滚策略

4. **测试覆盖**
   - 为每个规则编写测试
   - 覆盖边界条件
   - 测试性能要求

5. **监控和调试**
   - 定期检查系统统计
   - 监控执行时间
   - 跟踪错误模式

## 故障排除

### 常见问题

1. **规则验证失败**
   - 检查规则条件是否满足
   - 验证游戏状态是否有效
   - 确认玩家权限

2. **性能问题**
   - 启用缓存机制
   - 优化规则复杂度
   - 检查验证深度设置

3. **状态不一致**
   - 运行状态验证器
   - 启用自动修复
   - 检查状态变更逻辑

4. **事件集成问题**
   - 验证绑定配置
   - 检查事件类型匹配
   - 确认集成系统已初始化

---

**总结：游戏规则系统为十二生肖大富翁提供了强大的规则验证和执行能力，确保游戏逻辑的正确性和一致性。** 🎯✨