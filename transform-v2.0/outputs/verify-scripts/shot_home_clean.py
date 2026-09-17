import asyncio, os
from playwright.async_api import async_playwright
BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
OUT  = "/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0/outputs/home-clean-2026-09-17"
os.makedirs(OUT, exist_ok=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width":1440,"height":900})
        await pg.goto(BASE + "/index.html")
        await pg.evaluate("() => localStorage.clear()")
        await pg.goto(BASE + "/index.html"); await pg.wait_for_timeout(700)
        await pg.screenshot(path=os.path.join(OUT,"clean_1440.png"))
        pg2 = await b.new_page(viewport={"width":375,"height":812})
        await pg2.goto(BASE + "/index.html"); await pg2.wait_for_timeout(600)
        await pg2.screenshot(path=os.path.join(OUT,"clean_375.png"), full_page=True)
        hscroll = await pg2.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
        print("375px 横向滚动:", hscroll)
        await b.close()
    print("saved:", sorted(os.listdir(OUT)))
asyncio.run(main())
