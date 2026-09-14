import asyncio, json, sys
from playwright.async_api import async_playwright

BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
OUT = "/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0/outputs/rev-b1-2026-09-14"

SEED = r"""
(() => {
  const now = Date.now(), day = 86400000;
  const mk = (i, o) => ({
    id: 'a'+i,
    scenario: o.scenario,
    essence: o.essence,
    reflection: o.reflection || {},
    mentalModel: o.mentalModel || '',
    tags: o.tags || [],
    createdAt: new Date(now - i*day*3).toISOString(),
    completedAt: new Date(now - i*day*3).toISOString()
  });
  const archive = [
    mk(1,{scenario:'我想从运营转型做 AI 产品经理', essence:{nature:'用收藏模拟行动，以想象替代实践，本质是焦虑驱动的伪努力。', insight:'转型的门槛不在知识量，而在有没有一件能被别人看见的作品。'}, reflection:{learned:'先把最小作品做出来。'}, mentalModel:'最小作品闭环', tags:['转型','作品']}),
    mk(2,{scenario:'我不知道该先学什么', essence:{nature:'不是准备不够，是我把「开始」的标准定得太高。', insight:'计划和行动之间缺的不是毅力，是一个触发时刻。'}, tags:['转型']}),
    mk(3,{scenario:'同事拿到了 AI 岗的面试', essence:{nature:'把别人的进展当成自己的失败来读。', insight:'比较的落点应该是方法，不是进度。'}, tags:['转型','心态']}),
    mk(4,{scenario:'我总在买书却不看', essence:{nature:'买书是缓解焦虑最低成本的方式。', insight:'消费信息不等于获得能力。'}, tags:['心态']}),
    mk(5,{scenario:'我一直没敢投简历', essence:{nature:'怕被检验，比怕失败更真实。', insight:'先做作品，再谈投递。'}, tags:['转型']})
  ];
  const actions = [
    { id:'e1', input:'每天晚上读一段 AI 产品材料并写一句判断', status:'active', targetDays:7, totalDone:3, currentDay:4, streak:3, insight:'转型的门槛不在知识量，而在有没有作品。', tags:['转型'], logs:[{date:new Date(now-day).toISOString()}], createdAt:new Date(now-4*day).toISOString() },
    { id:'e2', input:'每周做一次竞品拆解并发布', status:'active', targetDays:14, totalDone:2, currentDay:3, streak:1, tags:['作品'], logs:[{date:new Date(now-2*day).toISOString()}], createdAt:new Date(now-8*day).toISOString() },
    { id:'e3', input:'把周会纪要交给 AI，我只改最后一段', status:'graduated', targetDays:7, totalDone:7, currentDay:7, streak:0, tags:['作品'], logs:[{date:new Date(now-10*day).toISOString()}], createdAt:new Date(now-20*day).toISOString() }
  ];
  const profile = { identityStatements: [ {text:'一个用作品说话的人', votes:5, date:new Date().toISOString()} ] };
  localStorage.setItem('trf_archive', JSON.stringify(archive));
  localStorage.setItem('trf_actions', JSON.stringify(actions));
  localStorage.setItem('trf_profile', JSON.stringify(profile));
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
        await pg.goto(BASE + "/cognitive.html")
        await pg.evaluate("() => { localStorage.clear(); }")
        await pg.evaluate(SEED)
        await pg.reload()
        await pg.wait_for_timeout(400)

        # ---------- R-01 页头与区块标题不再重复 ----------
        n = await pg.evaluate("""() => {
            const s = document.body.innerText;
            return s.split('我怎么看这件事').length - 1;
        }""")
        chk("R-01 重复标题串出现次数 = 1", n == 1, f"实测 {n}")

        # ---------- R-02 首屏可见资产 ----------
        vis_cards = await pg.evaluate(JS_VISIBLE, ".insight.fold-card")
        chk("R-02a 首屏可见想法卡 ≥ 3", vis_cards >= 3, f"实测 {vis_cards}")
        trash_hidden = await pg.evaluate("() => document.querySelector('#trashSection').hasAttribute('hidden')")
        chk("R-02b 垃圾桶区块 0 项时隐藏", trash_hidden is True, f"hidden={trash_hidden}")
        models_hidden = await pg.evaluate("() => document.querySelector('#modelsSection').hasAttribute('hidden')")
        chk("R-02c 有资产时模型区可见", models_hidden is False, f"hidden={models_hidden}")

        # ---------- R-03 折叠态露出正文 ----------
        vis_lead = await pg.evaluate(JS_VISIBLE, ".insight .i-lead")
        chk("R-03 折叠态可见洞察正文 ≥ 1", vis_lead >= 1, f"实测 {vis_lead}")
        closed_leads = await pg.evaluate("""() => Array.from(document.querySelectorAll('.insight.fold-card')).filter(c => !c.classList.contains('open'))
            .reduce((n,c) => n + Array.from(c.querySelectorAll('.i-lead')).filter(e=>e.getBoundingClientRect().height>0).length, 0)""")
        chk("R-03b 未展开的卡也露正文", closed_leads >= 1, f"实测 {closed_leads}")

        # ---------- R-06 筛选 chip ----------
        vis_chips = await pg.evaluate(JS_VISIBLE, ".filter-chip")
        chk("R-06 首屏可见筛选 chip ≤ 3", vis_chips <= 3, f"实测 {vis_chips}")

        # ---------- R-04 使用动作优先 ----------
        await pg.evaluate("""() => { const c = document.querySelector('.insight.fold-card'); c.classList.add('open'); }""")
        await pg.wait_for_timeout(150)
        vis_use = await pg.evaluate(JS_VISIBLE, ".insight.open .use-btn")
        chk("R-04a 展开洞察卡使用类按钮 ≥ 2", vis_use >= 2, f"实测 {vis_use}")
        vis_mgmt = await pg.evaluate(JS_VISIBLE, ".insight.open .more-menu .asset-btn")
        chk("R-04b 管理类按钮默认不可见", vis_mgmt == 0, f"实测 {vis_mgmt}")
        hrefs = await pg.evaluate("""() => Array.from(document.querySelectorAll('.insight.open .use-btn')).map(a => a.getAttribute('href') || '')""")
        has_from = any("from=" in h for h in hrefs)
        chk("R-04c 使用按钮带 ?from=", has_from, str(hrefs))
        # ⋯ 展开后管理动作出现
        await pg.evaluate("""() => { const b = document.querySelector('.insight.open .more-btn'); b.click(); }""")
        await pg.wait_for_timeout(120)
        vis_mgmt2 = await pg.evaluate(JS_VISIBLE, ".insight.open .more-menu .asset-btn")
        chk("R-04d 点「更多」后管理动作出现", vis_mgmt2 >= 3, f"实测 {vis_mgmt2}")

        # 折叠态头部「去用 →」
        head_use = await pg.evaluate("""() => Array.from(document.querySelectorAll('.insight .head-use')).filter(a=>{
            const r=a.getBoundingClientRect(); return r.height>0; }).length""")
        chk("R-04e 折叠态头部有「去用 →」", head_use >= 1, f"实测 {head_use}")

        await pg.screenshot(path=OUT + "/b1_cognitive_first_screen.png")

        # ---------- 空状态 R-05 ----------
        await pg.evaluate("() => localStorage.clear()")
        await pg.reload()
        await pg.wait_for_timeout(300)
        neg = await pg.evaluate("""() => {
            const s = document.body.innerText;
            return (s.match(/还没有/g) || []).length + (s.match(/是空的/g) || []).length;
        }""")
        chk("R-05 空状态否定句 ≤ 1", neg <= 1, f"实测 {neg}")
        ob = await pg.evaluate("() => document.querySelectorAll('.onboard-card').length")
        chk("R-05b 显示统一首启引导块", ob == 1, f"实测 {ob}")
        vis_cards0 = await pg.evaluate(JS_VISIBLE, ".insight.fold-card")
        chk("R-05c 空状态不显示空想法列表", vis_cards0 == 0, f"实测 {vis_cards0}")
        await pg.screenshot(path=OUT + "/b1_cognitive_empty.png")

        # ---------- 控制台错误 ----------
        await b.close()

    bad = [r for r in results if not r[1]]
    print("\n==== %d/%d PASS ====" % (len(results) - len(bad), len(results)))
    if bad:
        for t, _, d in bad:
            print("  FAILED:", t, d)
    sys.exit(1 if bad else 0)


asyncio.run(main())
