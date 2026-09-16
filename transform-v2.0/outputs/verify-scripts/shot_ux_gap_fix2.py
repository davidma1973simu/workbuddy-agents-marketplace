import asyncio, os
from playwright.async_api import async_playwright
BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
OUT  = "/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0/outputs/ux-audit-2026-09-15"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width":1440,"height":900})
        await pg.goto(BASE + "/app.html")
        await pg.evaluate("""() => {
            localStorage.clear();
            localStorage.setItem('trf_onboarded', '1');
            localStorage.setItem('trf_profile', JSON.stringify({identityStatements:[]}));
        }""")
        await pg.goto(BASE + "/app.html"); await pg.wait_for_timeout(900)
        await pg.screenshot(path=os.path.join(OUT,"fix2_app_no_aside.png"))
        el = await pg.query_selector(".step-eyebrow")
        if el:
            await pg.evaluate("() => document.querySelector('.step-eyebrow').scrollIntoView({block:'center'})")
            await pg.wait_for_timeout(200)
            await el.screenshot(path=os.path.join(OUT,"fix3_app_step_number.png"))
        # 顺带截第 3 步（点击侧导航）
        await pg.evaluate("""() => {
            const nodes = document.querySelectorAll('.p-node');
            if (nodes[2]) nodes[2].click();
        }"""); await pg.wait_for_timeout(700)
        el3 = await pg.query_selector(".step-eyebrow")
        if el3:
            await el3.screenshot(path=os.path.join(OUT,"fix3b_app_step3_number.png"))
        await b.close()
    print("ok")
asyncio.run(main())
