# Inspire Specialist - 启发师

> 机遇重构者与灵感导师，将用户洞察转化为创新机遇和创意想法

## 快速开始

```bash
# 在 WorkBuddy 中调用
使用 Inspire Specialist 启发：
用户POV："用户在选择产品时感到困惑和焦虑"
用户画像："28岁城市白领，时间紧张，注重品质"
场景描述："在电商平台浏览时面对海量选择"
```

## 核心功能

1. **生成 HMW 创新机遇**：将用户POV多维度重构为6-8个HMW机遇
2. **生成创意想法**：使用NCO灵感源与HMW机遇交叉激发，生成20-30个创意
3. **筛选最佳创意**：从用户价值和商业可行维度筛选出最佳创意

## 文档结构

```
inspire_specialist/
├── AGENT.md                # Agent 完整定义
├── README.md               # 本文件
├── agent_config.json       # Agent 配置文件
├── WORKFLOW.md             # 工作流程
├── HMW_Reframer/           # Skill 1: HMW机遇重构器
│   └── SKILL.md            # Skill 完整定义
├── NCO_Crosslinker/        # Skill 2: 新酷界外交叉激发器
│   └── SKILL.md            # Skill 完整定义
└── Idea_Distiller/         # Skill 3: 创意提炼器
    └── SKILL.md            # Skill 完整定义
```

## Skills

### 1. HMW_Reframer（HMW机遇重构器）

将用户POV多维度重构为6-8个HMW创新机遇，筛选出最佳HMW机遇。

**重构维度**：
- 发挥积极（Positive）
- 去除消极（Negative Removal）
- 改变假设（Assumption Change）
- 脑洞大开（Wild Ideas）

**输出**：
- 6-8个HMW机遇
- 1-2个最佳HMW机遇

### 2. NCO_Crosslinker（新酷界外交叉激发器）

生成NCO灵感源并与最佳HMW机遇交叉激发，生成20-30个创意想法。

**NCO灵感源**：
- **New（新）**：新兴技术和趋势
- **Cool（酷）**：创新模式和体验
- **Out of the Box（界外）**：跨领域灵感

**交叉激发方法**：
- 技术移植
- 模式借鉴
- 概念融合
- 逆向思维

**输出**：
- 20-30个创意想法

### 3. Idea_Distiller（创意提炼器）

从用户价值和商业可行维度筛选出最佳创意，生成AHA价值假设。

**评估维度**：
- 用户价值：相关性、新颖性、易用性、情感价值、传播性
- 商业可行：技术可行性、成本可控性、市场规模、竞争差异化、增长潜力

**输出**：
- 3-5个最佳创意
- AHA价值假设

## 工作流程

```
用户POV
  ↓
步骤1：生成HMW机遇 (HMW_Reframer)
  ↓
6-8个HMW机遇
  ↓
步骤2：筛选最佳HMW (Idea_Distiller)
  ↓
1-2个最佳HMW机遇
  ↓
步骤3：生成创意想法 (NCO_Crosslinker)
  ↓
20-30个创意想法
  ↓
步骤4：筛选最佳创意 (Idea_Distiller)
  ↓
3-5个最佳创意 + AHA假设
```

## 质量标准

| 指标 | 目标 |
|------|------|
| HMW机遇数量 | 6-8个 |
| 最佳HMW机遇数量 | 1-2个 |
| 创意想法数量 | 20-30个 |
| 最佳创意数量 | 3-5个 |
| 用户价值评分 | > 4.0/5 |
| 商业可行评分 | > 3.5/5 |
| 综合评分 | > 4.0/5 |

## 协作

**上游 Agent**：
- Reveal Specialist（洞察官）：提供用户POV和用户洞察

**下游 Agent**：
- Shape Specialist（架构师）：接收最佳创意，进行原型设计

## 开发者信息

- **开发者**: 习智场景化创新训练
- **版本**: v1.0.0
- **许可证**: MIT License
- **所属阶段**: Inspire (阶段2) - 启发阶段

## 更多信息

- 查看 [AGENT.md](AGENT.md) 了解完整的 Agent 定义
- 查看 [WORKFLOW.md](WORKFLOW.md) 了解详细的工作流程
- 查看 [agent_config.json](agent_config.json) 了解 Agent 配置
