# Eureka! 工作流说明

## 完整工作流

```
Build (0) → Reveal (1) → Inspire (2) → Shape (3) → Exam (4) → Final (5)
```

## 阶段详解

### 阶段 0: Build - 项目启动

**Sub-Agent**: TheArchitect (主控)

**Skills**:
- `build_project_brief`: 构建项目简报 (PB)

**输入**: 用户需求描述（自然语言）

**输出**:
```json
{
  "project_id": "vi_20260322_001",
  "background": "背景案例",
  "core_challenge": "核心设计挑战",
  "consensus_goals": "共识目标",
  "target_user": "目标用户",
  "timeframe": "时间窗口",
  "stakeholders": "利益相关方"
}
```

---

### 阶段 1: Reveal - 用户洞察

**Sub-Agent**: RevealSpecialist

**Skills**:
1. `pov_builder`: 构建用户 POV
2. `find_insight`: FIND 模型洞察（已存在）
3. `roleplay_stakeholder`: 利益相关方模拟

**输入**: Project Brief

**输出**:
- User POV: 用户画像、旅程触点、痛点、POV 陈述
- FIND Insight: 行为解读、需求推断、洞察陈述 + 卡片
- Stakeholder Analysis: 利益相关方需求和影响力

---

### 阶段 2: Inspire - 灵感生成

**Sub-Agent**: InspireSpecialist

**Skills**:
1. `hmw_reframer`: HMW 问题重构（6-8 个机遇）
2. `nco_crosslinker`: NCO 交叉激发（新·酷·界外）
3. `idea_distiller`: 创意筛选与发展

**输入**: User POV

**输出**:
- HMW Opportunities: 6-8 个 HMW 陈述 + 最佳机遇
- Crosslinked Ideas: 交叉激发的创意列表
- Best Idea: 最佳创意 + AHA 价值假设

---

### 阶段 3: Shape - 方案构建

**Sub-Agent**: ShapeSpecialist

**Skills**:
1. `solution_interrogator`: 四维度压力测试
2. `solution_build`: 构建概念方案
3. `storyboard_scriptor`: 6 幕体验故事脚本

**输入**: Best Idea

**输出**:
- Pressure Test Results: 可行性/用户价值/商业潜力/风险四维度评估
- Solution Concept: 概念方案（功能特性 + AHA 价值设计）
- User Story Script: 6 幕用户视角体验脚本

---

### 阶段 4: Exam - 方案评估

**Sub-Agent**: ExamSpecialist

**Skills**:
1. `aha_map_evaluator`: AHA MAP 评估
2. `pitch_composer`: 60 秒电梯演讲脚本
3. `project_iteration`: 30-60-90 天迭代计划
4. `business_model`: 商业模式画布 9 要素

**输入**: Solution Concept

**输出**:
- AHA MAP Scores: 顿悟/高光/进步/商业潜力评分
- Pitch Script: 60 秒电梯演讲
- Iteration Plan: 30-60-90 天迭代计划
- Business Model Canvas: 9 要素假设

---

### 阶段 5: Final - 最终交付

**输出**: Final Dashboard（一页纸看板）

包含:
- 全流程产出摘要
- 电梯演讲
- 商业模式假设
- 30-60-90 天迭代计划

## 数据流转

```
用户需求
  ↓
Build: Project Brief (01_build_project_brief.json)
  ↓
Reveal: User POV (02_reveal_user_pov.json)
        FIND Insight (03_reveal_insight.json)
        Stakeholder (04_reveal_stakeholder.json)
  ↓
Inspire: HMW (05_inspire_hmw.json)
         Ideas (06_inspire_ideas.json)
  ↓
Shape: Pressure Test (07_shape_interrogator.json)
       Solution (08_shape_solution.json)
       Storyboard (09_shape_storyboard.json)
  ↓
Exam: AHA MAP (10_exam_aha_map.json)
       Pitch (11_exam_pitch.json)
       Iteration (12_exam_iteration.json)
       Business Model (13_exam_business_model.json)
  ↓
Final: Dashboard (99_final_dashboard.html)
```

## 项目元数据

每个项目有 `00_project_metadata.json`:

```json
{
  "project_id": "vi_20260322_001",
  "created_at": "2026-03-22T17:00:00",
  "status": "completed",  // running / completed / failed
  "customer_requirement": "...",
  "current_stage": "final",
  "stages": {
    "build": {"status": "completed", "skills": 1},
    "reveal": {"status": "completed", "skills": 3},
    "inspire": {"status": "completed", "skills": 3},
    "shape": {"status": "completed", "skills": 3},
    "exam": {"status": "completed", "skills": 4}
  },
  "final_deliverable": "99_final_dashboard.html"
}
```
