## Eureka! AI价值创新系统 - Agent目录结构

```
eureka_value_inovation/.workbuddy/agents/
├── reveal_specialist/               # 洞察官 (Reveal阶段) ✅
│   ├── AGENT.md                     # Agent完整定义
│   ├── README.md                    # 快速开始指南
│   ├── agent_config.json             # Agent配置文件
│   └── WORKFLOW.md                 # 详细工作流程
│
├── inspire_specialist/              # 灵感官 (Inspire阶段) ⏳ 待创建
├── imagine_specialist/              # 想象官 (Imagine阶段) ⏳ 待创建
├── build_specialist/               # 构建官 (Build阶段) ⏳ 待创建
└── verify_specialist/              # 验证官 (Verify阶段) ⏳ 待创建
```

---

## Agent概述

### 1. Reveal Specialist (洞察官) ✅

**Agent ID**: reveal_specialist  
**阶段**: Build (阶段0) + Reveal (阶段1)  
**状态**: 已创建  
**使用的Skills**: 4个
  - build_project_brief
  - roleplay_stakeholder
  - find_insight
  - pov_builder

**核心职责**:
- 项目启动管理
- 用户探索引导
- 洞察挖掘与分析
- 需求整合与POV构建
- 跨阶段协作

**关键成果**:
- 项目简报
- FIND洞察和设计原则
- 用户POV和POV卡片
- 利益相关方分析和共识

**文档位置**:
- 定义: `/eureka_value_inovation/.workbuddy/agents/reveal_specialist/AGENT.md`
- 指南: `/eureka_value_inovation/.workbuddy/agents/reveal_specialist/README.md`
- 配置: `/eureka_value_inovation/.workbuddy/agents/reveal_specialist/agent_config.json`
- 流程: `/eureka_value_inovation/.workbuddy/agents/reveal_specialist/WORKFLOW.md`

---

## Agent创建进度

| Agent | 角色 | 阶段 | 状态 |
|--------|------|------|------|
| reveal_specialist | 洞察官 | Build + Reveal | ✅ 已创建 |
| inspire_specialist | 灵感官 | Inspire | ⏳ 待创建 |
| imagine_specialist | 想象官 | Imagine | ⏳ 待创建 |
| build_specialist | 构建官 | Build | ⏳ 待创建 |
| verify_specialist | 验证官 | Verify | ⏳ 待创建 |

---

## Agent协作关系

```
Reveal Specialist (洞察官)
    │
    ├──→ Inspire Specialist (灵感官)
    │       │
    │       └─→ Imagine Specialist (想象官)
    │               │
    │               └─→ Build Specialist (构建官)
    │                       │
    │                       └─→ Verify Specialist (验证官)
    │
    └─→ (持续支持后续阶段)
            ├── Inspire: 确保HMW机遇与用户洞察一致
            ├── Imagine: 验证创意是否满足用户需求
            └── Verify: 参与用户测试和数据分析
```

---

## Agent特征对比

| 特征 | Reveal Specialist | Inspire Specialist | Imagine Specialist | Build Specialist | Verify Specialist |
|------|-----------------|------------------|-------------------|------------------|------------------|
| 核心能力 | 洞察挖掘 | 机遇探索 | 创意生成 | 方案构建 | 验证测试 |
| 关键方法 | FIND模型, Buy Features | HMW, NCO | SCAMPER, 类比 | 原型设计 | 用户测试 |
| 输出重点 | 洞察、POV、需求 | HMW机遇、交叉激发 | 创意清单 | 概念方案 | 测试报告 |
| 数据来源 | 用户探索、访谈 | POV、设计原则 | HMW机遇 | 最佳创意 | 原型、用户反馈 |
| 交付物 | 6个文件 | 待定 | 待定 | 待定 | 待定 |

---

## Agent质量标准

### 通用质量标准

所有Agent必须遵循：

1. **专业性**: 在各自领域展现专业能力
2. **协作性**: 与其他Agent有效协作
3. **质量意识**: 遵循质量标准和验证流程
4. **用户中心**: 始终从用户视角出发
5. **创新驱动**: 追求新颖且有启发性的解决方案

### Reveal Specialist质量标准

- ✅ 事实客观、可观察、有来源
- ✅ 洞察有深度和启发性
- ✅ POV从用户视角出发
- ✅ Buy Features约束正确执行
- ✅ 利益相关方共识达成

---

## Agent使用指南

### 何时调用Reveal Specialist

调用此Agent当你需要：

1. **启动一个创新项目**
   - 构建项目简报
   - 识别利益相关方
   - 定义项目范围

2. **进行用户研究**
   - 设计用户探索计划
   - 收集和分析用户数据
   - 挖掘用户需求

3. **生成洞察**
   - 运用FIND模型挖掘洞察
   - 分析利益相关方需求
   - 构建用户POV

4. **整合需求**
   - 整合多源信息
   - 验证洞察质量
   - 为创新设计提供基础

### 调用方式

**方式1: 自动调用（推荐）**
由主调度器自动调用，在项目启动时触发。

**方式2: 手动调用**
```
"调用reveal_specialist Agent，处理以下项目需求：[需求描述]"
```

**方式3: 对话调用**
```
"我需要做用户研究和洞察挖掘，使用reveal_specialist"
```

---

## Agent性能指标

### Reveal Specialist性能指标

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| 洞察质量评分 | ≥ 4/5 | 人工评估 |
| 洞察验证通过率 | ≥ 80% | 自动验证 |
| POV质量评分 | ≥ 4/5 | 人工评估 |
| 用户满意度 | ≥ 80% | 用户反馈 |
| 项目成功率 | ≥ 70% | 项目跟踪 |

---

## 后续计划

### 短期计划（本周）
- ✅ 完成Reveal Specialist Agent创建
- ⏳ 开始Inspire Specialist Agent设计
- ⏳ 完成Reveal阶段Skills测试和优化

### 中期计划（本月）
- ⏳ 创建Inspire Specialist Agent
- ⏳ 创建Imagine Specialist Agent
- ⏳ 创建Build Specialist Agent
- ⏳ 创建Verify Specialist Agent
- ⏳ 完成Agent之间的协作接口设计

### 长期计划（下月）
- ⏳ 完善所有Agent的质量标准和验证流程
- ⏳ 创建Agent性能监控和优化机制
- ⏳ 建立Agent知识库和经验积累系统

---

## 技术规格

### Agent文件规范

每个Agent必须包含以下文件：

1. **AGENT.md** (必需)
   - Agent完整定义
   - 核心职责和能力
   - 决策原则和质量标准
   - 与其他Agent的协作

2. **README.md** (必需)
   - 快速开始指南
   - 何时调用此Agent
   - 核心能力和工作流程
   - 输出文件列表

3. **agent_config.json** (必需)
   - Agent配置信息
   - 使用的Skills列表
   - 输入输出规范
   - 协作关系

4. **WORKFLOW.md** (推荐)
   - 详细工作流程
   - 步骤说明和时间估算
   - 质量检查点
   - 错误处理流程

---

## 版本历史

### v1.0 (2026-03-22)
- ✅ 创建Reveal Specialist Agent
- ✅ 定义Agent核心职责和能力
- ✅ 完成所有必需文档（AGENT.md, README.md, agent_config.json, WORKFLOW.md）
- ✅ 定义Agent协作关系
- ✅ 建立Agent目录结构

---

## 联系和支持

**Agent作者**: Eureka! AI价值创新系统  
**创建日期**: 2026-03-22  
**最后更新**: 2026-03-22  
**文档版本**: v1.0

**相关文档**:
- 主调度器: `/eureka_value_inovation/eureka_orchestrator.py`
- Skills目录: `/eureka_value_inovation/.workbuddy/skills/`
- 项目文档: `/eureka_value_inovation/docs/`
