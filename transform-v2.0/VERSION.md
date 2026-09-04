# Transform 版本记录

| 版本 | 目录 | 状态 | 说明 |
|------|------|------|------|
| v1.1 | `transform/` + `transform-v1.1/`（本地冻结备份） | 已上线 | 当前线上产品。四功能：每日洞察(think) / 伴我洞察(app) / 每日改变(punch) / 伴我改变(act)；认知档案(cognitive) / 行为档案(behavior) 已拆分；每日改变 Stage2 已改为纯罗列+「开始今日的行为实验」。 |
| **v2.0-draft** | `transform-v2.0/`（本目录） | 规划中 | 本轮仅完成：① 冻结 v1.1 备份；② 开 v2.0 工作副本；③ 打版本号（`<meta name="app-version" content="v2.0-draft">`，代码级、不改动任何视觉设计）。尚未实现任何功能修订。 |

## 版本号约定
- 版本号以 `<meta name="app-version">` 写入每个 HTML `<head>`，并建议在后续 JS 中读取 `document.querySelector('meta[name=app-version]').content` 用于调试/埋点。
- v2.0 的目标（见 `REVISION-THINKING.md`）：**优化现有功能的体验与价值感知，不增加功能**。核心路径：每日使用 → 遇到复杂问题自然升级伴我 → 档案逐渐发现用户模式。

## 硬约束（来自本轮要求）
- **不修改主页（index.html）的视觉设计**：色彩、字体、卡片风格、布局语言保持不变。内容层级重组可在既有设计语言内完成。
- 禁止方向：新增 Agent / 新增认知模型 / 增加任务 / 积分系统 / 排行榜 / 大量动画 / 复杂可视化 / 大量每日内容 / 把每日洞察做成知识 / 把每日改变做成普通 Habit Tracker。
