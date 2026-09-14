import asyncio, sys
from playwright.async_api import async_playwright

BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
OUT = "/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0/outputs/rev-b2-2026-09-14"

SEED = r"""
(() => {
  const now = Date.now(), day = 86400000;
  const archive = [
    { id:'a1', scenario:'我想从运营转型做 AI 产品经理',
      essence:{nature:'用收藏模拟行动，以想象替代实践。', insight:'转型的门槛不在知识量，而在有没有一件能被别人看见的作品。'},
      reflection:{learned:'先把最小作品做出来。'}, mentalModel:'最小作品闭环', tags:['转型','作品'],
      createdAt:new Date(now-20*day).toISOString(), completedAt:new Date(now-20*day).toISOString() },
    { id:'a2', scenario:'我不知道该先学什么',
      essence:{nature:'标准定得太高。', insight:'计划和行动之间缺的是一个触发时刻。'},
      tags:['转型'], createdAt:new Date(now-6*day).toISOString(), completedAt:new Date(now-6*day).toISOString() }
  ];
  const plan = Array.from({length:7}, (_,i)=>({day:i+1, micro:'读一段 AI 产品材料，写一句判断', seconds:30, sub:[], subDone:[]}));
  const actions = [
    { id:'e1', input:'每天晚上读一段 AI 产品材料并写一句判断', status:'active', targetDays:7,
      totalDone:3, currentDay:4, streak:3, plan:plan, tags:['作品'],
      sourceInsightId:'a1', insight:'本质：用收藏模拟行动\n洞察：转型的门槛不在知识量，而在有没有作品。',
      logs:[{date:new Date(now-day).toISOString()}], createdAt:new Date(now-4*day).toISOString() }
  ];
  localStorage.setItem('trf_archive', JSON.stringify(archive));
  localStorage.setItem('trf_actions', JSON.stringify(actions));
  localStorage.setItem('trf_resurface_seen', '[]');
  localStorage.removeItem('trf_session_draft');
  return true;
})()
"""

results = []
def chk(tag, ok, detail=""):
    results.append((tag, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + tag + ("  | " + str(detail) if detail else ""))

async def main():
    import os
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(BASE + "/cognitive.html")
        await pg.evaluate("() => localStorage.clear()")
        await pg.evaluate(SEED)
        await pg.reload()
        await pg.wait_for_timeout(400)

        # R-08 正向：想法 → 实验（针对 a1，它有 sourceInsightId 关联）
        rel = await pg.evaluate("""() => {
            const c = document.querySelector('#ins-a1'); c.classList.add('open');
            const n = c.querySelectorAll('.rel-line').length;
            const html = c.querySelector('.rel-line') ? c.querySelector('.rel-line').innerText : '';
            const link = c.querySelector('.rel-line .rel-link');
            return { n, html, href: link ? link.getAttribute('href') : '' };
        }""")
        chk("R-08a 想法卡显示关联实验", rel["n"] >= 1, rel["html"])
        chk("R-08b 关联链接指向 act.html?id=", "act.html?id=e1" in rel["href"], rel["href"])

        # 锚点可被 #ins-<id> 定位
        anchor = await pg.evaluate("() => !!document.querySelector('#ins-a1')")
        chk("R-08c 想法卡有 #ins-<id> 锚点", anchor is True)

        await pg.screenshot(path=OUT + "/b2_cognitive_relation.png")

        # R-07 markUse：点「拿它去用 →」后 uses 写入
        href = await pg.evaluate("""() => {
            const a = document.querySelector('#ins-a1 .use-btn.solid');
            return a ? a.getAttribute('href') : '';
        }""")
        chk("R-04c 主使用按钮 href 带 ?from=", "from=a1" in href, href)

        await pg.evaluate("""() => { document.querySelector('#ins-a1 .use-btn.solid').click(); }""")
        await pg.wait_for_timeout(900)
        chk("R-07a 跳转到 app.html 并带 from 参数", "app.html" in pg.url and "from=a1" in pg.url, pg.url.split('/')[-1])
        banner = await pg.evaluate("() => { const b = document.querySelector('.using-banner'); return b ? b.innerText : ''; }")
        chk("R-04f app.html 读到 ?from= 并显示「正在用这条想法」", "正在用这条想法" in banner, banner[:60])
        scen = await pg.evaluate("() => { const el = document.getElementById('scenario'); return el ? el.value : '(no el)'; }")
        chk("R-04g app.html 预填了想法所属场景", scen.strip() != "", scen)
        await pg.screenshot(path=OUT + "/b2_app_using_banner.png")

        # 回看 uses 记录
        uses = await pg.evaluate("""() => {
            const a = JSON.parse(localStorage.getItem('trf_archive')||'[]').find(s=>s.id==='a1');
            return (a && a.uses) ? a.uses.length : 0;
        }""")
        chk("R-07b uses[] 记录了这次使用", uses >= 1, f"uses={uses}")

        # 回到想法页，看「用过 N 次」徽章
        await pg.goto(BASE + "/cognitive.html")
        await pg.wait_for_timeout(400)
        badge = await pg.evaluate("""() => {
            const els = Array.from(document.querySelectorAll('.fold-use'));
            return els.map(e => e.innerText).join(' | ');
        }""")
        chk("R-07c 卡上出现「用过 N 次」", "用过" in badge, badge)
        chips = await pg.evaluate("""() => Array.from(document.querySelectorAll('.filter-chip')).map(e=>e.textContent)""")
        chk("R-06 视图 chip = 全部/待用/常用", chips[:3] == ['全部', '待用', '常用'], str(chips))
        # 常用视图
        await pg.evaluate("""() => Array.from(document.querySelectorAll('.filter-chip')).find(e=>e.textContent==='常用').click()""")
        await pg.wait_for_timeout(200)
        used_n = await pg.evaluate("() => document.querySelectorAll('.insight.fold-card').length")
        chk("R-07d 「常用」视图只留用过的想法", used_n == 1, f"实测 {used_n}")

        # R-08 反向：behavior 卡 → 想法
        await pg.goto(BASE + "/behavior.html")
        await pg.wait_for_timeout(400)
        rev = await pg.evaluate("""() => {
            const c = document.querySelector('.action.fold-card'); c.classList.add('open');
            c.querySelectorAll('details').forEach(d => d.open = true);
            const l = c.querySelector('.a-source .rel-link');
            return { txt: c.querySelector('.a-source') ? c.querySelector('.a-source').innerText : '', href: l ? l.getAttribute('href') : '' };
        }""")
        chk("R-08d 实验卡显示「源于想法」", "源于想法" in rev["txt"], rev["txt"][:50])
        chk("R-08e 反向链接指向 cognitive.html#ins-a1", "cognitive.html#ins-a1" in rev["href"], rev["href"])
        await pg.screenshot(path=OUT + "/b2_behavior_relation.png")

        # R-09 首页旧资产浮现
        await pg.goto(BASE + "/index.html")
        await pg.wait_for_timeout(500)
        hr = await pg.evaluate("""() => {
            const c = document.querySelector('.hr-card');
            if (!c) return null;
            return { text: c.innerText, go: (c.querySelector('.hr-go')||{}).getAttribute ? c.querySelector('.hr-go').getAttribute('href') : '' };
        }""")
        chk("R-09a 首页浮现旧资产卡", hr is not None, (hr or {}).get("text", "")[:60])
        if hr:
            chk("R-09b 浮现卡含原句与时间", "天前你写下这句" in hr["text"], hr["text"][:40])
            chk("R-09c 浮现卡「去用 →」带 ?from=", "app.html?from=a1" in hr["go"], hr["go"])
        await pg.screenshot(path=OUT + "/b2_index_resurface.png")

        chk("无页面 JS 报错", len(errs) == 0, str(errs[:3]))
        await b.close()

    bad = [r for r in results if not r[1]]
    print("\n==== %d/%d PASS ====" % (len(results) - len(bad), len(results)))
    for t, _, d in bad:
        print("  FAILED:", t, d)
    sys.exit(1 if bad else 0)

asyncio.run(main())
