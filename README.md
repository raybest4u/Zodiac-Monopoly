# 十二生肖大富翁游戏

基于React + TypeScript开发的单机版大富翁游戏，融入中华传统十二生肖文化元素，支持AI对手和智能语音交互。

## 项目特性

- 🎮 **单机游戏**: 无需联网，本地运行的完整游戏体验
- 🐉 **十二生肖主题**: 融入传统文化，每个生肖都有独特技能和特性
- 🤖 **智能AI对手**: 4个难度等级的AI，具有不同性格和策略
- 📱 **响应式设计**: 完美适配PC端和移动端
- 🎙️ **语音控制**: 支持语音指令和交互
- 💾 **本地存储**: IndexedDB本地存档，支持多存档管理
- 🎨 **现代UI**: 基于现代设计理念的用户界面

## 技术栈

- **前端框架**: React 18+ + TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand + Immer (计划)
- **UI库**: 自定义组件 + Ant Design (计划)
- **测试框架**: Jest + React Testing Library
- **代码质量**: ESLint + Prettier + Husky
- **存储**: IndexedDB
- **AI集成**: OpenAI API (计划)

## 项目结构

\`\`\`
zodiac-monopoly/
├── src/
│   ├── engine/              # 游戏引擎
│   │   ├── GameEngine.ts
│   │   ├── GameState.ts
│   │   └── GameRules.ts
│   ├── ai/                  # AI系统
│   │   ├── AIManager.ts
│   │   ├── BasicAI.ts
│   │   └── AIPersonality.ts
│   ├── components/          # React组件
│   │   ├── game/
│   │   ├── ui/
│   │   └── layout/
│   ├── storage/             # 存储管理
│   │   ├── LocalStorage.ts
│   │   └── SaveManager.ts
│   ├── types/               # 类型定义
│   │   ├── game.ts
│   │   ├── ai.ts
│   │   └── storage.ts
│   ├── utils/               # 工具函数
│   ├── assets/              # 静态资源
│   └── tests/               # 测试文件
├── docs/                    # 项目文档
├── scripts/                 # 构建脚本
└── config/                  # 配置文件
\`\`\`

## 开发进度

### 第一阶段：单机游戏框架 ✅
- [x] 项目初始化和开发环境
- [x] 核心类型定义
- [x] 游戏引擎核心架构
- [x] 本地存储系统
- [ ] 基础游戏循环

### 第二阶段：游戏核心功能 (进行中)
- [ ] 完整游戏逻辑
- [ ] 基础AI对手
- [ ] 十二生肖技能系统
- [ ] 事件系统

### 第三阶段：AI智能化 (计划中)
- [ ] 高级AI对手
- [ ] 大语言模型集成
- [ ] 语音交互系统
- [ ] AI个性化学习

## 快速开始

### 安装依赖
\`\`\`bash
npm install
\`\`\`

### 开发模式
\`\`\`bash
npm run dev
\`\`\`

### 构建项目
\`\`\`bash
npm run build
\`\`\`

### 运行测试
\`\`\`bash
npm test
\`\`\`

### 代码检查
\`\`\`bash
npm run lint
npm run format
npm run typecheck
\`\`\`

## 开发规范

### 代码风格
- 使用TypeScript严格模式
- 遵循ESLint规则
- 使用Prettier格式化代码
- 函数和变量使用camelCase
- 类型和接口使用PascalCase
- 常量使用UPPER_SNAKE_CASE

### 提交规范
- 使用Husky进行提交前检查
- 提交信息使用中文描述
- 确保所有测试通过
- 保持代码覆盖率在80%以上

### 测试要求
- 所有核心功能必须有单元测试
- 关键业务逻辑必须有集成测试
- UI组件使用React Testing Library测试
- 保持测试覆盖率在85%以上

## 游戏规则

### 基本规则
- 4个玩家（1个人类玩家 + 3个AI对手）
- 每个玩家初始资金10,000元
- 掷骰子移动，根据格子执行相应操作
- 购买房产，收取租金
- 使用生肖技能获得优势
- 最后剩余的玩家获胜

### 十二生肖特色
- 每个生肖都有独特的主动技能和被动技能
- 生肖之间存在相克和相助关系
- 季节变化影响不同生肖的能力
- 特殊事件与生肖文化相关

## 许可证

ISC

## 贡献指南

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0 (开发中)
- 基础项目架构
- 类型定义系统
- 开发环境配置