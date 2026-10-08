import sys, json
from playwright.sync_api import sync_playwright

BASE = "file:///Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0"
results = []

def check(name, ok, extra=""):
    results.append((name, ok, extra))
    print(("PASS " if ok else "FAIL ") + name + (("  -> " + extra) if extra else ""))

SEED = {
    "trf_actions": json.dumps([{
        "id": "a_test_1", "input": "每天下班前同步一次进度", "targetDays": 7,
        "currentDay": 1, "status": "active", "streak": 0, "totalDone": 0,
        "bestStreak": 0, "anchor": {"after": "在我吃完晚饭后"}, "identity": "",
        "plan": [{"day": d, "micro": "下班前同步进度", "sub": [], "subDone": []} for d in range(1, 8)],
        "logs": [], "source": "punch", "createdAt": "2026-09-30T00:00:00.000Z"
    }])
}

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    pg = b.new_page()
    pg.add_init_script("localStorage.setItem('trf_actions', " + json.dumps(SEED["trf_actions"]) + ");")
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.goto(BASE + "/punch.html")

    # 1. 清单今日行存在
    pg.wait_for_selector("#ck-day-1", timeout=8000)
    check("清单今日行 Day1 渲染", pg.query_selector("#ck-day-1") is not None)

    # 2. 旧版独立庆祝卡容器已不存在
    check("旧独立庆祝卡 todayFeedbackWrap 已移除", pg.query_selector("#todayFeedbackWrap") is None)

    # 3. 写一句做了什么，点完成
    note = pg.query_selector("#ckNote")
    note.fill("下班前把进度发到了群里")
    pg.click("#ckDoBtn")
    pg.wait_for_timeout(600)

    # 4. 当天行就地展开（open）
    row = pg.query_selector("#ck-day-1")
    check("完成后当天行展开(open)", row is not None and row.get_attribute("open") is not None)

    # 5. 祝贺块出现在当天行内（ckCongBody 在 ck-day-1 内部）
    cong = pg.query_selector("#ck-day-1 #ckCongBody")
    check("祝贺反馈在清单当天行内(ckCongBody 在 ck-day-1 内)", cong is not None)
    # 确认它的祖先是 ck-day-1
    if cong:
        anc = pg.evaluate("(el)=>{let n=el; while(n && n.id!=='ck-day-1'){n=n.parentElement;} return !!n;}", cong)
        check("ckCongBody 祖先确为当天行 ck-day-1", anc)

    # 6. 祝贺可折叠（是 <details> 且 summary 文案）
    sum_txt = pg.evaluate("()=>{const s=document.querySelector('#ck-day-1 .ck-cong-sum'); return s? s.textContent.trim():'';}")
    check("祝贺折叠头文案=今天做到啦", "今天做到啦" in (sum_txt or ""), sum_txt)

    # 7. 标题/证据/见证句已填充
    title = pg.evaluate("()=>{const e=document.querySelector('#ck-day-1 .ck-cong-title'); return e? e.textContent:'';}")
    check("祝贺标题(首次完成=今天的行为实验开始了)", ("第 1 天做到了" in (title or "")) or ("今天的行为实验开始了" in (title or "")), title)
    wit = pg.evaluate("()=>{const e=document.querySelector('#ck-day-1 .ck-cong-wit'); return e? e.textContent:'';}")
    check("身份见证句已填充", bool(wit), (wit or "")[:30])

    # 8. 无 JS 报错
    check("无 JS 运行时错误", len(errors) == 0, "; ".join(errors[:3]))

    b.close()

failed = [r for r in results if not r[1]]
print("\n==== %d/%d passed ====" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
