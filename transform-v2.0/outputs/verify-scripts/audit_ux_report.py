#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""审计：UX-JOURNEY-REVIEW.md 的修订建议，当前是否都已落地。

口径（David 指定）：
  - 排除「AI Key 接入」（报告 §前提 已声明不讨论）
  - 排除「名称一致性」（命名由 David 定义，见 R-22，不参与本次审计）
  - 其余全部按报告原文逐条做可量化实测（数值 / 布尔，不靠"看起来像"）

覆盖：
  U-2 导航统一   U-3 资产首屏   U-4 重复标题   U-5 使用动作(M1/M2)
  U-6 状态持久   U-7 视觉(绿 token / emoji / 一屏一主按钮)   §3.4.4 单卡 ≤600
  §3.5 交互丝滑 6 条   §3.6 空状态   §4.4 M3/M4/M5   §4.5 chips
  §1.1 旅程断点（继续上次 / 右侧浮卡）
"""
import asyncio, json, os
from playwright.async_api import async_playwright

BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
OUT = os.path.join(BASE.replace("file://", ""), "outputs/ux-audit-2026-09-15")
ZH = ["index", "think", "app", "punch", "act", "cognitive", "behavior"]

SEED = r"""
(() => {
  const now = Date.now(), day = 86400000;
  const mk = (i, o) => ({
    id: 'a'+i, scenario: o.scenario, essence: o.essence,
    reflection: o.reflection || {}, mentalModel: o.mentalModel || '',
    tags: o.tags || [],
    uses: o.uses || [], pinned: o.pinned || false,
    createdAt: new Date(now - i*day*3).toISOString(),
    completedAt: new Date(now - i*day*3).toISOString()
  });
  const archive = [
    mk(1,{scenario:'我想从运营转型做 AI 产品经理',
          essence:{nature:'用收藏模拟行动，以想象替代实践，本质是焦虑驱动的伪努力。',
                   insight:'转型的门槛不在知识量，而在有没有一件能被别人看见的作品。'},
          reflection:{learned:'先把最小作品做出来。'}, mentalModel:'最小作品闭环',
          tags:['转型','作品'], uses:[{at:new Date(now-2*day).toISOString(), where:'act:e1'}]}),
    mk(2,{scenario:'我不知道该先学什么',
          essence:{nature:'不是准备不够，是我把「开始」的标准定得太高。',
                   insight:'计划和行动之间缺的不是毅力，是一个触发时刻。'}, tags:['转型']}),
    mk(3,{scenario:'同事拿到了 AI 岗的面试',
          essence:{nature:'把别人的进展当成自己的失败来读。', insight:'比较的落点应该是方法，不是进度。'}, tags:['转型','心态']}),
    mk(4,{scenario:'我总在买书却不看',
          essence:{nature:'买书是缓解焦虑最低成本的方式。', insight:'消费信息不等于获得能力。'}, tags:['心态']}),
    mk(5,{scenario:'我一直没敢投简历',
          essence:{nature:'怕被检验，比怕失败更真实。', insight:'先做作品，再谈投递。'}, tags:['转型']})
  ];
  const actions = [
    { id:'e1', input:'每天晚上读一段 AI 产品材料并写一句判断', status:'active', targetDays:7,
      totalDone:3, currentDay:4, streak:3,
      insight:'转型的门槛不在知识量，而在有没有作品。', sourceInsightId:'a1', tags:['转型'],
      logs:[{date:new Date(now-day).toISOString()}], createdAt:new Date(now-4*day).toISOString() },
    { id:'e2', input:'每周做一次竞品拆解并发布', status:'active', targetDays:14, totalDone:2,
      currentDay:3, streak:1, tags:['作品'], logs:[{date:new Date(now-2*day).toISOString()}],
      createdAt:new Date(now-8*day).toISOString() },
    { id:'e3', input:'把周会纪要交给 AI，我只改最后一段', status:'graduated', targetDays:7,
      totalDone:7, currentDay:7, streak:0, tags:['作品'],
      logs:[{date:new Date(now-40*day).toISOString()}], createdAt:new Date(now-50*day).toISOString() }
  ];
  localStorage.setItem('trf_archive', JSON.stringify(archive));
  localStorage.setItem('trf_actions', JSON.stringify(actions));
  localStorage.setItem('trf_profile', JSON.stringify({identityStatements:[{text:'一个用作品说话的人',votes:5}]}));
  localStorage.setItem('trf_onboarded', '1');
  localStorage.setItem('trf_onboarded_act', '1');
  return true;
})()
"""

JS_VIS = """(sel) => Array.from(document.querySelectorAll(sel)).filter(e => {
  const r = e.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(e);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  return r.top < innerHeight && r.bottom > 0;
}).length"""

results = []


def chk(tag, ok, detail=""):
    results.append((tag, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + tag + ("  | " + str(detail) if detail else ""))


async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))

        # ---------- 种数据（从 cognitive 建立同源 localStorage） ----------
        await pg.goto(BASE + "/cognitive.html")
        await pg.evaluate("() => localStorage.clear()")
        await pg.evaluate(SEED)

        # =============== U-2 / R-11 导航统一 ===============
        navs = {}
        for f in ZH:
            await pg.goto(BASE + f"/{f}.html")
            await pg.wait_for_timeout(250)
            navs[f] = await pg.evaluate("""() => {
                const box = document.querySelector('.gnav') || document.querySelector('.nav');
                if (!box) return null;
                return Array.from(box.querySelectorAll('a')).map(a => a.textContent.replace(/\\s+/g,' ').trim()).filter(Boolean);
            }""")
        present = {f: v for f, v in navs.items() if v}
        chk("U-2a 7 页都有全局导航容器", len(present) == 7, f"实测 {len(present)}/7：{sorted(present)}")
        core = {f: [t for t in (v or []) if t in ("每日洞察", "每日改变", "成长资产")]
                for f, v in present.items()}
        want = sorted(["每日洞察", "每日改变", "成长资产"])
        same = all(sorted(v) == want for v in core.values())
        chk("U-2b 首页与内页同一套三入口（成长资产在导航里）", same, json.dumps(core, ensure_ascii=False))
        trash_in_nav = {f: [t for t in (v or []) if "存数据" in t] for f, v in present.items()}
        chk("U-2c 「存数据」已移出顶栏", not any(trash_in_nav.values()), json.dumps(trash_in_nav, ensure_ascii=False))
        theme_txt = await pg.evaluate("""() => {
            return Array.from(document.querySelectorAll('.gnav a, .nav a'))
              .filter(a => (a.getAttribute('title')||'').indexOf('主题') >= 0 || (a.id||'').indexOf('theme') >= 0)
              .map(a => a.textContent.replace(/\\s+/g,' ').trim());
        }""")
        chk("U-2d 主题开关为裸图标（无文字）", all(not t for t in theme_txt), f"实测 {theme_txt}")

        # =============== U-4 / R-01 重复标题 ===============
        for f, s in (("cognitive", "我怎么看这件事"), ("behavior", "我做到了什么")):
            await pg.goto(BASE + f"/{f}.html")
            await pg.wait_for_timeout(300)
            n = await pg.evaluate("(s) => document.body.innerText.split(s).length - 1", s)
            chk(f"U-4 {f}.html 页头/区块标题不再重复（出现 1 次）", n == 1, f"「{s}」实测 {n} 次")

        # =============== U-3 / R-02 资产首屏 ===============
        await pg.goto(BASE + "/cognitive.html")
        await pg.wait_for_timeout(350)
        vis = await pg.evaluate(JS_VIS, ".insight.fold-card")
        chk("U-3a 首屏（900px）可见想法卡 ≥ 3", vis >= 3, f"实测 {vis}")
        trash = await pg.evaluate("""() => {
            const t = document.querySelector('#trashSection');
            return t ? (t.hasAttribute('hidden') || getComputedStyle(t).display === 'none') : 'no-node';
        }""")
        chk("U-3b 回收箱 0 项时隐藏", trash is True or trash == "no-node", f"实测 {trash}")
        idcard_first = await pg.evaluate("""() => {
            const c = document.querySelector('.id-card, .identity-card, #identityCard');
            if (!c) return -1;
            return c.getBoundingClientRect().top;
        }""")
        chk("U-3c 身份卡不在首屏顶部（top ≥ 600 或不存在）",
            idcard_first == -1 or idcard_first >= 600, f"top={idcard_first}")

        # =============== U-5 / M1 / R-03 折叠态露正文 ===============
        lead = await pg.evaluate("""() => Array.from(document.querySelectorAll('.insight.fold-card'))
            .filter(c => !c.classList.contains('open'))
            .reduce((n,c) => n + Array.from(c.querySelectorAll('.i-lead'))
              .filter(e => e.getBoundingClientRect().height > 0).length, 0)""")
        chk("M1 折叠态可见洞察正文（未展开的卡）", lead >= 1, f"实测 {lead} 条")

        # =============== U-5 / M2 / R-04 使用动作 ===============
        await pg.evaluate("""() => { const c = document.querySelector('.insight.fold-card'); c && c.classList.add('open'); }""")
        await pg.wait_for_timeout(200)
        acts = await pg.evaluate("""() => {
            const c = document.querySelector('.insight.fold-card.open') || document.querySelector('.insight.fold-card');
            const vis = e => { const r = e.getBoundingClientRect();
                return r.width>0 && r.height>0 && getComputedStyle(e).display!=='none'; };
            const as = Array.from(c.querySelectorAll('a,button')).filter(vis)
                .map(e => e.textContent.replace(/\\s+/g,' ').trim());
            const use = as.filter(t => t.indexOf('深入洞察')>=0 || t.indexOf('拿它去用')>=0);
            const mgmt = as.filter(t => ['编辑','归类','归档','删除'].indexOf(t)>=0);
            return { use, mgmt, all: as };
        }""")
        chk("M2a 洞察卡可见使用动作 ≥ 2", len(acts["use"]) >= 2, f"实测 {acts['use']}")
        chk("M2b 管理动作默认不可见（收进溢出菜单）", len(acts["mgmt"]) == 0, f"实测 {acts['mgmt']}")

        # =============== U-6 / R-16 状态持久 ===============
        await pg.goto(BASE + "/cognitive.html")
        await pg.wait_for_timeout(350)
        await pg.evaluate("""() => {
            const c = document.querySelector('.insight.fold-card'); if (c) c.classList.add('open');
            const s = document.querySelector('#insightSection'); if (s) s.classList.add('open');
        }""")
        await pg.evaluate("() => { if (typeof setTagFilter === 'function') setTagFilter('转型'); }")
        await pg.wait_for_timeout(350)
        after = await pg.evaluate("""() => {
            const c = document.querySelector('.insight.fold-card');
            return c ? c.classList.contains('open') : null;
        }""")
        chk("U-6a 切筛选后展开态保留", after is True, f"实测 {after}")
        ui = await pg.evaluate("() => { const v = localStorage.getItem('trf_ui'); return v && v.length > 2 ? v.slice(0,60) : null; }")
        chk("U-6b UI 状态写入 trf_ui", ui is not None, f"实测 {ui}")
        await pg.reload()
        await pg.wait_for_timeout(450)
        after_reload = await pg.evaluate("""() => {
            const c = document.querySelector('.insight.fold-card');
            return c ? c.classList.contains('open') : null;
        }""")
        chk("U-6c 刷新后展开态还原", after_reload is True, f"实测 {after_reload}")

        # =============== U-7① / R-12 单一绿 token ===============
        bad_green = {}
        for f in ZH:
            await pg.goto(BASE + f"/{f}.html")
            await pg.wait_for_timeout(250)
            n = await pg.evaluate("""() => Array.from(document.querySelectorAll('button, .btn, a.btn, .cta, .mini.solid'))
                .filter(e => e.getBoundingClientRect().height > 0)
                .filter(e => { const bg = getComputedStyle(e).backgroundColor;
                    return bg === 'rgb(29, 158, 117)' || bg === 'rgb(29,158,117)'; }).length""")
            if n:
                bad_green[f] = n
        chk("U-7① 按钮底色出现 #1D9E75 的次数 = 0", not bad_green, f"实测 {bad_green}")

        # =============== U-7② / R-13 emoji ===============
        # R-13 口径：彩色 emoji = 0；主题符号 ☾ / ☀ 与对勾 ✓ 除外（非彩色象形 emoji）
        EMOJI_RE = r"[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]"
        ALLOW = set("☾☀✓✔")
        emoji_hits = {}
        for f in ZH:
            await pg.goto(BASE + f"/{f}.html")
            await pg.wait_for_timeout(250)
            hits = await pg.evaluate("""(re) => {
                const rx = new RegExp(re, 'gu');
                const out = [];
                const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                while (w.nextNode()) {
                  const t = w.currentNode.nodeValue;
                  const m = t.match(rx);
                  if (m) out.push(...m);
                }
                return out;
            }""", EMOJI_RE)
            hits = [h for h in hits if h not in ALLOW]
            if hits:
                emoji_hits[f] = hits
        chk("U-7② 正文彩色 emoji = 0（☾/☀/✓ 除外）", not emoji_hits, f"实测 {emoji_hits}")

        # =============== U-7③ / R-14 一屏一深绿实心 ===============
        viol = {}
        for f in ZH:
            await pg.goto(BASE + f"/{f}.html")
            await pg.wait_for_timeout(300)
            h = await pg.evaluate("() => document.body.scrollHeight")
            steps = max(1, min(6, int(h / 900)))
            worst, worst_at = 0, None
            for i in range(steps + 1):
                await pg.evaluate(f"() => scrollTo(0, {i * 900})")
                await pg.wait_for_timeout(180)
                # 只数「可点击的深绿实心块」：button / a / 带 onclick 的元素（进度条色块不算按钮）
                hit = await pg.evaluate("""() => Array.from(document.querySelectorAll('button, a, [onclick], [role=button]')).filter(e => {
                      const r = e.getBoundingClientRect();
                      if (r.width < 40 || r.height < 20) return false;
                      if (r.top < 0 || r.bottom > innerHeight) return false;
                      const cs = getComputedStyle(e);
                      if (cs.backgroundColor !== 'rgb(14, 107, 80)') return false;
                      if (cs.opacity === '0' || cs.visibility === 'hidden') return false;
                      return true;
                    }).map(e => e.tagName + '.' + (e.className||'').toString().slice(0,26)
                           + '「' + e.textContent.replace(/\\s+/g,' ').trim().slice(0,14) + '」')""")
                if len(hit) > worst:
                    worst, worst_at = len(hit), hit
            viol[f] = {"n": worst, "at": worst_at} if worst > 1 else worst
        chk("U-7③ 任一屏深绿实心可点块 ≤ 1", all((v if isinstance(v, int) else v["n"]) <= 1 for v in viol.values()),
            f"实测 {json.dumps(viol, ensure_ascii=False)}")

        # =============== §3.4.4 / R-15 单卡 ≤600px ===============
        await pg.goto(BASE + "/cognitive.html")
        await pg.wait_for_timeout(350)
        heights = await pg.evaluate("""() => {
            document.querySelectorAll('.insight.fold-card').forEach(c => c.classList.add('open'));
            return Array.from(document.querySelectorAll('.insight.fold-card'))
              .map(c => Math.round(c.getBoundingClientRect().height));
        }""")
        chk("§3.4.4 单卡展开 ≤ 600px", all(h <= 600 for h in heights), f"实测 {heights}")

        # =============== §3.6 / R-05 空状态 ===============
        await pg.evaluate("() => { localStorage.setItem('trf_archive','[]'); localStorage.setItem('trf_actions','[]'); }")
        await pg.goto(BASE + "/cognitive.html")
        await pg.wait_for_timeout(400)
        neg = await pg.evaluate("""() => {
            const t = document.body.innerText;
            return ['还没有','暂无','空空如也','未添加'].reduce((n,w) => n + (t.split(w).length-1), 0);
        }""")
        guide = await pg.evaluate("""() => {
            const t = document.body.innerText;
            return t.indexOf('先去') >= 0 || t.indexOf('长出来') >= 0 || t.indexOf('开始') >= 0;
        }""")
        chk("§3.6a 空状态否定句 ≤ 1", neg <= 1, f"实测 {neg}")
        chk("§3.6b 有统一首启引导块（非否定句）", guide is True, f"实测 {guide}")
        await pg.evaluate(SEED)

        # =============== §4.5 / R-06 chips ≤3 ===============
        await pg.goto(BASE + "/cognitive.html")
        await pg.wait_for_timeout(350)
        chips = await pg.evaluate("""() => {
            const box = document.querySelector('#viewChips');
            if (!box) return -1;
            const n = Array.from(box.querySelectorAll('button'))
              .filter(e => e.getBoundingClientRect().height > 0).length;
            const r = box.getBoundingClientRect();
            return { n: n, inFirstScreen: r.top < 900 };
        }""")
        chk("§4.5 首屏可见筛选切换 ≤ 3（全部/待用/常用）",
            isinstance(chips, dict) and chips["n"] <= 3 and chips["inFirstScreen"], f"实测 {chips}")
        tag_hidden = await pg.evaluate("""() => {
            const box = document.querySelector('#tagFilters');
            if (!box) return 'no-node';
            const r = box.getBoundingClientRect();
            return r.height === 0 || r.top >= 900 || box.hasAttribute('hidden');
        }""")
        chk("§4.5b 标签 chips 已收起（不在首屏）", tag_hidden in (True, "no-node"), f"实测 {tag_hidden}")

        # =============== M3 / R-07 使用记录 ===============
        shown = await pg.evaluate("""() => document.body.innerText.indexOf('用过') >= 0""")
        chk("M3a 卡片显示「用过 N 次」", shown is True, f"实测 {shown}")
        sort_used = await pg.evaluate("""() => document.body.innerText.indexOf('常用') >= 0""")
        chk("M3b 有「常用 / 按用得多」维度", sort_used is True, f"实测 {sort_used}")
        before = await pg.evaluate("""() => (JSON.parse(localStorage.getItem('trf_archive')||'[]')[0].uses||[]).length""")
        await pg.evaluate("""() => { const c = document.querySelector('.insight.fold-card'); if (c) c.classList.add('open'); }""")
        await pg.wait_for_timeout(150)
        clicked = await pg.evaluate("""() => {
            const a = Array.from(document.querySelectorAll('.insight.fold-card.open a, .insight.fold-card a'))
              .find(x => x.textContent.indexOf('深入洞察') >= 0);
            return a ? a.getAttribute('href') : null;
        }""")
        chk("M3c 使用入口带 ?from= 才可能记一次使用", bool(clicked and "from=" in clicked), f"实测 {clicked}")

        # =============== M4 / R-08 双向关联 ===============
        rel = await pg.evaluate("""() => {
            // .a-source 同时被两层折叠包住：卡片的 .open（不是 <details>）+ 内层 <details>
            document.querySelectorAll('.action.fold-card, .fold-card').forEach(c => c.classList.add('open'));
            document.querySelectorAll('details').forEach(d => d.open = true);
            const t = document.body.innerText;
            return { toExp: /已变成\\s*\\d/.test(t), fromIns: /源于(想法|洞察|这条)/.test(t), model: /条(洞察|想法)/.test(t) };
        }""")
        chk("M4a 洞察卡 →「已变成 N 个实验」", rel["toExp"] is True, f"实测 {rel}")
        # 实验卡在「成长资产 · 证据」页（behavior.html）渲染，换页再测反向关联
        await pg.goto(BASE + "/behavior.html")
        await pg.wait_for_timeout(450)
        rel2 = await pg.evaluate("""() => {
            document.querySelectorAll('.action.fold-card, .fold-card').forEach(c => c.classList.add('open'));
            document.querySelectorAll('details').forEach(d => d.open = true);
            const e = document.querySelector('.a-source');
            return { txt: e ? e.textContent.replace(/\\s+/g,' ').trim().slice(0,46) : null,
                     h: e ? Math.round(e.getBoundingClientRect().height) : 0 };
        }""")
        chk("M4b 实验卡 →「源于这条认知」可见",
            bool(rel2["txt"]) and rel2["h"] > 0, f"实测 {rel2}")

        # =============== M5 / R-09 首页旧资产浮现 ===============
        await pg.goto(BASE + "/index.html")
        await pg.wait_for_timeout(500)
        float_card = await pg.evaluate("""() => {
            const t = document.body.innerText;
            const i = t.indexOf('你写下这句');
            return i >= 0 ? t.slice(i, i + 60).replace(/\\n/g, ' / ') : null;
        }""")
        chk("M5 首页浮现 1 条旧资产（≥14 天未看）", float_card is not None, f"实测 {float_card}")

        # =============== §1.1 #2 首页「继续上次」 ===============
        # 有未完成的改变实验（今天没打勾）→ 必须出现，且指向 punch.html
        cont = await pg.evaluate("""() => {
            const b = document.getElementById('homeResume');
            if (!b) return { node: false };
            const r = b.getBoundingClientRect();
            return { node: true, shown: b.classList.contains('show'),
                     href: b.getAttribute('href'),
                     txt: (b.innerText || '').replace(/\\s+/g, ' ').trim(),
                     top: Math.round(r.top), h: Math.round(r.height) };
        }""")
        chk("§1.1-#2a 有未完成时首页出现「继续上次」→ 每日改变",
            cont.get("shown") is True and cont.get("href") == "punch.html", f"实测 {cont}")
        chk("§1.1-#2b 「继续上次」在首屏内（top < 900，无需滚动）",
            0 <= cont.get("top", -1) < 900 and cont.get("h", 0) > 0, f"实测 top={cont.get('top')} h={cont.get('h')}")
        # 今天已打勾 → 不该再催（默认状态不强迫用户处理旧事务）
        await pg.evaluate("""() => {
            const a = JSON.parse(localStorage.getItem('trf_actions') || '[]');
            (a || []).forEach(x => { if (x && x.status === 'active') {
              x.logs = (x.logs || []).concat([{ day: x.currentDay || 1, date: new Date().toISOString(), done: true }]);
            }});
            localStorage.setItem('trf_actions', JSON.stringify(a));
        }""")
        await pg.goto(BASE + "/index.html")
        await pg.wait_for_timeout(400)
        cont_done = await pg.evaluate("""() => {
            const b = document.getElementById('homeResume');
            return b ? b.classList.contains('show') : null;
        }""")
        chk("§1.1-#2c 今天已完成时不再催（不显示）", cont_done is False, f"实测 shown={cont_done}")
        # 什么都没有 → 完全不出现
        await pg.evaluate("() => localStorage.clear()")
        await pg.goto(BASE + "/index.html")
        await pg.wait_for_timeout(400)
        cont_empty = await pg.evaluate("""() => {
            const b = document.getElementById('homeResume');
            return b ? { shown: b.classList.contains('show'), h: Math.round(b.getBoundingClientRect().height) } : null;
        }""")
        chk("§1.1-#2d 空状态完全不出现（不占版面）",
            cont_empty and cont_empty["shown"] is False and cont_empty["h"] == 0, f"实测 {cont_empty}")

        # =============== §1.1 #8 / §3.3 app 右侧浮卡 ===============
        await pg.goto(BASE + "/app.html")
        await pg.wait_for_timeout(600)
        aside = await pg.evaluate("""() => {
            const a = document.querySelector('#appAside');
            if (!a) return 'no-node';
            const r = a.getBoundingClientRect();
            const vis = r.width > 0 && getComputedStyle(a).display !== 'none';
            return { visible: vis, top: Math.round(r.top), text: (a.innerText||'').slice(0,40).replace(/\\n/g,' / ') };
        }""")
        chk("§3.3 app 四步页右侧浮卡（主题沉淀/最近洞察）已移走",
            aside == "no-node" or aside.get("visible") is False, f"实测 {aside}")

        # =============== §3.5 阶段切换位置提示 ===============
        step_hint = await pg.evaluate("""() => {
            const act = document.querySelector('.p-node.active');
            return { 有当前步高亮: !!act, 当前步名: act ? act.textContent.replace(/\\s+/g,' ').trim() : null,
                     序号文案: /第\\s*[1-4]\\s*步/.test(document.body.innerText) };
        }""")
        chk("§3.5-4a 阶段切换有位置提示（当前步高亮 + 步名）",
            step_hint["有当前步高亮"] and bool(step_hint["当前步名"]), f"实测 {step_hint}")
        chk("§3.5-4b 位置提示含「第 N 步」序号（报告原文示例）",
            step_hint["序号文案"] is True, f"实测 {step_hint['序号文案']}")

        # =============== §3.5 保存后去向 ===============
        save_hint = await pg.evaluate("""() => {
            const html = document.documentElement.innerHTML;
            return /已存入/.test(html);
        }""")
        chk("§3.5-5 保存后就地显示去向（已存入…）", save_hint is True, f"实测 {save_hint}")

        # =============== JS 错误 ===============
        chk("无页面 JS 错误", not errs, f"{errs[:3]}")

        await b.close()

    ok = sum(1 for _, c, _ in results if c)
    print("\n==== UX-JOURNEY-REVIEW 审计：%d/%d 通过 ====" % (ok, len(results)))
    for n, c, e in results:
        if not c:
            print("  ✗ " + n + ("  | " + str(e) if e else ""))


asyncio.run(main())
