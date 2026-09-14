import asyncio, sys
from playwright.async_api import async_playwright

BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
OUT = "/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0/outputs/rev-b1-2026-09-14"

SEED = r"""
(() => {
  const now = Date.now(), day = 86400000;
  const mk = (i, o) => ({
    id: 'a'+i, scenario: o.scenario, essence: o.essence,
    reflection: o.reflection || {}, mentalModel: o.mentalModel || '', tags: o.tags || [],
    createdAt: new Date(now - i*day*3).toISOString(),
    completedAt: new Date(now - i*day*3).toISOString()
  });
  const archive = [
    mk(1,{scenario:'我想从运营转型做 AI 产品经理', essence:{nature:'用收藏模拟行动。', insight:'转型的门槛不在知识量，而在有没有作品。'}, mentalModel:'最小作品闭环', tags:['转型']}),
    mk(2,{scenario:'我不知道该先学什么', essence:{nature:'标准定得太高。', insight:'计划和行动之间缺的是一个触发时刻。'}, tags:['转型']})
  ];
  const plan = [
    {micro:'读一段 AI 产品材料，写一句判断'},
    {micro:'读一段 AI 产品材料，写一句判断'},
    {micro:'读一段 AI 产品材料，写一句判断'},
    {micro:'读一段 AI 产品材料，写一句判断'},
    {micro:'读一段 AI 产品材料，写一句判断'},
    {micro:'读一段 AI 产品材料，写一句判断'},
    {micro:'读一段 AI 产品材料，写一句判断'}
  ];
  const actions = [
    { id:'e1', input:'每天晚上读一段 AI 产品材料并写一句判断', status:'active', targetDays:7, totalDone:3, currentDay:4, streak:3, plan: plan, tags:['转型'], logs:[{date:new Date(now-day).toISOString()}], createdAt:new Date(now-4*day).toISOString() },
    { id:'e2', input:'每周做一次竞品拆解并发布', status:'active', targetDays:14, totalDone:2, currentDay:3, streak:1, plan: plan, tags:['作品'], logs:[{date:new Date(now-2*day).toISOString()}], createdAt:new Date(now-8*day).toISOString() },
    { id:'e3', input:'把周会纪要交给 AI，我只改最后一段', status:'graduated', targetDays:7, totalDone:7, currentDay:7, plan: plan, tags:['作品'], logs:[{date:new Date(now-10*day).toISOString()}], createdAt:new Date(now-20*day).toISOString() },
    { id:'e4', input:'早上到工位先写下今天唯一要推进的一件事', status:'active', targetDays:7, totalDone:1, currentDay:2, streak:1, plan: plan, tags:['作品'], logs:[{date:new Date(now-day).toISOString()}], createdAt:new Date(now-1*day).toISOString() }
  ];
  localStorage.setItem('trf_archive', JSON.stringify(archive));
  localStorage.setItem('trf_actions', JSON.stringify(actions));
  localStorage.setItem('trf_profile', JSON.stringify({ identityStatements:[{text:'一个用作品说话的人', votes:5, date:new Date().toISOString()}] }));
  return true;
})()
"""

JS_VISIBLE = """(sel) => Array.from(document.querySelectorAll(sel)).filter(e => {
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
    import os
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(BASE + "/behavior.html")
        await pg.evaluate("() => localStorage.clear()")
        await pg.evaluate(SEED)
        await pg.reload()
        await pg.wait_for_timeout(400)

        n = await pg.evaluate("""() => document.body.innerText.split('我做到了什么').length - 1""")
        chk("R-01 重复标题串出现次数 = 1", n == 1, f"实测 {n}")

        vis = await pg.evaluate(JS_VISIBLE, ".action.fold-card")
        chk("R-02a 首屏可见实验卡 ≥ 3", vis >= 3, f"实测 {vis}")
        th = await pg.evaluate("() => document.querySelector('#trashSection').hasAttribute('hidden')")
        chk("R-02b 垃圾桶 0 项时隐藏", th is True, f"hidden={th}")

        lead = await pg.evaluate(JS_VISIBLE, ".action .i-lead")
        chk("R-03 折叠态可见「今天要做的」≥ 1", lead >= 1, f"实测 {lead}")

        chips = await pg.evaluate(JS_VISIBLE, ".filter-chip")
        chk("R-06 首屏可见筛选 chip ≤ 3", chips <= 3, f"实测 {chips}")

        head_use = await pg.evaluate("""() => Array.from(document.querySelectorAll('.action .head-use')).filter(a=>a.getBoundingClientRect().height>0).length""")
        chk("R-04e 折叠态有「继续做 →」", head_use >= 1, f"实测 {head_use}")

        # 展开第一张，检查管理动作已收起
        await pg.evaluate("""() => { const c = document.querySelector('.action.fold-card'); c.classList.add('open'); }""")
        await pg.wait_for_timeout(150)
        vm = await pg.evaluate(JS_VISIBLE, ".action.open .more-menu .asset-btn")
        chk("R-04b 管理类按钮默认不可见", vm == 0, f"实测 {vm}")
        await pg.evaluate("""() => document.querySelector('.action.open .more-btn').click()""")
        await pg.wait_for_timeout(120)
        vm2 = await pg.evaluate(JS_VISIBLE, ".action.open .more-menu .asset-btn")
        chk("R-04d 点「更多」后管理动作出现", vm2 >= 3, f"实测 {vm2}")

        await pg.screenshot(path=OUT + "/b1_behavior_first_screen.png")

        # 筛选面板
        await pg.evaluate("""() => document.querySelector('#filterToggleBtn').click()""")
        await pg.wait_for_timeout(150)
        panel_open = await pg.evaluate("() => !document.querySelector('#filterPanel').hasAttribute('hidden')")
        chk("R-06b 「筛选」面板可展开", panel_open is True)
        await pg.screenshot(path=OUT + "/b1_behavior_filter_panel.png")

        # 空状态
        await pg.evaluate("() => localStorage.clear()")
        await pg.reload()
        await pg.wait_for_timeout(300)
        neg = await pg.evaluate("""() => { const s = document.body.innerText; return (s.match(/还没有/g)||[]).length + (s.match(/是空的/g)||[]).length; }""")
        chk("R-05 空状态否定句 ≤ 1", neg <= 1, f"实测 {neg}")
        ob = await pg.evaluate("() => document.querySelectorAll('.onboard-card').length")
        chk("R-05b 显示统一首启引导块", ob == 1, f"实测 {ob}")
        await pg.screenshot(path=OUT + "/b1_behavior_empty.png")

        chk("无页面 JS 报错", len(errs) == 0, str(errs[:3]))
        await b.close()

    bad = [r for r in results if not r[1]]
    print("\n==== %d/%d PASS ====" % (len(results) - len(bad), len(results)))
    for t, _, d in bad:
        print("  FAILED:", t, d)
    sys.exit(1 if bad else 0)

asyncio.run(main())
