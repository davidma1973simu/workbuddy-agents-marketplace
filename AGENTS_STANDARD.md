# Agents（智能体）标准

## 目录结构

**位置**：`~/.workbuddy/agents-marketplace/`

```
agents-marketplace/
├── agents/
│   ├── agent-id/
│   │   ├── AGENT.md              # 必需：Agent定义文件
│   │   ├── README.md             # 必需：用户文档
│   │   ├── package.json          # 必需：Agent包配置
│   │   ├── agent_config.json     # 可选：Agent配置
│   │   └── examples/            # 可选：示例文件
│   └── another-agent/
│       └── AGENT.md
├── AGENTS_STANDARD.md             # 本文件：Agents标准
└── README.md                    # 可选：总体说明
```

## AGENT.md 格式

### Frontmatter 配置（必需）

```markdown
---
agent-id: reveal_specialist
name: Reveal Specialist Agent - 洞察官
version: 1.0.0
author: 习智场景化创新训练
license: MIT
category: Design & Innovation
stage: Reveal (阶段0-1)
capabilities: 用户研究, 洞察挖掘, POV构建
---

Agent的完整定义内容
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| agent-id | string | 是 | Agent唯一标识符（小写，下划线分隔） |
| name | string | 是 | Agent显示名称 |
| version | string | 是 | 版本号（语义化版本） |
| author | string | 是 | 开发者名称 |
| license | string | 是 | 许可证类型（如：MIT, Apache-2.0） |
| category | string | 否 | 分类（如：Design & Innovation, Data Analysis） |
| stage | string | 否 | 适用阶段（如：Reveal, Inspire, Imagine, Build, Verify） |
| capabilities | string | 否 | 能力描述（逗号分隔） |

## package.json 格式

### 必需字段

```json
{
  "name": "reveal-specialist-agent",
  "version": "1.0.0",
  "description": "Agent描述",
  "author": "开发者名称",
  "license": "MIT",
  "agent": {
    "id": "reveal_specialist",
    "name": "Agent名称",
    "version": "1.0.0"
  }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| name | string | 是 | 包名称（小写，连字符分隔） |
| version | string | 是 | 版本号 |
| description | string | 是 | 包描述 |
| author | string | 是 | 开发者名称 |
| license | string | 是 | 许可证 |
| agent.id | string | 是 | Agent ID |
| agent.name | string | 是 | Agent名称 |
| agent.version | string | 是 | 版本号 |

## README.md 格式

### 必需内容

1. **Agent简介** - 一句话介绍
2. **快速开始** - 如何调用和使用
3. **核心功能** - 主要能力列表
4. **输出内容** - 生成的文件列表
5. **质量保证** - 测试通过率和状态
6. **更多信息** - 文档链接

### 可选内容

- 使用示例
- 应用场景
- 技术规格
- 维护者信息

## 特性

- Agent可以包含Skills、脚本、模板等资源
- Agent的baseDirectory指向Agent目录
- Agent可以定义和使用自定义工具
- Agent支持版本管理和更新

## 示例

### AGENT.md

```markdown
---
agent-id: reveal_specialist
name: Reveal Specialist Agent - 洞察官
version: 1.0.0
author: 习智场景化创新训练
license: MIT
category: Design & Innovation
stage: Reveal (阶段0-1)
capabilities: 用户研究, 洞察挖掘, POV构建
---

# Reveal Specialist Agent - 洞察官

## 使命

帮助创新项目启动，进行用户研究，挖掘深度洞察，构建用户POV。

## 核心职责

1. 项目启动管理
2. 用户探索引导
3. 洞察挖掘与分析
4. 需求整合与POV构建
5. 跨阶段协作

## 工作流程

...
```

### package.json

```json
{
  "name": "reveal-specialist-agent",
  "version": "1.0.0",
  "description": "专业的洞察挖掘专家，帮助启动创新项目、进行用户研究、生成深度洞察",
  "author": "习智场景化创新训练",
  "license": "MIT",
  "keywords": ["innovation", "user-research", "insight-mining"],
  "agent": {
    "id": "reveal_specialist",
    "name": "Reveal Specialist Agent - 洞察官",
    "role": "洞察官",
    "stage": "Reveal (阶段0-1)",
    "version": "1.0.0"
  }
}
```

## 发布流程

1. 创建Agent目录结构
2. 编写AGENT.md定义文件
3. 创建package.json配置
4. 编写README.md文档
5. 添加示例文件（可选）
6. 测试Agent功能
7. 发布到agents-marketplace

## 质量标准

- ✅ AGENT.md格式正确，包含所有必需字段
- ✅ package.json格式正确，包含所有必需字段
- ✅ README.md清晰易懂，包含快速开始指南
- ✅ Agent功能完整，测试通过率 >= 90%
- ✅ 文档齐全，用户能够快速上手

## 版本管理

使用语义化版本号（Semantic Versioning）：

- **MAJOR.MINOR.PATCH** (如：1.0.0)
- **MAJOR**: 不兼容的API更改
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修复

示例：
- v1.0.0 - 初始发布
- v1.0.1 - Bug修复
- v1.1.0 - 新增功能
- v2.0.0 - 重大更新

## 许可证

推荐使用开源许可证：

- **MIT License** - 最宽松，推荐
- **Apache-2.0** - 包含专利授权
- **GPL-3.0** - 要求衍生作品开源

## 维护

- 定期更新版本
- 修复bug和问题
- 添加新功能
- 优化用户体验
- 收集用户反馈

---

**开发者**: 习智场景化创新训练  
**版本**: v1.0.0  
**更新日期**: 2026-03-22
