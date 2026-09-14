#!/usr/bin/env python3
# Transform v2.0 R-22 命名统一：中文页重命名（带计数断言，dry-run 安全）
import sys, os

ROOT = "/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
APPLY = "--apply" in sys.argv
PAGES = ["index.html","think.html","punch.html","app.html","act.html","cognitive.html","behavior.html"]

# (file, old, new, expected_count)   file="*" = 全部页
R = []
# ---- 全局：资产页正名（逐页计数）----
for p, n in [("index.html",3),("think.html",3),("punch.html",1),("app.html",8),
             ("act.html",9),("cognitive.html",5),("behavior.html",5)]:
    R.append((p, "我的资产", "成长资产", n))

# ---- index.html：顶栏 span + hero 按钮 + 文案 ----
R.append(("index.html", "<span>想清楚</span>", "<span>每日洞察</span>", 1))
R.append(("index.html", "<span>做到</span>",   "<span>每日改变</span>", 1))
R.append(("index.html", "想清楚一件事", "每日洞察", 1))
R.append(("index.html", "做到一件事",   "每日改变", 1))
R.append(("index.html", "去「做到」拆解出每天的小事", "去「每日改变」拆解出每天的小事", 1))

# ---- 6 内页顶栏（gn-item 结构）----
for p in ["think.html","punch.html","app.html","act.html","cognitive.html","behavior.html"]:
    R.append((p, 'href="think.html">想清楚</a>', 'href="think.html">每日洞察</a>', 1))
    R.append((p, 'href="punch.html">做到</a>',   'href="punch.html">每日改变</a>', 1))

# ---- think.html：入口名 + 深入链接 ----
R.append(("think.html", "<title>想清楚 · Transform</title>", "<title>每日洞察 · Transform</title>", 1))
R.append(("think.html", "想清楚 · 几分钟理清一件事", "每日洞察 · 几分钟理清一件事", 1))
R.append(("think.html", "完整版「想清楚 · 深挖」入口", "完整版「深入洞察」入口", 1))
R.append(("think.html", "想清楚 · 深挖 →", "深入洞察 →", 1))
R.append(("think.html", "「想清楚 · 深挖」会陪你多轮想透", "「深入洞察」会陪你多轮想透", 1))

# ---- punch.html：入口名 + 深入链接 + 注释 ----
R.append(("punch.html", "<title>做到 · Transform</title>", "<title>每日改变 · Transform</title>", 1))
R.append(("punch.html", "<div class=\"ch-eyebrow\">做到</div>", "<div class=\"ch-eyebrow\">每日改变</div>", 1))
R.append(("punch.html", "完整版「做到 · 拆解」入口", "完整版「帮我改变」入口", 1))
R.append(("punch.html", "<a href=\"act.html\">做到 · 拆解 →</a>", "<a href=\"act.html\">帮我改变 →</a>", 1))
R.append(("punch.html", "<!-- 做到主屏 -->", "<!-- 每日改变主屏 -->", 1))
R.append(("punch.html", "/* ===================== 做到 核心 ===================== */",
                        "/* ===================== 每日改变 核心 ===================== */", 1))
R.append(("punch.html", "/* ===== 做到上下文行：", "/* ===== 每日改变上下文行：", 1))
R.append(("punch.html", "// P1-W3：升级到「做到 · 拆解」时", "// P1-W3：升级到「帮我改变」时", 1))
R.append(("punch.html", "'用户刚完成了一个「做到」实验'", "'用户刚完成了一个「每日改变」实验'", 1))
R.append(("punch.html", "<div class=\"sc-tag\">做到 · 还没有进行中的实验</div>",
                        "<div class=\"sc-tag\">每日改变 · 还没有进行中的实验</div>", 1))
R.append(("punch.html", "——做到 = 每天做那一步", "——每日改变 = 每天做那一步", 1))

# ---- app.html：入口名 ----
R.append(("app.html", "<title>想清楚 · 深挖 · Transform</title>", "<title>深入洞察 · Transform</title>", 1))
R.append(("app.html", "// 从「想清楚」的结果页跳来时", "// 从「每日洞察」的结果页跳来时", 1))

# ---- act.html：入口名 ----
R.append(("act.html", "<title>做到 · 拆解 · Transform</title>", "<title>帮我改变 · Transform</title>", 1))
R.append(("act.html", "来自「想清楚」", "来自「每日洞察」", 3))
R.append(("act.html", "从「想清楚」带入的想法", "从「每日洞察」带入的想法", 1))
R.append(("act.html", "完成「做到」后", "完成「每日改变」后", 3))
R.append(("act.html", "// P1-W3：从「做到」升级而来", "// P1-W3：从「每日改变」升级而来", 1))
R.append(("act.html", "行为实验（做到）", "行为实验（每日改变）", 1))
R.append(("act.html", "做到屏 →", "每日改变屏 →", 1))

# ---- cognitive.html：标题顺序 + 引用正名 + 跳转 CTA ----
R.append(("cognitive.html", "<title>想法 · 成长资产 · Transform</title>", "<title>成长资产 · 想法 · Transform</title>", 1))
R.append(("cognitive.html", "每完成一次「想清楚」或「做到」", "每完成一次「每日洞察」或「每日改变」", 1))
R.append(("cognitive.html", "先完成几次「想清楚」或「做到」", "先完成几次「每日洞察」或「每日改变」", 1))
R.append(("cognitive.html", "完成一次「想清楚」并复盘后", "完成一次「每日洞察」并复盘后", 1))
R.append(("cognitive.html", "开始想清楚 →", "开始每日洞察 →", 1))
R.append(("cognitive.html", "去想清楚一件事 →", "去深入洞察 →", 1))

# ---- behavior.html：标题顺序 + 引用正名 + 跳转 CTA ----
R.append(("behavior.html", "<title>证据 · 成长资产 · Transform</title>", "<title>成长资产 · 证据 · Transform</title>", 1))
R.append(("behavior.html", "每完成一次「想清楚」或「做到」", "每完成一次「每日洞察」或「每日改变」", 1))
R.append(("behavior.html", "先完成几次「想清楚」或「做到」", "先完成几次「每日洞察」或「每日改变」", 1))
R.append(("behavior.html", "完成一次「想清楚」并复盘后", "完成一次「每日洞察」并复盘后", 1))
R.append(("behavior.html", "每一次「想清楚」得到的想法", "每一次「每日洞察」得到的想法", 1))
R.append(("behavior.html", "去想清楚一件事 →", "去深入洞察 →", 1))

# ---------- 执行 ----------
cache = {}
def load(p):
    if p not in cache:
        cache[p] = open(os.path.join(ROOT, p), encoding="utf-8").read()
    return cache[p]

errors = []
ok = 0
for f, old, new, exp in R:
    targets = PAGES if f == "*" else [f]
    for p in targets:
        s = load(p)
        got = s.count(old)
        if got != exp:
            errors.append(f"❌ {p}: 期望 {exp} 处 /{old}/，实际 {got} 处")
        else:
            cache[p] = s.replace(old, new)
            ok += 1

if errors:
    print("=== 断言失败，未写入 ===")
    for e in errors: print("  " + e)
    sys.exit(1)

print(f"=== 断言全部通过：{ok} 条规则 ===")
if APPLY:
    for p, s in cache.items():
        open(os.path.join(ROOT, p), "w", encoding="utf-8").write(s)
        print(f"  已写入 {p}")
else:
    print("  (dry-run，未写入。加 --apply 执行)")
