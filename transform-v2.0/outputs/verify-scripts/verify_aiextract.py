#!/usr/bin/env python3
# verify_aiextract.py — AI 提取信息点解析层兼容路径验证（覆盖 aiCall，零 AI 消耗）
import asyncio, json, pathlib, sys
from playwright.async_api import async_playwright

BASE = pathlib.Path(__file__).resolve().parents[2]
URL = BASE.joinpath('app.html').as_uri()
results = []
def chk(name, ok, extra=''):
    results.append((name, ok, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' | ' + str(extra) if extra else ''))

async def run_case(pg, label, mock_reply, expect_notes_min, expect_msg_has=None, pre_notes=0):
    # 清空便签
    await pg.evaluate(f"""() => {{
      state.data.notes = [];
      for (let i=0;i<{pre_notes};i++) state.data.notes.push({{id:'seed'+i, source:'观察', text:'种子便签'+i}});
      state.data.scenario = '测试场景：我要从培训师转型做 AI 产品';
    }}""")
    await pg.evaluate(f"window.__mockReply = {json.dumps(mock_reply, ensure_ascii=False)}")
    await pg.evaluate("window.aiCall = async () => window.__mockReply")
    await pg.evaluate("aiExtract()")
    await pg.wait_for_timeout(400)
    notes = await pg.evaluate("state.data.notes.map(n => n.text)")
    msg = await pg.evaluate("document.getElementById('aiExtractResult').textContent")
    added = len(notes) - pre_notes
    ok = added >= expect_notes_min
    if expect_msg_has:
        ok = ok and expect_msg_has in msg
    chk(label, ok, f'added={added} msg={msg[:60]!r}')
    return notes

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome')
        ctx = await browser.new_context()
        await ctx.add_init_script("try{localStorage.setItem('trf_onboarded','1');localStorage.setItem('trf_onboarded_act','1');}catch(e){}")
        pg = await ctx.new_page()
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        await pg.goto(URL, wait_until='networkidle')
        await pg.wait_for_timeout(300)

        # 1. 半角冒号（原实现直接归零的主因）
        await run_case(pg, '半角冒号', '观察: 用户收到很多重复简历\n事实: 岗位要求 3 年经验\n猜测: 用户担心薪资下降', 3)
        # 2. 编号 + 全角冒号
        await run_case(pg, '编号行', '1. 观察：简历数量大\n2、事实：市场收缩\n3. 猜测：AI 会替代初级工作', 3)
        # 3. markdown 围栏 + 加粗
        await run_case(pg, '围栏+加粗', '```text\n- **观察**：投递量翻倍\n- **事实**：预算削减\n```', 2)
        # 4. 格式回显行必须被过滤（截图中的垃圾便签来源）
        n = await run_case(pg, '格式回显被过滤',
            '收到后我会按这样输出：\n- 观察: …………\n- 事实: …………\n观察: 真实有效的一条信息', 1)
        assert all('收到后' not in x and '……' not in x for x in n), '回显/占位行泄漏'
        chk('回显行未混入便签', True)
        # 5. 完全无法解析 → 显示原文兜底，不静默归零
        await run_case(pg, '失败兜底显示原文', '这是一段完全无法按格式解析的话', 0, expect_msg_has='原文')
        # 6. 无页面 JS 报错
        chk('无页面 JS 报错', not errors, errors[:2])

        total = sum(1 for _, ok, _ in results if ok)
        print(f'==== {total}/{len(results)} PASS ====')
        await browser.close()
        sys.exit(0 if total == len(results) else 1)

asyncio.run(main())
