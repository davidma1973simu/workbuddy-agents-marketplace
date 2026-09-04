import subprocess, threading, time, os, signal, sys
from playwright.sync_api import sync_playwright

ROOT = "/Users/davidma/WorkBuddy/transform"
PORT = 8766
BASE = f"http://localhost:{PORT}/"

def start_server():
    p = subprocess.Popen(["/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3",
                          "-m", "http.server", str(PORT)],
                         cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return p

srv = start_server()
time.sleep(1.2)

errors = []
def on_page_error(page, err):
    errors.append(f"[JS ERROR] {page.url}: {err}")

def on_console(page, msg):
    if msg.type == "error":
        errors.append(f"[CONSOLE] {page.url}: {msg.text}")

results = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context()
    ctx.on("page", lambda pg: pg.add_init_script("try{localStorage.clear();}catch(e){}"))
    page = ctx.new_page()
    page.on("pageerror", lambda e: on_page_error(page, e))
    page.on("console", lambda m: on_console(page, m))

    # 1. index.html nav links -> cognitive / behavior
    page.goto(BASE + "index.html", wait_until="networkidle")
    page.click('a[href="cognitive.html"]', timeout=5000)
    page.wait_for_url("**/cognitive.html", timeout=5000)
    results.append(("index->cognitive nav", page.url.endswith("cognitive.html")))
    # cognitive content present
    has_models = page.query_selector(".fold-card") is not None or page.query_selector("#modelList") is not None
    results.append(("cognitive renders content", has_models))

    page.goto(BASE + "index.html", wait_until="networkidle")
    page.click('a[href="behavior.html"]', timeout=5000)
    page.wait_for_url("**/behavior.html", timeout=5000)
    results.append(("index->behavior nav", page.url.endswith("behavior.html")))
    has_exp = page.query_selector(".fold-card") is not None or page.query_selector("#actionList") is not None
    results.append(("behavior renders content", has_exp))

    # 2. growth.html redirect -> cognitive.html
    page.goto(BASE + "growth.html", wait_until="networkidle")
    time.sleep(1.0)
    results.append(("growth redirects to cognitive", "cognitive.html" in page.url))

    # 3. punch.html daily execution flow
    page.goto(BASE + "punch.html", wait_until="networkidle")
    # Stage 1: need a goal to start; try to find an input/button to begin
    # click the primary CTA "开始一次行为改变" if present, else look for start
    try:
        # there should be a start button to create a change; click first primary btn
        page.click('.btn-primary', timeout=4000)
    except Exception as e:
        results.append(("punch stage1 start", f"ERR {e}"))
    time.sleep(0.6)
    # If an input appears (goal), fill it
    goal = page.query_selector('#goalInput, #changeInput, input[placeholder*="改变"], textarea')
    if goal:
        goal.fill("每天喝够水")
        # click a confirm/generate button
        for sel in ['.btn-next', '.btn-primary', 'button:has-text("生成")', 'button:has-text("建议")']:
            try:
                page.click(sel, timeout=2000); break
            except: pass
        time.sleep(1.0)
    # try to advance through stages until stage 2 visible
    for _ in range(6):
        # click any "开始"/"下一步"/"确认" primary button that isn't disabled
        btns = page.query_selector_all('button:not([disabled])')
        clicked = False
        for b in btns:
            txt = (b.inner_text() or "")
            if any(k in txt for k in ["开始", "下一步", "确认", "建议", "生成", "拆解"]):
                try:
                    b.click(timeout=1500); clicked = True; break
                except: pass
        if not clicked:
            break
        time.sleep(0.8)
        # check if stage 2 (anchor) visible
        if page.query_selector('#anchorGrid, #anchorChips'):
            break

    # Now verify stage 2 state
    has_anchor = page.query_selector('#anchorGrid, #anchorChips') is not None
    has_steps = page.query_selector('#stepList, #stepChips') is not None
    # plain list = step items should NOT have onclick toggleStep and should show numbers
    step_no = page.query_selector('.step-no')
    has_numbered = step_no is not None
    btn = page.query_selector('#stageConfirmBtn, .cta-confirm')
    btn_text = (btn.inner_text() if btn else "")
    results.append(("punch stage2 anchor visible", has_anchor))
    results.append(("punch stage2 steps list visible", has_steps))
    results.append(("punch steps are numbered plain list", has_numbered))
    results.append(("punch stage2 button = start experiment", "开始今日的行为实验" in btn_text or "Start today" in btn_text))

    browser.close()

srv.terminate()
print("=== RESULTS ===")
for name, ok in results:
    print(f"{'PASS' if ok else 'FAIL'}  {name}")
print("=== JS ERRORS ===")
if errors:
    for e in errors: print(e)
else:
    print("none")
