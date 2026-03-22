# Reveal Specialist Agent - 测试计划

## 测试目标

全面验证Reveal Specialist Agent的能力、工作流程、输出质量和错误处理机制，确保Agent能够有效执行项目启动、用户探索、洞察挖掘和POV构建的任务。

---

## 测试范围

### 1. 文档完整性测试
**测试目标**: 验证Agent文档是否完整、准确、一致

**测试项目**:
- ✅ AGENT.md包含所有必需章节
- ✅ README.md提供清晰的快速开始指南
- ✅ agent_config.json格式正确且完整
- ✅ WORKFLOW.md提供详细的工作流程
- ✅ 文档之间没有矛盾或不一致

**测试方法**: 人工审查

**通过标准**: 所有文档完整，无重大遗漏

---

### 2. 配置文件测试
**测试目标**: 验证agent_config.json的格式和内容

**测试项目**:
- [ ] JSON格式有效
- [ ] agent_id、agent_name、version字段存在
- [ ] stage字段包含["build", "reveal"]
- [ ] skills数组包含4个skills
- [ ] capabilities数组覆盖所有核心能力
- [ ] workflow包含build和reveal两个阶段
- [ ] quality_standards定义完整
- [ ] error_handling定义P1和P2错误
- [ ] collaboration定义上下游关系

**测试方法**: JSON Schema验证 + 人工审查

**通过标准**: 所有必需字段存在且格式正确

---

### 3. Skill调用测试
**测试目标**: 验证Agent能够正确调用所有Skills

**测试项目**:

#### 3.1 build_project_brief
- [ ] 能够接收客户需求
- [ ] 能够生成项目简报
- [ ] 输出文件00_build_project_brief.json存在
- [ ] 输出包含所有必需字段（background, core_challenge, consensus_goals, target_user, timeframe, stakeholders）
- [ ] project_id生成正确

#### 3.2 roleplay_stakeholder
- [ ] 能够接收stakeholders列表
- [ ] 能够使用Buy Features方法
- [ ] 每个stakeholder的buy_features总分=12分
- [ ] 影响力评估在1-3分范围内
- [ ] 输出文件03_roleplay_stakeholder.json存在
- [ ] 需求优先列表格式正确

#### 3.3 find_insight
- [ ] 能够接收用户探索数据
- [ ] 能够执行FIND模型（Facts→Interpret→Need→Insight）
- [ ] facts数量≥10个
- [ ] 每个fact有明确来源
- [ ] interpretations基于facts
- [ ] needs覆盖四个层次（显性、隐性、情感、深层）
- [ ] design_insight有充分事实支撑
- [ ] 输出文件02_find_insight.json存在

#### 3.4 pov_builder
- [ ] 能够整合来自多个Skills的输出
- [ ] POV陈述从用户视角出发
- [ ] POV卡片格式符合规范
- [ ] 成功标准量化且可测量
- [ ] 输出文件01_pov_builder.json存在
- [ ] 输出pov_card.html可正常显示

**测试方法**: 使用"鞋服零售门店"项目数据进行实际执行

**通过标准**: 所有Skills成功执行，输出文件格式正确

---

### 4. 工作流程测试
**测试目标**: 验证完整的工作流程能够按预期执行

**测试项目**:

#### 4.1 Build阶段流程
- [ ] Step 1-5按顺序执行
- [ ] Build阶段完成后进入Reveal阶段
- [ ] 各步骤输出正确传递到下一步

#### 4.2 Reveal阶段流程
- [ ] Step 6-13按顺序执行
- [ ] Step 8的并行执行正确（roleplay_stakeholder + find_insight）
- [ ] 洞察质量验证在POV构建之前执行
- [ ] 可视化输出在最后生成

#### 4.3 数据流转测试
- [ ] build_project_brief的output传递给roleplay_stakeholder
- [ ] build_project_brief的output传递给find_insight
- [ ] build_project_brief、roleplay_stakeholder、find_insight的output传递给pov_builder
- [ ] 所有输出使用同一project_id

**测试方法**: 跟踪执行流程，验证数据流转

**通过标准**: 流程顺序正确，数据流转无误

---

### 5. 输出质量测试
**测试目标**: 验证所有输出的质量符合标准

**测试项目**:

#### 5.1 项目简报质量
- [ ] background案例清晰，问题场景具体
- [ ] core_challenge是行动导向的清晰陈述
- [ ] consensus_goals符合SMART原则
- [ ] target_user有足够的细节和特征
- [ ] timeframe合理，里程碑可执行
- [ ] stakeholders列表全面

#### 5.2 FIND洞察质量
- [ ] facts客观、可观察、有来源
- [ ] interpretations基于facts，逻辑清晰
- [ ] needs覆盖四个层次
- [ ] design_insight简洁有力（≤100字）
- [ ] design_insight有启发性
- [ ] design_principles具体可执行

#### 5.3 POV质量
- [ ] pov_statement从用户视角出发
- [ ] pov_card的insight有深度
- [ ] 场景具体，痛点真实
- [ ] 目标明确，可测量
- [ ] pov_card格式正确
- [ ] success_criteria量化

#### 5.4 利益相关方分析质量
- [ ] Buy Features约束正确（总分12分）
- [ ] 影响力评估准确（1-3分）
- [ ] 需求优先级清晰
- [ ] 风险识别全面

**测试方法**: 使用质量标准对照表逐一检查

**通过标准**: 所有输出符合质量标准

---

### 6. 错误处理测试
**测试目标**: 验证Agent能够正确处理各种错误场景

**测试项目**:

#### 6.1 P1错误处理（阻塞性）
- [ ] 用户探索数据不足（observations < 5）→ 停止执行，请求补充数据
- [ ] 事实质量低（>50%主观判断）→ 停止执行，建议重新提取
- [ ] 利益相关方识别不完整 → 停止执行，补充识别

**测试方法**: 故意提供不足的数据，观察Agent反应

**通过标准**: Agent正确识别P1错误并停止执行

#### 6.2 P2错误处理（严重性）
- [ ] 洞察缺乏依据 → 标记为"需要验证"
- [ ] 利益方需求冲突 → 识别冲突，组织讨论
- [ ] POV与洞察不一致 → 重新构建POV

**测试方法**: 故意提供有问题的数据，观察Agent反应

**通过标准**: Agent正确识别P2错误，标记但不停止

#### 6.3 错误信息质量
- [ ] 错误信息清晰易懂
- [ ] 错误原因明确
- [ ] 解决建议具体可行

**测试方法**: 检查错误信息的文本质量

**通过标准**: 错误信息清晰，有明确建议

---

### 7. 性能测试
**测试目标**: 验证Agent的执行效率

**测试项目**:
- [ ] Build阶段执行时间 < 3天（模拟）
- [ ] Reveal阶段执行时间 < 4周（模拟）
- [ ] Skill调用响应时间 < 30秒
- [ ] 输出文件生成时间 < 5秒

**测试方法**: 计时执行，记录时间数据

**通过标准**: 所有执行时间在预期范围内

---

### 8. 协作能力测试
**测试目标**: 验证Agent能够与其他Agent有效协作

**测试项目**:
- [ ] 能够向Inspire Specialist传递正确的数据格式
- [ ] 传递内容包含POV、FIND洞察、设计原则
- [ ] 数据格式符合下游Agent的输入要求

**测试方法**: 检查传递给下一阶段的数据格式

**通过标准**: 传递数据格式正确，内容完整

---

### 9. GUI界面测试
**测试目标**: 验证GUI界面的可用性和功能

**测试项目**:

#### 9.1 POV GUI
- [ ] 界面加载正常
- [ ] 四个信息分区清晰
- [ ] 标签系统功能正常（按回车添加，点击×删除）
- [ ] POV生成按钮工作正常
- [ ] POV卡片格式正确
- [ ] JSON输出下载功能正常

#### 9.2 Stakeholder GUI
- [ ] 界面加载正常
- [ ] 多个利益相关方卡片显示正常
- [ ] Buy Features实时验证工作正常（总分12分）
- [ ] 影响力单选评估工作正常
- [ ] 需求优先列表生成正确
- [ ] 颜色编码清晰（灰色/橙色/红色）

**测试方法**: 手动测试GUI的所有功能

**通过标准**: 所有GUI功能正常，用户体验流畅

---

### 10. 数据一致性测试
**测试目标**: 验证所有输出之间的数据一致性

**测试项目**:
- [ ] 所有输出文件使用同一project_id
- [ ] POV中的user_persona与Project Brief中的target_user一致
- [ ] POV中的scenario与Project Brief中的background一致
- [ ] POV中的insight与find_insight中的design_insight一致
- [ ] Stakeholder中的stakeholders与Project Brief中的stakeholders一致

**测试方法**: 对比所有输出文件的数据

**通过标准**: 所有数据一致，无矛盾

---

## 测试环境

### 测试项目
- **项目名称**: 鞋服零售门店的用户选择困难症
- **project_id**: vi_20260322_002
- **用户探索数据**: 基于模拟数据（10个facts, 5个interpretations）

### 测试文件位置
```
/Users/davidma/WorkBuddy/Claw/eureka_value_inovation/.workbuddy/output/
├── 00_build_project_brief.json
├── 02_find_insight.json
├── 01_pov_builder.json
├── 03_roleplay_stakeholder.json
├── pov_card.html
└── stakeholder_requirements_list.txt
```

---

## 测试执行计划

### 测试阶段1: 文档和配置验证（30分钟）
- 执行：文档完整性测试 + 配置文件测试
- 输出：文档验证报告

### 测试阶段2: Skill调用验证（1小时）
- 执行：Skill调用测试
- 输出：Skill执行报告

### 测试阶段3: 工作流程验证（1小时）
- 执行：工作流程测试 + 数据流转测试
- 输出：流程验证报告

### 测试阶段4: 输出质量验证（1小时）
- 执行：输出质量测试
- 输出：质量验证报告

### 测试阶段5: 错误处理验证（30分钟）
- 执行：错误处理测试
- 输出：错误处理报告

### 测试阶段6: GUI验证（30分钟）
- 执行：GUI界面测试
- 输出：GUI测试报告

### 测试阶段7: 数据一致性验证（30分钟）
- 执行：数据一致性测试
- 输出：一致性验证报告

---

## 测试结果记录

### 测试通过率

| 测试类别 | 测试项目数 | 通过数 | 通过率 |
|---------|-----------|-------|--------|
| 文档完整性 | 5 | ? | ? |
| 配置文件 | 9 | ? | ? |
| Skill调用 | 20 | ? | ? |
| 工作流程 | 8 | ? | ? |
| 输出质量 | 16 | ? | ? |
| 错误处理 | 6 | ? | ? |
| 性能 | 4 | ? | ? |
| 协作能力 | 3 | ? | ? |
| GUI界面 | 12 | ? | ? |
| 数据一致性 | 5 | ? | ? |
| **总计** | **88** | ? | ? |

### 发现的问题

| 问题编号 | 严重程度 | 问题描述 | 位置 | 建议 |
|---------|---------|---------|------|------|
| P01 | | | | |
| P02 | | | | |
| P03 | | | | |

### 优化建议

| 类别 | 建议 | 优先级 |
|------|------|--------|
| 文档 | | |
| 配置 | | |
| Skill | | |
| 流程 | | |
| 质量 | | |
| 错误处理 | | |
| GUI | | |
| 性能 | | |

---

## 测试结论

### 测试总结
- 总体测试通过率: ?%
- 关键问题数量: ?个
- 优化建议数量: ?条

### 测试评级
- ⭐⭐⭐⭐⭐ (优秀): 通过率 ≥ 95%
- ⭐⭐⭐⭐ (良好): 通过率 ≥ 80%
- ⭐⭐⭐ (合格): 通过率 ≥ 70%
- ⭐⭐ (需要改进): 通过率 ≥ 60%
- ⭐ (不合格): 通过率 < 60%

### 下一步行动
- [ ] 修复所有P1问题
- [ ] 优化P2问题
- [ ] 更新Agent文档
- [ ] 重新测试关键功能
- [ ] 准备进入Inspire阶段Agent开发

---

## 测试执行记录

**测试执行人**: Reveal Specialist测试团队
**测试日期**: 2026-03-22
**测试环境**: 本地开发环境
**测试版本**: v1.0

**测试备注**:
