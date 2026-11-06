# 谈伴 Negotia · 知识库（可编辑）

本目录是产品的**核心资产**，全部为纯 JSON / SVG，**可直接审阅、改写**，应用运行时按需 `fetch` 加载，不碰代码即可改内容。

## 目录结构
```
kb/
├── manifest.json          索引：三大域 + 场景清单 + 技术/模块清单 + 世界列表
├── worlds/                ★ 共用背景案例 + 人设花名册（提前捏好，被所有场景调用）
│   ├── A.json             职业组织内部（云启科技：组织层级 + 5 个人设）
│   ├── B.json             业务间对外（6 个人设：客户/HR/供应商/发包/客诉/合作）
│   └── C.json             个人生活（林家：家庭结构 + 8 个人设）
├── scenarios/             ★ 24 张场景卡（引用 worldId + personaId）
│   ├── A/A01..A08.json
│   ├── B/B01..B08.json
│   └── C/C01..C08.json
├── techniques/            12 张技术卡（原版 ⇄ 中国修订 并存于同文件）
└── china-modules/         4 个中国特有模块（面子/关系/含蓄拒绝/中间人）
assets/avatars/            19 张人设立绘 SVG（确定性卡通，零 API 成本）+ coach.svg
```

## 关键设计：人设一次定义、处处调用
- **人设**（姓名/年龄/身份/关系/人格/权力距离/黑天鹅/说话风格/头像）只写在 `worlds/X.json` 的 `personas[]` 里。
- **场景卡**通过 `personaId` 引用，不在每个场景重复写人设 → 改一个人设，所有用到他的场景同步更新。
- `worlds/X.json` 的 `background` 是**该域共用背景案例**；`structure`（组织层级/家庭结构 + `relationships`）是"提前告知用户会面对的角色与关系"。

## 字段说明（改写指南）
- **worlds/X.json**：`background`(共用叙事) · `structure.type`(org/family/network) · `structure.tree`(角色树) · `structure.relationships`(关系句) · `personas[](id,name,avatar,age,role,relation,personality,powerDistance,hiddenGoals[],speakingStyle,color)`
- **scenarios/X/xx.json**：`worldId` · `personaId` · `title` · `briefing`(情境) · `openingLine`(对手开场) · `recommendedTechniques[](技术id)` · `pitfalls[](中国坑)` · `customTemplate{ prompt, placeholder }` · `masteryTest{ id, title, twist, brief }`
- **techniques/X.json**：`name` · `original{how,example}` · `chinaRevision{how,example}` · `axis`(雷达维度)
- **china-modules/X.json**：`name` · `summary` · `tactics[]` · `pit`

## 如何增改
1. 新增人设：在对应 `worlds/X.json` 的 `personas` 加一项（记得在 `assets/avatars/` 放同名 `.svg` 立绘，可复制现有改色）。
2. 新增场景：在 `scenarios/X/` 加 JSON，填 `worldId`+`personaId`，并在 `manifest.json` 的对应域 `items` 追加 `{id,title}`。
3. 改文案/话术/坑：直接编辑对应 JSON 保存，刷新页面即生效。

## 重新生成
`node build-kb.mjs` 会依照脚本内 `WORLDS / SCENARIOS / TECHNIQUES / CHINA_MODULES` 重新产出全部 JSON 与立绘（改脚本后运行；手动改过的 JSON 会被覆盖，请优先改 JSON 而非脚本）。
