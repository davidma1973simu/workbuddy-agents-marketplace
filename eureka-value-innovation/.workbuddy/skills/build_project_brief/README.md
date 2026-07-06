# Build Project Brief Skill

这是Eureka! AI价值创新系统的第一个Skill，负责构建项目简报（Project Brief）。

## 目录结构

```
build_project_brief/
├── SKILL.md              # Skill定义文件（包含完整工作流程、输入输出规范）
├── references/           # 参考文档
│   └── pb_guide.md      # Project Brief撰写指南
├── examples/             # 示例输出
│   ├── example_1.json   # 示例1：工作回顾承诺机制
│   └── example_2.json   # 示例2：新零售用户体验
└── README.md            # 本文件
```

## 核心功能

将客户的需求描述转化为结构化的项目简报，包含：
- **背景案例**: 问题场景和挑战
- **核心设计挑战**: 清晰的行动导向陈述
- **共识目标**: SMART原则的目标定义
- **目标用户**: 用户画像、需求、旅程触点
- **时间窗口**: 项目周期和关键里程碑
- **利益相关方**: 各方角色和关注点

## 使用方式

### WorkBuddy对话调用（推荐）

```
用户: "用Eureka系统做一个价值创新项目：用户需要在工作回顾中做出更明确的承诺"
AI: 自动调用build_project_brief Skill，生成项目简报
```

### 直接调用Skill

```
"使用build_project_brief Skill处理以下需求：[需求描述]"
```

## 输入示例

```
用户需要在工作回顾中做出更明确的承诺，而不是只列出要做的事情。当前的问题是Alice每周回顾中只说打算做什么，但没有说必须做到什么。
```

## 输出示例

```json
{
  "skill": "build_project_brief",
  "stage": "build",
  "input_summary": "用户需在工作回顾中做出明确承诺",
  "output": {
    "project_id": "vi_20260322_001",
    "background": "在团队工作管理场景中...",
    "core_challenge": "如何为周度工作回顾设计一个承诺机制...",
    "consensus_goals": "1. 在工作回顾中明确可承诺的目标...",
    "target_user": {
      "persona": "Alice - 中层管理者...",
      "needs": "需要清晰的目标定义工具...",
      "journey_touchpoints": ["周度回顾准备", ...]
    },
    "timeframe": {
      "project_duration": "12周（3个月）",
      "key_milestones": ["Week 2: 需求确认...", ...]
    },
    "stakeholders": [...]
  },
  "timestamp": "2026-03-22T19:35:00"
}
```

## 与系统的集成

- **上游**: 无（这是第一个Skill，接收用户原始需求）
- **下游**:
  - `pov_builder`: 使用target_user和background构建用户POV
  - `roleplay_stakeholder`: 使用stakeholders进行利益相关方模拟

## 测试状态

✅ Skill定义完整
✅ 参考文档齐全
✅ 示例数据完善
⏳ 实际执行集成（待主调度器更新）

## 相关文档

- [SKILL.md](./SKILL.md) - 完整Skill定义和工作流程
- [pb_guide.md](./references/pb_guide.md) - Project Brief撰写指南
- [example_1.json](./examples/example_1.json) - 工作回顾承诺机制示例
- [example_2.json](./examples/example_2.json) - 新零售用户体验示例

## 技术规格

- **Skill ID**: build_project_brief
- **阶段**: Build (阶段0)
- **输出文件**: `00_build_project_brief.json`
- **数据格式**: JSON
- **错误处理**: 支持P1/P2分级处理
