# Eureka Lite — 轻量级创新工作台

> **状态**：✅ 已完成可运行 | **版本**：v0.2 MVP | **创建时间**：2026-04

## 这是什么

Eureka Lite 是一个纯前端的单页应用（SPA），实现了 RISE 创新方法论的完整流程。无需后端服务，浏览器打开即可使用。

## 技术栈

| 组件 | 技术 |
|---|---|
| 前端框架 | Vanilla JavaScript (ES6+) |
| 样式 | CSS3 自定义属性 + Flexbox/Grid |
| 数据持久化 | localStorage |
| AI 集成 | Gemini API（Standby 模式） |

## 如何运行

**本地运行**：
```bash
# 方式一：直接双击打开
open index.html        # Mac
start index.html       # Windows

# 方式二：用本地服务器（推荐）
python3 -m http.server 8080
# 然后访问 http://localhost:8080
```

**无需安装任何依赖**，开箱即用。

## 已实现功能

### 四大核心模块（RISE 框架）

1. **Reveal（洞察）** — 5 屏交互：场景描述 → 用户旅程 → FIND 洞察 → 利益方分析 → 简报生成
2. **Inspire（启发）** — 5 屏交互：HMW 问题重定义 → NCO 灵感交叉 → 创意生成 → 筛选矩阵 → 创意确认
3. **Shape（塑造）** — 3 屏交互：四维拷问 → 最小概念方案 → 故事板
4. **Exam（验证）** — 5 屏交互：原型设计 → 用户测试 → 测试报告 → 四维评价 → 电梯演讲

### 辅助功能

- ✅ 项目库管理（多项目切换）
- ✅ 个人中心 + 打卡系统
- ✅ 积分体系（Eureka Coins）
- ✅ AI 助手集成（Gemini Standby）
- ✅ 本地存储自动保存

### 未实现 / 待完善

- ❌ 未部署到线上（仅本地运行）
- ❌ 云端同步未接入
- ❌ 多语言支持（目前中文）

## 核心文件说明

| 文件 | 行数 | 说明 |
|---|---|---|
| `index.html` | ~300 | SPA 入口 + 所有页面模板 |
| `js/app.js` | ~5,228 | 全部业务逻辑（路由、模块、数据流） |
| `js/storage.js` | ~321 | localStorage 封装层 |
| `js/state.js` | ~196 | 全局状态管理 |
| `css/style.css` | ~800 | 完整样式表 |

## 与其他 Eureka 版本的关系

Eureka 产品线有三个版本：

| 版本 | 定位 | 位置 |
|---|---|---|
| **Eureka Lite**（本目录） | 轻量前端 MVP，纯浏览器运行 | `eureka-lite/` |
| **Eureka Pro** | 完整 Dashboard + Python 后端 + AI Agent 链 | `Claw/eureka_value_inovation/eureka-dashboard/` |
| **学习系统** | RISE 方法论交互式教程，内嵌于 Pro Dashboard | `workbuddy-agents-marketplace/eureka-dashboard/learn.html` |

详细的产品线全貌见上级目录的 **`EUREKA-ECOSYSTEM-STATUS.md`**。
