import asyncio, os
from playwright.async_api import async_playwright
BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
OUT  = "/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0/outputs/ux-audit-2026-09-15"
os.makedirs(OUT, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width":1440,"height":900})
        await pg.goto(BASE + "/index.html")
        await pg.evaluate("() => localStorage.clear()")

        # ① 首页「继续上次」
        await pg.evaluate("""() => {
            const now=Date.now(), day=86400000;
            localStorage.setItem('trf_actions', JSON.stringify([{id:'e1', input:'每天晚上读一段 AI 产品材料并写一句判断',
              status:'active', targetDays:7, currentDay:4, totalDone:3, streak:3,
              plan:[{day:4,micro:'读一段 AI 产品材料并写一句判断',sub:[],subDone:[]}],
              logs:[{day:1,date:new Date(now-2*day).toISOString(),done:true}],
              anchor:{after:'我吃完午饭后'}, createdAt:new Date(now-4*day).toISOString()}]));
        }""")
        await pg.goto(BASE + "/index.html"); await pg.wait_for_timeout(700)
        await pg.screenshot(path=os.path.join(OUT,"fix1_index_resume.png"))

        # ①b 空状态不出现
        await pg.evaluate("() => localStorage.clear()")
        await pg.goto(BASE + "/index.html"); await pg.wait_for_timeout(600)
        await pg.screenshot(path=os.path.join(OUT,"fix1b_index_empty_no_resume.png"))

        # ② app.html 无右侧浮卡
        await pg.goto(BASE + "/app.html"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=os.path.join(OUT,"fix2_app_no_aside.png"))

        # ③ 第 N 步 位置提示（裁到步骤导航区）
        el = await pg.query_selector(".p-node.active, .stepsBar, .step-eyebrow")
        if el:
            await el.screenshot(path=os.path.join(OUT,"fix3_app_step_number.png"))
        await b.close()
    print("saved:", sorted(os.listdir(OUT)))
asyncio.run(main())
