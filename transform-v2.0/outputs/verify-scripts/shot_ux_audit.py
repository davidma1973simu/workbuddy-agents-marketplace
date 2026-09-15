import asyncio, os
from playwright.async_api import async_playwright
BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
OUT = "/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0/outputs/ux-audit-2026-09-15"
SEED = open(os.path.join(os.path.dirname(__file__),'audit_ux_report.py'),encoding='utf-8').read().split('SEED = r"""')[1].split('"""')[0]

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width":1440,"height":900})
        await pg.goto(BASE + "/cognitive.html")
        await pg.evaluate("() => localStorage.clear()")
        await pg.evaluate(SEED)
        await pg.goto(BASE + "/app.html"); await pg.wait_for_timeout(900)
        await pg.screenshot(path=os.path.join(OUT,"gap1_app_aside.png"))
        await pg.goto(BASE + "/index.html"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=os.path.join(OUT,"gap2_index_no_resume.png"))
        await b.close()
    print("saved:", os.listdir(OUT))
asyncio.run(main())
