# -*- coding: utf-8 -*-
"""批次修复针对性验证（仓库版）：P0-3 / P0-2 / P1-1 / P1-7 / P1-8 / P1-14 / P2-3 + cognitive 模式区补齐"""
import asyncio, json, sys
from playwright.async_api import async_playwright

BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0/"
results = []

def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + (("  -> " + detail) if (detail and not ok) else ""))

async def fresh_page(browser, url, clear_keys):
    ctx = await browser.new_context()
    page = await ctx.new_page()
    await page.goto(url)
    await page.evaluate("(keys) => keys.forEach(k => localStorage.removeItem(k))", clear_keys)
    await page.reload()
    return ctx, page

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="chrome", headless=True)

        # ---------- punch.html ----------
        ctx, pg = await fresh_page(browser, BASE + "punch.html", ["trf_actions", "trf_profile", "trf_archive"])

        # P2-3：全新态不再渲染第二套同义引导（不可达空态已删）
        body = await pg.evaluate("document.body.innerText")
        check("P2-3 punch 全新态无重复引导（不可达空态已删）", "还没有开始一次改变" not in body)
        check("P2-3 punch 全新态仍显示创建卡", "先写下想改变的那一件小事" in body)

        # P0-3：进入定锚点步，锚点自动选中后按钮立刻可用
        await pg.evaluate("""() => {
          draft.micro = '测试微行动';
          draft.steps = ['子步骤一', '子步骤二'];
          draft.days = ['第一天动作', '第二天动作', '第三天动作'];
          draft.planLength = 7;
          draft.anchors = [];
          goTodayDraft();
        }""")
        btn_disabled = await pg.evaluate("() => { const b = document.getElementById('stageConfirmBtn'); return b ? b.disabled : null; }")
        btn_text = await pg.evaluate("() => (document.getElementById('stageConfirmBtn')||{}).textContent || ''")
        sel_count = await pg.evaluate("document.querySelectorAll('.anchor-key.sel').length")
        fb = await pg.evaluate("() => (document.getElementById('anchorFeedback')||{}).textContent || ''")
        check("P0-3 自动选中锚点后按钮立即可用", btn_disabled is False, f"disabled={btn_disabled}")
        check("P0-3 按钮文案为开始改变", "改变 →" in btn_text, btn_text)
        check("P0-3 第一个锚点 chip 高亮", sel_count == 1, f"sel={sel_count}")
        check("P0-3 反馈文案已更新", "之后做" in fb, fb)

        # P1-7 punch：anchorText 剥离（含「我」）
        sa = await pg.evaluate("""() => [anchorText('在我早上拿起手机之后'), anchorText('在吃完午饭后'), anchorText('睡前')]""")
        check("P1-7 punch anchorText 剥离前后缀", sa == ["早上拿起手机", "吃完午饭", "睡前"], str(sa))

        # P1-8：AI 计划不足 N 天时补齐
        await pg.evaluate("""async () => {
          draft.anchor = '在我晚上睡前';
          startExperiment();
        }""")
        await pg.wait_for_timeout(300)
        plan_len = await pg.evaluate("current && current.plan ? current.plan.length : 0")
        fill_micro = await pg.evaluate("(current && current.plan && current.plan[6]) ? current.plan[6].micro : ''")
        anchor_after = await pg.evaluate("(current && current.anchor) ? current.anchor.after : ''")
        check("P1-8 plan 补齐到 7 天", plan_len == 7, f"plan.length={plan_len}")
        check("P1-8 补齐天用兜底文案", "继续完成" in fill_micro, fill_micro)
        check("P1-8 锚点完整句入库（展示层剥离）", anchor_after == "在我晚上睡前", anchor_after)
        await ctx.close()

        # ---------- behavior.html ----------
        ctx, pg = await fresh_page(browser, BASE + "behavior.html", ["trf_patterns", "trf_actions"])
        mock_patterns = json.dumps({"patterns": [
            {"title": "模式A", "evidence": "证据A", "insight": "建议A"},
            {"title": "模式B", "evidence": "证据B", "insight": "建议B"}]}, ensure_ascii=False)
        await pg.evaluate("(t) => { window.aiCall = async () => t; }", mock_patterns)
        await pg.evaluate("async () => { await aiDiscoverPatterns(false); }")
        await pg.wait_for_timeout(300)
        cnt = await pg.evaluate("() => (document.getElementById('patternsCount')||{}).textContent || ''")
        cards = await pg.evaluate("document.querySelectorAll('#patternArea .pattern').length")
        raw_dump = await pg.evaluate("() => (document.getElementById('patternArea')||{}).innerText || ''")
        check("P0-2 behavior 模式生成后无异常", cards == 2, f"cards={cards}")
        check("P0-2 behavior 计数徽章更新", cnt == "2", cnt)
        check("P0-2 behavior catch 未误渲染原始 JSON", '{"patterns"' not in raw_dump)
        # P1-7 behavior：anchorText + 资产卡锚点
        ok7b = await pg.evaluate("""() => {
          const el = document.createElement('div');
          const a = { anchor: { after: '在我早上拿起手机之后' } };
          el.innerHTML = `<div class="anchor">锚点：在我 ${escapeHtml(anchorText(a.anchor.after))} 之后</div>`;
          return el.textContent;
        }""")
        check("P1-7 behavior 锚点展示剥离", ok7b.strip() == "锚点：在我 早上拿起手机 之后", ok7b)
        await ctx.close()

        # ---------- cognitive.html ----------
        ctx, pg = await fresh_page(browser, BASE + "cognitive.html", ["trf_patterns", "trf_actions", "trf_archive"])
        has_area = await pg.evaluate("!!document.getElementById('patternArea') && !!document.getElementById('patternsCount')")
        check("P0-2 cognitive 模式区容器已补齐", has_area)
        await pg.evaluate("(t) => { window.aiCall = async () => t; }", mock_patterns)
        await pg.evaluate("async () => { await aiDiscoverPatterns(false); }")
        await pg.wait_for_timeout(300)
        cards = await pg.evaluate("document.querySelectorAll('#patternArea .pattern').length")
        cnt = await pg.evaluate("() => (document.getElementById('patternsCount')||{}).textContent || ''")
        check("P0-2 cognitive 模式可正常生成渲染", cards == 2, f"cards={cards}")
        check("P0-2 cognitive 计数徽章更新", cnt == "2", cnt)
        await ctx.close()

        # ---------- app.html ----------
        ctx = await browser.new_context()
        pg = await ctx.new_page()
        await pg.goto(BASE + "app.html")
        await pg.evaluate("""() => {
          localStorage.setItem('trf_session_draft', JSON.stringify({
            insightQuestions: ['q1','q2','q3'],
            insightAnswers: ['a1']
          }));
        }""")
        await pg.reload()
        ans = await pg.evaluate("[state.data.insightQuestions.length, state.data.insightAnswers.length, state.data.insightAnswers[1]]")
        check("P1-14 旧草稿答案自动补齐", ans == [3, 3, ""], str(ans))
        xss = await pg.evaluate("""() => {
          const obj = ensureAppScenario('near');
          obj.title = '<img src=x onerror=alert(1)>';
          obj.details = { people: '<b>坏人</b>', goal: '<script>alert(2)</script>' };
          updateAppContext('near');
          const el = document.getElementById('appNearContext');
          return { html: el.innerHTML, imgs: el.querySelectorAll('img').length, scripts: el.querySelectorAll('script').length };
        }""")
        check("P1-1 app 场景标题/相关人/目标已转义", xss["imgs"] == 0 and xss["scripts"] == 0 and "&lt;img" in xss["html"], xss["html"][:120])
        await ctx.close()

        # ---------- act.html ----------
        ctx = await browser.new_context()
        pg = await ctx.new_page()
        await pg.goto(BASE + "act.html")
        r = await pg.evaluate("""() => {
          const s1 = anchorText('在我早上拿起手机之后');
          current = { anchor: { after: '在我早上拿起手机之后' } };
          updateAside('dashboard');
          const t = document.getElementById('asideAnchor').textContent || '';
          return { s1, t };
        }""")
        check("P1-7 act anchorText 生效", r["s1"] == "早上拿起手机", r["s1"])
        check("P1-7 act 侧栏锚点不双包裹", "在我 在我" not in r["t"] and "手机之后 之后" not in r["t"], r["t"])
        await ctx.close()

        await browser.close()

    fails = [r for r in results if not r[1]]
    print(f"\n===== {len(results) - len(fails)}/{len(results)} passed =====")
    sys.exit(1 if fails else 0)

asyncio.run(main())
