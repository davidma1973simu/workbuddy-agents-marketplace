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

        # 焦点卡显示今天的小步 + 我做到了按钮
        btn_txt = await pg.evaluate("() => (document.getElementById('ckDoBtn')||{}).textContent || ''")
        ok("焦点卡有「我做到了」按钮", "我做到了" in btn_txt, f"btn={btn_txt!r}")

        # 未来清单折叠
        rest_sum = await pg.evaluate("() => (document.querySelector('.ck-rest-sum')||{}).textContent || ''")
        ok("未来 6 天折叠成「还有 N 天」", "还有" in rest_sum or "已走完" in rest_sum, f"rest={rest_sum!r}")

        # 锚点只展示一次（不应有 ck-anchor-tip 重复 + ck-anchor-tag 双重）
        anchor_tag = await pg.evaluate("() => (document.querySelector('.ck-anchor-tag')||{}).textContent || ''")
        ok("锚点展示一次（任务头）", "锚点" in anchor_tag, f"tag={anchor_tag!r}")

        # === 3. 轻认领流程 ===
        await pg.evaluate("() => { document.getElementById('ckDoBtn').click(); }")
        await pg.wait_for_timeout(200)
        claim_visible = await pg.evaluate("() => { const c = document.getElementById('ckClaim'); return c && c.style.display === 'block'; }")
        ok("点我做到了 → 弹轻确认", claim_visible)

        guess = await pg.evaluate("() => (document.querySelector('.ck-claim-guess')||{}).textContent || ''")
        ok("轻确认有系统猜测句", guess.strip() != "", f"guess={guess!r}")

        # 点「对，就是这件事」
        await pg.evaluate("() => { const b = [...document.querySelectorAll('.ck-claim-actions .ck-do')].find(x => x.textContent.includes('就是这件事')); if(b) b.click(); }")
        await pg.wait_for_timeout(300)

        # 验证完成已落库 + 焦点卡变成「今天已完成」
        done_state = await pg.evaluate("() => { const c = document.querySelector('.ck-tf-done'); return c ? c.textContent : ''; }")
        ok("完成后焦点卡变「今天已完成」", "今天已经完成" in done_state, f"done={done_state!r}")

        saved = await pg.evaluate("() => JSON.parse(localStorage.getItem('trf_actions') || '[]')")
        ok("完成已写入日志", len(saved) == 1 and len(saved[0]['logs']) == 1 and saved[0]['logs'][0]['done'] == True,
           f"logs={saved[0].get('logs') if saved else None}")

        # === 3.5 行为改变旅程（David 六步对齐） ===
        # ⑥ 进展衡量：连续天数 + 百分比
        measure = await pg.evaluate("() => (document.querySelector('.ck-measure')||{}).textContent || ''")
        ok("执行态有进展衡量行（连续/百分比）", "连续" in measure and "%" in measure, f"measure={measure!r}")

        # 执行态不再有「去完整行动页」出口（与底部「帮我改变」重复）
        body_all = await pg.evaluate("() => document.body.innerText")
        ok("执行态无「去完整行动页」重复出口", "去完整行动页" not in body_all)

        # ①③④ 拆解卡：大目标 → 聚焦 → 今天一小步 → 锚点 → 路线，一屏可见
        await pg.evaluate("""() => {
          draft.goal = '成为行业专家';
          draft.rawGoal = '成为行业专家';
          draft.micro = '读一段行业文档';
          draft.steps = ['打开文档', '读一段', '记一句'];
          draft.days = ['读一段行业文档', '写下一条收获', '对比昨天预期', '读一段行业文档', '写下一条收获', '对比昨天预期', '写下一条收获'];
          draft.planLength = 7;
          draft.anchors = ['在我早上打开电脑之后', '在我吃完午饭后'];
          draft.anchor = '';
          draft.rationale = '先从每天 30 秒的输入开始';
          draft.isComplex = true;
          draft.focus = '最近一周每天读一段行业文档';
          draft.focusReason = '大目标拆不到每天，先聚焦可每天动手的一件小事';
          renderPlanDraft();
        }""")
        await pg.wait_for_timeout(200)
        narrow = await pg.evaluate("() => (document.querySelector('.sc-narrow-v')||{}).textContent || ''")
        ok("拆解卡展示大目标收窄（聚焦处境）", "行业文档" in narrow, f"narrow={narrow!r}")
        title = await pg.evaluate("() => (document.querySelector('.sc-title')||{}).textContent || ''")
        ok("拆解卡标题体现「拆成小行为」", "拆成" in title, f"title={title!r}")
        ok("拆解卡无「去完整行动页」", "去完整行动页" not in await pg.evaluate("() => document.body.innerText"))
        btn_ok = await pg.evaluate("() => { const b = document.getElementById('stageConfirmBtn'); return b && !b.disabled; }")
        ok("拆解卡锚点默认选中即开可点", btn_ok)

        # === 4. 无 JS 错误 ===
        ok("全程无 JS 错误", len(errors) == 0, f"errors={errors}")

        await browser.close()

    print(f"\n结果：{PASS} 通过 / {FAIL} 失败")
    if FAIL:
        raise SystemExit(1)

asyncio.run(main())
