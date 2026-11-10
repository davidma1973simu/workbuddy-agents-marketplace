# Z转变器 · 跟上 Z 世代的脚步

> 把任何产品 / 服务，转变成 Z 世代想要的样子。
> 三支柱诊断 · 五步转变 · 一键导出 13 页专案 PPT。纯前端，免费，无需注册。

[English](README.en.md) · [一页宣传单 · 中文](promo-zh.html) · [One-pager · EN](promo-en.html)

---

## 打开就能用

| 入口 | 用途 | 地址 |
| --- | --- | --- |
| **完整版 Pro** | 七屏转型专案、逐字可改、导出 PPT | [立即打开](https://z-translator.app.workbuddy.host/?sharecode=FVZKPT3F7M) |
| GitHub Pages 镜像 | 同一版本，静态托管直连 | [打开](https://davidma1973simu.github.io/workbuddy-agents-marketplace/ztranslator/) |
| **Z含量 · 测一测** | 引流版：拍照测 Z 含量，30 秒出趣味读数 | [打开](https://z-density-game.app.workbuddy.host/?sharecode=DFPZX3LDV3) |
| 一页宣传单 | A4 竖版，浏览器打开可打印 | [中文](promo-zh.html) / [EN](promo-en.html) |
| 宣传单成品 PDF | 直接分发，已排好 A4 单页 | [中文](promo-zh.pdf) / [EN](promo-en.pdf) |

右上角中 / EN 跷跷板切换语言；也可用 `?lang=en`（Pages 版）或 `&lang=en`（分享链接）。

## 它解决什么

好价值落不了地，常常不是产品不行，而是没跟上这一代判断价值的方式。
Z转变器把「他们为什么不买」重构成能执行的改变：从产品、包装、沟通、渠道、社群五处下手，给出一句话定位、一个场景和 5 条能直接派活的行动。

## 方法骨架

- **三支柱**：掌控感 / 配得感 / 即时满足
- **五步转变**：产品 / 包装 / 沟通 / 渠道 / 社群（源自宝洁五步法）
- **七屏**：输入 → 理解 → 重构 → 机遇 → 转变 → 专案 → 导出

## 三步上手

1. 回答五个问题（产品、人群、价值、现状、阻力），或点**载入示例**看一遍逐字对话演示。
2. 点**生成转型专案**，逐屏查看。带极淡绿下划线的文字都能直接改，改完即存。
3. 最后一屏**导出 PPT**（13 页）。专案自动归档进「课题」，随时回看或开新课题。

## 推理引擎

| 模式 | 说明 |
| --- | --- |
| 本地推演（默认） | 内置规则跑完七步，无需联网、无需 Key，结论较浅但完整可用 |
| 接入自己的模型 | 设置里选 DeepSeek / OpenAI / Gemini 并粘贴 Key，同一份输入得到真推理 |

Key 只存在本机浏览器，不上传。模型输出带案例锚定与跑题护栏：生成内容与输入品类不符时，自动回落本地推演并轻提示。

## 隐私

纯前端，无后端、无账号、无埋点。输入与专案只写浏览器 `localStorage`；清除浏览器数据即全部清空。

## 本地运行与部署

```bash
git clone https://github.com/davidma1973simu/workbuddy-agents-marketplace.git
cd workbuddy-agents-marketplace/ztranslator
python3 -m http.server 8000
# http://localhost:8000/
```

`index.html` 双击也能用；PPT 导出需要同目录 `pptxgen.bundle.js`，PWA 安装需 http(s) 环境。任意静态托管均可部署，本仓库走 GitHub Pages（main 分支）。

## 文件

| 文件 | 作用 |
| --- | --- |
| `index.html` | 完整应用（含全部 CSS / JS） |
| `pptxgen.bundle.js` | 本地 PPT 生成库 |
| `manifest.webmanifest` / `sw.js` / `app-icon.png` | PWA 安装与图标 |
| `promo-zh.html` / `promo-en.html` | A4 一页宣传单源文件（二维码已内联，单文件可分发） |
| `promo-zh.pdf` / `promo-en.pdf` | 同版式 A4 单页 PDF 成品 |
| `README.md` / `README.en.md` | 本文档中 / 英 |

宣传单导出：浏览器打开 → 打印 → 「另存为 PDF」→ 纸张 A4、边距「无」、勾选「背景图形」。

## 关键词

Z世代 · Gen Z · 代际 · 品牌年轻化 · 产品转型 · 三支柱 · 宝洁五步法 · 设计思维 · P&G five shifts · transformation · positioning · generation gap · one-pager

---

© David Ma · [主线仓库](https://github.com/davidma1973simu/workbuddy-agents-marketplace)
