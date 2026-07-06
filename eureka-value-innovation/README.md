# Eureka! © AI 价值创新系统

基于 R.I.S.E. 模型的 AI 驱动价值创新系统，支持 WorkBuddy 对话自然语言调用。

## 快速开始

### 方式 1: WorkBuddy 对话调用（推荐）

```
用户: "帮我用 Eureka 系统解决一个线下零售场景下，年轻消费者的排队等待焦虑问题，达到提升顾客满意度和门店转化率的目的"
AI: 自动执行完整工作流，返回最终看板
```

### 方式 2: 命令行调用

```bash
cd /Users/davidma/WorkBuddy/Claw/eureka_value_inovation
python3 scripts/eureka_orchestrator.py "用户需要在工作回顾中做出更明确的承诺"
```

## 项目结构

```
eureka_value_innovation/
├── .workbuddy/skills/           # 13 个 Skills
├── scripts/                      # 核心脚本
│   ├── eureka_orchestrator.py   # 主调度器（入口）
│   ├── init_db.py               # 数据库初始化
│   └── client_scanner.py       # 客户应用扫描脚本
├── data/
│   ├── database/eureka.db       # SQLite 持久化
│   └── outputs/{project_id}/    # 每个项目一个目录
├── docs/                        # 文档
│   ├── ARCHITECTURE.md
│   └── WORKFLOW.md
└── templates/                   # 输出模板
```

## R.I.S.E. 工作流

```
Build (0) → Reveal (1) → Inspire (2) → Shape (3) → Exam (4) → Final (5)
```

| 阶段 | Sub-Agent | Skills 数量 |
|------|-----------|-------------|
| Build | TheArchitect | 1 |
| Reveal | RevealSpecialist | 3 |
| Inspire | InspireSpecialist | 3 |
| Shape | ShapeSpecialist | 3 |
| Exam | ExamSpecialist | 4 |

**总计：13 个 Skills**

## 数据库

SQLite 数据库：`data/database/eureka.db`

### 表结构

- `projects`: 项目元数据
- `stage_executions`: 阶段执行记录
- `deliverables`: 交付物记录

### 查询示例

```bash
# 查询今日项目数
sqlite3 data/database/eureka.db "SELECT COUNT(*) FROM projects WHERE created_at >= date('now');"

# 查询某个项目的执行记录
sqlite3 data/database/eureka.db "SELECT * FROM stage_executions WHERE project_id = 'vi_20260322_001' ORDER BY stage;"

# 查询 Skill 成功率
sqlite3 data/database/eureka.db "SELECT skill_name, COUNT(*) as total, ROUND(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate FROM stage_executions GROUP BY skill_name;"
```

## 客户应用对接

### 方式：文件扫描

客户应用定期扫描 `data/outputs/` 目录：

```bash
# 运行扫描脚本（单次）
python3 scripts/client_scanner.py --once

# 运行扫描脚本（持续，每 60 秒扫描一次）
python3 scripts/client_scanner.py
```

扫描脚本会：
1. 检测新项目（`{project_id}/00_project_metadata.json`）
2. 读取项目状态和最终交付物
3. 输出通知信息

## 输出文件

每个项目包含以下文件：

```
{project_id}/
├── 00_project_metadata.json          # 项目元数据
├── 00_build_project_brief.json       # 项目简报
├── 01_pov_builder.json              # 用户 POV
├── 02_find_insight.json             # FIND 洞察
├── 03_roleplay_stakeholder.json     # 利益相关方
├── 04_hmw_reframer.json             # HMW 机遇
├── 05_nco_crosslinker.json         # 交叉激发
├── 06_idea_distiller.json          # 最佳创意
├── 07_solution_interrogator.json   # 压力测试
├── 08_solution_build.json          # 概念方案
├── 09_storyboard_scriptor.json    # 故事脚本
├── 10_aha_map_evaluator.json      # AHA MAP 评估
├── 11_pitch_composer.json         # 电梯演讲
├── 12_project_iteration.json       # 迭代计划
├── 13_business_model.json        # 商业模式
└── 99_final_dashboard.html        # 一页纸看板
```

## 当前状态

### ✅ 已完成

- [x] 目录结构
- [x] SQLite 数据库初始化
- [x] 主调度器 `eureka_orchestrator.py`
- [x] 客户应用扫描脚本 `client_scanner.py`
- [x] 端到端测试（模拟输出）
- [x] 文档（ARCHITECTURE.md, WORKFLOW.md）
- [x] **Skill 1: build_project_brief** ✨
- [x] **Skill 2: pov_builder** ✨

### ⏳ 待完成

- [ ] 13 个 Skills 的完整实现
  - [x] build_project_brief ✅
  - [x] pov_builder ✅
  - [ ] find_insight（已存在，可直接引用）
  - [ ] roleplay_stakeholder
  - [ ] hmw_reframer
  - [ ] nco_crosslinker
  - [ ] idea_distiller
  - [ ] solution_interrogator
  - [ ] solution_build
  - [ ] storyboard_scriptor
  - [ ] aha_map_evaluator
  - [ ] pitch_composer
  - [ ] project_iteration
  - [ ] business_model
- [ ] 最终看板 HTML 模板
- [ ] WorkBuddy 对话集成（Skill 调用）

## 下一步

1. 创建第一个 Skill：`build_project_brief`
2. 逐步完成剩余 12 个 Skills
3. 开发最终看板 HTML 模板
4. 集成 WorkBuddy 主 Agent

## 技术栈

- **语言**: Python 3
- **数据库**: SQLite
- **框架**: WorkBuddy Skills
- **输出**: JSON + HTML

## 许可证

© Eureka! Innovation System
