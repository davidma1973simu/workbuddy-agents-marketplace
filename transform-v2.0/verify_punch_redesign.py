"""Punch 重设计针对性验证：创建一步到位 + 今天唯一焦点 + 轻认领"""
import asyncio, json
from playwright.async_api import async_playwright

ROOT = "/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
URL = "file://" + ROOT + "/punch.html"

PASS = 0
FAIL = 0

def ok(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✓ {name}")
    else:
        FAIL += 1
        print(f"  ✗ {name}  {detail}")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="chrome", headless=True)
        ctx = await browser.new_context()
        pg = await ctx.new_page()

        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))

        # 清空本地数据
        await pg.goto(URL)
        await pg.evaluate("() => { localStorage.clear(); }")
        await pg.reload(wait_until="networkidle")
        await pg.wait_for_timeout(300)

        # === 1. 全新态：一步到位的创建卡 ===
        title = await pg.evaluate("() => (document.querySelector('.create-start .sc-title')||{}).textContent || ''")
        ok("全新态显示创建卡", "想改变什么" in title, f"title={title!r}")

        # 步骤条应已消失（无进行中实验时 steps bar 应该为空或隐藏）
        stepsbar = await pg.evaluate("() => (document.getElementById('punchStepsBarWrap')||{}).innerHTML || ''")
        ok("创建态无 3 步向导步骤条", "p-node" not in stepsbar, f"stepsbar={stepsbar[:80]!r}")

        # 收窄确认卡不应存在
        fc = await pg.evaluate("() => !!document.querySelector('.fc-card')")
        ok("创建态无收窄确认卡", not fc)

        # === 2. 注入一个进行中实验，验证「今天唯一焦点」执行态 ===
        plan = [{"day": i, "micro": f"第{i}天的一小步", "sub": [], "subDone": []} for i in range(1, 8)]
        experiment = {
            "id": "a_test_1", "input": "每天早上一杯温水", "createdAt": "2026-10-15T00:00:00Z",
            "targetDays": 7, "currentDay": 3, "plan": plan, "logs": [], "status": "active",
            "streak": 0, "totalDone": 2, "bestStreak": 0,
            "anchor": {"after": "在我早上刷牙之后"}, "identity": "一个注重健康的人"
        }
        await pg.evaluate("(exp) => { localStorage.setItem('trf_actions', JSON.stringify([exp])); }", experiment)
        await pg.reload(wait_until="networkidle")
        await pg.wait_for_timeout(300)

        # 今天焦点卡存在
        has_focus = await pg.evaluate("() => !!document.querySelector('.ck-today-focus')")
        ok("执行态出现今天唯一焦点卡", has_focus)

        # 焦点卡以自然语言输入为主（不是打卡按钮）
        has_input = await pg.evaluate("() => !!document.getElementById('fusionInput')")
        ok("焦点卡以自然语言输入为主", has_input)
        btn_txt = await pg.evaluate("() => (document.getElementById('fusionBtn')||{}).textContent || ''")
        ok("焦点卡有「推进」按钮", "推进" in btn_txt, f"btn={btn_txt!r}")

        # 未来清单折叠
        rest_sum = await pg.evaluate("() => (document.querySelector('.ck-rest-sum')||{}).textContent || ''")
        ok("未来 6 天折叠成「还有 N 天」", "还有" in rest_sum or "已走完" in rest_sum, f"rest={rest_sum!r}")

        # 锚点只展示一次（不应有 ck-anchor-tip 重复 + ck-anchor-tag 双重）
        anchor_tag = await pg.evaluate("() => (document.querySelector('.ck-anchor-tag')||{}).textContent || ''")
        ok("锚点展示一次（任务头）", "锚点" in anchor_tag, f"tag={anchor_tag!r}")

        # === 3. 自然语言推进（融合），不是勾选打卡 ===
        await pg.evaluate("() => { document.getElementById('fusionInput').value = '今天顺手就做了，很自然'; }")
        await pg.evaluate("() => { document.getElementById('fusionBtn').click(); }")
        await pg.wait_for_timeout(300)

        # 验证记录已落库（done）且焦点卡回显 + 可改
        saved = await pg.evaluate("() => JSON.parse(localStorage.getItem('trf_actions') || '[]')")
        ok("推进已写入日志(done)", len(saved) == 1 and len(saved[0]['logs']) == 1 and saved[0]['logs'][0]['done'] == True,
           f"logs={saved[0].get('logs') if saved else None}")
        rec_label = await pg.evaluate("() => (document.querySelector('.fusion-rec-label')||{}).textContent || ''")
        ok("完成后焦点卡回显「今天做了什么」", "今天做了什么" in rec_label, f"label={rec_label!r}")
        edit_btn = await pg.evaluate("() => !!document.querySelector('.fusion-edit')")
        ok("完成后可点「改一句」修订", edit_btn)
        # 修订：点「改一句」→ 改文案 → 保存，确保同天不重复计数
        await pg.evaluate("() => { document.querySelector('.fusion-edit').click(); }")
        await pg.wait_for_timeout(150)
        await pg.evaluate("() => { document.getElementById('fusionInput').value = '其实是有点费劲，但还是做了'; }")
        await pg.evaluate("() => { document.getElementById('fusionBtn').click(); }")
        await pg.wait_for_timeout(300)
        saved2 = await pg.evaluate("() => JSON.parse(localStorage.getItem('trf_actions') || '[]')")
        ok("修订后当天仍只有一条记录（不重复计数）", len(saved2) == 1 and len(saved2[0]['logs']) == 1,
           f"logs={saved2[0].get('logs') if saved2 else None}")

        # === 3.5 行为改变旅程（David 六步对齐） ===
        # ⑥ 进展衡量：改为自动性方向（不再用「连续 N 天/百分比」假度量）
        measure = await pg.evaluate("() => (document.querySelector('.ck-measure')||{}).textContent || ''")
        ok("衡量行改为自动性方向（无连续/百分比）", ("不用想就会做" in measure) and ("%" not in measure) and ("连续" not in measure), f"measure={measure!r}")

        # 执行态不再有「去完整行动页」出口（与底部「帮我改变」重复）
        body_all = await pg.evaluate("() => document.body.innerText")
        ok("执行态无「去完整行动页」重复出口", "去完整行动页" not in body_all)

        # ①③④ 拆解卡：三段式路线（看清→替代→焊入）+ 锚点用户单独定义，一屏可见
        await pg.evaluate("""() => {
          draft.goal = '成为行业专家';
          draft.rawGoal = '成为行业专家';
          draft.micro = '读一段行业文档';
          draft.steps = ['打开文档', '读一段', '记一句'];
          draft.days = ['读一段行业文档', '写下一条收获', '对比昨天预期', '读一段行业文档', '写下一条收获', '对比昨天预期', '写下一条收获'];
          draft.planLength = 7;
          draft.anchors = ['在我早饭后', '在我刷完牙后'];
          draft.anchor = '';
          draft.rationale = '先从每天 30 秒的输入开始';
          draft.route = ['看清行业知识里的空档', '每天读一段行业文档', '焊进每天打开电脑之后'];
          draft.isComplex = true;
          draft.focus = '最近一周每天读一段行业文档';
          draft.focusReason = '大目标拆不到每天，先聚焦可每天动手的一件小事';
          renderPlanDraft();
        }""")
        await pg.wait_for_timeout(200)
        steps = await pg.evaluate("() => Array.from(document.querySelectorAll('.sc-route-step')).map(e => e.textContent)")
        ok("拆解卡展示三段式路线（3 段）", len(steps) == 3, f"steps={steps!r}")
        title = await pg.evaluate("() => (document.querySelector('.sc-title')||{}).textContent || ''")
        ok("拆解卡标题体现「可以这样走」", "可以这样走" in title, f"title={title!r}")
        ok("拆解卡无「去完整行动页」", "去完整行动页" not in await pg.evaluate("() => document.body.innerText"))
        btn_ok = await pg.evaluate("() => { const b = document.getElementById('stageConfirmBtn'); return b && b.disabled; }")
        ok("拆解卡锚点未定义时按钮禁用（等用户单独定义）", btn_ok)

        # === 4. 无 JS 错误 ===
        ok("全程无 JS 错误", len(errors) == 0, f"errors={errors}")

        await browser.close()

    print(f"\n结果：{PASS} 通过 / {FAIL} 失败")
    if FAIL:
        raise SystemExit(1)

asyncio.run(main())
